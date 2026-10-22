/**
 * Bildanalyse für die Logo-Erkennung der KI-Demo (AUFTRAG-095, Teil 1).
 *
 * Ohne Zusatzpakete (kein sharp auf Netlify-Functions nötig):
 * - Format und Pixelgrösse aus den ersten Bytes: SVG, PNG, WebP (VP8/VP8L/
 *   VP8X), AVIF (ispe), JPEG, GIF, ICO, BMP.
 * - Pixel-Dekodierung nur für PNG (zlib + Filter, nicht verschachtelt) und
 *   ICO (eingebettetes PNG oder 32/24-Bit-Bitmap). Daraus: Transparenz,
 *   mittlere Helligkeit der sichtbaren Pixel (helle Logos), Anzahl Farben
 *   (Foto-Signatur) und dominante Markenfarbe.
 * - SVG: Füllfarben der Formen (inkl. <style>-Klassen und Vererbung) →
 *   Helligkeit und Markenfarbe; Grösse aus viewBox/width/height.
 * - WebP/AVIF/JPEG/GIF: nur Grösse/Transparenz-Flag; Helligkeit misst dann
 *   der Browser (Canvas) auf der Karte.
 */
import zlib from 'node:zlib';
import { load } from 'cheerio/slim';
import { brauchtDunklenGrund, dominanteFarbe, hexZuRgb, logoVerlust, luminanz, parseCssFarbe } from './farben';

export type BildFormat = 'svg' | 'png' | 'webp' | 'avif' | 'jpeg' | 'gif' | 'ico' | 'bmp';

export interface BildAnalyse {
    format: BildFormat;
    /** Pixel (SVG: aus viewBox/width/height, Vektor). */
    breite: number | null;
    hoehe: number | null;
    /** true = Bild hat durchsichtige Bereiche; null = unbekannt. */
    transparenz: boolean | null;
    /** Mittlere relative Helligkeit (0–1) der sichtbaren Pixel/Füllungen; null = unbekannt. */
    helligkeit: number | null;
    /** Helles Logo (weiss/hell auf transparent) → braucht dunklen Hintergrund. */
    hell: boolean | null;
    /** Dominante gesättigte Farbe (Markenfarbe) oder null. */
    farbe: string | null;
    /** Verschiedene Farben (5 Bit je Kanal) in der Stichprobe; null = unbekannt. */
    farbAnzahl: number | null;
    /** Foto-Signatur (viele Farben ohne Transparenz bzw. JPEG mit hoher Datenrate). */
    foto: boolean;
}

/* ------------------------------------------------------------------ */
/* Format und Grösse                                                   */
/* ------------------------------------------------------------------ */

const SVG_KOPF_RE = /^(\s|<\?xml[^>]*>|<!--[\s\S]*?-->|<!doctype[^>]*>)*<svg[\s>/]/i;

export function erkenneFormat(b: Buffer, contentType = ''): BildFormat | null {
    if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
    if (b.length >= 6 && b.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif';
    if (b.length >= 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
    if (b.length >= 12 && b.subarray(4, 8).toString('latin1') === 'ftyp' && /avi[fs]/.test(b.subarray(8, 32).toString('latin1'))) return 'avif';
    if (b.length >= 6 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0 && b.readUInt16LE(4) > 0) return 'ico';
    if (b.length >= 26 && b[0] === 0x42 && b[1] === 0x4d) return 'bmp';
    const kopf = b.subarray(0, 2048).toString('utf8').replace(/^﻿/, '');
    if (SVG_KOPF_RE.test(kopf)) return 'svg';
    const ct = contentType.split(';')[0].trim().toLowerCase();
    if (ct === 'image/svg+xml' && /<svg[\s>/]/i.test(b.subarray(0, 8192).toString('utf8'))) return 'svg';
    return null;
}

export const MIME: Record<BildFormat, string> = {
    svg: 'image/svg+xml',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
};

function zahl(v: string | undefined | null): number | null {
    if (!v) return null;
    const m = v.trim().match(/^([\d.]+)(px)?$/i);
    return m ? Number(m[1]) || null : null;
}

/** Grösse eines SVG aus viewBox bzw. width/height (Text des Wurzelelements). */
export function svgGroesse(svg: string): { w: number; h: number } | null {
    const wurzel = svg.match(/<svg\b[^>]*>/i)?.[0] ?? '';
    const attr = (n: string) => wurzel.match(new RegExp(`\\s${n}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? null;
    const vb = attr('viewBox')?.trim().split(/[\s,]+/).map(Number);
    const w = zahl(attr('width'));
    const h = zahl(attr('height'));
    if (vb && vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
        if (w && h) return { w, h };
        if (w) return { w, h: (w * vb[3]) / vb[2] };
        if (h) return { w: (h * vb[2]) / vb[3], h };
        return { w: vb[2], h: vb[3] };
    }
    return w && h ? { w, h } : null;
}

function webpGroesse(b: Buffer): { w: number; h: number; alpha: boolean | null } | null {
    if (b.length < 30) return null;
    const art = b.subarray(12, 16).toString('latin1');
    if (art === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
        return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alpha: false };
    }
    if (art === 'VP8L' && b[20] === 0x2f) {
        const bits = b.readUInt32LE(21);
        return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1, alpha: ((bits >> 28) & 1) === 1 };
    }
    if (art === 'VP8X') {
        const w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
        const h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
        return { w, h, alpha: (b[20] & 0x10) !== 0 };
    }
    return null;
}

function avifGroesse(b: Buffer): { w: number; h: number; alpha: boolean | null } | null {
    const kopf = b.subarray(0, Math.min(b.length, 65536));
    const i = kopf.indexOf('ispe', 0, 'latin1');
    if (i < 0 || i + 16 > kopf.length) return null;
    const alpha = kopf.indexOf('urn:mpeg:mpegB:cicp:systems:auxiliary:alpha', 0, 'latin1') >= 0 || kopf.indexOf('urn:mpeg:hevc:2015:auxid', 0, 'latin1') >= 0;
    return { w: kopf.readUInt32BE(i + 8), h: kopf.readUInt32BE(i + 12), alpha };
}

function jpegGroesse(b: Buffer): { w: number; h: number } | null {
    let i = 2;
    while (i + 9 < b.length) {
        if (b[i] !== 0xff) return null;
        const marker = b[i + 1];
        if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
            i += 2;
            continue;
        }
        const laenge = b.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
            return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        }
        i += 2 + laenge;
    }
    return null;
}

function gifInfo(b: Buffer): { w: number; h: number; alpha: boolean } {
    // Transparenz-Flag in der ersten Graphic Control Extension (21 F9 04 <flags>)
    let alpha = false;
    const gce = b.indexOf(Buffer.from([0x21, 0xf9, 0x04]));
    if (gce > 0 && gce + 3 < b.length) alpha = (b[gce + 3] & 1) === 1;
    return { w: b.readUInt16LE(6), h: b.readUInt16LE(8), alpha };
}

/* ------------------------------------------------------------------ */
/* PNG-Dekodierung (ohne Zusatzpaket)                                  */
/* ------------------------------------------------------------------ */

export interface Pixel {
    w: number;
    h: number;
    rgba: Uint8ClampedArray;
}

const PNG_MAX_PIXEL = 4_000_000;

interface PngKopf {
    w: number;
    h: number;
    tiefe: number;
    farbtyp: number;
    verschachtelt: boolean;
}

function pngKopf(b: Buffer): PngKopf | null {
    if (b.length < 33 || b.readUInt32BE(8) !== 13 || b.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), tiefe: b[24], farbtyp: b[25], verschachtelt: b[28] === 1 };
}

/** Dekodiert ein (nicht verschachteltes) PNG nach RGBA; null, wenn nicht möglich. */
export function dekodierePng(b: Buffer): Pixel | null {
    const kopf = pngKopf(b);
    if (!kopf || kopf.verschachtelt || kopf.w === 0 || kopf.h === 0 || kopf.w * kopf.h > PNG_MAX_PIXEL) return null;
    const { w, h, tiefe, farbtyp } = kopf;
    const kanaele = farbtyp === 0 ? 1 : farbtyp === 2 ? 3 : farbtyp === 3 ? 1 : farbtyp === 4 ? 2 : farbtyp === 6 ? 4 : 0;
    if (!kanaele || ![1, 2, 4, 8, 16].includes(tiefe)) return null;
    let palette: Buffer | null = null;
    let trns: Buffer | null = null;
    const idat: Buffer[] = [];
    let i = 8;
    while (i + 12 <= b.length) {
        const laenge = b.readUInt32BE(i);
        const typ = b.subarray(i + 4, i + 8).toString('latin1');
        const daten = b.subarray(i + 8, Math.min(b.length, i + 8 + laenge));
        if (typ === 'PLTE') palette = daten;
        else if (typ === 'tRNS') trns = daten;
        else if (typ === 'IDAT') idat.push(daten);
        else if (typ === 'IEND') break;
        i += 12 + laenge;
    }
    if (!idat.length) return null;
    const bitsProPixel = kanaele * tiefe;
    const zeilenBytes = Math.ceil((w * bitsProPixel) / 8);
    const bpp = Math.max(1, bitsProPixel >> 3);
    let roh: Buffer;
    try {
        roh = zlib.inflateSync(Buffer.concat(idat), { maxOutputLength: (zeilenBytes + 1) * h + 1024 });
    } catch {
        return null;
    }
    if (roh.length < (zeilenBytes + 1) * h) return null;
    const aktuell = Buffer.alloc(zeilenBytes);
    const vorher = Buffer.alloc(zeilenBytes);
    const rgba = new Uint8ClampedArray(w * h * 4);
    const trnsGrau = trns && farbtyp === 0 && trns.length >= 2 ? trns.readUInt16BE(0) : -1;
    const trnsRgb = trns && farbtyp === 2 && trns.length >= 6 ? [trns.readUInt16BE(0), trns.readUInt16BE(2), trns.readUInt16BE(4)] : null;
    const max = (1 << tiefe) - 1;
    for (let y = 0; y < h; y++) {
        const start = y * (zeilenBytes + 1);
        const filter = roh[start];
        for (let x = 0; x < zeilenBytes; x++) {
            const r = roh[start + 1 + x];
            const a = x >= bpp ? aktuell[x - bpp] : 0;
            const o = vorher[x];
            const c = x >= bpp ? vorher[x - bpp] : 0;
            let v: number;
            switch (filter) {
                case 0:
                    v = r;
                    break;
                case 1:
                    v = r + a;
                    break;
                case 2:
                    v = r + o;
                    break;
                case 3:
                    v = r + ((a + o) >> 1);
                    break;
                case 4: {
                    const p = a + o - c;
                    const pa = Math.abs(p - a);
                    const pb = Math.abs(p - o);
                    const pc = Math.abs(p - c);
                    v = r + (pa <= pb && pa <= pc ? a : pb <= pc ? o : c);
                    break;
                }
                default:
                    return null;
            }
            aktuell[x] = v & 0xff;
        }
        // Zeile → RGBA
        const probe = (index: number): number => {
            if (tiefe === 8) return aktuell[index];
            if (tiefe === 16) return aktuell.readUInt16BE(index * 2);
            const bit = index * tiefe;
            return (aktuell[bit >> 3] >> (8 - tiefe - (bit & 7))) & max;
        };
        for (let x = 0; x < w; x++) {
            const ziel = (y * w + x) * 4;
            let r = 0;
            let g = 0;
            let bl = 0;
            let al = 255;
            const skal = (v: number) => (tiefe === 16 ? v >> 8 : tiefe === 8 ? v : Math.round((v * 255) / max));
            if (farbtyp === 0) {
                const v = probe(x);
                r = g = bl = skal(v);
                if (v === trnsGrau) al = 0;
            } else if (farbtyp === 2) {
                const vr = probe(x * 3);
                const vg = probe(x * 3 + 1);
                const vb = probe(x * 3 + 2);
                r = skal(vr);
                g = skal(vg);
                bl = skal(vb);
                if (trnsRgb && vr === trnsRgb[0] && vg === trnsRgb[1] && vb === trnsRgb[2]) al = 0;
            } else if (farbtyp === 3) {
                const idx = probe(x);
                if (!palette || idx * 3 + 2 >= palette.length) return null;
                r = palette[idx * 3];
                g = palette[idx * 3 + 1];
                bl = palette[idx * 3 + 2];
                al = trns && idx < trns.length ? trns[idx] : 255;
            } else if (farbtyp === 4) {
                r = g = bl = skal(probe(x * 2));
                al = skal(probe(x * 2 + 1));
            } else {
                r = skal(probe(x * 4));
                g = skal(probe(x * 4 + 1));
                bl = skal(probe(x * 4 + 2));
                al = skal(probe(x * 4 + 3));
            }
            rgba[ziel] = r;
            rgba[ziel + 1] = g;
            rgba[ziel + 2] = bl;
            rgba[ziel + 3] = al;
        }
        aktuell.copy(vorher);
    }
    return { w, h, rgba };
}

/* ------------------------------------------------------------------ */
/* ICO / BMP                                                           */
/* ------------------------------------------------------------------ */

interface IcoEintrag {
    w: number;
    h: number;
    bpp: number;
    groesse: number;
    offset: number;
}

function icoEintraege(b: Buffer): IcoEintrag[] {
    const n = b.readUInt16LE(4);
    const aus: IcoEintrag[] = [];
    for (let i = 0; i < Math.min(n, 64); i++) {
        const o = 6 + i * 16;
        if (o + 16 > b.length) break;
        aus.push({ w: b[o] || 256, h: b[o + 1] || 256, bpp: b.readUInt16LE(o + 6), groesse: b.readUInt32LE(o + 8), offset: b.readUInt32LE(o + 12) });
    }
    return aus;
}

/** Bitmap (DIB ohne Datei-Kopf, wie in ICO) mit 32 oder 24 Bit → RGBA. */
function dekodiereDib(b: Buffer, mitUndMaske: boolean): Pixel | null {
    if (b.length < 40) return null;
    const kopfLaenge = b.readUInt32LE(0);
    const w = b.readInt32LE(4);
    let h = b.readInt32LE(8);
    const bits = b.readUInt16LE(14);
    const kompression = b.readUInt32LE(16);
    if (mitUndMaske) h = Math.floor(h / 2);
    const vonUnten = h > 0;
    h = Math.abs(h);
    if (w <= 0 || h <= 0 || w * h > PNG_MAX_PIXEL || (bits !== 32 && bits !== 24) || (kompression !== 0 && kompression !== 3)) return null;
    const zeile = Math.ceil((w * bits) / 32) * 4;
    const start = kopfLaenge;
    if (start + zeile * h > b.length) return null;
    const rgba = new Uint8ClampedArray(w * h * 4);
    const maskeZeile = Math.ceil(w / 32) * 4;
    const maskeStart = start + zeile * h;
    let alphaGenutzt = false;
    for (let y = 0; y < h; y++) {
        const quelleY = vonUnten ? h - 1 - y : y;
        for (let x = 0; x < w; x++) {
            const p = start + quelleY * zeile + x * (bits / 8);
            const z = (y * w + x) * 4;
            rgba[z] = b[p + 2];
            rgba[z + 1] = b[p + 1];
            rgba[z + 2] = b[p];
            rgba[z + 3] = bits === 32 ? b[p + 3] : 255;
            if (bits === 32 && b[p + 3] !== 0) alphaGenutzt = true;
        }
    }
    // 24 Bit (oder 32 Bit ohne Alpha): AND-Maske bestimmt die Transparenz
    if (mitUndMaske && (bits === 24 || !alphaGenutzt) && maskeStart + maskeZeile * h <= b.length) {
        for (let y = 0; y < h; y++) {
            const quelleY = vonUnten ? h - 1 - y : y;
            for (let x = 0; x < w; x++) {
                const byte = b[maskeStart + quelleY * maskeZeile + (x >> 3)];
                const transparent = (byte >> (7 - (x & 7))) & 1;
                rgba[(y * w + x) * 4 + 3] = transparent ? 0 : 255;
            }
        }
    }
    return { w, h, rgba };
}

function dekodiereIco(b: Buffer): { pixel: Pixel | null; w: number; h: number } | null {
    const eintraege = icoEintraege(b).sort((a, c) => c.w * c.h - a.w * a.h || c.bpp - a.bpp);
    const e = eintraege[0];
    if (!e) return null;
    const daten = b.subarray(e.offset, e.offset + e.groesse);
    if (daten.length >= 8 && daten[0] === 0x89 && daten[1] === 0x50) {
        const pixel = dekodierePng(daten);
        const kopf = pngKopf(daten);
        return { pixel, w: kopf?.w ?? e.w, h: kopf?.h ?? e.h };
    }
    return { pixel: dekodiereDib(daten, true), w: e.w, h: e.h };
}

/* ------------------------------------------------------------------ */
/* Pixel-Statistik                                                     */
/* ------------------------------------------------------------------ */

function relLum(r: number, g: number, b: number): number {
    const lin = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export interface PixelStatistik {
    transparenz: boolean;
    helligkeit: number | null;
    hell: boolean;
    farbAnzahl: number;
    sichtbar: number;
    farbe: string | null;
}

/** Statistik über die sichtbaren Pixel (Alpha ≥ 128), höchstens ~40 000 Stichproben. */
export function pixelStatistik(p: Pixel): PixelStatistik {
    const gesamt = p.w * p.h;
    const schritt = Math.max(1, Math.floor(gesamt / 40_000));
    let transparent = 0;
    let sichtbar = 0;
    let lumSumme = 0;
    const eimer = new Set<number>();
    const probe: number[] = [];
    for (let i = 0; i < gesamt; i += schritt) {
        const o = i * 4;
        const a = p.rgba[o + 3];
        if (a < 250) transparent++;
        if (a < 128) continue;
        sichtbar++;
        const r = p.rgba[o];
        const g = p.rgba[o + 1];
        const b = p.rgba[o + 2];
        lumSumme += relLum(r, g, b);
        eimer.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));
        probe.push(r, g, b, 255);
    }
    const stichproben = Math.ceil(gesamt / schritt);
    const helligkeit = sichtbar ? lumSumme / sichtbar : null;
    const transparenz = transparent / stichproben > 0.02;
    const rgbaProbe = new Uint8ClampedArray(probe);
    const farbe = probe.length ? dominanteFarbe(rgbaProbe)?.primaer ?? null : null;
    return {
        transparenz,
        helligkeit,
        // Hell = braucht dunklen Grund (helle Teile verschwänden auf Weiss). Nur bei Transparenz:
        // ein deckendes Bild bringt seinen Hintergrund selbst mit.
        hell: transparenz && brauchtDunklenGrund(logoVerlust(rgbaProbe)),
        farbAnzahl: eimer.size,
        sichtbar,
        farbe,
    };
}

/* ------------------------------------------------------------------ */
/* SVG                                                                 */
/* ------------------------------------------------------------------ */

const FORMEN = 'path, rect, circle, ellipse, polygon, polyline, line, text, tspan, use';

const BENANNT: Record<string, string> = {
    white: '#FFFFFF',
    black: '#000000',
    red: '#FF0000',
    green: '#008000',
    blue: '#0000FF',
    navy: '#000080',
    gray: '#808080',
    grey: '#808080',
    silver: '#C0C0C0',
    orange: '#FFA500',
    yellow: '#FFFF00',
    darkblue: '#00008B',
    darkgreen: '#006400',
    darkred: '#8B0000',
    whitesmoke: '#F5F5F5',
};

function farbeAus(wert: string | undefined | null): string | 'none' | 'aktuell' | null {
    if (!wert) return null;
    const v = wert.trim().toLowerCase();
    if (!v || v === 'inherit') return null;
    if (v === 'none' || v === 'transparent') return 'none';
    if (v === 'currentcolor') return 'aktuell';
    if (v.startsWith('url(')) return null;
    return BENANNT[v] ?? parseCssFarbe(v);
}

/** Klassenregeln aus <style> (nur einfache .klasse-Selektoren) → Füllfarbe. */
function klassenFarben(css: string): Map<string, string | 'none' | 'aktuell'> {
    const karte = new Map<string, string | 'none' | 'aktuell'>();
    for (const regel of css.replace(/\/\*[\s\S]*?\*\//g, '').split('}')) {
        const [sel, dekl] = regel.split('{');
        if (!sel || !dekl) continue;
        const fill = dekl.match(/(?:^|;)\s*fill\s*:\s*([^;!]+)/i)?.[1];
        const f = farbeAus(fill);
        if (!f) continue;
        for (const s of sel.split(',')) {
            const m = s.trim().match(/^\.([\w-]+)$/);
            if (m) karte.set(m[1], f);
        }
    }
    return karte;
}

function stilWert(style: string | undefined, name: string): string | null {
    if (!style) return null;
    return style.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, 'i'))?.[1] ?? null;
}

export interface SvgAnalyse {
    helligkeit: number | null;
    hell: boolean;
    farbe: string | null;
    farbAnzahl: number;
    eingebettetesPng: Buffer | null;
}

/** Analysiert die Füllfarben eines (bereinigten) SVG. */
export function analysiereSvg(svg: string): SvgAnalyse {
    const $ = load(svg, { xml: { xmlMode: true } });
    const klassen = klassenFarben($('style').text());
    const effektiv = (el: unknown): string | 'none' | 'aktuell' => {
        const kette = [el, ...$(el as never).parents().toArray()].slice(0, 12);
        for (const n of kette) {
            const knoten = $(n as never);
            const attr = farbeAus(stilWert(knoten.attr('style'), 'fill')) ?? farbeAus(knoten.attr('fill'));
            if (attr) return attr;
            for (const k of (knoten.attr('class') || '').split(/\s+/).filter(Boolean)) {
                const f = klassen.get(k);
                if (f) return f;
            }
            if (knoten.is('svg')) break;
        }
        return '#000000';
    };
    const farben: string[] = [];
    $(FORMEN).each((_, el) => {
        if ($(el).parents('defs, clipPath, clippath, mask, symbol').length && !$(el).parents('symbol').length) return;
        const f = effektiv(el);
        if (f === 'none') {
            // nur Kontur? dann zählt die Konturfarbe
            const s = farbeAus(stilWert($(el).attr('style'), 'stroke')) ?? farbeAus($(el).attr('stroke'));
            if (s && s !== 'none') farben.push(s === 'aktuell' ? '#000000' : s);
            return;
        }
        farben.push(f === 'aktuell' ? '#000000' : f);
    });
    // Verläufe: Stoppfarben als Füllung zählen
    $('stop').each((_, el) => {
        const f = farbeAus(stilWert($(el).attr('style'), 'stop-color')) ?? farbeAus($(el).attr('stop-color'));
        if (f && f !== 'none' && f !== 'aktuell') farben.push(f);
    });
    let eingebettetesPng: Buffer | null = null;
    $('image').each((_, el) => {
        if (eingebettetesPng) return;
        const href = $(el).attr('href') || $(el).attr('xlink:href') || '';
        const m = href.match(/^data:image\/png;base64,([a-z0-9+/=\s]+)$/i);
        if (m) eingebettetesPng = Buffer.from(m[1].replace(/\s+/g, ''), 'base64');
    });
    const gueltig = farben.filter((f) => hexZuRgb(f));
    const lums = gueltig.map((f) => luminanz(f));
    const helligkeit = lums.length ? lums.reduce((s, l) => s + l, 0) / lums.length : null;
    // Hell = braucht dunklen Grund: Anteil der Formen, die auf Weiss bzw. Dunkel verschwänden
    const probe = new Uint8ClampedArray(gueltig.length * 4);
    gueltig.forEach((f, i) => {
        const rgb = hexZuRgb(f)!;
        probe.set([rgb.r, rgb.g, rgb.b, 255], i * 4);
    });
    const hell = lums.length > 0 && brauchtDunklenGrund(logoVerlust(probe));
    const zaehler = new Map<string, number>();
    for (const f of gueltig) zaehler.set(f, (zaehler.get(f) ?? 0) + 1);
    const gesaettigt = [...zaehler.entries()]
        .filter(([f]) => {
            const rgb = hexZuRgb(f)!;
            const max = Math.max(rgb.r, rgb.g, rgb.b);
            const min = Math.min(rgb.r, rgb.g, rgb.b);
            const l = (max + min) / 510;
            const s = max === min ? 0 : (max - min) / 255 / (1 - Math.abs(2 * l - 1));
            return s >= 0.35 && l >= 0.18 && l <= 0.85;
        })
        .sort((a, b) => b[1] - a[1]);
    return { helligkeit, hell, farbe: gesaettigt[0]?.[0] ?? null, farbAnzahl: zaehler.size, eingebettetesPng };
}

/* ------------------------------------------------------------------ */
/* Gesamtanalyse                                                       */
/* ------------------------------------------------------------------ */

/**
 * Analysiert ein geladenes Bild. `abgeschnitten` = Download wurde gekürzt
 * (dann nur Format/Grösse aus dem Kopf).
 */
export function analysiereBild(body: Buffer, contentType: string, abgeschnitten = false): BildAnalyse | null {
    const format = erkenneFormat(body, contentType);
    if (!format) return null;
    const leer: BildAnalyse = { format, breite: null, hoehe: null, transparenz: null, helligkeit: null, hell: null, farbe: null, farbAnzahl: null, foto: false };
    try {
        if (format === 'svg') {
            const text = body.toString('utf8');
            const g = svgGroesse(text);
            const a = analysiereSvg(text);
            let { helligkeit, hell, farbe } = a;
            // Logo als eingebettetes PNG im SVG (häufig bei «SVG»-Exporten aus Grafikprogrammen)
            if (a.eingebettetesPng && a.farbAnzahl <= 1) {
                const px = dekodierePng(a.eingebettetesPng);
                if (px) {
                    const st = pixelStatistik(px);
                    helligkeit = st.helligkeit;
                    hell = st.hell;
                    farbe = st.farbe ?? farbe;
                }
            }
            return { ...leer, breite: g?.w ?? null, hoehe: g?.h ?? null, transparenz: true, helligkeit, hell, farbe, farbAnzahl: a.farbAnzahl };
        }
        if (format === 'png') {
            const kopf = pngKopf(body);
            const px = abgeschnitten ? null : dekodierePng(body);
            const basis = { ...leer, breite: kopf?.w ?? null, hoehe: kopf?.h ?? null, transparenz: kopf ? kopf.farbtyp === 4 || kopf.farbtyp === 6 || body.includes('tRNS', 0, 'latin1') : null };
            if (!px) return basis;
            const st = pixelStatistik(px);
            // Foto: sehr viele Farben ohne Transparenz
            const foto = !st.transparenz && st.sichtbar >= 2000 && st.farbAnzahl > 2500 && st.farbAnzahl / st.sichtbar > 0.12;
            return { ...basis, transparenz: st.transparenz, helligkeit: st.helligkeit, hell: st.hell, farbe: st.farbe, farbAnzahl: st.farbAnzahl, foto };
        }
        if (format === 'ico') {
            const ico = dekodiereIco(body);
            if (!ico) return leer;
            if (!ico.pixel) return { ...leer, breite: ico.w, hoehe: ico.h };
            const st = pixelStatistik(ico.pixel);
            return { ...leer, breite: ico.w, hoehe: ico.h, transparenz: st.transparenz, helligkeit: st.helligkeit, hell: st.hell, farbe: st.farbe, farbAnzahl: st.farbAnzahl };
        }
        if (format === 'webp') {
            const g = webpGroesse(body);
            return { ...leer, breite: g?.w ?? null, hoehe: g?.h ?? null, transparenz: g?.alpha ?? null };
        }
        if (format === 'avif') {
            const g = avifGroesse(body);
            return { ...leer, breite: g?.w ?? null, hoehe: g?.h ?? null, transparenz: g?.alpha ?? null };
        }
        if (format === 'gif') {
            const g = gifInfo(body);
            return { ...leer, breite: g.w, hoehe: g.h, transparenz: g.alpha };
        }
        if (format === 'jpeg') {
            const g = jpegGroesse(body);
            // Foto-Signatur: hohe Datenrate je Pixel (flache Grafiken komprimieren stark).
            // Nur bei grossen Bildern aussagekräftig (Kopf/Tabellen fallen dann nicht ins Gewicht).
            const flaeche = g ? g.w * g.h : 0;
            const foto = abgeschnitten || (flaeche >= 120_000 && body.length / flaeche > 0.08);
            return { ...leer, breite: g?.w ?? null, hoehe: g?.h ?? null, transparenz: false, foto };
        }
        if (format === 'bmp') {
            const px = dekodiereDib(body.subarray(14), false);
            if (!px) return leer;
            const st = pixelStatistik(px);
            return { ...leer, breite: px.w, hoehe: px.h, transparenz: st.transparenz, helligkeit: st.helligkeit, hell: st.hell, farbe: st.farbe, farbAnzahl: st.farbAnzahl };
        }
    } catch {
        return leer;
    }
    return leer;
}
