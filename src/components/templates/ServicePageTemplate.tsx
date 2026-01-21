'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';

interface Feature {
    number: string;
    title: string;
    description: string;
    highlight: string;
}

interface ProcessStep {
    title: string;
    description: string;
}

interface Advantage {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface ServicePageProps {
    // Hero
    headline: string;
    subheadline: string;
    description: string;
    heroImage?: string;

    // Features
    features: Feature[];

    // Process
    processHeadline?: string;
    processSteps?: ProcessStep[];

    // Advantages
    advantages?: Advantage[];

    // CTA
    ctaHeadline: string;
    ctaButtonLabel?: string;
    ctaButtonHref?: string;
}

export function ServicePageTemplate({
    headline,
    subheadline,
    description,
    heroImage,
    features,
    processHeadline = 'So läuft unsere Zusammenarbeit ab',
    processSteps = [],
    advantages = [],
    ctaHeadline,
    ctaButtonLabel = 'Jetzt Beratung anfordern',
    ctaButtonHref = '/kontakt',
}: ServicePageProps) {
    return (
        <>
            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                {/* Background Image - dezent wie bei IT-Support SEO Seiten */}
                {heroImage && (
                    <div className="absolute inset-0 opacity-10">
                        <Image
                            src={heroImage}
                            alt=""
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="max-w-xl">
                            <AnimatedSection animation="slideUp">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                                    <span className="gradient-text">{headline}</span>
                                </h1>
                                <p className="text-xl md:text-2xl text-primary font-medium mb-4">
                                    {subheadline}
                                </p>
                                <p className="text-lg text-text-secondary max-w-2xl mb-8">
                                    {description}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button variant="primary" size="lg" asChild>
                                        <Link href={ctaButtonHref}>
                                            {ctaButtonLabel}
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

                        {/* Hero Image on the right */}
                        {heroImage && (
                            <AnimatedSection animation="slideUp" delay={0.2} className="hidden lg:block">
                                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border">
                                    <Image
                                        src={heroImage}
                                        alt={headline}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                                </div>
                            </AnimatedSection>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <StaggerContainer className="grid md:grid-cols-2 gap-8" staggerDelay={0.15}>
                        {features.map((feature, index) => (
                            <StaggerItem key={index}>
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300"
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
                                </motion.div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Process Section */}
            {processSteps.length > 0 && (
                <section className="py-16 lg:py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                                {processHeadline}
                            </h2>
                        </AnimatedSection>

                        <div className="max-w-3xl mx-auto">
                            <StaggerContainer className="space-y-6" staggerDelay={0.1}>
                                {processSteps.map((step, index) => (
                                    <StaggerItem key={index}>
                                        <motion.div
                                            whileHover={{ x: 10 }}
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
                                        </motion.div>
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        </div>
                    </div>
                </section>
            )}

            {/* Advantages Section */}
            {advantages.length > 0 && (
                <section className="py-16 lg:py-24 bg-surface">
                    <div className="container mx-auto px-4">
                        <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.15}>
                            {advantages.map((advantage, index) => (
                                <StaggerItem key={index}>
                                    <div className="text-center p-6">
                                        <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                            {advantage.icon}
                                        </div>
                                        <h3 className="text-lg font-bold text-text-primary mb-2">
                                            {advantage.title}
                                        </h3>
                                        <p className="text-text-secondary text-sm">
                                            {advantage.description}
                                        </p>
                                    </div>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    </div>
                </section>
            )}

            {/* Sticky CTA Section */}
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
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-2xl mx-auto text-center text-white"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            {ctaHeadline}
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                variant="secondary"
                                size="lg"
                                className="bg-white text-primary hover:bg-white/90"
                                asChild
                            >
                                <Link href={ctaButtonHref}>
                                    {ctaButtonLabel}
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
                    </motion.div>
                </div>
            </section>
        </>
    );
}
