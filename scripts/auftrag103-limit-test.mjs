#!/usr/bin/env node
/**
 * auftrag103-limit-test.mjs (AUFTRAG-103, Punkt 8) — Limits je Gerät und Adresse über HTTP.
 *
 * NUR gegen den zweiten Dev-Server auf Port 3011, gestartet mit der Prozess-Umgebung
 *   DEMO_LIMITS_AUS=0  DEMO_ANSTOSS_URL=http://127.0.0.1:9  DEMO_STORE_DIR=<eigener Ordner>
 *   TURNSTILE_SITE_KEY / TURNSTILE_SECRET = Cloudflare-Testschlüssel
 * So entsteht nie ein echter Anruf (Port 9 ist zu; die Anlage holt Aufträge nur vom Branch-Deploy).
 * Andere Ziele bricht das Skript ab.
 *
 * Adressen kommen über `x-forwarded-for` (Dokumentationsbereiche RFC 5737/3849) und erscheinen in
 * Ausgabe und Beleg nur als Bezeichnung; die Testnummer (044 552 03 06 laut Auftrag) erscheint nie.
 * Die Regel je Entscheid liest das Skript aus dem Server-Log (`[demo/limit] …`).
 *
 *   DEMO_STORE_DIR=<Ordner des 3011-Servers> SERVER_LOG=<Log des 3011-Servers> PRUEF_TOKEN=<DEMO_TOKEN des 3011-Servers> \
 *     node scripts/auftrag103-limit-test.mjs
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3011';
const ziel = new URL(BASE);
if (!['localhost', '127.0.0.1'].includes(ziel.hostname) || ziel.port !== '3011' || ziel.protocol !== 'http:') {
    console.error('Abbruch: Dieser Test löst Anruf-Aufträge aus und läuft NUR gegen http://localhost:3011.');
    process.exit(2);
}
const STORE = process.env.DEMO_STORE_DIR ? path.resolve(process.env.DEMO_STORE_DIR) : null;
const LOG = process.env.SERVER_LOG ? path.resolve(process.env.SERVER_LOG) : null;
if (!STORE || !LOG || !existsSync(LOG)) {
    console.error('Abbruch: DEMO_STORE_DIR (Speicher des 3011-Servers) und SERVER_LOG (dessen Log) angeben.');
    process.exit(2);
}
const AUSGABE = path.resolve(ROOT, '..', 'auftraege', 'ergebnisse', 'A103-limits-lokal.json');
const SITE = 'infraone.ch';
const NUMMER = '044 552 03 06';
const TURNSTILE_TESTTOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

/* Adressen (Dokumentationsbereiche) — nur die Bezeichnung geht in Ausgabe und Beleg */
const ADRESSE = {
    'IPv4 A': '198.51.100.23',
    'IPv6 X1 (/64 P)': '2001:db8:103:1::a1',
    'IPv6 X2 (/64 P)': '2001:db8:103:1:8a2e:370:7334:b2',
    'IPv6 Y (anderes /64)': '2001:db8:103:2::c3',
    'IPv4 B': '198.51.100.24',
};
const KLARTEXT = [...Object.values(ADRESSE), '+41445520306', '445520306', '044 552 03 06'];

/* ---------- Log des Servers ---------- */
function leseLog() {
    const buf = readFileSync(LOG);
    return buf[0] === 0xff && buf[1] === 0xfe ? buf.subarray(2).toString('utf16le') : buf.toString('utf8');
}
let logStand = leseLog().length;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function neueLogZeilen() {
    await pause(400);
    const text = leseLog();
    const neu = text.slice(logStand);
    logStand = text.length;
    return neu
        .split(/\r?\n/)
        .map((z) => z.replace(/^npx : /, '').trim())
        .filter((z) => /^\[demo\/(limit|anruf|anstoss|scan)\]/.test(z));
}

/* ---------- Anfragen ---------- */
async function post(pfad, body, { adresse, cookie }) {
    const headers = { 'Content-Type': 'application/json', 'x-forwarded-for': ADRESSE[adresse] };
    if (cookie) headers.cookie = cookie;
    const t0 = Date.now();
    const res = await fetch(BASE + pfad, { method: 'POST', headers, body: JSON.stringify(body) });
    const setCookie = res.headers.get('set-cookie');
    const daten = await res.json().catch(() => ({}));
    const ms = Date.now() - t0;
    const log = await neueLogZeilen();
    return { status: res.status, daten, setCookie, ms, log };
}
const cookieAus = (setCookie) => (setCookie ? setCookie.split(';')[0] : null);
const regelAus = (log) => {
    const z = log.find((l) => l.startsWith('[demo/limit]'));
    if (!z) return null;
    const m = z.match(/^\[demo\/limit\] (\S+) art=\S+ regel=(\S+) ip_art=(\S+) ip=(\S+) geraet=(\S+) nummer=(\S+)$/);
    return m ? { entscheid: m[1], regel: m[2], ip_art: m[3], ip: m[4], geraet: m[5], nummer: m[6] } : { roh: 'Format abweichend' };
};

function limitsZuruecksetzen() {
    const dir = path.join(STORE, 'limit');
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}

const szenarien = [];
const pruefungen = [];
function pruefe(name, ok, detail = '') {
    pruefungen.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 200) : ''}`);
}

function zeile(z, versuch, art, adresse, cookieArt, r) {
    const regel = regelAus(r.log);
    const eintrag = {
        versuch,
        art,
        adresse,
        cookie: cookieArt,
        status: r.status,
        meldung: r.daten?.fehler ?? (r.daten?.scan_id ? 'Scan erstellt' : r.daten?.id ? 'Auftrag angelegt' : ''),
        regel: regel?.regel ?? null,
        log_ip: regel?.ip ?? null,
        log_ip_art: regel?.ip_art ?? null,
        log_geraet: regel?.geraet ?? null,
        set_cookie: !!r.setCookie,
        ms: r.ms,
    };
    z.push(eintrag);
    console.log(`  ${art.padEnd(5)} #${versuch} ${adresse.padEnd(22)} Cookie ${cookieArt.padEnd(10)} → ${r.status} ${eintrag.regel ?? ''} ${eintrag.meldung.slice(0, 70)}`);
    return eintrag;
}

async function scanReihe(z, { adresse, mitCookie, cookie: start }) {
    let cookie = start ?? null;
    let scanId = null;
    for (let i = 1; i <= 4; i++) {
        const r = await post('/api/demo/scan', { url: SITE }, { adresse: typeof adresse === 'function' ? adresse(i) : adresse, cookie: mitCookie ? cookie : null });
        zeile(z, i, 'Scan', typeof adresse === 'function' ? adresse(i) : adresse, mitCookie ? (cookie ? 'gesendet' : 'keins') : 'gelöscht', r);
        if (mitCookie && !cookie) cookie = cookieAus(r.setCookie);
        if (!scanId && r.status === 200) scanId = r.daten.scan_id;
    }
    return { cookie, scanId };
}

async function anrufReihe(z, { adresse, mitCookie, cookie, scanId }) {
    const ids = [];
    for (let i = 1; i <= 4; i++) {
        const a = typeof adresse === 'function' ? adresse(i) : adresse;
        const r = await post(
            '/api/demo/anruf',
            { scan_id: scanId, nummer: NUMMER, sprache: 'hochdeutsch', einwilligung: true, honigtopf: '', turnstile: TURNSTILE_TESTTOKEN },
            { adresse: a, cookie: mitCookie ? cookie : null },
        );
        zeile(z, i, 'Anruf', a, mitCookie ? (cookie ? 'gesendet' : 'keins') : 'gelöscht', r);
        if (r.status === 201) ids.push(r.daten.id);
    }
    return ids;
}

const MELDUNG_GERAET = 'Von diesem Gerät wurden heute bereits zwei Testanrufe angefordert. Gerne zeigen wir Ihnen den Assistenten persönlich: 052 222 18 18.';
const MELDUNG_SCAN_STUNDE = 'Sie haben in der letzten Stunde bereits drei Websites getestet. Bitte versuchen Sie es später wieder oder rufen Sie uns an: 052 222 18 18.';
const MELDUNG_NUMMER = 'Diese Nummer hat heute bereits zwei Testanrufe erhalten. Gerne zeigen wir Ihnen den Assistenten persönlich: 052 222 18 18.';
const folge = (z, art) => z.filter((e) => e.art === art).map((e) => e.status).join(',');
const regeln = (z, art) => z.filter((e) => e.art === art).map((e) => e.regel ?? '-').join(',');

/* ---------- Signatur am Server (ohne Scan: ungültige Adresse → 4xx vor der Limit-Prüfung, Cookie trotzdem gesetzt) ---------- */
{
    const ohne = await post('/api/demo/scan', { url: 'x' }, { adresse: 'IPv4 B', cookie: null });
    const gueltig = cookieAus(ohne.setCookie);
    const mit = await post('/api/demo/scan', { url: 'x' }, { adresse: 'IPv4 B', cookie: gueltig });
    const kaputt = gueltig.slice(0, 15) + (gueltig[15] === 'A' ? 'B' : 'A') + gueltig.slice(16);
    const manip = await post('/api/demo/scan', { url: 'x' }, { adresse: 'IPv4 B', cookie: kaputt });
    pruefe(
        'Server: ohne Cookie → Set-Cookie demo_geraet (HttpOnly, SameSite=Lax, Path=/, Max-Age 400 Tage, lokal ohne Secure)',
        [400, 422].includes(ohne.status) && /^demo_geraet=[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}; Path=\/; Max-Age=34560000; HttpOnly; SameSite=Lax$/.test(ohne.setCookie ?? ''),
    );
    pruefe('Server: gültiges Cookie → kein neues Cookie', [400, 422].includes(mit.status) && mit.setCookie === null);
    pruefe('Server: manipuliertes Cookie → neue Kennung', manip.setCookie !== null && cookieAus(manip.setCookie) !== gueltig);
}

/* ---------- Szenario 1: mit Cookie (gleiches Gerät), IPv4 A ---------- */
limitsZuruecksetzen();
const s1 = [];
console.log('\nSzenario 1: mit Cookie, IPv4 A');
const r1 = await scanReihe(s1, { adresse: 'IPv4 A', mitCookie: true });
const ids1 = await anrufReihe(s1, { adresse: 'IPv4 A', mitCookie: true, cookie: r1.cookie, scanId: r1.scanId });
szenarien.push({ name: 'Szenario 1', beschreibung: 'Mit Cookie (gleiches Gerät), IPv4 A, Zähler vorher leer', zeilen: s1 });
pruefe('S1 Scan 200,200,200,429 (geraet_stunde, Meldung Stunde)', folge(s1, 'Scan') === '200,200,200,429' && s1.find((e) => e.art === 'Scan' && e.versuch === 4)?.regel === 'geraet_stunde' && s1.find((e) => e.art === 'Scan' && e.versuch === 4)?.meldung === MELDUNG_SCAN_STUNDE, regeln(s1, 'Scan'));
pruefe('S1 Anruf 201,201,429,429 (geraet_tag, Meldung Gerät)', folge(s1, 'Anruf') === '201,201,429,429' && s1.filter((e) => e.art === 'Anruf' && e.status === 429).every((e) => e.regel === 'geraet_tag' && e.meldung === MELDUNG_GERAET), regeln(s1, 'Anruf'));

/* ---------- Szenario 2: danach Cookie gelöscht, gleiche Adresse → Adresse greift ---------- */
const s2 = [];
console.log('\nSzenario 2: Fortsetzung, Cookie vor jedem Versuch gelöscht, IPv4 A');
await scanReihe(s2, { adresse: 'IPv4 A', mitCookie: false });
await anrufReihe(s2, { adresse: 'IPv4 A', mitCookie: false, scanId: r1.scanId });
szenarien.push({ name: 'Szenario 2', beschreibung: 'Fortsetzung von Szenario 1 ohne Zurücksetzen: Cookie vor jedem Versuch gelöscht (neues Gerät), gleiche IPv4 A', zeilen: s2 });
pruefe('S2 Scan 4× 429 (ip_stunde)', folge(s2, 'Scan') === '429,429,429,429' && s2.filter((e) => e.art === 'Scan').every((e) => e.regel === 'ip_stunde'), regeln(s2, 'Scan'));
pruefe('S2 Anruf 4× 429 (ip_tag, Meldung Gerät)', folge(s2, 'Anruf') === '429,429,429,429' && s2.filter((e) => e.art === 'Anruf').every((e) => e.regel === 'ip_tag' && e.meldung === MELDUNG_GERAET), regeln(s2, 'Anruf'));
pruefe('S2 jede Antwort ohne Cookie setzt ein neues', s2.every((e) => e.set_cookie));

/* ---------- Szenario 3: Zähler leer, Cookie vor jedem Versuch gelöscht, IPv4 A ---------- */
limitsZuruecksetzen();
const s3 = [];
console.log('\nSzenario 3: Zähler leer, Cookie vor jedem Versuch gelöscht, IPv4 A');
const r3 = await scanReihe(s3, { adresse: 'IPv4 A', mitCookie: false });
await anrufReihe(s3, { adresse: 'IPv4 A', mitCookie: false, scanId: r3.scanId });
szenarien.push({ name: 'Szenario 3', beschreibung: 'Zähler vorher leer, Cookie vor jedem Versuch gelöscht, gleiche IPv4 A', zeilen: s3 });
pruefe('S3 Scan 200,200,200,429 (ip_stunde)', folge(s3, 'Scan') === '200,200,200,429' && s3.find((e) => e.art === 'Scan' && e.versuch === 4)?.regel === 'ip_stunde', regeln(s3, 'Scan'));
pruefe('S3 Anruf 201,201,429,429 (ip_tag)', folge(s3, 'Anruf') === '201,201,429,429' && s3.filter((e) => e.art === 'Anruf' && e.status === 429).every((e) => e.regel === 'ip_tag' && e.meldung === MELDUNG_GERAET), regeln(s3, 'Anruf'));

/* ---------- Szenario 4: zwei IPv6 im selben /64 abwechselnd, Cookie gelöscht ---------- */
limitsZuruecksetzen();
const s4 = [];
console.log('\nSzenario 4: zwei IPv6 im selben /64 abwechselnd, Cookie vor jedem Versuch gelöscht');
const wechsel = (i) => (i % 2 ? 'IPv6 X1 (/64 P)' : 'IPv6 X2 (/64 P)');
const r4 = await scanReihe(s4, { adresse: wechsel, mitCookie: false });
await anrufReihe(s4, { adresse: wechsel, mitCookie: false, scanId: r4.scanId });
szenarien.push({ name: 'Szenario 4', beschreibung: 'Zähler vorher leer, zwei verschiedene IPv6-Adressen im selben /64 abwechselnd, Cookie vor jedem Versuch gelöscht', zeilen: s4 });
pruefe('S4 Scan 200,200,200,429 (ip_stunde)', folge(s4, 'Scan') === '200,200,200,429' && s4.find((e) => e.art === 'Scan' && e.versuch === 4)?.regel === 'ip_stunde', regeln(s4, 'Scan'));
pruefe('S4 Anruf 201,201,429,429 (ip_tag)', folge(s4, 'Anruf') === '201,201,429,429' && s4.filter((e) => e.art === 'Anruf' && e.status === 429).every((e) => e.regel === 'ip_tag'), regeln(s4, 'Anruf'));
const ipHashes4 = new Set(s4.map((e) => e.log_ip));
pruefe('S4 beide Adressen → derselbe Zähler (gleicher ip-Hash im Log, Art v6)', ipHashes4.size === 1 && s4.every((e) => e.log_ip_art === 'v6'), [...ipHashes4].join(','));

/* ---------- Szenario 5: anderes /64, neues Gerät, gleiche Nummer → Nummer greift ---------- */
const s5 = [];
console.log('\nSzenario 5: Fortsetzung, anderes /64, neues Gerät, gleiche Nummer');
await anrufReihe(s5, { adresse: 'IPv6 Y (anderes /64)', mitCookie: false, scanId: r4.scanId });
szenarien.push({ name: 'Szenario 5', beschreibung: 'Fortsetzung von Szenario 4: anderes /64, Cookie gelöscht, gleiche Testnummer (bereits 2 Anrufe heute)', zeilen: s5 });
pruefe('S5 Anruf 4× 429 (nummer_tag, Meldung Nummer)', folge(s5, 'Anruf') === '429,429,429,429' && s5.every((e) => e.regel === 'nummer_tag' && e.meldung === MELDUNG_NUMMER), regeln(s5, 'Anruf'));
pruefe('S5 anderes /64 → anderer ip-Hash', s5.every((e) => e.log_ip && !ipHashes4.has(e.log_ip)));

/* ---------- Diagnosefelder: nur mit Bearer ---------- */
{
    const id = ids1[0];
    const oeff = await (await fetch(`${BASE}/api/demo/auftraege/${id}`)).json();
    const anlage = process.env.PRUEF_TOKEN ? await (await fetch(`${BASE}/api/demo/auftraege/${id}`, { headers: { Authorization: `Bearer ${process.env.PRUEF_TOKEN}` } })).json() : null;
    pruefe('Öffentliche Statusansicht ohne ip_hash/ip_art/geraet_hash', !('ip_hash' in oeff) && !('ip_art' in oeff) && !('geraet_hash' in oeff), Object.keys(oeff).join(','));
    pruefe(
        'Anlage-Ansicht (Bearer) mit ip_hash (= Log), ip_art v4, geraet_hash (= Log)',
        anlage && /^[0-9a-f]{24}$/.test(anlage.ip_hash) && anlage.ip_art === 'v4' && /^[0-9a-f]{24}$/.test(anlage.geraet_hash) &&
            anlage.ip_hash.startsWith(s1.find((e) => e.art === 'Anruf' && e.versuch === 1).log_ip) && anlage.geraet_hash.startsWith(s1.find((e) => e.art === 'Anruf' && e.versuch === 1).log_geraet),
        anlage ? Object.keys(anlage).join(',') : 'kein PRUEF_TOKEN',
    );
    szenarien.push({
        name: 'Diagnose',
        beschreibung: 'GET /api/demo/auftraege/{id} des 1. Anrufs aus Szenario 1',
        oeffentlich_felder: Object.keys(oeff),
        anlage_felder: anlage ? Object.keys(anlage) : null,
        anlage_diagnose: anlage ? { ip_hash: anlage.ip_hash, ip_art: anlage.ip_art, geraet_hash: anlage.geraet_hash } : null,
    });
}

/* ---------- Szenario 6: Zählen scheitert (Speicherfehler) → 500, Auftrag gelöscht, kein Anstoss ---------- */
{
    limitsZuruecksetzen();
    const s6 = [];
    console.log('\nSzenario 6: Speicherfehler beim Zählen');
    const scan = await post('/api/demo/scan', { url: SITE }, { adresse: 'IPv4 B', cookie: null });
    zeile(s6, 1, 'Scan', 'IPv4 B', 'gelöscht', scan);
    // Zähler-Ordner durch eine Datei ersetzen: Lesen liefert «leer», Schreiben scheitert
    limitsZuruecksetzen();
    writeFileSync(path.join(STORE, 'limit'), 'blockiert');
    const anzahl = (ordner) => (existsSync(path.join(STORE, ordner)) ? readdirSync(path.join(STORE, ordner)).length : 0);
    const auftraegeVorher = anzahl('auftrag');
    const markerVorher = anzahl('warteschlange');
    const r = await post('/api/demo/anruf', { scan_id: scan.daten.scan_id, nummer: NUMMER, sprache: 'hochdeutsch', einwilligung: true, honigtopf: '', turnstile: TURNSTILE_TESTTOKEN }, { adresse: 'IPv4 B', cookie: null });
    zeile(s6, 1, 'Anruf', 'IPv4 B', 'gelöscht', r);
    rmSync(path.join(STORE, 'limit'), { force: true });
    const auftraegeNachher = anzahl('auftrag');
    const markerNachher = anzahl('warteschlange');
    s6[1].log = r.log.filter((l) => !l.includes('[demo/limit]')).map((l) => l.replace(/mkdir '.*'$/, "mkdir '<Speicher>/limit'"));
    pruefe('S6 Zählen scheitert → 500 «Das hat leider nicht geklappt …»', r.status === 500 && r.daten.fehler === 'Das hat leider nicht geklappt. Bitte versuchen Sie es gleich nochmals.');
    pruefe('S6 Log: «Zählen fehlgeschlagen, kein Anstoss, Auftrag gelöscht», keine Anstoss-Zeile', r.log.some((l) => l.includes('Zählen fehlgeschlagen, kein Anstoss, Auftrag gelöscht')) && !r.log.some((l) => l.startsWith('[demo/anstoss]')), s6[1].log.join(' | '));
    pruefe('S6 weder Auftrag noch Warteschlangen-Marker übrig (Anzahl im Speicher unverändert)', auftraegeNachher === auftraegeVorher && markerNachher === markerVorher, `Aufträge ${auftraegeVorher} → ${auftraegeNachher}, Marker ${markerVorher} → ${markerNachher}`);
    szenarien.push({
        name: 'Szenario 6',
        beschreibung: 'Zähler-Ordner durch eine Datei ersetzt (Schreiben scheitert): Anruf → 500, Auftrag und Marker gelöscht, kein Anstoss',
        zeilen: s6,
        auftraege_vorher: auftraegeVorher,
        auftraege_nachher: auftraegeNachher,
        marker_vorher: markerVorher,
        marker_nachher: markerNachher,
    });
}

/* ---------- Log: Reihenfolge Zählen vor Anstoss, kein Klartext ---------- */
const ganzesLog = leseLog();
// PowerShell schreibt stderr-Zeilen als «npx : [demo/…] …» plus Fehlerzeilen («CategoryInfo …») — nur echte Zeilen zählen
const relevant = ganzesLog
    .split(/\r?\n/)
    .map((z) => z.replace(/^npx : /, '').trim())
    .filter((z) => /^\[demo\/(limit|anruf|anstoss)\]/.test(z));
pruefe('Log ohne Klartext-Adresse oder -Nummer', !KLARTEXT.some((k) => ganzesLog.includes(k)));
const angenommen = relevant.map((z, i) => ({ z, i })).filter(({ z }) => z.includes('[demo/limit] angenommen art=anruf'));
const anstoesse = relevant.map((z, i) => ({ z, i })).filter(({ z }) => z.includes('[demo/anstoss]'));
pruefe(
    'Log: je angenommenem Anruf zuerst «[demo/limit] angenommen», danach «[demo/anstoss] … ergebnis=fehler» (Port 9 zu)',
    angenommen.length > 0 && angenommen.length === anstoesse.length && angenommen.every(({ i }, k) => anstoesse[k].i > i) && anstoesse.every(({ z }) => /ergebnis=fehler http=- versuche=2/.test(z)),
    `${angenommen.length} angenommen, ${anstoesse.length} Anstösse`,
);

const ok = pruefungen.filter((p) => p.ok).length;
writeFileSync(
    AUSGABE,
    JSON.stringify(
        {
            erzeugt: new Date().toISOString(),
            ziel: BASE,
            site: SITE,
            hinweis: 'Adressen nur als Bezeichnung (Dokumentationsbereiche RFC 5737/3849 über x-forwarded-for); Testnummer laut Auftrag, nicht im Beleg. Regeln und Hash-Präfixe aus dem Server-Log.',
            pruefungen,
            szenarien,
            log_auszug: relevant.slice(-80).map((l) => l.replace(/mkdir '.*'$/, "mkdir '<Speicher>/limit'")),
        },
        null,
        2,
    ),
);
console.log(`\n${ok}/${pruefungen.length} Prüfungen bestanden. Beleg: ${path.relative(path.resolve(ROOT, '..'), AUSGABE)}`);
process.exit(ok === pruefungen.length ? 0 : 1);
