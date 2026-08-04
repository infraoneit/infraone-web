import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Leistungen | Übersicht unserer IT-Services',
    description: 'Alle IT-Dienstleistungen von InfraOne aus einer Hand: Netzwerke, Telefonie, Sicherheit, Webdesign und Software.',
    alternates: {
        canonical: 'https://infraone.ch/leistungen',
    },
};

export default function LeistungenLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
