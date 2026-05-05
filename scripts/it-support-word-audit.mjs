#!/usr/bin/env node
/**
 * IT-Support Spoke Wortzahl-Audit
 * Liest alle JSON-Files unter content/leistungen/it-support-regions/
 * und zaehlt die Unique-Wortanzahl pro Spoke.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const regionsDir = path.resolve(__dirname, '../content/leistungen/it-support-regions');

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
        localFaq: countWords(data.localFaqQuestion) + countWords(data.localFaqAnswer),
        localIndustries: (data.localIndustries || []).reduce(
            (s, ind) => s + countWords(ind.name) + countWords(ind.need),
            0
        ),
        additionalFaqs: (data.additionalFaqs || []).reduce(
            (s, faq) => s + countWords(faq.question) + countWords(faq.answer),
            0
        ),
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

console.log('IT-Support Spoke Wortzahl-Audit');
console.log(`Schwellenwert: ${threshold} Woerter unique pro Spoke`);
console.log('');
console.log('Slug          | Total | Intro | Industries | FAQs | LocalFaq | Status');
console.log('--------------|-------|-------|------------|------|----------|--------');
for (const r of results) {
    const status = r.total >= threshold ? 'OK' : 'ZU DUENN';
    console.log(
        `${r.slug.padEnd(13)} | ${String(r.total).padStart(5)} | ${String(r.intro).padStart(5)} | ${String(r.localIndustries).padStart(10)} | ${String(r.additionalFaqs).padStart(4)} | ${String(r.localFaq).padStart(8)} | ${status}`
    );
}
console.log('');
const okCount = results.filter(r => r.total >= threshold).length;
console.log(`Zusammenfassung: ${okCount} von ${results.length} Spokes ueber Schwelle.`);
