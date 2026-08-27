import { api } from './api'

export interface Account {
  id: string
  organization_id: string | null
  parent_id: string | null
  code: string
  name: string
  class: number
  normal_balance: 'debit' | 'credit'
  is_active: boolean
}

export async function fetchAccounts(organizationId: string) {
  const { data } = await api.get(`/organizations/${organizationId}/accounts`)
  return data.data as Account[]
}

export async function createAccount(organizationId: string, payload: {
  code: string
  name: string
  class: number
  normal_balance: 'debit' | 'credit'
  parent_id?: string | null
}) {
  const { data } = await api.post(`/organizations/${organizationId}/accounts`, payload)
  return data.data as Account
}

export async function updateAccount(organizationId: string, accountId: string, payload: { name?: string; is_active?: boolean }) {
  const { data } = await api.patch(`/organizations/${organizationId}/accounts/${accountId}`, payload)
  return data.data as Account
}
