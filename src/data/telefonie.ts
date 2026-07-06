export const globalFaqs = [
    {
        question: 'Was kostet Cloud-Telefonie für mein Unternehmen?',
        answer: 'Ein Komplettpaket für 5 Benutzer mit Flatrate CH+EU kostet ab CHF 37.– pro Monat. Die genauen Kosten hängen von Ihrer Benutzeranzahl, den gewünschten Rufnummern und dem Tarifmodell ab. Nutzen Sie unseren Online-Rechner oder fordern Sie eine individuelle Offerte an.'
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
