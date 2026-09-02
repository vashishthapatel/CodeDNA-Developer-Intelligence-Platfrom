import type { Skill } from '../lib/types'
import type { CSSProperties } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  skill: Skill
  /** Position in the list. Only used to stagger the meter's idle charge so a column
      of bars never pulses in unison. */
  index?: number
}

export default function SkillBar({ skill, index = 0 }: Props) {
  let TrendIcon: LucideIcon | null = null
  let trendColor = ''

  if (skill.trend !== undefined) {
    TrendIcon = skill.trend > 0 ? TrendingUp : skill.trend < 0 ? TrendingDown : Minus
    trendColor = skill.trend > 0 ? 'text-accent' : skill.trend < 0 ? 'text-bad' : 'text-ink-faint'
  }

  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted group-hover:text-ink transition-colors duration-500">
          {skill.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-muted group-hover:text-gradient transition-all duration-500">
            {skill.value}%
          </span>
          {TrendIcon && (
            <span className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              {Math.abs(skill.trend!)}
            </span>
          )}
        </div>
      </div>
      <div className="meter">
        <div
          className="meter-fill"
          style={{ width: `${skill.value}%`, '--i': index } as CSSProperties}
        />
      </div>
    </div>
  )
}
