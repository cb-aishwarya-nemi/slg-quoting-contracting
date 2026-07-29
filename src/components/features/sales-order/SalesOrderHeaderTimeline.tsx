import { useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
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

interface AmendmentMarker {
  id: string
  version: string
  title: string
  detail: string
  date: string
  dateLabel: string
  /** Visual tone for the marker chip */
  tone?: 'default' | 'positive'
}

interface ContractPeriod {
  /** 1-based period index within the 3-year contract */
  index: number
  rangeLabel: string
  startDate: string
  endDate: string
  amendments: AmendmentMarker[]
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
    amendments: [
      {
        id: 'a1',
        version: 'v1',
        title: 'Original order',
        detail: 'SO-2026-0153',
        date: '2026-05-01',
        dateLabel: "May 01 '26",
      },
      {
        id: 'a-jun',
        version: 'v2',
        title: 'Contract expansion',
        detail: '+25 seats · ramp adjust',
        date: '2026-06-15',
        dateLabel: "Jun 15 '26",
        tone: 'positive',
      },
    ],
  },
  {
    index: 2,
    rangeLabel: 'May 2027 - Apr 2028',
    startDate: '2027-05-01',
    endDate: '2028-04-30',
    amendments: [],
  },
  {
    index: 3,
    rangeLabel: 'May 2028 - Apr 2029',
    startDate: '2028-05-01',
    endDate: '2029-04-30',
    amendments: [],
  },
]

const DEFAULT_PERIOD_INDEX = 1
const TOTAL_PERIODS = 3
/** Full Pioneer contract span (3 annual periods). */
const FULL_TERM_START = CONTRACT_PERIODS[0].startDate
const FULL_TERM_END = CONTRACT_PERIODS[CONTRACT_PERIODS.length - 1].endDate
/** Prototype “today” — Just created (3rd month of Period 1). */
const TODAY_DATE = '2026-07-22'
const TODAY_LABEL = "Jul 22 '26"
/** Prototype “today” — Invoice overdue full-term view. */
const INVOICE_OVERDUE_TODAY_DATE = '2027-04-26'
const INVOICE_OVERDUE_TODAY_LABEL = "Apr 26 '27"
/** Invoice overdue only — v2 sits in August on the full-term axis. */
const INVOICE_OVERDUE_V2_DATE = '2026-08-15'
const INVOICE_OVERDUE_V2_DATE_LABEL = "Aug 15 '26"
/** Subtle inset for full-term date scale — keeps May/Apr off the axis edges. */
const FULL_TERM_EDGE_PAD = 1.25

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
  children,
}: SalesOrderHeaderTimelineProps) {
  const isJustCreated = variant == null || variant === 'just-created'
  const isInvoiceOverdue = variant === 'invoice-overdue'
  const preferTodaySelection = isJustCreated || isInvoiceOverdue
  const showFullTerm = isInvoiceOverdue
  const [periodIndex, setPeriodIndex] = useState(DEFAULT_PERIOD_INDEX)
  const period =
    CONTRACT_PERIODS.find((p) => p.index === periodIndex) ?? CONTRACT_PERIODS[0]

  const axisStart = showFullTerm ? FULL_TERM_START : period.startDate
  const axisEnd = showFullTerm ? FULL_TERM_END : period.endDate

  const visibleAmendments = showFullTerm
    ? CONTRACT_PERIODS.flatMap((p) =>
        p.amendments.map((marker) =>
          marker.version === 'v2'
            ? {
                ...marker,
                date: INVOICE_OVERDUE_V2_DATE,
                dateLabel: INVOICE_OVERDUE_V2_DATE_LABEL,
              }
            : marker,
        ),
      )
    : period.amendments

  const defaultSelected = preferTodaySelection
    ? undefined
    : visibleAmendments[visibleAmendments.length - 1]?.id
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultSelected)
  const [hoveredMarker, setHoveredMarker] = useState<{
    marker: AmendmentMarker
    rect: DOMRect
  } | null>(null)
  const [todayHovered, setTodayHovered] = useState<{ rect: DOMRect } | null>(null)
  const [renewalHovered, setRenewalHovered] = useState<{ rect: DOMRect } | null>(null)

  const months = useMemo(
    () => buildMonthTicks(axisStart, axisEnd, showFullTerm ? 3 : 1),
    [axisStart, axisEnd, showFullTerm],
  )

  const activeTodayDate = showFullTerm ? INVOICE_OVERDUE_TODAY_DATE : TODAY_DATE
  const activeTodayLabel = showFullTerm ? INVOICE_OVERDUE_TODAY_LABEL : TODAY_LABEL

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

  const selectedVersionId = visibleAmendments.find((m) => m.id === selectedId)?.version
  const isTodaySelected = selectedId == null && todayTrackPercent != null

  const handlePeriodChange = (next: number) => {
    if (next < 1 || next > TOTAL_PERIODS) return
    setPeriodIndex(next)
    const nextPeriod = CONTRACT_PERIODS.find((p) => p.index === next)
    const nextVisible = nextPeriod?.amendments ?? []
    setSelectedId(
      preferTodaySelection ? undefined : nextVisible[nextVisible.length - 1]?.id,
    )
  }

  const handleSelect = (marker: AmendmentMarker) => {
    // Toggle off to restore the default period / Today view
    setSelectedId((prev) => (prev === marker.id ? undefined : marker.id))
  }

  const handleSelectToday = () => {
    setSelectedId(undefined)
  }

  const monthGridStyle = {
    gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
  }

  return (
    <div className="w-full">
      {/* Sticky timeline chrome — pins under SO header/tabs while sections scroll */}
      <div className="sticky top-0 z-20 bg-white pb-4">
      {/* Range label + period nav — hidden on Invoice overdue */}
      {!isInvoiceOverdue && (
      <div className="mb-3 flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous period"
          disabled={periodIndex <= 1}
          onClick={() => handlePeriodChange(periodIndex - 1)}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded text-brand-fog transition-colors',
            periodIndex <= 1
              ? 'cursor-not-allowed opacity-30'
              : 'cursor-pointer hover:bg-neutral-100 hover:text-brand-navy'
          )}
        >
          <ChevronLeft size={14} strokeWidth={2.25} />
        </button>
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-brand-navy">
            Period {periodIndex}/{TOTAL_PERIODS}
          </p>
          <span
            className="inline-block h-1 w-1 shrink-0 rounded-full bg-brand-fog"
            aria-hidden
          />
          <p className="text-[11px] font-medium text-brand-fog">{period.rangeLabel}</p>
        </div>
        <button
          type="button"
          aria-label="Next period"
          disabled={periodIndex >= TOTAL_PERIODS}
          onClick={() => handlePeriodChange(periodIndex + 1)}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded text-brand-fog transition-colors',
            periodIndex >= TOTAL_PERIODS
              ? 'cursor-not-allowed opacity-30'
              : 'cursor-pointer hover:bg-neutral-100 hover:text-brand-navy'
          )}
        >
          <ChevronRight size={14} strokeWidth={2.25} />
        </button>
      </div>
      )}

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

          {/* Today — blue dot on the axis (clickable: restore current view) */}
          {todayTrackPercent != null && (
            <button
              type="button"
              onClick={handleSelectToday}
              onMouseEnter={(e) => {
                setTodayHovered({ rect: e.currentTarget.getBoundingClientRect() })
              }}
              onMouseLeave={() => setTodayHovered(null)}
              aria-pressed={isTodaySelected}
              aria-label="Today"
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${todayTrackPercent}%`, top: 0 }}
            >
              <span
                className={cn(
                  'relative block h-3 w-3 rounded-full transition-all duration-200',
                  todayHovered && 'scale-110 shadow-[0_0_0_4px_rgba(37,99,235,0.2)]',
                )}
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-40" />
                <span className="relative z-[1] block h-3 w-3 rounded-full bg-blue-600" />
              </span>
            </button>
          )}

          {/* Version / amendment markers — on the axis with Today */}
          {visibleAmendments.map((marker) => {
            const left = trackLeft(marker.date)
            const isAtStart = left <= (showFullTerm ? FULL_TERM_EDGE_PAD + 0.5 : 0.5)
            const isSelected = selectedId === marker.id
            const isPositive = marker.tone === 'positive'
            const isHovered = hoveredMarker?.marker.id === marker.id

            return (
              <button
                key={marker.id}
                type="button"
                onClick={() => handleSelect(marker)}
                onMouseEnter={(e) => {
                  setHoveredMarker({
                    marker,
                    rect: e.currentTarget.getBoundingClientRect(),
                  })
                }}
                onMouseLeave={() => setHoveredMarker(null)}
                aria-pressed={isSelected}
                aria-label={`${marker.version}: ${marker.title}, ${marker.detail}, ${marker.dateLabel}`}
                className={cn(
                  'absolute z-20 -translate-y-1/2 cursor-pointer',
                  !isAtStart && '-translate-x-1/2',
                )}
                style={{ left: `${left}%`, top: 0 }}
              >
                <span
                  className={cn(
                    'relative flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold transition-colors',
                    showFullTerm && 'ring-1 ring-neutral-300',
                    isPositive
                      ? isHovered
                        ? 'scale-110 bg-green-600 text-white shadow-[0_0_0_4px_rgba(22,163,74,0.2)] transition-all duration-200'
                        : isSelected
                          ? 'bg-green-600 text-white'
                          : 'bg-green-100 text-green-700'
                      : isHovered
                        ? 'scale-110 bg-blue-500 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.2)] transition-all duration-200'
                        : isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-50 text-blue-700'
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

          {/* Renewal marker — after term end (Invoice overdue only) */}
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
        {todayHovered &&
          createPortal(
            <div
              className="pointer-events-none fixed z-[9999] flex -translate-x-1/2 flex-col items-center"
              style={{
                left: todayHovered.rect.left + todayHovered.rect.width / 2,
                top: todayHovered.rect.bottom + 8,
              }}
            >
              <span className="mb-1.5 h-3 w-px border-l border-dashed border-neutral-300" />
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
                <p className="whitespace-nowrap text-[12px] font-semibold text-blue-700">
                  Today
                </p>
                <p className="mt-0.5 whitespace-nowrap text-[11px] text-brand-fog">
                  {activeTodayLabel} · current view
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

        {hoveredMarker &&
          createPortal(
            <div
              className="pointer-events-none fixed z-[9999] flex -translate-x-1/2 flex-col items-center"
              style={{
                left: hoveredMarker.rect.left + hoveredMarker.rect.width / 2,
                top: hoveredMarker.rect.bottom + 8,
              }}
            >
              <span className="mb-1.5 h-3 w-px border-l border-dashed border-neutral-300" />
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
                <p
                  className={cn(
                    'whitespace-nowrap text-[12px]',
                    hoveredMarker.marker.tone === 'positive'
                      ? 'font-semibold text-green-700'
                      : 'font-medium text-brand-navy'
                  )}
                >
                  {hoveredMarker.marker.title}
                </p>
                <p className="whitespace-nowrap text-[12px] text-brand-navy">
                  {hoveredMarker.marker.detail}
                </p>
                <p className="mt-0.5 whitespace-nowrap text-[11px] text-brand-fog">
                  {hoveredMarker.marker.dateLabel}
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
