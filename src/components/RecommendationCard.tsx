import { Clock, ChevronRight, Sparkles } from 'lucide-react'
import type { Recommendation } from '../lib/types'

interface Props {
  recommendation: Recommendation
  index: number
}

const difficultyColors: Record<string, string> = {
  Beginner: 'bg-accent-teal/15 text-accent-teal border border-accent-teal/30',
  Intermediate: 'bg-accent/15 text-accent border border-accent/30',
  Advanced: 'bg-bad/15 text-bad border border-bad/30',
}

const categoryColors: Record<string, string> = {
  Architecture: 'bg-accent/15 text-accent border border-accent/30',
  Infrastructure: 'bg-accent-sapphire/15 text-accent-sapphire border border-accent-sapphire/30',
  Operations: 'bg-accent-teal/15 text-accent-teal border border-accent-teal/30',
}

export default function RecommendationCard({ recommendation: rec, index }: Props) {
  return (
    <div
      className=""
    >
      <div className="card pad-luxe cursor-pointer group h-full">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="icon-tile icon-tile--ember w-11 h-11 shrink-0">
              <span className="text-sm font-bold text-engrave">{rec.match}%</span>
            </div>
            <div className="depth-1 min-w-0">
              <h3 className="text-base font-semibold text-ink group-hover:text-gradient transition-all duration-500">
                {rec.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[0.68rem] font-medium ${difficultyColors[rec.difficulty]}`}>
                  {rec.difficulty}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[0.68rem] font-medium ${categoryColors[rec.category] || 'bg-white/5 text-ink-muted border border-line'}`}>
                  {rec.category}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0 text-ink-faint group-hover:text-accent group-hover:translate-x-1 transition-all duration-500" />
        </div>

      <p className="text-sm leading-relaxed text-ink-muted group-hover:text-ink transition-colors duration-500 mb-6">{rec.reason}</p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5 group-hover:text-ink transition-colors duration-500">
            <Clock className="w-3.5 h-3.5" />
            {rec.duration}
          </span>
          <span className="flex items-center gap-1.5 text-accent">
            <Sparkles className="w-3.5 h-3.5" />
            AI Recommended
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {rec.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="chip !px-2 !py-0.5 text-[0.68rem]">
              {tag}
            </span>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
