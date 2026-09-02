import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  GitBranch,
  BarChart3,
  Lightbulb,
  Sparkles,
  Dna,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  RefreshCw,
  Github,
  Loader2,
} from 'lucide-react'
import { useProfile } from '../lib/ProfileContext'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/refactoriq', label: 'RefactorIQ', icon: Sparkles, badge: 'NEW' },
  { to: '/repositories', label: 'Repositories', icon: GitBranch },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
]

function ago(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (!Number.isFinite(mins) || mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

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

export default function TopNav() {
  const { profile, status, disconnect, refresh, refreshing, fetchedAt } = useProfile()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [bellOpen, setBellOpen] = useState(false)
  const [oauthBusy, setOauthBusy] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const user = profile?.user

  async function handleConnectGithub() {
    setOauthBusy(true)
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
          /* try next base, then direct */
        }
      }
      const direct = buildDirectOAuthUrl()
      if (direct) window.location.href = direct
    } finally {
      setOauthBusy(false)
    }
  }

  useEffect(() => setMobileOpen(false), [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  useEffect(() => {
    if (!bellOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBellOpen(false)
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [bellOpen])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    setMobileOpen(false)
    navigate(q ? `/repositories?q=${encodeURIComponent(q)}` : '/repositories')
  }

  const notifications = profile?.notifications ?? []
  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="topnav">
      <div className="topnav-inner">
        {/* brand */}
        <NavLink to="/" className="topnav-brand">
          <span className="topnav-logo">
            <Dna className="w-5 h-5 text-[#0b1118]" />
          </span>
          <span className="topnav-wordmark">CodeDNA</span>
        </NavLink>

        {/* desktop nav */}
        <nav className="topnav-links" aria-label="Primary">
          {nav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `topnav-link ${isActive ? 'is-active' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold bg-[#dfbe86] text-[#0b1118] ml-1">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* desktop search */}
        <form onSubmit={onSearch} className="topnav-search">
          <Search className="topnav-search-icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search repositories…"
            aria-label="Search repositories"
            className="topnav-search-input"
          />
        </form>

        {/* actions */}
        <div className="topnav-actions">
          {status === 'no-token' && (
            <button
              type="button"
              onClick={handleConnectGithub}
              disabled={oauthBusy}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#dfbe86] text-[#0b1118] px-4 py-2 text-xs font-bold shadow-lg shadow-[#dfbe86]/20 hover:bg-[#c9a66d] disabled:opacity-50 transition-colors"
            >
              {oauthBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
              {oauthBusy ? 'Connecting…' : 'Connect GitHub'}
            </button>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh GitHub data"
            title={fetchedAt ? `Updated ${ago(fetchedAt)}` : 'Refresh GitHub data'}
            className="icon-btn topnav-icon-btn"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-accent' : ''}`} />
          </button>

          <div className="relative" ref={bellRef}>
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={bellOpen}
              onClick={() => setBellOpen((v) => !v)}
              className="icon-btn topnav-icon-btn relative"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && <span className="topnav-bell-dot" />}
            </button>
            {bellOpen && (
              <div className="topnav-bell-panel card">
                <p className="eyebrow">{notifications.length ? `${unread} unread` : 'Nothing to report'}</p>
                <div className="mt-4 space-y-4 max-h-72 overflow-auto pr-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex gap-3">
                      <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.read ? 'bg-ink-faint' : 'bg-accent'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        <p className="text-xs text-ink-faint mt-1 leading-relaxed">{n.body}</p>
                        <p className="text-[0.6rem] uppercase tracking-luxe text-ink-faint mt-1.5">{ago(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {!notifications.length && (
                    <p className="text-sm text-ink-muted">Connect an account with repositories to see activity here.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* profile */}
          <div className="topnav-profile">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" width={36} height={36} className="topnav-avatar" />
            ) : (
              <span className="topnav-avatar-fallback">{(user?.name ?? '·').charAt(0)}</span>
            )}
            <span className="topnav-profile-text hidden lg:flex">
              <span className="topnav-profile-name">{user?.name ?? 'Not connected'}</span>
              <span className="topnav-profile-handle">{user ? `@${user.handle}` : 'Awaiting GitHub'}</span>
            </span>
          </div>

          {status !== 'no-token' && (
            <button type="button" onClick={disconnect} aria-label="Disconnect" title="Disconnect" className="icon-btn topnav-icon-btn hidden sm:inline-flex">
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            className="icon-btn topnav-burger"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* mobile panel */}
      <div className={`topnav-mobile ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <form onSubmit={onSearch} className="topnav-mobile-search">
          <Search className="w-4 h-4 text-ink-faint shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search repositories…"
            aria-label="Search repositories"
            className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-faint"
          />
          <button type="submit" className="seg-btn !min-h-0 !py-1.5 text-xs shrink-0">
            Search
          </button>
        </form>
        <nav className="topnav-mobile-links" aria-label="Primary mobile">
          {nav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `topnav-mobile-link ${isActive ? 'is-active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold bg-[#dfbe86] text-[#0b1118] ml-auto">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        {status === 'no-token' && (
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false)
              void handleConnectGithub()
            }}
            disabled={oauthBusy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#dfbe86] text-[#0b1118] px-4 py-3 text-sm font-bold disabled:opacity-50"
          >
            {oauthBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
            {oauthBusy ? 'Connecting…' : 'Connect GitHub'}
          </button>
        )}
        {user && (
          <div className="topnav-mobile-profile">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" width={32} height={32} className="w-8 h-8 rounded-xl object-cover border border-white/15" />
            ) : (
              <span className="w-8 h-8 rounded-xl bg-accent-gradient grid place-items-center text-sm font-semibold text-[#0b1118]">{user.name.charAt(0)}</span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink truncate">{user.name}</span>
              <span className="block text-[0.65rem] tracking-luxe uppercase text-ink-faint truncate">@{user.handle}</span>
            </span>
            {status !== 'no-token' && (
              <button type="button" onClick={disconnect} className="ml-auto seg-btn text-xs">
                <LogOut className="w-3.5 h-3.5" /> Disconnect
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
