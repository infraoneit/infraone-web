import { Metadata } from 'next';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Datenschutz | Datenschutzerklärung',
    description: 'Datenschutzerklärung der InfraOne IT Solutions GmbH gemäss Schweizer Datenschutzgesetz.',
    alternates: {
        canonical: 'https://infraone.ch/datenschutz',
    },
};

export default function DatenschutzPage() {
    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Datenschutz', url: `${BASE_URL}/datenschutz` },
    ]);

    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/datenschutz`,
        'Datenschutz - InfraOne IT Solutions',
        'Datenschutzerklärung der InfraOne IT Solutions GmbH gemäss Schweizer Datenschutzgesetz.'
    );

    return (
        <>
            {/* Breadcrumb Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            {/* WebPage Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />

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
                                zu gewährleisten. Beim Testanruf des KI-Telefonassistenten setzen wir das Cookie «demo_geraet»
                                mit einer zufälligen, signierten Gerätekennung (Laufzeit 400 Tage). Es dient allein dazu, die
                                Zahl der Testanrufe und Website-Prüfungen je Gerät zu begrenzen; es enthält keine persönlichen
                                Daten und wird nicht zur Nachverfolgung über andere Websites genutzt. Sie können Ihren Browser
                                so einstellen, dass Sie über das Setzen von Cookies informiert werden.
                            </p>

                            <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">4. Nutzung und Weitergabe</h2>
                            <p>
                                Ihre Daten werden ausschliesslich zur Bearbeitung Ihrer Anfrage bzw. zur Durchführung
                                des Auftrags verwendet. Eine Weitergabe an Dritte erfolgt nur, wenn dies zur
                                Vertragserfüllung notwendig ist oder Sie ausdrücklich eingewilligt haben.
                            </p>

                            {/* AUFTRAG-092 (Nachtrag Manager): Text wortgleich */}
                            <h2 id="testanruf-ki-telefonassistent" className="text-xl font-bold text-text-primary mt-8 mb-4">5. Testanruf KI-Telefonassistent</h2>
                            <p>
                                Wenn Sie auf der Seite «KI-Telefonassistent» eine Website-Adresse eingeben, rufen unsere Systeme die öffentlich erreichbaren Seiten dieser Website ab und erstellen daraus ein Profil (Firmenname, Kontaktangaben, Öffnungszeiten, Leistungen, Logo und Farben). Dieses Profil wird für höchstens zwei Stunden gespeichert und danach gelöscht. Geben Sie Ihre Telefonnummer ein und bestätigen den Testanruf, verwenden wir die Nummer für diesen Anruf. Zusammen mit einer Zusammenfassung und dem Gesprächsprotokoll erhält InfraOne sie als Hinweis auf Ihr Interesse, damit wir Rückfragen beantworten können; für Werbung verwenden wir sie nicht. Der Testanruf dauert höchstens drei Minuten. Die Telefonanlage und das Gesprächsprotokoll laufen auf Systemen von InfraOne in der Schweiz; für Spracherkennung und Sprachausgabe nutzen wir die Schnittstellen von OpenAI, wobei Gesprächsinhalte dort nicht zum Training von Modellen verwendet werden. Mitschnitte werden nicht erstellt. Pro Telefonnummer, Gerät und Internetanschluss sind zwei Testanrufe am Tag möglich. Dafür speichern wir für höchstens zwei Tage Prüfsummen (Hashes) der Internetadresse und der Gerätekennung, aus denen sich Adresse und Kennung nicht zurückrechnen lassen.
                            </p>

                            <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">6. Datensicherheit</h2>
                            <p>
                                Wir treffen angemessene technische und organisatorische Massnahmen, um Ihre Daten
                                gegen Missbrauch, Verlust oder unbefugten Zugriff zu schützen.
                            </p>

                            <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">7. Ihre Rechte</h2>
                            <p>
                                Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
                                Verarbeitung Ihrer personenbezogenen Daten. Wenden Sie sich dazu an info@infraone.ch.
                            </p>

                            <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">8. Änderungen</h2>
                            <p>
                                Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie
                                neuen rechtlichen Anforderungen oder Änderungen unserer Dienste anzupassen.
                            </p>

                            <p className="mt-8 text-sm">
                                Stand: Oktober 2026
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
