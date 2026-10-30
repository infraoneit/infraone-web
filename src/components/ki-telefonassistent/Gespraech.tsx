/**
 * Beispielgespräche als schlichte Gesprächsblasen (AUFTRAG-110).
 * Mundart steht mit lang="gsw", Hochdeutsch mit lang="de-CH", Englisch mit lang="en".
 * Alle Gespräche sind Beispiele mit fiktiven Firmen — so beschriftet.
 */
import { AudioLines, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Sprache = 'gsw' | 'de' | 'en';

export interface Zeile {
    wer: 'anrufer' | 'assistent' | 'hinweis';
    text: string;
}

export interface Beispiel {
    /** kurze Ausgangslage, z. B. «Dienstag, 18.40 Uhr, das Team ist auf der Baustelle» */
    situation: string;
    mundart: Zeile[];
    hochdeutsch: Zeile[];
}

const SPRACH_NAME: Record<Sprache, string> = { gsw: 'Schweizerdeutsch', de: 'Hochdeutsch', en: 'Englisch' };
const LANG_ATTR: Record<Sprache, string> = { gsw: 'gsw', de: 'de-CH', en: 'en' };

export function Gespraech({ sprache, zeilen, titel, kompakt = false, className = '' }: { sprache: Sprache; zeilen: Zeile[]; titel?: string; kompakt?: boolean; className?: string }) {
    return (
        <figure className={cn('rounded-2xl border border-border bg-card overflow-hidden', className)}>
            <figcaption className={cn('flex items-center justify-between gap-3 border-b border-border bg-surface/60', kompakt ? 'px-4 py-2' : 'px-5 py-3')}>
                <span className="text-sm font-semibold text-text-primary">{titel ?? 'Beispielgespräch'}</span>
                <span className="rounded-full border border-primary/40 px-2 py-0.5 text-xs font-semibold text-primary-hover dark:text-primary">{SPRACH_NAME[sprache]}</span>
            </figcaption>
            <ol lang={LANG_ATTR[sprache]} className={cn('space-y-3', kompakt ? 'p-4' : 'p-5')}>
                {zeilen.map((z, i) =>
                    z.wer === 'hinweis' ? (
                        <li key={i} lang="de-CH" className="text-center text-xs font-medium text-text-secondary py-1">
                            {z.text}
                        </li>
                    ) : (
                        <li key={i} className={cn('flex gap-2.5', z.wer === 'assistent' && 'flex-row-reverse')}>
                            <span
                                className={cn(
                                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
                                    z.wer === 'assistent' ? 'bg-primary text-white' : 'bg-surface text-text-secondary border border-border',
                                )}
                                aria-hidden="true"
                            >
                                {z.wer === 'assistent' ? <AudioLines className="w-4 h-4" /> : <UserRound className="w-4 h-4" />}
                            </span>
                            <p
                                className={cn(
                                    'max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed',
                                    kompakt ? 'text-[0.9375rem]' : 'text-[0.975rem]',
                                    z.wer === 'assistent'
                                        ? 'rounded-tr-md bg-primary/10 border border-primary/25 text-text-primary'
                                        : 'rounded-tl-md bg-surface border border-border text-text-primary',
                                )}
                            >
                                <span className="sr-only" lang="de-CH">
                                    {z.wer === 'assistent' ? 'Assistent: ' : 'Anrufer: '}
                                </span>
                                {z.text}
                            </p>
                        </li>
                    ),
                )}
            </ol>
        </figure>
    );
}

/** Dasselbe Gespräch in Mundart und Hochdeutsch nebeneinander */
export function GespraechPaar({ beispiel, firma }: { beispiel: Beispiel; firma: string }) {
    return (
        <div>
            <p className="mb-5 text-text-secondary leading-relaxed max-w-3xl">
                <span className="font-semibold text-text-primary">Ausgangslage:</span> {beispiel.situation}
            </p>
            <div className="grid md:grid-cols-2 gap-5 items-start">
                <Gespraech sprache="gsw" zeilen={beispiel.mundart} titel="In Mundart" />
                <Gespraech sprache="de" zeilen={beispiel.hochdeutsch} titel="Auf Hochdeutsch" />
            </div>
            <p className="mt-4 text-sm text-text-secondary">Beispielgespräch, gekürzt. «{firma}» ist eine erfundene Firma.</p>
        </div>
    );
}
