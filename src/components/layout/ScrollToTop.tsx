'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global scroll handler that instantly jumps to top on route changes
 * Prevents smooth scrolling animation that Next.js uses by default.
 * Respects hash anchors: if URL has #hash, scrolls to that element instead of top.
 */
export function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            // Hash-Anker — kurz warten, bis die neue Seite gerendert ist, dann zum Element scrollen.
            // scroll-mt-* Tailwind-Klassen am Ziel-Element setzen den korrekten Offset für den fixed Header.
            const id = decodeURIComponent(hash.slice(1));
            const scrollToHash = () => {
                const el = document.getElementById(id);
                if (el) {
                    el.scrollIntoView({ behavior: 'instant', block: 'start' });
                } else {
                    // Element noch nicht da — kurz nochmal versuchen
                    setTimeout(() => {
                        const retry = document.getElementById(id);
                        if (retry) retry.scrollIntoView({ behavior: 'instant', block: 'start' });
                    }, 100);
                }
            };
            // Doppeltes requestAnimationFrame wartet auf Layout-Commit der neuen Seite
            requestAnimationFrame(() => requestAnimationFrame(scrollToHash));
            return;
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);

    return null;
}
