/**
 * CodeDNA ALBA — Alpine Light palette.
 * Warm paper, ink, champagne brass, sapphire & jade.
 * Every value is tuned for a light (paper-white) canvas.
 */

export const luxe = {
  emberPale: '#E8DCC8',
  ember: '#C2A47A',
  emberDeep: '#8C704F',
  emberDark: '#6B4A2A',
  burnt: '#4F6B8A',
  apricot: '#6A9A8F',
  pearl: '#0F1A20',
  garnet: '#B85C4A',
  amber: '#C2A47A',
  ink: '#0F1A20',
  inkSecondary: '#33414F',
  inkMuted: '#6B7A89',
  inkFaint: '#9AA8B6',
  hairline: 'rgba(15, 26, 32, 0.08)',
  axis: 'rgba(15, 26, 32, 0.06)',
} as const

/** Ordered series — visible on warm paper / white cards. */
export const series = [
  luxe.ember,
  luxe.burnt,
  luxe.apricot,
  luxe.ink,
  luxe.emberDeep,
  luxe.garnet,
] as const

/** Paper tooltip — white card with hairline + soft lift. */
export const glassTooltip = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(15, 26, 32, 0.08)',
  borderRadius: '14px',
  color: luxe.ink,
  boxShadow: '0 12px 32px -12px rgba(15,26,32,0.14), 0 1px 3px rgba(15,26,32,0.06)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: luxe.inkMuted, fontSize: 12 } as const

/** Heatmap ramp: paper → mist → sapphire → jade → champagne. */
export const heatRamp = [
  'rgba(15, 26, 32, 0.04)',
  'rgba(79, 107, 138, 0.22)',
  'rgba(106, 154, 143, 0.32)',
  'rgba(194, 164, 122, 0.48)',
  luxe.ember,
] as const

export function metalForScore(value: number): string {
  if (value >= 80) return luxe.ember
  if (value >= 60) return luxe.apricot
  return luxe.garnet
}
