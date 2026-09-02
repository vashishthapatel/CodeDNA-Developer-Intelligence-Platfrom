/**
 * One live GitHub profile, shared by every dashboard route.
 *
 * The whole dashboard is one fetch: doing it per page would re-spend the rate
 * limit on every navigation. Results are cached in sessionStorage so moving
 * between routes is instant, and refreshed in the background once the cache is
 * more than ten minutes old.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { loadProfile, type Profile } from './githubProfile'
import { GH_USER_KEY, GitHubError, clearToken, getToken } from './github'
import { mockProfile } from './mockData'

const CACHE_KEY = 'codedna:profile:v1'
/** Older than this and we refresh in the background while showing what we have. */
const STALE_AFTER = 10 * 60 * 1000

export type ProfileStatus = 'no-token' | 'loading' | 'ready' | 'error'

interface Cached {
  login: string
  savedAt: number
  profile: Profile
}

/** The login the landing page recorded when the token was accepted. */
function storedLogin(): string | null {
  try {
    const raw = localStorage.getItem(GH_USER_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as { login?: string }).login ?? null
  } catch {
    return null
  }
}

function readCache(): Cached | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    if (!parsed?.profile?.user) return null
    // A different account in the same tab must not see the previous one's data.
    const login = storedLogin()
    if (login && parsed.login && login !== parsed.login) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(profile: Profile) {
  try {
    const payload: Cached = { login: profile.meta.login, savedAt: Date.now(), profile }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* quota or private mode — the dashboard just refetches next time */
  }
}

export function clearProfileCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    /* nothing to clear */
  }
}

export interface ProfileValue {
  status: ProfileStatus
  profile: Profile | null
  error: Error | null
  /** What the loader is doing right now, for the progress copy. */
  stage: string
  /** 0–1. */
  progress: number
  /** True while a background refresh runs over already-rendered data. */
  refreshing: boolean
  fetchedAt: string | null
  refresh: () => void
  disconnect: () => void
  loadDemoProfile: () => void
}

const ProfileContext = createContext<ProfileValue | null>(null)

export function useProfile(): ProfileValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>')
  return ctx
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => {
    const cached = readCache()
    return cached?.profile ?? null
  })
  const [status, setStatus] = useState<ProfileStatus>(() => {
    const cached = readCache()
    if (cached?.profile) return 'ready'
    return getToken() ? 'loading' : 'no-token'
  })
  const [error, setError] = useState<Error | null>(null)
  const [stage, setStage] = useState('Connecting to GitHub')
  const [progress, setProgress] = useState(() => (readCache()?.profile ? 1 : 0))
  const [refreshing, setRefreshing] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<string | null>(() => readCache()?.profile?.meta.fetchedAt ?? null)

  // One in-flight load at a time; a new one cancels the old.
  const abort = useRef<AbortController | null>(null)

  const run = useCallback(async (background: boolean) => {
    const token = getToken()
    if (!token) {
      setStatus('no-token')
      return
    }

    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller

    if (background) setRefreshing(true)
    else {
      setStatus('loading')
      setProgress(0)
      setStage('Reading your account')
    }
    setError(null)

    try {
      const next = await loadProfile(
        token,
        (s, done, total) => {
          if (controller.signal.aborted) return
          setStage(s)
          setProgress(Math.min(1, done / total))
        },
        controller.signal,
      )
      if (controller.signal.aborted) return
      setProfile(next)
      setFetchedAt(next.meta.fetchedAt)
      setStatus('ready')
      writeCache(next)
    } catch (err) {
      if (controller.signal.aborted || (err as Error)?.name === 'AbortError') return
      const e = err as Error
      // An expired or revoked token is a connection problem, not a data problem.
      if (e instanceof GitHubError && e.kind === 'auth') {
        clearToken()
        clearProfileCache()
        setProfile(null)
        setStatus('no-token')
        setError(e)
        return
      }
      setError(e)
      setStatus((prev) => (prev === 'ready' ? 'ready' : 'error'))
    } finally {
      if (!controller.signal.aborted) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!getToken()) {
      setStatus('no-token')
      return
    }
    const cached = readCache()
    if (cached) {
      setProfile(cached.profile)
      setFetchedAt(cached.profile.meta.fetchedAt)
      setStatus('ready')
      setProgress(1)
      if (Date.now() - cached.savedAt > STALE_AFTER) void run(true)
    } else {
      void run(false)
    }
    return () => abort.current?.abort()
  }, [run])

  const loadDemoProfile = useCallback(() => {
    setProfile(mockProfile)
    setFetchedAt(mockProfile.meta.fetchedAt)
    setStatus('ready')
    setProgress(1)
    writeCache(mockProfile)
  }, [])

  const hasProfile = profile !== null
  const value = useMemo<ProfileValue>(
    () => ({
      status,
      profile,
      error,
      stage,
      progress,
      refreshing,
      fetchedAt,
      refresh: () => void run(hasProfile),
      loadDemoProfile,
      disconnect: () => {
        abort.current?.abort()
        clearToken()
        clearProfileCache()
        setProfile(null)
        setError(null)
        setStatus('no-token')
        // Navigate back to the landing page after disconnect
        window.location.href = '/'
      },
    }),
    [status, profile, error, stage, progress, refreshing, fetchedAt, run, hasProfile, loadDemoProfile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
