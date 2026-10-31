/**
 * Satz «KI-Anbieter … Datenschutzerklärung» mit Link auf /datenschutz#dienstleister (AUFTRAG-114, P3).
 *
 * [31.10.2026] AUFTRAG-114: Die Namen der KI-Anbieter stehen nur noch in der Datenschutzerklärung.
 * Texte, die den Satz als Klartext enthalten (FAQ-Antworten gehen 1:1 ins JSON-LD), werden hier
 * dargestellt: das Wort «Datenschutzerklärung» im Satz wird zum Link. Reine Server-Komponente.
 */
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { KI_ANBIETER_LINK, KI_ANBIETER_LINKWORT, KI_ANBIETER_SATZ } from '@/lib/ki-anbieter';

const LINK_KLASSE = 'font-semibold text-text-primary underline underline-offset-4 decoration-primary hover:decoration-2';

/** Text unverändert; enthält er den KI-Anbieter-Satz, wird dessen «Datenschutzerklärung» verlinkt */
export function MitKiAnbieterLink({ text, linkKlasse = LINK_KLASSE }: { text: string; linkKlasse?: string }) {
    const start = text.indexOf(KI_ANBIETER_SATZ);
    if (start < 0) return <>{text}</>;
    const wortPos = start + KI_ANBIETER_SATZ.lastIndexOf(KI_ANBIETER_LINKWORT);
    return (
        <>
            {text.slice(0, wortPos)}
            <Link href={KI_ANBIETER_LINK} data-ki-anbieter-link="" className={cn(linkKlasse)}>
                {KI_ANBIETER_LINKWORT}
            </Link>
            {text.slice(wortPos + KI_ANBIETER_LINKWORT.length)}
        </>
    );
}

/** Nur der Satz (mit Link); in Prosa-Blöcken übernimmt der Link die Stile der Umgebung */
export function KiAnbieterSatz({ linkKlasse }: { linkKlasse?: string }) {
    return <MitKiAnbieterLink text={KI_ANBIETER_SATZ} linkKlasse={linkKlasse} />;
}
