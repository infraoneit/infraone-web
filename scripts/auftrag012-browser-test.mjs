// AUFTRAG-012 Browser-Test: Galerie im Hero auf /digital-signage.
// Chrome headless via CDP (nur Node-Bordmittel). Voraussetzung: Prod-Server auf :3100.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3100';
const SHOTS = 'C:/Users/admin/Documents/kimi/workspace/infraone-web/auftraege/ergebnisse/raw';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9336;

mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=C:/Users/admin/Documents/kimi/workspace/infraone-web/repo/.chrome-test-profile-012',
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
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error('Evaluate-Fehler: ' + JSON.stringify(res.exceptionDetails).slice(0, 600));
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
                    } else if (msg.method === 'Network.responseReceived') {
                        const r = msg.params.response;
                        if (r.status >= 400 && /\.(webp|png|jpe?g|avif)/i.test(r.url)) {
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
    'Alle Bildschirme im Blick – mit Live-Vorschau jedes einzelnen Displays.',
    'Der Playlist-Editor: Reihenfolge, Dauer pro Element, Webseiten und eigenes HTML.',
    'Playlists für jeden Bildschirm – das Mittagsmenü kennt seinen Zeitplan selbst.',
    'Zonen-Layouts: ein Bildschirm, mehrere Bereiche – Menü links, Uhr rechts.',
    'Medien hochladen, fertig – PDFs werden automatisch zu schnellen Bildseiten.',
    'Und so kommt es beim Kunden an – hier mit Demo-Inhalten einer fiktiven Firma.',
];
const FILES = ['admin-bildschirme', 'admin-playlist-editor', 'admin-playlists', 'admin-layouts', 'admin-medien', 'player-beispiel'];

const GALERIE_STATE = `(() => {
    const region = document.querySelector('[role=region][aria-label*="Demo-Galerie"]');
    if (!region) return null;
    const big = region.querySelector('.aspect-\\\\[16\\\\/10\\\\] img');
    const caption = [...region.querySelectorAll('p')].find(p => p.textContent.length > 20);
    const thumbs = [...region.querySelectorAll('button')].filter(b => b.querySelector('img'));
    const heroSection = region.closest('section');
    const h1 = heroSection ? heroSection.querySelector('h1') : null;
    return {
        src: big ? big.getAttribute('src') : null,
        alt: big ? big.getAttribute('alt') : null,
        caption: caption ? caption.textContent : null,
        thumbCount: thumbs.length,
        complete: big ? big.complete : false,
        naturalWidth: big ? big.naturalWidth : 0,
        imHero: !!(h1 && h1.textContent.includes('Digital Signage Schweiz')),
        sectionCount: document.querySelectorAll('[role=region][aria-label*="Demo-Galerie"]').length,
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

    // Alte Sektion weg
    const body = await evaluate(`document.body.innerText`);
    check('Alte Sektion entfernt', !body.includes('So sieht es im Betrieb aus'));

    // Galerie im Hero, 6 Thumbnails, Bild 1 geladen
    let s = await evaluate(GALERIE_STATE);
    check('Galerie vorhanden (genau 1×)', s && s.sectionCount === 1);
    check('Galerie im Hero (neben H1)', s && s.imHero === true);
    check('6 Thumbnails', s && s.thumbCount === 6, `count=${s?.thumbCount}`);
    check('Bild 1 geladen (admin-bildschirme)', s && s.complete && s.naturalWidth > 0 && decodeURIComponent(s.src).includes('admin-bildschirme'),
        s ? `${s.src} (${s.naturalWidth}px)` : 'kein State');
    check('Unterschrift 1 wörtlich', s && s.caption === CAPTIONS[0], s?.caption);
    check('alt = Unterschrift', s && s.alt === CAPTIONS[0]);

    // Alle 6 Ansichten durchklicken
    let alleOk = true;
    const fehler = [];
    for (let i = 0; i < 6; i++) {
        await evaluate(`(() => {
            const region = document.querySelector('[role=region][aria-label*="Demo-Galerie"]');
            [...region.querySelectorAll('button')].filter(b => b.querySelector('img'))[${i}].click();
        })()`);
        await sleep(900);
        let st = await evaluate(GALERIE_STATE);
        for (let w = 0; w < 8 && !(st && st.complete && st.naturalWidth > 0); w++) {
            await sleep(300);
            st = await evaluate(GALERIE_STATE);
        }
        const ok = st && st.complete && st.naturalWidth > 0 && decodeURIComponent(st.src).includes(FILES[i]) && st.caption === CAPTIONS[i] && st.alt === CAPTIONS[i];
        if (!ok) { alleOk = false; fehler.push(`#${i}: ${st?.src} caption=${st?.caption}`); }
    }
    check('Alle 6 Ansichten: Bild + Unterschrift + alt korrekt', alleOk, fehler.join(' | '));

    check('Kein Bild-404 im Netzwerk-Log', failedImages.length === 0, failedImages.join(' | ') || 'keine');

    // Hero-Screenshot Desktop
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag012-hero-desktop.png`, Buffer.from(shot.data, 'base64'));

    // 375 px: kein Overflow
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await sleep(1200);
    const overflow = await evaluate('document.documentElement.scrollWidth');
    check('375px: kein Horizontal-Overflow', overflow <= 376, `scrollWidth=${overflow}`);
    const galPasst = await evaluate(`(() => {
        const region = document.querySelector('[role=region][aria-label*="Demo-Galerie"]');
        const r = region.getBoundingClientRect();
        return r.width <= 375 && r.width > 300;
    })()`);
    check('375px: Galerie passt in Viewport', galPasst === true);
    await evaluate(`document.querySelector('[role=region][aria-label*="Demo-Galerie"]').scrollIntoView({ block: 'center' })`);
    await sleep(600);
    shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${SHOTS}/auftrag012-hero-375px.png`, Buffer.from(shot.data, 'base64'));

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
