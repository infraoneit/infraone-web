import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateCloudTelefonieVirtualSpokeSchema, generateFAQSchema, generateWebPageSchema, generateBreadcrumbListSchema } from '@/lib/seo/schema';
import { generateCloudTelefonieSpokeFaqs } from '@/data/webdesign-faqs';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Schaffhausen | Moderne VoIP-Telefonie | InfraOne',
    description: 'Cloud-Telefonie Schaffhausen: Industrie-Erfahrung, persönliche Beratung. Peoplefone für Schaffhauser Unternehmen. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Schaffhausen', 'VoIP Schaffhausen', 'Telefonanlage Schaffhausen', 'Peoplefone Schaffhausen'],
    alternates: {
        canonical: 'https://www.infraone.ch/cloud-telefonie/schaffhausen',
        languages: {
            'de-CH': 'https://www.infraone.ch/cloud-telefonie/schaffhausen',
        },
    },
};

export default function CloudTelefonieSchaffhausenPage() {
    const serviceSchema = generateCloudTelefonieVirtualSpokeSchema('schaffhausen', 'Schaffhausen', `${BASE_URL}/#business-schaffhausen`);
    const spokeFaqs = generateCloudTelefonieSpokeFaqs('Schaffhausen');
    const faqSchema = generateFAQSchema(spokeFaqs);
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/cloud-telefonie/schaffhausen`, 'Cloud-Telefonie Schaffhausen', 'Industrie-Erfahrung, persönliche Beratung');
    const breadcrumbSchema = generateBreadcrumbListSchema([{ name: 'Home', url: BASE_URL }, { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` }, { name: 'Schaffhausen', url: `${BASE_URL}/cloud-telefonie/schaffhausen` }]);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <CloudTelefonieContent regionSlug="schaffhausen" />
        </>
    );
}
