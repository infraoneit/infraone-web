'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Phone, CheckCircle, Shield, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const testimonials = [
    {
        quote: "Schneller Support und kompetente Beratung",
        author: "Konradhof Winterthur",
        service: "IT-Support",
    },
    {
        quote: "Endlich eine IT, die einfach funktioniert!",
        author: "Handwerksbetrieb Müller",
        service: "Cloud-Telefonie",
    },
    {
        quote: "Professionell, zuverlässig und fair",
        author: "Praxis Dr. Muster",
        service: "Netzwerk",
    },
    {
        quote: "Top Betreuung für unsere Webprojekte",
        author: "Startup AG",
        service: "Webdesign",
    },
];

export function HeroSection() {
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-surface">
            {/* Background Image */}
            <div className="absolute inset-0 opacity-10">
                <Image src="/images/hero_homepage_1768423161913.png" alt="" fill className="object-cover" priority />
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30 pointer-events-none z-[1]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(61,150,70,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(61,150,70,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(61,150,70,0.15)_0%,transparent_50%)]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Side - Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        {/* Overline */}
                        <p className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">
                            IT-Dienstleister Winterthur • Seit über 10 Jahren
                        </p>

                        {/* H1 - SEO Optimized with Keywords */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
                            <span className="gradient-text">IT-Support, Telefonie &<br />Webdesign</span>{' '}
                            <span className="block text-text-primary mt-2">für KMU & Private</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-xl leading-relaxed">
                            Managed IT-Services, Cloud-Telefonanlagen, sichere Netzwerke und professionelles Webdesign –
                            alles aus einer Hand in Winterthur und der Ostschweiz.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-10">
                            <Button variant="primary" size="lg" className="text-base" asChild>
                                <Link href="/kontakt">
                                    Kostenloses Erstgespräch buchen
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="text-base" asChild>
                                <a href="tel:+41522221818">
                                    <Phone className="w-5 h-5" />
                                    052 222 18 18
                                </a>
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <CheckCircle className="w-5 h-5 text-primary" />
                                <span>Alles aus einer Hand</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <Shield className="w-5 h-5 text-primary" />
                                <span>Persönlicher Support</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <Clock className="w-5 h-5 text-primary" />
                                <span>Schnelle Reaktionszeit</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side - Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        {/* Main Image Container */}
                        <div className="relative">
                            {/* Glowing Border Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/20 rounded-2xl blur-lg opacity-50" />

                            {/* Image */}
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl">
                                <Image
                                    src="/images/hero_it_network_1768423176860.png"
                                    alt="IT-Infrastruktur und Serverraum"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
                            </div>

                            {/* Floating Rotating Testimonial Card */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="absolute -top-4 -right-4 bg-card border border-border rounded-xl p-4 shadow-xl w-[220px]"
                            >
                                {/* Stars */}
                                <div className="flex gap-0.5 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                                    ))}
                                </div>

                                {/* Rotating Quote */}
                                <div className="h-[60px] relative overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentTestimonial}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <p className="text-xs text-text-secondary italic leading-relaxed">
                                                &ldquo;{testimonials[currentTestimonial].quote}&rdquo;
                                            </p>
                                            <p className="text-xs font-semibold text-primary mt-2">
                                                — {testimonials[currentTestimonial].author}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Progress Dots */}
                                <div className="flex gap-1.5 mt-2">
                                    {testimonials.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentTestimonial(index)}
                                            className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentTestimonial
                                                ? 'bg-primary w-4'
                                                : 'bg-border hover:bg-primary/50'
                                                }`}
                                            aria-label={`Bewertung ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Border / Separator */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </section>
    );
}

