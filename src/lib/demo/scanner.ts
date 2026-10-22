/**
 * Website-Scanner der KI-Telefonassistent-Demo (AUFTRAG-092, Teil A).
 *
 * Ablauf: URL normalisieren → Startseite (≤ 4 s) → bis zu 5 priorisierte
 * interne Seiten + bis zu 3 Stylesheets parallel (je ≤ 4 s) → Extraktion.
 * Gesamtbudget 8 s, HTML max. 1,5 MB, CSS max. 300 kB. Keine
 * Browser-Automation.
 */
import { bildGroesse, bildTyp, holeSicher, dekodiere, NetzFehler, pruefeUrlFormal } from './netz';
import { analysiereSeite, bereinigeText, COOKIE_ZEILE_RE, type SeitenAnalyse } from './extraktion';
import { normalisiereGefundeneNummer } from './nummer';
import { farbtonAbstand, istMarkenfarbe, parseCssFarbe, helligkeit } from './farben';
import type { Abschnitt, Extrakt, Farben, LogoKandidat, Schritt, SeitenProtokoll } from './typen';

export const SCAN_BUDGET_MS = 8000;
const SEITE_MS = 4000;
const HTML_MAX = 1_500_000;
const CSS_MAX = 300_000;
const MAX_UNTERSEITEN = 5;
const MAX_CSS = 3;
const TEXT_MAX = 12_000;

export type ScanFehlerCode = 'eingabe' | 'gesperrt' | 'nicht_erreichbar' | 'status' | 'kein_html';

export class ScanFehler extends Error {
    code: ScanFehlerCode;
    status?: number;
    constructor(code: ScanFehlerCode, nachricht: string, status?: number) {
        super(nachricht);
        this.name = 'ScanFehler';
        this.code = code;
        this.status = status;
    }
}

/* ------------------------------------------------------------------ */
/* URL                                                                 */
/* ------------------------------------------------------------------ */

/** Normalisiert die Eingabe des Besuchers (https erzwingen, Pfad behalten). */
export function normalisiereEingabe(roh: string): URL {
    let s = (roh || '').trim().replace(/\s+/g, '');
    if (!s || s.length > 300) throw new ScanFehler('eingabe', 'Ungültige Eingabe');
    s = s.replace(/^[a-z]+:\/\//i, (m) => m.toLowerCase());
    if (/^http:\/\//.test(s)) s = 'https://' + s.slice(7);
    if (!/^https:\/\//.test(s)) {
        if (/^[a-z]+:/i.test(s) && !/^[a-z0-9.-]+:\d+/i.test(s)) throw new ScanFehler('eingabe', 'Ungültige Eingabe');
        s = 'https://' + s.replace(/^\/+/, '');
    }
    let url: URL;
    try {
        url = pruefeUrlFormal(s);
    } catch (e) {
        if (e instanceof NetzFehler && e.code === 'host_gesperrt') throw new ScanFehler('gesperrt', e.message);
        throw new ScanFehler('eingabe', 'Ungültige Eingabe');
    }
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) && !/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
        throw new ScanFehler('eingabe', 'Ungültige Eingabe');
    }
    url.hash = '';
    return url;
}

const ohneWww = (h: string) => h.toLowerCase().replace(/^www\./, '');

/* ------------------------------------------------------------------ */
/* Seitenwahl                                                          */
/* ------------------------------------------------------------------ */

const PRIORITAET: Array<[RegExp, number]> = [
    [/kontakt|contact/i, 10],
    [/öffnungszeit|oeffnungszeit|offnungszeit|sprechstunde|praxiszeit|bürozeit|geschaeftszeit|geschäftszeit/i, 9],
    [/impressum|imprint/i, 8],
    [/leistung|angebot|services?\b|dienstleistung|behandlung|sortiment/i, 8],
    [/über-uns|ueber-uns|uber-uns|über uns|ueber uns|about|team|praxis|unternehmen|firma|wir\b/i, 7],
    [/preise|tarife|kosten/i, 6],
];

const DATEI_RE = /\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|pptx?|mp4|mp3|ics|vcf)(\?|$)/i;

export function waehleUnterseiten(seite: SeitenAnalyse, startUrl: string, sprache: string | null): string[] {
    const start = new URL(startUrl);
    const kandidaten = new Map<string, number>();
    for (const { url, text } of seite.links) {
        let u: URL;
        try {
            u = new URL(url);
        } catch {
            continue;
        }
        if (ohneWww(u.hostname) !== ohneWww(start.hostname)) continue;
        if (DATEI_RE.test(u.pathname)) continue;
        u.hash = '';
        const pfad = decodeURIComponent(u.pathname).toLowerCase();
        if (pfad === start.pathname.toLowerCase() || pfad === '/' || pfad === '') continue;
        // andere Sprachversionen meiden, wenn die Startseite deutsch ist
        if ((!sprache || sprache.startsWith('de')) && /^\/(en|fr|it|es)(\/|$)/.test(pfad)) continue;
        const merkmal = `${pfad} ${text.toLowerCase()}`;
        let punkte = 0;
        for (const [re, p] of PRIORITAET) if (re.test(merkmal)) punkte = Math.max(punkte, p);
        if (!punkte) continue;
        // kurze Pfade bevorzugen (Hauptseiten statt Unterartikel)
        punkte -= Math.min(3, pfad.split('/').filter(Boolean).length - 1);
        const schluessel = u.toString();
        kandidaten.set(schluessel, Math.max(kandidaten.get(schluessel) ?? 0, punkte));
    }
    return [...kandidaten.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([u]) => u)
        .slice(0, MAX_UNTERSEITEN);
}

function waehleStylesheets(alle: string[], startUrl: string): string[] {
    const host = ohneWww(new URL(startUrl).hostname);
    const fremdBibliothek = /fonts\.googleapis|typekit|font-?awesome|fontawesome|cdnjs|jsdelivr|unpkg|bootstrapcdn|jquery|swiper|slick|animate\.|dashicons|block-library|wp-includes|icons?\.css/i;
    const bewertet = alle
        .filter((u) => !fremdBibliothek.test(u))
        .map((u) => {
            let p = 0;
            try {
                if (ohneWww(new URL(u).hostname) === host) p += 2;
            } catch {
                /* ignorieren */
            }
            if (/style|theme|main|app|custom|global|site|kit|post-\d+|frontend|bundle|wix|static/i.test(u)) p += 2;
            return { u, p };
        });
    return bewertet
        .sort((a, b) => b.p - a.p)
        .map((b) => b.u)
        .slice(0, MAX_CSS);
}

/* ------------------------------------------------------------------ */
/* Kontakt-Heuristiken                                                 */
/* ------------------------------------------------------------------ */

const TEL_RE =
    /(?:\+|00)\s?(?:41|423)[\s.\-/]?(?:\(0\)[\s.\-/]?)?\d{1,3}(?:[\s.\-/]?\d{2,3}){2,4}|\b0\d{2}[\s.\-/]?\d{3}[\s.\-/]?\d{2}[\s.\-/]?\d{2}\b/g;

export function findeTelefone(zeilen: string[]): string[] {
    const aus: string[] = [];
    for (const z of zeilen) {
        if (/iban|uid|mwst|che-\d|konto|bic|swift/i.test(z)) continue;
        for (const m of z.matchAll(TEL_RE)) {
            const davor = z.slice(Math.max(0, (m.index ?? 0) - 14), m.index ?? 0);
            if (/fax/i.test(davor)) continue;
            const n = normalisiereGefundeneNummer(m[0]);
            if (n) aus.push(n);
        }
    }
    return aus;
}

const MAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi;
const MAIL_SPERRE = /\.(png|jpe?g|gif|webp|svg|css|js)$|@(sentry|wixpress|example|domain|email|ihredomain|ihre-domain|beispiel|mustermann)\./i;

export function findeEmails(zeilen: string[]): string[] {
    const aus: string[] = [];
    for (const roh of zeilen) {
        const z = roh.replace(/\s?(?:\[at\]|\(at\)|\{at\}|\[ät\]|\(ät\))\s?/gi, '@').replace(/\s?(?:\[dot\]|\(dot\)|\[punkt\]|\(punkt\))\s?/gi, '.');
        for (const m of z.matchAll(MAIL_RE)) {
            const mail = m[0].toLowerCase().replace(/\.$/, '');
            if (!MAIL_SPERRE.test(mail)) aus.push(mail);
        }
    }
    return aus;
}

const PLZ_ORT_RE =
    /(?:^|[\s,;|])(?:CH[-\s]?)?([1-9]\d{3})\s+([A-ZÄÖÜ][a-zäöüéèàâç]+(?:[\s-](?:[A-ZÄÖÜ][a-zäöüéèàâç]+|a\.\s?A\.|am|an|im|bei|ob|b\.)){0,3})/;
const STRASSE_RE =
    /([A-ZÄÖÜ][A-Za-zÄÖÜäöüéèàâç.'\- ]{1,40}?(?:strasse|str\.|weg|gasse|platz|allee|rain|ring|halde|halden|matte|acker|hof|feld|berg|graben|quai|park|steig|bühl|rank|egg|stich|zelg|wiese|weid|bach|hang|höhe|markt|tor|brücke|damm|pfad|zentrum|areal)\s*\d{1,4}\s?[a-zA-Z]?)(?=[\s,;|]|$)/i;
const ORT_STOPP = /^(Alle|Uhr|Jahre|Jahren|Kunden|Mitarbeiter|Mitarbeitende|Franken|Copyright|Stunden|Minuten|Mal|Projekte|Seiten|Euro|Chf|Tage|Wochen|Monate|Personen|Teilnehmer|Mitglieder|Besucher|Quadratmeter|Meter|Kilometer|Stück)$/i;

export function findeAdressen(zeilen: string[]): Array<{ adresse: string; mitStrasse: boolean }> {
    const aus: Array<{ adresse: string; mitStrasse: boolean }> = [];
    zeilen.forEach((z, i) => {
        if (z.length > 220 || /postfach/i.test(z)) return;
        const m = z.match(PLZ_ORT_RE);
        if (!m) return;
        const ort = m[2].trim();
        if (ORT_STOPP.test(ort.split(/[\s-]/)[0])) return;
        const plzOrt = `${m[1]} ${ort}`;
        const vorher = z.slice(0, m.index ?? 0);
        let strasse = vorher.match(STRASSE_RE)?.[1];
        if (!strasse && i > 0 && zeilen[i - 1].length <= 80) strasse = zeilen[i - 1].match(STRASSE_RE)?.[1];
        if (strasse) {
            aus.push({ adresse: `${bereinigeText(strasse).replace(/^[,;|\s]+/, '')}, ${plzOrt}`, mitStrasse: true });
        } else if (z.length <= 45) {
            aus.push({ adresse: plzOrt, mitStrasse: false });
        }
    });
    return aus;
}

const TAG_RE =
    /(?:^|[\s,;(])(mo(?:ntag)?|di(?:enstag)?|mi(?:ttwoch)?|do(?:nnerstag)?|fr(?:eitag)?|sa(?:mstag)?|so(?:nntag)?|werktags?|täglich|wochenende|feiertags?)(?:\.|:|\s|–|-|,|$)/i;
const ZEIT_RE =
    /\b(?:[01]?\d|2[0-3])[.:h][0-5]\d\b|\b(?:[01]?\d|2[0-3])\s?(?:–|-|bis)\s?(?:[01]?\d|2[0-3])\s?uhr\b|geschlossen|nach vereinbarung|durchgehend/i;
const OEFFNUNG_TITEL_RE =
    /öffnungszeit|oeffnungszeit|sprechstunde|praxiszeit|bürozeit|buerozeit|geschäftszeit|geschaeftszeit|telefonzeit|erreichbarkeit|opening hours/i;

export function findeOeffnungszeiten(zeilen: string[]): string[] {
    const bloecke: string[][] = [];
    for (let i = 0; i < zeilen.length; i++) {
        const z = zeilen[i];
        // Block nach einer Öffnungszeiten-Überschrift
        if (OEFFNUNG_TITEL_RE.test(z) && z.length <= 60) {
            const block: string[] = [];
            for (let j = i + 1; j < Math.min(zeilen.length, i + 16) && block.length < 10; j++) {
                const k = zeilen[j];
                if (k.length > 120) break;
                if (TAG_RE.test(k) && ZEIT_RE.test(k)) block.push(k);
                else if (TAG_RE.test(k) && j + 1 < zeilen.length && ZEIT_RE.test(zeilen[j + 1]) && !TAG_RE.test(zeilen[j + 1])) {
                    block.push(`${k} ${zeilen[j + 1]}`);
                    j++;
                } else if (ZEIT_RE.test(k) && block.length) block.push(k);
            }
            if (block.length) bloecke.push(block);
            continue;
        }
        if (z.length <= 120 && TAG_RE.test(z) && ZEIT_RE.test(z)) {
            bloecke.push([z]);
        } else if (z.length <= 30 && TAG_RE.test(z) && i + 1 < zeilen.length && ZEIT_RE.test(zeilen[i + 1]) && zeilen[i + 1].length <= 60) {
            bloecke.push([`${z} ${zeilen[i + 1]}`]);
            i++;
        }
    }
    // benachbarte Einzelzeilen zusammenfassen, beste Blöcke zuerst
    const texte = bloecke
        .map((b) => [...new Set(b.map(bereinigeText))].join('; '))
        .filter((t) => t.length >= 6)
        .map((t) => (t.length > 300 ? t.slice(0, 297).replace(/[;,\s]+\S*$/, '') + ' …' : t));
    const eindeutig = [...new Set(texte)];
    return eindeutig.sort((a, b) => (b.match(/;/g)?.length ?? 0) - (a.match(/;/g)?.length ?? 0)).slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */

const BETRIEB_TYP_RE =
    /organization|business|store|restaurant|dentist|physician|clinic|medical|hospital|service|corporation|contractor|electrician|plumber|autorepair|automotive|dealer|agency|office|attorney|legal|accounting|financial|hotel|cafe|bakery|shop|salon|practice|school|gym/i;

type JsonLd = Record<string, unknown>;

function typVon(k: JsonLd): string {
    const t = k['@type'];
    return Array.isArray(t) ? t.join(' ') : String(t ?? '');
}

export function besterBetrieb(knoten: JsonLd[]): JsonLd | null {
    let best: JsonLd | null = null;
    let bestPunkte = 0;
    for (const k of knoten) {
        const typ = typVon(k);
        if (!BETRIEB_TYP_RE.test(typ) || /website|webpage|breadcrumb|imageobject|person/i.test(typ)) continue;
        const felder = ['name', 'telephone', 'address', 'logo', 'email', 'openingHours', 'openingHoursSpecification', 'description'];
        const punkte = felder.filter((f) => k[f]).length + (/localbusiness|dentist|physician|store|restaurant/i.test(typ) ? 1 : 0);
        if (punkte > bestPunkte) {
            best = k;
            bestPunkte = punkte;
        }
    }
    return best;
}

function text(v: unknown): string | null {
    if (typeof v === 'string') return bereinigeText(v) || null;
    if (Array.isArray(v) && typeof v[0] === 'string') return bereinigeText(v[0]) || null;
    return null;
}

export function jsonLdAdresse(a: unknown): string | null {
    if (typeof a === 'string') return bereinigeText(a) || null;
    const obj = Array.isArray(a) ? a[0] : a;
    if (!obj || typeof obj !== 'object') return null;
    const o = obj as JsonLd;
    const strasse = text(o.streetAddress);
    const plz = text(o.postalCode);
    const ort = text(o.addressLocality);
    const teil2 = plz && ort && ort.startsWith(plz) ? ort : [plz, ort].filter(Boolean).join(' ');
    const s = [strasse, teil2].filter(Boolean).join(', ');
    return s || null;
}

const TAGE_EN: Record<string, number> = {
    monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
    mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6,
};
const TAGE_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function zeitKurz(z: unknown): string | null {
    const m = String(z ?? '').match(/(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

function tagesGruppen(tage: number[]): string {
    const s = [...new Set(tage)].sort((a, b) => a - b);
    const teile: string[] = [];
    for (let i = 0; i < s.length; i++) {
        let j = i;
        while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
        teile.push(j - i >= 2 ? `${TAGE_DE[s[i]]}–${TAGE_DE[s[j]]}` : s.slice(i, j + 1).map((t) => TAGE_DE[t]).join(', '));
        i = j;
    }
    return teile.join(', ');
}

/** openingHoursSpecification / openingHours → «Mo–Fr 08:00–12:00, 13:30–17:30; Sa 09:00–12:00» */
export function jsonLdOeffnungszeiten(k: JsonLd): string | null {
    const spec = k.openingHoursSpecification;
    const liste = Array.isArray(spec) ? spec : spec ? [spec] : [];
    if (liste.length) {
        const proTag = new Map<number, string[]>();
        for (const e of liste) {
            if (!e || typeof e !== 'object') continue;
            const o = e as JsonLd;
            const tage = (Array.isArray(o.dayOfWeek) ? o.dayOfWeek : [o.dayOfWeek])
                .map((d) => String(d ?? '').split('/').pop()!.toLowerCase())
                .map((d) => TAGE_EN[d])
                .filter((d): d is number => d !== undefined);
            const von = zeitKurz(o.opens);
            const bis = zeitKurz(o.closes);
            if (!von || !bis) continue;
            for (const t of tage) proTag.set(t, [...(proTag.get(t) ?? []), `${von}–${bis}`]);
        }
        const nachZeit = new Map<string, number[]>();
        for (const [tag, zeiten] of proTag) {
            const key = zeiten.sort().join(', ');
            nachZeit.set(key, [...(nachZeit.get(key) ?? []), tag]);
        }
        const teile = [...nachZeit.entries()]
            .sort((a, b) => Math.min(...a[1]) - Math.min(...b[1]))
            .map(([zeiten, tage]) => `${tagesGruppen(tage)} ${zeiten}`);
        if (teile.length) return teile.join('; ');
    }
    const oh = k.openingHours;
    const ohListe = (Array.isArray(oh) ? oh : oh ? [oh] : []).filter((x): x is string => typeof x === 'string');
    if (ohListe.length) {
        return ohListe
            .map((s) =>
                s.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => TAGE_DE[TAGE_EN[d.toLowerCase()]]).replace(/-/g, '–'),
            )
            .join('; ');
    }
    return null;
}

/* ------------------------------------------------------------------ */
/* Farben                                                              */
/* ------------------------------------------------------------------ */

const CSS_VAR_RE = /--([a-z0-9_-]*?)(primary|brand|accent|main-color|theme-color|color-1)(?:-colou?r)?\s*:\s*([^;}{!]+)/gi;
const BUTTON_SELEKTOR_RE =
    /(^|[\s,>+~])(button|\.btn|\.button|\.cta|\.wp-block-button|\.elementor-button|\.primary|input\[type=.?submit|a:hover|a\s*\{|a,|\.link)/i;

export function cssFarben(css: string): { variablen: Array<{ farbe: string; gewicht: number }>; buttons: string[] } {
    const variablen: Array<{ farbe: string; gewicht: number }> = [];
    const varMap = new Map<string, string>();
    for (const m of css.matchAll(/--([a-z0-9_-]+)\s*:\s*([^;}{!]+)/gi)) varMap.set(m[1].toLowerCase(), m[2].trim());
    const aufloesen = (wert: string, tiefe = 0): string | null => {
        const v = wert.trim();
        const ref = v.match(/^var\(\s*--([a-z0-9_-]+)\s*(?:,\s*([^)]+))?\)$/i);
        if (ref && tiefe < 3) {
            const ziel = varMap.get(ref[1].toLowerCase());
            if (ziel) return aufloesen(ziel, tiefe + 1);
            return ref[2] ? aufloesen(ref[2], tiefe + 1) : null;
        }
        return parseCssFarbe(v);
    };
    for (const m of css.matchAll(CSS_VAR_RE)) {
        const name = `${m[1]}${m[2]}`.toLowerCase();
        const farbe = aufloesen(m[3]);
        if (!farbe) continue;
        const exakt = /^(primary|brand|color-primary|accent)$/.test(name);
        const gewicht = (exakt ? 3 : 1) + (/primary|brand/.test(name) ? 1 : 0) - (/accent/.test(name) ? 0.5 : 0);
        variablen.push({ farbe, gewicht });
    }
    const buttons: string[] = [];
    for (const regel of css.split('}')) {
        const [selektor, deklarationen] = regel.split('{');
        if (!deklarationen || !selektor || selektor.length > 400) continue;
        if (!BUTTON_SELEKTOR_RE.test(selektor)) continue;
        for (const d of deklarationen.matchAll(/(?:^|;)\s*(background(?:-color)?|color|border-color)\s*:\s*([^;]+)/gi)) {
            const wert = d[2].replace(/!important/i, '').trim();
            const farbe = aufloesen(wert) ?? parseCssFarbe(wert.split(/\s+/)[0] ?? '');
            if (farbe) buttons.push(farbe);
        }
    }
    return { variablen, buttons };
}

function haeufigste(liste: string[]): string[] {
    const z = new Map<string, number>();
    for (const f of liste) z.set(f, (z.get(f) ?? 0) + 1);
    return [...z.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
}

export function bestimmeFarben(theme: string | null, variablen: Array<{ farbe: string; gewicht: number }>, buttons: string[]): Farben | null {
    const kandidaten: string[] = [];
    const themeHex = theme ? parseCssFarbe(theme) : null;
    if (themeHex && istMarkenfarbe(themeHex)) kandidaten.push(themeHex);
    const varSortiert = [...variablen].sort((a, b) => b.gewicht - a.gewicht).map((v) => v.farbe);
    kandidaten.push(...varSortiert.filter(istMarkenfarbe));
    kandidaten.push(...haeufigste(buttons).filter(istMarkenfarbe));
    if (!kandidaten.length) return null;
    const primaer = kandidaten[0];
    const sekundaer = kandidaten.find((f) => farbtonAbstand(f, primaer) >= 30) ?? helligkeit(primaer, -0.18);
    return { primaer, sekundaer };
}

/* ------------------------------------------------------------------ */
/* Firmenname                                                          */
/* ------------------------------------------------------------------ */

const GENERISCH = /^(home|startseite|start|willkommen|herzlich willkommen|welcome|index|homepage|accueil)$/i;
const RECHTSFORM = /\b(ag|gmbh|sa|sàrl|sarl|klg|kg|& co|genossenschaft|stiftung|verein|praxis|zahnarzt|zahnarztpraxis|ltd|inc)\b/i;

function vergleichsform(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

export function bestimmeFirma(
    jsonldName: string | null,
    ogSiteName: string | null,
    titel: string | null,
    host: string,
): { firma: string; quelle: Extrakt['firma_quelle'] } {
    const hostLabel = ohneWww(host).split('.')[0];
    const hostVgl = vergleichsform(hostLabel);
    if (jsonldName && jsonldName.length >= 2 && jsonldName.length <= 90 && !GENERISCH.test(jsonldName)) {
        return { firma: jsonldName, quelle: 'jsonld' };
    }
    if (ogSiteName && ogSiteName.length >= 2 && ogSiteName.length <= 80 && !GENERISCH.test(ogSiteName)) {
        return { firma: ogSiteName, quelle: 'og:site_name' };
    }
    if (titel) {
        const segmente = titel
            .split(/\s+[|–—\-:·•»]\s+|\s*[|–—·•»]\s*/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 2 && s.length <= 80 && !GENERISCH.test(s));
        let best: { s: string; p: number } | null = null;
        for (const s of segmente) {
            const vgl = vergleichsform(s);
            let p = 0;
            if (hostVgl.length >= 3 && (vgl.includes(hostVgl) || hostVgl.includes(vgl))) p += 4;
            if (RECHTSFORM.test(s)) p += 2;
            p -= s.length / 40;
            if (!best || p > best.p) best = { s, p };
        }
        if (best && best.p > 0) return { firma: best.s, quelle: 'titel' };
        if (segmente.length === 1 && segmente[0].length <= 40) return { firma: segmente[0], quelle: 'titel' };
    }
    const lesbar = hostLabel
        .split('-')
        .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
        .join('-');
    return { firma: lesbar, quelle: 'host' };
}

/* ------------------------------------------------------------------ */
/* Scan                                                                */
/* ------------------------------------------------------------------ */

function plattformVon(seite: SeitenAnalyse, html: string): string | null {
    const g = (seite.generator || '').toLowerCase();
    if (g.includes('wix') || /static\.wixstatic\.com|wix-warmup-data/i.test(html)) return 'Wix';
    if (g.includes('jimdo') || /jimdo(cdn|free|site)/i.test(html)) return 'Jimdo';
    if (g.includes('squarespace') || /static1\.squarespace\.com/i.test(html)) return 'Squarespace';
    if (g.includes('webflow') || /webflow\.com\/css|data-wf-page/i.test(html)) return 'Webflow';
    if (g.includes('wordpress') || /wp-content\//i.test(html)) return 'WordPress';
    if (g.includes('typo3')) return 'TYPO3';
    if (g.includes('joomla')) return 'Joomla';
    if (/__next|_next\/static/i.test(html)) return 'Next.js';
    return null;
}

interface SeitenRoh {
    analyse: SeitenAnalyse;
    html: string;
}

async function holeHtml(url: string, deadline: number): Promise<{ url: string; html: string; ms: number; bytes: number }> {
    const rest = deadline - Date.now();
    if (rest < 300) throw new NetzFehler('zeit', 'Zeitbudget aufgebraucht');
    const r = await holeSicher(url, {
        akzeptiere: 'html',
        zeitMs: Math.min(SEITE_MS, rest),
        maxBytes: HTML_MAX,
        abschneiden: true,
    });
    const typ = r.contentType;
    const html = dekodiere(r.body, typ);
    const siehtAusWieHtml = /<(html|head|body|div|title)[\s>]/i.test(html.slice(0, 5000));
    if (typ && !/html|xml/.test(typ) && !(typ.startsWith('text/plain') && siehtAusWieHtml)) {
        throw new NetzFehler('typ', `Kein HTML (${typ.split(';')[0]})`);
    }
    if (!typ && !siehtAusWieHtml) throw new NetzFehler('typ', 'Kein HTML');
    return { url: r.url, html, ms: r.ms, bytes: r.body.length };
}

function netzZuScanFehler(e: unknown): ScanFehler {
    if (e instanceof ScanFehler) return e;
    if (e instanceof NetzFehler) {
        if (e.code === 'host_gesperrt') return new ScanFehler('gesperrt', e.message);
        if (e.code === 'url_ungueltig') return new ScanFehler('eingabe', e.message);
        if (e.code === 'status') return new ScanFehler('status', e.message, e.status);
        if (e.code === 'typ') return new ScanFehler('kein_html', e.message);
        return new ScanFehler('nicht_erreichbar', e.message);
    }
    return new ScanFehler('nicht_erreichbar', e instanceof Error ? e.message : 'Unbekannter Fehler');
}

/**
 * Prüft die ersten Logo-Kandidaten (parallel zu den Unterseiten): nur
 * erreichbare Bilder, Icons unter 24 px fallen weg, wenn es Grösseres gibt.
 */
async function pruefeLogos(kandidaten: LogoKandidat[], deadline: number): Promise<LogoKandidat[]> {
    const geprueft = kandidaten.slice(0, 4);
    const ergebnisse = await Promise.allSettled(
        geprueft.map((k) =>
            holeSicher(k.url, {
                akzeptiere: 'bild',
                zeitMs: Math.max(200, Math.min(3000, deadline - 250 - Date.now())),
                maxBytes: 400_000,
                abschneiden: true,
            }),
        ),
    );
    const gut: LogoKandidat[] = [];
    const klein: LogoKandidat[] = [];
    ergebnisse.forEach((r, i) => {
        if (r.status !== 'fulfilled' || !bildTyp(r.value.contentType, r.value.body)) return;
        const g = bildGroesse(r.value.body);
        if (g && Math.max(g.w, g.h) < 24) klein.push(geprueft[i]);
        else gut.push(geprueft[i]);
    });
    return [...gut, ...klein, ...kandidaten.slice(4)];
}

export interface ScanErgebnis {
    extrakt: Extrakt;
    schritte: Schritt[];
    dauer_ms: number;
}

/** Scannt eine Website (ohne Browser-Automation, Budget 8 s). */
export async function scanneWebsite(eingabe: string, budgetMs = SCAN_BUDGET_MS): Promise<ScanErgebnis> {
    const start = Date.now();
    const deadline = start + budgetMs;
    const url = normalisiereEingabe(eingabe);
    const protokoll: SeitenProtokoll[] = [];
    const hinweise: string[] = [];

    // 1. Startseite: https, bei Verbindungsfehler www-Variante, zuletzt http
    const varianten: string[] = [url.toString()];
    const wwwHost = url.hostname.startsWith('www.') ? url.hostname.slice(4) : `www.${url.hostname}`;
    varianten.push(Object.assign(new URL(url.toString()), { hostname: wwwHost }).toString());
    varianten.push(url.toString().replace(/^https:/, 'http:'));
    let startseite: { url: string; html: string; ms: number; bytes: number } | null = null;
    let letzterFehler: unknown = null;
    for (const v of varianten) {
        const t0 = Date.now();
        try {
            startseite = await holeHtml(v, deadline);
            protokoll.push({ url: startseite.url, status: 200, bytes: startseite.bytes, ms: startseite.ms });
            break;
        } catch (e) {
            letzterFehler = e;
            protokoll.push({ url: v, status: e instanceof NetzFehler ? (e.status ?? null) : null, bytes: 0, ms: Date.now() - t0, fehler: e instanceof Error ? e.message : String(e) });
            // Nur bei Netzproblemen weitere Varianten versuchen, nicht bei 404/kein HTML/gesperrt
            if (!(e instanceof NetzFehler) || !['dns', 'verbindung', 'zeit'].includes(e.code)) break;
            if (Date.now() > deadline - 1500) break;
        }
    }
    if (!startseite) throw netzZuScanFehler(letzterFehler);
    const tWebsite = Date.now() - start;

    const startAnalyse = analysiereSeite(startseite.html, startseite.url, true);
    const seiten: SeitenRoh[] = [{ analyse: startAnalyse, html: startseite.html }];
    const plattform = plattformVon(startAnalyse, startseite.html);
    if (plattform) hinweise.push(`Plattform: ${plattform}`);

    // 2. Unterseiten + Stylesheets parallel
    const unterseiten = waehleUnterseiten(startAnalyse, startseite.url, startAnalyse.lang);
    const css = waehleStylesheets(startAnalyse.stylesheets, startseite.url);
    const [unterErg, cssErg, logos] = await Promise.all([
        Promise.allSettled(unterseiten.map((u) => holeHtml(u, deadline - 250))),
        Promise.allSettled(
            css.map((u) =>
                holeSicher(u, {
                    akzeptiere: 'css',
                    zeitMs: Math.max(200, Math.min(SEITE_MS, deadline - 250 - Date.now())),
                    maxBytes: CSS_MAX,
                    abschneiden: true,
                }),
            ),
        ),
        pruefeLogos(startAnalyse.logo_kandidaten, deadline),
    ]);
    unterErg.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            protokoll.push({ url: r.value.url, status: 200, bytes: r.value.bytes, ms: r.value.ms });
            seiten.push({ analyse: analysiereSeite(r.value.html, r.value.url, false), html: r.value.html });
        } else {
            const e = r.reason;
            protokoll.push({ url: unterseiten[i], status: e instanceof NetzFehler ? (e.status ?? null) : null, bytes: 0, ms: 0, fehler: e instanceof Error ? e.message : String(e) });
        }
    });
    let cssText = startAnalyse.inline_css;
    cssErg.forEach((r) => {
        if (r.status === 'fulfilled') cssText += '\n' + dekodiere(r.value.body, r.value.contentType);
    });

    // 3. Zusammenführen
    const alleJsonLd = seiten.flatMap((s) => s.analyse.jsonld);
    const betrieb = besterBetrieb(alleJsonLd);
    const websiteKnoten = alleJsonLd.find((k) => /website/i.test(typVon(k)));
    const jsonldName = text(betrieb?.name) ?? text(websiteKnoten?.name);
    const { firma, quelle } = bestimmeFirma(jsonldName, startAnalyse.og_site_name, startAnalyse.titel, new URL(startseite.url).hostname);

    // Zeilen: Startseite zuerst, Dubletten (Navigation/Footer) nur einmal
    const gesehen = new Set<string>();
    const alleZeilen: string[] = [];
    for (const s of seiten) {
        for (const z of s.analyse.zeilen) {
            const key = z.toLowerCase();
            if (gesehen.has(key)) continue;
            gesehen.add(key);
            if (z.length < 400 && COOKIE_ZEILE_RE.test(z)) continue;
            alleZeilen.push(z);
        }
    }
    let textGesamt = '';
    for (const z of alleZeilen) {
        if (textGesamt.length + z.length + 1 > TEXT_MAX) break;
        textGesamt += (textGesamt ? '\n' : '') + z;
    }

    // Telefon: JSON-LD > tel:-Links (Häufigkeit) > Text (Häufigkeit)
    const telefone: string[] = [];
    const telDazu = (n: string | null) => {
        if (n && !telefone.includes(n)) telefone.push(n);
    };
    telDazu(betrieb ? normalisiereGefundeneNummer(String(text(betrieb.telephone) ?? '')) : null);
    for (const n of haeufigste(seiten.flatMap((s) => s.analyse.tel_links).map((t) => normalisiereGefundeneNummer(t) ?? '').filter(Boolean))) telDazu(n);
    for (const n of haeufigste(findeTelefone(alleZeilen))) telDazu(n);

    // E-Mail: JSON-LD > mailto > Text; eigene Domain bevorzugt
    const hostBasis = ohneWww(new URL(startseite.url).hostname);
    const mailRoh = [
        ...(betrieb && text(betrieb.email) ? [String(text(betrieb.email)).replace(/^mailto:/i, '').toLowerCase()] : []),
        ...haeufigste(seiten.flatMap((s) => s.analyse.mailto)),
        ...haeufigste(findeEmails(alleZeilen)),
    ].filter((m) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(m) && !MAIL_SPERRE.test(m));
    const emails = [...new Set(mailRoh)].sort((a, b) => Number(b.endsWith(hostBasis)) - Number(a.endsWith(hostBasis))).slice(0, 5);

    // Adresse
    const adressen: string[] = [];
    const jsonAdr = betrieb ? jsonLdAdresse(betrieb.address) : null;
    if (jsonAdr) adressen.push(jsonAdr);
    const gefundeneAdr = findeAdressen(alleZeilen);
    for (const a of haeufigste(gefundeneAdr.filter((x) => x.mitStrasse).map((x) => x.adresse))) if (!adressen.includes(a)) adressen.push(a);
    for (const a of haeufigste(gefundeneAdr.filter((x) => !x.mitStrasse).map((x) => x.adresse))) if (!adressen.includes(a)) adressen.push(a);

    // Öffnungszeiten
    const oeffnungszeiten: string[] = [];
    const jsonZeiten = betrieb ? jsonLdOeffnungszeiten(betrieb) : null;
    if (jsonZeiten) oeffnungszeiten.push(jsonZeiten);
    for (const o of findeOeffnungszeiten(alleZeilen)) if (!oeffnungszeiten.includes(o)) oeffnungszeiten.push(o);

    // Überschriften, Navigation, Abschnitte
    const ueberschriften = [...new Set(seiten.flatMap((s) => s.analyse.ueberschriften))].slice(0, 60);
    const navigation = startAnalyse.navigation.slice(0, 40);
    const abschnitte: Abschnitt[] = [];
    for (const a of seiten.flatMap((s) => s.analyse.abschnitte)) {
        if (abschnitte.some((x) => x.titel.toLowerCase() === a.titel.toLowerCase() || x.text === a.text)) continue;
        abschnitte.push(a);
        if (abschnitte.length >= 40) break;
    }

    // Farben
    const { variablen, buttons } = cssFarben(cssText);
    const farben = bestimmeFarben(startAnalyse.theme_color, variablen, [...buttons, ...startAnalyse.stil_farben]);

    const extrakt: Extrakt = {
        start_url: url.toString(),
        end_url: startseite.url,
        host: hostBasis,
        sprache: startAnalyse.lang,
        seiten: protokoll,
        titel: startAnalyse.titel,
        meta_description: startAnalyse.meta_description,
        og_site_name: startAnalyse.og_site_name,
        og_image: startAnalyse.og_image,
        jsonld_name: jsonldName,
        jsonld_beschreibung: text(betrieb?.description),
        firma,
        firma_quelle: quelle,
        logo_kandidaten: logos.slice(0, 8),
        theme_color: startAnalyse.theme_color,
        css_farben: [...new Set(variablen.map((v) => v.farbe))].slice(0, 8),
        button_farben: haeufigste(buttons).slice(0, 8),
        farben,
        telefone: telefone.slice(0, 5),
        emails,
        adressen: adressen.slice(0, 3),
        oeffnungszeiten: oeffnungszeiten.slice(0, 3),
        ueberschriften,
        navigation,
        abschnitte,
        text: textGesamt,
        plattform,
        hinweise,
    };

    const dauer = Date.now() - start;
    const schritte: Schritt[] = [
        { schluessel: 'website', ok: true, detail: `${seiten.length} Seite(n)`, ms: tWebsite },
        { schluessel: 'unternehmen', ok: quelle !== 'host' || !!extrakt.meta_description, detail: `${firma} (${quelle})`, ms: dauer },
        { schluessel: 'kontakt', ok: telefone.length > 0 || emails.length > 0, detail: `${telefone.length} Tel., ${emails.length} E-Mail`, ms: dauer },
        { schluessel: 'oeffnungszeiten', ok: true, detail: oeffnungszeiten.length ? 'gefunden' : 'keine Angabe', ms: dauer },
        { schluessel: 'leistungen', ok: ueberschriften.length > 0 || textGesamt.length > 200, detail: `${ueberschriften.length} Überschriften`, ms: dauer },
        { schluessel: 'branding', ok: extrakt.logo_kandidaten.length > 0 || !!farben, detail: `${extrakt.logo_kandidaten.length} Logo-Kandidaten`, ms: dauer },
    ];
    return { extrakt, schritte, dauer_ms: dauer };
}
