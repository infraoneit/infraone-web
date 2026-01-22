import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Schaffhausen | Moderne VoIP-Telefonie | InfraOne',
    description: 'Cloud-Telefonie Schaffhausen: Industrie-Erfahrung, persönliche Beratung. Peoplefone für Schaffhauser Unternehmen. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Schaffhausen', 'VoIP Schaffhausen', 'Telefonanlage Schaffhausen', 'Peoplefone Schaffhausen'],
    alternates: {
        canonical: 'https://www.infraone.ch/telefonie/schaffhausen',
        languages: {
            'de-CH': 'https://www.infraone.ch/telefonie/schaffhausen',
        },
    },
};

export default function TelefonieSchaffhausenPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'schaffhausen',
        'Cloud-Telefonie',
        'https://www.infraone.ch/telefonie/schaffhausen'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <CloudTelefonieContent regionSlug="schaffhausen" />
        </>
    );
}
