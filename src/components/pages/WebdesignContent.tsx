'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
    Check, ArrowRight, Code, Rocket, Palette, Star, ExternalLink, ChevronDown, Blocks, FileCode, Zap, Target, Sparkles, Wrench,
    Factory, Stethoscope, ShoppingBag, Landmark, Palette as PaletteIcon, Lightbulb, Cpu,
    Wine, Plane, Hammer, Users, Utensils, Apple, Ship, Shirt, CalendarDays, Music, 
    Pill, FlaskConical, Truck, Hotel, Heart, Clock, Mountain, HardHat, Bitcoin, Building2, GraduationCap
} from 'lucide-react';
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
        url: 'https://www.schaltkraft.ch',
        description: 'Elektroinstallationen & Gebäudetechnik',
        quote: 'Unsere neue Website fühlt sich endlich so professionell an wie unsere Arbeit. Die Seite ist klar aufgebaut, schnell und auf das Wesentliche reduziert. Wir wurden von Anfang an verstanden und konnten unsere Inhalte Schritt für Schritt gemeinsam sauber aufbauen. Änderungen sind heute unkompliziert möglich, genau so wie wir es wollten.',
        author: 'Albert Sulejmani',
        role: 'CEO Schaltkraft AG',
        image: '/images/webdesign-referenzen/website-referenz-industrie.jpg',
    },
    {
        name: 'Elektro-Tel AG',
        url: 'https://www.elektro-tel.ch',
        description: 'Elektro & Telekommunikation',
        quote: 'Von der ersten Idee bis zur fertigen Website lief alles strukturiert und transparent. Die neue Seite ist modern, übersichtlich und leicht zu pflegen. Besonders schätzen wir, dass wir Inhalte selbst anpassen können, ohne jedes Mal extern Hilfe zu brauchen.',
        author: 'Salvatore Irrera',
        role: 'Inhaber Elektro-Tel AG',
        image: '/images/webdesign-referenzen/website-referenz-handwerk.jpg',
    },
    {
        name: 'Höppli Architektur GmbH',
        url: 'https://winterthur-architekten.netlify.app',
        description: 'Architektur & Planung, Winterthur',
        quote: 'Die Website wurde extrem schnell umgesetzt und bringt unsere Projekte genau so zur Geltung, wie wir es uns vorgestellt haben. Klare Gestaltung, einfache Bedienung und ein sehr gutes Preis-Leistungs-Verhältnis. Wir sind rundum zufrieden.',
        author: 'Peer Höppli',
        role: 'Gründer',
        image: '/images/webdesign-referenzen/website-referenz-architektur.jpg',
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

// Hub-Daten (verwendet wenn data prop nicht gesetzt = Hub-Modus).
// Spoke-Daten kommen aus JSON-Files in content/leistungen/webdesign-regions/.
import type { WebdesignRegionData } from '@/lib/leistungen';

const hubDefaultData: WebdesignRegionData = {
    slug: 'default',
    name: 'Schweiz',
    headline: 'Webdesign Schweiz',
    subheadline: 'Moderne Websites für Schweizer Unternehmen',
    description: 'Von der einfachen Visitenkarte bis zur komplexen Web-Applikation, wir designen und entwickeln Websites, die überzeugen und verkaufen.',
    intro: 'Die Schweiz ist ein Land der KMU. Über 99% aller Unternehmen sind kleine und mittlere Betriebe, die das Rückgrat unserer Wirtschaft bilden. Genau für diese Unternehmen entwickeln wir Websites: pragmatisch, bezahlbar und mit echtem Mehrwert. Unser Team in Winterthur betreut Kunden in der gesamten Deutschschweiz, persönlich und auf Augenhöhe.',
    regionalImage: '/images/webdesign-hero.png',
    localBenefits: ['Schweizer Qualität', 'Persönliche Betreuung', 'Faire Preise', 'Schnelle Umsetzung'],
    stats: [{ label: 'Projekte', value: '150+' }, { label: 'Zufriedene Kunden', value: '98%' }],
    localFaq: { question: 'Betreuen Sie auch Kunden ausserhalb der Deutschschweiz?', answer: 'Ja, wir arbeiten remote mit Kunden in der ganzen Schweiz zusammen. Persönliche Treffen sind in den meisten Fällen nicht nötig.' },
    localIndustries: [],
    additionalFaqs: [],
    whyChooseUs: '',
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    hasPhysicalLocation: false,
    areaServed: [],
};


interface WebdesignContentProps {
    /**
     * Region-Daten aus content/leistungen/webdesign-regions/<slug>.json.
     * Wenn nicht gesetzt, rendert die Komponente den Hub-Modus mit hubDefaultData.
     */
    data?: WebdesignRegionData;
    showRegionalLinks?: boolean;
}

// Icon-Mapping-Funktion für Branchen
const getIndustryIcon = (industryName: string) => {
    const iconMap: Record<string, any> = {
        'Maschinenbau & Industrie': Factory,
        'Gesundheit & Medizintechnik': Stethoscope,
        'Einzelhandel & Gastronomie': ShoppingBag,
        'Tech-Startups & Innovation': Lightbulb,
        'Finanzdienstleistungen': Landmark,
        'Kreativagenturen & Design': PaletteIcon,
        'Tech & Startups': Cpu,
        'Beratung & Consulting': Users,
        'Industrie & Produktion': Factory,
        'Weinbau & Landwirtschaft': Wine,
        'Tourismus & Rheinfall': Plane,
        'Handwerk & Gewerbe': Hammer,
        'Hotellerie & Gastronomie': Utensils,
        'Obstbau & Direktvermarktung': Apple,
        'Handwerk & Bau': Hammer,
        'Bootsbau & Wassersport': Ship,
        'Textil & Mode': Shirt,
        'Finanzwesen & Versicherungen': Landmark,
        'Gastronomie & Veranstaltungen': CalendarDays,
        'Beratung & Dienstleistungen': Users,
        'Bundesverwaltung & NGOs': Building2,
        'Tourismus & UNESCO-Welterbe': Plane,
        'Bildung & Forschung': GraduationCap,
        'Kulturinstitutionen & Museen': Music,
        'Pharma & Life Sciences': Pill,
        'Chemie & Industrie': FlaskConical,
        'Kunst & Galerien': PaletteIcon,
        'Logistik & Rheinhafen': Truck,
        'Hotellerie & Luxus-Tourismus': Hotel,
        'Ausflugsschifffahrt & Wassersport': Ship,
        'Kultur & Event-Locations': Music,
        'Gesundheit & Wellness': Heart,
        'Energie & Cleantech': Zap,
        'Logistik & Industrie': Truck,
        'Gesundheitswesen & Kliniken': Stethoscope,
        'Handwerk & KMU': Wrench,
        'Blockchain & Crypto': Bitcoin,
        'Unternehmensberatung': Users,
        'Tech-Konzerne & Innovation': Cpu,
        'Uhrenindustrie & Präzision': Clock,
        'Gesundheit & Kliniken': Stethoscope,
        'Tourismus & Barockstadt': Plane,
        'Gewerbe & Handwerk': Hammer,
        'Luxushotellerie & Resorts': Hotel,
        'Skischulen & Bergbahnen': Mountain,
        'Gastronomie & Kulinarik': Utensils,
        'Bau & Energietechnik': HardHat,
    };
    return iconMap[industryName] || Factory;
};

export function WebdesignContent({ data, showRegionalLinks = true }: WebdesignContentProps) {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const isHubPage = !data;
    const content = data ?? hubDefaultData;
    const regionSlug = data?.slug;

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
                        alt="Webdesign und moderne Website-Entwicklung am Arbeitsplatz"
                        fill
                        className="object-cover"
                        priority
                        aria-hidden="true"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <AnimatedSection animation="slideUp">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 leading-tight">
                                <span className="gradient-text">{content.headline}</span>
                            </h1>
                            <p className="text-2xl md:text-3xl text-primary font-medium mb-6 leading-snug">
                                {content.subheadline}
                            </p>
                            <p className="text-xl text-text-secondary max-w-xl mb-10 leading-relaxed">
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
                                    src={content.regionalImage || '/images/webdesign-hero.png'}
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
                    <div>
                        <AnimatedSection animation="slideUp">
                            <p className="text-xl text-text-secondary leading-relaxed mb-10">
                                {content.intro}
                            </p>

                            {/* Local Benefits & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Benefits */}
                                <div className="p-8 rounded-2xl bg-card border border-border">
                                    <h3 className="text-xl font-bold text-text-primary mb-6">Ihre Vorteile</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {content.localBenefits.map((benefit, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                                <span className="text-base text-text-secondary">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="p-8 rounded-2xl bg-primary/5 border border-primary">
                                    <h3 className="text-xl font-bold text-text-primary mb-6">In Zahlen</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        {content.stats.map((stat, i) => (
                                            <div key={i} className="text-center">
                                                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                                                <div className="text-sm text-text-secondary">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Pricing Section - Differentiated for Hub vs Spoke */}
            <section id="pakete" className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                            {isHubPage ? 'Investition in Ihre digitale Zukunft' : `Webdesign-Pakete für ${content.headline.replace('Webdesign ', '')}`}
                        </h2>
                        <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                            {isHubPage
                                ? 'Faire Preise, keine Überraschungen. Jedes Projekt beginnt mit einem kostenlosen Erstgespräch.'
                                : 'Dieselbe Qualität, angepasst an Ihre regionalen Bedürfnisse.'}
                        </p>
                    </AnimatedSection>

                    {isHubPage ? (
                        /* Hub: Full detailed packages */
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {packages.map((pkg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.15, duration: 0.3 }}
                                    whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.15 } }}
                                    className={`relative p-10 rounded-3xl border-2 ${pkg.popular
                                        ? 'bg-gradient-to-br from-primary via-primary to-primary/90 text-white border-primary shadow-2xl shadow-primary/30 scale-105'
                                        : 'bg-gradient-to-br from-card to-surface border-border hover:border-primary hover:shadow-2xl'
                                        } transition-all duration-200`}
                                >
                    {pkg.popular && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white text-primary text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                            Beliebt
                        </div>
                    )}

                                    <div className="text-center mb-8">
                                        <h3 className={`text-3xl font-bold mb-3 ${pkg.popular ? 'text-white' : 'text-text-primary'}`}>
                                            {pkg.name}
                                        </h3>
                                        <div className={`text-5xl font-extrabold mb-3 ${pkg.popular ? 'text-white' : 'text-primary'}`}>
                                            {pkg.price}
                                        </div>
                                        <p className={`text-base mb-4 ${pkg.popular ? 'text-white/90' : 'text-text-secondary'}`}>
                                            {pkg.description}
                                        </p>
                                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${pkg.popular ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'}`}>
                                            {pkg.platforms}
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-10">
                                        {pkg.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <Check className={`w-6 h-6 flex-shrink-0 mt-0.5 ${pkg.popular ? 'text-white' : 'text-primary'}`} />
                                                <span className={`text-base leading-relaxed ${pkg.popular ? 'text-white/95' : 'text-text-secondary'}`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        variant={pkg.popular ? 'secondary' : 'primary'}
                                        size="lg"
                                        className={`w-full text-base py-6 ${pkg.popular ? 'bg-white text-primary hover:bg-white/95 shadow-lg' : 'hover:scale-105'} transition-all`}
                                        asChild
                                    >
                                        <Link href="/kontakt">
                                            Jetzt anfragen
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        /* Spoke: Condensed packages with CTA to Hub */
                        <div className="max-w-5xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                {packages.map((pkg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                        className={`p-8 rounded-2xl border-2 text-center ${pkg.popular
                                            ? 'bg-gradient-to-br from-primary to-primary/90 text-white border-primary shadow-xl scale-105'
                                            : 'bg-card border-border hover:border-primary hover:shadow-lg'
                                            } transition-all duration-200`}
                                    >
                                        <h3 className={`text-xl font-bold mb-2 ${pkg.popular ? 'text-white' : 'text-text-primary'}`}>
                                            {pkg.name}
                                        </h3>
                                        <div className={`text-3xl font-extrabold mb-3 ${pkg.popular ? 'text-white' : 'text-primary'}`}>
                                            {pkg.price}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${pkg.popular ? 'text-white/80' : 'text-text-secondary'}`}>
                                            {pkg.features.slice(0, 3).join(' • ')}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="text-center">
                                <Button variant="outline" size="lg" asChild className="hover:scale-105 transition-transform">
                                    <Link href="/webdesign#pakete">
                                        Alle Pakete im Detail ansehen
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Local Industries Section - Only for regional pages */}
            {regionSlug && content.localIndustries && content.localIndustries.length > 0 && (
                <section className="py-12 lg:py-16 bg-background">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                                Webdesign für {content.headline.replace('Webdesign ', '')}er Branchen
                            </h2>
                            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                                Wir verstehen die spezifischen Anforderungen der lokalen Wirtschaft und entwickeln massgeschneiderte Lösungen.
                            </p>
                        </AnimatedSection>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-fr">
                            {content.localIndustries.map((industry, index) => {
                                // Bento-Grid: Variiere die Spaltengröße für visuelle Hierarchie
                                let colSpan = 'md:col-span-2';
                                if (index === 0) colSpan = 'md:col-span-4';
                                else if (index === 2) colSpan = 'md:col-span-3';
                                else if (index === 3) colSpan = 'md:col-span-3';
                                
                                const IconComponent = getIndustryIcon(industry.name);
                                
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.12, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                        whileHover={{ 
                                            y: -6, 
                                            scale: 1.01,
                                            transition: { duration: 0.2, ease: 'easeOut' }
                                        }}
                                        className={`${colSpan} group relative p-10 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-[0_0_40px_rgba(61,150,70,0.12)]`}
                                    >
                                        {/* Subtiler Glow-Effekt mit Primary-Farbe */}
                                        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                                             style={{
                                                 background: 'radial-gradient(circle at center, rgba(61, 150, 70, 0.05) 0%, transparent 70%)'
                                             }}
                                        />
                                        
                                        <div className="relative z-10">
                                            {/* Icon-Container */}
                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-200">
                                                <IconComponent className="w-8 h-8 text-primary" />
                                            </div>
                                            
                                            <h3 className="text-xl font-bold text-text-primary mb-4 group-hover:text-primary transition-colors duration-200">
                                                {industry.name}
                                            </h3>
                                            <p className="text-base text-text-secondary mb-8 leading-relaxed">
                                                {industry.description}
                                            </p>
                                            <div className="pt-6 border-t border-border/60">
                                                <p className="text-sm text-primary font-semibold mb-3">
                                                    Was diese Branche braucht:
                                                </p>
                                                <p className="text-sm text-text-secondary leading-relaxed">
                                                    {industry.websiteNeeds}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {content.whyChooseUs && (
                            <div className="mt-16 text-center">
                                <div className="inline-block p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 max-w-4xl">
                                    {/* Großes Icon oben */}
                                    <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
                                        <Star className="w-10 h-10 text-primary" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold text-text-primary mb-4">
                                        Warum InfraOne für {content.headline.replace('Webdesign ', '')}?
                                    </h3>
                                    
                                    <p className="text-lg text-text-secondary leading-relaxed">
                                        {content.whyChooseUs}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* References Section */}
            <section id="referenzen" className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                            Unsere Referenzen
                        </h2>
                        <p className="text-xl text-text-secondary">Projekte, auf die wir stolz sind</p>
                    </AnimatedSection>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
                        {references.map((ref, index) => (
                            <StaggerItem key={index}>
                                <div className="h-full rounded-2xl bg-card border border-border hover:border-primary transition-colors overflow-hidden">
                                    {ref.image && (
                                        <a href={ref.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden bg-surface">
                                            <Image 
                                                src={ref.image} 
                                                alt={`Website ${ref.name}`} 
                                                width={400} 
                                                height={280} 
                                                className="w-full h-56 object-contain p-4 hover:scale-105 transition-transform duration-200"
                                            />
                                        </a>
                                    )}
                                    <div className="p-6">
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
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>

                    {!isHubPage && (
                        <div className="text-center mt-12">
                            <Link
                                href="/webdesign#referenzen"
                                className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                            >
                                Alle Referenzen auf der Webdesign-Hauptseite ansehen
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Hub-Exclusive: Methodology Section */}
            {isHubPage && (
                <section className="py-16 lg:py-24 bg-surface">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                                So arbeiten wir
                            </h2>
                            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                                Ein strukturierter Prozess für messbare Ergebnisse. Vier Phasen von der Idee bis zum Launch.
                            </p>
                        </AnimatedSection>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {[
                                { step: '01', title: 'Discovery', desc: 'Wir analysieren Ihre Ziele, Zielgruppe und Wettbewerber. Gemeinsam definieren wir die optimale Strategie.', icon: Target },
                                { step: '02', title: 'Design', desc: 'Modernes UI/UX-Design, das Ihre Marke stärkt. Wireframes und interaktive Prototypen zur Freigabe.', icon: Palette },
                                { step: '03', title: 'Entwicklung', desc: 'Sauberer Code, optimierte Performance. Wir bauen mit bewährten Technologien für maximale Stabilität.', icon: Wrench },
                                { step: '04', title: 'Launch', desc: 'Testing, SEO-Feinschliff und Go-Live. Danach: kontinuierliche Optimierung und Support.', icon: Rocket },
                            ].map((phase, index) => {
                                const IconComponent = phase.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                        whileHover={{ 
                                            y: -6, 
                                            scale: 1.01,
                                            transition: { duration: 0.3, ease: 'easeOut' }
                                        }}
                                        className="group relative p-10 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-[0_0_40px_rgba(61,150,70,0.12)]"
                                    >
                                        {/* Subtiler Glow-Effekt mit Primary-Farbe */}
                                        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                                             style={{
                                                 background: 'radial-gradient(circle at center, rgba(61, 150, 70, 0.05) 0%, transparent 70%)'
                                             }}
                                        />
                                        
                                        <div className="relative z-10">
                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-200">
                                                <IconComponent className="w-8 h-8 text-primary" />
                                            </div>
                                            <div className="text-xs font-bold text-primary/60 mb-2">{phase.step}</div>
                                            <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors duration-200">{phase.title}</h3>
                                            <p className="text-base text-text-secondary leading-relaxed">{phase.desc}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Platforms Section */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                            Welche Technologie passt zu Ihnen?
                        </h2>
                        <p className="text-xl text-text-secondary">Wir beraten Sie ehrlich – ohne Buzzwords</p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                                {isHubPage && (
                                    <>
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
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Keystatic Highlight - Hub-only */}
                    {isHubPage && (
                        <div className="mt-12 max-w-5xl mx-auto">
                            <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary">
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
                                                    className="w-full h-auto group-hover:scale-105 transition-transform duration-200"
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
                                                    className="w-full h-auto group-hover:scale-105 transition-transform duration-200"
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
                                                    className="w-full h-auto group-hover:scale-105 transition-transform duration-200"
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
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* FAQs Section */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                            Häufige Fragen
                        </h2>
                    </AnimatedSection>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {isHubPage && faqs.map((faq, index) => (
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
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
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
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Bereit für Ihre neue Website?
                    </h2>
                    <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
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
