import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordResetCode } from '../services/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await requestPasswordResetCode(email.trim())
      setSent(true)
    } catch (err: any) {
      setError(
        err.response?.data?.errors?.email?.[0] ??
          err.response?.data?.message ??
          "Impossible d'envoyer le code pour le moment.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-center mb-1">Mot de passe oublié</h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Recevez un code de vérification par email sur l'adresse associée à votre compte.
        </p>

        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

        {sent ? (
          <div>
            <div className="mb-5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-3">
              Si cette adresse est associée à un compte, un code vient de lui être envoyé par email. Pensez à vérifier vos courriers indésirables.
            </div>
            <Link
              to={`/reset-password?email=${encodeURIComponent(email.trim())}`}
              className="w-full block text-center bg-slate-900 text-white text-sm font-medium rounded-md py-2 hover:bg-slate-800"
            >
              J'ai reçu mon code
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@organisation.org"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white text-sm font-medium rounded-md py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Recevoir le code par email'}
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
