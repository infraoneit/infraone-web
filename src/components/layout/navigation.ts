/**
 * Navigation der Website (AUFTRAG-113: Kompromiss zwischen Live-Stand und AUFTRAG-100/110).
 *
 * Leiste: Leistungen ▾ · KI-Telefonassistent ▾ (Badge «Neu») · IT-Support · Cloud-Telefonie ▾
 * · Unternehmen ▾. Alle Gruppen sind schlichte Dropdowns unter dem jeweiligen Knopf:
 * höchstens zwei schmale Spalten, keine Beschreibungstexte, keine Karten.
 *
 * [31.10.2026] AUFTRAG-114: Einträge in Dropdowns und im mobilen Akkordeon tragen ein Icon
 * (Inhaber: «Struktur gut, Icons zusätzlich»). `icon` ist der Name des lucide-Icons als Text,
 * damit diese Datei frei von React/lucide-Importen bleibt (Node-Prüfskripte laden sie direkt);
 * die Zuordnung Name → Komponente steht in Header.tsx. Die Leistenknöpfe selbst bleiben ohne Icon.
 * Die Icons unter «Leistungen» sind dieselben wie auf den Karten der Startseite (ServicesSection).
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

/**
 * AUFTRAG-114: zulässige Icon-Namen (lucide-react 0.562). Header.tsx bildet jeden Namen in einem
 * expliziten Objekt auf die Komponente ab (Record<NavIconName, …>, TypeScript prüft die Vollständigkeit).
 */
export const NAV_ICON_NAMEN = [
    'Headset',
    'Server',
    'ShieldCheck',
    'Cloud',
    'Wifi',
    'Video',
    'Phone',
    'AudioLines',
    'Palette',
    'Tv',
    'Code',
    'ListChecks',
    'Workflow',
    'Languages',
    'Tag',
    'LayoutGrid',
    'Building2',
    'CircleHelp',
    'PhoneForwarded',
    'Users',
    'Router',
    'Handshake',
    'Newspaper',
    'Mail',
    'PhoneCall',
] as const;

/** Name eines lucide-Icons als Text (Teilmenge von string) */
export type NavIconName = (typeof NAV_ICON_NAMEN)[number];

export interface NavLink {
    titel: string;
    href: string;
    badge?: string;
    /** AUFTRAG-114: Icon vor dem Text (Name des lucide-Icons) */
    icon?: NavIconName;
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
            { titel: 'IT-Support', href: '/it-support', icon: 'Headset' },
            { titel: 'IT-Systeme & Netzwerke', href: '/it-netzwerke', icon: 'Server' },
            { titel: 'IT-Sicherheit', href: '/it-sicherheit', icon: 'ShieldCheck' },
            { titel: 'Microsoft 365', href: '/microsoft-365', icon: 'Cloud' },
            { titel: 'WLAN', href: '/wlan', icon: 'Wifi' },
            { titel: 'Videoüberwachung', href: '/videoueberwachung', icon: 'Video' },
        ],
    },
    {
        id: 'kommunikation-digital',
        titel: 'Kommunikation & Digital',
        links: [
            // Nachtrag AUFTRAG-113: «Telefonie & Kommunikation» (/telefonie) entfällt — nur eine Weiterleitung auf /cloud-telefonie
            { titel: 'Cloud-Telefonie', href: '/cloud-telefonie', icon: 'Phone' },
            { titel: 'KI-Telefonassistent', href: KI_BASIS, badge: NEU, icon: 'AudioLines' },
            { titel: 'Webdesign', href: '/webdesign', icon: 'Palette' },
            { titel: 'Digital Signage', href: '/digital-signage', icon: 'Tv' },
            { titel: 'KI & Software-Entwicklung', href: '/software-entwicklung', icon: 'Code' },
        ],
    },
];

/** Fusszeile des Dropdowns «Leistungen»: kein Icon links, Pfeil rechts wie bisher (AUFTRAG-114) */
export const LEISTUNGEN_UEBERSICHT: NavLink = { titel: 'Alle Leistungen im Überblick', href: '/leistungen' };

/** KI-Telefonassistent in zwei Spalten «Produkt» und «Mehr» */
export const KI_MENUE: NavGruppe[] = [
    {
        id: 'ki-produkt',
        titel: 'Produkt',
        links: [
            { titel: 'Übersicht und Live-Test', href: KI_BASIS, icon: 'AudioLines' },
            { titel: 'Funktionen', href: `${KI_BASIS}/funktionen`, icon: 'ListChecks' },
            { titel: 'So funktioniert es', href: `${KI_BASIS}/so-funktioniert-es`, icon: 'Workflow' },
            { titel: 'Schweizerdeutsch', href: `${KI_BASIS}/schweizerdeutsch`, icon: 'Languages' },
            { titel: 'Preise', href: `${KI_BASIS}/preise`, icon: 'Tag' },
        ],
    },
    {
        id: 'ki-mehr',
        titel: 'Mehr',
        links: [
            { titel: 'Anwendungen', href: `${KI_BASIS}/anwendungen`, icon: 'LayoutGrid' },
            { titel: 'Branchen', href: `${KI_BASIS}/branchen`, icon: 'Building2' },
            { titel: 'Sicherheit und Datenschutz', href: `${KI_BASIS}/sicherheit-datenschutz`, icon: 'ShieldCheck' },
            { titel: 'Häufige Fragen', href: `${KI_BASIS}/faq`, icon: 'CircleHelp' },
        ],
    },
];

/**
 * «KI-Anruf testen»: im Desktop-Dropdown als schmaler Knopf, im mobilen Menü als Karte.
 * AUFTRAG-114: Icon PhoneCall (wie die Knöpfe «Jetzt live testen» im KI-Bereich), nur am
 * schmalen Knopf; die mobile Karte zeigt weiter die Wellenform.
 */
export const KI_KARTE: { titel: string; text: string; aktion: string; href: string; icon: NavIconName } = {
    titel: 'KI-Anruf testen',
    text: 'Website eingeben, Ihr Assistent ruft Sie an.',
    aktion: 'Demo starten',
    href: KI_BASIS,
    icon: 'PhoneCall',
};

/** Cloud-Telefonie: eine Spalte wie live; der Leistenknopf selbst verlinkt die Übersicht */
export const CLOUD_TELEFONIE_HREF = '/cloud-telefonie';
/** AUFTRAG-114: Leistenknopf «Cloud-Telefonie» als Link — ein Leistenknopf wie IT_SUPPORT, daher ohne Icon */
export const CLOUD_TELEFONIE_LEISTE: NavLink = { titel: 'Cloud-Telefonie', href: CLOUD_TELEFONIE_HREF };
export const CLOUD_TELEFONIE: NavLink[] = [
    { titel: 'Cloud-Telefonie im Überblick', href: CLOUD_TELEFONIE_HREF, icon: 'Phone' },
    { titel: 'Peoplefone vPBX', href: '/cloud-telefonie#peoplefone', icon: 'Cloud' },
    { titel: '3CX', href: '/cloud-telefonie/3cx', icon: 'PhoneForwarded' },
    { titel: 'Microsoft Teams', href: '/cloud-telefonie/ms-teams', icon: 'Users' },
    { titel: 'Yeastar', href: '/cloud-telefonie/yeastar', icon: 'Router' },
];

export const UNTERNEHMEN: NavLink[] = [
    { titel: 'Über uns', href: '/unternehmen', icon: 'Building2' },
    { titel: 'Partner', href: '/partner', icon: 'Handshake' },
    { titel: 'Blog', href: '/blog', icon: 'Newspaper' },
    { titel: 'Kontakt', href: '/kontakt', icon: 'Mail' },
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
        { titel: KI_KARTE.titel, href: KI_KARTE.href, icon: KI_KARTE.icon },
        IT_SUPPORT,
        CLOUD_TELEFONIE_LEISTE,
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
