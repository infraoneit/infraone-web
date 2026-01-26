import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Server, Phone, Video, Code, Palette, Monitor, Tv, Building2, Plus } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';

import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Leistungen | IT-Dienstleistungen Winterthur',
    description: 'Alle IT-Dienstleistungen von InfraOne: Netzwerke, Telefonie, Sicherheit, Webdesign, Software und Gebäudeautomation.',
    keywords: ['IT Dienstleistungen', 'IT Service Winterthur', 'Informatik Winterthur'],
    alternates: {
        canonical: 'https://www.infraone.ch/leistungen',
        languages: {
            'de-CH': 'https://www.infraone.ch/leistungen',
        },
    },
};

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
        title: 'Telefonie & Kommunikation',
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
        icon: Code,
        title: 'Software-Entwicklung',
        subtitle: 'Individuelle Lösungen',
        description: 'Massgeschneiderte Software, API-Entwicklung und Prozessautomatisierung für Ihr Unternehmen.',
        href: '/software-entwicklung',
    },
    {
        icon: Palette,
        title: 'Webdesign',
        subtitle: 'WordPress • Wix • Next.js',
        description: 'Moderne, SEO-optimierte Websites ab CHF 990 – von der Visitenkarten-Website bis zur Web-App.',
        href: '/webdesign',
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
        title: 'Gebäudeautomation & IoT',
        subtitle: 'SmartPlace • WAGO • Loxone',
        description: 'Intelligente Steuerung für Beleuchtung, Heizung, Beschattung und Energiemonitoring.',
        href: '/gebaeudeautomation',
    },
];

export default function LeistungenPage() {
    const serviceSchema = generateServiceSchema(
        'IT-Dienstleistungen',
        'ProfessionalService',
        'Alle IT-Dienstleistungen von InfraOne aus einer Hand: Netzwerke, Telefonie, Sicherheit, Webdesign, Software und Gebäudeautomation.',
        'https://www.infraone.ch/leistungen'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <Image src="/images/hero_homepage_1768423161913.png" alt="" fill className="object-cover" priority />
                </div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <AnimatedSection animation="slideUp">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                            <span className="gradient-text">Unsere Leistungen</span>
                        </h1>
                        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                            Von der IT-Infrastruktur über Webdesign bis zur Gebäudeautomation – alles aus einer Hand.
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.08}>
                        {services.map((service, index) => (
                            <StaggerItem key={index}>
                                <Link href={service.href} className="block h-full group">
                                    <motion.div
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-150 relative overflow-hidden"
                                    >
                                        {/* Accent Line at Top */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Icon */}
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <service.icon className="w-7 h-7" />
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-lg font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                                            {service.title}
                                        </h2>

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
                                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-150" />
                                        </div>
                                    </motion.div>
                                </Link>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Nicht sicher, welche Lösung passt?
                    </h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                        Wir beraten Sie gerne und finden gemeinsam die optimale Lösung für Ihr Unternehmen.
                    </p>
                    <Link
                        href="/kontakt"
                        className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-medium hover:bg-white/90 transition-colors"
                    >
                        Kostenloses Erstgespräch
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </>
    );
}
