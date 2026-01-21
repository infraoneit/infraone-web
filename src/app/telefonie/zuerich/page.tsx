import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Zürich | VoIP für KMU | InfraOne',
    description: 'Cloud-Telefonie Zürich: Peoplefone & 3CX für Zürcher Unternehmen. Professionelle Anrufbehandlung, kurze Wege von Winterthur. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Zürich', 'VoIP Zürich', 'Telefonanlage Zürich', '3CX Zürich'],
    alternates: {
        canonical: 'https://www.infraone.ch/telefonie/zuerich',
        languages: {
            'de-CH': 'https://www.infraone.ch/telefonie/zuerich',
        },
    },
};

export default function TelefonieZuerichPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'zuerich',
        'Cloud-Telefonie',
        'https://www.infraone.ch/telefonie/zuerich'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <CloudTelefonieContent regionSlug="zuerich" />
        </>
    );
}
