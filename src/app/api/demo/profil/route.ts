/**
 * POST /api/demo/profil  Body {scan_id} → {scan_id, schritte, profil, profil_quelle, …}
 *
 * Stufe 2 von 2 (AUFTRAG-092): baut aus dem gespeicherten Extrakt das
 * KI-Profil (gpt-4.1-mini, Zeitlimit bis 21 s, AUFTRAG-102). Fällt die KI aus, bleibt das
 * regelbasierte Profil — die Demo scheitert nie an der KI.
 * Höchstens zwei KI-Versuche je Scan; ein KI-Profil wird zwischengespeichert.
 * AUFTRAG-102: Reichte das Scan-Budget (8 s) nicht für die Team-Seiten, lädt dieser
 * Schritt sie vor dem KI-Aufruf nach (höchstens 3,5 s). Die KI-Frist ergibt sich aus dem
 * Function-Limit: höchstens 21 s, zusammen mit dem Nachladen höchstens 24,5 s (< 26 s).
 */
import { antwort, fehler, leseJson, MELDUNG } from '@/lib/demo/api';
import { baueProfil } from '@/lib/demo/profil';
import { leseScan, speichereScan } from '@/lib/demo/scans';
import { formatiereNummer } from '@/lib/demo/nummer';
import { ergaenzeTeam } from '@/lib/demo/scanner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 26;

/** Längste KI-Frist im Profil-Schritt (AUFTRAG-102) */
const KI_ZEIT_MAX_MS = 21_000;

export async function POST(req: Request) {
    const body = await leseJson(req, 1_000);
    const scanId = typeof body?.scan_id === 'string' ? body.scan_id : '';
    const scan = await leseScan(scanId);
    if (!scan) return fehler(MELDUNG.scanAbgelaufen, 404);

    const t0 = Date.now();
    // AUFTRAG-102: Team-Seiten, für die das Scan-Budget nicht reichte, vor dem KI-Aufruf nachladen (höchstens 3,5 s)
    let teamErgaenzt = false;
    if (scan.extrakt.team_offen?.length) {
        const t = await ergaenzeTeam(scan.extrakt);
        teamErgaenzt = t.geladen > 0;
        if (scan.profil_quelle === 'ki') await speichereScan(scan);
    }
    if (scan.profil_quelle !== 'ki' && scan.ki_versuche < 2) {
        scan.ki_versuche += 1;
        // AUFTRAG-102: KI-Frist aus dem Function-Limit (26 s): höchstens 21 s, abzüglich der Zeit fürs Nachladen
        // der Team-Seiten; 1,5 s bleiben fürs Speichern (vorher fest 17 s — mit 20 000 Zeichen Text knapp)
        const ergebnis = await baueProfil(scan.extrakt, Math.max(8_000, Math.min(KI_ZEIT_MAX_MS, 24_500 - (Date.now() - t0))));
        if (ergebnis.fehler) console.warn('[demo/profil] Rückfall auf Regeln:', ergebnis.fehler);
        if (ergebnis.quelle === 'ki' || teamErgaenzt) {
            // logo_url bestimmt der Scan (geprüftes Logo, ggf. Proxy-Link für Inline-SVG)
            scan.profil = { ...ergebnis.profil, logo_url: scan.profil.logo_url };
            scan.profil_quelle = ergebnis.quelle;
            scan.assistent_weiblich = ergebnis.weiblich;
            if (ergebnis.quelle === 'ki') scan.profil_ms = ergebnis.ms;
        }
        await speichereScan(scan);
    }
    return antwort({
        scan_id: scan.id,
        schritte: [{ schluessel: 'wissen', ok: scan.profil.wissen.length > 0 }],
        profil: scan.profil,
        profil_quelle: scan.profil_quelle,
        assistent_weiblich: scan.assistent_weiblich,
        funde: {
            telefon: scan.profil.telefon ? formatiereNummer(scan.profil.telefon) : null,
            oeffnungszeiten: scan.profil.oeffnungszeiten_text,
            wissen: scan.profil.wissen.length,
            personen: scan.profil.personen?.length ?? 0,
        },
        dauer_ms: Date.now() - t0,
    });
}
