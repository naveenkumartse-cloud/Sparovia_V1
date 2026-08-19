'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { siteConfig } from '@/config/siteConfig';
import { contentConfig } from '@/config/contentConfig';
import { mediaConfig } from '@/config/mediaConfig';
import { Container } from '@/components/ui/Container';
import { Eyebrow, HeroHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import { ArrowDown } from 'lucide-react';
import Image from 'next/image';

export default function HeroSection() {
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
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], ['0px', '-40px']);

  // Overlay: very slightly darken as user scrolls to aid next-section reveal
  const overlayOpacity = useTransform(scrollYProgress, [0.4, 1], [0, 0.15]);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-[92vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-white"
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
          src={mediaConfig.hero.primaryImage}
          alt={mediaConfig.hero.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      {/* Contrast Overlay — Adaptive for viewport size */}
      {/* Desktop (lg+): left-to-right — editorial layout, text on white left, image on right */}
      <div className="hidden lg:block absolute inset-0 z-[1] bg-gradient-to-r from-white via-white/80 to-white/25 pointer-events-none" />
      {/* Mobile/Tablet: uniform semi-white tint — image visible as backdrop, text readable */}
      <div className="lg:hidden absolute inset-0 z-[1] bg-white/55 pointer-events-none" />
      {/* Bottom fade (universal) — smooth visual transition into next section */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />

      {/* Scroll-Driven Darkening Overlay (cinematic exit) */}
      <motion.div
        className="absolute inset-0 z-[2] bg-white pointer-events-none"
        style={shouldReduceMotion ? {} : { opacity: overlayOpacity }}
      />

      {/* Hero Editorial Content */}
      <motion.div
        className="relative z-10 w-full pt-20 sm:pt-24 lg:pt-28 pb-16 force-visible-mobile"
        style={shouldReduceMotion ? {} : {
          opacity: contentOpacity,
          y: contentY,
        }}
      >
        <Container>
          <div className="max-w-2xl">

            {/* Eyebrow */}
            <FadeIn direction="up" delay={0.15} duration={0.7}>
              <Eyebrow icon={false} className="mb-5">
                {contentConfig.hero.eyebrow}
              </Eyebrow>
            </FadeIn>

            {/* Headline */}
            <FadeIn direction="up" delay={0.3} duration={0.8}>
              <HeroHeading className="text-charcoal-900 mb-5">
                {contentConfig.hero.headline}
              </HeroHeading>
            </FadeIn>

            {/* Short Supporting Copy */}
            <FadeIn direction="up" delay={0.45} duration={0.7}>
              <Subheading className="mb-10 text-charcoal-600 max-w-xl">
                {contentConfig.hero.subheadline}
              </Subheading>
            </FadeIn>

            {/* CTAs */}
            <FadeIn direction="up" delay={0.6} duration={0.7}>
              <div className="flex flex-wrap items-center gap-4">
                <Button href="#contact" variant="primary" size="lg" icon>
                  {contentConfig.hero.primaryCta}
                </Button>

                <Button href="#gallery" variant="outline" size="lg">
                  <span>{contentConfig.hero.secondaryCta}</span>
                  <ArrowDown className="w-4 h-4 ml-2 text-brand-600" />
                </Button>
              </div>
            </FadeIn>

          </div>
        </Container>
      </motion.div>
    </section>
  );
}
