/**
 * DEPRECATED: Runtime business content MUST be sourced dynamically from the published
 * Sparovia CMS via `useTemplateContent()` in `@/components/providers/WebsiteContentProvider`.
 * 
 * This file is retained exclusively for structural backwards-compatibility.
 * All client-specific business strings ("Transform Your Space", "KVN Interiors",
 * service lists, testimonials, FAQs) have been removed from this file so they
 * cannot mask API delivery or create dual sources of truth.
 */

export const contentConfig = {
  hero: {
    eyebrow: '',
    headline: '',
    subheadline: '',
    primaryCta: 'Get in Touch',
    secondaryCta: 'Learn More',
  },
  about: {
    badge: '',
    title: '',
    description: '',
    pillars: [] as string[],
  },
  services: {
    eyebrow: '',
    heading: '',
    description: '',
    categories: [] as any[],
  },
  upvc: {
    eyebrow: '',
    heading: '',
    description: '',
    themes: [] as any[],
  },
  ourWork: {
    eyebrow: '',
    heading: '',
    description: '',
    categories: ['All'],
  },
  whyChooseUs: {
    eyebrow: '',
    heading: '',
    description: '',
    items: [] as any[],
  },
  testimonials: {
    enabled: false,
    eyebrow: '',
    heading: '',
    list: [] as any[],
  },
  faq: {
    eyebrow: '',
    heading: '',
    list: [] as any[],
  },
  contact: {
    eyebrow: '',
    heading: '',
    description: '',
    ctaLabel: 'Request Consultation',
  },
  footer: {
    shortDescription: '',
    copyrightText: '',
  },

  // Backward compatibility aliases
  brandIntro: { badge: '', title: '', description: '', pillars: [] as string[] },
  interiors: { eyebrow: '', heading: '', description: '', categories: [] as any[] },
  gallery: { eyebrow: '', heading: '', description: '', categories: ['All'] },
  whyUs: { eyebrow: '', heading: '', description: '', items: [] as any[] },
  faqs: { eyebrow: '', heading: '', list: [] as any[] },
};
