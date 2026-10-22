/**
 * GET /api/demo/bild?u=<logo-url> — Bild-Proxy für die Assistenten-Karte.
 *
 * Damit Logo-Anzeige und Farbanalyse im Browser (Canvas) ohne CORS laufen.
 * Nur http/https, öffentliche Hosts (SSRF-Schutz wie der Scanner), max.
 * 2 MB, max. 10 s, nur Bilder. SVG wird mit Sandbox-CSP ausgeliefert, damit
 * eingebettete Skripte auch bei direktem Aufruf nie laufen.
 */
import { fehler } from '@/lib/demo/api';
import { bildTyp, holeSicher, NetzFehler } from '@/lib/demo/netz';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 2 * 1024 * 1024;

export async function GET(req: Request) {
    const u = new URL(req.url).searchParams.get('u');
    if (!u || u.length > 2_000) return fehler('Parameter u fehlt', 400);
    try {
        const r = await holeSicher(u, { akzeptiere: 'bild', zeitMs: 10_000, maxBytes: MAX_BYTES });
        const typ = bildTyp(r.contentType, r.body);
        if (!typ) return fehler('Kein Bild', 415);
        return new Response(new Uint8Array(r.body), {
            status: 200,
            headers: {
                'Content-Type': typ,
                'Cache-Control': 'public, max-age=86400',
                'X-Content-Type-Options': 'nosniff',
                'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
                'Content-Disposition': 'inline',
                'Cross-Origin-Resource-Policy': 'same-origin',
            },
        });
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
