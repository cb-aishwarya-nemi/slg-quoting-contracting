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
  getUsageAttentionSignal,
  type UsageTermRow,
} from '@/data/salesOrdersListMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'
import { SalesOrderFeatureUsageSection } from './SalesOrderFeatureUsage'

const NAV_SECTIONS_CHART_1: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'ai' },
  { id: 'usage', label: 'Feature usage', status: 'neutral' },
  { id: 'products', label: 'Products and pricing', status: 'neutral' },
  { id: 'invoices', label: 'Past invoices', status: 'neutral' },
  { id: 'schedule', label: 'Upcoming billing schedule', status: 'neutral' },
  { id: 'comments', label: 'Comments', status: 'neutral' },
  { id: 'activity', label: 'Activity', status: 'neutral' },
]

type UsageSectionView = 'feature' | 'summary'

const NAV_SECTIONS_CHART_2: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'ai' },
  { id: 'entitlements', label: 'Feature usage', status: 'neutral' },
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
  /** Distinguishes UBB chart explorations; both share this page until chart 2 diverges. */
  chartVariant?: 'ubb-chart-1' | 'ubb-chart-2'
}

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
                stroke="#d96138"
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

const FEATURE_USAGE_SHELL_PLOT = { left: 72, right: 16, top: 16, bottom: 52 }
const FEATURE_USAGE_SHELL_HEIGHT = 320
const FEATURE_USAGE_SHELL_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const
/** July is current; Aug–Dec are projected. */
const FEATURE_USAGE_SHELL_CURRENT_MONTH_INDEX = 6
/** Commit ceiling — actual touches this in June; anything above is orange. */
const FEATURE_USAGE_SHELL_COMMIT = 3_000
const FEATURE_USAGE_SHELL_COLORS = {
  ideal: '#94a3b8',
  actual: '#22863a',
  overCommit: '#d96138',
}
/**
 * Actual image usage — climbs to the 3,000 commit in June, then exceeds it
 * through July and the projected months (Aug–Dec).
 */
const FEATURE_USAGE_SHELL_ACTUAL = [
  400, 800, 1_200, 1_800, 2_400, 3_000, 3_250, 3_550, 3_850, 4_150, 4_450, 4_750,
]

type ShellPoint = { x: number; y: number; index: number; value: number }

function shellPolyline(points: ShellPoint[]): string {
  if (points.length === 0) return ''
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}

/** Split a path at the Jul→Aug boundary so post-July segments can be dashed. */
function splitAtProjection(
  points: ShellPoint[],
  currentIndex: number
): { solid: ShellPoint[]; projected: ShellPoint[] } {
  if (points.length === 0) return { solid: [], projected: [] }

  const lastSolidIdx = points.reduce((acc, point, index) => {
    return point.index <= currentIndex ? index : acc
  }, -1)

  if (lastSolidIdx < 0) {
    return { solid: [], projected: points }
  }

  const solid = points.slice(0, lastSolidIdx + 1)
  const projected =
    lastSolidIdx < points.length - 1
      ? [points[lastSolidIdx], ...points.slice(lastSolidIdx + 1)]
      : []

  return { solid, projected }
}

const FEATURE_USAGE_SHELL_FEATURES = [
  { id: 'image-creation', label: 'Image creation' },
  { id: 'api-calls', label: 'API calls / month' },
] as const

function FeatureUsageLineFeatureDropdown({
  features,
  selectedId,
  onSelect,
}: {
  features: ReadonlyArray<{ id: string; label: string }>
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = features.find((f) => f.id === selectedId) ?? features[0]

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!selected) return null

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2 text-[15px] font-semibold text-brand-navy transition-colors hover:text-brand-navy/80"
      >
        {selected.label}
        <ChevronDown size={16} className="text-brand-mist" />
      </button>
      {isOpen && (
        <div className="absolute left-0 z-20 mt-1 min-w-full overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {features.map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => {
                onSelect(feature.id)
                setIsOpen(false)
              }}
              className={cn(
                'w-full cursor-pointer px-3 py-2 text-left text-[13px] transition-colors hover:bg-brand-navy hover:text-white',
                feature.id === selectedId ? 'font-medium text-brand-navy' : 'text-brand-navy'
              )}
            >
              {feature.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FeatureUsageLineLegend() {
  const items = [
    {
      key: 'ideal',
      label: 'Ideal usage',
      icon: (
        <svg width="22" height="10" aria-hidden className="shrink-0">
          <line
            x1="1"
            y1="5"
            x2="21"
            y2="5"
            stroke={FEATURE_USAGE_SHELL_COLORS.ideal}
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      key: 'actual',
      label: 'Actual usage',
      icon: (
        <svg width="22" height="10" aria-hidden className="shrink-0">
          <line
            x1="1"
            y1="5"
            x2="21"
            y2="5"
            stroke={FEATURE_USAGE_SHELL_COLORS.actual}
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      key: 'over',
      label: 'Above commit',
      icon: (
        <svg width="22" height="10" aria-hidden className="shrink-0">
          <line
            x1="1"
            y1="5"
            x2="21"
            y2="5"
            stroke={FEATURE_USAGE_SHELL_COLORS.overCommit}
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      key: 'projected',
      label: 'Projected',
      icon: (
        <svg width="22" height="10" aria-hidden className="shrink-0">
          <line
            x1="1"
            y1="5"
            x2="21"
            y2="5"
            stroke={FEATURE_USAGE_SHELL_COLORS.actual}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="mt-3 flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5 text-[11px] text-brand-fog">
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function FeatureUsageChartShell() {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(
    FEATURE_USAGE_SHELL_FEATURES[0].id
  )
  const yAxisMax = 5_000
  const yAxisStep = 1_000
  const commit = FEATURE_USAGE_SHELL_COMMIT
  const monthCount = FEATURE_USAGE_SHELL_MONTHS.length
  const innerW = 1000 - FEATURE_USAGE_SHELL_PLOT.left - FEATURE_USAGE_SHELL_PLOT.right
  const innerH = FEATURE_USAGE_SHELL_HEIGHT - FEATURE_USAGE_SHELL_PLOT.top - FEATURE_USAGE_SHELL_PLOT.bottom
  const xAxisY = FEATURE_USAGE_SHELL_PLOT.top + innerH
  const yTicks = useMemo(() => {
    const ticks: number[] = []
    for (let v = 0; v <= yAxisMax; v += yAxisStep) ticks.push(v)
    return ticks
  }, [])
  const slotW = innerW / monthCount
  const valueToY = (value: number) =>
    FEATURE_USAGE_SHELL_PLOT.top + innerH * (1 - value / yAxisMax)
  const indexToX = (index: number) =>
    FEATURE_USAGE_SHELL_PLOT.left + slotW * index + slotW / 2

  const series = useMemo(() => {
    const origin: ShellPoint = {
      x: FEATURE_USAGE_SHELL_PLOT.left,
      y: valueToY(0),
      index: -1,
      value: 0,
    }

    const points = FEATURE_USAGE_SHELL_ACTUAL.map((value, index) => {
      const x = indexToX(index)
      return {
        index,
        value,
        x,
        yActual: valueToY(value),
      }
    })

    // Actual shares the ideal line’s start at the plot origin (0,0).
    const actualSeries = [
      { index: -1, value: 0, x: origin.x, yActual: origin.y },
      ...points,
    ]

    // Ideal diagonal from origin (0) to the Dec commit (3,000) — always solid.
    // Chart y-max stays higher so projected actual can exceed the commit.
    const decemberX = indexToX(monthCount - 1)
    const idealSpanX = decemberX - FEATURE_USAGE_SHELL_PLOT.left
    const idealMonthDots = Array.from({ length: monthCount }, (_, index) => {
      const x = indexToX(index)
      const value =
        idealSpanX <= 0
          ? commit
          : commit * ((x - FEATURE_USAGE_SHELL_PLOT.left) / idealSpanX)
      return {
        x,
        y: valueToY(value),
        index,
        value,
      }
    })
    const idealPoints: ShellPoint[] = [
      origin,
      ...idealMonthDots.map((dot) => ({
        x: dot.x,
        y: dot.y,
        index: dot.index,
        value: dot.value,
      })),
    ]

    // Split green/orange at the commit (3,000). June touches commit; later months exceed.
    const crossIndex = actualSeries.findIndex(
      (point, index) => index > 0 && point.value >= commit
    )
    let underCommit: ShellPoint[] = []
    let overCommit: ShellPoint[] = []

    if (crossIndex < 0) {
      underCommit = actualSeries.map((point) => ({
        x: point.x,
        y: point.yActual,
        index: point.index,
        value: point.value,
      }))
    } else if (crossIndex === 0) {
      overCommit = actualSeries.map((point) => ({
        x: point.x,
        y: point.yActual,
        index: point.index,
        value: point.value,
      }))
    } else {
      const prev = actualSeries[crossIndex - 1]
      const next = actualSeries[crossIndex]
      const t =
        next.value === prev.value
          ? 1
          : Math.min(1, Math.max(0, (commit - prev.value) / (next.value - prev.value)))
      const crossPoint: ShellPoint = {
        x: prev.x + (next.x - prev.x) * t,
        y: valueToY(commit),
        index: prev.index + t,
        value: commit,
      }
      underCommit = [
        ...actualSeries.slice(0, crossIndex).map((point) => ({
          x: point.x,
          y: point.yActual,
          index: point.index,
          value: point.value,
        })),
        crossPoint,
      ]
      overCommit = [
        crossPoint,
        ...actualSeries.slice(crossIndex).map((point) => ({
          x: point.x,
          y: point.yActual,
          index: point.index,
          value: point.value,
        })),
      ]
    }

    const underSplit = splitAtProjection(underCommit, FEATURE_USAGE_SHELL_CURRENT_MONTH_INDEX)
    const overSplit = splitAtProjection(overCommit, FEATURE_USAGE_SHELL_CURRENT_MONTH_INDEX)

    return {
      points,
      idealMonthDots,
      idealPath: shellPolyline(idealPoints),
      underSolid: shellPolyline(underSplit.solid),
      underProjected: shellPolyline(underSplit.projected),
      overSolid: shellPolyline(overSplit.solid),
      overProjected: shellPolyline(overSplit.projected),
    }
    // indexToX / valueToY are stable for fixed layout constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yAxisMax, monthCount, innerW, commit])

  return (
    <div className="mt-4 overflow-visible rounded-lg border border-neutral-200 bg-white px-4 pb-4 pt-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <FeatureUsageLineFeatureDropdown
          features={FEATURE_USAGE_SHELL_FEATURES}
          selectedId={selectedFeatureId}
          onSelect={setSelectedFeatureId}
        />
        <button
          type="button"
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-brand-mist transition-colors hover:bg-neutral-100 hover:text-brand-navy"
          title="Expand"
          aria-label="Expand chart"
        >
          <Maximize2 size={16} />
        </button>
      </div>
      <div className="relative h-[320px] w-full overflow-visible">
        <svg
          viewBox={`0 0 1000 ${FEATURE_USAGE_SHELL_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          role="img"
          aria-label={`${FEATURE_USAGE_SHELL_FEATURES.find((f) => f.id === selectedFeatureId)?.label ?? 'Feature'} usage ideal vs actual line chart`}
        >
          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={FEATURE_USAGE_SHELL_PLOT.left}
              y1={valueToY(tick)}
              x2={FEATURE_USAGE_SHELL_PLOT.left + innerW}
              y2={valueToY(tick)}
              stroke="#e5e7eb"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1={FEATURE_USAGE_SHELL_PLOT.left}
            y1={xAxisY}
            x2={FEATURE_USAGE_SHELL_PLOT.left + innerW}
            y2={xAxisY}
            stroke="#d8dee8"
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
          />

          {/* Ideal usage — solid diagonal from 0 (never dashed) */}
          {series.idealPath && (
            <path
              d={series.idealPath}
              fill="none"
              stroke={FEATURE_USAGE_SHELL_COLORS.ideal}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {series.idealMonthDots.map((dot) => (
            <circle
              key={`ideal-${FEATURE_USAGE_SHELL_MONTHS[dot.index]}`}
              cx={dot.x}
              cy={dot.y}
              r="3.25"
              fill="white"
              stroke={FEATURE_USAGE_SHELL_COLORS.ideal}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* Actual usage at/under commit */}
          {series.underSolid && (
            <path
              d={series.underSolid}
              fill="none"
              stroke={FEATURE_USAGE_SHELL_COLORS.actual}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {series.underProjected && (
            <path
              d={series.underProjected}
              fill="none"
              stroke={FEATURE_USAGE_SHELL_COLORS.actual}
              strokeWidth="2.25"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Actual usage above commit */}
          {series.overSolid && (
            <path
              d={series.overSolid}
              fill="none"
              stroke={FEATURE_USAGE_SHELL_COLORS.overCommit}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {series.overProjected && (
            <path
              d={series.overProjected}
              fill="none"
              stroke={FEATURE_USAGE_SHELL_COLORS.overCommit}
              strokeWidth="2.25"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {series.points.map((point) => {
            const projected = point.index > FEATURE_USAGE_SHELL_CURRENT_MONTH_INDEX
            const overCommit = point.value > commit
            const stroke = overCommit
              ? FEATURE_USAGE_SHELL_COLORS.overCommit
              : FEATURE_USAGE_SHELL_COLORS.actual
            return (
              <circle
                key={FEATURE_USAGE_SHELL_MONTHS[point.index]}
                cx={point.x}
                cy={point.yActual}
                r="3.25"
                fill="white"
                stroke={stroke}
                strokeWidth="2"
                strokeDasharray={projected ? '2.5 2' : undefined}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0">
          {yTicks.map((tick) => (
            <span
              key={tick}
              className="absolute -translate-y-1/2 text-right text-[10px] tabular-nums text-brand-mist"
              style={{
                left: 0,
                width: FEATURE_USAGE_SHELL_PLOT.left - 8,
                top: `${(valueToY(tick) / FEATURE_USAGE_SHELL_HEIGHT) * 100}%`,
              }}
            >
              {tick.toLocaleString('en-US')}
            </span>
          ))}

          {series.idealMonthDots[monthCount - 1] && (
            <span
              className="absolute whitespace-nowrap text-center text-[11px] font-semibold text-slate-500"
              style={{
                left: `${(series.idealMonthDots[monthCount - 1].x / 1000) * 100}%`,
                top: `${(series.idealMonthDots[monthCount - 1].y / FEATURE_USAGE_SHELL_HEIGHT) * 100}%`,
                transform: 'translate(-50%, calc(-100% - 8px))',
              }}
            >
              {formatUsageChartValue(commit)} committed
            </span>
          )}

          {series.points.map((point) => {
            const isDecember = point.index === monthCount - 1
            const overCommit = point.value > commit
            return (
              <span
                key={`actual-value-${FEATURE_USAGE_SHELL_MONTHS[point.index]}`}
                className="absolute whitespace-nowrap text-center text-[10px] font-semibold"
                style={{
                  left: `${(point.x / 1000) * 100}%`,
                  top: `${(point.yActual / FEATURE_USAGE_SHELL_HEIGHT) * 100}%`,
                  transform: 'translate(-50%, calc(-100% - 8px))',
                  color: overCommit
                    ? FEATURE_USAGE_SHELL_COLORS.overCommit
                    : FEATURE_USAGE_SHELL_COLORS.actual,
                }}
              >
                {isDecember
                  ? `${formatUsageChartValue(point.value)} projected`
                  : formatUsageChartValue(point.value)}
              </span>
            )
          })}

          {FEATURE_USAGE_SHELL_MONTHS.map((month, index) => {
            const centerX = FEATURE_USAGE_SHELL_PLOT.left + slotW * index + slotW / 2
            const projected = index > FEATURE_USAGE_SHELL_CURRENT_MONTH_INDEX
            return (
              <span
                key={month}
                className={cn(
                  'absolute -translate-x-1/2 text-[10px]',
                  projected ? 'text-brand-mist' : 'text-brand-fog'
                )}
                style={{
                  left: `${(centerX / 1000) * 100}%`,
                  top: `${((xAxisY + 18) / FEATURE_USAGE_SHELL_HEIGHT) * 100}%`,
                }}
              >
                {month}
              </span>
            )
          })}

          <span
            className="absolute text-center text-[10px] font-medium text-brand-fog"
            style={{
              left: `${(FEATURE_USAGE_SHELL_PLOT.left / 1000) * 100}%`,
              width: `${(innerW / 1000) * 100}%`,
              top: `${((xAxisY + 38) / FEATURE_USAGE_SHELL_HEIGHT) * 100}%`,
            }}
          >
            Billing cycle
          </span>
        </div>
      </div>
      <FeatureUsageLineLegend />
    </div>
  )
}

function UsageSectionViewToggle({
  value,
  onChange,
}: {
  value: UsageSectionView
  onChange: (view: UsageSectionView) => void
}) {
  const options: { id: UsageSectionView; label: string; title: string }[] = [
    { id: 'feature', label: 'F', title: 'Feature usage' },
    { id: 'summary', label: 'U', title: 'Usage summary' },
  ]

  return (
    <div
      className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5"
      role="group"
      aria-label="Usage view"
    >
      {options.map((option) => {
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            title={option.title}
            aria-label={option.title}
            onClick={() => onChange(option.id)}
            className={cn(
              'cursor-pointer rounded-md px-2 py-1 text-[12px] font-semibold transition-colors',
              active
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-brand-fog hover:text-brand-navy'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function UsageSummarySection({
  order,
  hideTitle = false,
  headerEnd,
}: {
  order: SalesOrder
  hideTitle?: boolean
  headerEnd?: ReactNode
}) {
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
        {!hideTitle && (
          <span className="text-[12px] font-semibold uppercase leading-none tracking-[-0.25px] text-brand-navy">
            Usage summary
          </span>
        )}
        <UsageCycleDropdown
          cycles={cycles}
          selectedId={selectedCycleId}
          onSelect={setSelectedCycleId}
        />
        {headerEnd && <div className="ml-auto flex shrink-0 items-center">{headerEnd}</div>}
      </div>
      <div className="mt-4">
        {selectedCycle && <UsageSummaryTable features={selectedCycle.features} />}
      </div>
    </div>
  )
}

function PaymentAttentionSummary({
  order,
  showUsagePatternChart = true,
}: {
  order: SalesOrder
  showUsagePatternChart?: boolean
}) {
  const usageSignal = getUsageAttentionSignal(order.id)
  if (!usageSignal) return null

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
          1 item needs attention
        </span>
      </div>

      <AttentionItem
        headline={
          <>
            <span className="font-semibold">{usageSignal.usageCapPct}%</span> of{' '}
            {usageSignal.featureName.toLowerCase()} commit reached in{' '}
            {usageSignal.cycleRemainingDays === 1
              ? '1 day'
              : `${usageSignal.cycleRemainingDays} days`}{' '}
            ({usageSignal.cycleRemainingPct}% of cycle time)
          </>
        }
        summary={usageSignal.summary}
        actionLabel={usageSignal.ctaLabel}
      />
      {showUsagePatternChart && <UsagePatternChart terms={usageSignal.usagePattern} />}
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
  chartVariant = 'ubb-chart-1',
}: SalesOrderDetailsProps) {
  const [activeSection, setActiveSection] = useState('summary')
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showCommentAddNote, setShowCommentAddNote] = useState(false)
  const [usageView, setUsageView] = useState<UsageSectionView>('feature')
  const isChart2 = chartVariant === 'ubb-chart-2'
  const navSections = useMemo(() => {
    if (isChart2) return NAV_SECTIONS_CHART_2
    return NAV_SECTIONS_CHART_1.map((section) =>
      section.id === 'usage'
        ? {
            ...section,
            label: usageView === 'feature' ? 'Feature usage' : 'Usage summary',
          }
        : section
    )
  }, [isChart2, usageView])

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
      let current = navSections[0].id
      for (const section of navSections) {
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
  }, [navSections])

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
              sections={navSections}
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
            {/* Summary — on chart 2, Feature usage outline sits directly under the AI copy */}
            <section ref={setSectionRef('summary')} className="group/section">
              <div style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <PaymentAttentionSummary
                  order={order}
                  showUsagePatternChart={!isChart2}
                />
                {isChart2 && (
                  <div ref={setSectionRef('entitlements')} className="mt-3">
                    <SalesOrderFeatureUsageSection
                      orderId={order.id}
                      hideTitle
                      hideAiInsight
                      hideUsageLimits
                      defaultFeatureId="image-creation"
                      usageProfile="attention"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Feature usage ↔ Usage summary toggle (chart 1 only) */}
            {!isChart2 && (
              <section ref={setSectionRef('usage')} className="group/section">
                <div style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                  {usageView === 'feature' ? (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[12px] font-semibold uppercase leading-none tracking-[-0.25px] text-brand-navy">
                          Feature usage
                        </span>
                        <UsageSectionViewToggle value={usageView} onChange={setUsageView} />
                      </div>
                      <FeatureUsageChartShell />
                    </>
                  ) : (
                    <UsageSummarySection
                      order={order}
                      headerEnd={
                        <UsageSectionViewToggle value={usageView} onChange={setUsageView} />
                      }
                    />
                  )}
                </div>
              </section>
            )}

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
