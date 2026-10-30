/**
 * Speicher der KI-Demo: Netlify Blobs (Store `demo`), lokal ohne Netlify
 * ein Datei-Rückfall unter `.demo-store/` (gitignored).
 *
 * Schlüssel: `scan/{id}`, `auftrag/{id}`, `warteschlange/{ms}-{id}`,
 * `limit/{tag}/{art}-{hash}`, `meta/aufgeraeumt`,
 * `handelsregister/{scan_id}` (AUFTRAG-109: Register-Ergebnisse und Bestätigung je Scan,
 * eigener Schlüssel — der Profil-Schritt schreibt `scan/{id}` parallel neu).
 * Lebensdauer über das Feld `ablauf` (Epoch-ms) im gespeicherten Wert;
 * abgelaufene Einträge gelten beim Lesen als nicht vorhanden.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getStore } from '@netlify/blobs';

interface Speicher {
    art: 'blobs' | 'datei';
    lese<T>(schluessel: string): Promise<T | null>;
    schreibe(schluessel: string, wert: unknown): Promise<void>;
    loesche(schluessel: string): Promise<void>;
    liste(praefix: string): Promise<string[]>;
}

const SCHLUESSEL_RE = /^[a-z0-9][a-z0-9._:-]*(\/[a-z0-9][a-z0-9._:-]*)*$/i;

function pruefeSchluessel(s: string): void {
    if (!SCHLUESSEL_RE.test(s) || s.includes('..')) throw new Error('Ungültiger Speicherschlüssel');
}

/**
 * AUFTRAG-102: Fehler des Blobs-Speichers ins Function-Log schreiben (Art, Bereich, Fehlertext —
 * kein Token, kein vollständiger Schlüssel) und weiterwerfen. Vorher endeten sie als leere HTTP-500.
 */
async function mitLog<T>(art: string, schluessel: string, f: () => Promise<T>): Promise<T> {
    try {
        return await f();
    } catch (e) {
        console.error(`[demo/speicher] Blobs ${art} ${schluessel.split('/')[0]}/…: ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}`);
        throw e;
    }
}

function blobSpeicher(): Speicher | null {
    try {
        const store = getStore({ name: 'demo', consistency: 'strong' });
        return {
            art: 'blobs',
            async lese<T>(s: string) {
                pruefeSchluessel(s);
                return mitLog('lesen', s, async () => ((await store.get(s, { type: 'json' })) as T | null) ?? null);
            },
            async schreibe(s, wert) {
                pruefeSchluessel(s);
                await mitLog('schreiben', s, () => store.setJSON(s, wert));
            },
            async loesche(s) {
                pruefeSchluessel(s);
                await mitLog('löschen', s, () => store.delete(s));
            },
            async liste(praefix) {
                const { blobs } = await mitLog('auflisten', praefix, () => store.list({ prefix: praefix }));
                return blobs.map((b) => b.key);
            },
        };
    } catch {
        // MissingBlobsEnvironmentError: lokal ohne Netlify → Datei-Rückfall
        return null;
    }
}

function dateiSpeicher(): Speicher {
    // DEMO_STORE_DIR: eigener Ordner (z. B. für isolierte Tests neben einem laufenden Dev-Server)
    const basis = process.env.DEMO_STORE_DIR ? path.resolve(process.env.DEMO_STORE_DIR) : path.join(process.cwd(), '.demo-store');
    const datei = (s: string) => path.join(basis, ...s.split('/')) + '.json';
    return {
        art: 'datei',
        async lese<T>(s: string) {
            pruefeSchluessel(s);
            try {
                return JSON.parse(await fs.readFile(datei(s), 'utf8')) as T;
            } catch {
                return null;
            }
        },
        async schreibe(s, wert) {
            pruefeSchluessel(s);
            const ziel = datei(s);
            await fs.mkdir(path.dirname(ziel), { recursive: true });
            const tmp = `${ziel}.${process.pid}.${Date.now()}.tmp`;
            await fs.writeFile(tmp, JSON.stringify(wert), 'utf8');
            await fs.rename(tmp, ziel);
        },
        async loesche(s) {
            pruefeSchluessel(s);
            await fs.rm(datei(s), { force: true });
        },
        async liste(praefix) {
            const aus: string[] = [];
            const start = path.join(basis, ...praefix.split('/').filter(Boolean));
            const lauf = async (ordner: string) => {
                let eintraege: import('node:fs').Dirent[];
                try {
                    eintraege = await fs.readdir(ordner, { withFileTypes: true });
                } catch {
                    return;
                }
                for (const e of eintraege) {
                    const voll = path.join(ordner, e.name);
                    if (e.isDirectory()) await lauf(voll);
                    else if (e.name.endsWith('.json')) {
                        aus.push(path.relative(basis, voll).split(path.sep).join('/').replace(/\.json$/, ''));
                    }
                }
            };
            await lauf(start);
            return aus.filter((k) => k.startsWith(praefix)).sort();
        },
    };
}

let dateiInstanz: Speicher | null = null;

/**
 * Speicher für DIESE Anfrage.
 *
 * AUFTRAG-102: Der Blobs-Store wird bei jedem Zugriff neu aus dem Kontext der
 * laufenden Anfrage gebaut und NICHT über Anfragen hinweg zwischengespeichert:
 * `getStore()` übernimmt Token und Edge-Adressen aus `globalThis.netlifyBlobsContext`,
 * den die Netlify-Laufzeit je Aufruf setzt. Ein Modul-Singleton behält in einer
 * warmen Function den Kontext eines früheren Aufrufs; auf dem Branch-Deploy lieferten
 * die Routen mit Speicherzugriff (Scan, Profil, Auftrag, Logo aus dem Scan) zeitweise
 * HTTP 500 ohne Text, im Wechsel mit Erfolgen (gemessen 26.10.2026,
 * auftraege/ergebnisse/A102-messung.md).
 * Nur der lokale Datei-Rückfall bleibt ein Singleton.
 */
export function speicher(): Speicher {
    const blobs = blobSpeicher();
    if (blobs) return blobs;
    if (!dateiInstanz) dateiInstanz = dateiSpeicher();
    return dateiInstanz;
}

/** Liest einen Eintrag und behandelt abgelaufene als nicht vorhanden (und löscht sie). */
export async function leseGueltig<T extends { ablauf: number }>(schluessel: string): Promise<T | null> {
    const wert = await speicher().lese<T>(schluessel);
    if (!wert) return null;
    if (typeof wert.ablauf === 'number' && wert.ablauf < Date.now()) {
        await speicher().loesche(schluessel).catch(() => undefined);
        return null;
    }
    return wert;
}

const AUFRAEUMEN_ALLE_MS = 30 * 60 * 1000;

/** Löscht abgelaufene Scans/Aufträge/Zähler — höchstens alle 30 Minuten. Liefert true, wenn aufgeräumt wurde. */
export async function aufraeumenGelegentlich(): Promise<boolean> {
    const s = speicher();
    const meta = await s.lese<{ zeit: number }>('meta/aufgeraeumt');
    if (meta && Date.now() - meta.zeit < AUFRAEUMEN_ALLE_MS) return false;
    await s.schreibe('meta/aufgeraeumt', { zeit: Date.now() });
    const jetzt = Date.now();
    for (const praefix of ['scan/', 'auftrag/', 'limit/', 'handelsregister/']) {
        const schluessel = await s.liste(praefix);
        for (const k of schluessel.slice(0, 500)) {
            const wert = await s.lese<{ ablauf?: number }>(k);
            if (!wert || (typeof wert.ablauf === 'number' && wert.ablauf < jetzt)) await s.loesche(k).catch(() => undefined);
        }
    }
    return true;
}
