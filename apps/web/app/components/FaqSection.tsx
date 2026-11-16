'use client';

import { useState } from 'react';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading } from '@/components/ui/Typography';
import { FadeIn } from '@/components/ui/Motion';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();
  const { faq } = useTemplateContent();

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = faq.list || [];

  return (
    <Section id="faq" background="white" padding="default">
      <Container size="narrow">

        {/* Section Intro */}
        <div className="max-w-2xl mb-8 sm:mb-10 text-center sm:text-left">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
              {faq.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading className="tracking-tight text-3xl sm:text-4xl">
              {faq.heading}
            </SectionHeading>
          </FadeIn>
        </div>

        {/* Clean Accordion List with Double-Bezel Framing */}
        <div className="double-bezel">
          <div className="double-bezel-inner bg-white divide-y divide-[#EBDEBA]/60">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;
              const buttonId = `faq-button-${index}`;
              const answerId = `faq-answer-${index}`;

              return (
                <div key={index} className="p-4 sm:p-6 transition-colors hover:bg-[#FAF8F2]/40">
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
                    className="w-full text-left flex items-center justify-between gap-4 group focus-ring rounded-[6px] cursor-pointer"
                  >
                    <span
                      className={`font-sans font-bold text-base sm:text-lg transition-colors duration-200 tracking-tight ${
                        isOpen ? 'text-[#0044A7]' : 'text-charcoal-900 group-hover:text-[#0044A7]'
                      }`}
                    >
                      {item.question}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#FAF8F2] border border-[#EBDEBA] flex items-center justify-center text-[#CE9E34] shrink-0 transition-transform duration-200 group-hover:scale-110">
                      {isOpen ? (
                        <Minus className="w-4 h-4 text-[#CE9E34]" />
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
                        <p className="pt-3 pb-1 text-sm sm:text-base text-charcoal-600 font-normal leading-relaxed max-w-2xl">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </Container>
    </Section>
  );
}
