import { Metadata } from 'next';
import { CloudTelefonieContent } from '@/components/pages/CloudTelefonieContent';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: 'Cloud-Telefonanlagen Schweiz | VoIP für KMU | Peoplefone & 3CX',
    description: 'Cloud-Telefonanlagen für Schweizer KMU: VoIP mit Peoplefone & 3CX. Komplettpaket ab CHF 131/Monat inkl. Internet & Flatrate. Kostenrechner & Support aus Winterthur.',
    keywords: ['Cloud Telefonanlage Schweiz', 'VoIP KMU', 'Peoplefone', '3CX', 'Business Telefonie'],
    alternates: {
        canonical: 'https://www.infraone.ch/cloud-telefonie',
        languages: {
            'de-CH': 'https://www.infraone.ch/cloud-telefonie',
        },
    },
};

export default function CloudTelefoniePage() {
    const serviceSchema = generateServiceSchema(
        'Cloud-Telefonanlagen',
        'Cloud Telecommunications Service',
        'Cloud-Telefonanlagen für Schweizer KMU: VoIP mit Peoplefone & 3CX. Komplettpaket ab CHF 131/Monat inkl. Internet & Flatrate.',
        'https://www.infraone.ch/cloud-telefonie'
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
            <CloudTelefonieContent />
        </>
    );
}
