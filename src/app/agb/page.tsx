import { Metadata } from 'next';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

export const metadata: Metadata = {
    title: 'AGB | Allgemeine Geschäftsbedingungen',
    description: 'Allgemeine Geschäftsbedingungen der InfraOne IT Solutions GmbH.',
};

export default function AGBPage() {
    return (
        <section className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    <AnimatedSection animation="slideUp">
                        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">
                            Allgemeine Geschäftsbedingungen
                        </h1>
                    </AnimatedSection>

                    <div className="prose prose-lg text-text-secondary max-w-none">
                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">1. Geltungsbereich</h2>
                        <p>
                            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen der
                            InfraOne IT Solutions GmbH (nachfolgend &ldquo;InfraOne&rdquo;) und ihren Kunden, soweit nicht
                            schriftlich etwas anderes vereinbart wurde.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">2. Leistungen</h2>
                        <p>
                            InfraOne erbringt IT-Dienstleistungen gemäss individueller Vereinbarung. Der Umfang
                            der Leistungen ergibt sich aus dem jeweiligen Angebot oder Vertrag.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">3. Preise und Zahlung</h2>
                        <p>
                            Alle Preise verstehen sich in Schweizer Franken (CHF) und exklusive Mehrwertsteuer,
                            sofern nicht anders angegeben. Rechnungen sind innert 30 Tagen ab Rechnungsdatum zahlbar.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">4. Mitwirkungspflichten des Kunden</h2>
                        <p>
                            Der Kunde stellt die für die Leistungserbringung notwendigen Informationen, Zugänge
                            und Ressourcen rechtzeitig zur Verfügung.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">5. Gewährleistung</h2>
                        <p>
                            InfraOne gewährleistet, dass die erbrachten Leistungen dem vereinbarten Leistungsumfang
                            entsprechen. Mängelansprüche sind schriftlich innerhalb von 14 Tagen nach Entdeckung zu melden.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">6. Haftung</h2>
                        <p>
                            Die Haftung von InfraOne ist auf Vorsatz und grobe Fahrlässigkeit beschränkt.
                            Eine Haftung für indirekte Schäden, entgangenen Gewinn oder Datenverlust ist ausgeschlossen.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">7. Vertraulichkeit</h2>
                        <p>
                            Beide Parteien verpflichten sich, vertrauliche Informationen der anderen Partei
                            nicht an Dritte weiterzugeben.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">8. Anwendbares Recht und Gerichtsstand</h2>
                        <p>
                            Es gilt schweizerisches Recht. Gerichtsstand ist Winterthur.
                        </p>

                        <p className="mt-8 text-sm">
                            Stand: Januar 2026
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
