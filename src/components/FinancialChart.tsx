import { useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'
import type { Expense } from '../services/expenses'
import type { Revenue } from '../services/revenues'

interface FinancialChartProps {
  revenues: Revenue[]
  expenses: Expense[]
  currency: string
}

interface ChartPoint {
  key: string
  label: string
  fullLabel: string
  revenues: number
  expenses: number
  balance: number
  cumulative: number
}

type Period = 6 | 12
type Mode = 'monthly' | 'cumulative'

const COLORS = {
  revenue: '#10b981',
  expense: '#ef4444',
  balance: '#0f172a',
  cumulative: '#2563eb',
  grid: '#e2e8f0',
  axis: '#94a3b8',
}

const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

function formatAmount(value: number, currency: string) {
  return `${numberFormatter.format(Math.round(value))} ${currency}`
}

function formatCompact(value: number) {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} Md`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace('.0', '')} M`
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)} k`
  return `${value}`
}

function getMonthKey(date: string) {
  return date.slice(0, 7)
}

function buildMonths(count: number): ChartPoint[] {
  const now = new Date()
  const months: ChartPoint[] = []

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const short = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '')
    const capitalized = short.charAt(0).toUpperCase() + short.slice(1)
    const year = String(date.getFullYear()).slice(2)

    months.push({
      key,
      label: count > 6 ? `${capitalized} ${year}` : capitalized,
      fullLabel: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date),
      revenues: 0,
      expenses: 0,
      balance: 0,
      cumulative: 0,
    })
  }

  return months
}

// Type local : compatible avec Recharts 2.x et 3.x (TooltipProps a changé en 3.x).
interface ChartTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
  currency: string
  mode: Mode
}

function ChartTooltip({ active, payload, currency, mode }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload as ChartPoint | undefined
  if (!point) return null

  const rows =
    mode === 'monthly'
      ? [
          { label: 'Recettes', value: point.revenues, color: COLORS.revenue },
          { label: 'Dépenses', value: point.expenses, color: COLORS.expense },
          { label: 'Solde du mois', value: point.balance, color: COLORS.balance },
        ]
      : [{ label: 'Solde cumulé', value: point.cumulative, color: COLORS.cumulative }]

  return (
    <div className="min-w-[200px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold capitalize text-slate-700">{point.fullLabel}</p>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <span className={`font-semibold ${row.value < 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {formatAmount(row.value, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ToggleGroup<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            value === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Trend({
  current,
  previous,
  label,
  inverse = false,
}: {
  current: number
  previous: number
  label: string
  inverse?: boolean
}) {
  if (previous === 0) {
    return <span className="text-[11px] text-slate-400">{label} : {current > 0 ? 'nouveau' : '—'}</span>
  }

  const change = ((current - previous) / Math.abs(previous)) * 100
  const isUp = change >= 0
  const isGood = inverse ? !isUp : isUp
  const Icon = isUp ? TrendingUp : TrendingDown

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>
      <Icon size={12} />
      {isUp ? '+' : ''}
      {change.toFixed(0)}% <span className="font-normal text-slate-400">{label}</span>
    </span>
  )
}

export function FinancialChart({ revenues, expenses, currency }: FinancialChartProps) {
  const [period, setPeriod] = useState<Period>(6)
  const [mode, setMode] = useState<Mode>('monthly')

  const data = useMemo(() => {
    const points = buildMonths(period)
    const byKey = new Map(points.map((point) => [point.key, point]))
    const firstKey = points[0].key
    let opening = 0

    revenues
      .filter((item) => item.currency === currency)
      .forEach((item) => {
        const key = getMonthKey(item.received_date)
        const amount = Number(item.amount)
        const point = byKey.get(key)
        if (point) point.revenues += amount
        else if (key < firstKey) opening += amount
      })

    expenses
      .filter((item) => item.currency === currency)
      .forEach((item) => {
        const key = getMonthKey(item.expense_date)
        const amount = Number(item.amount)
        const point = byKey.get(key)
        if (point) point.expenses += amount
        else if (key < firstKey) opening -= amount
      })

    // Le solde cumulé part du solde réel avant la période affichée.
    let running = opening
    return points.map((point) => {
      const balance = point.revenues - point.expenses
      running += balance
      return { ...point, balance, cumulative: running }
    })
  }, [period, revenues, expenses, currency])

  const totals = useMemo(() => {
    const totalRevenues = data.reduce((sum, point) => sum + point.revenues, 0)
    const totalExpenses = data.reduce((sum, point) => sum + point.expenses, 0)
    return { revenues: totalRevenues, expenses: totalExpenses, balance: totalRevenues - totalExpenses }
  }, [data])

  const last = data[data.length - 1]
  // Le mois en cours est incomplet : la tendance compare les deux derniers mois complets.
  const lastComplete = data[data.length - 2]
  const beforeLast = data[data.length - 3]
  const trendLabel = `${lastComplete.label} vs ${beforeLast.label}`
  const hasData = data.some((point) => point.revenues > 0 || point.expenses > 0 || point.cumulative !== 0)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'monthly', label: 'Recettes / Dépenses' },
            { value: 'cumulative', label: 'Solde cumulé' },
          ]}
        />
        <ToggleGroup<Period>
          value={period}
          onChange={setPeriod}
          options={[
            { value: 6, label: '6 mois' },
            { value: 12, label: '12 mois' },
          ]}
        />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <ArrowUpRight size={13} className="text-emerald-500" /> Recettes ({period} mois)
          </div>
          <p className="mt-1 truncate text-base font-bold text-slate-800">{formatAmount(totals.revenues, currency)}</p>
          <Trend current={lastComplete.revenues} previous={beforeLast.revenues} label={trendLabel} />
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <ArrowDownRight size={13} className="text-red-500" /> Dépenses ({period} mois)
          </div>
          <p className="mt-1 truncate text-base font-bold text-slate-800">{formatAmount(totals.expenses, currency)}</p>
          <Trend current={lastComplete.expenses} previous={beforeLast.expenses} label={trendLabel} inverse />
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Solde de la période</div>
          <p className={`mt-1 truncate text-base font-bold ${totals.balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatAmount(totals.balance, currency)}
          </p>
          <span className="text-[11px] text-slate-400">Trésorerie actuelle : {formatAmount(last.cumulative, currency)}</span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center">
          <p className="text-sm font-medium text-slate-600">Aucune donnée confirmée sur cette période</p>
          <p className="mt-1 text-xs text-slate-400">Les recettes et dépenses approuvées ou payées apparaîtront ici.</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fpRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.revenue} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.revenue} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fpExpenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.expense} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.expense} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fpCumulativeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.cumulative} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.cumulative} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: COLORS.axis }}
                tickLine={false}
                axisLine={{ stroke: COLORS.grid }}
                interval={period > 6 ? 'preserveStartEnd' : 0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: COLORS.axis }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompact}
                width={48}
              />
              <Tooltip
                content={<ChartTooltip currency={currency} mode={mode} />}
                cursor={{ stroke: COLORS.axis, strokeDasharray: '4 4' }}
              />
              <ReferenceLine y={0} stroke={COLORS.axis} />

              {mode === 'monthly' ? (
                <>
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenues"
                    name="Recettes"
                    stroke={COLORS.revenue}
                    strokeWidth={2.5}
                    fill="url(#fpRevenueFill)"
                    dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 5 }}
                    animationDuration={900}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Dépenses"
                    stroke={COLORS.expense}
                    strokeWidth={2.5}
                    fill="url(#fpExpenseFill)"
                    dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 5 }}
                    animationDuration={900}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Solde du mois"
                    stroke={COLORS.balance}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={{ r: 4 }}
                    animationDuration={900}
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Solde cumulé"
                  stroke={COLORS.cumulative}
                  strokeWidth={3}
                  fill="url(#fpCumulativeFill)"
                  dot={{ r: 3.5, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                  animationDuration={900}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}