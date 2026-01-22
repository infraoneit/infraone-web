import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Luzern | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Luzern: Websites für die Zentralschweiz. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Luzern', 'Website erstellen Luzern'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/luzern',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/luzern',
        },
    },
};

export default function WebdesignLuzernPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'luzern',
        'Webdesign',
        'https://www.infraone.ch/webdesign/luzern'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <WebdesignContent regionSlug="luzern" />
        </>
    );
}
