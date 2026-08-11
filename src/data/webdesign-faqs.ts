/**
 * FAQs für Webdesign Hub & Spoke Seiten
 */

/**
 * Webdesign Hub FAQs (Hauptseite)
 */
export const webdesignHubFaqs = [
    {
        question: 'Welche Technologien nutzen Sie für Webdesign?',
        answer: 'Wir arbeiten mit Wix, WordPress und Next.js – je nach Anforderung und Budget. Wix eignet sich für schnelle, pflegeleichte Websites. WordPress bietet maximale Flexibilität für Content-Management. Next.js nutzen wir für moderne, performante Web-Anwendungen mit höchsten Ansprüchen an SEO und Geschwindigkeit.',
    },
    {
        question: 'Kann ich die Website selbst pflegen?',
        answer: 'Ja, absolut. Bei allen unseren Lösungen legen wir Wert darauf, dass Sie Inhalte selbstständig anpassen können. Wir schulen Sie im Umgang mit dem System und stellen Anleitungen bereit. Auf Wunsch übernehmen wir die Pflege auch für Sie.',
    },
    {
        question: 'Wie lange dauert die Umsetzung einer Website?',
        answer: 'Das Starter-Paket ist in 1-2 Wochen fertig. Das KMU-Paket benötigt 2-4 Wochen. Umfangreichere Pro-Projekte dauern 4-8 Wochen. Die genaue Dauer hängt von der Komplexität und der Verfügbarkeit von Inhalten (Texte, Bilder) ab.',
    },
    {
        question: 'Sind die Preise fix oder kommen Zusatzkosten?',
        answer: 'Die Paketpreise sind transparent und fix. Hosting, SSL-Zertifikat und Basis-SEO sind enthalten. Zusatzkosten entstehen nur bei individuellen Wünschen ausserhalb des Pakets (z.B. spezielle Integrationen, zusätzliche Funktionen). Wir besprechen alle Kosten vorab mit Ihnen.',
    },
    {
        question: 'Was ist im Webdesign-Paket enthalten?',
        answer: 'Jedes Paket umfasst Design, Entwicklung, responsives Layout (mobil-optimiert), SEO-Grundoptimierung, Kontaktformular, SSL-Verschlüsselung und eine Einführung ins System. Die KMU- und Pro-Pakete enthalten zusätzlich erweiterte Funktionen wie Blog, mehrsprachige Inhalte und individuelle Anpassungen.',
    },
    {
        question: 'Bieten Sie auch Wartung und Support nach dem Launch?',
        answer: 'Ja, wir bieten Website-Wartung und Support als Service an. Das umfasst Updates, Backups, Sicherheitsüberwachung und inhaltliche Anpassungen. Sie entscheiden, ob Sie die Website selbst pflegen oder unseren Service nutzen möchten.',
    },
    {
        question: 'Wem gehört die Website nach dem Projekt?',
        answer: 'Ihnen. Domain, Inhalte und Design gehören nach Bezahlung vollständig Ihnen. Sie sind nicht an uns gebunden und können die Website jederzeit zu einem anderen Anbieter mitnehmen. Wir setzen bewusst nicht auf Abo-Modelle, die Kunden einsperren.',
    },
    {
        question: 'Was brauchen Sie von mir für den Start?',
        answer: 'Im Erstgespräch klären wir Ziel, Umfang und Stil. Danach brauchen wir von Ihnen vor allem Texte in Rohform, Bilder falls vorhanden und Ihr Logo. Fehlt etwas davon, finden wir eine Lösung: Texte schärfen wir gemeinsam, für Bilder gibt es gute Alternativen zur teuren Fotoproduktion.',
    },
    {
        question: 'Wird meine Website bei Google gefunden?',
        answer: 'Die technische Basis dafür ist in jedem Paket enthalten: saubere Struktur, schnelle Ladezeiten, korrekte Meta-Angaben und mobile Optimierung. Ein Rankingversprechen für umkämpfte Suchbegriffe wäre unseriös. Was realistisch ist, besprechen wir ehrlich im Erstgespräch.',
    },
    {
        question: 'Übernehmen Sie auch bestehende Websites?',
        answer: 'Ja. Wir übernehmen bestehende Websites zur Wartung, bauen sie um oder ersetzen sie durch einen Neuaufbau. Zuerst schauen wir den Ist-Zustand an und sagen Ihnen ehrlich, ob sich ein Umbau lohnt oder ein Neustart günstiger kommt.',
    },
];

/**
 * Webdesign Spoke FAQs (regionale Anpassung)
 * {region} wird durch den tatsächlichen Regionsnamen ersetzt
 */
export const generateWebdesignSpokeFaqs = (region: string, isPhysical: boolean) => {
    const baseFaqs = [
        {
            question: `Gibt es Vor-Ort-Beratung in ${region}?`,
            answer: isPhysical
                ? `Ja, wir haben ein Büro in ${region} und kommen gerne persönlich vorbei. Die meisten Projekte lassen sich aber auch vollständig remote umsetzen – Sie entscheiden, wie Sie arbeiten möchten.`
                : `Webdesign-Projekte laufen bei uns hauptsächlich remote ab. Für persönliche Termine können wir Sie an unserem nächstgelegenen Standort empfangen oder bei Bedarf auch nach ${region} kommen (zzgl. Anfahrt).`,
        },
        {
            question: `Wie läuft die Zusammenarbeit bei einem Webdesign-Projekt in ${region} ab?`,
            answer: `Nach einem kostenlosen Erstgespräch (telefonisch oder vor Ort) klären wir Ihre Anforderungen und erstellen ein Angebot. Nach Auftragserteilung entwickeln wir Ihr Design, Sie geben Feedback, und nach finalen Anpassungen geht die Website live. Alles läuft strukturiert und transparent ab – mit regelmässigen Updates.`,
        },
    ];

    return baseFaqs;
};

/**
 * Cloud-Telefonie Spoke FAQs (regionale Anpassung)
 */
export const generateCloudTelefonieSpokeFaqs = (region: string) => [
    {
        question: `Ist Cloud-Telefonie in ${region} verfügbar?`,
        answer: `Ja, Cloud-Telefonie funktioniert schweizweit – Sie benötigen lediglich eine stabile Internetverbindung. Wir richten Ihre Anlage ein, portieren Ihre bestehenden Nummern und konfigurieren alles für Ihren Standort in ${region}.`,
    },
    {
        question: 'Welche Anbieter unterstützen Sie?',
        answer: 'Wir arbeiten hauptsächlich mit Peoplefone (Cloud-Telefonie) und 3CX (flexible IP-Telefonanlage). Beide Systeme sind bewährt, skalierbar und für KMU bestens geeignet. Wir beraten Sie, welche Lösung am besten zu Ihren Anforderungen passt.',
    },
    {
        question: 'Kann ich meine bestehende Nummer behalten?',
        answer: 'Ja, Rufnummernportierung ist Standard. Wir übernehmen die Abwicklung mit Ihrem bisherigen Anbieter, sodass Ihre Erreichbarkeit durchgehend gewährleistet ist.',
    },
];

/**
 * Standard Service FAQs
 */

// IT-Netzwerke
export const itNetzwerkeFaqs = [
    {
        question: 'Wie sicher ist mein Firmennetzwerk?',
        answer: 'Wir setzen auf moderne Firewalls, VLAN-Segmentierung, verschlüsselte Verbindungen (VPN) und regelmässige Sicherheitsupdates. Zudem sensibilisieren wir Ihr Team für Cyberbedrohungen – denn die beste Technik nützt wenig ohne bewusste Nutzer.',
    },
    {
        question: 'Was ist der Unterschied zwischen Cloud und On-Premise?',
        answer: 'Cloud-Lösungen (z.B. Microsoft 365) laufen auf externen Servern – wartungsfrei, flexibel, von überall erreichbar. On-Premise bedeutet eigene Server vor Ort – mehr Kontrolle, aber auch mehr Wartungsaufwand. Wir helfen Ihnen, die richtige Balance für Ihr Unternehmen zu finden.',
    },
    {
        question: 'Wie schnell können Sie bei Netzwerkproblemen helfen?',
        answer: 'Remote-Support ist oft innert Minuten verfügbar. Bei Vor-Ort-Einsätzen je nach Region und Verfügbarkeit meist innerhalb weniger Stunden. Für kritische Systeme bieten wir SLA-Verträge mit garantierten Reaktionszeiten an.',
    },
    {
        question: 'Betreuen Sie auch bestehende Netzwerke?',
        answer: 'Ja, wir übernehmen gerne die Betreuung bestehender IT-Infrastrukturen. Nach einer Analyse Ihrer Systeme erstellen wir ein Wartungskonzept und kümmern uns um laufende Optimierungen, Updates und Support.',
    },
    {
        question: 'Was kostet ein professionelles Firmennetzwerk?',
        answer: 'Das hängt stark von Grösse und Anforderungen ab. Ein kleines KMU-Netzwerk (5-10 Arbeitsplätze) startet bei CHF 3\'000-5\'000. Wir erstellen Ihnen nach einer kostenlosen Erstberatung ein transparentes Angebot.',
    },
];

// Videoüberwachung
export const videoueberwachungFaqs = [
    {
        question: 'Ist Videoüberwachung DSGVO-konform?',
        answer: 'Ja, wir achten auf Datenschutz-Compliance. Kameras werden so platziert, dass keine öffentlichen Bereiche oder Nachbargrundstücke gefilmt werden. Aufnahmen werden verschlüsselt gespeichert und nach gesetzlicher Frist gelöscht. Wir beraten Sie zu allen rechtlichen Aspekten.',
    },
    {
        question: 'Wie lange werden Aufnahmen gespeichert?',
        answer: 'Standardmässig 7-30 Tage, je nach Anforderung und Speicherkapazität. Danach werden die ältesten Aufnahmen automatisch überschrieben. Bei besonderen Vorfällen können Sie Aufnahmen manuell sichern.',
    },
    {
        question: 'Kann ich von unterwegs auf die Kameras zugreifen?',
        answer: 'Ja, mit unseren Systemen haben Sie via App (iOS/Android) oder Webbrowser jederzeit Zugriff auf Live-Bilder und Aufzeichnungen – sicher verschlüsselt über das Internet.',
    },
    {
        question: 'Welche Kameras empfehlen Sie?',
        answer: 'Wir setzen auf bewährte Marken wie Hikvision, Axis oder Dahua. Die Wahl hängt von den Anforderungen ab: Innen/Aussen, Lichtbedingungen, Auflösung, Budget. Wir beraten Sie herstellerunabhängig.',
    },
];

// KI & Software-Entwicklung
export const softwareEntwicklungFaqs = [
    {
        question: 'Was kostet der Einstieg?',
        answer: 'Die Potenzialanalyse rechnen wir nach Aufwand zu CHF 200 pro Stunde ab – für die meisten KMU sind das wenige Stunden, den Umfang legen wir vorher fest. Für Integrationen und individuelle Software machen wir nach der Analyse eine Festofferte. Keine Lizenzmodelle, keine versteckten Folgekosten.',
    },
    {
        question: 'Was passiert mit unseren Daten?',
        answer: 'Das klären wir vor jedem Projekt, nicht danach. Wo immer möglich, laufen KI-Funktionen so, dass Ihre Daten unter Ihrer Kontrolle bleiben – lokal oder in Schweizer Rechenzentren. Was das im Einzelfall bedeutet, steht schriftlich in der Offerte, inklusive dessen, was wir nicht garantieren können.',
    },
    {
        question: 'Ersetzt KI unsere Mitarbeitenden?',
        answer: 'In KMU praktisch nie – sie nimmt ihnen die Arbeit ab, für die niemand eingestellt wurde: Ablegen, Abtippen, Suchen, Weiterleiten. Die Erfahrung Ihrer Leute wird dadurch wertvoller, nicht überflüssig. Projekte, deren einziges Ziel Stellenabbau ist, sind bei uns falsch.',
    },
    {
        question: 'Wir haben noch gar keine KI-Erfahrung – ist das ein Problem?',
        answer: 'Nein, das ist der Normalfall. Wir starten dort, wo der Nutzen am schnellsten sichtbar wird, meist mit einem einzelnen Ablauf. Ihr Team lernt am echten Beispiel, nicht im Schulungsraum.',
    },
];

// Digital Signage
export const digitalSignageFaqs = [
    {
        question: 'Was ist Digital Signage?',
        answer: 'Digital Signage sind digitale Bildschirme zur Informations- und Werbeanzeige. Inhalte (Videos, Bilder, Text) werden zentral verwaltet und auf beliebig viele Displays verteilt – perfekt für Empfangsbereiche, Shops, Messen oder interne Kommunikation.',
    },
    {
        question: 'Wie pflege ich die Inhalte?',
        answer: 'Über eine webbasierte Verwaltungsoberfläche. Sie können Inhalte hochladen, Playlists erstellen und Zeitpläne definieren – alles ohne technisches Know-how. Wir schulen Sie im Umgang mit dem System.',
    },
    {
        question: 'Was kostet Digital Signage?',
        answer: 'Ein Basis-Setup (1-2 Displays mit Player und Software) startet bei CHF 2\'000-3\'000. Grössere Installationen mit mehreren Standorten und zentraler Verwaltung sind individuell kalkuliert. Wir erstellen Ihnen ein massgeschneidertes Angebot.',
    },
];

