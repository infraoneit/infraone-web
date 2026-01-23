import { Metadata } from 'next';
import { ITSupportContent } from '@/components/pages/ITSupportContent';
import { 
    generateVirtualSpokeSchema, 
    generateBreadcrumbListSchema, 
    generateWebPageSchema,
    generateFAQSchema
} from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'IT-Support St. Gallen | IT-Expertise Ostschweiz | InfraOne',
    description: 'IT-Support St. Gallen: Professionelle IT-Hilfe für die Universitätsstadt. 35 Min Anfahrt. ab CHF 130/h Remote, ab CHF 145/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support St. Gallen', 'Computerhilfe St. Gallen', 'PC Support St. Gallen', 'Informatik Support Ostschweiz'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/st-gallen',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/st-gallen',
        },
    },
};

export default function ITSupportStGallenPage() {
    // Virtual Spoke Schema (bedient durch Thurgau)
    const virtualSpokeSchema = generateVirtualSpokeSchema(
        'st-gallen',
        'St. Gallen',
        `${BASE_URL}/it-support/thurgau#business`
    );

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/it-support/st-gallen`,
        'IT-Support St. Gallen',
        'IT-Support St. Gallen: Professionelle Hilfe für Unternehmen und Private in der Universitätsstadt und Umgebung.'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'IT-Support', url: `${BASE_URL}/it-support` },
        { name: 'St. Gallen', url: `${BASE_URL}/it-support/st-gallen` },
    ]);

    // FAQ Schema
    const faqs = [
        { question: 'Wie schnell können Sie helfen?', answer: 'Remote-Support ist meist innert 15 Minuten verfügbar. Bei Vor-Ort-Einsätzen je nach Region und Verfügbarkeit oft innerhalb weniger Stunden.' },
        { question: 'Was kostet der IT-Support?', answer: 'Remote-Support: ab CHF 130/h (Min. 15 Min.). Vor-Ort-Support: ab CHF 145/h (Min. 30 Min.). Zuschläge für Abend-/Wochenend-/Feiertagseinsätze.' },
        { question: 'Betreuen Sie auch Privatpersonen?', answer: 'Ja! Wir helfen sowohl KMU als auch Privatpersonen bei allen IT-Problemen – vom langsamen PC bis zum Virenbefall.' },
        { question: 'Wie läuft Remote-Support ab?', answer: 'Sie erhalten von uns einen sicheren Zugangslink. Nach Ihrer Freigabe können wir direkt an Ihrem Gerät arbeiten – meist ist das Problem innert Minuten gelöst.' },
        { question: 'Haben Sie Erfahrung mit Unternehmen aus dem HSG-Umfeld?', answer: 'Ja, wir betreuen mehrere Beratungsunternehmen und Startups, die aus dem HSG-Umfeld entstanden sind. Schnelle Skalierung und moderne Cloud-Lösungen sind unser Metier.' },
        { question: 'Bieten Sie auch regelmässige Wartung an?', answer: 'Ja, mit unseren Managed Services überwachen wir Ihre Systeme proaktiv. Wir beheben Probleme oft, bevor Sie sie bemerken.' },
        { question: 'Können Sie uns beim Umzug helfen?', answer: 'Gerne. Wir übernehmen den Abbau der IT am alten Standort und den fachgerechten Aufbau und Test am neuen Ort in St. Gallen.' },
    ];
    const faqSchema = generateFAQSchema(faqs);

    return (
        <>
            {/* Virtual Spoke Service Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(virtualSpokeSchema) }}
            />
            
            {/* WebPage Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />
            
            {/* Breadcrumb Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            
            {/* FAQ Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            
            <ITSupportContent regionSlug="st-gallen" />
        </>
    );
}
