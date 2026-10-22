#!/usr/bin/env node
/**
 * demo-einheit-test.mjs (AUFTRAG-095) — Einheitstests der reinen Funktionen
 * der KI-Demo, ohne Server und ohne Netz:
 * Namen/Stimme (Schalter DEMO_MAENNLICHE_NAMEN), Begrüssung (wortgleich
 * Orchestrator A-091), Zustandsautomat (Button-Texte), SVG-Bereinigung,
 * Bildanalyse (PNG/ICO/WebP/JPEG, helle Logos), CSS-Logos (Kaskade),
 * Logo-Merkmale, CDN-Varianten, Öffnungszeiten.
 *
 *   node scripts/demo-einheit-test.mjs
 *
 * Node >= 22.18 (Type-Stripping).
 */
import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({
    resolve(s, k, weiter) {
        let x = s;
        if (x.startsWith('@/')) x = pathToFileURL(path.join(ROOT, 'src', x.slice(2))).href;
        try {
            return weiter(x, k);
        } catch (e) {
            if ((x.startsWith('.') || x.startsWith('file:')) && !/\.[cm]?[jt]sx?$/.test(x)) return weiter(x + '.ts', k);
            throw e;
        }
    },
});
const lade = (p) => import(pathToFileURL(path.join(ROOT, 'src/lib/demo', p)).href);
const namen = await lade('namen.ts');
const begruessung = await lade('begruessung.ts');
const zustand = await lade('zustand.ts');
const logo = await lade('logo.ts');
const bild = await lade('bildanalyse.ts');
const scanner = await lade('scanner.ts');

let fehler = 0;
let gesamt = 0;
function pruefe(name, ok, detail = '') {
    gesamt++;
    if (!ok) fehler++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

/* Namen und Stimme */
delete process.env.DEMO_MAENNLICHE_NAMEN;
pruefe('Schalter fehlt → nur Frauennamen', namen.erlaubteNamen().length === 20 && namen.erlaubteNamen().every((n) => namen.istWeiblich(n)));
process.env.DEMO_MAENNLICHE_NAMEN = '0';
const gewaehlt0 = new Set(Array.from({ length: 300 }, (_, i) => namen.waehleName('', `site${i}.ch`)));
pruefe('Schalter 0 → waehleName vergibt nur Frauennamen', [...gewaehlt0].every((n) => namen.istWeiblich(n)), `${gewaehlt0.size} Namen`);
pruefe('Schalter 0 → Luca ist kein erlaubter Name', !namen.istErlaubterName('Luca'));
process.env.DEMO_MAENNLICHE_NAMEN = '1';
const gewaehlt1 = new Set(Array.from({ length: 300 }, (_, i) => namen.waehleName('', `site${i}.ch`)));
pruefe('Schalter 1 → beide Listen', namen.erlaubteNamen().length === 40 && [...gewaehlt1].some((n) => !namen.istWeiblich(n)));
pruefe('stimmeFuer passt zum Namen', namen.stimmeFuer('Lena') === 'weiblich' && namen.stimmeFuer('Luca') === 'maennlich');
pruefe('Name von der Website wird nicht vergeben', !namen.freieNamen('Ihr Team: Dr. Lena Muster').includes('Lena'));
process.env.DEMO_MAENNLICHE_NAMEN = '0';

/* Begrüssung wortgleich A-091 (voip-agent demo.py BEGRUESSUNGEN) */
pruefe(
    'Begrüssung Mundart wortgleich',
    begruessung.begruessungFuer('dialekt_auto', 'Lena', 'Muster AG', 'weiblich') ===
        'Grüezi, do isch Lena, de digitali Assistänt vo Muster AG. Sie händ uf infraone.ch en Testaaruf uusglöst – ich bi für Sie do. Was wänd Sie wüsse?',
);
pruefe(
    'Begrüssung Hochdeutsch wortgleich',
    begruessung.begruessungFuer('hochdeutsch', 'Lena', 'Muster AG', 'weiblich') ===
        'Grüezi, hier ist Lena, der digitale Assistent von Muster AG. Sie haben auf infraone.ch einen Testanruf ausgelöst – ich bin für Sie da. Was möchten Sie wissen?',
);
pruefe(
    'Begrüssung Englisch wortgleich',
    begruessung.begruessungFuer('englisch', 'Lena', 'Muster AG', 'weiblich') ===
        "Hello, this is Lena, the digital assistant of Muster AG. You requested a test call on infraone.ch – I'm here for you. What would you like to know?",
);
pruefe('Begrüssung nach Stimme (A-094-Formen, Schalter)', begruessung.begruessungFuer('dialekt_auto', 'Lena', 'X', 'weiblich', true).includes('d digitali Assistäntin vo X'));
pruefe('Firma mit {name} wird nicht doppelt ersetzt', begruessung.begruessungFuer('englisch', 'Mia', '{name} AG', 'weiblich').includes('assistant of {name} AG'));
pruefe('Rolle je Stimme', begruessung.rolleFuer('weiblich') === 'KI-Telefonassistentin' && begruessung.rolleFuer('maennlich') === 'KI-Telefonassistent');

/* Zustandsautomat */
const texte = ['eingabe', 'scan', 'bereit', 'wartend', 'waehlt', 'verbunden', 'beendet', 'fehler'].map((z) => zustand.primaerButton(z, 'Lena').text);
pruefe(
    'Button-Texte wortgleich',
    texte.join(' | ') === 'Website scannen | Wird gescannt … | Jetzt KI-Anruf erhalten | Wir rufen Sie gleich an … | Ihr Telefon klingelt … | Verbunden – sprechen Sie mit Lena | Nochmals testen | Nochmals versuchen',
    texte.join(' | '),
);
pruefe('deaktiviert in scan/wartend/waehlt/verbunden', ['scan', 'wartend', 'waehlt', 'verbunden'].every((z) => zustand.primaerButton(z, 'X').deaktiviert) && !zustand.primaerButton('bereit', 'X').deaktiviert);
pruefe('beendet → sekundär', zustand.primaerButton('beendet', 'X').art === 'sekundaer');
pruefe('Status angenommen → wartend', zustand.zustandAusStatus('angenommen') === 'wartend');
pruefe('nur vorwärts', zustand.naechsterZustand('verbunden', 'wartend') === 'verbunden' && zustand.naechsterZustand('waehlt', 'verbunden') === 'verbunden');
pruefe('Endzustand bleibt', zustand.naechsterZustand('beendet', 'verbunden') === 'beendet');
pruefe('Dauer m:ss', zustand.dauerAnzeige(47) === '0:47' && zustand.dauerAnzeige(125) === '2:05');
pruefe('Fehlermeldung Standard wortgleich A-092', zustand.fehlerMeldung(null).text === 'Leider nicht erreicht. Versuchen Sie es gleich nochmals oder rufen Sie uns an:');
pruefe('Fehlermeldung bei Tageslimit des Orchestrators', zustand.fehlerMeldung('limit').text.startsWith('Für diese Nummer sind die Testanrufe für heute aufgebraucht.'));

/* SVG bereinigen */
const boese = `<svg viewbox="0 0 10 5" onload="alert(1)"><script>alert(2)</script><foreignObject><div/></foreignObject><a href="javascript:x"><path d="M0 0h5" onclick="y"/></a><image href="https://evil.example/x.png"/><use href="#ok"/><lineargradient id="g"/><style>@import url(https://evil.example/a.css); .a{fill:url(https://evil.example/b)}</style></svg>`;
const sauber = logo.bereinigeSvg(boese) ?? '';
pruefe('SVG: Skripte, Ereignisse, foreignObject, externe Verweise entfernt', !/script|onload|onclick|foreignObject|evil\.example|javascript:/i.test(sauber), sauber.slice(0, 120));
pruefe('SVG: viewBox/linearGradient richtig geschrieben, xmlns ergänzt', /viewBox="0 0 10 5"/.test(sauber) && /<linearGradient/.test(sauber) && /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(sauber));
pruefe('SVG: interne Verweise bleiben', /href="#ok"/.test(sauber));
pruefe('SVG: Grösse aus viewBox ergänzt', /width="10"/.test(sauber) && /height="5"/.test(sauber));

/* Bildanalyse: synthetische PNGs */
function png(w, h, pixel) {
    const crc = (b) => {
        let c = ~0;
        for (const x of b) {
            c ^= x;
            for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
        }
        return ~c >>> 0;
    };
    const chunk = (typ, daten) => {
        const l = Buffer.alloc(4);
        l.writeUInt32BE(daten.length);
        const t = Buffer.from(typ, 'latin1');
        const c = Buffer.alloc(4);
        c.writeUInt32BE(crc(Buffer.concat([t, daten])));
        return Buffer.concat([l, t, daten, c]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    const roh = Buffer.alloc(h * (1 + w * 4));
    for (let y = 0; y < h; y++) {
        roh[y * (1 + w * 4)] = y % 5; // verschiedene Filter (Daten = 0 → Filter wirkt auf Nullen)
        for (let x = 0; x < w; x++) pixel(x, y).forEach((v, i) => (roh[y * (1 + w * 4) + 1 + x * 4 + i] = v));
    }
    // Filter 0 für echte Werte (sonst müssten wir filtern): alle Zeilen Filter 0
    for (let y = 0; y < h; y++) roh[y * (1 + w * 4)] = 0;
    return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(roh)), chunk('IEND', Buffer.alloc(0))]);
}
const weissAufTransparent = png(120, 40, (x, y) => (x > 10 && x < 110 && y > 10 && y < 30 ? [255, 255, 255, 255] : [0, 0, 0, 0]));
const a1 = bild.analysiereBild(weissAufTransparent, 'image/png');
pruefe('PNG: Grösse, Transparenz, helles Logo erkannt', a1?.format === 'png' && a1.breite === 120 && a1.hoehe === 40 && a1.transparenz === true && a1.hell === true, JSON.stringify(a1));
const rotAufTransparent = png(120, 40, (x, y) => (x > 10 && x < 110 && y > 10 && y < 30 ? [215, 32, 39, 255] : [0, 0, 0, 0]));
const a2 = bild.analysiereBild(rotAufTransparent, 'image/png');
pruefe('PNG: dunkles/farbiges Logo, Markenfarbe', a2?.hell === false && a2.farbe && /^#D/.test(a2.farbe), JSON.stringify(a2));
const gemischt = png(120, 40, (x, y) => (y < 20 ? [255, 255, 255, 255] : x < 40 ? [108, 179, 63, 255] : [0, 0, 0, 0]));
pruefe('PNG: weisse Schrift + grünes Signet → dunkler Grund', bild.analysiereBild(gemischt, 'image/png')?.hell === true);
const foto = png(200, 150, (x, y) => [(x * 7 + y * 13) % 256, (x * 3 + y * 29) % 256, (x * 17 + y * 5) % 256, 255]);
pruefe('PNG: Foto-Signatur (viele Farben, deckend)', bild.analysiereBild(foto, 'image/png')?.foto === true);
const k1 = logo.bewerteMitAnalyse({ url: 'https://x.ch/a.png', quelle: 'header-img', stufe: 1, punkte: 50, reihenfolge: 0 }, bild.analysiereBild(png(30, 30, () => [0, 0, 0, 255]), 'image/png'), 100);
pruefe('Logo < 48 px ungültig', k1.gueltig === false && /zu klein/.test(k1.grund));
const k2 = logo.bewerteMitAnalyse({ url: 'https://x.ch/a.png', quelle: 'header-img', stufe: 2, punkte: 50, reihenfolge: 0 }, bild.analysiereBild(png(700, 70, () => [0, 0, 0, 255]), 'image/png'), 100);
pruefe('Seitenverhältnis 10:1 ohne Logo-Merkmal ungültig', k2.gueltig === false);
const k3 = logo.bewerteMitAnalyse({ url: 'https://x.ch/logo.svg', quelle: 'css', stufe: 1, punkte: 20, reihenfolge: 0, logoWort: true }, bild.analysiereBild(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 381 54"><path d="M0 0h10v10z"/></svg>'), 'image/svg+xml'), 100);
pruefe('Wortmarke 7:1 mit Logo-Merkmal gültig', k3.gueltig === true, k3.grund ?? '');

// ICO mit eingebettetem PNG
const icoPng = png(64, 64, () => [20, 60, 140, 255]);
const icoKopf = Buffer.alloc(22);
icoKopf.writeUInt16LE(0, 0);
icoKopf.writeUInt16LE(1, 2);
icoKopf.writeUInt16LE(1, 4);
icoKopf[6] = 64;
icoKopf[7] = 64;
icoKopf.writeUInt16LE(32, 12);
icoKopf.writeUInt32LE(icoPng.length, 14);
icoKopf.writeUInt32LE(22, 18);
const ico = bild.analysiereBild(Buffer.concat([icoKopf, icoPng]), 'image/x-icon');
pruefe('ICO: grösste Bitmap, Farbe', ico?.format === 'ico' && ico.breite === 64 && ico.farbe !== null, JSON.stringify(ico));
// WebP VP8X-Kopf (Alpha)
const webp = Buffer.alloc(30);
webp.write('RIFF', 0, 'latin1');
webp.write('WEBP', 8, 'latin1');
webp.write('VP8X', 12, 'latin1');
webp[20] = 0x10;
webp.writeUIntLE(299, 24, 3);
webp.writeUIntLE(99, 27, 3);
const w = bild.analysiereBild(webp, 'image/webp');
pruefe('WebP: Grösse und Alpha aus VP8X', w?.format === 'webp' && w.breite === 300 && w.hoehe === 100 && w.transparenz === true, JSON.stringify(w));
pruefe('SVG-Erkennung trotz falschem Content-Type', bild.erkenneFormat(Buffer.from('<?xml version="1.0"?><svg/>'), 'application/octet-stream') === 'svg');
const svgHell = bild.analysiereBild(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><style>.st0{fill:#FFFFFF}</style><path class="st0" d="M0 0h50v20z"/><path class="st0" d="M50 0h50v20z"/></svg>'), 'image/svg+xml');
pruefe('SVG: weisse Füllung über Klasse → hell', svgHell?.hell === true && svgHell.breite === 100, JSON.stringify(svgHell));

/* Logo-Merkmale, CSS, CDN */
pruefe('Tailwind-Farbklasse ist kein Logo-Merkmal', !logo.hatLogoWort('text-brand-600 bg-brand-50 flex'));
pruefe('navbar-brand / site-logo sind Logo-Merkmale', logo.hatLogoWort('navbar-brand') && logo.hatLogoWort('site-logo') && logo.hatLogoWort('https://x.ch/img/logo-firma.svg'));
const css = '.logo a{background-image:url(../img/alt.svg)} .logo a{background-image:url(../uploads/neu.svg)} @media (max-width:767px){.logo a{background-image:url(../uploads/mobil.png)}} .partner-logos .logo{background:url(p.png)}';
const cssLogos = logo.logosAusCss(css, 'https://x.ch/css/a.css');
pruefe('CSS-Kaskade: spätere Regel gewinnt, Mobil-Variante zählt weniger, Partnerlogos nicht', cssLogos[0]?.url === 'https://x.ch/uploads/neu.svg' && !cssLogos.some((l) => /alt\.svg|p\.png/.test(l.url)), cssLogos.map((l) => `${l.url} ${l.punkte}`).join(' | '));
pruefe('Wix: grössere Variante', logo.groessereVariante('https://static.wixstatic.com/media/a~mv2.png/v1/fill/w_120,h_40,al_c/a.png') === 'https://static.wixstatic.com/media/a~mv2.png/v1/fill/w_480,h_160,al_c/a.png');
pruefe('Shopify: grössere Variante', logo.groessereVariante('https://feey.ch/cdn/shop/files/logo_100x.png?v=1')?.includes('logo_600x.png'));
pruefe('srcset: grösste Variante bis 1200 w', logo.bestesAusSrcset('a.png 200w, b.png 800w, c.png 2400w') === 'b.png');

/* Öffnungszeiten */
pruefe(
    'openingHours kompakt',
    scanner.openingHoursKompakt(['Mo 08:30-12:00, Mo 13:30-17:30, Tu 08:30-12:00, Tu 13:30-17:30, We 08:30-12:00, We 13:30-17:30, Th 08:30-12:00, Th 13:30-17:30, Fr 08:30-12:00, Fr 13:30-17:30, , ']) === 'Mo–Fr 08:30–12:00, 13:30–17:30',
);
pruefe('openingHours: Unlesbares → null (Rückfall Rohtext)', scanner.openingHoursKompakt(['täglich offen']) === null);

console.log(`\n${gesamt - fehler}/${gesamt} Prüfungen bestanden.`);
process.exit(fehler ? 1 : 0);
