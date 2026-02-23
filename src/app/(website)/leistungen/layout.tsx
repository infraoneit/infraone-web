import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Leistungen | Übersicht unserer IT-Services',
    description: 'Alle IT-Dienstleistungen von InfraOne aus einer Hand: Netzwerke, Telefonie, Sicherheit, Webdesign, Software und Gebäudeautomation.',
    alternates: {
        canonical: 'https://www.infraone.ch/leistungen',
    },
};

export default function LeistungenLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
