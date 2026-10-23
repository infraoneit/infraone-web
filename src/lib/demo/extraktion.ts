/**
 * HTML-Extraktion einer einzelnen Seite (AUFTRAG-092, Teil A).
 *
 * cheerio/slim (htmlparser2, ohne parse5/undici) — robust gegenüber
 * fehlerhaftem HTML. Liefert Rohdaten; die Zusammenführung über mehrere
 * Seiten macht scanner.ts.
 */
import { load, type CheerioAPI } from 'cheerio/slim';
import type { Abschnitt, LogoKandidat } from './typen';
import { parseCssFarbe } from './farben';
import {
    bereinigeSvg,
    bestesAusSrcset,
    externeSpriteVerweise,
    hostTreffer,
    hostWoerter,
    iconName,
    istFremdlogoKontext,
    istHelleVariante,
    logosAusCss,
    hatLogoWort,
    type CssLogo,
    merkmalPunkte,
} from './logo';
import { svgGroesse } from './bildanalyse';
import type { Ahne } from './umgebung';

/** Minimale Struktur eines htmlparser2-Knotens (ohne Import von domhandler). */
interface DomKnoten {
    type: string;
    name?: string;
    data?: string;
    attribs?: Record<string, string>;
    children?: DomKnoten[];
}

export interface SeitenAnalyse {
    url: string;
    lang: string | null;
    titel: string | null;
    meta_description: string | null;
    og_site_name: string | null;
    og_title: string | null;
    og_image: string | null;
    theme_color: string | null;
    generator: string | null;
    jsonld: Record<string, unknown>[];
    logo_kandidaten: LogoKandidat[];
    /** Logo-URLs aus <style>-Blöcken (CSS-Hintergrund auf Logo-Selektoren) */
    css_logo: CssLogo[];
    tel_links: string[];
    mailto: string[];
    ueberschriften: string[];
    navigation: string[];
    links: Array<{ url: string; text: string }>;
    stylesheets: string[];
    inline_css: string;
    stil_farben: string[];
    /** AUFTRAG-096: link rel=manifest (theme_color) */
    manifest: string | null;
    zeilen: string[];
    abschnitte: Abschnitt[];
}

const BLOCK = new Set([
    'address', 'article', 'aside', 'blockquote', 'br', 'dd', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
    'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol',
    'p', 'pre', 'section', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'ul', 'label', 'caption', 'summary',
    'details',
]);

/** Inline-Elemente, an deren Grenzen ein Leerzeichen stehen muss (sonst kleben Nummer und E-Mail zusammen). */
const INLINE_GRENZE = new Set(['a', 'button', 'img', 'input', 'small', 'time', 'i', 'em', 'strong', 'b', 'abbr', 'sup', 'sub']);

const ENTFERNEN = 'script, style, noscript, template, svg, iframe, canvas, video, audio, object, embed, select, map';

const COOKIE_RE =
    /cookie|consent|gdpr|cmplz|borlabs|onetrust|usercentrics|cookiebot|klaro|tarteaucitron|cc-window|cc-banner|privacy-banner/i;

/** Zeilen, die typischerweise aus Cookie-Bannern stammen. */
export const COOKIE_ZEILE_RE =
    /\bcookies?\b|consent|alle akzeptieren|akzeptieren und schlie|alle ablehnen|nur notwendige|accept all|reject all|tracking-technolog|datenschutzeinstellungen|privacy settings/i;

export function bereinigeText(s: string): string {
    return s
        .replace(/[   ]/g, ' ')
        .replace(/[​-‍﻿]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function absolut(href: string | undefined | null, basis: string): string | null {
    if (!href) return null;
    const h = href.trim();
    if (!h || h.startsWith('data:') || h.startsWith('javascript:') || h.startsWith('#')) return null;
    try {
        const u = new URL(h, basis);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
        u.hash = '';
        return u.toString();
    } catch {
        return null;
    }
}

/** Text eines Knotens mit Zeilenumbrüchen an Blockgrenzen. */
function sammleText(knoten: DomKnoten, aus: string[]): void {
    if (knoten.type === 'text') {
        aus.push(knoten.data ?? '');
        return;
    }
    if (knoten.type !== 'tag' && knoten.type !== 'root') {
        if (knoten.children) for (const k of knoten.children) sammleText(k, aus);
        return;
    }
    const name = knoten.name ?? '';
    if (name === 'br') {
        aus.push('\n');
        return;
    }
    const block = BLOCK.has(name);
    const grenze = INLINE_GRENZE.has(name) || name === 'td' || name === 'th';
    if (block) aus.push('\n');
    if (grenze) aus.push(' ');
    if (knoten.children) for (const k of knoten.children) sammleText(k, aus);
    if (grenze) aus.push(' ');
    if (block) aus.push('\n');
}

export function textZeilen(knoten: DomKnoten | DomKnoten[]): string[] {
    const aus: string[] = [];
    for (const k of Array.isArray(knoten) ? knoten : [knoten]) sammleText(k, aus);
    return aus
        .join('')
        .split('\n')
        .map(bereinigeText)
        .filter((z) => z.length >= 2);
}

/** Lazy-Attribute zuerst (src ist dann oft nur ein Platzhalter), dann src, srcset, <picture>. */
function bildQuelle($: CheerioAPI, el: DomKnoten, basis: string): { url: string | null; dataUri: string | null } {
    const a = el.attribs ?? {};
    const kandidaten: Array<string | null | undefined> = [
        a['data-src'],
        a['data-lazy-src'],
        a['data-orig-src'],
        a['data-original'],
        a['data-lazy'],
        a['data-pagespeed-lazy-src'],
        bestesAusSrcset(a['data-srcset'] || a['data-lazy-srcset']),
        a.src,
        bestesAusSrcset(a.srcset),
    ];
    // <picture><source srcset type="image/svg+xml|webp"> …
    const picture = $(el as never).parent('picture');
    if (picture.length) {
        picture.children('source').each((_, s) => {
            const sa = (s as unknown as DomKnoten).attribs ?? {};
            const srcset = sa.srcset || sa['data-srcset'];
            if (/svg/i.test(sa.type || '') || /\.svg(\?|$)/i.test(srcset || '')) kandidaten.unshift(bestesAusSrcset(srcset));
            else kandidaten.push(bestesAusSrcset(srcset));
        });
    }
    let dataUri: string | null = null;
    for (const k of kandidaten) {
        if (!k) continue;
        const t = k.trim();
        if (/^data:/i.test(t)) {
            // Platzhalter (1×1-GIF, leeres SVG) überspringen; echte Logos als data:-URI merken
            if (/^data:image\/(svg\+xml|png|webp|gif|jpe?g)[;,]/i.test(t) && t.length > 400 && !dataUri) dataUri = t;
            continue;
        }
        const u = absolut(t, basis);
        if (u) return { url: u, dataUri: null };
    }
    return { url: null, dataUri };
}

function jsonLdKnoten(roh: unknown, aus: Record<string, unknown>[], tiefe = 0): void {
    if (tiefe > 4 || !roh) return;
    if (Array.isArray(roh)) {
        for (const r of roh) jsonLdKnoten(r, aus, tiefe + 1);
        return;
    }
    if (typeof roh !== 'object') return;
    const o = roh as Record<string, unknown>;
    if (Array.isArray(o['@graph'])) jsonLdKnoten(o['@graph'], aus, tiefe + 1);
    if (o['@type']) aus.push(o);
    for (const feld of ['publisher', 'provider', 'author', 'mainEntity', 'about', 'brand', 'parentOrganization']) {
        const v = o[feld];
        if (v && typeof v === 'object') jsonLdKnoten(v, aus, tiefe + 1);
    }
}

function parseJsonLd(text: string): unknown {
    const t = text
        .replace(/^\s*<!--/, '')
        .replace(/-->\s*$/, '')
        .replace(/^\s*\/\/<!\[CDATA\[/, '')
        .replace(/\/\/\]\]>\s*$/, '')
        .trim();
    try {
        return JSON.parse(t);
    } catch {
        try {
            // häufiger Fehler: Steuerzeichen/Zeilenumbrüche in Strings, nachgestellte Kommas
            return JSON.parse(t.replace(/[\u0000-\u001f]+/g, ' ').replace(/,\s*([}\]])/g, '$1'));
        } catch {
            return null;
        }
    }
}

function istHomeLink(href: string | undefined, basis: string): boolean {
    if (!href) return false;
    const h = href.trim();
    if (h === '/' || h === './') return true;
    if (!h || h.startsWith('#')) return false;
    try {
        const u = new URL(h, basis);
        const b = new URL(basis);
        const host = (x: string) => x.replace(/^www\./, '');
        return host(u.hostname) === host(b.hostname) && (u.pathname === '/' || /^\/(de|de-ch|ch-de|home|startseite|index\.(html?|php))?\/?$/i.test(u.pathname));
    } catch {
        return false;
    }
}

function iconGroesse(sizes: string | undefined): number {
    const m = (sizes || '').match(/(\d+)x(\d+)/);
    return m ? Number(m[1]) : 0;
}

// Kopfbereich: bewusst ohne [class*="header"] allein — das trifft auch Hero-Module mit Fotos (z. B. Divi «fullwidth_header»)
const KOPF_SELEKTOR =
    'header, [role="banner"], #header, #masthead, #main-header, #SITE_HEADER, .site-header, .header, .main-header, [class*="site-header"], [class*="main-header"], [class*="header__"], [class*="header-wrap"], [class*="header-inner"], [class*="header-container"], [class*="header-top"], [class*="header-main"], [id*="header"], nav, [role="navigation"], [class*="navbar"], [class*="topbar"], [class*="top-bar"], [class*="menu-bar"]';
const SOZIAL_RE = /facebook|instagram|linkedin|twitter|x\.com|youtube|tiktok|xing|pinterest|whatsapp|mailto:|tel:/i;

/** Attribute, die für die Umgebungs-Bestimmung nichts bringen (oder zu lang sind). */
const AHNEN_OHNE_ATTR = /^(class|id|style|src|srcset|href|alt|title|d|data-src|data-srcset|data-lazy-src|sizes|width|height|loading|decoding|viewbox|xmlns.*|aria-label|content)$/i;

/**
 * Vorfahren-Kette eines Elements (Element selbst → html) für die Bestimmung
 * der Hintergrundfarbe seiner Umgebung (AUFTRAG-096, umgebung.ts).
 */
export function ahnenVon($: CheerioAPI, el: unknown): Ahne[] {
    const kette: Ahne[] = [];
    for (const n of [el, ...$(el as never).parents().toArray()].slice(0, 40)) {
        const k = n as unknown as DomKnoten;
        if (k.type !== 'tag' && k.type !== 'script' && k.type !== 'style') continue;
        const a = k.attribs ?? {};
        const attr: Record<string, string> = {};
        let anzahl = 0;
        for (const [name, wert] of Object.entries(a)) {
            if (AHNEN_OHNE_ATTR.test(name) || wert.length > 80 || anzahl >= 8) continue;
            attr[name.toLowerCase()] = wert;
            anzahl++;
        }
        kette.push({
            tag: (k.name ?? '').toLowerCase(),
            ...(a.id ? { id: a.id } : {}),
            ...(a.class ? { klassen: a.class.split(/\s+/).filter(Boolean).slice(0, 40) } : {}),
            ...(a.style ? { stil: a.style.slice(0, 600) } : {}),
            ...(anzahl ? { attr } : {}),
        });
    }
    return kette;
}

/** Vorfahren-Kette des ersten Elements, auf das ein CSS-Selektor passt (CSS-Hintergrund-Logos). */
export function ahnenFuerSelektor(html: string, selektor: string): Ahne[] | null {
    try {
        const $ = load(html);
        const el = $(selektor.split(',')[0].replace(/::?(before|after)\b/gi, '').trim()).first()[0];
        return el ? ahnenVon($, el) : null;
    } catch {
        return null;
    }
}

/** Merkmalstext eines Elements und seiner Vorfahren (Klassen/Ids/Labels). */
function merkmalText($: CheerioAPI, el: unknown, ebenen: number): string {
    const knoten = $(el as never);
    const eigen = ['class', 'id', 'alt', 'title', 'aria-label', 'data-testid', 'role', 'src', 'data-src']
        .map((a) => knoten.attr(a) || '')
        .join(' ');
    const vorfahren = knoten
        .parents()
        .slice(0, ebenen)
        .map((_, p) => `${$(p).attr('class') || ''} ${$(p).attr('id') || ''} ${$(p).attr('aria-label') || ''}`)
        .get()
        .join(' ');
    return `${eigen} ${vorfahren}`;
}

/** Sammelt Logo-Kandidaten der Startseite (AUFTRAG-095). */
function sammleLogos(
    $: CheerioAPI,
    html: string,
    basis: string,
    jsonld: Record<string, unknown>[],
): { kandidaten: LogoKandidat[]; css_logo: CssLogo[] } {
    const kandidaten: LogoKandidat[] = [];
    let host = '';
    try {
        host = new URL(basis).hostname;
    } catch {
        /* egal */
    }
    const woerter = hostWoerter(host);
    let reihenfolge = 0;
    const dazu = (k: Omit<LogoKandidat, 'reihenfolge'>) => {
        const schluessel = k.url ?? k.inhalt?.slice(0, 300);
        if (!schluessel) return;
        const da = kandidaten.find((x) => (x.url ?? x.inhalt?.slice(0, 300)) === schluessel);
        if (da) {
            // gleiche Datei aus besserer Quelle: Stufe/Punkte übernehmen
            if (k.stufe < da.stufe || (k.stufe === da.stufe && k.punkte > da.punkte)) Object.assign(da, { ...k, reihenfolge: da.reihenfolge });
            return;
        }
        kandidaten.push({ ...k, reihenfolge: reihenfolge++ });
    };

    // JSON-LD logo (Organisation/Betrieb)
    for (const k of jsonld) {
        const typ = String(k['@type'] ?? '');
        if (/website|webpage|breadcrumb|person|product|offer|article|posting/i.test(typ)) continue;
        const logo = k.logo as unknown;
        let roh: string | undefined;
        if (typeof logo === 'string') roh = logo;
        else if (Array.isArray(logo) && typeof logo[0] === 'string') roh = logo[0];
        else if (logo && typeof logo === 'object') {
            const lo = (Array.isArray(logo) ? logo[0] : logo) as Record<string, unknown>;
            roh = (lo?.contentUrl || lo?.url || lo?.['@id']) as string | undefined;
        }
        const u = typeof roh === 'string' ? absolut(roh, basis) : null;
        if (u && /\.(png|jpe?g|gif|webp|avif|svg|ico)(\?|$)|\/media\/|\/image|\/uploads\//i.test(u)) {
            dazu({ url: u, quelle: 'jsonld', stufe: 1, punkte: 10 + (hostTreffer(u, woerter) ? 5 : 0) - (iconName(u) ? 25 : 0), hellName: istHelleVariante(u), logoWort: true });
        }
    }

    // <img>, Inline-<svg> und style-Hintergründe in Dokument-Reihenfolge
    let erstesImKopf = true;
    let svgAnzahl = 0;
    $('img, svg, [style*="url("]').each((_, el) => {
        const knoten = el as unknown as DomKnoten & { startIndex?: number; endIndex?: number };
        const name = knoten.name;
        const ctx = $(el as never);
        if (name === 'svg' && ctx.parents('svg').length) return;
        const merkmale = merkmalText($, el, 4);
        const fremd = istFremdlogoKontext(merkmalText($, el, 6).replace(/\S*header\S*/gi, ''));
        const link = ctx.closest('a');
        const href = link.attr('href');
        const homeLink = istHomeLink(href, basis);
        if (!homeLink && href && SOZIAL_RE.test(href)) return;
        const imKopf = ctx.closest(KOPF_SELEKTOR).length > 0 && !ctx.closest('footer').length;
        const logoWort = hatLogoWort(merkmale);
        if (fremd && !homeLink) return;
        if (ctx.closest('footer').length && !logoWort) return;

        if (name === 'img') {
            const { url, dataUri } = bildQuelle($, knoten, basis);
            if (!url && !dataUri) return;
            // Firmenname im alt/title ist ein starkes Merkmal; im Dateinamen (z. B. «henrici-web-20.jpg») nur ein schwaches
            const altTreffer = hostTreffer(`${knoten.attribs?.alt ?? ''} ${knoten.attribs?.title ?? ''}`, woerter);
            const treffer = altTreffer || hostTreffer(url ?? '', woerter);
            const stufe = (imKopf && (logoWort || homeLink || altTreffer)) || (homeLink && logoWort) ? 1 : homeLink || logoWort || (imKopf && erstesImKopf) ? 2 : 0;
            if (!stufe) return;
            if (url && /\.svg(\?|$)/i.test(url) && /arrow|chevron|close|menu|burger|search|lupe|icon-|flag/i.test(url) && !logoWort) return;
            const punkte = merkmalPunkte({ homeLink, logoWort, hostTreffer: treffer, imKopf, erstesImKopf: imKopf && erstesImKopf, iconName: iconName(url) });
            if (imKopf) erstesImKopf = false;
            const quelle: LogoKandidat['quelle'] = dataUri ? 'data-uri' : homeLink ? 'home-link-img' : imKopf ? 'header-img' : 'img';
            dazu({ url, quelle, stufe: stufe as 1 | 2, punkte, inhalt: dataUri ?? undefined, hellName: istHelleVariante(url, merkmale), logoWort, ahnen: ahnenVon($, el) });
            return;
        }

        if (name === 'svg') {
            if (svgAnzahl >= 4) return;
            if (ctx.closest('button').length && !logoWort) return;
            if (!(imKopf || homeLink || logoWort)) return;
            // Symbole (Menü, Lupe, Pfeile) aussortieren: wenig Pfaddaten, quadratisch klein
            const pfad = ctx
                .find('path')
                .map((__, p) => $(p).attr('d') || '')
                .get()
                .join('').length;
            const formen = ctx.find('path, polygon, rect, circle, ellipse, text, use, image').length;
            const roh = knoten.startIndex !== undefined && knoten.endIndex !== undefined ? html.slice(knoten.startIndex, knoten.endIndex + 1) : '';
            if (!roh || formen === 0) return;
            const g = svgGroesse(roh.replace(/viewbox=/i, 'viewBox='));
            const quadratKlein = !!g && Math.max(g.w, g.h) <= 32 && g.w / g.h < 1.6;
            if (!logoWort && pfad < 180 && !ctx.find('text, image, use').length) return;
            // kleine quadratische Symbole (Menü, Telefon, Lupe …) sind keine Logos, ausser sie sind aufwendig gezeichnet
            if (quadratKlein && pfad < 1500 && !ctx.find('text, image').length) return;
            // <use href="#id"> auf ein Sprite ausserhalb → Symbol mitnehmen
            let quelleSvg = roh;
            const refs = [...roh.matchAll(/<use[^>]+(?:xlink:)?href=["']#([\w:-]+)["']/gi)].map((m) => m[1]);
            const defs: string[] = [];
            for (const id of refs.slice(0, 4)) {
                if (new RegExp(`id=["']${id}["']`).test(roh)) continue;
                const ziel = $(`[id="${id}"]`)[0] as unknown as { startIndex?: number; endIndex?: number } | undefined;
                if (ziel?.startIndex !== undefined && ziel.endIndex !== undefined) defs.push(html.slice(ziel.startIndex, ziel.endIndex + 1));
            }
            if (defs.length) quelleSvg = roh.replace(/(<svg\b[^>]*>)/i, `$1<defs>${defs.join('')}</defs>`);
            // AUFTRAG-096: <use href="datei.svg#id"> → auf #id umschreiben, die Sprite-Datei lädt der Scanner nach
            const extern = externeSpriteVerweise(quelleSvg, basis);
            const inhalt = bereinigeSvg(extern.svg);
            if (!inhalt) return;
            const titel = `${ctx.find('title').first().text()} ${ctx.attr('aria-label') || ''}`;
            const treffer = hostTreffer(titel, woerter);
            const stufe = (logoWort || homeLink) && (imKopf || logoWort) ? 1 : 2;
            const punkte = merkmalPunkte({ homeLink, logoWort, hostTreffer: treffer, imKopf, erstesImKopf: imKopf && erstesImKopf, iconName: false });
            if (imKopf) erstesImKopf = false;
            svgAnzahl++;
            dazu({ url: null, quelle: 'inline-svg', stufe: stufe as 1 | 2, punkte, inhalt, hellName: istHelleVariante(null, merkmale), logoWort, ahnen: ahnenVon($, el), ...(extern.verweise.length ? { sprite: extern.verweise } : {}) });
            return;
        }

        // style="background-image:url(…)" auf Logo-Elementen
        if (!(logoWort && (imKopf || homeLink))) return;
        const stil = knoten.attribs?.style || '';
        const m = stil.match(/background(?:-image)?\s*:[^;]*url\(\s*["']?([^"')]+)["']?\s*\)/i);
        const u = m ? absolut(m[1], basis) : null;
        if (!u) return;
        dazu({
            url: u,
            quelle: 'css',
            stufe: 1,
            punkte: merkmalPunkte({ homeLink, logoWort, hostTreffer: hostTreffer(u, woerter), imKopf, erstesImKopf: false, iconName: iconName(u) }),
            hellName: istHelleVariante(u, merkmale),
            logoWort: true,
            ahnen: ahnenVon($, el),
        });
    });

    // Icons: apple-touch-icon, link rel=icon (sizes ≥ 64 und SVG bevorzugt)
    $('link[rel~="apple-touch-icon"], link[rel~="apple-touch-icon-precomposed"]').each((_, el) => {
        const u = absolut($(el).attr('href'), basis);
        if (u) dazu({ url: u, quelle: 'apple-touch-icon', stufe: 3, punkte: 10 + Math.min(10, iconGroesse($(el).attr('sizes')) / 18) });
    });
    $('link[rel~="icon"], link[rel="shortcut icon"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const typ = ($(el).attr('type') || '').toLowerCase();
        const groesse = iconGroesse($(el).attr('sizes'));
        const svg = /svg/.test(typ) || /\.svg(\?|$)/i.test(href);
        const punkte = svg ? 15 : groesse >= 64 ? 8 + Math.min(10, groesse / 32) : /\.ico(\?|$)/i.test(href) ? 2 : 0;
        const u = absolut(href, basis);
        if (u) dazu({ url: u, quelle: 'icon', stufe: 3, punkte });
    });
    const og = $('meta[property="og:image"]').first().attr('content') || $('meta[name="og:image"]').first().attr('content');
    const ogUrl = absolut(og, basis);
    if (ogUrl) dazu({ url: ogUrl, quelle: 'og:image', stufe: 4, punkte: hostTreffer(ogUrl, woerter) || hatLogoWort(ogUrl) ? 10 : 0 });

    // CSS aus <style>-Blöcken der Seite (Logo-Selektoren)
    const inlineCss = $('style')
        .map((_, el) => $(el).text())
        .get()
        .join('\n');
    return { kandidaten, css_logo: logosAusCss(inlineCss, basis) };
}

/** Analysiert eine HTML-Seite. */
export function analysiereSeite(html: string, url: string, mitLogo: boolean): SeitenAnalyse {
    // Positionen im Quelltext: Inline-SVG wird unverändert (Gross-/Kleinschreibung) übernommen
    const $ = load(html, { baseURI: url, withStartIndices: true, withEndIndices: true } as never);
    const basisHref = $('base[href]').attr('href');
    const basis = absolut(basisHref, url) ?? url;

    const meta = (sel: string) => {
        const v = $(sel).first().attr('content');
        return v ? bereinigeText(v) || null : null;
    };

    const titel = bereinigeText($('title').first().text()) || null;
    const lang = ($('html').attr('lang') || '').trim().toLowerCase() || null;

    // JSON-LD
    const jsonld: Record<string, unknown>[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        const roh = parseJsonLd($(el).text());
        if (roh) jsonLdKnoten(roh, jsonld);
    });

    // Stylesheets + Inline-CSS (vor dem Entfernen von style)
    const stylesheets: string[] = [];
    $('link[rel~="stylesheet"][href], link[rel="preload"][as="style"][href]').each((_, el) => {
        const u = absolut($(el).attr('href'), basis);
        if (u && !stylesheets.includes(u)) stylesheets.push(u);
    });
    const inline_css = $('style')
        .map((_, el) => $(el).text())
        .get()
        .join('\n')
        .slice(0, 400_000);

    // Farben aus style-Attributen von Buttons/Links
    const stil_farben: string[] = [];
    $('a[style], button[style], [class*="btn"][style], [class*="button"][style]').each((_, el) => {
        const st = $(el).attr('style') || '';
        for (const m of st.matchAll(/(?:^|;)\s*(?:background(?:-color)?|color|border-color)\s*:\s*([^;]+)/gi)) {
            const f = parseCssFarbe(m[1]);
            if (f) stil_farben.push(f);
        }
    });

    // Logo-Kandidaten (AUFTRAG-095): nur auf der Startseite
    const logos = mitLogo ? sammleLogos($, html, basis, jsonld) : { kandidaten: [], css_logo: [] };

    // Links (vor dem Entfernen der Navigation)
    const links: Array<{ url: string; text: string }> = [];
    $('a[href]').each((_, el) => {
        const u = absolut($(el).attr('href'), basis);
        if (!u) return;
        const text = bereinigeText($(el).text()) || bereinigeText($(el).attr('title') || '') || '';
        links.push({ url: u, text: text.slice(0, 80) });
    });

    const tel_links = $('a[href^="tel:"], a[href^="TEL:"]')
        .map((_, el) => decodeURIComponent(($(el).attr('href') || '').replace(/^tel:/i, '')).trim())
        .get()
        .filter(Boolean);

    const mailto: string[] = [];
    $('a[href^="mailto:"], a[href^="MAILTO:"]').each((_, el) => {
        try {
            const m = decodeURIComponent(($(el).attr('href') || '').replace(/^mailto:/i, '').split('?')[0]).trim();
            if (m) mailto.push(m.toLowerCase());
        } catch {
            /* defekter Link */
        }
    });
    // Cloudflare-E-Mail-Schutz entschlüsseln
    $('[data-cfemail], a[href*="/cdn-cgi/l/email-protection#"]').each((_, el) => {
        const kodiert = $(el).attr('data-cfemail') || ($(el).attr('href') || '').split('#')[1] || '';
        if (!/^[0-9a-f]{4,}$/i.test(kodiert)) return;
        const schluessel = parseInt(kodiert.slice(0, 2), 16);
        let mail = '';
        for (let i = 2; i < kodiert.length; i += 2) mail += String.fromCharCode(parseInt(kodiert.slice(i, i + 2), 16) ^ schluessel);
        if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) mailto.push(mail.toLowerCase());
    });

    const navigation: string[] = [];
    $('nav a, [role="navigation"] a, header a').each((_, el) => {
        const t = bereinigeText($(el).text());
        if (t.length >= 2 && t.length <= 40 && !navigation.includes(t)) navigation.push(t);
    });

    // Störendes entfernen: Skripte, Cookie-Banner, Navigation
    $(ENTFERNEN).remove();
    $('[id], [class]').each((_, el) => {
        const e = el as unknown as DomKnoten;
        if (e.name === 'html' || e.name === 'body' || e.name === 'main') return;
        const merkmal = `${e.attribs?.id || ''} ${e.attribs?.class || ''}`;
        if (COOKIE_RE.test(merkmal) && $(el).text().length < 4000) $(el).remove();
    });
    $('nav, [role="navigation"], [aria-hidden="true"]').remove();

    const ueberschriften: string[] = [];
    $('h1, h2, h3').each((_, el) => {
        const t = bereinigeText($(el).text());
        if (t.length >= 2 && t.length <= 160 && !ueberschriften.includes(t)) ueberschriften.push(t);
    });

    // Abschnitte: Überschrift + folgender Text (für Wissen)
    const abschnitte: Abschnitt[] = [];
    $('h2, h3, h4').each((_, el) => {
        const titelA = bereinigeText($(el).text());
        if (titelA.length < 3 || titelA.length > 120) return;
        const teile: string[] = [];
        let knoten = $(el);
        for (let tiefe = 0; tiefe < 3; tiefe++) {
            let stop = false;
            knoten.nextAll().each((__, s) => {
                const sk = $(s);
                if (sk.is('h1, h2, h3, h4') || sk.find('h1, h2, h3, h4').length) {
                    stop = true;
                    return false;
                }
                teile.push(textZeilen(s as unknown as DomKnoten).join(' '));
                if (teile.join(' ').length > 700) return false;
            });
            if (teile.join(' ').trim().length >= 40 || stop) break;
            knoten = knoten.parent();
            if (!knoten.length || knoten.is('body, main')) break;
        }
        const text = bereinigeText(teile.join(' ')).slice(0, 700);
        if (text.length >= 30 && !COOKIE_ZEILE_RE.test(text.slice(0, 200))) abschnitte.push({ titel: titelA, text });
    });

    const body = $('body')[0] as unknown as DomKnoten | undefined;
    const zeilen = body ? textZeilen(body) : textZeilen($.root()[0] as unknown as DomKnoten);

    return {
        url,
        lang,
        titel,
        meta_description: meta('meta[name="description"]') ?? meta('meta[property="og:description"]'),
        og_site_name: meta('meta[property="og:site_name"]'),
        og_title: meta('meta[property="og:title"]'),
        og_image: absolut(meta('meta[property="og:image"]'), basis),
        theme_color: meta('meta[name="theme-color"]'),
        generator: meta('meta[name="generator"]'),
        jsonld,
        logo_kandidaten: logos.kandidaten,
        css_logo: logos.css_logo,
        tel_links,
        mailto,
        ueberschriften,
        navigation,
        links,
        stylesheets,
        inline_css,
        stil_farben,
        manifest: absolut($('link[rel~="manifest"]').first().attr('href'), basis),
        zeilen,
        abschnitte,
    };
}
