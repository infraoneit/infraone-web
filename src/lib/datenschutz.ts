/**
 * Datenschutzerklärung (AUFTRAG-114, Abschnitt 3 — Texte wortgleich).
 *
 * [31.10.2026] AUFTRAG-114: Der Inhaber will die Erklärung «transparent und vollständig wie bei
 * CleverAI und Ciao Sepp». Welche KI-Anbieter wir einsetzen, steht NUR hier (Seite /datenschutz),
 * sonst nirgends auf der Website. Reines TypeScript ohne Imports, damit das Prüfskript
 * scripts/auftrag114-einheit-test.mjs die Texte direkt mit dem Auftrag vergleichen kann.
 */

export const DS_META = {
    titel: 'Datenschutzerklärung | InfraOne IT Solutions',
    beschreibung:
        'Transparent: Was mit Ihren Daten auf infraone.ch und beim KI-Telefonassistenten passiert – Hosting, KI-Anbieter, Testanruf, Speicherdauer, Ihre Rechte.',
} as const;

export const DS_TITEL = 'Datenschutzerklärung';

export const DS_EINLEITUNG =
    'Wir zeigen hier offen, was mit Ihren Daten passiert – auf dieser Website, beim Testanruf und beim KI-Telefonassistenten als Dienst für unsere Kunden. Fragen beantworten wir unter info@infraone.ch.';

/** Absatz (p) oder Zwischentitel (h3) */
export type DsBlock = { art: 'p'; text: string } | { art: 'h3'; text: string } | { art: 'tabelle' };

export interface DsAbschnitt {
    /** Anker (h2 id) */
    id: string;
    titel: string;
    bloecke: DsBlock[];
}

const p = (text: string): DsBlock => ({ art: 'p', text });
const h3 = (text: string): DsBlock => ({ art: 'h3', text });

/** Spalten der Dienstleister-Tabelle (Ziffer 7) */
export const DS_DIENSTLEISTER_SPALTEN = ['Dienstleister', 'Zweck', 'Verarbeitungsort', 'Hinweis'] as const;

/** Zeilen der Dienstleister-Tabelle (Ziffer 7) */
export const DS_DIENSTLEISTER: ReadonlyArray<readonly [string, string, string, string]> = [
    ['Infomaniak Network SA, Genf', 'Server des KI-Telefonassistenten', 'Schweiz', 'Rechenzentren in der Schweiz'],
    ['peoplefone AG, Zürich', 'Telefonie und SMS des KI-Telefonassistenten', 'Schweiz', 'Gesprächsvermittlung, SMS-Versand'],
    ['Google LLC', 'Sprachmodell Gemini: Hören und Sprechen im Gespräch', 'USA und EU', 'bezahlte Stufe, kein Training mit Ihren Daten, Standardvertragsklauseln'],
    ['OpenAI, L.L.C.', 'Textmodell: Website-Profil und Gesprächszusammenfassung', 'USA', 'bezahlte Schnittstelle, kein Training mit Ihren Daten'],
    ['Microsoft Ireland Operations Ltd.', 'E-Mail-Postfächer und Kalender (Microsoft 365)', 'EU', 'Postfächer info@ und assistant@infraone.ch'],
    ['Netlify, Inc.', 'Hosting der Website, Formulare', 'USA, Auslieferung weltweit', 'Standardvertragsklauseln'],
    ['Cloudflare, Inc.', 'Reichweitenmessung ohne Cookies; Inhaltsfilter-DNS beim Testanruf', 'USA und EU', 'beim Filter nur der Hostname'],
    ['Zefix, Bundesamt für Justiz', 'Abgleich des Firmennamens beim Testanruf', 'Schweiz', 'öffentliches Register'],
];

export const DS_ABSCHNITTE: DsAbschnitt[] = [
    {
        id: 'verantwortliche-stelle',
        titel: '1. Verantwortliche Stelle',
        bloecke: [p('InfraOne IT Solutions GmbH, Rudolf-Diesel-Strasse 25, 8404 Winterthur, Schweiz. E-Mail: info@infraone.ch.')],
    },
    {
        id: 'grundsaetze',
        titel: '2. Grundsätze',
        bloecke: [
            p(
                'Wir bearbeiten Personendaten nach dem Schweizer Datenschutzgesetz (DSG) und, soweit anwendbar, nach der europäischen Datenschutz-Grundverordnung (DSGVO). Wir erheben nur, was wir für den jeweiligen Zweck brauchen. Wir verkaufen keine Daten und geben sie nicht für Werbung Dritter weiter. Wo wir Dienstleister einsetzen, arbeiten diese in unserem Auftrag und nach unseren Weisungen; die Liste steht in Ziffer 7.',
            ),
        ],
    },
    {
        id: 'website',
        titel: '3. Website-Betrieb',
        bloecke: [
            p(
                'Diese Website wird bei Netlify, Inc. (USA) gehostet und über ein weltweites Netz von Servern ausgeliefert. Beim Aufruf entstehen technische Protokolle mit IP-Adresse, Zeitpunkt, aufgerufener Seite und Browserkennung. Sie dienen der Sicherheit und der Fehlersuche und werden nicht mit anderen Daten verknüpft. Netlify ist vertraglich auf den Schutz dieser Daten verpflichtet (Standardvertragsklauseln).',
            ),
            p('Die Schriften liefern wir aus unserem eigenen Hosting aus; es findet kein Abruf bei Google Fonts statt.'),
            p(
                'Zur Reichweitenmessung nutzen wir Cloudflare Web Analytics (Cloudflare, Inc.). Es setzt keine Cookies und bildet keine Kennung einzelner Personen; wir sehen nur Seitenaufrufe, Herkunftsland und Gerätetyp als Summen. Wir verwenden kein Google Analytics, keinen Facebook-Pixel und keine Werbe-Tracker.',
            ),
        ],
    },
    {
        id: 'formulare',
        titel: '4. Kontaktformular, Kostenrechner und Anfrage KI-Telefonassistent',
        bloecke: [
            p(
                'Unsere Formulare laufen über Netlify Forms. Ihre Angaben (Name, Firma, E-Mail, Telefon, Betreff, Nachricht; bei der Anfrage zum KI-Telefonassistenten zusätzlich Paket und Website) werden uns an info@infraone.ch zugestellt und in unserem Postfach bei Microsoft 365 bearbeitet. Zweck ist die Beantwortung Ihrer Anfrage, eine Offerte oder die Vorbereitung eines Vertrags. Wir bewahren Anfragen auf, bis sie erledigt sind; kommt ein Vertrag zustande, gelten die gesetzlichen Aufbewahrungspflichten für Geschäftsunterlagen (zehn Jahre).',
            ),
        ],
    },
    {
        id: 'testanruf-ki-telefonassistent',
        titel: '5. Testanruf KI-Telefonassistent',
        bloecke: [
            p('Auf der Seite «KI-Telefonassistent» können Sie Ihren eigenen Assistenten testen. Das passiert dabei, Schritt für Schritt:'),
            h3('Website-Prüfung'),
            p(
                'Die eingegebene Adresse prüfen wir zuerst gegen eine Sperrliste und per DNS-Abfrage beim Inhaltsfilter von Cloudflare; dabei wird nur der Hostname übermittelt. Danach rufen unsere Systeme die öffentlich erreichbaren Seiten der Website ab (Startseite, Impressum) und gleichen den Firmennamen mit dem Zentralen Firmenindex des Bundes (Zefix) ab. Der Testanruf steht nur für im Handelsregister eingetragene Firmen offen und richtet sich an deren Inhaber oder Mitarbeitende.',
            ),
            h3('Profil'),
            p(
                'Aus den öffentlichen Texten der Website erstellt ein Textmodell von OpenAI ein Kurzprofil: Firmenname, Leistungen, Öffnungszeiten, Kontaktangaben, Logo und Farben. Wir nutzen die bezahlte Schnittstelle; OpenAI verwendet diese Daten nicht zum Training. Das Profil speichern wir höchstens zwei Stunden, die Handelsregister-Bestätigung höchstens dreissig Minuten, dann werden sie gelöscht.',
            ),
            h3('Anruf'),
            p(
                'Geben Sie Ihre Telefonnummer ein und bestätigen den Testanruf, ruft unser Server Sie an. Der Server steht bei Infomaniak in der Schweiz, die Telefonie läuft über den Schweizer Anbieter peoplefone. Im Gespräch hören und sprechen wir über das Sprachmodell Gemini von Google in der bezahlten Stufe; Google verwendet die Gesprächsdaten nicht zum Training. Die Zusammenfassung des Gesprächs erstellt ein Textmodell von OpenAI. Es gibt keine Tonaufnahme: Das Gesprochene wird in Echtzeit in Text umgewandelt. Der Assistent sagt zu Beginn, dass er ein digitaler Assistent ist. Ein Testgespräch dauert höchstens drei Minuten; die Zahl der Testanrufe begrenzen wir je Gerät (siehe Ziffer 8).',
            ),
            h3('Was wir behalten'),
            p(
                'Nach dem Gespräch erhält InfraOne eine Gesprächsnotiz per E-Mail: Ihre Telefonnummer, die getestete Firma, eine Zusammenfassung und das Transkript. Wir nutzen sie, um Rückfragen zu beantworten, die Qualität des Assistenten zu verbessern und Ihr Interesse nachzufassen. Wir bewahren diese Notiz längstens zwölf Monate auf; stellen Sie eine Anfrage oder schliessen einen Vertrag ab, gilt Ziffer 4. Auf dem Server bleiben Gesprächsdaten höchstens zwei Stunden, der Anrufauftrag auf der Website höchstens 24 Stunden.',
            ),
            h3('Bitte beachten'),
            p('Nennen Sie im Testgespräch keine besonders schützenswerten Daten, etwa zu Gesundheit oder Finanzen. Der Assistent kennt nur die öffentlichen Angaben Ihrer Website.'),
        ],
    },
    {
        id: 'ki-telefonassistent',
        titel: '6. KI-Telefonassistent als Dienst für unsere Kunden',
        bloecke: [
            p(
                'Setzt ein Kunde den KI-Telefonassistenten für seine Telefonnummer ein, ist der Kunde für die Daten seiner Anrufenden verantwortlich; InfraOne bearbeitet sie als Auftragsbearbeiterin nach Art. 9 DSG. Den Auftragsverarbeitungsvertrag (AVV) stellen wir auf Anfrage zur Verfügung; er ist Bestandteil des Vertrags.',
            ),
            p(
                'So läuft die Verarbeitung: Der Assistent nimmt Anrufe auf dem Server von InfraOne bei Infomaniak in der Schweiz entgegen; die Telefonie läuft über Schweizer Anbieter. Hören und Sprechen übernimmt das Sprachmodell Gemini von Google in der bezahlten Stufe, Zusammenfassungen und Textaufgaben ein Textmodell von OpenAI; beide verwenden die Daten nicht zum Training. Gespräche werden nicht aufgezeichnet. Der Kunde erhält nach jedem Anruf eine Notiz per E-Mail mit Name, Firma, Anliegen, Rückrufnummer, Zusammenfassung und Transkript. SMS-Bestätigungen an Anrufende versenden wir nur, wenn der Kunde diese Funktion aktiviert hat, über die SMS-Schnittstelle von peoplefone. Anrufende hören zu Beginn, dass ein digitaler Assistent spricht. Die Aufbewahrungsdauer der Gesprächsnotizen legt der Kunde fest. Jeder Kunde ist technisch strikt von anderen Kunden getrennt. Anrufende wenden sich für Auskunft oder Löschung an den angerufenen Betrieb; wir unterstützen ihn dabei.',
            ),
        ],
    },
    {
        id: 'dienstleister',
        titel: '7. Dienstleister (Auftragsbearbeiter)',
        bloecke: [
            { art: 'tabelle' },
            p(
                'Für Dienstleister ausserhalb der Schweiz und der EU stützen wir uns auf Standardvertragsklauseln und, wo vorhanden, auf das Swiss-U.S. Data Privacy Framework. Wir behaupten bewusst nicht, dass alle Daten die Schweiz nie verlassen: Die Sprach- und Textmodelle laufen bei Google und OpenAI.',
            ),
        ],
    },
    {
        id: 'cookies',
        titel: '8. Cookies und lokale Speicherung',
        bloecke: [
            p(
                'Wir setzen nur technisch notwendige Cookies, darum braucht es kein Cookie-Banner. Beim Testanruf des KI-Telefonassistenten setzen wir das Cookie «demo_geraet» mit einer zufälligen, signierten Gerätekennung (Laufzeit 400 Tage). Es begrenzt die Zahl der Testanrufe und Website-Prüfungen je Gerät, enthält keine persönlichen Daten und dient nicht der Nachverfolgung über andere Websites. Ihre Wahl zwischen heller und dunkler Darstellung speichert der Browser lokal; sie wird nicht übertragen.',
            ),
        ],
    },
    {
        id: 'datensicherheit',
        titel: '9. Datensicherheit',
        bloecke: [
            p(
                'Alle Verbindungen sind verschlüsselt (TLS). Zugänge und Schlüssel liegen nur auf unseren Servern und sind auf wenige Personen beschränkt. Kunden des KI-Telefonassistenten sind technisch voneinander getrennt. Gespräche werden nicht als Tonaufnahme gespeichert.',
            ),
        ],
    },
    {
        id: 'rechte',
        titel: '10. Ihre Rechte',
        bloecke: [
            p(
                'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Bearbeitung, Herausgabe oder Übertragung Ihrer Daten sowie Widerspruch. Schreiben Sie an info@infraone.ch; wir antworten in der Regel innerhalb von 30 Tagen. Sie können sich zudem beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) beschweren.',
            ),
        ],
    },
    {
        id: 'aenderungen',
        titel: '11. Änderungen',
        bloecke: [p('Wir passen diese Erklärung an, wenn sich unsere Dienste oder die rechtlichen Anforderungen ändern. Es gilt die jeweils hier veröffentlichte Fassung.')],
    },
];

export const DS_STAND = 'Stand: 31. Oktober 2026';
