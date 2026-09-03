/**
 * Stands between the router and the pages: nothing renders until there is a live
 * profile to render. Three states — no token, loading, failed — each explained in
 * place rather than as an empty dashboard the user has to interpret.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Github,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useProfile } from '../lib/ProfileContext'
import { GitHubError } from '../lib/github'

// OAuth — public client id only; the secret stays on the backend.
const OAUTH_CLIENT_ID =
  (import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined)?.trim() || 'Ov23liozfUubDI7kfWVD'
const OAUTH_REDIRECT_URI =
  (import.meta.env.VITE_GITHUB_REDIRECT_URI as string | undefined)?.trim() ||
  'http://localhost:5173/auth-callback.html'
const OAUTH_SCOPE = 'repo,read:user,read:org'
const OAUTH_AUTHORIZE_BASES = ['/api/v1/auth/github/authorize', 'http://localhost:8081/api/v1/auth/github/authorize']

function buildDirectOAuthUrl(): string | null {
  if (!OAUTH_CLIENT_ID) return null
  const u = new URL('https://github.com/login/oauth/authorize')
  u.searchParams.set('client_id', OAUTH_CLIENT_ID)
  u.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI)
  u.searchParams.set('scope', OAUTH_SCOPE)
  try {
    const st = Math.random().toString(36).slice(2, 10)
    sessionStorage.setItem('gh_oauth_state', st)
    u.searchParams.set('state', st)
  } catch {}
  return u.toString()
}

export default function ProfileGate({ children }: { children: ReactNode }) {
  const { status } = useProfile()
  if (status === 'no-token') return <ConnectPanel />
  if (status === 'loading') return <LoadingPanel />
  if (status === 'error') return <ErrorPanel />
  return <>{children}</>
}

/* ------------------------------------------------------------------ connecting */

function ConnectPanel() {
  const { error } = useProfile()
  const [oauthBusy, setOauthBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  async function onOAuthClick() {
    setOauthBusy(true)
    setProblem(null)
    try {
      for (const base of OAUTH_AUTHORIZE_BASES) {
        try {
          const r = await fetch(base, { headers: { Accept: 'application/json' } })
          if (!r.ok) continue
          const j = (await r.json().catch(() => ({}))) as Record<string, string>
          const url = j.url || j.authorizeUrl || j.authorize_url
          if (url) {
            window.location.href = url
            return
          }
        } catch {
          /* try next base, then direct URL */
        }
      }
      const direct = buildDirectOAuthUrl()
      if (direct) {
        window.location.href = direct
        return
      }
      setProblem('Could not reach the auth backend. Make sure it is running on :8081.')
    } finally {
      setOauthBusy(false)
    }
  }

  const expired = error instanceof GitHubError && error.kind === 'auth'

  return (
    <div className="section-stack bg-[#FDFCF9]">
      <header className="page-head border-b border-[rgba(15,26,32,0.06)]">
        <div>
          <p className="eyebrow text-[#8C704F]">Connect</p>
          <h1 className="page-title text-engrave text-[#0F1A20]">Bring in your GitHub</h1>
          <p className="page-lede text-[#6B7A89]">
            Everything on this dashboard is read live from your account. Nothing is stored on a
            server — the token stays in this browser and is sent only to api.github.com.
          </p>
        </div>
        <div className="chip !px-4 !py-2 bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-sm">
          <Github className="w-4 h-4 text-[#C2A47A]" />
          <span className="text-sm font-medium text-[#0F1A20]">Not connected</span>
        </div>
      </header>

      {expired && (
        <div className="flex items-start gap-3 rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 max-w-5xl mx-auto w-full">
          <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-amber-600" />
          <p className="text-sm text-[#33414F]">
            Your previous token was rejected by GitHub and has been cleared. Reconnect below.
          </p>
        </div>
      )}

      {/* ── Single centered OAuth card — PAT removed — OAuth untouched ── */}
      <section className="max-w-xl mx-auto w-full">
        <div className="card pad-luxe flex flex-col bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[rgba(194,164,122,0.08)] rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex flex-col flex-1 gap-5">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-bold tracking-widest uppercase bg-[rgba(194,164,122,0.10)] text-[#8C704F] border border-[rgba(194,164,122,0.22)]">
                <Sparkles className="w-3 h-3" /> Recommended
              </span>
              <span className="w-10 h-10 rounded-xl bg-[rgba(194,164,122,0.10)] border border-[rgba(194,164,122,0.22)] grid place-items-center shrink-0">
                <Github className="w-5 h-5 text-[#8C704F]" />
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#0F1A20] flex items-center gap-2">
                Connect with GitHub
                <Zap className="w-4 h-4 text-[#C2A47A]" />
              </h3>
              <p className="text-sm leading-relaxed text-[#6B7A89] mt-2">
                One click. Redirects to <span className="text-[#0F1A20] font-medium">github.com</span> to authorize
                read-only access. No token to copy, no scopes to tick by hand.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-[#6B7A89]">
              <li className="flex gap-2"><span className="text-[#6A9A8F] mt-0.5">✓</span> Works for private repos & orgs</li>
              <li className="flex gap-2"><span className="text-[#6A9A8F] mt-0.5">✓</span> Token stays in this browser only</li>
              <li className="flex gap-2"><span className="text-[#6A9A8F] mt-0.5">✓</span> Revoke anytime on GitHub</li>
            </ul>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={onOAuthClick}
                disabled={oauthBusy}
                className="w-full justify-center gap-2.5 text-[15px] font-bold py-3.5 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] shadow-sm transition-all inline-flex items-center disabled:opacity-50"
              >
                {oauthBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
                {oauthBusy ? 'Redirecting to GitHub…' : 'Connect with GitHub'}
              </button>
              <p className="text-center text-[0.7rem] leading-relaxed text-[#9AA8B6]">
                Requires <code className="font-mono text-[#6B7A89]">repo</code> · <code className="font-mono text-[#6B7A89]">read:user</code> · <code className="font-mono text-[#6B7A89]">read:org</code>
              </p>
            </div>

            {problem && (
              <p className="flex items-start gap-2 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0" />
                <span className="min-w-0 break-words">{problem}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Scopes footer */}
      <div className="max-w-5xl mx-auto w-full rounded-2xl border border-[rgba(15,26,32,0.08)] bg-[#FFFFFF] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-4 sm:p-5 flex items-start gap-3">
        <ShieldCheck className="mt-0.5 w-4 h-4 shrink-0 text-[#C2A47A]" />
        <div className="space-y-2 min-w-0">
          <p className="text-sm leading-relaxed text-[#6B7A89]">
            Three scopes are enough: <code className="font-mono text-[#8C704F]">repo</code> to read private
            repositories, <code className="font-mono text-[#8C704F]">read:user</code> for your profile, and{' '}
            <code className="font-mono text-[#8C704F]">read:org</code> for organisation repositories. Grant less
            and the private half of the dashboard stays empty.
          </p>
          <p className="text-xs leading-relaxed text-[#9AA8B6]">
            The token is kept in this browser&apos;s localStorage so the dashboard survives a reload. Anything with
            access to this browser profile can read it — revoke it from GitHub&apos;s settings when you are done.
          </p>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- loading */

function LoadingPanel() {
  const { stage, progress } = useProfile()
  const pct = Math.round(progress * 100)

  return (
    <div className="section-stack bg-[#FDFCF9]">
      <header className="page-head border-b border-[rgba(15,26,32,0.06)]">
        <div>
          <p className="eyebrow text-[#8C704F]">Analysing</p>
          <h1 className="page-title text-engrave text-[#0F1A20]">Reading your repositories</h1>
          <p className="page-lede text-[#6B7A89]">
            Languages, commits, contributors and workflows, straight from GitHub. This takes a few
            seconds on the first load and is cached for the rest of the session.
          </p>
        </div>
        <div className="chip !px-4 !py-2 bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-sm">
          <Loader2 className="w-4 h-4 text-[#C2A47A] animate-spin" />
          <span className="text-sm font-medium text-[#0F1A20]">{pct}%</span>
        </div>
      </header>

      <section>
        <div className="card pad-luxe max-w-2xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)]">
          <p className="text-sm text-[#6B7A89] mb-4">{stage}…</p>
          <div className="meter bg-[#F2EFE9] rounded-full h-2 overflow-hidden">
            <div className="meter-fill h-full bg-gradient-to-r from-[#C2A47A] to-[#6A9A8F] transition-all" style={{ width: `${Math.max(6, pct)}%` }} />
          </div>
        </div>
      </section>

      {/* Placeholder furniture so the layout does not jump when data lands */}
      <section className="stack-grid sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)]">
            <div className="skeleton h-11 w-11 rounded-xl bg-[#F2EFE9]" />
            <div className="skeleton mt-5 h-8 w-24 rounded-lg bg-[#F2EFE9]" />
            <div className="skeleton mt-2 h-3 w-16 rounded bg-[#F2EFE9]" />
          </div>
        ))}
      </section>
    </div>
  )
}

/* ----------------------------------------------------------------------- failed */

function ErrorPanel() {
  const { error, refresh, disconnect } = useProfile()
  const kind = error instanceof GitHubError ? error.kind : 'other'

  return (
    <div className="section-stack bg-[#FDFCF9]">
      <header className="page-head border-b border-[rgba(15,26,32,0.06)]">
        <div>
          <p className="eyebrow text-[#B85C4A]">Interrupted</p>
          <h1 className="page-title text-engrave text-[#0F1A20]">GitHub would not answer</h1>
          <p className="page-lede text-[#6B7A89]">{error?.message ?? 'The request failed before any data arrived.'}</p>
        </div>
      </header>

      <section>
        <div className="card pad-luxe max-w-2xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)]">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[rgba(184,92,74,0.08)] border border-[rgba(184,92,74,0.18)] grid place-items-center">
              <AlertTriangle className="w-5 h-5 text-[#B85C4A]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-[#6B7A89]">
                {kind === 'rate-limit'
                  ? 'The token has spent its hourly quota. Waiting for the reset is the only fix — the dashboard makes about 150 requests per full refresh out of 5,000 per hour.'
                  : kind === 'scope'
                    ? 'The token authenticated but was refused on a repository. That is almost always a missing `repo` or `read:org` scope — regenerate it with those ticked.'
                    : 'This is usually a network problem or a browser extension blocking api.github.com. Retrying often clears it.'}
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <button onClick={refresh} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] shadow-sm font-bold text-sm transition-all">
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </button>
                <button onClick={disconnect} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] text-sm font-semibold text-[#6B7A89] hover:text-[#0F1A20] hover:bg-[rgba(194,164,122,0.08)] transition-all">
                  Use a different token
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
