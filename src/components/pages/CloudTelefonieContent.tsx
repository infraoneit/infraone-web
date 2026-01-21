'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Cloud, Globe, Wifi, Users, Calculator, CheckCircle, ArrowRight, ExternalLink, Shield, Zap, Smartphone, Building2, Headphones, Settings, Tv, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';

// Vorteile einer Cloud-Telefonanlage
const benefits = [
    {
        icon: <Cloud className="w-6 h-6" />,
        title: 'Wartungsfrei',
        description: 'Keine lokale Hardware, keine Updates – wir kümmern uns um alles.',
    },
    {
        icon: <Globe className="w-6 h-6" />,
        title: 'Von überall telefonieren',
        description: 'Homeoffice, Büro oder unterwegs – Ihre Nummer ist immer dabei.',
    },
    {
        icon: <Zap className="w-6 h-6" />,
        title: 'Schnelle Einrichtung',
        description: 'Keine langen Installationen. In wenigen Tagen einsatzbereit.',
    },
    {
        icon: <Shield className="w-6 h-6" />,
        title: 'Schweizer Rechenzentren',
        description: 'DSG-konform. Ihre Daten bleiben in der Schweiz.',
    },
];

// Basis-Funktionen (im Preis inbegriffen)
const baseFunctions = [
    'Unbegrenzte interne Anrufe',
    'Peoplefone Handy-App (iOS/Android)',
    'Kostenlose Anrufe zwischen Peoplefone-Kunden (auch international)',
    'Anrufweiterleitung & Rufgruppen',
    'Voicemail mit E-Mail-Benachrichtigung',
    'Online-Portal zur Verwaltung',
    'Statistiken & Anrufhistorie',
    'Fax2Mail',
    'Telefonbuch & Kurzwahlen',
];

// Optionale Erweiterungen
const extensions = [
    { name: 'Softphone-Lizenzen (PC/Mac-App)', price: 'CHF 5.–/User/Monat' },
    { name: 'Warteschlaufe (Queue)', price: 'CHF 5.–/Monat' },
    { name: 'IVR (Sprachmenü)', price: 'CHF 5.–/Monat' },
    { name: 'CRM-Integration', price: 'Auf Anfrage' },
    { name: 'Callcenter-Funktionen', price: 'Auf Anfrage' },
    { name: 'Gesprächsaufzeichnung', price: 'Auf Anfrage' },
];

// Preisstruktur
const pricingModules = {
    userPackages: [
        { range: '1–5 Benutzer', price: 'CHF 15.–', per: '/Monat pauschal' },
        { range: '6–10 Benutzer', price: 'CHF 25.–', per: '/Monat pauschal' },
        { range: '11–20 Benutzer', price: 'CHF 35.–', per: '/Monat pauschal' },
        { range: '21–50 Benutzer', price: 'CHF 50.–', per: '/Monat pauschal' },
    ],
    tariffs: [
        { name: 'Minutentarif', price: 'ab CHF 0.03', description: 'Festnetz 0.03/Min, Mobil 0.25/Min' },
        { name: 'Flatrate CH', price: 'CHF 19.–', description: '1000 Min. Festnetz + 200 Min. Mobil Schweiz' },
        { name: 'Flatrate CH+EU', price: 'CHF 22.–', description: '1000 Min. Festnetz + 300 Min. Mobil CH+EU' },
    ],
    internetTV: [
        { name: 'Internet 1 Gbit/s', price: 'CHF 49.–' },
        { name: 'Fixe IP-Adresse', price: 'CHF 10.–' },
        { name: 'TV Box', price: 'CHF 15.–' },
    ],
    phoneNumbers: [
        { range: 'Einzelnummer', price: 'CHF 5.–' },
        { range: 'Nummernblock 2–5', price: 'CHF 10.–' },
        { range: 'Nummernblock 6–10', price: 'CHF 15.–' },
    ],
};

// Alternative Lösungen
const alternativeSolutions = [
    {
        icon: <Settings className="w-6 h-6" />,
        name: '3CX',
        description: 'Flexible IP-Telefonanlage für grössere Umgebungen',
    },
    {
        icon: <Users className="w-6 h-6" />,
        name: 'MS Teams Telefonie',
        description: 'Telefonie direkt in Microsoft Teams integriert',
    },
    {
        icon: <Building2 className="w-6 h-6" />,
        name: 'On-Premise Anlagen',
        description: 'Betreuung bestehender lokaler Telefonanlagen',
    },
];

// Regional content interface
interface RegionalData {
    headline: string;
    subheadline: string;
    intro: string;
    localBenefits: string[];
    stats: { label: string; value: string }[];
    localFaq: { question: string; answer: string };
    regionalImage: string;
}

// Unique regional content for Cloud-Telefonie
const regionalContent: Record<string, RegionalData> = {
    default: {
        headline: 'Cloud-Telefonanlagen',
        subheadline: 'VoIP-Telefonie für Schweizer KMU',
        intro: 'In der Schweiz setzen immer mehr Unternehmen auf Cloud-Telefonie. Die Vorteile liegen auf der Hand: Keine wartungsintensive Hardware vor Ort, flexible Arbeitsplätze im Homeoffice, und professionelle Telefonielösungen zu planbaren Kosten. Als zertifizierter Peoplefone-Partner beraten wir Sie unabhängig und finden die optimale Lösung für Ihr Unternehmen. Von der Einmann-Firma bis zum 50-Personen-Betrieb – wir kennen die Anforderungen von Schweizer KMU.',
        localBenefits: ['Keine Hardware', 'Wartungsfrei', 'Flexibles Homeoffice', 'Schweizer Rechenzentren'],
        stats: [{ label: 'Umgestellte Anlagen', value: '80+' }, { label: 'Zufriedene Kunden', value: '98%' }],
        localFaq: { question: 'Kann ich meine bestehende Nummer behalten?', answer: 'Ja! Wir portieren Ihre bestehenden Festnetz- und Mobilnummern zu Peoplefone. Der Prozess dauert meist 5-10 Arbeitstage und läuft unterbrechungsfrei.' },
        regionalImage: '/images/hero_telefonie_1768423192251.png',
    },
    zuerich: {
        headline: 'Cloud-Telefonie Zürich',
        subheadline: 'Professionelle VoIP-Lösungen für Zürcher Unternehmen',
        intro: 'In Zürich ist Zeit Geld. Wenn die Telefonanlage ausfällt oder der Support stundenlang auf sich warten lässt, kostet das bares Geld. Mit unserer Cloud-Telefonie-Lösung gehört das der Vergangenheit an: Keine Hardware, die kaputt gehen kann. Kein IT-Team, das sich um Updates kümmern muss. Einfach telefonieren – vom Büro am Paradeplatz, aus dem Homeoffice in Oerlikon oder unterwegs. Viele Zürcher Anwaltskanzleien, Beratungsunternehmen und Arztpraxen vertrauen bereits auf unsere Peoplefone-Lösungen. Professionelle Anrufbehandlung mit Warteschlaufe und Sprachmenü inklusive.',
        localBenefits: ['Kurze Wege von Winterthur', 'Erfahrung mit Zürcher KMU', 'Professionelle Anrufbehandlung', 'Schneller Support'],
        stats: [{ label: 'Zürcher Kunden', value: '25+' }, { label: 'Ø Setup-Zeit', value: '5 Tage' }],
        localFaq: { question: 'Bieten Sie Vor-Ort-Einrichtung in Zürich an?', answer: 'Ja! Obwohl Cloud-Telefonie oft remote eingerichtet werden kann, kommen wir bei Bedarf gerne nach Zürich für die Ersteinrichtung und Schulung Ihrer Mitarbeiter.' },
        regionalImage: '/images/regions/zuerich.png',
    },
    winterthur: {
        headline: 'Cloud-Telefonie Winterthur',
        subheadline: 'Ihr lokaler VoIP-Partner in der Eulachstadt',
        intro: 'Von unserem Hauptsitz in Winterthur aus betreuen wir Unternehmen in der ganzen Region. Ob Handwerksbetrieb in Töss, Arztpraxis in Seen oder IT-Startup im Technopark – wir verstehen die Anforderungen unterschiedlichster Branchen. Die Umstellung auf Cloud-Telefonie ist einfacher als gedacht: Wir analysieren Ihre Bedürfnisse, planen die Migration und schulen Ihr Team. In den meisten Fällen ist die neue Anlage innert einer Woche betriebsbereit. Und sollte doch mal etwas nicht funktionieren: Wir sind in 15 Minuten bei Ihnen.',
        localBenefits: ['Hauptstandort – Vor-Ort-Service', 'Persönliche Betreuung', 'Schnelle Reaktionszeit', 'Lokale Referenzen'],
        stats: [{ label: 'Winterthurer Kunden', value: '40+' }, { label: 'Jahre Erfahrung', value: '8+' }],
        localFaq: { question: 'Können Sie auch unsere bestehende Telefonanlage warten?', answer: 'Ja, wir betreuen auch klassische On-Premise-Anlagen. Allerdings empfehlen wir bei anstehenden Investitionen meist den Umstieg auf Cloud – langfristig günstiger und flexibler.' },
        regionalImage: '/images/regions/winterthur.png',
    },
    schaffhausen: {
        headline: 'Cloud-Telefonie Schaffhausen',
        subheadline: 'Moderne Telefonie für Schaffhauser Unternehmen',
        intro: 'Der Kanton Schaffhausen ist geprägt von traditionsreichen Industrieunternehmen und einem aktiven Gewerbe. Viele dieser Betriebe arbeiten noch mit veralteten Telefonanlagen, die teuer im Unterhalt sind und keine modernen Features bieten. Zeit für einen Wechsel! Mit unserer Cloud-Telefonielösung telefonieren Ihre Mitarbeiter vom Werk, vom Homeoffice oder von unterwegs – alles mit derselben Geschäftsnummer. Die Handy-App von Peoplefone macht\'s möglich. Wir haben bereits mehrere Schaffhauser Betriebe erfolgreich umgestellt.',
        localBenefits: ['Standort in der Region', 'Industrie-Erfahrung', 'Persönliche Beratung', 'Schnelle Umstellung'],
        stats: [{ label: 'Schaffhauser Kunden', value: '15+' }, { label: 'Umstellungen/Jahr', value: '10+' }],
        localFaq: { question: 'Funktioniert Cloud-Telefonie auch in Industriegebäuden?', answer: 'Ja, sofern eine stabile Internetverbindung besteht. Bei schlechtem WLAN-Empfang empfehlen wir zusätzliche Access Points. Das prüfen wir vor der Umstellung.' },
        regionalImage: '/images/regions/schaffhausen.png',
    },
    thurgau: {
        headline: 'Cloud-Telefonie Thurgau',
        subheadline: 'VoIP-Lösungen für den Bodensee-Kanton',
        intro: 'Vom Bodensee bis Frauenfeld, von Kreuzlingen bis Weinfelden – der Thurgau ist vielfältig. Hotels am See brauchen andere Telefonielösungen als Handwerksbetriebe im Hinterland. Genau deshalb beraten wir Sie persönlich und finden die passende Lösung. Für ein Hotel konfigurieren wir Zimmeranschlüsse und Rezeption, für den Handwerker die mobile App für den Aussendienst. Cloud-Telefonie ist flexibel genug für beides. Und mit unserem Standort sind wir schnell bei Ihnen vor Ort, wenn es nötig ist.',
        localBenefits: ['Kenntnis der Region', 'Hotel- & Gastro-Erfahrung', 'Mobile Lösungen', 'Kurze Anfahrt'],
        stats: [{ label: 'Thurgauer Kunden', value: '20+' }, { label: 'Hotel-Installationen', value: '5+' }],
        localFaq: { question: 'Bieten Sie spezielle Lösungen für Hotels an?', answer: 'Ja! Wir kennen die Anforderungen der Hotellerie: Zimmeranschlüsse, Rezeptionslogik, Wake-up-Calls. Peoplefone lässt sich perfekt für Hotels konfigurieren.' },
        regionalImage: '/images/regions/thurgau.png',
    },
    'st-gallen': {
        headline: 'Cloud-Telefonie St. Gallen',
        subheadline: 'Professionelle VoIP-Lösungen für die Ostschweiz',
        intro: 'St. Gallen ist das wirtschaftliche Zentrum der Ostschweiz. Hier treffen sich innovative Startups und traditionsreiche Industrieunternehmen. Beide brauchen professionelle Kommunikation. Mit Cloud-Telefonie sind Sie für beides gerüstet: Das Startup hat von Tag 1 eine professionelle Geschäftsnummer mit Sprachmenü, das Industrieunternehmen spart Wartungskosten und gewinnt Flexibilität. Von Winterthur aus sind wir in gut 30 Minuten bei Ihnen – für Beratung, Installation oder Support.',
        localBenefits: ['35 Min ab Winterthur', 'Startup-Erfahrung', 'Industrie-Know-how', 'Persönlicher Service'],
        stats: [{ label: 'Ostschweizer Kunden', value: '18+' }, { label: 'Anfahrt', value: '35 Min' }],
        localFaq: { question: 'Haben Sie Erfahrung mit schnell wachsenden Startups?', answer: 'Ja! Cloud-Telefonie skaliert perfekt mit: Heute 3 Mitarbeiter, nächstes Jahr 20. Keine neue Hardware nötig, einfach neue Benutzer hinzufügen.' },
        regionalImage: '/images/regions/st-gallen.png',
    },
    rapperswil: {
        headline: 'Cloud-Telefonie Rapperswil',
        subheadline: 'VoIP-Lösungen für die Rosenstadt',
        intro: 'Rapperswil-Jona und die umliegende Region am oberen Zürichsee verbinden Lebensqualität mit wirtschaftlicher Dynamik. Viele Unternehmen hier schätzen kurze Wege und persönlichen Service – genau das bieten wir. Cloud-Telefonie bedeutet nicht anonymen Support aus einem Callcenter. Bei uns haben Sie einen persönlichen Ansprechpartner, der Ihr Setup kennt. Von der Erstberatung über die Einrichtung bis zum laufenden Support – alles aus einer Hand. Und wenn es brennt, sind wir schnell vor Ort.',
        localBenefits: ['Persönlicher Ansprechpartner', 'Schneller Vor-Ort-Service', 'Lokale Betreuung', 'Transparente Preise'],
        stats: [{ label: 'Kunden Region Rapperswil', value: '12+' }, { label: 'Kundentreue', value: '100%' }],
        localFaq: { question: 'Wie schnell können Sie bei Problemen helfen?', answer: 'Die meisten Probleme lösen wir per Fernwartung innert Minuten. Für Vor-Ort-Einsätze sind wir in etwa 40 Minuten bei Ihnen in Rapperswil.' },
        regionalImage: '/images/regions/rapperswil.png',
    },
};

interface CloudTelefonieContentProps {
    showRegionalLinks?: boolean;
    regionSlug?: string;
    regions?: { name: string; href: string }[];
}

export function CloudTelefonieContent({
    showRegionalLinks = true,
    regionSlug,
    regions = [
        { name: 'Zürich', href: '/telefonie/zuerich' },
        { name: 'Winterthur', href: '/telefonie/winterthur' },
        { name: 'Schaffhausen', href: '/telefonie/schaffhausen' },
        { name: 'Thurgau', href: '/telefonie/thurgau' },
        { name: 'St. Gallen', href: '/telefonie/st-gallen' },
        { name: 'Rapperswil', href: '/telefonie/rapperswil' },
    ].filter(r => !regionSlug || !r.href.includes(regionSlug))
}: CloudTelefonieContentProps) {
    const content = regionalContent[regionSlug || 'default'] || regionalContent.default;
    const title = content.headline;

    return (
        <>
            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                {/* Background Image - dezent wie bei IT-Support SEO Seiten */}
                <div className="absolute inset-0 opacity-10">
                    <Image src="/images/hero_telefonie_1768423192251.png" alt="" fill className="object-cover" priority />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="max-w-xl">
                            <AnimatedSection animation="slideUp">
                                <p className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">
                                    {content.subheadline}
                                </p>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
                                    <span className="gradient-text">{title}</span>{' '}
                                    <span className="block mt-2">Wartungsfrei. Flexibel. Schweiz.</span>
                                </h1>
                                <p className="text-xl text-text-secondary mb-8 max-w-2xl">
                                    VoIP-Telefonie mit Peoplefone – ohne lokale Hardware, ohne Wartungsaufwand.
                                    Telefonieren Sie von überall: Büro, Homeoffice oder unterwegs.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button variant="primary" size="lg" asChild>
                                        <a href="https://cloud-telefonanlagen.ch#rechner" target="_blank" rel="noopener noreferrer">
                                            <Calculator className="w-5 h-5" />
                                            Kosten berechnen
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild>
                                        <Link href="/kontakt">
                                            Offerte anfordern
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </Button>
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* Hero Image on the right */}
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

            {/* Regional Intro - Unique per Region */}
            <section className="py-12 lg:py-16 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <AnimatedSection animation="slideUp">
                            <p className="text-lg text-text-secondary leading-relaxed mb-8">{content.intro}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Benefits */}
                                <div className="p-6 rounded-2xl bg-card border border-border">
                                    <h3 className="font-bold text-text-primary mb-4">Ihre Vorteile</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {content.localBenefits.map((benefit, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
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

            {/* Beispiel-Paket Highlight */}
            <section className="py-12 bg-primary">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center text-white">
                        <p className="text-sm uppercase tracking-wider opacity-80 mb-2">Beispielkonfiguration</p>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">
                            Komplettpaket für 20 Benutzer
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-2xl font-bold">20</p>
                                <p className="text-sm opacity-80">Benutzer</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-2xl font-bold">10</p>
                                <p className="text-sm opacity-80">Rufnummern</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-2xl font-bold">CH+EU</p>
                                <p className="text-sm opacity-80">Flatrate inkl.</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-2xl font-bold">1 Gbit</p>
                                <p className="text-sm opacity-80">Internet + IP</p>
                            </div>
                        </div>
                        <div className="bg-white/20 rounded-2xl p-6 inline-block">
                            <p className="text-4xl md:text-5xl font-bold">CHF 131.–</p>
                            <p className="text-sm opacity-80">pro Monat, Flatrate inklusive</p>
                        </div>
                        <p className="mt-4 text-sm opacity-70">
                            Zzgl. einmaliger Installation & Portierung. Softphone-Lizenzen optional CHF 2.–/User.
                        </p>
                    </div>
                </div>
            </section>

            {/* Vorteile */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Warum Cloud-Telefonie?
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Moderne Telefonie ohne lokale Telefonanlage – flexibel, skalierbar und ohne Wartungsaufwand.
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
                        {benefits.map((benefit, index) => (
                            <StaggerItem key={index}>
                                <div className="h-full p-6 rounded-2xl bg-card border border-border">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary mb-2">{benefit.title}</h3>
                                    <p className="text-sm text-text-secondary">{benefit.description}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Was ist inklusive */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Basis-Funktionen */}
                        <div>
                            <AnimatedSection animation="slideUp">
                                <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
                                    Im Basispreis inklusive
                                </h2>
                                <div className="grid grid-cols-1 gap-3">
                                    {baseFunctions.map((func, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                            <span className="text-text-primary text-sm">{func}</span>
                                        </div>
                                    ))}
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* Erweiterungen */}
                        <div>
                            <AnimatedSection animation="slideUp">
                                <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
                                    Optionale Erweiterungen
                                </h2>
                                <div className="space-y-3">
                                    {extensions.map((ext, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                                            <span className="text-text-primary text-sm">{ext.name}</span>
                                            <span className="text-primary font-medium text-sm">{ext.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </div>
            </section>

            {/* Alternative Lösungen */}
            <section className="py-12 lg:py-16 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                            Weitere Telefonie-Lösungen
                        </h2>
                        <p className="text-text-secondary">
                            Neben Peoplefone bieten wir auch andere Systeme an
                        </p>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {alternativeSolutions.map((solution, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -5 }}
                                className="p-6 rounded-2xl bg-card border border-border text-center"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                    {solution.icon}
                                </div>
                                <h3 className="font-bold text-text-primary mb-2">{solution.name}</h3>
                                <p className="text-sm text-text-secondary">{solution.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Preisübersicht */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Preisübersicht
                        </h2>
                        <p className="text-text-secondary">
                            Peoplefone Hosted – monatliche Fixpreise, keine versteckten Kosten
                        </p>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {/* Benutzerpakete */}
                        <div className="p-5 rounded-2xl bg-card border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-text-primary">Benutzerpakete</h3>
                            </div>
                            <div className="space-y-2">
                                {pricingModules.userPackages.map((pkg, index) => (
                                    <div key={index} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                                        <span className="text-xs text-text-secondary">{pkg.range}</span>
                                        <span className="font-bold text-primary text-sm">{pkg.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tarifmodelle */}
                        <div className="p-5 rounded-2xl bg-card border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <Phone className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-text-primary">Tarifmodelle</h3>
                            </div>
                            <div className="space-y-2">
                                {pricingModules.tariffs.map((tariff, index) => (
                                    <div key={index} className="py-1.5 border-b border-border last:border-0">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-text-primary text-xs">{tariff.name}</span>
                                            <span className="font-bold text-primary text-sm">{tariff.price}</span>
                                        </div>
                                        <p className="text-xs text-text-secondary mt-0.5">{tariff.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Telefonnummern */}
                        <div className="p-5 rounded-2xl bg-card border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <Hash className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-text-primary">Telefonnummern</h3>
                            </div>
                            <div className="space-y-2">
                                {pricingModules.phoneNumbers.map((num, index) => (
                                    <div key={index} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                                        <span className="text-xs text-text-secondary">{num.range}</span>
                                        <span className="font-bold text-primary text-sm">{num.price}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-text-secondary mt-3">pro Monat</p>
                        </div>

                        {/* Internet & TV */}
                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary">
                            <div className="flex items-center gap-3 mb-4">
                                <Tv className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-text-primary">Internet & TV</h3>
                            </div>
                            <div className="space-y-2">
                                {pricingModules.internetTV.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                                        <span className="text-xs text-text-primary">{item.name}</span>
                                        <span className="font-bold text-primary text-sm">{item.price}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 p-2 rounded-lg bg-primary/10">
                                <p className="text-xs font-medium text-primary">
                                    Kombi: Internet + IP = CHF 59.–/Mo
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-8">
                        <a
                            href="https://cloud-telefonanlagen.ch#rechner"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                        >
                            Kosten für Ihre Konfiguration berechnen
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>

            {/* Regionen */}
            {showRegionalLinks && (
                <section className="py-12 lg:py-16 bg-surface">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                                Cloud-Telefonie in Ihrer Region
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
                        Bereit für moderne Telefonie?
                    </h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                        Kostenloses Erstgespräch – wir beraten Sie unverbindlich zu Ihrer idealen Lösung.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="bg-white text-primary hover:bg-white/90"
                            asChild
                        >
                            <Link href="/kontakt">
                                Beratung anfordern
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-white text-white hover:bg-white hover:text-primary"
                            asChild
                        >
                            <a href="tel:+41522221818">
                                <Phone className="w-5 h-5" />
                                052 222 18 18
                            </a>
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
