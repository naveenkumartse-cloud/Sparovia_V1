'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { mediaConfig } from '@/config/mediaConfig';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ArrowDown, Compass, Shield } from 'lucide-react';
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

  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.6], ['0px', '-45px']);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#080C14]"
    >
      {/* Full-bleed Architectural Image with Masked Expansion & Parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={shouldReduceMotion ? {} : { clipPath: 'inset(8% 6% 8% 6% round 16px)' }}
        animate={shouldReduceMotion ? {} : { clipPath: 'inset(0% 0% 0% 0% round 0px)' }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
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
          className="object-cover object-[center_35%] md:object-center brightness-[0.82] contrast-[1.08]"
        />

        {/* Cinematic Scrims: Multi-layer depth gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-transparent to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080C14]/90 via-[#080C14]/60 to-transparent pointer-events-none" />
        {/* Subtle architectural hairline grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      </motion.div>

      {/* Hero Editorial Content */}
      <motion.div
        className="relative z-10 w-full pt-[112px] sm:pt-32 lg:pt-40 pb-16 sm:pb-24"
        style={shouldReduceMotion ? {} : {
          opacity: contentOpacity,
          y: contentY,
        }}
      >
        <Container>
          <div className="max-w-3xl">

            {/* Architectural Live Status HUD */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#CE9E34]/40 shadow-xl mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-[#CE9E34] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-white">
                [KVN // ARCHITECTURAL ATELIER • BENGALURU]
              </span>
              <span className="hidden sm:inline text-[10px] font-mono text-[#CE9E34]">
                12.9716° N, 77.5946° E
              </span>
            </motion.div>

            {/* Eyebrow */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mb-3"
            >
              <span className="text-xs uppercase tracking-[0.25em] text-[#DFB95C] font-black flex items-center gap-2">
                <Compass className="w-3.5 h-3.5" />
                <span>{hero.eyebrow}</span>
              </span>
            </motion.div>

            {/* Staggered Overflow Headline Reveal */}
            <div className="overflow-hidden mb-5">
              <motion.h1
                initial={shouldReduceMotion ? {} : { y: '100%', opacity: 0 }}
                animate={shouldReduceMotion ? {} : { y: '0%', opacity: 1 }}
                transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="font-sans text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] uppercase"
              >
                {hero.headline}
              </motion.h1>
            </div>

            {/* Short Supporting Copy */}
            <motion.p
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 sm:mb-10 text-gray-300 max-w-xl text-base sm:text-lg leading-relaxed font-normal"
            >
              {hero.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10"
            >
              <Button
                href="#contact"
                variant="primary"
                size="lg"
                icon
                className="w-full sm:w-auto justify-center bg-[#0044A7] hover:bg-[#00388A] text-white border border-[#CE9E34] shadow-[0_0_20px_rgba(206,158,52,0.35)] transition-all hover:scale-[1.02]"
              >
                {hero.primaryCta}
              </Button>

              <Button
                href="#gallery"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto justify-center bg-white/10 hover:bg-white/20 text-white border-white/25 hover:border-[#CE9E34] backdrop-blur-md"
              >
                <span>{hero.secondaryCta}</span>
                <ArrowDown className="w-4 h-4 ml-2 text-[#CE9E34]" />
              </Button>
            </motion.div>

            {/* Technical Specification Badges */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0 }}
              animate={shouldReduceMotion ? {} : { opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.85 }}
              className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10"
            >
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                <Shield className="w-3.5 h-3.5 text-[#CE9E34]" />
                <span>10-Yr German Profile Warranty</span>
              </div>
              <span className="text-white/20">•</span>
              <div className="text-xs text-gray-400 font-mono">
                BWR Marine Plywood
              </div>
              <span className="text-white/20">•</span>
              <div className="text-xs text-gray-400 font-mono">
                40 dB Acoustic Insulation
              </div>
            </motion.div>

          </div>
        </Container>
      </motion.div>

      {/* Atmospheric Scroll Cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray-400">
          SCROLL TO EXPLORE
        </span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-[#CE9E34] to-transparent animate-pulse" />
      </div>
    </section>
  );
}
