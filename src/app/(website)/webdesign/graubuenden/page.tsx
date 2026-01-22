import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

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
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'graubuenden',
        'Webdesign',
        'https://www.infraone.ch/webdesign/graubuenden'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <WebdesignContent regionSlug="graubuenden" />
        </>
    );
}
