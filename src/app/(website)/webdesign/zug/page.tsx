import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Zug | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Zug: Premium Websites für Zuger Unternehmen. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Zug', 'Website erstellen Zug'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/zug',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/zug',
        },
    },
};

export default function WebdesignZugPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'zug',
        'Webdesign',
        'https://www.infraone.ch/webdesign/zug'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <WebdesignContent regionSlug="zug" />
        </>
    );
}
