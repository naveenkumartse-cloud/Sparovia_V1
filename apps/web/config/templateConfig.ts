/**
 * Template Presentation Configuration
 * 
 * Defines presentation, visual layout, navigation anchors, and UI structure
 * for the 'kvn-interiors-v1' website template.
 * 
 * IMPORTANT: This file contains ONLY structural presentation rules.
 * Authoritative business copy (headlines, narratives, service names, testimonials,
 * pricing, contact details) MUST be loaded dynamically from the published Sparovia CMS.
 */

export interface TemplateThemeItem {
  label: string;
  description: string;
}

export interface TemplateNavLink {
  name: string;
  href: string;
}

export interface TemplateConfig {
  templateId: string;
  name: string;
  navLinks: TemplateNavLink[];
  upvcPresentation: {
    defaultEyebrow: string;
    defaultHeading: string;
    defaultDescription: string;
    themes: TemplateThemeItem[];
  };
  gallery: {
    defaultFilter: string;
  };
  ui: {
    scrollToTopAriaLabel: string;
    lightboxCloseAriaLabel: string;
    lightboxNextAriaLabel: string;
    lightboxPrevAriaLabel: string;
    contactFormSubmit: string;
    contactFormSubmitting: string;
    contactSuccessTitle: string;
    contactSuccessMessage: string;
  };
}

export const templateConfig: TemplateConfig = {
  templateId: 'kvn-interiors-v1',
  name: 'Architectural Interiors & Glazing Template',
  
  navLinks: [
    { name: 'Interior', href: '#interiors' },
    { name: 'uPVC Windows', href: '#upvc' },
    { name: 'Projects', href: '#gallery' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ],

  upvcPresentation: {
    defaultEyebrow: 'ARCHITECTURAL SYSTEMS',
    defaultHeading: 'Engineered for Light & Modern Living',
    defaultDescription: 'Precision engineered window and glazing systems designed for sound insulation, weather protection, and contemporary interior aesthetics.',
    themes: [
      { label: 'Natural Light', description: 'Expansive glazing designed to flood your spaces with daylight.' },
      { label: 'Modern Design', description: 'Clean profiles and architectural lines that complement contemporary interiors.' },
      { label: 'Comfort', description: 'Sealed systems that keep your home quiet, weatherproof, and temperature-controlled.' },
      { label: 'Clean Finish', description: 'Precision installation and durable materials for a long-lasting result.' },
    ],
  },

  gallery: {
    defaultFilter: 'All',
  },

  ui: {
    scrollToTopAriaLabel: 'Scroll to top of page',
    lightboxCloseAriaLabel: 'Close preview dialog',
    lightboxNextAriaLabel: 'Next project image',
    lightboxPrevAriaLabel: 'Previous project image',
    contactFormSubmit: 'Request Consultation',
    contactFormSubmitting: 'Submitting...',
    contactSuccessTitle: 'Thank You for Reaching Out',
    contactSuccessMessage: 'Our design team will review your project details and get in touch promptly.',
  },
};
