/**
 * Branchenseiten des KI-Telefonassistenten (AUFTRAG-110).
 * Je Seite: typische Anrufe und wie der Assistent sie behandelt,
 * Beispielgespräch (Mundart UND Hochdeutsch), Integration, Besonderheiten.
 * Nur Fakten aus AUFTRAG-110, Abschnitt 3. Alle Firmen sind erfunden.
 *
 * AUFTRAG-113: Der Eintrag im Microsoft-365-Kalender und die SMS-Bestätigung sind in
 * Entwicklung. «trägt einen Termin ein» → «nimmt den Terminwunsch auf; Kalendereintrag in
 * Entwicklung». Integrations-Karten mit `inEntwicklung: true` zeigen die Badge.
 */
import type { Beispiel } from '../Gespraech';
import type { AnwendungSlug, BranchenSlug } from '../seiten';

export interface Branche {
    slug: BranchenSlug;
    metaTitel: string;
    metaBeschreibung: string;
    name: string;
    /** ein Satz für Karten */
    teaser: string;
    h1: string;
    lead: string;
    alltag: { titel: string; absaetze: string[] };
    anrufe: Array<{ anruf: string; antwort: string }>;
    firma: string;
    beispiel: Beispiel;
    /** `inEntwicklung` zeigt die Badge «In Entwicklung, kommt bald» (AUFTRAG-113) */
    integration: Array<{ titel: string; text: string; inEntwicklung?: boolean }>;
    achten: { titel: string; punkte: Array<{ titel: string; text: string }> };
    anwendungen: AnwendungSlug[];
}

export const BRANCHEN: Branche[] = [
    /* ------------------------------------------------------------------ */
    {
        slug: 'elektriker',
        metaTitel: 'KI-Telefonassistent für Elektriker | InfraOne',
        metaBeschreibung:
            'Für Elektroinstallateure: Der KI-Telefonassistent nimmt Störungen und Aufträge an, während Ihr Team auf der Baustelle ist, und meldet Notfälle sofort.',
        name: 'Elektriker',
        teaser: 'Störungen, Offertanfragen und Kontrollen annehmen, während das Team auf der Baustelle ist.',
        h1: 'KI-Telefonassistent für Elektriker',
        lead: 'Ihr Team ist auf der Baustelle, im Büro klingelt das Telefon: Der KI-Telefonassistent nimmt ab, erfasst Störungen, Offertanfragen und Terminwünsche und meldet echte Notfälle sofort an Ihr Pikett. Nach jedem Gespräch erhalten Sie eine Notiz per E-Mail.',
        alltag: {
            titel: 'Warum Elektriker so viele Anrufe verpassen',
            absaetze: [
                'Elektrikerinnen und Elektriker arbeiten beim Kunden, nicht am Schreibtisch. Wer auf der Leiter steht oder einen Verteiler anschliesst, kann nicht ans Telefon. Im Büro ist nicht immer jemand, und nach Feierabend läuft der Anrufbeantworter.',
                'Gleichzeitig sind die Anrufe im Elektrogewerbe besonders unterschiedlich: Neben der Offertanfrage für eine Ladestation kommt die Meldung, dass in der Küche die Sicherung fliegt, und zwischendurch eine Frage zur Rechnung. Der Assistent sortiert das für Sie: Was dringend ist, geht sofort weiter, alles andere liegt am Abend vollständig im Postfach.',
            ],
        },
        anrufe: [
            { anruf: '«Bei uns fliegt immer wieder die Sicherung raus.»', antwort: 'Er fragt nach, ob nur ein Raum oder das ganze Haus betroffen ist, und behandelt die Meldung nach Ihren Regeln: als Notfall ans Pikett oder als dringende Störung für den nächsten Arbeitstag.' },
            { anruf: '«Können Sie mir eine Offerte für eine Ladestation machen?»', antwort: 'Er nimmt das Vorhaben, die Adresse, den gewünschten Zeitraum und die Rückrufnummer auf. Preise nennt er nur, wenn Sie das wollen.' },
            { anruf: '«Wir brauchen eine periodische Kontrolle.»', antwort: 'Er erfasst Objekt und Kontaktperson und nimmt den Terminwunsch auf; Kalendereintrag in Entwicklung.' },
            { anruf: '«Machen Sie auch Photovoltaik und Smart Home?»', antwort: 'Er antwortet aus Ihrer Website und Ihren Angaben und bietet einen Rückruf durch die zuständige Person an.' },
            { anruf: '«Ich habe eine Frage zur Rechnung.»', antwort: 'Er nimmt die Frage mit Rechnungsnummer und Rückrufnummer auf und schickt sie ans Büro.' },
            { anruf: '«Wann kommt Ihr Monteur?»', antwort: 'Einsatzpläne kennt er nicht. Er nimmt die Frage auf oder leitet an die Person weiter, die die Einsätze plant.' },
        ],
        firma: 'Muster Elektro AG',
        beispiel: {
            situation: 'Dienstag, 18.40 Uhr. Das Team der Muster Elektro AG hat Feierabend. Ein Kunde meldet eine Störung, die bis morgen warten kann.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Muster Elektro AG, de digital Assistänt. Wie chan ich Ihne hälfe?' },
                { wer: 'anrufer', text: 'Grüezi, Meier. Bi üs i de Chuchi gheit immer wieder d Sicherig use.' },
                { wer: 'assistent', text: 'Isch nume d Chuchi betroffe oder s ganze Huus?' },
                { wer: 'anrufer', text: 'Nume d Chuchi. De Räscht gaht.' },
                { wer: 'assistent', text: 'Guet. Dänn nimm ich das als dringendi Störig für morn uf. Wo isch d Adrässe, und under welere Nummere erreicht me Sie?' },
                { wer: 'anrufer', text: 'Musterstrass 8 z Winterthur, uf dere Nummere.' },
                { wer: 'assistent', text: 'Merci, Herr Meier. Mir mälded eus morn am Morge bi Ihne für en Termin.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail ans Büro' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Abend, Muster Elektro AG, der digitale Assistent. Wie kann ich Ihnen helfen?' },
                { wer: 'anrufer', text: 'Guten Abend, Meier. Bei uns in der Küche fliegt immer wieder die Sicherung raus.' },
                { wer: 'assistent', text: 'Ist nur die Küche betroffen oder das ganze Haus?' },
                { wer: 'anrufer', text: 'Nur die Küche. Der Rest funktioniert.' },
                { wer: 'assistent', text: 'Gut. Dann nehme ich das als dringende Störung für morgen auf. Wie lautet die Adresse, und unter welcher Nummer erreichen wir Sie?' },
                { wer: 'anrufer', text: 'Musterstrasse 8 in Winterthur, unter dieser Nummer.' },
                { wer: 'assistent', text: 'Danke, Herr Meier. Wir melden uns morgen früh bei Ihnen für einen Termin.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail ans Büro' },
            ],
        },
        integration: [
            { titel: 'Notfall ans Pikett', text: 'Was als Notfall gilt, etwa ein Stromausfall im ganzen Haus oder in einem Gewerbebetrieb, legen Sie fest. Der Assistent meldet solche Fälle sofort an Ihre Notfallnummer.' },
            { titel: 'Termine im Kalender', text: 'Kontrollen und Besichtigungen nimmt er als Terminwunsch auf und meldet sie Ihnen per E-Mail. Der Eintrag im Microsoft-365-Kalender ist in Entwicklung.', inEntwicklung: true },
            { titel: 'Weiterleitung', text: 'Will jemand dringend die Bauleitung sprechen, leitet er an die hinterlegte Nummer weiter.' },
            { titel: 'Cloud-Telefonie', text: 'Läuft Ihre Telefonanlage bei InfraOne, wird der Assistent Teil davon. Sonst genügt eine Rufumleitung.' },
        ],
        achten: {
            titel: 'Worauf Elektrofirmen achten sollten',
            punkte: [
                { titel: 'Dringlichkeit klar festlegen', text: 'Schreiben Sie mit uns auf, was sofort ans Pikett geht und was bis morgen warten kann. Je klarer die Beispiele, desto sicherer die Einordnung.' },
                { titel: 'Keine Ferndiagnose', text: 'Schliessen Sie technische Ratschläge am Telefon aus. Der Assistent nimmt auf, die Fachperson entscheidet.' },
                { titel: 'Begriffe der Kundschaft', text: 'Hinterlegen Sie Ihre Leistungen auch mit den Wörtern, die Kundinnen verwenden, etwa «Sicherig» oder «FI».' },
            ],
        },
        anwendungen: ['erreichbarkeit', 'notfall', 'anliegen-erfassen'],
    },

    /* ------------------------------------------------------------------ */
    {
        slug: 'sanitaer-heizung',
        metaTitel: 'KI-Telefonassistent für Sanitär und Heizung | InfraOne',
        metaBeschreibung:
            'Für Sanitär- und Heizungsbetriebe: Der KI-Telefonassistent nimmt Service- und Offertanfragen an und meldet Rohrbruch oder Heizungsausfall ans Pikett.',
        name: 'Sanitär und Heizung',
        teaser: 'Pikett entlasten, Serviceanfragen erfassen, Notfälle sofort melden.',
        h1: 'KI-Telefonassistent für Sanitär und Heizung',
        lead: 'Heizung aus, Boiler kalt, Wasser im Keller: Der KI-Telefonassistent nimmt jeden Anruf an, unterscheidet nach Ihren Regeln zwischen Notfall und Serviceanfrage und meldet Notfälle sofort an Ihr Pikett. Alles andere erhalten Sie als Notiz per E-Mail.',
        alltag: {
            titel: 'Zwischen Pikett und Offerte',
            absaetze: [
                'In der Haustechnik kommen die wichtigsten Anrufe zur ungünstigsten Zeit. Fällt im Januar die Heizung aus, ruft niemand erst am Montag an. Gleichzeitig ist ein grosser Teil der Anrufe nicht dringend: ein Termin für die Boiler-Entkalkung, eine Offertanfrage für ein neues Bad, ein WC, das nachläuft.',
                'Wer Pikett hat, muss heute jeden Anruf annehmen, um die echten Notfälle nicht zu verpassen. Der Assistent übernimmt diese Vorauswahl nach Ihren Regeln. Das Pikett-Telefon klingelt für Notfälle, alles andere wartet sauber notiert auf den nächsten Arbeitstag.',
            ],
        },
        anrufe: [
            { anruf: '«Im Keller ist ein Rohr geplatzt.»', antwort: 'Er erkennt den Notfall nach Ihren Regeln, meldet ihn sofort an die Notfallnummer und nimmt Name, Adresse und Rückrufnummer auf.' },
            { anruf: '«Unsere Heizung läuft nicht mehr.»', antwort: 'Ob das ein Notfall ist, bestimmen Sie, zum Beispiel abhängig von der Jahreszeit. Er fragt nach Fehlermeldung und Adresse und handelt danach.' },
            { anruf: '«Der Boiler sollte entkalkt werden.»', antwort: 'Er nimmt den Servicewunsch und den Terminwunsch auf; Kalendereintrag in Entwicklung.' },
            { anruf: '«Wir möchten das Bad umbauen.»', antwort: 'Er erfasst Vorhaben, Objekt, Zeitrahmen und Rückrufnummer für die Offerte.' },
            { anruf: '«Lohnt sich bei uns eine Wärmepumpe?»', antwort: 'Beratung überlässt er Ihnen. Er nimmt das Interesse auf und bietet einen Rückruf an.' },
            { anruf: '«Das WC läuft ständig nach.»', antwort: 'Kein Notfall: Er nimmt das Anliegen für den nächsten Arbeitstag auf.' },
        ],
        firma: 'Muster Haustechnik GmbH',
        beispiel: {
            situation: 'Freitag im Januar, 20 Uhr. Bei einer Kundin der Muster Haustechnik GmbH ist die Heizung ausgefallen.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Muster Haustechnik GmbH, de digital Assistänt. Wie chan ich Ihne hälfe?' },
                { wer: 'anrufer', text: 'Grüezi, Frei. Eusi Heizig lauft sit hüt am Morge nüme, und es wird langsam chalt im Huus.' },
                { wer: 'assistent', text: 'Das tönt dringend. Zeigt d Heizig e Fehlermäldig aa?' },
                { wer: 'anrufer', text: 'Ja, es blinkt es rots Liechtli.' },
                { wer: 'assistent', text: 'Danke. Ich mäld das grad em Pikettdienscht. Wie isch Ihri Adrässe?' },
                { wer: 'anrufer', text: 'Musterweg 3 in Elgg.' },
                { wer: 'assistent', text: 'Merci, Frau Frei. De Pikettdienscht rüeft Sie uf dere Nummere aa.' },
                { wer: 'hinweis', text: 'Meldung an die Notfallnummer, Notiz per E-Mail' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Abend, Muster Haustechnik GmbH, der digitale Assistent. Wie kann ich Ihnen helfen?' },
                { wer: 'anrufer', text: 'Guten Abend, Frei. Unsere Heizung läuft seit heute Morgen nicht mehr, und es wird langsam kalt im Haus.' },
                { wer: 'assistent', text: 'Das klingt dringend. Zeigt die Heizung eine Fehlermeldung an?' },
                { wer: 'anrufer', text: 'Ja, es blinkt ein rotes Licht.' },
                { wer: 'assistent', text: 'Danke. Ich melde das sofort dem Pikettdienst. Wie lautet Ihre Adresse?' },
                { wer: 'anrufer', text: 'Musterweg 3 in Elgg.' },
                { wer: 'assistent', text: 'Danke, Frau Frei. Der Pikettdienst ruft Sie auf dieser Nummer an.' },
                { wer: 'hinweis', text: 'Meldung an die Notfallnummer, Notiz per E-Mail' },
            ],
        },
        integration: [
            { titel: 'Notfallnummer', text: 'Rohrbruch, Wasserschaden, Heizungsausfall: Was Sie als Notfall festlegen, meldet der Assistent sofort an Ihr Pikett.' },
            { titel: 'Mehrere Agenten', text: 'Tagsüber ein Agent für Service und Offerten, nachts einer mit strengeren Notfallregeln.' },
            { titel: 'Servicetermine', text: 'Wartungen und Entkalkungen nimmt er als Terminwunsch auf. Der Eintrag im Microsoft-365-Kalender ist in Entwicklung.', inEntwicklung: true },
            { titel: 'SMS an Anrufende', text: 'Die Kundin erhält künftig eine Bestätigung, dass ihre Meldung angekommen ist.', inEntwicklung: true },
        ],
        achten: {
            titel: 'Worauf Haustechnik-Betriebe achten sollten',
            punkte: [
                { titel: 'Notfallregeln nach Saison', text: 'Ein Heizungsausfall im Januar ist etwas anderes als im Juni. Legen Sie fest, was wann als Notfall gilt.' },
                { titel: 'Hinweise für Anrufende', text: 'Was Anrufende bis zum Eintreffen tun sollen, etwa den Hauptwasserhahn schliessen, hinterlegen Sie selbst.' },
                { titel: 'Keine Ferndiagnose', text: 'Der Assistent fragt nach Fehlermeldungen, beurteilt sie aber nicht. Das bleibt bei Ihrer Fachperson.' },
            ],
        },
        anwendungen: ['notfall', 'erreichbarkeit', 'terminbuchung'],
    },

    /* ------------------------------------------------------------------ */
    {
        slug: 'arztpraxis',
        metaTitel: 'KI-Telefonassistent für Arztpraxen | InfraOne',
        metaBeschreibung:
            'Für Arztpraxen: Der KI-Telefonassistent entlastet den Empfang, beantwortet Fragen zu Öffnungszeiten und Ablauf und nimmt Anliegen auf – ohne Aufzeichnung.',
        name: 'Arztpraxis',
        teaser: 'Den Empfang während der Sprechstunde entlasten, ohne medizinische Auskünfte.',
        h1: 'KI-Telefonassistent für Arztpraxen',
        lead: 'Während der Sprechstunde ist der Empfang mit Patientinnen und Patienten beschäftigt, und das Telefon klingelt trotzdem: Der KI-Telefonassistent beantwortet Fragen zu Öffnungszeiten, Anfahrt und Ablauf und nimmt Termin- und Rezeptwünsche auf. Medizinische Auskünfte gibt er nicht.',
        alltag: {
            titel: 'Empfang und Telefon gleichzeitig',
            absaetze: [
                'Am Empfang einer Praxis passiert alles gleichzeitig: Patientinnen kommen an, Rezepte müssen vorbereitet, Labormuster verschickt werden. Jeder Anruf unterbricht diese Arbeit, und viele Anrufe drehen sich um dieselben Fragen: Haben Sie über Mittag offen? Wo kann ich parkieren? Was muss ich mitbringen?',
                'Der Assistent nimmt diese Anrufe ab, wenn das Team keine Hand frei hat oder die Praxis geschlossen ist. Er beantwortet, was Sie freigeben, und nimmt alles auf, was das Praxisteam erledigen muss. Für alles Medizinische verweist er an die Praxis.',
            ],
        },
        anrufe: [
            { anruf: '«Haben Sie in den Herbstferien offen?»', antwort: 'Er antwortet aus Ihren Angaben zu Öffnungszeiten und Ferien.' },
            { anruf: '«Ich brauche einen Termin für eine Kontrolle.»', antwort: 'Er nimmt den Terminwunsch für das Praxisteam auf; Kalendereintrag in Entwicklung.' },
            { anruf: '«Ich brauche ein neues Rezept.»', antwort: 'Er nimmt Name, Medikament und Rückrufnummer auf und schickt die Notiz an den Empfang.' },
            { anruf: '«Sind meine Laborwerte da?»', antwort: 'Dazu gibt er keine Auskunft. Er nimmt einen Rückrufwunsch für das Praxisteam auf.' },
            { anruf: '«Mir geht es plötzlich sehr schlecht.»', antwort: 'Für Notfälle hinterlegen Sie, was er sagt, etwa den Hinweis auf die Notrufnummer 144 oder auf Ihren Notfalldienst.' },
            { anruf: '«Wo kann ich parkieren?»', antwort: 'Er beschreibt Anfahrt und Parkplätze so, wie Sie es hinterlegt haben.' },
        ],
        firma: 'Praxis Dr. Muster',
        beispiel: {
            situation: 'Montag, 9.15 Uhr. Am Empfang der Praxis Dr. Muster stehen drei Patienten, eine Patientin ruft wegen eines Rezepts an.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Praxis Dr. Muster, de digital Assistänt. Wie chan ich Ihne hälfe?' },
                { wer: 'anrufer', text: 'Grüezi, Schmid. Ich bruuch es nöis Rezäpt für mini Bluetdruckmedikamänt.' },
                { wer: 'assistent', text: 'Gern, Frau Schmid. Ich nimm das für s Praxisteam uf. Under welere Nummere chönd mir Sie erreiche, falls es Rückfrage git?' },
                { wer: 'anrufer', text: 'Uf dere Nummere.' },
                { wer: 'assistent', text: 'Merci. S Praxisteam lueget das aa und meldet sich, wänn s Rezäpt parat isch.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail an den Empfang der Praxis' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Tag, Praxis Dr. Muster, der digitale Assistent. Wie kann ich Ihnen helfen?' },
                { wer: 'anrufer', text: 'Guten Tag, Schmid. Ich brauche ein neues Rezept für meine Blutdruckmedikamente.' },
                { wer: 'assistent', text: 'Gerne, Frau Schmid. Ich nehme das für das Praxisteam auf. Unter welcher Nummer erreichen wir Sie, falls es Rückfragen gibt?' },
                { wer: 'anrufer', text: 'Unter dieser Nummer.' },
                { wer: 'assistent', text: 'Danke. Das Praxisteam schaut sich das an und meldet sich, wenn das Rezept bereit ist.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail an den Empfang der Praxis' },
            ],
        },
        integration: [
            { titel: 'Ausserhalb der Öffnungszeiten', text: 'Ein eigener Text oder ein eigener Agent für die Zeit, in der die Praxis geschlossen ist, mit Ihrem Hinweis für Notfälle.' },
            { titel: 'Termine', text: 'Als Terminwunsch in der Notiz an den Empfang. Der Eintrag im Microsoft-365-Kalender ist in Entwicklung.', inEntwicklung: true },
            { titel: 'Weiterleitung', text: 'Bestimmte Anliegen leitet er an eine hinterlegte Nummer weiter, etwa an die Ärztin im Hintergrunddienst.' },
            { titel: 'Notiz an den Empfang', text: 'Jede Anfrage kommt vollständig per E-Mail an, mit Zusammenfassung und Transkript.' },
        ],
        achten: {
            titel: 'Worauf Praxen achten sollten',
            punkte: [
                { titel: 'Gesundheitsdaten sparsam erfassen', text: 'Gesundheitsdaten sind nach dem Datenschutzgesetz besonders schützenswert. Legen Sie fest, dass der Assistent nur erfragt, was für den Rückruf nötig ist.' },
                { titel: 'Keine medizinische Beratung', text: 'Schliessen Sie medizinische Fragen als Thema aus. Der Assistent ersetzt keine Triage und keine Fachperson.' },
                { titel: 'Keine Aufzeichnung', text: 'Gespräche werden nicht aufgezeichnet. Es entstehen Transkript und Zusammenfassung; die Verarbeitung regelt ein Auftragsverarbeitungsvertrag.' },
            ],
        },
        anwendungen: ['auskunft', 'anliegen-erfassen', 'terminbuchung'],
    },

    /* ------------------------------------------------------------------ */
    {
        slug: 'treuhand',
        metaTitel: 'KI-Telefonassistent für Treuhandbüros | InfraOne',
        metaBeschreibung:
            'Für Treuhandbüros: Der KI-Telefonassistent nimmt Anliegen von Mandanten auf, beantwortet Fragen zu Unterlagen und Abläufen und notiert Terminwünsche.',
        name: 'Treuhand',
        teaser: 'Mandanten bedienen, auch wenn in der Steuerzeit alle am Abschluss sitzen.',
        h1: 'KI-Telefonassistent für Treuhandbüros',
        lead: 'In der Steuerzeit klingelt das Telefon am meisten, wenn am wenigsten Zeit ist: Der KI-Telefonassistent nimmt Anliegen von Mandantinnen und Mandanten auf, beantwortet allgemeine Fragen zu Unterlagen und Abläufen und nimmt Wünsche für Besprechungstermine auf. Steuer- und Rechtsauskünfte gibt er nicht.',
        alltag: {
            titel: 'Konzentration gegen Erreichbarkeit',
            absaetze: [
                'Treuhandarbeit braucht Konzentration: Abschlüsse, Steuererklärungen, Lohnläufe. Gleichzeitig erwarten Mandanten, dass jemand abnimmt. In den Wochen vor den Fristen prallt beides aufeinander, und kleine Büros haben keinen eigenen Empfang.',
                'Der Assistent nimmt die Anrufe an, die sonst das Team aus der Arbeit reissen. Er beantwortet, was allgemein gilt – welche Unterlagen gebraucht werden, wie man sie einreicht, wann das Büro erreichbar ist – und hält alles andere für die zuständige Person fest.',
            ],
        },
        anrufe: [
            { anruf: '«Was muss ich für die Steuererklärung einreichen?»', antwort: 'Er nennt die Unterlagen aus Ihrer Checkliste, so wie Sie sie hinterlegt haben.' },
            { anruf: '«Haben Sie meine Unterlagen erhalten?»', antwort: 'Das kann er nicht prüfen. Er nimmt die Frage für die zuständige Person auf.' },
            { anruf: '«Ich möchte meine Steuererklärung besprechen.»', antwort: 'Er nimmt den Terminwunsch auf; Kalendereintrag und SMS-Bestätigung in Entwicklung.' },
            { anruf: '«Wir gründen eine GmbH und suchen eine Buchhaltung.»', antwort: 'Er erfasst Firma, Vorhaben und Rückrufnummer für ein Erstgespräch.' },
            { anruf: '«Kann ich das als Abzug geltend machen?»', antwort: 'Steuerauskünfte schliessen Sie aus. Er nimmt die Frage für einen Rückruf auf.' },
            { anruf: '«Ich muss dringend Herrn Muster sprechen.»', antwort: 'Er leitet an die hinterlegte Nummer weiter oder nimmt einen Rückrufwunsch auf, so wie Sie es festlegen.' },
        ],
        firma: 'Muster Treuhand AG',
        beispiel: {
            situation: 'Dienstag im März, 16 Uhr. Alle bei der Muster Treuhand AG arbeiten an Steuererklärungen, eine Mandantin will einen Termin.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Muster Treuhand AG, de digital Assistänt. Wie chan ich Ihne hälfe?' },
                { wer: 'anrufer', text: 'Grüezi, Widmer. Ich wett mit em Herr Muster d Stüürerklärig bespräche.' },
                { wer: 'assistent', text: 'Gern, Frau Widmer. Wänn würds Ihne passe?' },
                { wer: 'anrufer', text: 'Am liebschte nächscht Wuche am Namittag. Was mues ich mitbringe?' },
                { wer: 'assistent', text: 'De Lohnuusweis, d Bankuuszüg per Ändi Jahr und d Belege für Abzüg, zum Bischpil für Chrankheitschöschte.' },
                { wer: 'anrufer', text: 'Guet, merci.' },
                { wer: 'assistent', text: 'Ich gib Ihre Terminwunsch am Herr Muster wiiter. Är meldet sich bi Ihne für d Bestätigung.' },
                { wer: 'hinweis', text: 'Terminwunsch als Notiz per E-Mail an Herrn Muster' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Tag, Muster Treuhand AG, der digitale Assistent. Wie kann ich Ihnen helfen?' },
                { wer: 'anrufer', text: 'Guten Tag, Widmer. Ich möchte mit Herrn Muster die Steuererklärung besprechen.' },
                { wer: 'assistent', text: 'Gerne, Frau Widmer. Wann würde es Ihnen passen?' },
                { wer: 'anrufer', text: 'Am liebsten nächste Woche am Nachmittag. Was muss ich mitbringen?' },
                { wer: 'assistent', text: 'Den Lohnausweis, die Bankauszüge per Ende Jahr und die Belege für Abzüge, zum Beispiel für Krankheitskosten.' },
                { wer: 'anrufer', text: 'Gut, danke.' },
                { wer: 'assistent', text: 'Ich gebe Ihren Terminwunsch an Herrn Muster weiter. Er meldet sich bei Ihnen für die Bestätigung.' },
                { wer: 'hinweis', text: 'Terminwunsch als Notiz per E-Mail an Herrn Muster' },
            ],
        },
        integration: [
            { titel: 'Besprechungstermine', text: 'Als Terminwunsch per E-Mail an die zuständige Person. Kalendereintrag und SMS-Bestätigung an die Mandantin sind in Entwicklung.', inEntwicklung: true },
            { titel: 'Notiz an die zuständige Person', text: 'Sie bestimmen, wer die Gesprächsnotizen per E-Mail erhält.' },
            { titel: 'Weiterleitung', text: 'Für Anliegen, die nicht warten können, leitet er an eine hinterlegte Nummer weiter.' },
            { titel: 'Microsoft 365 und IT', text: 'InfraOne betreut auch Ihre IT und Microsoft 365, wenn Sie das möchten.' },
        ],
        achten: {
            titel: 'Worauf Treuhandbüros achten sollten',
            punkte: [
                { titel: 'Keine Auskünfte zu Mandatsdaten', text: 'Am Telefon kann der Assistent niemanden sicher identifizieren. Schliessen Sie Auskünfte zu Steuerdaten, Saldi oder Fristen einzelner Mandate aus.' },
                { titel: 'Allgemeines Wissen pflegen', text: 'Checklisten, Abläufe und Bürozeiten sind ideal für den Assistenten. Halten Sie sie vor der Steuerzeit aktuell.' },
                { titel: 'Vertraulichkeit', text: 'Gespräche werden nicht aufgezeichnet; die Verarbeitung regelt ein Auftragsverarbeitungsvertrag, den Sie bei uns anfordern können.' },
            ],
        },
        anwendungen: ['terminbuchung', 'anliegen-erfassen', 'auskunft'],
    },

    /* ------------------------------------------------------------------ */
    {
        slug: 'immobilien',
        metaTitel: 'KI-Telefonassistent für Immobilienfirmen | InfraOne',
        metaBeschreibung:
            'Für Bewirtschaftung und Vermarktung: Der KI-Telefonassistent nimmt Schadenmeldungen und Besichtigungsanfragen an und meldet Notfälle sofort weiter.',
        name: 'Immobilien',
        teaser: 'Schadenmeldungen erfassen, Besichtigungswünsche aufnehmen, Notfälle weitermelden.',
        h1: 'KI-Telefonassistent für Immobilienfirmen',
        lead: 'Mieterinnen melden Schäden, Interessenten fragen nach Besichtigungen, und abends ruft jemand wegen eines Wasserschadens an: Der KI-Telefonassistent nimmt diese Anrufe an, erfasst Objekt, Anliegen und Rückrufnummer und meldet Notfälle sofort an Ihre Notfallnummer.',
        alltag: {
            titel: 'Viele Objekte, viele Anrufe',
            absaetze: [
                'Eine Bewirtschaftung erhält Anrufe aus jedem Objekt, das sie betreut: Die Waschmaschine ist defekt, der Storen klemmt, im Treppenhaus brennt kein Licht. Dazu kommen Interessenten für freie Wohnungen, Handwerker mit Rückfragen und Eigentümer.',
                'Der Assistent nimmt jede Meldung vollständig auf, mit Adresse, Stockwerk und Rückrufnummer, und schickt sie an die richtige Stelle. Echte Notfälle wie ein Wasserschaden gehen sofort an Ihre Notfallnummer – auch nachts und am Wochenende.',
            ],
        },
        anrufe: [
            { anruf: '«Die Waschmaschine im Keller ist defekt.»', antwort: 'Er nimmt Objekt, Anliegen und Rückrufnummer auf und schickt die Meldung an die Bewirtschaftung.' },
            { anruf: '«Bei uns tropft Wasser von der Decke.»', antwort: 'Nach Ihren Regeln ein Notfall: Er meldet sofort an Ihre Notfallnummer.' },
            { anruf: '«Ist die Wohnung an der Musterstrasse noch frei?»', antwort: 'Er antwortet aus den Angaben auf Ihrer Website und nimmt einen Besichtigungswunsch auf.' },
            { anruf: '«Kann ich die Wohnung am Samstag anschauen?»', antwort: 'Er nimmt den Besichtigungswunsch auf; Kalendereintrag und SMS-Bestätigung in Entwicklung.' },
            { anruf: '«Wie kündige ich meine Wohnung?»', antwort: 'Er erklärt den Ablauf so, wie Sie ihn hinterlegt haben, und nimmt bei Bedarf einen Rückruf auf.' },
            { anruf: '«Ich brauche den Hauswart.»', antwort: 'Er leitet an die hinterlegte Nummer weiter oder nimmt das Anliegen auf.' },
        ],
        firma: 'Muster Immobilien AG',
        beispiel: {
            situation: 'Freitag, 17.45 Uhr. Die Vermarktung der Muster Immobilien AG ist schon im Wochenende, ein Interessent ruft wegen eines Inserats an.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Muster Immobilie AG, de digital Assistänt. Wie chan ich Ihne hälfe?' },
                { wer: 'anrufer', text: 'Grüezi, Steiner. Ich interessier mi für d Dreieinhalbzimmerwohnig a de Musterstrass. Isch die no frei?' },
                { wer: 'assistent', text: 'Ja, d Wohnig isch no uusgschribe. Möchted Sie si go aaluege?' },
                { wer: 'anrufer', text: 'Gern, am liebschte am Samschtig.' },
                { wer: 'assistent', text: 'Ich nimm Ihre Bsichtigungswunsch für de Samschtig uf. Under welere Nummere erreicht me Sie?' },
                { wer: 'anrufer', text: 'Uf dere Nummere.' },
                { wer: 'assistent', text: 'Merci, Herr Steiner. D Vermarktig meldet sich bi Ihne mit em Termin.' },
                { wer: 'hinweis', text: 'Besichtigungswunsch als Notiz per E-Mail an die Vermarktung' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Tag, Muster Immobilien AG, der digitale Assistent. Wie kann ich Ihnen helfen?' },
                { wer: 'anrufer', text: 'Guten Tag, Steiner. Ich interessiere mich für die Dreieinhalbzimmerwohnung an der Musterstrasse. Ist sie noch frei?' },
                { wer: 'assistent', text: 'Ja, die Wohnung ist noch ausgeschrieben. Möchten Sie sie besichtigen?' },
                { wer: 'anrufer', text: 'Gerne, am liebsten am Samstag.' },
                { wer: 'assistent', text: 'Ich nehme Ihren Besichtigungswunsch für Samstag auf. Unter welcher Nummer erreicht man Sie?' },
                { wer: 'anrufer', text: 'Unter dieser Nummer.' },
                { wer: 'assistent', text: 'Danke, Herr Steiner. Die Vermarktung meldet sich bei Ihnen mit dem Termin.' },
                { wer: 'hinweis', text: 'Besichtigungswunsch als Notiz per E-Mail an die Vermarktung' },
            ],
        },
        integration: [
            { titel: 'Notfallnummer', text: 'Wasserschaden oder Heizungsausfall meldet er sofort an Ihre Notfallnummer oder an den Notfalldienst Ihrer Wahl.' },
            { titel: 'Mehrere Agenten', text: 'Einer für die Bewirtschaftung, einer für die Vermarktung, jeder mit eigenen Regeln.' },
            { titel: 'Besichtigungen im Kalender', text: 'Besichtigungswünsche gehen per E-Mail an die Vermarktung. Eintrag im Microsoft-365-Kalender und SMS-Bestätigung sind in Entwicklung.', inEntwicklung: true },
            { titel: 'Notizen an die richtige Stelle', text: 'Sie legen fest, wer die Gesprächsnotizen per E-Mail erhält.' },
        ],
        achten: {
            titel: 'Worauf Immobilienfirmen achten sollten',
            punkte: [
                { titel: 'Inserate aktuell halten', text: 'Der Assistent kennt, was auf Ihrer Website steht. Ist eine Wohnung vergeben, sollte sie dort nicht mehr ausgeschrieben sein.' },
                { titel: 'Notfall und Schaden trennen', text: 'Legen Sie fest, welche Schäden sofort an die Notfallnummer gehen und welche bis zum nächsten Arbeitstag warten.' },
                { titel: 'Mieterdaten', text: 'Gespräche werden nicht aufgezeichnet. Erfasst wird, was für die Bearbeitung nötig ist.' },
            ],
        },
        anwendungen: ['anliegen-erfassen', 'notfall', 'terminbuchung'],
    },

    /* ------------------------------------------------------------------ */
    {
        slug: 'garage',
        metaTitel: 'KI-Telefonassistent für Garagen | InfraOne',
        metaBeschreibung:
            'Für Garagen und Autogewerbe: Der KI-Telefonassistent nimmt Wünsche für Service- und Pneutermine auf und beantwortet Fragen zu Öffnungszeiten.',
        name: 'Garage',
        teaser: 'Terminwünsche für Service und Pneus aufnehmen, Fragen zu Abholung und Öffnungszeiten beantworten.',
        h1: 'KI-Telefonassistent für Garagen',
        lead: 'Im Frühling und im Herbst wollen alle gleichzeitig die Pneus wechseln, und in der Werkstatt hat niemand die Hände frei: Der KI-Telefonassistent nimmt Wünsche für Service- und Pneutermine entgegen, beantwortet Fragen zu Öffnungszeiten und Abholung und nimmt alle anderen Anliegen auf.',
        alltag: {
            titel: 'Saison in der Werkstatt, Stau am Telefon',
            absaetze: [
                'In einer Garage arbeitet das Team vor allem in der Werkstatt, nicht am Telefon. Wer gerade unter einem Auto steht, kann nicht abnehmen. In der Pneusaison kommen die Anrufe besonders gehäuft, und viele davon drehen sich um einen Termin.',
                'Der Assistent nimmt diese Anrufe ab, nimmt Terminwünsche nach Ihren Regeln auf und beantwortet, was Sie freigeben: Öffnungszeiten, Abholzeiten, Leistungen. Was er nicht wissen kann, etwa ob ein Auto schon fertig ist, gibt er an die Werkstatt weiter.',
            ],
        },
        anrufe: [
            { anruf: '«Ich möchte die Winterpneus montieren lassen.»', antwort: 'Er nimmt Fahrzeug und Terminwunsch auf; Kalendereintrag und SMS-Bestätigung in Entwicklung.' },
            { anruf: '«Mein Auto muss in den Service.»', antwort: 'Er erfragt Fahrzeug und gewünschten Zeitraum und nimmt den Terminwunsch für die Werkstatt auf.' },
            { anruf: '«Ist mein Auto schon fertig?»', antwort: 'Das sieht er nicht. Er gibt die Frage an die Werkstatt weiter und nennt die Öffnungszeiten für die Abholung.' },
            { anruf: '«Haben Sie den Occasion-Wagen aus dem Inserat noch?»', antwort: 'Er nimmt das Interesse für den Verkauf auf und bietet einen Rückruf an.' },
            { anruf: '«Ich habe eine Panne.»', antwort: 'Wie er damit umgeht, legen Sie fest: Weiterleitung an eine Nummer oder Ihr Hinweis auf den Pannendienst.' },
            { anruf: '«Bis wann haben Sie am Samstag offen?»', antwort: 'Er antwortet aus Ihren Öffnungszeiten.' },
        ],
        firma: 'Garage Muster AG',
        beispiel: {
            situation: 'Donnerstag, 15 Uhr. Die Werkstatt der Garage Muster AG ist voll, ein Kunde fragt nach seinem Auto.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Garage Muster AG, de digital Assistänt. Was chan ich für Sie tue?' },
                { wer: 'anrufer', text: 'Grüezi, Graf. Mis Auto isch bi Ihne im Service. Isch es scho fertig?' },
                { wer: 'assistent', text: 'Das chan ich leider nöd gseh. Ich gib Ihri Frag a d Wärchstatt wiiter. Bis wänn sind Sie hüt erreichbar?' },
                { wer: 'anrufer', text: 'Bis am föifi.' },
                { wer: 'assistent', text: 'Guet, Herr Graf. D Wärchstatt meldet sich vor de föifi. Mir händ hüt bis am halbi sibni offe, falls Sie s Auto no wänd cho hole.' },
                { wer: 'anrufer', text: 'Perfekt, merci.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail an die Werkstatt' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Tag, Garage Muster AG, der digitale Assistent. Was kann ich für Sie tun?' },
                { wer: 'anrufer', text: 'Guten Tag, Graf. Mein Auto ist bei Ihnen im Service. Ist es schon fertig?' },
                { wer: 'assistent', text: 'Das kann ich leider nicht sehen. Ich gebe Ihre Frage an die Werkstatt weiter. Bis wann sind Sie heute erreichbar?' },
                { wer: 'anrufer', text: 'Bis 17 Uhr.' },
                { wer: 'assistent', text: 'Gut, Herr Graf. Die Werkstatt meldet sich vor 17 Uhr. Wir haben heute bis 18.30 Uhr offen, falls Sie das Auto noch abholen möchten.' },
                { wer: 'anrufer', text: 'Perfekt, danke.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail an die Werkstatt' },
            ],
        },
        integration: [
            { titel: 'Termine im Kalender', text: 'Wünsche für Pneuwechsel und Service gehen per E-Mail an die Werkstatt. Eintrag im Microsoft-365-Kalender und SMS-Bestätigung sind in Entwicklung.', inEntwicklung: true },
            { titel: 'Werkstatt und Verkauf', text: 'Mehrere Agenten oder klare Empfänger: Anfragen zum Verkauf gehen an den Verkauf, Fragen zum Service an die Werkstatt.' },
            { titel: 'Weiterleitung', text: 'Für Pannen oder dringende Fälle leitet er an eine hinterlegte Nummer weiter.' },
            { titel: 'Öffnungszeiten', text: 'Er kennt Ihre Öffnungszeiten und hat für die Zeit ausserhalb einen eigenen Text.' },
        ],
        achten: {
            titel: 'Worauf Garagen achten sollten',
            punkte: [
                { titel: 'Termin-Regeln festlegen', text: 'Welche Terminwünsche soll der Assistent aufnehmen, und welche Angaben braucht er dafür? Das klären wir bei der Einrichtung.' },
                { titel: 'Saisonspitzen planen', text: 'Vor der Pneusaison lohnt es sich, Wissen und Regeln zu prüfen, etwa ob Einlagerung oder Ersatzwagen angeboten werden.' },
                { titel: 'Ehrlich bleiben', text: 'Was der Assistent nicht sehen kann, etwa den Stand einer Reparatur, sagt er offen und gibt es weiter.' },
            ],
        },
        anwendungen: ['terminbuchung', 'auskunft', 'erreichbarkeit'],
    },
];

export function branche(slug: string): Branche | undefined {
    return BRANCHEN.find((b) => b.slug === slug);
}
