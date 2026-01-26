import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { 
    generateWebdesignPhysicalSpokeSchema,
    generateWebdesignPackageProducts,
    generateOfferCatalogSchema,
    generateFAQSchema,
    generateBreadcrumbListSchema,
    generateWebPageSchema,
} from '@/lib/seo/schema';
import { generateWebdesignSpokeFaqs } from '@/data/webdesign-faqs';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Webdesign Winterthur | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Winterthur: Ihr lokaler Partner für moderne Websites. Ab CHF 990. Persönliche Beratung. ☎ 052 222 18 18',
    keywords: ['Webdesign Winterthur', 'Website erstellen Winterthur', 'Webagentur Winterthur'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/winterthur',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/winterthur',
        },
    },
};

const packages = [
    { title: 'Starter-Paket', description: 'Perfekt für Startups und Kleinunternehmen. Bis zu 5 Seiten, responsive Design.', price: 'CHF 990' },
    { title: 'KMU-Paket', description: 'Für etablierte Unternehmen. Bis zu 15 Seiten, individuelles Design, Blog-Funktion.', price: 'CHF 2490' },
    { title: 'Pro-Paket', description: 'Maximale Performance & Kontrolle. Headless CMS, custom Development.', price: 'CHF 4990' },
];

export default function WebdesignWinterthurPage() {
    const serviceSchema = generateWebdesignPhysicalSpokeSchema('winterthur', 'Winterthur', ['Winterthur', 'Ostschweiz']);
    const productSchemas = generateWebdesignPackageProducts();
    const offerCatalogSchema = generateOfferCatalogSchema(packages);
    const spokeFaqs = generateWebdesignSpokeFaqs('Winterthur', true);
    const faqSchema = generateFAQSchema(spokeFaqs);
    const breadcrumbSchema = generateBreadcrumbListSchema([{ name: 'Home', url: BASE_URL }, { name: 'Webdesign', url: `${BASE_URL}/webdesign` }, { name: 'Winterthur', url: `${BASE_URL}/webdesign/winterthur` }]);
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/webdesign/winterthur`, 'Webdesign Winterthur', 'Ihr lokaler Partner für moderne Websites.');

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            {productSchemas.map((product, i) => <script key={`product-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...product }) }} />)}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <WebdesignContent regionSlug="winterthur" />
        </>
    );
}
