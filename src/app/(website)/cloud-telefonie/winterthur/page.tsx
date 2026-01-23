import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateSpokeServiceSchema, generateWebPageSchema, generateBreadcrumbListSchema } from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Winterthur | Ihr lokaler VoIP-Partner | InfraOne',
    description: 'Cloud-Telefonie Winterthur: Hauptstandort – persönliche Betreuung & schnelle Reaktionszeit. Peoplefone-Experten vor Ort. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Winterthur', 'VoIP Winterthur', 'Telefonanlage Winterthur', 'Peoplefone Winterthur'],
    alternates: {
        canonical: 'https://www.infraone.ch/cloud-telefonie/winterthur',
        languages: {
            'de-CH': 'https://www.infraone.ch/cloud-telefonie/winterthur',
        },
    },
};

export default function CloudTelefonieWinterthurPage() {
    // Spoke Service Schema
    const serviceSchema = generateSpokeServiceSchema('winterthur', 'Winterthur');

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/cloud-telefonie/winterthur`,
        'Cloud-Telefonie Winterthur',
        'Cloud-Telefonie Winterthur: Hauptstandort – persönliche Betreuung & schnelle Reaktionszeit'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` },
        { name: 'Winterthur', url: `${BASE_URL}/cloud-telefonie/winterthur` },
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
            <CloudTelefonieContent regionSlug="winterthur" />
        </>
    );
}
