import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  buildTimelineAxis,
  dateToTimelinePercent,
  formatPeriodProgressLabel,
  type EntitlementTone,
  type TimelineEntitlement,
} from '@/data/salesOrderTimelineMock'

const TONE_STYLES: Record<EntitlementTone, { line: string; dot: string; value: string }> = {
  positive: { line: '#22c55e', dot: '#16a34a', value: 'text-green-700' },
  warning: { line: '#f59e0b', dot: '#d97706', value: 'text-amber-700' },
  neutral: { line: '#9b99b4', dot: '#6b6885', value: 'text-brand-fog' },
}

function RunRateFeatureGraph({
  entitlement,
  startDate,
  endDate,
  todayDate,
}: {
  entitlement: TimelineEntitlement
  startDate: string
  endDate: string
  todayDate: string
}) {
  const points = entitlement.runRatePoints ?? []
  const usagePct = entitlement.usagePct ?? 0
  const styles = TONE_STYLES[entitlement.tone]
  const periodProgressLabel = formatPeriodProgressLabel(startDate, endDate, todayDate)
  const todayPct = dateToTimelinePercent(todayDate, startDate, endDate)

  const axis = useMemo(() => buildTimelineAxis(startDate, endDate), [startDate, endDate])

  const visiblePoints = useMemo(
    () =>
      points.filter(
        (p) => dateToTimelinePercent(p.date, startDate, endDate) <= todayPct + 0.01
      ),
    [points, startDate, endDate, todayPct]
  )

  const monthTicks = axis.months.filter((_, i) => i % 2 === 0).slice(0, 6)

  const linePath = useMemo(() => {
    if (visiblePoints.length < 2) return ''
    return visiblePoints
      .map((p, i) => {
        const x = dateToTimelinePercent(p.date, startDate, endDate)
        const y = 100 - Math.max(0, Math.min(100, p.cumulativePct))
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }, [visiblePoints, startDate, endDate])

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-md border border-neutral-200 px-2.5 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-brand-fog">
            {entitlement.label}
          </p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-brand-navy">
            {entitlement.usedLabel}
            <span className="font-normal text-brand-fog"> / {entitlement.allocatedLabel}</span>
          </p>
          <p className="mt-0.5 text-[10px] tabular-nums text-brand-fog">{periodProgressLabel}</p>
        </div>
        <p className={cn('shrink-0 text-[11px] font-medium tabular-nums', styles.value)}>
          {usagePct}% used
        </p>
      </div>

      <div className="mt-2 flex gap-1.5">
        <div className="flex w-9 shrink-0 flex-col justify-between py-0.5 text-right text-[9px] tabular-nums text-brand-mist">
          <span className="leading-none">{entitlement.allocatedLabel}</span>
          <span className="leading-none">0</span>
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="relative h-[72px] w-full">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <line
                x1="0"
                y1="100"
                x2="100"
                y2="0"
                vectorEffect="non-scaling-stroke"
                className="stroke-neutral-300"
                strokeWidth="1"
                strokeDasharray="4 3"
              />

              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  stroke={styles.line}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {visiblePoints.map((p) => {
              const left = dateToTimelinePercent(p.date, startDate, endDate)
              const top = 100 - Math.max(0, Math.min(100, p.cumulativePct))
              return (
                <span
                  key={p.date}
                  className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white"
                  style={{ left: `${left}%`, top: `${top}%`, backgroundColor: styles.dot }}
                />
              )
            })}
          </div>

          <div className="relative mt-1 h-3">
            {monthTicks.map((month, index) => (
              <span
                key={`${month.label}-${index}`}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.04em] text-brand-mist"
                style={{ left: `${month.startPercent}%` }}
              >
                {month.label.replace(/ \d{4}$/, '')}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex gap-3 text-[9px] text-brand-fog">
        <span className="inline-flex items-center gap-1">
          <span className="h-px w-3" style={{ backgroundColor: styles.line }} />
          Actual
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-px w-3 border-t border-dashed border-neutral-300" />
          Expected pace
        </span>
      </div>
    </div>
  )
}

export function SalesOrderRunRateGraphs({
  entitlements,
  startDate,
  endDate,
  todayDate,
}: {
  entitlements: TimelineEntitlement[]
  startDate: string
  endDate: string
  todayDate: string
}) {
  if (entitlements.length === 0) return null

  return (
    <div className="mb-4 flex gap-2.5">
      {entitlements.map((entitlement) => (
        <RunRateFeatureGraph
          key={entitlement.id}
          entitlement={entitlement}
          startDate={startDate}
          endDate={endDate}
          todayDate={todayDate}
        />
      ))}
    </div>
  )
}

export default SalesOrderRunRateGraphs
