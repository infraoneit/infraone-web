/**
 * GET /api/demo/auftraege/{id} → {id, status, zeit, dauer_s, zusammenfassung, grund}
 * (grund nur bei «fehler», AUFTRAG-095)
 *
 * Öffentlich (Status-Polling der Seite). Nur mit der unvorhersehbaren
 * Auftrags-Id (16 Zufallszeichen); liefert weder Nummer noch Profil.
 */
import { antwort, fehler } from '@/lib/demo/api';
import { leseAuftrag, oeffentlich } from '@/lib/demo/auftraege';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auftrag = await leseAuftrag(id);
    if (!auftrag) return fehler('Unbekannter Auftrag', 404);
    return antwort(oeffentlich(auftrag));
}
