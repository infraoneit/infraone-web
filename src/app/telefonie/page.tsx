import { Metadata } from 'next';
import { ServicePageTemplate } from '@/components/templates/ServicePageTemplate';
import { Cloud, Building, Headphones } from 'lucide-react';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Telefonie & Kommunikation | Cloud Telefonanlagen Winterthur',
    description: 'Moderne Business-Telefonie mit peoplefone, 3CX und Yeastar. Cloud und On-Premise Telefonanlagen für KMU in Winterthur und der Schweiz.',
    keywords: ['3CX Telefonie', 'peoplefone', 'Cloud Telefonanlage', 'VoIP Winterthur', 'Yeastar'],
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

const processSteps = [
    {
        title: 'Analyse Ihrer aktuellen Telefonie',
        description: 'Wir schauen uns Ihre bestehende Lösung an, verstehen Ihre Anforderungen und identifizieren Verbesserungspotenzial.',
    },
    {
        title: 'Massgeschneidertes Konzept',
        description: 'Ob Cloud oder On-Premise, peoplefone, 3CX oder Yeastar – wir empfehlen die Lösung, die zu Ihrem Unternehmen passt.',
    },
    {
        title: 'Professionelle Installation',
        description: 'Wir konfigurieren Ihre Telefonanlage, portieren Ihre Nummern und schulen Ihr Team im Umgang mit dem neuen System.',
    },
    {
        title: 'Laufender Support',
        description: 'Bei Fragen oder Problemen sind wir für Sie da. Mit Wartungsverträgen sichern Sie sich schnelle Hilfe und regelmässige Updates.',
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
    const serviceSchema = generateServiceSchema(
        'Telefonie & Kommunikation',
        'Telecommunications Service',
        'Moderne Business-Telefonie mit peoplefone, 3CX und Yeastar. Cloud und On-Premise Telefonanlagen für KMU in der Schweiz.',
        'https://www.infraone.ch/telefonie'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
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
                ctaButtonHref="/kontakt"
            />
        </>
    );
}
