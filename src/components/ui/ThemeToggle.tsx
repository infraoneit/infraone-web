'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
    const { theme, setTheme, mounted } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    // Show a placeholder during SSR/hydration
    if (!mounted) {
        return (
            <button
                className="relative p-2 rounded-lg bg-surface hover:bg-border transition-colors duration-200"
                aria-label="Theme umschalten"
            >
                <Moon className="w-5 h-5 text-primary opacity-50" />
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-lg bg-surface hover:bg-border transition-colors duration-200 group"
            aria-label="Theme umschalten"
        >
            {theme === 'light' ? (
                <Sun className="w-5 h-5 text-primary" />
            ) : (
                <Moon className="w-5 h-5 text-primary" />
            )}
            <span className="sr-only">
                {theme === 'light' ? 'Hell' : 'Dunkel'}
            </span>
        </button>
    );
}
