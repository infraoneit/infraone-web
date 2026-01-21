'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Phone, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    submenu?: NavItem[];
}

const navigation: NavItem[] = [
    { label: 'Home', href: '/' },
    {
        label: 'Leistungen',
        href: '/leistungen',
        submenu: [
            { label: 'IT-Systeme & Netzwerke', href: '/it-netzwerke' },
            { label: 'Telefonie & Kommunikation', href: '/telefonie' },
            { label: 'Videoüberwachung', href: '/videoueberwachung' },
            { label: 'Software-Entwicklung', href: '/software-entwicklung' },
            { label: 'Webdesign', href: '/webdesign' },
            { label: 'Kontrollraum-Lösungen', href: '/kontrollraum' },
            { label: 'Digital Signage', href: '/digital-signage' },
            { label: 'Gebäudeautomation & IoT', href: '/gebaeudeautomation' },
        ],
    },
    { label: 'IT-Support', href: '/it-support' },
    { label: 'Cloud-Telefonie', href: '/cloud-telefonie' },
    { label: 'Unternehmen', href: '/unternehmen' },
    { label: 'Blog', href: '/blog' },
    { label: 'Kontakt', href: '/kontakt' },
];

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    return (
        <>
            {/* Top Bar */}
            <div className="hidden lg:block bg-primary text-white py-2">
                <div className="container mx-auto px-4 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-6">
                        <a href="tel:+41522221818" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Phone className="w-4 h-4" />
                            <span>052 222 18 18</span>
                        </a>
                        <a href="mailto:info@infraone.ch" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Mail className="w-4 h-4" />
                            <span>info@infraone.ch</span>
                        </a>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Mo-Fr 8:00-17:00</span>
                        <span className="text-primary-light">|</span>
                        <span className="font-semibold">20% Neukunden-Rabatt</span>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <header
                className={cn(
                    'sticky top-0 z-50 transition-all duration-300',
                    isScrolled
                        ? 'bg-background/95 backdrop-blur-lg shadow-lg border-b border-border'
                        : 'bg-background'
                )}
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo - Show dark logo in light mode, light logo in dark mode */}
                        <Link href="/" className="relative z-10 flex-shrink-0">
                            {/* Light mode logo (black) - visible when NOT dark mode */}
                            <Image
                                src="/infraone-logo-schwarz.svg"
                                alt="InfraOne IT Solutions"
                                width={180}
                                height={45}
                                className="h-10 lg:h-12 w-auto dark:hidden"
                                priority
                            />
                            {/* Dark mode logo (white) - visible ONLY in dark mode */}
                            <Image
                                src="/infraone-logo-weiss.svg"
                                alt="InfraOne IT Solutions"
                                width={180}
                                height={45}
                                className="h-10 lg:h-12 w-auto hidden dark:block"
                                priority
                            />
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navigation.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative"
                                    onMouseEnter={() => item.submenu && setActiveSubmenu(item.label)}
                                    onMouseLeave={() => setActiveSubmenu(null)}
                                >
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-1 px-4 py-2 rounded-lg text-text-primary hover:text-primary hover:bg-surface transition-colors',
                                            activeSubmenu === item.label && 'text-primary bg-surface'
                                        )}
                                    >
                                        {item.label}
                                        {item.submenu && <ChevronDown className="w-4 h-4" />}
                                    </Link>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {item.submenu && activeSubmenu === item.label && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute top-full left-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-border overflow-hidden"
                                            >
                                                {item.submenu.map((subItem) => (
                                                    <Link
                                                        key={subItem.label}
                                                        href={subItem.href}
                                                        className="block px-4 py-3 text-sm text-text-primary hover:bg-surface hover:text-primary transition-colors border-b border-border last:border-b-0"
                                                    >
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </nav>

                        {/* Desktop Actions */}
                        <div className="hidden lg:flex items-center gap-3">
                            <ThemeToggle />
                            <Button variant="primary" size="sm" asChild>
                                <Link href="/kontakt">Kostenloses Erstgespräch</Link>
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex lg:hidden items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg hover:bg-surface transition-colors"
                                aria-label="Menü öffnen"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="lg:hidden bg-background border-t border-border overflow-hidden"
                        >
                            <div className="container mx-auto px-4 py-4">
                                <nav className="flex flex-col gap-2">
                                    {navigation.map((item) => (
                                        <div key={item.label}>
                                            {item.submenu ? (
                                                <div>
                                                    <button
                                                        onClick={() =>
                                                            setActiveSubmenu(activeSubmenu === item.label ? null : item.label)
                                                        }
                                                        className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-text-primary hover:bg-surface transition-colors"
                                                    >
                                                        {item.label}
                                                        <ChevronDown
                                                            className={cn(
                                                                'w-5 h-5 transition-transform',
                                                                activeSubmenu === item.label && 'rotate-180'
                                                            )}
                                                        />
                                                    </button>
                                                    <AnimatePresence>
                                                        {activeSubmenu === item.label && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="pl-4 mt-1 space-y-1"
                                                            >
                                                                {item.submenu.map((subItem) => (
                                                                    <Link
                                                                        key={subItem.label}
                                                                        href={subItem.href}
                                                                        className="block px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-primary hover:bg-surface transition-colors"
                                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                                    >
                                                                        {subItem.label}
                                                                    </Link>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    className="block px-4 py-3 rounded-lg text-text-primary hover:bg-surface transition-colors"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    {item.label}
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </nav>

                                <div className="mt-4 pt-4 border-t border-border">
                                    <Button variant="primary" size="lg" className="w-full" asChild>
                                        <Link href="/kontakt" onClick={() => setIsMobileMenuOpen(false)}>
                                            Kostenloses Erstgespräch
                                        </Link>
                                    </Button>
                                </div>

                                <div className="mt-4 flex flex-col gap-2 text-sm text-text-secondary">
                                    <a href="tel:+41522221818" className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        052 222 18 18
                                    </a>
                                    <a href="mailto:info@infraone.ch" className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        info@infraone.ch
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
}
