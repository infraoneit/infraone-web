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
    title: 'IT-Support Schaffhausen | Lokaler IT-Service | InfraOne',
    description: 'IT-Support Schaffhausen: Mit Büro vor Ort bieten wir schnelle IT-Hilfe. Keine Anfahrtskosten. ab CHF 130/h Remote, ab CHF 145/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support Schaffhausen', 'Computerhilfe Schaffhausen', 'PC Support Schaffhausen', 'Informatik Support Schaffhausen'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/schaffhausen',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/schaffhausen',
        },
    },
};

export default function ITSupportSchaffhausenPage() {
    // LocalBusiness Schema (Standort-Spoke mit physischem Büro)
    const localBusinessSchema = generateITServiceLocalBusinessSchema(
        'schaffhausen',
        'Schaffhausen',
        { postalCode: '8200', addressLocality: 'Schaffhausen' },
        ['Mo–Fr 08:00–17:00'],
        'Notfall-Support verfügbar Mo–So bis 23:00 Uhr (mit Zuschlag)'
    );

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/it-support/schaffhausen`,
        'IT-Support Schaffhausen',
        'IT-Support Schaffhausen: Mit Büro vor Ort bieten wir schnelle IT-Hilfe für Unternehmen und Privatpersonen.'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'IT-Support', url: `${BASE_URL}/it-support` },
        { name: 'Schaffhausen', url: `${BASE_URL}/it-support/schaffhausen` },
    ]);

    // FAQ Schema
    const faqs = [
        { question: 'Wie schnell können Sie helfen?', answer: 'Remote-Support ist meist innert 15 Minuten verfügbar. Bei Vor-Ort-Einsätzen je nach Region und Verfügbarkeit oft innerhalb weniger Stunden.' },
        { question: 'Was kostet der IT-Support?', answer: 'Remote-Support: ab CHF 130/h (Min. 15 Min.). Vor-Ort-Support: ab CHF 145/h (Min. 30 Min.). Zuschläge für Abend-/Wochenend-/Feiertagseinsätze.' },
        { question: 'Betreuen Sie auch Privatpersonen?', answer: 'Ja! Wir helfen sowohl KMU als auch Privatpersonen bei allen IT-Problemen – vom langsamen PC bis zum Virenbefall.' },
        { question: 'Wie läuft Remote-Support ab?', answer: 'Sie erhalten von uns einen sicheren Zugangslink. Nach Ihrer Freigabe können wir direkt an Ihrem Gerät arbeiten – meist ist das Problem innert Minuten gelöst.' },
        { question: 'Betreuen Sie auch Industrieunternehmen?', answer: 'Ja, wir haben langjährige Erfahrung mit Industrie-IT: Vernetzung von Maschinensteuerungen, OT-Security, und klassische Office-IT. Wir verstehen beide Welten.' },
        { question: 'Haben Sie Erfahrung mit ERP-Systemen?', answer: 'Wir arbeiten eng mit ERP-Herstellern zusammen und stellen die technische Basis (Server, Netzwerk) sicher, damit Ihre Software reibungslos läuft.' },
        { question: 'Bieten Sie auch am Wochenende Support?', answer: 'Für Vertragskunden mit SLA bieten wir auch erweiterten Support am Wochenende an.' },
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
            
            <ITSupportContent regionSlug="schaffhausen" />
        </>
    );
}
