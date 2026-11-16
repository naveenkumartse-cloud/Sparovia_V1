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

const CATEGORY_SPECS: Record<string, string[]> = {
  'modular-kitchens': ['BWR Marine Grade Ply', 'Hydraulic Soft-Close', 'Quartz Countertops'],
  'wardrobes': ['Floor-to-Ceiling Systems', 'Tinted Glass & LED', 'Modular Organizers'],
  'living-units': ['Acoustic Slat Paneling', 'Concealed Cable Hub', 'Floating Precision Fit'],
};

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
    <div className="flex flex-col gap-12 sm:gap-20">
      {categories.map((cat, i) => {
        const isEven = i % 2 === 0; // Even: Image Left, Odd: Image Right on desktop
        const displayName = cat.name || cat.title || 'Interior Solution';
        const displayIndex = cat.index || String(i + 1).padStart(2, '0');
        const displayCta = cat.cta || cat.ctaLabel || 'Request Design Consultation';
        const specs = CATEGORY_SPECS[cat.id || ''] || CATEGORY_SPECS['modular-kitchens'];
        
        return (
          <div 
            key={cat.id || i} 
            className={`flex flex-col lg:flex-row gap-8 lg:gap-14 items-center ${
              !isEven ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Visual Column — Double-Bezel Architectural Frame */}
            <div className="w-full lg:w-7/12">
              <FadeIn direction={isEven ? "right" : "left"} delay={0.1}>
                <div className="double-bezel">
                  <div className="double-bezel-inner group aspect-[4/3] sm:aspect-[16/10] relative">
                    <Image
                      src={getCategoryImage(cat)}
                      alt={displayName}
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover object-center transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      priority={i === 0}
                    />
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Content Column */}
            <div className="w-full lg:w-5/12 flex flex-col justify-center px-1 sm:px-4 lg:px-0">
              <FadeIn direction={isEven ? "left" : "right"} delay={0.2}>
                
                {/* Index Number & Subtle Gold Rule */}
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#CE9E34] font-black">
                    {displayIndex} / {String(categories.length).padStart(2, '0')}
                  </span>
                  <div className="h-[1px] w-8 bg-[#EBDEBA]" />
                </div>

                {/* Category Title */}
                <h3 className="font-sans text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight mb-2 leading-tight">
                  {displayName}
                </h3>

                {/* Tagline */}
                {cat.tagline && (
                  <p className="text-xs sm:text-sm text-charcoal-600 font-semibold mb-3">
                    {cat.tagline}
                  </p>
                )}

                {/* Description */}
                <p className="text-sm sm:text-base text-charcoal-700 leading-relaxed mb-5 max-w-md">
                  {cat.description}
                </p>

                {/* Architectural Spec Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {specs.map((spec, specIdx) => (
                    <span
                      key={specIdx}
                      className="text-[10px] sm:text-[11px] font-semibold text-charcoal-700 bg-[#FAF8F2] border border-[#EBDEBA] px-2.5 py-1 rounded-[4px]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div>
                  <Button href="#contact" variant="primary" size="md" icon>
                    {displayCta}
                  </Button>
                </div>

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
    <Section id="interiors" background="white" padding="default">
      <Container>

        {/* Section Intro */}
        <div className="mb-10 sm:mb-14 max-w-2xl mx-auto text-center lg:text-left lg:mx-0">
          <FadeIn direction="up">
            <Eyebrow icon={false} className="lg:justify-start justify-center">
              {services.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading className="tracking-tight text-3xl sm:text-4xl">
              {services.heading}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <Subheading className="text-charcoal-600 text-base sm:text-lg">
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
