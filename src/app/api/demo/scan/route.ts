/**
 * POST /api/demo/scan  Body {url} → {scan_id, schritte, profil, logo, funde, …}
 *
 * Stufe 1 von 2 (AUFTRAG-092): liest die Website (Budget 8 s) und liefert
 * sofort ein regelbasiertes Profil. Das KI-Profil baut danach
 * POST /api/demo/profil (eigener Aufruf, damit jede Function deutlich unter
 * dem Netlify-Limit von 26 s bleibt).
 *
 * AUFTRAG-095: `logo` (geprüft: Quelle, Format, Grösse, hell) und `funde`
 * (echte Werte für die Scan-Schritte der Oberfläche).
 */
import { antwort, clientIp, fehler, leseJson, MELDUNG } from '@/lib/demo/api';
import { normalisiereEingabe, scanneWebsite, ScanFehler } from '@/lib/demo/scanner';
import { regelProfil } from '@/lib/demo/profil';
import { scanErlaubt } from '@/lib/demo/limits';
import { neueScanId, speichereNeuenScan } from '@/lib/demo/scans';
import { gueltigeLogos, logoFuerKarte, logoUrlFuerProfil } from '@/lib/demo/logo';
import { formatiereNummer } from '@/lib/demo/nummer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 26;

function scanFehlerAntwort(e: unknown): Response {
    if (e instanceof ScanFehler) {
        if (e.code === 'eingabe') return fehler(MELDUNG.urlUngueltig, 400);
        if (e.code === 'gesperrt') return fehler(MELDUNG.urlGesperrt, 422);
        if (e.code === 'status') return fehler(MELDUNG.status, 422);
        if (e.code === 'kein_html') return fehler(MELDUNG.keinHtml, 422);
        return fehler(MELDUNG.nichtErreichbar, 422);
    }
    console.error('[demo/scan] unerwarteter Fehler:', e instanceof Error ? e.message : e);
    return fehler(MELDUNG.allgemein, 500);
}

export async function POST(req: Request) {
    const body = await leseJson(req, 2_000);
    const url = typeof body?.url === 'string' ? body.url : '';
    try {
        normalisiereEingabe(url);
    } catch (e) {
        return scanFehlerAntwort(e);
    }

    const limit = await scanErlaubt(clientIp(req));
    if (limit) return fehler(limit, 429);

    try {
        const scan = await scanneWebsite(url);
        const scanId = neueScanId();
        const logos = gueltigeLogos(scan.extrakt.logo_kandidaten);
        const bestes = logos[0] ?? null;
        const regel = regelProfil(scan.extrakt);
        // AUFTRAG-096: relativer Proxy-Pfad (kein Host in den Antworten)
        regel.profil.logo_url = logoUrlFuerProfil(bestes?.k ?? null, bestes?.index ?? 0, scanId);
        const gespeichert = await speichereNeuenScan({
            id: scanId,
            extrakt: scan.extrakt,
            profil: regel.profil,
            profil_quelle: 'regeln',
            assistent_weiblich: regel.weiblich,
            schritte: scan.schritte,
            dauer_ms: scan.dauer_ms,
        });
        const x = scan.extrakt;
        return antwort({
            scan_id: gespeichert.id,
            schritte: scan.schritte.map(({ schluessel, ok }) => ({ schluessel, ok })),
            profil: regel.profil,
            profil_quelle: 'regeln',
            assistent_weiblich: regel.weiblich,
            // AUFTRAG-096: geordnete Kandidaten (höchstens 4); die Karte prüft sie der Reihe nach im Browser (Sichtbarkeit)
            logos: logos.slice(0, 4).map(({ k, index }) => logoFuerKarte(k, index, gespeichert.id)),
            // gewichtete Farbsignale: die Karte ergänzt die im Browser gemessene Logo-Farbe und wählt mit denselben Regeln
            farb_signale: x.farb_signale,
            funde: {
                seiten: x.seiten.filter((s) => !s.fehler).length,
                firma: regel.profil.firma,
                telefon: regel.profil.telefon ? formatiereNummer(regel.profil.telefon) : null,
                oeffnungszeiten: regel.profil.oeffnungszeiten_text,
                farbe: x.farben?.primaer ?? null,
                farbe_quelle: x.farbe_quelle,
                plattform: x.plattform,
            },
            dauer_ms: scan.dauer_ms,
        });
    } catch (e) {
        return scanFehlerAntwort(e);
    }
}
