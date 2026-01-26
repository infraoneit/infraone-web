import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateWebdesignVirtualSpokeSchema, generateWebdesignPackageProducts, generateOfferCatalogSchema, generateFAQSchema, generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { generateWebdesignSpokeFaqs } from '@/data/webdesign-faqs';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Webdesign Aargau | Websites ab CHF 990 | InfraOne',
    description: 'Webdesign Aargau: Websites für KMU in Aarau, Baden und Region. Ab CHF 990. ☎ 052 222 18 18',
    keywords: ['Webdesign Aargau', 'Website erstellen Aarau'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign/aargau',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign/aargau',
        },
    },
};

const packages = [
    { title: 'Starter-Paket', description: 'Perfekt für Startups. Bis zu 5 Seiten.', price: 'CHF 990' },
    { title: 'KMU-Paket', description: 'Für etablierte Unternehmen. Bis zu 15 Seiten.', price: 'CHF 2490' },
    { title: 'Pro-Paket', description: 'Premium-Lösung. Headless CMS.', price: 'CHF 4990' },
];

export default function WebdesignAargauPage() {
    const serviceSchema = generateWebdesignVirtualSpokeSchema('aargau', 'Aargau', `${BASE_URL}/#business-winterthur`, ['Aargau', 'Aarau', 'Baden']);
    const productSchemas = generateWebdesignPackageProducts();
    const offerCatalogSchema = generateOfferCatalogSchema(packages);
    const spokeFaqs = generateWebdesignSpokeFaqs('Aargau', false);
    const faqSchema = generateFAQSchema(spokeFaqs);
    const breadcrumbSchema = generateBreadcrumbListSchema([{ name: 'Home', url: BASE_URL }, { name: 'Webdesign', url: `${BASE_URL}/webdesign` }, { name: 'Aargau', url: `${BASE_URL}/webdesign/aargau` }]);
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/webdesign/aargau`, 'Webdesign Aargau', 'Websites für KMU in Aarau, Baden und Region.');

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            {productSchemas.map((p, i) => <script key={`p-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...p }) }} />)}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <WebdesignContent regionSlug="aargau" />
        </>
    );
}
