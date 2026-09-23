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
    <div className="relative overflow-hidden rounded-lg border border-brand-navy/40 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="relative z-10 flex h-[52px] w-full cursor-pointer items-center gap-2 bg-white px-5 text-left transition-colors hover:bg-neutral-50"
      >
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-blue-700 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
        <span className="flex min-w-0 flex-1 items-center">
          <span className="shrink-0 text-[13px] font-medium text-brand-navy">
            {period.label.replace(/^Period\s+/i, 'Year ')}
          </span>
          <span className="mx-2 text-[12px] text-brand-mist">·</span>
          <span className="flex items-center gap-1.5 text-[12px] text-brand-fog">
            <Calendar size={13} className="text-brand-fog" />
            {period.startDate} to {period.endDate}
          </span>
          {summaryLabel ? (
            <>
              <span className="mx-2 text-[12px] text-brand-mist">·</span>
              <span className="truncate text-[12px] text-brand-fog">{summaryLabel}</span>
            </>
          ) : null}
        </span>
      </button>
      {isExpanded ? (
        <div className="space-y-11 border-t border-brand-navy/40 bg-white px-5 pb-5 pt-8">
          <ProductPeriodTable period={period} headerRuleClassName="border-brand-navy/40" />
          <EntitlementsAllocationTable
            year={year}
            onSelectFeature={onSelectEntitlement}
            headerRuleClassName="border-brand-navy/40"
            rampLayout
          />
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
      <SectionRuleTitle as="h3" hideRule>
        Upcoming ramps
      </SectionRuleTitle>
      <div className="space-y-3">
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
    </div>
  )
}

export default UpcomingRampsSection
