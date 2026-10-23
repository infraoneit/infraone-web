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
export function logoVerlust(pixel: Uint8ClampedArray, breite?: number): { weiss: number; dunkel: number; sichtbar: number } {
    const weiss = verlustAuf(pixel, '#FFFFFF', breite);
    const dunkel = verlustAuf(pixel, LOGO_GRUND_DUNKEL, breite);
    return { weiss: weiss.anteil, dunkel: dunkel.anteil, sichtbar: weiss.sichtbar };
}

/* ------------------------------------------------------------------ */
/* Farbabstand (CIE76 in Lab)                                          */
/* ------------------------------------------------------------------ */

function kanalLinSrgb(c: number): number {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** sRGB → CIE-Lab (D65). */
export function rgbZuLab(r: number, g: number, b: number): [number, number, number] {
    const rl = kanalLinSrgb(r);
    const gl = kanalLinSrgb(g);
    const bl = kanalLinSrgb(b);
    const x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) / 0.95047;
    const y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
    const z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) / 1.08883;
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** Farbabstand ΔE (CIE76) zweier Hex-Farben. */
export function farbAbstand(a: string, b: string): number {
    const ra = hexZuRgb(a) ?? { r: 0, g: 0, b: 0 };
    const rb = hexZuRgb(b) ?? { r: 0, g: 0, b: 0 };
    const [l1, a1, b1] = rgbZuLab(ra.r, ra.g, ra.b);
    const [l2, a2, b2] = rgbZuLab(rb.r, rb.g, rb.b);
    return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/**
 * Anteil sichtbarer Pixel (Alpha ≥ 128), die auf `grund` fast verschwinden:
 * Helligkeitskontrast < 1,6 UND ähnliche Farbe (ΔE < 25). Kräftiges Gelb auf
 * Weiss verschwindet so nicht (anderer Farbton), Hellgrau auf Weiss schon
 * (AUFTRAG-096; A-095 zählte nur den Helligkeitskontrast).
 */
export function verlustAuf(pixel: Uint8ClampedArray, grund: string, breite?: number): { anteil: number; sichtbar: number } {
    const g = hexZuRgb(grund) ?? { r: 255, g: 255, b: 255 };
    const lg = 0.2126 * kanalLin(g.r) + 0.7152 * kanalLin(g.g) + 0.0722 * kanalLin(g.b);
    const labG = rgbZuLab(g.r, g.g, g.b);
    const n = pixel.length / 4;
    // 0 = durchsichtig, 1 = sichtbar und verschwindet auf dem Grund, 2 = sichtbar
    const art = new Uint8Array(n);
    let sichtbar = 0;
    let weg = 0;
    for (let p = 0; p < n; p++) {
        const i = p * 4;
        if (pixel[i + 3] < 128) continue;
        sichtbar++;
        art[p] = 2;
        const l = 0.2126 * kanalLin(pixel[i]) + 0.7152 * kanalLin(pixel[i + 1]) + 0.0722 * kanalLin(pixel[i + 2]);
        const k = l > lg ? (l + 0.05) / (lg + 0.05) : (lg + 0.05) / (l + 0.05);
        if (k >= 1.6) continue;
        const [lp, ap, bp] = rgbZuLab(pixel[i], pixel[i + 1], pixel[i + 2]);
        if (Math.hypot(lp - labG[0], ap - labG[1], bp - labG[2]) < 25) {
            art[p] = 1;
            weg++;
        }
    }
    if (!breite || breite < 2 || !weg || n % breite !== 0) return { anteil: sichtbar ? weg / sichtbar : 0, sichtbar };
    // Mit Raster (AUFTRAG-096): verschwindende Flächen, die ringsum von sichtbaren Pixeln
    // umschlossen sind (weisser Kreis im gelben Quadrat, weisses Innenfeld eines Signets),
    // gehören zur Zeichnung und gehen nicht verloren. Verloren ist nur, was an den
    // durchsichtigen Hintergrund oder den Bildrand stösst.
    const hoehe = n / breite;
    const gesehen = new Uint8Array(n);
    const stapel: number[] = [];
    let verloren = 0;
    for (let start = 0; start < n; start++) {
        if (art[start] !== 1 || gesehen[start]) continue;
        let groesse = 0;
        let offen = false;
        stapel.push(start);
        gesehen[start] = 1;
        while (stapel.length) {
            const p = stapel.pop()!;
            groesse++;
            const x = p % breite;
            const y = (p - x) / breite;
            if (x === 0 || y === 0 || x === breite - 1 || y === hoehe - 1) offen = true;
            const nachbarn = [x > 0 ? p - 1 : -1, x < breite - 1 ? p + 1 : -1, y > 0 ? p - breite : -1, y < hoehe - 1 ? p + breite : -1];
            for (const q of nachbarn) {
                if (q < 0) continue;
                if (art[q] === 0) offen = true;
                else if (art[q] === 1 && !gesehen[q]) {
                    gesehen[q] = 1;
                    stapel.push(q);
                }
            }
        }
        if (offen) verloren += groesse;
    }
    return { anteil: sichtbar ? verloren / sichtbar : 0, sichtbar };
}

/** Verkleinert RGBA-Pixel (nächster Nachbar) auf höchstens `max` Pixel Kantenlänge. */
export function rasterKlein(rgba: Uint8ClampedArray, w: number, h: number, max = 160): { rgba: Uint8ClampedArray; w: number; h: number } {
    const f = Math.min(1, max / Math.max(w, h));
    if (f >= 1) return { rgba, w, h };
    const nw = Math.max(1, Math.round(w * f));
    const nh = Math.max(1, Math.round(h * f));
    const aus = new Uint8ClampedArray(nw * nh * 4);
    for (let y = 0; y < nh; y++) {
        const sy = Math.min(h - 1, Math.floor(y / f));
        for (let x = 0; x < nw; x++) {
            const sx = Math.min(w - 1, Math.floor(x / f));
            const q = (sy * w + sx) * 4;
            const z = (y * nw + x) * 4;
            aus[z] = rgba[q];
            aus[z + 1] = rgba[q + 1];
            aus[z + 2] = rgba[q + 2];
            aus[z + 3] = rgba[q + 3];
        }
    }
    return { rgba: aus, w: nw, h: nh };
}

/** true = Logo braucht einen dunklen Grund (helle Teile verschwänden auf Weiss). */
export function brauchtDunklenGrund(v: { weiss: number; dunkel: number }): boolean {
    return v.weiss > 0.12 && v.weiss > v.dunkel;
}

/* ------------------------------------------------------------------ */
/* Logo-Plakette (AUFTRAG-096, Teil 2)                                 */
/* ------------------------------------------------------------------ */

export const LOGO_GRUND_WEISS = '#FFFFFF';

/** «Farbige» Website-Umgebung: deckend und nicht Weiss, Schwarz, Grau oder Beige. */
export function istFarbigeUmgebung(hex: string | null | undefined): boolean {
    if (!hex) return false;
    const rgb = hexZuRgb(hex);
    if (!rgb) return false;
    const { s, l } = rgbZuHsl(rgb);
    return s >= 0.2 && l >= 0.08 && l <= 0.92;
}

/** Pixel-Statistik eines Logos für die Plakette (Browser-Canvas oder Server). */
export interface LogoPixel {
    /** Anteil sichtbarer Pixel (Alpha ≥ 128) an allen Pixeln */
    anteilSichtbar: number;
    /** Bild hat durchsichtige Bereiche (> 2 % mit Alpha < 250) */
    transparenz: boolean;
    /** Mittelfarbe der sichtbaren Pixel */
    mittel: string | null;
    /** eine Farbe (5-Bit-Eimer, Nachbarn eingeschlossen) deckt ≥ 90 % der sichtbaren Pixel */
    einfarbig: boolean;
    /** Anteil des häufigsten Farbeimers */
    hauptAnteil: number;
    /** Anteil sichtbarer Pixel, die deutlich von der Hauptfarbe abweichen (> 40 Stufen in einem Kanal) */
    abweichend: number;
}

export function logoPixel(pixel: Uint8ClampedArray): LogoPixel {
    let sichtbar = 0;
    let transparent = 0;
    let r = 0;
    let g = 0;
    let b = 0;
    const eimer = new Map<number, number>();
    const gesamt = pixel.length / 4;
    for (let i = 0; i < pixel.length; i += 4) {
        if (pixel[i + 3] < 250) transparent++;
        if (pixel[i + 3] < 128) continue;
        sichtbar++;
        r += pixel[i];
        g += pixel[i + 1];
        b += pixel[i + 2];
        const k = ((pixel[i] >> 4) << 8) | ((pixel[i + 1] >> 4) << 4) | (pixel[i + 2] >> 4);
        eimer.set(k, (eimer.get(k) ?? 0) + 1);
    }
    let haupt = 0;
    let hauptSchluessel = -1;
    for (const [k, n] of eimer) if (n > haupt) [haupt, hauptSchluessel] = [n, k];
    // Nachbar-Eimer (Kantenglättung, leichte Verläufe) zählen zur Hauptfarbe
    let nahe = 0;
    if (hauptSchluessel >= 0) {
        const hr = hauptSchluessel >> 8;
        const hg = (hauptSchluessel >> 4) & 15;
        const hb = hauptSchluessel & 15;
        for (const [k, n] of eimer) {
            if (Math.abs((k >> 8) - hr) <= 1 && Math.abs(((k >> 4) & 15) - hg) <= 1 && Math.abs((k & 15) - hb) <= 1) nahe += n;
        }
    }
    const hauptAnteil = sichtbar ? nahe / sichtbar : 0;
    // deutlich abweichende Pixel (feine Schrift auf weissem JPEG zählt, Kantenglättung nicht)
    let abweichend = 0;
    if (hauptSchluessel >= 0) {
        const hr = ((hauptSchluessel >> 8) << 4) + 8;
        const hg = (((hauptSchluessel >> 4) & 15) << 4) + 8;
        const hb = ((hauptSchluessel & 15) << 4) + 8;
        for (let i = 0; i < pixel.length; i += 4) {
            if (pixel[i + 3] < 128) continue;
            if (Math.max(Math.abs(pixel[i] - hr), Math.abs(pixel[i + 1] - hg), Math.abs(pixel[i + 2] - hb)) > 40) abweichend++;
        }
    }
    const transparenz = gesamt ? transparent / gesamt > 0.02 : false;
    return {
        anteilSichtbar: gesamt ? sichtbar / gesamt : 0,
        transparenz,
        mittel: sichtbar ? rgbZuHex({ r: r / sichtbar, g: g / sichtbar, b: b / sichtbar }) : null,
        // nur bei Transparenz aussagekräftig: ein deckendes Bild bringt seinen Hintergrund selbst mit
        einfarbig: transparenz && hauptAnteil >= 0.9,
        hauptAnteil,
        abweichend: sichtbar ? abweichend / sichtbar : 0,
    };
}

/**
 * Sichtbarkeits-Prüfung (AUFTRAG-096, Teil 1): ein Logo-Bild ist nur gültig,
 * wenn ≥ 2 % der Pixel sichtbar sind und es nicht eine einzige deckende Fläche
 * ist (leeres Bild, Platzhalter, einfarbiges Rechteck).
 */
export function logoSichtbar(p: LogoPixel): { ok: boolean; grund?: string } {
    if (p.anteilSichtbar < 0.02) return { ok: false, grund: 'unsichtbar (< 2 % deckende Pixel)' };
    if (!p.transparenz && p.abweichend < 0.003) return { ok: false, grund: 'einfarbige Fläche' };
    return { ok: true };
}

export type PlakettenArt = 'umgebung' | 'marke' | 'weiss' | 'dunkel';

export interface PlakettenEingabe {
    /** Hintergrund der Logo-Umgebung auf der Website (Scanner), null = unbekannt */
    umgebung: string | null;
    /** Markenfarbe der Karte */
    marke: string | null;
    /** helles Logo (braucht dunklen Grund) */
    hell: boolean;
    /** Mittelfarbe der sichtbaren Logo-Pixel */
    mittel: string | null;
    /** praktisch einfarbig */
    einfarbig: boolean;
    /** Logo ohne eigene Farbe (Inline-SVG mit currentColor/ohne Füllung): die Website färbt es */
    ohneEigeneFarbe?: boolean;
    /** Anteil «verschwindender» Pixel auf einem Grund (aus den Pixeln), falls bekannt */
    verlust?: (grund: string) => number;
}

/**
 * Wählt die Plakette hinter dem Logo:
 * 1. Website-Umgebung (Hintergrund des Logos auf der Website), wenn farbig
 *    und das Logo darauf lesbar ist (einfarbig: Kontrast ≥ 3:1; mehrfarbig:
 *    höchstens 12 % der Pixel verschwinden).
 * 2. Logo ohne eigene Farbe (currentColor) und einfarbig: Markenfarbe, wenn ≥ 4,5:1
 *    (Zusatzregel, deshalb strenger als die 3:1 der Umgebungs-Plakette).
 * 3. Sonst wie A-095: helles Logo → dunkle Plakette (bzw. direkt auf sehr
 *    dunkler Markenfarbe), dunkles → weisse; einfarbige Logos brauchen ≥ 3:1
 *    zur Plakette, sonst die andere Plakette.
 */
export function waehlePlakette(e: PlakettenEingabe): { art: PlakettenArt; farbe: string } {
    const lesbar = (grund: string) => {
        if (e.einfarbig && e.mittel) return kontrast(e.mittel, grund) >= 3;
        if (e.verlust) return e.verlust(grund) <= 0.12;
        return false;
    };
    if (e.umgebung && istFarbigeUmgebung(e.umgebung) && lesbar(e.umgebung)) return { art: 'umgebung', farbe: e.umgebung.toUpperCase() };
    // Zusatzregel (eigene Farbe fehlt, die Website färbt das Logo): Markenfarbe nur bei gut lesbarem Kontrast ≥ 4,5:1
    if (e.ohneEigeneFarbe && e.einfarbig && e.mittel && e.marke && kontrast(e.mittel, e.marke) >= 4.5) return { art: 'marke', farbe: e.marke.toUpperCase() };
    let art: PlakettenArt = e.hell ? 'dunkel' : 'weiss';
    if (e.einfarbig && e.mittel) {
        const hier = art === 'dunkel' ? LOGO_GRUND_DUNKEL : LOGO_GRUND_WEISS;
        const dort = art === 'dunkel' ? LOGO_GRUND_WEISS : LOGO_GRUND_DUNKEL;
        if (kontrast(e.mittel, hier) < 3 && kontrast(e.mittel, dort) >= 3) art = art === 'dunkel' ? 'weiss' : 'dunkel';
    }
    // helles Logo direkt auf sehr dunkler Markenfarbe (wie A-095)
    if (art === 'dunkel' && e.marke && luminanz(e.marke) < 0.06) return { art: 'marke', farbe: e.marke.toUpperCase() };
    return { art, farbe: art === 'dunkel' ? LOGO_GRUND_DUNKEL : LOGO_GRUND_WEISS };
}
