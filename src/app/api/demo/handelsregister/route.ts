/**
 * POST /api/demo/handelsregister (AUFTRAG-109) — Abgleich mit dem Schweizer Handelsregister
 * (Zefix) vor dem Testanruf.
 *
 * Body (genau eine Aktion):
 * - {scan_id}                     → automatische Prüfung (UID aus dem Impressum, sonst Namenssuche);
 *                                    zwischengespeichert je Scan
 * - {scan_id, suche: "…"}         → manuelle Suche «Firmenname oder UID» (höchstens 3 je Scan)
 * - {scan_id, bestaetige: "CHE…"} → «Ja, das ist meine Firma»: nur ein gezeigter, aktiver Eintrag;
 *                                    legt den signierten Nachweis ab (30 min)
 *
 * Antwort 200: HrAntwort (lib/demo/handelsregister-texte.ts). Fehler: 404 Scan abgelaufen,
 * 400/409/422 {fehler}, 429 {fehler} (manuelle Suchen aufgebraucht).
 * «Register nicht erreichbar» ist eine normale Antwort (200, ergebnis «nicht_erreichbar»).
 * Schalter DEMO_HANDELSREGISTER=aus (nur lokal): sofort «uebersprungen», ohne Scan-Abfrage (so laufen
 * auch Browser-Tests mit nachgebildeten Scans durch).
 */
import { antwort, fehler, leseJson, MELDUNG } from '@/lib/demo/api';
import { leseScan } from '@/lib/demo/scans';
import { automatischePruefung, bestaetige, handelsregisterModus, manuelleSuche, uebersprungen } from '@/lib/demo/handelsregister';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Prüfung höchstens 20 s (alle Zefix-Aufrufe), dazu Speicher
export const maxDuration = 26;

export async function POST(req: Request) {
    const body = await leseJson(req, 1_000);
    if (!body) return fehler(MELDUNG.allgemein, 400);
    const scanId = typeof body.scan_id === 'string' ? body.scan_id.slice(0, 40) : '';
    if (handelsregisterModus() === 'aus') return antwort(uebersprungen(scanId));
    const scan = await leseScan(scanId);
    if (!scan) return fehler(MELDUNG.scanAbgelaufen, 404);

    try {
        if (typeof body.bestaetige === 'string') {
            const r = await bestaetige(scan, body.bestaetige.slice(0, 40));
            return r.ok ? antwort(r.antwort) : fehler(r.meldung, r.status);
        }
        if (typeof body.suche === 'string') {
            const r = await manuelleSuche(scan, body.suche.slice(0, 200));
            return r.ok ? antwort(r.antwort) : fehler(r.meldung, r.status);
        }
        if (body.bestaetige !== undefined || body.suche !== undefined) return fehler(MELDUNG.allgemein, 400);
        return antwort(await automatischePruefung(scan));
    } catch (e) {
        console.error('[demo/handelsregister] unerwarteter Fehler:', e instanceof Error ? e.message : e);
        return fehler(MELDUNG.allgemein, 500);
    }
}
