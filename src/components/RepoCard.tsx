import { Star, GitFork, GitCommit, Lock, Globe } from 'lucide-react'
import type { Repository } from '../lib/types'
import { luxe, metalForScore } from '../lib/palette'

interface Props {
  repo: Repository
  compact?: boolean
}

/* Warm metal tints — one per language, all inside the luxury range. */
const langColors: Record<string, string> = {
  Java: luxe.burnt,
  TypeScript: luxe.ember,
  JavaScript: luxe.emberPale,
  Python: luxe.emberDeep,
  SQL: luxe.apricot,
  Dockerfile: luxe.emberDark,
  CSS: luxe.pearl,
}

const langTint = (lang: string) => langColors[lang] || luxe.ember

/** What each ring is actually built from, on hover. */
const HEALTH_HINT: Record<string, string> = {
  codeQuality: 'CI workflows, linter config, visible tests, README, licence, push recency',
  complexity: 'Repository size, language count and open-issue volume — lower is better',
  documentation: 'README, docs folder, changelog, description, topics, contributing guide, wiki',
  testing: 'Test files and coverage config at the root, plus CI workflows and a build file',
  maintainability: 'Push recency, licence, linter, CI, contributor count, open-issue ratio',
}

export default function RepoCard({ repo, compact }: Props) {
  if (compact) {
    return (
      <div className="card p-5 cursor-pointer group h-full">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 min-w-0 depth-1">
            <span className="truncate text-sm font-semibold text-ink group-hover:text-gradient transition-all">{repo.name}</span>
            {repo.visibility === 'private' ? (
              <Lock className="w-3.5 h-3.5 shrink-0 text-ink-faint" />
            ) : (
              <Globe className="w-3.5 h-3.5 shrink-0 text-ink-faint" />
            )}
          </div>
          <span
            className="chip depth-1 shrink-0 text-xs font-medium transition-all group-hover:scale-105"
            style={{
              backgroundColor: `${langTint(repo.primaryLanguage)}1A`,
              color: langTint(repo.primaryLanguage),
              borderColor: `${langTint(repo.primaryLanguage)}44`,
            }}
          >
            {repo.primaryLanguage}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-ink-muted group-hover:text-ink transition-colors line-clamp-2 mb-4">{repo.description}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-faint">
          <span className="flex items-center gap-1 group-hover:text-accent transition-colors">
            <Star className="w-3.5 h-3.5" />
            {repo.stars}
          </span>
          <span className="flex items-center gap-1 group-hover:text-accent transition-colors">
            <GitFork className="w-3.5 h-3.5" />
            {repo.forks}
          </span>
          <span className="flex items-center gap-1 group-hover:text-accent transition-colors">
            <GitCommit className="w-3.5 h-3.5" />
            {repo.commits}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="card pad-luxe cursor-pointer group h-full">
      <div className="flex items-start justify-between gap-4 mb-5 depth-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="truncate text-base font-semibold text-ink group-hover:text-gradient transition-all">{repo.name}</h3>
            {repo.visibility === 'private' ? (
              <Lock className="w-4 h-4 shrink-0 text-ink-faint" />
            ) : (
              <Globe className="w-4 h-4 shrink-0 text-ink-faint" />
            )}
          </div>
          <p className="text-sm leading-relaxed text-ink-muted group-hover:text-ink transition-colors">{repo.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-gradient">{repo.dnaContribution}%</p>
          <p className="text-[0.6rem] uppercase tracking-luxe text-ink-faint mt-0.5">DNA Share</p>
        </div>
      </div>

      {/* Languages */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {repo.languages.map((lang) => (
          <span
            key={lang}
            className="chip text-xs font-medium text-ink-muted transition-all hover:scale-105 hover:text-ink"
          >
            {lang}
          </span>
        ))}
      </div>

      {/* Detected tooling and patterns — read from each repository's root listing
          and its Actions workflows, so these are observations, not guesses. */}
      {(repo.stack.length > 0 || repo.patterns.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {repo.stack.slice(0, 6).map((tool) => (
            <span
              key={tool}
              className="chip text-[0.68rem] font-medium"
              style={{
                backgroundColor: `${luxe.ember}14`,
                color: luxe.emberPale,
                borderColor: `${luxe.ember}33`,
              }}
            >
              {tool}
            </span>
          ))}
          {repo.patterns.slice(0, 3).map((pattern) => (
            <span key={pattern} className="chip text-[0.68rem] font-medium text-ink-faint">
              {pattern}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
        <span className="flex items-center gap-1.5 group-hover:text-accent transition-colors">
          <Star className="w-4 h-4" />
          {repo.stars}
        </span>
        <span className="flex items-center gap-1.5 group-hover:text-accent transition-colors">
          <GitFork className="w-4 h-4" />
          {repo.forks}
        </span>
        <span className="flex items-center gap-1.5 group-hover:text-accent transition-colors">
          <GitCommit className="w-4 h-4" />
          {repo.commits}
        </span>
      </div>

      {/* Health Metrics */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="mb-4 text-[0.6rem] uppercase tracking-luxe text-ink-faint">
          Derived from repository signals
        </p>
        <div className="metric-grid depth-2">
          {Object.entries(repo.health).map(([key, value]) => (
            <div key={key} className="text-center group/metric" title={HEALTH_HINT[key] ?? key}>
              <div className="relative w-10 h-10 mx-auto">
                <svg className="w-10 h-10 -rotate-90 overflow-visible">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke={metalForScore(value)}
                    strokeWidth="3"
                    strokeDasharray={`${value} 100`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                    style={{ filter: `drop-shadow(0 0 5px ${metalForScore(value)}66)` }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-ink group-hover/metric:text-gradient transition-all">
                  {value}
                </span>
              </div>
              <p className="text-[0.68rem] leading-tight text-ink-faint mt-1.5 capitalize group-hover/metric:text-ink transition-colors">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
