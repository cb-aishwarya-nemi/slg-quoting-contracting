import { useState } from 'react'
import { ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { cn, withRelativeAnnotation } from '@/lib/utils'
import { type SalesOrderProduct, type SalesOrderRampPeriod } from '@/data/salesOrderMock'

interface ReadOnlyProductsListProps {
  items: SalesOrderProduct[]
  /** optional ramp breakdown — renders collapsible period tables */
  periods?: SalesOrderRampPeriod[]
  /** When set, this period is shown first (collapsed view); expand reveals all in order. */
  primaryPeriodId?: string
}

const PERIOD_W = 96
const QTY_W = 60
const UNIT_W = 110
const TOTAL_W = 124

function PriceChangeBadge({ change }: { change: number }) {
  const isIncrease = change >= 0
  const Icon = isIncrease ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-green-700">
      <Icon size={12} strokeWidth={2} className="shrink-0 text-green-700" />
      {Math.abs(change)}%
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
      className="mr-2 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-blue-700 transition-colors hover:bg-blue-50"
      title={isExpanded ? 'Collapse period' : 'Expand period'}
    >
      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  )
}

/** Period identity: label + date range (with relative annotation on the start). */
function PeriodIdentity({ period }: { period: SalesOrderRampPeriod }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[13px] font-semibold text-brand-navy">{period.label}</span>
      <span className="text-[13px] text-brand-fog">·</span>
      <div className="flex items-center gap-1.5 text-[12px] text-brand-fog">
        <Calendar size={14} className="shrink-0 text-brand-mist" />
        <span className="whitespace-nowrap">{withRelativeAnnotation(period.startDate)}</span>
        <span>to</span>
        <span className="whitespace-nowrap">{period.endDate}</span>
      </div>
    </div>
  )
}

function ColumnLabels() {
  return (
    <>
      <div style={{ width: PERIOD_W }} className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Frequency
      </div>
      <div style={{ width: QTY_W }} className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Qty
      </div>
      <div style={{ width: UNIT_W }} className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Unit price
      </div>
      <div style={{ width: TOTAL_W }} className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Total price
      </div>
    </>
  )
}

function LineRow({ item, isLast = false }: { item: SalesOrderProduct; isLast?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center py-2 pl-1 pr-2',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <div className="flex flex-1 items-center gap-2 truncate pr-4">
        <span className="truncate text-[14px] font-medium text-brand-navy">{item.name}</span>
        {item.rampPriceChange != null && <PriceChangeBadge change={item.rampPriceChange} />}
      </div>
      <div style={{ width: PERIOD_W }} className="shrink-0 text-[14px] text-brand-navy">
        {item.frequency}
      </div>
      <div style={{ width: QTY_W }} className="shrink-0 text-[14px] text-brand-navy">
        {item.quantity}
      </div>
      <div style={{ width: UNIT_W }} className="shrink-0 text-right text-[14px] font-medium text-brand-navy">
        {item.unitPrice}
      </div>
      <div style={{ width: TOTAL_W }} className="shrink-0 text-right text-[14px] font-medium text-brand-navy">
        {item.totalPrice}
      </div>
    </div>
  )
}

function PeriodContainer({
  period,
  isExpanded,
  onToggle,
}: {
  period: SalesOrderRampPeriod
  isExpanded: boolean
  onToggle: () => void
}) {
  const containerClass = 'overflow-hidden rounded-lg border border-neutral-200'

  if (!isExpanded) {
    return (
      <div className={containerClass}>
        <div
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center px-3 py-3 transition-colors hover:bg-neutral-50"
        >
          <PeriodChevron isExpanded={false} onToggle={onToggle} />
          <PeriodIdentity period={period} />
        </div>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <div className="flex items-center border-b border-neutral-200 px-3 pb-2 pt-3">
        <div className="flex min-w-0 flex-1 items-center">
          <PeriodChevron isExpanded onToggle={onToggle} />
          <PeriodIdentity period={period} />
        </div>
        <ColumnLabels />
      </div>
      <div className="px-2 pb-1">
        {period.items.map((item, idx) => (
          <LineRow
            key={item.id}
            item={item}
            isLast={idx === period.items.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Compact, read-only view of order line items. When `periods` are supplied it
 * renders each period in a light outlined collapsible container.
 */
export function ReadOnlyProductsList({
  items,
  periods,
  primaryPeriodId,
}: ReadOnlyProductsListProps) {
  const primaryId = primaryPeriodId ?? periods?.[0]?.id
  const [showAdditionalPeriods, setShowAdditionalPeriods] = useState(false)
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    () => new Set(primaryId ? [primaryId] : [])
  )

  const togglePeriod = (id: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const revealAdditionalPeriods = () => {
    setShowAdditionalPeriods(true)
    setExpandedPeriods((prev) => {
      const next = new Set(prev)
      periods?.forEach((period) => next.add(period.id))
      return next
    })
  }

  // Ramp view — collapsible period tables with outlined containers
  if (periods && periods.length > 0) {
    const additionalPeriodCount = periods.length - 1
    const primaryPeriod =
      periods.find((period) => period.id === primaryId) ?? periods[0]
    const visiblePeriods = showAdditionalPeriods ? periods : [primaryPeriod]

    return (
      <div className="space-y-4">
        {visiblePeriods.map((period) => (
          <PeriodContainer
            key={period.id}
            period={period}
            isExpanded={expandedPeriods.has(period.id)}
            onToggle={() => togglePeriod(period.id)}
          />
        ))}
        {!showAdditionalPeriods && additionalPeriodCount > 0 && (
          <button
            type="button"
            onClick={revealAdditionalPeriods}
            className="cursor-pointer text-[13px] text-brand-navy underline decoration-brand-mist decoration-1 underline-offset-[3px] transition-colors hover:text-blue-700 hover:decoration-blue-700"
          >
            {additionalPeriodCount === 1
              ? '1 more period'
              : `${additionalPeriodCount} more periods`}
          </button>
        )}
      </div>
    )
  }

  // Flat view
  return (
    <div>
      <div className="flex items-center border-b border-neutral-200 pb-2 pl-1 pr-2">
        <div className="flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Item
        </div>
        <ColumnLabels />
      </div>
      {items.map((item, idx) => (
        <LineRow key={item.id} item={item} isLast={idx === items.length - 1} />
      ))}
    </div>
  )
}

export default ReadOnlyProductsList
