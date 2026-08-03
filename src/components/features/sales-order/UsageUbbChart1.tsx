import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FEATURE_USAGE_SHELL_PLOT = { left: 48, right: 16, top: 16, bottom: 52 }
const FEATURE_USAGE_SHELL_HEIGHT = 320
const FEATURE_USAGE_SHELL_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const
/** July is current; Aug–Dec are projected. */
const FEATURE_USAGE_SHELL_CURRENT_MONTH_INDEX = 6
const FEATURE_USAGE_SHELL_COLORS = {
  ideal: '#94a3b8',
  actual: '#22863a',
  overCommit: '#d96138',
}

type ShellPoint = { x: number; y: number; index: number; value: number }

function formatUsageChartValue(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1_000)}K`
  }
  return Math.round(value).toLocaleString('en-US')
}

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
            stroke={FEATURE_USAGE_SHELL_COLORS.overCommit}
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

export const FEATURE_USAGE_INSIGHTS: Record<string, string> = {
  'API calls':
    'API usage is tracking steadily around 2.0M calls/month — well inside the annual commit with no projected overage through year-end.',
  'Image processing':
    'Image processing crossed the 3,000 commit in June and is projected to reach 4,750 by December — sustained growth above ideal usage for the rest of the billing cycle.',
  Storage:
    'Storage commit is fully consumed — 24 GB of on-demand usage has accrued and will bill with the next on-demand invoice.',
}

type FeatureChartSeries = {
  commit: number
  yAxisMax: number
  yAxisStep: number
  actual: number[]
}

const FEATURE_CHART_SERIES: Record<string, FeatureChartSeries> = {
  'Image processing': {
    commit: 3_000,
    yAxisMax: 5_000,
    yAxisStep: 1_000,
    actual: [400, 800, 1_200, 1_800, 2_400, 3_000, 3_250, 3_550, 3_850, 4_150, 4_450, 4_750],
  },
}

const CHART_GRANULARITIES = ['Monthly', 'Quarterly', 'Yearly'] as const
type ChartGranularity = (typeof CHART_GRANULARITIES)[number]

function ChartGranularityDropdown({
  value,
  onChange,
}: {
  value: ChartGranularity
  onChange: (value: ChartGranularity) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] font-medium text-brand-navy transition-colors hover:bg-neutral-100"
      >
        {value}
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
          className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {CHART_GRANULARITIES.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={cn(
                'flex w-full cursor-pointer px-3 py-2 text-left text-[13px] transition-colors hover:bg-neutral-50',
                option === value ? 'font-semibold text-blue-700' : 'text-brand-navy'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** UBB chart 1 — ideal vs actual line chart from sales-order-explorations. */
export function UsageUbbChart1({ featureLabel = 'Feature' }: { featureLabel?: string }) {
  const [granularity, setGranularity] = useState<ChartGranularity>('Yearly')
  const chart =
    FEATURE_CHART_SERIES[featureLabel] ?? FEATURE_CHART_SERIES['Image processing']
  const { commit, yAxisMax, yAxisStep, actual } = chart
  const monthCount = FEATURE_USAGE_SHELL_MONTHS.length
  const innerW = 1000 - FEATURE_USAGE_SHELL_PLOT.left - FEATURE_USAGE_SHELL_PLOT.right
  const innerH =
    FEATURE_USAGE_SHELL_HEIGHT - FEATURE_USAGE_SHELL_PLOT.top - FEATURE_USAGE_SHELL_PLOT.bottom
  const xAxisY = FEATURE_USAGE_SHELL_PLOT.top + innerH
  const yTicks = useMemo(() => {
    const ticks: number[] = []
    for (let v = 0; v <= yAxisMax; v += yAxisStep) ticks.push(v)
    return ticks
  }, [yAxisMax, yAxisStep])
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

    const points = actual.map((value, index) => {
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
  }, [yAxisMax, monthCount, innerW, commit, actual])

  return (
    <div className="overflow-visible rounded-lg border border-neutral-200 bg-white p-6">
      <div className="mb-3 flex justify-end">
        <ChartGranularityDropdown value={granularity} onChange={setGranularity} />
      </div>
      <div className="relative h-[320px] w-full overflow-visible">
        <svg
          viewBox={`0 0 1000 ${FEATURE_USAGE_SHELL_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          role="img"
          aria-label={`${featureLabel} usage ideal vs actual line chart`}
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
            const color = overCommit
              ? FEATURE_USAGE_SHELL_COLORS.overCommit
              : FEATURE_USAGE_SHELL_COLORS.actual
            return (
              <circle
                key={FEATURE_USAGE_SHELL_MONTHS[point.index]}
                cx={point.x}
                cy={point.yActual}
                r="3.25"
                fill={projected ? 'white' : color}
                stroke={color}
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
              {tick === 0 ? '0' : formatUsageChartValue(tick)}
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
