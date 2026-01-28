'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Phone, Mail, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

interface ContactSectionProps {
    headline?: string;
    subheadline?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export function ContactSection({
    headline = 'Hinterlasse uns eine Nachricht',
    subheadline = 'Wir melden uns in den naechsten 48h',
}: ContactSectionProps) {
    const [status, setStatus] = useState<FormStatus>('idle');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus('submitting');

        const form = e.currentTarget;
        const formData = new FormData(form);

        // Convert FormData to URLSearchParams for Netlify
        const body = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
            body.append(key, String(value));
        }

        try {
            const res = await fetch('/__forms.html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });

            if (!res.ok) {
                throw new Error('Form submission failed');
            }

            setStatus('success');
            form.reset();
        } catch (error) {
            // Error handling: set error status
            setStatus('error');
        }
    };

    const resetForm = () => {
        setStatus('idle');
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
                                        <p className="font-semibold text-text-primary">Oeffnungszeiten</p>
                                        <p className="text-text-secondary text-sm">Mo-Fr 8:00-17:00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Contact Form */}
                    <AnimatedSection animation="slideLeft">
                        <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                            {status === 'success' ? (
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
                                    <p className="text-text-secondary mb-6">
                                        Wir melden uns in Kuerze bei Ihnen.
                                    </p>
                                    <Button type="button" variant="outline" onClick={resetForm}>
                                        Neue Nachricht senden
                                    </Button>
                                </motion.div>
                            ) : status === 'error' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">
                                        Fehler beim Senden
                                    </h3>
                                    <p className="text-text-secondary mb-6">
                                        Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.
                                    </p>
                                    <Button type="button" variant="outline" onClick={resetForm}>
                                        Erneut versuchen
                                    </Button>
                                </motion.div>
                            ) : (
                                <form
                                    name="contact"
                                    method="POST"
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    {/* Hidden fields for Netlify */}
                                    <input type="hidden" name="form-name" value="contact" />
                                    <input name="bot-field" className="hidden" />

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
                                            <option value="">Bitte waehlen...</option>
                                            <option value="IT-Support und Netzwerke">IT-Support und Netzwerke</option>
                                            <option value="Telefonie und Kommunikation">Telefonie und Kommunikation</option>
                                            <option value="Videoueberwachung">Videoueberwachung</option>
                                            <option value="Webdesign">Webdesign</option>
                                            <option value="Software-Entwicklung">Software-Entwicklung</option>
                                            <option value="Gebaeudeautomation">Gebaeudeautomation</option>
                                            <option value="Andere Anfrage">Andere Anfrage</option>
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
                                            placeholder="Wie koennen wir Ihnen helfen?"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-full"
                                        isLoading={status === 'submitting'}
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