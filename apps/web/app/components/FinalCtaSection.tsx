'use client';

import { mediaConfig } from '@/config/mediaConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import Image from 'next/image';

export default function FinalCtaSection() {
  const { contact, hero, website } = useTemplateContent();

  const brandEyebrow = website?.name ? website.name.toUpperCase() : (contact.eyebrow || 'KVN INTERIOR');
  const bgImage = (mediaConfig as any).finalCta?.bgImage || hero.heroImage || mediaConfig.hero.primaryImage;
  const ctaLabel = contact.ctaLabel || 'Request Consultation';

  return (
    <Section background="white" padding="default" className="relative overflow-hidden">
      <Container>
        <div className="relative rounded-panel overflow-hidden shadow-xl border border-gray-200/90 p-6 sm:p-10 lg:p-14">
          {/* Natural Background Photograph — Zero Blue Filters, Zero Artificial Color Grading */}
          <div className="absolute inset-0 z-0">
            <Image
              src={bgImage}
              alt="Architectural Building and Interior View"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center"
              quality={90}
            />
          </div>

          {/* Subtle Neutral Dark Scrim — Preserves 100% of Natural Building Colors & Architectural Details while Ensuring Text Readability */}
          <div className="absolute inset-0 z-[1] bg-black/40" />

          {/* Content */}
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <FadeIn direction="up">
              {brandEyebrow && (
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#CE9E34] font-black block mb-3 drop-shadow-sm">
                  {brandEyebrow}
                </span>
              )}

              <h2 className="font-sans text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3.5 sm:mb-4 uppercase leading-[1.15] drop-shadow-sm">
                {contact.heading || "LET'S DISCUSS YOUR PROJECT"}
              </h2>

              <p className="text-sm sm:text-base text-white/95 font-normal leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto drop-shadow-xs">
                {contact.description || 'Schedule an initial consultation with our interior and window specialists to explore possibilities for your home.'}
              </p>

              <div className="flex justify-center">
                <Button
                  href="#contact"
                  variant="primary"
                  size="lg"
                  icon
                  className="bg-[#0044A7] hover:bg-[#00388A] text-white font-bold border border-[#0044A7] hover:border-[#CE9E34] shadow-md transition-all hover:scale-[1.02]"
                >
                  {ctaLabel}
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </Container>
    </Section>
  );
}
