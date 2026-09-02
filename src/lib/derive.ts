/**
 * Everything the dashboard shows that GitHub does not measure directly.
 *
 * GitHub's API exposes no code quality, coverage, complexity or maintainability
 * numbers. Rather than invent them, every score below is a documented function of
 * signals GitHub *does* give us: the files sitting in a repository's root, the
 * number of Actions workflows, byte counts per language, contributor counts, push
 * recency, issue volume and repository size. The formulas are deliberately dull
 * and stated in full so a reader can check the arithmetic against their own repos.
 *
 * The UI labels anything from this module as derived.
 */

import type { RepoHealth, SkillCategory } from './types'

export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)))

/** Days since an ISO timestamp; `Infinity` when the repo has never been pushed. */
export function daysSince(iso: string | null | undefined): number {
  if (!iso) return Infinity
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return Infinity
  return Math.max(0, (Date.now() - then) / 86_400_000)
}

/** Evidence read off one repository. Everything here comes from a real response. */
export interface RepoSignals {
  /** Lower-cased names of the entries in the repository root. */
  files: string[]
  /** Number of GitHub Actions workflows. */
  workflows: number
  languages: string[]
  topics: string[]
  contributors: number
  openIssues: number
  totalIssues: number
  stars: number
  forks: number
  /** Repository size in KB, as GitHub reports it. */
  sizeKb: number
  pushedDaysAgo: number
  ageDays: number
  hasLicense: boolean
  hasDescription: boolean
  hasWiki: boolean
  archived: boolean
}

const startsWithAny = (files: string[], prefixes: string[]) =>
  files.some((f) => prefixes.some((p) => f.startsWith(p)))

const hasAny = (files: string[], names: string[]) => files.some((f) => names.includes(f))

/* ------------------------------------------------------------ file-level facts */

export const hasReadme = (f: string[]) => startsWithAny(f, ['readme'])

export const hasContributing = (f: string[]) => startsWithAny(f, ['contributing', 'code_of_conduct'])

export const hasDocs = (f: string[]) =>
  hasAny(f, ['docs', 'doc', 'documentation', 'wiki', 'examples', 'example']) ||
  startsWithAny(f, ['changelog', 'openapi', 'swagger'])

/**
 * Visible test evidence: a test directory at the root, or a test-runner config.
 * Java and Go projects hide tests below the root, so this under-reports them —
 * `testingScore` compensates with a partial credit for CI plus a build file.
 */
export const hasTests = (f: string[]) =>
  hasAny(f, ['test', 'tests', 'spec', 'specs', '__tests__', 'testing', 'e2e', 'cypress']) ||
  hasAny(f, [
    'jest.config.js',
    'jest.config.ts',
    'jest.config.mjs',
    'vitest.config.ts',
    'vitest.config.js',
    'playwright.config.ts',
    'cypress.config.ts',
    'karma.conf.js',
    'pytest.ini',
    'tox.ini',
    'phpunit.xml',
    'phpunit.xml.dist',
    'conftest.py',
  ]) ||
  f.some((n) => /(^|[._-])(test|spec)s?\.[a-z]+$/.test(n))

export const hasCoverage = (f: string[]) =>
  hasAny(f, ['codecov.yml', '.codecov.yml', '.coveragerc', 'jacoco.xml', 'sonar-project.properties'])

export const hasLinter = (f: string[]) =>
  startsWithAny(f, ['.eslintrc', '.prettierrc', '.editorconfig', '.golangci', '.rubocop']) ||
  hasAny(f, [
    'eslint.config.js',
    'eslint.config.mjs',
    'checkstyle.xml',
    'spotbugs.xml',
    '.flake8',
    'ruff.toml',
    '.pylintrc',
    'clippy.toml',
  ])

export const hasContainer = (f: string[]) =>
  startsWithAny(f, ['dockerfile', 'docker-compose', 'compose.y', 'containerfile'])

export const hasK8s = (f: string[]) =>
  hasAny(f, ['k8s', 'kubernetes', 'helm', 'chart.yaml', 'kustomization.yaml', 'manifests'])

export const hasIaC = (f: string[]) =>
  hasAny(f, ['terraform', 'main.tf', 'pulumi.yaml', 'ansible', 'cloudformation', 'template.yaml', 'serverless.yml'])

export const hasMonorepo = (f: string[]) =>
  hasAny(f, ['packages', 'apps', 'lerna.json', 'pnpm-workspace.yaml', 'turbo.json', 'nx.json'])

export const hasBuildFile = (f: string[]) =>
  hasAny(f, [
    'pom.xml',
    'build.gradle',
    'build.gradle.kts',
    'package.json',
    'requirements.txt',
    'pyproject.toml',
    'setup.py',
    'go.mod',
    'cargo.toml',
    'gemfile',
    'composer.json',
    'makefile',
    'cmakelists.txt',
    'build.sbt',
    'mix.exs',
    'pubspec.yaml',
  ])

/* ---------------------------------------------------------------------- stack */

/**
 * Tools a repository demonstrably uses, read from the filenames in its root and
 * from its own topics. Nothing is guessed from the repository name.
 */
const FILE_TO_TOOL: [string, string][] = [
  ['pom.xml', 'Maven'],
  ['build.gradle', 'Gradle'],
  ['build.gradle.kts', 'Gradle'],
  ['package.json', 'Node.js'],
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'Yarn'],
  ['vite.config.ts', 'Vite'],
  ['vite.config.js', 'Vite'],
  ['next.config.js', 'Next.js'],
  ['next.config.mjs', 'Next.js'],
  ['nuxt.config.ts', 'Nuxt'],
  ['svelte.config.js', 'Svelte'],
  ['angular.json', 'Angular'],
  ['tailwind.config.js', 'Tailwind CSS'],
  ['tailwind.config.ts', 'Tailwind CSS'],
  ['tsconfig.json', 'TypeScript'],
  ['requirements.txt', 'pip'],
  ['pyproject.toml', 'Python packaging'],
  ['manage.py', 'Django'],
  ['go.mod', 'Go modules'],
  ['cargo.toml', 'Cargo'],
  ['gemfile', 'Bundler'],
  ['composer.json', 'Composer'],
  ['dockerfile', 'Docker'],
  ['docker-compose.yml', 'Docker Compose'],
  ['docker-compose.yaml', 'Docker Compose'],
  ['chart.yaml', 'Helm'],
  ['main.tf', 'Terraform'],
  ['serverless.yml', 'Serverless'],
  ['makefile', 'Make'],
  ['cmakelists.txt', 'CMake'],
  ['mix.exs', 'Elixir/Mix'],
  ['pubspec.yaml', 'Flutter/Dart'],
  ['gemfile.lock', 'Bundler'],
  ['schema.prisma', 'Prisma'],
  ['supabase', 'Supabase'],
]

export function detectStack(signals: RepoSignals): string[] {
  const out = new Set<string>()
  signals.languages.slice(0, 3).forEach((l) => out.add(l))
  for (const [file, tool] of FILE_TO_TOOL) {
    if (signals.files.includes(file)) out.add(tool)
  }
  if (signals.workflows > 0) out.add('GitHub Actions')
  signals.topics.slice(0, 4).forEach((t) => out.add(t))
  return [...out].slice(0, 8)
}

/* ------------------------------------------------------------------- patterns */

/** Practices the repository shows evidence of. Each entry has a file behind it. */
export function detectPatterns(signals: RepoSignals): string[] {
  const p: string[] = []
  const f = signals.files
  if (signals.workflows > 0) p.push('CI/CD')
  if (hasContainer(f)) p.push('Containerized')
  if (hasK8s(f)) p.push('Orchestration')
  if (hasIaC(f)) p.push('Infrastructure as Code')
  if (hasTests(f)) p.push('Automated Tests')
  if (hasCoverage(f)) p.push('Coverage Tracking')
  if (hasLinter(f)) p.push('Lint / Format Gate')
  if (hasMonorepo(f)) p.push('Monorepo')
  if (hasReadme(f)) p.push('Documented')
  if (signals.hasLicense) p.push('Licensed')
  if (hasContributing(f)) p.push('Contribution Guide')
  if (signals.contributors > 1) p.push('Multi-contributor')
  if (signals.languages.length > 2) p.push('Polyglot')
  return p.slice(0, 8)
}

/* --------------------------------------------------------------- health scores */

/**
 * Documentation — README 38, docs folder or changelog 16, description 14,
 * topics 10, contribution guide 10, wiki 6, licence 6.
 */
export function documentationScore(s: RepoSignals): number {
  let v = 0
  if (hasReadme(s.files)) v += 38
  if (hasDocs(s.files)) v += 16
  if (s.hasDescription) v += 14
  if (s.topics.length > 0) v += 10
  if (hasContributing(s.files)) v += 10
  if (s.hasWiki) v += 6
  if (s.hasLicense) v += 6
  return clamp(v)
}

/**
 * Testing — visible tests 46, coverage config 18, CI workflows 22, a build file
 * that would run them 14. Java/Go keep tests below the root, so a repo with CI
 * and a build file still scores 36 without any root-level test evidence.
 */
export function testingScore(s: RepoSignals): number {
  let v = 0
  if (hasTests(s.files)) v += 46
  if (hasCoverage(s.files)) v += 18
  if (s.workflows > 0) v += 22
  if (hasBuildFile(s.files)) v += 14
  return clamp(v)
}

/**
 * Complexity — a scale proxy, not a cyclomatic measurement. Size carries it on a
 * log curve (1 MB of source ≈ 60), with language spread and open-issue volume
 * adding the rest. Higher means a bigger surface to hold in your head.
 */
export function complexityScore(s: RepoSignals): number {
  const size = s.sizeKb <= 0 ? 0 : Math.log10(s.sizeKb + 1) * 20 // 1 MB ≈ 60
  const spread = Math.min(s.languages.length, 6) * 4
  const churn = Math.min(s.openIssues, 30) * 0.5
  return clamp(size + spread + churn, 8, 98)
}

/**
 * Maintainability — pushed recently 30, licence 12, lint config 12, CI 16,
 * more than one contributor 10, and up to 20 for keeping the open-issue ratio low.
 * Archived repositories lose 25.
 */
export function maintainabilityScore(s: RepoSignals): number {
  let v = 10
  if (s.pushedDaysAgo < 30) v += 30
  else if (s.pushedDaysAgo < 90) v += 22
  else if (s.pushedDaysAgo < 365) v += 12
  if (s.hasLicense) v += 12
  if (hasLinter(s.files)) v += 12
  if (s.workflows > 0) v += 16
  if (s.contributors > 1) v += 10
  const ratio = s.totalIssues > 0 ? s.openIssues / s.totalIssues : 0
  v += Math.round((1 - Math.min(ratio, 1)) * 20)
  if (s.archived) v -= 25
  return clamp(v, 5)
}

/**
 * Code quality — the hygiene signals a reviewer would look for first: CI 22,
 * lint config 18, tests 20, README 14, licence 8, description 6, recent push 12.
 */
export function codeQualityScore(s: RepoSignals): number {
  let v = 0
  if (s.workflows > 0) v += 22
  if (hasLinter(s.files)) v += 18
  if (hasTests(s.files)) v += 20
  if (hasReadme(s.files)) v += 14
  if (s.hasLicense) v += 8
  if (s.hasDescription) v += 6
  if (s.pushedDaysAgo < 180) v += 12
  return clamp(v, 5)
}

export function repoHealth(s: RepoSignals): RepoHealth {
  return {
    codeQuality: codeQualityScore(s),
    complexity: complexityScore(s),
    documentation: documentationScore(s),
    testing: testingScore(s),
    maintainability: maintainabilityScore(s),
  }
}

/* ------------------------------------------------------------------ archetypes */

const GROUPS: Record<string, string[]> = {
  backend: ['Java', 'Kotlin', 'Go', 'C#', 'Rust', 'PHP', 'Ruby', 'Scala', 'Elixir', 'C++', 'C', 'Erlang', 'Clojure', 'Haskell', 'Perl'],
  frontend: ['TypeScript', 'JavaScript', 'HTML', 'CSS', 'SCSS', 'Sass', 'Less', 'Vue', 'Svelte', 'Astro', 'MDX'],
  data: ['Python', 'R', 'Jupyter Notebook', 'Julia', 'MATLAB', 'Stan', 'SQL', 'PLpgSQL', 'TSQL'],
  infra: ['Dockerfile', 'HCL', 'Shell', 'Makefile', 'PowerShell', 'Nix', 'CMake', 'Batchfile', 'Smarty'],
  mobile: ['Swift', 'Dart', 'Objective-C', 'Java (Android)'],
}

export function categoryForLanguage(name: string): SkillCategory {
  if (GROUPS.infra.includes(name)) return 'infrastructure'
  return 'language'
}

/** Fraction of the byte total that falls in each group above. */
export function groupShares(bytes: Record<string, number>): Record<string, number> {
  const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1
  const out: Record<string, number> = { backend: 0, frontend: 0, data: 0, infra: 0, mobile: 0 }
  for (const [lang, n] of Object.entries(bytes)) {
    for (const [group, members] of Object.entries(GROUPS)) {
      if (members.includes(lang)) out[group] += n / total
    }
  }
  return out
}

export interface Archetype {
  title: string
  archetype: string
  strongestArea: string
}

export function archetypeFor(bytes: Record<string, number>): Archetype {
  const g = groupShares(bytes)
  const top = Object.entries(g).sort((a, b) => b[1] - a[1])[0]
  const fullstack = g.backend >= 0.2 && g.frontend >= 0.2

  if (!top || top[1] === 0) {
    return { title: 'Developer', archetype: 'Explorer', strongestArea: 'General Engineering' }
  }
  if (g.infra >= 0.3) {
    return { title: 'Platform Engineer', archetype: 'Infrastructure Builder', strongestArea: 'Platform & Tooling' }
  }
  if (fullstack) {
    return { title: 'Full-stack Engineer', archetype: 'Full-stack Generalist', strongestArea: 'End-to-end Delivery' }
  }
  switch (top[0]) {
    case 'backend':
      return { title: 'Backend Engineer', archetype: 'Systems Builder', strongestArea: 'Backend Architecture' }
    case 'frontend':
      return { title: 'Frontend Engineer', archetype: 'Interface Craftsman', strongestArea: 'Interface Engineering' }
    case 'data':
      return { title: 'Data Engineer', archetype: 'Data Wrangler', strongestArea: 'Data & Analytics' }
    case 'mobile':
      return { title: 'Mobile Engineer', archetype: 'App Builder', strongestArea: 'Mobile Development' }
    default:
      return { title: 'Software Engineer', archetype: 'Generalist', strongestArea: 'Software Engineering' }
  }
}

export function scoreBand(score: number): string {
  if (score >= 85) return 'Exceptional'
  if (score >= 75) return 'Strong'
  if (score >= 60) return 'Solid'
  if (score >= 45) return 'Developing'
  return 'Emerging'
}

/* ------------------------------------------------------------------- DNA score */

export interface DnaInputs {
  /** Commits in the trailing 365 days, from the contribution calendar. */
  commits: number
  pullRequests: number
  reviews: number
  issues: number
  /** Distinct collaborator logins seen across the analysed repositories. */
  collaborators: number
  /** Distinct languages with any bytes attributed to them. */
  languageCount: number
  repoCount: number
  stars: number
  forks: number
  /** Mean of codeQuality, testing and documentation over analysed repositories. */
  hygiene: number
}

export interface DnaBreakdown {
  activity: number
  breadth: number
  collaboration: number
  hygiene: number
  impact: number
  total: number
}

/**
 * Five parts, 100 points:
 *   activity 25      — log curve on a year of commits; ~600 commits reaches full marks
 *   breadth 15       — distinct languages, saturating at eight
 *   collaboration 20 — PRs, reviews, issues and distinct collaborators
 *   hygiene 25       — mean repository hygiene, straight from the scores above
 *   impact 15        — log curve on stars plus forks
 * Log curves keep a prolific year from swamping everything else, and stop a first
 * repository from scoring zero.
 */
export function dnaScore(i: DnaInputs): DnaBreakdown {
  const curve = (value: number, full: number) =>
    value <= 0 ? 0 : Math.min(1, Math.log10(1 + value) / Math.log10(1 + full))

  const activity = 25 * curve(i.commits, 600)
  const breadth = 15 * Math.min(1, i.languageCount / 8)
  const collaboration =
    20 *
    (0.4 * curve(i.pullRequests, 60) +
      0.25 * curve(i.reviews, 60) +
      0.15 * curve(i.issues, 40) +
      0.2 * curve(i.collaborators, 12))
  const hygiene = 25 * (i.hygiene / 100)
  const impact = 15 * curve(i.stars + i.forks, 200)

  const total = clamp(activity + breadth + collaboration + hygiene + impact, 1)
  return {
    activity: Math.round(activity),
    breadth: Math.round(breadth),
    collaboration: Math.round(collaboration),
    hygiene: Math.round(hygiene),
    impact: Math.round(impact),
    total,
  }
}

/** Longest run of consecutive days ending today (or yesterday) with a contribution. */
export function currentStreak(days: { date: string; contributionCount: number }[]): number {
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) streak++
    else if (i === days.length - 1) continue // today may simply not have started
    else break
  }
  return streak
}
