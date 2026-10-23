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
 * Screenshots: ../auftraege/ergebnisse/A095-screens/
 */
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// AUFTRAG-096: SCREENS_ORDNER=A096-screens/browser-test legt die Screenshots woanders ab (A-095-Belege bleiben)
const SCREENS = path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', process.env.SCREENS_ORDNER || 'A095-screens');
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
    const zustand = { start: 0, gesendet: null, ablauf: fehler ? 'fehler' : 'erfolg' };
    await page.route('**/api/demo/anruf', async (route) => {
        zustand.gesendet = JSON.parse(route.request().postData() || '{}');
        zustand.start = Date.now();
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'd-20261022-attrappebrowser01' }) });
    });
    await page.route('**/api/demo/auftraege/**', async (route) => {
        const t = Date.now() - zustand.start;
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
    check(`${name}: Rolle «KI-Telefonassistent(in) von FIRMA»`, !!karte.rolle, karte.rolle);
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

    // Sprachwahl + Barrierefreiheit
    const sprachNamen = [];
    for (const n of ['Schweizerdeutsch', 'Hochdeutsch', 'English']) sprachNamen.push(await page.getByRole('radio', { name: n, exact: true }).count());
    check(`${name}: Sprach-Radios mit zugänglichem Namen`, sprachNamen.every((c) => c === 1), sprachNamen.join('/'));
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
    check(`${name}: Begrüssung folgt der Sprachwahl (${sprache})`, sprache === 'English' ? zitatNeu.includes('Hello, this is') : sprache === 'Hochdeutsch' ? zitatNeu.includes('hier ist') : zitatNeu.includes('do isch'), zitatNeu.slice(0, 60));
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
    const profil = (await profilAntwort)?.profil;
    const weiblich = ['Lena', 'Mia', 'Laura', 'Sara', 'Anna', 'Lea', 'Nina', 'Julia', 'Elena', 'Sophie', 'Lara', 'Alina', 'Noemi', 'Selina', 'Jana', 'Livia', 'Lina', 'Leonie', 'Chiara', 'Elin'];
    check(
        `${name}: Profil hat stimme passend zum Namen (Schalter 0 → nur Frauennamen)`,
        !!profil && profil.stimme === 'weiblich' && weiblich.includes(profil.assistent_name) && abfang.gesendet && karte.rolle?.startsWith('KI-Telefonassistentin von '),
        profil ? `${profil.assistent_name}/${profil.stimme}` : 'kein Profil',
    );
    if (fehlerFall) {
        check(`${name}: Button-Folge bis Fehler (wortgleich)`, folge.join(' > ') === 'Wir rufen Sie gleich an … > Ihr Telefon klingelt … > Nochmals versuchen', folge.join(' > '));
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
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        ogBild: document.querySelector('meta[property="og:image"]')?.content,
        h1: document.querySelector('h1')?.textContent,
        h2: [...document.querySelectorAll('h2')].map((h) => h.textContent.trim()),
        typen: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)['@type']),
        platzhalter: document.querySelector('#ki-demo-url')?.placeholder,
        vertrauen: document.querySelector('#ki-demo-vertrauen')?.textContent,
        preise: /CHF|Fr\.\s?\d|\d+\s?%/.test(document.querySelector('main').innerText),
        ss: /ß/.test(document.body.innerText),
        belege: [...document.querySelectorAll('#ki-demo-vertrauen + div li')].map((l) => l.textContent.trim()),
        faqLink: !!document.querySelector('details a[href="/datenschutz#testanruf-ki-telefonassistent"]'),
    }));
    check('Titel wortgleich', seo.titel === 'KI-Telefonassistent auf Schweizerdeutsch – Demo-Anruf in einer Minute | InfraOne', seo.titel);
    check('Description wortgleich', seo.beschreibung === 'Der KI-Telefonassistent, der Schweizerdeutsch spricht: Website eingeben, Assistent entsteht, die KI ruft Sie an. Kostenlos testen, ohne Anmeldung. Für Praxen, Handwerk, KMU in der Schweiz.');
    check('Canonical', seo.canonical === 'https://infraone.ch/ki-telefonassistent', seo.canonical);
    check('OG-Bild', /\/og\/ki-telefonassistent\.png$/.test(seo.ogBild || ''), seo.ogBild);
    check('H1 wortgleich', seo.h1 === 'Erleben Sie Ihren KI-Telefonassistenten – in einer Minute', seo.h1);
    const h2Soll = ['So funktioniert der Testanruf', 'Warum Schweizerdeutsch den Unterschied macht', 'Was der Assistent im Alltag übernimmt', 'So läuft es bei Ihnen', 'Für welche Betriebe', 'Datenschutz und Technik, ehrlich erklärt', 'Häufige Fragen', 'Bereit für Ihren eigenen Assistenten?'];
    check('H2 vollständig (inkl. «So läuft es bei Ihnen»)', h2Soll.every((h) => seo.h2.includes(h)), seo.h2.join(' | '));
    check('JSON-LD Service/FAQPage/BreadcrumbList/WebPage', ['Service', 'FAQPage', 'BreadcrumbList', 'WebPage'].every((t) => seo.typen.includes(t)), seo.typen.join(','));
    check('Platzhalter wortgleich', seo.platzhalter === 'Ihre Website, z. B. muster-ag.ch');
    check('Vertrauenszeile wortgleich', seo.vertrauen === 'Kostenlos · Ohne Anmeldung · Keine Werbeanrufe', seo.vertrauen);
    check('Drei Mini-Belege', seo.belege.join(' | ') === 'Schweizerdeutsch, Hochdeutsch, Englisch | In einer Minute | Ihre Website als Wissen', seo.belege.join(' | '));
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
} else {
    const browser = await chromium.launch({ executablePath: CHROME, headless: true });
    try {
        const logoIndex = args.indexOf('--logos');
        const nur = args.includes('--nur') ? args[args.indexOf('--nur') + 1] : null;
        if (logoIndex >= 0) {
            const o = logoOptionen();
            await logoKarten(browser, o.sites, o);
        } else if (nur) {
            const v = {
                'desktop-1440-hell': { breite: 1440, hoehe: 900, theme: 'light', website: 'zahnarztpraxisneuwiesen.ch', sprache: 'Schweizerdeutsch' },
                'mobil-375-hell': { breite: 375, hoehe: 812, theme: 'light', mobil: true, website: 'ryserboeden.ch', sprache: 'Schweizerdeutsch' },
                'desktop-1440-dunkel': { breite: 1440, hoehe: 900, theme: 'dark', website: 'gmtec.ch', sprache: 'Hochdeutsch' },
                'mobil-375-dunkel': { breite: 375, hoehe: 812, theme: 'dark', mobil: true, website: 'swipay.ch', sprache: 'English' },
            }[nur];
            await variante(browser, { name: nur, ...v });
        } else {
            await seoPruefung(browser);
            const messung = [];
            messung.push(await variante(browser, { name: 'desktop-1440-hell', breite: 1440, hoehe: 900, theme: 'light', website: 'zahnarztpraxisneuwiesen.ch', sprache: 'Schweizerdeutsch' }));
            messung.push(await variante(browser, { name: 'desktop-1440-dunkel', breite: 1440, hoehe: 900, theme: 'dark', website: 'gmtec.ch', sprache: 'Hochdeutsch' }));
            messung.push(await variante(browser, { name: 'mobil-375-hell', breite: 375, hoehe: 812, theme: 'light', mobil: true, website: 'ryserboeden.ch', sprache: 'Schweizerdeutsch' }));
            messung.push(await variante(browser, { name: 'mobil-375-dunkel', breite: 375, hoehe: 812, theme: 'dark', mobil: true, website: 'swipay.ch', sprache: 'English' }));
            messung.push(await variante(browser, { name: 'desktop-1440-fehler', breite: 1440, hoehe: 900, theme: 'light', website: 'kafischnaps.ch', sprache: 'Hochdeutsch', fehlerFall: true }));
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
