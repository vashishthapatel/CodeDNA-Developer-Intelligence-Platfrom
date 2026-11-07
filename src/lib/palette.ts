/**
 * CodeDNA — Deep Forest & Brushed Gold, with sage analytical companions.
 */

export const luxe = {
  emberPale: '#F6C744',
  ember: '#4B7D21',
  emberDeep: '#385D19',
  emberDark: '#675631',
  iris: '#83A94B',
  irisLight: '#72785D',
  irisDeep: '#596B57',
  burnt: '#83A94B',
  apricot: '#4B7D21',
  pearl: '#24301B',
  garnet: '#D95043',
  amber: '#4B7D21',
  ink: '#24301B',
  inkSecondary: '#72785D',
  inkMuted: 'rgba(36, 48, 27, 0.68)',
  inkFaint: 'rgba(36, 48, 27, 0.44)',
  hairline: 'rgba(36, 48, 27, 0.10)',
  axis: 'rgba(36, 48, 27, 0.16)',
} as const

/** Ordered series — brass lead with subdued analytical companions */
export const series = [
  luxe.ember,
  luxe.iris,
  luxe.apricot,
  luxe.irisLight,
  luxe.emberDeep,
  '#83A94B',
] as const

/** Obsidian tooltip with a subtle aged-brass keyline */
export const glassTooltip = {
  backgroundColor: '#F4F6D7',
  border: '1px solid rgba(75, 125, 33, 0.35)',
  borderRadius: '14px',
  color: '#24301B',
  boxShadow: '0 16px 40px -12px rgba(51, 63, 25, 0.12), 0 1px 3px rgba(36, 48, 27, 0.04)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: '#72785D', fontSize: 12, opacity: 0.85 } as const

/** Heatmap ramp: muted obsidian → mineral blue → aged brass */
export const heatRamp = [
  'rgba(36, 48, 27, 0.05)',
  'rgba(131, 169, 75, 0.25)',
  'rgba(131, 169, 75, 0.55)',
  'rgba(75, 125, 33, 0.62)',
  '#4B7D21',
] as const

export function metalForScore(value: number): string {
  if (value >= 80) return luxe.ember
  if (value >= 60) return luxe.emberPale
  return luxe.garnet
}
