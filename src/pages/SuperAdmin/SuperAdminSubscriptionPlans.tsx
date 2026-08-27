import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deactivateSubscriptionPlan,
  type AdminSubscriptionPlan,
  type SubscriptionPlanInput,
} from '../../services/subscriptionPlansAdmin'

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none'

type FormState = {
  id: string | null
  code: string
  label: string
  description: string
  monthly_amount: string
  max_active_projects: string // vide = illimité
  max_users: string
  max_accounts: string
}

const EMPTY_FORM: FormState = {
  id: null, code: '', label: '', description: '', monthly_amount: '',
  max_active_projects: '', max_users: '', max_accounts: '',
}

export default function SuperAdminSubscriptionPlans() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null) // null = formulaire fermé
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true); setError(null)
    try { setPlans(await fetchSubscriptionPlans()) }
    catch (err: any) { setError(err.response?.data?.message ?? 'Impossible de charger les paliers.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openEdit(plan: AdminSubscriptionPlan) {
    setMessage(null); setError(null)
    setForm({
      id: plan.id,
      code: plan.code,
      label: plan.label,
      description: plan.description ?? '',
      monthly_amount: String(Number(plan.monthly_amount)),
      max_active_projects: plan.max_active_projects === null ? '' : String(plan.max_active_projects),
      max_users: plan.max_users === null ? '' : String(plan.max_users),
      max_accounts: plan.max_accounts === null ? '' : String(plan.max_accounts),
    })
  }

  function openCreate() {
    setMessage(null); setError(null)
    setForm({ ...EMPTY_FORM })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true); setError(null)

    const payload: SubscriptionPlanInput = {
      label: form.label,
      description: form.description || null,
      monthly_amount: Number(form.monthly_amount),
      // Champ vide = illimité (null) ; sinon on convertit en nombre.
      max_active_projects: form.max_active_projects === '' ? null : Number(form.max_active_projects),
      max_users: form.max_users === '' ? null : Number(form.max_users),
      max_accounts: form.max_accounts === '' ? null : Number(form.max_accounts),
    }
    if (!form.id) payload.code = form.code

    try {
      if (form.id) await updateSubscriptionPlan(form.id, payload)
      else await createSubscriptionPlan(payload)
      setMessage(form.id ? 'Palier mis à jour.' : 'Palier créé.')
      setForm(null)
      await load()
    } catch (err: any) {
      const validation = err.response?.data?.errors
      const firstError = validation ? Object.values(validation).flat()[0] : null
      setError((firstError as string) ?? err.response?.data?.message ?? 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(plan: AdminSubscriptionPlan) {
    if (!confirm(`Désactiver le palier "${plan.label}" ? Il ne sera plus proposé aux organisations (celles déjà dessus ne sont pas affectées).`)) return
    setError(null); setMessage(null)
    try {
      await deactivateSubscriptionPlan(plan.id)
      setMessage('Palier désactivé.')
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Désactivation impossible.')
    }
  }

  const limitLabel = (value: number | null) => (value === null ? 'Illimité' : value)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Espace plateforme</p>
            <h1 className="text-lg font-semibold text-white">Paliers d'abonnement</h1>
          </div>
          <button onClick={() => navigate('/super-admin')} className="text-sm text-slate-400 hover:text-white">Retour au tableau de bord</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Les prix et seuils définis ici s'appliquent immédiatement à toutes les organisations : le bandeau d'alerte
            et la page Facturation lisent ces valeurs en temps réel.
          </p>
          <button onClick={openCreate} className="shrink-0 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            Nouveau palier
          </button>
        </div>

        {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
        {error && !form && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {form && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">{form.id ? 'Modifier le palier' : 'Nouveau palier'}</h2>
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              {!form.id && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Code (identifiant technique, non modifiable ensuite)</label>
                  <input required pattern="[a-z0-9_-]+" title="Lettres minuscules, chiffres, tirets uniquement" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} placeholder="ex. premium" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nom affiché</label>
                <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputClass} placeholder="ex. Standard" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Description (affichée aux organisations)</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="ex. Pour une organisation avec plusieurs projets" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Prix mensuel (FCFA)</label>
                <input required type="number" min="0" step="1" value={form.monthly_amount} onChange={(e) => setForm({ ...form, monthly_amount: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Projets actifs max. (vide = illimité)</label>
                <input type="number" min="1" value={form.max_active_projects} onChange={(e) => setForm({ ...form, max_active_projects: e.target.value })} className={inputClass} placeholder="Illimité" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Utilisateurs max. (vide = illimité)</label>
                <input type="number" min="1" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} className={inputClass} placeholder="Illimité" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Comptes banque + caisse max. (vide = illimité)</label>
                <input type="number" min="1" value={form.max_accounts} onChange={(e) => setForm({ ...form, max_accounts: e.target.value })} className={inputClass} placeholder="Illimité" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700">Annuler</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Chargement...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Palier</th>
                  <th className="px-4 py-3">Prix / mois</th>
                  <th className="px-4 py-3">Projets</th>
                  <th className="px-4 py-3">Utilisateurs</th>
                  <th className="px-4 py-3">Comptes</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{plan.label}</div>
                      <div className="text-xs text-slate-400">{plan.code}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{Number(plan.monthly_amount).toLocaleString('fr-FR')} {plan.currency}</td>
                    <td className="px-4 py-3 text-slate-600">{limitLabel(plan.max_active_projects)}</td>
                    <td className="px-4 py-3 text-slate-600">{limitLabel(plan.max_users)}</td>
                    <td className="px-4 py-3 text-slate-600">{limitLabel(plan.max_accounts)}</td>
                    <td className="px-4 py-3">
                      {plan.is_active
                        ? <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Actif</span>
                        : <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">Désactivé</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => openEdit(plan)} className="text-xs font-medium text-slate-700 hover:underline">Modifier</button>
                        {plan.is_active && <button onClick={() => handleDeactivate(plan)} className="text-xs font-medium text-red-600 hover:underline">Désactiver</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
