/**
 * Preisdarstellung KI-Telefonassistent (AUFTRAG-110) — alle Werte aus
 * src/lib/ki-telefonassistent-preise.ts. Solange PREISE_FREIGEGEBEN = false,
 * zeigt jede Preisdarstellung das Entwurfsband (seit AUFTRAG-113 freigegeben).
 * AUFTRAG-113: Merkmale mit Zusatz «(in Entwicklung, kommt bald)» erscheinen mit Badge.
 */
import { Fragment } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, FilePenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    abPreis,
    chf,
    EINRICHTUNG_EINMALIG,
    ENTWURF_HINWEIS,
    IN_ALLEN_PAKETEN,
    LAUFZEIT_HINWEIS,
    MWST_HINWEIS,
    PAKETE,
    paketPreisText,
    PREIS_ZUSATZMINUTE,
    PREISE_FREIGEGEBEN,
    WAEHRUNG,
} from '@/lib/ki-telefonassistent-preise';
import { KI_PREISE_PFAD } from './seiten';
import { MitHinweis } from './InEntwicklung';

/** Sichtbares Band «Entwurf, Preise noch nicht freigegeben» (nur solange nicht freigegeben) */
export function EntwurfsBand({ className = '', detail = true }: { className?: string; detail?: boolean }) {
    if (PREISE_FREIGEGEBEN) return null;
    return (
        <div
            role="note"
            data-entwurf="preise"
            className={cn(
                'flex items-start gap-3 rounded-xl border-2 border-dashed border-amber-500/70 bg-amber-400/10 px-4 py-3 text-amber-900 dark:text-amber-200',
                className,
            )}
        >
            <FilePenLine className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm leading-relaxed">
                <strong className="font-bold">{ENTWURF_HINWEIS}.</strong>
                {detail && ' Die Beträge sind ein Entwurf und können sich bis zur Freigabe ändern. Verbindlich ist erst Ihre Offerte.'}
            </p>
        </div>
    );
}

/** Paketkarten (vier Pakete) */
export function PaketKarten() {
    return (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
            {PAKETE.map((p) => (
                <article
                    key={p.id}
                    id={`paket-${p.id}`}
                    className={cn('relative h-full flex flex-col rounded-2xl border bg-card p-6 scroll-mt-24', p.empfohlen ? 'border-primary shadow-[0_18px_40px_-28px_rgba(61,150,70,0.8)]' : 'border-border')}
                >
                    {p.empfohlen && <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">Empfehlung</span>}
                    <h3 className="text-xl font-bold text-text-primary">{p.name}</h3>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed min-h-[3rem]">{p.fuerWen}</p>
                    <p className="mt-5 flex items-baseline gap-1.5">
                        <span className="text-4xl font-bold tracking-tight text-text-primary">{paketPreisText(p)}</span>
                        {p.preisMonat !== null && <span className="text-sm text-text-secondary">pro Monat</span>}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">{p.preisMonat !== null ? `${MWST_HINWEIS}, ${LAUFZEIT_HINWEIS}` : 'Offerte nach Ihren Anforderungen'}</p>
                    <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
                        {p.merkmale.map((m) => (
                            <li key={m} className="flex gap-2.5 text-sm text-text-primary leading-snug">
                                <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
                                <span>
                                    <MitHinweis text={m} />
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/kontakt"
                        className={cn(
                            'mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-semibold',
                            p.empfohlen ? 'text-primary-hover dark:text-primary' : 'text-text-primary hover:text-primary',
                        )}
                    >
                        {p.preisMonat === null ? 'Offerte anfragen' : 'Beratung vereinbaren'}
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                </article>
            ))}
        </div>
    );
}

/** Enthalten in allen Paketen + Einrichtung + Zusatzminuten */
export function PreisDetails() {
    return (
        <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 lg:p-8">
                <h3 className="text-xl font-bold text-text-primary mb-5">In jedem Paket enthalten</h3>
                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                    {IN_ALLEN_PAKETEN.map((m) => (
                        <li key={m} className="flex gap-2.5 text-text-secondary leading-relaxed">
                            <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
                            {m}
                        </li>
                    ))}
                </ul>
            </div>
            <dl className="rounded-2xl border border-border bg-card divide-y divide-border">
                <div className="p-6">
                    <dt className="text-sm font-semibold text-text-secondary">Einrichtung, einmalig</dt>
                    <dd className="mt-1 text-2xl font-bold text-text-primary">
                        {WAEHRUNG} {chf(EINRICHTUNG_EINMALIG)}
                    </dd>
                    <dd className="mt-1 text-sm text-text-secondary">Website-Scan, Wissen prüfen, Begrüssung, Rufumleitung oder Nummer.</dd>
                </div>
                <div className="p-6">
                    <dt className="text-sm font-semibold text-text-secondary">Zusätzliche Gesprächsminute</dt>
                    <dd className="mt-1 text-2xl font-bold text-text-primary">
                        {WAEHRUNG} {chf(PREIS_ZUSATZMINUTE)}
                    </dd>
                    <dd className="mt-1 text-sm text-text-secondary">Nur, wenn die Minuten Ihres Pakets aufgebraucht sind.</dd>
                </div>
            </dl>
        </div>
    );
}

/** Preis-Teaser für die Hub-Seite (mit Entwurfsband) */
export function PreisTeaser() {
    return (
        <div className="rounded-3xl border border-border bg-card p-6 md:p-10">
            <EntwurfsBand className="mb-8" />
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <div className="lg:col-span-5">
                    <p className="text-sm font-semibold text-text-secondary">Monatliche Pakete</p>
                    <p className="mt-2 text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
                        ab {WAEHRUNG} {chf(abPreis())}
                        <span className="text-lg font-medium text-text-secondary"> pro Monat</span>
                    </p>
                    <p className="mt-3 text-text-secondary leading-relaxed">
                        {MWST_HINWEIS}, {LAUFZEIT_HINWEIS}. Einrichtung einmalig {WAEHRUNG} {chf(EINRICHTUNG_EINMALIG)}. Auf der Preisseite rechnen Sie aus, was Sie verpasste Anrufe heute kosten.
                    </p>
                    <Link
                        href={KI_PREISE_PFAD}
                        className="mt-6 inline-flex items-center gap-2 font-semibold text-text-primary underline underline-offset-4 decoration-primary hover:decoration-2"
                    >
                        Alle Pakete und Rechner
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                </div>
                <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
                    {PAKETE.map((p) => (
                        <li key={p.id} className={cn('rounded-2xl border p-4', p.empfohlen ? 'border-primary bg-primary/[0.05]' : 'border-border bg-surface/40')}>
                            <p className="flex items-baseline justify-between gap-3">
                                <span className="font-bold text-text-primary">{p.name}</span>
                                <span className="font-semibold text-text-primary">
                                    {paketPreisText(p)}
                                    {p.preisMonat !== null && <span className="text-xs font-medium text-text-secondary"> / Mt.</span>}
                                </span>
                            </p>
                            <p className="mt-1 text-sm text-text-secondary leading-snug">
                                {p.merkmale.slice(0, 2).map((m, i) => (
                                    <Fragment key={m}>
                                        {i > 0 && ' · '}
                                        <MitHinweis text={m} />
                                    </Fragment>
                                ))}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
