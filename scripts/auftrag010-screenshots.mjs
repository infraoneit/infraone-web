// Einmalig: Screenshots vom Rechner-Bereich (375 px), Sparmodus + Betreuungs-Assistent + Gate.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3100';
const SHOTS = 'C:/Users/admin/Documents/kimi/workspace/infraone-web/auftraege/ergebnisse/raw';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
    '--user-data-dir=C:/Users/admin/Documents/kimi/workspace/infraone-web/repo/.chrome-test-profile2',
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
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails).slice(0, 400));
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
        } catch {}
        await sleep(500);
    }
    throw new Error('CDP nicht erreichbar');
}

try {
    await connect();
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 2, mobile: true });
    await send('Page.navigate', { url: `${BASE}/it-support` });
    await sleep(4000);

    // Sparmodus: Rechner-Karte sichtbar scrollen
    await evaluate(`
        const sec = [...document.querySelectorAll('section')].find(s => s.textContent.includes('Was liegt an?'));
        sec.scrollIntoView({ block: 'start' });
    `);
    await sleep(800);
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag010-rechner-spar-375px.png`, Buffer.from(shot.data, 'base64'));

    // Betreuungs-Modus: Gate in den Viewport
    await evaluate(`
        [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Regelmässige Betreuung')?.click();
    `);
    await sleep(600);
    await evaluate(`
        const g = [...document.querySelectorAll('h3')].find(h => h.textContent.includes('Ihr Richtpreis ist bereit'));
        g?.scrollIntoView({ block: 'center' });
    `);
    await sleep(800);
    shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag010-rechner-gate-375px.png`, Buffer.from(shot.data, 'base64'));
    console.log('Screenshots gespeichert.');
} catch (e) {
    console.error('FEHLER:', e.message);
} finally {
    try { ws?.close(); } catch {}
    chrome.kill();
}
