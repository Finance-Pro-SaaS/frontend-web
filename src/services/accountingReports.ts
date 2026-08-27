import { api } from './api'

export interface RestrictedFund {
  project_id: string
  project_name: string
  project_code: string
  donor: { id: string; name: string; type: string | null } | null
  currency: string
  total_received: number
  total_spent: number
  balance: number
}

export interface FundsReport {
  currency: string
  restricted_funds: RestrictedFund[]
  total_restricted_balance: number
  unrestricted_funds: { total_received: number; note: string }
}

export async function fetchFundsReport(organizationId: string) {
  const { data } = await api.get(`/organizations/${organizationId}/funds`)
  return data.data as FundsReport
}

export interface BalanceAccountRow {
  account_id: string
  code: string
  name: string
  class: number
  total_debit: number
  total_credit: number
  balance: number
}

export interface TrialBalance {
  accounts: BalanceAccountRow[]
  total_debit: number
  total_credit: number
  is_balanced: boolean
}

export async function fetchTrialBalance(organizationId: string, from: string, to: string) {
  const { data } = await api.get(`/organizations/${organizationId}/balance`, { params: { from, to } })
  return data.data as TrialBalance
}

export interface LedgerMovement {
  date: string
  reference: string | null
  description: string | null
  label: string | null
  debit: number
  credit: number
  running_balance: number
}

export interface AccountLedger {
  account: { id: string; code: string; name: string; normal_balance: 'debit' | 'credit' }
  movements: LedgerMovement[]
  closing_balance: number
}

export async function fetchAccountLedger(organizationId: string, accountId: string, from: string, to: string) {
  const { data } = await api.get(`/organizations/${organizationId}/accounts/${accountId}/ledger`, { params: { from, to } })
  return data.data as AccountLedger
}
