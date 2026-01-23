import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateSpokeServiceSchema, generateWebPageSchema, generateBreadcrumbListSchema } from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Rapperswil | VoIP Zürichsee | InfraOne',
    description: 'Cloud-Telefonie Rapperswil-Jona: Persönlicher Ansprechpartner, lokale Betreuung. VoIP für Unternehmen am Zürichsee. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Rapperswil', 'VoIP Rapperswil', 'Telefonanlage Zürichsee', 'Peoplefone Rapperswil'],
    alternates: {
        canonical: 'https://www.infraone.ch/cloud-telefonie/rapperswil',
        languages: {
            'de-CH': 'https://www.infraone.ch/cloud-telefonie/rapperswil',
        },
    },
};

export default function CloudTelefonieRapperswilPage() {
    // Spoke Service Schema
    const serviceSchema = generateSpokeServiceSchema('rapperswil', 'Rapperswil');

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/cloud-telefonie/rapperswil`,
        'Cloud-Telefonie Rapperswil',
        'Cloud-Telefonie Rapperswil-Jona: Persönlicher Ansprechpartner, lokale Betreuung'
    );

    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` },
        { name: 'Rapperswil', url: `${BASE_URL}/cloud-telefonie/rapperswil` },
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
            <CloudTelefonieContent regionSlug="rapperswil" />
        </>
    );
}
