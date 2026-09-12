/**
 * CodeDNA — White + Ferrari Red palette.
 * Background is pure white, accent is Ferrari Rosso Corsa (#FF2800), all text is black.
 */

export const luxe = {
  emberPale: '#FF8573',
  ember: '#FF2800',     // Ferrari Rosso Corsa
  emberDeep: '#D01E00',
  emberDark: '#991400',
  burnt: '#000000',
  apricot: '#FF5940',
  pearl: '#FFFFFF',
  garnet: '#FF2800',
  amber: '#F59E0B',
  ink: '#000000',
  inkSecondary: '#000000',
  inkMuted: '#000000',
  inkFaint: 'rgba(0,0,0,0.45)',
  hairline: 'rgba(0, 0, 0, 0.08)',
  axis: 'rgba(0, 0, 0, 0.12)',
} as const

/** Ordered series — high-contrast on white */
export const series = [
  luxe.ember,
  '#000000',
  '#FF5940',
  luxe.emberDeep,
  '#333333',
  '#991400',
] as const

/** White tooltip with black text + Ferrari micro-border */
export const glassTooltip = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(255, 40, 0, 0.30)',
  borderRadius: '14px',
  color: '#000000',
  boxShadow: '0 16px 40px -12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: '#000000', fontSize: 12, opacity: 0.55 } as const

/** Heatmap ramp: light grey → soft red → vivid red → Ferrari */
export const heatRamp = [
  'rgba(0, 0, 0, 0.06)',
  'rgba(255, 40, 0, 0.18)',
  'rgba(255, 40, 0, 0.38)',
  'rgba(255, 40, 0, 0.65)',
  '#FF2800',
] as const

export function metalForScore(value: number): string {
  if (value >= 80) return luxe.ember
  if (value >= 60) return luxe.emberPale
  return luxe.garnet
}
