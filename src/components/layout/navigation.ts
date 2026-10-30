/**
 * Navigation der Website (AUFTRAG-100): Mega-Menü «Leistungen» und «Für wen»,
 * einfaches Dropdown «Unternehmen», Direktlinks «IT-Support» und
 * «Cloud-Telefonie» (tragen den meisten Suchverkehr).
 *
 * Regeln: nur bestehende Seiten, keine neuen Routen, Texte kurz, ohne
 * Superlative und ohne Zahlen. Jede Branche verlinkt eine Seite bzw. einen
 * bestehenden Abschnitt, der diese Branche tatsächlich behandelt:
 * - Praxen, Handwerk & Elektro, Garagen → /ki-telefonassistent «Für welche Betriebe»
 * - Treuhand & Beratung, mehrere Standorte → /cloud-telefonie/3cx «Anwendungsfälle»
 * - Gastronomie & Retail → /digital-signage «Für wen ist Digital Signage?»
 * Die Regionsseiten kommen aus den `[region]`-Templates (siehe lib/nav-regionen.ts).
 */
import type { LucideIcon } from 'lucide-react';
import {
    AudioLines,
    BookOpen,
    Briefcase,
    Building2,
    CalendarCheck,
    Car,
    Cctv,
    ClipboardList,
    Cloud,
    CodeXml,
    Handshake,
    Hammer,
    Headset,
    HelpCircle,
    Info,
    Languages,
    LayoutGrid,
    ListChecks,
    Mail,
    MapPinned,
    MessageSquareText,
    MessagesSquare,
    MonitorPlay,
    MonitorSmartphone,
    Network,
    Newspaper,
    PhoneCall,
    PhoneIncoming,
    Route,
    Router,
    Scale,
    ShieldCheck,
    Siren,
    Stethoscope,
    Tag,
    UtensilsCrossed,
    Wifi,
    Wrench,
    Zap,
} from 'lucide-react';
import { KI_BASIS, KI_GRUPPEN_TITEL, KI_SEITEN } from '@/components/ki-telefonassistent/seiten';

export interface NavLink {
    titel: string;
    href: string;
    /** ein Satz, was es ist (nur im Mega-Panel) */
    text?: string;
    icon?: LucideIcon;
    badge?: string;
}

export interface NavGruppe {
    id: string;
    titel: string;
    links: NavLink[];
}

export type PanelId = 'leistungen' | 'ki' | 'fuer-wen' | 'unternehmen';

/** Leistungen in drei Spalten */
export const LEISTUNGEN: NavGruppe[] = [
    {
        id: 'it-betrieb',
        titel: 'IT-Betrieb',
        links: [
            { titel: 'IT-Support', href: '/it-support', text: 'Hilfe per Fernwartung und vor Ort.', icon: Headset },
            { titel: 'IT-Systeme & Netzwerke', href: '/it-netzwerke', text: 'Server, Netzwerk, Virtualisierung.', icon: Network },
            { titel: 'IT-Sicherheit', href: '/it-sicherheit', text: 'Firewall, Endpoint-Schutz, Backups.', icon: ShieldCheck },
            { titel: 'Microsoft 365', href: '/microsoft-365', text: 'Migration, Lizenzen und Betrieb.', icon: LayoutGrid },
            { titel: 'WLAN', href: '/wlan', text: 'Ausleuchtung, Montage und Betrieb.', icon: Wifi },
            { titel: 'Videoüberwachung', href: '/videoueberwachung', text: 'Kameras und Aufzeichnung für KMU.', icon: Cctv },
        ],
    },
    {
        id: 'kommunikation',
        titel: 'Kommunikation',
        links: [
            { titel: 'Cloud-Telefonie', href: '/cloud-telefonie', text: 'Telefonanlage aus der Cloud.', icon: Cloud },
            { titel: '3CX', href: '/cloud-telefonie/3cx', text: 'In der Cloud oder im eigenen Netz.', icon: PhoneCall },
            { titel: 'Microsoft Teams', href: '/cloud-telefonie/ms-teams', text: 'Telefonieren direkt in Teams.', icon: MessagesSquare },
            { titel: 'Yeastar', href: '/cloud-telefonie/yeastar', text: 'IP-Telefonanlage und Mitel-Wechsel.', icon: Router },
            { titel: 'KI-Telefonassistent', href: '/ki-telefonassistent', text: 'Nimmt ab, wenn niemand frei ist.', icon: AudioLines, badge: 'Neu' },
        ],
    },
    {
        id: 'digital',
        titel: 'Digital',
        links: [
            { titel: 'Webdesign', href: '/webdesign', text: 'Websites mit offenen Preisen.', icon: MonitorSmartphone },
            { titel: 'Digital Signage', href: '/digital-signage', text: 'Infoscreens ohne Abo-Kosten.', icon: MonitorPlay },
            { titel: 'KI & Software-Entwicklung', href: '/software-entwicklung', text: 'KI-Einsatz und Software nach Mass.', icon: CodeXml },
        ],
    },
];

export const LEISTUNGEN_UEBERSICHT: NavLink = { titel: 'Alle Leistungen im Überblick', href: '/leistungen' };

/** Die einzige Hervorhebung im Menü */
export const KI_KARTE = {
    titel: 'KI-Anruf testen',
    text: 'Website eingeben, Ihr Assistent ruft Sie an.',
    aktion: 'Demo starten',
    href: '/ki-telefonassistent',
} as const;

export const ERSTGESPRAECH: NavLink = { titel: 'Kostenloses Erstgespräch', href: '/kontakt' };

/* ------------------------------------------------------------------ */
/* KI-Telefonassistent (AUFTRAG-110): eigenes Mega-Panel mit Unterseiten */
/* ------------------------------------------------------------------ */

const KI_ICONS: Record<string, LucideIcon> = {
    [KI_BASIS]: AudioLines,
    [`${KI_BASIS}/funktionen`]: ListChecks,
    [`${KI_BASIS}/so-funktioniert-es`]: Route,
    [`${KI_BASIS}/schweizerdeutsch`]: Languages,
    [`${KI_BASIS}/preise`]: Tag,
    [`${KI_BASIS}/anwendungen`]: LayoutGrid,
    [`${KI_BASIS}/anwendungen/erreichbarkeit`]: PhoneIncoming,
    [`${KI_BASIS}/anwendungen/auskunft`]: MessageSquareText,
    [`${KI_BASIS}/anwendungen/anliegen-erfassen`]: ClipboardList,
    [`${KI_BASIS}/anwendungen/terminbuchung`]: CalendarCheck,
    [`${KI_BASIS}/anwendungen/notfall`]: Siren,
    [`${KI_BASIS}/branchen`]: Building2,
    [`${KI_BASIS}/branchen/elektriker`]: Zap,
    [`${KI_BASIS}/branchen/sanitaer-heizung`]: Wrench,
    [`${KI_BASIS}/branchen/arztpraxis`]: Stethoscope,
    [`${KI_BASIS}/branchen/treuhand`]: Briefcase,
    [`${KI_BASIS}/branchen/immobilien`]: Building2,
    [`${KI_BASIS}/branchen/garage`]: Car,
    [`${KI_BASIS}/sicherheit-datenschutz`]: ShieldCheck,
    [`${KI_BASIS}/faq`]: HelpCircle,
    [`${KI_BASIS}/vergleich`]: Scale,
    [`${KI_BASIS}/glossar`]: BookOpen,
};

/** Übersichtsseiten («Alle …») stehen in ihrer Gruppe zuletzt */
const istUebersicht = (titel: string) => titel.startsWith('Alle ');

/** Vier Spalten: Produkt, Anwendungen, Branchen, Wissen und Vertrauen */
export const KI_BEREICH: NavGruppe[] = (['produkt', 'anwendungen', 'branchen', 'vertrauen'] as const).map((g) => ({
    id: `ki-${g}`,
    titel: KI_GRUPPEN_TITEL[g],
    links: KI_SEITEN.filter((s) => s.gruppe === g)
        .sort((a, b) => Number(istUebersicht(a.titel)) - Number(istUebersicht(b.titel)))
        .map((s) => ({ titel: s.titel, href: s.pfad, text: s.kurz, icon: KI_ICONS[s.pfad] })),
}));

export const KI_UEBERSICHT: NavLink = { titel: 'KI-Telefonassistent im Überblick', href: KI_BASIS };

/** Branchen: Links auf bestehende Abschnitte, die die Branche behandeln */
export const BRANCHEN: NavLink[] = [
    { titel: 'Praxen', href: '/ki-telefonassistent#betriebe', text: 'Terminwünsche am Telefon annehmen.', icon: Stethoscope },
    { titel: 'Handwerk & Elektro', href: '/ki-telefonassistent#betriebe', text: 'Aufträge annehmen, auch unterwegs.', icon: Hammer },
    { titel: 'Treuhand & Beratung', href: '/cloud-telefonie/3cx#anwendungsfaelle', text: '3CX mit Microsoft Teams und Outlook.', icon: Briefcase },
    { titel: 'Gastronomie & Retail', href: '/digital-signage#branchen', text: 'Digitale Menüboards und Angebote.', icon: UtensilsCrossed },
    { titel: 'Garagen', href: '/ki-telefonassistent#betriebe', text: 'Servicetermine und Reifenwechsel.', icon: Car },
    { titel: 'KMU mit mehreren Standorten', href: '/cloud-telefonie/3cx#anwendungsfaelle', text: 'Alle Standorte in einer Anlage.', icon: MapPinned },
];

export const UNTERNEHMEN: NavLink[] = [
    { titel: 'Über uns', href: '/unternehmen', icon: Info },
    { titel: 'Partner', href: '/partner', icon: Handshake },
    { titel: 'Blog', href: '/blog', icon: Newspaper },
    { titel: 'Kontakt', href: '/kontakt', icon: Mail },
];

/** Direktlinks in der Leiste */
export const DIREKTLINKS: NavLink[] = [
    { titel: 'IT-Support', href: '/it-support' },
    { titel: 'Cloud-Telefonie', href: '/cloud-telefonie' },
];

/* ------------------------------------------------------------------ */
/* Regionen (Daten liefert der Server aus den [region]-Templates)      */
/* ------------------------------------------------------------------ */

export interface Region {
    name: string;
    slug: string;
}

export interface NavRegionen {
    itSupport: Region[];
    cloudTelefonie: Region[];
    webdesign: Region[];
}

export const REGION_GRUPPEN: ReadonlyArray<{ schluessel: keyof NavRegionen; titel: string; basis: string }> = [
    { schluessel: 'itSupport', titel: 'IT-Support', basis: '/it-support' },
    { schluessel: 'cloudTelefonie', titel: 'Cloud-Telefonie', basis: '/cloud-telefonie' },
    { schluessel: 'webdesign', titel: 'Webdesign', basis: '/webdesign' },
];

export const KEINE_REGIONEN: NavRegionen = { itSupport: [], cloudTelefonie: [], webdesign: [] };

/** Pfad ohne Anker, für den Vergleich mit der aktuellen Route */
export function pfadVon(href: string): string {
    const i = href.indexOf('#');
    return i < 0 ? href : href.slice(0, i);
}

/** Welche Gruppe gehört zur aktuellen Route (für die Hervorhebung in der Leiste)? */
export function aktivePanelId(pfad: string, regionen: NavRegionen): PanelId | 'direkt' | null {
    if (DIREKTLINKS.some((l) => l.href === pfad)) return 'direkt';
    // AUFTRAG-110: der ganze Bereich /ki-telefonassistent gehört zum eigenen Panel
    if (pfad === KI_BASIS || pfad.startsWith(`${KI_BASIS}/`)) return 'ki';
    const inRegion = REGION_GRUPPEN.some((g) => regionen[g.schluessel].some((r) => `${g.basis}/${r.slug}` === pfad));
    if (inRegion) return 'fuer-wen';
    if (pfad === LEISTUNGEN_UEBERSICHT.href || LEISTUNGEN.some((g) => g.links.some((l) => pfadVon(l.href) === pfad))) return 'leistungen';
    if (UNTERNEHMEN.some((l) => l.href === pfad)) return 'unternehmen';
    return null;
}
