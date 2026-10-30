#!/usr/bin/env node
/**
 * auftrag112-einheit-test.mjs (AUFTRAG-112) — Einheits- und Route-Tests «Das URL-Feld ist das Tor», ohne
 * Server und OHNE Netz (fetch ist gemockt; jeder Aufruf an eine fremde Adresse wirft):
 * - Inhaltsfilter Stufe A (`istAufSperrliste`): gesperrt und frei laut Auftrag (P4), Liste, Wortregel,
 *   Endungen, Subdomains, www, IDN (xn--)
 * - Stufe B: `parseFamilyAntwort` mit festen Antworten; `pruefeHostFreigabe` mit gemocktem
 *   Cloudflare-for-Families (Abfrage, Zwischenspeicher 24 h / höchstens 5000, eine Wiederholung,
 *   Filter nicht erreichbar → durchlassen + Journal, Zeitlimit 1500 ms), Journal nur mit Host
 * - Abrufpfad: `holeSicher` mit `hostFreigabe` lädt einen gesperrten Host nicht (NetzFehler host_inhalt)
 * - Datensätze: ohne `stufe` → «voll»; `scanFreigegeben` mit gesperrtem Host → false
 * - Routen: Reihenfolge Stufe A → Limit → Stufe B (gesperrt = 422 urlInhalt, kein Datensatz); {url, scan_id}
 *   → 400; Vorprüfungs-Scan: Stufe 2 ohne Nachweis 403, profil/faehigkeiten/bild 409 scan_unvollstaendig,
 *   anruf 403 bzw. (mit Nachweis) 409; voll → idempotent ohne Abruf; gesperrter Host → 404 überall
 * - Impressum-Auswahl der Vorprüfung, Profil der Vorprüfung (ohne Wissen), Texte wortgleich (P6)
 *
 * Eigener Speicher-Ordner (Temp), kein DEMO_ANSTOSS_URL (kein Anstoss, kein Anruf).
 *
 *   node scripts/auftrag112-einheit-test.mjs
 */
import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({
    resolve(s, k, weiter) {
        let x = s;
        if (x.startsWith('@/')) x = pathToFileURL(path.join(ROOT, 'src', x.slice(2))).href;
        try {
            return weiter(x, k);
        } catch (e) {
            if ((x.startsWith('.') || x.startsWith('file:')) && !/\.[cm]?[jt]sx?$/.test(x)) return weiter(x + '.ts', k);
            throw e;
        }
    },
});

// Umgebung VOR dem ersten Import: eigener Speicher, kein Anstoss, keine Limits, fester Schlüssel
const TEST_STORE = mkdtempSync(path.join(os.tmpdir(), 'a112-einheit-'));
process.env.DEMO_STORE_DIR = TEST_STORE;
delete process.env.DEMO_ANSTOSS_URL;
delete process.env.TURNSTILE_SITE_KEY;
delete process.env.TURNSTILE_SECRET;
delete process.env.ZEFIX_USER;
delete process.env.ZEFIX_PASSWORD;
delete process.env.DEMO_HANDELSREGISTER;
for (const k of ['NETLIFY', 'SITE_ID', 'NETLIFY_BLOBS_CONTEXT', 'AWS_LAMBDA_FUNCTION_NAME']) delete process.env[k];
process.env.DEMO_LIMITS_AUS = '1';
process.env.DEMO_TOKEN = 'a112-test-schluessel-0123456789';

const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
const sp = await imp('src/lib/demo/sperrliste.ts');
const netz = await imp('src/lib/demo/netz.ts');
const scans = await imp('src/lib/demo/scans.ts');
const api = await imp('src/lib/demo/api.ts');
const hr = await imp('src/lib/demo/handelsregister.ts');
const texte = await imp('src/lib/demo/handelsregister-texte.ts');
const scanner = await imp('src/lib/demo/scanner.ts');
const extraktion = await imp('src/lib/demo/extraktion.ts');
const profilMod = await imp('src/lib/demo/profil.ts');
const speicherMod = await imp('src/lib/demo/speicher.ts');
const scanRoute = await imp('src/app/api/demo/scan/route.ts');
const profilRoute = await imp('src/app/api/demo/profil/route.ts');
const faehigkeitenRoute = await imp('src/app/api/demo/faehigkeiten/route.ts');
const bildRoute = await imp('src/app/api/demo/bild/[scan]/[n]/route.ts');
const anrufRoute = await imp('src/app/api/demo/anruf/route.ts');
const hrRoute = await imp('src/app/api/demo/handelsregister/route.ts');

let fehler = 0;
let gesamt = 0;
function pruefe(name, ok, detail = '') {
    gesamt++;
    if (!ok) fehler++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
const gleich = (name, ist, soll) => pruefe(name, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}${JSON.stringify(ist) === JSON.stringify(soll) ? '' : ` / soll ${JSON.stringify(soll)}`}`);

/** Journal mitlesen (console.info/warn/error), ohne es auszugeben. */
async function stumm(fn) {
    const alt = { info: console.info, warn: console.warn, error: console.error };
    const zeilen = [];
    console.info = console.warn = console.error = (...a) => zeilen.push(a.map(String).join(' '));
    try {
        return { r: await fn(), zeilen };
    } finally {
        Object.assign(console, alt);
    }
}

/* ------------------------------------------------------------------ */
/* fetch gemockt: Cloudflare for Families + Zefix, sonst Fehler        */
/* ------------------------------------------------------------------ */

const json = (status, daten) => new Response(JSON.stringify(daten), { status, headers: { 'Content-Type': 'application/json' } });
const FAMILIE_GESPERRT = (name) => ({ Status: 0, TC: false, RD: true, RA: true, AD: false, CD: false, Question: [{ name, type: 1 }], Answer: [{ name, type: 1, TTL: 60, data: '0.0.0.0' }] });
const FAMILIE_FREI = (name) => ({ Status: 0, Question: [{ name, type: 1 }], Answer: [{ name, type: 1, TTL: 300, data: '104.21.48.12' }] });
const aufrufe = [];
/** host → 'gesperrt' | 'frei' | 'wirft' | 'einmal-wirft' | 'haengt' */
const familie = new Map();
let zefixAntwort = () => json(404, { error: { code: 'API.ZFR.SEARCH.NORESULT' } });
const altFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    aufrufe.push({ url: u, init });
    if (u.startsWith('https://family.cloudflare-dns.com/dns-query?')) {
        const name = new URL(u).searchParams.get('name');
        const art = familie.get(name) ?? 'frei';
        if (art === 'wirft') throw new TypeError('fetch failed');
        if (art === 'einmal-wirft') {
            familie.set(name, 'gesperrt');
            throw new TypeError('fetch failed');
        }
        if (art === 'haengt') {
            return new Promise((_, nein) => init.signal?.addEventListener('abort', () => nein(init.signal.reason ?? new Error('abgebrochen'))));
        }
        return json(200, art === 'gesperrt' ? FAMILIE_GESPERRT(name) : FAMILIE_FREI(name));
    }
    if (u.startsWith('https://www.zefix.admin.ch/')) return zefixAntwort({ url: u, body: typeof init.body === 'string' ? JSON.parse(init.body) : null });
    throw new Error(`Test: fremde Adresse ${u}`);
};
const doh = (seit = 0) => aufrufe.slice(seit).filter((a) => a.url.startsWith('https://family.cloudflare-dns.com/'));

try {
    /* ------------------------------------------------------------------ */
    /* 1. Stufe A: Sperrliste (statisch)                                   */
    /* ------------------------------------------------------------------ */
    {
        const gesperrt = [
            'pornhub.com',
            'www.pornhub.com',
            'sub.xvideos.com',
            'bücher.pornhub.com', // IDN-Subdomain einer Listendomain → xn--bcher-kva.pornhub.com
            'xn--bcher-kva.pornhub.com',
            'ｘｖｉｄｅｏｓ.com', // Vollbreite-Zeichen → xvideos.com (IDNA)
            'pornhüb.com', // IDN-Variante → xn--pornhb-…: «porn» im Label
            'porn-videos.ch',
            'xxx-shop.ch',
            'sexy-cams.ch',
            'beispiel.xxx',
        ];
        const frei = ['essex.ch', 'sussex-consulting.ch', 'middlesex.co.uk', 'sexton.ch', 'elektro-tel.ch', 'infraone.ch', 'dildoshop.ch'];
        const falschFrei = gesperrt.filter((h) => !sp.istAufSperrliste(h));
        const falschGesperrt = frei.filter((h) => sp.istAufSperrliste(h));
        pruefe(`Stufe A gesperrt (Auftrag P4, ${gesperrt.length} Fälle): ${gesperrt.join(', ')}`, falschFrei.length === 0, falschFrei.length ? `nicht gesperrt: ${falschFrei.join(', ')}` : '');
        pruefe(`Stufe A frei (Auftrag P4, ${frei.length} Fälle): ${frei.join(', ')}`, falschGesperrt.length === 0, falschGesperrt.length ? `gesperrt: ${falschGesperrt.join(', ')}` : '');
        gleich('IDN als ASCII: bücher.pornhub.com → xn--bcher-kva.pornhub.com, pornhüb.com → xn--…', [sp.hostFuerSperre('bücher.pornhub.com'), /^xn--pornhb-[a-z0-9]+\.com$/.test(sp.hostFuerSperre('pornhüb.com'))], ['xn--bcher-kva.pornhub.com', true]);
        gleich('Host klein, ohne www./www2., ohne Punkt am Ende', [sp.hostFuerSperre('WWW.PornHub.COM.'), sp.hostFuerSperre('www2.xnxx.com'), sp.istAufSperrliste('PornHub.COM.'), sp.istAufSperrliste('www2.xnxx.com')], ['pornhub.com', 'xnxx.com', true, true]);
        const liste = ['pornhub.com', 'pornhub.org', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com', 'youporn.com', 'tube8.com', 'spankbang.com', 'eporner.com', 'tnaflix.com', 'brazzers.com', 'onlyfans.com', 'chaturbate.com', 'stripchat.com', 'livejasmin.com', 'bongacams.com', 'cam4.com', 'xhamsterlive.com', 'pornhat.com', 'beeg.com', 'youjizz.com', 'porntrex.com', 'hqporner.com', 'motherless.com', 'rule34.xxx', 'e-hentai.org', 'nhentai.net', 'fapello.com', 'erome.com', 'thothub.to', 'sex.com'];
        const fehlend = liste.filter((d) => !sp.SPERRDOMAINS.includes(d) || !sp.istAufSperrliste(d) || !sp.istAufSperrliste(`cdn.${d}`));
        pruefe(`SPERRDOMAINS: alle ${liste.length} Domains des Auftrags gesperrt, auch als Subdomain`, fehlend.length === 0, fehlend.join(', '));
        const woerter = ['porn', 'porno', 'pornos', 'xxx', 'sex', 'sexy', 'sexshop', 'sexchat', 'sexcam', 'sexcams', 'erotik', 'erotic', 'erotica', 'hentai', 'camgirl', 'camgirls', 'escort', 'escorts', 'nutten', 'hure', 'huren', 'fick', 'ficken', 'milf', 'bdsm', 'fetisch', 'fetish', 'nude', 'nudes', 'nackt', 'nacktbilder', 'pussy', 'dildo', 'dildos'];
        const wortFehlt = woerter.filter((w) => !sp.SPERRWOERTER.includes(w) || !sp.istAufSperrliste(`muster-${w}.ch`) || !sp.istAufSperrliste(`${w}24.ch`) || !sp.istAufSperrliste(`a_${w}.ch`));
        pruefe(`Wortregel: alle ${woerter.length} Wörter als Segment (an «-», «_», Ziffern) gesperrt`, wortFehlt.length === 0, wortFehlt.join(', '));
        gleich('Wortregel: Segment muss gleich sein (escortservice, sexau, wessex, nudelhaus frei)', ['escortservice.ch', 'sexau.de', 'wessex.co.uk', 'nudelhaus.ch'].map((h) => sp.istAufSperrliste(h)), [false, false, false, false]);
        gleich('Teilfolge porn/xxx/hentai irgendwo im Label gesperrt (meinpornoshop, abcxxxdef, hentaiwelt)', ['meinpornoshop.ch', 'abcxxxdef.ch', 'hentaiwelt.ch'].map((h) => sp.istAufSperrliste(h)), [true, true, true]);
        gleich('Endungen .xxx .porn .adult .sex .sexy gesperrt', ['beispiel.xxx', 'beispiel.porn', 'beispiel.adult', 'beispiel.sex', 'beispiel.sexy'].map((h) => sp.istAufSperrliste(h)), [true, true, true, true, true]);
        gleich('Wortregel auf dem Label (sexy.ch gesperrt), unverdächtiges Label frei (muster.ch)', [sp.istAufSperrliste('sexy.ch'), sp.istAufSperrliste('muster.ch')], [true, false]);
        gleich('Subdomain-Wort gesperrt (sex.beispiel.ch), Wort nur in der Endung nicht (beispiel.co.uk)', [sp.istAufSperrliste('sex.beispiel.ch'), sp.istAufSperrliste('beispiel.co.uk')], [true, false]);
        gleich('Leer / IP → nicht auf der Liste', [sp.istAufSperrliste(''), sp.istAufSperrliste(null), sp.istAufSperrliste('192.0.2.1')], [false, false, false]);
    }

    /* ------------------------------------------------------------------ */
    /* 2. Stufe B: Antwort von Cloudflare for Families                     */
    /* ------------------------------------------------------------------ */
    {
        gleich('parseFamilyAntwort: 0.0.0.0 → gesperrt', sp.parseFamilyAntwort(FAMILIE_GESPERRT('pornhub.com')), true);
        gleich('parseFamilyAntwort: echte Adresse → frei', sp.parseFamilyAntwort(FAMILIE_FREI('elektro-tel.ch')), false);
        gleich('parseFamilyAntwort: Status 3 (NXDOMAIN) → frei', sp.parseFamilyAntwort({ Status: 3, Question: [{ name: 'gibtesnicht-a112.ch', type: 1 }], Authority: [{ name: 'ch', type: 6, data: 'a.nic.ch.' }] }), false);
        gleich('parseFamilyAntwort: leer → frei ({}, null, Status 0 ohne Answer, leere Answer)', [sp.parseFamilyAntwort({}), sp.parseFamilyAntwort(null), sp.parseFamilyAntwort({ Status: 0 }), sp.parseFamilyAntwort({ Status: 0, Answer: [] }), sp.parseFamilyAntwort('kaputt')], [false, false, false, false, false]);
        gleich('parseFamilyAntwort: AAAA «::» → gesperrt; CNAME vor 0.0.0.0 → gesperrt', [sp.parseFamilyAntwort({ Status: 0, Answer: [{ type: 28, data: '::' }] }), sp.parseFamilyAntwort({ Status: 0, Answer: [{ type: 5, data: 'cdn.example.net.' }, { type: 1, data: '0.0.0.0' }] })], [true, true]);
        gleich('parseFamilyAntwort: Status ≠ 0 mit 0.0.0.0 → frei (nur Status 0 zählt)', sp.parseFamilyAntwort({ Status: 2, Answer: [{ type: 1, data: '0.0.0.0' }] }), false);
    }

    /* ------------------------------------------------------------------ */
    /* 3. pruefeHostFreigabe (Stufe A + B, Zwischenspeicher, Ausfall)      */
    /* ------------------------------------------------------------------ */
    {
        sp.filterZwischenspeicher().leeren();
        let vor = aufrufe.length;
        const a = await stumm(() => sp.pruefeHostFreigabe('www.pornhub.com'));
        gleich('Stufe A in pruefeHostFreigabe: {ok:false, grund:"liste"}, keine Filter-Abfrage', [a.r, doh(vor).length], [{ ok: false, grund: 'liste' }, 0]);
        pruefe('Journal bei Sperre (Liste): «[demo/sperre] host=pornhub.com grund=liste»', a.zeilen.includes('[demo/sperre] host=pornhub.com grund=liste'), a.zeilen.join(' | '));

        familie.set('filter-gesperrt-a112.ch', 'gesperrt');
        vor = aufrufe.length;
        const b = await stumm(() => sp.pruefeHostFreigabe('filter-gesperrt-a112.ch'));
        const abfrage = doh(vor)[0];
        gleich('Stufe B: 0.0.0.0 → {ok:false, grund:"inhalt"}', b.r, { ok: false, grund: 'inhalt' });
        pruefe(
            'Stufe B: GET family.cloudflare-dns.com/dns-query?name=<host>&type=A, accept application/dns-json, Zeitlimit-Signal',
            doh(vor).length === 1 && abfrage.url === 'https://family.cloudflare-dns.com/dns-query?name=filter-gesperrt-a112.ch&type=A' && (abfrage.init.method ?? 'GET') === 'GET' && abfrage.init.headers?.accept === 'application/dns-json' && !!abfrage.init.signal,
            abfrage?.url,
        );
        pruefe('Journal bei Sperre (Inhalt): nur Host, keine URL, keine IP', b.zeilen.includes('[demo/sperre] host=filter-gesperrt-a112.ch grund=inhalt') && !b.zeilen.join(' ').match(/https?:|\d+\.\d+\.\d+\.\d+/), b.zeilen.join(' | '));
        vor = aufrufe.length;
        const b2 = await stumm(() => sp.pruefeHostFreigabe('filter-gesperrt-a112.ch'));
        gleich('Zwischenspeicher: zweite Prüfung ohne neue Abfrage (weiter gesperrt)', [b2.r, doh(vor).length], [{ ok: false, grund: 'inhalt' }, 0]);
        // Ablauf nach 24 h
        vor = aufrufe.length;
        await stumm(() => sp.pruefeHostFreigabe('filter-gesperrt-a112.ch', Date.now() + sp.FILTER_CACHE_MS + 1000));
        gleich('Zwischenspeicher läuft nach 24 h ab (neue Abfrage)', doh(vor).length, 1);

        vor = aufrufe.length;
        const c = await stumm(() => sp.pruefeHostFreigabe('elektro-tel.ch'));
        const c2 = await stumm(() => sp.pruefeHostFreigabe('elektro-tel.ch'));
        gleich('Stufe B frei (echte Adresse) → ok, zwischengespeichert (1 Abfrage für 2 Prüfungen)', [c.r, c2.r, doh(vor).length, c.zeilen.length], [{ ok: true }, { ok: true }, 1, 0]);

        familie.set('filter-ausfall-a112.ch', 'wirft');
        vor = aufrufe.length;
        const d = await stumm(() => sp.pruefeHostFreigabe('filter-ausfall-a112.ch'));
        gleich('Filter nicht erreichbar: zwei Versuche, dann durchlassen', [d.r, doh(vor).length], [{ ok: true }, 2]);
        pruefe('Filter nicht erreichbar: Journal «[demo/sperre] filter nicht erreichbar host=…»', d.zeilen.includes('[demo/sperre] filter nicht erreichbar host=filter-ausfall-a112.ch'), d.zeilen.join(' | '));
        vor = aufrufe.length;
        const d2 = await stumm(() => sp.pruefeHostFreigabe('filter-ausfall-a112.ch'));
        const d3 = await stumm(() => sp.pruefeHostFreigabe('filter-ausfall-a112.ch', Date.now() + sp.FILTER_AUSFALL_MS + 1000));
        gleich('Ausfall gilt 2 min (übrige Abrufe des Scans warten nicht je 3 s), danach wird wieder gefragt', [d2.r, doh(vor).length - 2, d3.r], [{ ok: true }, 0, { ok: true }]);
        pruefe('… nach 2 min: zwei neue Versuche', doh(vor).length === 2, String(doh(vor).length));
        pruefe('Stufe A gilt auch bei Filter-Ausfall', (await stumm(() => sp.pruefeHostFreigabe('porn-videos.ch'))).r.ok === false);

        familie.set('filter-einmal-a112.ch', 'einmal-wirft');
        vor = aufrufe.length;
        const e = await stumm(() => sp.pruefeHostFreigabe('filter-einmal-a112.ch'));
        gleich('Fehler beim ersten Versuch → eine Wiederholung, deren Antwort gilt', [e.r, doh(vor).length], [{ ok: false, grund: 'inhalt' }, 2]);

        familie.set('filter-haengt-a112.ch', 'haengt');
        vor = aufrufe.length;
        const t0 = Date.now();
        // AbortSignal.timeout hält die Ereignisschleife nicht offen (im Server läuft sie ohnehin) — hier ein Platzhalter-Timer
        const halt = setTimeout(() => undefined, 10_000);
        const f = await stumm(() => sp.pruefeHostFreigabe('filter-haengt-a112.ch'));
        clearTimeout(halt);
        const ms = Date.now() - t0;
        pruefe('Zeitlimit 1500 ms je Versuch: keine Antwort → nach ~3 s durchlassen', f.r.ok === true && doh(vor).length === 2 && ms >= 2900 && ms < 4500, `${ms} ms, ${doh(vor).length} Versuche`);

        vor = aufrufe.length;
        const g = await stumm(() => sp.pruefeHostFreigabe('192.0.2.10'));
        gleich('IP-Adresse: keine Filter-Abfrage (kein Name)', [g.r, doh(vor).length], [{ ok: true }, 0]);

        sp.filterZwischenspeicher().leeren();
        await stumm(async () => {
            for (let i = 0; i < sp.FILTER_CACHE_MAX + 5; i++) await sp.pruefeHostFreigabe(`muster-${i}.ch`);
        });
        vor = aufrufe.length;
        await stumm(() => sp.pruefeHostFreigabe('muster-0.ch'));
        const nachAeltestem = doh(vor).length;
        vor = aufrufe.length;
        await stumm(() => sp.pruefeHostFreigabe(`muster-${sp.FILTER_CACHE_MAX + 4}.ch`));
        gleich(`Zwischenspeicher höchstens ${sp.FILTER_CACHE_MAX} Einträge, der älteste fällt weg`, [sp.filterZwischenspeicher().groesse() <= sp.FILTER_CACHE_MAX, nachAeltestem, doh(vor).length], [true, 1, 0]);
    }

    /* ------------------------------------------------------------------ */
    /* 4. Abrufpfad: gesperrter Host wird nicht geladen                    */
    /* ------------------------------------------------------------------ */
    {
        const gefragt = [];
        let fehlerCode = null;
        try {
            await netz.holeSicher('https://www.gesperrt-beispiel-a112.ch/seite', {
                akzeptiere: 'html',
                zeitMs: 2000,
                maxBytes: 10_000,
                hostFreigabe: async (h) => {
                    gefragt.push(h);
                    return false;
                },
            });
        } catch (e) {
            fehlerCode = e instanceof netz.NetzFehler ? e.code : String(e);
        }
        gleich('holeSicher mit hostFreigabe=false: NetzFehler host_inhalt vor jedem Abruf (Host geprüft)', [fehlerCode, gefragt], ['host_inhalt', ['www.gesperrt-beispiel-a112.ch']]);
        const sf = new scanner.ScanFehler('inhalt', 'x');
        pruefe('ScanFehlerCode «inhalt» vorhanden', sf.code === 'inhalt');
    }

    /* ------------------------------------------------------------------ */
    /* 5. Datensätze: Stufe, Freigabe                                      */
    /* ------------------------------------------------------------------ */
    const PROFIL = {
        firma: 'Muster Holzbau', website: 'https://www.muster-holzbau.ch', assistent_name: 'Lena', branche: 'Holzbau', telefon: null, email: null, adresse: null,
        oeffnungszeiten_text: null, firma_text: 'Test.', faehigkeiten: ['Beantwortet Fragen'], wissen: [], logo_url: null, farben: null, stimme: 'weiblich',
    };
    const extrakt = (host, over = {}) => ({
        start_url: `https://${host}/`, end_url: `https://www.${host}/`, host, sprache: 'de', seiten: [], titel: null, meta_description: null, og_site_name: null, og_image: null,
        jsonld_name: null, jsonld_beschreibung: null, firma: null, firma_quelle: 'host', logo_kandidaten: [], logo: null, theme_color: null, css_farben: [], button_farben: [],
        farben: null, farbe_quelle: null, farb_signale: [], telefone: [], emails: [], adressen: [], oeffnungszeiten: [], ueberschriften: [], navigation: [], abschnitte: [],
        text: '', personen: [], team_seiten: 0, plattform: null, hinweise: [], uid_kandidaten: [], ...over,
    });
    const neuerScan = (host, over = {}, stufe) => scans.speichereNeuenScan({ ...(stufe ? { stufe } : {}), extrakt: extrakt(host, over), profil: PROFIL, profil_quelle: 'regeln', assistent_weiblich: true, schritte: [{ schluessel: 'website', ok: true }], dauer_ms: 1 });
    {
        const alt = await neuerScan('muster-holzbau.ch');
        const gelesen = await scans.leseScan(alt.id);
        gleich('Datensatz ohne stufe (vor AUFTRAG-112) → «voll»', ['stufe' in gelesen, scans.scanStufe(gelesen), scans.scanStufe({})], [false, 'voll', 'voll']);
        const vp = await neuerScan('muster-holzbau.ch', {}, 'vorpruefung');
        gleich('Datensatz mit stufe vorpruefung → «vorpruefung»', scans.scanStufe(await scans.leseScan(vp.id)), 'vorpruefung');
        gleich(
            'scanFreigegeben: gesperrter Host → false (auch End-Adresse, www, Subdomain), sonst true',
            [
                sp.scanFreigegeben({ extrakt: { host: 'pornhub.com' } }),
                sp.scanFreigegeben({ extrakt: { host: 'beispiel.ch', end_url: 'https://www.xvideos.com/' } }),
                sp.scanFreigegeben({ extrakt: { host: 'www.sub.xnxx.com' } }),
                sp.scanFreigegeben({ extrakt: { host: 'elektro-tel.ch', end_url: 'https://www.elektro-tel.ch/' } }),
                sp.scanFreigegeben(null),
            ],
            [false, false, false, true, false],
        );
    }

    /* ------------------------------------------------------------------ */
    /* 6. Routen                                                           */
    /* ------------------------------------------------------------------ */
    const post = (url, body) => new Request(`http://localhost:3005${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.0.2.12' }, body: JSON.stringify(body) });
    const lesen = async (p) => {
        const { r, zeilen } = await stumm(p);
        return { status: r.status, d: await r.json().catch(() => null), zeilen };
    };
    const zahl = async (praefix) => (await speicherMod.speicher().liste(praefix)).length;
    {
        const beide = await lesen(() => scanRoute.POST(post('/api/demo/scan', { url: 'elektro-tel.ch', scan_id: 's-abcdefghijklmnop' })));
        gleich('POST /api/demo/scan {url, scan_id} → 400', beide.status, 400);

        const vorScans = await zahl('scan/');
        let vor = aufrufe.length;
        const ph = await lesen(() => scanRoute.POST(post('/api/demo/scan', { url: 'pornhub.com' })));
        pruefe('POST /api/demo/scan {url: pornhub.com} → 422 MELDUNG.urlInhalt (wortgleich)', ph.status === 422 && ph.d?.fehler === 'Diese Website können wir für die Demo nicht verwenden. Bitte geben Sie die Website Ihrer Firma ein.', JSON.stringify(ph.d));
        gleich('pornhub.com: kein Netzaufruf (Stufe A ohne Netz), kein Scan-Datensatz', [aufrufe.length - vor, (await zahl('scan/')) - vorScans], [0, 0]);
        const xv = await lesen(() => scanRoute.POST(post('/api/demo/scan', { url: 'https://WWW.XVideos.com/irgendwas?x=1' })));
        gleich('https://WWW.XVideos.com/… → 422 urlInhalt', xv.status, 422);

        // Reihenfolge: Stufe A vor dem Limit (zählt nicht), Stufe B nach dem Limit (zählt als Versuch)
        process.env.DEMO_LIMITS_AUS = '0';
        try {
            const limitVor = await zahl('limit/');
            await lesen(() => scanRoute.POST(post('/api/demo/scan', { url: 'sexy-cams.ch' })));
            const nachA = await zahl('limit/');
            familie.set('filter-route-a112.ch', 'gesperrt');
            vor = aufrufe.length;
            const b = await lesen(() => scanRoute.POST(post('/api/demo/scan', { url: 'filter-route-a112.ch' })));
            const nachB = await zahl('limit/');
            gleich('Reihenfolge: Stufe A vor dem Limit (zählt nicht), Stufe B danach (zählt als Versuch)', [nachA - limitVor, nachB > nachA], [0, true]);
            pruefe('Stufe B gesperrt (Cloudflare for Families) → 422 urlInhalt, eine Filter-Abfrage, kein Scan-Datensatz, kein Website-Abruf', b.status === 422 && b.d?.fehler === api.MELDUNG.urlInhalt && doh(vor).length === 1 && aufrufe.length - vor === 1 && (await zahl('scan/')) === vorScans, `${b.status} ${JSON.stringify(b.d)}`);
            pruefe('Journal Stufe B: «[demo/sperre] host=filter-route-a112.ch grund=inhalt»', b.zeilen.includes('[demo/sperre] host=filter-route-a112.ch grund=inhalt'), b.zeilen.filter((z) => z.includes('sperre')).join(' | '));
        } finally {
            process.env.DEMO_LIMITS_AUS = '1';
        }
    }
    {
        // Vorprüfungs-Scan (Firma noch nicht bestätigt)
        const ET_HAUPT = { name: 'Elektro-Tel AG für elektrotechnische Anlagen', ehraid: 51204, uid: 'CHE107160757', uidFormatted: 'CHE-107.160.757', legalSeat: 'Winterthur', legalFormId: 3, status: 'EXISTIEREND', deleteDate: null };
        zefixAntwort = ({ body }) => (body?.name === 'CHE-107.160.757' ? json(200, { list: [ET_HAUPT] }) : json(404, { error: { code: 'API.ZFR.SEARCH.NORESULT' } }));
        const vp = await neuerScan('elektro-tel.ch', { uid_kandidaten: ['CHE107160757'], titel: 'Elektro-Tel AG', firma: 'Elektro-Tel AG' }, 'vorpruefung');
        let vor = aufrufe.length;
        const s2 = await lesen(() => scanRoute.POST(post('/api/demo/scan', { scan_id: vp.id })));
        pruefe('Stufe 2 ohne Nachweis → 403 handelsregister_fehlt (Text wie Anruf), kein Abruf', s2.status === 403 && s2.d?.code === texte.HR_CODE_FEHLT && s2.d?.fehler === texte.HR_TEXT.fehlt && aufrufe.length === vor, JSON.stringify(s2.d));
        const UNV = { code: 'scan_unvollstaendig', fehler: 'Ihr Assistent wird noch vorbereitet. Bitte bestätigen Sie zuerst Ihre Firma und warten Sie einen Moment.' };
        const pr = await lesen(() => profilRoute.POST(post('/api/demo/profil', { scan_id: vp.id })));
        gleich('POST /api/demo/profil auf Vorprüfungs-Scan → 409 scan_unvollstaendig (wortgleich)', [pr.status, pr.d], [409, UNV]);
        const fa = await lesen(() => faehigkeitenRoute.POST(post('/api/demo/faehigkeiten', { scan_id: vp.id })));
        gleich('POST /api/demo/faehigkeiten auf Vorprüfungs-Scan → 409 scan_unvollstaendig', [fa.status, fa.d?.code], [409, 'scan_unvollstaendig']);
        const bi = await stumm(() => bildRoute.GET(new Request(`http://localhost:3005/api/demo/bild/${vp.id}/0`), { params: Promise.resolve({ scan: vp.id, n: '0' }) }));
        gleich('GET /api/demo/bild/<scan>/0 auf Vorprüfungs-Scan → 409 scan_unvollstaendig', [bi.r.status, (await bi.r.json()).code], [409, 'scan_unvollstaendig']);
        const anrufBody = { scan_id: vp.id, nummer: '+41790000112', sprache: 'hochdeutsch', einwilligung: true, honigtopf: '' };
        const an0 = await lesen(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody)));
        gleich('POST /api/demo/anruf auf Vorprüfungs-Scan ohne Nachweis → 403 handelsregister_fehlt (Nachweis zuerst)', [an0.status, an0.d?.code], [403, texte.HR_CODE_FEHLT]);
        // Handelsregister arbeitet auf dem Vorprüfungs-Datensatz (UID aus dem Impressum)
        const h1 = await lesen(() => hrRoute.POST(post('/api/demo/handelsregister', { scan_id: vp.id })));
        const h2 = await lesen(() => hrRoute.POST(post('/api/demo/handelsregister', { scan_id: vp.id, bestaetige: 'CHE107160757' })));
        gleich('Handelsregister auf dem Vorprüfungs-Scan: Treffer über die UID, Bestätigung gebunden «uid»', [h1.status, h1.d?.ergebnis, h1.d?.quelle, h2.status, h2.d?.bestaetigt?.gebunden], [200, 'treffer', 'uid', 200, 'uid']);
        const auftraegeVor = await zahl('auftrag/');
        const an1 = await lesen(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody)));
        gleich('POST /api/demo/anruf mit gültigem Nachweis, aber Vorprüfung → 409 scan_unvollstaendig, kein Auftrag', [an1.status, an1.d, (await zahl('auftrag/')) - auftraegeVor], [409, UNV, 0]);

        // Stufe 2 mit Nachweis: Vollscan wird versucht (hier: End-Adresse .invalid → formal gesperrt, kein Netz)
        const vpInv = await neuerScan('muster-a112.invalid', { end_url: 'https://www.muster-a112.invalid/', uid_kandidaten: ['CHE107160757'] }, 'vorpruefung');
        await stumm(() => hr.automatischePruefung(vpInv));
        await stumm(() => hr.bestaetige(vpInv, 'CHE107160757'));
        vor = aufrufe.length;
        const s3 = await lesen(() => scanRoute.POST(post('/api/demo/scan', { scan_id: vpInv.id })));
        pruefe('Stufe 2 mit Nachweis: Vollscan läuft (End-Adresse formal gesperrt → 422), Datensatz bleibt Vorprüfung', s3.status === 422 && s3.d?.fehler === api.MELDUNG.urlGesperrt && scans.scanStufe(await scans.leseScan(vpInv.id)) === 'vorpruefung' && aufrufe.length === vor, `${s3.status} ${JSON.stringify(s3.d)}`);

        // voll (Datensatz ohne Feld): Antwort aus dem Datensatz, kein neuer Abruf, gleiche Form wie bisher
        const voll = await neuerScan('elektro-tel.ch', { uid_kandidaten: ['CHE107160757'], seiten: [{ url: 'https://www.elektro-tel.ch/', status: 200, bytes: 1, ms: 1, art: 'start' }] });
        vor = aufrufe.length;
        const sv = await lesen(() => scanRoute.POST(post('/api/demo/scan', { scan_id: voll.id })));
        gleich(
            'Stufe 2 auf «voll» (auch ohne Feld): Antwort aus dem Datensatz, kein Abruf, Schlüssel wie bisher',
            [sv.status, sv.d?.scan_id === voll.id, Object.keys(sv.d ?? {}).sort().join(','), aufrufe.length - vor],
            [200, true, 'assistent_weiblich,dauer_ms,farb_signale,funde,logos,profil,profil_quelle,scan_id,schritte', 0],
        );
    }
    {
        // gesperrter Host (vor AUFTRAG-112 gespeichert): jede Route weist ab (404 MELDUNG.scanAbgelaufen)
        const alt = await neuerScan('pornhub.com', { uid_kandidaten: ['CHE107160757'] });
        const r = [];
        r.push((await lesen(() => scanRoute.POST(post('/api/demo/scan', { scan_id: alt.id })))).status);
        r.push((await lesen(() => profilRoute.POST(post('/api/demo/profil', { scan_id: alt.id })))).status);
        r.push((await lesen(() => faehigkeitenRoute.POST(post('/api/demo/faehigkeiten', { scan_id: alt.id })))).status);
        r.push((await lesen(() => hrRoute.POST(post('/api/demo/handelsregister', { scan_id: alt.id })))).status);
        r.push((await lesen(() => anrufRoute.POST(post('/api/demo/anruf', { scan_id: alt.id, nummer: '+41790000112', sprache: 'hochdeutsch', einwilligung: true, honigtopf: '' })))).status);
        const bi = await stumm(() => bildRoute.GET(new Request(`http://localhost:3005/api/demo/bild/${alt.id}/0`), { params: Promise.resolve({ scan: alt.id, n: '0' }) }));
        r.push(bi.r.status);
        const text = (await lesen(() => profilRoute.POST(post('/api/demo/profil', { scan_id: alt.id })))).d?.fehler;
        gleich('Gesperrter Host im Datensatz: scan (Stufe 2), profil, faehigkeiten, handelsregister, anruf, bild → 404', r, [404, 404, 404, 404, 404, 404]);
        gleich('… mit MELDUNG.scanAbgelaufen', text, api.MELDUNG.scanAbgelaufen);
    }

    /* ------------------------------------------------------------------ */
    /* 7. Vorprüfung: Impressum-Auswahl, Profil                            */
    /* ------------------------------------------------------------------ */
    {
        const html = `<!doctype html><html lang="de"><head><title>Muster Holzbau AG</title></head><body>
            <nav><a href="/">Start</a><a href="/leistungen">Leistungen</a><a href="/ueber-uns">Über uns</a><a href="/kontakt">Kontakt</a></nav>
            <main><h1>Willkommen</h1><p>Holzbau in Winterthur.</p></main>
            <footer><a href="/datenschutz">Datenschutz</a><a href="/impressum">Impressum</a><a href="/rechtliche-angaben">Rechtliche Angaben</a><a href="/agb">AGB</a><a href="https://andere-firma.ch/impressum">Partner</a></footer>
            </body></html>`;
        const seite = extraktion.analysiereSeite(html, 'https://www.muster-holzbau.ch/', true);
        const impressum = scanner.waehleImpressumSeiten(seite, 'https://www.muster-holzbau.ch/', 'de');
        const voll = scanner.waehleUnterseiten(seite, 'https://www.muster-holzbau.ch/', 'de');
        gleich('Vorprüfung: nur Impressum-Links (höchstens 2, gleiche Site), keine anderen Seiten', impressum, ['https://www.muster-holzbau.ch/impressum', 'https://www.muster-holzbau.ch/rechtliche-angaben']);
        pruefe('Vorprüfung: erste Impressum-Seite = Impressum-Wahl des Vollscans', voll.includes(impressum[0]), voll.join(' | '));
        const p = profilMod.vorpruefungsProfil(extrakt('muster-holzbau.ch', { firma: 'Muster Holzbau AG' }));
        gleich('Profil der Vorprüfung: nur Firma (wie Regel-Profil) und Website; kein Wissen, keine Fähigkeiten, kein Logo, keine Farben', [p.firma, p.website, p.wissen.length, p.faehigkeiten.length, p.logo_url, p.farben, p.assistent_name], ['Muster Holzbau AG', 'https://www.muster-holzbau.ch', 0, 0, null, null, '']);
        gleich('Profil der Vorprüfung: Firma wie im Regel-Profil', p.firma, profilMod.regelProfil(extrakt('muster-holzbau.ch', { firma: 'Muster Holzbau AG' })).profil.firma);
    }

    /* ------------------------------------------------------------------ */
    /* 8. Texte (P6, wortgleich)                                           */
    /* ------------------------------------------------------------------ */
    {
        gleich('MELDUNG.urlInhalt', api.MELDUNG.urlInhalt, 'Diese Website können wir für die Demo nicht verwenden. Bitte geben Sie die Website Ihrer Firma ein.');
        gleich('MELDUNG.scanUnvollstaendig', api.MELDUNG.scanUnvollstaendig, 'Ihr Assistent wird noch vorbereitet. Bitte bestätigen Sie zuerst Ihre Firma und warten Sie einen Moment.');
        const S = texte.HR_SCHRITT;
        gleich(
            'Telefon-Schritte, Zeile im Firmen-Schritt, Knopf',
            [S.websiteErreichbar, S.telefonPruefung, S.telefonNichtGefunden, S.telefonNichtGefundenDetail, S.assistentWartet, S.websiteWirdGelesen, S.websiteGelesen, S.websiteGelesenDetail('elektro-tel.ch', 9), S.leseHinweis, S.nochmalsVersuchen],
            [
                'Website erreichbar',
                'Firma wird im Handelsregister geprüft …',
                'Firma im Handelsregister nicht gefunden',
                'Unten nach Firmenname oder UID suchen',
                'Wartet auf die Bestätigung Ihrer Firma',
                'Website wird gelesen …',
                'Website gelesen',
                'elektro-tel.ch · 9 Seiten',
                'Ihre Website lesen wir erst, nachdem Sie Ihre Firma bestätigt haben.',
                'Nochmals versuchen',
            ],
        );
    }
    pruefe('Kein Aufruf an fremde Adressen (nur Cloudflare for Families und Zefix, gemockt)', aufrufe.every((a) => a.url.startsWith('https://family.cloudflare-dns.com/') || a.url.startsWith('https://www.zefix.admin.ch/')), `${aufrufe.length} Aufrufe`);
} finally {
    globalThis.fetch = altFetch;
    rmSync(TEST_STORE, { recursive: true, force: true });
}

console.log(`\n${gesamt - fehler}/${gesamt} Prüfungen bestanden.`);
process.exit(fehler ? 1 : 0);
