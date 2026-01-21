import { Metadata } from 'next';
import { ITSupportContent } from '@/components/pages/ITSupportContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'IT-Support Winterthur | Computerhilfe vor Ort | InfraOne',
    description: 'IT-Support Winterthur: Schnelle Computerhilfe vor Ort & Remote. CHF 120/h Remote, CHF 157/h Vor-Ort. Keine Anfahrtskosten. ☎ 052 222 18 18',
    keywords: ['IT Support Winterthur', 'Computerhilfe Winterthur', 'PC Support Winterthur', 'Informatik Support Winterthur'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/winterthur',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/winterthur',
        },
    },
};

export default function ITSupportWinterthurPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'winterthur',
        'IT-Support',
        'https://www.infraone.ch/it-support/winterthur'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <ITSupportContent regionSlug="winterthur" />
        </>
    );
}
