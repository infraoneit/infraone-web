import { Metadata } from 'next';
import { ServicePageTemplate } from '@/components/templates/ServicePageTemplate';
import { Tv, Settings, Cloud } from 'lucide-react';
import { generateServiceWithMultipleProvidersSchema, generateFAQSchema, generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { digitalSignageFaqs } from '@/data/webdesign-faqs';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Digital Signage Lösungen | Infoscreens & Werbedisplays',
    description: 'Professionelle Digital Signage Lösungen für Empfang, Schaufenster & Mitarbeiterinfos. Beratung, Hardware & Content Management aus einer Hand.',
    keywords: ['Digital Signage', 'Infoscreen', 'Werbedisplay', 'Digitale Beschilderung'],
    alternates: {
        canonical: 'https://www.infraone.ch/digital-signage',
        languages: {
            'de-CH': 'https://www.infraone.ch/digital-signage',
        },
    },
};

const features = [
    {
        number: '01',
        title: 'Xibo CMS Lokal',
        description: 'Betreiben Sie Ihr Digital Signage System auf einem lokalen Mini-Server – ohne Cloud-Abhängigkeit, volle Kontrolle über Ihre Daten.',
        highlight: 'Bis zu 10 Bildschirme pro Server',
    },
    {
        number: '02',
        title: 'Custom Widgets',
        description: 'Wir entwickeln individuelle Widgets für Ihre speziellen Anforderungen: Zugverbindungen, Wetter, Solaranlagen-Daten, Datenbank-Anbindungen und mehr.',
        highlight: 'SBB, Wetter, DB-Anbindung',
    },
    {
        number: '03',
        title: 'Hardware-Komplettpaket',
        description: 'Von der Beratung über die Hardware bis zur Installation – wir liefern alles aus einer Hand: Displays, Player, Server und Zubehör.',
        highlight: 'Alles aus einer Hand',
    },
    {
        number: '04',
        title: 'Content Management',
        description: 'Einfache Verwaltung Ihrer Inhalte über das intuitive Xibo CMS. Zeitgesteuerte Playlists, verschiedene Zonen und Multi-Screen-Layouts.',
        highlight: 'Einfach zu bedienen',
    },
];

const processSteps = [
    {
        title: 'Bedarfsanalyse',
        description: 'Welche Inhalte sollen angezeigt werden? Wo kommen die Displays hin? Welche Datenquellen werden benötigt?',
    },
    {
        title: 'Konzept & Angebot',
        description: 'Wir erstellen ein massgeschneidertes Konzept mit Hardware-Empfehlung, Server-Konfiguration und Widget-Entwicklung.',
    },
    {
        title: 'Installation & Einrichtung',
        description: 'Professionelle Montage der Displays, Einrichtung des Servers und Konfiguration aller Inhalte und Playlists.',
    },
    {
        title: 'Schulung & Wartung',
        description: 'Ihr Team lernt das System kennen. Mit optionalen Wartungsverträgen kümmern wir uns um Updates und Support.',
    },
];

const advantages = [
    {
        icon: <Tv className="w-8 h-8" />,
        title: 'Lokaler Betrieb',
        description: 'Keine Cloud-Abhängigkeit, keine monatlichen Gebühren – volle Kontrolle.',
    },
    {
        icon: <Settings className="w-8 h-8" />,
        title: 'Custom Development',
        description: 'Individuelle Widgets und Anbindungen für Ihre speziellen Anforderungen.',
    },
    {
        icon: <Cloud className="w-8 h-8" />,
        title: 'Skalierbar',
        description: 'Starten Sie mit wenigen Displays und erweitern Sie bei Bedarf.',
    },
];

export default function DigitalSignagePage() {
    const serviceSchema = generateServiceWithMultipleProvidersSchema(
        'Digital Signage', 'Digital Signage Service',
        'Professionelle Digital Signage Lösungen mit Xibo CMS.',
        `${BASE_URL}/digital-signage`
    );
    const faqSchema = generateFAQSchema(digitalSignageFaqs);
    const breadcrumbSchema = generateBreadcrumbListSchema([{ name: 'Home', url: BASE_URL }, { name: 'Digital Signage', url: `${BASE_URL}/digital-signage` }]);
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/digital-signage`, 'Digital Signage', 'Professionelle Digital Signage Lösungen.');

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <ServicePageTemplate
                heroImage="/images/hero_digital_signage_1768423279297.png"
                headline="Digital Signage"
                subheadline="Professionelle Displaynetzwerke mit Xibo CMS"
                description="Dynamische Inhalte auf Ihren Bildschirmen – von der Begrüssung im Empfangsbereich bis zur Produktionsinformation. Mit individuellem Content und Custom Widgets."
                features={features}
                processHeadline="Von der Idee zum Display-Netzwerk"
                processSteps={processSteps}
                advantages={advantages}
                ctaHeadline="Bereit für Digital Signage?"
                ctaButtonLabel="Projekt besprechen"
                ctaButtonHref="/kontakt"
            />
        </>
    );
}
