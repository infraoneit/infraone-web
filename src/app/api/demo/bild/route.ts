/**
 * GET /api/demo/bild?u=<logo-url>        — Bild-Proxy (Original-Adresse)
 * GET /api/demo/bild?s=<scan_id>&i=<n>   — älteres Format für Logos eines Scans
 *                                          (neu: /api/demo/bild/<scan_id>/<n>, AUFTRAG-102)
 *
 * Damit Logo-Anzeige und Farbanalyse im Browser (Canvas) ohne CORS laufen.
 * Nur http/https, öffentliche Hosts (SSRF-Schutz wie der Scanner), max.
 * 2 MB, max. 10 s. Durchgereicht werden nur Bildformate, die nach den ersten
 * Bytes erkannt sind: SVG (bereinigt: keine Skripte, Ereignisse, externen
 * Verweise), PNG, JPEG, GIF, WebP, AVIF, ICO, BMP. SVG zusätzlich mit
 * Sandbox-CSP, damit auch bei direktem Aufruf nie etwas ausgeführt wird.
 *
 * AUFTRAG-102: jede Antwort mit `Netlify-Vary: query` und `Vary: Accept`
 * (lib/demo/bildproxy.ts) — sonst teilen sich auf Netlify alle `?u=`/`?s=`
 * denselben Cache-Eintrag.
 */
import { fehler } from '@/lib/demo/api';
import { CACHE_URL, fremdesBild, logoAusScan, mitVary } from '@/lib/demo/bildproxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const p = new URL(req.url).searchParams;

    // älteres Format: Logo aus einem gespeicherten Scan (nur privat zwischenspeichern)
    const scanId = p.get('s');
    if (scanId) return logoAusScan(scanId, p.get('i') ?? '', 'private, max-age=7200');

    const u = p.get('u');
    if (!u || u.length > 2_000) return mitVary(fehler('Parameter u fehlt', 400));
    return fremdesBild(u, CACHE_URL);
}
