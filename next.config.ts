import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler fuer bessere Performance
  reactCompiler: true,
  
  // Bildoptimierung
  images: {
    // Moderne Bildformate aktivieren (50-80% kleiner als PNG)
    formats: ['image/avif', 'image/webp'],
    // Device-Groessen fuer responsive Bilder
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Bildgroessen fuer verschiedene Breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimale Cache-Zeit fuer optimierte Bilder (1 Jahr)
    minimumCacheTTL: 31536000,
    // Erlaubte Qualitaetsstufen
    qualities: [75, 80],
  },
  
  // Experimentelle Features fuer bessere Performance
  experimental: {
    // Optimierte Package-Imports (Tree-Shaking)
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Kompression aktivieren
  compress: true,
  
  // Powered-by Header entfernen (Security + weniger Bytes)
  poweredByHeader: false,
  
  // Strikte Mode fuer bessere Fehlerkennung
  reactStrictMode: true,
};

export default nextConfig;