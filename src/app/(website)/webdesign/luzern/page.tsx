import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateWebdesignVirtualSpokeSchema, generateWebdesignPackageProducts, generateOfferCatalogSchema, generateFAQSchema, generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { generateWebdesignSpokeFaqs } from '@/data/webdesign-faqs';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Webdesign Luzern | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Luzern: Websites für die Zentralschweiz. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Luzern', 'Website erstellen Luzern'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/luzern',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/luzern',
        },
    },
};

const packages = [
    { title: 'Starter-Paket', description: 'Perfekt für Startups. Bis zu 5 Seiten.', price: 'CHF 990' },
    { title: 'KMU-Paket', description: 'Für etablierte Unternehmen. Bis zu 15 Seiten.', price: 'CHF 2490' },
    { title: 'Pro-Paket', description: 'Premium-Lösung. Headless CMS.', price: 'CHF 4990' },
];

export default function WebdesignLuzernPage() {
    const serviceSchema = generateWebdesignVirtualSpokeSchema('luzern', 'Luzern', `${BASE_URL}/#business-winterthur`, ['Luzern', 'Zentralschweiz']);
    const productSchemas = generateWebdesignPackageProducts();
    const offerCatalogSchema = generateOfferCatalogSchema(packages);
    const spokeFaqs = generateWebdesignSpokeFaqs('Luzern', false);
    const faqSchema = generateFAQSchema(spokeFaqs);
    const breadcrumbSchema = generateBreadcrumbListSchema([{ name: 'Home', url: BASE_URL }, { name: 'Webdesign', url: `${BASE_URL}/webdesign` }, { name: 'Luzern', url: `${BASE_URL}/webdesign/luzern` }]);
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/webdesign/luzern`, 'Webdesign Luzern', 'Websites für die Zentralschweiz.');

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            {productSchemas.map((p, i) => <script key={`p-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...p }) }} />)}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <WebdesignContent regionSlug="luzern" />
        </>
    );
}
