'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';

interface Testimonial {
    name: string;
    company: string;
    quote: string;
    rating: number;
    service: string;
}

const defaultTestimonials: Testimonial[] = [
    {
        name: 'Konradhof Winterthur',
        company: 'Immobilienverwaltung',
        quote: 'InfraOne hat unsere gesamte IT-Infrastruktur modernisiert. Schneller Support und kompetente Beratung – genau das, was wir gesucht haben.',
        rating: 5,
        service: 'IT-Netzwerke',
    },
    {
        name: 'Handwerksbetrieb Müller',
        company: 'Handwerk',
        quote: 'Die neue 3CX Telefonanlage funktioniert einwandfrei. Endlich flexible Telefonie für unsere Mitarbeiter im Büro und unterwegs.',
        rating: 5,
        service: 'Telefonie',
    },
    {
        name: 'Praxis Dr. Muster',
        company: 'Arztpraxis Winterthur',
        quote: 'Professionelle Videoüberwachung mit klarer Beratung zum Datenschutz. Wir fühlen uns sicher und gut betreut.',
        rating: 5,
        service: 'Videoüberwachung',
    },
    {
        name: 'StartUp AG',
        company: 'Tech StartUp Zürich',
        quote: 'Unsere neue Website von InfraOne übertrifft alle Erwartungen. Modern, schnell und perfekt für SEO optimiert.',
        rating: 5,
        service: 'Webdesign',
    },
];

interface TestimonialsSectionProps {
    headline?: string;
    testimonials?: Testimonial[];
}

export function TestimonialsSection({
    headline = 'Das sagen unsere Kunden:',
    testimonials = defaultTestimonials,
}: TestimonialsSectionProps) {
    return (
        <section className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                        {headline}
                    </h2>
                </div>

                <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
                    {testimonials.map((testimonial, index) => (
                        <StaggerItem key={index}>
                            <motion.div
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                                className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                            >
                                {/* Quote Icon */}
                                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                                    <Quote className="w-5 h-5" />
                                </div>

                                {/* Rating */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < testimonial.rating
                                                    ? 'text-yellow-500 fill-yellow-500'
                                                    : 'text-border'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-4">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>

                                {/* Author */}
                                <div className="pt-4 border-t border-border">
                                    <p className="font-semibold text-text-primary text-sm">
                                        {testimonial.name}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {testimonial.company}
                                    </p>
                                    <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                                        {testimonial.service}
                                    </span>
                                </div>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    );
}
