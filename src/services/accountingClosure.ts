import { api } from './api'

export async function fetchAccountingClosure(organizationId: string) {
  const { data } = await api.get(`/organizations/${organizationId}/accounting-closure`)
  return data.data as { accounting_closed_until: string | null }
}

export async function updateAccountingClosure(organizationId: string, closedUntil: string | null) {
  const { data } = await api.patch(`/organizations/${organizationId}/accounting-closure`, {
    accounting_closed_until: closedUntil,
  })
  return data.data as { accounting_closed_until: string | null }
}
