/**
 * CodeDNA — Deep Forest & Brushed Gold, with sage analytical companions.
 */

export const luxe = {
  emberPale: '#D1B678',
  ember: '#B99A5D',
  emberDeep: '#8F7545',
  emberDark: '#675631',
  iris: '#80917B',
  irisLight: '#A0AA9D',
  irisDeep: '#596B57',
  burnt: '#80917B',
  apricot: '#B99A5D',
  pearl: '#F1EEE5',
  garnet: '#A66A57',
  amber: '#B99A5D',
  ink: '#F1EEE5',
  inkSecondary: '#A0AA9D',
  inkMuted: 'rgba(241, 238, 229, 0.68)',
  inkFaint: 'rgba(241, 238, 229, 0.44)',
  hairline: 'rgba(241, 238, 229, 0.10)',
  axis: 'rgba(241, 238, 229, 0.16)',
} as const

/** Ordered series — brass lead with subdued analytical companions */
export const series = [
  luxe.ember,
  luxe.iris,
  luxe.apricot,
  luxe.irisLight,
  luxe.emberDeep,
  '#80917B',
] as const

/** Obsidian tooltip with a subtle aged-brass keyline */
export const glassTooltip = {
  backgroundColor: '#121A15',
  border: '1px solid rgba(185, 154, 93, 0.35)',
  borderRadius: '14px',
  color: '#F1EEE5',
  boxShadow: '0 16px 40px -12px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(241, 238, 229, 0.04)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: '#A0AA9D', fontSize: 12, opacity: 0.85 } as const

/** Heatmap ramp: muted obsidian → mineral blue → aged brass */
export const heatRamp = [
  'rgba(241, 238, 229, 0.05)',
  'rgba(128, 145, 123, 0.25)',
  'rgba(128, 145, 123, 0.55)',
  'rgba(185, 154, 93, 0.62)',
  '#B99A5D',
] as const

export function metalForScore(value: number): string {
  if (value >= 80) return luxe.ember
  if (value >= 60) return luxe.emberPale
  return luxe.garnet
}
