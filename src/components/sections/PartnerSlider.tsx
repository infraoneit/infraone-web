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
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/76e31c2b-b08d-4504-912c-35dd7c31c4ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PartnerSlider.tsx:31',message:'Mobile detection',data:{isMobile:mobile,windowWidth:window.innerWidth},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
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
                            ref={index === 0 ? (el) => {
                                if (el) {
                                    // #region agent log
                                    const styles = window.getComputedStyle(el);
                                    fetch('http://127.0.0.1:7243/ingest/76e31c2b-b08d-4504-912c-35dd7c31c4ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PartnerSlider.tsx:68',message:'Container computed styles',data:{className:el.className,width:styles.width,height:styles.height,display:styles.display},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
                                    // #endregion
                                }
                            } : undefined}
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
                                ref={index === 0 ? (img) => {
                                    if (img) {
                                        // #region agent log
                                        const imgStyles = window.getComputedStyle(img);
                                        fetch('http://127.0.0.1:7243/ingest/76e31c2b-b08d-4504-912c-35dd7c31c4ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PartnerSlider.tsx:77',message:'Image computed styles POST-FIX',data:{width:imgStyles.width,height:imgStyles.height,maxWidth:imgStyles.maxWidth,maxHeight:imgStyles.maxHeight,objectFit:imgStyles.objectFit},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'BC'})}).catch(()=>{});
                                        // #endregion
                                    }
                                } : undefined}
                            />
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

