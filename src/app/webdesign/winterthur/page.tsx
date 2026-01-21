import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Winterthur | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Winterthur: Ihr lokaler Partner für moderne Websites. Ab CHF 990. Persönliche Beratung. ☎ 052 222 18 18',
    keywords: ['Webdesign Winterthur', 'Website erstellen Winterthur', 'Webagentur Winterthur'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/winterthur',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/winterthur',
        },
    },
};

export default function WebdesignWinterthurPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'winterthur',
        'Webdesign',
        'https://www.infraone.ch/webdesign/winterthur'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <WebdesignContent regionSlug="winterthur" />
        </>
    );
}
