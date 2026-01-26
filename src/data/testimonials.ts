export interface Testimonial {
    name: string;
    company: string;
    quote: string;
    rating: number;
    service: string;
    googleReviewUrl: string;
}

export const testimonials: Testimonial[] = [
    {
        name: 'Mario Frunz',
        company: 'Kunde',
        quote: 'Wir haben unsere IT-Infrastruktur durch Infraone IT Solutions in die Cloud migrieren lassen und zusätzlich MS Teams-Telefonie integriert. Alles lief reibungslos, ohne Unterbruch und genau nach Plan! Ein grosses Dankeschön an Herrn Avci, kompetent, freundlich und sehr kundenorientiert. So muss es sein! Absolut empfehlenswert.',
        rating: 5,
        service: 'IT-Infrastruktur & Cloud-Services',
        googleReviewUrl: 'https://share.google/YS1oVXarq50n4NxsM',
    },
    {
        name: 'Konradhof Winterthur',
        company: 'Seniorenresidenz',
        quote: 'Mein alter PC wurde durch einen neuen ersetzt und alles wurde komplett neu eingerichtet. Es hat alles super funktioniert und ich bin sehr zufrieden. Besonders positiv war die Geduld bei allen Fragen und die tolle Unterstützung. Auch das Preis-Leistungs-Verhältnis ist top. Absolut empfehlenswert!',
        rating: 5,
        service: 'IT-Support',
        googleReviewUrl: 'https://share.google/xrm3qel1mOSO6BCIN',
    },
    {
        name: 'crespo',
        company: 'Kunde',
        quote: 'Wir haben das Redesign der Website über infraone machen lassen, sind super happy, top Preis Leistung 😊',
        rating: 5,
        service: 'Webdesign',
        googleReviewUrl: 'https://share.google/OOk41zHuMCm0XdRIr',
    },
    {
        name: 'Jennifer Köhler',
        company: 'Kundin',
        quote: 'Toller Service, sehr hilfsbereit, nett, speditiv, was besprochen wurde, wurde umgesetzt resp. noch übertroffen und alles zu einem fairen Preis. Es wird zudem die beste Lösung für den Kunden empfohlen und nicht die profitabelste für den Anbieter. Darüber hinaus habe ich noch weitere wertvolle Tipps erhalten. Kann ich nur empfehlen!',
        rating: 5,
        service: 'Beratung & Serviceleistung',
        googleReviewUrl: 'https://share.google/EY8nObDDSjntmDKeU',
    },
];
