import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Bern | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Bern: Remote-Betreuung mit persönlicher Beratung. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Bern', 'Website erstellen Bern'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/bern',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/bern',
        },
    },
};

export default function WebdesignBernPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'bern',
        'Webdesign',
        'https://www.infraone.ch/webdesign/bern'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <WebdesignContent regionSlug="bern" />
        </>
    );
}
