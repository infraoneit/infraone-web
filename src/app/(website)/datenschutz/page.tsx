import { Metadata } from 'next';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

export const metadata: Metadata = {
    title: 'Datenschutz | Datenschutzerklärung',
    description: 'Datenschutzerklärung der InfraOne IT Solutions GmbH gemäss Schweizer Datenschutzgesetz.',
};

export default function DatenschutzPage() {
    return (
        <section className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    <AnimatedSection animation="slideUp">
                        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">
                            Datenschutzerklärung
                        </h1>
                    </AnimatedSection>

                    <div className="prose prose-lg text-text-secondary max-w-none">
                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">1. Verantwortliche Stelle</h2>
                        <p>
                            InfraOne IT Solutions GmbH<br />
                            Rudolf-Diesel-Strasse 25<br />
                            8404 Winterthur<br />
                            Schweiz<br />
                            E-Mail: info@infraone.ch
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">2. Erhebung und Verarbeitung von Daten</h2>
                        <p>
                            Wir erheben personenbezogene Daten, wenn Sie uns diese im Rahmen einer Kontaktanfrage,
                            Bestellung oder Registrierung freiwillig mitteilen. Dies umfasst typischerweise:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Name und Vorname</li>
                            <li>E-Mail-Adresse</li>
                            <li>Telefonnummer</li>
                            <li>Firmenname</li>
                            <li>Nachrichteninhalt</li>
                        </ul>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">3. Cookies</h2>
                        <p>
                            Diese Website verwendet technisch notwendige Cookies, um die Funktionalität der Website
                            zu gewährleisten. Sie können Ihren Browser so einstellen, dass Sie über das Setzen von
                            Cookies informiert werden.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">4. Nutzung und Weitergabe</h2>
                        <p>
                            Ihre Daten werden ausschliesslich zur Bearbeitung Ihrer Anfrage bzw. zur Durchführung
                            des Auftrags verwendet. Eine Weitergabe an Dritte erfolgt nur, wenn dies zur
                            Vertragserfüllung notwendig ist oder Sie ausdrücklich eingewilligt haben.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">5. Datensicherheit</h2>
                        <p>
                            Wir treffen angemessene technische und organisatorische Massnahmen, um Ihre Daten
                            gegen Missbrauch, Verlust oder unbefugten Zugriff zu schützen.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">6. Ihre Rechte</h2>
                        <p>
                            Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
                            Verarbeitung Ihrer personenbezogenen Daten. Wenden Sie sich dazu an info@infraone.ch.
                        </p>

                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">7. Änderungen</h2>
                        <p>
                            Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie
                            neuen rechtlichen Anforderungen oder Änderungen unserer Dienste anzupassen.
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
