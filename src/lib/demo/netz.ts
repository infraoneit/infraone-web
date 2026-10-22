/**
 * Sicherer HTTP-Abruf für den Demo-Scanner und den Bild-Proxy (AUFTRAG-092).
 *
 * - Nur http/https, Standard-Ports, keine Zugangsdaten in der URL.
 * - SSRF-Schutz: Jede DNS-Auflösung wird im Socket-Lookup geprüft (auch bei
 *   Weiterleitungen). Private, lokale und reservierte Adressen werden
 *   abgelehnt. Prüfung und Verbindung nutzen dieselbe Auflösung, damit ist
 *   auch DNS-Rebinding zwischen Prüfung und Verbindung ausgeschlossen.
 * - Weiterleitungen manuell (max. 5), Zeitlimit je Abruf, Grössenlimit nach
 *   dem Entpacken (gzip/deflate/br), Zeichensatz-Erkennung.
 *
 * Bewusst ohne fetch(): Node-fetch (undici) erlaubt keinen eigenen
 * DNS-Lookup ohne Zusatzpaket.
 */
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import zlib from 'node:zlib';
import type { Readable } from 'node:stream';

export const USER_AGENT = 'InfraOne-Demo-Scanner/1.0 (+https://infraone.ch/ki-telefonassistent)';

export type NetzFehlerCode =
    | 'url_ungueltig'
    | 'host_gesperrt'
    | 'dns'
    | 'verbindung'
    | 'zeit'
    | 'zu_gross'
    | 'status'
    | 'typ'
    | 'weiterleitungen';

export class NetzFehler extends Error {
    code: NetzFehlerCode;
    status?: number;
    constructor(code: NetzFehlerCode, nachricht: string, status?: number) {
        super(nachricht);
        this.name = 'NetzFehler';
        this.code = code;
        this.status = status;
    }
}

/* ------------------------------------------------------------------ */
/* Adressprüfung                                                       */
/* ------------------------------------------------------------------ */

function ipv4ZuZahl(ip: string): number {
    return ip.split('.').reduce((acc, teil) => ((acc << 8) + Number(teil)) >>> 0, 0) >>> 0;
}

const IPV4_GESPERRT: Array<[string, number]> = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.88.99.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
];

function ipv4Gesperrt(ip: string): boolean {
    const z = ipv4ZuZahl(ip);
    return IPV4_GESPERRT.some(([basis, bits]) => {
        const maske = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
        return ((z & maske) >>> 0) === ((ipv4ZuZahl(basis) & maske) >>> 0);
    });
}

/** true, wenn die Adresse nicht öffentlich ist (SSRF-Schutz). */
export function istGesperrteIp(ip: string): boolean {
    const typ = net.isIP(ip);
    if (typ === 4) return ipv4Gesperrt(ip);
    if (typ === 6) {
        const a = ip.toLowerCase();
        if (a === '::' || a === '::1') return true;
        // IPv4-gemappt (::ffff:a.b.c.d) bzw. -kompatibel
        const v4 = a.match(/(?:^|:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
        if (v4) return ipv4Gesperrt(v4[1]);
        if (/^::ffff:/.test(a)) return true;
        if (/^f[cd]/.test(a)) return true; // fc00::/7 Unique Local
        if (/^fe[89ab]/.test(a)) return true; // fe80::/10 Link-Local
        if (/^ff/.test(a)) return true; // Multicast
        if (/^64:ff9b:/.test(a)) return true; // NAT64
        if (/^2001:db8:/.test(a)) return true; // Dokumentation
        if (/^2001:0{0,4}:/.test(a)) return true; // Teredo
        if (/^2002:/.test(a)) return true; // 6to4
        return false;
    }
    return true;
}

const HOST_ENDUNGEN_GESPERRT =
    /\.(local|localhost|internal|intranet|lan|home|corp|localdomain|test|invalid|example|onion)$/i;

/** Prüft eine URL formal (ohne DNS). Wirft NetzFehler. */
export function pruefeUrlFormal(roh: string): URL {
    let url: URL;
    try {
        url = new URL(roh);
    } catch {
        throw new NetzFehler('url_ungueltig', 'Ungültige Adresse');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new NetzFehler('url_ungueltig', 'Nur http und https sind erlaubt');
    }
    if (url.username || url.password) throw new NetzFehler('url_ungueltig', 'Zugangsdaten in der Adresse');
    if (url.port && url.port !== '80' && url.port !== '443') {
        throw new NetzFehler('host_gesperrt', 'Nur Standard-Ports sind erlaubt');
    }
    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (!host || host === 'localhost' || HOST_ENDUNGEN_GESPERRT.test(host)) {
        throw new NetzFehler('host_gesperrt', 'Diese Adresse ist nicht öffentlich');
    }
    if (net.isIP(host)) {
        if (istGesperrteIp(host)) throw new NetzFehler('host_gesperrt', 'Diese Adresse ist nicht öffentlich');
    } else if (!host.includes('.')) {
        throw new NetzFehler('host_gesperrt', 'Diese Adresse ist nicht öffentlich');
    }
    return url;
}

type LookupCallback = (
    err: NodeJS.ErrnoException | null,
    address: string | dns.LookupAddress[],
    family?: number,
) => void;

/** DNS-Lookup mit Sperrprüfung, wird direkt im Socket verwendet. */
function sichererLookup(hostname: string, options: dns.LookupOptions, callback: LookupCallback): void {
    dns.lookup(hostname, { all: true, family: options.family ?? 0 }, (err, adressen) => {
        if (err) return callback(err, '', 0);
        const liste = adressen as dns.LookupAddress[];
        if (!liste.length || liste.some((a) => istGesperrteIp(a.address))) {
            const e: NodeJS.ErrnoException = new Error('Gesperrte Zieladresse');
            e.code = 'EHOSTGESPERRT';
            return callback(e, '', 0);
        }
        if (options.all) return callback(null, liste);
        return callback(null, liste[0].address, liste[0].family);
    });
}

/* ------------------------------------------------------------------ */
/* Abruf                                                               */
/* ------------------------------------------------------------------ */

export type Akzeptiere = 'html' | 'css' | 'bild';

const ACCEPT: Record<Akzeptiere, string> = {
    html: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
    css: 'text/css,*/*;q=0.1',
    // PNG/SVG zuerst: Bild-CDNs (Wix enc_auto u. a.) liefern sonst AVIF, das der Server nicht auswerten kann
    // Ohne webp/avif: Bild-CDNs (Wix enc_auto, Squarespace, Webflow …) liefern dann PNG/JPEG, das der Server auswerten kann
    bild: 'image/svg+xml,image/png,image/jpeg;q=0.9,image/gif;q=0.8,image/x-icon;q=0.8,*/*;q=0.1',
};

export interface AbrufOptionen {
    akzeptiere: Akzeptiere;
    /** Zeitlimit dieses Abrufs inkl. Weiterleitungen (ms). */
    zeitMs: number;
    /** Maximale Grösse nach dem Entpacken. */
    maxBytes: number;
    /** Bei Überschreitung abschneiden statt Fehler (HTML/CSS). */
    abschneiden?: boolean;
    maxWeiterleitungen?: number;
}

export interface AbrufErgebnis {
    url: string;
    status: number;
    contentType: string;
    body: Buffer;
    abgeschnitten: boolean;
    ms: number;
    weiterleitungen: number;
}

interface EinzelErgebnis {
    status: number;
    headers: http.IncomingHttpHeaders;
    body: Buffer;
    abgeschnitten: boolean;
}

function einzelAbruf(url: URL, opt: AbrufOptionen, deadline: number): Promise<EinzelErgebnis> {
    return new Promise((resolve, reject) => {
        const rest = deadline - Date.now();
        if (rest <= 0) return reject(new NetzFehler('zeit', 'Zeitlimit erreicht'));
        const modul = url.protocol === 'https:' ? https : http;
        let erledigt = false;
        const uhr: { t?: ReturnType<typeof setTimeout> } = {};
        const fertig = (fn: () => void) => {
            if (erledigt) return;
            erledigt = true;
            if (uhr.t) clearTimeout(uhr.t);
            fn();
        };
        const req = modul.request(
            url,
            {
                method: 'GET',
                lookup: sichererLookup as unknown as typeof dns.lookup,
                headers: {
                    'User-Agent': USER_AGENT,
                    Accept: ACCEPT[opt.akzeptiere],
                    'Accept-Language': 'de-CH,de;q=0.9,en;q=0.6',
                    'Accept-Encoding': 'gzip, deflate, br',
                },
                // Kein Keep-Alive-Pool: jeder Abruf löst neu und geprüft auf.
                agent: false,
            },
            (res) => {
                const status = res.statusCode ?? 0;
                // Weiterleitung: Körper verwerfen, Ziel zurückgeben
                if (status >= 300 && status < 400 && res.headers.location) {
                    res.resume();
                    return fertig(() =>
                        resolve({ status, headers: res.headers, body: Buffer.alloc(0), abgeschnitten: false }),
                    );
                }
                let strom: Readable = res;
                const enc = String(res.headers['content-encoding'] || '')
                    .toLowerCase()
                    .trim();
                if (enc === 'gzip' || enc === 'x-gzip') strom = res.pipe(zlib.createGunzip());
                else if (enc === 'deflate') strom = res.pipe(zlib.createInflate());
                else if (enc === 'br') strom = res.pipe(zlib.createBrotliDecompress());
                const teile: Buffer[] = [];
                let laenge = 0;
                strom.on('data', (chunk: Buffer) => {
                    if (erledigt) return;
                    laenge += chunk.length;
                    if (laenge > opt.maxBytes) {
                        if (opt.abschneiden) {
                            const ueber = laenge - opt.maxBytes;
                            teile.push(chunk.subarray(0, chunk.length - ueber));
                            req.destroy();
                            return fertig(() =>
                                resolve({
                                    status,
                                    headers: res.headers,
                                    body: Buffer.concat(teile),
                                    abgeschnitten: true,
                                }),
                            );
                        }
                        req.destroy();
                        return fertig(() => reject(new NetzFehler('zu_gross', 'Antwort zu gross')));
                    }
                    teile.push(chunk);
                });
                strom.on('end', () =>
                    fertig(() =>
                        resolve({ status, headers: res.headers, body: Buffer.concat(teile), abgeschnitten: false }),
                    ),
                );
                strom.on('error', (e: Error) => {
                    // Entpack-Fehler nach Teildaten: das Gelesene verwenden
                    if (teile.length) {
                        return fertig(() =>
                            resolve({
                                status,
                                headers: res.headers,
                                body: Buffer.concat(teile),
                                abgeschnitten: true,
                            }),
                        );
                    }
                    fertig(() => reject(new NetzFehler('verbindung', e.message)));
                });
            },
        );
        uhr.t = setTimeout(() => {
            req.destroy();
            fertig(() => reject(new NetzFehler('zeit', 'Zeitlimit erreicht')));
        }, rest);
        req.on('error', (e: NodeJS.ErrnoException) => {
            if (e.code === 'EHOSTGESPERRT') {
                return fertig(() => reject(new NetzFehler('host_gesperrt', 'Diese Adresse ist nicht öffentlich')));
            }
            if (e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN') {
                return fertig(() => reject(new NetzFehler('dns', 'Adresse nicht gefunden')));
            }
            fertig(() => reject(new NetzFehler('verbindung', e.message || 'Verbindungsfehler')));
        });
        req.end();
    });
}

/**
 * Ruft eine URL sicher ab (Weiterleitungen bis 5, jede Station geprüft).
 * Wirft NetzFehler; Nicht-2xx wirft Code `status`.
 */
export async function holeSicher(roh: string, opt: AbrufOptionen): Promise<AbrufErgebnis> {
    const start = Date.now();
    const deadline = start + opt.zeitMs;
    const maxW = opt.maxWeiterleitungen ?? 5;
    let url = pruefeUrlFormal(roh);
    for (let i = 0; i <= maxW; i++) {
        const r = await einzelAbruf(url, opt, deadline);
        if (r.status >= 300 && r.status < 400 && r.headers.location) {
            if (i === maxW) throw new NetzFehler('weiterleitungen', 'Zu viele Weiterleitungen');
            url = pruefeUrlFormal(new URL(String(r.headers.location), url).toString());
            continue;
        }
        if (r.status < 200 || r.status >= 300) {
            throw new NetzFehler('status', `HTTP ${r.status}`, r.status);
        }
        return {
            url: url.toString(),
            status: r.status,
            contentType: String(r.headers['content-type'] || '').toLowerCase(),
            body: r.body,
            abgeschnitten: r.abgeschnitten,
            ms: Date.now() - start,
            weiterleitungen: i,
        };
    }
    throw new NetzFehler('weiterleitungen', 'Zu viele Weiterleitungen');
}

/* ------------------------------------------------------------------ */
/* Zeichensatz                                                         */
/* ------------------------------------------------------------------ */

function decoderFuer(label: string | null): TextDecoder | null {
    if (!label) return null;
    try {
        return new TextDecoder(label.trim().toLowerCase(), { fatal: false });
    } catch {
        return null;
    }
}

/** Dekodiert HTML/CSS anhand von BOM, HTTP-Header und meta charset. */
export function dekodiere(body: Buffer, contentType: string): string {
    if (body.length >= 3 && body[0] === 0xef && body[1] === 0xbb && body[2] === 0xbf) {
        return new TextDecoder('utf-8').decode(body.subarray(3));
    }
    const ausHeader = contentType.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1] ?? null;
    let decoder = decoderFuer(ausHeader);
    if (!decoder) {
        const kopf = body.subarray(0, 4096).toString('latin1');
        const meta =
            kopf.match(/<meta[^>]+charset\s*=\s*["']?([\w-]+)/i)?.[1] ??
            kopf.match(/@charset\s+["']([\w-]+)["']/i)?.[1] ??
            null;
        decoder = decoderFuer(meta);
    }
    if (decoder) return decoder.decode(body);
    const utf8 = new TextDecoder('utf-8').decode(body);
    // Ohne Angabe: viele Ersatzzeichen deuten auf Windows-1252 hin
    const ersatz = (utf8.match(/\uFFFD/g) || []).length;
    if (ersatz > 5) return new TextDecoder('windows-1252').decode(body);
    return utf8;
}

/* ------------------------------------------------------------------ */
/* Bilder                                                              */
/* ------------------------------------------------------------------ */

/** Bildtyp aus Content-Type oder (bei falschem Header) aus den ersten Bytes. */
export function bildTyp(contentType: string, b: Buffer): string | null {
    const angegeben = contentType.split(';')[0].trim();
    if (angegeben.startsWith('image/')) return angegeben;
    if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
    if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
    if (b.length > 6 && b.subarray(0, 4).toString('latin1') === 'GIF8') return 'image/gif';
    if (b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
    if (b.length > 4 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) return 'image/x-icon';
    const kopf = b.subarray(0, 1024).toString('utf8').trimStart();
    if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!doctype svg[^>]*>\s*)?<svg[\s>]/i.test(kopf)) return 'image/svg+xml';
    return null;
}

/** Pixelgrösse für PNG/GIF/ICO/JPEG (SVG/WebP: null = unbekannt). */
export function bildGroesse(b: Buffer): { w: number; h: number } | null {
    try {
        if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
        if (b.length > 10 && b.subarray(0, 4).toString('latin1') === 'GIF8') return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
        if (b.length > 8 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) return { w: b[6] || 256, h: b[7] || 256 };
        if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
            let i = 2;
            while (i + 9 < b.length) {
                if (b[i] !== 0xff) return null;
                const marker = b[i + 1];
                const laenge = b.readUInt16BE(i + 2);
                if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
                    return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
                }
                i += 2 + laenge;
            }
        }
    } catch {
        return null;
    }
    return null;
}
