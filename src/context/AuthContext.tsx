import { createContext, useContext, useState, type ReactNode } from 'react'
import * as authService from '../services/auth'
import { isTwoFactorChallenge } from '../services/auth'
import type { User } from '../services/auth'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  // Retourne { requiresTwoFactor: true, challengeToken } si l'utilisateur a
  // activé la double authentification — aucune session n'est ouverte tant
  // que verifyTwoFactor() n'a pas été appelé avec succès derrière.
  login: (email: string, password: string) => Promise<{ requiresTwoFactor: boolean; challengeToken?: string }>
  verifyTwoFactor: (challengeToken: string, code?: string, recoveryCode?: string) => Promise<void>
  register: (payload: authService.RegisterPayload) => Promise<void>
  acceptInvitation: (token: string, password: string, passwordConfirmation: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser())

  async function login(email: string, password: string) {
    const result = await authService.login({ email, password })
    if (isTwoFactorChallenge(result)) {
      return { requiresTwoFactor: true, challengeToken: result.challenge_token }
    }
    setUser(result.user)
    return { requiresTwoFactor: false }
  }

  async function verifyTwoFactor(challengeToken: string, code?: string, recoveryCode?: string) {
    const data = await authService.verifyTwoFactor(challengeToken, code, recoveryCode)
    setUser(data.user)
  }

  async function register(payload: authService.RegisterPayload) {
    const data = await authService.register(payload)
    setUser(data.user)
  }

  async function acceptInvitation(token: string, password: string, passwordConfirmation: string) {
    const data = await authService.acceptInvitation(token, password, passwordConfirmation)
    setUser(data.user)
  }

  async function logout() {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), login, verifyTwoFactor, register, acceptInvitation, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>')
  return ctx
}
