import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, ChevronDown, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type SalesOrder, type SalesOrderRampPeriod } from '@/data/salesOrderMock'
import { GradientSparkle } from '@/components/features/contract-processing'
import { FEATURE_USAGE_INSIGHTS, UsageUbbChart1, getFeatureUsageKpis } from './UsageUbbChart1'
import { TokenBurnDownChart } from './TokenBurnDownChart'
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
  creditUnit?: boolean
}

const FEATURES: FeatureItem[] = [
  { id: 'api-calls', label: 'API calls', usageBased: true },
  { id: 'image-processing', label: 'Image processing', usageBased: true },
  { id: 'storage', label: 'Storage', usageBased: true },
  { id: 'seats', label: 'Seats', usageBased: false },
  { id: 'environments', label: 'Environments', usageBased: false },
  { id: 'tokens', label: 'Tokens', usageBased: false, creditUnit: true },
  { id: 'ai-credits', label: 'AI credits', usageBased: false, creditUnit: true },
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

type TokenGrantRow = {
  id: string
  item: string
  period: string
  grant: number
  rollover: string
  expiry: string
}

type TokenOnDemandRow = {
  id: string
  period: string
  item: string
  billed: number
  unit: string
}

/** Grant sources that make up the 500K annual token credit. */
const TOKEN_GRANT_ROWS: TokenGrantRow[] = [
  {
    id: 'tg-1',
    item: 'Apex platform - growth services',
    period: 'Jan 1 – Dec 31, 2026',
    grant: 350_000,
    rollover: 'None',
    expiry: 'Dec 31, 2026',
  },
  {
    id: 'tg-2',
    item: 'Token pack - annual',
    period: 'Jan 1 – Dec 31, 2026',
    grant: 150_000,
    rollover: '25,000',
    expiry: 'Dec 31, 2026',
  },
]

/** On-demand token overage (none billed yet while remaining balance is positive). */
const TOKEN_ON_DEMAND_ROWS: TokenOnDemandRow[] = []

type CreditLedgerEntryType = 'Grant' | 'Rollover' | 'Usage' | 'Commit' | 'On-demand'

type CreditLedgerRow = {
  id: string
  date: string
  time: string
  type: CreditLedgerEntryType
  description: string
  /** Positive = credit in, negative = debit out. */
  amount: number
  balance: number
}

/**
 * Token credit ledger through July (current month).
 * Balances align with the burn-down remaining series.
 */
const TOKEN_CREDIT_LEDGER_ROWS: CreditLedgerRow[] = [
  {
    id: 'cl-1',
    date: 'Jan 1, 2026',
    time: '00:01:00',
    type: 'Grant',
    description: 'Apex platform - growth services',
    amount: 350_000,
    balance: 350_000,
  },
  {
    id: 'cl-2',
    date: 'Jan 1, 2026',
    time: '00:01:12',
    type: 'Grant',
    description: 'Token pack - annual',
    amount: 125_000,
    balance: 475_000,
  },
  {
    id: 'cl-3',
    date: 'Jan 1, 2026',
    time: '00:02:05',
    type: 'Rollover',
    description: 'Rollover from prior period',
    amount: 25_000,
    balance: 500_000,
  },
  {
    id: 'cl-4',
    date: 'Feb 28, 2026',
    time: '23:59:48',
    type: 'Usage',
    description: 'Token consumption — February',
    amount: -60_000,
    balance: 440_000,
  },
  {
    id: 'cl-5',
    date: 'Mar 31, 2026',
    time: '23:59:51',
    type: 'Usage',
    description: 'Token consumption — March',
    amount: -45_000,
    balance: 395_000,
  },
  {
    id: 'cl-6',
    date: 'Apr 30, 2026',
    time: '23:59:44',
    type: 'Usage',
    description: 'Token consumption — April',
    amount: -40_000,
    balance: 355_000,
  },
  {
    id: 'cl-7',
    date: 'May 31, 2026',
    time: '23:59:57',
    type: 'Usage',
    description: 'Token consumption — May',
    amount: -75_000,
    balance: 280_000,
  },
  {
    id: 'cl-8',
    date: 'Jun 30, 2026',
    time: '23:59:39',
    type: 'Usage',
    description: 'Token consumption — June',
    amount: -45_000,
    balance: 235_000,
  },
  {
    id: 'cl-9',
    date: 'Jul 31, 2026',
    time: '18:42:16',
    type: 'Usage',
    description: 'Token consumption — July',
    amount: -75_000,
    balance: 160_000,
  },
]

/**
 * Image processing usage ledger through July.
 * Balance = remaining included commit (0 once exhausted; on-demand does not reduce further).
 */
const USAGE_LEDGER_ROWS: CreditLedgerRow[] = [
  {
    id: 'ul-1',
    date: 'Jan 1, 2026',
    time: '00:01:00',
    type: 'Commit',
    description: 'Annual image processing commit',
    amount: 3_000,
    balance: 3_000,
  },
  {
    id: 'ul-2',
    date: 'Jan 31, 2026',
    time: '23:59:41',
    type: 'Usage',
    description: 'Image processing — January',
    amount: -400,
    balance: 2_600,
  },
  {
    id: 'ul-3',
    date: 'Feb 28, 2026',
    time: '23:59:48',
    type: 'Usage',
    description: 'Image processing — February',
    amount: -400,
    balance: 2_200,
  },
  {
    id: 'ul-4',
    date: 'Mar 31, 2026',
    time: '23:59:52',
    type: 'Usage',
    description: 'Image processing — March',
    amount: -400,
    balance: 1_800,
  },
  {
    id: 'ul-5',
    date: 'Apr 30, 2026',
    time: '23:59:37',
    type: 'Usage',
    description: 'Image processing — April',
    amount: -600,
    balance: 1_200,
  },
  {
    id: 'ul-6',
    date: 'May 31, 2026',
    time: '23:59:55',
    type: 'Usage',
    description: 'Image processing — May',
    amount: -600,
    balance: 600,
  },
  {
    id: 'ul-7',
    date: 'Jun 30, 2026',
    time: '23:59:44',
    type: 'Usage',
    description: 'Image processing — June',
    amount: -600,
    balance: 0,
  },
  {
    id: 'ul-8',
    date: 'Jul 31, 2026',
    time: '18:42:16',
    type: 'On-demand',
    description: 'Image processing overage — July',
    amount: -250,
    balance: 0,
  },
]

type UsageKpiMetric = {
  label: string
  value: string
}

function UsageKpisRow({ metrics }: { metrics: UsageKpiMetric[] }) {
  return (
    <div className="flex">
      {metrics.map((metric, idx) => (
        <div key={metric.label} className="flex min-w-0 flex-1 items-start">
          <div className="min-w-0 flex-1 py-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-brand-fog">
              {metric.label}
            </p>
            <p className="mt-1 truncate text-[15px] font-semibold text-brand-navy">
              {metric.value}
            </p>
          </div>
          {idx < metrics.length - 1 && (
            <div className="mx-4 h-12 w-px shrink-0 self-center bg-neutral-200" />
          )}
        </div>
      ))}
    </div>
  )
}

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

function TokenGrantsTableHeader() {
  return (
    <div className="flex items-center border-b border-neutral-200 px-3 pb-2 pt-3">
      <div className="min-w-0 flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Item
      </div>
      <div className="w-[180px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Period
      </div>
      <div className="w-[110px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Grant
      </div>
      <div className="w-[100px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Rollover
      </div>
      <div className="w-[110px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Expiry
      </div>
    </div>
  )
}

function TokenGrantsTableRow({
  row,
  isLast,
}: {
  row: TokenGrantRow
  isLast: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center py-2 pl-1 pr-2',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <div className="min-w-0 flex-1 truncate pr-4 text-[14px] font-medium text-brand-navy">
        {row.item}
      </div>
      <div className="w-[180px] shrink-0 truncate pr-4 text-[14px] text-brand-navy">
        {row.period}
      </div>
      <div className="w-[110px] shrink-0 pr-4 text-[14px] tabular-nums text-brand-navy">
        {row.grant.toLocaleString('en-US')}
      </div>
      <div className="w-[100px] shrink-0 pr-4 text-[14px] text-brand-navy">{row.rollover}</div>
      <div className="w-[110px] shrink-0 text-[14px] text-brand-navy">{row.expiry}</div>
    </div>
  )
}

function TokenGrantsTable() {
  return (
    <div>
      <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
        Grants
      </h3>
      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <TokenGrantsTableHeader />
        <div className="px-2 pb-1">
          {TOKEN_GRANT_ROWS.map((row, idx) => (
            <TokenGrantsTableRow
              key={row.id}
              row={row}
              isLast={idx === TOKEN_GRANT_ROWS.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TokenOnDemandTable() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          On-demand
        </h3>
        <span className="text-[12px] text-brand-mist" aria-hidden>
          ·
        </span>
        <span className="text-[12px] text-brand-fog">Billed monthly</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <UsageTableHeader />
        <div className="px-2 pb-1">
          {TOKEN_ON_DEMAND_ROWS.length === 0 ? (
            <p className="px-1 py-3 text-[14px] text-brand-fog">
              No on-demand token usage yet — remaining balance covers current consumption.
            </p>
          ) : (
            TOKEN_ON_DEMAND_ROWS.map((row, idx) => (
              <UsageTableRow
                key={row.id}
                period={row.period}
                usage={
                  <span className="text-[14px] text-brand-navy">
                    {row.billed.toLocaleString('en-US')} {row.unit} billed
                  </span>
                }
                item={row.item}
                isLast={idx === TOKEN_ON_DEMAND_ROWS.length - 1}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function formatLedgerAmount(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US')
  if (amount > 0) return `+${formatted}`
  if (amount < 0) return `−${formatted}`
  return formatted
}

function CreditLedgerTypeBadge({ type }: { type: CreditLedgerEntryType }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
        type === 'Grant' && 'bg-emerald-50 text-emerald-800',
        type === 'Commit' && 'bg-emerald-50 text-emerald-800',
        type === 'Rollover' && 'bg-sky-50 text-sky-800',
        type === 'Usage' && 'bg-neutral-100 text-brand-navy',
        type === 'On-demand' && 'bg-orange-50 text-[#d96138]'
      )}
    >
      {type}
    </span>
  )
}

function CreditLedgerTableHeader() {
  return (
    <div className="flex items-center border-b border-neutral-200 px-3 pb-2 pt-3">
      <div className="w-[120px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Date
      </div>
      <div className="w-[88px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Time
      </div>
      <div className="w-[108px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Type
      </div>
      <div className="min-w-0 flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Description
      </div>
      <div className="w-[110px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Amount
      </div>
      <div className="w-[110px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Balance
      </div>
    </div>
  )
}

function CreditLedgerTableRow({
  row,
  isLast,
}: {
  row: CreditLedgerRow
  isLast: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center py-2 pl-1 pr-2',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <div className="w-[120px] shrink-0 pr-4 text-[14px] text-brand-navy">{row.date}</div>
      <div className="w-[88px] shrink-0 pr-4 text-[14px] tabular-nums text-brand-fog">
        {row.time}
      </div>
      <div className="w-[108px] shrink-0 pr-4">
        <CreditLedgerTypeBadge type={row.type} />
      </div>
      <div className="min-w-0 flex-1 truncate pr-4 text-[14px] text-brand-navy">
        {row.description}
      </div>
      <div
        className={cn(
          'w-[110px] shrink-0 pr-4 text-right text-[14px] tabular-nums',
          row.amount > 0 ? 'text-emerald-700' : 'text-brand-navy'
        )}
      >
        {formatLedgerAmount(row.amount)}
      </div>
      <div className="w-[110px] shrink-0 text-right text-[14px] tabular-nums text-brand-navy">
        {row.balance.toLocaleString('en-US')}
      </div>
    </div>
  )
}

function CreditLedgerTable({
  title,
  rows,
}: {
  title: string
  rows: CreditLedgerRow[]
}) {
  const rowsNewestFirst = [...rows].reverse()

  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          {title}
        </h3>
        <span className="text-[12px] text-brand-mist" aria-hidden>
          ·
        </span>
        <span className="text-[12px] text-brand-fog">Newest first</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <CreditLedgerTableHeader />
        <div className="px-2 pb-1">
          {rowsNewestFirst.map((row, idx) => (
            <CreditLedgerTableRow
              key={row.id}
              row={row}
              isLast={idx === rowsNewestFirst.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TokenCreditLedgerTable() {
  return <CreditLedgerTable title="Credit ledger" rows={TOKEN_CREDIT_LEDGER_ROWS} />
}

function UsageLedgerTable() {
  return <CreditLedgerTable title="Usage ledger" rows={USAGE_LEDGER_ROWS} />
}

type FeatureCategory = 'entitlements' | 'credit-units'

function FeatureList({
  features,
  selectedId,
  onSelect,
}: {
  features: FeatureItem[]
  selectedId: string
  onSelect: (feature: FeatureItem) => void
}) {
  const entitlements = features.filter((f) => !f.creditUnit)
  const creditUnits = features.filter((f) => f.creditUnit)
  const selected = features.find((f) => f.id === selectedId)
  const activeCategory: FeatureCategory = selected?.creditUnit
    ? 'credit-units'
    : 'entitlements'
  const visibleFeatures =
    activeCategory === 'credit-units' ? creditUnits : entitlements

  const selectCategory = (category: FeatureCategory) => {
    const pool = category === 'credit-units' ? creditUnits : entitlements
    if (pool.length === 0) return
    const alreadyInCategory = pool.some((f) => f.id === selectedId)
    if (!alreadyInCategory) onSelect(pool[0])
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 pl-2 pr-2 pb-4">
        <div className="flex items-start gap-2 px-0.5">
          <button
            type="button"
            onClick={() => selectCategory('entitlements')}
            aria-pressed={activeCategory === 'entitlements'}
            className={cn(
              'min-w-0 flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-left transition-colors',
              activeCategory === 'entitlements'
                ? 'bg-neutral-100'
                : 'hover:bg-neutral-50'
            )}
          >
            <div className="text-[16px] font-bold leading-tight text-brand-navy">
              {entitlements.length}
            </div>
            <div className="text-[13px] text-brand-navy">Entitlements</div>
          </button>
          <button
            type="button"
            onClick={() => selectCategory('credit-units')}
            aria-pressed={activeCategory === 'credit-units'}
            className={cn(
              'min-w-0 flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-left transition-colors',
              activeCategory === 'credit-units'
                ? 'bg-neutral-100'
                : 'hover:bg-neutral-50'
            )}
          >
            <div className="text-[16px] font-bold leading-tight text-brand-navy">
              {creditUnits.length}
            </div>
            <div className="text-[13px] text-brand-navy">Credit units</div>
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4 pl-2 pr-2">
        {visibleFeatures.map((feature) => {
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

  const usageKpis = getFeatureUsageKpis(selected.label)

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
                <div className="mb-6">
                  <UsageKpisRow
                    metrics={[
                      {
                        label: 'Committed usage',
                            value: `${usageKpis.commitRemaining.toLocaleString('en-US')} / ${usageKpis.commitTotal.toLocaleString('en-US')} ${usageKpis.unit}`,
                      },
                      {
                        label: 'On-demand usage',
                        value: `${usageKpis.onDemandUsage.toLocaleString('en-US')} ${usageKpis.unit} · ${usageKpis.onDemandAmount.toLocaleString(
                          'en-US',
                          {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}`,
                      },
                    ]}
                  />
                </div>
                <UsageUbbChart1
                  key={`${selected.label}-${selectedPeriodId}`}
                  featureLabel={selected.label}
                />
              </div>
            </section>

            <section className="group/section space-y-8">
              <CommittedUsageTable />
              <OnDemandUsageTable />
              <UsageLedgerTable />
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
        ) : selected.creditUnit && selected.id === 'tokens' ? (
          <div className="mx-auto space-y-10 pt-12" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
            <section className="group/section space-y-6">
              <div className="mb-3 flex items-center gap-1.5">
                <GradientSparkle size={16} />
                <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
                  Summary
                </span>
              </div>
              <h2 className="max-w-[820px] font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
                Token credits are burning ahead of the ideal pace — 160,000 remain of the
                500,000 annual grant, with projected overage by year-end.
              </h2>
              {periods.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="shrink-0 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
                    Tokens
                  </h3>
                  <span className="h-4 w-px shrink-0 bg-neutral-300" aria-hidden />
                  <PeriodDropdown
                    periods={periods}
                    value={selectedPeriodId || periods[0].id}
                    onChange={setSelectedPeriodId}
                  />
                </div>
              ) : (
                <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
                  Tokens
                </h3>
              )}
              <TokenBurnDownChart key={`tokens-${selectedPeriodId}`} />
            </section>

            <section className="group/section space-y-8">
              <TokenGrantsTable />
              <TokenOnDemandTable />
              <TokenCreditLedgerTable />
            </section>
          </div>
        ) : selected.creditUnit ? (
          <div className="mx-auto space-y-6 pt-12" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
            <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
              {selected.label}
            </h2>
            <p className="text-[14px] text-brand-fog">
              Credit unit details will appear here.
            </p>
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
