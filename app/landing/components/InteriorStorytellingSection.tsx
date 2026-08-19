'use client';

import { useReducedMotion } from 'framer-motion';
import { contentConfig } from '@/config/contentConfig';
import { mediaConfig } from '@/config/mediaConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import Image from 'next/image';

const categories = contentConfig.interiors.categories;

function getCategoryImage(id: string): string {
  switch (id) {
    case 'modular-kitchens':
      return mediaConfig.interiors.kitchens;
    case 'wardrobes':
      return mediaConfig.interiors.wardrobes;
    case 'living-units':
      return mediaConfig.interiors.living;
    default:
      return mediaConfig.interiors.kitchens;
  }
}

function AlternatingStorytelling() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      {categories.map((cat, i) => {
        const isEven = i % 2 === 0; // Even: Image Left, Odd: Image Right on desktop
        
        return (
          <div 
            key={cat.id} 
            className={`flex flex-col lg:flex-row gap-8 lg:gap-16 items-center ${
              !isEven ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Visual Column */}
            <div className="w-full lg:w-3/5">
              <FadeIn direction={isEven ? "right" : "left"} delay={0.1}>
                <div className="relative w-full rounded-2xl overflow-hidden bg-surface border border-gray-100 shadow-soft-sm aspect-[4/3] sm:aspect-[16/10]">
                  <Image
                    src={getCategoryImage(cat.id)}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover object-center"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    priority={i === 0}
                  />
                </div>
              </FadeIn>
            </div>

            {/* Content Column */}
            <div className="w-full lg:w-2/5 flex flex-col justify-center px-1 sm:px-4 lg:px-0">
              <FadeIn direction={isEven ? "left" : "right"} delay={0.2}>
                {/* Index Number */}
                <span className="block text-[11px] uppercase tracking-[0.2em] text-brand-600 font-bold mb-3">
                  {cat.index}
                </span>

                {/* Category Title */}
                <h3 className="font-sans text-3xl sm:text-4xl font-bold text-charcoal-900 tracking-tight mb-3 leading-tight">
                  {cat.name}
                </h3>

                {/* Tagline */}
                <p className="text-base text-muted-500 font-medium italic mb-5">
                  {cat.tagline}
                </p>

                {/* Description */}
                <p className="text-sm sm:text-base text-charcoal-700 leading-relaxed mb-8 max-w-sm">
                  {cat.description}
                </p>

                {/* CTA */}
                <Button href="#contact" variant="outline" size="md" icon>
                  Get a Quote
                </Button>
              </FadeIn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InteriorStorytellingSection() {
  return (
    <Section id="interiors" background="white" padding="spacious">
      <Container>

        {/* Section Intro */}
        <div className="mb-16 lg:mb-24 max-w-2xl mx-auto text-center lg:text-left lg:mx-0">
          <FadeIn direction="up">
            <Eyebrow icon={false} className="lg:justify-start justify-center">
              {contentConfig.interiors.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading>
              {contentConfig.interiors.heading}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <Subheading>
              {contentConfig.interiors.description}
            </Subheading>
          </FadeIn>
        </div>

        {/* Alternating Storytelling Experience */}
        <AlternatingStorytelling />

      </Container>
    </Section>
  );
}
