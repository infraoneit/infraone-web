/**
 * Funktionen des KI-Telefonassistenten in Gruppen (AUFTRAG-110).
 * Jede Funktion: Titel, zwei bis drei Sätze, «so hört es sich an»-Beispiel.
 * Nur Fakten aus AUFTRAG-110, Abschnitt 3.
 */
import type { Sprache, Zeile } from '../Gespraech';

export interface Funktion {
    id: string;
    titel: string;
    text: string;
    beispiel: { sprache: Sprache; zeilen: Zeile[] };
    link?: { text: string; href: string };
}

export interface FunktionsGruppe {
    id: string;
    titel: string;
    intro: string;
    funktionen: Funktion[];
}

const B = '/ki-telefonassistent';

export const FUNKTIONS_GRUPPEN: FunktionsGruppe[] = [
    {
        id: 'gespraechsfuehrung',
        titel: 'Gesprächsführung',
        intro: 'Der Assistent führt ein Gespräch, kein Tastenmenü. Wie er auftritt, bestimmen Sie.',
        funktionen: [
            {
                id: 'natuerlich',
                titel: 'Natürliche Gespräche statt Tastenmenü',
                text: 'Der Assistent arbeitet mit Sprach-zu-Sprach-KI: Er hört zu, versteht ganze Sätze und antwortet frei, statt Textbausteine vorzulesen. Anrufende müssen keine Taste drücken und keine Stichworte kennen.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'anrufer', text: 'Ich hett gern gwüsst, öb ihr au Wärmepumpe montiered.' },
                        { wer: 'assistent', text: 'Ja, mir planed und montiered Wärmepumpe. Söll sich öpper vo eus für e Beratig bi Ihne mälde?' },
                    ],
                },
            },
            {
                id: 'haltung',
                titel: 'Haltung und Grenzen nach Ihren Vorgaben',
                text: 'Sie legen fest, wie der Assistent auftritt: förmlich oder locker, knapp oder ausführlich. Themen, über die er nicht sprechen soll, schliessen Sie aus – dann nimmt er das Anliegen auf und verweist an Ihr Team.',
                beispiel: {
                    sprache: 'de',
                    zeilen: [
                        { wer: 'anrufer', text: 'Was kostet bei Ihnen ein neuer Sicherungskasten?' },
                        { wer: 'assistent', text: 'Preise kann ich am Telefon nicht nennen. Ich nehme Ihre Anfrage gerne auf, damit Ihnen jemand eine Offerte macht.' },
                    ],
                },
            },
            {
                id: 'agenten',
                titel: 'Mehrere Agenten für verschiedene Aufgaben',
                text: 'Pro Kunde sind mehrere Agenten möglich, zum Beispiel einer während der Öffnungszeiten und einer für den Abend und das Wochenende. So gelten nachts andere Regeln als am Tag.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'assistent', text: 'Grüezi, Sie lüüted ussert de Öffnigsziite aa. Ich nimm Ihres Aaliege gern uf, und bi me Notfall mäld ich Sie grad bim Pikett.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'sprachen',
        titel: 'Mundart und Sprachen',
        intro: 'Ihre Kundschaft spricht, wie sie es gewohnt ist. Der Assistent versteht und antwortet.',
        funktionen: [
            {
                id: 'mundart',
                titel: 'Versteht und spricht Schweizerdeutsch',
                text: 'Anrufende reden Mundart, so wie im Alltag. Der Assistent versteht Schweizerdeutsch und antwortet auf Wunsch ebenfalls in Mundart. Bei sehr starkem Dialekt oder seltenen Ausdrücken kann es Rückfragen geben; testen Sie ihn deshalb mit Ihrem eigenen Dialekt.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'anrufer', text: 'Grüezi, bi mir tröpflet s Lavabo, chönd Sie da emal verbiluege?' },
                        { wer: 'assistent', text: 'Sicher. Ich nimm das gern uf. Wie isch Ihri Adrässe?' },
                    ],
                },
                link: { text: 'Mehr zu Schweizerdeutsch', href: `${B}/schweizerdeutsch` },
            },
            {
                id: 'hochdeutsch-englisch',
                titel: 'Hochdeutsch und Englisch',
                text: 'Neben Schweizerdeutsch spricht der Assistent Hochdeutsch und Englisch, zum Beispiel für Kundschaft aus Deutschland oder internationale Anrufende. In welcher Sprache er begrüsst, legen Sie fest.',
                beispiel: {
                    sprache: 'en',
                    zeilen: [
                        { wer: 'anrufer', text: 'Hi, do you speak English? I would like to book an appointment.' },
                        { wer: 'assistent', text: 'Yes, of course. What would you like to book, and which day suits you?' },
                    ],
                },
            },
        ],
    },
    {
        id: 'anliegen',
        titel: 'Anliegen erfassen',
        intro: 'Nach dem Gespräch wissen Sie, wer angerufen hat, was die Person wollte und wie Sie sie erreichen.',
        funktionen: [
            {
                id: 'kernangaben',
                titel: 'Name, Firma, Anliegen, Rückrufnummer',
                text: 'Der Assistent fragt gezielt nach, bis das Wichtigste beisammen ist: wer anruft, für welche Firma, worum es geht und unter welcher Nummer die Person erreichbar ist. Am Schluss fasst er zusammen, damit Fehler gleich auffallen.',
                beispiel: {
                    sprache: 'de',
                    zeilen: [
                        { wer: 'assistent', text: 'Damit wir Sie zurückrufen können: Für welche Firma rufen Sie an, und unter welcher Nummer erreichen wir Sie?' },
                        { wer: 'anrufer', text: 'Für die Muster Bau AG, am besten auf dieser Nummer.' },
                    ],
                },
                link: { text: 'Anwendung «Anliegen erfassen»', href: `${B}/anwendungen/anliegen-erfassen` },
            },
            {
                id: 'transkript',
                titel: 'Transkript und Zusammenfassung statt Aufnahme',
                text: 'Gespräche werden nicht aufgezeichnet. Sie erhalten stattdessen ein Transkript und eine Zusammenfassung und sehen auf einen Blick, worum es ging.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'anrufer', text: 'Wird das Gspräch eigentlich ufgnoh?' },
                        { wer: 'assistent', text: 'Nei, s Gspräch wird nöd ufgnoh. Für d Nochbearbeitig entstaht e schriftlichi Zämefassig.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'termine',
        titel: 'Termine und Öffnungszeiten',
        intro: 'Der Assistent kennt Ihre Zeiten und kann Termine direkt im Kalender eintragen.',
        funktionen: [
            {
                id: 'kalender',
                titel: 'Termine im Microsoft-365-Kalender',
                text: 'Der Assistent trägt Termine direkt in einen Microsoft-365-Kalender ein. Welche Termine er vergeben darf und welche Angaben er dafür erfragt, legen Sie fest.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'anrufer', text: 'Chönnt ich nächscht Wuche für de Service verbicho?' },
                        { wer: 'assistent', text: 'Am Mittwuch am nüüni chönnt ich Sie iiträge. Passt das?' },
                    ],
                },
                link: { text: 'Anwendung «Terminbuchung»', href: `${B}/anwendungen/terminbuchung` },
            },
            {
                id: 'oeffnungszeiten',
                titel: 'Öffnungszeiten und Text ausserhalb',
                text: 'Der Assistent kennt Ihre Öffnungszeiten und gibt Auskunft darüber. Für die Zeit ausserhalb hinterlegen Sie einen eigenen Text, etwa wann Sie zurückrufen.',
                beispiel: {
                    sprache: 'de',
                    zeilen: [
                        { wer: 'anrufer', text: 'Haben Sie am Samstag geöffnet?' },
                        { wer: 'assistent', text: 'Am Samstag ist das Geschäft geschlossen. Von Montag bis Freitag sind wir von 7.30 bis 17 Uhr für Sie da.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'weiterleitung',
        titel: 'Weiterleitung und Notfall',
        intro: 'Was nicht warten kann, geht sofort an die richtige Person.',
        funktionen: [
            {
                id: 'weiterleiten',
                titel: 'Weiterleiten an eine Person',
                text: 'Der Assistent kann an eine Person weiterleiten, deren Nummer Sie hinterlegen. Wann er weiterleitet und wann er lieber einen Rückruf aufnimmt, bestimmen Sie.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'anrufer', text: 'Ich müesst dringend mit em Bauleiter rede.' },
                        { wer: 'assistent', text: 'Ich verbind Sie grad. Bitte bliibed Sie dra.' },
                    ],
                },
            },
            {
                id: 'notfall',
                titel: 'Notfälle an die Notfallnummer melden',
                text: 'Was als Notfall gilt, legen Sie fest, zum Beispiel Wasserschaden oder Stromausfall im ganzen Haus. Erkennt der Assistent einen solchen Fall, meldet er ihn an Ihre Notfallnummer.',
                beispiel: {
                    sprache: 'de',
                    zeilen: [
                        { wer: 'anrufer', text: 'Bei uns läuft Wasser aus der Decke!' },
                        { wer: 'assistent', text: 'Das ist ein Notfall. Ich melde Sie sofort beim Pikettdienst. Wie lautet Ihre Adresse?' },
                    ],
                },
                link: { text: 'Anwendung «Notfall und Pikett»', href: `${B}/anwendungen/notfall` },
            },
        ],
    },
    {
        id: 'benachrichtigung',
        titel: 'Benachrichtigung',
        intro: 'Sie und Ihre Anrufenden wissen nach dem Gespräch, was vereinbart ist.',
        funktionen: [
            {
                id: 'notiz',
                titel: 'Gesprächsnotiz per E-Mail',
                text: 'Nach jedem Gespräch schickt der Assistent eine Notiz per E-Mail: Name, Firma, Anliegen, Rückrufnummer, Zusammenfassung und Transkript. Wer die Notizen erhält, bestimmen Sie.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'assistent', text: 'Ich gib Ihres Aaliege as Büro wiiter. Mir mälded eus morn am Vormittag.' },
                        { wer: 'hinweis', text: 'Notiz per E-Mail an das Büro' },
                    ],
                },
            },
            {
                id: 'sms',
                titel: 'SMS-Bestätigung an Anrufende',
                text: 'Auf Wunsch erhält die anrufende Person eine SMS-Bestätigung, zum Beispiel mit dem vereinbarten Termin oder dem Hinweis, dass ihr Anliegen angekommen ist.',
                beispiel: {
                    sprache: 'de',
                    zeilen: [
                        { wer: 'assistent', text: 'Ihr Termin ist eingetragen. Sie erhalten gleich eine SMS mit der Bestätigung.' },
                        { wer: 'hinweis', text: 'SMS an die anrufende Person' },
                    ],
                },
            },
        ],
    },
    {
        id: 'wissen',
        titel: 'Wissen aus der Website',
        intro: 'Der Assistent kennt Ihren Betrieb, bevor er das erste Gespräch führt.',
        funktionen: [
            {
                id: 'website',
                titel: 'Lernt aus Ihrer Website',
                text: 'Wir lesen Ihre Website: Leistungen, Öffnungszeiten, Kontakt, Abläufe. Daraus entsteht das Grundwissen des Assistenten – genau so, wie Sie es im Testanruf in einer Minute erleben.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'anrufer', text: 'Mached ihr au Badumbaute?' },
                        { wer: 'assistent', text: 'Ja, Badumbaute ghöred zu eusne Leischtige, vo de Planig bis zur Montage.' },
                    ],
                },
            },
            {
                id: 'angaben',
                titel: 'Ergänzt um Ihre Angaben',
                text: 'Was nicht auf der Website steht, ergänzen Sie: Abläufe, Parkplätze, häufige Fragen, Hinweise für Notfälle. Bevor der Assistent ans Telefon geht, prüfen Sie sein Wissen.',
                beispiel: {
                    sprache: 'de',
                    zeilen: [
                        { wer: 'anrufer', text: 'Wo kann ich bei Ihnen parkieren?' },
                        { wer: 'assistent', text: 'Direkt vor dem Eingang gibt es zwei Kundenparkplätze.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'telefonie',
        titel: 'Telefonie-Anbindung',
        intro: 'Der Assistent passt zu Ihrer bestehenden Telefonie oder wird Teil Ihrer Telefonanlage bei InfraOne.',
        funktionen: [
            {
                id: 'nummer',
                titel: 'Eigene Nummer behalten oder neue Nummer',
                text: 'Sie leiten Anrufe von Ihrer bestehenden Nummer auf den Assistenten um, immer oder nur in bestimmten Fällen. Oder Sie erhalten eine neue Nummer. Die Telefonie läuft über Schweizer Provider.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'hinweis', text: 'Nach drei Klingeltönen ohne Antwort' },
                        { wer: 'assistent', text: 'Grüezi, Sie sind bi de Muster AG. D Kollege sind grad bschäftigt, ich hilf Ihne gern wiiter.' },
                    ],
                },
            },
            {
                id: 'vpbx',
                titel: 'Anbindung an die Cloud-Telefonie von InfraOne',
                text: 'Läuft Ihre Telefonanlage in der Cloud-Telefonie von InfraOne, wird der Assistent zum Baustein der Anlage. Er übernimmt dort, wo Sie es festlegen, zum Beispiel ausserhalb der Öffnungszeiten.',
                beispiel: {
                    sprache: 'de',
                    zeilen: [
                        { wer: 'hinweis', text: 'Abends um 19 Uhr, die Anlage schaltet auf den Assistenten' },
                        { wer: 'assistent', text: 'Guten Abend, Sie sind mit der Muster AG verbunden. Wir sind ab morgen 8 Uhr wieder für Sie da. Wie kann ich Ihnen helfen?' },
                    ],
                },
                link: { text: 'Cloud-Telefonie von InfraOne', href: '/cloud-telefonie' },
            },
        ],
    },
    {
        id: 'sicherheit',
        titel: 'Sicherheit',
        intro: 'Ihre Daten und die Ihrer Anrufenden sind geschützt, und Sie wissen, wo was läuft.',
        funktionen: [
            {
                id: 'hosting',
                titel: 'Hosting in der Schweiz',
                text: 'Der Assistent läuft auf Servern in der Schweiz, bei Infomaniak in Satigny. Für die Sprachverarbeitung setzen wir KI-Anbieter ein – Google Gemini und OpenAI –, wo verfügbar in einer EU-Region.',
                beispiel: {
                    sprache: 'de',
                    zeilen: [
                        { wer: 'anrufer', text: 'Wo landen meine Angaben?' },
                        { wer: 'assistent', text: 'Ihre Angaben gehen als Notiz an das Team der Muster AG. Für die Sprachverarbeitung arbeite ich mit einem KI-Anbieter, der Ihre Angaben nicht zum Training verwendet.' },
                    ],
                },
                link: { text: 'Sicherheit und Datenschutz', href: `${B}/sicherheit-datenschutz` },
            },
            {
                id: 'training',
                titel: 'Keine Nutzung für Training',
                text: 'Wir nutzen bezahlte Stufen der KI-Anbieter, bei denen Gesprächsdaten nicht für das Training verwendet werden. Einen Auftragsverarbeitungsvertrag erhalten Sie auf Anfrage.',
                beispiel: {
                    sprache: 'gsw',
                    zeilen: [
                        { wer: 'anrufer', text: 'Und wird das für s KI-Training bruucht?' },
                        { wer: 'assistent', text: 'Nei, Ihri Aagabe wärded nöd für s Training vo de KI verwändet.' },
                    ],
                },
            },
        ],
    },
];
