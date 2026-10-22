'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Download, Laptop, Monitor, Phone, X } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { BASE_URL } from '@/lib/constants';

interface DownloadOption {
    id: string;
    icon: typeof Monitor;
    title: string;
    subtitle: string;
    href: string;
    fileName: string;
    steps: string[];
}

const DOWNLOAD_OPTIONS: DownloadOption[] = [
    {
        id: 'windows',
        icon: Monitor,
        title: 'Windows',
        subtitle: 'Windows 10 und 11',
        href: '/downloads/Fernwartung-Infraone.zip',
        fileName: 'Fernwartung-Infraone.zip',
        steps: [
            'ZIP-Datei entpacken',
            'Programm doppelklicken und installieren – die Installation ist nötig, damit sich der Client mit unserem Server verbindet',
            'ID und Kennwort durchgeben',
        ],
    },
    {
        id: 'mac',
        icon: Laptop,
        title: 'macOS',
        subtitle: 'Intel und Apple Silicon (M1 bis M4)',
        href: '/downloads/Fernwartung-Infraone-Mac.zip',
        fileName: 'Fernwartung-Infraone-Mac.zip',
        steps: [
            'ZIP-Datei entpacken',
            'Datei mit der rechten Maustaste anklicken und «Öffnen» wählen',
            'ID und Kennwort durchgeben',
        ],
    },
];

const MAC_TERMINAL_COMMAND = `curl -fsSL ${BASE_URL}/downloads/fernwartung-mac.sh | bash`;

interface FernwartungDialogProps {
    /** Text auf der auslösenden Schaltfläche. */
    label?: string;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    className?: string;
}

export function FernwartungDialog({
    label = 'Fernwartung starten',
    variant = 'outline',
    size = 'lg',
    className,
}: FernwartungDialogProps) {
    const [open, setOpen] = useState(false);
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const close = useCallback(() => setOpen(false), []);

    // Esc schliesst, Tab bleibt im Dialog, Hintergrund-Scroll gesperrt
    useEffect(() => {
        if (!open) return;

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
                return;
            }
            if (event.key !== 'Tab') return;

            const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable || focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, close]);

    // Fokus in den Dialog holen und beim Schliessen zurückgeben
    useEffect(() => {
        if (open) {
            dialogRef.current?.focus();
        } else {
            triggerRef.current?.focus({ preventScroll: true });
        }
    }, [open]);

    return (
        <>
            <Button
                ref={triggerRef}
                type="button"
                variant={variant}
                size={size}
                className={className}
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <Download className="w-5 h-5" />
                {label}
            </Button>

            {/* open ist beim Server-Rendern immer false – createPortal laeuft also nur im Browser */}
            {open
                ? createPortal(
                    <div
                        className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto"
                        onClick={close}
                    >
                        <div
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={titleId}
                            tabIndex={-1}
                            onClick={(event) => event.stopPropagation()}
                            className="relative w-full max-w-3xl my-auto bg-background border border-border rounded-2xl shadow-2xl outline-none"
                        >
                            <button
                                type="button"
                                onClick={close}
                                aria-label="Auswahl schliessen"
                                className="absolute right-4 top-4 w-10 h-10 rounded-full bg-surface border border-border text-text-primary flex items-center justify-center hover:bg-border transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-6 md:p-8">
                                <h2
                                    id={titleId}
                                    className="text-2xl font-bold text-text-primary pr-12 mb-2"
                                >
                                    Fernwartung starten
                                </h2>
                                <p className="text-text-secondary mb-6 max-w-xl">
                                    Wählen Sie Ihr Betriebssystem. Wir sehen Ihren Bildschirm erst,
                                    wenn Sie uns ID und Kennwort durchgeben – und Sie schauen die
                                    ganze Zeit mit.
                                </p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {DOWNLOAD_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <div
                                                key={option.id}
                                                className="flex flex-col bg-card border border-border rounded-xl p-5"
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-6 h-6" />
                                                    </span>
                                                    <span>
                                                        <span className="block font-bold text-text-primary">
                                                            {option.title}
                                                        </span>
                                                        <span className="block text-xs text-text-secondary">
                                                            {option.subtitle}
                                                        </span>
                                                    </span>
                                                </div>

                                                <a
                                                    href={option.href}
                                                    download={option.fileName}
                                                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Herunterladen
                                                </a>

                                                <ol className="mt-4 space-y-2">
                                                    {option.steps.map((step) => (
                                                        <li
                                                            key={step}
                                                            className="flex gap-2 text-xs text-text-secondary leading-relaxed"
                                                        >
                                                            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                                            <span>{step}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        );
                                    })}
                                </div>

                                <details className="mt-5 bg-surface border border-border rounded-xl px-4 py-3">
                                    <summary className="text-sm font-medium text-text-primary cursor-pointer">
                                        Mac: Download wird von macOS blockiert?
                                    </summary>
                                    <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                                        Öffnen Sie «Terminal» (Launchpad → nach «Terminal» suchen),
                                        fügen Sie diese Zeile ein und drücken Sie die Eingabetaste:
                                    </p>
                                    <pre className="mt-2 overflow-x-auto bg-background border border-border rounded-lg p-3">
                                        <code className="text-xs text-text-primary">
                                            {MAC_TERMINAL_COMMAND}
                                        </code>
                                    </pre>
                                </details>

                                <p className="flex items-center gap-2 text-sm text-text-secondary mt-5">
                                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                                    Klappt etwas nicht? Rufen Sie uns an:{' '}
                                    <a
                                        href="tel:+41522221818"
                                        className="text-primary font-medium hover:underline"
                                    >
                                        052 222 18 18
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </>
    );
}
