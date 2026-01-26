import { Metadata } from 'next';
import Link from 'next/link';
import { ServicePageTemplate } from '@/components/templates/ServicePageTemplate';
import { Home, Lightbulb, BarChart3 } from 'lucide-react';
import { generateServiceWithMultipleProvidersSchema, generateFAQSchema, generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { gebaeudeautomationFaqs } from '@/data/webdesign-faqs';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Gebäudeautomation & Smart Building | Loxone Partner',
    description: 'Intelligente Gebäudesteuerung für Gewerbe und Eigenheim. Loxone Partner für Beleuchtung, Beschattung, Klima und Zutritt.',
    keywords: ['Gebäudeautomation', 'Smart Building', 'Loxone', 'Smart Home', 'Zutrittskontrolle'],
    alternates: {
        canonical: 'https://www.infraone.ch/gebaeudeautomation',
        languages: {
            'de-CH': 'https://www.infraone.ch/gebaeudeautomation',
        },
    },
};

const features = [
    {
        number: '01',
        title: 'SmartPlace Gebäudesteuerung',
        description: 'Mit SmartPlace integrieren Sie alle Gebäudetechniken in einer Plattform: Beleuchtung, Heizung, Lüftung, Beschattung und Sicherheit – intelligent vernetzt.',
        highlight: 'Zentrale Steuerung aller Gewerke',
    },
    {
        number: '02',
        title: 'WAGO Steuerungen',
        description: 'Professionelle SPS-Lösungen für Industrie und Gebäude. Wir programmieren, parametrieren und warten Ihre WAGO-Systeme – inklusive Migration auf Codesys 3.5.',
        highlight: 'Industrie-Standard SPS',
    },
    {
        number: '03',
        title: 'Loxone Smart Home',
        description: 'Vom Einfamilienhaus bis zur Gewerbeimmobilie – Loxone bietet umfassende Automatisierung für Licht, Klima, Multimedia und Sicherheit.',
        highlight: 'Smart Home & Smart Building',
    },
    {
        number: '04',
        title: 'Energiemonitoring',
        description: 'Visualisieren Sie Ihren Energieverbrauch in Echtzeit. Mit Anbindung an Solaranlagen, Wärmepumpen und Smart Metern für maximale Transparenz.',
        highlight: 'Verbrauch optimieren',
    },
];

const processSteps = [
    {
        title: 'Bestandsaufnahme',
        description: 'Wir analysieren Ihre bestehende Gebäudetechnik und identifizieren Automatisierungspotenzial.',
    },
    {
        title: 'Konzept & Planung',
        description: 'Gemeinsam mit Ihrem Elektriker entwickeln wir ein massgeschneidertes Automationskonzept.',
    },
    {
        title: 'Programmierung & Installation',
        description: 'Wir programmieren die Steuerungen und integrieren alle Komponenten – in enger Zusammenarbeit mit den ausführenden Gewerken.',
    },
    {
        title: 'Inbetriebnahme & Schulung',
        description: 'Das System wird getestet, optimiert und Sie erhalten eine umfassende Einführung.',
    },
];

const advantages = [
    {
        icon: <Home className="w-8 h-8" />,
        title: 'Umfassende Expertise',
        description: 'Von SmartPlace über WAGO bis Loxone – wir kennen alle gängigen Systeme.',
    },
    {
        icon: <Lightbulb className="w-8 h-8" />,
        title: 'Energieeffizienz',
        description: 'Automatisierung reduziert Energiekosten und steigert den Komfort.',
    },
    {
        icon: <BarChart3 className="w-8 h-8" />,
        title: 'Transparenz',
        description: 'Mit Energiemonitoring behalten Sie Verbrauch und Kosten im Blick.',
    },
];

export default function GebaeudeautomationPage() {
    const serviceSchema = generateServiceWithMultipleProvidersSchema(
        'Gebäudeautomation & IoT', 'Building Automation Service',
        'Intelligente Gebäudesteuerung mit SmartPlace, WAGO und Loxone.',
        `${BASE_URL}/gebaeudeautomation`
    );
    const faqSchema = generateFAQSchema(gebaeudeautomationFaqs);
    const breadcrumbSchema = generateBreadcrumbListSchema([{ name: 'Home', url: BASE_URL }, { name: 'Gebäudeautomation', url: `${BASE_URL}/gebaeudeautomation` }]);
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/gebaeudeautomation`, 'Gebäudeautomation & IoT', 'Intelligente Gebäudesteuerung.');

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <ServicePageTemplate
                heroImage="/images/hero_automation_1768423264177.png"
                headline="Gebäudeautomation & IoT"
                subheadline="Intelligente Steuerung für moderne Gebäude"
                description="Von der Einzelraumsteuerung bis zur vollständigen Gebäudeautomation – wir vernetzen Ihre Haustechnik intelligent mit SmartPlace, WAGO und Loxone."
                features={features}
                processHeadline="Ihr Weg zum Smart Building"
                processSteps={processSteps}
                advantages={advantages}
                faqs={gebaeudeautomationFaqs}
                ctaHeadline="Bereit für intelligente Gebäudetechnik?"
                ctaButtonLabel="Beratung anfordern"
                ctaButtonHref="/kontakt"
            />

            {/* Partner Section */}
            <section className="py-12 bg-surface border-t border-border">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-text-secondary mb-4">
                        Für Elektroinstallationen arbeiten wir mit unserem Partner zusammen:
                    </p>
                    <Link
                        href="https://www.elektro-tel.ch"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium"
                    >
                        elektro-tel.ch – Ihr Elektroinstallateur
                    </Link>
                </div>
            </section>
        </>
    );
}
