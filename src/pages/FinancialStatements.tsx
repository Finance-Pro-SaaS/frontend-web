import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Printer, RefreshCw } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { useOrganization } from '../context/OrganizationContext'
import { fetchFinancialStatement, type FinancialStatement } from '../services/financialStatements'
import { formatDate } from '../utils/date'

const money = (value: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

export default function FinancialStatements() {
  const { currentOrganization } = useOrganization()
  const [searchParams] = useSearchParams()
  const [from, setFrom] = useState(searchParams.get('from') || `${new Date().getFullYear()}-01-01`)
  const [to, setTo] = useState(searchParams.get('to') || new Date().toISOString().slice(0, 10))
  const [statement, setStatement] = useState<FinancialStatement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    if (!currentOrganization) return
    setLoading(true); setError('')
    try { setStatement(await fetchFinancialStatement(currentOrganization.id, from, to)) }
    catch (e: any) { setError(e?.response?.data?.message || "Impossible de charger les états financiers.") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [currentOrganization])

  const currency = statement?.organization.currency || currentOrganization?.default_currency || 'FCFA'

  return <div className="min-h-screen bg-slate-50 print:bg-white">
    <div className="print:hidden"><NavBar /></div>
    <main className="min-h-screen px-4 pb-12 pt-24 print:pt-0 sm:px-6 lg:ml-[var(--finance-sidebar-width)] print:ml-0 lg:px-8 print:px-0">
      <div className="mx-auto max-w-4xl">

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 print:hidden">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Rapports</div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">États financiers SYSCOHADA</h1>
            <p className="mt-1 text-sm text-slate-500">Compte de Résultat et Bilan de Trésorerie \u2014 Système Minimal de Trésorerie.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <label className="text-xs font-medium text-slate-500">Du<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-2.5 py-2 text-sm"/></label>
            <label className="text-xs font-medium text-slate-500">Au<input type="date" value={to} onChange={e => setTo(e.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-2.5 py-2 text-sm"/></label>
            <button onClick={load} disabled={loading} className="flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Actualiser</button>
            <button onClick={() => window.print()} disabled={!statement} className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Printer size={15}/> Imprimer / PDF</button>
          </div>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">{error}</div>}

        {loading && !statement ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 print:hidden">Chargement…</div>
        ) : statement && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">

            {/* En-tête du document */}
            <div className="mb-8 border-b border-slate-200 pb-6 text-center">
              <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">{statement.organization.name}</h2>
              <p className="text-xs text-slate-500">{statement.organization.country}</p>
              <p className="mt-3 text-sm font-semibold text-slate-700">États financiers \u2014 Système Minimal de Trésorerie (SYSCOHADA)</p>
              <p className="text-xs text-slate-500">Période du {formatDate(statement.period.from)} au {formatDate(statement.period.to)}</p>
            </div>

            {/* COMPTE DE RÉSULTAT */}
            <section className="mb-10">
              <h3 className="mb-3 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide text-slate-900">Compte de Résultat</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Charges (Classe 6)</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {statement.compte_de_resultat.charges.map((c) => (
                        <tr key={c.code} className="border-b border-slate-100">
                          <td className="py-1.5 pr-2 text-slate-500">{c.code}</td>
                          <td className="py-1.5 text-slate-700">{c.label}</td>
                          <td className="py-1.5 text-right font-medium text-slate-800">{money(c.amount)}</td>
                        </tr>
                      ))}
                      {statement.compte_de_resultat.charges.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-slate-400">Aucune charge sur la période</td></tr>}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-800 font-bold text-slate-900"><td colSpan={2} className="py-2">Total Charges</td><td className="py-2 text-right">{money(statement.compte_de_resultat.total_charges)}</td></tr>
                    </tfoot>
                  </table>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Produits (Classe 7)</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {statement.compte_de_resultat.produits.map((p) => (
                        <tr key={p.code} className="border-b border-slate-100">
                          <td className="py-1.5 pr-2 text-slate-500">{p.code}</td>
                          <td className="py-1.5 text-slate-700">{p.label}</td>
                          <td className="py-1.5 text-right font-medium text-slate-800">{money(p.amount)}</td>
                        </tr>
                      ))}
                      {statement.compte_de_resultat.produits.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-slate-400">Aucun produit sur la période</td></tr>}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-800 font-bold text-slate-900"><td colSpan={2} className="py-2">Total Produits</td><td className="py-2 text-right">{money(statement.compte_de_resultat.total_produits)}</td></tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className={`mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold ${statement.compte_de_resultat.resultat_net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                <span>RÉSULTAT NET DE LA PÉRIODE</span>
                <span>{money(statement.compte_de_resultat.resultat_net)} {currency}</span>
              </div>
            </section>

            {/* BILAN DE TRÉSORERIE */}
            <section className="mb-10">
              <h3 className="mb-3 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide text-slate-900">Bilan de Trésorerie (poste Trésorerie)</h3>
              <p className="mb-3 text-xs text-slate-500">Situation à la date du {formatDate(statement.bilan_tresorerie.as_of_date)}</p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Comptes bancaires</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {statement.bilan_tresorerie.comptes_bancaires.map((b, i) => (
                        <tr key={i} className="border-b border-slate-100"><td className="py-1.5 text-slate-700">{b.name}</td><td className="py-1.5 text-right font-medium text-slate-800">{money(b.balance)} {b.currency}</td></tr>
                      ))}
                      {statement.bilan_tresorerie.comptes_bancaires.length === 0 && <tr><td colSpan={2} className="py-3 text-center text-slate-400">Aucun compte bancaire</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Caisses</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {statement.bilan_tresorerie.caisses.map((c, i) => (
                        <tr key={i} className="border-b border-slate-100"><td className="py-1.5 text-slate-700">{c.name}</td><td className="py-1.5 text-right font-medium text-slate-800">{money(c.balance)} {c.currency}</td></tr>
                      ))}
                      {statement.bilan_tresorerie.caisses.length === 0 && <tr><td colSpan={2} className="py-3 text-center text-slate-400">Aucune caisse</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                <span>TOTAL TRÉSORERIE DISPONIBLE</span>
                <span>{money(statement.bilan_tresorerie.total_tresorerie)} {currency}</span>
              </div>
            </section>

            {/* Note méthodologique */}
            <p className="border-t border-slate-200 pt-4 text-[11px] leading-relaxed text-slate-400">{statement.methodology_note}</p>
          </div>
        )}
      </div>
    </main>
  </div>
}
