#!/usr/bin/env node
/**
 * verify-partner-slider.mjs — Testet den PartnerSlider bei 375 px via Chrome DevTools Protocol.
 * Nutzt nur Node-Stdlib (kein puppeteer): minimaler WebSocket-Client + headless Chrome.
 *
 * Voraussetzung: `next start` laeuft (Standard: Port 3100) und Chrome ist installiert.
 *   node scripts/verify-partner-slider.mjs [port]
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import net from 'node:net';
import http from 'node:http';

const PORT = Number(process.argv[2] || 3100);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9223;

/* ---------- Minimaler WebSocket-Client (nur Text-Frames) ---------- */
class MiniWS {
    constructor() { this.buf = Buffer.alloc(0); this.frag = []; this.handlers = []; }

    connect(wsUrl) {
        return new Promise((resolve, reject) => {
            const u = new URL(wsUrl);
            this.sock = net.connect(Number(u.port), u.hostname, () => {
                const key = crypto.randomBytes(16).toString('base64');
                this.sock.write(
                    `GET ${u.pathname} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n` +
                    `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
            });
            let hs = Buffer.alloc(0); let done = false;
            this.sock.on('data', (d) => {
                if (!done) {
                    hs = Buffer.concat([hs, d]);
                    const idx = hs.indexOf('\r\n\r\n');
                    if (idx === -1) return;
                    done = true;
                    this.buf = hs.subarray(idx + 4);
                    this.drain();
                    resolve();
                } else { this.buf = Buffer.concat([this.buf, d]); this.drain(); }
            });
            this.sock.on('error', reject);
        });
    }

    drain() {
        for (;;) {
            if (this.buf.length < 2) return;
            const fin = (this.buf[0] & 0x80) !== 0;
            const op = this.buf[0] & 0x0f;
            let len = this.buf[1] & 0x7f; let off = 2;
            if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
            else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); off = 10; }
            if (this.buf.length < off + len) return;
            const payload = this.buf.subarray(off, off + len);
            this.buf = this.buf.subarray(off + len);
            if (op === 9) { this.sendFrame(payload, 10); continue; } // Ping -> Pong
            this.frag.push(payload);
            if (fin) {
                const msg = Buffer.concat(this.frag).toString('utf8');
                this.frag = [];
                this.handlers.forEach((h) => h(msg));
            }
        }
    }

    sendFrame(payload, opcode = 1) {
        const mask = crypto.randomBytes(4);
        const len = payload.length;
        let head;
        if (len < 126) head = Buffer.from([0x80 | opcode, 0x80 | len]);
        else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | opcode; head[1] = 0x80 | 126; head.writeUInt16BE(len, 2); }
        else { head = Buffer.alloc(10); head[0] = 0x80 | opcode; head[1] = 0x80 | 127; head.writeBigUInt64BE(BigInt(len), 2); }
        const masked = Buffer.from(payload);
        for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i % 4];
        this.sock.write(Buffer.concat([head, mask, masked]));
    }

    sendText(s) { this.sendFrame(Buffer.from(s, 'utf8'), 1); }
    onMessage(h) { this.handlers.push(h); }
}

/* ---------- CDP-Helfer ---------- */
function httpJson(path) {
    return new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port: DEBUG_PORT, path }, (res) => {
            let d = ''; res.on('data', (c) => d += c); res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
    const chrome = spawn(CHROME, [
        '--headless=new', '--disable-gpu', `--remote-debugging-port=${DEBUG_PORT}`,
        '--no-first-run', '--user-data-dir=' + process.env.TEMP + '/chrome-slider-test', 'about:blank',
    ], { stdio: 'ignore' });

    try {
        let targets;
        for (let i = 0; i < 20; i++) {
            await sleep(500);
            try { targets = await httpJson('/json/list'); break; } catch { /* retry */ }
        }
        const page = targets.find((x) => x.type === 'page');
        if (!page) throw new Error('Kein Page-Target gefunden');

        const ws = new MiniWS();
        await ws.connect(page.webSocketDebuggerUrl);

        let id = 0;
        const pending = new Map();
        ws.onMessage((msg) => {
            const m = JSON.parse(msg);
            if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
        });
        const cdp = (method, params = {}) => new Promise((resolve) => {
            const mid = ++id;
            pending.set(mid, resolve);
            ws.sendText(JSON.stringify({ id: mid, method, params }));
        });
        const evaluate = async (expr) => {
            const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true });
            if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
            return r.result?.result?.value;
        };

        await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 2, mobile: true });
        await cdp('Page.enable');
        await cdp('Page.navigate', { url: `http://localhost:${PORT}/` });
        await sleep(8000); // Laden + Hydration

        const info = await evaluate(`(() => {
            const track = document.querySelector('section .flex.gap-8.items-center');
            if (!track) return { error: 'Slider-Track nicht gefunden' };
            const logos = track.querySelectorAll('img').length;
            const names = [...track.querySelectorAll('img')].slice(0, logos / 2).map(i => i.alt);
            return {
                logos,
                uniqueLogos: logos / 2,
                names,
                width: track.scrollWidth,
            };
        })()`);
        if (info.error) throw new Error(info.error);
        console.log(`Logos im DOM: ${info.logos} (${info.uniqueLogos} einmalig, Liste verdoppelt)`);
        console.log(`Logo-Namen: ${info.names.join(', ')}`);
        console.log(`Track-Breite: ${info.width}px`);

        // Animation 40 s beobachten (ein kompletter Umlauf = 35 s)
        const halfW = info.width / 2;
        const samples = [];
        for (let i = 0; i <= 20; i++) {
            const x = await evaluate(`(() => {
                const track = document.querySelector('section .flex.gap-8.items-center');
                const m = new DOMMatrixReadOnly(getComputedStyle(track).transform);
                return m.e;
            })()`);
            samples.push(x);
            if (i < 20) await sleep(2000);
        }

        // Auswertung: Bewegung, Monotonie, Wrap bei -50 %
        let wraps = 0; let jumps = 0; let moved = false;
        const expectedStep = (halfW / 35) * 2; // px pro 2 s
        for (let i = 1; i < samples.length; i++) {
            const d = samples[i] - samples[i - 1];
            if (Math.abs(d) > 1) moved = true;
            if (d > expectedStep * 0.5) wraps++;           // Ruecksprung = Wrap
            else if (Math.abs(-d - expectedStep) > expectedStep * 1.5 && Math.abs(d) > 5) jumps++; // unerwarteter Sprung
        }
        const minX = Math.min(...samples);
        console.log(`\nSamples (translateX): ${samples.map((v) => Math.round(v)).join(', ')}`);
        console.log(`Min. translateX: ${Math.round(minX)} px (Soll-Wrap: ${-Math.round(halfW)} px)`);
        console.log(`Bewegt: ${moved} · Wraps: ${wraps} · Unerwartete Spruenge: ${jumps}`);

        const speedPxS = (samples[0] - Math.min(...samples.filter((v, i) => i <= 10))) / 20;
        console.log(`Gemessene Geschwindigkeit: ~${speedPxS.toFixed(1)} px/s (Soll: ${(halfW / 35).toFixed(1)} px/s)`);

        const ok = moved && wraps >= 1 && jumps === 0 && Math.abs(minX + halfW) < halfW * 0.05;
        console.log(ok ? '\nERGEBNIS: OK — Slider laeuft bei 375 px durch, Wrap bei exakt -50 %, kein Sprung.' : '\nERGEBNIS: AUFFAELLIG — bitte manuell pruefen.');
        process.exitCode = ok ? 0 : 1;
    } finally {
        chrome.kill();
    }
}

main().catch((e) => { console.error('FEHLER:', e.message); process.exit(2); });
