import { Metadata } from 'next';
import { ITSupportContent } from '@/components/pages/ITSupportContent';
import { 
    generateITServiceLocalBusinessSchema, 
    generateBreadcrumbListSchema, 
    generateWebPageSchema,
    generateFAQSchema
} from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'IT-Support Thurgau | IT-Hilfe am Bodensee | InfraOne',
    description: 'IT-Support Thurgau: Schneller Service in Frauenfeld, Kreuzlingen, Weinfelden. ab CHF 130/h Remote, ab CHF 145/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support Thurgau', 'Computerhilfe Thurgau', 'PC Support Frauenfeld', 'IT Support Kreuzlingen'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/thurgau',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/thurgau',
        },
    },
};

export default function ITSupportThurgauPage() {
    // LocalBusiness Schema (Standort-Spoke mit physischem Büro in Tägerwilen)
    const localBusinessSchema = generateITServiceLocalBusinessSchema(
        'thurgau',
        'Thurgau',
        { postalCode: '8274', addressLocality: 'Tägerwilen' },
        ['Mo–Fr 08:00–17:00'],
        'Notfall-Support verfügbar Mo–So bis 23:00 Uhr (mit Zuschlag)'
    );

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/it-support/thurgau`,
        'IT-Support Thurgau',
        'IT-Support im Thurgau: Schneller Service in Frauenfeld, Kreuzlingen, Weinfelden und der gesamten Region.'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'IT-Support', url: `${BASE_URL}/it-support` },
        { name: 'Thurgau', url: `${BASE_URL}/it-support/thurgau` },
    ]);

    // FAQ Schema
    const faqs = [
        { question: 'Wie schnell können Sie helfen?', answer: 'Remote-Support ist meist innert 15 Minuten verfügbar. Bei Vor-Ort-Einsätzen je nach Region und Verfügbarkeit oft innerhalb weniger Stunden.' },
        { question: 'Was kostet der IT-Support?', answer: 'Remote-Support: ab CHF 130/h (Min. 15 Min.). Vor-Ort-Support: ab CHF 145/h (Min. 30 Min.). Zuschläge für Abend-/Wochenend-/Feiertagseinsätze.' },
        { question: 'Betreuen Sie auch Privatpersonen?', answer: 'Ja! Wir helfen sowohl KMU als auch Privatpersonen bei allen IT-Problemen – vom langsamen PC bis zum Virenbefall.' },
        { question: 'Wie läuft Remote-Support ab?', answer: 'Sie erhalten von uns einen sicheren Zugangslink. Nach Ihrer Freigabe können wir direkt an Ihrem Gerät arbeiten – meist ist das Problem innert Minuten gelöst.' },
        { question: 'Wie schnell sind Sie im Thurgau vor Ort?', answer: 'Je nach Standort zwischen 20 Minuten (Frauenfeld) und 45 Minuten (Kreuzlingen). Bei dringenden Fällen priorisieren wir entsprechend.' },
        { question: 'Können Sie auch bei schlechtem Internet auf dem Land helfen?', answer: 'Ja, wir haben Erfahrung mit LTE/5G-Lösungen oder Richtfunk, um auch abgelegene Höfe oder Betriebe schnell ans Internet anzubinden.' },
        { question: 'Verkaufen Sie auch Computer und Drucker?', answer: 'Ja, wir beraten Sie herstellerunabhängig und beschaffen die passende Hardware zu fairen Preisen, inklusive Installation vor Ort.' },
    ];
    const faqSchema = generateFAQSchema(faqs);

    return (
        <>
            {/* LocalBusiness Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
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
            
            <ITSupportContent regionSlug="thurgau" />
        </>
    );
}
