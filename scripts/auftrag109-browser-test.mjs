#!/usr/bin/env node
/**
 * auftrag109-browser-test.mjs (AUFTRAG-109) — Handelsregister-Schritt im Demo-Widget, im Browser.
 *
 * Gegen einen EIGENEN Server (Vorgabe http://localhost:3101, nie :3000) mit echtem Zefix:
 * 1. Echte Website (elektro-tel.ch): Scan → Abgleich (UID aus dem Impressum bzw. Name) →
 *    Treffer mit Name, Sitz, UID, Status → kein Anruf-Formular vor der Bestätigung →
 *    «Ja, das ist meine Firma» → Anruf-Formular (Nummer, Sprache, Einwilligung) erscheint,
 *    bestätigte Firma steht darüber. NICHT abgesendet. Wiederholte Prüfung → «bestaetigt»
 *    ohne neuen Register-Aufruf (mit SERVER_LOG: Zählung der Zeilen `[demo/zefix]`).
 * 2. Website ohne Treffer (example.com): Hinweis + Feld «Firmenname oder UID» → erfundener Name
 *    (kein Treffer, «Noch 2 Versuche») → UID CHE-107.160.757 → Treffer → Bestätigung → Formular.
 * 3. Drei erfolglose Suchen → «Kein Testanruf möglich», Hinweis auf den aktiven Eintrag, Link
 *    /kontakt, kein Suchfeld und kein Anruf-Formular mehr.
 * 4. Server erzwingt: POST /api/demo/anruf mit einem unbestätigten Scan → 403 (direkt aus dem
 *    Browser per fetch, ohne Widget; Nummer erfunden, ohne Nachweis entsteht kein Auftrag).
 * 5. Mobil (375 px): Handelsregister-Schritt ohne waagrechtes Scrollen.
 * 7. Mehrere Treffer (manuelle Namenssuche «Elektro-Tel AG»): «Welche ist Ihre Firma?», höchstens 5,
 *    Bestätigen erst nach Auswahl, gewählter Eintrag steht über dem Formular.
 * 6. Register nicht erreichbar (im Browser simuliert: die erste automatische Antwort wird durch
 *    «nicht_erreichbar» ersetzt; der Server-Pfad ist in auftrag109-einheit-test.mjs geprüft):
 *    Hinweis wortgleich, kein Anruf-Formular, «Nochmals prüfen» holt das echte Ergebnis. Helles Design.
 *
 * Mit HR_MODUS=aus (Server mit DEMO_HANDELSREGISTER=aus) läuft NUR Schritt A: Scan → Anruf-Formular
 * direkt, ohne Handelsregister-Schritt (Schalter für Entwicklung und ältere Browser-Tests).
 *
 * KEIN echter Anruf: Das Widget-Formular wird nie abgesendet; zusätzlich fängt jede Seite
 * POST /api/demo/anruf ab (418), ausser im Schritt 4, der bewusst die 403-Sperre prüft — der
 * eigene Server hat kein DEMO_ANSTOSS_URL (kein Anstoss der Anlage).
 *
 *   $env:BASE_URL='http://localhost:3101'; $env:SERVER_LOG='<log des Servers>'; node scripts/auftrag109-browser-test.mjs
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3101';
if (/:3000\b/.test(BASE)) {
    console.error('Port 3000 gehört dem Manager — bitte einen eigenen Server (z. B. :3101) verwenden.');
    process.exit(2);
}
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SEITE = `${BASE}/ki-telefonassistent`;
const SERVER_LOG = process.env.SERVER_LOG || null;

/** Ordner auftraege/ergebnisse (Haupt-Checkout oder Worktree: nach oben suchen) */
function ergebnisOrdner() {
    let d = ROOT;
    for (let i = 0; i < 8; i++) {
        if (existsSync(path.join(d, 'auftraege', 'ergebnisse'))) return path.join(d, 'auftraege', 'ergebnisse');
        d = path.dirname(d);
    }
    return path.join(ROOT, 'auftraege-ergebnisse');
}
const SCREENS = process.env.SCREENS_DIR || path.join(ergebnisOrdner(), 'A109-screens');
mkdirSync(SCREENS, { recursive: true });

const ergebnisse = [];
function check(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail: String(detail).slice(0, 500) });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);
}

const zefixZeilen = (scanId) => {
    if (!SERVER_LOG || !existsSync(SERVER_LOG)) return null;
    return readFileSync(SERVER_LOG, 'utf8')
        .split(/\r?\n/)
        .filter((z) => z.includes('[demo/zefix]') && z.includes(`scan=${scanId.slice(0, 10)}`)).length;
};

/** Seite vorbereiten: Anruf-API abfangen, Antworten von Scan und Handelsregister mitlesen. */
async function vorbereiten(ctx, { anrufAbfangen = true } = {}) {
    const page = await ctx.newPage();
    const konsole = [];
    page.on('console', (m) => m.type() === 'error' && konsole.push(m.text()));
    page.on('pageerror', (e) => konsole.push('pageerror: ' + e.message));
    const anrufe = [];
    if (anrufAbfangen) {
        await page.route('**/api/demo/anruf', (route) => {
            anrufe.push(route.request().postData());
            return route.fulfill({ status: 418, contentType: 'application/json', body: '{"fehler":"Test: keine Anrufe"}' });
        });
    }
    const daten = { scan: null, hr: [] };
    page.on('response', async (res) => {
        if (res.request().method() !== 'POST') return;
        if (res.url().endsWith('/api/demo/scan')) daten.scan = await res.json().catch(() => null);
        if (res.url().endsWith('/api/demo/handelsregister')) {
            const body = JSON.parse(res.request().postData() || '{}');
            daten.hr.push({ status: res.status(), body, antwort: await res.json().catch(() => null) });
        }
    });
    await page.goto(SEITE, { waitUntil: 'networkidle' });
    return { page, konsole, daten, anrufe };
}

async function scanne(s, site) {
    await s.page.fill('#ki-demo-url', site);
    await s.page.click('#ki-demo-scan-knopf');
}

/** Wartet, bis der Handelsregister-Schritt ein Ergebnis zeigt (nicht mehr «pruefen»). */
async function warteRegister(s, timeout = 90000) {
    await s.page.waitForSelector('[data-handelsregister]:not([data-handelsregister="pruefen"])', { timeout });
    await s.page.waitForTimeout(300);
    return s.page.getAttribute('[data-handelsregister]', 'data-handelsregister');
}

async function eintraege(page) {
    return page.$$eval('[data-handelsregister] label[data-uid]', (ls) => ls.map((l) => ({ uid: l.getAttribute('data-uid'), aktiv: l.getAttribute('data-aktiv') === 'true', text: l.innerText.replace(/\s+/g, ' ').trim() })));
}

const formularDa = (page) => page.locator('#ki-demo-nummer').count().then((n) => n > 0);
const DATENSCHUTZ = 'Wir prüfen den Firmennamen gegen das öffentliche Handelsregister (Zefix).';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const protokoll = { zeit: new Date().toISOString(), basis: BASE, laeufe: [] };
const NUR_AUS = process.env.HR_MODUS === 'aus';
try {
    /* A. Schalter «aus»: kein Handelsregister-Schritt */
    if (NUR_AUS) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        await scanne(s, 'example.com');
        await s.page.waitForSelector('#ki-demo-anruf-knopf[data-zustand="bereit"]', { timeout: 90000 });
        const hrAntwort = s.daten.hr[0]?.antwort ?? null;
        check('A: Schalter aus → «uebersprungen», Anruf-Formular ohne Handelsregister-Schritt', hrAntwort?.ergebnis === 'uebersprungen' && (await formularDa(s.page)) && (await s.page.locator('[data-handelsregister]').count()) === 0 && s.anrufe.length === 0, JSON.stringify(hrAntwort));
        check('A: keine Konsolenfehler', s.konsole.length === 0, s.konsole.slice(0, 3).join(' | '));
        await ctx.close();
    }
    /* 1. Echte Website bis zur Bestätigung */
    if (!NUR_AUS) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        await scanne(s, 'elektro-tel.ch');
        const stand = await warteRegister(s);
        const scanId = s.daten.scan?.scan_id ?? '';
        const auto = s.daten.hr.find((x) => !x.body.suche && !x.body.bestaetige)?.antwort ?? null;
        const liste = await eintraege(s.page);
        const text = await s.page.locator('[data-handelsregister]').innerText();
        check('1: Abgleich zeigt Treffer', stand === 'treffer' && liste.length >= 1 && liste.length <= 5, `${stand}, ${liste.length} Einträge, quelle=${auto?.quelle}`);
        check('1: Einträge aus dem Register (Elektro-Tel AG, UID formatiert, Sitz, Status)', liste.every((e) => /Elektro-Tel AG/.test(e.text) && /UID: CHE-\d{3}\.\d{3}\.\d{3}/.test(e.text) && /Sitz: /.test(e.text) && /Status: /.test(e.text)), liste.map((e) => e.text).join(' || '));
        check('1: Datenschutz-Hinweis (Zefix) sichtbar', text.includes(DATENSCHUTZ));
        check('1: vor der Bestätigung kein Anruf-Formular', !(await formularDa(s.page)));
        await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').screenshot({ path: path.join(SCREENS, '1-elektro-tel-treffer.png') });
        // Hauptsitz Winterthur wählen, falls er in der Liste ist, sonst den ersten aktiven Eintrag
        const ziel = liste.find((e) => e.uid === 'CHE107160757' && e.aktiv) ?? liste.find((e) => e.aktiv);
        if (ziel) await s.page.click(`label[data-uid="${ziel.uid}"]`);
        await s.page.click('#ki-demo-hr-bestaetigen');
        await s.page.waitForSelector('#ki-demo-nummer', { timeout: 15000 });
        const bestaetigt = await s.page.getAttribute('[data-handelsregister-bestaetigt]', 'data-handelsregister-bestaetigt');
        check('1: nach «Ja, das ist meine Firma» erscheint das Anruf-Formular', (await formularDa(s.page)) && (await s.page.locator('#ki-demo-einwilligung').count()) === 1 && (await s.page.locator('input[name="ki-demo-sprache-wahl"]').count()) === 3);
        check('1: bestätigte Firma steht über dem Formular', bestaetigt === ziel?.uid, `${bestaetigt}`);
        check('1: Anruf-Knopf bereit (nicht abgesendet)', (await s.page.getAttribute('#ki-demo-anruf-knopf', 'data-zustand')) === 'bereit' && s.anrufe.length === 0);
        await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').screenshot({ path: path.join(SCREENS, '1-elektro-tel-formular.png') });
        // wiederholte Prüfung: aus dem Speicher, «bestaetigt», kein neuer Register-Aufruf
        const vorher = zefixZeilen(scanId);
        const wieder = await s.page.evaluate(async (id) => (await fetch('/api/demo/handelsregister', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scan_id: id }) })).json(), scanId);
        await s.page.waitForTimeout(500);
        const nachher = zefixZeilen(scanId);
        check('1: wiederholte Prüfung → «bestaetigt»', wieder?.ergebnis === 'bestaetigt' && wieder.bestaetigt?.uid === ziel?.uid);
        if (vorher !== null) check('1: Journal — Zefix-Aufrufe dieses Scans, Wiederholung ohne neuen Aufruf', vorher >= 1 && nachher === vorher, `[demo/zefix]-Zeilen: ${vorher} → ${nachher}`);
        check('1: keine Konsolenfehler', s.konsole.length === 0, s.konsole.slice(0, 3).join(' | '));
        protokoll.laeufe.push({ test: '1 elektro-tel.ch', scanId, auto: auto ? { ergebnis: auto.ergebnis, quelle: auto.quelle, treffer: auto.treffer.map((t) => `${t.uid_formatiert} ${t.sitz} ${t.status}`) } : null, bestaetigt, zefix_zeilen: vorher });
        await ctx.close();
    }

    /* 2. Website ohne Treffer, manuelle Eingabe */
    if (!NUR_AUS) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        await scanne(s, 'example.com');
        const stand = await warteRegister(s);
        const text = await s.page.locator('[data-handelsregister]').innerText();
        check('2: example.com → kein Treffer mit freundlichem Hinweis', stand === 'kein_treffer' && /keinen passenden Eintrag gefunden/.test(text), stand);
        check('2: Eingabefeld «Firmenname oder UID», 3 Versuche', (await s.page.locator('label[for="ki-demo-hr-suche"]').innerText()) === 'Firmenname oder UID' && /Noch 3 Versuche/.test(text));
        check('2: kein Anruf-Formular ohne Treffer', !(await formularDa(s.page)));
        await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').screenshot({ path: path.join(SCREENS, '2-kein-treffer.png') });
        await s.page.fill('#ki-demo-hr-suche', 'Muster Gibt Es Nicht AG');
        await s.page.click('#ki-demo-hr-suchen');
        await s.page.waitForFunction(() => /Noch 2 Versuche/.test(document.querySelector('[data-handelsregister]')?.textContent ?? ''), null, { timeout: 30000 });
        check('2: erfundener Name → weiterhin kein Treffer, «Noch 2 Versuche»', (await s.page.getAttribute('[data-handelsregister]', 'data-handelsregister')) === 'kein_treffer');
        await s.page.fill('#ki-demo-hr-suche', 'CHE-107.160.757');
        await s.page.click('#ki-demo-hr-suchen');
        await s.page.waitForSelector('[data-handelsregister="treffer"] label[data-uid="CHE107160757"]', { timeout: 30000 });
        const liste = await eintraege(s.page);
        check('2: manuelle UID → genau dieser Eintrag (Winterthur, aktiv)', liste.length === 1 && liste[0].aktiv && /Winterthur/.test(liste[0].text) && /CHE-107\.160\.757/.test(liste[0].text), liste.map((e) => e.text).join(' || '));
        const tm = await s.page.locator('[data-handelsregister]').innerText();
        check('2: Herkunft «Gefunden über Ihre Eingabe»', tm.includes('Gefunden über Ihre Eingabe.'));
        await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').screenshot({ path: path.join(SCREENS, '2-manuell-treffer.png') });
        await s.page.click('#ki-demo-hr-bestaetigen');
        await s.page.waitForSelector('#ki-demo-nummer', { timeout: 15000 });
        check('2: nach Bestätigung Anruf-Formular (nicht abgesendet)', (await formularDa(s.page)) && s.anrufe.length === 0);
        const manuell = s.daten.hr.filter((x) => x.body.suche).map((x) => x.antwort?.versuche_rest);
        check('2: Server zählt die manuellen Versuche (2 → 1)', JSON.stringify(manuell) === '[2,1]', JSON.stringify(manuell));
        check('2: keine Konsolenfehler', s.konsole.length === 0, s.konsole.slice(0, 3).join(' | '));
        protokoll.laeufe.push({ test: '2 example.com manuell', scanId: s.daten.scan?.scan_id, versuche: manuell });
        await ctx.close();
    }

    /* 3. Drei erfolglose Suchen → kein Testanruf, Link /kontakt */
    if (!NUR_AUS) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        await scanne(s, 'example.com');
        await warteRegister(s);
        for (let i = 1; i <= 3; i++) {
            await s.page.fill('#ki-demo-hr-suche', `Muster Nirgendwo ${i} AG`);
            const antwort = s.page.waitForResponse((r) => r.url().endsWith('/api/demo/handelsregister') && r.request().method() === 'POST', { timeout: 30000 });
            await s.page.click('#ki-demo-hr-suchen');
            await antwort;
            await s.page.waitForTimeout(400);
        }
        await s.page.waitForSelector('#ki-demo-hr-kontakt', { timeout: 30000 });
        const text = await s.page.locator('[data-handelsregister]').innerText();
        const href = await s.page.getAttribute('#ki-demo-hr-kontakt', 'href');
        check('3: nach 3 Suchen «Kein Testanruf möglich» mit Hinweis', /Kein Testanruf möglich/.test(text) && text.includes('Für den Testanruf braucht es einen aktiven Handelsregister-Eintrag.'), text.split('\n').slice(0, 3).join(' | '));
        check('3: Link zu /kontakt', !!href && href.startsWith('/kontakt'), href);
        check('3: kein Suchfeld und kein Anruf-Formular mehr', (await s.page.locator('#ki-demo-hr-suche').count()) === 0 && !(await formularDa(s.page)));
        const rest = s.daten.hr.filter((x) => x.body.suche).map((x) => x.antwort?.versuche_rest);
        check('3: Server meldet 2, 1, 0 Versuche', JSON.stringify(rest) === '[2,1,0]', JSON.stringify(rest));
        await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').screenshot({ path: path.join(SCREENS, '3-ausgeschoepft.png') });
        // vierter Versuch direkt an den Server → 429
        const r4 = await s.page.evaluate(async (id) => {
            const r = await fetch('/api/demo/handelsregister', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scan_id: id, suche: 'Muster Noch Einmal AG' }) });
            return { status: r.status, d: await r.json() };
        }, s.daten.scan?.scan_id);
        check('3: vierter Versuch direkt an den Server → 429', r4.status === 429, JSON.stringify(r4.d));

        /* 4. Server erzwingt: Anruf ohne Nachweis → 403 (Route hier NICHT abgefangen) */
        await s.page.unroute('**/api/demo/anruf');
        const r403 = await s.page.evaluate(async (id) => {
            const r = await fetch('/api/demo/anruf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scan_id: id, nummer: '+41790000109', sprache: 'hochdeutsch', einwilligung: true, honigtopf: '' }) });
            return { status: r.status, d: await r.json() };
        }, s.daten.scan?.scan_id);
        check('4: POST /api/demo/anruf ohne Nachweis → 403 mit klarer Meldung', r403.status === 403 && r403.d.code === 'handelsregister_fehlt' && typeof r403.d.fehler === 'string', JSON.stringify(r403));
        // erwartet: die beiden direkten Abrufe (429, 403) erscheinen als «Failed to load resource»
        const unerwartet = s.konsole.filter((k) => !/status of (403|429)/.test(k));
        check('3/4: keine unerwarteten Konsolenfehler (nur die bewussten 429/403)', unerwartet.length === 0, unerwartet.slice(0, 3).join(' | '));
        protokoll.laeufe.push({ test: '3 ausgeschöpft + 4 Sperre', scanId: s.daten.scan?.scan_id, rest, r4: r4.status, r403: r403.status });
        await ctx.close();
    }

    /* 5. Mobil 375 px */
    if (!NUR_AUS) {
        const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: 'de-CH', isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
        const s = await vorbereiten(ctx);
        await scanne(s, 'elektro-tel.ch');
        const stand = await warteRegister(s);
        await s.page.locator('[data-handelsregister]').scrollIntoViewIfNeeded();
        const breite = await s.page.evaluate(() => ({ seite: document.documentElement.scrollWidth, fenster: window.innerWidth, karte: Math.round(document.querySelector('section[aria-labelledby="ki-demo-anruf-titel"]')?.getBoundingClientRect().right ?? 0) }));
        check('5: mobil 375 px — Handelsregister-Schritt ohne waagrechtes Scrollen', stand === 'treffer' && breite.seite <= breite.fenster && breite.karte <= breite.fenster, JSON.stringify(breite));
        await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').screenshot({ path: path.join(SCREENS, '5-mobil-375-treffer.png') });
        await ctx.close();
    }

    /* 7. Mehrere Treffer: Auswahl */
    if (!NUR_AUS) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        await scanne(s, 'example.com');
        await warteRegister(s);
        await s.page.fill('#ki-demo-hr-suche', 'Elektro-Tel AG');
        await s.page.click('#ki-demo-hr-suchen');
        await s.page.waitForSelector('[data-handelsregister="treffer"] label[data-uid]', { timeout: 30000 });
        const liste = await eintraege(s.page);
        const titel = await s.page.locator('#ki-demo-anruf-titel').innerText();
        check('7: mehrere Treffer → «Welche ist Ihre Firma?», 2 bis 5 Einträge', titel === 'Welche ist Ihre Firma?' && liste.length >= 2 && liste.length <= 5, `${titel}: ${liste.map((e) => e.text.split(' Sitz: ')[1]?.split(' UID')[0]).join(' | ')}`);
        check('7: ohne Auswahl ist «Ja, das ist meine Firma» gesperrt', await s.page.isDisabled('#ki-demo-hr-bestaetigen'));
        await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').screenshot({ path: path.join(SCREENS, '7-mehrere-treffer.png') });
        const ziel = liste.find((e) => e.uid === 'CHE107160757') ?? liste[0];
        await s.page.click(`label[data-uid="${ziel.uid}"]`);
        await s.page.click('#ki-demo-hr-bestaetigen');
        await s.page.waitForSelector('#ki-demo-nummer', { timeout: 15000 });
        check('7: gewählter Eintrag bestätigt, Formular da (nicht abgesendet)', (await s.page.getAttribute('[data-handelsregister-bestaetigt]', 'data-handelsregister-bestaetigt')) === ziel.uid && s.anrufe.length === 0);
        check('7: keine Konsolenfehler', s.konsole.length === 0, s.konsole.slice(0, 3).join(' | '));
        await ctx.close();
    }

    /* 6. Register nicht erreichbar (simuliert), helles Design */
    if (!NUR_AUS) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH', colorScheme: 'light' });
        await ctx.addInitScript(() => {
            try {
                localStorage.setItem('theme', 'light');
            } catch {
                /* egal */
            }
        });
        const s = await vorbereiten(ctx);
        let ersetzt = 0;
        await s.page.route('**/api/demo/handelsregister', async (route) => {
            const body = JSON.parse(route.request().postData() || '{}');
            if (ersetzt === 0 && !body.suche && !body.bestaetige) {
                ersetzt++;
                const echt = await (await route.fetch()).json();
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...echt, ergebnis: 'nicht_erreichbar', quelle: null, treffer: [] }) });
            }
            return route.continue();
        });
        await scanne(s, 'elektro-tel.ch');
        const stand = await warteRegister(s);
        const text = await s.page.locator('[data-handelsregister]').innerText();
        check('6: nicht erreichbar → Hinweis wortgleich, kein Anruf-Formular', stand === 'nicht_erreichbar' && text.includes('Handelsregister gerade nicht erreichbar, bitte in ein paar Minuten nochmals.') && !(await formularDa(s.page)), stand);
        await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').screenshot({ path: path.join(SCREENS, '6-nicht-erreichbar-hell.png') });
        await s.page.click('#ki-demo-hr-nochmals');
        await s.page.waitForSelector('[data-handelsregister="treffer"]', { timeout: 60000 });
        check('6: «Nochmals prüfen» → Treffer', (await eintraege(s.page)).some((e) => e.aktiv));
        await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').screenshot({ path: path.join(SCREENS, '6-treffer-hell.png') });
        check('6: keine Konsolenfehler', s.konsole.length === 0, s.konsole.slice(0, 3).join(' | '));
        await ctx.close();
    }
} finally {
    await browser.close();
}
writeFileSync(path.join(SCREENS, NUR_AUS ? 'browser-test-aus.json' : 'browser-test.json'), JSON.stringify({ ...protokoll, ergebnisse }, null, 1));
const fehler = ergebnisse.filter((e) => !e.ok).length;
console.log(`\n${ergebnisse.length - fehler}/${ergebnisse.length} Browser-Prüfungen bestanden.`);
process.exit(fehler ? 1 : 0);
