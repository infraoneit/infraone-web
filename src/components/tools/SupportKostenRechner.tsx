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
import {
    berechneInfraOnePaket,
    formatCHFGanz,
    MAX_BENUTZER,
    type FlatrateOption,
} from '@/lib/telefonie-paket';

type Modus = 'fixkosten' | 'einsatz' | 'betreuung';
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

const FLATRATE_LABEL: Record<FlatrateOption, string> = {
    keine: 'Keine',
    ch: 'CH (1000 Min Festnetz / 200 Min Mobil)',
    cheu: 'CH & EU (1000 Min Festnetz / 300 Min Mobil)',
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
    // Standard-Modus: «Fixkosten senken» (Türöffner, AUFTRAG-009)
    const [modus, setModus] = useState<Modus | null>('fixkosten');
    const [ort, setOrt] = useState<Ort | null>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [zeit, setZeit] = useState<Zeitfenster | null>(null);
    const [arbeitsplaetze, setArbeitsplaetze] = useState<number>(5);
    const [server, setServer] = useState<'ja' | 'nein' | null>(null);

    // Eingaben Modus «Fixkosten senken»
    const [benutzer, setBenutzer] = useState<number>(5);
    const [heuteTelefonie, setHeuteTelefonie] = useState<string>('');
    const [heuteInternet, setHeuteInternet] = useState<string>('');
    const [flatrate, setFlatrate] = useState<FlatrateOption>('ch');
    const [internetDazu, setInternetDazu] = useState<boolean>(true);

    const fixkostenPaket = berechneInfraOnePaket(benutzer, flatrate, internetDazu);
    const heuteTelefonieBetrag = parseFloat(heuteTelefonie) || 0;
    const heuteInternetBetrag = parseFloat(heuteInternet) || 0;
    const heuteGesamt = heuteTelefonieBetrag + heuteInternetBetrag;
    // Ersparnis nur behaupten, wenn sie positiv ist – nie verstecken oder schönen.
    const ersparnis =
        fixkostenPaket !== null && heuteGesamt > 0 ? heuteGesamt - fixkostenPaket.summe : null;

    const einsatzKomplett = modus === 'einsatz' && ort !== null && region !== null && zeit !== null;
    const betreuungKomplett = modus === 'betreuung' && server !== null;

    const remoteSpanne = einsatzKomplett && ort === 'remote' ? berechneRemoteSpanne(zeit) : null;
    const vorOrtSpanne = einsatzKomplett && ort === 'vorort' ? berechneVorOrtSpanne(zeit, region) : null;

    function buildKontaktHref(): string | null {
        const params = new URLSearchParams();

        let message: string | null = null;
        if (modus === 'fixkosten') {
            params.set('subject', 'Telefonie und Kommunikation');
            const zeilen = [
                'Anfrage über den Kostenrechner:',
                '',
                'Anliegen: Fixkosten senken (Telefonie & Internet)',
                `Anzahl Telefon-Benutzer: ${benutzer}`,
                `Heutige Telefoniekosten: ${heuteTelefonieBetrag > 0 ? `${formatCHFGanz(heuteTelefonieBetrag)} pro Monat` : 'nicht angegeben'}`,
                `Heutige Internetkosten: ${heuteInternetBetrag > 0 ? `${formatCHFGanz(heuteInternetBetrag)} pro Monat` : 'nicht angegeben'}`,
                `Flatrate: ${FLATRATE_LABEL[flatrate]}`,
                `Glasfaser-Internet 1 Gbit/s mit fester IP: ${internetDazu ? 'Ja' : 'Nein'}`,
            ];
            if (fixkostenPaket) {
                zeilen.push(
                    `InfraOne-Paket: ${formatCHFGanz(fixkostenPaket.summe)} pro Monat (bei 24 Monaten Laufzeit, zzgl. einmaliger Einrichtung/Portierung)`
                );
                if (ersparnis !== null && ersparnis > 0) {
                    zeilen.push(
                        `Voraussichtliche Ersparnis: ${formatCHFGanz(ersparnis)} pro Monat (${formatCHFGanz(ersparnis * 12)} pro Jahr)`
                    );
                } else {
                    zeilen.push('Ersparnis: auf den ersten Blick nicht erkennbar – bitte gemeinsam nachrechnen.');
                }
            } else {
                zeilen.push('Über 30 Benutzer: bitte individuelle Offerte erstellen.');
            }
            zeilen.push('', 'Bitte um Kontaktaufnahme.');
            message = zeilen.join('\n');
        } else if (remoteSpanne && region && zeit) {
            params.set('subject', 'IT-Support und Netzwerke');
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
            params.set('subject', 'IT-Support und Netzwerke');
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
            params.set('subject', 'IT-Support und Netzwerke');
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
                        <div className="grid sm:grid-cols-3 gap-3">
                            <OptionButton
                                selected={modus === 'fixkosten'}
                                onClick={() => setModus('fixkosten')}
                            >
                                Fixkosten senken
                            </OptionButton>
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

                    {modus === 'fixkosten' && (
                        <div className="mt-8 space-y-8">
                            <p className="text-text-secondary">
                                Was zahlen Sie heute für Telefon und Internet? Tragen Sie es ein –
                                wir zeigen Ihnen sofort, was dasselbe bei uns kostet. Ohne E-Mail,
                                ohne Rückruf, ohne Formular.
                            </p>

                            <div>
                                <label htmlFor="telefon-benutzer" className="block text-lg font-bold text-text-primary mb-4">
                                    Anzahl Telefon-Benutzer
                                </label>
                                <input
                                    id="telefon-benutzer"
                                    type="number"
                                    min={1}
                                    max={MAX_BENUTZER}
                                    value={benutzer}
                                    onChange={(e) => {
                                        const wert = parseInt(e.target.value, 10);
                                        if (Number.isNaN(wert)) return;
                                        setBenutzer(Math.min(MAX_BENUTZER, Math.max(1, wert)));
                                    }}
                                    className="w-full sm:w-48 p-3 rounded-xl border border-border bg-background text-text-primary focus:border-primary focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="heute-telefonie" className="block text-sm font-medium text-text-primary mb-2">
                                        Was zahlen Sie heute monatlich für Telefonie?
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="heute-telefonie"
                                            type="number"
                                            min={0}
                                            inputMode="decimal"
                                            placeholder="z. B. 320"
                                            value={heuteTelefonie}
                                            onChange={(e) => setHeuteTelefonie(e.target.value)}
                                            className="w-full p-3 pr-14 rounded-xl border border-border bg-background text-text-primary focus:border-primary focus:outline-none transition-colors"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">CHF</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="heute-internet" className="block text-sm font-medium text-text-primary mb-2">
                                        Was zahlen Sie heute monatlich für Internet?
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="heute-internet"
                                            type="number"
                                            min={0}
                                            inputMode="decimal"
                                            placeholder="z. B. 89"
                                            value={heuteInternet}
                                            onChange={(e) => setHeuteInternet(e.target.value)}
                                            className="w-full p-3 pr-14 rounded-xl border border-border bg-background text-text-primary focus:border-primary focus:outline-none transition-colors"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">CHF</span>
                                    </div>
                                </div>
                            </div>

                            <fieldset>
                                <legend className="text-lg font-bold text-text-primary mb-4">Flatrate?</legend>
                                <div className="grid sm:grid-cols-3 gap-3">
                                    <OptionButton selected={flatrate === 'keine'} onClick={() => setFlatrate('keine')}>
                                        Keine
                                    </OptionButton>
                                    <OptionButton selected={flatrate === 'ch'} onClick={() => setFlatrate('ch')}>
                                        CH
                                    </OptionButton>
                                    <OptionButton selected={flatrate === 'cheu'} onClick={() => setFlatrate('cheu')}>
                                        CH & EU
                                    </OptionButton>
                                </div>
                            </fieldset>

                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={internetDazu}
                                    onChange={(e) => setInternetDazu(e.target.checked)}
                                    className="w-5 h-5 accent-primary flex-shrink-0"
                                />
                                <span className="text-text-primary">
                                    Glasfaser-Internet 1 Gbit/s mit fester IP dazu
                                </span>
                            </label>
                        </div>
                    )}

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
                        {modus === 'fixkosten' && (
                            <div className="text-center">
                                {fixkostenPaket ? (
                                    <>
                                        <p className="text-sm text-text-secondary mb-2">Ihr InfraOne-Paket:</p>
                                        <p className="text-3xl md:text-4xl font-bold text-primary mb-4">
                                            {formatCHFGanz(fixkostenPaket.summe)} pro Monat
                                        </p>
                                        <details className="max-w-md mx-auto mb-4 text-left">
                                            <summary className="cursor-pointer text-sm text-primary font-medium text-center list-none">
                                                Alle Bausteine mit Preisen anzeigen
                                            </summary>
                                            <ul className="mt-3 space-y-1.5">
                                                {fixkostenPaket.positionen.map((position) => (
                                                    <li
                                                        key={position.label}
                                                        className="flex justify-between gap-4 text-sm border-b border-border pb-1.5"
                                                    >
                                                        <span className="text-text-secondary">{position.label}</span>
                                                        <span className="font-medium text-text-primary whitespace-nowrap">
                                                            {formatCHFGanz(position.preis)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                        <p className="text-xs text-text-secondary mb-6">
                                            Preise inkl. Details bei 24 Monaten Laufzeit; zzgl. einmaliger
                                            Einrichtung und allfälliger Portierung.
                                        </p>
                                        {ersparnis !== null && ersparnis > 0 ? (
                                            <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30">
                                                <p className="text-xl md:text-2xl font-bold text-text-primary">
                                                    Sie sparen voraussichtlich {formatCHFGanz(ersparnis)} pro Monat
                                                    — {formatCHFGanz(ersparnis * 12)} pro Jahr
                                                </p>
                                                <p className="text-xs text-text-secondary mt-2">
                                                    Bei gleicher oder besserer Leistung: Schweizer Anbieter,
                                                    keine Vertragsbindung über die Grundlaufzeiten hinaus.
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-text-secondary mb-6 max-w-xl mx-auto">
                                                Rechnen wir gemeinsam nach – oft stecken die Kosten im Detail
                                                (Serviceverträge, alte ISDN-Zuschläge, Minutentarife).
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-lg font-medium text-text-primary mb-6">
                                        Für Ihre Grösse rechnen wir individuell – Angaben übernehmen
                                        und Offerte anfordern.
                                    </p>
                                )}
                                <p className="text-sm text-text-primary border-t border-border pt-4 mb-3 max-w-xl mx-auto">
                                    Und wenn Sie schon dabei sind: Mit dem IT-Dienstleistungsvertrag ab CHF 200
                                    pro Monat übernehmen wir auf Wunsch gleich die ganze IT – Arbeitsplätze,
                                    Server, Backups. Monatlich kündbar.
                                </p>
                                <p className="text-xs text-text-secondary max-w-xl mx-auto">
                                    Zum Vergleich: Komplett-Outsourcing-Angebote grosser Schweizer Anbieter
                                    liegen bei rund CHF 280 pro Benutzer und Monat. Wir rechnen lieber
                                    modular – Sie zahlen nur, was Sie brauchen.
                                </p>
                            </div>
                        )}

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
                            {/* h-auto + whitespace-normal: Text darf auf schmalen Screens umbrechen */}
                            <Button size="lg" className="h-auto min-h-14 py-3 whitespace-normal text-base" asChild>
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
