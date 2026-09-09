/**
 * CodeDNA Luxury Pure Pitch Black + Ferrari Red ("Rosso Corsa") Palette.
 * Pure Black, Ferrari Rosso Corsa, Radiant Flare & Platinum Silver.
 * Completely free of blue tones — 100% pitch black with high-contrast supercar accents.
 */

export const luxe = {
  emberPale: '#FF8573', // Luminous coral flare
  ember: '#FF2800',     // Ferrari Rosso Corsa
  emberDeep: '#D01E00', // Deep Scuderia Rosso
  emberDark: '#991400', // Carbon Red
  burnt: '#334155',     // Platinum Slate (dark luxury contrast)
  apricot: '#FF5940',   // Radiant Flare
  pearl: '#FFFFFF',     // Crisp Pure White
  garnet: '#FF2800',    // Ferrari Rosso Corsa
  amber: '#F59E0B',     // Speedometer Amber
  ink: '#F1F5FA',       // Ink on dark
  inkSecondary: '#CBD5E1', // Soft slate on dark
  inkMuted: '#94A3B8',  // Steel on dark
  inkFaint: '#64748B',  // Graphite on dark
  hairline: 'rgba(255, 255, 255, 0.08)',
  axis: 'rgba(255, 255, 255, 0.10)',
} as const

/** Ordered series — vibrant & high-contrast on clean white surfaces */
export const series = [
  luxe.ember,
  luxe.burnt,
  '#FF5940',
  luxe.emberDeep,
  '#000000',
  '#991400',
] as const

/** Luxury clean white glass tooltip with Ferrari Red micro-border */
export const glassTooltip = {
  backgroundColor: '#121B2E',
  border: '1px solid rgba(255, 40, 0, 0.45)',
  borderRadius: '14px',
  color: '#F1F5FA',
  boxShadow: '0 16px 40px -12px rgba(0,0,0,0.55), 0 0 16px -4px rgba(255, 40, 0, 0.25)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: '#94A3B8', fontSize: 12 } as const

/** Heatmap ramp: light tile → subtle red → vivid red → radiant flare → Ferrari Rosso Corsa */
export const heatRamp = [
  'rgba(255, 255, 255, 0.06)',
  'rgba(255, 40, 0, 0.25)',
  'rgba(255, 40, 0, 0.50)',
  'rgba(255, 89, 64, 0.75)',
  '#FF2800',
] as const

export function metalForScore(value: number): string {
  if (value >= 80) return luxe.ember
  if (value >= 60) return luxe.emberPale
  return luxe.garnet
}
