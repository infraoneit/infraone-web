#!/usr/bin/env node
/**
 * auftrag103-browser-test.mjs (AUFTRAG-103, Punkte 6 und 7) — Widget im echten Browser.
 *
 * NUR gegen den zweiten Dev-Server auf Port 3011 (Prozess-Umgebung DEMO_LIMITS_AUS=0,
 * DEMO_ANSTOSS_URL=http://127.0.0.1:9, eigener DEMO_STORE_DIR, Cloudflare-Testschlüssel
 * TURNSTILE_SITE_KEY=1x00000000000000000000AA / TURNSTILE_SECRET=1x0000000000000000000000000000000AA).
 * Kein echter Anruf möglich (Port 9 ist zu, die Anlage holt nur vom Branch-Deploy). Andere Ziele
 * bricht das Skript ab; Anruf-Anfragen an einen anderen Ursprung werden im Browser abgebrochen.
 *
 * Ablauf (ein Browser-Kontext = ein Gerät, Zähler vorher leer):
 *  1. Scan → «bereit»: Turnstile-Widget rendert, Token kommt; Cookie demo_geraet (HttpOnly).
 *  2. Absenden, Antwort künstlich 500 → zurück in «bereit»: ein FRISCHES Widget mit neuem Token.
 *  3. Absenden (echt) → Server akzeptiert Token → 201.
 *  4. Neu laden, Scan, Absenden → 201 (zweiter Anruf des Geräts, frisches Widget).
 *  5. Neu laden, Scan, Absenden → 429: Server-Klartext, Button gesperrt, kein Neuversuch.
 *  6. «Andere Website» → Scan → 429 (4. Scan in der Stunde): Klartext, Scan-Button gesperrt.
 *  7. Server ohne Token → 403 (Token ist Pflicht).
 *
 *   DEMO_STORE_DIR=<Ordner des 3011-Servers> node scripts/auftrag103-browser-test.mjs
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3011';
const ziel = new URL(BASE);
if (!['localhost', '127.0.0.1'].includes(ziel.hostname) || ziel.port !== '3011' || ziel.protocol !== 'http:') {
    console.error('Abbruch: Dieser Test sendet Anruf-Aufträge und läuft NUR gegen http://localhost:3011.');
    process.exit(2);
}
const STORE = process.env.DEMO_STORE_DIR ? path.resolve(process.env.DEMO_STORE_DIR) : null;
if (!STORE) {
    console.error('Abbruch: DEMO_STORE_DIR (Speicher des 3011-Servers) angeben.');
    process.exit(2);
}
const CHROME = process.env.PLAYWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SEITE = `${BASE}/ki-telefonassistent`;
const ERGEBNISSE = path.resolve(ROOT, '..', 'auftraege', 'ergebnisse');
const SCREENS = path.join(ERGEBNISSE, 'A103-screens');
mkdirSync(SCREENS, { recursive: true });
const SITE = 'infraone.ch';
const NUMMER = '044 552 03 06';
const MELDUNG_ANRUF = 'Von diesem Gerät wurden heute bereits zwei Testanrufe angefordert. Gerne zeigen wir Ihnen den Assistenten persönlich: 052 222 18 18.';
const MELDUNG_SCAN_STUNDE = 'Sie haben in der letzten Stunde bereits drei Websites getestet. Bitte versuchen Sie es später wieder oder rufen Sie uns an: 052 222 18 18.';

const ergebnisse = [];
function pruefe(name, ok, detail = '') {
    ergebnisse.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 200) : ''}`);
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = path.join(STORE, 'limit');
if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'de-CH' });
const page = await ctx.newPage();
const konsole = [];
// Belege ohne Rufnummer: das Nummernfeld wird in Screenshots abgedeckt
const nummerMaske = () => [page.locator('#ki-demo-nummer')];
page.on('pageerror', (e) => konsole.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && konsole.push(m.text()));

/* Anfragen mitschreiben; Anruf nur an den eigenen Ursprung, die erste Anfrage künstlich mit 500 beantworten */
const anrufe = [];
const scans = [];
let kuenstlich500 = true;
await page.route('**/api/demo/anruf', async (route) => {
    const req = route.request();
    if (new URL(req.url()).origin !== ziel.origin) return route.abort();
    let body = {};
    try {
        body = JSON.parse(req.postData() || '{}');
    } catch {
        /* leer */
    }
    const eintrag = { zeit: Date.now(), token: typeof body.turnstile === 'string' ? body.turnstile : null, status: null };
    anrufe.push(eintrag);
    if (kuenstlich500) {
        kuenstlich500 = false;
        eintrag.status = 500;
        eintrag.kuenstlich = true;
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ fehler: 'Test: künstlicher Serverfehler.' }) });
    }
    const res = await route.fetch();
    eintrag.status = res.status();
    return route.fulfill({ response: res });
});
page.on('request', (r) => r.url().endsWith('/api/demo/scan') && r.method() === 'POST' && scans.push({ zeit: Date.now() }));
// Widget-Rahmen von Cloudflare (je gerendertem Widget ein Abruf mit dem Site-Key)
let widgetRahmen = 0;
page.on('request', (r) => r.url().startsWith('https://challenges.cloudflare.com/') && r.url().includes('/turnstile/') && r.url().includes('1x00000000000000000000AA') && widgetRahmen++);

async function scanne() {
    await page.fill('#ki-demo-url', SITE);
    await page.click('#ki-demo-scan-knopf');
}
async function warteBereit() {
    await page.waitForSelector('#ki-demo-anruf-knopf[data-zustand="bereit"]', { timeout: 90_000 });
}
/**
 * Wartet auf ein Turnstile-Widget im Anruf-Formular und dessen Token. Die Testschlüssel liefern
 * immer dasselbe Platzhalter-Token; ein FRISCHES Widget erkennt man an der Kennung des
 * Antwortfelds (cf-chl-widget-…), die je Widget neu vergeben wird (`alteKennung` ausschliessen).
 */
async function turnstileToken(alteKennung = null) {
    const t0 = Date.now();
    // Das iframe liegt in einem geschlossenen Shadow-Root; sichtbar sind das Antwortfeld und der Abruf des Widget-Rahmens
    await page.waitForSelector('form input[name="cf-turnstile-response"]', { state: 'attached', timeout: 30_000 });
    const h = await page.waitForFunction(
        (alt) => {
            const i = document.querySelector('form input[name="cf-turnstile-response"]');
            return i && i.value && i.id && i.id !== alt ? { token: i.value, kennung: i.id } : null;
        },
        alteKennung,
        { timeout: 30_000 },
    );
    const { token, kennung } = await h.jsonValue();
    return { token, kennung, ms: Date.now() - t0, widgets: await page.locator('form input[name="cf-turnstile-response"]').count(), rahmen: widgetRahmen };
}
async function formularAusfuellen() {
    await page.fill('#ki-demo-nummer', NUMMER);
    const haken = page.locator('#ki-demo-einwilligung');
    if (!(await haken.isChecked())) await haken.check();
}

/* 1. Scan → bereit → Turnstile */
await page.goto(SEITE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#ki-demo-url');
await scanne();
await warteBereit();
const w1 = await turnstileToken();
const cookies = await ctx.cookies(BASE);
const geraetCookie = cookies.find((c) => c.name === 'demo_geraet');
pruefe('Cookie demo_geraet nach dem ersten Scan: HttpOnly, SameSite=Lax, Pfad /', geraetCookie && geraetCookie.httpOnly && geraetCookie.sameSite === 'Lax' && geraetCookie.path === '/' && /^[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/.test(geraetCookie.value));
pruefe('Turnstile: Widget rendert im Zustand «bereit» (Rahmen von Cloudflare geladen), Token kommt', w1.widgets === 1 && w1.rahmen >= 1 && !!w1.token, `Token nach ${w1.ms} ms, ${w1.token?.length ?? 0} Zeichen`);
await formularAusfuellen();
await page.locator('#ki-demo-anruf-knopf').scrollIntoViewIfNeeded();
await pause(800);
await page.screenshot({ path: path.join(SCREENS, 'turnstile-widget-bereit.png'), mask: nummerMaske() });

/* 2. künstliche 500 → frisches Widget */
await page.click('#ki-demo-anruf-knopf');
await warteBereit();
const fehlerText = await page.locator('form p[role="alert"]').first().textContent();
const w2 = await turnstileToken(w1.kennung);
pruefe('Nach Fehler (500) zurück in «bereit»: Meldung, frisches Widget (neue Kennung, neuer Rahmen), Token', fehlerText?.includes('künstlicher Serverfehler') && w2.widgets === 1 && !!w2.token && w2.kennung !== w1.kennung && w2.rahmen > w1.rahmen, `Widgets ${w2.widgets}, Rahmen ${w1.rahmen}→${w2.rahmen}, Token nach ${w2.ms} ms`);
pruefe('Erste Anfrage trug das Token des ersten Widgets', anrufe[0]?.token === w1.token);

/* 3. echt absenden → Server akzeptiert */
const antwort1 = page.waitForResponse((r) => r.url().endsWith('/api/demo/anruf'), { timeout: 30_000 });
await page.click('#ki-demo-anruf-knopf');
await page.waitForSelector('#ki-demo-anruf-knopf[data-zustand="wartend"]', { timeout: 30_000 });
await antwort1;
pruefe('Turnstile: Token kommt mit, Server akzeptiert (201)', anrufe[1]?.status === 201 && anrufe[1]?.token === w2.token && !!w2.token, `Status ${anrufe[1]?.status}`);

/* 4. neu laden, zweiter Anruf */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#ki-demo-url');
await scanne();
await warteBereit();
const w3 = await turnstileToken();
await formularAusfuellen();
const antwort2 = page.waitForResponse((r) => r.url().endsWith('/api/demo/anruf'), { timeout: 30_000 });
await page.click('#ki-demo-anruf-knopf');
await page.waitForSelector('#ki-demo-anruf-knopf[data-zustand="wartend"]', { timeout: 30_000 });
await antwort2;
pruefe('Zweiter Anruf des Geräts: frisches Widget, 201', anrufe[2]?.status === 201 && anrufe[2]?.token === w3.token, `Status ${anrufe[2]?.status}`);

/* 5. neu laden, dritter Anruf → 429, gesperrt */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#ki-demo-url');
await scanne();
await warteBereit();
await turnstileToken();
await formularAusfuellen();
await page.click('#ki-demo-anruf-knopf');
await page.waitForSelector('#ki-demo-anruf-knopf[data-gesperrt="true"]', { timeout: 30_000 });
const anrufText = (await page.locator('form p[role="alert"]').first().textContent())?.trim();
const knopf = page.locator('#ki-demo-anruf-knopf');
const zustandAnruf = {
    status: anrufe[3]?.status,
    text: anrufText,
    disabled: await knopf.isDisabled(),
    zustand: await knopf.getAttribute('data-zustand'),
    fieldset: await page.evaluate(() => document.querySelector('#ki-demo-anruf-knopf')?.closest('form')?.querySelector('fieldset')?.disabled === true),
    widgets: await page.locator('form input[name="cf-turnstile-response"]').count(),
    deckkraft: await knopf.evaluate((e) => getComputedStyle(e).opacity),
};
pruefe('Anruf 429: Server-Klartext wortgleich angezeigt', zustandAnruf.status === 429 && zustandAnruf.text === MELDUNG_ANRUF, zustandAnruf.text);
pruefe('Anruf 429: Button gesperrt (disabled, data-gesperrt), Felder gesperrt, kein Turnstile', zustandAnruf.disabled && zustandAnruf.zustand === 'bereit' && zustandAnruf.fieldset && zustandAnruf.widgets === 0 && zustandAnruf.deckkraft === '0.5', JSON.stringify({ ...zustandAnruf, text: undefined }));
await page.locator('#ki-demo-anruf-titel').scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(SCREENS, 'anruf-429-gesperrt.png'), mask: nummerMaske() });
const anrufeVorher = anrufe.length;
await pause(5000);
await knopf.click({ force: true }).catch(() => undefined);
await page.evaluate(() => document.querySelector('#ki-demo-anruf-knopf')?.closest('form')?.requestSubmit());
await pause(1500);
pruefe('Anruf 429: kein automatischer Neuversuch, Klick/Absenden ohne Anfrage (6,5 s beobachtet)', anrufe.length === anrufeVorher, `${anrufe.length - anrufeVorher} weitere Anfragen`);

/* 6. «Andere Website» → Scan → 429 (4. Scan in der Stunde) */
await page.getByRole('button', { name: 'Andere Website' }).click();
await page.waitForSelector('#ki-demo-scan-knopf');
const scansVorher = scans.length;
await scanne();
await page.waitForSelector('#ki-demo-scan-knopf[data-gesperrt="true"]', { timeout: 30_000 });
const scanText = (await page.locator('#ki-demo-url-fehler').textContent())?.trim();
const scanKnopf = page.locator('#ki-demo-scan-knopf');
pruefe('Scan 429: Server-Klartext wortgleich (4. Scan in der Stunde)', scanText === MELDUNG_SCAN_STUNDE, scanText);
const scanDeckkraft = await scanKnopf.evaluate((e) => getComputedStyle(e).opacity);
pruefe('Scan 429: Scan-Button gesperrt und sichtbar abgeblendet', (await scanKnopf.isDisabled()) && (await scanKnopf.getAttribute('data-zustand')) === 'eingabe' && scanDeckkraft === '0.5', `Deckkraft ${scanDeckkraft}`);
await page.screenshot({ path: path.join(SCREENS, 'scan-429-gesperrt.png'), mask: nummerMaske() });
const scansNach429 = scans.length;
await pause(5000);
await scanKnopf.click({ force: true }).catch(() => undefined);
await page.evaluate(() => document.querySelector('#ki-demo-scan-knopf')?.closest('form')?.requestSubmit());
await page.press('#ki-demo-url', 'Enter');
await pause(1500);
pruefe('Scan 429: kein automatischer Neuversuch, Klick/Enter ohne Anfrage (6,5 s beobachtet)', scansNach429 - scansVorher === 1 && scans.length === scansNach429, `${scans.length - scansNach429} weitere Anfragen`);

/* 7. Server: ohne Token → 403 (kein Zählen, kein Auftrag) */
{
    const res = await fetch(`${BASE}/api/demo/anruf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.77' },
        body: JSON.stringify({ scan_id: 's-gibtesnicht0000', nummer: NUMMER, sprache: 'hochdeutsch', einwilligung: true, honigtopf: '' }),
    });
    const d = await res.json().catch(() => ({}));
    pruefe('Turnstile aktiv: Anruf ohne Token → 403 mit Klartext', res.status === 403 && d.fehler === 'Die Sicherheitsprüfung hat nicht geklappt. Bitte laden Sie die Seite neu.', `${res.status}`);
}
// Erwartet: der Browser meldet jede beabsichtigte Fehlerantwort (künstliche 500, 429 Anruf, 429 Scan) als «Failed to load resource»
const erwartet = (z) => /^Failed to load resource: the server responded with a status of (500|429) /.test(z);
const unerwartet = konsole.filter((z) => !erwartet(z));
pruefe('Konsole: keine Seitenfehler; nur die 3 erwarteten «Failed to load resource» (500, 429, 429)', unerwartet.length === 0 && konsole.length - unerwartet.length === 3, konsole.join(' | '));

await browser.close();
const ok = ergebnisse.filter((e) => e.ok).length;
writeFileSync(
    path.join(SCREENS, 'browser-test.json'),
    JSON.stringify(
        {
            erzeugt: new Date().toISOString(),
            ziel: BASE,
            hinweis: 'Turnstile mit Cloudflare-Testschlüsseln; Testnummer laut Auftrag (nicht im Beleg); Anstoss an Port 9 des eigenen Rechners (zu) — kein Anruf möglich.',
            ergebnisse,
            anrufe: anrufe.map((a, i) => ({ nr: i + 1, status: a.status, kuenstlich: !!a.kuenstlich, token_mit: !!a.token, token_laenge: a.token?.length ?? 0 })),
            scans: scans.length,
            konsole,
        },
        null,
        2,
    ),
);
console.log(`\n${ok}/${ergebnisse.length} bestanden.`);
process.exit(ok === ergebnisse.length ? 0 : 1);
