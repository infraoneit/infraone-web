import { Metadata } from 'next';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { generateBreadcrumbListSchema, generateWebPageSchema } from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Impressum | Rechtliche Informationen',
    description: 'Impressum und rechtliche Informationen der InfraOne IT Solutions GmbH.',
};

export default function ImpressumPage() {
    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Impressum', url: `${BASE_URL}/impressum` },
    ]);
    
    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/impressum`,
        'Impressum - InfraOne IT Solutions',
        'Impressum und rechtliche Informationen der InfraOne IT Solutions GmbH.'
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
                            Impressum
                        </h1>
                    </AnimatedSection>

                    <div className="prose prose-lg text-text-secondary max-w-none">
                        <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">Angaben gemäss Schweizer Recht</h2>

                        <h3 className="text-lg font-semibold text-text-primary mt-6 mb-2">Firma</h3>
                        <p>
                            InfraOne IT Solutions GmbH
                        </p>

                        <h3 className="text-lg font-semibold text-text-primary mt-6 mb-2">Adresse</h3>
                        <p>
                            Rudolf-Diesel-Strasse 25<br />
                            8404 Winterthur<br />
                            Schweiz
                        </p>

                        <h3 className="text-lg font-semibold text-text-primary mt-6 mb-2">Kontakt</h3>
                        <p>
                            Telefon: <a href="tel:+41522221818" className="text-primary hover:underline">052 222 18 18</a><br />
                            E-Mail: <a href="mailto:info@infraone.ch" className="text-primary hover:underline">info@infraone.ch</a>
                        </p>

                        <h3 className="text-lg font-semibold text-text-primary mt-6 mb-2">Handelsregister</h3>
                        <p>
                            Eingetragen im Handelsregister des Kantons Zürich
                        </p>

                        <h3 className="text-lg font-semibold text-text-primary mt-6 mb-2">Mehrwertsteuer-Nummer</h3>
                        <p>
                            CHE-288.114.187 MWST
                        </p>

                        <h3 className="text-lg font-semibold text-text-primary mt-6 mb-2">Haftungsausschluss</h3>
                        <p>
                            Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit,
                            Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.
                        </p>
                        <p>
                            Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art,
                            welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten
                            Informationen entstanden sind, werden ausgeschlossen.
                        </p>

                        <h3 className="text-lg font-semibold text-text-primary mt-6 mb-2">Urheberrechte</h3>
                        <p>
                            Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien
                            auf der Website gehören ausschliesslich der InfraOne IT Solutions GmbH oder den
                            speziell genannten Rechtsinhabern.
                        </p>
                    </div>
                </div>
            </div>
        </section>
        </>
    );
}
