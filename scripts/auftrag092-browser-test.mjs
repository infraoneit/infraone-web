#!/usr/bin/env node
/**
 * auftrag092-browser-test.mjs — Browser-Test der KI-Telefonassistent-Demo.
 *
 * Voraussetzung: lokaler Server (npm run dev -- -H 0.0.0.0 -p 3000) mit
 * .env.local (DEMO_TOKEN, OPENAI_API_KEY). Lokal speichert die Demo im
 * Datei-Rückfall .demo-store/ (vor jedem Szenario werden die Zähler unter
 * .demo-store/limit gelöscht, damit die Limits den Test nicht sperren).
 *
 * Ein ATTRAPPEN-ORCHESTRATOR holt die Warteschlange ab (Bearer DEMO_TOKEN)
 * und spielt angenommen → waehlt → verbunden → beendet (bzw. fehler) durch.
 * Es wird NIE wirklich telefoniert. Gescannt werden nur öffentliche Seiten.
 *
 *   node scripts/auftrag092-browser-test.mjs
 *   BASE_URL=http://localhost:3000 PLAYWRIGHT_CHROMIUM="C:/…/chrome.exe" node scripts/auftrag092-browser-test.mjs
 *
 * Läuft daneben ein Server, den ein echter Orchestrator abfragt, den Test
 * gegen einen eigenen Server mit eigenem Speicher fahren, z. B.
 *   DEMO_STORE_DIR=<ordner> npx next start -p 3100   und
 *   DEMO_STORE_DIR=<ordner> BASE_URL=http://localhost:3100 node scripts/auftrag092-browser-test.mjs
 * (sonst könnte ein echter Orchestrator die Test-Aufträge abholen).
 *
 * Screenshots: ../auftraege/ergebnisse/A092-screens/
 */
import { chromium } from 'playwright-core';
import { readFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SCREENS = path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', 'A092-screens');
const SEITE = `${BASE}/ki-telefonassistent`;

const env = {};
for (const zeile of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = zeile.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
}
const TOKEN = env.DEMO_TOKEN;
if (!TOKEN) {
    console.error('DEMO_TOKEN fehlt in .env.local');
    process.exit(2);
}

mkdirSync(SCREENS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Prüfprotokoll                                                       */
/* ------------------------------------------------------------------ */
const ergebnisse = [];
function check(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);
}

/* ------------------------------------------------------------------ */
/* Attrappen-Orchestrator                                              */
/* ------------------------------------------------------------------ */
const ATTRAPPE_ZUSAMMENFASSUNG =
    'Testgespräch der Attrappe: Der Anrufer fragte nach den Öffnungszeiten und nach einem Termin. Der Assistent nannte die Zeiten aus der Website und nahm den Terminwunsch auf.';

function startAttrappe() {
    const gesehen = new Set();
    const protokoll = [];
    let modus = 'erfolg'; // oder 'fehler'
    let aktiv = true;
    const meldung = async (id, status, extra = {}) => {
        const r = await fetch(`${BASE}/api/demo/auftraege/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
            body: JSON.stringify({ status, grund: null, dauer_s: null, zusammenfassung: null, zeit: new Date().toISOString(), ...extra }),
        });
        protokoll.push({ id, status, http: r.status });
    };
    const ablauf = async (auftrag, m) => {
        await meldung(auftrag.id, 'angenommen');
        await sleep(2500);
        await meldung(auftrag.id, 'waehlt');
        await sleep(3500);
        if (m === 'fehler') {
            await meldung(auftrag.id, 'fehler', { grund: 'nicht_erreicht' });
            return;
        }
        await meldung(auftrag.id, 'verbunden');
        await sleep(5000);
        await meldung(auftrag.id, 'beendet', { dauer_s: 47, zusammenfassung: ATTRAPPE_ZUSAMMENFASSUNG });
    };
    (async () => {
        while (aktiv) {
            try {
                const r = await fetch(`${BASE}/api/demo/warteschlange`, { headers: { Authorization: `Bearer ${TOKEN}` } });
                if (r.ok) {
                    const { auftraege } = await r.json();
                    for (const a of auftraege) {
                        if (gesehen.has(a.id)) continue;
                        gesehen.add(a.id);
                        protokoll.push({ id: a.id, status: 'abgeholt', nummer: a.nummer, sprache: a.sprache, felder: Object.keys(a).join(','), profilFelder: Object.keys(a.profil).join(','), wissen: a.profil.wissen.length, logo: a.profil.logo_url, farben: a.profil.farben });
                        ablauf(a, modus).catch((e) => protokoll.push({ id: a.id, status: 'attrappe-fehler', fehler: String(e) }));
                    }
                }
            } catch {
                /* Server kurz weg */
            }
            await sleep(500);
        }
    })();
    return {
        protokoll,
        setzeModus: (m) => (modus = m),
        stopp: () => (aktiv = false),
    };
}

/* ------------------------------------------------------------------ */
/* Hilfen                                                              */
/* ------------------------------------------------------------------ */
const ERWARTETE_CHIPS = [
    'Website gelesen',
    'Unternehmensinfos erkannt',
    'Kontaktdaten gefunden',
    'Öffnungszeiten geprüft',
    'Leistungen erfasst',
    'Branding analysiert',
    'Wissen aufgebaut',
    'Assistent wird vorbereitet',
];

const STORE = process.env.DEMO_STORE_DIR ? path.resolve(process.env.DEMO_STORE_DIR) : path.join(ROOT, '.demo-store');

function limitsZuruecksetzen() {
    const dir = path.join(STORE, 'limit');
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}

async function neueSeite(browser, { breite, hoehe, theme, mobil = false }) {
    const ctx = await browser.newContext({
        viewport: { width: breite, height: hoehe },
        deviceScaleFactor: mobil ? 2 : 1,
        isMobile: mobil,
        hasTouch: mobil,
        reducedMotion: 'no-preference',
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

const screenshot = (page, name, voll = false) => page.screenshot({ path: path.join(SCREENS, name), fullPage: voll });

/** Ein kompletter Durchlauf: Scan → Karte → Nummer → Status → Abschluss. */
async function durchlauf(browser, attrappe, { name, breite, hoehe, theme, mobil, website, sprache, nummer, fehlerFall = false }) {
    limitsZuruecksetzen();
    attrappe.setzeModus(fehlerFall ? 'fehler' : 'erfolg');
    const { ctx, page, konsole } = await neueSeite(browser, { breite, hoehe, theme, mobil });
    const t0 = Date.now();
    await page.goto(SEITE, { waitUntil: 'networkidle' });
    const dunkel = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    check(`${name}: Theme ${theme}`, dunkel === (theme === 'dark'));
    await screenshot(page, `${name}-01-hero.png`);

    // Clientseitige Validierung der URL
    await page.click('button:has-text("Assistent erstellen")');
    const urlFehler = await page.locator('#ki-demo-url-fehler').textContent().catch(() => null);
    check(`${name}: leere URL wird abgefangen`, urlFehler?.includes('gültige Website-Adresse'), urlFehler);

    await page.fill('#ki-demo-url', website);
    await page.click('button:has-text("Assistent erstellen")');
    await page.locator('ul li:has-text("Website gelesen")').waitFor({ timeout: 15000 });
    await page.locator('ul li:has-text("Leistungen erfasst")').waitFor({ timeout: 15000 }).catch(() => undefined);
    await screenshot(page, `${name}-02-scan.png`);

    const karte = page.locator('article[aria-label]');
    await karte.waitFor({ timeout: 40000 });
    const scanDauer = Date.now() - t0;
    const chips = await page.locator('[aria-live="polite"] ul li').allTextContents();
    const chipsBereinigt = chips.map((c) => c.trim());
    const reihenfolgeOk = chipsBereinigt.every((c, i) => i === 0 || ERWARTETE_CHIPS.indexOf(c) > ERWARTETE_CHIPS.indexOf(chipsBereinigt[i - 1]));
    check(`${name}: Chips in Auftrags-Reihenfolge (${chipsBereinigt.length}/8)`, reihenfolgeOk && chipsBereinigt.length >= 6 && chipsBereinigt.every((c) => ERWARTETE_CHIPS.includes(c)), chipsBereinigt.join(' | '));
    check(`${name}: Karte nach ${Math.round(scanDauer / 100) / 10} s`, scanDauer < 30000);

    await page.waitForTimeout(800);
    const zuKarte = () => page.evaluate(() => {
        const a = document.querySelector('article[aria-label]');
        window.scrollTo(0, a.getBoundingClientRect().top + window.scrollY - (window.innerWidth >= 1024 ? 110 : 80));
    });
    await zuKarte();
    await page.waitForTimeout(300);
    await screenshot(page, `${name}-03-karte.png`);

    const kartenInfo = await page.evaluate(() => {
        const a = document.querySelector('article[aria-label]');
        const kopf = a.firstElementChild;
        const koerper = a.children[1];
        const [links, rechts] = koerper.children;
        const lr = links.getBoundingClientRect();
        const rr = rechts.getBoundingClientRect();
        const logo = a.querySelector('img');
        return {
            label: a.getAttribute('aria-label'),
            kopfHintergrund: getComputedStyle(kopf).backgroundImage,
            zweispaltig: Math.abs(lr.top - rr.top) < 2 && rr.left > lr.right - 1,
            gestapelt: rr.top >= lr.bottom - 1,
            logoVorhanden: !!logo,
            logoGeladen: !!logo && logo.complete && logo.naturalWidth > 0,
            name: a.querySelector('p')?.textContent,
            rolle: a.querySelectorAll('p')[1]?.textContent,
            faehigkeiten: [...koerper.querySelectorAll('ul li')].slice(0, 3).map((l) => l.textContent.trim()),
            ueberlauf: document.documentElement.scrollWidth - window.innerWidth,
        };
    });
    check(`${name}: Rolle «KI-Telefonassistent(in) von FIRMA»`, /^KI-Telefonassistent(in)? von .+/.test(kartenInfo.rolle || ''), kartenInfo.rolle);
    check(`${name}: drei Fähigkeiten`, kartenInfo.faehigkeiten.length === 3 && kartenInfo.faehigkeiten.every(Boolean), kartenInfo.faehigkeiten.join(' · '));
    const gruen = /rgb\(61, 150, 70\)|rgb\(76, 175, 80\)/;
    check(`${name}: Kartenkopf nicht InfraOne-Grün`, !gruen.test(kartenInfo.kopfHintergrund), kartenInfo.kopfHintergrund.slice(0, 120));
    if (breite >= 768) check(`${name}: Karte zweispaltig ab 768 px`, kartenInfo.zweispaltig);
    else check(`${name}: Karte mobil gestapelt`, kartenInfo.gestapelt);
    // Kein brauchbares Logo (z. B. nur 16-px-Favicon) → Karte zeigt die Initiale, nie ein kaputtes Bild
    check(`${name}: Logo über Proxy geladen oder bewusst weggelassen`, !kartenInfo.logoVorhanden || kartenInfo.logoGeladen, kartenInfo.logoVorhanden ? 'Logo sichtbar' : 'kein Logo ≥ 24 px auf der Website → Initiale');
    logosSichtbar.push(kartenInfo.logoGeladen);
    check(`${name}: kein horizontaler Überlauf`, kartenInfo.ueberlauf <= 0, `Überlauf ${kartenInfo.ueberlauf}px`);

    // Barrierefreiheit: zugängliche Namen der Sprachwahl und der Einwilligung
    const sprachNamen = [];
    for (const n of ['Schweizerdeutsch', 'Hochdeutsch', 'English']) sprachNamen.push(await page.getByRole('radio', { name: n, exact: true }).count());
    check(`${name}: Sprach-Radios mit zugänglichem Namen`, sprachNamen.every((c) => c === 1), `Schweizerdeutsch/Hochdeutsch/English: ${sprachNamen.join('/')}`);
    const einwName = await page.getByRole('checkbox', { name: /^Ich bin unter dieser Nummer erreichbar und möchte den Testanruf erhalten\. Es gelten die Datenschutzhinweise\.$/ }).count();
    check(`${name}: Einwilligungs-Checkbox mit zugänglichem Namen`, einwName === 1);

    // Formular-Validierung
    await page.fill('#ki-demo-nummer', '0900 123 456');
    await page.click('button:has-text("Jetzt KI-Anruf erhalten")');
    const fehler090 = await page.locator('form [role="alert"]').last().textContent().catch(() => '');
    check(`${name}: 0900-Nummer abgelehnt`, fehler090.includes('Mehrwert'), fehler090);
    await page.fill('#ki-demo-nummer', nummer);
    await page.click('button:has-text("Jetzt KI-Anruf erhalten")');
    const fehlerEinw = await page.locator('form [role="alert"]').last().textContent().catch(() => '');
    check(`${name}: Einwilligung ist Pflicht`, fehlerEinw.includes('bestätigen'), fehlerEinw);

    await page.locator(`label:has-text("${sprache}")`).click();
    await page.locator('input[type="checkbox"]').check();
    await page.click('button:has-text("Jetzt KI-Anruf erhalten")');

    // Statusfolge beobachten
    const gesehen = [];
    const ziel = fehlerFall ? 'Leider nicht erreicht' : 'Gespräch beendet – so lief es:';
    const statusTexte = ['Ihr Assistent wählt gleich …', 'Es klingelt bei Ihnen …', 'Gespräch läuft', 'Gespräch beendet – so lief es:', 'Leider nicht erreicht'];
    const ende = Date.now() + 45000;
    let gespraechsShot = false;
    while (Date.now() < ende) {
        const text = await page.locator('article[aria-label]').innerText();
        for (const s of statusTexte) if (text.includes(s) && !gesehen.includes(s)) gesehen.push(s);
        if (!gespraechsShot && text.includes('Gespräch läuft')) {
            await zuKarte();
            await screenshot(page, `${name}-04-gespraech.png`);
            gespraechsShot = true;
        }
        if (!gespraechsShot && fehlerFall && text.includes('Es klingelt bei Ihnen')) {
            await zuKarte();
            await screenshot(page, `${name}-04-klingelt.png`);
            gespraechsShot = true;
        }
        if (text.includes(ziel)) break;
        await page.waitForTimeout(400);
    }
    if (fehlerFall) {
        check(`${name}: Statusfolge bis Fehler`, gesehen.join(' > ') === 'Ihr Assistent wählt gleich … > Es klingelt bei Ihnen … > Leider nicht erreicht', gesehen.join(' > '));
        const formWieder = await page.locator('button:has-text("Jetzt KI-Anruf erhalten")').isVisible();
        check(`${name}: nach Fehler Formular wieder da`, formWieder);
        await page.waitForTimeout(500);
        await zuKarte();
        await screenshot(page, `${name}-05-fehler.png`);
    } else {
        check(`${name}: Statusfolge vollständig`, gesehen.join(' > ') === 'Ihr Assistent wählt gleich … > Es klingelt bei Ihnen … > Gespräch läuft > Gespräch beendet – so lief es:', gesehen.join(' > '));
        await page.waitForTimeout(900);
        const zusammenfassung = await page.locator('article[aria-label]').innerText();
        check(`${name}: Zusammenfassung angezeigt`, zusammenfassung.includes('Testgespräch der Attrappe') && /ihr gespräch/i.test(zusammenfassung) && zusammenfassung.includes('0:47 Min.'));
        const nach = await page.locator('text=Das war ein Assistent aus Ihrer Website – in einer Minute.').isVisible();
        check(`${name}: Text nach dem Gespräch`, nach);
        const link = page.locator('a:has-text("Erstgespräch vereinbaren")').first();
        const href = await link.getAttribute('href');
        check(`${name}: Erstgespräch-Link mit Betreff`, decodeURIComponent(href || '').startsWith('/kontakt?subject=KI-Telefonassistent für '), decodeURIComponent(href || ''));
        await zuKarte();
        await page.waitForTimeout(400);
        await screenshot(page, `${name}-05-ende.png`);
        // Ganzseitig: Scroll-Animationen (Reveal) aus, sonst sind Abschnitte ausserhalb des Viewports leer
        const stil = await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important}' });
        await screenshot(page, `${name}-06-ganze-seite.png`, true);
        await stil.evaluate((el) => el.remove());
        await link.click();
        await page.waitForURL(/\/kontakt/, { timeout: 15000 });
        await page.waitForTimeout(1500);
        const betreff = await page.locator('#subject').inputValue();
        check(`${name}: Kontaktformular Betreff vorbefüllt`, betreff.startsWith('KI-Telefonassistent für '), betreff);
    }
    check(`${name}: keine Konsolenfehler`, konsole.length === 0, konsole.slice(0, 3).join(' | '));
    await ctx.close();
}

/* ------------------------------------------------------------------ */
/* Ablauf                                                              */
/* ------------------------------------------------------------------ */
const logosSichtbar = [];
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const attrappe = startAttrappe();
try {
    // 0. SEO-Grundlagen und Texte
    {
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
        }));
        check('Titel wortgleich', seo.titel === 'KI-Telefonassistent auf Schweizerdeutsch – Demo-Anruf in einer Minute | InfraOne', seo.titel);
        check('Description wortgleich', seo.beschreibung === 'Der KI-Telefonassistent, der Schweizerdeutsch spricht: Website eingeben, Assistent entsteht, die KI ruft Sie an. Kostenlos testen, ohne Anmeldung. Für Praxen, Handwerk, KMU in der Schweiz.');
        check('Canonical', seo.canonical === 'https://infraone.ch/ki-telefonassistent', seo.canonical);
        check('OG-Bild', /\/og\/ki-telefonassistent\.png$/.test(seo.ogBild || ''), seo.ogBild);
        check('H1 wortgleich', seo.h1 === 'Erleben Sie Ihren KI-Telefonassistenten – in einer Minute', seo.h1);
        const h2Soll = ['So funktioniert der Testanruf', 'Warum Schweizerdeutsch den Unterschied macht', 'Was der Assistent im Alltag übernimmt', 'Für welche Betriebe', 'Datenschutz und Technik, ehrlich erklärt', 'Häufige Fragen', 'Bereit für Ihren eigenen Assistenten?'];
        check('H2 wortgleich und vollständig', h2Soll.every((h) => seo.h2.includes(h)), seo.h2.join(' | '));
        check('JSON-LD Service/FAQPage/BreadcrumbList/WebPage', ['Service', 'FAQPage', 'BreadcrumbList', 'WebPage'].every((t) => seo.typen.includes(t)), seo.typen.join(','));
        check('Platzhalter wortgleich', seo.platzhalter === 'Ihre Website, z. B. muster-ag.ch');
        check('Vertrauenszeile wortgleich', seo.vertrauen === 'Kostenlos · Ohne Anmeldung · Keine Werbeanrufe', seo.vertrauen);
        const dsTechnik = await page.evaluate(() => [...document.querySelectorAll('h2')].find((h) => h.textContent.trim() === 'Datenschutz und Technik, ehrlich erklärt')?.nextElementSibling?.textContent?.replace(/\s+/g, ' ').trim());
        check('Abschnitt «Datenschutz und Technik» wortgleich', dsTechnik === 'Die Telefonanlage und Ihre Gesprächsprotokolle laufen in der Schweiz auf Systemen von InfraOne. Für Spracherkennung und Sprachausgabe nutzen wir die KI-Schnittstellen von OpenAI; Gesprächsinhalte werden dort nicht zum Training verwendet. Ihre Nummer aus dem Testanruf verwenden wir für diesen Anruf und für eine Rückmeldung von uns, falls Sie Fragen haben – nicht für Werbung. Mitschnitte gibt es im Kundenbetrieb nur mit Einwilligung beider Seiten.', dsTechnik);
        check('keine Preise/Prozente im Inhalt', !seo.preise);
        check('kein ß', !seo.ss);

        // Navigation (Header-Untermenü erscheint beim Überfahren), Footer, Sitemap, llms
        await page.locator('header nav >> text=Cloud-').first().hover();
        await page.waitForTimeout(500);
        const imHeader = await page.locator('header a[href="/ki-telefonassistent"]').count();
        const imFooter = await page.locator('footer a[href="/ki-telefonassistent"]').count();
        check('Header (unter Cloud-Telefonie) und Footer verlinken /ki-telefonassistent', imHeader >= 1 && imFooter >= 1, `Header ${imHeader}, Footer ${imFooter}`);
        const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
        check('Sitemap enthält Seite', sitemap.includes('https://infraone.ch/ki-telefonassistent'));
        const llms = await (await fetch(`${BASE}/llms.txt`)).text();
        const llmsFull = await (await fetch(`${BASE}/llms-full.txt`)).text();
        check('llms.txt + llms-full.txt ergänzt', llms.includes('/ki-telefonassistent') && llmsFull.includes('/ki-telefonassistent'));

        // Kantenmessung (Layout-Regel) wie AUFTRAG-013
        await page.evaluate(async () => {
            for (let y = 0; y <= document.body.scrollHeight; y += 800) {
                window.scrollTo(0, y);
                await new Promise((r) => setTimeout(r, 50));
            }
            window.scrollTo(0, 0);
        });
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
                    const typo = k.tagName === 'P' || /text-|subtitle|opacity/.test(cls) || /max-w-/.test(cls) && k.tagName === 'P';
                    aus.push({ abw: Math.abs(r.left - links), typo, tag: k.tagName, cls: cls.slice(0, 60) });
                }
            }
            return aus;
        });
        const abweichend = kanten.filter((k) => !k.typo && k.abw > 1.1);
        check('Kanten /ki-telefonassistent: Strukturblöcke volle Containerbreite', abweichend.length === 0, abweichend.map((a) => `${a.tag} ${a.cls}`).join(' ;; ') || `${kanten.length} Blöcke geprüft`);

        // Datenschutz: Abschnitt Testanruf (wortgleich)
        await page.goto(`${BASE}/datenschutz`, { waitUntil: 'networkidle' });
        const ds = await page.evaluate(() => {
            const h = document.querySelector('#testanruf-ki-telefonassistent');
            return { h2: h?.textContent?.trim(), p: h?.nextElementSibling?.textContent?.replace(/\s+/g, ' ').trim(), danach: h?.nextElementSibling?.nextElementSibling?.textContent?.trim() };
        });
        const dsSoll = 'Wenn Sie auf der Seite «KI-Telefonassistent» eine Website-Adresse eingeben, rufen unsere Systeme die öffentlich erreichbaren Seiten dieser Website ab und erstellen daraus ein Profil (Firmenname, Kontaktangaben, Öffnungszeiten, Leistungen, Logo und Farben). Dieses Profil wird für höchstens zwei Stunden gespeichert und danach gelöscht. Geben Sie Ihre Telefonnummer ein und bestätigen den Testanruf, verwenden wir die Nummer für diesen Anruf. Zusammen mit einer Zusammenfassung und dem Gesprächsprotokoll erhält InfraOne sie als Hinweis auf Ihr Interesse, damit wir Rückfragen beantworten können; für Werbung verwenden wir sie nicht. Der Testanruf dauert höchstens drei Minuten. Die Telefonanlage und das Gesprächsprotokoll laufen auf Systemen von InfraOne in der Schweiz; für Spracherkennung und Sprachausgabe nutzen wir die Schnittstellen von OpenAI, wobei Gesprächsinhalte dort nicht zum Training von Modellen verwendet werden. Mitschnitte werden nicht erstellt. Pro Telefonnummer sind zwei Testanrufe am Tag möglich.';
        check('Datenschutz: H2 «Testanruf KI-Telefonassistent» vor den Schlussabschnitten', /^\d+\. Testanruf KI-Telefonassistent$/.test(ds.h2 || '') && /Datensicherheit/.test(ds.danach || ''), `${ds.h2} → danach «${ds.danach}»`);
        check('Datenschutz: Abschnittstext wortgleich', ds.p === dsSoll, ds.p);
        const stand = await page.evaluate(() => [...document.querySelectorAll('main p')].map((p) => p.textContent.trim()).find((t) => t.startsWith('Stand:')));
        check('Datenschutz: Stand Oktober 2026', stand === 'Stand: Oktober 2026', stand);

        // Teaser auf /cloud-telefonie und Startseite
        await page.goto(`${BASE}/cloud-telefonie`, { waitUntil: 'networkidle' });
        check('Teaser auf /cloud-telefonie', (await page.locator('main a[href="/ki-telefonassistent"]').count()) >= 1);
        await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
        check('Eintrag in der Leistungsübersicht der Startseite', (await page.locator('main a[href="/ki-telefonassistent"]').count()) >= 1);
        await ctx.close();
    }

    // 1. Desktop hell, Erfolg
    await durchlauf(browser, attrappe, { name: 'desktop-1440', breite: 1440, hoehe: 900, theme: 'light', website: 'zahnarztpraxisneuwiesen.ch', sprache: 'Schweizerdeutsch', nummer: '079 000 00 01' });
    // 2. Mobil hell, Erfolg, Hochdeutsch
    await durchlauf(browser, attrappe, { name: 'mobil-390', breite: 390, hoehe: 844, theme: 'light', mobil: true, website: 'https://elektro-tel.ch', sprache: 'Hochdeutsch', nummer: '+41 79 000 00 02' });
    // 3. Desktop dunkel, Fehlerpfad (nicht erreicht), Englisch
    await durchlauf(browser, attrappe, { name: 'desktop-dunkel', breite: 1440, hoehe: 900, theme: 'dark', website: 'swipay.ch', sprache: 'English', nummer: '079 000 00 03', fehlerFall: true });
    // 4. Mobil dunkel, Erfolg
    await durchlauf(browser, attrappe, { name: 'mobil-dunkel', breite: 390, hoehe: 844, theme: 'dark', mobil: true, website: 'infraone.ch', sprache: 'Schweizerdeutsch', nummer: '079 000 00 04' });

    check('Logo auf mindestens 3 von 4 Karten sichtbar', logosSichtbar.filter(Boolean).length >= 3, `${logosSichtbar.filter(Boolean).length}/4`);

    // Attrappe: Schnittstelle wie AUFTRAG-091
    await sleep(1500);
    const abgeholt = attrappe.protokoll.filter((p) => p.status === 'abgeholt');
    check('Attrappe: 4 Aufträge abgeholt', abgeholt.length === 4, abgeholt.map((a) => `${a.sprache}/${a.nummer}`).join(', '));
    check('Attrappe: Auftrag-Felder exakt', abgeholt.every((a) => a.felder === 'id,erstellt,nummer,sprache,profil'), abgeholt[0]?.felder);
    check('Attrappe: Profil-Felder exakt', abgeholt.every((a) => a.profilFelder === 'firma,website,assistent_name,branche,telefon,email,adresse,oeffnungszeiten_text,firma_text,faehigkeiten,wissen,logo_url,farben'), abgeholt[0]?.profilFelder);
    check('Attrappe: Sprachen dialekt_auto/hochdeutsch/englisch', ['dialekt_auto', 'hochdeutsch', 'englisch'].every((s) => abgeholt.some((a) => a.sprache === s)));
    check('Attrappe: Wissen 5–30 je Auftrag', abgeholt.every((a) => a.wissen >= 5 && a.wissen <= 30), abgeholt.map((a) => a.wissen).join(','));
    check('Attrappe: alle Statusmeldungen 200', attrappe.protokoll.filter((p) => p.http).every((p) => p.http === 200));

    // Datensparsamkeit: abgeschlossene Aufträge ohne Nummer und ohne Profil
    if (existsSync(path.join(STORE, 'auftrag'))) {
        const auftraege = readdirSync(path.join(STORE, 'auftrag')).map((f) => JSON.parse(readFileSync(path.join(STORE, 'auftrag', f), 'utf8')));
        const offen = auftraege.filter((a) => a.nummer !== null || a.profil !== null);
        check('Gespeicherte Aufträge: Nummer und Profil nach Abschluss entfernt', auftraege.length >= 4 && offen.length === 0, `${auftraege.length} Aufträge, ${offen.length} mit Nummer/Profil`);
    } else {
        check('Gespeicherte Aufträge prüfbar (Datei-Speicher)', false, `kein Ordner ${STORE}/auftrag`);
    }

    // Grenzen über die API (eigene IP)
    limitsZuruecksetzen();
    const scanAntworten = [];
    for (let i = 0; i < 4; i++) {
        const r = await fetch(`${BASE}/api/demo/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'localtest.me' }) });
        scanAntworten.push(r.status);
    }
    // Erwarteter Modus des (lokalen) Servers: DEMO_LIMITS_AUS aus der Prozess-Umgebung, sonst aus .env.local
    const limitsAus = (process.env.DEMO_LIMITS_AUS ?? env.DEMO_LIMITS_AUS) === '1';
    if (limitsAus) check('Limits aus (DEMO_LIMITS_AUS=1, lokal): 4. Scan je Stunde ohne 429', scanAntworten.join(',') === '422,422,422,422', scanAntworten.join(','));
    else check('Limit: 4. Scan je Stunde → 429', scanAntworten.join(',') === '422,422,422,429', scanAntworten.join(','));
    const ohneToken = await fetch(`${BASE}/api/demo/warteschlange`);
    check('Warteschlange ohne Token → 401', ohneToken.status === 401);
    limitsZuruecksetzen();
} finally {
    attrappe.stopp();
    await browser.close();
}

const fehlgeschlagen = ergebnisse.filter((e) => !e.ok);
console.log(`\n${ergebnisse.length - fehlgeschlagen.length}/${ergebnisse.length} Prüfungen bestanden. Screenshots: ${SCREENS}`);
process.exit(fehlgeschlagen.length ? 1 : 0);
