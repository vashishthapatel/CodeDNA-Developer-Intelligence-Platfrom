/**
 * Builds the dashboard's domain objects out of live GitHub responses.
 *
 * Which numbers are measured and which are derived:
 *   measured  — repository list, stars, forks, sizes, languages (bytes), topics,
 *               licence, push dates, contributor lists, per-repo commit / PR /
 *               issue counts, Actions workflow counts, the 365-day contribution
 *               calendar, and monthly commit + PR totals.
 *   derived   — the DNA score, skill values, repository health rings, the
 *               complexity chart, the cohort hygiene chart, and every
 *               recommendation. All of them are functions of the measured
 *               signals; see `derive.ts` for the arithmetic.
 */

import type {
  ActivityPoint,
  AnalyticsOverview,
  ComplexityBar,
  DnaProfile,
  HeatCell,
  LanguageSlice,
  Notification,
  OverviewStats,
  QualityPoint,
  Recommendation,
  Repository,
  Skill,
  User,
} from './types'
import { series } from './palette'
import * as gh from './github'
import {
  archetypeFor,
  categoryForLanguage,
  clamp,
  currentStreak,
  daysSince,
  detectPatterns,
  detectStack,
  dnaScore,
  hasContainer,
  hasK8s,
  hasTests,
  repoHealth,
  scoreBand,
  type DnaBreakdown,
  type RepoSignals,
} from './derive'

/** How many repositories get the per-repo fan-out. Beyond this the tail is noise. */
const DETAIL_LIMIT = 20
/**
 * Repositories analysed at once. Each one issues seven parallel calls, so this
 * caps us at ~21 requests in flight — well inside GitHub's concurrency guidance,
 * which is what trips the secondary rate limit long before the hourly quota does.
 */
const CONCURRENCY = 3

export interface ProfileMeta {
  fetchedAt: string
  analyzedRepos: number
  totalRepos: number
  rateRemaining: number | null
  login: string
}

export interface Profile {
  user: User
  stats: OverviewStats
  dna: DnaProfile
  breakdown: DnaBreakdown
  analytics: AnalyticsOverview
  repositories: Repository[]
  recommendations: Recommendation[]
  notifications: Notification[]
  meta: ProfileMeta
}

export type Progress = (stage: string, done: number, total: number) => void

/** One analysed repository: the raw payload plus everything we fanned out for. */
interface Detail {
  repo: gh.GhRepo
  bytes: Record<string, number>
  contributors: gh.GhContributor[]
  contributorCount: number
  commits: number
  prs: number
  issues: number
  workflows: number
  files: string[]
}

function signalsFor(d: Detail): RepoSignals {
  const langs = Object.entries(d.bytes)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
  return {
    files: d.files,
    workflows: d.workflows,
    languages: langs.length ? langs : d.repo.language ? [d.repo.language] : [],
    topics: d.repo.topics ?? [],
    contributors: d.contributorCount,
    openIssues: d.repo.open_issues_count,
    totalIssues: Math.max(d.issues, d.repo.open_issues_count),
    stars: d.repo.stargazers_count,
    forks: d.repo.forks_count,
    sizeKb: d.repo.size,
    pushedDaysAgo: daysSince(d.repo.pushed_at),
    ageDays: daysSince(d.repo.created_at),
    hasLicense: Boolean(d.repo.license?.spdx_id && d.repo.license.spdx_id !== 'NOASSERTION'),
    hasDescription: Boolean(d.repo.description?.trim()),
    hasWiki: d.repo.has_wiki,
    archived: d.repo.archived,
  }
}

/**
 * Which repositories earn the per-repo calls. Original work the user still
 * touches comes first; forks and archives fill any remaining slots.
 */
function pickForDetail(repos: gh.GhRepo[]): gh.GhRepo[] {
  const rank = (r: gh.GhRepo) => (r.fork ? 2 : 0) + (r.archived ? 1 : 0)
  return [...repos]
    .sort((a, b) => rank(a) - rank(b) || daysSince(a.pushed_at) - daysSince(b.pushed_at))
    .slice(0, DETAIL_LIMIT)
}

/* ------------------------------------------------------------------- the fetch */

function emptyGraphFor(login: string): gh.GhViewerGraph {
  return {
    viewer: {
      login,
      contributionsCollection: {
        totalCommitContributions: 0,
        totalPullRequestContributions: 0,
        totalPullRequestReviewContributions: 0,
        totalIssueContributions: 0,
        restrictedContributionsCount: 0,
        contributionCalendar: { totalContributions: 0, weeks: [] },
      },
      pullRequests: { totalCount: 0 },
      issues: { totalCount: 0 },
      organizations: { totalCount: 0 },
    },
  }
}

function emptyMonthly(): gh.MonthlyPoint[] {
  const out: gh.MonthlyPoint[] = []
  const now = new Date()
  for (let back = 11; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1)
    out.push({ label: d.toLocaleString('en-US', { month: 'short' }), commits: 0, prs: 0 })
  }
  return out
}

export async function loadProfile(
  token: string,
  onProgress?: Progress,
  signal?: AbortSignal,
): Promise<Profile> {
  onProgress?.('Reading your account', 0, 4)
  const [account, repos] = await Promise.all([
    gh.fetchViewer(token, signal),
    gh.fetchRepos(token, signal),
  ])

  onProgress?.('Reading contribution history', 1, 4)
  const [graphRaw, monthlyRaw] = await Promise.all([
    gh.fetchContributions(token, signal).catch((err) => {
      if ((err as Error)?.name === 'AbortError') throw err
      console.warn('[CodeDNA] contributions fetch failed — continuing without calendar', err)
      return null as gh.GhViewerGraph | null
    }),
    gh.fetchMonthly(token, signal).catch((err) => {
      if ((err as Error)?.name === 'AbortError') throw err
      console.warn('[CodeDNA] monthly fetch failed — continuing without activity', err)
      return null as gh.MonthlyPoint[] | null
    }),
  ])
  const graph = graphRaw ?? emptyGraphFor(account.login)
  const monthly = monthlyRaw ?? emptyMonthly()

  const targets = pickForDetail(repos)
  let finished = 0
  onProgress?.('Analysing repositories', 2, 4)

  const details = (
    await gh.pool(
      targets.map((repo) => async () => {
        const full = repo.full_name
        const [bytes, contributors, commits, prs, issueish, workflows, files] = await Promise.all([
          gh.fetchLanguages(full, token, signal).catch(() => ({}) as Record<string, number>),
          gh.fetchContributors(full, token, signal),
          gh.fetchCommitCount(full, account.login, token, signal).catch(() => 0),
          gh.fetchPrCount(full, token, signal).catch(() => 0),
          gh.fetchIssueCount(full, token, signal).catch(() => 0),
          gh.fetchWorkflowCount(full, token, signal),
          gh.fetchRootListing(full, token, signal),
        ])
        finished++
        onProgress?.(`Analysing ${repo.name}`, 2 + finished / targets.length, 4)
        // GitHub counts pull requests as issues on /issues, so subtract them back out.
        const named = contributors.filter((c) => c.login).length
        return {
          repo,
          bytes,
          contributors,
          contributorCount: contributors.length || (named ? named : 1),
          commits,
          prs,
          issues: Math.max(0, issueish - prs),
          workflows,
          files,
        } satisfies Detail
      }),
      CONCURRENCY,
    )
  ).filter((d): d is Detail => d !== null)

  onProgress?.('Building your profile', 3, 4)
  const rate = await gh.fetchRateLimit(token, signal)
  return assemble(account, repos, details, graph, monthly, rate)
}

/* ------------------------------------------------------------------- languages */

interface LangTotals {
  all: Record<string, number>
  recent: Record<string, number>
  older: Record<string, number>
  /** How many analysed repositories use each language at all. */
  repoCount: Record<string, number>
}

/** Byte totals per language, split by whether the repo was pushed inside 90 days. */
function languageTotals(details: Detail[]): LangTotals {
  const all: Record<string, number> = {}
  const recent: Record<string, number> = {}
  const older: Record<string, number> = {}
  const repoCount: Record<string, number> = {}

  for (const d of details) {
    const fresh = daysSince(d.repo.pushed_at) < 90
    for (const [lang, bytes] of Object.entries(d.bytes)) {
      if (!bytes) continue
      all[lang] = (all[lang] ?? 0) + bytes
      repoCount[lang] = (repoCount[lang] ?? 0) + 1
      const bucket = fresh ? recent : older
      bucket[lang] = (bucket[lang] ?? 0) + bytes
    }
  }
  return { all, recent, older, repoCount }
}

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)

/** Share-point difference between recent and older work: a real directional signal. */
function languageTrend(lang: string, t: LangTotals): number {
  const recentTotal = sum(t.recent)
  const olderTotal = sum(t.older)
  if (!recentTotal && !olderTotal) return 0
  const r = recentTotal ? ((t.recent[lang] ?? 0) / recentTotal) * 100 : 0
  const o = olderTotal ? ((t.older[lang] ?? 0) / olderTotal) * 100 : 0
  return Math.max(-12, Math.min(12, Math.round(r - o)))
}

/**
 * Language proficiency: 55% how much of your code is in it (relative to your
 * strongest language), 30% how many of your repositories use it, 15% whether it
 * appears in work you have touched in the last 90 days.
 */
function languageSkills(t: LangTotals, repoTotal: number, limit = 6): Skill[] {
  const entries = Object.entries(t.all).sort((a, b) => b[1] - a[1])
  if (!entries.length) return []
  const max = entries[0][1] || 1

  return entries.slice(0, limit).map(([name, bytes]) => {
    const share = bytes / max
    const breadth = repoTotal ? (t.repoCount[name] ?? 0) / repoTotal : 0
    const fresh = (t.recent[name] ?? 0) > 0 ? 1 : 0.35
    const value = clamp(100 * (0.55 * share + 0.3 * Math.min(breadth * 1.6, 1) + 0.15 * fresh), 6, 99)
    return { name, value, category: categoryForLanguage(name), trend: languageTrend(name, t) }
  })
}

function languageSlices(t: LangTotals): LanguageSlice[] {
  const entries = Object.entries(t.all).sort((a, b) => b[1] - a[1])
  const total = sum(t.all)
  if (!total) return []

  const top = entries.slice(0, 5)
  const restBytes = entries.slice(5).reduce((a, [, b]) => a + b, 0)
  const slices: LanguageSlice[] = top.map(([name, bytes], i) => ({
    name,
    value: Math.max(1, Math.round((bytes / total) * 100)),
    color: series[i % series.length],
  }))
  if (restBytes > 0) {
    slices.push({
      name: 'Other',
      value: Math.max(1, Math.round((restBytes / total) * 100)),
      color: series[5 % series.length],
    })
  }
  return slices
}

/* ----------------------------------------------------------------- engineering */

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

/**
 * Four engineering dimensions, each an average over the analysed repositories of
 * a score in `derive.ts`. Automation is simply the share of repositories that run
 * GitHub Actions.
 */
function engineeringSkills(details: Detail[], collaborationPct: number): Skill[] {
  const health = details.map((d) => repoHealth(signalsFor(d)))
  const withCi = details.filter((d) => d.workflows > 0).length
  const automation = details.length ? (withCi / details.length) * 100 : 0

  return [
    { name: 'Collaboration', value: clamp(collaborationPct, 0, 100), category: 'collaboration' },
    { name: 'Documentation', value: clamp(mean(health.map((h) => h.documentation))), category: 'engineering' },
    { name: 'Testing', value: clamp(mean(health.map((h) => h.testing))), category: 'engineering' },
    { name: 'Automation', value: clamp(automation), category: 'infrastructure' },
  ]
}

/* -------------------------------------------------------------------- calendar */

function calendarDays(graph: gh.GhViewerGraph): gh.GhContribDay[] {
  return graph.viewer.contributionsCollection.contributionCalendar.weeks.flatMap(
    (w) => w.contributionDays,
  )
}

/**
 * Real contribution calendar. Levels are quartiles of this account's own busiest
 * day, which is how GitHub shades its own graph — a five-commit day means
 * something different for different people.
 */
function buildHeatmap(days: gh.GhContribDay[]): HeatCell[] {
  const max = days.reduce((m, d) => Math.max(m, d.contributionCount), 0)
  const step = max / 4 || 1
  return days.map((d) => {
    const level = (
      d.contributionCount === 0 ? 0 : Math.min(4, Math.ceil(d.contributionCount / step))
    ) as HeatCell['level']
    return { date: d.date, count: d.contributionCount, level }
  })
}

function buildActivity(monthly: gh.MonthlyPoint[]): ActivityPoint[] {
  return monthly.map((m) => ({ date: m.label, commits: m.commits, prs: m.prs }))
}

/* ---------------------------------------------------------------- repo cohorts */

/**
 * Hygiene by the quarter a repository was created. This is a genuine trend —
 * grouping by `created_at` and averaging each cohort's current code-quality and
 * test-evidence scores shows whether the projects you start now are set up better
 * than the ones you started two years ago. It is not a history of past quality;
 * GitHub does not keep one.
 */
function buildCohorts(details: Detail[]): QualityPoint[] {
  const buckets = new Map<string, { order: number; quality: number[]; testing: number[] }>()

  for (const d of details) {
    const created = new Date(d.repo.created_at)
    if (Number.isNaN(created.getTime())) continue
    const q = Math.floor(created.getMonth() / 3) + 1
    const label = `Q${q} ${String(created.getFullYear()).slice(2)}`
    const order = created.getFullYear() * 4 + q
    const health = repoHealth(signalsFor(d))
    const bucket = buckets.get(label) ?? { order, quality: [], testing: [] }
    bucket.quality.push(health.codeQuality)
    bucket.testing.push(health.testing)
    buckets.set(label, bucket)
  }

  return [...buckets.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .slice(-7)
    .map(([date, b]) => ({
      date,
      quality: clamp(mean(b.quality)),
      coverage: clamp(mean(b.testing)),
    }))
}

/** The six largest analysed repositories, by scale against hygiene. */
function buildComplexity(details: Detail[]): ComplexityBar[] {
  return [...details]
    .sort((a, b) => b.repo.size - a.repo.size)
    .slice(0, 6)
    .map((d) => {
      const health = repoHealth(signalsFor(d))
      return {
        repo: d.repo.name,
        complexity: health.complexity,
        maintainability: health.maintainability,
      }
    })
}

/* ---------------------------------------------------------------- repositories */

function buildRepositories(details: Detail[]): Repository[] {
  const commitTotal = details.reduce((a, d) => a + d.commits, 0)
  const sizeTotal = details.reduce((a, d) => a + d.repo.size, 0)

  return details
    .map((d) => {
      const s = signalsFor(d)
      // Commit share is the honest weighting. When none of the commits resolve to
      // this account — commits authored under an unlinked email, say — fall back
      // to how much of the analysed code lives in the repo.
      const share = commitTotal > 0 ? d.commits / commitTotal : sizeTotal > 0 ? d.repo.size / sizeTotal : 0
      return {
        id: `gh_${d.repo.id}`,
        name: d.repo.name,
        description: d.repo.description?.trim() || 'No description on GitHub.',
        primaryLanguage: s.languages[0] ?? d.repo.language ?? 'Unknown',
        languages: s.languages.slice(0, 4),
        stars: d.repo.stargazers_count,
        forks: d.repo.forks_count,
        commits: d.commits,
        pullRequests: d.prs,
        issues: d.issues,
        contributors: d.contributorCount,
        dnaContribution: Math.round(share * 100),
        updatedAt: (d.repo.pushed_at ?? d.repo.updated_at).slice(0, 10),
        visibility: d.repo.private ? ('private' as const) : ('public' as const),
        health: repoHealth(s),
        stack: detectStack(s),
        patterns: detectPatterns(s),
      }
    })
    .sort((a, b) => b.dnaContribution - a.dnaContribution || b.commits - a.commits)
}

/* -------------------------------------------------------------- recommendations */

/**
 * Gaps, not guesses. Each recommendation fires only when a measured signal falls
 * short, and its `reason` quotes the count that triggered it, so you can check it
 * against your own repositories. `match` scales with the size of the gap.
 */
function buildRecommendations(
  details: Detail[],
  t: LangTotals,
  reviews: number,
  archetype: string,
): Recommendation[] {
  const n = details.length
  if (!n) return []
  const out: Recommendation[] = []
  const push = (r: Recommendation) => out.push(r)
  const gapMatch = (gap: number) => clamp(58 + gap * 40, 55, 99)

  const withTests = details.filter((d) => hasTests(d.files)).length
  const withCi = details.filter((d) => d.workflows > 0).length
  const withDocker = details.filter((d) => hasContainer(d.files)).length
  const withK8s = details.filter((d) => hasK8s(d.files)).length
  const withLicence = details.filter((d) => signalsFor(d).hasLicense).length
  const docs = mean(details.map((d) => repoHealth(signalsFor(d)).documentation))

  if (withTests / n < 0.65) {
    push({
      id: 'rec_testing',
      title: 'Automated Testing',
      reason: `${withTests} of your ${n} analysed repositories show a test suite at the root. Visible tests are the fastest way to lift the rest of your scores.`,
      difficulty: 'Intermediate',
      duration: '3–5 weeks',
      category: 'Engineering',
      match: gapMatch(1 - withTests / n),
      tags: ['Unit Tests', 'Fixtures', 'Coverage'],
    })
  }

  if (withCi / n < 0.7) {
    push({
      id: 'rec_ci',
      title: 'CI/CD with GitHub Actions',
      reason: `${withCi} of ${n} repositories run any Actions workflow. A build-and-test workflow is the single cheapest quality gate available to you.`,
      difficulty: 'Beginner',
      duration: '1–2 weeks',
      category: 'Automation',
      match: gapMatch(1 - withCi / n),
      tags: ['Workflows', 'Matrix Builds', 'Caching'],
    })
  }

  if (withDocker === 0) {
    push({
      id: 'rec_docker',
      title: 'Containerization with Docker',
      reason: `None of your ${n} analysed repositories contain a Dockerfile or Compose file, so none of them can be reproduced on another machine in one command.`,
      difficulty: 'Beginner',
      duration: '2–3 weeks',
      category: 'Infrastructure',
      match: gapMatch(0.8),
      tags: ['Images', 'Layers', 'Compose'],
    })
  } else if (withK8s === 0) {
    push({
      id: 'rec_k8s',
      title: 'Kubernetes',
      reason: `${withDocker} of your repositories are containerized but none carry deployment manifests — orchestration is the missing half of that story.`,
      difficulty: 'Intermediate',
      duration: '4–6 weeks',
      category: 'Infrastructure',
      match: gapMatch(0.65),
      tags: ['Helm', 'Manifests', 'Autoscaling'],
    })
  }

  if (docs < 70) {
    push({
      id: 'rec_docs',
      title: 'Technical Documentation',
      reason: `Your average documentation score across analysed repositories is ${Math.round(docs)}/100, counting README, description, topics and contribution guides.`,
      difficulty: 'Beginner',
      duration: '1–2 weeks',
      category: 'Communication',
      match: gapMatch((70 - docs) / 70),
      tags: ['README', 'ADRs', 'Examples'],
    })
  }

  if (withLicence / n < 0.5) {
    push({
      id: 'rec_licence',
      title: 'Open-source Licensing',
      reason: `${withLicence} of ${n} repositories declare a licence. Without one, nobody can legally reuse the work — including a future employer reviewing it.`,
      difficulty: 'Beginner',
      duration: 'An afternoon',
      category: 'Practice',
      match: gapMatch(1 - withLicence / n),
      tags: ['MIT', 'Apache-2.0', 'Attribution'],
    })
  }

  if (reviews < 15) {
    push({
      id: 'rec_review',
      title: 'Code Review Practice',
      reason: `GitHub records ${reviews} pull-request review${reviews === 1 ? '' : 's'} from you in the last year. Reviewing is the fastest way to see designs other than your own.`,
      difficulty: 'Intermediate',
      duration: 'Ongoing',
      category: 'Collaboration',
      match: gapMatch((15 - reviews) / 15),
      tags: ['Feedback', 'Design Review', 'Mentoring'],
    })
  }

  const langCount = Object.keys(t.all).length
  if (langCount < 4) {
    push({
      id: 'rec_breadth',
      title: 'A Second Ecosystem',
      reason: `Your analysed code spans ${langCount} language${langCount === 1 ? '' : 's'}. One more ecosystem is what turns depth into range.`,
      difficulty: 'Intermediate',
      duration: '6–8 weeks',
      category: 'Breadth',
      match: gapMatch((4 - langCount) / 4),
      tags: ['Idioms', 'Tooling', 'Interop'],
    })
  }

  const NEXT_STEP: Record<string, [string, string, string[]]> = {
    'Systems Builder': ['Distributed Systems', 'Architecture', ['Consensus', 'Sharding', 'CAP']],
    'Interface Craftsman': ['Accessibility & Performance', 'Frontend', ['a11y', 'Core Web Vitals', 'Bundles']],
    'Data Wrangler': ['Data Pipeline Engineering', 'Data', ['Orchestration', 'Schemas', 'Lineage']],
    'Infrastructure Builder': ['Observability', 'Operations', ['Tracing', 'Metrics', 'SLOs']],
    'Full-stack Generalist': ['System Design', 'Architecture', ['Scalability', 'Trade-offs', 'Modeling']],
    'App Builder': ['Offline-first Architecture', 'Mobile', ['Sync', 'Storage', 'Conflicts']],
  }

  const step = NEXT_STEP[archetype]
  const topLang = Object.entries(t.all).sort((a, b) => b[1] - a[1])[0]?.[0]
  if (step && topLang) {
    push({
      id: 'rec_next',
      title: step[0],
      reason: `${topLang} carries most of your analysed code, which puts you at the point where ${step[0].toLowerCase()} is the next thing that pays off.`,
      difficulty: 'Advanced',
      duration: '6–8 weeks',
      category: step[1],
      match: 88,
      tags: step[2],
    })
  }

  return out.sort((a, b) => b.match - a.match).slice(0, 6)
}

/* --------------------------------------------------------------- notifications */

/** Real events and real counts — no synthetic "analysis complete" chatter. */
function buildNotifications(details: Detail[], streak: number): Notification[] {
  const out: Notification[] = []
  const now = new Date().toISOString()
  const newest = [...details].sort(
    (a, b) => daysSince(a.repo.pushed_at) - daysSince(b.repo.pushed_at),
  )[0]

  if (newest?.repo.pushed_at) {
    const days = Math.floor(daysSince(newest.repo.pushed_at))
    out.push({
      id: 'n_push',
      title: `${newest.repo.name} updated`,
      body: `Last push ${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}${
        newest.commits ? ` • ${newest.commits} of its commits are yours` : ''
      }.`,
      type: 'system',
      read: false,
      createdAt: newest.repo.pushed_at,
    })
  }

  if (streak > 0) {
    out.push({
      id: 'n_streak',
      title: `${streak}-day contribution streak`,
      body: 'Counted from your GitHub contribution calendar, ending today.',
      type: 'analysis',
      read: false,
      createdAt: now,
    })
  }

  const dormant = details.filter((d) => daysSince(d.repo.pushed_at) > 180 && !d.repo.archived)
  if (dormant.length) {
    out.push({
      id: 'n_dormant',
      title: `${dormant.length} repositor${dormant.length === 1 ? 'y looks' : 'ies look'} dormant`,
      body: `No push in over six months: ${dormant.slice(0, 3).map((d) => d.repo.name).join(', ')}${
        dormant.length > 3 ? ` and ${dormant.length - 3} more` : ''
      }.`,
      type: 'recommendation',
      read: false,
      createdAt: now,
    })
  }

  const busiest = [...details].sort((a, b) => b.repo.open_issues_count - a.repo.open_issues_count)[0]
  if (busiest && busiest.repo.open_issues_count > 0) {
    out.push({
      id: 'n_issues',
      title: `${busiest.repo.open_issues_count} open on ${busiest.repo.name}`,
      body: 'Issues and pull requests still awaiting a decision, as GitHub counts them.',
      type: 'system',
      read: true,
      createdAt: now,
    })
  }

  const unlicensed = details.filter((d) => !signalsFor(d).hasLicense && !d.repo.private)
  if (unlicensed.length) {
    out.push({
      id: 'n_licence',
      title: `${unlicensed.length} public repo${unlicensed.length === 1 ? '' : 's'} without a licence`,
      body: 'Nobody can legally reuse them until one is added.',
      type: 'recommendation',
      read: true,
      createdAt: now,
    })
  }

  return out.slice(0, 4)
}

/* ------------------------------------------------------------------- assembling */

function assemble(
  account: gh.GhUser,
  allRepos: gh.GhRepo[],
  details: Detail[],
  graph: gh.GhViewerGraph,
  monthly: gh.MonthlyPoint[],
  rate: gh.RateLimit | null,
): Profile {
  const c = graph.viewer.contributionsCollection
  const days = calendarDays(graph)
  const streak = currentStreak(days)
  const t = languageTotals(details)

  // Distinct people other than you, unioned across the analysed repositories.
  const collaborators = new Set<string>()
  for (const d of details) {
    for (const person of d.contributors) {
      if (person.login && person.login !== account.login) collaborators.add(person.login)
    }
  }

  const health = details.map((d) => repoHealth(signalsFor(d)))
  const hygiene = mean([
    mean(health.map((h) => h.codeQuality)),
    mean(health.map((h) => h.testing)),
    mean(health.map((h) => h.documentation)),
  ])

  const stars = allRepos.reduce((a, r) => a + r.stargazers_count, 0)
  const forks = allRepos.reduce((a, r) => a + r.forks_count, 0)

  const breakdown = dnaScore({
    commits: c.totalCommitContributions,
    pullRequests: c.totalPullRequestContributions,
    reviews: c.totalPullRequestReviewContributions,
    issues: c.totalIssueContributions,
    collaborators: collaborators.size,
    languageCount: Object.keys(t.all).length,
    repoCount: allRepos.length,
    stars,
    forks,
    hygiene,
  })

  const shape = archetypeFor(t.all)
  const label = `${scoreBand(breakdown.total)} ${shape.title}`
  const collaborationPct = (breakdown.collaboration / 20) * 100

  const languages = languageSkills(t, details.length)
  const engineering = engineeringSkills(details, collaborationPct)
  const recommendations = buildRecommendations(
    details,
    t,
    c.totalPullRequestReviewContributions,
    shape.archetype,
  )

  const user: User = {
    id: `gh_${account.login}`,
    name: account.name?.trim() || account.login,
    handle: account.login,
    title: shape.title,
    bio:
      account.bio?.trim() ||
      `${account.public_repos} public repositories · ${account.followers} followers`,
    avatarUrl: account.avatar_url,
    location: account.location ?? undefined,
    company: account.company ?? undefined,
    joinedAt: account.created_at.slice(0, 10),
    githubConnected: true,
  }

  const stats: OverviewStats = {
    dnaScore: breakdown.total,
    scoreLabel: label,
    repositories: allRepos.length,
    commits: c.totalCommitContributions,
    pullRequests: c.totalPullRequestContributions,
    languages: Object.keys(t.all).length,
    reviews: c.totalPullRequestReviewContributions,
    issues: c.totalIssueContributions,
    contributors: collaborators.size,
    streakDays: streak,
  }

  const dna: DnaProfile = {
    score: breakdown.total,
    label,
    strongestArea: shape.strongestArea,
    recommendedSkill: recommendations[0]?.title ?? 'Keep shipping',
    archetype: shape.archetype,
    languages,
    engineering,
    // Eight axes: your four strongest languages against the four engineering
    // dimensions, so the radar compares what you write with how you write it.
    radial: [...languages.slice(0, 4), ...engineering].map(({ name, value, category }) => ({
      name,
      value,
      category,
    })),
  }

  const analytics: AnalyticsOverview = {
    activity: buildActivity(monthly),
    languages: languageSlices(t),
    quality: buildCohorts(details),
    complexity: buildComplexity(details),
    heatmap: buildHeatmap(days),
    collaboration: {
      pullRequests: c.totalPullRequestContributions,
      reviews: c.totalPullRequestReviewContributions,
      issues: c.totalIssueContributions,
      contributors: collaborators.size,
    },
  }

  return {
    user,
    stats,
    dna,
    breakdown,
    analytics,
    repositories: buildRepositories(details),
    recommendations,
    notifications: buildNotifications(details, streak),
    meta: {
      fetchedAt: new Date().toISOString(),
      analyzedRepos: details.length,
      totalRepos: allRepos.length,
      rateRemaining: rate?.remaining ?? null,
      login: account.login,
    },
  }
}
