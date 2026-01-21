'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Code, Rocket, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';

const packages = [
    {
        name: 'Starter',
        price: 'CHF 990',
        description: 'Die perfekte Lösung für Startups und kleine Unternehmen',
        platform: 'WordPress / Wix',
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
        price: 'CHF 2\'990',
        description: 'Für etablierte Unternehmen mit mehr Anforderungen',
        platform: 'WordPress / Wix',
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
        price: 'ab CHF 5\'900',
        description: 'Massgeschneiderte Lösung für maximale Performance',
        platform: 'Next.js + Keystatic',
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

const regions = [
    { name: 'Winterthur', href: '/webdesign/winterthur' },
    { name: 'Zürich', href: '/webdesign/zuerich' },
    { name: 'Schaffhausen', href: '/webdesign/schaffhausen' },
    { name: 'Thurgau', href: '/webdesign/thurgau' },
    { name: 'Bern', href: '/webdesign/bern' },
    { name: 'Basel', href: '/webdesign/basel' },
    { name: 'Luzern', href: '/webdesign/luzern' },
    { name: 'St. Gallen', href: '/webdesign/st-gallen' },
];

export function WebdesignPageContent() {
    return (
        <>
            {/* Hero Section */}
            <section className="py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                            <span className="gradient-text">Webdesign Schweiz</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-primary font-medium mb-4">
                            Moderne Websites, die überzeugen
                        </p>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
                            Von der einfachen Visitenkarte bis zur komplexen Web-Applikation – wir designen und entwickeln Websites, die Ihr Unternehmen perfekt präsentieren.
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Unsere Webdesign-Pakete
                        </h2>
                        <p className="text-text-secondary">Transparent. Fair. Leistungsstark.</p>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                                    <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${pkg.popular ? 'bg-white/20' : 'bg-primary/10 text-primary'
                                        }`}>
                                        {pkg.platform}
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
                </div>
            </section>

            {/* Features */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.1}>
                        <StaggerItem>
                            <div className="text-center p-6">
                                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                    <Palette className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">Modernes Design</h3>
                                <p className="text-text-secondary text-sm">
                                    Individuelle Designs, die Ihre Marke optimal präsentieren und Besucher überzeugen.
                                </p>
                            </div>
                        </StaggerItem>
                        <StaggerItem>
                            <div className="text-center p-6">
                                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                    <Rocket className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">SEO-optimiert</h3>
                                <p className="text-text-secondary text-sm">
                                    Jede Website ist für Suchmaschinen optimiert, damit Sie bei Google gefunden werden.
                                </p>
                            </div>
                        </StaggerItem>
                        <StaggerItem>
                            <div className="text-center p-6">
                                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                    <Code className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">Moderne Technik</h3>
                                <p className="text-text-secondary text-sm">
                                    WordPress, Wix oder Next.js – wir wählen die beste Technologie für Ihre Anforderungen.
                                </p>
                            </div>
                        </StaggerItem>
                    </StaggerContainer>
                </div>
            </section>

            {/* Regional Pages */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Webdesign in Ihrer Region
                        </h2>
                        <p className="text-text-secondary">
                            Professionelles Webdesign in der Deutschschweiz
                        </p>
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

            {/* CTA */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Bereit für Ihre neue Website?
                    </h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                        Lassen Sie uns gemeinsam Ihre Vision in eine überzeugende Website verwandeln.
                    </p>
                    <Button
                        variant="secondary"
                        size="lg"
                        className="bg-white text-primary hover:bg-white/90"
                        asChild
                    >
                        <Link href="/kontakt">
                            Kostenloses Erstgespräch
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
