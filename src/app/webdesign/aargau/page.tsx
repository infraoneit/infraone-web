import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Aargau | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Aargau: Websites für KMU in Aarau, Baden und Region. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Aargau', 'Website erstellen Aarau'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/aargau',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/aargau',
        },
    },
};

export default function WebdesignAargauPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'aargau',
        'Webdesign',
        'https://www.infraone.ch/webdesign/aargau'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <WebdesignContent regionSlug="aargau" />
        </>
    );
}
