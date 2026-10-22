/**
 * POST /api/demo/scan  Body {url} → {scan_id, schritte, profil, …}
 *
 * Stufe 1 von 2 (AUFTRAG-092): liest die Website (Budget 8 s) und liefert
 * sofort ein regelbasiertes Profil. Das KI-Profil baut danach
 * POST /api/demo/profil (eigener Aufruf, damit jede Function deutlich unter
 * dem Netlify-Limit von 26 s bleibt).
 */
import { antwort, clientIp, fehler, leseJson, MELDUNG } from '@/lib/demo/api';
import { normalisiereEingabe, scanneWebsite, ScanFehler } from '@/lib/demo/scanner';
import { regelProfil } from '@/lib/demo/profil';
import { scanErlaubt } from '@/lib/demo/limits';
import { speichereNeuenScan } from '@/lib/demo/scans';

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
        const regel = regelProfil(scan.extrakt);
        const gespeichert = await speichereNeuenScan({
            extrakt: scan.extrakt,
            profil: regel.profil,
            profil_quelle: 'regeln',
            assistent_weiblich: regel.weiblich,
            schritte: scan.schritte,
            dauer_ms: scan.dauer_ms,
        });
        return antwort({
            scan_id: gespeichert.id,
            schritte: scan.schritte.map(({ schluessel, ok }) => ({ schluessel, ok })),
            profil: regel.profil,
            profil_quelle: 'regeln',
            assistent_weiblich: regel.weiblich,
            logo_kandidaten: scan.extrakt.logo_kandidaten.slice(0, 5).map((k) => k.url),
            dauer_ms: scan.dauer_ms,
        });
    } catch (e) {
        return scanFehlerAntwort(e);
    }
}
