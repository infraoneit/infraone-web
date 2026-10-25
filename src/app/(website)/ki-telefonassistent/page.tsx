import { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    Briefcase,
    Building2,
    Car,
    ChevronDown,
    ClipboardList,
    Globe,
    MessageSquareText,
    Phone,
    PhoneForwarded,
    PhoneIncoming,
    Rocket,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    UtensilsCrossed,
    Zap,
} from 'lucide-react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { KiDemo } from '@/components/tools/KiDemo';
import {
    generateBreadcrumbListSchema,
    generateFAQSchema,
    generateKiTelefonassistentServiceSchema,
    generateWebPageSchema,
} from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

// Texte wortgleich aus AUFTRAG-092 (Lektor: Claude) — nicht umformulieren.
// AUFTRAG-095: Hero-Satz gekürzt (ein Satz Nutzen), Abschnitt «So läuft es bei Ihnen» neu.
// AUFTRAG-098: kein Mundart-Versprechen mehr (Hochdeutsch Vorgabe, Englisch gleichwertig,
// Schweizerdeutsch in Erprobung) — Titel, Beschreibung, Badge, Hero-Satz, FAQ wortgleich Manager-Vorgabe.
const TITEL = 'KI-Telefonassistent für Schweizer KMU – Demo-Anruf in einer Minute | InfraOne';
const BESCHREIBUNG =
    'Geben Sie Ihre Website ein, wir bauen daraus Ihren KI-Telefonassistenten und rufen Sie an. Zuverlässig auf Deutsch und Englisch, Schweizerdeutsch in Erprobung. Betrieb in der Schweiz.';
const URL_SEITE = `${BASE_URL}/ki-telefonassistent`;
const OG_BILD = '/og/ki-telefonassistent.png';

export const metadata: Metadata = {
    title: { absolute: TITEL },
    description: BESCHREIBUNG,
    keywords: ['KI-Telefonassistent', 'KI-Telefonassistent Schweiz', 'Voicebot Schweiz', 'Telefonassistent KMU', 'KI Anrufbeantworter'],
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
        images: [{ url: OG_BILD, width: 1200, height: 630, alt: 'KI-Telefonassistent für Schweizer KMU – InfraOne' }],
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
        text: 'Sie hören, wie Ihr Assistent Anrufer begrüsst, Fragen beantwortet und Anliegen aufnimmt – in der Sprache, die Sie wählen.',
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
        answer: 'Er kann es, aber wir empfehlen Hochdeutsch oder Englisch. Schweizerdeutsch ist bei uns in Erprobung und klingt noch nicht in jedem Gespräch natürlich. Sie wählen die Sprache vor dem Anruf.',
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

// AUFTRAG-098: Reihenfolge und Vorgabe wie die Sprachwahl im Testanruf
const sprachen = [
    { name: 'Deutsch', text: 'Hochdeutsch, klar und zuverlässig – die Vorgabe.', hinweis: 'vorgewählt', standard: true, lang: 'de' },
    { name: 'English', text: 'Reliable for international callers.', hinweis: null, standard: false, lang: 'en' },
    { name: 'Schweizerdeutsch', text: 'Als Option wählbar, klingt noch nicht in jedem Gespräch natürlich.', hinweis: 'in Erprobung', standard: false, lang: 'de' },
];

// AUFTRAG-095: nur, was wir wirklich leisten; Preis nicht freigegeben → «Festpreis auf Anfrage»
const beiIhnen = [
    {
        icon: Globe,
        titel: 'Ihre Website und Ihre Vorgaben',
        text: 'Wir übernehmen Leistungen, Öffnungszeiten und Kontaktdaten aus Ihrer Website und ergänzen sie mit Ihnen um Begrüssung, Abläufe und Antworten.',
    },
    {
        icon: PhoneForwarded,
        titel: 'Ihre Nummer bleibt',
        text: 'Sie behalten Ihre Telefonnummer. Sie bestimmen, wann der Assistent abnimmt – zum Beispiel ausserhalb der Öffnungszeiten oder wenn niemand frei ist.',
    },
    {
        icon: Rocket,
        titel: 'Live in 48 Stunden',
        text: 'Nach Ihrer Freigabe ist der Assistent innert 48 Stunden in Betrieb. Die Notiz zu jedem Gespräch erhalten Sie per E-Mail.',
    },
];

export default function KiTelefonassistentPage() {
    const serviceSchema = generateKiTelefonassistentServiceSchema(BESCHREIBUNG);
    const webPageSchema = generateWebPageSchema(URL_SEITE, 'KI-Telefonassistent für Schweizer KMU', BESCHREIBUNG);
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Cloud-Telefonie', url: `${BASE_URL}/cloud-telefonie` },
        { name: 'KI-Telefonassistent', url: URL_SEITE },
    ]);
    const faqSchema = generateFAQSchema(faqs);
    // Turnstile nur, wenn Site-Key UND Secret gesetzt sind (sonst aus)
    const turnstileSiteKey =
        process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET ? process.env.TURNSTILE_SITE_KEY : undefined;
    // Begrüssungsvorschau: A-091 wortgleich; mit 1 die Formen nach Stimme (sobald AUFTRAG-094 live ist)
    const begruessungNachStimme = (process.env.DEMO_BEGRUESSUNG_NACH_STIMME ?? '0').trim() === '1';

    return (
        <>
            {[serviceSchema, webPageSchema, breadcrumbSchema, faqSchema].map((schema, i) => (
                <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            ))}

            {/* Hero: das Eingabefeld ist die Bühne, rechts das lebende Telefon */}
            <section className="relative overflow-clip pt-10 pb-16 sm:pt-14 lg:pt-16 lg:pb-24 lg:min-h-[min(calc(100svh-5rem),62rem)]">
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute inset-0 bg-gradient-to-b from-surface/70 via-background to-background" />
                    {/* weicher Lichtfleck als Verlauf statt blur-Filter (billiger zu malen, besseres LCP auf Mobilgeräten) */}
                    <div className="absolute -top-56 right-[-15%] w-[56rem] h-[56rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]" />
                </div>
                <div className="container mx-auto px-4 relative">
                    <KiDemo turnstileSiteKey={turnstileSiteKey} begruessungNachStimme={begruessungNachStimme}>
                        <p className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
                            <span className="relative flex w-2 h-2" aria-hidden="true">
                                <span className="absolute inset-0 rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
                                <span className="relative w-2 h-2 rounded-full bg-primary" />
                            </span>
                            KI-Telefonassistent für Schweizer KMU
                        </p>
                        <h1 className="mt-5 text-[2.4rem] leading-[1.04] sm:text-5xl lg:text-[3.5rem] xl:text-[3.9rem] font-bold tracking-[-0.035em] text-text-primary text-balance">
                            Erleben Sie Ihren KI-Telefonassistenten – in einer Minute
                        </h1>
                        <p className="mt-5 text-lg md:text-xl text-text-secondary leading-relaxed max-w-[38rem]">
                            Geben Sie Ihre Website ein – wir bauen daraus einen Assistenten mit Ihrem Namen, Ihrem Logo und Ihrem Wissen und rufen Sie an. Auf Deutsch, auf Englisch, auf Wunsch auch auf Schweizerdeutsch.
                        </p>
                    </KiDemo>
                </div>
            </section>

            {/* 1. So funktioniert der Testanruf */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="mb-10 lg:mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">So funktioniert der Testanruf</h2>
                    </AnimatedSection>
                    <ol className="grid md:grid-cols-3 gap-px rounded-3xl overflow-hidden border border-border bg-border">
                        {schritte.map((s) => (
                            <li key={s.titel} className="bg-card p-6 lg:p-8">
                                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                                    <s.icon className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">{s.titel}</h3>
                                <p className="text-text-secondary leading-relaxed">{s.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* 2. Warum ein Assistent aus der Schweiz (AUFTRAG-098, ersetzt «Warum Schweizerdeutsch den Unterschied macht») */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                        <AnimatedSection animation="slideUp" className="lg:col-span-7">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-6">Warum ein Assistent aus der Schweiz</h2>
                            <p className="text-lg text-text-secondary leading-relaxed max-w-3xl">
                                Ihr Assistent läuft auf unserer eigenen Telefonanlage in der Schweiz – nicht in einem Callcenter im Ausland. Auf Deutsch und Englisch spricht er zuverlässig. Schweizerdeutsch bieten wir als Option an; es ist bei uns in Erprobung. Welche KI-Dienste dabei mitarbeiten, erklären wir weiter unten offen.
                            </p>
                        </AnimatedSection>
                        <AnimatedSection animation="slideUp" delay={0.1} className="lg:col-span-5">
                            <ul className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden">
                                {sprachen.map((s) => (
                                    <li key={s.name} className="flex items-center gap-4 px-5 py-4 lg:px-6 lg:py-5">
                                        <span
                                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${s.standard ? 'bg-primary text-white' : 'bg-surface text-text-secondary border border-border'}`}
                                            aria-hidden="true"
                                        >
                                            <MessageSquareText className="w-4 h-4" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-lg font-semibold text-text-primary">
                                                {s.name}
                                                {s.hinweis && <span className={`ml-2 align-middle text-xs font-semibold ${s.standard ? 'text-primary' : 'text-text-secondary'}`}>{s.hinweis}</span>}
                                            </span>
                                            <span className="block text-sm text-text-secondary" lang={s.lang}>
                                                {s.text}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* 3. Was der Assistent im Alltag übernimmt */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="mb-10 lg:mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">Was der Assistent im Alltag übernimmt</h2>
                    </AnimatedSection>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
                        {alltag.map((k) => (
                            <div key={k.titel} className="h-full p-6 rounded-2xl bg-card border border-border transition-colors hover:border-primary/40">
                                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                                    <k.icon className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <h3 className="text-lg font-bold text-text-primary mb-2 leading-snug">{k.titel}</h3>
                                <p className="text-sm text-text-secondary leading-relaxed">{k.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. So läuft es bei Ihnen (AUFTRAG-095) */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
                        <AnimatedSection animation="slideUp" className="lg:col-span-4">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">So läuft es bei Ihnen</h2>
                            <p className="mt-5 text-lg text-text-secondary leading-relaxed">
                                Aus dem Testassistenten wird Ihr Assistent: eingerichtet von uns, mit Ihren Inhalten und Ihrer Nummer.
                            </p>
                            <p className="mt-6 inline-flex rounded-xl border border-border bg-card px-4 py-3 font-semibold text-text-primary">Festpreis auf Anfrage</p>
                        </AnimatedSection>
                        <ol className="lg:col-span-8 space-y-4">
                            {beiIhnen.map((b, i) => (
                                <li key={b.titel} className="flex gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
                                    <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center" aria-hidden="true">
                                        <b.icon className="w-5 h-5" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-text-secondary">Schritt {i + 1}</span>
                                        <h3 className="mt-0.5 text-xl font-bold text-text-primary">{b.titel}</h3>
                                        <p className="mt-2 text-text-secondary leading-relaxed">{b.text}</p>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </section>

            {/* 5. Für welche Betriebe */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="mb-10 lg:mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">Für welche Betriebe</h2>
                    </AnimatedSection>
                    <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
                        {betriebe.map((b) => (
                            <li key={b.titel} className="flex gap-4">
                                <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-card border border-border text-primary flex items-center justify-center" aria-hidden="true">
                                    <b.icon className="w-5 h-5" />
                                </span>
                                <span>
                                    <h3 className="font-bold text-text-primary mb-1.5">{b.titel}</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">{b.text}</p>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* 6. Datenschutz und Technik */}
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp">
                        <div className="rounded-3xl border border-border bg-card p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10">
                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-5">Datenschutz und Technik, ehrlich erklärt</h2>
                                <p className="text-lg text-text-secondary leading-relaxed max-w-3xl">
                                    Die Telefonanlage und Ihre Gesprächsprotokolle laufen in der Schweiz auf Systemen von InfraOne. Für Spracherkennung und Sprachausgabe nutzen wir die KI-Schnittstellen von OpenAI; Gesprächsinhalte werden dort nicht zum Training verwendet. Ihre Nummer aus dem Testanruf verwenden wir für diesen Anruf und für eine Rückmeldung von uns, falls Sie Fragen haben – nicht für Werbung. Mitschnitte gibt es im Kundenbetrieb nur mit Einwilligung beider Seiten.
                                </p>
                                <Link
                                    href="/datenschutz#testanruf-ki-telefonassistent"
                                    className="mt-5 inline-flex items-center gap-2 font-semibold text-text-primary underline underline-offset-4 decoration-primary hover:decoration-2"
                                >
                                    Datenschutzhinweise zum Testanruf
                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* 7. Häufige Fragen (natives details/summary: ohne JavaScript bedienbar) */}
            <section className="py-16 lg:py-24 bg-surface border-t border-border">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="mb-10 lg:mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">Häufige Fragen</h2>
                    </AnimatedSection>
                    <div className="grid lg:grid-cols-2 gap-4 lg:items-start">
                        {faqs.map((f) => (
                            <details key={f.question} className="group rounded-2xl border border-border bg-card open:border-primary/40">
                                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
                                    {f.question}
                                    <ChevronDown className="w-5 h-5 flex-shrink-0 text-primary transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                                </summary>
                                <p className="px-5 pb-5 -mt-1 text-text-secondary leading-relaxed">
                                    {f.answer.endsWith('Details in den Datenschutzhinweisen.') ? (
                                        <>
                                            {f.answer.replace('Details in den Datenschutzhinweisen.', 'Details in den ')}
                                            <Link href="/datenschutz#testanruf-ki-telefonassistent" className="underline underline-offset-2 text-text-primary hover:no-underline">
                                                Datenschutzhinweisen
                                            </Link>
                                            .
                                        </>
                                    ) : (
                                        f.answer
                                    )}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. Abschluss-CTA */}
            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Bereit für Ihren eigenen Assistenten?</h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">Testen Sie ihn oben mit Ihrer Website. Oder sprechen Sie direkt mit uns.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                            <Link href="/kontakt">
                                Erstgespräch vereinbaren
                                <ArrowRight className="w-5 h-5" aria-hidden="true" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                            <a href="tel:+41522221818">
                                <Phone className="w-5 h-5" aria-hidden="true" />
                                052 222 18 18
                            </a>
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
