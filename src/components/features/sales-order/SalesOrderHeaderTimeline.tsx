import { useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dateToTimelinePercent,
  parseTimelineDate,
} from '@/data/salesOrderTimelineMock'

interface SalesOrderHeaderTimelineProps {
  orderId: string
  variant?: string | null
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
/** Prototype “today” — late Year 1, March on the full-term axis. */
const INVOICE_OVERDUE_TODAY_DATE = '2027-03-15'
const INVOICE_OVERDUE_TODAY_LABEL = "Mar 15 '27"
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
  const [rampHovered, setRampHovered] = useState<{
    id: string
    title: string
    detail: string
    dateLabel: string
    rect: DOMRect
  } | null>(null)

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

  const selectedVersionId = undefined
  const isTodaySelected = todayTrackPercent != null

  const monthGridStyle = {
    gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 mt-6 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
        Contract lifecycle
      </h2>

      {/* Sticky timeline chrome only — title scrolls away */}
      <div className="sticky top-0 z-20 bg-white pb-4">
      {/* Year milestones — above the top axis (full-term only) */}
      {showFullTerm && (
        <div className="relative mb-2 h-7">
          {CONTRACT_PERIODS.map((p) => (
            <div
              key={`year-${p.index}`}
              className="absolute top-0 flex flex-col items-start gap-0.5"
              style={{ left: `${trackLeft(p.startDate)}%` }}
            >
              <Flag
                size={12}
                strokeWidth={1.75}
                className={p.index === 1 ? 'text-green-600' : 'text-neutral-400'}
                fill="currentColor"
                fillOpacity={p.index === 1 ? 0.45 : 0.35}
              />
              <span className="whitespace-nowrap text-[11px] font-medium leading-tight text-brand-navy">
                Year {p.index}
              </span>
            </div>
          ))}
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
              <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-[-0.01em] text-blue-700">
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
                      'block h-4 w-4 rounded-full border border-dashed border-neutral-400 bg-white transition-all duration-200',
                      isHovered && 'scale-110 shadow-[0_0_0_4px_rgba(163,163,163,0.2)]',
                    )}
                  />
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
                  'block h-4 w-4 rounded-full border border-dashed border-neutral-400 bg-white transition-all duration-200',
                  renewalHovered && 'scale-110 shadow-[0_0_0_4px_rgba(163,163,163,0.2)]',
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
