'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Server,
    Phone,
    Video,
    Code,
    Palette,
    Monitor,
    Tv,
    Building2,
    ArrowRight,
    Plus
} from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';

const services = [
    {
        icon: Server,
        title: 'IT-Systeme & Netzwerke',
        subtitle: 'für Unternehmen & Privatpersonen',
        description: 'Stabile IT-Infrastrukturen mit Server, Cloud, Microsoft 365, Backup und Netzwerksicherheit.',
        href: '/it-netzwerke',
    },
    {
        icon: Phone,
        title: 'Cloud Telefonie',
        subtitle: 'peoplefone • 3CX • Yeastar',
        description: 'Moderne VoIP-Telefonanlagen für flexibles Arbeiten – im Büro, unterwegs oder im Homeoffice.',
        href: '/telefonie',
    },
    {
        icon: Video,
        title: 'Videoüberwachung',
        subtitle: 'Milestone • UniFi Protect • Aluha',
        description: 'Professionelle CCTV-Lösungen für Unternehmen und Privatkunden – datenschutzkonform.',
        href: '/videoueberwachung',
    },
    {
        icon: Palette,
        title: 'Webdesign',
        subtitle: 'WordPress • Wix • Next.js',
        description: 'Moderne, SEO-optimierte Websites ab CHF 990 – von der Visitenkarten-Website bis zur Web-App.',
        href: '/webdesign',
    },
    {
        icon: Code,
        title: 'Software-Entwicklung',
        subtitle: 'Individuelle Lösungen',
        description: 'Massgeschneiderte Software, API-Entwicklung und Prozessautomatisierung für Ihr Unternehmen.',
        href: '/software-entwicklung',
    },
    {
        icon: Monitor,
        title: 'Kontrollraum-Lösungen',
        subtitle: 'BlackBox KVM-Systeme',
        description: 'KVM-over-IP für Leitstellen und Überwachungszentralen – bis zu 16 Monitore pro Arbeitsplatz.',
        href: '/kontrollraum',
    },
    {
        icon: Tv,
        title: 'Digital Signage',
        subtitle: 'Xibo CMS • Custom Widgets',
        description: 'Display-Netzwerke für dynamische Inhalte – lokal betrieben, ohne Cloud-Abhängigkeit.',
        href: '/digital-signage',
    },
    {
        icon: Building2,
        title: 'Gebäudeautomation',
        subtitle: 'SmartPlace • WAGO • Loxone',
        description: 'Intelligente Steuerung für Beleuchtung, Heizung, Beschattung und Energiemonitoring.',
        href: '/gebaeudeautomation',
    },
];

export function ServicesSection() {
    return (
        <section className="py-20 lg:py-28 bg-background relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 opacity-50 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <AnimatedSection animation="slideUp" className="text-center mb-16">
                    <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">
                        Branchenübergreifende Lösungen
                    </p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                        Unsere IT-Kompetenzen für Ihr Projekt
                    </h2>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                        Von der IT-Infrastruktur über Telefonie bis zur Gebäudeautomation –
                        massgeschneiderte Lösungen aus einer Hand.
                    </p>
                </AnimatedSection>

                {/* Services Grid - 4 columns like Jungmann */}
                <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.08}>
                    {services.map((service, index) => (
                        <StaggerItem key={index}>
                            <Link href={service.href} className="block h-full group">
                                <motion.div
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                    className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 relative overflow-hidden"
                                >
                                    {/* Accent Line at Top */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Icon */}
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <service.icon className="w-7 h-7" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                                        {service.title}
                                    </h3>

                                    {/* Subtitle */}
                                    <p className="text-xs font-medium text-primary mb-3">
                                        {service.subtitle}
                                    </p>

                                    {/* Description */}
                                    <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                                        {service.description}
                                    </p>

                                    {/* CTA Link */}
                                    <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                                        <span>Mehr erfahren</span>
                                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                                    </div>
                                </motion.div>
                            </Link>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* CTA below services */}
                <AnimatedSection animation="slideUp" className="text-center mt-12">
                    <Link
                        href="/leistungen"
                        className="inline-flex items-center gap-2 text-primary font-medium hover:underline underline-offset-4"
                    >
                        Alle Leistungen im Überblick
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </AnimatedSection>
            </div>
        </section>
    );
}
