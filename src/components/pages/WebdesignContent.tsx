'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Code, Rocket, Palette, Star, ExternalLink, ChevronDown, Blocks, FileCode, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { useState } from 'react';

// Pricing packages
const packages = [
    {
        name: 'Starter',
        price: 'CHF 990',
        description: 'Perfekt für Startups und Kleinunternehmen',
        platforms: 'Wix / WordPress / Next.js',
        features: [
            'Bis zu 5 Seiten',
            'Responsive Design',
            'Kontaktformular',
            'SEO-Grundoptimierung',
            'SSL-Zertifikat',
            '3 Monate Support',
        ],
        popular: false,
    },
    {
        name: 'KMU',
        price: 'CHF 2\'490',
        description: 'Für etablierte Unternehmen',
        platforms: 'Wix / WordPress / Next.js',
        features: [
            'Bis zu 15 Seiten',
            'Individuelles Design',
            'Blog-Funktion',
            'Erweiterte SEO',
            'Google Analytics',
            'Newsletter-Integration',
            'Social Media Anbindung',
            '6 Monate Support',
        ],
        popular: true,
    },
    {
        name: 'Pro',
        price: 'CHF 4\'990',
        description: 'Maximale Performance & Kontrolle',
        platforms: 'Next.js + Keystatic CMS',
        features: [
            'Unbegrenzte Seiten',
            'Headless CMS',
            'Maximale Performance',
            'Vollständige SEO',
            'Custom Entwicklung',
            'API-Integration',
            'Multi-Language',
            '12 Monate Support',
        ],
        popular: false,
    },
];

// References
const references = [
    {
        name: 'Schaltkraft AG',
        url: 'https://schaltkraft.ch',
        description: 'Elektroinstallationen & Gebäudetechnik',
        quote: 'Die neue Website hat unsere Online-Sichtbarkeit massiv verbessert. Professionell, schnell und immer erreichbar.',
        author: 'Thomas Müller',
        role: 'Geschäftsführer',
    },
    {
        name: 'Elektro-Tel AG',
        url: 'https://elektro-tel.ch',
        description: 'Elektro & Telekommunikation',
        quote: 'Von der Beratung bis zur Umsetzung alles aus einer Hand. Das Keystatic CMS ist kinderleicht zu bedienen.',
        author: 'Marco Weber',
        role: 'Inhaber',
    },
    {
        name: 'Höppli Architektur AG',
        url: 'https://winterthur-architekten.ch',
        description: 'Architektur & Planung Winterthur',
        quote: 'Moderne Website, die unsere Projekte perfekt präsentiert. Die Ladezeiten sind unglaublich schnell.',
        author: 'Andrea Höppli',
        role: 'Geschäftsführerin',
    },
];

// Platforms
const platforms = [
    {
        name: 'Wix',
        icon: <Blocks className="w-8 h-8" />,
        description: 'Der einfache Einstieg',
        forWhom: 'Ideal für Startups, Freelancer und kleine Unternehmen, die schnell online sein wollen.',
        pros: [
            'Schnelle Umsetzung',
            'Einfache Bedienung',
            'Günstige Wartung',
            'Viele Vorlagen',
        ],
        cons: ['Begrenzte Anpassung', 'Weniger SEO-Kontrolle'],
    },
    {
        name: 'WordPress',
        icon: <FileCode className="w-8 h-8" />,
        description: 'Der bewährte Klassiker',
        forWhom: 'Für KMU, die Flexibilität und viele Erweiterungen benötigen.',
        pros: [
            'Riesiges Plugin-System',
            'Bewährte Technologie',
            'Viele Designer kennen es',
            'Blog-Funktionen',
        ],
        cons: ['Regelmässige Updates nötig', 'Kann langsam werden'],
    },
    {
        name: 'Next.js + Keystatic',
        icon: <Zap className="w-8 h-8" />,
        description: 'Die Zukunft des Webs',
        forWhom: 'Für Unternehmen, die maximale Performance, Sicherheit und SEO wollen.',
        pros: [
            'Blitzschnelle Ladezeiten',
            'Maximale SEO-Performance',
            'Höchste Sicherheit',
            'Einfaches CMS',
            'Keine Wartung nötig',
        ],
        cons: ['Höhere Initialkosten'],
        highlight: true,
    },
];

// FAQs
const faqs = [
    {
        question: 'Wie lange dauert die Erstellung einer Website?',
        answer: 'Je nach Umfang zwischen 2-8 Wochen. Eine Starter-Website kann in 2 Wochen live sein, komplexere Projekte benötigen entsprechend mehr Zeit.',
    },
    {
        question: 'Was kostet die monatliche Wartung?',
        answer: 'Bei Wix und WordPress fallen Hosting- und Wartungskosten von ca. CHF 20-50/Monat an. Next.js-Websites sind wartungsfrei und kosten nur das Hosting (ab CHF 10/Monat).',
    },
    {
        question: 'Kann ich die Website selbst bearbeiten?',
        answer: 'Ja! Bei allen Plattformen erhalten Sie Zugang zu einem CMS. Besonders einfach ist Keystatic – hier können Sie Texte und Bilder direkt im Browser bearbeiten.',
    },
    {
        question: 'Ist meine Website für Suchmaschinen optimiert?',
        answer: 'Ja, SEO ist bei allen Paketen inklusive. Bei Pro-Websites mit Next.js erreichen wir die bestmöglichen Lighthouse-Scores.',
    },
    {
        question: 'Was passiert nach dem Go-Live?',
        answer: 'Sie erhalten Support gemäss Ihrem Paket (3-12 Monate). Danach bieten wir günstige Wartungsverträge an.',
    },
];

// Regional content with unique SEO text
interface LocalIndustry {
    name: string;
    description: string;
    websiteNeeds: string;
}

interface RegionalData {
    headline: string;
    subheadline: string;
    description: string;
    intro: string;
    localBenefits: string[];
    stats: { label: string; value: string }[];
    localFaq: { question: string; answer: string };
    regionalImage: string;
    // New fields for unique content
    localIndustries?: LocalIndustry[];
    additionalFaqs?: { question: string; answer: string }[];
    whyChooseUs?: string;
}

const regionalContent: Record<string, RegionalData> = {
    default: {
        headline: 'Webdesign Schweiz',
        subheadline: 'Moderne Websites für Schweizer Unternehmen',
        description: 'Von der einfachen Visitenkarte bis zur komplexen Web-Applikation – wir designen und entwickeln Websites, die überzeugen und verkaufen.',
        intro: 'Die Schweiz ist ein Land der KMU. Über 99% aller Unternehmen sind kleine und mittlere Betriebe, die das Rückgrat unserer Wirtschaft bilden. Genau für diese Unternehmen entwickeln wir Websites: pragmatisch, bezahlbar und mit echtem Mehrwert. Unser Team in Winterthur betreut Kunden in der gesamten Deutschschweiz – persönlich und auf Augenhöhe.',
        localBenefits: ['Schweizer Qualität', 'Persönliche Betreuung', 'Faire Preise', 'Schnelle Umsetzung'],
        stats: [{ label: 'Projekte', value: '150+' }, { label: 'Zufriedene Kunden', value: '98%' }],
        localFaq: { question: 'Betreuen Sie auch Kunden ausserhalb der Deutschschweiz?', answer: 'Ja, wir arbeiten remote mit Kunden in der ganzen Schweiz zusammen. Persönliche Treffen sind in den meisten Fällen nicht nötig.' },
        regionalImage: '/images/webdesign-hero.png',
    },
    winterthur: {
        headline: 'Webdesign Winterthur',
        subheadline: 'Ihr lokaler Webdesign-Partner in der Eulachstadt',
        description: 'Als Winterthurer Agentur mit Büro in der Altstadt kennen wir den lokalen Markt wie unsere eigene Tasche. Von der Marktgasse bis zum Sulzer-Areal.',
        intro: 'Winterthur ist nicht nur die sechstgrösste Stadt der Schweiz, sondern auch ein dynamischer Wirtschaftsstandort mit über 45\'000 Arbeitsplätzen. Vom Tech-Startup im Technopark bis zum traditionsreichen Handwerksbetrieb in Töss – wir verstehen die Bedürfnisse der lokalen Wirtschaft. Unser Büro liegt zentral in Winterthur, was persönliche Treffen jederzeit möglich macht. Ob Sie einen neuen Online-Shop für Ihr Geschäft an der Stadthausstrasse benötigen oder eine moderne Präsenz für Ihre Praxis in Seen – wir sind Ihr Partner vor Ort.',
        localBenefits: ['Büro in Winterthur', 'Persönliche Treffen möglich', 'Kennen den lokalen Markt', 'Schneller Support'],
        stats: [{ label: 'Winterthurer Kunden', value: '45+' }, { label: 'Jahre Erfahrung', value: '8+' }],
        localFaq: { question: 'Kann ich bei Ihnen im Büro vorbeikommen?', answer: 'Ja, sehr gerne! Unser Büro befindet sich in der Winterthurer Altstadt. Vereinbaren Sie einfach einen Termin für ein kostenloses Erstgespräch bei einem Kaffee.' },
        regionalImage: '/images/regions/winterthur.png',
        localIndustries: [
            { name: 'Maschinenbau & Industrie', description: 'Winterthur hat eine stolze Industriegeschichte. Vom Sulzer-Areal bis zum Technopark sind hier innovative Unternehmen zu Hause.', websiteNeeds: 'Technische Produktpräsentationen, B2B-Fokus, Mehrsprachigkeit' },
            { name: 'Gesundheit & Praxen', description: 'Zahlreiche Arztpraxen, Therapiezentren und Gesundheitsdienstleister in Winterthur benötigen professionelle Online-Präsenzen.', websiteNeeds: 'Online-Terminbuchung, vertrauenswürdiges Design, DSGVO-konform' },
            { name: 'Einzelhandel & Gastronomie', description: 'Die lebendige Altstadt und das Einkaufszentrum Rosenberg bieten vielfältige Retail- und Gastro-Angebote.', websiteNeeds: 'Online-Shop, Speisekarten, Öffnungszeiten, Google Maps Integration' },
        ],
        additionalFaqs: [
            { question: 'Muss ich für die Website-Erstellung persönlich vorbeikommen?', answer: 'Nein, der gesamte Prozess kann 100% remote ablaufen. Wir arbeiten mit Videocalls, geteilten Dokumenten und Online-Feedback-Tools. Persönliche Treffen sind natürlich jederzeit möglich – unser Büro ist nur wenige Gehminuten von der Altstadt entfernt.' },
            { question: 'Wie lange dauert ein Website-Projekt in Winterthur?', answer: 'Eine Standard-Website ist in 2-4 Wochen live. Für komplexere Projekte mit Online-Shop oder individueller Entwicklung planen wir 6-8 Wochen ein. Dank unserer lokalen Präsenz können wir bei dringenden Anpassungen schnell reagieren.' },
        ],
        whyChooseUs: 'Als echte Winterthurer Agentur verstehen wir die lokalen Bedürfnisse besser als eine anonyme Grossagentur aus Zürich. Wir kennen die Stadt, die Branchen und die Menschen. Das macht den Unterschied.',
    },
    zuerich: {
        headline: 'Webdesign Zürich',
        subheadline: 'Premium-Websites für die Wirtschaftsmetropole',
        description: 'Zürich ist das wirtschaftliche Herz der Schweiz. Hier brauchen Sie eine Website, die Ihre Professionalität widerspiegelt – schnell, modern und überzeugend.',
        intro: 'Als grösste Stadt der Schweiz ist Zürich der wichtigste Wirtschaftsstandort des Landes. Über 400\'000 Einwohner und mehr als 500\'000 Arbeitsplätze machen die Limmatstadt zu einem hochkompetitiven Markt. Hier zählt der erste Eindruck besonders. Ihre Website muss auf Anhieb überzeugen – technisch einwandfrei, optisch ansprechend und inhaltlich auf den Punkt. Wir betreuen Zürcher Unternehmen vom Kreis 1 bis Oerlikon, von Startups an der Europaallee bis zu etablierten KMU in den Aussenbezirken.',
        localBenefits: ['Erfahrung mit Zürcher KMU', 'Verständnis für hohe Ansprüche', 'Kurze Wege von Winterthur', 'Professionelle Umsetzung'],
        stats: [{ label: 'Zürcher Projekte', value: '30+' }, { label: 'Durchschn. Lighthouse Score', value: '95+' }],
        localFaq: { question: 'Bieten Sie auch Vor-Ort-Termine in Zürich an?', answer: 'Selbstverständlich. Von unserem Büro in Winterthur sind wir in 20 Minuten bei Ihnen in Zürich – oder wir treffen uns an einem neutralen Ort.' },
        regionalImage: '/images/regions/zuerich.png',
        localIndustries: [
            { name: 'Finanzdienstleistungen', description: 'Zürich ist Europas führender Finanzplatz. Banken, Vermögensverwalter und FinTechs prägen die Wirtschaft.', websiteNeeds: 'Vertrauenswürdiges Design, Compliance-konform, mehrsprachig, sichere Formulare' },
            { name: 'Kreativwirtschaft & Agenturen', description: 'Vom Seefeld bis Kreis 5 – Zürich beherbergt eine lebendige Kreativszene mit Agenturen und Freelancern.', websiteNeeds: 'Portfolio-Präsentation, visueller Impact, schnelle Ladezeiten' },
            { name: 'Tech & Startups', description: 'Die ETH-Nähe und Googles Präsenz machen Zürich zum Tech-Hub. Startups brauchen agile digitale Lösungen.', websiteNeeds: 'Modernes Design, Skalierbarkeit, Integration mit SaaS-Tools' },
        ],
        additionalFaqs: [
            { question: 'Muss ich für Besprechungen nach Winterthur kommen?', answer: 'Nein, wir arbeiten zu 100% remote wenn gewünscht. Alternativ treffen wir uns gerne in Zürich – die S-Bahn braucht nur 20 Minuten.' },
            { question: 'Verstehen Sie die hohen Ansprüche des Zürcher Marktes?', answer: 'Absolut. Wir haben für Zürcher Unternehmen aus der Finanz-, Tech- und Kreativbranche gearbeitet. Wir wissen, dass hier höchste Qualität erwartet wird.' },
        ],
        whyChooseUs: 'Als Agentur aus der Region bieten wir Zürcher Qualität zu faireren Preisen – ohne die Überkopfkosten einer Bahnhofstrasse-Agentur.',
    },
    schaffhausen: {
        headline: 'Webdesign Schaffhausen',
        subheadline: 'Websites für die Munot-Stadt und Region',
        description: 'Schaffhausen verbindet Geschichte mit Innovation. Genau diesen Anspruch setzen wir auch in Ihrem Webdesign um – zeitlos modern und dennoch bodenständig.',
        intro: 'Der Kanton Schaffhausen ist klein, aber fein. Mit rund 83\'000 Einwohnern bietet die Region einen übersichtlichen, aber aktiven Wirtschaftsraum. Von industriellen Grossbetrieben über den Weinbau bis hin zu spezialisierten Dienstleistern – Schaffhauser Unternehmen zeichnen sich durch Qualität und Tradition aus. Unser Standort in Schaffhausen ermöglicht uns, lokale Kunden persönlich zu betreuen. Wir kennen die Besonderheiten der Region und wissen, was Schaffhauser Kunden von einer Website erwarten.',
        localBenefits: ['Standort in Schaffhausen', 'Lokales Netzwerk', 'Persönliche Betreuung', 'Regionale Referenzen'],
        stats: [{ label: 'Schaffhauser Kunden', value: '15+' }, { label: 'Weiterempfehlungsrate', value: '100%' }],
        localFaq: { question: 'Haben Sie Erfahrung mit lokalen Branchen wie Weinbau oder Industrie?', answer: 'Ja, wir haben bereits mehrere Websites für Schaffhauser Weingüter und Industriebetriebe erstellt. Wir verstehen die Anforderungen dieser Branchen.' },
        regionalImage: '/images/regions/schaffhausen.png',
        localIndustries: [
            { name: 'Industrie & Produktion', description: 'Von SIG über Georg Fischer bis zu spezialisierten Zulieferern – Schaffhausen hat eine starke industrielle Basis.', websiteNeeds: 'B2B-Kommunikation, technische Produktkataloge, Karriereseiten' },
            { name: 'Weinbau & Landwirtschaft', description: 'Das Schaffhauser Blauburgunderland ist bekannt für exzellente Weine. Weingüter brauchen ansprechende Online-Auftritte.', websiteNeeds: 'Emotionales Storytelling, Online-Shop, Veranstaltungskalender' },
            { name: 'Tourismus & Freizeit', description: 'Rheinfall, Munot und Altstadt ziehen Besucher an. Lokale Anbieter brauchen attraktive digitale Präsenzen.', websiteNeeds: 'Mehrsprachigkeit, Buchungssysteme, Mobile-first Design' },
        ],
        additionalFaqs: [
            { question: 'Können Sie Websites für Weingüter mit Online-Shop erstellen?', answer: 'Ja, wir haben bereits mehrere Wein-Online-Shops umgesetzt. Dabei berücksichtigen wir die speziellen Anforderungen wie Versandbedingungen und Altersverifikation.' },
            { question: 'Arbeiten Sie auch mit deutschen Kunden in der Grenznähe?', answer: 'Selbstverständlich. Wir betreuen auch Kunden aus dem nahen Süddeutschland. Die Währungsumrechnung und DSGVO-Konformität beherrschen wir.' },
        ],
        whyChooseUs: 'Als regionale Agentur mit echtem Schaffhauser Bezug verstehen wir die lokale Mentalität: bodenständig, qualitätsbewusst und mit Blick fürs Wesentliche.',
    },
    thurgau: {
        headline: 'Webdesign Thurgau',
        subheadline: 'Digitale Präsenz für den Apfelkanton',
        description: 'Vom Bodensee bis zu den Voralpenhängen – wir betreuen Thurgauer Unternehmen in Frauenfeld, Kreuzlingen, Weinfelden und der gesamten Region.',
        intro: 'Der Thurgau ist bekannt für seine Landwirtschaft, aber auch für innovative Unternehmen und einen starken Tourismus am Bodensee. Mit über 280\'000 Einwohnern und einer vielfältigen Wirtschaftsstruktur bietet der Kanton zahlreiche Chancen für digitale Präsenz. Ob Landgasthof in Münchwilen, IT-Unternehmen in Amriswil oder Handwerksbetrieb in Sirnach – wir verstehen die Bedürfnisse der Thurgauer Wirtschaft. Von unserem Standort in der Region sind wir schnell bei Ihnen vor Ort.',
        localBenefits: ['Regionale Präsenz', 'Kenntnis der lokalen Wirtschaft', 'Tourismus-Erfahrung', 'Kurze Anfahrt'],
        stats: [{ label: 'Thurgauer Projekte', value: '20+' }, { label: 'Ø Reaktionszeit', value: '< 4h' }],
        localFaq: { question: 'Haben Sie Erfahrung mit Tourismus-Websites am Bodensee?', answer: 'Ja, wir haben bereits mehrere Hotel- und Gastro-Websites in der Bodenseeregion umgesetzt. Mobile-Optimierung und Buchungssysteme sind unsere Stärke.' },
        regionalImage: '/images/regions/thurgau.png',
        localIndustries: [
            { name: 'Hotellerie & Gastronomie', description: 'Die Bodenseeregion lebt vom Tourismus. Hotels, Restaurants und Freizeitanbieter brauchen ansprechende digitale Auftritte.', websiteNeeds: 'Buchungssysteme, Bildergalerien, Speisekarten, mehrsprachig (DE/EN)' },
            { name: 'Landwirtschaft & Direktvermarktung', description: 'Mostereien, Hofläden und Obstbauern verkaufen direkt an Endkunden. E-Commerce wird immer wichtiger.', websiteNeeds: 'Online-Shop, Produktkatalog, Liefergebiete, saisonale Angebote' },
            { name: 'Gewerbe & Handwerk', description: 'Vom Schreiner in Frauenfeld bis zum Elektriker in Kreuzlingen – lokales Gewerbe braucht Sichtbarkeit.', websiteNeeds: 'Leistungsübersicht, Referenzen, Kontaktformular, Google Maps' },
        ],
        additionalFaqs: [
            { question: 'Können Sie Buchungssysteme für Hotels integrieren?', answer: 'Ja, wir integrieren gängige Buchungssysteme wie Booking.com, oder setzen auf individuelle Lösungen für kleinere Betriebe.' },
            { question: 'Bieten Sie Schulungen für die Website-Pflege an?', answer: 'Ja, nach Projektabschluss schulen wir Sie remote oder vor Ort in der Pflege Ihrer Website. Mit Keystatic CMS ist die Bedienung kinderleicht.' },
        ],
        whyChooseUs: 'Wir kennen den Thurgau – von Frauenfeld bis Romanshorn. Diese Regionalkenntnis fliesst in jedes Projekt ein.',
    },
    bern: {
        headline: 'Webdesign Bern',
        subheadline: 'Websites für die Bundesstadt',
        description: 'Bern steht für Seriosität und Qualität. Ihre Website sollte das Gleiche ausstrahlen – professionell, vertrauenswürdig und modern.',
        intro: 'Als Bundesstadt und viertgrösster Kanton der Schweiz ist Bern ein bedeutender Wirtschaftsstandort. Mit über 1 Million Einwohner im Kanton und einer diversifizierten Wirtschaft von Verwaltung über Tourismus bis hin zu Industrie, brauchen Berner Unternehmen professionelle digitale Auftritte. Obwohl wir unseren Hauptsitz in Winterthur haben, betreuen wir zahlreiche Berner Kunden remote. Dank moderner Kommunikationsmittel funktioniert die Zusammenarbeit reibungslos – persönliche Treffen vereinbaren wir bei Bedarf gerne in Bern.',
        localBenefits: ['Remote-Betreuung', 'Professionelle Kommunikation', 'Verständnis für Berner Ansprüche', 'Flexible Termine'],
        stats: [{ label: 'Berner Kunden', value: '10+' }, { label: 'Projekterfolgsrate', value: '100%' }],
        localFaq: { question: 'Wie funktioniert die Zusammenarbeit über die Distanz?', answer: 'Wir arbeiten mit Videocalls, geteilten Projektboards und regelmässigen Updates. Bei Bedarf sind wir auch persönlich in Bern – die Anreise dauert nur 1 Stunde.' },
        regionalImage: '/images/webdesign-hero.png',
        localIndustries: [
            { name: 'Bundesverwaltung & Öffentlicher Sektor', description: 'Als Bundesstadt beherbergt Bern zahlreiche Behörden und Organisationen mit hohen Anforderungen an Barrierefreiheit.', websiteNeeds: 'WCAG-Konformität, Mehrsprachigkeit (DE/FR/IT/EN), sichere Formulare' },
            { name: 'Tourismus & Kultur', description: 'UNESCO-Welterbe, Bärenpark und Bundeshaus – Bern ist ein Tourismusmagnet mit vielfältigem Kulturangebot.', websiteNeeds: 'Veranstaltungskalender, Ticketing, Bildergalerien, mehrsprachig' },
            { name: 'Bildung & Forschung', description: 'Universität Bern, Pädagogische Hochschule und zahlreiche Forschungsinstitute prägen den Standort.', websiteNeeds: 'Content Management für viele Autoren, Publikationsverzeichnisse, moderne UX' },
        ],
        additionalFaqs: [
            { question: 'Können Sie barrierefreie Websites nach WCAG erstellen?', answer: 'Ja, wir entwickeln Websites nach WCAG 2.1 AA-Standard. Für öffentliche Institutionen ist dies oft Pflicht – wir kennen die Anforderungen.' },
            { question: 'Arbeiten Sie auch auf Französisch?', answer: 'Wir erstellen mehrsprachige Websites in Deutsch, Französisch, Italienisch und Englisch. Die Übersetzung koordinieren wir mit professionellen Partnern.' },
        ],
        whyChooseUs: '100% Remote-Zusammenarbeit mit Schweizer Qualität. Wir verstehen die Bedürfnisse des öffentlichen Sektors und wissen, dass in Bern Zuverlässigkeit zählt.',
    },
    basel: {
        headline: 'Webdesign Basel',
        subheadline: 'Moderne Websites für die Nordwestschweiz',
        description: 'Basel ist internationaler Pharma-Standort und Kulturmetropole. Hier erwarten Kunden und Partner höchste Qualität – auch online.',
        intro: 'Die Region Basel ist geprägt von der Pharma- und Life-Sciences-Industrie, aber auch von einem vielfältigen KMU-Sektor. Mit seiner internationalen Ausrichtung und der Nähe zu Deutschland und Frankreich ist Basel ein besonderer Markt. Unternehmen brauchen hier oft mehrsprachige Websites und höchste Professionalität. Wir betreuen Basler Kunden remote mit der gleichen Qualität wie unsere lokalen Kunden in Winterthur. Die internationale Ausrichtung vieler Basler Unternehmen kommt uns entgegen – wir sind Experten für mehrsprachige Websites.',
        localBenefits: ['Mehrsprachige Websites', 'Internationale Erfahrung', 'Remote-Expertise', 'Hohe Qualitätsstandards'],
        stats: [{ label: 'Basler Projekte', value: '8+' }, { label: 'Sprachversionen', value: 'DE/EN/FR' }],
        localFaq: { question: 'Können Sie auch mehrsprachige Websites für internationale Kunden erstellen?', answer: 'Ja, mehrsprachige Websites sind unsere Spezialität. Wir setzen auf Next.js mit i18n-Unterstützung für optimale SEO in allen Sprachen.' },
        regionalImage: '/images/webdesign-hero.png',
    },
    luzern: {
        headline: 'Webdesign Luzern',
        subheadline: 'Websites für die Zentralschweiz',
        description: 'Am Vierwaldstättersee trifft Tradition auf Innovation. Wir entwickeln Websites, die beides vereinen – zeitlose Eleganz mit modernster Technik.',
        intro: 'Luzern ist nicht nur eines der schönsten Reiseziele der Schweiz, sondern auch ein wichtiger Wirtschaftsstandort in der Zentralschweiz. Tourismus, Hotellerie und ein aktiver KMU-Sektor prägen die Region. Mit rund 400\'000 Einwohnern im Grossraum Luzern bietet die Region viel Potenzial. Wir betreuen Luzerner Unternehmen remote und verstehen die besonderen Anforderungen der Tourismusbranche – von schnellen Ladezeiten für internationale Gäste bis hin zu Buchungsintegration.',
        localBenefits: ['Tourismus-Expertise', 'Remote-Betreuung', 'Schnelle Websites', 'Mehrsprachig möglich'],
        stats: [{ label: 'Zentralschweizer Kunden', value: '12+' }, { label: 'Tourismus-Projekte', value: '5+' }],
        localFaq: { question: 'Verstehen Sie die Bedürfnisse der Tourismusbranche?', answer: 'Absolut. Wir haben Erfahrung mit Hotel-Websites, Buchungssystemen und mehrsprachigen Tourismusportalen. Schnelle Ladezeiten für mobile Gäste sind Standard.' },
        regionalImage: '/images/webdesign-hero.png',
    },
    'st-gallen': {
        headline: 'Webdesign St. Gallen',
        subheadline: 'Digitale Lösungen für die Ostschweiz',
        description: 'St. Gallen als Zentrum der Ostschweiz verdient Webdesign, das diesen Anspruch widerspiegelt – innovativ, professionell und zukunftsorientiert.',
        intro: 'Die Universitätsstadt St. Gallen ist das wirtschaftliche und kulturelle Zentrum der Ostschweiz. Mit ihrer Elite-Hochschule HSG, einem starken Finanzsektor und innovativen Industrieunternehmen braucht die Region erstklassige digitale Lösungen. Von unserem Standort in Winterthur sind wir in unter 40 Minuten in St. Gallen – ideal für persönliche Treffen. Wir verstehen die Ostschweizer Mentalität: pragmatisch, qualitätsbewusst und mit Blick auf das Wesentliche. Genau so bauen wir auch Websites.',
        localBenefits: ['Nähe zu St. Gallen', 'Ostschweizer Mentalität', 'Persönliche Treffen möglich', 'HSG-Verständnis'],
        stats: [{ label: 'Ostschweizer Kunden', value: '25+' }, { label: 'Anfahrt ab Winterthur', value: '35 Min' }],
        localFaq: { question: 'Haben Sie Erfahrung mit Unternehmen aus dem HSG-Umfeld?', answer: 'Ja, wir haben bereits Websites für Startups aus dem HSG-Inkubator und Beratungsunternehmen in St. Gallen entwickelt. Wir verstehen die hohen Ansprüche der Region.' },
        regionalImage: '/images/regions/st-gallen.png',
    },
    aargau: {
        headline: 'Webdesign Aargau',
        subheadline: 'Websites für den grössten Mittelland-Kanton',
        description: 'Von Baden über Aarau bis Brugg – wir betreuen Aargauer KMU mit massgeschneiderten Websites, die ihre lokale Stärke überregional zeigen.',
        intro: 'Der Kanton Aargau ist mit über 700\'000 Einwohnern der drittbevölkerungsreichste Kanton der Schweiz. Seine zentrale Lage zwischen Zürich, Basel und Bern macht ihn zu einem idealen Wirtschaftsstandort für Logistik, Produktion und Dienstleistungen. Viele Aargauer KMU sind hidden Champions in ihren Branchen – und brauchen Websites, die diesem Anspruch gerecht werden. Wir betreuen Unternehmen in Baden, Aarau, Brugg, Wettingen und der gesamten Region. Remote-Zusammenarbeit funktioniert perfekt, persönliche Treffen sind dank kurzer Distanz jederzeit möglich.',
        localBenefits: ['Zentrale Lage nutzen', 'KMU-Expertise', 'Kurze Wege', 'Flexible Betreuung'],
        stats: [{ label: 'Aargauer Kunden', value: '18+' }, { label: 'Branchen betreut', value: '12+' }],
        localFaq: { question: 'Betreuen Sie auch die grösseren Städte wie Baden oder Aarau?', answer: 'Ja, wir haben Kunden in Baden, Aarau, Brugg, Wettingen, Wohlen und vielen weiteren Aargauer Gemeinden. Die Region kennen wir gut.' },
        regionalImage: '/images/webdesign-hero.png',
    },
    zug: {
        headline: 'Webdesign Zug',
        subheadline: 'Premium-Websites für den Crypto-Valley-Kanton',
        description: 'Zug ist bekannt für Innovation und internationale Unternehmen. Hier muss Ihre Website weltklasse sein – schnell, modern und makellos.',
        intro: 'Der Kanton Zug hat sich als einer der innovativsten Wirtschaftsstandorte der Welt etabliert. Als Heimat des "Crypto Valley" und zahlreicher internationaler Konzerne sind die Ansprüche in Zug besonders hoch. Hier konkurrieren Sie nicht nur lokal, sondern global. Ihre Website muss diesem Anspruch gerecht werden – technisch auf dem neuesten Stand, blitzschnell und mit perfektem Design. Wir verstehen die Zuger Mentalität: Premium-Qualität, keine Kompromisse. Genau das liefern wir.',
        localBenefits: ['Premium-Qualität', 'Internationale Standards', 'Tech-Expertise', 'Höchste Performance'],
        stats: [{ label: 'Zuger Projekte', value: '6+' }, { label: 'Performance Score', value: '98+' }],
        localFaq: { question: 'Haben Sie Erfahrung mit Tech-Startups und Blockchain-Unternehmen?', answer: 'Ja, wir haben bereits Websites für FinTech- und Blockchain-Unternehmen entwickelt. Moderne Technologie und erstklassiges Design sind unsere Stärke.' },
        regionalImage: '/images/webdesign-hero.png',
    },
    solothurn: {
        headline: 'Webdesign Solothurn',
        subheadline: 'Websites für die schönste Barockstadt',
        description: 'Solothurn verbindet Geschichte mit Moderne. Ihre Website sollte das auch können – zeitlos elegant und dennoch technisch aktuell.',
        intro: 'Der Kanton Solothurn liegt strategisch zwischen Bern, Basel und Zürich und profitiert von seiner zentralen Lage. Mit rund 275\'000 Einwohnern bietet der Kanton einen aktiven KMU-Sektor mit Schwerpunkten in Uhrenindustrie, Präzisionsmechanik und Dienstleistungen. Die berühmte Uhrenstadt Grenchen und die historische Kantonshauptstadt prägen das Bild einer Region, die Tradition und Innovation verbindet. Wir betreuen Solothurner Unternehmen remote mit persönlichem Service.',
        localBenefits: ['Remote-Betreuung', 'Verständnis für Tradition', 'Moderne Technik', 'Persönlicher Service'],
        stats: [{ label: 'Solothurner Kunden', value: '5+' }, { label: 'Kundenzufriedenheit', value: '100%' }],
        localFaq: { question: 'Wie funktioniert die Zusammenarbeit über die Distanz?', answer: 'Wir arbeiten mit regelmässigen Videocalls und einem geteilten Projektboard. Sie sind immer informiert und können jederzeit Feedback geben.' },
        regionalImage: '/images/webdesign-hero.png',
    },
    graubuenden: {
        headline: 'Webdesign Graubünden',
        subheadline: 'Digitale Präsenz für den grössten Kanton',
        description: 'Von Chur bis Davos, von St. Moritz bis Engadin – wir entwickeln Websites für Bündner Tourismus, Hotellerie und lokale KMU.',
        intro: 'Graubünden ist der grösste Kanton der Schweiz und weltbekannt für seine Skigebiete, Kurorte und atemberaubende Natur. Der Tourismus ist die wichtigste Wirtschaftssäule, aber auch Landwirtschaft, Energie und spezialisierte Dienstleistungen spielen eine wichtige Rolle. Für Bündner Unternehmen ist eine professionelle Online-Präsenz besonders wichtig – internationale Gäste informieren sich online, bevor sie buchen. Wir verstehen diese Anforderungen: schnelle Ladezeiten auch bei schlechtem Handy-Empfang, mehrsprachige Inhalte und nahtlose Buchungsintegration.',
        localBenefits: ['Tourismus-Expertise', 'Mehrsprachig (DE/EN/IT)', 'Schnelle Mobile-Websites', 'Buchungssysteme'],
        stats: [{ label: 'Bündner Projekte', value: '8+' }, { label: 'Sprachen', value: 'DE/EN/IT' }],
        localFaq: { question: 'Können Sie auch italienischsprachige Websites für das Engadin erstellen?', answer: 'Ja, wir erstellen mehrsprachige Websites in Deutsch, Englisch und Italienisch. Die SEO-Optimierung erfolgt für alle Sprachen separat.' },
        regionalImage: '/images/webdesign-hero.png',
    },
};

interface WebdesignContentProps {
    regionSlug?: string;
    showRegionalLinks?: boolean;
}

export function WebdesignContent({ regionSlug, showRegionalLinks = true }: WebdesignContentProps) {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const content = regionalContent[regionSlug || 'default'] || regionalContent.default;
    const isHubPage = !regionSlug; // Hub page has no regionSlug

    const regions = [
        { name: 'Winterthur', href: '/webdesign/winterthur' },
        { name: 'Zürich', href: '/webdesign/zuerich' },
        { name: 'Schaffhausen', href: '/webdesign/schaffhausen' },
        { name: 'Thurgau', href: '/webdesign/thurgau' },
        { name: 'St. Gallen', href: '/webdesign/st-gallen' },
        { name: 'Bern', href: '/webdesign/bern' },
        { name: 'Basel', href: '/webdesign/basel' },
        { name: 'Luzern', href: '/webdesign/luzern' },
        { name: 'Aargau', href: '/webdesign/aargau' },
        { name: 'Zug', href: '/webdesign/zug' },
        { name: 'Solothurn', href: '/webdesign/solothurn' },
        { name: 'Graubünden', href: '/webdesign/graubuenden' },
    ].filter(r => r.href !== `/webdesign/${regionSlug}`);

    return (
        <>
            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <Image
                        src="/images/webdesign-hero.png"
                        alt=""
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <AnimatedSection animation="slideUp">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                                <span className="gradient-text">{content.headline}</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-primary font-medium mb-4">
                                {content.subheadline}
                            </p>
                            <p className="text-lg text-text-secondary max-w-xl mb-8">
                                {content.description}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button variant="primary" size="lg" asChild>
                                    <Link href="/kontakt">
                                        Kostenloses Erstgespräch
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" asChild>
                                    <a href="#pakete">
                                        Pakete ansehen
                                    </a>
                                </Button>
                            </div>
                        </AnimatedSection>
                        <AnimatedSection animation="slideUp" delay={0.2} className="hidden lg:block">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border">
                                <Image
                                    src={content.regionalImage}
                                    alt={content.headline}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Regional Intro Section - Unique per Region */}
            <section className="py-12 lg:py-16 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <AnimatedSection animation="slideUp">
                            <p className="text-lg text-text-secondary leading-relaxed mb-8">
                                {content.intro}
                            </p>

                            {/* Local Benefits & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Benefits */}
                                <div className="p-6 rounded-2xl bg-card border border-border">
                                    <h3 className="font-bold text-text-primary mb-4">Ihre Vorteile</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {content.localBenefits.map((benefit, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                                <span className="text-sm text-text-secondary">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="p-6 rounded-2xl bg-primary/5 border border-primary">
                                    <h3 className="font-bold text-text-primary mb-4">In Zahlen</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {content.stats.map((stat, i) => (
                                            <div key={i} className="text-center">
                                                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                                                <div className="text-xs text-text-secondary">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Local Industries Section - Only for regional pages */}
            {regionSlug && content.localIndustries && content.localIndustries.length > 0 && (
                <section className="py-12 lg:py-16 bg-surface">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
                                Webdesign für {content.headline.replace('Webdesign ', '')}er Branchen
                            </h2>
                            <p className="text-text-secondary max-w-2xl mx-auto">
                                Wir verstehen die spezifischen Anforderungen der lokalen Wirtschaft und entwickeln massgeschneiderte Lösungen.
                            </p>
                        </AnimatedSection>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {content.localIndustries.map((industry, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
                                >
                                    <h3 className="text-lg font-bold text-text-primary mb-2">{industry.name}</h3>
                                    <p className="text-sm text-text-secondary mb-4">{industry.description}</p>
                                    <div className="pt-3 border-t border-border">
                                        <p className="text-xs text-primary font-medium mb-1">Was diese Branche braucht:</p>
                                        <p className="text-xs text-text-secondary">{industry.websiteNeeds}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {content.whyChooseUs && (
                            <div className="mt-10 max-w-3xl mx-auto">
                                <div className="p-6 rounded-2xl bg-primary/5 border border-primary">
                                    <h3 className="font-bold text-text-primary mb-2 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-primary" />
                                        Warum InfraOne für {content.headline.replace('Webdesign ', '')}?
                                    </h3>
                                    <p className="text-text-secondary">{content.whyChooseUs}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Pricing Section - Differentiated for Hub vs Spoke */}
            <section id="pakete" className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            {isHubPage ? 'Investition in Ihre digitale Zukunft' : `Webdesign-Pakete für ${content.headline.replace('Webdesign ', '')}`}
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            {isHubPage
                                ? 'Faire Preise, keine Überraschungen. Jedes Projekt beginnt mit einem kostenlosen Erstgespräch.'
                                : 'Dieselbe Qualität, angepasst an Ihre regionalen Bedürfnisse.'}
                        </p>
                    </AnimatedSection>

                    {isHubPage ? (
                        /* Hub: Full detailed packages */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                            {packages.map((pkg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -10 }}
                                    className={`relative p-8 rounded-2xl border ${pkg.popular
                                        ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20'
                                        : 'bg-card border-border hover:border-primary/50'
                                        } transition-all duration-300`}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary text-sm font-bold px-4 py-1 rounded-full">
                                            Beliebt
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className={`text-2xl font-bold mb-2 ${pkg.popular ? 'text-white' : 'text-text-primary'}`}>
                                            {pkg.name}
                                        </h3>
                                        <div className={`text-4xl font-bold mb-2 ${pkg.popular ? 'text-white' : 'text-primary'}`}>
                                            {pkg.price}
                                        </div>
                                        <p className={`text-sm ${pkg.popular ? 'text-white/80' : 'text-text-secondary'}`}>
                                            {pkg.description}
                                        </p>
                                        <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${pkg.popular ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                            {pkg.platforms}
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {pkg.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <Check className={`w-5 h-5 flex-shrink-0 ${pkg.popular ? 'text-white' : 'text-primary'}`} />
                                                <span className={`text-sm ${pkg.popular ? 'text-white/90' : 'text-text-secondary'}`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        variant={pkg.popular ? 'secondary' : 'primary'}
                                        size="lg"
                                        className={`w-full ${pkg.popular ? 'bg-white text-primary hover:bg-white/90' : ''}`}
                                        asChild
                                    >
                                        <Link href="/kontakt">
                                            Anfragen
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        /* Spoke: Condensed packages with CTA to Hub */
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {packages.map((pkg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`p-6 rounded-xl border text-center ${pkg.popular
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-card border-border'
                                            }`}
                                    >
                                        <h3 className={`text-lg font-bold mb-1 ${pkg.popular ? 'text-white' : 'text-text-primary'}`}>
                                            {pkg.name}
                                        </h3>
                                        <div className={`text-2xl font-bold mb-2 ${pkg.popular ? 'text-white' : 'text-primary'}`}>
                                            {pkg.price}
                                        </div>
                                        <p className={`text-xs ${pkg.popular ? 'text-white/70' : 'text-text-secondary'}`}>
                                            {pkg.features.slice(0, 3).join(' • ')}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="text-center">
                                <Button variant="outline" size="lg" asChild>
                                    <Link href="/webdesign#pakete">
                                        Alle Pakete im Detail
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Hub-Exclusive: Methodology Section */}
            {isHubPage && (
                <section className="py-16 lg:py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                                So arbeiten wir
                            </h2>
                            <p className="text-text-secondary max-w-2xl mx-auto">
                                Ein strukturierter Prozess für messbare Ergebnisse. Vier Phasen von der Idee bis zum Launch.
                            </p>
                        </AnimatedSection>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {[
                                { step: '01', title: 'Discovery', desc: 'Wir analysieren Ihre Ziele, Zielgruppe und Wettbewerber. Gemeinsam definieren wir die optimale Strategie.', icon: '🎯' },
                                { step: '02', title: 'Design', desc: 'Modernes UI/UX-Design, das Ihre Marke stärkt. Wireframes und interaktive Prototypen zur Freigabe.', icon: '✨' },
                                { step: '03', title: 'Entwicklung', desc: 'Sauberer Code, optimierte Performance. Wir bauen mit bewährten Technologien für maximale Stabilität.', icon: '⚡' },
                                { step: '04', title: 'Launch', desc: 'Testing, SEO-Feinschliff und Go-Live. Danach: kontinuierliche Optimierung und Support.', icon: '🚀' },
                            ].map((phase, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative p-6 rounded-2xl bg-card border border-border"
                                >
                                    <div className="text-4xl mb-4">{phase.icon}</div>
                                    <div className="text-xs font-bold text-primary mb-2">{phase.step}</div>
                                    <h3 className="text-lg font-bold text-text-primary mb-2">{phase.title}</h3>
                                    <p className="text-sm text-text-secondary">{phase.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* References Section */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Unsere Referenzen
                        </h2>
                        <p className="text-text-secondary">Projekte, auf die wir stolz sind</p>
                    </AnimatedSection>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
                        {references.map((ref, index) => (
                            <StaggerItem key={index}>
                                <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary transition-colors">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-text-primary mb-1">{ref.name}</h3>
                                        <p className="text-sm text-text-secondary">{ref.description}</p>
                                    </div>
                                    <a
                                        href={ref.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline mb-4"
                                    >
                                        Website ansehen
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <div className="pt-4 border-t border-border">
                                        <div className="flex gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                            ))}
                                        </div>
                                        <p className="text-sm text-text-secondary italic mb-2">"{ref.quote}"</p>
                                        <p className="text-xs text-text-secondary">
                                            <span className="font-medium text-text-primary">{ref.author}</span>, {ref.role}
                                        </p>
                                    </div>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Platforms Section */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Welche Technologie passt zu Ihnen?
                        </h2>
                        <p className="text-text-secondary">Wir beraten Sie ehrlich – ohne Buzzwords</p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {platforms.map((platform, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -5 }}
                                className={`p-6 rounded-2xl border ${platform.highlight
                                    ? 'bg-primary/5 border-primary'
                                    : 'bg-card border-border'
                                    }`}
                            >
                                {platform.highlight && (
                                    <span className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                                        Empfohlen
                                    </span>
                                )}
                                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                    {platform.icon}
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">{platform.name}</h3>
                                <p className="text-primary font-medium text-sm mb-3">{platform.description}</p>
                                <p className="text-sm text-text-secondary mb-4">{platform.forWhom}</p>

                                <div className="space-y-2 mb-4">
                                    {platform.pros.map((pro, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-primary" />
                                            <span className="text-text-secondary">{pro}</span>
                                        </div>
                                    ))}
                                </div>

                                {platform.cons && (
                                    <div className="text-xs text-text-secondary opacity-70">
                                        Zu beachten: {platform.cons.join(', ')}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Keystatic Highlight */}
                    <div className="mt-12 max-w-5xl mx-auto">
                        <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary">
                            {!regionSlug ? (
                                /* Main Webdesign Page - Enhanced Version */
                                <div className="space-y-8">
                                    <div className="text-center">
                                        <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                                            Keystatic CMS – Ihr Content, Ihre Kontrolle
                                        </h3>
                                        <p className="text-text-secondary max-w-2xl mx-auto">
                                            Keystatic ist ein modernes Content Management System, das direkt in Ihre Website integriert ist.
                                            Keine separate Admin-Oberfläche, keine komplizierte Einarbeitung – einfach einloggen und loslegen.
                                        </p>
                                    </div>

                                    {/* Feature Grid */}
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="p-4 rounded-xl bg-card border border-border">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                                <Palette className="w-5 h-5 text-primary" />
                                            </div>
                                            <h4 className="font-bold text-text-primary mb-2">Visueller Editor</h4>
                                            <p className="text-sm text-text-secondary">
                                                Bearbeiten Sie Texte, Bilder und Inhalte direkt im Browser – mit sofortiger Live-Vorschau.
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-card border border-border">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                                <Code className="w-5 h-5 text-primary" />
                                            </div>
                                            <h4 className="font-bold text-text-primary mb-2">Git-basiert</h4>
                                            <p className="text-sm text-text-secondary">
                                                Alle Änderungen werden versioniert gespeichert. Jederzeit zurückrollen, nichts geht verloren.
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-card border border-border">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                                <Rocket className="w-5 h-5 text-primary" />
                                            </div>
                                            <h4 className="font-bold text-text-primary mb-2">Blitzschnell</h4>
                                            <p className="text-sm text-text-secondary">
                                                Keine Datenbank, keine Server-Last. Ihre Website lädt schneller als je zuvor.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Image Gallery */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <a
                                            href="/images/keyststic_dashboard.jpg"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group rounded-xl overflow-hidden shadow-lg border border-border hover:border-primary transition-all hover:shadow-xl"
                                        >
                                            <div className="relative overflow-hidden">
                                                <Image
                                                    src="/images/keyststic_dashboard.jpg"
                                                    alt="Keystatic Dashboard – Übersichtliche Content-Verwaltung mit allen Bereichen Ihrer Website"
                                                    width={400}
                                                    height={250}
                                                    className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                                                    <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                </div>
                                            </div>
                                            <p className="p-3 text-xs text-text-secondary bg-card group-hover:text-primary transition-colors">Dashboard-Übersicht</p>
                                        </a>
                                        <a
                                            href="/images/keyststic_example-projects.jpg"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group rounded-xl overflow-hidden shadow-lg border border-border hover:border-primary transition-all hover:shadow-xl"
                                        >
                                            <div className="relative overflow-hidden">
                                                <Image
                                                    src="/images/keyststic_example-projects.jpg"
                                                    alt="Keystatic Projekteverwaltung – Einfache Bearbeitung von Portfolio und Referenzen"
                                                    width={400}
                                                    height={250}
                                                    className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                                                    <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                </div>
                                            </div>
                                            <p className="p-3 text-xs text-text-secondary bg-card group-hover:text-primary transition-colors">Projekte verwalten</p>
                                        </a>
                                        <a
                                            href="/images/keyststic_example-jobs.jpg"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group rounded-xl overflow-hidden shadow-lg border border-border hover:border-primary transition-all hover:shadow-xl sm:col-span-2 md:col-span-1"
                                        >
                                            <div className="relative overflow-hidden">
                                                <Image
                                                    src="/images/keyststic_example-jobs.jpg"
                                                    alt="Keystatic Stellenanzeigen – Karriereseite selbst pflegen ohne Programmierkenntnisse"
                                                    width={400}
                                                    height={250}
                                                    className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                                                    <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                </div>
                                            </div>
                                            <p className="p-3 text-xs text-text-secondary bg-card group-hover:text-primary transition-colors">Jobs & Karriere</p>
                                        </a>
                                    </div>

                                    {/* Benefits List */}
                                    <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                                        {[
                                            'Live-Vorschau beim Bearbeiten',
                                            'Keine Software-Installation nötig',
                                            'Mehrere Benutzer gleichzeitig',
                                            'Automatische Backups via Git',
                                            'Schweizer Hosting inklusive',
                                            'SEO-Optimierung eingebaut',
                                        ].map((benefit, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                                <span className="text-text-secondary">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Regional Pages - Compact Version */
                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold text-text-primary mb-4">
                                            Keystatic CMS – Einfach. Schnell. Modern.
                                        </h3>
                                        <p className="text-text-secondary mb-4">
                                            Mit Keystatic bearbeiten Sie Ihre Website direkt im Browser. Keine Installation,
                                            keine technischen Kenntnisse nötig. Texte und Bilder ändern – so einfach wie Word.
                                        </p>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Check className="w-4 h-4 text-primary" />
                                                Live-Vorschau beim Bearbeiten
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Check className="w-4 h-4 text-primary" />
                                                Direkt im Browser – keine Software
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Check className="w-4 h-4 text-primary" />
                                                Schweizer Hosting inklusive
                                            </li>
                                        </ul>
                                    </div>
                                    <a
                                        href="/images/keyststic_dashboard.jpg"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hidden md:block group"
                                    >
                                        <div className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-border hover:border-primary">
                                            <Image
                                                src="/images/keyststic_dashboard.jpg"
                                                alt="Keystatic CMS Dashboard – Intuitive Content-Verwaltung für Ihre Website"
                                                width={450}
                                                height={280}
                                                className="group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                                                <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQs Section */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Häufige Fragen
                        </h2>
                    </AnimatedSection>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="rounded-xl border border-border bg-card overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <span className="font-medium text-text-primary">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                                </button>
                                {openFaq === index && (
                                    <div className="px-4 pb-4">
                                        <p className="text-text-secondary">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Local FAQ - Unique per Region */}
                        <div className="rounded-xl border-2 border-primary bg-primary/5 overflow-hidden">
                            <button
                                onClick={() => setOpenFaq(openFaq === 99 ? null : 99)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <span className="font-medium text-text-primary">{content.localFaq.question}</span>
                                <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openFaq === 99 ? 'rotate-180' : ''}`} />
                            </button>
                            {openFaq === 99 && (
                                <div className="px-4 pb-4">
                                    <p className="text-text-secondary">{content.localFaq.answer}</p>
                                </div>
                            )}
                        </div>

                        {/* Additional FAQs - Unique per Region */}
                        {content.additionalFaqs && content.additionalFaqs.map((faq, index) => (
                            <div
                                key={`additional-${index}`}
                                className="rounded-xl border-2 border-primary bg-primary/5 overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === (100 + index) ? null : (100 + index))}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <span className="font-medium text-text-primary">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openFaq === (100 + index) ? 'rotate-180' : ''}`} />
                                </button>
                                {openFaq === (100 + index) && (
                                    <div className="px-4 pb-4">
                                        <p className="text-text-secondary">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Regional Links */}
            {showRegionalLinks && (
                <section className="py-12 lg:py-16 bg-surface">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                                Webdesign in Ihrer Region
                            </h2>
                        </AnimatedSection>
                        <div className="flex flex-wrap justify-center gap-4">
                            {regions.map((region, index) => (
                                <Link
                                    key={index}
                                    href={region.href}
                                    className="px-6 py-3 rounded-xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all text-text-primary font-medium"
                                >
                                    {region.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Bereit für Ihre neue Website?
                    </h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                        Kostenloses Erstgespräch – wir beraten Sie unverbindlich.
                    </p>
                    <Button
                        variant="secondary"
                        size="lg"
                        className="bg-white text-primary hover:bg-white/90"
                        asChild
                    >
                        <Link href="/kontakt">
                            Jetzt Kontakt aufnehmen
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
