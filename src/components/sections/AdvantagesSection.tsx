'use client';

import { motion } from 'framer-motion';
import { Puzzle, Settings, Shield, Zap } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';

interface Advantage {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const defaultAdvantages: Advantage[] = [
    {
        icon: <Puzzle className="w-8 h-8" />,
        title: 'Alles aus einer Hand',
        description: 'IT, Netzwerke, Telefonie, Sicherheit & Automation – alle Lösungen nahtlos integriert mit nur einem Ansprechpartner.',
    },
    {
        icon: <Settings className="w-8 h-8" />,
        title: 'Technik & Zuverlässigkeit',
        description: 'Bewährte Systeme, die leicht bedienbar sind und zuverlässig funktionieren – optimal auf Unternehmen abgestimmt.',
    },
    {
        icon: <Shield className="w-8 h-8" />,
        title: 'Sicher & Nachhaltig',
        description: 'Wir setzen auf Lösungen, die langfristig funktionieren – klar verständlich, sicher geschützt und professionell betreut.',
    },
];

interface AdvantagesSectionProps {
    headline?: string;
    subheadline?: string;
    description?: string;
    advantages?: Advantage[];
}

export function AdvantagesSection({
    headline = 'Warum InfraOne IT Solutions',
    subheadline = 'Ihr Informatiker für moderne IT-Lösungen',
    description = 'Wir bringen jahrelange Erfahrung aus IT-Support, Netzwerken, VoIP, Webdesign, Smart Building und Sicherheitslösungen zusammen – für eine IT, die zuverlässig funktioniert.',
    advantages = defaultAdvantages,
}: AdvantagesSectionProps) {
    return (
        <section className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                <AnimatedSection animation="slideUp" className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                        {headline}
                    </h2>
                    <p className="text-xl text-primary font-medium mb-4">{subheadline}</p>
                    <p className="text-text-secondary">{description}</p>
                </AnimatedSection>

                <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.15}>
                    {advantages.map((advantage, index) => (
                        <StaggerItem key={index}>
                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                                className="group relative h-full p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-150"
                            >
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-150">
                                    {advantage.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-text-primary mb-3">
                                    {advantage.title}
                                </h3>
                                <p className="text-text-secondary leading-relaxed">
                                    {advantage.description}
                                </p>

                                {/* Decorative Corner */}
                                <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl">
                                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/5 to-transparent" />
                                </div>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    );
}
