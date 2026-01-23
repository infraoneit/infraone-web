import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateSpokeServiceSchema, generateWebPageSchema, generateBreadcrumbListSchema } from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Zürich | VoIP für KMU | InfraOne',
    description: 'Cloud-Telefonie Zürich: Peoplefone & 3CX für Zürcher Unternehmen. Professionelle Anrufbehandlung, kurze Wege von Winterthur. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Zürich', 'VoIP Zürich', 'Telefonanlage Zürich', '3CX Zürich'],
    alternates: {
        canonical: 'https://www.infraone.ch/cloud-telefonie/zuerich',
        languages: {
            'de-CH': 'https://www.infraone.ch/cloud-telefonie/zuerich',
        },
    },
};

export default function CloudTelefonieZuerichPage() {
    // Spoke Service Schema
    const serviceSchema = generateSpokeServiceSchema('zuerich', 'Zürich');

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/cloud-telefonie/zuerich`,
        'Cloud-Telefonie Zürich',
        'Cloud-Telefonie Zürich: Peoplefone & 3CX für Zürcher Unternehmen'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` },
        { name: 'Zürich', url: `${BASE_URL}/cloud-telefonie/zuerich` },
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <CloudTelefonieContent regionSlug="zuerich" />
        </>
    );
}
