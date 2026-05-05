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

  // 301-Redirects fuer alte URLs:
  // - /telefonie wird auf /cloud-telefonie konsolidiert (Kannibalisierung beheben)
  // - 5 historische Blog-Slugs (in alter Sitemap, aber nie als Page existiert)
  //   werden auf /blog oder den jeweiligen Nachfolge-Post gemappt
  async redirects() {
    return [
      {
        source: '/telefonie',
        destination: '/cloud-telefonie',
        permanent: true,
      },
      {
        source: '/blog/ki-kmu-digitalisierung',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/cloud-telefonie-kmu-vorteile',
        destination: '/blog/moderne-telefonie-peoplefone-3cx',
        permanent: true,
      },
      {
        source: '/blog/webagentur-freelancer-vergleich',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/black-box-emerald',
        destination: '/blog/multimonitor-systeme-black-box-emerald',
        permanent: true,
      },
      {
        source: '/blog/10-seo-fehler-kmu',
        destination: '/blog',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;