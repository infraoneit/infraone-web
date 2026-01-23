import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/sections/HeroSection';
import { generateWebSiteSchema, generateMainBusinessSchema } from '@/lib/seo/schema';

// Lazy Loading fuer Below-the-fold Sections (reduziert initiales Bundle)
const AdvantagesSection = dynamic(
  () => import('@/components/sections/AdvantagesSection').then(mod => ({ default: mod.AdvantagesSection })),
  { ssr: true }
);

const PartnerSlider = dynamic(
  () => import('@/components/sections/PartnerSlider').then(mod => ({ default: mod.PartnerSlider })),
  { ssr: true }
);

const ServicesSection = dynamic(
  () => import('@/components/sections/ServicesSection').then(mod => ({ default: mod.ServicesSection })),
  { ssr: true }
);

const PromoSection = dynamic(
  () => import('@/components/sections/PromoSection').then(mod => ({ default: mod.PromoSection })),
  { ssr: true }
);

const TestimonialsSection = dynamic(
  () => import('@/components/sections/TestimonialsSection').then(mod => ({ default: mod.TestimonialsSection })),
  { ssr: true }
);

const ContactSection = dynamic(
  () => import('@/components/sections/ContactSection').then(mod => ({ default: mod.ContactSection })),
  { ssr: true }
);

const HomepageFAQSection = dynamic(
  () => import('@/components/sections/HomepageFAQSection').then(mod => ({ default: mod.HomepageFAQSection })),
  { ssr: true }
);

export default function HomePage() {
  const websiteSchema = generateWebSiteSchema();
  const mainBusinessSchema = generateMainBusinessSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mainBusinessSchema) }}
      />
      {/* Hero Section - sofort laden (above the fold) */}
      <HeroSection />

      {/* Below-the-fold Sections - lazy loaded */}
      <AdvantagesSection />
      <PartnerSlider />
      <ServicesSection />
      <PromoSection />
      <TestimonialsSection />
      <HomepageFAQSection />
      <ContactSection />
    </>
  );
}