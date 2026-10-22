/**
 * Datentypen der KI-Telefonassistent-Demo (AUFTRAG-092).
 *
 * Auftrag und Profil sind WORTGLEICH zur Schnittstelle in AUFTRAG-091
 * (voip-agent, Orchestrator prüft streng per Pydantic) — keine Felder
 * umbenennen. Einzige Erweiterung: `stimme` im Profil (AUFTRAG-095; der
 * Orchestrator ignoriert unbekannte Felder, AUFTRAG-094 wertet es aus).
 */

export type Sprache = 'dialekt_auto' | 'hochdeutsch' | 'englisch';

export const SPRACHEN: readonly Sprache[] = ['dialekt_auto', 'hochdeutsch', 'englisch'];

export type AuftragStatus = 'wartend' | 'angenommen' | 'waehlt' | 'verbunden' | 'beendet' | 'fehler';

export const AUFTRAG_STATUS: readonly AuftragStatus[] = [
    'wartend',
    'angenommen',
    'waehlt',
    'verbunden',
    'beendet',
    'fehler',
];

export interface WissenEintrag {
    frage: string;
    antwort: string;
    thema: string;
}

/** Stimme des Assistenten (AUFTRAG-095/094): passt zum Vornamen. */
export type Stimme = 'weiblich' | 'maennlich';

export interface Farben {
    primaer: string;
    sekundaer: string;
}

/** Profil exakt wie AUFTRAG-091 (Schnittstelle zum Orchestrator). */
export interface Profil {
    firma: string;
    website: string;
    assistent_name: string;
    branche: string;
    telefon: string | null;
    email: string | null;
    adresse: string | null;
    oeffnungszeiten_text: string | null;
    firma_text: string;
    faehigkeiten: string[];
    wissen: WissenEintrag[];
    logo_url: string | null;
    farben: Farben | null;
    /** AUFTRAG-095: Stimme passend zum Vornamen (Orchestrator A-094). */
    stimme: Stimme;
}

/** Auftrag, wie ihn der Orchestrator aus der Warteschlange erhält. */
export interface AuftragFuerOrchestrator {
    id: string;
    erstellt: string;
    nummer: string;
    sprache: Sprache;
    profil: Profil;
}

/** Gespeicherter Auftrag (Blob `auftrag/{id}`). */
export interface AuftragGespeichert {
    id: string;
    scan_id: string;
    erstellt: string;
    /** E.164; wird nach Abschluss (beendet/fehler) entfernt. */
    nummer: string | null;
    sprache: Sprache;
    /** Kopie des Scan-Profils; wird nach Abschluss bzw. spätestens zum Scan-Ablauf (2 h) entfernt. */
    profil: Profil | null;
    /** Epoch-ms: Ablauf des zugehörigen Scans (Profil höchstens bis dahin). */
    profil_bis: number;
    status: AuftragStatus;
    zeit: string;
    dauer_s: number | null;
    zusammenfassung: string | null;
    grund: string | null;
    /** Epoch-ms, danach gilt der Auftrag als gelöscht (24 h). */
    ablauf: number;
    /** Epoch-ms der Erstellung (Sortierung/Warte-Frist). */
    erstellt_ms: number;
}

export type ProfilQuelle = 'ki' | 'regeln';

export type SchrittSchluessel =
    | 'website'
    | 'unternehmen'
    | 'kontakt'
    | 'oeffnungszeiten'
    | 'leistungen'
    | 'branding'
    | 'wissen'
    | 'assistent';

export interface Schritt {
    schluessel: SchrittSchluessel;
    ok: boolean;
    /** Messwert für Protokoll/Prüfskript (nicht für die Oberfläche). */
    detail?: string;
    ms?: number;
}

export interface SeitenProtokoll {
    url: string;
    status: number | null;
    bytes: number;
    ms: number;
    fehler?: string;
}

export type LogoQuelle =
    | 'jsonld'
    | 'header-img'
    | 'home-link-img'
    | 'img'
    | 'inline-svg'
    | 'data-uri'
    | 'css'
    | 'apple-touch-icon'
    | 'icon'
    | 'favicon.ico'
    | 'og:image';

export interface LogoKandidat {
    /** http(s)-Adresse des Bildes; null bei Inline-SVG/data:-URI (Inhalt in `inhalt`). */
    url: string | null;
    quelle: LogoQuelle;
    /** 1 = sicher das Logo (Kopf, Startseiten-Link, Logo-Selektor, JSON-LD), 2 = wahrscheinlich, 3 = Icon, 4 = og:image */
    stufe: 1 | 2 | 3 | 4;
    /** Merkmalspunkte innerhalb der Stufe */
    punkte: number;
    /** Reihenfolge im Dokument */
    reihenfolge: number;
    /** Bereinigtes SVG (Inline) bzw. data:-URI (nur serverseitig gespeichert) */
    inhalt?: string;
    /** Dateiname/Merkmale deuten auf helle Variante (negativ/white/inverse) */
    hellName?: boolean;
    /** Ausdrückliches Logo-Merkmal (logo/brand in Klasse, Datei, Selektor; JSON-LD logo) */
    logoWort?: boolean;
    /** Ersatz-URL, falls `url` eine vergrösserte CDN-Variante ist */
    url_original?: string;
    // Ergebnis der Prüfung (scanner.ts)
    geprueft?: boolean;
    gueltig?: boolean;
    grund?: string;
    format?: 'svg' | 'png' | 'webp' | 'avif' | 'jpeg' | 'gif' | 'ico' | 'bmp';
    breite?: number | null;
    hoehe?: number | null;
    transparenz?: boolean | null;
    hell?: boolean | null;
    helligkeit?: number | null;
    farbe?: string | null;
    foto?: boolean;
    bytes?: number;
    ms?: number;
}

export interface Abschnitt {
    titel: string;
    text: string;
}

/** Rohdaten des Scanners (Eingabe für das KI-Profil). */
export interface Extrakt {
    start_url: string;
    end_url: string;
    host: string;
    sprache: string | null;
    seiten: SeitenProtokoll[];
    titel: string | null;
    meta_description: string | null;
    og_site_name: string | null;
    og_image: string | null;
    jsonld_name: string | null;
    jsonld_beschreibung: string | null;
    firma: string | null;
    firma_quelle: 'jsonld' | 'og:site_name' | 'titel' | 'host';
    logo_kandidaten: LogoKandidat[];
    /** Bestes gültiges Logo (AUFTRAG-095) oder null */
    logo: LogoKandidat | null;
    theme_color: string | null;
    css_farben: string[];
    button_farben: string[];
    farben: Farben | null;
    telefone: string[];
    emails: string[];
    adressen: string[];
    oeffnungszeiten: string[];
    ueberschriften: string[];
    navigation: string[];
    abschnitte: Abschnitt[];
    text: string;
    plattform: string | null;
    hinweise: string[];
}

/** Gespeicherter Scan (Blob `scan/{id}`, lebt 2 h). */
export interface ScanGespeichert {
    id: string;
    erstellt: string;
    ablauf: number;
    extrakt: Extrakt;
    profil: Profil;
    profil_quelle: ProfilQuelle;
    assistent_weiblich: boolean;
    schritte: Schritt[];
    dauer_ms: number;
    profil_ms: number | null;
}
