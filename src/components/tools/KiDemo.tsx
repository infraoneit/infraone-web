'use client';

/**
 * KI-Telefonassistent-Demo (AUFTRAG-092, Teil B).
 *
 * Ablauf: Website eingeben → Scan (Chips je echtem Ergebnis) → KI-Profil →
 * Assistenten-Karte in Farben/Logo des Besuchers → Sprache, Nummer,
 * Einwilligung → Rückruf-Auftrag → Status-Polling → Zusammenfassung.
 *
 * Kundeninhalte (Karte) tragen die Farben des Kunden, nie InfraOne-Grün
 * (Portmann-Prinzip). Buttons/CTA bleiben im Marken-Grün.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Globe, Loader2, PhoneCall } from 'lucide-react';
import styles from './KiDemo.module.css';
import { dominanteFarbe, helligkeit, kontrast, lesbarAuf, luminanz, NEUTRAL_PRIMAER, textAuf, hexZuRgb } from '@/lib/demo/farben';
import { pruefeRueckrufNummer } from '@/lib/demo/nummer';
import type { AuftragStatus, Profil, SchrittSchluessel, Sprache } from '@/lib/demo/typen';

/* ------------------------------------------------------------------ */
/* Texte (wortgleich aus AUFTRAG-092)                                  */
/* ------------------------------------------------------------------ */

const CHIP_TEXT: Record<SchrittSchluessel, string> = {
    website: 'Website gelesen',
    unternehmen: 'Unternehmensinfos erkannt',
    kontakt: 'Kontaktdaten gefunden',
    oeffnungszeiten: 'Öffnungszeiten geprüft',
    leistungen: 'Leistungen erfasst',
    branding: 'Branding analysiert',
    wissen: 'Wissen aufgebaut',
    assistent: 'Assistent wird vorbereitet',
};

const SPRACH_WAHL: Array<{ wert: Sprache; text: string }> = [
    { wert: 'dialekt_auto', text: 'Schweizerdeutsch' },
    { wert: 'hochdeutsch', text: 'Hochdeutsch' },
    { wert: 'englisch', text: 'English' },
];

const STATUS_TEXT: Record<AuftragStatus, string> = {
    wartend: 'Ihr Assistent wählt gleich …',
    angenommen: 'Ihr Assistent wählt gleich …',
    waehlt: 'Es klingelt bei Ihnen …',
    verbunden: 'Gespräch läuft',
    beendet: 'Gespräch beendet – so lief es:',
    fehler: 'Leider nicht erreicht. Versuchen Sie es gleich nochmals oder rufen Sie uns an: 052 222 18 18.',
};

const NACH_GESPRAECH =
    'Das war ein Assistent aus Ihrer Website – in einer Minute. Mit Ihren Vorgaben, Ihrer Begrüssung und Ihrem Wissen richten wir ihn für Ihren Betrieb ein.';

/** Clientseitige Kurzmeldungen (Server liefert eigene Klartexte). */
const HINWEIS = {
    url: 'Bitte geben Sie eine gültige Website-Adresse ein, z. B. muster-ag.ch.',
    netz: 'Die Verbindung hat nicht geklappt. Bitte versuchen Sie es gleich nochmals.',
    nummer: 'Bitte geben Sie eine gültige Schweizer oder Liechtensteiner Telefonnummer ein.',
    sonderdienst: 'An Mehrwert- und Sondernummern können wir nicht anrufen.',
    einwilligung: 'Bitte bestätigen Sie, dass Sie den Testanruf erhalten möchten.',
};

/* ------------------------------------------------------------------ */
/* Wellenform                                                          */
/* ------------------------------------------------------------------ */

type WellenModus = 'ruhe' | 'scan' | 'klingeln' | 'sprechen' | 'still';

function wellenHoehen(n: number): number[] {
    const mitte = (n - 1) / 2;
    return Array.from({ length: n }, (_, i) => {
        const x = (i - mitte) / (n * 0.3);
        const huelle = Math.exp(-x * x);
        const zacke = 0.62 + 0.38 * Math.abs(Math.sin(i * 1.37 + 0.4));
        return Math.round((0.12 + 0.88 * huelle * zacke) * 1000) / 1000;
    });
}

const HOEHEN_GROSS = wellenHoehen(48);
const HOEHEN_KLEIN = wellenHoehen(22);

function Welle({ farbe, modus, kompakt = false, className = '' }: { farbe: string; modus: WellenModus; kompakt?: boolean; className?: string }) {
    const hoehen = kompakt ? HOEHEN_KLEIN : HOEHEN_GROSS;
    return (
        <div
            className={`${styles.welle} ${kompakt ? styles.kompakt : ''} ${className}`}
            data-modus={modus}
            style={{ '--welle': farbe } as CSSProperties}
            aria-hidden="true"
        >
            {!kompakt && <div className={styles.glow} />}
            {!kompakt && (
                <div className={styles.ringe}>
                    <span />
                    <span />
                    <span />
                </div>
            )}
            <div className={styles.balken}>
                {hoehen.map((h, i) => (
                    <span key={i} style={{ '--h': h, '--i': i } as CSSProperties} />
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Hilfen                                                              */
/* ------------------------------------------------------------------ */

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ScanAntwort {
    scan_id: string;
    schritte: Array<{ schluessel: SchrittSchluessel; ok: boolean }>;
    profil: Profil;
    assistent_weiblich: boolean;
    logo_kandidaten: string[];
}

interface ProfilAntwort {
    profil: Profil;
    assistent_weiblich: boolean;
}

interface LogoErgebnis {
    src: string | null;
    /** Original-URL des geladenen Logos (für das Profil) */
    url: string | null;
    farbe: { primaer: string; sekundaer: string | null } | null;
    hell: boolean;
}

function ladeBild(src: string, zeitMs: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const t = setTimeout(() => reject(new Error('Zeit')), zeitMs);
        img.onload = () => {
            clearTimeout(t);
            resolve(img);
        };
        img.onerror = () => {
            clearTimeout(t);
            reject(new Error('Bild'));
        };
        img.decoding = 'async';
        img.src = src;
    });
}

/** Lädt das erste brauchbare Logo über den Proxy und bestimmt die dominante Farbe. */
async function analysiereLogo(kandidaten: string[]): Promise<LogoErgebnis> {
    for (const u of kandidaten.slice(0, 4)) {
        const src = `/api/demo/bild?u=${encodeURIComponent(u)}`;
        try {
            const img = await ladeBild(src, 7000);
            const w = img.naturalWidth || 96;
            const h = img.naturalHeight || 96;
            if (w < 24 && h < 24) continue;
            const massstab = Math.min(1, 96 / Math.max(w, h));
            const cw = Math.max(1, Math.round(w * massstab));
            const ch = Math.max(1, Math.round(h * massstab));
            const canvas = document.createElement('canvas');
            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return { src, url: u, farbe: null, hell: false };
            ctx.drawImage(img, 0, 0, cw, ch);
            const pixel = ctx.getImageData(0, 0, cw, ch).data;
            let summe = 0;
            let n = 0;
            for (let i = 0; i < pixel.length; i += 4) {
                if (pixel[i + 3] < 200) continue;
                summe += (0.2126 * pixel[i] + 0.7152 * pixel[i + 1] + 0.0722 * pixel[i + 2]) / 255;
                n++;
            }
            const hell = n > 0 && summe / n > 0.82;
            return { src, url: u, farbe: dominanteFarbe(pixel), hell };
        } catch {
            continue;
        }
    }
    return { src: null, url: null, farbe: null, hell: false };
}

function hostVon(eingabe: string): string {
    try {
        const s = eingabe.trim();
        return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).hostname.replace(/^www\./, '');
    } catch {
        return eingabe.trim();
    }
}

function dauerText(s: number | null): string | null {
    if (s === null || s === undefined) return null;
    const m = Math.floor(s / 60);
    const sek = String(s % 60).padStart(2, '0');
    return `${m}:${sek} Min.`;
}

/* ------------------------------------------------------------------ */
/* Komponente                                                          */
/* ------------------------------------------------------------------ */

type Phase = 'eingabe' | 'scan' | 'karte';

interface KartenDaten {
    scanId: string;
    profil: Profil;
    weiblich: boolean;
    logo: LogoErgebnis;
    primaer: string;
    sekundaer: string;
}

interface AuftragZustand {
    id: string;
    status: AuftragStatus;
    dauer_s: number | null;
    zusammenfassung: string | null;
}

declare global {
    interface Window {
        turnstile?: {
            render: (el: HTMLElement, opt: Record<string, unknown>) => string;
            reset: (id?: string) => void;
        };
    }
}

export function KiDemo({ children, turnstileSiteKey }: { children: ReactNode; turnstileSiteKey?: string }) {
    const [phase, setPhase] = useState<Phase>('eingabe');
    const [eingabe, setEingabe] = useState('');
    const [scanFehler, setScanFehler] = useState<string | null>(null);
    const [chips, setChips] = useState<SchrittSchluessel[]>([]);
    const [host, setHost] = useState('');
    const [karte, setKarte] = useState<KartenDaten | null>(null);

    const [sprache, setSprache] = useState<Sprache>('dialekt_auto');
    const [vorwahl, setVorwahl] = useState<'+41' | '+423'>('+41');
    const [nummer, setNummer] = useState('');
    const [einwilligung, setEinwilligung] = useState(false);
    const [honigtopf, setHonigtopf] = useState('');
    const [formFehler, setFormFehler] = useState<string | null>(null);
    const [sendet, setSendet] = useState(false);
    const [auftrag, setAuftrag] = useState<AuftragZustand | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const laufId = useRef(0);
    const kartenRef = useRef<HTMLDivElement>(null);
    const turnstileRef = useRef<HTMLDivElement>(null);
    const turnstileWidget = useRef<string | null>(null);

    /* ---------- Scan ---------- */

    const starteScan = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            const wert = eingabe.trim();
            if (!wert || wert.length > 300 || !/\.[a-z]{2,}/i.test(wert)) {
                setScanFehler(HINWEIS.url);
                return;
            }
            const lauf = ++laufId.current;
            const aktuell = () => laufId.current === lauf;
            setScanFehler(null);
            setChips([]);
            setKarte(null);
            setAuftrag(null);
            setFormFehler(null);
            setHost(hostVon(wert));
            setPhase('scan');

            const zeige = async (k: SchrittSchluessel) => {
                if (!aktuell()) return;
                setChips((c) => (c.includes(k) ? c : [...c, k]));
                await pause(280);
            };

            let scan: ScanAntwort;
            try {
                const res = await fetch('/api/demo/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: wert }),
                });
                const daten = await res.json().catch(() => ({}));
                if (!res.ok) {
                    if (!aktuell()) return;
                    setScanFehler(typeof daten.fehler === 'string' ? daten.fehler : HINWEIS.netz);
                    setPhase('eingabe');
                    return;
                }
                scan = daten as ScanAntwort;
            } catch {
                if (!aktuell()) return;
                setScanFehler(HINWEIS.netz);
                setPhase('eingabe');
                return;
            }
            if (!aktuell()) return;

            // Stufe 2 und Logo-Analyse starten sofort (parallel zu den Chips)
            const profilVersprechen: Promise<ProfilAntwort> = fetch('/api/demo/profil', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scan_id: scan.scan_id }),
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => (d && d.profil ? (d as ProfilAntwort) : { profil: scan.profil, assistent_weiblich: scan.assistent_weiblich }))
                .catch(() => ({ profil: scan.profil, assistent_weiblich: scan.assistent_weiblich }));
            const logoVersprechen = analysiereLogo(scan.logo_kandidaten);

            const ok = new Map(scan.schritte.map((s) => [s.schluessel, s.ok]));
            for (const k of ['website', 'unternehmen', 'kontakt', 'oeffnungszeiten', 'leistungen'] as SchrittSchluessel[]) {
                if (ok.get(k)) await zeige(k);
            }
            const logo = await logoVersprechen;
            if (ok.get('branding') || logo.src) await zeige('branding');
            const profil = await profilVersprechen;
            if (profil.profil.wissen.length) await zeige('wissen');
            await zeige('assistent');

            const primaer = logo.farbe?.primaer ?? profil.profil.farben?.primaer ?? NEUTRAL_PRIMAER;
            const sekundaer = logo.farbe?.sekundaer ?? profil.profil.farben?.sekundaer ?? helligkeit(primaer, -0.18);
            await pause(450);
            if (!aktuell()) return;
            setKarte({ scanId: scan.scan_id, profil: profil.profil, weiblich: profil.assistent_weiblich, logo, primaer, sekundaer });
            setPhase('karte');
        },
        [eingabe],
    );

    // Karte ins Bild holen, sobald sie erscheint
    useEffect(() => {
        if (phase !== 'karte' || !kartenRef.current) return;
        const r = kartenRef.current.getBoundingClientRect();
        if (r.top > window.innerHeight * 0.6 || r.top < 0) {
            const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            kartenRef.current.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' });
        }
    }, [phase]);

    /* ---------- Turnstile (nur wenn konfiguriert) ---------- */

    useEffect(() => {
        if (!turnstileSiteKey || phase !== 'karte' || !turnstileRef.current || turnstileWidget.current) return;
        const rendern = () => {
            if (!window.turnstile || !turnstileRef.current || turnstileWidget.current) return;
            turnstileWidget.current = window.turnstile.render(turnstileRef.current, {
                sitekey: turnstileSiteKey,
                callback: (t: string) => setTurnstileToken(t),
                'expired-callback': () => setTurnstileToken(null),
                language: 'de',
            });
        };
        if (window.turnstile) {
            rendern();
            return;
        }
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.onload = rendern;
        document.head.appendChild(s);
    }, [turnstileSiteKey, phase]);

    /* ---------- Anruf ---------- */

    const starteAnruf = async (e: FormEvent) => {
        e.preventDefault();
        if (!karte || sendet) return;
        setFormFehler(null);
        const pruefung = pruefeRueckrufNummer(nummer, vorwahl);
        if (!pruefung.ok) {
            setFormFehler(pruefung.grund === 'sonderdienst' ? HINWEIS.sonderdienst : HINWEIS.nummer);
            return;
        }
        if (!einwilligung) {
            setFormFehler(HINWEIS.einwilligung);
            return;
        }
        setSendet(true);
        try {
            const res = await fetch('/api/demo/anruf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scan_id: karte.scanId,
                    nummer: pruefung.e164,
                    sprache,
                    einwilligung: true,
                    honigtopf,
                    farben: { primaer: karte.primaer, sekundaer: karte.sekundaer },
                    ...(karte.logo.url ? { logo_url: karte.logo.url } : {}),
                    ...(turnstileSiteKey ? { turnstile: turnstileToken } : {}),
                }),
            });
            const daten = await res.json().catch(() => ({}));
            if (res.status !== 201 || typeof daten.id !== 'string') {
                setFormFehler(typeof daten.fehler === 'string' ? daten.fehler : HINWEIS.netz);
                if (turnstileWidget.current && window.turnstile) window.turnstile.reset(turnstileWidget.current);
                return;
            }
            setAuftrag({ id: daten.id, status: 'wartend', dauer_s: null, zusammenfassung: null });
        } catch {
            setFormFehler(HINWEIS.netz);
        } finally {
            setSendet(false);
        }
    };

    // Status-Polling alle 2 s bis zum Endzustand (höchstens 12 Minuten)
    const auftragId = auftrag?.id;
    useEffect(() => {
        if (!auftragId) return;
        let aktiv = true;
        const start = Date.now();
        let timer: ReturnType<typeof setTimeout>;
        const abfragen = async () => {
            if (!aktiv) return;
            try {
                const res = await fetch(`/api/demo/auftraege/${auftragId}`, { cache: 'no-store' });
                if (res.ok) {
                    const d = (await res.json()) as AuftragZustand;
                    if (!aktiv) return;
                    setAuftrag((a) => (a && a.id === d.id ? { ...a, status: d.status, dauer_s: d.dauer_s, zusammenfassung: d.zusammenfassung } : a));
                    if (d.status === 'beendet' || d.status === 'fehler') return;
                }
            } catch {
                /* nächster Versuch */
            }
            if (Date.now() - start > 12 * 60 * 1000) {
                setAuftrag((a) => (a ? { ...a, status: 'fehler' } : a));
                return;
            }
            timer = setTimeout(abfragen, 2000);
        };
        timer = setTimeout(abfragen, 1200);
        return () => {
            aktiv = false;
            clearTimeout(timer);
        };
    }, [auftragId]);

    /* ---------- Darstellung ---------- */

    const kundenFarbe = karte?.primaer ?? null;
    const wellenFarbe = kundenFarbe ?? '#4CAF50';
    const status = auftrag?.status ?? null;
    const wellenModus: WellenModus =
        phase === 'scan'
            ? 'scan'
            : status === 'waehlt'
              ? 'klingeln'
              : status === 'verbunden'
                ? 'sprechen'
                : status === 'wartend' || status === 'angenommen'
                  ? 'scan'
                  : status === 'beendet' || status === 'fehler'
                    ? 'still'
                    : 'ruhe';
    const laeuft = !!auftrag && status !== 'beendet' && status !== 'fehler';
    const formSichtbar = !auftrag || status === 'fehler';

    return (
        <>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                <div className="lg:col-span-6">
                    {children}

                    <form onSubmit={starteScan} className="mt-8" noValidate>
                        <label htmlFor="ki-demo-url" className="sr-only">
                            Ihre Website
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                id="ki-demo-url"
                                type="text"
                                inputMode="url"
                                autoComplete="url"
                                autoCapitalize="none"
                                spellCheck={false}
                                value={eingabe}
                                onChange={(e) => setEingabe(e.target.value)}
                                placeholder="Ihre Website, z. B. muster-ag.ch"
                                aria-invalid={!!scanFehler}
                                aria-describedby={scanFehler ? 'ki-demo-url-fehler' : 'ki-demo-vertrauen'}
                                className="w-full sm:flex-1 min-w-0 h-14 px-5 rounded-xl border border-border bg-card text-text-primary text-lg placeholder:text-text-secondary/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={phase === 'scan'}
                                className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-wait whitespace-nowrap"
                            >
                                {phase === 'scan' ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : null}
                                Assistent erstellen
                            </button>
                        </div>
                        {scanFehler && (
                            <p id="ki-demo-url-fehler" role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
                                {scanFehler}
                            </p>
                        )}
                        <p id="ki-demo-vertrauen" className="mt-4 text-sm text-text-secondary">
                            Kostenlos · Ohne Anmeldung · Keine Werbeanrufe
                        </p>
                    </form>
                </div>

                {/* Bühne: Wellenform → Chips → Firmenfarbe */}
                <div className="lg:col-span-6">
                    <div className="relative flex flex-col min-h-[260px] sm:min-h-[400px] rounded-3xl border border-border bg-gradient-to-b from-card to-surface/60 dark:from-card dark:to-background/40 shadow-xl shadow-black/5 overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                        <div className="flex-1 flex items-center">
                            <Welle farbe={wellenFarbe} modus={wellenModus} className="[--welle-hoehe:150px] sm:[--welle-hoehe:200px]" />
                        </div>
                        <div className={phase === 'eingabe' && !chips.length ? '' : 'mt-2 min-h-[7.5rem]'} aria-live="polite">
                            {phase !== 'eingabe' && host && (
                                <p className="text-center text-sm font-mono text-text-secondary mb-4 truncate" title={host}>
                                    {host}
                                </p>
                            )}
                            <ul className="flex flex-wrap justify-center gap-2">
                                {chips.map((k) => (
                                    <li
                                        key={k}
                                        className={`${styles.chip} inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 dark:bg-background/60 px-3 py-1.5 text-sm text-text-primary`}
                                    >
                                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white">
                                            <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
                                        </span>
                                        {CHIP_TEXT[k]}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assistenten-Karte (Kundenfarben) */}
            {karte && (
                <div ref={kartenRef} className={`mt-12 lg:mt-16 scroll-mt-24 ${styles.karteRein}`}>
                    <AssistentenKarte karte={karte}>
                        {formSichtbar && (
                            <form onSubmit={starteAnruf} noValidate className="space-y-5">
                                {status === 'fehler' && (
                                    <p role="alert" className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                                        Leider nicht erreicht. Versuchen Sie es gleich nochmals oder rufen Sie uns an:{' '}
                                        <a href="tel:+41522221818" className="font-semibold underline whitespace-nowrap">
                                            052 222 18 18
                                        </a>
                                        .
                                    </p>
                                )}
                                <fieldset>
                                    <legend className="sr-only">Sprache</legend>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-2">
                                        {SPRACH_WAHL.map((s) => {
                                            const aktiv = sprache === s.wert;
                                            return (
                                                <label
                                                    key={s.wert}
                                                    htmlFor={`ki-demo-sprache-${s.wert}`}
                                                    className={`relative flex items-center justify-center text-center rounded-xl border px-2 py-3 text-sm font-medium cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[var(--kunde-ring)] ${
                                                        aktiv
                                                            ? 'border-[var(--kunde-hell)] bg-[var(--kunde-flaeche)] text-[#111418] dark:border-[var(--kunde-dunkel)] dark:text-white'
                                                            : 'border-[#d9dde3] text-[#3b4350] hover:border-[#aab1bb] dark:border-[#2c323b] dark:text-[#c9ced6] dark:hover:border-[#4a525e]'
                                                    }`}
                                                >
                                                    <input
                                                        id={`ki-demo-sprache-${s.wert}`}
                                                        type="radio"
                                                        name="ki-demo-sprache"
                                                        aria-label={s.text}
                                                        value={s.wert}
                                                        checked={aktiv}
                                                        onChange={() => setSprache(s.wert)}
                                                        className="sr-only"
                                                    />
                                                    {s.text}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </fieldset>

                                <div>
                                    <label htmlFor="ki-demo-nummer" className="block text-sm font-medium text-[#111418] dark:text-[#eef0f3] mb-2">
                                        Ihre Telefonnummer
                                    </label>
                                    <div className="flex rounded-xl border border-[#d9dde3] dark:border-[#2c323b] bg-white dark:bg-[#0f1216] focus-within:ring-2 focus-within:ring-[var(--kunde-ring)] overflow-hidden">
                                        <label htmlFor="ki-demo-vorwahl" className="sr-only">
                                            Vorwahl
                                        </label>
                                        <select
                                            id="ki-demo-vorwahl"
                                            value={vorwahl}
                                            onChange={(e) => setVorwahl(e.target.value as '+41' | '+423')}
                                            className="h-12 pl-3 pr-1 bg-[#f3f4f6] dark:bg-[#1a1f26] text-[#111418] dark:text-[#eef0f3] border-r border-[#d9dde3] dark:border-[#2c323b] text-base focus:outline-none"
                                        >
                                            <option value="+41">+41</option>
                                            <option value="+423">+423</option>
                                        </select>
                                        <input
                                            id="ki-demo-nummer"
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel-national"
                                            value={nummer}
                                            onChange={(e) => setNummer(e.target.value)}
                                            placeholder="79 123 45 67"
                                            className="flex-1 min-w-0 h-12 px-3 bg-transparent text-[#111418] dark:text-[#eef0f3] text-base placeholder:text-[#8a929e] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Honigtopf: für Menschen unsichtbar */}
                                <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
                                    <label htmlFor="ki-demo-web">Website-Kontakt</label>
                                    <input id="ki-demo-web" type="text" tabIndex={-1} autoComplete="off" value={honigtopf} onChange={(e) => setHonigtopf(e.target.value)} />
                                </div>

                                <label htmlFor="ki-demo-einwilligung" className="flex items-start gap-3 text-sm text-[#3b4350] dark:text-[#c9ced6] cursor-pointer">
                                    <input
                                        id="ki-demo-einwilligung"
                                        type="checkbox"
                                        aria-labelledby="ki-demo-einwilligung-text"
                                        checked={einwilligung}
                                        onChange={(e) => setEinwilligung(e.target.checked)}
                                        className="mt-0.5 w-5 h-5 flex-shrink-0 rounded accent-[var(--kunde-hell)] dark:accent-[var(--kunde-dunkel)]"
                                    />
                                    <span id="ki-demo-einwilligung-text">
                                        Ich bin unter dieser Nummer erreichbar und möchte den Testanruf erhalten. Es gelten die{' '}
                                        <Link href="/datenschutz" className="underline underline-offset-2 hover:no-underline" target="_blank">
                                            Datenschutzhinweise
                                        </Link>
                                        .
                                    </span>
                                </label>

                                {turnstileSiteKey && <div ref={turnstileRef} />}

                                {formFehler && (
                                    <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">
                                        {formFehler}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={sendet}
                                    className="w-full inline-flex items-center justify-center gap-2 h-14 px-6 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-wait"
                                >
                                    {sendet ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <PhoneCall className="w-5 h-5" aria-hidden="true" />}
                                    Jetzt KI-Anruf erhalten
                                </button>
                            </form>
                        )}

                        {auftrag && status !== 'fehler' && (
                            <div aria-live="polite" className="h-full flex flex-col">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--kunde-hell)] dark:text-[var(--kunde-dunkel)]">Ihr Gespräch</p>
                                <div className="mt-3 flex items-center gap-3">
                                    {laeuft && <span className="relative flex w-3 h-3"><span className="absolute inline-flex h-full w-full rounded-full bg-[var(--kunde-hell)] dark:bg-[var(--kunde-dunkel)] opacity-60 motion-safe:animate-ping" /><span className="relative inline-flex rounded-full w-3 h-3 bg-[var(--kunde-hell)] dark:bg-[var(--kunde-dunkel)]" /></span>}
                                    <p className="text-xl md:text-2xl font-bold text-[#111418] dark:text-white">{STATUS_TEXT[status ?? 'wartend']}</p>
                                </div>
                                <Welle farbe={karte.primaer} modus={wellenModus} className="mt-4 [--welle-hoehe:90px]" />
                                {status === 'beendet' && (
                                    <div className="mt-4 space-y-2">
                                        {auftrag.zusammenfassung && <p className="text-[#3b4350] dark:text-[#c9ced6] leading-relaxed">{auftrag.zusammenfassung}</p>}
                                        {auftrag.dauer_s !== null && <p className="text-sm text-[#5b6472] dark:text-[#9aa3af]">Dauer: {dauerText(auftrag.dauer_s)}</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </AssistentenKarte>

                    {status === 'beendet' && (
                        <div className={`mt-8 rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 ${styles.karteRein}`}>
                            <p className="flex-1 text-lg text-text-primary leading-relaxed max-w-3xl">{NACH_GESPRAECH}</p>
                            <Link
                                href={`/kontakt?subject=${encodeURIComponent(`KI-Telefonassistent für ${karte.profil.firma}`)}`}
                                className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-colors whitespace-nowrap"
                            >
                                Erstgespräch vereinbaren
                                <ArrowRight className="w-5 h-5" aria-hidden="true" />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Assistenten-Karte                                                   */
/* ------------------------------------------------------------------ */

function AssistentenKarte({ karte, children }: { karte: KartenDaten; children: ReactNode }) {
    const { profil, primaer, sekundaer, logo } = karte;
    const kopfText = textAuf(primaer);
    const kopfHell = kopfText === '#FFFFFF';
    const rolle = karte.weiblich ? 'KI-Telefonassistentin' : 'KI-Telefonassistent';
    const initiale = profil.assistent_name.charAt(0).toUpperCase();
    const dunkelKoerper = '#16191E';
    const variablen = {
        '--kunde': primaer,
        '--kunde-hell': lesbarAuf(primaer, '#FFFFFF', 4.5),
        '--kunde-dunkel': lesbarAuf(primaer, dunkelKoerper, 4.5),
        '--kunde-ring': lesbarAuf(primaer, '#FFFFFF', 3),
        '--kunde-flaeche': `color-mix(in oklab, ${primaer} 12%, transparent)`,
    } as CSSProperties;
    // Logo-Plakette: weiss; helle (Negativ-)Logos auf dunkler Kundenfarbe
    const plakette = logo.hell ? (luminanz(primaer) < 0.4 ? helligkeit(primaer, -0.12) : '#111418') : '#FFFFFF';
    const rgb = hexZuRgb(sekundaer);
    const verlauf = `linear-gradient(135deg, ${primaer} 0%, ${helligkeit(primaer, -0.1)} 70%, ${rgb && kontrast(sekundaer, primaer) > 1.3 ? sekundaer : helligkeit(primaer, -0.2)} 160%)`;

    return (
        <article
            className="rounded-3xl overflow-hidden border border-[#e3e6ea] dark:border-[#262b33] shadow-2xl shadow-black/10 dark:shadow-black/40 bg-white dark:bg-[#16191E]"
            style={variablen}
            aria-label={`${profil.assistent_name}, ${rolle} von ${profil.firma}`}
        >
            <div className="relative px-6 py-7 md:px-10 md:py-9" style={{ background: verlauf, color: kopfText }}>
                {/* Mobil: Logo oben rechts über dem Namen, ab sm daneben */}
                <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="flex items-center gap-4 md:gap-5 min-w-0">
                        <div
                            className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold ring-2"
                            style={{
                                background: kopfHell ? 'rgba(255,255,255,0.18)' : 'rgba(17,20,24,0.08)',
                                boxShadow: `0 0 0 2px ${kopfHell ? 'rgba(255,255,255,0.45)' : 'rgba(17,20,24,0.25)'}`,
                            }}
                            aria-hidden="true"
                        >
                            {initiale}
                        </div>
                        <div className="min-w-0">
                            <p className="text-3xl md:text-4xl font-bold leading-tight">{profil.assistent_name}</p>
                            <p className="mt-1 text-base md:text-lg opacity-90 break-words">
                                {rolle} von {profil.firma}
                            </p>
                        </div>
                    </div>
                    {logo.src && (
                        <div className="flex-shrink-0 self-end sm:self-auto rounded-xl p-2 md:p-3 shadow-sm" style={{ background: plakette }}>
                            {/* eslint-disable-next-line @next/next/no-img-element -- Logo kommt über den eigenen Proxy (beliebige Fremd-URL) */}
                            <img src={logo.src} alt={`Logo ${profil.firma}`} className="block h-10 md:h-14 w-auto max-w-[120px] md:max-w-[180px] object-contain" />
                        </div>
                    )}
                </div>
                <div className="mt-5 max-w-[220px]" style={{ color: kopfText }}>
                    <Welle farbe={primaer} modus="ruhe" kompakt />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-10 px-6 py-7 md:px-10 md:py-9">
                <ul className="space-y-4">
                    {profil.faehigkeiten.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                            <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-[var(--kunde-flaeche)] text-[var(--kunde-hell)] dark:text-[var(--kunde-dunkel)]">
                                <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
                            </span>
                            <span className="text-lg font-medium text-[#111418] dark:text-[#eef0f3]">{f}</span>
                        </li>
                    ))}
                    <li className="pt-2 text-sm text-[#5b6472] dark:text-[#9aa3af] flex items-center gap-2">
                        <Globe className="w-4 h-4" aria-hidden="true" />
                        <span className="truncate">{profil.website.replace(/^https?:\/\//, '')}</span>
                    </li>
                </ul>
                <div className="relative">{children}</div>
            </div>
        </article>
    );
}
