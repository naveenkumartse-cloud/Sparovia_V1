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
  // Render only if explicitly enabled and list has items
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
    <Section id="testimonials" background="surface" padding="default">
      <Container size="narrow">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <FadeIn direction="up">
            <Eyebrow icon={false} className="justify-center">
              {testimonials.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading className="tracking-tight text-3xl sm:text-4xl">
              {testimonials.heading}
            </SectionHeading>
          </FadeIn>
        </div>

        {/* Editorial Quote Presentation with Double-Bezel Framing */}
        <div className="double-bezel">
          <div className="double-bezel-inner bg-white p-6 sm:p-8 md:p-10">
            <div className="flex items-center justify-between mb-5">
              <Quote className="w-8 h-8 text-[#CE9E34]" />
              <div className="flex items-center gap-1 text-[#CE9E34]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#CE9E34]" />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <blockquote className="font-sans text-lg sm:text-xl md:text-2xl font-medium text-charcoal-900 leading-relaxed mb-6">
                  &ldquo;{quoteText}&rdquo;
                </blockquote>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100 pt-5">
                  <div>
                    <span className="block font-sans font-bold text-sm sm:text-base text-[#0044A7]">
                      {authorName}
                    </span>
                    {roleOrLocation && (
                      <span className="block text-xs sm:text-sm text-charcoal-600 font-medium">
                        {roleOrLocation}
                      </span>
                    )}
                  </div>

                  {/* Carousel Controls */}
                  {testimonialsList.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={prevTestimonial}
                        className="w-9 h-9 rounded-full bg-white hover:bg-[#FAF8F2] text-[#0044A7] border border-[#EBDEBA] hover:border-[#CE9E34] flex items-center justify-center transition-colors focus-ring cursor-pointer"
                        aria-label="Previous testimonial"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-charcoal-600 font-bold px-2">
                        {activeIndex + 1} / {testimonialsList.length}
                      </span>
                      <button
                        onClick={nextTestimonial}
                        className="w-9 h-9 rounded-full bg-white hover:bg-[#FAF8F2] text-[#0044A7] border border-[#EBDEBA] hover:border-[#CE9E34] flex items-center justify-center transition-colors focus-ring cursor-pointer"
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
        </div>

      </Container>
    </Section>
  );
}
