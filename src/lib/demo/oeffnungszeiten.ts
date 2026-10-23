/**
 * Öffnungszeiten aus Website-Text — nur, wenn es welche sind (AUFTRAG-096, Teil 4).
 *
 * Eine Zeile gilt nur mit
 *   - Wochentag (Montag … Sonntag, Mo/Di/…/So in Tages-Schreibweise wie
 *     «Mo–Fr», «Mo.», «Di:», «Sa, So», dazu werktags/täglich; Französisch,
 *     Italienisch, Englisch ausgeschrieben) ODER «Uhr»,
 *   - UND einer Zeitspanne (hh:mm/hh.mm/h Uhr – hh:mm …, z. B. «08.00 – 12.00 Uhr»,
 *     «8–12 Uhr», «9h–18h»),
 *   - UND ohne Datum (dd.mm.yyyy, dd.mm., «17. November», Monatsname mit Jahr).
 * Einzelne Zeilen ausserhalb eines Öffnungszeiten-Blocks dürfen kaum andere
 * Wörter enthalten (keine Fliesstext-Sätze, keine Kurs- oder Eventzeilen).
 * «Fr. 10.00» ist ein Preis (Franken), keine Zeit.
 */
function bereinigeText(s: string): string {
    return s.replace(/[   ]/g, ' ').replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
}

const TAG_LANG =
    'montags?|dienstags?|mittwochs?|donnerstags?|freitags?|samstags?|sonntags?|werktags?|wochentags?|täglich|taeglich|feiertags?|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lunedì|lunedi|martedì|martedi|mercoledì|mercoledi|giovedì|giovedi|venerdì|venerdi|sabato|domenica|monday|tuesday|wednesday|thursday|friday|saturday|sunday';
const TAG_KURZ = 'Mo|Di|Mi|Do|Fr|Sa|So|MO|DI|MI|DO|FR|SA|SO|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Lu|Ma|Me|Je|Ve|Lun|Mar|Mer|Jeu|Ven|Sam|Dim';

const TAG_LANG_RE = new RegExp(`(?:^|[^\\p{L}])(?:${TAG_LANG})(?![\\p{L}])`, 'iu');
/** Kurzform nur in Tages-Schreibweise: gefolgt von Punkt, Doppelpunkt, Spanne/Liste mit weiterem Tag oder direkt einer Uhrzeit. */
const ZEIT_KERN = '(?:[01]?\\d|2[0-4])(?:[.:h][0-5]\\d)?';
const TAG_KURZ_RE = new RegExp(
    `(?:^|[^\\p{L}])(?:${TAG_KURZ})(?:\\.|:|\\s*(?:–|—|-|bis|à|au|to|,|/|&|und|et)\\s*(?:${TAG_KURZ}|${TAG_LANG})(?![\\p{L}])|\\s+${ZEIT_KERN}\\s*(?:–|—|-|bis|à|to))`,
    'u',
);
const UHR_RE = /\buhr\b/i;

/** Zeitspanne: «08:00–12:00», «08.00 - 12.00 Uhr», «8–12 Uhr», «9h–18h», «7.30 bis 12 Uhr», «von 11.30 bis 23.00». */
const ZEIT_A = '(?:[01]?\\d|2[0-4])[.:h][0-5]\\d';
const ZEIT_B = '(?:[01]?\\d|2[0-4])(?:[.:h][0-5]\\d|h)?';
const SPANNE_RE = new RegExp(
    `(?:\\b${ZEIT_A}\\s*(?:uhr|h)?\\s*(?:–|—|-|bis|à|a|to)\\s*${ZEIT_B}\\b)|(?:\\b${ZEIT_B}\\s*(?:–|—|-|bis|à|to)\\s*${ZEIT_A}\\b)|(?:\\b${ZEIT_B}\\s*(?:–|—|-|bis)\\s*${ZEIT_B}\\s*uhr\\b)|(?:\\b\\d{1,2}h\\s*(?:–|—|-|à)\\s*\\d{1,2}h\\b)`,
    'i',
);
/** «geschlossen», «nach Vereinbarung»: nur als Fortsetzung in einem Block. */
const ZU_RE = /geschlossen|nach vereinbarung|auf anfrage|ruhetag|fermé|closed|chiuso/i;

const MONATE =
    'januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember|janvier|février|fevrier|mars|avril|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|dicembre|january|february|march|june|july|october|december';
const MONAT_KURZ = 'jan|feb|mär|mar|apr|jun|jul|aug|sep|sept|okt|oct|nov|dez|dec';
const DATUM_RE = new RegExp(
    `\\b\\d{1,2}\\.\\s?\\d{1,2}\\.\\s?(?:\\d{4}|\\d{2})\\b|\\b\\d{1,2}\\.\\d{1,2}\\.(?!\\d)|\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b\\d{1,2}\\.?\\s?(?:${MONATE})\\b|\\b(?:${MONATE}|${MONAT_KURZ})\\.?\\s+\\d{4}\\b|\\b\\d{1,2}/\\d{1,2}/\\d{2,4}\\b`,
    'iu',
);
/** «Fr. 10.00», «CHF 25.–»: Preis, keine Uhrzeit. */
const PREIS_RE = /\b(?:fr|chf|sfr|eur)\.?\s?\d+(?:[.,]\d{2}|\.[–-])/i;

const TITEL_RE =
    /öffnungszeit|oeffnungszeit|offnungszeit|sprechstunde|sprechzeit|praxiszeit|bürozeit|buerozeit|geschäftszeit|geschaeftszeit|telefonzeit|schalterzeit|erreichbarkeit|opening hours|heures d'ouverture|horaires|orari/i;

/** Überschriften einzelner Abteilungen/Angebote: deren Zeiten gelten nicht für den ganzen Betrieb. */
const ABTEILUNG_RE = /\b(b2b|firmenkunden|geschäftskunden|geschaeftskunden|medien(?:schaffende)?|presse|events?|sponsoring|karriere|jobs|stellen|kurse?|workshops?|seminare?|veranstaltung(?:en)?)\b/i;

export function hatTag(z: string): boolean {
    return TAG_LANG_RE.test(z) || TAG_KURZ_RE.test(z);
}

export function hatZeitspanne(z: string): boolean {
    return SPANNE_RE.test(z.replace(PREIS_RE, ' '));
}

export function hatDatum(z: string): boolean {
    return DATUM_RE.test(z);
}

/** Wörter, die weder Tag, Zeit noch typische Füllwörter einer Öffnungszeiten-Zeile sind. */
function fremdeWoerter(z: string): number {
    const rest = z
        .replace(new RegExp(`(?:${TAG_LANG})`, 'giu'), ' ')
        .replace(new RegExp(`(?<![\\p{L}])(?:${TAG_KURZ})(?![\\p{L}])`, 'gu'), ' ')
        .replace(/\d+[.:h]?\d*/g, ' ')
        .replace(/\b(uhr|bis|und|von|ab|jeweils|sowie|durchgehend|geschlossen|geöffnet|geoeffnet|offen|nach|vereinbarung|vormittag|vormittags|nachmittag|nachmittags|morgens|abends|mittags|mittag|telefon|telefonisch|büro|buero|praxis|laden|shop|geschäft|und|feiertage|feiertag|öffnungszeiten|oeffnungszeiten|sprechstunden?|et|de|à|le|la|les|du|au|h|and|to|from|closed|open|ou|oder|ausser|ausgenommen|nur|auf|anfrage|termin|termine|im|am|an|in|the|daily|tag|tage)\b/giu, ' ')
        .replace(/[^\p{L}\s]/gu, ' ');
    return rest.split(/\s+/).filter((w) => w.length >= 3).length;
}

/**
 * Prüft eine einzelne Zeile. `imBlock` = Zeile steht unter einer
 * Öffnungszeiten-Überschrift (dann sind mehr andere Wörter erlaubt).
 */
export function istOeffnungszeitZeile(z: string, imBlock = false): boolean {
    if (!z || z.length > 160 || hatDatum(z)) return false;
    if (!(hatTag(z) || UHR_RE.test(z))) return false;
    if (!hatZeitspanne(z)) return false;
    return fremdeWoerter(z) <= (imBlock ? 8 : 4);
}

/** Prüft einen fertigen Öffnungszeiten-Text (z. B. von der KI): mindestens ein gültiger Teil, kein Datum. */
export function istOeffnungszeitText(t: string | null | undefined): boolean {
    if (!t || t.length > 300 || hatDatum(t)) return false;
    const teile = t.split(/\s*[;\n]\s*/).filter(Boolean);
    return teile.some((teil) => istOeffnungszeitZeile(teil, true)) || istOeffnungszeitZeile(t, true);
}

/**
 * Findet Öffnungszeiten in Textzeilen (eine Seite); beste Blöcke zuerst, höchstens 4.
 * `nurBlock`: nur Blöcke unter einer Öffnungszeiten-Überschrift (für weitere Unterseiten).
 */
export function findeOeffnungszeiten(zeilen: string[], nurBlock = false): string[] {
    const bloecke: string[][] = [];
    for (let i = 0; i < zeilen.length; i++) {
        const z = zeilen[i];
        // Zeiten einer einzelnen Abteilung (B2B, Medien, Events, Kurse …) sind nicht die Öffnungszeiten des Betriebs
        const abteilung = zeilen.slice(Math.max(0, i - 4), i).some((v) => v.length <= 60 && ABTEILUNG_RE.test(v));
        // Block nach einer Öffnungszeiten-Überschrift
        if (TITEL_RE.test(z) && z.length <= 60 && !hatDatum(z) && !abteilung) {
            const block: string[] = [];
            let gueltig = false;
            let ende = i;
            for (let j = i + 1; j < Math.min(zeilen.length, i + 18) && block.length < 10; j++) {
                const vorher = block.length + (block[block.length - 1]?.length ?? 0);
                const k = zeilen[j];
                // neuer Abschnitt einer Abteilung (B2B, Medien …): Block endet hier
                if (k.length <= 60 && ABTEILUNG_RE.test(k)) break;
                if (k.length > 160 || hatDatum(k)) {
                    if (block.length) break;
                    continue;
                }
                const naechste = zeilen[j + 1] ?? '';
                // Zwei Spalten: erst n Tage, dann n Zeiten («Mittwoch | Freitag | Samstag | 12:00 bis 20:00 | …»)
                const nurTag = (x: string | undefined) => !!x && x.length <= 30 && hatTag(x) && !hatZeitspanne(x) && !hatDatum(x);
                const nurZeit = (x: string | undefined) => !!x && x.length <= 40 && hatZeitspanne(x) && !hatTag(x) && !hatDatum(x) && fremdeWoerter(x) <= 1;
                let tage = 0;
                while (nurTag(zeilen[j + tage]) && tage < 8) tage++;
                let zeiten = 0;
                while (tage >= 2 && nurZeit(zeilen[j + tage + zeiten]) && zeiten < tage) zeiten++;
                if (tage >= 2 && zeiten === tage) {
                    for (let t = 0; t < tage; t++) block.push(`${zeilen[j + t]} ${zeilen[j + tage + t]}`);
                    gueltig = true;
                    j += 2 * tage - 1;
                    ende = j;
                    continue;
                }
                if (istOeffnungszeitZeile(k, true)) {
                    block.push(k);
                    gueltig = true;
                } else if (hatTag(k) && k.length <= 70 && naechste && !hatTag(naechste) && !hatDatum(naechste) && (hatZeitspanne(naechste) || ZU_RE.test(naechste)) && naechste.length <= 60) {
                    // Tabelle: «Montag» | «08:00 – 12:00»
                    const zusammen = `${k} ${naechste}`;
                    if (istOeffnungszeitZeile(zusammen, true)) gueltig = true;
                    if (istOeffnungszeitZeile(zusammen, true) || ZU_RE.test(naechste)) block.push(zusammen);
                    j++;
                } else if (block.length && hatZeitspanne(k) && !hatTag(k) && k.length <= 40 && fremdeWoerter(k) <= 2) {
                    // zweite Zeitspanne desselben Tages («13:30 – 17:00»)
                    block[block.length - 1] = `${block[block.length - 1]}, ${k}`;
                } else if (block.length && hatTag(k) && ZU_RE.test(k) && k.length <= 60) {
                    block.push(k);
                } else if (block.length && k.length > 60) {
                    break;
                }
                if (block.length + (block[block.length - 1]?.length ?? 0) !== vorher) ende = j;
            }
            if (gueltig && block.length) {
                bloecke.push(block);
                i = ende;
            } else if (istOeffnungszeitZeile(z, true)) {
                // «Öffnungszeiten: Mo–Fr 08:00–17:00» in einer Zeile
                bloecke.push([z]);
            }
            continue;
        }
        if (nurBlock || abteilung) continue;
        // «Mo - Fr» | «unter» | «7:30 - 17.00 Uhr»: kurzes Füllwort zwischen Tagen und Zeit
        const fuell = zeilen[i + 1] ?? '';
        if (z.length <= 30 && hatTag(z) && !hatZeitspanne(z) && fuell.length <= 8 && !/\d/.test(fuell) && i + 2 < zeilen.length && zeilen[i + 2].length <= 60) {
            const zusammen = `${z} ${zeilen[i + 2]}`;
            if (istOeffnungszeitZeile(zusammen)) {
                bloecke.push([zusammen]);
                i += 2;
                continue;
            }
        }
        if (istOeffnungszeitZeile(z)) {
            bloecke.push([z]);
        } else if (z.length <= 30 && hatTag(z) && !hatDatum(z) && i + 1 < zeilen.length && zeilen[i + 1].length <= 60) {
            const zusammen = `${z} ${zeilen[i + 1]}`;
            if (istOeffnungszeitZeile(zusammen)) {
                bloecke.push([zusammen]);
                i++;
            }
        }
    }
    const texte = bloecke
        .map((b) => [...new Set(b.map(bereinigeText))].join('; '))
        .filter((t) => t.length >= 6)
        .map((t) => (t.length > 300 ? t.slice(0, 297).replace(/[;,\s]+\S*$/, '') + ' …' : t));
    const eindeutig = [...new Set(texte)];
    return eindeutig.sort((a, b) => (b.match(/;/g)?.length ?? 0) - (a.match(/;/g)?.length ?? 0)).slice(0, 4);
}
