'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

interface TimelineEvent {
    year: string;
    title: string;
    description: string;
    highlight?: boolean;
}

interface TimelineProps {
    events: TimelineEvent[];
    introText?: string;
}

function TimelineItem({ event, index, isLast }: { event: TimelineEvent; index: number; isLast: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const isLeft = index % 2 === 0;

    return (
        <div ref={ref} className="relative pb-12 lg:pb-0">
            {/* Mobile & Tablet Layout */}
            <div className="lg:hidden">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="ml-16 md:ml-20 relative"
                >
                    {/* Year Badge */}
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
                        className={`absolute -left-16 md:-left-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center z-10 shadow-lg ${event.highlight ? 'bg-primary text-white' : 'bg-surface border-3 border-primary text-primary'}`}
                    >
                        <span className="text-xs md:text-sm font-bold">{event.year.slice(-2)}</span>
                    </motion.div>
                    
                    {/* Content Card */}
                    <div className={`p-5 md:p-6 rounded-2xl border ${event.highlight ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-surface border-border'}`}>
                        <span className="text-sm font-bold text-primary">{event.year}</span>
                        <h3 className="text-lg md:text-xl font-bold text-text-primary mt-1 mb-3">{event.title}</h3>
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed">{event.description}</p>
                    </div>
                </motion.div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_120px_1fr] lg:gap-8 lg:items-start lg:min-h-[280px]">
                {/* Left Content */}
                <div className={isLeft ? '' : 'invisible'}>
                    {isLeft && (
                        <motion.div
                            initial={{ opacity: 0, x: -60 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                            className={`p-8 rounded-2xl border text-right ${event.highlight ? 'bg-primary/5 border-primary shadow-xl shadow-primary/10' : 'bg-surface border-border hover:border-primary/40 hover:shadow-lg'} transition-all duration-150`}
                        >
                            <span className="text-sm font-bold text-primary tracking-wider uppercase">{event.year}</span>
                            <h3 className="text-2xl font-bold text-text-primary mt-2 mb-4">{event.title}</h3>
                            <p className="text-text-secondary leading-relaxed">{event.description}</p>
                        </motion.div>
                    )}
                </div>

                {/* Center Timeline */}
                <div className="relative flex flex-col items-center">
                    {/* Year Circle */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={isInView ? { scale: 1, rotate: 0 } : {}}
                        transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
                        className={`sticky top-32 w-20 h-20 rounded-full flex items-center justify-center z-20 shadow-xl ${event.highlight ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-surface border-4 border-primary text-primary'}`}
                    >
                        <span className="text-lg font-black">{event.year}</span>
                    </motion.div>
                    
                    {/* Connecting Line */}
                    {!isLast && (
                        <div className="w-1 flex-1 min-h-[160px] bg-gradient-to-b from-primary/40 to-primary/10 rounded-full" />
                    )}
                </div>

                {/* Right Content */}
                <div className={isLeft ? 'invisible' : ''}>
                    {!isLeft && (
                        <motion.div
                            initial={{ opacity: 0, x: 60 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                            className={`p-8 rounded-2xl border ${event.highlight ? 'bg-primary/5 border-primary shadow-xl shadow-primary/10' : 'bg-surface border-border hover:border-primary/40 hover:shadow-lg'} transition-all duration-150`}
                        >
                            <span className="text-sm font-bold text-primary tracking-wider uppercase">{event.year}</span>
                            <h3 className="text-2xl font-bold text-text-primary mt-2 mb-4">{event.title}</h3>
                            <p className="text-text-secondary leading-relaxed">{event.description}</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function Timeline({ events, introText }: TimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end center"]
    });

    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <div ref={containerRef} className="relative">
            {/* Intro Text */}
            {introText && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="max-w-3xl mx-auto text-center mb-12 md:mb-16 lg:mb-24 px-4"
                >
                    <p className="text-lg md:text-xl text-text-secondary leading-relaxed italic">
                        {introText}
                    </p>
                </motion.div>
            )}

            {/* Timeline Container */}
            <div className="relative">
                {/* Mobile & Tablet Vertical Line */}
                <div className="lg:hidden absolute left-5 md:left-6 top-0 bottom-0 w-0.5 bg-border/50 rounded-full">
                    <motion.div
                        style={{ height: lineHeight }}
                        className="w-full bg-gradient-to-b from-primary via-primary to-primary/30 rounded-full"
                    />
                </div>

                {/* Desktop Center Line */}
                <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-border/30 rounded-full">
                    <motion.div
                        style={{ height: lineHeight }}
                        className="w-full bg-gradient-to-b from-primary via-primary to-primary/30 rounded-full"
                    />
                </div>

                {/* Timeline Events */}
                <div className="space-y-4 lg:space-y-0">
                    {events.map((event, index) => (
                        <TimelineItem
                            key={event.year}
                            event={event}
                            index={index}
                            isLast={index === events.length - 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}