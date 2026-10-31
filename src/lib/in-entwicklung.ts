/**
 * Funktionen «in Entwicklung» (AUFTRAG-113, Abschnitt 2; nachgeführt AUFTRAG-114).
 *
 * Der KI-Telefonassistent nimmt Terminwünsche auf; der Eintrag im
 * Microsoft-365-Kalender ist in Entwicklung.
 * [31.10.2026] AUFTRAG-114: Die SMS-Bestätigung an Anrufende funktioniert bereits
 * (Inhaber) und ist überall wieder als verfügbar beschrieben; nur der Kalendereintrag
 * trägt die Badge. Eine Quelle für Badge, Satz und Zusatz (wortgleich aus den Aufträgen).
 * Reines TypeScript ohne Imports, damit es auch die Node-Prüfskripte laden können.
 */

/** Text der Badge (Komponente: src/components/ki-telefonassistent/InEntwicklung.tsx) */
export const IN_ENTWICKLUNG = 'In Entwicklung, kommt bald';

/** Zusatz an Listen- und Tabelleneinträgen; wird in der Darstellung durch die Badge ersetzt */
export const IN_ENTWICKLUNG_ZUSATZ = ' (in Entwicklung, kommt bald)';

/**
 * Satz überall dort, wo ein Satz den Kalendereintrag bisher als verfügbar behauptet hat
 * (AUFTRAG-114, wortgleich; ersetzt KALENDER_SMS_SATZ aus AUFTRAG-113). Zwei Sätze, darum
 * in zwei Teilen notiert: Der erste betrifft nur den Kalender, der zweite beschreibt, was heute
 * geht — einschliesslich der SMS-Bestätigung.
 */
export const KALENDER_SATZ =
    'Der Eintrag im Microsoft-365-Kalender ist in Entwicklung und kommt bald. ' +
    'Heute nimmt der Assistent den Terminwunsch auf, meldet ihn Ihnen per E-Mail und bestätigt ihn den Anrufenden per SMS.';

/** Text mit Zusatz «(in Entwicklung, kommt bald)» */
export function inEntwicklung(text: string): string {
    return `${text}${IN_ENTWICKLUNG_ZUSATZ}`;
}

/** Trennt den Zusatz ab: { text, inEntwicklung } — für die Darstellung mit Badge */
export function zerlegeZusatz(text: string): { text: string; inEntwicklung: boolean } {
    return text.endsWith(IN_ENTWICKLUNG_ZUSATZ) ? { text: text.slice(0, -IN_ENTWICKLUNG_ZUSATZ.length), inEntwicklung: true } : { text, inEntwicklung: false };
}
