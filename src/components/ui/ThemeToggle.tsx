'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    className?: string;
    darkOverlay?: boolean; // When true, always use dark-friendly styling
}

export function ThemeToggle({ className, darkOverlay = false }: ThemeToggleProps) {
    const { theme, setTheme, mounted } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const baseClasses = cn(
        "relative p-2 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[44px] min-h-[44px]",
        darkOverlay
            ? "bg-white/10 hover:bg-white/20 text-white"
            : "bg-surface hover:bg-border",
        className
    );

    const iconClasses = darkOverlay ? "w-5 h-5 text-white" : "w-5 h-5 text-primary";

    // Show a placeholder during SSR/hydration
    if (!mounted) {
        return (
            <button
                className={baseClasses}
                aria-label="Theme umschalten"
            >
                <Moon className={cn(iconClasses, "opacity-50")} />
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={cn(baseClasses, "group")}
            aria-label="Theme umschalten"
        >
            {theme === 'light' ? (
                <Sun className={iconClasses} />
            ) : (
                <Moon className={iconClasses} />
            )}
            <span className="sr-only">
                {theme === 'light' ? 'Hell' : 'Dunkel'}
            </span>
        </button>
    );
}
