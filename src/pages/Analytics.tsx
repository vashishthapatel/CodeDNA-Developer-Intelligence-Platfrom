import ActivityChart from '../components/ActivityChart'
import LanguagePie from '../components/LanguagePie'
import QualityChart from '../components/QualityChart'
import ComplexityChart from '../components/ComplexityChart'
import CollaborationStats from '../components/CollaborationStats'
import { BarChart3, TrendingUp, TrendingDown, Code, GitCommit, PieChart, Gauge } from 'lucide-react'
import { useProfile } from '../lib/ProfileContext'
import type { RepoHealth } from '../lib/types'

const DIM_LABEL: Record<keyof RepoHealth, string> = {
  codeQuality: 'code quality',
  complexity: 'complexity',
  documentation: 'documentation',
  testing: 'test evidence',
  maintainability: 'maintainability',
}

export default function Analytics() {
  const { profile } = useProfile()
  if (!profile) return null
  const { analytics, repositories, stats, dna, meta } = profile

  /* ---- month over month, straight off the twelve real monthly totals -------- */
  const points = analytics.activity
  const thisMonth = points[points.length - 1]
  const lastMonth = points[points.length - 2]
  const delta =
    thisMonth && lastMonth && lastMonth.commits > 0
      ? Math.round(((thisMonth.commits - lastMonth.commits) / lastMonth.commits) * 100)
      : null
  const busiest = points.reduce(
    (best, p) => (!best || p.commits > best.commits ? p : best),
    points[0],
  )

  /* ---- weakest of the five derived hygiene dimensions ----------------------- */
  const dims = Object.keys(DIM_LABEL) as (keyof RepoHealth)[]
  const averages = dims.map((key) => ({
    key,
    value: repositories.length
      ? Math.round(repositories.reduce((s, r) => s + r.health[key], 0) / repositories.length)
      : 0,
  }))
  // Complexity is the one axis where a high number is not a compliment, so it is
  // never reported as the "weakest" dimension.
  const weakest = averages
    .filter((a) => a.key !== 'complexity')
    .sort((a, b) => a.value - b.value)[0]
  const lagging = weakest
    ? repositories.filter((r) => r.health[weakest.key] < 60).length
    : 0

  const top = analytics.languages[0]
  const topTrend = dna.languages.find((l) => l.name === top?.name)?.trend ?? 0
  const reviewRatio = stats.pullRequests ? stats.reviews / stats.pullRequests : 0

  const insights = [
    top && {
      icon: PieChart,
      ember: true,
      title: `${top.name} leads your codebase`,
      body: `${top.value}% of the bytes across the ${meta.analyzedRepos} analysed repositories are ${top.name}${
        topTrend > 1
          ? `, and its share is up ${topTrend} points in repositories pushed in the last 90 days.`
          : topTrend < -1
            ? `, though its share is down ${Math.abs(topTrend)} points in repositories pushed in the last 90 days.`
            : ', with a steady share between recent and older repositories.'
      }`,
    },
    busiest && {
      icon: GitCommit,
      ember: false,
      title: `${busiest.date} was your busiest month`,
      body: `${busiest.commits} commits and ${busiest.prs ?? 0} pull requests, against ${stats.commits} commits over the full twelve months. Your longest current streak is ${stats.streakDays} day${stats.streakDays === 1 ? '' : 's'}.`,
    },
    weakest && {
      icon: Gauge,
      ember: false,
      title: `${DIM_LABEL[weakest.key][0].toUpperCase()}${DIM_LABEL[weakest.key].slice(1)} is your thinnest signal`,
      body: `It averages ${weakest.value} of 100 across the analysed repositories, and ${lagging} of ${repositories.length} score below 60. This is a derived score — see how it is built below.`,
    },
    {
      icon: TrendingUp,
      ember: false,
      title:
        reviewRatio >= 0.5 ? 'You review as much as you ship' : 'You ship more than you review',
      body: `${stats.pullRequests} pull requests opened against ${stats.reviews} reviews given in the last year, across ${stats.contributors} distinct collaborators.`,
    },
  ].filter(Boolean) as {
    icon: typeof PieChart
    ember: boolean
    title: string
    body: string
  }[]

  return (
    <div className="section-stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Instrumentation</p>
          <h1 className="page-title text-engrave">Analytics</h1>
          <p className="page-lede">
            Read live from GitHub for <span className="text-ink-muted">@{profile.user.handle}</span>.
            Volume, languages and collaboration are measured; hygiene and complexity are derived
            from repository signals.
          </p>
        </div>
        <div className="chip !px-4 !py-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent-light">
            {meta.rateRemaining} calls left
          </span>
        </div>
      </header>
      {/* ------------------------------------------------------- collaboration */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">01 — Together</p>
            <h2 className="section-title">Collaboration</h2>
            <p className="section-note">
              Your own contribution totals for the last twelve months, public and private.
            </p>
          </div>
          <p className="text-xs uppercase tracking-luxe text-ink-faint">Measured</p>
        </div>
        <CollaborationStats stats={analytics.collaboration} />
      </section>

      {/* ------------------------------------------------------------ activity */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">02 — Volume</p>
            <h2 className="section-title">
              <GitCommit className="w-5 h-5 text-accent" />
              Commit Activity
            </h2>
            <p className="section-note">Monthly commits and pull requests over the past year.</p>
          </div>
          {delta !== null && (
            <div className="chip">
              {delta >= 0 ? (
                <TrendingUp className="w-3 h-3 text-accent-light" />
              ) : (
                <TrendingDown className="w-3 h-3 text-bad" />
              )}
              <span
                className={`text-xs font-medium ${delta >= 0 ? 'text-accent-light' : 'text-bad'}`}
              >
                {delta >= 0 ? '+' : ''}
                {delta}% vs {lastMonth.date}
              </span>
            </div>
          )}
        </div>
        <div className="card pad-luxe">
          <ActivityChart data={analytics.activity} />
        </div>
      </section>
      {/* --------------------------------------------------------- composition */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">03 — Make-up</p>
            <h2 className="section-title">Distribution &amp; Hygiene</h2>
            <p className="section-note">
              What the codebase is made of, and whether the projects you start now are set up
              better than the ones you started earlier.
            </p>
          </div>
        </div>

        <div className="stack-grid lg:grid-cols-2">
          <div className="card pad-luxe group">
            <h3 className="eyebrow flex items-center gap-2 mb-2">
              <PieChart className="w-3.5 h-3.5" />
              Language Distribution
            </h3>
            <p className="mb-6 text-xs text-ink-faint">
              Share of bytes reported by GitHub for the analysed repositories.
            </p>
            <LanguagePie data={analytics.languages} />
          </div>

          <div className="card pad-luxe group">
            <h3 className="eyebrow flex items-center gap-2 mb-2">
              <Gauge className="w-3.5 h-3.5" />
              Hygiene by Repository Cohort
            </h3>
            <p className="mb-6 text-xs text-ink-faint">
              Each point is the quarter a repository was created, scored as it stands today.
              GitHub keeps no history of past quality, so this is a trend in how you start
              projects — not a record of how they changed.
            </p>
            <QualityChart data={analytics.quality} />
          </div>
        </div>
      </section>
      {/* ---------------------------------------------------------- complexity */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">04 — Weight</p>
            <h2 className="section-title">
              <Code className="w-5 h-5 text-accent-burnt" />
              Repository Complexity
            </h2>
            <p className="section-note">
              Derived from repository size, language count and open-issue volume, against a
              maintainability score built from push recency, licence, CI and linter config.
            </p>
          </div>
          <div className="chip">
            <span className="text-xs font-medium text-ink-muted">Lower complexity is better</span>
          </div>
        </div>
        <div className="card pad-luxe">
          <ComplexityChart data={analytics.complexity} />
        </div>
      </section>
      {/* ------------------------------------------------------------ insights */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">05 — Read-out</p>
            <h2 className="section-title">Insights</h2>
            <p className="section-note">Computed from the figures above, not written in advance.</p>
          </div>
        </div>

        <div className="stack-grid sm:grid-cols-2">
          {insights.map(({ icon: Icon, ember, title, body }) => (
            <div key={title} className="card pad-luxe group">
              <div className="flex items-start gap-5">
                <div className={`icon-tile w-11 h-11 shrink-0 ${ember ? 'icon-tile--ember' : ''}`}>
                  <Icon
                    className={`w-5 h-5 ${ember ? 'text-accent-light' : 'text-accent-apricot'}`}
                  />
                </div>
                <div className="depth-1">
                  <h3 className="text-sm font-semibold text-ink mb-2 group-hover:text-gradient transition-all duration-500">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}