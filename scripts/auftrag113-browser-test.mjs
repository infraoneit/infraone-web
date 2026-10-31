#!/usr/bin/env node
/**
 * auftrag113-browser-test.mjs (AUFTRAG-113) — Menü-Kompromiss, Kalender/SMS «in Entwicklung», Preise freigegeben.
 *
 * Gegen einen EIGENEN Server (Vorgabe http://localhost:3005, nie :3000), Build zuvor.
 * A) Desktop 1280: Leiste zeigt genau «Leistungen, KI-Telefonassistent, IT-Support, Cloud-Telefonie,
 *    Unternehmen» plus CTA; kein «Für wen»; KI-Knopf mit Badge «Neu». Dazu 1024 px: eine Zeile, ohne Überlappung.
 * B) Jedes Dropdown öffnen (Hover und Tastatur): Einträge und Pfade exakt wie AUFTRAG-113, Abschnitt 1;
 *    Breite ≤ 640 px, im Fenster; kein Schleier; Screens B-leistungen, B-ki, B-cloud, B-unternehmen.
 * C) Mobil 375: Akkordeon mit den vier Gruppen + IT-Support in der Reihenfolge der Leiste; KI-Badge;
 *    keine Regionen; Screens C-mobil-zu, C-mobil-ki-offen.
 * D) Alle Header- und Footer-Links → HTTP 200 (Weiterleitungen gefolgt), Anker vorhanden.
 * E) Regionen: alle URLs aus /sitemap.xml laden, interne Links sammeln, für jede der 24 Regionsseiten
 *    mindestens einen Link von einer Nicht-Regionsseite nachweisen (Liste im Ergebnis-JSON).
 * F) Kalender/SMS: Badge «In Entwicklung, kommt bald» auf /anwendungen/terminbuchung, /preise und
 *    /vergleich (hell und dunkel lesbar); im ganzen Bereich /ki-telefonassistent kein Satz mehr, der den
 *    Kalendereintrag oder die SMS als verfügbar behauptet (Text-Suche «trägt … ein» u. a. ohne Hinweis).
 * G) /ki-telefonassistent/preise ohne noindex, ohne Entwurfsband, in der Sitemap; Beträge unverändert.
 *
 * Nachgeführt in AUFTRAG-114 (31.10.2026): Die SMS-Bestätigung funktioniert bereits (Inhaber) und ist
 * wieder als verfügbar beschrieben; nur der Kalendereintrag bleibt «in Entwicklung». Darum
 * - F: Satz KALENDER_SATZ statt KALENDER_SMS_SATZ (in-entwicklung.ts, wortgleich aus AUFTRAG-114);
 * - F: die Text-Suche prüft nur noch Behauptungen zum Kalendereintrag; die drei SMS-Muster
 *   («bestätigt per SMS», «erhält … SMS», «SMS an Herrn/Frau») entfallen, weil die SMS verfügbar ist
 *   (die Gegenprüfung «SMS nie mit Badge/in Entwicklung» steht in auftrag114-einheit-test.mjs und
 *   auftrag114-browser-test.mjs).
 * Alles andere unverändert.
 *
 * Sicherheit: Alle Aufrufe auf /api/demo/** werden im Browser abgefangen (418) — kein Scan, kein Anruf.
 *
 *   $env:BASE_URL='http://localhost:3005'; $env:SCREENS_DIR='…\A113-screens'; node scripts/auftrag113-browser-test.mjs
 *
 * Node ≥ 22.18 (Type-Stripping für die .ts-Quellen).
 */
import { chromium } from 'playwright-core';
import { registerHooks } from 'node:module';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
const { PREISE_FREIGEGEBEN, PAKETE, EINRICHTUNG_EINMALIG, PREIS_ZUSATZMINUTE } = await import(pathToFileURL(path.join(ROOT, 'src/lib/ki-telefonassistent-preise.ts')).href);
// AUFTRAG-114: KALENDER_SATZ ersetzt KALENDER_SMS_SATZ
const { IN_ENTWICKLUNG, KALENDER_SATZ } = await import(pathToFileURL(path.join(ROOT, 'src/lib/in-entwicklung.ts')).href);

const BASE = (process.env.BASE_URL || 'http://localhost:3005').replace(/\/$/, '');
if (/:3000\b/.test(BASE)) {
    console.error('Port 3000 gehört dem Inhaber (Testlink) — bitte den eigenen Server auf :3005 verwenden.');
    process.exit(2);
}
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DOMAIN = 'https://infraone.ch';

function ergebnisOrdner() {
    let d = ROOT;
    for (let i = 0; i < 8; i++) {
        if (existsSync(path.join(d, 'auftraege', 'ergebnisse'))) return path.join(d, 'auftraege', 'ergebnisse');
        d = path.dirname(d);
    }
    return path.join(ROOT, 'auftraege-ergebnisse');
}
const SCREENS = process.env.SCREENS_DIR || path.join(ergebnisOrdner(), 'A113-screens');
mkdirSync(SCREENS, { recursive: true });

const ergebnisse = [];
function check(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail: String(detail).slice(0, 800) });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);
}
const protokoll = { zeit: new Date().toISOString(), basis: BASE };

/* ------------------------------------------------------------------ */
/* Soll wortgleich aus AUFTRAG-113, Abschnitt 1                         */
/* ------------------------------------------------------------------ */
const LEISTE = ['Leistungen', 'KI-Telefonassistent', 'IT-Support', 'Cloud-Telefonie', 'Unternehmen'];
const SOLL = {
    leistungen: {
        spalten: ['IT', 'Kommunikation & Digital'],
        links: [
            ['IT-Support', '/it-support'],
            ['IT-Systeme & Netzwerke', '/it-netzwerke'],
            ['IT-Sicherheit', '/it-sicherheit'],
            ['Microsoft 365', '/microsoft-365'],
            ['WLAN', '/wlan'],
            ['Videoüberwachung', '/videoueberwachung'],
            // Nachtrag AUFTRAG-113: «Telefonie & Kommunikation» (/telefonie, nur Weiterleitung) entfällt
            ['Cloud-Telefonie', '/cloud-telefonie'],
            ['KI-Telefonassistent', '/ki-telefonassistent'],
            ['Webdesign', '/webdesign'],
            ['Digital Signage', '/digital-signage'],
            ['KI & Software-Entwicklung', '/software-entwicklung'],
            ['Alle Leistungen im Überblick', '/leistungen'],
        ],
    },
    ki: {
        spalten: ['Produkt', 'Mehr'],
        links: [
            ['Übersicht und Live-Test', '/ki-telefonassistent'],
            ['Funktionen', '/ki-telefonassistent/funktionen'],
            ['So funktioniert es', '/ki-telefonassistent/so-funktioniert-es'],
            ['Schweizerdeutsch', '/ki-telefonassistent/schweizerdeutsch'],
            ['Preise', '/ki-telefonassistent/preise'],
            ['Anwendungen', '/ki-telefonassistent/anwendungen'],
            ['Branchen', '/ki-telefonassistent/branchen'],
            ['Sicherheit und Datenschutz', '/ki-telefonassistent/sicherheit-datenschutz'],
            ['Häufige Fragen', '/ki-telefonassistent/faq'],
            ['KI-Anruf testen', '/ki-telefonassistent'],
        ],
    },
    cloud: {
        spalten: [],
        links: [
            ['Cloud-Telefonie im Überblick', '/cloud-telefonie'],
            ['Peoplefone vPBX', '/cloud-telefonie#peoplefone'],
            ['3CX', '/cloud-telefonie/3cx'],
            ['Microsoft Teams', '/cloud-telefonie/ms-teams'],
            ['Yeastar', '/cloud-telefonie/yeastar'],
        ],
    },
    unternehmen: {
        spalten: [],
        links: [
            ['Über uns', '/unternehmen'],
            ['Partner', '/partner'],
            ['Blog', '/blog'],
            ['Kontakt', '/kontakt'],
        ],
    },
};
/** Beträge wie vor AUFTRAG-113 (Zahlen dürfen sich nicht ändern) */
const BETRAEGE_VORHER = { pakete: [[49, 100], [149, 500], [299, 1500], [null, null]], einrichtung: 490, zusatzminute: 0.45 };

/* ------------------------------------------------------------------ */
/* Hilfen                                                              */
/* ------------------------------------------------------------------ */
const browser = await chromium.launch({ executablePath: CHROME, headless: true });

async function neueSeite(viewport, { theme = 'light', mobil = false } = {}) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobil ? 2 : 1, isMobile: mobil, hasTouch: mobil, locale: 'de-CH', reducedMotion: 'reduce' });
    await ctx.addInitScript((t) => {
        try {
            localStorage.setItem('theme', t);
        } catch {
            /* egal */
        }
    }, theme);
    await ctx.route('**/api/demo/**', (route) => route.fulfill({ status: 418, contentType: 'application/json', body: '{"fehler":"A113-Test: Demo-API gesperrt"}' }));
    const page = await ctx.newPage();
    const fehler = [];
    page.on('pageerror', (e) => fehler.push('pageerror: ' + e.message));
    page.on('console', (m) => {
        if (m.type() !== 'error') return;
        if (/api\/demo|418|Failed to load resource/i.test(m.text())) return; // gewollt gesperrte Demo-API
        fehler.push(m.text());
    });
    return { ctx, page, fehler };
}

async function lade(page, pfad) {
    const r = await page.goto(`${BASE}${pfad}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(300);
    return r;
}

/** Desktop-Leiste (nicht die mobile Navigation im Overlay) */
const DESKTOP_NAV = `(() => [...document.querySelectorAll('header nav[aria-label="Hauptnavigation"]')].find((n) => !n.closest('#nav-mobil')))()`;

/** Einträge eines Dropdowns: sichtbarer Text ohne Badge, href */
const eintraege = (page, id) =>
    page.$$eval(`#nav-panel-${id} a`, (as) =>
        as.map((a) => {
            const k = a.cloneNode(true);
            k.querySelectorAll('[data-badge]').forEach((b) => b.remove());
            return [k.textContent.replace(/\s+/g, ' ').trim(), a.getAttribute('href'), !!a.querySelector('[data-badge="neu"]')];
        }),
    );

const panelZustand = (page, id) =>
    page.evaluate((id) => {
        const p = document.getElementById(`nav-panel-${id}`);
        const k = document.getElementById(`nav-knopf-${id}`);
        const s = getComputedStyle(p);
        const box = (p.firstElementChild ?? p).getBoundingClientRect();
        return {
            expanded: k?.getAttribute('aria-expanded'),
            offen: p.getAttribute('data-offen'),
            sichtbar: s.visibility === 'visible' && Number(s.opacity) > 0.98,
            breite: Math.round(box.width),
            links: Math.round(box.left),
            rechts: Math.round(box.right),
            oben: Math.round(box.top),
            unten: Math.round(box.bottom),
            fenster: window.innerWidth,
            spalten: [...p.querySelectorAll('[id^="nav-gruppe-"]')].map((g) => ({ titel: g.textContent.trim(), x: Math.round(g.getBoundingClientRect().left) })),
        };
    }, id);

/** Schleier/Abdunkelung: sichtbare, fixierte Fläche über fast das ganze Fenster (ausser Header/Overlay) */
const schleier = (page) =>
    page.evaluate(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const flaechen = [...document.querySelectorAll('body *')].filter((el) => {
            const s = getComputedStyle(el);
            if (s.position !== 'fixed' || s.visibility !== 'visible' || Number(s.opacity) < 0.01 || s.display === 'none') return false;
            const r = el.getBoundingClientRect();
            return r.width >= w * 0.9 && r.height >= h * 0.6;
        });
        return { flaechen: flaechen.map((el) => `${el.tagName}.${String(el.className).slice(0, 60)}`), klasse: document.querySelectorAll('[class*="schleier"]').length };
    });

function kontrast(fg, bg) {
    const lum = (c) => {
        const [r, g, b] = c.map((v) => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
}

async function hole(url) {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'InfraOne-A113-Test' } });
    return { status: r.status, url: r.url, html: await r.text() };
}

function dekodiere(s) {
    return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
}
const interneLinks = (html) => [...html.matchAll(/<a[^>]*href="(\/[^"]*)"/gi)].map((m) => dekodiere(m[1])).filter((h) => !h.startsWith('//'));

try {
    /* ---------------- A: Leiste Desktop 1280 ---------------- */
    {
        const { ctx, page, fehler } = await neueSeite({ width: 1280, height: 800 });
        await lade(page, '/');
        const leiste = await page.evaluate(`(() => {
            const nav = ${DESKTOP_NAV};
            const lis = [...nav.querySelectorAll(':scope > ul > li')];
            return {
                daten: lis.map((li) => li.getAttribute('data-leiste')),
                // innerText respektiert die Kurz-/Langform je Breite; Badge-Text abziehen
                sichtbar: lis.map((li) => {
                    const z = li.querySelector(':scope > button, :scope > a, :scope > div > a');
                    const badge = z.querySelector('[data-badge]')?.innerText ?? '';
                    return z.innerText.replace(badge, '').replace(/\\s+/g, ' ').trim();
                }),
                navText: nav.innerText,
                fuerWen: !!document.getElementById('nav-knopf-fuer-wen') || !!document.getElementById('nav-panel-fuer-wen') || !!document.getElementById('nav-mobil-fuer-wen'),
                kiBadge: (() => { const b = document.querySelector('#nav-knopf-ki [data-badge="neu"]'); return b ? { text: b.textContent.trim(), sichtbar: b.offsetParent !== null } : null; })(),
                cta: (() => { const a = document.querySelector('header a[aria-label="Kostenloses Erstgespräch"]'); return a ? { href: a.getAttribute('href'), text: a.innerText.trim(), sichtbar: a.offsetParent !== null } : null; })(),
                cloudLink: document.getElementById('nav-link-cloud')?.getAttribute('href') ?? null,
            };
        })()`);
        check('A: Leiste zeigt genau «Leistungen, KI-Telefonassistent, IT-Support, Cloud-Telefonie, Unternehmen»', JSON.stringify(leiste.sichtbar) === JSON.stringify(LEISTE) && JSON.stringify(leiste.daten) === JSON.stringify(LEISTE), leiste.sichtbar.join(' | '));
        check('A: CTA «Kostenloses Erstgespräch» → /kontakt sichtbar', leiste.cta?.sichtbar && leiste.cta.href === '/kontakt' && leiste.cta.text === 'Kostenloses Erstgespräch', JSON.stringify(leiste.cta));
        check('A: kein «Für wen» (weder Text noch Knopf noch Panel)', !/Für wen/i.test(leiste.navText) && !leiste.fuerWen, leiste.navText.replace(/\s+/g, ' '));
        check('A: KI-Knopf mit Badge «Neu» (sichtbar)', leiste.kiBadge?.text === 'Neu' && leiste.kiBadge.sichtbar, JSON.stringify(leiste.kiBadge));
        check('A: Leistenknopf «Cloud-Telefonie» bleibt Link auf /cloud-telefonie (wie live)', leiste.cloudLink === '/cloud-telefonie', leiste.cloudLink);
        await page.locator('header').screenshot({ path: path.join(SCREENS, 'A-leiste-1280.png') });
        check('A: keine Konsolenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
        protokoll.leiste = leiste.sichtbar;
        await ctx.close();
    }
    for (const breite of [1024, 1280, 1440]) {
        const { ctx, page } = await neueSeite({ width: breite, height: 768 });
        await lade(page, '/');
        const m = await page.evaluate(`(() => {
            const nav = ${DESKTOP_NAV};
            const header = document.querySelector('header');
            const logo = header.querySelector('a[href="/"]').getBoundingClientRect();
            const aktionen = nav.nextElementSibling.getBoundingClientRect();
            const n = nav.getBoundingClientRect();
            const lis = [...nav.querySelectorAll(':scope > ul > li')];
            const ziele = [...nav.querySelectorAll(':scope > ul > li > button, :scope > ul > li > a, :scope > ul > li > div > a')];
            return {
                logoRechts: Math.round(logo.right), navLinks: Math.round(n.left), navRechts: Math.round(n.right), aktionenLinks: Math.round(aktionen.left),
                zeilen: new Set(lis.map((li) => Math.round(li.getBoundingClientRect().top))).size,
                einzeilig: ziele.every((z) => Math.round(z.getBoundingClientRect().height) === 40 && z.scrollWidth <= z.clientWidth + 1),
                scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth,
            };
        })()`);
        check(`A: ${breite} px — Leiste eine Zeile, Abstände zu Logo und Aktionen ≥ 16 px, kein waagrechtes Scrollen`, m.zeilen === 1 && m.einzeilig && m.navLinks - m.logoRechts >= 16 && m.aktionenLinks - m.navRechts >= 16 && m.scroll <= m.client, JSON.stringify(m));
        if (breite === 1024) await page.locator('header').screenshot({ path: path.join(SCREENS, 'A-leiste-1024.png') });
        await ctx.close();
    }

    /* ---------------- B: Dropdowns (Hover und Tastatur) ---------------- */
    {
        const { ctx, page, fehler } = await neueSeite({ width: 1280, height: 800 });
        await lade(page, '/');
        protokoll.dropdowns = {};
        for (const id of ['leistungen', 'ki', 'cloud', 'unternehmen']) {
            const soll = SOLL[id];
            // Hover (beim Split-Knopf «Cloud-Telefonie» auf den Link selbst)
            await page.mouse.move(640, 600);
            await page.waitForTimeout(350);
            await page.hover(id === 'cloud' ? '#nav-link-cloud' : `#nav-knopf-${id}`);
            await page.waitForTimeout(450);
            const z = await panelZustand(page, id);
            const ist = await eintraege(page, id);
            const s = await schleier(page);
            check(`B ${id}: Hover öffnet (aria-expanded, sichtbar)`, z.expanded === 'true' && z.offen === 'true' && z.sichtbar, JSON.stringify(z));
            check(`B ${id}: Einträge und Pfade exakt wie Abschnitt 1 (${soll.links.length})`, JSON.stringify(ist.map(([t, h]) => [t, h])) === JSON.stringify(soll.links), ist.map(([t, h]) => `${t}=${h}`).join(' | '));
            if (soll.spalten.length) {
                const xs = new Set(z.spalten.map((x) => x.x));
                check(`B ${id}: zwei Spalten «${soll.spalten.join('» und «')}»`, JSON.stringify(z.spalten.map((x) => x.titel)) === JSON.stringify(soll.spalten) && xs.size === 2, JSON.stringify(z.spalten));
            } else {
                check(`B ${id}: eine Spalte ohne Spaltentitel`, z.spalten.length === 0, JSON.stringify(z.spalten));
            }
            check(`B ${id}: Breite ≤ 640 px, unter dem Knopf, im Fenster`, z.breite <= 640 && z.links >= 0 && z.rechts <= z.fenster && z.oben >= 60 && z.oben <= 100 && z.unten <= 800, `${z.breite} px, ${z.links}–${z.rechts} von ${z.fenster}, oben ${z.oben}`);
            check(`B ${id}: kein Schleier (keine Abdunkelung der Seite)`, s.flaechen.length === 0 && s.klasse === 0, JSON.stringify(s));
            if (id === 'leistungen') check('B leistungen: Badge «Neu» nur beim KI-Telefonassistenten', ist.filter(([, , b]) => b).map(([t]) => t).join() === 'KI-Telefonassistent');
            // Nachtrag AUFTRAG-113: /telefonie (nur Weiterleitung) nicht mehr im Dropdown, Spalte «Kommunikation & Digital» mit fünf Einträgen
            if (id === 'leistungen') check('B leistungen: «Telefonie & Kommunikation» (/telefonie) entfällt (Nachtrag), 6 + 5 Einträge', !ist.some(([t, h]) => h === '/telefonie' || t === 'Telefonie & Kommunikation') && ist.length === 12, `${ist.length} Links inkl. Fusszeile`);
            if (id === 'ki') {
                const knopf = await page.$eval('#nav-panel-ki [data-ki-anruf-testen]', (a) => ({ hoehe: Math.round(a.getBoundingClientRect().height), breite: Math.round(a.getBoundingClientRect().width), text: a.innerText.trim() }));
                check('B ki: Fusszeile «KI-Anruf testen» als schmaler Knopf (keine Karte)', knopf.text === 'KI-Anruf testen' && knopf.hoehe <= 40 && knopf.breite <= 240, JSON.stringify(knopf));
            }
            await page.screenshot({ path: path.join(SCREENS, `B-${id}.png`) });
            protokoll.dropdowns[id] = { zustand: z, eintraege: ist };
            // Verlassen schliesst
            await page.mouse.move(640, 760, { steps: 4 });
            await page.waitForTimeout(500);
            check(`B ${id}: Verlassen mit der Maus schliesst`, (await panelZustand(page, id)).expanded === 'false');

            // Tastatur: Enter öffnet, Tab ins Dropdown, Escape schliesst mit Fokus zurück, Pfeil runter auf den ersten Link
            await page.focus(`#nav-knopf-${id}`);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(250);
            const auf = await panelZustand(page, id);
            await page.keyboard.press('Tab');
            const imPanel = await page.evaluate((id) => document.activeElement?.closest(`#nav-panel-${id}`) !== null, id);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(250);
            const zu = await panelZustand(page, id);
            const fokus = await page.evaluate(() => document.activeElement?.id);
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(250);
            const pfeil = await page.evaluate((id) => ({ imPanel: document.activeElement?.closest(`#nav-panel-${id}`) !== null, text: document.activeElement?.textContent?.replace(/\s+/g, ' ').trim(), href: document.activeElement?.getAttribute('href') }), id);
            check(
                `B ${id}: Tastatur — Enter öffnet, Tab ins Dropdown, Escape schliesst (Fokus zurück), Pfeil runter auf den ersten Link`,
                auf.expanded === 'true' && auf.sichtbar && imPanel && zu.expanded === 'false' && fokus === `nav-knopf-${id}` && pfeil.imPanel && pfeil.href === soll.links[0][1],
                JSON.stringify({ auf: auf.expanded, imPanel, zu: zu.expanded, fokus, pfeil }),
            );
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);
        }
        // Tab aus dem letzten Link verlässt das Dropdown und schliesst es (keine Fokusfalle)
        await page.focus('#nav-knopf-unternehmen');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
        let n = 0;
        while (n < 10 && (n === 0 || (await page.evaluate(() => !!document.activeElement?.closest('#nav-panel-unternehmen'))))) {
            await page.keyboard.press('Tab');
            n++;
        }
        await page.waitForTimeout(250);
        check('B: Tab aus dem Dropdown schliesst es (keine Fokusfalle)', (await panelZustand(page, 'unternehmen')).expanded === 'false', `${n} Tabs`);
        check('B: keine Konsolenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
        await ctx.close();
    }

    /* ---------------- C: Mobil 375 ---------------- */
    {
        const { ctx, page, fehler } = await neueSeite({ width: 375, height: 812 }, { mobil: true });
        await lade(page, '/');
        await page.tap('#nav-mobil-knopf');
        await page.waitForTimeout(400);
        const m = await page.evaluate(() => {
            const nav = document.querySelector('#nav-mobil nav[aria-label="Hauptnavigation"]');
            const lis = [...nav.querySelectorAll(':scope > ul > li')];
            return {
                offen: document.getElementById('nav-mobil').getAttribute('data-offen'),
                eintraege: lis.map((li) => {
                    const z = li.querySelector(':scope > button, :scope > a');
                    const badge = z.querySelector('[data-badge]')?.innerText ?? '';
                    return { text: z.innerText.replace(badge, '').replace(/\s+/g, ' ').trim(), art: z.tagName, badge: !!z.querySelector('[data-badge="neu"]'), hoehe: Math.round(z.getBoundingClientRect().height) };
                }),
                regionen: [...document.querySelectorAll('#nav-mobil a')].map((a) => a.getAttribute('href')).filter((h) => /^\/(it-support|cloud-telefonie|webdesign)\/(?!3cx|ms-teams|yeastar)[a-z-]+$/.test(h)),
                fuerWen: /Für wen/i.test(nav.innerText),
                aufgeklappt: [...nav.querySelectorAll('button[aria-expanded="true"]')].length,
                scroll: document.documentElement.scrollWidth,
                client: document.documentElement.clientWidth,
            };
        });
        const texte = m.eintraege.map((e) => e.text);
        check('C: Akkordeon in der Reihenfolge der Leiste (Leistungen, KI-Telefonassistent, IT-Support, Cloud-Telefonie, Unternehmen)', m.offen === 'true' && JSON.stringify(texte) === JSON.stringify(LEISTE), texte.join(' | '));
        check('C: vier Gruppen als Akkordeon, IT-Support als Direktlink', m.eintraege.map((e) => e.art).join() === 'BUTTON,BUTTON,A,BUTTON,BUTTON' && m.aufgeklappt === 0, m.eintraege.map((e) => e.art).join());
        check('C: KI-Gruppe mit Badge «Neu» (nur dort)', m.eintraege.filter((e) => e.badge).map((e) => e.text).join() === 'KI-Telefonassistent');
        check('C: kein «Für wen», keine Regionen im mobilen Menü', !m.fuerWen && m.regionen.length === 0, m.regionen.join(', '));
        check('C: Touchziele ≥ 44 px, kein waagrechtes Scrollen', m.eintraege.every((e) => e.hoehe >= 44) && m.scroll <= m.client, JSON.stringify(m.eintraege.map((e) => e.hoehe)));
        await page.screenshot({ path: path.join(SCREENS, 'C-mobil-zu.png') });
        await page.tap('#nav-mobil-knopf-ki');
        await page.waitForTimeout(450);
        const ki = await page.evaluate(() => {
            const box = document.getElementById('nav-mobil-ki');
            return {
                offen: box.getAttribute('data-offen'),
                links: [...box.querySelectorAll('a')].filter((a) => getComputedStyle(a).visibility === 'visible').map((a) => [a.textContent.replace(/\s+/g, ' ').trim(), a.getAttribute('href'), Math.round(a.getBoundingClientRect().height)]),
                gruppen: [...box.querySelectorAll('[id^="nav-mobil-gruppe-"]')].map((g) => g.textContent.trim()),
            };
        });
        const kiSoll = SOLL.ki.links.slice(0, 9);
        check('C: KI-Gruppe aufgeklappt mit «Produkt» und «Mehr», Einträge und Pfade wie Desktop', ki.offen === 'true' && JSON.stringify(ki.gruppen) === JSON.stringify(SOLL.ki.spalten) && JSON.stringify(ki.links.map(([t, h]) => [t, h])) === JSON.stringify(kiSoll) && ki.links.every(([, , h]) => h >= 44), ki.links.map(([t, h]) => `${t}=${h}`).join(' | '));
        await page.screenshot({ path: path.join(SCREENS, 'C-mobil-ki-offen.png') });
        // CTA unten wie bisher
        const cta = await page.evaluate(() => [...document.querySelectorAll('#nav-mobil a')].filter((a) => a.getAttribute('href') === '/kontakt').map((a) => a.textContent.trim()));
        check('C: CTA «Kostenloses Erstgespräch» unten wie bisher', cta.includes('Kostenloses Erstgespräch'), cta.join(' | '));
        check('C: keine Konsolenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
        await ctx.close();
    }

    /* ---------------- D: Header- und Footer-Links → 200 ---------------- */
    {
        const html = (await hole(`${BASE}/`)).html;
        const kopf = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
        const fuss = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));
        const kopfLinks = [...new Set(interneLinks(kopf))];
        const fussLinks = [...new Set(interneLinks(fuss))];
        const alle = [...new Set([...kopfLinks, ...fussLinks])];
        const status = {};
        const anker = [];
        const cache = new Map();
        for (const href of alle) {
            const [p, a] = href.split('#');
            const pfad = p || '/';
            if (!cache.has(pfad)) cache.set(pfad, await hole(`${BASE}${pfad}`));
            const r = cache.get(pfad);
            status[href] = r.url !== `${BASE}${pfad}` ? `${r.status} (über ${new URL(r.url).pathname})` : r.status;
            if (a && !new RegExp(`id="${a}"`).test(r.html)) anker.push(href);
        }
        const kaputt = Object.entries(status).filter(([, s]) => !String(s).startsWith('200'));
        check(`D: alle ${alle.length} Header- und Footer-Links → HTTP 200 (Weiterleitungen gefolgt)`, kaputt.length === 0 && alle.length > 30, kaputt.map(([h, s]) => `${h} → ${s}`).join(', ') || `Header ${kopfLinks.length}, Footer ${fussLinks.length}`);
        check('D: Anker der Header-Links vorhanden (#peoplefone)', anker.length === 0 && kopfLinks.includes('/cloud-telefonie#peoplefone'), anker.join(', '));
        const sollKopf = [...SOLL.leistungen.links, ...SOLL.ki.links, ...SOLL.cloud.links, ...SOLL.unternehmen.links].map(([, h]) => h);
        check('D: Server-HTML des Headers enthält alle Menü-Links (crawlbar ohne JavaScript)', sollKopf.every((h) => kopfLinks.includes(h)) && kopfLinks.includes('/it-support') && kopfLinks.includes('/kontakt'), sollKopf.filter((h) => !kopfLinks.includes(h)).join(', '));
        protokoll.links = { header: kopfLinks, footer: fussLinks, status };
    }

    /* ---------------- E: Regionen ---------------- */
    {
        const regionen = Object.entries({ '/it-support': 'it-support-regions', '/cloud-telefonie': 'cloud-telefonie-regions', '/webdesign': 'webdesign-regions' }).flatMap(([basis, ordner]) =>
            readdirSync(path.join(ROOT, 'content', 'leistungen', ordner))
                .filter((f) => f.endsWith('.json'))
                .map((f) => `${basis}/${f.replace(/\.json$/, '')}`),
        );
        const istRegion = new Set(regionen);
        const sitemap = (await hole(`${BASE}/sitemap.xml`)).html;
        const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
        const quellen = new Map(regionen.map((r) => [r, new Set()]));
        const kopfRegionen = new Set();
        let geladen = 0;
        const fehlerSeiten = [];
        for (const u of urls) {
            const pfad = new URL(u).pathname.replace(/\/$/, '') || '/';
            const r = await hole(`${BASE}${pfad}`);
            if (r.status !== 200) {
                fehlerSeiten.push(`${pfad} ${r.status}`);
                continue;
            }
            geladen++;
            const kopf = r.html.slice(r.html.indexOf('<header'), r.html.indexOf('</header>'));
            for (const h of interneLinks(kopf)) if (istRegion.has(h.split('#')[0])) kopfRegionen.add(h);
            if (istRegion.has(pfad)) continue; // nur Nicht-Regionsseiten zählen
            for (const h of interneLinks(r.html)) {
                const ziel = h.split('#')[0].replace(/\/$/, '');
                if (quellen.has(ziel)) quellen.get(ziel).add(pfad);
            }
        }
        const ohne = [...quellen].filter(([, q]) => q.size === 0).map(([r]) => r);
        check(`E: Sitemap geladen (${geladen}/${urls.length} Seiten mit 200)`, fehlerSeiten.length === 0 && geladen === urls.length, fehlerSeiten.join(', '));
        check('E: 24 Regionsseiten, alle in der Sitemap', regionen.length === 24 && regionen.every((r) => urls.includes(`${DOMAIN}${r}`)), regionen.filter((r) => !urls.includes(`${DOMAIN}${r}`)).join(', '));
        check('E: jede der 24 Regionsseiten hat mindestens einen Link von einer Nicht-Regionsseite', ohne.length === 0, ohne.join(', ') || [...quellen].map(([r, q]) => `${r} ← ${[...q].slice(0, 3).join(', ')}`).join(' | '));
        check('E: keine Regionsseite mehr im Header', kopfRegionen.size === 0, [...kopfRegionen].join(', '));
        protokoll.regionen = Object.fromEntries([...quellen].map(([r, q]) => [r, [...q].sort()]));
        protokoll.sitemapSeiten = urls.length;
    }

    /* ---------------- F: Kalender und SMS «in Entwicklung» ---------------- */
    {
        const seiten = [`${KI_BASIS}/anwendungen/terminbuchung`, KI_PREISE_PFAD, `${KI_BASIS}/vergleich`];
        protokoll.badges = {};
        for (const theme of ['light', 'dark']) {
            const { ctx, page, fehler } = await neueSeite({ width: 1280, height: 900 }, { theme });
            for (const pfad of seiten) {
                await lade(page, pfad);
                const b = await page.evaluate(() =>
                    [...document.querySelectorAll('main [data-in-entwicklung]')].map((el) => {
                        // CSS-Farbe (Tailwind v4: oklch) → sRGB mit Alpha über ein 1×1-Canvas
                        const leinwand = document.createElement('canvas');
                        leinwand.width = leinwand.height = 1;
                        const c2d = leinwand.getContext('2d', { willReadFrequently: true });
                        const rgba = (farbe) => {
                            c2d.clearRect(0, 0, 1, 1);
                            c2d.fillStyle = '#000';
                            c2d.fillStyle = farbe;
                            c2d.fillRect(0, 0, 1, 1);
                            const [r, g, b, a] = c2d.getImageData(0, 0, 1, 1).data;
                            return [r, g, b, a / 255];
                        };
                        const s = getComputedStyle(el);
                        // Hintergrund der Umgebung: erster deckender Hintergrund eines Vorfahren; eigene Fläche mit Alpha darüber
                        let p = el.parentElement;
                        let umgebung = [255, 255, 255];
                        while (p) {
                            const c = rgba(getComputedStyle(p).backgroundColor);
                            if (c[3] > 0.5) {
                                umgebung = c.slice(0, 3);
                                break;
                            }
                            p = p.parentElement;
                        }
                        const eigen = rgba(s.backgroundColor);
                        const bg = umgebung.map((u, i) => Math.round(eigen[i] * eigen[3] + u * (1 - eigen[3])));
                        const fg = rgba(s.color).slice(0, 3);
                        const r = el.getBoundingClientRect();
                        return { text: el.textContent.trim(), fg, bg, sichtbar: r.width > 0 && r.height > 0 && s.visibility === 'visible', ueberlauf: el.scrollWidth > el.clientWidth + 1 };
                    }),
                );
                const k = b.map((x) => Math.round(kontrast(x.fg, x.bg) * 100) / 100);
                check(
                    `F [${theme === 'dark' ? 'dunkel' : 'hell'}]: ${pfad} — Badge «${IN_ENTWICKLUNG}» sichtbar, lesbar (Kontrast ≥ 4.5)`,
                    b.length >= 1 && b.every((x) => x.text === IN_ENTWICKLUNG && x.sichtbar && !x.ueberlauf) && k.every((x) => x >= 4.5),
                    `${b.length} Badges, Kontrast ${k.join('/')}`,
                );
                protokoll.badges[`${theme} ${pfad}`] = { anzahl: b.length, kontrast: k };
                if (theme === 'light' && pfad === seiten[0]) {
                    const satz = await page.locator('main').innerText();
                    check('F: Terminbuchung — Satz wortgleich im Lead', satz.includes(KALENDER_SATZ));
                }
                const badge = page.locator('main [data-in-entwicklung]').first();
                await badge.scrollIntoViewIfNeeded();
                await page.waitForTimeout(150);
                const name = pfad.split('/').pop();
                await page.screenshot({ path: path.join(SCREENS, `F-${name}-${theme === 'dark' ? 'dunkel' : 'hell'}.png`) });
            }
            check(`F [${theme === 'dark' ? 'dunkel' : 'hell'}]: keine Konsolenfehler`, fehler.length === 0, fehler.slice(0, 3).join(' | '));
            await ctx.close();
        }

        // Text-Suche im ganzen Bereich: kein Satz behauptet den Kalendereintrag als verfügbar
        // (AUFTRAG-114: SMS-Muster entfallen — die SMS-Bestätigung ist verfügbar)
        const BEHAUPTUNG = [
            /\bträgt\b[^.!?]{0,120}\bein\b/i,
            // «eingetragen» nur im Termin-/Kalender-Zusammenhang (nicht «im Handelsregister eingetragen»)
            /(Termin|Kalender)[^.!?]{0,80}\beingetragen\b|\beingetragen\b[^.!?]{0,40}Kalender|\biitreit\b/i,
            /direkt (im|in Ihren|in einen) (Microsoft-365-)?Kalender/i,
            /Termin(e)? im (Microsoft-365-)?Kalender\b(?! verwendet)/i,
        ];
        const HINWEIS = /in Entwicklung|kommt bald|kommen bald|künftig|noch nicht/i;
        const { ctx, page } = await neueSeite({ width: 1280, height: 900 });
        const funde = [];
        let saetze = 0;
        let mitHinweis = 0;
        for (const s of KI_SEITEN) {
            await lade(page, s.pfad);
            // Badges als Text «(In Entwicklung, kommt bald)» behandeln: sie gehören zum Satz davor
            const text = await page.evaluate(() => {
                const main = document.querySelector('main').cloneNode(true);
                main.querySelectorAll('[data-in-entwicklung]').forEach((b) => b.replaceWith(` (${b.textContent.trim()}) `));
                main.querySelectorAll('script, style, svg').forEach((x) => x.remove());
                // nach jedem Element ein Leerzeichen, sonst kleben Blöcke zu einem «Satz» zusammen
                main.querySelectorAll('*').forEach((el) => el.append(' '));
                return main.textContent.replace(/\s+/g, ' ');
            });
            for (const satz of text.split(/(?<=[.!?])\s+/)) {
                if (!BEHAUPTUNG.some((re) => re.test(satz))) continue;
                saetze++;
                if (HINWEIS.test(satz)) mitHinweis++;
                else funde.push(`${s.pfad}: «${satz.trim().slice(0, 160)}»`);
            }
        }
        await ctx.close();
        check(`F: im Bereich /ki-telefonassistent (${KI_SEITEN.length} Seiten) kein Satz mehr, der den Kalendereintrag als verfügbar behauptet`, funde.length === 0, funde.slice(0, 5).join(' | ') || `${saetze} Treffer der Stichwortsuche, alle mit Hinweis «in Entwicklung»`);
        protokoll.kalenderSuche = { seiten: KI_SEITEN.length, treffer: saetze, mitHinweis, ohneHinweis: funde };
    }

    /* ---------------- G: Preise freigegeben ---------------- */
    {
        check('G: PREISE_FREIGEGEBEN = true', PREISE_FREIGEGEBEN === true);
        const r = await hole(`${BASE}${KI_PREISE_PFAD}`);
        const robots = r.html.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/i)?.[1] ?? '(kein robots-meta)';
        check('G: /ki-telefonassistent/preise ohne noindex', r.status === 200 && !/noindex/i.test(robots), robots);
        check('G: kein Entwurfsband (weder data-entwurf noch «Entwurf, Preise noch nicht freigegeben»)', !/data-entwurf=/.test(r.html) && !/Entwurf, Preise noch nicht freigegeben/.test(r.html) && !/\(Entwurf\)/.test(r.html));
        const hub = await hole(`${BASE}${KI_BASIS}`);
        check('G: auch der Preis-Teaser auf dem Hub ohne Entwurfsband', !/data-entwurf=/.test(hub.html));
        const sitemap = (await hole(`${BASE}/sitemap.xml`)).html;
        check('G: Sitemap enthält /ki-telefonassistent/preise', sitemap.includes(`<loc>${DOMAIN}${KI_PREISE_PFAD}</loc>`));
        check('G: JSON-LD mit Angebotskatalog (Offer) auf /preise', /"@type":"OfferCatalog"/.test(r.html) && /"@type":"Offer"/.test(r.html));
        // Nachtrag AUFTRAG-113: Zielgruppensatz Starter wortgleich, alter Satz weg
        const STARTER_NEU = 'Für Betriebe, die am Telefon Terminwünsche aufnehmen und Rückrufe organisieren.';
        check('G: Paket Starter — «Für Betriebe, die am Telefon Terminwünsche aufnehmen und Rückrufe organisieren.» (Nachtrag), alter Satz weg', PAKETE.find((p) => p.id === 'starter')?.fuerWen === STARTER_NEU && r.html.includes(STARTER_NEU) && !r.html.includes('Termine vergeben und bestätigen'));
        const pakete = PAKETE.map((p) => [p.preisMonat, p.minuten]);
        check(
            'G: Beträge unverändert (49/149/299/auf Anfrage, 100/500/1500 Minuten, Einrichtung 490, Zusatzminute 0.45)',
            JSON.stringify(pakete) === JSON.stringify(BETRAEGE_VORHER.pakete) && EINRICHTUNG_EINMALIG === BETRAEGE_VORHER.einrichtung && PREIS_ZUSATZMINUTE === BETRAEGE_VORHER.zusatzminute && /CHF 49/.test(r.html) && /CHF 149/.test(r.html) && /CHF 299/.test(r.html),
            JSON.stringify({ pakete, einrichtung: EINRICHTUNG_EINMALIG, zusatzminute: PREIS_ZUSATZMINUTE }),
        );
        const { ctx, page } = await neueSeite({ width: 1280, height: 900 });
        await lade(page, KI_PREISE_PFAD);
        await page.locator('#pakete').scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        await page.locator('#pakete').screenshot({ path: path.join(SCREENS, 'G-preise-pakete.png') });
        await ctx.close();
    }
} finally {
    await browser.close();
}

writeFileSync(path.join(SCREENS, 'browser-test.json'), JSON.stringify({ ...protokoll, ergebnisse }, null, 1));
const fehler = ergebnisse.filter((e) => !e.ok).length;
console.log(`\n${ergebnisse.length - fehler}/${ergebnisse.length} Browser-Prüfungen bestanden. Screens: ${SCREENS}`);
process.exit(fehler ? 1 : 0);
