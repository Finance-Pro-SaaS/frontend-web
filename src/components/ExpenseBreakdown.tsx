import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
import type { Expense } from '../services/expenses'

interface Slice {
  name: string
  value: number
  color: string
}

const PALETTE = ['#0f172a', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
const OTHERS_COLOR = '#cbd5e1'

const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

function formatAmount(value: number, currency: string) {
  return `${numberFormatter.format(Math.round(value))} ${currency}`
}

export function ExpenseBreakdown({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const { slices, total } = useMemo(() => {
    const totals = new Map<string, number>()

    expenses
      .filter((item) => item.currency === currency)
      .forEach((item) => {
        const name = item.project?.name || 'Dépense générale'
        totals.set(name, (totals.get(name) ?? 0) + Number(item.amount))
      })

    const sorted = [...totals.entries()].filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1])
    const result: Slice[] = sorted.slice(0, 5).map(([name, value], index) => ({ name, value, color: PALETTE[index] }))
    const rest = sorted.slice(5).reduce((sum, [, value]) => sum + value, 0)
    if (rest > 0) result.push({ name: 'Autres projets', value: rest, color: OTHERS_COLOR })

    return { slices: result, total: sorted.reduce((sum, [, value]) => sum + value, 0) }
  }, [expenses, currency])

  if (total === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center text-center">
        <PieChartIcon size={24} className="text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">Aucune dépense confirmée à répartir.</p>
      </div>
    )
  }

  const active = activeIndex !== null ? slices[activeIndex] : null

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-2 sm:flex-row">
      <div className="relative shrink-0" style={{ width: 208, height: 208 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
              animationDuration={900}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {slices.map((slice, index) => (
                <Cell
                  key={slice.name}
                  fill={slice.color}
                  fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <span className="max-w-full truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {active ? active.name : 'Total'}
          </span>
          <span className="mt-0.5 text-sm font-bold text-slate-800">
            {formatAmount(active ? active.value : total, currency)}
          </span>
          {active && (
            <span className="text-[11px] font-semibold text-slate-500">
              {((active.value / total) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {slices.map((slice, index) => (
          <li
            key={slice.name}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            className={`flex items-center justify-between gap-3 text-xs transition-opacity ${
              activeIndex === null || activeIndex === index ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate font-medium">{slice.name}</span>
            </span>
            <span className="shrink-0 font-semibold text-slate-700">
              {((slice.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
