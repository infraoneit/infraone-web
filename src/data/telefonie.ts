export const globalFaqs = [
    {
        question: 'Was kostet Cloud-Telefonie für mein Unternehmen?',
        answer: 'Ein Komplettpaket für 5 Benutzer mit Flatrate CH+EU kostet CHF 67 pro Monat: Grundgebühr, Benutzerpaket, Flatrate und eine Rufnummer. Die genauen Kosten hängen von Ihrer Benutzeranzahl, den gewünschten Rufnummern und dem Tarifmodell ab. Nutzen Sie unseren Online-Rechner oder fordern Sie eine individuelle Offerte an.'
    },
    {
        question: 'Kann ich meine bestehende Telefonnummer behalten?',
        answer: 'Ja, selbstverständlich! Wir portieren Ihre bestehenden Festnetz- und Mobilnummern zu Peoplefone. Der Prozess dauert in der Regel 5-10 Arbeitstage und läuft komplett unterbrechungsfrei – Ihre Kunden merken nichts vom Wechsel.'
    },
    {
        question: 'Wie lange dauert die Umstellung auf Cloud-Telefonie?',
        answer: 'Eine typische Installation für ein KMU bis 20 Benutzer ist innerhalb von 1 Woche abgeschlossen. Darin enthalten sind Bedarfsanalyse, Konfiguration, Nummernportierung und Schulung Ihres Teams. Komplexere Setups mit mehreren Standorten planen wir entsprechend länger.'
    },
    {
        question: 'Brauche ich spezielle Hardware für Cloud-Telefonie?',
        answer: 'Nein! Cloud-Telefonie funktioniert über Ihre bestehende Internetleitung. Telefonieren können Sie per Handy-App (iOS/Android), Softphone am PC oder mit IP-Tischtelefonen. Wir beraten Sie gerne zur optimalen Ausstattung für Ihr Team.'
    },
    {
        question: 'Was passiert bei einem Internet-Ausfall?',
        answer: 'Bei Peoplefone können Sie Anrufe automatisch auf Mobilnummern umleiten lassen, wenn das Internet ausfällt. Zudem funktioniert die Handy-App auch über Mobilfunk – Ihre Erreichbarkeit ist also gewährleistet. Für kritische Umgebungen empfehlen wir eine Backup-Internetleitung.'
    },
    {
        question: 'Funktioniert Cloud-Telefonie auch im Homeoffice?',
        answer: 'Ja. Jeder Benutzer nimmt seine Nummer einfach mit: per App auf dem Handy, per Softphone auf dem Laptop oder mit einem IP-Telefon am Heimarbeitsplatz. Anrufe klingeln dort, wo Sie gerade arbeiten, und Ihre Kunden sehen immer die gewohnte Firmennummer.'
    },
    {
        question: 'Was ist der Unterschied zwischen vPBX und 3CX?',
        answer: 'vPBX ist die gehostete Anlage von Peoplefone: nichts zu installieren, ideal für die meisten KMU. 3CX ist eine eigene Telefonanlagen-Software mit mehr Funktionen und Schnittstellen, die in der Cloud oder auf eigener Hardware läuft. Wir beraten ehrlich, welches System zu Ihrer Grösse und Ihren Anforderungen passt.'
    },
    {
        question: 'Kann ich die Telefonie mit Microsoft Teams verbinden?',
        answer: 'Ja, Telefonie lässt sich in Microsoft Teams einbinden, sodass Ihr Team direkt aus Teams heraus ins Festnetz telefoniert. Ob sich das für Sie lohnt, hängt von Lizenzen und Arbeitsweise ab. Wir zeigen Ihnen die Varianten inklusive Kosten transparent auf.'
    },
    {
        question: 'Welche Internetleitung brauche ich für VoIP?',
        answer: 'Eine gewöhnliche Geschäftsleitung reicht in den meisten Fällen: pro Gespräch rechnet man mit rund 100 kbit/s. Wichtiger als die Geschwindigkeit ist die Stabilität. Wir prüfen Ihre Leitung vor der Umstellung und empfehlen bei Bedarf einen Anschluss mit fester IP-Adresse.'
    },
    {
        question: 'Gibt es Mindestlaufzeiten oder versteckte Kosten?',
        answer: 'Die pauschalen Benutzerpakete gelten bei einer Laufzeit von 24 Monaten. Einmalig fallen Installation und Portierung an, laufend nur die ausgewiesenen Monatspreise. Alle Preise stehen offen auf dieser Seite: Was hier nicht steht, wird auch nicht verrechnet.'
    },
    {
        question: 'Übernehmen Sie auch bestehende Anlagen anderer Anbieter?',
        answer: 'Ja. Wir übernehmen bestehende VoIP-Umgebungen oder lösen alte ISDN- und Analoganlagen ab. Zuerst schauen wir an, was vorhanden ist. Danach erhalten Sie einen klaren Umstellungsplan mit Terminen und Kosten.'
    },
];

export const pricingModules = {
    vpbxBasic: {
        title: 'vPBX Basic',
        subtitle: 'Klassische Cloud-Anlage, 1–10 User',
        tiers: [
            { range: '1–5 Benutzer', price: 'CHF 15.–' },
            { range: '6–10 Benutzer', price: 'CHF 25.–' },
        ],
        features: [
            'Verteilgruppen & Anrufweiterleitungen',
            'IVR (Sprachmenü) & Warteschleife',
            'Voicemail & Fax2Mail',
            'Mobile App (iOS/Android)',
        ],
    },
    vpbxPlus: {
        title: 'vPBX Plus',
        subtitle: 'Alle Funktionen inklusive, 1–150 User',
        tiers: [
            { range: '1–5 Benutzer', price: 'CHF 25.–' },
            { range: '6–10 Benutzer', price: 'CHF 35.–' },
            { range: '11–20 Benutzer', price: 'CHF 55.–' },
            { range: '21–30 Benutzer', price: 'CHF 75.–' },
            { range: '31–40 Benutzer', price: 'CHF 95.–' },
            { range: '41–50 Benutzer', price: 'CHF 115.–' },
            { range: '51–60 Benutzer', price: 'CHF 135.–' },
            { range: 'ab 61 Benutzer', price: 'auf Anfrage' },
        ],
        features: [
            'Alle Funktionen aus vPBX Basic',
            'Softphone-Lizenzen inklusive',
            'Visual Callflow & Multi-Provisioning',
            'Analytics & höhere Kontingente',
        ],
    },
    tariffs: [
        { name: 'Minutentarif', price: 'ab CHF 0.03', description: 'Festnetz 0.03/Min, Mobil 0.25/Min' },
        { name: 'Flatrate CH', price: 'CHF 19.–', description: '1000 Min. Festnetz + 200 Min. Mobil Schweiz' },
        { name: 'Flatrate CH+EU', price: 'CHF 22.–', description: '1000 Min. Festnetz + 300 Min. Mobil CH+EU' },
    ],
    internetTV: [
        { name: 'Internet 1 Gbit/s', price: 'CHF 49.–' },
        { name: 'Fixe IP-Adresse', price: 'CHF 10.–' },
        { name: 'TV Box', price: 'CHF 15.–' },
    ],
    phoneNumbers: [
        { range: 'Einzelnummer', price: 'CHF 5.–' },
        { range: 'Nummernblock 2–5', price: 'CHF 10.–' },
        { range: 'Nummernblock 6–10', price: 'CHF 15.–' },
    ],
};
