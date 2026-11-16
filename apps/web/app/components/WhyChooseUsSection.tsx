'use client';

import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { FadeIn } from '@/components/ui/Motion';
import { ShieldCheck, Award, Wrench, Clock } from 'lucide-react';

const PILLAR_ICONS = [Award, Wrench, ShieldCheck, Clock];

export default function WhyChooseUsSection() {
  const { whyChooseUs } = useTemplateContent();
  return (
    <Section id="why-us" background="white" padding="default">
      <Container>

        {/* Section Intro */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
              {whyChooseUs.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading className="tracking-tight text-3xl sm:text-4xl">
              {whyChooseUs.heading}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <Subheading className="text-charcoal-600 text-base sm:text-lg">
              {whyChooseUs.description}
            </Subheading>
          </FadeIn>
        </div>

        {/* Architectural Value Points Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {whyChooseUs.items?.map((item, index) => {
            const Icon = PILLAR_ICONS[index % PILLAR_ICONS.length];
            return (
              <FadeIn key={item.index || index} direction="up" delay={0.1 * index}>
                <div className="flex flex-col justify-between h-full p-5 sm:p-6 rounded-[8px] bg-[#FAF8F2]/60 border border-[#EBDEBA] hover:bg-[#FAF8F2] hover:border-[#CE9E34] hover:shadow-soft-sm transition-all duration-300 group">
                  <div>
                    {/* Header: Index Number & Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs uppercase tracking-[0.2em] font-black text-[#CE9E34]">
                        {item.index}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white border border-[#EBDEBA] flex items-center justify-center text-[#CE9E34] shadow-2xs group-hover:scale-110 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Expanding Accent Bar */}
                    <div className="h-[2px] w-8 bg-[#EBDEBA] group-hover:w-14 group-hover:bg-[#CE9E34] transition-all duration-300 mb-4" />

                    {/* Title */}
                    <h3 className="font-sans text-lg sm:text-xl font-bold text-charcoal-900 tracking-tight mb-2.5 leading-snug">
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
          <div className="mt-8 sm:mt-10 p-4 sm:p-5 rounded-[8px] bg-white border border-[#EBDEBA] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#CE9E34]" />
              <span className="text-xs sm:text-sm font-bold text-charcoal-900">
                100% In-House Execution Guarantee
              </span>
              <span className="hidden md:inline text-xs text-charcoal-600">
                • Factory-direct manufacturing &amp; certified installation
              </span>
            </div>
            <a
              href="#contact"
              className="text-xs uppercase tracking-wider font-bold text-[#0044A7] hover:text-[#00388A] hover:underline"
            >
              Discuss Your Project &rarr;
            </a>
          </div>
        </FadeIn>

      </Container>
    </Section>
  );
}
