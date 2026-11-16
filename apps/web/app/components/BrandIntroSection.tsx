'use client';

import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { mediaConfig } from '@/config/mediaConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, BodyText } from '@/components/ui/Typography';
import { RevealImage } from '@/components/ui/RevealImage';
import { FadeIn } from '@/components/ui/Motion';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Award, Sparkles, Layers } from 'lucide-react';

export default function BrandIntroSection() {
  const { about } = useTemplateContent();
  const primaryImage = about.primaryImage || mediaConfig.brandIntro.primaryImage;
  const secondaryImage = about.secondaryImage || mediaConfig.brandIntro.secondaryImage;

  return (
    <Section id="about" background="white" padding="default" className="relative bg-[#FAF8F2] overflow-hidden">
      {/* Hairline architectural top separator */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#EBDEBA] to-transparent" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Visual Area — Masked Reveal Editorial Layout */}
          <div className="lg:col-span-7">
            {/* Mobile (< md): Single full-width image with clip reveal */}
            <div className="md:hidden">
              <div className="double-bezel">
                <div className="double-bezel-inner aspect-video">
                  <RevealImage
                    src={primaryImage}
                    alt={about.title || "Residential Interior Project"}
                    aspectRatio="video"
                    direction="up"
                    duration={1.0}
                  />
                </div>
              </div>
            </div>

            {/* md+ (768px+): Double-bezel editorial layout with staggered reveals */}
            <div className="hidden md:grid grid-cols-12 gap-5">
              <div className="col-span-8">
                <div className="double-bezel h-full">
                  <div className="double-bezel-inner h-[360px] lg:h-[460px]">
                    <RevealImage
                      src={primaryImage}
                      alt={about.title || "Residential Interior Project"}
                      aspectRatio="portrait"
                      direction="left"
                      duration={1.2}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-4 flex flex-col gap-4 justify-between">
                <div className="double-bezel">
                  <div className="double-bezel-inner h-[190px] lg:h-[250px]">
                    <RevealImage
                      src={secondaryImage}
                      alt="Secondary Project View"
                      aspectRatio="portrait"
                      direction="down"
                      delay={0.2}
                      duration={1.0}
                      className="h-full"
                    />
                  </div>
                </div>

                {/* Architectural Craftsmanship Badge Card */}
                <div className="rounded-[10px] bg-white p-5 flex flex-col justify-between border border-[#EBDEBA] shadow-soft-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#FAF8F2] flex items-center justify-center border border-[#EBDEBA] shadow-2xs">
                      <Award className="w-4.5 h-4.5 text-[#CE9E34]" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#9E741B] bg-[#FAF8F2] px-2 py-0.5 rounded border border-[#EBDEBA]">
                      VERIFIED
                    </span>
                  </div>
                  <div>
                    <span className="font-sans text-sm lg:text-base font-bold text-charcoal-900 block leading-tight">
                      Dedicated Quality
                    </span>
                    <span className="text-xs text-charcoal-700 font-medium block mt-1">
                      Bespoke Millwork &amp; Architectural Glazing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <FadeIn direction="left" delay={0.2}>
              {/* Monospaced Chapter Tag */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9E741B] font-bold">
                  [CHAPTER 01 // ARCHITECTURAL INTENT]
                </span>
              </div>

              {about.badge && <Eyebrow>{about.badge}</Eyebrow>}

              <SectionHeading className="tracking-tight text-3xl sm:text-4xl lg:text-5xl mb-4 leading-[1.12]">
                {about.title}
              </SectionHeading>

              <BodyText className="mb-6 font-normal text-charcoal-700 text-base leading-relaxed">
                {about.description}
              </BodyText>

              {about.pillars && about.pillars.length > 0 && (
                <ul className="space-y-3 mb-8">
                  {about.pillars.map((pillar: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-[6px] bg-white border border-[#EBDEBA] text-xs sm:text-sm text-charcoal-900 font-semibold shadow-2xs transition-all hover:border-[#CE9E34]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#CE9E34] shrink-0" />
                      <span>{pillar}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div>
                <Button href="#interiors" variant="primary" size="md" icon>
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
