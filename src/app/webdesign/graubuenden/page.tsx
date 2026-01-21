import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Graubünden | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Graubünden: Websites für Tourismus und lokale KMU. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Graubünden', 'Website erstellen Chur'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/graubuenden',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/graubuenden',
        },
    },
};

export default function WebdesignGraubuendenPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'graubuenden',
        'Webdesign',
        'https://www.infraone.ch/webdesign/graubuenden'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <WebdesignContent regionSlug="graubuenden" />
        </>
    );
}
