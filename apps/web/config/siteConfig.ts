/**
 * Site presentation and navigation defaults.
 * 
 * Authoritative business copy (name, description, contact details, services)
 * must be sourced dynamically from the CMS / Business Context.
 */
export const siteConfig = {
  name: 'Sparovia',
  tagline: 'Home Interiors & Architectural Systems',
  description: 'Transforming spaces with custom modular interiors and engineered architectural systems.',
  
  contact: {
    phone: '',
    email: '',
    address: '',
    workingHours: '',
  },
  
  social: {
    whatsapp: '',
    instagram: '',
    facebook: '',
  },
  
  cta: {
    primary: 'Get in Touch',
    secondary: 'Explore Our Work',
  },

  navLinks: [
    { name: 'Interior', href: '#interiors' },
    { name: 'uPVC Windows', href: '#upvc' },
    { name: 'Projects', href: '#gallery' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ],
};
