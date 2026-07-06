import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Cloud, Globe, Users, Calculator, CheckCircle, ArrowRight, ExternalLink, Shield, Zap, Building2, Settings, Tv, Hash, Mail, Voicemail, Plug, Headphones, LayoutGrid, Clock, CalendarClock, Smartphone, Mic, MessageSquare } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { FAQList } from '@/components/ui/FAQList';
import { 
    generateHubServiceSchema, 
    generateWebPageSchema, 
    generateBreadcrumbListSchema, 
    generateFAQSchema,
    generateItemListSchema,
} from '@/lib/seo/schema';
import { globalFaqs, pricingModules } from '@/data/telefonie';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Cloud-Telefonanlagen Schweiz | VoIP für KMU | Peoplefone & 3CX',
    description: 'Cloud-Telefonanlagen für Schweizer KMU: VoIP mit Peoplefone & 3CX. Komplettpaket ab CHF 151/Monat inkl. Internet & Flatrate. Kostenrechner & Support aus Winterthur.',
    keywords: ['Cloud Telefonanlage Schweiz', 'VoIP KMU', 'Peoplefone', '3CX', 'Business Telefonie'],
    alternates: {
        canonical: 'https://infraone.ch/cloud-telefonie',
        languages: {
            'de-CH': 'https://infraone.ch/cloud-telefonie',
        },
    },
};

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

// Peoplefone vPBX Feature-Highlights (zentrales Verkaufsargument)
const peoplefoneFeatures = [
    {
        icon: <Mail className="w-6 h-6" />,
        title: 'Fax2Mail',
        description: 'Eingehende Faxe landen automatisch als PDF in Ihrem E-Mail-Posteingang. Kein eigenes Faxgerät mehr nötig.',
    },
    {
        icon: <Voicemail className="w-6 h-6" />,
        title: 'Voicemail-to-E-Mail',
        description: 'Verpasste Anrufe kommen als Audio-Datei und Transkription per E-Mail. Sie hören Nachrichten unterwegs ab.',
    },
    {
        icon: <Plug className="w-6 h-6" />,
        title: 'CRM-API-Integration',
        description: 'Offene API-Schnittstellen für Bexio, Salesforce, HubSpot, Dynamics 365 und individuelle Anbindungen.',
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: 'Rufgruppen & Sammelanschlüsse',
        description: 'Eingehende Anrufe klingeln gleichzeitig oder sequenziell auf mehreren Nebenstellen.',
    },
    {
        icon: <Headphones className="w-6 h-6" />,
        title: 'Hersteller-Kompatibilität',
        description: 'Yealink, Snom, Fanvil, Cisco, Polycom, DECT-Systeme – Sie wählen die Hardware, die zu Ihnen passt.',
    },
    {
        icon: <LayoutGrid className="w-6 h-6" />,
        title: 'Zentrale Web-Verwaltungsplattform',
        description: 'Alle Nebenstellen, Tarife, Sprachmenüs und Statistiken über ein modernes Web-Portal verwalten.',
    },
    {
        icon: <Globe className="w-6 h-6" />,
        title: 'Günstige Tarife In- und Ausland',
        description: 'Flatrate Schweiz und EU, transparente Minutentarife international. Kostenlos zwischen Peoplefone-Kunden.',
    },
    {
        icon: <Clock className="w-6 h-6" />,
        title: 'Warteschlaufen',
        description: 'Eingehende Anrufer hören Musik und Position-Ansagen, bis ein Mitarbeitender frei ist.',
    },
    {
        icon: <CalendarClock className="w-6 h-6" />,
        title: 'Zeitgesteuerte Ansagen',
        description: 'Tag-/Nacht-Schaltung, Feiertags-Modi und individuelle Regeln nach Wochentag oder Uhrzeit.',
    },
    {
        icon: <Settings className="w-6 h-6" />,
        title: 'Endgeräte-Provisionierung',
        description: 'Neue IP-Telefone werden zentral konfiguriert und ausgeliefert. Plug & Play für Ihre Mitarbeitenden.',
    },
    {
        icon: <Smartphone className="w-6 h-6" />,
        title: 'Mobile- und Desktop-App',
        description: 'Telefonieren ab iPhone, Android, Windows und Mac mit der Geschäftsnummer. Im Büro, Homeoffice oder unterwegs.',
    },
    {
        icon: <Mic className="w-6 h-6" />,
        title: 'Audiokonferenzen',
        description: 'Mehrere Teilnehmende in einer Konferenz, optional mit PIN-Schutz und geplanten Räumen.',
    },
    {
        icon: <MessageSquare className="w-6 h-6" />,
        title: 'Interaktive Sprachmenüs (IVR)',
        description: '"Drücken Sie 1 für Verkauf, 2 für Support" – mehrstufige Sprachmenüs für strukturierte Anrufverteilung.',
    },
];

// Alternative Cloud-Telefonie-Varianten als eigenständige Spokes mit eigener SEO.
const alternativeSolutions = [
    {
        icon: <Settings className="w-6 h-6" />,
        name: '3CX',
        description: 'Cloud, Hosted oder lokal mit KI- und Collaboration-Integration',
        href: '/cloud-telefonie/3cx',
    },
    {
        icon: <Users className="w-6 h-6" />,
        name: 'Microsoft Teams',
        description: 'Anrufe direkt aus Teams, mit Schweizer SIP-Trunk',
        href: '/cloud-telefonie/ms-teams',
    },
    {
        icon: <Building2 className="w-6 h-6" />,
        name: 'Yeastar',
        description: 'Cloud oder On-Premise, ideal für Mitel-Migrationen',
        href: '/cloud-telefonie/yeastar',
    },
];

const regions = [
    { name: 'Zürich', href: '/cloud-telefonie/zuerich' },
    { name: 'Winterthur', href: '/cloud-telefonie/winterthur' },
    { name: 'Schaffhausen', href: '/cloud-telefonie/schaffhausen' },
    { name: 'Thurgau', href: '/cloud-telefonie/thurgau' },
    { name: 'St. Gallen', href: '/cloud-telefonie/st-gallen' },
    { name: 'Rapperswil', href: '/cloud-telefonie/rapperswil' },
];

export default function CloudTelefoniePage() {
    // Hub Service Schema (ProfessionalService)
    const serviceSchema = generateHubServiceSchema();

    // ItemList Schema (Business-Features)
    const businessFeatures = [
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
    const itemListSchema = generateItemListSchema(businessFeatures, 'Cloud-Telefonie Business-Features');

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/cloud-telefonie`,
        'Cloud-Telefonie',
        'Cloud-Telefonanlagen für Schweizer KMU: VoIP mit Peoplefone & 3CX'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` },
    ]);

    // FAQ Schema
    const faqSchema = generateFAQSchema(globalFaqs);

    return (
        <>
            {/* Hub Service Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            
            {/* ItemList Schema (Business-Features) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            
            {/* WebPage Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />
            
            {/* Breadcrumb Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            
            {/* FAQ Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <Image src="/images/hero_telefonie_1768423192251.png" alt="Cloud-Telefonie und VoIP-Arbeitsplatz in einem Schweizer Buero" fill className="object-cover" priority aria-hidden="true" />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="max-w-xl">
                            <AnimatedSection animation="slideUp">
                                <p className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">
                                    VoIP-Telefonie für Schweizer KMU
                                </p>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
                                    <span className="gradient-text">Cloud-Telefonanlagen</span>{' '}
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
                                    src="/images/hero_telefonie_1768423192251.png"
                                    alt="Cloud Telefonie"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Intro Content */}
            <section className="py-12 lg:py-16 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <AnimatedSection animation="slideUp">
                            <h2 className="text-3xl font-bold text-text-primary mb-4">Cloud-Telefonanlagen</h2>
                            <p className="text-lg text-text-secondary leading-relaxed mb-8">
                                In der Schweiz setzen immer mehr Unternehmen auf Cloud-Telefonie. Die Vorteile liegen auf der Hand: Keine wartungsintensive Hardware vor Ort, flexible Arbeitsplätze im Homeoffice, und professionelle Telefonielösungen zu planbaren Kosten. Als zertifizierter Peoplefone-Partner beraten wir Sie unabhängig und finden die optimale Lösung für Ihr Unternehmen. Von der Einmann-Firma bis zum 50-Personen-Betrieb – wir kennen die Anforderungen von Schweizer KMU.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Benefits */}
                                <div className="p-6 rounded-2xl bg-card border border-border">
                                    <h3 className="font-bold text-text-primary mb-4">Ihre Vorteile</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {['Keine Hardware', 'Wartungsfrei', 'Flexibles Homeoffice', 'Schweizer Rechenzentren'].map((benefit, i) => (
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
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-primary">80+</div>
                                            <div className="text-xs text-text-secondary">Umgestellte Anlagen</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-primary">98%</div>
                                            <div className="text-xs text-text-secondary">Zufriedene Kunden</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Warum Cloud-Telefonie */}
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

            {/* Peoplefone vPBX Features */}
            <section id="peoplefone" className="py-16 lg:py-24 bg-background scroll-mt-24">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12 max-w-3xl mx-auto">
                        <p className="text-sm uppercase tracking-wider text-primary font-medium mb-3">
                            Peoplefone vPBX
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Alle Funktionen, die eine moderne Telefonanlage braucht
                        </h2>
                        <p className="text-text-secondary">
                            Schweizer Rechenzentren, über 80 erfolgreich umgestellte Anlagen, ein zentrales Web-Portal. Vom kleinen KMU bis zur Anlage mit 150 Benutzern – alle Funktionen aus einer Hand.
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-6xl mx-auto" staggerDelay={0.05}>
                        {peoplefoneFeatures.map((feature, index) => (
                            <StaggerItem key={index}>
                                <div className="h-full p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors">
                                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                                        {feature.icon}
                                    </div>
                                    <h3 className="font-bold text-text-primary mb-2">{feature.title}</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>

                    <div className="text-center mt-12">
                        <Button variant="primary" size="lg" asChild>
                            <Link href="/cloud-telefonie#preise">
                                Zu den Preisen
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Pricing Section (Full) */}
            <section id="preise" className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Preisübersicht
                        </h2>
                        <p className="text-text-secondary">
                            Peoplefone Hosted – monatliche Fixpreise, keine versteckten Kosten
                        </p>
                    </AnimatedSection>

                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* vPBX Basic + Plus */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* vPBX Basic */}
                            <div className="p-5 rounded-2xl bg-card border border-border">
                                <div className="flex items-center gap-3 mb-1">
                                    <Phone className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-text-primary">{pricingModules.vpbxBasic.title}</h3>
                                </div>
                                <p className="text-xs text-text-secondary mb-4">{pricingModules.vpbxBasic.subtitle}</p>
                                <div className="space-y-2 mb-4">
                                    {pricingModules.vpbxBasic.tiers.map((tier, index) => (
                                        <div key={index} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                                            <span className="text-xs text-text-secondary">{tier.range}</span>
                                            <span className="font-bold text-primary text-sm">{tier.price}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-border">
                                    <p className="text-xs font-medium text-text-primary mb-2">Funktionen</p>
                                    <ul className="space-y-1">
                                        {pricingModules.vpbxBasic.features.map((feature, i) => (
                                            <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                                                <span className="text-primary mt-0.5">·</span>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* vPBX Plus */}
                            <div className="p-5 rounded-2xl bg-primary/5 border border-primary">
                                <div className="flex items-center gap-3 mb-1">
                                    <Users className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-text-primary">{pricingModules.vpbxPlus.title}</h3>
                                </div>
                                <p className="text-xs text-text-secondary mb-4">{pricingModules.vpbxPlus.subtitle}</p>
                                <div className="space-y-2 mb-4">
                                    {pricingModules.vpbxPlus.tiers.map((tier, index) => (
                                        <div key={index} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                                            <span className="text-xs text-text-secondary">{tier.range}</span>
                                            <span className="font-bold text-primary text-sm">{tier.price}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-border">
                                    <p className="text-xs font-medium text-text-primary mb-2">Funktionen</p>
                                    <ul className="space-y-1">
                                        {pricingModules.vpbxPlus.features.map((feature, i) => (
                                            <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                                                <span className="text-primary mt-0.5">·</span>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Tarife / Nummern / Internet */}
                        <div className="grid md:grid-cols-3 gap-6">
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
                            <div className="p-5 rounded-2xl bg-card border border-border">
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

            {/* Beispielkonfiguration */}
            <section className="py-12 bg-primary">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center text-white">
                        <p className="text-sm uppercase tracking-wider opacity-80 mb-2">Beispielkonfiguration</p>
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">
                            Komplettpaket für 20 Benutzer
                        </h2>
                        <p className="text-sm opacity-90 mb-6">
                            20 Benutzer mit vPBX Plus · 10 Rufnummern · Flatrate CH+EU · 1 Gbit Internet + IP
                        </p>
                        <div className="inline-flex flex-col items-center bg-white/15 rounded-2xl px-8 py-5">
                            <p className="text-4xl md:text-5xl font-bold">CHF 151.–</p>
                            <p className="text-sm opacity-80 mt-1">pro Monat, Flatrate inklusive</p>
                        </div>
                        <p className="mt-4 text-xs opacity-70">
                            Zzgl. einmaliger Installation und Portierung
                        </p>
                    </div>
                </div>
            </section>

            {/* Process-Sektion: 4 Schritte zur neuen Telefonanlage */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            So läuft Ihre Telefonie-Umstellung ab
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Vier Schritte von der Bestandsaufnahme bis zum laufenden Support
                        </p>
                    </AnimatedSection>

                    <div className="max-w-3xl mx-auto">
                        <StaggerContainer className="space-y-6" staggerDelay={0.1}>
                            {[
                                {
                                    title: 'Bestandsaufnahme',
                                    description: 'Wir prüfen Ihre aktuelle Telefonie: wie viele Nebenstellen, welche Tarifkosten, welche Anlage, welche Engpässe. Daraus ergibt sich, ob Cloud, On-Premise oder eine hybride Lösung am besten passt.',
                                },
                                {
                                    title: 'Massgeschneidertes Konzept',
                                    description: 'Auf Basis der Analyse erstellen wir einen konkreten Vorschlag mit Hardware, Tarif, Migrationsplan und Kosten. Sie wissen vorab, was die Umstellung kostet und was sie spart.',
                                },
                                {
                                    title: 'Installation und Portierung',
                                    description: 'Wir richten die neue Anlage ein, portieren bestehende Rufnummern unterbruchfrei und konfigurieren alle Nebenstellen. Bei On-Premise-Anlagen kommen wir vor Ort, bei Cloud-Lösungen läuft die meiste Konfiguration remote.',
                                },
                                {
                                    title: 'Schulung und laufender Support',
                                    description: 'Ihre Mitarbeiter werden im Umgang mit dem System geschult, schriftlich oder vor Ort. Bei Fragen oder Problemen sind wir Ihr direkter Ansprechpartner. Wartungsverträge mit garantierter Reaktionszeit sind möglich.',
                                },
                            ].map((step, index) => (
                                <StaggerItem key={index}>
                                    <div className="flex gap-6 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-text-primary mb-2">
                                                {step.title}
                                            </h3>
                                            <p className="text-text-secondary">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
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
                            <Link
                                key={index}
                                href={solution.href}
                                className="block p-6 rounded-2xl bg-card border border-border text-center transition-all duration-150 hover:-translate-y-1 hover:shadow-lg hover:border-primary/50 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                    {solution.icon}
                                </div>
                                <h3 className="font-bold text-text-primary mb-2">{solution.name}</h3>
                                <p className="text-sm text-text-secondary mb-3">{solution.description}</p>
                                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                    Mehr erfahren
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQs */}
            <section className="py-16 lg:py-24 bg-surface border-t border-border">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Häufige Fragen
                        </h2>
                    </AnimatedSection>
                    <div className="max-w-3xl mx-auto">
                        <FAQList items={globalFaqs} />
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

            {/* Regionen Links */}
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
        </>
    );
}
