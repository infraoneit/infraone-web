'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { useState } from 'react';
import { testimonials as defaultTestimonials, type Testimonial } from '@/data/testimonials';

interface TestimonialsSectionProps {
    headline?: string;
    testimonials?: Testimonial[];
}

export function TestimonialsSection({
    headline = 'Das sagen unsere Kunden:',
    testimonials = defaultTestimonials,
}: TestimonialsSectionProps) {
    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

    const toggleExpand = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedCards(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <section className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                        {headline}
                    </h2>
                </div>

                <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start" staggerDelay={0.1}>
                    {testimonials.map((testimonial, index) => {
                        const isExpanded = expandedCards[index];
                        const shouldTruncate = testimonial.quote.length > 150;
                        const displayText = !shouldTruncate || isExpanded 
                            ? testimonial.quote 
                            : testimonial.quote.slice(0, 150) + '...';

                        return (
                            <StaggerItem key={index}>
                                <a
                                    href={testimonial.googleReviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-150 cursor-pointer flex flex-col"
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

                                        {/* Quote - nimmt verfügbaren Platz ein */}
                                        <div className="mb-4 flex-grow min-h-[120px] flex flex-col">
                                            <p className="text-text-secondary text-sm leading-relaxed flex-grow">
                                                &ldquo;{displayText}&rdquo;
                                            </p>
                                            {shouldTruncate && (
                                                <button
                                                    onClick={(e) => toggleExpand(index, e)}
                                                    className="mt-2 text-xs font-medium text-primary hover:underline self-start"
                                                >
                                                    {isExpanded ? 'Weniger anzeigen' : 'Mehr lesen'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Author - bleibt immer am unteren Ende */}
                                        <div className="pt-4 border-t border-border mt-auto">
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
                                </a>
                            </StaggerItem>
                        );
                    })}
                </StaggerContainer>
            </div>
        </section>
    );
}
