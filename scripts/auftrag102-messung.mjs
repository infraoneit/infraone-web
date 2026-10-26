#!/usr/bin/env node
/**
 * auftrag102-messung.mjs (AUFTRAG-102, Teil 2) — Scanner vorher/nachher auf denselben Sites.
 *
 * Läuft direkt gegen scanneWebsite() zweier Code-Stände (ohne Next-Server):
 *   --vorher <ordner>   Stand vor dem Auftrag (Kopie von src/lib/demo unter <ordner>/src/lib/demo)
 *   --nachher <ordner>  aktueller Stand (Standard: dieses Repo)
 * Je Site und Lauf abwechselnd vorher/nachher (gleiche Netzlage). Erfasst: Scan-ms, Seiten,
 * Team-Seiten, Textlänge, Abschnitte, Personen (Name, Rolle), Logo (Quelle, Format, Adresse bzw.
 * Hash des Inline-SVG), Markenfarbe (+ Quelle) und — mit --ki — die Wissens-Einträge des
 * KI-Profils (sonst des Regel-Profils).
 *
 *   node scripts/auftrag102-messung.mjs --vorher <ordner> --json aus.json --laeufe 2 --ki bint.ch unipoint.ch …
 *
 * Nur LESEN öffentlicher Seiten — keine Anrufe. Node >= 22.18 (Type-Stripping).
 */
import { registerHooks } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAKETE = pathToFileURL(path.join(ROOT, 'package.json')).href;

// .env.local laden (OPENAI_API_KEY für --ki; Werte werden nie ausgegeben)
const envDatei = path.join(ROOT, '.env.local');
if (existsSync(envDatei)) {
    for (const zeile of readFileSync(envDatei, 'utf8').split(/\r?\n/)) {
        const m = zeile.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}

const args = process.argv.slice(2);
const opt = { vorher: null, nachher: ROOT, json: null, laeufe: 1, ki: false, sites: [] };
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--vorher') opt.vorher = path.resolve(args[++i]);
    else if (args[i] === '--nachher') opt.nachher = path.resolve(args[++i]);
    else if (args[i] === '--json') opt.json = path.resolve(args[++i]);
    else if (args[i] === '--laeufe') opt.laeufe = Number(args[++i]);
    else if (args[i] === '--ki') opt.ki = true;
    else opt.sites.push(args[i]);
}
if (!opt.sites.length) {
    console.error('Aufruf: node scripts/auftrag102-messung.mjs [--vorher <ordner>] [--json datei] [--laeufe n] [--ki] <site…>');
    process.exit(2);
}

// Auflösung wie im Next-Build: @/ → <stand>/src, Pfade ohne Endung → .ts, Pakete aus diesem Repo
registerHooks({
    resolve(s, k, weiter) {
        let x = s;
        if (x.startsWith('@/')) {
            const von = k.parentURL ? fileURLToPath(k.parentURL) : ROOT;
            const stand = von.includes(`${path.sep}src${path.sep}`) ? von.slice(0, von.indexOf(`${path.sep}src${path.sep}`)) : ROOT;
            x = pathToFileURL(path.join(stand, 'src', x.slice(2))).href;
        }
        try {
            return weiter(x, k);
        } catch (e) {
            if ((x.startsWith('.') || x.startsWith('file:')) && !/\.[cm]?[jt]sx?$/.test(x)) return weiter(x + '.ts', k);
            if (!x.startsWith('.') && !x.startsWith('file:') && !x.startsWith('node:')) return weiter(x, { ...k, parentURL: PAKETE });
            throw e;
        }
    },
});

async function stand(ordner) {
    const lade = (p) => import(pathToFileURL(path.join(ordner, 'src/lib/demo', p)).href);
    return { scanner: await lade('scanner.ts'), profil: await lade('profil.ts') };
}
const staende = { nachher: await stand(opt.nachher) };
if (opt.vorher) staende.vorher = await stand(opt.vorher);

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

async function messe(name, site) {
    const { scanner, profil } = staende[name];
    const t0 = Date.now();
    try {
        const scan = await scanner.scanneWebsite(site);
        const x = scan.extrakt;
        const r = { stand: name, site, ms: scan.dauer_ms };
        r.seiten = x.seiten.filter((s) => !s.fehler && s.art !== 'team').length;
        r.seiten_fehler = x.seiten.filter((s) => s.fehler).length;
        r.team_seiten = x.team_seiten ?? 0;
        r.text = x.text.length;
        r.abschnitte = x.abschnitte.length;
        r.personen = (x.personen ?? []).map((p) => ({ name: p.name, rolle: p.rolle, ...(p.zustaendigkeit ? { zustaendigkeit: p.zustaendigkeit } : {}) }));
        r.logo = x.logo ? { quelle: x.logo.quelle, format: x.logo.format, id: x.logo.url ?? `inline:${sha(x.logo.inhalt ?? '')}` } : null;
        r.farbe = x.farben?.primaer ?? null;
        r.farbe_quelle = x.farbe_quelle ?? null;
        r.firma = x.firma;
        r.telefon = x.telefone[0] ?? null;
        // wie POST /api/demo/profil: Team-Seiten, für die das Scan-Budget nicht reichte, vor dem Profil nachladen
        if (scanner.ergaenzeTeam && x.team_offen?.length) {
            r.team_offen = x.team_offen.length;
            const t = await scanner.ergaenzeTeam(x);
            r.team_nachgeladen = t.geladen;
            r.team_nachladen_ms = t.ms;
            r.personen = (x.personen ?? []).map((p) => ({ name: p.name, rolle: p.rolle, ...(p.zustaendigkeit ? { zustaendigkeit: p.zustaendigkeit } : {}) }));
        }
        const p = opt.ki ? await profil.baueProfil(x) : profil.regelProfil(x);
        r.profil_quelle = p.quelle;
        r.ki_fehler = p.fehler ?? null;
        r.wissen = p.profil.wissen.length;
        r.wissen_team = p.profil.wissen.filter((w) => w.thema === 'team').map((w) => `${w.frage} → ${w.antwort}`);
        r.schemafehler = profil.profilFehler(p.profil);
        return r;
    } catch (e) {
        return { stand: name, site, ms: Date.now() - t0, fehler: `${e.name}${e.code ? '/' + e.code : ''}: ${e.message}` };
    }
}

const ergebnisse = opt.json && existsSync(opt.json) ? JSON.parse(readFileSync(opt.json, 'utf8')) : [];
for (let lauf = 0; lauf < opt.laeufe; lauf++) {
    for (const site of opt.sites) {
        // abwechselnd zuerst vorher bzw. nachher, damit die Netzlage beide gleich trifft
        const reihe = staende.vorher ? (lauf % 2 === 0 ? ['vorher', 'nachher'] : ['nachher', 'vorher']) : ['nachher'];
        for (const name of reihe) {
            const r = await messe(name, site);
            r.lauf = lauf + 1;
            ergebnisse.push(r);
            console.log(
                `${name.padEnd(7)} ${site.padEnd(28)} ${String(r.ms).padStart(5)} ms  Seiten ${r.seiten ?? '–'}+${r.team_seiten ?? 0}T${r.team_offen ? `(+${r.team_nachgeladen}/${r.team_offen} im Profil, ${r.team_nachladen_ms} ms)` : ''}  Text ${String(r.text ?? '–').padStart(5)}  Personen ${String(r.personen?.length ?? '–').padStart(2)}  Wissen ${String(r.wissen ?? '–').padStart(2)} (Team ${r.wissen_team?.length ?? 0})  Logo ${r.logo ? `${r.logo.quelle}/${r.logo.format}` : '–'}  Farbe ${r.farbe ?? '–'}${r.fehler ? '  FEHLER ' + r.fehler : ''}`,
            );
            if (opt.json) writeFileSync(opt.json, JSON.stringify(ergebnisse, null, 1));
        }
    }
}

// Zusammenfassung je Stand
const perz = (liste, p) => {
    const s = [...liste].sort((a, b) => a - b);
    return s.length ? s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] : null;
};
for (const name of Object.keys(staende)) {
    const r = ergebnisse.filter((e) => e.stand === name && !e.fehler);
    const ms = r.map((e) => e.ms);
    console.log(`\n${name}: ${r.length} Scans, p50 ${perz(ms, 50)} ms, p90 ${perz(ms, 90)} ms, max ${Math.max(...ms)} ms, über 8 s: ${ms.filter((m) => m > 8000).length}, Fehler: ${ergebnisse.filter((e) => e.stand === name && e.fehler).length}`);
}
