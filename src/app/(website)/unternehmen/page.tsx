import { Metadata } from 'next';
import Image from 'next/image';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Timeline } from '@/components/ui/Timeline';
import { Users, Target, Award, Heart, Linkedin, Mail } from 'lucide-react';

import { generateAboutPageSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Über uns | InfraOne IT Solutions Winterthur',
    description: 'InfraOne IT Solutions – Ihr IT-Partner in Winterthur. Erfahren Sie mehr über unser Team, unsere Geschichte und unsere Philosophie.',
    keywords: ['Über InfraOne', 'IT Unternehmen Winterthur', 'IT Team', 'Geschichte InfraOne'],
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

const timelineEvents = [
    {
        year: '2026',
        title: 'Rebranding & Strategische Neuausrichtung',
        description: 'Der Blick nach vorn. Unser neuer Webauftritt ist mehr als nur frisches Design – er ist das Spiegelbild unserer Evolution. Heute sind wir Ihr umfassender Partner für die digitale Zukunft.',
        highlight: true,
    },
    {
        year: '2025',
        title: 'Phönix aus der Asche: Die Geburt von InfraOne',
        description: 'Wir sind zurück – stärker, fokussierter und mit neuem Namen: InfraOne IT Solutions GmbH. Durch die Übernahme der Bestandskunden der Elektro-Tel AG bieten wir nun Elektrotechnik und IT aus einer Hand.',
        highlight: true,
    },
    {
        year: '2021',
        title: 'Die Feuerprobe',
        description: 'Am 3. März 2021 zerstörte ein Grossbrand unsere Büroräumlichkeiten komplett. 48 Stunden später lief unser Betrieb provisorisch wieder. Wir legten das operative Geschäft strategisch auf Eis, um den Wiederaufbau richtig zu gestalten.',
    },
    {
        year: '2019',
        title: 'Wachstum durch Vertrauen: Übernahme NET-SYS',
        description: 'Die Übernahme der NET-SYS IT Solutions GmbH war eine bedeutende Stärkung unseres Geschäftsfelds mit neuen Kunden und Mitarbeitenden.',
    },
    {
        year: '2015',
        title: 'Wir schaffen Raum für Fokus',
        description: 'Um der steigenden Nachfrage gerecht zu werden, holten wir erstmals Verstärkung für die Administration.',
    },
    {
        year: '2013',
        title: 'Ein starkes Fundament: Umwandlung zur GmbH',
        description: 'Neun Jahre nach der Gründung wandelten wir die Einzelfirma in eine GmbH um – ein Bekenntnis zu Stabilität und Wachstum.',
    },
    {
        year: '2006',
        title: 'Der erste eigene Raum',
        description: 'Der Umzug in die ersten externen Büroräumlichkeiten war ein wichtiger Meilenstein.',
    },
    {
        year: '2004',
        title: 'Wo alles begann',
        description: 'Von einem kleinen Homeoffice in Hinwil aus betreuten wir unsere allerersten Kunden.',
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

            {/* CEO Section */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                                Führung mit Vision
                            </h2>
                            <p className="text-text-secondary">Das Gesicht hinter InfraOne</p>
                        </AnimatedSection>

                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <AnimatedSection animation="slideUp" delay={0.1}>
                                <div className="relative">
                                    <div className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-border">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center p-8">
                                                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Users className="w-16 h-16 text-primary/50" />
                                                </div>
                                                <p className="text-sm text-text-secondary">Foto folgt</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
                                    <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/5 rounded-xl -z-10" />
                                </div>
                            </AnimatedSection>

                            <AnimatedSection animation="slideUp" delay={0.2}>
                                <div className="lg:pl-8">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                                        <Award className="w-4 h-4" />
                                        <span>Geschäftsführer & Gründer</span>
                                    </div>

                                    <h3 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                                        Aladdin Avci
                                    </h3>
                                    <p className="text-lg text-primary font-medium mb-6">
                                        Dipl. Techniker HF Systemtechnik
                                    </p>

                                    <div className="prose prose-lg text-text-secondary mb-8">
                                        <p className="mb-4">
                                            Mit einem Hintergrund in Elektrotechnik und IT verbindet Aladdin Avci
                                            zwei Disziplinen, die heute enger zusammengehören als je zuvor. Nach
                                            Stationen bei Securiton, Peoplefone und in der Netzwerktechnik bringt
                                            er fundiertes Know-how aus Grossprojekten mit kritischer Infrastruktur mit.
                                        </p>
                                        <p>
                                            Als diplomierter Techniker HF Systemtechnik ist er nicht nur Stratege,
                                            sondern auch Macher: nah an Projekten, Kunden und Partnern. Seine Mission:
                                            Technik verständlich, sicher und nachhaltig machen – hands-on und schnell.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <a
                                            href="mailto:aladdin.avci@infraone.ch"
                                            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-card border border-border hover:border-primary text-text-primary hover:text-primary transition-all"
                                        >
                                            <Mail className="w-5 h-5" />
                                            <span className="font-medium">E-Mail</span>
                                        </a>
                                        <a
                                            href="https://www.linkedin.com/in/aladdin-avci/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-card border border-border hover:border-primary text-text-primary hover:text-primary transition-all"
                                        >
                                            <Linkedin className="w-5 h-5" />
                                            <span className="font-medium">LinkedIn</span>
                                        </a>
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </div>
            </section>
            {/* Timeline */}
            <section className="py-16 lg:py-24 bg-background overflow-hidden">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Unsere Reise
                        </h2>
                        <p className="text-lg text-primary font-medium">
                            Mehr als nur Jahre
                        </p>
                    </AnimatedSection>

                    <Timeline
                        events={timelineEvents}
                        introText="Hinter jedem Meilenstein stehen Menschen, Entscheidungen und der unbedingte Wille, Technologie für Sie besser zu machen. Unsere Geschichte ist geprägt von stetigem Wachstum, mutigen Schritten und der Fähigkeit, auch aus Krisen gestärkt hervorzugehen."
                    />
                </div>
            </section>

            {/* Values */}
            <section className="py-16 lg:py-24 bg-surface">
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
                                <div className="text-center p-6 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all">
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