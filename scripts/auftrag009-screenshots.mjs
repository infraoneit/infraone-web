// AUFTRAG-009: Gezielte Screenshots des Rechners (375px + Desktop, Rechenbeispiel gefüllt)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3100';
const SHOTS = 'C:/Users/admin/Documents/kimi/workspace/infraone-web/auftraege/ergebnisse/raw';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
    '--user-data-dir=C:/Users/admin/Documents/kimi/workspace/infraone-web/repo/.chrome-test-profile',
    'about:blank',
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails).slice(0, 300));
    return res.result.value;
};

try {
    let page;
    for (let i = 0; i < 30 && !page; i++) {
        try {
            const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
            page = list.find((t) => t.type === 'page');
        } catch {}
        if (!page) await sleep(500);
    }
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
    await send('Page.enable');

    const shootRechner = async (url, name, width, mobile, dsf) => {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: dsf, mobile });
        await send('Page.navigate', { url });
        await sleep(4000);
        // Rechenbeispiel füllen + Bausteine aufklappen + zur Section scrollen
        await evaluate(`(() => {
            const setVal = (id, v) => {
                const el = document.getElementById(id);
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
                el.dispatchEvent(new Event('input', { bubbles: true }));
            };
            setVal('telefon-benutzer', '8');
            setVal('heute-telefonie', '320');
            setVal('heute-internet', '89');
            return true;
        })()`);
        await sleep(500);
        await evaluate(`(() => {
            const sec = [...document.querySelectorAll('section')].find(s => s.textContent.includes('Was liegt an?'));
            sec.querySelectorAll('details').forEach(d => { d.open = true; });
            sec.scrollIntoView({ block: 'start' });
            return true;
        })()`);
        await sleep(600);
        const metrics = await send('Page.getLayoutMetrics');
        const sec = await evaluate(`(() => {
            const s = [...document.querySelectorAll('section')].find(x => x.textContent.includes('Was liegt an?'));
            const r = s.getBoundingClientRect();
            return JSON.stringify({ top: r.top + window.scrollY, height: r.height });
        })()`);
        const { top, height } = JSON.parse(sec);
        const shot = await send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: true,
            clip: { x: 0, y: top, width: metrics.cssContentSize.width, height: Math.min(height, 3000), scale: 1 },
        });
        writeFileSync(`${SHOTS}/${name}`, Buffer.from(shot.data, 'base64'));
        console.log('OK', name);
    };

    await shootRechner(`${BASE}/it-support`, 'auftrag009-rechner-375px.png', 375, true, 2);
    await shootRechner(`${BASE}/it-support`, 'auftrag009-rechner-desktop.png', 1280, false, 1);
    await shootRechner(`${BASE}/cloud-telefonie`, 'auftrag009-cloud-telefonie-rechner.png', 1280, false, 1);
} catch (err) {
    console.error('FEHLER:', err.message);
    process.exitCode = 1;
} finally {
    try { ws?.close(); } catch {}
    chrome.kill();
}
