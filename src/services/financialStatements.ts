import { api } from './api'

export interface FinancialStatementLine {
  code: string
  label: string
  amount: number
}

export interface FinancialStatement {
  organization: { name: string; country: string; currency: string }
  period: { from: string; to: string }
  compte_de_resultat: {
    charges: FinancialStatementLine[]
    total_charges: number
    produits: FinancialStatementLine[]
    total_produits: number
    resultat_net: number
  }
  bilan_tresorerie: {
    as_of_date: string
    comptes_bancaires: Array<{ name: string; balance: number; currency: string }>
    caisses: Array<{ name: string; balance: number; currency: string }>
    total_tresorerie: number
  }
  methodology_note: string
}

export async function fetchFinancialStatement(organizationId: string, from: string, to: string) {
  const { data } = await api.get(`/organizations/${organizationId}/financial-statements`, {
    params: { from, to },
  })
  return data.data as FinancialStatement
}
