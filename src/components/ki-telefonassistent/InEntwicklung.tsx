/**
 * Badge «In Entwicklung, kommt bald» (AUFTRAG-113, Abschnitt 2).
 * Eine Komponente für Titel, Listen und Tabellen, lesbar im hellen und im
 * dunklen Modus (Bernstein wie das frühere Entwurfsband, Kontrast ≥ 4.5:1).
 * Texte aus src/lib/in-entwicklung.ts.
 */
import { Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IN_ENTWICKLUNG, zerlegeZusatz } from '@/lib/in-entwicklung';

export function InEntwicklungBadge({ className = '' }: { className?: string }) {
    return (
        <span
            data-in-entwicklung=""
            className={cn(
                'inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-600/50 bg-amber-100 px-2 py-0.5 align-middle text-xs font-semibold leading-4 text-amber-900',
                'dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200',
                className,
            )}
        >
            <Hourglass className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            {IN_ENTWICKLUNG}
        </span>
    );
}

/** Text mit Zusatz «(in Entwicklung, kommt bald)» → Text und Badge; sonst unverändert */
export function MitHinweis({ text }: { text: string }) {
    const z = zerlegeZusatz(text);
    if (!z.inEntwicklung) return <>{text}</>;
    return (
        <>
            {z.text} <InEntwicklungBadge />
        </>
    );
}
