// AUFTRAG-009 Browser-Selbsttest: SupportKostenRechner Modus «Fixkosten senken»
// Fährt Chrome headless über CDP (nur Node-Bordmittel, keine Dependencies).
// Voraussetzung: Produktionsserver läuft auf http://localhost:3000 (npm start).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3100';
const SHOTS = 'C:/Users/admin/Documents/kimi/workspace/infraone-web/auftraege/ergebnisse/raw';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;

mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=C:/Users/admin/Documents/kimi/workspace/infraone-web/repo/.chrome-test-profile',
    'about:blank',
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();

function send(method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = ++msgId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
    });
}

async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
    });
    if (res.exceptionDetails) {
        throw new Error('Evaluate-Fehler: ' + JSON.stringify(res.exceptionDetails).slice(0, 500));
    }
    return res.result.value;
}

async function connect() {
    for (let i = 0; i < 30; i++) {
        try {
            const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
            const page = list.find((t) => t.type === 'page');
            if (page) {
                ws = new WebSocket(page.webSocketDebuggerUrl);
                await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
                ws.onmessage = (ev) => {
                    const msg = JSON.parse(ev.data);
                    if (msg.id && pending.has(msg.id)) {
                        const p = pending.get(msg.id);
                        pending.delete(msg.id);
                        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
                    }
                };
                return;
            }
        } catch { /* noch nicht bereit */ }
        await sleep(500);
    }
    throw new Error('Chrome CDP nicht erreichbar');
}

// Helfer, der im Browser läuft: React-konforme Eingabe + Ergebnistext auslesen
const BROWSER_HELPERS = `
window.__setVal = (id, v) => {
    const el = document.getElementById(id);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
};
window.__resultText = () => {
    const secs = [...document.querySelectorAll('section')];
    const sec = secs.find(s => s.textContent.includes('Was liegt an?'));
    if (!sec) return 'SECTION NOT FOUND';
    sec.querySelectorAll('details').forEach(d => { d.open = true; });
    return sec.innerText;
};
window.__ctaHref = () => {
    const a = [...document.querySelectorAll('a')].find(x => x.textContent.includes('Angaben ins Kontaktformular übernehmen'));
    return a ? a.getAttribute('href') : null;
};
window.__decodeMessage = () => {
    const href = window.__ctaHref();
    if (!href) return null;
    return new URLSearchParams(href.split('?')[1]).get('message');
};
`;

const results = [];
function check(name, ok, detail = '') {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

try {
    await connect();
    await send('Page.enable');
    await send('Runtime.enable');

    // ---------- /it-support ----------
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE}/it-support` });
    await sleep(4000);
    await evaluate(BROWSER_HELPERS);

    // S0: Standard-Modus ist «Fixkosten senken», bei leeren Feldern keine Ersparnis-Behauptung
    let t = await evaluate('window.__resultText()');
    check('Standard-Modus Fixkosten vorausgewählt', t.includes('Was zahlen Sie heute für Telefon und Internet?'));
    check('Leere Felder → Alternativtext, keine Ersparnis', t.includes('Rechnen wir gemeinsam nach') && !t.includes('Sie sparen voraussichtlich'));

    // S1: Rechenbeispiel 8 Benutzer, 320 + 89, Flat CH, Internet an
    await evaluate(`window.__setVal('telefon-benutzer', '8'); window.__setVal('heute-telefonie', '320'); window.__setVal('heute-internet', '89');`);
    await sleep(400);
    t = await evaluate('window.__resultText()');
    check('Rechenbeispiel Paket CHF 138', t.includes('CHF 138'), t.match(/Ihr InfraOne-Paket:[^\n]*\n[^\n]*/)?.[0]?.replace(/\n/g, ' '));
    check("Rechenbeispiel Ersparnis CHF 271/Mt + CHF 3'252/Jahr", t.includes('CHF 271') && t.includes("CHF 3'252"));
    check('Baustein-Liste vorhanden', t.includes('vPBX BASIC') && t.includes('Benutzerpaket 6–10') && t.includes('Flatrate CH'));
    check('24-Monate-Hinweis sichtbar', t.includes('24 Monaten Laufzeit'));
    check('Upsell-Zeile IT-Dienstleistungsvertrag', t.includes('IT-Dienstleistungsvertrag ab CHF 200'));
    check('Marktvergleich CHF 280 Fussnote', t.includes('rund CHF 280 pro Benutzer und Monat'));

    // S2: Prefill enthält Ersparnis-Zeile
    const msg = await evaluate('window.__decodeMessage()');
    check('Prefill enthält Ersparnis-Zeile', !!msg && msg.includes('Voraussichtliche Ersparnis: CHF 271 pro Monat') && msg.includes("CHF 3'252 pro Jahr"));
    check('Prefill enthält alle Eingaben', !!msg && msg.includes('Anzahl Telefon-Benutzer: 8') && msg.includes('Heutige Telefoniekosten') && msg.includes('Flatrate') && msg.includes('Glasfaser-Internet'));
    console.log('--- Prefill-Nachricht ---\n' + msg + '\n-------------------------');

    // S3: Grenzfall negative Ersparnis (heute günstiger: 50 + 30 = 80 < 138)
    await evaluate(`window.__setVal('heute-telefonie', '50'); window.__setVal('heute-internet', '30');`);
    await sleep(400);
    t = await evaluate('window.__resultText()');
    check('Negative Ersparnis → keine Behauptung, Alternativtext', !t.includes('Sie sparen voraussichtlich') && t.includes('Rechnen wir gemeinsam nach'));

    // S4: 11 Benutzer → PLUS 25 + Paket 11–20 55 → 25+55+19+10+49+10 = 168
    await evaluate(`window.__setVal('telefon-benutzer', '11');`);
    await sleep(400);
    t = await evaluate('window.__resultText()');
    check('11 Benutzer → CHF 168 (PLUS + Paket 11–20)', t.includes('CHF 168') && t.includes('vPBX PLUS') && t.includes('Benutzerpaket 11–20'));

    // S5: 35 Benutzer → Offerten-Pfad ohne Summe
    await evaluate(`window.__setVal('telefon-benutzer', '35');`);
    await sleep(400);
    t = await evaluate('window.__resultText()');
    check('35 Benutzer → Offerten-Pfad ohne Summe', t.includes('Für Ihre Grösse rechnen wir individuell') && !t.includes('Ihr InfraOne-Paket:'));

    // S6: Bestehende Modi funktionieren weiter (Modus 2: Ein akutes Problem)
    await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Ein akutes Problem')?.click();`);
    await sleep(400);
    t = await evaluate('window.__resultText()');
    check('Modus «Ein akutes Problem» wählbar', t.includes('Fernzugriff reicht vermutlich') || t.includes('Bei uns vor Ort'));

    // S7: 375 px Mobile
    await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Fixkosten senken')?.click();`);
    await sleep(300);
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await sleep(800);
    const overflow = await evaluate('document.documentElement.scrollWidth');
    check('375px: kein Horizontal-Overflow', overflow <= 376, `scrollWidth=${overflow}`);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag009-it-support-375px.png`, Buffer.from(shot.data, 'base64'));
    console.log('Screenshot: auftrag009-it-support-375px.png');

    // ---------- /cloud-telefonie ----------
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE}/cloud-telefonie` });
    await sleep(4000);
    await evaluate(BROWSER_HELPERS);
    t = await evaluate('window.__resultText()');
    check('Cloud-Telefonie: Rechner eingebunden, Fixkosten vorausgewählt', t.includes('Was zahlen Sie heute für Telefon und Internet?') && t.includes('Ihr InfraOne-Paket'));
    // Position: Rechner-Section muss vor der Peoplefone-Produkt-Section stehen
    const order = await evaluate(`(() => {
        const secs = [...document.querySelectorAll('section')];
        const iRechner = secs.findIndex(s => s.textContent.includes('Was liegt an?'));
        const iPeoplefone = secs.findIndex(s => s.textContent.includes('Peoplefone vPBX'));
        const iHero = secs.findIndex(s => s.textContent.includes('Cloud-Telefonanlagen') && s.querySelector('h1'));
        return JSON.stringify({ iHero, iRechner, iPeoplefone });
    })()`);
    const pos = JSON.parse(order);
    check('Cloud-Telefonie: Position nach Hero, vor Produktbereichen', pos.iHero < pos.iRechner && pos.iRechner < pos.iPeoplefone, order);
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag009-cloud-telefonie-rechner.png`, Buffer.from(shot2.data, 'base64'));
    console.log('Screenshot: auftrag009-cloud-telefonie-rechner.png');
} catch (err) {
    console.error('TESTFEHLER:', err.message);
    results.push({ name: 'Skript ohne Absturz', ok: false, detail: err.message });
} finally {
    try { ws?.close(); } catch {}
    chrome.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ERGEBNIS: ${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL ===`);
process.exit(failed.length ? 1 : 0);
