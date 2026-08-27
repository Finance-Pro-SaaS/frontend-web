import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { useOrganization } from '../context/OrganizationContext'
import {
  createActivity,
  deleteActivity,
  fetchActivities,
  updateActivity,
  type Activity,
  type ActivityPayload,
  type ActivityStatus,
} from '../services/activities'

const STATUS_LABELS: Record<ActivityStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const EMPTY_FORM: ActivityPayload = {
  code: '',
  name: '',
  description: '',
  status: 'planned',
  start_date: null,
  end_date: null,
}

export default function ProjectActivities() {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentOrganization } = useOrganization()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ActivityPayload>(EMPTY_FORM)

  async function load() {
    if (!currentOrganization || !projectId) return
    setLoading(true)
    setError(null)
    try {
      setActivities(await fetchActivities(currentOrganization.id, projectId))
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Impossible de charger les activités.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [currentOrganization?.id, projectId])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(activity: Activity) {
    setForm({
      code: activity.code,
      name: activity.name,
      description: activity.description ?? '',
      status: activity.status,
      start_date: activity.start_date,
      end_date: activity.end_date,
    })
    setEditingId(activity.id)
    setShowForm(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!currentOrganization || !projectId) return
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        await updateActivity(currentOrganization.id, projectId, editingId, form)
      } else {
        await createActivity(currentOrganization.id, projectId, form)
      }
      setShowForm(false)
      await load()
    } catch (err: any) {
      const messages = err.response?.data?.errors
      setError(messages ? Object.values(messages).flat().join(' ') : "Impossible d'enregistrer l'activité.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(activity: Activity) {
    if (!currentOrganization || !projectId) return
    if (!confirm(`Supprimer l'activité « ${activity.name} » ?`)) return
    try {
      await deleteActivity(currentOrganization.id, projectId, activity.id)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Suppression impossible.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/projects" className="text-sm text-slate-500 hover:text-slate-900">← Projets</Link>
            <h1 className="text-2xl font-semibold text-slate-900 mt-1">Activités du projet</h1>
          </div>
          <button onClick={openCreate} className="bg-slate-900 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-slate-800">
            + Nouvelle activité
          </button>
        </div>

        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="font-medium text-slate-900">{editingId ? 'Modifier l’activité' : 'Nouvelle activité'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ACT-001" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ActivityStatus }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Début</label>
                <input type="date" value={form.start_date ?? ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value || null }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fin</label>
                <input type="date" value={form.end_date ?? ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value || null }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-slate-900 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-slate-800 disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-900">Annuler</button>
            </div>
          </form>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? <p className="p-5 text-slate-500 text-sm">Chargement...</p> : activities.length === 0 ? <p className="p-5 text-slate-400 text-sm">Aucune activité pour ce projet.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr><th className="px-4 py-2 font-medium">Code</th><th className="px-4 py-2 font-medium">Activité</th><th className="px-4 py-2 font-medium">Période</th><th className="px-4 py-2 font-medium">Statut</th><th className="px-4 py-2" /></tr>
              </thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{activity.code}</td>
                    <td className="px-4 py-3"><div className="font-medium text-slate-900">{activity.name}</div>{activity.description && <div className="text-xs text-slate-500 mt-0.5">{activity.description}</div>}</td>
                    <td className="px-4 py-3 text-slate-600">{activity.start_date ?? '—'} → {activity.end_date ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{STATUS_LABELS[activity.status]}</td>
                    <td className="px-4 py-3 text-right space-x-3"><button onClick={() => openEdit(activity)} className="text-xs text-slate-600 hover:underline">Modifier</button><button onClick={() => handleDelete(activity)} className="text-xs text-red-600 hover:underline">Supprimer</button></td>
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
