#!/usr/bin/env node
/**
 * Migriert die regionalContent-Konstante aus WebdesignContent.tsx
 * in JSON-Dateien unter content/leistungen/webdesign-regions/.
 *
 * Plus: extrahiert metaTitle, metaDescription und keywords aus den
 * 12 statischen Spoke-Page-Files unter src/app/(website)/webdesign/<slug>/page.tsx.
 *
 * Wird einmalig ausgefuehrt fuer Welle 5 (Architektur-Migration).
 *
 * Nutzung: node scripts/migrate-webdesign-regions-to-json.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// Regionen mit physischem Standort (eigene Adresse)
const physicalLocations = new Set(['winterthur', 'schaffhausen', 'thurgau']);

// Region-Display-Namen
const regionNames = {
    winterthur: 'Winterthur',
    zuerich: 'Zürich',
    schaffhausen: 'Schaffhausen',
    thurgau: 'Thurgau',
    'st-gallen': 'St. Gallen',
    basel: 'Basel',
    bern: 'Bern',
    luzern: 'Luzern',
    aargau: 'Aargau',
    zug: 'Zug',
    solothurn: 'Solothurn',
    graubuenden: 'Graubünden',
};

// regionalContent aus WebdesignContent.tsx parsen
function parseRegionalContent() {
    const filePath = path.join(root, 'src/components/pages/WebdesignContent.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    const startMarker = 'const regionalContent: Record<string, RegionalData> = {';
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) throw new Error('regionalContent block nicht gefunden');

    const bodyStart = startIdx + startMarker.length;
    let depth = 1;
    let endIdx = bodyStart;
    let inSingle = false, inDouble = false, inBacktick = false;
    let prev = '';
    for (let i = bodyStart; i < content.length; i++) {
        const ch = content[i];
        const isEscaped = prev === '\\';
        if (!isEscaped) {
            if (ch === "'" && !inDouble && !inBacktick) inSingle = !inSingle;
            else if (ch === '"' && !inSingle && !inBacktick) inDouble = !inDouble;
            else if (ch === '`' && !inSingle && !inDouble) inBacktick = !inBacktick;
            else if (!inSingle && !inDouble && !inBacktick) {
                if (ch === '{') depth++;
                else if (ch === '}') {
                    depth--;
                    if (depth === 0) { endIdx = i; break; }
                }
            }
        }
        prev = ch === '\\' && prev === '\\' ? '' : ch;
    }

    const body = content.substring(bodyStart, endIdx);
    return new Function('return {' + body + '}')();
}

// Spoke-Page-Metadata extrahieren (metaTitle, metaDescription, keywords, canonical, areaServed)
function parseSpokePage(slug) {
    const filePath = path.join(root, 'src/app/(website)/webdesign', slug, 'page.tsx');
    if (!fs.existsSync(filePath)) return {};
    const src = fs.readFileSync(filePath, 'utf-8');

    const titleMatch = src.match(/title:\s*'([^']+)'/);
    const descMatch = src.match(/description:\s*'([^']+)'/);
    const keywordsMatch = src.match(/keywords:\s*\[([^\]]+)\]/);
    const canonicalMatch = src.match(/canonical:\s*'([^']+)'/);
    const areaServedMatch = src.match(/\['([^']+(?:'\s*,\s*'[^']+)*)'\]/g);

    let keywords = [];
    if (keywordsMatch) {
        keywords = keywordsMatch[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) ?? [];
    }

    // areaServed ist meist im 3. Argument von generate*SpokeSchema
    let areaServed = [];
    const areaMatch = src.match(/Schema\([^)]*\['([^']+)'(?:,\s*'([^']+)')?\]\)/);
    if (areaMatch) {
        areaServed = areaMatch.slice(1).filter(Boolean);
    }

    return {
        metaTitle: titleMatch?.[1] ?? '',
        metaDescription: descMatch?.[1] ?? '',
        keywords,
        canonicalUrl: canonicalMatch?.[1] ?? '',
        areaServed,
    };
}

const regionalContent = parseRegionalContent();
const slugs = Object.keys(regionalContent).filter(s => s !== 'default');

const outDir = path.join(root, 'content/leistungen/webdesign-regions');
fs.mkdirSync(outDir, { recursive: true });

let created = 0;
for (const slug of slugs) {
    const region = regionalContent[slug];
    const meta = parseSpokePage(slug);

    const json = {
        slug,
        name: regionNames[slug] ?? region.headline.replace('Webdesign ', ''),
        // Hero
        headline: region.headline,
        subheadline: region.subheadline,
        description: region.description,
        intro: region.intro,
        regionalImage: region.regionalImage ?? null,
        // Content-Bloecke
        localBenefits: region.localBenefits ?? [],
        stats: region.stats ?? [],
        localFaq: region.localFaq ?? { question: '', answer: '' },
        localIndustries: region.localIndustries ?? [],
        additionalFaqs: region.additionalFaqs ?? [],
        whyChooseUs: region.whyChooseUs ?? '',
        // SEO
        metaTitle: meta.metaTitle,
        metaDescription: meta.metaDescription,
        keywords: meta.keywords,
        canonicalUrl: meta.canonicalUrl,
        // Schema
        hasPhysicalLocation: physicalLocations.has(slug),
        areaServed: meta.areaServed.length > 0 ? meta.areaServed : [regionNames[slug] ?? slug],
    };

    const outPath = path.join(outDir, `${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
    created++;
    console.log(`OK: ${slug}.json (${region.intro.split(/\s+/).length} Woerter intro)`);
}

console.log(`\n${created} JSON-Files erstellt unter ${outDir}`);
