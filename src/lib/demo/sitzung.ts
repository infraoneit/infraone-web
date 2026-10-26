/**
 * Sitzung des Demo-Widgets (AUFTRAG-102, Teil 3): Logo, Farben und Profil gehören
 * immer zur Scan-Kennung der LAUFENDEN Sitzung.
 *
 * - Jeder Scan-Start («Assistent bauen», «Andere Website») beginnt einen neuen Lauf;
 *   Antworten eines früheren Laufs werden verworfen (Race: Antwort A kommt nach
 *   dem Start von B).
 * - Die Scan-Antwort bindet die Scan-Kennung an den Lauf; Profil-Antworten zählen
 *   nur mit derselben `scan_id`, Logos nur mit dem Pfad `/api/demo/bild/<scan_id>/<n>`.
 *
 * Reine Funktionen ohne React (Einheitstests in scripts/demo-einheit-test.mjs);
 * das Widget hält die Sitzung in einem Ref.
 */

export const SCAN_ID_MUSTER = /^s-[a-z0-9]{16}$/;

export interface Sitzung {
    /** fortlaufende Nummer des Scan-Starts */
    lauf: number;
    /** Scan-Kennung, sobald die Scan-Antwort des Laufs da ist */
    scanId: string | null;
}

export const LEERE_SITZUNG: Sitzung = { lauf: 0, scanId: null };

/** Präfix aller Logos eines Scans (Proxy-Pfad mit der Scan-Kennung im Pfad). */
export function logoPfadPraefix(scanId: string): string {
    return `/api/demo/bild/${encodeURIComponent(scanId)}/`;
}

/** Neuer Lauf: frühere Antworten gelten ab jetzt als veraltet. */
export function neueSitzung(vorher: Sitzung = LEERE_SITZUNG): Sitzung {
    return { lauf: vorher.lauf + 1, scanId: null };
}

/** Gehört etwas (noch) zur laufenden Sitzung? Mit `scanId` zusätzlich: gleiche Scan-Kennung. */
export function istAktuell(s: Sitzung, lauf: number, scanId?: string | null): boolean {
    if (s.lauf !== lauf) return false;
    return scanId === undefined || (!!scanId && s.scanId === scanId);
}

/**
 * Scan-Antwort an den Lauf binden. null, wenn der Lauf vorbei ist (veraltete Antwort),
 * die Kennung ungültig ist oder schon eine ANDERE Kennung gebunden wurde.
 */
export function bindeScan(s: Sitzung, lauf: number, scanId: unknown): Sitzung | null {
    if (s.lauf !== lauf || typeof scanId !== 'string' || !SCAN_ID_MUSTER.test(scanId)) return null;
    if (s.scanId && s.scanId !== scanId) return null;
    return { lauf, scanId };
}

/** Profil-Antwort passt nur zum gebundenen Scan desselben Laufs. */
export function profilPasst(s: Sitzung, lauf: number, antwort: { scan_id?: unknown } | null | undefined): boolean {
    return !!antwort && istAktuell(s, lauf) && !!s.scanId && antwort.scan_id === s.scanId;
}

/** Nur Logos, deren Proxy-Pfad die Scan-Kennung trägt (nie ein Bild eines anderen Scans). */
export function logosDesScans<T extends { src: string }>(logos: T[] | null | undefined, scanId: string): T[] {
    const praefix = logoPfadPraefix(scanId);
    return (logos ?? []).filter((l) => typeof l?.src === 'string' && l.src.startsWith(praefix) && /^\d+$/.test(l.src.slice(praefix.length)));
}
