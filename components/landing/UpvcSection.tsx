'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { contentConfig } from '@/config/contentConfig';
import { mediaConfig } from '@/config/mediaConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import Image from 'next/image';

const upvcGallery = mediaConfig.upvc.gallery;
const themes = contentConfig.upvc.themes;

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
        className="relative w-full rounded-2xl overflow-hidden bg-surface border border-gray-100 shadow-soft-sm"
        style={{ aspectRatio: '21/9' }}
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

function ThemeLabels() {
  return (
    <FadeIn direction="up" delay={0.3}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {themes.map((theme, i) => (
          <div key={i} className="text-center md:text-left">
            <span className="block text-[11px] uppercase tracking-[0.15em] text-brand-600 font-bold mb-1.5">
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

/* ─── Desktop: Horizontal Scroll Gallery (CSS scroll-driven) ─── */

function DesktopHorizontalGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll-driven horizontal movement using Framer Motion
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start end', 'end start'],
  });

  // Move the gallery strip leftward as user scrolls through the section
  const x = useTransform(scrollYProgress, [0, 1], ['5%', '-25%']);

  return (
    <div ref={trackRef} className="hidden md:block overflow-hidden py-4">
      <motion.div
        className="flex gap-6"
        style={shouldReduceMotion ? {} : { x }}
      >
        {upvcGallery.map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 group"
            style={{ width: 'clamp(320px, 30vw, 480px)' }}
          >
            <div className="relative rounded-2xl overflow-hidden bg-surface border border-gray-100 shadow-soft-sm aspect-[4/3]">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 30vw"
                className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <span className="block mt-3 text-[11px] uppercase tracking-[0.12em] text-charcoal-500 font-semibold">
              {item.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Mobile: Horizontal Swipe Gallery ─── */

function MobileSwipeGallery() {
  return (
    <div className="md:hidden -mx-4 sm:-mx-6">
      <div
        className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-4 snap-x snap-mandatory"
        role="region"
        aria-label="uPVC project gallery"
        tabIndex={0}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {upvcGallery.map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 snap-start"
            style={{ width: '80vw', maxWidth: '360px' }}
          >
            <div className="relative rounded-xl overflow-hidden bg-surface border border-gray-100 shadow-soft-sm aspect-[4/3]">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="80vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
            <span className="block mt-2.5 text-[10px] uppercase tracking-[0.12em] text-charcoal-500 font-semibold">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Section ─── */

export default function UpvcSection() {
  return (
    <Section id="upvc" background="surface" padding="spacious">
      <Container>

        {/* Section Intro */}
        <div className="max-w-2xl mb-12 lg:mb-16">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
              {contentConfig.upvc.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading>
              {contentConfig.upvc.heading}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <Subheading>
              {contentConfig.upvc.description}
            </Subheading>
          </FadeIn>
        </div>

        {/* Large Architectural Image */}
        <ArchitecturalHero />

        {/* Theme Labels */}
        <div className="mt-12 lg:mt-16 mb-16 lg:mb-20">
          <ThemeLabels />
        </div>

      </Container>

      {/* Horizontal Window Showcase — extends beyond Container for visual width */}
      <Container size="wide">
        <FadeIn direction="up" delay={0.1}>
          <div className="mb-8">
            <span className="text-[11px] uppercase tracking-[0.15em] text-charcoal-500 font-semibold">
              Window &amp; Door Installations
            </span>
          </div>
        </FadeIn>

        <DesktopHorizontalGallery />
        <MobileSwipeGallery />

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
