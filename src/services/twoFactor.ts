import { api } from './api'

export async function fetchTwoFactorStatus() {
  const { data } = await api.get('/auth/2fa/status')
  return data.data as { enabled: boolean }
}

export async function enableTwoFactor() {
  const { data } = await api.post('/auth/2fa/enable')
  return data.data as { secret: string; otpauth_uri: string }
}

export async function confirmTwoFactor(code: string) {
  const { data } = await api.post('/auth/2fa/confirm', { code })
  return data as { message: string; data: { recovery_codes: string[] } }
}

export async function disableTwoFactor(password: string) {
  const { data } = await api.post('/auth/2fa/disable', { password })
  return data as { message: string }
}

export async function regenerateRecoveryCodes(code: string) {
  const { data } = await api.post('/auth/2fa/recovery-codes', { code })
  return data.data as { recovery_codes: string[] }
}
