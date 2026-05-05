import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { BASE_URL } from '@/lib/constants';

/**
 * Liest alle Blog-Slugs aus content/blog/
 * Filter: nur .json-Dateien (jeder Blog-Post hat eine JSON-Metadata-Datei)
 */
function readBlogSlugs(): string[] {
    const blogDir = path.join(process.cwd(), 'content', 'blog');
    if (!fs.existsSync(blogDir)) return [];
    return fs.readdirSync(blogDir, { withFileTypes: true })
        .filter(d => d.isFile() && d.name.endsWith('.json'))
        .map(d => d.name.replace('.json', ''));
}

/**
 * Liest alle IT-Support-Region-Slugs aus content/leistungen/it-support-regions/
 */
function readITSupportRegionSlugs(): string[] {
    const dir = path.join(process.cwd(), 'content', 'leistungen', 'it-support-regions');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(d => d.isFile() && d.name.endsWith('.json'))
        .map(d => d.name.replace('.json', ''));
}

export default function sitemap(): MetadataRoute.Sitemap {
    const currentDate = new Date();

    // Hauptseiten
    const mainPages = [
        { url: '', priority: 1.0, changeFrequency: 'weekly' as const },
        { url: '/leistungen', priority: 0.9, changeFrequency: 'weekly' as const },
        { url: '/kontakt', priority: 0.9, changeFrequency: 'monthly' as const },
        { url: '/unternehmen', priority: 0.8, changeFrequency: 'monthly' as const },
        { url: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
    ];

    // Service-Hubs (ohne /telefonie - wird in Welle 1.F auf /cloud-telefonie redirected)
    const servicePages = [
        { url: '/it-support', priority: 1.0 },
        { url: '/webdesign', priority: 1.0 },
        { url: '/cloud-telefonie', priority: 1.0 },
        { url: '/digital-signage', priority: 0.9 },
        { url: '/it-netzwerke', priority: 0.8 },
        { url: '/videoueberwachung', priority: 0.8 },
        { url: '/gebaeudeautomation', priority: 0.8 },
        { url: '/kontrollraum', priority: 0.8 },
        { url: '/software-entwicklung', priority: 0.8 },
    ];

    // Webdesign-Regionen (12, hartcodiert bis Welle 5 Migration)
    const webdesignRegions = [
        'winterthur', 'zuerich', 'schaffhausen', 'thurgau', 'st-gallen',
        'basel', 'bern', 'luzern', 'aargau', 'zug', 'solothurn', 'graubuenden'
    ];

    // IT-Support-Regionen (dynamisch aus content/)
    const itSupportRegions = readITSupportRegionSlugs();

    // Cloud-Telefonie-Regionen (6, hartcodiert)
    const cloudTelefonieRegions = [
        'winterthur', 'zuerich', 'schaffhausen', 'thurgau', 'st-gallen', 'rapperswil'
    ];

    // Blog-Posts (dynamisch aus content/blog/)
    const blogSlugs = readBlogSlugs();

    // Legal
    const legalPages = [
        { url: '/impressum', priority: 0.3, changeFrequency: 'yearly' as const },
        { url: '/datenschutz', priority: 0.3, changeFrequency: 'yearly' as const },
        { url: '/agb', priority: 0.3, changeFrequency: 'yearly' as const },
    ];

    // Alles zusammenfuehren
    const allPages = [
        ...mainPages,
        ...servicePages.map(p => ({ ...p, changeFrequency: 'weekly' as const })),
        ...webdesignRegions.map(r => ({
            url: `/webdesign/${r}`,
            priority: 0.6,
            changeFrequency: 'monthly' as const,
        })),
        ...itSupportRegions.map(r => ({
            url: `/it-support/${r}`,
            priority: 0.6,
            changeFrequency: 'monthly' as const,
        })),
        ...cloudTelefonieRegions.map(r => ({
            url: `/cloud-telefonie/${r}`,
            priority: 0.6,
            changeFrequency: 'monthly' as const,
        })),
        ...blogSlugs.map(s => ({
            url: `/blog/${s}`,
            priority: 0.7,
            changeFrequency: 'monthly' as const,
        })),
        ...legalPages,
    ];

    return allPages.map(page => ({
        url: `${BASE_URL}${page.url}`,
        lastModified: currentDate,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
    }));
}
