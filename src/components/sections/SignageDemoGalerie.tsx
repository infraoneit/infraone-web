'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DemoView {
    src: string;
    caption: string;
    objectFit?: 'cover' | 'contain';
}

const DEMO_VIEWS: DemoView[] = [
    {
        src: '/images/signage-demo/admin-bildschirme.webp',
        caption: 'Alle Bildschirme im Blick – mit Live-Vorschau jedes einzelnen Displays.',
    },
    {
        src: '/images/signage-demo/admin-playlist-editor.webp',
        caption: 'Der Playlist-Editor: Reihenfolge, Dauer pro Element, Webseiten und eigenes HTML.',
    },
    {
        src: '/images/signage-demo/admin-playlists.webp',
        caption: 'Playlists für jeden Bildschirm – das Mittagsmenü kennt seinen Zeitplan selbst.',
    },
    {
        src: '/images/signage-demo/admin-layouts.webp',
        caption: 'Zonen-Layouts: ein Bildschirm, mehrere Bereiche – Menü links, Uhr rechts.',
    },
    {
        src: '/images/signage-demo/admin-medien.webp',
        caption: 'Medien hochladen, fertig – PDFs werden automatisch zu schnellen Bildseiten.',
    },
];

const SWIPE_THRESHOLD = 50;

export function SignageDemoGalerie() {
    const [index, setIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);

    const goTo = useCallback((next: number) => {
        setIndex(((next % DEMO_VIEWS.length) + DEMO_VIEWS.length) % DEMO_VIEWS.length);
    }, []);

    const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
    const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

    // Pfeiltasten-Navigation, sobald die Galerie Fokus hat
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                goPrev();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                goNext();
            }
        },
        [goPrev, goNext]
    );

    // Touch-Wischen: einfaches touchstart/touchend-Delta
    const handleTouchStart = useCallback((event: React.TouchEvent) => {
        touchStartX.current = event.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(
        (event: React.TouchEvent) => {
            if (touchStartX.current === null) return;
            const delta = event.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(delta) < SWIPE_THRESHOLD) return;
            if (delta > 0) {
                goPrev();
            } else {
                goNext();
            }
        },
        [goPrev, goNext]
    );

    const current = DEMO_VIEWS[index];

    return (
        <div
            className="w-full min-w-0 outline-none"
            tabIndex={0}
            role="region"
            aria-label="Demo-Galerie infraone-signage"
            onKeyDown={handleKeyDown}
        >
            {/* Grosses Vorschaubild */}
            <div
                className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl border border-border bg-surface"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <Image
                    key={current.src}
                    src={current.src}
                    alt={current.caption}
                    fill
                    priority={index === 0}
                    loading={index === 0 ? undefined : 'lazy'}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className={`${current.objectFit === 'contain' ? 'object-contain' : 'object-cover'} animate-fade-in-motion-safe`}
                />

                {/* Vor/Zurueck-Buttons */}
                <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Vorherige Ansicht"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border text-text-primary flex items-center justify-center hover:bg-background transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onClick={goNext}
                    aria-label="Nächste Ansicht"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border text-text-primary flex items-center justify-center hover:bg-background transition-colors"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Bildunterschrift */}
            <p className="text-center text-text-secondary mt-4 min-h-[4.5rem] md:min-h-[3rem] px-4" aria-live="polite">
                {current.caption}
            </p>

            {/* Thumbnail-Leiste */}
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2 justify-start md:justify-center">
                {DEMO_VIEWS.map((view, i) => (
                    <button
                        key={view.src}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`Ansicht ${i + 1}: ${view.caption}`}
                        aria-current={i === index}
                        className={`relative flex-shrink-0 w-24 md:w-28 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                            i === index
                                ? 'border-primary shadow-md'
                                : 'border-border opacity-60 hover:opacity-100'
                        }`}
                    >
                        <Image
                            src={view.src}
                            alt=""
                            fill
                            loading="lazy"
                            sizes="112px"
                            className={view.objectFit === 'contain' ? 'object-contain bg-surface' : 'object-cover'}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
