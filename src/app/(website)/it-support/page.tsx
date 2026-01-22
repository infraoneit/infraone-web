import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Phone, Monitor, MapPin, Clock, Users, Shield, ArrowRight, CheckCircle,
    Cloud, Wrench, Zap, Headphones, Globe, Mail, Server, HardDrive,
    BarChart3, Lock, Settings, Smartphone, Laptop, Printer, Wifi, Download
} from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { generateServiceSchema, generateFAQSchema } from '@/lib/seo/schema';
import { FAQList } from '@/components/ui/FAQList';
import { getITSupportData } from '@/lib/leistungen';

export const metadata: Metadata = {
    title: 'IT-Support & Informatik-Support Schweiz | Preise & Leistungen',
    description: 'IT-Support für KMU & Private: Remote-Support CHF 120/h, Vor-Ort CHF 157/h. Sofortige Computerhilfe in Winterthur, Zürich, Schaffhausen, Thurgau.',
    keywords: ['IT Support Schweiz', 'Informatik Support', 'Computerhilfe', 'PC Support'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support',
        },
    },
};

// Icon-Mapping für CMS-Daten (erweitert)
const iconMap: Record<string, React.ReactNode> = {
    phone: <Phone className="w-8 h-8" />,
    monitor: <Monitor className="w-8 h-8" />,
    mappin: <MapPin className="w-8 h-8" />,
    users: <Users className="w-8 h-8" />,
    shield: <Shield className="w-8 h-8" />,
    cloud: <Cloud className="w-8 h-8" />,
    wrench: <Wrench className="w-8 h-8" />,
    zap: <Zap className="w-8 h-8" />,
    headphones: <Headphones className="w-8 h-8" />,
    globe: <Globe className="w-8 h-8" />,
    mail: <Mail className="w-8 h-8" />,
    server: <Server className="w-8 h-8" />,
    harddrive: <HardDrive className="w-8 h-8" />,
    barchart: <BarChart3 className="w-8 h-8" />,
    lock: <Lock className="w-8 h-8" />,
    settings: <Settings className="w-8 h-8" />,
    smartphone: <Smartphone className="w-8 h-8" />,
    laptop: <Laptop className="w-8 h-8" />,
    printer: <Printer className="w-8 h-8" />,
    wifi: <Wifi className="w-8 h-8" />,
};

// Grid-Klassen Mapping
const gridColumnsMap: Record<string, string> = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-2 lg:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4',
};

export default async function ITSupportPage() {
    // CMS-Daten laden
    const cmsData = await getITSupportData();

    // Fallback-Daten falls CMS nicht verfügbar
    const heroSection = cmsData?.heroSection ?? {
        categoryLabel: 'IT-SUPPORT & COMPUTERHILFE',
        headline: 'Informatik-Support',
        subheadline: 'Sofort. Schweizweit.',
        description: 'Schnelle IT-Hilfe für KMU & Private – per Telefon, Remote oder vor Ort. Transparente Preise, persönlicher Kontakt, keine Warteschleifen.',
        primaryButtonText: '052 222 18 18',
        primaryButtonHref: 'tel:+41522221818',
        secondaryButtonText: 'Remote-Support starten',
        secondaryButtonAction: 'link' as const,
        secondaryButtonUrl: 'https://anydesk.com/de/downloads/thank-you?dv=win_exe',
        secondaryButtonFile: undefined,
    };

    const pricingSection = cmsData?.pricingSection ?? {
        sectionTitle: 'IT-Support Preise & Leistungen',
        sectionSubtitle: 'Transparente Preise ohne versteckte Kosten. Abrechnung im 15-Minuten-Takt.',
        gridColumns: '4',
        priceCards: [
            { title: 'Telefonischer Support', description: 'Sofortige Problemlösung durch zertifizierte Techniker.', price: 'CHF 120.–/h', icon: 'phone' },
            { title: 'Remote Support', description: '90% aller Probleme lösen wir innert Minuten – die schnellste Methode.', price: 'CHF 120.–/h', icon: 'monitor' },
            { title: 'Vor-Ort-Support', description: 'Persönliche Betreuung vor Ort in Ihrer Region. Seriös, klar, effizient.', price: 'CHF 157.–/h', icon: 'mappin' },
            { title: 'KMU-IT-Support', description: 'Unterstützung für interne IT, SLA-Modelle, Stellvertretung, Netzwerk-Fehlerbehebung.', price: 'Auf Anfrage', icon: 'users' },
        ],
        travelCosts: {
            freeRegions: 'Winterthur & Andelfingen',
            freeRegionsNote: 'Keine Anfahrtskosten',
            otherRegions: 'Übrige Regionen',
            otherRegionsPrice: 'CHF 2.00/km (ab Winterthur)',
        },
        supportHours: {
            regularLabel: 'Regulär: Mo–Fr 08:00–17:00',
            regularNote: 'Normaltarif',
            extendedLabel: 'Erweitert: bis 23:00 Uhr',
            extendedNote: '+50% Zuschlag, Best-Effort',
            slaNote: '24/7-Verfügbarkeit nur mit aktivem SLA-Vertrag möglich.',
        },
    };

    // Grid-Klasse für Preis-Kacheln
    const gridColumns = pricingSection.gridColumns || '4';
    const gridClass = gridColumnsMap[gridColumns] || gridColumnsMap['4'];

    // Secondary Button Logik (vereinfacht: Link oder Download)
    const isDownload = (heroSection.secondaryButtonAction === 'download') && heroSection.secondaryButtonFile;
    const secondaryButtonHref = isDownload 
        ? heroSection.secondaryButtonFile 
        : (heroSection.secondaryButtonUrl || '#');
    
    // Prüfen ob externer Link (beginnt mit http)
    const isExternalLink = !isDownload && secondaryButtonHref?.startsWith('http');
    
    // Download-Dateiname (Original oder aus CMS)
    const downloadFileName = heroSection.secondaryButtonFileName || undefined;

    const regionsSection = cmsData?.regionsSection ?? {
        sectionTitle: 'IT-Support in Ihrer Region',
        sectionSubtitle: 'Vor-Ort-Einsätze in der Ostschweiz – Remote-Support schweizweit.',
        regions: [
            { name: 'IT-Support Winterthur', slug: 'winterthur', description: 'Hauptstandort. Vor Ort innert kurzer Zeit. Anfahrt kostenlos.', isFree: true },
            { name: 'IT-Support Zürich', slug: 'zuerich', description: 'Vor-Ort-Einsätze meist am selben Tag. Remote-Support jederzeit.', isFree: false },
            { name: 'IT-Support Schaffhausen', slug: 'schaffhausen', description: 'Vor-Ort-Einsätze in der Region Schaffhausen. Anfahrt kostenlos.', isFree: true },
            { name: 'IT-Support Thurgau', slug: 'thurgau', description: 'Betreuung für Industrie, Gewerbe und Verwaltungen im Thurgau.', isFree: false },
            { name: 'IT-Support St. Gallen', slug: 'st-gallen', description: 'Vor-Ort-Einsätze in der Ostschweiz meist am selben Tag.', isFree: false },
            { name: 'IT-Support Andelfingen', slug: 'andelfingen', description: 'Standort Kleinandelfingen. Anfahrt kostenlos.', isFree: true },
        ],
    };

    const faqsSection = cmsData?.faqsSection ?? {
        sectionTitle: 'Häufige Fragen',
        sectionSubtitle: 'Antworten auf die wichtigsten Fragen zu unserem Support.',
        faqs: [
            { question: 'Wie schnell können Sie helfen?', answer: 'Remote-Support ist meist innert 15 Minuten verfügbar. Vor-Ort-Einsätze planen wir nach Dringlichkeit – bei Notfällen oft noch am gleichen Tag.' },
            { question: 'Was kostet der IT-Support?', answer: 'Remote-Support: CHF 120.–/h. Vor-Ort-Support: CHF 157.–/h. Im Raum Winterthur & Andelfingen keine Anfahrtskosten, sonst faire Pauschalen.' },
            { question: 'Betreuen Sie auch Privatpersonen?', answer: 'Ja! Wir helfen sowohl KMU als auch Privatpersonen bei allen IT-Problemen – vom langsamen PC bis zum Virenbefall.' },
            { question: 'Wie läuft Remote-Support ab?', answer: 'Sie laden eine kleine Software herunter (AnyDesk), teilen uns den Code mit, und wir können Ihren Bildschirm sehen und Probleme direkt beheben.' },
            { question: 'Muss ich einen Vertrag abschliessen?', answer: 'Nein. Wir arbeiten für die meisten Kunden auf Abruf. Wartungsverträge (SLA) bieten wir für Firmen an, die garantierte Reaktionszeiten benötigen.' },
        ],
    };

    const ctaSection = cmsData?.ctaSection ?? {
        headline: 'IT-Notfall? Wir sind erreichbar.',
        subtitle: 'Telefon oder WhatsApp – sofortige Hilfe für dringende IT-Probleme.',
        emergencyPhone: '076 587 50 55',
        emergencyPhoneLink: 'tel:+41765875055',
        whatsappLabel: 'WhatsApp öffnen',
        whatsappLink: 'https://wa.me/41765875055',
    };

    // Structured Data Einstellungen aus CMS
    const structuredData = cmsData?.structuredDataSection ?? {
        schemaType: 'ProfessionalService',
        areaServed: ['Schweiz', 'Winterthur', 'Zürich', 'Schaffhausen', 'Thurgau', 'St. Gallen'],
        includeFaqSchema: true,
    };

    // Schema.org generieren (mit CMS-Einstellungen)
    const serviceSchema = {
        '@context': 'https://schema.org',
        '@type': structuredData.schemaType || 'ProfessionalService',
        name: 'IT-Support & Informatik-Support',
        serviceType: 'Computer Support Services',
        description: 'Professioneller IT-Support für KMU und Privatpersonen. Remote-Support CHF 120/h, Vor-Ort CHF 157/h. Schnelle Hilfe bei Computer-, Netzwerk- und IT-Problemen.',
        url: 'https://www.infraone.ch/it-support',
        provider: {
            '@type': 'Organization',
            name: 'InfraOne IT Solutions GmbH',
            url: 'https://www.infraone.ch',
        },
        areaServed: (structuredData.areaServed || []).map((area: string) => ({
            '@type': 'Place',
            name: area,
        })),
        telephone: '+41522221818',
        email: 'info@infraone.ch',
        priceRange: '$$',
    };

    const faqSchema = structuredData.includeFaqSchema !== false 
        ? generateFAQSchema(faqsSection.faqs) 
        : null;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}

            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <Image src="/images/hero_it_network_1768423176860.png" alt="" fill className="object-cover" priority />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="max-w-xl">
                            <AnimatedSection animation="slideUp">
                                <p className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">
                                    {heroSection.categoryLabel}
                                </p>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
                                    <span className="gradient-text">{heroSection.headline}</span>{' '}
                                    <span className="block mt-2">{heroSection.subheadline}</span>
                                </h1>
                                <p className="text-xl text-text-secondary mb-8 max-w-2xl">
                                    {heroSection.description}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button variant="primary" size="lg" asChild>
                                        <a href={heroSection.primaryButtonHref}>
                                            <Phone className="w-5 h-5" />
                                            {heroSection.primaryButtonText}
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild>
                                        <a 
                                            href={secondaryButtonHref}
                                            target={isExternalLink ? '_blank' : undefined}
                                            rel={isExternalLink ? 'noopener noreferrer' : undefined}
                                            {...(isDownload ? { download: downloadFileName || '' } : {})}
                                        >
                                            {isDownload ? (
                                                <Download className="w-5 h-5" />
                                            ) : (
                                                <Monitor className="w-5 h-5" />
                                            )}
                                            {heroSection.secondaryButtonText}
                                        </a>
                                    </Button>
                                </div>
                            </AnimatedSection>
                        </div>

                        <AnimatedSection animation="slideUp" delay={0.2} className="hidden lg:block">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border">
                                <Image
                                    src={heroSection.heroImage || "/images/hero_it_network_1768423176860.png"}
                                    alt="IT-Support und Informatik-Hilfe"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Support Types & Pricing */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            {pricingSection.sectionTitle}
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            {pricingSection.sectionSubtitle}
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className={`grid ${gridClass} gap-6`} staggerDelay={0.1}>
                        {pricingSection.priceCards.map((card, index) => (
                            <StaggerItem key={index}>
                                <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors">
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                        {iconMap[card.icon] || <Monitor className="w-8 h-8" />}
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary mb-2">{card.title}</h3>
                                    <p className="text-sm text-text-secondary mb-4">{card.description}</p>
                                    <p className="text-xl font-bold text-primary">{card.price}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>

                    {/* Additional Pricing Info */}
                    <div className="mt-12 max-w-3xl mx-auto">
                        <div className="p-6 rounded-2xl bg-card border border-border">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Anfahrtskosten</h3>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-text-primary">{pricingSection.travelCosts.freeRegions}</p>
                                        <p className="text-text-secondary">{pricingSection.travelCosts.freeRegionsNote}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-text-primary">{pricingSection.travelCosts.otherRegions}</p>
                                        <p className="text-text-secondary">{pricingSection.travelCosts.otherRegionsPrice}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Supportzeiten</h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-text-primary">{pricingSection.supportHours.regularLabel}</p>
                                            <p className="text-text-secondary">{pricingSection.supportHours.regularNote}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-text-primary">{pricingSection.supportHours.extendedLabel}</p>
                                            <p className="text-text-secondary">{pricingSection.supportHours.extendedNote}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-text-secondary mt-4">
                                    <Shield className="w-4 h-4 inline mr-1" />
                                    {pricingSection.supportHours.slaNote}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Regional Support */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            {regionsSection.sectionTitle}
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            {regionsSection.sectionSubtitle}
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
                        {regionsSection.regions.map((region, index) => (
                            <StaggerItem key={index}>
                                <Link href={`/it-support/${region.slug}`} className="block h-full group">
                                    <div className={`h-full p-6 rounded-2xl border transition-all ${region.isFree
                                        ? 'bg-primary/5 border-primary/30 hover:border-primary'
                                        : 'bg-card border-border hover:border-primary/50'
                                        }`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                                                {region.name}
                                            </h3>
                                            {region.isFree && (
                                                <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                                                    Kostenlos
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-text-secondary mb-4">{region.description}</p>
                                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                            Mehr erfahren
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </Link>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* FAQs */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">{faqsSection.sectionTitle}</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">{faqsSection.sectionSubtitle}</p>
                    </AnimatedSection>
                    <div className="max-w-3xl mx-auto">
                        <FAQList items={faqsSection.faqs} />
                    </div>
                </div>
            </section>

            {/* Emergency Contact */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        {ctaSection.headline}
                    </h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                        {ctaSection.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="bg-white text-primary hover:bg-white/90"
                            asChild
                        >
                            <a href={ctaSection.emergencyPhoneLink}>
                                <Phone className="w-5 h-5" />
                                {ctaSection.emergencyPhone}
                            </a>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-white text-white hover:bg-white hover:text-primary"
                            asChild
                        >
                            <a href={ctaSection.whatsappLink} target="_blank" rel="noopener noreferrer">
                                {ctaSection.whatsappLabel}
                            </a>
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
