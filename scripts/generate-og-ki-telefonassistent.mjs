#!/usr/bin/env node
/**
 * generate-og-ki-telefonassistent.mjs (AUFTRAG-092)
 *
 * Erzeugt public/og/ki-telefonassistent.png (1200x630): Headline + atmende
 * Wellenform in InfraOne-Grün. SVG → PNG per sharp (in Next enthalten),
 * Schrift Geist lokal aus scripts/fonts/ (wie generate-blog-graphics.mjs).
 *
 *   node scripts/generate-og-ki-telefonassistent.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'scripts', 'fonts');
const CACHE_DIR = path.join(ROOT, 'scripts', '.fontcache', 'cache');
const OUT = path.join(ROOT, 'public', 'og', 'ki-telefonassistent.png');

// Fontconfig für sharp/librsvg (muss vor dem sharp-Import stehen)
fs.mkdirSync(CACHE_DIR, { recursive: true });
const confPath = path.join(FONTS_DIR, 'fonts.conf');
fs.writeFileSync(
    confPath,
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONTS_DIR}</dir>
  <dir>C:\\Windows\\Fonts</dir>
  <cachedir>${CACHE_DIR}</cachedir>
</fontconfig>
`,
);
process.env.FONTCONFIG_FILE = confPath;
const sharp = (await import('sharp')).default;

const W = 1200;
const H = 630;
const C = {
    bgFrom: '#0A120A',
    bgMid: '#132413',
    bgTo: '#1F4A24',
    primary: '#3D9646',
    accent: '#4CAF50',
    accentLight: '#8FD694',
    white: '#FFFFFF',
    textSec: '#CFE3CF',
};
const FONT = 'Geist, Arial, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Wellenform: gleiche Hüllkurve wie auf der Seite (KiDemo), 56 Balken
function welle(x0, yMitte, breite, hoehe, n = 56) {
    const schritt = breite / n;
    const balkenB = schritt * 0.55;
    const mitte = (n - 1) / 2;
    let s = '';
    for (let i = 0; i < n; i++) {
        const x = (i - mitte) / (n * 0.3);
        const huelle = Math.exp(-x * x);
        const zacke = 0.62 + 0.38 * Math.abs(Math.sin(i * 1.37 + 0.4));
        // «atmende» Momentaufnahme: leichte Phasenwelle über die Breite
        const atem = 0.72 + 0.28 * Math.sin(i * 0.33);
        const h = Math.max(10, hoehe * (0.12 + 0.88 * huelle * zacke) * atem);
        const bx = x0 + i * schritt + (schritt - balkenB) / 2;
        s += `<rect x="${bx.toFixed(1)}" y="${(yMitte - h / 2).toFixed(1)}" width="${balkenB.toFixed(1)}" height="${h.toFixed(1)}" rx="${(balkenB / 2).toFixed(1)}" fill="url(#balken)"/>`;
    }
    return s;
}

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.bgFrom}"/>
      <stop offset="55%" stop-color="${C.bgMid}"/>
      <stop offset="100%" stop-color="${C.bgTo}"/>
    </linearGradient>
    <linearGradient id="balken" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.accentLight}"/>
      <stop offset="45%" stop-color="${C.accent}"/>
      <stop offset="100%" stop-color="${C.primary}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="punkte" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.6" fill="#FFFFFF" opacity="0.045"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#punkte)"/>

  <!-- Wortmarke -->
  <text x="72" y="96" font-family="${FONT}" font-size="30" font-weight="600" fill="${C.white}">Infra<tspan fill="${C.accentLight}">One</tspan></text>

  <!-- Pille -->
  <rect x="72" y="138" width="372" height="42" rx="21" fill="${C.primary}"/>
  <text x="258" y="166" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="600" letter-spacing="2.5" fill="${C.white}">DEMO-ANRUF IN EINER MINUTE</text>

  <!-- Headline -->
  <text font-family="${FONT}" font-weight="700" fill="${C.white}">
    <tspan x="72" y="262" font-size="64">${esc('KI-Telefonassistent')}</tspan>
    <tspan x="72" y="338" font-size="64">${esc('auf ')}<tspan fill="${C.accentLight}">${esc('Schweizerdeutsch')}</tspan></tspan>
  </text>
  <text x="72" y="396" font-family="${FONT}" font-size="26" font-weight="400" fill="${C.textSec}">${esc('Website eingeben – Assistent entsteht – die KI ruft Sie an.')}</text>

  <!-- Wellenform -->
  <ellipse cx="${W / 2}" cy="520" rx="560" ry="120" fill="url(#glow)"/>
  <line x1="72" y1="520" x2="${W - 72}" y2="520" stroke="${C.accent}" stroke-opacity="0.35" stroke-width="1.5"/>
  ${welle(72, 520, W - 144, 150)}

  <text x="${W - 72}" y="96" text-anchor="end" font-family="${FONT}" font-size="22" font-weight="500" fill="${C.textSec}">infraone.ch/ki-telefonassistent</text>
</svg>`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets', 'og-ki-telefonassistent.svg'), svg);
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT);
const meta = await sharp(OUT).metadata();
console.log(`OK: ${path.relative(ROOT, OUT)} (${meta.width}x${meta.height}, ${fs.statSync(OUT).size} Bytes)`);
