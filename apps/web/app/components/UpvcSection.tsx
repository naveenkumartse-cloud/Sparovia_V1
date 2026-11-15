'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { mediaConfig } from '@/config/mediaConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const upvcGallery = mediaConfig.upvc.gallery;

/* ─── Large Architectural Hero Image with Scroll Parallax ─── */

function ArchitecturalHero() {
  const imageRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ['start end', 'end start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.04, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], ['-2%', '2%']);

  return (
    <FadeIn direction="up" delay={0.2} duration={0.8}>
      <div
        ref={imageRef}
        className="relative w-full rounded-panel overflow-hidden bg-surface border border-gray-100 shadow-soft-sm aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
      >
        <motion.div
          className="absolute inset-0"
          style={shouldReduceMotion ? {} : {
            scale: imageScale,
            y: imageY,
          }}
        >
          <Image
            src={mediaConfig.upvc.primaryImage}
            alt={mediaConfig.upvc.primaryAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
      </div>
    </FadeIn>
  );
}

/* ─── Design Theme Labels ─── */

interface ThemeItem {
  label: string;
  description: string;
}

function ThemeLabels({ themes }: { themes: ThemeItem[] }) {
  return (
    <FadeIn direction="up" delay={0.3}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {themes.map((theme, i) => (
          <div key={i} className="text-center md:text-left">
            <span className="block text-[11px] uppercase tracking-[0.15em] text-[#CE9E34] font-black mb-1.5">
              {theme.label}
            </span>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              {theme.description}
            </p>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}

/* ─── Window & Door Installations Carousel with Circular Controls ─── */

function InstallationCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScrollState();
    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState);
    return () => {
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-carousel-item]');
    const scrollDelta = card ? card.offsetWidth + 24 : el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollDelta : scrollDelta,
      behavior: 'smooth',
    });
  };

  return (
    <div className="w-full">
      {/* Section Sub-header with Navigation Controls */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#CE9E34] font-black">
            Window &amp; Door Installations
          </span>
          <p className="text-xs text-charcoal-600 mt-1">
            Precision engineered uPVC architectural systems
          </p>
        </div>

        {/* Circular Navigation Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous installations"
            aria-controls="installation-carousel-track"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#011E75] text-white flex items-center justify-center border border-[#CE9E34]/40 shadow-md transition-all duration-200 hover:bg-[#022899] hover:border-[#CE9E34] hover:shadow-[0_0_14px_rgba(206,158,52,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CE9E34] focus-visible:ring-offset-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#011E75] disabled:hover:border-[#CE9E34]/40 disabled:hover:shadow-none disabled:active:scale-100"
          >
            <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next installations"
            aria-controls="installation-carousel-track"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#011E75] text-white flex items-center justify-center border border-[#CE9E34]/40 shadow-md transition-all duration-200 hover:bg-[#022899] hover:border-[#CE9E34] hover:shadow-[0_0_14px_rgba(206,158,52,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CE9E34] focus-visible:ring-offset-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#011E75] disabled:hover:border-[#CE9E34]/40 disabled:hover:shadow-none disabled:active:scale-100"
          >
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Relative Carousel Track Container with Side Floating Arrows */}
      <div className="relative group/carousel">
        {/* Floating Left Arrow (Flanking cards on screens >= 640px) */}
        <div className="hidden sm:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous installations"
            aria-controls="installation-carousel-track"
            className="pointer-events-auto w-12 h-12 rounded-full bg-[#011E75] text-white flex items-center justify-center border border-[#CE9E34]/50 shadow-xl transition-all duration-200 hover:bg-[#022899] hover:border-[#CE9E34] hover:scale-105 hover:shadow-[0_0_16px_rgba(206,158,52,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CE9E34] focus-visible:ring-offset-2 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Floating Right Arrow (Flanking cards on screens >= 640px) */}
        <div className="hidden sm:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next installations"
            aria-controls="installation-carousel-track"
            className="pointer-events-auto w-12 h-12 rounded-full bg-[#011E75] text-white flex items-center justify-center border border-[#CE9E34]/50 shadow-xl transition-all duration-200 hover:bg-[#022899] hover:border-[#CE9E34] hover:scale-105 hover:shadow-[0_0_16px_rgba(206,158,52,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CE9E34] focus-visible:ring-offset-2 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronRight className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollRef}
          id="installation-carousel-track"
          role="region"
          aria-label="Window and Door Installations Carousel"
          tabIndex={0}
          className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#011E75] rounded-xl scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {upvcGallery.map((item, i) => (
            <div
              key={i}
              data-carousel-item
              className="flex-shrink-0 snap-start group select-none w-[78vw] max-w-[320px] sm:w-[calc(50%-12px)] sm:max-w-[360px] lg:w-[calc(33.333%-16px)] lg:max-w-[420px]"
            >
              <div className="relative rounded-panel overflow-hidden bg-surface border border-gray-100 shadow-soft-sm aspect-[4/3]">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <span className="block mt-3 text-[11px] uppercase tracking-[0.12em] text-charcoal-700 font-semibold group-hover:text-[#CE9E34] transition-colors">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Section ─── */

export default function UpvcSection() {
  const { upvc } = useTemplateContent();
  const themes = upvc.themes || [];

  return (
    <Section id="upvc" background="surface" padding="spacious">
      <Container>

        {/* Section Intro */}
        <div className="max-w-2xl mb-12 lg:mb-16">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
              {upvc.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading>
              {upvc.heading}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <Subheading>
              {upvc.description}
            </Subheading>
          </FadeIn>
        </div>

        {/* Large Architectural Image */}
        <ArchitecturalHero />

        {/* Theme Labels */}
        <div className="mt-12 lg:mt-16 mb-16 lg:mb-20">
          <ThemeLabels themes={themes} />
        </div>

      </Container>

      {/* Horizontal Window Showcase with Carousel Navigation */}
      <Container size="wide">
        <FadeIn direction="up" delay={0.1}>
          <InstallationCarousel />
        </FadeIn>

        {/* Subtle CTA */}
        <FadeIn direction="up" delay={0.2}>
          <div className="mt-12 flex justify-center md:justify-start">
            <Button href="#contact" variant="outline" size="md" icon>
              Get a Quote
            </Button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
