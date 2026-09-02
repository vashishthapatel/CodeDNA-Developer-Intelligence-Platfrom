import { Outlet, useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import ProfileGate from './ProfileGate'

export default function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="app-main">
        <div key={pathname} className="shell-inner page-shell">
          <ProfileGate>
            <Outlet />
          </ProfileGate>
        </div>
      </main>
    </div>
  )
}
