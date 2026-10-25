/**
 * Anstoss der Anlage (AUFTRAG-098, Gegenstück AUFTRAG-097 im voip-agent).
 *
 * Auf Netlify Free dürfen Functions nicht dauernd laufen: Statt dass die
 * Anlage die Warteschlange im Dauer-Long-Polling abholt, STÖSST die Website
 * sie nach jedem neuen Auftrag an — `POST <DEMO_ANSTOSS_URL>` durch den
 * Cloudflare Tunnel (z. B. https://hook.calloneai.com/api/demo/anstoss).
 *
 *   Authorization: Bearer <DEMO_TOKEN>
 *   X-Anstoss-Zeit: <Unix-Sekunden>          (Replay-Schutz der Anlage, 120 s)
 *   Body {"id": "<auftrag_id>"}               (nur die Kennung, nie Personendaten)
 *
 * Frist 4 s je Versuch, ein Wiederholungsversuch nach 1 s (nur bei Timeout,
 * Netzfehler oder 5xx). Antworten der Anlage:
 *   202 angenommen — die Anlage holt Nummer und Profil selbst bei der Website
 *       (GET /api/demo/auftraege/{id} mit Bearer) und meldet den Status wie heute;
 *   409 belegt — es läuft schon ein Demo-Anruf; der Auftrag bleibt «wartend»,
 *       die Anlage holt ihn nach dem laufenden Anruf ab;
 *   401/4xx/5xx/Timeout — der Auftrag bleibt «wartend», Journal-Eintrag,
 *       kein Fehler für den Besucher: der Rückfall (die Anlage fragt die
 *       Warteschlange einmal pro Minute ohne Warten ab) holt ihn ab.
 * Ohne `DEMO_ANSTOSS_URL` (lokal) gibt es keinen Anstoss — alles wie heute.
 *
 * Journal: eine Zeile je Anstoss im Function-Log, nur mit der Kennung:
 *   [demo/anstoss] id=d-… ergebnis=angenommen http=202 versuche=1 ms=143
 */

export const ANSTOSS_FRIST_MS = 4_000;
export const ANSTOSS_PAUSE_MS = 1_000;
export const ANSTOSS_VERSUCHE = 2;

export type AnstossErgebnis =
    /** 2xx (Anlage: 202) */
    | 'angenommen'
    /** 409: es läuft schon ein Demo-Anruf */
    | 'belegt'
    /** 401/403: Token falsch */
    | 'nicht_autorisiert'
    /** übrige 4xx (400 Kennung, 429 zu viele Anstösse …) */
    | 'abgelehnt'
    /** 5xx oder Netzfehler (auch nach der Wiederholung) */
    | 'fehler'
    /** keine Antwort binnen Frist (auch nach der Wiederholung) */
    | 'zeitueberschreitung'
    /** DEMO_ANSTOSS_URL gesetzt, aber DEMO_TOKEN fehlt/zu kurz bzw. URL ungültig */
    | 'nicht_konfiguriert'
    /** kein DEMO_ANSTOSS_URL: Anstoss aus (lokal) */
    | 'aus';

export interface AnstossProtokoll {
    ergebnis: AnstossErgebnis;
    /** HTTP-Status der letzten Antwort (null ohne Antwort) */
    http: number | null;
    versuche: number;
    ms: number;
}

/** DEMO_ANSTOSS_URL lesen: nur absolute http(s)-Adresse ohne Zugangsdaten, sonst null. */
export function anstossUrl(roh = process.env.DEMO_ANSTOSS_URL): URL | null | 'ungueltig' {
    const wert = (roh ?? '').trim();
    if (!wert) return null;
    try {
        const u = new URL(wert);
        if ((u.protocol !== 'https:' && u.protocol !== 'http:') || u.username || u.password) return 'ungueltig';
        return u;
    } catch {
        return 'ungueltig';
    }
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

function istZeitueberschreitung(e: unknown): boolean {
    return e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
}

export interface AnstossOptionen {
    url?: URL | null | 'ungueltig';
    token?: string | undefined;
    fristMs?: number;
    pauseMs?: number;
    /** für Tests */
    fetchImpl?: typeof fetch;
    /** Journal-Zeile ausgeben (Vorgabe true) */
    journal?: boolean;
}

/**
 * Stösst die Anlage für einen neuen Auftrag an. Wirft nie: Jeder Fehler
 * endet im Protokoll (der Rückfall der Anlage holt den Auftrag ab).
 */
export async function stosseAn(id: string, opt: AnstossOptionen = {}): Promise<AnstossProtokoll> {
    const t0 = Date.now();
    const url = opt.url === undefined ? anstossUrl() : opt.url;
    const token = opt.token === undefined ? process.env.DEMO_TOKEN : opt.token;
    const frist = opt.fristMs ?? ANSTOSS_FRIST_MS;
    const warte = opt.pauseMs ?? ANSTOSS_PAUSE_MS;
    const holen = opt.fetchImpl ?? fetch;
    const journal = (p: AnstossProtokoll): AnstossProtokoll => {
        if (opt.journal !== false && p.ergebnis !== 'aus') {
            const zeile = `[demo/anstoss] id=${id} ergebnis=${p.ergebnis} http=${p.http ?? '-'} versuche=${p.versuche} ms=${p.ms}`;
            if (p.ergebnis === 'angenommen' || p.ergebnis === 'belegt') console.info(zeile);
            else console.warn(`${zeile} (Rückfall: Abholung durch die Anlage)`);
        }
        return p;
    };

    if (url === null) return { ergebnis: 'aus', http: null, versuche: 0, ms: 0 };
    if (url === 'ungueltig' || !token || token.length < 16) {
        return journal({ ergebnis: 'nicht_konfiguriert', http: null, versuche: 0, ms: Date.now() - t0 });
    }

    let ergebnis: AnstossErgebnis = 'fehler';
    let http: number | null = null;
    let versuche = 0;
    while (versuche < ANSTOSS_VERSUCHE) {
        if (versuche > 0) await pause(warte);
        versuche++;
        try {
            const res = await holen(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Anstoss-Zeit': String(Math.floor(Date.now() / 1000)),
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'User-Agent': 'InfraOne-Demo-Anstoss/1.0 (+https://infraone.ch/ki-telefonassistent)',
                },
                body: JSON.stringify({ id }),
                // Weiterleitungen nie folgen: das Token geht nur an die konfigurierte Adresse
                redirect: 'manual',
                cache: 'no-store',
                signal: AbortSignal.timeout(frist),
            });
            http = res.status;
            await res.body?.cancel().catch(() => undefined);
            if (res.status >= 200 && res.status < 300) {
                ergebnis = 'angenommen';
                break;
            }
            if (res.status === 409) {
                ergebnis = 'belegt';
                break;
            }
            if (res.status === 401 || res.status === 403) {
                ergebnis = 'nicht_autorisiert';
                break;
            }
            if (res.status < 500) {
                // 3xx (Weiterleitung), 400, 404, 429 … — eine Wiederholung ändert nichts
                ergebnis = 'abgelehnt';
                break;
            }
            ergebnis = 'fehler';
        } catch (e) {
            http = null;
            ergebnis = istZeitueberschreitung(e) ? 'zeitueberschreitung' : 'fehler';
        }
    }
    return journal({ ergebnis, http, versuche, ms: Date.now() - t0 });
}
