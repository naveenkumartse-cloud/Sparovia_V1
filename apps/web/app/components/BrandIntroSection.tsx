'use client';

import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { mediaConfig } from '@/config/mediaConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, BodyText } from '@/components/ui/Typography';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { FadeIn } from '@/components/ui/Motion';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Award, Sparkles } from 'lucide-react';

export default function BrandIntroSection() {
  const { about } = useTemplateContent();
  const primaryImage = about.primaryImage || mediaConfig.brandIntro.primaryImage;
  const secondaryImage = about.secondaryImage || mediaConfig.brandIntro.secondaryImage;

  return (
    <Section id="about" background="white" padding="default">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Visual Area — responsive: single image on mobile, double-bezel editorial layout on md+ */}
          <div className="lg:col-span-7">
            <FadeIn direction="right" delay={0.1}>

              {/* Mobile (< md): Single full-width image with double bezel */}
              <div className="md:hidden">
                <ImageFrame
                  src={primaryImage}
                  alt={about.title || "Residential Interior Project"}
                  aspectRatio="video"
                  doubleBezel
                />
              </div>

              {/* md+ (768px+): Double-bezel editorial layout */}
              <div className="hidden md:grid grid-cols-12 gap-4">
                <div className="col-span-8">
                  <ImageFrame
                    src={primaryImage}
                    alt={about.title || "Residential Interior Project"}
                    aspectRatio="portrait"
                    doubleBezel
                    className="h-[340px] lg:h-[440px]"
                  />
                </div>

                <div className="col-span-4 flex flex-col gap-3.5 justify-between">
                  <ImageFrame
                    src={secondaryImage}
                    alt="Secondary Project View"
                    aspectRatio="portrait"
                    doubleBezel
                    className="h-[185px] lg:h-[245px]"
                  />

                  {/* Architectural Craftsmanship Badge Card */}
                  <div className="relative rounded-[10px] bg-[#FAF8F2] p-4 lg:p-5 flex flex-col justify-between border border-[#EBDEBA] shadow-soft-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#EBDEBA] shadow-2xs">
                        <Award className="w-4.5 h-4.5 text-[#CE9E34]" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.15em] font-black text-[#9E741B] bg-white px-2 py-0.5 rounded border border-[#EBDEBA]">
                        Verified
                      </span>
                    </div>
                    <div>
                      <span className="font-sans text-sm lg:text-base font-bold text-charcoal-900 block leading-tight">
                        Dedicated Quality
                      </span>
                      <span className="text-xs text-charcoal-700 font-medium block mt-0.5">
                        Bespoke Millwork & Glazing
                      </span>
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

              <SectionHeading className="tracking-tight text-3xl sm:text-4xl">
                {about.title}
              </SectionHeading>

              <BodyText className="mb-5 font-normal text-charcoal-600 leading-relaxed">
                {about.description}
              </BodyText>

              {about.pillars && about.pillars.length > 0 && (
                <ul className="space-y-3 mb-6">
                  {about.pillars.map((pillar: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 p-2.5 rounded-[6px] bg-[#FAF8F2]/60 border border-[#EBDEBA]/40 text-xs sm:text-sm text-charcoal-800 font-medium transition-colors hover:bg-[#FAF8F2]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#CE9E34] shrink-0" />
                      <span>{pillar}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div>
                <Button href="#interiors" variant="outline" size="md" icon>
                  Explore Capabilities
                </Button>
              </div>
            </FadeIn>
          </div>

        </div>
      </Container>
    </Section>
  );
}
