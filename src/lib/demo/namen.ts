/**
 * Vornamen für den Demo-Assistenten (in der Schweiz übliche Vornamen).
 *
 * Die KI wählt nur aus dieser Liste (Schema-Enum). Dadurch ist das
 * Geschlecht für «KI-Telefonassistent» / «KI-Telefonassistentin» bekannt,
 * ohne das Profil (Schnittstelle AUFTRAG-091) um ein Feld zu erweitern.
 * Namen, die auf der gescannten Website vorkommen, werden vorher entfernt
 * (nie der Name einer realen Person von der Website).
 */

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

export function istWeiblich(name: string): boolean {
    return WEIBLICH.has(name);
}

export function istErlaubterName(name: string): boolean {
    return WEIBLICH.has(name) || (NAMEN_MAENNLICH as readonly string[]).includes(name);
}

/** Alle Namen, die im Text NICHT als eigenständiges Wort vorkommen. */
export function freieNamen(text: string): string[] {
    const t = ` ${text.toLowerCase()} `;
    return [...NAMEN_WEIBLICH, ...NAMEN_MAENNLICH].filter((n) => {
        const re = new RegExp(`[^a-zäöüéèàß]${n.toLowerCase()}[^a-zäöüéèàß]`);
        return !re.test(t);
    });
}

/** Deterministische Wahl (gleiche Website → gleicher Name), bevorzugt weiblich. */
export function waehleName(text: string, saat: string): string {
    const frei = freieNamen(text);
    const weiblich = frei.filter((n) => WEIBLICH.has(n));
    const pool = weiblich.length ? weiblich : frei.length ? frei : ['Lena'];
    let h = 0;
    for (const c of saat) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return pool[h % pool.length];
}
