import { NavBar } from '../components/NavBar'
import { TwoFactorSection } from '../components/TwoFactorSection'

export default function AccountSecurity() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:ml-[var(--finance-sidebar-width)] lg:px-8">
        <div className="mx-auto max-w-2xl">
          <header className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">MON COMPTE</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Sécurité</h1>
            <p className="mt-1 text-sm text-slate-500">Protégez votre compte avec la double authentification (2FA).</p>
          </header>
          <TwoFactorSection />
        </div>
      </main>
    </div>
  )
}
