import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
    storage: {
        kind: 'local',
    },
    ui: {
        brand: {
            name: 'InfraOne CMS',
        },
    },
    singletons: {
        // Site Settings
        siteSettings: singleton({
            label: 'Site Settings',
            path: 'content/settings/site',
            schema: {
                companyName: fields.text({ label: 'Firmenname', defaultValue: 'InfraOne IT Solutions GmbH' }),
                logoLight: fields.text({ label: 'Logo Hell (Pfad)', defaultValue: '/infraone-logo-schwarz.svg' }),
                logoDark: fields.text({ label: 'Logo Dunkel (Pfad)', defaultValue: '/infraone-logo-weiss.svg' }),
                favicon: fields.text({ label: 'Favicon (Pfad)', defaultValue: '/favicon.svg' }),
                phone: fields.text({ label: 'Telefon', defaultValue: '+41 52 222 18 18' }),
                phoneDisplay: fields.text({ label: 'Telefon (Anzeige)', defaultValue: '052 222 18 18' }),
                email: fields.text({ label: 'E-Mail', defaultValue: 'info@infraone.ch' }),
                street: fields.text({ label: 'Strasse', defaultValue: 'Rudolf-Diesel-Strasse 25' }),
                zip: fields.text({ label: 'PLZ', defaultValue: '8404' }),
                city: fields.text({ label: 'Stadt', defaultValue: 'Winterthur' }),
                country: fields.text({ label: 'Land', defaultValue: 'Schweiz' }),
                googleMapsUrl: fields.url({ label: 'Google Maps URL' }),
                openingHours: fields.text({ label: 'Öffnungszeiten', defaultValue: 'Mo-Fr 8:00-17:00' }),
                supportUrl: fields.url({ label: 'Support URL (TeamViewer/AnyDesk)' }),
                linkedin: fields.url({ label: 'LinkedIn URL' }),
                facebook: fields.url({ label: 'Facebook URL' }),
                instagram: fields.url({ label: 'Instagram URL' }),
            },
        }),

        // Theme Settings
        theme: singleton({
            label: 'Theme & Farben',
            path: 'content/settings/theme',
            schema: {
                primaryColor: fields.text({ label: 'Primärfarbe', defaultValue: '#3D9646' }),
                primaryHoverColor: fields.text({ label: 'Primärfarbe Hover', defaultValue: '#2E7335' }),
                lightBackground: fields.text({ label: 'Light: Hintergrund', defaultValue: '#F8FAF8' }),
                lightSurface: fields.text({ label: 'Light: Surface', defaultValue: '#EFF5EF' }),
                lightTextPrimary: fields.text({ label: 'Light: Text Primär', defaultValue: '#1A2E1A' }),
                lightTextSecondary: fields.text({ label: 'Light: Text Sekundär', defaultValue: '#4A5D4A' }),
                lightBorder: fields.text({ label: 'Light: Border', defaultValue: '#D4E5D4' }),
                darkBackground: fields.text({ label: 'Dark: Hintergrund', defaultValue: '#0A120A' }),
                darkSurface: fields.text({ label: 'Dark: Surface', defaultValue: '#121E12' }),
                darkTextPrimary: fields.text({ label: 'Dark: Text Primär', defaultValue: '#F0F5F0' }),
                darkTextSecondary: fields.text({ label: 'Dark: Text Sekundär', defaultValue: '#A8C4A8' }),
                darkBorder: fields.text({ label: 'Dark: Border', defaultValue: '#2A3D2A' }),
            },
        }),

        // Header Navigation
        header: singleton({
            label: 'Header Navigation',
            path: 'content/settings/header',
            schema: {
                ctaLabel: fields.text({ label: 'CTA Button Text', defaultValue: 'Kostenloses Erstgespräch' }),
                ctaHref: fields.text({ label: 'CTA Button Link', defaultValue: '/kontakt' }),
                showTopBar: fields.checkbox({ label: 'Top Bar anzeigen', defaultValue: true }),
                topBarDiscountText: fields.text({ label: 'Top Bar Rabatt Text', defaultValue: '20% Neukunden-Rabatt' }),
                navigation: fields.array(
                    fields.object({
                        label: fields.text({ label: 'Label' }),
                        href: fields.text({ label: 'Link' }),
                        hasSubmenu: fields.checkbox({ label: 'Hat Untermenü' }),
                    }),
                    {
                        label: 'Navigation Items',
                        itemLabel: (props) => props.fields.label.value || 'Nav Item',
                    }
                ),
            },
        }),

        // Footer
        footer: singleton({
            label: 'Footer',
            path: 'content/settings/footer',
            schema: {
                tagline: fields.text({ label: 'Tagline', defaultValue: 'Digitale Lösungen. Echt. Einfach.' }),
                copyrightText: fields.text({ label: 'Copyright Text', defaultValue: '© {year} InfraOne IT Solutions GmbH' }),
                showSupportButton: fields.checkbox({ label: 'Support Button anzeigen', defaultValue: true }),
                supportButtonLabel: fields.text({ label: 'Support Button Text', defaultValue: 'Support Anfordern' }),
                showDiscountBadge: fields.checkbox({ label: 'Rabatt Badge anzeigen', defaultValue: true }),
                discountBadgeText: fields.text({ label: 'Rabatt Badge Text', defaultValue: '20% Neukunden-Rabatt' }),
            },
        }),

        // Homepage
        homepage: singleton({
            label: 'Homepage',
            path: 'content/pages/home',
            schema: {
                metaTitle: fields.text({ label: 'Meta Title' }),
                metaDescription: fields.text({ label: 'Meta Description', multiline: true }),

                // Hero Section
                heroHeadline: fields.text({ label: 'Hero: Headline', defaultValue: 'IT-Systeme, die verbinden.' }),
                heroSubheadline: fields.text({ label: 'Hero: Subheadline', defaultValue: 'Digitale Lösungen für KMU & Privatpersonen' }),
                heroDescription: fields.text({ label: 'Hero: Beschreibung', multiline: true }),
                heroPrimaryCta: fields.text({ label: 'Hero: Primärer CTA Text', defaultValue: 'Unsere Lösungen entdecken' }),
                heroPrimaryCtaHref: fields.text({ label: 'Hero: Primärer CTA Link', defaultValue: '/leistungen' }),
                heroSecondaryCta: fields.text({ label: 'Hero: Sekundärer CTA Text', defaultValue: 'Kostenloses Erstgespräch buchen' }),
                heroSecondaryCtaHref: fields.text({ label: 'Hero: Sekundärer CTA Link', defaultValue: '/kontakt' }),
                heroShowTrustBadge: fields.checkbox({ label: 'Hero: Trust Badge anzeigen', defaultValue: true }),
                heroTrustBadgeText: fields.text({ label: 'Hero: Trust Badge Text', defaultValue: '20% Neukunden-Rabatt' }),

                // Why Section
                whyHeadline: fields.text({ label: 'Warum: Headline', defaultValue: 'Warum InfraOne IT Solutions' }),
                whySubheadline: fields.text({ label: 'Warum: Subheadline', defaultValue: 'Ihr Informatiker für moderne IT-Lösungen' }),
                whyDescription: fields.text({ label: 'Warum: Beschreibung', multiline: true }),

                // Services Section
                servicesHeadline: fields.text({ label: 'Services: Headline', defaultValue: 'Unsere IT-Kompetenzen für Ihr Projekt' }),
                servicesSubheadline: fields.text({ label: 'Services: Subheadline' }),

                // Promo Section
                promoShow: fields.checkbox({ label: 'Promo: Anzeigen', defaultValue: true }),
                promoHeadline: fields.text({ label: 'Promo: Headline', defaultValue: 'Neukunden willkommen: 20% Projektstart-Bonus' }),
                promoDescription: fields.text({ label: 'Promo: Beschreibung', multiline: true }),
                promoCta: fields.text({ label: 'Promo: CTA Text', defaultValue: 'Unsere Lösungen' }),
                promoCtaHref: fields.text({ label: 'Promo: CTA Link', defaultValue: '/leistungen' }),

                // Testimonials Section
                testimonialsHeadline: fields.text({ label: 'Testimonials: Headline', defaultValue: 'Das sagen unsere Kunden:' }),

                // Contact Section
                contactHeadline: fields.text({ label: 'Kontakt: Headline', defaultValue: 'Hinterlasse uns eine Nachricht' }),
                contactSubheadline: fields.text({ label: 'Kontakt: Subheadline', defaultValue: 'Wir melden uns in den nächsten 48h' }),
            },
        }),
    },

    collections: {
        // Services Collection
        services: collection({
            label: 'Dienstleistungen',
            slugField: 'slug',
            path: 'content/services/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.text({ label: 'Titel' }),
                slug: fields.text({ label: 'URL Slug' }),
                icon: fields.text({ label: 'Icon Name (Lucide)' }),
                shortDescription: fields.text({ label: 'Kurzbeschreibung', multiline: true }),
                highlight: fields.text({ label: 'Highlight Text' }),
                metaTitle: fields.text({ label: 'Meta Title' }),
                metaDescription: fields.text({ label: 'Meta Description', multiline: true }),

                // Hero
                heroHeadline: fields.text({ label: 'Hero: Headline' }),
                heroSubheadline: fields.text({ label: 'Hero: Subheadline' }),
                heroDescription: fields.text({ label: 'Hero: Beschreibung', multiline: true }),
                heroImage: fields.text({ label: 'Hero: Bild Pfad' }),

                // Features
                features: fields.array(
                    fields.object({
                        number: fields.text({ label: 'Nummer' }),
                        title: fields.text({ label: 'Titel' }),
                        description: fields.text({ label: 'Beschreibung', multiline: true }),
                        icon: fields.text({ label: 'Icon' }),
                        highlight: fields.text({ label: 'Highlight' }),
                    }),
                    {
                        label: 'Features',
                        itemLabel: (props) => props.fields.title.value || 'Feature',
                    }
                ),

                // Process Steps
                processHeadline: fields.text({ label: 'Prozess: Headline' }),
                processSteps: fields.array(
                    fields.object({
                        title: fields.text({ label: 'Titel' }),
                        description: fields.text({ label: 'Beschreibung', multiline: true }),
                    }),
                    {
                        label: 'Prozess Schritte',
                        itemLabel: (props) => props.fields.title.value || 'Schritt',
                    }
                ),

                // Advantages
                advantages: fields.array(
                    fields.object({
                        icon: fields.text({ label: 'Icon' }),
                        title: fields.text({ label: 'Titel' }),
                        description: fields.text({ label: 'Beschreibung', multiline: true }),
                    }),
                    {
                        label: 'Vorteile',
                        itemLabel: (props) => props.fields.title.value || 'Vorteil',
                    }
                ),

                // CTA
                ctaHeadline: fields.text({ label: 'CTA: Headline' }),
                ctaButtonLabel: fields.text({ label: 'CTA: Button Text' }),
                ctaButtonHref: fields.text({ label: 'CTA: Button Link' }),

                // Content
                content: fields.markdoc({ label: 'Content' }),
            },
        }),

        // Regional IT Pages
        regionsIt: collection({
            label: 'Regionale IT-Seiten',
            slugField: 'slug',
            path: 'content/regions/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.text({ label: 'Titel' }),
                slug: fields.text({ label: 'URL Slug' }),
                city: fields.text({ label: 'Stadt' }),
                metaTitle: fields.text({ label: 'Meta Title' }),
                metaDescription: fields.text({ label: 'Meta Description', multiline: true }),
                heroHeadline: fields.text({ label: 'Hero: Headline' }),
                heroSubheadline: fields.text({ label: 'Hero: Subheadline' }),
                heroImage: fields.text({ label: 'Hero: Bild Pfad' }),
                introduction: fields.text({ label: 'Einleitung', multiline: true }),
                targetAudience: fields.text({ label: 'Zielgruppe', multiline: true }),
                distance: fields.text({ label: 'Entfernung/Reaktionszeit' }),
                content: fields.markdoc({ label: 'Content' }),
            },
        }),

        // Regional Webdesign Pages
        regionsWebdesign: collection({
            label: 'Regionale Webdesign-Seiten',
            slugField: 'slug',
            path: 'content/regions-webdesign/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.text({ label: 'Titel' }),
                slug: fields.text({ label: 'URL Slug' }),
                city: fields.text({ label: 'Stadt' }),
                metaTitle: fields.text({ label: 'Meta Title' }),
                metaDescription: fields.text({ label: 'Meta Description', multiline: true }),
                keywords: fields.text({ label: 'Keywords (kommasepariert)' }),
                heroHeadline: fields.text({ label: 'Hero: Headline' }),
                heroSubheadline: fields.text({ label: 'Hero: Subheadline' }),
                introduction: fields.text({ label: 'Einleitung', multiline: true }),
                packages: fields.array(
                    fields.object({
                        name: fields.text({ label: 'Paket Name' }),
                        price: fields.text({ label: 'Preis' }),
                        description: fields.text({ label: 'Beschreibung', multiline: true }),
                    }),
                    {
                        label: 'Webdesign Pakete',
                        itemLabel: (props) => props.fields.name.value || 'Paket',
                    }
                ),
                content: fields.markdoc({ label: 'Content' }),
            },
        }),

        // Regional Software Pages
        regionsSoftware: collection({
            label: 'Regionale Software-Seiten',
            slugField: 'slug',
            path: 'content/regions-software/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.text({ label: 'Titel' }),
                slug: fields.text({ label: 'URL Slug' }),
                city: fields.text({ label: 'Stadt' }),
                metaTitle: fields.text({ label: 'Meta Title' }),
                metaDescription: fields.text({ label: 'Meta Description', multiline: true }),
                keywords: fields.text({ label: 'Keywords (kommasepariert)' }),
                heroHeadline: fields.text({ label: 'Hero: Headline' }),
                heroSubheadline: fields.text({ label: 'Hero: Subheadline' }),
                introduction: fields.text({ label: 'Einleitung', multiline: true }),
                services: fields.array(
                    fields.object({
                        title: fields.text({ label: 'Service Titel' }),
                        description: fields.text({ label: 'Beschreibung', multiline: true }),
                    }),
                    {
                        label: 'Software Services',
                        itemLabel: (props) => props.fields.title.value || 'Service',
                    }
                ),
                content: fields.markdoc({ label: 'Content' }),
            },
        }),

        // Blog Posts
        blog: collection({
            label: 'Blog Artikel',
            slugField: 'slug',
            path: 'content/blog/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.text({ label: 'Titel' }),
                slug: fields.text({ label: 'URL Slug' }),
                publishDate: fields.date({ label: 'Veröffentlichungsdatum' }),
                author: fields.text({ label: 'Autor' }),
                category: fields.select({
                    label: 'Kategorie',
                    options: [
                        { label: 'IT-Wissen', value: 'it-wissen' },
                        { label: 'Telefonie', value: 'telefonie' },
                        { label: 'Netzwerke', value: 'netzwerke' },
                        { label: 'Gebäudeautomation', value: 'gebaeudeautomation' },
                        { label: 'Webdesign', value: 'webdesign' },
                        { label: 'Kontrollraum', value: 'kontrollraum' },
                    ],
                    defaultValue: 'it-wissen',
                }),
                excerpt: fields.text({ label: 'Auszug', multiline: true }),
                featuredImage: fields.text({ label: 'Beitragsbild Pfad' }),
                metaTitle: fields.text({ label: 'Meta Title' }),
                metaDescription: fields.text({ label: 'Meta Description', multiline: true }),
                relatedService: fields.text({ label: 'Verwandter Service Slug' }),
                isRelevantKnowledge: fields.checkbox({ label: 'Als "Relevantes Wissen" markieren', defaultValue: true }),
                content: fields.markdoc({ label: 'Content' }),
            },
        }),

        // Team Members
        team: collection({
            label: 'Team Mitglieder',
            slugField: 'slug',
            path: 'content/team/*',
            schema: {
                name: fields.text({ label: 'Name' }),
                slug: fields.text({ label: 'Slug' }),
                position: fields.text({ label: 'Position' }),
                image: fields.text({ label: 'Bild Pfad' }),
                bio: fields.text({ label: 'Biografie', multiline: true }),
                email: fields.text({ label: 'E-Mail' }),
                phone: fields.text({ label: 'Telefon' }),
                linkedin: fields.url({ label: 'LinkedIn URL' }),
                order: fields.integer({ label: 'Reihenfolge', defaultValue: 0 }),
            },
        }),

        // Testimonials
        testimonials: collection({
            label: 'Kundenbewertungen',
            slugField: 'slug',
            path: 'content/testimonials/*',
            schema: {
                name: fields.text({ label: 'Name/Firma' }),
                slug: fields.text({ label: 'Slug' }),
                company: fields.text({ label: 'Branche/Unternehmen' }),
                quote: fields.text({ label: 'Zitat', multiline: true }),
                rating: fields.integer({ label: 'Bewertung (1-5)', defaultValue: 5 }),
                service: fields.text({ label: 'Zugehöriger Service Slug' }),
                image: fields.text({ label: 'Logo/Bild Pfad' }),
                date: fields.date({ label: 'Datum' }),
            },
        }),

        // Custom Pages
        pages: collection({
            label: 'Custom Pages',
            slugField: 'slug',
            path: 'content/pages/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.text({ label: 'Titel' }),
                slug: fields.text({ label: 'URL Slug' }),
                template: fields.select({
                    label: 'Template',
                    options: [
                        { label: 'Standard', value: 'default' },
                        { label: 'Service', value: 'service' },
                        { label: 'Landing', value: 'landing' },
                        { label: 'Legal', value: 'legal' },
                    ],
                    defaultValue: 'default',
                }),
                metaTitle: fields.text({ label: 'Meta Title' }),
                metaDescription: fields.text({ label: 'Meta Description', multiline: true }),
                heroHeadline: fields.text({ label: 'Hero: Headline' }),
                heroSubheadline: fields.text({ label: 'Hero: Subheadline' }),
                heroImage: fields.text({ label: 'Hero: Bild Pfad' }),
                content: fields.markdoc({ label: 'Content' }),
            },
        }),
    },
});
