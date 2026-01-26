import { Metadata } from 'next';
import { ServicePageTemplate } from '@/components/templates/ServicePageTemplate';
import { Cloud, Building, Headphones } from 'lucide-react';
import { generateServiceWithMultipleProvidersSchema, generateFAQSchema, generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { processSteps } from '@/data/telefonie';
import { telefonieFaqs } from '@/data/webdesign-faqs';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Telefonie & Kommunikation | Business-Telefonie Schweiz',
    description: 'Moderne Business-Telefonie für Ihr Unternehmen. Cloud-Lösungen und On-Premise Anlagen von Peoplefone, 3CX und Yeastar. Kostenloses Erstgespräch.',
    keywords: ['Telefonie Schweiz', 'Business Telefonie', 'Cloud Telefonie', 'On-Premise', '3CX', 'Peoplefone', 'Yeastar'],
    alternates: {
        canonical: 'https://www.infraone.ch/telefonie',
        languages: {
            'de-CH': 'https://www.infraone.ch/telefonie',
        },
    },
};

const features = [
    {
        number: '01',
        title: 'Cloud Telefonanlage (Hosted PBX)',
        description: 'Mit peoplefone oder 3CX in der Cloud telefonieren Sie flexibel von überall – am Arbeitsplatz, unterwegs oder im Homeoffice. Keine teure Hardware, volle Skalierbarkeit.',
        highlight: 'peoplefone & 3CX Hosted',
    },
    {
        number: '02',
        title: 'On-Premise Telefonanlagen',
        description: 'Sie möchten die volle Kontrolle über Ihre Telefonanlage? Mit Yeastar oder 3CX On-Premise betreiben Sie Ihre Telefonie im eigenen Haus – sicher und individuell konfigurierbar.',
        highlight: 'Yeastar & 3CX On-Premise',
    },
    {
        number: '03',
        title: 'Microsoft Teams Integration',
        description: 'Verbinden Sie Ihre Telefonie direkt mit Microsoft Teams. Telefonieren Sie mit Ihrer Geschäftsnummer direkt aus Teams – nahtlos integriert in Ihren Arbeitsalltag.',
        highlight: 'Teams als Telefonanlage nutzen',
    },
    {
        number: '04',
        title: 'Endgeräte & Hardware',
        description: 'Von Tischtelefonen über Headsets bis zu Konferenzlösungen – wir beraten Sie bei der Auswahl und Installation der passenden Hardware für Ihr Team.',
        highlight: 'Yealink, Snom, Jabra & mehr',
    },
];

const advantages = [
    {
        icon: <Cloud className="w-8 h-8" />,
        title: 'Cloud oder On-Premise',
        description: 'Sie entscheiden, wo Ihre Telefonie läuft – wir unterstützen beide Modelle professionell.',
    },
    {
        icon: <Building className="w-8 h-8" />,
        title: 'Für KMU optimiert',
        description: 'Unsere Lösungen sind auf kleine und mittlere Unternehmen zugeschnitten – flexibel, bezahlbar, leistungsstark.',
    },
    {
        icon: <Headphones className="w-8 h-8" />,
        title: 'Persönliche Betreuung',
        description: 'Kein Call-Center, sondern direkter Kontakt zu Experten, die Ihre Anlage kennen.',
    },
];

export default function TelefoniePage() {
    const serviceSchema = generateServiceWithMultipleProvidersSchema(
        'Telefonie & Kommunikation', 'Telecommunications Service',
        'Moderne Business-Telefonie für Ihr Unternehmen. Cloud und On-Premise.',
        `${BASE_URL}/telefonie`
    );
    const faqSchema = generateFAQSchema(telefonieFaqs);
    const breadcrumbSchema = generateBreadcrumbListSchema([{ name: 'Home', url: BASE_URL }, { name: 'Telefonie', url: `${BASE_URL}/telefonie` }]);
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/telefonie`, 'Telefonie & Kommunikation', 'Moderne Business-Telefonie.');

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <ServicePageTemplate
                heroImage="/images/hero_telefonie_1768423192251.png"
                headline="Telefonie & Kommunikation"
                subheadline="Moderne Business-Telefonie für Ihr Unternehmen"
                description="Flexible Telefonie mit peoplefone, 3CX oder Yeastar – als Cloud-Lösung oder On-Premise. Wir finden die passende Lösung für Ihr Unternehmen und begleiten Sie von der Planung bis zum Support."
                features={features}
                processHeadline="So läuft Ihre Telefonie-Umstellung ab"
                processSteps={processSteps}
                advantages={advantages}
                ctaHeadline="Bereit für moderne Telefonie?"
                ctaButtonLabel="Kostenloses Erstgespräch"
                ctaButtonHref="tel:+41522221818"
            // Note: User explicitly asked for "Kostenloses Erstgespräch" and number 052 222 18 18.
            // The template takes ctaButtonHref for the primary button. I'll point it to call for now or contact.
            // Re-reading user request: "Kostenloses Erstgespräch" and "052 222 18 18" are mentioned near each other.
            // The template usually has a button for link and a secondary for phone.
            // I will stick to standard layout but ensure text matches.
            />
        </>
    );
}
