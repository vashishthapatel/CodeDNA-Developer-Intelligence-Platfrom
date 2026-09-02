import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import RepoCard from '../components/RepoCard'
import { Search, GitBranch, Star, TrendingUp } from 'lucide-react'
import { useProfile } from '../lib/ProfileContext'

export default function Repositories() {
  const { profile } = useProfile()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [sortBy, setSortBy] = useState<'name' | 'commits' | 'dna'>('dna')

  // The header's search box navigates here with ?q=…, so the field follows the URL.
  useEffect(() => setSearch(params.get('q') ?? ''), [params])

  if (!profile) return null
  const { repositories, meta } = profile

  const needle = search.trim().toLowerCase()
  const filtered = repositories
    .filter((r) =>
      !needle
        ? true
        : r.name.toLowerCase().includes(needle) ||
          r.description.toLowerCase().includes(needle) ||
          r.languages.some((l) => l.toLowerCase().includes(needle)) ||
          r.stack.some((s) => s.toLowerCase().includes(needle)),
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'commits') return b.commits - a.commits
      return b.dnaContribution - a.dnaContribution
    })

  function onSearch(value: string) {
    setSearch(value)
    // Keep the URL honest so the view is shareable and the back button works.
    if (value) params.set('q', value)
    else params.delete('q')
    setParams(params, { replace: true })
  }

  const totals = [
    {
      icon: Star,
      label: 'Stars',
      value: repositories.reduce((s, r) => s + r.stars, 0),
      ember: true,
    },
    {
      icon: TrendingUp,
      label: 'Your Commits',
      value: repositories.reduce((s, r) => s + r.commits, 0),
    },
    {
      icon: GitBranch,
      label: 'Pull Requests',
      value: repositories.reduce((s, r) => s + r.pullRequests, 0),
    },
  ]

  return (
    <div className="section-stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">The Collection</p>
          <h1 className="page-title text-engrave">Your Repositories</h1>
          <p className="page-lede">
            {meta.analyzedRepos} of {meta.totalRepos} repositories analysed in depth — the
            most recently pushed, non-archived ones.
          </p>
        </div>
        <div className="chip !px-4 !py-2">
          <GitBranch className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-ink">{meta.totalRepos} total</span>
        </div>
      </header>
      {/* ---------------------------------------------------------------- sums */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">01 — Totals</p>
            <h2 className="section-title">Across the analysed set</h2>
          </div>
          <p className="text-xs uppercase tracking-luxe text-ink-faint">Measured from GitHub</p>
        </div>

        <div className="stack-grid sm:grid-cols-3">
          {totals.map(({ icon: Icon, label, value, ember }) => (
            <div key={label} className="stat-card group cursor-pointer flex flex-col gap-5">
              <div className={`icon-tile w-11 h-11 ${ember ? 'icon-tile--ember' : ''}`}>
                <Icon
                  className={`w-5 h-5 ${
                    ember
                      ? 'text-accent-light'
                      : 'text-ink-muted group-hover:text-accent transition-colors duration-500'
                  }`}
                />
              </div>
              <div className="depth-1">
                <p className="text-3xl font-display font-semibold text-gradient">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-luxe text-ink-faint">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* --------------------------------------------------------------- index */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">02 — Index</p>
            <h2 className="section-title">
              {filtered.length} {filtered.length === 1 ? 'repository' : 'repositories'}
            </h2>
          </div>
        </div>

        {/* Filters get their own row of air above the grid */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-[var(--space-stack)]">
          <div className="relative flex-1 lg:max-w-md group">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint group-focus-within:text-accent transition-colors duration-500" />
            <label htmlFor="repo-filter" className="sr-only">
              Filter repositories
            </label>
            <input
              id="repo-filter"
              type="search"
              placeholder="Search name, language or stack…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="field pl-10 !py-2.5"
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:ml-auto">
            {(['dna', 'commits', 'name'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`seg-btn ${sortBy === sort ? 'is-active' : ''}`}
              >
                Sort by {sort === 'dna' ? 'DNA' : sort === 'commits' ? 'Commits' : 'Name'}
              </button>
            ))}
          </div>
        </div>
        <div className="stack-grid md:grid-cols-2">
          {filtered.map((repo, i) => (
            <div
              key={repo.id}
              className=""
              style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
            >
              <RepoCard repo={repo} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <div className="icon-tile w-16 h-16 mx-auto mb-5">
              <Search className="w-8 h-8 text-ink-faint" />
            </div>
            <p className="text-ink-muted">No repositories match “{search}”</p>
            <button onClick={() => onSearch('')} className="btn-ghost mt-6 !px-5 !py-2 text-sm">
              Clear search
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
