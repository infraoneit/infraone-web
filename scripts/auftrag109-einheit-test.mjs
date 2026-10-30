#!/usr/bin/env node
/**
 * auftrag109-einheit-test.mjs (AUFTRAG-109) — Einheits- und Route-Tests der
 * Handelsregister-Prüfung, ohne Server und OHNE Netz (fetch ist gemockt; jeder Aufruf an eine
 * fremde Adresse wirft):
 * - UID-Erkennung im Impressum-Text (mit/ohne Punkte, Leerzeichen, MWST/TVA, Prüfziffer)
 * - Zefix-Client: Treffer, mehrere Treffer, NORESULT, 401, Timeout, 5xx mit Wiederholung,
 *   gelöschte Firma, Firma in Auflösung, offizielles API (Basic Auth, Abbildung), Log ohne
 *   Zugangsdaten und ohne Suchbegriff
 * - Nachweis-Signatur: gültig, abgelaufen, falsche scan_id, manipuliert, anderer Schlüssel
 * - Ablauf je Scan: automatische Prüfung (UID, Name, Zwischenspeicher), manuelle Suche
 *   (höchstens 3), Bestätigung (nur gezeigte aktive Einträge), Register nicht erreichbar, Schalter
 * - Routen: POST /api/demo/anruf ohne Nachweis → 403, mit gültigem Nachweis → 201 (wie heute),
 *   abgelaufener/fremder Nachweis → 403; GET /api/demo/auftraege/[id] mit handelsregister
 *   {name, sitz, uid}; POST /api/demo/handelsregister
 *
 * Eigener Speicher-Ordner (Temp), kein DEMO_ANSTOSS_URL (kein Anstoss, kein Anruf).
 * Firmen in den Antworten: Elektro-Tel AG (öffentlicher Registereintrag, gemessen 30.10.2026)
 * und erfundene «Muster»-Firmen; Nummern erfunden.
 *
 *   node scripts/auftrag109-einheit-test.mjs
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
const TEST_STORE = mkdtempSync(path.join(os.tmpdir(), 'a109-einheit-'));
process.env.DEMO_STORE_DIR = TEST_STORE;
delete process.env.DEMO_ANSTOSS_URL;
delete process.env.TURNSTILE_SITE_KEY;
delete process.env.TURNSTILE_SECRET;
delete process.env.ZEFIX_USER;
delete process.env.ZEFIX_PASSWORD;
delete process.env.DEMO_HANDELSREGISTER;
for (const k of ['NETLIFY', 'SITE_ID', 'NETLIFY_BLOBS_CONTEXT', 'AWS_LAMBDA_FUNCTION_NAME']) delete process.env[k];
process.env.DEMO_LIMITS_AUS = '1';
process.env.DEMO_TOKEN = 'a109-test-schluessel-0123456789';

const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
const zefix = await imp('src/lib/demo/zefix.ts');
const hr = await imp('src/lib/demo/handelsregister.ts');
const texte = await imp('src/lib/demo/handelsregister-texte.ts');
const scans = await imp('src/lib/demo/scans.ts');
const speicherMod = await imp('src/lib/demo/speicher.ts');
const auftraege = await imp('src/lib/demo/auftraege.ts');
const anrufRoute = await imp('src/app/api/demo/anruf/route.ts');
const hrRoute = await imp('src/app/api/demo/handelsregister/route.ts');
const auftragRoute = await imp('src/app/api/demo/auftraege/[id]/route.ts');

let fehler = 0;
let gesamt = 0;
function pruefe(name, ok, detail = '') {
    gesamt++;
    if (!ok) fehler++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

/* ------------------------------------------------------------------ */
/* Antworten (Form wie gemessen am 30.10.2026, siehe Bericht A109)     */
/* ------------------------------------------------------------------ */

const ET_HAUPT = {
    name: 'Elektro-Tel AG für elektrotechnische Anlagen', ehraid: 51204, uid: 'CHE107160757', uidFormatted: 'CHE-107.160.757',
    legalSeatId: 230, legalSeat: 'Winterthur', registerOfficeId: 20, legalFormId: 3, status: 'EXISTIEREND', shabDate: '2022-05-09', deleteDate: null,
};
const ET_ZN1 = { ...ET_HAUPT, ehraid: 1322426, uid: 'CHE169547556', uidFormatted: 'CHE-169.547.556', legalSeat: 'Tägerwilen', legalFormId: 9 };
const ET_ZN2 = { ...ET_HAUPT, ehraid: 1383573, uid: 'CHE481479677', uidFormatted: 'CHE-481.479.677', legalSeat: 'Schaffhausen', legalFormId: 9 };
// erfundene Firmen (UIDs mit gültiger Prüfziffer, siehe zefix.uidPruefziffer)
const uidMit = (acht) => `CHE${acht}${zefix.uidPruefziffer(acht)}`;
const GELOESCHT_UID = uidMit('11239217');
const MUSTER_GELOESCHT = { name: 'Muster Handel GmbH in Liquidation', uid: GELOESCHT_UID, uidFormatted: zefix.formatiereUid(GELOESCHT_UID), legalSeat: 'Zug', legalFormId: 4, status: 'GELOESCHT', deleteDate: '2014-06-03' };
const MUSTER_AUFL = { name: 'Muster Bau AG in Liquidation', uid: uidMit('21891911'), uidFormatted: zefix.formatiereUid(uidMit('21891911')), legalSeat: 'Neuchâtel', legalFormId: 3, status: 'IN_AUFLOESUNG', deleteDate: null };
const NORESULT = { error: { code: 'API.ZFR.SEARCH.NORESULT', title: 'API.SEARCH.TITLE.NORESULT', message: null } };

const json = (status, daten) => new Response(JSON.stringify(daten), { status, headers: { 'Content-Type': 'application/json' } });

/** Gefälschtes fetch: protokolliert jeden Aufruf; `antworte(aufruf)` liefert Response oder wirft. */
function falschesFetch(antworte) {
    const aufrufe = [];
    const f = async (url, init = {}) => {
        const u = String(url);
        const body = typeof init.body === 'string' ? JSON.parse(init.body) : null;
        const a = { url: u, methode: init.method ?? 'GET', body, kopf: new Headers(init.headers ?? {}), signal: init.signal };
        aufrufe.push(a);
        if (!u.startsWith('https://www.zefix.admin.ch/')) throw new Error(`Test: fremde Adresse ${u}`);
        return antworte(a, aufrufe.length);
    };
    return { f, aufrufe };
}

/** Konsole mitschneiden (Log-Prüfung) */
async function mitLog(fn) {
    const zeilen = [];
    const alt = { info: console.info, warn: console.warn, error: console.error, log: console.log };
    console.info = console.warn = console.error = (...a) => zeilen.push(a.map(String).join(' '));
    try {
        const r = await fn();
        return { r, zeilen };
    } finally {
        Object.assign(console, alt);
    }
}

/* ------------------------------------------------------------------ */
/* 1. UID-Erkennung im Impressum-Text                                  */
/* ------------------------------------------------------------------ */

pruefe('Prüfziffer CHE-107.160.757 = 7 (Modulo 11)', zefix.uidPruefziffer('10716075') === 7);
pruefe('Prüfziffer Rest 10 → ungültig', zefix.uidPruefziffer('00000003') === null);
pruefe('UID mit Punkten', JSON.stringify(zefix.findeUids('Impressum · UID: CHE-107.160.757')) === '["CHE107160757"]');
pruefe('UID ohne Punkte', JSON.stringify(zefix.findeUids('UID CHE107160757 Winterthur')) === '["CHE107160757"]');
pruefe('UID mit MWST-Suffix', JSON.stringify(zefix.findeUids('MWST-Nr.: CHE-107.160.757 MWST')) === '["CHE107160757"]');
pruefe('UID mit Leerzeichen und TVA', JSON.stringify(zefix.findeUids('No TVA : CHE 107 160 757 TVA')) === '["CHE107160757"]');
pruefe('UID mit geschütztem Bindestrich (U+2011)', JSON.stringify(zefix.findeUids('UID: CHE‑107.160.757')) === '["CHE107160757"]');
pruefe('Falsche Prüfziffer wird verworfen', zefix.findeUids('UID: CHE-107.160.758').length === 0);
pruefe('Keine UID in anderen Zeichenfolgen', zefix.findeUids('XCHE-107.160.757 / CHE-107.160.7571 / IBAN CH93 0076 2011 6238 5295 7').length === 0);
pruefe(
    'Mehrere UIDs: Reihenfolge, ohne Dubletten, höchstens 3',
    JSON.stringify(zefix.findeUids(['Fusszeile CHE-107.160.757', 'Impressum CHE107160757 MWST und CHE-302.905.008', 'CHE-169.547.556', 'CHE-481.479.677'])) === '["CHE107160757","CHE302905008","CHE169547556"]',
);
pruefe('normalisiereUid mit Kleinschrift und MWST', zefix.normalisiereUid('che-107.160.757 mwst') === 'CHE107160757' && zefix.normalisiereUid('CHE-107.160.758') === null);
pruefe('formatiereUid', zefix.formatiereUid('CHE107160757') === 'CHE-107.160.757');
pruefe('UID in JSON-LD (vatID)', JSON.stringify(zefix.findeUids(JSON.stringify([{ '@type': 'Organization', vatID: 'CHE-107.160.757 MWST' }]))) === '["CHE107160757"]');

/* ------------------------------------------------------------------ */
/* 2. Zefix-Client (gemockt)                                           */
/* ------------------------------------------------------------------ */

{
    // Treffer (Namenssuche, Web-API)
    const m = falschesFetch(() => json(200, { list: [ET_HAUPT], hasMoreResults: false }));
    const { r, zeilen } = await mitLog(() => zefix.zefixSuche('name', 'Elektro-Tel AG', { fetch: m.f, log: 's-test000000000001' }));
    const a = m.aufrufe[0];
    pruefe('Web-API: POST search.json mit name, languageKey de, maxEntries 20', a?.url === zefix.ZEFIX_WEB_URL && a.methode === 'POST' && a.body?.name === 'Elektro-Tel AG' && a.body?.languageKey === 'de' && a.body?.maxEntries === 20);
    const t = r.ok ? r.treffer[0] : null;
    pruefe(
        'Treffer: Name, Sitz, UID formatiert, Status, Rechtsform, aktiv',
        r.ok && r.treffer.length === 1 && t.name === ET_HAUPT.name && t.sitz === 'Winterthur' && t.uid === 'CHE107160757' && t.uid_formatiert === 'CHE-107.160.757' && t.status === 'EXISTIEREND' && t.rechtsform === 'Aktiengesellschaft' && t.aktiv === true,
        JSON.stringify(t),
    );
    pruefe('Log: eine Zeile, ohne Suchbegriff und ohne Firmennamen', zeilen.length === 1 && /^\[demo\/zefix\] api=web art=name ergebnis=treffer http=200 anzahl=1 /.test(zeilen[0]) && !/Elektro/i.test(zeilen.join('\n')), zeilen[0]);
}
{
    // mehrere Treffer (Hauptsitz + 2 Zweigniederlassungen), Rangfolge
    const m = falschesFetch(() => json(200, { list: [ET_ZN1, ET_HAUPT, ET_ZN2] }));
    const r = await zefix.zefixSuche('name', 'Elektro-Tel AG', { fetch: m.f });
    const geordnet = r.ok ? zefix.ordneTreffer(r.treffer, 'Elektro-Tel AG') : [];
    pruefe('Mehrere Treffer: alle drei, aktiv', r.ok && r.treffer.length === 3 && r.treffer.every((t) => t.aktiv));
    pruefe('Rangfolge: Hauptsitz vor Zweigniederlassungen', geordnet[0]?.sitz === 'Winterthur' && geordnet.slice(1).every((t) => t.rechtsform === 'Zweigniederlassung'), geordnet.map((t) => t.sitz).join(','));
    const viele = Array.from({ length: 12 }, (_, i) => ({ ...ET_HAUPT, uid: uidMit(String(30000000 + i * 7)), name: `Muster ${i} AG` })).filter((x) => x.uid.length === 12);
    pruefe('ordneTreffer: höchstens 5', zefix.ordneTreffer(viele.map(zefix.trefferAusWeb).filter(Boolean), 'Muster').length === 5);
}
{
    // NORESULT (HTTP 404 mit Fehlercode)
    const m = falschesFetch(() => json(404, NORESULT));
    const r = await zefix.zefixSuche('name', 'Muster Nirgends AG', { fetch: m.f });
    pruefe('NORESULT → ok, leere Liste, keine Wiederholung', r.ok && r.treffer.length === 0 && m.aufrufe.length === 1);
}
{
    // 401 beim offiziellen API (Zugangsdaten gesetzt)
    process.env.ZEFIX_USER = 'a109-benutzer';
    process.env.ZEFIX_PASSWORD = 'a109-geheim-passwort';
    const m = falschesFetch(() => new Response('', { status: 401 }));
    const { r, zeilen } = await mitLog(() => zefix.zefixSuche('name', 'Elektro-Tel AG', { fetch: m.f }));
    const a = m.aufrufe[0];
    const erwartet = 'Basic ' + Buffer.from('a109-benutzer:a109-geheim-passwort').toString('base64');
    pruefe('Offiziell: POST /company/search mit Basic Auth', zefix.zefixApi() === 'offiziell' && a?.url === `${zefix.ZEFIX_OFFIZIELL_BASIS}/company/search` && a.kopf.get('authorization') === erwartet && a.body?.name === 'Elektro-Tel AG');
    pruefe('401 → «zugang», keine Wiederholung', !r.ok && r.grund === 'zugang' && r.http === 401 && m.aufrufe.length === 1);
    pruefe('Log ohne Zugangsdaten', !zeilen.join('\n').includes('a109-geheim-passwort') && !zeilen.join('\n').includes('a109-benutzer') && !zeilen.join('\n').includes(erwartet.slice(6)), zeilen.join(' | '));
    // offizielles API: Abbildung der Antwort
    const m2 = falschesFetch((x) =>
        x.url.includes('/company/uid/')
            ? json(200, [{ name: 'Elektro-Tel AG für elektrotechnische Anlagen', uid: 'CHE107160757', legalSeat: 'Winterthur', legalForm: { id: 3, name: { de: 'Aktiengesellschaft' } }, status: 'ACTIVE', deletionDate: null }])
            : json(200, [
                  { name: 'Muster Alt AG', uid: GELOESCHT_UID, legalSeat: 'Zug', legalForm: { id: 3 }, status: 'CANCELLED', deletionDate: '2014-06-03' },
                  { name: 'Muster Neu AG', uid: uidMit('30000007'), legalSeat: 'Bern', status: 'BEING_CANCELLED', deletionDate: null },
              ]),
    );
    const u = await zefix.zefixSuche('uid', 'CHE-107.160.757', { fetch: m2.f });
    pruefe('Offiziell: GET /company/uid/CHE107160757, ACTIVE → aktiv', m2.aufrufe[0]?.url === `${zefix.ZEFIX_OFFIZIELL_BASIS}/company/uid/CHE107160757` && m2.aufrufe[0].methode === 'GET' && u.ok && u.treffer[0]?.aktiv === true && u.treffer[0].rechtsform === 'Aktiengesellschaft');
    const n = await zefix.zefixSuche('name', 'Muster', { fetch: m2.f });
    pruefe('Offiziell: CANCELLED und BEING_CANCELLED → nicht aktiv', n.ok && n.treffer.length === 2 && n.treffer.every((t) => !t.aktiv) && zefix.statusText('CANCELLED') === 'gelöscht' && zefix.statusText('BEING_CANCELLED') === 'in Auflösung');
    pruefe('Offiziell: 404 → leere Liste', (await zefix.zefixSuche('uid', 'CHE-107.160.757', { fetch: falschesFetch(() => new Response('', { status: 404 })).f })).treffer?.length === 0);
    delete process.env.ZEFIX_USER;
    delete process.env.ZEFIX_PASSWORD;
    pruefe('Ohne Zugangsdaten (oder nur einer) → Web-API', zefix.zefixApi() === 'web' && ((process.env.ZEFIX_USER = 'x'), zefix.zefixApi() === 'web'));
    delete process.env.ZEFIX_USER;
}
{
    // Zeitüberschreitung: Frist je Versuch, eine Wiederholung
    const m = falschesFetch(
        (a) =>
            new Promise((_, ablehnen) => {
                // AbortSignal.timeout hält die Ereignisschleife nicht offen (unref) — im Server tut es die Verbindung
                const halt = setTimeout(() => undefined, 5000);
                a.signal?.addEventListener('abort', () => {
                    clearTimeout(halt);
                    ablehnen(a.signal.reason ?? new DOMException('Zeit', 'TimeoutError'));
                });
            }),
    );
    const t0 = Date.now();
    const r = await zefix.zefixSuche('name', 'Elektro-Tel AG', { fetch: m.f, fristMs: 80, pauseMs: 5 });
    pruefe('Timeout → «nicht_erreichbar» nach genau 2 Versuchen', !r.ok && r.grund === 'nicht_erreichbar' && r.versuche === 2 && m.aufrufe.length === 2 && Date.now() - t0 < 2000, `versuche=${r.versuche} ms=${Date.now() - t0}`);
    pruefe('Vorgaben: Frist 6 s, eine Wiederholung', zefix.ZEFIX_FRIST_MS === 6000);
}
{
    // 5xx → Wiederholung → Erfolg; Netzfehler zweimal → nicht erreichbar; 400 → «antwort» ohne Wiederholung
    const m = falschesFetch((_, n) => (n === 1 ? json(503, {}) : json(200, { list: [ET_HAUPT] })));
    const r = await zefix.zefixSuche('name', 'Elektro-Tel AG', { fetch: m.f, pauseMs: 1 });
    pruefe('503 → Wiederholung → Treffer', r.ok && r.versuche === 2 && r.treffer.length === 1);
    const m2 = falschesFetch(() => {
        throw new TypeError('fetch failed');
    });
    const r2 = await zefix.zefixSuche('name', 'Elektro-Tel AG', { fetch: m2.f, pauseMs: 1 });
    pruefe('Netzfehler zweimal → «nicht_erreichbar»', !r2.ok && r2.grund === 'nicht_erreichbar' && m2.aufrufe.length === 2);
    const m3 = falschesFetch(() => json(400, { error: { code: 'API.ERROR.GENERAL' } }));
    const r3 = await zefix.zefixSuche('name', 'Elektro-Tel AG', { fetch: m3.f, pauseMs: 1 });
    pruefe('400 → «antwort», keine Wiederholung', !r3.ok && r3.grund === 'antwort' && m3.aufrufe.length === 1);
}
{
    // gelöschte Firma und Firma in Auflösung (UID-Suche schickt die formatierte UID als Name)
    const m = falschesFetch((a) => json(200, { list: a.body?.name === MUSTER_GELOESCHT.uidFormatted ? [MUSTER_GELOESCHT, ET_HAUPT] : [MUSTER_AUFL] }));
    const r = await zefix.zefixSuche('uid', GELOESCHT_UID, { fetch: m.f });
    pruefe('UID-Suche: Name = formatierte UID, nur Treffer mit genau dieser UID', m.aufrufe[0]?.body?.name === MUSTER_GELOESCHT.uidFormatted && r.ok && r.treffer.length === 1 && r.treffer[0].uid === GELOESCHT_UID);
    pruefe('Gelöschte Firma → nicht aktiv, Status «gelöscht»', r.ok && r.treffer[0].aktiv === false && r.treffer[0].loeschdatum === '2014-06-03' && zefix.statusText(r.treffer[0].status) === 'gelöscht');
    const r2 = await zefix.zefixSuche('name', 'Muster Bau', { fetch: m.f });
    pruefe('Firma in Auflösung → nicht aktiv', r2.ok && r2.treffer[0].aktiv === false && zefix.statusText('IN_AUFLOESUNG') === 'in Auflösung');
    pruefe('Prüfkriterium: EXISTIEREND mit Löschdatum → nicht aktiv', zefix.istAktiv('EXISTIEREND', '2020-01-01') === false && zefix.istAktiv('EXISTIEREND', null) === true);
    const ohne = await zefix.zefixSuche('uid', 'CHE-107.160.758', { fetch: m.f });
    pruefe('Ungültige UID → kein Aufruf', ohne.ok && ohne.treffer.length === 0 && m.aufrufe.length === 2);
}

/* ------------------------------------------------------------------ */
/* 3. Nachweis-Signatur                                                */
/* ------------------------------------------------------------------ */

{
    const scanId = 's-abcdefghijklmnop';
    const jetzt = Date.now();
    const bis = jetzt + hr.NACHWEIS_TTL_MS;
    const n = hr.signiereNachweis(scanId, 'CHE107160757', bis);
    pruefe('Nachweis gültig', hr.pruefeNachweis(n, scanId, jetzt).ok === true && hr.pruefeNachweis(n, scanId, jetzt).uid === 'CHE107160757');
    pruefe('Nachweis 30 Minuten gültig', hr.NACHWEIS_TTL_MS === 30 * 60 * 1000);
    pruefe('Nachweis abgelaufen', hr.pruefeNachweis(n, scanId, bis + 1).grund === 'abgelaufen');
    pruefe('Nachweis mit falscher scan_id', hr.pruefeNachweis(n, 's-zzzzzzzzzzzzzzzz', jetzt).grund === 'signatur');
    pruefe('Nachweis mit anderer UID', hr.pruefeNachweis(n.replace('CHE107160757', 'CHE169547556'), scanId, jetzt).grund === 'signatur');
    pruefe('Nachweis mit verlängertem Ablauf', hr.pruefeNachweis(n.replace(String(bis), String(bis + 3_600_000)), scanId, jetzt).grund === 'signatur');
    pruefe('Nachweis fehlt / Unsinn', hr.pruefeNachweis(null, scanId).grund === 'fehlt' && hr.pruefeNachweis('abc', scanId).grund === 'format');
    const alt = process.env.DEMO_TOKEN;
    process.env.DEMO_TOKEN = 'ein-ganz-anderer-schluessel-42';
    pruefe('Nachweis mit anderem Schlüssel (DEMO_TOKEN) ungültig', hr.pruefeNachweis(n, scanId, jetzt).grund === 'signatur');
    process.env.DEMO_TOKEN = alt;
}

/* ------------------------------------------------------------------ */
/* 4. Namensvarianten, Schalter                                        */
/* ------------------------------------------------------------------ */

pruefe('Namensvarianten: voll, ohne Rechtsform, ohne Dubletten', JSON.stringify(hr.namensVarianten(['Elektro-Tel AG', 'Elektro-Tel AG', null, 'elektro-tel ag'])) === '["Elektro-Tel AG","Elektro-Tel"]');
pruefe(
    'Namensvarianten: erste zwei Wörter, höchstens 3',
    JSON.stringify(hr.namensVarianten(['Muster Holzbau Winterthur AG'])) === '["Muster Holzbau Winterthur AG","Muster Holzbau Winterthur","Muster Holzbau"]' && hr.namensVarianten(['A AG', 'Eins Zwei Drei Vier GmbH', 'Fünf Sechs AG', 'Sieben Acht']).length === 3,
);
pruefe('Schalter: Vorgabe streng', hr.handelsregisterModus() === 'streng');
process.env.DEMO_HANDELSREGISTER = 'aus';
pruefe('Schalter: aus (lokal)', hr.handelsregisterModus() === 'aus');
process.env.NETLIFY = 'true';
pruefe('Schalter: aus wird auf Netlify ignoriert', (await mitLog(() => hr.handelsregisterModus())).r === 'streng');
delete process.env.NETLIFY;
process.env.DEMO_HANDELSREGISTER = 'irgendwas';
pruefe('Schalter: unbekannter Wert → streng', hr.handelsregisterModus() === 'streng');
delete process.env.DEMO_HANDELSREGISTER;

/* ------------------------------------------------------------------ */
/* 5. Ablauf je Scan (Speicher im Temp-Ordner, fetch gemockt)          */
/* ------------------------------------------------------------------ */

const PROFIL = {
    firma: 'Elektro-Tel AG', website: 'https://www.elektro-tel.ch', assistent_name: 'Lena', branche: 'Elektroinstallation', telefon: null, email: null, adresse: null,
    oeffnungszeiten_text: null, firma_text: 'Test.', faehigkeiten: ['Beantwortet Fragen'], wissen: [], logo_url: null, farben: null, stimme: 'weiblich',
};
function extrakt(over = {}) {
    return { start_url: 'https://www.elektro-tel.ch/', end_url: 'https://www.elektro-tel.ch/', host: 'elektro-tel.ch', text: '', firma: 'Elektro-Tel', jsonld_name: null, logo_kandidaten: [], ...over };
}
async function neuerScan(x, profil = PROFIL) {
    return scans.speichereNeuenScan({ extrakt: x, profil, profil_quelle: 'regeln', assistent_weiblich: true, schritte: [], dauer_ms: 1 });
}

const altFetch = globalThis.fetch;
let zefixAntwort = () => json(404, NORESULT);
const global = falschesFetch((a, n) => zefixAntwort(a, n));
globalThis.fetch = global.f;
const zaehle = () => global.aufrufe.length;

try {
    {
        // UID aus dem Impressum → Treffer; Wiederholung ohne neuen Register-Aufruf
        zefixAntwort = (a) => (a.body?.name === 'CHE-107.160.757' ? json(200, { list: [ET_HAUPT] }) : json(404, NORESULT));
        const scan = await neuerScan(extrakt({ uid_kandidaten: ['CHE107160757'] }));
        const vor = zaehle();
        const { r: a1 } = await mitLog(() => hr.automatischePruefung(scan));
        const nach1 = zaehle();
        const a2 = await hr.automatischePruefung(scan);
        pruefe('Automatisch: UID aus dem Impressum → Treffer (quelle uid), ein Zefix-Aufruf', a1.ergebnis === 'treffer' && a1.quelle === 'uid' && a1.treffer.length === 1 && a1.treffer[0].uid_formatiert === 'CHE-107.160.757' && nach1 - vor === 1, `${a1.ergebnis}/${a1.quelle} aufrufe=${nach1 - vor}`);
        pruefe('Automatisch: Wiederholung kommt aus dem Speicher (kein neuer Aufruf)', zaehle() === nach1 && a2.ergebnis === 'treffer' && a2.treffer[0].uid === 'CHE107160757');
        const e = await hr.leseEintrag(scan);
        pruefe('Speicher: handelsregister/{scan_id} mit Zahl der Zefix-Aufrufe', e.zefix_aufrufe === 1 && !!e.cache['uid:CHE107160757'] && e.ablauf === scan.ablauf);
        pruefe('Antwort: 3 manuelle Versuche frei, nichts bestätigt', a1.versuche_rest === 3 && a1.bestaetigt === null && a1.modus === 'streng');

        // Bestätigen
        const b0 = await hr.bestaetige(scan, 'CHE-169.547.556');
        pruefe('Bestätigen: nicht gezeigte UID → 409', !b0.ok && b0.status === 409);
        const b = await hr.bestaetige(scan, 'CHE-107.160.757');
        const e2 = await hr.leseEintrag(scan);
        pruefe('Bestätigen: gezeigter aktiver Eintrag → bestätigt, Nachweis gespeichert', b.ok && b.antwort.ergebnis === 'bestaetigt' && b.antwort.bestaetigt?.name === ET_HAUPT.name && hr.pruefeNachweis(e2.bestaetigt?.nachweis, scan.id).ok);
        const n = await hr.nachweisFuerAnruf(scan);
        pruefe('nachweisFuerAnruf: ok mit uid, uid_formatiert, name, sitz, status, quelle, geprueft_am', n.ok && n.handelsregister?.uid === 'CHE107160757' && n.handelsregister.quelle === 'uid' && n.handelsregister.sitz === 'Winterthur' && n.handelsregister.status === 'EXISTIEREND' && /^\d{4}-\d{2}-\d{2}T/.test(n.handelsregister.geprueft_am));
        const a3 = await hr.automatischePruefung(scan);
        pruefe('Automatisch nach Bestätigung → «bestaetigt»', a3.ergebnis === 'bestaetigt' && a3.bestaetigt?.uid === 'CHE107160757' && a3.gueltig_bis > Date.now());
        pruefe('nachweisFuerAnruf: abgelaufen nach 30 min', (await hr.nachweisFuerAnruf(scan, Date.now() + hr.NACHWEIS_TTL_MS + 1000)).code === texte.HR_CODE_ABGELAUFEN);
    }
    {
        // ohne UID: Namenssuche mit Varianten; nichts → kein_treffer; manuelle Suche höchstens 3
        zefixAntwort = () => json(404, NORESULT);
        const scan = await neuerScan(extrakt({ firma: 'Muster Nirgends', firma_register: 'Muster Nirgends Holzbau AG' }), { ...PROFIL, firma: 'Muster Nirgends Holzbau AG' });
        const vor = zaehle();
        const a = await hr.automatischePruefung(scan);
        const namen = global.aufrufe.slice(vor).map((x) => x.body?.name);
        pruefe('Automatisch ohne UID: Namenssuche, höchstens 3 Varianten', a.ergebnis === 'kein_treffer' && namen.length === 3 && namen[0] === 'Muster Nirgends Holzbau AG' && namen.includes('Muster Nirgends Holzbau') && namen.includes('Muster Nirgends'), namen.join(' | '));
        const u = await hr.manuelleSuche(scan, 'CHE-107.160.758');
        pruefe('Manuell: ungültige UID → 422, zählt nicht', !u.ok && u.status === 422 && (await hr.leseEintrag(scan)).manuell === 0);
        const kurz = await hr.manuelleSuche(scan, 'ab');
        pruefe('Manuell: zu kurz → 422', !kurz.ok && kurz.status === 422);
        const m1 = await hr.manuelleSuche(scan, 'Muster Gibts Nicht AG');
        const m2 = await hr.manuelleSuche(scan, 'Muster Gibts Auch Nicht AG');
        zefixAntwort = (x) => (x.body?.name === 'Elektro-Tel AG' ? json(200, { list: [ET_ZN1, ET_HAUPT, ET_ZN2] }) : json(404, NORESULT));
        const m3 = await hr.manuelleSuche(scan, 'Elektro-Tel AG');
        const m4 = await hr.manuelleSuche(scan, 'Elektro-Tel AG');
        pruefe('Manuell: Zähler 2 → 1 → 0', m1.ok && m1.antwort.versuche_rest === 2 && m2.ok && m2.antwort.versuche_rest === 1 && m3.ok && m3.antwort.versuche_rest === 0);
        pruefe('Manuell: dritter Versuch findet mehrere Treffer (quelle manuell, Hauptsitz zuerst)', m3.ok && m3.antwort.ergebnis === 'treffer' && m3.antwort.quelle === 'manuell' && m3.antwort.treffer.length === 3 && m3.antwort.treffer[0].sitz === 'Winterthur');
        pruefe('Manuell: vierter Versuch → 429', !m4.ok && m4.status === 429 && m4.meldung.includes(texte.HR_TEXT.aktivNoetig));
        const b = await hr.bestaetige(scan, 'CHE169547556');
        pruefe('Bestätigen: Zweigniederlassung aus der manuellen Liste (quelle manuell)', b.ok && (await hr.nachweisFuerAnruf(scan)).handelsregister?.quelle === 'manuell');
    }
    {
        // gelöschte Firma per UID: nicht aktiv, nicht bestätigbar
        zefixAntwort = (x) => (x.body?.name === MUSTER_GELOESCHT.uidFormatted ? json(200, { list: [MUSTER_GELOESCHT] }) : json(404, NORESULT));
        const scan = await neuerScan(extrakt({ uid_kandidaten: [GELOESCHT_UID], firma: 'Muster Handel' }), { ...PROFIL, firma: 'Muster Handel GmbH' });
        const a = await hr.automatischePruefung(scan);
        pruefe('Gelöschte Firma → «nicht_aktiv» mit Eintrag (Status gelöscht)', a.ergebnis === 'nicht_aktiv' && a.treffer.length === 1 && a.treffer[0].status_text === 'gelöscht' && !a.treffer[0].aktiv);
        const b = await hr.bestaetige(scan, GELOESCHT_UID);
        pruefe('Gelöschte Firma: Bestätigen → 409', !b.ok && b.status === 409 && b.meldung === texte.HR_TEXT.aktivNoetig);
        pruefe('Gelöschte Firma: kein Nachweis → Anruf gesperrt', (await hr.nachweisFuerAnruf(scan)).code === texte.HR_CODE_FEHLT);
    }
    {
        // Register nicht erreichbar → nicht_erreichbar (nicht gespeichert); danach erreichbar → Treffer
        zefixAntwort = () => {
            throw new TypeError('fetch failed');
        };
        const scan = await neuerScan(extrakt({ uid_kandidaten: ['CHE107160757'] }));
        const { r: a } = await mitLog(() => hr.automatischePruefung(scan, { pauseMs: 1 }));
        pruefe('Register nicht erreichbar → «nicht_erreichbar»', a.ergebnis === 'nicht_erreichbar' && a.treffer.length === 0);
        const e = await hr.leseEintrag(scan);
        pruefe('Nicht erreichbar: nichts zwischengespeichert, Aufrufe gezählt (2)', e.auto === null && Object.keys(e.cache).length === 0 && e.zefix_aufrufe === 2);
        pruefe('Nicht erreichbar: Pause von 15 s gesetzt', hr.NICHT_ERREICHBAR_PAUSE_MS === 15_000 && e.pause_bis > Date.now() && e.pause_bis <= Date.now() + 15_000);
        // in der Pause: kein Register-Aufruf (weder automatisch noch manuell), kein Versuch verbraucht
        const vorPause = zaehle();
        const p1 = await mitLog(() => hr.automatischePruefung(scan, { pauseMs: 1 }));
        const p2 = await mitLog(() => hr.manuelleSuche(scan, 'Elektro-Tel AG', { pauseMs: 1 }));
        pruefe('Pause: keine neuen Register-Aufrufe, «nicht_erreichbar», kein Versuch verbraucht', zaehle() === vorPause && p1.r.ergebnis === 'nicht_erreichbar' && p2.r.ok && p2.r.antwort.ergebnis === 'nicht_erreichbar' && (await hr.leseEintrag(scan)).manuell === 0);
        // Pause vorbei (Zeit simuliert), Register weiterhin weg: manuelle Suche kostet keinen Versuch
        const pauseVorbei = async () => {
            const x = await hr.leseEintrag(scan);
            await speicherMod.speicher().schreibe(`handelsregister/${scan.id}`, { ...x, pause_bis: 0 });
        };
        await pauseVorbei();
        const vorManuell = zaehle();
        const m = await mitLog(() => hr.manuelleSuche(scan, 'Elektro-Tel AG', { pauseMs: 1 }));
        pruefe('Nicht erreichbar bei manueller Suche: zwei Versuche ans Register, kostet keinen Versuch', m.r.ok && m.r.antwort.ergebnis === 'nicht_erreichbar' && zaehle() - vorManuell === 2 && (await hr.leseEintrag(scan)).manuell === 0);
        await pauseVorbei();
        zefixAntwort = (x) => (x.body?.name === 'CHE-107.160.757' ? json(200, { list: [ET_HAUPT] }) : json(404, NORESULT));
        const a2 = await hr.automatischePruefung(scan);
        pruefe('Danach erreichbar: «Nochmals prüfen» findet den Treffer', a2.ergebnis === 'treffer' && a2.treffer[0].uid === 'CHE107160757');
    }
    {
        // Obergrenze der Zefix-Aufrufe je Scan
        zefixAntwort = (x) => (x.body?.name === 'CHE-107.160.757' ? json(200, { list: [ET_HAUPT] }) : json(404, NORESULT));
        const scan = await neuerScan(extrakt({ uid_kandidaten: ['CHE107160757'] }));
        const x = await hr.leseEintrag(scan);
        await speicherMod.speicher().schreibe(`handelsregister/${scan.id}`, { ...x, zefix_aufrufe: hr.ZEFIX_MAX_JE_SCAN });
        const vor = zaehle();
        const { r } = await mitLog(() => hr.automatischePruefung(scan));
        pruefe('Obergrenze: ab 30 Zefix-Aufrufen je Scan kein weiterer Aufruf', hr.ZEFIX_MAX_JE_SCAN === 30 && r.ergebnis === 'nicht_erreichbar' && zaehle() === vor);
    }
    {
        // Schalter aus: übersprungen, Anruf ohne Nachweis erlaubt
        process.env.DEMO_HANDELSREGISTER = 'aus';
        const rAus = await hrRoute.POST(new Request('http://localhost:3101/api/demo/handelsregister', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scan_id: 's-nachgebildet00001' }) }));
        const dAus = await rAus.json();
        pruefe('Schalter aus: Route antwortet «uebersprungen» auch für nachgebildete Scans (ältere Browser-Tests)', rAus.status === 200 && dAus.ergebnis === 'uebersprungen' && dAus.scan_id === 's-nachgebildet00001');
        const scan = await neuerScan(extrakt({}));
        const vor = zaehle();
        const a = await hr.automatischePruefung(scan);
        const n = await hr.nachweisFuerAnruf(scan);
        pruefe('Schalter aus: «uebersprungen», kein Register-Aufruf, Anruf ohne Nachweis erlaubt', a.ergebnis === 'uebersprungen' && zaehle() === vor && n.ok && n.handelsregister === null);
        delete process.env.DEMO_HANDELSREGISTER;
    }

    /* ------------------------------------------------------------------ */
    /* 6. Routen                                                           */
    /* ------------------------------------------------------------------ */

    const post = (url, body, kopf = {}) =>
        new Request(`http://localhost:3101${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.0.2.10', ...kopf }, body: JSON.stringify(body) });
    const anrufBody = (scanId) => ({ scan_id: scanId, nummer: '+41790000109', sprache: 'hochdeutsch', einwilligung: true, honigtopf: '' });
    const auftragsZahl = async () => (await speicherMod.speicher().liste('auftrag/')).length;

    {
        zefixAntwort = (x) => (x.body?.name === 'CHE-107.160.757' ? json(200, { list: [ET_HAUPT] }) : json(404, NORESULT));
        const scan = await neuerScan(extrakt({ uid_kandidaten: ['CHE107160757'] }));
        const vorher = await auftragsZahl();
        const { r: res403 } = await mitLog(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        const d403 = await res403.json();
        pruefe('Route anruf: ohne Nachweis → 403 mit klarer JSON-Meldung', res403.status === 403 && d403.code === texte.HR_CODE_FEHLT && d403.fehler === texte.HR_TEXT.fehlt, JSON.stringify(d403));
        pruefe('Route anruf: ohne Nachweis kein Auftrag angelegt', (await auftragsZahl()) === vorher);

        // Widget-Umgehung: Nachweis-Feld im Body hilft nicht
        const umgehung = await mitLog(() => anrufRoute.POST(post('/api/demo/anruf', { ...anrufBody(scan.id), handelsregister: { uid: 'CHE107160757' }, nachweis: 'CHE107160757.9999999999999.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' })));
        pruefe('Route anruf: Felder im Body ersetzen den Nachweis nicht → 403', umgehung.r.status === 403);

        // Route handelsregister: automatisch, bestätigen
        const r1 = await hrRoute.POST(post('/api/demo/handelsregister', { scan_id: scan.id }));
        const d1 = await r1.json();
        pruefe('Route handelsregister: automatisch → 200 treffer', r1.status === 200 && d1.ergebnis === 'treffer' && d1.scan_id === scan.id && d1.treffer[0].uid === 'CHE107160757');
        const r404 = await hrRoute.POST(post('/api/demo/handelsregister', { scan_id: 's-gibtesnicht00000' }));
        pruefe('Route handelsregister: unbekannter Scan → 404', r404.status === 404);
        const r2 = await hrRoute.POST(post('/api/demo/handelsregister', { scan_id: scan.id, bestaetige: 'CHE107160757' }));
        const d2 = await r2.json();
        pruefe('Route handelsregister: bestätigen → 200 bestaetigt', r2.status === 200 && d2.ergebnis === 'bestaetigt' && d2.bestaetigt?.uid_formatiert === 'CHE-107.160.757' && !('nachweis' in d2) && !JSON.stringify(d2).includes('.' + String(d2.gueltig_bis) + '.'));

        // mit gültigem Nachweis → wie heute (201, Auftrag in der Warteschlange)
        const { r: res201 } = await mitLog(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        const d201 = await res201.json();
        pruefe('Route anruf: mit gültigem Nachweis → 201 {id}', res201.status === 201 && typeof d201.id === 'string', JSON.stringify(d201));
        const gespeichert = d201.id ? await auftraege.leseAuftrag(d201.id) : null;
        const h = gespeichert?.handelsregister;
        pruefe(
            'Auftrag trägt handelsregister {uid, uid_formatiert, name, sitz, status, quelle, geprueft_am}',
            !!h && h.uid === 'CHE107160757' && h.uid_formatiert === 'CHE-107.160.757' && h.name === ET_HAUPT.name && h.sitz === 'Winterthur' && h.status === 'EXISTIEREND' && h.quelle === 'uid' && !!h.geprueft_am && Object.keys(h).sort().join(',') === 'geprueft_am,name,quelle,sitz,status,uid,uid_formatiert',
        );
        pruefe('Auftrag sonst wie heute: wartend, Nummer, Sprache, Profil', gespeichert?.status === 'wartend' && gespeichert.nummer === '+41790000109' && gespeichert.sprache === 'hochdeutsch' && gespeichert.profil?.firma === 'Elektro-Tel AG');
        const warte = (await auftraege.warteschlange()).find((x) => x.id === d201.id);
        pruefe('Warteschlange für den Orchestrator unverändert (id, erstellt, nummer, sprache, profil)', !!warte && Object.keys(warte).sort().join(',') === 'erstellt,id,nummer,profil,sprache');

        // GET /api/demo/auftraege/[id]: handelsregister nur name/sitz/uid
        const g = await auftragRoute.GET(new Request(`http://localhost:3101/api/demo/auftraege/${d201.id}`), { params: Promise.resolve({ id: d201.id }) });
        const dg = await g.json();
        pruefe('GET auftraege/[id] (öffentlich): handelsregister nur name, sitz, uid', g.status === 200 && Object.keys(dg.handelsregister ?? {}).sort().join(',') === 'name,sitz,uid' && dg.handelsregister.uid === 'CHE107160757' && !('nummer' in dg), JSON.stringify(dg.handelsregister));
        const gb = await auftragRoute.GET(new Request(`http://localhost:3101/api/demo/auftraege/${d201.id}`, { headers: { authorization: `Bearer ${process.env.DEMO_TOKEN}` } }), { params: Promise.resolve({ id: d201.id }) });
        const dgb = await gb.json();
        pruefe('GET auftraege/[id] (Anlage, Bearer): handelsregister nur name, sitz, uid; Nummer vorhanden', gb.status === 200 && Object.keys(dgb.handelsregister ?? {}).sort().join(',') === 'name,sitz,uid' && dgb.nummer === '+41790000109');
        pruefe('Ältere Aufträge ohne Feld → handelsregister null', auftraege.oeffentlich({ ...gespeichert, handelsregister: undefined }).handelsregister === null);

        // abgelaufener Nachweis → 403 abgelaufen; Nachweis eines anderen Scans → 403 fehlt
        const e = await hr.leseEintrag(scan);
        const altBis = Date.now() - 1000;
        await speicherMod.speicher().schreibe(`handelsregister/${scan.id}`, { ...e, bestaetigt: { ...e.bestaetigt, nachweis: hr.signiereNachweis(scan.id, 'CHE107160757', altBis), nachweis_bis: altBis } });
        const abg = await mitLog(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        const dabg = await abg.r.json();
        pruefe('Route anruf: abgelaufener Nachweis → 403 handelsregister_abgelaufen', abg.r.status === 403 && dabg.code === texte.HR_CODE_ABGELAUFEN && dabg.fehler === texte.HR_TEXT.abgelaufen);
        const bis = Date.now() + 60_000;
        await speicherMod.speicher().schreibe(`handelsregister/${scan.id}`, { ...e, bestaetigt: { ...e.bestaetigt, nachweis: hr.signiereNachweis('s-anderescan000000', 'CHE107160757', bis), nachweis_bis: bis } });
        const fremd = await mitLog(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        pruefe('Route anruf: Nachweis eines anderen Scans → 403 handelsregister_fehlt', fremd.r.status === 403 && (await fremd.r.json()).code === texte.HR_CODE_FEHLT);
        // Nachweis mit anderer (nicht gezeigter) UID, korrekt signiert → 403
        await speicherMod.speicher().schreibe(`handelsregister/${scan.id}`, { ...e, bestaetigt: { ...e.bestaetigt, uid: 'CHE169547556', nachweis: hr.signiereNachweis(scan.id, 'CHE169547556', bis), nachweis_bis: bis } });
        const ungezeigt = await mitLog(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        pruefe('Route anruf: signierter Nachweis für nicht gezeigte UID → 403', ungezeigt.r.status === 403);

        // Route handelsregister: manuelle Suche und Fehlerfälle
        const r3 = await hrRoute.POST(post('/api/demo/handelsregister', { scan_id: scan.id, suche: 'CHE-107.160.758' }));
        pruefe('Route handelsregister: ungültige UID → 422', r3.status === 422 && (await r3.json()).fehler === texte.HR_TEXT.uidUngueltig);
        const r4 = await hrRoute.POST(post('/api/demo/handelsregister', { scan_id: scan.id, bestaetige: 42 }));
        pruefe('Route handelsregister: falscher Typ → 400', r4.status === 400);
    }
    pruefe('Kein Aufruf an fremde Adressen (nur zefix.admin.ch)', global.aufrufe.every((a) => a.url.startsWith('https://www.zefix.admin.ch/')));
} finally {
    globalThis.fetch = altFetch;
    rmSync(TEST_STORE, { recursive: true, force: true });
}

console.log(`\n${gesamt - fehler}/${gesamt} Prüfungen bestanden.`);
process.exit(fehler ? 1 : 0);
