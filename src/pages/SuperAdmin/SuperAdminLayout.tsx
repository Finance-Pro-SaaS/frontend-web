import { type ReactNode, useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, CreditCard, UserCog, LogOut, Menu, X, Bell, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useSuperAdminAuth } from '../../context/SuperAdminAuthContext'

type NavItem = {
  label: string
  to: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', to: '/super-admin', icon: LayoutDashboard, end: true },
  { label: "Paliers d'abonnement", to: '/super-admin/subscription-plans', icon: CreditCard },
  { label: 'Notifications', to: '/super-admin/notifications', icon: Bell },
  { label: 'Profil', to: '/super-admin/profile', icon: UserCog },
]

export default function SuperAdminLayout({
  title,
  children
}: {
  title?: string
  children: ReactNode
}) {
  const { admin, logout } = useSuperAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Même logique que NavBar : on met une variable CSS pour décaler le contenu
  useEffect(() => {
    document.documentElement.style.setProperty('--superadmin-sidebar-width', collapsed? '72px' : '256px')
    return () => {
      document.documentElement.style.removeProperty('--superadmin-sidebar-width')
    }
  }, [collapsed])

  // Ferme le menu mobile quand on change de page
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/super-admin/login')
  }

  const initials = admin?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'SA'

  const sidebarBody = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-6 py-5">
        {!collapsed && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Espace plateforme</p>
            <h1 className="mt-2 text-base font-semibold leading-tight text-white">Super Admin</h1>
          </>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-slate-950">SA</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            title={collapsed? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                 ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed? 'justify-center' : ''}`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-3 py-4">
        <button
          onClick={() => { setMobileOpen(false); navigate('/super-admin/profile') }}
          title={admin?.full_name}
          className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white ${collapsed? 'justify-center' : ''}`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-amber-400">
            {initials}
          </span>
          {!collapsed && <span className="truncate">{admin?.full_name}</span>}
        </button>
        <button
          onClick={handleLogout}
          title={collapsed? 'Déconnexion' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white ${collapsed? 'justify-center' : ''}`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Déconnexion'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-slate-800 bg-slate-950 transition-[width] duration-200 lg:flex ${collapsed? 'w-[72px]' : 'w-64'}`}>
        {sidebarBody}
      </aside>

      {/* Sidebar Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button type="button" aria-label="Fermer" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/60" />
          <aside className="relative flex h-full w-[min(86vw,280px)] flex-col bg-slate-950">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            {sidebarBody}
          </aside>
        </div>
      )}

      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-slate-800 bg-slate-950/95 backdrop-blur lg:left-[var(--superadmin-sidebar-width)]">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCollapsed((v) =>!v)} className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 lg:flex">
              {collapsed? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
            <button type="button" onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 lg:hidden">
              <Menu size={20} />
            </button>
            <h1 className="truncate text-sm font-semibold text-white">{title?? 'Super Admin'}</h1>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
      </main>
    </>
  )
}