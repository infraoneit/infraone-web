#!/usr/bin/env node
/**
 * generate-blog-graphics.mjs
 *
 * Erzeugt alle Blog-Cover (1200x675) und Inline-Grafiken (1200x600) als SVG
 * und rendert sie per sharp (in Next.js bereits enthalten) nach WebP.
 *
 *   node scripts/generate-blog-graphics.mjs            # alles neu erzeugen
 *   node scripts/generate-blog-graphics.mjs <slug>     # nur ein Cover + Inline
 *
 * Schrift: Geist (die Site-Schrift, s. src/app/(website)/layout.tsx).
 * Die TTF-Dateien liegen lokal in scripts/fonts/ (OFL-Lizenz, s. OFL.txt) —
 * es wird keine Schrift extern geladen.
 *
 * Regel: Keine Zahl in einer Grafik, die nicht im Artikel oder in der
 * Preisliste steht.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'scripts', 'fonts');
const OUT_DIR = path.join(ROOT, 'public', 'images');
const SVG_DIR = path.join(ROOT, 'assets', 'blog-graphics');
const CACHE_DIR = path.join(ROOT, 'scripts', '.fontcache', 'cache');

// Fontconfig fuer sharp/librsvg vorbereiten (muss vor dem sharp-Import stehen)
fs.mkdirSync(CACHE_DIR, { recursive: true });
const fontsConf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONTS_DIR}</dir>
  <dir>C:\\Windows\\Fonts</dir>
  <cachedir>${CACHE_DIR}</cachedir>
</fontconfig>
`;
const confPath = path.join(FONTS_DIR, 'fonts.conf');
fs.writeFileSync(confPath, fontsConf);
process.env.FONTCONFIG_FILE = confPath;

const sharp = (await import('sharp')).default;

/* ------------------------------------------------------------------ */
/* Design-System                                                       */
/* ------------------------------------------------------------------ */
const C = {
    bgFrom: '#1A2E1A',
    bgTo: '#2E7335',
    primary: '#3D9646',
    accent: '#4CAF50',
    accentLight: '#8FD694',
    white: '#FFFFFF',
    textSec: '#D9EDD9',
    muted: '#A8C4A8',
    cardFill: 'rgba(255,255,255,0.08)',
    cardStroke: 'rgba(255,255,255,0.28)',
    warn: '#E8C35A',
    danger: '#E0655A',
};
const FONT = 'Geist, Arial, sans-serif';

const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Text-Element */
function t(x, y, str, { size = 20, weight = 400, fill = C.white, anchor = 'start', spacing, opacity } = {}) {
    const sp = spacing != null ? ` letter-spacing="${spacing}"` : '';
    const op = opacity != null ? ` opacity="${opacity}"` : '';
    return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${sp}${op}>${esc(str)}</text>`;
}

/** Abgerundete Karte */
function card(x, y, w, h, { fill = C.cardFill, stroke = C.cardStroke, r = 14, sw = 1.5 } = {}) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

/** Pfeil von (x1,y1) nach (x2,y2) */
function arrow(x1, y1, x2, y2, { stroke = C.accentLight, sw = 3 } = {}) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const hl = 12;
    const ax = x2 - hl * Math.cos(ang - 0.45);
    const ay = y2 - hl * Math.sin(ang - 0.45);
    const bx = x2 - hl * Math.cos(ang + 0.45);
    const by = y2 - hl * Math.sin(ang + 0.45);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`
        + `<path d="M ${ax} ${ay} L ${x2} ${y2} L ${bx} ${by}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Verbindungslinie ohne Pfeilspitze */
function line(x1, y1, x2, y2, { stroke = C.cardStroke, sw = 2, dash } = {}) {
    const d = dash ? ` stroke-dasharray="${dash}"` : '';
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${d}/>`;
}

/** Hintergrund: Verlauf + Punktraster */
function background(w, h) {
    return `<defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${C.bgFrom}"/>
            <stop offset="1" stop-color="${C.bgTo}"/>
        </linearGradient>
        <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.8" fill="#FFFFFF" opacity="0.055"/>
        </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect width="${w}" height="${h}" fill="url(#dots)"/>`;
}

/** InfraOne-Wortmarke klein (weiss/gruen, Geist SemiBold) */
function wordmark(x, y, size = 26) {
    return t(x, y, 'Infra', { size, weight: 600, fill: C.white })
        + t(x + size * 2.24, y, 'One', { size, weight: 600, fill: C.accentLight });
}

/** Kategorie-Pille (Grossbuchstaben, gesperrt) */
function categoryPill(x, y, label) {
    const size = 17;
    const spacing = 3;
    const w = Math.round(label.length * (size * 0.72 + spacing) + 36);
    const h = 40;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${C.primary}"/>`
        + t(x + w / 2, y + h / 2 + size * 0.36, label.toUpperCase(), {
            size, weight: 600, fill: C.white, anchor: 'middle', spacing,
        });
}

/** Geschaetzte Textbreite (Geist Bold, Gross-/Kleinschreibung gemischt) */
function estWidth(str, size) {
    return str.length * size * 0.54;
}

/** Mehrzeiliger Titel links; Schriftgroesse passt sich der verfuegbaren Breite an */
function titleBlock(x, y, lines, maxW, size = 46) {
    const longest = Math.max(...lines.map((l) => estWidth(l, size)));
    const fitted = longest > maxW ? Math.max(28, Math.floor(size * (maxW / longest))) : size;
    return lines
        .map((ln, i) => t(x, y + i * fitted * 1.22, ln, { size: fitted, weight: 700, fill: C.white }))
        .join('');
}

/** Cover-Rahmen: Hintergrund + Wortmarke + Titel + Kategorie-Pille */
function coverFrame({ titleLines, category }) {
    const W = 1200, H = 675;
    let s = background(W, H);
    s += wordmark(64, 84);
    s += titleBlock(64, 300, titleLines, 380);
    s += categoryPill(64, H - 108, category);
    return { open: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}`, close: '</svg>', gx: 470, gy: 55, gw: 690, gh: 565 };
}

/** Inline-Rahmen: Hintergrund + kleine Ueberschrift oben links */
function inlineFrame({ heading }) {
    const W = 1200, H = 600;
    let s = background(W, H);
    s += wordmark(64, 78, 22);
    s += t(64, 130, heading, { size: 30, weight: 700, fill: C.white });
    return { open: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}`, close: '</svg>', gx: 64, gy: 165, gw: 1072, gh: 400 };
}

/** Nummerierter Kreis */
function numBadge(cx, cy, n, r = 22) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.primary}"/>`
        + t(cx, cy + 7, String(n), { size: 22, weight: 700, fill: C.white, anchor: 'middle' });
}

/* ------------------------------------------------------------------ */
/* Cover-Grafiken (rechte zwei Drittel, Zone gx..gx+gw)                */
/* ------------------------------------------------------------------ */
const coverGraphics = {
    /* Zwei Spalten: On-Premise vs. Cloud */
    'cloud-telefonanlage-vs-on-premise': ({ gx, gy, gw, gh }) => {
        const colW = (gw - 60) / 2;
        const lx = gx, rx = gx + colW + 60, top = gy + 10, ph = gh - 40;
        let s = '';
        // Trennlinie
        s += line(gx + colW + 30, top + 20, gx + colW + 30, top + ph - 20, { stroke: 'rgba(255,255,255,0.35)', sw: 2, dash: '6 8' });
        // Linke Karte: On-Premise
        s += card(lx, top, colW, ph);
        // Serverschrank-Umriss
        const sx = lx + colW / 2 - 45, sy = top + 36;
        s += `<rect x="${sx}" y="${sy}" width="90" height="120" rx="8" fill="none" stroke="${C.white}" stroke-width="3"/>`;
        for (let i = 0; i < 4; i++) {
            s += line(sx + 10, sy + 22 + i * 28, sx + 80, sy + 22 + i * 28, { stroke: C.white, sw: 2.5 });
            s += `<circle cx="${sx + 70}" cy="${sy + 36 + i * 28}" r="3.5" fill="${C.accentLight}"/>`;
        }
        s += t(lx + colW / 2, top + 200, 'On-Premise', { size: 26, weight: 700, anchor: 'middle' });
        ['Investition', 'Wartung', 'Standort'].forEach((b, i) => {
            s += `<circle cx="${lx + 34}" cy="${top + 245 + i * 42 - 6}" r="4" fill="${C.accentLight}"/>`;
            s += t(lx + 50, top + 245 + i * 42, b, { size: 21, fill: C.textSec });
        });
        // Rechte Karte: Cloud
        s += card(rx, top, colW, ph, { fill: 'rgba(76,175,80,0.14)', stroke: C.accentLight });
        const cx = rx + colW / 2, cy = top + 96;
        s += `<path d="M ${cx - 70} ${cy + 28} a 26 26 0 0 1 4 -51 a 34 34 0 0 1 62 -8 a 26 26 0 0 1 30 27 a 24 24 0 0 1 -6 32 z" fill="none" stroke="${C.white}" stroke-width="3" transform="translate(-14,0)"/>`;
        s += t(rx + colW / 2, top + 200, 'Cloud', { size: 26, weight: 700, anchor: 'middle' });
        ['Monatlich', 'Updates inklusive', 'Ortsunabhängig'].forEach((b, i) => {
            s += `<circle cx="${rx + 34}" cy="${top + 245 + i * 42 - 6}" r="4" fill="${C.accentLight}"/>`;
            s += t(rx + 50, top + 245 + i * 42, b, { size: 21, fill: C.textSec });
        });
        return s;
    },

    /* Balkendiagramm mit echten Tarifen (Preisliste/Artikel) */
    'it-support-kosten-schweiz': ({ gx, gy, gw }) => {
        const rows = [
            { label: 'Remote-Support', value: 145, txt: 'CHF 145/h' },
            { label: 'Vor-Ort Privat', value: 145, txt: 'CHF 145/h' },
            { label: 'Vor-Ort KMU', value: 157, txt: 'CHF 157/h' },
            { label: 'Wartungsvertrag', value: 200, txt: 'ab CHF 200/Mt.' },
        ];
        const top = gy + 30, barH = 62, gap = 38, labelW = 205, maxV = 220;
        const chartW = gw - labelW - 150;
        let s = t(gx + 10, top - 6, 'Stundensätze von InfraOne', { size: 20, weight: 600, fill: C.muted });
        rows.forEach((r, i) => {
            const y = top + 30 + i * (barH + gap);
            const w = Math.round((r.value / maxV) * chartW);
            s += t(gx + 10, y + barH / 2 + 8, r.label, { size: 21, weight: 600 });
            s += `<rect x="${gx + labelW}" y="${y}" width="${w}" height="${barH}" rx="10" fill="${C.primary}"/>`;
            s += `<rect x="${gx + labelW}" y="${y}" width="${w}" height="${barH}" rx="10" fill="none" stroke="${C.accentLight}" stroke-width="2"/>`;
            s += t(gx + labelW + w + 18, y + barH / 2 + 8, r.txt, { size: 21, weight: 700, fill: C.white });
        });
        // Achse
        const axY = top + 30 + rows.length * (barH + gap) - gap + 22;
        s += line(gx + labelW, axY, gx + labelW + chartW, axY, { stroke: 'rgba(255,255,255,0.4)', sw: 2 });
        [0, 100, 200].forEach((v) => {
            const x = gx + labelW + (v / maxV) * chartW;
            s += line(x, axY, x, axY + 8, { stroke: 'rgba(255,255,255,0.4)', sw: 2 });
            s += t(x, axY + 34, v === 0 ? '0' : String(v), { size: 16, fill: C.muted, anchor: 'middle' });
        });
        s += t(gx + labelW + chartW + 12, axY + 34, 'CHF', { size: 16, fill: C.muted });
        return s;
    },

    /* Venn-Diagramm IT / OT */
    'it-trifft-ot': ({ gx, gy, gw, gh }) => {
        const cxL = gx + gw / 2 - 105, cxR = gx + gw / 2 + 105, cy = gy + gh / 2 - 20, r = 175;
        let s = '';
        s += `<circle cx="${cxL}" cy="${cy}" r="${r}" fill="rgba(76,175,80,0.18)" stroke="${C.white}" stroke-width="3"/>`;
        s += `<circle cx="${cxR}" cy="${cy}" r="${r}" fill="rgba(26,46,26,0.45)" stroke="${C.accentLight}" stroke-width="3"/>`;
        s += t(cxL - 58, cy - 108, 'IT', { size: 34, weight: 700, anchor: 'middle' });
        ['Server', 'Netzwerk', 'Daten'].forEach((b, i) =>
            s += t(cxL - 62, cy - 40 + i * 38, b, { size: 19, fill: C.textSec, anchor: 'middle' }));
        s += t(cxR + 58, cy - 108, 'OT', { size: 34, weight: 700, anchor: 'middle' });
        ['Steuerung', 'Sensorik', 'Anlage'].forEach((b, i) =>
            s += t(cxR + 66, cy - 40 + i * 38, b, { size: 19, fill: C.textSec, anchor: 'middle' }));
        // Schnittmenge hervorgehoben
        s += `<ellipse cx="${(cxL + cxR) / 2}" cy="${cy + 118}" rx="86" ry="40" fill="${C.primary}" stroke="${C.white}" stroke-width="2"/>`;
        s += t((cxL + cxR) / 2, cy + 126, 'Schnittstelle', { size: 19, weight: 700, anchor: 'middle' });
        return s;
    },

    /* Vier nummerierte Schritte mit Pfeilen */
    'microsoft-365-migration-kmu': ({ gx, gy, gw, gh }) => {
        const steps = [
            { n: 1, title: 'Analyse', sub: 'Bestand & Postfächer' },
            { n: 2, title: 'Vorbereitung', sub: 'Lizenzen & DNS' },
            { n: 3, title: 'Migration', sub: 'Cutover-Wochenende' },
            { n: 4, title: 'Nachbereitung', sub: 'Tests & Schulung' },
        ];
        const cols = 2, cw = (gw - 70) / 2, ch = (gh - 60) / 2 - 24;
        let s = '';
        steps.forEach((st, i) => {
            const col = i % cols, row = Math.floor(i / cols);
            const x = gx + col * (cw + 70), y = gy + 10 + row * (ch + 44);
            s += card(x, y, cw, ch, i === 2 ? { fill: 'rgba(76,175,80,0.16)', stroke: C.accentLight } : {});
            s += numBadge(x + 46, y + 52, st.n);
            s += t(x + 84, y + 60, st.title, { size: 25, weight: 700 });
            s += t(x + 84, y + 96, st.sub, { size: 18, fill: C.textSec });
            if (i < 3) {
                if (col === 0) s += arrow(x + cw + 12, y + ch / 2, x + cw + 58, y + ch / 2);
                else s += arrow(x - cw / 2 - 24, y + ch + 10, x - cw / 2 - 24, y + ch + 36, { stroke: C.accentLight });
            }
        });
        return s;
    },

    /* Schema: Telefon -> Internet -> 3CX -> peoplefone -> oeffentliches Netz */
    'moderne-telefonie-peoplefone-3cx': ({ gx, gy, gw, gh }) => {
        const nodes = [
            { label: 'Telefon /', label2: 'Softphone' },
            { label: 'Internet' },
            { label: '3CX-Instanz' },
            { label: 'peoplefone-', label2: 'Trunk' },
            { label: 'Öffentliches', label2: 'Netz' },
        ];
        const bw = 128, bh = 92, cy = gy + gh / 2 - bh / 2;
        const stepX = (gw - bw) / (nodes.length - 1);
        let s = '';
        nodes.forEach((n, i) => {
            const x = gx + i * stepX;
            const highlight = i === 2 || i === 3;
            s += card(x, cy, bw, bh, highlight ? { fill: 'rgba(76,175,80,0.16)', stroke: C.accentLight } : {});
            if (n.label2) {
                s += t(x + bw / 2, cy + bh / 2 - 6, n.label, { size: 17, weight: 600, anchor: 'middle' });
                s += t(x + bw / 2, cy + bh / 2 + 20, n.label2, { size: 17, weight: 600, anchor: 'middle' });
            } else {
                s += t(x + bw / 2, cy + bh / 2 + 6, n.label, { size: 17, weight: 600, anchor: 'middle' });
            }
            if (i < nodes.length - 1) {
                s += arrow(x + bw + 6, cy + bh / 2, x + stepX - 6, cy + bh / 2, { sw: 2.5 });
            }
        });
        s += t(gx + gw / 2, cy - 40, 'So fliesst das Gespräch', { size: 20, weight: 600, fill: C.muted, anchor: 'middle' });
        return s;
    },

    /* Videowand-Raster mit KVM-Knoten auf Arbeitsplaetze verteilt */
    'multimonitor-systeme-black-box-emerald': ({ gx, gy, gw }) => {
        let s = '';
        // Videowand 3x2
        const sw = 108, sh = 66, gapS = 12;
        const wallW = 3 * sw + 2 * gapS;
        const wx = gx + gw / 2 - wallW / 2, wy = gy + 16;
        s += card(wx - 16, wy - 16, wallW + 32, 2 * sh + gapS + 32, { r: 12 });
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
                s += `<rect x="${wx + c * (sw + gapS)}" y="${wy + r * (sh + gapS)}" width="${sw}" height="${sh}" rx="6" fill="rgba(76,175,80,0.22)" stroke="${C.white}" stroke-width="2"/>`;
            }
        }
        s += t(gx + gw / 2, wy - 30, 'Videowand', { size: 19, weight: 600, fill: C.muted, anchor: 'middle' });
        // KVM-Knoten
        const kx = gx + gw / 2, ky = wy + 2 * sh + gapS + 96;
        s += line(kx, wy + 2 * sh + gapS + 16, kx, ky - 34, { stroke: C.accentLight, sw: 3 });
        s += `<circle cx="${kx}" cy="${ky}" r="40" fill="${C.primary}" stroke="${C.white}" stroke-width="2.5"/>`;
        s += t(kx, ky + 7, 'KVM', { size: 22, weight: 700, anchor: 'middle' });
        // Arbeitsplaetze
        const seats = 3, bw = 150, bh = 66;
        const totalW = seats * bw + (seats - 1) * 40;
        const sx0 = gx + gw / 2 - totalW / 2, sy = ky + 120;
        for (let i = 0; i < seats; i++) {
            const x = sx0 + i * (bw + 40);
            s += line(kx, ky + 40, x + bw / 2, sy, { stroke: C.accentLight, sw: 2.5 });
            s += card(x, sy, bw, bh);
            // Monitor-Icon
            s += `<rect x="${x + bw / 2 - 24}" y="${sy + 14}" width="48" height="26" rx="3" fill="none" stroke="${C.white}" stroke-width="2"/>`;
            s += line(x + bw / 2, sy + 40, x + bw / 2, sy + 46, { stroke: C.white, sw: 2 });
            s += line(x + bw / 2 - 12, sy + 46, x + bw / 2 + 12, sy + 46, { stroke: C.white, sw: 2 });
            s += t(x + bw / 2, sy + 62, `Arbeitsplatz ${i + 1}`, { size: 14, fill: C.textSec, anchor: 'middle' });
        }
        return s;
    },

    /* Dashboard: drei Statuskacheln + Verlaufslinie (neutrale Beschriftung) */
    'prtg-netzwerkmonitoring': ({ gx, gy, gw, gh }) => {
        let s = card(gx + 6, gy + 6, gw - 12, gh - 30, { r: 18 });
        s += t(gx + 36, gy + 52, 'Monitoring-Dashboard', { size: 21, weight: 700 });
        // Statuskacheln
        const tiles = [
            { label: 'OK', fill: C.accent },
            { label: 'Warnung', fill: C.warn },
            { label: 'Alarm', fill: C.danger },
        ];
        const tw = (gw - 120) / 3, th = 92, ty = gy + 76;
        tiles.forEach((tile, i) => {
            const x = gx + 36 + i * (tw + 24);
            s += `<rect x="${x}" y="${ty}" width="${tw}" height="${th}" rx="12" fill="${tile.fill}" opacity="0.9"/>`;
            s += `<circle cx="${x + 30}" cy="${ty + 30}" r="8" fill="#FFFFFF" opacity="0.95"/>`;
            s += t(x + tw / 2, ty + th / 2 + 18, tile.label, { size: 21, weight: 700, fill: '#FFFFFF', anchor: 'middle' });
        });
        // Verlaufslinie
        const cy0 = ty + th + 60, ch = gh - (th + 60) - 120;
        s += t(gx + 36, cy0 - 14, 'Sensorverlauf', { size: 18, weight: 600, fill: C.muted });
        s += card(gx + 36, cy0, gw - 72, ch, { r: 12 });
        const px0 = gx + 60, pw = gw - 120, py0 = cy0 + ch - 26, ph = ch - 52;
        [0.25, 0.5, 0.75].forEach((f) =>
            s += line(px0, py0 - ph * f, px0 + pw, py0 - ph * f, { stroke: 'rgba(255,255,255,0.14)', sw: 1.5, dash: '4 6' }));
        const pts = [0.5, 0.55, 0.45, 0.6, 0.58, 0.72, 0.5, 0.66, 0.62, 0.78, 0.7, 0.64];
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px0 + (i / (pts.length - 1)) * pw} ${py0 - p * ph}`).join(' ');
        s += `<path d="${path}" fill="none" stroke="${C.accentLight}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
        pts.forEach((p, i) => {
            if (i % 3 === 0) s += `<circle cx="${px0 + (i / (pts.length - 1)) * pw}" cy="${py0 - p * ph}" r="4" fill="${C.white}"/>`;
        });
        return s;
    },

    /* Migrationspfad Codesys 2.3 -> Pruefschritt -> Codesys 3.5 */
    'wago-codesys-migration': ({ gx, gy, gw, gh }) => {
        let s = '';
        const cy = gy + gh / 2 - 70;
        const bw = 200, bh = 100;
        const x1 = gx + 6, x2 = gx + gw / 2 - 55, x3 = gx + gw - bw - 6;
        // Box Codesys 2.3
        s += card(x1, cy, bw, bh);
        s += t(x1 + bw / 2, cy + bh / 2 - 4, 'Codesys 2.3', { size: 24, weight: 700, anchor: 'middle' });
        s += t(x1 + bw / 2, cy + bh / 2 + 26, 'Bestand', { size: 17, fill: C.textSec, anchor: 'middle' });
        // Pruefschritt
        s += arrow(x1 + bw + 8, cy + bh / 2, x2 - 52, cy + bh / 2);
        s += `<circle cx="${x2}" cy="${cy + bh / 2}" r="34" fill="none" stroke="${C.accentLight}" stroke-width="3"/>`;
        s += `<path d="M ${x2 - 14} ${cy + bh / 2} l 10 12 l 20 -24" fill="none" stroke="${C.accentLight}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
        s += t(x2, cy + bh / 2 + 62, 'Prüfen', { size: 18, weight: 600, fill: C.textSec, anchor: 'middle' });
        // Box Codesys 3.5
        s += arrow(x2 + 52, cy + bh / 2, x3 - 8, cy + bh / 2);
        s += card(x3, cy, bw, bh, { fill: 'rgba(76,175,80,0.18)', stroke: C.accentLight });
        s += t(x3 + bw / 2, cy + bh / 2 - 4, 'Codesys 3.5', { size: 24, weight: 700, anchor: 'middle' });
        s += t(x3 + bw / 2, cy + bh / 2 + 26, 'Ziel', { size: 17, fill: C.textSec, anchor: 'middle' });
        // Drei Stichworte darunter
        const kws = [['Bibliotheken', 'aktualisieren'], ['Programmcode', 'migrieren'], ['WebVisu neu', 'aufbauen']];
        const kw = (gw - 48) / 3;
        kws.forEach((k, i) => {
            const x = gx + 24 + i * kw;
            s += card(x, cy + bh + 86, kw - 24, 74, { r: 12 });
            s += `<circle cx="${x + 24}" cy="${cy + bh + 86 + 37}" r="4" fill="${C.accentLight}"/>`;
            s += t(x + 40, cy + bh + 86 + 32, k[0], { size: 15.5, weight: 600 });
            s += t(x + 40, cy + bh + 86 + 56, k[1], { size: 15.5, weight: 600 });
        });
        return s;
    },

    /* Drei Preisstufen als Karten (Zahlen aus dem Artikel) */
    'webdesign-kosten-schweiz': ({ gx, gy, gw, gh }) => {
        const cards = [
            { name: 'Baukasten', price: 'CHF 15–40', per: 'pro Monat' },
            { name: 'Individuell', price: "CHF 2'500–6'000", per: 'einmalig' },
            { name: 'Shop', price: "CHF 5'000–15'000", per: 'einmalig' },
        ];
        const cw = (gw - 48) / 3, ch = gh - 90, top = gy + 30;
        let s = '';
        cards.forEach((cd, i) => {
            const x = gx + i * (cw + 24);
            const hl = i === 1;
            s += card(x, top, cw, ch, hl ? { fill: 'rgba(76,175,80,0.16)', stroke: C.accentLight } : {});
            s += t(x + cw / 2, top + 62, cd.name, { size: 23, weight: 700, anchor: 'middle' });
            s += line(x + 30, top + 88, x + cw - 30, top + 88, { stroke: 'rgba(255,255,255,0.25)', sw: 1.5 });
            const priceSize = cd.price.length > 12 ? 20 : 25;
            s += t(x + cw / 2, top + ch / 2 + 40, cd.price, { size: priceSize, weight: 700, fill: C.accentLight, anchor: 'middle' });
            s += t(x + cw / 2, top + ch / 2 + 74, cd.per, { size: 16, fill: C.textSec, anchor: 'middle' });
        });
        return s;
    },

    /* Drei Schritte: Boot-Medium -> utilman ersetzen -> neues Passwort */
    'windows-11-admin-passwort-zuruecksetzen': ({ gx, gy, gw, gh }) => {
        const steps = [
            { n: 1, label: 'Boot-Medium', icon: 'usb' },
            { n: 2, label: 'utilman.exe ersetzen', icon: 'swap' },
            { n: 3, label: 'Neues Passwort', icon: 'key' },
        ];
        const cw = (gw - 80) / 3, ch = gh - 110, top = gy + 40;
        let s = '';
        steps.forEach((st, i) => {
            const x = gx + i * (cw + 40);
            s += card(x, top, cw, ch, i === 1 ? { fill: 'rgba(76,175,80,0.14)', stroke: C.accentLight } : {});
            const cx = x + cw / 2, icy = top + 84;
            if (st.icon === 'usb') {
                s += `<rect x="${cx - 16}" y="${icy - 34}" width="32" height="52" rx="6" fill="none" stroke="${C.white}" stroke-width="3"/>`;
                s += `<rect x="${cx - 10}" y="${icy - 48}" width="20" height="16" rx="2" fill="none" stroke="${C.white}" stroke-width="3"/>`;
            } else if (st.icon === 'swap') {
                s += `<rect x="${cx - 42}" y="${icy - 40}" width="34" height="42" rx="4" fill="none" stroke="${C.white}" stroke-width="3"/>`;
                s += `<rect x="${cx + 8}" y="${icy - 28}" width="34" height="42" rx="4" fill="none" stroke="${C.accentLight}" stroke-width="3"/>`;
                s += arrow(cx - 2, icy + 18, cx + 10, icy + 2, { sw: 2.5 });
            } else {
                s += `<circle cx="${cx - 14}" cy="${icy - 18}" r="16" fill="none" stroke="${C.white}" stroke-width="3"/>`;
                s += line(cx - 2, icy - 6, cx + 30, icy + 26, { stroke: C.white, sw: 3 });
                s += line(cx + 16, icy + 12, cx + 24, icy + 4, { stroke: C.white, sw: 3 });
                s += line(cx + 24, icy + 20, cx + 32, icy + 12, { stroke: C.white, sw: 3 });
            }
            s += numBadge(cx, top + ch - 96, st.n, 20);
            const words = st.label.split(' ');
            if (st.label.length > 14) {
                s += t(cx, top + ch - 46, words.slice(0, -1).join(' '), { size: 19, weight: 700, anchor: 'middle' });
                s += t(cx, top + ch - 18, words[words.length - 1], { size: 19, weight: 700, anchor: 'middle' });
            } else {
                s += t(cx, top + ch - 32, st.label, { size: 19, weight: 700, anchor: 'middle' });
            }
            if (i < 2) s += arrow(x + cw + 6, top + ch / 2, x + cw + 34, top + ch / 2);
        });
        return s;
    },
};

/* ------------------------------------------------------------------ */
/* Inline-Grafiken (1200x600, Inhalt im Artikeltext)                   */
/* ------------------------------------------------------------------ */
const inlineGraphics = {
    /* 5-Jahre-Kostenvergleich, Zahlen aus dem Artikel */
    'cloud-telefonanlage-vs-on-premise': ({ gx, gy, gw, gh }) => {
        const bars = [
            { label: 'Cloud (Hosted PBX)', value: 9860, txt: "CHF 9'860" },
            { label: 'On-Premise', value: 29640, txt: "CHF 29'640" },
        ];
        const maxV = 30000, barH = 88, labelW = 260;
        const chartW = gw - labelW - 220;
        let s = '';
        bars.forEach((b, i) => {
            const y = gy + 60 + i * (barH + 60);
            const w = Math.round((b.value / maxV) * chartW);
            s += t(gx, y + barH / 2 + 8, b.label, { size: 23, weight: 600 });
            s += `<rect x="${gx + labelW}" y="${y}" width="${w}" height="${barH}" rx="12" fill="${i === 0 ? C.primary : 'rgba(255,255,255,0.25)'}"/>`;
            s += `<rect x="${gx + labelW}" y="${y}" width="${w}" height="${barH}" rx="12" fill="none" stroke="${C.accentLight}" stroke-width="2"/>`;
            s += t(gx + labelW + w + 20, y + barH / 2 + 9, b.txt, { size: 24, weight: 700 });
        });
        s += t(gx, gy + gh - 40, 'Beispiel aus dem Artikel: 20 Nebenstellen, Gesamtkosten über 5 Jahre', { size: 18, fill: C.muted });
        return s;
    },

    /* Uebliche Stundensaetze als Spannen-Balken (Markttabelle im Artikel) */
    'it-support-kosten-schweiz': ({ gx, gy, gw }) => {
        const rows = [
            { label: 'Telefon- & Remote-Support', min: 100, max: 160 },
            { label: 'Vor-Ort Privatkunden', min: 130, max: 180 },
            { label: 'Vor-Ort Firma', min: 140, max: 200 },
            { label: 'Spezialisten', min: 180, max: 250 },
        ];
        const maxV = 260, barH = 46, gap = 34, labelW = 300;
        const chartW = gw - labelW - 60;
        const x0 = gx + labelW;
        let s = '';
        rows.forEach((r, i) => {
            const y = gy + 30 + i * (barH + gap);
            const xa = x0 + (r.min / maxV) * chartW, xb = x0 + (r.max / maxV) * chartW;
            s += t(gx, y + barH / 2 + 7, r.label, { size: 21, weight: 600 });
            s += `<rect x="${xa}" y="${y}" width="${xb - xa}" height="${barH}" rx="${barH / 2}" fill="${C.primary}" stroke="${C.accentLight}" stroke-width="2"/>`;
            s += t((xa + xb) / 2, y + barH / 2 + 7, `${r.min}–${r.max}`, { size: 19, weight: 700, anchor: 'middle' });
        });
        const axY = gy + 30 + rows.length * (barH + gap) - gap + 24;
        s += line(x0, axY, x0 + chartW, axY, { stroke: 'rgba(255,255,255,0.4)', sw: 2 });
        [0, 100, 200].forEach((v) => {
            const x = x0 + (v / maxV) * chartW;
            s += t(x, axY + 30, v === 0 ? '0' : String(v), { size: 16, fill: C.muted, anchor: 'middle' });
        });
        s += t(x0 + chartW, axY + 58, 'CHF pro Stunde', { size: 16, fill: C.muted, anchor: 'end' });
        return s;
    },

    /* Fuenf Massnahmen fuer sichere IT/OT-Integration */
    'it-trifft-ot': ({ gx, gy, gw, gh }) => {
        const items = ['Netzwerk-Segmentierung', 'Firewall-Regeln', 'Monitoring', 'Notfallplan', 'Schulung'];
        const cols = 5, cw = (gw - (cols - 1) * 24) / cols, ch = gh - 70;
        let s = '';
        items.forEach((it, i) => {
            const x = gx + i * (cw + 24), y = gy + 20;
            s += card(x, y, cw, ch, i === 2 ? { fill: 'rgba(76,175,80,0.16)', stroke: C.accentLight } : {});
            s += numBadge(x + cw / 2, y + 66, i + 1, 24);
            // einfache Zweizeilen-Logik
            if (it.length > 12) {
                const splitAt = it.indexOf('-') > 0 ? it.indexOf('-') + 1 : it.lastIndexOf(' ', Math.floor(it.length / 2) + 6);
                s += t(x + cw / 2, y + ch / 2 + 22, it.slice(0, splitAt).trim(), { size: 19, weight: 600, anchor: 'middle' });
                s += t(x + cw / 2, y + ch / 2 + 52, it.slice(splitAt).trim(), { size: 19, weight: 600, anchor: 'middle' });
            } else {
                s += t(x + cw / 2, y + ch / 2 + 40, it, { size: 19, weight: 600, anchor: 'middle' });
            }
        });
        return s;
    },

    /* Lizenz-Preise (Tabelle im Artikel, pro Benutzer und Monat) */
    'microsoft-365-migration-kmu': ({ gx, gy, gw, gh }) => {
        const cards = [
            { name: 'Business Basic', price: 'CHF 6.10', note: 'Web-Apps, 1 TB OneDrive' },
            { name: 'Business Standard', price: 'CHF 12.70', note: 'plus Desktop-Office' },
            { name: 'Business Premium', price: 'CHF 22.30', note: 'plus Intune & Defender' },
        ];
        const cw = (gw - 48) / 3, ch = gh - 60, top = gy + 20;
        let s = '';
        cards.forEach((cd, i) => {
            const x = gx + i * (cw + 24);
            const hl = i === 1;
            s += card(x, top, cw, ch, hl ? { fill: 'rgba(76,175,80,0.16)', stroke: C.accentLight } : {});
            s += t(x + cw / 2, top + 66, cd.name, { size: 24, weight: 700, anchor: 'middle' });
            s += line(x + 32, top + 94, x + cw - 32, top + 94, { stroke: 'rgba(255,255,255,0.25)', sw: 1.5 });
            s += t(x + cw / 2, top + ch / 2 + 50, cd.price, { size: 34, weight: 700, fill: C.accentLight, anchor: 'middle' });
            s += t(x + cw / 2, top + ch / 2 + 88, 'pro Benutzer / Monat', { size: 16, fill: C.textSec, anchor: 'middle' });
            s += t(x + cw / 2, top + ch - 40, cd.note, { size: 17, fill: C.textSec, anchor: 'middle' });
        });
        return s;
    },

    /* Einrichtung 3CX + peoplefone in 5 Schritten */
    'moderne-telefonie-peoplefone-3cx': ({ gx, gy, gw, gh }) => {
        const steps = ['SIP-Trunk anlegen', 'Zugangsdaten eintragen', 'Rufnummern einrichten', 'Ausgehende Regeln', 'Funktionstest'];
        return stepRow({ gx, gy, gw, gh }, steps);
    },

    /* PRTG einrichten in 5 Schritten */
    'prtg-netzwerkmonitoring': ({ gx, gy, gw, gh }) => {
        const steps = ['Installation', 'Auto-Discovery', 'Sensoren aktivieren', 'Dashboards anpassen', 'Alarme definieren'];
        return stepRow({ gx, gy, gw, gh }, steps);
    },

    /* WAGO-Migration in 7 Schritten */
    'wago-codesys-migration': ({ gx, gy, gw, gh }) => {
        const steps = ['Projektanalyse', 'Projektstruktur', 'Bibliotheken', 'Code übertragen', 'Visualisierung', 'Testen', 'Dokumentation'];
        return stepRow({ gx, gy, gw, gh }, steps, { cols: 4 });
    },

    /* 5-Jahre-Kosten einer KMU-Website (Rechenbeispiel im Artikel) */
    'webdesign-kosten-schweiz': ({ gx, gy, gw, gh }) => {
        const parts = [
            { label: 'Erstellung', value: 4000, txt: "CHF 4'000" },
            { label: 'Hosting & Domain', value: 1500, txt: "CHF 1'500" },
            { label: 'Wartung', value: 4800, txt: "CHF 4'800" },
            { label: 'Inhaltspflege', value: 6000, txt: "CHF 6'000" },
        ];
        const total = 16300;
        const barY = gy + 60, barH = 92, chartW = gw;
        let s = '';
        let x = gx;
        const fills = [C.primary, C.accent, '#2E7335', '#5DB463'];
        parts.forEach((p, i) => {
            const w = Math.round((p.value / total) * chartW);
            s += `<rect x="${x}" y="${barY}" width="${w}" height="${barH}" fill="${fills[i]}" stroke="${C.bgFrom}" stroke-width="3"/>`;
            if (w > 150) {
                s += t(x + w / 2, barY + barH / 2 - 4, p.label, { size: 18, weight: 600, anchor: 'middle' });
                s += t(x + w / 2, barY + barH / 2 + 26, p.txt, { size: 18, weight: 700, anchor: 'middle' });
            } else {
                s += t(x + w / 2, barY + barH + 28, p.label, { size: 15, fill: C.textSec, anchor: 'middle' });
                s += t(x + w / 2, barY + barH + 52, p.txt, { size: 15, weight: 700, fill: C.white, anchor: 'middle' });
            }
            x += w;
        });
        s += t(gx, barY + barH + 110, 'Total über 5 Jahre', { size: 22, weight: 600, fill: C.textSec });
        s += t(gx + gw, barY + barH + 112, "CHF 16'300", { size: 40, weight: 700, fill: C.accentLight, anchor: 'end' });
        s += t(gx, gy + gh - 24, 'Rechenbeispiel aus dem Artikel: KMU-Website inkl. Folgekosten', { size: 17, fill: C.muted });
        return s;
    },

    /* Utilman-Trick: Datei-Tausch schematisch */
    'windows-11-admin-passwort-zuruecksetzen': ({ gx, gy, gw }) => {
        let s = '';
        const rows = [
            { step: '1. Sichern', cmd: 'move utilman.exe utilman.exe.bak' },
            { step: '2. Ersetzen', cmd: 'copy cmd.exe utilman.exe' },
            { step: '3. Wiederherstellen', cmd: 'move utilman.exe.bak utilman.exe' },
        ];
        const rh = 92, gap = 30;
        rows.forEach((r, i) => {
            const y = gy + 20 + i * (rh + gap);
            s += card(gx, y, gw, rh, i === 1 ? { fill: 'rgba(76,175,80,0.14)', stroke: C.accentLight } : {});
            s += t(gx + 30, y + rh / 2 + 8, r.step, { size: 22, weight: 700 });
            const cmdW = r.cmd.length * 12.5 + 48;
            s += `<rect x="${gx + gw - cmdW - 24}" y="${y + rh / 2 - 26}" width="${cmdW}" height="52" rx="10" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
            s += `<text x="${gx + gw - cmdW}" y="${y + rh / 2 + 7}" font-family="'Geist Mono', 'Courier New', monospace" font-size="19" fill="${C.accentLight}">${esc(r.cmd)}</text>`;
        });
        return s;
    },
};

/** Nummerierte Schritt-Kacheln in einer oder zwei Reihen */
function stepRow({ gx, gy, gw, gh }, steps, { cols } = {}) {
    const n = steps.length;
    const c = cols || n;
    const rows = Math.ceil(n / c);
    const cw = (gw - (c - 1) * 24) / c;
    const ch = (gh - 40 - (rows - 1) * 28) / rows;
    let s = '';
    steps.forEach((st, i) => {
        const col = i % c, row = Math.floor(i / c);
        const x = gx + col * (cw + 24), y = gy + 20 + row * (ch + 28);
        s += card(x, y, cw, ch);
        s += numBadge(x + 40, y + ch / 2, i + 1, 22);
        const words = st.split(' ');
        const hyph = st.indexOf('-') > 0 ? [st.slice(0, st.indexOf('-') + 1), st.slice(st.indexOf('-') + 1)] : null;
        if (hyph && hyph[1].length > 3) {
            s += t(x + 74, y + ch / 2 - 6, hyph[0], { size: 17, weight: 600 });
            s += t(x + 74, y + ch / 2 + 22, hyph[1], { size: 17, weight: 600 });
        } else if (st.length > 15 && words.length > 1) {
            const mid = Math.ceil(words.length / 2);
            s += t(x + 74, y + ch / 2 - 6, words.slice(0, mid).join(' '), { size: 18, weight: 600 });
            s += t(x + 74, y + ch / 2 + 22, words.slice(mid).join(' '), { size: 18, weight: 600 });
        } else {
            s += t(x + 74, y + ch / 2 + 7, st, { size: 18, weight: 600 });
        }
        if (col < c - 1 && i < n - 1) {
            s += arrow(x + cw + 3, y + ch / 2, x + cw + 21, y + ch / 2, { sw: 2 });
        }
    });
    return s;
}

/* ------------------------------------------------------------------ */
/* Artikel-Metadaten: Titel (max. 6 Woerter), Kategorie, Alt-Texte     */
/* ------------------------------------------------------------------ */
const articles = [
    {
        slug: 'cloud-telefonanlage-vs-on-premise',
        titleLines: ['Cloud-Telefonanlage', 'vs. On-Premise'],
        category: 'Telefonie',
        inlineHeading: 'Kosten über 5 Jahre im Vergleich',
        inlineAlt: 'Balkendiagramm: Gesamtkosten über 5 Jahre für 20 Nebenstellen — Cloud CHF 9\u2019860, On-Premise CHF 29\u2019640',
    },
    {
        slug: 'it-support-kosten-schweiz',
        titleLines: ['Was kostet', 'IT-Support?'],
        category: 'IT-Wissen',
        inlineHeading: 'Übliche Stundensätze in der Schweiz',
        inlineAlt: 'Spannen-Balkendiagramm der üblichen IT-Support-Stundensätze in der Schweiz: Remote CHF 100–160, Vor-Ort Privat CHF 130–180, Vor-Ort Firma CHF 140–200, Spezialisten CHF 180–250',
    },
    {
        slug: 'it-trifft-ot',
        titleLines: ['IT trifft OT'],
        category: 'IT-Wissen',
        inlineHeading: 'Sichere IT/OT-Integration: 5 Massnahmen',
        inlineAlt: 'Fünf nummerierte Massnahmen für eine sichere IT/OT-Integration: Netzwerk-Segmentierung, Firewall-Regeln, Monitoring, Notfallplan, Schulung',
    },
    {
        slug: 'microsoft-365-migration-kmu',
        titleLines: ['Microsoft 365', 'Migration für KMU'],
        category: 'IT-Wissen',
        inlineHeading: 'Microsoft 365 Lizenzen für KMU',
        inlineAlt: 'Drei Microsoft-365-Lizenzkarten mit Preisen pro Benutzer und Monat: Business Basic CHF 6.10, Business Standard CHF 12.70, Business Premium CHF 22.30',
    },
    {
        slug: 'moderne-telefonie-peoplefone-3cx',
        titleLines: ['Moderne Telefonie', 'peoplefone & 3CX'],
        category: 'Telefonie',
        inlineHeading: '3CX mit peoplefone einrichten: 5 Schritte',
        inlineAlt: 'Fünf nummerierte Einrichtungsschritte: SIP-Trunk anlegen, Zugangsdaten eintragen, Rufnummern einrichten, ausgehende Regeln, Funktionstest',
    },
    {
        slug: 'multimonitor-systeme-black-box-emerald',
        titleLines: ['Multimonitor mit', 'Black Box Emerald'],
        category: 'Kontrollraum',
        skipInline: 'Artikel enthält bereits eine Inline-Grafik (blackbox-kvm-system-multimonitor-videowall-uebersicht.webp); eine zweite Grafik würde nichts hinzufügen.',
    },
    {
        slug: 'prtg-netzwerkmonitoring',
        titleLines: ['PRTG', 'Netzwerkmonitoring'],
        category: 'Netzwerke',
        inlineHeading: 'PRTG einrichten in 5 Schritten',
        inlineAlt: 'Fünf nummerierte Einrichtungsschritte für PRTG: Installation, Auto-Discovery, Sensoren aktivieren, Dashboards anpassen, Alarme definieren',
    },
    {
        slug: 'wago-codesys-migration',
        titleLines: ['Migration auf', 'Codesys 3.5'],
        category: 'Gebäudeautomation',
        inlineHeading: 'Die Migration in 7 Schritten',
        inlineAlt: 'Sieben nummerierte Migrationsschritte von Codesys 2.3 auf 3.5: Projektanalyse, Projektstruktur, Bibliotheken, Code übertragen, Visualisierung, Testen, Dokumentation',
    },
    {
        slug: 'webdesign-kosten-schweiz',
        titleLines: ['Webdesign-Kosten', 'in der Schweiz'],
        category: 'Webdesign',
        inlineHeading: 'Was eine KMU-Website über 5 Jahre kostet',
        inlineAlt: 'Gestapeltes Balkendiagramm der 5-Jahre-Kosten einer KMU-Website: Erstellung CHF 4\u2019000, Hosting CHF 1\u2019500, Wartung CHF 4\u2019800, Inhaltspflege CHF 6\u2019000, Total CHF 16\u2019300',
    },
    {
        slug: 'windows-11-admin-passwort-zuruecksetzen',
        titleLines: ['Windows 11', 'Passwort zurücksetzen'],
        category: 'IT-Wissen',
        inlineHeading: 'Der Utilman-Trick im Überblick',
        inlineAlt: 'Drei Befehlszeilen des Utilman-Tricks schematisch: utilman.exe sichern, cmd.exe als utilman.exe kopieren, Original wiederherstellen',
    },
];

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */
const onlySlug = process.argv[2];
let coverCount = 0, inlineCount = 0;

for (const art of articles) {
    if (onlySlug && art.slug !== onlySlug) continue;

    // Cover
    const frame = coverFrame(art);
    const gfxFn = coverGraphics[art.slug];
    const svg = frame.open + gfxFn(frame) + frame.close;
    fs.mkdirSync(SVG_DIR, { recursive: true });
    fs.writeFileSync(path.join(SVG_DIR, `blog-cover-${art.slug}.svg`), svg);
    await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(path.join(OUT_DIR, `blog-cover-${art.slug}.webp`));
    coverCount++;
    console.log(`OK  Cover  blog-cover-${art.slug}.webp`);

    // Inline (optional)
    if (!art.skipInline) {
        const iFrame = inlineFrame({ heading: art.inlineHeading });
        const iGfx = inlineGraphics[art.slug];
        const iSvg = iFrame.open + iGfx(iFrame) + iFrame.close;
        fs.writeFileSync(path.join(SVG_DIR, `blog-inline-${art.slug}.svg`), iSvg);
        await sharp(Buffer.from(iSvg)).webp({ quality: 82 }).toFile(path.join(OUT_DIR, `blog-inline-${art.slug}.webp`));
        inlineCount++;
        console.log(`OK  Inline blog-inline-${art.slug}.webp`);
    } else {
        console.log(`--  Inline ${art.slug}: weggelassen (${art.skipInline})`);
    }
}

console.log(`\nFertig: ${coverCount} Cover, ${inlineCount} Inline-Grafiken.`);
