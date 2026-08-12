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
    primaryImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
    alt: 'Sparovia Client Project Hero View',
  },
  brandIntro: {
    primaryImage: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=2070&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop',
  },
  interiors: {
    kitchens: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2070&auto=format&fit=crop',
    wardrobes: 'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=2069&auto=format&fit=crop',
    living: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop',
  },
  upvc: {
    primaryImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop',
    primaryAlt: 'Architectural uPVC window installation flooding interior with natural light',
    gallery: [
      {
        src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop',
        alt: 'Floor-to-ceiling uPVC sliding door system with garden view',
        label: 'Sliding Door System',
      },
      {
        src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
        alt: 'Modern uPVC casement windows with clean white profiles',
        label: 'Casement Windows',
      },
      {
        src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop',
        alt: 'Large panoramic uPVC window framing exterior landscape',
        label: 'Panoramic Glazing',
      },
      {
        src: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?q=80&w=2070&auto=format&fit=crop',
        alt: 'uPVC French door installation in modern apartment balcony',
        label: 'French Doors',
      },
    ],
  },
  gallery: [
    {
      id: 'g-1',
      src: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2070&auto=format&fit=crop',
      alt: 'Custom Modular Kitchen Project',
      category: 'Kitchens',
      label: 'Modular Kitchen',
      span: 'large',
    },
    {
      id: 'g-2',
      src: 'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=2069&auto=format&fit=crop',
      alt: 'Bespoke Walk-in Wardrobe',
      category: 'Wardrobes',
      label: 'Bespoke Wardrobe',
      span: 'standard',
    },
    {
      id: 'g-3',
      src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop',
      alt: 'Modern Living Space Interior',
      category: 'Living Spaces',
      label: 'Living Space',
      span: 'standard',
    },
    {
      id: 'g-4',
      src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop',
      alt: 'Engineered uPVC Sliding Door Installation',
      category: 'uPVC Windows',
      label: 'uPVC Window System',
      span: 'full',
    },
    {
      id: 'g-5',
      src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop',
      alt: 'Custom Floating TV Console & Paneling',
      category: 'Living Spaces',
      label: 'Living / TV Unit',
      span: 'standard',
    },
    {
      id: 'g-6',
      src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
      alt: 'Contemporary Modular Island Kitchen',
      category: 'Kitchens',
      label: 'Island Kitchen',
      span: 'standard',
    },
    {
      id: 'g-7',
      src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2072&auto=format&fit=crop',
      alt: 'Floor-to-Ceiling Wardrobe System',
      category: 'Wardrobes',
      label: 'Sliding Wardrobe',
      span: 'large',
    },
    {
      id: 'g-8',
      src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop',
      alt: 'Architectural uPVC Fenestration',
      category: 'uPVC Windows',
      label: 'uPVC Fenestration',
      span: 'standard',
    },
  ] as MediaItem[],
};
