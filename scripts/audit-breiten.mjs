#!/usr/bin/env node
/**
 * audit-breiten.mjs (AUFTRAG-013) — Dauerprüfung Breiten-Konsistenz
 *
 * Regel: Strukturelle Blöcke (Karten, Grids, Formulare, FAQ-Listen, Rechner,
 * Galerien) spannen die volle Container-Breite. Ein `max-w-(xl|…|7xl)
 * mx-auto` auf einem strukturellen Element ist ein Verstoss.
 *
 * Heuristik: Eine Fundzeile, die `<p`, `text-` oder `subtitle` enthält, gilt als
 * Typografie (Regel 2: Fliesstext/Untertitel bleiben schmal) und wird ignoriert.
 * Begründete Ausnahmen stehen in scripts/audit-breiten-whitelist.txt
 * (Format pro Zeile: <relativer/pfad.tsx> <max-w-token> # Begründung).
 *
 * Exit-Code 1 bei nicht-gewhitelisteten Treffern, Ausgabe Datei:Zeile.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const srcRoot = join(repoRoot, 'src');
const whitelistPath = join(repoRoot, 'scripts', 'audit-breiten-whitelist.txt');

const MAXW_RE = /max-w-(xl|2xl|3xl|4xl|5xl|6xl|7xl)\b/;
const TYPO_HINT_RE = /<p|text-|subtitle/;

/** Rekursiv alle Source-Dateien unter src/ sammeln. */
function collectFiles(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) collectFiles(full, out);
        else if (/\.(tsx|ts|jsx|js)$/.test(entry)) out.push(full);
    }
    return out;
}

/** Whitelist laden: Map<relpath, Set<token>> — deckt alle Treffer der Datei mit diesem Token ab. */
function loadWhitelist() {
    const map = new Map();
    let lines;
    try {
        lines = readFileSync(whitelistPath, 'utf8').split(/\r?\n/);
    } catch {
        return map;
    }
    for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const [pathPart, tokenPart] = line.split('#')[0].trim().split(/\s+/);
        if (!pathPart || !tokenPart) continue;
        const rel = pathPart.replace(/\//g, sep);
        if (!map.has(rel)) map.set(rel, new Set());
        map.get(rel).add(tokenPart);
    }
    return map;
}

const whitelist = loadWhitelist();
const violations = [];

for (const file of collectFiles(srcRoot)) {
    const rel = relative(repoRoot, file);
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
        if (!MAXW_RE.test(line) || !line.includes('mx-auto')) return;
        if (TYPO_HINT_RE.test(line)) return; // Regel 2: Typografie
        const token = line.match(MAXW_RE)[0];
        const allowed = whitelist.get(rel);
        if (allowed && allowed.has(token)) return; // begründete Ausnahme
        violations.push(`${rel.replace(/\\/g, '/')}:${i + 1}  ${token}  ${line.trim().slice(0, 120)}`);
    });
}

if (violations.length > 0) {
    console.error(`VERSTOESSE (${violations.length}):`);
    for (const v of violations) console.error(`  ${v}`);
    process.exit(1);
}
console.log('OK: 0 Verstoesse (alle strukturellen Bloecke volle Container-Breite, Ausnahmen gewhitelistet).');
