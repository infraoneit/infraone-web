#!/usr/bin/env node
/**
 * auftrag111-einheit-test.mjs (AUFTRAG-111) — Einheits- und Route-Tests der Bindung
 * Website ↔ Handelsregister, ohne Server und OHNE Netz (fetch ist gemockt; jeder Aufruf an eine
 * fremde Adresse wirft):
 * - Normalisierung (Kleinschrift, Umlaute, Akzente, Rechtsformen, Sonderzeichen)
 * - Domain-Label (www., .ch, .swiss, .co.uk, Unterdomains, IP) und Suchbegriff
 * - Bindungsregel mit den Beispielen aus AUFTRAG-111 P2 (positiv und negativ), Wortgrenzen
 * - Rechtsform am Ende, gebundener Sprechname (P5), Kürzen für die Karte
 * - Nachweis mit `gebunden` (mitsigniert); Nachweis ohne `gebunden` wird abgelehnt
 * - Ablauf: automatische Prüfung mit Domain-Label (P1 c), Bestätigen mit Bindung (uid/domain/text),
 *   409 website_passt_nicht (wortgleicher Text, kein Nachweis, zählt nicht als Suche), Routen,
 *   Auftrag mit Sprechname
 *
 * AUFTRAG-112 (angepasst): pornhub.com steht auf der Sperrliste — die Routen weisen diesen Scan mit 404 ab;
 * die Route-Prüfung von 409 website_passt_nicht / 403 läuft mit der neutralen Website beispiel-portal.ch.
 *
 * Eigener Speicher-Ordner (Temp), kein DEMO_ANSTOSS_URL (kein Anstoss, kein Anruf).
 * Registerdaten: Elektro-Tel AG und «lnfraOne IT Solutions GmbH» (öffentliche Einträge, gemessen
 * 30.10.2026) und erfundene «Muster»-Firmen; Nummern erfunden.
 *
 *   node scripts/auftrag111-einheit-test.mjs
 */
import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHmac } from 'node:crypto';
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
const TEST_STORE = mkdtempSync(path.join(os.tmpdir(), 'a111-einheit-'));
process.env.DEMO_STORE_DIR = TEST_STORE;
delete process.env.DEMO_ANSTOSS_URL;
delete process.env.TURNSTILE_SITE_KEY;
delete process.env.TURNSTILE_SECRET;
delete process.env.ZEFIX_USER;
delete process.env.ZEFIX_PASSWORD;
delete process.env.DEMO_HANDELSREGISTER;
for (const k of ['NETLIFY', 'SITE_ID', 'NETLIFY_BLOBS_CONTEXT', 'AWS_LAMBDA_FUNCTION_NAME']) delete process.env[k];
process.env.DEMO_LIMITS_AUS = '1';
process.env.DEMO_TOKEN = 'a111-test-schluessel-0123456789';

const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
const b = await imp('src/lib/demo/bindung.ts');
const zefix = await imp('src/lib/demo/zefix.ts');
const hr = await imp('src/lib/demo/handelsregister.ts');
const texte = await imp('src/lib/demo/handelsregister-texte.ts');
const scans = await imp('src/lib/demo/scans.ts');
const speicherMod = await imp('src/lib/demo/speicher.ts');
const auftraege = await imp('src/lib/demo/auftraege.ts');
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

/* ------------------------------------------------------------------ */
/* 1. Normalisierung                                                   */
/* ------------------------------------------------------------------ */

gleich('Normalisierung: Elektro-Tel (Spec-Beispiel, Rechtsform in der Mitte)', b.normalisiere('Elektro-Tel AG für elektrotechnische Anlagen'), 'elektrotelfuerelektrotechnischeanlagen');
gleich('Normalisierung: InfraOne IT Solutions GmbH', b.normalisiere('InfraOne IT Solutions GmbH'), 'infraoneitsolutions');
gleich('Normalisierung: Umlaute ä→ae, ö→oe, ü→ue (auch Grossbuchstaben)', b.normalisiere('Bär Söhne Müller ÄÖÜ'), 'baersoehnemuelleraeoeue');
gleich('Normalisierung: Umlaut zerlegt (a + U+0308) wie ä', b.normalisiere('Bär'), 'baer');
gleich('Normalisierung: Akzente (NFD, Diakritika weg)', b.normalisiere('Société Générale Crème Brûlée'), 'societegeneralecremebrulee');
gleich('Normalisierung: Sonderzeichen weg', b.normalisiere('Muster-Holz (Schweiz) / Bau & Design, 8400'), 'musterholzschweizbaudesign8400');
gleich('Normalisierung mit Wortgrenzen', b.normalisiereWoerter('Elektro-Tel AG für elektrotechnische Anlagen'), 'elektro tel fuer elektrotechnische anlagen');
{
    const formen = ['Muster AG', 'Muster SA', 'Muster GmbH', 'Muster Sàrl', 'Muster SARL', 'Muster Sagl', 'Muster KlG', 'Muster KmG', 'Muster Genossenschaft', 'Muster Stiftung', 'Muster Verein', 'Muster Ltd', 'Muster Ltd.', 'Muster Inc', 'Muster Inc.', 'Muster Co', 'Muster & Co', 'Muster & Co.', 'Muster S.A.', 'Muster S.A', 'Muster S.à r.l.', 'Muster GmbH & Co. KmG', 'AG Muster', 'Muster-AG'];
    const falsch = formen.filter((f) => b.normalisiere(f) !== 'muster');
    pruefe(`Rechtsformen entfernt (${formen.length} Schreibweisen → «muster»)`, falsch.length === 0, falsch.map((f) => `${f} → ${b.normalisiere(f)}`).join(' | '));
}
gleich('Rechtsformen nur als ganze Wörter (Agentur, Saga, Cobalt, Coiffeur bleiben)', b.normalisiere('Agentur Saga Cobalt Coiffeur Sagli'), 'agentursagacobaltcoiffeursagli');
gleich('Leere Eingabe', [b.normalisiere(''), b.normalisiere(null), b.normalisiere(undefined)], ['', '', '']);

/* ------------------------------------------------------------------ */
/* 2. Domain-Label                                                     */
/* ------------------------------------------------------------------ */

gleich('Domain-Label: elektro-tel.ch', b.domainLabel('elektro-tel.ch'), 'elektro-tel');
gleich('Domain-Label: www. weg', b.domainLabel('www.elektro-tel.ch'), 'elektro-tel');
gleich('Domain-Label: www2. weg, Grossschrift', b.domainLabel('WWW2.Muster.CH'), 'muster');
gleich('Domain-Label: .swiss', b.domainLabel('muster-treuhand.swiss'), 'muster-treuhand');
gleich('Domain-Label: .co.uk (zweiteilige Endung)', [b.domainLabel('muster.co.uk'), b.domainLabel('www.muster.co.uk'), b.domainLabel('shop.muster.co.uk')], ['muster', 'muster', 'muster']);
gleich('Domain-Label: Unterdomain weg (shop.muster.ch)', b.domainLabel('shop.muster.ch'), 'muster');
gleich('Domain-Label: aus einer URL', b.domainLabel('https://www.infraone.ch/kontakt?x=1'), 'infraone');
gleich('Domain-Label: IP, localhost, leer → null', [b.domainLabel('192.168.1.10'), b.domainLabel('localhost'), b.domainLabel(''), b.domainLabel('www.ch')], [null, null, null, null]);
gleich('Suchbegriff: elektro-tel.ch → «elektro tel» (Bindestriche zu Leerzeichen)', b.domainSuchbegriff('www.elektro-tel.ch'), 'elektro tel');
gleich('Suchbegriff: muster-treuhand.swiss → «muster treuhand»', b.domainSuchbegriff('muster-treuhand.swiss'), 'muster treuhand');

/* ------------------------------------------------------------------ */
/* 3. Bindungsregel (Beispiele aus P2)                                 */
/* ------------------------------------------------------------------ */

const basis = (host, text = '', uids = []) => ({ host, text: b.normalisiereWoerter(text), uids });
const ET = { uid: 'CHE107160757', name: 'Elektro-Tel AG für elektrotechnische Anlagen' };
const ET_KURZ = { uid: 'CHE107160757', name: 'Elektro-Tel AG' };
// erfundene Firmen (UIDs mit gültiger Prüfziffer)
const uidMit = (acht) => `CHE${acht}${zefix.uidPruefziffer(acht)}`;
const MUSTER_TREUHAND = { uid: uidMit('31122334'), name: 'Muster Treuhand AG' };
const MUSTER_HOLZBAU = { uid: uidMit('31122335'), name: 'Muster Holzbau AG' };
const MUSTER_AG = { uid: uidMit('31122337'), name: 'Muster AG' };
const INFRAONE_SPEC = { uid: 'CHE288114187', name: 'InfraOne IT Solutions GmbH' };
const INFRAONE_REGISTER = { uid: 'CHE288114187', name: 'lnfraOne IT Solutions GmbH' };
const NEUTRAL_TEXT = 'Willkommen. Unsere Leistungen, Kontakt, Impressum, Datenschutz. Videos und Bilder.';

gleich('P2 positiv: elektro-tel.ch ↔ «Elektro-Tel AG für elektrotechnische Anlagen» (Label im Kern)', b.pruefeBindung(ET, basis('elektro-tel.ch', NEUTRAL_TEXT)), 'domain');
gleich('P2 positiv: infraone.ch ↔ «InfraOne IT Solutions GmbH»', b.pruefeBindung(INFRAONE_SPEC, basis('infraone.ch', NEUTRAL_TEXT)), 'domain');
gleich('P2 positiv: muster-treuhand.ch ↔ «Muster Treuhand AG»', b.pruefeBindung(MUSTER_TREUHAND, basis('muster-treuhand.ch', NEUTRAL_TEXT)), 'domain');
gleich('P2 negativ: pornhub.com ↔ «Elektro-Tel AG»', b.pruefeBindung(ET_KURZ, basis('pornhub.com', NEUTRAL_TEXT)), null);
gleich('P2 negativ: infraone.ch ↔ «Elektro-Tel AG» (andere UID auf der Website, kein Text-Treffer)', b.pruefeBindung(ET_KURZ, basis('infraone.ch', 'InfraOne IT Solutions GmbH, Rudolf-Diesel-Strasse 25, 8404 Winterthur. UID CHE-288.114.187 MWST', ['CHE288114187'])), null);
gleich('Regel 1 (uid): Register schreibt «lnfraOne» (kleines L) — die UID im Impressum bindet', b.pruefeBindung(INFRAONE_REGISTER, basis('infraone.ch', NEUTRAL_TEXT, ['CHE288114187'])), 'uid');
gleich('Regel 1 hat Vorrang vor Regel 2', b.pruefeBindung(ET, basis('elektro-tel.ch', '', ['CHE107160757'])), 'uid');
gleich('Ohne UID bindet «lnfraOne …» nicht über die Domain (Normalisierung wie verlangt, ohne l/I-Toleranz)', b.pruefeBindung(INFRAONE_REGISTER, basis('infraone.ch', NEUTRAL_TEXT)), null);
gleich('Regel 2: Kern ⊆ Label (muster-ag-winterthur.ch ↔ «Muster AG»)', b.pruefeBindung(MUSTER_AG, basis('muster-ag-winterthur.ch')), 'domain');
gleich('Regel 2: Label muster-ag.ch = Kern «muster» (Rechtsform im Label entfernt)', b.pruefeBindung(MUSTER_AG, basis('muster-ag.ch')), 'domain');
gleich('Regel 2: unter 4 Zeichen nur Gleichheit (abc.ch ↔ «ABCD AG» nein, abc.ch ↔ «ABC AG» ja)', [b.pruefeBindung({ uid: 'x', name: 'ABCD AG' }, basis('abc.ch')), b.pruefeBindung({ uid: 'x', name: 'ABC AG' }, basis('abc.ch'))], [null, 'domain']);
gleich('Regel 2 direkt: kernPasstZuLabel(Name, Label)', [b.kernPasstZuLabel(ET.name, 'elektro-tel'), b.kernPasstZuLabel('Muster Treuhand AG', 'mustertreuhandwinterthur'), b.kernPasstZuLabel('ABC AG', 'abcd'), b.kernPasstZuLabel('', 'x')], [true, true, false, false]);
gleich('Regel 2: Label im Kern nur an Wortgrenzen (elektro-tel.ch ↔ «Bütler Elektro Telecom AG» nein)', b.pruefeBindung({ uid: 'x', name: 'Bütler Elektro Telecom AG' }, basis('elektro-tel.ch', NEUTRAL_TEXT)), null);
gleich('Regel 2: Label ohne Bindestrich (elektrotel.ch ↔ «Elektro-Tel AG für …») passt', b.pruefeBindung(ET, basis('elektrotel.ch')), 'domain');
// Nachtrag (Ergänzung): Kern ⊆ Label nur ab einem Wortanfang des Labels (Anfang oder nach - / _), Ende offen
gleich('Regel 2 (Nachtrag): Kern am Label-Anfang, Ende offen — mustertreuhandwinterthur.ch ↔ «Muster Treuhand AG»', b.pruefeBindung(MUSTER_TREUHAND, basis('mustertreuhandwinterthur.ch')), 'domain');
gleich('Regel 2 (Nachtrag): Kern am Wortanfang — elektro-tel.ch ↔ «Elektro AG»', b.pruefeBindung({ uid: 'x', name: 'Elektro AG' }, basis('elektro-tel.ch')), 'domain');
gleich('Regel 2 (Nachtrag): Kern mitten im Wort — elektro-tel.ch ↔ «Lektro AG» nein', b.pruefeBindung({ uid: 'x', name: 'Lektro AG' }, basis('elektro-tel.ch')), null);
gleich('Regel 2 (Nachtrag): nach Bindestrich/Unterstrich beginnt ein Wort (muster-holzbau.ch ↔ «Holzbau AG», muster_holzbau.ch ↔ «Holzbau AG»)', [b.pruefeBindung({ uid: 'x', name: 'Holzbau AG' }, basis('muster-holzbau.ch')), b.kernPasstZuLabel('Holzbau AG', 'muster_holzbau')], ['domain', true]);
gleich('Regel 2 (Nachtrag): youtube.com ↔ «Tube AG» nein (Kern nicht am Wortanfang)', b.pruefeBindung({ uid: 'x', name: 'Tube AG' }, basis('youtube.com')), null);
gleich('Regel 3 (text): Name in der Fusszeile', b.pruefeBindung(MUSTER_HOLZBAU, basis('mein-handwerk.ch', '© 2026 Muster Holzbau AG · Dorfstrasse 1 · 8400 Winterthur')), 'text');
gleich('Regel 3: Schreibweise MusterHolzbau ↔ «Muster-Holzbau AG» (Kern an Wortgrenzen)', b.pruefeBindung({ uid: 'x', name: 'Muster-Holzbau AG' }, basis('mein-handwerk.ch', 'Willkommen bei MusterHolzbau in Winterthur')), 'text');
gleich('Regel 3: nur an Wortgrenzen («Muster AG» passt nicht in «Mustermann»)', b.pruefeBindung(MUSTER_AG, basis('beispiel-web.ch', 'Ihr Ansprechpartner: Herr Max Mustermann')), null);
gleich('Regel 3: Kern unter 4 Zeichen bindet nie über den Text', b.pruefeBindung({ uid: 'x', name: 'ABC AG' }, basis('beispiel-web.ch', 'ABC AG ABC')), null);
gleich('Regel 3: textEnthaeltKern', [b.textEnthaeltKern(b.normalisiereWoerter('Elektro-Tel AG für elektrotechnische Anlagen, Winterthur'), ET.name), b.textEnthaeltKern(b.normalisiereWoerter('Partner: Elektro-Tel'), ET.name)], [true, false]);
{
    const lang = b.bindungsText([('Zeile mit Text ').repeat(30_000)]);
    pruefe('Textbasis: Deckel 200 000 Zeichen, an Wortgrenze', lang.length <= b.BINDUNG_TEXT_MAX && lang.length > 190_000 && !lang.endsWith(' '), `${lang.length} Zeichen`);
    gleich('Textbasis: je Abschnitt normalisiert, Abschnitte durch « | » getrennt', b.bindungsText(['Muster Holzbau AG', null, 'Größe: 5 m²']), 'muster holzbau | groesse 5 m');
}

/* ------------------------------------------------------------------ */
/* 3b. Nachtrag: Regel 3 nur über Titel, Impressum und Fusszeile        */
/* ------------------------------------------------------------------ */

{
    const fliesstext = Array.from({ length: 40 }, (_, i) => `Absatz ${i + 1}: Wir planen, bauen und sanieren Holzhäuser, Dachstöcke und Fassaden in der ganzen Region.`);
    const mitte = ['Willkommen bei Beispiel Bau', 'Seit vielen Jahren arbeiten wir eng mit der Muster Holzbau AG zusammen.', ...fliesstext];
    const fussNeutral = ['Kontakt', 'Beispiel Bau GmbH · Dorfstrasse 1 · 8400 Winterthur', '© 2026 Beispiel Bau GmbH'];
    const fussMitName = ['Kontakt', 'Muster Holzbau AG · Dorfstrasse 1 · 8400 Winterthur', '© 2026 Muster Holzbau AG'];
    const impressumNeutral = ['Impressum', 'Beispiel Bau GmbH', 'Dorfstrasse 1, 8400 Winterthur', 'UID: CHE-000.000.000'];
    const seiten = (startZeilen, impressum = impressumNeutral, titel = 'Beispiel Bau – Holzbau in Winterthur') => b.bindungsTextAusSeiten({ titel, impressum, startZeilen });
    const basisText = (text) => ({ host: 'beispiel-bau.ch', uids: [], text });
    gleich('Nachtrag negativ: Firmenname nur im Fliesstext (nicht in Titel/Impressum/Fusszeile) → keine Bindung', b.pruefeBindung(MUSTER_HOLZBAU, basisText(seiten([...mitte, ...fussNeutral]))), null);
    gleich('Nachtrag positiv: Firmenname in der Fusszeile → Bindung «text»', b.pruefeBindung(MUSTER_HOLZBAU, basisText(seiten([...mitte, ...fussMitName]))), 'text');
    gleich('Nachtrag positiv: Firmenname im Impressum → Bindung «text»', b.pruefeBindung(MUSTER_HOLZBAU, basisText(seiten([...mitte, ...fussNeutral], ['Impressum', 'Muster Holzbau AG', 'Dorfstrasse 1']))), 'text');
    gleich('Nachtrag positiv: Firmenname im Titel → Bindung «text»', b.pruefeBindung(MUSTER_HOLZBAU, basisText(seiten([...mitte, ...fussNeutral], impressumNeutral, 'Muster Holzbau AG – Ihr Zimmermann'))), 'text');
    {
        const f = b.fusszeileNaeherung([...mitte, ...fussMitName]);
        pruefe('Fusszeilen-Näherung: letzte 2000 Zeichen der Startseite (Fusszeile drin, Anfang nicht)', f.length <= b.FUSSZEILE_ZEICHEN && f.endsWith('© 2026 Muster Holzbau AG') && !f.includes('Willkommen bei Beispiel Bau'), `${f.length} Zeichen`);
        gleich('Fusszeilen-Näherung: kurze Seite ganz', b.fusszeileNaeherung(['A', 'B']), 'A\nB');
    }
    gleich('Abschnitte getrennt: Name über die Grenze Titel|Impressum zählt nicht', b.pruefeBindung(MUSTER_HOLZBAU, basisText(b.bindungsText(['Willkommen Muster', 'Holzbau AG ist ein Beispiel']))), null);
    gleich(
        'Impressum-Seite erkannt (Pfad, Titel, erste Überschriften), andere nicht',
        [
            b.istImpressumSeite('https://www.muster.ch/impressum'),
            b.istImpressumSeite('https://www.muster.ch/legal-notice'),
            b.istImpressumSeite('https://www.muster.ch/rechtliches', null, ['Impressum', 'Datenschutz']),
            b.istImpressumSeite('https://www.muster.ch/info', 'Impressum – Muster AG'),
            b.istImpressumSeite('https://www.muster.ch/kontakt', 'Kontakt', ['Kontakt', 'So finden Sie uns']),
            b.istImpressumSeite('https://www.muster.ch/ueber-uns', 'Über uns', ['Über uns', 'Team', 'Werte', 'Impressum']),
        ],
        [true, true, true, true, false, false],
    );
}

/* ------------------------------------------------------------------ */
/* 4. Sprechname (P5), Kürzen                                          */
/* ------------------------------------------------------------------ */

gleich('Rechtsform am Ende: «Muster Treuhand AG» → «Muster Treuhand»', b.ohneRechtsformAmEnde('Muster Treuhand AG'), 'Muster Treuhand');
gleich('Rechtsform nicht am Ende bleibt: «Elektro-Tel AG für elektrotechnische Anlagen»', b.ohneRechtsformAmEnde('Elektro-Tel AG für elektrotechnische Anlagen'), 'Elektro-Tel AG für elektrotechnische Anlagen');
gleich('Rechtsform am Ende: «& Co. AG», «S.A.», «Sàrl», «GmbH»', [b.ohneRechtsformAmEnde('Muster & Co. AG'), b.ohneRechtsformAmEnde('Exemple S.A.'), b.ohneRechtsformAmEnde('Exemple Sàrl'), b.ohneRechtsformAmEnde('lnfraOne IT Solutions GmbH')], ['Muster', 'Exemple', 'Exemple', 'lnfraOne IT Solutions']);
gleich('Rechtsform allein bleibt stehen («AG»)', b.ohneRechtsformAmEnde('AG'), 'AG');
gleich('Sprechname: Marke im Registernamen (InfraOne ↔ «InfraOne IT Solutions GmbH» → «InfraOne»)', b.sprechName('InfraOne', 'InfraOne IT Solutions GmbH'), 'InfraOne');
gleich('Sprechname: Register-Schreibweise «lnfraOne» (l statt I) → Marke «InfraOne»', b.sprechName('InfraOne', 'lnfraOne IT Solutions GmbH'), 'InfraOne');
gleich('Sprechname: umgekehrt (Registerkern in der Marke)', b.sprechName('Muster Treuhand Winterthur', 'Muster Treuhand AG'), 'Muster Treuhand Winterthur');
gleich('Sprechname: fremde Marke → Registername ohne Rechtsform am Ende (nie die Scan-Marke)', b.sprechName('Pornhub', 'Muster Treuhand AG'), 'Muster Treuhand');
gleich('Sprechname: fremde Marke, Rechtsform in der Mitte → voller Registername', b.sprechName('Pornhub', 'Elektro-Tel AG für elektrotechnische Anlagen'), 'Elektro-Tel AG für elektrotechnische Anlagen');
gleich('Sprechname: Marke «Elektro-Tel» ↔ Register «Elektro-Tel AG für …» → «Elektro-Tel»', b.sprechName('Elektro-Tel', ET.name), 'Elektro-Tel');
gleich('Sprechname: ohne Marke → Registername ohne Rechtsform', b.sprechName(null, 'Muster Treuhand AG'), 'Muster Treuhand');
{
    const k = b.kuerzeName('Elektro-Tel AG für elektrotechnische Anlagen', 40);
    pruefe('Karte: lange Namen auf 40 Zeichen mit «…» (an Wortgrenze)', k.length <= 40 && k.endsWith('…') && k === 'Elektro-Tel AG für elektrotechnische…', k);
    gleich('Karte: kurze Namen unverändert', b.kuerzeName('lnfraOne IT Solutions GmbH', 40), 'lnfraOne IT Solutions GmbH');
}

/* ------------------------------------------------------------------ */
/* 5. Nachweis mit `gebunden`                                          */
/* ------------------------------------------------------------------ */

{
    const scanId = 's-abcdefghijklmnop';
    const jetzt = Date.now();
    const bis = jetzt + hr.NACHWEIS_TTL_MS;
    const n = hr.signiereNachweis(scanId, 'CHE107160757', bis, 'domain');
    const p = hr.pruefeNachweis(n, scanId, jetzt);
    pruefe('Nachweis trägt gebunden: Format <uid>.<gebunden>.<bis>.<sig>, gültig', /^CHE107160757\.domain\.\d{13}\.[A-Za-z0-9_-]{43}$/.test(n) && p.ok && p.gebunden === 'domain' && p.uid === 'CHE107160757', n.replace(/\.[A-Za-z0-9_-]{43}$/, '.…'));
    pruefe('Nachweis: gebunden ist mitsigniert (domain → uid ändern = Signatur falsch)', hr.pruefeNachweis(n.replace('.domain.', '.uid.'), scanId, jetzt).grund === 'signatur');
    pruefe('Nachweis: unbekannte Bindung → Format', hr.pruefeNachweis(n.replace('.domain.', '.marke.'), scanId, jetzt).grund === 'format');
    // altes Format (A-109): <uid>.<bis>.<HMAC über handelsregister:scan:uid:bis>, korrekt signiert
    const altSig = createHmac('sha256', process.env.DEMO_TOKEN).update(`handelsregister:${scanId}:CHE107160757:${bis}`).digest('base64url');
    const alt = `CHE107160757.${bis}.${altSig}`;
    pruefe('Nachweis ohne gebunden (altes Format, korrekt signiert) → abgelehnt', hr.pruefeNachweis(alt, scanId, jetzt).ok === false && hr.pruefeNachweis(alt, scanId, jetzt).grund === 'format');
    let wirft = false;
    try {
        hr.signiereNachweis(scanId, 'CHE107160757', bis);
    } catch {
        wirft = true;
    }
    pruefe('signiereNachweis ohne gebunden wirft (kein Nachweis ohne Bindung)', wirft);
}

/* ------------------------------------------------------------------ */
/* 6. Ablauf je Scan und Routen (fetch gemockt)                        */
/* ------------------------------------------------------------------ */

const json = (status, daten) => new Response(JSON.stringify(daten), { status, headers: { 'Content-Type': 'application/json' } });
const NORESULT = { error: { code: 'API.ZFR.SEARCH.NORESULT', title: 'API.SEARCH.TITLE.NORESULT', message: null } };
const ET_HAUPT = { name: ET.name, ehraid: 51204, uid: 'CHE107160757', uidFormatted: 'CHE-107.160.757', legalSeat: 'Winterthur', legalFormId: 3, status: 'EXISTIEREND', deleteDate: null };
const ET_ZN1 = { ...ET_HAUPT, ehraid: 1322426, uid: 'CHE169547556', uidFormatted: 'CHE-169.547.556', legalSeat: 'Tägerwilen', legalFormId: 9 };
const ET_ZN2 = { ...ET_HAUPT, ehraid: 1383573, uid: 'CHE481479677', uidFormatted: 'CHE-481.479.677', legalSeat: 'Schaffhausen', legalFormId: 9 };
const ANDERE_ELEKTRO = { name: 'Bütler Elektro Telecom AG', uid: uidMit('11638012'), uidFormatted: zefix.formatiereUid(uidMit('11638012')), legalSeat: 'Muri (AG)', legalFormId: 3, status: 'EXISTIEREND', deleteDate: null };
const INFRA = { name: 'lnfraOne IT Solutions GmbH', ehraid: 1233373, uid: 'CHE288114187', uidFormatted: 'CHE-288.114.187', legalSeat: 'Winterthur', legalFormId: 4, status: 'EXISTIEREND', deleteDate: null };
const zefixEintrag = (f, sitz = 'Winterthur', form = 3) => ({ name: f.name, uid: f.uid, uidFormatted: zefix.formatiereUid(f.uid), legalSeat: sitz, legalFormId: form, status: 'EXISTIEREND', deleteDate: null });

const aufrufe = [];
let zefixAntwort = () => json(404, NORESULT);
const altFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : null;
    aufrufe.push({ url: u, body });
    if (!u.startsWith('https://www.zefix.admin.ch/')) throw new Error(`Test: fremde Adresse ${u}`);
    return zefixAntwort({ url: u, body });
};
const namenSeit = (i) => aufrufe.slice(i).map((a) => a.body?.name);

const PROFIL = {
    firma: 'Muster', website: 'https://muster.ch', assistent_name: 'Lena', branche: 'Test', telefon: null, email: null, adresse: null,
    oeffnungszeiten_text: null, firma_text: 'Test.', faehigkeiten: ['Beantwortet Fragen'], wissen: [], logo_url: null, farben: null, stimme: 'weiblich',
};
function extrakt(host, over = {}) {
    return { start_url: `https://${host}/`, end_url: `https://www.${host}/`, host, titel: null, text: '', firma: null, jsonld_name: null, logo_kandidaten: [], uid_kandidaten: [], ...over };
}
async function neuerScan(host, x = {}, profil = {}) {
    return scans.speichereNeuenScan({ extrakt: extrakt(host, x), profil: { ...PROFIL, ...profil }, profil_quelle: 'regeln', assistent_weiblich: true, schritte: [], dauer_ms: 1 });
}
const post = (url, body) => new Request(`http://localhost:3005${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.0.2.11' }, body: JSON.stringify(body) });
const anrufBody = (scanId) => ({ scan_id: scanId, nummer: '+41790000111', sprache: 'hochdeutsch', einwilligung: true, honigtopf: '' });
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

try {
    {
        // F3-Szenario: pornhub.com + manuell gesuchte Elektro-Tel → 409, kein Nachweis, kein Anruf
        zefixAntwort = ({ body }) => (body?.name === 'Elektro-Tel AG' ? json(200, { list: [ET_ZN1, ET_HAUPT, ET_ZN2] }) : json(404, NORESULT));
        const scan = await neuerScan('pornhub.com', { firma: 'Pornhub', titel: 'Pornhub - Free Videos', bindung_text: b.bindungsText(['Pornhub', 'Free videos and photos', 'Terms of service']) }, { firma: 'Pornhub' });
        const vor = aufrufe.length;
        const { r: a } = await stumm(() => hr.automatischePruefung(scan));
        const namen = namenSeit(vor);
        pruefe('pornhub.com: automatisch kein Treffer; Domain-Label «pornhub» = Name → keine doppelte Abfrage', a.ergebnis === 'kein_treffer' && namen.filter((n) => n.toLowerCase() === 'pornhub').length === 1, namen.join(' | '));
        const { r: m } = await stumm(() => hr.manuelleSuche(scan, 'Elektro-Tel AG'));
        pruefe('pornhub.com: manuelle Suche «Elektro-Tel AG» → 3 Einträge, Winterthur zuerst', m.ok && m.antwort.ergebnis === 'treffer' && m.antwort.treffer.length === 3 && m.antwort.treffer[0].sitz === 'Winterthur');
        const { r: x, zeilen } = await stumm(() => hr.bestaetige(scan, 'CHE-107.160.757'));
        const soll = 'Die Website pornhub.com gehört laut Handelsregister und Website-Inhalt nicht zu Elektro-Tel AG für elektrotechnische Anlagen. Bitte geben Sie die Website Ihrer Firma ein oder wählen Sie den passenden Eintrag.';
        pruefe('Bestätigen pornhub.com ↔ Elektro-Tel → 409 website_passt_nicht', !x.ok && x.status === 409 && x.code === b.HR_CODE_WEBSITE_PASST_NICHT && x.website === 'pornhub.com' && x.firma === ET.name, JSON.stringify(x));
        gleich('409: Meldung wortgleich (Platzhalter gefüllt)', x.meldung, soll);
        const e = await hr.leseEintrag(scan);
        pruefe('409: kein Nachweis gespeichert, zählt nicht als manuelle Suche (1 bleibt 1)', e.bestaetigt === null && e.manuell === 1);
        pruefe('409: Log ohne Firmennamen und ohne Host', zeilen.some((z) => /art=bestaetigt-abgelehnt grund=website_passt_nicht/.test(z)) && !zeilen.join('\n').match(/Elektro|pornhub/i), zeilen.join(' | '));
        const n = await hr.nachweisFuerAnruf(scan);
        pruefe('409: Anruf bleibt gesperrt (handelsregister_fehlt)', !n.ok && n.code === texte.HR_CODE_FEHLT);
        // AUFTRAG-112 (angepasst): pornhub.com steht auf der Sperrliste — jede Route, die einen Scan liest, weist
        // ihn ab (404 wie abgelaufen). Die Route-Prüfung von 409/403 läuft deshalb mit einer neutralen Website.
        const rGesperrt = await stumm(() => hrRoute.POST(post('/api/demo/handelsregister', { scan_id: scan.id, bestaetige: 'CHE107160757' })));
        const aGesperrt = await stumm(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        pruefe('A-112: Routen handelsregister/anruf weisen den pornhub.com-Scan ab (Sperrliste → 404)', rGesperrt.r.status === 404 && aGesperrt.r.status === 404);
        const neutral = await neuerScan('beispiel-portal.ch', { firma: 'Beispiel Portal', titel: 'Beispiel Portal', bindung_text: b.bindungsText(['Beispiel Portal', 'Videos und Fotos', 'Nutzungsbedingungen']) }, { firma: 'Beispiel Portal' });
        await stumm(() => hr.automatischePruefung(neutral));
        await stumm(() => hr.manuelleSuche(neutral, 'Elektro-Tel AG'));
        const sollNeutral = soll.replace('pornhub.com', 'beispiel-portal.ch');
        // Route: 409 mit Kennung, Anruf 403
        const r = await stumm(() => hrRoute.POST(post('/api/demo/handelsregister', { scan_id: neutral.id, bestaetige: 'CHE107160757' })));
        const d = await r.r.json();
        pruefe('Route handelsregister: 409 {code: "website_passt_nicht", fehler, website, firma}', r.r.status === 409 && d.code === 'website_passt_nicht' && d.fehler === sollNeutral && d.website === 'beispiel-portal.ch' && d.firma === ET.name && !('nachweis' in d), JSON.stringify(d));
        const vorAuftraege = (await speicherMod.speicher().liste('auftrag/')).length;
        const ra = await stumm(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(neutral.id))));
        const da = await ra.r.json();
        pruefe('Route anruf nach 409: 403 handelsregister_fehlt, kein Auftrag', ra.r.status === 403 && da.code === texte.HR_CODE_FEHLT && (await speicherMod.speicher().liste('auftrag/')).length === vorAuftraege, JSON.stringify(da));
        // Liste bleibt wählbar: eine andere gezeigte Firma, die ebenfalls nicht passt → wieder 409, Zähler unverändert
        const { r: y } = await stumm(() => hr.bestaetige(scan, 'CHE169547556'));
        pruefe('409 wiederholbar mit anderem Listeneintrag (Liste bleibt wählbar), Zähler bleibt', !y.ok && y.status === 409 && (await hr.leseEintrag(scan)).manuell === 1);
    }
    {
        // P1 (c): ohne UID, Namen ohne Treffer → Domain-Label «elektro tel»; Bindung über die Domain
        zefixAntwort = ({ body }) => (body?.name === 'elektro tel' ? json(200, { list: [ANDERE_ELEKTRO, ET_ZN1, ET_HAUPT, ET_ZN2] }) : json(404, NORESULT));
        // Marke aus dem Scan passt nicht zum Label (sonst wäre das Label schon als Name gesucht — keine Doppelabfrage)
        const scan = await neuerScan('elektro-tel.ch', { firma: 'Willkommen', titel: 'Willkommen' }, { firma: 'Ihr Elektriker' });
        const vor = aufrufe.length;
        const { r: a } = await stumm(() => hr.automatischePruefung(scan));
        const namen = namenSeit(vor);
        pruefe('P1 (c): Domain-Label zuletzt als Suchbegriff («elektro tel»)', namen[namen.length - 1] === 'elektro tel' && namen.length <= 4, namen.join(' | '));
        pruefe('P1 (c): Treffer, höchstens 5, aktive zuerst, Elektro-Tel vor fremden Firmen', a.ergebnis === 'treffer' && a.treffer.length <= 5 && a.treffer.every((t, i, l) => i === 0 || !t.aktiv || l[i - 1].aktiv) && /Elektro-Tel/.test(a.treffer[0].name), a.treffer.map((t) => `${t.name} ${t.sitz}`).join(' | '));
        const { r: x } = await stumm(() => hr.bestaetige(scan, 'CHE107160757'));
        const e = await hr.leseEintrag(scan);
        pruefe('Bestätigen über Domain: gebunden «domain», im Nachweis signiert', x.ok && x.antwort.bestaetigt?.gebunden === 'domain' && e.bestaetigt?.gebunden === 'domain' && hr.pruefeNachweis(e.bestaetigt.nachweis, scan.id).gebunden === 'domain');
        const { r: fremd } = await stumm(() => hr.bestaetige(scan, ANDERE_ELEKTRO.uid));
        pruefe('Gleiche Liste, fremde Firma (Bütler Elektro Telecom) → 409, frühere Bestätigung bleibt', !fremd.ok && fremd.status === 409 && (await hr.leseEintrag(scan)).bestaetigt?.uid === 'CHE107160757');
        // Anruf: Marke «Ihr Elektriker» passt nicht → Sprechname = Registername (Rechtsform steht nicht am Ende)
        const r = await stumm(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        const d = await r.r.json();
        const auftrag = d.id ? await auftraege.leseAuftrag(d.id) : null;
        pruefe('Anruf 201, profil.firma = Sprechname «Elektro-Tel AG für elektrotechnische Anlagen» (nie «Ihr Elektriker»), handelsregister wie A-109 (7 Felder)', r.r.status === 201 && auftrag?.profil?.firma === ET.name && Object.keys(auftrag.handelsregister ?? {}).sort().join(',') === 'geprueft_am,name,quelle,sitz,status,uid,uid_formatiert', `${r.r.status} ${auftrag?.profil?.firma}`);
    }
    {
        // Regel 1 (uid) mit dem echten Registernamen «lnfraOne IT Solutions GmbH»; Sprechname «InfraOne»
        zefixAntwort = ({ body }) => (body?.name === 'CHE-288.114.187' ? json(200, { list: [INFRA] }) : json(404, NORESULT));
        const scan = await neuerScan('infraone.ch', { uid_kandidaten: ['CHE288114187'], titel: 'InfraOne – IT-Support' }, { firma: 'InfraOne' });
        const { r: a } = await stumm(() => hr.automatischePruefung(scan));
        const { r: x } = await stumm(() => hr.bestaetige(scan, 'CHE288114187'));
        pruefe('infraone.ch: UID aus dem Impressum → Treffer → gebunden «uid»', a.ergebnis === 'treffer' && a.quelle === 'uid' && x.ok && x.antwort.bestaetigt?.gebunden === 'uid');
        const r = await stumm(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        const d = await r.r.json();
        const auftrag = d.id ? await auftraege.leseAuftrag(d.id) : null;
        pruefe('Anruf: profil.firma «InfraOne» (Marke passt trotz Register-Schreibweise «lnfraOne»), Register-Name im Auftrag', r.r.status === 201 && auftrag?.profil?.firma === 'InfraOne' && auftrag.handelsregister?.name === 'lnfraOne IT Solutions GmbH', `${auftrag?.profil?.firma} / ${auftrag?.handelsregister?.name}`);
        // P2-Negativbeispiel im Ablauf: infraone.ch, manuell «Elektro-Tel AG» → 409
        zefixAntwort = ({ body }) => (body?.name === 'Elektro-Tel' ? json(200, { list: [ANDERE_ELEKTRO, ET_ZN1, ET_HAUPT, ET_ZN2] }) : json(404, NORESULT));
        await stumm(() => hr.manuelleSuche(scan, 'Elektro-Tel'));
        const { r: y } = await stumm(() => hr.bestaetige(scan, 'CHE107160757'));
        pruefe('infraone.ch ↔ Elektro-Tel (Winterthur) → 409 website_passt_nicht', !y.ok && y.status === 409 && y.code === 'website_passt_nicht' && y.website === 'infraone.ch');
    }
    {
        // Regel 3 (text): Firma nur im Website-Text (Fusszeile); Sprechname aus dem Register
        const holz = zefixEintrag(MUSTER_HOLZBAU);
        zefixAntwort = ({ body }) => (body?.name === 'Muster Holzbau' ? json(200, { list: [holz] }) : json(404, NORESULT));
        const scan = await neuerScan('mein-handwerk.ch', { bindung_text: b.bindungsTextAusSeiten({ titel: 'Mein Handwerk', impressum: [], startZeilen: ['Fenster und Türen', '© 2026 Muster Holzbau AG, 8400 Winterthur'] }) }, { firma: 'Mein Handwerk' });
        await stumm(() => hr.automatischePruefung(scan));
        const { r: m } = await stumm(() => hr.manuelleSuche(scan, 'Muster Holzbau'));
        const { r: x } = await stumm(() => hr.bestaetige(scan, MUSTER_HOLZBAU.uid));
        pruefe('Regel 3 im Ablauf: Name in der Fusszeile → gebunden «text»', m.ok && x.ok && x.antwort.bestaetigt?.gebunden === 'text');
        const r = await stumm(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        const alle = await Promise.all((await speicherMod.speicher().liste('auftrag/')).map((k) => auftraege.leseAuftrag(k.split('/').pop())));
        const dieser = alle.find((a) => a?.scan_id === scan.id);
        pruefe('Anruf: Marke «Mein Handwerk» passt nicht → Sprechname «Muster Holzbau» (Register ohne Rechtsform am Ende)', r.r.status === 201 && dieser?.profil?.firma === 'Muster Holzbau', `${dieser?.profil?.firma}`);
        // Nachtrag: Wissenseinträge und übriger Text zählen nicht mehr; ältere Scans ohne bindung_text: nur der Titel
        const scan2 = await neuerScan('beispiel-web.ch', { titel: 'Beispiel', text: 'Wir arbeiten mit der Muster Holzbau AG.' }, { firma: 'Beispiel', wissen: [{ frage: 'Wer betreibt die Website?', antwort: 'Die Muster Holzbau AG in Winterthur.', thema: 'firma' }] });
        gleich('Nachtrag: Wissenseinträge und Fliesstext binden nicht (Scan ohne bindung_text)', b.pruefeBindung(MUSTER_HOLZBAU, hr.bindungsBasis(scan2)), null);
        const scan3 = await neuerScan('beispiel-web.ch', { titel: 'Muster Holzbau AG – Beispiel' }, { firma: 'Beispiel' });
        gleich('Nachtrag: ältere Scans ohne bindung_text — der Titel zählt', b.pruefeBindung(MUSTER_HOLZBAU, hr.bindungsBasis(scan3)), 'text');
        // Nachtrag im Ablauf: Name nur im Fliesstext der Startseite → 409
        const fliess = Array.from({ length: 40 }, (_, i) => `Absatz ${i + 1}: Fenster, Türen und Treppen nach Mass für Ihr Zuhause in der ganzen Region.`);
        const scan4 = await neuerScan('mein-handwerk.ch', { bindung_text: b.bindungsTextAusSeiten({ titel: 'Mein Handwerk', impressum: ['Impressum', 'Mein Handwerk GmbH'], startZeilen: ['Partner: Muster Holzbau AG', ...fliess, '© 2026 Mein Handwerk GmbH'] }) }, { firma: 'Mein Handwerk' });
        await stumm(() => hr.automatischePruefung(scan4));
        await stumm(() => hr.manuelleSuche(scan4, 'Muster Holzbau'));
        const { r: y4 } = await stumm(() => hr.bestaetige(scan4, MUSTER_HOLZBAU.uid));
        pruefe('Nachtrag im Ablauf: Partner nur im Fliesstext erwähnt → 409 website_passt_nicht', !y4.ok && y4.status === 409 && y4.code === 'website_passt_nicht');
    }
    {
        // Nachweis ohne gebunden im Speicher (Bestätigung aus A-109) → Anruf 403
        zefixAntwort = ({ body }) => (body?.name === 'CHE-107.160.757' ? json(200, { list: [ET_HAUPT] }) : json(404, NORESULT));
        const scan = await neuerScan('elektro-tel.ch', { uid_kandidaten: ['CHE107160757'] }, { firma: 'Elektro-Tel' });
        await stumm(() => hr.automatischePruefung(scan));
        const { r: okUid } = await stumm(() => hr.bestaetige(scan, 'CHE107160757'));
        pruefe('Marke «Elektro-Tel» ↔ Register «Elektro-Tel AG für …»: Sprechname «Elektro-Tel» (Funktion wie Route)', okUid.ok && b.sprechName('Elektro-Tel', okUid.antwort.bestaetigt.name) === 'Elektro-Tel');
        const e = await hr.leseEintrag(scan);
        const bis = Date.now() + 10 * 60_000;
        const altSig = createHmac('sha256', process.env.DEMO_TOKEN).update(`handelsregister:${scan.id}:CHE107160757:${bis}`).digest('base64url');
        const { gebunden: _weg, ...ohne } = e.bestaetigt;
        void _weg;
        await speicherMod.speicher().schreibe(`handelsregister/${scan.id}`, { ...e, bestaetigt: { ...ohne, nachweis: `CHE107160757.${bis}.${altSig}`, nachweis_bis: bis } });
        const n1 = await hr.nachweisFuerAnruf(scan);
        const r1 = await stumm(() => anrufRoute.POST(post('/api/demo/anruf', anrufBody(scan.id))));
        pruefe('Nachweis ohne gebunden (A-109-Format) → nachweisFuerAnruf lehnt ab, Route 403', !n1.ok && n1.code === texte.HR_CODE_FEHLT && r1.r.status === 403);
        // gültiger neuer Nachweis, aber Feld gebunden fehlt im gespeicherten Eintrag → abgelehnt
        await speicherMod.speicher().schreibe(`handelsregister/${scan.id}`, { ...e, bestaetigt: { ...ohne, nachweis: hr.signiereNachweis(scan.id, 'CHE107160757', bis, 'uid'), nachweis_bis: bis } });
        pruefe('Gespeicherte Bestätigung ohne Feld gebunden → abgelehnt', (await hr.nachweisFuerAnruf(scan)).ok === false);
        // gespeichertes gebunden passt nicht zum signierten → abgelehnt
        await speicherMod.speicher().schreibe(`handelsregister/${scan.id}`, { ...e, bestaetigt: { ...e.bestaetigt, gebunden: 'text', nachweis: hr.signiereNachweis(scan.id, 'CHE107160757', bis, 'uid'), nachweis_bis: bis } });
        pruefe('Gespeichertes gebunden ≠ signiertes gebunden → abgelehnt', (await hr.nachweisFuerAnruf(scan)).ok === false);
        // wieder richtig → ok
        await speicherMod.speicher().schreibe(`handelsregister/${scan.id}`, { ...e, bestaetigt: { ...e.bestaetigt, gebunden: 'uid', nachweis: hr.signiereNachweis(scan.id, 'CHE107160757', bis, 'uid'), nachweis_bis: bis } });
        pruefe('Korrekt gebundener Nachweis → ok', (await hr.nachweisFuerAnruf(scan)).ok === true);
    }
    {
        // Texte P6 und P2 (wortgleich)
        gleich('P6: Untertitel ein Treffer', texte.HR_SCHRITT.untertitelEiner('elektro-tel.ch'), 'Diesen Eintrag haben wir zu elektro-tel.ch im Handelsregister gefunden.');
        gleich('P6: Untertitel mehrere', texte.HR_SCHRITT.untertitelMehrere('elektro-tel.ch'), 'Zu elektro-tel.ch passen mehrere Einträge im Handelsregister. Wählen Sie Ihre Firma.');
        gleich('P6: Titel, Schritte, Knöpfe', [texte.HR_SCHRITT.titel, texte.HR_SCHRITT.telefonPruefung, texte.HR_SCHRITT.telefonBestaetigt('Muster AG'), texte.HR_SCHRITT.assistentWartet, texte.HR_SCHRITT.andereWebsite, texte.HR_SCHRITT.zurueck], [
            'Welche ist Ihre Firma?',
            'Firma wird im Handelsregister geprüft …',
            'Handelsregister: Muster AG',
            'Wartet auf die Bestätigung Ihrer Firma',
            'Andere Website eingeben',
            'Zurück zu den Vorschlägen',
        ]);
        gleich('P2: Meldung mit Platzhaltern (Beispiel aus dem Auftrag)', texte.websitePasstNichtText('elektro-tel.ch', 'Muster AG'), 'Die Website elektro-tel.ch gehört laut Handelsregister und Website-Inhalt nicht zu Muster AG. Bitte geben Sie die Website Ihrer Firma ein oder wählen Sie den passenden Eintrag.');
    }
    pruefe('Kein Aufruf an fremde Adressen (nur zefix.admin.ch)', aufrufe.every((a) => a.url.startsWith('https://www.zefix.admin.ch/')), `${aufrufe.length} Aufrufe`);
} finally {
    globalThis.fetch = altFetch;
    rmSync(TEST_STORE, { recursive: true, force: true });
}

console.log(`\n${gesamt - fehler}/${gesamt} Prüfungen bestanden.`);
process.exit(fehler ? 1 : 0);
