import { useEffect, useState } from 'react'
import { Scale } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { useOrganization } from '../context/OrganizationContext'
import { fetchTrialBalance, type TrialBalance } from '../services/accountingReports'

const money = (value: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
const firstDayOfYear = () => `${new Date().getFullYear()}-01-01`
const today = () => new Date().toISOString().slice(0, 10)

export default function Balance() {
  const { currentOrganization } = useOrganization()
  const [from, setFrom] = useState(firstDayOfYear())
  const [to, setTo] = useState(today())
  const [balance, setBalance] = useState<TrialBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load() {
    if (!currentOrganization) return
    setLoading(true)
    setError(null)
    fetchTrialBalance(currentOrganization.id, from, to)
      .then(setBalance)
      .catch(() => setError('Impossible de charger la balance.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [currentOrganization?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Scale size={22} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Balance générale</h1>
            <p className="text-sm text-slate-500">Total débit / crédit par compte sur la période, en partie double.</p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div><label className="block text-xs font-medium text-slate-500">Du</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-slate-500">Au</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
          <button onClick={load} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Actualiser</button>
          {balance && (
            <span className={`ml-auto rounded-full px-3 py-1.5 text-xs font-semibold ${balance.is_balanced ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {balance.is_balanced ? '✓ Équilibrée' : '⚠ Déséquilibrée — signalez ce cas'}
            </span>
          )}
        </div>

        {loading && <p className="text-sm text-slate-500">Chargement...</p>}
        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        {balance && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr><th className="px-4 py-3">Compte</th><th className="px-4 py-3 text-right">Débit</th><th className="px-4 py-3 text-right">Crédit</th><th className="px-4 py-3 text-right">Solde</th></tr>
                </thead>
                <tbody>
                  {balance.accounts.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">Aucun mouvement sur cette période.</td></tr>}
                  {balance.accounts.map((row) => (
                    <tr key={row.account_id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.code} — {row.name}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{money(row.total_debit)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{money(row.total_credit)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{money(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{money(balance.total_debit)}</td>
                    <td className="px-4 py-3 text-right">{money(balance.total_credit)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
