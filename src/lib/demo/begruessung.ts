/**
 * Begrüssung des Demo-Assistenten — WORTGLEICH wie der Orchestrator
 * (voip-agent, AUFTRAG-091 `demo.py` BEGRUESSUNGEN). Die Karte zeigt sie
 * als Vorschau in der gewählten Sprache (AUFTRAG-095).
 *
 * Der Orchestrator (A-091) kennt nur die Form «de digitali Assistänt» /
 * «der digitale Assistent». AUFTRAG-094 führt die weiblichen Formen ein
 * («d digitali Assistäntin», «die digitale Assistentin»). Bis das live ist,
 * bleibt die Vorschau wortgleich A-091; mit `nachStimme` (Schalter
 * DEMO_BEGRUESSUNG_NACH_STIMME=1) zeigt sie die Form passend zur Stimme.
 * Browser und Server (keine Node-Importe).
 */
import type { Sprache, Stimme } from './typen';

/** A-091, wortgleich (`{name}`/`{firma}` werden ersetzt, nicht formatiert). */
export const BEGRUESSUNGEN: Record<Sprache, string> = {
    dialekt_auto:
        'Grüezi, do isch {name}, de digitali Assistänt vo {firma}. Sie händ uf infraone.ch en Testaaruf uusglöst – ich bi für Sie do. Was wänd Sie wüsse?',
    hochdeutsch:
        'Grüezi, hier ist {name}, der digitale Assistent von {firma}. Sie haben auf infraone.ch einen Testanruf ausgelöst – ich bin für Sie da. Was möchten Sie wissen?',
    englisch:
        "Hello, this is {name}, the digital assistant of {firma}. You requested a test call on infraone.ch – I'm here for you. What would you like to know?",
};

/** Weibliche Formen laut AUFTRAG-094 («digital assistant» bleibt). */
export const BEGRUESSUNGEN_WEIBLICH: Record<Sprache, string> = {
    dialekt_auto:
        'Grüezi, do isch {name}, d digitali Assistäntin vo {firma}. Sie händ uf infraone.ch en Testaaruf uusglöst – ich bi für Sie do. Was wänd Sie wüsse?',
    hochdeutsch:
        'Grüezi, hier ist {name}, die digitale Assistentin von {firma}. Sie haben auf infraone.ch einen Testanruf ausgelöst – ich bin für Sie da. Was möchten Sie wissen?',
    englisch: BEGRUESSUNGEN.englisch,
};

export function begruessungFuer(sprache: Sprache, name: string, firma: string, stimme: Stimme, nachStimme = false): string {
    const vorlage = nachStimme && stimme === 'weiblich' ? BEGRUESSUNGEN_WEIBLICH[sprache] : BEGRUESSUNGEN[sprache];
    return vorlage.replace('{name}', name).replace('{firma}', firma);
}

/**
 * Rolle auf der Karte: «KI-Telefonassistentin von FIRMA» / «KI-Telefonassistent von FIRMA»;
 * AUFTRAG-098: bei «English» «AI phone assistant of FIRMA» (für beide Stimmen).
 */
export function rolleFuer(stimme: Stimme, sprache: Sprache = 'hochdeutsch'): string {
    if (sprache === 'englisch') return 'AI phone assistant';
    return stimme === 'weiblich' ? 'KI-Telefonassistentin' : 'KI-Telefonassistent';
}

/** Standard-Fähigkeiten (Regel-Profil bzw. Auffüllung des KI-Profils, AUFTRAG-092). */
export const STANDARD_FAEHIGKEITEN = [
    'Rund um die Uhr erreichbar',
    'Beantwortet Fragen aus Ihrer Website',
    'Nimmt Anliegen und Rückrufwünsche auf',
];

/** AUFTRAG-098: feste englische Fassung, gleiche Reihenfolge (Karte bei «English»). */
export const STANDARD_FAEHIGKEITEN_EN = [
    'Available around the clock',
    'Answers questions from your website',
    'Takes requests and callback wishes',
];

/** Englische Fassung, wenn alle Fähigkeiten Standard sind (ohne Server-Aufruf), sonst null. */
export function standardAufEnglisch(de: string[]): string[] | null {
    const en = de.slice(0, 3).map((d) => STANDARD_FAEHIGKEITEN_EN[STANDARD_FAEHIGKEITEN.indexOf(d)]);
    return en.length === 3 && en.every(Boolean) ? en : null;
}

/** Ganze Rollenzeile der Karte, z. B. «AI phone assistant of Muster AG». */
export function rollenZeile(stimme: Stimme, sprache: Sprache, firma: string): string {
    return `${rolleFuer(stimme, sprache)} ${sprache === 'englisch' ? 'of' : 'von'} ${firma}`;
}
