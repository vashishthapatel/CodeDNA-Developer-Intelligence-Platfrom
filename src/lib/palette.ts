/**
 * CodeDNA — Off-white theme with Electric Blue + Cantaloupe accents.
 * Background is off-white (#000000 / #0A0A0A), primary accent is Electric Blue (#00FF88),
 * secondary accent is Cantaloupe (#FFB800), text is deep porcelain-navy (#F0F0F0).
 */

export const luxe = {
  emberPale: '#FFB800',  // light electric blue
  ember: '#00FF88',      // Electric Blue
  emberDeep: '#00CC6A',
  emberDark: '#00CC6A',
  burnt: '#F0F0F0',
  apricot: '#FFB800',    // Cantaloupe
  pearl: '#F0F9FF',
  garnet: '#FFB800',     // warm cantaloupe for low scores
  amber: '#F59E0B',
  ink: '#F0F0F0',
  inkSecondary: '#00FF88',
  inkMuted: 'rgba(240,240,240,0.66)',
  inkFaint: 'rgba(240,240,240,0.45)',
  hairline: 'rgba(255, 255, 255, 0.10)',
  axis: 'rgba(255, 255, 255, 0.16)',
} as const

/** Ordered series — vivid on off-white */
export const series = [
  luxe.ember,      // electric blue
  '#FFB800',       // cantaloupe
  '#00CC6A',       // deep blue
  '#F59E0B',       // amber
  '#00CC6A',       // midnight blue
  '#FFD04D',       // soft cantaloupe
] as const

/** White tooltip with navy text + electric micro-border */
export const glassTooltip = {
  backgroundColor: '#000000',
  border: '1px solid rgba(0, 255, 136, 0.40)',
  borderRadius: '14px',
  color: '#F0F0F0',
  boxShadow: '0 16px 40px -12px rgba(255, 255, 255,0.15), 0 1px 3px rgba(255, 255, 255,0.08)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: '#00FF88', fontSize: 12, opacity: 0.85 } as const

/** Heatmap ramp: faint navy → soft blue → electric blue */
export const heatRamp = [
  'rgba(255, 255, 255, 0.06)',
  'rgba(0, 255, 136, 0.22)',
  'rgba(0, 255, 136, 0.42)',
  'rgba(0, 255, 136, 0.68)',
  '#00FF88',
] as const

export function metalForScore(value: number): string {
  if (value >= 80) return luxe.ember
  if (value >= 60) return luxe.emberPale
  return luxe.garnet
}
