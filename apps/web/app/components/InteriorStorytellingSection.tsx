'use client';

import { useReducedMotion } from 'framer-motion';
import { mediaConfig } from '@/config/mediaConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import Image from 'next/image';

function getCategoryImage(cat: any): string {
  if (cat?.image) return cat.image;
  if (cat?.src) return cat.src;
  const id = cat?.id || '';
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

interface CategoryItem {
  id?: string;
  index?: string;
  name?: string;
  title?: string;
  tagline?: string;
  description?: string;
  image?: string;
  src?: string;
  cta?: string;
  ctaLabel?: string;
}

function AlternatingStorytelling({ categories }: { categories: CategoryItem[] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      {categories.map((cat, i) => {
        const isEven = i % 2 === 0; // Even: Image Left, Odd: Image Right on desktop
        const displayName = cat.name || cat.title || 'Interior Solution';
        const displayIndex = cat.index || String(i + 1).padStart(2, '0');
        const displayCta = cat.cta || cat.ctaLabel || 'Get a Quote';
        
        return (
          <div 
            key={cat.id || i} 
            className={`flex flex-col lg:flex-row gap-8 lg:gap-16 items-center ${
              !isEven ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Visual Column */}
            <div className="w-full lg:w-3/5">
              <FadeIn direction={isEven ? "right" : "left"} delay={0.1}>
                <div className="relative w-full rounded-2xl overflow-hidden bg-surface border border-gray-100 shadow-soft-sm aspect-[4/3] sm:aspect-[16/10]">
                  <Image
                    src={getCategoryImage(cat)}
                    alt={displayName}
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
                  {displayIndex}
                </span>

                {/* Category Title */}
                <h3 className="font-sans text-3xl sm:text-4xl font-bold text-charcoal-900 tracking-tight mb-3 leading-tight">
                  {displayName}
                </h3>

                {/* Tagline */}
                {cat.tagline && (
                  <p className="text-base text-muted-500 font-medium italic mb-5">
                    {cat.tagline}
                  </p>
                )}

                {/* Description */}
                <p className="text-sm sm:text-base text-charcoal-700 leading-relaxed mb-8 max-w-sm">
                  {cat.description}
                </p>

                {/* CTA */}
                <Button href="#contact" variant="outline" size="md" icon>
                  {displayCta}
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
  const { services } = useTemplateContent();
  const categories = services.categories || [];

  return (
    <Section id="interiors" background="white" padding="spacious">
      <Container>

        {/* Section Intro */}
        <div className="mb-16 lg:mb-24 max-w-2xl mx-auto text-center lg:text-left lg:mx-0">
          <FadeIn direction="up">
            <Eyebrow icon={false} className="lg:justify-start justify-center">
              {services.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading>
              {services.heading}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <Subheading>
              {services.description}
            </Subheading>
          </FadeIn>
        </div>

        {/* Alternating Storytelling Experience */}
        {categories.length > 0 && <AlternatingStorytelling categories={categories} />}

      </Container>
    </Section>
  );
}
