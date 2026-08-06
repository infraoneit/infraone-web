'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    berechneRemoteSpanne,
    berechneVorOrtSpanne,
    formatCHF,
    type Zeitfenster,
    type Region,
} from '@/lib/support-kosten';

type Modus = 'einsatz' | 'betreuung';
type Ort = 'vorort' | 'remote';

const ZEIT_LABEL: Record<Zeitfenster, string> = {
    buerozeiten: 'Bürozeiten',
    abend: 'Abend (17–23 Uhr)',
    wochenende: 'Wochenende / Feiertag',
};

const REGION_LABEL: Record<Region, string> = {
    'winterthur-andelfingen': 'Winterthur / Andelfingen',
    'uebrige-deutschschweiz': 'Übrige Deutschschweiz',
};

function OptionButton({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={`w-full p-4 rounded-xl border text-left transition-colors flex items-center gap-3 ${
                selected
                    ? 'border-primary bg-primary/10 text-text-primary font-medium'
                    : 'border-border bg-card text-text-secondary hover:border-primary/50'
            }`}
        >
            <span
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selected ? 'border-primary' : 'border-border'
                }`}
            >
                {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </span>
            {children}
        </button>
    );
}

export function SupportKostenRechner() {
    const [modus, setModus] = useState<Modus | null>(null);
    const [ort, setOrt] = useState<Ort | null>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [zeit, setZeit] = useState<Zeitfenster | null>(null);
    const [arbeitsplaetze, setArbeitsplaetze] = useState<number>(5);
    const [server, setServer] = useState<'ja' | 'nein' | null>(null);

    const einsatzKomplett = modus === 'einsatz' && ort !== null && region !== null && zeit !== null;
    const betreuungKomplett = modus === 'betreuung' && server !== null;

    const remoteSpanne = einsatzKomplett && ort === 'remote' ? berechneRemoteSpanne(zeit) : null;
    const vorOrtSpanne = einsatzKomplett && ort === 'vorort' ? berechneVorOrtSpanne(zeit, region) : null;

    function buildKontaktHref(): string | null {
        const params = new URLSearchParams();
        params.set('subject', 'IT-Support und Netzwerke');

        let message: string | null = null;
        if (remoteSpanne && region && zeit) {
            message = [
                'Anfrage über den Kostenrechner:',
                '',
                'Anliegen: Ein akutes Problem',
                'Ort: Fernzugriff reicht vermutlich',
                `Region: ${REGION_LABEL[region]}`,
                `Zeitpunkt: ${ZEIT_LABEL[zeit]}`,
                `Geschätzte Spanne (Remote-Einsatz, 15–60 Minuten): ${formatCHF(remoteSpanne.von)}–${formatCHF(remoteSpanne.bis)}`,
                '',
                'Bitte um Kontaktaufnahme.',
            ].join('\n');
        } else if (vorOrtSpanne && region && zeit) {
            message = [
                'Anfrage über den Kostenrechner:',
                '',
                'Anliegen: Ein akutes Problem',
                'Ort: Bei uns vor Ort',
                `Region: ${REGION_LABEL[region]}`,
                `Zeitpunkt: ${ZEIT_LABEL[zeit]}`,
                `Geschätzte Spanne (Vor-Ort-Einsatz, 1–2 Stunden): ${formatCHF(vorOrtSpanne.von)}–${formatCHF(vorOrtSpanne.bis)}${vorOrtSpanne.anfahrt > 0 ? ' zzgl. Anfahrtspauschale CHF 50' : ''}`,
                '',
                'Bitte um Kontaktaufnahme.',
            ].join('\n');
        } else if (betreuungKomplett) {
            message = [
                'Anfrage über den Kostenrechner:',
                '',
                'Anliegen: Regelmässige Betreuung (IT-Dienstleistungsvertrag)',
                `Anzahl Arbeitsplätze: ${arbeitsplaetze}`,
                `Server vorhanden: ${server === 'ja' ? 'Ja' : 'Nein'}`,
                '',
                'Preis-Hinweis: ab CHF 200 pro Monat, monatlich kündbar – bitte um verbindliche Offerte.',
            ].join('\n');
        }
        if (!message) return null;
        params.set('message', message);
        return `/kontakt?${params.toString()}`;
    }

    const kontaktHref = buildKontaktHref();

    return (
        <section className="py-16 lg:py-24 bg-background border-t border-border">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                        Was kostet Ihr Fall? Rechnen Sie es aus.
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        Drei Angaben genügen. Keine E-Mail-Adresse nötig, keine Rückruf-Falle –
                        einfach die Zahl, mit der Sie planen können.
                    </p>
                </div>

                <noscript>
                    <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-card border border-border text-center">
                        <p className="text-text-secondary">
                            Der Kostenrechner benötigt JavaScript. Alle Preise finden Sie in der{' '}
                            <a href="#preise" className="text-primary font-medium hover:underline">
                                Preisliste
                            </a>
                            .
                        </p>
                    </div>
                </noscript>

                {/* min-h verhindert Layout-Verschiebungen beim Umschalten der Modi (CLS 0) */}
                <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-2xl bg-card border border-border min-h-[560px] flex flex-col">
                    {/* Schritt 1: Was liegt an? */}
                    <fieldset>
                        <legend className="text-lg font-bold text-text-primary mb-4">Was liegt an?</legend>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <OptionButton
                                selected={modus === 'einsatz'}
                                onClick={() => setModus('einsatz')}
                            >
                                Ein akutes Problem
                            </OptionButton>
                            <OptionButton
                                selected={modus === 'betreuung'}
                                onClick={() => setModus('betreuung')}
                            >
                                Regelmässige Betreuung
                            </OptionButton>
                        </div>
                    </fieldset>

                    {modus === 'einsatz' && (
                        <>
                            <fieldset className="mt-8">
                                <legend className="text-lg font-bold text-text-primary mb-4">Wo?</legend>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <OptionButton selected={ort === 'vorort'} onClick={() => setOrt('vorort')}>
                                        Bei uns vor Ort
                                    </OptionButton>
                                    <OptionButton selected={ort === 'remote'} onClick={() => setOrt('remote')}>
                                        Fernzugriff reicht vermutlich
                                    </OptionButton>
                                </div>
                            </fieldset>

                            <fieldset className="mt-8">
                                <legend className="text-lg font-bold text-text-primary mb-4">Region</legend>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <OptionButton
                                        selected={region === 'winterthur-andelfingen'}
                                        onClick={() => setRegion('winterthur-andelfingen')}
                                    >
                                        Winterthur / Andelfingen
                                    </OptionButton>
                                    <OptionButton
                                        selected={region === 'uebrige-deutschschweiz'}
                                        onClick={() => setRegion('uebrige-deutschschweiz')}
                                    >
                                        Übrige Deutschschweiz
                                    </OptionButton>
                                </div>
                            </fieldset>

                            <fieldset className="mt-8">
                                <legend className="text-lg font-bold text-text-primary mb-4">Wann?</legend>
                                <div className="grid sm:grid-cols-3 gap-3">
                                    <OptionButton selected={zeit === 'buerozeiten'} onClick={() => setZeit('buerozeiten')}>
                                        Bürozeiten
                                    </OptionButton>
                                    <OptionButton selected={zeit === 'abend'} onClick={() => setZeit('abend')}>
                                        Abend 17–23 Uhr
                                    </OptionButton>
                                    <OptionButton selected={zeit === 'wochenende'} onClick={() => setZeit('wochenende')}>
                                        Wochenende
                                    </OptionButton>
                                </div>
                            </fieldset>
                        </>
                    )}

                    {modus === 'betreuung' && (
                        <div className="mt-8 space-y-8">
                            <div>
                                <label htmlFor="arbeitsplaetze" className="block text-lg font-bold text-text-primary mb-4">
                                    Anzahl Arbeitsplätze
                                </label>
                                <input
                                    id="arbeitsplaetze"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={arbeitsplaetze}
                                    onChange={(e) => {
                                        const wert = parseInt(e.target.value, 10);
                                        if (Number.isNaN(wert)) return;
                                        setArbeitsplaetze(Math.min(100, Math.max(1, wert)));
                                    }}
                                    className="w-full sm:w-48 p-3 rounded-xl border border-border bg-background text-text-primary focus:border-primary focus:outline-none transition-colors"
                                />
                            </div>
                            <fieldset>
                                <legend className="text-lg font-bold text-text-primary mb-4">Server vorhanden?</legend>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <OptionButton selected={server === 'ja'} onClick={() => setServer('ja')}>
                                        Ja
                                    </OptionButton>
                                    <OptionButton selected={server === 'nein'} onClick={() => setServer('nein')}>
                                        Nein
                                    </OptionButton>
                                </div>
                            </fieldset>
                        </div>
                    )}

                    {/* Ergebnis-Bereich: feste Mindesthöhe, damit nichts springt */}
                    <div className="mt-8 p-6 rounded-2xl bg-surface border border-border min-h-[190px] flex flex-col justify-center flex-grow">
                        {remoteSpanne && (
                            <div className="text-center">
                                <p className="text-sm text-text-secondary mb-2">Typischer Remote-Einsatz: 15–60 Minuten</p>
                                <p className="text-3xl md:text-4xl font-bold text-primary mb-3">
                                    {formatCHF(remoteSpanne.von)}–{formatCHF(remoteSpanne.bis)}
                                </p>
                                <p className="text-xs text-text-secondary">
                                    Abgerechnet wird die effektive Zeit im 15-Minuten-Takt.
                                </p>
                            </div>
                        )}

                        {vorOrtSpanne && (
                            <div className="text-center">
                                <p className="text-sm text-text-secondary mb-2">Typischer Vor-Ort-Einsatz: 1–2 Stunden</p>
                                <p className="text-3xl md:text-4xl font-bold text-primary mb-3">
                                    {formatCHF(vorOrtSpanne.von)}–{formatCHF(vorOrtSpanne.bis)}
                                </p>
                                <p className="text-xs text-text-secondary">
                                    Mindestverrechnung 30 Minuten.
                                    {vorOrtSpanne.anfahrt > 0 && ' Zzgl. Anfahrtspauschale CHF 50.'}
                                </p>
                            </div>
                        )}

                        {betreuungKomplett && (
                            <div className="text-center">
                                <p className="text-3xl md:text-4xl font-bold text-primary mb-3">
                                    ab CHF 200 pro Monat
                                </p>
                                <p className="text-sm font-medium text-text-primary mb-3">monatlich kündbar</p>
                                <p className="text-xs text-text-secondary max-w-xl mx-auto">
                                    Der genaue Preis hängt von Geräten, Servern und gewünschter Reaktionszeit ab –
                                    mit Ihren Angaben erstellen wir eine verbindliche Offerte, meist innert zwei Arbeitstagen.
                                </p>
                            </div>
                        )}

                        {!kontaktHref && (
                            <p className="text-center text-text-secondary">
                                {modus === null
                                    ? 'Wählen Sie oben aus, was anliegt – der Rest erklärt sich von selbst.'
                                    : 'Fast geschafft – bitte noch die restlichen Angaben auswählen.'}
                            </p>
                        )}
                    </div>

                    {kontaktHref && (
                        <div className="mt-6 text-center">
                            <Button size="lg" asChild>
                                <Link href={kontaktHref}>
                                    <CheckCircle className="w-5 h-5" />
                                    Angaben ins Kontaktformular übernehmen
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
