#!/usr/bin/env node
/**
 * auftrag112-browser-test.mjs (AUFTRAG-112) — «Das URL-Feld ist das Tor» im Browser.
 *
 * Gegen einen EIGENEN Server (Vorgabe http://localhost:3005, nie :3000), Build zuvor,
 * DEMO_HANDELSREGISTER=streng, echtes Zefix und echter Inhaltsfilter (Cloudflare for Families, lesend):
 * A) pornhub.com → Meldung MELDUNG.urlInhalt wortgleich unter dem Feld, keine Schritte im Telefon, kein
 *    Aufruf von /api/demo/handelsregister oder /api/demo/profil (Netzmitschnitt der Seite), Feld behält
 *    den Wert und hat den Fokus.
 * B) elektro-tel.ch → nach der Antwort der Vorprüfung zeigt das Telefon genau «Website erreichbar»,
 *    «Firma wird im Handelsregister geprüft …», «Wartet auf die Bestätigung Ihrer Firma»; keine Chips,
 *    Welle neutral; die Scan-Antwort enthält keine logos/funde/profil; Firmenliste erscheint (mit der
 *    Zeile «Ihre Website lesen wir erst, …»). Nach «Ja, das ist meine Firma»: «Website wird gelesen …» →
 *    «Website gelesen», Logo-/Farbe-/Wissen-Schritte, Chips, Formular (nicht abgesendet).
 * C) httpbin.org → «Firma nicht gefunden», keine Chips, Telefon «Firma im Handelsregister nicht gefunden»;
 *    eigene Suche «Elektro-Tel» → bestätigen → 409 website_passt_nicht (wie A-111), kein Vollscan.
 * D) direkt per fetch: POST /api/demo/scan {scan_id} ohne Nachweis → 403 handelsregister_fehlt;
 *    POST /api/demo/profil auf einem Vorprüfungs-Scan → 409 scan_unvollstaendig; {url, scan_id} → 400
 *    (dazu faehigkeiten und bild → 409).
 * E) Mobil 375 px, Zustand B vor der Bestätigung: kein waagrechtes Scrollen, Screenshot.
 * F) Fehler im Vollscan (im Browser simuliert: erste Antwort 422, zweite 403 «abgelaufen» samt passender
 *    Register-Antwort ohne Bestätigung): Schritt «website» auf Fehler, Hinweis mit dem Servertext,
 *    «Nochmals versuchen» → 403 → Firmen-Schritt mit Hinweis → erneut bestätigen → echter Vollscan → Formular.
 *
 * KEIN Anruf: Das Formular wird nie abgesendet; jede Seite fängt POST /api/demo/anruf ab (418).
 *
 *   $env:BASE_URL='http://localhost:3005'; $env:SCREENS_DIR='…\A112-screens'; node scripts/auftrag112-browser-test.mjs
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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
const SCREENS = process.env.SCREENS_DIR || path.join(ergebnisOrdner(), 'A112-screens');
mkdirSync(SCREENS, { recursive: true });

const ergebnisse = [];
function check(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail: String(detail).slice(0, 600) });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);
}

// Texte wortgleich aus AUFTRAG-112, Abschnitt 4
const URL_INHALT = 'Diese Website können wir für die Demo nicht verwenden. Bitte geben Sie die Website Ihrer Firma ein.';
const UNVOLLSTAENDIG = 'Ihr Assistent wird noch vorbereitet. Bitte bestätigen Sie zuerst Ihre Firma und warten Sie einen Moment.';
const LESE_HINWEIS = 'Ihre Website lesen wir erst, nachdem Sie Ihre Firma bestätigt haben.';
const SCHRITTE_VOR = ['Website erreichbar', 'Firma wird im Handelsregister geprüft …', 'Wartet auf die Bestätigung Ihrer Firma'];
const PASST_NICHT_HTTPBIN = 'Die Website httpbin.org gehört laut Handelsregister und Website-Inhalt nicht zu Elektro-Tel AG für elektrotechnische Anlagen. Bitte geben Sie die Website Ihrer Firma ein oder wählen Sie den passenden Eintrag.';
const GRUEN_LEERLAUF = '#4CAF50';

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
    // Netzmitschnitt: alle Anfragen an die Demo-API (Reihenfolge), Antworten von Scan und Handelsregister
    const anfragen = [];
    page.on('request', (r) => {
        const u = new URL(r.url());
        if (u.pathname.startsWith('/api/demo/')) anfragen.push({ t: Date.now(), methode: r.method(), pfad: u.pathname, body: r.postData() ?? null });
    });
    const daten = { scans: [], profil: null, hr: [] };
    page.on('response', async (res) => {
        if (res.request().method() !== 'POST') return;
        const u = res.url();
        const body = JSON.parse(res.request().postData() || '{}');
        if (u.endsWith('/api/demo/scan')) daten.scans.push({ t: Date.now(), status: res.status(), body, antwort: await res.json().catch(() => null) });
        if (u.endsWith('/api/demo/profil')) daten.profil = await res.json().catch(() => null);
        if (u.endsWith('/api/demo/handelsregister')) daten.hr.push({ status: res.status(), body, antwort: await res.json().catch(() => null) });
    });
    await page.goto(SEITE, { waitUntil: 'networkidle' });
    return { page, konsole, daten, anrufe, anfragen };
}

async function scanne(s, site) {
    await s.page.fill('#ki-demo-url', site);
    const antwort = s.page.waitForResponse((r) => r.url().endsWith('/api/demo/scan') && r.request().method() === 'POST', { timeout: 30000 });
    await s.page.click('#ki-demo-scan-knopf');
    return antwort;
}

async function warteRegister(s, timeout = 90000) {
    await s.page.waitForSelector('[data-handelsregister]:not([data-handelsregister="pruefen"])', { timeout });
    await s.page.waitForTimeout(300);
    return s.page.getAttribute('[data-handelsregister]', 'data-handelsregister');
}

const eintraege = (page) =>
    page.$$eval('[data-handelsregister] label[data-uid]', (ls) => ls.map((l) => ({ uid: l.getAttribute('data-uid'), aktiv: l.getAttribute('data-aktiv') === 'true', text: l.innerText.replace(/\s+/g, ' ').trim() })));
const formularDa = (page) => page.locator('#ki-demo-nummer').count().then((n) => n > 0);
/** Schritte im Telefon: Titel, Detail und Stand (data-schritt-stand) — textContent, weil die Scan-Ansicht nach «bereit» ausgeblendet ist */
const telefonSchritte = (page) =>
    page.$$eval('figure ol[aria-label="Scan-Schritte"] > li', (ls) =>
        ls.map((li) => {
            const t = li.querySelector('[data-schritt-titel]');
            const detail = t?.parentElement?.nextElementSibling;
            return { titel: (t?.textContent ?? '').trim(), detail: (detail?.textContent ?? '').trim(), stand: t?.getAttribute('data-schritt-stand') ?? '' };
        }),
    );
const chipZahl = (page) => page.locator('ul[aria-label="Gefunden"] > li').count();
const aktion = (page) => page.locator('section[aria-labelledby="ki-demo-anruf-titel"]');
const welle = (page) => page.$eval('figure [style*="--welle"]', (e) => e.getAttribute('style') ?? '');
const apiPfade = (s) => s.anfragen.map((a) => a.pfad);

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const protokoll = { zeit: new Date().toISOString(), basis: BASE, laeufe: [] };
let scanOhneNachweis = null;
try {
    /* A: pornhub.com — gesperrt vor jedem Abruf */
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        const r = await scanne(s, 'pornhub.com');
        await s.page.waitForSelector('#ki-demo-url-fehler', { timeout: 15000 });
        await s.page.waitForTimeout(600);
        const meldung = (await s.page.locator('#ki-demo-url-fehler').innerText()).trim();
        check('A: pornhub.com → 422, Meldung MELDUNG.urlInhalt wortgleich unter dem URL-Feld', r.status() === 422 && meldung === URL_INHALT, `${r.status()} «${meldung}»`);
        const schritte = await s.page.locator('figure ol[aria-label="Scan-Schritte"] > li').count();
        check('A: keine Schritte im Telefon', schritte === 0, `${schritte} Schritte`);
        const pfade = apiPfade(s);
        check('A: kein Aufruf von /api/demo/handelsregister oder /api/demo/profil (Netzmitschnitt)', !pfade.includes('/api/demo/handelsregister') && !pfade.includes('/api/demo/profil') && pfade.filter((p) => p === '/api/demo/scan').length === 1, pfade.join(', '));
        const feld = await s.page.evaluate(() => ({ wert: document.getElementById('ki-demo-url')?.value, fokus: document.activeElement?.id, nurLesen: document.getElementById('ki-demo-url')?.readOnly }));
        const knopf = await s.page.getAttribute('#ki-demo-scan-knopf', 'data-zustand');
        check('A: Feld behält den Wert und hat den Fokus, Zustand zurück auf «eingabe»', feld.wert === 'pornhub.com' && feld.fokus === 'ki-demo-url' && feld.nurLesen === false && knopf === 'eingabe', JSON.stringify({ ...feld, knopf }));
        check('A: kein Firmen-Schritt, keine Aktionskarte', (await s.page.locator('[data-handelsregister]').count()) === 0 && (await aktion(s.page).count()) === 0);
        const unerwartet = s.konsole.filter((k) => !/status of 422/.test(k));
        check('A: keine unerwarteten Konsolenfehler (nur die 422 der Sperre)', unerwartet.length === 0, unerwartet.slice(0, 3).join(' | '));
        await s.page.screenshot({ path: path.join(SCREENS, 'A-pornhub-gesperrt.png') });
        protokoll.laeufe.push({ test: 'A pornhub.com', status: r.status(), meldung, anfragen: pfade });
        await ctx.close();
    }

    /* B: elektro-tel.ch — Vorprüfung, Bestätigung, Vollscan */
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        const r1 = await scanne(s, 'elektro-tel.ch');
        const j1 = await r1.json().catch(() => null);
        const schluessel = Object.keys(j1 ?? {}).sort();
        check('B: Antwort der Vorprüfung nur {scan_id, stufe, host, schritte} — keine logos/funde/profil', r1.status() === 200 && JSON.stringify(schluessel) === JSON.stringify(['host', 'scan_id', 'schritte', 'stufe']) && j1.stufe === 'vorpruefung' && !('logos' in j1) && !('funde' in j1) && !('profil' in j1), `${r1.status()} ${JSON.stringify(j1)}`);
        await s.page.waitForFunction((n) => document.querySelectorAll('figure ol[aria-label="Scan-Schritte"] > li').length >= n, 3, { timeout: 15000 });
        await s.page.waitForTimeout(400);
        const vor = await telefonSchritte(s.page);
        check(
            'B: Telefon zeigt nach der Vorprüfung genau «Website erreichbar», «Firma wird im Handelsregister geprüft …», «Wartet auf die Bestätigung Ihrer Firma»',
            JSON.stringify(vor.map((x) => x.titel)) === JSON.stringify(SCHRITTE_VOR) && JSON.stringify(vor.map((x) => x.stand)) === JSON.stringify(['ok', 'laeuft', 'leer']) && vor[0].detail === 'elektro-tel.ch',
            JSON.stringify(vor),
        );
        check('B: keine Chips, Welle neutral (Leerlauf-Grün), kein Profil- und kein Bild-Aufruf', (await chipZahl(s.page)) === 0 && new RegExp(`--welle:\\s*${GRUEN_LEERLAUF}`, 'i').test(await welle(s.page)) && !apiPfade(s).some((p) => p === '/api/demo/profil' || p.startsWith('/api/demo/bild')), `${await welle(s.page)} | ${apiPfade(s).join(', ')}`);
        const stand = await warteRegister(s);
        const liste = await eintraege(s.page);
        const hinweis = await s.page.locator('[data-hr-lesehinweis]').allInnerTexts();
        const titel = await s.page.locator('#ki-demo-anruf-titel').innerText();
        check('B: Firmenliste erscheint («Welche ist Ihre Firma?», Treffer aus dem Handelsregister)', stand === 'treffer' && titel === 'Welche ist Ihre Firma?' && liste.length >= 1 && liste.every((e) => /Elektro-Tel AG/.test(e.text)), liste.map((e) => e.text).join(' || '));
        check('B: gedämpfte Zeile «Ihre Website lesen wir erst, …» unter dem Untertitel', hinweis.length === 1 && hinweis[0].trim() === LESE_HINWEIS, JSON.stringify(hinweis));
        const nachRegister = await telefonSchritte(s.page);
        check('B: auch nach dem Abgleich (vor der Bestätigung) nur die drei Schritte, keine Chips', JSON.stringify(nachRegister.map((x) => x.titel)) === JSON.stringify(SCHRITTE_VOR) && (await chipZahl(s.page)) === 0 && !(await formularDa(s.page)), JSON.stringify(nachRegister.map((x) => x.titel)));
        await s.page.screenshot({ path: path.join(SCREENS, 'B-1-vor-bestaetigung.png') });

        // alle Titel des Schritts «website» mitschreiben (der Vollscan kann schnell sein)
        await s.page.evaluate(() => {
            const gesehen = (window.__a112Website = []);
            const merke = () => {
                const li = document.querySelector('figure ol[aria-label="Scan-Schritte"] > li');
                const t = li?.querySelector('[data-schritt-titel]');
                const eintrag = `${t?.textContent?.trim() ?? ''}|${t?.getAttribute('data-schritt-stand') ?? ''}`;
                if (gesehen[gesehen.length - 1] !== eintrag) gesehen.push(eintrag);
            };
            merke();
            new MutationObserver(merke).observe(document.querySelector('figure'), { subtree: true, childList: true, characterData: true, attributes: true });
        });
        const ziel = liste.find((e) => e.uid === 'CHE107160757' && e.aktiv) ?? liste.find((e) => e.aktiv);
        if (ziel) await s.page.click(`label[data-uid="${ziel.uid}"]`);
        const tBestaetigt = Date.now();
        await s.page.click('#ki-demo-hr-bestaetigen');
        await s.page.waitForSelector('#ki-demo-nummer', { state: 'visible', timeout: 90000 });
        const msBisFormular = Date.now() - tBestaetigt;
        await s.page.waitForTimeout(500);
        const websiteVerlauf = await s.page.evaluate(() => window.__a112Website);
        const iLesen = websiteVerlauf.indexOf('Website wird gelesen …|laeuft');
        const iGelesen = websiteVerlauf.findIndex((x) => /^Website gelesen\|ok$/.test(x));
        check('B: nach «Ja, das ist meine Firma»: «Website wird gelesen …» → «Website gelesen»', iLesen >= 0 && iGelesen > iLesen, websiteVerlauf.join(' → '));
        const nach = await telefonSchritte(s.page);
        const finde = (re) => nach.find((x) => re.test(x.titel));
        const website = nach[0];
        const scan2 = s.daten.scans.find((x) => x.body.scan_id);
        check('B: «Website gelesen» mit «elektro-tel.ch · n Seiten»', website?.titel === 'Website gelesen' && /^elektro-tel\.ch · \d+ Seiten?$/.test(website.detail), JSON.stringify(website));
        check(
            'B: danach die bisherige Abfolge — Handelsregister ok, Logo, Markenfarbe, Telefon, Öffnungszeiten, Wissen, «<Name> ist bereit»',
            /^Handelsregister: /.test(nach[1]?.titel ?? '') && nach[1].stand === 'ok' && !!finde(/^(Logo gefunden|Kein Logo gefunden)$/) && !!finde(/^(Markenfarbe #[0-9A-F]{6}|Keine Markenfarbe gefunden)$/i) && !!finde(/^(Telefon |Keine Telefonnummer)/) && !!finde(/^(Öffnungszeiten |Keine Öffnungszeiten)/) && !!finde(/^\d+ Wissenseinträge$/) && / ist bereit$/.test(nach[nach.length - 1]?.titel ?? ''),
            nach.map((x) => `${x.titel} [${x.stand}]`).join(' | '),
        );
        const chips = await s.page.locator('ul[aria-label="Gefunden"] > li').allInnerTexts();
        check('B: Chips erst nach dem Vollscan (Logo/Farbe/Telefon/Wissen …)', chips.length >= 2 && chips.some((c) => /^Wissen: \d+ Einträge$/.test(c.trim())), chips.map((c) => c.trim()).join(' | '));
        const iScan2 = s.anfragen.findIndex((a) => a.pfad === '/api/demo/scan' && a.body?.includes('scan_id'));
        const iProfil = s.anfragen.findIndex((a) => a.pfad === '/api/demo/profil');
        check(
            'B: Vollscan erst nach der Bestätigung (gleiche scan_id, Antwort wie bisher), Profil erst danach',
            !!scan2 && scan2.status === 200 && scan2.body.scan_id === j1?.scan_id && scan2.antwort?.scan_id === j1?.scan_id && Array.isArray(scan2.antwort?.logos) && !!scan2.antwort?.funde && !!scan2.antwort?.profil && iScan2 > s.anfragen.findIndex((a) => a.pfad === '/api/demo/handelsregister') && iProfil > iScan2,
            `Vollscan ${scan2?.status}, ${scan2?.antwort?.funde?.seiten} Seiten, ${scan2?.antwort?.dauer_ms} ms; Reihenfolge: ${apiPfade(s).join(', ')}`,
        );
        check('B: Anruf-Formular sichtbar (nicht abgesendet)', (await formularDa(s.page)) && (await s.page.getAttribute('#ki-demo-anruf-knopf', 'data-zustand')) === 'bereit' && s.anrufe.length === 0, `${msBisFormular} ms bis zum Formular`);
        check('B: keine Konsolenfehler', s.konsole.length === 0, s.konsole.slice(0, 3).join(' | '));
        await s.page.screenshot({ path: path.join(SCREENS, 'B-2-nach-bestaetigung.png') });
        protokoll.laeufe.push({ test: 'B elektro-tel.ch', scanId: j1?.scan_id, vorpruefung: j1, schritteVor: vor, websiteVerlauf, schritteNach: nach, chips, vollscan: { status: scan2?.status, dauer_ms: scan2?.antwort?.dauer_ms, seiten: scan2?.antwort?.funde?.seiten }, msBisFormular, anfragen: apiPfade(s) });
        await ctx.close();
    }

    /* C: httpbin.org — Firma nicht gefunden, eigene Suche, 409 */
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        const r1 = await scanne(s, 'httpbin.org');
        const j1 = await r1.json().catch(() => null);
        scanOhneNachweis = j1?.scan_id ?? null;
        const stand = await warteRegister(s);
        const titel = await s.page.locator('#ki-demo-anruf-titel').innerText();
        const hinweis = await s.page.locator('[data-hr-lesehinweis]').allInnerTexts();
        check('C: httpbin.org → «Firma nicht gefunden» mit der Zeile «Ihre Website lesen wir erst, …»', stand === 'kein_treffer' && titel === 'Firma nicht gefunden' && hinweis.length === 1 && hinweis[0].trim() === LESE_HINWEIS, `${stand} «${titel}» ${JSON.stringify(hinweis)}`);
        await s.page.waitForTimeout(300);
        const schritte = await telefonSchritte(s.page);
        const hrSchritt = schritte.find((x) => x.titel.startsWith('Firma'));
        check('C: Telefon-Schritt «Firma im Handelsregister nicht gefunden» (leer, «Unten nach Firmenname oder UID suchen»)', hrSchritt?.titel === 'Firma im Handelsregister nicht gefunden' && hrSchritt.detail === 'Unten nach Firmenname oder UID suchen' && hrSchritt.stand === 'leer', JSON.stringify(schritte));
        check('C: keine Chips, kein Formular', (await chipZahl(s.page)) === 0 && !(await formularDa(s.page)));
        await s.page.screenshot({ path: path.join(SCREENS, 'C-1-firma-nicht-gefunden.png') });
        await s.page.fill('#ki-demo-hr-suche', 'Elektro-Tel');
        await s.page.click('#ki-demo-hr-suchen');
        await s.page.waitForSelector('[data-handelsregister="treffer"] label[data-uid="CHE107160757"]', { timeout: 30000 });
        await s.page.click('label[data-uid="CHE107160757"]');
        await s.page.click('#ki-demo-hr-bestaetigen');
        await s.page.waitForSelector('[data-hr-passt-nicht] [role="alert"]', { timeout: 15000 });
        const meldung = (await s.page.locator('[data-hr-passt-nicht] [role="alert"]').innerText()).replace(/\s+/g, ' ').trim();
        const a409 = s.daten.hr.find((x) => x.body.bestaetige);
        check('C: manuelle Suche «Elektro-Tel» → bestätigen → 409 website_passt_nicht (wortgleich wie A-111)', a409?.status === 409 && a409.antwort?.code === 'website_passt_nicht' && meldung === PASST_NICHT_HTTPBIN, meldung);
        check('C: kein Vollscan, kein Profil, kein Formular', s.daten.scans.length === 1 && !apiPfade(s).includes('/api/demo/profil') && !(await formularDa(s.page)) && s.anrufe.length === 0, apiPfade(s).join(', '));
        const unerwartet = s.konsole.filter((k) => !/status of 409/.test(k));
        check('C: keine unerwarteten Konsolenfehler (nur die bewusste 409)', unerwartet.length === 0, unerwartet.slice(0, 3).join(' | '));
        await s.page.screenshot({ path: path.join(SCREENS, 'C-2-website-passt-nicht.png') });

        /* D: direkte Aufrufe auf dem Vorprüfungs-Scan ohne Nachweis */
        const d = await s.page.evaluate(async (id) => {
            const p = async (pfad, body) => {
                const r = await fetch(pfad, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                return { status: r.status, d: await r.json().catch(() => null) };
            };
            const bild = await fetch(`/api/demo/bild/${id}/0`);
            return {
                scan: await p('/api/demo/scan', { scan_id: id }),
                profil: await p('/api/demo/profil', { scan_id: id }),
                beide: await p('/api/demo/scan', { url: 'elektro-tel.ch', scan_id: id }),
                faehigkeiten: await p('/api/demo/faehigkeiten', { scan_id: id }),
                bild: { status: bild.status, d: await bild.json().catch(() => null) },
            };
        }, scanOhneNachweis);
        check('D: POST /api/demo/scan {scan_id} ohne Nachweis → 403 handelsregister_fehlt', d.scan.status === 403 && d.scan.d?.code === 'handelsregister_fehlt', JSON.stringify(d.scan));
        check('D: POST /api/demo/profil auf dem Vorprüfungs-Scan → 409 scan_unvollstaendig (wortgleich)', d.profil.status === 409 && d.profil.d?.code === 'scan_unvollstaendig' && d.profil.d?.fehler === UNVOLLSTAENDIG, JSON.stringify(d.profil));
        check('D: POST /api/demo/scan {url, scan_id} → 400', d.beide.status === 400, JSON.stringify(d.beide));
        check('D: auch faehigkeiten und bild auf dem Vorprüfungs-Scan → 409 scan_unvollstaendig', d.faehigkeiten.status === 409 && d.faehigkeiten.d?.code === 'scan_unvollstaendig' && d.bild.status === 409 && d.bild.d?.code === 'scan_unvollstaendig', `${d.faehigkeiten.status} / ${d.bild.status}`);
        protokoll.laeufe.push({ test: 'C httpbin.org + D', scanId: scanOhneNachweis, schritte, a409: a409?.antwort ?? null, direkt: d, anfragen: apiPfade(s) });
        await ctx.close();
    }

    /* F: Fehler im Vollscan (simuliert: erste Antwort 422, zweite 403 «abgelaufen»), dann echter Vollscan */
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' });
        const s = await vorbereiten(ctx);
        const NICHT_ERREICHBAR = 'Diese Website konnten wir nicht erreichen. Prüfen Sie die Adresse oder versuchen Sie es gleich nochmals.';
        const ABGELAUFEN = 'Die Bestätigung Ihrer Firma ist abgelaufen. Bitte bestätigen Sie Ihre Firma nochmals.';
        let stufe2 = 0;
        let abgelaufenSimuliert = false;
        await s.page.route('**/api/demo/scan', async (route) => {
            const body = JSON.parse(route.request().postData() || '{}');
            if (!body.scan_id) return route.continue();
            stufe2++;
            if (stufe2 === 1) return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ fehler: NICHT_ERREICHBAR }) });
            if (stufe2 === 2) {
                abgelaufenSimuliert = true;
                return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ fehler: ABGELAUFEN, code: 'handelsregister_abgelaufen' }) });
            }
            return route.continue();
        });
        // zur simulierten 403 «abgelaufen» passend: die folgende automatische Prüfung meldet die Firma als nicht mehr bestätigt
        // (echte Antwort des Servers, nur ohne Bestätigung — der Server selbst hält den Nachweis noch)
        await s.page.route('**/api/demo/handelsregister', async (route) => {
            const body = JSON.parse(route.request().postData() || '{}');
            if (!abgelaufenSimuliert || body.bestaetige || body.suche) return route.continue();
            abgelaufenSimuliert = false;
            const echt = await (await route.fetch()).json();
            const { gueltig_bis: _weg, ...ohne } = echt;
            void _weg;
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...ohne, ergebnis: 'treffer', bestaetigt: null }) });
        });
        await scanne(s, 'elektro-tel.ch');
        await warteRegister(s);
        const ziel = (await eintraege(s.page)).find((e) => e.aktiv);
        if (ziel) await s.page.click(`label[data-uid="${ziel.uid}"]`);
        await s.page.click('#ki-demo-hr-bestaetigen');
        await s.page.waitForSelector('[data-vollscan-fehler] [role="alert"]', { timeout: 30000 });
        const alarm = (await s.page.locator('[data-vollscan-fehler] [role="alert"]').innerText()).trim();
        const website = (await telefonSchritte(s.page))[0];
        const knopf = (await s.page.locator('#ki-demo-vollscan-nochmals').innerText()).trim();
        check(
            'F: Fehler im Vollscan → Schritt «website» auf Fehler, Hinweis mit dem Servertext unter der bestätigten Firma, Knopf «Nochmals versuchen», «Andere Website» oben',
            website?.stand === 'fehler' && website.titel === NICHT_ERREICHBAR && alarm === NICHT_ERREICHBAR && knopf === 'Nochmals versuchen' && (await s.page.locator('[data-vollscan-fehler] [data-handelsregister-bestaetigt]').count()) === 1 && (await s.page.locator('button', { hasText: 'Andere Website' }).count()) === 1 && !(await formularDa(s.page)),
            `${JSON.stringify(website)} | «${alarm}» | «${knopf}»`,
        );
        await aktion(s.page).screenshot({ path: path.join(SCREENS, 'F-1-vollscan-fehler.png') });
        await s.page.click('#ki-demo-vollscan-nochmals');
        await s.page.waitForSelector('[data-handelsregister="treffer"] [role="alert"]', { timeout: 30000 });
        const hinweis = (await s.page.locator('[data-handelsregister] > [role="alert"]').first().innerText()).trim();
        check('F: «Nochmals versuchen» → 403 «abgelaufen» → zurück zum Firmen-Schritt mit dem Servertext', stufe2 === 2 && hinweis === ABGELAUFEN && (await telefonSchritte(s.page)).map((x) => x.titel).join('|') === SCHRITTE_VOR.join('|'), `${stufe2} Aufrufe, «${hinweis}»`);
        await s.page.click('#ki-demo-hr-bestaetigen');
        await s.page.waitForSelector('#ki-demo-nummer', { state: 'visible', timeout: 90000 });
        check('F: nach erneuter Bestätigung startet der Vollscan wieder → Formular (nicht abgesendet)', stufe2 === 3 && (await s.page.getAttribute('#ki-demo-anruf-knopf', 'data-zustand')) === 'bereit' && s.anrufe.length === 0, `${stufe2} Vollscan-Aufrufe`);
        const unerwartet = s.konsole.filter((k) => !/status of (403|422)/.test(k));
        check('F: keine unerwarteten Konsolenfehler (nur die simulierten 422/403)', unerwartet.length === 0, unerwartet.slice(0, 3).join(' | '));
        protokoll.laeufe.push({ test: 'F Vollscan-Fehler simuliert', stufe2, alarm, hinweis });
        await ctx.close();
    }

    /* E: mobil 375 px, Zustand B vor der Bestätigung */
    {
        const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: 'de-CH', isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
        const s = await vorbereiten(ctx);
        await scanne(s, 'elektro-tel.ch');
        const stand = await warteRegister(s);
        await s.page.waitForTimeout(400);
        const schritte = await telefonSchritte(s.page);
        const masse = await s.page.evaluate(() => {
            const r = (sel) => Math.round(document.querySelector(sel)?.getBoundingClientRect().right ?? 0);
            const titel = [...document.querySelectorAll('figure [data-schritt-titel]')].map((t) => ({ titel: t.textContent?.trim(), ueber: t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1 }));
            return { seite: document.documentElement.scrollWidth, fenster: window.innerWidth, karte: r('section[aria-labelledby="ki-demo-anruf-titel"]'), telefon: r('figure'), feld: r('#ki-demo-url'), titel };
        });
        check(
            'E: mobil 375 px — Vorprüfung und Firmenliste ohne waagrechtes Scrollen, nichts läuft über',
            stand === 'treffer' && masse.seite <= masse.fenster && masse.karte <= masse.fenster && masse.telefon <= masse.fenster && masse.feld <= masse.fenster && masse.titel.every((t) => !t.ueber) && JSON.stringify(schritte.map((x) => x.titel)) === JSON.stringify(SCHRITTE_VOR),
            JSON.stringify(masse),
        );
        const buehne = s.page.locator('#ki-demo-url').locator('xpath=ancestor::div[contains(@class,"buehne")][1]');
        await buehne.screenshot({ path: path.join(SCREENS, 'E-mobil-375.png') });
        check('E: keine Konsolenfehler', s.konsole.length === 0, s.konsole.slice(0, 3).join(' | '));
        protokoll.laeufe.push({ test: 'E mobil 375', masse, schritte });
        await ctx.close();
    }
} finally {
    await browser.close();
}
writeFileSync(path.join(SCREENS, 'browser-test.json'), JSON.stringify({ ...protokoll, ergebnisse }, null, 1));
const fehler = ergebnisse.filter((e) => !e.ok).length;
console.log(`\n${ergebnisse.length - fehler}/${ergebnisse.length} Browser-Prüfungen bestanden.`);
process.exit(fehler ? 1 : 0);
