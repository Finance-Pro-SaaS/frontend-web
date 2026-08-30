import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/auth'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [phone, setPhone] = useState(searchParams.get('phone') ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await resetPassword({ phone, code, password, password_confirmation: passwordConfirmation })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.errors?.code?.[0] ?? err.response?.data?.message ?? 'Code invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-center mb-1">Nouveau mot de passe</h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Saisissez le code reçu par SMS et votre nouveau mot de passe.
        </p>

        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

        {success ? (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-3 text-center">
            Mot de passe réinitialisé. Redirection vers la connexion...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de téléphone</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code reçu par SMS</label>
              <input
                required
                autoFocus
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.3em]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le mot de passe</label>
              <input type="password" required minLength={8} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white text-sm font-medium rounded-md py-2 hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}

        <p className="text-sm text-slate-500 mt-6 text-center">
          <Link to="/login" className="text-slate-900 font-medium hover:underline">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
