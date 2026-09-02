/**
 * Domain models for CodeDNA.
 * These mirror the shapes returned by the Spring Boot `/api/v1` backend,
 * so swapping the mock client in `api.ts` for real HTTP calls needs no UI changes.
 */

export interface User {
  id: string
  name: string
  handle: string
  title: string
  bio: string
  avatarUrl: string
  location?: string
  company?: string
  joinedAt: string
  githubConnected: boolean
}

export interface OverviewStats {
  dnaScore: number
  scoreLabel: string
  repositories: number
  commits: number
  pullRequests: number
  languages: number
  reviews: number
  issues: number
  contributors: number
  streakDays: number
}

export type SkillCategory =
  | 'language'
  | 'framework'
  | 'engineering'
  | 'infrastructure'
  | 'collaboration'

export interface Skill {
  name: string
  value: number
  category: SkillCategory
  trend?: number
}

export interface DnaProfile {
  score: number
  label: string
  strongestArea: string
  recommendedSkill: string
  archetype: string
  languages: Skill[]
  engineering: Skill[]
  radial: Skill[]
}

export interface ActivityPoint {
  date: string
  commits: number
  prs?: number
}

export interface LanguageSlice {
  name: string
  value: number
  color: string
}

export interface QualityPoint {
  date: string
  quality: number
  coverage: number
}

export interface ComplexityBar {
  repo: string
  complexity: number
  maintainability: number
}

export interface HeatCell {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface CollaborationStats {
  pullRequests: number
  reviews: number
  issues: number
  contributors: number
}

export interface AnalyticsOverview {
  activity: ActivityPoint[]
  languages: LanguageSlice[]
  quality: QualityPoint[]
  complexity: ComplexityBar[]
  heatmap: HeatCell[]
  collaboration: CollaborationStats
}

export interface RepoHealth {
  codeQuality: number
  complexity: number
  documentation: number
  testing: number
  maintainability: number
}

export interface Repository {
  id: string
  name: string
  description: string
  primaryLanguage: string
  languages: string[]
  stars: number
  forks: number
  commits: number
  pullRequests: number
  issues: number
  contributors: number
  dnaContribution: number
  updatedAt: string
  visibility: 'public' | 'private'
  health: RepoHealth
  stack: string[]
  patterns: string[]
  selected?: boolean
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Recommendation {
  id: string
  title: string
  reason: string
  difficulty: Difficulty
  duration: string
  category: string
  match: number
  tags: string[]
}

export interface Notification {
  id: string
  title: string
  body: string
  type: 'analysis' | 'recommendation' | 'system'
  read: boolean
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}
export interface LoginRequest {
  email: string
  password: string
}
export interface RegisterRequest {
  name: string
  email: string
  password: string
}

/** Matches a typical Spring Boot `Page<T>` envelope. */
export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
