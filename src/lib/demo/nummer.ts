/**
 * Telefonnummern der KI-Demo (Server UND Browser).
 *
 * Rückruf nur an +41 (Schweiz) und +423 (Liechtenstein). Gesperrt sind
 * Mehrwert- und Sonderdienste: 090x (Mehrwert), 080x (Gratisnummern),
 * 084x (Shared Cost), 086x (Combox-Zugang), 087x (Sonderdienste) — damit
 * die Demo nie kostenpflichtige oder unpersönliche Ziele anwählt.
 */

export type NummerPruefung = { ok: true; e164: string } | { ok: false; grund: 'format' | 'land' | 'sonderdienst' };

/** Reduziert eine Eingabe auf + und Ziffern. */
function bereinige(roh: string): string {
    const s = roh.replace(/\(0\)/g, '').replace(/[^\d+]/g, '');
    return s.startsWith('+') ? '+' + s.slice(1).replace(/\+/g, '') : s.replace(/\+/g, '');
}

/**
 * Normalisiert auf E.164 und prüft die Rückruf-Regeln.
 * `vorwahl` wird verwendet, wenn die Eingabe national (0…) oder ohne Vorwahl ist.
 */
export function pruefeRueckrufNummer(roh: string, vorwahl: '+41' | '+423' = '+41'): NummerPruefung {
    let s = bereinige(roh);
    if (!s) return { ok: false, grund: 'format' };
    if (s.startsWith('00')) s = '+' + s.slice(2);
    if (!s.startsWith('+')) {
        if (vorwahl === '+41') s = '+41' + s.replace(/^0/, '');
        else s = '+423' + s;
    }
    if (s.startsWith('+41')) {
        const rest = s.slice(3).replace(/^0/, '');
        if (!/^[1-9]\d{8}$/.test(rest)) return { ok: false, grund: 'format' };
        if (/^(80|84|86|87|90)/.test(rest)) return { ok: false, grund: 'sonderdienst' };
        return { ok: true, e164: '+41' + rest };
    }
    if (s.startsWith('+423')) {
        const rest = s.slice(4);
        if (!/^[2-9]\d{6}$/.test(rest)) return { ok: false, grund: 'format' };
        if (/^(80|84|87|90)/.test(rest)) return { ok: false, grund: 'sonderdienst' };
        return { ok: true, e164: '+423' + rest };
    }
    return { ok: false, grund: 'land' };
}

/** Normalisiert eine auf einer Website gefundene Nummer (CH/LI) auf E.164, sonst null. */
export function normalisiereGefundeneNummer(roh: string): string | null {
    const s = bereinige(roh);
    let e: string | null = null;
    if (/^\+41\d{9,10}$/.test(s)) e = '+41' + s.slice(3).replace(/^0/, '');
    else if (/^0041\d{9,10}$/.test(s)) e = '+41' + s.slice(4).replace(/^0/, '');
    else if (/^0[1-9]\d{8}$/.test(s)) e = '+41' + s.slice(1);
    else if (/^\+423\d{7}$/.test(s)) e = s;
    else if (/^00423\d{7}$/.test(s)) e = '+' + s.slice(2);
    if (!e) return null;
    if (e.startsWith('+41') && !/^\+41[1-9]\d{8}$/.test(e)) return null;
    return e;
}

/** Anzeigeform: +41522221818 → 052 222 18 18; +4237771234 → +423 777 12 34 */
export function formatiereNummer(e164: string): string {
    if (/^\+41\d{9}$/.test(e164)) {
        const n = '0' + e164.slice(3);
        return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
    }
    if (/^\+423\d{7}$/.test(e164)) {
        const n = e164.slice(4);
        return `+423 ${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)}`;
    }
    return e164;
}
