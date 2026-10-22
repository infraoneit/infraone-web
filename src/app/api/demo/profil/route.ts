/**
 * POST /api/demo/profil  Body {scan_id} → {scan_id, schritte, profil, profil_quelle, …}
 *
 * Stufe 2 von 2 (AUFTRAG-092): baut aus dem gespeicherten Extrakt das
 * KI-Profil (gpt-4.1-mini, Zeitlimit 17 s). Fällt die KI aus, bleibt das
 * regelbasierte Profil — die Demo scheitert nie an der KI.
 * Höchstens zwei KI-Versuche je Scan; ein KI-Profil wird zwischengespeichert.
 */
import { antwort, fehler, leseJson, MELDUNG } from '@/lib/demo/api';
import { baueProfil } from '@/lib/demo/profil';
import { leseScan, speichereScan } from '@/lib/demo/scans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 26;

export async function POST(req: Request) {
    const body = await leseJson(req, 1_000);
    const scanId = typeof body?.scan_id === 'string' ? body.scan_id : '';
    const scan = await leseScan(scanId);
    if (!scan) return fehler(MELDUNG.scanAbgelaufen, 404);

    const t0 = Date.now();
    if (scan.profil_quelle !== 'ki' && scan.ki_versuche < 2) {
        scan.ki_versuche += 1;
        const ergebnis = await baueProfil(scan.extrakt);
        if (ergebnis.fehler) console.warn('[demo/profil] Rückfall auf Regeln:', ergebnis.fehler);
        if (ergebnis.quelle === 'ki') {
            scan.profil = ergebnis.profil;
            scan.profil_quelle = 'ki';
            scan.assistent_weiblich = ergebnis.weiblich;
            scan.profil_ms = ergebnis.ms;
        }
        await speichereScan(scan);
    }
    return antwort({
        scan_id: scan.id,
        schritte: [{ schluessel: 'wissen', ok: scan.profil.wissen.length > 0 }],
        profil: scan.profil,
        profil_quelle: scan.profil_quelle,
        assistent_weiblich: scan.assistent_weiblich,
        dauer_ms: Date.now() - t0,
    });
}
