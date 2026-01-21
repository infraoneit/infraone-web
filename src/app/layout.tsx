import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { generateOrganizationSchema } from "@/lib/seo/schema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "InfraOne IT Solutions | IT-Support, Webdesign & Telefonie in Winterthur",
    template: "%s | InfraOne IT Solutions"
  },
  description: "IT-Support, Webdesign & Cloud Telefonanlagen in Winterthur, Schaffhausen & Zürich. Ihr Informatiker für KMU & Privatkunden. 20% Neukunden-Rabatt!",
  keywords: [
    "IT Support Winterthur",
    "Webdesign Winterthur",
    "Cloud Telefonanlage Schweiz",
    "Informatiker Winterthur",
    "IT Dienstleister Zürich",
    "VoIP Schweiz",
    "Netzwerk Infrastruktur",
    "3CX Telefonie",
    "peoplefone",
    "Videoüberwachung",
  ],
  authors: [{ name: "InfraOne IT Solutions GmbH" }],
  creator: "InfraOne IT Solutions GmbH",
  publisher: "InfraOne IT Solutions GmbH",
  formatDetection: {
    email: true,
    telephone: true,
    address: true,
  },
  metadataBase: new URL("https://www.infraone.ch"),
  openGraph: {
    type: "website",
    locale: "de_CH",
    url: "https://www.infraone.ch",
    siteName: "InfraOne IT Solutions",
    title: "InfraOne IT Solutions | IT-Support, Webdesign & Telefonie",
    description: "Digitale Lösungen für KMU & Privatpersonen – IT-Support, Webdesign & Cloud Telefonanlagen in Winterthur.",
    images: [
      {
        url: "/images/infraone-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "InfraOne IT Solutions – Telefonie, IT Security, Server Systeme, Microsoft, Firewall, Netzwerk, Cloud, Automatisierung",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InfraOne IT Solutions",
    description: "IT-Support, Webdesign & Cloud Telefonanlagen in Winterthur",
    images: ["/images/infraone-og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: 'https://www.infraone.ch',
    languages: {
      'de-CH': 'https://www.infraone.ch',
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col overflow-x-hidden`}
      >
        <ThemeProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
