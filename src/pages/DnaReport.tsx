import { useMemo } from 'react'
import { useProfile } from '../lib/ProfileContext'
import type { Repository, RepoHealth } from '../lib/types'
import { ArrowDown, ArrowUpRight, Download, Dna, FileText, ShieldCheck, Sparkles } from 'lucide-react'

type Dimension = keyof RepoHealth
const DIMENSIONS: { key: Dimension; label: string; weight: number; inverse?: boolean }[] = [
  { key: 'codeQuality', label: 'Quality signals', weight: 25 },
  { key: 'testing', label: 'Testing evidence', weight: 25 },
  { key: 'documentation', label: 'Documentation', weight: 20 },
  { key: 'maintainability', label: 'Maintainability', weight: 20 },
  { key: 'complexity', label: 'Complexity headroom', weight: 10, inverse: true },
]

function scoreRepo(repo: Repository) {
  if (repo.dnaScore !== undefined) return repo.dnaScore
  return Math.round(DIMENSIONS.reduce((sum, d) => sum + (d.inverse ? 100 - repo.health[d.key] : repo.health[d.key]) * d.weight / 100, 0))
}

function grade(score: number) {
  return score >= 85 ? 'Excellent' : score >= 70 ? 'Strong' : score >= 55 ? 'Developing' : 'Needs attention'
}

function findings(repo: Repository) {
  const items = DIMENSIONS.map((dimension) => {
    const raw = repo.health[dimension.key]
    const value = dimension.inverse ? 100 - raw : raw
    return { ...dimension, raw, value }
  })
  const weak = [...items].sort((a, b) => a.value - b.value).slice(0, 2)
  return weak.filter((item) => item.value < 75).map((item) => {
    if (item.key === 'testing') return { title: 'Strengthen automated testing', detail: 'Add a focused test suite, run it in CI, and publish coverage so regressions are caught before merge.' }
    if (item.key === 'documentation') return { title: 'Make the project easier to adopt', detail: 'Improve the README with setup steps and examples; add a license and contribution guide where appropriate.' }
    if (item.key === 'maintainability') return { title: 'Make maintenance more predictable', detail: 'Add a lint or formatting gate and a CI workflow. Review stale issues and update the project when needed.' }
    if (item.key === 'codeQuality') return { title: 'Add consistent quality gates', detail: 'Combine CI, tests, linting, a clear README, and a project description to make quality visible and repeatable.' }
    return { title: 'Reduce complexity pressure', detail: 'Review the largest or least active parts of this repository, break oversized modules into clear units, and close or triage stale issues.' }
  })
}

function accountScore(profile: NonNullable<ReturnType<typeof useProfile>['profile']>) {
  const repos = profile.repositories
  if (!repos.length) return profile.stats.dnaScore
  const totalWeight = repos.reduce((sum, r) => sum + Math.max(1, r.commits), 0)
  return Math.round(repos.reduce((sum, r) => sum + scoreRepo(r) * Math.max(1, r.commits), 0) / totalWeight)
}

export default function DnaReport() {
  const { profile } = useProfile()
  if (!profile) return null
  const { repositories, meta } = profile
  const overall = useMemo(() => accountScore(profile), [profile])
  const ranked = [...repositories].sort((a, b) => scoreRepo(a) - scoreRepo(b))
  const average = repositories.length ? Math.round(repositories.reduce((sum, r) => sum + scoreRepo(r), 0) / repositories.length) : 0
  const priorities = useMemo(() => {
    const tally = new Map<string, number>()
    repositories.forEach((repo) => findings(repo).forEach((item) => tally.set(item.title, (tally.get(item.title) ?? 0) + 1)))
    return [...tally].sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [repositories])

  return (
    <div className="section-stack dna-report">
      <header className="page-head no-print">
        <div>
          <p className="eyebrow">Developer Intelligence</p>
          <h1 className="page-title text-engrave">DNA Score &amp; Improvement Report</h1>
          <p className="page-lede">A per-repository engineering profile and an account-wide view, with concrete next steps for each gap.</p>
        </div>
        <button type="button" onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2 !px-5 !py-3">
          <Download className="w-4 h-4" /> Export report as PDF
        </button>
      </header>

      <section className="report-cover card pad-luxe">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="eyebrow">Account DNA · @{profile.user.handle}</p>
            <div className="mt-3 flex items-end gap-3"><span className="font-display text-6xl font-semibold text-gradient">{overall}</span><span className="mb-2 text-ink-muted">/ 100 · {grade(overall)}</span></div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">Commit-weighted average of the analyzed repositories’ engineering DNA scores. This is a portfolio-level engineering practices score, not a measure of developer worth or skill.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Repositories scored" value={`${repositories.length} / ${meta.totalRepos}`} />
            <Metric label="Average repository DNA" value={`${average}/100`} />
            <Metric label="Account activity DNA" value={`${profile.stats.dnaScore}/100`} />
          </div>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-5">
          {DIMENSIONS.map((d) => {
            const value = repositories.length ? Math.round(repositories.reduce((sum, r) => sum + (d.inverse ? 100 - r.health[d.key] : r.health[d.key]), 0) / repositories.length) : 0
            return <div key={d.key} className="rounded-xl border border-line bg-surface p-3"><div className="flex justify-between text-xs text-ink-muted"><span>{d.label}</span><b>{value}</b></div><div className="mt-2 h-1.5 rounded-full bg-surface-raised"><div className="meter-fill" style={{ width: `${value}%` }} /></div></div>
          })}
        </div>
        <p className="mt-4 text-xs text-ink-faint">Scoring method: quality 25%, testing 25%, documentation 20%, maintainability 20%, complexity headroom 10%. Complexity is inverted so higher headroom is better. Signals are derived from GitHub repository metadata and visible root files.</p>
      </section>

      <section className="no-print">
        <div className="section-head"><div><p className="eyebrow">01 — Focus areas</p><h2 className="section-title">What to improve across your account</h2><p className="section-note">Priorities are ordered by how many analyzed repositories have the corresponding gap.</p></div><Sparkles className="w-5 h-5 text-accent" /></div>
        <div className="stack-grid md:grid-cols-2">
          {priorities.length ? priorities.map(([title, count]) => <div className="card pad-luxe" key={title}><div className="flex items-start gap-3"><span className="icon-tile w-10 h-10"><ArrowUpRight className="w-4 h-4 text-accent" /></span><div><h3 className="font-semibold text-ink">{title}</h3><p className="mt-1 text-sm text-ink-muted">Affects {count} of {repositories.length} analyzed repositories. Start with the lowest-scoring projects listed below.</p></div></div></div>) : <div className="card pad-luxe text-sm text-ink-muted">No significant gaps detected in the analyzed repositories. Keep the quality signals current and revisit after your next sync.</div>}
        </div>
      </section>

      <section>
        <div className="section-head"><div><p className="eyebrow">02 — Repository detail</p><h2 className="section-title">DNA score for every analyzed repository</h2><p className="section-note">Sorted from lowest score first to make the next action easy to find.</p></div><FileText className="w-5 h-5 text-accent" /></div>
        <div className="space-y-4">
          {ranked.map((repo) => <RepoReport key={repo.id} repo={repo} />)}
          {!ranked.length && <div className="card pad-luxe text-ink-muted">No repositories were available to score.</div>}
        </div>
      </section>

      <section className="card pad-luxe">
        <div className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-accent"/><div><p className="eyebrow">Method &amp; coverage</p><h2 className="section-title !text-xl">Read this score in context</h2><p className="mt-3 text-sm leading-relaxed text-ink-muted">Repository scores are derived from GitHub-visible signals such as root-level test and documentation files, Actions workflows, license, lint configuration, repository size, issue counts, and push recency. GitHub metadata does not reveal actual test quality, code correctness, individual skill, or private work inaccessible to this connection. {meta.analyzedRepos} repositories were analyzed in depth; {meta.totalRepos - meta.analyzedRepos} were not included in per-repository analysis.</p><p className="mt-3 text-xs text-ink-faint">Report generated {new Date().toLocaleString()} · GitHub data fetched {new Date(meta.fetchedAt).toLocaleString()}</p></div></div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-line bg-surface p-3"><p className="text-[0.65rem] uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 text-lg font-semibold text-ink">{value}</p></div> }

function RepoReport({ repo }: { repo: Repository }) {
  const score = scoreRepo(repo)
  const todo = findings(repo)
  return <article className="card pad-luxe report-repo">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="eyebrow">{repo.primaryLanguage} · {repo.visibility}</p><h3 className="mt-1 break-words font-display text-xl font-semibold text-ink">{repo.name}</h3><p className="mt-1 text-sm text-ink-muted">{repo.description}</p></div><div className="shrink-0 text-right"><p className="font-display text-4xl font-semibold text-gradient">{score}</p><p className="text-xs text-ink-faint">/ 100 · {grade(score)}</p></div></div>
    <div className="mt-5 grid gap-2 sm:grid-cols-5">{DIMENSIONS.map((d) => { const raw = repo.health[d.key]; const value = d.inverse ? 100 - raw : raw; return <div key={d.key} className="rounded-lg bg-surface p-3"><div className="flex justify-between gap-2 text-xs"><span className="text-ink-muted">{d.label}</span><b className="text-ink">{value}</b></div><div className="mt-2 h-1 rounded-full bg-surface-raised"><div className="meter-fill" style={{ width: `${value}%` }} /></div></div> })}</div>
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-faint"><span>{repo.commits} account commits</span><span>{repo.pullRequests} pull requests</span><span>{repo.stars} stars</span><span>Updated {repo.updatedAt}</span></div>
    {todo.length > 0 && <div className="mt-5 border-t border-line pt-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent">Recommended next steps</p><div className="grid gap-3 md:grid-cols-2">{todo.map((item) => <div className="flex gap-2" key={item.title}><ArrowDown className="mt-0.5 h-4 w-4 shrink-0 text-accent"/><div><p className="text-sm font-medium text-ink">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.detail}</p></div></div>)}</div></div>}
    {todo.length === 0 && <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-sm text-accent-light"><Dna className="h-4 w-4"/>No major gaps in the tracked signals. Keep the repository’s documentation, checks, and activity current.</p>}
  </article>
}
