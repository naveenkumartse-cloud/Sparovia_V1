'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { mediaConfig, MediaItem } from '@/config/mediaConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { RevealImage } from '@/components/ui/RevealImage';
import { FadeIn } from '@/components/ui/Motion';
import { Maximize2, X, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import Image from 'next/image';

export default function ProjectGallerySection() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { ourWork } = useTemplateContent();
  const categories = ourWork.categories;

  // Support dynamic items from CMS if provided, or fallback to mediaConfig.gallery
  const rawGalleryItems: MediaItem[] = useMemo(() => {
    if (Array.isArray(ourWork.items) && ourWork.items.length > 0) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL 
        || process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/v1\/?$/, '') 
        || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' 
            ? 'https://sparovia-api.onrender.com' 
            : 'http://localhost:5043');
      return ourWork.items.map((item: any, idx: number) => {
        let src = item.image || item.src || '';
        if (src.startsWith('/api/')) {
          src = `${apiBase}${src}`;
        }
        return {
          id: item.id || `cms-gallery-${idx}`,
          src: src || mediaConfig.gallery[idx % mediaConfig.gallery.length].src,
          alt: item.title || item.alt || item.label || 'Project Gallery Item',
          category: item.category || 'All',
          label: item.title || item.label || 'Project View',
          span: item.span || (idx === 0 ? 'large' : 'standard'),
        };
      });
    }
    return mediaConfig.gallery;
  }, [ourWork]);

  const filteredItems = activeFilter === 'All'
    ? rawGalleryItems
    : rawGalleryItems.filter((item) => (item.category || '').toLowerCase() === activeFilter.toLowerCase());

  const selectedItem: MediaItem | null = selectedIndex !== null ? filteredItems[selectedIndex] ?? null : null;

  const navigateNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % filteredItems.length);
  }, [selectedIndex, filteredItems.length]);

  const navigatePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + filteredItems.length) % filteredItems.length);
  }, [selectedIndex, filteredItems.length]);

  // Move focus to close button when lightbox opens
  useEffect(() => {
    if (selectedIndex !== null) {
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      if (triggerRef.current) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [selectedIndex]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedIndex]);

  const lightboxRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation & focus containment for lightbox
  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedIndex(null);
        return;
      }
      if (e.key === 'ArrowRight') {
        navigateNext();
        return;
      }
      if (e.key === 'ArrowLeft') {
        navigatePrev();
        return;
      }
      if (e.key === 'Tab' && lightboxRef.current) {
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusable = lightboxRef.current.querySelectorAll<HTMLElement>(focusableSelector);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, navigateNext, navigatePrev]);

  const getGridSpanClass = (span?: string) => {
    switch (span) {
      case 'large':
        return 'lg:col-span-8 aspect-[16/10]';
      case 'full':
        return 'lg:col-span-12 md:col-span-2 aspect-[21/9] min-h-[320px]';
      case 'tall':
        return 'lg:col-span-4 aspect-[3/4]';
      case 'standard':
      default:
        return 'lg:col-span-4 aspect-[4/3]';
    }
  };

  return (
    <Section id="gallery" background="surface" padding="default" className="relative bg-[#FAF8F2] overflow-hidden">
      <Container>

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-14 gap-6">
          <div className="max-w-2xl">
            <FadeIn direction="up">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9E741B] font-bold block mb-2">
                [CHAPTER 04 // RESIDENTIAL PORTFOLIO]
              </span>
            </FadeIn>
            <FadeIn direction="up" delay={0.1}>
              <Eyebrow icon={false}>{ourWork.eyebrow || 'EXPLORE OUR WORK'}</Eyebrow>
            </FadeIn>
            <FadeIn direction="up" delay={0.15}>
              <SectionHeading className="tracking-tight text-3xl sm:text-4xl lg:text-5xl">
                {ourWork.heading || 'Curated Project Archives'}
              </SectionHeading>
            </FadeIn>
            <FadeIn direction="up" delay={0.2}>
              <Subheading className="text-charcoal-600 text-base sm:text-lg">
                {ourWork.description || 'A photographic survey of our bespoke residential interior fit-outs and architectural uPVC fenestration across Bengaluru.'}
              </Subheading>
            </FadeIn>
          </div>

          {/* Filter Bar with Double-Bezel Styling */}
          <FadeIn direction="up" delay={0.25}>
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-white border border-[#EBDEBA] shadow-2xs" role="tablist" aria-label="Project categories">
              {categories.map((cat) => {
                const isActive = activeFilter === cat;
                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveFilter(cat);
                      setSelectedIndex(null);
                    }}
                    className={`px-4 sm:px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all duration-200 focus-ring cursor-pointer ${
                      isActive
                        ? 'bg-[#0044A7] text-white shadow-sm'
                        : 'bg-transparent text-charcoal-700 hover:text-[#0044A7] hover:bg-[#FAF8F2]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </FadeIn>
        </div>

        {/* Asymmetrical Editorial Gallery Grid */}
        <motion.div
          layout={!shouldReduceMotion}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout={!shouldReduceMotion}
                initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={getGridSpanClass(item.span)}
              >
                <div
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget as HTMLElement;
                    setSelectedIndex(index);
                  }}
                  className="double-bezel h-full w-full cursor-pointer group focus-ring relative"
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${item.label}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      triggerRef.current = e.currentTarget as HTMLElement;
                      setSelectedIndex(index);
                    }
                  }}
                >
                  <div className="double-bezel-inner h-full w-full relative">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay for Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />

                    {/* Category Pill Badge (Top Left) */}
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <span className="px-2.5 py-1 rounded-[4px] bg-white/95 backdrop-blur-md border border-[#EBDEBA] text-[#9E741B] text-[10px] font-mono uppercase tracking-wider font-bold shadow-2xs">
                        {item.category}
                      </span>
                    </div>

                    {/* View Icon Button (Top Right) */}
                    <div className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-[6px] bg-white/90 backdrop-blur-md flex items-center justify-center text-charcoal-900 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 shadow-xs">
                      <Maximize2 className="w-4 h-4 text-[#0044A7]" />
                    </div>

                    {/* Content (Bottom Left) */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 text-white pointer-events-none">
                      <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#CE9E34] font-bold mb-1">
                        RESIDENTIAL ATELIER
                      </span>
                      <h3 className="font-sans text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                        {item.label}
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </Container>

      {/* Accessible Project Lightbox Dialog */}
      <AnimatePresence>
        {selectedItem && (
          <div
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedItem.label} project details`}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 lg:p-8"
          >
            {/* Backdrop click to close */}
            <div
              className="absolute inset-0 z-0"
              onClick={() => setSelectedIndex(null)}
              aria-hidden="true"
            />

            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={() => setSelectedIndex(null)}
              className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-ring cursor-pointer border border-white/20"
              aria-label="Close image lightbox"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Previous Image Button */}
            {filteredItems.length > 1 && (
              <button
                onClick={navigatePrev}
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-ring cursor-pointer border border-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Image Button */}
            {filteredItems.length > 1 && (
              <button
                onClick={navigateNext}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-ring cursor-pointer border border-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Lightbox Content Card with Double-Bezel Framing */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 max-w-5xl w-full bg-[#0E1422] rounded-2xl overflow-hidden shadow-2xl border border-white/15 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
            >
              {/* Image View */}
              <div className="relative h-[260px] sm:h-[360px] md:h-auto md:flex-1 md:min-h-[540px] bg-black flex-shrink-0">
                <Image
                  src={selectedItem.src}
                  alt={selectedItem.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 65vw"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Sidebar Info */}
              <div className="w-full md:w-88 p-6 sm:p-8 flex flex-col justify-between bg-[#0E1422] border-t md:border-t-0 md:border-l border-white/10 overflow-y-auto">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#CE9E34] font-bold block mb-2">
                    {selectedItem.category}
                  </span>
                  <h3 className="font-sans text-2xl font-bold text-white mb-3 tracking-tight">
                    {selectedItem.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 font-normal">
                    {selectedItem.alt}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Button
                    href="#contact"
                    variant="primary"
                    size="md"
                    icon
                    className="w-full text-center bg-[#0044A7] hover:bg-[#00388A] text-white border border-[#CE9E34]"
                    onClick={() => setSelectedIndex(null)}
                  >
                    Enquire for this Style
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Section>
  );
}
