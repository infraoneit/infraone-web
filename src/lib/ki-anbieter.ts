/**
 * KI-Anbieter nur in der Datenschutzerklärung (AUFTRAG-114, P3).
 *
 * [31.10.2026] AUFTRAG-114: Welche KI-Anbieter (Sprach- und Textmodelle) wir einsetzen, steht NUR auf
 * /datenschutz (Ziffer 7 «Dienstleister»). Überall sonst steht dieser Satz (wortgleich) mit einem Link
 * auf die Dienstleister-Liste. Reines TypeScript ohne Imports (auch für die Node-Prüfskripte).
 */

/** Link auf die Liste der Dienstleister in der Datenschutzerklärung */
export const KI_ANBIETER_LINK = '/datenschutz#dienstleister';

/** Teil des Satzes, der verlinkt wird */
export const KI_ANBIETER_LINKWORT = 'Datenschutzerklärung';

/** Satz auf den Seiten (wortgleich aus AUFTRAG-114, P3) */
export const KI_ANBIETER_SATZ =
    'Für die Sprachverarbeitung setzen wir KI-Anbieter in bezahlten Stufen ein, ohne Training mit Ihren Daten. Welche das sind, steht in unserer Datenschutzerklärung.';

/** Fassung für public/llms.txt und llms-full.txt (ohne Umlaute wie dort üblich, wortgleich aus AUFTRAG-114) */
export const KI_ANBIETER_LLMS =
    'Sprachverarbeitung durch KI-Anbieter in bezahlten Stufen ohne Training mit Kundendaten; die Anbieter nennt die Datenschutzerklaerung unter /datenschutz';

/** Meta-Description der Seite «Sicherheit und Datenschutz» (wortgleich aus AUFTRAG-114, P3) */
export const SICHERHEIT_DATENSCHUTZ_BESCHREIBUNG =
    'Hosting in der Schweiz bei Infomaniak, Sprachverarbeitung durch KI-Anbieter ohne Training mit Ihren Daten, keine Aufzeichnung, AVV nach DSG auf Anfrage.';
