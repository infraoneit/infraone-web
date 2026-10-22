/**
 * Farb-Hilfen der KI-Demo (Server UND Browser, keine Node-Importe).
 *
 * Portmann-Prinzip: Kundeninhalte tragen die Farben des Kunden. Gibt es
 * keine verwertbare Kundenfarbe, gilt das neutrale Tiefblau — nie das
 * InfraOne-Grün.
 */

export const NEUTRAL_PRIMAER = '#1E3A5F';
export const NEUTRAL_SEKUNDAER = '#E8A13D';

export interface Rgb {
    r: number;
    g: number;
    b: number;
}

export interface Hsl {
    h: number;
    s: number;
    l: number;
}

const clamp = (v: number, min = 0, max = 255) => Math.min(max, Math.max(min, v));

export function hexZuRgb(hex: string): Rgb | null {
    const m = hex.trim().match(/^#?([0-9a-f]{3,8})$/i);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
    if (h.length === 8) h = h.slice(0, 6);
    if (h.length !== 6) return null;
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    };
}

export function rgbZuHex({ r, g, b }: Rgb): string {
    return (
        '#' +
        [r, g, b]
            .map((v) => Math.round(clamp(v)).toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
    );
}

export function rgbZuHsl({ r, g, b }: Rgb): Hsl {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    return { h: h * 60, s, l };
}

export function hslZuRgb({ h, s, l }: Hsl): Rgb {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

/** Liest CSS-Farbwerte (#hex, rgb[a](), hsl[a]()) — sonst null. */
export function parseCssFarbe(wert: string): string | null {
    const v = wert.trim().toLowerCase();
    if (v.startsWith('#')) {
        const rgb = hexZuRgb(v);
        return rgb ? rgbZuHex(rgb) : null;
    }
    const rgbM = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (rgbM) {
        const alpha = rgbM[4] ? parseFloat(rgbM[4]) / (rgbM[4].endsWith('%') ? 100 : 1) : 1;
        if (alpha < 0.6) return null;
        return rgbZuHex({ r: +rgbM[1], g: +rgbM[2], b: +rgbM[3] });
    }
    const hslM = v.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (hslM) {
        const alpha = hslM[4] ? parseFloat(hslM[4]) / (hslM[4].endsWith('%') ? 100 : 1) : 1;
        if (alpha < 0.6) return null;
        return rgbZuHex(hslZuRgb({ h: +hslM[1], s: +hslM[2] / 100, l: +hslM[3] / 100 }));
    }
    return null;
}

/** Gesättigt genug, um als Markenfarbe zu taugen (kein Grau, nicht fast weiss/schwarz). */
export function istMarkenfarbe(hex: string): boolean {
    const rgb = hexZuRgb(hex);
    if (!rgb) return false;
    const { s, l } = rgbZuHsl(rgb);
    return s >= 0.3 && l >= 0.18 && l <= 0.82;
}

export function farbtonAbstand(a: string, b: string): number {
    const ra = hexZuRgb(a);
    const rb = hexZuRgb(b);
    if (!ra || !rb) return 0;
    const ha = rgbZuHsl(ra).h;
    const hb = rgbZuHsl(rb).h;
    const d = Math.abs(ha - hb) % 360;
    return d > 180 ? 360 - d : d;
}

function kanalLin(c: number): number {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function luminanz(hex: string): number {
    const rgb = hexZuRgb(hex);
    if (!rgb) return 0;
    return 0.2126 * kanalLin(rgb.r) + 0.7152 * kanalLin(rgb.g) + 0.0722 * kanalLin(rgb.b);
}

export function kontrast(a: string, b: string): number {
    const la = luminanz(a);
    const lb = luminanz(b);
    const [hell, dunkel] = la > lb ? [la, lb] : [lb, la];
    return (hell + 0.05) / (dunkel + 0.05);
}

/** Schriftfarbe auf einer Fläche: Weiss oder Fast-Schwarz, je nach Kontrast. */
export function textAuf(hex: string): string {
    return kontrast(hex, '#FFFFFF') >= kontrast(hex, '#111418') ? '#FFFFFF' : '#111418';
}

/**
 * Verdunkelt/aufhellt eine Farbe, bis sie auf dem Hintergrund mindestens
 * das geforderte Kontrastverhältnis erreicht (für Icons/Text in Kundenfarbe).
 */
export function lesbarAuf(hex: string, hintergrund: string, minKontrast = 4.5): string {
    const rgb = hexZuRgb(hex);
    if (!rgb) return hex;
    const hsl = rgbZuHsl(rgb);
    const dunkler = luminanz(hintergrund) > 0.4;
    let aktuell = rgbZuHex(rgb);
    for (let i = 0; i < 40 && kontrast(aktuell, hintergrund) < minKontrast; i++) {
        hsl.l = dunkler ? Math.max(0, hsl.l - 0.025) : Math.min(1, hsl.l + 0.025);
        aktuell = rgbZuHex(hslZuRgb(hsl));
    }
    return aktuell;
}

/** Variante mit verschobener Helligkeit (für Verläufe/Sekundärfarbe). */
export function helligkeit(hex: string, delta: number): string {
    const rgb = hexZuRgb(hex);
    if (!rgb) return hex;
    const hsl = rgbZuHsl(rgb);
    hsl.l = Math.min(0.92, Math.max(0.08, hsl.l + delta));
    return rgbZuHex(hslZuRgb(hsl));
}

/**
 * Dominante gesättigte Farbe aus RGBA-Pixeln (Logo-Analyse im Browser).
 * Liefert null, wenn das Logo praktisch farblos ist (schwarz/weiss/grau).
 */
export function dominanteFarbe(pixel: Uint8ClampedArray): { primaer: string; sekundaer: string | null } | null {
    const eimer = new Map<number, { gewicht: number; r: number; g: number; b: number; n: number }>();
    let deckend = 0;
    for (let i = 0; i < pixel.length; i += 4) {
        const a = pixel[i + 3];
        if (a < 200) continue;
        deckend++;
        const rgb = { r: pixel[i], g: pixel[i + 1], b: pixel[i + 2] };
        const { h, s, l } = rgbZuHsl(rgb);
        if (s < 0.35 || l < 0.18 || l > 0.85) continue;
        const k = Math.floor(h / 20) % 18;
        const e = eimer.get(k) ?? { gewicht: 0, r: 0, g: 0, b: 0, n: 0 };
        const w = s * (1 - Math.abs(l - 0.5));
        e.gewicht += w;
        e.r += rgb.r * w;
        e.g += rgb.g * w;
        e.b += rgb.b * w;
        e.n++;
        eimer.set(k, e);
    }
    const liste = [...eimer.values()].sort((a, b) => b.gewicht - a.gewicht);
    const gesamtFarbig = liste.reduce((s, e) => s + e.n, 0);
    if (!liste.length || deckend === 0 || gesamtFarbig / deckend < 0.03) return null;
    const mittel = (e: { gewicht: number; r: number; g: number; b: number }) =>
        rgbZuHex({ r: e.r / e.gewicht, g: e.g / e.gewicht, b: e.b / e.gewicht });
    const primaer = mittel(liste[0]);
    const zweit = liste.slice(1).find((e) => e.n / gesamtFarbig > 0.08 && farbtonAbstand(mittel(e), primaer) >= 40);
    return { primaer, sekundaer: zweit ? mittel(zweit) : null };
}

/** Dunkle Logo-Plakette (Karte, Dunkelmodus-Körper) — Gegenstück zu Weiss. */
export const LOGO_GRUND_DUNKEL = '#16191E';

/**
 * Welcher Hintergrund zeigt ein Logo vollständig? Zählt die sichtbaren
 * Pixel (Alpha ≥ 128), die auf Weiss bzw. auf Dunkel fast verschwinden
 * (Kontrast < 1,6). Ein Logo mit weisser Schrift und farbigem Signet
 * braucht so den dunklen Grund, auch wenn es im Mittel nicht hell ist.
 * Liefert den Anteil «verschwindender» Pixel je Grund.
 */
export function logoVerlust(pixel: Uint8ClampedArray): { weiss: number; dunkel: number; sichtbar: number } {
    let sichtbar = 0;
    let aufWeiss = 0;
    let aufDunkel = 0;
    const lumDunkel = luminanz(LOGO_GRUND_DUNKEL);
    const lin = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    for (let i = 0; i < pixel.length; i += 4) {
        if (pixel[i + 3] < 128) continue;
        sichtbar++;
        const l = 0.2126 * lin(pixel[i]) + 0.7152 * lin(pixel[i + 1]) + 0.0722 * lin(pixel[i + 2]);
        if ((1.05) / (l + 0.05) < 1.6) aufWeiss++;
        if ((l + 0.05) / (lumDunkel + 0.05) < 1.6) aufDunkel++;
    }
    return { weiss: sichtbar ? aufWeiss / sichtbar : 0, dunkel: sichtbar ? aufDunkel / sichtbar : 0, sichtbar };
}

/** true = Logo braucht einen dunklen Grund (helle Teile verschwänden auf Weiss). */
export function brauchtDunklenGrund(v: { weiss: number; dunkel: number }): boolean {
    return v.weiss > 0.12 && v.weiss > v.dunkel;
}
