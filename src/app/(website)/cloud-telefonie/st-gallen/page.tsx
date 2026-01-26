import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateCloudTelefonieVirtualSpokeSchema, generateFAQSchema, generateWebPageSchema, generateBreadcrumbListSchema } from '@/lib/seo/schema';
import { generateCloudTelefonieSpokeFaqs } from '@/data/webdesign-faqs';
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
    const serviceSchema = generateCloudTelefonieVirtualSpokeSchema('st-gallen', 'St. Gallen', `${BASE_URL}/#business-taegerwilen`);
    const spokeFaqs = generateCloudTelefonieSpokeFaqs('St. Gallen');
    const faqSchema = generateFAQSchema(spokeFaqs);
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/cloud-telefonie/st-gallen`, 'Cloud-Telefonie St. Gallen', 'Startup- & Industrie-Erfahrung für die Ostschweiz');
    const breadcrumbSchema = generateBreadcrumbListSchema([{ name: 'Home', url: BASE_URL }, { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` }, { name: 'St. Gallen', url: `${BASE_URL}/cloud-telefonie/st-gallen` }]);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <CloudTelefonieContent regionSlug="st-gallen" />
        </>
    );
}
