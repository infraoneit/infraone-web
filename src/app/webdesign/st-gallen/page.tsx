import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign St. Gallen | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign St. Gallen: Professionelle Websites für die Ostschweiz. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign St. Gallen', 'Website erstellen St. Gallen'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/st-gallen',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/st-gallen',
        },
    },
};

export default function WebdesignStGallenPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'st-gallen',
        'Webdesign',
        'https://www.infraone.ch/webdesign/st-gallen'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <WebdesignContent regionSlug="st-gallen" />
        </>
    );
}
