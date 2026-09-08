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
  burnt: '#E2E8F0',     // Platinum Silver (0% blue, pure metallic contrast)
  apricot: '#FF5940',   // Radiant Flare
  pearl: '#FFFFFF',     // Crisp Pure White
  garnet: '#FF2800',    // Ferrari Rosso Corsa
  amber: '#F59E0B',     // Speedometer Amber
  ink: '#FFFFFF',       // 100% luminous contrast text
  inkSecondary: '#F1F5F9', // Crisp silver text
  inkMuted: '#94A3B8',  // Steel gray
  inkFaint: '#64748B',  // Graphite
  hairline: 'rgba(255, 255, 255, 0.08)',
  axis: 'rgba(255, 255, 255, 0.12)',
} as const

/** Ordered series — vibrant & high-contrast on pure pitch black surfaces */
export const series = [
  luxe.ember,
  luxe.burnt,
  '#FF5940',
  luxe.emberDeep,
  '#94A3B8',
  '#991400',
] as const

/** Luxury pure pitch black glass tooltip with Ferrari Red micro-border */
export const glassTooltip = {
  backgroundColor: '#0A0A0A',
  border: '1px solid rgba(255, 40, 0, 0.45)',
  borderRadius: '14px',
  color: '#FFFFFF',
  boxShadow: '0 16px 40px -12px rgba(0,0,0,0.95), 0 0 16px -4px rgba(255, 40, 0, 0.30)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: '#94A3B8', fontSize: 12 } as const

/** Heatmap ramp: pure black tile → subtle red → vivid red → radiant flare → Ferrari Rosso Corsa */
export const heatRamp = [
  'rgba(255, 255, 255, 0.05)',
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
