#!/usr/bin/env node
/**
 * auftrag102-parallel-test.mjs (AUFTRAG-102, Teil 3) — gleichzeitige Scans verschiedener
 * Firmen gegen einen Deploy (Standard: Branch-Deploy) und Vergleich der Ergebnisse.
 *
 * Je Runde laufen 2–3 Abläufe GLEICHZEITIG: POST /api/demo/scan → POST /api/demo/profil
 * → jedes Bild aus den Antworten (profil.logo_url, logos[].src) 3× abrufen. Verglichen werden
 * Firma, scan_id (Scan- und Profil-Antwort), logo_url, Farbe und die Bild-Bytes (SHA-256)
 * gegen das Original: bei `?u=` die Datei direkt von der Website (SVG: mit derselben
 * Bereinigung wie der Proxy), bei Scan-Logos (Pfad bzw. `?s=`) die Inline-Logos eines
 * lokalen Scans derselben Site. Jede Abweichung wird mit Rohdaten (Kopfzeilen, Hash,
 * Länge) festgehalten.
 *
 * NUR Scans, Profile und Bilder — NIE /api/demo/anruf.
 * Auf Netlify gilt das Scan-Limit (3 je IP und Stunde, nicht abschaltbar): Antwortet der
 * Scan mit 429, nimmt die Runde mit `--wiederverwenden` die letzte gültige scan_id derselben
 * Site aus der JSON-Datei (Profil und Bilder laufen trotzdem gleichzeitig) und vermerkt das.
 *
 *   node scripts/auftrag102-parallel-test.mjs --json ../auftraege/ergebnisse/A102-parallel.json
 *   node scripts/auftrag102-parallel-test.mjs --basis http://localhost:3000 --runden 3 --json x.json
 *   Optionen: --sites bint.ch,unipoint.ch,elektro-tel.ch  --runden 1  --wiederverwenden  --ohne-scan
 *
 * Node >= 22.18 (Type-Stripping).
 */
import { registerHooks } from 'node:module';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

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
const { bereinigeSvg } = await import(pathToFileURL(path.join(ROOT, 'src/lib/demo/logo.ts')).href);
const { scanneWebsite } = await import(pathToFileURL(path.join(ROOT, 'src/lib/demo/scanner.ts')).href);

const args = process.argv.slice(2);
const opt = { basis: 'https://feat-ki-telefonassistent--infraoneweb.netlify.app', runden: 1, sites: ['bint.ch', 'unipoint.ch', 'elektro-tel.ch'], json: null, wiederverwenden: false, ohneScan: false, pause: 0 };
for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--basis') opt.basis = args[++i].replace(/\/+$/, '');
    else if (a === '--runden') opt.runden = Number(args[++i]);
    else if (a === '--sites') opt.sites = args[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--json') opt.json = path.resolve(args[++i]);
    else if (a === '--wiederverwenden') opt.wiederverwenden = true;
    else if (a === '--ohne-scan') opt.ohneScan = true;
    else if (a === '--pause-s') opt.pause = Number(args[++i]) * 1000;
}
if (/\/api\/demo\/anruf/.test(opt.basis)) throw new Error('nie Anrufe');

/** Erwartete Firma je Site (Teilwort, ohne Gross-/Kleinschreibung). */
const ERWARTET = { 'bint.ch': /bint/i, 'unipoint.ch': /unipoint/i, 'elektro-tel.ch': /elektro.?tel/i };
const hostVon = (s) => s.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const KOPF = ['cache-status', 'age', 'cache-control', 'netlify-vary', 'vary', 'content-type', 'content-length', 'x-nf-request-id'];

function kopfzeilen(res) {
    const k = {};
    for (const name of KOPF) {
        const v = name === 'cache-status' && typeof res.headers.getSetCookie === 'function' ? res.headers.get(name) : res.headers.get(name);
        if (v !== null) k[name] = v;
    }
    return k;
}

async function holeJson(url, body) {
    const t0 = Date.now();
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const text = await res.text();
    let json = null;
    try {
        json = JSON.parse(text);
    } catch {
        /* kein JSON */
    }
    return { status: res.status, ms: Date.now() - t0, json, kopf: kopfzeilen(res) };
}

async function holeBild(url) {
    const t0 = Date.now();
    try {
        const res = await fetch(url, { headers: { Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' } });
        const buf = Buffer.from(await res.arrayBuffer());
        return { status: res.status, ms: Date.now() - t0, bytes: buf.length, sha256: sha(buf), kopf: kopfzeilen(res), _buf: buf };
    } catch (e) {
        return { status: null, ms: Date.now() - t0, fehler: e.message };
    }
}

/** Original eines `?u=`-Bildes: direkt von der Website; SVG wie im Proxy bereinigt. */
const originalCache = new Map();
async function original(u) {
    if (originalCache.has(u)) return originalCache.get(u);
    const p = (async () => {
        try {
            const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (InfraOne-Demo-Test A102)' } });
            const buf = Buffer.from(await res.arrayBuffer());
            const kopf = buf.subarray(0, 600).toString('utf8');
            const svg = /<svg[\s>]/i.test(kopf) || /svg/i.test(res.headers.get('content-type') || '');
            const bereinigt = svg ? bereinigeSvg(buf.toString('utf8')) : null;
            return { status: res.status, bytes: buf.length, sha256_roh: sha(buf), sha256_bereinigt: bereinigt ? sha(Buffer.from(bereinigt, 'utf8')) : null, svg };
        } catch (e) {
            return { status: null, fehler: e.message };
        }
    })();
    originalCache.set(u, p);
    return p;
}

/** Referenz je Site aus einem lokalen Scan: Hashes der Inline-/data:-Logos und Logo-URLs. */
const referenz = new Map();
async function referenzVon(site) {
    if (referenz.has(site)) return referenz.get(site);
    const p = (async () => {
        try {
            const s = await scanneWebsite(site);
            const inline = [];
            const urls = [];
            for (const k of s.extrakt.logo_kandidaten) {
                if (k.inhalt && k.quelle === 'inline-svg') inline.push(sha(Buffer.from(k.inhalt, 'utf8')));
                else if (k.inhalt) {
                    const m = k.inhalt.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/i);
                    if (m) {
                        const body = m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8');
                        const svg = /svg/i.test(m[1]) ? bereinigeSvg(body.toString('utf8')) : null;
                        inline.push(sha(svg ? Buffer.from(svg, 'utf8') : body));
                    }
                }
                if (k.url) urls.push(k.url);
            }
            return { firma: s.extrakt.firma, farbe: s.extrakt.farben?.primaer ?? null, logo_url: s.extrakt.logo?.url ?? null, inline, urls };
        } catch (e) {
            return { fehler: e.message, inline: [], urls: [] };
        }
    })();
    referenz.set(site, p);
    return p;
}

function bildUrls(scan, profil) {
    const liste = [];
    const dazu = (src, woher, url = null) => {
        if (!src) return;
        const da = liste.find((x) => x.src === src);
        if (da) {
            da.url = da.url ?? url;
            return;
        }
        liste.push({ src, woher, url });
    };
    for (const l of scan?.logos ?? []) dazu(l.src, `scan.logos[${l.index}]`, l.url ?? null);
    dazu(scan?.profil?.logo_url, 'scan.profil.logo_url');
    dazu(profil?.profil?.logo_url, 'profil.profil.logo_url');
    return liste;
}

/** Ohne Scan (Scan-Route nicht verfügbar): Proxy direkt mit den Logo-Adressen des lokalen Referenz-Scans prüfen. */
async function bildUrlsOhneScan(site) {
    const ref = await referenzVon(site);
    const liste = [];
    if (ref.logo_url) liste.push({ src: `/api/demo/bild?u=${encodeURIComponent(ref.logo_url)}`, woher: 'Referenz-Logo über ?u= (Format des Deploys)', url: ref.logo_url });
    // unbekannte Scan-Kennung: richtig ist 404 (JSON); ein Bild hier kommt aus einem fremden Cache-Eintrag
    liste.push({ src: `/api/demo/bild?s=s-${'0'.repeat(16)}&i=0`, woher: 'unbekannter Scan über ?s= (erwartet 404)', erwartet404: true });
    return liste;
}

/** Welche Site hat ein Logo mit diesem Hash (Original roh/bereinigt oder Inline)? */
async function siteMitHash(hash) {
    const treffer = [];
    for (const s of opt.sites) {
        const r = await referenzVon(s);
        if (r.inline.includes(hash)) treffer.push(s);
        else if (r.logo_url) {
            const o = await original(r.logo_url);
            if (o.sha256_roh === hash || o.sha256_bereinigt === hash) treffer.push(s);
        }
    }
    return treffer;
}

/** Bewertet ein Bild: 3 Abrufe gleich? Gleich dem Original der eigenen Site? Sonst: wessen Logo? */
async function pruefeBild(site, eintrag, abrufe) {
    const hashes = [...new Set(abrufe.map((a) => a.sha256).filter(Boolean))];
    const ohnePuffer = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== '_buf'));
    const ergebnis = { src: eintrag.src, woher: eintrag.woher, abrufe: abrufe.map(ohnePuffer), drei_gleich:hashes.length === 1 && abrufe.every((a) => a.status === abrufe[0].status) };
    const abs = new URL(eintrag.src, opt.basis);
    const u = abs.searchParams.get('u') ?? eintrag.url ?? null;
    if (eintrag.erwartet404) {
        ergebnis.gleich_original = abrufe.every((a) => a.status === 404);
        if (!ergebnis.gleich_original) {
            const wer = hashes.length ? await siteMitHash(hashes[0]) : [];
            ergebnis.befund = `statt 404: HTTP ${abrufe.map((a) => a.status).join('/')} ${abrufe[0]?.kopf?.['content-type'] ?? ''}${wer.length ? ` = Logo von ${wer.join(', ')}` : ''}`;
            if (wer.length) ergebnis.gleich_fremder_site = wer;
        }
        return ergebnis;
    }
    if (u) {
        ergebnis.original_url = u;
        ergebnis.original_host_passt = hostVon(u).endsWith(hostVon(site));
        const o = await original(u);
        ergebnis.original = o;
        ergebnis.gleich_original = !!o.sha256_roh && hashes.length === 1 && abrufe.every((a) => a.status === 200) && (hashes[0] === o.sha256_roh || hashes[0] === o.sha256_bereinigt);
    } else {
        const ref = await referenzVon(site);
        ergebnis.original = { art: 'lokaler Scan, Inline-/data:-Logos', anzahl: ref.inline.length };
        ergebnis.gleich_original = hashes.length === 1 && ref.inline.includes(hashes[0]);
    }
    if (!ergebnis.gleich_original && hashes.length) {
        const wer = (await siteMitHash(hashes[0])).filter((s) => s !== site);
        if (wer.length) ergebnis.gleich_fremder_site = wer;
    }
    return ergebnis;
}

function letzteScanId(daten, site) {
    for (const lauf of [...(daten.runden ?? [])].reverse()) {
        const e = lauf.ablaeufe?.find((x) => x.site === site && x.scan_id && x.profil_status === 200);
        if (e) return e.scan_id;
    }
    return null;
}

async function ablauf(site, daten, rundeNr) {
    const e = { site, start: new Date().toISOString() };
    let scan = null;
    if (!opt.ohneScan) {
        const r = await holeJson(`${opt.basis}/api/demo/scan`, { url: site });
        e.scan_status = r.status;
        e.scan_ms = r.ms;
        if (r.status === 200 && r.json?.scan_id) {
            scan = r.json;
            e.scan_id = scan.scan_id;
            e.art = 'neuer Scan';
        } else {
            e.scan_fehler = r.json?.fehler ?? `HTTP ${r.status}`;
        }
    }
    if (!scan && (opt.wiederverwenden || opt.ohneScan)) {
        const alt = letzteScanId(daten, site);
        if (alt) {
            e.scan_id = alt;
            e.art = 'scan_id wiederverwendet (Scan-Limit)';
        }
    }
    let profil = null;
    let bilder;
    if (!e.scan_id) {
        // Scan-Route nicht verfügbar (z. B. HTTP 500): den Bild-Proxy trotzdem gleichzeitig prüfen
        e.art = `kein Scan (${e.scan_fehler ?? 'ohne Scan'}) – Bild-Proxy direkt`;
        bilder = await bildUrlsOhneScan(site);
    } else {
        if (scan) {
        e.scan = {
            firma: scan.profil?.firma ?? null,
            logo_url: scan.profil?.logo_url ?? null,
            logos: (scan.logos ?? []).map((l) => ({ src: l.src, index: l.index, quelle: l.quelle, format: l.format })),
            farbe: scan.funde?.farbe ?? null,
            farbe_quelle: scan.funde?.farbe_quelle ?? null,
            farben: scan.profil?.farben ?? null,
            seiten: scan.funde?.seiten ?? null,
            dauer_ms: scan.dauer_ms ?? null,
            personen: Array.isArray(scan.profil?.personen) ? scan.profil.personen.length : null,
        };
    }
        const p = await holeJson(`${opt.basis}/api/demo/profil`, { scan_id: e.scan_id });
        e.profil_status = p.status;
        e.profil_ms = p.ms;
        profil = p.status === 200 ? p.json : null;
        if (profil) {
            e.profil = {
                scan_id: profil.scan_id,
                firma: profil.profil?.firma ?? null,
                logo_url: profil.profil?.logo_url ?? null,
                farben: profil.profil?.farben ?? null,
                quelle: profil.profil_quelle ?? null,
                wissen: profil.profil?.wissen?.length ?? null,
                personen: Array.isArray(profil.profil?.personen) ? profil.profil.personen.length : null,
            };
        } else {
            e.profil_fehler = p.json?.fehler ?? `HTTP ${p.status}`;
        }
        bilder = bildUrls(scan, profil);
    }
    // Bilder: jede Adresse 3× (nacheinander), alle Sites gleichzeitig
    e.bilder = await Promise.all(
        bilder.map(async (b) => {
            const abrufe = [];
            for (let i = 0; i < 3; i++) abrufe.push(await holeBild(new URL(b.src, opt.basis).toString()));
            return pruefeBild(site, b, abrufe);
        }),
    );
    // Urteil
    const erwartet = ERWARTET[site] ?? new RegExp(hostVon(site).split('.')[0].replace(/-/g, '.?'), 'i');
    const abw = [];
    if (scan && !erwartet.test(scan.profil?.firma ?? '')) abw.push(`Firma im Scan «${scan.profil?.firma}»`);
    if (profil && !erwartet.test(profil.profil?.firma ?? '')) abw.push(`Firma im Profil «${profil.profil?.firma}»`);
    if (profil && profil.scan_id !== e.scan_id) abw.push(`scan_id im Profil ${profil.scan_id} ≠ ${e.scan_id}`);
    for (const b of e.bilder) {
        if (!b.drei_gleich) abw.push(`Bild ${b.src}: 3 Abrufe nicht gleich`);
        if (b.original_host_passt === false) abw.push(`Bild ${b.src}: Original-Host ${b.original_url} passt nicht zu ${site}`);
        if (!b.gleich_original) abw.push(b.befund ? `Bild ${b.src} (${b.woher}): ${b.befund}` : `Bild ${b.src} (${b.woher}): Bytes ≠ Original (${b.abrufe[0]?.sha256?.slice(0, 16)} vs ${b.original?.sha256_roh?.slice(0, 16) ?? 'Inline-Referenz'})${b.gleich_fremder_site ? ' = Logo von ' + b.gleich_fremder_site.join(', ') : ''}`);
    }
    const ref = await referenzVon(site);
    if (scan && ref.farbe && scan.funde?.farbe && scan.funde.farbe !== ref.farbe) e.farbe_hinweis = `Serverfarbe ${scan.funde.farbe}, lokaler Scan ${ref.farbe}`;
    e.abweichungen = abw;
    e.runde = rundeNr;
    return e;
}

const daten = opt.json && existsSync(opt.json) ? JSON.parse(readFileSync(opt.json, 'utf8')) : { auftrag: 'AUFTRAG-102', basis: opt.basis, sites: opt.sites, runden: [] };
// Referenzen vorab (lokal, nicht gegen den Deploy)
await Promise.all(opt.sites.map(referenzVon));
for (let r = 0; r < opt.runden; r++) {
    const nr = (daten.runden?.length ?? 0) + 1;
    const t0 = Date.now();
    const ablaeufe = await Promise.all(opt.sites.map((s) => ablauf(s, daten, nr)));
    const lauf = { runde: nr, zeit: new Date().toISOString(), basis: opt.basis, gleichzeitig: opt.sites.length, ms: Date.now() - t0, ablaeufe };
    daten.runden.push(lauf);
    daten.referenz = Object.fromEntries(await Promise.all(opt.sites.map(async (s) => [s, await referenzVon(s)])));
    console.log(`\n=== Runde ${nr} (${lauf.ms} ms, ${opt.basis})`);
    for (const a of ablaeufe) {
        console.log(`  ${a.site.padEnd(16)} ${a.art.padEnd(38)} scan=${a.scan_status ?? '–'} ${a.scan_id ?? ''} firma=«${a.scan?.firma ?? a.profil?.firma ?? '–'}» farbe=${a.scan?.farbe ?? '–'} profil=${a.profil_status ?? '–'}`);
        for (const b of a.bilder ?? []) console.log(`     ${b.gleich_original ? 'ok  ' : 'ABW '} ${b.woher.padEnd(22)} ${b.abrufe.map((x) => `${x.status}:${x.sha256?.slice(0, 10)}`).join(' ')}  ${b.abrufe[0]?.kopf?.['cache-status']?.replace(/\s+/g, ' ') ?? ''}`);
        for (const x of a.abweichungen ?? []) console.log(`     ! ${x}`);
    }
    if (opt.json) writeFileSync(opt.json, JSON.stringify(daten, null, 1));
    if (r < opt.runden - 1 && opt.pause) await new Promise((res) => setTimeout(res, opt.pause));
}
const alle = daten.runden.flatMap((l) => l.ablaeufe);
console.log(`\nGesamt: ${daten.runden.length} Runden, ${alle.length} Abläufe, davon ${alle.filter((a) => a.art === 'neuer Scan').length} mit neuem Scan; Abläufe mit Abweichung: ${alle.filter((a) => a.abweichungen?.length).length}`);
