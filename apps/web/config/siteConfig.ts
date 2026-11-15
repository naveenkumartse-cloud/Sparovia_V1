/**
 * Site presentation and navigation defaults.
 * 
 * Authoritative business copy (name, description, contact details, services)
 * must be sourced dynamically from the CMS / Business Context.
 */
export const siteConfig = {
  name: 'KVN Interior',
  tagline: 'uPVC Windows • Doors • Home Interior',
  description: '',
  
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
    primary: 'Get a Quote',
    secondary: 'Explore Our Work',
  },

  navLinks: [
    { name: 'Interior', href: '#interiors' },
    { name: 'uPVC Windows', href: '#upvc' },
    { name: 'Projects', href: '#gallery' },
    { name: 'About', href: '#about' },
    { name: 'Why Us', href: '#why-us' },
    { name: 'Contact', href: '#contact' },
  ],
};
