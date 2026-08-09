// AUFTRAG-016: Referenz-Screenshots (PNG) -> optimierte WebP fuer die Webdesign-Hero-Collage.
// Max. Breite 800px, Qualitaet 80, Ziel < 90 KB je Bild. Nutzt sharp (liegt via Next in node_modules).
import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'public/images/webdesign-hero-refs';
const WIDTH = 800;
const QUALITY = 80;

const pngs = readdirSync(DIR).filter(f => f.startsWith('ref-') && f.endsWith('.png'));
if (pngs.length === 0) {
    console.error('Keine ref-*.png Dateien gefunden in ' + DIR);
    process.exit(1);
}

for (const png of pngs) {
    const name = png.replace(/^ref-/, 'webdesign-ref-').replace(/\.png$/, '.webp');
    const out = join(DIR, name);
    await sharp(join(DIR, png))
        .resize({ width: WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(out);
    const kb = Math.round(statSync(out).size / 1024);
    console.log(`${png} -> ${name} (${kb} KB)${kb > 90 ? '  WARNUNG: ueber 90 KB!' : ''}`);
}
console.log('Fertig.');
