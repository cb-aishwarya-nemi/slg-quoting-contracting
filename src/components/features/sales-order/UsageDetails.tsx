import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, ChevronDown, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type SalesOrder, type SalesOrderRampPeriod } from '@/data/salesOrderMock'
import { GradientSparkle } from '@/components/features/contract-processing'
import { FEATURE_USAGE_INSIGHTS, UsageUbbChart1 } from './UsageUbbChart1'
import {
  EntitlementFeatureTables,
  isEntitlementFeatureKey,
} from './EntitlementFeatureTables'

const LEFT_PANEL_WIDTH = 300
const CONTENT_MAX_WIDTH = 1040

type FeatureItem = {
  id: string
  label: string
  usageBased: boolean
}

const FEATURES: FeatureItem[] = [
  { id: 'api-calls', label: 'API calls', usageBased: true },
  { id: 'image-processing', label: 'Image processing', usageBased: true },
  { id: 'storage', label: 'Storage', usageBased: true },
  { id: 'seats', label: 'Seats', usageBased: false },
  { id: 'environments', label: 'Environments', usageBased: false },
]

const FEATURE_ID_BY_LABEL: Record<string, string> = Object.fromEntries(
  FEATURES.map((f) => [f.label, f.id])
)

export function featureIdFromLabel(label: string): string | undefined {
  return FEATURE_ID_BY_LABEL[label]
}

type CommittedUsageRow = {
  id: string
  period: string
  item: string
  used: number
  total: number
  unit: string
}

type OnDemandUsageRow = {
  id: string
  period: string
  item: string
  billed: number
  unit: string
}

const COMMITTED_USAGE_ROWS: CommittedUsageRow[] = [
  {
    id: 'cu-1',
    period: 'May 1 – Jul 31, 2026',
    item: 'Apex platform - growth services',
    used: 750,
    total: 3_000,
    unit: 'images',
  },
  {
    id: 'cu-2',
    period: 'Jan 1 – Apr 30, 2026',
    item: 'Sandbox environments',
    used: 2_400,
    total: 2_400,
    unit: 'images',
  },
]

const ON_DEMAND_USAGE_ROWS: OnDemandUsageRow[] = [
  {
    id: 'od-1',
    period: 'Jul 1 – Jul 31, 2026',
    item: 'Premium support SLA',
    billed: 250,
    unit: 'images',
  },
]

function formatPeriodRange(period: SalesOrderRampPeriod): string {
  return `${period.startDate} – ${period.endDate}`
}

function formatPeriodLabel(period: SalesOrderRampPeriod, index: number): string {
  const yearMatch = period.label.match(/Period\s+(\d+)/i)
  if (yearMatch) return `Year ${yearMatch[1]}`
  return `Year ${index + 1}`
}

function PeriodDropdown({
  periods,
  value,
  onChange,
}: {
  periods: SalesOrderRampPeriod[]
  value: string
  onChange: (periodId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selectedIndex = Math.max(
    0,
    periods.findIndex((p) => p.id === value)
  )
  const selected = periods[selectedIndex] ?? periods[0]

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!selected) return null

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-[13px] font-semibold text-brand-navy transition-colors hover:bg-neutral-100"
      >
        <span>{formatPeriodLabel(selected, selectedIndex)}</span>
        <span className="font-normal text-brand-fog">· {formatPeriodRange(selected)}</span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-brand-fog transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 min-w-[280px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {periods.map((period, index) => (
            <button
              key={period.id}
              type="button"
              role="option"
              aria-selected={period.id === selected.id}
              onClick={() => {
                onChange(period.id)
                setOpen(false)
              }}
              className={cn(
                'flex w-full cursor-pointer flex-col px-3 py-2 text-left transition-colors hover:bg-neutral-50',
                period.id === selected.id ? 'bg-neutral-50' : null
              )}
            >
              <span
                className={cn(
                  'text-[13px]',
                  period.id === selected.id
                    ? 'font-semibold text-blue-700'
                    : 'font-medium text-brand-navy'
                )}
              >
                {formatPeriodLabel(period, index)}
              </span>
              <span className="text-[12px] text-brand-fog">{formatPeriodRange(period)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Circular progress ring matching Chargebee usage grant meters. */
function UsageGrantRing({ ratio, exhausted }: { ratio: number; exhausted: boolean }) {
  const size = 16
  const stroke = 2
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, ratio))
  const color = exhausted ? '#dc2626' : '#3b82f6'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${clamped * c} ${c}`}
      />
    </svg>
  )
}

function CommittedUsageCell({ row }: { row: CommittedUsageRow }) {
  const exhausted = row.used >= row.total && row.total > 0
  const ratio = row.total > 0 ? row.used / row.total : 0

  return (
    <span className="inline-flex items-center gap-2">
      <UsageGrantRing ratio={ratio} exhausted={exhausted} />
      <span className={cn('text-[14px] text-brand-navy', exhausted && 'text-red-600')}>
        {row.used.toLocaleString('en-US')}/{row.total.toLocaleString('en-US')} {row.unit}
      </span>
    </span>
  )
}

function OnDemandUsageCell({ row }: { row: OnDemandUsageRow }) {
  return (
    <span className="text-[14px] text-brand-navy">
      {row.billed.toLocaleString('en-US')} {row.unit} billed
    </span>
  )
}

function UsageTableHeader() {
  return (
    <div className="flex items-center border-b border-neutral-200 px-3 pb-2 pt-3">
      <div className="min-w-0 flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Period
      </div>
      <div className="w-[260px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Usage
      </div>
      <div className="min-w-0 flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Item
      </div>
    </div>
  )
}

function UsageTableRow({
  period,
  usage,
  item,
  isLast,
}: {
  period: string
  usage: ReactNode
  item: string
  isLast: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center py-2 pl-1 pr-2',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <div className="min-w-0 flex-1 truncate pr-4 text-[14px] text-brand-navy">{period}</div>
      <div className="w-[260px] shrink-0 pr-4 text-[14px] text-brand-navy">{usage}</div>
      <div className="flex min-w-0 flex-1 items-center truncate pr-2">
        <span className="truncate text-[14px] text-brand-navy">{item}</span>
      </div>
    </div>
  )
}

function CommittedUsageTable() {
  return (
    <div>
      <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
        Committed usage
      </h3>
      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <UsageTableHeader />
        <div className="px-2 pb-1">
          {COMMITTED_USAGE_ROWS.map((row, idx) => (
            <UsageTableRow
              key={row.id}
              period={row.period}
              usage={<CommittedUsageCell row={row} />}
              item={row.item}
              isLast={idx === COMMITTED_USAGE_ROWS.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function OnDemandUsageTable() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          On-demand usage
        </h3>
        <span className="text-[12px] text-brand-mist" aria-hidden>
          ·
        </span>
        <span className="text-[12px] text-brand-fog">Billed monthly</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <UsageTableHeader />
        <div className="px-2 pb-1">
          {ON_DEMAND_USAGE_ROWS.map((row, idx) => (
            <UsageTableRow
              key={row.id}
              period={row.period}
              usage={<OnDemandUsageCell row={row} />}
              item={row.item}
              isLast={idx === ON_DEMAND_USAGE_ROWS.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FeatureList({
  features,
  selectedId,
  onSelect,
}: {
  features: FeatureItem[]
  selectedId: string
  onSelect: (feature: FeatureItem) => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 pl-2 pr-2 pb-4">
        <div className="px-2.5">
          <div className="text-[16px] font-bold leading-tight text-brand-navy">
            {features.length}
          </div>
          <div className="text-[13px] text-brand-navy">Entitlements</div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4 pl-2 pr-2">
        {features.map((feature) => {
          const isSelected = feature.id === selectedId

          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => onSelect(feature)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left transition-colors',
                isSelected
                  ? 'bg-brand-navy text-white'
                  : 'hover:bg-neutral-100'
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                <span
                  className={cn(
                    'shrink-0 text-[13px] font-semibold',
                    isSelected ? 'text-white' : 'text-brand-navy'
                  )}
                >
                  {feature.label}
                </span>
                {feature.usageBased ? (
                  <Gauge
                    size={13}
                    strokeWidth={2}
                    className={cn(
                      'shrink-0',
                      isSelected ? 'text-white/70' : 'text-brand-fog'
                    )}
                    aria-hidden
                  />
                ) : null}
              </span>
              {isSelected ? (
                <ArrowRight size={14} className="shrink-0 text-white" aria-hidden />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function UsageDetails({
  order,
  initialFeatureId,
}: {
  order: SalesOrder
  initialFeatureId?: string | null
}) {
  const periods = order.productPeriods ?? []
  const [selectedId, setSelectedId] = useState(() => {
    if (initialFeatureId && FEATURES.some((f) => f.id === initialFeatureId)) {
      return initialFeatureId
    }
    return 'image-processing'
  })
  const [selectedPeriodId, setSelectedPeriodId] = useState(
    () => periods[0]?.id ?? ''
  )

  useEffect(() => {
    if (!initialFeatureId) return
    if (!FEATURES.some((f) => f.id === initialFeatureId)) return
    setSelectedId(initialFeatureId)
  }, [initialFeatureId])

  const selected =
    FEATURES.find((f) => f.id === selectedId) ??
    FEATURES.find((f) => f.usageBased) ??
    FEATURES[0]

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 overflow-hidden pl-6 pr-12">
      <aside
        className="flex min-h-0 shrink-0 flex-col pt-12"
        style={{ width: LEFT_PANEL_WIDTH }}
      >
        <FeatureList
          features={FEATURES}
          selectedId={selected.id}
          onSelect={(feature) => setSelectedId(feature.id)}
        />
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-24 pl-10">
        {selected.usageBased ? (
          <div className="mx-auto space-y-10 pt-12" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
            <section className="group/section">
              <div className="mb-3 flex items-center gap-1.5">
                <GradientSparkle size={16} />
                <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
                  Summary
                </span>
              </div>
              <h2 className="max-w-[820px] font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
                {FEATURE_USAGE_INSIGHTS[selected.label] ??
                  FEATURE_USAGE_INSIGHTS['Image processing']}
              </h2>
              <div className="mt-8">
                {periods.length > 0 ? (
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h3 className="shrink-0 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
                      {selected.label}
                    </h3>
                    <span
                      className="h-4 w-px shrink-0 bg-neutral-300"
                      aria-hidden
                    />
                    <PeriodDropdown
                      periods={periods}
                      value={selectedPeriodId || periods[0].id}
                      onChange={setSelectedPeriodId}
                    />
                  </div>
                ) : null}
                <UsageUbbChart1
                  key={`${selected.label}-${selectedPeriodId}`}
                  featureLabel={selected.label}
                />
              </div>
            </section>

            <section className="group/section space-y-8">
              <CommittedUsageTable />
              <OnDemandUsageTable />
            </section>
          </div>
        ) : isEntitlementFeatureKey(selected.label) ? (
          <div className="mx-auto space-y-6 pt-12" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
            <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
              {selected.label}
            </h2>
            <div style={{ maxWidth: 640 }}>
              <EntitlementFeatureTables key={selected.label} feature={selected.label} />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center pt-12">
            <p className="text-[14px] text-brand-fog">
              Select a feature to view details.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsageDetails
