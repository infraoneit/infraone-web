import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Thurgau | VoIP am Bodensee | InfraOne',
    description: 'Cloud-Telefonie Thurgau: Spezielle Lösungen für Hotels & Gastro. VoIP für Frauenfeld, Kreuzlingen, Weinfelden. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Thurgau', 'VoIP Thurgau', 'Telefonanlage Frauenfeld', 'Hotel Telefonie Bodensee'],
    alternates: {
        canonical: 'https://www.infraone.ch/telefonie/thurgau',
        languages: {
            'de-CH': 'https://www.infraone.ch/telefonie/thurgau',
        },
    },
};

export default function TelefonieThurgauPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'thurgau',
        'Cloud-Telefonie',
        'https://www.infraone.ch/telefonie/thurgau'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <CloudTelefonieContent regionSlug="thurgau" />
        </>
    );
}
