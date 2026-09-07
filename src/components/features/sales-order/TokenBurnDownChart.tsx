import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const PLOT = { left: 56, right: 20, top: 28, bottom: 48 }
const HEIGHT = 340
const WIDTH = 1000
const MONTHS = [
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
const CURRENT_MONTH_INDEX = 6

const COLORS = {
  ideal: '#94a3b8',
  actual: '#22863a',
  projected: '#3d9a5c',
  overage: '#d96138',
  overageProjected: '#e07a55',
  grid: '#eef1f6',
  axis: '#e2e8f0',
  zero: '#cbd5e1',
}

/** Starting token grant for the billing year. */
const TOKEN_START_BALANCE = 500_000

/**
 * Actual remaining balance by month-end.
 * Starts at the grant with ideal; ahead of pace thereafter; overage in Q4.
 */
const TOKEN_REMAINING: number[] = [
  500_000, 440_000, 395_000, 355_000, 280_000, 235_000, 160_000, 120_000, 55_000,
  -10_000, -75_000, -160_000,
]

type Point = { x: number; y: number; index: number; value: number }

function formatTokenValue(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000
    return `${sign}${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (abs >= 10_000) {
    return `${sign}${Math.round(abs / 1_000)}K`
  }
  return `${sign}${Math.round(abs).toLocaleString('en-US')}`
}

/** Smooth monotone-ish path through points (Catmull-Rom → cubic). */
function smoothPath(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function areaUnder(points: Point[], baselineY: number): string {
  if (points.length === 0) return ''
  const line = smoothPath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`
}

function splitAtProjection(points: Point[], currentIndex: number) {
  if (points.length === 0) return { solid: [] as Point[], projected: [] as Point[] }
  const solid: Point[] = []
  const projected: Point[] = []
  for (const point of points) {
    if (point.index <= currentIndex) solid.push(point)
    if (point.index >= currentIndex) projected.push(point)
  }
  return { solid, projected }
}

/** Split series at y=0, inserting an interpolated crossing point. */
function splitAtZero(
  points: Point[],
  valueToY: (value: number) => number
): { positive: Point[]; negative: Point[] } {
  if (points.length === 0) return { positive: [], negative: [] }

  const crossIndex = points.findIndex((point, index) => index > 0 && point.value < 0)

  if (crossIndex < 0) {
    const allNonNegative = points.every((point) => point.value >= 0)
    return allNonNegative
      ? { positive: points, negative: [] }
      : { positive: [], negative: points }
  }

  if (crossIndex === 0) {
    return { positive: [], negative: points }
  }

  const prev = points[crossIndex - 1]
  const next = points[crossIndex]
  const t = prev.value / (prev.value - next.value)
  const crossPoint: Point = {
    index: prev.index + t,
    value: 0,
    x: prev.x + (next.x - prev.x) * t,
    y: valueToY(0),
  }

  return {
    positive: [...points.slice(0, crossIndex), crossPoint],
    negative: [crossPoint, ...points.slice(crossIndex)],
  }
}

function LegendSwatch({
  kind,
}: {
  kind: 'ideal' | 'actual' | 'projected' | 'overage'
}) {
  if (kind === 'ideal') {
    return (
      <svg width="20" height="8" aria-hidden className="shrink-0">
        <line
          x1="1"
          y1="4"
          x2="19"
          y2="4"
          stroke={COLORS.ideal}
          strokeWidth="1.75"
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (kind === 'projected') {
    return (
      <svg width="20" height="8" aria-hidden className="shrink-0">
        <line
          x1="1"
          y1="4"
          x2="19"
          y2="4"
          stroke={COLORS.projected}
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (kind === 'overage') {
    return (
      <svg width="20" height="8" aria-hidden className="shrink-0">
        <line
          x1="1"
          y1="4"
          x2="19"
          y2="4"
          stroke={COLORS.overage}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg width="20" height="8" aria-hidden className="shrink-0">
      <line
        x1="1"
        y1="4"
        x2="19"
        y2="4"
        stroke={COLORS.actual}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export type TokenBurnDownKpis = {
  remaining: number
  grant: number
  burned: number
  remainingLabel: string
  burnedLabel: string
}

/** Current-month KPIs derived from the token burn-down series. */
export function getTokenBurnDownKpis(): TokenBurnDownKpis {
  const remaining = TOKEN_REMAINING[CURRENT_MONTH_INDEX] ?? 0
  const burned = TOKEN_START_BALANCE - remaining
  return {
    remaining,
    grant: TOKEN_START_BALANCE,
    burned,
    remainingLabel: `${formatTokenValue(remaining)} / ${formatTokenValue(TOKEN_START_BALANCE)}`,
    burnedLabel: formatTokenValue(burned),
  }
}

/** Credit-unit burn-down: ideal linear draw-down vs actual remaining tokens. */
export function TokenBurnDownChart() {
  const monthCount = MONTHS.length
  const yAxisMax = TOKEN_START_BALANCE
  const yAxisStep = 100_000
  const dataMin = Math.min(0, ...TOKEN_REMAINING)
  const yAxisMin = Math.floor(dataMin / yAxisStep) * yAxisStep
  const yRange = yAxisMax - yAxisMin
  const innerW = WIDTH - PLOT.left - PLOT.right
  const innerH = HEIGHT - PLOT.top - PLOT.bottom
  const plotBottomY = PLOT.top + innerH
  const slotW = innerW / monthCount

  const valueToY = (value: number) =>
    PLOT.top + innerH * (1 - (value - yAxisMin) / yRange)
  const indexToX = (index: number) => PLOT.left + slotW * index + slotW / 2
  const zeroY = valueToY(0)

  const yTicks = useMemo(() => {
    const ticks: number[] = []
    for (let v = yAxisMin; v <= yAxisMax; v += yAxisStep) ticks.push(v)
    return ticks
  }, [yAxisMax, yAxisMin, yAxisStep])

  const series = useMemo(() => {
    const idealPoints: Point[] = Array.from({ length: monthCount }, (_, index) => {
      const value =
        monthCount <= 1
          ? 0
          : TOKEN_START_BALANCE * ((monthCount - 1 - index) / (monthCount - 1))
      return {
        index,
        value,
        x: indexToX(index),
        y: valueToY(value),
      }
    })

    const actualPoints: Point[] = TOKEN_REMAINING.map((value, index) => ({
      index,
      value,
      x: indexToX(index),
      y: valueToY(value),
    }))

    const { positive, negative } = splitAtZero(actualPoints, valueToY)
    const positiveSplit = splitAtProjection(positive, CURRENT_MONTH_INDEX)
    const negativeSplit = splitAtProjection(negative, CURRENT_MONTH_INDEX)

    return {
      idealPath: smoothPath(idealPoints),
      positiveSolid: smoothPath(positiveSplit.solid),
      positiveProjected: smoothPath(positiveSplit.projected),
      negativeSolid: smoothPath(negativeSplit.solid),
      negativeProjected: smoothPath(negativeSplit.projected),
      positiveSolidArea: areaUnder(positiveSplit.solid, zeroY),
      positiveProjectedArea: areaUnder(positiveSplit.projected, zeroY),
      negativeSolidArea: areaUnder(negativeSplit.solid, zeroY),
      negativeProjectedArea: areaUnder(negativeSplit.projected, zeroY),
      actualPoints,
      solid: actualPoints.filter((point) => point.index <= CURRENT_MONTH_INDEX),
      projected: actualPoints.filter((point) => point.index >= CURRENT_MONTH_INDEX),
    }
    // layout helpers are stable for fixed constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthCount, innerW, yAxisMax, yAxisMin, yRange, zeroY])

  const remainingToday = TOKEN_REMAINING[CURRENT_MONTH_INDEX] ?? 0
  const burnedToday = TOKEN_START_BALANCE - remainingToday
  const remainingPct = Math.round((remainingToday / TOKEN_START_BALANCE) * 100)
  const todayPoint = series.actualPoints[CURRENT_MONTH_INDEX]
  const isOverageToday = remainingToday < 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="min-w-[148px] rounded-lg border border-neutral-200/80 bg-white px-3.5 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-brand-fog">
            Overall grant
          </p>
          <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-brand-navy">
            {formatTokenValue(TOKEN_START_BALANCE)}
          </p>
          <p className="mt-0.5 text-[11px] text-brand-fog">annual token credit</p>
        </div>
        <div className="min-w-[148px] rounded-lg border border-neutral-200/80 bg-white px-3.5 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-brand-fog">
            Remaining
          </p>
          <p
            className={cn(
              'mt-1 text-[18px] font-semibold tracking-[-0.02em]',
              isOverageToday ? 'text-[#d96138]' : 'text-brand-navy'
            )}
          >
            {formatTokenValue(remainingToday)}
            <span className="ml-1 text-[12px] font-medium text-brand-fog">
              / {formatTokenValue(TOKEN_START_BALANCE)}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-brand-fog">
            {isOverageToday
              ? 'over grant'
              : `${Math.max(remainingPct, 0)}% of grant left`}
          </p>
        </div>
        <div className="min-w-[148px] rounded-lg border border-neutral-200/80 bg-white px-3.5 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-brand-fog">
            Burned to date
          </p>
          <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-brand-navy">
            {formatTokenValue(burnedToday)}
          </p>
          <p className="mt-0.5 text-[11px] text-brand-fog">tokens consumed</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200/80 p-6">
        <div className="relative h-[340px] w-full overflow-visible">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          role="img"
          aria-label="Token credit burn-down chart"
        >
          <defs>
            <linearGradient id="token-burn-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.actual} stopOpacity="0.14" />
              <stop offset="100%" stopColor={COLORS.actual} stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="token-burn-projected-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.projected} stopOpacity="0.1" />
              <stop offset="100%" stopColor={COLORS.projected} stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="token-burn-overage-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.overage} stopOpacity="0.02" />
              <stop offset="100%" stopColor={COLORS.overage} stopOpacity="0.16" />
            </linearGradient>
            <linearGradient
              id="token-burn-overage-projected-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={COLORS.overageProjected} stopOpacity="0.02" />
              <stop offset="100%" stopColor={COLORS.overageProjected} stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={PLOT.left}
              y1={valueToY(tick)}
              x2={PLOT.left + innerW}
              y2={valueToY(tick)}
              stroke={tick === 0 ? COLORS.zero : COLORS.grid}
              strokeWidth={tick === 0 ? 1.25 : 1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1={PLOT.left}
            y1={plotBottomY}
            x2={PLOT.left + innerW}
            y2={plotBottomY}
            stroke={COLORS.axis}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          {series.positiveSolidArea && (
            <path d={series.positiveSolidArea} fill="url(#token-burn-fill)" stroke="none" />
          )}
          {series.positiveProjectedArea && (
            <path
              d={series.positiveProjectedArea}
              fill="url(#token-burn-projected-fill)"
              stroke="none"
            />
          )}
          {series.negativeSolidArea && (
            <path
              d={series.negativeSolidArea}
              fill="url(#token-burn-overage-fill)"
              stroke="none"
            />
          )}
          {series.negativeProjectedArea && (
            <path
              d={series.negativeProjectedArea}
              fill="url(#token-burn-overage-projected-fill)"
              stroke="none"
            />
          )}

          {series.idealPath && (
            <path
              d={series.idealPath}
              fill="none"
              stroke={COLORS.ideal}
              strokeWidth="1.75"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {series.positiveSolid && (
            <path
              d={series.positiveSolid}
              fill="none"
              stroke={COLORS.actual}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {series.positiveProjected && (
            <path
              d={series.positiveProjected}
              fill="none"
              stroke={COLORS.projected}
              strokeWidth="2.25"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {series.negativeSolid && (
            <path
              d={series.negativeSolid}
              fill="none"
              stroke={COLORS.overage}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {series.negativeProjected && (
            <path
              d={series.negativeProjected}
              fill="none"
              stroke={COLORS.overage}
              strokeWidth="2.25"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {series.solid.map((point) => {
            const color = point.value < 0 ? COLORS.overage : COLORS.actual
            return (
              <circle
                key={MONTHS[point.index]}
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill={color}
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
          {series.projected.slice(1).map((point) => {
            const color = point.value < 0 ? COLORS.overage : COLORS.projected
            return (
              <circle
                key={MONTHS[point.index]}
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill="white"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0">
          {todayPoint ? (
            <div
              className="absolute"
              style={{
                left: `${(todayPoint.x / WIDTH) * 100}%`,
                top: `${(PLOT.top / HEIGHT) * 100}%`,
                height: `${((plotBottomY - PLOT.top) / HEIGHT) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <span className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold tracking-[-0.01em] text-teal-700">
                Today
              </span>
              <div
                className="h-full w-px"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, #0d9488 0 3px, transparent 3px 7px)',
                }}
              />
            </div>
          ) : null}

          {yTicks.map((tick) => (
            <span
              key={tick}
              className={cn(
                'absolute -translate-y-1/2 text-right text-[10px] tabular-nums',
                tick < 0 ? 'text-[#d96138]' : 'text-brand-mist'
              )}
              style={{
                left: 0,
                width: PLOT.left - 10,
                top: `${(valueToY(tick) / HEIGHT) * 100}%`,
              }}
            >
              {tick === 0 ? '0' : formatTokenValue(tick)}
            </span>
          ))}

          {MONTHS.map((month, index) => (
            <span
              key={month}
              className={cn(
                'absolute -translate-x-1/2 text-center text-[10px] tabular-nums',
                index === CURRENT_MONTH_INDEX
                  ? 'font-semibold text-teal-700'
                  : 'text-brand-mist'
              )}
              style={{
                left: `${(indexToX(index) / WIDTH) * 100}%`,
                top: `${((plotBottomY + 12) / HEIGHT) * 100}%`,
              }}
            >
              {month}
            </span>
          ))}
        </div>
      </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-[12px] text-brand-navy">
          <span className="inline-flex items-center gap-2">
            <LegendSwatch kind="ideal" />
            Ideal
          </span>
          <span className="inline-flex items-center gap-2">
            <LegendSwatch kind="actual" />
            Actual
          </span>
          <span className="inline-flex items-center gap-2">
            <LegendSwatch kind="projected" />
            Projected
          </span>
          <span className="inline-flex items-center gap-2">
            <LegendSwatch kind="overage" />
            Overage
          </span>
        </div>
      </div>
    </div>
  )
}

export default TokenBurnDownChart
