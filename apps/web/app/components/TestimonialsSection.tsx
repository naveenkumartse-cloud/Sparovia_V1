'use client';

import { useState } from 'react';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading } from '@/components/ui/Typography';
import { FadeIn } from '@/components/ui/Motion';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <Section id="testimonials" background="surface" padding="spacious">
      <Container size="narrow">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
              {testimonials.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading>
              {testimonials.heading}
            </SectionHeading>
          </FadeIn>
        </div>

        {/* Editorial Quote Presentation */}
        <div className="relative bg-white rounded-panel p-6 sm:p-10 md:p-12 border border-[#E8DCC4] shadow-soft-sm">
          <Quote className="w-10 h-10 text-[#C6A052]/50 mb-6" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <blockquote className="font-sans text-lg sm:text-xl md:text-2xl font-medium text-charcoal-900 leading-snug mb-8">
                &ldquo;{quoteText}&rdquo;
              </blockquote>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100 pt-6">
                <div>
                  <span className="block font-sans font-bold text-sm text-[#102B50]">
                    {authorName}
                  </span>
                  {roleOrLocation && (
                    <span className="block text-xs text-muted-500 font-medium">
                      {roleOrLocation}
                    </span>
                  )}
                </div>

                {/* Carousel Controls */}
                {testimonialsList.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevTestimonial}
                      className="p-2 rounded-control bg-gray-50 hover:bg-[#FAF7EE] text-[#102B50] border border-gray-200 hover:border-[#C6A052] transition-colors focus-ring cursor-pointer"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-charcoal-600 font-medium px-2">
                      {activeIndex + 1} / {testimonialsList.length}
                    </span>
                    <button
                      onClick={nextTestimonial}
                      className="p-2 rounded-control bg-gray-50 hover:bg-[#FAF7EE] text-[#102B50] border border-gray-200 hover:border-[#C6A052] transition-colors focus-ring cursor-pointer"
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
