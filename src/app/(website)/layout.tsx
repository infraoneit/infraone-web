import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { generateSitewideLocalBusinessSchema, generateSitewideWebSiteSchema } from "@/lib/seo/schema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ['Courier New', 'monospace'],
});

export const metadata: Metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  title: {
    default: "InfraOne IT Solutions | IT-Support, Webdesign & Telefonie in Winterthur",
    template: "%s | InfraOne IT Solutions"
  },
  description: "IT-Support, Webdesign & Cloud Telefonanlagen in Winterthur, Schaffhausen & Zuerich. Ihr Informatiker fuer KMU & Privatkunden. 20% Neukunden-Rabatt!",
  keywords: [
    "IT Support Winterthur",
    "Webdesign Winterthur",
    "Cloud Telefonanlage Schweiz",
    "Informatiker Winterthur",
    "IT Dienstleister Zuerich",
    "VoIP Schweiz",
    "Netzwerk Infrastruktur",
    "3CX Telefonie",
    "peoplefone",
    "Videoueberwachung",
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
    description: "Digitale Loesungen fuer KMU & Privatpersonen - IT-Support, Webdesign & Cloud Telefonanlagen in Winterthur.",
    images: [
      {
        url: "/images/infraone-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "InfraOne IT Solutions - Telefonie, IT Security, Server Systeme, Microsoft, Firewall, Netzwerk, Cloud, Automatisierung",
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
    <html lang="de" suppressHydrationWarning className="dark">
      <head>
        {/* Dark Mode Script - MUST run before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        {/* Resource Hints for Performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSitewideLocalBusinessSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSitewideWebSiteSchema()) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col overflow-x-hidden`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ScrollToTop />
          <Header />
          {/* pt-16 lg:pt-20 compensates for fixed header height */}
          <main className="flex-1 pt-16 lg:pt-20">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}