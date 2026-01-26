'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global scroll handler that instantly jumps to top on route changes
 * Prevents smooth scrolling animation that Next.js uses by default
 */
export function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        // Instant jump to top on route change (no smooth animation)
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);

    return null; // This component doesn't render anything
}
