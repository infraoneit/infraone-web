/**
 * Hintergrund der Logo-Umgebung (AUFTRAG-096, Teil 2) — ohne Browser.
 *
 * Der Scanner kennt die Vorfahren-Kette eines Logo-Elements (Tag, id,
 * Klassen, style) und die geladenen Stylesheets/`<style>`. Daraus wird die
 * `background-color` des nächsten Vorfahren mit deckender Farbe bestimmt:
 * Inline-`style` vor Stylesheet-Regeln, Regeln nach Spezifität und
 * Reihenfolge. Unterstützt werden einfache Selektoren (Tag, #id, .klasse,
 * [attr], :root, :not() wird ignoriert) mit Nachfahren- (` `) und
 * Kind-Kombinator (`>`). Zustände (:hover …), Pseudo-Elemente und
 * Geschwister-Kombinatoren zählen nicht. Regeln nur für schmale Bildschirme
 * (`max-width` ohne `min-width`), Druck und Dunkelmodus zählen nicht.
 *
 * Ein Hintergrundbild oder Verlauf auf dem Weg nach oben beendet die Suche
 * (Grund unbekannt → keine Website-Farbe).
 */
import { hexZuRgb, rgbZuHex, hslZuRgb } from './farben';

/** Ein Element der Vorfahren-Kette (vom Logo nach oben, zuletzt html). */
export interface Ahne {
    tag: string;
    id?: string;
    klassen?: string[];
    stil?: string;
    attr?: Record<string, string>;
}

export interface Umgebung {
    /** Deckende Hintergrundfarbe (#RRGGBB) oder null (Bild/Verlauf → unbekannt). */
    farbe: string | null;
    /** Element, das die Farbe trägt (z. B. «header.site-header»). */
    quelle: string;
    /** true = Hintergrundbild/Verlauf gefunden, Grund unbekannt. */
    bild?: boolean;
}

/* ------------------------------------------------------------------ */
/* Farbwerte mit Deckkraft                                             */
/* ------------------------------------------------------------------ */

const BENANNT: Record<string, string> = {
    white: '#FFFFFF',
    black: '#000000',
    red: '#FF0000',
    yellow: '#FFFF00',
    blue: '#0000FF',
    green: '#008000',
    orange: '#FFA500',
    navy: '#000080',
    gray: '#808080',
    grey: '#808080',
    silver: '#C0C0C0',
    whitesmoke: '#F5F5F5',
    gold: '#FFD700',
};

/** Liest eine CSS-Farbe samt Deckkraft (0–1). Unbekannt → null. */
export function farbeMitAlpha(wert: string): { hex: string; alpha: number } | null {
    const v = wert.trim().toLowerCase();
    if (v === 'transparent') return { hex: '#000000', alpha: 0 };
    if (BENANNT[v]) return { hex: BENANNT[v], alpha: 1 };
    if (v.startsWith('#')) {
        const m = v.match(/^#([0-9a-f]{3,8})$/);
        if (!m) return null;
        const h = m[1];
        const rgb = hexZuRgb('#' + h);
        if (!rgb) return null;
        let alpha = 1;
        if (h.length === 4) alpha = parseInt(h[3] + h[3], 16) / 255;
        if (h.length === 8) alpha = parseInt(h.slice(6, 8), 16) / 255;
        return { hex: rgbZuHex(rgb), alpha };
    }
    const a = (s: string | undefined) => (s ? parseFloat(s) / (s.endsWith('%') ? 100 : 1) : 1);
    const rgbM = v.match(/^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (rgbM) {
        const k = (s: string) => (s.endsWith('%') ? (parseFloat(s) * 255) / 100 : parseFloat(s));
        return { hex: rgbZuHex({ r: k(rgbM[1]), g: k(rgbM[2]), b: k(rgbM[3]) }), alpha: a(rgbM[4]) };
    }
    const hslM = v.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (hslM) return { hex: rgbZuHex(hslZuRgb({ h: +hslM[1], s: +hslM[2] / 100, l: +hslM[3] / 100 })), alpha: a(hslM[4]) };
    return null;
}

/* ------------------------------------------------------------------ */
/* Selektoren                                                          */
/* ------------------------------------------------------------------ */

interface Teil {
    tag: string | null;
    id: string | null;
    klassen: string[];
    attr: Array<{ name: string; op: string | null; wert: string | null }>;
    root: boolean;
    /** :where()/:is(): mindestens eine dieser einfachen Alternativen muss passen */
    alternativen?: Teil[][];
}

interface Selektor {
    /** von rechts nach links: teile[0] ist das Ziel-Element */
    teile: Teil[];
    /** Kombinator zwischen teile[i] und teile[i+1] (' ' oder '>') */
    kombi: string[];
    spez: number;
}

const ZUSTAND_RE = /^(hover|focus|focus-within|focus-visible|active|visited|checked|target|disabled|enabled|empty|placeholder-shown|invalid|valid|open|popover-open|modal|fullscreen|autofill|indeterminate|selected)$/i;

/** Liest einen Bezeichner mit CSS-Escapes (z. B. `bg-\[\#FAE600\]` → `bg-[#FAE600]`). */
function leseName(s: string, i: number): [string, number] {
    let name = '';
    while (i < s.length) {
        const c = s[i];
        if (c === '\\') {
            const hex = s.slice(i + 1).match(/^[0-9a-f]{1,6}\s?/i);
            if (hex) {
                name += String.fromCodePoint(parseInt(hex[0].trim(), 16));
                i += 1 + hex[0].length;
            } else {
                name += s[i + 1] ?? '';
                i += 2;
            }
            continue;
        }
        if (/[\w -￿-]/.test(c)) {
            name += c;
            i++;
            continue;
        }
        break;
    }
    return [name, i];
}

/** Zerlegt einen einzelnen Selektor; null, wenn er nicht auswertbar ist. */
export function parseSelektor(roh: string): Selektor | null {
    const s = roh.trim();
    if (!s || s.length > 300) return null;
    const teile: Teil[] = [];
    const kombi: string[] = [];
    let aktuell: Teil = { tag: null, id: null, klassen: [], attr: [], root: false };
    let leer = true;
    let spez = 0;
    let i = 0;
    const abschliessen = () => {
        if (leer) return false;
        teile.push(aktuell);
        aktuell = { tag: null, id: null, klassen: [], attr: [], root: false };
        leer = true;
        return true;
    };
    while (i < s.length) {
        const c = s[i];
        if (/\s/.test(c) || c === '>' || c === '+' || c === '~') {
            let k = ' ';
            while (i < s.length && /[\s>+~]/.test(s[i])) {
                if (s[i] !== ' ' && !/\s/.test(s[i])) k = s[i];
                i++;
            }
            if (k === '+' || k === '~') return null;
            if (!abschliessen()) return null;
            kombi.push(k);
            continue;
        }
        if (c === '*') {
            leer = false;
            i++;
            continue;
        }
        if (c === '#') {
            const [n, j] = leseName(s, i + 1);
            if (!n) return null;
            aktuell.id = n;
            spez += 10000;
            leer = false;
            i = j;
            continue;
        }
        if (c === '.') {
            const [n, j] = leseName(s, i + 1);
            if (!n) return null;
            aktuell.klassen.push(n);
            spez += 100;
            leer = false;
            i = j;
            continue;
        }
        if (c === '[') {
            const ende = s.indexOf(']', i);
            if (ende < 0) return null;
            const inhalt = s.slice(i + 1, ende).trim();
            const m = inhalt.match(/^([\w:-]+)\s*(?:([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))\s*(?:\s[is])?)?$/i);
            if (!m) return null;
            aktuell.attr.push({ name: m[1].toLowerCase(), op: m[2] ?? null, wert: m[3] ?? m[4] ?? m[5] ?? null });
            spez += 100;
            leer = false;
            i = ende + 1;
            continue;
        }
        if (c === ':') {
            if (s[i + 1] === ':') return null; // Pseudo-Element
            const [n, j] = leseName(s, i + 1);
            const name = n.toLowerCase();
            i = j;
            if (s[i] === '(') {
                // Klammerinhalt lesen
                let tiefe = 1;
                const innenStart = i + 1;
                i++;
                while (i < s.length && tiefe > 0) {
                    if (s[i] === '(') tiefe++;
                    else if (s[i] === ')') tiefe--;
                    i++;
                }
                const innen = s.slice(innenStart, i - 1);
                if (name === 'not') {
                    // Verneinung: meist erfüllt (Ausnahmen fallen bei Logo-Vorfahren kaum ins Gewicht)
                    leer = false;
                    continue;
                }
                if (name === 'where' || name === 'is' || name === 'matches') {
                    // jede Alternative als eigener Selektor; der Teil passt, wenn eine Alternative auf das Element passt
                    const alternativen = innen
                        .split(',')
                        .map((a) => parseSelektor(a))
                        .filter((a): a is Selektor => !!a && a.teile.length === 1)
                        .map((a) => a.teile);
                    if (!alternativen.length) return null;
                    aktuell.alternativen = [...(aktuell.alternativen ?? []), ...alternativen];
                    if (name !== 'where') spez += 100;
                    leer = false;
                    continue;
                }
                return null; // :has(), :nth-child() … nicht auswertbar
            }
            if (name === 'root') {
                aktuell.root = true;
                spez += 100;
                leer = false;
                continue;
            }
            if (ZUSTAND_RE.test(name) || /^(before|after|first-line|first-letter|selection|marker|backdrop)$/.test(name)) return null;
            // strukturelle Pseudoklassen (:first-child …) gelten als erfüllt
            leer = false;
            continue;
        }
        if (/[a-z]/i.test(c)) {
            const [n, j] = leseName(s, i);
            aktuell.tag = n.toLowerCase();
            spez += 1;
            leer = false;
            i = j;
            continue;
        }
        return null;
    }
    if (!abschliessen()) return null;
    teile.reverse();
    kombi.reverse();
    return { teile, kombi, spez };
}

function passt(t: Teil, el: Ahne): boolean {
    if (t.alternativen && !t.alternativen.some((alt) => passt(alt[0], el))) return false;
    if (t.root && el.tag !== 'html') return false;
    if (t.tag && t.tag !== el.tag) return false;
    if (t.id && t.id !== el.id) return false;
    if (t.klassen.length) {
        const k = el.klassen ?? [];
        for (const c of t.klassen) if (!k.includes(c)) return false;
    }
    for (const a of t.attr) {
        const wert = a.name === 'class' ? (el.klassen ?? []).join(' ') : a.name === 'id' ? el.id : a.name === 'style' ? el.stil : el.attr?.[a.name];
        if (wert === undefined || wert === null) return false;
        if (!a.op || a.wert === null) continue;
        const w = a.wert;
        if (a.op === '=' && wert !== w) return false;
        if (a.op === '*=' && !wert.includes(w)) return false;
        if (a.op === '^=' && !wert.startsWith(w)) return false;
        if (a.op === '$=' && !wert.endsWith(w)) return false;
        if (a.op === '~=' && !wert.split(/\s+/).includes(w)) return false;
        if (a.op === '|=' && !(wert === w || wert.startsWith(w + '-'))) return false;
    }
    return true;
}

/** Passt der Selektor auf kette[pos] (kette[0] = Logo-nächstes Element, aufwärts)? */
export function selektorPasst(sel: Selektor, kette: Ahne[], pos: number): boolean {
    if (!passt(sel.teile[0], kette[pos])) return false;
    let p = pos;
    for (let t = 1; t < sel.teile.length; t++) {
        const k = sel.kombi[t - 1];
        if (k === '>') {
            p++;
            if (p >= kette.length || !passt(sel.teile[t], kette[p])) return false;
        } else {
            let gefunden = false;
            for (p = p + 1; p < kette.length; p++) {
                if (passt(sel.teile[t], kette[p])) {
                    gefunden = true;
                    break;
                }
            }
            if (!gefunden) return false;
        }
    }
    return true;
}

/* ------------------------------------------------------------------ */
/* Stylesheet-Index (nur Regeln mit Hintergrund)                       */
/* ------------------------------------------------------------------ */

interface Regel {
    sel: Selektor;
    wert: string;
    wichtig: boolean;
    index: number;
}

export interface HintergrundIndex {
    nachSchluessel: Map<string, Regel[]>;
    variablen: Map<string, string>;
}

function schluesselVon(t: Teil): string {
    if (t.id) return '#' + t.id;
    if (t.klassen.length) return '.' + t.klassen[0];
    if (t.root) return 'html';
    if (t.tag) return t.tag;
    // :where(.a) bzw. :is(#b): Schlüssel der einzigen Alternative, sonst allgemein
    if (t.alternativen?.length === 1) return schluesselVon(t.alternativen[0][0]);
    return '*';
}

/** Media-Kontext für die Desktop-Ansicht zulassen? */
function mediaGilt(stapel: string[]): boolean {
    for (const m of stapel) {
        if (!/^@media/i.test(m)) continue;
        if (/\bprint\b/i.test(m) && !/\bscreen\b/i.test(m)) return false;
        if (/prefers-color-scheme\s*:\s*dark/i.test(m)) return false;
        if (/max-width/i.test(m) && !/min-width/i.test(m)) return false;
    }
    return true;
}

/** Baut den Index aus CSS-Text (Stylesheets + `<style>`), max. ~1,5 MB. */
export function baueHintergrundIndex(css: string): HintergrundIndex {
    const nachSchluessel = new Map<string, Regel[]>();
    const variablen = new Map<string, string>();
    const text = css.slice(0, 1_600_000).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of text.matchAll(/--([a-z0-9_-]+)\s*:\s*([^;}{]+)/gi)) variablen.set(m[1].toLowerCase(), m[2].replace(/!important/i, '').trim());
    const stapel: string[] = [];
    let puffer = '';
    let index = 0;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '{') {
            const prelude = puffer.trim();
            puffer = '';
            if (/^@(media|supports|layer|container|document)\b/i.test(prelude)) {
                stapel.push(prelude);
                continue;
            }
            let tiefe = 1;
            let j = i + 1;
            while (j < text.length && tiefe > 0) {
                if (text[j] === '{') tiefe++;
                else if (text[j] === '}') tiefe--;
                j++;
            }
            const dekl = text.slice(i + 1, j - 1);
            i = j - 1;
            if (prelude.startsWith('@') || !/background/i.test(dekl) || !mediaGilt(stapel)) continue;
            // letzte background(-color)-Deklaration der Regel
            let wert: string | null = null;
            let wichtig = false;
            for (const d of dekl.matchAll(/(?:^|;)\s*(background(?:-color|-image)?)\s*:\s*([^;]+)/gi)) {
                wert = `${d[1].toLowerCase()}:${d[2].trim()}`;
                wichtig = /!important/i.test(d[2]);
            }
            if (!wert) continue;
            index++;
            for (const teil of prelude.split(',')) {
                const sel = parseSelektor(teil);
                if (!sel) continue;
                const k = schluesselVon(sel.teile[0]);
                const liste = nachSchluessel.get(k) ?? [];
                liste.push({ sel, wert, wichtig, index });
                nachSchluessel.set(k, liste);
            }
            continue;
        }
        if (c === '}') {
            stapel.pop();
            puffer = '';
            continue;
        }
        if (c === ';' && /^\s*@/.test(puffer)) {
            puffer = '';
            continue;
        }
        puffer += c;
    }
    return { nachSchluessel, variablen };
}

type Hintergrund = { art: 'farbe'; hex: string; alpha: number } | { art: 'bild' } | { art: 'leer' };

function loeseVar(wert: string, variablen: Map<string, string>, tiefe = 0): string {
    return wert.replace(/var\(\s*--([a-z0-9_-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/gi, (_, name: string, rueckfall?: string) => {
        const v = variablen.get(name.toLowerCase());
        if (v !== undefined && tiefe < 4) return loeseVar(v, variablen, tiefe + 1);
        return rueckfall ? loeseVar(rueckfall, variablen, tiefe + 1) : 'unset';
    });
}

/** Wertet eine background-Deklaration aus («background-color:…», «background:…»). */
export function werteHintergrund(dekl: string, variablen: Map<string, string> = new Map()): Hintergrund | null {
    const [eigenschaft, ...rest] = dekl.split(':');
    const roh = loeseVar(rest.join(':').replace(/!important/i, '').trim(), variablen).trim();
    const v = roh.toLowerCase();
    if (/^(inherit|initial|unset|revert|revert-layer|none)$/.test(v)) return eigenschaft === 'background-image' ? null : { art: 'leer' };
    if (/url\(|gradient\(|image-set\(/.test(v)) return { art: 'bild' };
    if (eigenschaft === 'background-image') return null;
    // Farbtoken im Wert suchen (Kurzform: «#fff url(…) no-repeat» wurde oben schon als Bild erkannt)
    const tokens = v.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b[a-z]+\b/g) ?? [];
    for (const t of tokens) {
        const f = farbeMitAlpha(t);
        if (f) return { art: 'farbe', hex: f.hex, alpha: f.alpha };
    }
    if (/currentcolor/.test(v)) return null;
    return null;
}

function hintergrundVonElement(el: Ahne, kette: Ahne[], pos: number, idx: HintergrundIndex): Hintergrund | null {
    // Inline-style gewinnt (ausser !important im Stylesheet — selten bei Kopf-Elementen)
    if (el.stil) {
        let letzte: Hintergrund | null = null;
        for (const d of el.stil.matchAll(/(?:^|;)\s*(background(?:-color|-image)?)\s*:\s*([^;]+)/gi)) {
            const h = werteHintergrund(`${d[1].toLowerCase()}:${d[2]}`, idx.variablen);
            if (h) letzte = h;
        }
        if (letzte) return letzte;
    }
    const schluessel = [el.id ? '#' + el.id : null, ...(el.klassen ?? []).map((k) => '.' + k), el.tag, '*'].filter((x): x is string => !!x);
    let beste: { r: Regel; h: Hintergrund } | null = null;
    const besser = (a: Regel, b: Regel) => (a.wichtig !== b.wichtig ? a.wichtig : a.sel.spez !== b.sel.spez ? a.sel.spez > b.sel.spez : a.index > b.index);
    const gesehen = new Set<Regel>();
    for (const k of schluessel) {
        for (const r of idx.nachSchluessel.get(k) ?? []) {
            if (gesehen.has(r)) continue;
            gesehen.add(r);
            if (!selektorPasst(r.sel, kette, pos)) continue;
            const h = werteHintergrund(r.wert, idx.variablen);
            if (!h) continue;
            if (!beste || besser(r, beste.r)) beste = { r, h };
        }
    }
    return beste?.h ?? null;
}

function elementName(el: Ahne): string {
    return `${el.tag}${el.id ? '#' + el.id : ''}${el.klassen?.length ? '.' + el.klassen.slice(0, 2).join('.') : ''}`.slice(0, 80);
}

/**
 * Hintergrund der Logo-Umgebung: erste deckende Farbe (Deckkraft ≥ 0,85)
 * von unten nach oben; Bild/Verlauf → unbekannt; nichts gefunden →
 * Browser-Vorgabe Weiss.
 */
export function bestimmeUmgebung(kette: Ahne[], idx: HintergrundIndex): Umgebung {
    for (let pos = 0; pos < kette.length; pos++) {
        const el = kette[pos];
        const h = hintergrundVonElement(el, kette, pos, idx);
        if (!h || h.art === 'leer') continue;
        if (h.art === 'bild') return { farbe: null, quelle: elementName(el), bild: true };
        if (h.alpha >= 0.85) return { farbe: h.hex, quelle: elementName(el) };
    }
    return { farbe: '#FFFFFF', quelle: 'Vorgabe' };
}
