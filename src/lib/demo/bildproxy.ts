/**
 * Bild-Proxy der KI-Demo (gemeinsam für `/api/demo/bild?u=…` und
 * `/api/demo/bild/<scan>/<n>`).
 *
 * AUFTRAG-102 (Befund Branch-Deploy 26.10.2026): Die Next-Laufzeit auf Netlify
 * setzt `Netlify-Vary: query=__nextDataReq|_rsc`. Damit ignoriert der CDN-Cache
 * alle übrigen Query-Parameter: `/api/demo/bild?u=<Unipoint-Logo>` und
 * `/api/demo/bild?s=<Scan>&i=0` bekamen das zuerst zwischengespeicherte Bild
 * (das Bint-Logo) — gemessen mit SHA-256, Rohdaten in A102-parallel.json.
 * Darum:
 * - jede Antwort sendet `Netlify-Vary: query` (die Laufzeit übernimmt eigene
 *   Netlify-Vary-Angaben und erweitert damit den Cache-Schlüssel auf ALLE
 *   Query-Parameter) und `Vary: Accept`;
 * - Logos eines Scans tragen die Scan-Kennung im PFAD (`/api/demo/bild/<scan>/<n>`):
 *   Der Cache-Schlüssel enthält dann immer Scan und Index, auch ohne Query.
 */
import { erkenneFormat, MIME } from './bildanalyse';
import { bereinigeSvg } from './logo';
import { fehler, MELDUNG, scanUnvollstaendig } from './api';
import { holeSicher, NetzFehler } from './netz';
import { leseScan, SCAN_ID_RE, scanStufe } from './scans';
import { scanFreigegeben } from './sperrliste';

export const BILD_MAX_BYTES = 2 * 1024 * 1024;

/** Kopfzeilen, die jeden Cache-Schlüssel auf die volle Adresse (Pfad + alle Query-Parameter) und das Format binden. */
export const BILD_VARY = { 'Netlify-Vary': 'query', Vary: 'Accept' } as const;

export const CACHE_URL = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';
/** Logo eines Scans: Pfad mit unvorhersehbarer Scan-Kennung, Inhalt fest für die Lebensdauer des Scans (2 h). */
export const CACHE_SCAN = 'public, max-age=7200, s-maxage=7200';

export function bildAntwort(body: Buffer, contentType: string, cache: string): Response {
    let format = erkenneFormat(body, contentType);
    let daten = body;
    if (!format) return mitVary(fehler('Kein unterstütztes Bild', 415));
    if (format === 'svg') {
        const svg = bereinigeSvg(body.toString('utf8'));
        if (!svg) return mitVary(fehler('SVG ungültig', 415));
        daten = Buffer.from(svg, 'utf8');
        format = 'svg';
    }
    return new Response(new Uint8Array(daten), {
        status: 200,
        headers: {
            'Content-Type': format === 'svg' ? 'image/svg+xml; charset=utf-8' : MIME[format],
            'Content-Length': String(daten.length),
            'Cache-Control': cache,
            ...BILD_VARY,
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
            'Content-Disposition': 'inline',
            'Cross-Origin-Resource-Policy': 'same-origin',
        },
    });
}

/** Fehlerantworten ebenfalls mit Vary (sie sind no-store, aber nie unter fremdem Schlüssel). */
export function mitVary(r: Response): Response {
    for (const [k, v] of Object.entries(BILD_VARY)) r.headers.set(k, v);
    return r;
}

export function dataUriBytes(uri: string): { body: Buffer; typ: string } | null {
    const m = uri.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/i);
    if (!m) return null;
    try {
        return { body: m[2] ? Buffer.from(m[3].replace(/\s+/g, ''), 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8'), typ: m[1] };
    } catch {
        return null;
    }
}

/** Lädt ein fremdes Bild (SSRF-Schutz wie der Scanner) und liefert es bereinigt aus. */
export async function fremdesBild(u: string, cache: string): Promise<Response> {
    try {
        const r = await holeSicher(u, { akzeptiere: 'bild', zeitMs: 10_000, maxBytes: BILD_MAX_BYTES });
        return bildAntwort(r.body, r.contentType, cache);
    } catch (e) {
        if (e instanceof NetzFehler) {
            if (e.code === 'zu_gross') return mitVary(fehler('Bild zu gross', 413));
            if (e.code === 'host_gesperrt' || e.code === 'url_ungueltig') return mitVary(fehler('Adresse nicht erlaubt', 400));
            if (e.code === 'status') return mitVary(fehler('Bild nicht gefunden', 502));
        }
        return mitVary(fehler('Bild nicht erreichbar', 502));
    }
}

/**
 * Logo `index` aus dem gespeicherten Scan `scanId`: Inline-SVG bzw. data:-URI direkt,
 * sonst die geprüfte Adresse des Kandidaten über den Proxy. Nur gültige Kandidaten.
 * AUFTRAG-112: Scan mit gesperrtem Host → 404 MELDUNG.scanAbgelaufen; Vorprüfungs-Scan (noch kein
 * Logo gelesen) → 409 «scan_unvollstaendig».
 */
export async function logoAusScan(scanId: string, indexRoh: string | number, cache = CACHE_SCAN): Promise<Response> {
    const index = Number(indexRoh);
    if (!SCAN_ID_RE.test(scanId) || !Number.isInteger(index) || index < 0 || index > 20) return mitVary(fehler('Logo nicht gefunden', 404));
    const scan = await leseScan(scanId);
    if (scan && !scanFreigegeben(scan)) return mitVary(fehler(MELDUNG.scanAbgelaufen, 404));
    if (scan && scanStufe(scan) === 'vorpruefung') return mitVary(scanUnvollstaendig());
    const k = scan?.extrakt.logo_kandidaten[index] ?? null;
    if (!k || k.gueltig === false) return mitVary(fehler('Logo nicht gefunden', 404));
    if (k.inhalt) {
        const roh = k.quelle === 'inline-svg' ? { body: Buffer.from(k.inhalt, 'utf8'), typ: 'image/svg+xml' } : dataUriBytes(k.inhalt);
        if (!roh || roh.body.length > BILD_MAX_BYTES) return mitVary(fehler('Logo nicht gefunden', 404));
        return bildAntwort(roh.body, roh.typ, cache);
    }
    if (!k.url) return mitVary(fehler('Logo nicht gefunden', 404));
    return fremdesBild(k.url, cache);
}
