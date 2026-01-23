import { Organization, LocalBusiness, Service, FAQPage, WebSite, AboutPage, AggregateRating, WithContext } from 'schema-dts';

/**
 * Geo-Koordinaten fÃƒÂ¼r Schweizer Regionen
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
 * Geo-Koordinaten-Datenbank fÃƒÂ¼r Schweizer StÃƒÂ¤dte/Regionen
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
 * Generiert Organization Schema fÃƒÂ¼r die Homepage
 */
export function generateOrganizationSchema(): WithContext<Organization> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'InfraOne IT Solutions GmbH',
        url: 'https://www.infraone.ch',
        logo: 'https://www.infraone.ch/infraone-logo-schwarz.svg',
        description: 'IT-Support, Webdesign & Cloud Telefonanlagen in Winterthur, Schaffhausen & ZÃƒÂ¼rich. Ihr Informatiker fÃƒÂ¼r KMU & Privatkunden.',
        telephone: '+41522221818',
        email: 'info@infraone.ch',
        address: {
            '@type': 'PostalAddress',
            streetAddress: '',
            addressLocality: 'Winterthur',
            addressRegion: 'ZÃƒÂ¼rich',
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
            // Social Media Profile URLs kÃƒÂ¶nnen hier hinzugefÃƒÂ¼gt werden
        ],
    };
}

/**
 * Generiert LocalBusiness Schema fÃƒÂ¼r regionale Service-Seiten
 */
export function generateLocalBusinessSchema(
    regionSlug: string,
    serviceName: string,
    serviceUrl: string,
    areaServedList?: string[]
): WithContext<LocalBusiness> {
    const geo = REGION_COORDINATES[regionSlug];

    const regionNames: Record<string, string> = {
        winterthur: 'Winterthur',
        zuerich: 'Zuerich',
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
        graubuenden: 'Graubuenden',
    };

    const regionName = regionNames[regionSlug] || regionSlug;

    // Area Served aus CMS oder Standard
    const areaServed = areaServedList && areaServedList.length > 0
        ? areaServedList.map(area => ({ '@type': 'Place' as const, name: area }))
        : [{ '@type': 'Place' as const, name: regionName }];

    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: `InfraOne IT Solutions - ${serviceName} ${regionName}`,
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
        areaServed: areaServed,
    };
}
/**
 * Generiert WebSite Schema fÃƒÂ¼r die Homepage (Sitelinks Search Box Support)
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
 * Generiert das Haupt-LocalBusiness Schema fÃƒÂ¼r die Homepage (Winterthur HQ)
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
            addressRegion: 'ZÃƒÂ¼rich',
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
            // Hier kÃƒÂ¶nnten LinkedIn, Facebook etc. URLs stehen
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
 * Generiert Service Schema fÃƒÂ¼r Hauptseiten
 */
export function generateServiceSchema(
    serviceName: string,
    serviceType: string,
    description: string,
    serviceUrl: string,
    areaServed: string[] = ['Schweiz', 'ZÃƒÂ¼rich', 'Winterthur', 'Schaffhausen', 'Thurgau', 'St. Gallen']
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
 * Generiert ProfessionalService Schema fÃƒÂ¼r Remote-Dienstleistungen (z.B. Webdesign)
 * Wichtig: Kein lokaler Geo-Standort, da 100% remote mÃƒÂ¶glich
 */
export function generateProfessionalServiceSchema(
    regionSlug: string,
    serviceName: string,
    serviceUrl: string,
    areaServedList?: string[]
): WithContext<LocalBusiness> {
    const regionNames: Record<string, string> = {
        winterthur: 'Winterthur',
        zuerich: 'ZÃƒÂ¼rich',
        schaffhausen: 'Schaffhausen',
        'st-gallen': 'St. Gallen',
        thurgau: 'Thurgau',
        basel: 'Basel',
        bern: 'Bern',
        luzern: 'Luzern',
        aargau: 'Aargau',
        zug: 'Zug',
        solothurn: 'Solothurn',
        graubuenden: 'GraubÃƒÂ¼nden',
    };

    const regionName = regionNames[regionSlug] || regionSlug;

    return {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: `InfraOne ${serviceName} Ã¢â‚¬â€œ ${regionName}`,
        description: `${serviceName} Dienstleistungen fÃƒÂ¼r Unternehmen in ${regionName}. 100% remote mÃƒÂ¶glich, persÃƒÂ¶nliche Beratung auf Wunsch.`,
        url: serviceUrl,
        telephone: '+41522221818',
        email: 'info@infraone.ch',
        // Echter Firmenstandort (nicht Region)
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Winterthur',
            addressRegion: 'ZÃƒÂ¼rich',
            postalCode: '8400',
            addressCountry: 'CH',
        },
        // Bediente Region (aus Parameter oder Standard)
        areaServed: areaServedList && areaServedList.length > 0
            ? areaServedList.map(area => ({ '@type': 'Place', name: area }))
            : { '@type': 'Place', name: regionName },
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
 * Generiert AboutPage Schema fÃƒÂ¼r die Unternehmensseite
 */
export function generateAboutPageSchema(): WithContext<AboutPage> {
    return {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'ÃƒÅ“ber InfraOne IT Solutions',
        description: 'Erfahren Sie mehr ÃƒÂ¼ber InfraOne IT Solutions GmbH, unser Team, unsere Werte und unsere Geschichte.',
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

/**
 * HUB & SPOKE SCHEMA FUNCTIONS
 * Für saubere Hub-&-Spoke-Struktur mit korrekten Relationen
 */

import { BASE_URL } from '@/lib/constants';

/**
 * Generiert LocalBusiness Schema für das Layout (sitewide)
 * Mit @id für Referenzierung durch andere Schemas
 */
export function generateSitewideLocalBusinessSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${BASE_URL}/#business`,
        name: 'InfraOne IT Solutions GmbH',
        url: BASE_URL,
        telephone: '+41522221818',
        email: 'info@infraone.ch',
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Winterthur',
            addressRegion: 'Zürich',
            postalCode: '8400',
            addressCountry: 'CH',
        },
        priceRange: '$$',
    };
}

/**
 * Generiert WebSite Schema für das Layout (sitewide)
 * Mit @id für Referenzierung
 */
export function generateSitewideWebSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'InfraOne IT Solutions',
        publisher: { '@id': `${BASE_URL}/#business` },
    };
}

/**
 * Generiert Service Schema für Hub-Seite (/cloud-telefonie)
 */
export function generateHubServiceSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${BASE_URL}/cloud-telefonie#service`,
        name: 'Cloud-Telefonie',
        serviceType: ['Cloud-Telefonie', 'VoIP', 'Hosted PBX'],
        provider: { '@id': `${BASE_URL}/#business` },
        url: `${BASE_URL}/cloud-telefonie`,
        areaServed: { '@type': 'Country', name: 'Switzerland' },
    };
}

/**
 * Generiert Service Schema für Spoke-Seite (z.B. /cloud-telefonie/winterthur)
 */
export function generateSpokeServiceSchema(regionSlug: string, regionName: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${BASE_URL}/cloud-telefonie/${regionSlug}#service`,
        name: `Cloud-Telefonie in ${regionName}`,
        serviceType: ['Cloud-Telefonie', 'VoIP', 'Hosted PBX'],
        provider: { '@id': `${BASE_URL}/#business` },
        url: `${BASE_URL}/cloud-telefonie/${regionSlug}`,
        areaServed: { '@type': 'AdministrativeArea', name: regionName },
        isPartOf: { '@id': `${BASE_URL}/cloud-telefonie#service` },
    };
}

/**
 * Generiert BreadcrumbList Schema
 */
export function generateBreadcrumbListSchema(items: Array<{ name: string; url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Generiert WebPage Schema
 */
export function generateWebPageSchema(url: string, name: string, description?: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url: url,
        name: name,
        ...(description && { description }),
        isPartOf: { '@id': `${BASE_URL}/#website` },
    };
}

/**
 * IT-SUPPORT HUB & SPOKE SCHEMA FUNCTIONS
 * Spezifische Schemas für IT-Support Cluster (Hub + 6 Spokes)
 */

/**
 * Generiert IT-Support Hub Schema (ProfessionalService)
 * Für /it-support Hauptseite
 */
export function generateITSupportHubSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        '@id': `${BASE_URL}/it-support#service`,
        name: 'IT-Support & Informatik-Support',
        serviceType: ['Computer Support', 'IT Support', 'Technical Support', 'Network Support'],
        description: 'Professioneller IT-Support für KMU und Privatpersonen in der Schweiz. Remote-Support innert Minuten, Vor-Ort-Service innerhalb 24h.',
        provider: { '@id': `${BASE_URL}/#business` },
        url: `${BASE_URL}/it-support`,
        areaServed: { '@type': 'Country', name: 'Switzerland' },
        offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'CHF',
            lowPrice: '130',
            highPrice: '200',
            priceSpecification: [
                {
                    '@type': 'UnitPriceSpecification',
                    price: '130',
                    priceCurrency: 'CHF',
                    name: 'Remote-Support',
                },
                {
                    '@type': 'UnitPriceSpecification',
                    price: '145',
                    priceCurrency: 'CHF',
                    name: 'Vor-Ort-Support Privat',
                },
            ],
        },
    };
}

/**
 * Generiert OfferCatalog Schema für IT-Support Preise
 * Für die Preisliste auf /it-support
 */
export function generateOfferCatalogSchema(priceCards: Array<{ title: string; description: string; price: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'OfferCatalog',
        name: 'IT-Support Preise',
        itemListElement: priceCards.map((card, index) => {
            const priceMatch = card.price.match(/\d+/);
            const priceValue = priceMatch ? priceMatch[0] : undefined;
            
            return {
                '@type': 'Offer',
                position: index + 1,
                itemOffered: {
                    '@type': 'Service',
                    name: card.title,
                    description: card.description,
                },
                ...(priceValue && {
                    price: priceValue,
                    priceCurrency: 'CHF',
                }),
            };
        }),
    };
}

/**
 * Generiert ItemList Schema für Listen (z.B. Häufige Probleme)
 */
export function generateItemListSchema(items: string[], listName: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: listName,
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item,
        })),
    };
}

/**
 * Generiert LocalBusiness + ITService Schema für Standort-Spokes (mit Büro)
 * Für /it-support/winterthur, /andelfingen, /schaffhausen, /thurgau
 */
export function generateITServiceLocalBusinessSchema(
    regionSlug: string,
    regionName: string,
    address: {
        street?: string;
        postalCode: string;
        addressLocality: string;
    },
    openingHours: string[] = ['Mo–Fr 08:00–17:00'],
    emergencyNote: string = 'Notfall-Support verfügbar bis 23:00 Uhr'
) {
    const geo = REGION_COORDINATES[regionSlug];
    
    return {
        '@context': 'https://schema.org',
        '@type': ['LocalBusiness', 'ComputerStore'],
        '@id': `${BASE_URL}/it-support/${regionSlug}#business`,
        name: `InfraOne IT Solutions - ${regionName}`,
        url: `${BASE_URL}/it-support/${regionSlug}`,
        telephone: '+41522221818',
        email: 'info@infraone.ch',
        address: {
            '@type': 'PostalAddress',
            ...(address.street && { streetAddress: address.street }),
            postalCode: address.postalCode,
            addressLocality: address.addressLocality,
            addressCountry: 'CH',
        },
        ...(geo && {
            geo: {
                '@type': 'GeoCoordinates',
                latitude: geo.latitude,
                longitude: geo.longitude,
            },
        }),
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '08:00',
            closes: '17:00',
        },
        specialOpeningHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '08:00',
            closes: '23:00',
            description: emergencyNote,
        },
        priceRange: '$$',
        areaServed: {
            '@type': 'AdministrativeArea',
            name: regionName,
        },
    };
}

/**
 * Generiert Virtual Spoke Schema für Regionen ohne physisches Büro
 * Für /it-support/zuerich, /st-gallen
 */
export function generateVirtualSpokeSchema(
    regionSlug: string,
    regionName: string,
    providerBusinessId: string // z.B. '/it-support/winterthur#business'
) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${BASE_URL}/it-support/${regionSlug}#service`,
        name: `IT-Support ${regionName}`,
        serviceType: ['Computer Support', 'IT Support', 'Technical Support'],
        description: `IT-Support-Dienstleistungen für ${regionName}. Bedient durch unser qualifiziertes Team.`,
        provider: { '@id': providerBusinessId },
        url: `${BASE_URL}/it-support/${regionSlug}`,
        areaServed: {
            '@type': 'AdministrativeArea',
            name: regionName,
        },
        isPartOf: { '@id': `${BASE_URL}/it-support#service` },
    };
}

/**
 * Generiert AggregateRating Schema für Testimonials
 */
export function generateAggregateRatingSchema() {
    return {
        '@type': 'AggregateRating',
        '@id': `${BASE_URL}/webdesign#rating`,
        ratingValue: '5',
        bestRating: '5',
        worstRating: '1',
        ratingCount: '3',
        review: [
            {
                '@type': 'Review',
                author: {
                    '@type': 'Person',
                    name: 'Albert Sulejmani',
                },
                reviewRating: {
                    '@type': 'Rating',
                    ratingValue: '5',
                    bestRating: '5',
                },
                reviewBody: 'Unsere neue Website fühlt sich endlich so professionell an wie unsere Arbeit. Die Seite ist klar aufgebaut, schnell und auf das Wesentliche reduziert. Wir wurden von Anfang an verstanden und konnten unsere Inhalte Schritt für Schritt gemeinsam sauber aufbauen. Änderungen sind heute unkompliziert möglich, genau so wie wir es wollten.',
                itemReviewed: {
                    '@type': 'Service',
                    name: 'Webdesign & Website-Entwicklung',
                    provider: {
                        '@type': 'Organization',
                        name: 'InfraOne IT Solutions GmbH',
                    },
                },
            },
            {
                '@type': 'Review',
                author: {
                    '@type': 'Person',
                    name: 'Salvatore Irrera',
                },
                reviewRating: {
                    '@type': 'Rating',
                    ratingValue: '5',
                    bestRating: '5',
                },
                reviewBody: 'Von der ersten Idee bis zur fertigen Website lief alles strukturiert und transparent. Die neue Seite ist modern, übersichtlich und leicht zu pflegen. Besonders schätzen wir, dass wir Inhalte selbst anpassen können, ohne jedes Mal extern Hilfe zu brauchen.',
                itemReviewed: {
                    '@type': 'Service',
                    name: 'Webdesign & Website-Entwicklung',
                    provider: {
                        '@type': 'Organization',
                        name: 'InfraOne IT Solutions GmbH',
                    },
                },
            },
            {
                '@type': 'Review',
                author: {
                    '@type': 'Person',
                    name: 'Peer Höppli',
                },
                reviewRating: {
                    '@type': 'Rating',
                    ratingValue: '5',
                    bestRating: '5',
                },
                reviewBody: 'Die Website wurde extrem schnell umgesetzt und bringt unsere Projekte genau so zur Geltung, wie wir es uns vorgestellt haben. Klare Gestaltung, einfache Bedienung und ein sehr gutes Preis-Leistungs-Verhältnis. Wir sind rundum zufrieden.',
                itemReviewed: {
                    '@type': 'Service',
                    name: 'Webdesign & Website-Entwicklung',
                    provider: {
                        '@type': 'Organization',
                        name: 'InfraOne IT Solutions GmbH',
                    },
                },
            },
        ],
    };
}