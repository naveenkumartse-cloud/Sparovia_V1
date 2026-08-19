'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { contentConfig } from '@/config/contentConfig';
import { mediaConfig, MediaItem } from '@/config/mediaConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, Subheading } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function ProjectGallerySection() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  // Focus management refs for lightbox accessibility
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const categories = contentConfig.gallery.categories;

  const filteredItems = activeFilter === 'All'
    ? mediaConfig.gallery
    : mediaConfig.gallery.filter((item) => item.category === activeFilter);

  const selectedItem: MediaItem | null = selectedIndex !== null ? filteredItems[selectedIndex] ?? null : null;

  const navigateNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % filteredItems.length);
  }, [selectedIndex, filteredItems.length]);

  const navigatePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + filteredItems.length) % filteredItems.length);
  }, [selectedIndex, filteredItems.length]);

  // Move focus to close button when lightbox opens; restore on close
  useEffect(() => {
    if (selectedIndex !== null) {
      // Small delay lets the DOM render before focusing
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      // Restore focus to the gallery item that opened the lightbox
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

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null);
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      } else if (e.key === 'ArrowLeft') {
        navigatePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, navigateNext, navigatePrev]);

  // Helper for responsive editorial grid span
  const getGridSpanClass = (span?: string) => {
    switch (span) {
      case 'large':
        return 'lg:col-span-8 aspect-[16/10]';
      case 'full':
        return 'lg:col-span-12 md:col-span-2 aspect-[21/9] min-h-[300px]';
      case 'tall':
        return 'lg:col-span-4 aspect-[3/4]';
      case 'standard':
      default:
        return 'lg:col-span-4 aspect-[4/3]';
    }
  };

  return (
    <Section id="gallery" background="surface" padding="spacious">
      <Container>

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div className="max-w-2xl">
            <FadeIn direction="up">
              <Eyebrow icon={false}>
                {contentConfig.gallery.eyebrow}
              </Eyebrow>
            </FadeIn>
            <FadeIn direction="up" delay={0.1}>
              <SectionHeading>
                {contentConfig.gallery.heading}
              </SectionHeading>
            </FadeIn>
            <FadeIn direction="up" delay={0.15}>
              <Subheading>
                {contentConfig.gallery.description}
              </Subheading>
            </FadeIn>
          </div>

          {/* Filter Bar */}
          <FadeIn direction="up" delay={0.2}>
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Project categories">
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
                    className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold transition-all duration-300 focus-ring cursor-pointer ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-purple-glow'
                        : 'bg-white text-charcoal-700 hover:text-brand-600 border border-gray-200/80 hover:border-brand-200'
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
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
                className={getGridSpanClass(item.span)}
              >
                <div
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget as HTMLElement;
                    setSelectedIndex(index);
                  }}
                  className="relative w-full h-full rounded-2xl overflow-hidden bg-surface border border-gray-100 shadow-soft-sm group cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${item.label} project image`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      triggerRef.current = e.currentTarget as HTMLElement;
                      setSelectedIndex(index);
                    }
                  }}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Gradient Overlay for Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Category Pill Badge (Top Left) */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 rounded-full badge-purple text-[10px] uppercase tracking-widest font-bold shadow-soft-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* View Icon Button (Top Right) */}
                  <div className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-charcoal-900 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 shadow-sm">
                    <Maximize2 className="w-4 h-4 text-brand-600" />
                  </div>

                  {/* Content (Bottom Left) */}
                  <div className="absolute bottom-5 left-5 right-5 z-10 text-white pointer-events-none">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-brand-300 font-bold mb-1">
                      KVN Interiors Project
                    </span>
                    <h3 className="font-sans text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                      {item.label}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </Container>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem !== null && (
          <div
            className="fixed inset-0 z-50 bg-charcoal-900/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`Project image: ${selectedItem.alt}`}
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
              className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-ring cursor-pointer"
              aria-label="Close image lightbox"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Previous Image Button */}
            {filteredItems.length > 1 && (
              <button
                onClick={navigatePrev}
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-ring cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Image Button */}
            {filteredItems.length > 1 && (
              <button
                onClick={navigateNext}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-ring cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Lightbox Content Card */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
            >
              {/* Image View */}
              <div className="relative h-[220px] sm:h-[300px] md:h-auto md:flex-1 md:min-h-[500px] bg-charcoal-900 flex-shrink-0">
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
              <div className="w-full md:w-80 p-5 sm:p-6 md:p-8 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-gray-100 overflow-y-auto">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-brand-600 font-bold block mb-2">
                    {selectedItem.category}
                  </span>
                  <h3 className="font-sans text-xl sm:text-2xl font-bold text-charcoal-900 mb-3">
                    {selectedItem.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed mb-6">
                    {selectedItem.alt}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button
                    href="#contact"
                    variant="primary"
                    size="md"
                    icon
                    className="w-full text-center"
                    onClick={() => setSelectedIndex(null)}
                  >
                    Get a Quote
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
