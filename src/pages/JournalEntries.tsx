import { useEffect, useState, type FormEvent } from 'react'
import { FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { useOrganization } from '../context/OrganizationContext'
import { fetchAccounts, type Account } from '../services/accounts'
import { fetchJournalEntries, createJournalEntry, type JournalEntry, type NewJournalEntryLine } from '../services/journalEntries'
import { formatDateTime } from '../utils/date'

const money = (value: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

type DraftLine = { account_id: string; side: 'debit' | 'credit'; amount: string; label: string }
const emptyLine = (): DraftLine => ({ account_id: '', side: 'debit', amount: '', label: '' })

export default function JournalEntries() {
  const { currentOrganization } = useOrganization()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(), emptyLine()])

  function load() {
    if (!currentOrganization) return
    setLoading(true)
    Promise.all([fetchAccounts(currentOrganization.id), fetchJournalEntries(currentOrganization.id)])
      .then(([acc, res]) => { setAccounts(acc); setEntries(res.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [currentOrganization?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalDebit = lines.reduce((sum, l) => sum + (l.side === 'debit' ? Number(l.amount || 0) : 0), 0)
  const totalCredit = lines.reduce((sum, l) => sum + (l.side === 'credit' ? Number(l.amount || 0) : 0), 0)
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentOrganization || !isBalanced) return
    setSaving(true)
    setError(null)
    try {
      const payload: NewJournalEntryLine[] = lines
        .filter((l) => l.account_id && Number(l.amount) > 0)
        .map((l) => ({ account_id: l.account_id, [l.side]: Number(l.amount), label: l.label || undefined }))
      await createJournalEntry(currentOrganization.id, { entry_date: entryDate, description, reference: reference || undefined, lines: payload })
      setDescription(''); setReference(''); setLines([emptyLine(), emptyLine()]); setShowForm(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.errors?.lines?.[0] ?? err?.response?.data?.message ?? "Impossible d'enregistrer cette écriture.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><FileSpreadsheet size={22} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Écritures manuelles</h1>
              <p className="text-sm text-slate-500">Journal des opérations diverses (OD) : solde d'ouverture, corrections, régularisations.</p>
            </div>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><Plus size={16} />Nouvelle écriture</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div><label className="block text-xs font-medium text-slate-500">Date</label><input required type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500">Description</label><input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex: Solde d'ouverture caisse siège" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div className="sm:col-span-3"><label className="block text-xs font-medium text-slate-500">Référence <span className="font-normal text-slate-400">(optionnel)</span></label><input value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-medium text-slate-500">Lignes</label>
              {lines.map((line, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2">
                  <select value={line.account_id} onChange={(e) => updateLine(i, { account_id: e.target.value })} className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                    <option value="">Sélectionner un compte...</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                  </select>
                  <select value={line.side} onChange={(e) => updateLine(i, { side: e.target.value as 'debit' | 'credit' })} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                    <option value="debit">Débit</option>
                    <option value="credit">Crédit</option>
                  </select>
                  <input type="number" min="0" step="0.01" value={line.amount} onChange={(e) => updateLine(i, { amount: e.target.value })} placeholder="Montant" className="w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                  <input value={line.label} onChange={(e) => updateLine(i, { label: e.target.value })} placeholder="Libellé (optionnel)" className="w-40 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                  {lines.length > 2 && <button type="button" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={16} /></button>}
                </div>
              ))}
              <button type="button" onClick={() => setLines((prev) => [...prev, emptyLine()])} className="text-xs font-medium text-blue-600">+ Ajouter une ligne</button>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span>Total débit : <strong>{money(totalDebit)}</strong> — Total crédit : <strong>{money(totalCredit)}</strong></span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{isBalanced ? '✓ Équilibrée' : 'Non équilibrée'}</span>
            </div>

            <button type="submit" disabled={saving || !isBalanced} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{saving ? 'Enregistrement...' : "Enregistrer l'écriture"}</button>
          </form>
        )}

        {loading && <p className="text-sm text-slate-500">Chargement...</p>}

        {!loading && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Journal</th><th className="px-4 py-3">Description</th><th className="px-4 py-3 text-right">Montant</th></tr>
                </thead>
                <tbody>
                  {entries.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">Aucune écriture manuelle pour l'instant.</td></tr>}
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(entry.created_at ?? entry.entry_date)}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{entry.journal.code}</span></td>
                      <td className="px-4 py-3 text-slate-700">{entry.description}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{money(entry.lines.reduce((s, l) => s + Number(l.debit), 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
