#!/usr/bin/env node
/**
 * auftrag100-browser-test.mjs — Browser-Test AUFTRAG-100
 *
 * Teil M (Mega-Menü):
 *   M0  Server-HTML ohne JavaScript: alle Menü-Links im <header> (crawlbar),
 *       24 Regionsseiten, jede Zielseite 200, jeder Anker vorhanden, Texte
 *       ohne Zahlen/Superlative/ß/Dachmarke.
 *   M1  Desktop 1440 hell/dunkel: Hover öffnet je Panel, Verlassen schliesst,
 *       aria-expanded, keine Layout-Verschiebung (Seite steht), Screenshots.
 *   M2  Tastatur: Tab zum Auslöser, Enter öffnet, Tab in das Panel, Escape
 *       schliesst mit Fokus zurück, Pfeil runter öffnet auf den ersten Link,
 *       Tab aus dem Panel schliesst (keine Fokusfalle), Leertaste schaltet.
 *   M3  1024 px: Leiste ohne Überlappung, Panels passen ins Fenster.
 *   M4  prefers-reduced-motion: Panel ohne Verschiebung, kurze Überblendung.
 *   M5  Touch-Desktop (1180, Touch): Antippen öffnet, nochmals schliesst.
 *   M6  Klick auf einen Branchen-Link: Ziel-Abschnitt unter dem Header.
 *   M7  Mobil 375 hell/dunkel: Akkordeon im Overlay, Touchziele ≥ 44 px,
 *       Regionen aufklappbar, Escape schliesst, Link schliesst das Overlay.
 *
 * Teil T (Telefon scrollt mit) — Scan-, Profil- und Anruf-API werden im
 * Browser abgefangen (fiktive «Beispiel AG»): kein Scan fremder Seiten,
 * kein Auftrag beim Server, kein Anruf.
 *   T1  Desktop 1440 hell: eingabe → nicht sticky; Scan → sticky; gescrollt
 *       während Scan und während Anruf: getBoundingClientRect des Telefons
 *       (top = 112 px, ganz im Fenster); Ende der Bühne als Grenze (nie im
 *       Footer); CLS 0 im ganzen Ablauf.
 *   T2  Desktop dunkel, 1280×720 (Telefon passt ganz ins Fenster).
 *   T3  Mobil 375 hell/dunkel: kein automatischer Sprung, Statuszeile oben
 *       (48 px) mit Schritt und Fund, Antippen springt zum Telefon, im Anruf
 *       Stand und Dauer, CLS 0; reduzierte Bewegung ohne Verschiebung.
 *
 *   node scripts/auftrag100-browser-test.mjs            (alles)
 *   node scripts/auftrag100-browser-test.mjs --menue    (nur Teil M)
 *   node scripts/auftrag100-browser-test.mjs --telefon  (nur Teil T)
 *
 * Screenshots: ../auftraege/ergebnisse/A100-screens/
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SCREENS = path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', process.env.SCREENS_ORDNER || 'A100-screens');
const args = process.argv.slice(2);
const nurMenue = args.includes('--menue');
const nurTelefon = args.includes('--telefon');
mkdirSync(SCREENS, { recursive: true });

// Menüdaten direkt aus der Quelle (Node ≥ 22.18: Type-Stripping)
const nav = await import(pathToFileURL(path.join(ROOT, 'src/components/layout/navigation.ts')).href);

/* ------------------------------------------------------------------ */
/* Prüfprotokoll                                                       */
/* ------------------------------------------------------------------ */
const ergebnisse = [];
function check(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail: String(detail) });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== '' ? ' — ' + String(detail).slice(0, 300) : ''}`);
}
const shot = (page, name, opt = {}) => page.screenshot({ path: path.join(SCREENS, name), ...opt });
const warte = (page, ms) => page.waitForTimeout(ms);

async function neueSeite(browser, { breite, hoehe, theme = 'light', mobil = false, touch = mobil, ruhig = false, skala = null }) {
    const ctx = await browser.newContext({
        viewport: { width: breite, height: hoehe },
        deviceScaleFactor: skala ?? (mobil ? 2 : 1),
        isMobile: mobil,
        hasTouch: touch,
        reducedMotion: ruhig ? 'reduce' : 'no-preference',
        locale: 'de-CH',
    });
    await ctx.addInitScript((t) => {
        try {
            localStorage.setItem('theme', t);
        } catch {
            /* egal */
        }
        // Layout-Verschiebungen messen (CLS; Verschiebungen direkt nach Klick/Taste zählen nicht)
        window.__cls = 0;
        window.__clsQuellen = [];
        try {
            new PerformanceObserver((l) => {
                for (const e of l.getEntries()) {
                    if (e.hadRecentInput) continue;
                    window.__cls += e.value;
                    const q = (e.sources || []).map((s) => {
                        const n = s.node;
                        return `${n ? `${n.nodeName}.${String(n.className || '').slice(0, 40)}` : '?'} ${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)}`;
                    });
                    window.__clsQuellen.push(`${e.value.toFixed(4)} @${Math.round(e.startTime)}ms: ${q.join(' | ')}`);
                }
            }).observe({ type: 'layout-shift', buffered: true });
        } catch {
            /* ältere Browser */
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

const cls = async (page) => ({ wert: await page.evaluate(() => window.__cls), quellen: await page.evaluate(() => window.__clsQuellen) });

/* ------------------------------------------------------------------ */
/* Erwartete Links aus der Quelle                                      */
/* ------------------------------------------------------------------ */
function regionenAusContent() {
    const gruppen = { itSupport: 'it-support-regions', cloudTelefonie: 'cloud-telefonie-regions', webdesign: 'webdesign-regions' };
    const basis = { itSupport: '/it-support', cloudTelefonie: '/cloud-telefonie', webdesign: '/webdesign' };
    const liste = [];
    for (const [k, ordner] of Object.entries(gruppen)) {
        for (const f of readdirSync(path.join(ROOT, 'content', 'leistungen', ordner)).filter((x) => x.endsWith('.json'))) {
            const j = JSON.parse(readFileSync(path.join(ROOT, 'content', 'leistungen', ordner, f), 'utf8'));
            liste.push({ href: `${basis[k]}/${f.replace(/\.json$/, '')}`, name: j.name });
        }
    }
    return liste;
}
const REGIONEN = regionenAusContent();
const MENUE_LINKS = [
    ...nav.LEISTUNGEN.flatMap((g) => g.links),
    nav.LEISTUNGEN_UEBERSICHT,
    { titel: nav.KI_KARTE.titel, href: nav.KI_KARTE.href, text: nav.KI_KARTE.text },
    nav.ERSTGESPRAECH,
    ...nav.BRANCHEN,
    ...nav.UNTERNEHMEN,
    ...nav.DIREKTLINKS,
];

/* ------------------------------------------------------------------ */
/* Teil M: Mega-Menü                                                   */
/* ------------------------------------------------------------------ */
async function teilM0() {
    const html = await (await fetch(`${BASE}/`)).text();
    const kopf = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
    const hrefs = new Set([...kopf.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&')));
    const fehlend = [...MENUE_LINKS, ...REGIONEN].map((l) => l.href).filter((h) => !hrefs.has(h));
    check('M0 Server-HTML: alle Menü-Links im <header> (ohne JavaScript, crawlbar)', fehlend.length === 0, fehlend.length ? `fehlend: ${fehlend.join(', ')}` : `${MENUE_LINKS.length} Menü-Links + ${REGIONEN.length} Regionen`);
    check('M0 24 Regionsseiten aus den [region]-Templates', REGIONEN.length === 24 && REGIONEN.every((r) => hrefs.has(r.href)), REGIONEN.length);
    check('M0 Panels im Server-HTML (Leistungen, Für wen, Unternehmen, Mobil)', ['nav-panel-leistungen', 'nav-panel-fuer-wen', 'nav-panel-unternehmen', 'nav-mobil'].every((id) => kopf.includes(`id="${id}"`)));

    // Jede Zielseite antwortet 200, jeder Anker existiert auf der Zielseite
    const ziele = [...new Set([...MENUE_LINKS, ...REGIONEN].map((l) => l.href))];
    const status = [];
    const anker = [];
    const seitenCache = new Map();
    for (const z of ziele) {
        const pfad = z.split('#')[0];
        if (!seitenCache.has(pfad)) {
            const r = await fetch(`${BASE}${pfad}`, { redirect: 'manual' });
            seitenCache.set(pfad, { status: r.status, html: r.status === 200 ? await r.text() : '' });
        }
        const s = seitenCache.get(pfad);
        if (s.status !== 200) status.push(`${pfad} ${s.status}`);
        if (z.includes('#') && !s.html.includes(`id="${z.split('#')[1]}"`)) anker.push(z);
    }
    check(`M0 alle ${seitenCache.size} Zielseiten antworten 200 (nur bestehende Seiten)`, status.length === 0, status.join(', '));
    check('M0 Anker der Branchen existieren (#betriebe, #anwendungsfaelle, #branchen)', anker.length === 0, anker.join(', ') || [...new Set(MENUE_LINKS.filter((l) => l.href.includes('#')).map((l) => l.href))].join(', '));

    // Branchen passen zur Zielseite: der Branchenname (oder ein Synonym) steht im Ziel-Abschnitt
    const passend = {
        Praxen: /Praxen/,
        'Handwerk & Elektro': /Handwerk und Elektro/,
        'Treuhand & Beratung': /Treuhand/,
        'Gastronomie & Retail': /Retail &amp; Gastronomie|Retail & Gastronomie/,
        Garagen: /Garagen/,
        'KMU mit mehreren Standorten': /Multi-Standort|Standorte/,
    };
    const unpassend = [];
    for (const b of nav.BRANCHEN) {
        const [pfad, id] = b.href.split('#');
        const html = seitenCache.get(pfad)?.html ?? '';
        const start = html.indexOf(`id="${id}"`);
        const abschnitt = start < 0 ? '' : html.slice(start, html.indexOf('</section>', start));
        if (!passend[b.titel]?.test(abschnitt)) unpassend.push(`${b.titel} → ${b.href}`);
    }
    check('M0 jede Branche verlinkt einen Abschnitt, der diese Branche behandelt', unpassend.length === 0, unpassend.join(', ') || nav.BRANCHEN.map((b) => `${b.titel} → ${b.href}`).join(' | '));

    // Texte: kurz, ohne Zahlen (Produktnamen 3CX und Microsoft 365 ausgenommen), ohne Superlative, ß, Dachmarke
    const texte = [...MENUE_LINKS.flatMap((l) => [l.titel, l.text ?? '']), nav.KI_KARTE.aktion, ...nav.LEISTUNGEN.map((g) => g.titel), 'Für wen', 'Unternehmen', 'Branchen', 'Regionen'].filter(Boolean);
    const mitZahl = texte.filter((t) => /\d/.test(t.replace(/\b3CX\b/g, '').replace(/Microsoft 365/g, '')));
    const superlativ = texte.filter((t) => /\b(beste[nrs]?|bester|führend\w*|top|nr\.?\s*1|einzig\w*|unschlagbar|garantiert|perfekt\w*|revolution\w*|weltklasse|marktführer\w*|schnellste\w*|günstigste\w*)\b/i.test(t));
    check('M0 Menütexte ohne Zahlen (ausser Produktnamen 3CX, Microsoft 365)', mitZahl.length === 0, mitZahl.join(' | '));
    check('M0 Menütexte ohne Superlative', superlativ.length === 0, superlativ.join(' | '));
    check('M0 Menütexte kurz (Beschreibung ≤ 45 Zeichen)', MENUE_LINKS.every((l) => !l.text || l.text.length <= 45), MENUE_LINKS.filter((l) => l.text && l.text.length > 45).map((l) => l.text).join(' | '));
    check('M0 kein ß, keine Dachmarke Elektro-Tel im Header', !/ß/.test(kopf) && !/Elektro-Tel/i.test(kopf));
    check('M0 «Neu» nur beim KI-Telefonassistenten', MENUE_LINKS.filter((l) => l.badge).map((l) => `${l.titel}:${l.badge}`).join() === 'KI-Telefonassistent:Neu');
    check('M0 Direktlinks IT-Support und Cloud-Telefonie in der Leiste, CTA «Kostenloses Erstgespräch»', /href="\/it-support"[^>]*>IT-Support</.test(kopf) && /href="\/cloud-telefonie"[^>]*>Cloud-Telefonie</.test(kopf) && kopf.includes('>Kostenloses Erstgespräch<'));
}

/** Zustand eines Panels im Browser */
async function panelZustand(page, id) {
    return page.evaluate((id) => {
        const k = document.getElementById(`nav-knopf-${id}`);
        const p = document.getElementById(`nav-panel-${id}`);
        const s = getComputedStyle(p);
        const r = p.getBoundingClientRect();
        return { expanded: k.getAttribute('aria-expanded'), sichtbar: s.visibility === 'visible' && Number(s.opacity) > 0.98, top: Math.round(r.top), bottom: Math.round(r.bottom), transform: s.transform, dauer: s.transitionDuration };
    }, id);
}
const seitenLage = (page) => page.evaluate(() => ({ main: Math.round(document.querySelector('main').getBoundingClientRect().top * 10) / 10, scrollY: window.scrollY, breite: document.documentElement.scrollWidth }));

async function teilM1(browser, theme) {
    const name = `menue-desktop-1440-${theme === 'dark' ? 'dunkel' : 'hell'}`;
    const { ctx, page, konsole } = await neueSeite(browser, { breite: 1440, hoehe: 900, theme });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await shot(page, `${name}-0-zu.png`);
    const vorher = await seitenLage(page);
    for (const id of ['leistungen', 'fuer-wen', 'unternehmen']) {
        await page.mouse.move(700, 500);
        await page.hover(`#nav-knopf-${id}`);
        await warte(page, 450);
        const z = await panelZustand(page, id);
        const lage = await seitenLage(page);
        check(`${name}: Hover öffnet «${id}» (aria-expanded, sichtbar)`, z.expanded === 'true' && z.sichtbar, JSON.stringify(z));
        check(`${name}: «${id}» ohne Layoutsprung (Seite steht)`, lage.main === vorher.main && lage.scrollY === vorher.scrollY && lage.breite === vorher.breite, `${JSON.stringify(vorher)} → ${JSON.stringify(lage)}`);
        check(`${name}: «${id}» unter dem Header (top ${z.top} px), im Fenster`, z.top >= 80 && z.top <= 100 && z.bottom <= 900, `${z.top}–${z.bottom}`);
        await shot(page, `${name}-${id}.png`);
        // in das Panel fahren: bleibt offen
        if (id !== 'unternehmen') {
            await page.mouse.move(400, z.top + 60, { steps: 6 });
            await warte(page, 300);
            check(`${name}: «${id}» bleibt offen beim Weg ins Panel`, (await panelZustand(page, id)).expanded === 'true');
        }
        await page.mouse.move(720, 880, { steps: 4 });
        await warte(page, 500);
        if (id !== 'unternehmen') {
            const nachUnten = await panelZustand(page, id);
            // unter dem Panel liegt die Abdunkelung: Maus dort = Panel verlassen
            check(`${name}: Verlassen schliesst «${id}»`, nachUnten.expanded === 'false' && !nachUnten.sichtbar, JSON.stringify(nachUnten));
        } else {
            check(`${name}: Verlassen schliesst «${id}»`, (await panelZustand(page, id)).expanded === 'false');
        }
    }
    // Wechsel zwischen den Auslösern ohne Flackern: direkt das andere Panel
    await page.hover('#nav-knopf-leistungen');
    await warte(page, 400);
    await page.hover('#nav-knopf-fuer-wen');
    await warte(page, 60);
    const wechsel = [await panelZustand(page, 'leistungen'), await panelZustand(page, 'fuer-wen')];
    check(`${name}: Wechsel Leistungen → Für wen sofort`, wechsel[0].expanded === 'false' && wechsel[1].expanded === 'true', wechsel.map((w) => w.expanded).join('/'));
    await page.mouse.move(720, 880);
    await warte(page, 500);
    // Klick ausserhalb schliesst
    await page.click('#nav-knopf-unternehmen');
    await warte(page, 250);
    const klickAuf = await panelZustand(page, 'unternehmen');
    await page.mouse.click(300, 700);
    await warte(page, 300);
    check(`${name}: Klick öffnet, Klick daneben schliesst`, klickAuf.expanded === 'true' && (await panelZustand(page, 'unternehmen')).expanded === 'false');
    const c = await cls(page);
    // Quellen im Header/Menü zählen streng (0); der Slider der Startseite (Punkte) verschiebt sich selbst minimal
    const ausMenue = c.quellen.filter((q) => /nav|header|panel|schleier/i.test(q));
    check(`${name}: CLS beim Menü ${c.wert.toFixed(4)} (keine Verschiebung aus Header/Menü)`, ausMenue.length === 0 && c.wert < 0.001, c.quellen.join(" | "));
    check(`${name}: keine Konsolenfehler`, konsole.length === 0, konsole.slice(0, 3).join(' | '));
    await ctx.close();
}

async function teilM2(browser) {
    const name = 'menue-tastatur';
    const { ctx, page, konsole } = await neueSeite(browser, { breite: 1440, hoehe: 900 });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const aktiv = () => page.evaluate(() => ({ id: document.activeElement?.id || '', text: document.activeElement?.textContent?.trim().slice(0, 40) ?? '', imPanel: document.activeElement?.closest('[id^="nav-panel-"]')?.id ?? null }));
    // Tab vom Seitenanfang bis zum Auslöser «Leistungen»
    let schritte = 0;
    while (schritte < 20 && (await aktiv()).id !== 'nav-knopf-leistungen') {
        await page.keyboard.press('Tab');
        schritte++;
    }
    check(`${name}: Tab erreicht «Leistungen» (${schritte} Tabs)`, (await aktiv()).id === 'nav-knopf-leistungen');
    check(`${name}: geschlossen sind Panel-Links nicht im Tab-Weg`, (await panelZustand(page, 'leistungen')).expanded === 'false');
    await page.keyboard.press('Enter');
    await warte(page, 250);
    check(`${name}: Enter öffnet (aria-expanded=true)`, (await panelZustand(page, 'leistungen')).expanded === 'true');
    await page.keyboard.press('Tab');
    const ersterLink = await aktiv();
    check(`${name}: Tab führt in das Panel (erster Link)`, ersterLink.imPanel === 'nav-panel-leistungen', JSON.stringify(ersterLink));
    await shot(page, `${name}-1-enter-tab.png`);
    await page.keyboard.press('Escape');
    await warte(page, 250);
    check(`${name}: Escape schliesst, Fokus zurück auf den Auslöser`, (await panelZustand(page, 'leistungen')).expanded === 'false' && (await aktiv()).id === 'nav-knopf-leistungen');
    await page.keyboard.press('ArrowDown');
    await warte(page, 250);
    const pfeil = await aktiv();
    check(`${name}: Pfeil runter öffnet und fokussiert den ersten Link`, (await panelZustand(page, 'leistungen')).expanded === 'true' && pfeil.imPanel === 'nav-panel-leistungen' && pfeil.text.startsWith('IT-Support'), JSON.stringify(pfeil));
    // durch alle Links tabben, bis der Fokus das Panel verlässt → Panel zu, keine Fokusfalle
    let n = 0;
    while (n < 40 && (await aktiv()).imPanel === 'nav-panel-leistungen') {
        await page.keyboard.press('Tab');
        n++;
    }
    await warte(page, 250);
    const danach = await aktiv();
    check(`${name}: Tab aus dem Panel schliesst es, Fokus auf «Für wen» (keine Fokusfalle, ${n} Tabs)`, (await panelZustand(page, 'leistungen')).expanded === 'false' && danach.id === 'nav-knopf-fuer-wen', JSON.stringify(danach));
    await page.keyboard.press(' ');
    await warte(page, 250);
    check(`${name}: Leertaste öffnet «Für wen»`, (await panelZustand(page, 'fuer-wen')).expanded === 'true');
    await shot(page, `${name}-2-fuer-wen.png`);
    await page.keyboard.press(' ');
    await warte(page, 250);
    check(`${name}: Leertaste schliesst wieder`, (await panelZustand(page, 'fuer-wen')).expanded === 'false');
    // Shift+Tab rückwärts in das offene Panel von «Unternehmen»
    await page.focus('#nav-knopf-unternehmen');
    await page.keyboard.press('Enter');
    await warte(page, 200);
    await page.keyboard.press('Tab');
    const u = await aktiv();
    check(`${name}: «Unternehmen» per Tastatur, erster Link «Über uns»`, u.imPanel === 'nav-panel-unternehmen' && u.text === 'Über uns', JSON.stringify(u));
    await page.keyboard.press('Escape');
    const fokusSichtbar = await page.evaluate(() => document.activeElement.matches(':focus-visible') && getComputedStyle(document.activeElement).outlineStyle);
    check(`${name}: Fokus sichtbar (outline)`, fokusSichtbar && fokusSichtbar !== 'none', fokusSichtbar);
    check(`${name}: keine Konsolenfehler`, konsole.length === 0, konsole.slice(0, 3).join(' | '));
    await ctx.close();
}

async function teilM3(browser) {
    const name = 'menue-desktop-1024-hell';
    const { ctx, page } = await neueSeite(browser, { breite: 1024, hoehe: 768 });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const leiste = await page.evaluate(() => {
        const r = (el) => el.getBoundingClientRect();
        const logo = r(document.querySelector('header a'));
        const navEl = document.querySelector('header nav');
        const aktionen = r(navEl.nextElementSibling);
        const items = [...navEl.querySelectorAll(':scope > ul > li')].map((li) => r(li));
        return { logoRechts: Math.round(logo.right), navLinks: Math.round(r(navEl).left), navRechts: Math.round(r(navEl).right), aktionenLinks: Math.round(aktionen.left), zeilen: new Set(items.map((i) => Math.round(i.top))).size, ueberlauf: document.documentElement.scrollWidth - window.innerWidth };
    });
    check(`${name}: Leiste ohne Überlappung (Abstände ≥ 16 px, eine Zeile)`, leiste.navLinks - leiste.logoRechts >= 16 && leiste.aktionenLinks - leiste.navRechts >= 16 && leiste.zeilen === 1 && leiste.ueberlauf <= 0, JSON.stringify(leiste));
    for (const id of ['leistungen', 'fuer-wen']) {
        await page.hover(`#nav-knopf-${id}`);
        await warte(page, 450);
        const z = await panelZustand(page, id);
        check(`${name}: «${id}» passt ins Fenster (${z.top}–${z.bottom} px)`, z.sichtbar && z.bottom <= 768, JSON.stringify(z));
        await shot(page, `${name}-${id}.png`);
        await page.mouse.move(500, 760);
        await warte(page, 450);
    }
    await ctx.close();
}

async function teilM4(browser) {
    const name = 'menue-ruhig';
    const { ctx, page } = await neueSeite(browser, { breite: 1440, hoehe: 900, ruhig: true });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.hover('#nav-knopf-leistungen');
    await warte(page, 300);
    const z = await panelZustand(page, 'leistungen');
    const welle = await page.evaluate(() => getComputedStyle(document.querySelector('#nav-panel-leistungen [aria-hidden="true"] > span')).animationName);
    check(`${name}: prefers-reduced-motion – Panel ohne Verschiebung, Überblendung ≤ 0,08 s, Welle still`, z.sichtbar && z.transform === 'none' && z.dauer.split(',').every((d) => parseFloat(d) <= 0.08) && welle === 'none', `${z.transform} · ${z.dauer} · ${welle}`);
    await ctx.close();
}

async function teilM5(browser) {
    const name = 'menue-touch-1180';
    const { ctx, page } = await neueSeite(browser, { breite: 1180, hoehe: 820, touch: true });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.tap('#nav-knopf-leistungen');
    await warte(page, 300);
    const auf = await panelZustand(page, 'leistungen');
    await page.tap('#nav-knopf-leistungen');
    await warte(page, 300);
    const zu = await panelZustand(page, 'leistungen');
    check(`${name}: Antippen öffnet, nochmals Antippen schliesst`, auf.expanded === 'true' && zu.expanded === 'false', `${auf.expanded} → ${zu.expanded}`);
    await ctx.close();
}

async function teilM6(browser) {
    const name = 'menue-branche-klick';
    const { ctx, page, konsole } = await neueSeite(browser, { breite: 1440, hoehe: 900 });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.hover('#nav-knopf-fuer-wen');
    await warte(page, 400);
    await page.click('#nav-panel-fuer-wen a[href="/digital-signage#branchen"]');
    await page.waitForURL('**/digital-signage#branchen', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await warte(page, 700);
    const ziel = await page.evaluate(() => ({ top: Math.round(document.getElementById('branchen').getBoundingClientRect().top), h2: document.querySelector('#branchen h2')?.textContent.trim(), offen: [...document.querySelectorAll('[id^="nav-knopf-"][aria-expanded="true"]')].length }));
    check(`${name}: «Gastronomie & Retail» → /digital-signage#branchen, Abschnitt unter dem Header, Menü zu`, ziel.top >= 60 && ziel.top <= 160 && ziel.offen === 0 && /Für wen ist Digital Signage/.test(ziel.h2 || ''), JSON.stringify(ziel));
    await shot(page, `${name}-digital-signage.png`);
    check(`${name}: keine Konsolenfehler`, konsole.length === 0, konsole.slice(0, 3).join(' | '));
    await ctx.close();
}

async function teilM7(browser, theme) {
    const name = `menue-mobil-375-${theme === 'dark' ? 'dunkel' : 'hell'}`;
    const { ctx, page, konsole } = await neueSeite(browser, { breite: 375, hoehe: 812, theme, mobil: true });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 500));
    await warte(page, 300);
    const yVorher = await page.evaluate(() => window.scrollY);
    await page.tap('#nav-mobil-knopf');
    await warte(page, 400);
    const overlay = await page.evaluate(() => {
        const o = document.getElementById('nav-mobil');
        const s = getComputedStyle(o);
        return { sichtbar: s.visibility === 'visible' && Number(s.opacity) > 0.98, expanded: document.getElementById('nav-mobil-knopf').getAttribute('aria-expanded'), label: document.getElementById('nav-mobil-knopf').getAttribute('aria-label'), body: document.body.style.position };
    });
    check(`${name}: Menü öffnet als Overlay (Seite festgehalten)`, overlay.sichtbar && overlay.expanded === 'true' && overlay.label === 'Menü schliessen' && overlay.body === 'fixed', JSON.stringify(overlay));
    await shot(page, `${name}-1-offen.png`);
    await page.tap('#nav-mobil-knopf-leistungen');
    await warte(page, 450);
    const leistungen = await page.evaluate(() => {
        const box = document.getElementById('nav-mobil-leistungen');
        const links = [...box.querySelectorAll('a')].filter((a) => getComputedStyle(a).visibility === 'visible');
        return { expanded: document.getElementById('nav-mobil-knopf-leistungen').getAttribute('aria-expanded'), links: links.length, kleinste: Math.min(...links.map((a) => a.getBoundingClientRect().height)) };
    });
    check(`${name}: Akkordeon «Leistungen» klappt auf (15 Links), Touchziele ≥ 44 px`, leistungen.expanded === 'true' && leistungen.links === 15 && leistungen.kleinste >= 44, JSON.stringify(leistungen));
    await shot(page, `${name}-2-leistungen.png`);
    await page.tap('#nav-mobil-knopf-fuer-wen');
    await warte(page, 450);
    const exklusiv = await page.evaluate(() => [document.getElementById('nav-mobil-knopf-leistungen').getAttribute('aria-expanded'), document.getElementById('nav-mobil-knopf-fuer-wen').getAttribute('aria-expanded')]);
    check(`${name}: eine Hauptgruppe offen (Für wen auf, Leistungen zu)`, exklusiv.join() === 'false,true', exklusiv.join());
    await page.tap('#nav-mobil-knopf-regionen-itSupport');
    await warte(page, 450);
    const regionen = await page.evaluate(() => {
        const box = document.getElementById('nav-mobil-regionen-itSupport');
        const links = [...box.querySelectorAll('a')];
        return { links: links.length, namen: links.map((a) => a.textContent.trim()), kleinste: Math.min(...links.map((a) => a.getBoundingClientRect().height)), knoepfe: Math.min(...[...document.querySelectorAll('#nav-mobil button')].filter((b) => b.getClientRects().length && getComputedStyle(b).visibility === 'visible').map((b) => b.getBoundingClientRect().height)) };
    });
    check(`${name}: Regionen «IT-Support» aufklappbar (6 Seiten), Touchziele ≥ 44 px`, regionen.links === 6 && regionen.kleinste >= 44 && regionen.knoepfe >= 44, `${regionen.namen.join(', ')} · Link ${regionen.kleinste} px · Knöpfe ${regionen.knoepfe} px`);
    await page.locator('#nav-mobil-knopf-fuer-wen').scrollIntoViewIfNeeded();
    await shot(page, `${name}-3-fuer-wen-regionen.png`);
    await page.keyboard.press('Escape');
    await warte(page, 400);
    const zu = await page.evaluate(() => ({ expanded: document.getElementById('nav-mobil-knopf').getAttribute('aria-expanded'), y: window.scrollY, fokus: document.activeElement?.id }));
    check(`${name}: Escape schliesst, Seite wieder an derselben Stelle, Fokus auf dem Menü-Knopf`, zu.expanded === 'false' && Math.abs(zu.y - yVorher) <= 1 && zu.fokus === 'nav-mobil-knopf', JSON.stringify(zu));
    // Link im Overlay: navigiert und schliesst
    await page.tap('#nav-mobil-knopf');
    await warte(page, 350);
    await page.tap('#nav-mobil-knopf-fuer-wen');
    await warte(page, 400);
    await page.tap('#nav-mobil-fuer-wen a[href="/ki-telefonassistent#betriebe"] >> nth=0');
    await page.waitForURL('**/ki-telefonassistent#betriebe', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await warte(page, 800);
    const ziel = await page.evaluate(() => ({ offen: document.getElementById('nav-mobil-knopf').getAttribute('aria-expanded'), top: Math.round(document.getElementById('betriebe').getBoundingClientRect().top), body: document.body.style.position }));
    check(`${name}: Branchen-Link → /ki-telefonassistent#betriebe, Overlay zu, Abschnitt oben`, ziel.offen === 'false' && ziel.body === '' && ziel.top >= 40 && ziel.top <= 140, JSON.stringify(ziel));
    check(`${name}: keine Konsolenfehler`, konsole.length === 0, konsole.slice(0, 3).join(' | '));
    await ctx.close();
}

/* ------------------------------------------------------------------ */
/* Teil T: Telefon scrollt mit                                         */
/* ------------------------------------------------------------------ */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><rect x="4" y="12" width="36" height="36" rx="8" fill="#E8A13D"/><path d="M14 38V22h9a6 6 0 0 1 0 12h-9" fill="none" stroke="#1E3A5F" stroke-width="4"/><text x="50" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#1E3A5F">Beispiel AG</text></svg>`;

const PROFIL = {
    firma: 'Beispiel AG',
    website: 'https://beispiel-ag.ch',
    assistent_name: 'Lena',
    branche: 'Elektroinstallationen',
    telefon: '044 000 00 00',
    email: null,
    adresse: null,
    oeffnungszeiten_text: 'Mo–Fr 07:30–17:00',
    firma_text: 'Die Beispiel AG ist ein fiktiver Elektrobetrieb für diesen Test.',
    faehigkeiten: ['Rund um die Uhr erreichbar', 'Beantwortet Fragen aus Ihrer Website', 'Nimmt Anliegen und Rückrufwünsche auf'],
    wissen: Array.from({ length: 12 }, (_, i) => ({ frage: `Testfrage ${i + 1}`, antwort: 'Testantwort der Attrappe.', thema: 'Test' })),
    logo_url: null,
    farben: { primaer: '#1E3A5F', sekundaer: '#E8A13D' },
    stimme: 'weiblich',
};

/** Fängt Scan, Profil, Logo, Anruf und Status ab (fiktive Beispiel AG, kein Server-Auftrag, kein Anruf). */
async function apiAbfangen(page, { scanMs = 1200, profilMs = 2600 } = {}) {
    const z = { start: 0, gesendet: null, scans: 0 };
    await page.route('**/a100-attrappe/logo.svg', (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: LOGO_SVG }));
    await page.route('**/api/demo/scan', async (r) => {
        z.scans++;
        await new Promise((ok) => setTimeout(ok, scanMs));
        await r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                scan_id: 'a100-attrappe',
                profil: PROFIL,
                assistent_weiblich: true,
                logos: [{ src: '/a100-attrappe/logo.svg', index: 0, quelle: 'attrappe', format: 'svg', breite: 200, hoehe: 60, hell: false, transparenz: true, farbe: '#1E3A5F', umgebung: '#FFFFFF' }],
                farb_signale: [{ farbe: '#1E3A5F', gewicht: 5, quelle: 'css-variable' }],
                funde: { seiten: 4, firma: 'Beispiel AG', telefon: '044 000 00 00', oeffnungszeiten: 'Mo–Fr 07:30–17:00', farbe: '#1E3A5F' },
            }),
        });
    });
    await page.route('**/api/demo/profil', async (r) => {
        await new Promise((ok) => setTimeout(ok, profilMs));
        await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profil: PROFIL, funde: { telefon: '044 000 00 00', oeffnungszeiten: 'Mo–Fr 07:30–17:00', wissen: 12 } }) });
    });
    await page.route('**/api/demo/anruf', async (r) => {
        z.gesendet = JSON.parse(r.request().postData() || '{}');
        z.start = Date.now();
        await r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'd-20261025-attrappea100' }) });
    });
    await page.route('**/api/demo/auftraege/**', async (r) => {
        const t = Date.now() - z.start;
        let status = 'wartend';
        if (t > 1500) status = 'angenommen';
        if (t > 3500) status = 'waehlt';
        if (t > 7000) status = 'verbunden';
        const ende = t > 26000;
        await r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'd-20261025-attrappea100', status: ende ? 'beendet' : status, zeit: new Date().toISOString(), dauer_s: ende ? 19 : null, zusammenfassung: ende ? 'Testgespräch (Attrappe im Browser).' : null }),
        });
    });
    return z;
}

/** Lage des Telefons, der Bühne, des Heros und des Footers */
async function telefonLage(page) {
    return page.evaluate(() => {
        const tel = document.querySelector('figure').parentElement;
        const r = tel.getBoundingClientRect();
        const buehne = tel.parentElement.getBoundingClientRect();
        const hero = tel.closest('section').getBoundingClientRect();
        const footer = document.querySelector('footer').getBoundingClientRect();
        const zustand = document.querySelector('[data-zustand]')?.getAttribute('data-zustand');
        return {
            position: getComputedStyle(tel).position,
            top: Math.round(r.top * 10) / 10,
            bottom: Math.round(r.bottom * 10) / 10,
            hoehe: Math.round(r.height),
            fenster: window.innerHeight,
            buehneBottom: Math.round(buehne.bottom * 10) / 10,
            heroBottom: Math.round(hero.bottom * 10) / 10,
            footerTop: Math.round(footer.top),
            scrollY: Math.round(window.scrollY),
            kopf: Math.round(document.querySelector('header').getBoundingClientRect().bottom),
            zustand,
        };
    });
}

async function scanStarten(page) {
    await page.fill('#ki-demo-url', 'beispiel-ag.ch');
    await page.click('#ki-demo-scan-knopf');
}

async function anrufStarten(page) {
    await page.fill('#ki-demo-nummer', '079 000 00 01');
    await page.locator('#ki-demo-einwilligung').check();
    await page.click('#ki-demo-anruf-knopf');
}

async function teilT1(browser, { theme, breite, hoehe, voll }) {
    const name = `telefon-desktop-${breite}x${hoehe}-${theme === 'dark' ? 'dunkel' : 'hell'}`;
    const { ctx, page, konsole } = await neueSeite(browser, { breite, hoehe, theme });
    const abfang = await apiAbfangen(page);
    await page.goto(`${BASE}/ki-telefonassistent`, { waitUntil: 'networkidle' });
    let l = await telefonLage(page);
    check(`${name}: eingabe – Telefon nicht sticky`, l.position === 'static', l.position);
    check(`${name}: Telefon passt unter dem Header ins Fenster (Höhe ${l.hoehe} px)`, 112 + l.hoehe <= hoehe, `${l.hoehe} px bei ${hoehe} px Fenster`);
    await scanStarten(page);
    await warte(page, 300);
    l = await telefonLage(page);
    check(`${name}: scan – Telefon sticky`, l.position === 'sticky', `${l.position} (${l.zustand})`);
    // Während des Scans nach unten zur Aktionskarte scrollen
    await page.evaluate(() => window.scrollBy(0, 520));
    await page.locator('figure li:has-text("Logo gefunden")').first().waitFor({ timeout: 15000 }).catch(() => undefined);
    await warte(page, 250);
    l = await telefonLage(page);
    check(`${name}: Scan, gescrollt (${l.scrollY} px) – Telefon oben unter dem Header (top ${l.top} px) und ganz sichtbar`, l.zustand === 'scan' && Math.abs(l.top - 112) <= 1.5 && l.bottom <= l.fenster && l.top >= l.kopf, JSON.stringify(l));
    await shot(page, `${name}-1-scan-gescrollt.png`);

    await page.locator('#ki-demo-anruf-knopf[data-zustand="bereit"]').waitFor({ state: 'visible', timeout: 30000 });
    await warte(page, 600);
    await page.locator('#ki-demo-anruf-knopf').scrollIntoViewIfNeeded();
    await warte(page, 200);
    l = await telefonLage(page);
    check(`${name}: bereit, Formular im Blick – Telefon (Karte) sichtbar`, l.top >= l.kopf - 1 && l.bottom <= l.fenster + 1, JSON.stringify(l));
    await shot(page, `${name}-2-bereit-formular.png`);

    await anrufStarten(page);
    await page.locator('#ki-demo-anruf-knopf[data-zustand="verbunden"]').waitFor({ timeout: 30000 });
    await warte(page, 2200);
    // ganz nach unten zur Aktionskarte (Ablauf des Testanrufs)
    await page.evaluate(() => document.querySelector('[aria-label="Ablauf des Testanrufs"]').scrollIntoView({ block: 'end' }));
    await warte(page, 300);
    l = await telefonLage(page);
    const ansicht = await page.evaluate(() => [...document.querySelectorAll('figure [aria-label^="Gesprächsdauer"]')].some((el) => el.closest('[aria-hidden="false"]')));
    check(`${name}: Anruf (verbunden), gescrollt (${l.scrollY} px) – Telefon sichtbar (top ${l.top} px), zeigt Gesprächsdauer`, l.zustand === 'verbunden' && l.top >= l.kopf - 1 && l.bottom <= l.fenster + 1 && ansicht, JSON.stringify(l));
    await shot(page, `${name}-3-anruf-gescrollt.png`);

    if (voll) {
        // Grenze: weiter scrollen, das Telefon endet mit der Bühne (nie im nächsten Abschnitt oder Footer)
        const proben = [];
        for (const dy of [200, 400, 600, 900, 1400, 2400]) {
            await page.evaluate((y) => window.scrollBy(0, y), dy);
            await warte(page, 120);
            proben.push(await telefonLage(page));
        }
        const verletzt = proben.filter((p) => p.bottom > p.buehneBottom + 0.6 || p.bottom > p.heroBottom || p.bottom > p.footerTop);
        const amEnde = proben.find((p) => p.top < 112 - 2);
        check(`${name}: Grenze – Telefon nie unter dem Ende der Bühne/des Abschnitts, nie im Footer`, verletzt.length === 0 && !!amEnde, verletzt.length ? JSON.stringify(verletzt[0]) : `am Ende: top ${amEnde?.top}, bottom ${amEnde?.bottom} = Bühne ${amEnde?.buehneBottom}`);
        await page.evaluate(() => {
            const b = document.querySelector('figure').parentElement.parentElement.getBoundingClientRect();
            window.scrollBy(0, b.bottom - window.innerHeight + 160);
        });
        await warte(page, 200);
        await shot(page, `${name}-4-grenze-ende-buehne.png`);
        // Zurück zum Anfang: Telefon wieder an seinem Platz
        await page.evaluate(() => window.scrollTo(0, 0));
        await warte(page, 200);
        l = await telefonLage(page);
        check(`${name}: oben angekommen – Telefon an seinem Platz in der Bühne`, l.top > 112 + 20, JSON.stringify(l));
        // Ende des Anrufs, danach «Andere Website» → wieder im Fluss
        await page.locator('#ki-demo-anruf-knopf[data-zustand="beendet"]').waitFor({ timeout: 40000 });
        await warte(page, 400);
        await page.click('button:has-text("Andere Website")');
        await warte(page, 300);
        l = await telefonLage(page);
        check(`${name}: «Andere Website» → eingabe, Telefon wieder im Fluss`, l.position === 'static', l.position);
    }
    check(`${name}: Anruf-API abgefangen (kein Auftrag beim Server, kein Anruf)`, abfang.gesendet?.nummer === '+41790000001', JSON.stringify(abfang.gesendet ?? {}).slice(0, 120));
    const c = await cls(page);
    check(`${name}: CLS im ganzen Ablauf ${c.wert.toFixed(4)} (Höhen-Sprünge)`, c.wert === 0, c.quellen.join(' | '));
    check(`${name}: keine Konsolenfehler`, konsole.length === 0, konsole.slice(0, 3).join(' | '));
    await ctx.close();
}

async function statusZeile(page) {
    return page.evaluate(() => {
        const b = document.querySelector('button[data-sichtbar], button[class*="statuszeile"]');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        const s = getComputedStyle(b);
        const [kopf, text] = [...b.querySelectorAll('span.block')].map((x) => x.textContent.trim());
        return { sichtbar: b.dataset.sichtbar === 'true' && s.visibility === 'visible', top: Math.round(r.top), hoehe: Math.round(r.height), kopf, text, transform: s.transform, kopfUnten: Math.round(document.querySelector('header').getBoundingClientRect().bottom) };
    });
}

async function teilT3(browser, { theme, ruhig = false }) {
    const name = `telefon-mobil-375-${theme === 'dark' ? 'dunkel' : 'hell'}${ruhig ? '-ruhig' : ''}`;
    const { ctx, page, konsole } = await neueSeite(browser, { breite: 375, hoehe: 812, theme, mobil: true, ruhig });
    await apiAbfangen(page);
    await page.goto(`${BASE}/ki-telefonassistent`, { waitUntil: 'networkidle' });
    await page.locator('#ki-demo-url').scrollIntoViewIfNeeded();
    await page.fill('#ki-demo-url', 'beispiel-ag.ch');
    const yVorher = await page.evaluate(() => window.scrollY);
    let s = await statusZeile(page);
    check(`${name}: eingabe – keine Statuszeile`, s && !s.sichtbar, JSON.stringify(s));
    await page.tap('#ki-demo-scan-knopf');
    await warte(page, 600);
    s = await statusZeile(page);
    const yScan = await page.evaluate(() => window.scrollY);
    check(`${name}: Scan-Start ohne automatischen Sprung (scrollY ${yVorher} → ${yScan})`, Math.abs(yScan - yVorher) <= 1, `${yVorher} → ${yScan}`);
    check(`${name}: Statuszeile oben (unter dem Header, 48 px) mit Schritt`, s.sichtbar && s.hoehe === 48 && s.top === s.kopfUnten && /^Schritt \d von 7/.test(s.kopf), JSON.stringify(s));
    await page.locator('figure li:has-text("Markenfarbe")').first().waitFor({ timeout: 15000 }).catch(() => undefined);
    await warte(page, 200);
    s = await statusZeile(page);
    check(`${name}: Statuszeile zeigt den Fund («Markenfarbe #1E3A5F»)`, s.sichtbar && /Markenfarbe #1E3A5F/.test(s.text), `${s.kopf} | ${s.text}`);
    if (ruhig) check(`${name}: reduzierte Bewegung – Statuszeile ohne Verschiebung`, s.transform === 'none', s.transform);
    await shot(page, `${name}-1-statuszeile-scan.png`);
    await page.locator('#ki-demo-anruf-knopf[data-zustand="bereit"]').waitFor({ state: 'attached', timeout: 30000 });
    await warte(page, 700);
    const yBereit = await page.evaluate(() => window.scrollY);
    s = await statusZeile(page);
    check(`${name}: bereit – kein automatischer Sprung, Statuszeile «Lena ist bereit»`, Math.abs(yBereit - yVorher) <= 1 && s.sichtbar && s.text === 'Lena ist bereit', `scrollY ${yBereit}; ${s.kopf} | ${s.text}`);
    await shot(page, `${name}-2-statuszeile-bereit.png`);
    await page.tap('button[class*="statuszeile"]');
    await warte(page, ruhig ? 400 : 1100);
    const tel = await telefonLage(page);
    s = await statusZeile(page);
    check(`${name}: Antippen springt zum Telefon (top ${tel.top} px unter dem Header), Statuszeile weg`, Math.abs(tel.top - tel.kopf) <= 4 && !s.sichtbar, `Telefon top ${tel.top}, Header ${tel.kopf}, Statuszeile ${s.sichtbar}`);
    await shot(page, `${name}-3-nach-antippen.png`);
    // Zum Formular: Telefon oben raus → Statuszeile wieder da, Pfeil nach oben
    await page.locator('#ki-demo-nummer').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 120));
    await warte(page, 400);
    s = await statusZeile(page);
    const pfeil = await page.evaluate(() => document.querySelector('button[class*="statuszeile"] span.rounded-full svg')?.getAttribute('class') ?? '');
    check(`${name}: beim Formular wieder sichtbar, Pfeil nach oben`, s.sichtbar && /arrow-up/.test(pfeil), `${s.text} · ${pfeil.slice(0, 40)}`);
    await anrufStarten(page);
    await page.locator('#ki-demo-anruf-knopf[data-zustand="waehlt"]').waitFor({ timeout: 30000 });
    await warte(page, 300);
    s = await statusZeile(page);
    check(`${name}: Anruf – «Ihr Telefon klingelt …»`, s.sichtbar && s.text === 'Ihr Telefon klingelt …', `${s.kopf} | ${s.text}`);
    await page.locator('#ki-demo-anruf-knopf[data-zustand="verbunden"]').waitFor({ timeout: 30000 });
    await warte(page, 2300);
    s = await statusZeile(page);
    check(`${name}: verbunden – Stand und Dauer («Verbunden – 0:0x», «Sie sprechen mit Lena»)`, s.sichtbar && /^Verbunden – 0:0\d$/.test(s.kopf) && s.text === 'Sie sprechen mit Lena', `${s.kopf} | ${s.text}`);
    await shot(page, `${name}-4-statuszeile-anruf.png`);
    // weit nach unten (FAQ): Statuszeile weg
    await page.evaluate(() => document.querySelector('details').scrollIntoView());
    await warte(page, 400);
    s = await statusZeile(page);
    check(`${name}: ausserhalb der Demo (FAQ) keine Statuszeile`, !s.sichtbar);
    const c = await cls(page);
    check(`${name}: CLS im ganzen Ablauf ${c.wert.toFixed(4)}`, c.wert === 0, c.quellen.join(' | '));
    check(`${name}: keine Konsolenfehler`, konsole.length === 0, konsole.slice(0, 3).join(' | '));
    await ctx.close();
}

/* ------------------------------------------------------------------ */
/* Ablauf                                                              */
/* ------------------------------------------------------------------ */
const browser = await chromium.launch({ executablePath: CHROME });
try {
    if (!nurTelefon) {
        await teilM0();
        await teilM1(browser, 'light');
        await teilM1(browser, 'dark');
        await teilM2(browser);
        await teilM3(browser);
        await teilM4(browser);
        await teilM5(browser);
        await teilM6(browser);
        await teilM7(browser, 'light');
        await teilM7(browser, 'dark');
    }
    if (!nurMenue) {
        await teilT1(browser, { theme: 'light', breite: 1440, hoehe: 900, voll: true });
        await teilT1(browser, { theme: 'dark', breite: 1440, hoehe: 900, voll: false });
        await teilT1(browser, { theme: 'light', breite: 1280, hoehe: 720, voll: false });
        await teilT3(browser, { theme: 'light' });
        await teilT3(browser, { theme: 'dark' });
        await teilT3(browser, { theme: 'light', ruhig: true });
    }
} finally {
    await browser.close();
}

const fehler = ergebnisse.filter((e) => !e.ok);
writeFileSync(path.join(SCREENS, `browser-test${nurMenue ? '-menue' : nurTelefon ? '-telefon' : ''}.json`), JSON.stringify({ zeit: new Date().toISOString(), basis: BASE, bestanden: ergebnisse.length - fehler.length, gesamt: ergebnisse.length, ergebnisse }, null, 2));
console.log(`\n${ergebnisse.length - fehler.length}/${ergebnisse.length} bestanden`);
process.exit(fehler.length ? 1 : 0);
