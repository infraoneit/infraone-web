#!/usr/bin/env node
/**
 * auftrag102-browser-test.mjs (AUFTRAG-102, Teil 3) — zwei Widgets scannen gleichzeitig.
 *
 * 1. Gleicher Browser-Kontext, zwei Seiten: bint.ch und unipoint.ch gleichzeitig.
 * 2. Getrennte Kontexte: elektro-tel.ch und bint.ch gleichzeitig.
 * Je Karte: eigene Firma, Logo-Pfad mit der eigenen Scan-Kennung (/api/demo/bild/<scan>/<n>),
 * Logo-Bytes (SHA-256 im Browser) = Original der eigenen Website (direkt geladen; SVG mit
 * derselben Bereinigung wie der Proxy), die beiden Logos verschieden, «Kennt Ansprechpersonen»
 * nur mit Personen.
 * 3. Race «Andere Website»: Die englische Übersetzung der Fähigkeiten von Scan A kommt
 *    (künstlich verzögert) erst an, nachdem Scan B läuft — Karte B bleibt unberührt.
 * 4. Karten der 10 Mess-Sites (Screenshots unter auftraege/ergebnisse/A102-screens/).
 *
 * Nur Scans und Profile gegen den LOKALEN Dev-Server — keine Anrufe (die Anruf-Route wird nie
 * aufgerufen; zur Sicherheit im Browser abgefangen).
 *   node scripts/auftrag102-browser-test.mjs [--ohne-karten]
 */
import { chromium } from 'playwright-core';
import { registerHooks } from 'node:module';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SEITE = `${BASE}/ki-telefonassistent`;
const SCREENS = path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', 'A102-screens');
const STORE = process.env.DEMO_STORE_DIR ? path.resolve(process.env.DEMO_STORE_DIR) : path.join(ROOT, '.demo-store');
const MESS_SITES = ['bint.ch', 'unipoint.ch', 'elektro-tel.ch', 'infraone.ch', 'zahnarztpraxisneuwiesen.ch', 'stocker-tiefbau.ch', 'kmutrust.ch', 'elektro-compagnoni.ch', 'salamon-planung.ch', 'tierklinik-obergrund.ch'];
const ERWARTET = { 'bint.ch': /bint/i, 'unipoint.ch': /unipoint/i, 'elektro-tel.ch': /elektro.?tel/i };
mkdirSync(SCREENS, { recursive: true });

const ergebnisse = [];
function check(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail: String(detail).slice(0, 400) });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);
}
const sha = (b) => createHash('sha256').update(b).digest('hex');
const dateiName = (site) => site.replace(/[^a-z0-9.-]+/gi, '_');

function limitsZuruecksetzen() {
    const dir = path.join(STORE, 'limit');
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}

/** Original-Bytes eines Logos (roh und — bei SVG — wie der Proxy bereinigt). */
async function originalHashes(url) {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (InfraOne-Demo-Test A102)' } });
    const buf = Buffer.from(await r.arrayBuffer());
    const svg = /<svg[\s>]/i.test(buf.subarray(0, 800).toString('utf8'));
    const bereinigt = svg ? bereinigeSvg(buf.toString('utf8')) : null;
    return [sha(buf), ...(bereinigt ? [sha(Buffer.from(bereinigt, 'utf8'))] : [])];
}

/** Bereitet eine Seite vor: Anruf-API sicherheitshalber abfangen, Scan-Antwort mitlesen. */
async function vorbereiten(ctx) {
    const page = await ctx.newPage();
    const konsole = [];
    page.on('console', (m) => m.type() === 'error' && konsole.push(m.text()));
    page.on('pageerror', (e) => konsole.push('pageerror: ' + e.message));
    await page.route('**/api/demo/anruf', (route) => route.fulfill({ status: 418, contentType: 'application/json', body: '{"fehler":"Test: keine Anrufe"}' }));
    const daten = { scan: null };
    page.on('response', async (res) => {
        if (res.url().endsWith('/api/demo/scan') && res.request().method() === 'POST') daten.scan = await res.json().catch(() => null);
    });
    await page.goto(SEITE, { waitUntil: 'networkidle' });
    return { page, konsole, daten };
}

async function starte(seite, site) {
    await seite.page.fill('#ki-demo-url', site);
    await seite.page.click('#ki-demo-scan-knopf');
}

async function warteBereit(seite) {
    await seite.page.locator('#ki-demo-anruf-knopf[data-zustand="bereit"]').waitFor({ state: 'visible', timeout: 90000 });
    await seite.page.waitForTimeout(600);
}

/** Karte auslesen: Firma, Rolle, Kann-Zeilen, Logo-Pfad und Logo-Bytes (im Browser gehasht). */
async function karte(seite) {
    return seite.page.evaluate(async () => {
        const fig = document.querySelector('figure');
        const img = fig?.querySelector('[role="group"] img') ?? null;
        const src = img?.getAttribute('src') ?? null;
        let hash = null;
        let status = null;
        if (src) {
            const r = await fetch(src, { cache: 'no-store' });
            status = r.status;
            const b = await r.arrayBuffer();
            hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map((x) => x.toString(16).padStart(2, '0')).join('');
        }
        const kann = [...(fig?.querySelectorAll('ul[lang] li') ?? [])].map((li) => li.textContent.trim()).filter(Boolean);
        return { text: fig?.innerText ?? '', src, hash, status, kann };
    });
}

async function pruefeKarte(name, seite, site) {
    const k = await karte(seite);
    const scan = seite.daten.scan;
    const scanId = scan?.scan_id ?? '';
    const erwartet = ERWARTET[site] ?? new RegExp(site.split('.')[0].replace(/-/g, '.?'), 'i');
    check(`${name}: Karte zeigt die eigene Firma (${site})`, erwartet.test(k.text) && Object.entries(ERWARTET).filter(([s]) => s !== site).every(([, re]) => !re.test(k.text.replace(erwartet, ''))), k.text.split('\n').slice(0, 3).join(' | '));
    check(`${name}: Logo-Pfad trägt die eigene Scan-Kennung`, !!k.src && k.src.startsWith(`/api/demo/bild/${scanId}/`), `${k.src} (scan ${scanId})`);
    const idx = k.src ? Number(k.src.split('/').pop()) : -1;
    const logo = scan?.logos?.find((l) => l.index === idx) ?? null;
    let original = [];
    if (logo?.url) original = await originalHashes(logo.url);
    check(`${name}: Logo-Bytes = Original der eigenen Website (SHA-256)`, k.status === 200 && (!logo?.url || original.includes(k.hash)), `${k.hash?.slice(0, 16)} vs ${original.map((h) => h.slice(0, 16)).join('/') || 'Inline-SVG'} (${logo?.url ?? 'inline'})`);
    const personen = scan?.profil?.personen?.length ?? 0;
    check(`${name}: «Kennt Ansprechpersonen» genau dann, wenn Personen gefunden (${personen})`, k.kann.includes('Kennt Ansprechpersonen') === personen > 0, k.kann.join(' · '));
    check(`${name}: keine Konsolenfehler`, seite.konsole.length === 0, seite.konsole.slice(0, 2).join(' | '));
    return { site, scanId, src: k.src, hash: k.hash, kann: k.kann, personen };
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const protokoll = { zeit: new Date().toISOString(), basis: BASE, laeufe: [] };
try {
    /* 1. gleicher Kontext, zwei Seiten */
    limitsZuruecksetzen();
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-CH' });
        const [a, b] = await Promise.all([vorbereiten(ctx), vorbereiten(ctx)]);
        await Promise.all([starte(a, 'bint.ch'), starte(b, 'unipoint.ch')]);
        await Promise.all([warteBereit(a), warteBereit(b)]);
        const ka = await pruefeKarte('Gleicher Kontext/bint', a, 'bint.ch');
        const kb = await pruefeKarte('Gleicher Kontext/unipoint', b, 'unipoint.ch');
        check('Gleicher Kontext: zwei verschiedene Scans, zwei verschiedene Logos', ka.scanId !== kb.scanId && ka.hash && kb.hash && ka.hash !== kb.hash, `${ka.scanId}/${kb.scanId}`);
        await a.page.locator('figure').screenshot({ path: path.join(SCREENS, 'parallel-kontext-gleich-bint.png') });
        await b.page.locator('figure').screenshot({ path: path.join(SCREENS, 'parallel-kontext-gleich-unipoint.png') });
        protokoll.laeufe.push({ test: 'gleicher Kontext', karten: [ka, kb] });
        await ctx.close();
    }
    /* 2. getrennte Kontexte */
    limitsZuruecksetzen();
    {
        const c1 = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-CH' });
        const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-CH' });
        const [a, b] = await Promise.all([vorbereiten(c1), vorbereiten(c2)]);
        await Promise.all([starte(a, 'elektro-tel.ch'), starte(b, 'bint.ch')]);
        await Promise.all([warteBereit(a), warteBereit(b)]);
        const ka = await pruefeKarte('Getrennte Kontexte/elektro-tel', a, 'elektro-tel.ch');
        const kb = await pruefeKarte('Getrennte Kontexte/bint', b, 'bint.ch');
        check('Getrennte Kontexte: zwei verschiedene Scans, zwei verschiedene Logos', ka.scanId !== kb.scanId && ka.hash !== kb.hash, `${ka.scanId}/${kb.scanId}`);
        await a.page.locator('figure').screenshot({ path: path.join(SCREENS, 'parallel-kontext-getrennt-elektro-tel.png') });
        await b.page.locator('figure').screenshot({ path: path.join(SCREENS, 'parallel-kontext-getrennt-bint.png') });
        protokoll.laeufe.push({ test: 'getrennte Kontexte', karten: [ka, kb] });
        await c1.close();
        await c2.close();
    }
    /* 3. Race «Andere Website»: verspätete Antwort von Scan A darf Karte B nicht ändern */
    limitsZuruecksetzen();
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        let scanA = null;
        let verzoegert = 0;
        // KI-Profil A mit eigenen Fähigkeiten → «English» braucht die Übersetzung (POST /api/demo/faehigkeiten)
        await s.page.route('**/api/demo/profil', async (route) => {
            const r = await route.fetch();
            const j = await r.json();
            if (!scanA) {
                scanA = j.scan_id;
                j.profil.faehigkeiten = ['Nimmt Bestellungen von Futtermitteln auf', 'Beantwortet Fragen zu Produkten', 'Rund um die Uhr erreichbar'];
            }
            await route.fulfill({ response: r, json: j });
        });
        await s.page.route('**/api/demo/faehigkeiten', async (route) => {
            const body = JSON.parse(route.request().postData() || '{}');
            if (body.scan_id === scanA) {
                verzoegert++;
                await new Promise((res) => setTimeout(res, 8000));
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scan_id: scanA, faehigkeiten_en: ['RACE A one', 'RACE A two', 'RACE A three'] }) }).catch(() => undefined);
            } else await route.continue();
        });
        await starte(s, 'unipoint.ch');
        await warteBereit(s);
        await s.page.click('#ki-demo-sprache-englisch', { force: true }).catch(() => s.page.locator('label[for="ki-demo-sprache-englisch"]').click());
        await s.page.waitForTimeout(300);
        // während die Übersetzung von A noch läuft: andere Website
        await s.page.getByRole('button', { name: 'Andere Website' }).click();
        await starte(s, 'bint.ch');
        await warteBereit(s);
        await s.page.waitForTimeout(9000);
        const k = await karte(s);
        check('Race: verspätete Antwort von Scan A ändert Karte B nicht', verzoegert === 1 && !k.kann.some((z) => /RACE A/.test(z)) && /bint/i.test(k.text) && !/unipoint/i.test(k.text), `${k.kann.join(' · ')} | ${k.text.split('\n')[0]}`);
        check('Race: Logo von Karte B gehört zu Scan B', !!k.src && !!s.daten.scan?.scan_id && k.src.startsWith(`/api/demo/bild/${s.daten.scan.scan_id}/`) && s.daten.scan.scan_id !== scanA, `${k.src} (A ${scanA})`);
        await s.page.locator('figure').screenshot({ path: path.join(SCREENS, 'race-andere-website-karte-b.png') });
        protokoll.laeufe.push({ test: 'race', scanA, scanB: s.daten.scan?.scan_id, kann: k.kann });
        await ctx.close();
    }
    /* 4. Karten der 10 Mess-Sites */
    if (!process.argv.includes('--ohne-karten')) {
        for (const site of MESS_SITES) {
            limitsZuruecksetzen();
            const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-CH' });
            const s = await vorbereiten(ctx);
            try {
                await starte(s, site);
                await warteBereit(s);
                const k = await karte(s);
                const personen = s.daten.scan?.profil?.personen ?? [];
                check(`Karte ${site}: «Kennt Ansprechpersonen» passend (${personen.length} Personen)`, k.kann.includes('Kennt Ansprechpersonen') === personen.length > 0, k.kann.join(' · '));
                check(`Karte ${site}: Logo über eigenen Scan-Pfad`, !k.src || k.src.startsWith(`/api/demo/bild/${s.daten.scan?.scan_id}/`), k.src ?? 'Initiale');
                await s.page.locator('figure').screenshot({ path: path.join(SCREENS, `${dateiName(site)}-karte.png`) });
                protokoll.laeufe.push({ test: 'karte', site, scanId: s.daten.scan?.scan_id, kann: k.kann, personen: personen.length, src: k.src });
            } catch (e) {
                check(`Karte ${site}`, false, e.message);
            }
            await ctx.close();
        }
    }
} finally {
    await browser.close();
}
writeFileSync(path.join(SCREENS, 'browser-test.json'), JSON.stringify({ ...protokoll, ergebnisse }, null, 1));
const fehler = ergebnisse.filter((e) => !e.ok).length;
console.log(`\n${ergebnisse.length - fehler}/${ergebnisse.length} Browser-Prüfungen bestanden.`);
process.exit(fehler ? 1 : 0);
