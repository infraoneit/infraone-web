import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'images');

// User-provided SVG content (1100x550) — IT trifft OT diagram
const innerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 550" width="1100" height="550">
  <defs>
    <linearGradient id="itGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f2027"/>
      <stop offset="50%" stop-color="#203a43"/>
      <stop offset="100%" stop-color="#2c5364"/>
    </linearGradient>
    <linearGradient id="otGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3e1d04"/>
      <stop offset="50%" stop-color="#5a2d0c"/>
      <stop offset="100%" stop-color="#8e4a15"/>
    </linearGradient>
    <linearGradient id="bridgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="100%" stop-color="#fe5100"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-opacity="0.35" />
    </filter>
    <filter id="glowIT" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="glowOT" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#00f2fe" />
    </marker>
    <marker id="arrowOrange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#fe5100" />
    </marker>
  </defs>

  <path d="M 400 210 C 550 210, 550 210, 700 210" stroke="#00f2fe" stroke-width="4" stroke-dasharray="6,6" fill="none" marker-end="url(#arrowBlue)"/>
  <path d="M 700 340 C 550 340, 550 340, 400 340" stroke="#fe5100" stroke-width="4" stroke-dasharray="6,6" fill="none" marker-end="url(#arrowOrange)"/>

  <text x="550" y="195" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#00f2fe" text-anchor="middle" letter-spacing="1">BUSINESS LOGIC &amp; ERP DATA</text>
  <text x="550" y="370" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#fe5100" text-anchor="middle" letter-spacing="1">TELEMETRY &amp; SENSOR DATA</text>

  <rect x="50" y="50" width="350" height="450" rx="20" fill="url(#itGrad)" filter="url(#shadow)" stroke="#00f2fe" stroke-width="2" stroke-opacity="0.4"/>
  <circle cx="225" cy="120" r="45" fill="none" stroke="#00f2fe" stroke-width="3" filter="url(#glowIT)"/>
  <text x="225" y="132" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">IT</text>
  <text x="225" y="190" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#a0c4ff" text-anchor="middle" letter-spacing="2">INFORMATION TECHNOLOGY</text>

  <rect x="90" y="235" width="270" height="50" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.2"/>
  <text x="225" y="265" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#e0fbfc" text-anchor="middle">Enterprise Resource Planning</text>

  <rect x="90" y="305" width="270" height="50" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.2"/>
  <text x="225" y="335" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#e0fbfc" text-anchor="middle">Cloud &amp; Big Data Analytics</text>

  <rect x="90" y="375" width="270" height="50" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.2"/>
  <text x="225" y="405" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#e0fbfc" text-anchor="middle">Business Intelligence</text>

  <rect x="700" y="50" width="350" height="450" rx="20" fill="url(#otGrad)" filter="url(#shadow)" stroke="#fe5100" stroke-width="2" stroke-opacity="0.4"/>
  <circle cx="875" cy="120" r="45" fill="none" stroke="#fe5100" stroke-width="3" filter="url(#glowOT)"/>
  <text x="875" y="132" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">OT</text>
  <text x="875" y="190" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffc8a2" text-anchor="middle" letter-spacing="2">OPERATIONAL TECHNOLOGY</text>

  <rect x="740" y="235" width="270" height="50" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.2"/>
  <text x="875" y="265" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffe5d9" text-anchor="middle">SCADA / HMI Systems</text>

  <rect x="740" y="305" width="270" height="50" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.2"/>
  <text x="875" y="335" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffe5d9" text-anchor="middle">PLC &amp; Industrial Control</text>

  <rect x="740" y="375" width="270" height="50" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.2"/>
  <text x="875" y="405" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffe5d9" text-anchor="middle">Sensors, Actuators &amp; CNC</text>

  <rect x="400" y="245" width="300" height="60" rx="30" fill="#111111" stroke="url(#bridgeGrad)" stroke-width="4" filter="url(#shadow)"/>
  <text x="550" y="282" font-family="Arial, sans-serif" font-size="19" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">IIoT EDGE GATEWAY</text>
</svg>`;

// Render the user's SVG directly at its native 1100x550, then resize-fit to 1200x675 with dark padding.
// This preserves every detail without cropping.
(async () => {
    const outPath = path.join(OUT_DIR, 'blog-cover-it-trifft-ot.webp');
    await sharp(Buffer.from(innerSvg))
        .resize(1200, 675, {
            fit: 'contain',
            background: { r: 10, g: 18, b: 10, alpha: 1 }, // matches site bg-background dark
        })
        .webp({ quality: 90, effort: 6 })
        .toFile(outPath);
    console.log('✓ blog-cover-it-trifft-ot.webp ersetzt');
})();
