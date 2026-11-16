'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { mediaConfig } from '@/config/mediaConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import Upvc3DStudio from './Upvc3DStudio';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShieldCheck, VolumeX, SunMedium, CloudRain, Sparkles } from 'lucide-react';

const upvcGallery = mediaConfig.upvc.gallery;

interface ThemeItem {
  label: string;
  description: string;
}

const SPEC_ICONS = [VolumeX, SunMedium, ShieldCheck, CloudRain];

function ThemeLabels({ themes }: { themes: ThemeItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {themes.map((theme, i) => {
        const Icon = SPEC_ICONS[i % SPEC_ICONS.length];
        return (
          <div
            key={i}
            className="p-5 rounded-xl bg-[#0E1422] border border-white/10 hover:border-[#CE9E34] transition-all duration-300 group shadow-lg"
          >
            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mb-3 text-[#CE9E34] group-hover:scale-110 transition-transform">
              <Icon className="w-4 h-4" />
            </div>
            <span className="block text-xs font-mono uppercase tracking-[0.15em] text-[#CE9E34] font-bold mb-1.5">
              {theme.label}
            </span>
            <p className="text-xs text-gray-300 leading-relaxed font-normal">
              {theme.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

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
      {/* Sub-header with Circular Controls */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#CE9E34] font-bold">
            ARCHITECTURAL INSTALLATIONS
          </span>
          <p className="text-xs sm:text-sm text-gray-300 font-medium mt-0.5">
            Sliding door systems, casement windows &amp; panoramic structural glazing
          </p>
        </div>

        {/* Circular Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous installations"
            aria-controls="installation-carousel-track"
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm transition-all hover:bg-[#0044A7] hover:border-[#CE9E34] disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next installations"
            aria-controls="installation-carousel-track"
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm transition-all hover:bg-[#0044A7] hover:border-[#CE9E34] disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        id="installation-carousel-track"
        role="region"
        aria-label="Window and Door Installations Carousel"
        tabIndex={0}
        className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CE9E34] rounded-xl scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {upvcGallery.map((item, i) => (
          <div
            key={i}
            data-carousel-item
            className="flex-shrink-0 snap-start group select-none w-[80vw] max-w-[320px] sm:w-[calc(50%-12px)] sm:max-w-[360px] lg:w-[calc(33.333%-16px)] lg:max-w-[420px]"
          >
            <div className="relative rounded-xl overflow-hidden bg-[#0E1422] border border-white/15 aspect-[4/3] group-hover:border-[#CE9E34] transition-all">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white font-bold">
                  {item.label}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#CE9E34] font-bold">
                  uPVC SYSTEM
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UpvcSection() {
  const { upvc } = useTemplateContent();
  const themes = upvc.themes || [];

  return (
    <Section id="upvc" background="surface" padding="default" className="relative bg-[#080C14] text-white overflow-hidden py-20 sm:py-28">
      {/* Background architectural gridlines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <Container>

        {/* Section Intro */}
        <div className="max-w-3xl mb-10 sm:mb-14">
          <FadeIn direction="up">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#CE9E34] font-bold block mb-2">
              [CHAPTER 03 // GERMAN ARCHITECTURAL FENESTRATION]
            </span>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <Eyebrow icon={false} className="text-[#DFB95C]">{upvc.eyebrow || 'ARCHITECTURAL SYSTEMS'}</Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <SectionHeading className="tracking-tight text-3xl sm:text-4xl lg:text-5xl text-white">
              {upvc.heading || 'Engineered for Light & Modern Living'}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <Subheading className="text-gray-300 text-base sm:text-lg">
              {upvc.description || 'Precision engineered German uPVC window and door systems designed for sound insulation, thermal weather barriers, and contemporary architectural aesthetics.'}
            </Subheading>
          </FadeIn>
        </div>

        {/* Interactive 3D Architectural Fenestration Configurator */}
        <FadeIn direction="up" delay={0.25} className="mb-12 sm:mb-16">
          <Upvc3DStudio />
        </FadeIn>

        {/* Engineering Specification Cards */}
        <div className="mb-14 sm:mb-18">
          <ThemeLabels themes={themes} />
        </div>

        {/* Horizontal Window Showcase with Carousel Navigation */}
        <FadeIn direction="up" delay={0.1} className="mb-10">
          <InstallationCarousel />
        </FadeIn>

        {/* Glazing Consultation CTA */}
        <FadeIn direction="up" delay={0.2}>
          <div className="flex justify-center md:justify-start">
            <Button
              href="#contact"
              variant="primary"
              size="lg"
              icon
              className="bg-[#0044A7] hover:bg-[#00388A] text-white border border-[#CE9E34] shadow-[0_0_20px_rgba(206,158,52,0.3)]"
            >
              Request Glazing Estimate
            </Button>
          </div>
        </FadeIn>

      </Container>
    </Section>
  );
}
