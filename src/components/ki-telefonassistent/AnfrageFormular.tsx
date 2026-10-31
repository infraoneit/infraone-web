'use client';

/**
 * «Assistent anfragen» — direkte Anfrage ohne vorherigen Testanruf (AUFTRAG-114, P5).
 *
 * [31.10.2026] AUFTRAG-114: Eingebunden als Section #anfrage auf /ki-telefonassistent (nach dem
 * Preis-Teaser) und auf /ki-telefonassistent/preise (unter den Paketkarten). Texte aus
 * src/lib/ki-anfrage.ts (wortgleich aus dem Auftrag).
 *
 * Versand wie der Direktversand des Kostenrechners: POST auf /__forms.html (Netlify Forms, Formular
 * «contact», Betreff «KI-Telefonassistent»). Das klappt nur auf Netlify; lokal greift der Fehlerpfad:
 * Meldung, nach 1,5 s weiter auf das vorbefüllte /kontakt.
 *
 * Vorbelegung: `#anfrage-<paketid>` (Paketkarten) wählt das Paket; die Firma aus dem Testanruf
 * kommt über sessionStorage «ki-anfrage-firma» (KiDemo) und wird nach dem Lesen gelöscht.
 * Beides wird beim Laden und bei jedem Hash-Wechsel übernommen (Sprung auf derselben Seite).
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ANFRAGE_BETREFF,
    ANFRAGE_FELDER,
    ANFRAGE_FIRMA_SCHLUESSEL,
    ANFRAGE_ID,
    ANFRAGE_PAKET_NACH_ID,
    ANFRAGE_PAKET_VORGABE,
    ANFRAGE_PAKETE,
    ANFRAGE_TEXTE,
    ANFRAGE_WEITERLEITUNG_MS,
    anfrageKontaktHref,
    anfrageNachricht,
    paketAusHash,
    type AnfragePaket,
} from '@/lib/ki-anfrage';

type Status = 'bereit' | 'sendet' | 'gesendet' | 'fehler';

const FELD =
    'w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-text-primary outline-none transition-colors placeholder:text-text-secondary/70 focus:border-primary focus:ring-2 focus:ring-primary/20';
const LABEL = 'mb-2 block text-sm font-medium text-text-primary';

function Pflicht() {
    return (
        <span className="text-text-secondary" aria-hidden="true">
            {' '}
            *
        </span>
    );
}

export function AnfrageFormular({ hintergrund = 'background' }: { hintergrund?: 'background' | 'surface' }) {
    const router = useRouter();
    const [status, setStatus] = useState<Status>('bereit');
    const [name, setName] = useState('');
    const [firma, setFirma] = useState('');
    const [email, setEmail] = useState('');
    const [telefon, setTelefon] = useState('');
    const [paket, setPaket] = useState<AnfragePaket>(ANFRAGE_PAKET_VORGABE);
    const [website, setWebsite] = useState('');
    const [nachricht, setNachricht] = useState('');
    const weiterTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Vorbelegung aus Hash (#anfrage-starter) und aus dem Testanruf (sessionStorage), beim Laden und bei Hash-Wechsel
    useEffect(() => {
        const uebernehmen = () => {
            const ausHash = paketAusHash(window.location.hash);
            if (ausHash) setPaket(ausHash);
            try {
                const ausTest = window.sessionStorage.getItem(ANFRAGE_FIRMA_SCHLUESSEL);
                if (ausTest !== null) {
                    window.sessionStorage.removeItem(ANFRAGE_FIRMA_SCHLUESSEL);
                    if (ausTest.trim()) setFirma(ausTest.trim().slice(0, 200));
                }
            } catch {
                // sessionStorage gesperrt (privater Modus o. ä.): Formular bleibt leer bedienbar
            }
        };
        uebernehmen();
        window.addEventListener('hashchange', uebernehmen);
        return () => {
            window.removeEventListener('hashchange', uebernehmen);
            clearTimeout(weiterTimer.current);
        };
    }, []);

    async function senden(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (status === 'sendet') return;
        setStatus('sendet');
        const honig = (e.currentTarget.elements.namedItem('bot-field') as HTMLInputElement | null)?.value ?? '';
        const body = new URLSearchParams();
        body.append('form-name', 'contact');
        body.append('bot-field', honig); // Honeypot bleibt bei Menschen leer
        body.append('name', name.trim());
        body.append('company', firma.trim());
        body.append('email', email.trim());
        body.append('phone', telefon.trim());
        body.append('subject', ANFRAGE_BETREFF);
        body.append('message', anfrageNachricht(paket, website, nachricht));
        try {
            const res = await fetch('/__forms.html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setStatus('gesendet');
        } catch {
            // lokal (ohne Netlify) und bei Netzfehlern: Hinweis, dann vorbefülltes Kontaktformular
            setStatus('fehler');
            const ziel = anfrageKontaktHref(firma, paket, website, nachricht);
            weiterTimer.current = setTimeout(() => router.push(ziel), ANFRAGE_WEITERLEITUNG_MS);
        }
    }

    const einwilligungTeile = ANFRAGE_TEXTE.einwilligung.split(ANFRAGE_TEXTE.einwilligungLinkwort);

    return (
        <section id={ANFRAGE_ID} className={cn('relative py-16 lg:py-24 scroll-mt-24', hintergrund === 'surface' ? 'bg-surface' : 'bg-background')} data-anfrage="">
            {/* Sprungziele der Paketkarten (#anfrage-starter …): scrollen ohne JavaScript, das Formular liest den Hash */}
            {Object.keys(ANFRAGE_PAKET_NACH_ID).map((id) => (
                <span key={id} id={`${ANFRAGE_ID}-${id}`} className="absolute top-0 block scroll-mt-24" aria-hidden="true" />
            ))}
            <div className="container mx-auto px-4">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
                    <div className="lg:col-span-5">
                        <p className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
                            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                            {ANFRAGE_TEXTE.ueberzeile}
                        </p>
                        <h2 id="anfrage-titel" className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-text-primary text-balance">
                            {ANFRAGE_TEXTE.titel}
                        </h2>
                        <p className="mt-4 text-lg leading-relaxed text-text-secondary">{ANFRAGE_TEXTE.lead}</p>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="rounded-3xl border border-border bg-card p-6 md:p-8" aria-live="polite">
                            {status === 'gesendet' ? (
                                <p role="status" data-anfrage-erfolg="" className="flex items-start gap-3 text-lg font-medium text-text-primary">
                                    <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary" aria-hidden="true" />
                                    {ANFRAGE_TEXTE.erfolg}
                                </p>
                            ) : (
                                <form onSubmit={senden} aria-labelledby="anfrage-titel" className="space-y-5" data-anfrage-formular="">
                                    {/* Honeypot (Netlify «bot-field»): für Menschen unsichtbar, nicht fokussierbar */}
                                    <input name="bot-field" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="anfrage-name" className={LABEL}>
                                                {ANFRAGE_FELDER.name}
                                                <Pflicht />
                                            </label>
                                            <input id="anfrage-name" name="name" type="text" required autoComplete="name" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} className={FELD} />
                                        </div>
                                        <div>
                                            <label htmlFor="anfrage-firma" className={LABEL}>
                                                {ANFRAGE_FELDER.firma}
                                                <Pflicht />
                                            </label>
                                            <input id="anfrage-firma" name="company" type="text" required autoComplete="organization" maxLength={200} value={firma} onChange={(e) => setFirma(e.target.value)} className={FELD} />
                                        </div>
                                        <div>
                                            <label htmlFor="anfrage-email" className={LABEL}>
                                                {ANFRAGE_FELDER.email}
                                                <Pflicht />
                                            </label>
                                            <input id="anfrage-email" name="email" type="email" required autoComplete="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} className={FELD} />
                                        </div>
                                        <div>
                                            <label htmlFor="anfrage-telefon" className={LABEL}>
                                                {ANFRAGE_FELDER.telefon}
                                                <Pflicht />
                                            </label>
                                            <input id="anfrage-telefon" name="phone" type="tel" required autoComplete="tel" maxLength={40} value={telefon} onChange={(e) => setTelefon(e.target.value)} className={FELD} />
                                        </div>
                                        <div>
                                            <label htmlFor="anfrage-paket" className={LABEL}>
                                                {ANFRAGE_FELDER.paket}
                                            </label>
                                            <select id="anfrage-paket" name="paket" value={paket} onChange={(e) => setPaket(e.target.value as AnfragePaket)} className={FELD}>
                                                {ANFRAGE_PAKETE.map((p) => (
                                                    <option key={p} value={p}>
                                                        {p}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="anfrage-website" className={LABEL}>
                                                {ANFRAGE_FELDER.website} <span className="font-normal text-text-secondary">{ANFRAGE_FELDER.optional}</span>
                                            </label>
                                            <input id="anfrage-website" name="website" type="text" inputMode="url" autoComplete="url" maxLength={300} value={website} onChange={(e) => setWebsite(e.target.value)} className={FELD} />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="anfrage-nachricht" className={LABEL}>
                                            {ANFRAGE_FELDER.nachricht} <span className="font-normal text-text-secondary">{ANFRAGE_FELDER.optional}</span>
                                        </label>
                                        <textarea id="anfrage-nachricht" name="nachricht" rows={4} maxLength={3000} value={nachricht} onChange={(e) => setNachricht(e.target.value)} className={cn(FELD, 'resize-y')} />
                                    </div>

                                    {status === 'fehler' && (
                                        <p role="alert" data-anfrage-fehler="" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-text-primary">
                                            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" aria-hidden="true" />
                                            {ANFRAGE_TEXTE.fehler}
                                        </p>
                                    )}

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={status === 'sendet' || status === 'fehler'}
                                            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                                        >
                                            {status === 'sendet' ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                                            {ANFRAGE_TEXTE.knopf}
                                        </button>
                                        <p className="mt-3 text-sm text-text-secondary">
                                            {einwilligungTeile[0]}
                                            <Link href={ANFRAGE_TEXTE.einwilligungLink} className="text-text-primary underline underline-offset-4 decoration-primary">
                                                {ANFRAGE_TEXTE.einwilligungLinkwort}
                                            </Link>
                                            {einwilligungTeile[1]}
                                        </p>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
