/**
 * GET /api/demo/bild/<scan_id>/<n> — Logo `n` (Index in den geprüften Kandidaten)
 * aus dem gespeicherten Scan (AUFTRAG-102).
 *
 * Die Scan-Kennung steht im PFAD: Jeder Cache (Netlify-CDN, Browser) führt das
 * Logo damit unter Scan und Index — zwei gleichzeitige Scans verschiedener Firmen
 * können sich kein Bild teilen, auch wenn ein Cache die Query ignoriert.
 * Inline-SVG/data:-Logos kommen aus dem Scan, Logos mit Adresse über den Proxy
 * (gleiche Prüfungen wie /api/demo/bild?u=).
 */
import { logoAusScan } from '@/lib/demo/bildproxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ scan: string; n: string }> }) {
    const { scan, n } = await params;
    return logoAusScan(scan, n);
}
