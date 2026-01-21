'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQListProps {
    items: FAQItem[];
    className?: string;
}

export function FAQList({ items, className = '' }: FAQListProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className={`space-y-4 ${className}`}>
            {items.map((item, index) => (
                <div key={index} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/50 transition-colors"
                    >
                        <span className="font-medium text-text-primary pr-4">{item.question}</span>
                        <ChevronDown
                            className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''
                                }`}
                        />
                    </button>
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="px-4 pb-4 pt-0">
                            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
                                {item.answer}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
