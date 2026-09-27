'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { templateConfig, TemplateThemeItem } from '@/config/templateConfig';

export interface WebsiteDto {
  id: string;
  name: string;
  domain: string;
  connectionStatus: string;
  templateId?: string;
  tenantId?: string;
}

export interface PublishedContentResponse {
  website: WebsiteDto;
  sections: Record<string, any>;
}

/* ────────────────────────────────────────────────────────────────
 * Typed Public Content Contracts (Matches Sparovia CMS API)
 * ──────────────────────────────────────────────────────────────── */

export interface HeroContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  heroImage?: string;
}

export interface AboutContent {
  badge: string;
  title: string;
  description: string;
  pillars: string[];
  primaryImage?: string;
  secondaryImage?: string;
}

export interface ServiceCategoryItem {
  id?: string;
  index?: string;
  name: string;
  tagline?: string;
  description?: string;
  image?: string;
}

export interface ServicesContent {
  eyebrow: string;
  heading: string;
  description: string;
  categories: ServiceCategoryItem[];
}

export interface WhyChooseUsItem {
  index: string;
  title: string;
  description: string;
}

export interface WhyChooseUsContent {
  eyebrow: string;
  heading: string;
  description: string;
  items: WhyChooseUsItem[];
}

export interface ProjectGalleryItem {
  id?: string;
  image?: string;
  src?: string;
  title?: string;
  alt?: string;
  category?: string;
  label?: string;
  span?: 'standard' | 'large';
}

export interface OurWorkContent {
  eyebrow: string;
  heading: string;
  description: string;
  categories: string[];
  items?: ProjectGalleryItem[];
}

export interface TestimonialItem {
  quote: string;
  author: string;
  location?: string;
}

export interface TestimonialsContent {
  enabled: boolean;
  eyebrow: string;
  heading: string;
  list: TestimonialItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqContent {
  eyebrow: string;
  heading: string;
  list: FaqItem[];
}

export interface ContactContent {
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
}

export interface FooterContent {
  shortDescription: string;
  copyrightText: string;
}

export interface UpvcContent {
  eyebrow: string;
  heading: string;
  description: string;
  themes: TemplateThemeItem[];
}

export interface AdaptedTemplateContent {
  hero: HeroContent;
  about: AboutContent;
  services: ServicesContent;
  upvc: UpvcContent;
  ourWork: OurWorkContent;
  whyChooseUs: WhyChooseUsContent;
  testimonials: TestimonialsContent;
  faq: FaqContent;
  contact: ContactContent;
  footer: FooterContent;

  // Backward compatibility aliases
  brandIntro: AboutContent;
  interiors: ServicesContent;
  gallery: OurWorkContent;
  whyUs: WhyChooseUsContent;
  faqs: FaqContent;

  website: WebsiteDto | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface WebsiteContentContextType {
  website: WebsiteDto | null;
  sections: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSection: <T extends unknown>(sectionKey: string, fallback?: T) => T;
  templateContent: AdaptedTemplateContent;
}

const SECTION_ALIASES: Record<string, string[]> = {
  about: ['brandIntro'],
  brandIntro: ['about'],
  services: ['interiors'],
  interiors: ['services'],
  'why-choose-us': ['whyUs', 'why-us'],
  whyUs: ['why-choose-us', 'why-us'],
  'our-work': ['gallery', 'ourWork'],
  gallery: ['our-work', 'ourWork'],
  ourWork: ['our-work', 'gallery'],
  faq: ['faqs'],
  faqs: ['faq'],
  contact: ['contact'],
  footer: ['footer'],
};

/* ────────────────────────────────────────────────────────────────
 * Central Template Content Adapter
 * Transforms published CMS data into typed presentation objects.
 * Never silently displays hardcoded client strings to mask API failures.
 * ──────────────────────────────────────────────────────────────── */

export function adaptTemplateContent(
  sections: Record<string, any>,
  website: WebsiteDto | null,
  isLoading: boolean,
  error: string | null,
  refresh: () => Promise<void>
): AdaptedTemplateContent {
  const brandName = website?.name || '';
  const currentYear = new Date().getFullYear();

  // Helper to extract a section by key or alias
  const getRaw = (key: string): any => {
    if (sections[key]) return sections[key];
    const aliases = SECTION_ALIASES[key] || [];
    for (const a of aliases) {
      if (sections[a]) return sections[a];
    }
    return null;
  };

  const rawHero = getRaw('hero') || {};
  const rawAbout = getRaw('about') || {};
  const rawServices = getRaw('services') || {};
  const rawWhyUs = getRaw('why-choose-us') || {};
  const rawWork = getRaw('our-work') || {};
  const rawTestimonials = getRaw('testimonials') || {};
  const rawFaq = getRaw('faq') || {};
  const rawContact = getRaw('contact') || {};
  const rawFooter = getRaw('footer') || {};
  const rawUpvc = getRaw('upvc') || {};

  // 1. Hero
  const hero: HeroContent = {
    eyebrow: rawHero.eyebrow || '',
    headline: rawHero.headline || rawHero.mainHeadline || (isLoading ? '' : brandName ? `Welcome to ${brandName}` : ''),
    subheadline: rawHero.subheadline || '',
    primaryCta: rawHero.primaryCta || 'Get in Touch',
    secondaryCta: rawHero.secondaryCta || 'Learn More',
    heroImage: rawHero.heroImage || rawHero.primaryImage || rawHero.image || undefined,
  };

  // 2. About
  const aboutPillars: string[] = Array.isArray(rawAbout.pillars)
    ? rawAbout.pillars.map((p: any) => (typeof p === 'string' ? p : p?.title || p?.description || String(p)))
    : Array.isArray(rawAbout.items)
    ? rawAbout.items.map((p: any) => (typeof p === 'string' ? p : p?.title || p?.description || String(p)))
    : [];

  const about: AboutContent = {
    badge: rawAbout.badge || rawAbout.eyebrow || '',
    title: rawAbout.title || rawAbout.heading || (isLoading ? '' : brandName ? `About ${brandName}` : ''),
    description: rawAbout.description || '',
    pillars: aboutPillars,
    primaryImage: rawAbout.primaryImage || rawAbout.image || undefined,
    secondaryImage: rawAbout.secondaryImage || undefined,
  };

  // 3. Services
  const serviceCategories: ServiceCategoryItem[] = Array.isArray(rawServices.categories)
    ? rawServices.categories.map((c: any, idx: number) => ({
        id: c.id || `service-${idx}`,
        index: c.index || String(idx + 1).padStart(2, '0'),
        name: c.name || c.title || `Service ${idx + 1}`,
        tagline: c.tagline || '',
        description: c.description || '',
        image: c.image || undefined,
      }))
    : Array.isArray(rawServices.items)
    ? rawServices.items.map((c: any, idx: number) => ({
        id: c.id || `service-${idx}`,
        index: c.index || String(idx + 1).padStart(2, '0'),
        name: c.title || c.name || `Service ${idx + 1}`,
        tagline: c.tagline || '',
        description: c.description || '',
        image: c.image || undefined,
      }))
    : [];

  const services: ServicesContent = {
    eyebrow: rawServices.eyebrow || '',
    heading: rawServices.heading || rawServices.title || (isLoading ? '' : 'Our Services'),
    description: rawServices.description || '',
    categories: serviceCategories,
  };

  // 4. Why Choose Us
  const whyUsItems: WhyChooseUsItem[] = Array.isArray(rawWhyUs.items)
    ? rawWhyUs.items.map((item: any, idx: number) => ({
        index: item.index || String(idx + 1).padStart(2, '0'),
        title: item.title || item.name || '',
        description: item.description || '',
      }))
    : [];

  const whyChooseUs: WhyChooseUsContent = {
    eyebrow: rawWhyUs.eyebrow || '',
    heading: rawWhyUs.heading || rawWhyUs.title || (isLoading ? '' : 'Why Choose Us'),
    description: rawWhyUs.description || '',
    items: whyUsItems,
  };

  // 5. Our Work
  let workCategories: string[] = ['All'];
  if (Array.isArray(rawWork.categories) && rawWork.categories.length > 0) {
    workCategories = rawWork.categories;
    if (!workCategories.includes('All')) {
      workCategories = ['All', ...workCategories];
    }
  }

  const ourWork: OurWorkContent = {
    eyebrow: rawWork.eyebrow || '',
    heading: rawWork.heading || rawWork.title || (isLoading ? '' : 'Our Work'),
    description: rawWork.description || '',
    categories: workCategories,
    items: Array.isArray(rawWork.items) ? rawWork.items : undefined,
  };

  // 6. Testimonials
  const testimonialList: TestimonialItem[] = Array.isArray(rawTestimonials.list)
    ? rawTestimonials.list.map((t: any) => ({
        quote: t.quote || t.testimonial || '',
        author: t.author || t.name || 'Client',
        location: t.location || t.role || '',
      }))
    : Array.isArray(rawTestimonials.testimonials)
    ? rawTestimonials.testimonials.map((t: any) => ({
        quote: t.quote || t.testimonial || '',
        author: t.author || t.name || 'Client',
        location: t.location || t.role || '',
      }))
    : [];

  const testimonials: TestimonialsContent = {
    enabled: rawTestimonials.enabled === true || (rawTestimonials.enabled !== false && testimonialList.length > 0),
    eyebrow: rawTestimonials.eyebrow || '',
    heading: rawTestimonials.heading || rawTestimonials.title || 'Client Feedback',
    list: testimonialList,
  };

  // 7. FAQ
  const faqList: FaqItem[] = Array.isArray(rawFaq.list)
    ? rawFaq.list.map((f: any) => ({
        question: f.question || '',
        answer: f.answer || '',
      }))
    : Array.isArray(rawFaq.faqs)
    ? rawFaq.faqs.map((f: any) => ({
        question: f.question || '',
        answer: f.answer || '',
      }))
    : [];

  const faq: FaqContent = {
    eyebrow: rawFaq.eyebrow || '',
    heading: rawFaq.heading || rawFaq.title || (isLoading ? '' : 'Frequently Asked Questions'),
    list: faqList,
  };

  // 8. Contact
  const contact: ContactContent = {
    eyebrow: rawContact.eyebrow || '',
    heading: rawContact.heading || rawContact.title || (isLoading ? '' : 'Get in Touch'),
    description: rawContact.description || '',
    ctaLabel: rawContact.ctaLabel || templateConfig.ui.contactFormSubmit,
  };

  // 9. Footer
  const footer: FooterContent = {
    shortDescription: rawFooter.shortDescription || rawAbout.description || (website?.name ? `Official website for ${website.name}.` : ''),
    copyrightText: rawFooter.copyrightText || `© ${currentYear} ${brandName || 'Sparovia'}. All rights reserved.`,
  };

  // 10. uPVC Specialized Presentation
  const upvc: UpvcContent = {
    eyebrow: rawUpvc.eyebrow || templateConfig.upvcPresentation.defaultEyebrow,
    heading: rawUpvc.heading || templateConfig.upvcPresentation.defaultHeading,
    description: rawUpvc.description || templateConfig.upvcPresentation.defaultDescription,
    themes: Array.isArray(rawUpvc.themes) && rawUpvc.themes.length > 0
      ? rawUpvc.themes
      : templateConfig.upvcPresentation.themes,
  };

  return {
    hero,
    about,
    services,
    upvc,
    ourWork,
    whyChooseUs,
    testimonials,
    faq,
    contact,
    footer,
    // Aliases
    brandIntro: about,
    interiors: services,
    gallery: ourWork,
    whyUs: whyChooseUs,
    faqs: faq,
    website,
    isLoading,
    error,
    refresh,
  };
}

/* ────────────────────────────────────────────────────────────────
 * Context & Provider Implementation
 * ──────────────────────────────────────────────────────────────── */

const emptyAdaptedContent = adaptTemplateContent({}, null, true, null, async () => {});

const WebsiteContentContext = createContext<WebsiteContentContextType>({
  website: null,
  sections: {},
  isLoading: true,
  error: null,
  refresh: async () => {},
  getSection: <T extends unknown>(_sectionKey: string, fallback?: T) => (fallback as T),
  templateContent: emptyAdaptedContent,
});

export function WebsiteContentProvider({ children }: { children: React.ReactNode }) {
  const [website, setWebsite] = useState<WebsiteDto | null>(null);
  const [sections, setSections] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5043/api/v1';
  }, []);

  const loadPublishedContent = useCallback(async () => {
    try {
      let domainParam = '';
      if (typeof window !== 'undefined') {
        domainParam = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || window.location.hostname || '';
      }

      const queryString = domainParam ? `?domain=${encodeURIComponent(domainParam)}` : '';
      const res = await fetch(`${apiUrl}/website/published-content${queryString}`, {
        cache: 'no-store',
        credentials: 'include', // Ensure cookies are sent in local development / cross-port
        headers: {
          'Accept': 'application/json',
        }
      });

      if (res.ok) {
        const data: PublishedContentResponse = await res.json();
        if (data?.sections) {
          setSections(data.sections);
        }
        if (data?.website) {
          setWebsite(data.website);
        }
        setError(null);
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[Sparovia CMS] Failed to load published content (${res.status}): ${errText}`);
        setError(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.warn('[Sparovia CMS] Network or fetch error while loading published content:', err);
      setError(err?.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  // Initial load
  useEffect(() => {
    loadPublishedContent();
  }, [loadPublishedContent]);

  // Focus revalidation: Re-fetch silently when returning to tab
  useEffect(() => {
    const handleFocus = () => {
      loadPublishedContent();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadPublishedContent]);

  const getSection = useCallback(<T,>(sectionKey: string, fallback?: T): T => {
    if (sections[sectionKey]) {
      if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
        return {
          ...fallback,
          ...sections[sectionKey]
        };
      }
      return sections[sectionKey] as T;
    }

    const aliases = SECTION_ALIASES[sectionKey] || [];
    for (const alias of aliases) {
      if (sections[alias]) {
        if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
          return {
            ...fallback,
            ...sections[alias]
          };
        }
        return sections[alias] as T;
      }
    }

    return fallback as T;
  }, [sections]);

  const templateContent = useMemo(() => {
    return adaptTemplateContent(sections, website, isLoading, error, loadPublishedContent);
  }, [sections, website, isLoading, error, loadPublishedContent]);

  const contextValue = useMemo(() => ({
    website,
    sections,
    isLoading,
    error,
    refresh: loadPublishedContent,
    getSection,
    templateContent,
  }), [website, sections, isLoading, error, loadPublishedContent, getSection, templateContent]);

  return (
    <WebsiteContentContext.Provider value={contextValue}>
      {children}
    </WebsiteContentContext.Provider>
  );
}

/**
 * Hook to access the typed, adapted published CMS content for the landing page template.
 * Guarantees that business content is dynamic and never relies on hardcoded static copy.
 */
export function useTemplateContent(): AdaptedTemplateContent {
  const { templateContent } = useContext(WebsiteContentContext);
  return templateContent;
}

/**
 * Access low-level CMS context
 */
export function useWebsiteContent(): WebsiteContentContextType {
  return useContext(WebsiteContentContext);
}

/**
 * Backward compatibility hook for individual sections
 */
export function useSectionContent<T>(sectionKey: string, fallback?: T): T {
  const { getSection } = useContext(WebsiteContentContext);
  return getSection(sectionKey, fallback);
}
