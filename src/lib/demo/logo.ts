/**
 * Logo-Erkennung der KI-Demo (AUFTRAG-095, Teil 1).
 *
 * Quellen (gesammelt in extraktion.ts / scanner.ts):
 * - <img>/<picture>/srcset inkl. Lazy-Attribute (data-src, data-lazy-src,
 *   data-original, data-srcset …) und data:-URIs,
 * - Inline-SVG im Kopf/Navigation/Startseiten-Link/Logo-Container
 *   (serialisiert und bereinigt, <use>-Verweise auf Sprites aufgelöst),
 * - CSS-background-image auf Logo-Selektoren (Stylesheets + style-Attribut),
 * - JSON-LD `logo`, link rel=icon (sizes ≥ 64), apple-touch-icon,
 *   /favicon.ico (erste Bitmap ≥ 32 px), og:image nur wenn logoartig.
 *
 * Rangfolge: Stufe (wie sicher ist es DAS Logo?) → Merkmale → Qualität
 * (SVG > PNG/WebP mit Transparenz > andere) → Reihenfolge im Dokument.
 * Gültig ist ein Kandidat nur mit längerer Kante ≥ 48 px (SVG: Vektor),
 * Seitenverhältnis 0,2–6 und ohne Foto-Signatur.
 */
import { load } from 'cheerio/slim';
import type { LogoKandidat, LogoQuelle } from './typen';
import type { BildAnalyse } from './bildanalyse';
import { logoPfadPraefix } from './sitzung';

export const LOGO_MIN_KANTE = 48;
export const LOGO_SEITENVERHAELTNIS: [number, number] = [0.2, 6];
/** Ausnahme: Wortmarke mit Logo-Merkmal (Stufe 1) */
export const LOGO_BREITE_WORTMARKE = 15;
const SVG_MAX_ZEICHEN = 300_000;

/* ------------------------------------------------------------------ */
/* SVG bereinigen                                                      */
/* ------------------------------------------------------------------ */

const SVG_VERBOTEN = 'script, foreignObject, foreignobject, iframe, embed, object, audio, video, canvas, handler, listener, a[href*="javascript:"]';

/** SVG-Attributnamen, die im HTML-Parser kleingeschrieben werden (Rückübersetzung). */
const SVG_ATTR_FALL = [
    'viewBox', 'preserveAspectRatio', 'gradientUnits', 'gradientTransform', 'patternUnits', 'patternContentUnits',
    'patternTransform', 'clipPathUnits', 'maskUnits', 'maskContentUnits', 'spreadMethod', 'stdDeviation',
    'textLength', 'lengthAdjust', 'startOffset', 'baseFrequency', 'numOctaves', 'stitchTiles', 'markerWidth',
    'markerHeight', 'markerUnits', 'refX', 'refY', 'pathLength', 'primitiveUnits', 'filterUnits', 'kernelMatrix',
    'tableValues', 'xChannelSelector', 'yChannelSelector', 'diffuseConstant', 'specularExponent', 'surfaceScale',
];
const SVG_TAG_FALL = [
    'linearGradient', 'radialGradient', 'clipPath', 'foreignObject', 'textPath', 'feGaussianBlur', 'feColorMatrix',
    'feOffset', 'feBlend', 'feFlood', 'feComposite', 'feMerge', 'feMergeNode', 'feMorphology', 'feTurbulence',
    'feDisplacementMap', 'feDropShadow', 'animateTransform', 'animateMotion',
];

/** Korrigiert Gross-/Kleinschreibung von SVG-Namen aus HTML-Quelltext (z. B. viewbox → viewBox). */
function svgSchreibweise(svg: string): string {
    let s = svg;
    for (const a of SVG_ATTR_FALL) s = s.replace(new RegExp(`(\\s)${a}(\\s*=)`, 'gi'), `$1${a}$2`);
    for (const t of SVG_TAG_FALL) s = s.replace(new RegExp(`(</?)${t}([\\s>/])`, 'gi'), `$1${t}$2`);
    return s;
}

const EXTERN_URL_RE = /url\(\s*["']?(?!#|data:image\/(?:png|jpe?g|gif|webp);)[^)]*\)/gi;

/**
 * Bereinigt ein SVG (Inline aus der Seite oder Datei): entfernt Skripte,
 * foreignObject, Ereignis-Attribute, externe Verweise (nur #id und
 * data:image-Rastergrafiken bleiben), @import. Ergänzt xmlns.
 * Liefert null, wenn kein <svg>-Wurzelelement übrig bleibt.
 */
export function bereinigeSvg(roh: string): string | null {
    if (!roh || roh.length > SVG_MAX_ZEICHEN * 4) return null;
    const anfang = roh.search(/<svg[\s>/]/i);
    if (anfang < 0) return null;
    const ende = roh.toLowerCase().lastIndexOf('</svg>');
    const kern = svgSchreibweise(roh.slice(anfang, ende > anfang ? ende + 6 : undefined));
    const $ = load(kern, { xml: { xmlMode: true, decodeEntities: false } });
    const wurzel = $('svg').first();
    if (!wurzel.length) return null;
    $(SVG_VERBOTEN).remove();
    // Animationen, die Verweise umschreiben könnten
    $('set, animate').each((_, el) => {
        const ziel = ($(el).attr('attributeName') || '').toLowerCase();
        if (ziel.includes('href') || ziel.startsWith('on')) $(el).remove();
    });
    $('*').each((_, el) => {
        const knoten = el as unknown as { attribs?: Record<string, string> };
        for (const [name, wert] of Object.entries(knoten.attribs ?? {})) {
            const n = name.toLowerCase();
            if (n.startsWith('on')) $(el).removeAttr(name);
            else if (n === 'href' || n === 'xlink:href' || n === 'src') {
                const w = wert.trim();
                if (!(w.startsWith('#') || /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(w))) $(el).removeAttr(name);
            } else if (n === 'style' && /url\(|expression|@import/i.test(wert)) {
                $(el).attr(name, wert.replace(EXTERN_URL_RE, 'none').replace(/expression\s*\(|@import[^;]*;?/gi, ''));
            }
        }
    });
    $('style').each((_, el) => {
        const css = $(el).text().replace(/@import[^;]*;?/gi, '').replace(EXTERN_URL_RE, 'none');
        $(el).text(css);
    });
    // Links entschärfen (Inhalt behalten)
    $('a').each((_, el) => {
        $(el).removeAttr('href').removeAttr('xlink:href').removeAttr('target');
    });
    if (!wurzel.attr('xmlns')) wurzel.attr('xmlns', 'http://www.w3.org/2000/svg');
    if (/xlink:/.test($.xml(wurzel)) && !wurzel.attr('xmlns:xlink')) wurzel.attr('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    // Grösse im <img> über viewBox steuern: Prozentangaben entfernen, fehlende Masse aus der viewBox
    // ergänzen (sonst nimmt der Browser 300×150 an und das Logo schrumpft in Flex-Containern auf 0)
    for (const a of ['width', 'height']) if (/%|auto/.test(wurzel.attr(a) || '')) wurzel.removeAttr(a);
    const vb = (wurzel.attr('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (vb.length === 4 && vb[2] > 0 && vb[3] > 0 && !wurzel.attr('width') && !wurzel.attr('height')) {
        wurzel.attr('width', String(Math.round(vb[2] * 100) / 100));
        wurzel.attr('height', String(Math.round(vb[3] * 100) / 100));
    }
    wurzel.removeAttr('class').removeAttr('style');
    const aus = $.xml(wurzel);
    return aus.length <= SVG_MAX_ZEICHEN ? aus : null;
}

/* ------------------------------------------------------------------ */
/* Sprites (AUFTRAG-096)                                               */
/* ------------------------------------------------------------------ */

/**
 * Holt `<symbol id>` (bzw. `<g id>`/`<svg id>` …) aus einer Sprite-Datei,
 * dazu Definitionen, auf die das Symbol mit `url(#…)`/`href="#…"` verweist
 * (Verläufe, Masken). Liefert die Elemente als Text oder null.
 */
export function symbolAusSprite(sprite: string, id: string): string | null {
    if (!sprite || sprite.length > 1_200_000 || !id) return null;
    const anfang = sprite.search(/<svg[\s>]/i);
    if (anfang < 0) return null;
    const $ = load(svgSchreibweise(sprite.slice(anfang)), { xml: { xmlMode: true, decodeEntities: false } });
    const ziel = $('[id]').filter((_, el) => $(el).attr('id') === id).first();
    if (!ziel.length) return null;
    const teile = [$.xml(ziel)];
    const gesehen = new Set([id]);
    for (const m of teile[0].matchAll(/url\(\s*["']?#([\w:.-]+)["']?\s*\)|href=["']#([\w:.-]+)["']/g)) {
        const ref = m[1] ?? m[2];
        if (!ref || gesehen.has(ref) || gesehen.size > 12) continue;
        gesehen.add(ref);
        const def = $('[id]').filter((_, el) => $(el).attr('id') === ref).first();
        if (def.length && !def.parents().filter((_, p) => $(p).attr('id') === id).length) teile.push($.xml(def));
    }
    const text = teile.join('');
    return text.length <= SVG_MAX_ZEICHEN ? text : null;
}

/** Bettet Symbole aus Sprites in ein (rohes) SVG ein: `<defs>` direkt nach dem Wurzel-Tag. */
export function spriteEinbetten(svg: string, symbole: string[]): string {
    if (!symbole.length) return svg;
    return svg.replace(/(<svg\b[^>]*>)/i, `$1<defs>${symbole.join('')}</defs>`);
}

/**
 * Schreibt externe `<use href="datei.svg#id">` auf `#id` um und liefert die
 * Verweise (absolute URL + id). Interne `#id` bleiben unverändert.
 */
export function externeSpriteVerweise(svg: string, basis: string): { svg: string; verweise: Array<{ url: string; id: string }> } {
    const verweise: Array<{ url: string; id: string }> = [];
    const neu = svg.replace(/(<use\b[^>]*?\s(?:xlink:)?href\s*=\s*)(["'])([^"'#]+)#([\w:.-]+)\2/gi, (ganz, vor: string, q: string, datei: string, id: string) => {
        let url: string;
        try {
            url = new URL(datei.trim(), basis).toString();
        } catch {
            return ganz;
        }
        if (!/^https?:/i.test(url)) return ganz;
        if (!verweise.some((v) => v.url === url && v.id === id) && verweise.length < 4) verweise.push({ url, id });
        return `${vor}${q}#${id}${q}`;
    });
    return { svg: neu, verweise };
}

/* ------------------------------------------------------------------ */
/* Merkmale                                                            */
/* ------------------------------------------------------------------ */

const HILFSKLASSE_RE = /^(text|bg|border|from|to|via|fill|stroke|ring|shadow|decoration|outline|accent|caret|placeholder|divide|color|c)-/i;

/**
 * Logo-Merkmal in Klassen/Ids/alt/src: Token mit «logo» oder ein Token wie
 * brand, navbar-brand, site-branding, wordmark, signet. Farb-Hilfsklassen
 * (z. B. Tailwind «text-brand-600») zählen nicht.
 */
export function hatLogoWort(text: string): boolean {
    for (const roh of text.split(/[\s"'=,;]+/)) {
        const t = roh.replace(/^(?:[a-z0-9]+:)+(?!\/\/)/i, '');
        if (!t || HILFSKLASSE_RE.test(t)) continue;
        if (/logo/i.test(t) && !/^logos$/i.test(t)) return true;
        if (/(^|[-_/])(brand|branding|wordmark|signet|site-?title|marke)($|[-_](logo|link|img|image|wrap|wrapper|container|mark|name)$)/i.test(t)) return true;
    }
    return false;
}
const FREMD_RE =
    /partner|kunde|client|referenz|sponsor|zertifikat|certif|award|auszeichnung|siegel|payment|zahlungs|social|footer|newsletter|testimonial|badge|trust|slider|carousel|marquee|swiper|logos\b|logo-?(grid|wall|list|liste|band)/i;
const HELL_NAME_RE = /(^|[-_./ ])(neg|negativ|negative|white|weiss|wei%c3%9f|inverse|invers|inverted|light|hell|mono-?white|footer)([-_./ @]|$)/i;
const ICON_NAME_RE = /favicon|apple-touch|site-?icon|cropped-|icon[-_]?\d|android-chrome|mstile|-\d{2,3}x\d{2,3}\.(png|ico)/i;

export function istHelleVariante(url: string | null, merkmale = ''): boolean {
    return HELL_NAME_RE.test(`${url ?? ''} ${merkmale}`);
}

export function istFremdlogoKontext(merkmale: string): boolean {
    return FREMD_RE.test(merkmale);
}

/** Merkmalspunkte innerhalb einer Stufe (0–60). */
export function merkmalPunkte(opt: { homeLink: boolean; logoWort: boolean; hostTreffer: boolean; imKopf: boolean; erstesImKopf: boolean; iconName: boolean }): number {
    let p = 0;
    if (opt.homeLink) p += 25;
    if (opt.logoWort) p += 20;
    if (opt.hostTreffer) p += 15;
    if (opt.imKopf) p += 5;
    if (opt.erstesImKopf) p += 5;
    if (opt.iconName) p -= 20;
    return p;
}

export function iconName(url: string | null): boolean {
    return !!url && ICON_NAME_RE.test(url);
}

/** Kennwörter des Hosts (z. B. «garage-germann.ch» → garage, germann), für Treffer in Dateinamen/alt. */
export function hostWoerter(host: string): string[] {
    const label = host.toLowerCase().replace(/^www\./, '').split('.')[0];
    const teile = label.split(/[-_]/).filter((t) => t.length >= 4);
    return [...new Set([label.replace(/[-_]/g, ''), ...teile])].filter((t) => t.length >= 4);
}

export function hostTreffer(text: string, woerter: string[]): boolean {
    const t = text.toLowerCase().replace(/[-_\s%20]+/g, '');
    return woerter.some((w) => t.includes(w));
}

/* ------------------------------------------------------------------ */
/* srcset / Lazy-Attribute                                             */
/* ------------------------------------------------------------------ */

/** Wählt aus einem srcset die grösste Variante (w- bzw. x-Angabe). */
export function bestesAusSrcset(srcset: string | undefined | null): string | null {
    if (!srcset) return null;
    const eintraege: Array<{ u: string; w: number | null; x: number }> = [];
    for (const teil of srcset.split(/,\s+(?=\S)|,(?=https?:|\/)/)) {
        const [u, d] = teil.trim().split(/\s+/);
        if (!u || /^data:/i.test(u)) continue;
        const m = (d || '1x').match(/^([\d.]+)([wx])$/i);
        if (m && m[2].toLowerCase() === 'w') eintraege.push({ u, w: Number(m[1]), x: 0 });
        else eintraege.push({ u, w: null, x: m ? Number(m[1]) : 1 });
    }
    if (!eintraege.length) return null;
    const mitW = eintraege.filter((e) => e.w !== null) as Array<{ u: string; w: number }>;
    if (mitW.length) {
        // grösste Variante bis 1200 w (grössere bringen für ein Logo nichts und kosten Zeit)
        const passend = mitW.filter((e) => e.w <= 1200).sort((a, b) => b.w - a.w);
        return (passend[0] ?? mitW.sort((a, b) => a.w - b.w)[0]).u;
    }
    return eintraege.sort((a, b) => b.x - a.x)[0].u;
}

/* ------------------------------------------------------------------ */
/* CSS-Hintergründe                                                    */
/* ------------------------------------------------------------------ */

const CSS_LOGO_SELEKTOR_RE = /(?:^|[\s,>+~.#\[])(?:[\w-]*logo[\w-]*|[\w-]*brand[\w-]*|site-?title|site-?branding|navbar-brand|wordmark|signet)\b/i;

export function kaskadenSchluessel(selektor: string, media: string): string {
    return `${selektor.replace(/\s+/g, ' ').trim().toLowerCase()}|${media.replace(/\s+/g, ' ').trim().toLowerCase()}`;
}

export interface CssLogo {
    url: string;
    selektor: string;
    /** @media-/@supports-Kontext (für die Kaskade: gleicher Selektor + Kontext → spätere Regel gewinnt) */
    media: string;
    /** Bewertung: Logo-Selektor, Kopf/Navigation, Media-Kontext, spätere Regel gewinnt (Kaskade) */
    punkte: number;
}

/**
 * background-image/content-URLs auf Logo-Selektoren. Kleiner Parser mit
 * @media-Kontext: Regeln für schmale Bildschirme (max-width) und für
 * Sticky-/Mobile-Varianten zählen weniger, spätere Regeln mehr (Kaskade).
 */
export function logosAusCss(css: string, basis: string): CssLogo[] {
    const aus: CssLogo[] = [];
    const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
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
            // Block lesen (bis zur passenden Klammer)
            let tiefe = 1;
            let j = i + 1;
            while (j < text.length && tiefe > 0) {
                if (text[j] === '{') tiefe++;
                else if (text[j] === '}') tiefe--;
                j++;
            }
            const dekl = text.slice(i + 1, j - 1);
            i = j - 1;
            if (prelude.startsWith('@')) continue; // font-face, keyframes, page …
            const selektor = prelude;
            index++;
            if (!selektor || selektor.length > 300 || !CSS_LOGO_SELEKTOR_RE.test(selektor)) continue;
            if (FREMD_RE.test(selektor) || /:hover|:focus|::?after|::?before.*(?:icon|arrow)/i.test(selektor)) continue;
            const media = stapel.join(' ');
            if (/\bprint\b/i.test(media)) continue;
            for (const m of dekl.matchAll(/(?:background(?:-image)?|content)\s*:[^;]*?url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
                const roh = m[1].trim();
                if (/^data:/i.test(roh) && !/^data:image\/(svg\+xml|png|webp|gif|jpe?g)/i.test(roh)) continue;
                let u: string;
                try {
                    u = /^data:/i.test(roh) ? roh : new URL(roh, basis).toString();
                } catch {
                    continue;
                }
                let punkte = 20;
                if (/header|nav|top|banner/i.test(selektor)) punkte += 5;
                if (/sticky|scroll|fixed|mobile|small|shrink|footer|dark|invert/i.test(selektor)) punkte -= 8;
                if (/max-width/i.test(media)) punkte -= 6;
                else if (/min-width/i.test(media)) punkte += 1;
                punkte += Math.min(3, index / 1000);
                // Kaskade: eine spätere Regel mit gleichem Selektor und Kontext ersetzt die frühere
                const schluessel = kaskadenSchluessel(selektor, media);
                for (let k = aus.length - 1; k >= 0; k--) if (kaskadenSchluessel(aus[k].selektor, aus[k].media) === schluessel) aus.splice(k, 1);
                const da = aus.find((a) => a.url === u);
                if (da) da.punkte = Math.max(da.punkte, punkte);
                else aus.push({ url: u, selektor, media, punkte });
            }
            continue;
        }
        if (c === '}') {
            stapel.pop();
            puffer = '';
            continue;
        }
        if (c === ';' && !stapel.length && /^\s*@/.test(puffer)) {
            puffer = '';
            continue;
        }
        puffer += c;
    }
    return aus.sort((a, b) => b.punkte - a.punkte);
}

/* ------------------------------------------------------------------ */
/* Grössere Varianten bekannter Bild-CDNs                              */
/* ------------------------------------------------------------------ */

/**
 * Wix, Squarespace und Shopify liefern Logos oft in Anzeigegrösse (z. B.
 * 100 px). Für die Karte wird eine Variante mit rund 3-facher Kante geholt.
 */
export function groessereVariante(url: string): string | null {
    try {
        const u = new URL(url);
        if (/static\.wixstatic\.com$/i.test(u.hostname)) {
            const m = u.pathname.match(/\/(fill|fit)\/w_(\d+),h_(\d+)/);
            if (!m) return null;
            const w = Number(m[2]);
            const h = Number(m[3]);
            const f = Math.min(4, Math.max(1, 480 / Math.max(w, h)));
            if (f <= 1.2) return null;
            u.pathname = u.pathname.replace(m[0], `/${m[1]}/w_${Math.round(w * f)},h_${Math.round(h * f)}`);
            return u.toString();
        }
        if (/squarespace-cdn\.com$/i.test(u.hostname)) {
            const f = u.searchParams.get('format');
            const n = f ? Number(f.replace(/w$/, '')) : NaN;
            if (Number.isFinite(n) && n < 500) {
                u.searchParams.set('format', '750w');
                return u.toString();
            }
            return null;
        }
        if (/\/cdn\/shop\/|cdn\.shopify\.com/i.test(url)) {
            const m = u.pathname.match(/_(\d{2,3})x(\d{2,3})?(?=\.[a-z]+$)/i);
            if (m && Number(m[1]) < 300) {
                u.pathname = u.pathname.replace(m[0], '_600x');
                return u.toString();
            }
            const w = Number(u.searchParams.get('width'));
            if (w && w < 300) {
                u.searchParams.set('width', '600');
                return u.toString();
            }
        }
    } catch {
        return null;
    }
    return null;
}

/* ------------------------------------------------------------------ */
/* Bewertung                                                           */
/* ------------------------------------------------------------------ */

/** Übernimmt das Prüfergebnis und entscheidet über die Gültigkeit. */
export function bewerteMitAnalyse(k: LogoKandidat, a: BildAnalyse | null, bytes: number): LogoKandidat {
    if (!a) return { ...k, geprueft: true, gueltig: false, grund: 'kein Bild' };
    const aus: LogoKandidat = {
        ...k,
        geprueft: true,
        format: a.format,
        breite: a.breite !== null ? Math.round(a.breite) : null,
        hoehe: a.hoehe !== null ? Math.round(a.hoehe) : null,
        transparenz: a.transparenz,
        hell: a.hell,
        helligkeit: a.helligkeit !== null ? Math.round(a.helligkeit * 1000) / 1000 : null,
        farbe: a.farbe,
        foto: a.foto,
        bytes,
    };
    if (a.format === 'svg' && k.quelle === 'inline-svg') aus.ohneEigeneFarbe = !!a.ohneEigeneFarbe;
    const w = a.breite;
    const h = a.hoehe;
    // Leer-Prüfung (AUFTRAG-096): SVG ohne zeichnende Elemente bzw. Zeichenfläche 0 ist ungültig
    if (a.format === 'svg' && a.leer) return { ...aus, gueltig: false, grund: k.sprite?.length ? 'SVG leer (Sprite nicht aufgelöst)' : 'SVG leer (nichts Zeichnendes)' };
    if (a.foto) return { ...aus, gueltig: false, grund: 'Foto-Signatur' };
    if (w && h) {
        const verhaeltnis = w / h;
        // Regel 0,2–6; breite Wortmarken mit ausdrücklichem Logo-Merkmal (Stufe 1, Vektor oder
        // transparent) bis 15:1 — z. B. «GARAGE GERMANN AG» mit Claim 7,1:1, Kaffeemacher 13:1.
        const maxVerhaeltnis =
            k.stufe === 1 && k.logoWort && (a.format === 'svg' || a.transparenz === true) ? LOGO_BREITE_WORTMARKE : LOGO_SEITENVERHAELTNIS[1];
        if (verhaeltnis < LOGO_SEITENVERHAELTNIS[0] || verhaeltnis > maxVerhaeltnis) {
            return { ...aus, gueltig: false, grund: `Seitenverhältnis ${verhaeltnis.toFixed(2)}` };
        }
        if (a.format !== 'svg' && Math.max(w, h) < LOGO_MIN_KANTE) return { ...aus, gueltig: false, grund: `zu klein (${w}×${h})` };
        if (a.format === 'svg' && Math.max(w, h) < 16) return { ...aus, gueltig: false, grund: 'SVG-Symbol zu klein' };
    } else if (a.format !== 'svg') {
        // Rastergrafik ohne lesbare Grösse: nur aus sicherer Quelle zulassen
        if (k.stufe > 2) return { ...aus, gueltig: false, grund: 'Grösse unbekannt' };
    }
    // og:image nur logoartig: Seitenverhältnis 0,3–4 und keine Rastergrafik ohne Transparenz-Hinweis
    if (k.quelle === 'og:image') {
        const v = w && h ? w / h : 0;
        if (!v || v < 0.3 || v > 4) return { ...aus, gueltig: false, grund: 'og:image nicht logoartig (Format)' };
        if ((a.format === 'webp' || a.format === 'avif') && a.transparenz !== true) return { ...aus, gueltig: false, grund: 'og:image ohne Transparenz' };
        if (a.format === 'png' && a.transparenz !== true && (a.farbAnzahl ?? 0) > 600) return { ...aus, gueltig: false, grund: 'og:image Foto-Signatur' };
    }
    // Icons (Favicon, Touch-Icon): erste Bitmap ≥ 32 px genügt nicht für die Karte → ≥ 48 px (oben)
    return { ...aus, gueltig: true };
}

/** Qualitätsklasse laut Auftrag: SVG > PNG/WebP mit Transparenz > andere. */
export function qualitaet(k: LogoKandidat): number {
    if (k.format === 'svg') return 30;
    if ((k.format === 'png' || k.format === 'webp' || k.format === 'avif' || k.format === 'gif') && k.transparenz) return 20;
    if (k.format === 'png' || k.format === 'webp') return 8;
    return 0;
}

const STUFE_BASIS: Record<LogoKandidat['stufe'], number> = { 1: 300, 2: 200, 3: 100, 4: 0 };

const istHell = (k: LogoKandidat) => k.hell === true || (k.hell !== false && !!k.hellName);

/** Gesamtpunkte für die Rangfolge (nach der Prüfung). */
export function rangPunkte(k: LogoKandidat, dunkleAlternative: boolean): number {
    let p = STUFE_BASIS[k.stufe] + k.punkte + qualitaet(k);
    // Grösse: kleine Rastergrafiken leicht nach hinten
    if (k.format && k.format !== 'svg' && k.breite && k.hoehe) {
        const kante = Math.max(k.breite, k.hoehe);
        if (kante < 96) p -= 8;
        else if (kante >= 200) p += 4;
    }
    // Helle Variante (Negativlogo) nur, wenn es keine dunkle gleichwertige gibt
    if (istHell(k) && dunkleAlternative) p -= 12;
    return p - k.reihenfolge * 0.01;
}

/** Ordnet geprüfte Kandidaten: gültige nach Rang, dann ungeprüfte, dann ungültige. */
export function ordneLogos(kandidaten: LogoKandidat[]): LogoKandidat[] {
    const gueltig = kandidaten.filter((k) => k.gueltig === true);
    const dunkelJeStufe = new Set(gueltig.filter((k) => !istHell(k)).map((k) => k.stufe));
    const sortiert = [...gueltig].sort((a, b) => rangPunkte(b, dunkelJeStufe.has(b.stufe)) - rangPunkte(a, dunkelJeStufe.has(a.stufe)));
    const offen = vorrang(kandidaten.filter((k) => k.gueltig === undefined));
    const ungueltig = kandidaten.filter((k) => k.gueltig === false);
    return [...sortiert, ...offen, ...ungueltig];
}

/** Vor der Prüfung: welche Kandidaten lohnen den Abruf (beste zuerst). */
export function vorrang(kandidaten: LogoKandidat[]): LogoKandidat[] {
    return [...kandidaten].sort((a, b) => STUFE_BASIS[b.stufe] + b.punkte - b.reihenfolge * 0.01 - (STUFE_BASIS[a.stufe] + a.punkte - a.reihenfolge * 0.01));
}

export function quelleText(q: LogoQuelle): string {
    const t: Record<LogoQuelle, string> = {
        jsonld: 'JSON-LD logo',
        'header-img': '<img> im Kopf',
        'home-link-img': '<img> im Startseiten-Link',
        img: '<img> mit Logo-Merkmal',
        'inline-svg': 'Inline-SVG',
        css: 'CSS-Hintergrund',
        'apple-touch-icon': 'apple-touch-icon',
        icon: 'link rel=icon',
        'favicon.ico': '/favicon.ico',
        'og:image': 'og:image',
        'data-uri': 'data:-URI im <img>',
    };
    return t[q];
}

/* ------------------------------------------------------------------ */
/* Darstellung für Browser und Profil                                  */
/* ------------------------------------------------------------------ */

/** Logo, wie es die Karte erhält (Bild immer über den eigenen Proxy, relativer Pfad). */
export interface LogoFuerKarte {
    src: string;
    index: number;
    quelle: LogoQuelle;
    format: LogoKandidat['format'] | null;
    breite: number | null;
    hoehe: number | null;
    hell: boolean | null;
    transparenz: boolean | null;
    farbe: string | null;
    /** AUFTRAG-096: Hintergrund der Logo-Umgebung auf der Website (#RRGGBB) oder null */
    umgebung: string | null;
    /** AUFTRAG-096: Inline-SVG ohne eigene Farbe (die Website färbt es) */
    ohneEigeneFarbe: boolean;
    /** AUFTRAG-102: Original-Adresse des Logos (öffentlich, für Prüfung/Messung); null bei Inline-SVG/data:-URI */
    url: string | null;
}

/** Präfix aller Logos eines Scans (AUFTRAG-102): die Scan-Kennung steht im Pfad. */
export { logoPfadPraefix };

/**
 * Proxy-Pfad eines Logos (AUFTRAG-102): IMMER `/api/demo/bild/<scan>/<n>` — auch für
 * Logos mit Adresse. Vorher `?u=<adresse>` bzw. `?s=<scan>&i=<n>`; auf Netlify ignorierte
 * der CDN-Cache diese Query-Parameter, und gleichzeitige Scans bekamen dasselbe Bild.
 */
export function logoProxyPfad(_k: LogoKandidat, index: number, scanId: string): string {
    return `${logoPfadPraefix(scanId)}${index}`;
}

export function logoFuerKarte(k: LogoKandidat, index: number, scanId: string): LogoFuerKarte {
    return {
        src: logoProxyPfad(k, index, scanId),
        url: k.url && !k.inhalt ? k.url : null,
        index,
        quelle: k.quelle,
        format: k.format ?? null,
        breite: k.breite ?? null,
        hoehe: k.hoehe ?? null,
        hell: k.hell ?? (k.hellName ? true : null),
        transparenz: k.transparenz ?? null,
        farbe: k.farbe ?? null,
        umgebung: k.umgebung ?? null,
        ohneEigeneFarbe: !!k.ohneEigeneFarbe,
    };
}

/**
 * logo_url in den Antworten an den Browser (Scan, Profil): immer der
 * RELATIVE Pfad über den eigenen Proxy — nie der Host des Servers
 * (AUFTRAG-096: vorher stand dort z. B. «http://0.0.0.0:3000/…»).
 */
export function logoUrlFuerProfil(k: LogoKandidat | null, index: number, scanId: string): string | null {
    return k ? logoProxyPfad(k, index, scanId) : null;
}

/** Öffentlicher Host (kein localhost/0.0.0.0/privates Netz)? */
function istOeffentlicherUrsprung(origin: string): boolean {
    try {
        const u = new URL(origin);
        if (u.protocol !== 'https:') return false;
        const h = u.hostname.toLowerCase();
        if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h === '0.0.0.0' || h === '[::1]') return false;
        if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
        return /\./.test(h);
    } catch {
        return false;
    }
}

/**
 * logo_url im Auftrag an den Orchestrator (Schnittstelle A-091 verlangt
 * http/https): Original-URL des Logos; bei Inline-SVG/data:-URI der Proxy-Link
 * (`/api/demo/bild/<scan>/<n>`, AUFTRAG-102) mit dem öffentlichen Ursprung
 * (DEMO_OEFFENTLICHE_URL bzw. Anfrage-Ursprung, nur wenn öffentlich https) —
 * sonst null statt eines lokalen Hosts.
 */
export function logoUrlFuerAuftrag(k: LogoKandidat | null, index: number, scanId: string, origin: string): string | null {
    if (!k) return null;
    if (k.url && !k.inhalt) return k.url.length <= 500 ? k.url : null;
    const basis = (process.env.DEMO_OEFFENTLICHE_URL || '').replace(/\/+$/, '') || origin;
    return istOeffentlicherUrsprung(basis) ? `${basis}${logoProxyPfad(k, index, scanId)}` : null;
}

/** Gültige Logos (beste zuerst) mit ihrem Index in `logo_kandidaten`. */
export function gueltigeLogos(kandidaten: LogoKandidat[]): Array<{ k: LogoKandidat; index: number }> {
    return kandidaten.map((k, index) => ({ k, index })).filter(({ k }) => k.gueltig === true);
}
