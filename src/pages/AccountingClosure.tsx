import { useEffect, useState } from 'react'
import { Lock, LockOpen, ShieldAlert } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { useOrganization } from '../context/OrganizationContext'
import { fetchAccountingClosure, updateAccountingClosure } from '../services/accountingClosure'

export default function AccountingClosure() {
  const { currentOrganization } = useOrganization()
  const [closedUntil, setClosedUntil] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function load() {
    if (!currentOrganization) return
    setLoading(true)
    fetchAccountingClosure(currentOrganization.id)
      .then((res) => setClosedUntil(res.accounting_closed_until))
      .catch(() => setError('Impossible de charger le statut de clôture.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [currentOrganization?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleClose() {
    if (!currentOrganization || !newDate) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await updateAccountingClosure(currentOrganization.id, newDate)
      setClosedUntil(res.accounting_closed_until)
      setNewDate('')
      setMessage(`Période clôturée jusqu'au ${res.accounting_closed_until}. Plus aucune dépense, recette ou écriture ne peut être comptabilisée à cette date ou avant.`)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de clôturer cette période.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReopen() {
    if (!currentOrganization) return
    if (!confirm("Rouvrir la période clôturée ? Les dépenses, recettes et écritures redeviennent modifiables sur toute la période concernée. Cette action est tracée dans le journal d'audit.")) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await updateAccountingClosure(currentOrganization.id, null)
      setClosedUntil(null)
      setMessage('Période rouverte.')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de rouvrir la période.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><Lock size={22} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Clôture comptable</h1>
            <p className="text-sm text-slate-500">Verrouille une période passée : aucune dépense, recette ou écriture ne peut plus y être comptabilisée.</p>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-500">Chargement...</p>}
        {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}

        {!loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              {closedUntil ? <Lock className="text-red-500" size={20} /> : <LockOpen className="text-emerald-500" size={20} />}
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {closedUntil ? `Comptabilité clôturée jusqu'au ${closedUntil}` : 'Aucune période clôturée actuellement'}
                </div>
                <div className="text-xs text-slate-500">
                  {closedUntil ? "Toute date antérieure ou égale à cette clôture est verrouillée." : 'Toutes les périodes sont ouvertes à la comptabilisation.'}
                </div>
              </div>
            </div>

            {closedUntil ? (
              <button onClick={handleReopen} disabled={saving} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                <LockOpen size={16} />{saving ? 'Réouverture...' : 'Rouvrir la période'}
              </button>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Clôturer jusqu'à cette date incluse</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <button onClick={handleClose} disabled={saving || !newDate} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                    <Lock size={16} />{saving ? 'Clôture...' : 'Clôturer'}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <span>Seule la comptabilisation (passage au statut « payé »/« encaissé », écritures manuelles) est bloquée. La création ou modification d'une dépense encore en brouillon ou en attente d'approbation reste possible, quelle que soit sa date.</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
