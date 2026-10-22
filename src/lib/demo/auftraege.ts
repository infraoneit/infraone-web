/**
 * Aufträge (Rückruf-Warteschlange) der KI-Demo (AUFTRAG-092 / 091).
 *
 * - `auftrag/{id}` lebt 24 h; Id `d-YYYYMMDD-` + 16 Zufallszeichen.
 * - `warteschlange/{erstellt_ms}-{id}` ist ein Marker, solange der Auftrag
 *   `wartend` ist — der Orchestrator-Abruf (alle 2 s) liest damit im
 *   Normalfall nur eine leere Liste.
 * - Wartet ein Auftrag länger als 10 Minuten, wird er mit `fehler`
 *   (grund `zeitueberschreitung`) geschlossen: niemand soll Stunden später
 *   überraschend angerufen werden.
 * - Nach `beendet`/`fehler` werden Nummer und Profil aus dem Auftrag
 *   entfernt; das Profil spätestens zum Ablauf des Scans (2 h), wie in der
 *   Datenschutzerklärung zugesagt. Im Auftrag bleiben danach nur Status,
 *   Zeit, Dauer und Zusammenfassung (für die Statusanzeige).
 */
import { leseGueltig, speicher } from './speicher';
import { isoZuerich, tagZuerich, zufall } from './api';
import type { AuftragFuerOrchestrator, AuftragGespeichert, AuftragStatus, Profil, Sprache } from './typen';

export const AUFTRAG_TTL_MS = 24 * 60 * 60 * 1000;
export const WARTEN_MAX_MS = 10 * 60 * 1000;
export const AUFTRAG_ID_RE = /^d-\d{8}-[a-z0-9]{16}$/;

const RANG: Record<AuftragStatus, number> = {
    wartend: 0,
    angenommen: 1,
    waehlt: 2,
    verbunden: 3,
    beendet: 4,
    fehler: 4,
};

const ENDZUSTAND = (s: AuftragStatus) => s === 'beendet' || s === 'fehler';

const markerSchluessel = (a: Pick<AuftragGespeichert, 'erstellt_ms' | 'id'>) =>
    `warteschlange/${String(a.erstellt_ms).padStart(14, '0')}-${a.id}`;

export async function erstelleAuftrag(daten: {
    scan_id: string;
    nummer: string;
    sprache: Sprache;
    profil: Profil;
    profil_bis: number;
}): Promise<AuftragGespeichert> {
    const jetzt = new Date();
    const auftrag: AuftragGespeichert = {
        id: `d-${tagZuerich(jetzt)}-${zufall(16)}`,
        scan_id: daten.scan_id,
        erstellt: isoZuerich(jetzt),
        erstellt_ms: jetzt.getTime(),
        nummer: daten.nummer,
        sprache: daten.sprache,
        profil: daten.profil,
        profil_bis: daten.profil_bis,
        status: 'wartend',
        zeit: isoZuerich(jetzt),
        dauer_s: null,
        zusammenfassung: null,
        grund: null,
        ablauf: jetzt.getTime() + AUFTRAG_TTL_MS,
    };
    await speicher().schreibe(`auftrag/${auftrag.id}`, auftrag);
    await speicher().schreibe(markerSchluessel(auftrag), { id: auftrag.id, ablauf: auftrag.ablauf });
    return auftrag;
}

async function speichere(a: AuftragGespeichert): Promise<void> {
    await speicher().schreibe(`auftrag/${a.id}`, a);
}

/**
 * Fristen anwenden: zu lange wartende Aufträge schliessen (10 min) bzw.
 * schliessen, wenn das Profil abgelaufen ist; Nummer und Profil entfernen,
 * sobald der Auftrag abgeschlossen oder das Profil fällig ist.
 */
async function pruefeFristen(a: AuftragGespeichert): Promise<AuftragGespeichert> {
    const jetzt = Date.now();
    let geaendert = false;
    if (a.status === 'wartend' && (jetzt - a.erstellt_ms > WARTEN_MAX_MS || jetzt > a.profil_bis)) {
        a.status = 'fehler';
        a.grund = 'zeitueberschreitung';
        a.zeit = isoZuerich();
        geaendert = true;
        await speicher().loesche(markerSchluessel(a)).catch(() => undefined);
    }
    if (ENDZUSTAND(a.status) && a.nummer !== null) {
        a.nummer = null;
        geaendert = true;
    }
    if (a.profil !== null && (ENDZUSTAND(a.status) || jetzt > a.profil_bis)) {
        a.profil = null;
        geaendert = true;
    }
    if (geaendert) await speichere(a);
    return a;
}

export async function leseAuftrag(id: string): Promise<AuftragGespeichert | null> {
    if (!AUFTRAG_ID_RE.test(id)) return null;
    const a = await leseGueltig<AuftragGespeichert>(`auftrag/${id}`);
    return a ? pruefeFristen(a) : null;
}

/** Öffentliche Statusansicht: nur Status, keine Nummer, kein Profil. */
export function oeffentlich(a: AuftragGespeichert) {
    return { id: a.id, status: a.status, zeit: a.zeit, dauer_s: a.dauer_s, zusammenfassung: a.zusammenfassung };
}

export function fuerOrchestrator(a: AuftragGespeichert): AuftragFuerOrchestrator {
    return { id: a.id, erstellt: a.erstellt, nummer: a.nummer as string, sprache: a.sprache, profil: a.profil as Profil };
}

/** Long-Polling der Warteschlange: höchstens 20 s (Netlify-Grenze 26 s). */
export const WARTE_MAX_S = 20;

/** Parameter `warte` lesen: ganze Sekunden 0–20, Ungültiges → 0, Grösseres → 20. */
export function warteSekunden(roh: string | null): number {
    const n = Math.floor(Number(roh ?? 0));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(WARTE_MAX_S, n);
}

/** Wartende Aufträge, älteste zuerst, höchstens 5. */
export async function warteschlange(max = 5): Promise<AuftragFuerOrchestrator[]> {
    const marker = (await speicher().liste('warteschlange/')).sort();
    const aus: AuftragFuerOrchestrator[] = [];
    for (const m of marker) {
        if (aus.length >= max) break;
        const id = m.split('-').slice(1).join('-');
        const a = AUFTRAG_ID_RE.test(id) ? await leseAuftrag(id) : null;
        if (!a || a.status !== 'wartend' || !a.nummer || !a.profil) {
            await speicher().loesche(m).catch(() => undefined);
            continue;
        }
        aus.push(fuerOrchestrator(a));
    }
    return aus;
}

export interface StatusMeldung {
    status: AuftragStatus;
    grund: string | null;
    dauer_s: number | null;
    zusammenfassung: string | null;
    zeit: string | null;
}

/** Statusmeldung des Orchestrators übernehmen (nur vorwärts, Endzustände bleiben). */
export async function setzeStatus(id: string, m: StatusMeldung): Promise<{ auftrag: AuftragGespeichert; uebernommen: boolean } | null> {
    const a = await leseAuftrag(id);
    if (!a) return null;
    if (ENDZUSTAND(a.status) || RANG[m.status] < RANG[a.status]) return { auftrag: a, uebernommen: false };
    a.status = m.status;
    a.zeit = m.zeit ?? isoZuerich();
    if (m.grund !== null) a.grund = m.grund;
    if (m.dauer_s !== null) a.dauer_s = m.dauer_s;
    if (m.zusammenfassung !== null) a.zusammenfassung = m.zusammenfassung;
    if (ENDZUSTAND(a.status)) {
        a.nummer = null;
        a.profil = null;
    }
    await speichere(a);
    if (a.status !== 'wartend') await speicher().loesche(markerSchluessel(a)).catch(() => undefined);
    return { auftrag: a, uebernommen: true };
}

/** Wendet die Fristen auf alle gespeicherten Aufträge an (Teil des gelegentlichen Aufräumens). */
export async function auftraegeBereinigen(): Promise<void> {
    for (const k of (await speicher().liste('auftrag/')).slice(0, 500)) {
        await leseAuftrag(k.slice('auftrag/'.length)).catch(() => null);
    }
}
