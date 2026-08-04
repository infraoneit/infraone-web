// AUFTRAG-005: PNG-Fotos in public/images nach WebP konvertieren (q82, max 1920px),
// Referenzen im Code mitziehen, PNG-Originale loeschen.
// Ausnahmen: partners/ (Logos, klein), offer/ (Grafiken mit Alpha/scharfen Kanten), Dateien <100 KB.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REPO = 'C:/Users/admin/Documents/kimi/workspace/infraone-web/repo';
const IMG = path.join(REPO, 'public/images');
const SKIP_DIRS = ['partners', 'offer'];
const MIN_KB = 100;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const converted = []; // {png, webp, beforeKB, afterKB, dims}
for (const file of [...walk(IMG)]) {
  if (!file.toLowerCase().endsWith('.png')) continue;
  const rel = path.relative(IMG, file);
  if (SKIP_DIRS.some((d) => rel.startsWith(d + path.sep) || rel.startsWith(d + '/'))) continue;
  const kb = fs.statSync(file).size / 1024;
  if (kb < MIN_KB) continue;
  const webpPath = file.replace(/\.png$/i, '.webp');
  const meta = await sharp(file).metadata();
  await sharp(file)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(webpPath);
  const afterKB = fs.statSync(webpPath).size / 1024;
  converted.push({ rel, webpRel: path.relative(IMG, webpPath), beforeKB: Math.round(kb), afterKB: Math.round(afterKB), dims: `${meta.width}x${meta.height}`, alpha: meta.hasAlpha });
}

// Referenzen in src/, content/, keystatic.config.ts ersetzen (pro Dateiname) — pure Node, kein grep
const TEXT_EXT = ['.tsx', '.ts', '.json', '.mdoc', '.md'];
function* walkCode(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      yield* walkCode(p);
    } else if (TEXT_EXT.includes(path.extname(e.name))) yield p;
  }
}
const codeFiles = [path.join(REPO, 'keystatic.config.ts')];
for (const d of ['src', 'content']) codeFiles.push(...walkCode(path.join(REPO, d)));
let refFiles = new Set();
for (const c of converted) {
  const base = path.basename(c.rel);
  const newBase = base.replace(/\.png$/i, '.webp');
  for (const f of codeFiles) {
    const txt = fs.readFileSync(f, 'utf8');
    if (txt.includes(base)) {
      fs.writeFileSync(f, txt.split(base).join(newBase));
      refFiles.add(path.relative(REPO, f));
    }
  }
}

// Originale loeschen
for (const c of converted) fs.unlinkSync(path.join(IMG, c.rel));

console.log('=== KONVERTIERT ===');
let before = 0, after = 0;
for (const c of converted) {
  before += c.beforeKB; after += c.afterKB;
  console.log(`${c.rel} (${c.dims}${c.alpha ? ', alpha' : ''}): ${c.beforeKB} KB -> ${c.afterKB} KB`);
}
console.log(`SUMME: ${before} KB -> ${after} KB`);
console.log('=== REFERENZEN ANGEPASST IN ===');
for (const f of [...refFiles].sort()) console.log(f);
console.log('FERTIG');
