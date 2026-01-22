export const metadata = {
    title: 'InfraOne CMS',
    description: 'Admin Interface',
};

export default function CmsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de">
            <body>{children}</body>
        </html>
    );
}
