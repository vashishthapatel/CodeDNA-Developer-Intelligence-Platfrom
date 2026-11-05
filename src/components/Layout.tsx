import { Outlet, useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import ProfileGate from './ProfileGate'

export default function Layout() {
  const { pathname } = useLocation()
  const isPublic = false

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="app-main">
        <div key={pathname} className="shell-inner page-shell page-enter">
          {isPublic ? <Outlet /> : <ProfileGate><Outlet /></ProfileGate>}
        </div>
      </main>
    </div>
  )
}
