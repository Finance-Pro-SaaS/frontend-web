import { useEffect, useState, type FormEvent } from 'react'
import { NavBar } from '../components/NavBar'
import { useOrganization } from '../context/OrganizationContext'
import { updateOrganization, type OrganizationDetail } from '../services/organizations'
import { OHADA_COUNTRIES, findCountryByName } from '../data/ohadaCountries'

// XOF/XAF (zones UEMOA/CEMAC) + les 3 monnaies nationales des autres pays
// OHADA, plus EUR/USD pour les organisations qui reçoivent des financements
// internationaux libellés dans ces devises (une ONG basée au Bénin peut très
// bien vouloir suivre ses comptes en EUR si son principal bailleur finance
// en euros) — la devise proposée par défaut suit le pays, mais reste modifiable.
const CURRENCIES = ['XOF', 'XAF', 'GNF', 'KMF', 'CDF', 'EUR', 'USD']

export default function OrganizationSettings() {
  const { currentOrganization, refresh, loading } = useOrganization()
  const [form, setForm] = useState<Partial<OrganizationDetail>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (currentOrganization) setForm(currentOrganization) }, [currentOrganization])
  function update<K extends keyof OrganizationDetail>(field: K) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [field]: e.target.value })) }
  function updateCountry(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value
    const country = findCountryByName(name)
    // La devise suit le pays choisi par défaut (voir note CURRENCIES
    // ci-dessus) mais reste un champ à part entière : l'utilisateur peut la
    // changer juste après s'il le souhaite, ce n'est pas verrouillé.
    setForm((f) => ({ ...f, country: name, default_currency: country?.currency ?? f.default_currency }))
  }
  async function handleSubmit(e: FormEvent) { e.preventDefault(); if (!currentOrganization) return; setSaving(true); setError(null); setMessage(null); try { await updateOrganization(currentOrganization.id, form); await refresh(); setMessage('Organisation mise à jour.') } catch (err:any) { setError(err.response?.data?.message ?? "Impossible de modifier l'organisation.") } finally { setSaving(false) } }
  return <div className="min-h-screen bg-slate-50"><NavBar/><main className="min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:ml-[var(--finance-sidebar-width)] lg:px-8"><div className="mx-auto max-w-4xl"><header className="mb-7"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">ORGANISATION</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Organisation</h1><p className="mt-1 text-sm text-slate-500">Gérez l'identité, les informations administratives et la devise de votre organisation.</p></header>{loading?<div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Chargement...</div>:<form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5 sm:px-7"><h2 className="font-semibold text-slate-900">Informations générales</h2><p className="mt-1 text-xs text-slate-500">Ces informations sont utilisées dans l'espace de gestion et les rapports.</p></div><div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7"><label className="text-sm font-medium text-slate-700 sm:col-span-2">Nom<input value={form.name??''} onChange={update('name')} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"/></label><label className="text-sm font-medium text-slate-700">Sigle<input value={form.acronym??''} onChange={update('acronym')} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/></label><label className="text-sm font-medium text-slate-700">Statut juridique<input value={form.legal_status??''} onChange={update('legal_status')} placeholder="ONG, Association..." className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Numéro d'enregistrement<input value={form.registration_number??''} onChange={update('registration_number')} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/></label><label className="text-sm font-medium text-slate-700">Pays<select value={form.country??'Bénin'} onChange={updateCountry} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">{OHADA_COUNTRIES.map(c=><option key={c.name} value={c.name}>{(c.iso)} {c.name}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Ville<input value={form.city??''} onChange={update('city')} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Devise par défaut<select value={form.default_currency??'XOF'} onChange={update('default_currency')} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</select></label></div>{(message||error)&&<div className="px-5 pb-2 sm:px-7">{message&&<div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}{error&&<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}</div>}<div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-5 sm:flex-row sm:justify-end sm:px-7"><button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving?'Enregistrement...':'Enregistrer les modifications'}</button></div></form>}</div></main></div>
}
