import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie St. Gallen | VoIP Ostschweiz | InfraOne',
    description: 'Cloud-Telefonie St. Gallen: Startup- & Industrie-Erfahrung. Professionelle VoIP-Lösungen für die Ostschweiz. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie St. Gallen', 'VoIP St. Gallen', 'Telefonanlage Ostschweiz', 'Peoplefone St. Gallen'],
    alternates: {
        canonical: 'https://www.infraone.ch/telefonie/st-gallen',
        languages: {
            'de-CH': 'https://www.infraone.ch/telefonie/st-gallen',
        },
    },
};

export default function TelefonieStGallenPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'st-gallen',
        'Cloud-Telefonie',
        'https://www.infraone.ch/telefonie/st-gallen'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <CloudTelefonieContent regionSlug="st-gallen" />
        </>
    );
}
