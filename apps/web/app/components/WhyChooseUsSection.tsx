'use client';

import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { FadeIn } from '@/components/ui/Motion';

export default function WhyChooseUsSection() {
  const { whyChooseUs } = useTemplateContent();
  return (
    <Section id="why-us" background="white" padding="default">
      <Container>

        {/* Section Intro */}
        <div className="max-w-2xl mb-6 sm:mb-8">
          <FadeIn direction="up">
            <Eyebrow icon={false}>
              {whyChooseUs.eyebrow}
            </Eyebrow>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <SectionHeading>
              {whyChooseUs.heading}
            </SectionHeading>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <Subheading>
              {whyChooseUs.description}
            </Subheading>
          </FadeIn>
        </div>

        {/* Editorial Value Points (4 Columns desktop, 2 columns tablet, 1 column mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 border-t border-gray-100 pt-6 sm:pt-8">
          {whyChooseUs.items?.map((item, index) => (
            <FadeIn key={item.index || index} direction="up" delay={0.1 * index}>
              <div className="flex flex-col justify-between h-full group">
                <div>
                  {/* Index Number & Gold Accent Bar */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-xs uppercase tracking-[0.2em] font-black text-[#CE9E34]">
                      {item.index}
                    </span>
                    <div className="h-[2px] w-8 bg-[#CE9E34]/50 group-hover:w-12 group-hover:bg-[#CE9E34] transition-all duration-300" />
                  </div>

                  {/* Title */}
                  <h3 className="font-sans text-xl font-bold text-charcoal-900 tracking-tight mb-3">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-charcoal-600 font-normal leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

      </Container>
    </Section>
  );
}
