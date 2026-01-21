'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, Clock, CheckCircle, ArrowRight, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';

interface RegionalPageProps {
    // SEO & Content
    service: 'it-support' | 'webdesign' | 'telefonie';
    region: string;
    regionSlug: string;

    // Hero
    headline: string;
    subheadline: string;
    description: string;
    heroImage?: string;

    // Pricing (optional)
    showPricing?: boolean;

    // Features
    features: string[];

    // Related regions
    relatedRegions: { name: string; href: string }[];
}

const servicePricing = {
    'it-support': {
        remote: 'CHF 120.–/h',
        onsite: 'CHF 157.–/h',
        showAnfahrt: true,
    },
    'webdesign': {
        packages: [
            { name: 'Starter', price: 'CHF 990.–', features: ['5 Seiten', 'Responsive', 'SEO-Basics'] },
            { name: 'KMU', price: 'CHF 2\'490.–', features: ['10 Seiten', 'CMS', 'SEO-Optimiert'] },
            { name: 'Pro', price: 'ab CHF 4\'990.–', features: ['Individuell', 'Web-App', 'Support'] },
        ],
    },
    'telefonie': {
        hint: 'Preise ab CHF 15.–/Monat pro Benutzer',
    },
};

export function RegionalPageTemplate({
    service,
    region,
    regionSlug,
    headline,
    subheadline,
    description,
    heroImage,
    showPricing = true,
    features,
    relatedRegions,
}: RegionalPageProps) {
    const backLink = service === 'it-support' ? '/it-support' : service === 'webdesign' ? '/webdesign' : '/cloud-telefonie';
    const backLabel = service === 'it-support' ? 'IT-Support' : service === 'webdesign' ? 'Webdesign' : 'Cloud-Telefonie';

    return (
        <>
            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                {heroImage && (
                    <div className="absolute inset-0 z-0">
                        <Image src={heroImage} alt={headline} fill className="object-cover opacity-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
                    </div>
                )}

                <div className="container mx-auto px-4 relative z-10">
                    {/* Breadcrumb */}
                    <nav className="mb-8 text-sm">
                        <Link href="/" className="text-text-secondary hover:text-primary">Home</Link>
                        <span className="mx-2 text-text-secondary">/</span>
                        <Link href={backLink} className="text-text-secondary hover:text-primary">{backLabel}</Link>
                        <span className="mx-2 text-text-secondary">/</span>
                        <span className="text-primary">{region}</span>
                    </nav>

                    <div className="max-w-3xl">
                        <AnimatedSection animation="slideUp">
                            <div className="flex items-center gap-2 text-sm font-medium text-primary mb-4">
                                <MapPin className="w-4 h-4" />
                                <span className="uppercase tracking-wider">{region}</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                                <span className="gradient-text">{headline}</span>
                            </h1>

                            <p className="text-xl text-primary font-medium mb-4">{subheadline}</p>
                            <p className="text-lg text-text-secondary mb-8">{description}</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button variant="primary" size="lg" asChild>
                                    <Link href="/kontakt">
                                        Jetzt Anfrage stellen
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
                </div>
            </section>

            {/* Features */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            {backLabel} {region} – Ihre Vorteile
                        </h2>
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto" staggerDelay={0.1}>
                        {features.map((feature, index) => (
                            <StaggerItem key={index}>
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <span className="text-text-primary">{feature}</span>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Pricing Section */}
            {showPricing && service === 'it-support' && (
                <section className="py-16 lg:py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                                IT-Support Preise {region}
                            </h2>
                        </AnimatedSection>

                        <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-card border border-border text-center">
                                <Monitor className="w-8 h-8 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-text-primary mb-2">Remote-Support</h3>
                                <p className="text-3xl font-bold text-primary">{servicePricing['it-support'].remote}</p>
                                <p className="text-sm text-text-secondary mt-2">Schnellste Lösung – innert Minuten</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-card border border-border text-center">
                                <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-text-primary mb-2">Vor-Ort-Support</h3>
                                <p className="text-3xl font-bold text-primary">{servicePricing['it-support'].onsite}</p>
                                <p className="text-sm text-text-secondary mt-2">Persönlich bei Ihnen vor Ort</p>
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            <Link href="/it-support" className="text-primary font-medium hover:underline inline-flex items-center gap-2">
                                Alle Preise & Konditionen
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {showPricing && service === 'webdesign' && (
                <section className="py-16 lg:py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                                Webdesign Pakete
                            </h2>
                        </AnimatedSection>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
                            {servicePricing['webdesign'].packages.map((pkg, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ y: -5 }}
                                    className={`p-6 rounded-2xl border ${index === 1 ? 'bg-primary/5 border-primary' : 'bg-card border-border'}`}
                                >
                                    <h3 className="font-bold text-text-primary mb-2">{pkg.name}</h3>
                                    <p className="text-2xl font-bold text-primary mb-4">{pkg.price}</p>
                                    <ul className="space-y-2">
                                        {pkg.features.map((f, i) => (
                                            <li key={i} className="text-sm text-text-secondary flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-primary" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Related Regions */}
            <section className="py-12 lg:py-16 bg-surface">
                <div className="container mx-auto px-4">
                    <h3 className="text-center text-lg font-bold text-text-primary mb-6">
                        {backLabel} in weiteren Regionen
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {relatedRegions.map((r, index) => (
                            <Link
                                key={index}
                                href={r.href}
                                className="px-4 py-2 rounded-lg bg-card border border-border hover:border-primary hover:text-primary transition-colors text-sm font-medium text-text-secondary"
                            >
                                {r.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        {backLabel} {region} anfragen
                    </h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
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
