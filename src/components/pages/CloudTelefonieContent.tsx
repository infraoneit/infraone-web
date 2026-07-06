'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Cloud, Globe, Wifi, Users, Calculator, CheckCircle, ArrowRight, ExternalLink, Shield, Zap, Smartphone, Building2, Headphones, Settings, Tv, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { FAQList } from '@/components/ui/FAQList';
import { globalFaqs, pricingModules } from '@/data/telefonie';

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

// Optionale Erweiterungen (Zusatzoptionen zu vPBX Basic; bei vPBX Plus bereits inklusive)
const extensions = [
    { name: 'Softphone-Lizenzen (PC/Mac-App)', price: 'CHF 5.–/User/Monat (bei vPBX Plus inklusive)' },
    { name: 'Zusätzliche Warteschlaufe (Queue)', price: 'CHF 5.–/Monat' },
    { name: 'Zusätzliches IVR (Sprachmenü)', price: 'CHF 5.–/Monat' },
    { name: 'CRM-Integration', price: 'Auf Anfrage' },
    { name: 'Callcenter-Funktionen', price: 'Auf Anfrage' },
    { name: 'Gesprächsaufzeichnung', price: 'Auf Anfrage' },
];

// Alte Pricing Modules entfernt, da importiert aus data/telefonie.ts

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

// Cloud-Telefonie Region-Daten kommen jetzt aus JSON-Files in
// content/leistungen/cloud-telefonie-regions/. Hub-Modus nutzt hubDefaultData unten.
import type { CloudTelefonieRegionData } from '@/lib/leistungen';

const hubDefaultData: CloudTelefonieRegionData = {
    slug: 'default',
    name: 'Schweiz',
    headline: 'Cloud-Telefonanlagen',
    subheadline: 'VoIP-Telefonie für Schweizer KMU',
    description: 'Wartungsfreie Cloud-Telefonanlagen mit Peoplefone für Schweizer KMU.',
    intro: 'In der Schweiz setzen immer mehr Unternehmen auf Cloud-Telefonie. Die Vorteile liegen auf der Hand: Keine wartungsintensive Hardware vor Ort, flexible Arbeitsplätze im Homeoffice, und professionelle Telefonielösungen zu planbaren Kosten. Als zertifizierter Peoplefone-Partner beraten wir Sie unabhängig und finden die optimale Lösung für Ihr Unternehmen. Von der Einmann-Firma bis zum 50-Personen-Betrieb, wir kennen die Anforderungen von Schweizer KMU.',
    regionalImage: '/images/hero_telefonie_1768423192251.png',
    localBenefits: ['Keine Hardware', 'Wartungsfrei', 'Flexibles Homeoffice', 'Schweizer Rechenzentren'],
    stats: [{ label: 'Umgestellte Anlagen', value: '80+' }, { label: 'Zufriedene Kunden', value: '98%' }],
    localFaq: { question: 'Kann ich meine bestehende Nummer behalten?', answer: 'Ja. Wir portieren Ihre bestehenden Festnetz- und Mobilnummern zu Peoplefone. Der Prozess dauert meist 5 bis 10 Arbeitstage und läuft unterbrechungsfrei.' },
    localIndustries: [],
    additionalFaqs: [],
    whyChooseUs: '',
    metaTitle: '',
    metaDescription: '',
    keywords: [],
};


interface CloudTelefonieContentProps {
    /**
     * Region-Daten aus content/leistungen/cloud-telefonie-regions/<slug>.json.
     * Wenn nicht gesetzt, rendert die Komponente den Hub-Modus mit hubDefaultData.
     */
    data?: CloudTelefonieRegionData;
    showRegionalLinks?: boolean;
}

export function CloudTelefonieContent({ data, showRegionalLinks = true }: CloudTelefonieContentProps) {
    const isHubPage = !data;
    const content = data ?? hubDefaultData;
    const regionSlug = data?.slug;
    const title = content.headline;

    const regions = [
        { name: 'Zürich', href: '/cloud-telefonie/zuerich' },
        { name: 'Winterthur', href: '/cloud-telefonie/winterthur' },
        { name: 'Schaffhausen', href: '/cloud-telefonie/schaffhausen' },
        { name: 'Thurgau', href: '/cloud-telefonie/thurgau' },
        { name: 'St. Gallen', href: '/cloud-telefonie/st-gallen' },
        { name: 'Rapperswil', href: '/cloud-telefonie/rapperswil' },
    ].filter(r => !regionSlug || !r.href.includes(regionSlug));

    // Combine Global (Hub) FAQs + Local FAQ + Additional FAQs
    const combinedFaqs = [
        ...globalFaqs,
        content.localFaq,
        ...(content.additionalFaqs || [])
    ];

    return (
        <>
            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                {/* Background Image - dezent wie bei IT-Support SEO Seiten */}
                <div className="absolute inset-0 opacity-10">
                    <Image src="/images/hero_telefonie_1768423192251.png" alt="Cloud-Telefonie und VoIP-Arbeitsplatz in einem Schweizer Buero" fill className="object-cover" priority aria-hidden="true" />
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
                                    src={content.regionalImage || '/images/hero_telefonie_1768423192251.png'}
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
                            <p className="text-4xl md:text-5xl font-bold">CHF 151.–</p>
                            <p className="text-sm opacity-80">pro Monat, Flatrate inklusive</p>
                        </div>
                        <p className="mt-4 text-sm opacity-70">
                            Mit vPBX Plus für volle Funktionalität. Zzgl. einmaliger Installation & Portierung.
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

            {/* Vereinfachte Preisübersicht für Regionalseiten */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Transparentes Pricing
                        </h2>
                        <p className="text-text-secondary">
                            Keine versteckten Kosten. Volle Flexibilität.
                        </p>
                    </AnimatedSection>

                    <div className="max-w-4xl mx-auto bg-card rounded-3xl border border-border p-8 lg:p-12 text-center shadow-lg">
                        <h3 className="text-2xl font-bold text-text-primary mb-4">Flatrate-Modelle für KMU</h3>
                        <p className="text-text-secondary mb-8 max-w-xl mx-auto">
                            Starten Sie ab <strong>CHF 15.– pro Monat</strong> (vPBX Basic, 1 bis 5 Benutzer pauschal). Wählen Sie zwischen Pay-as-you-go oder attraktiven Flatrates für die Schweiz und EU.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="primary" size="lg" asChild>
                                <Link href="/cloud-telefonie#preise">
                                    Alle Preise & Pakete ansehen
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <a href="https://cloud-telefonanlagen.ch#rechner" target="_blank" rel="noopener noreferrer">
                                    <Calculator className="w-5 h-5" />
                                    Online-Rechner
                                </a>
                            </Button>
                        </div>
                        <p className="text-xs text-text-secondary mt-6">
                            Bereits über 80 Unternehmen vertrauen auf unsere fairen Konditionen.
                        </p>
                    </div>
                </div>
            </section>


            {/* Regional Industries - Only on Spoke pages */}
            {regions.length > 0 && content.localIndustries && content.localIndustries.length > 0 && (
                <section className="py-12 lg:py-16 bg-background border-t border-border">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                                Branchenlösungen für {content.headline.replace('Cloud-Telefonie ', '')}
                            </h2>
                            <p className="text-text-secondary max-w-2xl mx-auto">
                                Wir kennen die spezifischen Anforderungen lokaler Branchen.
                            </p>
                        </AnimatedSection>
                        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {content.localIndustries.map((industry, index) => (
                                <div key={index} className="p-6 rounded-2xl bg-surface border border-border">
                                    <h3 className="font-bold text-text-primary mb-2">{industry.name}</h3>
                                    <p className="text-sm text-text-secondary">{industry.need}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Regional FAQs */}
            <section className="py-16 lg:py-24 bg-surface border-t border-border">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                            Häufige Fragen zu Cloud-Telefonie in {content.headline.replace('Cloud-Telefonie ', '')}
                        </h2>
                    </AnimatedSection>
                    <div className="max-w-3xl mx-auto">
                        <FAQList items={combinedFaqs} />
                    </div>
                </div>
            </section>

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

            {/* Regionen - Links (nur auf Hub Seite anzeigen oder am Ende von Spokes) */}
            {showRegionalLinks && (
                <section className="py-12 lg:py-16 bg-surface border-t border-border">
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
        </>
    );
}
