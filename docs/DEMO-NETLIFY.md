# KI-Telefonassistent-Demo auf Netlify Free (AUFTRAG-098)

Die Demo unter `infraone.ch/ki-telefonassistent` läuft auf Netlify Free.
Netlify-Functions dürfen dort nicht dauernd laufen. Darum **stösst die
Website die Anlage an**, statt dass die Anlage im Long-Polling abholt.
Gegenstück auf der Anlage: AUFTRAG-097 (voip-agent).

## Ablauf

```
Browser                     Website (Netlify Functions)                 Anlage (voip-ki, Cloudflare Tunnel)
POST /api/demo/scan   ───▶  Scan (Budget 8 s), Regel-Profil
POST /api/demo/profil ───▶  KI-Profil (gpt-4.1-mini)
POST /api/demo/anruf  ───▶  Auftrag «wartend» (Blobs)
                            POST DEMO_ANSTOSS_URL  ─────────────────▶  POST /api/demo/anstoss  {"id": …}
                            (Bearer, X-Anstoss-Zeit, Frist 4 s,        202 angenommen / 409 belegt
                             1 Wiederholung nach 1 s)
                                                    ◀───────────────  GET  /api/demo/auftraege/{id}  (Bearer)
                                                    ◀───────────────  POST /api/demo/auftraege/{id}/status
GET /api/demo/auftraege/{id} alle 4 s (nur Status, ohne Nummer/Profil)
```

- **Anstoss** (`src/lib/demo/anstoss.ts`): nach dem Anlegen eines Auftrags
  `POST <DEMO_ANSTOSS_URL>` mit `Authorization: Bearer <DEMO_TOKEN>`,
  `X-Anstoss-Zeit: <Unix-Sekunden>`, Body `{"id": "<auftrag_id>"}` — nur
  die Kennung, nie Personendaten. Frist 4 s, eine Wiederholung nach 1 s
  (nur bei Timeout, Netzfehler, 5xx). Weiterleitungen werden nicht verfolgt.
- **Antworten der Anlage**: 202 → die Anlage holt Nummer und Profil mit
  Bearer über `GET /api/demo/auftraege/{id}` (ohne Bearer liefert dieselbe
  Route nur den Status, mit falschem Bearer 401). 409 → es läuft schon ein
  Demo-Anruf, der Auftrag bleibt «wartend». 401/4xx/5xx/Timeout → der Auftrag
  bleibt «wartend». In allen Fällen bekommt der Besucher 201, ohne Fehler.
- **Journal**: je Anstoss eine Zeile im Function-Log, nur mit der Kennung,
  z. B. `[demo/anstoss] id=d-… ergebnis=angenommen http=202 versuche=1 ms=14`.
  Fehlschläge stehen als Warnung mit «Rückfall: Abholung durch die Anlage».
- **Rückfall**: Die Anlage fragt `GET /api/demo/warteschlange?warte=0`
  einmal pro Minute ohne Warten ab (A-097: `VOIP_DEMO_WARTE_S=0`,
  `VOIP_DEMO_TAKT_S=60`). Damit kommt auch ein Auftrag an, dessen Anstoss
  scheiterte oder abgewiesen wurde. Die Website deckelt `warte` auf
  **8 s** (`WARTE_MAX_S`), damit auch ein alter Abholer keine Function
  lange offen hält.
- **Statusabfrage im Browser**: alle 4 s; nach «beendet»/«fehler» keine
  weitere; bei verdecktem Tab Pause, beim Zurückkommen sofort eine Abfrage;
  nach 20 Minuten ohne Endzustand Schluss mit Hinweis «Keine Rückmeldung».
- Ohne `DEMO_ANSTOSS_URL` (lokal) gibt es keinen Anstoss — die Anlage holt
  wie bisher über die Warteschlange ab.

## Umgebungsvariablen (Netlify → Site configuration → Environment variables)

| Variable | Pflicht | Inhalt |
|---|---|---|
| `OPENAI_API_KEY` | ja | KI-Profil und englische Fähigkeiten (gpt-4.1-mini). Fehlt er, entsteht das Profil regelbasiert — die Demo läuft trotzdem. |
| `DEMO_TOKEN` | ja | Gemeinsames Geheimnis mit der Anlage (dort `VOIP_DEMO_TOKEN`), mindestens 16 Zeichen. Bearer für Anstoss, Warteschlange, Status-Meldungen und die Auftragsansicht der Anlage; zugleich Salz der Limit-Zähler. |
| `DEMO_ANSTOSS_URL` | ja | `https://hook.calloneai.com/api/demo/anstoss` (Cloudflare Tunnel auf den Anstoss-Listener der Anlage, A-097). Nur absolute http(s)-Adresse ohne Zugangsdaten. |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | optional | Nur beide zusammen schalten Cloudflare Turnstile vor dem Anruf ein. |
| `DEMO_MAENNLICHE_NAMEN` | `0` | `1` erst, wenn die männliche Stimme auf der Anlage belegt ist (bis dahin nur Frauennamen). |
| `DEMO_BEGRUESSUNG_NACH_STIMME` | optional | `1` = Begrüssungsvorschau mit den weiblichen Formen aus A-094 («die digitale Assistentin»). Setzen, sobald die Anlage diese Formen spricht, sonst weicht die Vorschau vom Anruf ab. |
| `DEMO_OEFFENTLICHE_URL` | optional | Öffentlicher Ursprung für Logo-Links an die Anlage (z. B. `https://infraone.ch`), falls Anfragen über einen anderen Host kommen. |
| `DEMO_LIMITS_AUS` | **nie setzen** | Nur für lokale Tests. Auf Netlify **darf sie nicht gesetzt sein** (der Code ignoriert sie dort zwar, trotzdem nicht anlegen). |
| `DEMO_STORE_DIR` | nicht setzen | Nur lokale Tests (Datei-Speicher statt Blobs). |

Geltungsbereich: Die Seite `/ki-telefonassistent` wird beim Build statisch
erzeugt — `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` und
`DEMO_BEGRUESSUNG_NACH_STIMME` müssen deshalb auch für **Builds** gelten,
alle anderen für **Functions** (am einfachsten: «All scopes»). Nach einer
Änderung dieser drei Variablen neu deployen.

## Speicher: Netlify Blobs, Store «demo»

`@netlify/blobs`, Store **`demo`** (Konsistenz `strong`). Auf Netlify ist
der Blobs-Kontext in den Functions automatisch vorhanden, es ist nichts
einzurichten. Schlüssel:

| Schlüssel | Lebensdauer | Inhalt |
|---|---|---|
| `scan/{id}` | 2 h | Extrakt, Profil, englische Fähigkeiten (falls angefragt) |
| `auftrag/{id}` | 24 h | Status; Nummer und Profil nur bis zum Abschluss |
| `warteschlange/{ms}-{id}` | solange «wartend» | Marker für den Rückfall |
| `limit/{tag}/…` | Fenster + 1 Tag | Zähler (IP und Nummer nur als Hash) |
| `meta/aufgeraeumt` | — | Zeitpunkt des letzten Aufräumens (höchstens alle 30 min) |

Lokal ohne Netlify: Datei-Rückfall unter `.demo-store/` (gitignored).

**AUFTRAG-102: Store je Anfrage, nie als Modul-Singleton.** `getStore()` übernimmt
Token und Edge-Adressen aus dem Kontext der laufenden Anfrage
(`globalThis.netlifyBlobsContext`). `lib/demo/speicher.ts` baut den Store deshalb bei
jedem Zugriff neu. Am 26.10.2026 lieferte der Branch-Deploy (mit dem früheren
Singleton) für die Routen mit Speicherzugriff (`scan`, `profil`, `auftraege/{id}`,
Logo aus dem Scan) zeitweise HTTP 500 ohne Text, im Wechsel mit erfolgreichen
Antworten (18 von 30 Scans, 10 von 18 Profilen); Blobs-Fehler stehen jetzt mit Art
und Fehlertext im Function-Log (`[demo/speicher] …`).

## Bild-Proxy und CDN-Cache (AUFTRAG-102)

Die Next-Laufzeit auf Netlify setzt `Netlify-Vary: query=__nextDataReq|_rsc`. Ohne
eigene Angabe ignoriert der CDN-Cache damit alle anderen Query-Parameter: Gemessen
am 26.10.2026 lieferte `/api/demo/bild?u=<Logo von Unipoint>` und
`/api/demo/bild?s=<beliebiger Scan>&i=0` das zuerst zwischengespeicherte Bild
(das Bint-Logo, `Cache-Status: "Netlify Durable"; hit`) — Ursache des gemeldeten
«Durcheinanders» bei gleichzeitigen Tests (Logo und daraus gemessene Farbe).
Seither:

- Logos eines Scans kommen über **`/api/demo/bild/<scan_id>/<n>`** (Scan-Kennung
  im Pfad, für Inline-SVG und Logos mit Adresse); der Cache-Schlüssel enthält Scan und
  Index auch ohne Query.
- Jede Antwort des Bild-Proxys sendet **`Netlify-Vary: query`** und **`Vary: Accept`**
  (die Laufzeit übernimmt eigene `Netlify-Vary`-Angaben und erweitert den Schlüssel).
- Das Widget nimmt nur Logos mit der eigenen Scan-Kennung im Pfad und nur eine
  Profil-Antwort mit derselben `scan_id` (`lib/demo/sitzung.ts`).

Prüfen nach einem Deploy (nur Scans, keine Anrufe; Scan-Limit 3 je IP und Stunde):

```powershell
node scripts/auftrag102-parallel-test.mjs --runden 1 --json <datei>
```

## Kontingent: Function-Aufrufe je Demo-Anruf

Gemessen mit `scripts/auftrag092-browser-test.mjs` (Belege in
`auftraege/ergebnisse/A098-zaehlung-*.json`, `A098-anstoss.json`).

**Status-Abfragen des Widgets** — feste Zeitachse: angenommen nach 2 s,
klingelt nach 4 s, verbunden nach 12 s, beendet nach 132 s (zwei Minuten
Gespräch):

| | vorher (1,5 s) | nachher (4 s) |
|---|---|---|
| Tab offen | 88 | 33 |
| Tab 90 s verdeckt (Besucher am Telefon) | 88, davon 59 im verdeckten Tab | 11, davon 0 im verdeckten Tab |
| nach «beendet» | 0 | 0 |

Faustregel nachher: Status-Abfragen ≈ Sekunden vom Klick bis «beendet» ÷ 4,
abzüglich der Zeit mit verdecktem Tab.

**Alle Aufrufe eines Demo-Anrufs** (Anstoss angenommen, Testlauf mit
Attrappen-Anlage, 17 s vom Klick bis «beendet»):

| Wer | Aufrufe |
|---|---|
| Browser: `scan`, `profil`, `bild` (Logo), `anruf` | 1 + 1 + 1 + 1 (Logo-Proxy: 1 bis 4 Kandidaten über `/api/demo/bild/<scan>/<n>`, je Scan 2 h im CDN zwischengespeichert — AUFTRAG-102) |
| Browser: Status-Abfragen | 4 (bei einem echten Anruf ≈ Dauer ÷ 4 s, siehe oben) |
| Browser: `faehigkeiten` | 0 bei Deutsch und Schweizerdeutsch; 1, wenn «English» gewählt wird und das Profil KI-Fähigkeiten hat |
| Anlage: Auftrag holen + Status «angenommen», «waehlt», «verbunden», «beendet» | 1 + 4 |
| Anstoss | 0 (geht von der Website zur Anlage, ist kein Netlify-Aufruf) |

Je Demo-Anruf also rund **13 + Gesprächsdauer ÷ 4 s** Aufrufe
(z. B. 13 + 33 = 46 für die Zeitachse mit zwei Minuten Gespräch).
Die Seite selbst wird beim Build statisch erzeugt (`○` in der Build-Ausgabe)
und ist in dieser Rechnung nicht enthalten. Der Anstoss verlängert nur den
`anruf`-Aufruf (typisch 0,1 s; im schlimmsten Fall, wenn die Anlage nicht
antwortet, 9 s: 4 s + 1 s + 4 s).

**Grundlast Rückfall**: 1 Aufruf pro Minute = 1 440 pro Tag = 43 200 in
30 Tagen, unabhängig von der Zahl der Demo-Anrufe (A-097: «rund 43 000 im
Monat»; das bisherige Long-Polling lag laut A-097 bei rund 130 000).

**Rechnung je Monat**: 43 200 + Demo-Anrufe × (13 + Dauer ÷ 4 s).
Die Umrechnung in Credits richtet sich nach der aktuellen Netlify-Preisliste
für den Plan Free — vor dem Livegang dort nachsehen.

## Prüfen

```powershell
# Einheitstests (Anstoss, Warteschlangen-Deckel, Statusabfrage, Sprachwahl, englische Karte)
node scripts/demo-einheit-test.mjs
# Texte, Sprachwahl, englische Karte, Zählung je Anruf (gegen den Dev-Server :3000)
node scripts/auftrag092-browser-test.mjs
node scripts/auftrag092-browser-test.mjs --zaehlung nachher
node scripts/auftrag092-browser-test.mjs --zwanzig
# Anstoss mit Attrappen-Anlage — NUR eigener Server mit eigenem Speicher:
$env:DEMO_STORE_DIR = '<ordner>'; $env:DEMO_ANSTOSS_URL = 'http://127.0.0.1:3119/api/demo/anstoss'; npx next start -p 3110
# zweite Konsole:
$env:BASE_URL = 'http://localhost:3110'; $env:DEMO_STORE_DIR = '<ordner>'; $env:ANSTOSS_PORT = '3119'; $env:SERVER_LOG = '<log>'
node scripts/auftrag092-browser-test.mjs --anstoss
```

Keine Cloudflare-Konfiguration und keine Weiterleitungen in diesem Repo —
Tunnel, DNS (`hook.calloneai.com`) und Weiterleitungen richtet der Manager
in Cloudflare ein.
