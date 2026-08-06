// AUFTRAG-011 Browser-Selbsttest: SignageDemoGalerie auf /digital-signage.
// Fährt Chrome headless über CDP (nur Node-Bordmittel, keine Dependencies).
// Voraussetzung: Produktionsserver läuft auf http://localhost:3100.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3100';
const SHOTS = 'C:/Users/admin/Documents/kimi/workspace/infraone-web/auftraege/ergebnisse/raw';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;

mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=C:/Users/admin/Documents/kimi/workspace/infraone-web/repo/.chrome-test-profile-011',
    'about:blank',
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
const failedImages = [];

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

async function connect() {    for (let i = 0; i < 30; i++) {
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
                    } else if (msg.method === 'Network.responseReceived') {
                        const r = msg.params.response;
                        if (r.status === 404 && /\.(webp|png|jpe?g|avif)/i.test(r.url)) {
                            failedImages.push(`${r.status} ${r.url}`);
                        }
                    }
                };
                return;
            }
        } catch { /* noch nicht bereit */ }
        await sleep(500);
    }
    throw new Error('Chrome CDP nicht erreichbar');
}

const results = [];
function check(name, ok, detail = '') {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);
}

const CAPTIONS = [
    'Empfang: Begrüssung mit Live-Uhr. Der Inhalt wechselt nach Playlist – von allein.',
    'Custom Widget: Live-Daten der eigenen Solaranlage, direkt aus der Wechselrichter-API.',
    'Tagesmenü im Personalrestaurant – erscheint um 11 Uhr, verschwindet um 14 Uhr. Niemand muss daran denken.',
    'Raumbelegung mit JETZT-Markierung: Das Widget weiss, wie spät es ist.',
    'Mitarbeiterinfo: eine Botschaft, gross und freundlich.',
    'Neues Display anschliessen? URL öffnen, Code eingeben, fertig.',
    'Die Verwaltung im Browser: Playlists, Zonen-Layouts, Zeitpläne – von jedem Rechner im Netzwerk.',
];

const GALERIE_STATE = `(() => {
    const region = document.querySelector('[role=region][aria-label*="Demo-Galerie"]');
    if (!region) return null;
    const big = region.querySelector('.aspect-video img');
    const caption = [...region.querySelectorAll('p')].find(p => p.textContent.length > 20);
    const thumbs = [...region.querySelectorAll('button')].filter(b => b.querySelector('img'));
    return {
        src: big ? big.getAttribute('src') : null,
        alt: big ? big.getAttribute('alt') : null,
        caption: caption ? caption.textContent : null,
        thumbCount: thumbs.length,
        complete: big ? big.complete : false,
        naturalWidth: big ? big.naturalWidth : 0,
    };
})()`;

try {
    await connect();
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE}/digital-signage` });
    await sleep(5000);

    // Sektions-Kopf wörtlich vorhanden
    const kopf = await evaluate(`(() => {
        const body = document.body.innerText;
        return {
            h2: body.includes('So sieht es im Betrieb aus'),
            sub: body.includes('Echte Ansichten aus infraone-signage – keine Mockups. Klicken Sie sich durch.'),
        };
    })()`);
    check('Sektions-Kopf wörtlich', kopf.h2 && kopf.sub, JSON.stringify(kopf));

    // Galerie vorhanden, 7 Thumbnails, Bild 1 geladen
    let s = await evaluate(GALERIE_STATE);
    check('Galerie vorhanden', !!s);
    check('7 Thumbnails', s && s.thumbCount === 7, `count=${s?.thumbCount}`);
    check('Bild 1 geladen (empfang)', s && s.complete && s.naturalWidth > 0 && decodeURIComponent(s.src).includes('demo-empfang'),
        s ? `${s.src} (${s.naturalWidth}px)` : 'kein State');
    check('Unterschrift 1 wörtlich', s && s.caption === CAPTIONS[0], s?.caption);
    check('alt = Unterschrift', s && s.alt === CAPTIONS[0]);

    // Galerie in den Viewport scrollen (lazy images laden erst dann)
    await evaluate(`document.querySelector('[role=region][aria-label*="Demo-Galerie"]').scrollIntoView({ block: 'center' })`);
    await sleep(1500);

    // Thumbnail-Klick: auf Thumbnail 3 (tagesmenu)
    await evaluate(`(() => {
        const region = document.querySelector('[role=region][aria-label*="Demo-Galerie"]');
        [...region.querySelectorAll('button')].filter(b => b.querySelector('img'))[2].click();
    })()`);
    s = await evaluate(GALERIE_STATE);
    for (let i = 0; i < 10 && !(s && s.complete && s.naturalWidth > 0); i++) {
        await sleep(300);
        s = await evaluate(GALERIE_STATE);
    }
    check('Klick Thumbnail 3 → Bild + Unterschrift wechseln',
        s && decodeURIComponent(s.src).includes('demo-tagesmenu') && s.caption === CAPTIONS[2] && s.complete && s.naturalWidth > 0,
        s ? `${s.src} / ${s.caption}` : 'kein State');

    // Pfeiltasten: Fokus auf Galerie, dann ArrowRight → raumbelegung
    await evaluate(`document.querySelector('[role=region][aria-label*="Demo-Galerie"]').focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await sleep(800);
    s = await evaluate(GALERIE_STATE);
    check('Pfeiltaste rechts → raumbelegung', s && decodeURIComponent(s.src).includes('demo-raumbelegung') && s.caption === CAPTIONS[3],
        s ? `${s.src} / ${s.caption}` : 'kein State');

    // Pfeiltaste links zweimal → zurück zu tagesmenu, dann solar
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await sleep(500);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await sleep(800);
    s = await evaluate(GALERIE_STATE);
    check('Pfeiltaste links 2× → solar', s && decodeURIComponent(s.src).includes('demo-solar') && s.caption === CAPTIONS[1],
        s ? `${s.src} / ${s.caption}` : 'kein State');

    // Vor/Zurück-Buttons (Klick auf "Nächste Ansicht")
    await evaluate(`document.querySelector('button[aria-label="Nächste Ansicht"]').click()`);
    await sleep(800);
    s = await evaluate(GALERIE_STATE);
    check('Button weiter → tagesmenu', s && decodeURIComponent(s.src).includes('demo-tagesmenu'), s?.src);

    // Alle 7 Ansichten durchklicken: jedes Bild lädt, Unterschrift stimmt
    let alleOk = true;
    let fehler = [];
    for (let i = 0; i < 7; i++) {
        await evaluate(`(() => {
            const region = document.querySelector('[role=region][aria-label*="Demo-Galerie"]');
            [...region.querySelectorAll('button')].filter(b => b.querySelector('img'))[${i}].click();
        })()`);
        await sleep(900);
        const st = await evaluate(GALERIE_STATE);
        const ok = st && st.complete && st.naturalWidth > 0 && st.caption === CAPTIONS[i] && st.alt === CAPTIONS[i];
        if (!ok) { alleOk = false; fehler.push(`#${i}: ${st?.src} caption=${st?.caption}`); }
    }
    check('Alle 7 Ansichten: Bild geladen + Unterschrift + alt korrekt', alleOk, fehler.join(' | '));

    // Touch-Wischen simulieren (touchstart/touchend mit Delta)
    await evaluate(`(() => {
        const region = document.querySelector('[role=region][aria-label*="Demo-Galerie"]');
        [...region.querySelectorAll('button')].filter(b => b.querySelector('img'))[0].click();
    })()`);
    await sleep(800);
    await evaluate(`(() => {
        const box = document.querySelector('[role=region][aria-label*="Demo-Galerie"] .aspect-video');
        const r = box.getBoundingClientRect();
        const y = r.top + r.height / 2;
        box.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 1, target: box, clientX: r.right - 50, clientY: y })], bubbles: true }));
        box.dispatchEvent(new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 1, target: box, clientX: r.left + 50, clientY: y })], bubbles: true }));
    })()`);
    await sleep(800);
    s = await evaluate(GALERIE_STATE);
    check('Touch-Wischen links → nächstes Bild (solar)', s && decodeURIComponent(s.src).includes('demo-solar') && s.caption === CAPTIONS[1],
        s ? `${s.src} / ${s.caption}` : 'kein State');

    // Kein Bild-404
    check('Kein Bild-404 im Netzwerk-Log', failedImages.length === 0, failedImages.join(' | ') || 'keine');

    // 375 px: kein Overflow, Galerie nutzbar
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await sleep(1000);
    const overflow = await evaluate('document.documentElement.scrollWidth');
    check('375px: kein Horizontal-Overflow', overflow <= 376, `scrollWidth=${overflow}`);
    const galSichtbar = await evaluate(`(() => {
        const region = document.querySelector('[role=region][aria-label*="Demo-Galerie"]');
        const r = region.getBoundingClientRect();
        return r.width <= 375 && r.width > 300;
    })()`);
    check('375px: Galerie passt in Viewport', galSichtbar === true);

    // Klick funktioniert auch mobil
    await evaluate(`(() => {
        const region = document.querySelector('[role=region][aria-label*="Demo-Galerie"]');
        [...region.querySelectorAll('button')].filter(b => b.querySelector('img'))[6].click();
    })()`);
    await sleep(900);
    s = await evaluate(GALERIE_STATE);
    check('375px: Klick Thumbnail 7 → verwaltung', s && decodeURIComponent(s.src).includes('demo-verwaltung') && s.caption === CAPTIONS[6] && s.complete,
        s ? `${s.src} / ${s.caption}` : 'kein State');

    // Galerie in Viewport scrollen für Screenshot
    await evaluate(`document.querySelector('[role=region][aria-label*="Demo-Galerie"]').scrollIntoView({ block: 'center' })`);
    await sleep(600);
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag011-galerie-375px.png`, Buffer.from(shot.data, 'base64'));

    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
    await sleep(800);
    await evaluate(`document.querySelector('[role=region][aria-label*="Demo-Galerie"]').scrollIntoView({ block: 'center' })`);
    await sleep(600);
    shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag011-galerie-desktop.png`, Buffer.from(shot.data, 'base64'));
    console.log('Screenshots: auftrag011-galerie-375px.png, auftrag011-galerie-desktop.png');

    // Nochmals Netzwerk-Check nach allen Interaktionen
    check('Kein Bild-404 nach allen Interaktionen', failedImages.length === 0, failedImages.join(' | ') || 'keine');
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
