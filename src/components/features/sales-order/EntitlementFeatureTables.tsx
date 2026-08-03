import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EntitlementFeatureKey = 'Seats' | 'Environments'

type EntitlementLine = {
  id: string
  itemName: string
  frequency: string
  entitlement: string
}

type EntitlementPeriod = {
  id: string
  label: string
  startDate: string
  endDate: string
  rows: EntitlementLine[]
}

const FREQ_W = 120
const ENTITLEMENT_W = 140

/** Period tables shown when Seats / Environments are opened. */
export const ENTITLEMENT_FEATURE_PERIODS: Record<EntitlementFeatureKey, EntitlementPeriod[]> = {
  Seats: [
    {
      id: 'seat-year-1',
      label: 'Year 1',
      startDate: '1 May 2026',
      endDate: '30 Apr 2027',
      rows: [
        {
          id: 'seat-y1-1',
          itemName: 'Apex platform - growth services',
          frequency: 'Yearly',
          entitlement: '50 seats',
        },
      ],
    },
    {
      id: 'seat-year-2',
      label: 'Year 2',
      startDate: '1 May 2027',
      endDate: '30 Apr 2028',
      rows: [
        {
          id: 'seat-y2-1',
          itemName: 'Apex platform - growth services',
          frequency: 'Yearly',
          entitlement: '75 seats',
        },
      ],
    },
  ],
  Environments: [
    {
      id: 'env-year-1-3',
      label: 'Year 1–3',
      startDate: '1 May 2026',
      endDate: '30 Apr 2029',
      rows: [
        {
          id: 'env-y1-1',
          itemName: 'Sandbox environments',
          frequency: 'Yearly',
          entitlement: '5 sandboxes',
        },
      ],
    },
  ],
}

function PeriodIdentity({ period }: { period: EntitlementPeriod }) {
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
    </div>
  )
}

function ColumnLabels() {
  return (
    <>
      <div
        style={{ width: FREQ_W }}
        className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy"
      >
        Frequency
      </div>
      <div
        style={{ width: ENTITLEMENT_W }}
        className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy"
      >
        Entitlements
      </div>
    </>
  )
}

function LineRow({ row, isLast }: { row: EntitlementLine; isLast: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center py-2 pl-1 pr-2',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center truncate pr-4">
        <span className="truncate text-[14px] font-medium text-brand-navy">{row.itemName}</span>
      </div>
      <div style={{ width: FREQ_W }} className="shrink-0 text-[14px] text-brand-navy">
        {row.frequency}
      </div>
      <div
        style={{ width: ENTITLEMENT_W }}
        className="shrink-0 text-right text-[14px] font-medium text-brand-navy"
      >
        {row.entitlement}
      </div>
    </div>
  )
}

function PeriodTable({ period }: { period: EntitlementPeriod }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center border-b border-neutral-200 px-3 pb-2 pt-3">
        <div className="flex min-w-0 flex-1 items-center">
          <PeriodIdentity period={period} />
        </div>
        <ColumnLabels />
      </div>
      <div className="px-2 pb-1">
        {period.rows.map((row, idx) => (
          <LineRow
            key={row.id}
            row={row}
            isLast={idx === period.rows.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Period tables for a non–usage-based entitlement (Seats / Environments).
 * Seats ramps Year 1 → Year 2; Environments is one box spanning Year 1–3.
 */
export function EntitlementFeatureTables({
  feature,
}: {
  feature: EntitlementFeatureKey
}) {
  const periods = ENTITLEMENT_FEATURE_PERIODS[feature]

  return (
    <div className="space-y-4">
      {periods.map((period) => (
        <PeriodTable key={period.id} period={period} />
      ))}
    </div>
  )
}

export function isEntitlementFeatureKey(label: string): label is EntitlementFeatureKey {
  return label === 'Seats' || label === 'Environments'
}

export default EntitlementFeatureTables
