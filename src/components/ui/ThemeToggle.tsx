'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
    const { theme, setTheme, mounted } = useTheme();

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    // Show a placeholder during SSR/hydration
    if (!mounted) {
        return (
            <button
                className="relative p-2 rounded-lg bg-surface hover:bg-border transition-colors duration-200"
                aria-label="Theme umschalten"
            >
                <Sun className="w-5 h-5 text-primary opacity-50" />
            </button>
        );
    }

    return (
        <button
            onClick={cycleTheme}
            className="relative p-2 rounded-lg bg-surface hover:bg-border transition-colors duration-200 group"
            aria-label="Theme umschalten"
        >
            {theme === 'light' && (
                <Sun className="w-5 h-5 text-primary" />
            )}
            {theme === 'dark' && (
                <Moon className="w-5 h-5 text-primary" />
            )}
            {theme === 'system' && (
                <Monitor className="w-5 h-5 text-primary" />
            )}
            <span className="sr-only">
                {theme === 'light' ? 'Hell' : theme === 'dark' ? 'Dunkel' : 'System'}
            </span>
        </button>
    );
}
