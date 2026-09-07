import { useState } from 'react'
import { ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type SalesOrderProduct, type SalesOrderRampPeriod } from '@/data/salesOrderMock'

interface ReadOnlyProductsListProps {
  items: SalesOrderProduct[]
  /** optional ramp breakdown — renders collapsible period tables */
  periods?: SalesOrderRampPeriod[]
  /** Navigate to Entitlements/Usage when a multi-entitlement link is clicked */
  onViewEntitlements?: () => void
  /** When false, hide later ramp periods so they can sit below another section. */
  showUpcomingRamps?: boolean
  /** Render only later ramps, with the Upcoming ramps title. */
  upcomingOnly?: boolean
}

const ENTITLEMENTS_W = 200
const QTY_W = 104
const UNIT_W = 140
const TOTAL_W = 116

type EntitlementSummary = {
  count: number
  /** Shown alone when count is 1, or as the lead when count > 1 */
  primary: string
}

/** Prototype entitlement summaries by product line. */
const ENTITLEMENT_SUMMARY_BY_NAME: Record<string, EntitlementSummary> = {
  'Apex platform - growth services': { count: 5, primary: '10k API calls' },
  'Apex platform - starter services': { count: 3, primary: '5k API calls' },
  'Implementation services': { count: 2, primary: '40 hrs' },
  'Onboarding & Training': { count: 1, primary: '1 cohort' },
  'Premium support SLA': { count: 3, primary: '24/7 support' },
  'Sandbox environments': { count: 1, primary: 'sandboxes' },
}

function entitlementSummaryFor(item: SalesOrderProduct): EntitlementSummary {
  if (item.entitlementCount === 1 && item.entitlementValue) {
    return { count: 1, primary: item.entitlementValue }
  }
  if (item.name === 'Sandbox environments') {
    const qty = Number.parseInt(item.quantity, 10)
    const n = Number.isFinite(qty) ? qty : 1
    return {
      count: 1,
      primary: `${n} ${n === 1 ? 'sandbox' : 'sandboxes'}`,
    }
  }
  const mapped = ENTITLEMENT_SUMMARY_BY_NAME[item.name]
  if (mapped) {
    return {
      count: item.entitlementCount ?? mapped.count,
      primary: item.entitlementValue ?? mapped.primary,
    }
  }
  return {
    count: item.entitlementCount ?? 2,
    primary: item.entitlementValue ?? '10k API calls',
  }
}

function EntitlementsCell({
  item,
  onViewEntitlements,
}: {
  item: SalesOrderProduct
  onViewEntitlements?: () => void
}) {
  const { count, primary } = entitlementSummaryFor(item)
  if (count === 1) {
    return (
      <span className="whitespace-nowrap text-[14px] text-brand-navy">{primary}</span>
    )
  }
  const more = count - 1
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onViewEntitlements?.()
      }}
      className="group cursor-pointer whitespace-nowrap text-left text-[13px]"
    >
      <span className="font-normal text-brand-navy">{primary}</span>
      <span className="font-medium text-blue-700 transition-colors group-hover:text-blue-800">
        {' '}
        + {more} more
      </span>
    </button>
  )
}

function QuantityChangeBadge({ change }: { change: number }) {
  const isIncrease = change >= 0
  const Icon = isIncrease ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-green-700">
      <Icon size={12} strokeWidth={2} className="shrink-0 text-green-700" />
      {isIncrease ? '+' : '−'}
      {Math.abs(change)}
    </span>
  )
}

/** Collapse chevron in the period header. */
function PeriodChevron({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className="-ml-6 mr-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-blue-700 transition-colors hover:bg-blue-50"
      title={isExpanded ? 'Collapse period' : 'Expand period'}
    >
      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  )
}

/** Period identity: label + date range, then optional change summary. */
function PeriodIdentity({
  period,
  summary,
}: {
  period: SalesOrderRampPeriod
  summary?: string | null
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[13px] font-semibold text-brand-navy">{period.label}</span>
      <span className="text-[13px] text-brand-fog">·</span>
      <div className="flex items-center gap-1.5 text-[12px] text-brand-fog">
        <Calendar size={14} className="shrink-0 text-brand-mist" />
        <span className="whitespace-nowrap">{period.startDate}</span>
        <span>to</span>
        <span className="whitespace-nowrap">{period.endDate}</span>
      </div>
      {summary ? (
        <>
          <span className="text-[13px] text-brand-fog">·</span>
          <span className="truncate text-[12px] text-brand-fog">{summary}</span>
        </>
      ) : null}
    </div>
  )
}

function ColumnLabels() {
  return (
    <>
      <div style={{ width: QTY_W }} className="shrink-0 pr-6 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Qty
      </div>
      <div
        style={{ width: ENTITLEMENTS_W }}
        className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy"
      >
        Entitlements
      </div>
      <div style={{ width: UNIT_W }} className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Unit price
      </div>
      <div style={{ width: TOTAL_W }} className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Amount
      </div>
    </>
  )
}

function LineRow({
  item,
  isLast = false,
  onViewEntitlements,
}: {
  item: SalesOrderProduct
  isLast?: boolean
  onViewEntitlements?: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center py-2 pl-1 pr-2',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center truncate pr-4">
        <span className="truncate text-[14px] font-medium text-brand-navy">{item.name}</span>
        {item.frequency ? (
          <>
            <span className="mx-1.5 shrink-0 text-[13px] text-brand-fog">·</span>
            <span className="shrink-0 text-[13px] text-brand-fog">{item.frequency}</span>
          </>
        ) : null}
      </div>
      <div
        style={{ width: QTY_W }}
        className="flex shrink-0 items-center justify-end gap-1.5 whitespace-nowrap pr-6 text-[14px] text-brand-navy"
      >
        {item.quantityChange != null && <QuantityChangeBadge change={item.quantityChange} />}
        <span>{item.quantity}</span>
      </div>
      <div style={{ width: ENTITLEMENTS_W }} className="shrink-0 whitespace-nowrap">
        <EntitlementsCell item={item} onViewEntitlements={onViewEntitlements} />
      </div>
      <div
        style={{ width: UNIT_W }}
        className="flex shrink-0 items-center justify-end gap-1.5 whitespace-nowrap text-[14px] font-medium text-brand-navy"
      >
        {item.rampPriceChange != null ? (
          <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-green-700">
            {(item.rampPriceChange ?? 0) >= 0 ? (
              <TrendingUp size={11} strokeWidth={2} className="shrink-0" />
            ) : (
              <TrendingDown size={11} strokeWidth={2} className="shrink-0" />
            )}
            {Math.abs(item.rampPriceChange)}%
          </span>
        ) : null}
        <span>{item.unitPrice}</span>
      </div>
      <div
        style={{ width: TOTAL_W }}
        className="shrink-0 whitespace-nowrap text-right text-[14px] font-medium text-brand-navy"
      >
        {item.totalPrice}
      </div>
    </div>
  )
}

function ProductTableHeader() {
  return (
    <div className="flex items-center border-b border-neutral-200 pb-2 pl-1 pr-2">
      <div className="flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Item
      </div>
      <ColumnLabels />
    </div>
  )
}

function numericQuantity(value: string): number {
  const qty = Number.parseInt(value, 10)
  return Number.isFinite(qty) ? qty : 0
}

function rampChangeSummary(
  previous: SalesOrderRampPeriod | undefined,
  next: SalesOrderRampPeriod
): { detail: string; count: number } | null {
  if (!previous) return null

  const prevByName = new Map(previous.items.map((item) => [item.name, item]))

  let added = 0
  let pricesIncreased = 0
  let qtyIncreased = 0

  for (const item of next.items) {
    const prior = prevByName.get(item.name)
    if (!prior) {
      added += 1
      continue
    }
    const delta =
      item.quantityChange ?? numericQuantity(item.quantity) - numericQuantity(prior.quantity)
    if (delta > 0) qtyIncreased += 1
    if (item.rampPriceChange != null || item.unitPriceDiff) pricesIncreased += 1
  }

  const count = added + pricesIncreased + qtyIncreased
  if (count === 0) return null

  const parts: string[] = []
  if (added === 1) parts.push('1 add-on added')
  else if (added > 1) parts.push(`${added} add-ons added`)
  if (pricesIncreased === 1) parts.push('1 price increased')
  else if (pricesIncreased > 1) parts.push(`${pricesIncreased} prices increased`)
  if (qtyIncreased === 1) parts.push('1 quantity increase')
  else if (qtyIncreased > 1) parts.push(`${qtyIncreased} quantity increases`)

  return { detail: parts.join(' · '), count }
}

function CurrentPeriodTable({
  period,
  onViewEntitlements,
}: {
  period: SalesOrderRampPeriod
  onViewEntitlements?: () => void
}) {
  return (
    <div>
      <ProductTableHeader />
      {period.items.map((item) => (
        <LineRow
          key={item.id}
          item={item}
          onViewEntitlements={onViewEntitlements}
        />
      ))}
    </div>
  )
}

function PeriodContainer({
  period,
  previousPeriod,
  isExpanded,
  onToggle,
  onViewEntitlements,
}: {
  period: SalesOrderRampPeriod
  previousPeriod?: SalesOrderRampPeriod
  isExpanded: boolean
  onToggle: () => void
  onViewEntitlements?: () => void
}) {
  const summary = rampChangeSummary(previousPeriod, period)
  const summaryLabel = summary
    ? isExpanded
      ? `${summary.count} ${summary.count === 1 ? 'change' : 'changes'}`
      : summary.detail
    : null

  return (
    <div>
      <div
        onClick={onToggle}
        className={cn(
          'flex w-full cursor-pointer items-center border-b border-neutral-200 pl-1 pr-2 transition-colors hover:bg-neutral-50',
          isExpanded ? 'pb-2 pt-3' : 'py-3'
        )}
      >
        <div className="flex min-w-0 flex-1 items-center">
          <PeriodChevron isExpanded={isExpanded} onToggle={onToggle} />
          <PeriodIdentity period={period} summary={summaryLabel} />
        </div>
        {isExpanded ? <ColumnLabels /> : null}
      </div>
      {isExpanded &&
        period.items.map((item, idx) => (
          <LineRow
            key={item.id}
            item={item}
            isLast={idx === period.items.length - 1}
            onViewEntitlements={onViewEntitlements}
          />
        ))}
    </div>
  )
}

/**
 * Compact, read-only view of order line items. When `periods` are supplied it
 * renders each period as an accordion (first expanded by default).
 */
export function ReadOnlyProductsList({
  items,
  periods,
  onViewEntitlements,
  showUpcomingRamps = true,
  upcomingOnly = false,
}: ReadOnlyProductsListProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(() => {
    const firstPeriodId = periods?.[0]?.id
    return new Set(firstPeriodId ? [firstPeriodId] : [])
  })

  const togglePeriod = (id: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Ramp view — current period, then later ramps under a shared title
  if (periods && periods.length > 0) {
    const [currentPeriod, ...upcomingPeriods] = periods

    const renderUpcoming = (period: SalesOrderRampPeriod, index: number) => (
      <PeriodContainer
        key={period.id}
        period={{
          ...period,
          label: period.label.replace(/^Period\s+/i, 'Year '),
        }}
        previousPeriod={index === 0 ? currentPeriod : upcomingPeriods[index - 1]}
        isExpanded={expandedPeriods.has(period.id)}
        onToggle={() => togglePeriod(period.id)}
        onViewEntitlements={onViewEntitlements}
      />
    )

    if (upcomingOnly) {
      if (upcomingPeriods.length === 0) return null
      return (
        <div className="space-y-4">
          <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
            Upcoming ramps
          </h3>
          {upcomingPeriods.map(renderUpcoming)}
        </div>
      )
    }

    return (
      <div className="space-y-10">
        <CurrentPeriodTable
          period={currentPeriod}
          onViewEntitlements={onViewEntitlements}
        />
        {showUpcomingRamps && upcomingPeriods.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
              Upcoming ramps
            </h3>
            {upcomingPeriods.map(renderUpcoming)}
          </div>
        )}
      </div>
    )
  }

  // Flat view
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-1 py-1">
      <div className="flex items-center border-b border-neutral-200 pb-2 pl-1 pr-2">
        <div className="flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Item
        </div>
        <ColumnLabels />
      </div>
      {items.map((item, idx) => (
        <LineRow
          key={item.id}
          item={item}
          isLast={idx === items.length - 1}
          onViewEntitlements={onViewEntitlements}
        />
      ))}
    </div>
  )
}

export default ReadOnlyProductsList
