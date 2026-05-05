import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Cloud, Globe, Wifi, Users, Calculator, CheckCircle, ArrowRight, ExternalLink, Shield, Zap, Smartphone, Building2, Headphones, Settings, Tv, Hash } from 'lucide-react';
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
    description: 'Cloud-Telefonanlagen für Schweizer KMU: VoIP mit Peoplefone & 3CX. Komplettpaket ab CHF 131/Monat inkl. Internet & Flatrate. Kostenrechner & Support aus Winterthur.',
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

// Alternative Lösungen mit Anker-Links zu den Detailsektionen weiter unten.
// Vorbereitet für künftige eigenständige Spokes /cloud-telefonie/3cx,
// /cloud-telefonie/yeastar, /cloud-telefonie/ms-teams.
const alternativeSolutions = [
    {
        icon: <Settings className="w-6 h-6" />,
        name: '3CX',
        description: 'Cloud, Hosted oder lokal mit KI- und Collaboration-Integration',
        href: '#3cx',
    },
    {
        icon: <Users className="w-6 h-6" />,
        name: 'MS Teams Telefonie',
        description: 'Anrufe direkt aus Teams, mit Schweizer SIP-Trunk',
        href: '#ms-teams',
    },
    {
        icon: <Building2 className="w-6 h-6" />,
        name: 'Yeastar',
        description: 'Cloud oder On-Premise, ideal für Mitel-Migrationen',
        href: '#yeastar',
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
                    <Image src="/images/hero_telefonie_1768423192251.png" alt="" fill className="object-cover" priority />
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
                            <a
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
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3CX Detail-Sektion - Anker fuer kuenftigen Spoke /cloud-telefonie/3cx */}
            <section id="3cx" className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <AnimatedSection animation="slideUp">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                    <Settings className="w-7 h-7" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                                    3CX: Cloud, Hosted oder lokal mit KI-Integration
                                </h2>
                            </div>
                            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                                3CX ist eine flexible IP-Telefonanlage, die in drei Varianten betrieben werden kann: als günstigste Hosted-Variante in europäischen Rechenzentren direkt von 3CX, als Cloud-Hosting bei einem Schweizer Provider oder als On-Premise-Installation auf eigenem Server. So lässt sich für jede Grösse und jedes Datenschutz-Bedürfnis die passende Variante wählen.
                            </p>
                            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
                                <h3 className="font-bold text-text-primary mb-4">Stärken von 3CX im Überblick</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {[
                                        'Native Integration mit Microsoft Teams, Google Workspace und gängigen CRM-Systemen',
                                        'KI-gestützte Funktionen wie Live-Transkription, Gesprächs-Zusammenfassungen und Voicebots modular einbindbar',
                                        'Web- und Desktop-Client, mobile Apps für iOS und Android, Browser-Telefonie ohne Plugin',
                                        'Lizenzkosten benutzerunabhängig: ab etwa 30 Mitarbeitern besonders wirtschaftlich',
                                        'Callcenter-Funktionen mit Warteschlangen, IVR, Reporting und Skill-based Routing',
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-text-secondary">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-text-secondary leading-relaxed">
                                Wir setzen 3CX für KMU mit 20 bis 200 Benutzern ein, für Multi-Standort-Setups und für Unternehmen, die ihre Telefonie eng mit Teams, einem CRM oder KI-Tools verzahnen wollen.
                            </p>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Yeastar Detail-Sektion - Anker fuer kuenftigen Spoke /cloud-telefonie/yeastar */}
            <section id="yeastar" className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <AnimatedSection animation="slideUp">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-7 h-7" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                                    Yeastar: Cloud oder On-Premise, ideal für Mitel-Migrationen
                                </h2>
                            </div>
                            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                                Yeastar ist eine vielseitige Telefonanlage, die wahlweise lokal als Hardware-Box, in der Cloud oder als hybride Lösung betrieben werden kann. Sie gilt als besonders einfach in der Bedienung und ist breit kompatibel mit gängigen SIP-Trunks und Endgeräten.
                            </p>
                            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
                                <h3 className="font-bold text-text-primary mb-4">Wann sich Yeastar besonders lohnt</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {[
                                        'Migration von alten Mitel-Anlagen: Yeastar ist die einzige aktuelle Anlage, die Mitels proprietäre Protokolle unterstützt. Bestehende Mitel-Endgeräte bleiben nutzbar.',
                                        'Branchen mit strengen Compliance-Vorgaben, wo Sprachdaten das eigene Netzwerk nicht verlassen dürfen',
                                        'Standorte mit instabiler Internetanbindung, wo eine reine Cloud-Lösung Risiken birgt',
                                        'Unternehmen, die ihre bestehenden ISDN- oder Analog-Anschlüsse weiter mitnutzen möchten',
                                        'KMU, die einmal investieren wollen statt monatlich zu bezahlen',
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-text-secondary">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-text-secondary leading-relaxed">
                                Die S-Serie von Yeastar ist für 5 bis 500 Nebenstellen ausgelegt und unterstützt sowohl SIP-Trunks als auch klassische Anschlüsse. Wir übernehmen Planung, Installation, Konfiguration und laufenden Support. Hybride Setups sind möglich, bei denen ein Teil der Mitarbeiter über Yeastar und ein anderer über Cloud-Telefonie kommuniziert.
                            </p>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Microsoft Teams Detail-Sektion - Anker fuer kuenftigen Spoke /cloud-telefonie/ms-teams */}
            <section id="ms-teams" className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <AnimatedSection animation="slideUp">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                    <Users className="w-7 h-7" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                                    Microsoft Teams als Telefonanlage
                                </h2>
                            </div>
                            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                                Wer mit Microsoft 365 arbeitet, kann Teams als vollwertige Telefonanlage einsetzen. Anrufe gehen direkt aus dem Teams-Client heraus, eingehend wie ausgehend, mit der Geschäftsnummer.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-card border border-border rounded-2xl p-6">
                                    <h3 className="font-bold text-text-primary mb-3">Direct Routing über Peoplefone</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        Sie behalten Ihren Schweizer Anbieter, telefonieren aber durch Teams. Diese Variante ist meist günstiger als ein Microsoft Calling Plan und lässt mehr Flexibilität bei den Tarifen.
                                    </p>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-6">
                                    <h3 className="font-bold text-text-primary mb-3">3CX als Teams-Gateway</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        Wenn bereits eine 3CX-Anlage vorhanden ist, kann Teams als zusätzlicher Endpunkt eingebunden werden. Mitarbeiter können wahlweise das Tischtelefon, die 3CX-App oder Teams nutzen.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
                                <h3 className="font-bold text-text-primary mb-3">Ihr Vorteil</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    Chat, Videocall und Telefonie laufen über dieselbe Anwendung. Mitarbeiter im Homeoffice brauchen kein separates Softphone, IT-Verantwortliche pflegen nur eine Plattform statt zwei.
                                </p>
                            </div>
                            <p className="text-text-secondary leading-relaxed">
                                Voraussetzungen sind eine geeignete Microsoft-365-Lizenz (Business Premium oder E3 mit Phone-Add-On) und eine SIP-Anbindung. Wir übernehmen die komplette Einrichtung inklusive Rufnummern-Portierung und Schulung.
                            </p>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Process-Sektion: 4 Schritte zur neuen Telefonanlage */}
            <section className="py-16 lg:py-24 bg-surface">
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
