import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuperAdminAuth } from '../../context/SuperAdminAuthContext'
import { fetchDashboard, fetchOrganizations, suspendOrganization, reactivateOrganization, type AdminOrganization } from '../../services/superAdmin'

type ApprovalFilter = '' | 'pending' | 'approved' | 'rejected'

const STATUS_LABELS: Record<AdminOrganization['approval_status'], string> = {
  pending: 'En attente',
  approved: 'Validée',
  rejected: 'Rejetée',
}

const STATUS_COLORS: Record<AdminOrganization['approval_status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const FILTERS: ApprovalFilter[] = ['', 'pending', 'approved', 'rejected']

export default function SuperAdminDashboard() {
  const { admin, logout } = useSuperAdminAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchDashboard>> | null>(null)
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([])
  const [filter, setFilter] = useState<ApprovalFilter>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const [dashboardStats, orgs] = await Promise.all([
        fetchDashboard(),
        fetchOrganizations(filter, search),
      ])

      setStats(dashboardStats)
      setOrganizations(orgs)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Le rechargement volontaire se fait uniquement lorsque le filtre change.
    // La recherche est déclenchée avec Entrée pour éviter des requêtes à chaque frappe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function handleLogout() {
    await logout()
    navigate('/super-admin/login')
  }

  async function runAction(id: string, action: () => Promise<AdminOrganization>) {
    setBusyId(id)
    setError(null)

    try {
      await action()
      // Recharge la liste depuis le serveur afin que le statut et les données
      // affichées restent cohérents avec le filtre courant.
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Action impossible.')
    } finally {
      setBusyId(null)
    }
  }

  function handleFilterChange(nextFilter: ApprovalFilter) {
    setFilter(nextFilter)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Espace plateforme</p>
            <h1 className="text-lg font-semibold text-white">Super Admin — ONG Finance Pro</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/super-admin/subscription-plans')}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Paliers d'abonnement
            </button>
            <button
              onClick={() => navigate('/super-admin/profile')}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {admin?.full_name}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Organisations" value={stats.organizations.total} />
            <StatCard label="En attente de validation" value={stats.organizations.pending} accent="amber" />
            <StatCard label="Factures en retard" value={stats.invoices.overdue_count} accent="red" />
            <StatCard
              label="Encaissé ce mois"
              value={`${Number(stats.invoices.paid_this_month).toLocaleString('fr-FR')} FCFA`}
              accent="green"
            />
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Organisations</h2>
              <p className="mt-1 text-sm text-slate-500">
                Consultez et gérez toutes les organisations de la plateforme, y compris celles déjà validées.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {FILTERS.map((status) => (
                <button
                  key={status || 'all'}
                  onClick={() => handleFilterChange(status)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    filter === status
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {status === '' ? 'Toutes' : STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 flex justify-center">
            <div className="w-full max-w-xl">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && load()}
                placeholder="Rechercher une organisation..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {loading ? (
              <div className="flex min-h-40 items-center justify-center p-6 text-sm text-slate-500">
                Chargement des organisations...
              </div>
            ) : organizations.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-1 p-8 text-center">
                <p className="text-sm font-medium text-slate-600">Aucune organisation</p>
                <p className="text-xs text-slate-400">
                  Aucune organisation ne correspond au filtre ou à la recherche actuelle.
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3 text-center font-semibold">Organisation</th>
                    <th className="px-5 py-3 text-center font-semibold">Pays</th>
                    <th className="px-5 py-3 text-center font-semibold">Membres</th>
                    <th className="px-5 py-3 text-center font-semibold">Projets</th>
                    <th className="px-5 py-3 text-center font-semibold">Statut</th>
                    <th className="px-5 py-3 text-center font-semibold">Accès</th>
                    <th className="px-5 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
                          className="font-semibold text-slate-900 transition hover:text-slate-600 hover:underline"
                        >
                          {org.name}
                        </button>
                        {org.acronym && (
                          <span className="ml-1 text-slate-400">({org.acronym})</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center text-slate-600">{org.country}</td>
                      <td className="px-5 py-4 text-center text-slate-600">{org.users_count}</td>
                      <td className="px-5 py-4 text-center text-slate-600">{org.projects_count}</td>

                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[org.approval_status]}`}>
                          {STATUS_LABELS[org.approval_status]}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        {org.access_blocked_reason ? (
                          <span className="text-xs font-medium text-red-600">Accès bloqué</span>
                        ) : (
                          <span className="text-xs font-medium text-green-600">Accès actif</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {busyId === org.id ? (
                          <div className="flex justify-center">
                            <span className="text-xs text-slate-400">Traitement...</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
                              className="text-xs font-semibold text-slate-700 transition hover:text-slate-950 hover:underline"
                            >
                              Voir le profil
                            </button>

                            {org.is_active ? (
                              <button
                                onClick={() => runAction(org.id, () => suspendOrganization(org.id))}
                                className="text-xs font-medium text-red-600 transition hover:text-red-800 hover:underline"
                              >
                                Suspendre
                              </button>
                            ) : (
                              <button
                                onClick={() => runAction(org.id, () => reactivateOrganization(org.id))}
                                className="text-xs font-medium text-green-600 transition hover:text-green-800 hover:underline"
                              >
                                Réactiver
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: 'amber' | 'red' | 'green'
}) {
  const color =
    accent === 'amber'
      ? 'text-amber-600'
      : accent === 'red'
        ? 'text-red-600'
        : accent === 'green'
          ? 'text-green-600'
          : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
