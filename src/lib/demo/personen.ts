/**
 * Personen und Team einer Website (AUFTRAG-102, Teil 1).
 *
 * Quellen:
 * (a) JSON-LD: `Person` mit `jobTitle`, `founder`, `employee`, `member` des Betriebs;
 * (b) Team-Listen: Bild-`alt`/`title` nach dem Muster «Foto NAME», «Portrait NAME»,
 *     «NAME – ROLLE …» und Links auf Team-Unterseiten (`/team/<name>/` …);
 * (c) Textmuster: Name und Rolle in benachbarten Zeilen (Überschrift + Rolle, auch
 *     Rolle + Name wie im Impressum «Vertretungsberechtigte Person» / «NAME») oder in
 *     einer Zeile («NAME, Geschäftsführer», «Inhaberin: NAME», «Ihr Ansprechpartner für X: NAME»).
 * Team-Unterseiten: Name, Rolle (Zeile nach dem Namen) und Zuständigkeit (ein Satz).
 *
 * Datenschutz: Übernommen werden NUR Name, Rolle und Zuständigkeit, wie sie
 * öffentlich auf der Website stehen — keine Telefonnummern, keine E-Mail-Adressen;
 * Sätze mit Nummer, E-Mail oder Adresse fallen als Zuständigkeit weg.
 *
 * Reine Funktionen ohne Netz (Einheitstests in scripts/demo-einheit-test.mjs).
 */
import type { Person } from './typen';

export type PersonQuelle = 'jsonld' | 'bild' | 'text' | 'team-seite' | 'team-link';

/** Fund auf einer Seite (vor dem Zusammenführen). */
export interface PersonFund {
    name: string;
    rolle: string | null;
    zustaendigkeit?: string | null;
    quelle: PersonQuelle;
    /** Reihenfolge des Funds auf der Website (Seite × 10 000 + Zeile) */
    reihenfolge: number;
}

/** Link auf eine Team-Unterseite (Übersicht → /team/<name>/). */
export interface TeamLink {
    url: string;
    /** Name aus Link-Text, Überschrift oder Bild-alt im Link; null = nur aus dem Pfad bekannt */
    name: string | null;
    /** Name aus dem Pfad (zum Wiedererkennen auf der Unterseite) */
    slugName: string;
    /** Rolle, falls sie in der Karte der Übersicht steht */
    rolle: string | null;
    reihenfolge: number;
}

export const MAX_PERSONEN = 12;
export const MAX_TEAM_SEITEN = 6;

/* ------------------------------------------------------------------ */
/* Rollen                                                              */
/* ------------------------------------------------------------------ */

/** Leitung des Betriebs (für «Wer leitet FIRMA?» und die Reihenfolge). */
export const LEITUNG_RE =
    /(?:^|[^a-zäöü])(?:gesch(?:ä|ae)fts(?:f(?:ü|ue)hrer(?:in)?|f(?:ü|ue)hrung|leiter(?:in)?|inhaber(?:in)?|leitung)|vorsitz(?:ender|ende)? der gesch(?:ä|ae)ftsleitung|(?:mit)?inhaber(?:in)?|eigent(?:ü|ue)mer(?:in)?|ceo|managing director|direktor(?:in)?|(?:mit|co-?)?gr(?:ü|ue)nder(?:in)?|(?:co-?)?founder|praxisinhaber(?:in)?|praxisleiter(?:in)?|praxisleitung|klinikleit(?:er|erin|ung)|vertretungsberechtigt\w*|managing partner)(?![a-zäöü])/i;

/** Leitung im engeren Sinn: Geschäftsführung, Inhaber, Direktion, Gründer, Mitglied der GL — nicht Abteilungsleitung allein. */
export function istLeitung(rolle: string | null | undefined): boolean {
    if (!rolle) return false;
    const r = rolle.replace(/stellvertret\w*\s+(?:des|der)\s+\S+/gi, ' ');
    if (/(?:^|[,/]\s*)leitung\s*$/i.test(r.trim())) return true;
    if (!LEITUNG_RE.test(r)) return false;
    // «Assistentin der Geschäftsleitung», «Sekretariat der Geschäftsführung» sind keine Leitung
    if (/^(?:assistent|sekret(?:ä|ae)r|sachbearbeit|kaufm|empfang)/i.test(rolle.trim())) return false;
    // «Abteilungsleiter Service, Mitglied der Geschäftsleitung»: Bereichsleitung mit GL-Sitz zählt nicht als Leitung des Betriebs
    // Bereichsleitung mit GL-Sitz («Leiterin Finanzen, Mitglied der Geschäftsleitung», «Leitung Technik, Geschäftsleitung») zählt nicht als Leitung des Betriebs
    if (/^(?:abteilungs|bereichs|team|projekt|werkstatt|technische\s|fach)?(?:leiter(?:in)?|leitung)\s+\S/i.test(rolle.trim()) && !/gesch(?:ä|ae)ftsf(?:ü|ue)hr|inhaber|ceo|direktor|gr(?:ü|ue)nder|vorsitz/i.test(rolle)) return false;
    if (/^(?:abteilungs|bereichs|team|projekt|werkstatt)\S*leit/i.test(rolle.trim()) && !/gesch(?:ä|ae)ftsf(?:ü|ue)hr|inhaber|ceo|direktor|gr(?:ü|ue)nder|vorsitz/i.test(rolle)) return false;
    return true;
}

/** Rollen, die im Fliesstext neben einem Namen stehen dürfen (Muster c). Nur Kleinbuchstaben-Teile → Flag i ist sicher. */
const ROLLE_KERN =
    '(?:gesch(?:ä|ae)fts(?:f(?:ü|ue)hrer(?:in)?|leiter(?:in)?|inhaber(?:in)?|leitung)|(?:mit)?inhaber(?:in)?|eigent(?:ü|ue)mer(?:in)?|ceo|cto|cfo|coo|cio|managing director|direktor(?:in)?|(?:mit|co-?)?gr(?:ü|ue)nder(?:in)?|(?:co-?)?founder|pr(?:ä|ae)sident(?:in)?(?: des verwaltungsrates)?|verwaltungsrats?(?:pr(?:ä|ae)sident(?:in)?|mitglied)?|vr-pr(?:ä|ae)sident(?:in)?|praxisinhaber(?:in)?|praxisleiter(?:in)?|praxisleitung|(?:abteilungs|bereichs|team|projekt|filial|niederlassungs|betriebs|werkstatt)?leiter(?:in)?|mitglied der gesch(?:ä|ae)ftsleitung|vorsitz(?:ender|ende)? der gesch(?:ä|ae)ftsleitung|partner(?:in)?|managing partner|zahn(?:a|ä)rzt(?:in)?|kieferorthop(?:ä|ae)d(?:e|in)|dentalhygieniker(?:in)?|(?:fach|tier|haus)?(?:a|ä)rzt(?:in)?|ansprech(?:partner(?:in)?|person)|kontaktperson|vertretungsberechtigte person)';
export const ROLLE_RE = new RegExp(`(?:^|[^a-zäöü])${ROLLE_KERN}(?![a-zäöü])`, 'i');
/** Rolle (mit «für X») direkt vor einem Doppelpunkt am Ende eines Textstücks: «Ihr Ansprechpartner für BINTegration:» */
const ROLLE_VOR_NAME_RE = new RegExp(`(?:^|[\\s(])(?:ihre?\\s+|unsere?\\s+)?(${ROLLE_KERN}(?:\\s+f(?:ü|ue)r\\s+[^:.!?]{2,50})?)\\s*:?\\s*$`, 'i');
/** Rolle direkt nach «NAME,» (evtl. nach einem Grad wie «lic. oec.,»): «Gründer und Direktor BINT GmbH» */
const ROLLE_NACH_NAME_RE = new RegExp(`^\\s*,\\s*(?:(?:lic|dipl|dr|eidg)\\.[^,]{0,25},\\s*)?(${ROLLE_KERN}(?:\\s+(?:und|&)\\s+${ROLLE_KERN})?(?:\\s+[^,.;]{0,40})?)`, 'i');

/** Berufs- und Funktionswörter (nur für benachbarte Zeilen auf Team-Seiten: Name als Überschrift, Funktion darunter). */
const BERUF_RE =
    /(?:assistent|sachbearbeit|mitarbeiter|angestellt|kaufm(?:ä|ae)nn|administration|sekretariat|empfang|buchhalt|treuh(?:ä|ae)nd|berater|beratung|consultant|manager|management|techniker|monteur|installateur|elektriker|lernend|lehrling|lehrjahr|ausbildung|praktikant|ingenieur|architekt|planer|bauleit|polier|maschinist|chauffeur|disponent|disposition|verk(?:ä|ae)ufer|kundendienst|support|entwickler|developer|designer|dentalassist|dentalsekret|prophylaxe|praxisassist|\bmpa\b|physiotherap|therapeut|pflege|coiffeu|\bkoch\b|k(?:ö|oe)chin|spezialist|experte|expertin|integrator|leitung|leiter|head of|officer|marketing|finanzen|controlling|einkauf|logistik|stellvertret|mitglied|chirurg|medizin|dipl\.|eidg\.|fachfrau|fachmann|meister|vorarbeiter|gesch(?:ä|ae)fts|inhaber|gr(?:ü|ue)nder|partner|direktor|ceo|cto|cfo|zahn(?:a|ä)rzt|(?:ä|a)rzt|hygieni|kreditoren|debitoren|lohn|\bhr\b|office|verkauf|projekt)/i;

const STOPP_ZEILE = /^(?:e-?mail(?:-adresse)?|nachricht schicken|kontakt(?: aufnehmen)?|tel\.?|telefon|mobile?|natel|fax|linkedin|xing|mehr(?: erfahren)?|weiterlesen|profil|zur(?:ü|ue)ck|vcard|lageplan(?: (?:ö|oe)ffnen)?|curriculum|spezielle interessen|folgt|alle|adresse|anschrift|standort|website|webseite|homepage|follow|folgen|wir bloggen|social media)(?:\s|$|:)/i;

/* ------------------------------------------------------------------ */
/* Namen                                                               */
/* ------------------------------------------------------------------ */

const vgl = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/ß/g, 'ss');

/** Wörter, die nie Teil eines Personennamens sind (Kleinschreibung, ohne Akzente). */
const STOPP = new Set(
    `uber ueber uns unser unsere unseren unserem ihr ihre ihren team teams kontakt impressum datenschutz home start startseite aktuell aktuelles news blog jobs job karriere stellen stellenangebote offene angebot angebote leistungen leistung service services dienstleistungen produkte produkt referenzen projekte projekt partner partnerin partnerschaft kunden firma unternehmen geschichte philosophie werte mission vision standort standorte anfahrt offnungszeiten oeffnungszeiten termine termin preise faq fragen antworten mehr weiter zuruck zurueck lesen jetzt hier gerne bitte danke herzlich willkommen welcome neu neue neues alle allgemein info infos informationen beratung offerte anfrage newsletter login suche menu schliessen offnen cookie cookies akzeptieren ablehnen einstellungen montag dienstag mittwoch donnerstag freitag samstag sonntag januar februar marz maerz april mai juni juli august september oktober november dezember schweiz zurich zuerich winterthur bern basel luzern zug aarau baden olten solothurn schaffhausen frauenfeld chur thun biel genf lausanne lugano st gallen ag gmbh sa sarl holding group gruppe praxis zahnarztpraxis zahnarzt zahnarztin tierklinik klinik spital garage elektro treuhand immobilien planung tiefbau hochbau bau technik informatik it solutions systems consulting management administration geschaftsleitung geschaftsfuhrer geschaftsfuhrung inhaber inhaberin leitung leiter leiterin abteilung bereich kader mitarbeiter mitarbeitende mitarbeiterin lernende foto fotos bild bilder portrait portrat logo icon video galerie download pdf mail email telefon tel fax mobile adresse nachricht schicken senden formular lageplan karte google maps facebook instagram linkedin xing youtube twitter tiktok whatsapp der die das den dem des und oder mit von fur bei im in am an auf zu zum zur ein eine einer sie wir es er ich du is the of and for our your about contact privacy terms sitz hauptsitz filiale niederlassung verwaltung verwaltungsrat direktion praxisteam teammitglied notfall notfalle spezialisten belegarzte tierarzte tierarztinnen arzte darf sich kann wird ist sind hat haben senior junior consultant integrator business berater beraterin assistent assistentin techniker technikerin ingenieur ingenieurin architekt architektin innenarchitekt innenarchitektin planer planerin manager managerin director head officer chief executive developer entwickler entwicklerin designer designerin spezialist spezialistin experte expertin sachbearbeiter sachbearbeiterin kauffrau kaufmann lernender praktikant praktikantin monteur elektriker installateur polier bauleiter disponent disponentin verkauf verkaufer verkauferin kundendienst support sekretariat empfang buchhaltung buchhalter buchhalterin treuhander treuhanderin arztin arzt tierarztin tierarzt dentalhygienikerin dentalassistentin prophylaxeassistentin praxisassistentin physiotherapeutin therapeut therapeutin direktor direktorin grunder grunderin prasident prasidentin ceo cto cfo coo projektleiter projektleiterin abteilungsleiter bereichsleiter teamleiter geschaftsfuhrerin geschaftsleiter geschaftsleiterin mitinhaber mitinhaberin eigentumer vorsitzender stellvertreter stellvertreterin mitglied office marketing finanzen personal controlling einkauf logistik sales account customer success operations project product owner lead coach trainer trainerin social media online digital hotel restaurant umbau neubau modern moderne architecture building house image picture header banner hero background slider spezielle interessen curriculum referenz referenzen wohnung wohnungen uberbauung areal schulhaus mehrfamilienhaus einfamilienhaus top cup base day art kids youth shop kurs sap hcm yellow perfect shot super latte brack pepsi fanshop vip club fans fan team personen vertretungsberechtigte eingetragener eingetragene firmenname kontaktadresse handelsregister`.split(
        /\s+/,
    ),
);

/** Endungen typischer Sachwörter (Überschriften wie «Gebäude Automation», «Moderne Lösungen»). */
const SACHWORT_RE =
    /(?:ungen|heit|heiten|keit|keiten|schaft|schaften|tion|tionen|ität|itäten|ismus|ierung|ierungen|anlage|anlagen|system|systeme|technik|technologie|technologien|lösung|lösungen|beratung|planung|automation|installation|installationen|montage|reparatur|wartung|sanierung|produkte|zentrum|gebäude|werkstatt|service|services|management|marketing|software|hardware|netzwerk|netzwerke|telefonie|sicherheit|versicherung|immobilien|treuhand|medizin|therapie|chirurgie|prophylaxe|ästhetik|implantate|kieferorthopädie|dentalhygiene|kontrolle|behandlung|behandlungen|qualität|erfahrung|kompetenz|leidenschaft|design|dienste|dienst|zubehör|angebot|angebote|tickets|ticket|gutschein|gutscheine|package|center|league|workforce|intelligence|sektor|kaffee|premium|aktive|statistik|stadion|schule|akademie|events|magazin|projekte|referenz)$/i;

/** Namenszusätze (klein), die zwischen Vor- und Nachname stehen dürfen. */
const PARTIKEL = new Set(['von', 'van', 'de', 'di', 'da', 'del', 'della', 'du', 'le', 'la', 'zu', 'ten', 'ter', 'dos', 'das', 'y', 'af', 'el', 'al', 'bin', 'ben']);

const TITEL_WORT_RE = /^(?:prof\.?|dr\.?|med\.?|phil\.?|iur\.?|oec\.?|rer\.?|sc\.?|nat\.?|techn\.?|pharm\.?|dent\.?|vet\.?|h\.c\.)$/i;
/** Titel in eigener Zeile bzw. hinter dem Komma: «Dr. med. vet.», «Dr. med. dent» */
const TITEL_ZEILE_RE = /^(?:prof\.?\s+)?dr\.?(?:\s*(?:med|phil|iur|oec|rer|sc|nat|techn|pharm|dent|vet)\.?)*$/i;
/** Abschlüsse/Grade hinter dem Namen, die wegfallen («lic. oec.», «MBA», «Dipl. Ing.»). */
const GRAD_RE = /^(?:lic\.|dipl\.|eidg\.|mba|msc|bsc|ba|ma|phd|mas|cas|das|llm|ll\.m\.|med\.|dent\.|vet\.|fh|hf|eth|sso|fmh|ing\.)/i;

function titelNormal(t: string): string {
    return t
        .replace(/\b(prof|dr|med|phil|iur|oec|rer|sc|nat|techn|pharm|dent|vet)\b\.?/gi, (_m, w: string) => (/^(prof|dr)$/i.test(w) ? `${w.charAt(0).toUpperCase()}${w.slice(1).toLowerCase()}.` : `${w.toLowerCase()}.`))
        .replace(/\s+/g, ' ')
        .trim();
}

/** Trennt führende Titel («Dr. med. dent.», «Prof. Dr.») vom Namen. */
function trenneTitel(s: string): { titel: string; rest: string } {
    const w = s.replace(/\b(dr|prof|med|dent|vet|phil|iur|oec)\.(?=\S)/gi, '$1. ').split(' ').filter(Boolean);
    let i = 0;
    if (w.length && /^(?:prof|dr)\.?$/i.test(w[0])) {
        while (i < w.length && TITEL_WORT_RE.test(w[i])) i++;
    }
    return { titel: i ? titelNormal(w.slice(0, i).join(' ')) : '', rest: w.slice(i).join(' ') };
}

function grossKlein(wort: string): string {
    return wort.toLowerCase().replace(/(^|[-'’])(\p{L})/gu, (_m, vor: string, b: string) => vor + b.toUpperCase());
}

/**
 * Prüft und normalisiert einen Personennamen. Liefert null, wenn es kein Name ist.
 * 2–4 Namensteile (übliche Schreibung oder ganz in Grossbuchstaben), Zusätze wie
 * «von»/«de», Initialen «R.», akademische Titel vorne bzw. «, Dr. med. dent» hinten
 * (wird nach vorne genommen). `firmenWoerter`: Name darf nicht nur aus dem
 * Firmennamen bestehen («Stocker Tiefbau»).
 */
export function normalisiereName(roh: string, firmenWoerter: string[] = []): string | null {
    let s = (roh || '')
        .replace(/[   ]/g, ' ')
        .replace(/[«»"“”„‚‘]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^(?:herr|frau|hr\.|fr\.)\s+/i, '');
    if (!s || s.length > 70 || /\d|@|https?:|www\.|[|/\\:;!?()[\]{}<>=+*#%&–—]/.test(s)) return null;
    // Titel hinter dem Namen: «CORINNE FREY, Dr. med. dent» → Titel nach vorne; Grade («lic. oec.», «MBA») fallen weg
    let titel = '';
    const teile = s.split(/\s*,\s*/);
    s = teile[0];
    for (const t of teile.slice(1)) {
        if (TITEL_ZEILE_RE.test(t.trim())) titel = titelNormal(t);
        else if (!GRAD_RE.test(t.trim())) return null;
    }
    const getrennt = trenneTitel(s);
    if (getrennt.titel) {
        titel = titel || getrennt.titel;
        s = getrennt.rest;
    }
    const woerter = s.split(' ').filter(Boolean);
    if (woerter.length < 2 || woerter.length > 6) return null;
    const ganzGross = woerter.filter((w) => !/^\p{Lu}\.$/u.test(w)).every((w) => w === w.toUpperCase());
    const aus: string[] = [];
    let voll = 0;
    for (const w of woerter) {
        if (PARTIKEL.has(w.toLowerCase()) && aus.length > 0) {
            aus.push(w.toLowerCase());
            continue;
        }
        if (/^\p{Lu}\.$/u.test(w) && aus.length > 0) {
            aus.push(w);
            continue;
        }
        const k = vgl(w).replace(/[.'’]/g, '');
        if (STOPP.has(k)) return null;
        const form = ganzGross ? grossKlein(w) : w;
        // Grossbuchstabe am Anfang, danach Kleinbuchstaben (Bindestrich-Namen, Apostroph, «McX» erlaubt)
        if (!/^\p{Lu}[\p{Ll}'’]+(?:\p{Lu}[\p{Ll}]+)?(?:-\p{Lu}[\p{Ll}'’]+)*$/u.test(form)) return null;
        if (form.length > 5 && SACHWORT_RE.test(form)) return null;
        if (/^\p{Lu}[\p{Ll}]{4,}ung$/u.test(form)) return null;
        // Adjektive als erstes Wort («Öffentlicher Sektor», «Zentrale Dienste», «Moderne …»)
        if (!aus.length && /^\p{Lu}\p{Ll}+(?:ische|isch|ischer|isches|ischen|liche|licher|liches|lichen|ige|iger|iges|igen|ale|aler|ales|alen|ive|iver|ives)$/u.test(form)) return null;
        aus.push(form);
        voll++;
    }
    if (voll < 2 || voll > 4) return null;
    // nicht nur Firmen-/Ortswörter («Stocker Tiefbau», «Unipoint Ossingen»)
    const fw = new Set(firmenWoerter.map(vgl));
    const kern = aus.filter((w) => !PARTIKEL.has(w) && !/^\p{Lu}\.$/u.test(w));
    if (fw.size && kern.every((w) => fw.has(vgl(w)))) return null;
    // Leitungs- und Rollenwörter sind nie Namen («Vertretungsberechtigte Person», «Geschäftsführer Technik»)
    if (LEITUNG_RE.test(aus.join(' '))) return null;
    const name = aus.join(' ');
    if (name.length > 45) return null;
    return titel ? `${titel} ${name}` : name;
}

/**
 * Wörter des Firmennamens bzw. Hosts («stocker-tiefbau.ch» → stocker, tiefbau, stockertiefbau;
 * «Unipoint AG» → unipoint). Dienen dazu, Firmennamen nicht als Person zu nehmen und
 * «… bei/von FIRMA» aus Rollen zu schneiden.
 */
export function firmenWoerterVon(host: string, firma: string | null = null): string[] {
    const label = vgl(host.replace(/^www\./, '').split('.')[0] ?? '');
    const teile = [label.replace(/[-_]/g, ''), ...label.split(/[-_]/)];
    for (const w of (firma ?? '').split(/[\s,&+/|–—-]+/)) {
        const k = vgl(w).replace(/[^a-z0-9]/g, '');
        if (k.length >= 3 && !/^(ag|gmbh|sa|sarl|klg|kg|ltd|inc|und|the)$/.test(k)) teile.push(k);
    }
    return [...new Set(teile.filter((t) => t.length >= 3))];
}

/** Vergleichsschlüssel eines Namens (ohne Titel, Akzente, Gross-/Kleinschreibung). */
export function namensSchluessel(name: string): string {
    return vgl(trenneTitel(name.replace(/\s+/g, ' ').trim()).rest)
        .replace(/[^a-z]+/g, ' ')
        .trim();
}

/** Name aus einem Pfad-Teil («gross-thomas», «thomas_marko») — nur zum Wiedererkennen. */
export function nameAusSlug(slug: string): string {
    let s = slug;
    try {
        s = decodeURIComponent(slug);
    } catch {
        /* roh lassen */
    }
    return s
        .replace(/\.(html?|php|aspx?)$/i, '')
        .split(/[-_+.]+/)
        .filter(Boolean)
        .map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
        .join(' ');
}

/** Passt `name` zu einem (evtl. vertauschten) Slug-Namen? «Thomas Gross» ↔ «Gross Thomas»; «Gross» allein nur bei einteiligem Namen. */
export function passtZumSlug(name: string, slugName: string): boolean {
    const a = namensSchluessel(name).split(' ').filter(Boolean);
    const b = namensSchluessel(slugName).split(' ').filter(Boolean);
    if (!a.length || !b.length) return false;
    return b.every((t) => a.includes(t)) && (b.length >= 2 || a[a.length - 1] === b[0]);
}

/**
 * Personennamen in einem Textstück (für Satzmuster): Folgen grossgeschriebener Wörter;
 * passt die ganze Folge nicht, werden Wörter vorne/hinten weggelassen
 * («Kontakt Thomas Marko» → «Thomas Marko»).
 */
export function namenImText(text: string, firmenWoerter: string[] = []): Array<{ name: string; start: number; ende: number }> {
    const aus: Array<{ name: string; start: number; ende: number }> = [];
    const re = /(?:(?:Prof\.?\s*)?Dr\.?(?:\s*(?:med|phil|iur|oec|dent|vet|sc|rer|nat)\.?)*\s+)?\p{Lu}[\p{L}'’-]*(?:\s+(?:\p{Lu}\.|von|van|de|di|da|del|du|le|la|zu|\p{Lu}[\p{L}'’-]*))+/gu;
    for (const m of text.matchAll(re)) {
        const teile = m[0].split(' ');
        let fund: { name: string; start: number; ende: number } | null = null;
        for (let links = 0; links < teile.length - 1 && !fund; links++) {
            for (let rechts = teile.length; rechts - links >= 2 && !fund; rechts--) {
                const stueck = teile.slice(links, rechts).join(' ');
                const name = normalisiereName(stueck, firmenWoerter);
                if (name) {
                    const start = (m.index ?? 0) + teile.slice(0, links).join(' ').length + (links ? 1 : 0);
                    fund = { name, start, ende: start + stueck.length };
                }
            }
        }
        if (fund) aus.push(fund);
    }
    return aus;
}

/* ------------------------------------------------------------------ */
/* Rollen bereinigen                                                   */
/* ------------------------------------------------------------------ */

const RECHTSFORM_RE = /(?:^|[^a-zäöü])(?:ag|gmbh|sa|s\.a\.|sàrl|sarl|klg|kg|genossenschaft|verein|stiftung|ltd|inc)(?![a-zäöü])/i;
const KEIN_SCHNITT_RE = /^(?:Ausbildung|Gesch|Verwaltung|Abteilung|Bereich|Praxis|Klinik|Technik|Finanzen|Personal|Vorsitz|Leitung|Direktion|Zahnmedizin|Medizin)/;

/**
 * Rolle säubern: Firmenname, «bei/von FIRMA» und alles danach weg. Rollen, die eine
 * FREMDE Firma nennen (Kundenstimme «Geschäftsführer der Beispiel AG»), → null.
 */
export function bereinigeRolle(roh: string | null | undefined, firmenWoerter: string[] = []): string | null {
    if (!roh) return null;
    let r = roh.replace(/^\s*(?:ihre?|unsere?)\s+/i, '').replace(/\s+/g, ' ').replace(/^[\s,;:–—|/-]+|[\s,;:–—|/-]+$/g, '').trim();
    if (!r || r.length < 2) return null;
    if (/@|https?:|www\.|\+?\d[\d\s]{6,}/.test(r)) return null;
    const fw = firmenWoerter.map(vgl).filter((w) => w.length >= 3);
    const woerter = r.split(' ');
    const schnitt = woerter.findIndex(
        (w, i) =>
            i > 0 &&
            (fw.includes(vgl(w).replace(/[^a-z0-9-]/g, '')) ||
                (/^(?:bei|von|der|des|im|in)$/i.test(w) && i + 1 < woerter.length && /^\p{Lu}/u.test(woerter[i + 1]) && !KEIN_SCHNITT_RE.test(woerter[i + 1]))),
    );
    if (schnitt > 0) {
        const rest = woerter.slice(schnitt).join(' ');
        const istEigene = fw.some((w) => vgl(rest).includes(w));
        if (!istEigene && RECHTSFORM_RE.test(rest)) return null;
        r = woerter.slice(0, schnitt).join(' ');
    } else if (RECHTSFORM_RE.test(r) && !fw.some((w) => vgl(r).includes(w))) {
        return null;
    }
    r = r.replace(/[\s,;:–—|/-]+$/g, '').replace(/\s+\/\s+/g, ' / ').trim();
    if (r.length > 90) r = r.slice(0, 90).replace(/[\s,;][^\s,;]*$/, '').trim();
    return r.length >= 2 ? r : null;
}

/** Qualität einer Rolle: Leitung > Rollenwort > Berufswort > sonst. */
export function rollenGewicht(rolle: string | null | undefined): number {
    if (!rolle || rolle === 'Teammitglied') return 0;
    if (istLeitung(rolle)) return 3;
    if (ROLLE_RE.test(rolle)) return 2;
    if (BERUF_RE.test(rolle)) return 1.5;
    return 1;
}

/** Ist die Zeile eine kurze Rollen-/Funktionsangabe (kein Satz, keine Kontaktangabe)? `streng`: mit Rollen-/Berufswort. */
export function istRollenZeile(z: string, streng = true): boolean {
    const t = z.trim();
    if (t.length < 2 || t.length > 100) return false;
    if (STOPP_ZEILE.test(t) || /@|https?:|www\.|\+?\d[\d\s]{6,}|[«»"“”]/.test(t)) return false;
    if (/[.!?]$/.test(t) && !/\b(?:hf|fh|dipl|eidg|med|dent|vet|lic|oec|sc|ing|inkl|bzw|mag|sso|fmh)\.$/i.test(t)) return false;
    if (t.split(' ').length > 12) return false;
    if (normalisiereName(t)) return false;
    return streng ? ROLLE_RE.test(t) || BERUF_RE.test(t) : true;
}

/* ------------------------------------------------------------------ */
/* (a) JSON-LD                                                         */
/* ------------------------------------------------------------------ */

function jsonText(v: unknown): string | null {
    if (typeof v === 'string') return v.trim() || null;
    if (Array.isArray(v) && typeof v[0] === 'string') return v[0].trim() || null;
    return null;
}

export function personenAusJsonLd(knoten: Record<string, unknown>[], firmenWoerter: string[] = []): PersonFund[] {
    const aus: PersonFund[] = [];
    let n = 0;
    const dazu = (p: unknown, rolleStandard: string | null) => {
        for (const e of Array.isArray(p) ? p : [p]) {
            if (!e || typeof e !== 'object') continue;
            const o = e as Record<string, unknown>;
            const typ = String(o['@type'] ?? 'Person');
            if (!/person/i.test(typ)) continue;
            const name = normalisiereName(jsonText(o.name) ?? [jsonText(o.givenName), jsonText(o.familyName)].filter(Boolean).join(' '), firmenWoerter);
            if (!name) continue;
            const rolle = bereinigeRolle(jsonText(o.jobTitle) ?? jsonText(o.roleName), firmenWoerter) ?? rolleStandard;
            if (!rolle) continue;
            aus.push({ name, rolle, quelle: 'jsonld', reihenfolge: n++ });
        }
    };
    for (const k of knoten) {
        const typ = Array.isArray(k['@type']) ? (k['@type'] as unknown[]).join(' ') : String(k['@type'] ?? '');
        if (/^person$/i.test(typ.trim())) dazu(k, null);
        dazu(k.founder ?? k.founders, 'Gründer/in');
        dazu(k.employee ?? k.employees, null);
        dazu(k.member, null);
    }
    return aus;
}

/* ------------------------------------------------------------------ */
/* (b) Bilder                                                          */
/* ------------------------------------------------------------------ */

const FOTO_RE = /^(?:foto|photo|portrait|porträt|portraet|portr(?:ä|a)tfoto|portraitfoto|profilbild|profilfoto|teamfoto|bild|mitarbeiterfoto|headshot)\s*(?:von|of|:|-|–)?\s+(.+)$/i;

/**
 * Person aus einem Bild-Text (alt/title). «Foto NAME» → Name ohne Rolle (übernommen
 * nur auf Team-Seiten bzw. im Team-Link); «NAME – ROLLE …» → Name mit Rolle.
 */
export function personAusBildText(text: string, firmenWoerter: string[] = []): { name: string; rolle: string | null; foto: boolean } | null {
    const t = (text || '').replace(/\s+/g, ' ').trim();
    if (t.length < 5 || t.length > 220) return null;
    const foto = t.match(FOTO_RE);
    const kern = foto ? foto[1] : t;
    const m = kern.match(/^(.{4,60}?)\s+[–—-]\s+(.{2,160})$/) ?? kern.match(/^(.{4,60}?)\s*\|\s*(.{2,160})$/);
    if (m) {
        const name = normalisiereName(m[1], firmenWoerter);
        if (!name) return null;
        const rolle = bereinigeRolle(m[2], firmenWoerter);
        return { name, rolle: rolle && (ROLLE_RE.test(rolle) || BERUF_RE.test(rolle)) ? rolle : null, foto: !!foto };
    }
    const name = normalisiereName(kern, firmenWoerter);
    return name ? { name, rolle: null, foto: !!foto } : null;
}

/* ------------------------------------------------------------------ */
/* (c) Textmuster                                                      */
/* ------------------------------------------------------------------ */

export interface TextOptionen {
    firmenWoerter?: string[];
    /** Seite ist eine Team-/Über-uns-Seite: Paare Name/Zeile auch mit freier Funktionsangabe */
    teamSeite?: boolean;
    /** Basis der Reihenfolge (Seite × 10 000) */
    basis?: number;
}

const gross1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Steht die Zeile direkt nach einem Zitat (Kundenstimme)? Dann ist die Person meist ein Kunde. */
function istNachZitat(zeilen: string[], i: number): boolean {
    for (let k = i - 1; k >= Math.max(0, i - 2); k--) {
        const z = zeilen[k].trim();
        if (z.length >= 20 && (/^[«"“„‚']/.test(z) || /[»"”“']$/.test(z))) return true;
        // Kundenstimme ohne Anführungszeichen: Ich-Form direkt davor («Ich bin froh, in der Renuo …»)
        if (k === i - 1 && z.length >= 40 && /(?:^|[\s,.;:!?])(?:ich|mir|mich|mein|meine|meinen|meinem)(?=[\s,.;:!?]|$)/i.test(z)) return true;
    }
    return false;
}

/** Seiten mit Kundenstimmen, Referenzen, Projekten: dort genannte Personen sind meist Kunden. */
export function istReferenzSeite(url: string): boolean {
    let pfad = '';
    try {
        pfad = decodeURIComponent(new URL(url).pathname).toLowerCase();
    } catch {
        pfad = url.toLowerCase();
    }
    return /referenz|references?|kunden|kundenstimmen|testimonial|bewertung|erfolgsgeschicht|success|case-stud|fallbeispiel|projekte|projects|portfolio/.test(pfad);
}

/**
 * Personen aus Textzeilen einer Seite:
 * (1) Name-Zeile + Rollen-Zeile(n) danach (bis zu zwei, z. B. «Projektleiter» /
 *     «Mitglied der Geschäftsleitung»); eine Leitungsrolle in der Zeile DAVOR kommt dazu;
 * (2) nur Rolle davor (Impressum «Vertretungsberechtigte Person» / «NAME»);
 * (3) in einer Zeile «NAME, ROLLE» / «NAME – ROLLE» bzw. «ROLLE: NAME»;
 * (4) im Satz «… ROLLE (für X): NAME» und «NAME, [Grad,] ROLLE» (nur Leitung).
 * Paare mit freier Funktionsangabe («Spezial-Tiefbau») gelten nur auf Team-Seiten
 * bzw. wenn die Seite mindestens zwei Paare mit Rollenwort hat (Team-Liste).
 */
export function personenAusZeilen(zeilen: string[], opt: TextOptionen = {}): PersonFund[] {
    const fw = opt.firmenWoerter ?? [];
    const basis = opt.basis ?? 0;
    const aus: PersonFund[] = [];
    const vergeben = new Set<number>();
    const paare: Array<{ i: number; name: string; rollen: string[]; art: 'rolle' | 'beruf' | 'frei' }> = [];
    for (let i = 0; i < zeilen.length; i++) {
        const z = zeilen[i];
        if (z.length > 70 || vergeben.has(i)) continue;
        // Titel in eigener Zeile über dem Namen («Dr. med. vet.» / «Martin Keiser»)
        const davorTitel = i > 0 ? zeilen[i - 1].replace(/,.*$/, '').trim() : '';
        const name = (davorTitel && TITEL_ZEILE_RE.test(davorTitel) ? normalisiereName(`${davorTitel} ${z}`, fw) : null) ?? normalisiereName(z, fw);
        if (!name) continue;
        const rollen: string[] = [];
        let art: 'rolle' | 'beruf' | 'frei' = 'frei';
        for (let j = i + 1; j <= Math.min(zeilen.length - 1, i + 2); j++) {
            const r = zeilen[j];
            if (normalisiereName(r, fw) || !istRollenZeile(r, false)) break;
            const b = bereinigeRolle(r, fw);
            if (!b) break;
            const a = ROLLE_RE.test(b) ? 'rolle' : BERUF_RE.test(b) ? 'beruf' : 'frei';
            if (j > i + 1 && a === 'frei') break;
            rollen.push(b);
            if (a === 'rolle' || (a === 'beruf' && art === 'frei')) art = a;
        }
        const davor = i > 0 && !vergeben.has(i - 1) && !TITEL_ZEILE_RE.test(davorTitel) ? zeilen[i - 1] : null;
        const davorRolle = davor && istRollenZeile(davor) ? bereinigeRolle(davor.replace(/:$/, ''), fw) : null;
        if (davorRolle && ROLLE_RE.test(davorRolle) && art === 'frei') {
            // Impressum: «Vertretungsberechtigte Person» / «NAME» / «Eingetragener Firmenname» — die Zeile danach ist keine Rolle
            rollen.length = 0;
        }
        if (!rollen.length) {
            if (davorRolle && ROLLE_RE.test(davorRolle)) {
                rollen.push(davorRolle);
                art = 'rolle';
            }
        } else if (davorRolle && istLeitung(davorRolle) && !rollen.some((r) => istLeitung(r))) {
            // «Geschäftsführer & Gründer» / «Aladdin Avci» / «Dipl. Techniker HF Systemtechnik»
            rollen.unshift(davorRolle);
            art = 'rolle';
        }
        if (rollen.length) {
            paare.push({ i, name, rollen, art });
            vergeben.add(i);
            for (let k = 1; k <= rollen.length; k++) vergeben.add(i + k);
        }
    }
    for (const p of paare) {
        // ausserhalb von Team-Seiten nur mit Rollenwort, auf Team-Seiten auch mit Berufswort; Zeilen ohne beides
        // («Statistik», «Online Kurs», «25. Oktober 2026») sind Menüs, Kurse oder Termine — nie eine Rolle
        const ok = p.art === 'rolle' || (!!opt.teamSeite && p.art === 'beruf');
        // Kundenstimme: Name direkt nach einem Zitat («Super Service!» / Hans Kunde / Geschäftsleitung Beispiel)
        if (ok && !istNachZitat(zeilen, p.i)) aus.push({ name: p.name, rolle: p.rollen.slice(0, 2).join(', '), quelle: 'text', reihenfolge: basis + p.i });
    }
    // (3) eine Zeile; (4) im Satz
    zeilen.forEach((z, i) => {
        if (vergeben.has(i) || z.length > 4000) return;
        // Kundenstimmen: Zeile beginnt mit einem Zitat bzw. Zitat direkt davor
        if (/^[«"“„]/.test(z.trim()) || istNachZitat(zeilen, i)) return;
        if (z.length <= 140) {
            const teile = z.split(/\s*(?:,|\s[–—-]\s|\||:)\s*/);
            if (teile.length >= 2) {
                const name = normalisiereName(teile[0], fw);
                // Grade überspringen («Thomas Marko, lic. oec., Gründer und Direktor …»); höchstens zwei Rollenteile
                const rest = teile.slice(1).filter((t, k, a) => !(GRAD_RE.test(t) && a.slice(0, k).every((x) => GRAD_RE.test(x))));
                const zweite = rest[1] && ROLLE_RE.test(rest[1]) ? `, ${rest[1]}` : '';
                const rolle = name && rest.length ? bereinigeRolle(`${rest[0]}${zweite}`, fw) : null;
                if (name && rolle && ROLLE_RE.test(rolle) && istRollenZeile(rolle)) {
                    aus.push({ name, rolle, quelle: 'text', reihenfolge: basis + i });
                    return;
                }
            }
        }
        for (const n of namenImText(z, fw)) {
            const vor = z.slice(Math.max(0, n.start - 90), n.start);
            const nach = z.slice(n.ende, n.ende + 120);
            // «… super Service!» – Hans Kunde, Geschäftsführer …: Name direkt nach einem Zitat
            if (/[»"”“]\s*[–—-]?\s*$/.test(vor)) continue;
            const a = vor.match(ROLLE_VOR_NAME_RE);
            // «ROLLE: NAME» bzw. ganze kurze Zeile «Inhaberin NAME»
            if (a && (/:\s*$/.test(vor) || z.length <= 80)) {
                const rolle = bereinigeRolle(a[1], fw);
                if (rolle) {
                    aus.push({ name: n.name, rolle: gross1(rolle), quelle: 'text', reihenfolge: basis + i });
                    continue;
                }
            }
            const b = nach.match(ROLLE_NACH_NAME_RE);
            if (b) {
                const rolle = bereinigeRolle(b[1], fw);
                if (rolle && istLeitung(rolle)) aus.push({ name: n.name, rolle: gross1(rolle), quelle: 'text', reihenfolge: basis + i });
            }
        }
    });
    return aus;
}

/* ------------------------------------------------------------------ */
/* Team-Unterseiten                                                    */
/* ------------------------------------------------------------------ */

/** Pfad unter einem Team-Segment: Gruppe 1 = Segment, Gruppe 2 = Rest («/team/gross-thomas/», «/ueber-uns/team/silvio-stocker»). */
const TEAM_PFAD_RE = /\/(team|teams|unser-team|das-team|mitarbeiter|mitarbeiterinnen|mitarbeitende|personen|people|ueber-uns|uber-uns|über-uns|about|about-us|wir)\/((?:[^/?#]+\/)?[^/?#]+?)\/?$/i;
const KEIN_PERSONEN_SLUG = /^(?:team|unser-team|das-team|kontakt|contact|geschichte|history|partner|jobs?|karriere|career|stellen|firma|unternehmen|werte|leitbild|philosophie|standorte?|anfahrt|impressum|datenschutz|news|blog|referenzen|kunden|engagement|nachhaltigkeit|organisation|verwaltungsrat|geschaeftsleitung|geschäftsleitung|management|vision|mission|auszeichnungen|medien|presse|downloads?|faq|maschinenpark|fahrzeuge|infrastruktur|lehrstellen|lernende|offene-stellen|page|seite|praxis|portrait|gruppe|\d+)$/i;
/** Segmente, unter denen nur Personen liegen (bei «ueber-uns»/«about» liegen auch Geschichte, Werte …). */
const NUR_PERSONEN_SEGMENT = /^(?:team|teams|unser-team|das-team|mitarbeiter|mitarbeiterinnen|mitarbeitende|personen|people)$/i;

/** Slug, der wie ein Personenname aussieht («gross-thomas», «wyss», «dr-anna-muster»). */
function slugIstName(slug: string, nurPersonen: boolean): boolean {
    if (!slug || KEIN_PERSONEN_SLUG.test(slug) || !/^[\p{L}_.-]+$/u.test(slug)) return false;
    const teile = slug.split(/[-_.]+/).filter(Boolean);
    if (teile.length < 1 || teile.length > 4 || teile.some((t) => t.length < 2 || t.length > 18)) return false;
    if (teile.some((t) => STOPP.has(vgl(t)) && !/^(?:dr|prof)$/i.test(t))) return false;
    if (teile.some((t) => t.length > 5 && SACHWORT_RE.test(t))) return false;
    // unter «ueber-uns»/«about»: nur zwei- bis dreiteilige Namen («thomas-marko»)
    return nurPersonen || (teile.length >= 2 && teile.length <= 3);
}

/** Link auf die Unterseite EINER Person (`/team/gross-thomas/`)? Solche Seiten lädt der Scanner nur in der Team-Runde. */
export function istPersonenLink(url: string): boolean {
    let pfad = '';
    try {
        pfad = decodeURIComponent(new URL(url).pathname);
    } catch {
        return false;
    }
    const m = pfad.match(TEAM_PFAD_RE);
    if (!m || !zwischenTeil(m)) return false;
    return slugIstName(m[2].split('/').pop() ?? '', NUR_PERSONEN_SEGMENT.test(m[1]));
}

/**
 * Zwischenstufe im Pfad erlaubt? «/ueber-uns/team/max-muster» ja, «/ueber-uns/erfolgsgeschichten/groupe-mutuel»
 * (Kundengeschichten, Referenzen) nein. Unter einem reinen Personen-Segment («/team/zuerich/max-muster») ja.
 */
function zwischenTeil(m: RegExpMatchArray): boolean {
    const teile = m[2].split('/');
    if (teile.length < 2) return true;
    return NUR_PERSONEN_SEGMENT.test(m[1]) || NUR_PERSONEN_SEGMENT.test(teile[0]) || /^(?:geschaeftsleitung|geschäftsleitung|leitung|management|kader|mitarbeitende|aerzte|ärzte|tieraerzte|tierärzte)$/i.test(teile[0]);
}

/** Ist die Seite eine Team-/Über-uns-Seite (Adresse oder Titel)? */
export function istTeamSeite(url: string, titel: string | null = null): boolean {
    let pfad = '';
    try {
        pfad = decodeURIComponent(new URL(url).pathname).toLowerCase();
    } catch {
        pfad = url.toLowerCase();
    }
    // massgebend ist der letzte Pfadteil: «/ueber-uns/team/» ja, «/ueber-uns/erfolgsgeschichten/» (Kundengeschichten) nein
    const letzter = pfad.split('/').filter(Boolean).pop() ?? '';
    return (
        /team|mitarbeit|personen|people|ueber-uns|uber-uns|über-uns|about|portrait|wir-sind|wer-wir-sind|geschaeftsleitung|geschäftsleitung|kader|aerzte|ärzte|tieraerzte|tierärzte|impressum|imprint/.test(letzter) ||
        /(?:^|\s)(team|über uns|ueber uns|mitarbeitende|geschäftsleitung|impressum)(?:\s|$|[|–-])/i.test(titel ?? '')
    );
}

/**
 * Links auf Team-Unterseiten. Ein Link zählt, wenn sein Pfad unter einem Team-Segment
 * liegt (`/team/<name>/`, `/ueber-uns/team/<name>`, `/mitarbeitende/<name>` …) und
 * (a) Link-Text, Überschrift oder Bild-alt im Link einen Personennamen ergibt oder
 * (b) mindestens drei Geschwister-Links unter demselben Segment liegen (Team-Liste).
 */
export function teamLinks(links: Array<{ url: string; text: string; bild?: string; zeilen?: string[] }>, seitenUrl: string, firmenWoerter: string[] = []): TeamLink[] {
    let host = '';
    let eigenePfad = '';
    try {
        const s = new URL(seitenUrl);
        host = s.hostname.replace(/^www\./, '');
        eigenePfad = s.pathname.replace(/\/$/, '');
    } catch {
        return [];
    }
    const roh: Array<TeamLink & { eltern: string }> = [];
    const index = new Map<string, TeamLink & { eltern: string }>();
    links.forEach((l, i) => {
        let u: URL;
        try {
            u = new URL(l.url);
        } catch {
            return;
        }
        if (u.hostname.replace(/^www\./, '') !== host) return;
        u.hash = '';
        u.search = '';
        let pfad = u.pathname;
        try {
            pfad = decodeURIComponent(pfad);
        } catch {
            /* roh */
        }
        if (pfad.replace(/\/$/, '') === eigenePfad) return;
        const m = pfad.match(TEAM_PFAD_RE);
        if (!m || !zwischenTeil(m)) return;
        const slug = m[2].split('/').pop() ?? '';
        if (!slug || KEIN_PERSONEN_SLUG.test(slug) || !/^[\p{L}_.-]+$/u.test(slug) || slug.split(/[-_.]/).length > 4) return;
        const p0 = linkPerson(l, firmenWoerter);
        // ohne Namen im Link nur Slugs, die wie Namen aussehen
        if (!p0 && !slugIstName(slug, NUR_PERSONEN_SEGMENT.test(m[1]))) return;
        const schluessel = u.toString().replace(/\/$/, '');
        const p = p0;
        const da = index.get(schluessel);
        if (da) {
            // gleicher Link mehrfach (Bild und Name getrennt verlinkt): Name/Rolle ergänzen
            if (!da.name && p) da.name = p.name;
            if (!da.rolle && p?.rolle) da.rolle = p.rolle;
            return;
        }
        const eintrag = { url: u.toString(), name: p?.name ?? null, rolle: p?.rolle ?? null, slugName: nameAusSlug(slug), reihenfolge: i, eltern: pfad.slice(0, pfad.lastIndexOf(slug)) };
        index.set(schluessel, eintrag);
        roh.push(eintrag);
    });
    const proEltern = new Map<string, number>();
    for (const r of roh) proEltern.set(r.eltern, (proEltern.get(r.eltern) ?? 0) + 1);
    return roh
        .filter((r) => (r.name && (proEltern.get(r.eltern) ?? 0) >= 2) || (proEltern.get(r.eltern) ?? 0) >= 3)
        .map((r) => ({ url: r.url, name: r.name, slugName: r.slugName, rolle: r.rolle, reihenfolge: r.reihenfolge }));
}

function linkPerson(l: { text: string; bild?: string; zeilen?: string[] }, fw: string[]): { name: string; rolle: string | null } | null {
    const zeilen = l.zeilen?.length ? l.zeilen : [l.text];
    for (const [i, z] of zeilen.entries()) {
        const name = normalisiereName(z, fw);
        if (!name) continue;
        const naechste = zeilen[i + 1];
        const rolle = naechste && istRollenZeile(naechste, false) ? bereinigeRolle(naechste, fw) : null;
        return { name, rolle };
    }
    if (l.bild) {
        const b = personAusBildText(l.bild, fw);
        if (b) return { name: b.name, rolle: b.rolle };
    }
    return null;
}

/** Zuständigkeit in der Gegenwart («ist für … zuständig», «betreut», «kümmert sich») — nicht Lebenslauf («leitete», «betreute»). */
const ZUSTAENDIG_RE = /(?:zust(?:ä|ae)ndig|verantwortlich|k(?:ü|ue)mmert sich|betreut(?![a-zäöü])|ansprech(?:partner(?:in)?|person)|schwerpunkt)/i;
const PRIVAT_RE = /@|\+?\d[\d\s/.-]{6,}\d|https?:|www\.|\b[1-9]\d{3}\s+\p{Lu}/u;

/** Ein Satz zur Zuständigkeit (ohne Nummern, E-Mail, Adresse), sonst eine Schwerpunkt-Liste. */
export function zustaendigkeitAus(zeilen: string[], name: string): string | null {
    const nachname = trenneTitel(name).rest.split(' ').pop() ?? '';
    for (const z of zeilen.slice(0, 40)) {
        for (const satz of z.split(/(?<=[.!?])\s+(?=\p{Lu})/u)) {
            const s = satz.trim();
            if (s.length < 25 || s.length > 260 || /^[«»"“”]/.test(s) || PRIVAT_RE.test(s)) continue;
            if (!ZUSTAENDIG_RE.test(s)) continue;
            if (!(s.includes(nachname) || /^(?:er|sie)\s/i.test(s) || /\s(?:er|sie) (?:ist|leitet|betreut|kümmert)/i.test(s))) continue;
            return s.replace(/\s+/g, ' ');
        }
    }
    // Schwerpunkt-Liste: «Strategieüberprüfung und -entwicklung, Auftraggeber-Vertretung in Projekten, …»
    for (const z of zeilen.slice(0, 12)) {
        const t = z.trim().replace(/[,;]$/, '');
        if (t.length < 20 || t.length > 200 || /[«»"“”@]/.test(t) || PRIVAT_RE.test(t) || /[.!?]$/.test(t)) continue;
        if (t.split(',').length < 2 || normalisiereName(t.split(',')[0])) continue;
        if (namensSchluessel(t).includes(namensSchluessel(name))) continue;
        // Rolle mit Abschluss («Software Ingenieur & Partner, B.Sc. CS») ist keine Schwerpunkt-Liste
        if (/\b(?:B\.?\s?Sc|M\.?\s?Sc|M\.?\s?A\.|B\.?\s?A\.|MBA|MAS|HSG|ETH|ZHAW|HSR|FH|HF|EFZ|lic\.|dipl\.|eidg\.)/i.test(t) || ROLLE_RE.test(t.split(',')[0])) continue;
        return `Schwerpunkte: ${t}`;
    }
    return null;
}

/**
 * Person auf ihrer eigenen Team-Unterseite: Name-Zeile (aus dem Link bzw. passend zum
 * Pfad), Rolle = Zeile(n) danach (bzw. eine Leitungsrolle im Text, z. B. «NAME, lic. oec.,
 * Gründer und Direktor …»), Zuständigkeit = ein Satz.
 */
export function personAusTeamSeite(zeilen: string[], link: Pick<TeamLink, 'name' | 'slugName' | 'rolle'>, firmenWoerter: string[] = []): { name: string; rolle: string | null; zustaendigkeit: string | null } | null {
    let idx = -1;
    let name: string | null = null;
    for (let i = 0; i < Math.min(zeilen.length, 400); i++) {
        if (zeilen[i].length > 80) continue;
        const n = normalisiereName(zeilen[i], firmenWoerter);
        if (!n) continue;
        const passt = link.name ? namensSchluessel(n) === namensSchluessel(link.name) : passtZumSlug(n, link.slugName);
        if (passt) {
            idx = i;
            name = n;
            break;
        }
    }
    if (idx < 0 || !name) return link.name ? { name: link.name, rolle: link.rolle, zustaendigkeit: null } : null;
    const rollen: string[] = [];
    for (let j = idx + 1; j <= Math.min(zeilen.length - 1, idx + 3); j++) {
        const r = zeilen[j];
        if (!istRollenZeile(r, false)) break;
        const b = bereinigeRolle(r, firmenWoerter);
        if (!b) break;
        if (rollen.length && !(ROLLE_RE.test(b) || BERUF_RE.test(b))) break;
        rollen.push(b);
        if (rollen.length >= 2) break;
    }
    const nachher = zeilen.slice(idx + 1, idx + 40);
    const textRollen = personenAusZeilen(nachher, { firmenWoerter })
        .filter((p) => namensSchluessel(p.name) === namensSchluessel(name!) && p.rolle && istLeitung(p.rolle))
        .map((p) => p.rolle as string);
    if (textRollen.length) {
        const t = textRollen[0];
        const i = rollen.findIndex((r) => istLeitung(r));
        if (i < 0) rollen.push(t);
        else if (vgl(t).includes(vgl(rollen[i])) && t.length <= 60) rollen[i] = t; // «Direktor» → «Gründer und Direktor»
    }
    const rolle = rollen.length ? rollen.slice(0, 2).join(', ') : link.rolle;
    return { name, rolle: rolle ?? null, zustaendigkeit: zustaendigkeitAus(nachher, name) };
}

/* ------------------------------------------------------------------ */
/* Zusammenführen und Reihenfolge                                      */
/* ------------------------------------------------------------------ */

/** Abstand zweier Wörter (Einfügen/Löschen/Ersetzen). */
function abstand(a: string, b: string): number {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
}

/** Gleiche Person trotz Tippfehler: gleicher Nachname, gleiche Wortzahl, Vorname höchstens 1 Zeichen anders (ab 5 Buchstaben). */
function gleichePerson(a: string, b: string): boolean {
    const x = a.split(' ');
    const y = b.split(' ');
    if (x.length !== y.length || x[x.length - 1] !== y[y.length - 1]) return false;
    return x.slice(0, -1).every((w, i) => w === y[i] || (w.length >= 5 && abstand(w, y[i]) <= 1));
}

const QUELL_RANG: Record<PersonQuelle, number> ={ 'team-seite': 0.5, text: 0.3, jsonld: 0.2, 'team-link': 0.1, bild: 0 };

/**
 * Funde zusammenführen: gleicher Name (ohne Titel/Akzente) = eine Person. Name mit
 * Titel bevorzugt, Rolle mit dem höchsten Gewicht (Leitung zuerst), erste Zuständigkeit.
 * Reihenfolge: Leitung, dann übrige Rollen, dann Teammitglieder ohne Rolle — je in
 * Website-Reihenfolge. Höchstens `max` Personen.
 */
export function fuehrePersonenZusammen(funde: PersonFund[], max = MAX_PERSONEN): Person[] {
    const gruppen = new Map<string, PersonFund[]>();
    for (const f of funde) {
        let k = namensSchluessel(f.name);
        if (!k || k.split(' ').length < 2) continue;
        // Tippfehler-Varianten derselben Person («Pelegrina» im Bild-alt, «Peregrina» in der Überschrift)
        if (!gruppen.has(k)) k = [...gruppen.keys()].find((x) => gleichePerson(x, k)) ?? k;
        gruppen.set(k, [...(gruppen.get(k) ?? []), f]);
    }
    const personen = [...gruppen.values()].map((g) => {
        const name = g.find((f) => /^(?:prof\.|dr\.)/i.test(f.name))?.name ?? [...g].sort((a, b) => QUELL_RANG[b.quelle] - QUELL_RANG[a.quelle])[0].name;
        const mitRolle = g.filter((f) => f.rolle);
        mitRolle.sort((a, b) => rollenGewicht(b.rolle) + QUELL_RANG[b.quelle] - (rollenGewicht(a.rolle) + QUELL_RANG[a.quelle]));
        const rolle = mitRolle[0]?.rolle ?? null;
        const zustaendigkeit = g.find((f) => f.zustaendigkeit)?.zustaendigkeit ?? null;
        const reihenfolge = Math.min(...g.map((f) => f.reihenfolge));
        return { name, rolle, zustaendigkeit, reihenfolge };
    });
    personen.sort((a, b) => {
        const ga = a.rolle ? (istLeitung(a.rolle) ? 2 : 1) : 0;
        const gb = b.rolle ? (istLeitung(b.rolle) ? 2 : 1) : 0;
        return gb - ga || a.reihenfolge - b.reihenfolge;
    });
    return personen.slice(0, max).map((p) => ({
        name: p.name,
        rolle: p.rolle ?? 'Teammitglied',
        ...(p.zustaendigkeit ? { zustaendigkeit: p.zustaendigkeit } : {}),
    }));
}

/**
 * Reihenfolge der Team-Unterseiten (höchstens 6): Leitung zuerst. Signale: Rolle in
 * der Karte der Übersicht, Person mit (Leitungs-)Rolle auf einer anderen Seite
 * (Impressum, «Ihr Ansprechpartner für …: NAME»), Name im Text anderer Seiten,
 * Nachname im Firmennamen; sonst Website-Reihenfolge.
 */
export function ordneTeamLinks(links: TeamLink[], bekannt: PersonFund[], textAndererSeiten: string, firmenWoerter: string[] = [], max = MAX_TEAM_SEITEN): TeamLink[] {
    const fw = new Set(firmenWoerter.map(vgl));
    const textVgl = vgl(textAndererSeiten);
    const punkte = (l: TeamLink): number => {
        let p = 0;
        if (l.rolle && istLeitung(l.rolle)) p += 100;
        else if (l.rolle) p += 10;
        const name = l.name ?? l.slugName;
        const passend = bekannt.filter((f) => (l.name ? namensSchluessel(f.name) === namensSchluessel(l.name) : passtZumSlug(f.name, l.slugName)));
        if (passend.some((f) => istLeitung(f.rolle))) p += 60;
        else if (passend.some((f) => f.rolle)) p += 40;
        if (l.name && textVgl.includes(vgl(trenneTitel(l.name).rest))) p += 20;
        const nachname = vgl(name.split(' ').pop() ?? '');
        if (nachname.length >= 3 && fw.has(nachname)) p += 10;
        return p - l.reihenfolge * 0.001;
    };
    return [...links].sort((a, b) => punkte(b) - punkte(a)).slice(0, max);
}

/* ------------------------------------------------------------------ */
/* Wissen                                                              */
/* ------------------------------------------------------------------ */

/** Bereich aus einer Funktionsrolle («Leiterin Finanzen» → «Finanzen», «Office Management» → «Office Management»). */
export function bereichAusRolle(rolle: string): string | null {
    const r = rolle.split(/,|\s\/\s/)[0].trim();
    const m = r.match(/^(?:leiter(?:in)?|leitung|head of|verantwortliche?r?(?: f(?:ü|ue)r)?|abteilungsleiter(?:in)?|bereichsleiter(?:in)?|teamleiter(?:in)?)\s+(.{3,40})$/i);
    if (m) return m[1].replace(/^(?:der|des|die)\s+/i, '').trim();
    if (/^(?:office management|administration|buchhaltung|finanzen|personal|hr|marketing|verkauf|einkauf|kundendienst|support|empfang|sekretariat|disposition|lohnbuchhaltung|kreditorenbuchhaltung|debitorenbuchhaltung|logistik|controlling|kommunikation|immobilien|service)$/i.test(r)) return r;
    return null;
}

/** «für X zuständig» → X (Akkusativ passt direkt in «Wer ist für X zuständig?»). */
export function zustaendigFuer(satz: string | null | undefined): string | null {
    if (!satz) return null;
    const m = satz.match(/\bf(?:ü|ue)r\s+(.{3,140}?)\s+(?:zust(?:ä|ae)ndig|verantwortlich)\b/i);
    if (!m) return null;
    const x = m[1].split(/\s*,\s*|\s+wie auch\s+|\s+sowie\s+|\s+und f(?:ü|ue)r\s+/)[0].trim();
    return x.length >= 3 && x.length <= 80 && !/\d{3}/.test(x) ? x : null;
}

/**
 * Erster Schwerpunkt als Thema einer Frage («Strategische Integrations- und Kooperationsprojekte»
 * → «strategische Integrations- und Kooperationsprojekte»: ein Adjektiv am Satzanfang wird klein).
 */
export function schwerpunktThema(liste: string): string | null {
    const erster = liste.split(/\s*[,;]\s*/)[0]?.trim() ?? '';
    if (erster.length < 4 || erster.length > 70 || /\d{3}|@/.test(erster)) return null;
    const [wort, ...rest] = erster.split(' ');
    const adjektiv = rest.length > 0 && /^\p{Lu}\p{Ll}+(?:e|en|er|es|em)$/u.test(wort) && /^\p{Lu}/u.test(rest[0]);
    return adjektiv ? `${wort.charAt(0).toLowerCase()}${wort.slice(1)} ${rest.join(' ')}` : erster;
}

function mitRolle(p: Person): string {
    return p.rolle && p.rolle !== 'Teammitglied' ? `${p.name} (${p.rolle})` : p.name;
}

function aufzaehlung(teile: string[]): string {
    return teile.length <= 1 ? (teile[0] ?? '') : `${teile.slice(0, -1).join(', ')} und ${teile[teile.length - 1]}`;
}

/**
 * Wissenseinträge zum Team (Thema `team`): «Wer leitet FIRMA?», «Wer ist für X
 * zuständig?», «Wen kann ich wegen Y sprechen?», «Wer arbeitet bei FIRMA?».
 * Höchstens `max` Einträge, Antworten ≤ 480 Zeichen, nur Angaben aus `personen`.
 */
export function wissenTeam(personen: Person[], firma: string, max = 7): Array<{ frage: string; antwort: string; thema: string }> {
    const w: Array<{ frage: string; antwort: string; thema: string }> = [];
    if (!personen.length) return w;
    const kurz = (t: string) => (t.length <= 480 ? t : t.slice(0, 478).replace(/[\s,;][^\s,;]*$/, '') + ' …');
    const leitung = personen.filter((p) => istLeitung(p.rolle));
    if (leitung.length) {
        w.push({ frage: `Wer leitet ${firma}?`, antwort: kurz(`Laut Website: ${aufzaehlung(leitung.slice(0, 4).map(mitRolle))}.`), thema: 'team' });
    }
    const fragen = new Set<string>();
    for (const p of personen) {
        if (w.length >= max - 1) break;
        const x = zustaendigFuer(p.zustaendigkeit);
        if (x && !fragen.has(`x:${x.toLowerCase()}`)) {
            fragen.add(`x:${x.toLowerCase()}`);
            w.push({ frage: `Wer ist für ${x} zuständig?`, antwort: kurz(`Für ${x} ist ${mitRolle(p)} zuständig.`), thema: 'team' });
            continue;
        }
        // Schwerpunkte von der Team-Seite: «Wer ist für strategische Projekte zuständig?»
        const sp = p.zustaendigkeit?.match(/^Schwerpunkte:\s*(.+)$/)?.[1] ?? null;
        const erster = sp ? schwerpunktThema(sp) : null;
        if (erster && !fragen.has(`x:${erster.toLowerCase()}`)) {
            fragen.add(`x:${erster.toLowerCase()}`);
            w.push({ frage: `Wer ist für ${erster} zuständig?`, antwort: kurz(`Zu den Schwerpunkten von ${mitRolle(p)} gehören laut Website: ${sp}.`), thema: 'team' });
            continue;
        }
        const y = p.rolle ? bereichAusRolle(p.rolle) : null;
        if (y && !fragen.has(`y:${y.toLowerCase()}`)) {
            fragen.add(`y:${y.toLowerCase()}`);
            const satz = p.zustaendigkeit && !/^Schwerpunkte:/.test(p.zustaendigkeit) ? ` ${p.zustaendigkeit}` : '';
            w.push({ frage: `Wen kann ich wegen ${y} sprechen?`, antwort: kurz(`Wegen ${y} sprechen Sie mit ${mitRolle(p)}.${satz}`), thema: 'team' });
        }
    }
    if (w.length < max) {
        w.push({ frage: `Wer arbeitet bei ${firma}?`, antwort: kurz(`Laut Website gehören zum Team: ${aufzaehlung(personen.map(mitRolle))}.`), thema: 'team' });
    }
    return w.slice(0, max);
}
