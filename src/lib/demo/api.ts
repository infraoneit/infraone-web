/**
 * Gemeinsame Hilfen der Demo-API-Routen (AUFTRAG-092).
 */
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { IpArt } from './typen';

export const KEIN_CACHE = { 'Cache-Control': 'no-store, max-age=0' };

export function antwort(daten: unknown, status = 200, kopf: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(daten), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...KEIN_CACHE, ...kopf },
    });
}

export function fehler(text: string, status: number): Response {
    return antwort({ fehler: text }, status);
}

/** Liest einen JSON-Körper mit Grössenlimit; null bei Fehler. */
export async function leseJson(req: Request, maxBytes = 10_000): Promise<Record<string, unknown> | null> {
    const laenge = Number(req.headers.get('content-length') || 0);
    if (laenge > maxBytes) return null;
    try {
        const text = await req.text();
        if (text.length > maxBytes) return null;
        const wert = JSON.parse(text);
        return wert && typeof wert === 'object' && !Array.isArray(wert) ? (wert as Record<string, unknown>) : null;
    } catch {
        return null;
    }
}

/** Client-IP (Netlify setzt x-nf-client-connection-ip). */
export function clientIp(req: Request): string {
    const nf = req.headers.get('x-nf-client-connection-ip');
    if (nf) return nf.trim();
    const xff = req.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    return req.headers.get('x-real-ip')?.trim() || 'lokal';
}

/** IPv6 in 8 Gruppen à 16 Bit (auch mit IPv4-Schwanz wie ::ffff:1.2.3.4); null, wenn keine IPv6. */
function ipv6Gruppen(s: string): number[] | null {
    if (isIP(s) !== 6) return null;
    let text = s;
    const v4 = text.match(/:(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (v4) {
        const b = v4[1].split('.').map(Number);
        text = `${text.slice(0, -v4[1].length)}${((b[0] << 8) | b[1]).toString(16)}:${((b[2] << 8) | b[3]).toString(16)}`;
    }
    const [links, rechts] = text.includes('::') ? text.split('::') : [text, null];
    const teil = (t: string) => (t ? t.split(':').map((g) => parseInt(g, 16)) : []);
    const a = teil(links);
    const z = rechts === null ? [] : teil(rechts);
    const gruppen = rechts === null ? a : [...a, ...new Array(8 - a.length - z.length).fill(0), ...z];
    return gruppen.length === 8 && gruppen.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? gruppen : null;
}

/**
 * AUFTRAG-103: Adresse normalisieren — Kleinbuchstaben, Klammern/Port und Zone-ID («%eth0»)
 * entfernen, IPv4-gemappte IPv6 (`::ffff:a.b.c.d`) als IPv4. Keine gültige Adresse (z. B. «lokal»)
 * → Art «unbekannt».
 */
export function normalisiereIp(roh: string): { ip: string; art: IpArt } {
    let s = String(roh ?? '').trim().toLowerCase();
    const klammer = s.match(/^\[([^\]]+)\](?::\d+)?$/);
    if (klammer) s = klammer[1];
    const v4Port = s.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (v4Port) s = v4Port[1];
    const zone = s.indexOf('%');
    if (zone >= 0) s = s.slice(0, zone);
    if (isIP(s) === 4) return { ip: s, art: 'v4' };
    const g = ipv6Gruppen(s);
    if (g) {
        if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
            return { ip: `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`, art: 'v4' };
        }
        return { ip: g.map((x) => x.toString(16)).join(':'), art: 'v6' };
    }
    return { ip: s || 'unbekannt', art: 'unbekannt' };
}

/**
 * AUFTRAG-103: Schlüssel der Adress-Limits. IPv6 → /64-Präfix (Mobilgeräte wechseln die
 * Temporäradresse innerhalb ihres /64), IPv4 → volle Adresse. Nur gehasht speichern/loggen.
 */
export function ipSchluessel(roh: string): string {
    const { ip, art } = normalisiereIp(roh);
    if (art !== 'v6') return ip;
    return `${ip.split(':').slice(0, 4).join(':')}::/64`;
}

/** Pseudonym für Zähler (IP/Nummer werden nie im Klartext gespeichert). */
export function hashe(wert: string): string {
    const salz = process.env.DEMO_TOKEN || 'infraone-demo';
    return createHash('sha256').update(`${salz}|${wert}`).digest('hex').slice(0, 24);
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Kryptografisch zufällige Zeichenkette [a-z0-9] (gleichverteilt). */
export function zufall(laenge: number): string {
    let s = '';
    for (let i = 0; i < laenge; i++) s += ALPHABET[randomInt(ALPHABET.length)];
    return s;
}

/** Prüft `Authorization: Bearer <DEMO_TOKEN>` zeitkonstant. */
export function pruefeBearer(req: Request): boolean {
    const token = process.env.DEMO_TOKEN;
    if (!token || token.length < 16) return false;
    const kopf = req.headers.get('authorization') || '';
    const m = kopf.match(/^Bearer\s+(.+)$/i);
    if (!m) return false;
    const a = Buffer.from(m[1].trim());
    const b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
}

function teileZuerich(d: Date) {
    const f = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Zurich',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    });
    const t = Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value]));
    return t as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string>;
}

/** ISO-8601 mit Zürcher Offset, z. B. 2026-10-22T10:15:00+02:00 */
export function isoZuerich(d = new Date()): string {
    const t = teileZuerich(d);
    const lokal = Date.UTC(+t.year, +t.month - 1, +t.day, +t.hour, +t.minute, +t.second);
    const offsetMin = Math.round((lokal - Math.floor(d.getTime() / 1000) * 1000) / 60000);
    const vz = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    return `${t.year}-${t.month}-${t.day}T${t.hour}:${t.minute}:${t.second}${vz}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** Kalendertag in Zürich, z. B. 20261022 */
export function tagZuerich(d = new Date()): string {
    const t = teileZuerich(d);
    return `${t.year}${t.month}${t.day}`;
}

/** Cloudflare Turnstile — nur aktiv, wenn Site-Key UND Secret gesetzt sind. */
export function turnstileAktiv(): boolean {
    return !!(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET);
}

export async function pruefeTurnstile(token: unknown, ip: string): Promise<boolean> {
    if (!turnstileAktiv()) return true;
    if (typeof token !== 'string' || !token || token.length > 2048) return false;
    try {
        const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET as string, response: token });
        if (ip && ip !== 'lokal') body.set('remoteip', ip);
        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body,
            signal: AbortSignal.timeout(5000),
        });
        const daten = (await res.json()) as { success?: boolean };
        return daten.success === true;
    } catch {
        return false;
    }
}

/* ------------------------------------------------------------------ */
/* Texte für Fehlermeldungen (an den Besucher)                         */
/* ------------------------------------------------------------------ */

export const MELDUNG = {
    urlUngueltig: 'Bitte geben Sie eine gültige Website-Adresse ein, z. B. muster-ag.ch.',
    urlGesperrt: 'Diese Adresse können wir nicht prüfen. Bitte geben Sie eine öffentliche Website ein.',
    nichtErreichbar: 'Diese Website konnten wir nicht erreichen. Prüfen Sie die Adresse oder versuchen Sie es gleich nochmals.',
    status: 'Diese Website antwortet nicht wie erwartet. Prüfen Sie die Adresse oder versuchen Sie eine andere Seite.',
    keinHtml: 'Unter dieser Adresse finden wir keine Webseite. Prüfen Sie die Adresse.',
    scanAbgelaufen: 'Ihr Assistent ist abgelaufen. Bitte geben Sie Ihre Website nochmals ein.',
    nummerFormat: 'Bitte geben Sie eine gültige Schweizer oder Liechtensteiner Telefonnummer ein.',
    nummerLand: 'Der Testanruf ist nur an Schweizer und Liechtensteiner Nummern möglich.',
    nummerSonderdienst: 'An Mehrwert- und Sondernummern können wir nicht anrufen.',
    einwilligung: 'Bitte bestätigen Sie, dass Sie den Testanruf erhalten möchten.',
    turnstile: 'Die Sicherheitsprüfung hat nicht geklappt. Bitte laden Sie die Seite neu.',
    allgemein: 'Das hat leider nicht geklappt. Bitte versuchen Sie es gleich nochmals.',
    limitScanIp: 'Sie haben in der letzten Stunde bereits drei Websites getestet. Bitte versuchen Sie es später wieder oder rufen Sie uns an: 052 222 18 18.',
    // AUFTRAG-103: Scan je Gerät oder Adresse und Tag (wortgleich)
    limitScanTag: 'Von diesem Gerät wurden heute bereits mehrere Websites getestet. Bitte versuchen Sie es morgen wieder oder rufen Sie uns an: 052 222 18 18.',
    // AUFTRAG-103: Anruf je Gerät oder Adresse und Tag (wortgleich; ersetzt die frühere Stunden-Meldung je Anschluss)
    limitAnrufGeraet: 'Von diesem Gerät wurden heute bereits zwei Testanrufe angefordert. Gerne zeigen wir Ihnen den Assistenten persönlich: 052 222 18 18.',
    limitNummer: 'Diese Nummer hat heute bereits zwei Testanrufe erhalten. Gerne zeigen wir Ihnen den Assistenten persönlich: 052 222 18 18.',
    limitGesamt: 'Für heute sind alle Testanrufe vergeben. Versuchen Sie es morgen wieder oder rufen Sie uns an: 052 222 18 18.',
} as const;
