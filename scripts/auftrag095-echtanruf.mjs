#!/usr/bin/env node
/**
 * auftrag095-echtanruf.mjs — EIN echter Testanruf über die Seite (AUFTRAG-095),
 * um die Button-Zustände mit dem echten Orchestrator zu prüfen.
 *
 * Fest verdrahtet: Ziel NUR +41 44 552 03 06 (InfraOne-Testnummer laut
 * Auftrag), gescannt wird infraone.ch. Ohne --ja passiert nichts.
 * Der Orchestrator holt den Auftrag über den Tunnel beim Dev-Server ab.
 *
 *   node scripts/auftrag095-echtanruf.mjs --ja [--sprache Hochdeutsch]
 *
 * Screenshots: ../auftraege/ergebnisse/A095-screens/echt-*.png
 */
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SCREENS = path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', 'A095-screens');
const NUMMER = '044 552 03 06'; // einzige erlaubte Zielnummer (Auftrag)
const args = process.argv.slice(2);
if (!args.includes('--ja')) {
    console.error('Echter Anruf an 044 552 03 06 nur mit --ja.');
    process.exit(2);
}
const sprache = args.includes('--sprache') ? args[args.indexOf('--sprache') + 1] : 'Hochdeutsch';
const lauf = args.includes('--lauf') ? args[args.indexOf('--lauf') + 1] : '1';
mkdirSync(SCREENS, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-CH' });
await ctx.addInitScript(() => {
    try {
        localStorage.setItem('theme', 'light');
    } catch {
        /* egal */
    }
});
const page = await ctx.newPage();
const protokoll = [];
const t0 = Date.now();
const zeit = () => `${((Date.now() - t0) / 1000).toFixed(1)} s`;
page.on('response', async (r) => {
    if (/\/api\/demo\/(anruf|auftraege\/)/.test(r.url())) {
        const body = await r.json().catch(() => null);
        protokoll.push({ t: zeit(), url: r.url().replace(BASE, ''), status: r.status(), body: body ? { ...body, id: body.id ? body.id.slice(0, 13) + '…' : undefined } : null });
    }
});
try {
    await page.goto(`${BASE}/ki-telefonassistent`, { waitUntil: 'networkidle' });
    await page.fill('#ki-demo-url', 'infraone.ch');
    await page.click('#ki-demo-scan-knopf');
    await page.locator('#ki-demo-anruf-knopf[data-zustand="bereit"]').waitFor({ state: 'visible', timeout: 60000 });
    await page.getByRole('radio', { name: sprache, exact: true }).check({ force: true });
    await page.fill('#ki-demo-nummer', NUMMER);
    await page.locator('#ki-demo-einwilligung').check();
    const start = Date.now();
    await page.click('#ki-demo-anruf-knopf');
    const folge = [];
    const bilder = new Set();
    while (Date.now() - start < 6 * 60 * 1000) {
        const k = await page.evaluate(() => {
            const b = document.querySelector('#ki-demo-anruf-knopf');
            return b && getComputedStyle(b).visibility !== 'hidden' ? { text: b.textContent.trim(), zustand: b.dataset.zustand } : null;
        });
        if (k && folge[folge.length - 1]?.text !== k.text) {
            folge.push({ t: zeit(), ...k });
            console.log(`${zeit()}  ${k.zustand}: ${k.text}`);
        }
        if (k && !bilder.has(k.zustand) && ['wartend', 'waehlt', 'verbunden', 'beendet', 'fehler'].includes(k.zustand)) {
            bilder.add(k.zustand);
            await page.screenshot({ path: path.join(SCREENS, `echt-${lauf}-${k.zustand}.png`) });
        }
        if (k && (k.zustand === 'beendet' || k.zustand === 'fehler')) break;
        await page.waitForTimeout(400);
    }
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENS, `echt-${lauf}-ende.png`) });
    const zusammenfassung = await page.evaluate(() => document.querySelector('#ki-demo-anruf-titel')?.closest('section')?.innerText ?? '');
    writeFileSync(path.join(SCREENS, `echt-${lauf}-protokoll.json`), JSON.stringify({ sprache, folge, protokoll, karte: zusammenfassung.slice(0, 1200) }, null, 2), 'utf8');
    console.log('Folge:', folge.map((f) => f.text).join(' > '));
} finally {
    await browser.close();
}
