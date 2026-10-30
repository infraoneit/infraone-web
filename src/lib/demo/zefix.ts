/**
 * Zefix-Client der KI-Demo (AUFTRAG-109): Abgleich mit dem Schweizer Handelsregister.
 *
 * Zwei Wege, gewählt über die Umgebung:
 * - Mit `ZEFIX_USER` UND `ZEFIX_PASSWORD`: offizielles API
 *   `https://www.zefix.admin.ch/ZefixPublicREST/api/v1` (Basic Auth;
 *   `POST /company/search` {name, activeOnly:false}, `GET /company/uid/{CHE…}`).
 *   Status dort `ACTIVE` | `BEING_CANCELLED` | `CANCELLED`, Löschdatum `deletionDate`.
 * - Sonst: Web-API der Zefix-Seite (ohne Login)
 *   `POST https://www.zefix.admin.ch/ZefixREST/api/v1/firm/search.json`
 *   Body {name, languageKey:"de", maxEntries}. Gemessen 30.10.2026 (Bericht A109):
 *   Namenssuche liefert Treffer ohne gelöschte Firmen; dieselbe Route mit `name` =
 *   UID («CHE-107.160.757» oder «CHE107160757») liefert genau den Eintrag, auch
 *   gelöschte (`status` «GELOESCHT», `deleteDate`). Kein Treffer → HTTP 404 mit
 *   `{"error":{"code":"API.ZFR.SEARCH.NORESULT"}}`. Status «EXISTIEREND»,
 *   «IN_AUFLOESUNG», «GELOESCHT».
 *
 * Zeitlimit je Aufruf 6 s, ein Wiederholungsversuch (nur bei Zeitüberschreitung,
 * Netzfehler oder HTTP 5xx). Jeder Aufruf schreibt eine Zeile ins Function-Log
 * (`[demo/zefix] …`) — ohne Suchbegriff, ohne Firmennamen, ohne Zugangsdaten.
 *
 * «Aktiv» heisst: Status EXISTIEREND (bzw. ACTIVE) und kein Löschdatum.
 */

export const ZEFIX_WEB_URL = 'https://www.zefix.admin.ch/ZefixREST/api/v1/firm/search.json';
export const ZEFIX_OFFIZIELL_BASIS = 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1';
export const ZEFIX_FRIST_MS = 6_000;
/** Pause vor dem einen Wiederholungsversuch */
export const ZEFIX_WIEDERHOLUNG_MS = 300;
/** Namenssuche: so viele Einträge holen und lokal nach Ähnlichkeit ordnen (die Web-Suche sortiert alphabetisch) */
export const ZEFIX_NAME_MAX = 20;
/** Höchstens so viele Treffer zeigt das Widget */
export const TREFFER_MAX = 5;

/** Rechtsformen laut `GET /ZefixREST/api/v1/legalForm.json` (gemessen 30.10.2026). */
export const RECHTSFORMEN: Record<number, string> = {
    1: 'Einzelunternehmen',
    2: 'Kollektivgesellschaft',
    3: 'Aktiengesellschaft',
    4: 'Gesellschaft mit beschränkter Haftung',
    5: 'Genossenschaft',
    6: 'Verein',
    7: 'Stiftung',
    8: 'Institut des öffentlichen Rechts',
    9: 'Zweigniederlassung',
    10: 'Kommanditgesellschaft',
    11: 'Zweigniederlassung einer ausländischen Gesellschaft',
    12: 'Kommanditaktiengesellschaft',
    13: 'Besondere Rechtsform',
    14: 'Gemeinderschaft',
    15: 'Investmentgesellschaft mit festem Kapital',
    16: 'Investmentgesellschaft mit variablem Kapital',
    17: 'Kommanditgesellschaft für kollektive Kapitalanlagen',
    18: 'Nichtkaufmännische Prokura',
};

/** Ein Eintrag im Handelsregister (vereinheitlicht aus beiden APIs). */
export interface ZefixTreffer {
    /** «CHE107160757» */
    uid: string;
    /** «CHE-107.160.757» */
    uid_formatiert: string;
    name: string;
    /** Rechtssitz (politische Gemeinde) */
    sitz: string;
    /** Status wie im Register (EXISTIEREND, IN_AUFLOESUNG, GELOESCHT bzw. ACTIVE, BEING_CANCELLED, CANCELLED) */
    status: string;
    /** Löschdatum oder null */
    loeschdatum: string | null;
    rechtsform: string | null;
    /** EXISTIEREND/ACTIVE und kein Löschdatum */
    aktiv: boolean;
}

export type ZefixApi = 'web' | 'offiziell';
export type ZefixArt = 'uid' | 'name';

export type ZefixErgebnis =
    | { ok: true; treffer: ZefixTreffer[]; api: ZefixApi; versuche: number; ms: number }
    | { ok: false; grund: 'nicht_erreichbar' | 'zugang' | 'antwort'; http: number | null; api: ZefixApi; versuche: number; ms: number };

export interface ZefixOptionen {
    /** Ersatz für fetch (Tests) */
    fetch?: typeof fetch;
    /** Frist je Versuch (Vorgabe 6 s) */
    fristMs?: number;
    /** Pause vor der Wiederholung (Vorgabe 300 ms) */
    pauseMs?: number;
    /** Spätester Zeitpunkt (Epoch-ms) für den Abschluss — kürzt die Frist */
    bis?: number;
    /** Kennung für das Log (z. B. Scan-Kennung, nur die ersten 10 Zeichen werden geloggt) */
    log?: string;
}

/* ------------------------------------------------------------------ */
/* UID                                                                 */
/* ------------------------------------------------------------------ */

const GEWICHTE = [5, 4, 3, 2, 7, 6, 5, 4];

/** Prüfziffer der UID (Modulo 11, eCH-0097); null = ungültige Nummer (Rest 10). */
export function uidPruefziffer(acht: string): number | null {
    if (!/^\d{8}$/.test(acht)) return null;
    const summe = GEWICHTE.reduce((s, g, i) => s + g * Number(acht[i]), 0);
    const p = 11 - (summe % 11);
    if (p === 11) return 0;
    if (p === 10) return null;
    return p;
}

/** «CHE-107.160.757», «CHE107160757», «che 107 160 757» → «CHE107160757»; null, wenn keine gültige UID. */
export function normalisiereUid(roh: string | null | undefined): string | null {
    if (!roh) return null;
    const m = String(roh)
        .trim()
        .match(/^CHE[\s ]*[-‐-―]?[\s ]*(\d{3})[.\s '’]?(\d{3})[.\s '’]?(\d{3})(?:[\s ]*(?:MWST|TVA|IVA|VAT|HR))?$/i);
    if (!m) return null;
    const ziffern = m[1] + m[2] + m[3];
    return uidPruefziffer(ziffern.slice(0, 8)) === Number(ziffern[8]) ? `CHE${ziffern}` : null;
}

/** «CHE107160757» → «CHE-107.160.757» */
export function formatiereUid(uid: string): string {
    const d = uid.replace(/\D/g, '');
    return d.length === 9 ? `CHE-${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}` : uid;
}

/** Sieht die Eingabe wie eine UID aus (auch mit falscher Prüfziffer)? */
export function siehtAusWieUid(s: string): boolean {
    return /^\s*CHE[\s ]*[-‐-―]?[\s ]*\d{3}[.\s '’]?\d{3}[.\s '’]?\d{3}\b/i.test(s);
}

const UID_IM_TEXT_RE = /(?<![A-Za-z0-9])CHE[\s ]*[-‐-―]?[\s ]*(\d{3})[.\s '’]?(\d{3})[.\s '’]?(\d{3})(?!\d)/gi;

/**
 * UIDs im Text (Impressum, Fusszeile, JSON-LD): «CHE-123.456.789», «CHE123456789»,
 * «CHE 123 456 789», mit Zusatz «MWST»/«TVA»/«IVA». Nur Nummern mit gültiger Prüfziffer,
 * in der Reihenfolge des ersten Vorkommens, ohne Dubletten, höchstens `max`.
 */
export function findeUids(text: string | string[] | null | undefined, max = 3): string[] {
    const teile = Array.isArray(text) ? text : [text ?? ''];
    const aus: string[] = [];
    for (const t of teile) {
        if (typeof t !== 'string' || !t) continue;
        for (const m of t.matchAll(UID_IM_TEXT_RE)) {
            const ziffern = m[1] + m[2] + m[3];
            if (uidPruefziffer(ziffern.slice(0, 8)) !== Number(ziffern[8])) continue;
            const uid = `CHE${ziffern}`;
            if (!aus.includes(uid)) aus.push(uid);
            if (aus.length >= max) return aus;
        }
    }
    return aus;
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

/** Prüfkriterium «aktiv» (AUFTRAG-109): EXISTIEREND (offiziell ACTIVE) und kein Löschdatum. */
export function istAktiv(status: string | null | undefined, loeschdatum: string | null | undefined): boolean {
    const s = String(status ?? '').toUpperCase();
    return (s === 'EXISTIEREND' || s === 'ACTIVE') && (loeschdatum === null || loeschdatum === undefined || loeschdatum === '');
}

/** Status für die Anzeige (Kleinschrift, Deutsch). */
export function statusText(status: string | null | undefined): string {
    switch (String(status ?? '').toUpperCase()) {
        case 'EXISTIEREND':
        case 'ACTIVE':
            return 'aktiv';
        case 'IN_AUFLOESUNG':
        case 'BEING_CANCELLED':
            return 'in Auflösung';
        case 'GELOESCHT':
        case 'CANCELLED':
            return 'gelöscht';
        default:
            return String(status ?? 'unbekannt').toLowerCase().replace(/_/g, ' ');
    }
}

/* ------------------------------------------------------------------ */
/* Antworten vereinheitlichen                                          */
/* ------------------------------------------------------------------ */

const txt = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const datum = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Eintrag des Web-API (search.json) → ZefixTreffer; null bei unbrauchbaren Daten. */
export function trefferAusWeb(x: unknown): ZefixTreffer | null {
    if (!x || typeof x !== 'object') return null;
    const o = x as Record<string, unknown>;
    const uid = normalisiereUid(txt(o.uid)) ?? normalisiereUid(txt(o.uidFormatted));
    const name = txt(o.name);
    if (!uid || !name) return null;
    const status = txt(o.status) || 'UNBEKANNT';
    const loeschdatum = datum(o.deleteDate);
    const form = typeof o.legalFormId === 'number' ? (RECHTSFORMEN[o.legalFormId] ?? null) : null;
    return { uid, uid_formatiert: formatiereUid(uid), name, sitz: txt(o.legalSeat), status, loeschdatum, rechtsform: form, aktiv: istAktiv(status, loeschdatum) };
}

/** Eintrag des offiziellen API (CompanyShort/CompanyFull) → ZefixTreffer. */
export function trefferAusOffiziell(x: unknown): ZefixTreffer | null {
    if (!x || typeof x !== 'object') return null;
    const o = x as Record<string, unknown>;
    const uid = normalisiereUid(txt(o.uid));
    const name = txt(o.name);
    if (!uid || !name) return null;
    const status = txt(o.status) || 'UNBEKANNT';
    const loeschdatum = datum(o.deletionDate);
    const lf = o.legalForm as { id?: unknown; name?: { de?: unknown } } | undefined;
    const form = lf && typeof lf === 'object' ? (txt(lf.name?.de) || (typeof lf.id === 'number' ? (RECHTSFORMEN[lf.id] ?? null) : null) || null) : null;
    return { uid, uid_formatiert: formatiereUid(uid), name, sitz: txt(o.legalSeat), status, loeschdatum, rechtsform: form, aktiv: istAktiv(status, loeschdatum) };
}

/* ------------------------------------------------------------------ */
/* Rangfolge der Namenssuche                                            */
/* ------------------------------------------------------------------ */

const RECHTSFORM_WORT_RE =
    /\b(?:ag|gmbh|sa|sàrl|sarl|sagl|klg|kg|ltd|llc|inc|genossenschaft|stiftung|verein|aktiengesellschaft|gesellschaft mit beschränkter haftung|in liquidation|en liquidation|in liquidazione|& co\.?)(?=\s|$|[,.;:)])/gi;

/** Vergleichsform: Kleinschrift, ohne Akzente, ohne Satzzeichen. */
export function vergleichsName(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/** Name ohne Rechtsform («Muster Holz AG» → «Muster Holz»). */
export function ohneRechtsform(s: string): string {
    return s.replace(RECHTSFORM_WORT_RE, ' ').replace(/[\s,;–-]+$/, '').replace(/\s{2,}/g, ' ').trim();
}

function woerter(s: string): Set<string> {
    return new Set(vergleichsName(ohneRechtsform(s)).split(' ').filter((w) => w.length >= 2));
}

/** Ähnlichkeit eines Treffers zum Suchnamen (höher = passender). */
export function aehnlichkeit(trefferName: string, such: string): number {
    const a = vergleichsName(trefferName);
    const b = vergleichsName(such);
    let p = 0;
    if (a === b) p += 100;
    else if (a.startsWith(b)) p += 60;
    else if (a.includes(b)) p += 30;
    const wa = woerter(trefferName);
    const wb = woerter(such);
    if (wa.size && wb.size) {
        let gemeinsam = 0;
        for (const w of wb) if (wa.has(w)) gemeinsam++;
        p += (gemeinsam / new Set([...wa, ...wb]).size) * 50 + (gemeinsam === wb.size ? 15 : 0);
    }
    return p;
}

/** Treffer nach Passung ordnen: Ähnlichkeit, dann aktive vor inaktiven, Hauptsitz vor Zweigniederlassung. */
export function ordneTreffer(treffer: ZefixTreffer[], such: string, max = TREFFER_MAX): ZefixTreffer[] {
    const punkte = (t: ZefixTreffer) => aehnlichkeit(t.name, such) + (t.aktiv ? 8 : 0) - (/^Zweigniederlassung/.test(t.rechtsform ?? '') ? 4 : 0);
    return treffer
        .map((t, i) => ({ t, i, p: punkte(t) }))
        .sort((x, y) => y.p - x.p || x.i - y.i)
        .slice(0, max)
        .map((x) => x.t);
}

/* ------------------------------------------------------------------ */
/* Aufruf                                                              */
/* ------------------------------------------------------------------ */

/** Offizielles API nur mit BEIDEN Variablen. */
export function zefixApi(): ZefixApi {
    return process.env.ZEFIX_USER && process.env.ZEFIX_PASSWORD ? 'offiziell' : 'web';
}

interface Anfrage {
    url: string;
    init: RequestInit;
    /** Antwort (Status, JSON) → Treffer; null = Antwort unbrauchbar */
    lies: (status: number, daten: unknown) => ZefixTreffer[] | null;
}

function webAnfrage(art: ZefixArt, wert: string): Anfrage {
    const body = art === 'uid' ? { name: formatiereUid(wert), languageKey: 'de', maxEntries: TREFFER_MAX } : { name: wert, languageKey: 'de', maxEntries: ZEFIX_NAME_MAX };
    return {
        url: ZEFIX_WEB_URL,
        init: { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) },
        lies: (status, daten) => {
            const d = daten as { list?: unknown; error?: { code?: unknown } } | null;
            if (status === 404 && d?.error?.code === 'API.ZFR.SEARCH.NORESULT') return [];
            if (status !== 200 || !d || !Array.isArray(d.list)) return null;
            return d.list.map(trefferAusWeb).filter((t): t is ZefixTreffer => !!t);
        },
    };
}

function offizielleAnfrage(art: ZefixArt, wert: string): Anfrage {
    const auth = 'Basic ' + Buffer.from(`${process.env.ZEFIX_USER}:${process.env.ZEFIX_PASSWORD}`, 'utf8').toString('base64');
    const kopf = { Accept: 'application/json', Authorization: auth };
    const lies = (status: number, daten: unknown) => {
        if (status === 404) return [];
        if (status !== 200 || !Array.isArray(daten)) return null;
        return daten.map(trefferAusOffiziell).filter((t): t is ZefixTreffer => !!t);
    };
    if (art === 'uid') return { url: `${ZEFIX_OFFIZIELL_BASIS}/company/uid/${encodeURIComponent(wert)}`, init: { method: 'GET', headers: kopf }, lies };
    return {
        url: `${ZEFIX_OFFIZIELL_BASIS}/company/search`,
        init: { method: 'POST', headers: { ...kopf, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: wert, activeOnly: false }) },
        lies,
    };
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

function zeile(api: ZefixApi, art: ZefixArt, ergebnis: string, http: number | null, anzahl: number, ms: number, versuch: number, log?: string): string {
    return `[demo/zefix] api=${api} art=${art} ergebnis=${ergebnis} http=${http ?? '-'} anzahl=${anzahl} ms=${ms} versuch=${versuch}${log ? ` scan=${log.slice(0, 10)}` : ''}`;
}

/**
 * Sucht im Handelsregister nach UID (`art` «uid», Wert «CHE…») oder Name.
 * Wirft nie. NORESULT → ok mit leerer Liste. 401/403 → «zugang». Andere 4xx oder
 * unlesbare Antwort → «antwort». Zeitüberschreitung/Netz/5xx nach der Wiederholung →
 * «nicht_erreichbar». Treffer der UID-Suche nur mit genau dieser UID.
 */
export async function zefixSuche(art: ZefixArt, wert: string, opt: ZefixOptionen = {}): Promise<ZefixErgebnis> {
    const api = zefixApi();
    const f = opt.fetch ?? globalThis.fetch;
    const frist = opt.fristMs ?? ZEFIX_FRIST_MS;
    const start = Date.now();
    const uid = art === 'uid' ? normalisiereUid(wert) : null;
    if (art === 'uid' && !uid) return { ok: true, treffer: [], api, versuche: 0, ms: 0 };
    const anfrage = api === 'offiziell' ? offizielleAnfrage(art, uid ?? wert) : webAnfrage(art, uid ?? wert);
    let letzterHttp: number | null = null;
    let versuche = 0;
    for (let versuch = 1; versuch <= 2; versuch++) {
        const t0 = Date.now();
        const rest = opt.bis ? opt.bis - t0 : frist;
        // Gesamtfrist fast abgelaufen: keinen Versuch mehr beginnen
        if (opt.bis && rest < 300) {
            console.warn(zeile(api, art, 'keine_zeit', letzterHttp, 0, 0, versuch, opt.log));
            break;
        }
        versuche = versuch;
        let http: number | null = null;
        try {
            const res = await f(anfrage.url, { ...anfrage.init, redirect: 'error', signal: AbortSignal.timeout(Math.min(frist, rest)) });
            http = res.status;
            letzterHttp = http;
            const daten = await res.json().catch(() => null);
            const ms = Date.now() - t0;
            if (http === 401 || http === 403) {
                console.warn(zeile(api, art, 'zugang', http, 0, ms, versuch, opt.log));
                return { ok: false, grund: 'zugang', http, api, versuche: versuch, ms: Date.now() - start };
            }
            if (http >= 500) {
                console.warn(zeile(api, art, 'fehler', http, 0, ms, versuch, opt.log));
            } else {
                const liste = anfrage.lies(http, daten);
                if (liste === null) {
                    console.warn(zeile(api, art, 'antwort', http, 0, ms, versuch, opt.log));
                    return { ok: false, grund: 'antwort', http, api, versuche: versuch, ms: Date.now() - start };
                }
                const treffer = uid ? liste.filter((t) => t.uid === uid) : liste;
                console.info(zeile(api, art, treffer.length ? 'treffer' : 'kein_treffer', http, treffer.length, ms, versuch, opt.log));
                return { ok: true, treffer, api, versuche: versuch, ms: Date.now() - start };
            }
        } catch (e) {
            const name = e instanceof Error ? e.name : '';
            console.warn(zeile(api, art, name === 'TimeoutError' || name === 'AbortError' ? 'zeit' : 'netz', http, 0, Date.now() - t0, versuch, opt.log));
        }
        if (versuch === 1) await pause(opt.pauseMs ?? ZEFIX_WIEDERHOLUNG_MS);
    }
    return { ok: false, grund: 'nicht_erreichbar', http: letzterHttp, api, versuche, ms: Date.now() - start };
}
