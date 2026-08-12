import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import BrandIntroSection from '@/components/landing/BrandIntroSection';
import InteriorStorytellingSection from '@/components/landing/InteriorStorytellingSection';
import UpvcSection from '@/components/landing/UpvcSection';
import ProjectGallerySection from '@/components/landing/ProjectGallerySection';
import WhyChooseUsSection from '@/components/landing/WhyChooseUsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import FaqSection from '@/components/landing/FaqSection';
import FinalCtaSection from '@/components/landing/FinalCtaSection';
import ContactSection from '@/components/landing/ContactSection';
import Footer from '@/components/layout/Footer';

export default function Home() {
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
