import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, Phone, Tv, Settings, Cloud, Building2, ShoppingBag, Factory, GraduationCap, Monitor, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { MotionCard, MotionCTA } from '@/components/ui/MotionCard';
import { FAQList } from '@/components/ui/FAQList';
import { generateDigitalSignageHubSchema, generateDigitalSignageProductSchema, generateFAQSchema, generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { digitalSignageFaqs } from '@/data/digital-signage-faqs';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Digital Signage Schweiz | Werbebildschirme & Infoscreen ohne Abo',
    description: 'Digital Signage Schweiz ohne Abo-Kosten. Werbebildschirme & Infoscreens mit lokalem Betrieb und Live-Daten Integration. Einmalige Investition, schweizweite Installation.',
    keywords: ['Digital Signage Schweiz', 'Werbebildschirme Schweiz', 'Infoscreen Schweiz', 'Digital Signage', 'Werbedisplay', 'Digitale Beschilderung', 'Infoscreen', 'Digital Signage Winterthur', 'Digital Signage Zürich', 'Digital Signage Ostschweiz'],
    alternates: {
        canonical: 'https://www.infraone.ch/digital-signage',
        languages: {
            'de-CH': 'https://www.infraone.ch/digital-signage',
        },
    },
};

const features = [
    {
        number: '01',
        title: 'Keine monatlichen Kosten',
        description: 'Einmalige Investition statt teures Abo-Modell. Ihre Digital Signage Lösung gehört Ihnen – ohne versteckte Kosten oder Cloud-Abhängigkeit.',
        highlight: 'Einmalig statt monatlich',
    },
    {
        number: '02',
        title: 'Lokaler Betrieb',
        description: 'Betreiben Sie Ihr Werbebildschirm-System auf einem lokalen Mini-Server in der ganzen Schweiz – volle Kontrolle über Ihre Daten, keine Cloud-Abhängigkeit.',
        highlight: 'Bis zu 5 Bildschirme pro Server',
    },
    {
        number: '03',
        title: 'Live-Daten Integration',
        description: 'Binden Sie beliebige APIs an: PV-Anlagen, Kalender, KPIs, News, Wetterdaten, SBB-Verbindungen und mehr. Ihre Daten live auf dem Display.',
        highlight: 'PV, Kalender, KPIs, APIs',
    },
    {
        number: '04',
        title: 'Multi-Display Support',
        description: 'Starten Sie mit einem Display und erweitern Sie bei Bedarf. Bis zu 5 Bildschirme pro Mini-Server, skalierbar für Filial-Netzwerke.',
        highlight: 'Flexibel erweiterbar',
    },
    {
        number: '05',
        title: 'Custom Design & Widgets',
        description: 'Individuelle Designvorlagen in Ihrem Corporate Design. Wir entwickeln Custom Widgets für Ihre speziellen Anforderungen.',
        highlight: 'In Ihrem Brand',
    },
    {
        number: '06',
        title: 'Web-CMS & Zeitsteuerung',
        description: 'Einfache Verwaltung über das intuitive Xibo CMS. Von überall steuerbar, zeitgesteuerte Playlists, verschiedene Zonen und Multi-Screen-Layouts.',
        highlight: 'Von überall steuerbar',
    },
];

const industries = [
    {
        icon: <Building2 className="w-8 h-8" />,
        title: 'Immobilien & Verwaltungen',
        description: 'Empfangsbereiche, Gebäudeinformationen, Veranstaltungskalender und Wegweiser für Verwaltungen und Immobilienverwaltungen.',
    },
    {
        icon: <ShoppingBag className="w-8 h-8" />,
        title: 'Retail & Gastronomie',
        description: 'Digitale Menüboards, Produktwerbung, Sonderangebote und Kundenkommunikation für Geschäfte und Restaurants.',
    },
    {
        icon: <Factory className="w-8 h-8" />,
        title: 'KMU & Industrie',
        description: 'Produktionsinformationen, KPI-Dashboards, Sicherheitshinweise und Mitarbeiterinformationen für produzierende Betriebe.',
    },
    {
        icon: <GraduationCap className="w-8 h-8" />,
        title: 'Schulen & Gemeinden',
        description: 'Stundenplan-Anzeigen, Veranstaltungskalender, Informationen für Bürger und digitale Schwarze Bretter.',
    },
];

const scalabilityFeatures = [
    {
        icon: <Monitor className="w-8 h-8" />,
        title: '1 bis 100+ Bildschirme',
        description: 'Von Einzelstandort bis Filial-Netzwerk – unsere Digital Signage Lösung wächst mit Ihren Anforderungen.',
    },
    {
        icon: <MapPin className="w-8 h-8" />,
        title: 'Mehrere Standorte',
        description: 'Zentrale Verwaltung aller Displays in Winterthur, Schaffhausen, Tägerwilen oder schweizweit – alles aus einer Hand.',
    },
    {
        icon: <Globe className="w-8 h-8" />,
        title: 'Remote-Verwaltung',
        description: 'Jederzeit und überall Inhalte aktualisieren. Web-basiertes CMS für maximale Flexibilität.',
    },
];

const processSteps = [
    {
        title: 'Quick Check',
        description: 'Kostenlose Erstberatung: Welche Inhalte sollen angezeigt werden? Wo kommen die Infoscreens hin? Welche Datenquellen werden benötigt?',
    },
    {
        title: 'Design & Konzept',
        description: 'Wir erstellen ein massgeschneidertes Konzept mit Hardware-Empfehlung, Custom Design in Ihrem Corporate Design und Widget-Entwicklung.',
    },
    {
        title: 'Setup & Installation',
        description: 'Professionelle Montage der Displays in Winterthur, Tägerwilen oder Schaffhausen, Einrichtung des Servers und Konfiguration aller Inhalte.',
    },
    {
        title: 'Go-Live & Schulung',
        description: 'Ihr Team lernt das System kennen. Schulung vor Ort und optionale Wartungsverträge für Updates und Support.',
    },
];

export default function DigitalSignagePage() {
    // Hub Service Schema (schweizweit)
    const hubServiceSchema = generateDigitalSignageHubSchema();

    // Product Schema für Starter-Paket
    const productSchema = generateDigitalSignageProductSchema();

    // FAQ Schema
    const faqSchema = generateFAQSchema(digitalSignageFaqs);

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Leistungen', url: `${BASE_URL}/leistungen` },
        { name: 'Digital Signage', url: `${BASE_URL}/digital-signage` }
    ]);

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/digital-signage`,
        'Digital Signage Schweiz - Werbebildschirme & Infoscreen ohne Abo',
        'Professionelle Digital Signage Lösungen für die ganze Schweiz ohne Abo-Kosten. Werbebildschirme und Infoscreens mit lokalem Betrieb.'
    );

    return (
        <>
            {/* Hub Service Schema (Digital Signage Schweiz) */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hubServiceSchema) }} />

            {/* Product Schema (Starter-Paket) */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />

            {/* FAQ Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            {/* Breadcrumb Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* WebPage Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />

            {/* Hero Section */}
            <section className="relative py-12 md:py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <Image
                        src="/images/hero_digital_signage_1768423279297.png"
                        alt=""
                        fill
                        className="object-cover"
                        priority
                        quality={85}
                        sizes="100vw"
                    />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="max-w-xl">
                            <AnimatedSection animation="slideUp">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                                    <span className="gradient-text">Digital Signage Schweiz</span> – Werbebildschirme ohne Abo
                                </h1>
                                <p className="text-xl md:text-2xl text-primary font-medium mb-4">
                                    Professionelle Infoscreen-Lösungen für die ganze Schweiz
                                </p>
                                <p className="text-lg text-text-secondary max-w-2xl mb-8">
                                    Dynamische Inhalte auf Ihren Werbebildschirmen und Infoscreens – von der Begrüssung im Empfangsbereich bis zur Produktionsinformation. Schweizweite Installation, einmalige Investition, volle Kontrolle über Ihre Daten.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button variant="primary" size="lg" asChild>
                                        <Link href="/kontakt">
                                            Jetzt beraten lassen
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild>
                                        <a href="tel:+41522221818">
                                            <Phone className="w-5 h-5" />
                                            052 222 18 18
                                        </a>
                                    </Button>
                                </div>
                            </AnimatedSection>
                        </div>

                        <AnimatedSection animation="slideUp" delay={0.2} className="hidden lg:block">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border">
                                <Image
                                    src="/images/hero_digital_signage_1768423279297.png"
                                    alt="Professionelle Digital Signage Installation mit Werbebildschirmen und Infoscreens in modernem Schweizer Unternehmen"
                                    fill
                                    className="object-cover"
                                    priority
                                    quality={85}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Trust Badges Section */}
            <section className="py-12 bg-background border-y border-border">
                <div className="container mx-auto px-4">
                    <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8" staggerDelay={0.1}>
                        <StaggerItem>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">🇨🇭</div>
                                <div className="text-sm text-text-secondary">Schweizer Support</div>
                            </div>
                        </StaggerItem>
                        <StaggerItem>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">0 CHF</div>
                                <div className="text-sm text-text-secondary">Monatliche Abo-Kosten</div>
                            </div>
                        </StaggerItem>
                        <StaggerItem>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">✓</div>
                                <div className="text-sm text-text-secondary">Custom Design inkl.</div>
                            </div>
                        </StaggerItem>
                        <StaggerItem>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">24/7</div>
                                <div className="text-sm text-text-secondary">Zuverlässiger Betrieb</div>
                            </div>
                        </StaggerItem>
                    </StaggerContainer>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Warum InfraOne Digital Signage?
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Professionelle Werbebildschirme und Infoscreen-Lösungen für Unternehmen in der ganzen Schweiz
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8" staggerDelay={0.15}>
                        {features.map((feature, index) => (
                            <StaggerItem key={index}>
                                <MotionCard
                                    hoverY={-5}
                                    className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-150"
                                >
                                    <div className="flex items-start gap-6">
                                        <span className="text-5xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">
                                            {feature.number}
                                        </span>
                                        <div>
                                            <h3 className="text-xl font-bold text-text-primary mb-2">
                                                {feature.title}
                                            </h3>
                                            <p className="text-text-secondary mb-4">
                                                {feature.description}
                                            </p>
                                            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                                                <CheckCircle className="w-4 h-4" />
                                                {feature.highlight}
                                            </span>
                                        </div>
                                    </div>
                                </MotionCard>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Industries Section */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Für wen ist Digital Signage?
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Unsere Digital Signage Lösungen eignen sich für verschiedenste Branchen und Einsatzzwecke in der ganzen Schweiz
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
                        {industries.map((industry, index) => (
                            <StaggerItem key={index}>
                                <MotionCard
                                    hoverY={-5}
                                    className="p-6 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all text-center"
                                >
                                    <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                        {industry.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary mb-2">
                                        {industry.title}
                                    </h3>
                                    <p className="text-sm text-text-secondary">
                                        {industry.description}
                                    </p>
                                </MotionCard>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Product Showcase */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            InfraOne Digital Signage Lösungen
                        </h2>
                    </AnimatedSection>

                    <AnimatedSection animation="slideUp" delay={0.2}>
                        <div className="max-w-5xl mx-auto">
                            <Image
                                src="/images/digital-signage/products.png"
                                alt="InfraOne Digital Signage Produktpalette: Mini-Server, 4K-Displays und Cloud-Verwaltungssoftware für Werbebildschirme und Infoscreens in der Schweiz"
                                width={1920}
                                height={1080}
                                className="w-full h-auto rounded-2xl shadow-2xl border border-border"
                                quality={90}
                            />
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Comparison Table Section */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            InfraOne vs. Cloud-Anbieter
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Warum lokale Digital Signage Lösungen langfristig günstiger und flexibler sind
                        </p>
                    </AnimatedSection>

                    <AnimatedSection animation="slideUp" delay={0.2}>
                        <div className="max-w-4xl mx-auto overflow-x-auto">
                            <table className="w-full border-collapse bg-card rounded-2xl overflow-hidden shadow-lg">
                                <thead>
                                    <tr className="bg-surface">
                                        <th className="p-4 text-left text-text-primary font-semibold border-b border-border">Feature</th>
                                        <th className="p-4 text-center text-primary font-semibold border-b border-border">InfraOne (Lokal)</th>
                                        <th className="p-4 text-center text-text-secondary font-semibold border-b border-border">Cloud-Anbieter</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="p-4 text-text-primary">Einmalige Kosten</td>
                                        <td className="p-4 text-center font-semibold text-primary">CHF 1'590</td>
                                        <td className="p-4 text-center text-text-secondary">CHF 0-500</td>
                                    </tr>
                                    <tr className="border-b border-border bg-surface/50">
                                        <td className="p-4 text-text-primary">Monatliche Kosten</td>
                                        <td className="p-4 text-center font-semibold text-primary">CHF 0</td>
                                        <td className="p-4 text-center text-text-secondary">CHF 50-150/Display</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 text-text-primary">Kosten über 3 Jahre</td>
                                        <td className="p-4 text-center font-semibold text-primary">CHF 1'590</td>
                                        <td className="p-4 text-center text-text-secondary">CHF 1'800-5'400</td>
                                    </tr>
                                    <tr className="border-b border-border bg-surface/50">
                                        <td className="p-4 text-text-primary">Datenhoheit</td>
                                        <td className="p-4 text-center">
                                            <CheckCircle className="w-5 h-5 text-primary mx-auto" />
                                            <span className="text-xs text-text-secondary block mt-1">Lokal bei Ihnen</span>
                                        </td>
                                        <td className="p-4 text-center text-text-secondary">Cloud (USA/EU)</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 text-text-primary">Internet-Abhängigkeit</td>
                                        <td className="p-4 text-center text-text-secondary">Optional</td>
                                        <td className="p-4 text-center text-text-secondary">Zwingend</td>
                                    </tr>
                                    <tr className="border-b border-border bg-surface/50">
                                        <td className="p-4 text-text-primary">Custom Widgets</td>
                                        <td className="p-4 text-center">
                                            <CheckCircle className="w-5 h-5 text-primary mx-auto" />
                                            <span className="text-xs text-text-secondary block mt-1">Unbegrenzt</span>
                                        </td>
                                        <td className="p-4 text-center text-text-secondary">Eingeschränkt</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 text-text-primary">API-Integrationen</td>
                                        <td className="p-4 text-center">
                                            <CheckCircle className="w-5 h-5 text-primary mx-auto" />
                                            <span className="text-xs text-text-secondary block mt-1">Beliebig</span>
                                        </td>
                                        <td className="p-4 text-center text-text-secondary">Limitiert</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </AnimatedSection>

                    <AnimatedSection animation="slideUp" delay={0.4} className="text-center mt-8">
                        <div className="inline-block bg-primary/10 border border-primary/30 rounded-xl p-6 max-w-2xl">
                            <p className="text-primary font-semibold text-lg mb-2">
                                💰 Ersparnis über 3 Jahre: CHF 210 - 3'810
                            </p>
                            <p className="text-text-secondary text-sm">
                                Bei 1 Display. Bei mehreren Displays multipliziert sich die Ersparnis.
                            </p>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Technical Specifications Section */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Technische Details
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Professionelle Hardware und Software für maximale Flexibilität
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" staggerDelay={0.15}>
                        <StaggerItem>
                            <MotionCard className="p-8 bg-card border border-border rounded-2xl h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <Monitor className="w-8 h-8 text-primary" />
                                    <h3 className="text-xl font-bold text-text-primary">Display-Formate</h3>
                                </div>
                                <ul className="space-y-3 text-text-secondary">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Auflösung:</strong> Full HD bis 4K</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Grössen:</strong> 32" bis 86"</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Orientierung:</strong> Landscape & Portrait</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Multi-Zone:</strong> Bis 6 Zonen pro Display</span>
                                    </li>
                                </ul>
                            </MotionCard>
                        </StaggerItem>

                        <StaggerItem>
                            <MotionCard className="p-8 bg-card border border-border rounded-2xl h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <Tv className="w-8 h-8 text-primary" />
                                    <h3 className="text-xl font-bold text-text-primary">Content-Formate</h3>
                                </div>
                                <ul className="space-y-3 text-text-secondary">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Video:</strong> MP4, AVI, MOV (H.264/H.265)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Bilder:</strong> JPG, PNG, WebP</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Web:</strong> HTML5, iFrames, Live-Websites</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Daten:</strong> REST APIs, RSS, JSON</span>
                                    </li>
                                </ul>
                            </MotionCard>
                        </StaggerItem>

                        <StaggerItem>
                            <MotionCard className="p-8 bg-card border border-border rounded-2xl h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <Settings className="w-8 h-8 text-primary" />
                                    <h3 className="text-xl font-bold text-text-primary">Server-Anforderungen</h3>
                                </div>
                                <ul className="space-y-3 text-text-secondary">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>CPU:</strong> Intel i3 oder besser</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>RAM:</strong> 8GB minimum</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Storage:</strong> 128GB SSD</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span><strong>Netzwerk:</strong> 100 Mbit/s LAN</span>
                                    </li>
                                </ul>
                            </MotionCard>
                        </StaggerItem>
                    </StaggerContainer>
                </div>
            </section>

            {/* Scalability Section */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Skalierbar & Flexibel
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Egal wie viele Standorte und Bildschirme – wir bieten die richtige Lösung
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.15}>
                        {scalabilityFeatures.map((feature, index) => (
                            <StaggerItem key={index}>
                                <div className="text-center p-6">
                                    <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Transparente Preise
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Einmalige Investition ohne monatliche Abo-Kosten
                        </p>
                    </AnimatedSection>

                    <AnimatedSection animation="slideUp" delay={0.2}>
                        <div className="max-w-3xl mx-auto">
                            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white">
                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <div>
                                        <div className="text-5xl font-bold mb-2">CHF 1'590.–</div>
                                        <div className="text-xl opacity-90 mb-6">Einmalig – Starter-Paket</div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <span>1 Display + Mini-Server</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <span>Bis 5 Bildschirme erweiterbar</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <span>Setup & Installation</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <span>Custom Designvorlage</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <span>Schulung & Support</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-white/20">
                                    <p className="text-sm opacity-90">
                                        <strong>Optional:</strong> Live-Daten/API-Integrationen (PV-Anlagen, Kalender, KPIs) nach Aufwand
                                    </p>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                            So einfach geht's
                        </h2>
                    </AnimatedSection>

                    <div className="max-w-3xl mx-auto">
                        <StaggerContainer className="space-y-6" staggerDelay={0.1}>
                            {processSteps.map((step, index) => (
                                <StaggerItem key={index}>
                                    <MotionCard
                                        hoverX={10}
                                        className="flex gap-6 p-6 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all"
                                    >
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
                                    </MotionCard>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    </div>
                </div>
            </section>

            {/* FAQs Section */}
            {digitalSignageFaqs.length > 0 && (
                <section className="py-16 lg:py-24 bg-surface border-t border-border">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                                Häufige Fragen
                            </h2>
                        </AnimatedSection>
                        <div className="max-w-3xl mx-auto">
                            <FAQList items={digitalSignageFaqs} />
                        </div>
                    </div>
                </section>
            )}



            {/* Regional Hub Links Section */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Digital Signage in Ihrer Region
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Schweizweite Installation und Support für Werbebildschirme und Infoscreens
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto" staggerDelay={0.1}>
                        <StaggerItem>
                            <Link href="/digital-signage/winterthur" className="block">
                                <MotionCard className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all text-center group">
                                    <MapPin className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="font-semibold text-text-primary mb-1">Winterthur</div>
                                    <div className="text-xs text-text-secondary">Hauptsitz</div>
                                </MotionCard>
                            </Link>
                        </StaggerItem>

                        <StaggerItem>
                            <Link href="/digital-signage/zuerich" className="block">
                                <MotionCard className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all text-center group">
                                    <MapPin className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="font-semibold text-text-primary mb-1">Zürich</div>
                                    <div className="text-xs text-text-secondary">Wirtschaftsregion</div>
                                </MotionCard>
                            </Link>
                        </StaggerItem>

                        <StaggerItem>
                            <Link href="/digital-signage/thurgau" className="block">
                                <MotionCard className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all text-center group">
                                    <MapPin className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="font-semibold text-text-primary mb-1">Thurgau</div>
                                    <div className="text-xs text-text-secondary">Ostschweiz</div>
                                </MotionCard>
                            </Link>
                        </StaggerItem>

                        <StaggerItem>
                            <Link href="/digital-signage/st-gallen" className="block">
                                <MotionCard className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all text-center group">
                                    <MapPin className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="font-semibold text-text-primary mb-1">St. Gallen</div>
                                    <div className="text-xs text-text-secondary">Ostschweiz</div>
                                </MotionCard>
                            </Link>
                        </StaggerItem>

                        <StaggerItem>
                            <Link href="/digital-signage/schaffhausen" className="block">
                                <MotionCard className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all text-center group">
                                    <MapPin className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="font-semibold text-text-primary mb-1">Schaffhausen</div>
                                    <div className="text-xs text-text-secondary">Nordostschweiz</div>
                                </MotionCard>
                            </Link>
                        </StaggerItem>

                        <StaggerItem>
                            <Link href="/digital-signage/aargau" className="block">
                                <MotionCard className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all text-center group">
                                    <MapPin className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="font-semibold text-text-primary mb-1">Aargau</div>
                                    <div className="text-xs text-text-secondary">Mittelland</div>
                                </MotionCard>
                            </Link>
                        </StaggerItem>
                    </StaggerContainer>


                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 lg:py-20 bg-primary relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                <circle cx="30" cy="30" r="2" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#cta-grid)" />
                    </svg>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <MotionCTA className="max-w-2xl mx-auto text-center text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Bereit für professionelle Digital Signage?
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-white text-white hover:bg-white hover:text-primary"
                                asChild
                            >
                                <a href="tel:+41522221818">
                                    <Phone className="w-5 h-5" />
                                    Jetzt anrufen
                                </a>
                            </Button>
                        </div>
                        <p className="mt-6 text-sm opacity-90">
                            Schweizweite Installation • Winterthur • Zürich • Ostschweiz
                        </p>
                    </MotionCTA>
                </div>
            </section>
        </>
    );
}
