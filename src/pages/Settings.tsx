import { useState, type FormEvent } from 'react'
import { UserCog, Save, KeyRound } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { TwoFactorSection } from '../components/TwoFactorSection'
import { useAuth } from '../context/AuthContext'
import { updateProfile, changePassword } from '../services/auth'

const CURRENCIES = [
  { code: 'XOF', label: 'XOF — Franc CFA (UEMOA)' },
  { code: 'XAF', label: 'XAF — Franc CFA (CEMAC)' },
  { code: 'GNF', label: 'GNF — Franc guinéen' },
  { code: 'KMF', label: 'KMF — Franc comorien' },
  { code: 'CDF', label: 'CDF — Franc congolais' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'USD', label: 'USD — Dollar américain' },
]

export default function Settings() {
  const { user, refreshUser } = useAuth()

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [currency, setCurrency] = useState(user?.preferred_currency ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setProfileMessage(null)
    setProfileSaving(true)
    try {
      await updateProfile({
        full_name: fullName,
        email,
        phone: phone || null,
        preferred_currency: currency || null,
      })
      refreshUser()
      setProfileMessage('Profil mis à jour.')
    } catch (err: any) {
      setProfileError(err.response?.data?.errors?.email?.[0] ?? err.response?.data?.message ?? 'Impossible de mettre à jour le profil.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)
    setPasswordSaving(true)
    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirmation,
      })
      setCurrentPassword(''); setNewPassword(''); setNewPasswordConfirmation('')
      setPasswordMessage('Mot de passe modifié. Vos autres sessions ont été déconnectées par sécurité.')
    } catch (err: any) {
      setPasswordError(err.response?.data?.errors?.current_password?.[0] ?? 'Impossible de modifier le mot de passe.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="min-h-screen px-4 pb-16 pt-24 sm:px-6 lg:ml-[var(--finance-sidebar-width)] lg:px-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">MON COMPTE</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><UserCog size={22} /></div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Paramètres</h1>
                <p className="text-sm text-slate-500">Vos informations personnelles, mot de passe et sécurité — propres à votre compte, pas à l'organisation.</p>
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Profil</h2>
            {profileMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{profileMessage}</div>}
            {profileError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</div>}
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nom complet</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Téléphone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+229 XX XX XX XX" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <p className="mt-1 text-[11px] text-slate-400">Utilisé pour la réinitialisation de mot de passe par SMS.</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Devise d'affichage préférée</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Utiliser la devise de l'organisation</option>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Préférence d'affichage personnelle — n'affecte pas la comptabilisation officielle de l'organisation.</p>
              </div>
              <button type="submit" disabled={profileSaving} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                <Save size={16} />{profileSaving ? 'Enregistrement...' : 'Enregistrer le profil'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><KeyRound size={18} />Changer le mot de passe</h2>
            {passwordMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{passwordMessage}</div>}
            {passwordError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</div>}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Mot de passe actuel</label>
                <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nouveau mot de passe</label>
                <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Confirmer le nouveau mot de passe</label>
                <input type="password" required minLength={8} value={newPasswordConfirmation} onChange={(e) => setNewPasswordConfirmation(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <button type="submit" disabled={passwordSaving} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                {passwordSaving ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-4 font-semibold text-slate-900">Sécurité</h2>
            <TwoFactorSection />
          </section>
        </div>
      </main>
    </div>
  )
}
