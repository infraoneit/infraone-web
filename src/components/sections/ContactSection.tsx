'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Phone, Mail, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

interface ContactSectionProps {
    headline?: string;
    subheadline?: string;
}

export function ContactSection({
    headline = 'Hinterlasse uns eine Nachricht',
    subheadline = 'Wir melden uns in den nächsten 48h',
}: ContactSectionProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    return (
        <section className="py-16 lg:py-24 bg-surface">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Contact Info */}
                    <AnimatedSection animation="slideRight">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                                {headline}
                            </h2>
                            <p className="text-lg text-text-secondary mb-8">
                                {subheadline}
                            </p>

                            <div className="space-y-6">
                                <a
                                    href="https://maps.app.goo.gl/KZcGeudRfoJSirLA9"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary">Adresse</p>
                                        <p className="text-text-secondary text-sm">
                                            Rudolf-Diesel-Strasse 25<br />
                                            8404 Winterthur
                                        </p>
                                    </div>
                                </a>

                                <a
                                    href="tel:+41522221818"
                                    className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary">Telefon</p>
                                        <p className="text-text-secondary text-sm">052 222 18 18</p>
                                    </div>
                                </a>

                                <a
                                    href="mailto:info@infraone.ch"
                                    className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary">E-Mail</p>
                                        <p className="text-text-secondary text-sm">info@infraone.ch</p>
                                    </div>
                                </a>

                                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary">Öffnungszeiten</p>
                                        <p className="text-text-secondary text-sm">Mo-Fr 8:00-17:00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Contact Form */}
                    <AnimatedSection animation="slideLeft">
                        <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                            {isSubmitted ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">
                                        Nachricht gesendet!
                                    </h3>
                                    <p className="text-text-secondary">
                                        Wir melden uns in Kürze bei Ihnen.
                                    </p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary"
                                                placeholder="Ihr Name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="company" className="block text-sm font-medium text-text-primary mb-2">
                                                Firma
                                            </label>
                                            <input
                                                type="text"
                                                id="company"
                                                name="company"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary"
                                                placeholder="Ihre Firma"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                                                E-Mail *
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                required
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary"
                                                placeholder="ihre@email.ch"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                                                Telefon
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary"
                                                placeholder="+41 XX XXX XX XX"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-2">
                                            Betreff *
                                        </label>
                                        <select
                                            id="subject"
                                            name="subject"
                                            required
                                            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary"
                                        >
                                            <option value="">Bitte wählen...</option>
                                            <option value="it-support">IT-Support & Netzwerke</option>
                                            <option value="telefonie">Telefonie & Kommunikation</option>
                                            <option value="videoueberwachung">Videoüberwachung</option>
                                            <option value="webdesign">Webdesign</option>
                                            <option value="software">Software-Entwicklung</option>
                                            <option value="gebaeudeautomation">Gebäudeautomation</option>
                                            <option value="andere">Andere Anfrage</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                                            Nachricht *
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary resize-none"
                                            placeholder="Wie können wir Ihnen helfen?"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-full"
                                        isLoading={isSubmitting}
                                    >
                                        <Send className="w-5 h-5" />
                                        Nachricht senden
                                    </Button>
                                </form>
                            )}
                        </div>
                    </AnimatedSection>
                </div>
            </div>
        </section>
    );
}
