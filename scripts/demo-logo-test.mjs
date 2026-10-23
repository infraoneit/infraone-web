#!/usr/bin/env node
/**
 * demo-logo-test.mjs (AUFTRAG-095, erweitert AUFTRAG-096) — Logo-Erkennung des Demo-Scanners messen.
 *
 * Läuft direkt gegen scanneWebsite() (ohne Next-Server, ohne KI). Druckt je
 * Site das gewählte Logo (Quelle, Format, Grösse, hell) und die geprüften
 * Kandidaten mit Grund. Nur LESEN öffentlicher Seiten — keine Anrufe.
 *
 *   node scripts/demo-logo-test.mjs gmtec.ch ryserboeden.ch …
 *   node scripts/demo-logo-test.mjs --json ergebnis.json <url…>   (Rohdaten für die Tabelle)
 *   AUFTRAG-096: JSON zusätzlich mit Firma, Telefon, Öffnungszeiten, Adresse, Textlänge,
 *   Markenfarbe (+ Quelle) und Logo-Umgebung (Plakette).
 *
 * Node >= 22.18 (Type-Stripping).
 */
import { registerHooks } from 'node:module';
import { writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({
    resolve(spezifizierer, kontext, weiter) {
        let s = spezifizierer;
        if (s.startsWith('@/')) s = pathToFileURL(path.join(ROOT, 'src', s.slice(2))).href;
        try {
            return weiter(s, kontext);
        } catch (e) {
            if ((s.startsWith('.') || s.startsWith('file:')) && !/\.[cm]?[jt]sx?$/.test(s)) return weiter(s + '.ts', kontext);
            throw e;
        }
    },
});

const { scanneWebsite } = await import(pathToFileURL(path.join(ROOT, 'src/lib/demo/scanner.ts')).href);

const args = process.argv.slice(2);
let jsonZiel = null;
const urls = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') jsonZiel = args[++i];
    else urls.push(args[i]);
}
if (!urls.length) {
    console.error('Aufruf: node scripts/demo-logo-test.mjs [--json datei] <url…>');
    process.exit(2);
}

const kurzUrl = (u) => (u ? (u.length > 90 ? u.slice(0, 87) + '…' : u) : '(inline)');
const groesse = (k) => (k.breite && k.hoehe ? `${k.breite}×${k.hoehe}` : '?');
const aus = [];
for (const url of urls) {
    const t0 = Date.now();
    try {
        const scan = await scanneWebsite(url);
        const x = scan.extrakt;
        const logo = x.logo;
        console.log(`\n=== ${url}  (${scan.dauer_ms} ms, ${x.plattform ?? 'Plattform unbekannt'})`);
        if (logo) console.log(`  LOGO  ${logo.quelle} · ${logo.format} · ${groesse(logo)} · hell=${logo.hell} · ${kurzUrl(logo.url)}`);
        else console.log('  LOGO  — keines gültig');
        for (const k of x.logo_kandidaten.slice(0, 8)) {
            const status = k.gueltig === true ? 'ok ' : k.gueltig === false ? 'NEIN' : '–  ';
            console.log(`   ${status} S${k.stufe} ${String(k.punkte).padStart(3)}  ${k.quelle.padEnd(16)} ${(k.format ?? '?').padEnd(4)} ${groesse(k).padEnd(9)} ${k.grund ? '[' + k.grund + '] ' : ''}${kurzUrl(k.url)}`);
        }
        aus.push({
            url,
            ms: scan.dauer_ms,
            plattform: x.plattform,
            firma: x.firma,
            firma_quelle: x.firma_quelle,
            end_url: x.end_url,
            text_laenge: x.text.length,
            telefone: x.telefone,
            oeffnungszeiten: x.oeffnungszeiten,
            adressen: x.adressen,
            farben: x.farben,
            farbe_quelle: x.farbe_quelle ?? null,
            theme_color: x.theme_color,
            logo: logo ? { quelle: logo.quelle, format: logo.format, breite: logo.breite, hoehe: logo.hoehe, hell: logo.hell, transparenz: logo.transparenz, farbe: logo.farbe, url: logo.url, ms: logo.ms ?? null, umgebung: logo.umgebung ?? null } : null,
            kandidaten: x.logo_kandidaten.map((k) => ({ quelle: k.quelle, stufe: k.stufe, punkte: k.punkte, gueltig: k.gueltig ?? null, grund: k.grund ?? null, format: k.format ?? null, breite: k.breite ?? null, hoehe: k.hoehe ?? null, url: k.url })),
        });
    } catch (e) {
        console.log(`\n=== ${url}  FEHLER ${e.message}`);
        aus.push({ url, ms: Date.now() - t0, fehler: e.message });
    }
}
if (jsonZiel) {
    writeFileSync(path.resolve(process.cwd(), jsonZiel), JSON.stringify(aus, null, 2), 'utf8');
    console.log(`\nJSON geschrieben: ${jsonZiel}`);
}
