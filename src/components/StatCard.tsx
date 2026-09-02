import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  label: string
  value: number | string
  accent?: boolean
}

export default function StatCard({ icon: Icon, label, value, accent }: Props) {
  return (
    <div className="stat-card group cursor-pointer flex flex-col gap-5">
      <div className={`icon-tile w-11 h-11 ${accent ? 'icon-tile--ember' : ''}`}>
        <Icon
          className={`w-5 h-5 transition-colors duration-500 ${
            accent ? 'text-accent-light' : 'text-ink-muted group-hover:text-accent'
          }`}
        />
      </div>
      <div className="depth-1">
        <p
          className={`text-3xl font-display font-semibold tracking-tight transition-all duration-500 ${
            accent ? 'text-engrave' : 'text-ink group-hover:text-gradient'
          }`}
        >
          {value}
        </p>
        <p className="mt-1.5 text-xs uppercase tracking-luxe text-ink-faint group-hover:text-ink-muted transition-colors duration-500">
          {label}
        </p>
      </div>
    </div>
  )
}
