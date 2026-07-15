import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from '@/components/features/contract-processing'
import {
  formatBillingCyclePeriod,
  formatFeatureUsageAxisValue,
  getCycleConsumptionSplit,
  getRemainingAtCycleStart,
  getSalesOrderFeatureUsage,
  getSalesOrderUsageLimits,
  type FeatureUsageProfile,
  type SalesOrderFeatureUsage,
  type UsageLimitMetric,
} from '@/data/salesOrderFeatureUsageMock'

const PLOT = { left: 72, right: 16, top: 16, bottom: 52 }
const YEAR_GAP = 14

const COLORS = {
  bar: '#22863a',
  barWarning: '#d96138',
  areaFill: 'rgba(159, 212, 176, 0.32)',
  areaStroke: '#9fd4b0',
}

const HOVER_ACCENT = '34, 134, 58'

const BILLING_CYCLE_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Assume current month is July — later months render as projections. */
const CURRENT_MONTH_CYCLE = 7

function formatBillingCycleAxisLabel(cycle: number): string {
  if (cycle >= 1 && cycle <= 12) return BILLING_CYCLE_MONTHS[cycle - 1]
  return String(cycle)
}

function isProjectedCycle(cycle: number): boolean {
  return cycle > CURRENT_MONTH_CYCLE
}

const BAR_WIDTH_RATIO = 0.68
const BAR_RADIUS = 5
const CHART_HEIGHT = 320
const X_AXIS_LABEL_GAP = 18
const BILLING_CYCLE_LABEL_GAP = 38
const CHART_ENTRANCE_MS = 1000

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function staggeredProgress(global: number, index: number, total: number): number {
  if (total <= 1) return easeOutCubic(global)
  const staggerSpan = 0.55
  const slotStart = (index / total) * staggerSpan
  const slotEnd = slotStart + (1 - staggerSpan)
  if (global <= slotStart) return 0
  if (global >= slotEnd) return 1
  return easeOutCubic((global - slotStart) / (slotEnd - slotStart))
}

/** Plays the bar/chart entrance when the chart mounts or the selected feature changes — not on scroll. */
function useChartEntrance(animationKey: string): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setProgress(1)
      return
    }

    setProgress(0)
    let frame = 0
    let start: number | null = null

    const step = (now: number) => {
      if (start === null) start = now
      const elapsed = now - start
      setProgress(Math.min(elapsed / CHART_ENTRANCE_MS, 1))
      if (elapsed < CHART_ENTRANCE_MS) {
        frame = requestAnimationFrame(step)
      }
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [animationKey])

  return progress
}

function topRoundedBarPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h)
  if (radius <= 0) {
    return `M ${x} ${y + h} L ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} Z`
  }

  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h}`,
    'Z',
  ].join(' ')
}

function rectBarPath(x: number, y: number, w: number, h: number): string {
  return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`
}

function valueToY(value: number, max: number, innerH: number): number {
  return PLOT.top + innerH * (1 - Math.max(0, value) / max)
}

function getPoolDecrement(feature: SalesOrderFeatureUsage, index: number): number {
  const cycle = feature.cycles[index]
  return cycle.poolDecrement ?? cycle.usage
}

function buildYearStepPaths(
  slots: Array<{
    index: number
    slotLeft: number
    slotRight: number
  }>,
  feature: SalesOrderFeatureUsage,
  yAxisMax: number,
  innerH: number
) {
  if (slots.length === 0) return { areaPath: '', linePath: '', leftEdgePath: '', rightEdgePath: '' }

  const bottomY = valueToY(0, yAxisMax, innerH)
  const first = slots[0]
  const firstRemaining = getRemainingAtCycleStart(feature, first.index)
  const firstTopY = valueToY(firstRemaining, yAxisMax, innerH)

  let areaPath = `M ${first.slotLeft} ${bottomY}`
  areaPath += ` L ${first.slotLeft} ${firstTopY}`

  let linePath = `M ${first.slotLeft} ${firstTopY}`
  const leftEdgePath = `M ${first.slotLeft} ${bottomY} L ${first.slotLeft} ${firstTopY}`

  let lastQuotaSlot = first
  let lastRightTopY = firstTopY
  for (const slot of slots) {
    const remainingStart = getRemainingAtCycleStart(feature, slot.index)
    const decrement =
      remainingStart > 0 ? getPoolDecrement(feature, slot.index) : 0
    const remainingEnd = Math.max(0, remainingStart - decrement)
    const topStart = valueToY(remainingStart, yAxisMax, innerH)
    const topEnd = valueToY(remainingEnd, yAxisMax, innerH)

    areaPath += ` L ${slot.slotRight} ${topStart} L ${slot.slotRight} ${topEnd}`
    linePath += ` L ${slot.slotRight} ${topStart} L ${slot.slotRight} ${topEnd}`
    lastQuotaSlot = slot
    lastRightTopY = topStart
  }

  areaPath += ` L ${lastQuotaSlot.slotRight} ${bottomY} Z`

  const rightEdgePath = `M ${lastQuotaSlot.slotRight} ${bottomY} L ${lastQuotaSlot.slotRight} ${lastRightTopY}`

  return { areaPath, linePath, leftEdgePath, rightEdgePath }
}

function FeatureUsageLegend() {
  const items = [
    {
      key: 'quota',
      label: 'Quota at start of month',
      icon: (
        <svg width="22" height="10" aria-hidden className="shrink-0">
          <line
            x1="1"
            y1="5"
            x2="21"
            y2="5"
            stroke={COLORS.areaStroke}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        </svg>
      ),
    },
    {
      key: 'included',
      label: 'Included usage',
      icon: (
        <span
          className="inline-block h-2.5 w-3.5 shrink-0 rounded-sm"
          style={{ backgroundColor: COLORS.bar }}
        />
      ),
    },
    {
      key: 'on-demand',
      label: 'On-demand usage',
      icon: (
        <span
          className="inline-block h-2.5 w-3.5 shrink-0 rounded-sm"
          style={{ backgroundColor: COLORS.barWarning }}
        />
      ),
    },
    {
      key: 'projected',
      label: 'Projected',
      icon: (
        <svg width="14" height="10" aria-hidden className="shrink-0">
          <rect
            x="0"
            y="0"
            width="14"
            height="10"
            rx="2"
            fill={COLORS.bar}
            fillOpacity="0.22"
          />
          <line
            x1="1"
            y1="9"
            x2="13"
            y2="1"
            stroke={COLORS.bar}
            strokeWidth="1.5"
            strokeDasharray="2 1.5"
            opacity="0.75"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          {item.icon}
          <span className="text-[11px] text-brand-fog">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

interface SlotLayoutItem {
  cycle: number
  yearIndex: number
  slotLeft: number
  slotRight: number
  centerX: number
  barW: number
  left: number
  index: number
}

interface ChartTooltipProps {
  slot: SlotLayoutItem
  feature: SalesOrderFeatureUsage
}

function formatTooltipValue(value: number, unit: string): string {
  return `${formatFeatureUsageAxisValue(value)} ${unit}`
}

function ChartTooltip({ slot, feature }: ChartTooltipProps) {
  const remaining = getRemainingAtCycleStart(feature, slot.index)
  const { withinQuota, overage } = getCycleConsumptionSplit(feature, slot.index)
  const unit = feature.valueUnit
  const projected = isProjectedCycle(slot.cycle)

  return (
    <div className="w-[280px] shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-brand-navy">
          {formatBillingCyclePeriod(slot.cycle, slot.yearIndex, feature.contractStartDate)}
        </p>
        {projected && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-fog">
            Projected
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-brand-fog">
            <svg width="14" height="6" aria-hidden className="shrink-0">
              <line
                x1="0"
                y1="3"
                x2="14"
                y2="3"
                stroke={COLORS.areaStroke}
                strokeWidth="2"
                strokeDasharray="3 2"
              />
            </svg>
            Quota at start of month
          </span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] font-medium tabular-nums text-brand-navy">
            {formatTooltipValue(remaining, unit)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-brand-fog">
            <span
              className="inline-block h-2 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: COLORS.bar }}
            />
            Included usage
          </span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] font-medium tabular-nums text-brand-navy">
            {withinQuota > 0 ? formatTooltipValue(withinQuota, unit) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-brand-fog">
            <span
              className="inline-block h-2 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: COLORS.barWarning }}
            />
            On-demand usage
          </span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] font-medium tabular-nums text-brand-navy">
            {overage > 0 ? formatTooltipValue(overage, unit) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

function FeatureUsageChart({ feature }: { feature: SalesOrderFeatureUsage }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const entranceProgress = useChartEntrance(feature.id)
  const innerW = 1000 - PLOT.left - PLOT.right
  const innerH = 320 - PLOT.top - PLOT.bottom
  const { yAxisMax, cycles } = feature

  const slotLayout = useMemo(() => {
    const year0Count = cycles.filter((c) => c.yearIndex === 0).length
    const totalSlots = cycles.length
    const usableW = innerW - YEAR_GAP
    const slotW = usableW / totalSlots
    let x = PLOT.left

    return cycles.map((cycle, index) => {
      if (index === year0Count) x += YEAR_GAP
      const slotLeft = x
      const slotRight = x + slotW
      const centerX = x + slotW / 2
      const barW = slotW * BAR_WIDTH_RATIO
      const left = centerX - barW / 2
      x += slotW
      return { ...cycle, slotLeft, slotRight, centerX, barW, left, index }
    })
  }, [cycles, innerW])

  const yTicks = useMemo(() => {
    const ticks: number[] = []
    for (let v = 0; v <= feature.yAxisMax; v += feature.yAxisStep) {
      ticks.push(v)
    }
    return ticks
  }, [feature.yAxisMax, feature.yAxisStep])

  const yearGroups = useMemo(() => {
    const groups: { yearIndex: number; slots: typeof slotLayout }[] = []
    for (const slot of slotLayout) {
      const existing = groups.find((g) => g.yearIndex === slot.yearIndex)
      if (existing) existing.slots.push(slot)
      else groups.push({ yearIndex: slot.yearIndex, slots: [slot] })
    }
    return groups
  }, [slotLayout])

  const yearPaths = useMemo(
    () =>
      yearGroups.map((group) =>
        buildYearStepPaths(group.slots, feature, yAxisMax, innerH)
      ),
    [yearGroups, feature, yAxisMax, innerH]
  )

  const xAxisY = valueToY(0, yAxisMax, innerH)
  const hoveredSlot = hoveredIndex !== null ? slotLayout[hoveredIndex] : null
  const quotaExhaustionSlot = useMemo(() => {
    for (const slot of slotLayout) {
      const remainingStart = getRemainingAtCycleStart(feature, slot.index)
      if (remainingStart <= 0) return slot

      const remainingEnd = Math.max(
        0,
        remainingStart - getPoolDecrement(feature, slot.index)
      )
      if (remainingEnd <= 0) return slot
    }
    return null
  }, [slotLayout, feature])
  const decemberSlot = slotLayout[slotLayout.length - 1]
  const decemberOverage =
    decemberSlot != null
      ? getCycleConsumptionSplit(feature, decemberSlot.index).overage
      : 0
  const exceedCommitSlot =
    decemberSlot != null && decemberOverage > 0 ? decemberSlot : quotaExhaustionSlot
  const hoveredRemaining =
    hoveredIndex !== null ? getRemainingAtCycleStart(feature, hoveredIndex) : 0
  const hoveredQuotaY = valueToY(hoveredRemaining, yAxisMax, innerH)
  const hoveredUsage =
    hoveredIndex !== null ? feature.cycles[hoveredIndex].usage : 0
  const tooltipAnchorY = valueToY(
    Math.max(hoveredUsage, hoveredRemaining, 1),
    yAxisMax,
    innerH
  )
  const quotaReveal = easeOutCubic(Math.min(entranceProgress / 0.72, 1))
  const chromeReveal = easeOutCubic(Math.min(entranceProgress / 0.35, 1))
  const annotationReveal = easeOutCubic(Math.max((entranceProgress - 0.55) / 0.45, 0))
  const tooltipAlignRight = hoveredSlot ? hoveredSlot.centerX / 1000 > 0.72 : false

  return (
    <div className="w-full overflow-visible">
      <div className="relative h-[320px] w-full overflow-visible">
        <svg
          viewBox="0 0 1000 320"
          preserveAspectRatio="none"
          className="h-full w-full"
          role="img"
          aria-label={`${feature.label} usage by billing cycle`}
        >
          <defs>
            <clipPath id={`quota-reveal-${feature.id}`}>
              <rect
                x={PLOT.left}
                y={PLOT.top}
                width={innerW * quotaReveal}
                height={CHART_HEIGHT - PLOT.top}
              />
            </clipPath>
            <pattern
              id={`projected-bar-${feature.id}`}
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill={COLORS.bar} fillOpacity="0.14" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke={COLORS.bar}
                strokeWidth="2.5"
                strokeOpacity="0.55"
              />
            </pattern>
            <pattern
              id={`projected-bar-warning-${feature.id}`}
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill={COLORS.barWarning} fillOpacity="0.14" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke={COLORS.barWarning}
                strokeWidth="2.5"
                strokeOpacity="0.55"
              />
            </pattern>
          </defs>

          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={PLOT.left}
              y1={valueToY(tick, yAxisMax, innerH)}
              x2={PLOT.left + innerW}
              y2={valueToY(tick, yAxisMax, innerH)}
              vectorEffect="non-scaling-stroke"
              className="stroke-neutral-200"
              strokeWidth="1"
              style={{ opacity: chromeReveal * 0.55 + 0.45 }}
            />
          ))}

          <g
            clipPath={`url(#quota-reveal-${feature.id})`}
            style={{ opacity: 0.35 + quotaReveal * 0.65 }}
          >
          {yearPaths.map((paths, index) =>
            paths.areaPath ? (
              <path
                key={`area-${index}`}
                d={paths.areaPath}
                fill={COLORS.areaFill}
                className="transition-opacity duration-150"
                style={{ opacity: hoveredIndex === null ? 1 : 0.5 }}
              />
            ) : null
          )}

          {yearPaths.map((paths, index) =>
            paths.leftEdgePath ? (
              <path
                key={`left-edge-${index}`}
                d={paths.leftEdgePath}
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke={COLORS.areaStroke}
                strokeWidth="2"
                strokeDasharray="5 4"
                className="transition-opacity duration-150"
                style={{ opacity: hoveredIndex === null ? 1 : 0.55 }}
              />
            ) : null
          )}

          {yearPaths.map((paths, index) =>
            paths.rightEdgePath ? (
              <path
                key={`right-edge-${index}`}
                d={paths.rightEdgePath}
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke={COLORS.areaStroke}
                strokeWidth="2"
                strokeDasharray="5 4"
                className="transition-opacity duration-150"
                style={{ opacity: hoveredIndex === null ? 1 : 0.55 }}
              />
            ) : null
          )}

          {yearPaths.map((paths, index) =>
            paths.linePath ? (
              <path
                key={`line-${index}`}
                d={paths.linePath}
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke={COLORS.areaStroke}
                strokeWidth="2"
                strokeDasharray="5 4"
                className="transition-opacity duration-150"
                style={{ opacity: hoveredIndex === null ? 1 : 0.55 }}
              />
            ) : null
          )}
          </g>

          {hoveredSlot && (
            <rect
              x={hoveredSlot.slotLeft}
              y={PLOT.top}
              width={hoveredSlot.slotRight - hoveredSlot.slotLeft}
              height={xAxisY - PLOT.top}
              fill={`rgba(${HOVER_ACCENT}, 0.06)`}
              pointerEvents="none"
            />
          )}

          {hoveredSlot && (
            <line
              x1={hoveredSlot.centerX}
              y1={PLOT.top}
              x2={hoveredSlot.centerX}
              y2={xAxisY}
              stroke={`rgba(${HOVER_ACCENT}, 0.25)`}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}

          {slotLayout.map((slot) => {
            const { withinQuota, overage } = getCycleConsumptionSplit(feature, slot.index)
            const barBottom = valueToY(0, yAxisMax, innerH)
            const isHovered = hoveredIndex === slot.index
            const isDimmed = hoveredIndex !== null && !isHovered
            const projected = isProjectedCycle(slot.cycle)
            const bars: Array<{ value: number; color: string; key: string }> = []

            if (withinQuota > 0) {
              bars.push({ value: withinQuota, color: COLORS.bar, key: 'quota' })
            }
            if (overage > 0) {
              bars.push({ value: overage, color: COLORS.barWarning, key: 'overage' })
            }

            let stackTop = barBottom
            const barCount = bars.length
            const slotProgress = staggeredProgress(
              entranceProgress,
              slot.index,
              slotLayout.length
            )
            return bars.map((bar, barIndex) => {
              const animatedValue = bar.value * slotProgress
              if (animatedValue <= 0) return null
              const barTop = valueToY(animatedValue, yAxisMax, innerH)
              const barHeight = stackTop - barTop
              const isTopSegment = barIndex === barCount - 1
              const pathD = isTopSegment
                ? topRoundedBarPath(slot.left, barTop, slot.barW, barHeight, BAR_RADIUS)
                : rectBarPath(slot.left, barTop, slot.barW, barHeight)
              const fill = projected
                ? `url(#${
                    bar.key === 'overage'
                      ? `projected-bar-warning-${feature.id}`
                      : `projected-bar-${feature.id}`
                  })`
                : bar.color

              const segment = (
                <path
                  key={`${slot.yearIndex}-${slot.cycle}-${bar.key}`}
                  d={pathD}
                  fill={fill}
                  stroke={projected ? bar.color : undefined}
                  strokeWidth={projected ? 1 : undefined}
                  strokeDasharray={projected ? '3 2' : undefined}
                  vectorEffect={projected ? 'non-scaling-stroke' : undefined}
                  className="transition-opacity duration-150"
                  style={{
                    opacity: isDimmed
                      ? 0.28
                      : projected
                        ? 0.85 + slotProgress * 0.1
                        : 0.92 + slotProgress * 0.08,
                  }}
                />
              )
              stackTop = barTop
              return segment
            })
          })}

          {hoveredSlot && hoveredRemaining > 0 && (
            <>
              <line
                x1={hoveredSlot.slotLeft}
                y1={hoveredQuotaY}
                x2={hoveredSlot.slotRight}
                y2={hoveredQuotaY}
                stroke={COLORS.areaStroke}
                strokeWidth="2"
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
              <circle
                cx={hoveredSlot.slotLeft}
                cy={hoveredQuotaY}
                r="4"
                fill="white"
                stroke={COLORS.areaStroke}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            </>
          )}

          {quotaExhaustionSlot && (
            <g style={{ opacity: annotationReveal }}>
              <line
                x1={quotaExhaustionSlot.slotRight}
                y1={PLOT.top + 8}
                x2={quotaExhaustionSlot.slotRight}
                y2={xAxisY}
                stroke={COLORS.barWarning}
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
              <circle
                cx={quotaExhaustionSlot.slotRight}
                cy={xAxisY}
                r="3"
                fill="white"
                stroke={COLORS.barWarning}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            </g>
          )}

          {slotLayout.map((slot) => (
            <rect
              key={`hit-${slot.yearIndex}-${slot.cycle}`}
              x={slot.slotLeft}
              y={PLOT.top}
              width={slot.slotRight - slot.slotLeft}
              height={xAxisY - PLOT.top}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(slot.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {hoveredSlot && (
          <div
            className={cn(
              'pointer-events-none absolute z-10 -translate-y-[calc(100%+10px)]',
              tooltipAlignRight ? '-translate-x-full' : '-translate-x-1/2'
            )}
            style={{
              left: `${(hoveredSlot.centerX / 1000) * 100}%`,
              top: `${(tooltipAnchorY / CHART_HEIGHT) * 100}%`,
            }}
          >
            <ChartTooltip slot={hoveredSlot} feature={feature} />
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: chromeReveal }}
        >
          {yTicks.map((tick) => (
            <span
              key={tick}
              className="absolute -translate-y-1/2 text-right text-[10px] tabular-nums text-brand-mist"
              style={{
                left: 0,
                width: PLOT.left - 8,
                top: `${(valueToY(tick, yAxisMax, innerH) / 320) * 100}%`,
              }}
            >
              {formatFeatureUsageAxisValue(tick)}
            </span>
          ))}

          {slotLayout.map((slot) => {
            const projected = isProjectedCycle(slot.cycle)
            return (
              <span
                key={`label-${slot.yearIndex}-${slot.cycle}`}
                className={cn(
                  'absolute -translate-x-1/2 text-[10px] transition-colors duration-150',
                  hoveredIndex === slot.index
                    ? 'font-medium text-brand-navy'
                    : projected
                      ? 'text-brand-mist'
                      : 'text-brand-fog'
                )}
                style={{
                  left: `${(slot.centerX / 1000) * 100}%`,
                  top: `${((xAxisY + X_AXIS_LABEL_GAP) / CHART_HEIGHT) * 100}%`,
                }}
              >
                {formatBillingCycleAxisLabel(slot.cycle)}
              </span>
            )
          })}

          {exceedCommitSlot && (
            <div
              className="pointer-events-none absolute z-[5] -translate-x-1/2 -translate-y-full pb-1"
              style={{
                left: `${(exceedCommitSlot.centerX / 1000) * 100}%`,
                top: `${((PLOT.top + 8) / CHART_HEIGHT) * 100}%`,
                opacity: annotationReveal,
              }}
            >
              <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[#fdf0ea] px-2 py-0.5 text-[10px] font-medium text-[#d96138]">
                Exceed commit
              </span>
            </div>
          )}

          <span
            className="absolute text-center text-[10px] font-medium text-brand-fog"
            style={{
              left: `${(PLOT.left / 1000) * 100}%`,
              width: `${(innerW / 1000) * 100}%`,
              top: `${((xAxisY + BILLING_CYCLE_LABEL_GAP) / CHART_HEIGHT) * 100}%`,
            }}
          >
            Billing cycle
          </span>
        </div>
      </div>
      <div
        className="mt-3 transition-opacity duration-500"
        style={{ opacity: easeOutCubic(Math.max((entranceProgress - 0.45) / 0.55, 0)) }}
      >
        <FeatureUsageLegend />
      </div>
    </div>
  )
}

const USAGE_LIMIT_COLORS = {
  full: COLORS.bar,
  underusage: '#b8c4d4',
}

function usageLimitPercent(used: number, allocated: number): number {
  if (allocated <= 0) return 0
  return Math.min(100, Math.round((used / allocated) * 100))
}

function UsageLimitCard({ metric }: { metric: UsageLimitMetric }) {
  const [isHovered, setIsHovered] = useState(false)
  const pct = usageLimitPercent(metric.used, metric.allocated)
  const isFullyUsed = metric.used >= metric.allocated
  const hasAiInsight = !!metric.aiInsight
  const showInsight = hasAiInsight && isHovered

  return (
    <div
      className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-brand-navy">
          {metric.label}
          {hasAiInsight && <GradientSparkle size={12} />}
        </span>
        <span className="shrink-0 tabular-nums text-[12px]">
          <span
            className={cn(
              'font-semibold',
              isFullyUsed ? 'text-brand-navy' : 'text-brand-fog'
            )}
          >
            {metric.used}
          </span>
          <span className="text-brand-fog"> / {metric.allocated}</span>
        </span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: isFullyUsed ? USAGE_LIMIT_COLORS.full : USAGE_LIMIT_COLORS.underusage,
          }}
        />
      </div>
      {hasAiInsight && (
        <p
          className={cn(
            'overflow-hidden text-[11px] leading-[1.45] text-brand-fog transition-all duration-200',
            showInsight ? 'mt-2.5 max-h-40 opacity-100' : 'mt-0 max-h-0 opacity-0'
          )}
        >
          {metric.aiInsight}
        </p>
      )}
    </div>
  )
}

function UsageLimitCards({ metrics }: { metrics: UsageLimitMetric[] }) {
  if (metrics.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-6">
      {metrics.map((metric) => (
        <UsageLimitCard key={metric.id} metric={metric} />
      ))}
    </div>
  )
}

function FeatureDropdown({
  features,
  selectedId,
  onSelect,
}: {
  features: SalesOrderFeatureUsage[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = features.find((f) => f.id === selectedId) ?? features[0]

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

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

interface SalesOrderFeatureUsageSectionProps {
  orderId: string
  /** Hide the “Feature usage” heading (e.g. UBB chart 2). */
  hideTitle?: boolean
  /** Hide the AI insight block above the chart (e.g. UBB chart 2). */
  hideAiInsight?: boolean
  /** Hide seats/sandbox usage-limit cards (e.g. UBB chart 2). */
  hideUsageLimits?: boolean
  /** Prefer this feature when the section mounts / order changes. */
  defaultFeatureId?: string
  /** `healthy` for All good; `attention` for UBB chart 2. */
  usageProfile?: FeatureUsageProfile
}

export function SalesOrderFeatureUsageSection({
  orderId,
  hideTitle = false,
  hideAiInsight = false,
  hideUsageLimits = false,
  defaultFeatureId,
  usageProfile = 'healthy',
}: SalesOrderFeatureUsageSectionProps) {
  const features = getSalesOrderFeatureUsage(orderId, usageProfile)
  const usageLimits = hideUsageLimits ? null : getSalesOrderUsageLimits(orderId)
  const preferredFeatureId =
    (defaultFeatureId && features?.some((f) => f.id === defaultFeatureId)
      ? defaultFeatureId
      : features?.[0]?.id) ?? ''
  const [selectedId, setSelectedId] = useState(preferredFeatureId)

  useEffect(() => {
    setSelectedId(preferredFeatureId)
  }, [orderId, preferredFeatureId])

  if (!features || features.length === 0) {
    return (
      <p className="text-[13px] text-brand-fog">Feature usage is not available for this sales order.</p>
    )
  }

  const selected = features.find((f) => f.id === selectedId) ?? features[0]

  return (
    <section>
      {!hideTitle && (
        <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Feature usage
        </h2>
      )}
      <div
        className={cn(
          'overflow-visible rounded-lg border border-neutral-200 bg-white px-4 pb-4 pt-4',
          !hideTitle && 'mt-6'
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <FeatureDropdown features={features} selectedId={selected.id} onSelect={setSelectedId} />
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-brand-mist transition-colors hover:bg-neutral-100 hover:text-brand-navy"
            title="Expand"
            aria-label="Expand chart"
          >
            <Maximize2 size={16} />
          </button>
        </div>
        {!hideAiInsight && (selected.aiInsightTitle || selected.aiInsight) && (
          <div className="mb-6 flex items-start gap-2">
            <span className="mt-1 shrink-0">
              <GradientSparkle size={14} />
            </span>
            <div className="min-w-0 max-w-[720px]">
              {selected.aiInsightTitle && (
                <p className="font-heading text-[18px] font-normal leading-[1.4] tracking-[-0.25px] text-brand-navy">
                  {selected.aiInsightTitle}
                </p>
              )}
              {selected.aiInsight && (
                <p
                  className={cn(
                    'text-[12px] leading-[1.5] text-brand-fog',
                    selected.aiInsightTitle && 'mt-2'
                  )}
                >
                  {selected.aiInsight}
                </p>
              )}
            </div>
          </div>
        )}
        <FeatureUsageChart feature={selected} />
      </div>
      {usageLimits && usageLimits.length > 0 && (
        <div className="mt-8">
          <UsageLimitCards metrics={usageLimits} />
        </div>
      )}
    </section>
  )
}

export default SalesOrderFeatureUsageSection
