/**
 * Handelsregister-Prüfung vor dem Testanruf (AUFTRAG-109), serverseitig.
 *
 * Ablauf je Scan:
 * 1. Automatisch: UID aus dem Impressum (`extrakt.uid_kandidaten`, höchstens 3) → Zefix nach UID;
 *    ohne aktiven Treffer Namenssuche mit Varianten (Firmenname mit Rechtsform aus dem Text,
 *    Profil-Firma, ohne Rechtsform, erste zwei Wörter; höchstens 3 Abfragen).
 * 2. Manuell: «Firmenname oder UID», höchstens 3 Suchen je Scan (MANUELL_MAX).
 * 3. Bestätigen: nur ein aktiver Eintrag, der diesem Scan als Treffer gezeigt wurde. Dann
 *    entsteht ein signierter Nachweis (HMAC-SHA256 wie Cookie `demo_geraet`, Schlüssel
 *    DEMO_TOKEN), gebunden an scan_id + UID, gültig 30 Minuten.
 * 4. POST /api/demo/anruf prüft den Nachweis (nachweisFuerAnruf) — ohne gültigen Nachweis 403.
 *
 * Speicher: `handelsregister/{scan_id}` (Lebensdauer wie der Scan, 2 h): Ergebnisse jeder
 * Abfrage (Wiederholungen erzeugen keine neuen Register-Aufrufe), gezeigte Treffer, Zahl der
 * manuellen Suchen, Zahl der Zefix-Aufrufe und die Bestätigung samt Nachweis. Eigener
 * Schlüssel, weil der Profil-Schritt `scan/{id}` parallel neu schreibt.
 *
 * Schutz des Registers: nach «nicht erreichbar» 15 s Pause je Scan (keine neuen Aufrufe), höchstens
 * 30 Zefix-Aufrufe je Scan (inkl. Wiederholungen).
 *
 * Schalter `DEMO_HANDELSREGISTER`: `streng` (Vorgabe; Register nicht erreichbar → kein
 * Testanruf) oder `aus` (Prüfung übersprungen; nur lokal — auf Netlify gilt immer `streng`,
 * wie bei DEMO_LIMITS_AUS).
 *
 * Journal: je Zefix-Aufruf eine Zeile `[demo/zefix] …` (lib/demo/zefix.ts), je Prüfung eine
 * Zeile `[demo/handelsregister] …` mit der Zahl der Aufrufe — ohne Suchbegriffe.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { leseGueltig, speicher } from './speicher';
import { isoZuerich } from './api';
import { aufNetlify } from './limits';
import {
    findeUids,
    normalisiereUid,
    ohneRechtsform,
    ordneTreffer,
    siehtAusWieUid,
    statusText,
    TREFFER_MAX,
    vergleichsName,
    zefixSuche,
    type ZefixOptionen,
    type ZefixTreffer,
} from './zefix';
import { HR_CODE_ABGELAUFEN, HR_CODE_FEHLT, HR_TEXT, MANUELL_MAX, type HrAntwort, type HrErgebnis, type HrModus, type HrQuelle, type HrTrefferAnzeige } from './handelsregister-texte';
import type { Extrakt, HandelsregisterAuftrag, Profil } from './typen';

/** Gültigkeit des Nachweises nach der Bestätigung */
export const NACHWEIS_TTL_MS = 30 * 60 * 1000;
/** Gesamtfrist einer Prüfung (alle Zefix-Aufrufe zusammen; die Route darf 26 s laufen) */
export const PRUEFUNG_FRIST_MS = 20_000;
/** Nach «nicht erreichbar» so lange keine neuen Register-Aufrufe für diesen Scan */
export const NICHT_ERREICHBAR_PAUSE_MS = 15_000;
/** Obergrenze der Zefix-Aufrufe je Scan (inkl. Wiederholungen) — schützt das Register vor Schleifen */
export const ZEFIX_MAX_JE_SCAN = 30;
/** Höchstens so viele UID- bzw. Namensabfragen bei der automatischen Prüfung */
export const AUTO_UID_MAX = 3;
export const AUTO_NAME_MAX = 3;

/* ------------------------------------------------------------------ */
/* Schalter                                                            */
/* ------------------------------------------------------------------ */

let warnungAus = false;

/** `streng` (Vorgabe) oder `aus` (nur ausserhalb von Netlify wirksam). */
export function handelsregisterModus(): HrModus {
    const w = String(process.env.DEMO_HANDELSREGISTER ?? '')
        .trim()
        .toLowerCase();
    if (w !== 'aus') return 'streng';
    if (aufNetlify()) {
        if (!warnungAus) console.warn('[demo/handelsregister] DEMO_HANDELSREGISTER=aus wird auf Netlify ignoriert (streng)');
        warnungAus = true;
        return 'streng';
    }
    return 'aus';
}

/* ------------------------------------------------------------------ */
/* Nachweis (signiert, an scan_id + UID gebunden, 30 min)              */
/* ------------------------------------------------------------------ */

const NACHWEIS_RE = /^(CHE\d{9})\.(\d{13})\.([A-Za-z0-9_-]{43})$/;

function nachweisSignatur(scanId: string, uid: string, bis: number): string {
    const schluessel = process.env.DEMO_TOKEN || 'infraone-demo';
    return createHmac('sha256', schluessel).update(`handelsregister:${scanId}:${uid}:${bis}`).digest('base64url');
}

/** Nachweis `<uid>.<bis>.<signatur>`; bis = Epoch-ms des Ablaufs. */
export function signiereNachweis(scanId: string, uid: string, bis: number): string {
    return `${uid}.${bis}.${nachweisSignatur(scanId, uid, bis)}`;
}

export type NachweisPruefung = { ok: true; uid: string; bis: number } | { ok: false; grund: 'fehlt' | 'format' | 'signatur' | 'abgelaufen' };

/** Prüft Signatur (scan_id + UID + Ablauf) und Ablauf. */
export function pruefeNachweis(wert: string | null | undefined, scanId: string, jetzt = Date.now()): NachweisPruefung {
    if (!wert) return { ok: false, grund: 'fehlt' };
    const m = String(wert).match(NACHWEIS_RE);
    if (!m) return { ok: false, grund: 'format' };
    const [, uid, bisText, sig] = m;
    const bis = Number(bisText);
    const a = Buffer.from(sig);
    const b = Buffer.from(nachweisSignatur(scanId, uid, bis));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, grund: 'signatur' };
    if (bis <= jetzt) return { ok: false, grund: 'abgelaufen' };
    // länger als die Gültigkeit (+1 min Uhr-Toleranz) kann kein eigener Nachweis sein
    if (bis > jetzt + NACHWEIS_TTL_MS + 60_000) return { ok: false, grund: 'format' };
    return { ok: true, uid, bis };
}

/* ------------------------------------------------------------------ */
/* Speicher je Scan                                                    */
/* ------------------------------------------------------------------ */

type GespeicherterTreffer = ZefixTreffer & { quelle: HrQuelle; geprueft_am: string };

interface Sicht {
    ergebnis: 'treffer' | 'kein_treffer' | 'nicht_aktiv';
    quelle: HrQuelle | null;
    uids: string[];
}

export interface HrScanEintrag {
    scan_id: string;
    /** Epoch-ms (wie der Scan) */
    ablauf: number;
    /** Ergebnis je Abfrage: `uid:CHE…` bzw. `name:<vergleichsform>` */
    cache: Record<string, { zeit: number; geprueft_am: string; treffer: ZefixTreffer[] }>;
    /** Ergebnis der automatischen Prüfung (fehlt, solange sie nicht abgeschlossen ist) */
    auto: Sicht | null;
    /** zuletzt gezeigte Liste (automatisch oder manuell) */
    letzte: Sicht | null;
    /** alle Einträge, die diesem Scan gezeigt wurden (nur diese sind bestätigbar) */
    treffer: Record<string, GespeicherterTreffer>;
    /** Zahl der manuellen Suchen */
    manuell: number;
    /** Zahl der HTTP-Aufrufe an Zefix für diesen Scan (inkl. Wiederholungen) */
    zefix_aufrufe: number;
    /** Epoch-ms: bis dahin nach «nicht erreichbar» keine neuen Register-Aufrufe */
    pause_bis?: number;
    bestaetigt: (HandelsregisterAuftrag & { nachweis: string; nachweis_bis: number }) | null;
}

/** Minimal nötige Felder eines Scans (lib/demo/scans.ts). */
export interface ScanFuerRegister {
    id: string;
    ablauf: number;
    extrakt: Pick<Extrakt, 'text' | 'firma' | 'jsonld_name'> & Partial<Pick<Extrakt, 'uid_kandidaten' | 'firma_register'>>;
    profil: Pick<Profil, 'firma'>;
}

const schluessel = (scanId: string) => `handelsregister/${scanId}`;

export async function leseEintrag(scan: Pick<ScanFuerRegister, 'id' | 'ablauf'>): Promise<HrScanEintrag> {
    const e = await leseGueltig<HrScanEintrag>(schluessel(scan.id));
    if (e && e.scan_id === scan.id) return e;
    return { scan_id: scan.id, ablauf: scan.ablauf, cache: {}, auto: null, letzte: null, treffer: {}, manuell: 0, zefix_aufrufe: 0, bestaetigt: null };
}

async function speichereEintrag(e: HrScanEintrag): Promise<void> {
    await speicher().schreibe(schluessel(e.scan_id), e);
}

/** Bestätigung nur, solange ihr Nachweis gültig ist. */
function gueltigeBestaetigung(e: HrScanEintrag, jetzt = Date.now()) {
    if (!e.bestaetigt) return null;
    const p = pruefeNachweis(e.bestaetigt.nachweis, e.scan_id, jetzt);
    return p.ok && p.uid === e.bestaetigt.uid ? e.bestaetigt : null;
}

function anzeige(t: ZefixTreffer): HrTrefferAnzeige {
    return { uid: t.uid, uid_formatiert: t.uid_formatiert, name: t.name, sitz: t.sitz, status: t.status, status_text: statusText(t.status), rechtsform: t.rechtsform, aktiv: t.aktiv };
}

function antwortAus(e: HrScanEintrag, modus: HrModus, ergebnis: HrErgebnis | null, sicht: Sicht | null): HrAntwort {
    const b = gueltigeBestaetigung(e);
    const liste = (sicht?.uids ?? []).map((u) => e.treffer[u]).filter((t): t is GespeicherterTreffer => !!t);
    return {
        scan_id: e.scan_id,
        modus,
        ergebnis: b ? 'bestaetigt' : (ergebnis ?? sicht?.ergebnis ?? 'kein_treffer'),
        quelle: b ? b.quelle : (sicht?.quelle ?? null),
        treffer: liste.slice(0, TREFFER_MAX).map(anzeige),
        versuche_rest: Math.max(0, MANUELL_MAX - e.manuell),
        bestaetigt: b ? { uid: b.uid, uid_formatiert: b.uid_formatiert, name: b.name, sitz: b.sitz } : null,
        ...(b ? { gueltig_bis: b.nachweis_bis } : {}),
    };
}

/** Antwort bei abgeschalteter Prüfung (Schalter «aus»). */
export function uebersprungen(scanId: string): HrAntwort {
    return { scan_id: scanId, modus: 'aus', ergebnis: 'uebersprungen', quelle: null, treffer: [], versuche_rest: MANUELL_MAX, bestaetigt: null };
}

/* ------------------------------------------------------------------ */
/* Abfrage mit Zwischenspeicher                                        */
/* ------------------------------------------------------------------ */

type Abfrage = { ok: true; treffer: ZefixTreffer[]; geprueft_am: string; neu: boolean } | { ok: false };

async function abfrage(e: HrScanEintrag, art: 'uid' | 'name', wert: string, opt: ZefixOptionen): Promise<Abfrage> {
    const key = art === 'uid' ? `uid:${wert}` : `name:${vergleichsName(wert)}`;
    const da = e.cache[key];
    if (da) return { ok: true, treffer: da.treffer, geprueft_am: da.geprueft_am, neu: false };
    const r = await zefixSuche(art, wert, { ...opt, log: e.scan_id });
    e.zefix_aufrufe += r.versuche;
    if (!r.ok) return { ok: false };
    const eintrag = { zeit: Date.now(), geprueft_am: isoZuerich(), treffer: r.treffer.slice(0, 20) };
    e.cache[key] = eintrag;
    return { ok: true, treffer: eintrag.treffer, geprueft_am: eintrag.geprueft_am, neu: true };
}

function merke(e: HrScanEintrag, liste: ZefixTreffer[], quelle: HrQuelle, geprueft_am: string): void {
    for (const t of liste) e.treffer[t.uid] = { ...t, quelle, geprueft_am };
}

function sichtVon(liste: ZefixTreffer[], quelle: HrQuelle | null): Sicht {
    const uids = [...new Set(liste.map((t) => t.uid))].slice(0, TREFFER_MAX);
    const ergebnis = liste.some((t) => t.aktiv) ? 'treffer' : liste.length ? 'nicht_aktiv' : 'kein_treffer';
    return { ergebnis, quelle: liste.length ? quelle : null, uids };
}

/* ------------------------------------------------------------------ */
/* Namensvarianten                                                     */
/* ------------------------------------------------------------------ */

function bereinigeName(s: string | null | undefined): string {
    return String(s ?? '')
        .replace(/[«»"“”„]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120);
}

function ersteZweiWoerter(s: string): string {
    return s.split(' ').slice(0, 2).join(' ');
}

/**
 * Suchnamen in Reihenfolge: zuerst die vollen Namen (Firmenname mit Rechtsform aus dem Text,
 * Profil-Firma, JSON-LD, Scanner-Firma), dann ohne Rechtsform, dann die ersten zwei Wörter.
 * Ohne Dubletten (Vergleichsform), mindestens 3 Zeichen, höchstens `max`.
 */
export function namensVarianten(basis: Array<string | null | undefined>, max = AUTO_NAME_MAX): string[] {
    const voll = basis.map(bereinigeName).filter((s) => s.length >= 3);
    const ohne = voll.map(ohneRechtsform);
    const zwei = ohne.map(ersteZweiWoerter);
    const aus: string[] = [];
    const gesehen = new Set<string>();
    for (const n of [...voll, ...ohne, ...zwei]) {
        const v = vergleichsName(n);
        if (v.replace(/\s/g, '').length < 3 || gesehen.has(v)) continue;
        gesehen.add(v);
        aus.push(n);
        if (aus.length >= max) break;
    }
    return aus;
}

/** UID-Kandidaten eines Scans (ältere Scans ohne Feld: aus dem gespeicherten Text). */
export function uidKandidaten(x: ScanFuerRegister['extrakt']): string[] {
    if (Array.isArray(x.uid_kandidaten)) return x.uid_kandidaten.map((u) => normalisiereUid(u)).filter((u): u is string => !!u).slice(0, AUTO_UID_MAX);
    return findeUids(x.text ?? '', AUTO_UID_MAX);
}

/* ------------------------------------------------------------------ */
/* Automatische Prüfung                                                */
/* ------------------------------------------------------------------ */

function protokolliere(e: HrScanEintrag, art: string, ergebnis: string, quelle: string | null, vorher: number): void {
    console.info(
        `[demo/handelsregister] scan=${e.scan_id.slice(0, 10)} art=${art} ergebnis=${ergebnis} quelle=${quelle ?? '-'} zefix_neu=${e.zefix_aufrufe - vorher} zefix_gesamt=${e.zefix_aufrufe} manuell=${e.manuell}`,
    );
}

const laufend = new Map<string, Promise<HrAntwort>>();

/** Pause nach «nicht erreichbar» läuft noch, oder die Obergrenze der Aufrufe je Scan ist erreicht. */
function gesperrt(e: HrScanEintrag, jetzt = Date.now()): boolean {
    return (typeof e.pause_bis === 'number' && e.pause_bis > jetzt) || e.zefix_aufrufe >= ZEFIX_MAX_JE_SCAN;
}

/**
 * Automatische Prüfung eines Scans (zwischengespeichert: eine Wiederholung erzeugt keine neuen
 * Register-Aufrufe). Register nicht erreichbar → «nicht_erreichbar» (nicht gespeichert, ein
 * neuer Aufruf versucht es nochmals; bereits beantwortete Abfragen kommen aus dem Speicher).
 */
export function automatischePruefung(scan: ScanFuerRegister, opt: ZefixOptionen = {}): Promise<HrAntwort> {
    const da = laufend.get(scan.id);
    if (da) return da;
    const p = automatischIntern(scan, opt).finally(() => laufend.delete(scan.id));
    laufend.set(scan.id, p);
    return p;
}

async function automatischIntern(scan: ScanFuerRegister, opt: ZefixOptionen): Promise<HrAntwort> {
    const modus = handelsregisterModus();
    if (modus === 'aus') return uebersprungen(scan.id);
    const e = await leseEintrag(scan);
    // bestätigt, schon geprüft oder schon manuell gesucht → aus dem Speicher (kein neuer Register-Aufruf)
    if (gueltigeBestaetigung(e) || e.auto || e.letzte) return antwortAus(e, modus, null, e.letzte ?? e.auto);

    const vorher = e.zefix_aufrufe;
    if (gesperrt(e)) {
        protokolliere(e, 'auto', 'pause', null, vorher);
        return { ...antwortAus(e, modus, 'nicht_erreichbar', null), ergebnis: 'nicht_erreichbar' };
    }
    const o: ZefixOptionen = { ...opt, bis: opt.bis ?? Date.now() + PRUEFUNG_FRIST_MS };
    const gesammelt: ZefixTreffer[] = [];
    let quelle: HrQuelle | null = null;
    let erreichbar = true;

    for (const uid of uidKandidaten(scan.extrakt)) {
        const r = await abfrage(e, 'uid', uid, o);
        if (!r.ok) {
            erreichbar = false;
            break;
        }
        merke(e, r.treffer, 'uid', r.geprueft_am);
        for (const t of r.treffer) if (!gesammelt.some((g) => g.uid === t.uid)) gesammelt.push(t);
        if (r.treffer.length) quelle = 'uid';
        if (gesammelt.some((t) => t.aktiv)) break;
    }
    if (erreichbar && !gesammelt.some((t) => t.aktiv)) {
        const namen = namensVarianten([scan.extrakt.firma_register, scan.profil.firma, scan.extrakt.jsonld_name, scan.extrakt.firma]);
        for (const name of namen) {
            const r = await abfrage(e, 'name', name, o);
            if (!r.ok) {
                erreichbar = false;
                break;
            }
            const geordnet = ordneTreffer(r.treffer, name, TREFFER_MAX);
            if (!geordnet.length) continue;
            merke(e, geordnet, 'name', r.geprueft_am);
            for (const t of geordnet) if (!gesammelt.some((g) => g.uid === t.uid)) gesammelt.push(t);
            quelle = quelle ?? 'name';
            break;
        }
    }

    if (!erreichbar && !gesammelt.some((t) => t.aktiv)) {
        e.pause_bis = Date.now() + NICHT_ERREICHBAR_PAUSE_MS;
        await speichereEintrag(e).catch((err) => console.error('[demo/handelsregister] Speichern fehlgeschlagen:', err instanceof Error ? err.message : err));
        protokolliere(e, 'auto', 'nicht_erreichbar', null, vorher);
        return { ...antwortAus(e, modus, 'nicht_erreichbar', null), ergebnis: 'nicht_erreichbar' };
    }
    // aktive zuerst (UID-Treffer vor Namenstreffern bleiben in ihrer Reihenfolge)
    const liste = [...gesammelt.filter((t) => t.aktiv), ...gesammelt.filter((t) => !t.aktiv)];
    e.auto = sichtVon(liste, quelle);
    e.letzte = e.auto;
    await speichereEintrag(e);
    protokolliere(e, 'auto', e.auto.ergebnis, e.auto.quelle, vorher);
    return antwortAus(e, modus, null, e.auto);
}

/* ------------------------------------------------------------------ */
/* Manuelle Suche und Bestätigung                                      */
/* ------------------------------------------------------------------ */

export type HrFehler = { ok: false; status: number; meldung: string };
export type HrErfolg = { ok: true; antwort: HrAntwort };

/** Manuelle Suche «Firmenname oder UID» (höchstens MANUELL_MAX je Scan; Eingabefehler zählen nicht). */
export async function manuelleSuche(scan: ScanFuerRegister, eingabe: string, opt: ZefixOptionen = {}): Promise<HrErfolg | HrFehler> {
    const modus = handelsregisterModus();
    if (modus === 'aus') return { ok: true, antwort: uebersprungen(scan.id) };
    const text = bereinigeName(eingabe);
    let art: 'uid' | 'name' = 'name';
    let wert = text;
    if (siehtAusWieUid(text)) {
        const uid = normalisiereUid(text);
        if (!uid) return { ok: false, status: 422, meldung: HR_TEXT.uidUngueltig };
        art = 'uid';
        wert = uid;
    } else if (vergleichsName(text).replace(/\s/g, '').length < 3) {
        return { ok: false, status: 422, meldung: HR_TEXT.suchtextKurz };
    }
    const e = await leseEintrag(scan);
    if (e.manuell >= MANUELL_MAX) return { ok: false, status: 429, meldung: `${HR_TEXT.versucheAus} ${HR_TEXT.aktivNoetig}` };
    const vorher = e.zefix_aufrufe;
    if (gesperrt(e)) {
        protokolliere(e, 'manuell', 'pause', null, vorher);
        return { ok: true, antwort: { ...antwortAus(e, modus, 'nicht_erreichbar', e.letzte), ergebnis: 'nicht_erreichbar' } };
    }
    const r = await abfrage(e, art, wert, { ...opt, bis: opt.bis ?? Date.now() + PRUEFUNG_FRIST_MS });
    if (!r.ok) {
        // Ausfall des Registers kostet keinen Versuch
        e.pause_bis = Date.now() + NICHT_ERREICHBAR_PAUSE_MS;
        await speichereEintrag(e).catch(() => undefined);
        protokolliere(e, 'manuell', 'nicht_erreichbar', null, vorher);
        return { ok: true, antwort: { ...antwortAus(e, modus, 'nicht_erreichbar', e.letzte), ergebnis: 'nicht_erreichbar' } };
    }
    e.manuell += 1;
    const liste = art === 'uid' ? r.treffer : ordneTreffer(r.treffer, wert, TREFFER_MAX);
    const geordnet = [...liste.filter((t) => t.aktiv), ...liste.filter((t) => !t.aktiv)];
    merke(e, geordnet, 'manuell', r.geprueft_am);
    e.letzte = sichtVon(geordnet, 'manuell');
    await speichereEintrag(e);
    protokolliere(e, `manuell-${art}`, e.letzte.ergebnis, 'manuell', vorher);
    return { ok: true, antwort: antwortAus(e, modus, null, e.letzte) };
}

/** Bestätigt einen gezeigten, aktiven Eintrag und legt den signierten Nachweis (30 min) ab. */
export async function bestaetige(scan: ScanFuerRegister, uidRoh: string, jetzt = Date.now()): Promise<HrErfolg | HrFehler> {
    const modus = handelsregisterModus();
    if (modus === 'aus') return { ok: true, antwort: uebersprungen(scan.id) };
    const uid = normalisiereUid(uidRoh);
    if (!uid) return { ok: false, status: 400, meldung: HR_TEXT.nichtBestaetigbar };
    const e = await leseEintrag(scan);
    const t = e.treffer[uid];
    if (!t) return { ok: false, status: 409, meldung: HR_TEXT.nichtBestaetigbar };
    if (!t.aktiv) return { ok: false, status: 409, meldung: HR_TEXT.aktivNoetig };
    const bis = jetzt + NACHWEIS_TTL_MS;
    e.bestaetigt = {
        uid: t.uid,
        uid_formatiert: t.uid_formatiert,
        name: t.name,
        sitz: t.sitz,
        status: t.status,
        quelle: t.quelle,
        geprueft_am: t.geprueft_am,
        nachweis: signiereNachweis(scan.id, t.uid, bis),
        nachweis_bis: bis,
    };
    await speichereEintrag(e);
    console.info(`[demo/handelsregister] scan=${scan.id.slice(0, 10)} art=bestaetigt quelle=${t.quelle} gueltig_min=${Math.round(NACHWEIS_TTL_MS / 60000)}`);
    return { ok: true, antwort: antwortAus(e, modus, null, e.letzte) };
}

/* ------------------------------------------------------------------ */
/* Prüfung im Anruf                                                    */
/* ------------------------------------------------------------------ */

export type AnrufNachweis =
    | { ok: true; handelsregister: HandelsregisterAuftrag | null }
    | { ok: false; code: typeof HR_CODE_FEHLT | typeof HR_CODE_ABGELAUFEN; meldung: string };

/**
 * Für POST /api/demo/anruf: Der Scan muss einen bestätigten Eintrag mit gültigem, signiertem
 * Nachweis tragen (Signatur über scan_id + UID + Ablauf, nicht abgelaufen, UID = bestätigte UID,
 * Eintrag aktiv). Schalter «aus» (nur lokal): ok ohne Eintrag.
 */
export async function nachweisFuerAnruf(scan: Pick<ScanFuerRegister, 'id' | 'ablauf'>, jetzt = Date.now()): Promise<AnrufNachweis> {
    if (handelsregisterModus() === 'aus') return { ok: true, handelsregister: null };
    const e = await leseEintrag(scan);
    const b = e.bestaetigt;
    if (!b) return { ok: false, code: HR_CODE_FEHLT, meldung: HR_TEXT.fehlt };
    const p = pruefeNachweis(b.nachweis, scan.id, jetzt);
    if (!p.ok) {
        return p.grund === 'abgelaufen' ? { ok: false, code: HR_CODE_ABGELAUFEN, meldung: HR_TEXT.abgelaufen } : { ok: false, code: HR_CODE_FEHLT, meldung: HR_TEXT.fehlt };
    }
    const t = e.treffer[b.uid];
    if (p.uid !== b.uid || !t || !t.aktiv) return { ok: false, code: HR_CODE_FEHLT, meldung: HR_TEXT.fehlt };
    return { ok: true, handelsregister: { uid: b.uid, uid_formatiert: b.uid_formatiert, name: b.name, sitz: b.sitz, status: b.status, quelle: b.quelle, geprueft_am: b.geprueft_am } };
}
