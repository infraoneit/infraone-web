import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Thurgau | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Thurgau: Websites für KMU in Frauenfeld und Region. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Thurgau', 'Website erstellen Frauenfeld'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/thurgau',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/thurgau',
        },
    },
};

export default function WebdesignThurgauPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'thurgau',
        'Webdesign',
        'https://www.infraone.ch/webdesign/thurgau'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <WebdesignContent regionSlug="thurgau" />
        </>
    );
}
