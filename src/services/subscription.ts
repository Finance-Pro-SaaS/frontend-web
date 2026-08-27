import { api } from './api'

export interface SubscriptionPlan {
  code: string
  label: string
  monthly_amount: number
  currency: string
  limits: {
    active_projects: number | null
    users: number | null
    accounts: number | null
  }
  description: string
}

export interface SubscriptionUsage {
  current_plan: SubscriptionPlan
  usage: {
    active_projects: number
    users: number
    accounts: number
  }
  exceeds_current_plan: boolean
  recommended_plan: SubscriptionPlan | null
  available_plans: SubscriptionPlan[]
}

export async function fetchSubscriptionUsage(organizationId: string) {
  const { data } = await api.get(`/organizations/${organizationId}/subscription/usage`)
  return data.data as SubscriptionUsage
}

export async function upgradeSubscription(organizationId: string, planCode: string) {
  const { data } = await api.post(`/organizations/${organizationId}/subscription/upgrade`, { plan_code: planCode })
  return data as { message: string; data: unknown }
}
