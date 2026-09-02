/**
 * Authenticated GitHub client used by the dashboard.
 *
 * The browser talks to api.github.com directly: the CodeDNA Spring backend needs
 * Docker + Postgres + five services to answer anything, so depending on it would
 * mean the dashboard is empty on a fresh clone. api.github.com sends CORS headers
 * on every REST and GraphQL endpoint we use here, so no proxy is required.
 *
 * The token is the one the landing page stored under `gh_token`; it is read on
 * demand, sent only to api.github.com, and never logged.
 */

const REST = 'https://api.github.com'
const GRAPHQL = 'https://api.github.com/graphql'

/** Shared with public/landing.js — keep the literals in step. */
export const GH_TOKEN_KEY = 'gh_token'
export const GH_USER_KEY = 'gh_user'

export function getToken(): string | null {
  try {
    return localStorage.getItem(GH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(GH_TOKEN_KEY)
    localStorage.removeItem(GH_USER_KEY)
  } catch {
    /* private mode — nothing to clear */
  }
}

/** A GitHub failure we can explain to the user, rather than a raw status code. */
export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kind: 'auth' | 'rate-limit' | 'scope' | 'network' | 'other',
  ) {
    super(message)
    this.name = 'GitHubError'
  }
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function explain(status: number, body: string, resetHeader: string | null): GitHubError {
  if (status === 401) {
    return new GitHubError(
      'GitHub rejected the token. It may have expired or been revoked — reconnect to continue.',
      status,
      'auth',
    )
  }
  if (status === 403 && /rate limit/i.test(body)) {
    const reset = resetHeader ? new Date(Number(resetHeader) * 1000) : null
    const when = reset ? ` Try again after ${reset.toLocaleTimeString()}.` : ''
    return new GitHubError(`GitHub rate limit reached for this token.${when}`, status, 'rate-limit')
  }
  if (status === 403 || status === 404) {
    return new GitHubError(
      'GitHub refused that request. The token is probably missing the `repo` scope.',
      status,
      'scope',
    )
  }
  return new GitHubError(`GitHub returned ${status}.`, status, 'other')
}

/** Raw REST call. Returns the parsed body plus the response, for Link-header work. */
async function restRaw(path: string, token: string, signal?: AbortSignal) {
  let res: Response
  try {
    res = await fetch(path.startsWith('http') ? path : `${REST}${path}`, {
      headers: headers(token),
      signal,
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    throw new GitHubError('Could not reach GitHub. Check your connection.', 0, 'network')
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw explain(res.status, body, res.headers.get('x-ratelimit-reset'))
  }
  return { res, body: (await res.json()) as unknown }
}

export async function rest<T>(path: string, token: string, signal?: AbortSignal): Promise<T> {
  const { body } = await restRaw(path, token, signal)
  return body as T
}

/**
 * Total item count for a listing, read from `Link: rel="last"` after asking for a
 * single item per page. One request instead of walking every page — GitHub has no
 * count endpoint for commits or contributors.
 */
export async function countVia(
  path: string,
  token: string,
  signal?: AbortSignal,
): Promise<number> {
  const { res, body } = await restRaw(path, token, signal)
  const last = /<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/.exec(res.headers.get('link') ?? '')
  if (last) return Number(last[1])
  return Array.isArray(body) ? body.length : 0
}

/** Walk `rel="next"` until GitHub stops offering one, or `maxPages` is reached. */
export async function paginate<T>(
  path: string,
  token: string,
  maxPages = 5,
  signal?: AbortSignal,
): Promise<T[]> {
  const out: T[] = []
  let url: string | null = path.startsWith('http') ? path : `${REST}${path}`
  for (let page = 0; page < maxPages && url; page++) {
    const { res, body } = await restRaw(url, token, signal)
    if (Array.isArray(body)) out.push(...(body as T[]))
    const next = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') ?? '')
    url = next ? next[1] : null
  }
  return out
}

/**
 * GraphQL v4. Used for the contribution calendar and yearly totals, which REST
 * cannot produce without thousands of calls.
 */
export async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
  signal?: AbortSignal,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(GRAPHQL, {
      method: 'POST',
      headers: { ...headers(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal,
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    throw new GitHubError('Could not reach GitHub. Check your connection.', 0, 'network')
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw explain(res.status, body, res.headers.get('x-ratelimit-reset'))
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length) {
    throw new GitHubError(json.errors[0].message, 200, 'other')
  }
  return json.data as T
}

/**
 * Run `jobs` at most `limit` at a time. Secondary rate limits punish bursts far
 * harder than the primary quota does, so per-repo fan-out never goes wide.
 * A failed job resolves to `null` rather than sinking the whole dashboard.
 */
export async function pool<T>(
  jobs: (() => Promise<T>)[],
  limit = 6,
): Promise<(T | null)[]> {
  const out: (T | null)[] = new Array(jobs.length).fill(null)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const i = cursor++
      try {
        out[i] = await jobs[i]()
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err
        out[i] = null
      }
    }
  })
  await Promise.all(workers)
  return out
}

/* ---------------------------------------------------------------- raw shapes */
/* Only the fields we actually read. GitHub sends far more. */

export interface GhUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  company: string | null
  location: string | null
  blog: string | null
  html_url: string
  public_repos: number
  followers: number
  following: number
  created_at: string
}

export interface GhRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  private: boolean
  fork: boolean
  archived: boolean
  language: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  size: number
  default_branch: string
  license: { spdx_id: string | null; name: string } | null
  topics?: string[]
  has_wiki: boolean
  has_issues: boolean
  created_at: string
  updated_at: string
  pushed_at: string | null
  owner: { login: string }
  permissions?: { admin: boolean; push: boolean; pull: boolean }
}

export interface GhCommit {
  sha: string
  commit: { message: string; author: { name: string; date: string } }
  author: { login: string } | null
}

export interface GhContributor {
  login?: string
  contributions: number
  type?: string
}

/** One day of the GraphQL contribution calendar. */
export interface GhContribDay {
  date: string
  contributionCount: number
}

export interface GhContributions {
  totalCommitContributions: number
  totalPullRequestContributions: number
  totalPullRequestReviewContributions: number
  totalIssueContributions: number
  restrictedContributionsCount: number
  contributionCalendar: {
    totalContributions: number
    weeks: { contributionDays: GhContribDay[] }[]
  }
}

const VIEWER_QUERY = `
query Viewer($from: DateTime!, $to: DateTime!) {
  viewer {
    login
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    pullRequests(states: MERGED) { totalCount }
    issues(states: CLOSED) { totalCount }
    organizations(first: 1) { totalCount }
  }
}`

export interface GhViewerGraph {
  viewer: {
    login: string
    contributionsCollection: GhContributions
    pullRequests: { totalCount: number }
    issues: { totalCount: number }
    organizations: { totalCount: number }
  }
}

/* -------------------------------------------------------------- raw fetchers */

export function fetchViewer(token: string, signal?: AbortSignal) {
  return rest<GhUser>('/user', token, signal)
}

/**
 * Every repo the token can see, newest push first. `affiliation` is the same
 * triple the landing page counts with, so the dashboard total matches the badge.
 * Four pages caps us at 400 repos — beyond that the tail is not worth the calls.
 */
export function fetchRepos(token: string, signal?: AbortSignal) {
  return paginate<GhRepo>(
    '/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member',
    token,
    4,
    signal,
  )
}

/** Trailing 365 days of contributions, plus the yearly totals. */
export function fetchContributions(token: string, signal?: AbortSignal) {
  const to = new Date()
  const from = new Date(to.getTime() - 364 * 86_400_000)
  from.setHours(0, 0, 0, 0)
  return graphql<GhViewerGraph>(
    VIEWER_QUERY,
    { from: from.toISOString(), to: to.toISOString() },
    token,
    signal,
  )
}

/** Byte counts per language for one repo. */
export function fetchLanguages(full: string, token: string, signal?: AbortSignal) {
  return rest<Record<string, number>>(`/repos/${full}/languages`, token, signal)
}

/** Contributor headcount, including anonymous authors. */
export function fetchContributorCount(full: string, token: string, signal?: AbortSignal) {
  return countVia(`/repos/${full}/contributors?per_page=1&anon=1`, token, signal)
}

/**
 * Contributor list, first page. One call gives both the headcount for small repos
 * and the logins we union across repos to get a distinct collaborator count.
 * Repos with an empty default branch answer 409 — that is zero, not a failure.
 */
export async function fetchContributors(
  full: string,
  token: string,
  signal?: AbortSignal,
): Promise<GhContributor[]> {
  try {
    const list = await rest<GhContributor[]>(
      `/repos/${full}/contributors?per_page=100&anon=1`,
      token,
      signal,
    )
    return Array.isArray(list) ? list : []
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    return []
  }
}

/** Commits on the default branch authored by `login`. */
export function fetchCommitCount(
  full: string,
  login: string,
  token: string,
  signal?: AbortSignal,
) {
  return countVia(
    `/repos/${full}/commits?per_page=1&author=${encodeURIComponent(login)}`,
    token,
    signal,
  )
}

/** Every pull request ever opened on the repo. */
export function fetchPrCount(full: string, token: string, signal?: AbortSignal) {
  return countVia(`/repos/${full}/pulls?per_page=1&state=all`, token, signal)
}

/**
 * Every issue ever opened — GitHub counts pull requests as issues here, so the
 * caller subtracts the PR total to get real issues.
 */
export function fetchIssueCount(full: string, token: string, signal?: AbortSignal) {
  return countVia(`/repos/${full}/issues?per_page=1&state=all`, token, signal)
}

interface GhContentEntry {
  name: string
  type: 'file' | 'dir' | 'symlink' | 'submodule'
}

/**
 * Top-level file listing. One call that tells us whether a repo has a README, a
 * licence file, a test directory, a container build and a CI folder — the only
 * evidence GitHub gives us about engineering hygiene.
 */
export async function fetchRootListing(
  full: string,
  token: string,
  signal?: AbortSignal,
): Promise<string[]> {
  try {
    const entries = await rest<GhContentEntry[]>(`/repos/${full}/contents`, token, signal)
    return Array.isArray(entries) ? entries.map((e) => e.name.toLowerCase()) : []
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    return [] // empty repo, or the token cannot read contents
  }
}

/**
 * Number of GitHub Actions workflows. The Actions API returns `total_count`
 * directly, which is cheaper and more truthful than guessing from a `.github`
 * folder. Repos with Actions disabled answer 404 — that is a zero, not an error.
 */
export async function fetchWorkflowCount(
  full: string,
  token: string,
  signal?: AbortSignal,
): Promise<number> {
  try {
    const r = await rest<{ total_count: number }>(
      `/repos/${full}/actions/workflows?per_page=1`,
      token,
      signal,
    )
    return r.total_count ?? 0
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    return 0
  }
}

export interface RateLimit {
  limit: number
  remaining: number
  reset: number
}

export async function fetchRateLimit(
  token: string,
  signal?: AbortSignal,
): Promise<RateLimit | null> {
  try {
    const r = await rest<{ resources: { core: RateLimit } }>('/rate_limit', token, signal)
    return r.resources.core
  } catch {
    return null
  }
}

/* ------------------------------------------------------- monthly contributions */

export interface MonthlyPoint {
  label: string
  commits: number
  prs: number
}

/**
 * Commits and pull requests per calendar month for the trailing year.
 *
 * `contributionsCollection` accepts a date window and is not a connection, so
 * twelve aliased copies fit in one request — twelve real monthly totals for the
 * cost of a single round trip. Asking REST for the same numbers would take
 * thousands of calls.
 */
export async function fetchMonthly(
  token: string,
  signal?: AbortSignal,
): Promise<MonthlyPoint[]> {
  const months: { label: string; from: Date; to: Date }[] = []
  const now = new Date()
  for (let back = 11; back >= 0; back--) {
    const from = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const to = new Date(now.getFullYear(), now.getMonth() - back + 1, 1)
    months.push({
      label: from.toLocaleString('en-US', { month: 'short' }),
      from,
      to: new Date(Math.min(to.getTime() - 1000, now.getTime())),
    })
  }

  const fields = months
    .map(
      (_, i) => `m${i}: contributionsCollection(from: $f${i}, to: $t${i}) {
        totalCommitContributions
        totalPullRequestContributions
      }`,
    )
    .join('\n')
  const params = months.map((_, i) => `$f${i}: DateTime!, $t${i}: DateTime!`).join(', ')
  const query = `query Monthly(${params}) { viewer { ${fields} } }`

  const variables: Record<string, string> = {}
  months.forEach((m, i) => {
    variables[`f${i}`] = m.from.toISOString()
    variables[`t${i}`] = m.to.toISOString()
  })

  type Bucket = { totalCommitContributions: number; totalPullRequestContributions: number }
  const data = await graphql<{ viewer: Record<string, Bucket> }>(
    query,
    variables,
    token,
    signal,
  )

  return months.map((m, i) => {
    const b = data.viewer[`m${i}`]
    return {
      label: m.label,
      commits: b?.totalCommitContributions ?? 0,
      prs: b?.totalPullRequestContributions ?? 0,
    }
  })
}
