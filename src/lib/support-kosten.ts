// Preislogik für den Support-Kostenrechner auf /it-support.
// Nur reale Preise (Stand Preisliste): Remote CHF 130/h (15-Min-Takt,
// Mindestverrechnung 15 Min), Vor-Ort KMU CHF 157/h (Mindestverrechnung 30 Min),
// Anfahrtspauschale CHF 50 (Winterthur und Andelfingen: keine).
// Zuschläge: Mo–Fr 17–23 Uhr +25 %, Sa/So/Feiertage +50 %.

export type Zeitfenster = 'buerozeiten' | 'abend' | 'wochenende';
export type Region = 'winterthur-andelfingen' | 'uebrige-deutschschweiz';

export const REMOTE_STUNDENSATZ = 130;
export const VOR_ORT_STUNDENSATZ = 157;
export const ANFAHRT_PAUSCHALE = 50;

const ZUSCHLAG_FAKTOR: Record<Zeitfenster, number> = {
    buerozeiten: 1,
    abend: 1.25,
    wochenende: 1.5,
};

// Kaufmännische Rundung auf 5 Rappen (Schweizer Kleinmünze)
function rundeAufFuenfRappen(betrag: number): number {
    return Math.round(betrag * 20) / 20;
}

export interface PreisSpanne {
    von: number;
    bis: number;
}

// Typischer Remote-Einsatz: 15–60 Minuten im 15-Minuten-Takt
export function berechneRemoteSpanne(zeit: Zeitfenster): PreisSpanne {
    const satz = REMOTE_STUNDENSATZ * ZUSCHLAG_FAKTOR[zeit];
    return {
        von: rundeAufFuenfRappen(satz / 4),
        bis: rundeAufFuenfRappen(satz),
    };
}

// Typischer Vor-Ort-Einsatz: 1–2 Stunden (Mindestverrechnung 30 Minuten).
// Die Anfahrtspauschale wird separat ausgewiesen, nicht in die Spanne eingerechnet.
export function berechneVorOrtSpanne(zeit: Zeitfenster, region: Region): PreisSpanne & { anfahrt: number } {
    const satz = VOR_ORT_STUNDENSATZ * ZUSCHLAG_FAKTOR[zeit];
    return {
        von: rundeAufFuenfRappen(satz),
        bis: rundeAufFuenfRappen(satz * 2),
        anfahrt: region === 'uebrige-deutschschweiz' ? ANFAHRT_PAUSCHALE : 0,
    };
}

export function formatCHF(betrag: number): string {
    const [franken, rappen] = betrag.toFixed(2).split('.');
    const mitTausender = franken.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `CHF ${mitTausender}.${rappen}`;
}
