import type { WorkspaceStats } from '@lynx/types'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { useTranslation } from 'react-i18next'

// activityByDay dates are plain "YYYY-MM-DD" strings (see dashboard.service.ts) —
// format them in UTC so the label never shifts a day depending on the reader's
// browser timezone.
function formatDate(isoDate: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(undefined, {
    ...options,
    timeZone: 'UTC',
  })
}

function ActivityTooltip({ active, payload }: TooltipContentProps) {
  const { t } = useTranslation()
  const point = payload?.[0]
  if (!active || !point || typeof point.value !== 'number') return null
  const { date } = point.payload as { date: string; count: number }

  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 text-sm shadow-lg">
      <p className="text-foreground font-semibold">
        {t('dashboard.issueCount', { count: point.value })}
      </p>
      <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
        <span className="bg-accent inline-block h-0.5 w-3" aria-hidden />
        {formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
    </div>
  )
}

export function IssuesActivityChart({ data }: { data: WorkspaceStats['activityByDay'] }) {
  const { t } = useTranslation()

  return (
    <div className="border-border bg-surface rounded-xl border p-4">
      <h2 className="text-sm font-medium">{t('dashboard.chartTitle')}</h2>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) =>
                formatDate(value, { month: 'short', day: 'numeric' })
              }
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={ActivityTooltip} cursor={{ stroke: 'var(--border)' }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-accent)"
              strokeWidth={2}
              fill="var(--color-accent)"
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
