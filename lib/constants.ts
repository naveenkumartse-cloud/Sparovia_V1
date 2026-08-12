export interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'kitchens' | 'wardrobes' | 'living' | 'upvc' | 'fullhome';
  description: string;
  image: string;
  features: string[];
  specs: { label: string; value: string }[];
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  location: string;
  image: string;
  aspectRatio: 'square' | 'portrait' | 'landscape';
  tag: string;
  details: string;
}

export const NAV_LINKS = [
  { name: 'Showroom', href: '#showroom' },
  { name: 'Philosophy', href: '#philosophy' },
  { name: 'Categories', href: '#categories' },
  { name: 'Storytelling', href: '#storytelling' },
  { name: 'uPVC Windows', href: '#upvc-engineering' },
  { name: 'Craftsmanship', href: '#craftsmanship' },
  { name: 'Portfolio', href: '#portfolio' },
];

export const HERO_SLIDES = [
  {
    id: 1,
    title: 'Architectural Excellence & Turnkey Interiors',
    subtitle: 'SPAROVIA CLIENT EDITION',
    description: 'Transforming luxury residences with precision modular kitchens, bespoke wardrobes, customized living units, and engineered uPVC window systems.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
    tag: 'Living & Interior Architecture',
  },
  {
    id: 2,
    title: 'Modular Kitchen Systems Built for Elegance',
    subtitle: 'ERGERNOMICS & LUXURY',
    description: 'Seamless acrylic, matte lacquer, and solid wood finishes paired with Blum hardware for lifetime durability.',
    image: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=2070&auto=format&fit=crop',
    tag: 'Bespoke Kitchens',
  },
  {
    id: 3,
    title: 'High-Performance German uPVC Window Installations',
    subtitle: 'ACOUSTIC & THERMAL COMFORT',
    description: 'Engineered multi-chamber profile windows with double-tinted acoustic glazing, dust sealing, and multi-point security locking.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop',
    tag: 'uPVC Glazing & Doors',
  },
];

export const CATEGORY_DATA: CategoryItem[] = [
  {
    id: 'modular-kitchens',
    title: 'Bespoke Modular Kitchens',
    subtitle: 'Island, Parallel & L-Shaped Layouts',
    category: 'kitchens',
    description: 'Precision-engineered modular kitchen setups with soft-close Blum/Hettich hardware, anti-fingerprint acrylic laminate, quartz countertops, and smart pantry units.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2070&auto=format&fit=crop',
    features: ['Blum Soft-Close Systems', 'Quartz & Granite Tops', 'Hydraulic Lift-Up Shutter Doors', 'Built-in Appliance Columns'],
    specs: [
      { label: 'Warranty', value: '10 Years Structural' },
      { label: 'Finish Options', value: 'Acrylic, Lacquer, Veneer' },
      { label: 'Hardware', value: 'Hettich / Blum / Hafele' },
    ],
  },
  {
    id: 'luxury-wardrobes',
    title: 'Walk-In & Sliding Wardrobes',
    subtitle: 'Floor-to-Ceiling Storage Solutions',
    category: 'wardrobes',
    description: 'Custom fitted wardrobe systems featuring glass-fronted display doors, integrated sensor LED illumination, velvet jewelry trays, and pull-down hanger rods.',
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=2069&auto=format&fit=crop',
    features: ['Fluted Glass Sliding Doors', 'Automated PIR LED Strips', 'Custom Modular Organizers', 'Soft-Touch Leather Accents'],
    specs: [
      { label: 'System', value: 'Top-Hung Sliding / Hinged' },
      { label: 'Internal Frame', value: 'HDMR High Density Board' },
      { label: 'Lighting', value: '3000K Warm Sensor LEDs' },
    ],
  },
  {
    id: 'living-tv-units',
    title: 'Living & Media Wall Systems',
    subtitle: 'Acoustic Panels & Ambient Illumination',
    category: 'living',
    description: 'Bespoke media consoles integrated with fluted charcoal panels, Italian marble backdrops, hidden wire management, and ambient backlighting.',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop',
    features: ['Italian Composite Marble Cladding', 'Concealed Cable Raceways', 'Acoustic Wood Slat Paneling', 'Floating Console Units'],
    specs: [
      { label: 'Material', value: 'BWR Plywood + Veneer' },
      { label: 'Finish', value: 'PU Matte / High Gloss' },
      { label: 'Integration', value: 'Surround Sound Mounts' },
    ],
  },
  {
    id: 'upvc-windows',
    title: 'uPVC Windows & Door Systems',
    subtitle: 'Acoustic & Weather-Shielded Glazing',
    category: 'upvc',
    description: 'Premium German-profile uPVC casement, sliding, and tilt-and-turn windows engineered for up to 40dB noise reduction, wind resistance, and zero water seepage.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop',
    features: ['Multi-Chambered Profiles', 'Double Toughened Low-E Glass', 'Multi-Point Locking Bolts', 'EPMD Weather Gaskets'],
    specs: [
      { label: 'Noise Reduction', value: 'Up to 40 dB' },
      { label: 'Profile Warranty', value: '20 Years UV Colorfast' },
      { label: 'Wind Load', value: 'Tested up to 3000 Pa' },
    ],
  },
  {
    id: 'full-home-interiors',
    title: 'Turnkey Luxury Villa Interiors',
    subtitle: 'Complete Spatial Transformation',
    category: 'fullhome',
    description: 'End-to-end design and execution encompassing false ceilings, custom carpentry, lighting design, wall cladding, and loose furniture coordination.',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop',
    features: ['False Ceiling & COBE Lighting', 'Designer Partition Panels', 'Bespoke Fixed Furniture', 'Turnkey Site Supervision'],
    specs: [
      { label: 'Timeline', value: '45-60 Days Delivery' },
      { label: 'Execution', value: 'In-House Skilled Artisans' },
      { label: 'Quality Checks', value: '150-Point Inspection' },
    ],
  },
];

export const STICKY_STORY_STEPS = [
  {
    step: '01',
    title: 'Architectural Blueprint & Site Survey',
    subtitle: 'Precision 3D Laser Scanning & Ergonomic Layouts',
    description: 'Every project begins with millimeter-precise laser measurement of walls, electrical points, and plumbing layout to eliminate on-site discrepancies.',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2070&auto=format&fit=crop',
  },
  {
    step: '02',
    title: 'Precision Factory Crafting & Modular Cut',
    subtitle: 'German Homag CNC Machinery & Zero-Joint Edgeband',
    description: 'Panels are processed using automated CNC cutting machines for pristine zero-gap edge banding, ensuring high moisture resistance and flawless finish.',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop',
  },
  {
    step: '03',
    title: 'uPVC Frame Alignment & Sealant Injection',
    subtitle: 'Structural Anchorage & Dual Weatherproofing',
    description: 'Heavy-duty steel-reinforced uPVC window frames anchored directly into masonry with non-shrinking polyurethane foam and acoustic sealants.',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2062&auto=format&fit=crop',
  },
  {
    step: '04',
    title: 'Final Handover & Pristine Living Transformation',
    subtitle: '150-Point Quality Audit & Deep Clean Service',
    description: 'The finished space is thoroughly audited for hinge smooth-action, alignment, electrical safety, and handed over ready for immediate luxury living.',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=2070&auto=format&fit=crop',
  },
];

export const CRAFTSMANSHIP_DETAILS = [
  {
    title: 'Zero-Joint Edge Banding',
    category: 'Material Finish',
    description: 'Seamless PUR glue technology prevents moisture ingress and delamination even in humid kitchen environments.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop',
  },
  {
    title: 'Multi-Chambered uPVC Profiles',
    category: 'Window Engineering',
    description: 'Heavy steel reinforcement inserts prevent frame distortion under high wind loads on high-rise residential towers.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop',
  },
  {
    title: 'Bespoke Fluted & Tinted Glass',
    category: 'Wardrobe Accents',
    description: 'Custom anodized aluminum frames fitted with shatterproof bronze glass shutters and integrated warm LED profiles.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1932&auto=format&fit=crop',
  },
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'proj-1',
    title: 'The Sky Villa Residency',
    category: 'Full Home Interior',
    location: 'Penthouse • 4,200 Sq.Ft.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop',
    aspectRatio: 'landscape',
    tag: 'Turnkey Luxury',
    details: 'Complete interior design featuring continuous veneer panelling, open island kitchen, and acoustic double-glazed uPVC sliding doors.',
  },
  {
    id: 'proj-2',
    title: 'Minimalist Parallel Kitchen',
    category: 'Modular Kitchen',
    location: 'Modern Apartment',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2070&auto=format&fit=crop',
    aspectRatio: 'portrait',
    tag: 'Matte Lacquer',
    details: 'Handleless Gola profile cabinetry with quartz backsplash and concealed breakfast nook.',
  },
  {
    id: 'proj-3',
    title: 'Grand Walk-in Suite',
    category: 'Bespoke Wardrobe',
    location: 'Private Residence',
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=2069&auto=format&fit=crop',
    aspectRatio: 'square',
    tag: 'Walk-In Wardrobe',
    details: 'Central island dresser with velvet watch display drawers and floor-to-ceiling glass wardrobes.',
  },
  {
    id: 'proj-4',
    title: 'Acoustic uPVC Villa Fenestration',
    category: 'uPVC Windows',
    location: 'Coastal Residence',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
    aspectRatio: 'landscape',
    tag: 'uPVC Glazing',
    details: 'Large format lift-and-slide uPVC doors with multi-point locking for panoramic sea view and wind resistance.',
  },
  {
    id: 'proj-5',
    title: 'Marble & Fluted Living Media Wall',
    category: 'Living Unit',
    location: 'Luxury Duplex',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop',
    aspectRatio: 'portrait',
    tag: 'Living Accent',
    details: 'Custom floating console paired with book-matched Italian marble paneling and acoustic wood slats.',
  },
];

export const TRUST_METRICS = [
  { value: '450+', label: 'Luxury Homes Transformed' },
  { value: '10 Yrs', label: 'Modular Cabinetry Warranty' },
  { value: '20 Yrs', label: 'uPVC Profile Durability' },
  { value: '100%', label: 'In-House Skilled Artisans' },
];
