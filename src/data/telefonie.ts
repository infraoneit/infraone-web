import { Cloud, Building, Headphones, Settings, Users, Building2 } from 'lucide-react';

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
    userPackages: [
        { range: '1–5 Benutzer', price: 'CHF 15.–', per: '/Monat pauschal' },
        { range: '6–10 Benutzer', price: 'CHF 25.–', per: '/Monat pauschal' },
        { range: '11–20 Benutzer', price: 'CHF 35.–', per: '/Monat pauschal' },
        { range: '21–50 Benutzer', price: 'CHF 50.–', per: '/Monat pauschal' },
    ],
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

export const processSteps = [
    {
        title: 'Analyse Ihrer aktuellen Telefonie',
        description: 'Wir schauen uns Ihre bestehende Lösung an, verstehen Ihre Anforderungen und identifizieren Verbesserungspotenzial.',
    },
    {
        title: 'Massgeschneidertes Konzept',
        description: 'Ob Cloud oder On-Premise, peoplefone, 3CX oder Yeastar – wir empfehlen die Lösung, die zu Ihrem Unternehmen passt.',
    },
    {
        title: 'Professionelle Installation',
        description: 'Wir konfigurieren Ihre Telefonanlage, portieren Ihre Nummern und schulen Ihr Team im Umgang mit dem neuen System.',
    },
    {
        title: 'Laufender Support',
        description: 'Bei Fragen oder Problemen sind wir für Sie da. Mit Wartungsverträgen sichern Sie sich schnelle Hilfe und regelmässige Updates.',
    },
];
