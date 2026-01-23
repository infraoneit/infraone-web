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
        // =====================================================
        // LEISTUNGEN
        // =====================================================
        
        // IT-Support Hauptseite
        itSupport: singleton({
            label: 'Leistungen - IT-Support',
            path: 'content/leistungen/it-support',
            format: { data: 'json' },
            schema: {
                // SECTION: HERO-BEREICH (oben auf der Seite)
                heroSection: fields.object({
                    categoryLabel: fields.text({
                        label: 'Kategorie-Label (klein, oben)',
                        description: 'z.B. "IT-SUPPORT & COMPUTERHILFE"',
                        defaultValue: 'IT-SUPPORT & COMPUTERHILFE',
                    }),
                    headline: fields.text({
                        label: 'Ueberschrift (H1)',
                        description: 'Hauptueberschrift, z.B. "Informatik-Support"',
                        validation: { isRequired: true },
                    }),
                    subheadline: fields.text({
                        label: 'Zweite Zeile (Bold)',
                        description: 'Kurzer Slogan, z.B. "Sofort. Schweizweit."',
                    }),
                    description: fields.text({
                        label: 'Beschreibungstext',
                        description: 'Text unter der Ueberschrift (2-3 Saetze)',
                        multiline: true,
                    }),
                    heroImage: fields.image({
                        label: 'Hero-Bild (rechts)',
                        description: 'Grosses Bild rechts im Hero-Bereich',
                        directory: 'public/images/leistungen',
                        publicPath: '/images/leistungen/',
                    }),
                    primaryButtonText: fields.text({
                        label: 'Button 1: Text',
                        description: 'z.B. "052 222 18 18"',
                        defaultValue: '052 222 18 18',
                    }),
                    primaryButtonHref: fields.text({
                        label: 'Button 1: Link',
                        description: 'z.B. "tel:+41522221818"',
                        defaultValue: 'tel:+41522221818',
                    }),
                    secondaryButtonText: fields.text({
                        label: 'Button 2: Text',
                        description: 'z.B. "Remote-Support starten"',
                        defaultValue: 'Remote-Support starten',
                    }),
                    secondaryButtonAction: fields.select({
                        label: 'Button 2: Aktion',
                        description: 'Was passiert beim Klick?',
                        options: [
                            { label: 'Link oeffnen (URL/Seite)', value: 'link' },
                            { label: 'Datei herunterladen', value: 'download' },
                        ],
                        defaultValue: 'link',
                    }),
                    secondaryButtonUrl: fields.text({
                        label: 'Button 2: URL (fuer Link)',
                        description: 'Wird geoeffnet wenn Aktion = Link. z.B. "https://anydesk.com/..." oder "/kontakt"',
                        defaultValue: 'https://anydesk.com/de/downloads/thank-you?dv=win_exe',
                    }),
                    secondaryButtonFile: fields.file({
                        label: 'Button 2: Datei (fuer Download)',
                        description: 'Wird heruntergeladen wenn Aktion = Datei herunterladen.',
                        directory: 'public/downloads',
                        publicPath: '/downloads/',
                    }),
                    secondaryButtonFileName: fields.text({
                        label: 'Button 2: Download-Dateiname',
                        description: 'Wie soll die Datei beim Download heissen? z.B. "AnyDesk.exe" oder "Remote-Support.zip"',
                    }),
                }, {
                    label: 'HERO-BEREICH',
                    description: 'Der oberste Bereich der Seite mit Ueberschrift und Bild',
                }),

                // SECTION: PREISE & LEISTUNGEN
                pricingSection: fields.object({
                    sectionTitle: fields.text({
                        label: 'Section-Titel',
                        defaultValue: 'IT-Support Preise & Leistungen',
                    }),
                    sectionSubtitle: fields.text({
                        label: 'Section-Untertitel',
                        defaultValue: 'Transparente Preise ohne versteckte Kosten. Abrechnung im 15-Minuten-Takt.',
                    }),
                    gridColumns: fields.select({
                        label: 'Kacheln pro Reihe',
                        description: 'Wie viele Kacheln sollen nebeneinander angezeigt werden?',
                        options: [
                            { label: '2 Kacheln pro Reihe', value: '2' },
                            { label: '3 Kacheln pro Reihe', value: '3' },
                            { label: '4 Kacheln pro Reihe', value: '4' },
                        ],
                        defaultValue: '4',
                    }),
                    priceCards: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Titel', description: 'z.B. "Telefonischer Support"' }),
                            description: fields.text({ label: 'Beschreibung', multiline: true }),
                            price: fields.text({ label: 'Preis', description: 'z.B. "CHF 120.–/h" oder "Auf Anfrage"' }),
                            billing: fields.text({ 
                                label: 'Abrechnungshinweis', 
                                description: 'z.B. "Mindestverrechnung: 15 Minuten" (optional)' 
                            }),
                            icon: fields.select({
                                label: 'Icon',
                                options: [
                                    { label: 'Telefon', value: 'phone' },
                                    { label: 'Monitor (Remote)', value: 'monitor' },
                                    { label: 'Pin (Vor-Ort)', value: 'mappin' },
                                    { label: 'Personen (KMU/Team)', value: 'users' },
                                    { label: 'Schild (Sicherheit)', value: 'shield' },
                                    { label: 'Cloud', value: 'cloud' },
                                    { label: 'Werkzeug (Reparatur)', value: 'wrench' },
                                    { label: 'Blitz (Schnell)', value: 'zap' },
                                    { label: 'Kopfhoerer (Support)', value: 'headphones' },
                                    { label: 'Globus (Netzwerk)', value: 'globe' },
                                    { label: 'E-Mail', value: 'mail' },
                                    { label: 'Server', value: 'server' },
                                    { label: 'Festplatte (Backup)', value: 'harddrive' },
                                    { label: 'Chart (Monitoring)', value: 'barchart' },
                                    { label: 'Schloss (Security)', value: 'lock' },
                                    { label: 'Zahnrad (Einstellungen)', value: 'settings' },
                                    { label: 'Smartphone', value: 'smartphone' },
                                    { label: 'Laptop', value: 'laptop' },
                                    { label: 'Drucker', value: 'printer' },
                                    { label: 'WLAN', value: 'wifi' },
                                ],
                                defaultValue: 'phone',
                            }),
                        }),
                        {
                            label: 'Preis-Karten',
                            description: 'Leistungs-/Preis-Kacheln (beliebig viele)',
                            itemLabel: props => props.fields.title.value || 'Neue Preis-Karte',
                        }
                    ),
                    travelCosts: fields.object({
                        freeRegions: fields.text({
                            label: 'Kostenlose Regionen',
                            description: 'z.B. "Winterthur & Andelfingen"',
                            defaultValue: 'Winterthur & Andelfingen',
                        }),
                        freeRegionsNote: fields.text({
                            label: 'Hinweis kostenlose Regionen',
                            defaultValue: 'Keine Anfahrtskosten',
                        }),
                        otherRegions: fields.text({
                            label: 'Uebrige Regionen',
                            defaultValue: 'Uebrige Regionen',
                        }),
                        otherRegionsPrice: fields.text({
                            label: 'Preis uebrige Regionen',
                            defaultValue: 'CHF 2.00/km (ab Winterthur)',
                        }),
                        otherRegionsNote: fields.text({
                            label: 'Zusaetzlicher Hinweis',
                            description: 'z.B. "Pro gefahrenem Kilometer (Hin- und Rueckweg kombiniert)..."',
                            multiline: true,
                        }),
                    }, { label: 'Anfahrtskosten' }),
                    supportHours: fields.object({
                        times: fields.array(
                            fields.object({
                                time: fields.text({ 
                                    label: 'Zeitfenster', 
                                    description: 'z.B. "Mo–Fr 08:00–17:00"' 
                                }),
                                text: fields.text({ 
                                    label: 'Beschreibung', 
                                    description: 'z.B. "regulaerer Tarif" oder "+25% Zuschlag"' 
                                }),
                                style: fields.select({
                                    label: 'Hervorhebung',
                                    description: 'Farb-Stil fuer diese Zeile',
                                    options: [
                                        { label: 'Neutral (Standard)', value: 'neutral' },
                                        { label: 'Warnung (gelb)', value: 'warning' },
                                        { label: 'Gefahr (rot)', value: 'danger' },
                                    ],
                                    defaultValue: 'neutral',
                                }),
                            }),
                            {
                                label: 'Zeitfenster',
                                description: 'Supportzeiten mit Zuschlaegen',
                                itemLabel: props => props.fields.time.value || 'Neues Zeitfenster',
                            }
                        ),
                        note: fields.text({ 
                            label: 'Zusaetzlicher Hinweis', 
                            description: 'Allgemeiner Hinweis unter der Tabelle',
                            multiline: true,
                        }),
                        // Alte Felder als optional beibehalten fuer Rueckwaertskompatibilitaet
                        regularLabel: fields.text({ label: '[ALT] Regulaer Label (wird nicht mehr verwendet)' }),
                        regularNote: fields.text({ label: '[ALT] Regulaer Hinweis (wird nicht mehr verwendet)' }),
                        extendedLabel: fields.text({ label: '[ALT] Erweitert Label (wird nicht mehr verwendet)' }),
                        extendedNote: fields.text({ label: '[ALT] Erweitert Hinweis (wird nicht mehr verwendet)' }),
                        slaNote: fields.text({ label: '[ALT] SLA-Hinweis (wird nicht mehr verwendet)' }),
                    }, { label: 'Supportzeiten' }),
                }, {
                    label: 'PREISE & LEISTUNGEN',
                    description: 'Die Preis-Section mit den 4 Karten und Zusatzinfos',
                }),

                // SECTION: REGIONEN (IT-Support in Ihrer Region)
                regionsSection: fields.object({
                    sectionTitle: fields.text({
                        label: 'Section-Titel',
                        defaultValue: 'IT-Support in Ihrer Region',
                    }),
                    sectionSubtitle: fields.text({
                        label: 'Section-Untertitel',
                        defaultValue: 'Vor-Ort-Einsaetze in der Ostschweiz - Remote-Support schweizweit.',
                    }),
                    regions: fields.array(
                        fields.object({
                            name: fields.text({ label: 'Region/Stadt', description: 'z.B. "Winterthur"' }),
                            slug: fields.text({ label: 'URL-Slug', description: 'z.B. "winterthur"' }),
                            description: fields.text({ label: 'Kurzbeschreibung', description: '1 Satz' }),
                            isFree: fields.checkbox({ label: 'Anfahrt kostenlos?', defaultValue: false }),
                        }),
                        {
                            label: 'Regionen',
                            description: 'Die regionalen Unterseiten',
                            itemLabel: props => props.fields.name.value || 'Neue Region',
                        }
                    ),
                }, {
                    label: 'REGIONEN',
                    description: 'Die "IT-Support in Ihrer Region" Section mit Links zu Unterseiten',
                }),

                // SECTION: FAQs
                faqsSection: fields.object({
                    sectionTitle: fields.text({
                        label: 'Section-Titel',
                        defaultValue: 'Haeufige Fragen',
                    }),
                    sectionSubtitle: fields.text({
                        label: 'Section-Untertitel',
                        defaultValue: 'Antworten auf die wichtigsten Fragen zu unserem Support.',
                    }),
                    faqs: fields.array(
                        fields.object({
                            question: fields.text({ label: 'Frage' }),
                            answer: fields.text({ label: 'Antwort', multiline: true }),
                        }),
                        {
                            label: 'FAQs',
                            description: 'Fragen und Antworten',
                            itemLabel: props => props.fields.question.value || 'Neue Frage',
                        }
                    ),
                }, {
                    label: 'FAQs',
                    description: 'Haeufig gestellte Fragen am Ende der Seite',
                }),

                // SECTION: IT-NOTFALL CTA (am Ende der Seite)
                ctaSection: fields.object({
                    headline: fields.text({
                        label: 'Ueberschrift',
                        defaultValue: 'IT-Notfall? Wir sind erreichbar.',
                    }),
                    subtitle: fields.text({
                        label: 'Untertitel',
                        defaultValue: 'Telefon oder WhatsApp - sofortige Hilfe fuer dringende IT-Probleme.',
                    }),
                    emergencyPhone: fields.text({
                        label: 'Notfall-Telefon',
                        description: 'Die Notfall-Nummer (Display)',
                        defaultValue: '076 587 50 55',
                    }),
                    emergencyPhoneLink: fields.text({
                        label: 'Notfall-Telefon Link',
                        defaultValue: 'tel:+41765875055',
                    }),
                    whatsappLabel: fields.text({
                        label: 'WhatsApp Button Text',
                        defaultValue: 'WhatsApp oeffnen',
                    }),
                    whatsappLink: fields.text({
                        label: 'WhatsApp Link',
                        defaultValue: 'https://wa.me/41765875055',
                    }),
                }, {
                    label: 'IT-NOTFALL CTA',
                    description: 'Die gruene CTA-Box am Ende der Seite fuer Notfaelle',
                }),

                // SECTION: SEO-EINSTELLUNGEN
                seoSection: fields.object({
                    metaTitle: fields.text({
                        label: 'Meta-Titel',
                        description: 'Titel fuer Suchmaschinen (max. 60 Zeichen)',
                    }),
                    metaDescription: fields.text({
                        label: 'Meta-Beschreibung',
                        description: 'Beschreibung fuer Suchmaschinen (max. 160 Zeichen)',
                        multiline: true,
                    }),
                    canonicalUrl: fields.text({
                        label: 'Canonical URL',
                        description: 'Leer lassen = Standard-URL. Nur aendern wenn noetig (z.B. bei Duplikaten).',
                    }),
                }, {
                    label: 'SEO-EINSTELLUNGEN',
                    description: 'Meta-Daten fuer Suchmaschinen',
                }),

                // SECTION: STRUCTURED DATA (Experten-Einstellungen)
                structuredDataSection: fields.object({
                    schemaType: fields.select({
                        label: 'Schema-Typ',
                        description: 'Welcher Unternehmenstyp soll in den Suchergebnissen erscheinen?',
                        options: [
                            { label: 'LocalBusiness (Lokales Geschaeft mit Standort)', value: 'LocalBusiness' },
                            { label: 'ProfessionalService (Professionelle Dienstleistung)', value: 'ProfessionalService' },
                        ],
                        defaultValue: 'ProfessionalService',
                    }),
                    areaServed: fields.multiselect({
                        label: 'Bediente Regionen (areaServed)',
                        description: 'In welchen Regionen wird die Dienstleistung angeboten?',
                        options: [
                            { label: 'Schweiz (ganze)', value: 'Schweiz' },
                            { label: 'Winterthur', value: 'Winterthur' },
                            { label: 'Zuerich', value: 'Zuerich' },
                            { label: 'Schaffhausen', value: 'Schaffhausen' },
                            { label: 'Thurgau', value: 'Thurgau' },
                            { label: 'St. Gallen', value: 'St. Gallen' },
                            { label: 'Andelfingen', value: 'Andelfingen' },
                            { label: 'Aargau', value: 'Aargau' },
                            { label: 'Basel', value: 'Basel' },
                            { label: 'Bern', value: 'Bern' },
                            { label: 'Luzern', value: 'Luzern' },
                            { label: 'Zug', value: 'Zug' },
                            { label: 'Solothurn', value: 'Solothurn' },
                            { label: 'Graubuenden', value: 'Graubuenden' },
                        ],
                        defaultValue: ['Schweiz', 'Winterthur', 'Zuerich', 'Schaffhausen', 'Thurgau', 'St. Gallen'],
                    }),
                    includeFaqSchema: fields.checkbox({
                        label: 'FAQ Schema generieren',
                        description: 'FAQs als Structured Data fuer Google-Suchergebnisse ausgeben?',
                        defaultValue: true,
                    }),
                }, {
                    label: 'STRUCTURED DATA (Experten)',
                    description: 'NUR FUER ANWENDER MIT TECHNISCHEM KNOW-HOW! Fehlerhafte Einstellungen koennen das SEO-Ranking negativ beeinflussen.',
                }),
            },
        }),

        // =====================================================
        // EINSTELLUNGEN
        // =====================================================
        
        // Site Settings
        siteSettings: singleton({
            label: 'Site Settings',
            path: 'content/settings/site',
            format: { data: 'json' },
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
                openingHours: fields.text({ label: 'Oeffnungszeiten', defaultValue: 'Mo-Fr 8:00-17:00' }),
            },
        }),

        // Header Navigation
        header: singleton({
            label: 'Header Navigation',
            path: 'content/settings/header',
            format: { data: 'json' },
            schema: {
                ctaLabel: fields.text({ label: 'CTA Button Text', defaultValue: 'Kostenloses Erstgespraech' }),
                ctaHref: fields.text({ label: 'CTA Button Link', defaultValue: '/kontakt' }),
                showTopBar: fields.checkbox({ label: 'Top Bar anzeigen', defaultValue: true }),
                topBarDiscountText: fields.text({ label: 'Top Bar Rabatt Text', defaultValue: '20% Neukunden-Rabatt' }),
            },
        }),

        // Footer
        footer: singleton({
            label: 'Footer',
            path: 'content/settings/footer',
            format: { data: 'json' },
            schema: {
                tagline: fields.text({ label: 'Tagline', defaultValue: 'Digitale Loesungen. Echt. Einfach.' }),
                copyrightText: fields.text({ label: 'Copyright Text', defaultValue: '(c) {year} InfraOne IT Solutions GmbH' }),
                showSupportButton: fields.checkbox({ label: 'Support Button anzeigen', defaultValue: true }),
                supportButtonLabel: fields.text({ label: 'Support Button Text', defaultValue: 'Support Anfordern' }),
            },
        }),
    },

    collections: {
        // =====================================================
        // BLOG ARTIKEL
        // =====================================================
        blog: collection({
            label: 'Blog Artikel',
            slugField: 'slug',
            path: 'content/blog/*',
            entryLayout: 'content',
            format: { data: 'json' },
            schema: {
                // GRUNDINFORMATIONEN
                slug: fields.text({ 
                    label: 'URL-Slug',
                    description: 'URL-freundlicher Name (z.B. "cybersecurity-tipps-kmu"). Kleinbuchstaben, keine Leerzeichen.',
                }),
                title: fields.text({ 
                    label: 'Artikel-Titel (H1)',
                    description: 'Hauptueberschrift des Artikels. Erscheint als H1 auf der Seite.',
                    validation: { isRequired: true },
                }),
                excerpt: fields.text({ 
                    label: 'Kurzbeschreibung',
                    description: 'Kurze Zusammenfassung (2-3 Saetze). Wird in der Blog-Uebersicht angezeigt.',
                    multiline: true,
                    validation: { isRequired: true },
                }),

                // KATEGORISIERUNG
                category: fields.select({
                    label: 'Wissenskategorie',
                    description: 'Themenbereich des Artikels.',
                    options: [
                        { label: 'IT-Wissen', value: 'it-wissen' },
                        { label: 'Telefonie', value: 'telefonie' },
                        { label: 'Netzwerke', value: 'netzwerke' },
                        { label: 'Gebaeudeautomation', value: 'gebaeudeautomation' },
                        { label: 'Webdesign', value: 'webdesign' },
                        { label: 'Kontrollraum', value: 'kontrollraum' },
                    ],
                    defaultValue: 'it-wissen',
                }),
                keywords: fields.array(
                    fields.text({ label: 'Schlagwort' }),
                    {
                        label: 'Schlagwoerter / Tags',
                        description: 'Relevante Begriffe fuer Suche und SEO.',
                        itemLabel: props => props.value || 'Neues Schlagwort',
                    }
                ),

                // TITELBILD
                featuredImage: fields.image({
                    label: 'Titelbild',
                    description: 'Wird unter der Ueberschrift angezeigt. Empfohlene Groesse: 1200x630px (21:9 Format).',
                    directory: 'public/images/blog',
                    publicPath: '/images/blog/',
                }),

                // VEROEFFENTLICHUNG
                publishDate: fields.date({ 
                    label: 'Veroeffentlichungsdatum',
                    description: 'Artikel werden nach Datum sortiert (neueste zuerst).',
                    defaultValue: { kind: 'today' },
                }),
                readingTime: fields.text({ 
                    label: 'Lesezeit',
                    description: 'z.B. "5 Min."',
                    defaultValue: '5 Min.',
                }),

                // ARTIKELINHALT (Rich-Text-Editor)
                content: fields.markdoc({
                    label: 'Artikelinhalt',
                    description: 'Nutzen Sie die Toolbar oben fuer Formatierungen.',
                    options: {
                        heading: [2, 3, 4],
                        bold: true,
                        italic: true,
                        strikethrough: true,
                        link: true,
                        blockquote: true,
                        orderedList: true,
                        unorderedList: true,
                        code: true,
                        codeBlock: true,
                        table: true,
                        image: {
                            directory: 'public/images/blog',
                            publicPath: '/images/blog/',
                        },
                    },
                }),

                // SEO-EINSTELLUNGEN
                metaTitle: fields.text({ 
                    label: 'SEO: Meta-Titel',
                    description: 'Titel fuer Suchmaschinen (max. 60 Zeichen). Leer = Artikel-Titel.',
                }),
                metaDescription: fields.text({ 
                    label: 'SEO: Meta-Beschreibung',
                    description: 'Beschreibung fuer Suchmaschinen (max. 160 Zeichen). Leer = Kurzbeschreibung.',
                    multiline: true,
                }),
            },
        }),

        // =====================================================
        // KUNDENBEWERTUNGEN
        // =====================================================
        testimonials: collection({
            label: 'Kundenbewertungen',
            slugField: 'slug',
            path: 'content/testimonials/*',
            format: { data: 'yaml' },
            schema: {
                name: fields.text({ label: 'Firmenname' }),
                slug: fields.text({ label: 'Slug' }),
                company: fields.text({ label: 'Branche' }),
                quote: fields.text({ label: 'Kundenzitat', multiline: true }),
                rating: fields.integer({ label: 'Sterne (1-5)', defaultValue: 5 }),
                service: fields.text({ label: 'Zugehoeriger Service' }),
                date: fields.date({ label: 'Datum' }),
            },
        }),

        // =====================================================
        // ANLEITUNGEN (CMS-Dokumentation)
        // =====================================================
        anleitungen: collection({
            label: 'Anleitungen',
            slugField: 'title',
            path: 'content/anleitungen/*',
            entryLayout: 'content',
            format: { data: 'json' },
            schema: {
                title: fields.text({ 
                    label: 'Titel',
                    description: 'Titel der Anleitung',
                    validation: { isRequired: true },
                }),
                kategorie: fields.select({
                    label: 'Kategorie',
                    options: [
                        { label: 'CMS & Keystatic', value: 'cms' },
                        { label: 'Entwicklung', value: 'entwicklung' },
                        { label: 'Allgemein', value: 'allgemein' },
                    ],
                    defaultValue: 'cms',
                }),
                content: fields.markdoc({
                    label: 'Inhalt',
                    description: 'Die vollstaendige Anleitung.',
                    options: {
                        heading: [2, 3, 4],
                        bold: true,
                        italic: true,
                        strikethrough: true,
                        link: true,
                        blockquote: true,
                        orderedList: true,
                        unorderedList: true,
                        code: true,
                        codeBlock: true,
                        table: true,
                    },
                }),
            },
        }),

        // =====================================================
        // TEAM MITGLIEDER
        // =====================================================
        team: collection({
            label: 'Team Mitglieder',
            slugField: 'name',
            path: 'content/team/*',
            format: { data: 'json' },
            schema: {
                name: fields.slug({ name: { label: 'Name' } }),
                position: fields.text({ label: 'Position' }),
                image: fields.text({ label: 'Foto (Pfad)' }),
                bio: fields.text({ label: 'Kurzbiografie', multiline: true }),
                email: fields.text({ label: 'E-Mail' }),
                phone: fields.text({ label: 'Telefon' }),
                order: fields.integer({ label: 'Reihenfolge', defaultValue: 0 }),
            },
        }),

        // =====================================================
        // IT-SUPPORT REGIONEN (Spoke-Seiten)
        // =====================================================
        itSupportRegions: collection({
            label: 'IT-Support Regionen',
            slugField: 'slug',
            path: 'content/leistungen/it-support-regions/*',
            format: { data: 'json' },
            schema: {
                // BASIS-INFORMATIONEN
                slug: fields.text({
                    label: 'URL-Slug',
                    description: 'URL-Pfad z.B. "winterthur" fuer /it-support/winterthur',
                    validation: { isRequired: true },
                }),
                name: fields.text({
                    label: 'Regionsname',
                    description: 'z.B. "Winterthur" oder "Zuercher Weinland"',
                    validation: { isRequired: true },
                }),
                isFree: fields.checkbox({
                    label: 'Anfahrt kostenlos?',
                    description: 'Aktivieren wenn keine Anfahrtskosten berechnet werden',
                    defaultValue: false,
                }),
                anfahrt: fields.text({
                    label: 'Anfahrtskosten-Text',
                    description: 'z.B. "Keine Anfahrtskosten" oder "CHF 40.– Pauschale"',
                    defaultValue: 'Auf Anfrage',
                }),

                // HERO-BEREICH
                headline: fields.text({
                    label: 'Ueberschrift (H1)',
                    description: 'z.B. "IT-Support Winterthur"',
                    validation: { isRequired: true },
                }),
                subheadline: fields.text({
                    label: 'Unterzeile',
                    description: 'z.B. "Ihr lokaler IT-Partner in der Eulachstadt"',
                }),
                description: fields.text({
                    label: 'Kurzbeschreibung',
                    description: 'Kurzer Text fuer Hero-Bereich (1-2 Saetze)',
                    multiline: true,
                }),
                regionalImage: fields.image({
                    label: 'Regionsbild',
                    description: 'Bild fuer die Region (z.B. Stadtansicht)',
                    directory: 'public/images/regions',
                    publicPath: '/images/regions/',
                }),

                // EINLEITUNG & CONTENT
                intro: fields.text({
                    label: 'Einleitungstext',
                    description: 'Ausfuehrlicher Text ueber IT-Support in dieser Region (3-5 Saetze)',
                    multiline: true,
                }),
                localBenefits: fields.array(
                    fields.text({ label: 'Vorteil' }),
                    {
                        label: 'Lokale Vorteile',
                        description: 'z.B. "Hauptstandort - keine Anfahrt", "Vor-Ort in 30 Minuten"',
                        itemLabel: props => props.value || 'Neuer Vorteil',
                    }
                ),

                // STATISTIKEN
                stats: fields.array(
                    fields.object({
                        label: fields.text({ label: 'Beschriftung', description: 'z.B. "Kunden in der Region"' }),
                        value: fields.text({ label: 'Wert', description: 'z.B. "200+" oder "< 30 Min"' }),
                    }),
                    {
                        label: 'Statistiken',
                        description: 'Zahlen/Fakten zur Region',
                        itemLabel: props => props.fields.label.value || 'Neue Statistik',
                    }
                ),

                // LOKALE BRANCHEN
                localIndustries: fields.array(
                    fields.object({
                        name: fields.text({ label: 'Branche', description: 'z.B. "Arztpraxen"' }),
                        need: fields.text({ label: 'IT-Beduerfnisse', description: 'z.B. "Sichere Patientendaten, HIN-Mail"', multiline: true }),
                    }),
                    {
                        label: 'Lokale Branchen',
                        description: 'Branchen die Sie in dieser Region betreuen',
                        itemLabel: props => props.fields.name.value || 'Neue Branche',
                    }
                ),

                // FAQs
                localFaqQuestion: fields.text({ label: 'Regionale Haupt-FAQ Frage' }),
                localFaqAnswer: fields.text({ label: 'Regionale Haupt-FAQ Antwort', multiline: true }),
                additionalFaqs: fields.array(
                    fields.object({
                        question: fields.text({ label: 'Frage' }),
                        answer: fields.text({ label: 'Antwort', multiline: true }),
                    }),
                    {
                        label: 'Zusaetzliche FAQs',
                        description: 'Weitere regionale Fragen',
                        itemLabel: props => props.fields.question.value || 'Neue FAQ',
                    }
                ),

                // SEO-EINSTELLUNGEN
                metaTitle: fields.text({
                    label: 'Meta-Titel',
                    description: 'Titel fuer Suchmaschinen (max. 60 Zeichen)',
                }),
                metaDescription: fields.text({
                    label: 'Meta-Beschreibung',
                    description: 'Beschreibung fuer Suchmaschinen (max. 160 Zeichen)',
                    multiline: true,
                }),
                keywords: fields.array(
                    fields.text({ label: 'Keyword' }),
                    {
                        label: 'Keywords',
                        description: 'Suchbegriffe fuer diese Region',
                        itemLabel: props => props.value || 'Neues Keyword',
                    }
                ),

                // STRUCTURED DATA
                schemaType: fields.select({
                    label: 'Schema-Typ',
                    description: 'Haupt-Schema fuer diese Region',
                    options: [
                        { label: 'LocalBusiness', value: 'LocalBusiness' },
                        { label: 'ProfessionalService', value: 'ProfessionalService' },
                    ],
                    defaultValue: 'LocalBusiness',
                }),
                includeFaqSchema: fields.checkbox({
                    label: 'FAQ Schema generieren?',
                    description: 'FAQs als Structured Data ausgeben',
                    defaultValue: true,
                }),
                canonicalUrl: fields.text({
                    label: 'Canonical URL',
                    description: 'Optional: Bevorzugte URL dieser Seite. Leer lassen fuer Standard.',
                }),
                areaServed: fields.multiselect({
                    label: 'Bediente Regionen (Area Served)',
                    description: 'Regionen fuer Structured Data',
                    options: [
                        { label: 'Schweiz', value: 'Schweiz' },
                        { label: 'Winterthur', value: 'Winterthur' },
                        { label: 'Zuerich', value: 'Zuerich' },
                        { label: 'Schaffhausen', value: 'Schaffhausen' },
                        { label: 'Thurgau', value: 'Thurgau' },
                        { label: 'St. Gallen', value: 'St. Gallen' },
                        { label: 'Andelfingen', value: 'Andelfingen' },
                        { label: 'Rapperswil', value: 'Rapperswil' },
                        { label: 'Aargau', value: 'Aargau' },
                        { label: 'Basel', value: 'Basel' },
                        { label: 'Bern', value: 'Bern' },
                        { label: 'Luzern', value: 'Luzern' },
                        // Winterthur Stadtteile
                        { label: 'Eulachstadt (Winterthur)', value: 'Eulachstadt' },
                        { label: 'Töss (Winterthur)', value: 'Töss' },
                        { label: 'Seen (Winterthur)', value: 'Seen' },
                        { label: 'Wülflingen (Winterthur)', value: 'Wülflingen' },
                        { label: 'Veltheim (Winterthur)', value: 'Veltheim' },
                    ],
                    defaultValue: ['Schweiz'],
                }),
            },
        }),
    },
});
