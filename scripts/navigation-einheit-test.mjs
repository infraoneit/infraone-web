#!/usr/bin/env node
/**
 * navigation-einheit-test.mjs (AUFTRAG-100) — Einheitstests des Mega-Menüs,
 * ohne Server und ohne Browser:
 * - jede Menü-Adresse ist eine bestehende Route (page.tsx bzw. [region]-Template
 *   mit Inhaltsdatei) — keine neuen Routen, keine toten Links
 * - Regionen aus ladeNavRegionen() = generateStaticParams der drei Templates (24)
 * - Texte: keine Zahlen (ausser Produktnamen), keine Superlative, kein ß,
 *   keine Dachmarke, «Neu» nur beim KI-Telefonassistenten
 * - aktivePanelId / pfadVon (Hervorhebung der aktuellen Gruppe)
 *
 *   node scripts/navigation-einheit-test.mjs
 *
 * Node >= 22.18 (Type-Stripping).
 */
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
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

// lib/leistungen liest content/ relativ zum Arbeitsverzeichnis
process.chdir(ROOT);
const nav = await import(pathToFileURL(path.join(ROOT, 'src/components/layout/navigation.ts')).href);
const { ladeNavRegionen } = await import(pathToFileURL(path.join(ROOT, 'src/lib/nav-regionen.ts')).href);

let ok = 0;
let fehl = 0;
function pruefe(name, bedingung, detail = '') {
    if (bedingung) ok++;
    else fehl++;
    console.log(`${bedingung ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

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

const regionen = await ladeNavRegionen();
const anzahl = nav.REGION_GRUPPEN.map((g) => regionen[g.schluessel].length);
pruefe('Regionen: 6 IT-Support, 6 Cloud-Telefonie, 12 Webdesign = 24', anzahl.join('/') === '6/6/12', anzahl.join('/'));
pruefe('Regionen: alphabetisch (de-CH)', nav.REGION_GRUPPEN.every((g) => regionen[g.schluessel].map((r) => r.name).join('|') === [...regionen[g.schluessel]].map((r) => r.name).sort((a, b) => a.localeCompare(b, 'de-CH')).join('|')));
pruefe('Regionen: Namen aus den Inhaltsdateien (Umlaute)', regionen.webdesign.some((r) => r.name === 'Graubünden') && regionen.itSupport.some((r) => r.name === 'Zürich'));

const links = [
    ...nav.LEISTUNGEN.flatMap((g) => g.links),
    nav.LEISTUNGEN_UEBERSICHT,
    { titel: nav.KI_KARTE.titel, href: nav.KI_KARTE.href, text: nav.KI_KARTE.text },
    nav.ERSTGESPRAECH,
    ...nav.BRANCHEN,
    ...nav.UNTERNEHMEN,
    ...nav.DIREKTLINKS,
    ...nav.REGION_GRUPPEN.flatMap((g) => regionen[g.schluessel].map((r) => ({ titel: r.name, href: `${g.basis}/${r.slug}` }))),
];
const tot = links.filter((l) => !routeExistiert(nav.pfadVon(l.href)));
pruefe(`alle ${links.length} Menü-Adressen sind bestehende Routen`, tot.length === 0, tot.map((l) => l.href).join(', '));
pruefe('keine externen oder relativen Adressen', links.every((l) => l.href.startsWith('/') && !l.href.startsWith('//')));
pruefe('Leistungen: drei Spalten IT-Betrieb (6), Kommunikation (5), Digital (3)', nav.LEISTUNGEN.map((g) => `${g.titel}:${g.links.length}`).join() === 'IT-Betrieb:6,Kommunikation:5,Digital:3');
pruefe('Leistungen: keine Adresse doppelt', new Set(nav.LEISTUNGEN.flatMap((g) => g.links.map((l) => l.href))).size === 14);
pruefe('Branchen: Ziele nur Abschnitte bestehender Seiten (#betriebe, #anwendungsfaelle, #branchen)', nav.BRANCHEN.every((b) => /#(betriebe|anwendungsfaelle|branchen)$/.test(b.href)), nav.BRANCHEN.map((b) => b.href).join(' '));
pruefe('Unternehmen: Über uns, Partner, Blog, Kontakt', nav.UNTERNEHMEN.map((l) => l.titel).join() === 'Über uns,Partner,Blog,Kontakt');
pruefe('Direktlinks: IT-Support, Cloud-Telefonie', nav.DIREKTLINKS.map((l) => l.href).join() === '/it-support,/cloud-telefonie');
pruefe('KI-Karte → /ki-telefonassistent, Erstgespräch → /kontakt', nav.KI_KARTE.href === '/ki-telefonassistent' && nav.ERSTGESPRAECH.href === '/kontakt');

const texte = [...links.flatMap((l) => [l.titel, l.text ?? '']), nav.KI_KARTE.aktion, ...nav.LEISTUNGEN.map((g) => g.titel)].filter(Boolean);
const regionNamen = new Set(nav.REGION_GRUPPEN.flatMap((g) => regionen[g.schluessel].map((r) => r.name)));
pruefe('Texte ohne Zahlen (ausser 3CX, Microsoft 365)', !texte.some((t) => /\d/.test(t.replace(/\b3CX\b/g, '').replace(/Microsoft 365/g, ''))), texte.filter((t) => /\d/.test(t.replace(/\b3CX\b/g, '').replace(/Microsoft 365/g, ''))).join(' | '));
pruefe('Texte ohne Superlative', !texte.some((t) => /\b(beste[nrs]?|führend\w*|top|nr\.?\s*1|einzig\w*|unschlagbar|garantiert|perfekt\w*|weltklasse|marktführer\w*|schnellste\w*|günstigste\w*)\b/i.test(t)));
pruefe('Texte ohne ß und ohne Dachmarke Elektro-Tel', !texte.some((t) => /ß|Elektro-Tel/i.test(t)));
pruefe('Beschreibungen kurz (≤ 45 Zeichen, ein Satz mit Punkt)', links.filter((l) => l.text && !regionNamen.has(l.titel)).every((l) => l.text.length <= 45 && /\.$/.test(l.text)));
pruefe('Badge «Neu» nur beim KI-Telefonassistenten', links.filter((l) => l.badge).map((l) => `${l.titel}:${l.badge}`).join() === 'KI-Telefonassistent:Neu');

pruefe('pfadVon schneidet den Anker ab', nav.pfadVon('/digital-signage#branchen') === '/digital-signage' && nav.pfadVon('/wlan') === '/wlan');
pruefe('aktivePanelId: Direktlink', nav.aktivePanelId('/it-support', regionen) === 'direkt' && nav.aktivePanelId('/cloud-telefonie', regionen) === 'direkt');
pruefe('aktivePanelId: Leistungen', nav.aktivePanelId('/wlan', regionen) === 'leistungen' && nav.aktivePanelId('/cloud-telefonie/3cx', regionen) === 'leistungen' && nav.aktivePanelId('/leistungen', regionen) === 'leistungen');
pruefe('aktivePanelId: Für wen (Regionsseite)', nav.aktivePanelId('/it-support/winterthur', regionen) === 'fuer-wen' && nav.aktivePanelId('/webdesign/zug', regionen) === 'fuer-wen');
pruefe('aktivePanelId: Unternehmen', nav.aktivePanelId('/partner', regionen) === 'unternehmen' && nav.aktivePanelId('/blog', regionen) === 'unternehmen');
pruefe('aktivePanelId: sonst keine', nav.aktivePanelId('/', regionen) === null && nav.aktivePanelId('/impressum', regionen) === null);

console.log(`\n${ok}/${ok + fehl} bestanden`);
process.exit(fehl ? 1 : 0);
