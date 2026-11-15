/**
 * Baseline structural schema defaults for the Sparovia Public Landing Page.
 * 
 * Sourced dynamically from the published Sparovia CMS via `useTemplateContent()`
 * in `@/components/providers/WebsiteContentProvider`.
 * 
 * All tenant-specific business copy (headlines, descriptions, services, testimonials,
 * FAQs) must come from the published CMS to ensure the Admin Panel remains the sole
 * authority of content.
 */

export const contentConfig = {
  hero: {
    eyebrow: '',
    headline: '',
    subheadline: '',
    primaryCta: 'Get a Quote',
    secondaryCta: 'Explore Our Work',
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
    phone: '',
    email: '',
    address: '',
    operatingHours: '',
    publicNotice: '',
    serviceAreas: [] as string[],
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
