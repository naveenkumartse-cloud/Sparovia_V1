'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { mediaConfig } from '@/config/mediaConfig';
import { Container } from '@/components/ui/Container';
import { Eyebrow, HeroHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ArrowDown } from 'lucide-react';
import Image from 'next/image';

export default function HeroSection() {
  const { hero } = useTemplateContent();
  const heroRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll-driven parallax using Framer Motion
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Image: subtle scale-up and upward shift as user scrolls
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);

  // Content: fade out and shift up as user scrolls past hero
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.55], ['0px', '-36px']);

  // Overlay: very slightly darken as user scrolls to aid next-section reveal
  const overlayOpacity = useTransform(scrollYProgress, [0.4, 1], [0, 0.12]);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-[92vh] lg:min-h-[100dvh] flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Full-bleed Background Image with Scroll-Driven Parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={shouldReduceMotion ? {} : {
          scale: imageScale,
          y: imageY,
        }}
      >
        <Image
          src={hero.heroImage || mediaConfig.hero.primaryImage}
          alt={hero.headline || mediaConfig.hero.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] md:object-center"
        />
      </motion.div>

      {/* Contrast Overlay — Adaptive for viewport size */}
      {/* Desktop (lg+): left-to-right — editorial layout, text on white left, natural architectural image on right */}
      <div className="hidden lg:block absolute inset-0 z-[1] bg-gradient-to-r from-white/95 via-white/85 to-transparent pointer-events-none" />
      {/* Mobile/Tablet: White gradient from top down to ensure dark text at top is fully readable */}
      <div className="lg:hidden absolute inset-0 z-[1] bg-gradient-to-b from-white/95 via-white/85 to-black/15 pointer-events-none" />
      {/* Bottom fade (universal) — smooth visual transition into next section */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />

      {/* Scroll-Driven Darkening Overlay (cinematic exit) */}
      <motion.div
        className="absolute inset-0 z-[2] bg-white pointer-events-none"
        style={shouldReduceMotion ? {} : { opacity: overlayOpacity }}
      />

      {/* Hero Editorial Content */}
      <motion.div
        className="relative z-10 w-full pt-[104px] sm:pt-28 lg:pt-36 pb-12 sm:pb-16"
        style={shouldReduceMotion ? {} : {
          opacity: contentOpacity,
          y: contentY,
        }}
      >
        <Container>
          <div className="max-w-2xl">

            {/* Architectural Live Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#EBDEBA] shadow-soft-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#CE9E34] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-charcoal-900">
                Bespoke Interiors & Precision Glazing • Bengaluru
              </span>
            </div>

            {/* Eyebrow */}
            <div className="mb-2.5 sm:mb-3">
              <Eyebrow icon={false}>
                {hero.eyebrow}
              </Eyebrow>
            </div>

            {/* Headline */}
            <HeroHeading className="text-charcoal-900 mb-3.5 sm:mb-4 tracking-tight">
              {hero.headline}
            </HeroHeading>

            {/* Short Supporting Copy */}
            <Subheading className="mb-6 sm:mb-8 text-charcoal-600 max-w-xl text-base sm:text-lg leading-relaxed">
              {hero.subheadline}
            </Subheading>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8">
              <Button href="#contact" variant="primary" size="lg" icon className="w-full sm:w-auto justify-center shadow-md">
                {hero.primaryCta}
              </Button>

              <Button href="#gallery" variant="outline" size="lg" className="w-full sm:w-auto justify-center bg-white/90 backdrop-blur-xs">
                <span>{hero.secondaryCta}</span>
                <ArrowDown className="w-4 h-4 ml-2 text-gold-500" />
              </Button>
            </div>

            {/* Scroll Cue Indicator */}
            <div className="pt-2">
              <a
                href="#about"
                className="hidden md:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-bold text-charcoal-700 hover:text-[#0044A7] transition-colors focus-ring rounded"
                aria-label="Scroll to discover KVN Interior story"
              >
                <span>Discover Craftsmanship</span>
                <ArrowDown className="w-3.5 h-3.5 text-[#CE9E34] animate-bounce" />
              </a>
            </div>

          </div>
        </Container>
      </motion.div>
    </section>
  );
}
