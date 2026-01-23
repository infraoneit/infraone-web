import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateSpokeServiceSchema, generateWebPageSchema, generateBreadcrumbListSchema } from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie St. Gallen | VoIP Ostschweiz | InfraOne',
    description: 'Cloud-Telefonie St. Gallen: Startup- & Industrie-Erfahrung. Professionelle VoIP-Lösungen für die Ostschweiz. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie St. Gallen', 'VoIP St. Gallen', 'Telefonanlage Ostschweiz', 'Peoplefone St. Gallen'],
    alternates: {
        canonical: 'https://www.infraone.ch/cloud-telefonie/st-gallen',
        languages: {
            'de-CH': 'https://www.infraone.ch/cloud-telefonie/st-gallen',
        },
    },
};

export default function CloudTelefonieStGallenPage() {
    // Spoke Service Schema
    const serviceSchema = generateSpokeServiceSchema('st-gallen', 'St. Gallen');

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/cloud-telefonie/st-gallen`,
        'Cloud-Telefonie St. Gallen',
        'Cloud-Telefonie St. Gallen: Startup- & Industrie-Erfahrung für die Ostschweiz'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` },
        { name: 'St. Gallen', url: `${BASE_URL}/cloud-telefonie/st-gallen` },
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
            <CloudTelefonieContent regionSlug="st-gallen" />
        </>
    );
}
