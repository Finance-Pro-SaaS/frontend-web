import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  FolderKanban,
  HandCoins,
  RefreshCw,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { NotificationsBanner } from '../components/NotificationsBanner'
import { FinancialChart } from '../components/FinancialChart'
import { ExpenseBreakdown } from '../components/ExpenseBreakdown'
import { Sparkline, TrendBadge } from '../components/Sparkline'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { fetchProjects, type Project } from '../services/projects'
import { fetchExpenses, type Expense } from '../services/expenses'
import { fetchRevenues, type Revenue } from '../services/revenues'
import { formatDateTime } from '../utils/date'

interface DashboardData {
  projects: Project[]
  expenses: Expense[]
  revenues: Revenue[]
}

const STATUS_LABELS: Record<Project['status'], string> = {
  draft: 'Brouillon',
  active: 'Actif',
  suspended: 'Suspendu',
  closed: 'Clôturé',
}

const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

function formatAmount(value: number, currency: string) {
  return `${numberFormatter.format(Math.round(value))} ${currency}`
}

function getFirstName(fullName: string | undefined) {
  return fullName?.trim().split(/\s+/)[0] || 'Administrateur'
}

// Le mois en cours est incomplet : on compare les deux derniers mois complets.
function trendOf(values: number[], labels: string[]) {
  const last = values.length - 2
  return {
    current: values[last] ?? 0,
    previous: values[last - 1] ?? 0,
    label: `${labels[last]} vs ${labels[last - 1]}`,
  }
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
  series,
  trend,
  color,
}: {
  label: string
  value: string
  description: string
  icon: LucideIcon
  tone: 'dark' | 'green' | 'red' | 'blue'
  series?: number[]
  trend?: { current: number; previous: number; inverse?: boolean; label?: string }
  color?: string
}) {
  const toneClasses = {
    dark: 'bg-slate-900 text-white',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className="fp-stat-card">
      <div className="min-w-0 flex-1">
        <div className="fp-stat-label">{label}</div>
        <div className="fp-stat-value truncate" title={value} style={{ fontSize: 'clamp(1.15rem, 1.6vw, 1.5rem)' }}>{value}</div>
        <div className="mt-1 text-xs text-slate-400">{description}</div>
        {trend && (
          <div className="mt-2">
            <TrendBadge current={trend.current} previous={trend.previous} inverse={trend.inverse} label={trend.label} />
          </div>
        )}
        {series && color && (
          <div className="mt-2">
            <Sparkline values={series} color={color} />
          </div>
        )}
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon size={19} strokeWidth={2} />
      </div>
    </div>
  )
}

function LoadingCard() {
  return <div className="fp-stat-card animate-pulse"><div className="h-12 w-2/3 rounded-lg bg-slate-100" /><div className="h-10 w-10 rounded-xl bg-slate-100" /></div>
}

export default function Dashboard() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  const [data, setData] = useState<DashboardData>({ projects: [], expenses: [], revenues: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDashboard() {
    if (!currentOrganization) return

    setLoading(true)
    setError(null)

    try {
      const [projects, expenses, revenues] = await Promise.all([
        fetchProjects(currentOrganization.id),
        fetchExpenses(currentOrganization.id),
        fetchRevenues(currentOrganization.id),
      ])
      setData({ projects, expenses, revenues })
    } catch (err) {
      console.error('Dashboard loading error', err)
      setError('Impossible de charger les données du tableau de bord.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id])

  const currency = currentOrganization?.default_currency || 'XOF'

  // Seuls les montants "approved" et "paid" représentent de l'argent réellement
  // engagé/reçu. Les brouillons, dépenses en attente ou rejetées ne doivent
  // jamais entrer dans les totaux financiers affichés au tableau de bord.
  const CONFIRMED_STATUSES: readonly string[] = ['approved', 'paid']
  const confirmedExpenses = useMemo(
    () => data.expenses.filter((item) => CONFIRMED_STATUSES.includes(item.status)),
    [data.expenses]
  )
  const confirmedRevenues = useMemo(
    () => data.revenues.filter((item) => CONFIRMED_STATUSES.includes(item.status)),
    [data.revenues]
  )

  const totals = useMemo(() => {
    const revenues = confirmedRevenues
      .filter((item) => item.currency === currency)
      .reduce((sum, item) => sum + Number(item.amount), 0)
    const expenses = confirmedExpenses
      .filter((item) => item.currency === currency)
      .reduce((sum, item) => sum + Number(item.amount), 0)

    return {
      revenues,
      expenses,
      balance: revenues - expenses,
      activeProjects: data.projects.filter((project) => project.status === 'active').length,
    }
  }, [currency, confirmedRevenues, confirmedExpenses, data.projects])

  // Séries des 6 derniers mois pour les mini-courbes et tendances des cartes.
  const monthlySeries = useMemo(() => {
    const now = new Date()
    const keys = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    })
    const revenues = keys.map(() => 0)
    const expenses = keys.map(() => 0)

    confirmedRevenues
      .filter((item) => item.currency === currency)
      .forEach((item) => {
        const index = keys.indexOf(item.received_date.slice(0, 7))
        if (index >= 0) revenues[index] += Number(item.amount)
      })

    confirmedExpenses
      .filter((item) => item.currency === currency)
      .forEach((item) => {
        const index = keys.indexOf(item.expense_date.slice(0, 7))
        if (index >= 0) expenses[index] += Number(item.amount)
      })

    const labels = keys.map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const short = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '')
      return short.charAt(0).toUpperCase() + short.slice(1)
    })

    return { revenues, expenses, balance: revenues.map((value, index) => value - expenses[index]), labels }
  }, [currency, confirmedRevenues, confirmedExpenses])

  const otherCurrencyCount = useMemo(
    () =>
      confirmedRevenues.filter((item) => item.currency !== currency).length +
      confirmedExpenses.filter((item) => item.currency !== currency).length,
    [currency, confirmedRevenues, confirmedExpenses]
  )

  const projectSummary = useMemo(() => {
    return data.projects
      .map((project) => {
        const budget = Number(project.total_budget)
        const spent = confirmedExpenses
          .filter((expense) => expense.project_id === project.id && expense.currency === project.currency)
          .reduce((sum, expense) => sum + Number(expense.amount), 0)
        const rawPercentage = budget > 0 ? (spent / budget) * 100 : 0

        return { project, budget, spent, rawPercentage, percentage: Math.min(100, rawPercentage) }
      })
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 5)
  }, [data.projects, confirmedExpenses])

  const recentActivity = useMemo(() => {
    const revenues = confirmedRevenues.map((item) => ({
      id: `revenue-${item.id}`,
      date: item.created_at ?? item.received_date,
      type: 'revenue' as const,
      title: item.donor?.name || 'Recette',
      description: item.project?.name || 'Recette générale',
      amount: Number(item.amount),
      currency: item.currency,
    }))

    const expenses = confirmedExpenses.map((item) => ({
      id: `expense-${item.id}`,
      date: item.created_at ?? item.expense_date,
      type: 'expense' as const,
      title: item.supplier_name || 'Dépense',
      description: item.project?.name || 'Dépense générale',
      amount: Number(item.amount),
      currency: item.currency,
    }))

    return [...revenues, ...expenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
  }, [confirmedRevenues, confirmedExpenses])

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="fp-page">
        <div className="fp-page-container">
          <div className="fp-page-header">
            <div>
              <h1 className="fp-page-title">Bienvenue, {getFirstName(user?.full_name)}</h1>
              <p className="fp-page-description">
                {currentOrganization
                  ? `Vue d’ensemble de ${currentOrganization.name}`
                  : 'Chargement de votre organisation...'}
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading || !currentOrganization}
              className="fp-btn fp-btn-secondary"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>

          <NotificationsBanner />

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Données indisponibles</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {!currentOrganization ? (
            <div className="fp-card p-8 text-center">
              <p className="text-sm font-medium text-slate-700">Aucune organisation active</p>
              <p className="mt-1 text-sm text-slate-400">Sélectionnez ou configurez votre organisation pour afficher les indicateurs.</p>
            </div>
          ) : loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <LoadingCard key={index} />)}
            </div>
          ) : (
            <>
              {otherCurrencyCount > 0 && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <CircleAlert size={18} className="mt-0.5 shrink-0" />
                  <p>
                    {otherCurrencyCount} opération{otherCurrencyCount > 1 ? 's' : ''} confirmée{otherCurrencyCount > 1 ? 's' : ''} dans une autre devise que {currency}
                    {otherCurrencyCount > 1 ? ' ne sont' : ' n’est'} pas incluse{otherCurrencyCount > 1 ? 's' : ''} dans ces totaux.
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Recettes" value={formatAmount(totals.revenues, currency)} description="Total enregistré" icon={ArrowUpRight} tone="green" series={monthlySeries.revenues} trend={trendOf(monthlySeries.revenues, monthlySeries.labels)} color="#10b981" />
                <StatCard label="Dépenses" value={formatAmount(totals.expenses, currency)} description="Total enregistré" icon={ArrowDownRight} tone="red" series={monthlySeries.expenses} trend={{ ...trendOf(monthlySeries.expenses, monthlySeries.labels), inverse: true }} color="#ef4444" />
                <StatCard label="Solde" value={formatAmount(totals.balance, currency)} description="Recettes moins dépenses" icon={WalletCards} tone="dark" series={monthlySeries.balance} trend={trendOf(monthlySeries.balance, monthlySeries.labels)} color="#0f172a" />
                <StatCard label="Projets actifs" value={numberFormatter.format(totals.activeProjects)} description={`${data.projects.length} projet${data.projects.length > 1 ? 's' : ''} au total`} icon={FolderKanban} tone="blue" />
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <section className="fp-card xl:col-span-2">
                  <div className="fp-card-header">
                    <div>
                      <h2 className="fp-card-title">Évolution financière</h2>
                      <p className="fp-card-description">Recettes, dépenses et solde mois par mois · {currency}</p>
                    </div>
                  </div>
                  <div className="fp-card-body">
                    <FinancialChart revenues={confirmedRevenues} expenses={confirmedExpenses} currency={currency} />
                  </div>
                </section>

                <section className="fp-card">
                  <div className="fp-card-header">
                    <div>
                      <h2 className="fp-card-title">Répartition des dépenses</h2>
                      <p className="fp-card-description">Par projet · dépenses confirmées · {currency}</p>
                    </div>
                  </div>
                  <div className="fp-card-body">
                    <ExpenseBreakdown expenses={confirmedExpenses} currency={currency} />
                  </div>
                </section>

                <section className="fp-card">
                  <div className="fp-card-header">
                    <div>
                      <h2 className="fp-card-title">Suivi des projets</h2>
                      <p className="fp-card-description">Budget consommé · alerte dès 80 %, dépassement au-delà de 100 %</p>
                    </div>
                    <Link to="/projects" className="text-xs font-semibold text-slate-600 hover:text-slate-900">Voir tout</Link>
                  </div>
                  <div className="fp-card-body">
                    {projectSummary.length === 0 ? (
                      <div className="py-8 text-center">
                        <FolderKanban size={24} className="mx-auto text-slate-300" />
                        <p className="mt-2 text-sm text-slate-500">Aucun projet à afficher.</p>
                        <Link to="/projects" className="mt-2 inline-block text-xs font-semibold text-slate-700 hover:underline">Créer un projet</Link>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {projectSummary.map(({ project, budget, spent, rawPercentage, percentage }) => {
                          const barColor = rawPercentage >= 100 ? 'bg-red-500' : rawPercentage >= 80 ? 'bg-amber-500' : 'bg-slate-800'
                          const textColor = rawPercentage >= 100 ? 'text-red-600' : rawPercentage >= 80 ? 'text-amber-600' : 'text-slate-600'

                          return (
                          <div key={project.id}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-700">{project.name}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{STATUS_LABELS[project.status]}</p>
                              </div>
                              <span className={`shrink-0 text-xs font-semibold ${textColor}`}>{rawPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${percentage}%` }} />
                            </div>
                            <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                              <span>{formatAmount(spent, project.currency)}</span>
                              <span>{formatAmount(budget, project.currency)}</span>
                            </div>
                          </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <section className="fp-card mt-6">
                <div className="fp-card-header">
                  <div>
                    <h2 className="fp-card-title">Activité récente</h2>
                    <p className="fp-card-description">Dernières recettes et dépenses enregistrées</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/revenues" className="text-xs font-semibold text-slate-600 hover:text-slate-900">Recettes</Link>
                    <span className="text-slate-300">·</span>
                    <Link to="/expenses" className="text-xs font-semibold text-slate-600 hover:text-slate-900">Dépenses</Link>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentActivity.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <HandCoins size={24} className="mx-auto text-slate-300" />
                      <p className="mt-2 text-sm text-slate-500">Aucune activité récente.</p>
                    </div>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 px-5 py-3.5 sm:gap-4">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${activity.type === 'revenue' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {activity.type === 'revenue' ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-700">{activity.title}</p>
                          <p className="truncate text-xs text-slate-400">{activity.description} · {formatDateTime(activity.date)}</p>
                        </div>
                        <div className={`shrink-0 text-right text-sm font-semibold ${activity.type === 'revenue' ? 'text-emerald-700' : 'text-red-700'}`}>
                          {activity.type === 'revenue' ? '+' : '-'}{formatAmount(activity.amount, activity.currency)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}