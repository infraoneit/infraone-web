/**
 * Missbrauchsgrenzen der KI-Demo (Zähler in Blobs `limit/{tag}/{art}-{hash}`).
 *
 * - je IP 3 Scans pro Stunde
 * - je IP 2 Anrufe pro Stunde
 * - je Nummer 2 Anrufe pro Tag
 * - gesamt 30 Anrufe pro Tag
 *
 * IP und Nummer werden nur als Hash (mit DEMO_TOKEN gesalzen) gespeichert.
 * Ohne Transaktionen sind die Zähler bei gleichzeitigen Anfragen
 * näherungsweise — für eine Demo ausreichend.
 *
 * Testschalter: `DEMO_LIMITS_AUS=1` schaltet alle Limits ab — aber nur
 * lokal. Auf Netlify bleiben sie immer an (erkannt an NETLIFY, SITE_ID,
 * dem Blobs-Kontext oder der Lambda-Laufzeit).
 */
import { speicher } from './speicher';
import { hashe, MELDUNG, tagZuerich } from './api';

const STUNDE = 60 * 60 * 1000;
const TAG = 24 * STUNDE;

/** Läuft der Code auf Netlify (Build oder Function)? Im Zweifel: ja. */
export function aufNetlify(): boolean {
    const g = globalThis as { netlifyBlobsContext?: unknown };
    return !!(
        process.env.NETLIFY ||
        process.env.SITE_ID ||
        process.env.NETLIFY_BLOBS_CONTEXT ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        g.netlifyBlobsContext
    );
}

/** Limits aktiv? Nur lokal mit DEMO_LIMITS_AUS=1 abschaltbar. */
export function limitsAktiv(): boolean {
    return !(process.env.DEMO_LIMITS_AUS === '1' && !aufNetlify());
}

export const LIMITS = {
    scanProIpStunde: 3,
    anrufProIpStunde: 2,
    anrufProNummerTag: 2,
    anrufGesamtTag: 30,
} as const;

interface Regel {
    schluessel: string;
    max: number;
    fensterMs: number;
    meldung: string;
}

interface Zaehler {
    zeiten: number[];
    ablauf: number;
}

async function verletzt(regeln: Regel[]): Promise<Regel | null> {
    const jetzt = Date.now();
    for (const r of regeln) {
        const z = await speicher().lese<Zaehler>(r.schluessel);
        const aktiv = (z?.zeiten ?? []).filter((t) => jetzt - t < r.fensterMs);
        if (aktiv.length >= r.max) return r;
    }
    return null;
}

async function zaehle(regeln: Regel[]): Promise<void> {
    const jetzt = Date.now();
    for (const r of regeln) {
        const z = await speicher().lese<Zaehler>(r.schluessel);
        const aktiv = (z?.zeiten ?? []).filter((t) => jetzt - t < r.fensterMs);
        aktiv.push(jetzt);
        await speicher().schreibe(r.schluessel, { zeiten: aktiv, ablauf: jetzt + r.fensterMs + TAG });
    }
}

function scanRegeln(ip: string): Regel[] {
    return [
        {
            schluessel: `limit/${tagZuerich()}/scan-ip-${hashe('ip:' + ip)}`,
            max: LIMITS.scanProIpStunde,
            fensterMs: STUNDE,
            meldung: MELDUNG.limitScanIp,
        },
    ];
}

function anrufRegeln(ip: string, nummer: string): Regel[] {
    const tag = tagZuerich();
    return [
        { schluessel: `limit/${tag}/gesamt`, max: LIMITS.anrufGesamtTag, fensterMs: TAG, meldung: MELDUNG.limitGesamt },
        { schluessel: `limit/${tag}/anruf-ip-${hashe('ip:' + ip)}`, max: LIMITS.anrufProIpStunde, fensterMs: STUNDE, meldung: MELDUNG.limitAnrufIp },
        { schluessel: `limit/${tag}/nummer-${hashe('nr:' + nummer)}`, max: LIMITS.anrufProNummerTag, fensterMs: TAG, meldung: MELDUNG.limitNummer },
    ];
}

/** Prüft und zählt einen Scan. Liefert die Klartext-Meldung bei Überschreitung. */
export async function scanErlaubt(ip: string): Promise<string | null> {
    if (!limitsAktiv()) return null;
    const regeln = scanRegeln(ip);
    const r = await verletzt(regeln);
    if (r) return r.meldung;
    await zaehle(regeln);
    return null;
}

/** Prüft einen Anruf (ohne zu zählen). */
export async function anrufPruefen(ip: string, nummer: string): Promise<string | null> {
    if (!limitsAktiv()) return null;
    const r = await verletzt(anrufRegeln(ip, nummer));
    return r ? r.meldung : null;
}

/** Zählt einen angenommenen Anruf. */
export async function anrufZaehlen(ip: string, nummer: string): Promise<void> {
    if (!limitsAktiv()) return;
    await zaehle(anrufRegeln(ip, nummer));
}
