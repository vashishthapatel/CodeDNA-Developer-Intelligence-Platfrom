/**
 * CodeDNA Luxury Palette — Haute-horlogerie aesthetic with Obsidian,
 * Satin Champagne Gold, Liquid Platinum, and Celestial Sapphire Slate.
 */

export const luxe = {
  emberPale: '#F3E4CB',
  ember: '#DFBE86',
  emberDeep: '#B8955C',
  emberDark: '#6A5435',
  burnt: '#4F7A9A',
  apricot: '#5EA89B',
  pearl: '#F8FAFC',
  garnet: '#B85858',
  amber: '#DFBE86',
  ink: '#F8FAFC',
  inkSecondary: '#CBD5E1',
  inkMuted: '#8494A5',
  inkFaint: '#506173',
  hairline: 'rgba(218, 185, 134, 0.16)',
  axis: 'rgba(226, 232, 240, 0.08)',
} as const

/** Ordered series colours — harmonious Champagne, Sapphire, Jade, and Platinum. */
export const series = [
  luxe.ember,
  luxe.burnt,
  luxe.apricot,
  luxe.pearl,
  luxe.emberDeep,
  luxe.garnet,
] as const

/** Frosted-glass tooltip shared by every chart. */
export const glassTooltip = {
  backgroundColor: 'rgba(16, 23, 34, 0.92)',
  border: '1px solid rgba(218, 185, 134, 0.28)',
  borderRadius: '14px',
  color: luxe.ink,
  backdropFilter: 'blur(20px) saturate(180%)',
  boxShadow: '0 24px 60px -20px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: luxe.inkMuted, fontSize: 12 } as const

/** Contribution-heatmap ramp: Obsidian → Celestial Sapphire → Jade → Radiant Champagne Gold. */
export const heatRamp = [
  'rgba(255, 255, 255, 0.05)',
  'rgba(79, 122, 154, 0.38)',
  'rgba(94, 168, 155, 0.55)',
  'rgba(223, 190, 134, 0.82)',
  luxe.emberPale,
] as const

/** Score → metal. Used for health rings and gauges. */
export function metalForScore(value: number): string {
  if (value >= 80) return luxe.ember
  if (value >= 60) return luxe.apricot
  return luxe.garnet
}
