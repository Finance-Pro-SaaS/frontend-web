import { useEffect, useState } from 'react'
import { HandCoins } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { useOrganization } from '../context/OrganizationContext'
import { fetchFundsReport, type FundsReport } from '../services/accountingReports'

const money = (value: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

export default function Funds() {
  const { currentOrganization } = useOrganization()
  const [report, setReport] = useState<FundsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentOrganization) return
    setLoading(true)
    setError(null)
    fetchFundsReport(currentOrganization.id)
      .then(setReport)
      .catch(() => setError("Impossible de charger le rapport de fonds."))
      .finally(() => setLoading(false))
  }, [currentOrganization?.id])

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><HandCoins size={22} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Fonds affectés</h1>
            <p className="text-sm text-slate-500">Solde restant par projet : recettes affectées moins dépenses engagées.</p>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-500">Chargement...</p>}
        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        {report && (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fonds propres (recettes non affectées à un projet)</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{money(report.unrestricted_funds.total_received)} {report.currency}</div>
              <p className="mt-2 text-xs text-amber-600">{report.unrestricted_funds.note}</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Projet</th>
                      <th className="px-4 py-3">Bailleur</th>
                      <th className="px-4 py-3 text-right">Reçu</th>
                      <th className="px-4 py-3 text-right">Dépensé</th>
                      <th className="px-4 py-3 text-right">Solde du fonds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.restricted_funds.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">Aucun projet avec des recettes affectées pour l'instant.</td></tr>
                    )}
                    {report.restricted_funds.map((fund) => (
                      <tr key={fund.project_id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{fund.project_name} <span className="text-slate-400">({fund.project_code})</span></td>
                        <td className="px-4 py-3 text-slate-600">{fund.donor?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{money(fund.total_received)} {fund.currency}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{money(fund.total_spent)} {fund.currency}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${fund.balance < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{money(fund.balance)} {fund.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
