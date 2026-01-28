'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
    { name: 'BlackBox', logo: '/images/partners/partner-blackbox.svg' },
    { name: 'iWay', logo: '/images/partners/partner-iway.svg' },
    { name: 'peoplefone', logo: '/images/partners/partner-peoplefone.svg' },
];

export function PartnerSlider() {
    // Mobile detection for responsive animation speed
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

                {/* Scrolling Container */}
                <motion.div
                    key={isMobile ? 'mobile-anim' : 'desktop-anim'}
                    className="flex gap-8 items-center"
                    animate={{
                        x: ['0%', '-50%'],
                    }}
                    transition={{
                        x: {
                            duration: isMobile ? 4 : 40,
                            repeat: Infinity,
                            ease: 'linear',
                        },
                    }}
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
                </motion.div>
            </div>
        </section>
    );
}

