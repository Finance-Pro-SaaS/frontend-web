import { useEffect, useState, type FormEvent } from 'react'
import { Bell, CheckCircle2, Info, Send, Trash2, TriangleAlert } from 'lucide-react'
import {
  createPlatformNotification,
  deletePlatformNotification,
  fetchPlatformNotifications,
  togglePlatformNotification,
  type PlatformNotification,
} from '../../services/superAdmin'
import SuperAdminLayout from './SuperAdminLayout'

const TYPE_OPTIONS: { value: PlatformNotification['type']; label: string }[] = [
  { value: 'info', label: 'Information' },
  { value: 'success', label: 'Bonne nouvelle' },
  { value: 'warning', label: 'Avertissement' },
  { value: 'urgent', label: 'Urgent' },
]

const TYPE_STYLES: Record<PlatformNotification['type'], { badge: string; icon: typeof Info }> = {
  info: { badge: 'bg-blue-50 text-blue-700 ring-blue-200', icon: Info },
  success: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  warning: { badge: 'bg-amber-50 text-amber-700 ring-amber-200', icon: TriangleAlert },
  urgent: { badge: 'bg-red-50 text-red-700 ring-red-200', icon: TriangleAlert },
}

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function SuperAdminNotifications() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<PlatformNotification['type']>('info')
  const [sending, setSending] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setNotifications(await fetchPlatformNotifications())
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Impossible de charger les notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    setSending(true)
    setError(null)
    try {
      await createPlatformNotification({ title: title.trim(), message: message.trim(), type })
      setTitle(''); setMessage(''); setType('info')
      await load()
    } catch (err: any) {
      const validation = err.response?.data?.errors
      const firstError = validation ? Object.values(validation).flat()[0] : null
      setError((firstError as string) ?? err.response?.data?.message ?? 'Envoi impossible.')
    } finally {
      setSending(false)
    }
  }

  async function handleToggle(notification: PlatformNotification) {
    setBusyId(notification.id)
    setError(null)
    try {
      await togglePlatformNotification(notification.id, !notification.is_active)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Action impossible.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(notification: PlatformNotification) {
    if (!window.confirm(`Supprimer définitivement la notification « ${notification.title} » ?`)) return
    setBusyId(notification.id)
    setError(null)
    try {
      await deletePlatformNotification(notification.id)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Suppression impossible.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SuperAdminLayout title="Notifications">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Notifications diffusées</h2>
        <p className="mt-1 text-sm text-slate-500">
          Envoyez un message qui s'affichera en bandeau sur le tableau de bord de toutes les organisations
          (maintenance planifiée, nouveauté, information générale...).
        </p>
      </div>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Nouvelle notification</h3>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Titre</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} className={inputClass} placeholder="Ex. : Maintenance planifiée" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Message</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={1000} rows={3} className={inputClass} placeholder="Détaillez le contenu du message visible par les organisations..." />
          </label>

          <label className="block max-w-xs">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as PlatformNotification['type'])} className={inputClass}>
              {TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>

          <div className="flex justify-end">
            <button type="submit" disabled={sending} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              <Send className="h-4 w-4" /> {sending ? 'Envoi...' : 'Diffuser la notification'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Historique</h3>
        </div>

        {loading ? (
          <div className="flex min-h-32 items-center justify-center p-6 text-sm text-slate-500">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 p-8 text-center">
            <Bell className="h-6 w-6 text-slate-300" />
            <p className="text-sm text-slate-500">Aucune notification envoyée pour le moment.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const style = TYPE_STYLES[notification.type]
              const Icon = style.icon
              return (
                <li key={notification.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${style.badge}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{notification.title}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${style.badge}`}>
                          {TYPE_OPTIONS.find((o) => o.value === notification.type)?.label}
                        </span>
                        {!notification.is_active && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                            Désactivée
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        Envoyée le {formatDateTime(notification.created_at)}
                        {notification.creator ? ` par ${notification.creator.full_name}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 sm:pl-4">
                    <button
                      disabled={busyId === notification.id}
                      onClick={() => handleToggle(notification)}
                      className="text-xs font-semibold text-slate-700 transition hover:text-slate-950 hover:underline disabled:opacity-50"
                    >
                      {notification.is_active ? 'Désactiver' : 'Réactiver'}
                    </button>
                    <button
                      disabled={busyId === notification.id}
                      onClick={() => handleDelete(notification)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition hover:text-red-800 hover:underline disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </SuperAdminLayout>
  )
}
