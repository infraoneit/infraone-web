import { Metadata } from 'next';
import { ITSupportContent } from '@/components/pages/ITSupportContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'IT-Support St. Gallen | IT-Expertise Ostschweiz | InfraOne',
    description: 'IT-Support St. Gallen: Professionelle IT-Hilfe für die Universitätsstadt. 35 Min Anfahrt. CHF 120/h Remote, CHF 157/h Vor-Ort. ☎ 052 222 18 18',
    keywords: ['IT Support St. Gallen', 'Computerhilfe St. Gallen', 'PC Support St. Gallen', 'Informatik Support Ostschweiz'],
    alternates: {
        canonical: 'https://www.infraone.ch/it-support/st-gallen',
        languages: {
            'de-CH': 'https://www.infraone.ch/it-support/st-gallen',
        },
    },
};

export default function ITSupportStGallenPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'st-gallen',
        'IT-Support',
        'https://www.infraone.ch/it-support/st-gallen'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <ITSupportContent regionSlug="st-gallen" />
        </>
    );
}
