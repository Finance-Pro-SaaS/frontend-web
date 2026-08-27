import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, X } from 'lucide-react'
import { fetchSubscriptionUsage, type SubscriptionUsage } from '../services/subscription'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min : évite de re-solliciter l'API à chaque changement de page

// Cache au niveau du module (pas du composant) : le NavBar est remonté à
// chaque navigation puisqu'il est importé individuellement par chaque page
// plutôt que via un layout partagé. Sans ce cache, chaque clic dans le menu
// déclencherait un nouvel appel /subscription/usage.
const usageCache = new Map<string, { data: SubscriptionUsage; fetchedAt: number }>()

function dismissKey(organizationId: string, planCode: string) {
  return `fp_plan_banner_dismissed_${organizationId}_${planCode}`
}

export function PlanUsageBanner({ organizationId }: { organizationId: string | undefined }) {
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!organizationId) return
    let cancelled = false

    async function load() {
      const cached = usageCache.get(organizationId!)
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        setUsage(cached.data)
        return
      }
      try {
        const data = await fetchSubscriptionUsage(organizationId!)
        usageCache.set(organizationId!, { data, fetchedAt: Date.now() })
        if (!cancelled) setUsage(data)
      } catch {
        // Silencieux : ce bandeau est une aide, pas une fonctionnalité critique.
      }
    }

    load()
    return () => { cancelled = true }
  }, [organizationId])

  // Met à jour la variable CSS qui décale le contenu des pages sous le bandeau.
  useEffect(() => {
    const visible = !!usage?.exceeds_current_plan && !!usage.recommended_plan && !dismissed
    document.documentElement.style.setProperty('--finance-banner-height', visible ? '52px' : '0px')
    return () => { document.documentElement.style.setProperty('--finance-banner-height', '0px') }
  }, [usage, dismissed])

  if (!usage?.exceeds_current_plan || !usage.recommended_plan || !organizationId || dismissed) return null

  const { recommended_plan: plan } = usage

  function handleDismiss() {
    sessionStorage.setItem(dismissKey(organizationId!, plan!.code), '1')
    setDismissed(true)
  }

  if (sessionStorage.getItem(dismissKey(organizationId, plan.code))) return null

  return (
    <div
      className="fixed right-0 top-16 z-30 flex h-[52px] items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 sm:px-6 lg:left-[var(--finance-sidebar-width)]"
      style={{ left: 0 }}
    >
      <TrendingUp size={18} className="shrink-0 text-amber-700" />
      <p className="min-w-0 flex-1 truncate text-sm text-amber-800">
        <span className="font-semibold">Votre organisation dépasse le palier {usage.current_plan.label}.</span>{' '}
        Passez au palier {plan.label} ({plan.monthly_amount.toLocaleString('fr-FR')} {plan.currency}/mois) pour continuer à ajouter des projets, comptes ou utilisateurs sans limite.
      </p>
      <button
        type="button"
        onClick={() => navigate('/billing')}
        className="shrink-0 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900"
      >
        Voir les paliers
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fermer"
        className="shrink-0 rounded-lg p-1.5 text-amber-700 hover:bg-amber-100"
      >
        <X size={16} />
      </button>
    </div>
  )
}
