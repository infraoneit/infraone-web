'use client';

import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { FAQList } from '@/components/ui/FAQList';

const homepageFaqs = [
    {
        question: 'Welche Leistungen bietet InfraOne an?',
        answer: 'Wir sind Ihr Full-Service-IT-Partner: IT-Support & Managed Services, Cloud-Telefonie (3CX, peoplefone), Netzwerke & Server, Videoüberwachung, Webdesign, Software-Entwicklung, Digital Signage, Gebäudeautomation und Kontrollraum-Lösungen. Alles aus einer Hand.'
    },
    {
        question: 'Für wen sind die Dienstleistungen geeignet?',
        answer: 'Unsere Lösungen richten sich an KMU, Startups, Gewerbebetriebe, Arztpraxen und Privatkunden in Winterthur, Zürich, Schaffhausen, Thurgau, St. Gallen und der gesamten Ostschweiz. Wir betreuen Unternehmen jeder Größe – vom Einzelunternehmen bis zum mittelständischen Betrieb.'
    },
    {
        question: 'Wie schnell können Sie bei IT-Problemen helfen?',
        answer: 'Bei dringenden IT-Problemen sind wir schnell vor Ort oder remote erreichbar. Unser Support-Team reagiert in der Regel innerhalb von 2-4 Stunden. Für kritische Systeme bieten wir auch 24/7-Notfall-Support an.'
    },
    {
        question: 'Was kostet eine Beratung oder ein Erstgespräch?',
        answer: 'Das erste Beratungsgespräch ist bei uns immer kostenlos und unverbindlich. Wir analysieren Ihre Anforderungen, besprechen mögliche Lösungen und erstellen Ihnen ein transparentes Angebot – ohne versteckte Kosten.'
    },
    {
        question: 'Arbeiten Sie auch mit bestehenden IT-Systemen?',
        answer: 'Ja, selbstverständlich. Wir integrieren uns nahtlos in Ihre vorhandene IT-Infrastruktur und arbeiten mit allen gängigen Systemen zusammen. Ob Microsoft, Linux, Cloud-Lösungen oder On-Premise – wir finden die beste Lösung für Ihre Situation.'
    },
    {
        question: 'Wie läuft ein typisches Projekt mit InfraOne ab?',
        answer: 'Ein Projekt startet immer mit einem kostenlosen Erstgespräch. Danach analysieren wir Ihre Anforderungen, erstellen ein detailliertes Angebot und setzen die Lösung professionell um. Nach dem Go-Live stehen wir Ihnen mit Support und Wartung zur Seite.'
    },
];

export function HomepageFAQSection() {
    return (
        <section className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                <AnimatedSection animation="slideUp" className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                        Häufige Fragen
                    </h2>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        Antworten auf die wichtigsten Fragen zu unseren IT-Dienstleistungen
                    </p>
                </AnimatedSection>

                <div className="max-w-3xl mx-auto">
                    <FAQList items={homepageFaqs} />
                </div>
            </div>
        </section>
    );
}
