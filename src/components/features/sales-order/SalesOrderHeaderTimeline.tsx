import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import {
  dateToTimelinePercent,
  parseTimelineDate,
} from '@/data/salesOrderTimelineMock'

interface SalesOrderHeaderTimelineProps {
  orderId: string
  variant?: string | null
  /** Reports the picked marker plus its position on the axis, so callers can anchor to it. */
  onVersionChange?: (version?: { id: 'v1' | 'v2'; trackPercent: number }) => void
  /** Page content below the axis — dashed columns extend behind this. */
  children?: ReactNode | ((ctx: {
    periodIndex: number
    selectedVersionId?: string
  }) => ReactNode)
}

interface ContractPeriod {
  /** 1-based period index within the 3-year contract */
  index: number
  rangeLabel: string
  startDate: string
  endDate: string
}

/**
 * Three annual periods across the Pioneer term (May 2026 – Apr 2029).
 * Default Period 1 matches “3rd month running.”
 */
const CONTRACT_PERIODS: ContractPeriod[] = [
  {
    index: 1,
    rangeLabel: 'May 2026 - Apr 2027',
    startDate: '2026-05-01',
    endDate: '2027-04-30',
  },
  {
    index: 2,
    rangeLabel: 'May 2027 - Apr 2028',
    startDate: '2027-05-01',
    endDate: '2028-04-30',
  },
  {
    index: 3,
    rangeLabel: 'May 2028 - Apr 2029',
    startDate: '2028-05-01',
    endDate: '2029-04-30',
  },
]

const DEFAULT_PERIOD_INDEX = 1
/** Full Pioneer contract span (3 annual periods). */
const FULL_TERM_START = CONTRACT_PERIODS[0].startDate
const FULL_TERM_END = CONTRACT_PERIODS[CONTRACT_PERIODS.length - 1].endDate
/** Prototype “today” — Year 1 Q4, two weeks ahead of the amendment taking effect. */
const INVOICE_OVERDUE_TODAY_DATE = '2027-02-15'
const INVOICE_OVERDUE_TODAY_LABEL = "Feb 15 '27"
/** Subtle inset for full-term date scale — keeps May/Apr off the axis edges. */
const FULL_TERM_EDGE_PAD = 1.25

/** Upcoming ramp milestones at Year 2 / Year 3 starts (dotted circles). */
const RAMP_MARKERS = [
  {
    id: 'ramp-y2',
    date: '2027-05-01',
    title: 'Ramp · Year 2',
    detail: '+25 seats · +7% platform price',
    dateLabel: "May 1 '27",
  },
  {
    id: 'ramp-y3',
    date: '2028-05-01',
    title: 'Ramp · Year 3',
    detail: '+1 sandbox · +7% platform price',
    dateLabel: "May 1 '28",
  },
] as const

/** Signed contract versions on the axis — v1 the original order, v2 the current amendment. */
const VERSION_MARKERS = [
  {
    id: 'v1',
    version: 'v1',
    title: 'Original contract',
    detail: 'SO-2026-0153 · 50 seats',
    date: '2026-05-01',
    dateLabel: "May 1 '26",
    tone: 'default',
  },
  {
    id: 'v2',
    version: 'v2',
    title: 'Contract expansion',
    detail: '+25 seats · +$32,000 ARR',
    date: '2027-04-01',
    dateLabel: "Apr 1 '27",
    tone: 'positive',
  },
] as const

type VersionMarker = (typeof VERSION_MARKERS)[number]

/** Lucide `flag` path with optional longer pole (sticky timeline). */
function YearFlag({
  longPole = false,
  className,
  fillOpacity = 0.35,
}: {
  longPole?: boolean
  className?: string
  fillOpacity?: number
}) {
  // Default lucide flag: pole M4 22V4… — extend to y=30 when stuck
  const d = longPole
    ? 'M4 30V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528'
    : 'M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={longPole ? '0 0 24 32' : '0 0 24 24'}
      width={12}
      height={longPole ? 16 : 12}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={d} fill="currentColor" fillOpacity={fillOpacity} />
    </svg>
  )
}

function toTrackPercent(rawPercent: number, padded: boolean): number {
  if (!padded) return rawPercent
  return FULL_TERM_EDGE_PAD + (rawPercent / 100) * (100 - FULL_TERM_EDGE_PAD * 2)
}

function formatMonthLabel(date: Date, isEdge: boolean, showYear = false): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  if (!isEdge && !showYear) return month
  const yy = String(date.getFullYear()).slice(-2)
  return `${month} '${yy}`
}

function buildMonthTicks(
  startDate: string,
  endDate: string,
  stepMonths = 1,
) {
  const start = parseTimelineDate(startDate)
  const end = parseTimelineDate(endDate)
  const months: { date: Date; iso: string }[] = []

  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor <= last) {
    months.push({
      date: new Date(cursor),
      iso: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-01`,
    })
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + stepMonths, 1)
  }

  // Always include the term end month when stepping
  if (months.length > 0) {
    const lastTick = months[months.length - 1].date
    if (
      lastTick.getFullYear() !== last.getFullYear() ||
      lastTick.getMonth() !== last.getMonth()
    ) {
      months.push({
        date: new Date(last),
        iso: `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-01`,
      })
    }
  }

  const startMonth = start.getMonth()
  return months.map((month, index) => {
    const isEdge = index === 0 || index === months.length - 1
    const isPeriodStart = index > 0 && month.date.getMonth() === startMonth
    const showYear = isEdge || isPeriodStart
    return {
      ...month,
      label: formatMonthLabel(month.date, isEdge, isPeriodStart),
      /** Year-boundary Mays (May '26 / '27 / '28) — slightly darker label */
      emphasize: showYear && month.date.getMonth() === startMonth,
    }
  })
}

export function SalesOrderHeaderTimeline({
  orderId: _orderId,
  variant: _variant,
  onVersionChange,
  children,
}: SalesOrderHeaderTimelineProps) {
  // Single sales-order page: always Invoice overdue full-term timeline
  const showFullTerm = true
  const [periodIndex] = useState(DEFAULT_PERIOD_INDEX)
  const period =
    CONTRACT_PERIODS.find((p) => p.index === periodIndex) ?? CONTRACT_PERIODS[0]

  const axisStart = showFullTerm ? FULL_TERM_START : period.startDate
  const axisEnd = showFullTerm ? FULL_TERM_END : period.endDate

  const [renewalHovered, setRenewalHovered] = useState<{ rect: DOMRect } | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined)
  const [versionHovered, setVersionHovered] = useState<{
    marker: VersionMarker
    rect: DOMRect
  } | null>(null)
  const [rampHovered, setRampHovered] = useState<{
    id: string
    title: string
    detail: string
    dateLabel: string
    rect: DOMRect
  } | null>(null)
  const [isTimelineStuck, setIsTimelineStuck] = useState(false)
  /** Scroll containers offset a sticky stop by their own padding — cancel it so the axis pins flush. */
  const [scrollPadTop, setScrollPadTop] = useState(0)
  const stickyChromeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const chrome = stickyChromeRef.current
    if (!chrome) return

    const getScrollParent = (el: Element): HTMLElement | null => {
      let parent = el.parentElement
      while (parent) {
        const { overflowY } = getComputedStyle(parent)
        if (
          (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
          parent.scrollHeight > parent.clientHeight
        ) {
          return parent
        }
        parent = parent.parentElement
      }
      return null
    }

    const scrollParent = getScrollParent(chrome)
    if (!scrollParent) return

    const measurePadTop = () => {
      setScrollPadTop(parseFloat(getComputedStyle(scrollParent).paddingTop) || 0)
    }

    const updateStuck = () => {
      const chromeTop = chrome.getBoundingClientRect().top
      const parentTop = scrollParent.getBoundingClientRect().top
      // Negative sticky top pins the chrome to the container edge, padding included
      setIsTimelineStuck(chromeTop <= parentTop + 1)
    }

    const handleResize = () => {
      measurePadTop()
      updateStuck()
    }

    measurePadTop()
    updateStuck()
    scrollParent.addEventListener('scroll', updateStuck, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      scrollParent.removeEventListener('scroll', updateStuck)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const months = useMemo(
    () => buildMonthTicks(axisStart, axisEnd, showFullTerm ? 3 : 1),
    [axisStart, axisEnd, showFullTerm],
  )

  const activeTodayDate = INVOICE_OVERDUE_TODAY_DATE
  const activeTodayLabel = INVOICE_OVERDUE_TODAY_LABEL

  const todayInPeriod =
    parseTimelineDate(activeTodayDate) >= parseTimelineDate(axisStart) &&
    parseTimelineDate(activeTodayDate) <= parseTimelineDate(axisEnd)
  const todayPercent = todayInPeriod
    ? dateToTimelinePercent(activeTodayDate, axisStart, axisEnd)
    : null
  const todayTrackPercent =
    todayPercent != null ? toTrackPercent(todayPercent, showFullTerm) : null

  const trackLeft = (dateStr: string) =>
    toTrackPercent(dateToTimelinePercent(dateStr, axisStart, axisEnd), showFullTerm)

  const selectedVersionId = VERSION_MARKERS.find((m) => m.id === selectedVersion)?.version
  const isTodaySelected = selectedVersion == null && todayTrackPercent != null

  const monthGridStyle = {
    gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
  }

  return (
    <div className="w-full">
      <div
        ref={stickyChromeRef}
        className="sticky z-20 bg-white pb-4"
        style={{ top: -scrollPadTop }}
        data-timeline-stuck={isTimelineStuck ? 'true' : 'false'}
      >
      {/* Year milestones — stacked by default; beside flags with longer pole when stuck */}
      {showFullTerm && (
        <div
          className={cn(
            'relative transition-[height,margin] duration-200',
            isTimelineStuck ? 'mb-0 h-5' : 'mb-2 h-7'
          )}
        >
          {CONTRACT_PERIODS.map((p) => {
            const flagColor =
              p.index === 1 ? 'text-green-600' : 'text-neutral-400'
            const fillOpacity = p.index === 1 ? 0.45 : 0.35

            if (isTimelineStuck) {
              return (
                <div
                  key={`year-${p.index}`}
                  className="absolute bottom-0 flex items-start gap-1.5"
                  style={{ left: `${trackLeft(p.startDate)}%` }}
                >
                  <YearFlag
                    longPole
                    className={cn('shrink-0 translate-y-px', flagColor)}
                    fillOpacity={fillOpacity}
                  />
                  <span className="pt-0.5 whitespace-nowrap text-[11px] font-medium leading-none text-brand-navy">
                    Year {p.index}
                  </span>
                </div>
              )
            }

            return (
              <div
                key={`year-${p.index}`}
                className="absolute top-0 flex flex-col items-start gap-0.5"
                style={{ left: `${trackLeft(p.startDate)}%` }}
              >
                <YearFlag
                  className={cn('shrink-0', flagColor)}
                  fillOpacity={fillOpacity}
                />
                <span className="whitespace-nowrap text-[11px] font-medium leading-tight text-brand-navy">
                  Year {p.index}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Timeline band: top line → months → bottom line */}
      <div className="relative">
        {/* Elapsed fill — Invoice overdue only: axis left → today */}
        {showFullTerm && todayTrackPercent != null && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-0"
            style={{
              width: `${todayTrackPercent}%`,
              background:
                'linear-gradient(90deg, rgba(255, 51, 0, 0.18) 0%, rgba(139, 92, 246, 0.22) 100%)',
            }}
          />
        )}

        {/* Top axis line — above month labels */}
        <div className="relative z-10 h-px bg-neutral-300" />

        {/* Month labels — between the two axis lines */}
        <div className="relative z-10">
          {showFullTerm ? (
            <div className="relative h-9">
              {months.map((month) => {
                const left = trackLeft(month.iso)
                return (
                  <div
                    key={`label-${month.iso}`}
                    className={cn(
                      'absolute top-2.5 whitespace-nowrap text-left text-[10px] font-medium tracking-[0.02em]',
                      month.emphasize ? 'font-semibold text-brand-navy' : 'text-brand-fog',
                    )}
                    style={{ left: `${left}%` }}
                  >
                    {month.label}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid" style={monthGridStyle}>
              {months.map((month, index) => (
                <div
                  key={`label-${month.iso}`}
                  className={cn(
                    'relative py-2 text-[10px] font-medium tracking-[0.02em]',
                    month.emphasize ? 'font-semibold text-brand-navy' : 'text-brand-fog',
                    index === 0 ? 'text-left' : index === months.length - 1 ? 'text-right' : 'text-center',
                  )}
                >
                  {month.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom axis + markers (same positioning as before) */}
        <div className="relative">
          <div className="relative z-10 h-px bg-neutral-300" />

          {/* Month tick marks — above the axis, aligned with labels */}
          {showFullTerm &&
            months.map((month) => {
              const left = trackLeft(month.iso)
              return (
                <span
                  key={`tick-${month.iso}`}
                  aria-hidden
                  className="pointer-events-none absolute z-10 h-1.5 w-px -translate-y-full bg-neutral-300"
                  style={{ left: `${left}%`, top: 0 }}
                />
              )
            })}

          {/* Today — diamond on the axis with label beneath */}
          {todayTrackPercent != null && (
            <div
              className="absolute z-20 -translate-x-1/2"
              style={{ left: `${todayTrackPercent}%`, top: 0 }}
              aria-pressed={isTodaySelected}
              aria-label={`Today, ${activeTodayLabel}`}
            >
              <span
                className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-blue-600"
                aria-hidden
              />
              <span className="absolute left-1/2 top-1.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-[-0.01em] text-blue-700">
                Today
              </span>
            </div>
          )}

          {/* Ramp markers — Year 2 / Year 3 (dotted, like renewal) */}
          {showFullTerm &&
            RAMP_MARKERS.map((ramp) => {
              const isHovered = rampHovered?.id === ramp.id
              return (
                <button
                  key={ramp.id}
                  type="button"
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-default"
                  style={{ left: `${trackLeft(ramp.date)}%`, top: 0 }}
                  onMouseEnter={(e) => {
                    setRampHovered({
                      id: ramp.id,
                      title: ramp.title,
                      detail: ramp.detail,
                      dateLabel: ramp.dateLabel,
                      rect: e.currentTarget.getBoundingClientRect(),
                    })
                  }}
                  onMouseLeave={() => setRampHovered(null)}
                  aria-label={ramp.title}
                >
                  <span
                    className={cn(
                      'block h-3 w-3 rounded-full border border-dashed border-neutral-400 bg-white transition-all duration-200',
                      isHovered && 'scale-110 shadow-[0_0_0_3px_rgba(163,163,163,0.2)]',
                    )}
                  />
                </button>
              )
            })}

          {/* Contract versions — v1 original order, v2 the amendment */}
          {VERSION_MARKERS.map((marker) => {
            const isSelected = selectedVersion === marker.id
            const isHovered = versionHovered?.marker.id === marker.id
            const isPositive = marker.tone === 'positive'

            return (
              <button
                key={marker.id}
                type="button"
                onClick={() => {
                  const nextVersion = selectedVersion === marker.id ? undefined : marker.id
                  setSelectedVersion(nextVersion)
                  onVersionChange?.(
                    nextVersion
                      ? { id: nextVersion, trackPercent: trackLeft(marker.date) }
                      : undefined
                  )
                }}
                onMouseEnter={(e) => {
                  setVersionHovered({ marker, rect: e.currentTarget.getBoundingClientRect() })
                }}
                onMouseLeave={() => setVersionHovered(null)}
                aria-pressed={isSelected}
                aria-label={`${marker.version}: ${marker.title}, ${marker.detail}, ${marker.dateLabel}`}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ left: `${trackLeft(marker.date)}%`, top: 0 }}
              >
                <span
                  className={cn(
                    'relative flex h-3 w-3 items-center justify-center rounded-full text-[7px] font-bold leading-none ring-1 transition-colors',
                    // v2 is the version being viewed — solid fill and halo, same size as v1
                    isPositive
                      ? isHovered
                        ? 'scale-110 bg-green-600 text-white ring-green-600 shadow-[0_0_0_4px_rgba(22,163,74,0.22)] transition-all duration-200'
                        : isSelected
                          ? 'bg-green-600 text-white ring-green-600 shadow-[0_0_0_4px_rgba(22,163,74,0.22)]'
                          : 'bg-green-600 text-white ring-green-600 shadow-[0_0_0_3px_rgba(22,163,74,0.14)]'
                      : isHovered
                        ? 'scale-110 bg-blue-500 text-white ring-blue-500 shadow-[0_0_0_3px_rgba(37,99,235,0.2)] transition-all duration-200'
                        : isSelected
                          ? 'bg-blue-500 text-white ring-blue-500'
                          : 'bg-blue-50 text-blue-700 ring-blue-200'
                  )}
                >
                  {isHovered && (
                    <span
                      className={cn(
                        'absolute inset-0 animate-ping rounded-full opacity-40',
                        isPositive ? 'bg-green-500' : 'bg-blue-400'
                      )}
                    />
                  )}
                  <span className="relative z-[1]">{marker.version}</span>
                </span>
              </button>
            )
          })}

          {/* Renewal marker — after term end */}
          {showFullTerm && (
            <button
              type="button"
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-default"
              style={{
                left: `${Math.min(100, trackLeft(FULL_TERM_END) + 1.75)}%`,
                top: 0,
              }}
              onMouseEnter={(e) => {
                setRenewalHovered({ rect: e.currentTarget.getBoundingClientRect() })
              }}
              onMouseLeave={() => setRenewalHovered(null)}
              aria-label="Renewal"
            >
              <span
                className={cn(
                  'block h-3 w-3 rounded-full border border-dashed border-neutral-400 bg-white transition-all duration-200',
                  renewalHovered && 'scale-110 shadow-[0_0_0_3px_rgba(163,163,163,0.2)]',
                )}
              />
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Page content below the axis */}
      <div className="relative">
        {rampHovered &&
          createPortal(
            <div
              className="pointer-events-none fixed z-[9999] flex -translate-x-1/2 flex-col items-center"
              style={{
                left: rampHovered.rect.left + rampHovered.rect.width / 2,
                top: rampHovered.rect.bottom + 8,
              }}
            >
              <span className="mb-1.5 h-3 w-px border-l border-dashed border-neutral-300" />
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
                <p className="whitespace-nowrap text-[12px] font-semibold text-brand-navy">
                  {rampHovered.title}
                </p>
                <p className="whitespace-nowrap text-[12px] text-brand-navy">
                  {rampHovered.detail}
                </p>
                <p className="mt-0.5 whitespace-nowrap text-[11px] text-brand-fog">
                  {rampHovered.dateLabel} · upcoming
                </p>
              </div>
            </div>,
            document.body
          )}

        {versionHovered &&
          createPortal(
            <div
              className="pointer-events-none fixed z-[9999] flex -translate-x-1/2 flex-col items-center"
              style={{
                left: versionHovered.rect.left + versionHovered.rect.width / 2,
                top: versionHovered.rect.bottom + 8,
              }}
            >
              <span className="mb-1.5 h-3 w-px border-l border-dashed border-neutral-300" />
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
                <p
                  className={cn(
                    'whitespace-nowrap text-[12px]',
                    versionHovered.marker.tone === 'positive'
                      ? 'font-semibold text-green-700'
                      : 'font-medium text-brand-navy'
                  )}
                >
                  {versionHovered.marker.title}
                </p>
                <p className="whitespace-nowrap text-[12px] text-brand-navy">
                  {versionHovered.marker.detail}
                </p>
                <p className="mt-0.5 whitespace-nowrap text-[11px] text-brand-fog">
                  {versionHovered.marker.dateLabel}
                </p>
              </div>
            </div>,
            document.body
          )}

        {renewalHovered &&
          createPortal(
            <div
              className="pointer-events-none fixed z-[9999] flex -translate-x-1/2 flex-col items-center"
              style={{
                left: renewalHovered.rect.left + renewalHovered.rect.width / 2,
                top: renewalHovered.rect.bottom + 8,
              }}
            >
              <span className="mb-1.5 h-3 w-px border-l border-dashed border-neutral-300" />
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
                <p className="whitespace-nowrap text-[12px] font-semibold text-brand-navy">
                  Renewal
                </p>
                <p className="mt-0.5 whitespace-nowrap text-[11px] text-brand-fog">
                  May 1 &apos;29 · upcoming
                </p>
              </div>
            </div>,
            document.body
          )}

        {children ? (
          <div className="relative z-10 space-y-10 pt-10">
            {typeof children === 'function'
              ? children({ periodIndex, selectedVersionId })
              : children}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SalesOrderHeaderTimeline
