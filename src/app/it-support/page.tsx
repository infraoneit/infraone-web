import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Monitor, MapPin, Clock, Users, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { generateServiceSchema } from '@/lib/seo/schema';

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

const supportTypes = [
    {
        icon: <Phone className="w-8 h-8" />,
        title: 'Telefonischer Support',
        description: 'Sofortige Problemlösung durch zertifizierte Techniker.',
        price: 'CHF 120.–/h',
    },
    {
        icon: <Monitor className="w-8 h-8" />,
        title: 'Remote Support',
        description: '90% aller Probleme lösen wir innert Minuten – die schnellste Methode.',
        price: 'CHF 120.–/h',
    },
    {
        icon: <MapPin className="w-8 h-8" />,
        title: 'Vor-Ort-Support',
        description: 'Persönliche Betreuung vor Ort in Ihrer Region. Seriös, klar, effizient.',
        price: 'CHF 157.–/h',
    },
    {
        icon: <Users className="w-8 h-8" />,
        title: 'KMU-IT-Support',
        description: 'Unterstützung für interne IT, SLA-Modelle, Stellvertretung, Netzwerk-Fehlerbehebung.',
        price: 'Auf Anfrage',
    },
];

const regions = [
    {
        name: 'Winterthur',
        description: 'Hauptstandort. Vor Ort innert kurzer Zeit. Anfahrt kostenlos.',
        href: '/it-support/winterthur',
        highlight: true,
    },
    {
        name: 'Zürich',
        description: 'Vor-Ort-Einsätze meist am selben Tag. Remote-Support jederzeit.',
        href: '/it-support/zuerich',
        highlight: false,
    },
    {
        name: 'Schaffhausen',
        description: 'Vor-Ort-Einsätze in der Region Schaffhausen. Anfahrt kostenlos.',
        href: '/it-support/schaffhausen',
        highlight: false,
    },
    {
        name: 'Thurgau',
        description: 'Betreuung für Industrie, Gewerbe und Verwaltungen im Thurgau.',
        href: '/it-support/thurgau',
        highlight: false,
    },
    {
        name: 'St. Gallen',
        description: 'Vor-Ort-Einsätze in der Ostschweiz meist am selben Tag.',
        href: '/it-support/st-gallen',
        highlight: false,
    },
    {
        name: 'Andelfingen',
        description: 'Standort Kleinandelfingen. Anfahrt kostenlos.',
        href: '/it-support/andelfingen',
        highlight: true,
    },
];

export default function ITSupportPage() {
    const serviceSchema = generateServiceSchema(
        'IT-Support & Informatik-Support',
        'Computer Support Services',
        'Professioneller IT-Support für KMU und Privatpersonen. Remote-Support CHF 120/h, Vor-Ort CHF 157/h. Schnelle Hilfe bei Computer-, Netzwerk- und IT-Problemen.',
        'https://www.infraone.ch/it-support',
        ['Schweiz', 'Winterthur', 'Zürich', 'Schaffhausen', 'Thurgau', 'St. Gallen']
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                {/* Background Image - dezent wie bei IT-Support SEO Seiten */}
                <div className="absolute inset-0 opacity-10">
                    <Image src="/images/hero_it_network_1768423176860.png" alt="" fill className="object-cover" priority />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="max-w-xl">
                            <AnimatedSection animation="slideUp">
                                <p className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">
                                    IT-Support & Computerhilfe
                                </p>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
                                    <span className="gradient-text">Informatik-Support</span>{' '}
                                    <span className="block mt-2">Sofort. Schweizweit.</span>
                                </h1>
                                <p className="text-xl text-text-secondary mb-8 max-w-2xl">
                                    Schnelle IT-Hilfe für KMU & Private – per Telefon, Remote oder vor Ort.
                                    Transparente Preise, persönlicher Kontakt, keine Warteschleifen.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button variant="primary" size="lg" asChild>
                                        <a href="tel:+41522221818">
                                            <Phone className="w-5 h-5" />
                                            052 222 18 18
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild>
                                        <a href="https://anydesk.com/de/downloads/thank-you?dv=win_exe" target="_blank" rel="noopener noreferrer">
                                            <Monitor className="w-5 h-5" />
                                            Remote-Support starten
                                        </a>
                                    </Button>
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* Hero Image on the right */}
                        <AnimatedSection animation="slideUp" delay={0.2} className="hidden lg:block">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border">
                                <Image
                                    src="/images/hero_it_network_1768423176860.png"
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
                            IT-Support Preise & Leistungen
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Transparente Preise ohne versteckte Kosten. Abrechnung im 15-Minuten-Takt.
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
                        {supportTypes.map((type, index) => (
                            <StaggerItem key={index}>
                                <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors">
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                        {type.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary mb-2">{type.title}</h3>
                                    <p className="text-sm text-text-secondary mb-4">{type.description}</p>
                                    <p className="text-xl font-bold text-primary">{type.price}</p>
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
                                        <p className="font-medium text-text-primary">Winterthur & Andelfingen</p>
                                        <p className="text-text-secondary">Keine Anfahrtskosten</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-text-primary">Übrige Regionen</p>
                                        <p className="text-text-secondary">CHF 2.00/km (ab Winterthur)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Supportzeiten</h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-text-primary">Regulär: Mo–Fr 08:00–17:00</p>
                                            <p className="text-text-secondary">Normaltarif</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-text-primary">Erweitert: bis 23:00 Uhr</p>
                                            <p className="text-text-secondary">+50% Zuschlag, Best-Effort</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-text-secondary mt-4">
                                    <Shield className="w-4 h-4 inline mr-1" />
                                    24/7-Verfügbarkeit nur mit aktivem SLA-Vertrag möglich.
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
                            IT-Support in Ihrer Region
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Vor-Ort-Einsätze in der Ostschweiz – Remote-Support schweizweit.
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
                        {regions.map((region, index) => (
                            <StaggerItem key={index}>
                                <Link href={region.href} className="block h-full group">
                                    <div className={`h-full p-6 rounded-2xl border transition-all ${region.highlight
                                        ? 'bg-primary/5 border-primary/30 hover:border-primary'
                                        : 'bg-card border-border hover:border-primary/50'
                                        }`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                                                IT-Support {region.name}
                                            </h3>
                                            {region.highlight && (
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

            {/* Emergency Contact */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        IT-Notfall? Wir sind erreichbar.
                    </h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                        Telefon oder WhatsApp – sofortige Hilfe für dringende IT-Probleme.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="bg-white text-primary hover:bg-white/90"
                            asChild
                        >
                            <a href="tel:+41765875055">
                                <Phone className="w-5 h-5" />
                                076 587 50 55
                            </a>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-white text-white hover:bg-white hover:text-primary"
                            asChild
                        >
                            <a href="https://wa.me/41765875055" target="_blank" rel="noopener noreferrer">
                                WhatsApp öffnen
                            </a>
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
