import { useEffect, useState } from 'react'
import {
  Activity,
  CalendarDays,
  RefreshCw,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useOrganization } from '../context/OrganizationContext'
import { fetchAuditLogs, type AuditLog } from '../services/auditLogs'
import { formatDateTime } from '../utils/date'
import { NavBar } from '../components/NavBar'

type AuditAction = 'created' | 'updated' | 'deleted'

type AuditMetadata = {
  status?: number
  entity_name?: string | null
}

type AuditLogWithMetadata = AuditLog & {
  metadata?: AuditMetadata | null
}

const ACTION_LABELS: Record<AuditAction, string> = {
  created: 'Création',
  updated: 'Modification',
  deleted: 'Suppression',
}

const ENTITY_LABELS: Record<string, string> = {
  Project: 'projet',
  BudgetLine: 'ligne budgétaire',
  Category: 'catégorie',
  BankAccount: 'compte bancaire',
  Transaction: 'transaction',
  Payment: 'paiement',
  Expense: 'dépense',
  Revenue: 'recette',
  User: 'utilisateur',
  Organization: 'organisation',
  Account: 'compte',
  Budget: 'budget',
  Conflict: 'conflit',
  SyncConflict: 'conflit de synchronisation',
}

function getActionLabel(action: string): string {
  return ACTION_LABELS[action as AuditAction] ?? action
}

function getEntityLabel(entityType?: string | null): string {
  if (!entityType) return 'élément'

  return ENTITY_LABELS[entityType] ?? entityType
}

function getActionIcon(action: string) {
  switch (action) {
    case 'created':
      return <Plus size={15} />

    case 'updated':
      return <Pencil size={15} />

    case 'deleted':
      return <Trash2 size={15} />

    default:
      return <Activity size={15} />
  }
}

function getActionClasses(action: string): string {
  switch (action) {
    case 'created':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-100'

    case 'updated':
      return 'bg-blue-50 text-blue-700 border border-blue-100'

    case 'deleted':
      return 'bg-red-50 text-red-700 border border-red-100'

    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

export default function AuditLogs() {
  const { currentOrganization } = useOrganization()

  const [logs, setLogs] = useState<AuditLogWithMetadata[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState('')

  async function load() {
    if (!currentOrganization) return

    setLoading(true)
    setError('')

    try {
      const result = await fetchAuditLogs(
        currentOrganization.id,
        action ? { action } : {},
      )

      setLogs(result.data as AuditLogWithMetadata[])
      setTotal(result.meta.total)
    } catch (e) {
      setError('Impossible de charger la traçabilité.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [currentOrganization?.id, action])

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="min-h-screen px-4 pb-10 pt-24 sm:px-6 lg:ml-[var(--finance-sidebar-width)] lg:px-8">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <ShieldCheck size={14} />
              Contrôle & traçabilité
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Journal d'audit
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Historique des opérations sensibles effectuées dans
              l'organisation.
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Actualiser
          </button>
        </div>

        {/* Statistiques / filtre */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                <Activity size={19} />
              </div>

              <div>
                <div className="text-xs font-medium text-slate-400">
                  Événements enregistrés
                </div>

                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {total}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                <CalendarDays size={19} />
              </div>

              <div>
                <div className="text-xs font-medium text-slate-400">
                  Filtre d'action
                </div>

                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="mt-1 rounded-lg border-0 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Toutes les actions</option>
                  <option value="created">Créations</option>
                  <option value="updated">Modifications</option>
                  <option value="deleted">Suppressions</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Journal */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Chargement du journal…
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck
                className="mx-auto mb-3 text-slate-300"
                size={34}
              />

              <p className="font-semibold text-slate-700">
                Aucun événement
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Les créations, modifications et suppressions apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => {
                const actionLabel = getActionLabel(log.action)
                const entityLabel = getEntityLabel(log.entity_type)

                const metadata = log.metadata ?? null
                const entityName = metadata?.entity_name ?? null

                return (
                  <div
                    key={log.id}
                    className="flex flex-col gap-4 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      {/* Icône */}
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getActionClasses(
                          log.action,
                        )}`}
                      >
                        {getActionIcon(log.action)}
                      </div>

                      {/* Informations */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${getActionClasses(
                              log.action,
                            )}`}
                          >
                            {actionLabel}
                          </span>

                          <span className="text-sm font-medium text-slate-800">
                            {entityLabel}
                          </span>
                        </div>

                        {/* Nom réel de l'élément */}
                        {entityName ? (
                          <div className="mt-1.5 truncate text-sm font-semibold text-slate-900">
                            {entityName}
                          </div>
                        ) : (
                          <div className="mt-1.5 text-sm text-slate-400">
                            Élément non identifié
                          </div>
                        )}

                        {/* Utilisateur / IP */}
                        <div className="mt-1 text-xs text-slate-400">
                          {log.user?.full_name ?? 'Utilisateur inconnu'}

                          {log.ip_address
                            ? ` • ${log.ip_address}`
                            : ''}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <time className="shrink-0 text-xs font-medium text-slate-400 sm:text-right">
                      {formatDateTime(log.created_at)}
                    </time>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}