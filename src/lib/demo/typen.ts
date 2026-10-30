/**
 * Datentypen der KI-Telefonassistent-Demo (AUFTRAG-092).
 *
 * Auftrag und Profil sind WORTGLEICH zur Schnittstelle in AUFTRAG-091
 * (voip-agent, Orchestrator prüft streng per Pydantic) — keine Felder
 * umbenennen. Erweiterungen: `stimme` im Profil (AUFTRAG-095; der
 * Orchestrator ignoriert unbekannte Felder, AUFTRAG-094 wertet es aus) und
 * `personen` (AUFTRAG-102, optional; die Anlage ignoriert es bis zu einem
 * eigenen Auftrag, das Wissen trägt die Personen ohnehin).
 */

export type Sprache = 'dialekt_auto' | 'hochdeutsch' | 'englisch';

/** Reihenfolge der Sprachwahl (AUFTRAG-098): Deutsch · English · Schweizerdeutsch (in Erprobung). */
export const SPRACHEN: readonly Sprache[] = ['hochdeutsch', 'englisch', 'dialekt_auto'];

/** Vorgabe der Sprachwahl (AUFTRAG-098, Entscheid des Inhabers): Hochdeutsch. */
export const SPRACHE_VORGABE: Sprache = 'hochdeutsch';

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

/** AUFTRAG-102: Ansprechperson laut Website (nur Name, Rolle, Zuständigkeit — keine Kontaktdaten). */
export interface Person {
    name: string;
    rolle: string;
    /** ein Satz zur Zuständigkeit bzw. «Schwerpunkte: …» */
    zustaendigkeit?: string;
}

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
    /** AUFTRAG-102: Ansprechpersonen (höchstens 12, Leitung zuerst); optional (ältere Scans ohne Feld) */
    personen?: Person[];
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
    /**
     * AUFTRAG-103, Diagnose ohne Klartext (nur für die Anlage mit Bearer und im Function-Log, nie
     * öffentlich): Hash des Adress-Schlüssels (IPv6: /64-Präfix, IPv4: volle Adresse), Adressart,
     * Hash der Gerätekennung (Cookie `demo_geraet`). Fehlt bei älteren Aufträgen.
     */
    ip_hash?: string | null;
    ip_art?: IpArt | null;
    geraet_hash?: string | null;
    /**
     * AUFTRAG-109: bestätigter Handelsregister-Eintrag (öffentliche Registerdaten). Fehlt bei
     * älteren Aufträgen und bei abgeschalteter Prüfung (DEMO_HANDELSREGISTER=aus, nur lokal).
     */
    handelsregister?: HandelsregisterAuftrag | null;
}

/** AUFTRAG-109: Handelsregister-Eintrag im Auftrag (vom Besucher bestätigt, Nachweis serverseitig geprüft). */
export interface HandelsregisterAuftrag {
    /** «CHE107160757» */
    uid: string;
    /** «CHE-107.160.757» */
    uid_formatiert: string;
    /** Firmenname laut Register */
    name: string;
    /** Rechtssitz laut Register */
    sitz: string;
    /** Status laut Register (z. B. EXISTIEREND) */
    status: string;
    /** Weg zum Treffer: UID aus dem Impressum, Namenssuche oder manuelle Eingabe */
    quelle: 'uid' | 'name' | 'manuell';
    /** Zeitpunkt der Register-Abfrage (ISO, Zürich) */
    geprueft_am: string;
}

/** AUFTRAG-103: Art der Client-Adresse («unbekannt» nur ohne gültige Adresse, z. B. lokal ohne Kopf). */
export type IpArt = 'v4' | 'v6' | 'unbekannt';

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
    /** AUFTRAG-102: Startseite, Unterseite oder Team-Unterseite (Person) */
    art?: 'start' | 'unterseite' | 'team';
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
    /** AUFTRAG-096: externe Sprite-Verweise (<use href="datei.svg#id">), nur während des Scans */
    sprite?: Array<{ url: string; id: string }>;
    /** AUFTRAG-096: Vorfahren-Kette im DOM (Logo → html), nur während des Scans */
    ahnen?: Array<{ tag: string; id?: string; klassen?: string[]; stil?: string; attr?: Record<string, string> }>;
    /** AUFTRAG-096: CSS-Selektor des Logos (CSS-Hintergrund), nur während des Scans */
    selektor?: string;
    /** AUFTRAG-096: Hintergrund der Logo-Umgebung auf der Website (#RRGGBB) oder null (unbekannt/Bild) */
    umgebung?: string | null;
    /** AUFTRAG-096: Element, das den Hintergrund trägt (Messung) */
    umgebung_quelle?: string;
    /** AUFTRAG-096: Inline-SVG ohne eigene Farbe (currentColor/ohne Füllung) — die Website färbt es */
    ohneEigeneFarbe?: boolean;
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
    firma_quelle: 'jsonld' | 'og:site_name' | 'titel' | 'text' | 'host';
    logo_kandidaten: LogoKandidat[];
    /** Bestes gültiges Logo (AUFTRAG-095) oder null */
    logo: LogoKandidat | null;
    theme_color: string | null;
    css_farben: string[];
    button_farben: string[];
    farben: Farben | null;
    /** AUFTRAG-096: Quelle der Markenfarbe (css-variable, hintergrund, theme-color, manifest, haeufigkeit, button, logo) */
    farbe_quelle: string | null;
    /** AUFTRAG-096: gewichtete Farbsignale (ohne Logo-Farbe aus dem Browser) — die Karte ergänzt die Logo-Farbe */
    farb_signale: Array<{ farbe: string; gewicht: number; quelle: string }>;
    telefone: string[];
    emails: string[];
    adressen: string[];
    oeffnungszeiten: string[];
    ueberschriften: string[];
    navigation: string[];
    abschnitte: Abschnitt[];
    text: string;
    /** AUFTRAG-102: Personen (zusammengeführt, höchstens 12, Leitung zuerst) */
    personen: Person[];
    /** AUFTRAG-102: Anzahl geladener Team-Unterseiten (höchstens 6) */
    team_seiten: number;
    /** AUFTRAG-102: ausgewählte Team-Seiten, für die das Scan-Budget nicht reichte (Profil-Schritt lädt sie nach) */
    team_offen?: Array<{ url: string; name: string | null; slugName: string; rolle: string | null; reihenfolge: number }>;
    plattform: string | null;
    hinweise: string[];
    /**
     * AUFTRAG-109: UIDs mit gültiger Prüfziffer aus allen gelesenen Seiten (Impressum,
     * Fusszeile, JSON-LD), höchstens 3; fehlt bei älteren Scans.
     */
    uid_kandidaten?: string[];
    /** AUFTRAG-109: Firmenname mit Rechtsform aus dem Text, passend zum Host (z. B. «Muster Holz AG») */
    firma_register?: string | null;
    /**
     * AUFTRAG-111: normalisierte Textbasis für Regel 3 der Bindung Website ↔ Handelsregister —
     * Nachtrag: nur Titel der Startseite, Text der Impressum-Seite(n) und Fusszeile (Näherung: letzte
     * 2000 Zeichen des Startseiten-Textes); drei Abschnitte, getrennt durch « | » (lib/demo/bindung.ts),
     * höchstens 200 000 Zeichen; fehlt bei älteren Scans. Geht nie an die KI und nie an den Browser.
     */
    bindung_text?: string;
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
    /**
     * AUFTRAG-098: Fähigkeiten auf Englisch (Karte bei «English»), erst bei Bedarf
     * übersetzt (POST /api/demo/faehigkeiten) und zu den deutschen Fähigkeiten `de` gespeichert.
     */
    karte_en?: { de: string[]; en: string[]; quelle: 'standard' | 'ki' | 'rueckfall' };
    /** AUFTRAG-098: Anzahl KI-Übersetzungsversuche (höchstens 2 je Scan) */
    en_versuche?: number;
}
