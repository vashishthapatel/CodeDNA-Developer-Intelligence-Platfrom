import { Outlet, useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import ProfileGate from './ProfileGate'

const PUBLIC_ROUTES = new Set(['/gemini'])

export default function Layout() {
  const { pathname } = useLocation()
  const isPublic = PUBLIC_ROUTES.has(pathname)

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="app-main">
        <div key={pathname} className="shell-inner page-shell">
          {isPublic ? <Outlet /> : <ProfileGate><Outlet /></ProfileGate>}
        </div>
      </main>
    </div>
  )
}
