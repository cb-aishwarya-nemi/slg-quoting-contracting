import { useState } from 'react'
import { Calendar, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type SalesOrderProduct,
  type SalesOrderRampPeriod,
} from '@/data/salesOrderMock'
import { EntitlementsAllocationTable } from './EntitlementsAllocationTable'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'
import { SectionRuleTitle } from './SectionRuleTitle'

type RampView = 'products' | 'entitlements'

const VIEW_LABELS: Record<RampView, string> = {
  products: 'Products and pricing',
  entitlements: 'Entitlements',
}

function RampViewSwitcher({
  value,
  onChange,
}: {
  value: RampView
  onChange: (value: RampView) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy transition-colors hover:bg-neutral-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ChevronsUpDown size={18} strokeWidth={2} className="text-blue-700" />
        {VIEW_LABELS[value]}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[190px] overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {(Object.keys(VIEW_LABELS) as RampView[]).map((view) => (
            <button
              key={view}
              type="button"
              role="menuitem"
              onClick={() => {
                onChange(view)
                setOpen(false)
              }}
              className={cn(
                'flex w-full cursor-pointer items-center px-3 py-2 text-left text-[13px] transition-colors',
                view === value
                  ? 'bg-blue-50 font-medium text-blue-700'
                  : 'text-brand-navy hover:bg-neutral-50'
              )}
            >
              {VIEW_LABELS[view]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const ENTITLEMENT_RAMP_PERIODS = [
  {
    id: 'entitlements-year-2',
    year: 2 as const,
    label: 'Year 2',
    startDate: '1 May 2027',
    endDate: '30 Apr 2028',
    summary: '2 entitlement increases',
  },
  {
    id: 'entitlements-year-3',
    year: 3 as const,
    label: 'Year 3',
    startDate: '1 May 2028',
    endDate: '30 Apr 2029',
    summary: '2 entitlement increases',
  },
]

function EntitlementRamps({
  onSelectFeature,
}: {
  onSelectFeature?: (featureLabel: string) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      {ENTITLEMENT_RAMP_PERIODS.map((period) => {
        const isExpanded = expanded.has(period.id)
        return (
          <div key={period.id}>
            <button
              type="button"
              onClick={() => toggle(period.id)}
              className="flex w-full cursor-pointer items-center border-b border-neutral-200 py-3 pl-1 pr-2 text-left transition-colors hover:bg-neutral-50"
            >
              <ChevronDown
                size={16}
                className={cn(
                  '-ml-6 mr-2 shrink-0 text-blue-700 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
              <span className="shrink-0 text-[13px] font-semibold text-brand-navy">
                {period.label}
              </span>
              <span className="mx-2 text-[13px] text-brand-fog">·</span>
              <span className="flex items-center gap-1.5 text-[12px] text-brand-fog">
                <Calendar size={14} className="text-brand-mist" />
                {period.startDate} to {period.endDate}
              </span>
              <span className="mx-2 text-[13px] text-brand-fog">·</span>
              <span className="text-[12px] text-brand-fog">{period.summary}</span>
            </button>
            {isExpanded ? (
              <div className="pt-3">
                <EntitlementsAllocationTable
                  year={period.year}
                  onSelectFeature={onSelectFeature}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function UpcomingRampsSection({
  items,
  periods,
  onSelectEntitlement,
}: {
  items: SalesOrderProduct[]
  periods: SalesOrderRampPeriod[]
  onSelectEntitlement?: (featureLabel: string) => void
}) {
  const [view, setView] = useState<RampView>('products')

  return (
    <div className="space-y-4">
      <SectionRuleTitle
        as="h3"
        afterTitle={<RampViewSwitcher value={view} onChange={setView} />}
      >
        Upcoming ramps for
      </SectionRuleTitle>
      {view === 'products' ? (
        <ReadOnlyProductsList
          items={items}
          periods={periods}
          upcomingOnly
          hideUpcomingTitle
        />
      ) : (
        <EntitlementRamps onSelectFeature={onSelectEntitlement} />
      )}
    </div>
  )
}

export default UpcomingRampsSection
