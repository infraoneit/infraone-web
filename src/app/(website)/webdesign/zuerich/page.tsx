import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Zürich | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Zürich: Professionelle Websites für Zürcher Unternehmen. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Zürich', 'Website erstellen Zürich', 'Webagentur Zürich'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/zuerich',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/zuerich',
        },
    },
};

export default function WebdesignZuerichPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'zuerich',
        'Webdesign',
        'https://www.infraone.ch/webdesign/zuerich'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <WebdesignContent regionSlug="zuerich" />
        </>
    );
}
