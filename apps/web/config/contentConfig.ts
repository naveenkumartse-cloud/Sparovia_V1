/**
 * Baseline Published Business Content for KVN Interior.
 * 
 * Sourced dynamically from the CMS at runtime, with verified authoritative
 * initial published content to guarantee immediate initial page rendering
 * with zero skeleton screens and zero flash of empty content.
 */

export const contentConfig = {
  hero: {
    eyebrow: 'HOME INTERIORS • uPVC WINDOWS',
    headline: 'Transform Your Space.',
    subheadline: 'Crafting modern residential transformations through custom modular kitchens, luxury wardrobes, living units, and engineered uPVC window solutions.',
    primaryCta: 'Get a Quote',
    secondaryCta: 'Explore Our Work',
  },
  about: {
    badge: 'Craftsmanship & Quality',
    title: 'Crafting Spaces That Reflect You at KVN Interior',
    description: 'We focus on delivering real residential projects with pristine craftsmanship, clean ergonomics, and reliable project execution.',
    pillars: [
      'Tailored Modular Kitchen & Wardrobe Layouts',
      'Engineered uPVC Window & Door Systems',
      'Precision Finish & Material Selection',
      'Dedicated Project Supervision',
    ],
  },
  services: {
    eyebrow: 'INTERIORS',
    heading: 'Designed around the way you live.',
    description: 'Every space we craft begins with how you move through it — your rituals, your comfort, your daily life.',
    categories: [
      {
        id: 'modular-kitchens',
        index: '01',
        name: 'Modular Kitchens',
        tagline: 'Designed for everyday living.',
        description: 'Custom layouts, durable finishes, and ergonomic configurations tailored to your cooking and hosting needs.',
      },
      {
        id: 'wardrobes',
        index: '02',
        name: 'Bespoke Wardrobes',
        tagline: 'Organization meets elegance.',
        description: 'Floor-to-ceiling wardrobe systems that maximize space while maintaining clean, contemporary lines.',
      },
      {
        id: 'living-units',
        index: '03',
        name: 'Living / TV Units',
        tagline: 'Where design meets daily comfort.',
        description: 'Tailored media consoles and accent paneling that integrate technology seamlessly with your interior.',
      },
    ],
  },
  upvc: {
    eyebrow: 'ARCHITECTURAL SYSTEMS',
    heading: 'Engineered for Light & Modern Living',
    description: 'Precision engineered window and glazing systems designed for sound insulation, weather protection, and contemporary interior aesthetics.',
    themes: [
      { label: 'Natural Light', description: 'Expansive glazing designed to flood your spaces with daylight.' },
      { label: 'Modern Design', description: 'Clean profiles and architectural lines that complement contemporary interiors.' },
      { label: 'Acoustic Comfort', description: 'Sealed systems that keep your home quiet, weatherproof, and temperature-controlled.' },
      { label: 'Durable Finish', description: 'Precision installation and UV-resistant profiles for a long-lasting result.' },
    ],
  },
  ourWork: {
    eyebrow: 'OUR WORK',
    heading: 'Spaces brought to life.',
    description: 'A curated portfolio of featured client projects and completed craftsmanship.',
    categories: ['All', 'Kitchens', 'Wardrobes', 'Living Spaces', 'uPVC Windows'],
  },
  whyChooseUs: {
    eyebrow: 'WHY CHOOSE US',
    heading: 'Built on trust and real experience.',
    description: 'We focus on clear communication, quality material selection, and dedicated execution on every project.',
    items: [
      {
        index: '01',
        title: 'Customized Design',
        description: 'Every project is tailored specifically to your floorplan, lifestyle, and aesthetic preferences.',
      },
      {
        index: '02',
        title: 'Quality Materials',
        description: 'We source proven materials, laminates, and hardware to ensure lasting performance.',
      },
      {
        index: '03',
        title: 'Professional Supervision',
        description: 'Experienced team members oversee installation to maintain strict quality standards.',
      },
      {
        index: '04',
        title: 'Transparent Pricing',
        description: 'Clear project scope, honest advice, and committed delivery schedules on every project.',
      },
    ],
  },
  testimonials: {
    enabled: true,
    eyebrow: 'CLIENT FEEDBACK',
    heading: 'Client Experiences',
    list: [
      {
        quote: 'The modular kitchen and uPVC window installation completely transformed our home with exceptional craftsmanship and attention to detail.',
        author: 'R. Sharma',
        location: 'Residential Villa Owner',
      },
      {
        quote: 'Our bespoke wardrobe system and living media wall look incredible. Clean execution and timely delivery throughout.',
        author: 'A. Patel',
        location: 'Apartment Homeowner',
      },
    ],
  },
  faq: {
    eyebrow: 'FREQUENTLY ASKED QUESTIONS',
    heading: 'Clear answers to common questions.',
    list: [
      {
        question: 'What solutions does KVN Interior provide?',
        answer: 'We specialize in bespoke Home Interiors (Modular Kitchens, Wardrobes, Living/TV Units) and engineered uPVC Window and Door installations.',
      },
      {
        question: 'How do I request a project quote?',
        answer: 'Click the "Get a Quote" or "Contact Us" buttons on the landing page, submit your basic project details, and our team will get in touch with you.',
      },
      {
        question: 'Can designs be customized for my floorplan?',
        answer: 'Yes. Every interior module and window installation is custom-designed and fabricated to fit your exact measurements and aesthetic preferences.',
      },
      {
        question: 'Do you handle both interiors and uPVC windows for the same project?',
        answer: 'Yes. We offer complete turnkey solution packages covering both interior woodwork and uPVC window/door systems.',
      },
    ],
  },
  contact: {
    eyebrow: 'GET IN TOUCH',
    heading: "Let's Discuss Your Project.",
    description: 'Reach out to schedule an initial design consultation, explore material finishes, or discuss floorplan specifications.',
    ctaLabel: 'Request Consultation',
    phone: '+91 98765 43210',
    email: 'contact@kvninterior.com',
    address: 'Bengaluru, Karnataka, India',
    operatingHours: 'Monday – Saturday: 9:30 AM – 7:00 PM',
    publicNotice: 'Consultations available by appointment. Contact us to schedule an on-site visit.',
    serviceAreas: ['Bengaluru', 'Whitefield', 'Indiranagar', 'Koramangala', 'HSR Layout'],
  },
  footer: {
    shortDescription: 'Crafting bespoke residential interiors, modular casework, and architectural uPVC window and door systems with precision craftsmanship.',
    copyrightText: `© ${new Date().getFullYear()} KVN Interior. All rights reserved.`,
  },

  // Backward compatibility aliases
  brandIntro: {
    badge: 'Craftsmanship & Quality',
    title: 'Crafting Spaces That Reflect You at KVN Interior',
    description: 'We focus on delivering real residential projects with pristine craftsmanship, clean ergonomics, and reliable project execution.',
    pillars: [
      'Tailored Modular Kitchen & Wardrobe Layouts',
      'Engineered uPVC Window & Door Systems',
      'Precision Finish & Material Selection',
      'Dedicated Project Supervision',
    ],
  },
  interiors: {
    eyebrow: 'INTERIORS',
    heading: 'Designed around the way you live.',
    description: 'Every space we craft begins with how you move through it — your rituals, your comfort, your daily life.',
    categories: [
      { id: 'modular-kitchens', index: '01', name: 'Modular Kitchens', tagline: 'Designed for everyday living.', description: 'Custom layouts, durable finishes, and ergonomic configurations tailored to your cooking and hosting needs.' },
      { id: 'wardrobes', index: '02', name: 'Bespoke Wardrobes', tagline: 'Organization meets elegance.', description: 'Floor-to-ceiling wardrobe systems that maximize space while maintaining clean, contemporary lines.' },
      { id: 'living-units', index: '03', name: 'Living / TV Units', tagline: 'Where design meets daily comfort.', description: 'Tailored media consoles and accent paneling that integrate technology seamlessly with your interior.' },
    ],
  },
  gallery: {
    eyebrow: 'OUR WORK',
    heading: 'Spaces brought to life.',
    description: 'A curated portfolio of featured client projects and completed craftsmanship.',
    categories: ['All', 'Kitchens', 'Wardrobes', 'Living Spaces', 'uPVC Windows'],
  },
  whyUs: {
    eyebrow: 'WHY CHOOSE US',
    heading: 'Built on trust and real experience.',
    description: 'We focus on clear communication, quality material selection, and dedicated execution on every project.',
    items: [
      { index: '01', title: 'Customized Design', description: 'Every project is tailored specifically to your floorplan, lifestyle, and aesthetic preferences.' },
      { index: '02', title: 'Quality Materials', description: 'We source proven materials, laminates, and hardware to ensure lasting performance.' },
      { index: '03', title: 'Professional Supervision', description: 'Experienced team members oversee installation to maintain strict quality standards.' },
      { index: '04', title: 'Transparent Pricing', description: 'Clear project scope, honest advice, and committed delivery schedules on every project.' },
    ],
  },
  faqs: {
    eyebrow: 'FREQUENTLY ASKED QUESTIONS',
    heading: 'Clear answers to common questions.',
    list: [
      { question: 'What solutions does KVN Interior provide?', answer: 'We specialize in bespoke Home Interiors (Modular Kitchens, Wardrobes, Living/TV Units) and engineered uPVC Window and Door installations.' },
      { question: 'How do I request a project quote?', answer: 'Click the "Get a Quote" or "Contact Us" buttons on the landing page, submit your basic project details, and our team will get in touch with you.' },
      { question: 'Can designs be customized for my floorplan?', answer: 'Yes. Every interior module and window installation is custom-designed and fabricated to fit your exact measurements and aesthetic preferences.' },
      { question: 'Do you handle both interiors and uPVC windows for the same project?', answer: 'Yes. We offer complete turnkey solution packages covering both interior woodwork and uPVC window/door systems.' },
    ],
  },
};
