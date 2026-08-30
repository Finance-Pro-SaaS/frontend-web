import { api } from './api'

export interface User {
  id: string
  full_name: string
  email: string
  phone: string | null
  preferred_currency: string | null
  status: string
}

export interface Organization {
  id: string
  name: string
  acronym: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
  organization_name: string
  country?: string
}

interface AuthResponse {
  user: User
  token: string
  organization?: Organization
  organizations?: Organization[]
}

interface TwoFactorChallenge {
  requires_2fa: true
  challenge_token: string
}

export type LoginResult = AuthResponse | TwoFactorChallenge

function isTwoFactorChallenge(data: AuthResponse | TwoFactorChallenge): data is TwoFactorChallenge {
  return (data as TwoFactorChallenge).requires_2fa === true
}
export { isTwoFactorChallenge }

function persistSession(data: AuthResponse) {
  if (data.token) localStorage.setItem('ong_finance_pro_token', data.token)
  if (data.user) localStorage.setItem('ong_finance_pro_user', JSON.stringify(data.user))
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await api.post<AuthResponse | TwoFactorChallenge>('/auth/login', payload)
  if (isTwoFactorChallenge(data)) return data
  persistSession(data)
  return data
}

export async function verifyTwoFactor(challengeToken: string, code?: string, recoveryCode?: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/2fa/verify-login', {
    challenge_token: challengeToken,
    code: code || undefined,
    recovery_code: recoveryCode || undefined,
  })
  persistSession(data)
  return data
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  persistSession(data)
  return data
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    localStorage.removeItem('ong_finance_pro_token')
    localStorage.removeItem('ong_finance_pro_user')
  }
}

export interface InvitationInfo {
  full_name: string
  email: string
  organizations: { id: string; name: string }[]
}

export async function fetchInvitation(token: string): Promise<InvitationInfo> {
  const { data } = await api.get<InvitationInfo>(`/auth/invitations/${token}`)
  return data
}

export async function acceptInvitation(
  token: string,
  password: string,
  passwordConfirmation: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(`/auth/invitations/${token}/accept`, {
    password,
    password_confirmation: passwordConfirmation,
  })
  persistSession(data)
  return data
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem('ong_finance_pro_user')
  if (!raw || raw === 'undefined' || raw === 'null') return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const user = parsed as Partial<User>
    if (!user.id || !user.email) return null
    return user as User
  } catch {
    localStorage.removeItem('ong_finance_pro_user')
    return null
  }
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem('ong_finance_pro_token'))
}

export async function requestPasswordResetCode(phone: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/forgot-password', { phone })
  return data
}

export async function resetPassword(payload: {
  phone: string
  code: string
  password: string
  password_confirmation: string
}): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', payload)
  return data
}

export async function updateProfile(payload: Partial<Pick<User, 'full_name' | 'email' | 'phone' | 'preferred_currency'>>): Promise<User> {
  const { data } = await api.patch('/auth/profile', payload)
  // Garde le localStorage synchronisé : sinon le nom/email affiché dans la
  // barre de navigation resterait périmé jusqu'à la prochaine connexion.
  localStorage.setItem('ong_finance_pro_user', JSON.stringify(data.data))
  return data.data
}

export async function changePassword(payload: {
  current_password: string
  password: string
  password_confirmation: string
}): Promise<{ message: string }> {
  const { data } = await api.post('/auth/change-password', payload)
  return data
}
