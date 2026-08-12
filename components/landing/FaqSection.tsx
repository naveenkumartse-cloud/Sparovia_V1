'use client';

import { useState } from 'react';
import { contentConfig } from '@/config/contentConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading } from '@/components/ui/Typography';
import { FadeIn } from '@/components/ui/Motion';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = contentConfig.faqs.list;

  return (
    <Section id="faq" background="white" padding="spacious">
      <Container size="narrow">

        {/* Section Intro */}
        <div className="max-w-2xl mb-12 lg:mb-16">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
              {contentConfig.faqs.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading>
              {contentConfig.faqs.heading}
            </SectionHeading>
          </FadeIn>
        </div>

        {/* Clean Accordion List with Thin Dividers */}
        <div className="border-t border-gray-200">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-button-${index}`;
            const answerId = `faq-answer-${index}`;

            return (
              <FadeIn key={index} direction="up" delay={0.05 * index}>
                <div className="border-b border-gray-200">
                  <button
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => toggleFaq(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleFaq(index);
                      }
                    }}
                    className="w-full py-6 text-left flex items-center justify-between gap-6 group focus-ring rounded-lg cursor-pointer"
                  >
                    <span
                      className={`font-sans font-semibold text-base sm:text-lg transition-colors duration-300 ${
                        isOpen ? 'text-brand-600' : 'text-charcoal-900 group-hover:text-brand-600'
                      }`}
                    >
                      {faq.question}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-surface group-hover:bg-brand-50 flex items-center justify-center text-charcoal-700 group-hover:text-brand-600 shrink-0 transition-colors">
                      {isOpen ? (
                        <Minus className="w-4 h-4 text-brand-600" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={answerId}
                        role="region"
                        aria-labelledby={buttonId}
                        initial={shouldReduceMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={shouldReduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pt-1 text-sm sm:text-base text-charcoal-600 font-normal leading-relaxed max-w-2xl">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            );
          })}
        </div>

      </Container>
    </Section>
  );
}
