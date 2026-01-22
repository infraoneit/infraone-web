import { Metadata } from 'next';
import { ITSupportContent } from '@/components/pages/ITSupportContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'IT-Support Andelfingen | IT-Hilfe im Weinland | InfraOne',
    description: 'IT-Support Andelfingen & Weinland: Persönlicher Service für KMU und Privatpersonen. 20 Min Anfahrt. CHF 120/h Remote, CHF 157/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support Andelfingen', 'Computerhilfe Weinland', 'PC Support Andelfingen', 'IT Support Zürcher Weinland'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/andelfingen',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/andelfingen',
        },
    },
};

export default function ITSupportAndelfingenPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'andelfingen',
        'IT-Support',
        'https://www.infraone.ch/it-support/andelfingen'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <ITSupportContent regionSlug="andelfingen" />
        </>
    );
}
