/**
 * Preise KI-Telefonassistent (AUFTRAG-110).
 *
 * EINZIGE Quelle aller Preisangaben des Bereichs /ki-telefonassistent:
 * Preisseite, Preis-Teaser auf der Hub-Seite, FAQ-Antworten, Sitemap
 * (/preise erst nach Freigabe) und robots (noindex bis zur Freigabe).
 *
 * STAND: ENTWURF. Die Werte unten sind Platzhalter des Managers vom 30.10.2026
 * und werden vom Inhaber ersetzt. Solange PREISE_FREIGEGEBEN = false:
 * - sichtbares Band «Entwurf, Preise noch nicht freigegeben» auf /preise und im Teaser
 * - /ki-telefonassistent/preise mit robots noindex und nicht in der Sitemap
 * - keine Angebotsdaten (Offer) im JSON-LD
 *
 * Freigabe: Werte anpassen, PREISE_FREIGEGEBEN auf true setzen, fertig.
 * (public/llms.txt und llms-full.txt nennen bewusst keine Entwurfsbeträge;
 * nach der Freigabe dort die Beträge nachtragen.)
 */

/** Erst auf true setzen, wenn der Inhaber die Preise freigegeben hat. */
export const PREISE_FREIGEGEBEN = false;

/** Text des Entwurfsbands (nur sichtbar, solange PREISE_FREIGEGEBEN = false). */
export const ENTWURF_HINWEIS = 'Entwurf, Preise noch nicht freigegeben';

export const WAEHRUNG = 'CHF';
export const MWST_HINWEIS = 'exkl. MwSt.';
export const LAUFZEIT_HINWEIS = 'monatlich kündbar';

export interface KiPaket {
    id: 'lite' | 'starter' | 'business' | 'enterprise';
    name: string;
    /** CHF pro Monat; null = auf Anfrage */
    preisMonat: number | null;
    /** enthaltene Gesprächsminuten pro Monat; null = individuell */
    minuten: number | null;
    /** ein Satz: für wen */
    fuerWen: string;
    /** Leistungsmerkmale, die das Paket ausmachen */
    merkmale: string[];
    /** optisch hervorgehoben */
    empfohlen?: boolean;
}

export const PAKETE: KiPaket[] = [
    {
        id: 'lite',
        name: 'Lite',
        preisMonat: 49,
        minuten: 100,
        fuerWen: 'Für kleine Betriebe, die vor allem keinen Anruf mehr verpassen wollen.',
        merkmale: ['100 Gesprächsminuten pro Monat', '1 Telefonnummer'],
    },
    {
        id: 'starter',
        name: 'Starter',
        preisMonat: 149,
        minuten: 500,
        fuerWen: 'Für Betriebe, die am Telefon Termine vergeben und bestätigen.',
        merkmale: ['500 Gesprächsminuten pro Monat', 'Termine im Microsoft-365-Kalender', 'SMS-Bestätigung an Anrufende'],
        empfohlen: true,
    },
    {
        id: 'business',
        name: 'Business',
        preisMonat: 299,
        minuten: 1500,
        fuerWen: 'Für Betriebe mit vielen Anrufen, Pikettdienst oder mehreren Teams.',
        merkmale: [
            '1500 Gesprächsminuten pro Monat',
            '3 gleichzeitige Gespräche',
            'Weiterleitung an eine Person',
            'Notfallmeldung an Ihre Notfallnummer',
            'Mehrere Agenten, z. B. ausserhalb der Öffnungszeiten',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        preisMonat: null,
        minuten: null,
        fuerWen: 'Für Unternehmen mit eigenen Systemen, Telefonanlage und mehreren Standorten.',
        merkmale: ['Eigene Integrationen', 'Anbindung an die vPBX', 'Mehrere Standorte'],
    },
];

/** Leistungen, die in jedem Paket enthalten sind (Fakten aus AUFTRAG-110, Abschnitt 3). */
export const IN_ALLEN_PAKETEN: string[] = [
    'Antwortet rund um die Uhr',
    'Versteht und spricht Schweizerdeutsch, Hochdeutsch und Englisch',
    'Wissen aus Ihrer Website und Ihren Angaben',
    'Gesprächsnotiz per E-Mail nach jedem Anruf',
    'Transkript und Zusammenfassung statt Aufnahme',
    'Öffnungszeiten und eigener Text ausserhalb',
    'Eigene Nummer behalten (Umleitung) oder neue Nummer',
];

/** Einrichtung, einmalig in CHF */
export const EINRICHTUNG_EINMALIG = 490;

/** Zusatzminute in CHF */
export const PREIS_ZUSATZMINUTE = 0.45;

/** CHF-Betrag im Schweizer Format: 49 → «49», 1590 → «1'590», 0.45 → «0.45» */
export function chf(betrag: number): string {
    const ganz = Number.isInteger(betrag);
    const [vor, nach] = betrag.toFixed(ganz ? 0 : 2).split('.');
    const mitApostroph = vor.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return nach ? `${mitApostroph}.${nach}` : mitApostroph;
}

/** Preis eines Pakets als Text, z. B. «CHF 49» oder «auf Anfrage» */
export function paketPreisText(p: KiPaket): string {
    return p.preisMonat === null ? 'auf Anfrage' : `${WAEHRUNG} ${chf(p.preisMonat)}`;
}

/** Kleinster Monatspreis (für «ab CHF …» im Teaser) */
export function abPreis(): number {
    return Math.min(...PAKETE.filter((p) => p.preisMonat !== null).map((p) => p.preisMonat as number));
}
