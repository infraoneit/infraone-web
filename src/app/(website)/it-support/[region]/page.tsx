import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, CheckCircle, ArrowRight, Monitor, Headphones, Shield, Wrench } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { FAQList } from '@/components/ui/FAQList';
import { generateLocalBusinessSchema, generateProfessionalServiceSchema, generateFAQSchema } from '@/lib/seo/schema';
import { getITSupportRegion, getAllITSupportRegionSlugs } from '@/lib/leistungen';

const services = [
    { icon: <Monitor className="w-6 h-6" />, title: 'PC & Laptop Support', desc: 'Windows, Mac, Hardware' },
    { icon: <Shield className="w-6 h-6" />, title: 'Netzwerk & Server', desc: 'Einrichtung, Wartung' },
    { icon: <Headphones className="w-6 h-6" />, title: 'Remote-Support', desc: 'Schnelle Hilfe via Fernzugriff' },
    { icon: <Wrench className="w-6 h-6" />, title: 'Microsoft 365', desc: 'Einrichtung, Migration' },
];

const generalFaqs = [
    { question: 'Wie schnell koennen Sie helfen?', answer: 'Remote-Support ist meist innert 15 Minuten verfuegbar.' },
    { question: 'Was kostet der IT-Support?', answer: 'Remote: CHF 120/h. Vor-Ort: CHF 157/h.' },
    { question: 'Betreuen Sie auch Privatpersonen?', answer: 'Ja! Wir helfen KMU und Privatpersonen.' },
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
    const schemaType = data.schemaType || 'LocalBusiness';
    const areaServed = data.areaServed || [data.name];
    
    const mainSchema = schemaType === 'ProfessionalService'
        ? generateProfessionalServiceSchema(region, data.headline, `https://www.infraone.ch/it-support/${region}`, areaServed)
        : generateLocalBusinessSchema(region, 'IT-Support', `https://www.infraone.ch/it-support/${region}`, areaServed);
    
    const allFaqs = [...generalFaqs, ...(data.localFaqQuestion ? [{ question: data.localFaqQuestion, answer: data.localFaqAnswer }] : []), ...(data.additionalFaqs || [])];
    const faqSchema = data.includeFaqSchema !== false ? generateFAQSchema(allFaqs) : null;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(mainSchema) }} />
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
                <div className="container mx-auto px-4"><div className="max-w-4xl mx-auto"><AnimatedSection animation="slideUp">
                    <p className="text-lg text-text-secondary leading-relaxed mb-8">{data.intro}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-card border border-border"><h3 className="font-bold text-text-primary mb-4">Vorteile in {data.name}</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{data.localBenefits.map((b, i) => <div key={i} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary flex-shrink-0" /><span className="text-sm text-text-secondary">{b}</span></div>)}</div></div>
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary"><h3 className="font-bold text-text-primary mb-4">In Zahlen</h3><div className="grid grid-cols-2 gap-4">{data.stats.map((s, i) => <div key={i} className="text-center"><div className="text-2xl font-bold text-primary">{s.value}</div><div className="text-xs text-text-secondary">{s.label}</div></div>)}</div><div className="mt-4 pt-4 border-t border-primary/20 text-center"><div className="text-sm text-text-secondary">Anfahrtskosten</div><div className="font-bold text-primary">{data.anfahrt}</div></div></div>
                    </div>
                </AnimatedSection></div></div>
            </section>

            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Unsere IT-Support Leistungen</h2><p className="text-text-secondary">Kompetente Hilfe bei allen IT-Problemen</p></AnimatedSection>
                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto" staggerDelay={0.1}>{services.map((s, i) => <StaggerItem key={i}><div className="h-full p-6 rounded-2xl bg-card border border-border text-center"><div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">{s.icon}</div><h3 className="font-bold text-text-primary mb-2">{s.title}</h3><p className="text-sm text-text-secondary">{s.desc}</p></div></StaggerItem>)}</StaggerContainer>
                </div>
            </section>

            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">IT-Support Preise</h2></AnimatedSection>
                    <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-card border border-border text-center"><Monitor className="w-8 h-8 text-primary mx-auto mb-4" /><h3 className="font-bold text-text-primary mb-2">Remote-Support</h3><p className="text-3xl font-bold text-primary">CHF 120/h</p></div>
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary text-center"><MapPin className="w-8 h-8 text-primary mx-auto mb-4" /><h3 className="font-bold text-text-primary mb-2">Vor-Ort-Support</h3><p className="text-3xl font-bold text-primary">CHF 157/h</p><p className="text-xs text-primary mt-1">+ {data.anfahrt}</p></div>
                    </div>
                </div>
            </section>

            {data.localIndustries?.length > 0 && <section className="py-12 lg:py-16 bg-surface"><div className="container mx-auto px-4"><AnimatedSection animation="slideUp" className="text-center mb-12"><h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">IT-Loesungen fuer {data.name}</h2></AnimatedSection><div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">{data.localIndustries.map((ind, i) => <div key={i} className="p-6 rounded-2xl bg-card border border-border"><h3 className="font-bold text-text-primary mb-2">{ind.name}</h3><p className="text-sm text-text-secondary">{ind.need}</p></div>)}</div></div></section>}

            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Haeufige Fragen</h2></AnimatedSection>
                    <div className="max-w-3xl mx-auto"><FAQList items={generalFaqs} />{data.localFaqQuestion && <div className="mt-4 rounded-xl border-2 border-primary bg-primary/5 p-4"><h4 className="font-medium text-text-primary mb-2">{data.localFaqQuestion}</h4><p className="text-text-secondary">{data.localFaqAnswer}</p></div>}{data.additionalFaqs?.length > 0 && <div className="mt-4"><FAQList items={data.additionalFaqs} /></div>}</div>
                </div>
            </section>

            <section className="py-12 lg:py-16 bg-surface">
                <div className="container mx-auto px-4"><h3 className="text-center text-lg font-bold text-text-primary mb-6">IT-Support in weiteren Regionen</h3><div className="flex flex-wrap justify-center gap-3">{otherRegions.map((r, i) => <Link key={i} href={`/it-support/${r.slug}`} className="px-4 py-2 rounded-lg bg-card border border-border hover:border-primary hover:text-primary transition-colors text-sm font-medium text-text-secondary">{r.name}</Link>)}</div></div>
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