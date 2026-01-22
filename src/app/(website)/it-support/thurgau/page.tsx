import { Metadata } from 'next';
import { ITSupportContent } from '@/components/pages/ITSupportContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'IT-Support Thurgau | IT-Hilfe am Bodensee | InfraOne',
    description: 'IT-Support Thurgau: Schneller Service in Frauenfeld, Kreuzlingen, Weinfelden. CHF 120/h Remote, CHF 157/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support Thurgau', 'Computerhilfe Thurgau', 'PC Support Frauenfeld', 'IT Support Kreuzlingen'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/thurgau',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/thurgau',
        },
    },
};

export default function ITSupportThurgauPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'thurgau',
        'IT-Support',
        'https://www.infraone.ch/it-support/thurgau'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <ITSupportContent regionSlug="thurgau" />
        </>
    );
}
