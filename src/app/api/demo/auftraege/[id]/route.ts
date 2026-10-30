/**
 * GET /api/demo/auftraege/{id} → {id, status, zeit, dauer_s, zusammenfassung, grund, handelsregister}
 * (grund nur bei «fehler», AUFTRAG-095; handelsregister {name, sitz, uid} oder null, AUFTRAG-109)
 *
 * Öffentlich (Status-Polling der Seite). Nur mit der unvorhersehbaren
 * Auftrags-Id (16 Zufallszeichen); liefert weder Nummer noch Profil.
 *
 * AUFTRAG-098: Mit `Authorization: Bearer <DEMO_TOKEN>` (nur die Anlage)
 * zusätzlich {erstellt, nummer, sprache, profil} — so holt die Anlage nach dem
 * Anstoss (der nur die Kennung trägt) den Auftrag ab. Falscher Kopf → 401.
 */
import { antwort, fehler, pruefeBearer } from '@/lib/demo/api';
import { fuerAnlage, leseAuftrag, oeffentlich } from '@/lib/demo/auftraege';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const anlage = req.headers.has('authorization');
    if (anlage && !pruefeBearer(req)) return fehler('Nicht autorisiert', 401);
    const { id } = await params;
    const auftrag = await leseAuftrag(id);
    if (!auftrag) return fehler('Unbekannter Auftrag', 404);
    return antwort(anlage ? fuerAnlage(auftrag) : oeffentlich(auftrag));
}
