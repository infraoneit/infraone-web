import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, CheckCircle, ArrowRight, Monitor, Headphones, Shield, Wrench } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { FAQList } from '@/components/ui/FAQList';
import { 
    generateLocalBusinessSchema, 
    generateProfessionalServiceSchema, 
    generateFAQSchema,
    generateITServiceLocalBusinessSchema,
    generateVirtualSpokeSchema,
    generateBreadcrumbListSchema,
    generateWebPageSchema
} from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';
import { getITSupportRegion, getAllITSupportRegionSlugs } from '@/lib/leistungen';

const services = [
    { icon: <Monitor className="w-6 h-6" />, title: 'PC & Laptop Support', desc: 'Windows, Mac, Hardware' },
    { icon: <Shield className="w-6 h-6" />, title: 'Netzwerk & Server', desc: 'Einrichtung, Wartung' },
    { icon: <Headphones className="w-6 h-6" />, title: 'Remote-Support', desc: 'Schnelle Hilfe via Fernzugriff' },
    { icon: <Wrench className="w-6 h-6" />, title: 'Microsoft 365', desc: 'Einrichtung, Migration' },
];

const generalFaqs = [
    { question: 'Wie schnell können Sie helfen?', answer: 'Remote-Support ist meist innert 15 Minuten verfügbar. Bei Vor-Ort-Einsätzen je nach Region und Verfügbarkeit oft innerhalb weniger Stunden.' },
    { question: 'Was kostet der IT-Support?', answer: 'Remote-Support: ab CHF 130/h (Min. 15 Min.). Vor-Ort-Support: ab CHF 145/h (Min. 30 Min.). Zuschläge für Abend-/Wochenend-/Feiertagseinsätze.' },
    { question: 'Betreuen Sie auch Privatpersonen?', answer: 'Ja! Wir helfen sowohl KMU als auch Privatpersonen bei allen IT-Problemen – vom langsamen PC bis zum Virenbefall.' },
    { question: 'Wie läuft Remote-Support ab?', answer: 'Sie erhalten von uns einen sicheren Zugangslink. Nach Ihrer Freigabe können wir direkt an Ihrem Gerät arbeiten – meist ist das Problem innert Minuten gelöst.' },
];

const allRegions = [
    { name: 'Winterthur', slug: 'winterthur' },
    { name: 'Zuerich', slug: 'zuerich' },
    { name: 'Schaffhausen', slug: 'schaffhausen' },
    { name: 'Thurgau', slug: 'thurgau' },
    { name: 'St. Gallen', slug: 'st-gallen' },
    { name: 'Andelfingen', slug: 'andelfingen' },
];

export async function generateStaticParams() {
    const slugs = await getAllITSupportRegionSlugs();
    return slugs.map(region => ({ region }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
    const { region } = await params;
    const data = await getITSupportRegion(region);
    if (!data) return { title: 'IT-Support | InfraOne' };
    return {
        title: data.metaTitle || `IT-Support ${data.name} | InfraOne`,
        description: data.metaDescription,
        keywords: data.keywords,
        alternates: { canonical: data.canonicalUrl || `https://www.infraone.ch/it-support/${data.slug}` },
    };
}

export default async function ITSupportRegionPage({ params }: { params: Promise<{ region: string }> }) {
    const { region } = await params;
    const data = await getITSupportRegion(region);
    if (!data) notFound();
    
    const otherRegions = allRegions.filter(r => r.slug !== region);
    
    // Standort-Spokes (mit physischem Büro)
    const locationSpokes = ['winterthur', 'andelfingen', 'schaffhausen', 'thurgau'];
    const isLocationSpoke = locationSpokes.includes(region);
    
    // Virtuelle Spokes (ohne Büro, bedient durch andere Standorte)
    const virtualSpokes: Record<string, { provider: string; providerBusinessId: string }> = {
        'zuerich': { provider: 'Winterthur', providerBusinessId: `${BASE_URL}/it-support/winterthur#business` },
        'st-gallen': { provider: 'Thurgau', providerBusinessId: `${BASE_URL}/it-support/thurgau#business` },
    };
    const isVirtualSpoke = region in virtualSpokes;
    
    // Adress-Daten für Standort-Spokes
    const addressData: Record<string, { postalCode: string; addressLocality: string; street?: string }> = {
        'winterthur': { postalCode: '8400', addressLocality: 'Winterthur' },
        'andelfingen': { postalCode: '8451', addressLocality: 'Kleinandelfingen' },
        'schaffhausen': { postalCode: '8200', addressLocality: 'Schaffhausen' },
        'thurgau': { postalCode: '8274', addressLocality: 'Tägerwilen' },
    };
    
    // Structured Data generieren
    let mainSchema;
    if (isLocationSpoke) {
        // Standort-Spoke: LocalBusiness mit OpeningHours
        mainSchema = generateITServiceLocalBusinessSchema(
            region,
            data.name,
            addressData[region],
            ['Mo–Fr 08:00–17:00'],
            'Notfall-Support verfügbar Mo–So bis 23:00 Uhr (mit Zuschlag)'
        );
    } else if (isVirtualSpoke) {
        // Virtueller Spoke: Service-Schema mit Provider-Referenz
        mainSchema = generateVirtualSpokeSchema(
            region,
            data.name,
            virtualSpokes[region].providerBusinessId
        );
    } else {
        // Fallback (sollte nicht vorkommen)
        mainSchema = generateLocalBusinessSchema(region, 'IT-Support', `${BASE_URL}/it-support/${region}`, data.areaServed || [data.name]);
    }
    
    // WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/it-support/${region}`,
        data.headline,
        data.description
    );
    
    // Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'IT-Support', url: `${BASE_URL}/it-support` },
        { name: data.name, url: `${BASE_URL}/it-support/${region}` },
    ]);
    
    // FAQ Schema
    const allFaqs = [...generalFaqs, ...(data.localFaqQuestion ? [{ question: data.localFaqQuestion, answer: data.localFaqAnswer }] : []), ...(data.additionalFaqs || [])];
    const faqSchema = data.includeFaqSchema !== false ? generateFAQSchema(allFaqs) : null;

    return (
        <>
            {/* Main Schema (LocalBusiness oder Virtual Service) */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(mainSchema) }} />
            
            {/* WebPage Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            
            {/* Breadcrumb Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            
            {/* FAQ Schema */}
            {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-10"><Image src="/images/hero_it_network_1768423176860.png" alt="" fill className="object-cover" priority /></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="max-w-xl">
                            <AnimatedSection animation="slideUp">
                                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-4"><MapPin className="w-4 h-4" /><span className="uppercase tracking-wider">{data.name}</span></div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4"><span className="gradient-text">{data.headline}</span></h1>
                                <p className="text-xl md:text-2xl text-primary font-medium mb-4">{data.subheadline}</p>
                                <p className="text-lg text-text-secondary max-w-2xl mb-8">{data.description}</p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button variant="primary" size="lg" asChild><Link href="/kontakt">Jetzt Anfrage stellen<ArrowRight className="w-5 h-5" /></Link></Button>
                                    <Button variant="outline" size="lg" asChild><a href="tel:+41522221818"><Phone className="w-5 h-5" />052 222 18 18</a></Button>
                                </div>
                            </AnimatedSection>
                        </div>
                        {data.regionalImage && <AnimatedSection animation="slideUp" delay={0.2} className="hidden lg:block"><div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border"><Image src={data.regionalImage} alt={data.headline} fill className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" /></div></AnimatedSection>}
                    </div>
                </div>
            </section>

            <section className="py-12 lg:py-16 bg-background">
                <div className="container mx-auto px-4"><AnimatedSection animation="slideUp">
                    <p className="text-lg text-text-secondary leading-relaxed mb-8">{data.intro}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-card border border-border"><h3 className="text-lg font-bold text-text-primary mb-4">Vorteile in {data.name}</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{data.localBenefits.map((b, i) => <div key={i} className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary flex-shrink-0" /><span className="text-base text-text-secondary">{b}</span></div>)}</div></div>
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary"><h3 className="text-lg font-bold text-text-primary mb-4">In Zahlen</h3><div className="grid grid-cols-2 gap-4">{data.stats.map((s, i) => <div key={i} className="text-center"><div className="text-2xl font-bold text-primary">{s.value}</div><div className="text-sm text-text-secondary">{s.label}</div></div>)}</div><div className="mt-4 pt-4 border-t border-primary/20 text-center"><div className="text-sm text-text-secondary">Anfahrtskosten</div><div className="font-bold text-primary">{data.anfahrt}</div></div></div>
                    </div>
                </AnimatedSection></div>
            </section>

            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Unsere IT-Support Leistungen</h2><p className="text-text-secondary">Kompetente Hilfe bei allen IT-Problemen</p></AnimatedSection>
                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>{services.map((s, i) => <StaggerItem key={i}><div className="h-full p-6 rounded-2xl bg-card border border-border text-center"><div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">{s.icon}</div><h3 className="text-base font-bold text-text-primary mb-2">{s.title}</h3><p className="text-base text-text-secondary">{s.desc}</p></div></StaggerItem>)}</StaggerContainer>
                </div>
            </section>

            <section className="py-16 lg:py-24 bg-background" id="preise">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Unsere Preise für {data.name}</h2>
                        <p className="text-text-secondary max-w-xl mx-auto">Transparente Preise ohne versteckte Kosten. Abrechnung im 15-Minuten-Takt.</p>
                    </AnimatedSection>
                    
                    <div>
                        {/* Preis-Karten */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            <div className="p-6 rounded-2xl bg-card border border-border text-center">
                                <Monitor className="w-8 h-8 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-text-primary mb-2">Remote-Support</h3>
                                <p className="text-3xl font-bold text-primary mb-2">ab CHF 130.–/h</p>
                                <p className="text-sm text-text-secondary">Schnellste Lösung – meist innert 15 Minuten</p>
                                <p className="text-xs text-text-secondary mt-2">Mindestverrechnung: 15 Minuten</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-primary/5 border border-primary text-center">
                                <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-text-primary mb-2">Vor-Ort in {data.name}</h3>
                                <p className="text-3xl font-bold text-primary mb-2">ab CHF 145.–/h</p>
                                <p className="text-sm text-primary">Persönlich bei Ihnen</p>
                                <p className="text-xs text-primary mt-2">{data.anfahrt}</p>
                                <p className="text-xs text-text-secondary mt-1">Mindestverrechnung: 30 Minuten</p>
                            </div>
                        </div>
                        
                        {/* Supportzeiten */}
                        <div className="bg-card border border-border rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Supportzeiten & Zuschläge</h3>
                            <ul className="space-y-2 text-base">
                                <li className="flex items-center justify-between p-2 rounded bg-background">
                                    <span className="text-text-secondary">Mo–Fr 08:00–17:00</span>
                                    <span className="font-medium text-text-primary">Normaltarif</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded bg-yellow-50 dark:bg-yellow-900/20">
                                    <span className="text-text-secondary">Mo–Fr 17:00–23:00</span>
                                    <span className="font-medium text-yellow-700 dark:text-yellow-400">+25% Zuschlag</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded bg-orange-50 dark:bg-orange-900/20">
                                    <span className="text-text-secondary">Sa / So / Feiertage</span>
                                    <span className="font-medium text-orange-700 dark:text-orange-400">+50% Zuschlag</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-900/20">
                                    <span className="text-text-secondary">23:00–08:00</span>
                                    <span className="font-medium text-red-700 dark:text-red-400">nur mit SLA, +100%</span>
                                </li>
                            </ul>
                            <p className="text-sm text-text-secondary mt-4 leading-relaxed">
                                Support bis 23:00 Uhr sowie an Wochenenden und Feiertagen ist verfügbar (mit Zuschlag, Best-Effort). 
                                Ohne aktives SLA sind Einsätze zwischen 23:00 und 08:00 Uhr ausgeschlossen.
                            </p>
                        </div>
                        
                        {/* Notfall-Kontakt */}
                        <div className="bg-primary text-white rounded-xl p-6 text-center">
                            <p className="font-bold mb-2">IT-Notfall? Sofort erreichbar bis 23:00 Uhr</p>
                            <a href="tel:+41765875055" className="text-2xl font-black block mb-3 hover:underline">076 587 50 55</a>
                            <div className="flex gap-3 justify-center">
                                <Button variant="secondary" size="sm" className="bg-white text-primary hover:bg-white/90" asChild>
                                    <a href="tel:+41765875055"><Phone className="w-4 h-4" />Anrufen</a>
                                </Button>
                                <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                                    <a href="https://wa.me/41765875055" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                                </Button>
                            </div>
                        </div>
                        
                        {/* Link zur Hauptseite */}
                        <div className="text-center mt-6">
                            <Link href="/it-support#preise" className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1">
                                <ArrowRight className="w-4 h-4" />
                                Alle Leistungen & Details auf der IT-Support Hauptseite
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {data.localIndustries?.length > 0 && <section className="py-12 lg:py-16 bg-surface"><div className="container mx-auto px-4"><AnimatedSection animation="slideUp" className="text-center mb-12"><h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">IT-Lösungen für {data.name}</h2></AnimatedSection><div className="grid md:grid-cols-3 gap-6">{data.localIndustries.map((ind, i) => <div key={i} className="p-6 rounded-2xl bg-card border border-border"><h3 className="text-base font-bold text-text-primary mb-2">{ind.name}</h3><p className="text-base text-text-secondary">{ind.need}</p></div>)}</div></div></section>}

            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Haeufige Fragen</h2></AnimatedSection>
                    <div className="max-w-3xl mx-auto"><FAQList items={generalFaqs} />{data.localFaqQuestion && <div className="mt-4 rounded-xl border-2 border-primary bg-primary/5 p-4"><h4 className="font-medium text-text-primary mb-2">{data.localFaqQuestion}</h4><p className="text-text-secondary">{data.localFaqAnswer}</p></div>}{data.additionalFaqs?.length > 0 && <div className="mt-4"><FAQList items={data.additionalFaqs} /></div>}</div>
                </div>
            </section>

            <section className="py-12 lg:py-16 bg-surface">
                <div className="container mx-auto px-4"><h3 className="text-center text-xl font-bold text-text-primary mb-6">IT-Support in weiteren Regionen</h3><div className="flex flex-wrap justify-center gap-3">{otherRegions.map((r, i) => <Link key={i} href={`/it-support/${r.slug}`} className="px-5 py-2.5 rounded-lg bg-card border border-border hover:border-primary hover:text-primary transition-colors text-base font-medium text-text-secondary">{r.name}</Link>)}</div></div>
            </section>

            <section className="py-16 lg:py-20 bg-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">IT-Probleme? Wir helfen!</h2>
                    <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">Rufen Sie uns an oder schreiben Sie uns.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90" asChild><Link href="/kontakt">Anfrage stellen<ArrowRight className="w-5 h-5" /></Link></Button>
                        <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary" asChild><a href="tel:+41522221818"><Phone className="w-5 h-5" />052 222 18 18</a></Button>
                    </div>
                </div>
            </section>
        </>
    );
}