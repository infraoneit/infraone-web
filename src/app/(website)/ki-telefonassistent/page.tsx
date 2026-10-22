import { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    Briefcase,
    Building2,
    Car,
    ClipboardList,
    Globe,
    MessageSquareText,
    Phone,
    PhoneForwarded,
    PhoneIncoming,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    UtensilsCrossed,
    Zap,
} from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { FAQList } from '@/components/ui/FAQList';
import { KiDemo } from '@/components/tools/KiDemo';
import {
    generateBreadcrumbListSchema,
    generateFAQSchema,
    generateKiTelefonassistentServiceSchema,
    generateWebPageSchema,
} from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

// Texte wortgleich aus AUFTRAG-092 (Lektor: Claude) — nicht umformulieren.
const TITEL = 'KI-Telefonassistent auf Schweizerdeutsch – Demo-Anruf in einer Minute | InfraOne';
const BESCHREIBUNG =
    'Der KI-Telefonassistent, der Schweizerdeutsch spricht: Website eingeben, Assistent entsteht, die KI ruft Sie an. Kostenlos testen, ohne Anmeldung. Für Praxen, Handwerk, KMU in der Schweiz.';
const URL_SEITE = `${BASE_URL}/ki-telefonassistent`;
const OG_BILD = '/og/ki-telefonassistent.png';

export const metadata: Metadata = {
    title: { absolute: TITEL },
    description: BESCHREIBUNG,
    keywords: ['KI-Telefonassistent', 'KI Telefonassistent Schweizerdeutsch', 'Voicebot Schweiz', 'Telefonassistent KMU', 'KI Anrufbeantworter'],
    alternates: {
        canonical: URL_SEITE,
        languages: { 'de-CH': URL_SEITE },
    },
    openGraph: {
        type: 'website',
        locale: 'de_CH',
        url: URL_SEITE,
        siteName: 'InfraOne IT Solutions',
        title: TITEL,
        description: BESCHREIBUNG,
        images: [{ url: OG_BILD, width: 1200, height: 630, alt: 'KI-Telefonassistent auf Schweizerdeutsch – InfraOne' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: TITEL,
        description: BESCHREIBUNG,
        images: [OG_BILD],
    },
};

const schritte = [
    {
        icon: Globe,
        titel: '1. Website eingeben',
        text: 'Wir lesen Ihre öffentliche Website: Leistungen, Kontakt, Öffnungszeiten, Logo und Farben.',
    },
    {
        icon: Sparkles,
        titel: '2. Assistent entsteht',
        text: 'In Sekunden steht ein Assistent mit Ihrem Namen, Ihrem Auftritt und einem Wissen aus Ihrer Website.',
    },
    {
        icon: PhoneIncoming,
        titel: '3. Die KI ruft Sie an',
        text: 'Sie hören, wie Ihr Assistent Anrufer begrüsst, Fragen beantwortet und Anliegen aufnimmt – auf Schweizerdeutsch.',
    },
];

const alltag = [
    {
        icon: Phone,
        titel: 'Anrufe entgegennehmen – rund um die Uhr',
        text: 'Der Assistent nimmt ab, wenn Ihr Team im Gespräch, unterwegs oder nicht im Büro ist – auch abends und am Wochenende.',
    },
    {
        icon: MessageSquareText,
        titel: 'Fragen beantworten – aus Ihrem Wissen, nie erfunden',
        text: 'Er beantwortet Fragen zu Leistungen, Öffnungszeiten und Abläufen mit den Angaben, die Sie ihm mitgeben.',
    },
    {
        icon: ClipboardList,
        titel: 'Anliegen aufnehmen – mit Rückruf-Notiz per E-Mail',
        text: 'Er hält Name, Nummer und Anliegen fest und schickt Ihnen nach dem Gespräch eine Notiz per E-Mail.',
    },
    {
        icon: PhoneForwarded,
        titel: 'Weiterverbinden – an die richtige Person, wenn sie frei ist',
        text: 'Er verbindet Anrufer mit Mitarbeitenden oder definierten Nummern und prüft vorher, wer gerade erreichbar ist.',
    },
];

const betriebe = [
    {
        icon: Stethoscope,
        titel: 'Praxen (Arzt, Zahnarzt, Physio)',
        text: 'Er nimmt Terminwünsche auf, beantwortet Fragen zu Öffnungszeiten und Anfahrt und entlastet den Empfang während der Behandlungen.',
    },
    {
        icon: Zap,
        titel: 'Handwerk und Elektro',
        text: 'Er nimmt Aufträge und Störungsmeldungen entgegen, während das Team auf der Baustelle ist, und gibt Dringendes weiter.',
    },
    {
        icon: Car,
        titel: 'Garagen',
        text: 'Er nimmt Servicetermine und Reifenwechsel-Anfragen auf und gibt Auskunft zu Öffnungszeiten und Abholung.',
    },
    {
        icon: Briefcase,
        titel: 'Treuhand und Beratung',
        text: 'Er beantwortet allgemeine Fragen, nimmt Rückrufwünsche auf und verbindet Mandanten mit der zuständigen Person.',
    },
    {
        icon: UtensilsCrossed,
        titel: 'Gastronomie',
        text: 'Er beantwortet Fragen zu Öffnungszeiten und Angebot und nimmt Reservationswünsche auf, auch wenn im Service viel los ist.',
    },
    {
        icon: Building2,
        titel: 'KMU mit Empfang',
        text: 'Er übernimmt, wenn der Empfang besetzt ist oder Pause macht, damit Anrufer trotzdem jemanden erreichen.',
    },
];

const faqs = [
    {
        question: 'Spricht der Assistent wirklich Schweizerdeutsch?',
        answer: 'Ja. Er versteht Mundart und antwortet auf Schweizerdeutsch. Im Testanruf hören Sie es selbst.',
    },
    {
        question: 'Was kostet der Testanruf?',
        answer: 'Nichts. Sie brauchen keine Anmeldung und keine Kreditkarte.',
    },
    {
        question: 'Woher weiss der Assistent etwas über meine Firma?',
        answer: 'Aus Ihrer öffentlichen Website. Im Kundenbetrieb pflegen wir Ihr Wissen gemeinsam mit Ihnen – aus Ihren Unterlagen, Preisen und Abläufen.',
    },
    {
        question: 'Kann er Anrufe weiterverbinden?',
        answer: 'Ja, an Mitarbeitende oder definierte Nummern, und er prüft vorher, wer gerade frei ist. Nimmt niemand ab, kommt der Anrufer zum Assistenten zurück.',
    },
    {
        question: 'Was passiert, wenn er etwas nicht weiss?',
        answer: 'Er sagt es offen, nimmt das Anliegen auf und organisiert einen Rückruf. Er erfindet keine Preise und keine Zusagen.',
    },
    {
        question: 'Brauche ich eine neue Telefonanlage?',
        answer: 'Nein. Der Assistent kann allein laufen oder als Baustein in unserer Cloud-Telefonanlage. Ihre Nummer behalten Sie.',
    },
    {
        question: 'Wie lange dauert die Einrichtung?',
        answer: 'Den Testassistenten haben Sie in einer Minute. Den Assistenten für Ihren Betrieb richten wir nach Ihren Vorgaben ein – Begrüssung, Fragen, Empfänger der Zusammenfassung.',
    },
    {
        question: 'Wo werden meine Daten verarbeitet?',
        answer: 'Anlage und Protokolle in der Schweiz bei InfraOne; die Sprach-KI über die Schnittstellen von OpenAI. Details in den Datenschutzhinweisen.',
    },
];

const sprachen = ['Schweizerdeutsch', 'Hochdeutsch', 'English'];

export default function KiTelefonassistentPage() {
    const serviceSchema = generateKiTelefonassistentServiceSchema(BESCHREIBUNG);
    const webPageSchema = generateWebPageSchema(URL_SEITE, 'KI-Telefonassistent auf Schweizerdeutsch', BESCHREIBUNG);
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` },
        { name: 'KI-Telefonassistent', url: URL_SEITE },
    ]);
    const faqSchema = generateFAQSchema(faqs);
    // Turnstile nur, wenn Site-Key UND Secret gesetzt sind (sonst aus)
    const turnstileSiteKey =
        process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET ? process.env.TURNSTILE_SITE_KEY : undefined;

    return (
        <>
            {[serviceSchema, webPageSchema, breadcrumbSchema, faqSchema].map((schema, i) => (
                <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            ))}

            {/* Hero mit Demo */}
            <section className="relative py-12 lg:py-20 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute -top-24 right-0 w-[36rem] h-[36rem] bg-primary/10 rounded-full blur-3xl" />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <KiDemo turnstileSiteKey={turnstileSiteKey}>
                        <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                            <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                            Der KI-Telefonassistent auf Schweizerdeutsch
                        </p>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-[1.08] tracking-tight mb-6">
                            Erleben Sie Ihren KI-Telefonassistenten – <span className="gradient-text">in einer Minute</span>
                        </h1>
                        <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl">
                            Geben Sie Ihre Website ein. Wir bauen daraus einen Assistenten mit Ihrem Namen, Ihrem Logo und Ihrem Wissen – und rufen Sie an. Er spricht Schweizerdeutsch, wenn Sie wollen auch Hochdeutsch oder Englisch.
                        </p>
                    </KiDemo>
                </div>
            </section>

            {/* 1. So funktioniert der Testanruf */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary">So funktioniert der Testanruf</h2>
                    </AnimatedSection>
                    <StaggerContainer className="grid md:grid-cols-3 gap-6" staggerDelay={0.1}>
                        {schritte.map((s) => (
                            <StaggerItem key={s.titel}>
                                <div className="h-full p-6 lg:p-8 rounded-2xl bg-card border border-border">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                                        <s.icon className="w-6 h-6" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">{s.titel}</h3>
                                    <p className="text-text-secondary leading-relaxed">{s.text}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* 2. Warum Schweizerdeutsch */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-12 gap-10 items-center">
                        <AnimatedSection animation="slideUp" className="lg:col-span-7">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">Warum Schweizerdeutsch den Unterschied macht</h2>
                            <p className="text-lg text-text-secondary leading-relaxed max-w-3xl">
                                Ihre Kunden rufen auf Mundart an. Ein Assistent, der mit Hochdeutsch antwortet, wirkt wie ein Callcenter im Ausland. Unser Assistent versteht Schweizerdeutsch und antwortet auf Schweizerdeutsch – natürlich, direkt und freundlich. Hochdeutsch und Englisch kann er ebenfalls, wenn Ihre Kundschaft das braucht.
                            </p>
                        </AnimatedSection>
                        <AnimatedSection animation="slideUp" delay={0.1} className="lg:col-span-5">
                            <div className="rounded-3xl border border-border bg-card p-6 lg:p-8">
                                <ul className="space-y-3">
                                    {sprachen.map((s, i) => (
                                        <li
                                            key={s}
                                            className={`flex items-center justify-between rounded-xl border px-5 py-4 text-lg font-semibold ${
                                                i === 0 ? 'border-primary bg-primary/10 text-text-primary' : 'border-border text-text-secondary'
                                            }`}
                                        >
                                            {s}
                                            <span
                                                className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary' : 'bg-border'}`}
                                                aria-hidden="true"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* 3. Was der Assistent im Alltag übernimmt */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Was der Assistent im Alltag übernimmt</h2>
                    </AnimatedSection>
                    <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.08}>
                        {alltag.map((k) => (
                            <StaggerItem key={k.titel}>
                                <div className="h-full p-6 rounded-2xl bg-card border border-border">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                        <k.icon className="w-6 h-6" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary mb-2">{k.titel}</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">{k.text}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* 4. Für welche Betriebe */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Für welche Betriebe</h2>
                    </AnimatedSection>
                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.06}>
                        {betriebe.map((b) => (
                            <StaggerItem key={b.titel}>
                                <div className="h-full flex gap-4 p-6 rounded-2xl bg-card border border-border">
                                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <b.icon className="w-5 h-5" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-primary mb-1.5">{b.titel}</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed">{b.text}</p>
                                    </div>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* 5. Datenschutz und Technik */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp">
                        <div className="rounded-3xl border border-border bg-card p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10">
                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-5">Datenschutz und Technik, ehrlich erklärt</h2>
                                <p className="text-lg text-text-secondary leading-relaxed max-w-3xl">
                                    Die Telefonanlage und Ihre Gesprächsprotokolle laufen in der Schweiz auf Systemen von InfraOne. Für Spracherkennung und Sprachausgabe nutzen wir die KI-Schnittstellen von OpenAI; Gesprächsinhalte werden dort nicht zum Training verwendet. Ihre Nummer aus dem Testanruf verwenden wir für diesen Anruf und für eine Rückmeldung von uns, falls Sie Fragen haben – nicht für Werbung. Mitschnitte gibt es im Kundenbetrieb nur mit Einwilligung beider Seiten.
                                </p>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* 6. Häufige Fragen */}
            <section className="py-16 lg:py-24 bg-background border-t border-border">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Häufige Fragen</h2>
                    </AnimatedSection>
                    <FAQList items={faqs} twoColumns />
                </div>
            </section>

            {/* 7. Abschluss-CTA */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Bereit für Ihren eigenen Assistenten?</h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                        Testen Sie ihn oben mit Ihrer Website. Oder sprechen Sie direkt mit uns.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                            <Link href="/kontakt">
                                Erstgespräch vereinbaren
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
