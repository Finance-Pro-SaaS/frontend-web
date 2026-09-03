import { api } from './api'

export interface JournalEntryLine {
  id: string
  account: { id: string; code: string; name: string }
  debit: string | number
  credit: string | number
  label: string | null
}

export interface JournalEntry {
  id: string
  entry_date: string
  created_at?: string
  reference: string | null
  description: string | null
  journal: { id: number; code: string; name: string }
  lines: JournalEntryLine[]
}

export async function fetchJournalEntries(organizationId: string, params: { from?: string; to?: string; page?: number } = {}) {
  const { data } = await api.get(`/organizations/${organizationId}/journal-entries`, { params })
  return data as { data: JournalEntry[]; meta?: { current_page: number; last_page: number; total: number } }
}

export async function fetchJournalEntry(organizationId: string, entryId: string) {
  const { data } = await api.get(`/organizations/${organizationId}/journal-entries/${entryId}`)
  return data.data as JournalEntry
}

export interface NewJournalEntryLine {
  account_id: string
  debit?: number
  credit?: number
  label?: string
}

export async function createJournalEntry(organizationId: string, payload: {
  entry_date: string
  reference?: string
  description: string
  lines: NewJournalEntryLine[]
}) {
  const { data } = await api.post(`/organizations/${organizationId}/journal-entries`, payload)
  return data.data as JournalEntry
}
