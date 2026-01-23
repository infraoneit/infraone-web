import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Server, Phone, Video, Code, Palette, Monitor, Tv, Building2 } from 'lucide-react';
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
        icon: <Server className="w-8 h-8" />,
        title: 'IT-Systeme & Netzwerke',
        description: 'Stabile IT-Infrastrukturen für Ihr Unternehmen. Server, Cloud, Netzwerk und Sicherheit.',
        href: '/it-netzwerke',
        color: 'from-green-500 to-emerald-600',
    },
    {
        icon: <Phone className="w-8 h-8" />,
        title: 'Telefonie & Kommunikation',
        description: 'Moderne Business-Telefonie mit peoplefone, 3CX und Yeastar.',
        href: '/telefonie',
        color: 'from-blue-500 to-cyan-600',
    },
    {
        icon: <Video className="w-8 h-8" />,
        title: 'Videoüberwachung',
        description: 'Professionelle CCTV-Lösungen mit Milestone VMS und UniFi Protect.',
        href: '/videoueberwachung',
        color: 'from-red-500 to-orange-600',
    },
    {
        icon: <Code className="w-8 h-8" />,
        title: 'Software-Entwicklung',
        description: 'Individuelle Softwarelösungen, API-Entwicklung und Automatisierung.',
        href: '/software-entwicklung',
        color: 'from-purple-500 to-violet-600',
    },
    {
        icon: <Palette className="w-8 h-8" />,
        title: 'Webdesign',
        description: 'Moderne, SEO-optimierte Websites ab CHF 990.',
        href: '/webdesign',
        color: 'from-pink-500 to-rose-600',
    },
    {
        icon: <Monitor className="w-8 h-8" />,
        title: 'Kontrollraum-Lösungen',
        description: 'KVM-Systeme von BlackBox für Leitstellen und Kontrollräume.',
        href: '/kontrollraum',
        color: 'from-gray-500 to-slate-600',
    },
    {
        icon: <Tv className="w-8 h-8" />,
        title: 'Digital Signage',
        description: 'Professionelle Display-Lösungen mit Xibo CMS.',
        href: '/digital-signage',
        color: 'from-amber-500 to-yellow-600',
    },
    {
        icon: <Building2 className="w-8 h-8" />,
        title: 'Gebäudeautomation & IoT',
        description: 'Intelligente Steuerung mit SmartPlace, WAGO und Loxone.',
        href: '/gebaeudeautomation',
        color: 'from-teal-500 to-cyan-600',
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
                                <Link href={service.href} className="block h-full">
                                    <div className="group h-full p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-xl transition-all duration-150">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            {service.icon}
                                        </div>
                                        <h2 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                                            {service.title}
                                        </h2>
                                        <p className="text-sm text-text-secondary mb-4">
                                            {service.description}
                                        </p>
                                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                            Mehr erfahren
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
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
