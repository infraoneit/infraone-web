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
    title: 'IT-Support Andelfingen | IT-Hilfe im Weinland | InfraOne',
    description: 'IT-Support Andelfingen & Weinland: Persönlicher Service für KMU und Privatpersonen. 20 Min Anfahrt. ab CHF 130/h Remote, ab CHF 145/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support Andelfingen', 'Computerhilfe Weinland', 'PC Support Andelfingen', 'IT Support Zürcher Weinland'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/andelfingen',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/andelfingen',
        },
    },
};

export default function ITSupportAndelfingenPage() {
    // LocalBusiness Schema (Standort-Spoke mit physischem Büro)
    const localBusinessSchema = generateITServiceLocalBusinessSchema(
        'andelfingen',
        'Andelfingen',
        { postalCode: '8451', addressLocality: 'Kleinandelfingen' },
        ['Mo–Fr 08:00–17:00'],
        'Notfall-Support verfügbar Mo–So bis 23:00 Uhr (mit Zuschlag)'
    );

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/it-support/andelfingen`,
        'IT-Support Andelfingen',
        'IT-Support Andelfingen & Weinland: Persönlicher Service für KMU und Privatpersonen.'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'IT-Support', url: `${BASE_URL}/it-support` },
        { name: 'Andelfingen', url: `${BASE_URL}/it-support/andelfingen` },
    ]);

    // FAQ Schema
    const faqs = [
        { question: 'Wie schnell können Sie helfen?', answer: 'Remote-Support ist meist innert 15 Minuten verfügbar. Bei Vor-Ort-Einsätzen je nach Region und Verfügbarkeit oft innerhalb weniger Stunden.' },
        { question: 'Was kostet der IT-Support?', answer: 'Remote-Support: ab CHF 130/h (Min. 15 Min.). Vor-Ort-Support: ab CHF 145/h (Min. 30 Min.). Zuschläge für Abend-/Wochenend-/Feiertagseinsätze.' },
        { question: 'Betreuen Sie auch Privatpersonen?', answer: 'Ja! Wir helfen sowohl KMU als auch Privatpersonen bei allen IT-Problemen – vom langsamen PC bis zum Virenbefall.' },
        { question: 'Wie läuft Remote-Support ab?', answer: 'Sie erhalten von uns einen sicheren Zugangslink. Nach Ihrer Freigabe können wir direkt an Ihrem Gerät arbeiten – meist ist das Problem innert Minuten gelöst.' },
        { question: 'Verstehen Sie die Bedürfnisse von Landwirtschaftsbetrieben?', answer: 'Ja, wir betreuen mehrere Bauern- und Weinbaubetriebe im Weinland. Von der Anbindung von Melkrobotern bis zur Buchhaltungssoftware – wir kennen die Anforderungen.' },
        { question: 'Kommen Sie auch für kleine Probleme vorbei?', answer: 'Ja, wir helfen auch, wenn "nur" der Drucker klemmt oder das Internet langsam ist. Im Weinland berechnen wir keine Anfahrt.' },
        { question: 'Können Sie alte Computer wieder schneller machen?', answer: 'Oft ja. Mit einer SSD-Aufrüstung bringen wir ältere PCs und Laptops wieder auf Trab – eine kostengünstige Alternative zum Neukauf.' },
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
            
            <ITSupportContent regionSlug="andelfingen" />
        </>
    );
}
