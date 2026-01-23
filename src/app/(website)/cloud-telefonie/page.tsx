import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Cloud, Globe, Wifi, Users, Calculator, CheckCircle, ArrowRight, ExternalLink, Shield, Zap, Smartphone, Building2, Headphones, Settings, Tv, Hash } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { FAQList } from '@/components/ui/FAQList';
import { generateHubServiceSchema, generateWebPageSchema, generateBreadcrumbListSchema, generateFAQSchema } from '@/lib/seo/schema';
import { globalFaqs, pricingModules } from '@/data/telefonie';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Cloud-Telefonanlagen Schweiz | VoIP für KMU | Peoplefone & 3CX',
    description: 'Cloud-Telefonanlagen für Schweizer KMU: VoIP mit Peoplefone & 3CX. Komplettpaket ab CHF 131/Monat inkl. Internet & Flatrate. Kostenrechner & Support aus Winterthur.',
    keywords: ['Cloud Telefonanlage Schweiz', 'VoIP KMU', 'Peoplefone', '3CX', 'Business Telefonie'],
    alternates: {
        canonical: 'https://www.infraone.ch/cloud-telefonie',
        languages: {
            'de-CH': 'https://www.infraone.ch/cloud-telefonie',
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

const regions = [
    { name: 'Zürich', href: '/cloud-telefonie/zuerich' },
    { name: 'Winterthur', href: '/cloud-telefonie/winterthur' },
    { name: 'Schaffhausen', href: '/cloud-telefonie/schaffhausen' },
    { name: 'Thurgau', href: '/cloud-telefonie/thurgau' },
    { name: 'St. Gallen', href: '/cloud-telefonie/st-gallen' },
    { name: 'Rapperswil', href: '/cloud-telefonie/rapperswil' },
];

export default function CloudTelefoniePage() {
    // Hub Service Schema
    const serviceSchema = generateHubServiceSchema();

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
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
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
                            <div
                                key={index}
                                className="p-6 rounded-2xl bg-card border border-border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                    {solution.icon}
                                </div>
                                <h3 className="font-bold text-text-primary mb-2">{solution.name}</h3>
                                <p className="text-sm text-text-secondary">{solution.description}</p>
                            </div>
                        ))}
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
