import { GitPullRequest, GitCommit, MessageSquare, Users } from 'lucide-react'
import type { CollaborationStats as CS } from '../lib/types'

interface Props {
  stats: CS
}

export default function CollaborationStats({ stats }: Props) {
  const items = [
    { icon: GitPullRequest, label: 'Pull Requests', value: stats.pullRequests, color: 'text-accent-light' },
    { icon: GitCommit, label: 'Reviews', value: stats.reviews, color: 'text-accent' },
    { icon: MessageSquare, label: 'Issues', value: stats.issues, color: 'text-accent-burnt' },
    { icon: Users, label: 'Contributors', value: stats.contributors, color: 'text-accent-apricot' },
  ]

  return (
    <div className="stack-grid sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ icon: Icon, label, value, color }, i) => (
        <div
          key={label}
          className=""
        >
          <div className="card pad-luxe flex items-center gap-5 group h-full">
            <div className="icon-tile w-12 h-12 shrink-0">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="depth-1 min-w-0">
              <p className="text-2xl font-display font-semibold text-ink group-hover:text-gradient transition-all duration-500">
                {value}
              </p>
              <p className="mt-0.5 text-xs uppercase tracking-luxe text-ink-faint">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
