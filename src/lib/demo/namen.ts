/**
 * Vornamen für den Demo-Assistenten (in der Schweiz übliche Vornamen).
 *
 * Die KI wählt nur aus dieser Liste (Schema-Enum). Dadurch ist das
 * Geschlecht für «KI-Telefonassistent» / «KI-Telefonassistentin» und das
 * Profil-Feld `stimme` (AUFTRAG-095) bekannt.
 * Namen, die auf der gescannten Website vorkommen, werden vorher entfernt
 * (nie der Name einer realen Person von der Website).
 */

import type { Stimme } from './typen';

export const NAMEN_WEIBLICH = [
    'Lena',
    'Mia',
    'Laura',
    'Sara',
    'Anna',
    'Lea',
    'Nina',
    'Julia',
    'Elena',
    'Sophie',
    'Lara',
    'Alina',
    'Noemi',
    'Selina',
    'Jana',
    'Livia',
    'Lina',
    'Leonie',
    'Chiara',
    'Elin',
] as const;

export const NAMEN_MAENNLICH = [
    'Luca',
    'Noah',
    'Jan',
    'Nico',
    'Simon',
    'Lukas',
    'David',
    'Elias',
    'Fabian',
    'Jonas',
    'Levin',
    'Matteo',
    'Tim',
    'Samuel',
    'Robin',
    'Andrin',
    'Dario',
    'Joel',
    'Lars',
    'Silvan',
] as const;

const WEIBLICH = new Set<string>(NAMEN_WEIBLICH);

/**
 * Schalter DEMO_MAENNLICHE_NAMEN (AUFTRAG-095, Vorgabe 0): Solange der
 * Orchestrator keine belegte männliche Stimme hat (AUFTRAG-094), spricht
 * jeder Demo-Assistent mit Frauenstimme — dann werden nur Frauennamen
 * vergeben. Mit 1 stehen beide Listen zur Wahl.
 */
export function maennlicheNamenErlaubt(): boolean {
    return (process.env.DEMO_MAENNLICHE_NAMEN ?? '0').trim() === '1';
}

/** Namen, die aktuell vergeben werden dürfen. */
export function erlaubteNamen(): string[] {
    return maennlicheNamenErlaubt() ? [...NAMEN_WEIBLICH, ...NAMEN_MAENNLICH] : [...NAMEN_WEIBLICH];
}

export function istWeiblich(name: string): boolean {
    return WEIBLICH.has(name);
}

/** Stimme passend zum Vornamen (Feld `stimme` im Profil, AUFTRAG-095/094). */
export function stimmeFuer(name: string): Stimme {
    return istWeiblich(name) ? 'weiblich' : 'maennlich';
}

export function istErlaubterName(name: string): boolean {
    return erlaubteNamen().includes(name);
}

/** Alle erlaubten Namen, die im Text NICHT als eigenständiges Wort vorkommen. */
export function freieNamen(text: string): string[] {
    const t = ` ${text.toLowerCase()} `;
    return erlaubteNamen().filter((n) => {
        const re = new RegExp(`[^a-zäöüéèàß]${n.toLowerCase()}[^a-zäöüéèàß]`);
        return !re.test(t);
    });
}

/** Deterministische Wahl (gleiche Website → gleicher Name). */
export function waehleName(text: string, saat: string): string {
    const frei = freieNamen(text);
    const pool = frei.length ? frei : ['Lena'];
    let h = 0;
    for (const c of saat) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return pool[h % pool.length];
}
