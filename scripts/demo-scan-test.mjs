#!/usr/bin/env node
/**
 * demo-scan-test.mjs (AUFTRAG-092) — Prüfskript für den Demo-Scanner.
 *
 * Läuft direkt gegen die Scanner- und Profil-Funktionen (src/lib/demo),
 * ohne Next-Server und ohne Netlify. Node >= 22.18 (Type-Stripping) nötig.
 *
 *   node scripts/demo-scan-test.mjs https://infraone.ch https://elektro-tel.ch
 *   node scripts/demo-scan-test.mjs --md auftraege/ergebnisse/A092-scan.md <url…>
 *   node scripts/demo-scan-test.mjs --ohne-ki <url…>     (nur Regel-Profil)
 *   node scripts/demo-scan-test.mjs --json <url…>        (Profil als JSON ausgeben)
 *
 * OPENAI_API_KEY wird aus .env.local gelesen (nie ausgegeben).
 * Es werden nur öffentliche Seiten gelesen — keine Anrufe.
 */
import { registerHooks } from 'node:module';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// .env.local laden (Werte werden nie ausgegeben)
const envDatei = path.join(ROOT, '.env.local');
if (existsSync(envDatei)) {
    for (const zeile of readFileSync(envDatei, 'utf8').split(/\r?\n/)) {
        const m = zeile.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}

// Auflösung wie im Next-Build: Pfade ohne Endung (.ts) und Alias @/ → src/
registerHooks({
    resolve(spezifizierer, kontext, weiter) {
        let s = spezifizierer;
        if (s.startsWith('@/')) s = pathToFileURL(path.join(ROOT, 'src', s.slice(2))).href;
        try {
            return weiter(s, kontext);
        } catch (e) {
            if ((s.startsWith('.') || s.startsWith('file:')) && !/\.[cm]?[jt]sx?$/.test(s)) {
                return weiter(s + '.ts', kontext);
            }
            throw e;
        }
    },
});

const { scanneWebsite } = await import('../src/lib/demo/scanner.ts');
const { baueProfil, regelProfil, profilFehler, KI_MODELL } = await import('../src/lib/demo/profil.ts');

const args = process.argv.slice(2);
let mdZiel = null;
let ohneKi = false;
let jsonAusgabe = false;
const urls = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--md') mdZiel = args[++i];
    else if (args[i] === '--ohne-ki') ohneKi = true;
    else if (args[i] === '--json') jsonAusgabe = true;
    else urls.push(args[i]);
}
if (!urls.length) {
    console.error('Aufruf: node scripts/demo-scan-test.mjs [--md datei] [--ohne-ki] [--json] <url…>');
    process.exit(2);
}

const kurz = (v, n = 70) => {
    if (v === null || v === undefined || v === '') return '–';
    const s = String(v).replace(/\s+/g, ' ');
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
};

const ergebnisse = [];
for (const url of urls) {
    const zeile = { url };
    const t0 = Date.now();
    try {
        const scan = await scanneWebsite(url);
        zeile.scanMs = scan.dauer_ms;
        zeile.seiten = scan.extrakt.seiten;
        zeile.plattform = scan.extrakt.plattform;
        const pe = ohneKi ? regelProfil(scan.extrakt) : await baueProfil(scan.extrakt);
        zeile.profilMs = pe.ms;
        zeile.quelle = pe.quelle;
        zeile.kiFehler = pe.fehler ?? null;
        zeile.verworfen = pe.verworfen ?? 0;
        zeile.profil = pe.profil;
        zeile.weiblich = pe.weiblich;
        zeile.schemaFehler = profilFehler(pe.profil);
        zeile.extrakt = scan.extrakt;
    } catch (e) {
        zeile.fehler = `${e.name}${e.code ? '/' + e.code : ''}: ${e.message}`;
        zeile.scanMs = Date.now() - t0;
    }
    ergebnisse.push(zeile);

    const p = zeile.profil;
    console.log(`\n=== ${url} ===`);
    const tabelle = [
        ['Firma', p?.firma],
        ['Assistent', p ? `${p.assistent_name} (${zeile.weiblich ? 'w' : 'm'})` : null],
        ['Branche', p?.branche],
        ['Telefon', p?.telefon],
        ['E-Mail', p?.email],
        ['Adresse', p?.adresse],
        ['Öffnungszeiten', p?.oeffnungszeiten_text],
        ['Logo-URL', p?.logo_url],
        ['Farben', p?.farben ? `${p.farben.primaer} / ${p.farben.sekundaer}` : null],
        ['Fähigkeiten', p?.faehigkeiten?.join(' · ')],
        ['Anzahl Wissen', p?.wissen?.length],
        ['Profil-Quelle', zeile.quelle ? `${zeile.quelle}${zeile.kiFehler ? ' (' + zeile.kiFehler + ')' : ''}${zeile.verworfen ? `, ${zeile.verworfen} KI-Einträge verworfen` : ''}` : null],
        ['Seiten gelesen', zeile.seiten ? `${zeile.seiten.filter((s) => !s.fehler).length}/${zeile.seiten.length}` : null],
        ['Plattform', zeile.plattform],
        ['Dauer Scan ms', zeile.scanMs],
        ['Dauer Profil ms', zeile.profilMs],
        ['Schema', zeile.schemaFehler ? (zeile.schemaFehler.length ? 'FEHLER: ' + zeile.schemaFehler.join(', ') : 'ok') : null],
        ['Fehler', zeile.fehler ?? null],
    ];
    const breite = Math.max(...tabelle.map(([k]) => k.length));
    for (const [k, v] of tabelle) console.log(`  ${k.padEnd(breite)}  ${kurz(v, 110)}`);
    if (jsonAusgabe && p) console.log(JSON.stringify(p, null, 2));
}

// Zusammenfassung
const ok = ergebnisse.filter((e) => e.profil);
const zaehle = (fn) => `${ok.filter(fn).length}/${ergebnisse.length}`;
const ziel = {
    firma: zaehle((e) => !!e.profil.firma && e.extrakt.firma_quelle !== 'host'),
    logo: zaehle((e) => !!e.profil.logo_url),
    telefon: zaehle((e) => !!e.profil.telefon),
    wissen8: zaehle((e) => e.profil.wissen.length >= 8),
    unter8s: zaehle((e) => e.scanMs < 8000),
};
console.log('\n=== Zusammenfassung ===');
console.log(`  Firma ${ziel.firma} · Logo ${ziel.logo} · Telefon ${ziel.telefon} · Wissen>=8 ${ziel.wissen8} · Scan<8s ${ziel.unter8s}`);

if (mdZiel) {
    const esc = (v) => kurz(v, 90).replace(/\|/g, '\\|');
    const zeitpunkt = new Date().toLocaleString('de-CH', { timeZone: 'Europe/Zurich' });
    let md = `# AUFTRAG-092 — Scan-Ergebnisse (Pflicht-Sites)\n\n`;
    md += `Erzeugt mit \`node scripts/demo-scan-test.mjs --md ${mdZiel} ${urls.join(' ')}\` am ${zeitpunkt}.\n`;
    md += `Scanner ohne Browser-Automation (Startseite + bis 5 Unterseiten + bis 3 Stylesheets parallel, Budget 8 s). `;
    md += `Profil: ${ohneKi ? 'nur Regeln' : `KI \`${KI_MODELL}\` (Temperatur 0.2, json_schema strict) mit Rückfall auf Regeln`}.\n\n`;
    md += `| Site | Firma | Telefon | E-Mail | Adresse | Öffnungszeiten | Logo-URL | Farben | Wissen | Scan ms | Profil ms | Fehler |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
    for (const e of ergebnisse) {
        const p = e.profil;
        md += `| ${esc(e.url)} | ${esc(p?.firma)} | ${esc(p?.telefon)} | ${esc(p?.email)} | ${esc(p?.adresse)} | ${esc(p?.oeffnungszeiten_text)} | ${esc(p?.logo_url)} | ${esc(p?.farben ? p.farben.primaer + ' / ' + p.farben.sekundaer : null)} | ${p ? p.wissen.length : '–'} | ${e.scanMs ?? '–'} | ${e.profilMs ?? '–'} | ${esc(e.fehler ?? e.kiFehler ?? (e.schemaFehler?.length ? 'Schema: ' + e.schemaFehler.join(', ') : null))} |\n`;
    }
    md += `\n**Ziele:** Firma ${ziel.firma} (Ziel 4/4) · Logo ${ziel.logo} (4/4) · Telefon ${ziel.telefon} (≥ 3/4) · Wissen ≥ 8 ${ziel.wissen8} (4/4) · Scan < 8 s ${ziel.unter8s} (4/4)\n\n`;
    md += `Firma zählt nur, wenn sie aus JSON-LD, og:site_name oder dem Titel stammt (nicht aus dem Hostnamen).\n\n`;
    md += `## Details je Site\n\n`;
    for (const e of ergebnisse) {
        md += `### ${e.url}\n\n`;
        if (!e.profil) {
            md += `Fehler: ${e.fehler}\n\n`;
            continue;
        }
        const p = e.profil;
        md += `- Assistent: ${p.assistent_name} (${e.weiblich ? 'KI-Telefonassistentin' : 'KI-Telefonassistent'}), Branche \`${p.branche}\`, Quelle ${e.quelle}${e.kiFehler ? ' (' + e.kiFehler + ')' : ''}${e.verworfen ? `, ${e.verworfen} KI-Einträge mangels Beleg verworfen` : ''}\n`;
        md += `- Fähigkeiten: ${p.faehigkeiten.join(' · ')}\n`;
        md += `- Plattform: ${e.plattform ?? 'unbekannt'}; Seiten: ${e.seiten.map((s) => `${s.url.replace(/^https?:\/\//, '')} (${s.fehler ? 'Fehler: ' + s.fehler : s.ms + ' ms'})`).join(', ')}\n`;
        md += `- Logo-Kandidaten: ${e.extrakt.logo_kandidaten.map((k) => `${k.quelle}`).join(', ') || 'keine'}\n`;
        md += `- Firmentext: ${kurz(p.firma_text, 400)}\n`;
        md += `- Wissen (Fragen): ${p.wissen.map((w) => w.frage).join(' / ')}\n\n`;
    }
    writeFileSync(path.resolve(process.cwd(), mdZiel), md, 'utf8');
    console.log(`\nMarkdown geschrieben: ${mdZiel}`);
}
