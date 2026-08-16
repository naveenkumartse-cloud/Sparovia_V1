'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { contentConfig } from '@/config/contentConfig';
import { mediaConfig } from '@/config/mediaConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import Image from 'next/image';

const categories = contentConfig.interiors.categories;

/**
 * Maps category id to image source from mediaConfig.
 * When real images are placed in public/images/{kitchens,wardrobes,living}/,
 * update mediaConfig.ts to point to those local paths.
 */
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

/* ─── Desktop Sticky Storytelling ─── */

function DesktopStorytelling() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const triggers = section.querySelectorAll<HTMLDivElement>('[data-story-trigger]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-story-trigger'));
            if (!isNaN(index)) setActiveIndex(index);
          }
        });
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      }
    );

    triggers.forEach((trigger) => observer.observe(trigger));
    return () => observer.disconnect();
  }, []);

  const activeCategory = categories[activeIndex];

  return (
    <div ref={sectionRef} className="hidden lg:block">
      <div className="grid grid-cols-12 gap-8">

        {/* LEFT: Sticky Image (8 columns — ~70% visual) */}
        <div className="col-span-7 relative">
          <div className="sticky top-24" style={{ height: 'calc(100vh - 8rem)' }}>
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface border border-gray-100 shadow-soft-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory.id}
                  initial={shouldReduceMotion ? {} : { opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? {} : { opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={getCategoryImage(activeCategory.id)}
                    alt={activeCategory.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover"
                    priority={activeIndex === 0}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT: Scrolling Content Panels (5 columns — ~30% text) */}
        <div className="col-span-5 relative">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              data-story-trigger={i}
              className="min-h-[70vh] flex items-center"
            >
              <div className="py-16">
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
                <p className="text-sm text-charcoal-700 leading-relaxed mb-8 max-w-sm">
                  {cat.description}
                </p>

                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mb-8" role="tablist" aria-label="Category progress">
                  {categories.map((_, dotIndex) => (
                    <div
                      key={dotIndex}
                      role="tab"
                      aria-selected={dotIndex === i}
                      aria-label={categories[dotIndex].name}
                      className={`rounded-full transition-all duration-500 ${
                        dotIndex === i
                          ? 'w-6 h-2 bg-brand-600'
                          : 'w-2 h-2 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* CTA */}
                <Button href="#contact" variant="outline" size="sm" icon>
                  Get a Quote
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ─── Mobile Storytelling (Vertical Stack) ─── */

function MobileStorytelling() {
  return (
    <div className="lg:hidden flex flex-col gap-12 md:gap-16">
      {categories.map((cat, i) => (
        <FadeIn key={cat.id} direction="up" delay={0.05}>
          <div className="flex flex-col gap-6">
            {/* Large Image */}
            <div className="relative rounded-2xl overflow-hidden bg-surface border border-gray-100 shadow-soft-sm aspect-[4/3]">
              <Image
                src={getCategoryImage(cat.id)}
                alt={cat.name}
                fill
                sizes="100vw"
                className="object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>

            {/* Content Below Image */}
            <div className="px-1">
              {/* Index */}
              <span className="block text-[11px] uppercase tracking-[0.2em] text-brand-600 font-bold mb-2">
                {cat.index}
              </span>

              {/* Title */}
              <h3 className="font-sans text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight mb-2 leading-tight">
                {cat.name}
              </h3>

              {/* Tagline */}
              <p className="text-sm text-muted-500 font-medium italic mb-3">
                {cat.tagline}
              </p>

              {/* Description */}
              <p className="text-sm text-charcoal-700 leading-relaxed mb-5">
                {cat.description}
              </p>

              {/* CTA */}
              <Button href="#contact" variant="outline" size="sm" icon>
                Get a Quote
              </Button>
            </div>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}

/* ─── Main Section ─── */

export default function InteriorStorytellingSection() {
  return (
    <Section id="interiors" background="white" padding="spacious">
      <Container>

        {/* Section Intro */}
        <div className="mb-16 lg:mb-20 max-w-2xl">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
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

        {/* Storytelling Experience */}
        <DesktopStorytelling />
        <MobileStorytelling />

      </Container>
    </Section>
  );
}
