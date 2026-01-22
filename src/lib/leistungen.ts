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

/**
 * IT-Support Region CMS Daten-Struktur (flaches Schema)
 */
export interface ITSupportRegionData {
    slug: string;
    name: string;
    isFree: boolean;
    anfahrt: string;
    headline: string;
    subheadline: string;
    description: string;
    intro: string;
    regionalImage?: string;
    localBenefits: string[];
    stats: { label: string; value: string }[];
    localIndustries: { name: string; need: string }[];
    localFaqQuestion: string;
    localFaqAnswer: string;
    additionalFaqs: { question: string; answer: string }[];
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    // Structured Data
    schemaType?: 'LocalBusiness' | 'ProfessionalService';
    includeFaqSchema?: boolean;
    canonicalUrl?: string;
    areaServed?: string[];
}

/**
 * Lädt die IT-Support Region Daten aus dem CMS
 */
export async function getITSupportRegion(slug: string): Promise<ITSupportRegionData | null> {
    try {
        const filePath = path.join(process.cwd(), 'content', 'leistungen', 'it-support-regions', `${slug}.json`);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return data as ITSupportRegionData;
        }
    } catch (error) {
        console.error(`[Leistungen] Error loading IT-Support region '${slug}':`, error);
    }
    return null;
}

/**
 * Lädt alle IT-Support Region Slugs (für generateStaticParams)
 */
export async function getAllITSupportRegionSlugs(): Promise<string[]> {
    try {
        const dirPath = path.join(process.cwd(), 'content', 'leistungen', 'it-support-regions');
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''));
        }
    } catch (error) {
        console.error('[Leistungen] Error getting IT-Support region slugs:', error);
    }
    return [];
}