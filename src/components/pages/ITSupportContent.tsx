'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, Clock, CheckCircle, ArrowRight, Monitor, Headphones, Shield, Zap, ChevronDown, Users, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

// IT-Support specific services
const services = [
    { icon: <Monitor className="w-6 h-6" />, title: 'PC & Laptop Support', desc: 'Windows, Mac, Hardware-Probleme' },
    { icon: <Shield className="w-6 h-6" />, title: 'Netzwerk & Server', desc: 'Einrichtung, Wartung, Troubleshooting' },
    { icon: <Headphones className="w-6 h-6" />, title: 'Remote-Support', desc: 'Schnelle Hilfe via Fernzugriff' },
    { icon: <Wrench className="w-6 h-6" />, title: 'Microsoft 365', desc: 'Einrichtung, Migration, Support' },
];

// General FAQs
const faqs = [
    { question: 'Wie schnell können Sie helfen?', answer: 'Remote-Support ist meist innert 15 Minuten verfügbar. Bei Vor-Ort-Einsätzen je nach Region und Verfügbarkeit oft innerhalb weniger Stunden.' },
    { question: 'Was kostet der IT-Support?', answer: 'Remote-Support: ab CHF 130/h (Min. 15 Min.). Vor-Ort-Support: ab CHF 145/h (Min. 30 Min.). Zuschläge für Abend-/Wochenend-/Feiertagseinsätze.' },
    { question: 'Betreuen Sie auch Privatpersonen?', answer: 'Ja! Wir helfen sowohl KMU als auch Privatpersonen bei allen IT-Problemen – vom langsamen PC bis zum Virenbefall.' },
    { question: 'Wie läuft Remote-Support ab?', answer: 'Sie erhalten von uns einen sicheren Zugangslink. Nach Ihrer Freigabe können wir direkt an Ihrem Gerät arbeiten – meist ist das Problem innert Minuten gelöst.' },
];

// Regional content interface
interface RegionalData {
    headline: string;
    subheadline: string;
    description: string;
    intro: string;
    localBenefits: string[];
    stats: { label: string; value: string }[];
    localFaq: { question: string; answer: string };
    anfahrt: string;
    regionalImage: string;
    // Enhanced regional content
    additionalFaqs?: { question: string; answer: string }[];
    localIndustries?: { name: string; need: string }[];
}

// Unique regional content for IT-Support
const regionalContent: Record<string, RegionalData> = {
    default: {
        headline: 'IT-Support Schweiz',
        subheadline: 'Kompetente IT-Hilfe für KMU und Privatpersonen',
        description: 'Schnelle Problemlösung, faire Preise, persönlicher Service. Remote-Support innert Minuten oder Vor-Ort-Einsatz bei Ihnen.',
        intro: 'In der Schweiz sind über 600\'000 KMU auf funktionierende IT angewiesen. Wenn der Computer streikt oder das Netzwerk ausfällt, brauchen Sie schnelle und kompetente Hilfe. Genau das bieten wir: IT-Support, der Probleme löst statt neue zu schaffen. Unser Team aus erfahrenen Technikern betreut Unternehmen und Privatpersonen in der gesamten Deutschschweiz. Ob Windows oder Mac, Netzwerk oder Cloud – wir sprechen Ihre Sprache und finden die Lösung.',
        localBenefits: ['Schnelle Reaktionszeit', 'Faire Stundenpreise', 'Remote & Vor-Ort', 'KMU & Privat'],
        stats: [{ label: 'Gelöste Tickets/Jahr', value: '2\'000+' }, { label: 'Kundenzufriedenheit', value: '98%' }],
        localFaq: { question: 'In welchen Regionen bieten Sie Vor-Ort-Support an?', answer: 'Wir betreuen primär die Regionen Zürich, Winterthur, Schaffhausen, Thurgau und St. Gallen. Remote-Support ist schweizweit verfügbar.' },
        anfahrt: 'Je nach Region',
        regionalImage: '/images/hero_it_network_1768423176860.png',
    },
    winterthur: {
        headline: 'IT-Support Winterthur',
        subheadline: 'Ihr lokaler IT-Partner in der Eulachstadt',
        description: 'Hauptstandort Winterthur: Keine Anfahrtskosten, schnelle Vor-Ort-Einsätze, Remote-Support innert Minuten. Für Geschäft und Privat.',
        intro: 'Als Winterthurer IT-Dienstleister sind wir dort, wo Sie uns brauchen – schnell und unkompliziert. Vom Technopark über die Altstadt bis nach Töss: Winterthur ist unser Zuhause. Wenn Ihr Computer in der Marktgasse streikt oder das Netzwerk im Industriequartier Grüze ausfällt, sind wir in kurzer Zeit bei Ihnen. Kein langes Warten, keine überrissenen Anfahrtskosten. Von der Arztpraxis in Seen bis zum Handwerksbetrieb in Wülflingen – wir kennen die lokale Wirtschaft und ihre IT-Anforderungen. Viele unserer Kunden betreuen wir seit Jahren, weil sie wissen: Wenn es brennt, sind wir da.',
        localBenefits: ['Hauptstandort – keine Anfahrt', 'Vor-Ort in 30 Minuten möglich', 'Lokale Ansprechpartner', 'Über 200 Winterthurer Kunden'],
        stats: [{ label: 'Winterthurer Kunden', value: '200+' }, { label: 'Ø Anfahrt', value: '< 30 Min' }],
        localFaq: { question: 'Wie schnell können Sie in Winterthur vor Ort sein?', answer: 'Da unser Büro in der Winterthurer Altstadt liegt, sind wir bei dringenden Fällen oft in unter 30 Minuten bei Ihnen. Keine Anfahrtskosten im gesamten Stadtgebiet.' },
        anfahrt: 'Keine Anfahrtskosten',
        regionalImage: '/images/regions/winterthur.png',
        localIndustries: [
            { name: 'Arztpraxen', need: 'Sichere Patientendaten, schnelle Hilfe bei Ausfällen, HIN-Mail' },
            { name: 'Handwerk & Gewerbe', need: 'Robuste Hardware, einfache Bedienung, Backup-Lösungen' },
            { name: 'Dienstleister', need: 'Microsoft 365, Cloud-Speicher, Remote-Work-Setup' },
        ],
        additionalFaqs: [
            { question: 'Können Sie auch defekte Hardware reparieren?', answer: 'Ja, in unserer Werkstatt in Winterthur reparieren wir PCs und Laptops. Sie können das Gerät direkt bei uns vorbeibringen.' },
            { question: 'Bieten Sie auch Support für Apple/Mac?', answer: 'Ja, wir sind spezialisiert auf Windows und macOS. Viele unserer Kunden nutzen eine gemischte Umgebung.' },
        ],
    },
    zuerich: {
        headline: 'IT-Support Zürich',
        subheadline: 'Professionelle IT-Hilfe für die Wirtschaftsmetropole',
        description: 'Schneller IT-Support für Zürcher KMU und Privatpersonen. Remote-Hilfe sofort, Vor-Ort-Einsätze mit kurzer Anfahrt von Winterthur.',
        intro: 'Zürich ist das wirtschaftliche Herz der Schweiz – und hier darf die IT nicht stillstehen. Von Startups an der Europaallee über Kanzleien am Paradeplatz bis zu Arztpraxen in Oerlikon: Wir verstehen die Anforderungen der Zürcher Wirtschaft. Wenn Excel abstürzt bevor der wichtige Report fertig ist, das VPN zum Homeoffice nicht funktioniert oder der Server mitten im Tagesgeschäft ausfällt – dann zählt jede Minute. Von unserem Standort in Winterthur sind wir in 25 Minuten in der Zürcher Innenstadt. Remote-Support starten wir oft schon während Sie noch am Telefon sind.',
        localBenefits: ['25 Min Anfahrt ab Winterthur', 'Erfahrung mit Zürcher KMU', 'Alle Branchen', 'Sofort-Hilfe via Remote'],
        stats: [{ label: 'Zürcher Kunden', value: '80+' }, { label: 'Tickets/Jahr Zürich', value: '500+' }],
        localFaq: { question: 'Fallen in Zürich Anfahrtskosten an?', answer: 'Ja, für Vor-Ort-Einsätze in Zürich berechnen wir eine Anfahrtspauschale von CHF 40.–. Bei längeren Einsätzen oder Wartungsverträgen entfällt diese oft.' },
        anfahrt: 'CHF 40.– Pauschale',
        regionalImage: '/images/regions/zuerich.png',
        localIndustries: [
            { name: 'Kanzleien & Beratung', need: 'Vertraulichkeit, Dokumentenmanagement, sichere E-Mail' },
            { name: 'Startups', need: 'Skalierbare Cloud-Lösungen, flexible Arbeitsplätze, SaaS-Management' },
            { name: 'Privatpersonen', need: 'WLAN-Optimierung, Drucker-Probleme, Virenschutz' },
        ],
        additionalFaqs: [
            { question: 'Arbeiten Sie auch im Zentrum (Kreis 1)?', answer: 'Ja, wir betreuen mehrere Kunden in der Innenstadt. Dank guter ÖV-Anbindung sind wir auch ohne Parkplatzsuche schnell vor Ort.' },
            { question: 'Können Sie unser Büro komplett vernetzen?', answer: 'Ja, wir übernehmen die komplette Netzwerkplanung: WLAN, Firewall, Server und Arbeitsplätze. Alles aus einer Hand.' },
        ],
    },
    schaffhausen: {
        headline: 'IT-Support Schaffhausen',
        subheadline: 'Lokaler IT-Service für die Munot-Stadt',
        description: 'IT-Support Schaffhausen: Mit Büro vor Ort bieten wir schnelle Hilfe für Schaffhauser Unternehmen und Privatpersonen.',
        intro: 'Schaffhausen ist geprägt von traditionsreichen Industrieunternehmen und einem aktiven Gewerbe. Von der Metallverarbeitung in Neuhausen bis zu Handwerksbetrieben in der Altstadt – überall ist zuverlässige IT unverzichtbar. Unser Standort in Schaffhausen ermöglicht uns, lokale Kunden persönlich und schnell zu betreuen. Wenn die CNC-Maschine nicht mehr mit dem Computer kommuniziert, das Kassensystem im Laden ausfällt oder einfach der PC nicht mehr startet – rufen Sie uns an. Wir sprechen Schaffhuuser Dialäkt und verstehen die Bedürfnisse der lokalen Wirtschaft.',
        localBenefits: ['Standort in Schaffhausen', 'Keine Anfahrtskosten', 'Industrie-Erfahrung', 'Schnelle Reaktion'],
        stats: [{ label: 'Schaffhauser Kunden', value: '50+' }, { label: 'Jahre Erfahrung', value: '10+' }],
        localFaq: { question: 'Betreuen Sie auch Industrieunternehmen?', answer: 'Ja, wir haben langjährige Erfahrung mit Industrie-IT: Vernetzung von Maschinensteuerungen, OT-Security, und klassische Office-IT. Wir verstehen beide Welten.' },
        anfahrt: 'Keine Anfahrtskosten',
        regionalImage: '/images/regions/schaffhausen.png',
        localIndustries: [
            { name: 'Industrie & Fertigung', need: 'Robuste IT in Werkhallen, Anbindung Maschinen, Ausfallsicherheit' },
            { name: 'Logistik', need: 'Scanner-Lösungen, Etikettendrucker, stabiles WLAN im Lager' },
            { name: 'Gewerbe', need: 'Kassensysteme, E-Mail-Archivierung, zuverlässige Backups' },
        ],
        additionalFaqs: [
            { question: 'Haben Sie Erfahrung mit ERP-Systemen?', answer: 'Wir arbeiten eng mit ERP-Herstellern zusammen und stellen die technische Basis (Server, Netzwerk) sicher, damit Ihre Software reibungslos läuft.' },
            { question: 'Bieten Sie auch am Wochenende Support?', answer: 'Für Vertragskunden mit SLA bieten wir auch erweiterten Support am Wochenende an.' },
        ],
    },
    thurgau: {
        headline: 'IT-Support Thurgau',
        subheadline: 'IT-Hilfe für den Bodensee-Kanton',
        description: 'IT-Support im Thurgau: Schneller Service in Frauenfeld, Kreuzlingen, Weinfelden und der gesamten Region.',
        intro: 'Der Thurgau verbindet ländliche Idylle mit lebhafter Wirtschaft. Von der Landmaschinen-Werkstatt in Münchwilen über Hotels am Bodensee bis zu IT-Unternehmen in Arbon – überall ist funktionierende IT geschäftskritisch. Wir kennen den Thurgau und seine Unternehmer. Hier ist man bodenständig und erwartet Lösungen statt leerer Versprechen. Genau das liefern wir. Ob Ihr Drucker in Frauenfeld streikt, das WLAN im Hotel in Kreuzlingen langsam ist oder der Server in Weinfelden Probleme macht – wir sind in überschaubarer Zeit bei Ihnen. Und wenn es schnell gehen muss: Remote-Support startet innert Minuten.',
        localBenefits: ['Kurze Anfahrt von Winterthur', 'Kenntnis der Region', 'Tourismus-Erfahrung', 'Landwirtschafts-IT'],
        stats: [{ label: 'Thurgauer Kunden', value: '70+' }, { label: 'Ø Reaktionszeit', value: '< 2h' }],
        localFaq: { question: 'Wie schnell sind Sie im Thurgau vor Ort?', answer: 'Je nach Standort zwischen 20 Minuten (Frauenfeld) und 45 Minuten (Kreuzlingen). Bei dringenden Fällen priorisieren wir entsprechend.' },
        anfahrt: 'CHF 20-40.– je nach Ort',
        regionalImage: '/images/regions/thurgau.png',
        localIndustries: [
            { name: 'Gastronomie & Hotels', need: 'Gäste-WLAN, Kassensysteme, Reservations-Software' },
            { name: 'Landwirtschaft', need: 'Hof-PC, Herdenmanagement-Software, Überwachungskameras' },
            { name: 'Produktion', need: 'Ausfallsichere Server, Zeiterfassung, Lagerverwaltung' },
        ],
        additionalFaqs: [
            { question: 'Können Sie auch bei schlechtem Internet auf dem Land helfen?', answer: 'Ja, wir haben Erfahrung mit LTE/5G-Lösungen oder Richtfunk, um auch abgelegene Höfe oder Betriebe schnell ans Internet anzubinden.' },
            { question: 'Verkaufen Sie auch Computer und Drucker?', answer: 'Ja, wir beraten Sie herstellerunabhängig und beschaffen die passende Hardware zu fairen Preisen, inklusive Installation vor Ort.' },
        ],
    },
    'st-gallen': {
        headline: 'IT-Support St. Gallen',
        subheadline: 'IT-Expertise für die Ostschweizer Metropole',
        description: 'IT-Support St. Gallen: Professionelle Hilfe für Unternehmen und Private in der Universitätsstadt und Umgebung.',
        intro: 'St. Gallen ist das wirtschaftliche Zentrum der Ostschweiz. Hier treffen sich Tradition und Innovation: Von Stickerei-Unternehmen mit digitaler Produktion über Beratungsfirmen mit HSG-Absolventen bis zu modernen Startups im Neubad. Alle haben eines gemeinsam: Sie brauchen IT, die funktioniert. Von unserem Standort in Winterthur sind wir in gut 30 Minuten in St. Gallen. Das ist näher als mancher IT-Dienstleister aus Zürich. Wir verstehen die Ostschweizer Mentalität: gradlinig, qualitätsbewusst, keine Schnörkel. Genau so arbeiten wir auch.',
        localBenefits: ['35 Min ab Winterthur', 'Ostschweizer Verständnis', 'HSG-Startup-Erfahrung', 'Industrie & Dienstleistung'],
        stats: [{ label: 'Ostschweizer Kunden', value: '45+' }, { label: 'Anfahrt St. Gallen', value: '35 Min' }],
        localFaq: { question: 'Haben Sie Erfahrung mit Unternehmen aus dem HSG-Umfeld?', answer: 'Ja, wir betreuen mehrere Beratungsunternehmen und Startups, die aus dem HSG-Umfeld entstanden sind. Schnelle Skalierung und moderne Cloud-Lösungen sind unser Metier.' },
        anfahrt: 'CHF 50.– Pauschale',
        regionalImage: '/images/regions/st-gallen.png',
        localIndustries: [
            { name: 'Startups', need: 'MacBook-Support, Cloud-Only, Microsoft 365, Teams' },
            { name: 'Bildung', need: 'Schul-IT, iPad-Klassen, sicheres WLAN für Studenten' },
            { name: 'Textil & Design', need: 'Grosse Datenmengen, Backups, Adobe Creative Cloud Support' },
        ],
        additionalFaqs: [
            { question: 'Bieten Sie auch regelmässige Wartung an?', answer: 'Ja, mit unseren Managed Services überwachen wir Ihre Systeme proaktiv. Wir beheben Probleme oft, bevor Sie sie bemerken.' },
            { question: 'Können Sie uns beim Umzug helfen?', answer: 'Gerne. Wir übernehmen den Abbau der IT am alten Standort und den fachgerechten Aufbau und Test am neuen Ort in St. Gallen.' },
        ],
    },
    andelfingen: {
        headline: 'IT-Support Andelfingen',
        subheadline: 'IT-Hilfe im Zürcher Weinland',
        description: 'IT-Support für Andelfingen und das Weinland: Persönlicher Service für KMU, Landwirtschaftsbetriebe und Privatpersonen.',
        intro: 'Das Zürcher Weinland rund um Andelfingen ist geprägt von Landwirtschaft, Weinbau und einem aktiven Gewerbe. Hier kennt man sich noch persönlich, und so arbeiten auch wir. Wenn der Computer im Weingut nicht mehr will, die Buchhaltungssoftware beim Treuhänder hakt oder der Drucker im Dorfladen streikt – wir kommen vorbei. Von Winterthur aus sind wir in etwa 20 Minuten in Andelfingen. Keine anonyme Hotline, sondern persönlicher Service von Menschen, die Sie kennen. Das Weinland verdient IT-Support, der so bodenständig ist wie die Region selbst.',
        localBenefits: ['20 Min ab Winterthur', 'Persönlicher Service', 'Landwirtschafts-Know-how', 'Faire Konditionen'],
        stats: [{ label: 'Weinland-Kunden', value: '25+' }, { label: 'Weiterempfehlung', value: '100%' }],
        localFaq: { question: 'Verstehen Sie die Bedürfnisse von Landwirtschaftsbetrieben?', answer: 'Ja, wir betreuen mehrere Bauern- und Weinbaubetriebe im Weinland. Von der Anbindung von Melkrobotern bis zur Buchhaltungssoftware – wir kennen die Anforderungen.' },
        anfahrt: 'Keine Anfahrtskosten',
        regionalImage: '/images/regions/andelfingen.png',
        localIndustries: [
            { name: 'Landwirtschaft & Weinbau', need: 'Robuste PCs, Hof-Verwaltung, Etikettendruck' },
            { name: 'Lokales Gewerbe', need: 'Kassen-PCs, Rechnungswesen, Datensicherung' },
            { name: 'Privathaushalte', need: 'Internet einrichten, Drucker, Smartphone-Hilfe' },
        ],
        additionalFaqs: [
            { question: 'Kommen Sie auch für kleine Probleme vorbei?', answer: 'Ja, wir helfen auch, wenn "nur" der Drucker klemmt oder das Internet langsam ist. Im Weinland berechnen wir keine Anfahrt.' },
            { question: 'Können Sie alte Computer wieder schneller machen?', answer: 'Oft ja. Mit einer SSD-Aufrüstung bringen wir ältere PCs und Laptops wieder auf Trab – eine kostengünstige Alternative zum Neukauf.' },
        ],
    },
};

interface ITSupportContentProps {
    regionSlug?: string;
}

export function ITSupportContent({ regionSlug }: ITSupportContentProps) {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const content = regionalContent[regionSlug || 'default'] || regionalContent.default;

    const regions = [
        { name: 'Winterthur', href: '/it-support/winterthur' },
        { name: 'Zürich', href: '/it-support/zuerich' },
        { name: 'Schaffhausen', href: '/it-support/schaffhausen' },
        { name: 'Thurgau', href: '/it-support/thurgau' },
        { name: 'St. Gallen', href: '/it-support/st-gallen' },
        { name: 'Andelfingen', href: '/it-support/andelfingen' },
    ].filter(r => r.href !== `/it-support/${regionSlug}`);

    return (
        <>
            {/* Hero */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <Image src="/images/hero_it_network_1768423176860.png" alt="" fill className="object-cover" priority />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="max-w-xl">
                            <AnimatedSection animation="slideUp">
                                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-4">
                                    <MapPin className="w-4 h-4" />
                                    <span className="uppercase tracking-wider">{regionSlug ? content.headline.replace('IT-Support ', '') : 'Schweiz'}</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                                    <span className="gradient-text">{content.headline}</span>
                                </h1>
                                <p className="text-xl md:text-2xl text-primary font-medium mb-4">{content.subheadline}</p>
                                <p className="text-lg text-text-secondary max-w-2xl mb-8">{content.description}</p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button variant="primary" size="lg" asChild>
                                        <Link href="/kontakt">
                                            Jetzt Anfrage stellen
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild>
                                        <a href="tel:+41522221818">
                                            <Phone className="w-5 h-5" />
                                            052 222 18 18
                                        </a>
                                    </Button>
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* Regional Image on the right */}
                        <AnimatedSection animation="slideUp" delay={0.2} className="hidden lg:block">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border">
                                <Image
                                    src={content.regionalImage}
                                    alt={content.headline}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Regional Intro - Unique per Region */}
            <section className="py-12 lg:py-16 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp">
                        <p className="text-lg text-text-secondary leading-relaxed mb-8">{content.intro}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Benefits */}
                            <div className="p-6 rounded-2xl bg-card border border-border">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Vorteile {regionSlug ? `in ${content.headline.replace('IT-Support ', '')}` : ''}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {content.localBenefits.map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                            <span className="text-base text-text-secondary">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="p-6 rounded-2xl bg-primary/5 border border-primary">
                                <h3 className="text-lg font-bold text-text-primary mb-4">In Zahlen</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {content.stats.map((stat, i) => (
                                        <div key={i} className="text-center">
                                            <div className="text-2xl font-bold text-primary">{stat.value}</div>
                                            <div className="text-sm text-text-secondary">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                                {regionSlug && (
                                    <div className="mt-4 pt-4 border-t border-primary/20 text-center">
                                        <div className="text-sm text-text-secondary">Anfahrtskosten</div>
                                        <div className="font-bold text-primary">{content.anfahrt}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Services */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Unsere IT-Support Leistungen</h2>
                        <p className="text-text-secondary">Kompetente Hilfe bei allen IT-Problemen</p>
                    </AnimatedSection>

                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
                        {services.map((service, index) => (
                            <StaggerItem key={index}>
                                <div className="h-full p-6 rounded-2xl bg-card border border-border text-center">
                                    <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                        {service.icon}
                                    </div>
                                    <h3 className="text-base font-bold text-text-primary mb-2">{service.title}</h3>
                                    <p className="text-base text-text-secondary">{service.desc}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-16 lg:py-24 bg-background" id="preise">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            {regionSlug ? `Unsere Preise für ${content.headline.replace('IT-Support ', '')}` : 'IT-Support Preise'}
                        </h2>
                        <p className="text-text-secondary">Transparente Preise ohne versteckte Kosten. Abrechnung im 15-Minuten-Takt.</p>
                    </AnimatedSection>

                    <div>
                        {/* Preis-Karten */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-card border border-border text-center">
                                <Monitor className="w-8 h-8 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-text-primary mb-2">Remote-Support</h3>
                                <p className="text-3xl font-bold text-primary mb-2">ab CHF 130.–/h</p>
                                <p className="text-sm text-text-secondary">Schnellste Lösung – meist innert 15 Minuten</p>
                                <p className="text-xs text-text-secondary mt-2">Mindestverrechnung: 15 Minuten</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-primary/5 border border-primary text-center">
                                <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-text-primary mb-2">
                                    {regionSlug ? `Vor-Ort in ${content.headline.replace('IT-Support ', '')}` : 'Vor-Ort-Support'}
                                </h3>
                                <p className="text-3xl font-bold text-primary mb-2">ab CHF 145.–/h</p>
                                <p className="text-sm text-primary">Persönlich bei Ihnen</p>
                                {regionSlug && <p className="text-xs text-primary mt-2">{content.anfahrt}</p>}
                                <p className="text-xs text-text-secondary mt-1">Mindestverrechnung: 30 Minuten</p>
                            </motion.div>
                        </div>

                        {/* Supportzeiten */}
                        <div className="bg-card border border-border rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Supportzeiten & Zuschläge</h3>
                            <ul className="space-y-2 text-base">
                                <li className="flex items-center justify-between p-2 rounded bg-background">
                                    <span className="text-text-secondary">Mo–Fr 08:00–17:00</span>
                                    <span className="font-medium text-text-primary">Normaltarif</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded bg-yellow-50 dark:bg-yellow-900/20">
                                    <span className="text-text-secondary">Mo–Fr 17:00–23:00</span>
                                    <span className="font-medium text-yellow-700 dark:text-yellow-400">+25% Zuschlag</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded bg-orange-50 dark:bg-orange-900/20">
                                    <span className="text-text-secondary">Sa / So / Feiertage</span>
                                    <span className="font-medium text-orange-700 dark:text-orange-400">+50% Zuschlag</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-900/20">
                                    <span className="text-text-secondary">23:00–08:00</span>
                                    <span className="font-medium text-red-700 dark:text-red-400">nur mit SLA, +100%</span>
                                </li>
                            </ul>
                            <p className="text-sm text-text-secondary mt-4 leading-relaxed">
                                Support bis 23:00 Uhr sowie an Wochenenden und Feiertagen ist verfügbar (mit Zuschlag, Best-Effort). 
                                Ohne aktives SLA sind Einsätze zwischen 23:00 und 08:00 Uhr ausgeschlossen.
                            </p>
                        </div>

                        {/* Notfall-Kontakt */}
                        <div className="bg-primary text-white rounded-xl p-6 text-center">
                            <p className="font-bold mb-2">IT-Notfall? Sofort erreichbar bis 23:00 Uhr</p>
                            <a href="tel:+41765875055" className="text-2xl font-black block mb-3 hover:underline">076 587 50 55</a>
                            <div className="flex gap-3 justify-center">
                                <Button variant="secondary" size="sm" className="bg-white text-primary hover:bg-white/90" asChild>
                                    <a href="tel:+41765875055"><Phone className="w-4 h-4" />Anrufen</a>
                                </Button>
                                <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                                    <a href="https://wa.me/41765875055" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                                </Button>
                            </div>
                        </div>

                        {/* Link zur Hauptseite */}
                        {regionSlug && (
                            <div className="text-center mt-6">
                                <Link href="/it-support#preise" className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1">
                                    <ArrowRight className="w-4 h-4" />
                                    Alle Leistungen & Details auf der IT-Support Hauptseite
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* FAQs */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Häufige Fragen</h2>
                    </AnimatedSection>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="rounded-xl border border-border bg-card overflow-hidden">
                                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full flex items-center justify-between p-4 text-left">
                                    <span className="font-medium text-text-primary">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                                </button>
                                {openFaq === index && <div className="px-4 pb-4"><p className="text-text-secondary">{faq.answer}</p></div>}
                            </div>
                        ))}

                        {/* Local FAQ */}
                        <div className="rounded-xl border-2 border-primary bg-primary/5 overflow-hidden">
                            <button onClick={() => setOpenFaq(openFaq === 99 ? null : 99)} className="w-full flex items-center justify-between p-4 text-left">
                                <span className="font-medium text-text-primary">{content.localFaq.question}</span>
                                <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openFaq === 99 ? 'rotate-180' : ''}`} />
                            </button>
                            {openFaq === 99 && <div className="px-4 pb-4"><p className="text-text-secondary">{content.localFaq.answer}</p></div>}
                        </div>

                        {/* Additional Regional FAQs */}
                        {content.additionalFaqs && content.additionalFaqs.map((faq, index) => (
                            <div key={`add-${index}`} className="rounded-xl border border-border bg-card overflow-hidden">
                                <button onClick={() => setOpenFaq(openFaq === (100 + index) ? null : (100 + index))} className="w-full flex items-center justify-between p-4 text-left">
                                    <span className="font-medium text-text-primary">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openFaq === (100 + index) ? 'rotate-180' : ''}`} />
                                </button>
                                {openFaq === (100 + index) && <div className="px-4 pb-4"><p className="text-text-secondary">{faq.answer}</p></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Regional Industries - Only on Regional Pages */}
            {regionSlug && content.localIndustries && (
                <section className="py-12 lg:py-16 bg-background border-t border-border">
                    <div className="container mx-auto px-4">
                        <AnimatedSection animation="slideUp" className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                                IT-Lösungen für {content.headline.replace('IT-Support ', '')}
                            </h2>
                            <p className="text-text-secondary max-w-2xl mx-auto">
                                Wir kennen die spezifischen Anforderungen lokaler Branchen.
                            </p>
                        </AnimatedSection>
                        <div className="grid md:grid-cols-3 gap-6">
                            {content.localIndustries.map((industry, index) => (
                                <div key={index} className="p-6 rounded-2xl bg-surface border border-border">
                                    <h3 className="text-base font-bold text-text-primary mb-2">{industry.name}</h3>
                                    <p className="text-base text-text-secondary">{industry.need}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Regional Links */}
            <section className="py-12 lg:py-16 bg-background">
                <div className="container mx-auto px-4">
                    <h3 className="text-center text-xl font-bold text-text-primary mb-6">IT-Support in weiteren Regionen</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {regions.map((r, index) => (
                            <Link key={index} href={r.href} className="px-5 py-2.5 rounded-lg bg-card border border-border hover:border-primary hover:text-primary transition-colors text-base font-medium text-text-secondary">
                                {r.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">IT-Probleme? Wir helfen!</h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">Rufen Sie uns an oder schreiben Sie uns – wir melden uns schnellstmöglich.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                            <Link href="/kontakt">
                                Anfrage stellen
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                            <a href="tel:+41522221818">
                                <Phone className="w-5 h-5" />
                                052 222 18 18
                            </a>
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
