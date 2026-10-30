/**
 * Navigation der Website (AUFTRAG-113: Kompromiss zwischen Live-Stand und AUFTRAG-100/110).
 *
 * Leiste: Leistungen ▾ · KI-Telefonassistent ▾ (Badge «Neu») · IT-Support · Cloud-Telefonie ▾
 * · Unternehmen ▾. Alle Gruppen sind schlichte Dropdowns unter dem jeweiligen Knopf:
 * höchstens zwei schmale Spalten, keine Beschreibungstexte, keine Icons, keine Karten.
 *
 * «Für wen» (Branchen-Ankerlinks und Regionen) entfällt im Header. Die Regionsseiten
 * bleiben über die Leistungsseiten /it-support, /cloud-telefonie und /webdesign verlinkt;
 * die Unterseiten des KI-Bereichs (Anwendungen, Branchen, Vergleich, Glossar) über ihre
 * Übersichtsseiten, Brotkrumen, den Hub und die Sitemap.
 *
 * Regeln: nur bestehende Seiten, keine neuen Routen, Texte kurz, ohne Superlative und
 * ohne Zahlen (ausser Produktnamen).
 */
import { KI_BASIS } from '@/components/ki-telefonassistent/seiten';

export interface NavLink {
    titel: string;
    href: string;
    badge?: string;
}

export interface NavGruppe {
    id: string;
    titel: string;
    links: NavLink[];
}

/** Dropdowns der Leiste */
export type PanelId = 'leistungen' | 'ki' | 'cloud' | 'unternehmen';

/** Badge am KI-Telefonassistenten (Leistenknopf und Eintrag unter «Leistungen») */
export const NEU = 'Neu';

/** Leistungen in zwei Spalten */
export const LEISTUNGEN: NavGruppe[] = [
    {
        id: 'it',
        titel: 'IT',
        links: [
            { titel: 'IT-Support', href: '/it-support' },
            { titel: 'IT-Systeme & Netzwerke', href: '/it-netzwerke' },
            { titel: 'IT-Sicherheit', href: '/it-sicherheit' },
            { titel: 'Microsoft 365', href: '/microsoft-365' },
            { titel: 'WLAN', href: '/wlan' },
            { titel: 'Videoüberwachung', href: '/videoueberwachung' },
        ],
    },
    {
        id: 'kommunikation-digital',
        titel: 'Kommunikation & Digital',
        links: [
            // Nachtrag AUFTRAG-113: «Telefonie & Kommunikation» (/telefonie) entfällt — nur eine Weiterleitung auf /cloud-telefonie
            { titel: 'Cloud-Telefonie', href: '/cloud-telefonie' },
            { titel: 'KI-Telefonassistent', href: KI_BASIS, badge: NEU },
            { titel: 'Webdesign', href: '/webdesign' },
            { titel: 'Digital Signage', href: '/digital-signage' },
            { titel: 'KI & Software-Entwicklung', href: '/software-entwicklung' },
        ],
    },
];

export const LEISTUNGEN_UEBERSICHT: NavLink = { titel: 'Alle Leistungen im Überblick', href: '/leistungen' };

/** KI-Telefonassistent in zwei Spalten «Produkt» und «Mehr» */
export const KI_MENUE: NavGruppe[] = [
    {
        id: 'ki-produkt',
        titel: 'Produkt',
        links: [
            { titel: 'Übersicht und Live-Test', href: KI_BASIS },
            { titel: 'Funktionen', href: `${KI_BASIS}/funktionen` },
            { titel: 'So funktioniert es', href: `${KI_BASIS}/so-funktioniert-es` },
            { titel: 'Schweizerdeutsch', href: `${KI_BASIS}/schweizerdeutsch` },
            { titel: 'Preise', href: `${KI_BASIS}/preise` },
        ],
    },
    {
        id: 'ki-mehr',
        titel: 'Mehr',
        links: [
            { titel: 'Anwendungen', href: `${KI_BASIS}/anwendungen` },
            { titel: 'Branchen', href: `${KI_BASIS}/branchen` },
            { titel: 'Sicherheit und Datenschutz', href: `${KI_BASIS}/sicherheit-datenschutz` },
            { titel: 'Häufige Fragen', href: `${KI_BASIS}/faq` },
        ],
    },
];

/** «KI-Anruf testen»: im Desktop-Dropdown als schmaler Knopf, im mobilen Menü als Karte */
export const KI_KARTE = {
    titel: 'KI-Anruf testen',
    text: 'Website eingeben, Ihr Assistent ruft Sie an.',
    aktion: 'Demo starten',
    href: KI_BASIS,
} as const;

/** Cloud-Telefonie: eine Spalte wie live; der Leistenknopf selbst verlinkt die Übersicht */
export const CLOUD_TELEFONIE_HREF = '/cloud-telefonie';
export const CLOUD_TELEFONIE: NavLink[] = [
    { titel: 'Cloud-Telefonie im Überblick', href: CLOUD_TELEFONIE_HREF },
    { titel: 'Peoplefone vPBX', href: '/cloud-telefonie#peoplefone' },
    { titel: '3CX', href: '/cloud-telefonie/3cx' },
    { titel: 'Microsoft Teams', href: '/cloud-telefonie/ms-teams' },
    { titel: 'Yeastar', href: '/cloud-telefonie/yeastar' },
];

export const UNTERNEHMEN: NavLink[] = [
    { titel: 'Über uns', href: '/unternehmen' },
    { titel: 'Partner', href: '/partner' },
    { titel: 'Blog', href: '/blog' },
    { titel: 'Kontakt', href: '/kontakt' },
];

/** Direktlink in der Leiste */
export const IT_SUPPORT: NavLink = { titel: 'IT-Support', href: '/it-support' };

export const ERSTGESPRAECH: NavLink = { titel: 'Kostenloses Erstgespräch', href: '/kontakt' };

/** Reihenfolge der Leiste (Desktop) und des Akkordeons (Mobil) */
export const LEISTE: ReadonlyArray<{ titel: string; panel: PanelId | null }> = [
    { titel: 'Leistungen', panel: 'leistungen' },
    { titel: 'KI-Telefonassistent', panel: 'ki' },
    { titel: IT_SUPPORT.titel, panel: null },
    { titel: 'Cloud-Telefonie', panel: 'cloud' },
    { titel: 'Unternehmen', panel: 'unternehmen' },
];

/** Alle Adressen im Header (für Tests und Prüfskripte) */
export function headerLinks(): NavLink[] {
    return [
        ...LEISTUNGEN.flatMap((g) => g.links),
        LEISTUNGEN_UEBERSICHT,
        ...KI_MENUE.flatMap((g) => g.links),
        { titel: KI_KARTE.titel, href: KI_KARTE.href },
        IT_SUPPORT,
        { titel: 'Cloud-Telefonie', href: CLOUD_TELEFONIE_HREF },
        ...CLOUD_TELEFONIE,
        ...UNTERNEHMEN,
        ERSTGESPRAECH,
    ];
}

/** Pfad ohne Anker, für den Vergleich mit der aktuellen Route */
export function pfadVon(href: string): string {
    const i = href.indexOf('#');
    return i < 0 ? href : href.slice(0, i);
}

const unter = (pfad: string, basis: string) => pfad === basis || pfad.startsWith(`${basis}/`);

/**
 * Welche Gruppe gehört zur aktuellen Route (Hervorhebung in der Leiste)?
 * - /ki-telefonassistent/** → KI, /cloud-telefonie/** (auch Regionen) → Cloud-Telefonie
 * - /it-support und IT-Support-Regionen → Direktlink IT-Support ('direkt')
 * - Leistungsseiten und Webdesign-Regionen → Leistungen
 */
export function aktivePanelId(pfad: string): PanelId | 'direkt' | null {
    if (unter(pfad, KI_BASIS)) return 'ki';
    if (unter(pfad, CLOUD_TELEFONIE_HREF)) return 'cloud';
    if (unter(pfad, IT_SUPPORT.href)) return 'direkt';
    if (unter(pfad, '/webdesign')) return 'leistungen';
    if (pfad === LEISTUNGEN_UEBERSICHT.href || LEISTUNGEN.some((g) => g.links.some((l) => pfadVon(l.href) === pfad))) return 'leistungen';
    if (UNTERNEHMEN.some((l) => l.href === pfad)) return 'unternehmen';
    return null;
}
