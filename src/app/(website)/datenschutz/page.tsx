import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';
import {
    DS_ABSCHNITTE,
    DS_DIENSTLEISTER,
    DS_DIENSTLEISTER_SPALTEN,
    DS_EINLEITUNG,
    DS_META,
    DS_STAND,
    DS_TITEL,
} from '@/lib/datenschutz';

/*
 * [31.10.2026] AUFTRAG-114: Datenschutzerklärung neu aufgebaut, Texte wortgleich aus dem Auftrag
 * (Quelle: src/lib/datenschutz.ts). Überschriften als h2 mit Ankern; #testanruf-ki-telefonassistent
 * verlinkt die Demo, #dienstleister der Satz «Welche das sind, steht in unserer Datenschutzerklärung»,
 * #formulare das Anfrageformular. Nur hier stehen die Namen der KI-Anbieter.
 */

export const metadata: Metadata = {
    // absolute: ohne die Vorlage «%s | InfraOne» aus dem Layout
    title: { absolute: DS_META.titel },
    description: DS_META.beschreibung,
    alternates: {
        canonical: 'https://infraone.ch/datenschutz',
    },
};

/** Verweise im Text: «Ziffer N» springt zum Abschnitt, info@infraone.ch öffnet das Mailprogramm */
const ZIFFER_ANKER: Record<string, string> = Object.fromEntries(DS_ABSCHNITTE.map((a) => [a.titel.split('.')[0], a.id]));
const VERWEIS_RE = /(info@infraone\.ch|Ziffer \d+)/g;

function mitVerweisen(text: string): ReactNode[] {
    return text.split(VERWEIS_RE).map((teil, i) => {
        if (teil === 'info@infraone.ch') {
            return (
                <a key={i} href="mailto:info@infraone.ch" className="text-text-primary underline underline-offset-4 decoration-primary">
                    {teil}
                </a>
            );
        }
        const ziffer = /^Ziffer (\d+)$/.exec(teil);
        if (ziffer && ZIFFER_ANKER[ziffer[1]]) {
            return (
                <a key={i} href={`#${ZIFFER_ANKER[ziffer[1]]}`} className="text-text-primary underline underline-offset-4 decoration-primary">
                    {teil}
                </a>
            );
        }
        return teil;
    });
}

function DienstleisterTabelle() {
    return (
        // mobil horizontal scrollbar; per Tastatur erreichbar (scrollbarer Bereich)
        <div className="my-6 overflow-x-auto rounded-xl border border-border" role="region" aria-label="Dienstleister (Auftragsbearbeiter)" tabIndex={0}>
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                <caption className="sr-only">Dienstleister (Auftragsbearbeiter)</caption>
                <thead className="bg-surface">
                    <tr>
                        {DS_DIENSTLEISTER_SPALTEN.map((s) => (
                            <th key={s} scope="col" className="px-4 py-3 font-semibold text-text-primary">
                                {s}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {DS_DIENSTLEISTER.map(([name, zweck, ort, hinweis]) => (
                        <tr key={name} className="border-t border-border align-top">
                            <th scope="row" className="px-4 py-3 font-semibold text-text-primary">
                                {name}
                            </th>
                            <td className="px-4 py-3">{zweck}</td>
                            <td className="px-4 py-3">{ort}</td>
                            <td className="px-4 py-3">{hinweis}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function DatenschutzPage() {
    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Datenschutz', url: `${BASE_URL}/datenschutz` },
    ]);

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(`${BASE_URL}/datenschutz`, DS_META.titel, DS_META.beschreibung);

    return (
        <>
            {/* Breadcrumb Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* WebPage Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />

            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <AnimatedSection animation="slideUp">
                            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">{DS_TITEL}</h1>
                        </AnimatedSection>

                        <div className="prose prose-lg text-text-secondary max-w-none leading-relaxed [&_p]:mb-4">
                            <p className="text-lg">{mitVerweisen(DS_EINLEITUNG)}</p>

                            {DS_ABSCHNITTE.map((a) => (
                                <div key={a.id} data-ds-abschnitt={a.id}>
                                    <h2 id={a.id} className="text-xl font-bold text-text-primary mt-10 mb-4 scroll-mt-28">
                                        {a.titel}
                                    </h2>
                                    {a.bloecke.map((b, i) =>
                                        b.art === 'tabelle' ? (
                                            <DienstleisterTabelle key={i} />
                                        ) : b.art === 'h3' ? (
                                            <h3 key={i} className="text-lg font-semibold text-text-primary mt-6 mb-2">
                                                {b.text}
                                            </h3>
                                        ) : (
                                            <p key={i}>{mitVerweisen(b.text)}</p>
                                        ),
                                    )}
                                </div>
                            ))}

                            <p className="mt-10 text-sm">{DS_STAND}</p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
