// AUFTRAG-005: Blog-Cover/Inline-Bilder aus echten Quellen aufbereiten.
// Regeln: 16:9, zuschneiden statt verzerren, NIEMALS hochskalieren, Alpha erhalten.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'C:/Users/admin/Desktop/Bilder_Blog';
const OUT = 'C:/Users/admin/Documents/kimi/workspace/infraone-web/repo/public/images';

// Grösstmöglicher 16:9-Crop innerhalb der Quelle (kein Upscale), dann nur verkleinern auf max 1200x675.
async function processCover(srcFile, outName, position = 'attention') {
  const src = path.join(SRC, srcFile);
  const img = sharp(src, { density: 300 });
  const meta = await img.metadata();
  // Ziel: groesstmoegliches 16:9 innerhalb der Quelle, max 1200 px breit, NIE hochskalieren.
  let tw = Math.min(1200, meta.width);
  let th = Math.round(tw * 9 / 16);
  if (th > meta.height) {
    th = meta.height;
    tw = Math.round(th * 16 / 9);
  }
  // EIN einziges resize (sharp wendet sonst nur den letzten an) — fit cover schneidet zu, verzerrt nie.
  const pipeline = sharp(src, { density: 300 }).resize(tw, th, { fit: 'cover', position, withoutEnlargement: true });
  const out = path.join(OUT, outName);
  await pipeline.webp({ quality: 82 }).toFile(out);
  const m = await sharp(out).metadata();
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${outName}: ${m.width}x${m.height}, ${kb} KB (Quelle ${meta.width}x${meta.height}, pos=${position})`);
}

async function processInline(srcFile, outName, { keepSize = false } = {}) {
  const src = path.join(SRC, srcFile);
  const meta = await sharp(src).metadata();
  let pipeline = sharp(src, { density: 300 });
  if (!keepSize) {
    // 16:9 crop, max 1200x675, kein Upscale
    pipeline = pipeline.resize(1200, 675, { fit: 'cover', position: 'attention', withoutEnlargement: true });
  }
  const out = path.join(OUT, outName);
  await pipeline.webp({ quality: 82 }).toFile(out); // webp erhaelt Alpha
  const m = await sharp(out).metadata();
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${outName}: ${m.width}x${m.height}, alpha=${m.hasAlpha}, ${kb} KB (Quelle ${meta.width}x${meta.height})`);
}

const jobs = [
  // Covers (verbindliche Zuordnung)
  () => processCover('blog-cover-it-support-kosten-schweiz.webp', 'blog-cover-it-support-kosten-schweiz.webp'),
  () => processCover('blog-cover-it-trifft-ot.svg', 'blog-cover-it-trifft-ot.webp', 'centre'),
  () => processCover('blog-cover-prtg-netzwerkmonitoring.webp', 'blog-cover-prtg-netzwerkmonitoring.webp'),
  () => processCover('blog-cover-windows-11-admin-passwort-zuruecksetzen.webp', 'blog-cover-windows-11-admin-passwort-zuruecksetzen.webp', 'centre'),
  () => processCover('onpremvscloud-telefonie.jpg', 'blog-cover-cloud-telefonanlage-vs-on-premise.webp', 'centre'),
  () => processCover('hero-3cx-phone-system.webp', 'blog-cover-moderne-telefonie-peoplefone-3cx.webp'),
  () => processCover('hero-videowall-kvm-system-blackbox-emerald.webp', 'blog-cover-multimonitor-systeme-black-box-emerald.webp'),
  () => processCover('wago-sps-750-8101.webp', 'blog-cover-wago-codesys-migration.webp'),
  // Inline
  () => processInline('blackbox_kvm-system multimonitor videowall übersicht.jpg', 'blog-inline-multimonitor-systeme-black-box-emerald.webp'),
  () => processInline('bild für prtg blog, inline achtiung hintergund transaprent-remote-probes.png', 'blog-inline-prtg-netzwerkmonitoring.webp', { keepSize: true }),
];

for (const j of jobs) await j();
console.log('FERTIG');
