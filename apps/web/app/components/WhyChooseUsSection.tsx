'use client';

import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { FadeIn } from '@/components/ui/Motion';
import { ShieldCheck, Award, Wrench, Clock, CheckCircle } from 'lucide-react';

const PILLAR_ICONS = [Award, Wrench, ShieldCheck, Clock];

export default function WhyChooseUsSection() {
  const { whyChooseUs } = useTemplateContent();
  return (
    <Section id="why-us" background="white" padding="default" className="relative bg-[#FAF8F2] overflow-hidden">
      <Container>

        {/* Section Intro */}
        <div className="max-w-2xl mb-10 sm:mb-14">
          <FadeIn direction="up">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9E741B] font-bold block mb-2">
              [PILLARS OF EXCELLENCE // DISCIPLINE &amp; QUALITY]
            </span>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <Eyebrow icon={false}>{whyChooseUs.eyebrow || 'WHY KVN INTERIOR'}</Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <SectionHeading className="tracking-tight text-3xl sm:text-4xl lg:text-5xl">
              {whyChooseUs.heading || 'Architectural Precision & Trust'}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <Subheading className="text-charcoal-600 text-base sm:text-lg">
              {whyChooseUs.description || 'Our integrated factory-direct approach eliminates middlemen, ensuring uncompromised material quality, millimeter precision, and lifelong durability.'}
            </Subheading>
          </FadeIn>
        </div>

        {/* Architectural Value Points Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseUs.items?.map((item, index) => {
            const Icon = PILLAR_ICONS[index % PILLAR_ICONS.length];
            return (
              <FadeIn key={item.index || index} direction="up" delay={0.1 * index}>
                <div className="flex flex-col justify-between h-full p-6 rounded-xl bg-white border border-[#EBDEBA] hover:border-[#CE9E34] hover:shadow-lg transition-all duration-300 group">
                  <div>
                    {/* Header: Monospaced Index & Icon */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-xs font-mono uppercase tracking-[0.2em] font-black text-[#CE9E34]">
                        [{item.index}]
                      </span>
                      <div className="w-9 h-9 rounded-full bg-[#FAF8F2] border border-[#EBDEBA] flex items-center justify-center text-[#CE9E34] shadow-2xs group-hover:scale-110 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Expanding Accent Bar */}
                    <div className="h-[2px] w-8 bg-[#EBDEBA] group-hover:w-16 group-hover:bg-[#CE9E34] transition-all duration-300 mb-4" />

                    {/* Title */}
                    <h3 className="font-sans text-xl font-bold text-charcoal-900 tracking-tight mb-3 leading-snug">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-charcoal-600 font-normal leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Quality Commitment Footer */}
        <FadeIn direction="up" delay={0.3}>
          <div className="mt-10 sm:mt-12 p-5 sm:p-6 rounded-xl bg-white border border-[#EBDEBA] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#CE9E34] shrink-0" />
              <div>
                <span className="text-sm font-bold text-charcoal-900 block sm:inline">
                  100% In-House Factory Direct Execution
                </span>
                <span className="hidden sm:inline text-xs text-charcoal-600 ml-2">
                  • Zero outsourced subcontractors. 10-Year profile warranty on all uPVC installations.
                </span>
              </div>
            </div>
            <a
              href="#contact"
              className="text-xs font-mono uppercase tracking-wider font-bold text-[#0044A7] hover:text-[#00388A] hover:underline"
            >
              Discuss Your Project &rarr;
            </a>
          </div>
        </FadeIn>

      </Container>
    </Section>
  );
}
