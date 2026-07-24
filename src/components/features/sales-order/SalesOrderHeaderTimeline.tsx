import { useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dateToTimelinePercent,
  parseTimelineDate,
} from '@/data/salesOrderTimelineMock'

interface SalesOrderHeaderTimelineProps {
  orderId: string
  variant?: string | null
  onVersionSelect?: (versionId: string) => void
  /** Page content below the axis — dashed columns extend behind this. */
  children?: ReactNode | ((ctx: { periodIndex: number }) => ReactNode)
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
/** Prototype “today” — 3rd month of Period 1. */
const TODAY_DATE = '2026-07-22'

function formatMonthLabel(date: Date, isEdge: boolean): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  if (!isEdge) return month
  const yy = String(date.getFullYear()).slice(-2)
  return `${month} '${yy}`
}

function buildMonthTicks(startDate: string, endDate: string) {
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
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }

  return months.map((month, index) => ({
    ...month,
    label: formatMonthLabel(month.date, index === 0 || index === months.length - 1),
  }))
}

export function SalesOrderHeaderTimeline({
  orderId: _orderId,
  variant,
  onVersionSelect,
  children,
}: SalesOrderHeaderTimelineProps) {
  const isJustCreated = variant == null || variant === 'just-created'
  const [periodIndex, setPeriodIndex] = useState(DEFAULT_PERIOD_INDEX)
  const period =
    CONTRACT_PERIODS.find((p) => p.index === periodIndex) ?? CONTRACT_PERIODS[0]

  const visibleAmendments = period.amendments.filter((marker) => {
    // Just created: show green amendments only (no v1)
    if (isJustCreated) return marker.tone === 'positive'
    return true
  })

  const defaultSelected = isJustCreated
    ? undefined
    : visibleAmendments[visibleAmendments.length - 1]?.id
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultSelected)
  const [hoveredMarker, setHoveredMarker] = useState<{
    marker: AmendmentMarker
    rect: DOMRect
  } | null>(null)

  const months = useMemo(
    () => buildMonthTicks(period.startDate, period.endDate),
    [period.startDate, period.endDate]
  )

  const todayInPeriod =
    parseTimelineDate(TODAY_DATE) >= parseTimelineDate(period.startDate) &&
    parseTimelineDate(TODAY_DATE) <= parseTimelineDate(period.endDate)
  const todayPercent = todayInPeriod
    ? dateToTimelinePercent(TODAY_DATE, period.startDate, period.endDate)
    : null

  const handlePeriodChange = (next: number) => {
    if (next < 1 || next > TOTAL_PERIODS) return
    setPeriodIndex(next)
    const nextPeriod = CONTRACT_PERIODS.find((p) => p.index === next)
    const nextVisible = (nextPeriod?.amendments ?? []).filter((marker) => {
      if (isJustCreated) return marker.tone === 'positive'
      return true
    })
    setSelectedId(
      isJustCreated ? undefined : nextVisible[nextVisible.length - 1]?.id
    )
  }

  const handleSelect = (marker: AmendmentMarker) => {
    setSelectedId(marker.id)
    // Pass version label (v2) so history view can open on the matching snapshot
    onVersionSelect?.(marker.version)
  }

  const monthGridStyle = {
    gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
  }

  return (
    <div className="w-full pt-1">
      {/* Range label + period nav */}
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
        <div className="flex items-baseline gap-2">
          <p className="text-[13px] font-medium text-brand-navy">
            Period {periodIndex}/{TOTAL_PERIODS}
          </p>
          <span className="text-[11px] text-brand-fog" aria-hidden>
            ·
          </span>
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

      {/* Top axis line — above month labels */}
      <div className="h-px bg-neutral-300" />

      {/* Month labels — between the two axis lines */}
      <div className="grid" style={monthGridStyle}>
        {months.map((month, index) => (
          <div
            key={`label-${month.iso}`}
            className={cn(
              'py-2 text-[10px] font-medium tracking-[0.02em] text-brand-fog',
              index === 0 ? 'text-left' : index === months.length - 1 ? 'text-right' : 'text-center'
            )}
          >
            {month.label}
          </div>
        ))}
      </div>

      {/* Axis + full-page dashed columns + page content */}
      <div className="relative">
        {/* Dashed vertical month columns — stretch through all children */}
        <div
          className="pointer-events-none absolute inset-0 z-0 grid opacity-40"
          style={monthGridStyle}
          aria-hidden
        >
          {months.map((month, index) => (
            <div
              key={`col-${month.iso}`}
              className={cn(
                'h-full border-neutral-300',
                index > 0 && 'border-l border-dashed'
              )}
            />
          ))}
        </div>

        {/* Bottom axis line */}
        <div className="relative z-10 h-px bg-neutral-300" />

        {/* Today — blue dot on the axis */}
        {todayPercent != null && (
          <div
            className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${todayPercent}%` }}
            aria-label="Today"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
            </span>
          </div>
        )}

        {/* Version / amendment markers — on the axis with Today */}
        {visibleAmendments.map((marker) => {
          const left = dateToTimelinePercent(marker.date, period.startDate, period.endDate)
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
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${left}%`, top: 0 }}
            >
              <span
                className={cn(
                  'relative flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold transition-colors',
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
            {typeof children === 'function' ? children({ periodIndex }) : children}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SalesOrderHeaderTimeline
