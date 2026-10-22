/**
 * Gespeicherte Scans der KI-Demo (`scan/{id}`, Lebensdauer 2 h).
 */
import { leseGueltig, speicher } from './speicher';
import { isoZuerich, zufall } from './api';
import type { Extrakt, Profil, ProfilQuelle, ScanGespeichert, Schritt } from './typen';

export const SCAN_TTL_MS = 2 * 60 * 60 * 1000;
export const SCAN_ID_RE = /^s-[a-z0-9]{16}$/;

export type ScanMitVersuchen = ScanGespeichert & { ki_versuche: number };

/** Neue, unvorhersehbare Scan-Kennung (16 Zufallszeichen). */
export function neueScanId(): string {
    return `s-${zufall(16)}`;
}

export async function speichereNeuenScan(daten: {
    id?: string;
    extrakt: Extrakt;
    profil: Profil;
    profil_quelle: ProfilQuelle;
    assistent_weiblich: boolean;
    schritte: Schritt[];
    dauer_ms: number;
}): Promise<ScanMitVersuchen> {
    const jetzt = Date.now();
    const { id, ...rest } = daten;
    const scan: ScanMitVersuchen = {
        id: id && SCAN_ID_RE.test(id) ? id : neueScanId(),
        erstellt: isoZuerich(new Date(jetzt)),
        ablauf: jetzt + SCAN_TTL_MS,
        profil_ms: null,
        ki_versuche: 0,
        ...rest,
    };
    await speicher().schreibe(`scan/${scan.id}`, scan);
    return scan;
}

export async function leseScan(id: string): Promise<ScanMitVersuchen | null> {
    if (!SCAN_ID_RE.test(id)) return null;
    return leseGueltig<ScanMitVersuchen>(`scan/${id}`);
}

export async function speichereScan(scan: ScanMitVersuchen): Promise<void> {
    await speicher().schreibe(`scan/${scan.id}`, scan);
}
