import {
    Children,
    cloneElement,
    isValidElement,
    type CSSProperties,
    type ReactElement,
    type ReactNode,
} from 'react';

/**
 * Reveal-System - reine Server-Komponente, kein Client-JavaScript.
 *
 * Frueher: 'use client' + IntersectionObserver + useState. Der Inhalt startete
 * mit opacity:0 und wurde erst nach der Hydration sichtbar - die Seite war bis
 * dahin inhaltlich leer und wirkte defekt.
 *
 * Jetzt: Der Inhalt ist sofort sichtbar. Die Einblend-Animation uebernimmt CSS
 * (animation-timeline: view() in globals.css), wo der Browser sie beherrscht.
 */

type AnimationType = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'none';

const animationClasses: Record<AnimationType, string> = {
    fadeIn: 'reveal-fade-in',
    slideUp: 'reveal-slide-up',
    slideDown: 'reveal-slide-down',
    slideLeft: 'reveal-slide-left',
    slideRight: 'reveal-slide-right',
    scale: 'reveal-scale',
    none: 'reveal-none',
};

interface AnimatedSectionProps {
    children: ReactNode;
    animation?: AnimationType;
    delay?: number;
    duration?: number;
    className?: string;
    /** Nur noch zur API-Kompatibilitaet - ohne Wirkung. */
    once?: boolean;
    threshold?: number;
}

export function AnimatedSection({
    children,
    animation = 'slideUp',
    delay = 0,
    className = '',
}: AnimatedSectionProps) {
    return (
        <div
            className={`reveal ${animationClasses[animation]}${className ? ` ${className}` : ''}`}
            style={delay ? { animationDelay: `${delay}s` } : undefined}
        >
            {children}
        </div>
    );
}

interface StaggerContainerProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
    once?: boolean;
}

export function StaggerContainer({
    children,
    className = '',
    staggerDelay = 0.1,
}: StaggerContainerProps) {
    const items = Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;
        const childStyle = (child.props as { style?: CSSProperties }).style ?? {};
        return cloneElement(child as ReactElement<{ style?: CSSProperties }>, {
            style: { ...childStyle, animationDelay: `${index * staggerDelay}s` },
        });
    });

    return (
        <div className={`reveal-stagger-container${className ? ` ${className}` : ''}`}>
            {items}
        </div>
    );
}

export function StaggerItem({
    children,
    className = '',
    style,
}: {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div className={`reveal-stagger-item${className ? ` ${className}` : ''}`} style={style}>
            {children}
        </div>
    );
}
