import { superAdminApi } from './superAdminApi'

export interface AdminSubscriptionPlan {
  id: string
  code: string
  label: string
  description: string | null
  monthly_amount: string
  currency: string
  rank: number
  max_active_projects: number | null
  max_users: number | null
  max_accounts: number | null
  is_active: boolean
}

export type SubscriptionPlanInput = {
  code?: string
  label: string
  description?: string | null
  monthly_amount: number
  currency?: string
  rank?: number
  max_active_projects?: number | null
  max_users?: number | null
  max_accounts?: number | null
  is_active?: boolean
}

export async function fetchSubscriptionPlans() {
  const { data } = await superAdminApi.get('/super-admin/subscription-plans')
  return data.data as AdminSubscriptionPlan[]
}

export async function createSubscriptionPlan(payload: SubscriptionPlanInput) {
  const { data } = await superAdminApi.post('/super-admin/subscription-plans', payload)
  return data.data as AdminSubscriptionPlan
}

export async function updateSubscriptionPlan(id: string, payload: Partial<SubscriptionPlanInput>) {
  const { data } = await superAdminApi.put(`/super-admin/subscription-plans/${id}`, payload)
  return data.data as AdminSubscriptionPlan
}

export async function deactivateSubscriptionPlan(id: string) {
  const { data } = await superAdminApi.delete(`/super-admin/subscription-plans/${id}`)
  return data.data as AdminSubscriptionPlan
}
