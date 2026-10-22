/**
 * Zustandsautomat der Demo-Oberfläche (AUFTRAG-095, Teil 3).
 *
 * Genau EIN Primär-Button je Zustand, Texte wortgleich aus dem Auftrag.
 * Übergänge kommen aus dem Status-Polling (`/api/demo/auftraege/[id]`) und
 * gehen nur vorwärts; Endzustände (beendet, fehler) führen zurück zu
 * «bereit» (Nochmals testen / Nochmals versuchen) — keine toten Enden.
 * Browser und Server (reine Funktionen, testbar).
 */
import type { AuftragStatus } from './typen';

export type Zustand = 'eingabe' | 'scan' | 'bereit' | 'wartend' | 'waehlt' | 'verbunden' | 'beendet' | 'fehler';

export const ZUSTAENDE: readonly Zustand[] = ['eingabe', 'scan', 'bereit', 'wartend', 'waehlt', 'verbunden', 'beendet', 'fehler'];

/** Orchestrator-Status → Oberflächen-Zustand. */
export function zustandAusStatus(status: AuftragStatus): Zustand {
    if (status === 'wartend' || status === 'angenommen') return 'wartend';
    return status;
}

const RANG: Record<Zustand, number> = { eingabe: 0, scan: 1, bereit: 2, wartend: 3, waehlt: 4, verbunden: 5, beendet: 6, fehler: 6 };

/** Nur vorwärts (ein spätes Polling-Ergebnis darf «verbunden» nicht auf «wartend» zurücksetzen). */
export function naechsterZustand(aktuell: Zustand, neu: Zustand): Zustand {
    if (aktuell === 'beendet' || aktuell === 'fehler') return aktuell;
    return RANG[neu] >= RANG[aktuell] ? neu : aktuell;
}

export interface PrimaerButton {
    text: string;
    /** Symbol links im Button */
    symbol: 'pfeil' | 'spinner' | 'telefon' | 'puls' | 'klingeln' | 'welle' | 'neu';
    deaktiviert: boolean;
    /** Darstellung: primär (Marken-Grün), verbunden (Grün mit Wellenform), sekundär (Umriss) */
    art: 'primaer' | 'verbunden' | 'sekundaer';
}

/** Primär-Button je Zustand (wortgleich AUFTRAG-095). `name` = Vorname des Assistenten. */
export function primaerButton(z: Zustand, name: string): PrimaerButton {
    switch (z) {
        case 'eingabe':
            return { text: 'Website scannen', symbol: 'pfeil', deaktiviert: false, art: 'primaer' };
        case 'scan':
            return { text: 'Wird gescannt …', symbol: 'spinner', deaktiviert: true, art: 'primaer' };
        case 'bereit':
            return { text: 'Jetzt KI-Anruf erhalten', symbol: 'telefon', deaktiviert: false, art: 'primaer' };
        case 'wartend':
            return { text: 'Wir rufen Sie gleich an …', symbol: 'puls', deaktiviert: true, art: 'primaer' };
        case 'waehlt':
            return { text: 'Ihr Telefon klingelt …', symbol: 'klingeln', deaktiviert: true, art: 'primaer' };
        case 'verbunden':
            return { text: `Verbunden – sprechen Sie mit ${name}`, symbol: 'welle', deaktiviert: true, art: 'verbunden' };
        case 'beendet':
            return { text: 'Nochmals testen', symbol: 'neu', deaktiviert: false, art: 'sekundaer' };
        case 'fehler':
            return { text: 'Nochmals versuchen', symbol: 'neu', deaktiviert: false, art: 'primaer' };
    }
}

/** Ansage für Screenreader (aria-live) beim Zustandswechsel. */
export function ansage(z: Zustand, name: string, firma: string): string {
    switch (z) {
        case 'eingabe':
            return '';
        case 'scan':
            return 'Ihre Website wird gescannt.';
        case 'bereit':
            return `${name}, Ihr Assistent für ${firma}, ist bereit. Wählen Sie die Sprache und geben Sie Ihre Telefonnummer ein.`;
        case 'wartend':
            return 'Auftrag erhalten. Wir rufen Sie gleich an.';
        case 'waehlt':
            return 'Ihr Telefon klingelt.';
        case 'verbunden':
            return `Verbunden. Sie sprechen mit ${name}.`;
        case 'beendet':
            return 'Gespräch beendet. Die Zusammenfassung steht unter dem Button.';
        case 'fehler':
            return 'Leider nicht erreicht.';
    }
}

/** Gesprächsdauer als m:ss */
export function dauerAnzeige(sekunden: number): string {
    const s = Math.max(0, Math.floor(sekunden));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Meldung bei «fehler» je Grund des Orchestrators (AUFTRAG-095). Der Standard
 * ist wortgleich AUFTRAG-092; die Nummer 052 222 18 18 steht am Ende und wird
 * auf der Seite als Link gesetzt.
 */
export function fehlerMeldung(grund: string | null | undefined): { text: string; mitNummer: boolean } {
    switch (grund) {
        case 'limit':
            return { text: 'Für diese Nummer sind die Testanrufe für heute aufgebraucht. Gerne zeigen wir Ihnen den Assistenten persönlich:', mitNummer: true };
        case 'besetzt':
            return { text: 'Ihre Leitung war besetzt. Versuchen Sie es gleich nochmals oder rufen Sie uns an:', mitNummer: true };
        case 'abgelehnt':
            return { text: 'Der Anruf wurde abgelehnt. Versuchen Sie es nochmals oder rufen Sie uns an:', mitNummer: true };
        case 'ungueltige_nummer':
            return { text: 'Diese Nummer konnten wir nicht anrufen. Prüfen Sie die Nummer oder rufen Sie uns an:', mitNummer: true };
        case 'technisch':
        case 'zeitueberschreitung':
            return { text: 'Der Anruf kam nicht zustande. Versuchen Sie es gleich nochmals oder rufen Sie uns an:', mitNummer: true };
        default:
            return { text: 'Leider nicht erreicht. Versuchen Sie es gleich nochmals oder rufen Sie uns an:', mitNummer: true };
    }
}
