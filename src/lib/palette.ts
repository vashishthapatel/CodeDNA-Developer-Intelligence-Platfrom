/**
 * CodeDNA — Radioactive Wasabi (#CCFF00) + Royal Iris (#5E5CE6) on Stealth Basalt (#08080C).
 * Strand A: Radioactive Wasabi (Code Logic & AST execution)
 * Strand B: Royal Iris (Developer Genetics & Identity)
 */

export const luxe = {
  emberPale: '#E5FF66',  // light wasabi
  ember: '#CCFF00',      // Radioactive Wasabi (Strand A)
  emberDeep: '#9EC200',
  emberDark: '#7A9600',
  iris: '#5E5CE6',       // Royal Iris (Strand B)
  irisLight: '#8382F0',
  irisDeep: '#4442B5',
  burnt: '#F8FAFC',
  apricot: '#FB923C',    // Signal Coral
  pearl: '#F8FAFC',
  garnet: '#FB923C',     // warm signal coral for lower scores
  amber: '#F59E0B',
  ink: '#F8FAFC',
  inkSecondary: '#94A3B8', // balanced graphite slate
  inkMuted: 'rgba(248, 250, 252, 0.65)',
  inkFaint: 'rgba(248, 250, 252, 0.40)',
  hairline: 'rgba(255, 255, 255, 0.08)',
  axis: 'rgba(255, 255, 255, 0.12)',
} as const

/** Ordered series — complementary genomic strands */
export const series = [
  luxe.ember,      // radioactive wasabi
  luxe.iris,       // royal iris
  '#FB923C',       // signal coral
  '#8382F0',       // iris light
  '#9EC200',       // wasabi deep
  '#F59E0B',       // amber
] as const

/** Glass tooltip with carbon text + wasabi micro-border */
export const glassTooltip = {
  backgroundColor: '#111117',
  border: '1px solid rgba(204, 255, 0, 0.35)',
  borderRadius: '14px',
  color: '#F8FAFC',
  boxShadow: '0 16px 40px -12px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(255, 255, 255, 0.04)',
  padding: '10px 14px',
} as const

export const axisTick = { fill: '#94A3B8', fontSize: 12, opacity: 0.85 } as const

/** Heatmap ramp: faint carbon → soft iris → royal iris → vivid wasabi */
export const heatRamp = [
  'rgba(255, 255, 255, 0.05)',
  'rgba(94, 92, 230, 0.25)',
  'rgba(94, 92, 230, 0.55)',
  'rgba(204, 255, 0, 0.65)',
  '#CCFF00',
] as const

export function metalForScore(value: number): string {
  if (value >= 80) return luxe.ember
  if (value >= 60) return luxe.emberPale
  return luxe.garnet
}
