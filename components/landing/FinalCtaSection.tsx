'use client';

import { siteConfig } from '@/config/siteConfig';
import { mediaConfig } from '@/config/mediaConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import Image from 'next/image';

export default function FinalCtaSection() {
  return (
    <Section background="white" padding="spacious" className="relative overflow-hidden">
      <Container>
        <div className="relative rounded-3xl overflow-hidden bg-charcoal-900 text-white p-10 sm:p-16 lg:p-20 shadow-2xl">
          {/* Subtle Background Image Overlay */}
          <div className="absolute inset-0 z-0 opacity-20">
            <Image
              src={mediaConfig.hero.primaryImage}
              alt="Sparovia Residential Interior Project"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <FadeIn direction="up">
              <span className="text-[11px] uppercase tracking-[0.25em] text-brand-300 font-bold block mb-4">
                SPAROVIA DIGITAL SHOWROOM
              </span>

              <h2 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 uppercase leading-[1.1]">
                LET&apos;S CREATE YOUR SPACE.
              </h2>

              <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed mb-10 max-w-lg mx-auto">
                Transform your home with bespoke modular kitchens, luxury wardrobes, living systems, and engineered uPVC window solutions.
              </p>

              <div className="flex justify-center">
                <Button href="#contact" variant="primary" size="lg" icon>
                  {siteConfig.cta.primary}
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </Container>
    </Section>
  );
}
