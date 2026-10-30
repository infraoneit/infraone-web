/**
 * Inhaltsfilter der KI-Demo vor jedem Abruf (AUFTRAG-112, P1) — serverseitig.
 *
 * Keine gesperrte Website wird je abgerufen. Zwei Stufen:
 * - Stufe A (statisch, ohne Netz, `istAufSperrliste`): Domainliste `SPERRDOMAINS` (auch jede
 *   Subdomain), Wortregel auf den Domain-Labels (Segmente an `-`, `_` und Ziffern; ein Segment gleich
 *   einem Wort aus `SPERRWOERTER`, oder `porn`/`xxx`/`hentai` irgendwo im Label) und gesperrte
 *   Endungen (`.xxx`, `.porn`, `.adult`, `.sex`, `.sexy`). Host klein, ohne `www.`/`www2.`, IDN als
 *   ASCII (`xn--`).
 * - Stufe B (Netz, `pruefeHostFreigabe`): Cloudflare for Families (DNS-over-HTTPS,
 *   family.cloudflare-dns.com, Kategorie Erwachseneninhalt/Malware). Antwort `0.0.0.0` (A) bzw. `::`
 *   (AAAA) = gesperrt. Zeitlimit 1500 ms, bei Fehler/Zeit einmal wiederholen; fehlt die Antwort nach
 *   zwei Versuchen: durchlassen (Stufe A gilt immer) und Journalzeile
 *   `[demo/sperre] filter nicht erreichbar host=<host>`. Zwischenspeicher im Prozess 24 h, höchstens
 *   5000 Einträge (ältester weg); ein Ausfall gilt 2 min (damit die übrigen Abrufe desselben Scans nicht je
 *   3 s auf den Filter warten), danach fragt die nächste Prüfung wieder. Kein Ausschalter.
 *
 * Journal bei Sperre: `[demo/sperre] host=<host> grund=liste|inhalt` (nur Host, keine URL, keine IP).
 *
 * `scanFreigegeben(scan)`: gespeicherte Scans, deren Host auf Stufe A gesperrt ist (z. B. vor diesem
 * Auftrag entstanden), weisen alle Routen ab, die einen Scan lesen.
 */
import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';

export type Freigabe = { ok: true } | { ok: false; grund: 'liste' | 'inhalt' };

/** Gesperrte Domains (registrierbarer Name; jede Subdomain ist mitgesperrt). */
export const SPERRDOMAINS: readonly string[] = [
    'pornhub.com',
    'pornhub.org',
    'xvideos.com',
    'xnxx.com',
    'xhamster.com',
    'redtube.com',
    'youporn.com',
    'tube8.com',
    'spankbang.com',
    'eporner.com',
    'tnaflix.com',
    'brazzers.com',
    'onlyfans.com',
    'chaturbate.com',
    'stripchat.com',
    'livejasmin.com',
    'bongacams.com',
    'cam4.com',
    'xhamsterlive.com',
    'pornhat.com',
    'beeg.com',
    'youjizz.com',
    'porntrex.com',
    'hqporner.com',
    'motherless.com',
    'rule34.xxx',
    'e-hentai.org',
    'nhentai.net',
    'fapello.com',
    'erome.com',
    'thothub.to',
    'sex.com',
];

/** Wörter, die als ganzes Segment eines Domain-Labels sperren (Segmente an `-`, `_` und Ziffern). */
export const SPERRWOERTER: readonly string[] = [
    'porn', 'porno', 'pornos', 'xxx', 'sex', 'sexy', 'sexshop', 'sexchat', 'sexcam', 'sexcams', 'erotik', 'erotic',
    'erotica', 'hentai', 'camgirl', 'camgirls', 'escort', 'escorts', 'nutten', 'hure', 'huren', 'fick', 'ficken',
    'milf', 'bdsm', 'fetisch', 'fetish', 'nude', 'nudes', 'nackt', 'nacktbilder', 'pussy', 'dildo', 'dildos',
];

/** Zeichenfolgen, die irgendwo im Label sperren. */
export const SPERR_TEILE: readonly string[] = ['porn', 'xxx', 'hentai'];

/** Endungen, die immer gesperrt sind. */
export const SPERR_ENDUNGEN: readonly string[] = ['xxx', 'porn', 'adult', 'sex', 'sexy'];

const DOMAINS = new Set(SPERRDOMAINS);
const WOERTER = new Set(SPERRWOERTER);
const ENDUNGEN = new Set(SPERR_ENDUNGEN);

/** Host klein, ohne Klammern und Punkt am Ende, IDN als ASCII (`xn--`); www bleibt. */
export function asciiHost(host: string | null | undefined): string {
    let h = String(host ?? '')
        .trim()
        .toLowerCase()
        .replace(/^\[|\]$/g, '')
        .replace(/\.+$/, '');
    if (!h) return '';
    if (/[^\x00-\x7f]/.test(h)) h = domainToASCII(h) || h;
    return h;
}

/**
 * Host für den Vergleich (Stufe A): wie `asciiHost`, dazu ohne `www.`/`www2.` vorne.
 * Leere Zeichenkette, wenn der Host leer ist.
 */
export function hostFuerSperre(host: string | null | undefined): string {
    return asciiHost(host).replace(/^www2?\./, '');
}

/** Stufe A (statisch, ohne Netz): Liste, Wortregel, Endung. */
export function istAufSperrliste(host: string | null | undefined): boolean {
    const h = hostFuerSperre(host);
    if (!h) return false;
    const labels = h.split('.').filter(Boolean);
    if (!labels.length) return false;
    // Endung
    if (labels.length >= 2 && ENDUNGEN.has(labels[labels.length - 1])) return true;
    // registrierbarer Name und jede Subdomain: «a.b.pornhub.com» → «a.b.pornhub.com», «b.pornhub.com», «pornhub.com»
    for (let i = 0; i < labels.length - 1; i++) {
        if (DOMAINS.has(labels.slice(i).join('.'))) return true;
    }
    // Wortregel auf allen Labels ausser der Endung
    for (const label of labels.slice(0, -1)) {
        if (SPERR_TEILE.some((t) => label.includes(t))) return true;
        if (label.split(/[-_0-9]+/).some((segment) => WOERTER.has(segment))) return true;
    }
    return false;
}

/* ------------------------------------------------------------------ */
/* Stufe B: Cloudflare for Families (DNS-over-HTTPS)                   */
/* ------------------------------------------------------------------ */

export const FAMILY_DOH = 'https://family.cloudflare-dns.com/dns-query';
export const FILTER_ZEIT_MS = 1500;
export const FILTER_CACHE_MS = 24 * 60 * 60 * 1000;
export const FILTER_CACHE_MAX = 5000;
/** Filter nicht erreichbar: so lange gilt «durchlassen» für diesen Host, dann wird wieder gefragt. */
export const FILTER_AUSFALL_MS = 2 * 60 * 1000;

/**
 * Antwort von Cloudflare for Families (application/dns-json) auswerten: true = gesperrt
 * (`Status` 0 und ein `Answer`-Eintrag mit `0.0.0.0` bzw. `::`). Alles andere (NXDOMAIN, leer,
 * kaputt) = frei.
 */
export function parseFamilyAntwort(json: unknown): boolean {
    if (!json || typeof json !== 'object') return false;
    const j = json as { Status?: unknown; Answer?: unknown };
    if (j.Status !== 0 || !Array.isArray(j.Answer)) return false;
    return j.Answer.some((a) => {
        const data = a && typeof a === 'object' ? String((a as { data?: unknown }).data ?? '').trim() : '';
        return data === '0.0.0.0' || data === '::';
    });
}

const zwischenspeicher = new Map<string, { freigabe: Freigabe; bis: number }>();

function merke(host: string, freigabe: Freigabe, jetzt: number, dauer = FILTER_CACHE_MS): void {
    if (zwischenspeicher.has(host)) zwischenspeicher.delete(host);
    while (zwischenspeicher.size >= FILTER_CACHE_MAX) {
        const aeltester = zwischenspeicher.keys().next().value;
        if (aeltester === undefined) break;
        zwischenspeicher.delete(aeltester);
    }
    zwischenspeicher.set(host, { freigabe, bis: jetzt + dauer });
}

/** Nur für Tests: Zwischenspeicher leeren bzw. Grösse lesen. */
export function filterZwischenspeicher(): { leeren: () => void; groesse: () => number } {
    return { leeren: () => zwischenspeicher.clear(), groesse: () => zwischenspeicher.size };
}

/** Eine Abfrage beim Filter; null = keine verwertbare Antwort (Fehler, Zeit, kein JSON). */
async function frageFilter(host: string): Promise<boolean | null> {
    try {
        const res = await fetch(`${FAMILY_DOH}?name=${encodeURIComponent(host)}&type=A`, {
            headers: { accept: 'application/dns-json' },
            signal: AbortSignal.timeout(FILTER_ZEIT_MS),
        });
        if (!res.ok) return null;
        return parseFamilyAntwort(await res.json());
    } catch {
        return null;
    }
}

/** Stufe A mit Journalzeile bei Sperre. */
export function pruefeSperrliste(host: string): Freigabe {
    if (!istAufSperrliste(host)) return { ok: true };
    console.info(`[demo/sperre] host=${hostFuerSperre(host)} grund=liste`);
    return { ok: false, grund: 'liste' };
}

/**
 * Freigabe eines Hosts vor dem Abruf: Stufe A, dann Stufe B (Cloudflare for Families, 1500 ms, eine
 * Wiederholung, 24 h Zwischenspeicher). Filter nicht erreichbar → durchlassen (2 min gemerkt) + Journalzeile.
 * IP-Adressen haben keinen Namen für den Filter (Stufe A und der SSRF-Schutz in netz.ts gelten).
 */
export async function pruefeHostFreigabe(hostAscii: string, jetzt = Date.now()): Promise<Freigabe> {
    const a = pruefeSperrliste(hostAscii);
    if (!a.ok) return a;
    const host = asciiHost(hostAscii);
    if (!host || isIP(host)) return { ok: true };
    const da = zwischenspeicher.get(host);
    if (da && da.bis > jetzt) {
        if (!da.freigabe.ok) console.info(`[demo/sperre] host=${host} grund=inhalt`);
        return da.freigabe;
    }
    let gesperrt = await frageFilter(host);
    if (gesperrt === null) gesperrt = await frageFilter(host);
    if (gesperrt === null) {
        console.warn(`[demo/sperre] filter nicht erreichbar host=${host}`);
        merke(host, { ok: true }, jetzt, FILTER_AUSFALL_MS);
        return { ok: true };
    }
    const freigabe: Freigabe = gesperrt ? { ok: false, grund: 'inhalt' } : { ok: true };
    merke(host, freigabe, jetzt);
    if (!freigabe.ok) console.info(`[demo/sperre] host=${host} grund=inhalt`);
    return freigabe;
}

/**
 * Gespeicherter Scan freigegeben? Nein, wenn sein Host (bzw. der End-Host) auf Stufe A gesperrt ist —
 * so laufen auch Scans, die vor AUFTRAG-112 entstanden sind, nicht weiter.
 */
export function scanFreigegeben(scan: { extrakt?: { host?: string | null; end_url?: string | null } | null } | null | undefined): boolean {
    if (!scan) return false;
    const x = scan.extrakt ?? {};
    const hosts: string[] = [];
    if (x.host) hosts.push(x.host);
    if (x.end_url) {
        try {
            hosts.push(new URL(x.end_url).hostname);
        } catch {
            /* ohne End-Adresse */
        }
    }
    return !hosts.some((h) => istAufSperrliste(h));
}

/** Für den Abrufpfad (netz.ts, Option `hostFreigabe`, vor jedem Hop): true = darf geladen werden. */
export async function hostFreigegeben(hostAscii: string): Promise<boolean> {
    return (await pruefeHostFreigabe(hostAscii)).ok;
}
