/**
 * Kalender- und SMS-Funktionen «in Entwicklung» (AUFTRAG-113, Abschnitt 2).
 *
 * Der KI-Telefonassistent nimmt Terminwünsche auf; der Eintrag im
 * Microsoft-365-Kalender und die SMS-Bestätigung sind in Entwicklung.
 * Eine Quelle für Badge, Satz und Zusatz (wortgleich aus dem Auftrag).
 * Reines TypeScript ohne Imports, damit es auch die Node-Prüfskripte laden können.
 */

/** Text der Badge (Komponente: src/components/ki-telefonassistent/InEntwicklung.tsx) */
export const IN_ENTWICKLUNG = 'In Entwicklung, kommt bald';

/** Zusatz an Listen- und Tabelleneinträgen; wird in der Darstellung durch die Badge ersetzt */
export const IN_ENTWICKLUNG_ZUSATZ = ' (in Entwicklung, kommt bald)';

/** Satz überall dort, wo ein Satz den Kalendereintrag oder die SMS bisher als verfügbar behauptet hat */
export const KALENDER_SMS_SATZ =
    'Der Eintrag im Microsoft-365-Kalender und die SMS-Bestätigung sind in Entwicklung und kommen bald. Heute nimmt der Assistent den Terminwunsch auf und meldet ihn Ihnen per E-Mail.';

/** Text mit Zusatz «(in Entwicklung, kommt bald)» */
export function inEntwicklung(text: string): string {
    return `${text}${IN_ENTWICKLUNG_ZUSATZ}`;
}

/** Trennt den Zusatz ab: { text, inEntwicklung } — für die Darstellung mit Badge */
export function zerlegeZusatz(text: string): { text: string; inEntwicklung: boolean } {
    return text.endsWith(IN_ENTWICKLUNG_ZUSATZ) ? { text: text.slice(0, -IN_ENTWICKLUNG_ZUSATZ.length), inEntwicklung: true } : { text, inEntwicklung: false };
}
