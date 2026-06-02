import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Warehouse, ArrowLeftRight, Users, FileText } from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/rooms', icon: Warehouse, label: 'Rooms' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'In/Out' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/invoices', icon: FileText, label: 'Bills' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-frost-bg flex flex-col">
      <div className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-frost-dark border-t border-frost-border flex justify-around py-2 pb-6 z-50">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1 ${isActive ? 'text-frost-blue' : 'text-frost-dim'}`
          }>
            <n.icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
