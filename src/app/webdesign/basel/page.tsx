import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Basel | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Basel: Professionelle Websites für die Nordwestschweiz. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Basel', 'Website erstellen Basel'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/basel',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/basel',
        },
    },
};

export default function WebdesignBaselPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'basel',
        'Webdesign',
        'https://www.infraone.ch/webdesign/basel'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <WebdesignContent regionSlug="basel" />
        </>
    );
}
