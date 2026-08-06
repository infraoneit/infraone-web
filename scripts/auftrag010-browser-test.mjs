// AUFTRAG-010 Browser-Selbsttest: Rechner v3 (Rufnummern, Betreuungs-Assistent,
// Kontakt-Gate, Kombi-Pfad, Direktversand mit Mock + echtem Fehlerpfad).
// Fährt Chrome headless über CDP (nur Node-Bordmittel, keine Dependencies).
// Voraussetzung: Produktionsserver läuft auf http://localhost:3100 (npm start -- -p 3100).
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
        throw new Error('Evaluate-Fehler: ' + JSON.stringify(res.exceptionDetails).slice(0, 600));
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

const BROWSER_HELPERS = `
window.__setVal = (id, v) => {
    const el = document.getElementById(id);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
};
window.__setPlaceholder = (ph, v) => {
    const el = [...document.querySelectorAll('input')].find(i => i.placeholder === ph);
    if (!el) throw new Error('Input nicht gefunden: ' + ph);
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
window.__clickModus = (label) => {
    [...document.querySelectorAll('button')].find(b => b.textContent.trim() === label)?.click();
};
window.__clickJaIn = (legendText) => {
    const fs = [...document.querySelectorAll('fieldset')].find(f => f.textContent.includes(legendText));
    if (!fs) throw new Error('Fieldset nicht gefunden: ' + legendText);
    [...fs.querySelectorAll('button')].find(b => b.textContent.trim() === 'Ja')?.click();
};
window.__clickNeinIn = (legendText) => {
    const fs = [...document.querySelectorAll('fieldset')].find(f => f.textContent.includes(legendText));
    if (!fs) throw new Error('Fieldset nicht gefunden: ' + legendText);
    [...fs.querySelectorAll('button')].find(b => b.textContent.trim() === 'Nein')?.click();
};
window.__clickOptionIn = (legendText, label) => {
    const fs = [...document.querySelectorAll('fieldset')].find(f => f.textContent.includes(legendText));
    if (!fs) throw new Error('Fieldset nicht gefunden: ' + legendText);
    [...fs.querySelectorAll('button')].find(b => b.textContent.trim() === label)?.click();
};
window.__setCheckbox = (labelText, checked) => {
    const lbl = [...document.querySelectorAll('label')].find(l => l.textContent.includes(labelText));
    if (!lbl) throw new Error('Checkbox nicht gefunden: ' + labelText);
    const cb = lbl.querySelector('input[type=checkbox]');
    if (cb.checked !== checked) cb.click();
};
window.__clickButton = (text) => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes(text));
    if (!b) throw new Error('Button nicht gefunden: ' + text);
    b.click();
};
window.__installFetchMock = () => {
    window.__fetchCalls = [];
    if (!window.__origFetch) window.__origFetch = window.fetch;
    window.fetch = (url, opts) => {
        window.__fetchCalls.push({ url: String(url), body: opts && opts.body ? String(opts.body) : null });
        return Promise.resolve(new Response('ok', { status: 200 }));
    };
};
window.__restoreFetch = () => {
    if (window.__origFetch) window.fetch = window.__origFetch;
};
window.__formCalls = () => window.__fetchCalls.filter(c => c.url.includes('__forms.html'));
window.__lastPayload = () => {
    const calls = window.__formCalls();
    if (!calls.length) return null;
    const p = new URLSearchParams(calls[calls.length - 1].body);
    const o = {};
    for (const [k, v] of p.entries()) o[k] = v;
    return o;
};
`;

const results = [];
function check(name, ok, detail = '') {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);
}

try {
    await connect();
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE}/it-support` });
    await sleep(4000);
    await evaluate(BROWSER_HELPERS);

    // ============ A: Sparmodus-Handrechnung a) ============
    await evaluate(`window.__setVal('telefon-benutzer', '8'); window.__clickOptionIn('Anzahl Rufnummern', '10');`);
    await sleep(400);
    let t = await evaluate('window.__resultText()');
    check('a) 8 Benutzer + 10 Rufnummern + Flat CH + Internet = CHF 148', t.includes('CHF 148'),
        t.match(/Ihr InfraOne-Paket:[^\n]*\n[^\n]*/)?.[0]?.replace(/\n/g, ' '));
    check('a) Baustein «10 Rufnummern (DIDs)» CHF 20', t.includes('10 Rufnummern (DIDs)') && t.includes('CHF 20'));
    check('Rufnummern-Feld mit 5er-Block-Hinweis', t.includes('Anzahl Rufnummern') && t.includes('5er-Block'));
    check('Kombi-Checkbox vorhanden', t.includes('Ich interessiere mich zusätzlich für laufende IT-Betreuung'));
    check('Sparergebnis ohne E-Mail sichtbar (Versprechen)', t.includes('Ihr InfraOne-Paket'));

    // Standard 5 Rufnummern = CHF 138 (Rückrechnung alte Zahl aus AUFTRAG-009)
    await evaluate(`window.__clickOptionIn('Anzahl Rufnummern', '5');`);
    await sleep(300);
    t = await evaluate('window.__resultText()');
    check('Standard 5 Rufnummern → CHF 138 (wie AUFTRAG-009)', t.includes('CHF 138'));
    await evaluate(`window.__clickOptionIn('Anzahl Rufnummern', '10');`);
    await sleep(300);

    // Versand-Knopf: kein /kontakt-Verweis im Sparmodus
    const kontaktLinks = await evaluate(`(() => {
        const secs = [...document.querySelectorAll('section')];
        const sec = secs.find(s => s.textContent.includes('Was liegt an?'));
        return [...sec.querySelectorAll('a')].filter(a => (a.getAttribute('href')||'').startsWith('/kontakt')).length;
    })()`);
    check('Sparmodus: kein Link auf /kontakt sichtbar', kontaktLinks === 0, `Links=${kontaktLinks}`);

    // ============ B: Betreuungs-Modus — Fehlerpfad REAL (kein Mock) ============
    await evaluate(`window.__clickModus('Regelmässige Betreuung');`);
    await sleep(500);
    t = await evaluate('window.__resultText()');
    check('Assistent Schritt 1: alle Konfig-Felder', t.includes('Anzahl Arbeitsplätze') && t.includes('Anzahl Standorte')
        && t.includes('Anzahl Server') && t.includes('Netzwerk-Management durch InfraOne')
        && t.includes('Erweiterte Security') && t.includes('Microsoft 365 / Teams')
        && t.includes('Regelmässiger Vor-Ort-Support') && t.includes('Heute betreut durch'));
    check('Grundschutz-Info bei erweiterter Security', t.includes('Grundschutz (Virenschutz, Firewall, Updates) ist immer inbegriffen.'));
    check('Gate-Überschrift «Ihr Richtpreis ist bereit»', t.includes('Ihr Richtpreis ist bereit'));
    check('Gate-Text wörtlich', t.includes('Sagen Sie uns noch, wer Sie sind') && t.includes('senden Ihnen die Aufstellung unverbindlich zu.'));
    check('Gate-Datenschutz-Zeile', t.includes('Ihre Angaben gehen ausschliesslich an uns (info@infraone.ch)') && t.includes('/datenschutz'));
    check('GATE: Richtpreis NICHT sichtbar vor Versand', !t.includes('Ihr Richtpreis:'));

    // Handrechnung b) konfigurieren: 10 AP, 2 Server, 2 Standorte, Netzwerk ja, ext. Security ja
    await evaluate(`
        window.__setVal('arbeitsplaetze', '10');
        window.__setVal('anzahl-server', '2');
        window.__setVal('standorte', '2');
        window.__clickJaIn('Netzwerk-Management durch InfraOne');
        window.__clickJaIn('Erweiterte Security');
        window.__setPlaceholder('Name*', 'Test Person');
        window.__setPlaceholder('Firma*', 'Test AG');
        window.__setPlaceholder('E-Mail*', 'test@example.ch');
        window.__setPlaceholder('Telefon (optional)', '052 000 00 00');
    `);
    await sleep(300);
    await evaluate(`window.__clickButton('Richtpreis anzeigen');`);
    await sleep(1500);
    t = await evaluate('window.__resultText()');
    check('FEHLERPFAD real: Fehlermeldung erscheint', t.includes('Das hat leider nicht geklappt'));
    check('FEHLERPFAD real: Richtpreis bleibt verborgen', !t.includes('Ihr Richtpreis:'));
    const fallbackHref = await evaluate(`(() => {
        const secs = [...document.querySelectorAll('section')];
        const sec = secs.find(s => s.textContent.includes('Was liegt an?'));
        const a = [...sec.querySelectorAll('a')].find(x => (x.getAttribute('href')||'').startsWith('/kontakt'));
        return a ? a.getAttribute('href') : null;
    })()`);
    check('FEHLERPFAD real: Fallback-Link auf vorbefülltes /kontakt', !!fallbackHref && fallbackHref.includes('message=') && fallbackHref.includes('subject='),
        fallbackHref ? fallbackHref.slice(0, 120) : 'kein Link');

    // ============ C: Erfolgspfad mit FETCH-MOCK — Handrechnung b) ============
    await evaluate(`window.__installFetchMock();`);
    await sleep(200);
    await evaluate(`window.__clickButton('Richtpreis anzeigen');`);
    await sleep(1000);
    t = await evaluate('window.__resultText()');
    check('GATE: Richtpreis erscheint ERST nach Gate + Versand(-Mock)', t.includes('Ihr Richtpreis:'));
    check("b) 10 AP, 2 Server, 2 Standorte, Netzwerk ja, ext. Sec ja = CHF 2'720", t.includes("CHF 2'720"),
        t.match(/Ihr Richtpreis:[^\n]*/)?.[0]);
    check('b) Anzeige-Text wörtlich', t.includes('Betrieb, Support und Verwaltung – Hardware und Lizenzen nach Aufwand.')
        && t.includes('Verbindliche Offerte innert zwei Arbeitstagen. Monatlich kündbar, keine Mindestlaufzeit.'));
    check('b) Positionsliste: Arbeitsplätze × 252 + Zuschläge einzeln', t.includes('10 Arbeitsplätze × CHF 252')
        && t.includes('1 Zusatzstandorte (ab dem 2.) × CHF 50') && t.includes('Erweiterte Security'));
    check('Erfolgs-Bestätigung wörtlich', t.includes('Danke! Ihre Anfrage ist bei uns – Sie hören innert eines Arbeitstages von uns.')
        && t.includes('052 222 18 18'));

    const payload = await evaluate('window.__lastPayload()');
    check('VERSAND: Feldnamen identisch mit __forms.html',
        !!payload && payload['form-name'] === 'contact' && payload['bot-field'] === ''
        && typeof payload.name === 'string' && typeof payload.company === 'string'
        && typeof payload.email === 'string' && typeof payload.phone === 'string'
        && typeof payload.subject === 'string' && typeof payload.message === 'string',
        payload ? Object.keys(payload).join(',') : 'kein Payload');
    check('VERSAND: subject = «IT-Support und Netzwerke»', payload && payload.subject === 'IT-Support und Netzwerke');
    check('VERSAND: Gate-Werte im Payload', payload && payload.name === 'Test Person' && payload.company === 'Test AG'
        && payload.email === 'test@example.ch' && payload.phone === '052 000 00 00');
    check('VERSAND: message enthält Modus-Titel + Beträge + alle Werte',
        payload && payload.message.includes('Regelmässige Betreuung') && payload.message.includes("CHF 2'720")
        && payload.message.includes('Anzahl Arbeitsplätze: 10') && payload.message.includes('Anzahl Standorte: 2')
        && payload.message.includes('Anzahl Server: 2') && payload.message.includes('Netzwerk-Management durch InfraOne')
        && payload.message.includes('Microsoft 365 / Teams im Einsatz: Nein')
        && payload.message.includes('Heute betreut durch: Niemand fest'));
    console.log('--- message (Betreuung b) ---\n' + (payload?.message || '') + '\n-----------------------------');

    // ============ D: Handrechnungen c) und d) (live-Neurechnung) ============
    await evaluate(`
        window.__setVal('arbeitsplaetze', '4');
        window.__setVal('anzahl-server', '5');
        window.__setVal('standorte', '1');
        window.__clickNeinIn('Erweiterte Security');
    `);
    await sleep(400);
    t = await evaluate('window.__resultText()');
    check("c) 4 AP, 5 Server = 4×252 + 2×150 = CHF 1'308", t.includes("CHF 1'308"), t.match(/Ihr Richtpreis:[^\n]*/)?.[0]);
    check('c) Positionsliste: 2 Zusatzserver', t.includes('2 Zusatzserver (ab dem 4.) × CHF 150'));

    await evaluate(`window.__setVal('arbeitsplaetze', '1'); window.__setVal('anzahl-server', '0');`);
    await sleep(400);
    t = await evaluate('window.__resultText()');
    check('d) 1 AP, nichts = max(252, 200) = CHF 252', t.includes('Ihr Richtpreis: CHF 252 pro Monat'));

    // ============ E: Kombi-Pfad (Sparergebnis + Assistent, EIN Versand) ============
    await evaluate(`window.__clickModus('Fixkosten senken');`);
    await sleep(400);
    await evaluate(`window.__setCheckbox('laufende IT-Betreuung', true);`);
    await sleep(500);
    t = await evaluate('window.__resultText()');
    check('KOMBI: Sparergebnis bleibt sichtbar', t.includes('Ihr InfraOne-Paket'));
    check('KOMBI: Assistent erscheint nach Sparergebnis', t.includes('Anzahl Arbeitsplätze') && t.includes('Ihr Richtpreis ist bereit'));
    check('KOMBI: Richtpreis noch verborgen (Gate)', !t.includes('Ihr Richtpreis:'));

    // Reihenfolge: Sparergebnis vor Assistent
    const order = await evaluate(`(() => {
        const secs = [...document.querySelectorAll('section')];
        const sec = secs.find(s => s.textContent.includes('Was liegt an?'));
        const txt = sec.innerText;
        return txt.indexOf('Ihr InfraOne-Paket') < txt.indexOf('Anzahl Arbeitsplätze');
    })()`);
    check('KOMBI: Sparergebnis steht ÜBER dem Assistenten', order === true);

    const callsBefore = await evaluate('window.__formCalls().length');
    // Betreuung b)-Konfiguration erneut setzen (State wurde beim Moduswechsel nicht zurückgesetzt, aber sicher ist sicher)
    await evaluate(`
        window.__setVal('arbeitsplaetze', '10');
        window.__setVal('anzahl-server', '2');
        window.__setVal('standorte', '2');
        window.__clickJaIn('Erweiterte Security');
    `);
    await sleep(400); // React-State muss vor dem Submit gerendert sein
    await evaluate(`window.__clickButton('Richtpreis anzeigen');`);
    await sleep(1000);
    t = await evaluate('window.__resultText()');
    const callsAfter = await evaluate('window.__formCalls().length');
    check('KOMBI: EIN Versand für alles', callsAfter - callsBefore === 1, `Calls=${callsAfter - callsBefore}`);
    check('KOMBI: BEIDE Blöcke untereinander sichtbar', t.includes('Ihr InfraOne-Paket') && t.includes("Ihr Richtpreis: CHF 2'720 pro Monat"));
    const kombiPayload = await evaluate('window.__lastPayload()');
    check('KOMBI: message enthält Spar- UND Betreuungs-Block',
        kombiPayload && kombiPayload.message.includes('Fixkosten senken') && kombiPayload.message.includes('CHF 148')
        && kombiPayload.message.includes('Regelmässige Betreuung') && kombiPayload.message.includes("CHF 2'720")
        && kombiPayload.message.includes('Anzahl Rufnummern (DIDs): 10'));
    console.log('--- message (Kombi) ---\n' + (kombiPayload?.message || '') + '\n-----------------------');

    // ============ F: Sparmodus ohne Gate — Inline-Zeile Name/E-Mail ============
    await evaluate(`window.__setCheckbox('laufende IT-Betreuung', false);`);
    await sleep(500);
    await evaluate(`window.__clickButton('Anfrage direkt senden');`);
    await sleep(400);
    const inlineInputs = await evaluate(`(() => {
        const secs = [...document.querySelectorAll('section')];
        const sec = secs.find(s => s.textContent.includes('Was liegt an?'));
        const names = [...sec.querySelectorAll('input')].map(i => i.placeholder);
        return JSON.stringify(names);
    })()`);
    check('Sparmodus: Inline-Zeile Name*/E-Mail* öffnet sich', inlineInputs.includes('Name*') && inlineInputs.includes('E-Mail*'), inlineInputs);
    await evaluate(`
        window.__setPlaceholder('Name*', 'Spar Test');
        window.__setPlaceholder('E-Mail*', 'spar@example.ch');
        window.__clickButton('Anfrage senden');
    `);
    await sleep(1000);
    t = await evaluate('window.__resultText()');
    check('Sparmodus: Erfolgs-Bestätigung nach Mock-Versand', t.includes('Danke! Ihre Anfrage ist bei uns'));
    const sparPayload = await evaluate('window.__lastPayload()');
    check('Sparmodus: Payload korrekt (subject IT-Support, Rufnummern in message)',
        sparPayload && sparPayload.subject === 'IT-Support und Netzwerke' && sparPayload.name === 'Spar Test'
        && sparPayload.message.includes('Anzahl Rufnummern (DIDs): 10') && sparPayload.message.includes('CHF 148'));

    // ============ G: 375 px ohne Overflow ============
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await sleep(800);
    const overflow = await evaluate('document.documentElement.scrollWidth');
    check('375px: kein Horizontal-Overflow (Sparmodus)', overflow <= 376, `scrollWidth=${overflow}`);
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag010-sparmodus-375px.png`, Buffer.from(shot.data, 'base64'));

    await evaluate(`window.__clickModus('Regelmässige Betreuung');`);
    await sleep(600);
    const overflow2 = await evaluate('document.documentElement.scrollWidth');
    check('375px: kein Horizontal-Overflow (Betreuungs-Assistent)', overflow2 <= 376, `scrollWidth=${overflow2}`);
    shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag010-betreuung-375px.png`, Buffer.from(shot.data, 'base64'));
    console.log('Screenshots: auftrag010-sparmodus-375px.png, auftrag010-betreuung-375px.png');
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
