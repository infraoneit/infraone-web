#!/usr/bin/env node
/**
 * navigation-einheit-test.mjs — Einheitstests der Navigation, ohne Server und ohne Browser.
 *
 * AUFTRAG-113 (ersetzt die Prüfungen aus AUFTRAG-100 für das Mega-Menü):
 * - Leiste genau «Leistungen, KI-Telefonassistent, IT-Support, Cloud-Telefonie, Unternehmen»
 * - jedes Dropdown enthält genau die Einträge und Pfade aus AUFTRAG-113, Abschnitt 1
 * - keine Gruppe «Für wen» (keine Branchen-Ankerlinks, keine Regionen im Header)
 * - die fünf Anwendungs- und sechs Branchen-Unterseiten, Vergleich und Glossar stehen nicht im Header
 * - jede Menü-Adresse ist eine bestehende Route (page.tsx bzw. [region]-Template mit Inhaltsdatei)
 *   oder eine bestehende Weiterleitung aus next.config.ts (seit dem Nachtrag zu AUFTRAG-113 keine mehr im Header)
 * - Nachtrag AUFTRAG-113: «Telefonie & Kommunikation» (/telefonie, nur Weiterleitung) steht nicht mehr unter «Leistungen»
 * - Texte: keine Zahlen (ausser Produktnamen), keine Superlative, kein ß, keine Dachmarke,
 *   «Neu» nur beim KI-Telefonassistenten
 * - aktivePanelId / pfadVon (Hervorhebung), auch für alle 24 Regionsseiten
 * - toter Code: ladeNavRegionen / lib/nav-regionen.ts nirgends mehr im Quelltext
 *
 *   node scripts/navigation-einheit-test.mjs
 *
 * Node >= 22.18 (Type-Stripping).
 */
import { registerHooks } from 'node:module';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

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

const nav = await import(pathToFileURL(path.join(ROOT, 'src/components/layout/navigation.ts')).href);
const { KI_SEITEN, KI_BASIS, ANWENDUNG_SLUGS, BRANCHEN_SLUGS } = await import(pathToFileURL(path.join(ROOT, 'src/components/ki-telefonassistent/seiten.ts')).href);

let ok = 0;
let fehl = 0;
function pruefe(name, bedingung, detail = '') {
    if (bedingung) ok++;
    else fehl++;
    console.log(`${bedingung ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
const liste = (links) => links.map((l) => `${l.titel}=${l.href}`).join(' | ');

/** Gibt es zu diesem Pfad eine Seite im App-Router (statisch oder über ein [region]-Template)? */
function routeExistiert(pfad) {
    const app = path.join(ROOT, 'src', 'app', '(website)');
    const teile = pfad.split('/').filter(Boolean);
    if (existsSync(path.join(app, ...teile, 'page.tsx'))) return true;
    if (teile.length === 2 && existsSync(path.join(app, teile[0], '[region]', 'page.tsx'))) {
        const ordner = { 'it-support': 'it-support-regions', 'cloud-telefonie': 'cloud-telefonie-regions', webdesign: 'webdesign-regions' }[teile[0]];
        return !!ordner && existsSync(path.join(ROOT, 'content', 'leistungen', ordner, `${teile[1]}.json`));
    }
    return false;
}

/** Weiterleitungen aus next.config.ts (z. B. /telefonie → /cloud-telefonie, unverändert seit vor AUFTRAG-113) */
const WEITERLEITUNGEN = new Map(
    [...readFileSync(path.join(ROOT, 'next.config.ts'), 'utf8').matchAll(/source:\s*'([^']+)',\s*destination:\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
);
/** Bestehende Route oder bestehende Weiterleitung auf eine bestehende Route */
const erreichbar = (pfad) => routeExistiert(pfad) || (WEITERLEITUNGEN.has(pfad) && routeExistiert(pfadVon(WEITERLEITUNGEN.get(pfad))));
function pfadVon(href) {
    const i = href.indexOf('#');
    return i < 0 ? href : href.slice(0, i);
}

/** Regionsseiten aus den Inhaltsdateien der drei [region]-Templates */
function regionen() {
    const gruppen = { '/it-support': 'it-support-regions', '/cloud-telefonie': 'cloud-telefonie-regions', '/webdesign': 'webdesign-regions' };
    return Object.entries(gruppen).flatMap(([basis, ordner]) =>
        readdirSync(path.join(ROOT, 'content', 'leistungen', ordner))
            .filter((f) => f.endsWith('.json'))
            .map((f) => ({ basis, pfad: `${basis}/${f.replace(/\.json$/, '')}` })),
    );
}

/* ---------------- Soll aus AUFTRAG-113, Abschnitt 1 ---------------- */
const SOLL = {
    leiste: ['Leistungen', 'KI-Telefonassistent', 'IT-Support', 'Cloud-Telefonie', 'Unternehmen'],
    leistungen: {
        IT: [
            ['IT-Support', '/it-support'],
            ['IT-Systeme & Netzwerke', '/it-netzwerke'],
            ['IT-Sicherheit', '/it-sicherheit'],
            ['Microsoft 365', '/microsoft-365'],
            ['WLAN', '/wlan'],
            ['Videoüberwachung', '/videoueberwachung'],
        ],
        'Kommunikation & Digital': [
            ['Cloud-Telefonie', '/cloud-telefonie'],
            ['KI-Telefonassistent', '/ki-telefonassistent'],
            ['Webdesign', '/webdesign'],
            ['Digital Signage', '/digital-signage'],
            ['KI & Software-Entwicklung', '/software-entwicklung'],
        ],
    },
    leistungenFuss: ['Alle Leistungen im Überblick', '/leistungen'],
    ki: {
        Produkt: [
            ['Übersicht und Live-Test', '/ki-telefonassistent'],
            ['Funktionen', '/ki-telefonassistent/funktionen'],
            ['So funktioniert es', '/ki-telefonassistent/so-funktioniert-es'],
            ['Schweizerdeutsch', '/ki-telefonassistent/schweizerdeutsch'],
            ['Preise', '/ki-telefonassistent/preise'],
        ],
        Mehr: [
            ['Anwendungen', '/ki-telefonassistent/anwendungen'],
            ['Branchen', '/ki-telefonassistent/branchen'],
            ['Sicherheit und Datenschutz', '/ki-telefonassistent/sicherheit-datenschutz'],
            ['Häufige Fragen', '/ki-telefonassistent/faq'],
        ],
    },
    kiFuss: ['KI-Anruf testen', '/ki-telefonassistent'],
    cloud: [
        ['Cloud-Telefonie im Überblick', '/cloud-telefonie'],
        ['Peoplefone vPBX', '/cloud-telefonie#peoplefone'],
        ['3CX', '/cloud-telefonie/3cx'],
        ['Microsoft Teams', '/cloud-telefonie/ms-teams'],
        ['Yeastar', '/cloud-telefonie/yeastar'],
    ],
    unternehmen: [
        ['Über uns', '/unternehmen'],
        ['Partner', '/partner'],
        ['Blog', '/blog'],
        ['Kontakt', '/kontakt'],
    ],
};
const paare = (links) => JSON.stringify(links.map((l) => [l.titel, l.href]));
const gruppenPaare = (gruppen) => JSON.stringify(Object.fromEntries(gruppen.map((g) => [g.titel, g.links.map((l) => [l.titel, l.href])])));

/* ---------------- Struktur ---------------- */
pruefe('Leiste: genau Leistungen, KI-Telefonassistent, IT-Support, Cloud-Telefonie, Unternehmen', JSON.stringify(nav.LEISTE.map((x) => x.titel)) === JSON.stringify(SOLL.leiste), nav.LEISTE.map((x) => x.titel).join(', '));
pruefe('Leiste: Dropdowns leistungen, ki, cloud, unternehmen; IT-Support als Direktlink', JSON.stringify(nav.LEISTE.map((x) => x.panel)) === JSON.stringify(['leistungen', 'ki', null, 'cloud', 'unternehmen']) && nav.IT_SUPPORT.href === '/it-support');
pruefe('Leistungen: zwei Spalten «IT» (6) und «Kommunikation & Digital» (5), Einträge und Pfade exakt', gruppenPaare(nav.LEISTUNGEN) === JSON.stringify(SOLL.leistungen), gruppenPaare(nav.LEISTUNGEN));
pruefe('Leistungen: Fusszeile «Alle Leistungen im Überblick» → /leistungen', paare([nav.LEISTUNGEN_UEBERSICHT]) === JSON.stringify([SOLL.leistungenFuss]));
pruefe('KI-Telefonassistent: zwei Spalten «Produkt» (5) und «Mehr» (4), Einträge und Pfade exakt', gruppenPaare(nav.KI_MENUE) === JSON.stringify(SOLL.ki), gruppenPaare(nav.KI_MENUE));
pruefe('KI-Telefonassistent: Fusszeile «KI-Anruf testen» → /ki-telefonassistent (Text aus KI_KARTE)', nav.KI_KARTE.titel === SOLL.kiFuss[0] && nav.KI_KARTE.href === SOLL.kiFuss[1]);
pruefe('Cloud-Telefonie: eine Spalte, Einträge und Pfade exakt; Leistenknopf verlinkt /cloud-telefonie', paare(nav.CLOUD_TELEFONIE) === JSON.stringify(SOLL.cloud) && nav.CLOUD_TELEFONIE_HREF === '/cloud-telefonie', liste(nav.CLOUD_TELEFONIE));
pruefe('Unternehmen: Über uns, Partner, Blog, Kontakt', paare(nav.UNTERNEHMEN) === JSON.stringify(SOLL.unternehmen), liste(nav.UNTERNEHMEN));
pruefe('Erstgespräch → /kontakt', nav.ERSTGESPRAECH.titel === 'Kostenloses Erstgespräch' && nav.ERSTGESPRAECH.href === '/kontakt');

/* ---------------- kein «Für wen», keine Regionen, keine KI-Detailseiten ---------------- */
const links = nav.headerLinks();
const exporte = Object.keys(nav);
pruefe('keine Gruppe «Für wen»: keine Exporte BRANCHEN/REGION_GRUPPEN/KEINE_REGIONEN/DIREKTLINKS/KI_BEREICH', !['BRANCHEN', 'REGION_GRUPPEN', 'KEINE_REGIONEN', 'DIREKTLINKS', 'KI_BEREICH'].some((e) => exporte.includes(e)), exporte.join(','));
pruefe('keine Gruppe «Für wen»: kein Titel «Für wen» und keine Branchen-Anker (#betriebe, #anwendungsfaelle, #branchen)', !links.some((l) => /für wen/i.test(l.titel) || /#(betriebe|anwendungsfaelle|branchen)$/.test(l.href)) && !nav.LEISTE.some((x) => /für wen/i.test(x.titel)));
const regionsPfade = new Set(regionen().map((r) => r.pfad));
pruefe(`keine der ${regionsPfade.size} Regionsseiten im Header`, regionsPfade.size === 24 && !links.some((l) => regionsPfade.has(nav.pfadVon(l.href))), `${regionsPfade.size} Regionen`);
const kiDetail = [...ANWENDUNG_SLUGS.map((s) => `${KI_BASIS}/anwendungen/${s}`), ...BRANCHEN_SLUGS.map((s) => `${KI_BASIS}/branchen/${s}`), `${KI_BASIS}/vergleich`, `${KI_BASIS}/glossar`];
pruefe('Anwendungs- (5) und Branchen-Unterseiten (6), Vergleich und Glossar nicht im Header', kiDetail.length === 13 && !links.some((l) => kiDetail.includes(nav.pfadVon(l.href))));
pruefe('…aber weiter als Seiten vorhanden (keine Route entfernt)', kiDetail.every((p) => KI_SEITEN.some((s) => s.pfad === p)) && kiDetail.filter((p) => !p.includes('/anwendungen/') && !p.includes('/branchen/')).every(routeExistiert));

/* ---------------- Adressen ---------------- */
const tot = links.filter((l) => !erreichbar(nav.pfadVon(l.href)));
const umgeleitet = links.filter((l) => !routeExistiert(nav.pfadVon(l.href))).map((l) => `${l.href} → ${WEITERLEITUNGEN.get(nav.pfadVon(l.href))}`);
pruefe(`alle ${links.length} Header-Adressen sind bestehende Routen (oder bestehende Weiterleitungen)`, tot.length === 0, tot.length ? tot.map((l) => l.href).join(', ') : `Weiterleitung: ${umgeleitet.join(', ') || 'keine'}`);
pruefe('keine externen oder relativen Adressen', links.every((l) => l.href.startsWith('/') && !l.href.startsWith('//')));
const leistungsHrefs = nav.LEISTUNGEN.flatMap((g) => g.links.map((l) => l.href));
pruefe('Leistungen: keine Adresse doppelt (11)', new Set(leistungsHrefs).size === 11 && leistungsHrefs.length === 11);
// Nachtrag AUFTRAG-113: /telefonie ist nur eine Weiterleitung auf /cloud-telefonie → nicht mehr im Header
pruefe('Nachtrag: «Telefonie & Kommunikation» (/telefonie) nicht mehr im Header, Weiterleitung besteht weiter', !links.some((l) => nav.pfadVon(l.href) === '/telefonie' || l.titel === 'Telefonie & Kommunikation') && WEITERLEITUNGEN.get('/telefonie') === '/cloud-telefonie');

/* ---------------- Texte ---------------- */
const texte = [...links.map((l) => l.titel), ...nav.LEISTE.map((x) => x.titel), ...nav.LEISTUNGEN.map((g) => g.titel), ...nav.KI_MENUE.map((g) => g.titel), nav.KI_KARTE.text, nav.KI_KARTE.aktion].filter(Boolean);
const mitZahl = texte.filter((t) => /\d/.test(t.replace(/\b3CX\b/g, '').replace(/Microsoft 365/g, '')));
pruefe('Texte ohne Zahlen (ausser 3CX, Microsoft 365)', mitZahl.length === 0, mitZahl.join(' | '));
pruefe('Texte ohne Superlative', !texte.some((t) => /\b(beste[nrs]?|führend\w*|top|nr\.?\s*1|einzig\w*|unschlagbar|garantiert|perfekt\w*|weltklasse|marktführer\w*|schnellste\w*|günstigste\w*)\b/i.test(t)));
pruefe('Texte ohne ß und ohne Dachmarke Elektro-Tel', !texte.some((t) => /ß|Elektro-Tel/i.test(t)));
pruefe('Badge «Neu» nur beim KI-Telefonassistenten', links.filter((l) => l.badge).map((l) => `${l.titel}:${l.badge}`).join() === 'KI-Telefonassistent:Neu' && nav.NEU === 'Neu');
pruefe('keine Beschreibungstexte und keine Icons in den Menüdaten', links.every((l) => Object.keys(l).every((k) => ['titel', 'href', 'badge'].includes(k))));

/* ---------------- Hervorhebung ---------------- */
pruefe('pfadVon schneidet den Anker ab', nav.pfadVon('/cloud-telefonie#peoplefone') === '/cloud-telefonie' && nav.pfadVon('/wlan') === '/wlan');
const beispiele = [
    ['/ki-telefonassistent', 'ki'],
    ['/ki-telefonassistent/preise', 'ki'],
    ['/ki-telefonassistent/branchen/garage', 'ki'],
    ['/cloud-telefonie', 'cloud'],
    ['/cloud-telefonie/3cx', 'cloud'],
    ['/cloud-telefonie/winterthur', 'cloud'],
    ['/it-support', 'direkt'],
    ['/it-support/winterthur', 'direkt'],
    ['/webdesign', 'leistungen'],
    ['/webdesign/zug', 'leistungen'],
    ['/wlan', 'leistungen'],
    ['/digital-signage', 'leistungen'],
    ['/leistungen', 'leistungen'],
    ['/partner', 'unternehmen'],
    ['/blog', 'unternehmen'],
    ['/kontakt', 'unternehmen'],
    ['/', null],
    ['/impressum', null],
];
const falsch = beispiele.filter(([p, soll]) => nav.aktivePanelId(p) !== soll);
pruefe(`aktivePanelId: ${beispiele.length} Beispielpfade (KI, Cloud, IT-Support, Leistungen, Unternehmen, keine)`, falsch.length === 0, falsch.map(([p, soll]) => `${p}: ${nav.aktivePanelId(p)} statt ${soll}`).join(', '));
const regionSoll = { '/it-support': 'direkt', '/cloud-telefonie': 'cloud', '/webdesign': 'leistungen' };
const regionFalsch = regionen().filter((r) => nav.aktivePanelId(r.pfad) !== regionSoll[r.basis]);
pruefe('aktivePanelId: alle 24 Regionsseiten → Gruppe ihrer Basis (IT-Support direkt, Cloud, Leistungen)', regionFalsch.length === 0, regionFalsch.map((r) => r.pfad).join(', '));

/* ---------------- toter Code ---------------- */
function dateien(d) {
    return readdirSync(d).flatMap((n) => {
        const p = path.join(d, n);
        return statSync(p).isDirectory() ? dateien(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
    });
}
const reste = dateien(path.join(ROOT, 'src')).filter((p) => /ladeNavRegionen|lib\/nav-regionen|NavRegionen/.test(readFileSync(p, 'utf8')));
pruefe('toter Code entfernt: lib/nav-regionen.ts und ladeNavRegionen nirgends mehr im Quelltext', !existsSync(path.join(ROOT, 'src', 'lib', 'nav-regionen.ts')) && reste.length === 0, reste.join(', '));

console.log(`\n${ok}/${ok + fehl} bestanden`);
process.exit(fehl ? 1 : 0);
