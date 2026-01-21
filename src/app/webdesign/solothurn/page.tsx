import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Solothurn | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Solothurn: Remote-Betreuung mit persönlichem Support. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Solothurn', 'Website erstellen Solothurn'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/solothurn',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/solothurn',
        },
    },
};

export default function WebdesignSolothurnPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'solothurn',
        'Webdesign',
        'https://www.infraone.ch/webdesign/solothurn'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <WebdesignContent regionSlug="solothurn" />
        </>
    );
}
