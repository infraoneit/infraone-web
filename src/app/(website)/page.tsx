import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/sections/HeroSection';
import { 
  generateWebSiteSchema, 
  generateMainBusinessSchema,
  generateOrganizationSchemaExtended,
  generateContactPageLocalBusinessSchema,
  generateHomepageOfferCatalogSchema,
  generateHomepageAggregateRatingSchema,
  generateExternalReviewsSchema,
  generateFAQSchema,
  generateBreadcrumbListSchema,
  generateWebPageSchema,
} from '@/lib/seo/schema';
import { testimonials } from '@/data/testimonials';
import { BASE_URL } from '@/lib/constants';

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

// 4 physische Standorte
const locations = [
  { city: 'Winterthur', street: 'Rudolf-Diesel-Strasse 25', zip: '8404', isMain: true, mapUrl: 'https://maps.app.goo.gl/KZcGeudRfoJSirLA9' },
  { city: 'Schaffhausen', street: 'Solenbergstrasse 35', zip: '8207', isMain: false, mapUrl: 'https://maps.google.com/?q=Solenbergstrasse+35+8207+Schaffhausen' },
  { city: 'Tägerwilen', street: 'Bahnhofstrasse 17', zip: '8274', isMain: false, mapUrl: 'https://maps.google.com/?q=Bahnhofstrasse+17+8274+Tägerwilen' },
  { city: 'Kleinandelfingen', street: 'Einfangstrasse 8', zip: '8451', isMain: false, mapUrl: 'https://maps.google.com/?q=Einfangstrasse+8+8451+Kleinandelfingen' },
];

// Homepage FAQs (aus HomepageFAQSection)
const homepageFaqs = [
  {
    question: 'Welche Leistungen bietet InfraOne an?',
    answer: 'Wir sind Ihr Full-Service-IT-Partner: IT-Support & Managed Services, Cloud-Telefonie (3CX, peoplefone), Netzwerke & Server, Videoüberwachung, Webdesign, Software-Entwicklung, Digital Signage, Gebäudeautomation und Kontrollraum-Lösungen. Alles aus einer Hand.'
  },
  {
    question: 'Für wen sind die Dienstleistungen geeignet?',
    answer: 'Unsere Lösungen richten sich an KMU, Startups, Gewerbebetriebe, Arztpraxen und Privatkunden in Winterthur, Zürich, Schaffhausen, Thurgau, St. Gallen und der gesamten Ostschweiz. Wir betreuen Unternehmen jeder Größe – vom Einzelunternehmen bis zum mittelständischen Betrieb.'
  },
  {
    question: 'Wie schnell können Sie bei IT-Problemen helfen?',
    answer: 'Bei dringenden IT-Problemen sind wir schnell vor Ort oder remote erreichbar. Unser Support-Team reagiert in der Regel innerhalb von 2-4 Stunden. Für kritische Systeme bieten wir auch 24/7-Notfall-Support an.'
  },
  {
    question: 'Was kostet eine Beratung oder ein Erstgespräch?',
    answer: 'Das erste Beratungsgespräch ist bei uns immer kostenlos und unverbindlich. Wir analysieren Ihre Anforderungen, besprechen mögliche Lösungen und erstellen Ihnen ein transparentes Angebot – ohne versteckte Kosten.'
  },
  {
    question: 'Arbeiten Sie auch mit bestehenden IT-Systemen?',
    answer: 'Ja, selbstverständlich. Wir integrieren uns nahtlos in Ihre vorhandene IT-Infrastruktur und arbeiten mit allen gängigen Systemen zusammen. Ob Microsoft, Linux, Cloud-Lösungen oder On-Premise – wir finden die beste Lösung für Ihre Situation.'
  },
  {
    question: 'Wie läuft ein typisches Projekt mit InfraOne ab?',
    answer: 'Ein Projekt startet immer mit einem kostenlosen Erstgespräch. Danach analysieren wir Ihre Anforderungen, erstellen ein detailliertes Angebot und setzen die Lösung professionell um. Nach dem Go-Live stehen wir Ihnen mit Support und Wartung zur Seite.'
  },
];

export default function HomePage() {
  // 1. WebSite Schema
  const websiteSchema = generateWebSiteSchema();
  
  // 2. Organization Schema (erweitert mit Social Media)
  const organizationSchema = generateOrganizationSchemaExtended();
  
  // 3. Main Business Schema (Winterthur HQ als ProfessionalService)
  const mainBusinessSchema = generateMainBusinessSchema();
  
  // 4-7. LocalBusiness Schemas für alle 4 Standorte
  const localBusinessSchemas = locations.map((location) =>
    generateContactPageLocalBusinessSchema(location, location.city.toLowerCase())
  );
  
  // 8. OfferCatalog Schema (Hauptdienstleistungen)
  const offerCatalogSchema = generateHomepageOfferCatalogSchema();
  
  // 9-12. Review Schemas (4 externe Google Reviews)
  const externalReviews = generateExternalReviewsSchema(testimonials);
  
  // 13. AggregateRating Schema
  const aggregateRatingSchema = generateHomepageAggregateRatingSchema(testimonials);
  
  // 14. FAQ Schema
  const faqSchema = generateFAQSchema(homepageFaqs);
  
  // 15. Breadcrumb Schema
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: BASE_URL },
  ]);
  
  // 16. WebPage Schema
  const webPageSchema = generateWebPageSchema(
    BASE_URL,
    'InfraOne IT Solutions - IT-Support, Webdesign & Cloud-Telefonie',
    'Ihr IT-Partner in der Ostschweiz für IT-Support, Webdesign, Cloud-Telefonie, Netzwerke und mehr.'
  );

  return (
    <>
      {/* 1. WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      
      {/* 2. Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      
      {/* 3. Main Business Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mainBusinessSchema) }}
      />
      
      {/* 4-7. LocalBusiness Schemas (4 Standorte) */}
      {localBusinessSchemas.map((schema, index) => (
        <script
          key={`localbusiness-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      
      {/* 8. OfferCatalog Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogSchema) }}
      />
      
      {/* 9-12. External Review Schemas (4 Google Reviews) */}
      {externalReviews.map((review, index) => (
        <script
          key={`review-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            ...review
          }) }}
        />
      ))}
      
      {/* 13. AggregateRating Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
      />
      
      {/* 14. FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      {/* 15. Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* 16. WebPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
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