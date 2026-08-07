// AUFTRAG-012: 6 Admin-/Player-Screenshots nach public/images/signage-demo/ (WebP <= 300 KB)
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { statSync } from 'fs';
import path from 'path';

const outDir = path.resolve('public/images/signage-demo');
await mkdir(outDir, { recursive: true });

const SHOTS = 'C:/infraone-digital-signage-software/data/tmp/slides/shots';
const jobs = [
    ['admin-bildschirme', 85],
    ['admin-playlist-editor', 85],
    ['admin-playlists', 85],
    ['admin-layouts', 85],
    ['admin-medien', 85],
    ['player-beispiel', 85],
];

for (const [name, quality] of jobs) {
    const src = `${SHOTS}/${name}.png`;
    const out = path.join(outDir, `${name}.webp`);
    await sharp(src).webp({ quality }).toFile(out);
    let kb = statSync(out).size / 1024;
    if (kb > 300) {
        await sharp(src).webp({ quality: 70 }).toFile(out);
        kb = statSync(out).size / 1024;
    }
    console.log(`${name}.webp: ${kb.toFixed(1)} KB ${kb <= 300 ? 'OK' : 'ZU GROSS'}`);
}
