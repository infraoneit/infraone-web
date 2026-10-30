'use client';

/**
 * Handelsregister-Schritt der KI-Demo (AUFTRAG-109): zwischen Scan und Anruf.
 *
 * Zeigt das Ergebnis des Abgleichs mit Zefix (automatisch: UID aus dem Impressum, sonst
 * Firmenname), lässt den Besucher bestätigen («Ja, das ist meine Firma», bei mehreren Treffern
 * Auswahl, höchstens 5) und bietet ohne Treffer eine zweite Suche «Firmenname oder UID»
 * (höchstens 3 je Scan). Erst nach der Bestätigung zeigt das Widget den Anruf-Schritt. Der
 * Server erzwingt das zusätzlich (POST /api/demo/anruf → 403 ohne signierten Nachweis).
 */
import { useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Check, Loader2, RotateCcw, Search } from 'lucide-react';
import { HR_TEXT, MANUELL_MAX, type HrAntwort, type HrBestaetigt, type HrTrefferAnzeige } from '@/lib/demo/handelsregister-texte';

const KNOPF =
    'w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-[1.1875rem] font-bold leading-6 text-center bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-default';
const KNOPF_ZWEIT =
    'inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl border-2 border-border text-text-primary text-base font-semibold hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-default';

const NETZ = 'Die Verbindung hat nicht geklappt. Bitte versuchen Sie es gleich nochmals.';

interface Props {
    scanId: string;
    /**
     * Ergebnis der automatischen Prüfung (startet schon während des Scans); null = läuft,
     * 'netz' = Verbindungsfehler. Eine bestätigte Antwort behandelt das Widget selbst (dann
     * erscheint dieser Schritt nicht).
     */
    start: HrAntwort | 'netz' | null;
    /** automatische Prüfung nochmals anstossen (Register war nicht erreichbar) */
    onNochmals: () => void;
    onBestaetigt: (b: HrBestaetigt) => void;
    /** Hinweis von aussen, z. B. «Bestätigung abgelaufen» nach 403 der Anruf-Route */
    hinweis?: string | null;
}

function versucheText(n: number): string {
    return n === 1 ? 'Noch 1 Versuch' : `Noch ${n} Versuche`;
}

function quelleText(q: HrAntwort['quelle']): string | null {
    if (q === 'uid') return 'Gefunden über die UID auf Ihrer Website.';
    if (q === 'name') return 'Gefunden über den Firmennamen auf Ihrer Website.';
    if (q === 'manuell') return 'Gefunden über Ihre Eingabe.';
    return null;
}

function Eintrag({ t, gewaehlt, name, onWahl }: { t: HrTrefferAnzeige; gewaehlt: boolean; name: string; onWahl: () => void }) {
    const id = `ki-demo-hr-${t.uid}`;
    return (
        <label
            htmlFor={id}
            className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
                t.aktiv ? 'cursor-pointer' : 'cursor-default opacity-75'
            } ${gewaehlt ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-surface'}`}
            data-uid={t.uid}
            data-aktiv={t.aktiv ? 'true' : 'false'}
        >
            <input id={id} type="radio" name={name} value={t.uid} checked={gewaehlt} disabled={!t.aktiv} onChange={onWahl} className="mt-1 w-5 h-5 flex-shrink-0 accent-[var(--primary)]" />
            <span className="min-w-0 flex-1">
                <span className="block text-[0.98rem] font-semibold leading-snug text-text-primary break-words">{t.name}</span>
                <span className="mt-1 block text-sm text-text-secondary">
                    Sitz: {t.sitz || 'unbekannt'}
                    {t.rechtsform ? ` · ${t.rechtsform}` : ''}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
                    <span className="tabular-nums">UID: {t.uid_formatiert}</span>
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            t.aktiv ? 'bg-primary/10 text-text-primary' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200'
                        }`}
                    >
                        Status: {t.status_text}
                    </span>
                </span>
            </span>
        </label>
    );
}

export function Handelsregister({ scanId, start, onNochmals, onBestaetigt, hinweis = null }: Props) {
    // Antwort einer eigenen Suche, gebunden an die automatische Antwort, auf der sie aufbaut:
    // kommt eine neue automatische Antwort (Nochmals prüfen, neuer Scan), gilt wieder diese.
    const [eigene, setEigene] = useState<{ basis: Props['start']; antwort: HrAntwort } | null>(null);
    const [wahl, setWahl] = useState<string | null>(null);
    const [suchOffen, setSuchOffen] = useState(false);
    const [suche, setSuche] = useState('');
    const [laeuft, setLaeuft] = useState<'suche' | 'bestaetige' | null>(null);
    const [fehler, setFehler] = useState<string | null>(null);
    const radioName = useId();

    const eigeneGilt = !!eigene && eigene.basis === start;
    const antwort: HrAntwort | null = eigeneGilt ? eigene.antwort : start && start !== 'netz' ? start : null;
    const netz = !eigeneGilt && start === 'netz';
    const setAntwort = (a: HrAntwort) => setEigene({ basis: start, antwort: a });

    // Auswahl: Wahl des Besuchers, sonst genau ein aktiver Eintrag vorgewählt
    const treffer = antwort?.treffer ?? [];
    const aktive = treffer.filter((t) => t.aktiv);
    const auswahl = wahl && aktive.some((t) => t.uid === wahl) ? wahl : aktive.length === 1 ? aktive[0].uid : null;

    const post = async (body: Record<string, string>) => {
        const res = await fetch('/api/demo/handelsregister', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scan_id: scanId, ...body }),
        });
        const daten = await res.json().catch(() => null);
        return { res, daten };
    };

    const bestaetigen = async () => {
        if (!auswahl || laeuft) return;
        setLaeuft('bestaetige');
        setFehler(null);
        try {
            const { res, daten } = await post({ bestaetige: auswahl });
            if (res.ok && daten?.bestaetigt && daten.scan_id === scanId) {
                onBestaetigt(daten.bestaetigt as HrBestaetigt);
                return;
            }
            setFehler(typeof daten?.fehler === 'string' ? daten.fehler : NETZ);
        } catch {
            setFehler(NETZ);
        } finally {
            setLaeuft(null);
        }
    };

    const suchen = async (e: FormEvent) => {
        e.preventDefault();
        if (laeuft) return;
        const text = suche.trim();
        if (text.length < 3) {
            setFehler(HR_TEXT.suchtextKurz);
            document.getElementById('ki-demo-hr-suche')?.focus();
            return;
        }
        setLaeuft('suche');
        setFehler(null);
        try {
            const { res, daten } = await post({ suche: text });
            if (res.ok && daten && daten.scan_id === scanId) {
                // schon bestätigt (gültiger Nachweis) → direkt weiter
                if (daten.ergebnis === 'bestaetigt' && daten.bestaetigt) {
                    onBestaetigt(daten.bestaetigt as HrBestaetigt);
                    return;
                }
                setAntwort(daten as HrAntwort);
                setWahl(null);
                if ((daten as HrAntwort).ergebnis === 'treffer') setSuchOffen(false);
                return;
            }
            if (res.status === 429 && antwort) setAntwort({ ...antwort, versuche_rest: 0 });
            setFehler(typeof daten?.fehler === 'string' ? daten.fehler : NETZ);
        } catch {
            setFehler(NETZ);
        } finally {
            setLaeuft(null);
        }
    };

    const rest = antwort?.versuche_rest ?? 0;
    const ergebnis = netz ? 'netz' : (antwort?.ergebnis ?? 'pruefen');
    const ohneAktive = ergebnis === 'kein_treffer' || ergebnis === 'nicht_aktiv';
    const ausgeschoepft = ohneAktive && rest === 0;
    const suchFormular = (ohneAktive && rest > 0) || (ergebnis === 'treffer' && suchOffen && rest > 0);

    const titel =
        ergebnis === 'pruefen' || ergebnis === 'bestaetigt' || ergebnis === 'uebersprungen'
            ? 'Ihre Firma im Handelsregister'
            : ergebnis === 'netz' || ergebnis === 'nicht_erreichbar'
              ? 'Handelsregister nicht erreichbar'
              : ergebnis === 'treffer'
                ? aktive.length > 1
                    ? 'Welche ist Ihre Firma?'
                    : 'Ist das Ihre Firma?'
                : ausgeschoepft
                  ? 'Kein Testanruf möglich'
                  : ergebnis === 'nicht_aktiv'
                    ? 'Kein aktiver Eintrag gefunden'
                    : 'Firma nicht gefunden';

    return (
        <div data-handelsregister={ergebnis}>
            <h2 id="ki-demo-anruf-titel" className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {titel}
            </h2>

            {hinweis && ergebnis !== 'pruefen' && (
                <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
                    {hinweis}
                </p>
            )}

            {ergebnis === 'pruefen' && (
                <p role="status" className="mt-4 flex items-center gap-3 rounded-2xl bg-surface border border-border px-4 py-4 text-text-secondary">
                    <Loader2 className="w-5 h-5 flex-shrink-0 text-primary motion-safe:animate-spin" aria-hidden="true" />
                    Wir gleichen Ihre Website mit dem Handelsregister ab …
                </p>
            )}

            {(ergebnis === 'netz' || ergebnis === 'nicht_erreichbar') && (
                <div className="mt-4 space-y-4">
                    <p role="alert" className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                        {ergebnis === 'netz' ? NETZ : HR_TEXT.nichtErreichbar}
                    </p>
                    <button type="button" onClick={onNochmals} className={KNOPF_ZWEIT} id="ki-demo-hr-nochmals">
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        Nochmals prüfen
                    </button>
                </div>
            )}

            {(ergebnis === 'treffer' || ergebnis === 'nicht_aktiv') && treffer.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm text-text-secondary">
                        {ergebnis === 'treffer'
                            ? aktive.length > 1
                                ? 'Wir haben mehrere Einträge im Handelsregister gefunden. Wählen Sie Ihre Firma.'
                                : 'Diesen Eintrag haben wir im Handelsregister gefunden.'
                            : 'Diese Einträge sind im Handelsregister nicht aktiv.'}{' '}
                        {quelleText(antwort?.quelle ?? null)}
                    </p>
                    <fieldset className="mt-3 space-y-2.5 min-w-0" aria-label="Einträge im Handelsregister">
                        {treffer.map((t) => (
                            <Eintrag key={t.uid} t={t} name={radioName} gewaehlt={auswahl === t.uid} onWahl={() => setWahl(t.uid)} />
                        ))}
                    </fieldset>
                </div>
            )}

            {ergebnis === 'treffer' && (
                <div className="mt-5 space-y-3">
                    <button type="button" onClick={bestaetigen} disabled={!auswahl || !!laeuft} className={KNOPF} id="ki-demo-hr-bestaetigen">
                        {laeuft === 'bestaetige' ? <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Check className="w-5 h-5" aria-hidden="true" />}
                        Ja, das ist meine Firma
                    </button>
                    {!suchOffen && rest > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setSuchOffen(true);
                                setFehler(null);
                                setTimeout(() => document.getElementById('ki-demo-hr-suche')?.focus(), 0);
                            }}
                            className="block mx-auto text-sm font-semibold text-text-primary underline underline-offset-2 hover:no-underline"
                            id="ki-demo-hr-andere"
                        >
                            {aktive.length > 1 ? 'Meine Firma ist nicht dabei' : 'Nein, andere Firma suchen'}
                        </button>
                    )}
                </div>
            )}

            {ohneAktive && !ausgeschoepft && (
                <p className="mt-4 text-sm text-text-secondary">
                    {ergebnis === 'kein_treffer'
                        ? rest < MANUELL_MAX
                            ? 'Zu dieser Eingabe haben wir im Handelsregister keinen Eintrag gefunden.'
                            : 'Zu Ihrer Website haben wir im Handelsregister keinen passenden Eintrag gefunden.'
                        : HR_TEXT.aktivNoetig}{' '}
                    Geben Sie den Firmennamen oder die UID ein, dann suchen wir nochmals.
                </p>
            )}

            {suchFormular && (
                <form onSubmit={suchen} noValidate className="mt-4" aria-label="Firma im Handelsregister suchen">
                    <label htmlFor="ki-demo-hr-suche" className="block text-sm font-medium text-text-primary mb-2">
                        Firmenname oder UID
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1 min-w-0">
                            <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" aria-hidden="true" />
                            <input
                                id="ki-demo-hr-suche"
                                type="text"
                                value={suche}
                                onChange={(e) => setSuche(e.target.value)}
                                maxLength={120}
                                autoComplete="organization"
                                placeholder="z. B. Muster AG oder CHE-123.456.789"
                                aria-describedby="ki-demo-hr-versuche"
                                className="w-full h-12 pl-11 pr-3 rounded-xl border border-border bg-background text-text-primary text-base placeholder:text-text-secondary/70 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <button type="submit" disabled={!!laeuft} className={KNOPF_ZWEIT} id="ki-demo-hr-suchen">
                            {laeuft === 'suche' ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />}
                            Suchen
                        </button>
                    </div>
                    <p id="ki-demo-hr-versuche" className="mt-2 text-xs text-text-secondary">
                        {versucheText(rest)}
                    </p>
                </form>
            )}

            {fehler && (
                <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
                    {fehler}
                </p>
            )}

            {ausgeschoepft && (
                <div className="mt-4 space-y-4">
                    <p role="alert" className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                        {HR_TEXT.aktivNoetig} Gerne zeigen wir Ihnen den Assistenten persönlich.
                    </p>
                    <Link href={`/kontakt?subject=${encodeURIComponent('KI-Telefonassistent')}`} className={KNOPF} id="ki-demo-hr-kontakt">
                        Kontakt aufnehmen
                        <ArrowRight className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    </Link>
                </div>
            )}

            <p className="mt-5 text-xs text-text-secondary">{HR_TEXT.datenschutz}</p>
        </div>
    );
}
