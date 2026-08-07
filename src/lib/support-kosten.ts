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

// ---------------------------------------------------------------------------
// RICHTPREISE - vom Inhaber am 07.08.2026 ausdruecklich freigegeben
// («ja mache das mit diesen preisen»). Werte gemäss AUFTRAG-010,
// KEINE eigenen Annahmen. Modus «Regelmässige Betreuung» im Kostenrechner.
// ---------------------------------------------------------------------------
// CHF 252 pro Arbeitsplatz/Monat — inbegriffen: Betrieb & Support der
// Arbeitsplätze, bis 3 Server, Netzwerk-Management, Security-Grundschutz, 1 Standort
export const BETREUUNG_PREIS_PRO_ARBEITSPLATZ = 252;
export const BETREUUNG_SERVER_INBEGRIFFEN = 3; // bis 3 Server im Arbeitsplatzpreis enthalten
export const BETREUUNG_PREIS_ZUSATZSERVER = 150; // je Server ab dem 4., pro Monat
export const BETREUUNG_PREIS_ZUSATZSTANDORT = 50; // je Standort ab dem 2., pro Monat
export const BETREUUNG_PREIS_ERWEITERTE_SECURITY_PRO_PLATZ = 15; // pro Arbeitsplatz/Monat
export const BETREUUNG_MINIMUM = 200; // Untergrenze: nie unter CHF 200/Mt.
// Vor-Ort-Support-Wunsch und Microsoft 365 ändern den Richtpreis NICHT
// (fliessen nur als Info in die Anfrage-Mail).

export interface BetreuungKonfiguration {
    arbeitsplaetze: number; // 1–100
    standorte: number; // 1–10
    server: number; // 0–10
    erweiterteSecurity: boolean;
}

export interface BetreuungPosition {
    label: string;
    preis: number;
}

export interface BetreuungRichtpreis {
    positionen: BetreuungPosition[];
    summe: number; // monatlich, Untergrenze CHF 200 angewendet
}

export function berechneBetreuungRichtpreis(konfig: BetreuungKonfiguration): BetreuungRichtpreis {
    const positionen: BetreuungPosition[] = [
        {
            label: `${konfig.arbeitsplaetze} Arbeitsplätze × CHF ${BETREUUNG_PREIS_PRO_ARBEITSPLATZ} (Betrieb, Support, Verwaltung)`,
            preis: konfig.arbeitsplaetze * BETREUUNG_PREIS_PRO_ARBEITSPLATZ,
        },
    ];

    const zusatzServer = Math.max(0, konfig.server - BETREUUNG_SERVER_INBEGRIFFEN);
    if (zusatzServer > 0) {
        positionen.push({
            label: `${zusatzServer} Zusatzserver (ab dem 4.) × CHF ${BETREUUNG_PREIS_ZUSATZSERVER}`,
            preis: zusatzServer * BETREUUNG_PREIS_ZUSATZSERVER,
        });
    }

    const zusatzStandorte = Math.max(0, konfig.standorte - 1);
    if (zusatzStandorte > 0) {
        positionen.push({
            label: `${zusatzStandorte} Zusatzstandorte (ab dem 2.) × CHF ${BETREUUNG_PREIS_ZUSATZSTANDORT}`,
            preis: zusatzStandorte * BETREUUNG_PREIS_ZUSATZSTANDORT,
        });
    }

    if (konfig.erweiterteSecurity) {
        positionen.push({
            label: `Erweiterte Security (Überwachung & Alarmierung): ${konfig.arbeitsplaetze} × CHF ${BETREUUNG_PREIS_ERWEITERTE_SECURITY_PRO_PLATZ}`,
            preis: konfig.arbeitsplaetze * BETREUUNG_PREIS_ERWEITERTE_SECURITY_PRO_PLATZ,
        });
    }

    const summe = Math.max(
        positionen.reduce((s, p) => s + p.preis, 0),
        BETREUUNG_MINIMUM
    );
    return { positionen, summe };
}
