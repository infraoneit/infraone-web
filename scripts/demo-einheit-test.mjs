#!/usr/bin/env node
/**
 * demo-einheit-test.mjs (AUFTRAG-095) — Einheitstests der reinen Funktionen
 * der KI-Demo, ohne Server und ohne Netz:
 * Namen/Stimme (Schalter DEMO_MAENNLICHE_NAMEN), Begrüssung (wortgleich
 * Orchestrator A-091), Zustandsautomat (Button-Texte), SVG-Bereinigung,
 * Bildanalyse (PNG/ICO/WebP/JPEG, helle Logos), CSS-Logos (Kaskade),
 * Logo-Merkmale, CDN-Varianten, Öffnungszeiten.
 * AUFTRAG-096: Sprite-Auflösung, Leer-Prüfung, Sichtbarkeit, Plakette,
 * Logo-Umgebung (CSS-Selektoren), Farbgewichtung, strenge Öffnungszeiten-,
 * Telefon- und Adress-Prüfung, relative Logo-Pfade.
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
const farben = await lade('farben.ts');
const marke = await lade('markenfarbe.ts');
const umgebung = await lade('umgebung.ts');
const oz = await lade('oeffnungszeiten.ts');

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

/* ================================================================== */
/* AUFTRAG-096                                                         */
/* ================================================================== */

/* 1. Sprite-Auflösung und Leer-Prüfung */
const sprite =
    '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="v"><stop stop-color="#FAE600"/></linearGradient></defs>' +
    '<symbol id="icon-arrow" viewBox="0 0 10 10"><path d="M0 0h10v10z"/></symbol>' +
    '<symbol id="logo-full" viewBox="0 0 117 33"><path fill="currentColor" d="M61.1 8.6c-.4 1.2-1.3 3.8-1.4 6.1z"/><rect width="5" height="5" fill="url(#v)"/></symbol></svg>';
const sym = logo.symbolAusSprite(sprite, 'logo-full') ?? '';
pruefe('Sprite: Symbol samt viewBox und verwiesenem Verlauf geholt', /<symbol id="logo-full" viewBox="0 0 117 33"/.test(sym) && /id="v"/.test(sym) && !/icon-arrow/.test(sym), sym.slice(0, 90));
const inline = '<svg viewBox="0 0 117 33" class="w-auto"><use xlink:href="/static/dist/sprites/icons.0252816cc764.svg#logo-full"></use></svg>';
const ext = logo.externeSpriteVerweise(inline, 'https://www.hr-campus.ch/de/');
pruefe('Sprite: externer <use xlink:href> auf #id umgeschrieben, Verweis absolut', ext.verweise.length === 1 && ext.verweise[0].url === 'https://www.hr-campus.ch/static/dist/sprites/icons.0252816cc764.svg' && ext.verweise[0].id === 'logo-full' && /xlink:href="#logo-full"/.test(ext.svg), JSON.stringify(ext.verweise));
pruefe('Sprite: auch href (ohne xlink) erkannt', logo.externeSpriteVerweise('<svg><use href="sprite.svg#a"/></svg>', 'https://x.ch/').verweise[0]?.id === 'a');
const ohneSprite = logo.bereinigeSvg(ext.svg) ?? '';
const leerAnalyse = bild.analysiereBild(Buffer.from(ohneSprite), 'image/svg+xml');
pruefe('Leer-Prüfung: <use> ohne aufgelöstes Ziel → leer', leerAnalyse?.leer === true, JSON.stringify({ leer: leerAnalyse?.leer }));
const leerKandidat = logo.bewerteMitAnalyse({ url: null, quelle: 'inline-svg', stufe: 1, punkte: 45, reihenfolge: 0, inhalt: ohneSprite, sprite: ext.verweise }, leerAnalyse, 100);
pruefe('Leer-Prüfung: leerer Kandidat ist ungültig (nächster gewinnt)', leerKandidat.gueltig === false && /leer/.test(leerKandidat.grund), leerKandidat.grund);
const mitSprite = logo.bereinigeSvg(logo.spriteEinbetten(ohneSprite, [sym])) ?? '';
const vollAnalyse = bild.analysiereBild(Buffer.from(mitSprite), 'image/svg+xml');
pruefe('Sprite eingebettet: nicht leer, Grösse 117×33, ohne eigene Farbe (currentColor)', vollAnalyse?.leer === false && vollAnalyse.breite === 117 && vollAnalyse.hoehe === 33 && vollAnalyse.ohneEigeneFarbe === false, JSON.stringify({ leer: vollAnalyse?.leer, b: vollAnalyse?.breite, o: vollAnalyse?.ohneEigeneFarbe }));
const nurAktuell = bild.analysiereBild(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><symbol id="s"><path fill="currentColor" d="M0 0h9v9z"/></symbol></defs><use href="#s"/></svg>'), 'image/svg+xml');
pruefe('SVG nur mit currentColor → ohneEigeneFarbe', nurAktuell?.leer === false && nurAktuell.ohneEigeneFarbe === true);
pruefe('Leer-Prüfung: Zeichenfläche 0 (viewBox 0 0 0 0) → leer', bild.analysiereBild(Buffer.from('<svg viewBox="0 0 0 0"><path d="M0 0h9v9z"/></svg>'), 'image/svg+xml')?.leer === true);
pruefe('Leer-Prüfung: nur Schnittformen (clipPath) → leer', bild.analysiereBild(Buffer.from('<svg viewBox="0 0 9 9"><defs><clipPath id="c"><rect width="9" height="9"/></clipPath></defs><g clip-path="url(#c)"></g></svg>'), 'image/svg+xml')?.leer === true);
pruefe('Leer-Prüfung: leerer Pfad (d="") zählt nicht', bild.analysiereBild(Buffer.from('<svg viewBox="0 0 9 9"><path d=""/><text> </text></svg>'), 'image/svg+xml')?.leer === true);
const illustrator = '<svg viewBox="0 0 100 65"><style>.st3{clip-path:url(#c2);fill:#FFFFFF;}</style><defs><rect id="r1" width="100" height="65"/></defs><clipPath id="c2"><use href="#r1"/></clipPath><path class="st3" d="M10 10h40v20H10z"/><path class="st3" d="M50 10h40v20H50z"/></svg>';
pruefe('Illustrator-Export: Schnitt-Rechtecke zählen nicht als Füllung → weisses Logo bleibt hell', bild.analysiereBild(Buffer.from(illustrator), 'image/svg+xml')?.hell === true);

/* 1b. Sichtbarkeits-Prüfung (Browser-Canvas, gleiche Funktion) */
const pixel = (w, h, f) => {
    const a = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a.set(f(x, y), (y * w + x) * 4);
    return a;
};
pruefe('Sichtbarkeit: völlig durchsichtig → ungültig', farben.logoSichtbar(farben.logoPixel(pixel(40, 20, () => [0, 0, 0, 0]))).ok === false);
pruefe('Sichtbarkeit: deckende einfarbige Fläche → ungültig', farben.logoSichtbar(farben.logoPixel(pixel(40, 20, () => [255, 255, 255, 255]))).ok === false);
pruefe('Sichtbarkeit: weisses Logo auf Transparenz → gültig, einfarbig', (() => { const p = farben.logoPixel(pixel(40, 20, (x, y) => (x > 5 && x < 35 && y > 5 && y < 15 ? [255, 255, 255, 255] : [0, 0, 0, 0]))); return farben.logoSichtbar(p).ok && p.einfarbig && p.mittel === '#FFFFFF'; })());
pruefe('Sichtbarkeit: deckendes JPEG-Logo mit Schrift → gültig', farben.logoSichtbar(farben.logoPixel(pixel(40, 20, (x, y) => (y > 8 && y < 12 && x > 4 && x < 36 ? [20, 20, 20, 255] : [255, 255, 255, 255])))).ok === true);

/* 2. Plakette */
const gelbesQuadratMitWeissemKreis = pixel(30, 30, (x, y) => {
    const innen = (x - 15) ** 2 + (y - 15) ** 2 < 36;
    return x >= 3 && x < 27 && y >= 3 && y < 27 ? (innen ? [255, 255, 255, 255] : [247, 205, 1, 255]) : [0, 0, 0, 0];
});
pruefe('Verlust mit Raster: umschlossener weisser Kreis im gelben Quadrat geht auf Weiss nicht verloren', farben.verlustAuf(gelbesQuadratMitWeissemKreis, '#FFFFFF', 30).anteil === 0 && farben.verlustAuf(gelbesQuadratMitWeissemKreis, '#FFFFFF').anteil > 0.1);
pruefe('Verlust: kräftiges Gelb auf Weiss verschwindet nicht (anderer Farbton), Hellgrau schon', farben.verlustAuf(pixel(4, 4, () => [247, 205, 1, 255]), '#FFFFFF').anteil === 0 && farben.verlustAuf(pixel(4, 4, () => [235, 235, 235, 255]), '#FFFFFF').anteil === 1);
const weissMono = { umgebung: null, marke: '#D72027', hell: true, mittel: '#FFFFFF', einfarbig: true };
pruefe('Plakette: weisses Logo, Umgebung unbekannt → dunkel', farben.waehlePlakette(weissMono).art === 'dunkel');
pruefe('Plakette: weisses Logo in roter Website-Umgebung → Rot (wie auf der Website)', JSON.stringify(farben.waehlePlakette({ ...weissMono, umgebung: '#E30613' })) === '{"art":"umgebung","farbe":"#E30613"}');
pruefe('Plakette: Umgebung farbig, aber Kontrast < 3:1 → nicht die Umgebung', farben.waehlePlakette({ ...weissMono, umgebung: '#FAE600' }).art === 'dunkel');
pruefe('Plakette: Umgebung weiss/grau/beige zählt nicht als Website-Farbe', !farben.istFarbigeUmgebung('#FAFAF5') && !farben.istFarbigeUmgebung('#32373C') && !farben.istFarbigeUmgebung('#FFFFFF') && farben.istFarbigeUmgebung('#002D1E'));
pruefe('Plakette: Logo ohne eigene Farbe (currentColor, schwarz) + gelbe Marke → Marke (HR Campus)', farben.waehlePlakette({ umgebung: '#FAFAF5', marke: '#FAE600', hell: false, mittel: '#000000', einfarbig: true, ohneEigeneFarbe: true }).art === 'marke');
pruefe('Plakette: einfarbig gelbes Logo → dunkel statt weiss (3:1-Regel)', farben.waehlePlakette({ umgebung: null, marke: null, hell: false, mittel: '#FFEB1A', einfarbig: true }).art === 'dunkel');
pruefe('Plakette: helles Logo + sehr dunkle Marke → direkt auf der Marke (wie A-095)', farben.waehlePlakette({ umgebung: null, marke: '#1E3A5F', hell: true, mittel: '#FFFFFF', einfarbig: true }).art === 'marke');
pruefe('Plakette: mehrfarbiges Logo → Umgebung nur, wenn ≤ 12 % verloren', farben.waehlePlakette({ umgebung: '#002D1E', marke: null, hell: true, mittel: '#88AA88', einfarbig: false, verlust: () => 0.05 }).art === 'umgebung' && farben.waehlePlakette({ umgebung: '#002D1E', marke: null, hell: true, mittel: '#88AA88', einfarbig: false, verlust: () => 0.3 }).art === 'dunkel');

/* 2b. Logo-Umgebung aus CSS (Vorfahren-Kette) */
const idxCss = [
    'html{background:#FAFAF5}',
    '.site-header{background-color:var(--kopf)} :root{--kopf:#E30613}',
    '@media (max-width:767px){.site-header{background:#000}}',
    '.bg-\\[\\#FAE600\\]{background-color:rgb(250 230 0/var(--tw-bg-opacity,1))}',
    ':root :where(.wp-element-button,.wp-block-button__link){background-color:#32373c}',
    '.hero{background:url(x.jpg) center/cover}',
    '.site-header:hover{background:#00FF00}',
].join('\n');
const idx = umgebung.baueHintergrundIndex(idxCss);
const kette = (...k) => k.map(([tag, klassen]) => ({ tag, klassen }));
pruefe('Umgebung: Variable aufgelöst, @media max-width und :hover ignoriert', umgebung.bestimmeUmgebung(kette(['a', ['logo']], ['div', ['inner']], ['header', ['site-header']], ['body', []], ['html', []]), idx).farbe === '#E30613');
pruefe('Umgebung: Tailwind-Klasse mit Escapes (bg-[#FAE600])', umgebung.bestimmeUmgebung(kette(['div', ['bg-[#FAE600]']], ['body', []], ['html', []]), idx).farbe === '#FAE600');
pruefe('Umgebung: :where() gilt nur für passende Elemente (kein Allgemein-Treffer)', umgebung.bestimmeUmgebung(kette(['div', ['x']], ['body', []], ['html', []]), idx).farbe === '#FAFAF5');
pruefe('Umgebung: Hintergrundbild beendet die Suche (Grund unbekannt)', umgebung.bestimmeUmgebung(kette(['div', ['hero']], ['html', []]), idx).bild === true);
pruefe('Umgebung: nichts gefunden → Browser-Vorgabe Weiss', umgebung.bestimmeUmgebung(kette(['div', []], ['body', []]), umgebung.baueHintergrundIndex('')).farbe === '#FFFFFF');

/* 3. Markenfarbe, gewichtet */
const S = (farbe, gewicht, quelle) => ({ farbe, gewicht, quelle });
pruefe('Farbe: HR Campus (theme beige, Gelb im Manifest und 18× im CSS) → #FAE600', marke.bestimmeMarkenfarbe([S('#E6E6DC', 3, 'theme-color'), S('#FAE600', 2.5, 'manifest'), S('#FAE600', 2.5, 'haeufigkeit'), S('#F0C600', 1.5, 'haeufigkeit')])?.primaer === '#FAE600');
pruefe('Farbe: CSS-Variable --primary schlägt einzelne Häufigkeit', marke.bestimmeMarkenfarbe([S('#D72027', 5, 'css-variable'), S('#3366CC', 2.5, 'haeufigkeit')])?.quelle === 'css-variable');
pruefe('Farbe: Einigkeit gewinnt (Kopf + Häufigkeit + Logo gegen eine Variable)', marke.bestimmeMarkenfarbe([S('#1D9F74', 5, 'css-variable'), S('#E2002B', 4, 'hintergrund'), S('#E2002B', 2.5, 'haeufigkeit'), S('#E00029', 1.25, 'logo')])?.primaer === '#E2002B');
pruefe('Farbe: Framework-Standards (Swiper #007AFF, Wix #116DFF, Bootstrap #0062CC) nie Markenfarbe', marke.bestimmeMarkenfarbe([S('#007AFF', 5, 'css-variable'), S('#116DFF', 2.5, 'haeufigkeit'), S('#0062CC', 1.5, 'button')]) === null);
pruefe('Farbe: Grau, Weiss, Schwarz, Beige nie Markenfarbe', marke.bestimmeMarkenfarbe([S('#E6E6DC', 5, 'css-variable'), S('#333333', 4, 'hintergrund'), S('#FFFFFF', 3, 'theme-color')]) === null);
pruefe('Farbe: schwache Hinweise allein → keine Markenfarbe', marke.bestimmeMarkenfarbe([S('#2D62FF', 0.75, 'haeufigkeit')]) === null);
pruefe('Farbe: zuletzt Logo-Farbe (wie A-095)', marke.bestimmeMarkenfarbe([S('#2D62FF', 0.75, 'haeufigkeit'), S('#7CB938', 1.25, 'logo')])?.primaer === '#7CB938');
const hfg = marke.farbHaeufigkeit('.a{background-color:rgb(250 230 0/var(--tw-bg-opacity,1))}.b{color:#fae600}.c:hover{color:#f0c600}.d,.d:visited{color:#FAE600}.e{color:#007aff}');
pruefe('Häufigkeit: Tailwind-rgb() gezählt, Hover-Regel nicht, «a, a:visited» schon, Framework-Farbe nicht', hfg.length === 1 && hfg[0].farbe === '#FAE600' && hfg[0].anzahl === 3, JSON.stringify(hfg));
const cf = scanner.cssFarben(':root{--ast-global-color-0:#e2002b;--ast-global-color-1:#63b44a;--swiper-theme-color:#ff00aa;--primary-light:#ffd6d6}header.site-header{background:#123456}.header .btn{background:#00aa00}ul.nav li a{background:#D61818}');
pruefe('cssFarben: Astra color-0 = Hauptfarbe, color-1/Swiper/«-light» nicht', cf.variablen.length === 1 && cf.variablen[0].farbe === '#E2002B' && cf.variablen[0].gewicht === 5, JSON.stringify(cf.variablen));
pruefe('cssFarben: Kopf-Fläche und Navigationsleiste zählen, Button im Kopf nicht', cf.flaechen.includes('#123456') && cf.flaechen.includes('#D61818') && !cf.flaechen.includes('#00AA00'), JSON.stringify(cf.flaechen));

/* 4. Öffnungszeiten, Telefon, Adresse */
const ozFaelle = [
    ['PersonalSchweiz , 22.07.2025, HR-Prozesse: So bändigen Sie den Prozess-Dschungel erfolgreich', false],
    ['Erwachsene: Fr. 10.00', false],
    ['Dienstag, 17. November 2026, 09:00 bis 12:30 Uhr, vor Ort in Zürich', false],
    ['Kurs Pilates Mat Montag 18:00 – 19:00 mit Trainerin Laura im grossen Saal', false],
    ['So erreichen Sie uns: 052 222 18 18', false],
    ['Mo–Fr 08:30–17:30', true],
    ['Montag bis Donnerstag Vormittag 08.00 – 12.00 Uhr', true],
    ['täglich geöffnet von 11.30 - 23.00 Uhr', true],
    ['Mo. - Fr. 10 - 18.30 Uhr', true],
    ['Bürozeiten: 08:00–17:00 Uhr', true],
    ['Lundi - vendredi : 8h00 - 18h00', true],
];
const ozFalsch = ozFaelle.filter(([z, soll]) => oz.istOeffnungszeitZeile(z) !== soll).map(([z]) => z);
pruefe(`Öffnungszeiten: Tag/«Uhr» + Zeitspanne + kein Datum (${ozFaelle.length} Fälle)`, ozFalsch.length === 0, ozFalsch.join(' | '));
pruefe('Öffnungszeiten: zwei Spalten (Tage, dann Zeiten) richtig zugeordnet', oz.findeOeffnungszeiten(['Öffnungszeiten', 'Mittwoch', 'Freitag', 'Samstag', '12:00 bis 20:00', '07:00 bis 14:00', '08:00 bis 12:00', 'Impressum'])[0] === 'Mittwoch 12:00 bis 20:00; Freitag 07:00 bis 14:00; Samstag 08:00 bis 12:00');
pruefe('Öffnungszeiten: Tabelle «Tag» | «Zeit» und zweite Spanne', oz.findeOeffnungszeiten(['Öffnungszeiten:', 'Montag, Mittwoch, Donnerstag und Freitag:', '8:00 - 12:00 und 13:00 - 17:00', 'Dienstag:', '8:00 - 12.30 13.30 - 18:00'])[0] === 'Montag, Mittwoch, Donnerstag und Freitag: 8:00 - 12:00 und 13:00 - 17:00; Dienstag: 8:00 - 12.30 13.30 - 18:00');
pruefe('Öffnungszeiten: Zeiten einer Abteilung (B2B) sind nicht die des Betriebs', oz.findeOeffnungszeiten(['Firmenkunden / B2B', 'Ihre Berater für individuelle Geschenke.', '+41 44 224 46 26', 'Mo - Fr 08:00 - 17:00']).length === 0 && oz.findeOeffnungszeiten(['Firmenkunden / B2B', '+41 44 224 46 26', 'Öffnungszeiten', 'Mo - Fr08:00 - 17:00']).length === 0);
pruefe('Öffnungszeiten: «Mo - Fr» | «unter» | «7:30 - 17.00 Uhr» zusammengeführt', oz.findeOeffnungszeiten(['Haben Sie Fragen?', 'Sie erreichen uns', 'Mo - Fr', 'unter', '7:30 - 17.00 Uhr', '+41 44 224 47 40'])[0] === 'Mo - Fr 7:30 - 17.00 Uhr');
pruefe('Öffnungszeiten: Überschrift und Zeiten in einer Zeile', oz.findeOeffnungszeiten(['Öffnungszeiten: Mo–Fr 08:00–17:00', 'Impressum'])[0] === 'Öffnungszeiten: Mo–Fr 08:00–17:00');
pruefe('Öffnungszeiten: News-Teaser mit Datum → leer', oz.findeOeffnungszeiten(['Aktuell', 'PersonalSchweiz , 22.07.2025, HR-Prozesse: So bändigen Sie den Prozess-Dschungel erfolgreich']).length === 0);
pruefe('Öffnungszeiten-Text (KI): mit Datum ungültig, kompakte Form gültig', !oz.istOeffnungszeitText('Dienstag, 17. November 2026, 09:00 bis 12:30 Uhr') && oz.istOeffnungszeitText('Mo–Fr 08:00–12:00, 13:30–17:30; Sa 09:00–12:00'));
pruefe('Telefon: Fax in derselben Zeile wird nicht genommen', JSON.stringify(scanner.findeTelefone(['Tel. 052 222 33 44 | Fax 052 222 33 45'])) === '["+41522223344"]');
pruefe('Telefon: «T … F …»-Schreibweise (F = Fax)', JSON.stringify(scanner.findeTelefone(['T +41 52 222 33 44  F +41 52 222 33 45'])) === '["+41522223344"]');
pruefe('Telefon: Faxnummern erkannt (tel:-Links auf Fax aussortieren)', scanner.findeFaxnummern(['Telefax: 044 111 22 33']).has('+41441112233'));
pruefe('Telefon: nur CH/FL-Formate', scanner.findeTelefone(['+49 30 1234567', '+423 232 12 34', '052 222 18 18']).join(',') === '+4232321234,+41522221818');
pruefe('Adresse: PLZ 4-stellig + Ort', scanner.istAdresse('Kriesbachstrasse 3, 8600 Dübendorf') && !scanner.istAdresse('4 Eichstrasse Buchs, ZH, 8107 Switzerland') && !scanner.istAdresse('Hohlstrasse 418, 8048') && scanner.istAdresse('Städtle 1, 9490 Vaduz'));

/* 5a. Firmenname (Fehlerklasse aus der Messung A-096) */
const firma = (...a) => scanner.bestimmeFirma(...a).firma;
pruefe('Firma: Kürzel im Host (hcd → Hockey Club Davos, bscyb → BSC Young Boys)', firma(null, null, 'Hockey Club Davos - Startseite | Hockey Club Davos', 'www.hcd.ch') === 'Hockey Club Davos' && firma(null, null, ' HOME | BSC YOUNG BOYS - OFFIZIELLE INTERNETSEITE ', 'www.bscyb.ch') === 'BSC YOUNG BOYS');
pruefe('Firma: Zierzeichen und «: Home» entfernt', firma(null, null, '▷ Zahnarzt Winterthur | Ihre Spezialisten', 'www.zahnarzt-winterthur.ch') === 'Zahnarzt Winterthur' && firma(null, null, 'Stocker Tiefbau: Home', 'www.stocker-tiefbau.ch') === 'Stocker Tiefbau');
pruefe('Firma: og:site_name mit Zusatz → passender Teil', firma(null, 'Taxiphone Geneva - Official taxis', null, 'taxi-phone.ch') === 'Taxiphone Geneva');
pruefe('Firma: Titel ohne Namen → Name mit Rechtsform aus dem Text statt Host', firma(null, null, 'Massgefertigte Fenster und Türen nach höchsten Qualitätsstandards', 'www.huberfenster.ch', ['© 2026 Huber Fenster AG, Herisau']) === 'Huber Fenster AG');
pruefe('Firma: «… in Basel» weg, wenn der Name zum Host passt', firma(null, null, 'Ihre Bäckerei und Konditorei - Sutter Begg in Basel', 'www.sutterbegg.ch') === 'Sutter Begg');
pruefe('Sichtbarkeit: feine Schrift auf weissem JPEG (≈ 1 % Pixel) bleibt gültig', farben.logoSichtbar(farben.logoPixel(pixel(160, 34, (x, y) => (y === 17 && x > 20 && x < 120 ? [120, 200, 210, 255] : [255, 255, 255, 255])))).ok === true);

/* 5. Relative Logo-Pfade */
const kInline = { url: null, quelle: 'inline-svg', stufe: 1, punkte: 1, reihenfolge: 0, inhalt: '<svg/>' };
const kUrl = { url: 'https://x.ch/logo.svg', quelle: 'home-link-img', stufe: 1, punkte: 1, reihenfolge: 0 };
pruefe('logo_url an den Browser: immer relativer Proxy-Pfad (kein Host)', logo.logoUrlFuerProfil(kInline, 2, 's-abc') === '/api/demo/bild?s=s-abc&i=2' && logo.logoUrlFuerProfil(kUrl, 0, 's-abc').startsWith('/api/demo/bild?u='));
delete process.env.DEMO_OEFFENTLICHE_URL;
pruefe('logo_url an den Orchestrator: kein lokaler Host (0.0.0.0/localhost → null), öffentlich https → absolut', logo.logoUrlFuerAuftrag(kInline, 2, 's-abc', 'http://0.0.0.0:3000') === null && logo.logoUrlFuerAuftrag(kInline, 2, 's-abc', 'https://localhost:3000') === null && logo.logoUrlFuerAuftrag(kInline, 2, 's-abc', 'https://infraone.ch') === 'https://infraone.ch/api/demo/bild?s=s-abc&i=2' && logo.logoUrlFuerAuftrag(kUrl, 0, 's', 'http://0.0.0.0:3000') === 'https://x.ch/logo.svg');

console.log(`\n${gesamt - fehler}/${gesamt} Prüfungen bestanden.`);
process.exit(fehler ? 1 : 0);
