/**
 * Häufige Fragen zum KI-Telefonassistenten (AUFTRAG-110).
 * Nur Fakten aus AUFTRAG-110, Abschnitt 3. Preisantworten kommen aus
 * src/lib/ki-telefonassistent-preise.ts (Entwurf, solange nicht freigegeben).
 * Verwendet auf /ki-telefonassistent/faq (alle) und auf der Hub-Seite (Auszug).
 */
import type { FaqEintrag } from '../Bausteine';
import {
    abPreis,
    chf,
    EINRICHTUNG_EINMALIG,
    LAUFZEIT_HINWEIS,
    MWST_HINWEIS,
    PREIS_ZUSATZMINUTE,
    PREISE_FREIGEGEBEN,
} from '@/lib/ki-telefonassistent-preise';

const B = '/ki-telefonassistent';

const kostenAntwort = PREISE_FREIGEGEBEN
    ? `Die Pakete beginnen bei CHF ${chf(abPreis())} pro Monat, ${MWST_HINWEIS}, dazu kommt eine einmalige Einrichtung von CHF ${chf(EINRICHTUNG_EINMALIG)}. Welche Gesprächsminuten und Funktionen in welchem Paket stecken, sehen Sie auf der Preisseite.`
    : `Die Preise sind noch nicht freigegeben. Der aktuelle Entwurf beginnt bei CHF ${chf(abPreis())} pro Monat, ${MWST_HINWEIS}, plus eine einmalige Einrichtung von CHF ${chf(EINRICHTUNG_EINMALIG)}. Bis zur Freigabe kann sich das ändern; verbindlich ist Ihre Offerte.`;

const laufzeitAntwort = PREISE_FREIGEGEBEN
    ? `Die Pakete sind ${LAUFZEIT_HINWEIS}. Sie gehen keine lange Bindung ein und können den Assistenten wieder abschalten, indem Sie die Rufumleitung aufheben.`
    : `Im aktuellen Preisentwurf sind die Pakete ${LAUFZEIT_HINWEIS}. Die definitiven Bedingungen folgen mit der Freigabe der Preise. Technisch ist der Ausstieg einfach: Sie heben die Rufumleitung auf, und Ihre Nummer klingelt wieder wie vorher.`;

const minutenAntwort = PREISE_FREIGEGEBEN
    ? `Jede zusätzliche Gesprächsminute kostet CHF ${chf(PREIS_ZUSATZMINUTE)}. Der Assistent nimmt also auch dann ab, wenn die Minuten Ihres Pakets aufgebraucht sind.`
    : `Im aktuellen Preisentwurf kostet jede zusätzliche Gesprächsminute CHF ${chf(PREIS_ZUSATZMINUTE)}. Der Assistent nimmt also auch dann ab, wenn die Minuten Ihres Pakets aufgebraucht sind. Die Preise sind noch nicht freigegeben.`;

export interface FaqKategorie {
    id: string;
    titel: string;
    eintraege: FaqEintrag[];
}

export const FAQ_KATEGORIEN: FaqKategorie[] = [
    {
        id: 'allgemein',
        titel: 'Allgemein',
        eintraege: [
            {
                id: 'was-ist',
                frage: 'Was ist ein KI-Telefonassistent?',
                antwort:
                    'Ein KI-Telefonassistent nimmt Anrufe für Ihren Betrieb entgegen und führt das Gespräch selbst: Er begrüsst, beantwortet Fragen aus Ihrem Wissen, nimmt Anliegen auf und schickt Ihnen danach eine Notiz per E-Mail. Er arbeitet mit Sprach-zu-Sprach-KI, liest also keine Textbausteine vor, sondern antwortet frei im Gespräch.',
                link: { text: 'Alle Funktionen', href: `${B}/funktionen` },
            },
            {
                id: 'ersetzt-team',
                frage: 'Ersetzt der Assistent mein Team am Telefon?',
                antwort:
                    'Nein. Er übernimmt die Anrufe, die sonst niemand annimmt: während Kundenterminen, auf der Baustelle, in der Mittagspause und nach Feierabend. Sie bestimmen, wann er abnimmt. Gespräche, die eine Person führen soll, leitet er weiter oder hält sie für den Rückruf fest.',
            },
            {
                id: 'was-danach',
                frage: 'Was erhalte ich nach einem Anruf?',
                antwort:
                    'Nach jedem Gespräch schickt der Assistent eine Gesprächsnotiz per E-Mail: Name, Firma, Anliegen und Rückrufnummer der anrufenden Person, dazu eine Zusammenfassung und das Transkript. Auf Wunsch erhält die anrufende Person eine Bestätigung per SMS.',
            },
            {
                id: 'fehler',
                frage: 'Was passiert, wenn der Assistent etwas nicht weiss oder falsch versteht?',
                antwort:
                    'Er antwortet aus dem Wissen, das Sie freigegeben haben. Fehlt eine Antwort, nimmt er das Anliegen auf, damit Sie zurückrufen. Wie jede KI kann er sich verhören oder etwas missverstehen. Deshalb erhalten Sie zu jedem Gespräch Transkript und Zusammenfassung: Sie sehen, was gesagt wurde, und wir ergänzen das Wissen, wo etwas gefehlt hat.',
            },
            {
                id: 'verbotene-themen',
                frage: 'Kann ich festlegen, worüber der Assistent nicht spricht?',
                antwort:
                    'Ja. Themen, die er nicht behandeln soll, schliessen Sie aus – zum Beispiel Preisauskünfte am Telefon, Rechtsfragen oder medizinische Ratschläge. Auch seine Haltung legen Sie fest: eher förmlich oder eher locker, knapp oder ausführlich. Bei ausgeschlossenen Themen nimmt er das Anliegen auf und verweist an Ihr Team.',
            },
        ],
    },
    {
        id: 'sprache',
        titel: 'Sprache und Mundart',
        eintraege: [
            {
                id: 'schweizerdeutsch',
                frage: 'Versteht der Assistent Schweizerdeutsch?',
                antwort:
                    'Ja. Er versteht Schweizerdeutsch und spricht es auch. Anrufende können reden, wie sie es gewohnt sind. Die Dialekte sind vielfältig, und nicht jeder Ausdruck aus jeder Region wird auf Anhieb verstanden. Im Testanruf ist Schweizerdeutsch deshalb noch als «in Erprobung» gekennzeichnet. Am besten prüfen Sie ihn mit Ihrem eigenen Dialekt.',
                link: { text: 'Mehr zu Mundart', href: `${B}/schweizerdeutsch` },
            },
            {
                id: 'sprachen',
                frage: 'Welche Sprachen spricht der Assistent?',
                antwort:
                    'Schweizerdeutsch, Hochdeutsch und Englisch. Sie legen fest, in welcher Sprache er begrüsst. Für Kundschaft aus Deutschland oder internationale Anrufende steht Hochdeutsch beziehungsweise Englisch bereit.',
            },
        ],
    },
    {
        id: 'telefonie',
        titel: 'Nummer, Telefonie und Einrichtung',
        eintraege: [
            {
                id: 'nummer-behalten',
                frage: 'Kann ich meine Telefonnummer behalten?',
                antwort:
                    'Ja. Sie leiten Anrufe von Ihrer bestehenden Nummer auf den Assistenten um. Ihre Kundschaft wählt weiterhin dieselbe Nummer. Wenn Sie lieber eine zusätzliche Nummer möchten, zum Beispiel nur für eine Kampagne oder einen Notfalldienst, erhalten Sie eine neue.',
            },
            {
                id: 'rufumleitung',
                frage: 'Wie funktioniert die Rufumleitung?',
                antwort:
                    'Die Umleitung richten Sie in Ihrer Telefonanlage oder bei Ihrem Anbieter ein. Je nach Anlage geht das immer, nur wenn besetzt ist, wenn nach einigen Klingeltönen niemand abnimmt, oder nur ausserhalb der Öffnungszeiten. Wir sagen Ihnen bei der Einrichtung, welche Variante zu Ihrem Betrieb passt, und helfen beim Einstellen.',
            },
            {
                id: 'vpbx',
                frage: 'Lässt sich der Assistent mit der Cloud-Telefonanlage von InfraOne verbinden?',
                antwort:
                    'Ja. Der Assistent ist an die Cloud-Telefonie von InfraOne angebunden. Wenn Ihre Telefonanlage bei uns läuft, wird er zum Baustein der Anlage: Er übernimmt dort, wo Sie es festlegen. Sie brauchen die Cloud-Telefonie von InfraOne aber nicht – eine Rufumleitung von Ihrer heutigen Nummer genügt.',
                link: { text: 'Cloud-Telefonie von InfraOne', href: '/cloud-telefonie' },
            },
            {
                id: 'einrichtungsdauer',
                frage: 'Wie lange dauert die Einrichtung?',
                antwort:
                    'Den Testassistenten aus Ihrer Website haben Sie in einer Minute. Für den Betrieb hängt die Dauer vor allem davon ab, wie schnell Wissen, Begrüssung und Regeln mit Ihnen geprüft sind und die Rufumleitung steht. Einen konkreten Termin nennen wir Ihnen im Erstgespräch.',
                link: { text: 'Ablauf der Einrichtung', href: `${B}/so-funktioniert-es` },
            },
            {
                id: 'standorte',
                frage: 'Funktioniert der Assistent für mehrere Standorte?',
                antwort:
                    'Ja. Pro Kunde sind mehrere Agenten möglich, zum Beispiel einer für die Zeit ausserhalb der Öffnungszeiten. Für Unternehmen mit mehreren Standorten und eigener Telefonanlage planen wir die Lösung gemeinsam, inklusive Anbindung an die Cloud-Telefonie von InfraOne.',
            },
        ],
    },
    {
        id: 'funktionen',
        titel: 'Funktionen im Alltag',
        eintraege: [
            {
                id: 'notfall',
                frage: 'Was passiert bei einem Notfall?',
                antwort:
                    'Sie legen fest, was als Notfall gilt, zum Beispiel ein Wasserschaden oder ein Stromausfall im ganzen Haus. Erkennt der Assistent einen solchen Fall, meldet er ihn an Ihre Notfallnummer. Alle anderen Anliegen nimmt er auf und schickt Ihnen die Notiz per E-Mail.',
                link: { text: 'Notfall und Pikett', href: `${B}/anwendungen/notfall` },
            },
            {
                id: 'oeffnungszeiten',
                frage: 'Kennt der Assistent meine Öffnungszeiten?',
                antwort:
                    'Ja. Er kennt Ihre Öffnungszeiten und gibt Anrufenden Auskunft darüber. Für die Zeit ausserhalb hinterlegen Sie einen eigenen Text, etwa mit dem Hinweis, wann Sie zurückrufen. Wenn Sie möchten, übernimmt ausserhalb der Öffnungszeiten ein eigener Agent mit anderen Regeln.',
            },
            {
                id: 'termine',
                frage: 'Kann der Assistent Termine vereinbaren?',
                antwort:
                    'Ja. Er kann Termine direkt in einen Microsoft-365-Kalender eintragen. Welche Termine er vergeben darf und welche Angaben er dafür erfragt, legen Sie fest. Die anrufende Person kann eine Bestätigung per SMS erhalten.',
                link: { text: 'Terminbuchung am Telefon', href: `${B}/anwendungen/terminbuchung` },
            },
            {
                id: 'sms',
                frage: 'Verschickt der Assistent SMS?',
                antwort:
                    'Ja, auf Wunsch eine SMS-Bestätigung an die anrufende Person, zum Beispiel mit dem vereinbarten Termin oder der Bestätigung, dass ihr Anliegen aufgenommen ist. Sie selbst erhalten nach jedem Gespräch eine Notiz per E-Mail.',
            },
            {
                id: 'weiterleiten',
                frage: 'Kann der Assistent Anrufe an eine Person weiterleiten?',
                antwort:
                    'Ja. Er kann an eine Person weiterleiten, deren Nummer Sie hinterlegen. Wann er weiterleitet und wann er das Anliegen lieber für einen Rückruf aufnimmt, bestimmen Sie.',
            },
        ],
    },
    {
        id: 'kosten',
        titel: 'Kosten und Vertrag',
        eintraege: [
            { id: 'kosten', frage: 'Was kostet der KI-Telefonassistent?', antwort: kostenAntwort, link: { text: 'Zur Preisseite', href: `${B}/preise` } },
            { id: 'kuendigung', frage: 'Gibt es eine Mindestlaufzeit, und wie kündige ich?', antwort: laufzeitAntwort },
            { id: 'minuten', frage: 'Was passiert, wenn die Gesprächsminuten aufgebraucht sind?', antwort: minutenAntwort },
        ],
    },
    {
        id: 'datenschutz',
        titel: 'Datenschutz und Sicherheit',
        eintraege: [
            {
                id: 'datenschutz',
                frage: 'Wo werden die Daten verarbeitet?',
                antwort:
                    'Der Assistent läuft auf Servern in der Schweiz, bei Infomaniak in Satigny. Die Telefonie läuft über Schweizer Provider. Für die Sprachverarbeitung setzen wir KI-Anbieter ein, Google Gemini und OpenAI, wo verfügbar in einer EU-Region. Gesprächsnotizen erhalten Sie per E-Mail.',
                link: { text: 'Sicherheit und Datenschutz', href: `${B}/sicherheit-datenschutz` },
            },
            {
                id: 'aufzeichnung',
                frage: 'Werden die Gespräche aufgezeichnet?',
                antwort:
                    'Nein. Gespräche werden nicht als Tonaufnahme gespeichert. Sie erhalten stattdessen ein Transkript und eine Zusammenfassung des Gesprächs.',
            },
            {
                id: 'training',
                frage: 'Werden meine Daten für das Training von KI verwendet?',
                antwort:
                    'Nein. Wir nutzen bezahlte Stufen der KI-Anbieter, bei denen die Daten nicht für das Training verwendet werden.',
            },
            {
                id: 'avv',
                frage: 'Erhalte ich einen Auftragsverarbeitungsvertrag?',
                antwort:
                    'Ja, auf Anfrage. Im Sinne des Schweizer Datenschutzgesetzes (DSG) sind Sie für die Daten Ihrer Anrufenden verantwortlich, InfraOne bearbeitet sie in Ihrem Auftrag. Das regeln wir in einem Auftragsverarbeitungsvertrag (AVV).',
            },
        ],
    },
    {
        id: 'testanruf',
        titel: 'Testanruf',
        eintraege: [
            {
                id: 'testanruf-kosten',
                frage: 'Was kostet der Testanruf, und wie oft kann ich testen?',
                antwort:
                    'Der Testanruf ist kostenlos und ohne Anmeldung. Sie geben Ihre Website ein, wir bauen daraus einen Assistenten und rufen Sie an. Pro Gerät sind zwei Testanrufe am Tag möglich, damit der Dienst für alle verfügbar bleibt.',
                link: { text: 'Jetzt live testen', href: B },
            },
            {
                id: 'handelsregister',
                frage: 'Warum braucht es für den Testanruf einen Handelsregister-Eintrag?',
                antwort:
                    'Der Testanruf ist für Firmen gedacht. Vor dem Anruf gleichen wir die Firma hinter der Website mit dem Schweizer Handelsregister ab, und Sie bestätigen, dass es Ihre Firma ist. So bleibt der Testanruf eingetragenen Firmen vorbehalten. Ohne aktiven Eintrag melden Sie sich am einfachsten direkt bei uns, dann zeigen wir Ihnen den Assistenten im Gespräch.',
            },
        ],
    },
];

export const ALLE_FAQ: FaqEintrag[] = FAQ_KATEGORIEN.flatMap((k) => k.eintraege);

/** Auszug für die Hub-Seite (in dieser Reihenfolge) */
export const HUB_FAQ_IDS = ['schweizerdeutsch', 'nummer-behalten', 'was-danach', 'notfall', 'fehler', 'datenschutz', 'kosten', 'testanruf-kosten'];

export function faqNachIds(ids: string[]): FaqEintrag[] {
    return ids.map((id) => {
        const f = ALLE_FAQ.find((x) => x.id === id);
        if (!f) throw new Error(`FAQ fehlt: ${id}`);
        return f;
    });
}

/** Für JSON-LD (FAQPage) */
export function faqFuerSchema(eintraege: FaqEintrag[]) {
    return eintraege.map((f) => ({ question: f.frage, answer: f.antwort }));
}
