/**
 * GET /api/demo/warteschlange[?warte=<sekunden>]  (nur Orchestrator, Bearer DEMO_TOKEN)
 * → {"auftraege": [{id, erstellt, nummer, sprache, profil}, …]}
 * Nur Status «wartend», älteste zuerst, höchstens 5.
 *
 * Long-Polling (Manager-Entscheid zu AUFTRAG-092): Mit `warte` (Vorgabe 0)
 * bleibt die Antwort offen; der Speicher wird jede Sekunde geprüft. Sobald
 * ein wartender Auftrag da ist, kommt die Antwort sofort, sonst nach Ablauf
 * mit leerer Liste. Bricht der Abrufer ab, endet die Schleife ebenfalls.
 *
 * AUFTRAG-098: Die Website stösst die Anlage an (lib/demo/anstoss.ts); die
 * Warteschlange ist nur noch der Rückfall (A-097: einmal pro Minute mit
 * warte=0). `warte` wird serverseitig auf 8 s gedeckelt (WARTE_MAX_S),
 * damit auch der Rückfall keine Function lange hält (Netlify Free).
 */
import { antwort, fehler, pruefeBearer } from '@/lib/demo/api';
import { warteschlange, warteSekunden } from '@/lib/demo/auftraege';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: Request) {
    if (!pruefeBearer(req)) return fehler('Nicht autorisiert', 401);
    const ende = Date.now() + warteSekunden(new URL(req.url).searchParams.get('warte')) * 1000;
    let auftraege = await warteschlange(5);
    while (!auftraege.length && Date.now() < ende && !req.signal?.aborted) {
        await pause(Math.min(1000, ende - Date.now()));
        auftraege = await warteschlange(5);
    }
    return antwort({ auftraege });
}
