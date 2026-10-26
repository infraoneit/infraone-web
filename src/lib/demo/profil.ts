/**
 * Assistenten-Profil aus dem Scan-Extrakt (AUFTRAG-092, Teil A Punkt 4).
 *
 * - KI: OpenAI Chat `gpt-4.1-mini`, Temperatur 0.2, strukturierte
 *   JSON-Antwort (json_schema, strict) + eigene Schema-Prüfung.
 * - Keine Erfindungen: Kontaktangaben und Zahlen in Antworten müssen im
 *   Extrakt belegt sein, sonst werden sie verworfen.
 * - Fällt die KI aus (kein Schlüssel, Zeitlimit, Fehler), entsteht das
 *   Profil regelbasiert — die Demo scheitert nie an der KI.
 */
import type { Extrakt, Profil, ProfilQuelle, WissenEintrag } from './typen';
import { erlaubteNamen, freieNamen, istErlaubterName, istWeiblich, stimmeFuer, waehleName } from './namen';
import { formatiereNummer, normalisiereGefundeneNummer } from './nummer';
import { istOeffnungszeitText } from './oeffnungszeiten';
import { STANDARD_FAEHIGKEITEN, STANDARD_FAEHIGKEITEN_EN } from './begruessung';
import { MAX_PERSONEN, wissenTeam } from './personen';

export const KI_MODELL = 'gpt-4.1-mini';
const KI_ZEIT_MS = 17_000;

// AUFTRAG-098: die Standard-Fähigkeiten stehen (mit englischer Fassung) in begruessung.ts,
// damit die Karte sie im Browser ohne Server-Aufruf übersetzen kann.
export { STANDARD_FAEHIGKEITEN, STANDARD_FAEHIGKEITEN_EN };

/* ------------------------------------------------------------------ */
/* Hilfen                                                              */
/* ------------------------------------------------------------------ */

function kuerze(text: string, max: number): string {
    const t = text.replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    const schnitt = t.slice(0, max);
    const satzende = Math.max(schnitt.lastIndexOf('. '), schnitt.lastIndexOf('! '), schnitt.lastIndexOf('? '));
    if (satzende > max * 0.5) return schnitt.slice(0, satzende + 1);
    return schnitt.slice(0, schnitt.lastIndexOf(' ') > 0 ? schnitt.lastIndexOf(' ') : max - 1).replace(/[,;:–-]$/, '') + ' …';
}

const ss = (t: string) => t.replace(/ß/g, 'ss');

const TEL_IM_TEXT_RE =
    /(?:\+|00)\s?(?:41|423)[\s.\-/]?(?:\(0\)[\s.\-/]?)?\d{1,3}(?:[\s.\-/]?\d{2,3}){2,4}|\b0\d{2}[\s.\-/]?\d{3}[\s.\-/]?\d{2}[\s.\-/]?\d{2}\b/g;
const ZEIT_TOKEN_RE = /(\d{1,2})[.:h](\d{2})(?!\d)/g;

/** Zerlegt Text in vergleichbare Zahl-Belege (Telefon, Uhrzeit, Zahl). */
export function zahlBelege(text: string): Set<string> {
    const set = new Set<string>();
    const ohneTel = text.replace(TEL_IM_TEXT_RE, (m) => {
        const n = normalisiereGefundeneNummer(m);
        if (n) set.add('tel:' + n);
        return ' ';
    });
    for (const m of ohneTel.matchAll(ZEIT_TOKEN_RE)) set.add(`zeit:${m[1].padStart(2, '0')}:${m[2]}`);
    const ohneZeit = ohneTel.replace(ZEIT_TOKEN_RE, ' ');
    for (const m of ohneZeit.matchAll(/\d+(?:['’]\d{3})*/g)) set.add('z:' + String(Number(m[0].replace(/['’]/g, ''))));
    return set;
}

/** true, wenn alle Zahlen aus `wert` im Korpus vorkommen. */
export function zahlenBelegt(wert: string, korpus: Set<string>): boolean {
    for (const b of zahlBelege(wert)) {
        if (korpus.has(b)) continue;
        if (b.startsWith('zeit:')) {
            const [, hh, mm] = b.split(':');
            if (mm === '00' && korpus.has('z:' + String(Number(hh)))) continue;
        }
        return false;
    }
    return true;
}

function korpusVon(x: Extrakt): { text: string; belege: Set<string> } {
    const text = [
        x.titel,
        x.meta_description,
        x.og_site_name,
        x.jsonld_name,
        x.jsonld_beschreibung,
        ...x.telefone,
        ...x.emails,
        ...x.adressen,
        ...x.oeffnungszeiten,
        ...x.ueberschriften,
        ...x.abschnitte.map((a) => `${a.titel} ${a.text}`),
        // AUFTRAG-102: Personen (Name, Rolle, Zuständigkeit) gehören zu den Belegen
        ...(x.personen ?? []).map((p) => [p.name, p.rolle, p.zustaendigkeit].filter(Boolean).join(' ')),
        x.text,
    ]
        .filter(Boolean)
        .join('\n');
    return { text, belege: zahlBelege(text) };
}

/* ------------------------------------------------------------------ */
/* Branche                                                             */
/* ------------------------------------------------------------------ */

const BRANCHEN: Array<[RegExp, string]> = [
    [/zahnarzt|zahnmedizin|dental|kieferorthop|dentalhygiene/i, 'zahnarzt'],
    [/physio|ergotherapie/i, 'physiotherapie'],
    [/tierarzt|tierklinik|tierpraxis/i, 'tierarzt'],
    [/arztpraxis|hausarzt|ärztin|facharzt|gruppenpraxis|medizinisch/i, 'arztpraxis'],
    [/elektro|elektriker|elektroinstall/i, 'elektro'],
    [/sanitär|heizung|haustechnik|lüftung/i, 'haustechnik'],
    [/garage|autohaus|carrosserie|autoservice|reifen/i, 'garage'],
    [/treuhand|buchhaltung|steuerberatung|lohnbuchhaltung/i, 'treuhand'],
    [/anwalt|rechtsanw|kanzlei|notariat/i, 'recht'],
    [/zahlungs|payment|bezahl|kassensystem|terminal/i, 'zahlungsdienste'],
    [/restaurant|gastro|bistro|café|cafe\b|hotel|pizzeria|bäckerei|metzgerei/i, 'gastronomie'],
    [/coiffeur|friseur|kosmetik|beauty|nagelstudio/i, 'beauty'],
    [/immobilien|liegenschaft|bewirtschaftung/i, 'immobilien'],
    [/informatik|it-support|it-dienst|software|webdesign|cloud|netzwerk/i, 'it'],
    [/schreinerei|malerei|gipserei|bauunternehm|zimmerei|dachdecker|spenglerei|gartenbau/i, 'handwerk'],
    [/beratung|consulting/i, 'beratung'],
];

export function bestimmeBranche(x: Extrakt): string {
    const t = [x.titel, x.meta_description, x.jsonld_beschreibung, ...x.ueberschriften.slice(0, 15)].filter(Boolean).join(' ');
    for (const [re, b] of BRANCHEN) if (re.test(t)) return b;
    return 'kmu';
}

/* ------------------------------------------------------------------ */
/* Regelbasiertes Profil                                               */
/* ------------------------------------------------------------------ */

function websiteVon(x: Extrakt): string {
    try {
        return new URL(x.end_url).origin;
    } catch {
        return `https://${x.host}`;
    }
}

function firmaTextRegeln(x: Extrakt): string {
    const teile = [x.jsonld_beschreibung, x.meta_description].filter((t): t is string => !!t && t.length >= 20);
    if (!teile.length) {
        const absatz = x.abschnitte.find((a) => a.text.length >= 80)?.text;
        if (absatz) teile.push(absatz);
    }
    const t = [...new Set(teile)].join(' ');
    if (t.length >= 20) return ss(kuerze(t, 900));
    return `${x.firma ?? x.host} ist online unter ${x.host} zu finden.`;
}

function wissenRegeln(x: Extrakt, firma: string, telefon: string | null, email: string | null, adresse: string | null, zeiten: string | null): WissenEintrag[] {
    const w: WissenEintrag[] = [];
    if (telefon) w.push({ frage: `Wie erreiche ich ${firma} telefonisch?`, antwort: `Sie erreichen ${firma} unter ${formatiereNummer(telefon)}.`, thema: 'kontakt' });
    if (email) w.push({ frage: 'Wie lautet Ihre E-Mail-Adresse?', antwort: `Die E-Mail-Adresse lautet ${email}.`, thema: 'kontakt' });
    if (adresse) w.push({ frage: `Wo befindet sich ${firma}?`, antwort: `Die Adresse lautet: ${adresse}.`, thema: 'adresse' });
    if (zeiten) w.push({ frage: 'Wann sind Sie erreichbar?', antwort: kuerze(`Laut Website: ${zeiten}.`, 500), thema: 'oeffnungszeiten' });
    const beschreibung = x.jsonld_beschreibung ?? x.meta_description;
    if (beschreibung && beschreibung.length >= 30) w.push({ frage: `Was bietet ${firma} an?`, antwort: ss(kuerze(beschreibung, 500)), thema: 'leistungen' });
    // AUFTRAG-102: Team («Wer leitet …?», «Wer ist für … zuständig?», «Wen kann ich wegen … sprechen?»)
    for (const t of wissenTeam(x.personen ?? [], firma)) w.push({ frage: ss(t.frage), antwort: ss(t.antwort), thema: t.thema });
    for (const a of x.abschnitte) {
        if (w.length >= 22) break;
        if (a.text.length < 40) continue;
        w.push({ frage: `Was können Sie mir zu «${kuerze(a.titel, 80)}» sagen?`, antwort: ss(kuerze(a.text, 480)), thema: 'website' });
    }
    w.push({ frage: 'Wie lautet Ihre Website?', antwort: `Die Website ist ${x.host}.`, thema: 'kontakt' });
    while (w.length < 5) {
        w.push({ frage: 'Kann ich einen Rückruf vereinbaren?', antwort: 'Ja. Ich nehme Ihr Anliegen auf und gebe es zur Bearbeitung weiter.', thema: 'rueckruf' });
        if (w.length < 5) w.push({ frage: `Mit wem spreche ich?`, antwort: `Mit dem digitalen Telefonassistenten von ${firma}.`, thema: 'assistent' });
    }
    return w.slice(0, 30);
}

export interface ProfilErgebnis {
    profil: Profil;
    quelle: ProfilQuelle;
    weiblich: boolean;
    ms: number;
    fehler?: string;
    verworfen?: number;
}

export function regelProfil(x: Extrakt): ProfilErgebnis {
    const t0 = Date.now();
    const firma = ss(x.firma ?? x.host);
    const korpus = korpusVon(x);
    const name = waehleName(korpus.text, x.host);
    const telefon = x.telefone[0] ?? null;
    const email = x.emails[0] ?? null;
    const adresse = x.adressen[0] ?? null;
    const zeiten = x.oeffnungszeiten[0] ?? null;
    const profil: Profil = {
        firma,
        website: websiteVon(x),
        assistent_name: name,
        branche: bestimmeBranche(x),
        telefon,
        email,
        adresse,
        oeffnungszeiten_text: zeiten ? kuerze(zeiten, 300) : null,
        firma_text: firmaTextRegeln(x),
        faehigkeiten: [...STANDARD_FAEHIGKEITEN],
        wissen: wissenRegeln(x, firma, telefon, email, adresse, zeiten),
        logo_url: x.logo?.url ?? null,
        farben: x.farben,
        stimme: stimmeFuer(name),
        personen: (x.personen ?? []).slice(0, MAX_PERSONEN),
    };
    return { profil, quelle: 'regeln', weiblich: istWeiblich(name), ms: Date.now() - t0 };
}

/* ------------------------------------------------------------------ */
/* KI-Profil                                                           */
/* ------------------------------------------------------------------ */

function kiSchema(namen: string[]) {
    const nullable = { type: ['string', 'null'] };
    return {
        type: 'object',
        additionalProperties: false,
        required: ['firma', 'assistent_name', 'branche', 'telefon', 'email', 'adresse', 'oeffnungszeiten_text', 'firma_text', 'faehigkeiten', 'wissen'],
        properties: {
            firma: { type: 'string' },
            assistent_name: { type: 'string', enum: namen },
            branche: { type: 'string' },
            telefon: nullable,
            email: nullable,
            adresse: nullable,
            oeffnungszeiten_text: nullable,
            firma_text: { type: 'string' },
            faehigkeiten: { type: 'array', items: { type: 'string' } },
            wissen: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['frage', 'antwort', 'thema'],
                    properties: {
                        frage: { type: 'string' },
                        antwort: { type: 'string' },
                        thema: { type: 'string' },
                    },
                },
            },
        },
    };
}

const SYSTEM_PROMPT = `Du erstellst aus dem Extrakt einer Firmen-Website das Profil eines telefonischen KI-Assistenten für genau diese Firma.

Verbindliche Regeln:
1. Verwende ausschliesslich Angaben, die im Extrakt stehen. Erfinde nichts: keine Preise, Zeiten, Nummern, Namen, Adressen oder Leistungen, die nicht im Extrakt stehen. Fehlt eine Angabe, setze null.
2. Schreibe Schriftdeutsch mit Schweizer Rechtschreibung (immer «ss», nie «ß»), auch wenn die Website eine andere Sprache hat.
3. firma: der Firmenname, wie ihn die Website verwendet (mit Rechtsform, falls angegeben).
4. firma_text: sachliche Beschreibung der Firma in 3 bis 6 Sätzen, höchstens 900 Zeichen. Keine Werbesprache, keine Superlative.
5. faehigkeiten: genau drei Fähigkeiten des Telefonassistenten für diese Firma, je 3 bis 6 Wörter, passend zur Branche (z. B. «Nimmt Terminwünsche entgegen», «Beantwortet Fragen zu Behandlungen», «Rund um die Uhr erreichbar»).
6. wissen: 8 bis 25 Fragen, die Anrufer dieser Firma typischerweise stellen, mit Antworten ausschliesslich aus dem Extrakt. Antworten höchstens zwei Sätze und höchstens 400 Zeichen, in der Sie-Form aus Sicht der Firma («Wir …»). thema ist ein Wort in Kleinbuchstaben (z. B. kontakt, oeffnungszeiten, leistungen, anfahrt, team, termine, preise, notfall). Steht die Antwort nicht im Extrakt, lass die Frage weg. Decke wenn möglich Kontakt, Erreichbarkeit, Adresse und die wichtigsten Leistungen ab.
7. assistent_name: ein Vorname aus der erlaubten Liste, der zur Firma passt.
8. branche: Kurzschlüssel in Kleinbuchstaben ohne Leerzeichen (z. B. zahnarzt, arztpraxis, physiotherapie, elektro, garage, treuhand, gastronomie, it, zahlungsdienste).
9. telefon: Hauptnummer im Format +41… (nur wenn im Extrakt). oeffnungszeiten_text kompakt, z. B. «Mo–Fr 08:00–12:00, 13:30–17:30».`;

function kiEingabe(x: Extrakt) {
    return {
        website: websiteVon(x),
        titel: x.titel,
        beschreibung: x.meta_description,
        og_site_name: x.og_site_name,
        jsonld_name: x.jsonld_name,
        jsonld_beschreibung: x.jsonld_beschreibung,
        firma_vorschlag: x.firma,
        telefon_kandidaten: x.telefone,
        email_kandidaten: x.emails,
        adress_kandidaten: x.adressen,
        oeffnungszeiten_kandidaten: x.oeffnungszeiten,
        ueberschriften: x.ueberschriften.slice(0, 40),
        navigation: x.navigation.slice(0, 30),
        // AUFTRAG-102: Ansprechpersonen laut Website (Name, Rolle, Zuständigkeit)
        personen: x.personen ?? [],
        abschnitte: x.abschnitte.slice(0, 30),
        text: x.text,
    };
}

function woerter(s: string): number {
    return s.trim().split(/\s+/).filter(Boolean).length;
}

/** Fragen der KI nach Leitung/Zuständigkeit/Team — ersetzt durch die Einträge aus den erkannten Personen (AUFTRAG-102). */
const TEAM_FRAGE_RE = /^(?:wer|wen|mit wem|an wen)\b.{0,80}\b(?:leitet|leitung|zuständig|verantwortlich|sprechen|arbeitet|arbeiten|geschäftsführ|inhaber|chef|team|ansprech|mitarbeit)/i;

/** Prüft und bereinigt die KI-Antwort gegen Schema, Längen und Belege. */
export function bereinigeKiProfil(roh: unknown, x: Extrakt, regel: Profil): { profil: Profil; verworfen: number } | null {
    if (!roh || typeof roh !== 'object') return null;
    const o = roh as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' ? ss(v.replace(/\s+/g, ' ').trim()) : null);
    const korpus = korpusVon(x);
    const korpusKlein = korpus.text.toLowerCase();
    let verworfen = 0;

    const firma = str(o.firma);
    const name = str(o.assistent_name);
    const erlaubt = freieNamen(korpus.text);
    const branche = (str(o.branche) ?? '').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');

    // Telefon: nur, wenn im Extrakt belegt
    let telefon: string | null = null;
    const telRoh = str(o.telefon);
    if (telRoh) {
        const n = normalisiereGefundeneNummer(telRoh);
        if (n && (x.telefone.includes(n) || korpus.belege.has('tel:' + n))) telefon = n;
    }
    telefon = telefon ?? regel.telefon;

    let email: string | null = null;
    const mailRoh = str(o.email)?.toLowerCase() ?? null;
    if (mailRoh && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(mailRoh) && (x.emails.includes(mailRoh) || korpusKlein.includes(mailRoh))) email = mailRoh;
    email = email ?? regel.email;

    let adresse: string | null = null;
    const adrRoh = str(o.adresse);
    if (adrRoh && adrRoh.length <= 200 && /\b[1-9]\d{3}\b/.test(adrRoh) && zahlenBelegt(adrRoh, korpus.belege)) adresse = adrRoh;
    adresse = adresse ?? regel.adresse;

    let zeiten: string | null = null;
    const zeitRoh = str(o.oeffnungszeiten_text);
    // AUFTRAG-096: nur echte Öffnungszeiten (Tag/«Uhr» + Zeitspanne, kein Datum) — sonst die Regel-Angabe bzw. leer
    if (zeitRoh && zeitRoh.length <= 300 && zahlenBelegt(zeitRoh, korpus.belege) && istOeffnungszeitText(zeitRoh)) zeiten = zeitRoh;
    zeiten = zeiten ?? regel.oeffnungszeiten_text;

    let firmaText = str(o.firma_text) ?? '';
    if (firmaText.length < 40 || !zahlenBelegt(firmaText, korpus.belege)) firmaText = regel.firma_text;
    firmaText = kuerze(firmaText, 900);

    const faehigkeitenRoh = Array.isArray(o.faehigkeiten) ? o.faehigkeiten.map(str).filter((f): f is string => !!f) : [];
    const faehigkeiten = faehigkeitenRoh.filter((f) => woerter(f) >= 3 && woerter(f) <= 6 && f.length <= 60 && zahlenBelegt(f, korpus.belege));
    for (const s of STANDARD_FAEHIGKEITEN) if (faehigkeiten.length < 3 && !faehigkeiten.includes(s)) faehigkeiten.push(s);

    const wissen: WissenEintrag[] = [];
    const fragenGesehen = new Set<string>();
    for (const e of Array.isArray(o.wissen) ? o.wissen : []) {
        if (!e || typeof e !== 'object') continue;
        const w = e as Record<string, unknown>;
        const frage = str(w.frage);
        const antwortRoh = str(w.antwort);
        const thema = (str(w.thema) ?? 'allgemein').toLowerCase().replace(/[^a-z0-9äöü_-]+/g, '_').slice(0, 40) || 'allgemein';
        if (!frage || !antwortRoh || frage.length < 5 || frage.length > 200 || antwortRoh.length < 2) {
            verworfen++;
            continue;
        }
        const antwort = kuerze(antwortRoh, 500);
        if (!zahlenBelegt(`${frage} ${antwort}`, korpus.belege)) {
            verworfen++;
            continue;
        }
        const key = frage.toLowerCase();
        if (fragenGesehen.has(key)) continue;
        fragenGesehen.add(key);
        wissen.push({ frage, antwort, thema });
        if (wissen.length >= 30) break;
    }
    // AUFTRAG-102: Team-Wissen kommt nur aus den erkannten Personen (nie aus der KI): KI-Einträge zum Team
    // werden durch die geprüften Einträge ersetzt; Platz für sie schaffen (höchstens 30 insgesamt).
    const team = regel.wissen.filter((w) => w.thema === 'team');
    if (team.length) {
        const ohneTeam = wissen.filter((w) => !(w.thema === 'team' || TEAM_FRAGE_RE.test(w.frage)));
        wissen.length = 0;
        wissen.push(...ohneTeam.slice(0, 30 - team.length), ...team);
        for (const t of team) fragenGesehen.add(t.frage.toLowerCase());
    }
    // Mindestens 5 Einträge (Schnittstelle 091): mit regelbasierten auffüllen
    for (const r of regel.wissen) {
        if (wissen.length >= 5) break;
        if (!fragenGesehen.has(r.frage.toLowerCase())) wissen.push(r);
    }

    const assistentName = name && istErlaubterName(name) && erlaubt.includes(name) ? name : regel.assistent_name;
    return {
        profil: {
            firma: firma && firma.length >= 2 && firma.length <= 120 ? firma : regel.firma,
            website: regel.website,
            assistent_name: assistentName,
            branche: branche.length >= 2 && branche.length <= 30 ? branche : regel.branche,
            telefon,
            email,
            adresse,
            oeffnungszeiten_text: zeiten,
            firma_text: firmaText,
            faehigkeiten: faehigkeiten.slice(0, 3),
            wissen,
            logo_url: regel.logo_url,
            farben: regel.farben,
            stimme: stimmeFuer(assistentName),
            personen: regel.personen ?? [],
        },
        verworfen,
    };
}

/** Baut das Profil mit der KI; bei jedem Fehler regelbasiert. */
export async function baueProfil(x: Extrakt, zeitMs = KI_ZEIT_MS): Promise<ProfilErgebnis> {
    const t0 = Date.now();
    const regel = regelProfil(x);
    const schluessel = process.env.OPENAI_API_KEY;
    if (!schluessel) return { ...regel, ms: Date.now() - t0, fehler: 'kein OPENAI_API_KEY' };
    const korpus = korpusVon(x);
    const namen = freieNamen(korpus.text);
    // Reihenfolge je Website mischen (deterministisch), damit nicht jede Firma denselben Namen erhält
    const streue = (n: string) => {
        let h = 0;
        for (const c of `${x.host}|${n}`) h = (h * 33 + c.charCodeAt(0)) >>> 0;
        return h;
    };
    const namenFuerKi = (namen.length ? namen : erlaubteNamen()).sort((a, b) => streue(a) - streue(b));
    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${schluessel}` },
            body: JSON.stringify({
                model: KI_MODELL,
                temperature: 0.2,
                max_completion_tokens: 3500,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: `Erlaubte Vornamen: ${namenFuerKi.join(', ')}\n\nExtrakt (JSON):\n${JSON.stringify(kiEingabe(x))}`,
                    },
                ],
                response_format: {
                    type: 'json_schema',
                    json_schema: { name: 'assistenten_profil', strict: true, schema: kiSchema(namenFuerKi) },
                },
            }),
            signal: AbortSignal.timeout(zeitMs),
        });
        if (!res.ok) {
            return { ...regel, ms: Date.now() - t0, fehler: `OpenAI HTTP ${res.status}` };
        }
        const daten = (await res.json()) as { choices?: Array<{ message?: { content?: string; refusal?: string } }> };
        const inhalt = daten.choices?.[0]?.message?.content;
        if (!inhalt) return { ...regel, ms: Date.now() - t0, fehler: 'leere KI-Antwort' };
        const bereinigt = bereinigeKiProfil(JSON.parse(inhalt), x, regel.profil);
        if (!bereinigt) return { ...regel, ms: Date.now() - t0, fehler: 'KI-Antwort ungültig' };
        return {
            profil: bereinigt.profil,
            quelle: 'ki',
            weiblich: istWeiblich(bereinigt.profil.assistent_name),
            ms: Date.now() - t0,
            verworfen: bereinigt.verworfen,
        };
    } catch (e) {
        const grund = e instanceof Error ? (e.name === 'TimeoutError' ? 'Zeitlimit' : e.name) : 'Fehler';
        return { ...regel, ms: Date.now() - t0, fehler: `KI ${grund}` };
    }
}

/* ------------------------------------------------------------------ */
/* AUFTRAG-098: Fähigkeiten auf Englisch (Karte bei «English»)         */
/* ------------------------------------------------------------------ */

/**
 * Eigener, kleiner KI-Aufruf NUR wenn der Besucher «English» wählt — der
 * Profil-Aufruf bleibt unverändert (ein Zusatzfeld dort kürzte im A/B-Vergleich
 * das Wissen, siehe auftraege/ergebnisse/A098-profil-ab.md).
 */
const UEBERSETZUNG_PROMPT = `Übersetze die drei Fähigkeiten eines telefonischen KI-Assistenten ins Englische.
Regeln: gleiche Reihenfolge, gleiche Bedeutung, nichts hinzufügen; je 3 bis 6 Wörter; Verbform in der 3. Person wie im Deutschen (z. B. «Nimmt Terminwünsche entgegen» → «Takes appointment requests»); Eigennamen und Zahlen unverändert.`;

const DEUTSCHE_WOERTER = /\b(der|die|das|den|dem|des|und|oder|zu|zur|zum|für|mit|von|aus|bei|ihr|ihre|ihren|sie|nimmt|gibt|beantwortet|informiert|entgegen|auf|ist|rund|uhr)\b/i;

/** Prüft eine englische Fassung gegen ihr deutsches Original (Länge, nicht deutsch, nur Zahlen des Originals). */
export function englischGueltig(de: string, en: unknown): en is string {
    if (typeof en !== 'string') return false;
    const t = en.replace(/\s+/g, ' ').trim();
    if (t !== en || woerter(t) < 2 || woerter(t) > 8 || t.length > 60 || /[äöüßÄÖÜ«»]/.test(t)) return false;
    if (t.toLowerCase() === de.trim().toLowerCase() || DEUTSCHE_WOERTER.test(t)) return false;
    const zahlen = (s: string) => (s.match(/\d+/g) ?? []).sort().join(',');
    return zahlen(t) === zahlen(de);
}

/**
 * Englische Fähigkeiten zu den deutschen: Standard-Fähigkeiten fest übersetzt,
 * übrige aus `ki` (gleiche Stelle, geprüft). Fehlt eine gültige Fassung, gilt die
 * englische Standardliste (nie eine gemischt deutsch-englische Karte).
 */
export function faehigkeitenEnglisch(de: string[], ki: unknown[] = []): { en: string[]; vollstaendig: boolean } {
    const aus: string[] = [];
    for (const [i, d] of de.slice(0, 3).entries()) {
        const standard = STANDARD_FAEHIGKEITEN.indexOf(d);
        const wert = standard >= 0 ? STANDARD_FAEHIGKEITEN_EN[standard] : englischGueltig(d, ki[i]) ? (ki[i] as string) : null;
        if (!wert) return { en: [...STANDARD_FAEHIGKEITEN_EN], vollstaendig: false };
        aus.push(wert);
    }
    return aus.length === 3 ? { en: aus, vollstaendig: true } : { en: [...STANDARD_FAEHIGKEITEN_EN], vollstaendig: false };
}

export async function faehigkeitenAufEnglisch(de: string[], zeitMs = 8_000): Promise<{ en: string[]; quelle: 'standard' | 'ki' | 'rueckfall'; ms: number; fehler?: string }> {
    const t0 = Date.now();
    const ohneKi = faehigkeitenEnglisch(de);
    if (ohneKi.vollstaendig) return { en: ohneKi.en, quelle: 'standard', ms: 0 };
    const schluessel = process.env.OPENAI_API_KEY;
    if (!schluessel) return { en: ohneKi.en, quelle: 'rueckfall', ms: 0, fehler: 'kein OPENAI_API_KEY' };
    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${schluessel}` },
            body: JSON.stringify({
                model: KI_MODELL,
                temperature: 0,
                max_completion_tokens: 120,
                messages: [
                    { role: 'system', content: UEBERSETZUNG_PROMPT },
                    { role: 'user', content: JSON.stringify({ faehigkeiten: de.slice(0, 3) }) },
                ],
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'faehigkeiten_englisch',
                        strict: true,
                        schema: { type: 'object', additionalProperties: false, required: ['faehigkeiten_en'], properties: { faehigkeiten_en: { type: 'array', items: { type: 'string' } } } },
                    },
                },
            }),
            signal: AbortSignal.timeout(zeitMs),
        });
        if (!res.ok) return { en: ohneKi.en, quelle: 'rueckfall', ms: Date.now() - t0, fehler: `OpenAI HTTP ${res.status}` };
        const daten = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const roh = JSON.parse(daten.choices?.[0]?.message?.content ?? '{}') as { faehigkeiten_en?: unknown };
        const liste = Array.isArray(roh.faehigkeiten_en) ? roh.faehigkeiten_en.map((e) => (typeof e === 'string' ? e.replace(/\s+/g, ' ').trim() : e)) : [];
        const mitKi = faehigkeitenEnglisch(de, liste);
        return mitKi.vollstaendig ? { en: mitKi.en, quelle: 'ki', ms: Date.now() - t0 } : { en: mitKi.en, quelle: 'rueckfall', ms: Date.now() - t0, fehler: 'KI-Übersetzung ungültig' };
    } catch (e) {
        const grund = e instanceof Error ? (e.name === 'TimeoutError' ? 'Zeitlimit' : e.name) : 'Fehler';
        return { en: ohneKi.en, quelle: 'rueckfall', ms: Date.now() - t0, fehler: `KI ${grund}` };
    }
}

/** Formale Prüfung eines Profils gegen die Schnittstelle (Längen/Anzahl wie 091). */
export function profilFehler(p: Profil): string[] {
    const f: string[] = [];
    if (!p.firma || p.firma.length > 120) f.push('firma');
    if (!/^https?:\/\//.test(p.website)) f.push('website');
    if (!p.assistent_name || p.assistent_name.length < 2 || p.assistent_name.length > 20) f.push('assistent_name');
    if (!p.branche) f.push('branche');
    if (p.telefon !== null && !/^\+(41\d{9}|423\d{7})$/.test(p.telefon)) f.push('telefon');
    if (!p.firma_text || p.firma_text.length > 900) f.push('firma_text');
    if (p.faehigkeiten.length !== 3) f.push('faehigkeiten');
    if (p.wissen.length < 5 || p.wissen.length > 30) f.push('wissen_anzahl');
    if (p.wissen.some((w) => !w.frage || !w.antwort || w.antwort.length > 500 || !w.thema)) f.push('wissen_eintrag');
    if (p.farben && !(/^#[0-9A-F]{6}$/i.test(p.farben.primaer) && /^#[0-9A-F]{6}$/i.test(p.farben.sekundaer))) f.push('farben');
    if (p.stimme !== 'weiblich' && p.stimme !== 'maennlich') f.push('stimme');
    if (p.stimme !== stimmeFuer(p.assistent_name)) f.push('stimme_passt_nicht');
    // AUFTRAG-102: Personen nur mit Name und Rolle (höchstens 12), nie mit E-Mail oder Telefonnummer
    if (p.personen && (p.personen.length > MAX_PERSONEN || p.personen.some((x) => !x.name || x.name.length > 60 || !x.rolle || x.rolle.length > 120 || (x.zustaendigkeit?.length ?? 0) > 300 || /@|\d{3}\s?\d{2}\s?\d{2}/.test(`${x.name} ${x.rolle} ${x.zustaendigkeit ?? ''}`)))) f.push('personen');
    return f;
}
