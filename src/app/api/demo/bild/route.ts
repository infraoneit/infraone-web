/**
 * GET /api/demo/bild?u=<logo-url>        — Bild-Proxy für die Assistenten-Karte
 * GET /api/demo/bild?s=<scan_id>&i=<n>   — Inline-SVG / data:-Logo aus einem Scan
 *
 * Damit Logo-Anzeige und Farbanalyse im Browser (Canvas) ohne CORS laufen.
 * Nur http/https, öffentliche Hosts (SSRF-Schutz wie der Scanner), max.
 * 2 MB, max. 10 s. Durchgereicht werden nur Bildformate, die nach den ersten
 * Bytes erkannt sind: SVG (bereinigt: keine Skripte, Ereignisse, externen
 * Verweise), PNG, JPEG, GIF, WebP, AVIF, ICO, BMP. SVG zusätzlich mit
 * Sandbox-CSP, damit auch bei direktem Aufruf nie etwas ausgeführt wird.
 */
import { fehler } from '@/lib/demo/api';
import { holeSicher, NetzFehler } from '@/lib/demo/netz';
import { erkenneFormat, MIME } from '@/lib/demo/bildanalyse';
import { bereinigeSvg } from '@/lib/demo/logo';
import { leseScan } from '@/lib/demo/scans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 2 * 1024 * 1024;

function bildAntwort(body: Buffer, contentType: string, cache: string): Response {
    let format = erkenneFormat(body, contentType);
    let daten = body;
    if (!format) return fehler('Kein unterstütztes Bild', 415);
    if (format === 'svg') {
        const svg = bereinigeSvg(body.toString('utf8'));
        if (!svg) return fehler('SVG ungültig', 415);
        daten = Buffer.from(svg, 'utf8');
        format = 'svg';
    }
    return new Response(new Uint8Array(daten), {
        status: 200,
        headers: {
            'Content-Type': format === 'svg' ? 'image/svg+xml; charset=utf-8' : MIME[format],
            'Content-Length': String(daten.length),
            'Cache-Control': cache,
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
            'Content-Disposition': 'inline',
            'Cross-Origin-Resource-Policy': 'same-origin',
        },
    });
}

function dataUriBytes(uri: string): { body: Buffer; typ: string } | null {
    const m = uri.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/i);
    if (!m) return null;
    try {
        return { body: m[2] ? Buffer.from(m[3].replace(/\s+/g, ''), 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8'), typ: m[1] };
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    const p = new URL(req.url).searchParams;

    // Logo aus einem gespeicherten Scan (Inline-SVG oder data:-URI)
    const scanId = p.get('s');
    if (scanId) {
        const i = Number(p.get('i'));
        const scan = await leseScan(scanId);
        const k = scan && Number.isInteger(i) && i >= 0 ? scan.extrakt.logo_kandidaten[i] : null;
        if (!k?.inhalt) return fehler('Logo nicht gefunden', 404);
        const roh = k.quelle === 'inline-svg' ? { body: Buffer.from(k.inhalt, 'utf8'), typ: 'image/svg+xml' } : dataUriBytes(k.inhalt);
        if (!roh || roh.body.length > MAX_BYTES) return fehler('Logo nicht gefunden', 404);
        // Scan lebt 2 h: privat zwischenspeichern
        return bildAntwort(roh.body, roh.typ, 'private, max-age=7200');
    }

    const u = p.get('u');
    if (!u || u.length > 2_000) return fehler('Parameter u fehlt', 400);
    try {
        const r = await holeSicher(u, { akzeptiere: 'bild', zeitMs: 10_000, maxBytes: MAX_BYTES });
        return bildAntwort(r.body, r.contentType, 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    } catch (e) {
        if (e instanceof NetzFehler) {
            if (e.code === 'zu_gross') return fehler('Bild zu gross', 413);
            if (e.code === 'host_gesperrt' || e.code === 'url_ungueltig') return fehler('Adresse nicht erlaubt', 400);
            if (e.code === 'status') return fehler('Bild nicht gefunden', 502);
            return fehler('Bild nicht erreichbar', 502);
        }
        return fehler('Bild nicht erreichbar', 502);
    }
}
