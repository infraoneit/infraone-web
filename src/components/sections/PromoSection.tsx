import Link from 'next/link';
import { ArrowRight, Gift, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

interface PromoSectionProps {
    headline?: string;
    description?: string;
    ctaLabel?: string;
    ctaHref?: string;
    /** Symbol im Kreis. Standard: Geschenk (Neukunden-Leiste auf der Startseite). */
    icon?: LucideIcon;
}

export function PromoSection({
    headline = 'Neukunden willkommen',
    description = 'Lernen Sie unsere Arbeitsweise kennen: persönlich, transparent und ohne Warteschleife. Das Erstgespräch ist unverbindlich.',
    ctaLabel = 'Unsere Lösungen',
    ctaHref = '/leistungen',
    icon: Icon = Gift,
}: PromoSectionProps) {
    return (
        <section className="py-16 lg:py-20 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary-hover" />

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="promo-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <circle cx="30" cy="30" r="2" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#promo-grid)" />
                </svg>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <AnimatedSection animation="slideUp" className="max-w-3xl mx-auto text-center text-white">
                    {/* Icon */}
                    <AnimatedSection animation="scale" delay={0.2} className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                        <Icon className="w-8 h-8" />
                    </AnimatedSection>

                    {/* Content */}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        {headline}
                    </h2>
                    <p className="text-lg md:text-xl opacity-90 mb-8 max-w-xl mx-auto">
                        {description}
                    </p>

                    {/* CTA */}
                    <Button
                        variant="secondary"
                        size="lg"
                        className="bg-white text-primary hover:bg-white/90"
                        asChild
                    >
                        <Link href={ctaHref} className="group">
                            {ctaLabel}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </AnimatedSection>
            </div>
        </section>
    );
}
