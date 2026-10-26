'use client';

/**
 * KI-Telefonassistent-Demo (AUFTRAG-092, überarbeitet AUFTRAG-095).
 *
 * Bühne: links Eingabe und Aktion, rechts (mobil darunter) ein lebendes
 * Telefon. Ablauf als Zustandsautomat (lib/demo/zustand.ts):
 * eingabe → scan → bereit → wartend → waehlt → verbunden → beendet | fehler.
 * Genau EIN Primär-Button je Zustand; Übergänge aus dem Status-Polling.
 *
 * Kundeninhalte (Karte, Anruf) tragen die Farben des Kunden, nie
 * InfraOne-Grün (Portmann-Prinzip). Buttons/CTA bleiben im Marken-Grün.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUp, BookOpen, Check, Clock, Globe, Languages, Loader2, Phone, PhoneCall, RotateCcw, Timer, X } from 'lucide-react';
import styles from './KiDemo.module.css';
import { Telefon, SPRACH_WAHL, ANRUF_VON, sprachName, type KartenAnzeige, type SchrittAnzeige } from './ki-demo/Telefon';
import {
    brauchtDunklenGrund,
    dominanteFarbe,
    helligkeit,
    lesbarAuf,
    logoPixel,
    logoSichtbar,
    logoVerlust,
    NEUTRAL_PRIMAER,
    textAuf,
    verlustAuf,
    waehlePlakette,
    type PlakettenArt,
} from '@/lib/demo/farben';
import { bestimmeMarkenfarbe, FARB_GEWICHT_LOGO, type FarbSignal } from '@/lib/demo/markenfarbe';
import { formatiereNummer, pruefeRueckrufNummer } from '@/lib/demo/nummer';
import { begruessungFuer, kannZeilen, rollenZeile, standardAufEnglisch, STANDARD_FAEHIGKEITEN_EN } from '@/lib/demo/begruessung';
import { bindeScan, istAktuell, LEERE_SITZUNG, logosDesScans, neueSitzung, profilPasst, type Sitzung } from '@/lib/demo/sitzung';
import {
    ansage,
    dauerAnzeige,
    fehlerMeldung,
    fehlerTitel,
    GRUND_KEINE_RUECKMELDUNG,
    istEndStatus,
    naechsterZustand,
    primaerButton,
    STATUS_MAX_MS,
    STATUS_TAKT_MS,
    zustandAusStatus,
    type Zustand,
} from '@/lib/demo/zustand';
import { SPRACHE_VORGABE, type AuftragStatus, type Profil, type Sprache, type Stimme } from '@/lib/demo/typen';

/* ------------------------------------------------------------------ */
/* Texte                                                               */
/* ------------------------------------------------------------------ */

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

const GRUEN_LEERLAUF = '#4CAF50';

/** Schritte des Scans im Telefon: Website, Logo, Farbe, Telefon, Öffnungszeiten, Wissen, Assistent */
const SCAN_SCHRITTE = 7;

/* ------------------------------------------------------------------ */
/* Typen der API                                                       */
/* ------------------------------------------------------------------ */

interface LogoVomServer {
    src: string;
    index: number;
    quelle: string;
    format: string | null;
    breite: number | null;
    hoehe: number | null;
    hell: boolean | null;
    transparenz: boolean | null;
    farbe: string | null;
    /** AUFTRAG-096: Hintergrund der Logo-Umgebung auf der Website */
    umgebung?: string | null;
    /** AUFTRAG-096: Inline-SVG ohne eigene Farbe */
    ohneEigeneFarbe?: boolean;
}

interface ScanAntwort {
    scan_id: string;
    profil: Profil;
    assistent_weiblich: boolean;
    logos: LogoVomServer[];
    /** AUFTRAG-096: gewichtete Farbsignale ohne Browser-Logo-Farbe */
    farb_signale?: FarbSignal[];
    funde: { seiten: number; firma: string; telefon: string | null; oeffnungszeiten: string | null; farbe: string | null };
}

interface ProfilAntwort {
    profil: Profil;
    funde?: { telefon: string | null; oeffnungszeiten: string | null; wissen: number };
}

interface GeladenesLogo {
    src: string;
    index: number;
    hell: boolean;
    farbe: string | null;
    breite: number | null;
    hoehe: number | null;
    /** AUFTRAG-096: Plakette hinter dem Logo (Website-Umgebung, Marke, Weiss oder Dunkel) */
    plakette: { art: PlakettenArt; farbe: string };
}

interface Karte {
    scanId: string;
    profil: Profil;
    /**
     * AUFTRAG-098: die drei Fähigkeiten auf Englisch (Karte bei «English»). Standard-
     * Fähigkeiten sofort, sonst null bis zur ersten Wahl von «English» (POST /api/demo/faehigkeiten).
     */
    faehigkeitenEn: string[] | null;
    stimme: Stimme;
    logo: GeladenesLogo | null;
    primaer: string;
}

interface Auftrag {
    id: string;
    dauer_s: number | null;
    zusammenfassung: string | null;
    grund: string | null;
}

interface Chip {
    id: string;
    text: string;
    farbe?: string;
    logoSrc?: string;
    /** Hintergrund der kleinen Logo-Plakette (wie auf der Karte) */
    logoGrund?: string;
    icon?: 'telefon' | 'zeiten' | 'wissen';
}

declare global {
    interface Window {
        turnstile?: {
            render: (el: HTMLElement, opt: Record<string, unknown>) => string;
            reset: (id?: string) => void;
            remove: (id: string) => void;
        };
    }
}

/* ------------------------------------------------------------------ */
/* Hilfen                                                              */
/* ------------------------------------------------------------------ */

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ladeBild(src: string, zeitMs: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const t = setTimeout(() => reject(new Error('Zeit')), zeitMs);
        img.onload = () => {
            clearTimeout(t);
            if (img.naturalWidth > 0 || /svg/i.test(src)) resolve(img);
            else reject(new Error('leer'));
        };
        img.onerror = () => {
            clearTimeout(t);
            reject(new Error('Bild'));
        };
        img.decoding = 'async';
        img.src = src;
    });
}

/** Pixel des Logos über Canvas (gleicher Ursprung dank eigenem Proxy); null, wenn nicht lesbar. */
function canvasPixel(img: HTMLImageElement): { px: Uint8ClampedArray; breite: number } | null {
    try {
        const w = img.naturalWidth || 120;
        const h = img.naturalHeight || 60;
        const m = Math.min(1, 160 / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * m));
        canvas.height = Math.max(1, Math.round(h * m));
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return { px: ctx.getImageData(0, 0, canvas.width, canvas.height).data, breite: canvas.width };
    } catch {
        return null;
    }
}

/**
 * AUFTRAG-096: Die Karte probiert die geordneten Kandidaten (höchstens 4) der
 * Reihe nach: laden, auf Canvas zeichnen, ≥ 2 % sichtbare Pixel und keine
 * einfarbige Fläche → gültig, sonst nächster. Das deckt alle Formate ab, auch
 * SVG mit CSS-Füllungen, die der Server nicht beurteilen kann. Danach:
 * Markenfarbe aus den Signalen des Servers plus Logo-Farbe (gleiche Regeln wie
 * der Server) und Plakette (Website-Umgebung, Marke, Weiss oder Dunkel).
 */
async function ladeLogo(logos: LogoVomServer[], signale: FarbSignal[]): Promise<{ logo: GeladenesLogo | null; marke: string | null }> {
    const markeOhneLogo = bestimmeMarkenfarbe(signale)?.primaer ?? null;
    for (const l of logos.slice(0, 4)) {
        let img: HTMLImageElement;
        try {
            img = await ladeBild(l.src, 6500);
        } catch {
            continue;
        }
        const raster = canvasPixel(img);
        const px = raster?.px ?? null;
        const stat = px ? logoPixel(px) : null;
        if (stat && !logoSichtbar(stat).ok) continue;
        let { hell, farbe } = l;
        if (px && hell === null) hell = stat!.transparenz && brauchtDunklenGrund(logoVerlust(px, raster!.breite));
        if (px && farbe === null) farbe = dominanteFarbe(px)?.primaer ?? null;
        const marke = bestimmeMarkenfarbe([...signale, ...(farbe ? [{ farbe, gewicht: FARB_GEWICHT_LOGO, quelle: 'logo' as const }] : [])])?.primaer ?? markeOhneLogo;
        const plakette = waehlePlakette({
            umgebung: l.umgebung ?? null,
            // ohne Markenfarbe trägt die Karte das neutrale Blau (helles Logo sitzt dann direkt darauf, wie A-095)
            marke: marke ?? NEUTRAL_PRIMAER,
            hell: !!hell,
            mittel: stat?.mittel ?? null,
            einfarbig: !!stat?.einfarbig,
            ohneEigeneFarbe: !!l.ohneEigeneFarbe,
            verlust: px ? (grund) => verlustAuf(px, grund, raster!.breite).anteil : undefined,
        });
        return {
            logo: { src: l.src, index: l.index, hell: !!hell, farbe, breite: img.naturalWidth || l.breite, hoehe: img.naturalHeight || l.hoehe, plakette },
            marke,
        };
    }
    return { logo: null, marke: markeOhneLogo };
}

function hostVon(eingabe: string): string {
    try {
        const s = eingabe.trim();
        return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).hostname.replace(/^www\./, '');
    } catch {
        return eingabe.trim();
    }
}

function kurz(text: string, max: number): string {
    return text.length > max ? text.slice(0, max - 1).replace(/[\s,;–-]+$/, '') + '…' : text;
}

/* ------------------------------------------------------------------ */
/* Primär-Button                                                       */
/* ------------------------------------------------------------------ */

function KnopfSymbol({ symbol }: { symbol: ReturnType<typeof primaerButton>['symbol'] }) {
    switch (symbol) {
        case 'pfeil':
            return <ArrowRight className="w-5 h-5" aria-hidden="true" />;
        case 'spinner':
            return <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />;
        case 'telefon':
            return <PhoneCall className="w-5 h-5" aria-hidden="true" />;
        case 'puls':
            return <span className={styles.puls} aria-hidden="true" />;
        case 'klingeln':
            return <Phone className={`w-5 h-5 ${styles.klingeln}`} aria-hidden="true" />;
        case 'welle':
            return (
                <span className={styles.knopfWelle} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                </span>
            );
        case 'neu':
            return <RotateCcw className="w-5 h-5" aria-hidden="true" />;
    }
}

const KNOPF_BASIS =
    // Höhe aus Polsterung + Zeilenhöhe (56 px), nicht aus min-height: globals.css setzt mobil min-height:44px auf alle Buttons
    'w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-[1.1875rem] font-bold leading-6 text-center focus-visible:outline-2 focus-visible:outline-offset-2';

function PrimaerKnopf({
    zustand,
    name,
    type,
    onClick,
    id,
    zweizeilig = false,
    gesperrt = false,
}: {
    zustand: Zustand;
    name: string;
    type: 'submit' | 'button';
    onClick?: () => void;
    id?: string;
    zweizeilig?: boolean;
    /** AUFTRAG-103: nach 429 (Limit) gesperrt — kein weiterer Versuch aus dieser Seite */
    gesperrt?: boolean;
}) {
    const b = primaerButton(zustand, name);
    const deaktiviert = b.deaktiviert || gesperrt;
    const farbe =
        b.art === 'verbunden'
            ? 'bg-[#1f7a35] text-white shadow-lg shadow-[#1f7a35]/30'
            : b.art === 'sekundaer'
              ? 'border-2 border-border bg-transparent text-text-primary hover:border-primary'
              : 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover';
    return (
        <button
            id={id}
            type={type}
            onClick={onClick}
            disabled={deaktiviert}
            aria-disabled={deaktiviert || undefined}
            data-zustand={zustand}
            data-gesperrt={gesperrt ? 'true' : undefined}
            className={`${styles.knopf} ${KNOPF_BASIS} ${farbe} ${zustand === 'wartend' ? styles.knopfWartet : ''} ${zweizeilig ? 'h-[4.75rem] sm:h-auto' : ''} ${gesperrt ? 'opacity-50 shadow-none' : ''} disabled:cursor-default`}
        >
            <KnopfSymbol symbol={b.symbol} />
            <span key={`${zustand}-${b.text}`} className={styles.knopfText}>
                {b.text}
            </span>
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Komponente                                                          */
/* ------------------------------------------------------------------ */

export function KiDemo({ children, turnstileSiteKey, begruessungNachStimme = false }: { children: ReactNode; turnstileSiteKey?: string; begruessungNachStimme?: boolean }) {
    const [zustand, setZustand] = useState<Zustand>('eingabe');
    const [eingabe, setEingabe] = useState('');
    const [host, setHost] = useState('');
    const [scanFehler, setScanFehler] = useState<string | null>(null);
    const [schritte, setSchritte] = useState<SchrittAnzeige[]>([]);
    const [chips, setChips] = useState<Chip[]>([]);
    const [welleFarbe, setWelleFarbe] = useState(GRUEN_LEERLAUF);
    const [karte, setKarte] = useState<Karte | null>(null);

    // AUFTRAG-098: Hochdeutsch ist die Vorgabe (Englisch gleichwertig, Schweizerdeutsch in Erprobung)
    const [sprache, setSprache] = useState<Sprache>(SPRACHE_VORGABE);
    const [vorwahl, setVorwahl] = useState<'+41' | '+423'>('+41');
    const [nummer, setNummer] = useState('');
    const [einwilligung, setEinwilligung] = useState(false);
    const [honigtopf, setHonigtopf] = useState('');
    const [formFehler, setFormFehler] = useState<string | null>(null);
    const [auftrag, setAuftrag] = useState<Auftrag | null>(null);
    const [verbundenSeit, setVerbundenSeit] = useState<number | null>(null);
    const [jetzt, setJetzt] = useState(0);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    // AUFTRAG-103: nach 429 bleibt der jeweilige Button gesperrt (Server-Klartext bleibt stehen, kein Neuversuch)
    const [scanGesperrt, setScanGesperrt] = useState(false);
    const [anrufSperre, setAnrufSperre] = useState<string | null>(null);

    // AUFTRAG-102: Sitzung (Lauf + Scan-Kennung) — Logo, Farben und Profil gehören immer zum laufenden Scan
    const sitzungRef = useRef<Sitzung>(LEERE_SITZUNG);
    const eingabeRef = useRef<HTMLInputElement>(null);
    const telefonRef = useRef<HTMLDivElement>(null);
    const buehneRef = useRef<HTMLDivElement>(null);
    const aktionRef = useRef<HTMLElement>(null);
    const [aktionMin, setAktionMin] = useState(0);
    const turnstileRef = useRef<HTMLDivElement>(null);
    const turnstileWidget = useRef<string | null>(null);

    const name = karte?.profil.assistent_name ?? '';
    const firma = karte?.profil.firma ?? '';

    /* ---------- Scan ---------- */

    const setzeSchritt = useCallback((s: SchrittAnzeige) => {
        setSchritte((liste) => {
            const i = liste.findIndex((x) => x.id === s.id);
            if (i < 0) return [...liste, s];
            const neu = [...liste];
            neu[i] = s;
            return neu;
        });
    }, []);

    const starteScan = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            if (zustand !== 'eingabe' || scanGesperrt) return;
            const wert = eingabe.trim();
            if (!wert || wert.length > 300 || !/\.[a-z]{2,}/i.test(wert)) {
                setScanFehler(HINWEIS.url);
                eingabeRef.current?.focus();
                return;
            }
            const neu = neueSitzung(sitzungRef.current);
            sitzungRef.current = neu;
            const lauf = neu.lauf;
            // bis zur Scan-Antwort: gleicher Lauf; danach zusätzlich gleiche Scan-Kennung
            const bindung: { scanId?: string } = {};
            const aktuell = () => istAktuell(sitzungRef.current, lauf, bindung.scanId);
            const h = hostVon(wert);
            setScanFehler(null);
            setChips([]);
            setKarte(null);
            setAuftrag(null);
            setFormFehler(null);
            setHost(h);
            setWelleFarbe(GRUEN_LEERLAUF);
            setSchritte([{ id: 'website', titel: 'Website wird gelesen …', detail: h, status: 'laeuft' }]);
            setZustand('scan');

            let scan: ScanAntwort;
            try {
                const res = await fetch('/api/demo/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: wert }),
                });
                const daten = await res.json().catch(() => ({}));
                if (!aktuell()) return;
                if (!res.ok) {
                    setScanFehler(typeof daten.fehler === 'string' ? daten.fehler : HINWEIS.netz);
                    // AUFTRAG-103: Limit erreicht → Button bleibt gesperrt, kein Neuversuch
                    if (res.status === 429) setScanGesperrt(true);
                    setSchritte([]);
                    setZustand('eingabe');
                    return;
                }
                scan = daten as ScanAntwort;
            } catch {
                if (!aktuell()) return;
                setScanFehler(HINWEIS.netz);
                setSchritte([]);
                setZustand('eingabe');
                return;
            }
            // AUFTRAG-102: Scan-Kennung an diesen Lauf binden; ab jetzt zählt nur noch, was zu ihr gehört
            const gebunden = bindeScan(sitzungRef.current, lauf, scan.scan_id);
            if (!gebunden) {
                if (sitzungRef.current.lauf !== lauf) return;
                setScanFehler(HINWEIS.netz);
                setSchritte([]);
                setZustand('eingabe');
                return;
            }
            sitzungRef.current = gebunden;
            bindung.scanId = scan.scan_id;

            // Stufe 2 (KI-Profil) und Logo laufen parallel zu den Schritten; das Profil zählt nur mit derselben scan_id
            const profilVersprechen: Promise<ProfilAntwort> = fetch('/api/demo/profil', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scan_id: scan.scan_id }),
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => (d && d.profil && profilPasst(sitzungRef.current, lauf, d) ? (d as ProfilAntwort) : { profil: scan.profil }))
                .catch(() => ({ profil: scan.profil }));
            // nur Logos mit dieser Scan-Kennung im Pfad (/api/demo/bild/<scan_id>/<n>)
            const logoVersprechen = ladeLogo(logosDesScans(scan.logos, scan.scan_id), scan.farb_signale ?? []);
            const takt = async (ms = 360) => {
                await pause(ms);
                return aktuell();
            };

            const seiten = scan.funde?.seiten ?? 1;
            setzeSchritt({ id: 'website', titel: 'Website gelesen', detail: `${h} · ${seiten} ${seiten === 1 ? 'Seite' : 'Seiten'}`, status: 'ok' });
            if (!(await takt())) return;

            setzeSchritt({ id: 'logo', titel: 'Logo wird geprüft …', status: 'laeuft' });
            const { logo, marke } = await logoVersprechen;
            if (!aktuell()) return;
            if (logo) {
                setzeSchritt({ id: 'logo', titel: 'Logo gefunden', status: 'ok', logoSrc: logo.src, logoGrund: logo.plakette.farbe });
                setChips((c) => [...c, { id: 'logo', text: 'Logo', logoSrc: logo.src, logoGrund: logo.plakette.farbe }]);
            } else {
                setzeSchritt({ id: 'logo', titel: 'Kein Logo gefunden', detail: 'Die Karte zeigt die Initiale', status: 'leer' });
            }
            if (!(await takt())) return;

            // AUFTRAG-096: Markenfarbe aus den gewichteten Signalen (inkl. Logo-Farbe), zuletzt Server-Ergebnis
            const farbe = marke ?? scan.funde?.farbe ?? scan.profil.farben?.primaer ?? null;
            if (farbe) {
                setWelleFarbe(farbe);
                setzeSchritt({ id: 'farbe', titel: `Markenfarbe ${farbe}`, status: 'ok', farbe });
                setChips((c) => [...c, { id: 'farbe', text: farbe, farbe }]);
            } else {
                setWelleFarbe(NEUTRAL_PRIMAER);
                setzeSchritt({ id: 'farbe', titel: 'Keine Markenfarbe gefunden', detail: 'Die Karte nutzt ein neutrales Blau', status: 'leer' });
            }
            if (!(await takt())) return;

            const tel = scan.funde?.telefon ?? null;
            setzeSchritt(tel ? { id: 'telefon', titel: `Telefon ${tel}`, status: 'ok' } : { id: 'telefon', titel: 'Keine Telefonnummer gefunden', status: 'leer' });
            if (tel) setChips((c) => [...c, { id: 'telefon', text: 'Telefon', icon: 'telefon' }]);
            if (!(await takt())) return;

            const zeiten = scan.funde?.oeffnungszeiten ?? null;
            setzeSchritt(zeiten ? { id: 'zeiten', titel: `Öffnungszeiten ${kurz(zeiten, 60)}`, status: 'ok' } : { id: 'zeiten', titel: 'Keine Öffnungszeiten gefunden', status: 'leer' });
            if (zeiten) setChips((c) => [...c, { id: 'zeiten', text: 'Öffnungszeiten', icon: 'zeiten' }]);
            if (!(await takt())) return;

            setzeSchritt({ id: 'wissen', titel: 'Wissen wird aufgebaut …', status: 'laeuft' });
            const profil = await profilVersprechen;
            if (!aktuell()) return;
            const p = profil.profil;
            const anzahl = p.wissen.length;
            setzeSchritt({ id: 'wissen', titel: `${anzahl} Wissenseinträge`, detail: 'aus Ihrer Website', status: 'ok' });
            setChips((c) => [...c.filter((x) => x.id !== 'wissen'), { id: 'wissen', text: `Wissen: ${anzahl} Einträge`, icon: 'wissen' }]);
            // Die KI findet manchmal Telefon/Zeiten, die die Regeln verpasst haben
            if (!tel && profil.funde?.telefon) {
                setzeSchritt({ id: 'telefon', titel: `Telefon ${profil.funde.telefon}`, status: 'ok' });
                setChips((c) => [...c.filter((x) => x.id !== 'wissen'), { id: 'telefon', text: 'Telefon', icon: 'telefon' }, ...c.filter((x) => x.id === 'wissen')]);
            }
            if (!zeiten && profil.funde?.oeffnungszeiten) {
                setzeSchritt({ id: 'zeiten', titel: `Öffnungszeiten ${kurz(profil.funde.oeffnungszeiten, 60)}`, status: 'ok' });
            }
            if (!(await takt())) return;

            setzeSchritt({ id: 'assistent', titel: 'Assistent wird vorbereitet …', status: 'laeuft' });
            if (!(await takt(380))) return;
            setzeSchritt({ id: 'assistent', titel: `${p.assistent_name} ist bereit`, status: 'ok' });
            if (!(await takt(320))) return;

            const stimme: Stimme = p.stimme ?? (scan.assistent_weiblich ? 'weiblich' : 'maennlich');
            setKarte({ scanId: scan.scan_id, profil: p, faehigkeitenEn: standardAufEnglisch(p.faehigkeiten), stimme, logo, primaer: farbe ?? NEUTRAL_PRIMAER });
            setZustand('bereit');
        },
        [eingabe, zustand, setzeSchritt, scanGesperrt],
    );

    // AUFTRAG-098: Fähigkeiten auf Englisch erst bei der ersten Wahl von «English» übersetzen (einmal je Scan)
    const enAngefragt = useRef<string | null>(null);
    const enScanId = sprache === 'englisch' && karte && karte.faehigkeitenEn === null ? karte.scanId : null;
    useEffect(() => {
        if (!enScanId || enAngefragt.current === enScanId) return;
        enAngefragt.current = enScanId;
        const setzen = (liste: string[]) => setKarte((k) => (k && k.scanId === enScanId ? { ...k, faehigkeitenEn: liste } : k));
        fetch('/api/demo/faehigkeiten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scan_id: enScanId }) })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setzen(Array.isArray(d?.faehigkeiten_en) && d.faehigkeiten_en.length === 3 ? d.faehigkeiten_en : [...STANDARD_FAEHIGKEITEN_EN]))
            .catch(() => setzen([...STANDARD_FAEHIGKEITEN_EN]));
    }, [enScanId]);

    /*
     * AUFTRAG-100: Mobil kein automatischer Sprung zum Telefon mehr. Ist das
     * Telefon ausserhalb des Bildes, zeigt eine kompakte Statuszeile oben
     * (unter dem Header) Schritt und Fund; Antippen springt zum Telefon.
     * Desktop: Das Telefon läuft ab lg mit (position: sticky, siehe CSS).
     */
    const [sicht, setSicht] = useState({ telefon: true, oben: false, buehne: true });
    useEffect(() => {
        const tel = telefonRef.current;
        const buehne = buehneRef.current;
        if (!tel || !buehne || typeof IntersectionObserver === 'undefined') return;
        // Header mobil: 64 px + 16 px Abstand oben
        const rand = '-80px 0px 0px 0px';
        const ioTel = new IntersectionObserver(
            ([e]) => {
                const oberkante = e.rootBounds?.top ?? 80;
                const telefon = e.intersectionRatio >= 0.35;
                const oben = e.boundingClientRect.top < oberkante;
                // nur neu zeichnen, wenn sich etwas ändert
                setSicht((s) => (s.telefon === telefon && s.oben === oben ? s : { ...s, telefon, oben }));
            },
            { rootMargin: rand, threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] },
        );
        const ioBuehne = new IntersectionObserver(([e]) => setSicht((s) => (s.buehne === e.isIntersecting ? s : { ...s, buehne: e.isIntersecting })), { rootMargin: rand });
        ioTel.observe(tel);
        ioBuehne.observe(buehne);
        return () => {
            ioTel.disconnect();
            ioBuehne.disconnect();
        };
    }, []);

    const zumTelefon = () => {
        const el = telefonRef.current;
        if (!el) return;
        const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' });
        el.focus({ preventScroll: true });
    };

    // Aktionskarte wächst nur: die grösste bisher gemessene Höhe bleibt als Mindesthöhe
    const aktionSichtbar = zustand !== 'eingabe';
    useEffect(() => {
        const el = aktionRef.current;
        if (!aktionSichtbar || !el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver((eintraege) => {
            const h = Math.round(eintraege[0]?.borderBoxSize?.[0]?.blockSize ?? el.getBoundingClientRect().height);
            // Ausreisser (z. B. Ganzseiten-Screenshot mit riesigem Viewport) nicht festhalten
            if (h > window.innerHeight * 2.5 && h > 1400) return;
            setAktionMin((m) => (h > m ? h : m));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [aktionSichtbar]);

    const andereWebsite = () => {
        // neuer Lauf: verspätete Antworten des bisherigen Scans werden verworfen
        sitzungRef.current = neueSitzung(sitzungRef.current);
        setAktionMin(0);
        setZustand('eingabe');
        setKarte(null);
        setAuftrag(null);
        setChips([]);
        setSchritte([]);
        setFormFehler(null);
        setVerbundenSeit(null);
        setWelleFarbe(GRUEN_LEERLAUF);
        setTimeout(() => {
            eingabeRef.current?.focus();
            eingabeRef.current?.select();
        }, 0);
    };

    /* ---------- Turnstile (nur wenn konfiguriert) ---------- */

    /*
     * AUFTRAG-103: Der Container existiert nur im Zustand «bereit». Verlässt die Karte «bereit»
     * (Absenden, Anruf, Fehler), wird das Widget entfernt; beim nächsten «bereit» rendert ein
     * frisches Widget mit neuem Token (Turnstile-Token gelten nur einmal). Vorher blieb die alte
     * Widget-Kennung stehen: nach dem ersten Versuch erschien kein Widget mehr, jeder weitere
     * Versuch scheiterte mit 403.
     */
    useEffect(() => {
        if (!turnstileSiteKey || zustand !== 'bereit' || anrufSperre || !turnstileRef.current) return;
        let aktiv = true;
        const rendern = () => {
            if (!aktiv || !window.turnstile || !turnstileRef.current || turnstileWidget.current) return;
            turnstileWidget.current = window.turnstile.render(turnstileRef.current, {
                sitekey: turnstileSiteKey,
                callback: (t: string) => setTurnstileToken(t),
                'expired-callback': () => setTurnstileToken(null),
                'error-callback': () => setTurnstileToken(null),
                language: 'de',
            });
        };
        if (window.turnstile) {
            rendern();
        } else {
            let s = document.getElementById('ki-demo-turnstile-skript') as HTMLScriptElement | null;
            if (!s) {
                s = document.createElement('script');
                s.id = 'ki-demo-turnstile-skript';
                s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                s.async = true;
                document.head.appendChild(s);
            }
            s.addEventListener('load', rendern, { once: true });
        }
        return () => {
            aktiv = false;
            const id = turnstileWidget.current;
            turnstileWidget.current = null;
            if (id && window.turnstile) {
                try {
                    window.turnstile.remove(id);
                } catch {
                    /* Widget schon weg */
                }
            }
        };
    }, [turnstileSiteKey, zustand, anrufSperre]);

    /* ---------- Anruf ---------- */

    const starteAnruf = async (e: FormEvent) => {
        e.preventDefault();
        if (!karte || zustand !== 'bereit' || anrufSperre) return;
        setFormFehler(null);
        const pruefung = pruefeRueckrufNummer(nummer, vorwahl);
        if (!pruefung.ok) {
            setFormFehler(pruefung.grund === 'sonderdienst' ? HINWEIS.sonderdienst : HINWEIS.nummer);
            document.getElementById('ki-demo-nummer')?.focus();
            return;
        }
        if (!einwilligung) {
            setFormFehler(HINWEIS.einwilligung);
            document.getElementById('ki-demo-einwilligung')?.focus();
            return;
        }
        // Sofortige Rückmeldung: der Button zeigt den Wartezustand, solange der Auftrag angelegt wird
        setZustand('wartend');
        // Turnstile-Token gilt nur einmal; das nächste «bereit» rendert ein frisches Widget
        const token = turnstileToken;
        setTurnstileToken(null);
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
                    farben: { primaer: karte.primaer, sekundaer: karte.profil.farben?.sekundaer ?? helligkeit(karte.primaer, -0.18) },
                    ...(karte.logo ? { logo_index: karte.logo.index } : {}),
                    ...(turnstileSiteKey ? { turnstile: token } : {}),
                }),
            });
            const daten = await res.json().catch(() => ({}));
            if (res.status !== 201 || typeof daten.id !== 'string') {
                const text = typeof daten.fehler === 'string' ? daten.fehler : HINWEIS.netz;
                // AUFTRAG-103: 429 (Limit) zeigt den Server-Klartext und sperrt den Button — kein automatischer Neuversuch
                if (res.status === 429) setAnrufSperre(text);
                setZustand('bereit');
                setFormFehler(text);
                return;
            }
            setAuftrag({ id: daten.id, dauer_s: null, zusammenfassung: null, grund: null });
        } catch {
            setZustand('bereit');
            setFormFehler(HINWEIS.netz);
        }
    };

    /*
     * Status-Polling (AUFTRAG-098, sparsam für Netlify Free): alle 4 s bis zum
     * Endzustand, danach keine Abfrage mehr. Bei verdecktem Tab (Besucher am
     * Telefon, anderer Tab) Pause; beim Zurückkommen sofort eine Abfrage. Nach
     * 20 Minuten ohne Endzustand Schluss: Hinweis «Keine Rückmeldung» mit
     * «Nochmals versuchen» (kein totes Ende).
     */
    const auftragId = auftrag?.id;
    useEffect(() => {
        if (!auftragId) return;
        let aktiv = true;
        let fertig = false;
        let laeuft = false;
        const start = Date.now();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const verdeckt = () => document.visibilityState === 'hidden';
        const planen = () => {
            clearTimeout(timer);
            timer = undefined;
            if (aktiv && !fertig && !verdeckt()) timer = setTimeout(abfragen, STATUS_TAKT_MS);
        };
        const abfragen = async () => {
            if (!aktiv || fertig || laeuft) return;
            laeuft = true;
            try {
                const res = await fetch(`/api/demo/auftraege/${auftragId}`, { cache: 'no-store' });
                if (res.ok) {
                    const d = (await res.json()) as { id: string; status: AuftragStatus; dauer_s: number | null; zusammenfassung: string | null; grund?: string | null };
                    if (!aktiv) return;
                    const neu = zustandAusStatus(d.status);
                    if (neu === 'verbunden') {
                        const t = Date.now();
                        setVerbundenSeit((v) => v ?? t);
                        setJetzt(t);
                    }
                    setZustand((alt) => naechsterZustand(alt, neu));
                    setAuftrag((a) => (a && a.id === d.id ? { ...a, dauer_s: d.dauer_s, zusammenfassung: d.zusammenfassung, grund: d.grund ?? null } : a));
                    if (istEndStatus(d.status)) fertig = true;
                }
            } catch {
                /* nächster Versuch */
            } finally {
                laeuft = false;
            }
            if (aktiv && !fertig && Date.now() - start > STATUS_MAX_MS) {
                fertig = true;
                setAuftrag((a) => (a && a.id === auftragId ? { ...a, grund: GRUND_KEINE_RUECKMELDUNG } : a));
                setZustand('fehler');
            }
            planen();
        };
        const sichtbarkeit = () => {
            if (verdeckt()) {
                clearTimeout(timer);
                timer = undefined;
            } else if (!laeuft) {
                clearTimeout(timer);
                void abfragen();
            }
        };
        document.addEventListener('visibilitychange', sichtbarkeit);
        planen();
        return () => {
            aktiv = false;
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', sichtbarkeit);
        };
    }, [auftragId]);

    // Gesprächsdauer zählen, solange verbunden (Start = erster «verbunden»-Status im Polling)
    useEffect(() => {
        if (zustand !== 'verbunden') return;
        const t = setInterval(() => setJetzt(Date.now()), 1000);
        return () => clearInterval(t);
    }, [zustand]);

    const nochmals = () => {
        setAuftrag(null);
        setVerbundenSeit(null);
        setEinwilligung(false);
        setFormFehler(null);
        setZustand('bereit');
    };

    /* ---------- Darstellung ---------- */

    const kartenAnzeige: KartenAnzeige | null = useMemo(() => {
        if (!karte) return null;
        const p = karte.profil;
        const primaer = karte.primaer;
        const englisch = sprache === 'englisch';
        return {
            name: p.assistent_name,
            // AUFTRAG-098: bei «English» Karte auf Englisch («AI phone assistant of FIRMA»)
            rollenZeile: rollenZeile(karte.stimme, sprache, p.firma),
            lang: englisch ? ('en' as const) : ('de' as const),
            firma: p.firma,
            website: p.website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            // AUFTRAG-102: «Kennt Ansprechpersonen» nur, wenn auf der Website Personen gefunden wurden
            kann: kannZeilen(englisch ? karte.faehigkeitenEn : p.faehigkeiten, p.personen?.length ?? 0, englisch),
            logo: karte.logo ? { src: karte.logo.src, grund: karte.logo.plakette.art, farbe: karte.logo.plakette.art === 'marke' ? primaer : karte.logo.plakette.farbe, breite: karte.logo.breite, hoehe: karte.logo.hoehe } : null,
            primaer,
            tief: helligkeit(primaer, -0.16),
            text: textAuf(primaer),
            akzentHell: lesbarAuf(primaer, '#F5F6F7', 3),
            akzentDunkel: lesbarAuf(primaer, '#0F1216', 3),
            begruessung: begruessungFuer(sprache, p.assistent_name, p.firma, karte.stimme, begruessungNachStimme),
        };
    }, [karte, sprache, begruessungNachStimme]);

    const dauerSek =
        zustand === 'verbunden' && verbundenSeit
            ? Math.max(0, Math.round((jetzt - verbundenSeit) / 1000))
            : auftrag?.dauer_s ?? (verbundenSeit ? Math.max(0, Math.round((jetzt - verbundenSeit) / 1000)) : 0);

    const telefonWelle = zustand === 'eingabe' ? GRUEN_LEERLAUF : karte ? karte.primaer : welleFarbe;
    const nummerAnzeige = (() => {
        const p = pruefeRueckrufNummer(nummer, vorwahl);
        return p.ok ? formatiereNummer(p.e164) : nummer;
    })();
    const sprachEintrag = SPRACH_WAHL.find((s) => s.wert === sprache);
    const sprachText = sprachEintrag ? sprachName(sprachEintrag) : '';
    const verlauf: Array<{ titel: string; detail: string; stand: 'offen' | 'laeuft' | 'ok' | 'fehler' }> = [
        {
            titel: 'Auftrag angenommen',
            detail: zustand === 'bereit' ? 'sofort nach Ihrem Klick' : `Sprache: ${sprachText}`,
            stand: zustand === 'bereit' ? 'offen' : auftrag || zustand === 'fehler' ? 'ok' : 'laeuft',
        },
        {
            titel: 'Ihr Telefon klingelt',
            detail:
                zustand === 'fehler'
                    ? auftrag?.grund === 'limit'
                        ? 'Tageslimit für diese Nummer erreicht'
                        : auftrag?.grund === GRUND_KEINE_RUECKMELDUNG
                          ? 'seit 20 Minuten keine Rückmeldung'
                          : `${nummerAnzeige} nicht erreicht`
                    : zustand === 'bereit'
                      ? `Anruf von ${ANRUF_VON}`
                      : `Anruf von ${ANRUF_VON} an ${nummerAnzeige}`,
            stand: zustand === 'fehler' ? 'fehler' : zustand === 'verbunden' ? 'ok' : zustand === 'waehlt' ? 'laeuft' : 'offen',
        },
        {
            titel: `Gespräch mit ${kartenAnzeige?.name ?? 'Ihrem Assistenten'}`,
            detail: zustand === 'verbunden' ? `läuft seit ${dauerAnzeige(dauerSek)} · höchstens drei Minuten` : 'höchstens drei Minuten',
            stand: zustand === 'verbunden' ? 'laeuft' : 'offen',
        },
        { titel: 'Zusammenfassung', detail: 'erscheint hier nach dem Gespräch', stand: 'offen' },
    ];
    const imAnruf = zustand === 'wartend' || zustand === 'waehlt' || zustand === 'verbunden';

    /* AUFTRAG-100: Statuszeile mobil — oben der Schritt, darunter der letzte Fund bzw. der Anrufstand */
    const statusZeile: { kopf: string; text: string; zeichen: 'scan' | 'farbe' | 'puls' | 'welle' | 'ok' | 'fehler'; farbe?: string } | null = (() => {
        const assistent = kartenAnzeige?.name ?? 'Ihr Assistent';
        switch (zustand) {
            case 'eingabe':
                return null;
            case 'scan': {
                const laufend = [...schritte].reverse().find((s) => s.status === 'laeuft');
                const fund = [...schritte].reverse().find((s) => s.status !== 'laeuft');
                const nummer = Math.min(SCAN_SCHRITTE, Math.max(1, schritte.length));
                return {
                    kopf: `Schritt ${nummer} von ${SCAN_SCHRITTE}${laufend ? `: ${laufend.titel}` : ''}`,
                    text: fund?.titel ?? 'Website wird gelesen …',
                    zeichen: fund?.farbe ? 'farbe' : 'scan',
                    farbe: fund?.farbe,
                };
            }
            case 'bereit':
                return { kopf: 'Scan abgeschlossen', text: `${assistent} ist bereit`, zeichen: 'farbe', farbe: kartenAnzeige?.primaer };
            case 'wartend':
                return { kopf: 'Testanruf', text: 'Wir rufen Sie gleich an …', zeichen: 'puls' };
            case 'waehlt':
                return { kopf: 'Testanruf', text: 'Ihr Telefon klingelt …', zeichen: 'puls' };
            case 'verbunden':
                return { kopf: `Verbunden – ${dauerAnzeige(dauerSek)}`, text: `Sie sprechen mit ${assistent}`, zeichen: 'welle' };
            case 'beendet':
                return { kopf: 'Testanruf', text: 'Gespräch beendet', zeichen: 'ok' };
            case 'fehler':
                return { kopf: 'Testanruf', text: fehlerTitel(auftrag?.grund), zeichen: 'fehler' };
        }
    })();
    const statusSichtbar = !!statusZeile && !sicht.telefon && sicht.buehne;


    /** Formular des Testanrufs; als Platzhalter (während des Scans) unsichtbar mit gleicher Höhe, darüber ein Skelett. */
    const anrufFormular = (platzhalter: boolean) => {
        const inhalt = (
            <>
                                    <h2 id="ki-demo-anruf-titel" className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                                        {zustand === 'fehler' ? fehlerTitel(auftrag?.grund) : `${kartenAnzeige?.name ?? 'Ihr Assistent'} ruft Sie an`}
                                    </h2>
                                    <form onSubmit={starteAnruf} noValidate className="mt-5 space-y-5">
                                        <fieldset disabled={zustand !== 'bereit' || !!anrufSperre} className="min-w-0 space-y-5 disabled:opacity-80">
                                            <div role="radiogroup" aria-labelledby="ki-demo-sprache-titel">
                                                <p id="ki-demo-sprache-titel" className="text-sm font-medium text-text-primary mb-2">
                                                    Sprache
                                                </p>
                                                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.45fr)] gap-1 rounded-xl bg-surface p-1 border border-border">
                                                    {SPRACH_WAHL.map((s) => {
                                                        const aktiv = sprache === s.wert;
                                                        return (
                                                            <label
                                                                key={s.wert}
                                                                htmlFor={`ki-demo-sprache-${s.wert}`}
                                                                className={`flex flex-col items-center justify-center min-h-12 rounded-lg px-1 sm:px-2 text-[0.8125rem] sm:text-sm font-semibold leading-tight whitespace-nowrap transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
                                                                    aktiv ? 'bg-card text-text-primary shadow-sm ring-1 ring-border' : 'text-text-secondary hover:text-text-primary'
                                                                } ${zustand === 'bereit' ? 'cursor-pointer' : 'cursor-default'}`}
                                                            >
                                                                <input
                                                                    id={`ki-demo-sprache-${s.wert}`}
                                                                    type="radio"
                                                                    name="ki-demo-sprache-wahl"
                                                                    value={s.wert}
                                                                    checked={aktiv}
                                                                    onChange={() => setSprache(s.wert)}
                                                                    aria-label={sprachName(s)}
                                                                    className="sr-only"
                                                                />
                                                                {s.text}
                                                                {s.zusatz && <span className="text-[0.6875rem] sm:text-xs font-medium text-text-secondary">{s.zusatz}</span>}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
    
                                            <div>
                                                <label htmlFor="ki-demo-nummer" className="block text-sm font-medium text-text-primary mb-2">
                                                    Ihre Telefonnummer
                                                </label>
                                                <div className={`${styles.feld} flex rounded-xl border border-border bg-background overflow-hidden`}>
                                                    <label htmlFor="ki-demo-vorwahl" className="sr-only">
                                                        Vorwahl
                                                    </label>
                                                    <select
                                                        id="ki-demo-vorwahl"
                                                        value={vorwahl}
                                                        onChange={(e) => setVorwahl(e.target.value as '+41' | '+423')}
                                                        className="h-12 pl-3 pr-1 bg-surface text-text-primary border-r border-border text-base focus:outline-none"
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
                                                        aria-describedby="ki-demo-nummer-hinweis"
                                                        className="flex-1 min-w-0 h-12 px-3 bg-transparent text-text-primary text-base placeholder:text-text-secondary/70 focus:outline-none"
                                                    />
                                                </div>
                                                <p id="ki-demo-nummer-hinweis" className="mt-2 text-xs text-text-secondary">
                                                    Der Anruf kommt von {ANRUF_VON}.
                                                </p>
                                            </div>
    
                                            {/* Honigtopf: für Menschen unsichtbar */}
                                            <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
                                                <label htmlFor="ki-demo-web">Website-Kontakt</label>
                                                <input id="ki-demo-web" type="text" tabIndex={-1} autoComplete="off" value={honigtopf} onChange={(e) => setHonigtopf(e.target.value)} />
                                            </div>
    
                                            <label htmlFor="ki-demo-einwilligung" className="flex items-start gap-3 text-sm text-text-secondary cursor-pointer">
                                                <input
                                                    id="ki-demo-einwilligung"
                                                    type="checkbox"
                                                    aria-labelledby="ki-demo-einwilligung-text"
                                                    checked={einwilligung}
                                                    onChange={(e) => setEinwilligung(e.target.checked)}
                                                    className="mt-0.5 w-5 h-5 flex-shrink-0 rounded accent-[var(--primary)]"
                                                />
                                                <span id="ki-demo-einwilligung-text">
                                                    Ich bin unter dieser Nummer erreichbar und möchte den Testanruf erhalten. Es gelten die{' '}
                                                    <Link href="/datenschutz#testanruf-ki-telefonassistent" className="underline underline-offset-2 text-text-primary hover:no-underline" target="_blank">
                                                        Datenschutzhinweise
                                                    </Link>
                                                    .
                                                </span>
                                            </label>
                                        </fieldset>
    
                                        {turnstileSiteKey && zustand === 'bereit' && !anrufSperre && <div ref={turnstileRef} />}
    
                                        {(anrufSperre ?? formFehler) && zustand === 'bereit' && (
                                            <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">
                                                {anrufSperre ?? formFehler}
                                            </p>
                                        )}
                                        {zustand === 'fehler' && (
                                            <p role="alert" className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                                                {fehlerMeldung(auftrag?.grund).text}{' '}
                                                <a href="tel:+41522221818" className="font-semibold underline whitespace-nowrap">
                                                    052 222 18 18
                                                </a>
                                                .
                                            </p>
                                        )}
    
                                        {/* Derselbe Button wechselt Text, Symbol und Farbe je Zustand */}
                                        <PrimaerKnopf
                                            zustand={zustand}
                                            name={kartenAnzeige?.name ?? 'Ihr Assistent'}
                                            type={zustand === 'bereit' ? 'submit' : 'button'}
                                            onClick={zustand === 'fehler' ? nochmals : undefined}
                                            id="ki-demo-anruf-knopf"
                                            zweizeilig
                                            gesperrt={zustand === 'bereit' && !!anrufSperre}
                                        />
                                    </form>
    
                                    <ol className="mt-6 space-y-3.5" aria-label="Ablauf des Testanrufs">
                                        {verlauf.map((v) => (
                                            <li key={v.titel} className="flex items-start gap-3">
                                                <span
                                                    className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                                        v.stand === 'ok'
                                                            ? 'bg-primary text-white'
                                                            : v.stand === 'laeuft'
                                                              ? 'text-primary ring-2 ring-primary/40'
                                                              : v.stand === 'fehler'
                                                                ? 'bg-red-600 text-white'
                                                                : 'ring-1 ring-border text-text-secondary'
                                                    }`}
                                                    aria-hidden="true"
                                                >
                                                    {v.stand === 'ok' ? (
                                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                                    ) : v.stand === 'laeuft' ? (
                                                        <span className={styles.puls} />
                                                    ) : v.stand === 'fehler' ? (
                                                        <X className="w-3.5 h-3.5" strokeWidth={3} />
                                                    ) : null}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className={`block text-[0.95rem] font-semibold leading-snug ${v.stand === 'offen' ? 'text-text-secondary' : 'text-text-primary'}`}>
                                                        {v.titel}
                                                        <span className="sr-only">
                                                            {v.stand === 'ok' ? ' (erledigt)' : v.stand === 'laeuft' ? ' (läuft)' : v.stand === 'fehler' ? ' (nicht erreicht)' : ' (folgt)'}
                                                        </span>
                                                    </span>
                                                    <span className="block text-sm text-text-secondary tabular-nums">{v.detail}</span>
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                    {zustand === 'verbunden' && (
                                        <span className="sr-only" aria-label={`Gesprächsdauer ${dauerAnzeige(dauerSek)}`}>
                                            {dauerAnzeige(dauerSek)}
                                        </span>
                                    )}
                                </>
        );
        if (!platzhalter) return inhalt;
        return (
            <div className="relative" aria-hidden="true">
                <div className="invisible" inert>
                    {inhalt}
                </div>
                <div className="absolute inset-0 flex flex-col gap-5">
                    <p className="text-xl sm:text-2xl font-bold text-text-secondary tracking-tight">Ihr Testanruf</p>
                    <p className="-mt-3 text-sm text-text-secondary">Sobald Ihr Assistent bereit ist, wählen Sie hier Sprache und Nummer.</p>
                    <span className="h-[3.25rem] rounded-xl bg-surface" />
                    <span className="h-12 rounded-xl bg-surface" />
                    <span className="h-10 w-4/5 rounded-lg bg-surface" />
                    <span className="h-14 rounded-2xl bg-surface" />
                    <span className="flex-1 rounded-2xl bg-surface/60" />
                </div>
            </div>
        );
    };

    return (
        <div className={styles.buehne} ref={buehneRef}>
            <div className={styles.intro}>{children}</div>

            {/* Konsole: Eingabe der Website */}
            <div className={styles.konsole}>
                <form onSubmit={starteScan} noValidate aria-label="Website scannen">
                    <label htmlFor="ki-demo-url" className="sr-only">
                        Ihre Website
                    </label>
                    <div className={`${styles.feld} flex flex-col sm:flex-row gap-2 rounded-[1.35rem] border border-border bg-card p-2 shadow-[0_20px_50px_-30px_rgba(10,18,10,0.35)]`}>
                        <div className="relative flex-1 min-w-0">
                            <Globe className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" aria-hidden="true" />
                            <input
                                ref={eingabeRef}
                                id="ki-demo-url"
                                type="text"
                                inputMode="url"
                                autoComplete="url"
                                autoCapitalize="none"
                                spellCheck={false}
                                value={zustand === 'eingabe' ? eingabe : host || eingabe}
                                onChange={(e) => setEingabe(e.target.value)}
                                readOnly={zustand !== 'eingabe'}
                                placeholder="Ihre Website, z. B. muster-ag.ch"
                                aria-invalid={!!scanFehler}
                                aria-describedby={scanFehler ? 'ki-demo-url-fehler' : 'ki-demo-vertrauen'}
                                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-transparent text-text-primary text-lg placeholder:text-text-secondary/80 focus:outline-none read-only:text-text-secondary"
                            />
                        </div>
                        {zustand === 'eingabe' || zustand === 'scan' ? (
                            <div className="sm:w-auto sm:min-w-[13.5rem]">
                                <PrimaerKnopf zustand={zustand} name={name} type="submit" id="ki-demo-scan-knopf" gesperrt={zustand === 'eingabe' && scanGesperrt} />
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={andereWebsite}
                                disabled={imAnruf}
                                className="sm:min-w-[13.5rem] inline-flex items-center justify-center gap-2 h-14 px-6 rounded-2xl border-2 border-border text-text-primary text-base font-semibold hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                                Andere Website
                            </button>
                        )}
                    </div>
                    {scanFehler && (
                        <p id="ki-demo-url-fehler" role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
                            {scanFehler}
                        </p>
                    )}
                </form>

                <p id="ki-demo-vertrauen" className="mt-4 text-sm text-text-secondary">
                    Kostenlos · Ohne Anmeldung · Keine Werbeanrufe
                </p>

                {/* Belege (Leerlauf) bzw. Funde (ab Scan) im selben Platz */}
                <div className={`${styles.fundzeile} mt-5`}>
                    {zustand === 'eingabe' ? (
                        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                            {[
                                { icon: Languages, text: 'Deutsch und Englisch, Schweizerdeutsch in Erprobung' },
                                { icon: Timer, text: 'In einer Minute' },
                                { icon: BookOpen, text: 'Ihre Website als Wissen' },
                            ].map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-start gap-2.5 text-sm font-medium text-text-primary leading-snug">
                                    <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center" aria-hidden="true">
                                        <Icon className="w-3.5 h-3.5" />
                                    </span>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <ul className="flex flex-wrap gap-2" aria-label="Gefunden">
                            {chips.map((c) => (
                                <li
                                    key={c.id}
                                    className={`${styles.chip} inline-flex items-center gap-2 h-8 sm:h-9 rounded-full border border-border bg-card pl-1 sm:pl-1.5 pr-3 sm:pr-3.5 text-[0.8125rem] sm:text-sm font-medium text-text-primary`}
                                >
                                    {c.logoSrc ? (
                                        <span className="h-6 rounded-full px-2 flex items-center ring-1 ring-black/5" style={{ background: c.logoGrund ?? '#FFFFFF' }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element -- eigener Proxy */}
                                            <img src={c.logoSrc} alt="" className="block h-4 w-auto max-w-[4.5rem] object-contain" />
                                        </span>
                                    ) : c.farbe ? (
                                        <span className="w-6 h-6 rounded-full ring-1 ring-black/10" style={{ background: c.farbe }} aria-hidden="true" />
                                    ) : (
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center" aria-hidden="true">
                                            {c.icon === 'telefon' ? <Phone className="w-3.5 h-3.5" /> : c.icon === 'zeiten' ? <Clock className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                                        </span>
                                    )}
                                    {c.id === 'farbe' ? <span className="tabular-nums">{c.text}</span> : c.text}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Lebendes Telefon — ab lg läuft es während Scan, Karte und Anruf mit (sticky bis zum Ende der Bühne) */}
            <div
                className={`${styles.telefonBereich} scroll-mt-20 focus:outline-none`}
                ref={telefonRef}
                data-mitlaufen={zustand !== 'eingabe' ? 'true' : undefined}
                tabIndex={-1}
            >
                <Telefon
                    zustand={zustand}
                    host={host}
                    welleFarbe={telefonWelle}
                    schritte={schritte}
                    karte={kartenAnzeige}
                    sprache={sprache}
                    onSprache={setSprache}
                    dauerSek={dauerSek}
                    zusammenfassung={auftrag?.zusammenfassung ?? null}
                    fehlerGrund={auftrag?.grund ?? null}
                />
            </div>

            {/* Aktion: Testanruf. Ab dem Scan ist der Platz reserviert (Platzhalter), danach bleibt
                das Formular stehen und nur der Button wechselt — keine Layout-Sprünge beim Polling. */}
            <div className={styles.aktion}>
                {zustand !== 'eingabe' && (
                    <section
                        ref={aktionRef}
                        aria-labelledby="ki-demo-anruf-titel"
                        className={`${styles.einblenden} ${styles.aktionKarte} rounded-[1.75rem] border border-border bg-card p-5 sm:p-7 shadow-[0_30px_60px_-40px_rgba(10,18,10,0.45)]`}
                        style={aktionMin ? { minHeight: aktionMin } : undefined}
                    >
                        {!karte || !kartenAnzeige || zustand === 'scan' ? (
                            anrufFormular(true)
                        ) : zustand === 'beendet' ? (
                            <>
                                <h2 id="ki-demo-anruf-titel" className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                                    Gespräch beendet – so lief es:
                                </h2>
                                <div className="mt-4 space-y-5">
                                    <div className="rounded-2xl bg-surface border border-border p-4 sm:p-5">
                                        <p className="text-text-primary leading-relaxed">{auftrag?.zusammenfassung ?? 'Die Zusammenfassung folgt in Kürze.'}</p>
                                        {auftrag?.dauer_s !== null && auftrag?.dauer_s !== undefined && (
                                            <p className="mt-2 text-sm text-text-secondary tabular-nums">Dauer: {dauerAnzeige(auftrag.dauer_s)} Min.</p>
                                        )}
                                    </div>
                                    <PrimaerKnopf zustand={zustand} name={kartenAnzeige.name} type="button" onClick={nochmals} id="ki-demo-anruf-knopf" />
                                    <div className="pt-1">
                                        <p className="text-text-secondary leading-relaxed">{NACH_GESPRAECH}</p>
                                        <Link
                                            href={`/kontakt?subject=${encodeURIComponent('KI-Telefonassistent')}&message=${encodeURIComponent(
                                                `Ich habe den Demo-Assistenten für ${kartenAnzeige.firma} (${kartenAnzeige.website}) getestet und möchte ihn für unseren Betrieb einrichten.`,
                                            )}`}
                                            className={`${styles.knopf} ${KNOPF_BASIS} mt-4 bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover`}
                                        >
                                            So bekommt Ihre Firma diesen Assistenten
                                            <ArrowRight className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                                        </Link>
                                    </div>
                                </div>
                            </>
                        ) : (
                            anrufFormular(false)
                        )}
                    </section>
                )}
            </div>

            {/* AUFTRAG-100: Statuszeile mobil (fest unter dem Header, 48 px), solange das Telefon nicht im Bild ist */}
            <button
                type="button"
                onClick={zumTelefon}
                className={styles.statuszeile}
                data-sichtbar={statusSichtbar ? 'true' : undefined}
                aria-hidden={!statusSichtbar || undefined}
                tabIndex={statusSichtbar ? 0 : -1}
                data-zustand={zustand}
            >
                <span className="container mx-auto flex h-full items-center gap-3 px-4 text-left">
                    {/* key: jedes Zeichen ist ein neues Element (kein Umbau eines bestehenden = keine Layout-Verschiebung) */}
                    <span key={statusZeile?.zeichen ?? 'leer'} className="flex h-7 w-7 flex-shrink-0 items-center justify-center" aria-hidden="true">
                        {statusZeile?.zeichen === 'scan' ? (
                            <Loader2 className="h-5 w-5 text-primary motion-safe:animate-spin" />
                        ) : statusZeile?.zeichen === 'farbe' ? (
                            <span className="h-4 w-4 rounded-full ring-2 ring-black/10 dark:ring-white/15" style={{ background: statusZeile.farbe ?? GRUEN_LEERLAUF }} />
                        ) : statusZeile?.zeichen === 'puls' ? (
                            <span className={`${styles.puls} text-primary`} />
                        ) : statusZeile?.zeichen === 'welle' ? (
                            <span className={`${styles.knopfWelle} text-[#1f7a35] dark:text-primary`}>
                                <span />
                                <span />
                                <span />
                                <span />
                                <span />
                            </span>
                        ) : statusZeile?.zeichen === 'fehler' ? (
                            <X className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={2.6} />
                        ) : (
                            <Check className="h-5 w-5 text-primary" strokeWidth={2.6} />
                        )}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-xs text-text-secondary tabular-nums">{statusZeile?.kopf}</span>
                        <span className="block truncate text-sm font-semibold text-text-primary tabular-nums">{statusZeile?.text}</span>
                    </span>
                    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-text-primary">
                        Zum Telefon
                        {sicht.oben ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                </span>
            </button>

            {/* Ansage der Zustandswechsel für Screenreader */}
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {zustand === 'fehler' ? `${fehlerMeldung(auftrag?.grund).text.replace(/:$/, '')}: 052 222 18 18.` : ansage(zustand, name, firma)}
            </p>
        </div>
    );
}
