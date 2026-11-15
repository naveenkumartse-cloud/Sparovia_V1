'use client';

import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { mediaConfig } from '@/config/mediaConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, BodyText } from '@/components/ui/Typography';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { FadeIn } from '@/components/ui/Motion';
import { CheckCircle2, Award } from 'lucide-react';

export default function BrandIntroSection() {
  const { about } = useTemplateContent();
  const primaryImage = about.primaryImage || mediaConfig.brandIntro.primaryImage;
  const secondaryImage = about.secondaryImage || mediaConfig.brandIntro.secondaryImage;

  return (
    <Section id="about" background="white" padding="default">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Visual Area — responsive: single image on mobile, editorial grid on md+ */}
          <div className="lg:col-span-7">
            <FadeIn direction="right" delay={0.1}>

              {/* Mobile (< md): Single full-width image — clean and legible */}
              <div className="md:hidden">
                <ImageFrame
                  src={primaryImage}
                  alt={about.title || "Residential Interior Project"}
                  aspectRatio="video"
                />
              </div>

              {/* md+ (768px+): Two-column editorial layout */}
              <div className="hidden md:grid grid-cols-12 gap-4">
                <div className="col-span-8">
                  <ImageFrame
                    src={primaryImage}
                    alt={about.title || "Residential Interior Project"}
                    aspectRatio="portrait"
                    className="h-[320px] lg:h-[420px]"
                  />
                </div>

                <div className="col-span-4 flex flex-col gap-3.5">
                  <ImageFrame
                    src={secondaryImage}
                    alt="Secondary Project View"
                    aspectRatio="portrait"
                    className="h-[180px] lg:h-[235px]"
                  />

                  <div className="relative h-[125px] lg:h-[170px] rounded-panel bg-[#FAF8F2] p-4 lg:p-5 flex flex-col justify-between border border-[#EBDEBA] shadow-soft-sm">
                    <Award className="w-6 h-6 lg:w-7 lg:h-7 text-[#CE9E34]" />
                    <div>
                      <span className="font-sans text-sm lg:text-base font-bold text-charcoal-900 block leading-snug">Dedicated Quality</span>
                      <span className="text-xs text-charcoal-700 font-medium">Bespoke Architectural Finish</span>
                    </div>
                  </div>
                </div>
              </div>

            </FadeIn>
          </div>

          {/* Content Area (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <FadeIn direction="left" delay={0.2}>
              {about.badge && <Eyebrow>{about.badge}</Eyebrow>}

              <SectionHeading>
                {about.title}
              </SectionHeading>

              <BodyText className="mb-4 sm:mb-5 font-normal">
                {about.description}
              </BodyText>

              {about.pillars && about.pillars.length > 0 && (
                <ul className="space-y-2.5 sm:space-y-3">
                  {about.pillars.map((pillar: string, index: number) => (
                    <li key={index} className="flex items-center gap-2.5 text-xs sm:text-sm text-charcoal-800 font-medium">
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#CE9E34] shrink-0" />
                      <span>{pillar}</span>
                    </li>
                  ))}
                </ul>
              )}
            </FadeIn>
          </div>

        </div>
      </Container>
    </Section>
  );
}
