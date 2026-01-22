import { Metadata } from 'next';
import { ServicePageTemplate } from '@/components/templates/ServicePageTemplate';
import { Cog, Database, Rocket } from 'lucide-react';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Software-Entwicklung & App-Entwicklung | InfraOne',
    description: 'Individuelle Software-Lösungen, Web-Apps und mobile Apps. Von der Konzeption bis zur Umsetzung. Agile Entwicklung aus Winterthur.',
    keywords: ['Software Entwicklung', 'App Entwicklung', 'Web Applikation', 'Individualsoftware'],
    alternates: {
        canonical: 'https://www.infraone.ch/software-entwicklung',
        languages: {
            'de-CH': 'https://www.infraone.ch/software-entwicklung',
        },
    },
};

const features = [
    {
        number: '01',
        title: 'Individuelle Anwendungen',
        description: 'Wir entwickeln massgeschneiderte Software-Lösungen, die genau auf Ihre Geschäftsprozesse abgestimmt sind – von der Desktop-App bis zur Web-Anwendung.',
        highlight: 'Passgenau für Ihr Unternehmen',
    },
    {
        number: '02',
        title: 'API-Entwicklung & Integration',
        description: 'Verbinden Sie Ihre Systeme miteinander. Wir entwickeln APIs und integrieren bestehende Schnittstellen für nahtlosen Datenaustausch.',
        highlight: 'REST, GraphQL, Webhooks',
    },
    {
        number: '03',
        title: 'Automatisierung & Workflows',
        description: 'Repetitive Aufgaben automatisieren? Wir entwickeln Skripte und Workflows, die Ihren Arbeitsalltag effizienter machen.',
        highlight: 'Zeit sparen, Fehler reduzieren',
    },
    {
        number: '04',
        title: 'Datenbank-Lösungen',
        description: 'Design, Migration und Optimierung von Datenbanken. Wir sorgen dafür, dass Ihre Daten strukturiert, sicher und performant verfügbar sind.',
        highlight: 'SQL, PostgreSQL, MongoDB',
    },
];

const processSteps = [
    {
        title: 'Anforderungsanalyse',
        description: 'Wir verstehen Ihr Problem, Ihre Ziele und die technischen Rahmenbedingungen – bevor wir eine Zeile Code schreiben.',
    },
    {
        title: 'Konzept & Architektur',
        description: 'Gemeinsam definieren wir die Lösung: Technologie-Stack, Schnittstellen, Datenmodell und Zeitplan.',
    },
    {
        title: 'Agile Entwicklung',
        description: 'In kurzen Zyklen entwickeln wir Ihre Software – mit regelmässigem Feedback und transparenter Kommunikation.',
    },
    {
        title: 'Testing & Deployment',
        description: 'Ausführliche Tests, saubere Dokumentation und ein reibungsloser Go-Live – natürlich mit Einführung für Ihr Team.',
    },
];

const advantages = [
    {
        icon: <Cog className="w-8 h-8" />,
        title: 'Technologie-unabhängig',
        description: 'Wir wählen die beste Technologie für Ihr Projekt, nicht umgekehrt.',
    },
    {
        icon: <Database className="w-8 h-8" />,
        title: 'Skalierbar & zukunftssicher',
        description: 'Unsere Lösungen wachsen mit Ihrem Unternehmen mit.',
    },
    {
        icon: <Rocket className="w-8 h-8" />,
        title: 'Schnelle Umsetzung',
        description: 'Kurze Entwicklungszyklen für schnelle Ergebnisse.',
    },
];

export default function SoftwareEntwicklungPage() {
    const serviceSchema = generateServiceSchema(
        'Software-Entwicklung',
        'Software Development Service',
        'Massgeschneiderte Software für Ihr Unternehmen. API-Entwicklung, Automatisierung, Datenbankanbindungen und individuelle Anwendungen.',
        'https://www.infraone.ch/software-entwicklung'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            <ServicePageTemplate
                heroImage="/images/hero_software_1768423249576.png"
                headline="Software-Entwicklung"
                subheadline="Massgeschneiderte Lösungen für Ihr Unternehmen"
                description="Von der Prozessautomatisierung bis zur komplexen Webanwendung – wir entwickeln Software, die Ihre Arbeit einfacher und effizienter macht."
                features={features}
                processHeadline="Unser Entwicklungsprozess"
                processSteps={processSteps}
                advantages={advantages}
                ctaHeadline="Haben Sie ein Software-Projekt im Kopf?"
                ctaButtonLabel="Projekt besprechen"
                ctaButtonHref="/kontakt"
            />
        </>
    );
}
