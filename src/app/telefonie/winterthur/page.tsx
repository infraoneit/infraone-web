import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateLocalBusinessSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Winterthur | Ihr lokaler VoIP-Partner | InfraOne',
    description: 'Cloud-Telefonie Winterthur: Hauptstandort – persönliche Betreuung & schnelle Reaktionszeit. Peoplefone-Experten vor Ort. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Winterthur', 'VoIP Winterthur', 'Telefonanlage Winterthur', 'Peoplefone Winterthur'],
    alternates: {
        canonical: 'https://www.infraone.ch/telefonie/winterthur',
        languages: {
            'de-CH': 'https://www.infraone.ch/telefonie/winterthur',
        },
    },
};

export default function TelefonieWinterthurPage() {
    const localBusinessSchema = generateLocalBusinessSchema(
        'winterthur',
        'Cloud-Telefonie',
        'https://www.infraone.ch/telefonie/winterthur'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <CloudTelefonieContent regionSlug="winterthur" />
        </>
    );
}
