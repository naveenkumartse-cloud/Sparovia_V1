'use client';

import { useWebsiteContent } from '@/components/providers/WebsiteContentProvider';
import PublicWebsiteSkeleton from '@/components/ui/PublicWebsiteSkeleton';
import PublicWebsiteError from '@/components/ui/PublicWebsiteError';
import PublicWebsiteEmpty from '@/components/ui/PublicWebsiteEmpty';

import Navbar from '@/components/layout/Navbar';
import HeroSection from './components/HeroSection';
import BrandIntroSection from './components/BrandIntroSection';
import InteriorStorytellingSection from './components/InteriorStorytellingSection';
import UpvcSection from './components/UpvcSection';
import ProjectGallerySection from './components/ProjectGallerySection';
import WhyChooseUsSection from './components/WhyChooseUsSection';
import TestimonialsSection from './components/TestimonialsSection';
import FaqSection from './components/FaqSection';
import FinalCtaSection from './components/FinalCtaSection';
import ContactSection from './components/ContactSection';
import Footer from '@/components/layout/Footer';

export default function Home() {
  const { website, sections, isLoading, error, refresh } = useWebsiteContent();

  // 1. Initial Loading State: Display branded skeleton matching the page layout
  if (isLoading) {
    return <PublicWebsiteSkeleton />;
  }

  // 2. Error State: Display clean public error card with retry action
  if (error && !website && Object.keys(sections).length === 0) {
    return <PublicWebsiteError onRetry={refresh} />;
  }

  // 3. No Published Content State: Display intentional clean empty/setup state
  const hasPublishedSections = Object.keys(sections).length > 0;
  if (!hasPublishedSections && !website) {
    return <PublicWebsiteEmpty />;
  }

  if (website && !hasPublishedSections) {
    return <PublicWebsiteEmpty businessName={website.name} />;
  }

  // 4. Success State: Render dynamic published website sections
  return (
    <main className="min-h-screen bg-white text-charcoal-900 relative">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Cinematic Hero */}
      <HeroSection />

      {/* 3. Brand / Introduction */}
      <BrandIntroSection />

      {/* 4. Interior Storytelling (Modular Kitchens, Wardrobes, Living / TV Units) */}
      <InteriorStorytellingSection />

      {/* 5. uPVC Windows Experience */}
      <UpvcSection />

      {/* 6. Project Gallery */}
      <ProjectGallerySection />

      {/* 7. Why Choose Us */}
      <WhyChooseUsSection />

      {/* 8. Testimonials */}
      <TestimonialsSection />

      {/* 9. FAQ */}
      <FaqSection />

      {/* 10. Final CTA */}
      <FinalCtaSection />

      {/* 11. Contact */}
      <ContactSection />

      {/* 12. Footer */}
      <Footer />
    </main>
  );
}
