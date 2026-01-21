import { Metadata } from 'next';
import { ITSupportContent } from '@/components/pages/ITSupportContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'IT-Support Schaffhausen | Lokaler IT-Service | InfraOne',
    description: 'IT-Support Schaffhausen: Mit Büro vor Ort bieten wir schnelle IT-Hilfe. Keine Anfahrtskosten. CHF 120/h Remote, CHF 157/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support Schaffhausen', 'Computerhilfe Schaffhausen', 'PC Support Schaffhausen', 'Informatik Support Schaffhausen'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/schaffhausen',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/schaffhausen',
        },
    },
};

export default function ITSupportSchaffhausenPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'schaffhausen',
        'IT-Support',
        'https://www.infraone.ch/it-support/schaffhausen'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <ITSupportContent regionSlug="schaffhausen" />
        </>
    );
}
