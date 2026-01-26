import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateWebdesignVirtualSpokeSchema, generateWebdesignPackageProducts, generateOfferCatalogSchema, generateFAQSchema, generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { generateWebdesignSpokeFaqs } from '@/data/webdesign-faqs';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Webdesign Basel | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Basel: Professionelle Websites für die Nordwestschweiz. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Basel', 'Website erstellen Basel'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/basel',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/basel',
        },
    },
};

const packages = [
    { title: 'Starter-Paket', description: 'Perfekt für Startups. Bis zu 5 Seiten.', price: 'CHF 990' },
    { title: 'KMU-Paket', description: 'Für etablierte Unternehmen. Bis zu 15 Seiten.', price: 'CHF 2490' },
    { title: 'Pro-Paket', description: 'Premium-Lösung. Headless CMS.', price: 'CHF 4990' },
];

export default function WebdesignBaselPage() {
    const serviceSchema = generateWebdesignVirtualSpokeSchema('basel', 'Basel', `${BASE_URL}/#business-winterthur`, ['Basel', 'Nordwestschweiz']);
    const productSchemas = generateWebdesignPackageProducts();
    const offerCatalogSchema = generateOfferCatalogSchema(packages);
    const spokeFaqs = generateWebdesignSpokeFaqs('Basel', false);
    const faqSchema = generateFAQSchema(spokeFaqs);
    const breadcrumbSchema = generateBreadcrumbListSchema([{ name: 'Home', url: BASE_URL }, { name: 'Webdesign', url: `${BASE_URL}/webdesign` }, { name: 'Basel', url: `${BASE_URL}/webdesign/basel` }]);
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/webdesign/basel`, 'Webdesign Basel', 'Professionelle Websites für die Nordwestschweiz.');

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            {productSchemas.map((p, i) => <script key={`p-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...p }) }} />)}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <WebdesignContent regionSlug="basel" />
        </>
    );
}
