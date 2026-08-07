// AUFTRAG-013 Browser-Test: Breiten-Konsistenz + Rechner-Layout.
// Chrome headless via CDP (nur Node-Bordmittel). Voraussetzung: Prod-Server auf :3100.
import { spawn } from 'node:child_process';

const BASE = 'http://localhost:3100';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9337;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=C:/Users/admin/Documents/kimi/workspace/infraone-web/repo/.chrome-test-profile-013',
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
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 400) : ''}`);
}

// Kantenmessung: pro Section die linken Kanten der direkten Container-Kinder.
// Strukturelle Bloecke muessen auf der Container-Kante liegen (±1px).
// Schmale Bloecke (max-w-*) sind nur als Typografie erlaubt (<p, text-, subtitle, text-center).
const KANTEN_JS = `(() => {
    const secs = [...document.querySelectorAll('main section, main > div > section')];
    const out = [];
    for (const sec of secs) {
        const c = sec.querySelector(':scope > .container') || sec.querySelector(':scope .container');
        if (!c) continue;
        const cr = c.getBoundingClientRect();
        if (cr.width < 100) continue;
        const pl = parseFloat(getComputedStyle(c).paddingLeft);
        const contentLeft = cr.left + pl;
        for (const k of c.children) {
            const r = k.getBoundingClientRect();
            if (r.width === 0) continue;
            const cls = (typeof k.className === 'string' ? k.className : '').toString();
            const narrow = /max-w-(xl|2xl|3xl|4xl|5xl|6xl|7xl)/.test(cls);
            const typo = k.tagName === 'P' || /text-|subtitle|opacity/.test(cls);
            // Zentrierte CTA-Buttons/Links (inline-flex) duerfen mittig stehen (Regel 2 analog PromoSection)
            const cta = (k.tagName === 'A' || k.tagName === 'BUTTON') && /inline-flex/.test(cls);
            out.push({ left: Math.round(r.left * 10) / 10, cl: Math.round(contentLeft * 10) / 10, narrow, typo: typo || cta, tag: k.tagName, cls: cls.slice(0, 70) });
        }
    }
    return out;
})()`;

const PAGES = ['/', '/it-support', '/it-support/winterthur', '/cloud-telefonie', '/webdesign',
    '/digital-signage', '/software-entwicklung', '/kontakt', '/unternehmen', '/partner', '/blog'];

async function nav(url, waitMs = 3500) {
    await send('Page.navigate', { url });
    await sleep(waitMs);
}

try {
    await connect();
    await send('Page.enable');
    await send('Runtime.enable');

    // ============ 1. Kantenmessung 1440px ============
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

    for (const path of PAGES) {
        await nav(`${BASE}${path}`);
        // komplett durchscrollen, damit lazy Inhalt/Fonts stabil sind
        await evaluate(`(async () => { for (let y = 0; y <= document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); })()`);
        await sleep(400);
        const edges = await evaluate(KANTEN_JS);
        if (!edges || edges.length === 0) { check(`Kanten ${path}: Inhalt gefunden`, false); continue; }
        const struktur = edges.filter((e) => !e.narrow && !e.typo);
        const kanten = [...new Set(edges.map((e) => e.cl))];
        const abweichungen = struktur.filter((e) => Math.abs(e.left - e.cl) > 1.1);
        const narrowNichtTypo = edges.filter((e) => e.narrow && !e.typo);
        const ok = kanten.length === 1 && abweichungen.length === 0 && narrowNichtTypo.length === 0;
        const detail = `Container-Kanten=${JSON.stringify(kanten)}`
            + (abweichungen.length ? ` | ABWEICHUNG: ${abweichungen.map((a) => `${a.tag}@${a.left} (Kante ${a.cl}) ${a.cls}`).join(' ;; ')}` : '')
            + (narrowNichtTypo.length ? ` | SCHMAL+STRUKTURELL: ${narrowNichtTypo.map((a) => `${a.tag} ${a.cls}`).join(' ;; ')}` : '')
            + ` | ${struktur.length} strukturelle Bloecke, ${edges.filter((e) => e.narrow).length} schmal (Typo)`;
        check(`Kanten ${path}: einheitlich`, ok, detail);
    }

    // ============ 2. /it-support: Rechner bündig mit Preiskarten + sticky + Gate ============
    await nav(`${BASE}/it-support`);
    const buendig = await evaluate(`(() => {
        const rechner = document.querySelector('.min-h-\\\\[560px\\\\]');
        if (!rechner) return null;
        const r = rechner.getBoundingClientRect();
        // Preiskarten: erstes Grid mit Karten oberhalb des Rechners
        const grids = [...document.querySelectorAll('main section .container > div[class*=grid], main section .container > div > div[class*=grid]')]
            .filter((g) => g.getBoundingClientRect().top < r.top && g.getBoundingClientRect().width > 600);
        const p = grids.length ? grids[grids.length - 1].getBoundingClientRect() : null;
        return { rechnerLinks: Math.round(r.left), rechnerRechts: Math.round(r.right), preisLinks: p ? Math.round(p.left) : null, preisRechts: p ? Math.round(p.right) : null };
    })()`);
    check('Rechner-Karte bündig mit Preiskarten', !!buendig && buendig.preisLinks !== null
        && Math.abs(buendig.rechnerLinks - buendig.preisLinks) <= 1 && Math.abs(buendig.rechnerRechts - buendig.preisRechts) <= 1,
        JSON.stringify(buendig));

    // Zweispaltig ab lg: Ergebnis-Spalte rechts von den Eingaben
    const spalten = await evaluate(`(() => {
        const rechner = document.querySelector('.min-h-\\\\[560px\\\\]');
        const grid = rechner && rechner.querySelector(':scope > div');
        if (!grid) return null;
        const [links, rechts] = grid.children;
        const l = links.getBoundingClientRect(), r = rechts.getBoundingClientRect();
        return { gridCols: getComputedStyle(grid).gridTemplateColumns, linksRechts: Math.round(l.right), ergebnisLinks: Math.round(r.left), sticky: getComputedStyle(rechts).position };
    })()`);
    check('Rechner lg-zweispaltig (Ergebnis rechts)', !!spalten && spalten.ergebnisLinks >= spalten.linksRechts - 1, JSON.stringify(spalten));
    check('Ergebnis-Spalte position:sticky', !!spalten && spalten.sticky === 'sticky', spalten?.sticky);

    // Sticky beim Scrollen
    await evaluate(`document.querySelector('.min-h-\\\\[560px\\\\]').scrollIntoView(); window.scrollBy(0, -80);`);
    await sleep(400);
    const stickyTest = await evaluate(`(async () => {
        const rechts = document.querySelector('.min-h-\\\\[560px\\\\] > div').children[1];
        const vorher = rechts.getBoundingClientRect().top;
        window.scrollBy(0, 400);
        await new Promise((r) => setTimeout(r, 300));
        const nachher = rechts.getBoundingClientRect().top;
        const karte = document.querySelector('.min-h-\\\\[560px\\\\]').getBoundingClientRect();
        return { vorher: Math.round(vorher), nachher: Math.round(nachher), kartenTop: Math.round(karte.top) };
    })()`);
    check('Sticky: Ergebnis bleibt beim Scrollen stehen', !!stickyTest && stickyTest.kartenTop < 0 && Math.abs(stickyTest.nachher - 96) <= 4, JSON.stringify(stickyTest));

    // Rechenprobe: 8 Benutzer / Block 2–5 / Flat CH / Internet → 138
    await evaluate(`window.scrollTo(0, 0)`);
    const probe = await evaluate(`(async () => {
        const rechner = document.querySelector('.min-h-\\\\[560px\\\\]');
        const klick = (txt) => { const b = [...rechner.querySelectorAll('button')].find((x) => x.textContent.trim() === txt); if (b) b.click(); return !!b; };
        klick('Fixkosten senken');
        await new Promise((r) => setTimeout(r, 200));
        const benutzer = rechner.querySelector('#telefon-benutzer');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(benutzer, '8');
        benutzer.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 200));
        const okRuf = klick('2–5');
        const okFlat = klick('CH');
        const inet = [...rechner.querySelectorAll('label')].find((l) => l.textContent.includes('Glasfaser-Internet'));
        const cb = inet && inet.querySelector('input[type=checkbox]');
        if (cb && !cb.checked) cb.click();
        await new Promise((r) => setTimeout(r, 400));
        const text = rechner.innerText;
        const m = text.match(/Ihr InfraOne-Paket:\\s*CHF\\s*([\\d'\\.]+)/);
        return { okRuf, okFlat, inetGefunden: !!cb, paket: m ? m[1] : null };
    })()`);
    check('Rechenprobe 8/Block 2–5/Flat CH/Internet → CHF 138', !!probe && probe.okRuf && probe.okFlat && probe.inetGefunden && !!probe.paket && probe.paket.startsWith('138'), JSON.stringify(probe));

    // Gate im Betreuungsmodus in der rechten Spalte
    const gate = await evaluate(`(async () => {
        const rechner = document.querySelector('.min-h-\\\\[560px\\\\]');
        const b = [...rechner.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Regelmässige Betreuung');
        b.click();
        await new Promise((r) => setTimeout(r, 400));
        const gateEl = [...rechner.querySelectorAll('h3')].find((h) => h.textContent.includes('Ihr Richtpreis ist bereit'));
        if (!gateEl) return { gefunden: false };
        const g = gateEl.closest('div[class*=rounded-2xl]').getBoundingClientRect();
        const karte = rechner.getBoundingClientRect();
        const rechts = rechner.querySelector(':scope > div').children[1].getBoundingClientRect();
        return { gefunden: true, gateLinks: Math.round(g.left), spalteLinks: Math.round(rechts.left), inRechterSpalte: Math.abs(g.left - rechts.left) <= 2, kartenMitte: Math.round(karte.left + karte.width / 2) };
    })()`);
    check('Betreuungs-Gate in der rechten Ergebnis-Spalte', !!gate && gate.gefunden && gate.inRechterSpalte === true, JSON.stringify(gate));

    // ============ 3. /cloud-telefonie mit eingebettetem Rechner ============
    await nav(`${BASE}/cloud-telefonie`);
    const ct = await evaluate(`(() => {
        const rechner = document.querySelector('.min-h-\\\\[560px\\\\]');
        if (!rechner) return { gefunden: false };
        const r = rechner.getBoundingClientRect();
        return { gefunden: true, breite: Math.round(r.width), overflow: document.documentElement.scrollWidth > 1441 };
    })()`);
    check('/cloud-telefonie: Rechner eingebettet, volle Breite, kein Bruch', !!ct && ct.gefunden && ct.breite > 1100 && ct.overflow === false, JSON.stringify(ct));

    // ============ 4. 375px Stichproben: kein Overflow ============
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    for (const path of ['/it-support', '/cloud-telefonie', '/webdesign', '/digital-signage']) {
        await nav(`${BASE}${path}`, 3000);
        const overflow = await evaluate('document.documentElement.scrollWidth');
        check(`375px ${path}: kein Horizontal-Overflow`, overflow <= 376, `scrollWidth=${overflow}`);
    }

    // 375px: Rechner gestapelt (Ergebnis unter den Eingaben)
    await nav(`${BASE}/it-support`, 3000);
    const gestapelt = await evaluate(`(() => {
        const rechner = document.querySelector('.min-h-\\\\[560px\\\\]');
        const [links, rechts] = rechner.querySelector(':scope > div').children;
        const l = links.getBoundingClientRect(), r = rechts.getBoundingClientRect();
        return { gestapelt: r.top >= l.bottom - 1, gridCols: getComputedStyle(rechner.querySelector(':scope > div')).gridTemplateColumns };
    })()`);
    check('375px: Rechner gestapelt (Eingaben, dann Ergebnis)', !!gestapelt && gestapelt.gestapelt === true, JSON.stringify(gestapelt));
} catch (err) {
    console.error('TESTFEHLER:', err.message);
    results.push({ name: 'Skript ohne Absturz', ok: false, detail: err.message });
} finally {
    try { ws?.close(); } catch { }
    chrome.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ERGEBNIS: ${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL ===`);
process.exit(failed.length ? 1 : 0);
