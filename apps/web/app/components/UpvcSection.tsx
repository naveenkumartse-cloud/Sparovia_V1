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
import { ChevronLeft, ChevronRight, ShieldCheck, VolumeX, SunMedium, CloudRain } from 'lucide-react';

const upvcGallery = mediaConfig.upvc.gallery;

/* ─── Large Architectural Hero Image with Double-Bezel & Scroll Parallax ─── */

function ArchitecturalHero() {
  const imageRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ['start end', 'end start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], ['-2%', '2%']);

  return (
    <FadeIn direction="up" delay={0.2} duration={0.8}>
      <div className="double-bezel">
        <div
          ref={imageRef}
          className="double-bezel-inner relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
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

          {/* Architectural Badge Overlay */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#EBDEBA] shadow-soft-sm">
              <span className="w-2 h-2 rounded-full bg-[#CE9E34]" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-bold text-charcoal-900">
                Acoustic Attenuation (up to 40dB) • Multi-Point Security
              </span>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

/* ─── Architectural Engineering Specification Cards ─── */

interface ThemeItem {
  label: string;
  description: string;
}

const SPEC_ICONS = [VolumeX, SunMedium, ShieldCheck, CloudRain];

function ThemeLabels({ themes }: { themes: ThemeItem[] }) {
  return (
    <FadeIn direction="up" delay={0.3}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {themes.map((theme, i) => {
          const Icon = SPEC_ICONS[i % SPEC_ICONS.length];
          return (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-[8px] bg-white border border-[#EBDEBA] shadow-soft-sm hover:border-[#CE9E34] transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#FAF8F2] border border-[#EBDEBA] flex items-center justify-center mb-3 text-[#CE9E34] group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <span className="block text-[11px] uppercase tracking-[0.15em] text-[#CE9E34] font-black mb-1.5">
                {theme.label}
              </span>
              <p className="text-xs text-charcoal-700 leading-relaxed font-normal">
                {theme.description}
              </p>
            </div>
          );
        })}
      </div>
    </FadeIn>
  );
}

/* ─── Window & Door Installations Carousel with Top-Right Controls ─── */

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
      {/* Section Sub-header with Top-Right Circular Navigation Controls */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#CE9E34] font-black">
            Fenestration Systems
          </span>
          <p className="text-xs sm:text-sm text-charcoal-700 font-semibold mt-0.5">
            Precision engineered uPVC sliding &amp; casement installations
          </p>
        </div>

        {/* Compact Circular Navy-Blue Controls in Top-Right Corner */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous installations"
            aria-controls="installation-carousel-track"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0044A7] text-white flex items-center justify-center border border-[#CE9E34]/40 shadow-sm transition-all duration-200 hover:bg-[#00388A] hover:border-[#CE9E34] hover:shadow-[0_0_12px_rgba(206,158,52,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CE9E34] focus-visible:ring-offset-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#0044A7] disabled:hover:border-[#CE9E34]/40 disabled:hover:shadow-none disabled:active:scale-100 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next installations"
            aria-controls="installation-carousel-track"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0044A7] text-white flex items-center justify-center border border-[#CE9E34]/40 shadow-sm transition-all duration-200 hover:bg-[#00388A] hover:border-[#CE9E34] hover:shadow-[0_0_12px_rgba(206,158,52,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CE9E34] focus-visible:ring-offset-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#0044A7] disabled:hover:border-[#CE9E34]/40 disabled:hover:shadow-none disabled:active:scale-100 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track with Double-Bezel Frames */}
      <div
        ref={scrollRef}
        id="installation-carousel-track"
        role="region"
        aria-label="Window and Door Installations Carousel"
        tabIndex={0}
        className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0044A7] rounded-xl scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {upvcGallery.map((item, i) => (
          <div
            key={i}
            data-carousel-item
            className="flex-shrink-0 snap-start group select-none w-[78vw] max-w-[320px] sm:w-[calc(50%-12px)] sm:max-w-[360px] lg:w-[calc(33.333%-16px)] lg:max-w-[420px]"
          >
            <div className="double-bezel">
              <div className="double-bezel-inner aspect-[4/3] relative">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="mt-2.5 px-1 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.12em] text-charcoal-800 font-bold group-hover:text-[#0044A7] transition-colors">
                {item.label}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#CE9E34] font-black">
                uPVC
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Section ─── */

export default function UpvcSection() {
  const { upvc } = useTemplateContent();
  const themes = upvc.themes || [];

  return (
    <Section id="upvc" background="surface" padding="default">
      <Container>

        {/* Section Intro */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
              {upvc.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading className="tracking-tight text-3xl sm:text-4xl">
              {upvc.heading}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <Subheading className="text-charcoal-600 text-base sm:text-lg">
              {upvc.description}
            </Subheading>
          </FadeIn>
        </div>

        {/* Large Architectural Hero Image */}
        <ArchitecturalHero />

        {/* Engineering Specification Cards */}
        <div className="mt-8 sm:mt-10 mb-10 sm:mb-14">
          <ThemeLabels themes={themes} />
        </div>

      </Container>

      {/* Horizontal Window Showcase with Carousel Navigation */}
      <Container size="wide">
        <FadeIn direction="up" delay={0.1}>
          <InstallationCarousel />
        </FadeIn>

        {/* Glazing Consultation CTA */}
        <FadeIn direction="up" delay={0.2}>
          <div className="mt-8 sm:mt-10 flex justify-center md:justify-start">
            <Button href="#contact" variant="primary" size="md" icon>
              Request Glazing Estimate
            </Button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
