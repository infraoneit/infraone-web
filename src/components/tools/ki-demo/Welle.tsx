/**
 * Stimm-Wellenform (reines CSS, keine Canvas-Animation). Die Farbe kommt
 * über --welle und gleitet von InfraOne-Grün zur Firmenfarbe.
 */
import type { CSSProperties } from 'react';
import styles from '../KiDemo.module.css';

export type WellenModus = 'ruhe' | 'scan' | 'sprechen' | 'still';

function hoehen(n: number): number[] {
    const mitte = (n - 1) / 2;
    return Array.from({ length: n }, (_, i) => {
        const x = (i - mitte) / (n * 0.3);
        const huelle = Math.exp(-x * x);
        const zacke = 0.62 + 0.38 * Math.abs(Math.sin(i * 1.37 + 0.4));
        return Math.round((0.14 + 0.86 * huelle * zacke) * 1000) / 1000;
    });
}

const CACHE = new Map<number, number[]>();

export function Welle({ farbe, modus, anzahl = 30, hell = false, className = '' }: { farbe: string; modus: WellenModus; anzahl?: number; hell?: boolean; className?: string }) {
    let h = CACHE.get(anzahl);
    if (!h) {
        h = hoehen(anzahl);
        CACHE.set(anzahl, h);
    }
    return (
        <div className={`${styles.welle} ${hell ? styles.welleHell : ''} ${className}`} data-modus={modus} style={{ '--welle': farbe } as CSSProperties} aria-hidden="true">
            <div className={styles.balken}>
                {h.map((wert, i) => (
                    <span key={i} style={{ '--h': wert, '--i': i } as CSSProperties} />
                ))}
            </div>
        </div>
    );
}
