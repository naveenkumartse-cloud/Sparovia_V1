/**
 * SPAROVIA ADMIN — AUTHORITATIVE DESIGN SYSTEM TOKENS
 * 
 * Single source of truth for the Sparovia Admin brand and UI design system.
 * Strictly adheres to the locked color palette:
 * - Primary Cobalt Blue: #315FEA (Main brand color)
 * - Secondary Violet:    #7950B8 (Alternate emphasis)
 * - AI / Special:        #C206C9 (Dedicated to AI features and special highlights)
 * - Primary Text:        #172033 (Headings and important text)
 * - Secondary Text:      #475569 (Supporting text)
 * - Main Background:     #FFFFFF (Primary surfaces)
 * - Supporting Bg:       #F3F6FA (Grouped surfaces)
 * - Border:              #E3E7ED (Dividers and boundaries)
 * - Success:             #15803D (Successful operations)
 * - Warning:             #B45309 (Warnings)
 * - Error:               #B91C1C (Errors and destructive states)
 */

export const SPAROVIA_TOKENS = {
  colors: {
    brand: {
      primary: '#315FEA',
      primaryHover: '#254EDB',
      primaryPressed: '#1E40AF',
      secondary: '#7950B8',
      secondaryHover: '#6820AB',
      secondaryPressed: '#53198A',
      aiSpecial: '#C206C9',
      aiSpecialHover: '#A805AE',
      aiSpecialPressed: '#8C0491',
    },
    text: {
      primary: '#172033',
      secondary: '#475569',
      muted: '#94A3B8',
      inverse: '#FFFFFF',
    },
    surface: {
      main: '#FFFFFF',
      supporting: '#F3F6FA',
      card: '#FFFFFF',
      border: '#E3E7ED',
      borderDark: '#1E293B',
      mainDark: '#0F172A',
      supportingDark: '#0B1220',
    },
    status: {
      success: '#15803D',
      warning: '#B45309',
      error: '#B91C1C',
      info: '#315FEA',
    },
  },
  radius: {
    indicator: '4px',
    control: '6px',
    panel: '8px',
    dialog: '10px',
  },
} as const;

export type SparoviaTokens = typeof SPAROVIA_TOKENS;
