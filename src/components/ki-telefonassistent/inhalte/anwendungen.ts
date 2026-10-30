/**
 * Anwendungen des KI-Telefonassistenten (AUFTRAG-110).
 * Je Seite: Problem, Lösung, Beispielgespräch (Mundart UND Hochdeutsch),
 * was danach passiert, für wen. Nur Fakten aus AUFTRAG-110, Abschnitt 3.
 * Alle Firmen in den Beispielen sind erfunden («Muster …»).
 *
 * AUFTRAG-113: Der Eintrag im Microsoft-365-Kalender und die SMS-Bestätigung sind in
 * Entwicklung. Einträge mit `inEntwicklung: true` bzw. dem Zusatz «(in Entwicklung, kommt
 * bald)» erscheinen mit der Badge; Sätze und Beispiele versprechen nichts davon.
 */
import type { Beispiel } from '../Gespraech';
import type { AnwendungSlug, BranchenSlug } from '../seiten';
import { inEntwicklung, KALENDER_SMS_SATZ } from '@/lib/in-entwicklung';

/** Punkt mit Titel und Text; `inEntwicklung` zeigt die Badge «In Entwicklung, kommt bald» */
export interface Punkt {
    titel: string;
    text: string;
    inEntwicklung?: boolean;
}

export interface Anwendung {
    slug: AnwendungSlug;
    /** Meta-Titel, höchstens 60 Zeichen */
    metaTitel: string;
    /** Meta-Beschreibung, 120 bis 155 Zeichen */
    metaBeschreibung: string;
    /** Name in Karten und Brotkrumen */
    name: string;
    /** ein Satz für Karten */
    teaser: string;
    h1: string;
    /** erster Absatz beantwortet die Suchfrage in zwei Sätzen */
    lead: string;
    /** AUFTRAG-113: Badge «In Entwicklung, kommt bald» im Titelbereich */
    inEntwicklung?: boolean;
    problem: { titel: string; absaetze: string[]; momente: string[] };
    loesung: { titel: string; absaetze: string[]; ablauf: Punkt[] };
    beispiel: Beispiel;
    firma: string;
    danach: { absatz: string; punkte: Punkt[]; notiz: Array<{ label: string; wert: string }> };
    fuerWen: { absatz: string; branchen: BranchenSlug[] };
    /** Einträge mit Zusatz «(in Entwicklung, kommt bald)» erscheinen mit Badge */
    festlegen: string[];
    verwandt: AnwendungSlug[];
}

export const ANWENDUNGEN: Anwendung[] = [
    /* ------------------------------------------------------------------ */
    {
        slug: 'erreichbarkeit',
        metaTitel: 'Immer erreichbar mit dem KI-Telefonassistenten | InfraOne',
        metaBeschreibung:
            'Kein Anruf läuft mehr ins Leere: Der KI-Telefonassistent nimmt ab, wenn Ihr Team keine Zeit hat – rund um die Uhr, mit Notiz per E-Mail nach jedem Anruf.',
        name: 'Erreichbarkeit',
        teaser: 'Er nimmt ab, wenn Ihr Team im Gespräch, unterwegs oder im Feierabend ist.',
        h1: 'Erreichbar sein, auch wenn gerade niemand Zeit hat',
        lead: 'Der KI-Telefonassistent nimmt Anrufe an, wenn Ihr Team im Kundengespräch, unterwegs oder im Feierabend ist – rund um die Uhr. Anrufende erreichen sofort jemanden, und Sie wissen nach jedem Gespräch per E-Mail, wer was wollte.',
        problem: {
            titel: 'Das Telefon klingelt immer im falschen Moment',
            absaetze: [
                'In kleinen Betrieben klingelt das Telefon genau dann, wenn alle beschäftigt sind. Der Elektriker steht auf der Leiter, die Praxisassistentin betreut einen Patienten, die Treuhänderin sitzt in einer Besprechung. Wer anruft, hört das Freizeichen oder einen Anrufbeantworter.',
                'Nicht alle sprechen auf Band. Wer einen Auftrag vergeben will oder ein dringendes Problem hat, versucht es beim nächsten Betrieb. Bei Ihnen bleibt im besten Fall eine unbekannte Nummer in der Anrufliste – ohne Hinweis, worum es ging und ob sich ein Rückruf lohnt.',
                'Ein zusätzlicher Empfang lohnt sich für viele kleine Betriebe nicht, und das Handy auf der Baustelle abzunehmen, ist oft weder sicher noch gut für das Gespräch mit dem Kunden vor Ort.',
            ],
            momente: [
                'während Kundenterminen, Behandlungen und Besprechungen',
                'auf der Baustelle, beim Kunden oder im Auto',
                'in der Mittagspause',
                'am Abend, am Wochenende und in den Ferien',
                'wenn mehrere Personen gleichzeitig anrufen',
            ],
        },
        loesung: {
            titel: 'So übernimmt der Assistent Ihre Erreichbarkeit',
            absaetze: [
                'Sie legen fest, wann der Assistent abnimmt: immer, nur wenn besetzt ist, wenn nach einigen Klingeltönen niemand abnimmt, oder nur ausserhalb der Öffnungszeiten. Technisch ist das eine Rufumleitung von Ihrer bestehenden Nummer. Ihre Kundschaft wählt weiterhin dieselbe Nummer.',
                'Der Assistent begrüsst mit Ihrem Firmennamen, fragt nach dem Anliegen und beantwortet, was er aus Ihrer Website und Ihren Angaben weiss. Was eine Person erledigen muss, hält er fest: Name, Firma, Anliegen und Rückrufnummer. Ausserhalb der Öffnungszeiten sagt er, wann Sie wieder erreichbar sind – mit Ihrem eigenen Text.',
            ],
            ablauf: [
                { titel: 'Anruf kommt an', text: 'Ihre Nummer klingelt wie gewohnt. Nimmt niemand ab, übernimmt der Assistent.' },
                { titel: 'Begrüssung in Ihrem Namen', text: 'Mit Ihrem Text, auf Schweizerdeutsch, Hochdeutsch oder Englisch.' },
                { titel: 'Anliegen klären', text: 'Er beantwortet Fragen oder nimmt die Angaben für den Rückruf auf.' },
                { titel: 'Notiz an Sie', text: 'Per E-Mail: Name, Anliegen, Rückrufnummer, Zusammenfassung und Transkript.' },
            ],
        },
        firma: 'Muster Elektro AG',
        beispiel: {
            situation: 'Donnerstag, kurz nach Mittag. Das Team der Muster Elektro AG ist in der Pause, eine Kundin ruft wegen einer Offerte an.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Sie sind bi de Muster Elektro AG. Ich bi de digital Assistänt. Wie chan ich Ihne hälfe?' },
                { wer: 'anrufer', text: 'Grüezi, Keller. Ich han letscht Wuche e Offerte für e Ladestation übercho und hett na es paar Frage.' },
                { wer: 'assistent', text: 'Gern. D Kollege sind grad i de Mittagspause. Söll ich en Rückruf iiträge? Under welere Nummere erreicht me Sie am beschte?' },
                { wer: 'anrufer', text: 'Uf dere, wo-n-ich grad aalüüte. Am liebschte nach de zwei.' },
                { wer: 'assistent', text: 'Guet, Frau Keller. Ich han notiert: Frage zur Offerte für d Ladestation, Rückruf nach de zwei uf die Nummere. Stimmt das so?' },
                { wer: 'anrufer', text: 'Ja, merci vilmal.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail an das Büro der Muster Elektro AG' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Tag, Sie sind mit der Muster Elektro AG verbunden. Ich bin der digitale Assistent. Wie kann ich Ihnen helfen?' },
                { wer: 'anrufer', text: 'Guten Tag, Keller. Ich habe letzte Woche eine Offerte für eine Ladestation erhalten und hätte noch ein paar Fragen.' },
                { wer: 'assistent', text: 'Gerne. Meine Kollegen sind gerade in der Mittagspause. Soll ich einen Rückruf eintragen? Unter welcher Nummer erreicht man Sie am besten?' },
                { wer: 'anrufer', text: 'Unter der Nummer, von der ich gerade anrufe. Am liebsten nach 14 Uhr.' },
                { wer: 'assistent', text: 'Gut, Frau Keller. Ich habe notiert: Fragen zur Offerte für die Ladestation, Rückruf nach 14 Uhr auf diese Nummer. Stimmt das so?' },
                { wer: 'anrufer', text: 'Ja, vielen Dank.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail an das Büro der Muster Elektro AG' },
            ],
        },
        danach: {
            absatz: 'Wenn Ihr Team aus der Pause zurück ist, liegt die Notiz bereits im Postfach. Der Rückruf beginnt nicht mit «Sie haben angerufen?», sondern mit der Antwort auf die Frage.',
            punkte: [
                { titel: 'Gesprächsnotiz per E-Mail', text: 'Name, Firma, Anliegen, Rückrufnummer und eine kurze Zusammenfassung, direkt nach dem Gespräch.' },
                { titel: 'Transkript statt Aufnahme', text: 'Das Gespräch wird nicht aufgezeichnet. Sie erhalten den Wortlaut als Text und sehen, was genau gesagt wurde.' },
                { titel: 'SMS-Bestätigung auf Wunsch', text: 'Die anrufende Person erhält künftig eine kurze Bestätigung, dass ihr Anliegen angekommen ist.', inEntwicklung: true },
            ],
            notiz: [
                { label: 'Name', wert: 'Frau Keller' },
                { label: 'Firma', wert: 'privat' },
                { label: 'Anliegen', wert: 'Fragen zur Offerte für eine Ladestation' },
                { label: 'Rückruf', wert: 'Nummer des Anrufs, nach 14 Uhr' },
                { label: 'Zusammenfassung', wert: 'Hat die Offerte letzte Woche erhalten, möchte vor dem Entscheid Fragen klären.' },
            ],
        },
        fuerWen: {
            absatz: 'Erreichbarkeit betrifft jeden Betrieb, in dem das Team nicht neben dem Telefon sitzt: Handwerk und Haustechnik, Praxen, Treuhand- und Immobilienbüros, Garagen. Besonders lohnt sie sich, wenn Anrufe Aufträge bringen und ein verpasster Anruf ein verlorener Auftrag sein kann.',
            branchen: ['elektriker', 'sanitaer-heizung', 'garage'],
        },
        festlegen: [
            'wann der Assistent abnimmt (immer, bei besetzt, nach einigen Klingeltönen, ausserhalb der Öffnungszeiten)',
            'Begrüssung und Sprache, mit der er sich meldet',
            'Ihren Text für die Zeit ausserhalb der Öffnungszeiten',
            'wer die Gesprächsnotizen per E-Mail erhält',
            inEntwicklung('ob Anrufende eine SMS-Bestätigung bekommen'),
        ],
        verwandt: ['anliegen-erfassen', 'notfall', 'auskunft'],
    },

    /* ------------------------------------------------------------------ */
    {
        slug: 'auskunft',
        metaTitel: 'Telefonische Auskunft durch den KI-Assistenten | InfraOne',
        metaBeschreibung:
            'Öffnungszeiten, Anfahrt, Leistungen, Ablauf: Der KI-Telefonassistent beantwortet wiederkehrende Fragen aus Ihrer Website – in Mundart oder Hochdeutsch.',
        name: 'Auskunft',
        teaser: 'Er beantwortet die Fragen, die Ihr Team jeden Tag mehrmals hört.',
        h1: 'Fragen beantworten, die jeden Tag gleich sind',
        lead: 'Öffnungszeiten, Anfahrt, Leistungen, Ablauf: Der KI-Telefonassistent beantwortet die Fragen, die Ihr Team täglich mehrmals hört, aus dem Wissen Ihrer Website und Ihren eigenen Angaben. Was er nicht weiss, nimmt er für einen Rückruf auf.',
        problem: {
            titel: 'Kurze Fragen, lange Unterbrechungen',
            absaetze: [
                'Jede dieser Fragen ist in einer Minute beantwortet. Zusammen zerreissen sie den Tag: Wer gerade eine Offerte rechnet, einen Patienten aufnimmt oder eine Abrechnung prüft, verliert bei jedem Anruf den Faden.',
                'Dabei steht die Antwort meist längst auf der Website. Nur sucht am Telefon niemand danach. Anrufende wollen eine kurze, klare Auskunft von jemandem, der den Betrieb kennt.',
            ],
            momente: [
                '«Haben Sie am Samstag offen?»',
                '«Wo kann ich parkieren?»',
                '«Machen Sie auch Service für Wärmepumpen?»',
                '«Was muss ich zum Termin mitbringen?»',
                '«Bis wann brauchen Sie meine Unterlagen?»',
            ],
        },
        loesung: {
            titel: 'So beantwortet der Assistent Fragen',
            absaetze: [
                'Vor dem Start lesen wir Ihre Website: Leistungen, Öffnungszeiten, Kontakt, Abläufe. Daraus entsteht das Grundwissen des Assistenten. Was nicht auf der Website steht – etwa Ihre Parkplatzsituation, was Kundinnen mitbringen sollen oder welche Marken Sie betreuen –, ergänzen Sie mit Ihren Angaben.',
                'Sie prüfen das Wissen, bevor der Assistent ans Telefon geht. Themen, die er nicht behandeln soll, schliessen Sie aus, etwa verbindliche Preisauskünfte. Fehlt ihm eine Antwort, sagt er das offen und nimmt das Anliegen auf, damit Sie zurückrufen.',
            ],
            ablauf: [
                { titel: 'Website lesen', text: 'Leistungen, Öffnungszeiten, Kontakt und Abläufe werden zum Grundwissen.' },
                { titel: 'Wissen ergänzen', text: 'Sie fügen hinzu, was nicht online steht, und schliessen Themen aus.' },
                { titel: 'Antworten im Gespräch', text: 'Frei formuliert statt vorgelesen, auf Schweizerdeutsch, Hochdeutsch oder Englisch.' },
                { titel: 'Lücken schliessen', text: 'Fehlt eine Antwort, nimmt er das Anliegen auf. Sie sehen es im Transkript und ergänzen das Wissen.' },
            ],
        },
        firma: 'Praxis Dr. Muster',
        beispiel: {
            situation: 'Mittwoch, 10.30 Uhr. In der Hausarztpraxis Dr. Muster ist Sprechstunde, ein Patient hat zwei kurze Fragen.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Praxis Dr. Muster, Sie reded mit em digitale Assistänt. Was chan ich für Sie tue?' },
                { wer: 'anrufer', text: 'Grüezi. Ich han am Friitig en Termin. Wo chan ich det parkiere?' },
                { wer: 'assistent', text: 'Hinder em Huus hätts drü Parkplätz für d Patiente. Wänn die bsetzt sind, gits es Parkhuus grad vis-à-vis.' },
                { wer: 'anrufer', text: 'Und mues ich öppis mitnäh?' },
                { wer: 'assistent', text: 'Bitte nämed Sie Ihri Versichertechärtli und, falls Sie händ, d Medikamäntelischte mit.' },
                { wer: 'anrufer', text: 'Super, merci.' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Tag, Praxis Dr. Muster, Sie sprechen mit dem digitalen Assistenten. Was kann ich für Sie tun?' },
                { wer: 'anrufer', text: 'Guten Tag. Ich habe am Freitag einen Termin. Wo kann ich dort parkieren?' },
                { wer: 'assistent', text: 'Hinter dem Haus gibt es drei Parkplätze für Patientinnen und Patienten. Sind diese besetzt, gibt es ein Parkhaus direkt gegenüber.' },
                { wer: 'anrufer', text: 'Und muss ich etwas mitbringen?' },
                { wer: 'assistent', text: 'Bitte bringen Sie Ihre Versichertenkarte und, falls vorhanden, Ihre Medikamentenliste mit.' },
                { wer: 'anrufer', text: 'Super, danke.' },
            ],
        },
        danach: {
            absatz: 'Auch reine Auskünfte landen als Notiz bei Ihnen. So sehen Sie, welche Fragen am häufigsten kommen – und wo es sich lohnt, die Website oder das Wissen des Assistenten zu ergänzen.',
            punkte: [
                { titel: 'Notiz zu jedem Gespräch', text: 'Auch wenn nichts zu tun ist: Sie sehen, wer angerufen hat und was gefragt wurde.' },
                { titel: 'Transkript und Zusammenfassung', text: 'Sie prüfen, ob die Antworten stimmen, und passen das Wissen an, wenn etwas fehlt.' },
                { titel: 'Rückruf, wenn nötig', text: 'Fragen ohne Antwort im Wissen gehen als Rückrufwunsch an Sie.' },
            ],
            notiz: [
                { label: 'Name', wert: 'nicht genannt' },
                { label: 'Anliegen', wert: 'Auskunft: Parkplätze und was zum Termin mitbringen' },
                { label: 'Rückruf', wert: 'nicht nötig' },
                { label: 'Zusammenfassung', wert: 'Fragen beantwortet aus dem freigegebenen Wissen der Praxis.' },
            ],
        },
        fuerWen: {
            absatz: 'Auskunft lohnt sich überall, wo dieselben Fragen immer wieder kommen: in Praxen mit Fragen zu Öffnungszeiten und Ablauf, in Garagen mit Fragen zu Service und Abholung, in Treuhandbüros vor Fristen und in Immobilienbüros zu Inseraten.',
            branchen: ['arztpraxis', 'garage', 'immobilien'],
        },
        festlegen: [
            'welche Inhalte Ihrer Website der Assistent verwendet',
            'Ihre Ergänzungen: Abläufe, Parkplätze, Marken, häufige Fragen',
            'Themen, die er nicht behandelt, etwa verbindliche Preise',
            'wie ausführlich er antwortet: knapp oder mit Erklärung',
        ],
        verwandt: ['erreichbarkeit', 'anliegen-erfassen', 'terminbuchung'],
    },

    /* ------------------------------------------------------------------ */
    {
        slug: 'anliegen-erfassen',
        metaTitel: 'Anliegen erfassen mit dem KI-Telefonassistenten | InfraOne',
        metaBeschreibung:
            'Name, Firma, Anliegen, Rückrufnummer: Der KI-Telefonassistent fragt nach, bis alles beisammen ist, und schickt Ihnen die Notiz mit Transkript per E-Mail.',
        name: 'Anliegen erfassen',
        teaser: 'Wer, was, wie zurückrufen: vollständig als Notiz per E-Mail.',
        h1: 'Jedes Anliegen vollständig auf dem Tisch',
        lead: 'Der KI-Telefonassistent fragt nach, bis das Wichtigste beisammen ist: wer anruft, für welche Firma, worum es geht und unter welcher Nummer die Person erreichbar ist. Nach dem Gespräch liegt alles als Notiz in Ihrem Postfach, mit Zusammenfassung und Transkript.',
        problem: {
            titel: 'Halbe Notizen kosten doppelt Zeit',
            absaetze: [
                'Eine Telefonnotiz auf dem Zettel ist schnell geschrieben und schnell verloren. Oft fehlt genau das, was man für den Rückruf braucht: die richtige Nummer, der Nachname, das eigentliche Anliegen. Auf dem Anrufbeantworter heisst es dann «Bitte rufen Sie mich zurück», und die Nummer ist unterdrückt.',
                'Der Rückruf wird so zur zweiten Runde. Man fragt nach, was man schon hätte wissen können, und gibt Anliegen im Team weiter, ohne dass jemand den ganzen Zusammenhang kennt.',
            ],
            momente: [
                'Zettel mit Vornamen und ohne Nummer',
                'Sprachnachrichten ohne Anliegen',
                'Rückrufe ohne Kontext',
                'Anliegen, die im Team hängen bleiben',
            ],
        },
        loesung: {
            titel: 'So erfasst der Assistent ein Anliegen',
            absaetze: [
                'Der Assistent führt das Gespräch so, dass am Ende vier Dinge feststehen: Name, Firma, Anliegen und Rückrufnummer. Fehlt etwas, fragt er nach – höflich und ohne Formular-Gefühl. Am Schluss fasst er zusammen, damit die anrufende Person Fehler gleich korrigieren kann.',
                'Gespräche werden nicht aufgezeichnet. Sie erhalten stattdessen eine Zusammenfassung und das Transkript. Braucht Ihr Betrieb weitere Angaben, etwa eine Einsatzadresse oder ein Fahrzeug, besprechen wir das bei der Einrichtung.',
            ],
            ablauf: [
                { titel: 'Zuhören', text: 'Die anrufende Person schildert ihr Anliegen in eigenen Worten.' },
                { titel: 'Nachfragen', text: 'Der Assistent fragt nach, was für den Rückruf fehlt.' },
                { titel: 'Zusammenfassen', text: 'Er wiederholt das Wichtigste, damit nichts falsch notiert ist.' },
                { titel: 'Zustellen', text: 'Die Notiz geht per E-Mail an die Person, die sich darum kümmert.' },
            ],
        },
        firma: 'Muster Immobilien AG',
        beispiel: {
            situation: 'Montag, 19 Uhr. Eine Mieterin meldet der Bewirtschaftung der Muster Immobilien AG einen tropfenden Wasserhahn. Kein Notfall, aber es soll nicht vergessen gehen.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Muster Immobilie AG, Sie sind mit em digitale Assistänt verbunde. Wie chan ich Ihne hälfe?' },
                { wer: 'anrufer', text: 'Grüezi, Bühler. I minere Wohnig tropft de Wasserhahne i de Chuchi, scho sit es paar Täg.' },
                { wer: 'assistent', text: 'Danke für d Mäldig, Frau Bühler. Wie isch d Adrässe vo de Wohnig?' },
                { wer: 'anrufer', text: 'Musterweg 12, im dritte Stock.' },
                { wer: 'assistent', text: 'Und wänn sind Sie am beschte erreichbar, falls de Hauswart en Termin abmache wott?' },
                { wer: 'anrufer', text: 'Am Abig, ab de sächsi.' },
                { wer: 'assistent', text: 'Ich han alles: tropfende Wasserhahne i de Chuchi, Musterweg 12, dritte Stock, Rückruf am Abig. D Bewirtschaftig meldet sich bi Ihne.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail an die Bewirtschaftung' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Tag, Muster Immobilien AG, Sie sind mit dem digitalen Assistenten verbunden. Wie kann ich Ihnen helfen?' },
                { wer: 'anrufer', text: 'Guten Tag, Bühler. In meiner Wohnung tropft der Wasserhahn in der Küche, schon seit ein paar Tagen.' },
                { wer: 'assistent', text: 'Danke für die Meldung, Frau Bühler. Wie lautet die Adresse der Wohnung?' },
                { wer: 'anrufer', text: 'Musterweg 12, im dritten Stock.' },
                { wer: 'assistent', text: 'Und wann sind Sie am besten erreichbar, falls der Hauswart einen Termin vereinbaren möchte?' },
                { wer: 'anrufer', text: 'Am Abend, ab 18 Uhr.' },
                { wer: 'assistent', text: 'Ich habe alles: tropfender Wasserhahn in der Küche, Musterweg 12, dritter Stock, Rückruf am Abend. Die Bewirtschaftung meldet sich bei Ihnen.' },
                { wer: 'hinweis', text: 'Notiz per E-Mail an die Bewirtschaftung' },
            ],
        },
        danach: {
            absatz: 'Am nächsten Morgen liegt die Meldung vollständig im Postfach der Bewirtschaftung. Wer sie bearbeitet, braucht nicht nachzufragen und kann den Hauswart direkt beauftragen.',
            punkte: [
                { titel: 'Notiz per E-Mail', text: 'Mit den vier Kernangaben und einer Zusammenfassung in wenigen Sätzen.' },
                { titel: 'Transkript', text: 'Der ganze Gesprächsverlauf als Text, falls ein Detail wichtig wird.' },
                { titel: 'SMS an die anrufende Person', text: 'Auf Wunsch eine kurze Bestätigung, dass die Meldung angekommen ist.', inEntwicklung: true },
            ],
            notiz: [
                { label: 'Name', wert: 'Frau Bühler' },
                { label: 'Firma', wert: 'Mieterin' },
                { label: 'Anliegen', wert: 'Wasserhahn in der Küche tropft seit einigen Tagen, Musterweg 12, 3. Stock' },
                { label: 'Rückruf', wert: 'Nummer des Anrufs, abends ab 18 Uhr' },
                { label: 'Zusammenfassung', wert: 'Kein Notfall. Hauswart soll Termin vereinbaren.' },
            ],
        },
        fuerWen: {
            absatz: 'Anliegen zu erfassen, steckt in vielen Gesprächen, auch wenn es eigentlich um eine Auskunft oder einen Termin geht. Besonders wertvoll ist es in Betrieben, in denen viele Meldungen ankommen und an verschiedene Personen weitergehen: Bewirtschaftungen, Haustechnik, Treuhandbüros mit mehreren Sachbearbeitenden.',
            branchen: ['immobilien', 'treuhand', 'sanitaer-heizung'],
        },
        festlegen: [
            'welche Angaben er immer erfragt (mindestens Name, Firma, Anliegen, Rückrufnummer)',
            'wer welche Notizen per E-Mail erhält',
            inEntwicklung('ob Anrufende eine SMS-Bestätigung bekommen'),
            'mit welchem Satz er das Gespräch abschliesst',
        ],
        verwandt: ['erreichbarkeit', 'notfall', 'terminbuchung'],
    },

    /* ------------------------------------------------------------------ */
    {
        slug: 'terminbuchung',
        metaTitel: 'Terminbuchung per KI-Telefonassistent | InfraOne',
        // AUFTRAG-113: Kalendereintrag und SMS-Bestätigung in Entwicklung, nichts versprechen
        metaBeschreibung:
            'Der KI-Telefonassistent nimmt Terminwünsche am Telefon auf und meldet sie Ihnen per E-Mail. Kalendereintrag und SMS-Bestätigung sind in Entwicklung.',
        name: 'Terminbuchung',
        teaser: 'Terminwünsche aufnehmen; Kalendereintrag und SMS in Entwicklung.',
        h1: 'Terminwünsche aufnehmen, während Sie arbeiten',
        lead: `Der KI-Telefonassistent nimmt Anrufe mit Terminwünschen an, wenn Ihr Team keine Zeit hat, und fragt nach Anliegen und passender Zeit. ${KALENDER_SMS_SATZ}`,
        inEntwicklung: true,
        problem: {
            titel: 'Ein Termin, drei Telefonate',
            absaetze: [
                'Ein Termin am Telefon klingt einfach. In der Praxis wird er zum Pingpong: Die Kundin ruft an, niemand ist frei, Sie rufen zurück, sie ist nicht erreichbar, sie ruft wieder an. Bis der Termin steht, haben drei Gespräche stattgefunden.',
                'Dazu kommt das Risiko der Zettelwirtschaft: Ein Terminwunsch, der auf einem Notizblock statt vollständig im Postfach landet, kann vergessen oder doppelt vergeben werden.',
            ],
            momente: [
                'Pneuwechsel und Service in der Saison',
                'Kontrolltermine und Erstgespräche',
                'Besichtigungen von Wohnungen',
                'Besprechungen zur Steuererklärung',
            ],
        },
        loesung: {
            titel: 'So nimmt der Assistent Terminwünsche auf',
            absaetze: [
                'Der Assistent fragt nach, worum es geht und wann es der anrufenden Person passen würde. Welche Arten von Terminen er aufnimmt und welche Angaben er dafür erfragt – zum Beispiel Fahrzeug, Grund des Besuchs oder Objekt –, legen Sie bei der Einrichtung fest.',
                'Am Ende des Gesprächs wiederholt er Anliegen und Wunschzeit, damit nichts falsch notiert ist. Sie erhalten wie nach jedem Gespräch eine Notiz per E-Mail und bestätigen den Termin selbst.',
                KALENDER_SMS_SATZ,
            ],
            ablauf: [
                { titel: 'Wunsch aufnehmen', text: 'Worum geht es, und wann würde es passen?' },
                { titel: 'Zusammenfassen', text: 'Er wiederholt Anliegen und Wunschzeit im Gespräch.' },
                { titel: 'Notiz an Sie', text: 'Per E-Mail, mit Zusammenfassung und Transkript.' },
                { titel: 'Kalender und SMS', text: 'Eintrag im Microsoft-365-Kalender und Bestätigung per SMS.', inEntwicklung: true },
            ],
        },
        firma: 'Garage Muster AG',
        beispiel: {
            situation: 'Sonntagabend im Oktober. Ein Kunde der Garage Muster AG will die Winterpneus montieren lassen.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Garage Muster AG, de digital Assistänt. Was chan ich für Sie tue?' },
                { wer: 'anrufer', text: 'Grüezi, Huber. Ich sött d Winterpneu montiere la.' },
                { wer: 'assistent', text: 'Gern, Herr Huber. Für weles Auto, und wänn würds Ihne passe?' },
                { wer: 'anrufer', text: 'Für en VW Golf. Am liebschte nächscht Wuche am Morge.' },
                { wer: 'assistent', text: 'Ich nimm Ihre Terminwunsch uf: Pneuwächsel für de VW Golf, nächscht Wuche am Morge. Under welere Nummere chönd mir Sie erreiche?' },
                { wer: 'anrufer', text: 'Uf dere Nummere.' },
                { wer: 'assistent', text: 'Merci, Herr Huber. D Garage meldet sich bi Ihne und bestätigt de Termin. Uf Widerhöre!' },
                { wer: 'hinweis', text: 'Terminwunsch als Notiz per E-Mail an die Werkstatt' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Tag, Garage Muster AG, der digitale Assistent. Was kann ich für Sie tun?' },
                { wer: 'anrufer', text: 'Guten Tag, Huber. Ich möchte die Winterreifen montieren lassen.' },
                { wer: 'assistent', text: 'Gerne, Herr Huber. Für welches Auto, und wann würde es Ihnen passen?' },
                { wer: 'anrufer', text: 'Für einen VW Golf. Am liebsten nächste Woche am Morgen.' },
                { wer: 'assistent', text: 'Ich nehme Ihren Terminwunsch auf: Reifenwechsel für den VW Golf, nächste Woche am Morgen. Unter welcher Nummer erreichen wir Sie?' },
                { wer: 'anrufer', text: 'Unter dieser Nummer.' },
                { wer: 'assistent', text: 'Danke, Herr Huber. Die Garage meldet sich bei Ihnen und bestätigt den Termin. Auf Wiederhören!' },
                { wer: 'hinweis', text: 'Terminwunsch als Notiz per E-Mail an die Werkstatt' },
            ],
        },
        danach: {
            absatz: 'Am Montagmorgen liegt der Terminwunsch vollständig im Postfach der Werkstatt. Sie bestätigen den Termin mit einem kurzen Rückruf, ohne nachfragen zu müssen.',
            punkte: [
                { titel: 'Notiz per E-Mail', text: 'Anliegen, Wunschzeit und Rückrufnummer, dazu Zusammenfassung und Transkript.' },
                { titel: 'Eintrag im Kalender', text: 'Im Microsoft-365-Kalender, den Sie bei der Einrichtung bestimmen.', inEntwicklung: true },
                { titel: 'SMS-Bestätigung', text: 'Datum, Uhrzeit und Anliegen für die anrufende Person.', inEntwicklung: true },
            ],
            notiz: [
                { label: 'Name', wert: 'Herr Huber' },
                { label: 'Anliegen', wert: 'Winterreifen montieren, VW Golf' },
                { label: 'Terminwunsch', wert: 'nächste Woche, am Morgen' },
                { label: 'Rückruf', wert: 'Nummer des Anrufs, Termin bestätigen' },
            ],
        },
        fuerWen: {
            absatz: 'Terminwünsche aufzunehmen, passt zu Betrieben, deren Arbeit in Terminen organisiert ist: Garagen, Praxen, Treuhandbüros, Immobilienbüros mit Besichtigungen. Für den Eintrag im Kalender, der in Entwicklung ist, braucht es Microsoft 365; wer noch nicht damit arbeitet, findet bei InfraOne auch die Umstellung.',
            branchen: ['garage', 'arztpraxis', 'treuhand'],
        },
        festlegen: [
            'welche Arten von Terminen der Assistent aufnimmt',
            'welche Angaben er für einen Termin erfragt',
            'wer die Terminwünsche per E-Mail erhält',
            inEntwicklung('welcher Microsoft-365-Kalender verwendet wird'),
            inEntwicklung('ob Anrufende eine SMS-Bestätigung erhalten'),
        ],
        verwandt: ['anliegen-erfassen', 'auskunft', 'erreichbarkeit'],
    },

    /* ------------------------------------------------------------------ */
    {
        slug: 'notfall',
        metaTitel: 'Notfälle und Pikett mit dem KI-Telefonassistenten | InfraOne',
        metaBeschreibung:
            'Der KI-Telefonassistent unterscheidet nach Ihren Regeln Notfall und normales Anliegen und meldet Notfälle sofort an Ihre Notfallnummer – auch nachts.',
        name: 'Notfall und Pikett',
        teaser: 'Notfälle sofort an die Notfallnummer, alles andere als Notiz.',
        h1: 'Notfälle erkennen und sofort weitermelden',
        lead: 'Der KI-Telefonassistent unterscheidet nach Ihren Regeln zwischen Notfall und normalem Anliegen. Notfälle meldet er sofort an Ihre Notfallnummer, alles andere landet als Notiz in Ihrem Postfach – auch nachts und am Wochenende.',
        problem: {
            titel: 'Pikett heisst heute: jeder Anruf weckt',
            absaetze: [
                'Wer Pikettdienst hat, nimmt jeden Anruf an, denn es könnte ein Notfall sein. Oft ist es keiner: eine Offertanfrage um 21 Uhr, eine Rückfrage zur Rechnung am Sonntag, ein tropfender Wasserhahn, der bis Montag warten kann.',
                'Umgekehrt darf ein echter Notfall nicht auf dem Anrufbeantworter landen. Ein Rohrbruch, eine ausgefallene Heizung im Winter oder ein Stromausfall im ganzen Haus brauchen sofort jemanden, der entscheidet.',
            ],
            momente: [
                'Rohrbruch und Wasserschaden',
                'Heizungsausfall im Winter',
                'Stromausfall im ganzen Haus',
                'ausgefallene Kühlung im Gewerbe',
            ],
        },
        loesung: {
            titel: 'So trennt der Assistent Notfall und Anliegen',
            absaetze: [
                'Sie legen fest, was als Notfall gilt, mit Beispielen aus Ihrem Alltag. Erkennt der Assistent einen solchen Fall, meldet er ihn sofort an Ihre Notfallnummer und nimmt die nötigen Angaben auf. Alles andere erfasst er als Anliegen und schickt es per E-Mail.',
                'So klingelt das Pikett-Telefon für die Fälle, für die es da ist. Die übrigen Anrufe sind trotzdem nicht verloren: Am Morgen liegen sie vollständig im Postfach. Hinweise, die Anrufende bis zum Eintreffen beachten sollen, hinterlegen Sie selbst.',
            ],
            ablauf: [
                { titel: 'Anliegen hören', text: 'Der Assistent lässt sich schildern, was passiert ist.' },
                { titel: 'Einordnen', text: 'Nach Ihren Regeln: Notfall oder normales Anliegen.' },
                { titel: 'Notfall melden', text: 'Sofort an Ihre Notfallnummer, mit Name, Adresse und Rückrufnummer.' },
                { titel: 'Alles andere notieren', text: 'Als Notiz per E-Mail für den nächsten Arbeitstag.' },
            ],
        },
        firma: 'Muster Haustechnik GmbH',
        beispiel: {
            situation: 'Samstag, 23 Uhr. Bei einem Kunden der Muster Haustechnik GmbH ist im Keller ein Rohr geplatzt.',
            mundart: [
                { wer: 'assistent', text: 'Grüezi, Muster Haustechnik GmbH, de digital Assistänt. Wie chan ich Ihne hälfe?' },
                { wer: 'anrufer', text: 'Bi üs im Chäller isch es Rohr gplatzt, s Wasser lauft überall!' },
                { wer: 'assistent', text: 'Das isch en Notfall. Ich mäld Sie grad bim Pikettdienscht. Wie isch Ihre Name und Ihri Adrässe?' },
                { wer: 'anrufer', text: 'Brunner, Musterstrass 5 z Seuzach.' },
                { wer: 'assistent', text: 'Danke, Herr Brunner. De Pikettdienscht isch informiert und rüeft Sie uf dere Nummere aa. Wänn Sie de Hauptwasserhahne finded, dräied Sie en bitte zue.' },
                { wer: 'hinweis', text: 'Meldung an die Notfallnummer, Notiz per E-Mail' },
            ],
            hochdeutsch: [
                { wer: 'assistent', text: 'Guten Abend, Muster Haustechnik GmbH, der digitale Assistent. Wie kann ich Ihnen helfen?' },
                { wer: 'anrufer', text: 'Bei uns im Keller ist ein Rohr geplatzt, das Wasser läuft überall!' },
                { wer: 'assistent', text: 'Das ist ein Notfall. Ich melde Sie sofort beim Pikettdienst. Wie lauten Ihr Name und Ihre Adresse?' },
                { wer: 'anrufer', text: 'Brunner, Musterstrasse 5 in Seuzach.' },
                { wer: 'assistent', text: 'Danke, Herr Brunner. Der Pikettdienst ist informiert und ruft Sie auf dieser Nummer an. Wenn Sie den Hauptwasserhahn finden, drehen Sie ihn bitte zu.' },
                { wer: 'hinweis', text: 'Meldung an die Notfallnummer, Notiz per E-Mail' },
            ],
        },
        danach: {
            absatz: 'Der Pikettdienst erhält die Meldung mit allen Angaben und kann direkt zurückrufen. Das Büro sieht am Montag in der Notiz, was in der Nacht passiert ist.',
            punkte: [
                { titel: 'Meldung an die Notfallnummer', text: 'Sofort, mit Name, Adresse und Rückrufnummer.' },
                { titel: 'Notiz per E-Mail', text: 'Für das Büro, mit Zusammenfassung und Transkript.' },
                { titel: 'SMS auf Wunsch', text: 'Die anrufende Person erhält künftig eine Bestätigung, dass die Meldung angekommen ist.', inEntwicklung: true },
            ],
            notiz: [
                { label: 'Name', wert: 'Herr Brunner' },
                { label: 'Anliegen', wert: 'NOTFALL: Rohrbruch im Keller, Musterstrasse 5, Seuzach' },
                { label: 'Meldung', wert: 'an die Notfallnummer weitergegeben' },
                { label: 'Rückruf', wert: 'Nummer des Anrufs' },
            ],
        },
        fuerWen: {
            absatz: 'Die Notfallmeldung ist für Betriebe gedacht, die einen Pikettdienst führen oder deren Kundschaft nachts und am Wochenende Hilfe braucht: Sanitär und Heizung, Elektro, Bewirtschaftungen. In Arztpraxen legen Sie fest, dass der Assistent bei medizinischen Notfällen auf die Notrufnummer 144 verweist.',
            branchen: ['sanitaer-heizung', 'elektriker', 'immobilien'],
        },
        festlegen: [
            'was als Notfall gilt, mit Beispielen aus Ihrem Alltag',
            'die Notfallnummer, an die der Assistent meldet',
            'welche Angaben er bei einem Notfall erfragt',
            'Hinweise, die Anrufende bis zum Eintreffen beachten sollen',
        ],
        verwandt: ['erreichbarkeit', 'anliegen-erfassen', 'auskunft'],
    },
];

export function anwendung(slug: string): Anwendung | undefined {
    return ANWENDUNGEN.find((a) => a.slug === slug);
}
