/**
 * Direkte Anfrage «Assistent anfragen» (AUFTRAG-114, P5).
 *
 * [31.10.2026] AUFTRAG-114: Bisher führte der Weg zum Produkt nur NACH dem Testanruf über
 * «So bekommt Ihre Firma diesen Assistenten» auf /kontakt. Neu: Formular auf /ki-telefonassistent
 * und /ki-telefonassistent/preise (Section #anfrage), ohne vorherigen Test.
 * Texte wortgleich aus dem Auftrag. Reines TypeScript ohne Imports (auch für die Node-Prüfskripte).
 */

/** Anker der Section; `#anfrage-<paketid>` wählt das Paket vor */
export const ANFRAGE_ID = 'anfrage';

/** Pfad der Hub-Seite mit Formular (für Knöpfe auf Seiten ohne eigenes Formular) */
export const ANFRAGE_HREF = '/ki-telefonassistent#anfrage';

export const ANFRAGE_TEXTE = {
    ueberzeile: 'Anfrage',
    titel: 'Assistent anfragen',
    lead: 'Sagen Sie uns, für welchen Betrieb und welches Paket. Wir richten den Assistenten mit Ihnen ein und melden uns persönlich.',
    knopf: 'Anfrage senden',
    /** «Datenschutzerklärung» darin verlinkt auf /datenschutz#formulare */
    einwilligung: 'Mit dem Senden stimmen Sie der Bearbeitung Ihrer Angaben gemäss Datenschutzerklärung zu.',
    einwilligungLinkwort: 'Datenschutzerklärung',
    einwilligungLink: '/datenschutz#formulare',
    erfolg: 'Danke, Ihre Anfrage ist bei uns. Wir melden uns persönlich bei Ihnen.',
    fehler: 'Das Senden hat nicht geklappt. Wir leiten Sie auf das Kontaktformular weiter.',
    /** Knopf «Assistent anfragen» (Hero-Baustein und Abschluss-CTA, Text wie der Titel) */
    cta: 'Assistent anfragen',
    /** Paketkarten auf /preise */
    paketKnopf: 'Anfragen',
} as const;

/** Beschriftungen der Felder (* = Pflicht) */
export const ANFRAGE_FELDER = {
    name: 'Name',
    firma: 'Firma',
    email: 'E-Mail',
    telefon: 'Telefon',
    paket: 'Paket',
    website: 'Website der Firma',
    nachricht: 'Nachricht',
    optional: '(optional)',
} as const;

/** Auswahl «Paket» (Reihenfolge und Texte wortgleich), Vorgabe «Starter» */
export const ANFRAGE_PAKETE = ['Lite', 'Starter', 'Business', 'Enterprise', 'Noch unsicher'] as const;
export type AnfragePaket = (typeof ANFRAGE_PAKETE)[number];
export const ANFRAGE_PAKET_VORGABE: AnfragePaket = 'Starter';

/** Paket-IDs aus src/lib/ki-telefonassistent-preise.ts → Eintrag der Auswahl */
export const ANFRAGE_PAKET_NACH_ID: Record<string, AnfragePaket> = {
    lite: 'Lite',
    starter: 'Starter',
    business: 'Business',
    enterprise: 'Enterprise',
};

/** Betreff im Netlify-Formular «contact» (Option in public/__forms.html) und auf /kontakt */
export const ANFRAGE_BETREFF = 'KI-Telefonassistent';

/** sessionStorage: Firma aus dem Testanruf (KiDemo), wird nach dem Lesen gelöscht */
export const ANFRAGE_FIRMA_SCHLUESSEL = 'ki-anfrage-firma';

/** Wartezeit bis zur Weiterleitung auf /kontakt im Fehlerfall */
export const ANFRAGE_WEITERLEITUNG_MS = 1500;

/** `#anfrage-starter` → «Starter»; sonst null */
export function paketAusHash(hash: string): AnfragePaket | null {
    const m = /^#anfrage-([a-z]+)$/.exec(hash);
    return m ? (ANFRAGE_PAKET_NACH_ID[m[1]] ?? null) : null;
}

/** Feld «message» für Netlify: «Paket: … / Website: … / Nachricht: …» */
export function anfrageNachricht(paket: string, website: string, nachricht: string): string {
    const leer = 'keine Angabe';
    return `Paket: ${paket} / Website: ${website.trim() || leer} / Nachricht: ${nachricht.trim() || leer}`;
}

/**
 * Fehlerpfad: vorbefülltes /kontakt (Betreff «KI-Telefonassistent»). In die Adresse kommen nur
 * Firma, Paket, Website und Nachricht — Name, E-Mail und Telefon bewusst NICHT (keine
 * Kontaktdaten in Adresszeile, Verlauf und Server-Protokollen); die fragt /kontakt ohnehin ab.
 */
export function anfrageKontaktHref(firma: string, paket: string, website: string, nachricht: string): string {
    const params = new URLSearchParams();
    params.set('subject', ANFRAGE_BETREFF);
    params.set('message', `Anfrage KI-Telefonassistent / Firma: ${firma.trim() || 'keine Angabe'} / ${anfrageNachricht(paket, website, nachricht)}`);
    return `/kontakt?${params.toString()}`;
}
