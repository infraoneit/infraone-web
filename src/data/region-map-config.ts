// AUFTRAG-016, Baustein A: Konfiguration der RegionMap-Komponente.
// Je IT-Support-Region: Kanton (Key in region-geo.json), Seen (nur diese IDs rendern),
// HQ (Standort InfraOne) und Ziel-Orte mit Fahrzeit-Badges.
//
// EHRLICHKEITSREGEL: Ein Minutenwert steht nur dann hier, wenn GENAU dieser Wert
// woertlich in content/leistungen/it-support-regions/<region>.json vorkommt.
// Quellenbelege pro Region stehen als Kommentar bei jedem Wert.
// dx/dy = Offset der Badge-Pille (obere linke Ecke) relativ zum Orts-Punkt in SVG-Koordinaten.

export interface RegionMapZiel {
    /** Key in projectCities des Kantons (region-geo.json) */
    cityKey: string;
    /** Anzeigename (falls abweichend von cityKey) */
    label?: string;
    /** Minutenwert ohne Apostroph, z. B. '15' oder '20–25'; null = Badge nur mit Ortsname */
    minuten: string | null;
    /** Quellenbeleg (JSON-Feld + Fundstelle) */
    quelle: string | null;
    dx: number;
    dy: number;
}

export interface RegionMapConfig {
    cantonKey: 'zh' | 'sh' | 'sg' | 'tg';
    /** Regionsname fuer aria-label, z. B. 'Zuerich' */
    regionName: string;
    /** Nur diese See-IDs aus region-geo.json rendern */
    lakeIds: number[];
    hq: { name: string; cityKey: string; dx: number; dy: number };
    ziele: RegionMapZiel[];
}

export const regionMapConfigs: Record<string, RegionMapConfig> = {
    winterthur: {
        cantonKey: 'zh',
        regionName: 'Winterthur',
        lakeIds: [9040, 9050],
        hq: { name: 'Winterthur', cityKey: 'Winterthur', dx: -40, dy: -30 },
        ziele: [
            // Quelle: localFaqAnswer "Im Stadtgebiet Winterthur und in Andelfingen sind wir meist innert 30 Minuten bei Ihnen"
            { cityKey: 'Andelfingen', minuten: '30', quelle: 'localFaqAnswer: "...in Andelfingen... innert 30 Minuten"', dx: 14, dy: -28 },
            { cityKey: 'Kloten', minuten: null, quelle: null, dx: 12, dy: -8 },
            { cityKey: 'Frauenfeld', minuten: null, quelle: null, dx: 12, dy: 14 },
            { cityKey: 'Weinfelden', minuten: null, quelle: null, dx: 12, dy: -8 },
        ],
    },
    zuerich: {
        cantonKey: 'zh',
        regionName: 'Zürich',
        lakeIds: [9040, 9050],
        hq: { name: 'Winterthur', cityKey: 'Winterthur', dx: 14, dy: -30 },
        ziele: [
            // Quelle: description "Anfahrt aus Winterthur 25 Minuten" (auch stats[1] "25 Min", localBenefits[0] "25 Min ab Winterthur")
            { cityKey: 'Zürich', minuten: '25', quelle: 'description: "Anfahrt aus Winterthur 25 Minuten"', dx: -92, dy: -8 },
            { cityKey: 'Kloten', minuten: null, quelle: null, dx: 12, dy: -22 },
            { cityKey: 'Dübendorf', minuten: null, quelle: null, dx: 14, dy: 8 },
            { cityKey: 'Uster', minuten: null, quelle: null, dx: 12, dy: -4 },
        ],
    },
    schaffhausen: {
        cantonKey: 'sh',
        regionName: 'Schaffhausen',
        lakeIds: [9326],
        hq: { name: 'Schaffhausen', cityKey: 'Schaffhausen', dx: 14, dy: -32 },
        ziele: [
            // Quelle: intro + localFaqAnswer "von Neuhausen am Rheinfall in 10 [Minuten]"
            { cityKey: 'Neuhausen', label: 'Neuhausen a. R.', minuten: '10', quelle: 'intro/localFaqAnswer: "von Neuhausen am Rheinfall in 10"', dx: -118, dy: 14 },
            // Quelle: intro + localFaqAnswer "von Beringen oder Hallau im Klettgau in 20 bis 25 Minuten"
            { cityKey: 'Beringen', minuten: '20–25', quelle: 'intro/localFaqAnswer: "von Beringen... in 20 bis 25 Minuten"', dx: -124, dy: -8 },
            { cityKey: 'Thayngen', minuten: null, quelle: null, dx: 12, dy: -10 },
            { cityKey: 'Stein am Rhein', minuten: null, quelle: null, dx: -132, dy: -6 },
        ],
    },
    'st-gallen': {
        cantonKey: 'sg',
        regionName: 'St. Gallen',
        lakeIds: [9050, 9267, 9326],
        hq: { name: 'Winterthur', cityKey: 'Winterthur', dx: 12, dy: -28 },
        ziele: [
            // Quelle: stats[1] "Anfahrt ab Winterthur 35 Min" + localBenefits[0] "Anfahrt 35 Min ab Winterthur" + intro "S-Bahn 35 Minuten via Wil"
            { cityKey: 'St. Gallen', minuten: '35', quelle: 'stats[1]: "Anfahrt ab Winterthur 35 Min"', dx: 12, dy: 10 },
            { cityKey: 'Wil', minuten: null, quelle: null, dx: 10, dy: -26 },
            { cityKey: 'Gossau', minuten: null, quelle: null, dx: -86, dy: -26 },
            { cityKey: 'Rorschach', minuten: null, quelle: null, dx: 12, dy: -26 },
        ],
    },
    thurgau: {
        cantonKey: 'tg',
        regionName: 'Thurgau',
        lakeIds: [9326],
        hq: { name: 'Tägerwilen', cityKey: 'Tägerwilen', dx: 14, dy: -32 },
        ziele: [
            // Quelle: intro + localFaqAnswer "nach Kreuzlingen 15 Minuten" / "Kreuzlingen in 15 Minuten"
            { cityKey: 'Kreuzlingen', minuten: '15', quelle: 'intro/localFaqAnswer: "Kreuzlingen in 15 Minuten"', dx: 16, dy: 8 },
            // Quelle: intro + localFaqAnswer "nach Frauenfeld 30" / "in Frauenfeld in 30"
            { cityKey: 'Frauenfeld', minuten: '30', quelle: 'intro/localFaqAnswer: "nach Frauenfeld 30"', dx: -108, dy: -8 },
            // Quelle: intro + localFaqAnswer "nach Romanshorn 30" / "in Romanshorn in 30"
            { cityKey: 'Romanshorn', minuten: '30', quelle: 'intro/localFaqAnswer: "nach Romanshorn 30"', dx: -60, dy: -34 },
            // Quelle: intro + localFaqAnswer "nach Amriswil 35" / "in Amriswil in 35"
            { cityKey: 'Amriswil', minuten: '35', quelle: 'intro/localFaqAnswer: "nach Amriswil 35"', dx: 12, dy: 12 },
            // Quelle: intro + localFaqAnswer "nach Weinfelden ebenfalls 35 Minuten" / "in Weinfelden in 35 Minuten"
            { cityKey: 'Weinfelden', minuten: '35', quelle: 'intro/localFaqAnswer: "nach Weinfelden ebenfalls 35"', dx: -110, dy: -8 },
        ],
    },
    andelfingen: {
        cantonKey: 'zh',
        regionName: 'Andelfingen',
        lakeIds: [9040, 9050],
        hq: { name: 'Kleinandelfingen', cityKey: 'Kleinandelfingen', dx: 16, dy: -32 },
        ziele: [
            // Quelle: intro + localFaqAnswer "Vom Hauptort Andelfingen sind wir in 5 Minuten bei Ihnen"
            { cityKey: 'Andelfingen', minuten: '5', quelle: 'intro/localFaqAnswer: "Andelfingen in 5 Minuten"', dx: 16, dy: -6 },
            // Quelle: intro + localFaqAnswer "von Marthalen oder Henggart in 10 [Minuten]"
            { cityKey: 'Marthalen', minuten: '10', quelle: 'intro/localFaqAnswer: "von Marthalen... in 10"', dx: -108, dy: -34 },
            { cityKey: 'Henggart', minuten: '10', quelle: 'intro/localFaqAnswer: "...oder Henggart in 10"', dx: 16, dy: 14 },
            { cityKey: 'Flaach', minuten: null, quelle: null, dx: -78, dy: -4 },
            { cityKey: 'Rheinau', minuten: null, quelle: null, dx: -84, dy: 12 },
        ],
    },
};
