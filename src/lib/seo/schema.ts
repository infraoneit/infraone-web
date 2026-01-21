import { Organization, LocalBusiness, Service, FAQPage, WebSite, AboutPage, WithContext } from 'schema-dts';

/**
 * Geo-Koordinaten für Schweizer Regionen
 */
export interface GeoCoordinates {
    latitude: number;
    longitude: number;
}

export interface RegionalData {
    name: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    geo?: GeoCoordinates;
}

/**
 * Geo-Koordinaten-Datenbank für Schweizer Städte/Regionen
 */
export const REGION_COORDINATES: Record<string, GeoCoordinates> = {
    winterthur: { latitude: 47.4996, longitude: 8.7243 },
    zuerich: { latitude: 47.3769, longitude: 8.5417 },
    schaffhausen: { latitude: 47.6976, longitude: 8.6348 },
    'st-gallen': { latitude: 47.4245, longitude: 9.3767 },
    thurgau: { latitude: 47.5536, longitude: 8.8989 }, // Frauenfeld
    andelfingen: { latitude: 47.5955, longitude: 8.6809 },
    rapperswil: { latitude: 47.2272, longitude: 8.8181 },
    basel: { latitude: 47.5596, longitude: 7.5886 },
    bern: { latitude: 46.9480, longitude: 7.4474 },
    luzern: { latitude: 47.0502, longitude: 8.3093 },
    aargau: { latitude: 47.3927, longitude: 8.0458 }, // Aarau
    zug: { latitude: 47.1715, longitude: 8.5159 },
    solothurn: { latitude: 47.2084, longitude: 7.5370 },
    graubuenden: { latitude: 46.8480, longitude: 9.5328 }, // Chur
};

/**
 * Generiert Organization Schema für die Homepage
 */
export function generateOrganizationSchema(): WithContext<Organization> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'InfraOne IT Solutions GmbH',
        url: 'https://www.infraone.ch',
        logo: 'https://www.infraone.ch/infraone-logo-schwarz.svg',
        description: 'IT-Support, Webdesign & Cloud Telefonanlagen in Winterthur, Schaffhausen & Zürich. Ihr Informatiker für KMU & Privatkunden.',
        telephone: '+41522221818',
        email: 'info@infraone.ch',
        address: {
            '@type': 'PostalAddress',
            streetAddress: '',
            addressLocality: 'Winterthur',
            addressRegion: 'Zürich',
            postalCode: '8400',
            addressCountry: 'CH',
        },
        contactPoint: [
            {
                '@type': 'ContactPoint',
                telephone: '+41522221818',
                contactType: 'customer service',
                availableLanguage: ['German'],
                areaServed: 'CH',
            },
            {
                '@type': 'ContactPoint',
                telephone: '+41765875055',
                contactType: 'emergency',
                availableLanguage: ['German'],
                areaServed: 'CH',
            },
        ],
        sameAs: [
            // Social Media Profile URLs können hier hinzugefügt werden
        ],
    };
}

/**
 * Generiert LocalBusiness Schema für regionale Service-Seiten
 */
export function generateLocalBusinessSchema(
    regionSlug: string,
    serviceName: string,
    serviceUrl: string
): WithContext<LocalBusiness> {
    const geo = REGION_COORDINATES[regionSlug];

    // Mapping von Slug zu schönem Namen
    const regionNames: Record<string, string> = {
        winterthur: 'Winterthur',
        zuerich: 'Zürich',
        schaffhausen: 'Schaffhausen',
        'st-gallen': 'St. Gallen',
        thurgau: 'Thurgau',
        andelfingen: 'Andelfingen',
        rapperswil: 'Rapperswil',
        basel: 'Basel',
        bern: 'Bern',
        luzern: 'Luzern',
        aargau: 'Aargau',
        zug: 'Zug',
        solothurn: 'Solothurn',
        graubuenden: 'Graubünden',
    };

    const regionName = regionNames[regionSlug] || regionSlug;

    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: `InfraOne IT Solutions – ${serviceName} ${regionName}`,
        description: `${serviceName} Dienstleistungen in ${regionName} von InfraOne IT Solutions GmbH`,
        url: serviceUrl,
        telephone: '+41522221818',
        email: 'info@infraone.ch',
        address: {
            '@type': 'PostalAddress',
            addressLocality: regionName,
            addressCountry: 'CH',
        },
        ...(geo && {
            geo: {
                '@type': 'GeoCoordinates',
                latitude: geo.latitude,
                longitude: geo.longitude,
            },
        }),
        priceRange: '$$',
        areaServed: {
            '@type': 'Place',
            name: regionName,
        },
    };
}

/**
 * Generiert WebSite Schema für die Homepage (Sitelinks Search Box Support)
 */
export function generateWebSiteSchema(): WithContext<WebSite> {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'InfraOne IT Solutions',
        url: 'https://www.infraone.ch',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://www.infraone.ch/search?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        } as any,
    };
}

/**
 * Generiert das Haupt-LocalBusiness Schema für die Homepage (Winterthur HQ)
 */
export function generateMainBusinessSchema(): WithContext<LocalBusiness> {
    return {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService', // Spezifischer als LocalBusiness
        name: 'InfraOne IT Solutions GmbH',
        image: 'https://www.infraone.ch/infraone-logo-schwarz.svg',
        url: 'https://www.infraone.ch',
        telephone: '+41522221818',
        email: 'info@infraone.ch',
        priceRange: '$$',
        address: {
            '@type': 'PostalAddress',
            streetAddress: '',
            addressLocality: 'Winterthur',
            addressRegion: 'Zürich',
            postalCode: '8400',
            addressCountry: 'CH',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 47.4996,
            longitude: 8.7243,
        },
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '08:00',
                closes: '17:30',
            },
        ],
        sameAs: [
            // Hier könnten LinkedIn, Facebook etc. URLs stehen
        ],
        areaServed: {
            '@type': 'GeoCircle',
            geoMidpoint: {
                '@type': 'GeoCoordinates',
                latitude: 47.4996,
                longitude: 8.7243,
            },
            geoRadius: '50000', // 50km Umkreis
        },
    };
}

/**
 * Generiert Service Schema für Hauptseiten
 */
export function generateServiceSchema(
    serviceName: string,
    serviceType: string,
    description: string,
    serviceUrl: string,
    areaServed: string[] = ['Schweiz', 'Zürich', 'Winterthur', 'Schaffhausen', 'Thurgau', 'St. Gallen']
): WithContext<Service> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: serviceName,
        serviceType: serviceType,
        description: description,
        url: serviceUrl,
        provider: {
            '@type': 'Organization',
            name: 'InfraOne IT Solutions GmbH',
            url: 'https://www.infraone.ch',
        },
        areaServed: areaServed.map((area) => ({
            '@type': 'Place',
            name: area,
        })),
    };
}

/**
 * Generiert ProfessionalService Schema für Remote-Dienstleistungen (z.B. Webdesign)
 * Wichtig: Kein lokaler Geo-Standort, da 100% remote möglich
 */
export function generateProfessionalServiceSchema(
    regionSlug: string,
    serviceName: string,
    serviceUrl: string
): WithContext<LocalBusiness> {
    const regionNames: Record<string, string> = {
        winterthur: 'Winterthur',
        zuerich: 'Zürich',
        schaffhausen: 'Schaffhausen',
        'st-gallen': 'St. Gallen',
        thurgau: 'Thurgau',
        basel: 'Basel',
        bern: 'Bern',
        luzern: 'Luzern',
        aargau: 'Aargau',
        zug: 'Zug',
        solothurn: 'Solothurn',
        graubuenden: 'Graubünden',
    };

    const regionName = regionNames[regionSlug] || regionSlug;

    return {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: `InfraOne ${serviceName} – ${regionName}`,
        description: `${serviceName} Dienstleistungen für Unternehmen in ${regionName}. 100% remote möglich, persönliche Beratung auf Wunsch.`,
        url: serviceUrl,
        telephone: '+41522221818',
        email: 'info@infraone.ch',
        // Echter Firmenstandort (nicht Region)
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Winterthur',
            addressRegion: 'Zürich',
            postalCode: '8400',
            addressCountry: 'CH',
        },
        // Bediente Region
        areaServed: {
            '@type': 'Place',
            name: regionName,
        },
        priceRange: '$$',
        // Keine Geo-Koordinaten, da Remote-Service
    };
}

/**
 * Generiert FAQPage Schema
 */
export function generateFAQSchema(
    faqs: Array<{ question: string; answer: string }>
): WithContext<FAQPage> {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

/**
 * Generiert AboutPage Schema für die Unternehmensseite
 */
export function generateAboutPageSchema(): WithContext<AboutPage> {
    return {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'Über InfraOne IT Solutions',
        description: 'Erfahren Sie mehr über InfraOne IT Solutions GmbH, unser Team, unsere Werte und unsere Geschichte.',
        url: 'https://www.infraone.ch/unternehmen',
        mainEntity: {
            '@type': 'Organization',
            name: 'InfraOne IT Solutions GmbH',
            url: 'https://www.infraone.ch',
            logo: 'https://www.infraone.ch/infraone-logo-schwarz.svg',
        },
    };
}

/**
 * Helper-Funktion zum Rendern von JSON-LD Schema im <head>
 * Verwendung: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
 */
export function renderJsonLd(schema: any): string {
    return JSON.stringify(schema);
}
