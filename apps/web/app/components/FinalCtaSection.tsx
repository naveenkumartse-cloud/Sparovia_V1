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
    <Section background="white" padding="spacious" className="relative overflow-hidden">
      <Container>
        <div className="relative rounded-panel overflow-hidden bg-[#0A192F] text-white p-6 sm:p-12 lg:p-20 shadow-2xl border border-[#C6A052]/30">
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
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#C6A052] font-black block mb-4">
                  {brandEyebrow}
                </span>
              )}

              <h2 className="font-sans text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white mb-6 uppercase leading-[1.1]">
                {contact.heading || "LET'S CREATE YOUR SPACE."}
              </h2>

              <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed mb-10 max-w-lg mx-auto">
                {contact.description || 'Schedule an initial consultation with our interior and window specialists to explore possibilities for your home.'}
              </p>

              <div className="flex justify-center">
                <Button href="#contact" variant="primary" size="lg" icon className="bg-[#C6A052] hover:bg-[#B89047] text-[#0A192F] font-bold border-none shadow-gold-glow">
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
