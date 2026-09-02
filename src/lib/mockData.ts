import type {
  AnalyticsOverview,
  CollaborationStats,
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
import type { Profile } from './githubProfile'
import { series } from './palette'

/* Deterministic PRNG so the mock heatmap is stable across reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const currentUser: User = {
  id: 'usr_alex',
  name: 'Alex Developer',
  handle: 'alexdev',
  title: 'Backend Engineer',
  bio: 'Building scalable systems with Java & Spring Boot',
  avatarUrl: '',
  location: 'Berlin, DE',
  company: 'Independent',
  joinedAt: '2021-04-12',
  githubConnected: true,
}

export const overviewStats: OverviewStats = {
  dnaScore: 86,
  scoreLabel: 'Strong Backend Engineer',
  repositories: 47,
  commits: 1284,
  pullRequests: 186,
  languages: 8,
  reviews: 214,
  issues: 92,
  contributors: 34,
  streakDays: 128,
}

const languages: Skill[] = [
  { name: 'Java', value: 92, category: 'language', trend: 4 },
  { name: 'Spring Boot', value: 87, category: 'framework', trend: 6 },
  { name: 'SQL', value: 78, category: 'language', trend: 2 },
  { name: 'Docker', value: 68, category: 'infrastructure', trend: 5 },
  { name: 'AWS', value: 64, category: 'infrastructure', trend: 3 },
  { name: 'React', value: 61, category: 'framework', trend: 1 },
  { name: 'Kafka', value: 58, category: 'infrastructure', trend: 7 },
  { name: 'Python', value: 52, category: 'language', trend: -1 },
]

const engineering: Skill[] = [
  { name: 'Collaboration', value: 84, category: 'collaboration', trend: 2 },
  { name: 'Architecture', value: 80, category: 'engineering', trend: 3 },
  { name: 'Testing', value: 72, category: 'engineering', trend: 5 },
  { name: 'Documentation', value: 54, category: 'engineering', trend: -2 },
]

const radial: Skill[] = [
  { name: 'Backend', value: 92, category: 'engineering' },
  { name: 'Architecture', value: 80, category: 'engineering' },
  { name: 'Java', value: 92, category: 'language' },
  { name: 'Spring Boot', value: 87, category: 'framework' },
  { name: 'Database', value: 78, category: 'engineering' },
  { name: 'Testing', value: 72, category: 'engineering' },
  { name: 'DevOps', value: 68, category: 'infrastructure' },
  { name: 'Collaboration', value: 84, category: 'collaboration' },
]

export const dnaProfile: DnaProfile = {
  score: 86,
  label: 'Strong Backend Engineer',
  strongestArea: 'Backend Architecture',
  recommendedSkill: 'Distributed Systems',
  archetype: 'Systems Builder',
  languages,
  engineering,
  radial,
}

const activity: AnalyticsOverview['activity'] = [
  { date: 'Sep', commits: 74, prs: 9 },
  { date: 'Oct', commits: 96, prs: 12 },
  { date: 'Nov', commits: 88, prs: 11 },
  { date: 'Dec', commits: 63, prs: 7 },
  { date: 'Jan', commits: 108, prs: 14 },
  { date: 'Feb', commits: 121, prs: 16 },
  { date: 'Mar', commits: 132, prs: 15 },
  { date: 'Apr', commits: 118, prs: 13 },
  { date: 'May', commits: 145, prs: 18 },
  { date: 'Jun', commits: 138, prs: 17 },
  { date: 'Jul', commits: 160, prs: 21 },
  { date: 'Aug', commits: 176, prs: 23 },
]

const languageSlices: LanguageSlice[] = [
  { name: 'Java', value: 52, color: series[0] },
  { name: 'JavaScript', value: 21, color: series[1] },
  { name: 'SQL', value: 15, color: series[2] },
  { name: 'Python', value: 8, color: series[3] },
  { name: 'Other', value: 4, color: series[4] },
]

const quality: QualityPoint[] = [
  { date: 'Q1 24', quality: 62, coverage: 48 },
  { date: 'Q2 24', quality: 66, coverage: 55 },
  { date: 'Q3 24', quality: 71, coverage: 61 },
  { date: 'Q4 24', quality: 75, coverage: 66 },
  { date: 'Q1 25', quality: 79, coverage: 70 },
  { date: 'Q2 25', quality: 83, coverage: 74 },
  { date: 'Q3 25', quality: 87, coverage: 79 },
]

const complexity: ComplexityBar[] = [
  { repo: 'codedna-api', complexity: 78, maintainability: 84 },
  { repo: 'payment-service', complexity: 86, maintainability: 72 },
  { repo: 'ecommerce-platform', complexity: 72, maintainability: 76 },
  { repo: 'realtime-notifier', complexity: 64, maintainability: 81 },
  { repo: 'data-pipeline', complexity: 91, maintainability: 68 },
  { repo: 'auth-service', complexity: 58, maintainability: 88 },
]

const collaboration: CollaborationStats = {
  pullRequests: 186,
  reviews: 214,
  issues: 92,
  contributors: 34,
}

function buildHeatmap(): HeatCell[] {
  const rnd = mulberry32(7)
  const cells: HeatCell[] = []
  const start = new Date()
  start.setDate(start.getDate() - 364)
  for (let i = 0; i < 365; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const day = d.getDay()
    const weekend = day === 0 || day === 6 ? 0.4 : 1
    const wave = Math.sin(i / 9) * 0.5 + 0.5
    const count = Math.round(rnd() * wave * weekend * 11)
    const level = (
      count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 9 ? 3 : 4
    ) as HeatCell['level']
    cells.push({ date: d.toISOString().slice(0, 10), count, level })
  }
  return cells
}

export const analytics: AnalyticsOverview = {
  activity,
  languages: languageSlices,
  quality,
  complexity,
  heatmap: buildHeatmap(),
  collaboration,
}

export const repositories: Repository[] = [
  {
    id: 'repo_codedna_api',
    name: 'codedna-api',
    description: 'Core REST API powering the CodeDNA scoring engine.',
    primaryLanguage: 'Java',
    languages: ['Java', 'SQL', 'Dockerfile'],
    stars: 128, forks: 24, commits: 412, pullRequests: 63, issues: 18, contributors: 7,
    dnaContribution: 28, updatedAt: '2026-08-24', visibility: 'public',
    health: { codeQuality: 88, complexity: 78, documentation: 62, testing: 81, maintainability: 84 },
    stack: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Docker', 'Kafka'],
    patterns: ['REST API', 'Layered Architecture', 'Repository Pattern', 'Event-Driven Architecture', 'Caching', 'Authentication'],
  },
  {
    id: 'repo_ecommerce',
    name: 'ecommerce-platform',
    description: 'Modular commerce backend with catalog, cart and checkout services.',
    primaryLanguage: 'Java',
    languages: ['Java', 'TypeScript', 'SQL'],
    stars: 96, forks: 18, commits: 318, pullRequests: 41, issues: 22, contributors: 6,
    dnaContribution: 21, updatedAt: '2026-08-19', visibility: 'public',
    health: { codeQuality: 82, complexity: 72, documentation: 58, testing: 74, maintainability: 76 },
    stack: ['Java', 'Spring Boot', 'PostgreSQL', 'React', 'Docker'],
    patterns: ['REST API', 'Layered Architecture', 'CQRS', 'Caching', 'Authentication'],
  },
  {
    id: 'repo_payment',
    name: 'payment-service',
    description: 'PCI-aware payment orchestration with idempotent transaction handling.',
    primaryLanguage: 'Java',
    languages: ['Java', 'SQL'],
    stars: 74, forks: 11, commits: 264, pullRequests: 33, issues: 14, contributors: 4,
    dnaContribution: 17, updatedAt: '2026-08-22', visibility: 'private',
    health: { codeQuality: 79, complexity: 86, documentation: 66, testing: 88, maintainability: 72 },
    stack: ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Docker'],
    patterns: ['Event-Driven Architecture', 'Saga Pattern', 'Idempotency', 'Authentication', 'Observability'],
  },
  {
    id: 'repo_realtime',
    name: 'realtime-notifier',
    description: 'WebSocket notification fan-out service with Redis pub/sub.',
    primaryLanguage: 'Java',
    languages: ['Java', 'TypeScript'],
    stars: 58, forks: 9, commits: 187, pullRequests: 24, issues: 9, contributors: 3,
    dnaContribution: 12, updatedAt: '2026-08-10', visibility: 'public',
    health: { codeQuality: 84, complexity: 64, documentation: 52, testing: 69, maintainability: 81 },
    stack: ['Java', 'Spring Boot', 'Redis', 'Docker'],
    patterns: ['Event-Driven Architecture', 'Pub/Sub', 'WebSocket', 'Caching'],
  },
  {
    id: 'repo_pipeline',
    name: 'data-pipeline',
    description: 'Batch + streaming ETL pipeline feeding the analytics warehouse.',
    primaryLanguage: 'Python',
    languages: ['Python', 'SQL'],
    stars: 63, forks: 14, commits: 221, pullRequests: 19, issues: 12, contributors: 5,
    dnaContribution: 9, updatedAt: '2026-07-30', visibility: 'private',
    health: { codeQuality: 74, complexity: 91, documentation: 48, testing: 61, maintainability: 68 },
    stack: ['Python', 'Kafka', 'PostgreSQL', 'Docker'],
    patterns: ['Event-Driven Architecture', 'Stream Processing', 'Batch Processing', 'Observability'],
  },
  {
    id: 'repo_auth',
    name: 'auth-service',
    description: 'OAuth2 + JWT identity service with refresh-token rotation.',
    primaryLanguage: 'Java',
    languages: ['Java', 'SQL'],
    stars: 89, forks: 16, commits: 176, pullRequests: 21, issues: 7, contributors: 4,
    dnaContribution: 8, updatedAt: '2026-08-15', visibility: 'public',
    health: { codeQuality: 90, complexity: 58, documentation: 71, testing: 85, maintainability: 88 },
    stack: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis'],
    patterns: ['REST API', 'Authentication', 'Layered Architecture', 'Repository Pattern'],
  },
  {
    id: 'repo_portfolio',
    name: 'portfolio',
    description: 'Personal developer portfolio built with React and Vite.',
    primaryLanguage: 'TypeScript',
    languages: ['TypeScript', 'CSS'],
    stars: 31, forks: 5, commits: 142, pullRequests: 8, issues: 3, contributors: 1,
    dnaContribution: 5, updatedAt: '2026-06-28', visibility: 'public',
    health: { codeQuality: 80, complexity: 42, documentation: 74, testing: 40, maintainability: 86 },
    stack: ['React', 'TypeScript', 'Vite'],
    patterns: ['Component Architecture', 'Static Rendering'],
  },

]
export const recommendations: Recommendation[] = [
  {
    id: 'rec_distsys',
    title: 'Distributed Systems',
    reason:
      'Your backend architecture score is high, but your repositories show limited evidence of distributed-system patterns.',
    difficulty: 'Advanced',
    duration: '6–8 weeks',
    category: 'Architecture',
    match: 94,
    tags: ['Consensus', 'Sharding', 'CAP'],
  },
  {
    id: 'rec_k8s',
    title: 'Kubernetes',
    reason:
      'You containerize with Docker frequently, but orchestration patterns are missing across your services.',
    difficulty: 'Intermediate',
    duration: '4–6 weeks',
    category: 'Infrastructure',
    match: 89,
    tags: ['Helm', 'Operators', 'Autoscaling'],
  },
  {
    id: 'rec_sysdesign',
    title: 'System Design',
    reason:
      'Strong implementation skills — formalizing high-level design will round out your senior profile.',
    difficulty: 'Advanced',
    duration: '5–7 weeks',
    category: 'Architecture',
    match: 86,
    tags: ['Scalability', 'Trade-offs', 'Modeling'],
  },
  {
    id: 'rec_observability',
    title: 'Observability',
    reason:
      'Metrics and tracing appear in only a few repos; strengthening this improves production readiness.',
    difficulty: 'Intermediate',
    duration: '3–4 weeks',
    category: 'Operations',
    match: 81,
    tags: ['Tracing', 'Metrics', 'Logging'],
  },
]

export const notifications: Notification[] = [
  {
    id: 'n1',
    title: 'Analysis complete',
    body: 'Your Developer DNA has been recalculated. Score +2 since last week.',
    type: 'analysis',
    read: false,
    createdAt: '2026-08-29T08:12:00Z',
  },
  {
    id: 'n2',
    title: 'New recommendation',
    body: 'Distributed Systems is a strong next move based on your profile.',
    type: 'recommendation',
    read: false,
    createdAt: '2026-08-28T16:40:00Z',
  },
  {
    id: 'n3',
    title: 'Repository synced',
    body: 'payment-service finished syncing — 33 PRs analyzed.',
    type: 'system',
    read: true,
    createdAt: '2026-08-27T11:05:00Z',
  },
]

export const strengths = ['Java', 'Spring Boot', 'REST APIs', 'SQL', 'Backend Architecture']
export const improvements = ['Distributed Systems', 'Kubernetes', 'System Design', 'Observability']

export const analysisStages = [
  'Fetching repositories',
  'Analyzing commits',
  'Detecting languages',
  'Measuring complexity',
  'Building skill profile',
  'Generating recommendations',
]

export const mockProfile: Profile = {
  user: currentUser,
  stats: overviewStats,
  dna: dnaProfile,
  breakdown: {
    activity: 23,
    breadth: 13,
    collaboration: 17,
    hygiene: 20,
    impact: 12,
    total: 85,
  },
  analytics,
  repositories,
  recommendations,
  notifications,
  meta: {
    fetchedAt: new Date().toISOString(),
    analyzedRepos: 7,
    totalRepos: 47,
    rateRemaining: 4950,
    login: 'alexdev',
  },
}
