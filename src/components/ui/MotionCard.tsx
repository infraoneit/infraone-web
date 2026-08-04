import { type CSSProperties, type ReactNode } from 'react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

interface MotionCardProps {
    children: ReactNode;
    className?: string;
    hoverY?: number;
    hoverX?: number;
}

export function MotionCard({ children, className = '', hoverY = -5, hoverX = 0 }: MotionCardProps) {
    return (
        <div
            className={`hover-lift${className ? ` ${className}` : ''}`}
            style={{
                '--hover-x': `${hoverX}px`,
                '--hover-y': `${hoverY}px`,
            } as CSSProperties}
        >
            {children}
        </div>
    );
}

interface MotionCTAProps {
    children: ReactNode;
    className?: string;
}

export function MotionCTA({ children, className = '' }: MotionCTAProps) {
    return (
        <AnimatedSection animation="slideUp" className={className}>
            {children}
        </AnimatedSection>
    );
}
