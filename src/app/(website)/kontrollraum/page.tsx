import { Metadata } from 'next';
import { ServicePageTemplate } from '@/components/templates/ServicePageTemplate';
import { Monitor, Cpu, Zap } from 'lucide-react';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Kontrollraum & Leitstellen Planung | KVM & Videowalls',
    description: 'Planung und Ausstattung professioneller Kontrollräume und Leitstellen. KVM-Lösungen, Videowalls und 24/7-Arbeitsplätze.',
    keywords: ['Kontrollraum', 'Leitstelle', 'KVM Matrix', 'Videowall', 'Operator Workspace'],
    alternates: {
        canonical: 'https://www.infraone.ch/kontrollraum',
        languages: {
            'de-CH': 'https://www.infraone.ch/kontrollraum',
        },
    },
};

const features = [
    {
        number: '01',
        title: 'KVM-over-IP Systeme',
        description: 'Mit BlackBox Emerald greifen Sie auf mehrere Rechner von einem Arbeitsplatz aus zu – über IP, ohne Verzögerung und in höchster Bildqualität.',
        highlight: 'BlackBox Emerald KVM',
    },
    {
        number: '02',
        title: 'Multi-Monitor Arbeitsplätze',
        description: 'Bis zu 16 Monitore pro Arbeitsplatz, nahtlos integriert. Perfekt für Überwachungszentralen, Trading-Desks und Produktionsleitstände.',
        highlight: 'Bis zu 16 Monitore pro User',
    },
    {
        number: '03',
        title: 'Redundanz & Ausfallsicherheit',
        description: 'Kritische Infrastruktur braucht Ausfallsicherheit. Unsere Lösungen bieten redundante Pfade und Failover-Mechanismen.',
        highlight: 'Hochverfügbar & redundant',
    },
    {
        number: '04',
        title: 'Videowand-Integration',
        description: 'Integrieren Sie Ihre Videowände nahtlos in die KVM-Infrastruktur – für maximale Übersicht und zentrale Steuerung.',
        highlight: 'Videowand-Steuerung',
    },
];

const processSteps = [
    {
        title: 'Bedarfsanalyse',
        description: 'Wir analysieren Ihre Anforderungen: Anzahl Arbeitsplätze, Quellen, Auflösungen und Redundanzanforderungen.',
    },
    {
        title: 'Systemdesign',
        description: 'Basierend auf Ihren Anforderungen designen wir die optimale KVM-Architektur – mit BlackBox Emerald oder anderen Lösungen.',
    },
    {
        title: 'Installation & Konfiguration',
        description: 'Professionelle Installation vor Ort, Konfiguration aller Komponenten und Integration in Ihre bestehende Infrastruktur.',
    },
    {
        title: 'Schulung & Support',
        description: 'Ihr Team lernt das System kennen. Mit unserem Support sind Sie auch langfristig bestens betreut.',
    },
];

const advantages = [
    {
        icon: <Monitor className="w-8 h-8" />,
        title: 'BlackBox Expertise',
        description: 'Wir sind spezialisiert auf BlackBox Emerald und kennen die Systeme in- und auswendig.',
    },
    {
        icon: <Cpu className="w-8 h-8" />,
        title: 'Massgeschneidert',
        description: 'Jede Kontrollraum-Lösung wird individuell auf Ihre Anforderungen zugeschnitten.',
    },
    {
        icon: <Zap className="w-8 h-8" />,
        title: 'Zuverlässiger Support',
        description: 'Bei kritischer Infrastruktur zählt jede Minute – wir reagieren schnell und kompetent.',
    },
];

export default function KontrollraumPage() {
    const serviceSchema = generateServiceSchema(
        'Kontrollraum-Lösungen',
        'Control Room System Service',
        'KVM-Systeme von BlackBox für Leitstellen und Kontrollräume. Zentrale Steuerung, Visualisierung und Ausfallsicherheit.',
        'https://www.infraone.ch/kontrollraum'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            <ServicePageTemplate
                heroImage="/images/hero_automation_1768423264177.png"
                headline="Kontrollraum-Lösungen"
                subheadline="KVM-Systeme für Leitstellen und Überwachungszentralen"
                description="Zentrale Steuerung, maximale Übersicht und Ausfallsicherheit – mit professionellen KVM-Systemen von BlackBox."
                features={features}
                processHeadline="Ihr Weg zur professionellen Kontrollraum-Lösung"
                processSteps={processSteps}
                advantages={advantages}
                ctaHeadline="Planen Sie einen Kontrollraum?"
                ctaButtonLabel="Beratung anfordern"
                ctaButtonHref="/kontakt"
            />
        </>
    );
}
