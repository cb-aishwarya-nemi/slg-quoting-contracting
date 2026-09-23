import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VersionMark } from '@/components/ui/VersionMark'
import {
  dateToTimelinePercent,
  parseTimelineDate,
} from '@/data/salesOrderTimelineMock'

interface SalesOrderHeaderTimelineProps {
  orderId: string
  variant?: string | null
  /** Hide the built-in "Contract timeline" label when a parent section already titles it. */
  showHeading?: boolean
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
/** Renewal falls the day after the term ends. */
const RENEWAL_DATE = '2029-05-01'
/** Prototype “today” — late Year 1, March on the full-term axis. */
const INVOICE_OVERDUE_TODAY_DATE = '2027-03-15'
const INVOICE_OVERDUE_TODAY_LABEL = "Mar 15 '27"
/** Subtle inset for full-term date scale — keeps May/Apr off the axis edges. */
const FULL_TERM_EDGE_PAD = 1.25

/** Scheduled ramps across the term — those before today read as already applied. */
const RAMP_MARKERS = [
  {
    id: 'ramp-y1-mid',
    date: '2026-11-01',
    title: 'Ramp · Mid Year 1',
    detail: '+10 seats · Growth services',
    dateLabel: "Nov 1 '26",
  },
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

/**
 * Contract versions — v1 the original order, each amendment the next version.
 * `kind` drives the colour: expansions green, contractions red.
 */
const VERSION_MARKERS: {
  id: string
  version: string
  kind: 'original' | 'expansion' | 'contraction'
  date: string
  title: string
  detail: string
  dateLabel: string
}[] = [
  {
    id: 'version-1',
    version: 'v1',
    kind: 'original',
    date: '2026-05-01',
    title: 'Original contract',
    detail: 'SO-2026-0153 · 50 seats',
    dateLabel: "May 1 '26",
  },
  {
    id: 'version-2',
    version: 'v2',
    kind: 'expansion',
    date: '2026-09-15',
    title: 'Amendment · Premium support',
    detail: '+Premium support SLA',
    dateLabel: "Sep 15 '26",
  },
  {
    id: 'version-3',
    version: 'v3',
    kind: 'expansion',
    date: '2027-08-01',
    title: 'Amendment · Contract expansion',
    detail: '+15 seats · Premium support upgrade',
    dateLabel: "Aug 1 '27",
  },
]

/** Hollow dot for anything not yet in effect. */
const UPCOMING_DOT = 'border border-dashed border-neutral-400 bg-white'

/** Simplified axis: every milestone is a 7px dot — filled once in effect, outlined while ahead. */
const COMPACT_DOT = 'block h-[7px] w-[7px] rounded-full border transition-all duration-200'

/** Minimal marks contract versions with a diamond so they read apart from the ramp dots. */
const COMPACT_DIAMOND = 'block h-[8px] w-[8px] rotate-45 border transition-all duration-200'

/** Minimal 2 version flags — same tones as the diamonds they replace. */
const VERSION_FLAG_TONES = {
  default: 'text-blue-500',
  positive: 'text-green-600',
  critical: 'text-red-600',
} as const

/** Minimal only: filled dots take a 1px white stroke to lift them off the gradient line. */
const FILLED_DOT_STROKE = 'ring-1 ring-white'

const COMPACT_DOT_TONES = {
  default: {
    filled: 'border-blue-500 bg-blue-500',
    outlined: 'border-blue-500 bg-white',
    glow: 'shadow-[0_0_0_3px_rgba(59,130,246,0.14)]',
  },
  positive: {
    filled: 'border-green-600 bg-green-600',
    outlined: 'border-green-600 bg-white',
    glow: 'shadow-[0_0_0_3px_rgba(22,163,74,0.14)]',
  },
  critical: {
    filled: 'border-red-600 bg-red-600',
    outlined: 'border-red-500 bg-white',
    glow: 'shadow-[0_0_0_3px_rgba(220,38,38,0.14)]',
  },
  neutral: {
    filled: 'border-brand-mist bg-brand-mist',
    outlined: 'border-neutral-400 bg-white',
    glow: 'shadow-[0_0_0_3px_rgba(155,153,180,0.2)]',
  },
} as const

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

/** Minimal 2 contract version — filled once signed, outline while still ahead.
 *  Pole lifts the cloth just clear of the axis. */
function VersionFlag({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 36"
      width={12}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path
        d="M4 34V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"
        fill={filled ? 'currentColor' : 'white'}
      />
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
  variant,
  showHeading = true,
  children,
}: SalesOrderHeaderTimelineProps) {
  const isTimelineHidden = false
  /** Minimal collapses the axis to a single progress line; today reads off the gradient end.
   *  Minimal 2 keeps that line, swaps version diamonds for flags, and drops year markers. */
  const isMinimal = variant === 'minimal' || variant === 'minimal-2'
  const isMinimal2 = variant === 'minimal-2'
  /** Simplified and minimal both trade the numbered discs for uniform 7px dots. */
  const compactDots = variant === 'filled-simplified' || isMinimal
  /** Single year narrows the axis to one contract period — no year flags, monthly ticks. */
  const showFullTerm = variant !== 'single-year'
  const [periodIndex] = useState(DEFAULT_PERIOD_INDEX)
  const period =
    CONTRACT_PERIODS.find((p) => p.index === periodIndex) ?? CONTRACT_PERIODS[0]

  const axisStart = showFullTerm ? FULL_TERM_START : period.startDate
  const axisEnd = showFullTerm ? FULL_TERM_END : period.endDate

  const [renewalHovered, setRenewalHovered] = useState<{ rect: DOMRect } | null>(null)
  const [rampHovered, setRampHovered] = useState<{
    id: string
    title: string
    detail: string
    dateLabel: string
    status: string
    rect: DOMRect
  } | null>(null)
  const [isTimelineStuck, setIsTimelineStuck] = useState(false)
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

    const updateStuck = () => {
      const chromeTop = chrome.getBoundingClientRect().top
      const parentTop = scrollParent.getBoundingClientRect().top
      // Sticky `top-0` — stuck once the chrome reaches the scrollport top
      setIsTimelineStuck(chromeTop <= parentTop + 1)
    }

    updateStuck()
    scrollParent.addEventListener('scroll', updateStuck, { passive: true })
    window.addEventListener('resize', updateStuck)
    return () => {
      scrollParent.removeEventListener('scroll', updateStuck)
      window.removeEventListener('resize', updateStuck)
    }
  }, [])

  const months = useMemo(
    // Minimal steps half-yearly; the full term quarterly; a single period monthly.
    () => buildMonthTicks(axisStart, axisEnd, showFullTerm ? (isMinimal ? 6 : 3) : 1),
    [axisStart, axisEnd, showFullTerm, isMinimal],
  )

  const activeTodayDate = INVOICE_OVERDUE_TODAY_DATE
  const activeTodayLabel = INVOICE_OVERDUE_TODAY_LABEL

  /** Anything on or before today has already taken effect. */
  const hasPassed = (date: string) =>
    parseTimelineDate(date) <= parseTimelineDate(activeTodayDate)

  /** Countdown for anything still ahead — “in 12 days”, “in 5 months”, “in 2 years”. */
  const timeUntil = (date: string) => {
    const days = Math.round(
      (parseTimelineDate(date).getTime() - parseTimelineDate(activeTodayDate).getTime()) /
        86_400_000,
    )
    if (days <= 0) return 'today'
    if (days < 31) return `in ${days} ${days === 1 ? 'day' : 'days'}`
    const months = Math.round(days / 30.44)
    if (months < 12) return `in ${months} ${months === 1 ? 'month' : 'months'}`
    const years = Math.round(months / 12)
    return `in ${years} ${years === 1 ? 'year' : 'years'}`
  }

  const todayInPeriod =
    parseTimelineDate(activeTodayDate) >= parseTimelineDate(axisStart) &&
    parseTimelineDate(activeTodayDate) <= parseTimelineDate(axisEnd)
  const todayPercent = todayInPeriod
    ? dateToTimelinePercent(activeTodayDate, axisStart, axisEnd)
    : null
  const todayTrackPercent = todayPercent != null ? toTrackPercent(todayPercent, true) : null

  /** Markers only make sense inside the span the axis is showing. */
  const withinAxis = (date: string) => {
    const value = parseTimelineDate(date)
    return value >= parseTimelineDate(axisStart) && value <= parseTimelineDate(axisEnd)
  }

  /** Centre of the axis line, so every marker sits on it rather than half a pixel above. */
  const markerTop = isMinimal ? 1.5 : 0.5

  const trackLeft = (dateStr: string) =>
    toTrackPercent(dateToTimelinePercent(dateStr, axisStart, axisEnd), true)

  const selectedVersionId = undefined
  const isTodaySelected = todayTrackPercent != null

  if (isTimelineHidden) {
    return (
      <div className="w-full">
        {children ? (
          <div className="space-y-16 pt-6">
            {typeof children === 'function'
              ? children({ periodIndex, selectedVersionId })
              : children}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="w-full">
      {showHeading && (
        <h2 className="mb-4 mt-6 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Contract timeline
        </h2>
      )}

      {/* Sticky timeline chrome only — title scrolls away */}
      <div
        ref={stickyChromeRef}
        className="sticky top-0 z-20 bg-white pb-4"
        data-timeline-stuck={isTimelineStuck ? 'true' : 'false'}
      >
      {/* Year milestones — stacked by default; beside flags with longer pole when stuck.
          Minimal 2 has no year markers. */}
      {showFullTerm && !isMinimal2 && (
        <div
          className={cn(
            'relative transition-[height,margin] duration-200',
            isMinimal ? 'mb-2 h-5' : isTimelineStuck ? 'mb-0 h-5' : 'mb-2 h-7'
          )}
        >
          {CONTRACT_PERIODS.map((p) => {
            const flagColor =
              p.index === 1 ? 'text-green-600' : 'text-neutral-400'
            const fillOpacity = p.index === 1 ? 0.45 : 0.35

            // Minimal — flag on the line with a short Y1 / Y2 / Y3 beside it
            if (isMinimal) {
              return (
                <div
                  key={`year-${p.index}`}
                  // Pole sits 2px into the 12px glyph — pull it back so it lines up with the markers
                  className="absolute bottom-0 flex -translate-x-[2px] items-start gap-1"
                  style={{ left: `${trackLeft(p.startDate)}%` }}
                >
                  <YearFlag
                    longPole
                    className={cn('shrink-0 translate-y-px', flagColor)}
                    fillOpacity={fillOpacity}
                  />
                  <span className="pt-0.5 whitespace-nowrap text-[10px] font-medium leading-none text-brand-fog">
                    Y{p.index}
                  </span>
                </div>
              )
            }

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

      {/* Timeline band: top line → months → bottom line. Minimal flips it so months sit below. */}
      <div className={cn('relative', isMinimal && 'flex flex-col-reverse', isMinimal2 && 'pt-5')}>
        {/* Elapsed fill — axis left → today. Minimal carries it on the line instead. */}
        {!isMinimal && todayTrackPercent != null && (
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

        {/* Top axis line — above month labels; minimal runs on a single line only */}
        {!isMinimal && <div className="relative z-10 h-px bg-neutral-300" />}

        {/* Month labels — positioned by date so they line up with the ticks */}
        <div className="relative z-10">
          <div className="relative h-9">
            {months.map((month) => (
              <div
                key={`label-${month.iso}`}
                className={cn(
                  'absolute top-2.5 whitespace-nowrap text-left text-[10px] font-medium tracking-[0.02em]',
                  month.emphasize ? 'font-semibold text-brand-navy' : 'text-brand-fog',
                )}
                style={{ left: `${trackLeft(month.iso)}%` }}
              >
                {month.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom axis + markers (same positioning as before) */}
        <div className="relative">
          {isMinimal ? (
            /* Minimal — one line: a 3px gradient for the elapsed span, 1px grey for the rest */
            <div className="relative z-10 h-[3px] w-full">
              <div
                aria-hidden
                className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-neutral-300"
              />
              {todayTrackPercent != null && (
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${todayTrackPercent}%`,
                    background: 'linear-gradient(90deg, #ff3300 0%, #8b5cf6 100%)',
                  }}
                />
              )}
            </div>
          ) : (
            <div className="relative z-10 h-px bg-neutral-300" />
          )}

          {/* Month tick marks — on the label side of the axis */}
          {months.map((month) => {
              const left = trackLeft(month.iso)
              return (
                <span
                  key={`tick-${month.iso}`}
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute z-10 h-1.5 w-px bg-neutral-300',
                    !isMinimal && '-translate-y-full',
                  )}
                  style={{ left: `${left}%`, top: isMinimal ? 3 : 0 }}
                />
              )
            })}

          {/* Today — diamond on the axis with label beneath; minimal marks it with the gradient end */}
          {!isMinimal && todayTrackPercent != null && (
            <div
              className="absolute z-20 -translate-x-1/2"
              style={{ left: `${todayTrackPercent}%`, top: markerTop }}
              aria-pressed={isTodaySelected}
              aria-label={`Today, ${activeTodayLabel}`}
            >
              <span
                className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-blue-600"
                aria-hidden
              />
              <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-[-0.01em] text-blue-700">
                Today
              </span>
            </div>
          )}

          {/* Ramps — applied ones sit filled on the elapsed span, upcoming stay dotted.
              Single year leaves them off and shows contract versions only. */}
          {showFullTerm &&
            RAMP_MARKERS.filter((ramp) => withinAxis(ramp.date)).map((ramp) => {
              const isHovered = rampHovered?.id === ramp.id
              const applied = hasPassed(ramp.date)
              return (
                <button
                  key={ramp.id}
                  type="button"
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-default"
                  style={{ left: `${trackLeft(ramp.date)}%`, top: markerTop }}
                  onMouseEnter={(e) => {
                    setRampHovered({
                      id: ramp.id,
                      title: ramp.title,
                      detail: ramp.detail,
                      dateLabel: ramp.dateLabel,
                      status: applied ? 'applied' : timeUntil(ramp.date),
                      rect: e.currentTarget.getBoundingClientRect(),
                    })
                  }}
                  onMouseLeave={() => setRampHovered(null)}
                  aria-label={ramp.title}
                >
                  <span
                    className={cn(
                      compactDots
                        ? cn(
                            COMPACT_DOT,
                            COMPACT_DOT_TONES.neutral[applied ? 'filled' : 'outlined'],
                            applied && isMinimal && FILLED_DOT_STROKE,
                          )
                        : cn(
                            'block h-2.5 w-2.5 rounded-full transition-all duration-200',
                            applied ? 'border border-brand-fog bg-brand-fog' : UPCOMING_DOT,
                          ),
                      isHovered &&
                        (isMinimal
                          ? cn('scale-110', COMPACT_DOT_TONES.neutral.glow)
                          : 'scale-125 shadow-[0_0_0_3px_rgba(163,163,163,0.2)]'),
                    )}
                  />
                </button>
              )
            })}

          {/* Contract versions — v1 original, then each amendment; signed ones read solid */}
          {VERSION_MARKERS.filter((marker) => withinAxis(marker.date)).map((marker) => {
              const isHovered = rampHovered?.id === marker.id
              const signed = hasPassed(marker.date)
              const isOriginal = marker.kind === 'original'
              const versionTone = isOriginal
                ? 'default'
                : marker.kind === 'contraction'
                  ? 'critical'
                  : 'positive'
              return (
                <button
                  key={marker.id}
                  type="button"
                  className={cn(
                    'absolute z-30 cursor-default',
                    isMinimal2
                      ? '-translate-x-[2px] -translate-y-[calc(100%-1px)]'
                      : '-translate-x-1/2 -translate-y-1/2',
                  )}
                  style={{ left: `${trackLeft(marker.date)}%`, top: markerTop }}
                  onMouseEnter={(e) => {
                    setRampHovered({
                      id: marker.id,
                      title: marker.title,
                      detail: marker.detail,
                      dateLabel: marker.dateLabel,
                      status: signed ? 'signed' : timeUntil(marker.date),
                      rect: e.currentTarget.getBoundingClientRect(),
                    })
                  }}
                  onMouseLeave={() => setRampHovered(null)}
                  aria-label={`${marker.version}: ${marker.title}`}
                >
                  {compactDots ? (
                    isMinimal2 ? (
                      <VersionFlag
                        filled={signed}
                        className={cn(
                          'transition-transform duration-200',
                          VERSION_FLAG_TONES[versionTone],
                          isHovered && 'origin-bottom-left scale-110',
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          isMinimal ? COMPACT_DIAMOND : COMPACT_DOT,
                          COMPACT_DOT_TONES[versionTone][signed ? 'filled' : 'outlined'],
                          signed && isMinimal && FILLED_DOT_STROKE,
                          isHovered &&
                            (isMinimal
                              ? cn('scale-110', COMPACT_DOT_TONES[versionTone].glow)
                              : 'scale-125'),
                        )}
                      />
                    )
                  ) : (
                    <VersionMark
                      version={marker.version}
                      tone={versionTone}
                      variant={signed ? 'solid' : 'outline'}
                      className={cn('transition-all duration-200', isHovered && 'scale-125')}
                    />
                  )}
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
                top: markerTop,
              }}
              onMouseEnter={(e) => {
                setRenewalHovered({ rect: e.currentTarget.getBoundingClientRect() })
              }}
              onMouseLeave={() => setRenewalHovered(null)}
              aria-label="Renewal"
            >
              {isMinimal ? (
                /* Minimal — renewal reads as a refresh glyph rather than another dot */
                <span
                  className={cn(
                    'flex h-[15px] w-[15px] items-center justify-center rounded-full bg-white text-brand-fog transition-all duration-200',
                    renewalHovered && 'scale-125',
                  )}
                >
                  <RefreshCw className="h-3 w-3" strokeWidth={2} />
                </span>
              ) : (
                <span
                  className={cn(
                    compactDots
                      ? cn(COMPACT_DOT, COMPACT_DOT_TONES.neutral.outlined)
                      : cn(
                          'block h-2.5 w-2.5 rounded-full transition-all duration-200',
                          UPCOMING_DOT,
                        ),
                    renewalHovered && 'scale-125 shadow-[0_0_0_3px_rgba(163,163,163,0.2)]',
                  )}
                />
              )}
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
                {rampHovered.detail && (
                  <p className="whitespace-nowrap text-[12px] text-brand-navy">
                    {rampHovered.detail}
                  </p>
                )}
                <p className="mt-0.5 whitespace-nowrap text-[11px] text-brand-fog">
                  {rampHovered.dateLabel} · {rampHovered.status}
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
                  May 1 &apos;29 · {timeUntil(RENEWAL_DATE)}
                </p>
              </div>
            </div>,
            document.body
          )}

        {children ? (
          <div className="relative z-10 space-y-16 pt-14">
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
