/**
 * Seitenverzeichnis des Bereichs /ki-telefonassistent (AUFTRAG-110).
 *
 * Eine Quelle für Sitemap, interne Verlinkung und das SEO-Prüfskript
 * (das Menü im Header führt seit AUFTRAG-113 eine eigene, kleinere Auswahl
 * in components/layout/navigation.ts). Reines TypeScript ohne JSX/Imports,
 * damit es auch die Node-Prüfskripte direkt laden können.
 *
 * Regeln für `kurz`: ein Satz mit Punkt, höchstens 45 Zeichen, keine Zahlen,
 * keine Superlative.
 */

export const KI_BASIS = '/ki-telefonassistent';

export type KiGruppe = 'produkt' | 'anwendungen' | 'branchen' | 'vertrauen';

export interface KiSeite {
    /** vollständiger Pfad ab Domain, z. B. /ki-telefonassistent/funktionen */
    pfad: string;
    /** Name im Menü und in Brotkrumen */
    titel: string;
    /** ein Satz als Kurzbeschreibung (AUFTRAG-113: Kalendereintrag in Entwicklung, daher «Terminwünsche aufnehmen») */
    kurz: string;
    gruppe: KiGruppe;
    /** Priorität in der Sitemap */
    prioritaet: number;
}

export const ANWENDUNG_SLUGS = ['erreichbarkeit', 'auskunft', 'anliegen-erfassen', 'terminbuchung', 'notfall'] as const;
export type AnwendungSlug = (typeof ANWENDUNG_SLUGS)[number];

export const BRANCHEN_SLUGS = ['elektriker', 'sanitaer-heizung', 'arztpraxis', 'treuhand', 'immobilien', 'garage'] as const;
export type BranchenSlug = (typeof BRANCHEN_SLUGS)[number];

export const KI_SEITEN: KiSeite[] = [
    { pfad: KI_BASIS, titel: 'Übersicht und Live-Test', kurz: 'Website eingeben, der Assistent ruft an.', gruppe: 'produkt', prioritaet: 0.9 },
    { pfad: `${KI_BASIS}/funktionen`, titel: 'Funktionen', kurz: 'Alles, was der Assistent am Telefon kann.', gruppe: 'produkt', prioritaet: 0.8 },
    { pfad: `${KI_BASIS}/so-funktioniert-es`, titel: 'So funktioniert es', kurz: 'Vom Testanruf zum eigenen Assistenten.', gruppe: 'produkt', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/schweizerdeutsch`, titel: 'Schweizerdeutsch', kurz: 'Versteht und spricht Mundart.', gruppe: 'produkt', prioritaet: 0.8 },
    { pfad: `${KI_BASIS}/preise`, titel: 'Preise', kurz: 'Pakete und Rechner für verpasste Anrufe.', gruppe: 'produkt', prioritaet: 0.8 },

    { pfad: `${KI_BASIS}/anwendungen`, titel: 'Alle Anwendungen', kurz: 'Wofür Betriebe den Assistenten nutzen.', gruppe: 'anwendungen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/anwendungen/erreichbarkeit`, titel: 'Erreichbarkeit', kurz: 'Abnehmen, wenn niemand frei ist.', gruppe: 'anwendungen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/anwendungen/auskunft`, titel: 'Auskunft', kurz: 'Wiederkehrende Fragen beantworten.', gruppe: 'anwendungen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/anwendungen/anliegen-erfassen`, titel: 'Anliegen erfassen', kurz: 'Wer, was, Rückruf: als Notiz per E-Mail.', gruppe: 'anwendungen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/anwendungen/terminbuchung`, titel: 'Terminbuchung', kurz: 'Terminwünsche am Telefon aufnehmen.', gruppe: 'anwendungen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/anwendungen/notfall`, titel: 'Notfall und Pikett', kurz: 'Dringendes sofort an die Notfallnummer.', gruppe: 'anwendungen', prioritaet: 0.6 },

    { pfad: `${KI_BASIS}/branchen`, titel: 'Alle Branchen', kurz: 'Beispiele aus sechs Branchen.', gruppe: 'branchen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/branchen/elektriker`, titel: 'Elektriker', kurz: 'Störungen und Aufträge annehmen.', gruppe: 'branchen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/branchen/sanitaer-heizung`, titel: 'Sanitär und Heizung', kurz: 'Pikett, Service und Offerten.', gruppe: 'branchen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/branchen/arztpraxis`, titel: 'Arztpraxis', kurz: 'Den Empfang während der Sprechstunde entlasten.', gruppe: 'branchen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/branchen/treuhand`, titel: 'Treuhand', kurz: 'Mandanten bedienen, auch in der Steuerzeit.', gruppe: 'branchen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/branchen/immobilien`, titel: 'Immobilien', kurz: 'Besichtigungen und Schadenmeldungen.', gruppe: 'branchen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/branchen/garage`, titel: 'Garage', kurz: 'Service, Pneuwechsel und Abholung.', gruppe: 'branchen', prioritaet: 0.7 },

    { pfad: `${KI_BASIS}/sicherheit-datenschutz`, titel: 'Sicherheit und Datenschutz', kurz: 'Hosting in der Schweiz, kein Training.', gruppe: 'vertrauen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/faq`, titel: 'Häufige Fragen', kurz: 'Antworten zu Mundart, Nummer und Kosten.', gruppe: 'vertrauen', prioritaet: 0.7 },
    { pfad: `${KI_BASIS}/vergleich`, titel: 'Vergleich', kurz: 'Gegenüber Anrufbeantworter und Sekretariat.', gruppe: 'vertrauen', prioritaet: 0.6 },
    { pfad: `${KI_BASIS}/glossar`, titel: 'Glossar', kurz: 'Begriffe der KI-Telefonie erklärt.', gruppe: 'vertrauen', prioritaet: 0.5 },
];

/** Pfad der Preisseite (seit AUFTRAG-113 freigegeben: indexierbar und in der Sitemap) */
export const KI_PREISE_PFAD = `${KI_BASIS}/preise`;

export function kiSeite(pfad: string): KiSeite {
    const s = KI_SEITEN.find((x) => x.pfad === pfad);
    if (!s) throw new Error(`Unbekannte KI-Seite: ${pfad}`);
    return s;
}
