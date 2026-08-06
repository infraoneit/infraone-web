// Preislogik für den Modus «Fixkosten senken» im Kostenrechner (AUFTRAG-009).
// Ausschliesslich Listenpreise (Quelle: cloud-telefonanlagen.ch).
// Nichts runden, nichts erfinden – die Telefonie-Summe bis 30 Benutzer ist
// eine exakte Listenpreis-Summe, weil die Benutzerpakete Pauschalen pro Stufe
// sind (vom Inhaber bestätigt, jeweils bei 24 Monaten Laufzeit).

export type FlatrateOption = 'keine' | 'ch' | 'cheu';

// Anzahl Rufnummern (DIDs): wählbar in 5er-Blöcken (AUFTRAG-010)
export type RufnummernOption = 5 | 10 | 15 | 20;
export const RUFNUMMERN_OPTIONEN: RufnummernOption[] = [5, 10, 15, 20];

export const PREIS_INTERNET_1GBIT = 49;
export const PREIS_FESTE_IP = 10;
export const PREIS_VPBX_BASIC = 15; // bis 10 Benutzer, Grundgebühr pro Monat
export const PREIS_VPBX_PLUS = 25; // ab 11 Benutzer (bis 150), Grundgebühr pro Monat
export const PREIS_FLATRATE_CH = 19; // 1000 Min Festnetz / 200 Min Mobil
export const PREIS_FLATRATE_CH_EU = 22; // 1000 Min Festnetz / 300 Min Mobil
export const PREIS_DID_BLOCK = 10; // CHF 10.– pro 5er-Block Rufnummern (DIDs) pro Monat

export const MAX_BENUTZER = 150;
export const OFFERTE_AB_BENUTZER = 30; // darüber: individuelle Offerte, keine Summe

// Benutzerpaket-Pauschale pro Stufe. null = über 30 Benutzer (Offerten-Pfad).
export function benutzerPaketPreis(benutzer: number): number | null {
    if (benutzer < 1) return null;
    if (benutzer <= 5) return 25;
    if (benutzer <= 10) return 35;
    if (benutzer <= 20) return 55;
    if (benutzer <= 30) return 75;
    return null;
}

function stufenLabel(benutzer: number): string {
    if (benutzer <= 5) return '1–5';
    if (benutzer <= 10) return '6–10';
    if (benutzer <= 20) return '11–20';
    return '21–30';
}

export interface PaketPosition {
    label: string;
    preis: number;
}

export interface InfraOnePaket {
    positionen: PaketPosition[];
    summe: number;
}

// DIDs kommen in 5er-Blöcken: CHF 10.– pro 5er-Block/Monat (5/10/15/20 → 10/20/30/40)
export function didBlockPreis(rufnummern: number): number {
    return Math.ceil(rufnummern / 5) * PREIS_DID_BLOCK;
}

// null = über 30 Benutzer → keine Summe anzeigen, Offerten-Pfad.
export function berechneInfraOnePaket(
    benutzer: number,
    flatrate: FlatrateOption,
    internetDazu: boolean,
    rufnummern: RufnummernOption = 5
): InfraOnePaket | null {
    const paketPreis = benutzerPaketPreis(benutzer);
    if (paketPreis === null) return null;

    const positionen: PaketPosition[] = [];
    if (benutzer <= 10) {
        positionen.push({ label: 'vPBX BASIC Grundgebühr (bis 10 Benutzer)', preis: PREIS_VPBX_BASIC });
    } else {
        positionen.push({ label: 'vPBX PLUS Grundgebühr (ab 11 Benutzer)', preis: PREIS_VPBX_PLUS });
    }
    positionen.push({ label: `Benutzerpaket ${stufenLabel(benutzer)} (Pauschale)`, preis: paketPreis });
    if (flatrate === 'ch') {
        positionen.push({ label: 'Flatrate CH (1000 Min Festnetz / 200 Min Mobil)', preis: PREIS_FLATRATE_CH });
    } else if (flatrate === 'cheu') {
        positionen.push({ label: 'Flatrate CH & EU (1000 Min Festnetz / 300 Min Mobil)', preis: PREIS_FLATRATE_CH_EU });
    }
    positionen.push({ label: `${rufnummern} Rufnummern (DIDs)`, preis: didBlockPreis(rufnummern) });
    if (internetDazu) {
        positionen.push({ label: 'Internet 1 Gbit/s Glasfaser (iway)', preis: PREIS_INTERNET_1GBIT });
        positionen.push({ label: 'Feste IP-Adresse (iway)', preis: PREIS_FESTE_IP });
    }

    return { positionen, summe: positionen.reduce((s, p) => s + p.preis, 0) };
}

// Ganze Franken mit Schweizer Tausender-Trennzeichen: 3252 → "CHF 3'252"
export function formatCHFGanz(betrag: number): string {
    const gerundet = Math.round(betrag);
    const mitTausender = String(Math.abs(gerundet)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `CHF ${gerundet < 0 ? '−' : ''}${mitTausender}`;
}
