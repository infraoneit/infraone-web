import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.infraone.ch';
    const currentDate = new Date();

    // Main pages
    const mainPages = [
        { url: '', priority: 1.0, changeFrequency: 'weekly' as const },
        { url: '/leistungen', priority: 0.9, changeFrequency: 'weekly' as const },
        { url: '/kontakt', priority: 0.9, changeFrequency: 'monthly' as const },
        { url: '/unternehmen', priority: 0.8, changeFrequency: 'monthly' as const },
        { url: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
    ];

    // Service pages
    const servicePages = [
        { url: '/it-support', priority: 0.9 },
        { url: '/webdesign', priority: 0.9 },
        { url: '/telefonie', priority: 0.9 },
        { url: '/cloud-telefonie', priority: 0.9 },
        { url: '/it-netzwerke', priority: 0.8 },
        { url: '/videoueberwachung', priority: 0.8 },
        { url: '/digital-signage', priority: 0.8 },
        { url: '/gebaeudeautomation', priority: 0.8 },
        { url: '/kontrollraum', priority: 0.8 },
        { url: '/software-entwicklung', priority: 0.8 },
    ];

    // Webdesign regional pages
    const webdesignRegions = [
        'winterthur', 'zuerich', 'schaffhausen', 'thurgau', 'st-gallen',
        'basel', 'bern', 'luzern', 'aargau', 'zug', 'solothurn', 'graubuenden'
    ];
    const webdesignPages = webdesignRegions.map(region => ({
        url: `/webdesign/${region}`,
        priority: 0.8,
    }));

    // IT-Support regional pages
    const itSupportRegions = [
        'winterthur', 'zuerich', 'schaffhausen', 'thurgau', 'st-gallen', 'andelfingen'
    ];
    const itSupportPages = itSupportRegions.map(region => ({
        url: `/it-support/${region}`,
        priority: 0.8,
    }));

    // Telefonie regional pages
    const telefonieRegions = [
        'winterthur', 'zuerich', 'schaffhausen', 'thurgau', 'st-gallen', 'rapperswil'
    ];
    const telefoniePages = telefonieRegions.map(region => ({
        url: `/telefonie/${region}`,
        priority: 0.8,
    }));

    // Blog posts
    const blogPosts = [
        '/blog/ki-kmu-digitalisierung',
        '/blog/cloud-telefonie-kmu-vorteile',
        '/blog/webagentur-freelancer-vergleich',
        '/blog/black-box-emerald',
        '/blog/10-seo-fehler-kmu',
    ];
    const blogPages = blogPosts.map(url => ({
        url,
        priority: 0.7,
        changeFrequency: 'monthly' as const,
    }));

    // Legal pages
    const legalPages = [
        { url: '/impressum', priority: 0.3, changeFrequency: 'yearly' as const },
        { url: '/datenschutz', priority: 0.3, changeFrequency: 'yearly' as const },
        { url: '/agb', priority: 0.3, changeFrequency: 'yearly' as const },
    ];

    // Combine all pages
    const allPages = [
        ...mainPages,
        ...servicePages.map(p => ({ ...p, changeFrequency: 'weekly' as const })),
        ...webdesignPages.map(p => ({ ...p, changeFrequency: 'monthly' as const })),
        ...itSupportPages.map(p => ({ ...p, changeFrequency: 'monthly' as const })),
        ...telefoniePages.map(p => ({ ...p, changeFrequency: 'monthly' as const })),
        ...blogPages,
        ...legalPages,
    ];

    return allPages.map(page => ({
        url: `${baseUrl}${page.url}`,
        lastModified: currentDate,
        changeFrequency: page.changeFrequency || 'monthly',
        priority: page.priority,
    }));
}
