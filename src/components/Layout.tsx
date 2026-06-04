import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Warehouse, ArrowLeftRight, Users, FileText, HardHat, Globe } from 'lucide-react'
import { useLang } from '../lib/i18n'

export default function Layout() {
  const { tr, lang, setLang, dir } = useLang()

  const NAV = [
    { to: '/', icon: LayoutDashboard, label: tr('home') },
    { to: '/rooms', icon: Warehouse, label: tr('rooms') },
    { to: '/transactions', icon: ArrowLeftRight, label: tr('inOut') },
    { to: '/clients', icon: Users, label: tr('clients') },
    { to: '/invoices', icon: FileText, label: tr('invoices') },
    { to: '/workers', icon: HardHat, label: tr('workers') },
  ]

  return (
    <div className="min-h-screen bg-frost-bg flex flex-col">
      {/* Language toggle - top right */}
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="fixed top-3 right-3 z-50 bg-frost-elevated border border-frost-border rounded-full px-3 py-1.5 text-xs font-bold text-frost-dim hover:text-frost-blue transition-colors flex items-center gap-1.5"
      >
        <Globe size={12} />
        {tr('language')}
      </button>

      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-frost-dark/95 backdrop-blur-md border-t border-frost-border/50 flex justify-around px-1 pt-2 pb-5 z-50">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${isActive ? 'text-frost-blue' : 'text-frost-dim'}`
          }>
            <n.icon size={19} />
            <span className="text-[9px] font-semibold">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
