/**
 * Website-Scanner der KI-Telefonassistent-Demo (AUFTRAG-092, Teil A).
 *
 * Ablauf: URL normalisieren → Startseite (≤ 5,5 s, A-096) → bis zu 8 priorisierte
 * interne Seiten (A-102) + bis zu 4 Stylesheets, Manifest und Sprite-Dateien parallel
 * (je ≤ 4 s, höchstens 6 HTML-Abrufe gleichzeitig) → Team-Runde: bis zu 6 Personen-
 * Unterseiten, Leitung zuerst (A-102; reicht das Budget nicht, lädt der Profil-Schritt
 * sie nach) → Extraktion (Personen, Text bis 20 000 Zeichen je Seite anteilig) →
 * Logo-Umgebung und gewichtete Markenfarbe (A-096).
 * Gesamtbudget 8 s, HTML max. 1,5 MB, CSS max. 300 kB, Sprite max. 1 MB.
 * Keine Browser-Automation.
 */
import { holeSicher, dekodiere, NetzFehler, pruefeUrlFormal } from './netz';
import { analysiereBild, erkenneFormat } from './bildanalyse';
import { bereinigeSvg, bewerteMitAnalyse, groessereVariante, kaskadenSchluessel, logosAusCss, ordneLogos, spriteEinbetten, symbolAusSprite, vorrang, type CssLogo } from './logo';
import { ahnenFuerSelektor, analysiereSeite, bereinigeText, COOKIE_ZEILE_RE, type SeitenAnalyse } from './extraktion';
import { normalisiereGefundeneNummer } from './nummer';
import { parseCssFarbe } from './farben';
import { bestimmeMarkenfarbe, FARB_GEWICHT_LOGO, farbHaeufigkeit, istFrameworkFarbe, istKraeftig, type FarbSignal } from './markenfarbe';
import { baueHintergrundIndex, bestimmeUmgebung, type Ahne } from './umgebung';
import { findeOeffnungszeiten, istOeffnungszeitText } from './oeffnungszeiten';
import { firmenWoerterVon, fuehrePersonenZusammen, istPersonenLink, MAX_TEAM_SEITEN, namensSchluessel, ordneTeamLinks, personAusTeamSeite, type PersonFund, type TeamLink } from './personen';
import type { Abschnitt, Extrakt, LogoKandidat, Schritt, SeitenProtokoll } from './typen';

export { istFrameworkFarbe } from './markenfarbe';
export { findeOeffnungszeiten, istOeffnungszeitText, istOeffnungszeitZeile } from './oeffnungszeiten';

export const SCAN_BUDGET_MS = 8000;
const SEITE_MS = 4000;
const STARTSEITE_MS = 5500;
const HTML_MAX = 1_500_000;
const CSS_MAX = 300_000;
/** AUFTRAG-102: bis zu 8 Unterseiten (vorher 5), Text bis 20 000 Zeichen (vorher 12 000), je Seite anteilig */
export const MAX_UNTERSEITEN = 8;
const MAX_CSS = 4;
export const TEXT_MAX = 20_000;

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

/**
 * Seitenarten in der Reihenfolge des Auftrags (AUFTRAG-102): Kontakt, Impressum,
 * Über uns/Team, Leistungen, Preise, Öffnungszeiten, FAQ, Standorte. Je Art die
 * beste Seite (Navigation, kurzer Pfad, früh im Dokument), danach weitere Seiten
 * der Hauptnavigation. Blog-Artikel (lange Pfade/Slugs), Kategorien, Rechtstexte
 * ausser dem Impressum und andere Sprachen fallen weg.
 */
export const SEITEN_ARTEN: Array<{ art: string; re: RegExp }> = [
    { art: 'kontakt', re: /kontakt|contact/i },
    { art: 'impressum', re: /impressum|imprint|rechtliche[s]? angaben/i },
    { art: 'ueber-uns', re: /über-uns|ueber-uns|uber-uns|über uns|ueber uns|about|team|mitarbeit|personen|geschäftsleitung|geschaeftsleitung|unternehmen|firma|portrait|wir-sind|wer-wir-sind|praxisteam|(?:^|\/)praxis(?:\/|$)/i },
    { art: 'leistungen', re: /leistung|angebot|services?\b|dienstleistung|behandlung|sortiment|produkte|loesungen|lösungen|kompetenzen|was-wir-tun|fachgebiet/i },
    { art: 'preise', re: /preise|tarife|kosten|honorar|preisliste/i },
    { art: 'oeffnungszeiten', re: /öffnungszeit|oeffnungszeit|offnungszeit|sprechstunde|praxiszeit|bürozeit|geschaeftszeit|geschäftszeit/i },
    { art: 'faq', re: /\bfaq\b|häufige fragen|haeufige-fragen|fragen-und-antworten|fragen & antworten/i },
    { art: 'standorte', re: /standort|filiale|anfahrt|lageplan|niederlassung/i },
];

const DATEI_RE = /\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|pptx?|mp4|mp3|ics|vcf)(\?|$)/i;
const KEINE_SEITE_RE =
    /\/(?:category|kategorie|tag|tags|author|autor|feed|wp-json|wp-admin|wp-login|page\/\d+|cart|warenkorb|checkout|kasse|login|anmelden|konto|account|suche|search)(?:\/|$)|datenschutz|privacy|agb|cookie|newsletter|\/(?:blog|news|aktuelles|aktuell|events?|jobs?|karriere|stellen|stellenangebote|medien|presse)(?:\/|$)/i;

/** Blog-/Artikel-Seite? (lange Slugs, Datum im Pfad, tiefe Pfade) */
function istArtikel(pfad: string): boolean {
    const teile = pfad.split('/').filter(Boolean);
    const slug = teile[teile.length - 1] ?? '';
    return slug.split('-').length >= 6 || slug.length > 55 || /\/(?:19|20)\d{2}\/\d{2}\//.test(pfad) || teile.length > 3;
}

export function waehleUnterseiten(seite: SeitenAnalyse, startUrl: string, sprache: string | null, max = MAX_UNTERSEITEN): string[] {
    const start = new URL(startUrl);
    const kandidaten = new Map<string, { url: string; merkmal: string; tiefe: number; nav: boolean; reihenfolge: number; artikel: boolean }>();
    seite.links.forEach(({ url, text, nav }, reihenfolge) => {
        let u: URL;
        try {
            u = new URL(url);
        } catch {
            return;
        }
        if (ohneWww(u.hostname) !== ohneWww(start.hostname)) return;
        if (DATEI_RE.test(u.pathname)) return;
        u.hash = '';
        let pfad = u.pathname.toLowerCase();
        try {
            pfad = decodeURIComponent(u.pathname).toLowerCase();
        } catch {
            /* roh */
        }
        if (pfad === start.pathname.toLowerCase() || pfad === '/' || pfad === '' || /^\/(?:de|de-ch|home|startseite|index\.(?:html?|php))\/?$/.test(pfad)) return;
        // andere Sprachversionen meiden, wenn die Startseite deutsch ist
        if ((!sprache || sprache.startsWith('de')) && /^\/(en|fr|it|es)(\/|$)/.test(pfad)) return;
        if (KEINE_SEITE_RE.test(pfad) && !/impressum|imprint/.test(pfad)) return;
        // Unterseiten einzelner Personen lädt die Team-Runde (höchstens 6, Leitung zuerst)
        if (istPersonenLink(u.toString())) return;
        const schluessel = u.toString().replace(/\/$/, '');
        const da = kandidaten.get(schluessel);
        const merkmal = `${pfad} ${text.toLowerCase()}`;
        if (da) {
            da.merkmal += ` ${text.toLowerCase()}`;
            da.nav = da.nav || !!nav;
            return;
        }
        kandidaten.set(schluessel, { url: u.toString(), merkmal, tiefe: pfad.split('/').filter(Boolean).length, nav: !!nav, reihenfolge, artikel: istArtikel(pfad) });
    });
    const liste = [...kandidaten.values()];
    const gewaehlt: string[] = [];
    const rang = (k: (typeof liste)[number]) => k.tiefe * 2 - (k.nav ? 3 : 0) + k.reihenfolge * 0.001;
    const bester = (re: RegExp) =>
        liste
            .filter((k) => !k.artikel && !gewaehlt.includes(k.url) && re.test(k.merkmal))
            .sort((a, b) => rang(a) - rang(b))[0];
    // 1. je Seitenart die beste Seite
    for (const { re } of SEITEN_ARTEN) {
        if (gewaehlt.length >= max) break;
        const k = bester(re);
        if (k) gewaehlt.push(k.url);
    }
    // 2. eine zweite Leistungs- bzw. Über-uns-Seite
    for (const art of ['leistungen', 'ueber-uns']) {
        if (gewaehlt.length >= max) break;
        const k = bester(SEITEN_ARTEN.find((a) => a.art === art)!.re);
        if (k) gewaehlt.push(k.url);
    }
    // 3. Hauptnavigation (Produkt-/Leistungsseiten mit Eigennamen, z. B. «BINTegration»)
    for (const k of liste.filter((x) => x.nav && !x.artikel && x.tiefe <= 2 && !gewaehlt.includes(x.url)).sort((a, b) => a.reihenfolge - b.reihenfolge)) {
        if (gewaehlt.length >= max) break;
        gewaehlt.push(k.url);
    }
    return gewaehlt.slice(0, max);
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

/**
 * Telefonnummern aus Textzeilen: nur CH/FL-Formate (normalisiereGefundeneNummer),
 * keine Fax-Nummern (AUFTRAG-096: «Fax», «Telefax», «F», «F:» vor der Nummer —
 * auch wenn Tel. und Fax in derselben Zeile stehen), keine Konto-/UID-Zeilen.
 */
export function findeTelefone(zeilen: string[]): string[] {
    const aus: string[] = [];
    for (const z of zeilen) {
        if (/iban|uid|mwst|che-\d|konto|bic|swift/i.test(z)) continue;
        let letztesEnde = 0;
        for (const m of z.matchAll(TEL_RE)) {
            const start = m.index ?? 0;
            // Text zwischen der vorigen Nummer und dieser: dort steht die Bezeichnung
            const davor = z.slice(Math.max(letztesEnde, start - 24), start);
            letztesEnde = start + m[0].length;
            if (/fax|telefax/i.test(davor) || /(?:^|[\s|,;/(])F\s?[.:]?\s*$/.test(davor)) continue;
            const n = normalisiereGefundeneNummer(m[0]);
            if (n) aus.push(n);
        }
    }
    return aus;
}

/** Fax-Nummern (zum Aussortieren von tel:-Links und JSON-LD, die auf eine Fax-Nummer zeigen). */
export function findeFaxnummern(zeilen: string[]): Set<string> {
    const fax = new Set<string>();
    for (const z of zeilen) {
        let letztesEnde = 0;
        for (const m of z.matchAll(TEL_RE)) {
            const start = m.index ?? 0;
            const davor = z.slice(Math.max(letztesEnde, start - 24), start);
            letztesEnde = start + m[0].length;
            if (/fax|telefax/i.test(davor) || /(?:^|[\s|,;/(])F\s?[.:]?\s*$/.test(davor)) {
                const n = normalisiereGefundeneNummer(m[0]);
                if (n) fax.add(n);
            }
        }
    }
    return fax;
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

// Öffnungszeiten: strenge Prüfung in oeffnungszeiten.ts (AUFTRAG-096, Teil 4)

/** Adresse nur mit 4-stelliger PLZ und Ortsname (nicht «Switzerland», «Schweiz» …). */
export function istAdresse(a: string | null | undefined): boolean {
    if (!a) return false;
    const m = a.match(/\b([1-9]\d{3})\s+(\p{Lu}[\p{L}.'-]+)/u);
    return !!m && !/^(switzerland|schweiz|suisse|svizzera|ch|liechtenstein)$/i.test(m[2]);
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
        // schema.org-Form «Mo,Tu 08:30-12:00» bzw. «Mo-Fr 08:00-17:00»: je Tag zusammenführen
        // (AUFTRAG-095: sonst entstehen Ketten wie «Mo 08:30–12:00, Mo 13:30–17:30, Di …, ,»)
        const kompakt = openingHoursKompakt(ohListe);
        if (kompakt) return kompakt;
        return ohListe
            .map((s) =>
                s.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => TAGE_DE[TAGE_EN[d.toLowerCase()]]).replace(/-/g, '–'),
            )
            .join('; ')
            .replace(/[,;\s]+$/, '');
    }
    return null;
}

const OH_TAG = '(Mo|Tu|We|Th|Fr|Sa|Su)';
const OH_TAGE_RE = new RegExp(`^${OH_TAG}(?:\\s*-\\s*${OH_TAG})?$`, 'i');
const OH_EINTRAG_RE = new RegExp(`^(?:${OH_TAG}(?:\\s*-\\s*${OH_TAG})?\\s+)?(\\d{1,2}:\\d{2})\\s*-\\s*(\\d{1,2}:\\d{2})$`, 'i');

function ohTage(von: string, bis?: string): number[] {
    const a = TAGE_EN[von.toLowerCase()];
    const b = bis ? TAGE_EN[bis.toLowerCase()] : a;
    if (a === undefined || b === undefined) return [];
    const aus: number[] = [];
    for (let t = a; ; t = (t + 1) % 7) {
        aus.push(t);
        if (t === b || aus.length > 7) break;
    }
    return aus;
}

/** openingHours (schema.org-Textform) → «Mo–Fr 08:30–12:00, 13:30–17:30; Sa 09:00–12:00»; null, wenn nicht eindeutig lesbar. */
export function openingHoursKompakt(liste: string[]): string | null {
    const proTag = new Map<number, string[]>();
    for (const roh of liste) {
        const teile = roh.split(/\s*[,;]\s*/).map((t) => t.trim()).filter(Boolean);
        let offeneTage: number[] = [];
        let letzteTage: number[] = [];
        for (const t of teile) {
            const nurTage = t.match(OH_TAGE_RE);
            if (nurTage) {
                offeneTage.push(...ohTage(nurTage[1], nurTage[2]));
                continue;
            }
            const m = t.match(OH_EINTRAG_RE);
            if (!m) return null;
            // «Mo-Fr 08:00-12:00, 13:30-17:00»: Zeit ohne Tage gilt für die zuletzt genannten Tage
            let tage = [...offeneTage, ...(m[1] ? ohTage(m[1], m[2]) : [])];
            if (!tage.length) tage = letzteTage;
            offeneTage = [];
            if (!tage.length) return null;
            letzteTage = tage;
            const zeit = `${zeitKurz(m[3])}–${zeitKurz(m[4])}`;
            for (const tag of tage) {
                const z = proTag.get(tag) ?? [];
                if (!z.includes(zeit)) z.push(zeit);
                proTag.set(tag, z);
            }
        }
    }
    if (!proTag.size) return null;
    const nachZeit = new Map<string, number[]>();
    for (const [tag, zeiten] of proTag) {
        const key = zeiten.sort().join(', ');
        nachZeit.set(key, [...(nachZeit.get(key) ?? []), tag]);
    }
    return [...nachZeit.entries()]
        .sort((a, b) => Math.min(...a[1]) - Math.min(...b[1]))
        .map(([zeiten, tage]) => `${tagesGruppen(tage)} ${zeiten}`)
        .join('; ');
}

/* ------------------------------------------------------------------ */
/* Farben                                                              */
/* ------------------------------------------------------------------ */

/** CSS-Variablen mit primary/brand/accent/main im Namen (AUFTRAG-096: «main» allgemein). */
const CSS_VAR_RE = /--([a-z0-9_-]*?(?:primary|brand|accent|main|theme-color|color-1|ast-global-color-0)[a-z0-9_-]*)\s*:\s*([^;}{!]+)/gi;
/** Variablen von Bibliotheken, Cookie-Bannern usw. — deren «primary/theme» ist nicht die Marke. */
const FREMD_VAR_RE = /^(swiper|plyr|fancybox|glide|splide|slick|toastify|lightbox|lg-|mejs|cc-|cmplz|borlabs|klaro|cky|cookie|usercentrics|uc-|onetrust|ot-|tw-|fa-|ck-|mdc-|mat-|ion-|wp-admin|wp--preset--gradient|bs-(?!primary)|joomla|toolbar|admin|mce|tox-|leaflet|mapbox|gm-|recaptcha|grecaptcha|wpforms|gform|ff-|nf-|woocommerce|wc-|select2|choices|flatpickr|pswp|photoswipe|aos|elementor-(?!kit)|e-global-color-(?:secondary|text))/i;
const EXAKT_VAR_RE = /^(primary|brand|main|color-primary|primary-color|brand-color|color-brand|main-color|color-main|brand-primary|primary-brand|theme-primary|e-global-color-primary|wp--preset--color--primary|bs-primary|colou?r-1|global-color-primary|theme-color|(?:wp--preset--color--)?ast-global-color-0)$/i;
/** Astra: global-color-0 ist die Hauptfarbe, 1–8 sind Neben- und Grautöne (A-096: Hustech zeigte sonst Grün statt Rot). */
const NEBEN_VAR_RE = /ast-global-color-[1-9]$/i;
const BUTTON_SELEKTOR_RE =
    /(^|[\s,>+~])(button|\.btn|\.button|\.cta|\.wp-block-button|\.elementor-button|\.primary|input\[type=.?submit|a:hover|a\s*\{|a,|\.link)/i;

/** Letzter Teil eines Selektors (das Element, das die Deklaration trägt). */
function letzterTeil(selektor: string): string {
    const teile = selektor.trim().split(/\s*[\s>+~]\s*/);
    return teile[teile.length - 1] ?? '';
}

/**
 * Seitenflächen, deren deckender Hintergrund die Markenfarbe zeigt (AUFTRAG-096):
 * body/html/:root, Kopf (header, Navigation, Topbar) und Hero/Banner — jeweils als
 * LETZTER Teil des Selektors («.header .btn» zählt nicht als Kopf).
 */
const FLAECHE_RE =
    /^(?:html|body|:root|header|nav)(?:[.#:[]|$)|^[.#](?:site-header|main-header|page-header|header|header-top|header-main|header-wrapper|header-inner|masthead|navbar|nav|navigation|main-?nav|top-?bar|topbar|menu-?bar|hero|hero-section|banner|jumbotron|stage)(?:[.#:[]|$)/i;

/** Navigation als Vorfahre (z. B. «ul.nav li a»): deren Einträge bilden die farbige Leiste (Verhalten wie A-095). */
const NAV_RE = /(^|[\s>+~.#])(nav|navbar|navigation|main-?nav|main-?menu|menu-?bar|top-?bar|topbar|site-header|header)([\s>+~.#:[]|$)/i;
const NAV_EINTRAG_RE = /^(?:a|li|ul|\.nav-link|\.nav-item|\.menu-item|\.navbar-nav|\.menu)(?:[.#:[]|$)/i;

export interface CssFarbSignale {
    variablen: Array<{ farbe: string; gewicht: number; name: string }>;
    buttons: string[];
    /** deckende Hintergrundfarben von body/html/Kopf/Hero */
    flaechen: string[];
}

export function cssFarben(css: string): CssFarbSignale {
    const variablen: Array<{ farbe: string; gewicht: number; name: string }> = [];
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
    const gesehen = new Set<string>();
    for (const m of css.matchAll(CSS_VAR_RE)) {
        const name = m[1].toLowerCase();
        if (FREMD_VAR_RE.test(name) || NEBEN_VAR_RE.test(name) || /text|font|border|shadow|light|lighter|pale|bg-light|gray|grey|neutral|muted|contrast|inverse|on-primary|foreground|fg/i.test(name)) continue;
        const farbe = aufloesen(m[2]);
        if (!farbe || !istKraeftig(farbe)) continue;
        const schluessel = `${name}|${farbe}`;
        if (gesehen.has(schluessel)) continue;
        gesehen.add(schluessel);
        const exakt = EXAKT_VAR_RE.test(name);
        const gewicht = exakt ? 5 : /accent/.test(name) ? 2.5 : 3;
        variablen.push({ farbe, gewicht, name });
    }
    const buttons: string[] = [];
    const flaechen: string[] = [];
    for (const regel of css.split('}')) {
        const [selektorRoh, deklarationen] = regel.split('{');
        if (!deklarationen || !selektorRoh || selektorRoh.length > 400) continue;
        const selektor = selektorRoh.replace(/^[\s\S]*;/, '');
        if (!/:hover|:focus|:active|dropdown|sub-?menu|footer|modal|popup|cookie|consent/i.test(selektor) && selektor.split(',').some((s) => FLAECHE_RE.test(letzterTeil(s)) || (NAV_RE.test(s) && NAV_EINTRAG_RE.test(letzterTeil(s))))) {
            for (const d of deklarationen.matchAll(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/gi)) {
                const wert = d[1].replace(/!important/i, '').trim();
                if (/url\(|gradient\(/i.test(wert)) continue;
                const farbe = aufloesen(wert) ?? parseCssFarbe(wert.split(/\s+/)[0] ?? '');
                if (farbe && !istFrameworkFarbe(farbe)) flaechen.push(farbe);
            }
        }
        if (!BUTTON_SELEKTOR_RE.test(selektor)) continue;
        for (const d of deklarationen.matchAll(/(?:^|;)\s*(background(?:-color)?|color|border-color)\s*:\s*([^;]+)/gi)) {
            const wert = d[2].replace(/!important/i, '').trim();
            const farbe = aufloesen(wert) ?? parseCssFarbe(wert.split(/\s+/)[0] ?? '');
            if (farbe && !istFrameworkFarbe(farbe)) buttons.push(farbe);
        }
    }
    return { variablen, buttons, flaechen };
}

function haeufigste(liste: string[]): string[] {
    const z = new Map<string, number>();
    for (const f of liste) z.set(f, (z.get(f) ?? 0) + 1);
    return [...z.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
}

function zaehle(liste: string[]): Array<[string, number]> {
    const z = new Map<string, number>();
    for (const f of liste) z.set(f, (z.get(f) ?? 0) + 1);
    return [...z.entries()].sort((a, b) => b[1] - a[1]);
}

/** Gewichte der Farbsignale (AUFTRAG-096, Teil 3; Reihenfolge laut Auftrag). */
export const FARB_GEWICHTE = {
    variableExakt: 5,
    variable: 3,
    flaeche: 4,
    flaecheJeWeitere: 0.5,
    flaecheMaxBonus: 2,
    theme: 3,
    manifest: 2.5,
    haeufigkeit: [2.5, 1.5, 1],
    haeufigkeitVoll: 10,
    button: [1.5, 0.75],
    logo: FARB_GEWICHT_LOGO,
} as const;

/** Sammelt die gewichteten Farbsignale einer Website (ohne Logo-Farbe aus dem Browser). */
export function farbSignale(opt: { theme: string | null; manifest: string | null; css: CssFarbSignale; haeufigkeit: Array<{ farbe: string; anzahl: number }>; stilFarben: string[]; logoFarbe: string | null }): FarbSignal[] {
    const G = FARB_GEWICHTE;
    const signale: FarbSignal[] = [];
    for (const v of opt.css.variablen) signale.push({ farbe: v.farbe, gewicht: v.gewicht, quelle: 'css-variable' });
    zaehle(opt.css.flaechen.filter(istKraeftig)).forEach(([farbe, n], i) =>
        signale.push({ farbe, gewicht: (i === 0 ? G.flaeche : G.flaeche * 0.6) + Math.min(G.flaecheMaxBonus, G.flaecheJeWeitere * (n - 1)), quelle: 'hintergrund' }),
    );
    const theme = opt.theme ? parseCssFarbe(opt.theme) : null;
    if (theme && istKraeftig(theme)) signale.push({ farbe: theme, gewicht: G.theme, quelle: 'theme-color' });
    const manifest = opt.manifest ? parseCssFarbe(opt.manifest) : null;
    if (manifest && istKraeftig(manifest)) signale.push({ farbe: manifest, gewicht: G.manifest, quelle: 'manifest' });
    opt.haeufigkeit
        .filter((h) => h.anzahl >= 2)
        .slice(0, 3)
        .forEach((h, i) => signale.push({ farbe: h.farbe, gewicht: Math.round(G.haeufigkeit[i] * Math.min(1, h.anzahl / G.haeufigkeitVoll) * 100) / 100, quelle: 'haeufigkeit' }));
    haeufigste([...opt.css.buttons, ...opt.stilFarben].filter(istKraeftig))
        .slice(0, 2)
        .forEach((farbe, i) => signale.push({ farbe, gewicht: G.button[i], quelle: 'button' }));
    if (opt.logoFarbe) signale.push({ farbe: opt.logoFarbe, gewicht: G.logo, quelle: 'logo' });
    return signale;
}

/* ------------------------------------------------------------------ */
/* Firmenname                                                          */
/* ------------------------------------------------------------------ */

const GENERISCH = /^(home|startseite|start|willkommen|herzlich willkommen|welcome|index|homepage|accueil)$/i;
const RECHTSFORM = /\b(ag|gmbh|sa|sàrl|sarl|klg|kg|& co|genossenschaft|stiftung|verein|praxis|zahnarzt|zahnarztpraxis|ltd|inc)\b/i;

function vergleichsform(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

/** Zierzeichen am Rand («▷ Zahnarzt Winterthur», «» Startseite») entfernen. */
function ohneZierzeichen(s: string): string {
    return s.replace(/^[\s▷►▶▸»›•·|★☆✓✔→⇒–—\-:]+|[\s▷►▶▸»›•·|★☆✓✔→⇒–—\-:]+$/gu, '').trim();
}

/** Passt ein Name zum Host? Enthalten, oder Kürzel (BSC Young Boys → bscyb, Hockey Club Davos → hcd). */
function passtZumHost(s: string, hostVgl: string): boolean {
    const vgl = vergleichsform(s);
    if (hostVgl.length >= 3 && vgl.length >= 3 && (vgl.includes(hostVgl) || hostVgl.includes(vgl))) return true;
    const woerter = s.split(/[\s\-&+.]+/).map(vergleichsform).filter(Boolean);
    if (woerter.length < 2 || hostVgl.length < 3) return false;
    const initialen = woerter.map((w) => w[0]).join('');
    const ersteGanz = woerter[0] + woerter.slice(1).map((w) => w[0]).join('');
    return initialen === hostVgl || ersteGanz === hostVgl;
}

/** Firmenname mit Rechtsform im Text (Impressum/Fusszeile), passend zum Host — z. B. «Huber Fenster AG». */
function firmaAusText(zeilen: string[], hostVgl: string): string | null {
    if (hostVgl.length < 3) return null;
    const re = /(?:^|[\s,(©])((?:[A-ZÄÖÜ][\wÄÖÜäöüéèà&'.-]*\s){0,3}[A-ZÄÖÜ][\wÄÖÜäöüéèà&'.-]*)\s(AG|GmbH|SA|Sàrl|SARL|KlG|Genossenschaft)\b/g;
    for (const z of zeilen.slice(0, 1500)) {
        if (z.length > 300) continue;
        for (const m of z.matchAll(re)) {
            const name = m[1].trim();
            const vgl = vergleichsform(name);
            if (vgl.length >= 3 && (vgl === hostVgl || vgl.startsWith(hostVgl) || hostVgl.startsWith(vgl) || passtZumHost(name, hostVgl))) return `${name} ${m[2]}`;
        }
    }
    return null;
}

export function bestimmeFirma(
    jsonldName: string | null,
    ogSiteName: string | null,
    titel: string | null,
    host: string,
    zeilen: string[] = [],
): { firma: string; quelle: Extrakt['firma_quelle'] } {
    const hostLabel = ohneWww(host).split('.')[0];
    const hostVgl = vergleichsform(hostLabel);
    const name = jsonldName ? ohneZierzeichen(jsonldName) : null;
    if (name && name.length >= 2 && name.length <= 90 && !GENERISCH.test(name)) {
        return { firma: name, quelle: 'jsonld' };
    }
    // og:site_name mit Zusatz («Taxiphone Geneva - Official taxis»): Teil, der zum Host passt
    const og = ogSiteName ? ohneZierzeichen(ogSiteName) : null;
    if (og && og.length >= 2 && og.length <= 80 && !GENERISCH.test(og)) {
        const teile = og.split(/\s+[|–—-]\s+|\s*[|–—·•»]\s*/).map(ohneZierzeichen).filter((t) => t.length >= 2);
        const passend = teile.length > 1 ? teile.find((t) => passtZumHost(t, hostVgl)) : null;
        return { firma: passend ?? og, quelle: 'og:site_name' };
    }
    if (titel) {
        const segmente = titel
            .split(/\s+[|–—\-:·•»]\s+|\s*[|–—·•»]\s*|:\s+/)
            .map(ohneZierzeichen)
            .filter((s) => s.length >= 2 && s.length <= 80 && !GENERISCH.test(s));
        let best: { s: string; p: number } | null = null;
        for (const s of segmente) {
            let p = 0;
            if (passtZumHost(s, hostVgl)) p += 4;
            if (RECHTSFORM.test(s)) p += 2;
            p -= s.length / 40;
            if (!best || p > best.p) best = { s, p };
        }
        if (best && best.p > 0) {
            // «Sutter Begg in Basel» → «Sutter Begg», wenn der Rest weiterhin zum Host passt
            const kurz = best.s.replace(/\s+in\s+\p{Lu}[\p{L}.-]+(?:\s\p{Lu}[\p{L}.-]+)?$/u, '');
            return { firma: kurz !== best.s && passtZumHost(kurz, hostVgl) ? kurz : best.s, quelle: 'titel' };
        }
        if (segmente.length === 1 && segmente[0].length <= 40) return { firma: segmente[0], quelle: 'titel' };
    }
    const ausText = firmaAusText(zeilen, hostVgl);
    if (ausText) return { firma: ausText, quelle: 'text' };
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
    const nachGenerator: Array<[RegExp, string]> = [
        [/wix/, 'Wix'],
        [/jimdo/, 'Jimdo'],
        [/squarespace/, 'Squarespace'],
        [/webflow/, 'Webflow'],
        [/typo3/, 'TYPO3'],
        [/joomla/, 'Joomla'],
        [/contao/, 'Contao'],
        [/drupal/, 'Drupal'],
        [/wordpress/, 'WordPress'],
    ];
    for (const [re, name] of nachGenerator) if (re.test(g)) return name;
    if (/static\.wixstatic\.com|wix-warmup-data/i.test(html)) return 'Wix';
    if (/jimdo(cdn|free|site)|assets\.jimstatic\.com/i.test(html)) return 'Jimdo';
    if (/static1\.squarespace\.com|squarespace-cdn\.com/i.test(html)) return 'Squarespace';
    if (/data-wf-page|website-files\.com/i.test(html)) return 'Webflow';
    if (/cdn\.shopify\.com|\/cdn\/shop\/|Shopify\.theme/i.test(html)) return 'Shopify';
    if (/typo3conf|typo3temp/i.test(html)) return 'TYPO3';
    if (/\/media\/jui\/|\/components\/com_/i.test(html)) return 'Joomla';
    if (/wp-content\//i.test(html)) return /elementor/i.test(html) ? 'WordPress (Elementor)' : /et_pb_|themes\/Divi/.test(html) ? 'WordPress (Divi)' : 'WordPress';
    if (/__next|_next\/static/i.test(html)) return 'Next.js';
    return null;
}

interface SeitenRoh {
    analyse: SeitenAnalyse;
    html: string;
}

async function holeHtml(url: string, deadline: number, zeitMax = SEITE_MS): Promise<{ url: string; html: string; ms: number; bytes: number }> {
    const rest = deadline - Date.now();
    if (rest < 300) throw new NetzFehler('zeit', 'Zeitbudget aufgebraucht');
    const r = await holeSicher(url, {
        akzeptiere: 'html',
        zeitMs: Math.min(zeitMax, rest),
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

/** theme_color aus dem Web-App-Manifest (AUFTRAG-096, Signal 3); still null bei Fehler. */
async function holeManifestFarbe(url: string | null, deadline: number): Promise<string | null> {
    if (!url) return null;
    const zeit = Math.min(2500, deadline - Date.now());
    if (zeit < 200) return null;
    try {
        const r = await holeSicher(url, { akzeptiere: 'css', zeitMs: zeit, maxBytes: 60_000 });
        const json = JSON.parse(dekodiere(r.body, r.contentType)) as { theme_color?: unknown };
        return typeof json.theme_color === 'string' ? json.theme_color.slice(0, 40) : null;
    } catch {
        return null;
    }
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

/** Bytes eines data:-URI (base64 oder Prozent-kodiert). */
function dataUriBytes(uri: string): { body: Buffer; typ: string } | null {
    const m = uri.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/i);
    if (!m) return null;
    try {
        const body = m[2] ? Buffer.from(m[3].replace(/\s+/g, ''), 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8');
        return body.length <= LOGO_MAX_BYTES ? { body, typ: m[1].toLowerCase() } : null;
    } catch {
        return null;
    }
}

const LOGO_MAX_BYTES = 700_000;

/**
 * Prüft einen Logo-Kandidaten: lädt das Bild (bzw. analysiert Inline-SVG
 * und data:-URI direkt), bestimmt Format, Grösse, Transparenz, Helligkeit
 * und Gültigkeit (logo.ts). Bei CDN-Logos zuerst die grössere Variante.
 */
const SPRITE_MAX_BYTES = 1_000_000;

/** Pro Scan: geladene Sprite-Dateien (eine Datei für mehrere Symbole nur einmal holen). */
interface LogoKontext {
    startHost: string;
    sprites: Map<string, Promise<string | null>>;
}

function holeSprite(url: string, ctx: LogoKontext, deadline: number): Promise<string | null> {
    const da = ctx.sprites.get(url);
    if (da) return da;
    const versprechen = (async () => {
        let host = '';
        try {
            host = ohneWww(new URL(url).hostname);
        } catch {
            return null;
        }
        // gleiche Grenzen wie Stylesheets: nur dieselbe Site, max. 1 MB, Frist im Budget
        if (host !== ctx.startHost) return null;
        const zeit = Math.min(SEITE_MS, deadline - 150 - Date.now());
        if (zeit < 200) return null;
        try {
            const r = await holeSicher(url, { akzeptiere: 'bild', zeitMs: zeit, maxBytes: SPRITE_MAX_BYTES });
            return r.body.toString('utf8');
        } catch {
            return null;
        }
    })();
    ctx.sprites.set(url, versprechen);
    return versprechen;
}

/** Externe Sprite-Symbole eines Inline-SVG einbetten (AUFTRAG-096). */
async function loeseSpritesAuf(k: LogoKandidat, ctx: LogoKontext, deadline: number): Promise<string | null> {
    if (!k.inhalt || !k.sprite?.length) return k.inhalt ?? null;
    const symbole: string[] = [];
    for (const v of k.sprite) {
        const datei = await holeSprite(v.url, ctx, deadline);
        const sym = datei ? symbolAusSprite(datei, v.id) : null;
        if (sym) symbole.push(sym);
    }
    if (!symbole.length) return k.inhalt;
    return bereinigeSvg(spriteEinbetten(k.inhalt, symbole)) ?? k.inhalt;
}

async function pruefeLogo(k: LogoKandidat, deadline: number, ctx: LogoKontext): Promise<LogoKandidat> {
    const t0 = Date.now();
    if (k.inhalt) {
        if (k.quelle === 'inline-svg') {
            const inhalt = (await loeseSpritesAuf(k, ctx, deadline)) ?? k.inhalt;
            const body = Buffer.from(inhalt, 'utf8');
            return { ...bewerteMitAnalyse({ ...k, inhalt }, analysiereBild(body, 'image/svg+xml'), body.length), ms: Date.now() - t0 };
        }
        const d = dataUriBytes(k.inhalt);
        if (!d) return { ...k, geprueft: true, gueltig: false, grund: 'data:-URI ungültig' };
        if (erkenneFormat(d.body, d.typ) === 'svg') {
            const svg = bereinigeSvg(d.body.toString('utf8'));
            if (!svg) return { ...k, geprueft: true, gueltig: false, grund: 'SVG ungültig' };
            const body = Buffer.from(svg, 'utf8');
            return { ...bewerteMitAnalyse({ ...k, inhalt: svg }, analysiereBild(body, 'image/svg+xml'), body.length), ms: 0 };
        }
        return { ...bewerteMitAnalyse(k, analysiereBild(d.body, d.typ), d.body.length), ms: 0 };
    }
    if (!k.url) return { ...k, geprueft: true, gueltig: false, grund: 'keine Adresse' };
    const versuche = [groessereVariante(k.url), k.url].filter((u): u is string => !!u);
    let letzterGrund = 'nicht erreichbar';
    let wiederholt = false;
    for (const u of versuche) {
        const zeit = Math.min(3000, deadline - 150 - Date.now());
        if (zeit < 200) return { ...k, geprueft: true, gueltig: false, grund: 'Zeitbudget' };
        try {
            const r = await holeSicher(u, { akzeptiere: 'bild', zeitMs: zeit, maxBytes: LOGO_MAX_BYTES, abschneiden: true });
            let body = r.body;
            let typ = r.contentType;
            let inhalt: string | undefined;
            if (erkenneFormat(body, typ) === 'svg') {
                const svg = bereinigeSvg(body.toString('utf8'));
                if (!svg) {
                    letzterGrund = 'SVG ungültig';
                    continue;
                }
                body = Buffer.from(svg, 'utf8');
                typ = 'image/svg+xml';
                inhalt = undefined;
            }
            const geprueft = bewerteMitAnalyse(
                { ...k, url: u, ...(u !== k.url ? { url_original: k.url } : {}), ...(inhalt ? { inhalt } : {}) },
                analysiereBild(body, typ, r.abgeschnitten),
                r.body.length,
            );
            if (geprueft.format || u === k.url) return { ...geprueft, ms: Date.now() - t0 };
        } catch (e) {
            letzterGrund = e instanceof NetzFehler ? e.message : 'nicht erreichbar';
            // AUFTRAG-096: abgebrochene Verbindung (z. B. «socket hang up») einmal wiederholen, wenn Zeit bleibt —
            // sonst fällt das beste Logo wegen eines Netz-Aussetzers aus der Liste
            if (e instanceof NetzFehler && e.code === 'verbindung' && !wiederholt && deadline - Date.now() > 1500) {
                wiederholt = true;
                versuche.push(u);
            }
        }
    }
    return { ...k, geprueft: true, gueltig: false, grund: letzterGrund, ms: Date.now() - t0 };
}

/** Prüft die vielversprechendsten Kandidaten parallel (höchstens `max` Abrufe). */
async function pruefeLogoKandidaten(kandidaten: LogoKandidat[], deadline: number, ctx: LogoKontext, max = 6): Promise<LogoKandidat[]> {
    const reihe = vorrang(kandidaten);
    const mitAbruf = reihe.filter((k) => !k.inhalt).slice(0, max);
    const ohneAbruf = reihe.filter((k) => !!k.inhalt).slice(0, 4);
    const zuPruefen = [...ohneAbruf, ...mitAbruf];
    const ergebnisse = await Promise.all(zuPruefen.map((k) => pruefeLogo(k, deadline, ctx)));
    const rest = reihe.filter((k) => !zuPruefen.includes(k));
    return [...ergebnisse, ...rest];
}

/* ------------------------------------------------------------------ */
/* AUFTRAG-102: Team-Runde und Textbudget                              */
/* ------------------------------------------------------------------ */

/** Zeitlimit je Team-Unterseite (innerhalb des Gesamtbudgets) */
const TEAM_SEITE_MS = 3000;
/** Team-Runde nur, wenn danach noch so viel Budget bleibt */
const TEAM_MIN_REST_MS = 1200;
/** Team-Runde startet spätestens so lange vor Ablauf des Budgets (auch wenn noch Unterseiten fehlen) */
const TEAM_START_VOR_ENDE_MS = 3000;

const normUrl = (u: string) => u.replace(/#.*$/, '').replace(/\/$/, '').replace(/^https?:\/\/(www\.)?/i, '').toLowerCase();

/**
 * Team-Unterseiten laden: Links aus allen gelesenen Seiten (`/team/<name>/` …), höchstens 6,
 * nur gleiche Site (Links sind bereits auf den Host gefiltert), je max. 1,5 MB, im Gesamtbudget.
 * Reihenfolge: Leitung zuerst (Rolle in der Übersicht, Leitungsrolle auf anderen Seiten,
 * Name als Ansprechperson im Text anderer Seiten), sonst Website-Reihenfolge.
 * Liefert Funde (Name aus der Übersicht + Rolle/Zuständigkeit von der Unterseite).
 */
/** Gleichzeitige HTML-Abrufe begrenzen; wartende Abrufe in Prioritätsfolge (kleiner = früher). */
export class AbrufSchlange {
    private laufend = 0;
    private warten: Array<{ prio: number; los: () => void }> = [];
    private readonly max: number;
    constructor(max: number) {
        this.max = max;
    }
    async hole<T>(prio: number, f: () => Promise<T>): Promise<T> {
        if (this.laufend >= this.max) {
            await new Promise<void>((los) => {
                this.warten.push({ prio, los });
                this.warten.sort((a, b) => a.prio - b.prio);
            });
        }
        this.laufend++;
        try {
            return await f();
        } finally {
            this.laufend--;
            this.warten.shift()?.los();
        }
    }
}

/** Höchstens so viele HTML-Abrufe gleichzeitig an dieselbe Website (Browser-Standard je Host: 6). */
const HTML_PARALLEL = 6;

/**
 * Team-Links aller gelesenen Seiten: Funde aus der Übersicht (Name, ggf. Rolle der Karte) und die
 * geordnete Auswahl der Personen-Unterseiten (höchstens 6, Leitung zuerst; ohne bereits gelesene Seiten).
 */
function teamAuswahl(seiten: SeitenRoh[], fw: string[]): { funde: PersonFund[]; auswahl: TeamLink[] } {
    const geladenUrls = new Set(seiten.map((s) => normUrl(s.analyse.url)));
    const links: TeamLink[] = [];
    const gesehen = new Set<string>();
    seiten.forEach((s, si) => {
        for (const l of s.analyse.team_links) {
            const k = normUrl(l.url);
            if (gesehen.has(k)) continue;
            gesehen.add(k);
            links.push({ ...l, reihenfolge: si * 100_000 + 20_000 + l.reihenfolge });
        }
    });
    if (!links.length) return { funde: [], auswahl: [] };
    // Namen aus der Übersicht (ohne Rolle → «Teammitglied», mit Rolle aus der Karte)
    const funde: PersonFund[] = links.filter((l) => l.name).map((l) => ({ name: l.name as string, rolle: l.rolle, quelle: 'team-link' as const, reihenfolge: l.reihenfolge }));
    const bekannt = seiten.flatMap((s) => s.analyse.personen);
    const textAnderer = seiten
        .filter((s) => !s.analyse.team_links.length)
        .map((s) => s.analyse.zeilen.join('\n'))
        .join('\n')
        .slice(0, 300_000);
    const auswahl = ordneTeamLinks(
        links.filter((l) => !geladenUrls.has(normUrl(l.url)) && (!!l.name || istPersonenLink(l.url))),
        bekannt,
        textAnderer,
        fw,
    );
    return { funde, auswahl };
}

async function ladeTeamSeiten(seiten: SeitenRoh[], deadline: number, fw: string[], protokoll: SeitenProtokoll[], schlange: AbrufSchlange): Promise<TeamErgebnis> {
    const { funde, auswahl } = teamAuswahl(seiten, fw);
    // reicht das Scan-Budget nicht, lädt der Profil-Schritt die Seiten nach (ergaenzeTeam)
    if (!auswahl.length || deadline - Date.now() < TEAM_MIN_REST_MS) return { funde, geladen: 0, offen: auswahl, versucht: [] };
    const erg = await Promise.allSettled(auswahl.map((l, rang) => schlange.hole(-100 + rang, () => holeHtml(l.url, deadline - 350, TEAM_SEITE_MS))));
    let geladen = 0;
    const offen: TeamLink[] = [];
    erg.forEach((r, i) => {
        const l = auswahl[i];
        if (r.status !== 'fulfilled') {
            const e = r.reason;
            if (e instanceof NetzFehler && e.code === 'zeit') offen.push(l);
            protokoll.push({ url: l.url, status: e instanceof NetzFehler ? (e.status ?? null) : null, bytes: 0, ms: 0, fehler: e instanceof Error ? e.message : String(e), art: 'team' });
            return;
        }
        geladen++;
        protokoll.push({ url: r.value.url, status: 200, bytes: r.value.bytes, ms: r.value.ms, art: 'team' });
        const a = analysiereSeite(r.value.html, r.value.url, false);
        const p = personAusTeamSeite(a.zeilen, l, fw);
        if (p) funde.push({ name: p.name, rolle: p.rolle, zustaendigkeit: p.zustaendigkeit, quelle: 'team-seite', reihenfolge: l.reihenfolge });
    });
    return { funde, geladen, offen, versucht: auswahl.map((l) => normUrl(l.url)) };
}

/**
 * Team-Links aus Seiten, die erst NACH dem Start der Team-Runde ankamen (langsame Server):
 * deren Namen kommen dazu, ihre Personen-Seiten lädt der Profil-Schritt nach.
 */
function teamSpaet(seiten: SeitenRoh[], fw: string[], erst: TeamErgebnis): TeamErgebnis {
    const spaet = teamAuswahl(seiten, fw);
    const versucht = new Set(erst.versucht);
    const offenUrls = new Set(erst.offen.map((l) => normUrl(l.url)));
    const frei = Math.max(0, MAX_TEAM_SEITEN - erst.geladen - erst.offen.length);
    const neu = spaet.auswahl.filter((l) => !versucht.has(normUrl(l.url)) && !offenUrls.has(normUrl(l.url))).slice(0, frei);
    return { funde: [...erst.funde, ...spaet.funde], geladen: erst.geladen, offen: [...erst.offen, ...neu], versucht: erst.versucht };
}

export interface TeamErgebnis {
    funde: PersonFund[];
    geladen: number;
    /** ausgewählte Team-Seiten, für die das Scan-Budget nicht reichte (lädt der Profil-Schritt nach) */
    offen: TeamLink[];
    /** in der Team-Runde angefragte Seiten (normalisierte Adressen) */
    versucht: string[];
}

/** Zeit für das Nachladen offener Team-Seiten im Profil-Schritt (vor dem KI-Aufruf, Function-Limit 26 s) */
export const TEAM_NACHLADEN_MS = 3500;

/**
 * AUFTRAG-102: Team-Seiten nachladen, für die das Scan-Budget (8 s) nicht reichte — im
 * Profil-Schritt vor dem KI-Aufruf (POST /api/demo/profil, eigene Function, 26 s Limit:
 * höchstens 3,5 s hier + 17 s KI). Gleiche Regeln wie im Scan (gleiche Site, je max. 1,5 MB,
 * höchstens 6 Seiten, Leitung zuerst). Ändert `x` (Personen, Seitenprotokoll, Team-Zähler).
 */
export async function ergaenzeTeam(x: Extrakt, zeitMs = TEAM_NACHLADEN_MS): Promise<{ geladen: number; ms: number }> {
    const t0 = Date.now();
    const offen = (x.team_offen ?? []).slice(0, MAX_TEAM_SEITEN);
    delete x.team_offen;
    if (!offen.length) return { geladen: 0, ms: 0 };
    const deadline = t0 + zeitMs;
    const fw = firmenWoerterVon(x.host, x.og_site_name);
    const schlange = new AbrufSchlange(HTML_PARALLEL);
    const erg = await Promise.allSettled(offen.map((l, rang) => schlange.hole(rang, () => holeHtml(l.url, deadline - 100, TEAM_SEITE_MS))));
    // bisherige Personen als Funde (Reihenfolge bleibt), dazu die Funde der Team-Seiten
    const funde: PersonFund[] = x.personen.map((p, i) => ({ name: p.name, rolle: p.rolle === 'Teammitglied' ? null : p.rolle, zustaendigkeit: p.zustaendigkeit ?? null, quelle: 'text' as const, reihenfolge: i }));
    let geladen = 0;
    erg.forEach((r, i) => {
        const l = offen[i];
        if (r.status !== 'fulfilled') {
            const e = r.reason;
            x.seiten.push({ url: l.url, status: e instanceof NetzFehler ? (e.status ?? null) : null, bytes: 0, ms: 0, fehler: e instanceof Error ? e.message : String(e), art: 'team' });
            return;
        }
        geladen++;
        x.seiten.push({ url: r.value.url, status: 200, bytes: r.value.bytes, ms: r.value.ms, art: 'team' });
        const p = personAusTeamSeite(analysiereSeite(r.value.html, r.value.url, false).zeilen, l, fw);
        if (!p) return;
        const da = x.personen.findIndex((q) => namensSchluessel(q.name) === namensSchluessel(p.name));
        funde.push({ name: p.name, rolle: p.rolle, zustaendigkeit: p.zustaendigkeit, quelle: 'team-seite', reihenfolge: da >= 0 ? da : 1000 + i });
    });
    x.personen = fuehrePersonenZusammen(funde);
    x.team_seiten = (x.team_seiten ?? 0) + geladen;
    return { geladen, ms: Date.now() - t0 };
}

/** Mit «Mobile/Natel/Handy» bezeichnete Handynummern (Personen auf Team-Seiten) — nie ins Wissen. */
const MOBIL_RE = /(?:mobile?|natel|handy|mobil)\s*[.:]?\s*(?:\+41|0041|0)\s?7[5-9](?:[\s./-]?\d){7}/gi;
export function ohneMobilnummer(t: string): string {
    return t.replace(MOBIL_RE, '').replace(/\s{2,}/g, ' ').trim();
}

/** Rechtstexte und Fusszeilen-Floskeln (gehören nicht ins Wissen). */
const RECHTSTEXT_RE =
    /^(?:©|\(c\)|copyright\b)|alle rechte vorbehalten|all rights reserved|haftungsausschluss|haftung für (?:links|inhalte)|urheberrecht|datenschutzerklärung|google analytics|ip-adresse|dsgvo|\bdsg\b|gerichtsstand|cookie-?einstellungen|nutzungsbedingungen/i;
const RECHTS_LINKS_RE = /^(?:(?:impressum|datenschutz(?:erklärung)?|agb|rechtliches|disclaimer|sitemap|cookies?(?:-einstellungen)?|barrierefreiheit|kontakt)\s*(?:[|·•/–-]\s*)?){2,}$/i;

/** Zeile gehört zu Fusszeilen-Rechtstext? (Kurze Kontaktzeilen bleiben.) */
export function istRechtstext(z: string): boolean {
    const t = z.trim();
    if (RECHTS_LINKS_RE.test(t)) return true;
    if (/^(?:©|\(c\)|copyright\b)/i.test(t) && t.length < 200) return true;
    return t.length >= 80 && RECHTSTEXT_RE.test(t);
}

/**
 * Text aus den Zeilen aller Seiten mit anteiligem Budget (AUFTRAG-102): jede Seite bekommt
 * gleich viel; was eine Seite nicht braucht, geht an die übrigen (Wasserfüllung).
 * Dubletten (Navigation/Fusszeile) nur einmal, Cookie- und Rechtstexte nie.
 */
export function textNachBudget(seitenZeilen: string[][], max: number): string {
    const gesehen = new Set<string>();
    const proSeite = seitenZeilen.map((zeilen) =>
        zeilen.filter((z) => {
            const key = z.toLowerCase();
            if (gesehen.has(key)) return false;
            gesehen.add(key);
            return !((z.length < 400 && COOKIE_ZEILE_RE.test(z)) || istRechtstext(z));
        }),
    );
    const laengen = proSeite.map((z) => z.reduce((n, x) => n + x.length + 1, 0));
    const budget = laengen.map(() => 0);
    let rest = max;
    let offen = laengen.map((_, i) => i).filter((i) => laengen[i] > 0);
    while (rest > 0 && offen.length) {
        const anteil = Math.max(1, Math.floor(rest / offen.length));
        for (const i of offen) {
            const nimm = Math.min(anteil, laengen[i] - budget[i], rest);
            budget[i] += nimm;
            rest -= nimm;
        }
        offen = offen.filter((i) => budget[i] < laengen[i]);
    }
    const teile: string[] = [];
    let gesamt = 0;
    proSeite.forEach((zeilen, i) => {
        let n = 0;
        for (const z of zeilen) {
            if (n + z.length + 1 > budget[i] || gesamt + z.length + 1 > max) break;
            teile.push(z);
            n += z.length + 1;
            gesamt += z.length + 1;
        }
    });
    return teile.join('\n');
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
            // AUFTRAG-096: Startseite bis 5,5 s (langsame Server, z. B. Weiterleitung + 2 s Antwortzeit);
            // ohne Startseite gibt es gar kein Ergebnis — Unterseiten bekommen dann eben weniger Zeit
            startseite = await holeHtml(v, deadline, STARTSEITE_MS);
            protokoll.push({ url: startseite.url, status: 200, bytes: startseite.bytes, ms: startseite.ms, art: 'start' });
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

    // 2. Unterseiten (bis 8) + Stylesheets (+ Manifest, Sprites) parallel. Sobald die Unterseiten da sind,
    //    folgt die Team-Runde (AUFTRAG-102: bis 6 Personen-Unterseiten, Leitung zuerst) — Logo/CSS laufen weiter.
    const unterseiten = waehleUnterseiten(startAnalyse, startseite.url, startAnalyse.lang);
    const css = waehleStylesheets(startAnalyse.stylesheets, startseite.url);
    const logoKontext: LogoKontext = { startHost: ohneWww(new URL(startseite.url).hostname), sprites: new Map() };
    const firmenWoerter = firmenWoerterVon(new URL(startseite.url).hostname, startAnalyse.og_site_name);
    // höchstens 6 HTML-Abrufe gleichzeitig an die Website; Team-Seiten (Leitung zuerst) vor noch wartenden Unterseiten
    const schlange = new AbrufSchlange(HTML_PARALLEL);
    const unterUndTeam = async (): Promise<TeamErgebnis> => {
        // Jede Unterseite wird bei Ankunft analysiert; die Team-Runde startet, sobald alle da sind,
        // spätestens TEAM_START_VOR_ENDE_MS vor Ablauf des Budgets (mit den bis dahin gelesenen Seiten).
        const roh: Array<SeitenRoh | null | undefined> = unterseiten.map(() => undefined);
        const alle = Promise.all(
            unterseiten.map((u, i) =>
                schlange.hole(i, () => holeHtml(u, deadline - 250)).then(
                    (v) => {
                        protokoll.push({ url: v.url, status: 200, bytes: v.bytes, ms: v.ms, art: 'unterseite' });
                        roh[i] = { analyse: analysiereSeite(v.html, v.url, false), html: v.html };
                    },
                    (e: unknown) => {
                        protokoll.push({ url: u, status: e instanceof NetzFehler ? (e.status ?? null) : null, bytes: 0, ms: 0, fehler: e instanceof Error ? e.message : String(e), art: 'unterseite' });
                        roh[i] = null;
                    },
                ),
            ),
        );
        let uhr: ReturnType<typeof setTimeout> | undefined;
        const spaetestens = new Promise<void>((res) => {
            uhr = setTimeout(res, Math.max(0, deadline - TEAM_START_VOR_ENDE_MS - Date.now()));
        });
        await Promise.race([alle, spaetestens]);
        clearTimeout(uhr);
        const bisher = [seiten[0], ...roh.filter((r): r is SeitenRoh => !!r)];
        const teamPromise = ladeTeamSeiten(bisher, deadline, firmenWoerter, protokoll, schlange);
        await alle;
        // Reihenfolge der Seiten = Priorität der Auswahl (Kontakt, Impressum, Über uns, …)
        for (const r of roh) if (r) seiten.push(r);
        const team = await teamPromise;
        // Seiten, die erst nach dem Start der Team-Runde kamen: deren Team-Links nachtragen
        return seiten.length > bisher.length ? teamSpaet(seiten, firmenWoerter, team) : team;
    };
    const [team, cssErg, logos, manifestFarbe] = await Promise.all([
        unterUndTeam(),
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
        pruefeLogoKandidaten(startAnalyse.logo_kandidaten, deadline - 300, logoKontext),
        holeManifestFarbe(startAnalyse.manifest, deadline - 300),
    ]);
    let cssText = startAnalyse.inline_css;
    // CSS-Hintergründe auf Logo-Selektoren (relativ zur jeweiligen Stylesheet-Adresse)
    // Spätere Stylesheets überschreiben frühere (Kaskade): Reihenfolge fliesst in die Punkte ein
    const cssLogos: CssLogo[] = [...startAnalyse.css_logo];
    cssErg.forEach((r, blatt) => {
        if (r.status !== 'fulfilled') return;
        const text = dekodiere(r.value.body, r.value.contentType);
        cssText += '\n' + text;
        for (const l of logosAusCss(text, r.value.url)) {
            const punkte = l.punkte + blatt * 0.5;
            // gleicher Selektor im späteren Stylesheet überschreibt den früheren
            const schluessel = kaskadenSchluessel(l.selektor, l.media);
            for (let k = cssLogos.length - 1; k >= 0; k--) if (kaskadenSchluessel(cssLogos[k].selektor, cssLogos[k].media) === schluessel) cssLogos.splice(k, 1);
            const da = cssLogos.find((x) => x.url === l.url);
            if (da) da.punkte = Math.max(da.punkte, punkte);
            else cssLogos.push({ ...l, punkte });
        }
    });
    cssLogos.sort((a, b) => b.punkte - a.punkte);

    // Logo, Stufe 2: CSS-Kandidaten prüfen; ohne gültigen Kandidaten zuletzt /favicon.ico
    let logoListe = logos;
    const bekannt = new Set(logoListe.map((k) => k.url ?? ''));
    const naechste = Math.max(0, ...logoListe.map((k) => k.reihenfolge)) + 1;
    const cssKandidaten: LogoKandidat[] = cssLogos
        .filter((l) => !bekannt.has(l.url))
        .slice(0, 3)
        .map((l, i) => ({
            url: /^data:/i.test(l.url) ? null : l.url,
            inhalt: /^data:/i.test(l.url) ? l.url : undefined,
            quelle: 'css' as const,
            stufe: 1 as const,
            punkte: Math.round(l.punkte * 10) / 10,
            reihenfolge: naechste + i,
            hellName: /neg|white|weiss|inverse|light/i.test(l.url),
            logoWort: true,
            selektor: l.selektor,
        }));
    if (!logoListe.some((k) => k.gueltig) && !cssKandidaten.length) {
        const ico = new URL('/favicon.ico', startseite.url).toString();
        if (!bekannt.has(ico)) cssKandidaten.push({ url: ico, quelle: 'favicon.ico', stufe: 3, punkte: 0, reihenfolge: naechste + 5 });
    }
    if (cssKandidaten.length && deadline - Date.now() > 700) {
        logoListe = [...logoListe, ...(await pruefeLogoKandidaten(cssKandidaten, deadline - 150, logoKontext, 3))];
    } else {
        logoListe = [...logoListe, ...cssKandidaten];
    }
    const gesehenUrl = new Set<string>();
    logoListe = logoListe.filter((k) => {
        const key = k.url ?? k.inhalt?.slice(0, 300) ?? '';
        if (gesehenUrl.has(key)) return false;
        gesehenUrl.add(key);
        return true;
    });
    const logoGeordnet = ordneLogos(logoListe);
    const logo = logoGeordnet[0]?.gueltig ? logoGeordnet[0] : null;

    // Umgebung der besten Logos (AUFTRAG-096, Teil 2): Hintergrund des Logos auf der Website
    const index = baueHintergrundIndex(cssText);
    for (const k of logoGeordnet.filter((x) => x.gueltig).slice(0, 4)) {
        const kette = k.ahnen ?? (k.quelle === 'css' && k.selektor ? ahnenFuerSelektor(startseite.html, k.selektor) : null);
        if (!kette || kette.length < 2) continue;
        // ab dem Elternelement: der eigene Hintergrund des Logo-Elements ist Platzhalter bzw. das Logo selbst (CSS-Logo)
        const u = bestimmeUmgebung(kette.slice(1) as Ahne[], index);
        k.umgebung = u.farbe;
        k.umgebung_quelle = u.bild ? `Bild/Verlauf (${u.quelle})` : u.quelle;
    }
    // nur während des Scans gebraucht — nicht speichern
    for (const k of logoGeordnet) {
        delete k.ahnen;
        delete k.sprite;
        delete k.selektor;
    }

    // 3. Zusammenführen
    const alleJsonLd = seiten.flatMap((s) => s.analyse.jsonld);
    const betrieb = besterBetrieb(alleJsonLd);
    const websiteKnoten = alleJsonLd.find((k) => /website/i.test(typVon(k)));
    const jsonldName = text(betrieb?.name) ?? text(websiteKnoten?.name);

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
    const { firma, quelle } = bestimmeFirma(jsonldName, startAnalyse.og_site_name, startAnalyse.titel, new URL(startseite.url).hostname, alleZeilen);
    // AUFTRAG-102: Textbudget je Seite anteilig (Startseite zuerst, keine Dubletten, keine Cookie- und Rechtstexte)
    const textGesamt = textNachBudget(seiten.map((s) => s.analyse.zeilen.map(ohneMobilnummer).filter((z) => z.length >= 2)), TEXT_MAX);

    // Telefon: JSON-LD > tel:-Links (Häufigkeit) > Text (Häufigkeit); nie eine als Fax bezeichnete Nummer
    const telefone: string[] = [];
    const faxNummern = findeFaxnummern(alleZeilen);
    const telDazu = (n: string | null) => {
        if (n && !telefone.includes(n) && !faxNummern.has(n)) telefone.push(n);
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
    // Adresse: nur mit 4-stelliger PLZ und Ort (AUFTRAG-096)
    const adressen: string[] = [];
    const jsonAdr = betrieb ? jsonLdAdresse(betrieb.address) : null;
    if (jsonAdr && istAdresse(jsonAdr)) adressen.push(jsonAdr);
    const gefundeneAdr = findeAdressen(alleZeilen);
    for (const a of haeufigste(gefundeneAdr.filter((x) => x.mitStrasse).map((x) => x.adresse))) if (!adressen.includes(a) && istAdresse(a)) adressen.push(a);
    for (const a of haeufigste(gefundeneAdr.filter((x) => !x.mitStrasse).map((x) => x.adresse))) if (!adressen.includes(a) && istAdresse(a)) adressen.push(a);

    // Öffnungszeiten (AUFTRAG-096): JSON-LD → Kontakt/Impressum/Öffnungszeiten-Seite → Startseite;
    // weitere Unterseiten nur mit Block unter einer Öffnungszeiten-Überschrift. Sonst leer.
    const oeffnungszeiten: string[] = [];
    const jsonZeiten = betrieb ? jsonLdOeffnungszeiten(betrieb) : null;
    if (jsonZeiten && istOeffnungszeitText(jsonZeiten)) oeffnungszeiten.push(jsonZeiten);
    const ohneCookie = (s: SeitenRoh) => s.analyse.zeilen.filter((z) => !(z.length < 400 && COOKIE_ZEILE_RE.test(z)));
    const kontaktSeite = (s: SeitenRoh) => /kontakt|contact|impressum|imprint|öffnungszeit|oeffnungszeit|offnungszeit|sprechstunde|praxiszeit|standort|anfahrt|horaires|orari/i.test(decodeURIComponent(s.analyse.url));
    const reihe: Array<{ seite: SeitenRoh; nurBlock: boolean }> = [
        ...seiten.slice(1).filter(kontaktSeite).map((seite) => ({ seite, nurBlock: false })),
        { seite: seiten[0], nurBlock: false },
        ...seiten.slice(1).filter((s) => !kontaktSeite(s)).map((seite) => ({ seite, nurBlock: true })),
    ];
    for (const { seite, nurBlock } of reihe) {
        for (const o of findeOeffnungszeiten(ohneCookie(seite), nurBlock)) if (!oeffnungszeiten.includes(o)) oeffnungszeiten.push(o);
    }

    // Überschriften, Navigation, Abschnitte
    const ueberschriften = [...new Set(seiten.flatMap((s) => s.analyse.ueberschriften))].slice(0, 60);
    const navigation = startAnalyse.navigation.slice(0, 40);
    const abschnitte: Abschnitt[] = [];
    for (const roh of seiten.flatMap((s) => s.analyse.abschnitte)) {
        const a = { titel: roh.titel, text: ohneMobilnummer(roh.text) };
        if (abschnitte.some((x) => x.titel.toLowerCase() === a.titel.toLowerCase() || x.text === a.text)) continue;
        abschnitte.push(a);
        if (abschnitte.length >= 50) break;
    }

    // Farben (AUFTRAG-096): gewichtete Signale; die Logo-Farbe zählt nur, wenn der Server sie kennt
    // (PNG/SVG/ICO). Für WebP/JPEG ergänzt die Karte die im Browser gemessene Logo-Farbe.
    const cssSignale = cssFarben(cssText);
    const { variablen, buttons } = cssSignale;
    const signaleOhneLogo = farbSignale({ theme: startAnalyse.theme_color, manifest: manifestFarbe, css: cssSignale, haeufigkeit: farbHaeufigkeit(cssText), stilFarben: startAnalyse.stil_farben, logoFarbe: null });
    const markenfarbe = bestimmeMarkenfarbe([...signaleOhneLogo, ...(logo?.farbe ? [{ farbe: logo.farbe, gewicht: FARB_GEWICHTE.logo, quelle: 'logo' as const }] : [])]);
    const farben = markenfarbe ? { primaer: markenfarbe.primaer, sekundaer: markenfarbe.sekundaer } : null;

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
        logo_kandidaten: logoGeordnet.slice(0, 10),
        logo,
        theme_color: startAnalyse.theme_color,
        css_farben: [...new Set(variablen.map((v) => v.farbe))].slice(0, 8),
        button_farben: haeufigste(buttons).slice(0, 8),
        farben,
        farbe_quelle: markenfarbe?.quelle ?? null,
        farb_signale: signaleOhneLogo.slice(0, 24),
        telefone: telefone.slice(0, 5),
        emails,
        adressen: adressen.slice(0, 3),
        oeffnungszeiten: oeffnungszeiten.slice(0, 3),
        ueberschriften,
        navigation,
        abschnitte,
        text: textGesamt,
        personen: fuehrePersonenZusammen([...seiten.flatMap((s, si) => s.analyse.personen.map((f) => ({ ...f, reihenfolge: si * 100_000 + f.reihenfolge }))), ...team.funde]),
        team_seiten: team.geladen,
        ...(team.offen.length ? { team_offen: team.offen } : {}),
        plattform,
        hinweise,
    };

    const dauer = Date.now() - start;
    const schritte: Schritt[] = [
        { schluessel: 'website', ok: true, detail: `${seiten.length} Seite(n) + ${team.geladen} Team-Seite(n)`, ms: tWebsite },
        { schluessel: 'unternehmen', ok: quelle !== 'host' || !!extrakt.meta_description, detail: `${firma} (${quelle})`, ms: dauer },
        { schluessel: 'kontakt', ok: telefone.length > 0 || emails.length > 0, detail: `${telefone.length} Tel., ${emails.length} E-Mail`, ms: dauer },
        { schluessel: 'oeffnungszeiten', ok: true, detail: oeffnungszeiten.length ? 'gefunden' : 'keine Angabe', ms: dauer },
        { schluessel: 'leistungen', ok: ueberschriften.length > 0 || textGesamt.length > 200, detail: `${ueberschriften.length} Überschriften`, ms: dauer },
        { schluessel: 'branding', ok: !!logo || !!farben, detail: logo ? `Logo ${logo.quelle} ${logo.format} ${logo.breite ?? '?'}×${logo.hoehe ?? '?'}` : 'kein Logo', ms: dauer },
    ];
    return { extrakt, schritte, dauer_ms: dauer };
}
