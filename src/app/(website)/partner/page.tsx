import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Handshake, Cpu } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { gewerbepartner, technologiepartner } from '@/data/partners';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    // Das Layout haengt "| InfraOne" automatisch an - hier nur der Seitenname.
    title: 'Partner',
    description:
        'Mit wem wir zusammenarbeiten: Elektrofachbetriebe für gemeinsame Projekte und die Hersteller, deren Technik wir bei unseren Kunden einsetzen und betreuen.',
    keywords: ['InfraOne Partner', 'IT Partner Winterthur', 'peoplefone Partner', '3CX Partner', 'Milestone'],
    alternates: { canonical: `${BASE_URL}/partner` },
};

export default function PartnerPage() {
    return (
        <>
            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <AnimatedSection animation="slideUp">
                        <div className="max-w-3xl">
                            <p className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">
                                Zusammenarbeit
                            </p>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
                                Unsere Partner
                            </h1>
                            <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                                Gute IT entsteht selten allein. Wir arbeiten mit Elektrofachbetrieben zusammen,
                                wenn ein Projekt Strom und Daten gleichzeitig braucht — und wir setzen Technik
                                ein, hinter der wir stehen. Hier steht, wer das ist und warum.
                            </p>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Gewerbepartner */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp">
                        <div className="flex items-center gap-3 mb-4">
                            <Handshake className="w-6 h-6 text-primary" />
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                                Partner im Gewerbe
                            </h2>
                        </div>
                        <p className="text-text-secondary max-w-2xl mb-10">
                            Betriebe, mit denen wir Projekte gemeinsam ausführen — jeder macht das, was er am
                            besten kann.
                        </p>
                    </AnimatedSection>

                    <StaggerContainer className="grid gap-6" staggerDelay={0.08}>
                        {gewerbepartner.map(p => (
                            <StaggerItem key={p.name}>
                                <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 h-full">
                                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-4">
                                        <h3 className="text-xl font-bold text-text-primary">{p.name}</h3>
                                        <span className="text-sm text-text-secondary">{p.kurz}</span>
                                    </div>
                                    <p className="text-text-secondary leading-relaxed mb-5">{p.text}</p>
                                    <a
                                        href={p.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                                    >
                                        Website besuchen
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Technologiepartner */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp">
                        <div className="flex items-center gap-3 mb-4">
                            <Cpu className="w-6 h-6 text-primary" />
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                                Technologie, die wir einsetzen
                            </h2>
                        </div>
                        <p className="text-text-secondary max-w-2xl mb-10">
                            Diese Hersteller stecken in den Lösungen, die wir bei unseren Kunden aufbauen und
                            betreuen.
                        </p>
                    </AnimatedSection>

                    <StaggerContainer
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        staggerDelay={0.05}
                    >
                        {technologiepartner.map(p => (
                            <StaggerItem key={p.name}>
                                <div className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col">
                                    <div className="h-12 mb-5 flex items-center">
                                        <Image
                                            src={p.logo}
                                            alt={p.name}
                                            width={140}
                                            height={48}
                                            className="max-h-12 w-auto object-contain dark:brightness-0 dark:invert"
                                        />
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary">{p.name}</h3>
                                    <p className="text-sm text-primary mb-3">{p.kurz}</p>
                                    <p className="text-text-secondary text-sm leading-relaxed flex-1">
                                        {p.text}
                                    </p>
                                    <a
                                        href={p.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium mt-5"
                                    >
                                        Zum Hersteller
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Abschluss */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                                Sie sind Elektrofachbetrieb?
                            </h2>
                            <p className="text-text-secondary leading-relaxed mb-6">
                                Wenn bei Ihren Projekten regelmässig IT-Fragen auftauchen, die Sie nicht selbst
                                abdecken wollen: Wir übernehmen den IT-Teil und lassen die Kundenbeziehung dort,
                                wo sie hingehört — bei Ihnen. Melden Sie sich, dann besprechen wir, wie das
                                aussehen kann.
                            </p>
                            <Button variant="primary" size="lg" asChild>
                                <Link href="/kontakt">Gespräch vereinbaren</Link>
                            </Button>
                        </div>
                    </AnimatedSection>
                </div>
            </section>
        </>
    );
}
