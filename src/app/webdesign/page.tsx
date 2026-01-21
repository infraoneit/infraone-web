import { Metadata } from 'next';
import { WebdesignContent } from '@/components/pages/WebdesignContent';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Webdesign Schweiz | Websites ab CHF 990 | InfraOne',
    description: 'Professionelles Webdesign in der Schweiz. Moderne, SEO-optimierte Websites ab CHF 990. Wix, WordPress oder Next.js – wir finden die passende Lösung.',
    keywords: ['Webdesign Schweiz', 'Webagentur', 'Website erstellen', 'Homepage', 'SEO Webdesign'],
    alternates: {
        canonical: 'https://www.infraone.ch/webdesign',
        languages: {
            'de-CH': 'https://www.infraone.ch/webdesign',
        },
    },
};

export default function WebdesignPage() {
    const serviceSchema = generateServiceSchema(
        'Webdesign & Website-Entwicklung',
        'Web Design Service',
        'Professionelles Webdesign in der Schweiz. Moderne, SEO-optimierte Websites ab CHF 990. Wix, WordPress oder Next.js – massgeschneiderte Lösungen für Ihr Unternehmen.',
        'https://www.infraone.ch/webdesign'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            <WebdesignContent />
        </>
    );
}
