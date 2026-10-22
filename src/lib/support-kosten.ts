// Preislogik für den Support-Kostenrechner auf /it-support.
// Nur reale Preise (Stand Preisliste): Remote CHF 145/h (15-Min-Takt,
// Mindestverrechnung 15 Min), Vor-Ort KMU CHF 157/h (Mindestverrechnung 30 Min),
// Anfahrtspauschale CHF 50 (Winterthur und Andelfingen: keine).
// Zuschläge: Mo–Fr 17–23 Uhr +25 %, Sa/So/Feiertage +50 %.

export type Zeitfenster = 'buerozeiten' | 'abend' | 'wochenende';
export type Region = 'winterthur-andelfingen' | 'uebrige-deutschschweiz';

export const REMOTE_STUNDENSATZ = 145;
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
// RICHTPREISE - überarbeitet am 31.08.2026 auf Anweisung des Inhabers:
// Der Dienstleistungsvertrag ist KEIN Komplett-Outsourcing (kein Managed
// Workplace, keine virtuellen Arbeitsplätze) — der alte Preis von CHF 252
// pro Arbeitsplatz war dafür viel zu hoch. Neues Modell: Grundpauschale für
// Monitoring, Verwaltung und Erreichbarkeit + kleiner Betrag pro Gerät;
// Supporteinsätze und Dienstleistungen werden nach Aufwand zum Stundensatz
// verrechnet. Modus «Regelmässige Betreuung» im Kostenrechner.
// ---------------------------------------------------------------------------
// Grundpauschale (inkl. 1. Arbeitsplatz): Monitoring & Alarmierung,
// Patch-/Update-Management, Verwaltung, direkte Erreichbarkeit,
// Security-Grundschutz — entspricht dem kommunizierten «ab CHF 200/Monat».
export const BETREUUNG_GRUNDPAUSCHALE = 200;
export const BETREUUNG_PREIS_WEITERER_ARBEITSPLATZ = 40; // je Arbeitsplatz ab dem 2., pro Monat
export const BETREUUNG_PREIS_PRO_SERVER = 50; // je Server, pro Monat
export const BETREUUNG_PREIS_ZUSATZSTANDORT = 50; // je Standort ab dem 2., pro Monat
export const BETREUUNG_PREIS_ERWEITERTE_SECURITY_PRO_PLATZ = 15; // pro Arbeitsplatz/Monat
export const BETREUUNG_MINIMUM = 200; // Untergrenze: nie unter CHF 200/Mt.
// Netzwerk-Management, Vor-Ort-Support-Wunsch und Microsoft 365 ändern den
// Richtpreis NICHT (fliessen nur als Info in die Anfrage-Mail).

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
            label: `Grundpauschale (Monitoring, Verwaltung, Erreichbarkeit — inkl. 1 Arbeitsplatz)`,
            preis: BETREUUNG_GRUNDPAUSCHALE,
        },
    ];

    const weitereArbeitsplaetze = Math.max(0, konfig.arbeitsplaetze - 1);
    if (weitereArbeitsplaetze > 0) {
        positionen.push({
            label: `${weitereArbeitsplaetze} weitere Arbeitsplätze × CHF ${BETREUUNG_PREIS_WEITERER_ARBEITSPLATZ}`,
            preis: weitereArbeitsplaetze * BETREUUNG_PREIS_WEITERER_ARBEITSPLATZ,
        });
    }

    if (konfig.server > 0) {
        positionen.push({
            label: `${konfig.server} Server × CHF ${BETREUUNG_PREIS_PRO_SERVER}`,
            preis: konfig.server * BETREUUNG_PREIS_PRO_SERVER,
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
