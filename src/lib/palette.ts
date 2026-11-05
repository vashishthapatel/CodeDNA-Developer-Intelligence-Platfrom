/**
 * CodeDNA — Obsidian & Aged Brass, with a restrained mineral-blue comparison series.
 * Brass communicates primary brand action; semantic colors remain reserved for status.
 */

export const luxe = {
  emberPale: '#E0C58D',
  ember: '#C8A96B',
  emberDeep: '#9D7D48',
  emberDark: '#765B32',
  iris: '#7F9DB2',
  irisLight: '#A7BDCB',
  irisDeep: '#506F83',
  burnt: '#7F9DB2',
  apricot: '#C58A55',
  pearl: '#F4F0E8',
  garnet: '#B85C52',
  amber: '#C58A55',
  ink: '#F4F0E8',
  inkSecondary: '#B9B4AA',
  inkMuted: 'rgba(244, 240, 232, 0.68)',
  inkFaint: 'rgba(244, 240, 232, 0.44)',
  hairline: 'rgba(244, 240, 232, 0.10)',
  axis: 'rgba(244, 240, 232, 0.16)',
} as const

/** Ordered series — brass lead with subdued analytical companions */
export const series = [
  luxe.ember,
  luxe.iris,
  luxe.apricot,
  luxe.irisLight,
  luxe.emberDeep,
  '#6E8773',
] as const

/** Obsidian tooltip with a subtle aged-brass keyline */
export const glassTooltip = {
  backgroundColor: '#211F1B',
  border: '1px solid rgba(200, 169, 107, 0.35)',
  borderRadius: '14px',
  color: '#F4F0E8',
  boxShadow: '0 16px 40px -12px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(244, 240, 232, 0.04)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: '#B9B4AA', fontSize: 12, opacity: 0.85 } as const

/** Heatmap ramp: muted obsidian → mineral blue → aged brass */
export const heatRamp = [
  'rgba(244, 240, 232, 0.05)',
  'rgba(127, 157, 178, 0.25)',
  'rgba(127, 157, 178, 0.55)',
  'rgba(200, 169, 107, 0.62)',
  '#C8A96B',
] as const

export function metalForScore(value: number): string {
  if (value >= 80) return luxe.ember
  if (value >= 60) return luxe.emberPale
  return luxe.garnet
}
