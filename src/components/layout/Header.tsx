'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Phone, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/ui/ThemeProvider';
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
    const { theme } = useTheme();
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
            // Speichere aktuelle Scroll-Position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.classList.add('mobile-menu-open');
        } else {
            // Stelle Scroll-Position wieder her
            const scrollY = document.body.style.top;
            document.body.classList.remove('mobile-menu-open');
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
        
        return () => {
            document.body.classList.remove('mobile-menu-open');
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isMobileMenuOpen]);

    const pathname = usePathname();

    // Handler für Mobile Menu Links
    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
        setActiveSubmenu(null);
        // Scroll to top wird vom globalen ScrollToTop Handler übernommen
    };

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setActiveSubmenu(null);
    }, [pathname]);

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

            {/* Main Header - Fixed positioning for reliable sticky behavior */}
            <header
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
                    isScrolled
                        ? 'bg-background/95 backdrop-blur-lg shadow-lg border-b border-border'
                        : 'bg-background'
                )}
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo - Show dark logo in light mode, light logo in dark mode */}
                        <Link href="/" className="relative z-[110] flex-shrink-0">
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
                        <div className="flex lg:hidden items-center gap-2 relative z-[110]">
                            <ThemeToggle darkOverlay={isMobileMenuOpen && theme === 'dark'} />
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(!isMobileMenuOpen);
                                }}
                                className="p-3 rounded-lg hover:bg-surface transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                aria-label="Menü öffnen"
                            >
                                {isMobileMenuOpen ? (
                                    <X className={cn(
                                        "w-6 h-6",
                                        theme === 'dark' ? "text-white" : "text-slate-900"
                                    )} />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu - Fullscreen Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-background z-[100] lg:hidden flex flex-col overflow-hidden touch-manipulation"
                        >
                            <div className="container mx-auto px-6 pt-20 pb-6 flex flex-col gap-6 min-h-screen overflow-y-auto">
                                {/* Navigation Links */}
                                <nav className="flex flex-col gap-3">
                                    {navigation.map((item) => (
                                        <div key={item.label}>
                                            {item.submenu ? (
                                                <div className={cn(
                                                    "border-b pb-3",
                                                    theme === 'dark' ? "border-white/10" : "border-slate-900/10"
                                                )}>
                                                    {/* Dienstleistungen Accordion Button */}
                                                    <button
                                                        onClick={() =>
                                                            setActiveSubmenu(activeSubmenu === item.label ? null : item.label)
                                                        }
                                                        className={cn(
                                                            "flex items-center justify-between w-full px-4 py-4 rounded-lg transition-colors text-xl font-bold uppercase tracking-wide min-h-[56px]",
                                                            theme === 'dark'
                                                                ? "text-white hover:bg-white/10"
                                                                : "text-slate-900 hover:bg-slate-900/10"
                                                        )}
                                                    >
                                                        <span>{item.label}</span>
                                                        <ChevronDown
                                                            className={cn(
                                                                'w-6 h-6 transition-transform duration-300',
                                                                activeSubmenu === item.label && 'rotate-180'
                                                            )}
                                                        />
                                                    </button>
                                                    
                                                    {/* Dienstleistungen Submenu */}
                                                    <AnimatePresence>
                                                        {activeSubmenu === item.label && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="mt-2 pl-4 space-y-2 overflow-hidden"
                                                            >
                                                                {item.submenu.map((subItem) => (
                                                                    <Link
                                                                        key={subItem.label}
                                                                        href={subItem.href}
                                                                        className={cn(
                                                                            "block px-4 py-3 rounded-lg transition-colors text-base min-h-[48px] flex items-center",
                                                                            theme === 'dark'
                                                                                ? "text-white/80 hover:text-white hover:bg-white/10"
                                                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/10"
                                                                        )}
                                                                        onClick={handleLinkClick}
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
                                                    className={cn(
                                                        "block px-4 py-4 rounded-lg transition-colors text-xl font-bold uppercase tracking-wide min-h-[56px] flex items-center",
                                                        theme === 'dark'
                                                            ? "text-white hover:bg-white/10"
                                                            : "text-slate-900 hover:bg-slate-900/10"
                                                    )}
                                                    onClick={handleLinkClick}
                                                >
                                                    {item.label}
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </nav>

                                {/* CTA Button - Prominent platziert */}
                                <div className={cn(
                                    "mt-4 pt-4 border-t",
                                    theme === 'dark' ? "border-white/10" : "border-slate-900/10"
                                )}>
                                    <Button 
                                        variant="primary" 
                                        size="lg" 
                                        className="w-full text-lg font-bold uppercase min-h-[56px]" 
                                        asChild
                                    >
                                        <Link href="/kontakt" onClick={handleLinkClick}>
                                            Kostenloses Erstgespräch
                                        </Link>
                                    </Button>
                                </div>

                                {/* Contact Info - Unten */}
                                <div className={cn(
                                    "mt-auto pt-6 border-t",
                                    theme === 'dark' ? "border-white/10" : "border-slate-900/10"
                                )}>
                                    <div className={cn(
                                        "flex flex-col gap-3 text-base",
                                        theme === 'dark' ? "text-white/70" : "text-slate-600"
                                    )}>
                                        <a 
                                            href="tel:+41522221818" 
                                            className="flex items-center gap-3 hover:text-primary transition-colors min-h-[44px]"
                                        >
                                            <Phone className="w-5 h-5 flex-shrink-0" />
                                            <span>052 222 18 18</span>
                                        </a>
                                        <a 
                                            href="mailto:info@infraone.ch" 
                                            className="flex items-center gap-3 hover:text-primary transition-colors min-h-[44px]"
                                        >
                                            <Mail className="w-5 h-5 flex-shrink-0" />
                                            <span>info@infraone.ch</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
}
