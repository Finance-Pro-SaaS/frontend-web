import { useEffect, useState, type FormEvent } from 'react'
import QRCode from 'qrcode'
import { ShieldCheck, ShieldOff, Copy, Check, KeyRound } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import {
  fetchTwoFactorStatus,
  enableTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
  regenerateRecoveryCodes,
} from '../services/twoFactor'

export default function AccountSecurity() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Flux d'activation (étape 1 : QR code / secret, étape 2 : confirmation)
  const [setupSecret, setSetupSecret] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [confirmCode, setConfirmCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [copied, setCopied] = useState(false)

  // Flux de désactivation
  const [showDisableForm, setShowDisableForm] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')

  async function load() {
    setLoading(true)
    try {
      const status = await fetchTwoFactorStatus()
      setEnabled(status.enabled)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Impossible de charger le statut de sécurité.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleStartSetup() {
    setError(null); setMessage(null)
    try {
      const { secret, otpauth_uri } = await enableTwoFactor()
      setSetupSecret(secret)
      setQrDataUrl(await QRCode.toDataURL(otpauth_uri, { width: 220, margin: 1 }))
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Impossible de démarrer l'activation.")
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const result = await confirmTwoFactor(confirmCode)
      setRecoveryCodes(result.data.recovery_codes)
      setEnabled(true)
      setSetupSecret(null)
      setQrDataUrl(null)
      setConfirmCode('')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Code incorrect.')
    }
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await disableTwoFactor(disablePassword)
      setEnabled(false)
      setShowDisableForm(false)
      setDisablePassword('')
      setMessage('Double authentification désactivée.')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Mot de passe incorrect.')
    }
  }

  async function handleRegenerateCodes() {
    const code = prompt("Saisissez votre code actuel à 6 chiffres pour régénérer vos codes de secours :")
    if (!code) return
    setError(null)
    try {
      const result = await regenerateRecoveryCodes(code)
      setRecoveryCodes(result.recovery_codes)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Code incorrect.')
    }
  }

  function copySecret() {
    if (!setupSecret) return
    navigator.clipboard.writeText(setupSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

          {message && <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
          {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Chargement...</div>
          ) : recoveryCodes ? (
            // Codes de secours affichés UNE SEULE FOIS après activation/régénération
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="mb-2 flex items-center gap-2 font-semibold text-amber-900"><KeyRound size={18}/> Vos codes de secours</h2>
              <p className="mb-4 text-sm text-amber-800">
                Notez ces 8 codes et conservez-les en lieu sûr (hors de votre téléphone). Chacun ne peut être utilisé qu'une seule fois pour vous reconnecter si vous perdez l'accès à votre application d'authentification. Ils ne seront plus jamais affichés en clair après avoir quitté cette page.
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-4 font-mono text-sm">
                {recoveryCodes.map((c) => <div key={c} className="text-slate-700">{c}</div>)}
              </div>
              <button
                onClick={() => setRecoveryCodes(null)}
                className="mt-5 rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-900"
              >
                J'ai noté mes codes de secours
              </button>
            </div>
          ) : setupSecret ? (
            // Étape 2 : scan du QR code + confirmation
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 font-semibold text-slate-900">Scannez ce code</h2>
              <p className="mb-4 text-sm text-slate-500">Avec Google Authenticator, Microsoft Authenticator, Authy ou toute application compatible.</p>
              {qrDataUrl && <img src={qrDataUrl} alt="QR code d'activation 2FA" className="mx-auto mb-4 rounded-lg border border-slate-200" />}
              <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <code className="text-xs text-slate-600">{setupSecret}</code>
                <button onClick={copySecret} className="text-slate-500 hover:text-slate-800">{copied ? <Check size={16}/> : <Copy size={16}/>}</button>
              </div>
              <p className="mb-3 text-xs text-slate-400">Impossible de scanner ? Saisissez ce code manuellement dans votre application.</p>
              <form onSubmit={handleConfirm} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Code de vérification</label>
                  <input
                    autoFocus
                    required
                    inputMode="numeric"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    placeholder="••••••"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.3em]"
                  />
                </div>
                <button type="submit" className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Confirmer</button>
              </form>
              <button onClick={() => { setSetupSecret(null); setQrDataUrl(null) }} className="mt-4 text-xs text-slate-400 hover:underline">Annuler</button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                {enabled ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700"><ShieldCheck size={20}/></span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><ShieldOff size={20}/></span>
                )}
                <div>
                  <p className="font-semibold text-slate-900">Double authentification {enabled ? 'activée' : 'désactivée'}</p>
                  <p className="text-xs text-slate-500">{enabled ? 'Un code de votre application est demandé à chaque connexion.' : 'Ajoutez une protection supplémentaire à votre compte.'}</p>
                </div>
              </div>

              {enabled ? (
                showDisableForm ? (
                  <form onSubmit={handleDisable} className="mt-4 border-t border-slate-100 pt-4">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Confirmez votre mot de passe pour désactiver</label>
                    <div className="flex items-end gap-3">
                      <input type="password" required value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      <button type="submit" className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Désactiver</button>
                      <button type="button" onClick={() => setShowDisableForm(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600">Annuler</button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
                    <button onClick={handleRegenerateCodes} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Régénérer mes codes de secours</button>
                    <button onClick={() => setShowDisableForm(true)} className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">Désactiver</button>
                  </div>
                )
              ) : (
                <button onClick={handleStartSetup} className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                  Activer la double authentification
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
