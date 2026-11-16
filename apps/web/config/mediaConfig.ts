export interface MediaItem {
  id: string;
  src: string;
  alt: string;
  category: string;
  label: string;
  span?: 'large' | 'full' | 'standard' | 'tall';
}

export const mediaConfig = {
  hero: {
    primaryImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1920&auto=format&fit=crop',
    alt: 'Bespoke Luxury Interior Architecture with Panoramic Precision Glazing',
  },
  brandIntro: {
    primaryImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=75&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=75&w=800&auto=format&fit=crop',
  },
  interiors: {
    kitchens: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=75&w=1200&auto=format&fit=crop',
    wardrobes: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=75&w=1200&auto=format&fit=crop',
    living: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=75&w=1200&auto=format&fit=crop',
  },
  upvc: {
    primaryImage: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?q=75&w=1920&auto=format&fit=crop',
    primaryAlt: 'Architectural uPVC floor-to-ceiling sliding glazing system flooding interior with natural light',
    gallery: [
      {
        src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=75&w=800&auto=format&fit=crop',
        alt: 'Floor-to-ceiling multi-track uPVC sliding door system with garden patio view',
        label: 'Sliding Door System',
      },
      {
        src: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=75&w=800&auto=format&fit=crop',
        alt: 'Precision engineered uPVC casement windows with clean white architectural profiles',
        label: 'Casement Windows',
      },
      {
        src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=75&w=800&auto=format&fit=crop',
        alt: 'Expansive panoramic fixed uPVC window framing landscape with slim sightlines',
        label: 'Panoramic Glazing',
      },
      {
        src: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?q=75&w=800&auto=format&fit=crop',
        alt: 'Double-leaf architectural uPVC French balcony doors with multi-point security hardware',
        label: 'French Doors',
      },
    ],
  },
  gallery: [
    {
      id: 'g-1',
      src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=75&w=1000&auto=format&fit=crop',
      alt: 'Luxury Bespoke Modular Island Kitchen with Waterfall Marble Countertops',
      category: 'Kitchens',
      label: 'Modular Kitchen',
      span: 'large',
    },
    {
      id: 'g-2',
      src: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=75&w=800&auto=format&fit=crop',
      alt: 'Custom Built-in Walk-in Wardrobe with Integrated Organizers',
      category: 'Wardrobes',
      label: 'Bespoke Wardrobe',
      span: 'standard',
    },
    {
      id: 'g-3',
      src: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=75&w=800&auto=format&fit=crop',
      alt: 'Contemporary Open-Plan Living Lounge with Custom Architectural Shelving',
      category: 'Living Spaces',
      label: 'Living Space',
      span: 'standard',
    },
    {
      id: 'g-4',
      src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=75&w=1200&auto=format&fit=crop',
      alt: 'Full-Span Architectural uPVC Sliding Glazing System and Patio Doors',
      category: 'uPVC Windows',
      label: 'uPVC Window System',
      span: 'full',
    },
    {
      id: 'g-5',
      src: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=75&w=800&auto=format&fit=crop',
      alt: 'Floating Media TV Console with Vertical Timber Acoustic Slat Wall Paneling',
      category: 'Living Spaces',
      label: 'Living / TV Unit',
      span: 'standard',
    },
    {
      id: 'g-6',
      src: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?q=75&w=800&auto=format&fit=crop',
      alt: 'Contemporary Modular Island Kitchen with Integrated Ergonomic Cabinetry',
      category: 'Kitchens',
      label: 'Island Kitchen',
      span: 'standard',
    },
    {
      id: 'g-7',
      src: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=75&w=1000&auto=format&fit=crop',
      alt: 'Floor-to-Ceiling Wardrobe System with Tinted Glass Doors and Vertical LED Illumination',
      category: 'Wardrobes',
      label: 'Sliding Wardrobe',
      span: 'large',
    },
    {
      id: 'g-8',
      src: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=75&w=800&auto=format&fit=crop',
      alt: 'Architectural uPVC Corner Casement Fenestration with Slim Sightlines',
      category: 'uPVC Windows',
      label: 'uPVC Fenestration',
      span: 'standard',
    },
  ] as MediaItem[],
  finalCta: {
    bgImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1920&auto=format&fit=crop',
    alt: 'Atmospheric Dusk Architectural Residence with Illuminated Glazed Windows',
  },
};
