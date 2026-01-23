'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const partners = [
    { name: 'Microsoft', logo: '/images/partners/partner-microsoft.png' },
    { name: '3CX', logo: '/images/partners/partner-3cx.png' },
    { name: 'Cisco', logo: '/images/partners/partner-cisco.jpg' },
    { name: 'Fortinet', logo: '/images/partners/partner-fortinet.png' },
    { name: 'HPE', logo: '/images/partners/partner-hpe.png' },
    { name: 'Lenovo', logo: '/images/partners/partner-lenovo.jpg' },
    { name: 'Sophos', logo: '/images/partners/partner-sophos.jpg' },
    { name: 'Swisscom', logo: '/images/partners/partner-swisscom.png' },
    { name: 'Synology', logo: '/images/partners/partner-synology.jpg' },
    { name: 'Ubiquiti', logo: '/images/partners/partner-ubiquiti.png' },
    { name: 'Veeam', logo: '/images/partners/partner-veeam.png' },
    { name: 'VMware', logo: '/images/partners/partner-vmware.png' },
    { name: 'BlackBox', logo: '/images/partners/partner-blackbox.png' },
    { name: 'Axis', logo: '/images/partners/partner-axis.png' },
    { name: 'Milestone', logo: '/images/partners/partner-milestone.png' },
    { name: 'AG Neovo', logo: '/images/partners/partner-agneovo.png' },
    { name: 'Samsung', logo: '/images/partners/partner-samung.png' },
    { name: 'Proxmox', logo: '/images/partners/partner-proxmox.png' },
    { name: 'iWay', logo: '/images/partners/partner-iway.png' },
    { name: 'Digital Republic', logo: '/images/partners/partner-digital-republic.png' },
    { name: 'Wildix', logo: '/images/partners/partner-wildix.png' },
    { name: 'Wix', logo: '/images/partners/partner-wix.png' },
    { name: 'Also', logo: '/images/partners/partner-also.jpg' },
    { name: 'EET', logo: '/images/partners/partner-eet.jpg' },
];

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

                {/* Scrolling Container */}
                <motion.div
                    className="flex gap-8 items-center"
                    animate={{
                        x: ['0%', '-50%'],
                    }}
                    transition={{
                        x: {
                            duration: 40,
                            repeat: Infinity,
                            ease: 'linear',
                        },
                    }}
                >
                    {extendedPartners.map((partner, index) => (
                        <div
                            key={`${partner.name}-${index}`}
                            className="flex-shrink-0 group"
                        >
                            <div className="w-40 h-20 flex items-center justify-center rounded-xl bg-background/50 dark:bg-card/80 border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-150 p-4">
                                <Image
                                    src={partner.logo}
                                    alt={partner.name}
                                    width={120}
                                    height={60}
                                    className="object-contain max-h-16 w-auto grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-150"
                                />
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

