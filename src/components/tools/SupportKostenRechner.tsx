'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    berechneRemoteSpanne,
    berechneVorOrtSpanne,
    berechneBetreuungRichtpreis,
    formatCHF,
    type Zeitfenster,
    type Region,
} from '@/lib/support-kosten';
import {
    berechneInfraOnePaket,
    formatCHFGanz,
    MAX_BENUTZER,
    RUFNUMMERN_OPTIONEN,
    rufnummernLabel,
    type FlatrateOption,
    type RufnummernOption,
} from '@/lib/telefonie-paket';

type Modus = 'fixkosten' | 'einsatz' | 'betreuung';
type Ort = 'vorort' | 'remote';
type BetreutDurch = 'intern' | 'dienstleister' | 'niemand';
type SendStatus = 'idle' | 'submitting' | 'success' | 'error';

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

const BETREUT_DURCH_LABEL: Record<BetreutDurch, string> = {
    intern: 'Interne IT',
    dienstleister: 'Anderer Dienstleister',
    niemand: 'Niemand fest',
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

function JaNeinFeld({
    legend,
    value,
    onChange,
    info,
}: {
    legend: string;
    value: boolean;
    onChange: (v: boolean) => void;
    info?: string;
}) {
    return (
        <fieldset>
            <legend className="text-lg font-bold text-text-primary mb-4">{legend}</legend>
            <div className="grid sm:grid-cols-2 gap-3">
                <OptionButton selected={value === true} onClick={() => onChange(true)}>
                    Ja
                </OptionButton>
                <OptionButton selected={value === false} onClick={() => onChange(false)}>
                    Nein
                </OptionButton>
            </div>
            {info && <p className="text-xs text-text-secondary mt-2">{info}</p>}
        </fieldset>
    );
}

const inputKlasse =
    'w-full p-3 rounded-xl border border-border bg-background text-text-primary focus:border-primary focus:outline-none transition-colors';

const MODUS_LABEL: Record<Modus, string> = {
    fixkosten: 'Fixkosten senken',
    einsatz: 'Ein akutes Problem',
    betreuung: 'Regelmässige Betreuung',
};

export function SupportKostenRechner({
    // Je Seite unterschiedlich: /it-support zeigt die IT-Faelle (Einsatz,
    // Betreuung), /cloud-telefonie den Telefonie-Sparrechner. So fragt der
    // Rechner auf der IT-Support-Seite nicht nach Telefon-Benutzern.
    modi = ['fixkosten', 'einsatz', 'betreuung'],
    defaultModus,
}: {
    modi?: Modus[];
    defaultModus?: Modus;
} = {}) {
    const [modus, setModus] = useState<Modus | null>(defaultModus ?? modi[0]);

    // Anker-Steuerung: "#kostenrechner" scrollt zum Rechner,
    // "#kostenrechner-betreuung" waehlt zusaetzlich den Betreuungsmodus vor
    // (Ziel des "Unverbindlich durchrechnen"-Buttons im Dienstleistungsvertrag-Block).
    useEffect(() => {
        const anwenden = () => {
            const h = window.location.hash;
            if (h !== '#kostenrechner' && h !== '#kostenrechner-betreuung') return;
            if (h === '#kostenrechner-betreuung' && modi.includes('betreuung')) {
                setModus('betreuung');
            }
            document.getElementById('kostenrechner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        anwenden();
        window.addEventListener('hashchange', anwenden);
        return () => window.removeEventListener('hashchange', anwenden);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [ort, setOrt] = useState<Ort | null>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [zeit, setZeit] = useState<Zeitfenster | null>(null);

    // Eingaben Modus «Fixkosten senken»
    const [benutzer, setBenutzer] = useState<number>(5);
    const [rufnummern, setRufnummern] = useState<RufnummernOption>(5);
    const [heuteTelefonie, setHeuteTelefonie] = useState<string>('');
    const [heuteInternet, setHeuteInternet] = useState<string>('');
    const [flatrate, setFlatrate] = useState<FlatrateOption>('ch');
    const [internetDazu, setInternetDazu] = useState<boolean>(true);
    const [betreuungDazu, setBetreuungDazu] = useState<boolean>(false);

    // Eingaben Betreuungs-Assistent (Modus «Regelmässige Betreuung» + Kombi-Pfad)
    const [arbeitsplaetze, setArbeitsplaetze] = useState<number>(5);
    const [standorte, setStandorte] = useState<number>(1);
    const [anzahlServer, setAnzahlServer] = useState<number>(0);
    const [netzwerkMgmt, setNetzwerkMgmt] = useState<boolean>(false);
    const [erweiterteSecurity, setErweiterteSecurity] = useState<boolean>(false);
    const [m365, setM365] = useState<boolean>(false);
    const [vorOrtSupport, setVorOrtSupport] = useState<boolean>(false);
    const [betreutDurch, setBetreutDurch] = useState<BetreutDurch>('niemand');

    // Kontakt + Versand (Direktversand via Netlify Forms, AUFTRAG-010)
    const [kName, setKName] = useState('');
    const [kFirma, setKFirma] = useState('');
    const [kEmail, setKEmail] = useState('');
    const [kTelefon, setKTelefon] = useState('');
    const [sparKontaktOffen, setSparKontaktOffen] = useState(false);
    const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
    const [richtpreisSichtbar, setRichtpreisSichtbar] = useState(false);

    const fixkostenPaket = berechneInfraOnePaket(benutzer, flatrate, internetDazu, rufnummern);
    const heuteTelefonieBetrag = parseFloat(heuteTelefonie) || 0;
    const heuteInternetBetrag = parseFloat(heuteInternet) || 0;
    const heuteGesamt = heuteTelefonieBetrag + heuteInternetBetrag;
    // Ersparnis nur behaupten, wenn sie positiv ist – nie verstecken oder schönen.
    const ersparnis =
        fixkostenPaket !== null && heuteGesamt > 0 ? heuteGesamt - fixkostenPaket.summe : null;

    const richtpreis = berechneBetreuungRichtpreis({
        arbeitsplaetze,
        standorte,
        server: anzahlServer,
        erweiterteSecurity,
    });
    // Kombi-Pfad: Checkbox im Sparmodus ODER direkt der Betreuungs-Modus
    const betreuungAktiv = modus === 'betreuung' || (modus === 'fixkosten' && betreuungDazu);

    const einsatzKomplett = modus === 'einsatz' && ort !== null && region !== null && zeit !== null;
    const remoteSpanne = einsatzKomplett && ort === 'remote' ? berechneRemoteSpanne(zeit) : null;
    const vorOrtSpanne = einsatzKomplett && ort === 'vorort' ? berechneVorOrtSpanne(zeit, region) : null;

    function resetVersand() {
        setSendStatus('idle');
        setRichtpreisSichtbar(false);
        setSparKontaktOffen(false);
    }

    function wechsleModus(m: Modus) {
        setModus(m);
        resetVersand();
    }

    function buildFixkostenZeilen(): string[] {
        const zeilen = [
            'Anliegen: Fixkosten senken (Telefonie & Internet)',
            `Anzahl Telefon-Benutzer: ${benutzer}`,
            `Rufnummern (DIDs): ${rufnummernLabel(rufnummern)}`,
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
        return zeilen;
    }

    function buildBetreuungZeilen(): string[] {
        return [
            'Anliegen: Regelmässige Betreuung (IT-Dienstleistungsvertrag) – Richtpreis-Anfrage',
            `Anzahl Arbeitsplätze: ${arbeitsplaetze}`,
            `Anzahl Standorte: ${standorte}`,
            `Anzahl Server: ${anzahlServer}`,
            `Netzwerk-Management durch InfraOne (Firewall, Switches, WLAN): ${netzwerkMgmt ? 'Ja' : 'Nein'}`,
            `Erweiterte Security (Überwachung & Alarmierung): ${erweiterteSecurity ? 'Ja' : 'Nein'}`,
            `Microsoft 365 / Teams im Einsatz: ${m365 ? 'Ja' : 'Nein'}`,
            `Regelmässiger Vor-Ort-Support gewünscht: ${vorOrtSupport ? 'Ja' : 'Nein'}`,
            `Heute betreut durch: ${BETREUT_DURCH_LABEL[betreutDurch]}`,
            '',
            `Richtpreis: ${formatCHFGanz(richtpreis.summe)} pro Monat`,
            'Positionen:',
            ...richtpreis.positionen.map((p) => `- ${p.label}: ${formatCHFGanz(p.preis)}`),
        ];
    }

    // Vollständige, menschenlesbare Zusammenfassung aller Werte + Beträge + Modus-Titel
    function buildMessage(): string | null {
        if (modus === 'fixkosten' && betreuungDazu) {
            return [
                'Anfrage über den Kostenrechner (Kombi: Fixkosten senken + IT-Betreuung):',
                '',
                ...buildFixkostenZeilen(),
                '',
                ...buildBetreuungZeilen(),
                '',
                'Bitte um Kontaktaufnahme.',
            ].join('\n');
        }
        if (modus === 'fixkosten') {
            return [
                'Anfrage über den Kostenrechner:',
                '',
                ...buildFixkostenZeilen(),
                '',
                'Bitte um Kontaktaufnahme.',
            ].join('\n');
        }
        if (modus === 'betreuung') {
            return [
                'Anfrage über den Kostenrechner:',
                '',
                ...buildBetreuungZeilen(),
                '',
                'Bitte um Kontaktaufnahme.',
            ].join('\n');
        }
        if (remoteSpanne && region && zeit) {
            return [
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
        }
        if (vorOrtSpanne && region && zeit) {
            return [
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
        }
        return null;
    }

    // Fallback: vorbefülltes /kontakt (alte Mechanik, NUR für den Fehlerfall)
    function buildKontaktHref(): string | null {
        const message = buildMessage();
        if (!message) return null;
        const params = new URLSearchParams();
        params.set(
            'subject',
            modus === 'fixkosten' && !betreuungDazu
                ? 'Telefonie und Kommunikation'
                : 'IT-Support und Netzwerke'
        );
        params.set('message', message);
        return `/kontakt?${params.toString()}`;
    }

    const kontaktHref = buildKontaktHref();
    // Direktversand-Knopf: alle Modi ausser Betreuung/Kombi (dort übernimmt das Gate)
    const versandKnopfMoeglich =
        kontaktHref !== null && modus !== 'betreuung' && !(modus === 'fixkosten' && betreuungDazu);

    // Direktversand wie im Kontaktformular: POST auf /__forms.html (Netlify Forms)
    async function sendeAnfrage(felder: { name: string; firma?: string; email: string; telefon?: string }) {
        const message = buildMessage();
        if (!message || sendStatus === 'submitting') return;
        setSendStatus('submitting');
        const body = new URLSearchParams();
        body.append('form-name', 'contact');
        body.append('bot-field', ''); // Honeypot bleibt leer
        body.append('name', felder.name);
        body.append('company', felder.firma ?? '');
        body.append('email', felder.email);
        body.append('phone', felder.telefon ?? '');
        body.append('subject', 'IT-Support und Netzwerke');
        body.append('message', message);
        try {
            const res = await fetch('/__forms.html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setSendStatus('success');
            // Richtpreis (Schritt 3) erscheint erst nach erfolgreichem Versand
            if (betreuungAktiv) setRichtpreisSichtbar(true);
        } catch {
            setSendStatus('error');
        }
    }

    function handleSparSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        sendeAnfrage({ name: kName, email: kEmail });
    }

    function handleGateSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        sendeAnfrage({ name: kName, firma: kFirma, email: kEmail, telefon: kTelefon });
    }

    // Fehlerfall (z. B. lokal ohne Netlify-Backend): Meldung + Fallback auf vorbefülltes /kontakt
    const fehlerBlock = sendStatus === 'error' && kontaktHref !== null && (
        <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-left">
            <p className="text-sm font-medium text-text-primary mb-1">
                Das hat leider nicht geklappt – die Anfrage konnte nicht gesendet werden.
            </p>
            <p className="text-sm text-text-secondary">
                Ihre Angaben bleiben erhalten. Alternativ können Sie sie über das vorbefüllte
                Kontaktformular senden:{' '}
                <Link href={kontaktHref} className="text-primary font-medium hover:underline">
                    Zum Kontaktformular
                </Link>
            </p>
        </div>
    );

    // Inline-Bestätigung nach erfolgreichem Versand (Wortlaut gemäss Vorgabe)
    const erfolgsBlock = sendStatus === 'success' && (
        <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30">
            <p className="text-sm font-medium text-text-primary flex items-start justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span>
                    Danke! Ihre Anfrage ist bei uns – Sie hören innert eines Arbeitstages von uns.
                    Bei dringenden Fällen: 052 222 18 18.
                </span>
            </p>
        </div>
    );

    // Schritt 3: Richtpreis-Anzeige (erst nach erfolgreichem Versand)
    const richtpreisBlock = richtpreisSichtbar && (
        <div className="mt-6 p-6 rounded-xl bg-card border border-border">
            <p className="text-xl md:text-2xl font-bold text-text-primary text-center mb-2">
                Ihr Richtpreis: {formatCHFGanz(richtpreis.summe)} pro Monat
            </p>
            <p className="text-sm text-text-secondary text-center">
                Betrieb, Support und Verwaltung – Hardware und Lizenzen nach Aufwand.
            </p>
            <p className="text-sm text-text-secondary text-center mb-3">
                Verbindliche Offerte innert zwei Arbeitstagen. Monatlich kündbar, keine Mindestlaufzeit.
            </p>
            <details className="text-left">
                <summary className="cursor-pointer text-sm text-primary font-medium text-center list-none">
                    Positionen im Detail anzeigen
                </summary>
                <ul className="mt-3 space-y-1.5">
                    {richtpreis.positionen.map((position) => (
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
        </div>
    );

    // Betreuungs-Assistent: Schritt 1 (Konfiguration) + Schritt 2 (Kontakt-Gate).
    // Wird im Modus «Regelmässige Betreuung» und im Kombi-Pfad verwendet.
    const betreuungsAssistent = (
        <div className="mt-8 space-y-8">
            {/* Schritt 1: Konfiguration – alles auf einer Karte */}
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
                    className={`${inputKlasse} sm:w-48`}
                />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="standorte" className="block text-lg font-bold text-text-primary mb-4">
                        Anzahl Standorte
                    </label>
                    <input
                        id="standorte"
                        type="number"
                        min={1}
                        max={10}
                        value={standorte}
                        onChange={(e) => {
                            const wert = parseInt(e.target.value, 10);
                            if (Number.isNaN(wert)) return;
                            setStandorte(Math.min(10, Math.max(1, wert)));
                        }}
                        className={inputKlasse}
                    />
                </div>
                <div>
                    <label htmlFor="anzahl-server" className="block text-lg font-bold text-text-primary mb-4">
                        Anzahl Server
                    </label>
                    <input
                        id="anzahl-server"
                        type="number"
                        min={0}
                        max={10}
                        value={anzahlServer}
                        onChange={(e) => {
                            const wert = parseInt(e.target.value, 10);
                            if (Number.isNaN(wert)) return;
                            setAnzahlServer(Math.min(10, Math.max(0, wert)));
                        }}
                        className={inputKlasse}
                    />
                </div>
            </div>

            <JaNeinFeld
                legend="Netzwerk-Management durch InfraOne (Firewall, Switches, WLAN)?"
                value={netzwerkMgmt}
                onChange={setNetzwerkMgmt}
            />
            <JaNeinFeld
                legend="Erweiterte Security (Überwachung & Alarmierung)?"
                value={erweiterteSecurity}
                onChange={setErweiterteSecurity}
                info="Grundschutz (Virenschutz, Firewall, Updates) ist immer inbegriffen."
            />
            <JaNeinFeld
                legend="Microsoft 365 / Teams im Einsatz?"
                value={m365}
                onChange={setM365}
            />
            <JaNeinFeld
                legend="Regelmässiger Vor-Ort-Support gewünscht?"
                value={vorOrtSupport}
                onChange={setVorOrtSupport}
            />

            <fieldset>
                <legend className="text-lg font-bold text-text-primary mb-4">Heute betreut durch:</legend>
                <div className="grid sm:grid-cols-3 gap-3">
                    <OptionButton selected={betreutDurch === 'intern'} onClick={() => setBetreutDurch('intern')}>
                        Interne IT
                    </OptionButton>
                    <OptionButton
                        selected={betreutDurch === 'dienstleister'}
                        onClick={() => setBetreutDurch('dienstleister')}
                    >
                        Anderer Dienstleister
                    </OptionButton>
                    <OptionButton selected={betreutDurch === 'niemand'} onClick={() => setBetreutDurch('niemand')}>
                        Niemand fest
                    </OptionButton>
                </div>
            </fieldset>

        </div>
    );

    // Schritt 2 (Betreuung + Kombi-Pfad): Kontakt-Gate.
    // Steht seit AUFTRAG-013 in der rechten Ergebnis-Spalte, nicht mehr unter den Eingaben.
    const kontaktGate = !richtpreisSichtbar && (
        <div className="mt-6 p-6 rounded-2xl border border-primary/30 bg-primary/5">
            <h3 className="text-lg font-bold text-text-primary mb-2">Ihr Richtpreis ist bereit</h3>
            <p className="text-text-secondary mb-4">
                Sagen Sie uns noch, wer Sie sind – dann zeigen wir Ihnen den Richtpreis
                sofort an und senden Ihnen die Aufstellung unverbindlich zu.
            </p>
            <form onSubmit={handleGateSubmit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                    <input
                        type="text"
                        aria-label="Name"
                        placeholder="Name*"
                        required
                        value={kName}
                        onChange={(e) => setKName(e.target.value)}
                        className={inputKlasse}
                    />
                    <input
                        type="text"
                        aria-label="Firma"
                        placeholder="Firma*"
                        required
                        value={kFirma}
                        onChange={(e) => setKFirma(e.target.value)}
                        className={inputKlasse}
                    />
                    <input
                        type="email"
                        aria-label="E-Mail"
                        placeholder="E-Mail*"
                        required
                        value={kEmail}
                        onChange={(e) => setKEmail(e.target.value)}
                        className={inputKlasse}
                    />
                    <input
                        type="tel"
                        aria-label="Telefon (optional)"
                        placeholder="Telefon (optional)"
                        value={kTelefon}
                        onChange={(e) => setKTelefon(e.target.value)}
                        className={inputKlasse}
                    />
                </div>
                <p className="text-xs text-text-secondary">
                    Ihre Angaben gehen ausschliesslich an uns (info@infraone.ch) und werden
                    nur für diese Offerte verwendet. Details:{' '}
                    <Link href="/datenschutz" className="text-primary hover:underline">
                        /datenschutz
                    </Link>
                    .
                </p>
                <div className="text-center pt-2">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={sendStatus === 'submitting'}
                        className="h-auto min-h-14 py-3 whitespace-normal text-base"
                    >
                        <Send className="w-5 h-5" />
                        {sendStatus === 'submitting' ? 'Wird gesendet …' : 'Richtpreis anzeigen'}
                    </Button>
                </div>
            </form>
            {fehlerBlock}
        </div>
    );

    return (
        <section id="kostenrechner" className="py-16 lg:py-24 bg-background border-t border-border scroll-mt-24">
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
                    <div className="p-6 rounded-2xl bg-card border border-border text-center">
                        <p className="text-text-secondary">
                            Der Kostenrechner benötigt JavaScript. Alle Preise finden Sie in der{' '}
                            <a href="#preise" className="text-primary font-medium hover:underline">
                                Preisliste
                            </a>
                            .
                        </p>
                    </div>
                </noscript>

                {/* min-h verhindert Layout-Verschiebungen beim Umschalten der Modi (CLS 0).
                    AUFTRAG-013: volle Container-Breite, ab lg zweispaltig — links Eingaben,
                    rechts das Ergebnis in eigener, sticky Spalte. */}
                <div className="p-6 md:p-8 rounded-2xl bg-card border border-border min-h-[560px]">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-10">
                        {/* Linke Spalte: Eingaben */}
                        <div>
                    {/* Schritt 1: Was liegt an? — nur die fuer diese Seite konfigurierten Modi */}
                    <fieldset>
                        <legend className="text-lg font-bold text-text-primary mb-4">Was liegt an?</legend>
                        <div className={`grid gap-3 ${modi.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                            {modi.map((m) => (
                                <OptionButton
                                    key={m}
                                    selected={modus === m}
                                    onClick={() => wechsleModus(m)}
                                >
                                    {MODUS_LABEL[m]}
                                </OptionButton>
                            ))}
                        </div>
                        {!modi.includes('fixkosten') && (
                            <p className="text-sm text-text-secondary mt-3">
                                Telefon- und Internetkosten senken?{' '}
                                <Link href="/cloud-telefonie#kostenrechner" className="text-primary font-medium hover:underline">
                                    Zum Sparrechner auf der Cloud-Telefonie-Seite
                                </Link>
                            </p>
                        )}
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
                                    className={`${inputKlasse} sm:w-48`}
                                />
                            </div>

                            <fieldset>
                                <legend className="text-lg font-bold text-text-primary mb-4">
                                    Anzahl Rufnummern
                                </legend>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {RUFNUMMERN_OPTIONEN.map((n) => (
                                        <OptionButton
                                            key={n}
                                            selected={rufnummern === n}
                                            onClick={() => setRufnummern(n)}
                                        >
                                            {rufnummernLabel(n)}
                                        </OptionButton>
                                    ))}
                                </div>
                                <p className="text-xs text-text-secondary mt-2">
                                    Einzelnummer CHF 5.– · Block 2–5 CHF 10.– · Block 6–10
                                    CHF 15.– · Block 11–20 CHF 30.– pro Monat. Bestehende
                                    Nummern übernehmen wir per Portierung (einmalige Kosten).
                                </p>
                            </fieldset>

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

                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={betreuungDazu}
                                    onChange={(e) => {
                                        setBetreuungDazu(e.target.checked);
                                        resetVersand();
                                    }}
                                    className="w-5 h-5 accent-primary flex-shrink-0"
                                />
                                <span className="text-text-primary">
                                    Ich interessiere mich zusätzlich für laufende IT-Betreuung
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

                    {modus === 'betreuung' && betreuungsAssistent}

                    {/* Kombi-Pfad: Assistent erscheint nach den Sparmodus-Eingaben */}
                    {modus === 'fixkosten' && betreuungDazu && betreuungsAssistent}
                        </div>

                        {/* Rechte Spalte: Ergebnis, ab lg sticky beim Scrollen sichtbar */}
                        <div className="mt-8 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
                    {/* Ergebnis-Bereich: feste Mindesthöhe, damit nichts springt */}
                    <div className="p-6 rounded-2xl bg-surface border border-border min-h-[190px] flex flex-col justify-center">
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
                                {/* Kombi-Pfad: Richtpreis erscheint unter dem Sparergebnis */}
                                {betreuungDazu && richtpreisBlock}
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

                        {modus === 'betreuung' &&
                            (richtpreisSichtbar ? (
                                <div className="text-center">{richtpreisBlock}</div>
                            ) : (
                                <p className="text-center text-text-secondary">
                                    Konfigurieren Sie oben Ihre Betreuung und fordern Sie Ihren
                                    Richtpreis an – er erscheint dann hier.
                                </p>
                            ))}

                        {modus === 'einsatz' && !kontaktHref && (
                            <p className="text-center text-text-secondary">
                                Fast geschafft – bitte noch die restlichen Angaben auswählen.
                            </p>
                        )}

                        {erfolgsBlock}
                    </div>

                    {/* Kontakt-Gate des Betreuungs-/Kombi-Pfads gehört in die Ergebnis-Spalte */}
                    {(modus === 'betreuung' || (modus === 'fixkosten' && betreuungDazu)) && kontaktGate}

                    {/* Direktversand (Sparmodus ohne Gate + Einsatz-Modus) */}
                    {versandKnopfMoeglich && sendStatus !== 'success' && (
                        <div className="mt-6 text-center">
                            {!sparKontaktOffen ? (
                                <Button
                                    size="lg"
                                    className="h-auto min-h-14 py-3 whitespace-normal text-base"
                                    onClick={() => setSparKontaktOffen(true)}
                                >
                                    <Send className="w-5 h-5" />
                                    Anfrage direkt senden
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            ) : (
                                <form
                                    onSubmit={handleSparSubmit}
                                    className="flex flex-col sm:flex-row gap-3"
                                >
                                    <input
                                        type="text"
                                        aria-label="Name"
                                        placeholder="Name*"
                                        required
                                        value={kName}
                                        onChange={(e) => setKName(e.target.value)}
                                        className={`${inputKlasse} sm:flex-1`}
                                    />
                                    <input
                                        type="email"
                                        aria-label="E-Mail"
                                        placeholder="E-Mail*"
                                        required
                                        value={kEmail}
                                        onChange={(e) => setKEmail(e.target.value)}
                                        className={`${inputKlasse} sm:flex-1`}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={sendStatus === 'submitting'}
                                        className="h-auto min-h-12 whitespace-normal"
                                    >
                                        {sendStatus === 'submitting' ? 'Wird gesendet …' : 'Anfrage senden'}
                                    </Button>
                                </form>
                            )}
                            {fehlerBlock}
                        </div>
                    )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
