import { useEffect, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { fetchActiveNotifications, type PlatformNotificationItem } from '../services/notifications'

const DISMISSED_KEY = 'ong_finance_pro_dismissed_notifications'

const STYLES: Record<PlatformNotificationItem['type'], { wrap: string; icon: typeof Info; iconColor: string }> = {
  info: { wrap: 'border-blue-200 bg-blue-50 text-blue-800', icon: Info, iconColor: 'text-blue-600' },
  success: { wrap: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2, iconColor: 'text-emerald-600' },
  warning: { wrap: 'border-amber-200 bg-amber-50 text-amber-800', icon: TriangleAlert, iconColor: 'text-amber-600' },
  urgent: { wrap: 'border-red-200 bg-red-50 text-red-800', icon: TriangleAlert, iconColor: 'text-red-600' },
}

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]')
  } catch {
    return []
  }
}

function persistDismissed(ids: string[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids))
}

/**
 * Bandeau affichant les annonces de la plateforme (maintenance, nouveautés,
 * informations générales...) envoyées par le Super Admin. Chaque
 * notification peut être fermée individuellement ; une fois fermée elle ne
 * réapparaît plus sur cet appareil, sauf si le Super Admin en envoie une
 * nouvelle.
 */
export function NotificationsBanner() {
  const [notifications, setNotifications] = useState<PlatformNotificationItem[]>([])
  const [dismissed, setDismissed] = useState<string[]>(readDismissed())

  useEffect(() => {
    let cancelled = false
    fetchActiveNotifications()
      .then((data) => { if (!cancelled) setNotifications(data) })
      .catch(() => {
        // Silencieux : ce bandeau est informatif, pas critique pour l'usage du dashboard.
      })
    return () => { cancelled = true }
  }, [])

  function handleDismiss(id: string) {
    const next = [...dismissed, id]
    setDismissed(next)
    persistDismissed(next)
  }

  const visible = notifications.filter((n) => !dismissed.includes(n.id))

  if (visible.length === 0) return null

  return (
    <div className="mb-6 space-y-3">
      {visible.map((notification) => {
        const style = STYLES[notification.type]
        const Icon = style.icon
        return (
          <div key={notification.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${style.wrap}`}>
            <Icon size={18} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{notification.title}</p>
              <p className="mt-0.5 opacity-90">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(notification.id)}
              aria-label="Fermer cette notification"
              className="shrink-0 rounded-lg p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
