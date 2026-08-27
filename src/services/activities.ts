import { api } from './api'

export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export interface ActivityBudgetLineAllocation {
  id?: string
  budget_line_id: string
  allocated_amount: number
  budget_line?: { id: string; code: string; name: string }
}

export interface Activity {
  id: string
  organization_id: string
  project_id: string
  code: string
  name: string
  description: string | null
  status: ActivityStatus
  start_date: string | null
  end_date: string | null
  budget_lines?: ActivityBudgetLineAllocation[]
}

export interface ActivityPayload {
  code: string
  name: string
  description?: string
  status?: ActivityStatus
  start_date?: string | null
  end_date?: string | null
  budget_lines?: Array<{ id: string; allocated_amount: number }>
}

export async function fetchActivities(organizationId: string, projectId: string) {
  const { data } = await api.get(`/organizations/${organizationId}/projects/${projectId}/activities`)
  return data.data as Activity[]
}

export async function createActivity(
  organizationId: string,
  projectId: string,
  payload: ActivityPayload,
) {
  const { data } = await api.post(
    `/organizations/${organizationId}/projects/${projectId}/activities`,
    payload,
  )
  return data.data as Activity
}

export async function updateActivity(
  organizationId: string,
  projectId: string,
  activityId: string,
  payload: Partial<ActivityPayload>,
) {
  const { data } = await api.patch(
    `/organizations/${organizationId}/projects/${projectId}/activities/${activityId}`,
    payload,
  )
  return data.data as Activity
}

export async function deleteActivity(
  organizationId: string,
  projectId: string,
  activityId: string,
) {
  await api.delete(
    `/organizations/${organizationId}/projects/${projectId}/activities/${activityId}`,
  )
}
