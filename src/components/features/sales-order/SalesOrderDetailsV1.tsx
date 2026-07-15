import { useState, useRef, useEffect, useCallback, useMemo, useId, type ReactNode } from 'react'
import {
  Maximize2,
  Focus,
  MoreHorizontal,
  FilePenLine,
  Download,
  MessageCircleMore,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  InPageNav,
  SectionHeader,
  CommentsPanel,
  GradientSparkle,
  type NavSection,
} from '@/components/features/contract-processing'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { STATUS_STYLES, type InvoiceStatus } from '@/data/invoiceListMock'
import {
  type SalesOrder,
  type ActivityItem,
  type UsageSummaryFeature,
  type UsageSummaryCycle,
  getUsageSummaryCycles,
} from '@/data/salesOrderMock'
import {
  getSalesOrderPaymentSummary,
  getUsageAttentionSignal,
  salesOrdersListData,
  type SalesOrderListItem,
  type InvoiceTimingTone,
  type UsageTermRow,
} from '@/data/salesOrdersListMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'

const NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'ai' },
  { id: 'entitlements', label: 'Usage summary', status: 'neutral' },
  { id: 'products', label: 'Products and pricing', status: 'neutral' },
  { id: 'invoices', label: 'Past invoices', status: 'neutral' },
  { id: 'schedule', label: 'Upcoming billing schedule', status: 'neutral' },
  { id: 'comments', label: 'Comments', status: 'neutral' },
  { id: 'activity', label: 'Activity', status: 'neutral' },
]

const LEFT_NAV_WIDTH = 48
// Shift the in-page nav rail so it aligns with the SO id label (past the switcher
// chevron ≈ 20px button + 8px gap), not the switcher icon.
const NAV_ALIGN_OFFSET = 24
const CONTENT_MAX_WIDTH = 1040
const SECTION_DATA_CONTAINER = 'overflow-hidden rounded-lg border border-neutral-200'

const SCHEDULE_STATUS_STYLES: Record<BillingStatus, { bg: string; text: string }> = {
  Paid: { bg: 'bg-green-50', text: 'text-green-700' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  Upcoming: { bg: 'bg-neutral-100', text: 'text-brand-fog' },
}

type BillingStatus = 'Paid' | 'Pending' | 'Upcoming'

interface SalesOrderDetailsProps {
  order: SalesOrder
  orders: SalesOrder[]
  activeOrderId: string
  onSelectOrder: (id: string) => void
}

const INVOICE_TIMING_STYLES: Record<InvoiceTimingTone, string> = {
  positive: 'text-green-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  muted: 'text-brand-fog',
}

function resolveListItem(order: SalesOrder): SalesOrderListItem {
  return (
    salesOrdersListData.find((item) => item.id === order.id) ?? {
      id: order.id,
      soId: order.soId,
      customer: order.customerName,
      customerId: 'pioneer-systems',
      tcv: order.totalContractValue,
      dealTag: order.dealTag,
      createdOn: order.createdOn,
      nextInvoice: '—',
      starts: order.startDate,
      expires: '—',
      status: 'Active',
    }
  )
}

const ATTENTION_INVOICE_ROW =
  'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] items-center gap-x-6 border-b border-neutral-200 py-2.5'

const USAGE_INCLUDED_STYLES: Record<'default' | 'warning' | 'danger', string> = {
  default: 'text-brand-navy',
  warning: 'text-amber-700',
  danger: 'text-red-700',
}

function UsageAmountDisplay({
  included,
  onDemand,
  includedTone = 'default',
}: {
  included: string
  onDemand: string
  includedTone?: 'default' | 'warning' | 'danger'
}) {
  const onDemandValue = onDemand.replace(/,/g, '')
  const hasOnDemand = onDemandValue !== '' && Number(onDemandValue) !== 0

  return (
    <p className="min-w-0 whitespace-nowrap text-left text-[13px] tabular-nums text-brand-navy">
      <span className={cn('font-semibold', USAGE_INCLUDED_STYLES[includedTone])}>{included}</span>
      {hasOnDemand && (
        <>
          <span className="px-1.5 text-brand-mist">·</span>
          <span className="font-medium">{onDemand}</span>
          <span className="font-normal text-brand-fog"> on-demand</span>
        </>
      )}
    </p>
  )
}

function PaymentDetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={cn('flex items-center gap-4 border-b border-neutral-200 py-2.5')}>
      <span className="w-[104px] shrink-0 text-[11px] uppercase tracking-[-0.25px] text-brand-fog">
        {label}
      </span>
      <p className="min-w-0 flex-1 whitespace-nowrap text-[13px] text-brand-navy">
        <span className="font-medium">{value}</span>
        {sub && (
          <>
            <span className="px-1.5 text-brand-mist">·</span>
            <span className="font-normal text-brand-fog">{sub}</span>
          </>
        )}
      </p>
    </div>
  )
}

const ATTENTION_ACTION_CLASS =
  'shrink-0 cursor-pointer rounded-md border border-brand-navy bg-white px-2.5 py-1 text-[12px] font-medium text-brand-navy transition-colors hover:bg-neutral-50'

function AttentionItem({
  headline,
  summary,
  actionLabel,
  showAction = true,
}: {
  headline: ReactNode
  summary: ReactNode
  actionLabel: string
  showAction?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="max-w-[720px] shrink-0 font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.5px] text-brand-navy">
          {headline}
        </h2>
        <div className="h-px min-w-6 flex-1 bg-brand-navy" />
        {showAction && (
          <button type="button" className={ATTENTION_ACTION_CLASS}>
            {actionLabel}
          </button>
        )}
      </div>
      <p className="mt-3 max-w-[720px] text-[13px] leading-[1.6] text-brand-navy">{summary}</p>
    </div>
  )
}

function UsagePatternTooltip({
  point,
}: {
  point: {
    key: string
    month: string
    included: number
    onDemand: number
    cap: number
    total: number
    projected?: number
  }
}) {
  return (
    <div className="w-[240px] shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 shadow-lg">
      <p className="text-[11px] font-semibold text-brand-navy">{point.key}</p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-brand-fog">
            <svg width="14" height="6" aria-hidden className="shrink-0">
              <line
                x1="0"
                y1="3"
                x2="14"
                y2="3"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="3 2"
              />
            </svg>
            Monthly quota
          </span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] font-medium tabular-nums text-brand-navy">
            {formatUsageChartValue(point.cap)} images
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-brand-fog">
            <span
              className="inline-block h-2 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: '#22863a' }}
            />
            Included usage
          </span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] font-medium tabular-nums text-brand-navy">
            {point.included > 0 ? `${formatUsageChartValue(point.included)} images` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-brand-fog">
            <span
              className="inline-block h-2 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: '#d96138' }}
            />
            On-demand usage
          </span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] font-medium tabular-nums text-brand-navy">
            {point.onDemand > 0 ? `${formatUsageChartValue(point.onDemand)} images` : '—'}
          </span>
        </div>
        {point.projected != null && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-brand-fog">
              <svg width="14" height="6" aria-hidden className="shrink-0">
                <line
                  x1="0"
                  y1="3"
                  x2="14"
                  y2="3"
                  stroke="#22863a"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              </svg>
              Projected EOM
            </span>
            <span className="shrink-0 whitespace-nowrap text-right text-[11px] font-medium tabular-nums text-brand-navy">
              {formatUsageChartValue(point.projected)} images
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function UsagePatternChart({ terms }: { terms: UsageTermRow[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const points = useMemo(() => {
    return [...terms].reverse().map((row) => {
      const [usedRaw, capRaw] = row.included.split('/')
      const included = parseUsageQuantity(usedRaw) ?? 0
      const cap = parseUsageQuantity(capRaw) ?? 0
      const onDemand = parseUsageQuantity(row.onDemand) ?? 0
      const month = row.billingTerm.split(/\s+/)[0] ?? row.billingTerm
      return {
        key: row.billingTerm,
        month,
        included,
        onDemand,
        cap,
        total: included + onDemand,
        projected: row.projected,
      }
    })
  }, [terms])

  const cap = points.reduce((max, point) => Math.max(max, point.cap), 0)
  const peak = points.reduce(
    (max, point) => Math.max(max, point.total, point.cap, point.projected ?? 0),
    0
  )
  const yMax = (() => {
    if (peak <= 0) return 1
    const rough = peak * 1.15
    const step = rough <= 1000 ? 200 : rough <= 3000 ? 500 : 1000
    return Math.ceil(rough / step) * step
  })()
  const yTickCount = 4
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => (yMax / yTickCount) * i)

  const plot = { left: 0, right: 168, top: 20, bottom: 32, width: 620, height: 200 }
  const innerW = plot.width - plot.left - plot.right
  const innerH = plot.height - plot.top - plot.bottom
  const axisY = plot.top + innerH
  const axisX = plot.left
  const seriesPadLeft = 0
  const seriesPadRight = 36
  const seriesW = Math.max(innerW - seriesPadLeft - seriesPadRight, 1)

  const valueToY = (value: number) => plot.top + innerH * (1 - value / yMax)
  const indexToX = (index: number) =>
    points.length <= 1
      ? plot.left + seriesPadLeft + seriesW / 2
      : plot.left + seriesPadLeft + (seriesW * index) / (points.length - 1)

  const plotted = points.map((point, index) => ({
    ...point,
    x: indexToX(index),
    y: valueToY(point.total),
    projectedY: point.projected != null ? valueToY(point.projected) : null,
    index,
  }))
  const linePath = plotted
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const areaPath =
    plotted.length > 0
      ? [
          `M ${plotted[0].x} ${axisY}`,
          ...plotted.map((point) => `L ${point.x} ${point.y}`),
          `L ${plotted[plotted.length - 1].x} ${axisY}`,
          'Z',
        ].join(' ')
      : ''
  const projectedSegments = plotted.flatMap((point, index) => {
    if (point.projected == null || point.projectedY == null || index === 0) return []
    const previous = plotted[index - 1]
    return [{ point, previous }]
  })
  const capY = valueToY(cap)
  const capLineEnd = plot.left + innerW
  const quotaLabel = `Monthly quota: ${formatUsageChartValue(cap)} images`
  const quotaPillWidth = 156
  const quotaPillX = capLineEnd + 8
  const quotaStroke = '#94a3b8'
  const quotaPillFill = '#f1f5f9'
  const quotaPillText = '#475569'
  const hoverAccent = '34, 134, 58'
  const hoveredPoint = hoveredIndex !== null ? plotted[hoveredIndex] : null
  const slotHalf =
    plotted.length <= 1 ? seriesW / 2 : seriesW / (2 * Math.max(plotted.length - 1, 1))
  const tooltipSide =
    hoveredPoint == null
      ? 'center'
      : hoveredPoint.x / plot.width < 0.28
        ? 'left'
        : hoveredPoint.x / plot.width > 0.68
          ? 'right'
          : 'center'

  return (
    <div className="relative z-10 mt-8 max-w-[660px] overflow-visible">
      <div className="relative z-20 w-full overflow-visible">
        <svg
          viewBox={`0 0 ${plot.width} ${plot.height}`}
          className="relative z-0 h-[200px] w-full"
          role="img"
          aria-label="Images created in past 6 months"
          preserveAspectRatio="xMidYMid meet"
        >
          {yTicks.map((tick) => {
            if (tick <= 0) return null
            const y = valueToY(tick)
            return (
              <line
                key={`ytick-${tick}`}
                x1={axisX}
                y1={y}
                x2={plot.left + innerW}
                y2={y}
                stroke="#eef2f6"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}

          {/* Axes */}
          <line
            x1={axisX}
            y1={axisY}
            x2={plot.left + innerW}
            y2={axisY}
            stroke="#d8dee8"
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
          />

          {cap > 0 && (
            <g>
              <line
                x1={axisX}
                y1={capY}
                x2={capLineEnd}
                y2={capY}
                stroke={quotaStroke}
                strokeWidth="1.75"
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={quotaPillX}
                y={capY - 9}
                width={quotaPillWidth}
                height={18}
                rx="9"
                fill={quotaPillFill}
              />
              <text
                x={quotaPillX + quotaPillWidth / 2}
                y={capY + 3.5}
                textAnchor="middle"
                fill={quotaPillText}
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {quotaLabel}
              </text>
            </g>
          )}

          {areaPath && (
            <path
              d={areaPath}
              fill="rgba(34, 134, 58, 0.1)"
              className="transition-opacity duration-150"
              style={{ opacity: hoveredIndex === null ? 1 : 0.55 }}
            />
          )}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#22863a"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="transition-opacity duration-150"
              style={{ opacity: hoveredIndex === null ? 1 : 0.7 }}
            />
          )}

          {projectedSegments.map(({ point, previous }) => (
            <g
              key={`projected-${point.key}`}
              className="transition-opacity duration-150"
              style={{
                opacity:
                  hoveredIndex === null ||
                  hoveredIndex === point.index ||
                  hoveredIndex === previous.index
                    ? 1
                    : 0.35,
              }}
              pointerEvents="none"
            >
              <line
                x1={previous.x}
                y1={previous.y}
                x2={point.x}
                y2={point.projectedY!}
                stroke="#22863a"
                strokeWidth="2"
                strokeDasharray="4 3"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={point.x}
                cy={point.projectedY!}
                r="3.5"
                fill="white"
                stroke="#22863a"
                strokeWidth="2"
                strokeDasharray="2.5 2"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={point.x}
                y={point.projectedY! - 10}
                textAnchor="middle"
                fill="#64748b"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {formatUsageChartValue(point.projected!)} projected
              </text>
            </g>
          ))}

          {hoveredPoint && (
            <g pointerEvents="none">
              <rect
                x={hoveredPoint.x - slotHalf}
                y={plot.top}
                width={slotHalf * 2}
                height={axisY - plot.top}
                fill={`rgba(${hoverAccent}, 0.06)`}
              />
              <line
                x1={hoveredPoint.x}
                y1={plot.top}
                x2={hoveredPoint.x}
                y2={axisY}
                stroke={`rgba(${hoverAccent}, 0.25)`}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}

          {plotted.map((point) => {
            const isHovered = hoveredIndex === point.index
            const isDimmed = hoveredIndex !== null && !isHovered
            const hasProjection =
              point.projected != null && point.projectedY != null
            return (
              <g key={point.key} className="pointer-events-none">
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 5 : 3.5}
                  fill="white"
                  stroke={point.onDemand > 0 ? '#d96138' : '#22863a'}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  className="transition-opacity duration-150"
                  style={{ opacity: isDimmed ? 0.35 : 1 }}
                />
                <text
                  x={point.x}
                  y={hasProjection ? point.y + 14 : point.y - 10}
                  textAnchor={point.index === 0 ? 'start' : 'middle'}
                  fill="#334155"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    opacity: isDimmed ? 0.35 : 1,
                  }}
                >
                  {formatUsageChartValue(point.total)}
                </text>
                <text
                  x={point.x}
                  y={plot.height - 10}
                  textAnchor={point.index === 0 ? 'start' : 'middle'}
                  fill={isHovered ? '#1e293b' : '#94a3b8'}
                  style={{
                    fontSize: 11,
                    fontWeight: isHovered ? 600 : 500,
                    opacity: isDimmed ? 0.4 : 1,
                  }}
                >
                  {point.month}
                </text>
              </g>
            )
          })}

          {plotted.map((point, index) => {
            const left =
              index === 0
                ? axisX
                : (plotted[index - 1].x + point.x) / 2
            const right =
              index === plotted.length - 1
                ? plot.left + innerW
                : (point.x + plotted[index + 1].x) / 2
            return (
              <rect
                key={`hit-${point.key}`}
                x={left}
                y={plot.top}
                width={Math.max(right - left, 1)}
                height={axisY - plot.top + 20}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            )
          })}
        </svg>

        {hoveredPoint && (
          <div
            className={cn(
              'pointer-events-none absolute z-30',
              tooltipSide === 'right'
                ? '-translate-x-full -translate-y-[calc(100%+10px)]'
                : tooltipSide === 'left'
                  ? '-translate-y-[calc(100%+10px)]'
                  : '-translate-x-1/2 -translate-y-[calc(100%+10px)]'
            )}
            style={{
              left: `${(hoveredPoint.x / plot.width) * 100}%`,
              top: `${((hoveredPoint.projectedY ?? hoveredPoint.y) / plot.height) * 100}%`,
            }}
          >
            <UsagePatternTooltip point={hoveredPoint} />
          </div>
        )}
      </div>
    </div>
  )
}

function formatUsageChartValue(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

const METERED_USAGE_FEATURES = new Set([
  'Image creation',
  'API calls',
  'Video storage',
])

const USAGE_METER_ARC_LENGTH = Math.PI * 5.5

function parseUsageQuantity(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '')
  const match = cleaned.match(/^([\d.]+)\s*([kKmMbB]?)/)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value)) return null
  const suffix = match[2].toUpperCase()
  const multiplier =
    suffix === 'K' ? 1_000 : suffix === 'M' ? 1_000_000 : suffix === 'B' ? 1_000_000_000 : 1
  return value * multiplier
}

/** Parse included strings like `2,273/2,500`, `1.4M/5M`, `95GB/500GB` into 0–1. */
function parseUsageRatio(included: string): number {
  const [usedRaw, totalRaw] = included.split('/')
  if (!usedRaw || !totalRaw) return 0
  const used = parseUsageQuantity(usedRaw)
  const total = parseUsageQuantity(totalRaw)
  if (used == null || total == null || total <= 0) return 0
  return Math.min(1, Math.max(0, used / total))
}

const USAGE_METER_COLORS: Record<
  'default' | 'warning' | 'danger',
  { from: string; to: string; needle: string }
> = {
  default: { from: '#3b82f6', to: '#8b5cf6', needle: '#1e293b' },
  warning: { from: '#f59e0b', to: '#ea580c', needle: '#9a3412' },
  danger: { from: '#ef4444', to: '#dc2626', needle: '#991b1b' },
}

/** Compact dial meter that fills according to current usage. */
function UsageMeterIcon({
  size = 14,
  ratio,
  tone = 'default',
}: {
  size?: number
  ratio: number
  tone?: 'default' | 'warning' | 'danger'
}) {
  const id = useId()
  const pct = Math.min(1, Math.max(0, ratio))
  const colors = USAGE_METER_COLORS[tone]
  const cx = 8
  const cy = 11.5
  const needleLen = 4.4
  const angle = Math.PI - pct * Math.PI
  const needleX = cx + Math.cos(angle) * needleLen
  const needleY = cy - Math.sin(angle) * needleLen
  const pctLabel = Math.round(pct * 100)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-label={`${pctLabel}% used`}
      className="shrink-0"
    >
      <defs>
        <linearGradient id={id} x1="2" y1="12" x2="14" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor={colors.from} />
          <stop offset="1" stopColor={colors.to} />
        </linearGradient>
      </defs>
      <path
        d="M2.5 11.5a5.5 5.5 0 0 1 11 0"
        stroke="#d4d9e3"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {pct > 0 && (
        <path
          d="M2.5 11.5a5.5 5.5 0 0 1 11 0"
          stroke={`url(#${id})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${pct * USAGE_METER_ARC_LENGTH} ${USAGE_METER_ARC_LENGTH}`}
        />
      )}
      <path
        d={`M${cx} ${cy} L${needleX.toFixed(2)} ${needleY.toFixed(2)}`}
        stroke={colors.needle}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="1.15" fill={colors.needle} />
    </svg>
  )
}

function UsageSummaryTable({ features }: { features: UsageSummaryFeature[] }) {
  const rowGridClass = 'grid grid-cols-[minmax(200px,320px)_1fr] items-center gap-x-16'

  return (
    <div className={SECTION_DATA_CONTAINER}>
      <div className={cn(rowGridClass, 'border-b border-neutral-200 bg-neutral-50/50 px-4 py-2.5')}>
        <span className="text-left text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
          Feature
        </span>
        <span className="text-left text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
          Usage
        </span>
      </div>
      {features.map((row, idx) => (
        <div
          key={row.feature}
          className={cn(
            rowGridClass,
            'group relative cursor-pointer border-b border-neutral-200 px-4 py-2.5 pr-10 transition-colors hover:bg-neutral-50',
            idx === features.length - 1 && 'border-b-0'
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5 text-left text-[13px] font-medium text-brand-navy">
            {row.feature}
            {METERED_USAGE_FEATURES.has(row.feature) && (
              <UsageMeterIcon
                size={14}
                ratio={parseUsageRatio(row.included)}
                tone={row.includedTone ?? 'default'}
              />
            )}
          </span>
          <div className="min-w-0 justify-self-start text-left">
            <UsageAmountDisplay
              included={row.included}
              onDemand={row.onDemand}
              includedTone={row.includedTone}
            />
          </div>
          <ArrowRight
            size={14}
            strokeWidth={2}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-fog opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
      ))}
    </div>
  )
}

function UsageCycleDropdown({
  cycles,
  selectedId,
  onSelect,
}: {
  cycles: UsageSummaryCycle[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const selectedCycle = cycles.find((cycle) => cycle.id === selectedId) ?? cycles[0]

  return (
    <div ref={dropdownRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium leading-none text-brand-navy transition-colors hover:text-blue-700"
      >
        <span>{selectedCycle?.label ?? 'Current cycle'}</span>
        <ChevronDown
          size={12}
          className={cn('text-brand-fog transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[148px] overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {cycles.map((cycle) => (
            <button
              key={cycle.id}
              type="button"
              onClick={() => {
                onSelect(cycle.id)
                setIsOpen(false)
              }}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-[13px] transition-colors hover:bg-neutral-50',
                cycle.id === selectedId
                  ? 'font-medium text-brand-navy'
                  : 'font-normal text-brand-navy'
              )}
            >
              <span>{cycle.label}</span>
              {cycle.isCurrent && (
                <span className="text-[11px] font-medium text-brand-fog">Current</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function UsageSummarySection({ order }: { order: SalesOrder }) {
  const cycles = useMemo(() => getUsageSummaryCycles(order), [order])
  const defaultCycleId = cycles.find((cycle) => cycle.isCurrent)?.id ?? cycles[0]?.id ?? ''
  const [selectedCycleId, setSelectedCycleId] = useState(defaultCycleId)

  useEffect(() => {
    setSelectedCycleId(cycles.find((cycle) => cycle.isCurrent)?.id ?? cycles[0]?.id ?? '')
  }, [order.id, cycles])

  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? cycles[0]

  return (
    <div style={{ maxWidth: CONTENT_MAX_WIDTH }}>
      <div className="flex items-center gap-6">
        <span className="text-[12px] font-semibold uppercase leading-none tracking-[-0.25px] text-brand-navy">
          Usage summary
        </span>
        <UsageCycleDropdown
          cycles={cycles}
          selectedId={selectedCycleId}
          onSelect={setSelectedCycleId}
        />
      </div>
      <div className="mt-4">
        {selectedCycle && <UsageSummaryTable features={selectedCycle.features} />}
      </div>
    </div>
  )
}

/** Payment attention block for the V1 Summary section. */
function SubSectionHeader({
  title,
  onViewAll,
}: {
  title: string
  onViewAll?: () => void
}) {
  return (
    <div className="group/subhead mb-3 flex items-center gap-3">
      <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
        {title}
      </p>
      <button
        type="button"
        onClick={onViewAll}
        className={cn(
          'ml-auto inline-flex shrink-0 cursor-pointer items-center gap-0.5 text-[11px] font-medium text-blue-700 transition-opacity hover:underline',
          'opacity-0 pointer-events-none group-hover/subhead:pointer-events-auto group-hover/subhead:opacity-100',
          'group-hover/column:pointer-events-auto group-hover/column:opacity-100'
        )}
      >
        View all
        <ArrowRight size={12} strokeWidth={2.25} />
      </button>
    </div>
  )
}

function PaymentAttentionSummary({
  order,
  onViewAllInvoices,
  onViewAllPaymentDetails,
}: {
  order: SalesOrder
  onViewAllInvoices?: () => void
  onViewAllPaymentDetails?: () => void
}) {
  const listItem = resolveListItem(order)
  const summary = getSalesOrderPaymentSummary(order.id, listItem)
  const usageSignal = getUsageAttentionSignal(order.id)
  const overdueLabel =
    summary.overdueDays === 1 ? '1 day' : `${summary.overdueDays} days`

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
          2 items need attention
        </span>
      </div>

      <AttentionItem
        headline={
          <>
            Last invoice overdue by{' '}
            <span className="font-semibold text-red-700">{overdueLabel}</span>
            {' — '}
            <span className="font-semibold">{summary.overdueAmount}</span>
          </>
        }
        summary={
          <>
            Pioneer Systems typically pays within Net 30 — median clearance is 3 days after due.
            Four of the last five invoices were on time; the open balance is the first overdue
            invoice in 14 months —{' '}
            <span className="mx-0.5 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] font-medium text-brand-navy align-baseline">
              Sharath
            </span>{' '}
            is on top of this, and 4 reminders have already been sent.
          </>
        }
        actionLabel="View reminders sent"
        showAction={summary.overdueDays > 0}
      />

      <div className="mt-8 grid grid-cols-2 gap-20">
        <div className="group/column min-w-0">
          <SubSectionHeader title="Past 5 invoices" onViewAll={onViewAllInvoices} />
          <div>
            {summary.recentInvoices.map((row) => (
              <div key={row.invoiceId} className={ATTENTION_INVOICE_ROW}>
                <a className="min-w-0 cursor-pointer truncate text-[13px] font-medium text-blue-700 hover:underline">
                  {row.invoiceId}
                </a>
                <span
                  className={cn(
                    'text-left text-[12px] font-medium',
                    INVOICE_TIMING_STYLES[row.timingTone]
                  )}
                >
                  {row.timingLabel}
                </span>
                <span className="text-right text-[13px] font-semibold tabular-nums text-brand-navy whitespace-nowrap">
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="group/column min-w-0">
          <SubSectionHeader
            title="Payment details"
            onViewAll={onViewAllPaymentDetails}
          />
          <div>
            <PaymentDetailRow
              label="Card on file"
              value={summary.cardOnFile}
              sub={summary.cardOnFileSub}
            />
            <PaymentDetailRow
              label="Last payment"
              value={summary.lastPayment}
              sub={summary.lastPaymentSub}
            />
            <PaymentDetailRow
              label="Next billing"
              value={summary.nextBilling}
              sub={summary.nextBillingSub}
            />
            <PaymentDetailRow
              label="Payment terms"
              value={summary.paymentTerms}
              sub={summary.paymentTermsSub}
            />
            <PaymentDetailRow
              label="Billing contact"
              value={summary.billingContact}
              sub={summary.billingContactSub}
            />
          </div>
        </div>
      </div>

      {usageSignal && (
        <div className="mt-14">
          <AttentionItem
            headline={
              <>
                {usageSignal.featureName} at{' '}
                <span className="font-semibold">{usageSignal.usageCapPct}%</span> of monthly cap with{' '}
                {usageSignal.cycleRemainingDays === 1
                  ? '1 day'
                  : `${usageSignal.cycleRemainingDays} days`}{' '}
                ({usageSignal.cycleRemainingPct}%) left in the cycle
              </>
            }
            summary={usageSignal.summary}
            actionLabel={usageSignal.ctaLabel}
          />
          <UsagePatternChart terms={usageSignal.usagePattern} />
        </div>
      )}
    </div>
  )
}

/** Activity timeline reusing the PaymentSchedule dot + vertical-connector look. */
function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <div key={item.id} className="relative flex items-start">
            <div className="relative z-10 flex w-5 shrink-0 justify-center pt-[6px]">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-navy/40" />
            </div>
            {!isLast && (
              <div
                className="pointer-events-none absolute left-[9px] top-[12px] w-px bg-brand-navy/15"
                style={{ bottom: -6 }}
              />
            )}
            <div className="ml-3 flex-1 pb-4">
              <p className="text-[12px] text-brand-fog">{item.date}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[14px] font-medium text-brand-navy">{item.label}</span>
                {item.refId && (
                  <a className="cursor-pointer text-[13px] text-blue-700 hover:underline">
                    {item.refId}
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SalesOrderDetailsV1({
  order,
  orders,
  activeOrderId,
  onSelectOrder,
}: SalesOrderDetailsProps) {
  const [activeSection, setActiveSection] = useState('summary')
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showCommentAddNote, setShowCommentAddNote] = useState(false)

  const centerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollTargetRef = useRef<string | null>(null)

  // Reset active section + scroll when the order changes
  useEffect(() => {
    setActiveSection('summary')
    if (centerRef.current) centerRef.current.scrollTo({ top: 0 })
  }, [order])

  const setSectionRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      sectionRefs.current[id] = el
    },
    []
  )

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id]
    const container = centerRef.current
    if (el && container) {
      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop
      scrollTargetRef.current = id
      container.scrollTo({ top: Math.max(top - 12, 0), behavior: 'smooth' })
    }
  }, [])

  // Scroll spy — runs during smooth programmatic scroll so the nav indicator animates fluidly
  useEffect(() => {
    const container = centerRef.current
    if (!container) return

    const updateActiveSection = () => {
      const containerTop = container.getBoundingClientRect().top
      let current = NAV_SECTIONS[0].id
      for (const section of NAV_SECTIONS) {
        const el = sectionRefs.current[section.id]
        if (!el) continue
        if (el.getBoundingClientRect().top - containerTop <= 48) {
          current = section.id
        }
      }
      setActiveSection(current)
    }

    const handleScrollEnd = () => {
      if (scrollTargetRef.current) {
        setActiveSection(scrollTargetRef.current)
        scrollTargetRef.current = null
      } else {
        updateActiveSection()
      }
    }

    container.addEventListener('scroll', updateActiveSection)
    container.addEventListener('scrollend', handleScrollEnd)
    return () => {
      container.removeEventListener('scroll', updateActiveSection)
      container.removeEventListener('scrollend', handleScrollEnd)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setShowMoreMenu(false)
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreMenu])

  // Rich list-row items — mirrors the Contract Processing task switcher popover
  const switcherItems: SwitcherItem[] = orders.map((o) => ({
    id: o.id,
    label: o.totalContractValue,
    taskType: o.soId,
    status: o.dealTag,
    customer: o.customerName,
  }))

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
      {/* Secondary nav */}
      <div className="flex shrink-0 items-center py-3">
        <div className="flex items-center gap-2">
          <SecondaryNavSwitcher
            items={switcherItems}
            activeId={activeOrderId}
            onSelect={onSelectOrder}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold uppercase tracking-[-0.25px] text-brand-navy">
                {order.soId}
              </span>
              <button
                type="button"
                onClick={() => setIsPanelsExpanded((prev) => !prev)}
                className={cn(
                  'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-neutral-100',
                  isPanelsExpanded ? 'text-brand-navy' : 'text-blue-700'
                )}
                title={isPanelsExpanded ? 'Focus mode (hide panels)' : 'Restore panels'}
              >
                {isPanelsExpanded ? <Maximize2 size={16} /> : <Focus size={16} />}
              </button>
            </div>
            <div className="mt-0.5 text-[12px] tracking-[-0.25px] text-brand-fog">
              Created {order.createdOn} · {order.rampDetails} · Starts {order.startDate}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Subtle, lightweight CTAs — max two inline + a More menu */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <FilePenLine size={15} />
            Amend order
          </button>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <Download size={15} />
            Download
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMoreMenu((prev) => !prev)
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
            >
              <MoreHorizontal size={15} />
              More
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
                >
                  Download order form
                </button>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
                >
                  Cancel order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body: absolute left nav + centered content column (mirrors Contract Processing) */}
      <div className="relative min-h-0 flex-1">
        <aside
          className="absolute top-0 bottom-0 z-10 overflow-visible pt-4 transition-all duration-300 ease-out"
          style={{ left: NAV_ALIGN_OFFSET, width: isPanelsExpanded ? LEFT_NAV_WIDTH : 0 }}
        >
          <div
            className={cn(
              'transition-opacity duration-200',
              isPanelsExpanded ? 'opacity-100 delay-100' : 'opacity-0'
            )}
            style={{ width: LEFT_NAV_WIDTH }}
          >
            <InPageNav
              sections={NAV_SECTIONS}
              sourceDocuments={[]}
              activeId={activeSection}
              onNavigate={scrollToSection}
            />
          </div>
        </aside>

        <div
          ref={centerRef}
          className="h-full overflow-y-auto pb-20 pt-12"
          style={{ marginLeft: isPanelsExpanded ? LEFT_NAV_WIDTH + NAV_ALIGN_OFFSET : 0 }}
        >
          <div className="mx-auto space-y-14" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
            {/* Summary */}
            <section ref={setSectionRef('summary')} className="group/section">
              <div style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <PaymentAttentionSummary
                  order={order}
                  onViewAllInvoices={() => scrollToSection('invoices')}
                  onViewAllPaymentDetails={() => scrollToSection('schedule')}
                />
              </div>
            </section>

            {/* Usage summary */}
            <section ref={setSectionRef('entitlements')} className="group/section">
              <UsageSummarySection order={order} />
            </section>

            {/* Products and pricing — ramp view mirroring Contract Processing */}
            <section ref={setSectionRef('products')} className="group/section">
              <SectionHeader title="Products and pricing" hideLine />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <ReadOnlyProductsList items={order.products} periods={order.productPeriods} />
              </div>
            </section>

            {/* Past invoices */}
            <section ref={setSectionRef('invoices')} className="group/section">
              <SectionHeader title="Past invoices" hideLine />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <div className={SECTION_DATA_CONTAINER}>
                  {order.pastInvoices.length === 0 ? (
                    <p className="px-4 py-4 text-[13px] text-brand-fog">No invoices yet.</p>
                  ) : (
                    order.pastInvoices.map((inv, idx) => {
                      const style = STATUS_STYLES[inv.status as InvoiceStatus]
                      return (
                        <div
                          key={inv.id}
                          className={cn(
                            'flex items-center border-b border-neutral-200 px-4 py-2.5',
                            idx === order.pastInvoices.length - 1 && 'border-b-0'
                          )}
                        >
                          <a className="w-[160px] shrink-0 cursor-pointer text-[14px] font-medium text-blue-700 hover:underline">
                            {inv.invoiceId}
                          </a>
                          <span className="flex-1 text-[13px] text-brand-fog">{inv.date}</span>
                          <span
                            className={cn(
                              'mr-4 inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium',
                              style.bg,
                              style.text
                            )}
                          >
                            {inv.status}
                          </span>
                          <span className="w-[110px] shrink-0 text-right text-[14px] font-semibold text-brand-navy">
                            {inv.amount}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Upcoming billing schedule */}
            <section ref={setSectionRef('schedule')} className="group/section">
              <SectionHeader title="Upcoming billing schedule" hideLine />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <div className={SECTION_DATA_CONTAINER}>
                  {order.upcomingBillingSchedule.length === 0 ? (
                    <p className="px-4 py-4 text-[13px] text-brand-fog">No upcoming installments.</p>
                  ) : (
                    order.upcomingBillingSchedule.map((line, idx) => {
                      const style = SCHEDULE_STATUS_STYLES[line.status]
                      return (
                        <div
                          key={line.id}
                          className={cn(
                            'flex items-center border-b border-neutral-200 px-4 py-2.5',
                            idx === order.upcomingBillingSchedule.length - 1 && 'border-b-0'
                          )}
                        >
                          <span className="w-[130px] shrink-0 text-[13px] text-brand-navy">
                            {line.billDate}
                          </span>
                          <span className="flex-1 text-[13px] text-brand-fog">
                            {line.installment}
                          </span>
                          <span
                            className={cn(
                              'mr-4 inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium',
                              style.bg,
                              style.text
                            )}
                          >
                            {line.status}
                          </span>
                          <span className="w-[110px] shrink-0 text-right text-[14px] font-semibold text-brand-navy">
                            {line.amount}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Comments — Add note lives in the section title area */}
            <section ref={setSectionRef('comments')} className="group/section">
              <SectionHeader
                title="Comments"
                hideLine
                commentCount={order.comments.length}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowCommentAddNote((prev) => !prev)}
                    className={cn(
                      'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors',
                      showCommentAddNote ? 'bg-blue-50 text-blue-700' : 'text-blue-700 hover:bg-blue-50'
                    )}
                  >
                    <MessageCircleMore size={14} />
                    Add note
                  </button>
                }
              />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                {order.comments.length === 0 && !showCommentAddNote ? (
                  <p className="py-4 text-[13px] text-brand-fog">No comments yet.</p>
                ) : (
                  <CommentsPanel
                    comments={order.comments}
                    hideHeader
                    dense
                    showAddNote={showCommentAddNote}
                    onShowAddNoteChange={setShowCommentAddNote}
                  />
                )}
              </div>
            </section>

            {/* Activity — timeline of key events (most recent first) */}
            <section ref={setSectionRef('activity')} className="group/section">
              <SectionHeader title="Activity" hideLine />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <ActivityTimeline items={order.activity} />
              </div>
            </section>

            {/* Bottom breathing room */}
            <div aria-hidden="true" style={{ height: 260 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesOrderDetailsV1
