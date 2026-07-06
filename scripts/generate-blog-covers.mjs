import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'images');

// InfraOne Brand
const BG_DARK = '#0a120a';
const BG_MID = '#1a3a1f';
const PRIMARY = '#3d9646';
const PRIMARY_LIGHT = '#4caf50';

// 1200x675 = 16:9 aspect ratio (matching aspect-[16/9] thumbnails)
const W = 1200;
const H = 675;

/**
 * Generate a branded cover SVG.
 * `icons` is an array of {svgPaths, x, y, size, opacity?} entries — each represents a stylized icon glyph.
 * Lucide-style stroke-based icons rendered in white at varying opacities for layered look.
 */
function makeCoverSVG({ icons, badge }) {
    const iconElements = icons.map(ic => {
        const op = ic.opacity ?? 0.85;
        const size = ic.size ?? 200;
        return `<g transform="translate(${ic.x},${ic.y})" stroke="white" stroke-width="${ic.strokeWidth ?? 6}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${op}">
            ${ic.svgPaths.map(p => `<path d="${p}" transform="scale(${size / 24})"/>`).join('')}
        </g>`;
    }).join('\n');

    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${BG_DARK}"/>
            <stop offset="50%" stop-color="${BG_MID}"/>
            <stop offset="100%" stop-color="${PRIMARY}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="${PRIMARY_LIGHT}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${PRIMARY}" stop-opacity="0"/>
        </radialGradient>
        <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.12"/>
        </pattern>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <ellipse cx="${W/2}" cy="${H/2}" rx="${W*0.45}" ry="${H*0.55}" fill="url(#glow)"/>

    ${iconElements}

    <!-- Brand corner -->
    <g transform="translate(60, 60)">
        <circle cx="20" cy="20" r="20" fill="${PRIMARY}"/>
        <text x="20" y="27" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="700" text-anchor="middle">i</text>
    </g>
    <text x="115" y="86" fill="white" font-family="Arial, sans-serif" font-size="22" font-weight="600" opacity="0.85">InfraOne</text>

    <!-- Category badge bottom-left -->
    <g transform="translate(60, ${H - 75})">
        <rect x="0" y="0" width="${badge.length * 11 + 40}" height="40" rx="20" fill="white" fill-opacity="0.12" stroke="white" stroke-opacity="0.25"/>
        <text x="20" y="26" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.5">${badge}</text>
    </g>
</svg>`;
}

// Lucide-style icon paths (simplified, 24x24 viewBox source)
const ICONS = {
    cloud: ['M17.5 19a4.5 4.5 0 1 0-1.4-8.8 7 7 0 0 0-13.6 2.3 4.5 4.5 0 0 0 1.5 8.5h13.5z'],
    server: ['M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z',
             'M2 16a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z',
             'M6 10h.01', 'M6 18h.01'],
    cog: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
          'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.151.66.41.86.74.2.33.31.71.31 1.1V11a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
    phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'],
    monitor: ['M2 3a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z',
              'M8 21h8', 'M12 17v4'],
    wrench: ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'],
    banknote: ['M3 6h18v12H3z', 'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
               'M6 12h.01', 'M18 12h.01'],
    arrowRight: ['M5 12h14', 'M12 5l7 7-7 7'],
    box: ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
          'M3.27 6.96 12 12.01l8.73-5.05', 'M12 22.08V12'],
    globe: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
            'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
    layout: ['M3 3h18v18H3z', 'M3 9h18', 'M9 21V9'],
    lock: ['M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z',
           'M7 11V7a5 5 0 0 1 10 0v4'],
    key: ['M21 2l-9.6 9.6a5.5 5.5 0 1 1-3 3L18 11', 'M15 6l3 3'],
    windows: ['M3 5.5L11 4v8H3z', 'M13 3.8L21 2v10h-8z', 'M3 12h8v8L3 18.5z', 'M13 12h8v10l-8-1.8z'],
};

// 6 cover definitions — one per blog post.
const covers = [
    {
        slug: 'it-trifft-ot',
        badge: 'IT-WISSEN',
        icons: [
            { svgPaths: ICONS.server, x: 340, y: 220, size: 260, opacity: 0.85 },
            { svgPaths: ICONS.cog, x: 670, y: 220, size: 260, opacity: 0.85 },
        ],
    },
    {
        slug: 'cloud-telefonanlage-vs-on-premise',
        badge: 'TELEFONIE',
        icons: [
            { svgPaths: ICONS.cloud, x: 280, y: 220, size: 280, opacity: 0.85 },
            { svgPaths: ICONS.server, x: 640, y: 235, size: 260, opacity: 0.85 },
        ],
    },
    {
        slug: 'it-support-kosten-schweiz',
        badge: 'IT-WISSEN',
        icons: [
            { svgPaths: ICONS.wrench, x: 340, y: 220, size: 260, opacity: 0.85 },
            { svgPaths: ICONS.banknote, x: 660, y: 230, size: 260, opacity: 0.85 },
        ],
    },
    {
        slug: 'microsoft-365-migration-kmu',
        badge: 'IT-WISSEN',
        icons: [
            { svgPaths: ICONS.box, x: 240, y: 220, size: 240, opacity: 0.85 },
            { svgPaths: ICONS.arrowRight, x: 540, y: 250, size: 200, opacity: 0.9 },
            { svgPaths: ICONS.cloud, x: 780, y: 220, size: 240, opacity: 0.85 },
        ],
    },
    {
        slug: 'webdesign-kosten-schweiz',
        badge: 'WEBDESIGN',
        icons: [
            { svgPaths: ICONS.layout, x: 340, y: 220, size: 260, opacity: 0.85 },
            { svgPaths: ICONS.banknote, x: 660, y: 230, size: 260, opacity: 0.85 },
        ],
    },
    {
        slug: 'windows-11-admin-passwort-zuruecksetzen',
        badge: 'IT-WISSEN',
        icons: [
            { svgPaths: ICONS.lock, x: 340, y: 220, size: 260, opacity: 0.85 },
            { svgPaths: ICONS.key, x: 660, y: 230, size: 260, opacity: 0.85 },
        ],
    },
];

(async () => {
    for (const cover of covers) {
        const svg = makeCoverSVG(cover);
        const outPath = path.join(OUT_DIR, `blog-cover-${cover.slug}.webp`);
        await sharp(Buffer.from(svg))
            .resize(W, H)
            .webp({ quality: 88, effort: 6 })
            .toFile(outPath);
        console.log('✓', `blog-cover-${cover.slug}.webp`);
    }
    console.log('Done.');
})();
