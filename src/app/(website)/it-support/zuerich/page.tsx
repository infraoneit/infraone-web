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
    title: 'IT-Support Zürich | Professionelle IT-Hilfe | InfraOne',
    description: 'IT-Support Zürich: Remote-Hilfe sofort, Vor-Ort-Einsätze mit kurzer Anfahrt. ab CHF 130/h Remote, ab CHF 145/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support Zürich', 'Computerhilfe Zürich', 'PC Support Zürich', 'Informatik Support Zürich'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/zuerich',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/zuerich',
        },
    },
};

export default function ITSupportZuerichPage() {
    // Virtual Spoke Schema (bedient durch Winterthur)
    const virtualSpokeSchema = generateVirtualSpokeSchema(
        'zuerich',
        'Zürich',
        `${BASE_URL}/it-support/winterthur#business`
    );

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/it-support/zuerich`,
        'IT-Support Zürich',
        'Schneller IT-Support für Zürcher KMU und Privatpersonen. Remote-Hilfe sofort, Vor-Ort-Einsätze mit kurzer Anfahrt von Winterthur.'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'IT-Support', url: `${BASE_URL}/it-support` },
        { name: 'Zürich', url: `${BASE_URL}/it-support/zuerich` },
    ]);

    // FAQ Schema
    const faqs = [
        { question: 'Wie schnell können Sie helfen?', answer: 'Remote-Support ist meist innert 15 Minuten verfügbar. Bei Vor-Ort-Einsätzen je nach Region und Verfügbarkeit oft innerhalb weniger Stunden.' },
        { question: 'Was kostet der IT-Support?', answer: 'Remote-Support: ab CHF 130/h (Min. 15 Min.). Vor-Ort-Support: ab CHF 145/h (Min. 30 Min.). Zuschläge für Abend-/Wochenend-/Feiertagseinsätze.' },
        { question: 'Betreuen Sie auch Privatpersonen?', answer: 'Ja! Wir helfen sowohl KMU als auch Privatpersonen bei allen IT-Problemen – vom langsamen PC bis zum Virenbefall.' },
        { question: 'Wie läuft Remote-Support ab?', answer: 'Sie erhalten von uns einen sicheren Zugangslink. Nach Ihrer Freigabe können wir direkt an Ihrem Gerät arbeiten – meist ist das Problem innert Minuten gelöst.' },
        { question: 'Fallen in Zürich Anfahrtskosten an?', answer: 'Ja, für Vor-Ort-Einsätze in Zürich berechnen wir eine Anfahrtspauschale von CHF 40.–. Bei längeren Einsätzen oder Wartungsverträgen entfällt diese oft.' },
        { question: 'Arbeiten Sie auch im Zentrum (Kreis 1)?', answer: 'Ja, wir betreuen mehrere Kunden in der Innenstadt. Dank guter ÖV-Anbindung sind wir auch ohne Parkplatzsuche schnell vor Ort.' },
        { question: 'Können Sie unser Büro komplett vernetzen?', answer: 'Ja, wir übernehmen die komplette Netzwerkplanung: WLAN, Firewall, Server und Arbeitsplätze. Alles aus einer Hand.' },
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
            
            <ITSupportContent regionSlug="zuerich" />
        </>
    );
}
