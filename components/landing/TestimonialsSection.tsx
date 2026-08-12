'use client';

import { useState } from 'react';
import { contentConfig } from '@/config/contentConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading } from '@/components/ui/Typography';
import { FadeIn } from '@/components/ui/Motion';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // If testimonials are disabled in config (until real client feedback is available), hide section
  if (!contentConfig.testimonials?.enabled || !contentConfig.testimonials?.list?.length) {
    return null;
  }

  const testimonials = contentConfig.testimonials.list;

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[activeIndex];

  return (
    <Section id="testimonials" background="surface" padding="spacious">
      <Container size="narrow">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
              {contentConfig.testimonials.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading>
              {contentConfig.testimonials.heading}
            </SectionHeading>
          </FadeIn>
        </div>

        {/* Editorial Quote Presentation */}
        <div className="relative bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-soft-sm">
          <Quote className="w-10 h-10 text-brand-200 mb-6" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="min-h-[140px] flex flex-col justify-between"
            >
              <blockquote className="font-sans text-lg sm:text-xl font-medium text-charcoal-900 leading-relaxed italic mb-8">
                &quot;{current.quote}&quot;
              </blockquote>

              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <div>
                  <h3 className="font-sans text-base font-bold text-charcoal-900">
                    {current.author}
                  </h3>
                  {current.location && (
                    <p className="text-xs text-brand-600 font-medium mt-0.5">
                      {current.location}
                    </p>
                  )}
                </div>

                {/* Keyboard Accessible Prev/Next controls */}
                {testimonials.length > 1 && (
                  <div className="flex items-center gap-2" role="group" aria-label="Testimonial controls">
                    <button
                      onClick={prevTestimonial}
                      className="w-10 h-10 rounded-full bg-surface hover:bg-brand-50 text-charcoal-700 hover:text-brand-600 border border-gray-200 flex items-center justify-center transition-colors focus-ring cursor-pointer"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextTestimonial}
                      className="w-10 h-10 rounded-full bg-surface hover:bg-brand-50 text-charcoal-700 hover:text-brand-600 border border-gray-200 flex items-center justify-center transition-colors focus-ring cursor-pointer"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight className="w-5 h-5" />
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
