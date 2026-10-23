/**
 * Markenfarbe aus mehreren Signalen, gewichtet (AUFTRAG-096, Teil 3).
 *
 * Signale (Gewicht in Klammern, Reihenfolge laut Auftrag):
 *   1. CSS-Variablen mit primary, brand, accent oder main im Namen (5 für exakte Namen;
 *      3 für zusammengesetzte Namen)
 *   2. Deckende Hintergrundfarbe von body/html/header/nav/Hero (4, +0,5 je
 *      weiteres Vorkommen, höchstens +2)
 *   3. theme-color (3) bzw. Manifest theme_color (2,5)
 *   4. Häufigste gesättigte Farbe in Stylesheets und <style> (bis 2,5 nach Anzahl)
 *   5. Buttons/Links (bis 1,5), Logo-Farbe (1,25)
 * Ähnliche Farben (ΔE < 25) bilden eine Gruppe, deren Gewichte sich addieren:
 * Signale, die sich einig sind, gewinnen. Vertreter der Gruppe ist die Farbe
 * des stärksten Einzelsignals. Nie Markenfarbe: Grau, Weiss, Schwarz, Beige
 * (S < 0,2) sowie Voreinstellungen verbreiteter Frameworks, Baukästen,
 * Cookie-Banner und Social-Media-Knöpfe.
 */
import { farbAbstand, farbtonAbstand, helligkeit, hexZuRgb, rgbZuHsl } from './farben';
import type { Farben } from './typen';

export type FarbQuelle = 'css-variable' | 'hintergrund' | 'theme-color' | 'manifest' | 'haeufigkeit' | 'button' | 'logo';

/** Gewicht der Logo-Farbe (Server: PNG/SVG/ICO; Browser: WebP/JPEG/GIF per Canvas). */
export const FARB_GEWICHT_LOGO = 1.25;

export interface FarbSignal {
    farbe: string;
    gewicht: number;
    quelle: FarbQuelle;
}

export interface Markenfarbe extends Farben {
    quelle: FarbQuelle;
    /** Summe der Gewichte der Siegergruppe (für Messung/Protokoll) */
    gewicht: number;
}

/**
 * Voreinstellungen, die in sehr vielen Seiten stehen, aber keine Markenfarbe sind:
 * Bootstrap 2–5, WordPress (Admin, Gutenberg-Paletten), Elementor, Divi, Astra,
 * GeneratePress, OceanWP, Kadence, WooCommerce, Webflow, Wix, TYPO3 bootstrap_package,
 * Tailwind (Fokus-Ring), Material/Ionic, Swiper (#007AFF), Plyr, Google-Einbettungen,
 * Cookie-Banner (Cookiebot, CookieYes, OneTrust, Complianz) und Social-Media-Knöpfe.
 */
const FRAMEWORK_FARBEN = new Set([
    // Bootstrap 3–5 inkl. abgeleiteter Töne (Hover, Alerts, Fokus)
    '#007BFF', '#0D6EFD', '#337AB7', '#6C757D', '#28A745', '#198754', '#17A2B8', '#0DCAF0', '#FFC107', '#DC3545', '#6610F2', '#6F42C1', '#E83E8C', '#D63384', '#FD7E14', '#20C997', '#5CB85C', '#5BC0DE', '#F0AD4E', '#D9534F', '#0088CC', '#0A58CA', '#0B5ED7', '#31D2F2', '#157347', '#BB2D3B', '#FFCA2C',
    '#004085', '#0062CC', '#005CBF', '#0069D9', '#155724', '#1E7E34', '#1C7430', '#218838', '#0C5460', '#117A8B', '#10707F', '#138496', '#856404', '#D39E00', '#C69500', '#E0A800', '#721C24', '#BD2130', '#B21F2D', '#C82333', '#084298', '#0F5132', '#055160', '#664D03', '#842029', '#146C43', '#0AA2C0', '#286090', '#204D74', '#449D44', '#398439', '#31B0D5', '#269ABC', '#EC971F', '#D58512', '#C9302C', '#AC2925', '#23527C',
    // WordPress Admin/Block-Editor + Gutenberg-Paletten
    '#007CBA', '#006BA1', '#005A87', '#0693E3', '#3858E9', '#0073AA', '#00A0D2', '#2271B1', '#135E96', '#CF2E2E', '#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#9B51E0', '#F78DA7', '#ABB8C3', '#D63638', '#00A32A', '#DBA617', '#72AEE6',
    // Elementor, Divi, Astra, GeneratePress, OceanWP, Kadence, WooCommerce
    '#6EC1E4', '#61CE70', '#54595F', '#7A7A7A', '#2EA3F2', '#0274BE', '#046BD2', '#1E73BE', '#13AFF0', '#3182CE', '#2B6CB0', '#7F54B3', '#96588A', '#720EEC', '#A46497', '#93003C',
    // Webflow, TYPO3 bootstrap_package, Tailwind-Fokusring, Material, Ionic, Swiper, Plyr
    '#3898EC', '#116DFF', '#3899EC', '#FF8700', '#3B82F6', '#6200EE', '#03DAC6', '#3F51B5', '#FF4081', '#3880FF', '#007AFF', '#00B3FF', '#00B2FF',
    // Google (Karten, reCAPTCHA), Cookie-Banner
    '#1A73E8', '#4285F4', '#1032CF', '#1863DC', '#3860BE', '#68B631', '#0045A5', '#2B7ABF',
    // Social Media
    '#3B5998', '#1877F2', '#1DA1F2', '#0077B5', '#0A66C2', '#25D366', '#E4405F', '#C13584', '#FF0000', '#026466', '#006567', '#BD081C', '#E60023', '#00AFF0', '#FF0084', '#0088CC', '#7289DA', '#5865F2', '#1DB954',
]);

export function istFrameworkFarbe(hex: string): boolean {
    return FRAMEWORK_FARBEN.has(hex.toUpperCase());
}

function hsl(hex: string) {
    const rgb = hexZuRgb(hex);
    return rgb ? rgbZuHsl(rgb) : null;
}

/** Taugt als Markenfarbe (Signal 1–4): S ≥ 0,35, L 0,15–0,85, kein Framework-Standard. */
export function istKraeftig(hex: string): boolean {
    const h = hsl(hex);
    return !!h && h.s >= 0.35 && h.l >= 0.15 && h.l <= 0.85 && !istFrameworkFarbe(hex);
}

/** Nie Markenfarbe: Grau, Weiss, Schwarz, Beige (S < 0,2) bzw. fast Weiss/Schwarz. */
export function istNeutral(hex: string): boolean {
    const h = hsl(hex);
    return !h || h.s < 0.2 || h.l < 0.08 || h.l > 0.94;
}

/* ------------------------------------------------------------------ */
/* Häufigkeit in Stylesheets                                           */
/* ------------------------------------------------------------------ */

const FARB_LITERAL_RE =
    /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\(\s*\d{1,3}(?:\s*,\s*|\s+)\d{1,3}(?:\s*,\s*|\s+)\d{1,3}(?:\s*[,/]\s*(?:[\d.]+%?|var\(--[\w-]+(?:\s*,\s*[\d.]+)?\)))?\s*\)/gi;
/** Zustände/Varianten: deren Farben (Hover-Abdunklung usw.) zählen nicht. */
const ZUSTAND_SELEKTOR_RE = /:hover|:focus|:active|:visited|-hover\b|:disabled|::selection|::placeholder/i;

function literalZuHex(roh: string): string | null {
    if (roh.startsWith('#')) {
        const rgb = hexZuRgb(roh);
        return rgb ? `#${[rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase() : null;
    }
    const innen = roh.replace(/var\([^)]*\)/g, '');
    const z = innen.match(/[\d.]+%?/g) ?? [];
    if (z.length >= 4 && parseFloat(z[3]) / (z[3].endsWith('%') ? 100 : 1) < 0.6) return null;
    const [r, g, b] = z.slice(0, 3).map(Number);
    return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Zählt kräftige Farben in CSS-Text (Literale in Deklarationen; Hover/Fokus-Regeln zählen nicht). */
export function farbHaeufigkeit(css: string): Array<{ farbe: string; anzahl: number }> {
    const zaehler = new Map<string, number>();
    const text = css.slice(0, 1_600_000).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const regel of text.split('}')) {
        const klammer = regel.lastIndexOf('{');
        if (klammer < 0) continue;
        const selektor = regel.slice(0, klammer).slice(-400);
        // nur Regeln überspringen, deren Selektoren ALLE Zustände sind («a, a:visited» zählt)
        if (selektor.split(',').every((s) => ZUSTAND_SELEKTOR_RE.test(s))) continue;
        for (const m of regel.slice(klammer + 1).matchAll(FARB_LITERAL_RE)) {
            const hex = literalZuHex(m[0]);
            if (!hex || !istKraeftig(hex)) continue;
            zaehler.set(hex, (zaehler.get(hex) ?? 0) + 1);
        }
    }
    return [...zaehler.entries()].map(([farbe, anzahl]) => ({ farbe, anzahl })).sort((a, b) => b.anzahl - a.anzahl);
}

/* ------------------------------------------------------------------ */
/* Gewichtung                                                          */
/* ------------------------------------------------------------------ */

/** Farben mit ΔE < 25 gelten als dieselbe Markenfarbe (Hover-/Schattierungen). */
const GRUPPE_DELTA_E = 25;
/** Mindestgewicht einer Siegergruppe ohne Logo (darunter: Logo-Farbe als letzte Quelle oder keine). */
export const MIN_GEWICHT = 1.5;

const REIHENFOLGE: FarbQuelle[] =['css-variable', 'hintergrund', 'theme-color', 'manifest', 'haeufigkeit', 'button', 'logo'];

/** Wählt die Markenfarbe aus gewichteten Signalen (Gruppen ähnlicher Farben). */
export function bestimmeMarkenfarbe(signale: FarbSignal[]): Markenfarbe | null {
    const brauchbar = signale.filter((s) => s.gewicht > 0 && hexZuRgb(s.farbe) && !istNeutral(s.farbe) && !istFrameworkFarbe(s.farbe));
    if (!brauchbar.length) return null;
    // stärkste Signale zuerst, bei Gleichstand nach Reihenfolge der Quellen
    const sortiert = [...brauchbar].sort((a, b) => b.gewicht - a.gewicht || REIHENFOLGE.indexOf(a.quelle) - REIHENFOLGE.indexOf(b.quelle));
    const gruppen: Array<{ vertreter: FarbSignal; summe: number; farben: string[] }> = [];
    for (const s of sortiert) {
        const g = gruppen.find((x) => farbAbstand(x.vertreter.farbe, s.farbe) < GRUPPE_DELTA_E);
        if (g) {
            g.summe += s.gewicht;
            g.farben.push(s.farbe);
        } else gruppen.push({ vertreter: s, summe: s.gewicht, farben: [s.farbe] });
    }
    gruppen.sort((a, b) => b.summe - a.summe || REIHENFOLGE.indexOf(a.vertreter.quelle) - REIHENFOLGE.indexOf(b.vertreter.quelle));
    let sieger = gruppen[0];
    // Zu schwache Hinweise (z. B. eine Farbe dreimal in einem Stylesheet) sind keine Markenfarbe —
    // dann zuletzt die Logo-Farbe (wie A-095), sonst keine.
    if (sieger.summe < MIN_GEWICHT) {
        const logo = sortiert.find((s) => s.quelle === 'logo');
        if (!logo) return null;
        sieger = gruppen.find((g) => g.farben.includes(logo.farbe)) ?? { vertreter: logo, summe: logo.gewicht, farben: [logo.farbe] };
        sieger = { ...sieger, vertreter: logo };
    }
    const primaer = sieger.vertreter.farbe.toUpperCase();
    const zweite = gruppen.slice(1).find((g) => farbtonAbstand(g.vertreter.farbe, primaer) >= 30 && g.summe >= 1);
    return {
        primaer,
        sekundaer: zweite ? zweite.vertreter.farbe.toUpperCase() : helligkeit(primaer, -0.18),
        quelle: sieger.vertreter.quelle,
        gewicht: Math.round(sieger.summe * 100) / 100,
    };
}
