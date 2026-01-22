import { Metadata } from 'next';
import Image from 'next/image';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Users, Target, Award, Heart } from 'lucide-react';

import { generateAboutPageSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Über uns | InfraOne IT Solutions Winterthur',
    description: 'InfraOne IT Solutions – Ihr IT-Partner in Winterthur. Erfahren Sie mehr über unser Team und unsere Philosophie.',
    keywords: ['Über InfraOne', 'IT Unternehmen Winterthur', 'IT Team'],
    alternates: {
        canonical: 'https://www.infraone.ch/unternehmen',
        languages: {
            'de-CH': 'https://www.infraone.ch/unternehmen',
        },
    },
};

const values = [
    {
        icon: <Users className="w-8 h-8" />,
        title: 'Persönlich',
        description: 'Wir kennen unsere Kunden persönlich und verstehen ihre Bedürfnisse. Keine Call-Center, direkter Kontakt.',
    },
    {
        icon: <Target className="w-8 h-8" />,
        title: 'Zielorientiert',
        description: 'Wir liefern Lösungen, die funktionieren – praktisch, effizient und auf den Punkt.',
    },
    {
        icon: <Award className="w-8 h-8" />,
        title: 'Qualität',
        description: 'Wir setzen auf bewährte Technologien und saubere Umsetzung. Keine Kompromisse bei der Qualität.',
    },
    {
        icon: <Heart className="w-8 h-8" />,
        title: 'Leidenschaft',
        description: 'IT ist unsere Leidenschaft. Wir bleiben neugierig und entwickeln uns ständig weiter.',
    },
];

export default function UnternehmenPage() {
    const aboutSchema = generateAboutPageSchema();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
            />
            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <Image src="/images/hero_homepage_1768423161913.png" alt="" fill className="object-cover" priority />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <AnimatedSection animation="slideUp">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
                                <span className="gradient-text">Über InfraOne</span>
                            </h1>
                            <p className="text-xl text-text-secondary mb-8">
                                IT-Lösungen mit Verstand und Herz – für Unternehmen, die mehr wollen als Standard.
                            </p>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Story */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <AnimatedSection animation="slideUp">
                            <h2 className="text-3xl font-bold text-text-primary mb-6">Unsere Geschichte</h2>
                            <div className="prose prose-lg text-text-secondary">
                                <p className="mb-4">
                                    InfraOne IT Solutions GmbH wurde mit einer klaren Vision gegründet: IT-Dienstleistungen
                                    anzubieten, die wirklich zum Kunden passen. Keine überdimensionierten Enterprise-Lösungen
                                    für kleine Unternehmen, keine halbherzigen Kompromisse für grössere.
                                </p>
                                <p className="mb-4">
                                    Mit Sitz in Winterthur betreuen wir KMU und Privatpersonen in der gesamten
                                    Deutschschweiz. Unser Team vereint Expertise aus verschiedenen Bereichen:
                                    Von der klassischen IT-Infrastruktur über Telefonie und Sicherheit bis hin
                                    zu Webdesign und Gebäudeautomation.
                                </p>
                                <p>
                                    Was uns antreibt? Die Überzeugung, dass gute IT kein Luxus sein muss –
                                    sondern ein Werkzeug, das den Alltag einfacher macht und Unternehmen nach vorne bringt.
                                </p>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Unsere Werte
                        </h2>
                        <p className="text-text-secondary">Was uns antreibt und leitet</p>
                    </AnimatedSection>

                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.1}>
                        {values.map((value, index) => (
                            <StaggerItem key={index}>
                                <div className="text-center p-6 rounded-2xl bg-surface border border-border hover:border-primary/50 transition-all">
                                    <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                        {value.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary mb-2">{value.title}</h3>
                                    <p className="text-sm text-text-secondary">{value.description}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Lernen Sie uns kennen
                    </h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                        Wir freuen uns auf ein unverbindliches Gespräch über Ihre IT-Anforderungen.
                    </p>
                    <a
                        href="/kontakt"
                        className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-medium hover:bg-white/90 transition-colors"
                    >
                        Kontakt aufnehmen
                    </a>
                </div>
            </section>
        </>
    );
}
