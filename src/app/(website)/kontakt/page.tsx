import { Metadata } from 'next';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { ContactSection } from '@/components/sections/ContactSection';

export const metadata: Metadata = {
    title: 'Kontakt | IT-Support Winterthur anfragen',
    description: 'Kontaktieren Sie InfraOne IT Solutions an 4 Standorten: Winterthur, Schaffhausen, Tägerwilen und Kleinandelfingen. Telefon 052 222 18 18.',
    keywords: ['Kontakt InfraOne', 'IT Support Winterthur', 'IT Beratung'],
};

const locations = [
    {
        city: 'Winterthur',
        isMain: true,
        street: 'Rudolf-Diesel-Strasse 25',
        zip: '8404',
        mapUrl: 'https://maps.app.goo.gl/KZcGeudRfoJSirLA9',
        mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2700.1!2d8.7252!3d47.497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479a998d8a3ad9cb%3A0x8f3e4b4b4b4b4b4b!2sRudolf-Diesel-Strasse%2025%2C%208404%20Winterthur!5e0!3m2!1sde!2sch!4v1234567890',
    },
    {
        city: 'Schaffhausen',
        isMain: false,
        street: 'Solenbergstrasse 35',
        zip: '8207',
        mapUrl: 'https://maps.google.com/?q=Solenbergstrasse+35+8207+Schaffhausen',
        mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2695.1!2d8.6363!3d47.6969!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSolenbergstrasse%2035%2C%208207%20Schaffhausen!5e0!3m2!1sde!2sch!4v1234567890',
    },
    {
        city: 'Tägerwilen',
        isMain: false,
        street: 'Bahnhofstrasse 17',
        zip: '8274',
        mapUrl: 'https://maps.google.com/?q=Bahnhofstrasse+17+8274+Tägerwilen',
        mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2697.1!2d9.1408!3d47.6582!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sBahnhofstrasse%2017%2C%208274%20Tägerwilen!5e0!3m2!1sde!2sch!4v1234567890',
    },
    {
        city: 'Kleinandelfingen',
        isMain: false,
        street: 'Einfangstrasse 8',
        zip: '8451',
        mapUrl: 'https://maps.google.com/?q=Einfangstrasse+8+8451+Kleinandelfingen',
        mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2697.1!2d8.6900!3d47.5961!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sEinfangstrasse%208%2C%208451%20Kleinandelfingen!5e0!3m2!1sde!2sch!4v1234567890',
    },
];

export default function KontaktPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative py-12 lg:py-16 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <Image src="/images/hero_homepage_1768423161913.png" alt="" fill className="object-cover" priority />
                </div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <AnimatedSection animation="slideUp">
                        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                            <span className="gradient-text">Kontakt</span>
                        </h1>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Besuchen Sie uns an einem unserer 4 Standorte oder kontaktieren Sie uns direkt.
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Locations Grid */}
            <section className="py-12 lg:py-16 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                            Unsere Standorte
                        </h2>
                        <p className="text-text-secondary">4 x in der Ostschweiz für Sie vor Ort</p>
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
                        {locations.map((location) => (
                            <StaggerItem key={location.city}>
                                <a
                                    href={location.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block h-full p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-xl transition-all duration-150"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-primary flex items-center gap-2">
                                                {location.city}
                                                {location.isMain && (
                                                    <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                                        Hauptsitz
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-text-secondary mt-1">
                                                {location.street}<br />
                                                {location.zip} {location.city}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>

                    {/* Contact Info */}
                    <div className="mt-12 max-w-2xl mx-auto">
                        <div className="grid sm:grid-cols-3 gap-6">
                            <a
                                href="tel:+41522221818"
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary transition-colors text-center"
                            >
                                <Phone className="w-6 h-6 text-primary" />
                                <span className="font-semibold text-text-primary">052 222 18 18</span>
                                <span className="text-xs text-text-secondary">Telefon</span>
                            </a>
                            <a
                                href="mailto:info@infraone.ch"
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary transition-colors text-center"
                            >
                                <Mail className="w-6 h-6 text-primary" />
                                <span className="font-semibold text-text-primary">info@infraone.ch</span>
                                <span className="text-xs text-text-secondary">E-Mail</span>
                            </a>
                            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border text-center">
                                <Clock className="w-6 h-6 text-primary" />
                                <span className="font-semibold text-text-primary">Mo-Fr 8:00-17:00</span>
                                <span className="text-xs text-text-secondary">Öffnungszeiten</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <ContactSection />

            {/* Map Section - Main Location */}
            <section className="py-0">
                <div className="h-[400px] w-full bg-surface">
                    <iframe
                        src={locations[0].mapEmbed}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Hauptstandort Winterthur"
                    />
                </div>
            </section>
        </>
    );
}
