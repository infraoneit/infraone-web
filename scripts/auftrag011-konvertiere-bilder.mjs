import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';

const outDir = path.resolve('public/images/signage-demo');
await mkdir(outDir, { recursive: true });

const jobs = [
    ['C:/infraone-digital-signage-software/data/tmp/slides/shots/willkommen.png', 'demo-empfang.webp'],
    ['C:/infraone-digital-signage-software/data/tmp/slides/shots/solar.png', 'demo-solar.webp'],
    ['C:/infraone-digital-signage-software/data/tmp/slides/shots/tagesmenu.png', 'demo-tagesmenu.webp'],
    ['C:/infraone-digital-signage-software/data/tmp/slides/shots/raumbelegung.png', 'demo-raumbelegung.webp'],
    ['C:/infraone-digital-signage-software/data/tmp/slides/shots/mitarbeiterinfo.png', 'demo-mitarbeiterinfo.webp'],
    ['C:/.playwright-mcp/player-1.png', 'demo-kopplung.webp'],
    ['C:/.playwright-mcp/signage-playlists-v2.png', 'demo-verwaltung.webp'],
];

for (const [src, name] of jobs) {
    const out = path.join(outDir, name);
    const img = sharp(src);
    const meta = await img.metadata();
    const width = Math.min(meta.width, 1600);
    await img
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(out);
    const info = await sharp(out).metadata();
    const { statSync } = await import('fs');
    const kb = (statSync(out).size / 1024).toFixed(1);
    console.log(`${name}: ${meta.width}x${meta.height} -> ${info.width}x${info.height}, ${kb} KB`);
}
