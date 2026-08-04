import Image from 'next/image';
import { cn } from '@/lib/utils';

// Hinweis: TP-Link fehlt hier, weil der Hersteller kein offizielles
// SVG-Logo bereitstellt (nur PNG). Nicht selbst nachzeichnen.
const partners = [
    { name: 'Microsoft', logo: '/images/partners/partner-microsoft.svg' },
    { name: '3CX', logo: '/images/partners/partner-3cx.svg' },
    { name: 'Fortinet', logo: '/images/partners/partner-fortinet.svg' },
    { name: 'HPE', logo: '/images/partners/partner-hpe.svg' },
    { name: 'Lenovo', logo: '/images/partners/partner-lenovo.svg' },
    { name: 'Sophos', logo: '/images/partners/partner-sophos.svg' },
    { name: 'Swisscom', logo: '/images/partners/partner-swisscom.svg' },
    { name: 'Synology', logo: '/images/partners/partner-synology.svg' },
    { name: 'Ubiquiti', logo: '/images/partners/partner-ubiquiti.svg' },
    { name: 'VMware', logo: '/images/partners/partner-vmware.svg' },
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
                <h2 className="text-center text-sm font-medium text-text-secondary mb-10 uppercase tracking-wider">
                    Unsere Partner & Technologien
                </h2>
            </div>

            <div className="relative">
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
                                    "dark:brightness-0 dark:invert"
                                )}

                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

