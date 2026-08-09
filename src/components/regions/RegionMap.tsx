// AUFTRAG-016, Baustein A: Regionskarte fuer die IT-Support-Regionsseiten.
// Server-Komponente (reine SVG-Ausgabe, Animationen via SMIL/CSS — kein JS noetig).
// Daten: src/data/region-geo.json (Kantonsgrenzen/Seen/Orte, nicht veraendern!)
// Konfiguration: src/data/region-map-config.ts
// Die Karte bleibt in beiden Themes dunkel (wie ein Foto), daher feste Farbwerte.

import geoData from '@/data/region-geo.json';
import { regionMapConfigs } from '@/data/region-map-config';

interface CantonGeo {
    viewBox: string;
    canton: string;
    lakes: { id: number; d: string }[];
    projectCities: Record<string, [number, number]>;
}

const geo = geoData as unknown as Record<string, CantonGeo>;

// Geschaetzte Textbreite bei font-size 11 (Geist): ~6.4px/Zeichen, Minuten ~7px/Zeichen
function badgeWidth(name: string, minuten: string | null): number {
    let w = 20 + Math.round(name.length * 6.4);
    if (minuten) w += 8 + Math.round(minuten.length * 7);
    return w;
}

export function RegionMap({ region }: { region: string }) {
    const cfg = regionMapConfigs[region];
    if (!cfg) return null;
    const canton = geo[cfg.cantonKey];
    if (!canton) return null;

    const hqPos = canton.projectCities[cfg.hq.cityKey];
    if (!hqPos) return null;

    const lakes = canton.lakes.filter(l => cfg.lakeIds.includes(l.id));
    const ziele = cfg.ziele
        .map(z => ({ ...z, pos: canton.projectCities[z.cityKey] }))
        .filter(z => Array.isArray(z.pos));

    const uid = `rm-${region}`;

    return (
        <div className="rounded-2xl border border-[#24402E] bg-[#0A130D] p-5 shadow-2xl">
            {/* Reduced Motion: CSS-Animationen deaktivieren (SMIL laeuft weiter — akzeptierte Einschraenkung) */}
            <style>{`@media (prefers-reduced-motion: reduce) { .region-map-svg, .region-map-svg * { animation: none !important; } }`}</style>

            <div className="flex items-baseline justify-between gap-4 mb-4">
                <h3 className="text-sm font-semibold text-[#E6F2E8]">Vor Ort im ganzen Einsatzgebiet</h3>
                <span className="text-xs text-[#7FA88A] whitespace-nowrap">Fahrzeit ab {cfg.hq.name}</span>
            </div>

            <div className="rounded-xl overflow-hidden bg-[#08100B] ring-1 ring-[#1B2E20]">
                <svg
                    viewBox={canton.viewBox}
                    width="100%"
                    className="region-map-svg block h-auto"
                    role="img"
                    aria-label={`Karte des Einsatzgebiets ${cfg.regionName} mit Fahrzeiten ab ${cfg.hq.name}`}
                >
                    <defs>
                        <radialGradient id={`${uid}-canton`} cx="50%" cy="42%" r="75%">
                            <stop offset="0%" stopColor="#17402a" />
                            <stop offset="100%" stopColor="#0a1a10" />
                        </radialGradient>
                        <linearGradient id={`${uid}-lake`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#123350" />
                            <stop offset="100%" stopColor="#0a1c2d" />
                        </linearGradient>
                        <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="6" />
                        </filter>
                        <pattern id={`${uid}-grid`} width="28" height="28" patternUnits="userSpaceOnUse">
                            <path d="M28 0H0V28" fill="none" stroke="#2f7a4c" strokeOpacity="0.16" strokeWidth="0.6" />
                        </pattern>
                        <clipPath id={`${uid}-clip`}>
                            <path d={canton.canton} />
                        </clipPath>
                    </defs>

                    {/* Kantons-Glow hinter der Flaeche */}
                    <path d={canton.canton} fill="none" stroke="#2f7a4c" strokeWidth="7" opacity="0.5" filter={`url(#${uid}-glow)`} />

                    {/* Kantonsflaeche */}
                    <path d={canton.canton} fill={`url(#${uid}-canton)`} stroke="#2f7a4c" strokeWidth="1.6" />

                    {/* Seen (nur konfigurierte IDs) — ueber der Kantonsflaeche, damit sie sichtbar bleiben */}
                    {lakes.map(l => (
                        <path key={l.id} d={l.d} fill={`url(#${uid}-lake)`} stroke="#1c3b57" strokeWidth="1.2" />
                    ))}

                    {/* Feines Gitter, auf die Kantonsflaeche beschnitten */}
                    <g clipPath={`url(#${uid}-clip)`}>
                        <rect x="0" y="0" width="100%" height="100%" fill={`url(#${uid}-grid)`} />
                    </g>

                    {/* Routen HQ -> Ziel-Orte (geschwungen, gestrichelt, SMIL-laufend) */}
                    {ziele.map((z, i) => {
                        const [x1, y1] = hqPos;
                        const [x2, y2] = z.pos;
                        const mx = (x1 + x2) / 2;
                        const my = (y1 + y2) / 2;
                        const dxr = x2 - x1;
                        const dyr = y2 - y1;
                        const dist = Math.max(Math.hypot(dxr, dyr), 1);
                        const side = i % 2 === 0 ? 1 : -1;
                        const cx = mx + (-dyr / dist) * dist * 0.15 * side;
                        const cy = my + (dxr / dist) * dist * 0.15 * side;
                        const dur = (2.2 + (i % 5) * 0.2).toFixed(1);
                        return (
                            <path
                                key={`route-${z.cityKey}`}
                                d={`M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`}
                                fill="none"
                                stroke="#34d374"
                                strokeWidth="1.8"
                                strokeDasharray="4 7"
                                strokeLinecap="round"
                                opacity="0.9"
                            >
                                <animate attributeName="stroke-dashoffset" from="0" to="-22" dur={`${dur}s`} repeatCount="indefinite" />
                            </path>
                        );
                    })}

                    {/* Ziel-Orte: Ringpunkt + Badge-Pille */}
                    {ziele.map(z => {
                        const [x, y] = z.pos;
                        const name = z.label ?? z.cityKey;
                        const w = badgeWidth(name, z.minuten);
                        return (
                            <g key={`ziel-${z.cityKey}`}>
                                <circle cx={x} cy={y} r="5.5" fill="#0d1f14" stroke="#67e8a1" strokeWidth="2" />
                                <g transform={`translate(${(x + z.dx).toFixed(1)} ${(y + z.dy).toFixed(1)})`}>
                                    <rect width={w} height="20" rx="10" fill="#0e2317" fillOpacity="0.87" stroke="#245538" strokeWidth="1" />
                                    <text x="10" y="14" fontSize="11" fontFamily="inherit">
                                        <tspan fill="#D6EEDB">{name}</tspan>
                                        {z.minuten && <tspan dx="6" fill="#34d374" fontWeight="700">{`${z.minuten}'`}</tspan>}
                                    </text>
                                </g>
                            </g>
                        );
                    })}

                    {/* HQ-Marker: pulsierender Halo + Punkt mit weissem Kern */}
                    <circle cx={hqPos[0]} cy={hqPos[1]} r="7" fill="none" stroke="#2fe36f" strokeWidth="2" opacity="0.55">
                        <animate attributeName="r" values="7;22" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.55;0" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={hqPos[0]} cy={hqPos[1]} r="7" fill="#2fe36f" />
                    <circle cx={hqPos[0]} cy={hqPos[1]} r="2.6" fill="#ffffff" />

                    {/* HQ-Badge */}
                    <g transform={`translate(${(hqPos[0] + cfg.hq.dx).toFixed(1)} ${(hqPos[1] + cfg.hq.dy).toFixed(1)})`}>
                        <rect width={badgeWidth(`${cfg.hq.name} · HQ`, null)} height="20" rx="10" fill="#0B1A10" stroke="#2f7a4c" strokeWidth="1.2" />
                        <text x="10" y="14" fontSize="11" fontFamily="inherit">
                            <tspan fill="#E7F6EA" fontWeight="600">{cfg.hq.name}</tspan>
                            <tspan dx="5" fill="#34d374" fontWeight="700">· HQ</tspan>
                        </text>
                    </g>
                </svg>
            </div>

            {/* Legende */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs text-[#7FA88A]">
                <span className="inline-flex items-center gap-2">
                    <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="#2fe36f" /><circle cx="6" cy="6" r="1.8" fill="#ffffff" /></svg>
                    Standort InfraOne
                </span>
                <span className="inline-flex items-center gap-2">
                    <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="#0d1f14" stroke="#67e8a1" strokeWidth="2" /></svg>
                    Vor-Ort-Einsatzgebiet
                </span>
                <span className="inline-flex items-center gap-2">
                    <svg width="20" height="8" aria-hidden="true"><line x1="1" y1="4" x2="19" y2="4" stroke="#34d374" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" /></svg>
                    Fahrzeit ab {cfg.hq.name}
                </span>
            </div>
        </div>
    );
}
