import { api } from './api'

export interface PlatformNotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'urgent'
  created_at: string
}

export async function fetchActiveNotifications() {
  const { data } = await api.get('/notifications')
  return data.data as PlatformNotificationItem[]
}
