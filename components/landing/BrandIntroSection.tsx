'use client';

import { contentConfig } from '@/config/contentConfig';
import { mediaConfig } from '@/config/mediaConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, BodyText } from '@/components/ui/Typography';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { FadeIn } from '@/components/ui/Motion';
import { CheckCircle2, Award } from 'lucide-react';

export default function BrandIntroSection() {
  return (
    <Section id="about" background="white" padding="default">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* 70% Visual Area (7 Columns) */}
          <div className="lg:col-span-7">
            <FadeIn direction="right" delay={0.1}>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8">
                  <ImageFrame
                    src={mediaConfig.brandIntro.primaryImage}
                    alt="Sparovia Residential Interior Project"
                    aspectRatio="portrait"
                    className="h-[360px] sm:h-[460px]"
                  />
                </div>

                <div className="col-span-4 flex flex-col gap-4">
                  <ImageFrame
                    src={mediaConfig.brandIntro.secondaryImage}
                    alt="Sparovia uPVC Installation"
                    aspectRatio="portrait"
                    className="h-[200px] sm:h-[260px]"
                  />

                  <div className="relative h-[145px] sm:h-[185px] rounded-2xl bg-brand-50 p-6 flex flex-col justify-between border border-brand-200 shadow-soft-sm">
                    <Award className="w-8 h-8 text-brand-600" />
                    <div>
                      <span className="font-sans text-lg font-bold text-charcoal-900 block">Dedicated Quality</span>
                      <span className="text-xs text-charcoal-700 font-medium">Real Client Execution</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* 30% Content Area (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <FadeIn direction="left" delay={0.2}>
              <Eyebrow>{contentConfig.brandIntro.badge}</Eyebrow>

              <SectionHeading>
                {contentConfig.brandIntro.title}
              </SectionHeading>

              <BodyText className="mb-6 font-normal">
                {contentConfig.brandIntro.description}
              </BodyText>

              <ul className="space-y-3.5">
                {contentConfig.brandIntro.pillars.map((pillar, index) => (
                  <li key={index} className="flex items-center gap-3 text-xs sm:text-sm text-charcoal-800 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                    <span>{pillar}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>

        </div>
      </Container>
    </Section>
  );
}
