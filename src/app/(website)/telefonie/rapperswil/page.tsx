import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateProfessionalServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Cloud-Telefonie Rapperswil | VoIP Zürichsee | InfraOne',
    description: 'Cloud-Telefonie Rapperswil-Jona: Persönlicher Ansprechpartner, lokale Betreuung. VoIP für Unternehmen am Zürichsee. ☎ 052 222 18 18',
    keywords: ['Cloud Telefonie Rapperswil', 'VoIP Rapperswil', 'Telefonanlage Zürichsee', 'Peoplefone Rapperswil'],
    alternates: {
        canonical: 'https://www.infraone.ch/telefonie/rapperswil',
        languages: {
            'de-CH': 'https://www.infraone.ch/telefonie/rapperswil',
        },
    },
};

export default function TelefonieRapperswilPage() {
    const professionalServiceSchema = generateProfessionalServiceSchema(
        'rapperswil',
        'Cloud-Telefonie',
        'https://www.infraone.ch/telefonie/rapperswil'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
            />
            <CloudTelefonieContent regionSlug="rapperswil" />
        </>
    );
}
