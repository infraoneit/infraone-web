#!/usr/bin/env node
/**
 * auftrag110-browser-test.mjs (AUFTRAG-110) — Browser-Test des Bereichs /ki-telefonassistent
 * gegen einen lokalen Server (Vorgabe http://localhost:3102, nie Port 3000).
 *
 * Je Seite (Desktop 1440 px und Mobil 375 px): genau eine sichtbare H1, keine Script-Fehler,
 * kein horizontales Scrollen bei 375 px, Ganzseiten-Screenshot nach auftraege/ergebnisse/A110-screens/.
 * Dazu: Entwurfsband auf /preise und Hub sichtbar, Rechner «verpasster Anruf» (leer = kein Ergebnis,
 * Handrechnung, ungültige Eingabe), Mega-Menü «KI-Telefonassistent» bei 1440 und 1024 px
 * (Leiste ohne Überlappung), mobiles Akkordeon, Footer-Spalte, Hub in hellem Modus.
 *
 * Sicherheit: Alle Aufrufe auf /api/demo/** werden im Browser abgefangen — kein Scan, kein Anruf.
 *
 *   BASE_URL=http://localhost:3102 node scripts/auftrag110-browser-test.mjs
 */
import { chromium } from 'playwright-core';
import { registerHooks } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
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
const { KI_SEITEN, KI_BASIS, KI_PREISE_PFAD } = await import(pathToFileURL(path.join(ROOT, 'src/components/ki-telefonassistent/seiten.ts')).href);
const { PREISE_FREIGEGEBEN } = await import(pathToFileURL(path.join(ROOT, 'src/lib/ki-telefonassistent-preise.ts')).href);

const BASE = (process.env.BASE_URL || 'http://localhost:3102').replace(/\/$/, '');
if (/:3000\b/.test(BASE)) throw new Error('Port 3000 gehört dem Manager — bitte 3102 verwenden.');
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

/** auftraege/ liegt neben dem Repo (Haupt-Checkout) — vom Worktree aus nach oben suchen */
function auftraegeOrdner() {
    let d = ROOT;
    for (let i = 0; i < 6; i++) {
        if (existsSync(path.join(d, 'auftraege'))) return path.join(d, 'auftraege');
        d = path.dirname(d);
    }
    return path.join(ROOT, 'auftraege');
}
const SCREENS = process.env.A110_SCREENS || path.join(auftraegeOrdner(), 'ergebnisse', 'A110-screens');
mkdirSync(SCREENS, { recursive: true });

const ergebnisse = [];
function check(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 220) : ''}`);
}
const dateiName = (pfad) => (pfad === KI_BASIS ? 'hub' : pfad.slice(KI_BASIS.length + 1).replace(/\//g, '_'));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

async function neueSeite(viewport, { hell = false, mobil = false } = {}) {
    // reducedMotion: die scroll-gesteuerten Einblendungen (animation-timeline: view()) würden in
    // Ganzseiten-Screenshots ausserhalb des Fensters unsichtbar bleiben; mit «reduce» ist alles sichtbar.
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobil, hasTouch: mobil, locale: 'de-CH', reducedMotion: 'reduce' });
    if (hell) await ctx.addInitScript(() => localStorage.setItem('theme', 'light'));
    // Sicherheit: kein Scan, kein Anruf, keine Profil-Abfrage
    await ctx.route('**/api/demo/**', (route) => route.fulfill({ status: 418, contentType: 'application/json', body: '{"fehler":"A110-Test: Demo-API gesperrt"}' }));
    const page = await ctx.newPage();
    const fehler = [];
    page.on('pageerror', (e) => fehler.push('pageerror: ' + e.message));
    page.on('console', (m) => {
        if (m.type() !== 'error') return;
        const t = m.text();
        if (/api\/demo|418|Failed to load resource/i.test(t)) return; // gewollt gesperrte Demo-API
        fehler.push(t);
    });
    return { ctx, page, fehler };
}

async function lade(page, pfad) {
    const r = await page.goto(`${BASE}${pfad}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(400);
    return r;
}

/* ---------------- je Seite: Desktop und 375 px ---------------- */
const desktop = await neueSeite({ width: 1440, height: 900 });
const mobil = await neueSeite({ width: 375, height: 812 }, { mobil: true });

for (const s of KI_SEITEN) {
    const n = dateiName(s.pfad);
    for (const [art, sitzung] of [
        ['desktop', desktop],
        ['375', mobil],
    ]) {
        sitzung.fehler.length = 0;
        const r = await lade(sitzung.page, s.pfad);
        check(`${s.pfad} [${art}]: HTTP 200`, r?.status() === 200, r?.status());
        const h1 = await sitzung.page.locator('h1').count();
        const h1Sichtbar = h1 === 1 && (await sitzung.page.locator('h1').first().isVisible());
        check(`${s.pfad} [${art}]: genau eine sichtbare H1`, h1Sichtbar, `${h1} H1`);
        if (art === '375') {
            const breite = await sitzung.page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
            check(`${s.pfad} [375]: kein horizontales Scrollen`, breite.scroll <= breite.client + 1, `${breite.scroll} > ${breite.client}`);
        }
        await sitzung.page.screenshot({ path: path.join(SCREENS, `${n}-${art}.png`), fullPage: true });
        check(`${s.pfad} [${art}]: keine Script-Fehler`, sitzung.fehler.length === 0, sitzung.fehler.join(' | '));
    }
}

/* ---------------- Entwurfsband ---------------- */
if (!PREISE_FREIGEGEBEN) {
    for (const pfad of [KI_PREISE_PFAD, KI_BASIS]) {
        await lade(desktop.page, pfad);
        const band = desktop.page.locator('[data-entwurf="preise"]').first();
        await band.scrollIntoViewIfNeeded();
        const text = (await band.textContent()) ?? '';
        check(`${pfad}: Entwurfsband sichtbar`, (await band.isVisible()) && /Entwurf, Preise noch nicht freigegeben/.test(text), text.slice(0, 80));
        if (pfad === KI_BASIS) await desktop.page.locator('#preise').screenshot({ path: path.join(SCREENS, 'hub-preis-teaser-desktop.png') });
    }
    await lade(desktop.page, KI_PREISE_PFAD);
    const robots = await desktop.page.locator('meta[name="robots"]').getAttribute('content');
    check('/preise: robots noindex', /noindex/.test(robots ?? ''), robots);
}

/* ---------------- Rechner «Was kostet ein verpasster Anruf?» ---------------- */
{
    const p = desktop.page;
    await lade(p, KI_PREISE_PFAD);
    const rechner = p.locator('[data-rechner="verpasste-anrufe"]');
    await rechner.scrollIntoViewIfNeeded();
    const ergebnis = rechner.locator('[aria-live="polite"]');
    check('Rechner: leer → kein Ergebnis', (await ergebnis.getAttribute('data-ergebnis')) === 'nein' && (await rechner.locator('[data-wert="umsatz-monat"]').count()) === 0);
    await rechner.locator('input[name="anrufe"]').fill('20');
    await rechner.locator('input[name="verpasst"]').fill('15');
    await rechner.locator('input[name="wert"]').fill('800');
    check('Rechner: unvollständig → kein Ergebnis', (await ergebnis.getAttribute('data-ergebnis')) === 'nein');
    await rechner.locator('input[name="treffer"]').fill('30');
    await rechner.locator('input[name="tage"]').fill('21');
    // Handrechnung: 20 × 21 × 15 % = 63 verpasste Anrufe; × 30 % = 18.9 Aufträge; × 800 = 15'120 CHF; × 12 = 181'440 CHF
    const wert = async (k) => (await rechner.locator(`[data-wert="${k}"]`).textContent())?.trim();
    const werte = { monat: await wert('umsatz-monat'), anrufe: await wert('anrufe-monat'), auftraege: await wert('auftraege-monat'), jahr: await wert('umsatz-jahr') };
    check("Rechner: 20/15 %/800/30 %/21 → CHF 15'120 pro Monat (Handrechnung)", werte.monat === "CHF 15'120" && werte.anrufe === '63' && werte.auftraege === '18.9' && werte.jahr === "CHF 181'440", JSON.stringify(werte));
    await rechner.screenshot({ path: path.join(SCREENS, 'preise-rechner-ergebnis-desktop.png') });
    await rechner.locator('input[name="wert"]').fill('');
    check('Rechner: Feld geleert → Ergebnis verschwindet', (await ergebnis.getAttribute('data-ergebnis')) === 'nein');
    await rechner.locator('input[name="wert"]').fill('abc');
    const fehlerText = await rechner.locator('[id$="-wert-fehler"]').textContent().catch(() => null);
    check('Rechner: ungültige Eingabe → Hinweis, kein Ergebnis', !!fehlerText && (await ergebnis.getAttribute('data-ergebnis')) === 'nein', fehlerText);
    await rechner.locator('input[name="verpasst"]').fill('150');
    await rechner.locator('input[name="wert"]').fill('800');
    check('Rechner: 150 % → Hinweis, kein Ergebnis', (await ergebnis.getAttribute('data-ergebnis')) === 'nein');
}

/* ---------------- Hub: Widget eingebettet ---------------- */
{
    await lade(desktop.page, KI_BASIS);
    check('Hub: Widget-Eingabe sichtbar (#ki-demo-url)', await desktop.page.locator('#ki-demo-url').isVisible());
    check('Hub: Anker #betriebe (Menü «Für wen») vorhanden', (await desktop.page.locator('#betriebe').count()) === 1);
    check('Hub: Abschluss-CTA springt nativ zu #live-test', (await desktop.page.locator('a[href="#live-test"]').count()) >= 1 && (await desktop.page.locator('#live-test').count()) === 1);
}

/* ---------------- Mega-Menü Desktop 1440 ---------------- */
{
    const p = desktop.page;
    await lade(p, '/');
    await p.click('#nav-knopf-ki');
    const panel = p.locator('#nav-panel-ki');
    await p.waitForTimeout(350);
    const offen = (await panel.getAttribute('data-offen')) === 'true' && (await panel.isVisible());
    const links = await panel.locator('a').count();
    check('Menü 1440: Panel «KI-Telefonassistent» öffnet', offen, `data-offen=${await panel.getAttribute('data-offen')}`);
    check('Menü 1440: alle Bereichsseiten verlinkt', links >= KI_SEITEN.length, `${links} Links`);
    await p.screenshot({ path: path.join(SCREENS, 'menue-ki-1440.png') });
    await p.keyboard.press('Escape');
    await p.waitForTimeout(250);
    check('Menü 1440: Escape schliesst', (await panel.getAttribute('data-offen')) === 'false');
}

/* ---------------- Leiste bei 1024 px ---------------- */
{
    const s1024 = await neueSeite({ width: 1024, height: 768 });
    await lade(s1024.page, KI_BASIS);
    const mass = await s1024.page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Hauptnavigation"] > ul');
        const header = document.querySelector('header');
        const aktionen = header?.querySelector('.lg\\:flex.items-center.gap-3');
        const logo = header?.querySelector('a[href="/"]');
        const knoepfe = [...(nav?.children ?? [])].map((li) => li.getBoundingClientRect());
        const ziele = [...(nav?.querySelectorAll(':scope > li > button, :scope > li > a') ?? [])];
        const n = nav?.getBoundingClientRect();
        return {
            navLinks: n?.left,
            navRechts: n?.right,
            logoRechts: logo?.getBoundingClientRect().right,
            aktionenLinks: aktionen?.getBoundingClientRect().left,
            // jeder Menüpunkt genau eine Zeile (40 px hoch, Text nicht umgebrochen)
            einzeilig: new Set(knoepfe.map((r) => Math.round(r.top))).size === 1 && ziele.every((z) => Math.round(z.getBoundingClientRect().height) === 40 && z.scrollWidth <= z.clientWidth + 1) && ziele.every((z) => [...z.querySelectorAll('span')].filter((sp) => sp.offsetParent).every((sp) => sp.getClientRects().length <= 1)),
            kopfHoehe: header?.querySelector('.h-16')?.getBoundingClientRect().height,
            scroll: document.documentElement.scrollWidth,
            client: document.documentElement.clientWidth,
        };
    });
    check('Leiste 1024: Menü hält ≥ 8 px Abstand zu Logo und Aktionen', mass.navLinks - mass.logoRechts >= 8 && mass.aktionenLinks - mass.navRechts >= 8, JSON.stringify(mass));
    check('Leiste 1024: Menüpunkte einzeilig, Kopf 80 px', mass.einzeilig && Math.round(mass.kopfHoehe) === 80, JSON.stringify(mass));
    check('Leiste 1024: kein horizontales Scrollen', mass.scroll <= mass.client + 1, `${mass.scroll}/${mass.client}`);
    await s1024.page.click('#nav-knopf-ki');
    await s1024.page.waitForTimeout(350);
    const ueberlauf = await s1024.page.evaluate(() => {
        const panel = document.getElementById('nav-panel-ki');
        const r = panel.getBoundingClientRect();
        const zuBreit = [...panel.querySelectorAll('a')].filter((a) => a.scrollWidth > a.clientWidth + 1).length;
        return { links: r.left, rechts: r.right, breite: window.innerWidth, zuBreit };
    });
    check('Menü 1024: Panel innerhalb des Fensters, keine abgeschnittenen Links', ueberlauf.links >= 0 && ueberlauf.rechts <= ueberlauf.breite && ueberlauf.zuBreit === 0, JSON.stringify(ueberlauf));
    await s1024.page.screenshot({ path: path.join(SCREENS, 'menue-ki-1024.png') });
    await s1024.ctx.close();
}

/* ---------------- Mobil-Menü 375 ---------------- */
{
    const p = mobil.page;
    await lade(p, '/');
    await p.click('#nav-mobil-knopf');
    await p.waitForTimeout(300);
    await p.click('#nav-mobil-knopf-ki');
    await p.waitForTimeout(400);
    const bereich = p.locator('#nav-mobil-ki');
    const sichtbar = (await bereich.getAttribute('data-offen')) === 'true';
    const funktionen = await bereich.locator(`a[href="${KI_BASIS}/funktionen"]`).isVisible();
    check('Menü 375: Akkordeon «KI-Telefonassistent» öffnet, Links sichtbar', sichtbar && funktionen);
    await p.screenshot({ path: path.join(SCREENS, 'menue-ki-375.png') });
}

/* ---------------- Footer-Spalte ---------------- */
{
    await lade(desktop.page, '/');
    const footer = desktop.page.locator('footer');
    const kiSpalte = footer.locator('h3', { hasText: 'KI-Telefonassistent' });
    check('Footer: Spalte «KI-Telefonassistent» mit Link zu /faq', (await kiSpalte.count()) === 1 && (await footer.locator(`a[href="${KI_BASIS}/faq"]`).count()) === 1);
    await footer.screenshot({ path: path.join(SCREENS, 'footer-1440.png') });
    const s1024 = await neueSeite({ width: 1024, height: 768 });
    await lade(s1024.page, '/');
    await s1024.page.locator('footer').screenshot({ path: path.join(SCREENS, 'footer-1024.png') });
    const ueberlauf = await s1024.page.evaluate(() => [...document.querySelectorAll('footer a, footer p')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim().slice(0, 30)));
    check('Footer 1024: kein abgeschnittener Text', ueberlauf.length === 0, ueberlauf.join(' | '));
    await s1024.ctx.close();
}

/* ---------------- Heller Modus ---------------- */
{
    const hell = await neueSeite({ width: 1440, height: 900 }, { hell: true });
    for (const pfad of [KI_BASIS, `${KI_BASIS}/anwendungen/erreichbarkeit`, KI_PREISE_PFAD]) {
        await lade(hell.page, pfad);
        const dunkel = await hell.page.evaluate(() => document.documentElement.classList.contains('dark'));
        check(`${pfad} [hell]: heller Modus aktiv`, !dunkel);
        await hell.page.screenshot({ path: path.join(SCREENS, `${dateiName(pfad)}-desktop-hell.png`), fullPage: true });
    }
    await hell.ctx.close();
}

await desktop.ctx.close();
await mobil.ctx.close();
await browser.close();

const ok = ergebnisse.filter((e) => e.ok).length;
console.log(`\n${ok}/${ergebnisse.length} bestanden · Screenshots: ${SCREENS}`);
writeFileSync(path.join(SCREENS, '_ergebnis.json'), JSON.stringify({ base: BASE, ergebnisse }, null, 2));
process.exit(ok === ergebnisse.length ? 0 : 1);
