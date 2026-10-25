#!/usr/bin/env node
/**
 * auftrag092-browser-test.mjs — Browser-Test der KI-Telefonassistent-Demo
 * (AUFTRAG-092, erweitert für AUFTRAG-095).
 *
 * Teil A (Standard): Texte/SEO/Navigation, dann je Variante (Desktop 1440 /
 * Mobil 375, hell / dunkel) der ganze Zustandsautomat mit Screenshots:
 * eingabe → scan → bereit → wartend → waehlt → verbunden → beendet (bzw.
 * fehler). Gescannt wird echt (öffentliche Seiten, nur lesen). Die
 * ANRUF-API wird im Browser abgefangen (page.route): Es entsteht KEIN
 * Auftrag in der Warteschlange, ein echter Orchestrator ruft also nie an.
 *
 *   node scripts/auftrag092-browser-test.mjs
 *   node scripts/auftrag092-browser-test.mjs --logos gmtec.ch ryserboeden.ch …   (nur Logo-Karten)
 *   node scripts/auftrag092-browser-test.mjs --logos --ziel A096-screens --ohne-ki hr-campus.ch/de/ …   (AUFTRAG-096)
 *
 * Teil B (--attrappe, nur gegen einen EIGENEN Server mit eigenem Speicher):
 * Schnittstelle A-091 über die API mit einem Attrappen-Orchestrator.
 *   DEMO_STORE_DIR=<ordner> npx next start -p 3100
 *   DEMO_STORE_DIR=<ordner> BASE_URL=http://localhost:3100 node scripts/auftrag092-browser-test.mjs --attrappe
 *
 * AUFTRAG-098:
 *   Teil 0 prüft die Texte WORTGLEICH gegen die Vorgaben in auftraege/AUFTRAG-098.md
 *   (aus der Datei gelesen), dazu /cloud-telefonie, Startseite, llms.txt, Sitemap.
 *   Teil A prüft Sprachwahl (Deutsch · English · Schweizerdeutsch (in Erprobung),
 *   Vorgabe Deutsch), die englische Karte und zählt die Status-Abfragen je Anruf.
 *   --zaehlung <etikett>  Status-Abfragen je Demo-Anruf (2 Minuten Gespräch, offen und
 *                         mit verdecktem Tab) → ergebnisse/A098-zaehlung-<etikett>.json
 *   --zwanzig             20 Minuten ohne Endzustand (Playwright-Uhr) → Hinweis, keine Abfrage mehr
 *   Teil C (--anstoss, nur eigener Server): Anstoss der Anlage mit einer Attrappen-Anlage
 *   (202, 409, Timeout → Rückfall; 401/5xx per API), echte Anruf- und Status-Routen:
 *     DEMO_STORE_DIR=<ordner> DEMO_ANSTOSS_URL=http://127.0.0.1:3199/api/demo/anstoss npx next start -p 3100
 *     DEMO_STORE_DIR=<ordner> BASE_URL=http://localhost:3100 ANSTOSS_PORT=3199 SERVER_LOG=<log> \
 *       node scripts/auftrag092-browser-test.mjs --anstoss
 *
 * Screenshots: ../auftraege/ergebnisse/A098-screens/ (SCREENS_ORDNER überschreibt)
 */
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// AUFTRAG-096: SCREENS_ORDNER=A096-screens/browser-test legt die Screenshots woanders ab (A-095-Belege bleiben)
const SCREENS = path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', process.env.SCREENS_ORDNER || 'A098-screens');
const SEITE = `${BASE}/ki-telefonassistent`;
const args = process.argv.slice(2);

const env = {};
if (existsSync(path.join(ROOT, '.env.local'))) {
    for (const zeile of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
        const m = zeile.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) env[m[1]] = m[2];
    }
}

mkdirSync(SCREENS, { recursive: true });

/* ------------------------------------------------------------------ */
/* AUFTRAG-098: Text-Vorgaben direkt aus dem Auftrag (wortgleich)       */
/* ------------------------------------------------------------------ */
function vorgabenA098() {
    const datei = path.resolve(ROOT, '..', 'auftraege', 'AUFTRAG-098.md');
    const md = readFileSync(datei, 'utf8').replace(/\r\n/g, '\n');
    const eins = (re) => {
        const m = md.match(re);
        if (!m) throw new Error(`Vorgabe nicht gefunden: ${re}`);
        return m[1];
    };
    const belege = md.match(/^- Mini-Belege: «(.+?)» · «(.+?)» · «(.+?)»$/m);
    return {
        titel: eins(/^- `<title>`: «(.+)»$/m),
        beschreibung: eins(/^- Meta-Beschreibung: «(.+)»$/m),
        heroZeile: eins(/^- Hero-Zeile: «(.+)»$/m),
        heroSatz: eins(/^- Hero-Satz: «(.+)»$/m),
        badge: eins(/^- Badge über der Hero-Zeile: «(.+)»$/m),
        belege: belege ? belege.slice(1, 4) : [],
        abschnittAlt: eins(/^- Abschnitt «(.+?)» ersetzen durch$/m),
        abschnittNeu: eins(/^ {2}«(.+?)»: Betrieb auf eigener Anlage/m),
        faqFrage: eins(/^- FAQ-Eintrag «(.+?)» neu:$/m),
        faqAntwort: eins(/^- FAQ-Eintrag «.+?» neu:\n {2}«(.+)»$/m),
    };
}
const VORGABEN = vorgabenA098();
/** Sprachwahl laut AUFTRAG-098 (Reihenfolge, zugängliche Namen) */
const SPRACH_NAMEN = ['Deutsch', 'English', 'Schweizerdeutsch (in Erprobung)'];

/* ------------------------------------------------------------------ */
/* Prüfprotokoll                                                       */
/* ------------------------------------------------------------------ */
const ergebnisse = [];
function check(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);
}

const STORE = process.env.DEMO_STORE_DIR ? path.resolve(process.env.DEMO_STORE_DIR) : path.join(ROOT, '.demo-store');
function limitsZuruecksetzen() {
    const dir = path.join(STORE, 'limit');
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}

async function neueSeite(browser, { breite, hoehe, theme, mobil = false, ruhig = false, skala = null }) {
    const ctx = await browser.newContext({
        viewport: { width: breite, height: hoehe },
        deviceScaleFactor: skala ?? (mobil ? 2 : 1),
        isMobile: mobil,
        hasTouch: mobil,
        reducedMotion: ruhig ? 'reduce' : 'no-preference',
        locale: 'de-CH',
    });
    await ctx.addInitScript((t) => {
        try {
            localStorage.setItem('theme', t);
        } catch {
            /* egal */
        }
    }, theme);
    const page = await ctx.newPage();
    const konsole = [];
    page.on('console', (m) => {
        if (m.type() === 'error') konsole.push(m.text());
    });
    page.on('pageerror', (e) => konsole.push('pageerror: ' + e.message));
    return { ctx, page, konsole };
}

const shot = (page, name, opt = {}) => page.screenshot({ path: path.join(SCREENS, name), ...opt });

/* ------------------------------------------------------------------ */
/* Abgefangene Anruf-API (kein echter Auftrag, kein echter Anruf)      */
/* ------------------------------------------------------------------ */
const ZUSAMMENFASSUNG =
    'Testgespräch (Attrappe im Browser): Der Anrufer fragte nach den Öffnungszeiten und nach einem Termin. Der Assistent nannte die Zeiten aus der Website und nahm den Terminwunsch auf.';

/**
 * Ersetzt POST /api/demo/anruf und GET /api/demo/auftraege/{id} im Browser.
 * Ablauf nach dem Klick: wartend → angenommen (1,5 s) → waehlt (3,5 s) →
 * verbunden (7 s) → beendet (14 s) bzw. fehler (7 s).
 */
async function anrufApiAbfangen(page, { fehler = false } = {}) {
    const zustand = { start: 0, gesendet: null, ablauf: fehler ? 'fehler' : 'erfolg', abfragen: [] };
    await page.route('**/api/demo/anruf', async (route) => {
        zustand.gesendet = JSON.parse(route.request().postData() || '{}');
        zustand.start = Date.now();
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'd-20261022-attrappebrowser01' }) });
    });
    await page.route('**/api/demo/auftraege/**', async (route) => {
        const t = Date.now() - zustand.start;
        zustand.abfragen.push(t);
        let status = 'wartend';
        let dauer_s = null;
        let zusammenfassung = null;
        if (t > 1500) status = 'angenommen';
        if (t > 3500) status = 'waehlt';
        if (zustand.ablauf === 'fehler' && t > 7000) status = 'fehler';
        else if (t > 7000) status = 'verbunden';
        if (zustand.ablauf === 'erfolg' && t > 14000) {
            status = 'beendet';
            dauer_s = 47;
            zusammenfassung = ZUSAMMENFASSUNG;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'd-20261022-attrappebrowser01', status, zeit: new Date().toISOString(), dauer_s, zusammenfassung }) });
    });
    return zustand;
}

/** Text und Zustand des sichtbaren Primär-Buttons. */
async function knopf(page) {
    return page.evaluate(() => {
        const b = [...document.querySelectorAll('#ki-demo-scan-knopf, #ki-demo-anruf-knopf')].find((x) => x.offsetParent !== null && getComputedStyle(x).visibility !== 'hidden');
        return b ? { text: b.textContent.trim(), disabled: b.disabled, zustand: b.dataset.zustand } : null;
    });
}

/** Anzahl sichtbarer Primär-Buttons (grün gefüllt) im Demo-Bereich. */
async function primaerAnzahl(page) {
    return page.evaluate(() => {
        const buehne = document.querySelector('#ki-demo-url')?.closest('section');
        const kandidaten = [...buehne.querySelectorAll('button, a')].filter((el) => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden');
        return kandidaten.filter((el) => /\bbg-primary\b|bg-\[#1f7a35\]/.test(el.className)).map((el) => el.textContent.trim());
    });
}

async function zuTelefon(page) {
    await page.evaluate(() => {
        const f = document.querySelector('figure');
        const r = f.getBoundingClientRect();
        if (window.innerWidth < 1024) window.scrollTo(0, r.top + window.scrollY - 76);
        else window.scrollTo(0, 0);
    });
    await page.waitForTimeout(350);
}

async function zuAktion(page) {
    await page.evaluate(() => {
        const a = document.querySelector('#ki-demo-anruf-titel');
        if (!a) return;
        const r = a.closest('section').getBoundingClientRect();
        if (window.innerWidth < 1024) window.scrollTo(0, r.top + window.scrollY - 76);
    });
    await page.waitForTimeout(300);
}

/* ------------------------------------------------------------------ */
/* Teil A: Zustandsautomat je Variante                                 */
/* ------------------------------------------------------------------ */
async function variante(browser, { name, breite, hoehe, theme, mobil, website, sprache, fehlerFall = false }) {
    limitsZuruecksetzen();
    const { ctx, page, konsole } = await neueSeite(browser, { breite, hoehe, theme, mobil });
    // Layout-Verschiebungen messen (CLS ohne Nutzereingabe)
    await page.addInitScript(() => {
        window.__cls = 0;
        window.__clsQuellen = [];
        try {
            new PerformanceObserver((l) => {
                for (const e of l.getEntries()) {
                    if (e.hadRecentInput) continue;
                    window.__cls += e.value;
                    const q = (e.sources || []).map((s) => {
                        const n = s.node;
                        const name = n ? `${n.nodeName}.${String(n.className || '').slice(0, 40)}` : '?';
                        return `${name} ${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)} h${Math.round(s.previousRect.height)}→${Math.round(s.currentRect.height)}`;
                    });
                    window.__clsQuellen.push(`${e.value.toFixed(4)} @${Math.round(e.startTime)}ms: ${q.join(' | ')}`);
                }
            }).observe({ type: 'layout-shift', buffered: true });
        } catch {
            /* ältere Browser */
        }
    });
    const abfang = await anrufApiAbfangen(page, { fehler: fehlerFall });
    await page.goto(SEITE, { waitUntil: 'networkidle' });
    const dunkel = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    check(`${name}: Theme ${theme}`, dunkel === (theme === 'dark'));

    // eingabe
    let k = await knopf(page);
    check(`${name}: eingabe – Button «Website scannen»`, k?.text === 'Website scannen' && !k.disabled, JSON.stringify(k));
    check(`${name}: eingabe – genau ein Primär-Button`, (await primaerAnzahl(page)).length === 1, (await primaerAnzahl(page)).join(' | '));
    await shot(page, `${name}-01-eingabe.png`);
    if (mobil) await shot(page, `${name}-01b-eingabe-ganz.png`, { fullPage: false, clip: undefined });

    await page.click('#ki-demo-scan-knopf');
    const urlFehler = await page.locator('#ki-demo-url-fehler').textContent().catch(() => null);
    check(`${name}: leere URL wird abgefangen`, urlFehler?.includes('gültige Website-Adresse'), urlFehler);

    // scan
    await page.fill('#ki-demo-url', website);
    const t0 = Date.now();
    const profilAntwort = page.waitForResponse((r) => r.url().endsWith('/api/demo/profil'), { timeout: 45000 }).then((r) => r.json()).catch(() => null);
    await page.click('#ki-demo-scan-knopf');
    await page.waitForTimeout(250);
    k = await knopf(page);
    check(`${name}: scan – Button «Wird gescannt …», deaktiviert`, k?.text === 'Wird gescannt …' && k.disabled, JSON.stringify(k));
    await page.locator('figure li:has-text("Logo")').first().waitFor({ timeout: 20000 }).catch(() => undefined);
    await page.waitForTimeout(900);
    await zuTelefon(page);
    await shot(page, `${name}-02-scan.png`);
    const chipsScan = await page.locator('[aria-label="Gefunden"] li').allTextContents();

    // bereit
    await page.locator('#ki-demo-anruf-knopf[data-zustand="bereit"]').waitFor({ state: 'visible', timeout: 45000 });
    const scanDauer = Date.now() - t0;
    await page.waitForTimeout(700);
    k = await knopf(page);
    check(`${name}: bereit – Button «Jetzt KI-Anruf erhalten»`, k?.text === 'Jetzt KI-Anruf erhalten' && !k.disabled, JSON.stringify(k));
    check(`${name}: bereit – genau ein Primär-Button`, (await primaerAnzahl(page)).length === 1, (await primaerAnzahl(page)).join(' | '));
    check(`${name}: Scan bis Karte ${Math.round(scanDauer / 100) / 10} s`, scanDauer < 30000);
    check(`${name}: Fund-Chips während des Scans`, chipsScan.length >= 1, chipsScan.join(' | '));
    const karte = await page.evaluate(() => {
        const g = document.querySelector('figure [role="group"][aria-label]');
        const logo = g?.querySelector('img');
        const kopf = g?.firstElementChild;
        return {
            label: g?.getAttribute('aria-label'),
            rolle: g ? [...g.querySelectorAll('p')].map((p) => p.textContent.trim()).find((t) => /^KI-Telefonassistent(in)? von /.test(t)) : null,
            kann: g ? [...g.querySelectorAll('ul li')].map((l) => l.textContent.trim()) : [],
            zitat: g?.querySelector('blockquote')?.textContent.trim(),
            logoGeladen: !!logo && logo.complete && logo.naturalWidth > 0,
            logoVorhanden: !!logo,
            kopfHintergrund: kopf ? getComputedStyle(kopf).backgroundImage : '',
            ueberlauf: document.documentElement.scrollWidth - window.innerWidth,
            // Inhalte, die über die Aktionskarte bzw. das Telefon hinausragen
            ueberstand: [document.querySelector('#ki-demo-anruf-titel')?.closest('section'), document.querySelector('figure')]
                .filter(Boolean)
                .flatMap((box) => {
                    const r = box.getBoundingClientRect();
                    return [...box.querySelectorAll('*')]
                        .filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('.sr-only') && !el.closest('[aria-hidden="true"]') && el.getBoundingClientRect().right > r.right + 1)
                        .map((el) => `${el.tagName}.${String(el.className).slice(0, 30)}`);
                })
                .slice(0, 5),
            ansage: document.querySelector('[role="status"][aria-live]')?.textContent,
        };
    });
    check(`${name}: Rolle «KI-Telefonassistent(in) von FIRMA» (Vorgabe Deutsch)`, !!karte.rolle, karte.rolle);
    check(`${name}: Begrüssung in der Vorgabe Hochdeutsch`, (karte.zitat || '').startsWith('«Grüezi, hier ist '), karte.zitat);
    check(`${name}: drei «Kann»-Zeilen`, karte.kann.length === 3 && karte.kann.every(Boolean), karte.kann.join(' · '));
    check(`${name}: Begrüssung als Zitat (A-091 wortgleich)`, /^«(Grüezi, do isch|Grüezi, hier ist|Hello, this is) /.test(karte.zitat || ''), karte.zitat);
    check(`${name}: Kartenkopf nicht InfraOne-Grün`, !/rgb\(61, 150, 70\)|rgb\(76, 175, 80\)/.test(karte.kopfHintergrund), karte.kopfHintergrund.slice(0, 100));
    check(`${name}: Logo geladen oder bewusst Initiale`, !karte.logoVorhanden || karte.logoGeladen, karte.logoVorhanden ? 'Logo' : 'Initiale');
    check(`${name}: aria-live meldet «bereit»`, /ist bereit/.test(karte.ansage || ''), karte.ansage);
    check(`${name}: kein horizontaler Überlauf`, karte.ueberlauf <= 0, `${karte.ueberlauf}px`);
    check(`${name}: nichts ragt über Karte/Telefon hinaus`, karte.ueberstand.length === 0, karte.ueberstand.join(' | '));
    await zuTelefon(page);
    await shot(page, `${name}-03-bereit.png`);
    if (mobil) {
        await zuAktion(page);
        await shot(page, `${name}-03b-bereit-formular.png`);
    }

    // Sprachwahl + Barrierefreiheit (AUFTRAG-098: Deutsch · English · Schweizerdeutsch (in Erprobung), Vorgabe Deutsch)
    const sprachNamen = [];
    for (const n of SPRACH_NAMEN) sprachNamen.push(await page.getByRole('radio', { name: n, exact: true }).count());
    check(`${name}: Sprach-Radios mit zugänglichem Namen`, sprachNamen.every((c) => c === 1), sprachNamen.join('/'));
    const radios = await page.evaluate(() => [...document.querySelectorAll('input[name="ki-demo-sprache-wahl"]')].map((r) => ({ wert: r.value, name: r.getAttribute('aria-label'), an: r.checked, sichtbar: r.closest('label')?.innerText.replace(/\s+/g, ' ').trim() })));
    check(`${name}: Reihenfolge Deutsch · English · Schweizerdeutsch (in Erprobung)`, radios.map((r) => r.name).join(' · ') === SPRACH_NAMEN.join(' · ') && radios.map((r) => r.wert).join() === 'hochdeutsch,englisch,dialekt_auto', radios.map((r) => `${r.name}=${r.wert}`).join(' · '));
    check(`${name}: Vorgabe Deutsch (hochdeutsch) gewählt`, radios.find((r) => r.an)?.wert === 'hochdeutsch', radios.find((r) => r.an)?.wert);
    check(`${name}: «in Erprobung» sichtbar bei Schweizerdeutsch`, radios[2]?.sichtbar === 'Schweizerdeutsch in Erprobung', radios[2]?.sichtbar);
    const spiegel = await page.evaluate(() => [...document.querySelectorAll('figure [role="group"] button')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()));
    check(`${name}: Sprachwahl im Telefon gleich (Spiegel)`, spiegel.join(' · ') === 'Deutsch · English · Schweizerdeutsch in Erprobung', spiegel.join(' · '));

    // Englische Karte (AUFTRAG-098): Rolle, Fähigkeiten und Begrüssung auf Englisch.
    // KI-Fähigkeiten werden erst jetzt übersetzt (POST /api/demo/faehigkeiten), Standard-Fähigkeiten ohne Aufruf.
    const enAufrufe = [];
    page.on('request', (r) => {
        if (r.url().endsWith('/api/demo/faehigkeiten')) enAufrufe.push(r.url());
    });
    const enAntwort = page.waitForResponse((r) => r.url().endsWith('/api/demo/faehigkeiten'), { timeout: 20000 }).then((r) => r.json()).catch(() => null);
    const tEn = Date.now();
    await page.getByRole('radio', { name: 'English', exact: true }).check({ force: true });
    await page.waitForFunction(() => !document.querySelector('figure [role="group"] [data-laedt]'), null, { timeout: 20000 }).catch(() => undefined);
    const enMs = Date.now() - tEn;
    await page.waitForTimeout(200);
    const profilEn = await profilAntwort;
    const nurStandard = (profilEn?.profil?.faehigkeiten ?? []).every((f) => ['Rund um die Uhr erreichbar', 'Beantwortet Fragen aus Ihrer Website', 'Nimmt Anliegen und Rückrufwünsche auf'].includes(f));
    const enErwartet = nurStandard ? ['Available around the clock', 'Answers questions from your website', 'Takes requests and callback wishes'].filter((_, i) => i < 3) : (await enAntwort)?.faehigkeiten_en ?? [];
    const en = await page.evaluate(() => {
        const g = document.querySelector('figure [role="group"][aria-label]');
        return {
            label: g?.getAttribute('aria-label'),
            rolle: g ? [...g.querySelectorAll('p')].map((p) => p.textContent.trim()).find((t) => / of /.test(t)) : null,
            kann: g ? [...g.querySelectorAll('ul li')].map((l) => l.textContent.trim()) : [],
            langKopf: g?.firstElementChild?.getAttribute('lang'),
            langListe: g?.querySelector('ul')?.getAttribute('lang'),
            zitat: g?.querySelector('blockquote')?.textContent.trim(),
            zitatLang: g?.querySelector('blockquote p')?.getAttribute('lang'),
        };
    });
    const firmaKarte = profilEn?.profil?.firma;
    check(`${name}: English → Rolle «AI phone assistant of FIRMA»`, en.rolle === `AI phone assistant of ${firmaKarte}` && en.label?.endsWith(`, AI phone assistant of ${firmaKarte}`), en.rolle);
    check(
        `${name}: English → drei Fähigkeiten auf Englisch (${nurStandard ? 'Standard, ohne Aufruf' : 'bei Bedarf übersetzt'}, ${enMs} ms)`,
        en.kann.length === 3 && en.kann.join(' | ') === enErwartet.join(' | ') && !en.kann.some((k) => /[äöüÄÖÜ]/.test(k)) && enAufrufe.length === (nurStandard ? 0 : 1),
        `${en.kann.join(' | ')} · Aufrufe ${enAufrufe.length}`,
    );
    check(`${name}: English → Begrüssung wortgleich Orchestrator, lang=en`, (en.zitat || '').startsWith('«Hello, this is ') && en.zitatLang === 'en' && en.langKopf === 'en' && en.langListe === 'en', `${en.zitat?.slice(0, 50)} lang=${en.langKopf}/${en.langListe}/${en.zitatLang}`);
    await zuTelefon(page);
    await shot(page, `${name}-03c-bereit-english.png`);
    await page.getByRole('radio', { name: 'Deutsch', exact: true }).check({ force: true });
    await page.waitForTimeout(150);
    const einwName = await page.getByRole('checkbox', { name: /^Ich bin unter dieser Nummer erreichbar und möchte den Testanruf erhalten\. Es gelten die Datenschutzhinweise\.$/ }).count();
    check(`${name}: Einwilligung mit zugänglichem Namen`, einwName === 1);

    // Formular-Validierung
    await page.fill('#ki-demo-nummer', '0900 123 456');
    await page.click('#ki-demo-anruf-knopf');
    const f1 = await page.locator('#ki-demo-anruf-titel ~ form [role="alert"]').last().textContent().catch(() => '');
    check(`${name}: 0900-Nummer abgelehnt`, f1.includes('Mehrwert'), f1);
    await page.fill('#ki-demo-nummer', '079 000 00 01');
    await page.click('#ki-demo-anruf-knopf');
    const f2 = await page.locator('#ki-demo-anruf-titel ~ form [role="alert"]').last().textContent().catch(() => '');
    check(`${name}: Einwilligung ist Pflicht`, f2.includes('bestätigen'), f2);

    await page.getByRole('radio', { name: sprache, exact: true }).check({ force: true });
    const zitatNeu = await page.locator('figure blockquote').first().textContent();
    check(`${name}: Begrüssung folgt der Sprachwahl (${sprache})`, sprache === 'English' ? zitatNeu.includes('Hello, this is') : sprache === 'Deutsch' ? zitatNeu.includes('hier ist') : zitatNeu.includes('do isch'), zitatNeu.slice(0, 60));
    await page.locator('#ki-demo-einwilligung').check();
    await page.click('#ki-demo-anruf-knopf');

    // Anruf-Zustände beobachten
    const gesehen = [];
    const hoehen = { bereit: await page.evaluate(() => Math.round(document.querySelector('#ki-demo-anruf-titel')?.closest('section')?.getBoundingClientRect().height ?? 0)) };
    const ende = Date.now() + 30000;
    const bilder = new Set();
    let timer1 = null;
    let timer2 = null;
    while (Date.now() < ende) {
        k = await knopf(page);
        const z = k?.zustand;
        if (z && gesehen[gesehen.length - 1] !== `${z}:${k.text}`) gesehen.push(`${z}:${k.text}`);
        if (z) hoehen[z] = Math.max(hoehen[z] ?? 0, await page.evaluate(() => Math.round(document.querySelector('#ki-demo-anruf-titel')?.closest('section')?.getBoundingClientRect().height ?? 0)));
        if (z === 'wartend' && !bilder.has('wartend')) {
            bilder.add('wartend');
            await zuTelefon(page);
            await shot(page, `${name}-04a-wartend.png`);
        }
        if (z === 'waehlt' && !bilder.has('waehlt')) {
            bilder.add('waehlt');
            await zuTelefon(page);
            await shot(page, `${name}-04b-klingelt.png`);
        }
        if (z === 'verbunden') {
            if (!timer1) timer1 = await page.locator('[aria-label^="Gesprächsdauer"]').first().textContent();
            if (!bilder.has('verbunden')) {
                await page.waitForTimeout(2300);
                timer2 = await page.locator('[aria-label^="Gesprächsdauer"]').first().textContent();
                bilder.add('verbunden');
                await zuTelefon(page);
                await shot(page, `${name}-04-verbunden.png`);
                if (mobil) {
                    await zuAktion(page);
                    await shot(page, `${name}-04c-verbunden-button.png`);
                }
            }
        }
        if (z === 'beendet' || z === 'fehler') break;
        await page.waitForTimeout(250);
    }
    const folge = gesehen.map((g) => g.split(':').slice(1).join(':'));
    check(`${name}: Anruf-API abgefangen (kein Auftrag beim Server)`, !!abfang.gesendet && abfang.gesendet.nummer === '+41790000001', JSON.stringify(abfang.gesendet ?? {}).slice(0, 160));
    const spracheWert = { Deutsch: 'hochdeutsch', English: 'englisch', 'Schweizerdeutsch (in Erprobung)': 'dialekt_auto' }[sprache];
    check(`${name}: Feld sprache an die Anlage «${spracheWert}»`, abfang.gesendet?.sprache === spracheWert, abfang.gesendet?.sprache);
    // AUFTRAG-098: Status-Abfragen je Anruf (Takt 4 s), nach dem Endzustand keine weitere
    const nachEndeVorher = abfang.abfragen.length;
    await page.waitForTimeout(9000);
    const abstaende = abfang.abfragen.slice(1).map((t, i) => t - abfang.abfragen[i]);
    check(
        `${name}: Status-Abfragen je Anruf ${abfang.abfragen.length} (Takt ≥ 3,9 s), nach Endzustand keine weitere`,
        abfang.abfragen.length === nachEndeVorher && abfang.abfragen.length <= (fehlerFall ? 3 : 5) && abstaende.every((a) => a >= 3900),
        `Zeitpunkte ${abfang.abfragen.map((t) => (t / 1000).toFixed(1)).join(', ')} s`,
    );
    const profil = (await profilAntwort)?.profil;
    const weiblich = ['Lena', 'Mia', 'Laura', 'Sara', 'Anna', 'Lea', 'Nina', 'Julia', 'Elena', 'Sophie', 'Lara', 'Alina', 'Noemi', 'Selina', 'Jana', 'Livia', 'Lina', 'Leonie', 'Chiara', 'Elin'];
    check(
        `${name}: Profil hat stimme passend zum Namen (Schalter 0 → nur Frauennamen)`,
        !!profil && profil.stimme === 'weiblich' && weiblich.includes(profil.assistent_name) && abfang.gesendet && karte.rolle?.startsWith('KI-Telefonassistentin von '),
        profil ? `${profil.assistent_name}/${profil.stimme}` : 'kein Profil',
    );
    if (fehlerFall) {
        check(`${name}: Button-Folge bis Fehler (wortgleich)`, ['Wir rufen Sie gleich an … > Ihr Telefon klingelt … > Nochmals versuchen', 'Wir rufen Sie gleich an … > Nochmals versuchen'].includes(folge.join(' > ')), folge.join(' > '));
        const meldung = await page.locator('#ki-demo-anruf-titel ~ form [role="alert"]').textContent().catch(() => '');
        check(`${name}: klare Fehlermeldung`, meldung.startsWith('Leider nicht erreicht.'), meldung);
        await zuTelefon(page);
        await shot(page, `${name}-05-fehler.png`);
        if (mobil) {
            await zuAktion(page);
            await shot(page, `${name}-05b-fehler-button.png`);
        }
        await page.click('#ki-demo-anruf-knopf');
        await page.waitForTimeout(500);
        k = await knopf(page);
        check(`${name}: «Nochmals versuchen» führt zurück zu «bereit»`, k?.text === 'Jetzt KI-Anruf erhalten', JSON.stringify(k));
    } else {
        const nameAssistent = karte.label?.split(',')[0];
        check(
            `${name}: Button-Folge wortgleich`,
            folge.join(' > ') === `Wir rufen Sie gleich an … > Ihr Telefon klingelt … > Verbunden – sprechen Sie mit ${nameAssistent} > Nochmals testen`,
            folge.join(' > '),
        );
        check(`${name}: Dauerzähler läuft während «verbunden»`, !!timer1 && !!timer2 && timer1 !== timer2, `${timer1} → ${timer2}`);
        await page.waitForTimeout(700);
        const ende2 = await page.evaluate(() => {
            const s = document.querySelector('#ki-demo-anruf-titel')?.closest('section');
            const cta = [...(s?.querySelectorAll('a') ?? [])].find((a) => a.textContent.includes('So bekommt Ihre Firma diesen Assistenten'));
            return { titel: document.querySelector('#ki-demo-anruf-titel')?.textContent, text: s?.innerText ?? '', cta: cta?.getAttribute('href') ?? null, ctaPrimaer: /\bbg-primary\b/.test(cta?.className ?? '') };
        });
        check(`${name}: beendet – Zusammenfassung und Dauer`, ende2.titel === 'Gespräch beendet – so lief es:' && ende2.text.includes('Testgespräch (Attrappe im Browser)') && ende2.text.includes('Dauer: 0:47 Min.'), ende2.titel);
        check(`${name}: beendet – «Nochmals testen» sekundär, CTA primär`, (await primaerAnzahl(page)).length === 1 && ende2.ctaPrimaer, (await primaerAnzahl(page)).join(' | '));
        check(`${name}: CTA → /kontakt mit Betreff «KI-Telefonassistent»`, decodeURIComponent(ende2.cta || '').startsWith('/kontakt?subject=KI-Telefonassistent&message='), decodeURIComponent(ende2.cta || '').slice(0, 90));
        await zuTelefon(page);
        await shot(page, `${name}-05-beendet.png`);
        if (mobil) {
            await zuAktion(page);
            await shot(page, `${name}-05b-beendet-cta.png`);
        }
        if (name === 'desktop-1440-hell') {
            const stil = await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important}' });
            await shot(page, `${name}-06-ganze-seite.png`, { fullPage: true });
            await stil.evaluate((el) => el.remove());
        }
        // Nochmals testen → bereit
        await page.click('#ki-demo-anruf-knopf');
        await page.waitForTimeout(500);
        k = await knopf(page);
        check(`${name}: «Nochmals testen» führt zurück zu «bereit»`, k?.text === 'Jetzt KI-Anruf erhalten', JSON.stringify(k));
    }
    console.log(`  Höhen Aktionskarte ${name}: ${JSON.stringify(hoehen)}`);
    const cls = await page.evaluate(() => window.__cls);
    if (cls > 0) console.log(`  CLS-Quellen ${name}:\n    ` + (await page.evaluate(() => window.__clsQuellen)).join('\n    '));
    check(`${name}: CLS im ganzen Ablauf ${cls.toFixed(4)}`, cls < 0.1, cls.toFixed(4));
    check(`${name}: keine Konsolenfehler`, konsole.length === 0, konsole.slice(0, 3).join(' | '));
    await ctx.close();
    return { cls, scanDauer };
}

/* ------------------------------------------------------------------ */
/* Teil 0: Texte, SEO, Navigation                                      */
/* ------------------------------------------------------------------ */
async function seoPruefung(browser) {
    const { ctx, page } = await neueSeite(browser, { breite: 1440, hoehe: 900, theme: 'light' });
    await page.goto(SEITE, { waitUntil: 'networkidle' });
    const seo = await page.evaluate(() => ({
        titel: document.title,
        beschreibung: document.querySelector('meta[name="description"]')?.content,
        ogBeschreibung: document.querySelector('meta[property="og:description"]')?.content,
        ogTitel: document.querySelector('meta[property="og:title"]')?.content,
        ogAlt: document.querySelector('meta[property="og:image:alt"]')?.content,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        ogBild: document.querySelector('meta[property="og:image"]')?.content,
        h1: document.querySelector('h1')?.textContent,
        badge: document.querySelector('h1')?.previousElementSibling?.textContent.trim(),
        heroSatz: document.querySelector('h1')?.nextElementSibling?.textContent.trim(),
        faq: [...document.querySelectorAll('details')].map((d) => ({ frage: d.querySelector('summary')?.textContent.trim(), antwort: d.querySelector('p')?.textContent.trim() })),
        faqSchema: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)).find((j) => j['@type'] === 'FAQPage'),
        mainText: document.querySelector('main').innerText,
        h2: [...document.querySelectorAll('h2')].map((h) => h.textContent.trim()),
        typen: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)['@type']),
        platzhalter: document.querySelector('#ki-demo-url')?.placeholder,
        vertrauen: document.querySelector('#ki-demo-vertrauen')?.textContent,
        preise: /CHF|Fr\.\s?\d|\d+\s?%/.test(document.querySelector('main').innerText),
        ss: /ß/.test(document.body.innerText),
        belege: [...document.querySelectorAll('#ki-demo-vertrauen + div li')].map((l) => l.textContent.trim()),
        faqLink: !!document.querySelector('details a[href="/datenschutz#testanruf-ki-telefonassistent"]'),
    }));
    // AUFTRAG-098: wortgleich gegen die Vorgaben in AUFTRAG-098.md
    check('A098 Titel wortgleich', seo.titel === VORGABEN.titel, seo.titel);
    check('A098 Meta-Beschreibung wortgleich (auch og:description)', seo.beschreibung === VORGABEN.beschreibung && seo.ogBeschreibung === VORGABEN.beschreibung, seo.beschreibung);
    check('A098 og:title = Titel', seo.ogTitel === VORGABEN.titel, seo.ogTitel);
    check('A098 Badge über der Hero-Zeile wortgleich', seo.badge === VORGABEN.badge, seo.badge);
    check('A098 Hero-Zeile (H1) wortgleich', seo.h1 === VORGABEN.heroZeile, seo.h1);
    check('A098 Hero-Satz wortgleich', seo.heroSatz === VORGABEN.heroSatz, seo.heroSatz);
    const faqNeu = seo.faq.find((f) => f.frage === VORGABEN.faqFrage);
    check('A098 FAQ «Spricht der Assistent wirklich Schweizerdeutsch?» wortgleich', faqNeu?.antwort === VORGABEN.faqAntwort, faqNeu?.antwort);
    const faqSchemaNeu = seo.faqSchema?.mainEntity?.find((q) => q.name === VORGABEN.faqFrage);
    check('A098 FAQ-Schema mit derselben Antwort', faqSchemaNeu?.acceptedAnswer?.text === VORGABEN.faqAntwort, faqSchemaNeu?.acceptedAnswer?.text);
    check('A098 Abschnitt ersetzt', seo.h2.includes(VORGABEN.abschnittNeu) && !seo.h2.includes(VORGABEN.abschnittAlt), `${VORGABEN.abschnittNeu} statt ${VORGABEN.abschnittAlt}`);
    const abschnitt = await page.evaluate((h) => [...document.querySelectorAll('h2')].find((x) => x.textContent.trim() === h)?.nextElementSibling?.textContent.replace(/\s+/g, ' ').trim(), VORGABEN.abschnittNeu);
    check(
        'A098 Abschnitt: eigene Anlage in der Schweiz, Deutsch und Englisch zuverlässig, Schweizerdeutsch in Erprobung, kein Callcenter im Ausland, keine Zahlen',
        /eigenen Telefonanlage in der Schweiz/.test(abschnitt || '') && /Deutsch und Englisch spricht er zuverlässig/.test(abschnitt || '') && /Schweizerdeutsch .*in Erprobung/.test(abschnitt || '') && /Callcenter im Ausland/.test(abschnitt || '') && !/\d/.test(abschnitt || ''),
        abschnitt,
    );
    const mundart = ['Der KI-Telefonassistent auf Schweizerdeutsch', 'KI-Telefonassistent auf Schweizerdeutsch', 'Er versteht Mundart', 'antwortet auf Schweizerdeutsch', 'Versteht Mundart', 'der Schweizerdeutsch spricht', 'Anliegen aufnimmt – auf Schweizerdeutsch'];
    check('A098 keine Mundart-Versprechen mehr im Seiteninhalt', !mundart.some((m) => seo.mainText.includes(m)), mundart.filter((m) => seo.mainText.includes(m)).join(' | '));
    check('A098 OG-Bild-Alt ohne Mundart-Versprechen', seo.ogAlt === 'KI-Telefonassistent für Schweizer KMU – InfraOne', seo.ogAlt);
    check('Canonical', seo.canonical === 'https://infraone.ch/ki-telefonassistent', seo.canonical);
    check('OG-Bild', /\/og\/ki-telefonassistent\.png$/.test(seo.ogBild || ''), seo.ogBild);
    const h2Soll = ['So funktioniert der Testanruf', VORGABEN.abschnittNeu, 'Was der Assistent im Alltag übernimmt', 'So läuft es bei Ihnen', 'Für welche Betriebe', 'Datenschutz und Technik, ehrlich erklärt', 'Häufige Fragen', 'Bereit für Ihren eigenen Assistenten?'];
    check('H2 vollständig (inkl. «So läuft es bei Ihnen»)', h2Soll.every((h) => seo.h2.includes(h)), seo.h2.join(' | '));
    check('JSON-LD Service/FAQPage/BreadcrumbList/WebPage', ['Service', 'FAQPage', 'BreadcrumbList', 'WebPage'].every((t) => seo.typen.includes(t)), seo.typen.join(','));
    check('Platzhalter wortgleich', seo.platzhalter === 'Ihre Website, z. B. muster-ag.ch');
    check('Vertrauenszeile wortgleich', seo.vertrauen === 'Kostenlos · Ohne Anmeldung · Keine Werbeanrufe', seo.vertrauen);
    check('A098 Mini-Belege wortgleich', VORGABEN.belege.length === 3 && seo.belege.join(' | ') === VORGABEN.belege.join(' | '), seo.belege.join(' | '));
    check('FAQ verlinkt den Datenschutz-Abschnitt Testanruf', seo.faqLink);
    const dsTechnik = await page.evaluate(() => [...document.querySelectorAll('h2')].find((h) => h.textContent.trim() === 'Datenschutz und Technik, ehrlich erklärt')?.nextElementSibling?.textContent?.replace(/\s+/g, ' ').trim());
    check('Abschnitt «Datenschutz und Technik» wortgleich', dsTechnik === 'Die Telefonanlage und Ihre Gesprächsprotokolle laufen in der Schweiz auf Systemen von InfraOne. Für Spracherkennung und Sprachausgabe nutzen wir die KI-Schnittstellen von OpenAI; Gesprächsinhalte werden dort nicht zum Training verwendet. Ihre Nummer aus dem Testanruf verwenden wir für diesen Anruf und für eine Rückmeldung von uns, falls Sie Fragen haben – nicht für Werbung. Mitschnitte gibt es im Kundenbetrieb nur mit Einwilligung beider Seiten.', dsTechnik);
    check('keine Preise/Prozente im Inhalt', !seo.preise);
    check('kein ß', !seo.ss);

    await page.locator('header nav >> text=Cloud-').first().hover();
    await page.waitForTimeout(500);
    const imHeader = await page.locator('header a[href="/ki-telefonassistent"]').count();
    const imFooter = await page.locator('footer a[href="/ki-telefonassistent"]').count();
    check('Header und Footer verlinken /ki-telefonassistent', imHeader >= 1 && imFooter >= 1, `Header ${imHeader}, Footer ${imFooter}`);
    const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
    check('Sitemap enthält Seite', sitemap.includes('https://infraone.ch/ki-telefonassistent'));
    check('A098 Sitemap ohne Mundart-Versprechen', !/Schweizerdeutsch|Mundart/i.test(sitemap));

    // AUFTRAG-098: übrige Erwähnungen ohne Mundart-Kernversprechen
    for (const datei of ['llms.txt', 'llms-full.txt']) {
        const t = await (await fetch(`${BASE}/${datei}`)).text();
        check(`A098 /${datei}: Deutsch/Englisch zuverlässig, Schweizerdeutsch in Erprobung`, /in Erprobung/.test(t) && !/Schweizerdeutsch \(Standard\)|antwortet auf Schweizerdeutsch|KI-Telefonassistent \(Schweizerdeutsch\)/.test(t), datei);
    }
    const ct = await (await fetch(`${BASE}/cloud-telefonie`)).text();
    check('A098 /cloud-telefonie: Teaser «KI-Telefonassistent für Schweizer KMU», kein «auf Schweizerdeutsch»', ct.includes('KI-Telefonassistent für Schweizer KMU') && !ct.includes('auf Schweizerdeutsch'));
    const start = await (await fetch(`${BASE}/`)).text();
    check('A098 Startseite: Leistung «Deutsch • Englisch • Schweizerdeutsch in Erprobung»', start.includes('Deutsch • Englisch • Schweizerdeutsch in Erprobung') && !start.includes('Schweizerdeutsch • Hochdeutsch • Englisch'));

    // Kantenmessung (Layout-Regel) wie AUFTRAG-013
    const kanten = await page.evaluate(() => {
        const aus = [];
        for (const sec of document.querySelectorAll('main section')) {
            const c = sec.querySelector(':scope > .container');
            if (!c) continue;
            const cr = c.getBoundingClientRect();
            const links = cr.left + parseFloat(getComputedStyle(c).paddingLeft);
            for (const k of c.children) {
                const r = k.getBoundingClientRect();
                if (r.width === 0) continue;
                const cls = typeof k.className === 'string' ? k.className : '';
                const typo = k.tagName === 'P' || /text-|subtitle|opacity/.test(cls);
                aus.push({ abw: Math.abs(r.left - links), typo, tag: k.tagName, cls: cls.slice(0, 60) });
            }
        }
        return aus;
    });
    const abweichend = kanten.filter((k) => !k.typo && k.abw > 1.1);
    check('Kanten: Strukturblöcke volle Containerbreite', abweichend.length === 0, abweichend.map((a) => `${a.tag} ${a.cls}`).join(' ;; ') || `${kanten.length} Blöcke geprüft`);

    await page.goto(`${BASE}/kontakt?subject=${encodeURIComponent('KI-Telefonassistent')}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const betreff = await page.locator('#subject').inputValue().catch(() => '');
    check('Kontaktformular übernimmt Betreff «KI-Telefonassistent»', betreff === 'KI-Telefonassistent', betreff);
    await ctx.close();
}

/* ------------------------------------------------------------------ */
/* Teil L: Logo-Karten (Messung)                                       */
/* ------------------------------------------------------------------ */
/**
 * AUFTRAG-096: Optionen für die breite Messung
 *   --ziel <ordner>    Screenshots unter auftraege/ergebnisse/<ordner> (Vorgabe A095-screens/logos)
 *   --ohne-ki          /api/demo/profil im Browser mit dem Regel-Profil des Scans beantworten
 *                      (keine KI-Kosten; Logo, Plakette und Farbe hängen nur am Scan)
 *   --ohne-website     keinen Screenshot des Website-Kopfs (bei Wiederholungen)
 *   --gross            Karte in doppelter Auflösung («<site>-karte-gross.png»)
 * Je Site: Logo geladen, Plakette (Hintergrund), Markenfarbe der Karte (--kunde), Logo-Quelle.
 */
function logoOptionen() {
    const wert = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
    const ziel = wert('--ziel');
    const optionen = new Set(['--ziel', '--ohne-ki', '--ohne-website', '--logos', '--gross']);
    const sites = [];
    for (let i = args.indexOf('--logos') + 1; i < args.length; i++) {
        if (args[i] === '--ziel') {
            i++;
            continue;
        }
        if (!optionen.has(args[i])) sites.push(args[i]);
    }
    return { dir: ziel ? path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', ziel) : path.join(SCREENS, 'logos'), ohneKi: args.includes('--ohne-ki'), ohneWebsite: args.includes('--ohne-website'), gross: args.includes('--gross'), sites };
}

const dateiName = (site) => site.replace(/^https?:\/\//, '').replace(/[^a-z0-9.-]+/gi, '_').replace(/_+$/, '');

async function logoKarten(browser, sites, { dir, ohneKi = false, ohneWebsite = false, gross = false } = {}) {
    mkdirSync(dir, { recursive: true });
    const aus = [];
    for (const site of sites) {
        limitsZuruecksetzen();
        const { ctx, page, konsole } = await neueSeite(browser, { breite: 1440, hoehe: 900, theme: 'light', skala: gross ? 2 : null });
        const eintrag = { site };
        const name = dateiName(site);
        try {
            // Website selbst (Kopfbereich) zum Vergleich — nur ansehen
            if (!ohneWebsite) {
                const w = await ctx.newPage();
                await w.setViewportSize({ width: 1280, height: 420 });
                await w.goto(/^https?:/.test(site) ? site : `https://${site}`, { waitUntil: 'load', timeout: 25000 }).catch(() => undefined);
                await w.waitForTimeout(2500);
                await w.screenshot({ path: path.join(dir, `${name}-website.png`) }).catch(() => undefined);
                await w.close();
            }
            let scanJson = null;
            await page.route('**/api/demo/scan', async (route) => {
                const r = await route.fetch();
                scanJson = await r.json().catch(() => null);
                await route.fulfill({ response: r, json: scanJson ?? {} });
            });
            if (ohneKi) {
                await page.route('**/api/demo/profil', async (route) => {
                    const p = scanJson?.profil;
                    await route.fulfill({ status: p ? 200 : 404, contentType: 'application/json', body: JSON.stringify(p ? { profil: p, funde: { telefon: scanJson.funde?.telefon ?? null, oeffnungszeiten: scanJson.funde?.oeffnungszeiten ?? null, wissen: p.wissen.length } } : { fehler: 'kein Scan' }) });
                });
            }
            await page.goto(SEITE, { waitUntil: 'networkidle' });
            const t0 = Date.now();
            await page.fill('#ki-demo-url', site);
            await page.click('#ki-demo-scan-knopf');
            await page.locator('#ki-demo-anruf-knopf[data-zustand="bereit"]').waitFor({ state: 'visible', timeout: 60000 });
            eintrag.ms = Date.now() - t0;
            await page.waitForTimeout(900);
            const info = await page.evaluate(() => {
                const img = document.querySelector('figure [role="group"] img');
                const stil = document.querySelector('figure [style*="--kunde"]');
                return {
                    logo: !!img && img.complete && img.naturalWidth > 0,
                    src: img?.getAttribute('src') ?? null,
                    natW: img?.naturalWidth ?? null,
                    natH: img?.naturalHeight ?? null,
                    plakette: img ? getComputedStyle(img.parentElement).backgroundColor : null,
                    kunde: stil ? stil.style.getPropertyValue('--kunde').trim() : null,
                };
            });
            const scan = scanJson ?? {};
            Object.assign(eintrag, info, { scanLogo: scan.logos?.[0] ?? null, logos: (scan.logos ?? []).map((l) => `${l.quelle} ${l.format ?? ''}`), scanMs: scan.dauer_ms ?? null, funde: scan.funde ?? null, logoUrlProfil: scan.profil?.logo_url ?? null, konsole: konsole.slice(0, 3) });
            await page.locator('figure').screenshot({ path: path.join(dir, gross ? `${name}-karte-gross.png` : `${name}-karte.png`) });
            console.log(`LOGO  ${site}  ${info.logo ? 'Logo' : 'Initiale'}  ${scan.logos?.[0]?.quelle ?? '–'} ${scan.logos?.[0]?.format ?? ''}  Plakette ${info.plakette ?? '–'}  Farbe ${info.kunde ?? '–'}  ${eintrag.ms} ms`);
        } catch (e) {
            eintrag.fehler = e.message;
            console.log(`LOGO  ${site}  FEHLER ${e.message.slice(0, 120)}`);
        }
        aus.push(eintrag);
        await ctx.close();
    }
    // mit früheren Läufen zusammenführen (gleiche Site → neuer Eintrag)
    const datei = path.join(dir, 'karten.json');
    const alt = existsSync(datei) ? JSON.parse(readFileSync(datei, 'utf8')) : [];
    const zusammen = [...alt.filter((a) => !aus.some((n) => n.site === a.site)), ...aus];
    writeFileSync(datei, JSON.stringify(zusammen, null, 2), 'utf8');
    return aus;
}

/* ------------------------------------------------------------------ */
/* Teil Z: Request-Zählung je Demo-Anruf (AUFTRAG-098)                 */
/* ------------------------------------------------------------------ */
/**
 * Zählt die Status-Abfragen (GET /api/demo/auftraege/{id}) des Widgets für
 * EINEN Demo-Anruf mit fester Zeitachse (Anruf-API im Browser abgefangen,
 * Profil = Regel-Profil des Scans, keine KI-Kosten):
 *   wartend → angenommen 2 s → waehlt 4 s → verbunden 12 s → beendet 132 s
 *   (zwei Minuten Gespräch), danach 15 s Nachlauf (keine Abfragen mehr erwartet).
 * Mit `verdeckt` ist der Tab von 14 s bis 104 s verdeckt (Besucher am Telefon):
 * document.visibilityState wird im Browser auf «hidden» gestellt und
 * `visibilitychange` ausgelöst.
 */
const ZEITACHSE = { angenommen: 2000, waehlt: 4000, verbunden: 12000, beendet: 132000 };

async function zaehlung(browser, { name, verdeckt = false, website = 'infraone.ch' }) {
    limitsZuruecksetzen();
    const { ctx, page, konsole } = await neueSeite(browser, { breite: 1440, hoehe: 900, theme: 'light' });
    const z = { start: 0, abfragen: [], gesendet: null };
    let scanJson = null;
    await page.route('**/api/demo/scan', async (route) => {
        const r = await route.fetch();
        scanJson = await r.json().catch(() => null);
        await route.fulfill({ response: r, json: scanJson ?? {} });
    });
    await page.route('**/api/demo/profil', async (route) => {
        const p = scanJson?.profil;
        await route.fulfill({ status: p ? 200 : 404, contentType: 'application/json', body: JSON.stringify(p ? { profil: p, funde: { telefon: null, oeffnungszeiten: null, wissen: p.wissen.length } } : { fehler: 'kein Scan' }) });
    });
    await page.route('**/api/demo/anruf', async (route) => {
        z.gesendet = JSON.parse(route.request().postData() || '{}');
        z.start = Date.now();
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'd-20261025-zaehlungbrowser01' }) });
    });
    await page.route('**/api/demo/auftraege/**', async (route) => {
        const t = Date.now() - z.start;
        z.abfragen.push(t);
        let status = 'wartend';
        if (t > ZEITACHSE.angenommen) status = 'angenommen';
        if (t > ZEITACHSE.waehlt) status = 'waehlt';
        if (t > ZEITACHSE.verbunden) status = 'verbunden';
        const fertig = t > ZEITACHSE.beendet;
        if (fertig) status = 'beendet';
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'd-20261025-zaehlungbrowser01', status, zeit: new Date().toISOString(), dauer_s: fertig ? 120 : null, zusammenfassung: fertig ? 'Zählung (Attrappe im Browser).' : null, grund: null }) });
    });
    await page.goto(SEITE, { waitUntil: 'networkidle' });
    await page.fill('#ki-demo-url', website);
    await page.click('#ki-demo-scan-knopf');
    await page.locator('#ki-demo-anruf-knopf[data-zustand="bereit"]').waitFor({ state: 'visible', timeout: 60000 });
    await page.locator('#ki-demo-sprache-hochdeutsch').check({ force: true });
    await page.fill('#ki-demo-nummer', '079 000 00 01');
    await page.locator('#ki-demo-einwilligung').check();
    await page.click('#ki-demo-anruf-knopf');
    const sichtbarkeit = (wert) =>
        page.evaluate((v) => {
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v });
            Object.defineProperty(document, 'hidden', { configurable: true, get: () => v === 'hidden' });
            document.dispatchEvent(new Event('visibilitychange'));
        }, wert);
    const bis = async (ms) => {
        while (!z.start || Date.now() - z.start < ms) await page.waitForTimeout(200);
    };
    let zurueck = null;
    if (verdeckt) {
        await bis(14000);
        await sichtbarkeit('hidden');
        await bis(104000);
        await sichtbarkeit('visible');
        zurueck = Date.now() - z.start;
    }
    await bis(ZEITACHSE.beendet + 15000);
    const endZustand = (await knopf(page))?.zustand;
    const ersteNachEnde = z.abfragen.find((t) => t > ZEITACHSE.beendet) ?? null;
    const aus = {
        name,
        verdeckt,
        abfragen: z.abfragen.length,
        nachEnde: z.abfragen.filter((t) => t > (ersteNachEnde ?? Infinity)).length,
        imVerdeckten: verdeckt ? z.abfragen.filter((t) => t > 14000 && t < 104000).length : null,
        sofortNachRueckkehr: verdeckt ? z.abfragen.some((t) => t >= zurueck && t < zurueck + 1000) : null,
        endZustand,
        zeiten_ms: z.abfragen,
        konsole: konsole.slice(0, 3),
    };
    console.log(`ZAEHLUNG ${name}${verdeckt ? ' (Tab 14–104 s verdeckt)' : ''}: ${aus.abfragen} Abfragen, nach «beendet» ${aus.nachEnde}, Endzustand ${endZustand}`);
    await ctx.close();
    return aus;
}

/**
 * AUFTRAG-098: 20 Minuten ohne Endzustand. Playwright-Uhr (page.clock) — der
 * Status bleibt «verbunden»; nach 20 Minuten hört das Widget auf und zeigt den
 * Hinweis «Keine Rückmeldung» mit «Nochmals versuchen».
 */
async function zwanzigMinuten(browser, { website = 'infraone.ch' } = {}) {
    limitsZuruecksetzen();
    const { ctx, page, konsole } = await neueSeite(browser, { breite: 1440, hoehe: 900, theme: 'light' });
    await page.clock.install();
    let scanJson = null;
    const abfragen = [];
    await page.route('**/api/demo/scan', async (route) => {
        const r = await route.fetch();
        scanJson = await r.json().catch(() => null);
        await route.fulfill({ response: r, json: scanJson ?? {} });
    });
    await page.route('**/api/demo/profil', async (route) => {
        const p = scanJson?.profil;
        await route.fulfill({ status: p ? 200 : 404, contentType: 'application/json', body: JSON.stringify(p ? { profil: p, funde: { telefon: null, oeffnungszeiten: null, wissen: p.wissen.length } } : {}) });
    });
    await page.route('**/api/demo/anruf', (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'd-20261025-zwanzigminuten01' }) }));
    await page.route('**/api/demo/auftraege/**', async (route) => {
        abfragen.push(Date.now());
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'd-20261025-zwanzigminuten01', status: 'verbunden', zeit: new Date().toISOString(), dauer_s: null, zusammenfassung: null, grund: null }) });
    });
    await page.goto(SEITE, { waitUntil: 'networkidle' });
    await page.fill('#ki-demo-url', website);
    await page.click('#ki-demo-scan-knopf');
    await page.locator('#ki-demo-anruf-knopf[data-zustand="bereit"]').waitFor({ state: 'visible', timeout: 60000 });
    await page.fill('#ki-demo-nummer', '079 000 00 01');
    await page.locator('#ki-demo-einwilligung').check();
    await page.click('#ki-demo-anruf-knopf');
    await page.locator('#ki-demo-anruf-knopf[data-zustand="verbunden"]').waitFor({ state: 'visible', timeout: 15000 });
    const vorSprung = abfragen.length;
    await page.clock.fastForward('19:00');
    await page.waitForTimeout(500);
    const nach19 = (await knopf(page))?.zustand;
    await page.clock.fastForward('01:30');
    await page.waitForTimeout(800);
    const k = await knopf(page);
    const titel = await page.locator('#ki-demo-anruf-titel').textContent().catch(() => '');
    const meldung = await page.locator('#ki-demo-anruf-titel ~ form [role="alert"]').textContent().catch(() => '');
    const anzahl = abfragen.length;
    await page.clock.fastForward('05:00');
    await page.waitForTimeout(800);
    await shot(page, 'desktop-1440-hell-07-keine-rueckmeldung.png');
    check('A098 20 Minuten: nach 19 min noch «verbunden» (Abfrage läuft)', nach19 === 'verbunden', `${nach19}, ${vorSprung} Abfragen vor dem Sprung`);
    check('A098 20 Minuten ohne Endzustand → Hinweis «Keine Rückmeldung» + «Nochmals versuchen»', k?.zustand === 'fehler' && k?.text === 'Nochmals versuchen' && titel === 'Keine Rückmeldung' && meldung.startsWith('Seit 20 Minuten kam keine Rückmeldung'), `${k?.zustand} / ${titel} / ${meldung.slice(0, 60)}`);
    check('A098 20 Minuten: danach keine Abfrage mehr', abfragen.length === anzahl, `${anzahl} → ${abfragen.length}`);
    check('A098 20 Minuten: keine Konsolenfehler', konsole.length === 0, konsole.slice(0, 2).join(' | '));
    await ctx.close();
}

/* ------------------------------------------------------------------ */
/* Teil C: Anstoss der Anlage (AUFTRAG-098, nur eigener Server!)        */
/* ------------------------------------------------------------------ */
/**
 * Attrappen-Anlage auf 127.0.0.1:ANSTOSS_PORT — verhält sich wie A-097:
 * POST /api/demo/anstoss (Bearer, X-Anstoss-Zeit, Body {id}) → je Modus 202
 * (dann sofort GET /api/demo/auftraege/{id} mit Bearer und Status melden),
 * 409 (belegt), 401, 500 oder keine Antwort (Timeout). Rückfall wie A-097:
 * die Warteschlange wird im Takt mit warte=0 abgefragt (im Test 12 s statt 60 s).
 */
function anlageAttrappe({ port, token }) {
    const z = { modus: '202', anstoesse: [], verarbeitet: new Set(), laeuft: false, belegtBis: 0, rueckfall: [], abholungen: [], fehler: [], aufrufeJeAuftrag: {} };
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));
    const zaehle = (id) => (z.aufrufeJeAuftrag[id] = (z.aufrufeJeAuftrag[id] ?? 0) + 1);
    const meldung = (id, status, extra = {}) =>
        zaehle(id) &&
        fetch(`${BASE}/api/demo/auftraege/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status, grund: null, dauer_s: null, zusammenfassung: null, zeit: new Date().toISOString(), ...extra }),
        });
    async function verarbeite(id, weg) {
        if (z.verarbeitet.has(id)) return;
        z.verarbeitet.add(id);
        z.laeuft = true;
        try {
            zaehle(id);
            const r = await fetch(`${BASE}/api/demo/auftraege/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            const a = await r.json();
            z.abholungen.push({ id, weg, http: r.status, status: a.status, nummer: !!a.nummer, profil: !!a.profil?.firma, sprache: a.sprache });
            if (a.status !== 'wartend' || !a.nummer) return;
            await meldung(id, 'angenommen');
            await pause(1500);
            await meldung(id, 'waehlt');
            await pause(4500);
            await meldung(id, 'verbunden');
            await pause(9000);
            await meldung(id, 'beendet', { dauer_s: 9, zusammenfassung: `Attrappen-Anlage (${weg}): Gespräch durchgespielt, niemand wurde angerufen.` });
        } catch (e) {
            z.fehler.push(`${id}: ${e.message}`);
        } finally {
            z.laeuft = false;
        }
    }
    const server = http.createServer(async (req, res) => {
        if (req.method !== 'POST' || req.url !== '/api/demo/anstoss') {
            res.writeHead(404).end();
            return;
        }
        let body = '';
        for await (const c of req) body += c;
        const e = { t: Date.now(), modus: z.modus, auth: req.headers.authorization === `Bearer ${token}`, zeit: req.headers['x-anstoss-zeit'] ?? null, body };
        z.anstoesse.push(e);
        let id = null;
        try {
            id = JSON.parse(body).id;
        } catch {
            /* leer */
        }
        if (!e.auth) return res.writeHead(401).end();
        if (z.modus === 'timeout') return void setTimeout(() => res.writeHead(202).end('{}'), 6000);
        if (z.modus === '401') return res.writeHead(401).end();
        if (z.modus === '500') return res.writeHead(500).end();
        if (z.modus === '409' || z.laeuft || Date.now() < z.belegtBis) {
            res.writeHead(409, { 'Content-Type': 'application/json' }).end('{"ok":false,"status":"belegt"}');
            return;
        }
        res.writeHead(202, { 'Content-Type': 'application/json' }).end('{"ok":true,"status":"angenommen"}');
        void verarbeite(id, 'anstoss');
    });
    let takt = null;
    return {
        z,
        start: () => new Promise((r) => server.listen(port, '127.0.0.1', r)),
        rueckfallStarten(ms) {
            takt = setInterval(async () => {
                if (z.laeuft || Date.now() < z.belegtBis) return;
                try {
                    const r = await fetch(`${BASE}/api/demo/warteschlange?warte=0`, { headers: { Authorization: `Bearer ${token}` } });
                    const q = await r.json();
                    z.rueckfall.push({ t: Date.now(), anzahl: q.auftraege?.length ?? 0 });
                    const neu = (q.auftraege ?? []).find((a) => !z.verarbeitet.has(a.id));
                    if (neu) void verarbeite(neu.id, 'rueckfall');
                } catch (e) {
                    z.fehler.push(`rueckfall: ${e.message}`);
                }
            }, ms);
        },
        stop: () => {
            clearInterval(takt);
            server.closeAllConnections?.();
            server.close();
        },
    };
}

async function anstossTest() {
    const port = Number(process.env.ANSTOSS_PORT || 0);
    if (BASE === 'http://localhost:3000' || !process.env.DEMO_STORE_DIR || !port) {
        console.error('--anstoss nur gegen einen eigenen Server (BASE_URL ≠ :3000, DEMO_STORE_DIR, ANSTOSS_PORT; der Server läuft mit DEMO_ANSTOSS_URL=http://127.0.0.1:<ANSTOSS_PORT>/api/demo/anstoss).');
        process.exit(2);
    }
    const TOKEN = env.DEMO_TOKEN;
    const anlage = anlageAttrappe({ port, token: TOKEN });
    await anlage.start();
    const z = anlage.z;
    const ergebnis = { modi: {} };

    // Warteschlange gedeckelt: warte=20 → Antwort nach ≈ 8 s (leere Schlange)
    let t0 = Date.now();
    const leer = await (await fetch(`${BASE}/api/demo/warteschlange?warte=20`, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
    const warteMs = Date.now() - t0;
    check('A098 warte=20 wird auf 8 s gedeckelt', (leer.auftraege?.length ?? -1) === 0 && warteMs >= 7500 && warteMs < 9800, `${warteMs} ms`);
    ergebnis.warte20_ms = warteMs;

    async function anrufPerApi(nummer) {
        const scan = await (await fetch(`${BASE}/api/demo/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'infraone.ch' }) })).json();
        const t = Date.now();
        const r = await fetch(`${BASE}/api/demo/anruf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scan_id: scan.scan_id, nummer, sprache: 'hochdeutsch', einwilligung: true, honigtopf: '' }) });
        return { status: r.status, id: (await r.json()).id, ms: Date.now() - t };
    }
    const statusVon = async (id) => (await (await fetch(`${BASE}/api/demo/auftraege/${id}`)).json()).status;

    // 401 und 5xx: per API (Auftrag bleibt wartend, Besucher bekommt 201), danach als Anlage schliessen
    for (const [modus, versucheSoll] of [['401', 1], ['500', 2]]) {
        z.modus = modus;
        const vorher = z.anstoesse.length;
        const a = await anrufPerApi(modus === '401' ? '+41790000011' : '+41790000012');
        const versuche = z.anstoesse.length - vorher;
        const st = await statusVon(a.id);
        check(`A098 Anstoss ${modus}: Besucher 201, Auftrag bleibt «wartend», ${versucheSoll} Versuch(e)`, a.status === 201 && st === 'wartend' && versuche === versucheSoll, `${a.status}, ${st}, ${versuche} Versuche, ${a.ms} ms`);
        ergebnis.modi[modus] = { http: a.status, status: st, versuche, anruf_ms: a.ms };
        z.verarbeitet.add(a.id);
        await fetch(`${BASE}/api/demo/auftraege/${a.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ status: 'fehler', grund: 'technisch', dauer_s: null, zusammenfassung: null, zeit: new Date().toISOString() }) });
    }

    // Bearer-Ansicht: ohne Kopf öffentlich, falscher Kopf 401
    {
        z.modus = '409';
        const a = await anrufPerApi('+41790000013');
        const oeffentlich = await (await fetch(`${BASE}/api/demo/auftraege/${a.id}`)).json();
        const falsch = await fetch(`${BASE}/api/demo/auftraege/${a.id}`, { headers: { Authorization: 'Bearer falsch-falsch-falsch-falsch' } });
        const anlageSicht = await (await fetch(`${BASE}/api/demo/auftraege/${a.id}`, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
        check('A098 Statusansicht ohne Kopf: keine Nummer, kein Profil', !('nummer' in oeffentlich) && !('profil' in oeffentlich) && oeffentlich.status === 'wartend', Object.keys(oeffentlich).join(','));
        check('A098 Statusansicht mit falschem Bearer → 401', falsch.status === 401);
        check('A098 Ansicht für die Anlage (Bearer): nummer, sprache, profil', anlageSicht.nummer === '+41790000013' && anlageSicht.sprache === 'hochdeutsch' && !!anlageSicht.profil?.firma && anlageSicht.status === 'wartend', Object.keys(anlageSicht).join(','));
        z.verarbeitet.add(a.id);
        await fetch(`${BASE}/api/demo/auftraege/${a.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ status: 'fehler', grund: 'technisch', dauer_s: null, zusammenfassung: null, zeit: new Date().toISOString() }) });
    }

    // Rückfall der Anlage: Warteschlange im Takt (Test: 12 s statt 60 s), warte=0
    anlage.rueckfallStarten(12000);

    const browser = await chromium.launch({ executablePath: CHROME, headless: true });
    try {
        for (const [modus, nr] of [['202', 1], ['409', 2], ['timeout', 3]]) {
            z.modus = modus;
            if (modus === '409') z.belegtBis = Date.now() + 15000; // «es läuft schon ein Demo-Anruf» (15 s)
            const name = `anstoss-${modus}`;
            const { ctx, page, konsole } = await neueSeite(browser, { breite: 1440, hoehe: 900, theme: 'light' });
            let scanJson = null;
            await page.route('**/api/demo/scan', async (route) => {
                const r = await route.fetch();
                scanJson = await r.json().catch(() => null);
                await route.fulfill({ response: r, json: scanJson ?? {} });
            });
            // Profil = Regel-Profil des Scans (keine KI-Kosten); Anruf und Status laufen ECHT über den Server
            await page.route('**/api/demo/profil', async (route) => {
                const p = scanJson?.profil;
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profil: p, funde: { telefon: null, oeffnungszeiten: null, wissen: p?.wissen.length ?? 0 } }) });
            });
            const abfragen = [];
            const api = {};
            let klick = 0;
            page.on('request', (r) => {
                if (/\/api\/demo\/auftraege\/d-/.test(r.url()) && r.method() === 'GET') abfragen.push(Date.now() - klick);
                const m = r.url().match(/\/api\/demo\/([a-z]+)/);
                if (m) api[m[1]] = (api[m[1]] ?? 0) + 1;
            });
            await page.goto(SEITE, { waitUntil: 'networkidle' });
            await page.fill('#ki-demo-url', 'infraone.ch');
            await page.click('#ki-demo-scan-knopf');
            await page.locator('#ki-demo-anruf-knopf[data-zustand="bereit"]').waitFor({ state: 'visible', timeout: 60000 });
            await page.fill('#ki-demo-nummer', `079 000 00 2${nr}`);
            await page.locator('#ki-demo-einwilligung').check();
            const vorher = z.anstoesse.length;
            const anrufAntwort = page.waitForResponse((r) => r.url().endsWith('/api/demo/anruf'), { timeout: 20000 });
            klick = Date.now();
            await page.click('#ki-demo-anruf-knopf');
            const ar = await anrufAntwort;
            const anrufMs = Date.now() - klick;
            const id = (await ar.json()).id;
            const statusDanach = await statusVon(id);
            const gesehen = [];
            const ende = Date.now() + 75000;
            while (Date.now() < ende) {
                const k = await knopf(page);
                if (k?.zustand && gesehen[gesehen.length - 1]?.z !== k.zustand) gesehen.push({ z: k.zustand, t: Date.now() - klick, text: k.text });
                if (k?.zustand === 'beendet' || k?.zustand === 'fehler') break;
                await page.waitForTimeout(250);
            }
            await shot(page, `${name}-beendet.png`);
            const zahlBeiEnde = abfragen.length;
            await page.waitForTimeout(9000);
            const anst = z.anstoesse.slice(vorher);
            const ab = z.abholungen.find((a) => a.id === id);
            const folge = gesehen.map((g) => g.z).join(' > ');
            const e0 = anst[0];
            const zeitOk = e0 && /^\d{10}$/.test(e0.zeit ?? '') && Math.abs(Number(e0.zeit) * 1000 - e0.t) < 3000;
            const koerperOk = anst.every((a) => a.body === JSON.stringify({ id }));
            ergebnis.modi[modus] = {
                id_ok: !!id,
                http: ar.status(),
                anruf_ms: anrufMs,
                status_nach_201: statusDanach,
                anstoesse: anst.length,
                abstand_ms: anst[1] ? anst[1].t - anst[0].t : null,
                abholung: ab?.weg ?? null,
                folge: gesehen,
                status_abfragen: zahlBeiEnde,
                nach_ende: abfragen.length - zahlBeiEnde,
                // Function-Aufrufe dieses Demo-Anrufs: Browser (profil im Test abgefangen, zählt real 1) + Anlage (GET Auftrag + Status-Meldungen)
                aufrufe_browser: api,
                aufrufe_anlage: z.aufrufeJeAuftrag[id] ?? 0,
            };
            check(`A098 ${name}: Anstoss mit Bearer, X-Anstoss-Zeit, Körper nur {id}`, anst.length >= 1 && anst.every((a) => a.auth) && zeitOk && koerperOk, `${anst.length}× ${e0?.body} zeit=${e0?.zeit}`);
            if (modus === '202') {
                check(`A098 ${name}: ein Anstoss, Anlage holt per Bearer-GET ab`, anst.length === 1 && ab?.weg === 'anstoss' && ab.nummer && ab.profil && ab.status === 'wartend', JSON.stringify(ab));
                check(`A098 ${name}: Besucher bekommt 201 ohne Verzögerung`, ar.status() === 201 && anrufMs < 3000, `${anrufMs} ms`);
            } else if (modus === '409') {
                check(`A098 ${name}: belegt → Auftrag bleibt «wartend», kein zweiter Anstoss`, anst.length === 1 && statusDanach === 'wartend' && ar.status() === 201, `${anst.length}, ${statusDanach}`);
                check(`A098 ${name}: Rückfall holt ihn nach dem laufenden Anruf ab`, ab?.weg === 'rueckfall', JSON.stringify(ab));
            } else {
                const abstand = anst[1] ? anst[1].t - anst[0].t : 0;
                check(`A098 ${name}: zwei Versuche (Frist 4 s + 1 s Pause), Besucher trotzdem 201`, anst.length === 2 && abstand >= 4800 && abstand < 6500 && ar.status() === 201 && anrufMs >= 8500 && anrufMs < 11000, `${anst.length} Versuche, Abstand ${abstand} ms, Anruf ${anrufMs} ms`);
                // Der Auftrag liegt schon während der Anstoss-Versuche «wartend» in der Warteschlange —
                // der Rückfall darf ihn holen, bevor der Besucher sein 201 hat (kein Doppelanruf)
                check(`A098 ${name}: Rückfall holt den wartenden Auftrag ab (genau einmal)`, ab?.weg === 'rueckfall' && ab.status === 'wartend' && z.abholungen.filter((x) => x.id === id).length === 1, `Status nach 201: ${statusDanach}, ${JSON.stringify(ab)}`);
            }
            check(`A098 ${name}: Zustandsfolge bis «beendet»`, /^wartend( > waehlt)? > verbunden > beendet$/.test(folge), folge + ' @ ' + gesehen.map((g) => `${(g.t / 1000).toFixed(1)}s`).join(', '));
            check(`A098 ${name}: Status-Abfragen ${zahlBeiEnde} im Takt 4 s, nach «beendet» keine`, abfragen.length === zahlBeiEnde && abfragen.slice(1).every((t, i) => t - abfragen[i] >= 3900), abfragen.map((t) => (t / 1000).toFixed(1)).join(', '));
            check(`A098 ${name}: keine Konsolenfehler`, konsole.length === 0, konsole.slice(0, 2).join(' | '));
            await ctx.close();
            while (z.laeuft) await new Promise((r) => setTimeout(r, 300));
        }
    } finally {
        await browser.close();
        anlage.stop();
    }
    check('A098 Attrappen-Anlage ohne Fehler', z.fehler.length === 0, z.fehler.join(' | '));
    check('A098 Rückfall fragt mit warte=0 (sofortige Antworten)', z.rueckfall.length > 0, `${z.rueckfall.length} Abfragen`);

    // Journal der Website (Server-Log): je Anstoss eine Zeile, nur Kennung, keine Nummer
    if (process.env.SERVER_LOG && existsSync(process.env.SERVER_LOG)) {
        const zeilen = readFileSync(process.env.SERVER_LOG, 'utf8').split(/\r?\n/).filter((l) => l.includes('[demo/anstoss]'));
        const ergebnisse = zeilen.map((l) => l.match(/ergebnis=(\w+)/)?.[1]);
        ergebnis.journal = zeilen;
        check(
            'A098 Journal: Zeilen für angenommen, belegt, nicht_autorisiert, fehler, zeitueberschreitung — ohne Nummer',
            ['angenommen', 'belegt', 'nicht_autorisiert', 'fehler', 'zeitueberschreitung'].every((e) => ergebnisse.includes(e)) && !zeilen.some((l) => /\+41|0790000/.test(l)),
            zeilen.map((l) => l.replace(/^.*\[demo\/anstoss\]/, '')).join(' || ').slice(0, 400),
        );
    }
    writeFileSync(path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', 'A098-anstoss.json'), JSON.stringify(ergebnis, null, 2), 'utf8');
}

/* ------------------------------------------------------------------ */
/* Teil B: Attrappen-Orchestrator (nur eigener Server!)                */
/* ------------------------------------------------------------------ */
async function attrappenTest() {
    if (BASE === 'http://localhost:3000' || !process.env.DEMO_STORE_DIR) {
        console.error('--attrappe nur gegen einen eigenen Server mit eigenem Speicher (BASE_URL ≠ :3000 und DEMO_STORE_DIR gesetzt): ein echter Orchestrator könnte sonst Test-Aufträge abholen und anrufen.');
        process.exit(2);
    }
    const TOKEN = env.DEMO_TOKEN;
    limitsZuruecksetzen();
    const scan = await (await fetch(`${BASE}/api/demo/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'zahnarztpraxisneuwiesen.ch' }) })).json();
    const r = await fetch(`${BASE}/api/demo/anruf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scan_id: scan.scan_id, nummer: '+41790000009', sprache: 'hochdeutsch', einwilligung: true, honigtopf: '' }) });
    const { id } = await r.json();
    check('Attrappe: Auftrag angelegt (201)', r.status === 201, id);
    const q = await (await fetch(`${BASE}/api/demo/warteschlange`, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
    const a = q.auftraege.find((x) => x.id === id);
    check('Attrappe: Auftrag-Felder exakt', a && Object.keys(a).join(',') === 'id,erstellt,nummer,sprache,profil', a && Object.keys(a).join(','));
    check('Attrappe: Profil-Felder (A-091 + stimme)', a && Object.keys(a.profil).join(',') === 'firma,website,assistent_name,branche,telefon,email,adresse,oeffnungszeiten_text,firma_text,faehigkeiten,wissen,logo_url,farben,stimme', a && Object.keys(a.profil).join(','));
    check('Attrappe: stimme passt zum Namen', a && ((a.profil.stimme === 'weiblich') === ['Lena', 'Mia', 'Laura', 'Sara', 'Anna', 'Lea', 'Nina', 'Julia', 'Elena', 'Sophie', 'Lara', 'Alina', 'Noemi', 'Selina', 'Jana', 'Livia', 'Lina', 'Leonie', 'Chiara', 'Elin'].includes(a.profil.assistent_name)), a && `${a.profil.assistent_name}/${a.profil.stimme}`);
    check('Attrappe: logo_url http(s) oder null', a && (a.profil.logo_url === null || /^https?:\/\//.test(a.profil.logo_url)), a?.profil.logo_url);
    for (const status of ['angenommen', 'waehlt', 'verbunden', 'beendet']) {
        const s = await fetch(`${BASE}/api/demo/auftraege/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ status, grund: null, dauer_s: status === 'beendet' ? 47 : null, zusammenfassung: status === 'beendet' ? 'Attrappe' : null, zeit: new Date().toISOString() }) });
        check(`Attrappe: Status ${status} → 200`, s.status === 200);
    }
    const ohne = await fetch(`${BASE}/api/demo/warteschlange`);
    check('Warteschlange ohne Token → 401', ohne.status === 401);
}

/* ------------------------------------------------------------------ */
/* Ablauf                                                              */
/* ------------------------------------------------------------------ */
if (args.includes('--attrappe')) {
    await attrappenTest();
} else if (args.includes('--anstoss')) {
    await anstossTest();
} else {
    const browser = await chromium.launch({ executablePath: CHROME, headless: true });
    try {
        const logoIndex = args.indexOf('--logos');
        const nur = args.includes('--nur') ? args[args.indexOf('--nur') + 1] : null;
        if (logoIndex >= 0) {
            const o = logoOptionen();
            await logoKarten(browser, o.sites, o);
        } else if (args.includes('--zwanzig')) {
            await zwanzigMinuten(browser);
        } else if (args.includes('--zaehlung')) {
            // AUFTRAG-098: --zaehlung <etikett> → ergebnisse/A098-zaehlung-<etikett>.json
            const etikett = args[args.indexOf('--zaehlung') + 1] || 'lauf';
            const [offen, verdeckt] = await Promise.all([zaehlung(browser, { name: `${etikett}-offen` }), zaehlung(browser, { name: `${etikett}-verdeckt`, verdeckt: true })]);
            writeFileSync(path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', `A098-zaehlung-${etikett}.json`), JSON.stringify({ zeitachse_ms: ZEITACHSE, offen, verdeckt }, null, 2), 'utf8');
        } else if (nur) {
            const v = {
                'desktop-1440-hell': { breite: 1440, hoehe: 900, theme: 'light', website: 'zahnarztpraxisneuwiesen.ch', sprache: 'Deutsch' },
                'mobil-375-hell': { breite: 375, hoehe: 812, theme: 'light', mobil: true, website: 'ryserboeden.ch', sprache: 'Schweizerdeutsch (in Erprobung)' },
                'desktop-1440-dunkel': { breite: 1440, hoehe: 900, theme: 'dark', website: 'gmtec.ch', sprache: 'English' },
                'mobil-375-dunkel': { breite: 375, hoehe: 812, theme: 'dark', mobil: true, website: 'swipay.ch', sprache: 'English' },
            }[nur];
            await variante(browser, { name: nur, ...v });
        } else {
            await seoPruefung(browser);
            const messung = [];
            messung.push(await variante(browser, { name: 'desktop-1440-hell', breite: 1440, hoehe: 900, theme: 'light', website: 'zahnarztpraxisneuwiesen.ch', sprache: 'Deutsch' }));
            messung.push(await variante(browser, { name: 'desktop-1440-dunkel', breite: 1440, hoehe: 900, theme: 'dark', website: 'gmtec.ch', sprache: 'English' }));
            messung.push(await variante(browser, { name: 'mobil-375-hell', breite: 375, hoehe: 812, theme: 'light', mobil: true, website: 'ryserboeden.ch', sprache: 'Schweizerdeutsch (in Erprobung)' }));
            messung.push(await variante(browser, { name: 'mobil-375-dunkel', breite: 375, hoehe: 812, theme: 'dark', mobil: true, website: 'swipay.ch', sprache: 'English' }));
            messung.push(await variante(browser, { name: 'desktop-1440-fehler', breite: 1440, hoehe: 900, theme: 'light', website: 'kafischnaps.ch', sprache: 'Deutsch', fehlerFall: true }));
            console.log(`\nCLS je Variante: ${messung.map((m) => m.cls.toFixed(4)).join(', ')} · Scan bis Karte: ${messung.map((m) => (m.scanDauer / 1000).toFixed(1) + ' s').join(', ')}`);
        }
    } finally {
        await browser.close();
        limitsZuruecksetzen();
    }
}

const fehlgeschlagen = ergebnisse.filter((e) => !e.ok);
console.log(`\n${ergebnisse.length - fehlgeschlagen.length}/${ergebnisse.length} Prüfungen bestanden. Screenshots: ${SCREENS}`);
process.exit(fehlgeschlagen.length ? 1 : 0);
