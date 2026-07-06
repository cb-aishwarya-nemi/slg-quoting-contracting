import { useState } from 'react'
import { ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { withRelativeAnnotation } from '@/lib/utils'
import { type SalesOrderProduct, type SalesOrderRampPeriod } from '@/data/salesOrderMock'

interface ReadOnlyProductsListProps {
  items: SalesOrderProduct[]
  /** optional ramp breakdown — renders collapsible period tables */
  periods?: SalesOrderRampPeriod[]
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

/** Blue collapse chevron that hangs to the left of the period label. */
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

function LineRow({ item }: { item: SalesOrderProduct }) {
  return (
    <div className="flex items-center border-b border-neutral-100 py-2 pl-1 pr-2">
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

/**
 * Compact, read-only view of order line items. When `periods` are supplied it
 * mirrors the Contract Processing ramp layout: collapsible period tables indented
 * 24px on the left, with the collapse chevron hanging into the gutter.
 */
export function ReadOnlyProductsList({ items, periods }: ReadOnlyProductsListProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    () => new Set(periods?.map((p) => p.id) ?? [])
  )

  const togglePeriod = (id: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Ramp view — collapsible period tables
  if (periods && periods.length > 0) {
    return (
      <div>
        {periods.map((period, idx) => {
          const isExpanded = expandedPeriods.has(period.id)
          const isLast = idx === periods.length - 1
          const marginBottom = isLast ? 0 : isExpanded ? 24 : 16

          if (!isExpanded) {
            return (
              <div key={period.id} style={{ marginBottom }}>
                <div
                  onClick={() => togglePeriod(period.id)}
                  className="flex w-full cursor-pointer items-center py-3 pl-1 pr-2 transition-colors hover:bg-neutral-50"
                >
                  <PeriodChevron isExpanded={false} onToggle={() => togglePeriod(period.id)} />
                  <PeriodIdentity period={period} />
                </div>
              </div>
            )
          }

          return (
            <div key={period.id} style={{ marginBottom }}>
              {/* Merged period + column header */}
              <div className="flex items-center border-b border-neutral-200 pb-2 pl-1 pr-2">
                <div className="flex min-w-0 flex-1 items-center">
                  <PeriodChevron isExpanded onToggle={() => togglePeriod(period.id)} />
                  <PeriodIdentity period={period} />
                </div>
                <ColumnLabels />
              </div>
              {period.items.map((item) => (
                <LineRow key={item.id} item={item} />
              ))}
            </div>
          )
        })}
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
      {items.map((item) => (
        <LineRow key={item.id} item={item} />
      ))}
    </div>
  )
}

export default ReadOnlyProductsList
