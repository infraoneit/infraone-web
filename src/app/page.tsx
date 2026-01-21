import { HeroSection } from '@/components/sections/HeroSection';
import { AdvantagesSection } from '@/components/sections/AdvantagesSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { PartnerSlider } from '@/components/sections/PartnerSlider';
import { PromoSection } from '@/components/sections/PromoSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { ContactSection } from '@/components/sections/ContactSection';

import { generateWebSiteSchema, generateMainBusinessSchema } from '@/lib/seo/schema';

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
      {/* Hero Section */}
      <HeroSection />

      {/* Why InfraOne */}
      <AdvantagesSection />

      {/* Partner Slider */}
      <PartnerSlider />

      {/* Services Grid */}
      <ServicesSection />

      {/* Promo Banner */}
      <PromoSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Contact */}
      <ContactSection />
    </>
  );
}
