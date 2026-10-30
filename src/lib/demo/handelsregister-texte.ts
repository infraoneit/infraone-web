/**
 * Handelsregister-Prüfung der KI-Demo (AUFTRAG-109): Texte und Antworttypen, die Widget
 * (Browser) und Server gemeinsam nutzen. Ohne Node-Module — darf in den Client-Bundle.
 */

/** Höchstens so viele manuelle Suchen («Firmenname oder UID») je Scan. */
export const MANUELL_MAX = 3;

export type HrModus = 'streng' | 'aus';
export type HrQuelle = 'uid' | 'name' | 'manuell';

/**
 * Ergebnis einer Prüfung:
 * - treffer: mindestens ein aktiver Eintrag (Auswahl, Bestätigung nötig)
 * - nicht_aktiv: Einträge gefunden, aber keiner aktiv
 * - kein_treffer: nichts gefunden
 * - nicht_erreichbar: Register antwortet nicht (Schalter «streng»: kein Testanruf)
 * - bestaetigt: Firma bestätigt, signierter Nachweis gültig
 * - uebersprungen: Schalter «aus» (nur Entwicklung)
 */
export type HrErgebnis = 'treffer' | 'kein_treffer' | 'nicht_aktiv' | 'nicht_erreichbar' | 'bestaetigt' | 'uebersprungen';

/** Eintrag, wie ihn das Widget zeigt. */
export interface HrTrefferAnzeige {
    uid: string;
    uid_formatiert: string;
    name: string;
    sitz: string;
    status: string;
    status_text: string;
    rechtsform: string | null;
    aktiv: boolean;
}

/** Bestätigte Firma (Anzeige über dem Anruf-Formular). */
export interface HrBestaetigt {
    uid: string;
    uid_formatiert: string;
    name: string;
    sitz: string;
}

/** Antwort von POST /api/demo/handelsregister. */
export interface HrAntwort {
    scan_id: string;
    modus: HrModus;
    ergebnis: HrErgebnis;
    quelle: HrQuelle | null;
    /** höchstens 5, aktive zuerst nach Passung */
    treffer: HrTrefferAnzeige[];
    /** verbleibende manuelle Suchen */
    versuche_rest: number;
    bestaetigt: HrBestaetigt | null;
    /** Ablauf der Bestätigung (Epoch-ms), nur bei «bestaetigt» */
    gueltig_bis?: number;
}

/** Kennungen der 403-Antworten von POST /api/demo/anruf ohne gültigen Nachweis. */
export const HR_CODE_FEHLT = 'handelsregister_fehlt';
export const HR_CODE_ABGELAUFEN = 'handelsregister_abgelaufen';

export const HR_TEXT = {
    /** Datenschutz-Hinweis im Widget (AUFTRAG-109, Abschnitt 3, wortgleich) */
    datenschutz: 'Wir prüfen den Firmennamen gegen das öffentliche Handelsregister (Zefix).',
    /** Register nicht erreichbar, Schalter «streng» (wortgleich AUFTRAG-109) */
    nichtErreichbar: 'Handelsregister gerade nicht erreichbar, bitte in ein paar Minuten nochmals.',
    /** kein aktiver Eintrag (wortgleich AUFTRAG-109) */
    aktivNoetig: 'Für den Testanruf braucht es einen aktiven Handelsregister-Eintrag.',
    fehlt: 'Für den Testanruf braucht es eine bestätigte Firma aus dem Handelsregister. Bitte bestätigen Sie zuerst Ihre Firma.',
    abgelaufen: 'Die Bestätigung Ihrer Firma ist abgelaufen. Bitte bestätigen Sie Ihre Firma nochmals.',
    versucheAus: 'Die Suche ist für diese Website ausgeschöpft.',
    uidUngueltig: 'Diese UID ist ungültig. Bitte prüfen Sie die Eingabe, z. B. CHE-123.456.789.',
    suchtextKurz: 'Bitte geben Sie mindestens drei Zeichen ein.',
    nichtBestaetigbar: 'Diese Firma können wir nicht bestätigen. Bitte wählen Sie einen Eintrag aus der Liste.',
} as const;
