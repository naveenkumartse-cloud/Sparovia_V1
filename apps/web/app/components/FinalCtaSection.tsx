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
    <Section background="white" padding="default" className="relative bg-[#080C14] text-white overflow-hidden py-16 sm:py-24">
      <Container>
        <div className="relative rounded-2xl overflow-hidden border border-[#CE9E34]/35 shadow-2xl p-8 sm:p-14 lg:p-20 text-center">
          {/* Natural Background Photograph */}
          <div className="absolute inset-0 z-0">
            <Image
              src={bgImage}
              alt="Architectural Building and Interior View"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center brightness-[0.75] contrast-[1.1]"
              quality={90}
            />
          </div>

          {/* Subtle Neutral Scrim for Natural Contrast */}
          <div className="absolute inset-0 z-[1] bg-black/55 backdrop-blur-[2px]" />

          {/* Content */}
          <div className="relative z-10 max-w-2xl mx-auto">
            <FadeIn direction="up">
              {/* Monospaced Live Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#CE9E34]/50 shadow-xl mb-5">
                <span className="w-2 h-2 rounded-full bg-[#CE9E34] animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-white">
                  [ATELIER ENGAGEMENT // BENGALURU STUDIO]
                </span>
              </div>

              {brandEyebrow && (
                <span className="text-xs uppercase tracking-[0.25em] text-[#DFB95C] font-black block mb-2 drop-shadow-sm">
                  {brandEyebrow}
                </span>
              )}

              <h2 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5 uppercase leading-[1.1] drop-shadow-sm">
                {contact.heading || "Ready to Elevate Your Residence?"}
              </h2>

              <p className="text-sm sm:text-base text-gray-200 font-normal leading-relaxed mb-8 max-w-lg mx-auto drop-shadow-xs">
                {contact.description || 'Schedule an initial consultation with our interior and window specialists to explore bespoke possibilities for your home.'}
              </p>

              <div className="flex justify-center">
                <Button
                  href="#contact"
                  variant="primary"
                  size="lg"
                  icon
                  className="bg-[#0044A7] hover:bg-[#00388A] text-white font-bold border border-[#CE9E34] shadow-[0_0_24px_rgba(206,158,52,0.4)] transition-all hover:scale-[1.02]"
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
