/**
 * POST /api/demo/scan
 *
 * AUFTRAG-112: zwei Stufen, das URL-Feld ist das Tor.
 * - Body {url} → Stufe 1 «Vorprüfung»: formale Prüfung → Inhaltsfilter Stufe A (Sperrliste, ohne Netz,
 *   vor dem Limit) → Limit-Prüfung (zählt den Versuch) → Inhaltsfilter Stufe B (Cloudflare for Families)
 *   → Vorprüfung (Startseite + höchstens 2 Impressum-Seiten, lib/demo/scanner.ts `vorpruefung`).
 *   Gesperrt → 422 MELDUNG.urlInhalt, kein Abruf, kein Scan-Datensatz. Antwort NUR
 *   {scan_id, stufe: 'vorpruefung', host, schritte: [website]} — keine Logos, Farben, Funde, kein Profil.
 * - Body {scan_id} → Stufe 2 «Vollscan»: Scan vorhanden und freigegeben (sonst 404) → schon `voll`:
 *   Antwort aus dem Datensatz (kein neuer Abruf) → gültiger Handelsregister-Nachweis (sonst 403 wie
 *   POST /api/demo/anruf; Schalter DEMO_HANDELSREGISTER=aus: ohne Nachweis) → `scanneWebsite` (Budget
 *   8 s) → Regel-Profil → Datensatz unter derselben scan_id auf `voll` aktualisiert → Antwort wie bisher
 *   {scan_id, schritte, profil, profil_quelle, assistent_weiblich, logos, farb_signale, funde, dauer_ms}.
 *   Kein zweiter Limit-Verbrauch. Eine gleichzeitige zweite Anfrage wartet auf den laufenden Vollscan.
 * - Beide Felder zugleich → 400.
 *
 * Bisher (AUFTRAG-092/095/096/103): Das KI-Profil baut danach POST /api/demo/profil (eigener Aufruf,
 * damit jede Function deutlich unter dem Netlify-Limit von 26 s bleibt). `logos` (geprüft) und `funde`
 * (echte Werte für die Scan-Schritte der Oberfläche). Gerätekennung (Cookie `demo_geraet`, signiert) —
 * fehlt sie oder ist die Signatur ungültig, setzt diese Antwort eine neue. Limits je Gerät und je Adresse.
 */
import { antwort, clientIp, fehler, leseJson, MELDUNG } from '@/lib/demo/api';
import { normalisiereEingabe, scanneWebsite, ScanFehler, vorpruefung } from '@/lib/demo/scanner';
import { regelProfil, vorpruefungsProfil } from '@/lib/demo/profil';
import { pseudonyme, scanErlaubt } from '@/lib/demo/limits';
import { geraetAusAnfrage, mitGeraetCookie } from '@/lib/demo/geraet';
import { leseScan, neueScanId, scanStufe, speichereNeuenScan, speichereScan, type ScanMitVersuchen } from '@/lib/demo/scans';
import { gueltigeLogos, logoFuerKarte, logoUrlFuerProfil } from '@/lib/demo/logo';
import { formatiereNummer } from '@/lib/demo/nummer';
import { pruefeHostFreigabe, pruefeSperrliste, scanFreigegeben } from '@/lib/demo/sperrliste';
import { nachweisFuerAnruf, type AnrufNachweis } from '@/lib/demo/handelsregister';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 26;

function scanFehlerAntwort(e: unknown): Response {
    if (e instanceof ScanFehler) {
        if (e.code === 'eingabe') return fehler(MELDUNG.urlUngueltig, 400);
        if (e.code === 'gesperrt') return fehler(MELDUNG.urlGesperrt, 422);
        // AUFTRAG-112: Inhaltsfilter (auch nach einer Weiterleitung auf einen gesperrten Host)
        if (e.code === 'inhalt') return fehler(MELDUNG.urlInhalt, 422);
        if (e.code === 'status') return fehler(MELDUNG.status, 422);
        if (e.code === 'kein_html') return fehler(MELDUNG.keinHtml, 422);
        return fehler(MELDUNG.nichtErreichbar, 422);
    }
    console.error('[demo/scan] unerwarteter Fehler:', e instanceof Error ? e.message : e);
    return fehler(MELDUNG.allgemein, 500);
}

export async function POST(req: Request) {
    // AUFTRAG-103: Cookie mit der ersten Antwort setzen (jede Antwort dieser Route)
    const geraet = geraetAusAnfrage(req);
    return mitGeraetCookie(await scan(req, geraet.hash), geraet);
}

async function scan(req: Request, geraetHash: string): Promise<Response> {
    const body = await leseJson(req, 2_000);
    // AUFTRAG-112: {url} = Stufe 1, {scan_id} = Stufe 2, beides zugleich = 400
    if (body && body.url !== undefined && body.scan_id !== undefined) return fehler(MELDUNG.allgemein, 400);
    if (body && body.scan_id !== undefined) return stufeZwei(typeof body.scan_id === 'string' ? body.scan_id.slice(0, 40) : '');

    const url = typeof body?.url === 'string' ? body.url : '';
    let adresse: URL;
    try {
        adresse = normalisiereEingabe(url);
    } catch (e) {
        return scanFehlerAntwort(e);
    }

    // AUFTRAG-112, Stufe A: statische Sperrliste — kostet nichts, läuft vor dem Limit
    if (!pruefeSperrliste(adresse.hostname).ok) return fehler(MELDUNG.urlInhalt, 422);

    try {
        const limit = await scanErlaubt(pseudonyme({ ip: clientIp(req), geraetHash }));
        if (limit) return fehler(limit.meldung, 429);
    } catch (e) {
        console.error('[demo/scan] Limit-Prüfung fehlgeschlagen:', e instanceof Error ? e.message : e);
        return fehler(MELDUNG.allgemein, 500);
    }

    // AUFTRAG-112, Stufe B: Cloudflare for Families (zählt als Versuch; nicht erreichbar → durchlassen)
    if (!(await pruefeHostFreigabe(adresse.hostname)).ok) return fehler(MELDUNG.urlInhalt, 422);

    try {
        // AUFTRAG-112: Vorprüfung (Startseite + Impressum, Inhaltsfilter auf jedem Hop bis zum End-Host)
        const v = await vorpruefung(url);
        const gespeichert = await speichereNeuenScan({
            id: neueScanId(),
            stufe: 'vorpruefung',
            extrakt: v.extrakt,
            profil: vorpruefungsProfil(v.extrakt),
            profil_quelle: 'regeln',
            assistent_weiblich: true,
            schritte: v.schritte,
            dauer_ms: v.dauer_ms,
        });
        return antwort({
            scan_id: gespeichert.id,
            stufe: 'vorpruefung',
            host: v.extrakt.host,
            schritte: v.schritte.map(({ schluessel, ok }) => ({ schluessel, ok })),
        });
    } catch (e) {
        return scanFehlerAntwort(e);
    }
}

/* ------------------------------------------------------------------ */
/* Stufe 2: Vollscan nach der Bestätigung der Firma                    */
/* ------------------------------------------------------------------ */

/** Laufende Vollscans je Scan: eine gleichzeitige zweite Anfrage wartet, statt doppelt zu scannen. */
const laufend = new Map<string, Promise<ScanMitVersuchen>>();

async function stufeZwei(scanId: string): Promise<Response> {
    const scan = await leseScan(scanId);
    if (!scan || !scanFreigegeben(scan)) return fehler(MELDUNG.scanAbgelaufen, 404);
    // schon voll (auch Datensätze ohne Feld `stufe`): Antwort aus dem Datensatz, kein neuer Abruf
    if (scanStufe(scan) === 'voll') return antwort(vollAntwort(scan));

    // derselbe Nachweis wie für den Anruf (signiert, an Scan + UID + Bindung gebunden, 30 min)
    let hr: AnrufNachweis;
    try {
        hr = await nachweisFuerAnruf(scan);
    } catch (e) {
        console.error('[demo/scan] Handelsregister-Nachweis nicht lesbar:', e instanceof Error ? e.message : e);
        return fehler(MELDUNG.allgemein, 500);
    }
    if (!hr.ok) {
        console.info(`[demo/scan] vollscan abgewiesen: ${hr.code} scan=${scan.id.slice(0, 10)}`);
        return antwort({ fehler: hr.meldung, code: hr.code }, 403);
    }

    let p = laufend.get(scan.id);
    if (!p) {
        p = vollscan(scan).finally(() => laufend.delete(scan.id));
        laufend.set(scan.id, p);
    }
    try {
        return antwort(vollAntwort(await p));
    } catch (e) {
        return scanFehlerAntwort(e);
    }
}

/**
 * Vollscan wie bisher (Budget 8 s, Inhaltsfilter auf jedem Hop) und Datensatz unter derselben scan_id
 * auf `voll` aktualisieren. Die Felder der Vorprüfung `uid_kandidaten`/`bindung_text` bleiben, falls der
 * Vollscan sie nicht neu liefert; `start_url` bleibt die Eingabe des Besuchers.
 */
async function vollscan(alt: ScanMitVersuchen): Promise<ScanMitVersuchen> {
    const v = alt.extrakt;
    const s = await scanneWebsite(v.end_url || v.host);
    const x = s.extrakt;
    x.start_url = v.start_url || x.start_url;
    if (!x.uid_kandidaten?.length && v.uid_kandidaten?.length) x.uid_kandidaten = v.uid_kandidaten;
    if (!x.bindung_text && v.bindung_text) x.bindung_text = v.bindung_text;
    const logos = gueltigeLogos(x.logo_kandidaten);
    const bestes = logos[0] ?? null;
    const regel = regelProfil(x);
    // AUFTRAG-096: relativer Proxy-Pfad (kein Host in den Antworten)
    regel.profil.logo_url = logoUrlFuerProfil(bestes?.k ?? null, bestes?.index ?? 0, alt.id);
    const neu: ScanMitVersuchen = {
        ...alt,
        stufe: 'voll',
        extrakt: x,
        profil: regel.profil,
        profil_quelle: 'regeln',
        assistent_weiblich: regel.weiblich,
        schritte: s.schritte,
        dauer_ms: s.dauer_ms,
        profil_ms: null,
        ki_versuche: 0,
    };
    await speichereScan(neu);
    console.info(`[demo/scan] vollscan scan=${alt.id.slice(0, 10)} ms=${s.dauer_ms} seiten=${x.seiten.filter((z) => !z.fehler).length}`);
    return neu;
}

/** Antwort eines Vollscans (wie vor AUFTRAG-112), aus dem gespeicherten Datensatz. */
function vollAntwort(scan: ScanMitVersuchen) {
    const x = scan.extrakt;
    const logos = gueltigeLogos(x.logo_kandidaten);
    return {
        scan_id: scan.id,
        schritte: scan.schritte.map(({ schluessel, ok }) => ({ schluessel, ok })),
        profil: scan.profil,
        profil_quelle: scan.profil_quelle,
        assistent_weiblich: scan.assistent_weiblich,
        // AUFTRAG-096: geordnete Kandidaten (höchstens 4); die Karte prüft sie der Reihe nach im Browser (Sichtbarkeit)
        logos: logos.slice(0, 4).map(({ k, index }) => logoFuerKarte(k, index, scan.id)),
        // gewichtete Farbsignale: die Karte ergänzt die im Browser gemessene Logo-Farbe und wählt mit denselben Regeln
        farb_signale: x.farb_signale,
        funde: {
            seiten: x.seiten.filter((s) => !s.fehler).length,
            firma: scan.profil.firma,
            telefon: scan.profil.telefon ? formatiereNummer(scan.profil.telefon) : null,
            oeffnungszeiten: scan.profil.oeffnungszeiten_text,
            farbe: x.farben?.primaer ?? null,
            farbe_quelle: x.farbe_quelle,
            plattform: x.plattform,
            // AUFTRAG-102: erkannte Ansprechpersonen (Name/Rolle stehen im Profil)
            personen: scan.profil.personen?.length ?? 0,
        },
        dauer_ms: scan.dauer_ms,
    };
}
