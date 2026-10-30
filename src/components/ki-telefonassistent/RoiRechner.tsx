'use client';

/**
 * Rechner «Was kostet ein verpasster Anruf?» (AUFTRAG-110).
 *
 * Rechnet nur, was der Nutzer selbst eingibt:
 *   verpasste Anrufe/Monat = Anrufe pro Tag × Arbeitstage × verpasst %
 *   mögliche Aufträge      = verpasste Anrufe × Trefferquote %
 *   verpasster Umsatz      = mögliche Aufträge × Wert eines Auftrags
 * Kein Ergebnis, solange ein Feld leer oder ungültig ist. Keine Ersparnis-
 * Behauptung: Das Ergebnis ist der Umsatz, der nach den eigenen Angaben
 * heute verloren geht — nicht, was der Assistent zurückholt.
 */
import { useId, useState } from 'react';
import { Calculator } from 'lucide-react';

type Feld = 'anrufe' | 'verpasst' | 'wert' | 'treffer' | 'tage';

interface FeldDef {
    id: Feld;
    label: string;
    hilfe: string;
    einheit: string;
    platzhalter: string;
    min: number;
    max: number;
}

const FELDER: FeldDef[] = [
    { id: 'anrufe', label: 'Anrufe pro Tag', hilfe: 'Alle eingehenden Anrufe, auch die verpassten.', einheit: 'Anrufe', platzhalter: 'z. B. 20', min: 0, max: 10000 },
    { id: 'verpasst', label: 'Davon verpasst', hilfe: 'Anteil, der heute niemanden erreicht oder aufgibt.', einheit: '%', platzhalter: 'z. B. 15', min: 0, max: 100 },
    { id: 'wert', label: 'Wert eines Auftrags', hilfe: 'Durchschnittlicher Umsatz pro Auftrag.', einheit: 'CHF', platzhalter: 'z. B. 800', min: 0, max: 10000000 },
    { id: 'treffer', label: 'Trefferquote', hilfe: 'Wie viele verpasste Anrufe zu einem Auftrag geführt hätten.', einheit: '%', platzhalter: 'z. B. 30', min: 0, max: 100 },
    { id: 'tage', label: 'Arbeitstage pro Monat', hilfe: 'Annahme, bei Bedarf anpassen.', einheit: 'Tage', platzhalter: 'z. B. 21', min: 1, max: 31 },
];

function zahl(text: string): number | null {
    const t = text.trim().replace(/['’\s]/g, '').replace(',', '.');
    if (t === '' || !/^\d+(\.\d+)?$/.test(t)) return null;
    return Number(t);
}

function format(n: number, stellen = 0): string {
    const [vor, nach] = n.toFixed(stellen).split('.');
    const mit = vor.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return nach && Number(nach) !== 0 ? `${mit}.${nach}` : mit;
}

export function RoiRechner() {
    const basis = useId();
    const [werte, setWerte] = useState<Record<Feld, string>>({ anrufe: '', verpasst: '', wert: '', treffer: '', tage: '21' });

    const zahlen = Object.fromEntries(FELDER.map((f) => [f.id, zahl(werte[f.id])])) as Record<Feld, number | null>;
    const fehler = Object.fromEntries(
        FELDER.map((f) => {
            const z = zahlen[f.id];
            const leer = werte[f.id].trim() === '';
            return [f.id, !leer && (z === null || z < f.min || z > f.max) ? `Bitte eine Zahl von ${format(f.min)} bis ${format(f.max)} eingeben.` : null];
        }),
    ) as Record<Feld, string | null>;
    const vollstaendig = FELDER.every((f) => zahlen[f.id] !== null && !fehler[f.id]);

    let ergebnis: { verpassteAnrufe: number; auftraege: number; umsatz: number } | null = null;
    if (vollstaendig) {
        const { anrufe, verpasst, wert, treffer, tage } = zahlen as Record<Feld, number>;
        const verpassteAnrufe = anrufe * tage * (verpasst / 100);
        const auftraege = verpassteAnrufe * (treffer / 100);
        ergebnis = { verpassteAnrufe, auftraege, umsatz: auftraege * wert };
    }

    return (
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 rounded-3xl border border-border bg-card p-6 md:p-8 lg:p-10" data-rechner="verpasste-anrufe">
            <form className="lg:col-span-7 grid sm:grid-cols-2 gap-x-6 gap-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Eingaben für den Rechner">
                {FELDER.map((f) => {
                    const id = `${basis}-${f.id}`;
                    return (
                        <div key={f.id} className={f.id === 'tage' ? 'sm:col-span-2 sm:max-w-[calc(50%-0.75rem)]' : undefined}>
                            <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
                                {f.label}
                            </label>
                            <div className="mt-2 flex items-stretch rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
                                <input
                                    id={id}
                                    name={f.id}
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder={f.platzhalter}
                                    value={werte[f.id]}
                                    onChange={(e) => setWerte((w) => ({ ...w, [f.id]: e.target.value }))}
                                    aria-describedby={`${id}-hilfe${fehler[f.id] ? ` ${id}-fehler` : ''}`}
                                    aria-invalid={!!fehler[f.id]}
                                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/70 outline-none"
                                />
                                <span className="flex items-center px-3 text-sm text-text-secondary border-l border-border">{f.einheit}</span>
                            </div>
                            <p id={`${id}-hilfe`} className="mt-1.5 text-xs text-text-secondary">
                                {f.hilfe}
                            </p>
                            {fehler[f.id] && (
                                <p id={`${id}-fehler`} className="mt-1 text-xs font-medium text-red-700 dark:text-red-300">
                                    {fehler[f.id]}
                                </p>
                            )}
                        </div>
                    );
                })}
            </form>

            <div className="lg:col-span-5 rounded-2xl bg-surface/70 border border-border p-6 flex flex-col" aria-live="polite" data-ergebnis={ergebnis ? 'ja' : 'nein'}>
                <p className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                    <Calculator className="w-4 h-4 text-primary" aria-hidden="true" />
                    Ergebnis nach Ihren Angaben
                </p>
                {ergebnis ? (
                    <>
                        <p className="mt-4 text-sm text-text-secondary">Verpasster Umsatz pro Monat</p>
                        <p className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary" data-wert="umsatz-monat">
                            CHF {format(ergebnis.umsatz)}
                        </p>
                        <dl className="mt-6 space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-text-secondary">Verpasste Anrufe pro Monat</dt>
                                <dd className="font-semibold text-text-primary" data-wert="anrufe-monat">{format(ergebnis.verpassteAnrufe, 1)}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-text-secondary">Davon mögliche Aufträge</dt>
                                <dd className="font-semibold text-text-primary" data-wert="auftraege-monat">{format(ergebnis.auftraege, 1)}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-text-secondary">Verpasster Umsatz pro Jahr</dt>
                                <dd className="font-semibold text-text-primary" data-wert="umsatz-jahr">CHF {format(ergebnis.umsatz * 12)}</dd>
                            </div>
                        </dl>
                        <p className="mt-6 text-xs text-text-secondary leading-relaxed">
                            Rechnung: Anrufe pro Tag × Arbeitstage × verpasst % × Trefferquote % × Wert eines Auftrags. Das ist der Umsatz, der Ihnen nach Ihren eigenen Angaben heute entgeht – keine Zusage, wie viel davon ein Assistent zurückholt.
                        </p>
                    </>
                ) : (
                    <p className="mt-4 text-text-secondary leading-relaxed">
                        Füllen Sie alle Felder aus. Erst dann zeigen wir ein Ergebnis – wir rechnen nur mit Ihren eigenen Zahlen.
                    </p>
                )}
            </div>
        </div>
    );
}
