'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion';
import { mediaConfig } from '@/config/mediaConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { RevealImage } from '@/components/ui/RevealImage';
import { FadeIn } from '@/components/ui/Motion';
import Image from 'next/image';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

const CHAPTERS_DATA = [
  {
    id: 'modular-kitchens',
    index: '01',
    title: 'Modular Kitchen Architecture',
    tagline: 'Precision Ergonomics & Waterfall Marble Islands',
    description: 'Custom engineered kitchen suites featuring Marine BWR plywood carcasses, German Blum soft-close hydraulic systems, and seamless non-porous quartz surfaces tailored for modern culinary living.',
    image: mediaConfig.interiors.kitchens,
    specs: ['Marine Grade BWR Ply', 'Blum Hydraulic Hardware', 'Seamless Quartz Surfaces', 'Concealed LED Strip Channels'],
  },
  {
    id: 'wardrobes',
    index: '02',
    title: 'Haute Couture Wardrobe Systems',
    tagline: 'Floor-to-Ceiling Tinted Glass & Internal Illumination',
    description: 'Bespoke walk-in and sliding wardrobe architectures with integrated vertical LED profiles, anodized aluminum frames, tempered tinted glass doors, and modular jewelry & accessory organizers.',
    image: mediaConfig.interiors.wardrobes,
    specs: ['Floor-to-Ceiling Glazed Doors', 'Integrated Vertical 3000K LED', 'Custom Modular Organizers', 'Soft-Damped Smooth Glides'],
  },
  {
    id: 'living-units',
    index: '03',
    title: 'Floating Acoustic Living Suites',
    tagline: 'Fluted Timber Paneling & Concealed AV Enclosures',
    description: 'Architectural living room media consoles with vertical fluted acoustic wall paneling, floating geometric cabinetry, and concealed zero-clutter cable routing designed for high-end residential interiors.',
    image: mediaConfig.interiors.living,
    specs: ['Acoustic Fluted Wall Slatting', 'Concealed Smart Cable Hub', 'Floating Precision Mitred Joints', 'Integrated Ambient Backlight'],
  },
];

export default function InteriorStorytellingSection() {
  const { services } = useTemplateContent();
  const [activeChapter, setActiveChapter] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll tracking across the pinned storytelling sequence
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      if (latest < 0.38) {
        setActiveChapter(0);
      } else if (latest < 0.72) {
        setActiveChapter(1);
      } else {
        setActiveChapter(2);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const current = CHAPTERS_DATA[activeChapter];

  return (
    <Section id="interiors" background="white" padding="default" className="relative bg-white overflow-hidden">
      <Container>

        {/* Section Intro */}
        <div className="mb-12 sm:mb-16 max-w-2xl">
          <FadeIn direction="up">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9E741B] font-bold block mb-2">
              [CHAPTER 02 // BESPOKE INTERIOR CRAFT]
            </span>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <Eyebrow icon={false}>{services.eyebrow || 'OUR CAPABILITIES'}</Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <SectionHeading className="tracking-tight text-3xl sm:text-4xl lg:text-5xl">
              {services.heading || 'Crafted Living Environments'}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <Subheading className="text-charcoal-600 text-base sm:text-lg">
              {services.description || 'From bespoke modular kitchens to acoustic living suites, our custom interiors blend timeless architectural form with daily utility.'}
            </Subheading>
          </FadeIn>
        </div>

        {/* Desktop Pinned Scroll Storytelling Track (hidden on mobile, visible on lg+) */}
        <div ref={containerRef} className="hidden lg:block relative min-h-[220vh]">
          <div className="sticky top-28 grid grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Pinned High-Resolution Visual with Smooth Crossfading */}
            <div className="col-span-7">
              <div className="double-bezel">
                <div className="double-bezel-inner relative h-[520px] w-full overflow-hidden bg-charcoal-900">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current.id}
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1.0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <Image
                        src={current.image}
                        alt={current.title}
                        fill
                        sizes="58vw"
                        className="object-cover object-center"
                        priority
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Live Image HUD Indicator */}
                      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#CE9E34]/40 text-white text-[10px] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CE9E34]" />
                        <span>{`CHAPTER ${current.index} • ${current.title.toUpperCase()}`}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Chapter Narrative */}
            <div className="col-span-5 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#CE9E34] font-black">
                      CHAPTER {current.index} / 03
                    </span>
                    <div className="h-[1px] w-12 bg-[#CE9E34]" />
                  </div>

                  <h3 className="font-sans text-3xl font-bold text-charcoal-900 tracking-tight leading-tight">
                    {current.title}
                  </h3>

                  <p className="text-sm font-semibold text-[#0044A7]">
                    {current.tagline}
                  </p>

                  <p className="text-sm sm:text-base text-charcoal-700 leading-relaxed font-normal">
                    {current.description}
                  </p>

                  {/* Architectural Specifications Checklist */}
                  <div className="pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-500 font-bold block mb-2.5">
                      ENGINEERING SPECIFICATIONS:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {current.specs.map((spec, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-2.5 text-xs text-charcoal-800 font-medium p-2 rounded bg-[#FAF8F2] border border-[#EBDEBA]"
                        >
                          <Check className="w-3.5 h-3.5 text-[#CE9E34] shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button href="#contact" variant="primary" size="md" icon>
                      Enquire for this Solution
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* Mobile / Tablet View: Cascade of Chapters with Masked Reveals */}
        <div className="lg:hidden flex flex-col gap-12 sm:gap-16">
          {CHAPTERS_DATA.map((item, idx) => (
            <div key={item.id} className="space-y-4">
              <div className="double-bezel">
                <div className="double-bezel-inner aspect-[4/3] relative">
                  <RevealImage
                    src={item.image}
                    alt={item.title}
                    aspectRatio="video"
                    direction="up"
                    duration={1.0}
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#CE9E34] font-black">
                    CHAPTER {item.index} / 03
                  </span>
                  <div className="h-[1px] w-8 bg-[#CE9E34]" />
                </div>

                <h3 className="font-sans text-2xl font-bold text-charcoal-900 tracking-tight">
                  {item.title}
                </h3>

                <p className="text-xs font-semibold text-[#0044A7]">
                  {item.tagline}
                </p>

                <p className="text-sm text-charcoal-700 leading-relaxed font-normal">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {item.specs.map((spec, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[10px] font-medium text-charcoal-800 bg-[#FAF8F2] border border-[#EBDEBA] px-2.5 py-1 rounded-[4px]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="pt-3">
                  <Button href="#contact" variant="primary" size="sm" icon>
                    Enquire for this Solution
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </Container>
    </Section>
  );
}
