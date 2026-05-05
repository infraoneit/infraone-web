#!/usr/bin/env node
/**
 * Webdesign Spoke Wortzahl-Audit
 *
 * Liest src/components/pages/WebdesignContent.tsx, extrahiert das
 * regionalContent-Object und zaehlt die Unique-Wortanzahl pro Spoke
 * (alle textfuehrenden Felder zusammen, ohne Boilerplate).
 *
 * Nutzung: node scripts/webdesign-word-audit.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, '../src/components/pages/WebdesignContent.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

// regionalContent block extrahieren
const startMarker = 'const regionalContent: Record<string, RegionalData> = {';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
    console.error('regionalContent block nicht gefunden');
    process.exit(1);
}
// Body beginnt nach dem '{' am Ende des startMarker
const bodyStart = startIdx + startMarker.length;

// Klammern matchen, um Body-Ende zu finden
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
                if (depth === 0) {
                    endIdx = i;
                    break;
                }
            }
        }
    }
    prev = ch === '\\' && prev === '\\' ? '' : ch;
}

const body = content.substring(bodyStart, endIdx);

// Body als JS-Object via Function eval
const objectLiteral = '{' + body + '}';
let regionalContent;
try {
    // eslint-disable-next-line no-new-func
    regionalContent = new Function('return ' + objectLiteral)();
} catch (e) {
    console.error('Eval fehlgeschlagen:', e.message);
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

const slugs = Object.keys(regionalContent).filter(s => s !== 'default');
const results = slugs.map(slug => ({ slug, ...auditRegion(slug, regionalContent[slug]) }));

// Sortiert nach Total absteigend
results.sort((a, b) => b.total - a.total);

const threshold = 600;

console.log('Webdesign Spoke Wortzahl-Audit');
console.log('Schwellenwert: ' + threshold + ' Woerter unique pro Spoke');
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
