import { Metadata } from 'next';
import { ITSupportContent } from '@/components/pages/ITSupportContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'IT-Support Zürich | Professionelle IT-Hilfe | InfraOne',
    description: 'IT-Support Zürich: Remote-Hilfe sofort, Vor-Ort-Einsätze mit kurzer Anfahrt. CHF 120/h Remote, CHF 157/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support Zürich', 'Computerhilfe Zürich', 'PC Support Zürich', 'Informatik Support Zürich'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/zuerich',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/zuerich',
        },
    },
};

export default function ITSupportZuerichPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'zuerich',
        'IT-Support',
        'https://www.infraone.ch/it-support/zuerich'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <ITSupportContent regionSlug="zuerich" />
        </>
    );
}
