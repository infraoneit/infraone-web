import './keystatic.css';

export default function KeystaticLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de" suppressHydrationWarning>
            <body>
                {children}
            </body>
        </html>
    );
}
