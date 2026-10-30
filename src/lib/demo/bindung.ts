/**
 * Bindung Website ↔ Handelsregister (AUFTRAG-111) — reine Funktionen ohne Node-Module
 * (Browser und Server).
 *
 * Die bestätigte Firma (UID) muss nachweislich zur gescannten Website gehören. EINE Regel genügt:
 * 1. `uid`    — die auf der Website gefundene UID (Impressum, Fusszeile, JSON-LD) ist die bestätigte UID;
 * 2. `domain` — Kern-Name ⊆ Domain-Label oder Domain-Label ⊆ Kern-Name (beide ≥ 4 Zeichen;
 *               kürzer: nur Gleichheit). Das Label im Kern zählt nur an Wortgrenzen des Namens
 *               (sonst passte «elektro-tel.ch» zu «Bütler Elektro Telecom AG»: «elektro tel|ecom»);
 *               der Kern im Label muss an einem Wortanfang des Labels beginnen (Anfang oder nach
 *               Bindestrich/Unterstrich), das Ende bleibt offen («lektro» passt nicht in «elektro-tel»,
 *               «mustertreuhand» passt in «mustertreuhandwinterthur»);
 * 3. `text`   — der Kern-Name kommt im Titel, im Impressum-Text oder in der Fusszeile der gescannten
 *               Website vor (Nachtrag A-111: NICHT im übrigen Text und nicht in Wissenseinträgen — sonst
 *               bände sich eine Website an jeden Partner oder Mitbewerber, den sie mit vollem Namen
 *               erwähnt). Fusszeile = Näherung: die letzten 2000 Zeichen des Startseiten-Textes.
 *               Treffer zählen nur an Wortgrenzen, nur innerhalb eines Abschnitts und ab 4 Zeichen
 *               Kern (sonst passte «muster» schon in «Mustermann»).
 *
 * Normalisierung (eine Funktion, `normalisiereWoerter`; `normalisiere` = ohne Leerzeichen):
 * Kleinbuchstaben; ä→ae, ö→oe, ü→ue (ß→ss), sonst NFD und Diakritika weg; Rechtsformen
 * entfernen (AG, SA, GmbH, Sàrl/SARL/Sagl, KlG, KmG, Genossenschaft, Stiftung, Verein, Ltd, Inc,
 * Co, «& Co», «S.A.»); alles ausser a–z/0–9 entfernen.
 */

/** Regel, über die die Firma an die Website gebunden ist (im Nachweis mitsigniert). */
export type Gebunden = 'uid' | 'domain' | 'text';
export const GEBUNDEN_ARTEN: readonly Gebunden[] = ['uid', 'domain', 'text'];

/** Kennung der 409-Antwort, wenn die gewählte Firma nicht zur Website gehört. */
export const HR_CODE_WEBSITE_PASST_NICHT = 'website_passt_nicht';

/** Mindestlänge von Kern bzw. Label für Teilübereinstimmungen (kürzer: nur Gleichheit). */
export const BINDUNG_MIN = 4;
/** Deckel der gespeicherten, normalisierten Textbasis eines Scans (Zeichen). */
export const BINDUNG_TEXT_MAX = 200_000;
/** Nachtrag A-111: Fusszeilen-Näherung = so viele letzte Zeichen des Startseiten-Textes. */
export const FUSSZEILE_ZEICHEN = 2000;

/* ------------------------------------------------------------------ */
/* Normalisierung                                                      */
/* ------------------------------------------------------------------ */

const UMLAUTE: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

/**
 * Rechtsformen als eigene Wörter (nach Kleinschrift und Akzent-Auflösung; «Sàrl» ist dann «sarl»).
 * Mit Punkten: «S.A.», «S.à r.l.»; «& Co» fällt über «co» (das «&» entfernt der letzte Schritt).
 */
const RECHTSFORM_RE = /(^|[^a-z0-9])(?:s\.\s?a\.?\s?r\.?\s?l\.?|s\.\s?a\.?|ag|sa|gmbh|sarl|sagl|klg|kmg|genossenschaft|stiftung|verein|ltd|inc|co)(?=$|[^a-z0-9])/g;

/**
 * Normalisierung mit Wortgrenzen: «Elektro-Tel AG für elektrotechnische Anlagen» →
 * «elektro tel fuer elektrotechnische anlagen». Wörter durch genau ein Leerzeichen getrennt.
 */
export function normalisiereWoerter(s: string | null | undefined): string {
    let t = String(s ?? '')
        .normalize('NFC')
        .toLowerCase();
    t = t.replace(/[äöüß]/g, (c) => UMLAUTE[c] ?? c);
    t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    // zweimal: «S.A.» direkt nach einer anderen Rechtsform teilt sich das Trennzeichen
    t = t.replace(RECHTSFORM_RE, '$1 ').replace(RECHTSFORM_RE, '$1 ');
    return t.replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Kern-Name: normalisiert ohne Leerzeichen («elektrotelfuerelektrotechnischeanlagen»). */
export function normalisiere(s: string | null | undefined): string {
    return normalisiereWoerter(s).replace(/ /g, '');
}

/* ------------------------------------------------------------------ */
/* Domain-Label                                                        */
/* ------------------------------------------------------------------ */

/** Zweiteilige Endungen, bei denen das Label davor steht (muster.co.uk → «muster»). */
const ZWEITEILIGE_ENDUNGEN = new Set([
    'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk',
    'co.at', 'or.at', 'ac.at', 'gv.at',
    'com.au', 'net.au', 'org.au', 'co.nz', 'co.za', 'co.jp', 'co.kr', 'co.il', 'co.in',
    'com.br', 'com.cn', 'com.tr', 'com.mx', 'com.ar', 'com.sg', 'com.hk',
]);

/**
 * Domain-Label des Hosts: «www.elektro-tel.ch» → «elektro-tel», «shop.muster.co.uk» → «muster»,
 * «muster.swiss» → «muster». www (auch www2 …) und Endung weg. IP-Adressen und Hosts ohne
 * Endung → null. Nimmt auch eine URL.
 */
export function domainLabel(hostOderUrl: string | null | undefined): string | null {
    let h = String(hostOderUrl ?? '')
        .trim()
        .toLowerCase();
    if (!h) return null;
    if (/[/:@]/.test(h)) {
        try {
            h = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(h) ? h : `https://${h}`).hostname;
        } catch {
            return null;
        }
    }
    h = h.replace(/\.+$/, '');
    if (!h || /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(':') || h.startsWith('[')) return null;
    const teile = h.split('.').filter(Boolean);
    while (teile.length > 2 && /^www\d*$/.test(teile[0])) teile.shift();
    if (teile.length < 2) return null;
    const endung = teile.length >= 3 && ZWEITEILIGE_ENDUNGEN.has(teile.slice(-2).join('.')) ? 2 : 1;
    const label = teile[teile.length - 1 - endung];
    return label && !/^www\d*$/.test(label) ? label : null;
}

/** Suchbegriff fürs Handelsregister aus dem Domain-Label: «elektro-tel.ch» → «elektro tel». */
export function domainSuchbegriff(hostOderUrl: string | null | undefined): string | null {
    const l = domainLabel(hostOderUrl);
    if (!l) return null;
    const s = l.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return s.length >= 2 ? s : null;
}

/* ------------------------------------------------------------------ */
/* Regeln                                                              */
/* ------------------------------------------------------------------ */

/**
 * Kommt `gesucht` (ohne Leerzeichen) in `woerter` (normalisiert, Wörter durch Leerzeichen getrennt)
 * so vor, dass es an einer Wortgrenze beginnt UND endet? («mustertreuhand» in «muster treuhand ag»
 * ja, «muster» in «mustermann» nein, «elektrotel» in «buetler elektro telecom» nein.)
 */
export function enthaeltAnWortgrenzen(woerter: string, gesucht: string): boolean {
    if (!gesucht || !woerter) return false;
    let gestrippt = '';
    const grenzen = new Set<number>([0]);
    for (const w of woerter.split(' ')) {
        if (!w) continue;
        gestrippt += w;
        grenzen.add(gestrippt.length);
    }
    for (let i = gestrippt.indexOf(gesucht); i >= 0; i = gestrippt.indexOf(gesucht, i + 1)) {
        if (grenzen.has(i) && grenzen.has(i + gesucht.length)) return true;
    }
    return false;
}

/**
 * Beginnt `kern` im Domain-Label an einem Wortanfang? Wortanfänge = Position 0 und jede Stelle direkt
 * nach einem Bindestrich/Unterstrich im rohen Label (Teile einzeln normalisiert, «ag» fällt weg).
 * Das Ende bleibt offen: Domains schreiben Wörter zusammen.
 */
function kernAmWortanfangDesLabels(labelRoh: string, kern: string): boolean {
    let gestrippt = '';
    const anfaenge = new Set<number>();
    for (const teil of String(labelRoh ?? '').split(/[-_]+/)) {
        const n = normalisiere(teil);
        if (!n) continue;
        anfaenge.add(gestrippt.length);
        gestrippt += n;
    }
    for (let i = gestrippt.indexOf(kern); i >= 0; i = gestrippt.indexOf(kern, i + 1)) {
        if (anfaenge.has(i)) return true;
    }
    return false;
}

/**
 * Regel 2 für Registername und Domain-Label (beide roh): gleich, oder Kern ⊆ Label, oder Label ⊆ Kern
 * — Teilübereinstimmung nur, wenn beide ≥ 4 Zeichen haben. Label ⊆ Kern zählt nur an Wortgrenzen
 * des Namens (Anfang und Ende); Kern ⊆ Label nur ab einem Wortanfang des Labels, Ende offen
 * («mustertreuhandwinterthur.ch» ↔ «Muster Treuhand AG» ja, «elektro-tel.ch» ↔ «Lektro AG» nein).
 */
export function kernPasstZuLabel(name: string, labelRoh: string): boolean {
    const kern = normalisiere(name);
    const label = normalisiere(labelRoh);
    if (!kern || !label) return false;
    if (kern === label) return true;
    if (Math.min(kern.length, label.length) < BINDUNG_MIN) return false;
    return kernAmWortanfangDesLabels(labelRoh, kern) || enthaeltAnWortgrenzen(normalisiereWoerter(name), label);
}

/**
 * Regel 3: Kommt der Kern-Name im Text vor? `textWoerter` ist normalisiert (normalisiereWoerter).
 * Der Kern muss an einer Wortgrenze beginnen und enden («Muster-Holz» passt zu «MusterHolz» und
 * umgekehrt, «Muster» nicht zu «Mustermann»); Kerne unter 4 Zeichen binden nie über den Text.
 */
export function textEnthaeltKern(textWoerter: string, name: string): boolean {
    const kern = normalisiere(name);
    if (kern.length < BINDUNG_MIN) return false;
    return enthaeltAnWortgrenzen(textWoerter, kern);
}

/** Was von der Website für die Bindung zählt. */
export interface BindungsBasis {
    /** UIDs von der Website (normalisiert «CHE…») */
    uids: string[];
    /** Host der gescannten Website (Unicode, ohne www) */
    host: string;
    /** normalisierte Textbasis (normalisiereWoerter) */
    text: string;
}

/**
 * Prüft, ob die Firma zur Website gehört; Reihenfolge uid → domain → text.
 * null = keine Regel greift (kein Nachweis, kein Anruf).
 */
export function pruefeBindung(firma: { uid: string; name: string }, basis: BindungsBasis): Gebunden | null {
    if (basis.uids.includes(firma.uid)) return 'uid';
    if (kernPasstZuLabel(firma.name, domainLabel(basis.host) ?? '')) return 'domain';
    if (textEnthaeltKern(basis.text, firma.name)) return 'text';
    return null;
}

/**
 * Normalisierte Textbasis für Regel 3: jeder Teil (Abschnitt) wird für sich normalisiert, die Teile
 * stehen durch « | » getrennt — ein Name zählt nur innerhalb eines Abschnitts. Höchstens `max`
 * Zeichen (an einer Wortgrenze gekürzt).
 */
export function bindungsText(teile: Array<string | null | undefined>, max = BINDUNG_TEXT_MAX): string {
    const aus: string[] = [];
    let laenge = 0;
    for (const t of teile) {
        if (typeof t !== 'string' || !t) continue;
        const n = normalisiereWoerter(t.length > max * 2 ? t.slice(0, max * 2) : t);
        if (!n) continue;
        aus.push(n);
        laenge += n.length + 3;
        if (laenge >= max) break;
    }
    const s = aus.join(' | ');
    if (s.length <= max) return s;
    const k = s.slice(0, max);
    const leer = k.lastIndexOf(' ');
    return (leer > 0 ? k.slice(0, leer) : k).replace(/[\s|]+$/, '');
}

const IMPRESSUM_RE = /impressum|imprint|rechtliche[s]?[\s_-]*angaben|legal[\s_-]*notice|mentions[\s_-]*l[eé]gales|note[\s_-]*legali/i;

/**
 * Nachtrag A-111: Ist eine gelesene Unterseite das Impressum? Der Scanner legt die Seitenart nicht
 * ab — erkannt an Pfad, Seitentitel oder einer der ersten drei Überschriften.
 */
export function istImpressumSeite(url: string, titel?: string | null, ueberschriften: string[] = []): boolean {
    let pfad = url;
    try {
        pfad = decodeURIComponent(new URL(url).pathname);
    } catch {
        /* roh */
    }
    return IMPRESSUM_RE.test(pfad) || IMPRESSUM_RE.test(titel ?? '') || ueberschriften.slice(0, 3).some((h) => IMPRESSUM_RE.test(h));
}

/**
 * Nachtrag A-111: Fusszeilen-Näherung — die letzten `max` Zeichen des Startseiten-Textes (Zeilen in
 * Dokumentreihenfolge), vorne an einer Wortgrenze begonnen. Der Scanner legt die Fusszeile nicht
 * getrennt ab.
 */
export function fusszeileNaeherung(zeilen: string[], max = FUSSZEILE_ZEICHEN): string {
    const t = zeilen.join('\n');
    if (t.length <= max) return t;
    const k = t.slice(t.length - max);
    const i = k.search(/\s/);
    return i >= 0 && i < 60 ? k.slice(i + 1) : k;
}

/**
 * Nachtrag A-111: Textbasis der Regel 3 aus den Seiten eines Scans — nur drei Abschnitte: Titel der
 * Startseite, Text der Impressum-Seite(n), Fusszeilen-Näherung der Startseite.
 */
export function bindungsTextAusSeiten(x: { titel: string | null | undefined; impressum: string[]; startZeilen: string[] }, max = BINDUNG_TEXT_MAX): string {
    return bindungsText([x.titel, x.impressum.join('\n'), fusszeileNaeherung(x.startZeilen)], max);
}

/* ------------------------------------------------------------------ */
/* Sprechname (P5)                                                     */
/* ------------------------------------------------------------------ */

/** Rechtsform am Ende («Muster Treuhand AG» → «Muster Treuhand»); in der Mitte bleibt sie. */
const RECHTSFORM_ENDE_RE = /[\s,]+(?:&\s*co\.?|s\.\s?[aà]\.?\s?r\.?\s?l\.?|s\.\s?a\.?|ag|sa|gmbh|s[aà]rl|sagl|klg|kmg|genossenschaft|stiftung|verein|ltd\.?|inc\.?|co\.?)$/i;

export function ohneRechtsformAmEnde(name: string): string {
    const voll = String(name ?? '').trim();
    let s = voll;
    for (let i = 0; i < 3; i++) {
        const neu = s.replace(RECHTSFORM_ENDE_RE, '').trim();
        if (neu === s || !neu) break;
        s = neu;
    }
    return s.replace(/[\s,;–-]+$/, '') || voll;
}

/**
 * Vergleichsform für den Sprechnamen: «l» wie «i». Das Register schreibt z. B.
 * «lnfraOne IT Solutions GmbH» (kleines L statt grossem I) — die Marke «InfraOne» soll trotzdem passen.
 */
const ohneVerwechslung = (k: string) => k.replace(/l/g, 'i');

/**
 * Gebundener Sprechname (`profil.firma` im Auftrag): die Marke aus dem Scan, wenn ihr Kern im Kern
 * des Handelsregister-Namens steckt oder umgekehrt (beide ≥ 3 Zeichen); sonst der
 * Handelsregister-Name ohne Rechtsform am Ende. Nie die Scan-Marke allein.
 */
export function sprechName(marke: string | null | undefined, hrName: string): string {
    const m = String(marke ?? '').replace(/\s+/g, ' ').trim();
    const km = ohneVerwechslung(normalisiere(m));
    const kh = ohneVerwechslung(normalisiere(hrName));
    if (m && km.length >= 3 && kh.length >= 3 && (kh.includes(km) || km.includes(kh))) return m;
    return ohneRechtsformAmEnde(hrName);
}

/** Lange Namen für die Karte kürzen (höchstens `max` Zeichen inkl. «…», möglichst an einer Wortgrenze). */
export function kuerzeName(name: string, max = 40): string {
    const s = String(name ?? '').trim();
    if (s.length <= max) return s;
    const k = s.slice(0, max - 1);
    const leer = k.lastIndexOf(' ');
    const schnitt = leer >= max - 14 ? k.slice(0, leer) : k;
    return schnitt.replace(/[\s,;–-]+$/, '') + '…';
}
