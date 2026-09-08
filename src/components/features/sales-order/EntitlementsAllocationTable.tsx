import { Gauge, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type AllocationSource = {
  id: string
  name: string
  units: string
  frequency: string
  /** Units delta vs. the previous year, shown on upcoming ramps. */
  unitsChange?: number
}

type AllocationGroup = {
  id: string
  feature: string
  kind: 'usage' | 'entitlement'
  unitLabel: string
  sources: AllocationSource[]
}

/** Year 1 entitlements — same catalog as contract-ingestion-explorations, flat (no period accordions). */
const SALES_ORDER_ALLOCATIONS: AllocationGroup[] = [
  {
    id: 'alloc-1',
    feature: 'API calls',
    kind: 'usage',
    unitLabel: 'API calls',
    sources: [
      {
        id: 'alloc-1-s1',
        name: 'Apex platform - growth services',
        units: '25,000',
        frequency: 'Yearly',
      },
      {
        id: 'alloc-1-s2',
        name: 'Implementation services',
        units: '5,000',
        frequency: 'Monthly',
      },
    ],
  },
  {
    id: 'alloc-3',
    feature: 'Sandbox environments',
    kind: 'entitlement',
    unitLabel: 'environments',
    sources: [
      {
        id: 'alloc-3-s1',
        name: 'Implementation services',
        units: '03',
        frequency: 'Yearly',
      },
    ],
  },
  {
    id: 'alloc-4',
    feature: 'Premium support seats',
    kind: 'entitlement',
    unitLabel: 'seats',
    sources: [
      {
        id: 'alloc-4-s1',
        name: 'Apex platform - growth services',
        units: '10',
        frequency: 'Yearly',
      },
    ],
  },
]

function parseUnits(value: string): number {
  const n = Number.parseInt(value.replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

function allocationsForYear(year: 1 | 2 | 3): AllocationGroup[] {
  if (year === 1) return SALES_ORDER_ALLOCATIONS

  const previous = allocationsForYear((year - 1) as 1 | 2)
  const previousById = new Map(
    previous.flatMap((group) => group.sources.map((source) => [source.id, source]))
  )

  return SALES_ORDER_ALLOCATIONS.map((group) => ({
    ...group,
    sources: group.sources.map((source) => {
      let units = source.units
      if (group.feature === 'API calls' && source.name === 'Apex platform - growth services') {
        units = year === 2 ? '40,000' : '42,000'
      } else if (group.feature === 'Premium support seats') {
        units = '15'
      } else if (group.feature === 'Sandbox environments' && year === 3) {
        units = '04'
      }

      const prior = previousById.get(source.id)
      const delta = prior ? parseUnits(units) - parseUnits(prior.units) : 0

      return {
        ...source,
        units,
        unitsChange: delta !== 0 ? delta : undefined,
      }
    }),
  }))
}

function UnitsChangeBadge({ change }: { change: number }) {
  const isIncrease = change >= 0
  const Icon = isIncrease ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-green-700">
      <Icon size={12} strokeWidth={2} className="shrink-0 text-green-700" />
      {isIncrease ? '+' : '−'}
      {Math.abs(change).toLocaleString('en-US')}
    </span>
  )
}

/** Deltas right-align in their own track so counts never shift between years. */
const UNITS_DELTA_W = 68
/** Counts right-align inside this track so every unit noun starts at one x. */
const UNITS_COUNT_W = 64
/** Entitlement and Item share the free space; Units keeps a fixed track wide enough for the longest noun. */
const COLS = 'minmax(0, 1fr) minmax(0, 1fr) 292px'

function frequencySuffix(frequency: string): string {
  const key = frequency.trim().toLowerCase()
  if (key === 'yearly' || key === 'annual' || key === 'annually') return '/year'
  if (key === 'monthly') return '/month'
  if (key === 'weekly') return '/week'
  if (key === 'daily') return '/day'
  if (key === 'one-time' || key === 'one time') return ''
  return frequency ? `/${key}` : ''
}

function TableHeader() {
  return (
    <div
      className="grid items-center border-b border-neutral-200 pb-2 pl-1 pr-2"
      style={{ gridTemplateColumns: COLS }}
    >
      <div className="pr-6 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Entitlement
      </div>
      <div className="pr-6 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Item
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        <span className="shrink-0" style={{ width: UNITS_DELTA_W }} aria-hidden />
        <span className="shrink-0 text-right" style={{ width: UNITS_COUNT_W }}>
          Units
        </span>
        <span className="flex-1" aria-hidden />
      </div>
    </div>
  )
}

function FeatureCell({
  feature,
  isUsage,
  sourceCount,
  onSelectFeature,
}: {
  feature: string
  isUsage: boolean
  sourceCount: number
  onSelectFeature?: () => void
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-1.5 self-stretch pr-6"
      style={{ gridRow: `1 / span ${sourceCount}` }}
    >
      {onSelectFeature ? (
        <button
          type="button"
          onClick={onSelectFeature}
          className="min-w-0 cursor-pointer truncate text-left text-[14px] font-medium leading-normal text-brand-navy transition-colors hover:text-blue-700"
        >
          {feature}
        </button>
      ) : (
        <span className="min-w-0 truncate text-[14px] font-medium leading-normal text-brand-navy">
          {feature}
        </span>
      )}
      {isUsage ? (
        <Gauge
          size={14}
          strokeWidth={2}
          className="shrink-0 text-brand-fog"
          aria-label="Metered feature"
        />
      ) : null}
    </div>
  )
}

export function EntitlementsAllocationTable({
  onSelectFeature,
  year = 1,
}: {
  onSelectFeature?: (featureLabel: string) => void
  year?: 1 | 2 | 3
}) {
  const allocations = allocationsForYear(year)

  return (
    <div className="w-full">
      <TableHeader />
      {allocations.map((group, groupIndex) => {
        const isLastGroup = groupIndex === allocations.length - 1

        return (
          <div
            key={group.id}
            className={cn(
              'grid items-stretch pl-1 pr-2',
              !isLastGroup && 'border-b border-neutral-200'
            )}
            style={{ gridTemplateColumns: COLS }}
          >
            <FeatureCell
              feature={group.feature}
              isUsage={group.kind === 'usage'}
              sourceCount={Math.max(group.sources.length, 1)}
              onSelectFeature={
                onSelectFeature ? () => onSelectFeature(group.feature) : undefined
              }
            />

            {group.sources.map((source, index) => {
              const showSourceRule = index < group.sources.length - 1

              return (
                <div key={source.id} className="contents">
                  <div
                    className={cn(
                      'flex min-h-10 min-w-0 items-center py-2 pr-6',
                      showSourceRule && 'border-b border-neutral-100'
                    )}
                  >
                    <span className="min-w-0 truncate text-[14px] leading-normal text-brand-navy">
                      {source.name}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'flex min-h-10 min-w-0 items-center gap-1.5 whitespace-nowrap py-2 text-[14px] leading-normal text-brand-navy',
                      showSourceRule && 'border-b border-neutral-100'
                    )}
                  >
                    <span
                      className="flex shrink-0 items-center justify-end"
                      style={{ width: UNITS_DELTA_W }}
                    >
                      {source.unitsChange != null ? (
                        <UnitsChangeBadge change={source.unitsChange} />
                      ) : null}
                    </span>
                    <span
                      className="shrink-0 text-right font-medium tabular-nums"
                      style={{ width: UNITS_COUNT_W }}
                    >
                      {source.units}
                    </span>
                    <span className="flex-1 whitespace-nowrap text-left text-[13px] text-brand-fog">
                      {group.unitLabel}
                      {frequencySuffix(source.frequency)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default EntitlementsAllocationTable
