/**
 * Gerätekennung der KI-Demo (AUFTRAG-103).
 *
 * Cookie `demo_geraet` = `<kennung>.<signatur>`:
 * - kennung: 16 Zufallsbytes, base64url (22 Zeichen)
 * - signatur: HMAC-SHA256 über «geraet:<kennung>», Schlüssel DEMO_TOKEN (Rückfall wie
 *   `hashe()`), base64url (43 Zeichen)
 * - `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` 400 Tage, `Secure` auf Netlify.
 *
 * Gesetzt mit der ersten Antwort von POST /api/demo/scan; fehlt es bei POST /api/demo/anruf,
 * setzt die Anruf-Route es. Fehlt das Cookie oder stimmt die Signatur nicht, gilt es als nicht
 * vorhanden: Die Anfrage bekommt eine neue Kennung (und das Cookie dazu). Wer das Cookie löscht,
 * läuft weiter in die Adress-Limits (lib/demo/limits.ts).
 *
 * Gespeichert und geloggt wird nur der Hash der Kennung (`hashe('geraet:' + kennung)`).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { hashe } from './api';
import { aufNetlify } from './limits';

export const GERAET_COOKIE = 'demo_geraet';
/** 400 Tage (Obergrenze der Browser für Max-Age) */
export const GERAET_MAX_AGE_S = 400 * 24 * 60 * 60;

const KENNUNG_RE = /^[A-Za-z0-9_-]{22}$/;
const SIGNATUR_RE = /^[A-Za-z0-9_-]{43}$/;

function signatur(kennung: string): string {
    const schluessel = process.env.DEMO_TOKEN || 'infraone-demo';
    return createHmac('sha256', schluessel).update(`geraet:${kennung}`).digest('base64url');
}

/** Neue Kennung: 16 Zufallsbytes base64url. */
export function neueGeraetKennung(): string {
    return randomBytes(16).toString('base64url');
}

/** Cookie-Wert `<kennung>.<signatur>`. */
export function signiereGeraet(kennung: string): string {
    return `${kennung}.${signatur(kennung)}`;
}

/** Prüft einen Cookie-Wert; liefert die Kennung nur bei gültiger Signatur, sonst null. */
export function pruefeGeraetWert(wert: string | null | undefined): string | null {
    if (!wert || wert.length > 100) return null;
    const teile = wert.split('.');
    if (teile.length !== 2) return null;
    const [kennung, sig] = teile;
    if (!KENNUNG_RE.test(kennung) || !SIGNATUR_RE.test(sig)) return null;
    const a = Buffer.from(sig);
    const b = Buffer.from(signatur(kennung));
    return a.length === b.length && timingSafeEqual(a, b) ? kennung : null;
}

/** Liest ein Cookie aus dem Kopf `Cookie` (erstes Vorkommen). */
export function leseCookie(req: Request, name: string): string | null {
    const kopf = req.headers.get('cookie');
    if (!kopf) return null;
    for (const teil of kopf.split(';')) {
        const i = teil.indexOf('=');
        if (i < 0) continue;
        if (teil.slice(0, i).trim() === name) return teil.slice(i + 1).trim();
    }
    return null;
}

export interface Geraet {
    kennung: string;
    /** true = Cookie fehlte oder war ungültig → Antwort setzt das Cookie */
    neu: boolean;
    /** Pseudonym für Zähler und Log */
    hash: string;
}

export function geraetHash(kennung: string): string {
    return hashe(`geraet:${kennung}`);
}

/** Gerät der Anfrage: gültiges Cookie oder eine neue Kennung. */
export function geraetAusAnfrage(req: Request): Geraet {
    const vorhanden = pruefeGeraetWert(leseCookie(req, GERAET_COOKIE));
    const kennung = vorhanden ?? neueGeraetKennung();
    return { kennung, neu: !vorhanden, hash: geraetHash(kennung) };
}

/** Kopf `Set-Cookie` für eine Kennung. */
export function geraetCookieKopf(kennung: string, sicher = aufNetlify()): string {
    return `${GERAET_COOKIE}=${signiereGeraet(kennung)}; Path=/; Max-Age=${GERAET_MAX_AGE_S}; HttpOnly; SameSite=Lax${sicher ? '; Secure' : ''}`;
}

/** Hängt das Cookie an die Antwort, wenn die Anfrage keine gültige Kennung mitbrachte. */
export function mitGeraetCookie(res: Response, g: Geraet): Response {
    if (g.neu) res.headers.append('Set-Cookie', geraetCookieKopf(g.kennung));
    return res;
}
