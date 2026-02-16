'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionCardProps {
    children: ReactNode;
    className?: string;
    hoverY?: number;
    hoverX?: number;
}

export function MotionCard({ children, className = '', hoverY = -5, hoverX = 0 }: MotionCardProps) {
    return (
        <motion.div
            whileHover={{ y: hoverY, x: hoverX }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface MotionCTAProps {
    children: ReactNode;
    className?: string;
}

export function MotionCTA({ children, className = '' }: MotionCTAProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
