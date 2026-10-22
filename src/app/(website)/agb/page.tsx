import { Metadata } from 'next';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'AGB | Allgemeine Geschäftsbedingungen',
    description:
        'Allgemeine Geschäftsbedingungen der InfraOne IT Solutions GmbH für IT-Support, Netzwerke, Cloud, Cloud-Telefonie, Webdesign, Software, Digital Signage und Videoüberwachung.',
    alternates: {
        canonical: 'https://infraone.ch/agb',
    },
};

const STAND = '8. Oktober 2026';

interface Abschnitt {
    id: string;
    titel: string;
    ziffern: string[];
}

interface Teil {
    titel: string;
    einleitung?: string;
    abschnitte: Abschnitt[];
}

// Ziffern werden fortlaufend nummeriert (1.1, 1.2 ...). Neue Klauseln einfach
// im passenden Abschnitt ergänzen, die Nummerierung passt sich automatisch an.
const teile: Teil[] = [
    {
        titel: 'Teil A: Allgemeine Bestimmungen',
        abschnitte: [
            {
                id: 'geltungsbereich',
                titel: 'Geltungsbereich und Vertragsbestandteile',
                ziffern: [
                    'Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für sämtliche Verträge, Angebote und Leistungen der InfraOne IT Solutions GmbH, Rudolf-Diesel-Strasse 25, 8404 Winterthur (nachfolgend «InfraOne»), gegenüber ihren Kundinnen und Kunden (nachfolgend «Kunde»). Sie gelten für alle Geschäftsbereiche, insbesondere IT-Support und IT-Betreuung, IT-Netzwerke und Hardware, Cloud-Dienste, Cloud-Telefonie, Webdesign, Software-Entwicklung, Digital Signage und Videoüberwachung.',
                    'Teil A gilt für alle Leistungen. Teil B enthält ergänzende Bestimmungen für einzelne Geschäftsbereiche. Bei Widersprüchen gilt folgende Rangordnung: (1) individuelle schriftliche Vereinbarung oder Vertrag, (2) Angebot bzw. Auftragsbestätigung, (3) Service Level Agreement (SLA), (4) Teil B dieser AGB, (5) Teil A dieser AGB, (6) die jeweils gültige Preisliste.',
                    'Abweichende Geschäftsbedingungen des Kunden gelten nur, wenn InfraOne ihnen ausdrücklich und schriftlich zugestimmt hat. Dies gilt auch dann, wenn InfraOne in Kenntnis solcher Bedingungen Leistungen erbringt.',
                    'Mit der Auftragserteilung, der Unterzeichnung eines Angebots, der Bestellung über die Website oder der Entgegennahme von Leistungen anerkennt der Kunde diese AGB in der zum Zeitpunkt des Vertragsschlusses gültigen Fassung.',
                    'Soweit gesetzliche Bestimmungen zum Schutz von Konsumentinnen und Konsumenten zwingend sind, gehen diese den vorliegenden AGB vor.',
                ],
            },
            {
                id: 'vertragsschluss',
                titel: 'Angebote und Vertragsschluss',
                ziffern: [
                    'Angebote von InfraOne sind während 30 Tagen ab Ausstellungsdatum gültig, sofern im Angebot nichts anderes angegeben ist. Preisangaben auf der Website, in Kostenrechnern und in Prospekten sind unverbindliche Richtwerte und stellen kein verbindliches Angebot dar.',
                    'Ein Vertrag kommt zustande durch schriftliche oder elektronische Annahme eines Angebots, durch Auftragsbestätigung von InfraOne oder durch Beginn der Leistungserbringung auf Wunsch des Kunden. Telefonisch oder per E-Mail erteilte Aufträge für Supporteinsätze sind gültig.',
                    'Kostenschätzungen und Richtofferten sind unverbindlich. Zeichnet sich ab, dass eine Kostenschätzung um mehr als 15 % überschritten wird, informiert InfraOne den Kunden vorgängig. Verbindliche Pauschal- oder Festpreise gelten nur, wenn sie ausdrücklich als solche bezeichnet sind.',
                    'Änderungen und Ergänzungen des Leistungsumfangs nach Vertragsschluss (Change Requests) bedürfen der Schriftform (E-Mail genügt) und werden nach Aufwand zu den gültigen Stundensätzen verrechnet, sofern nichts anderes vereinbart ist.',
                ],
            },
            {
                id: 'leistungen',
                titel: 'Leistungserbringung',
                ziffern: [
                    'InfraOne erbringt ihre Leistungen sorgfältig, fachgerecht und nach dem jeweils anerkannten Stand der Technik. Geschuldet ist, soweit nicht ausdrücklich ein Werkerfolg vereinbart ist (z. B. eine Website oder eine Installation mit Abnahme), eine sorgfältige Tätigkeit im Sinne des Auftragsrechts (Art. 394 ff. OR), nicht ein bestimmter Erfolg.',
                    'InfraOne kann Leistungen remote (per Fernwartung) oder vor Ort erbringen und wählt die zweckmässige Form, sofern nichts anderes vereinbart ist.',
                    'InfraOne ist berechtigt, für die Leistungserbringung sorgfältig ausgewählte Subunternehmer und Drittanbieter beizuziehen. Bei Leistungen von Drittanbietern (z. B. Microsoft, peoplefone, Swisscom, Hosting- und Rechenzentrumsbetreiber, Hersteller von Hard- und Software) handelt InfraOne als Vermittlerin oder Wiederverkäuferin. Es gelten ergänzend die Vertrags- und Lizenzbedingungen des jeweiligen Drittanbieters, die der Kunde mit der Bestellung akzeptiert.',
                    'Termine und Fristen sind nur verbindlich, wenn sie ausdrücklich schriftlich als verbindlich bezeichnet wurden. Verzögerungen, die auf fehlende Mitwirkung des Kunden, Lieferengpässe von Herstellern, Drittanbieter oder höhere Gewalt zurückzuführen sind, verlängern die Fristen angemessen und berechtigen InfraOne zur Verrechnung des entstandenen Mehraufwands.',
                    'Reaktionszeiten und Verfügbarkeiten sind nur garantiert, wenn sie in einem SLA ausdrücklich vereinbart sind. Ohne SLA erfolgen Einsätze ausserhalb der Bürozeiten im Rahmen der verfügbaren Kapazitäten (Best Effort).',
                ],
            },
            {
                id: 'mitwirkung',
                titel: 'Mitwirkungspflichten des Kunden',
                ziffern: [
                    'Der Kunde stellt InfraOne rechtzeitig, vollständig und unentgeltlich alle für die Leistungserbringung erforderlichen Informationen, Zugänge, Zugangsdaten, Lizenzen, Räumlichkeiten, Stromanschlüsse und Ansprechpersonen zur Verfügung.',
                    'Der Kunde ist für seine Daten selbst verantwortlich. Er stellt insbesondere vor jedem Eingriff von InfraOne (Installation, Update, Migration, Reparatur, Austausch von Hardware) sicher, dass eine aktuelle und vollständige Datensicherung vorhanden ist, sofern die Datensicherung nicht ausdrücklich als Leistung von InfraOne vereinbart wurde.',
                    'Der Kunde ist verantwortlich für die rechtmässige Nutzung der von ihm eingesetzten Software (gültige Lizenzen), für die Inhalte, die er über die Systeme verarbeitet oder veröffentlicht, sowie für die Geheimhaltung seiner Passwörter und Zugangsdaten.',
                    'Der Kunde meldet Störungen, Mängel und Sicherheitsvorfälle unverzüglich und so konkret wie möglich. Er befolgt die Sicherheitsempfehlungen von InfraOne (z. B. Updates, Mehrfaktor-Authentifizierung, Ersatz veralteter Systeme). Lehnt der Kunde empfohlene Massnahmen ab, trägt er die daraus entstehenden Risiken.',
                    'Kommt der Kunde seinen Mitwirkungspflichten nicht oder nicht rechtzeitig nach, sind Wartezeiten, zusätzliche Anfahrten und Mehraufwand nach Aufwand zu den gültigen Ansätzen zu bezahlen. InfraOne ist in diesem Fall nicht für Verzögerungen oder Folgen verantwortlich.',
                ],
            },
            {
                id: 'preise',
                titel: 'Preise, Stundensätze und Verrechnung',
                ziffern: [
                    'Massgebend sind die im Angebot vereinbarten Preise, ansonsten die zum Zeitpunkt der Leistungserbringung gültige Preisliste von InfraOne, die auf infraone.ch veröffentlicht ist. Alle Preise verstehen sich in Schweizer Franken (CHF) und exklusive Mehrwertsteuer, sofern nicht ausdrücklich anders angegeben.',
                    'Leistungen nach Aufwand werden im 15-Minuten-Takt verrechnet. Es gelten die in der Preisliste genannten Mindestverrechnungen (Remote-Support 15 Minuten, Vor-Ort-Einsätze 30 Minuten). Reisezeit und Anfahrt werden gemäss Preisliste verrechnet.',
                    'Für Einsätze ausserhalb der Bürozeiten gelten folgende Zuschläge auf den jeweiligen Stundensatz: Montag bis Freitag 17:00 bis 23:00 Uhr +25 %, Samstag, Sonntag und gesetzliche Feiertage +50 %, 23:00 bis 08:00 Uhr +100 % (nur mit SLA). Massgebend ist der Zeitpunkt der Leistungserbringung. Auf ausdrücklichen Wunsch des Kunden als dringend erbrachte Leistungen können als solche verrechnet werden.',
                    'Spesen, Material, Ersatzteile, Lizenzen, Gebühren von Drittanbietern sowie Versand- und Entsorgungskosten werden zusätzlich verrechnet, sofern sie nicht ausdrücklich im Preis enthalten sind.',
                    'Wiederkehrende Entgelte (z. B. Betreuungspauschalen, Lizenzen, Cloud- und Telefoniedienste, Hosting, Wartung) werden im Voraus für die vereinbarte Abrechnungsperiode in Rechnung gestellt. Bei Beginn oder Ende während einer Periode wird anteilsmässig abgerechnet, sofern die Bedingungen des Drittanbieters dies zulassen.',
                ],
            },
            {
                id: 'preisanpassungen',
                titel: 'Anpassung von Stundensätzen und Preisen, Teuerungsausgleich',
                ziffern: [
                    'InfraOne kann ihre Stundensätze und die Preisliste für Leistungen nach Aufwand jederzeit anpassen. Neue Ansätze gelten für Leistungen, die ab dem Zeitpunkt der Veröffentlichung bzw. Mitteilung erbracht werden. Bereits schriftlich bestätigte Angebote und Festpreise bleiben bis zu ihrem Ablauf unverändert.',
                    'Teuerungsausgleich: Bei Dauerschuldverhältnissen (insbesondere Betreuungs-, Wartungs-, Hosting-, Cloud- und Telefonieverträgen) ist InfraOne berechtigt, die wiederkehrenden Entgelte einmal jährlich, jeweils per 1. Januar, an die Entwicklung des Landesindexes der Konsumentenpreise (LIK) des Bundesamts für Statistik anzupassen. Massgebend ist die Veränderung des Indexstands von September des Vorjahres gegenüber dem Indexstand bei Vertragsschluss bzw. bei der letzten Anpassung. Eine Anpassung erfolgt nur bei positiver Teuerung. Teuerungsanpassungen werden mindestens 30 Tage im Voraus schriftlich (E-Mail genügt) angekündigt und berechtigen nicht zur ausserordentlichen Kündigung.',
                    'Weitergabe von Drittkosten: Erhöhen Hersteller, Lizenzgeber oder Drittanbieter (z. B. Microsoft, peoplefone, Hosting- und Domainanbieter) ihre Preise, oder ändern sich Wechselkurse, Gebühren oder Abgaben, kann InfraOne die betroffenen Entgelte im entsprechenden Umfang anpassen. Die Anpassung wird dem Kunden so früh wie möglich, in der Regel mindestens 30 Tage im Voraus, mitgeteilt.',
                    'Übrige Preiserhöhungen bei Dauerschuldverhältnissen kündigt InfraOne mindestens 60 Tage vor Inkrafttreten schriftlich an. Ist der Kunde mit einer solchen Erhöhung nicht einverstanden, kann er den betroffenen Vertragsteil auf den Zeitpunkt des Inkrafttretens kündigen. Unterlässt er dies, gilt die Anpassung als genehmigt.',
                    'Ändert sich der Mehrwertsteuersatz, werden die Preise per Inkrafttreten automatisch angepasst. Dies gilt nicht als Preiserhöhung.',
                ],
            },
            {
                id: 'zahlung',
                titel: 'Zahlungsbedingungen und Zahlungsverzug',
                ziffern: [
                    'Rechnungen sind innert 30 Tagen ab Rechnungsdatum ohne Abzug zahlbar, sofern nichts anderes vereinbart ist. Bei Privatkunden und bei Erstaufträgen kann InfraOne Barzahlung, Vorauszahlung oder eine Anzahlung verlangen. Für Hardware- und Lizenzbestellungen sowie für Projekte kann InfraOne eine Anzahlung von bis zu 50 % verlangen.',
                    'Bei Projekten mit einer Dauer von mehr als einem Monat ist InfraOne berechtigt, erbrachte Leistungen monatlich oder nach Projektphasen in Rechnung zu stellen.',
                    'Nach Ablauf der Zahlungsfrist gerät der Kunde ohne weitere Mahnung in Verzug. Ab Verzug ist ein Verzugszins von 5 % pro Jahr geschuldet. Für jede Mahnung ab der zweiten kann eine Bearbeitungsgebühr von CHF 30 erhoben werden. Inkasso- und Betreibungskosten gehen zu Lasten des Kunden.',
                    'Bei Zahlungsverzug ist InfraOne nach erfolgloser Mahnung mit einer Frist von mindestens 10 Tagen berechtigt, weitere Leistungen zurückzubehalten und laufende Dienste (z. B. Cloud-, Telefonie-, Hosting- und Lizenzdienste) ganz oder teilweise zu sperren. Die Entgelte bleiben während der Sperre geschuldet. Für die Reaktivierung kann eine Gebühr nach Aufwand erhoben werden. Notrufe bleiben, soweit technisch möglich, von einer Telefoniesperre ausgenommen.',
                    'Beanstandungen von Rechnungen sind innert 14 Tagen nach Rechnungsdatum schriftlich und begründet anzubringen. Andernfalls gilt die Rechnung als genehmigt. Unbestrittene Rechnungsteile sind fristgerecht zu bezahlen.',
                    'Der Kunde ist nicht berechtigt, Forderungen von InfraOne mit eigenen Gegenforderungen zu verrechnen, es sei denn, die Gegenforderung ist von InfraOne schriftlich anerkannt oder rechtskräftig festgestellt.',
                ],
            },
            {
                id: 'eigentum',
                titel: 'Eigentumsvorbehalt und Rechte an Arbeitsergebnissen',
                ziffern: [
                    'Gelieferte Hardware und Waren bleiben bis zur vollständigen Bezahlung Eigentum von InfraOne. InfraOne ist berechtigt, den Eigentumsvorbehalt im Eigentumsvorbehaltsregister eintragen zu lassen (Art. 715 ZGB). Der Kunde wirkt dabei mit.',
                    'Sofern nichts anderes vereinbart ist, erhält der Kunde an individuell für ihn erstellten Arbeitsergebnissen (z. B. Konfigurationen, Skripte, Dokumentationen, Designs, Websites, Software) nach vollständiger Bezahlung ein nicht ausschliessliches, zeitlich unbeschränktes und übertragbares Recht zur Nutzung für den vertraglich vorgesehenen Zweck. Urheberrechte und weitere Immaterialgüterrechte verbleiben bei InfraOne bzw. den jeweiligen Rechteinhabern.',
                    'InfraOne bleibt berechtigt, allgemeines Know-how, Methoden, Vorlagen, Programmbausteine und Werkzeuge, die bei der Leistungserbringung entstehen oder verwendet werden, weiterhin frei zu nutzen.',
                    'Für Software, Lizenzen und Dienste Dritter gelten ausschliesslich die Lizenzbedingungen des jeweiligen Herstellers bzw. Anbieters.',
                ],
            },
            {
                id: 'gewaehrleistung',
                titel: 'Gewährleistung',
                ziffern: [
                    'Bei Werkleistungen (z. B. Websites, Software, Installationen) prüft der Kunde das Ergebnis nach Übergabe bzw. Inbetriebnahme. Mängel sind innert 10 Arbeitstagen nach Übergabe schriftlich und nachvollziehbar zu melden. Verdeckte Mängel sind sofort nach ihrer Entdeckung zu melden. Erfolgt innert dieser Frist keine Mängelrüge oder nutzt der Kunde das Ergebnis produktiv, gilt die Leistung als abgenommen.',
                    'Bei rechtzeitig gemeldeten und von InfraOne zu vertretenden Mängeln hat InfraOne das Recht, den Mangel innert angemessener Frist kostenlos nachzubessern. Schlägt die Nachbesserung zweimal fehl, kann der Kunde eine angemessene Minderung verlangen oder, bei erheblichen Mängeln, die die Nutzung für den vereinbarten Zweck verunmöglichen, vom betroffenen Vertragsteil zurücktreten. Weitere Gewährleistungsansprüche sind, soweit gesetzlich zulässig, ausgeschlossen.',
                    'Die Gewährleistungsfrist für Werkleistungen beträgt 12 Monate ab Abnahme. Für Hardware und Waren gilt gegenüber Geschäftskunden die Garantie des Herstellers; InfraOne leitet Garantiefälle an den Hersteller weiter. Gegenüber Konsumentinnen und Konsumenten gelten die zwingenden gesetzlichen Fristen (Art. 210 Abs. 4 OR). Arbeitsaufwand für Diagnose, Aus- und Einbau sowie Transport im Garantiefall kann verrechnet werden, sofern der Mangel nicht von InfraOne zu vertreten ist.',
                    'Keine Gewährleistung besteht für Mängel, die auf unsachgemässe Bedienung, Eingriffe des Kunden oder Dritter, Viren und Schadsoftware, Überspannung, äussere Einflüsse, ungeeignete Betriebsumgebung, Software oder Dienste Dritter sowie normale Abnutzung zurückzuführen sind.',
                    'InfraOne gewährleistet nicht, dass Software, Systeme und Dienste jederzeit unterbruchs- und fehlerfrei funktionieren oder dass sämtliche Sicherheitslücken und Angriffe verhindert werden können.',
                ],
            },
            {
                id: 'haftung',
                titel: 'Haftung',
                ziffern: [
                    'InfraOne haftet für Schäden, die sie dem Kunden absichtlich oder grobfahrlässig zufügt, nach den gesetzlichen Bestimmungen. Ebenso unbeschränkt haftet InfraOne für Personenschäden sowie nach dem Produktehaftpflichtgesetz.',
                    'Für leichte Fahrlässigkeit ist die Haftung, soweit gesetzlich zulässig, ausgeschlossen. Wo ein Ausschluss nicht zulässig ist, ist die Haftung pro Schadenereignis und insgesamt pro Kalenderjahr auf die vom Kunden in den letzten 12 Monaten für die betroffene Leistung bezahlte Vergütung beschränkt, höchstens jedoch auf CHF 10’000.',
                    'Die Haftung für indirekte Schäden und Folgeschäden, insbesondere entgangenen Gewinn, Betriebsunterbruch, Produktionsausfall, nicht realisierte Einsparungen, Ansprüche Dritter sowie Reputationsschäden, ist im gesetzlich zulässigen Umfang ausgeschlossen.',
                    'Datenverlust: Der Kunde ist für die regelmässige Sicherung seiner Daten selbst verantwortlich (Ziffer 4.2). Für den Verlust oder die Beschädigung von Daten haftet InfraOne nur bei Absicht oder grober Fahrlässigkeit und nur im Umfang des Aufwands, der für die Wiederherstellung der Daten aus einer ordnungsgemäss erstellten, aktuellen Datensicherung des Kunden erforderlich ist. Dies gilt auch dann, wenn InfraOne mit der Einrichtung oder Überwachung einer Datensicherung beauftragt ist; InfraOne haftet in diesem Fall für die sorgfältige Einrichtung und Überwachung, nicht aber für die Wiederherstellbarkeit jeder einzelnen Datei.',
                    'Drittanbieter: InfraOne haftet nicht für Leistungen, Ausfälle, Störungen, Datenverluste, Sicherheitsvorfälle, Preis- und Leistungsänderungen oder die Einstellung von Diensten durch Drittanbieter, Hersteller, Lizenzgeber, Rechenzentren, Hosting-, Telekommunikations- und Internetanbieter (z. B. Microsoft, peoplefone, Swisscom, Hosting-Provider). Ebenso wenig haftet InfraOne für Störungen des Internets, des Strom- oder Telekommunikationsnetzes. Allfällige Ansprüche richten sich nach den Bedingungen des jeweiligen Drittanbieters; InfraOne unterstützt den Kunden bei deren Geltendmachung.',
                    'Cyberangriffe: InfraOne haftet nicht für Schäden durch Schadsoftware, Ransomware, Hacking, Phishing, Social Engineering oder andere rechtswidrige Handlungen Dritter, sofern InfraOne nicht grobfahrlässig vereinbarte Schutzmassnahmen unterlassen hat. Dem Kunden wird empfohlen, eine Cyberversicherung abzuschliessen.',
                    'Die Haftung für Hilfspersonen und beigezogene Subunternehmer ist im gesetzlich zulässigen Umfang (Art. 101 Abs. 2 OR) ausgeschlossen.',
                    'Schadenersatzansprüche verjähren 12 Monate nach Kenntnis des Schadens, spätestens jedoch 2 Jahre nach der schädigenden Handlung, soweit das Gesetz nicht zwingend etwas anderes vorsieht.',
                ],
            },
            {
                id: 'hoehere-gewalt',
                titel: 'Höhere Gewalt',
                ziffern: [
                    'InfraOne wird von ihren Leistungspflichten befreit, solange und soweit die Leistungserbringung durch Ereignisse höherer Gewalt verunmöglicht oder unzumutbar erschwert wird. Dazu zählen insbesondere Naturereignisse, Epidemien, Krieg, Terror, behördliche Anordnungen, Streik, Stromausfälle, grossflächige Netzstörungen, Cyberangriffe auf Drittanbieter sowie Liefer- und Leistungsausfälle von Herstellern und Vorlieferanten.',
                    'Dauert ein solches Ereignis länger als 60 Tage, können beide Parteien den betroffenen Vertragsteil ohne Entschädigungsfolgen kündigen. Bereits erbrachte Leistungen sind zu vergüten.',
                ],
            },
            {
                id: 'vertraulichkeit',
                titel: 'Vertraulichkeit und Datenschutz',
                ziffern: [
                    'Die Parteien behandeln alle Informationen, die ihnen im Rahmen der Zusammenarbeit zur Kenntnis gelangen und weder offenkundig noch allgemein zugänglich sind, vertraulich. Diese Pflicht besteht auch nach Vertragsende fort. Vorbehalten bleiben gesetzliche Auskunftspflichten und behördliche Anordnungen.',
                    'InfraOne bearbeitet Personendaten nach dem Schweizer Datenschutzgesetz (DSG). Bearbeitet InfraOne im Auftrag des Kunden Personendaten (z. B. bei Betreuung, Cloud- und Hostingdiensten), handelt sie als Auftragsbearbeiterin im Sinne von Art. 9 DSG. Sie bearbeitet diese Daten nur so, wie der Kunde es selbst tun dürfte, und trifft angemessene technische und organisatorische Sicherheitsmassnahmen. Auf Wunsch schliessen die Parteien einen separaten Auftragsbearbeitungsvertrag ab.',
                    'Der Kunde bleibt für die Rechtmässigkeit der Bearbeitung seiner Daten verantwortlich, insbesondere für die Information der betroffenen Personen und, falls erforderlich, deren Einwilligung.',
                    'Bei Cloud-Diensten können Daten je nach gewähltem Anbieter auch ausserhalb der Schweiz gespeichert werden. InfraOne informiert auf Anfrage über den Speicherort. Details enthält die Datenschutzerklärung auf infraone.ch/datenschutz.',
                ],
            },
            {
                id: 'fernwartung',
                titel: 'Fernwartung und Zugriff auf Systeme',
                ziffern: [
                    'Der Kunde erlaubt InfraOne, für die vereinbarten Leistungen per Fernwartungssoftware auf seine Systeme zuzugreifen. Bei Ad-hoc-Sitzungen erfolgt der Zugriff nur nach Freigabe durch den Kunden. Bei Betreuungsverträgen mit Monitoring kann der Kunde einen permanenten Zugriff (unbeaufsichtigter Zugang) freigeben.',
                    'InfraOne verwendet Zugangsdaten des Kunden ausschliesslich zur Leistungserbringung und bewahrt sie geschützt auf. Der Kunde ist berechtigt und nach Vertragsende angehalten, die Zugangsdaten zu ändern.',
                ],
            },
            {
                id: 'laufzeit',
                titel: 'Vertragsdauer und Kündigung',
                ziffern: [
                    'Einzelaufträge enden mit der Erbringung der vereinbarten Leistung.',
                    'Dauerverträge beginnen mit dem vereinbarten Datum und laufen auf unbestimmte Zeit, sofern keine Mindestlaufzeit vereinbart ist. Ist eine Mindestlaufzeit vereinbart, ist eine ordentliche Kündigung frühestens auf deren Ablauf möglich. Danach läuft der Vertrag auf unbestimmte Zeit weiter.',
                    'Sofern im Angebot oder in Teil B nichts anderes geregelt ist, können Dauerverträge von beiden Parteien schriftlich unter Einhaltung einer Frist von 3 Monaten auf das Ende eines Kalendermonats gekündigt werden. Kündigungsfristen und Mindestlaufzeiten von Drittanbietern (z. B. Jahreslizenzen von Microsoft) gehen vor und werden dem Kunden im Angebot mitgeteilt.',
                    'Das Recht zur fristlosen Kündigung aus wichtigem Grund bleibt vorbehalten. Ein wichtiger Grund liegt für InfraOne insbesondere vor bei Zahlungsverzug von mehr als 30 Tagen trotz Mahnung, bei Konkurs oder Nachlassstundung des Kunden sowie bei rechtswidriger Nutzung der Dienste.',
                    'Kündigt der Kunde einen Vertrag mit Mindestlaufzeit vorzeitig oder wird der Vertrag aus einem vom Kunden zu vertretenden Grund vorzeitig aufgelöst, schuldet er die Entgelte bis zum Ablauf der Mindestlaufzeit sowie allfällige Kosten von Drittanbietern. Bei Aufträgen gemäss Art. 404 OR bleibt eine Entschädigung für eine Kündigung zur Unzeit vorbehalten.',
                    'Bei Vertragsende unterstützt InfraOne den Kunden auf Wunsch bei der geordneten Übergabe an einen Nachfolger (Herausgabe von Dokumentationen, Zugangsdaten und Daten in einem gängigen Format). Dieser Aufwand wird nach Aufwand verrechnet. Daten des Kunden, die bei InfraOne gespeichert sind, werden 30 Tage nach Vertragsende gelöscht, sofern keine gesetzliche Aufbewahrungspflicht besteht oder der Kunde vorher die Herausgabe verlangt.',
                ],
            },
            {
                id: 'schlussbestimmungen',
                titel: 'Schlussbestimmungen',
                ziffern: [
                    'Änderungen der AGB: InfraOne kann diese AGB jederzeit ändern. Für bestehende Dauerverträge werden Änderungen mindestens 30 Tage vor Inkrafttreten schriftlich mitgeteilt (E-Mail genügt). Ist der Kunde mit einer Änderung, die ihn wesentlich benachteiligt, nicht einverstanden, kann er den betroffenen Vertrag auf das Inkrafttreten der Änderung kündigen. Unterlässt er dies, gelten die Änderungen als angenommen.',
                    'Mitteilungen per E-Mail an die vom Kunden zuletzt bekannt gegebene Adresse gelten als schriftlich und als zugestellt. Der Kunde teilt Änderungen seiner Kontaktdaten umgehend mit.',
                    'InfraOne darf den Kunden als Referenz (Firmenname und Logo) nennen, sofern der Kunde dem nicht schriftlich widerspricht.',
                    'Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein, bleibt die Gültigkeit der übrigen Bestimmungen unberührt. Die unwirksame Bestimmung wird durch eine wirksame ersetzt, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.',
                    'Die Übertragung von Rechten und Pflichten aus dem Vertrag durch den Kunden bedarf der schriftlichen Zustimmung von InfraOne.',
                    'Es gilt ausschliesslich schweizerisches Recht unter Ausschluss des UN-Kaufrechts (CISG) und der Kollisionsnormen.',
                    'Gerichtsstand ist Winterthur. InfraOne ist berechtigt, den Kunden auch an seinem Sitz oder Wohnsitz zu belangen. Für Konsumentinnen und Konsumenten gelten die zwingenden Gerichtsstände der Schweizerischen Zivilprozessordnung (Art. 32 ZPO).',
                ],
            },
        ],
    },
    {
        titel: 'Teil B: Besondere Bestimmungen nach Geschäftsbereich',
        einleitung:
            'Die folgenden Bestimmungen ergänzen Teil A für die jeweiligen Geschäftsbereiche und gehen diesem bei Widersprüchen vor.',
        abschnitte: [
            {
                id: 'it-support',
                titel: 'IT-Support, IT-Dienstleistungsvertrag und Wartung',
                ziffern: [
                    'Supporteinsätze ohne Vertrag werden nach Aufwand gemäss Preisliste verrechnet (Telefon- und Remote-Support, Vor-Ort-Support für Privat- und Geschäftskunden, Schulungen und Beratung). Nicht lösbare Probleme werden ebenfalls nach Aufwand verrechnet, sofern der Aufwand nicht auf einen Fehler von InfraOne zurückgeht.',
                    'Der IT-Dienstleistungsvertrag (monatliche Betreuung) umfasst die im Angebot definierten Leistungen, z. B. Monitoring, Verwaltung, Erreichbarkeit und die vereinbarte Anzahl Arbeitsplätze, Server und Standorte. Supporteinsätze und Projekte sind nicht in der Pauschale enthalten und werden nach Aufwand verrechnet, sofern nichts anderes vereinbart ist. Der IT-Dienstleistungsvertrag ist ohne Mindestlaufzeit mit einer Frist von einem Monat auf das Ende eines Kalendermonats kündbar.',
                    'Der Kunde meldet Änderungen der Anzahl Arbeitsplätze, Server oder Standorte. InfraOne ist berechtigt, die Pauschale an die tatsächlich betreuten Geräte anzupassen.',
                    'Wartungsverträge (Jahresprodukt) laufen 12 Monate und verlängern sich jeweils um weitere 12 Monate, wenn sie nicht 3 Monate vor Ablauf schriftlich gekündigt werden.',
                    'Monitoring dient der frühzeitigen Erkennung von Störungen. Es garantiert nicht, dass sämtliche Störungen erkannt oder verhindert werden. Ohne SLA besteht keine Pflicht zur Reaktion ausserhalb der Bürozeiten.',
                    'Bei Arbeiten an Systemen, die vom Hersteller nicht mehr unterstützt werden (End of Life) oder die vom Kunden selbst bzw. von Dritten eingerichtet wurden, erbringt InfraOne Leistungen ohne Gewähr für das Ergebnis.',
                ],
            },
            {
                id: 'netzwerke-hardware',
                titel: 'IT-Netzwerke, Hardware und Installationen',
                ziffern: [
                    'Nutzen und Gefahr gehen bei Lieferung von Hardware mit Übergabe an den Kunden bzw. an das Transportunternehmen auf den Kunden über. Transportschäden sind sofort beim Empfang zu melden.',
                    'Speziell bestellte Hardware, Software und Lizenzen können nicht zurückgegeben oder storniert werden, soweit der Lieferant keine Rücknahme gewährt. Bei einer Rücknahme aus Kulanz kann eine Bearbeitungsgebühr von bis zu 20 % des Warenwerts verrechnet werden.',
                    'Bauseitige Voraussetzungen (z. B. Verkabelung, Kernbohrungen, Strom, Bewilligungen der Liegenschaftsverwaltung) sind Sache des Kunden, sofern sie nicht ausdrücklich bei InfraOne bestellt sind. Elektroinstallationsarbeiten, die eine Bewilligung nach Niederspannungsinstallationsverordnung (NIV) erfordern, werden durch konzessionierte Partner ausgeführt.',
                    'Installationen gelten mit der Inbetriebnahme bzw. mit der ersten produktiven Nutzung als abgenommen, sofern keine wesentlichen Mängel gerügt werden.',
                    'Ausgebaute Altgeräte und Datenträger werden nur auf ausdrücklichen Auftrag datensicher gelöscht bzw. vernichtet. Ohne entsprechenden Auftrag verbleiben sie beim Kunden.',
                ],
            },
            {
                id: 'cloud',
                titel: 'Cloud-Dienste, Microsoft 365, Hosting und Datensicherung',
                ziffern: [
                    'Cloud-Dienste, Lizenzen und Hosting werden in der Regel von Drittanbietern erbracht. Es gelten deren Vertrags-, Nutzungs- und Datenschutzbedingungen (z. B. das Microsoft Customer Agreement). Für Verfügbarkeit, Funktionsumfang und Datenhaltung ist der jeweilige Anbieter verantwortlich. Funktions- oder Produktänderungen durch den Anbieter berechtigen nicht zu Preisminderungen gegenüber InfraOne.',
                    'Lizenzen mit fester Laufzeit (z. B. Microsoft-Jahreslizenzen) können während der Laufzeit nicht reduziert oder gekündigt werden. Sie verlängern sich gemäss den Bedingungen des Anbieters, sofern der Kunde nicht spätestens 30 Tage vor Ablauf eine Reduktion oder Kündigung mitteilt.',
                    'Cloud-Dienste wie Microsoft 365 enthalten nicht automatisch eine vollständige Datensicherung. Eine separate Sicherung der Cloud-Daten erfolgt nur, wenn sie ausdrücklich bestellt ist.',
                    'Ist eine Datensicherung als Leistung von InfraOne vereinbart, richtet InfraOne diese sorgfältig ein und überwacht sie im vereinbarten Umfang. Der Kunde prüft die Sicherungsberichte bzw. lässt Wiederherstellungstests in angemessenen Abständen durchführen. Es wird empfohlen, kritische Daten nach dem 3-2-1-Prinzip (drei Kopien, zwei Medien, eine ausser Haus) zu sichern.',
                    'Bei Migrationen (z. B. E-Mail, Dateien, Server in die Cloud) erstellt der Kunde vor Beginn eine vollständige Sicherung oder beauftragt InfraOne damit. Für Daten, die in den Quellsystemen fehlerhaft, unvollständig oder nicht exportierbar sind, haftet InfraOne nicht.',
                    'Domains werden, soweit möglich, auf den Namen des Kunden registriert. Der Kunde ist dafür verantwortlich, dass seine Kontaktdaten beim Registrar aktuell sind. Für Domainverluste durch Nichtbezahlung oder unterlassene Verlängerung durch den Kunden haftet InfraOne nicht.',
                ],
            },
            {
                id: 'telefonie',
                titel: 'Cloud-Telefonie',
                ziffern: [
                    'InfraOne vermittelt und betreut Telefonielösungen von Drittanbietern (z. B. peoplefone, 3CX, Microsoft Teams) und liefert und konfiguriert Endgeräte. Für die Telefoniedienste gelten ergänzend die Bedingungen des jeweiligen Anbieters.',
                    'Telefoniepakete werden, sofern im Angebot nicht anders angegeben, mit einer Mindestlaufzeit von 24 Monaten abgeschlossen. Nach Ablauf der Mindestlaufzeit ist der Vertrag mit einer Frist von 3 Monaten auf das Ende eines Kalendermonats kündbar. Einrichtung, Portierung und Endgeräte werden separat verrechnet.',
                    'Rufnummernportierungen erfolgen über den Anbieter und den bisherigen Provider des Kunden. InfraOne hat keinen Einfluss auf deren Bearbeitungszeiten. Der Kunde kündigt seine bisherigen Verträge selbst, sofern dies nicht durch die Portierung automatisch erfolgt, und trägt allfällige Kosten des bisherigen Providers.',
                    'Die Qualität von Internet-Telefonie hängt von der Internetverbindung und dem lokalen Netzwerk des Kunden ab. Für Störungen, die auf diese Faktoren zurückzuführen sind, haftet InfraOne nicht.',
                    'Notrufe: Bei Internet-Telefonie ist die Erreichbarkeit von Notrufnummern (112, 117, 118, 144 usw.) bei Strom- oder Internetausfall nicht gewährleistet. Die Standortermittlung kann ungenau sein, insbesondere bei mobiler Nutzung oder geänderter Adresse. Der Kunde meldet Adressänderungen und stellt für Notfälle eine alternative Telefonverbindung (z. B. Mobiltelefon) sicher.',
                    'Der Kunde schützt Endgeräte, Apps und Zugangsdaten vor unbefugtem Zugriff. Er haftet für sämtliche Verbindungsgebühren, die über seine Anschlüsse entstehen, auch bei missbräuchlicher Nutzung durch Dritte (z. B. Gebührenbetrug durch gehackte Zugangsdaten), sofern InfraOne diese nicht grobfahrlässig verursacht hat. Verbindungen, die nicht in einer Flatrate enthalten sind, werden gemäss den Tarifen des Anbieters verrechnet.',
                    'Bei Verdacht auf Missbrauch ist InfraOne berechtigt, betroffene Anschlüsse oder Auslandverbindungen vorübergehend zu sperren.',
                ],
            },
            {
                id: 'webdesign',
                titel: 'Webdesign, Software-Entwicklung und Online-Marketing',
                ziffern: [
                    'Der Leistungsumfang ergibt sich aus dem Angebot. Im Preis enthalten sind die dort genannten Korrekturrunden. Weitere Änderungswünsche, nachträgliche Funktionen sowie Inhaltserfassung, Texte, Übersetzungen und Bildbearbeitung werden nach Aufwand verrechnet, sofern nicht ausdrücklich enthalten.',
                    'Der Kunde liefert Texte, Bilder, Logos und weitere Inhalte rechtzeitig in digitaler Form. Er garantiert, dass er an allen gelieferten Inhalten die erforderlichen Rechte besitzt (Urheber-, Marken-, Persönlichkeits- und Bildrechte), und stellt InfraOne von allen Ansprüchen Dritter frei. Für Bilder aus Bilddatenbanken gelten deren Lizenzbedingungen.',
                    'Der Kunde ist für den rechtskonformen Inhalt seiner Website verantwortlich, insbesondere für Impressum, Datenschutzerklärung, Cookie-Hinweise, Preisangaben und Werbeaussagen. InfraOne kann Vorlagen und Hinweise liefern; dies stellt keine Rechtsberatung dar.',
                    'Nach Fertigstellung stellt InfraOne das Ergebnis zur Abnahme bereit. Der Kunde prüft es innert 10 Arbeitstagen. Mit der Abnahme, spätestens mit der Aufschaltung (Go-live) oder der produktiven Nutzung, gilt das Werk als abgenommen. Verzögert sich ein Projekt aus Gründen, die der Kunde zu vertreten hat, um mehr als 60 Tage, kann InfraOne die bis dahin erbrachten Leistungen in Rechnung stellen.',
                    'Webdesign-Projekte werden, sofern nicht anders vereinbart, zu 50 % bei Auftragserteilung und zu 50 % bei Abnahme bzw. Go-live in Rechnung gestellt.',
                    'Die Nutzungsrechte gehen mit vollständiger Bezahlung auf den Kunden über. Bei Websites auf Basis von Open-Source-Software (z. B. WordPress, Next.js) gelten die jeweiligen Open-Source-Lizenzen. Premium-Plugins, Themes und Lizenzen von Drittanbietern sind nur für die Dauer der jeweiligen Lizenz nutzbar.',
                    'InfraOne darf auf der Website einen dezenten Vermerk mit Verlinkung (z. B. «Webdesign by InfraOne») anbringen und das Projekt im eigenen Portfolio zeigen, sofern der Kunde dem nicht schriftlich widerspricht.',
                    'Ohne Wartungsvertrag ist InfraOne nach der Abnahme nicht für Updates, Sicherheitspatches, Backups oder die Kompatibilität mit neuen Browser-, Server- oder Softwareversionen verantwortlich. Sicherheitslücken in nicht aktualisierten Systemen fallen in die Verantwortung des Kunden.',
                    'InfraOne garantiert keine bestimmten Suchmaschinen-Platzierungen, Besucherzahlen oder Umsätze. Kosten für Werbeanzeigen (z. B. Google Ads) bezahlt der Kunde direkt bzw. zusätzlich.',
                ],
            },
            {
                id: 'digital-signage',
                titel: 'Digital Signage',
                ziffern: [
                    'Software-Abonnements für Digital Signage werden für die vereinbarte Anzahl Bildschirme bzw. Player lizenziert. Die Nutzung ist auf den vereinbarten Zweck beschränkt. Sofern nicht anders vereinbart, sind Abonnements mit einer Frist von 3 Monaten auf das Ende eines Kalendermonats kündbar.',
                    'Der Kunde ist für die angezeigten Inhalte allein verantwortlich, insbesondere für deren Rechtmässigkeit sowie für die Rechte an Bildern, Videos, Musik und Schriften. Für externe Datenquellen (z. B. Wetter-, News-, Energie- oder Social-Media-Feeds) übernimmt InfraOne keine Gewähr für Verfügbarkeit und Richtigkeit.',
                    'Für die Funktion der Bildschirme sind eine stabile Strom- und Internetverbindung sowie eine geeignete Montage- und Betriebsumgebung (Temperatur, Sonneneinstrahlung, Betriebsdauer gemäss Hersteller) Voraussetzung. Einbrennen und Schäden infolge Betriebs ausserhalb der Herstellerspezifikationen sind von der Gewährleistung ausgeschlossen.',
                ],
            },
            {
                id: 'videoueberwachung',
                titel: 'Videoüberwachung und Sicherheitstechnik',
                ziffern: [
                    'Der Kunde ist als Betreiber für den datenschutzkonformen Einsatz der Videoüberwachung verantwortlich, insbesondere für die Kennzeichnung, die Wahl der Aufnahmebereiche, die Speicherdauer, die Information von Mitarbeitenden und Dritten sowie für allfällige Bewilligungen. InfraOne berät den Kunden auf Wunsch; dies ersetzt keine Rechtsberatung.',
                    'Videoüberwachungs- und Sicherheitssysteme dienen der Abschreckung und Beweissicherung. Sie bieten keinen vollständigen Schutz vor Einbruch, Diebstahl, Vandalismus oder anderen Schäden. InfraOne haftet nicht für solche Schäden und nicht für Aufzeichnungen, die infolge Strom-, Netz- oder Speicherausfall, Manipulation oder Witterungseinflüssen fehlen.',
                    'Der Kunde schützt den Zugang zum Aufzeichnungssystem und zu Apps mit sicheren Passwörtern und lässt Firmware-Updates gemäss Empfehlung von InfraOne einspielen.',
                ],
            },
        ],
    },
];

// Abschnitte fortlaufend über beide Teile nummerieren
const nummern: Record<string, number> = Object.fromEntries(
    teile.flatMap((t) => t.abschnitte).map((a, i) => [a.id, i + 1])
);

export default function AGBPage() {
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'AGB', url: `${BASE_URL}/agb` },
    ]);

    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/agb`,
        'AGB - InfraOne IT Solutions',
        'Allgemeine Geschäftsbedingungen der InfraOne IT Solutions GmbH für alle Geschäftsbereiche.'
    );

    return (
        <section className="py-16 lg:py-24 bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    <AnimatedSection animation="slideUp">
                        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Allgemeine Geschäftsbedingungen
                        </h1>
                        <p className="text-text-secondary mb-8">
                            InfraOne IT Solutions GmbH, Rudolf-Diesel-Strasse 25, 8404 Winterthur
                            <br />
                            Gültig ab {STAND}
                        </p>
                    </AnimatedSection>

                    <nav aria-label="Inhaltsverzeichnis" className="rounded-2xl border border-border bg-card p-6 mb-12">
                        <p className="font-semibold text-text-primary mb-3">Inhalt</p>
                        {teile.map((teil) => (
                            <div key={teil.titel} className="mb-3 last:mb-0">
                                <p className="text-sm font-medium text-text-primary mb-1">{teil.titel}</p>
                                <ol className="text-sm text-text-secondary space-y-1">
                                    {teil.abschnitte.map((a) => (
                                        <li key={a.id}>
                                            <a href={`#${a.id}`} className="hover:text-primary hover:underline">
                                                {nummern[a.id]}. {a.titel}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </nav>

                    <div className="text-text-secondary max-w-none">
                        {teile.map((teil) => (
                            <div key={teil.titel}>
                                <h2 className="text-2xl font-bold text-text-primary mt-12 mb-4">{teil.titel}</h2>
                                {teil.einleitung && <p className="mb-6">{teil.einleitung}</p>}
                                {teil.abschnitte.map((abschnitt) => {
                                    const nr = nummern[abschnitt.id];
                                    return (
                                        <div key={abschnitt.id} id={abschnitt.id} className="scroll-mt-28">
                                            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">
                                                {nr}. {abschnitt.titel}
                                            </h3>
                                            <ol className="space-y-3">
                                                {abschnitt.ziffern.map((text, i) => (
                                                    <li key={i} className="flex gap-3 leading-relaxed">
                                                        <span className="shrink-0 font-medium text-text-primary tabular-nums">
                                                            {nr}.{i + 1}
                                                        </span>
                                                        <span>{text}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        <p className="mt-12 text-sm">
                            Stand: {STAND}. Diese Fassung ersetzt die AGB vom Januar 2026.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
