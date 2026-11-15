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
  const bgImage = hero.heroImage || mediaConfig.hero.primaryImage;
  const ctaLabel = contact.ctaLabel || 'Request Consultation';

  return (
    <Section background="white" padding="default" className="relative overflow-hidden">
      <Container>
        <div className="relative rounded-panel overflow-hidden bg-gradient-to-br from-[#011E75] via-[#01185E] to-[#001247] text-white p-6 sm:p-10 lg:p-14 shadow-2xl border border-[#CE9E34]/40">
          {/* Subtle Background Image Overlay */}
          <div className="absolute inset-0 z-0 opacity-15">
            <Image
              src={bgImage}
              alt="Residential Project View"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <FadeIn direction="up">
              {brandEyebrow && (
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#CE9E34] font-black block mb-3">
                  {brandEyebrow}
                </span>
              )}

              <h2 className="font-sans text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white mb-3.5 sm:mb-4 uppercase leading-[1.1]">
                {contact.heading || "LET'S CREATE YOUR SPACE."}
              </h2>

              <p className="text-sm sm:text-base text-blue-100/90 font-normal leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto">
                {contact.description || 'Schedule an initial consultation with our interior and window specialists to explore possibilities for your home.'}
              </p>

              <div className="flex justify-center">
                <Button href="#contact" variant="primary" size="lg" icon className="bg-[#CE9E34] hover:bg-[#D4A328] text-[#011E75] font-bold border-none shadow-gold-glow transition-all hover:scale-[1.02]">
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
