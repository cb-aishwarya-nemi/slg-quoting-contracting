import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildTimelineAxis,
  dateToTimelinePercent,
  getSalesOrderTimelinePeriods,
  getUsageEndPercent,
  isTimelinePeriodStarted,
  parseTimelineDate,
  type BillingMilestoneStatus,
  type EntitlementTone,
  type SalesOrderTimelinePeriod,
  type TimelineBillingMilestone,
  type TimelineEntitlement,
  type TimelineProductRow,
} from '@/data/salesOrderTimelineMock'

const LABEL_COL_WIDTH = 176
const PILL_COL_WIDTH = 140

const GRID_COLUMNS = `${LABEL_COL_WIDTH}px minmax(0, 1fr) ${PILL_COL_WIDTH}px`

const ROW_DIVIDER = 'border-b border-neutral-200'
/** Column dividers only — no outer left/right bounding stroke */
const COL_DIVIDER_TRACK = 'border-l border-neutral-200'
const COL_DIVIDER_PILL = 'border-l border-neutral-200'

const ENTITLEMENT_TONE_STYLES: Record<EntitlementTone, { pill: string; progress: string }> = {
  positive: { pill: 'text-green-700', progress: 'bg-green-400/40' },
  warning: { pill: 'text-amber-700', progress: 'bg-amber-400/40' },
  neutral: { pill: 'text-brand-fog', progress: 'bg-brand-mist/30' },
}

const BILLING_STATUS_STYLES: Record<BillingMilestoneStatus, { dot: string; text: string }> = {
  paid: { dot: 'bg-green-500', text: 'text-brand-fog' },
  pending: { dot: 'bg-amber-500', text: 'text-brand-fog' },
  upcoming: { dot: 'bg-brand-mist', text: 'text-brand-fog' },
}

function formatTodayLabel(dateStr: string): string {
  const date = parseTimelineDate(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function TimelineGridRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid', ROW_DIVIDER, className)} style={{ gridTemplateColumns: GRID_COLUMNS }}>
      {children}
    </div>
  )
}

function PlanTrackBar({
  children,
  className,
  heightClass = 'h-8',
}: {
  children: ReactNode
  className?: string
  heightClass?: string
}) {
  return (
    <div className={cn('relative w-full', heightClass)}>
      <div className={cn('absolute inset-0 overflow-hidden rounded', className)}>{children}</div>
    </div>
  )
}

function TimelineAxisBar({
  startDate,
  endDate,
  todayDate,
}: {
  startDate: string
  endDate: string
  todayDate: string
}) {
  const axis = useMemo(() => buildTimelineAxis(startDate, endDate), [startDate, endDate])
  const todayPercent = dateToTimelinePercent(todayDate, startDate, endDate)
  const showToday =
    parseTimelineDate(todayDate) >= parseTimelineDate(startDate) &&
    parseTimelineDate(todayDate) <= parseTimelineDate(endDate)

  return (
    <div className="relative w-full">
      {showToday && (
        <div
          className="pointer-events-none absolute bottom-0 top-0 z-10 w-px -translate-x-1/2 bg-blue-500/70"
          style={{ left: `${todayPercent}%` }}
        >
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-blue-600">
            Today
          </span>
        </div>
      )}

      <div className="relative h-[22px] border-b border-neutral-200/80">
        {axis.months.map((month, index) => (
          <div key={`${month.label}-${index}`}>
            <div
              className="absolute top-0 h-full w-px bg-neutral-200/80"
              style={{ left: `${month.startPercent}%` }}
            />
            <span
              className="absolute top-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.04em] text-brand-fog"
              style={{ left: `${month.startPercent}%`, paddingLeft: index === 0 ? 8 : 6 }}
            >
              {month.label}
            </span>
          </div>
        ))}
      </div>

      <div className="relative h-[22px]">
        {axis.dates.map((tick, index) => (
          <div
            key={`${tick.day}-${tick.percent}-${index}`}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${tick.percent}%` }}
          >
            <div className="mx-auto h-1.5 w-px bg-neutral-200/90" />
            <span className="mt-0.5 block text-center text-[10px] tabular-nums text-brand-mist">
              {tick.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineTodayLine({
  startDate,
  endDate,
  todayDate,
}: {
  startDate: string
  endDate: string
  todayDate: string
}) {
  const today = parseTimelineDate(todayDate)
  const showToday =
    today >= parseTimelineDate(startDate) && today <= parseTimelineDate(endDate)
  if (!showToday) return null

  const todayPercent = dateToTimelinePercent(todayDate, startDate, endDate)

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 grid"
      style={{ gridTemplateColumns: GRID_COLUMNS }}
    >
      <div />
      <div className="relative">
        <div
          className="absolute bottom-0 top-0 w-px -translate-x-1/2 bg-blue-500/70"
          style={{ left: `${todayPercent}%` }}
        />
      </div>
      <div />
    </div>
  )
}

function EntitlementRow({
  entitlement,
  usageEndPercent,
}: {
  entitlement: TimelineEntitlement
  usageEndPercent: number
}) {
  const styles = ENTITLEMENT_TONE_STYLES[entitlement.tone]

  return (
    <TimelineGridRow>
      <div className="flex items-center px-3 py-2 pl-6">
        <p className="truncate text-[12px] text-brand-fog">{entitlement.label}</p>
      </div>
      <div className={cn('flex items-center px-3 py-2', COL_DIVIDER_TRACK)}>
        <div className="relative h-7 w-full">
          <div className="absolute inset-0 overflow-hidden rounded bg-neutral-100/80">
            <span className="relative z-10 flex h-full items-center px-2.5 text-[11px] text-brand-navy">
              {entitlement.barLabel}
            </span>
          </div>
          {entitlement.usagePct !== undefined && entitlement.usagePct > 0 && (
            <div
              className="absolute inset-y-0 left-0 overflow-hidden rounded"
              style={{ width: `${usageEndPercent}%` }}
            >
              <div
                className={cn('h-full', styles.progress)}
                style={{ width: `${entitlement.usagePct}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <div className={cn('flex items-center justify-end whitespace-nowrap px-3 py-2', COL_DIVIDER_PILL)}>
        <span className={cn('whitespace-nowrap text-[11px]', styles.pill)}>{entitlement.statusLabel}</span>
      </div>
    </TimelineGridRow>
  )
}

function ProductRow({
  product,
  isExpanded,
  onToggle,
  usageEndPercent,
}: {
  product: TimelineProductRow
  isExpanded: boolean
  onToggle: () => void
  usageEndPercent: number
}) {
  return (
    <>
      <TimelineGridRow>
        <div className="flex min-w-0 items-center px-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-[12px] text-brand-navy">{product.name}</p>
            {product.subtitle && (
              <p className="truncate text-[11px] text-brand-fog">{product.subtitle}</p>
            )}
          </div>
        </div>
        <div className={cn('flex items-center px-3 py-3', COL_DIVIDER_TRACK)}>
          <PlanTrackBar className="bg-brand-navy/90">
            <div className="flex h-full items-center px-2.5 text-[11px] text-white">
              {product.barLabel}
            </div>
          </PlanTrackBar>
        </div>
        <div className={cn('flex items-center justify-end whitespace-nowrap px-3 py-3', COL_DIVIDER_PILL)}>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full bg-green-50 px-2 py-0.5 text-[11px] text-green-700 transition-colors hover:bg-green-100"
          >
            {product.entitlementCount} entitlements
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </TimelineGridRow>
      {isExpanded &&
        product.entitlements.map((entitlement) => (
          <EntitlementRow
            key={entitlement.id}
            entitlement={entitlement}
            usageEndPercent={usageEndPercent}
          />
        ))}
    </>
  )
}

function BillingRow({
  startDate,
  endDate,
  todayDate,
  milestones,
}: {
  startDate: string
  endDate: string
  todayDate: string
  milestones: TimelineBillingMilestone[]
}) {
  const today = parseTimelineDate(todayDate)
  const visibleMilestones = useMemo(() => {
    const seenDates = new Set<string>()
    return milestones
      .filter((m) => parseTimelineDate(m.date) <= today)
      .filter((m) => {
        if (seenDates.has(m.date)) return false
        seenDates.add(m.date)
        return true
      })
  }, [milestones, todayDate])

  return (
    <TimelineGridRow className="border-b-0">
      <div className="flex items-center px-3 py-3">
        <p className="text-[12px] text-brand-fog">Billing</p>
      </div>
      <div className={cn('relative px-3 py-3', COL_DIVIDER_TRACK)}>
        <div className="relative h-8">
          {visibleMilestones.map((milestone) => {
            const left = dateToTimelinePercent(milestone.date, startDate, endDate)
            const styles = BILLING_STATUS_STYLES[milestone.status]

            return (
              <div
                key={milestone.id}
                className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${left}%` }}
              >
                <div className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />
                <span className={cn('mt-1 text-[10px]', styles.text)}>{milestone.amountLabel}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className={COL_DIVIDER_PILL} />
    </TimelineGridRow>
  )
}

function PeriodTimelineView({ period }: { period: SalesOrderTimelinePeriod }) {
  const defaultExpanded = useMemo(
    () => new Set(period.products.filter((p) => p.defaultExpanded).map((p) => p.id)),
    [period]
  )
  const [expandedIds, setExpandedIds] = useState<Set<string>>(defaultExpanded)

  useEffect(() => {
    setExpandedIds(defaultExpanded)
  }, [period.id, defaultExpanded])

  const toggleProduct = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const showToday = useMemo(() => {
    return isTimelinePeriodStarted(period.startDate, period.todayDate)
  }, [period])

  const periodStarted = isTimelinePeriodStarted(period.startDate, period.todayDate)
  const usageEndPercent = getUsageEndPercent(
    period.startDate,
    period.endDate,
    period.todayDate
  )

  return (
    <div className="w-full">
      {periodStarted ? (
        <div className="relative">
          <TimelineTodayLine
            startDate={period.startDate}
            endDate={period.endDate}
            todayDate={period.todayDate}
          />

          <TimelineGridRow>
            <div aria-hidden="true" className="min-h-[44px]" />
            <div>
              <TimelineAxisBar
                startDate={period.startDate}
                endDate={period.endDate}
                todayDate={period.todayDate}
              />
            </div>
            <div aria-hidden="true" />
          </TimelineGridRow>

          {period.products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isExpanded={expandedIds.has(product.id)}
              onToggle={() => toggleProduct(product.id)}
              usageEndPercent={usageEndPercent}
            />
          ))}

          <BillingRow
            startDate={period.startDate}
            endDate={period.endDate}
            todayDate={period.todayDate}
            milestones={period.billingMilestones}
          />
        </div>
      ) : (
        <p className="px-3 py-6 text-[12px] text-brand-fog">
          Usage tracking starts {formatTodayLabel(period.startDate)}.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-[10px] text-brand-fog">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Paid
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        </div>
        {showToday && (
          <span>
            <span className="mr-1 inline-block h-2.5 w-px bg-blue-500/70 align-middle" />
            Today · {formatTodayLabel(period.todayDate)}
          </span>
        )}
      </div>
    </div>
  )
}

interface SalesOrderHorizontalTimelineProps {
  orderId: string
}

export function SalesOrderHorizontalTimeline({ orderId }: SalesOrderHorizontalTimelineProps) {
  const periods = getSalesOrderTimelinePeriods(orderId)
  const [periodIndex, setPeriodIndex] = useState(0)

  useEffect(() => {
    setPeriodIndex(0)
  }, [orderId])

  if (!periods || periods.length === 0) {
    return (
      <p className="text-[13px] text-brand-fog">Timeline view is not available for this sales order.</p>
    )
  }

  const period = periods[periodIndex]
  const canGoPrev = periodIndex > 0
  const canGoNext = periodIndex < periods.length - 1

  return (
    <section className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setPeriodIndex((i) => i - 1)}
          className={cn(
            'inline-flex cursor-pointer items-center gap-0.5 text-[12px] transition-colors',
            canGoPrev ? 'text-brand-fog hover:text-brand-navy' : 'cursor-not-allowed text-brand-mist'
          )}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <div className="text-center">
          <p className="text-[13px] text-brand-navy">{period.yearLabel}</p>
          <p className="mt-0.5 text-[11px] text-brand-fog">{period.periodLabel}</p>
        </div>

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => setPeriodIndex((i) => i + 1)}
          className={cn(
            'inline-flex cursor-pointer items-center gap-0.5 text-[12px] transition-colors',
            canGoNext ? 'text-brand-fog hover:text-brand-navy' : 'cursor-not-allowed text-brand-mist'
          )}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>

      <PeriodTimelineView period={period} />
    </section>
  )
}

export default SalesOrderHorizontalTimeline
