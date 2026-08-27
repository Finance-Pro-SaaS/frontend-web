import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import packageJson from '../../package.json'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, verifyTwoFactor } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const APP_version = packageJson.version

  // Étape 2 (uniquement si le compte a activé la double authentification)
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.requiresTwoFactor && result.challengeToken) {
        setChallengeToken(result.challengeToken)
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          'Connexion impossible. Vérifiez votre email et mot de passe.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyTwoFactor(e: FormEvent) {
    e.preventDefault()
    if (!challengeToken) return
    setError(null)
    setLoading(true)
    try {
      if (useRecoveryCode) {
        await verifyTwoFactor(challengeToken, undefined, code)
      } else {
        await verifyTwoFactor(challengeToken, code, undefined)
      }
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Code incorrect ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  if (challengeToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-xl font-semibold text-center mb-1">Vérification en deux étapes</h1>
          <p className="text-sm text-slate-500 text-center mb-6">
            {useRecoveryCode
              ? 'Saisissez un de vos codes de secours à usage unique.'
              : "Saisissez le code à 6 chiffres généré par votre application d'authentification."}
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
            <input
              autoFocus
              required
              inputMode={useRecoveryCode ? 'text' : 'numeric'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={useRecoveryCode ? 'XXXX-XXXX' : '••••••'}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white text-sm font-medium rounded-md py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Valider'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setUseRecoveryCode((v) => !v); setCode(''); setError(null) }}
            className="mt-4 w-full text-center text-xs text-slate-500 hover:underline"
          >
            {useRecoveryCode ? "J'ai accès à mon application d'authentification" : 'Utiliser un code de secours à la place'}
          </button>
          <button
            type="button"
            onClick={() => { setChallengeToken(null); setCode(''); setError(null) }}
            className="mt-2 w-full text-center text-xs text-slate-400 hover:underline"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold  text-center mb-1">Finance Pro</h1>
        <p className="text-sm text-center mb-6">Connectez-vous à votre organisation</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="vous@ong.bj"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white text-sm font-medium rounded-md py-2 hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-slate-900 font-medium hover:underline">
            Créer une organisation
          </Link>
        </p>
        <div className="text-center text-[12px] finance-text mt-3">
            <p>Version: {APP_version}</p>
        </div>
      </div>
    </div>
  )
}
