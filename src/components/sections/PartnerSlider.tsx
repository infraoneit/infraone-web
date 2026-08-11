import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// TP-Link-SVG ist rein weiss -> brightness-0 macht es im Light-Mode schwarz,
// dark:invert dreht es im Dark-Mode wieder auf weiss (wie alle anderen Logos).
const partners: { name: string; logo: string; logoClass?: string }[] = [
    { name: 'Microsoft', logo: '/images/partners/partner-microsoft.svg' },
    { name: '3CX', logo: '/images/partners/partner-3cx.svg' },
    { name: 'Fortinet', logo: '/images/partners/partner-fortinet.svg' },
    { name: 'HPE', logo: '/images/partners/partner-hpe.svg' },
    { name: 'Lenovo', logo: '/images/partners/partner-lenovo.svg' },
    { name: 'Sophos', logo: '/images/partners/partner-sophos.svg' },
    { name: 'Proxmox', logo: '/images/partners/proxmox-black.svg' },
    { name: 'Synology', logo: '/images/partners/partner-synology.svg' },
    { name: 'Ubiquiti', logo: '/images/partners/partner-ubiquiti.svg' },
    { name: 'TP-Link', logo: '/images/partners/TP-Link-logo.svg', logoClass: 'brightness-0 dark:invert' },
    { name: 'iWay', logo: '/images/partners/partner-iway.svg' },
    { name: 'peoplefone', logo: '/images/partners/partner-peoplefone.svg' },
];

// Dauer des Marquee-Umlaufs: 20 s, definiert in globals.css (.animate-marquee).
// Die Liste wird verdoppelt und die Animation endet exakt bei -50 %,
// dadurch ist die Schleife auf allen Viewport-Breiten nahtlos und
// die Laufgeschwindigkeit pro Logo ist auf Mobile und Desktop gleich.

export function PartnerSlider() {
    // Duplicate the partners array for seamless infinite scroll
    const extendedPartners = [...partners, ...partners];

    return (
        <section className="py-12 lg:py-16 bg-surface border-y border-border overflow-hidden">
            <div className="container mx-auto px-4">
                <Link
                    href="/partner"
                    className="block text-center mb-10 group"
                    aria-label="Zur Partnerseite"
                >
                    <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider group-hover:text-primary transition-colors">
                        Unsere Partner &amp; Technologien
                    </h2>
                    <span className="inline-flex items-center gap-1 mt-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Alle Partner ansehen
                        <ArrowRight className="w-4 h-4" />
                    </span>
                </Link>
            </div>

            {/* Der ganze Logo-Streifen fuehrt ebenfalls zur Partnerseite */}
            <Link href="/partner" className="relative block" aria-label="Zur Partnerseite">
                {/* Gradient Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-surface to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-surface to-transparent z-10" />

                {/* Scrolling Container — w-max: Breite = Inhalt, damit -50 % exakt der
                    halben (verdoppelten) Liste entspricht und die Schleife nahtlos ist */}
                <div
                    className="flex gap-8 items-center w-max animate-marquee"
                >
                    {extendedPartners.map((partner, index) => (
                        <div
                            key={`${partner.name}-${index}`}
                            className="flex-shrink-0 w-56 h-24 flex items-center justify-center"

                        >
                            <Image
                                src={partner.logo}
                                alt={partner.name}
                                width={224}
                                height={96}
                                className={cn(
                                    "w-full h-auto object-contain transition-all duration-300",
                                    "dark:brightness-0 dark:invert",
                                    partner.logoClass
                                )}

                            />
                        </div>
                    ))}
                </div>
            </Link>
        </section>
    );
}

