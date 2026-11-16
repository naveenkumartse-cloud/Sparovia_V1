'use client';

import { useState } from 'react';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading } from '@/components/ui/Typography';
import { FadeIn } from '@/components/ui/Motion';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const { testimonials } = useTemplateContent();

  const testimonialsList = testimonials.list || [];
  const isEnabled = testimonials.enabled && testimonialsList.length > 0;
  if (!isEnabled) {
    return null;
  }

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonialsList.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonialsList.length) % testimonialsList.length);
  };

  const current = testimonialsList[activeIndex];
  const quoteText = current?.quote || '';
  const authorName = current?.author || 'Client';
  const roleOrLocation = current?.location || '';

  return (
    <Section id="testimonials" background="surface" padding="default" className="relative bg-[#080C14] text-white overflow-hidden py-20 sm:py-28">
      {/* Background architectural gridlines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <Container size="narrow">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <FadeIn direction="up">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#CE9E34] font-bold block mb-2">
              [CHAPTER 05 // CLIENT ARCHIVES]
            </span>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <Eyebrow icon={false} className="justify-center text-[#DFB95C]">
              {testimonials.eyebrow || 'CLIENT EXPERIENCES'}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <SectionHeading className="tracking-tight text-3xl sm:text-4xl lg:text-5xl text-white">
              {testimonials.heading || 'Words of Distinction'}
            </SectionHeading>
          </FadeIn>
        </div>

        {/* Editorial Quote Presentation with Dark Glassmorphic Framing */}
        <div className="relative rounded-2xl bg-[#0E1422] p-8 sm:p-12 border border-[#CE9E34]/30 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Quote className="w-10 h-10 text-[#CE9E34]" />
            <div className="flex items-center gap-1.5 text-[#CE9E34]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#CE9E34]" />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <blockquote className="font-sans text-xl sm:text-2xl md:text-3xl font-medium text-white leading-relaxed mb-8">
                &ldquo;{quoteText}&rdquo;
              </blockquote>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-6">
                <div>
                  <span className="block font-sans font-bold text-base sm:text-lg text-[#DFB95C]">
                    {authorName}
                  </span>
                  {roleOrLocation && (
                    <span className="block text-xs sm:text-sm text-gray-400 font-mono mt-0.5">
                      {roleOrLocation}
                    </span>
                  )}
                </div>

                {/* Carousel Controls */}
                {testimonialsList.length > 1 && (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={prevTestimonial}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#0044A7] text-white border border-white/20 hover:border-[#CE9E34] flex items-center justify-center transition-all focus-ring cursor-pointer"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-gray-400 font-bold px-2">
                      {activeIndex + 1} / {testimonialsList.length}
                    </span>
                    <button
                      onClick={nextTestimonial}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#0044A7] text-white border border-white/20 hover:border-[#CE9E34] flex items-center justify-center transition-all focus-ring cursor-pointer"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </Container>
    </Section>
  );
}
