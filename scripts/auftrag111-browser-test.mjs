#!/usr/bin/env node
/**
 * auftrag111-browser-test.mjs (AUFTRAG-111) — Firma zuerst, Bindung Website ↔ Firma, im Browser.
 *
 * Gegen einen EIGENEN Server (Vorgabe http://localhost:3005, nie :3000), Build zuvor,
 * DEMO_HANDELSREGISTER=streng, echtes Zefix (lesend):
 * C) infraone.ch: sofort nach der URL «Welche ist Ihre Firma?» im Formularbereich (noch während des
 *    Scans); Telefon zeigt «Firma wird im Handelsregister geprüft …», nach den Scan-Schritten
 *    «Wartet auf die Bestätigung Ihrer Firma» — und nirgends den Scan-Namen («von InfraOne»).
 * A) dann automatischer Eintrag (UID aus dem Impressum) → «Ja, das ist meine Firma» → Anruf-Formular,
 *    Karte nennt den Handelsregister-Namen, Schritt «Handelsregister: …» ok, «<Name> ist bereit».
 * B) infraone.ch → «Nein, andere Firma suchen» → Liste nicht mehr im DOM → Suche «Elektro-Tel» →
 *    Eintrag Winterthur → bestätigen → Meldung website_passt_nicht (wortgleich), KEIN Anruf-Formular,
 *    Liste bleibt wählbar → «Andere Website eingeben» → URL-Feld vorbefüllt und fokussiert.
 * D) Mobil 375 px: Firmen-Schritt während des Scans ohne waagrechtes Scrollen.
 *
 * AUFTRAG-112 (angepasst): Vorprüfung vor der Bestätigung, Vollscan und KI-Profil erst danach — die
 * Wartezeit aufs Anruf-Formular nach «Ja, das ist meine Firma» ist deshalb 90 s statt 30 s.
 *
 * KEIN Anruf: Das Formular wird nie abgesendet; jede Seite fängt POST /api/demo/anruf ab (418).
 *
 *   $env:BASE_URL='http://localhost:3005'; node scripts/auftrag111-browser-test.mjs
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
// gleiche Regel wie Server und Widget (P5); bindung.ts hat keine Importe
import { sprechName } from '../src/lib/demo/bindung.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3005';
if (/:3000\b/.test(BASE)) {
    console.error('Port 3000 gehört dem Inhaber (Testlink) — bitte den eigenen Server auf :3005 verwenden.');
    process.exit(2);
}
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SEITE = `${BASE}/ki-telefonassistent`;

function ergebnisOrdner() {
    let d = ROOT;
    for (let i = 0; i < 8; i++) {
        if (existsSync(path.join(d, 'auftraege', 'ergebnisse'))) return path.join(d, 'auftraege', 'ergebnisse');
        d = path.dirname(d);
    }
    return path.join(ROOT, 'auftraege-ergebnisse');
}
const SCREENS = process.env.SCREENS_DIR || path.join(ergebnisOrdner(), 'A111-screens');
mkdirSync(SCREENS, { recursive: true });

const ergebnisse = [];
function check(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail: String(detail).slice(0, 600) });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);
}

const PASST_NICHT = 'Die Website infraone.ch gehört laut Handelsregister und Website-Inhalt nicht zu Elektro-Tel AG für elektrotechnische Anlagen. Bitte geben Sie die Website Ihrer Firma ein oder wählen Sie den passenden Eintrag.';
const REGISTER_INFRAONE = /[Il]nfraOne IT Solutions GmbH/; // Zefix schreibt «lnfraOne» (kleines L), siehe Bericht A109/A111

async function vorbereiten(ctx) {
    const page = await ctx.newPage();
    const konsole = [];
    page.on('console', (m) => m.type() === 'error' && konsole.push(m.text()));
    page.on('pageerror', (e) => konsole.push('pageerror: ' + e.message));
    const anrufe = [];
    await page.route('**/api/demo/anruf', (route) => {
        anrufe.push(route.request().postData());
        return route.fulfill({ status: 418, contentType: 'application/json', body: '{"fehler":"Test: keine Anrufe"}' });
    });
    const daten = { scan: null, profil: null, hr: [] };
    page.on('response', async (res) => {
        if (res.request().method() !== 'POST') return;
        if (res.url().endsWith('/api/demo/scan')) daten.scan = await res.json().catch(() => null);
        if (res.url().endsWith('/api/demo/profil')) daten.profil = await res.json().catch(() => null);
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
    const t0 = Date.now();
    await s.page.click('#ki-demo-scan-knopf');
    return t0;
}

async function warteRegister(s, timeout = 90000) {
    await s.page.waitForSelector('[data-handelsregister]:not([data-handelsregister="pruefen"])', { timeout });
    await s.page.waitForTimeout(300);
    return s.page.getAttribute('[data-handelsregister]', 'data-handelsregister');
}

const eintraege = (page) =>
    page.$$eval('[data-handelsregister] label[data-uid]', (ls) => ls.map((l) => ({ uid: l.getAttribute('data-uid'), aktiv: l.getAttribute('data-aktiv') === 'true', text: l.innerText.replace(/\s+/g, ' ').trim() })));
const formularDa = (page) => page.locator('#ki-demo-nummer').count().then((n) => n > 0);
/** Schritte im Telefon: Titel und Stand (ok/leer/laeuft am Symbol) */
const telefonSchritte = (page) =>
    page.$$eval('figure ol[aria-label="Scan-Schritte"] > li', (ls) =>
        ls.map((li) => {
            const svg = li.querySelector('span svg');
            const k = svg?.getAttribute('class') ?? '';
            // textContent: nach «bereit» ist die Scan-Ansicht ausgeblendet (innerText wäre leer)
            return { titel: (li.querySelector('[data-schritt-titel]')?.textContent ?? '').trim(), stand: /lucide-check/.test(k) ? 'ok' : /lucide-minus/.test(k) ? 'leer' : 'laeuft' };
        }),
    );
const telefonText = (page) => page.$eval('figure', (f) => f.textContent ?? '');
const aktion = (page) => page.locator('section[aria-labelledby="ki-demo-anruf-titel"]');

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const protokoll = { zeit: new Date().toISOString(), basis: BASE, laeufe: [] };
try {
    /* C + A: infraone.ch — Firma zuerst, Karte erst nach der Bestätigung */
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        const t0 = await scanne(s, 'infraone.ch');
        await s.page.waitForSelector('[data-handelsregister]', { timeout: 5000 });
        const msBisFirma = Date.now() - t0;
        const titelSofort = await s.page.locator('#ki-demo-anruf-titel').innerText();
        const knopfSofort = await s.page.getAttribute('#ki-demo-scan-knopf', 'data-zustand').catch(() => null);
        check('C: sofort nach der URL «Welche ist Ihre Firma?» im Formularbereich (Scan läuft noch)', titelSofort === 'Welche ist Ihre Firma?' && knopfSofort === 'scan', `${msBisFirma} ms, Titel «${titelSofort}», Scan-Knopf ${knopfSofort}`);
        await s.page.screenshot({ path: path.join(SCREENS, 'C-1-sofort-nach-url.png') });

        const stand = await warteRegister(s);
        const liste = await eintraege(s.page);
        const untertitel = await s.page.locator('#ki-demo-hr-untertitel').innerText().catch(() => '');
        const scanFirma = s.daten.scan?.profil?.firma ?? s.daten.scan?.funde?.firma ?? '';
        check('A: automatischer Eintrag (UID aus dem Impressum) «lnfraOne IT Solutions GmbH»', stand === 'treffer' && liste.length === 1 && REGISTER_INFRAONE.test(liste[0].text) && liste[0].uid === 'CHE288114187', liste.map((e) => e.text).join(' || '));
        check('P6: Untertitel bei genau einem Treffer (wortgleich)', untertitel === 'Diesen Eintrag haben wir zu infraone.ch im Handelsregister gefunden.', untertitel);

        // Scan-Schritte zu Ende laufen lassen, ohne zu bestätigen
        await s.page.waitForFunction(() => /Wartet auf die Bestätigung Ihrer Firma/.test(document.querySelector('figure')?.textContent ?? ''), null, { timeout: 90000 });
        const schritte = await telefonSchritte(s.page);
        const hrSchritt = schritte.find((x) => x.titel.startsWith('Firma wird im Handelsregister geprüft') || x.titel.startsWith('Handelsregister'));
        const assistent = schritte[schritte.length - 1];
        check('C: Telefon-Schritt «Firma wird im Handelsregister geprüft …» während der Prüfung', hrSchritt?.titel === 'Firma wird im Handelsregister geprüft …' && hrSchritt.stand === 'laeuft', JSON.stringify(hrSchritt));
        check('C: Schritt «Assistent» wartet: «Wartet auf die Bestätigung Ihrer Firma» (neutral)', assistent?.titel === 'Wartet auf die Bestätigung Ihrer Firma' && assistent.stand === 'leer', JSON.stringify(assistent));
        const tt = await telefonText(s.page);
        check('C: Karte/Telefon nennt vor der Bestätigung keinen Firmennamen aus dem Scan (kein «von InfraOne»)', !/von\s+[Il]nfraOne/i.test(tt) && !(scanFirma && tt.includes(`von ${scanFirma}`)), `Scan-Firma «${scanFirma}»; Telefontext enthält «von InfraOne»: ${/von\s+[Il]nfraOne/i.test(tt)}`);
        check('C: noch keine Assistenten-Karte und kein Anruf-Formular', (await s.page.locator('figure [role="group"]').count()) === 0 && !(await formularDa(s.page)));
        const andere = await s.page.locator('button', { hasText: 'Andere Website' }).count();
        check('C: Scan fertig, Firma offen → «Andere Website» statt «Wird gescannt …»', andere === 1 && (await s.page.locator('#ki-demo-scan-knopf').count()) === 0);
        await s.page.screenshot({ path: path.join(SCREENS, 'C-2-wartet-auf-bestaetigung.png') });

        // A: bestätigen
        await s.page.click('#ki-demo-hr-bestaetigen');
        // AUFTRAG-112 (angepasst): Vollscan und KI-Profil laufen erst nach der Bestätigung → bis 90 s (wie A-109)
        await s.page.waitForSelector('#ki-demo-nummer', { state: 'visible', timeout: 90000 });
        await s.page.waitForTimeout(400);
        const rolle = await s.page.$eval('figure [role="group"] p[title]', (p) => ({ text: p.textContent?.trim() ?? '', titel: p.getAttribute('title') ?? '' })).catch(() => null);
        const nach = await telefonSchritte(s.page);
        const hrOk = nach.find((x) => x.titel.startsWith('Handelsregister:'));
        const bereit = nach[nach.length - 1];
        const bestaetigt = await s.page.getAttribute('[data-handelsregister-bestaetigt]', 'data-handelsregister-bestaetigt');
        const zeile = await s.page.locator('[data-handelsregister-bestaetigt]').innerText();
        const begruessung = await s.page.$eval('figure [role="group"] blockquote', (q) => q.textContent ?? '').catch(() => '');
        const marke = s.daten.profil?.profil?.firma ?? s.daten.scan?.profil?.firma ?? '';
        const registerName = liste[0]?.text.split(' Sitz: ')[0] ?? '';
        const sprech = sprechName(marke, registerName);
        check('A: nach «Ja, das ist meine Firma» Anruf-Formular sichtbar (nicht abgesendet)', (await formularDa(s.page)) && (await s.page.getAttribute('#ki-demo-anruf-knopf', 'data-zustand')) === 'bereit' && s.anrufe.length === 0);
        check('A: Karte nennt den Handelsregister-Namen («… von lnfraOne IT Solutions GmbH»)', !!rolle && REGISTER_INFRAONE.test(rolle.text) && /^KI-Telefonassistent(in)? von /.test(rolle.text), JSON.stringify(rolle));
        check('A: Schritt «Handelsregister: …» ok', !!hrOk && REGISTER_INFRAONE.test(hrOk.titel) && hrOk.stand === 'ok', JSON.stringify(hrOk));
        check('A: «<Name> ist bereit» erst nach der Bestätigung', / ist bereit$/.test(bereit?.titel ?? '') && bereit.stand === 'ok', JSON.stringify(bereit));
        check('A: Zeile «Handelsregister: Name, Sitz · UID» über dem Formular', bestaetigt === 'CHE288114187' && /Winterthur/.test(zeile) && /CHE-288\.114\.187/.test(zeile), zeile.replace(/\s+/g, ' '));
        check('P5: Begrüssung mit dem gebundenen Sprechnamen (Marke passt zum Registernamen → Marke)', begruessung.includes(`von ${sprech}.`) && !begruessung.includes('lnfraOne'), `Marke «${marke}», Register «${registerName}» → «${sprech}»; ${begruessung.trim().slice(0, 110)}`);
        check('A: keine Konsolenfehler', s.konsole.length === 0, s.konsole.slice(0, 3).join(' | '));
        await s.page.screenshot({ path: path.join(SCREENS, 'A-bestaetigt-formular.png') });
        await aktion(s.page).screenshot({ path: path.join(SCREENS, 'A-formular-ausschnitt.png') });
        protokoll.laeufe.push({ test: 'C+A infraone.ch', scanId: s.daten.scan?.scan_id, msBisFirma, scanFirma, rolle, hrSchritt: hrOk, bereit, auto: s.daten.hr.find((x) => !x.body.suche && !x.body.bestaetige)?.antwort ?? null });
        await ctx.close();
    }

    /* B: infraone.ch + fremde Firma → website_passt_nicht */
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        await scanne(s, 'infraone.ch');
        const stand = await warteRegister(s);
        check('B: Treffer zu infraone.ch', stand === 'treffer');
        await s.page.click('#ki-demo-hr-andere');
        await s.page.waitForSelector('#ki-demo-hr-suche', { state: 'visible', timeout: 5000 });
        const imDom = await s.page.locator('[data-handelsregister] label[data-uid]').count();
        const zurueck = await s.page.locator('#ki-demo-hr-zurueck').innerText().catch(() => '');
        check('B (P3): «Nein, andere Firma suchen» → Liste nicht mehr im DOM, nur das Suchformular', imDom === 0 && (await s.page.getAttribute('[data-handelsregister]', 'data-hr-liste')) === 'zu' && (await s.page.locator('#ki-demo-hr-bestaetigen').count()) === 0, `Einträge im DOM: ${imDom}`);
        check('B (P3): Textlink «Zurück zu den Vorschlägen» darunter', zurueck === 'Zurück zu den Vorschlägen');
        await s.page.screenshot({ path: path.join(SCREENS, 'B-1-liste-eingeklappt.png') });
        // Zurück → Liste wieder da, dann erneut einklappen
        await s.page.click('#ki-demo-hr-zurueck');
        const wieder = await s.page.locator('[data-handelsregister] label[data-uid]').count();
        check('B (P3): «Zurück zu den Vorschlägen» zeigt die Liste wieder', wieder === 1, `${wieder}`);
        await s.page.click('#ki-demo-hr-andere');
        await s.page.fill('#ki-demo-hr-suche', 'Elektro-Tel');
        await s.page.click('#ki-demo-hr-suchen');
        await s.page.waitForSelector('[data-handelsregister="treffer"] label[data-uid="CHE107160757"]', { timeout: 30000 });
        const liste = await eintraege(s.page);
        check('B (P4): Liste der eigenen Suche ersetzt die automatische (kein InfraOne-Eintrag mehr)', liste.length >= 1 && liste.length <= 5 && !liste.some((e) => e.uid === 'CHE288114187'), liste.map((e) => e.text.split(' Sitz: ')[0] + ' / ' + (e.text.split(' Sitz: ')[1] ?? '').split(' ')[0]).join(' | '));
        await s.page.click('label[data-uid="CHE107160757"]');
        await s.page.click('#ki-demo-hr-bestaetigen');
        await s.page.waitForSelector('[data-hr-passt-nicht] [role="alert"]', { timeout: 15000 });
        const meldung = (await s.page.locator('[data-hr-passt-nicht] [role="alert"]').innerText()).replace(/\s+/g, ' ').trim();
        const fett = await s.page.$$eval('[data-hr-passt-nicht] [role="alert"] strong', (x) => x.map((e) => e.textContent));
        const antwort409 = s.daten.hr.find((x) => x.body.bestaetige);
        check('B: Meldung website_passt_nicht wortgleich, Website und Firma fett', meldung === PASST_NICHT && JSON.stringify(fett) === JSON.stringify(['infraone.ch', 'Elektro-Tel AG für elektrotechnische Anlagen']), meldung);
        check('B: Server antwortet 409 {code: "website_passt_nicht"}', antwort409?.status === 409 && antwort409.antwort?.code === 'website_passt_nicht', JSON.stringify(antwort409?.antwort ?? null).slice(0, 200));
        check('B: KEIN Anruf-Formular, Liste bleibt wählbar', !(await formularDa(s.page)) && (await s.page.locator('[data-handelsregister] input[type="radio"]:not([disabled])').count()) >= 1 && s.anrufe.length === 0);
        const rest = s.daten.hr.filter((x) => x.body.suche).map((x) => x.antwort?.versuche_rest);
        const rueck = await s.page.evaluate(async (id) => (await fetch('/api/demo/handelsregister', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scan_id: id }) })).json(), s.daten.scan?.scan_id);
        check('B: 409 zählt nicht als Suchversuch (nach 1 Suche: noch 2)', JSON.stringify(rest) === '[2]' && rueck?.versuche_rest === 2 && rueck?.ergebnis !== 'bestaetigt', `${JSON.stringify(rest)} / Server ${rueck?.versuche_rest} ${rueck?.ergebnis}`);
        await s.page.screenshot({ path: path.join(SCREENS, 'B-2-website-passt-nicht.png') });
        await aktion(s.page).screenshot({ path: path.join(SCREENS, 'B-2-website-passt-nicht-ausschnitt.png') });
        // «Andere Website eingeben» → URL-Feld vorbefüllt und fokussiert, Scan zurückgesetzt
        await s.page.click('#ki-demo-hr-andere-website');
        await s.page.waitForSelector('#ki-demo-scan-knopf[data-zustand="eingabe"]', { timeout: 5000 });
        await s.page.waitForTimeout(150);
        const feld = await s.page.evaluate(() => ({ wert: document.getElementById('ki-demo-url')?.value, fokus: document.activeElement?.id, nurLesen: document.getElementById('ki-demo-url')?.readOnly }));
        check('B: «Andere Website eingeben» → URL-Feld vorbefüllt und fokussiert, Scan zurückgesetzt', feld.wert === 'infraone.ch' && feld.fokus === 'ki-demo-url' && feld.nurLesen === false && (await s.page.locator('[data-handelsregister]').count()) === 0 && (await s.page.locator('section[aria-labelledby="ki-demo-anruf-titel"]').count()) === 0, JSON.stringify(feld));
        const unerwartet = s.konsole.filter((k) => !/status of 409/.test(k));
        check('B: keine unerwarteten Konsolenfehler (nur die bewusste 409)', unerwartet.length === 0, unerwartet.slice(0, 3).join(' | '));
        await s.page.screenshot({ path: path.join(SCREENS, 'B-3-andere-website.png') });
        protokoll.laeufe.push({ test: 'B infraone.ch + Elektro-Tel', scanId: s.daten.scan?.scan_id, versuche: rest, antwort409: antwort409?.antwort ?? null });
        await ctx.close();
    }

    /* D: mobil 375 px — Firmen-Schritt während des Scans */
    {
        const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: 'de-CH', isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
        const s = await vorbereiten(ctx);
        await scanne(s, 'infraone.ch');
        await warteRegister(s);
        await aktion(s.page).scrollIntoViewIfNeeded();
        const breite = await s.page.evaluate(() => ({ seite: document.documentElement.scrollWidth, fenster: window.innerWidth, karte: Math.round(document.querySelector('section[aria-labelledby="ki-demo-anruf-titel"]')?.getBoundingClientRect().right ?? 0) }));
        check('D: mobil 375 px — «Welche ist Ihre Firma?» ohne waagrechtes Scrollen', breite.seite <= breite.fenster && breite.karte <= breite.fenster, JSON.stringify(breite));
        await aktion(s.page).screenshot({ path: path.join(SCREENS, 'D-mobil-375-firma.png') });
        await ctx.close();
    }
} finally {
    await browser.close();
}
writeFileSync(path.join(SCREENS, 'browser-test.json'), JSON.stringify({ ...protokoll, ergebnisse }, null, 1));
const fehler = ergebnisse.filter((e) => !e.ok).length;
console.log(`\n${ergebnisse.length - fehler}/${ergebnisse.length} Browser-Prüfungen bestanden.`);
process.exit(fehler ? 1 : 0);
