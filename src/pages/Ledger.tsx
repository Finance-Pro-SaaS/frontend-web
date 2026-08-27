import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { useOrganization } from '../context/OrganizationContext'
import { fetchAccounts, type Account } from '../services/accounts'
import { fetchAccountLedger, type AccountLedger } from '../services/accountingReports'

const money = (value: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
const firstDayOfYear = () => `${new Date().getFullYear()}-01-01`
const today = () => new Date().toISOString().slice(0, 10)

export default function Ledger() {
  const { currentOrganization } = useOrganization()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountId, setAccountId] = useState('')
  const [from, setFrom] = useState(firstDayOfYear())
  const [to, setTo] = useState(today())
  const [ledger, setLedger] = useState<AccountLedger | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentOrganization) return
    fetchAccounts(currentOrganization.id).then((list) => {
      setAccounts(list)
      if (!accountId && list.length > 0) setAccountId(list.find((a) => a.code === '512')?.id ?? list[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id])

  function load() {
    if (!currentOrganization || !accountId) return
    setLoading(true)
    setError(null)
    fetchAccountLedger(currentOrganization.id, accountId, from, to)
      .then(setLedger)
      .catch(() => setError('Impossible de charger le Grand Livre pour ce compte.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [accountId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BookOpen size={22} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Grand Livre</h1>
            <p className="text-sm text-slate-500">Détail des mouvements d'un compte, avec solde progressif.</p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="min-w-[260px] flex-1">
            <label className="block text-xs font-medium text-slate-500">Compte</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-slate-500">Du</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-slate-500">Au</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
          <button onClick={load} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Actualiser</button>
        </div>

        {loading && <p className="text-sm text-slate-500">Chargement...</p>}
        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        {ledger && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">{ledger.account.code} — {ledger.account.name}</div>
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Libellé</th><th className="px-4 py-3 text-right">Débit</th><th className="px-4 py-3 text-right">Crédit</th><th className="px-4 py-3 text-right">Solde</th></tr>
                </thead>
                <tbody>
                  {ledger.movements.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">Aucun mouvement sur cette période.</td></tr>}
                  {ledger.movements.map((m, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-600">{m.date}</td>
                      <td className="px-4 py-3 text-slate-700">{m.description ?? m.label ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{m.debit ? money(m.debit) : ''}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{m.credit ? money(m.credit) : ''}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{money(m.running_balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold"><td colSpan={4} className="px-4 py-3">Solde final</td><td className="px-4 py-3 text-right">{money(ledger.closing_balance)}</td></tr></tfoot>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
