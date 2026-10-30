'use client';

/**
 * Header mit Mega-Menü (AUFTRAG-100).
 *
 * Desktop (ab lg): «Leistungen» und «Für wen» öffnen ein Panel in voller
 * Breite unter dem Header, «Unternehmen» ein einfaches Dropdown;
 * «IT-Support» und «Cloud-Telefonie» bleiben Direktlinks. Öffnen bei Hover
 * (nur Maus, mit kurzer Absicht-Verzögerung) und bei Klick/Enter/Leertaste,
 * Pfeil runter öffnet und springt auf den ersten Link, Escape schliesst und
 * gibt den Fokus an den Auslöser zurück, Verlassen (Maus oder Fokus)
 * schliesst. Keine Fokusfalle. Alle Panels bleiben im DOM (Links für
 * Crawler), geschlossen sind sie unsichtbar.
 *
 * Mobil: Vollbild-Overlay mit Akkordeon (Gruppen aufklappbar, grosse
 * Touchziele), darunter die Hervorhebung «KI-Anruf testen» und der CTA.
 */
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CalendarCheck, ChevronDown, ChevronRight, Mail, Menu, Phone, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import styles from './Header.module.css';
import {
    aktivePanelId,
    BRANCHEN,
    DIREKTLINKS,
    ERSTGESPRAECH,
    KEINE_REGIONEN,
    KI_BEREICH,
    KI_KARTE,
    KI_UEBERSICHT,
    LEISTUNGEN,
    LEISTUNGEN_UEBERSICHT,
    pfadVon,
    REGION_GRUPPEN,
    UNTERNEHMEN,
    type NavLink,
    type NavRegionen,
    type PanelId,
} from './navigation';

/** Absicht beim Hovern: kurz warten, bevor ein Panel aufgeht bzw. zugeht */
const OEFFNEN_MS = 80;
const SCHLIESSEN_MS = 180;

/** Balkenhöhen der kleinen Wellenform in der KI-Karte */
const WELLE = [0.35, 0.6, 0.85, 0.5, 0.95, 0.7, 0.4, 0.8, 1, 0.65, 0.45, 0.9, 0.55, 0.75, 0.4, 0.85, 0.6, 0.3];

type MobilGruppe = 'leistungen' | 'ki' | 'fuer-wen' | 'unternehmen';

export function Header({ regionen = KEINE_REGIONEN }: { regionen?: NavRegionen }) {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [offen, setOffen] = useState<PanelId | null>(null);
    const [mobilOffen, setMobilOffen] = useState(false);
    const [mobilGruppe, setMobilGruppe] = useState<MobilGruppe | null>(null);
    const [mobilRegion, setMobilRegion] = useState<string | null>(null);

    const navRef = useRef<HTMLElement>(null);
    const oeffnenTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const schliessenTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const zeigerArt = useRef<string>('mouse');

    // Routenwechsel: alles schliessen (abgeleiteter Zustand statt Effekt)
    const [letzterPfad, setLetzterPfad] = useState(pathname);
    if (pathname !== letzterPfad) {
        setLetzterPfad(pathname);
        setOffen(null);
        setMobilOffen(false);
        setMobilGruppe(null);
        setMobilRegion(null);
    }

    useEffect(() => {
        const beimScrollen = () => setIsScrolled(window.scrollY > 20);
        beimScrollen();
        window.addEventListener('scroll', beimScrollen, { passive: true });
        return () => window.removeEventListener('scroll', beimScrollen);
    }, []);

    // Mobil: Seite hinter dem Overlay festhalten und beim Schliessen an dieselbe Stelle zurück
    useEffect(() => {
        if (!mobilOffen) return;
        const y = window.scrollY;
        const stil = document.body.style;
        stil.position = 'fixed';
        stil.top = `-${y}px`;
        stil.width = '100%';
        document.body.classList.add('mobile-menu-open');
        const taste = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setMobilOffen(false);
            document.getElementById('nav-mobil-knopf')?.focus();
        };
        document.addEventListener('keydown', taste);
        return () => {
            document.removeEventListener('keydown', taste);
            document.body.classList.remove('mobile-menu-open');
            stil.position = '';
            stil.top = '';
            stil.width = '';
            window.scrollTo(0, y);
        };
    }, [mobilOffen]);

    // Desktop: Klick ausserhalb und Escape schliessen das offene Panel
    useEffect(() => {
        if (!offen) return;
        const aussen = (e: globalThis.PointerEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) setOffen(null);
        };
        const taste = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            const fokusImMenue = !!navRef.current?.contains(document.activeElement);
            setOffen(null);
            if (fokusImMenue) document.getElementById(`nav-knopf-${offen}`)?.focus();
        };
        document.addEventListener('pointerdown', aussen);
        document.addEventListener('keydown', taste);
        return () => {
            document.removeEventListener('pointerdown', aussen);
            document.removeEventListener('keydown', taste);
        };
    }, [offen]);

    useEffect(
        () => () => {
            clearTimeout(oeffnenTimer.current);
            clearTimeout(schliessenTimer.current);
        },
        [],
    );

    /* ---------- Steuerung Desktop ---------- */

    const timerStopp = () => {
        clearTimeout(oeffnenTimer.current);
        clearTimeout(schliessenTimer.current);
    };

    const mausRein = (id: PanelId | null) => (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        timerStopp();
        if (id === null) {
            // Direktlink: offenes Panel nach kurzer Zeit schliessen
            schliessenTimer.current = setTimeout(() => setOffen(null), SCHLIESSEN_MS);
            return;
        }
        if (offen) setOffen(id);
        else oeffnenTimer.current = setTimeout(() => setOffen(id), OEFFNEN_MS);
    };

    const mausRaus = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        timerStopp();
        schliessenTimer.current = setTimeout(() => setOffen(null), SCHLIESSEN_MS);
    };

    const knopfKlick = (id: PanelId) => (e: MouseEvent) => {
        timerStopp();
        // Tastatur (Enter/Leertaste) und Touch schalten um; die Maus öffnet (das Panel ist meist schon per Hover offen)
        if (e.detail === 0 || zeigerArt.current === 'touch') setOffen((o) => (o === id ? null : id));
        else setOffen(id);
    };

    const knopfTaste = (id: PanelId) => (e: KeyboardEvent) => {
        if (e.key !== 'ArrowDown') return;
        e.preventDefault();
        timerStopp();
        setOffen(id);
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`#nav-panel-${id} a`)?.focus());
    };

    // Fokus verlässt den Menüpunkt (Tab weiter) → schliessen; ohne Ziel (Klick ins Leere) nicht
    const fokusRaus = (id: PanelId) => (e: FocusEvent<HTMLElement>) => {
        const ziel = e.relatedTarget as Node | null;
        if (ziel && !e.currentTarget.contains(ziel)) setOffen((o) => (o === id ? null : o));
    };

    const schliessen = () => {
        timerStopp();
        setOffen(null);
    };

    const aktiv = aktivePanelId(pathname, regionen);
    const istAktuell = (href: string) => (href.includes('#') ? false : pfadVon(href) === pathname);

    /* ---------- Bausteine ---------- */

    /** iconErstAbXl: im KI-Panel (vier Spalten) bei 1024 px ohne Icon, damit lange Wörter nicht überlaufen */
    const panelLink = (l: NavLink, iconErstAbXl = false) => {
        const Icon = l.icon;
        return (
            <Link
                href={l.href}
                onClick={schliessen}
                aria-current={istAktuell(l.href) ? 'page' : undefined}
                className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-surface focus-visible:bg-surface aria-[current=page]:bg-surface xl:items-start xl:py-2.5"
            >
                {Icon && (
                    <span className={cn('h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary xl:mt-0.5', iconErstAbXl ? 'hidden xl:flex' : 'flex')} aria-hidden="true">
                        <Icon className="h-[1.125rem] w-[1.125rem]" />
                    </span>
                )}
                <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 text-[0.9375rem] font-semibold leading-snug text-text-primary group-hover:text-primary">
                        {l.titel}
                        {l.badge && <span className="rounded-full border border-primary/40 px-1.5 py-px text-[0.6875rem] font-semibold leading-4 text-primary-hover dark:text-primary">{l.badge}</span>}
                    </span>
                    {/* Beschreibung erst ab xl: bei 1024 px bleibt das Panel kompakt */}
                    {l.text && <span className="mt-0.5 hidden text-[0.8125rem] leading-snug text-text-secondary xl:block">{l.text}</span>}
                </span>
            </Link>
        );
    };

    const kiKarte = (mobil = false) => (
        <Link
            href={KI_KARTE.href}
            onClick={mobil ? () => setMobilOffen(false) : schliessen}
            className={cn(styles.kiKarte, 'group relative flex flex-col overflow-hidden rounded-2xl p-5 text-white')}
        >
            <span className={styles.welle} aria-hidden="true">
                {WELLE.map((h, i) => (
                    <span key={i} style={{ '--h': h, '--i': i } as CSSProperties} />
                ))}
            </span>
            <span className="mt-4 text-lg font-bold leading-tight">{KI_KARTE.titel}</span>
            <span className="mt-1 text-sm leading-snug text-white/80">{KI_KARTE.text}</span>
            <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#14361a]">
                {KI_KARTE.aktion}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
            </span>
        </Link>
    );

    const erstgespraech = (
        <Link
            href={ERSTGESPRAECH.href}
            onClick={schliessen}
            className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary/60 hover:text-primary"
        >
            <CalendarCheck className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
            {ERSTGESPRAECH.titel}
            <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 text-text-secondary" aria-hidden="true" />
        </Link>
    );

    const panelHuelle = (inhalt: ReactNode, fuss?: ReactNode) => (
        <div className={cn(styles.panelHuelle, 'border-y border-border bg-card shadow-[0_28px_50px_-28px_rgba(10,18,10,0.45)] dark:shadow-[0_28px_50px_-24px_rgba(0,0,0,0.8)]')}>
            <div className="container mx-auto px-4">{inhalt}</div>
            {fuss && (
                <div className="border-t border-border bg-surface/50">
                    <div className="container mx-auto px-4">{fuss}</div>
                </div>
            )}
        </div>
    );

    const panelLeistungen = panelHuelle(
        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_15rem] gap-x-3 py-6 xl:grid-cols-[repeat(3,minmax(0,1fr))_17.5rem] xl:gap-x-8 xl:py-8">
            {LEISTUNGEN.map((g) => (
                <div key={g.id} className="min-w-0">
                    <p id={`nav-gruppe-${g.id}`} className="px-3 pb-2 text-[0.8125rem] font-semibold text-text-secondary">
                        {g.titel}
                    </p>
                    <ul aria-labelledby={`nav-gruppe-${g.id}`} className="space-y-0.5">
                        {g.links.map((l) => (
                            <li key={l.href}>{panelLink(l)}</li>
                        ))}
                    </ul>
                </div>
            ))}
            <div className="flex flex-col gap-3 pt-7">
                {kiKarte()}
                {erstgespraech}
            </div>
        </div>,
        <Link href={LEISTUNGEN_UEBERSICHT.href} onClick={schliessen} className="group inline-flex items-center gap-2 py-3.5 px-3 text-sm font-semibold text-text-primary hover:text-primary">
            {LEISTUNGEN_UEBERSICHT.titel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </Link>,
    );

    // AUFTRAG-110: Bereich KI-Telefonassistent mit vier Spalten und der KI-Karte
    const panelKi = panelHuelle(
        <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_14rem] gap-x-2 py-6 xl:grid-cols-[repeat(4,minmax(0,1fr))_17.5rem] xl:gap-x-6 xl:py-8">
            {KI_BEREICH.map((g) => (
                <div key={g.id} className="min-w-0">
                    <p id={`nav-gruppe-${g.id}`} className="px-3 pb-2 text-[0.8125rem] font-semibold text-text-secondary">
                        {g.titel}
                    </p>
                    <ul aria-labelledby={`nav-gruppe-${g.id}`} className="space-y-0.5">
                        {g.links.map((l) => (
                            <li key={l.href}>{panelLink(l, true)}</li>
                        ))}
                    </ul>
                </div>
            ))}
            <div className="flex flex-col gap-3 pt-7">
                {kiKarte()}
                {erstgespraech}
            </div>
        </div>,
        <Link href={KI_UEBERSICHT.href} onClick={schliessen} className="group inline-flex items-center gap-2 py-3.5 px-3 text-sm font-semibold text-text-primary hover:text-primary">
            {KI_UEBERSICHT.titel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </Link>,
    );

    const panelFuerWen = panelHuelle(
        <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-x-6 py-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:gap-x-12 xl:py-8">
            <div className="min-w-0">
                <p id="nav-gruppe-branchen" className="px-3 pb-2 text-[0.8125rem] font-semibold text-text-secondary">
                    Branchen
                </p>
                <ul aria-labelledby="nav-gruppe-branchen" className="grid grid-cols-1 gap-x-1 gap-y-0.5 xl:grid-cols-2">
                    {BRANCHEN.map((b) => (
                        <li key={b.titel}>{panelLink(b)}</li>
                    ))}
                </ul>
            </div>
            <div className="min-w-0 border-l border-border pl-6 xl:pl-12">
                <p id="nav-gruppe-regionen" className="pb-2 text-[0.8125rem] font-semibold text-text-secondary">
                    Regionen
                </p>
                <div className="grid grid-cols-4 gap-x-4">
                    {REGION_GRUPPEN.map((g) => (
                        <div key={g.schluessel} className={cn('min-w-0', g.schluessel === 'webdesign' && 'col-span-2')}>
                            <p id={`nav-regionen-${g.schluessel}`} className="whitespace-nowrap pb-1.5 pt-0.5 text-sm font-semibold text-text-primary xl:text-[0.9375rem]">
                                {g.titel}
                            </p>
                            {/* Webdesign: zwei Spalten, die von oben nach unten laufen (alphabetisch lesbar) */}
                            <ul aria-labelledby={`nav-regionen-${g.schluessel}`} className={cn(g.schluessel === 'webdesign' && 'columns-2 gap-x-4')}>
                                {regionen[g.schluessel].map((r) => {
                                    const href = `${g.basis}/${r.slug}`;
                                    return (
                                        <li key={r.slug}>
                                            <Link
                                                href={href}
                                                onClick={schliessen}
                                                aria-current={pathname === href ? 'page' : undefined}
                                                className="block truncate rounded-md py-1 text-sm text-text-secondary transition-colors hover:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary-hover dark:aria-[current=page]:text-primary"
                                            >
                                                <span className="sr-only">{g.titel} </span>
                                                {r.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
    );

    const dropdownUnternehmen = (
        <div className="w-60 rounded-2xl border border-border bg-card p-2 shadow-[0_24px_44px_-24px_rgba(10,18,10,0.45)] dark:shadow-[0_24px_44px_-20px_rgba(0,0,0,0.8)]">
            <ul>
                {UNTERNEHMEN.map((l) => {
                    const Icon = l.icon;
                    return (
                        <li key={l.href}>
                            <Link
                                href={l.href}
                                onClick={schliessen}
                                aria-current={istAktuell(l.href) ? 'page' : undefined}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium text-text-primary transition-colors hover:bg-surface hover:text-primary aria-[current=page]:bg-surface"
                            >
                                {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />}
                                {l.titel}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );

    const ausloeser = (id: PanelId, titel: ReactNode, inhalt: ReactNode) => (
        <li
            className={cn('flex items-center', id === 'unternehmen' ? 'relative' : 'static')}
            onPointerEnter={mausRein(id)}
            onPointerLeave={mausRaus}
            onBlur={fokusRaus(id)}
        >
            <button
                id={`nav-knopf-${id}`}
                type="button"
                aria-expanded={offen === id}
                aria-controls={`nav-panel-${id}`}
                onPointerDown={(e) => {
                    zeigerArt.current = e.pointerType;
                }}
                onClick={knopfKlick(id)}
                onKeyDown={knopfTaste(id)}
                className={cn(
                    'flex h-10 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[0.875rem] font-medium text-text-primary transition-colors hover:bg-surface hover:text-primary xl:px-3.5 xl:text-[0.9375rem]',
                    (offen === id || aktiv === id) && 'text-primary-hover dark:text-primary',
                    offen === id && 'bg-surface',
                )}
            >
                {titel}
                <ChevronDown className={cn('h-4 w-4 transition-transform duration-200 motion-reduce:transition-none', offen === id && 'rotate-180')} aria-hidden="true" />
            </button>
            <div id={`nav-panel-${id}`} className={id === 'unternehmen' ? styles.dropdown : styles.panel} data-offen={offen === id}>
                {inhalt}
            </div>
        </li>
    );

    /* ---------- Mobil ---------- */

    const mobilSchliessen = () => setMobilOffen(false);

    const mobilAkkordeon = (id: string, titel: string, auf: boolean, umschalten: () => void, inhalt: ReactNode, klein = false) => (
        <>
            <button
                type="button"
                id={`nav-mobil-knopf-${id}`}
                aria-expanded={auf}
                aria-controls={`nav-mobil-${id}`}
                onClick={umschalten}
                className={cn(
                    'flex w-full items-center justify-between gap-4 text-left text-text-primary',
                    klein ? 'min-h-12 rounded-xl px-3 text-base font-semibold hover:bg-surface' : 'min-h-14 py-3 text-lg font-semibold',
                )}
            >
                {titel}
                <ChevronDown className={cn('h-5 w-5 flex-shrink-0 text-text-secondary transition-transform duration-200 motion-reduce:transition-none', auf && 'rotate-180 text-primary')} aria-hidden="true" />
            </button>
            <div id={`nav-mobil-${id}`} className={styles.akkordeon} data-offen={auf}>
                <div>{inhalt}</div>
            </div>
        </>
    );

    const mobilLink = (l: NavLink) => {
        const Icon = l.icon;
        return (
            <Link
                href={l.href}
                onClick={mobilSchliessen}
                aria-current={istAktuell(l.href) ? 'page' : undefined}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-1.5 text-base font-medium text-text-primary transition-colors hover:bg-surface aria-[current=page]:bg-surface aria-[current=page]:text-primary-hover dark:aria-[current=page]:text-primary"
            >
                {Icon && (
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                        <Icon className="h-[1.125rem] w-[1.125rem]" />
                    </span>
                )}
                <span className="min-w-0">{l.titel}</span>
                {l.badge && <span className="rounded-full border border-primary/40 px-1.5 py-px text-[0.6875rem] font-semibold leading-4 text-primary-hover dark:text-primary">{l.badge}</span>}
            </Link>
        );
    };

    const umschaltenMobil = (id: MobilGruppe) => () => setMobilGruppe((g) => (g === id ? null : id));

    const mobilLeistungen = (
        <div className="space-y-4 pb-5">
            {LEISTUNGEN.map((g) => (
                <div key={g.id}>
                    <p id={`nav-mobil-gruppe-${g.id}`} className="px-3 pb-1 text-sm font-semibold text-text-secondary">
                        {g.titel}
                    </p>
                    <ul aria-labelledby={`nav-mobil-gruppe-${g.id}`}>
                        {g.links.map((l) => (
                            <li key={l.href}>{mobilLink(l)}</li>
                        ))}
                    </ul>
                </div>
            ))}
            <Link href={LEISTUNGEN_UEBERSICHT.href} onClick={mobilSchliessen} className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-base font-semibold text-primary-hover dark:text-primary">
                {LEISTUNGEN_UEBERSICHT.titel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
        </div>
    );

    const mobilKi = (
        <div className="space-y-4 pb-5">
            {KI_BEREICH.map((g) => (
                <div key={g.id}>
                    <p id={`nav-mobil-gruppe-${g.id}`} className="px-3 pb-1 text-sm font-semibold text-text-secondary">
                        {g.titel}
                    </p>
                    <ul aria-labelledby={`nav-mobil-gruppe-${g.id}`}>
                        {g.links.map((l) => (
                            <li key={l.href}>{mobilLink(l)}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );

    const mobilFuerWen = (
        <div className="space-y-4 pb-5">
            <div>
                <p id="nav-mobil-gruppe-branchen" className="px-3 pb-1 text-sm font-semibold text-text-secondary">
                    Branchen
                </p>
                <ul aria-labelledby="nav-mobil-gruppe-branchen">
                    {BRANCHEN.map((b) => (
                        <li key={b.titel}>{mobilLink(b)}</li>
                    ))}
                </ul>
            </div>
            <div>
                <p className="px-3 pb-1 text-sm font-semibold text-text-secondary">Regionen</p>
                <ul>
                    {REGION_GRUPPEN.map((g) => (
                        <li key={g.schluessel}>
                            {mobilAkkordeon(
                                `regionen-${g.schluessel}`,
                                g.titel,
                                mobilRegion === g.schluessel,
                                () => setMobilRegion((r) => (r === g.schluessel ? null : g.schluessel)),
                                <ul className="grid grid-cols-2 gap-2 px-3 pb-3 pt-1">
                                    {regionen[g.schluessel].map((r) => {
                                        const href = `${g.basis}/${r.slug}`;
                                        return (
                                            <li key={r.slug}>
                                                <Link
                                                    href={href}
                                                    onClick={mobilSchliessen}
                                                    aria-current={pathname === href ? 'page' : undefined}
                                                    className="flex min-h-12 items-center rounded-xl border border-border bg-card px-3 text-[0.9375rem] font-medium text-text-primary transition-colors hover:border-primary/60 aria-[current=page]:border-primary aria-[current=page]:text-primary-hover dark:aria-[current=page]:text-primary"
                                                >
                                                    <span className="sr-only">{g.titel} </span>
                                                    {r.name}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>,
                                true,
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    const mobilUnternehmen = (
        <ul className="pb-5">
            {UNTERNEHMEN.map((l) => (
                <li key={l.href}>{mobilLink(l)}</li>
            ))}
        </ul>
    );

    const kopfLeiste = isScrolled && !mobilOffen;

    return (
        <>
            {/* Top Bar */}
            <div className="hidden lg:block bg-primary text-white py-2">
                <div className="container mx-auto px-4 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-6">
                        <a href="tel:+41522221818" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Phone className="w-4 h-4" />
                            <span>052 222 18 18</span>
                        </a>
                        <a href="mailto:info@infraone.ch" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Mail className="w-4 h-4" />
                            <span>info@infraone.ch</span>
                        </a>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Mo-Fr 8:00-17:00</span>
                        <span className="text-primary-light">|</span>
                        <span className="font-semibold">Antwort innert einem Arbeitstag</span>
                    </div>
                </div>
            </div>

            {/* Main Header - Fixed positioning for reliable sticky behavior */}
            <header
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow,border-color] duration-200',
                    kopfLeiste ? 'bg-background/95 backdrop-blur-lg shadow-lg border-b border-border' : 'bg-background',
                )}
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo - Show dark logo in light mode, light logo in dark mode */}
                        <Link href="/" className="relative z-[110] flex-shrink-0" onPointerEnter={mausRein(null)}>
                            {/* AUFTRAG-100: width/height im echten Seitenverhältnis der SVGs (viewBox), sonst verschiebt sich die Leiste beim Laden */}
                            <Image
                                src="/infraone-logo-schwarz.svg"
                                alt="InfraOne IT Solutions"
                                width={3638}
                                height={974}
                                className="h-10 lg:h-9 xl:h-12 w-auto dark:hidden"
                                priority
                            />
                            <Image
                                src="/infraone-logo-weiss.svg"
                                alt="InfraOne IT Solutions"
                                width={3637}
                                height={973}
                                className="h-10 lg:h-9 xl:h-12 w-auto hidden dark:block"
                                priority
                            />
                        </Link>

                        {/* Desktop: Mega-Menü */}
                        <nav ref={navRef} aria-label="Hauptnavigation" className="hidden lg:block h-full">
                            <ul className="flex h-full items-stretch gap-0 xl:gap-1">
                                {ausloeser('leistungen', 'Leistungen', panelLeistungen)}
                                {ausloeser(
                                    'ki',
                                    <>
                                        {/* bei 1024 px kürzer, damit die Leiste nicht umbricht */}
                                        <span className="xl:hidden">KI-Assistent</span>
                                        <span className="hidden xl:inline">KI-Telefonassistent</span>
                                    </>,
                                    panelKi,
                                )}
                                {ausloeser('fuer-wen', 'Für wen', panelFuerWen)}
                                {DIREKTLINKS.map((l) => (
                                    <li key={l.href} className="flex items-center" onPointerEnter={mausRein(null)}>
                                        <Link
                                            href={l.href}
                                            aria-current={pathname === l.href ? 'page' : undefined}
                                            className="flex h-10 items-center whitespace-nowrap rounded-lg px-2 text-[0.875rem] font-medium text-text-primary transition-colors hover:bg-surface hover:text-primary aria-[current=page]:text-primary-hover dark:aria-[current=page]:text-primary xl:px-3.5 xl:text-[0.9375rem]"
                                        >
                                            {l.titel}
                                        </Link>
                                    </li>
                                ))}
                                {ausloeser('unternehmen', 'Unternehmen', dropdownUnternehmen)}
                            </ul>
                        </nav>

                        {/* Desktop Actions */}
                        <div className="hidden lg:flex items-center gap-3" onPointerEnter={mausRein(null)}>
                            <ThemeToggle />
                            <Button variant="primary" size="sm" className="lg:px-3 xl:px-4" asChild>
                                {/* AUFTRAG-110: bei 1024 px kurz, damit der zusätzliche Menüpunkt Platz hat */}
                                <Link href="/kontakt" aria-label="Kostenloses Erstgespräch">
                                    <span className="xl:hidden">Erstgespräch</span>
                                    <span className="hidden xl:inline">Kostenloses Erstgespräch</span>
                                </Link>
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex lg:hidden items-center gap-2 relative z-[110]">
                            <ThemeToggle />
                            <button
                                id="nav-mobil-knopf"
                                type="button"
                                onClick={() => {
                                    // jedes Öffnen beginnt mit zugeklappten Gruppen
                                    if (!mobilOffen) {
                                        setMobilGruppe(null);
                                        setMobilRegion(null);
                                    }
                                    setMobilOffen(!mobilOffen);
                                }}
                                className="p-3 rounded-lg hover:bg-surface transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center text-text-primary"
                                aria-label={mobilOffen ? 'Menü schliessen' : 'Menü öffnen'}
                                aria-expanded={mobilOffen}
                                aria-controls="nav-mobil"
                            >
                                {mobilOffen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobil: Vollbild-Overlay mit Akkordeon (bleibt im DOM, geschlossen unsichtbar) */}
                <div id="nav-mobil" className={cn(styles.mobil, 'lg:hidden')} data-offen={mobilOffen} inert={!mobilOffen}>
                    {/* Scrollbereich beginnt unter der Kopfzeile: Inhalt läuft nicht unter Logo und Schalter */}
                    <div className="absolute inset-x-0 bottom-0 top-[calc(4rem+max(1rem,env(safe-area-inset-top)))] overflow-y-auto overscroll-contain touch-manipulation border-t border-border">
                        <div className="container mx-auto px-5 pb-10 pt-2">
                            <nav aria-label="Hauptnavigation">
                                <ul className="border-b border-border [&>li:first-child]:border-t-0">
                                    <li className="border-t border-border">
                                        {mobilAkkordeon('leistungen', 'Leistungen', mobilGruppe === 'leistungen', umschaltenMobil('leistungen'), mobilLeistungen)}
                                    </li>
                                    <li className="border-t border-border">
                                        {mobilAkkordeon('ki', 'KI-Telefonassistent', mobilGruppe === 'ki', umschaltenMobil('ki'), mobilKi)}
                                    </li>
                                    <li className="border-t border-border">
                                        {mobilAkkordeon('fuer-wen', 'Für wen', mobilGruppe === 'fuer-wen', umschaltenMobil('fuer-wen'), mobilFuerWen)}
                                    </li>
                                    {DIREKTLINKS.map((l) => (
                                        <li key={l.href} className="border-t border-border">
                                            <Link
                                                href={l.href}
                                                onClick={mobilSchliessen}
                                                aria-current={pathname === l.href ? 'page' : undefined}
                                                className="flex min-h-14 items-center py-3 text-lg font-semibold text-text-primary aria-[current=page]:text-primary-hover dark:aria-[current=page]:text-primary"
                                            >
                                                {l.titel}
                                            </Link>
                                        </li>
                                    ))}
                                    <li className="border-t border-border">
                                        {mobilAkkordeon('unternehmen', 'Unternehmen', mobilGruppe === 'unternehmen', umschaltenMobil('unternehmen'), mobilUnternehmen)}
                                    </li>
                                </ul>
                            </nav>

                            <div className="mt-6 space-y-3">
                                {kiKarte(true)}
                                <Button variant="primary" size="lg" className="w-full min-h-14 text-base font-semibold" asChild>
                                    <Link href={ERSTGESPRAECH.href} onClick={mobilSchliessen}>
                                        {ERSTGESPRAECH.titel}
                                    </Link>
                                </Button>
                            </div>

                            <div className="mt-8 flex flex-col gap-1 border-t border-border pt-6 text-base text-text-secondary">
                                <a href="tel:+41522221818" className="flex min-h-11 items-center gap-3 transition-colors hover:text-primary">
                                    <Phone className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                    <span>052 222 18 18</span>
                                </a>
                                <a href="mailto:info@infraone.ch" className="flex min-h-11 items-center gap-3 transition-colors hover:text-primary">
                                    <Mail className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                    <span>info@infraone.ch</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Abdunkelung unter offenen Mega-Panels (Klick daneben schliesst) */}
            <div className={styles.schleier} data-offen={offen === 'leistungen' || offen === 'ki' || offen === 'fuer-wen'} aria-hidden="true" />
        </>
    );
}
