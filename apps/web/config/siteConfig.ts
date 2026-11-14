/**
 * Site presentation and navigation defaults for KVN Interior.
 * 
 * Authoritative business copy (name, description, contact details, services)
 * is sourced dynamically from the CMS / Business Context with robust initial fallbacks.
 */
export const siteConfig = {
  name: 'KVN Interior',
  tagline: 'uPVC Windows • Doors • Home Interior',
  description: 'Crafting bespoke residential interiors, modular kitchens, luxury wardrobes, and engineered uPVC window and door systems with precision craftsmanship.',
  
  contact: {
    phone: '+91 98765 43210',
    email: 'contact@kvninterior.com',
    address: 'Bengaluru, Karnataka, India',
    workingHours: 'Monday – Saturday: 9:30 AM – 7:00 PM',
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
