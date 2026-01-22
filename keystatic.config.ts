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
            label: 'Leistungen → IT-Support',
            path: 'content/leistungen/it-support',
            format: { data: 'json' },
            schema: {
                // ═══════════════════════════════════════════════════════════
                // 📌 SECTION: HERO-BEREICH (oben auf der Seite)
                // ═══════════════════════════════════════════════════════════
                heroSection: fields.object({
                    categoryLabel: fields.text({
                        label: 'Kategorie-Label (klein, oben)',
                        description: 'z.B. "IT-SUPPORT & COMPUTERHILFE"',
                        defaultValue: 'IT-SUPPORT & COMPUTERHILFE',
                    }),
                    headline: fields.text({
                        label: 'Überschrift (H1)',
                        description: 'Hauptüberschrift, z.B. "Informatik-Support"',
                        validation: { isRequired: true },
                    }),
                    subheadline: fields.text({
                        label: 'Zweite Zeile (Bold)',
                        description: 'Kurzer Slogan, z.B. "Sofort. Schweizweit."',
                    }),
                    description: fields.text({
                        label: 'Beschreibungstext',
                        description: 'Text unter der Überschrift (2-3 Sätze)',
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
                            { label: '🔗 Link öffnen (URL/Seite)', value: 'link' },
                            { label: '📥 Datei herunterladen', value: 'download' },
                        ],
                        defaultValue: 'link',
                    }),
                    secondaryButtonUrl: fields.text({
                        label: 'Button 2: URL (für Link)',
                        description: 'Wird geöffnet wenn Aktion = Link. z.B. "https://anydesk.com/..." oder "/kontakt"',
                        defaultValue: 'https://anydesk.com/de/downloads/thank-you?dv=win_exe',
                    }),
                    secondaryButtonFile: fields.file({
                        label: 'Button 2: Datei (für Download)',
                        description: 'Wird heruntergeladen wenn Aktion = Datei herunterladen.',
                        directory: 'public/downloads',
                        publicPath: '/downloads/',
                    }),
                    secondaryButtonFileName: fields.text({
                        label: 'Button 2: Download-Dateiname',
                        description: 'Wie soll die Datei beim Download heissen? z.B. "AnyDesk.exe" oder "Remote-Support.zip"',
                    }),
                }, {
                    label: '📌 HERO-BEREICH',
                    description: 'Der oberste Bereich der Seite mit Überschrift und Bild',
                }),

                // ═══════════════════════════════════════════════════════════
                // 💰 SECTION: PREISE & LEISTUNGEN
                // ═══════════════════════════════════════════════════════════
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
                            icon: fields.select({
                                label: 'Icon',
                                options: [
                                    { label: '📞 Telefon', value: 'phone' },
                                    { label: '🖥️ Monitor (Remote)', value: 'monitor' },
                                    { label: '📍 Pin (Vor-Ort)', value: 'mappin' },
                                    { label: '👥 Personen (KMU/Team)', value: 'users' },
                                    { label: '🛡️ Schild (Sicherheit)', value: 'shield' },
                                    { label: '☁️ Cloud', value: 'cloud' },
                                    { label: '🔧 Werkzeug (Reparatur)', value: 'wrench' },
                                    { label: '⚡ Blitz (Schnell)', value: 'zap' },
                                    { label: '🎧 Kopfhörer (Support)', value: 'headphones' },
                                    { label: '🌐 Globus (Netzwerk)', value: 'globe' },
                                    { label: '📧 E-Mail', value: 'mail' },
                                    { label: '🗄️ Server', value: 'server' },
                                    { label: '💾 Festplatte (Backup)', value: 'harddrive' },
                                    { label: '📊 Chart (Monitoring)', value: 'barchart' },
                                    { label: '🔒 Schloss (Security)', value: 'lock' },
                                    { label: '⚙️ Zahnrad (Einstellungen)', value: 'settings' },
                                    { label: '📱 Smartphone', value: 'smartphone' },
                                    { label: '💻 Laptop', value: 'laptop' },
                                    { label: '🖨️ Drucker', value: 'printer' },
                                    { label: '📶 WLAN', value: 'wifi' },
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
                            label: 'Übrige Regionen',
                            defaultValue: 'Übrige Regionen',
                        }),
                        otherRegionsPrice: fields.text({
                            label: 'Preis übrige Regionen',
                            defaultValue: 'CHF 2.00/km (ab Winterthur)',
                        }),
                    }, { label: 'Anfahrtskosten' }),
                    supportHours: fields.object({
                        regularLabel: fields.text({ label: 'Regulär Label', defaultValue: 'Regulär: Mo–Fr 08:00–17:00' }),
                        regularNote: fields.text({ label: 'Regulär Hinweis', defaultValue: 'Normaltarif' }),
                        extendedLabel: fields.text({ label: 'Erweitert Label', defaultValue: 'Erweitert: bis 23:00 Uhr' }),
                        extendedNote: fields.text({ label: 'Erweitert Hinweis', defaultValue: '+50% Zuschlag, Best-Effort' }),
                        slaNote: fields.text({ label: 'SLA-Hinweis', defaultValue: '24/7-Verfügbarkeit nur mit aktivem SLA-Vertrag möglich.' }),
                    }, { label: 'Supportzeiten' }),
                }, {
                    label: '💰 PREISE & LEISTUNGEN',
                    description: 'Die Preis-Section mit den 4 Karten und Zusatzinfos',
                }),

                // ═══════════════════════════════════════════════════════════
                // 📍 SECTION: REGIONEN (IT-Support in Ihrer Region)
                // ═══════════════════════════════════════════════════════════
                regionsSection: fields.object({
                    sectionTitle: fields.text({
                        label: 'Section-Titel',
                        defaultValue: 'IT-Support in Ihrer Region',
                    }),
                    sectionSubtitle: fields.text({
                        label: 'Section-Untertitel',
                        defaultValue: 'Vor-Ort-Einsätze in der Ostschweiz – Remote-Support schweizweit.',
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
                    label: '📍 REGIONEN',
                    description: 'Die "IT-Support in Ihrer Region" Section mit Links zu Unterseiten',
                }),

                // ═══════════════════════════════════════════════════════════
                // ❓ SECTION: FAQs
                // ═══════════════════════════════════════════════════════════
                faqsSection: fields.object({
                    sectionTitle: fields.text({
                        label: 'Section-Titel',
                        defaultValue: 'Häufige Fragen',
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
                    label: '❓ FAQs',
                    description: 'Häufig gestellte Fragen am Ende der Seite',
                }),

                // ═══════════════════════════════════════════════════════════
                // 🚨 SECTION: IT-NOTFALL CTA (am Ende der Seite)
                // ═══════════════════════════════════════════════════════════
                ctaSection: fields.object({
                    headline: fields.text({
                        label: 'Überschrift',
                        defaultValue: 'IT-Notfall? Wir sind erreichbar.',
                    }),
                    subtitle: fields.text({
                        label: 'Untertitel',
                        defaultValue: 'Telefon oder WhatsApp – sofortige Hilfe für dringende IT-Probleme.',
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
                        defaultValue: 'WhatsApp öffnen',
                    }),
                    whatsappLink: fields.text({
                        label: 'WhatsApp Link',
                        defaultValue: 'https://wa.me/41765875055',
                    }),
                }, {
                    label: '🚨 IT-NOTFALL CTA',
                    description: 'Die grüne CTA-Box am Ende der Seite für Notfälle',
                }),

                // ═══════════════════════════════════════════════════════════
                // 🔍 SECTION: SEO-EINSTELLUNGEN
                // ═══════════════════════════════════════════════════════════
                seoSection: fields.object({
                    metaTitle: fields.text({
                        label: 'Meta-Titel',
                        description: 'Titel für Suchmaschinen (max. 60 Zeichen)',
                    }),
                    metaDescription: fields.text({
                        label: 'Meta-Beschreibung',
                        description: 'Beschreibung für Suchmaschinen (max. 160 Zeichen)',
                        multiline: true,
                    }),
                    canonicalUrl: fields.text({
                        label: 'Canonical URL',
                        description: 'Leer lassen = Standard-URL. Nur ändern wenn nötig (z.B. bei Duplikaten).',
                    }),
                }, {
                    label: '🔍 SEO-EINSTELLUNGEN',
                    description: 'Meta-Daten für Suchmaschinen',
                }),

                // ═══════════════════════════════════════════════════════════
                // ⚙️ SECTION: STRUCTURED DATA (Experten-Einstellungen)
                // ═══════════════════════════════════════════════════════════
                structuredDataSection: fields.object({
                    schemaType: fields.select({
                        label: 'Schema-Typ',
                        description: 'Welcher Unternehmenstyp soll in den Suchergebnissen erscheinen?',
                        options: [
                            { label: 'LocalBusiness (Lokales Geschäft mit Standort)', value: 'LocalBusiness' },
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
                            { label: 'Zürich', value: 'Zürich' },
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
                            { label: 'Graubünden', value: 'Graubünden' },
                        ],
                        defaultValue: ['Schweiz', 'Winterthur', 'Zürich', 'Schaffhausen', 'Thurgau', 'St. Gallen'],
                    }),
                    includeFaqSchema: fields.checkbox({
                        label: 'FAQ Schema generieren',
                        description: 'FAQs als Structured Data für Google-Suchergebnisse ausgeben?',
                        defaultValue: true,
                    }),
                }, {
                    label: '⚙️ STRUCTURED DATA (Experten)',
                    description: '⚠️ NUR FÜR ANWENDER MIT TECHNISCHEM KNOW-HOW! Fehlerhafte Einstellungen können das SEO-Ranking negativ beeinflussen.',
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
                openingHours: fields.text({ label: 'Öffnungszeiten', defaultValue: 'Mo-Fr 8:00-17:00' }),
            },
        }),

        // Header Navigation
        header: singleton({
            label: 'Header Navigation',
            path: 'content/settings/header',
            format: { data: 'json' },
            schema: {
                ctaLabel: fields.text({ label: 'CTA Button Text', defaultValue: 'Kostenloses Erstgespräch' }),
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
                tagline: fields.text({ label: 'Tagline', defaultValue: 'Digitale Lösungen. Echt. Einfach.' }),
                copyrightText: fields.text({ label: 'Copyright Text', defaultValue: '© {year} InfraOne IT Solutions GmbH' }),
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
                // ── GRUNDINFORMATIONEN ──────────────────────────
                slug: fields.text({ 
                    label: 'URL-Slug',
                    description: 'URL-freundlicher Name (z.B. "cybersecurity-tipps-kmu"). Kleinbuchstaben, keine Leerzeichen.',
                }),
                title: fields.text({ 
                    label: 'Artikel-Titel (H1)',
                    description: 'Hauptüberschrift des Artikels. Erscheint als H1 auf der Seite.',
                    validation: { isRequired: true },
                }),
                excerpt: fields.text({ 
                    label: 'Kurzbeschreibung',
                    description: 'Kurze Zusammenfassung (2-3 Sätze). Wird in der Blog-Übersicht angezeigt.',
                    multiline: true,
                    validation: { isRequired: true },
                }),

                // ── KATEGORISIERUNG ─────────────────────────────
                category: fields.select({
                    label: 'Wissenskategorie',
                    description: 'Themenbereich des Artikels.',
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
                keywords: fields.array(
                    fields.text({ label: 'Schlagwort' }),
                    {
                        label: 'Schlagwörter / Tags',
                        description: 'Relevante Begriffe für Suche und SEO.',
                        itemLabel: props => props.value || 'Neues Schlagwort',
                    }
                ),

                // ── TITELBILD ───────────────────────────────────
                featuredImage: fields.image({
                    label: 'Titelbild',
                    description: 'Wird unter der Überschrift angezeigt. Empfohlene Grösse: 1200x630px (21:9 Format).',
                    directory: 'public/images/blog',
                    publicPath: '/images/blog/',
                }),

                // ── VERÖFFENTLICHUNG ────────────────────────────
                publishDate: fields.date({ 
                    label: 'Veröffentlichungsdatum',
                    description: 'Artikel werden nach Datum sortiert (neueste zuerst).',
                    defaultValue: { kind: 'today' },
                }),
                readingTime: fields.text({ 
                    label: 'Lesezeit',
                    description: 'z.B. "5 Min."',
                    defaultValue: '5 Min.',
                }),

                // ── ARTIKELINHALT (Rich-Text-Editor) ────────────
                content: fields.markdoc({
                    label: 'Artikelinhalt',
                    description: 'Nutzen Sie die Toolbar oben für Formatierungen.',
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

                // ── SEO-EINSTELLUNGEN ───────────────────────────
                metaTitle: fields.text({ 
                    label: '🔍 SEO: Meta-Titel',
                    description: 'Titel für Suchmaschinen (max. 60 Zeichen). Leer = Artikel-Titel.',
                }),
                metaDescription: fields.text({ 
                    label: '🔍 SEO: Meta-Beschreibung',
                    description: 'Beschreibung für Suchmaschinen (max. 160 Zeichen). Leer = Kurzbeschreibung.',
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
                service: fields.text({ label: 'Zugehöriger Service' }),
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
                    description: 'Die vollständige Anleitung.',
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
    },
});
