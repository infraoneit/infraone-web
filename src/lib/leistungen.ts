import fs from 'fs';
import path from 'path';

/**
 * IT-Support CMS Daten-Struktur
 */
export interface ITSupportCMSData {
    heroSection: {
        categoryLabel: string;
        headline: string;
        subheadline: string;
        description: string;
        heroImage?: string;
        primaryButtonText: string;
        primaryButtonHref: string;
        secondaryButtonText: string;
        secondaryButtonAction?: 'link' | 'download';
        secondaryButtonUrl?: string;
        secondaryButtonFile?: string;
        secondaryButtonFileName?: string;
    };
    pricingSection: {
        sectionTitle: string;
        sectionSubtitle: string;
        gridColumns?: '2' | '3' | '4';
        priceCards: {
            title: string;
            description: string;
            price: string;
            icon: string;
        }[];
        travelCosts: {
            freeRegions: string;
            freeRegionsNote: string;
            otherRegions: string;
            otherRegionsPrice: string;
        };
        supportHours: {
            regularLabel: string;
            regularNote: string;
            extendedLabel: string;
            extendedNote: string;
            slaNote: string;
        };
    };
    regionsSection: {
        sectionTitle: string;
        sectionSubtitle: string;
        regions: {
            name: string;
            slug: string;
            description: string;
            isFree: boolean;
        }[];
    };
    faqsSection: {
        sectionTitle: string;
        sectionSubtitle: string;
        faqs: {
            question: string;
            answer: string;
        }[];
    };
    ctaSection: {
        headline: string;
        subtitle: string;
        emergencyPhone: string;
        emergencyPhoneLink: string;
        whatsappLabel: string;
        whatsappLink: string;
    };
    seoSection: {
        metaTitle: string;
        metaDescription: string;
        canonicalUrl?: string;
    };
    structuredDataSection?: {
        schemaType?: 'LocalBusiness' | 'ProfessionalService';
        areaServed?: string[];
        includeFaqSchema?: boolean;
    };
}

/**
 * Lädt die IT-Support Daten aus dem CMS (JSON-Datei)
 */
export async function getITSupportData(): Promise<ITSupportCMSData | null> {
    try {
        const filePath = path.join(process.cwd(), 'content', 'leistungen', 'it-support.json');
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return data as ITSupportCMSData;
        }
    } catch (error) {
        console.error('[Leistungen] Error loading IT-Support data:', error);
    }
    return null;
}
