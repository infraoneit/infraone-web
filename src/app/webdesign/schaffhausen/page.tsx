import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Schaffhausen | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Schaffhausen: Lokaler Partner für moderne Websites. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Schaffhausen', 'Website erstellen Schaffhausen'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/schaffhausen',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/schaffhausen',
        },
    },
};

export default function WebdesignSchaffhausenPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'schaffhausen',
        'Webdesign',
        'https://www.infraone.ch/webdesign/schaffhausen'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <WebdesignContent regionSlug="schaffhausen" />
        </>
    );
}
