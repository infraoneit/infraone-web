/**
 * POST /api/demo/faehigkeiten  Body {scan_id} → {faehigkeiten_en: [3], quelle}
 *
 * AUFTRAG-098: Die Assistenten-Karte erscheint auf Englisch, wenn der Besucher
 * «English» wählt. Die drei Fähigkeiten des Profils werden dann — und nur dann —
 * übersetzt: Standard-Fähigkeiten fest, KI-Fähigkeiten mit einem kleinen
 * KI-Aufruf (gpt-4.1-mini). Der Profil-Aufruf bleibt dadurch unverändert
 * (Qualität und Dauer wie A-096). Ergebnis wird im Scan gespeichert (passend
 * zu den deutschen Fähigkeiten), höchstens zwei KI-Versuche je Scan; fällt die
 * KI aus, gilt die englische Standardliste. Nur Anzeige — nicht Teil des
 * Auftrags an die Anlage.
 */
import { antwort, fehler, leseJson, MELDUNG } from '@/lib/demo/api';
import { faehigkeitenAufEnglisch, faehigkeitenEnglisch } from '@/lib/demo/profil';
import { leseScan, speichereScan } from '@/lib/demo/scans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function POST(req: Request) {
    const body = await leseJson(req, 1_000);
    const scan = await leseScan(typeof body?.scan_id === 'string' ? body.scan_id : '');
    if (!scan) return fehler(MELDUNG.scanAbgelaufen, 404);
    const de = scan.profil.faehigkeiten.slice(0, 3);
    const gleich = (a: string[] | undefined) => !!a && a.length === de.length && a.every((x, i) => x === de[i]);
    if (scan.karte_en && gleich(scan.karte_en.de) && scan.karte_en.quelle !== 'rueckfall') {
        return antwort({ faehigkeiten_en: scan.karte_en.en, quelle: scan.karte_en.quelle });
    }
    if ((scan.en_versuche ?? 0) >= 2) return antwort({ faehigkeiten_en: faehigkeitenEnglisch(de).en, quelle: 'rueckfall' });
    const ergebnis = await faehigkeitenAufEnglisch(de);
    if (ergebnis.fehler) console.warn('[demo/faehigkeiten] Rückfall auf Standard:', ergebnis.fehler);
    if (ergebnis.quelle !== 'standard') scan.en_versuche = (scan.en_versuche ?? 0) + 1;
    scan.karte_en = { de, en: ergebnis.en, quelle: ergebnis.quelle };
    await speichereScan(scan).catch(() => undefined);
    return antwort({ faehigkeiten_en: ergebnis.en, quelle: ergebnis.quelle });
}
