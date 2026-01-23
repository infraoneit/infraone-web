import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateSpokeServiceSchema, generateWebPageSchema, generateBreadcrumbListSchema } from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Thurgau | VoIP am Bodensee | InfraOne',
    description: 'Cloud-Telefonie Thurgau: Spezielle Lösungen für Hotels & Gastro. VoIP für Frauenfeld, Kreuzlingen, Weinfelden. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Thurgau', 'VoIP Thurgau', 'Telefonanlage Frauenfeld', 'Hotel Telefonie Bodensee'],
    alternates: {
        canonical: 'https://www.infraone.ch/cloud-telefonie/thurgau',
        languages: {
            'de-CH': 'https://www.infraone.ch/cloud-telefonie/thurgau',
        },
    },
};

export default function CloudTelefonieThurgauPage() {
    // Spoke Service Schema
    const serviceSchema = generateSpokeServiceSchema('thurgau', 'Thurgau');

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/cloud-telefonie/thurgau`,
        'Cloud-Telefonie Thurgau',
        'Cloud-Telefonie Thurgau: Spezielle Lösungen für Hotels & Gastro am Bodensee'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` },
        { name: 'Thurgau', url: `${BASE_URL}/cloud-telefonie/thurgau` },
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
            <CloudTelefonieContent regionSlug="thurgau" />
        </>
    );
}
