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
import { createGitHubOAuthUrl } from '../lib/githubOAuth'

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
      window.location.assign(createGitHubOAuthUrl())
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'Could not start GitHub sign-in.')
      setOauthBusy(false)
    }
  }

  const expired = error instanceof GitHubError && error.kind === 'auth'

  return (
    <div className="section-stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Connect</p>
          <h1 className="page-title text-engrave">Bring in your GitHub</h1>
          <p className="page-lede">
            Everything on this dashboard is read live from your account. Nothing is stored on a
            server — the token stays in this browser and is sent only to api.github.com.
          </p>
        </div>
        <div className="chip !px-4 !py-2">
          <Github className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-ink">Not connected</span>
        </div>
      </header>

      {expired && (
        <div className="flex items-start gap-3 rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 max-w-5xl mx-auto w-full">
          <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-amber-500" />
          <p className="text-sm text-ink-muted">
            Your previous token was rejected by GitHub and has been cleared. Reconnect below.
          </p>
        </div>
      )}

      {/* ── Single centered OAuth card ── */}
      <section className="max-w-xl mx-auto w-full">
        <div className="card pad-luxe flex flex-col relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex flex-col flex-1 gap-5">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-bold tracking-widest uppercase bg-accent/15 text-accent border border-accent/30">
                <Sparkles className="w-3 h-3" /> Recommended
              </span>
              <span className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 grid place-items-center shrink-0">
                <Github className="w-5 h-5 text-accent" />
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                Connect with GitHub
                <Zap className="w-4 h-4 text-accent" />
              </h3>
              <p className="text-sm leading-relaxed text-ink-muted mt-2">
                One click. Redirects to <span className="text-ink font-semibold">github.com</span> to authorize
                read-only access. No token to copy, no scopes to tick by hand.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-ink-muted">
              <li className="flex gap-2"><span className="text-good mt-0.5">✓</span> Works for private repos & orgs</li>
              <li className="flex gap-2"><span className="text-good mt-0.5">✓</span> Token stays in this browser only</li>
              <li className="flex gap-2"><span className="text-good mt-0.5">✓</span> Revoke anytime on GitHub</li>
            </ul>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={onOAuthClick}
                disabled={oauthBusy}
                className="w-full justify-center gap-2.5 text-[15px] font-bold tracking-wide py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent-deep text-white border border-accent/60 hover:brightness-110 shadow-glow transition-all inline-flex items-center disabled:opacity-50"
              >
                {oauthBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
                {oauthBusy ? 'Redirecting to GitHub…' : 'Connect with GitHub'}
              </button>
              <p className="text-center text-[0.7rem] leading-relaxed text-ink-faint">
                Requires <code className="font-mono text-ink-muted">repo</code> · <code className="font-mono text-ink-muted">read:user</code> · <code className="font-mono text-ink-muted">read:org</code>
              </p>
            </div>

            {problem && (
              <p className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0" />
                <span className="min-w-0 break-words">{problem}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Scopes footer */}
      <div className="max-w-5xl mx-auto w-full rounded-2xl border border-line bg-surface p-4 sm:p-5 flex items-start gap-3">
        <ShieldCheck className="mt-0.5 w-4 h-4 shrink-0 text-accent" />
        <div className="space-y-2 min-w-0">
          <p className="text-sm leading-relaxed text-ink-muted">
            Three scopes are enough: <code className="font-mono text-accent">repo</code> to read private
            repositories, <code className="font-mono text-accent">read:user</code> for your profile, and{' '}
            <code className="font-mono text-accent">read:org</code> for organisation repositories. Grant less
            and the private half of the dashboard stays empty.
          </p>
          <p className="text-xs leading-relaxed text-ink-faint">
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
    <div className="section-stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Analysing</p>
          <h1 className="page-title text-engrave">Reading your repositories</h1>
          <p className="page-lede">
            Languages, commits, contributors and workflows, straight from GitHub. This takes a few
            seconds on the first load and is cached for the rest of the session.
          </p>
        </div>
        <div className="chip !px-4 !py-2">
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
          <span className="text-sm font-medium text-ink">{pct}%</span>
        </div>
      </header>

      <section>
        <div className="card pad-luxe max-w-2xl">
          <p className="text-sm text-ink-muted mb-4">{stage}…</p>
          <div className="meter rounded-full h-2 overflow-hidden">
            <div className="meter-fill h-full bg-gradient-to-r from-accent to-good transition-all" style={{ width: `${Math.max(6, pct)}%` }} />
          </div>
        </div>
      </section>

      {/* Placeholder furniture so the layout does not jump when data lands */}
      <section className="stack-grid sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton h-11 w-11 rounded-xl bg-surface-raised animate-pulse" />
            <div className="skeleton mt-5 h-8 w-24 rounded-lg bg-surface-raised animate-pulse" />
            <div className="skeleton mt-2 h-3 w-16 rounded bg-surface-raised animate-pulse" />
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
    <div className="section-stack">
      <header className="page-head">
        <div>
          <p className="eyebrow text-bad">Interrupted</p>
          <h1 className="page-title text-engrave">GitHub would not answer</h1>
          <p className="page-lede">{error?.message ?? 'The request failed before any data arrived.'}</p>
        </div>
      </header>

      <section>
        <div className="card pad-luxe max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-bad/15 border border-bad/30 grid place-items-center">
              <AlertTriangle className="w-5 h-5 text-bad" />
            </div>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-ink-muted">
                {kind === 'rate-limit'
                  ? 'The token has spent its hourly quota. Waiting for the reset is the only fix — the dashboard makes about 150 requests per full refresh out of 5,000 per hour.'
                  : kind === 'scope'
                    ? 'The token authenticated but was refused on a repository. That is almost always a missing `repo` or `read:org` scope — regenerate it with those ticked.'
                    : 'This is usually a network problem or a browser extension blocking api.github.com. Retrying often clears it.'}
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <button onClick={refresh} className="btn-primary">
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </button>
                <button onClick={disconnect} className="btn-ghost">
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
