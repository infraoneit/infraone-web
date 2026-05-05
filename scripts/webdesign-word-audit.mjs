#!/usr/bin/env node
/**
 * Webdesign Spoke Wortzahl-Audit
 *
 * Liest alle JSON-Files unter content/leistungen/webdesign-regions/
 * und zaehlt die Unique-Wortanzahl pro Spoke (alle textfuehrenden Felder
 * zusammen, ohne Boilerplate aus der Komponente).
 *
 * Hinweis: Die Boilerplate-Sektionen (Pakete, Plattformen, Hub-FAQs,
 * Referenzen) sind nicht hier gezaehlt; sie sind in der Komponente fix
 * und auf Spokes durch die isHubPage-Differenzierung reduziert.
 *
 * Nutzung: node scripts/webdesign-word-audit.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const regionsDir = path.resolve(__dirname, '../content/leistungen/webdesign-regions');

if (!fs.existsSync(regionsDir)) {
    console.error(`Verzeichnis nicht gefunden: ${regionsDir}`);
    process.exit(1);
}

const countWords = (str) => {
    if (!str || typeof str !== 'string') return 0;
    return str.trim().split(/\s+/).filter(w => w.length > 0).length;
};

const auditRegion = (slug, data) => {
    const fields = {
        headline: countWords(data.headline),
        subheadline: countWords(data.subheadline),
        description: countWords(data.description),
        intro: countWords(data.intro),
        localBenefits: (data.localBenefits || []).reduce((s, b) => s + countWords(b), 0),
        stats: (data.stats || []).reduce((s, st) => s + countWords(st.label) + countWords(st.value), 0),
        localFaq: countWords(data.localFaq?.question) + countWords(data.localFaq?.answer),
        localIndustries: (data.localIndustries || []).reduce(
            (s, ind) => s + countWords(ind.name) + countWords(ind.description) + countWords(ind.websiteNeeds),
            0
        ),
        additionalFaqs: (data.additionalFaqs || []).reduce(
            (s, faq) => s + countWords(faq.question) + countWords(faq.answer),
            0
        ),
        whyChooseUs: countWords(data.whyChooseUs),
    };
    fields.total = Object.values(fields).reduce((s, n) => s + n, 0);
    return fields;
};

const files = fs.readdirSync(regionsDir).filter(f => f.endsWith('.json'));
const results = files.map(file => {
    const slug = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(regionsDir, file), 'utf-8'));
    return { slug, ...auditRegion(slug, data) };
});

results.sort((a, b) => b.total - a.total);

const threshold = 600;

console.log('Webdesign Spoke Wortzahl-Audit (JSON-basiert)');
console.log(`Schwellenwert: ${threshold} Woerter unique pro Spoke`);
console.log('');
console.log('Slug          | Total | Intro | WhyUs | Industries | FAQs | LocalFaq | Status');
console.log('--------------|-------|-------|-------|------------|------|----------|--------');

for (const r of results) {
    const status = r.total >= threshold ? 'OK' : 'ZU DUENN';
    const slugCol = r.slug.padEnd(13);
    console.log(
        `${slugCol} | ${String(r.total).padStart(5)} | ${String(r.intro).padStart(5)} | ${String(r.whyChooseUs).padStart(5)} | ${String(r.localIndustries).padStart(10)} | ${String(r.additionalFaqs).padStart(4)} | ${String(r.localFaq).padStart(8)} | ${status}`
    );
}

console.log('');
const okCount = results.filter(r => r.total >= threshold).length;
const thinCount = results.length - okCount;
console.log(`Zusammenfassung: ${okCount} von ${results.length} Spokes sind OK, ${thinCount} unter Schwelle.`);
