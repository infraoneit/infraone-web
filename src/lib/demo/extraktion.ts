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
    tel_links: string[];
    mailto: string[];
    ueberschriften: string[];
    navigation: string[];
    links: Array<{ url: string; text: string }>;
    stylesheets: string[];
    inline_css: string;
    stil_farben: string[];
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

function bildQuelle($: CheerioAPI, el: DomKnoten, basis: string): string | null {
    const a = el.attribs ?? {};
    const kandidaten = [
        a['data-src'],
        a['data-lazy-src'],
        a['data-orig-src'],
        a['data-original'],
        a['data-lazy'],
        a.src,
        (a.srcset || a['data-srcset'] || a['data-lazy-srcset'] || '').split(',')[0]?.trim().split(/\s+/)[0],
    ];
    for (const k of kandidaten) {
        const u = absolut(k, basis);
        if (u) return u;
    }
    void $;
    return null;
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

const LOGO_RE = /logo|brand|marke|wordmark|signet/i;

function istHomeLink(href: string | undefined, basis: string): boolean {
    if (!href) return false;
    try {
        const u = new URL(href, basis);
        const b = new URL(basis);
        const host = (h: string) => h.replace(/^www\./, '');
        return host(u.hostname) === host(b.hostname) && (u.pathname === '/' || /^\/(de|de-ch|index\.(html?|php))?\/?$/i.test(u.pathname));
    } catch {
        return false;
    }
}

function iconGroesse(sizes: string | undefined): number {
    const m = (sizes || '').match(/(\d+)x(\d+)/);
    return m ? Number(m[1]) : 0;
}

/** Analysiert eine HTML-Seite. */
export function analysiereSeite(html: string, url: string, mitLogo: boolean): SeitenAnalyse {
    const $ = load(html, { baseURI: url });
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

    // Logo-Kandidaten (Reihenfolge laut Auftrag)
    const logo_kandidaten: LogoKandidat[] = [];
    const logoDazu = (u: string | null, quelle: LogoKandidat['quelle']) => {
        if (u && !logo_kandidaten.some((k) => k.url === u)) logo_kandidaten.push({ url: u, quelle });
    };
    if (mitLogo) {
        for (const k of jsonld) {
            const logo = k.logo as unknown;
            if (typeof logo === 'string') logoDazu(absolut(logo, basis), 'jsonld');
            else if (logo && typeof logo === 'object') {
                const lo = logo as Record<string, unknown>;
                const u = (lo.url || lo.contentUrl || lo['@id']) as string | undefined;
                if (typeof u === 'string') logoDazu(absolut(u, basis), 'jsonld');
            }
        }
        const kopf = $('header, [role="banner"], [class*="header"], [id*="header"]');
        kopf.find('img').each((_, el) => {
            const e = el as unknown as DomKnoten;
            const a = e.attribs ?? {};
            const vorfahren = $(el)
                .parents()
                .slice(0, 3)
                .map((__, p) => `${$(p).attr('class') || ''} ${$(p).attr('id') || ''}`)
                .get()
                .join(' ');
            const merkmale = `${a.src || ''} ${a['data-src'] || ''} ${a['data-orig-src'] || ''} ${a.alt || ''} ${a.title || ''} ${a.class || ''} ${a.id || ''} ${vorfahren}`;
            if (LOGO_RE.test(merkmale)) logoDazu(bildQuelle($, e, basis), 'header-img');
        });
        // Bild im Link auf die Startseite (typisch für Wix/Jimdo)
        $('a[href]').each((_, el) => {
            if (logo_kandidaten.length >= 6) return false;
            if (!istHomeLink($(el).attr('href'), basis)) return;
            const img = $(el).find('img').first();
            if (img.length) logoDazu(bildQuelle($, img[0] as unknown as DomKnoten, basis), 'home-link-img');
        });
        $('img').each((_, el) => {
            const e = el as unknown as DomKnoten;
            const a = e.attribs ?? {};
            const merkmale = `${a.src || ''} ${a['data-src'] || ''} ${a['data-orig-src'] || ''} ${a.alt || ''} ${a.title || ''} ${a.class || ''} ${a.id || ''}`;
            if (LOGO_RE.test(merkmale)) logoDazu(bildQuelle($, e, basis), 'img');
            if (logo_kandidaten.length >= 8) return false;
        });
        const touch = $('link[rel~="apple-touch-icon"], link[rel~="apple-touch-icon-precomposed"]')
            .map((_, el) => ({ u: absolut($(el).attr('href'), basis), g: iconGroesse($(el).attr('sizes')) }))
            .get()
            .sort((a, b) => b.g - a.g);
        for (const t of touch) logoDazu(t.u, 'apple-touch-icon');
        logoDazu(absolut(meta('meta[property="og:image"]') ?? meta('meta[name="og:image"]'), basis), 'og:image');
        const icons = $('link[rel~="icon"], link[rel="shortcut icon"]')
            .map((_, el) => {
                const href = $(el).attr('href') || '';
                const typ = ($(el).attr('type') || '').toLowerCase();
                const g = iconGroesse($(el).attr('sizes')) + (/svg/.test(typ) || /\.svg/i.test(href) ? 1000 : 0) - (/\.ico/i.test(href) ? 500 : 0);
                return { u: absolut(href, basis), g };
            })
            .get()
            .sort((a, b) => b.g - a.g);
        for (const i of icons) logoDazu(i.u, 'icon');
    }

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
        logo_kandidaten,
        tel_links,
        mailto,
        ueberschriften,
        navigation,
        links,
        stylesheets,
        inline_css,
        stil_farben,
        zeilen,
        abschnitte,
    };
}
