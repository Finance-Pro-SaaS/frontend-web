import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const gradientId = `spark-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const data = values.map((value, index) => ({ index, value }))

  return (
    <div className="h-9 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TrendBadge({
  current,
  previous,
  inverse = false,
  label = 'vs mois préc.',
}: {
  current: number
  previous: number
  inverse?: boolean
  label?: string
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
      {change.toFixed(0)}%<span className="font-normal text-slate-400">{label}</span>
    </span>
  )
}
