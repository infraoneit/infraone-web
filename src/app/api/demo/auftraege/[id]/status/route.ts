/**
 * POST /api/demo/auftraege/{id}/status  (nur Orchestrator, Bearer DEMO_TOKEN)
 * Body {"status": "angenommen"|"waehlt"|"verbunden"|"beendet"|"fehler",
 *       "grund", "dauer_s", "zusammenfassung", "zeit"} → 200
 *
 * Status nur vorwärts; Endzustände (beendet/fehler) bleiben stehen —
 * spätere Meldungen werden mit 200 und `uebernommen: false` quittiert.
 */
import { antwort, fehler, leseJson, pruefeBearer } from '@/lib/demo/api';
import { setzeStatus } from '@/lib/demo/auftraege';
import type { AuftragStatus } from '@/lib/demo/typen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERLAUBT: AuftragStatus[] = ['angenommen', 'waehlt', 'verbunden', 'beendet', 'fehler'];

function text(v: unknown, max: number): string | null {
    if (typeof v !== 'string') return null;
    const t = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
    return t ? t.slice(0, max) : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!pruefeBearer(req)) return fehler('Nicht autorisiert', 401);
    const { id } = await params;
    const body = await leseJson(req, 20_000);
    if (!body) return fehler('Ungültiger Körper', 400);
    const status = body.status as AuftragStatus;
    if (!ERLAUBT.includes(status)) return fehler('Ungültiger Status', 400);

    let dauer: number | null = null;
    if (body.dauer_s !== null && body.dauer_s !== undefined) {
        const d = Number(body.dauer_s);
        if (!Number.isFinite(d) || d < 0 || d > 86_400) return fehler('Ungültige Dauer', 400);
        dauer = Math.round(d);
    }
    let zeit: string | null = text(body.zeit, 40);
    if (zeit && Number.isNaN(Date.parse(zeit))) zeit = null;

    const ergebnis = await setzeStatus(id, {
        status,
        grund: text(body.grund, 80),
        dauer_s: dauer,
        zusammenfassung: text(body.zusammenfassung, 2_000),
        zeit,
    });
    if (!ergebnis) return fehler('Unbekannter Auftrag', 404);
    return antwort({ ok: true, id, status: ergebnis.auftrag.status, uebernommen: ergebnis.uebernommen });
}
