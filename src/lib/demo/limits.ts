/**
 * Missbrauchsgrenzen der KI-Demo (Zähler in Blobs `limit/…`), neu gefasst in AUFTRAG-103.
 *
 * Scans:  je Gerät 8 pro Tag und 3 pro Stunde · je Adresse 10 pro Tag und 3 pro Stunde
 * Anrufe: gesamt 30 pro Tag · je Gerät 2 pro Tag · je Adresse 2 pro Tag · je Nummer 2 pro Tag
 *
 * Reihenfolge der Prüfung: gesamt → Gerät → Adresse → Nummer; innerhalb von Gerät bzw. Adresse
 * zuerst der Tag, dann die Stunde (ist das Tageslimit erreicht, stimmt nur die Meldung «morgen»).
 *
 * - «Tag» = Kalendertag in Zürich: Schlüssel `limit/{YYYYMMDD}/…`, gezählt werden nur Zeiten
 *   desselben Zürcher Tags (auch an Tagen mit 23 oder 25 Stunden).
 * - «Stunde» = gleitende 60 Minuten: Schlüssel `limit/stunde/…` (kein Neubeginn um Mitternacht).
 * - Gerät = Hash der Kennung aus dem signierten Cookie `demo_geraet` (lib/demo/geraet.ts).
 * - Adresse = Hash von `ipSchluessel()`: IPv6 → /64-Präfix (wechselnde Temporäradressen eines
 *   Mobilgeräts landen im selben Zähler), IPv4 → volle Adresse.
 * - Nummer = Hash der E.164-Nummer.
 *
 * Adresse, Gerät und Nummer werden nur als Hash (mit DEMO_TOKEN gesalzen) gespeichert und
 * geloggt (8 Zeichen): `[demo/limit] angenommen|abgewiesen art=scan|anruf regel=<name>
 * ip_art=v4|v6 ip=<hash8> geraet=<hash8> nummer=<hash8>`.
 * Ohne Transaktionen sind die Zähler bei gleichzeitigen Anfragen näherungsweise — für eine Demo
 * ausreichend.
 *
 * Testschalter: `DEMO_LIMITS_AUS=1` schaltet alle Limits ab — aber nur lokal. Auf Netlify
 * bleiben sie immer an (erkannt an NETLIFY, SITE_ID, dem Blobs-Kontext oder der Lambda-Laufzeit).
 */
import { speicher } from './speicher';
import { hashe, ipSchluessel, MELDUNG, normalisiereIp, tagZuerich } from './api';
import type { IpArt } from './typen';

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
    scanProGeraetTag: 8,
    scanProGeraetStunde: 3,
    scanProIpTag: 10,
    scanProIpStunde: 3,
    anrufGesamtTag: 30,
    anrufProGeraetTag: 2,
    anrufProIpTag: 2,
    anrufProNummerTag: 2,
} as const;

export type RegelName = 'gesamt' | 'geraet_tag' | 'geraet_stunde' | 'ip_tag' | 'ip_stunde' | 'nummer_tag';

export interface Regel {
    name: RegelName;
    schluessel: string;
    max: number;
    fenster: 'tag' | 'stunde';
    /** Zürcher Kalendertag (YYYYMMDD) der Prüfung */
    tag: string;
    meldung: string;
}

/** Abweisung: Name der Regel (Log/Tests) und Klartext für den Besucher. */
export interface Entscheid {
    regel: RegelName;
    meldung: string;
}

/** Pseudonyme einer Anfrage (nie Klartext). */
export interface Pseudonyme {
    /** Hash von ipSchluessel(ip) (IPv6: /64) */
    ip_hash: string;
    ip_art: IpArt;
    /** Hash der Gerätekennung */
    geraet_hash: string;
    /** Hash der E.164-Nummer (nur beim Anruf) */
    nummer_hash: string | null;
}

interface Zaehler {
    zeiten: number[];
    ablauf: number;
}

export function pseudonyme(d: { ip: string; geraetHash: string; nummer?: string | null }): Pseudonyme {
    return {
        ip_hash: hashe('ip:' + ipSchluessel(d.ip)),
        ip_art: normalisiereIp(d.ip).art,
        geraet_hash: d.geraetHash,
        nummer_hash: d.nummer ? hashe('nr:' + d.nummer) : null,
    };
}

/** Log-Zeile je Entscheid — nur Hash-Präfixe (8 Zeichen), nie Adresse oder Nummer im Klartext. */
export function limitZeile(entscheid: 'angenommen' | 'abgewiesen', art: 'scan' | 'anruf', regel: string, p: Pseudonyme): string {
    const kurz = (h: string | null) => (h ? h.slice(0, 8) : '-');
    return `[demo/limit] ${entscheid} art=${art} regel=${regel} ip_art=${p.ip_art} ip=${kurz(p.ip_hash)} geraet=${kurz(p.geraet_hash)} nummer=${kurz(p.nummer_hash)}`;
}

function aktiveZeiten(z: Zaehler | null, r: Regel, jetzt: number): number[] {
    const zeiten = Array.isArray(z?.zeiten) ? z.zeiten.filter((t) => typeof t === 'number' && Number.isFinite(t)) : [];
    if (r.fenster === 'stunde') return zeiten.filter((t) => jetzt - t < STUNDE);
    return zeiten.filter((t) => tagZuerich(new Date(t)) === r.tag);
}

/** Erste verletzte Regel in der vorgegebenen Reihenfolge (Zähler parallel gelesen). */
async function ersteVerletzte(regeln: Regel[], jetzt: number): Promise<Regel | null> {
    const werte = await Promise.all(regeln.map((r) => speicher().lese<Zaehler>(r.schluessel)));
    for (let i = 0; i < regeln.length; i++) {
        if (aktiveZeiten(werte[i], regeln[i], jetzt).length >= regeln[i].max) return regeln[i];
    }
    return null;
}

async function zaehle(regeln: Regel[], jetzt: number): Promise<void> {
    await Promise.all(
        regeln.map(async (r) => {
            const aktiv = aktiveZeiten(await speicher().lese<Zaehler>(r.schluessel), r, jetzt);
            aktiv.push(jetzt);
            await speicher().schreibe(r.schluessel, { zeiten: aktiv, ablauf: jetzt + (r.fenster === 'stunde' ? STUNDE : TAG) + TAG });
        }),
    );
}

/** Regeln eines Scans: Gerät (Tag, Stunde) → Adresse (Tag, Stunde). */
export function scanRegeln(p: Pseudonyme, jetzt = new Date()): Regel[] {
    const tag = tagZuerich(jetzt);
    return [
        { name: 'geraet_tag', schluessel: `limit/${tag}/scan-geraet-${p.geraet_hash}`, max: LIMITS.scanProGeraetTag, fenster: 'tag', tag, meldung: MELDUNG.limitScanTag },
        { name: 'geraet_stunde', schluessel: `limit/stunde/scan-geraet-${p.geraet_hash}`, max: LIMITS.scanProGeraetStunde, fenster: 'stunde', tag, meldung: MELDUNG.limitScanIp },
        { name: 'ip_tag', schluessel: `limit/${tag}/scan-ip-${p.ip_hash}`, max: LIMITS.scanProIpTag, fenster: 'tag', tag, meldung: MELDUNG.limitScanTag },
        { name: 'ip_stunde', schluessel: `limit/stunde/scan-ip-${p.ip_hash}`, max: LIMITS.scanProIpStunde, fenster: 'stunde', tag, meldung: MELDUNG.limitScanIp },
    ];
}

/** Regeln eines Anrufs: gesamt → Gerät → Adresse → Nummer (alle je Zürcher Tag). */
export function anrufRegeln(p: Pseudonyme, jetzt = new Date()): Regel[] {
    const tag = tagZuerich(jetzt);
    const regeln: Regel[] = [
        { name: 'gesamt', schluessel: `limit/${tag}/gesamt`, max: LIMITS.anrufGesamtTag, fenster: 'tag', tag, meldung: MELDUNG.limitGesamt },
        { name: 'geraet_tag', schluessel: `limit/${tag}/anruf-geraet-${p.geraet_hash}`, max: LIMITS.anrufProGeraetTag, fenster: 'tag', tag, meldung: MELDUNG.limitAnrufGeraet },
        { name: 'ip_tag', schluessel: `limit/${tag}/anruf-ip-${p.ip_hash}`, max: LIMITS.anrufProIpTag, fenster: 'tag', tag, meldung: MELDUNG.limitAnrufGeraet },
    ];
    if (p.nummer_hash) {
        regeln.push({ name: 'nummer_tag', schluessel: `limit/${tag}/nummer-${p.nummer_hash}`, max: LIMITS.anrufProNummerTag, fenster: 'tag', tag, meldung: MELDUNG.limitNummer });
    }
    return regeln;
}

/** Prüft und zählt einen Scan. Liefert die Abweisung (Regel + Klartext) oder null. */
export async function scanErlaubt(p: Pseudonyme, jetzt = new Date()): Promise<Entscheid | null> {
    if (!limitsAktiv()) {
        console.info(limitZeile('angenommen', 'scan', 'aus', p));
        return null;
    }
    const regeln = scanRegeln(p, jetzt);
    const r = await ersteVerletzte(regeln, jetzt.getTime());
    if (r) {
        console.info(limitZeile('abgewiesen', 'scan', r.name, p));
        return { regel: r.name, meldung: r.meldung };
    }
    await zaehle(regeln, jetzt.getTime());
    console.info(limitZeile('angenommen', 'scan', '-', p));
    return null;
}

/** Prüft einen Anruf (ohne zu zählen). */
export async function anrufPruefen(p: Pseudonyme, jetzt = new Date()): Promise<Entscheid | null> {
    if (!limitsAktiv()) return null;
    const r = await ersteVerletzte(anrufRegeln(p, jetzt), jetzt.getTime());
    if (!r) return null;
    console.info(limitZeile('abgewiesen', 'anruf', r.name, p));
    return { regel: r.name, meldung: r.meldung };
}

/** Zählt einen angenommenen Anruf (vor dem Anstoss, AUFTRAG-103); wirft bei Speicherfehlern. */
export async function anrufZaehlen(p: Pseudonyme, jetzt = new Date()): Promise<void> {
    if (!limitsAktiv()) {
        console.info(limitZeile('angenommen', 'anruf', 'aus', p));
        return;
    }
    await zaehle(anrufRegeln(p, jetzt), jetzt.getTime());
    console.info(limitZeile('angenommen', 'anruf', '-', p));
}
