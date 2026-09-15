import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type SalesOrderProduct,
  type SalesOrderRampPeriod,
} from '@/data/salesOrderMock'
import {
  EntitlementsAllocationTable,
  entitlementChangeCount,
} from './EntitlementsAllocationTable'
import { ProductPeriodTable, rampChangeSummary } from './ReadOnlyProductsList'
import { SectionRuleTitle } from './SectionRuleTitle'

function yearFromUpcomingIndex(index: number): 2 | 3 {
  return (index + 2) as 2 | 3
}

function RampPeriodAccordion({
  period,
  previousPeriod,
  year,
  isExpanded,
  onToggle,
  onSelectEntitlement,
}: {
  period: SalesOrderRampPeriod
  previousPeriod?: SalesOrderRampPeriod
  year: 2 | 3
  isExpanded: boolean
  onToggle: () => void
  onSelectEntitlement?: (featureLabel: string) => void
}) {
  const productSummary = rampChangeSummary(previousPeriod, period)
  const totalCount = (productSummary?.count ?? 0) + entitlementChangeCount(year)
  const summaryLabel =
    totalCount === 0
      ? null
      : `${totalCount} ${totalCount === 1 ? 'change' : 'changes'}`

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full cursor-pointer items-center border-b border-neutral-200 py-3 pl-1 pr-2 text-left transition-colors hover:bg-neutral-50'
        )}
      >
        <ChevronDown
          size={16}
          className={cn(
            '-ml-6 mr-2 shrink-0 text-blue-700 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
        <span className="shrink-0 text-[13px] font-semibold text-brand-navy">
          {period.label.replace(/^Period\s+/i, 'Year ')}
        </span>
        <span className="mx-2 text-[13px] text-brand-fog">·</span>
        <span className="flex items-center gap-1.5 text-[12px] text-brand-fog">
          <Calendar size={14} className="text-brand-mist" />
          {period.startDate} to {period.endDate}
        </span>
        {summaryLabel ? (
          <>
            <span className="mx-2 text-[13px] text-brand-fog">·</span>
            <span className="truncate text-[12px] text-brand-fog">{summaryLabel}</span>
          </>
        ) : null}
      </button>
      {isExpanded ? (
        <div className="space-y-8 pt-4 pb-6">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
              Products and pricing
            </p>
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <ProductPeriodTable period={period} />
            </div>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
              Entitlements
            </p>
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <EntitlementsAllocationTable
                year={year}
                onSelectFeature={onSelectEntitlement}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function UpcomingRampsSection({
  items: _items,
  periods,
  onSelectEntitlement,
}: {
  items: SalesOrderProduct[]
  periods: SalesOrderRampPeriod[]
  onSelectEntitlement?: (featureLabel: string) => void
}) {
  const [currentPeriod, ...upcomingPeriods] = periods
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(upcomingPeriods[0] ? [upcomingPeriods[0].id] : [])
  )

  if (upcomingPeriods.length === 0) return null

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <SectionRuleTitle as="h3">Upcoming ramps</SectionRuleTitle>
      {upcomingPeriods.map((period, index) => (
        <RampPeriodAccordion
          key={period.id}
          period={period}
          previousPeriod={index === 0 ? currentPeriod : upcomingPeriods[index - 1]}
          year={yearFromUpcomingIndex(index)}
          isExpanded={expanded.has(period.id)}
          onToggle={() => toggle(period.id)}
          onSelectEntitlement={onSelectEntitlement}
        />
      ))}
    </div>
  )
}

export default UpcomingRampsSection
