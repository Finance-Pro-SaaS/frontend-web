import { useEffect, useState, type FormEvent } from 'react'
import { Calculator, Plus } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { useOrganization } from '../context/OrganizationContext'
import { fetchAccounts, createAccount, updateAccount, type Account } from '../services/accounts'

const CLASS_LABELS: Record<number, string> = {
  1: 'Classe 1 — Fonds propres',
  4: 'Classe 4 — Tiers',
  5: 'Classe 5 — Trésorerie',
  6: 'Classe 6 — Charges',
  7: 'Classe 7 — Produits',
}

export default function AccountingChartOfAccounts() {
  const { currentOrganization } = useOrganization()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', class: 6, normal_balance: 'debit' as 'debit' | 'credit' })

  function load() {
    if (!currentOrganization) return
    setLoading(true)
    fetchAccounts(currentOrganization.id).then(setAccounts).finally(() => setLoading(false))
  }
  useEffect(load, [currentOrganization?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentOrganization) return
    setSaving(true)
    setError(null)
    try {
      await createAccount(currentOrganization.id, form)
      setForm({ code: '', name: '', class: 6, normal_balance: 'debit' })
      setShowForm(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.errors?.code?.[0] ?? "Impossible de créer ce compte.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(account: Account) {
    if (!currentOrganization || !account.organization_id) return
    await updateAccount(currentOrganization.id, account.id, { is_active: !account.is_active })
    load()
  }

  const byClass = accounts.reduce<Record<number, Account[]>>((acc, a) => {
    (acc[a.class] ??= []).push(a)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Calculator size={22} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Plan comptable (partie double)</h1>
              <p className="text-sm text-slate-500">Comptes SYCEBNL standard + comptes propres à votre organisation.</p>
            </div>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><Plus size={16} />Ajouter un compte</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div><label className="block text-xs font-medium text-slate-500">Code</label><input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="ex: 6581" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500">Nom</label><input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-slate-500">Classe</label>
                <select value={form.class} onChange={(e) => setForm((f) => ({ ...f, class: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {Object.entries(CLASS_LABELS).map(([n, label]) => <option key={n} value={n}>{label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-500">Sens normal</label>
                <select value={form.normal_balance} onChange={(e) => setForm((f) => ({ ...f, normal_balance: e.target.value as 'debit' | 'credit' }))} className="mt-1 w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="debit">Débit (actif, charges)</option>
                  <option value="credit">Crédit (passif, capitaux propres, produits)</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Création...' : 'Créer le compte'}</button>
          </form>
        )}

        {loading && <p className="text-sm text-slate-500">Chargement...</p>}

        {!loading && Object.entries(byClass).sort(([a], [b]) => Number(a) - Number(b)).map(([cls, list]) => (
          <div key={cls} className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700">{CLASS_LABELS[Number(cls)] ?? `Classe ${cls}`}</div>
            <ul className="divide-y divide-slate-100">
              {list.sort((a, b) => a.code.localeCompare(b.code)).map((a) => (
                <li key={a.id} className={`flex items-center justify-between px-5 py-3 text-sm ${!a.is_active ? 'opacity-40' : ''}`}>
                  <div><span className="font-medium text-slate-900">{a.code}</span> <span className="text-slate-600">— {a.name}</span></div>
                  <div className="flex items-center gap-3">
                    {!a.organization_id && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Plan standard</span>}
                    {a.organization_id && (
                      <button onClick={() => toggleActive(a)} className={`text-xs font-medium ${a.is_active ? 'text-red-600' : 'text-emerald-600'}`}>
                        {a.is_active ? 'Désactiver' : 'Réactiver'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </main>
    </div>
  )
}
