/**
 * POST /api/demo/anruf
 * Body {scan_id, nummer, sprache, einwilligung: true, honigtopf: "", farben?, logo_index?, turnstile?}
 * → 201 {id} oder 4xx {fehler}
 *
 * Legt einen Rückruf-Auftrag in die Warteschlange und stösst die Anlage an
 * (AUFTRAG-098: `POST <DEMO_ANSTOSS_URL>` mit Bearer, nur die Kennung; Frist
 * 4 s, eine Wiederholung nach 1 s). Scheitert der Anstoss (401/5xx/Timeout)
 * oder ist die Anlage belegt (409), bleibt der Auftrag «wartend» — der
 * Rückfall der Anlage (Warteschlange einmal pro Minute) holt ihn ab; der
 * Besucher bekommt trotzdem 201. Ohne DEMO_ANSTOSS_URL (lokal) wie bisher:
 * der VoIP-Orchestrator (AUFTRAG-091) holt den Auftrag über
 * /api/demo/warteschlange ab.
 *
 * AUFTRAG-103: Limits gesamt → Gerät → Adresse → Nummer (lib/demo/limits.ts); Gerätekennung aus
 * dem signierten Cookie `demo_geraet` (fehlt es, setzt diese Antwort es). Ablauf: Auftrag anlegen
 * → zählen → erst dann anstossen; scheitert das Zählen, wird der Auftrag gelöscht (500, kein
 * Anstoss). Der Auftrag trägt `ip_hash`, `ip_art`, `geraet_hash` (nur für die Anlage mit Bearer).
 *
 * AUFTRAG-109: Nur Scans mit bestätigtem Handelsregister-Eintrag (signierter Nachweis, an
 * scan_id + UID gebunden, 30 min; lib/demo/handelsregister.ts). Ohne gültigen Nachweis 403
 * {fehler, code: "handelsregister_fehlt" | "handelsregister_abgelaufen"} — geprüft vor den
 * Limits (zählt nichts). Der Auftrag trägt `handelsregister` {uid, uid_formatiert, name, sitz,
 * status, quelle, geprueft_am}.
 */
import { antwort, clientIp, fehler, leseJson, MELDUNG, pruefeTurnstile } from '@/lib/demo/api';
import { pruefeRueckrufNummer } from '@/lib/demo/nummer';
import { anrufPruefen, anrufZaehlen, pseudonyme } from '@/lib/demo/limits';
import { leseScan } from '@/lib/demo/scans';
import { auftraegeBereinigen, erstelleAuftrag, loescheAuftrag, nimmAnrufAn } from '@/lib/demo/auftraege';
import { geraetAusAnfrage, mitGeraetCookie } from '@/lib/demo/geraet';
import { aufraeumenGelegentlich } from '@/lib/demo/speicher';
import { SPRACHEN, type Farben, type Sprache } from '@/lib/demo/typen';
import { gueltigeLogos, logoUrlFuerAuftrag } from '@/lib/demo/logo';
import { stimmeFuer } from '@/lib/demo/namen';
import { stosseAn } from '@/lib/demo/anstoss';
import { nachweisFuerAnruf, type AnrufNachweis } from '@/lib/demo/handelsregister';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Anstoss höchstens 4 s + 1 s + 4 s; die Route bleibt damit unter 10 s
export const maxDuration = 15;

const HEX_RE = /^#[0-9A-F]{6}$/i;

export async function POST(req: Request) {
    // AUFTRAG-103: fehlt das Cookie (oder ist es ungültig), setzt diese Antwort eine neue Kennung
    const geraet = geraetAusAnfrage(req);
    return mitGeraetCookie(await anruf(req, geraet.hash), geraet);
}

async function anruf(req: Request, geraetHash: string): Promise<Response> {
    const body = await leseJson(req, 4_000);
    if (!body) return fehler(MELDUNG.allgemein, 400);

    // Honigtopf: muss leer sein (Bots füllen jedes Feld)
    if (body.honigtopf !== undefined && body.honigtopf !== '') return fehler(MELDUNG.allgemein, 400);
    if (body.einwilligung !== true) return fehler(MELDUNG.einwilligung, 400);

    const sprache = body.sprache as Sprache;
    if (!SPRACHEN.includes(sprache)) return fehler(MELDUNG.allgemein, 400);

    const nummerRoh = typeof body.nummer === 'string' ? body.nummer.slice(0, 40) : '';
    const pruefung = pruefeRueckrufNummer(nummerRoh);
    if (!pruefung.ok) {
        const text = pruefung.grund === 'land' ? MELDUNG.nummerLand : pruefung.grund === 'sonderdienst' ? MELDUNG.nummerSonderdienst : MELDUNG.nummerFormat;
        return fehler(text, 422);
    }

    const ip = clientIp(req);
    if (!(await pruefeTurnstile(body.turnstile, ip))) return fehler(MELDUNG.turnstile, 403);

    const scan = await leseScan(typeof body.scan_id === 'string' ? body.scan_id : '');
    if (!scan) return fehler(MELDUNG.scanAbgelaufen, 410);

    // AUFTRAG-109: bestätigter, signierter Handelsregister-Nachweis des Scans (vor den Limits)
    let hr: AnrufNachweis;
    try {
        hr = await nachweisFuerAnruf(scan);
    } catch (e) {
        console.error('[demo/anruf] Handelsregister-Nachweis nicht lesbar:', e instanceof Error ? e.message : e);
        return fehler(MELDUNG.allgemein, 500);
    }
    if (!hr.ok) {
        console.info(`[demo/anruf] abgewiesen: ${hr.code} scan=${scan.id.slice(0, 10)}`);
        return antwort({ fehler: hr.meldung, code: hr.code }, 403);
    }

    const p = pseudonyme({ ip, geraetHash, nummer: pruefung.e164 });
    try {
        const limit = await anrufPruefen(p);
        if (limit) return fehler(limit.meldung, 429);
    } catch (e) {
        console.error('[demo/anruf] Limit-Prüfung fehlgeschlagen:', e instanceof Error ? e.message : e);
        return fehler(MELDUNG.allgemein, 500);
    }

    // Endgültige Primärfarbe bestimmt der Browser aus dem Logo (optional)
    const profil = { ...scan.profil };
    const f = body.farben as Partial<Farben> | undefined;
    if (f && typeof f === 'object' && HEX_RE.test(String(f.primaer)) && HEX_RE.test(String(f.sekundaer))) {
        profil.farben = { primaer: String(f.primaer).toUpperCase(), sekundaer: String(f.sekundaer).toUpperCase() };
    }
    // Logo, das im Browser tatsächlich geladen werden konnte (Index in den geprüften Scan-Kandidaten)
    // AUFTRAG-096: Der Orchestrator verlangt http(s) — Original-URL bzw. Proxy-Link nur mit öffentlichem Ursprung, sonst null
    const idx = body.logo_index;
    const gewaehlt =
        typeof idx === 'number' && Number.isInteger(idx) && idx >= 0 && scan.extrakt.logo_kandidaten[idx]?.gueltig
            ? { k: scan.extrakt.logo_kandidaten[idx], index: idx }
            : (gueltigeLogos(scan.extrakt.logo_kandidaten)[0] ?? null);
    profil.logo_url = logoUrlFuerAuftrag(gewaehlt?.k ?? null, gewaehlt?.index ?? 0, scan.id, new URL(req.url).origin);
    // Stimme passt immer zum Vornamen (AUFTRAG-095; auch für ältere Scans ohne Feld)
    profil.stimme = stimmeFuer(profil.assistent_name);

    // AUFTRAG-103: Auftrag anlegen → zählen → erst dann anstossen (wirft nie; ohne DEMO_ANSTOSS_URL
    // sofort fertig). Das gelegentliche Aufräumen läuft während des Anstosses.
    const annahme = await nimmAnrufAn({
        erstelle: () =>
            erstelleAuftrag({
                scan_id: scan.id,
                nummer: pruefung.e164,
                sprache,
                profil,
                profil_bis: scan.ablauf,
                ip_hash: p.ip_hash,
                ip_art: p.ip_art,
                geraet_hash: p.geraet_hash,
                handelsregister: hr.handelsregister,
            }),
        zaehle: () => anrufZaehlen(p),
        loesche: (a) => loescheAuftrag(a),
        stosseAn: (id) => stosseAn(id),
        nebenbei: async () => {
            if (await aufraeumenGelegentlich().catch(() => false)) await auftraegeBereinigen().catch(() => undefined);
        },
    });
    if (!annahme.ok) {
        const f = annahme.fehler instanceof Error ? annahme.fehler.message : annahme.fehler;
        if (annahme.schritt === 'zaehlen') {
            console.error(`[demo/anruf] Zählen fehlgeschlagen, kein Anstoss, Auftrag ${annahme.zurueckgenommen ? 'gelöscht' : 'NICHT gelöscht'}:`, f);
        } else {
            console.error('[demo/anruf] Speichern fehlgeschlagen:', f);
        }
        return fehler(MELDUNG.allgemein, 500);
    }
    return antwort({ id: annahme.auftrag.id }, 201);
}
