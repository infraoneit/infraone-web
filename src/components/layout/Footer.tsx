import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react';

const footerLinks = {
    services: [
        { label: 'IT-Support / Informatik', href: '/it-support' },
        { label: 'Cloud-Telefonie', href: '/cloud-telefonie' },
        { label: 'IT-Systeme & Netzwerke', href: '/it-netzwerke' },
        { label: 'Telefonie & Kommunikation', href: '/telefonie' },
        { label: 'Videoüberwachung', href: '/videoueberwachung' },
        { label: 'Webdesign', href: '/webdesign' },
        { label: 'Software-Entwicklung', href: '/software-entwicklung' },
        { label: 'Kontrollraum-Lösungen', href: '/kontrollraum' },
        { label: 'Digital Signage', href: '/digital-signage' },
        { label: 'Gebäudeautomation', href: '/gebaeudeautomation' },
    ],
    company: [
        { label: 'Über uns', href: '/unternehmen' },
        { label: 'Blog', href: '/blog' },
        { label: 'Kontakt', href: '/kontakt' },
    ],
    legal: [
        { label: 'AGB', href: '/agb' },
        { label: 'Datenschutz', href: '/datenschutz' },
        { label: 'Impressum', href: '/impressum' },
    ],
    partnerSites: [
        { label: 'cloud-telefonanlagen.ch', href: 'https://cloud-telefonanlagen.ch' },
        { label: 'informatik-schweiz.ch', href: 'https://informatik-schweiz.ch' },
        { label: 'informatik-support.ch', href: 'https://informatik-support.ch' },
        { label: 'werbebildschirme.ch', href: 'https://werbebildschirme.ch' },
    ],
};

const locations = [
    {
        city: 'Winterthur',
        isMain: true,
        street: 'Rudolf-Diesel-Strasse 25',
        zip: '8404',
        mapUrl: 'https://maps.app.goo.gl/KZcGeudRfoJSirLA9',
    },
    {
        city: 'Schaffhausen',
        isMain: false,
        street: 'Solenbergstrasse 35',
        zip: '8207',
        mapUrl: 'https://maps.google.com/?q=Solenbergstrasse+35+8207+Schaffhausen',
    },
    {
        city: 'Tägerwilen',
        isMain: false,
        street: 'Bahnhofstrasse 17',
        zip: '8274',
        mapUrl: 'https://maps.google.com/?q=Bahnhofstrasse+17+8274+Tägerwilen',
    },
    {
        city: 'Kleinandelfingen',
        isMain: false,
        street: 'Einfangstrasse 8',
        zip: '8451',
        mapUrl: 'https://maps.google.com/?q=Einfangstrasse+8+8451+Kleinandelfingen',
    },
];

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-surface border-t border-border">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Company Info & Locations */}
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-bold text-text-primary mb-4">
                            InfraOne IT Solutions
                        </h3>
                        <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                            Digitale Lösungen für KMU & Privatpersonen – IT-Support, Webdesign & Cloud Telefonanlagen in der Deutschschweiz.
                        </p>

                        {/* Locations Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {locations.map((location) => (
                                <a
                                    key={location.city}
                                    href={location.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-text-primary text-sm flex items-center gap-1">
                                                {location.city}
                                                {location.isMain && (
                                                    <span className="text-xs text-primary">(Hauptsitz)</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                {location.street}<br />
                                                {location.zip} {location.city}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 text-sm">
                            <a
                                href="tel:+41522221818"
                                className="flex items-center gap-3 text-text-secondary hover:text-primary transition-colors"
                            >
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span>052 222 18 18</span>
                            </a>
                            <a
                                href="mailto:info@infraone.ch"
                                className="flex items-center gap-3 text-text-secondary hover:text-primary transition-colors"
                            >
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span>info@infraone.ch</span>
                            </a>
                            <div className="flex items-center gap-3 text-text-secondary">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>Mo-Fr 8:00-17:00</span>
                            </div>
                        </div>
                    </div>

                    {/* Services Links */}
                    <div>
                        <h3 className="text-lg font-bold text-text-primary mb-4">Leistungen</h3>
                        <ul className="space-y-2">
                            {footerLinks.services.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-text-secondary hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company & Legal Links */}
                    <div>
                        <h3 className="text-lg font-bold text-text-primary mb-4">Unternehmen</h3>
                        <ul className="space-y-2 mb-6">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-text-secondary hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <h3 className="text-lg font-bold text-text-primary mb-4">Rechtliches</h3>
                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-text-secondary hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support, Partner Sites & CTA */}
                    <div>
                        <h3 className="text-lg font-bold text-text-primary mb-4">Support</h3>
                        <a
                            href="https://www.teamviewer.com/de/solutions/use-cases/quicksupport/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium mb-6"
                        >
                            Support Anfordern
                            <ExternalLink className="w-4 h-4" />
                        </a>

                        <div className="bg-card p-4 rounded-xl border border-border mb-6">
                            <p className="text-sm font-semibold text-primary mb-2">
                                20% Neukunden-Rabatt
                            </p>
                            <p className="text-xs text-text-secondary">
                                Als Einstieg erhalten Neukunden 20% Rabatt auf unsere Erstleistungen.
                            </p>
                        </div>

                        {/* Partner Sites */}
                        <h3 className="text-sm font-bold text-text-primary mb-3">Unsere Portale</h3>
                        <ul className="space-y-1">
                            {footerLinks.partnerSites.map((site) => (
                                <li key={site.href}>
                                    <a
                                        href={site.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        {site.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-secondary">
                        <p>© {currentYear} InfraOne IT Solutions GmbH. Alle Rechte vorbehalten.</p>
                        <p className="text-center md:text-right">
                            <span className="gradient-text font-semibold">Digitale Lösungen. Echt. Einfach.</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
