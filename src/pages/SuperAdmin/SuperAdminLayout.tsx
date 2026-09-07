import { type ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CreditCard, UserCog, LogOut, Menu, X, Bell } from 'lucide-react'
import { useSuperAdminAuth } from '../../context/SuperAdminAuthContext'

type NavItem = {
  label: string
  to: string
  icon: typeof LayoutDashboard
  end?: boolean
}

// Liste centralisée des entrées du menu Admin : pour ajouter une page à la
// sidebar plus tard (ex. la future page de notifications), il suffit
// d'ajouter une ligne ici — aucune page existante n'a besoin d'être modifiée.
const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', to: '/super-admin', icon: LayoutDashboard, end: true },
  { label: "Paliers d'abonnement", to: '/super-admin/subscription-plans', icon: CreditCard },
  { label: 'Notifications', to: '/super-admin/notifications', icon: Bell },
  { label: 'Profil', to: '/super-admin/profile', icon: UserCog },
]

/**
 * Layout commun à toutes les pages du Super Admin : sidebar fixe sur desktop
 * (navigation directe d'une page à l'autre sans repasser par le dashboard),
 * et menu à tiroir sur mobile/tablette. Remplace les en-têtes dupliqués que
 * chaque page réimplémentait avant.
 */
export default function SuperAdminLayout({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  const { admin, logout } = useSuperAdminAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/super-admin/login')
  }

  const sidebarBody = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Espace plateforme</p>
        <h1 className="mt-1 text-base font-semibold leading-tight text-white">
          Super Admin
          <br />
          ONG Finance Pro
        </h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-3 py-4">
        <button
          onClick={() => {
            setMobileOpen(false)
            navigate('/super-admin/profile')
          }}
          title={admin?.full_name}
          className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-amber-400">
            {admin?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
          <span className="truncate">{admin?.full_name}</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar fixe (desktop) */}
      <aside className="hidden w-64 shrink-0 bg-slate-950 lg:block">{sidebarBody}</aside>

      {/* Sidebar en tiroir (mobile/tablette) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 h-full w-64 bg-slate-950 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Barre du haut, uniquement visible sur mobile/tablette pour ouvrir la sidebar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-4 py-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-slate-300 hover:text-white">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="truncate text-sm font-semibold text-white">{title ?? 'Super Admin'}</h1>
          <span className="w-6" />
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
