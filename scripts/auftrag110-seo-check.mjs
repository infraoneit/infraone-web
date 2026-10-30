#!/usr/bin/env node
/**
 * auftrag110-seo-check.mjs (AUFTRAG-110) — SEO-Prüfung des Bereichs /ki-telefonassistent
 * gegen einen laufenden Produktions-Server (nach `npm run build`, `next start -p 3102`).
 *
 * Je Seite aus src/components/ki-telefonassistent/seiten.ts:
 * - HTTP 200, genau eine H1, sichtbare Brotkrumen (ausser Hub)
 * - <title> ≤ 60 Zeichen, Beschreibung 120–155 Zeichen, canonical = https://infraone.ch + Pfad
 * - OpenGraph (og:title, og:description, og:url = canonical, og:image)
 * - robots: /preise noindex, solange PREISE_FREIGEGEBEN = false; sonst nirgends noindex
 * - JSON-LD parsebar; WebPage + BreadcrumbList je Seite; Service + FAQPage auf dem Hub,
 *   FAQPage auf /faq, HowTo auf /so-funktioniert-es; kein zusätzliches Organization-Objekt
 * - Wortzahl im <main> (Pflicht ≥ 600), Ehrlichkeits-Stichwörter (kein ß, keine Superlative/Prozentversprechen)
 * - Entwurfsband auf /preise und Hub, solange die Preise nicht freigegeben sind
 * Danach: alle internen Links aller geprüften Seiten → Status 200 (Weiterleitungen gefolgt),
 * Anker (#id) auf Seiten des Bereichs vorhanden, Sitemap enthält alle Seiten (ohne /preise im Entwurf).
 *
 *   BASE_URL=http://localhost:3102 node scripts/auftrag110-seo-check.mjs
 *
 * Node ≥ 22.18 (Type-Stripping für die .ts-Quellen).
 */
import { registerHooks } from 'node:module';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
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
const { KI_SEITEN, KI_BASIS, KI_PREISE_PFAD } = await import(pathToFileURL(path.join(ROOT, 'src/components/ki-telefonassistent/seiten.ts')).href);
const { PREISE_FREIGEGEBEN } = await import(pathToFileURL(path.join(ROOT, 'src/lib/ki-telefonassistent-preise.ts')).href);

const BASE = (process.env.BASE_URL || 'http://localhost:3102').replace(/\/$/, '');
const DOMAIN = 'https://infraone.ch';
/** Optionale Seiten aus Abschnitt 2 (O) — Wortzahl nur berichten */
const OPTIONAL = new Set([`${KI_BASIS}/glossar`, `${KI_BASIS}/anwendungen/notfall`]);

let ok = 0;
let fehl = 0;
const fehler = [];
function pruefe(name, bedingung, detail = '') {
    if (bedingung) ok++;
    else {
        fehl++;
        fehler.push(`${name}${detail ? ' — ' + detail : ''}`);
    }
    if (!bedingung || process.env.VERBOSE) console.log(`${bedingung ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

function dekodiere(s) {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&nbsp;|&#160;/g, ' ')
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function meta(html, attr, wert) {
    const re = new RegExp(`<meta[^>]*${attr}="${wert.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i');
    const tag = html.match(re)?.[0];
    if (!tag) return null;
    const c = tag.match(/content="([^"]*)"/i);
    return c ? dekodiere(c[1]) : null;
}

function mainText(html) {
    const m = html.match(/<main[\s>][\s\S]*?<\/main>/i);
    const roh = m ? m[0] : '';
    return dekodiere(
        roh
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
            .replace(/<[^>]+>/g, ' '),
    )
        .replace(/\s+/g, ' ')
        .trim();
}

function woerter(text) {
    return text.split(' ').filter((w) => /[A-Za-zÀ-ÿ]/.test(w)).length;
}

function jsonLd(html) {
    const bloecke = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    const objekte = [];
    const kaputt = [];
    for (const b of bloecke) {
        try {
            objekte.push(JSON.parse(b));
        } catch (e) {
            kaputt.push(String(e).slice(0, 120));
        }
    }
    return { objekte, kaputt };
}

const typen = (objekte) => objekte.flatMap((o) => (Array.isArray(o) ? o : [o])).map((o) => o['@type']).flat();

async function hole(url) {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'InfraOne-A110-SEO-Check' } });
    return { status: r.status, url: r.url, html: await r.text() };
}

const VERBOTEN = [
    [/ß/, 'ß statt ss'],
    [/\b(garantiert|marktführer\w*|weltklasse|unschlagbar|nr\.?\s*1\b|erster anbieter|einzige[rn]? anbieter)/i, 'Superlativ/Alleinstellung'],
    [/\b\d+\s*%\s*(weniger|mehr|günstiger|ersparnis|sparen|schneller)/i, 'Prozentversprechen'],
    [/\b(\d{2,})\s*\+?\s*(zufriedene\s+)?kunden\b/i, 'Kundenzahl (nur «rund 100 KMU» erlaubt)'],
    [/\b48\s*stunden\b|\binnert\s+\d+\s*(stunden|tagen|minuten)\b/i, 'unbelegte Zeitangabe'],
    [/\bin\s+\d+\s*sekunden\b/i, 'Antwortzeit in Sekunden'],
];

const ergebnisse = [];
const alleLinks = new Map(); // pfad -> Set(quelle)
const seitenHtml = new Map();

console.log(`AUFTRAG-110 SEO-Check gegen ${BASE} · Preise freigegeben: ${PREISE_FREIGEGEBEN}\n`);

for (const s of KI_SEITEN) {
    const url = `${BASE}${s.pfad}`;
    const name = s.pfad;
    let r;
    try {
        r = await hole(url);
    } catch (e) {
        pruefe(`${name}: erreichbar`, false, String(e));
        continue;
    }
    pruefe(`${name}: HTTP 200`, r.status === 200, String(r.status));
    const html = r.html;
    seitenHtml.set(s.pfad, html);

    const h1 = (html.match(/<h1[\s>]/gi) || []).length;
    pruefe(`${name}: genau eine H1`, h1 === 1, `${h1} H1`);

    const titel = dekodiere(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
    pruefe(`${name}: Titel ≤ 60 Zeichen`, titel.length > 0 && titel.length <= 60, `${titel.length}: ${titel}`);

    const beschreibung = meta(html, 'name', 'description') ?? '';
    pruefe(`${name}: Beschreibung 120–155 Zeichen`, beschreibung.length >= 120 && beschreibung.length <= 155, `${beschreibung.length}`);

    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1] ?? html.match(/<link[^>]*href="([^"]+)"[^>]*rel="canonical"/i)?.[1] ?? '';
    pruefe(`${name}: canonical`, canonical === `${DOMAIN}${s.pfad}`, canonical);

    const og = { titel: meta(html, 'property', 'og:title'), beschreibung: meta(html, 'property', 'og:description'), url: meta(html, 'property', 'og:url'), bild: meta(html, 'property', 'og:image') };
    pruefe(`${name}: OpenGraph vollständig`, !!og.titel && !!og.beschreibung && og.url === `${DOMAIN}${s.pfad}` && !!og.bild, JSON.stringify(og).slice(0, 160));

    const robots = meta(html, 'name', 'robots') ?? '';
    const sollNoindex = s.pfad === KI_PREISE_PFAD && !PREISE_FREIGEGEBEN;
    pruefe(`${name}: robots ${sollNoindex ? 'noindex' : 'indexierbar'}`, sollNoindex ? /noindex/i.test(robots) : !/noindex/i.test(robots), robots || '(kein robots-meta)');

    const { objekte, kaputt } = jsonLd(html);
    pruefe(`${name}: JSON-LD parsebar`, kaputt.length === 0 && objekte.length > 0, kaputt.join(' | ') || `${objekte.length} Blöcke`);
    const t = typen(objekte);
    pruefe(`${name}: WebPage + BreadcrumbList`, t.includes('WebPage') && t.includes('BreadcrumbList'), t.join(','));
    const krumen = objekte.find((o) => o['@type'] === 'BreadcrumbList');
    const letzte = krumen?.itemListElement?.at(-1)?.item;
    pruefe(`${name}: Brotkrumen enden auf der Seite`, letzte === `${DOMAIN}${s.pfad}`, String(letzte));
    pruefe(`${name}: kein zusätzliches Organization-Objekt`, !t.includes('Organization') && t.filter((x) => x === 'LocalBusiness').length === 1, t.join(','));
    if (s.pfad === KI_BASIS) pruefe(`${name}: Service + FAQPage`, t.includes('Service') && t.includes('FAQPage'), t.join(','));
    if (s.pfad === `${KI_BASIS}/faq`) {
        const faq = objekte.find((o) => o['@type'] === 'FAQPage');
        pruefe(`${name}: FAQPage mit ≥ 15 Fragen`, (faq?.mainEntity?.length ?? 0) >= 15, String(faq?.mainEntity?.length));
    }
    if (s.pfad === `${KI_BASIS}/so-funktioniert-es`) pruefe(`${name}: HowTo`, t.includes('HowTo'), t.join(','));
    if (![KI_BASIS, `${KI_BASIS}/faq`].includes(s.pfad)) pruefe(`${name}: FAQPage nur auf Hub und /faq`, !t.includes('FAQPage'), t.join(','));
    if (s.pfad !== KI_BASIS) pruefe(`${name}: sichtbare Brotkrumen`, /aria-label="Brotkrumen"/.test(html));

    const text = mainText(html);
    const w = woerter(text);
    if (!OPTIONAL.has(s.pfad)) pruefe(`${name}: ≥ 600 Wörter im <main>`, w >= 600, `${w} Wörter`);
    for (const [re, was] of VERBOTEN) {
        const m = text.match(re);
        pruefe(`${name}: Ehrlichkeit (${was})`, !m, m ? `«${m[0]}»` : '');
    }

    const brauchtBand = !PREISE_FREIGEGEBEN && (s.pfad === KI_PREISE_PFAD || s.pfad === KI_BASIS);
    if (brauchtBand) pruefe(`${name}: Entwurfsband sichtbar im HTML`, /data-entwurf="preise"/.test(html) && /Entwurf, Preise noch nicht freigegeben/.test(html));
    if (s.pfad === KI_BASIS) pruefe(`${name}: Live-Widget eingebettet`, /id="ki-demo-url"/.test(html));

    for (const m of html.matchAll(/<a[^>]*href="(\/[^"]*)"/gi)) {
        const href = dekodiere(m[1]);
        if (href.startsWith('//')) continue;
        if (!alleLinks.has(href)) alleLinks.set(href, new Set());
        alleLinks.get(href).add(s.pfad);
    }

    ergebnisse.push({ pfad: s.pfad, titel, titelLaenge: titel.length, beschreibungLaenge: beschreibung.length, woerter: w, jsonLd: t.join(','), robots });
}

/* ---------------- interne Links ---------------- */
const pfade = new Map(); // ohne Anker → Status
for (const href of alleLinks.keys()) {
    const ohneAnker = href.split('#')[0] || '/';
    if (pfade.has(ohneAnker)) continue;
    try {
        const r = await fetch(`${BASE}${ohneAnker}`, { redirect: 'follow' });
        pfade.set(ohneAnker, r.status);
        if (!seitenHtml.has(ohneAnker) && r.status === 200 && ohneAnker.startsWith(KI_BASIS)) seitenHtml.set(ohneAnker, await r.text());
    } catch (e) {
        pfade.set(ohneAnker, String(e));
    }
}
const kaputt = [...pfade].filter(([, st]) => st !== 200);
pruefe(`interne Links: ${pfade.size} Ziele, alle 200`, kaputt.length === 0, kaputt.map(([p, st]) => `${p} → ${st} (von ${[...alleLinks].filter(([h]) => (h.split('#')[0] || '/') === p).flatMap(([, q]) => [...q]).slice(0, 2).join(', ')})`).join(' | '));

// Anker auf Seiten des Bereichs und der Datenschutzseite
const ankerFehlen = [];
for (const href of alleLinks.keys()) {
    const [p, anker] = href.split('#');
    if (!anker) continue;
    let html = seitenHtml.get(p);
    if (!html && (p.startsWith(KI_BASIS) || p === '/datenschutz')) {
        html = (await hole(`${BASE}${p}`)).html;
        seitenHtml.set(p, html);
    }
    if (html && !new RegExp(`id="${anker}"`).test(html)) ankerFehlen.push(href);
}
pruefe('Anker-Ziele vorhanden', ankerFehlen.length === 0, ankerFehlen.join(', '));

/* ---------------- Sitemap ---------------- */
const sitemap = (await hole(`${BASE}/sitemap.xml`)).html;
const inSitemap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
const sollInSitemap = KI_SEITEN.filter((s) => PREISE_FREIGEGEBEN || s.pfad !== KI_PREISE_PFAD).map((s) => `${DOMAIN}${s.pfad}`);
const fehltInSitemap = sollInSitemap.filter((u) => !inSitemap.has(u));
pruefe(`Sitemap enthält alle ${sollInSitemap.length} indexierbaren Seiten`, fehltInSitemap.length === 0, fehltInSitemap.join(', '));
if (!PREISE_FREIGEGEBEN) pruefe('Sitemap ohne /preise (noindex im Entwurf)', !inSitemap.has(`${DOMAIN}${KI_PREISE_PFAD}`));

/* ---------------- Ausgabe ---------------- */
console.log('\nSeite | Titel (Länge) | Beschreibung | Wörter | JSON-LD');
for (const e of ergebnisse) console.log(`${e.pfad} | ${e.titel} (${e.titelLaenge}) | ${e.beschreibungLaenge} | ${e.woerter} | ${e.jsonLd}`);
console.log(`\n${ok}/${ok + fehl} Prüfungen bestanden${fehl ? ` — ${fehl} FEHLER` : ''}`);
if (fehler.length) console.log('Fehler:\n- ' + fehler.join('\n- '));

const aus = process.env.A110_JSON;
if (aus) {
    if (!existsSync(path.dirname(aus))) mkdirSync(path.dirname(aus), { recursive: true });
    writeFileSync(aus, JSON.stringify({ base: BASE, preiseFreigegeben: PREISE_FREIGEGEBEN, ok, fehl, fehler, seiten: ergebnisse, links: Object.fromEntries(pfade) }, null, 2));
}
process.exit(fehl ? 1 : 0);
