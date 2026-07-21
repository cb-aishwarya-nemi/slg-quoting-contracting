import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dateToTimelinePercent,
  parseTimelineDate,
} from '@/data/salesOrderTimelineMock'

interface SalesOrderHeaderTimelineProps {
  orderId: string
  onVersionSelect?: (versionId: string) => void
}

interface AmendmentMarker {
  id: string
  version: string
  title: string
  detail: string
  date: string
  dateLabel: string
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
 * Three periods across the Pioneer term.
 * Default (Period 2/3) matches the attached reference: Jan–Dec 2026.
 */
const CONTRACT_PERIODS: ContractPeriod[] = [
  {
    index: 1,
    rangeLabel: 'May - Dec 2025',
    startDate: '2025-05-01',
    endDate: '2025-12-31',
    amendments: [
      {
        id: 'a1',
        version: 'v1',
        title: 'Amendment 1',
        detail: 'Original',
        date: '2025-05-01',
        dateLabel: "May 01 '25",
      },
      {
        id: 'a1b',
        version: 'v2',
        title: 'Amendment 1b',
        detail: 'Ramp adjust',
        date: '2025-09-15',
        dateLabel: "Sep 15 '25",
      },
    ],
  },
  {
    index: 2,
    rangeLabel: 'Jan - Dec 2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    amendments: [
      {
        id: 'a2',
        version: 'v3',
        title: 'Amendment 2',
        detail: '+ 25 seats',
        date: '2026-03-01',
        dateLabel: "Mar 01 '26",
      },
      {
        id: 'a3',
        version: 'v4',
        title: 'Amendment 3',
        detail: 'Extended term',
        date: '2026-07-09',
        dateLabel: "Jul 09 '26",
      },
    ],
  },
  {
    index: 3,
    rangeLabel: 'Jan - Apr 2029',
    startDate: '2029-01-01',
    endDate: '2029-04-30',
    amendments: [
      {
        id: 'a4',
        version: 'v5',
        title: 'Amendment 4',
        detail: 'Price freeze',
        date: '2029-02-01',
        dateLabel: "Feb 01 '29",
      },
    ],
  },
]

const DEFAULT_PERIOD_INDEX = 2
const TOTAL_PERIODS = 3
/** Prototype “today” — falls in Period 2 (after Amendment 3). */
const TODAY_DATE = '2026-07-21'
/** Leading gutter before the first month tick. */
const AXIS_PAD_LEFT = 4
const AXIS_PAD_RIGHT = 1

/** Map a 0–100 calendar percent into the padded axis. */
function toAxisPercent(calendarPercent: number): number {
  const span = 100 - AXIS_PAD_LEFT - AXIS_PAD_RIGHT
  return AXIS_PAD_LEFT + (calendarPercent / 100) * span
}

function formatMonthLabel(date: Date, isEdge: boolean): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  if (!isEdge) return month
  const yy = String(date.getFullYear()).slice(-2)
  return `${month} '${yy}`
}

function buildMonthTicks(startDate: string, endDate: string) {
  const start = parseTimelineDate(startDate)
  const end = parseTimelineDate(endDate)
  const months: { date: Date; startPercent: number }[] = []

  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor <= last) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-01`
    months.push({
      date: new Date(cursor),
      startPercent: toAxisPercent(dateToTimelinePercent(iso, startDate, endDate)),
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
  onVersionSelect,
}: SalesOrderHeaderTimelineProps) {
  const [periodIndex, setPeriodIndex] = useState(DEFAULT_PERIOD_INDEX)
  const period =
    CONTRACT_PERIODS.find((p) => p.index === periodIndex) ?? CONTRACT_PERIODS[1]

  const defaultSelected =
    period.amendments[period.amendments.length - 1]?.id ?? period.amendments[0]?.id
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultSelected)

  const months = useMemo(
    () => buildMonthTicks(period.startDate, period.endDate),
    [period.startDate, period.endDate]
  )

  const todayInPeriod =
    parseTimelineDate(TODAY_DATE) >= parseTimelineDate(period.startDate) &&
    parseTimelineDate(TODAY_DATE) <= parseTimelineDate(period.endDate)
  const todayPercent = todayInPeriod
    ? toAxisPercent(dateToTimelinePercent(TODAY_DATE, period.startDate, period.endDate))
    : null

  const pastAmendmentCount = CONTRACT_PERIODS.filter((p) => p.index < periodIndex).reduce(
    (sum, p) => sum + p.amendments.length,
    0
  )
  const pastAmendmentsLabel =
    pastAmendmentCount === 1
      ? '← 1 past amendment'
      : pastAmendmentCount > 1
        ? `← ${pastAmendmentCount} past amendments`
        : null

  const handlePeriodChange = (next: number) => {
    if (next < 1 || next > TOTAL_PERIODS) return
    setPeriodIndex(next)
    const nextPeriod = CONTRACT_PERIODS.find((p) => p.index === next)
    const nextSelected =
      nextPeriod?.amendments[nextPeriod.amendments.length - 1]?.id ??
      nextPeriod?.amendments[0]?.id
    setSelectedId(nextSelected)
  }

  const handleSelect = (marker: AmendmentMarker) => {
    setSelectedId(marker.id)
    onVersionSelect?.(marker.id)
  }

  return (
    <div className="w-full px-1 pb-4 pt-3">
      {/* Period navigator */}
      <div className="mb-3 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous period"
            disabled={periodIndex <= 1}
            onClick={() => handlePeriodChange(periodIndex - 1)}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md text-blue-600 transition-colors',
              periodIndex <= 1
                ? 'cursor-not-allowed opacity-30'
                : 'cursor-pointer hover:bg-blue-50'
            )}
          >
            <ChevronLeft size={16} strokeWidth={2.25} />
          </button>
          <p className="text-[13px] font-medium text-brand-navy">
            Period {periodIndex}/{TOTAL_PERIODS}
          </p>
          <button
            type="button"
            aria-label="Next period"
            disabled={periodIndex >= TOTAL_PERIODS}
            onClick={() => handlePeriodChange(periodIndex + 1)}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md text-blue-600 transition-colors',
              periodIndex >= TOTAL_PERIODS
                ? 'cursor-not-allowed opacity-30'
                : 'cursor-pointer hover:bg-blue-50'
            )}
          >
            <ChevronRight size={16} strokeWidth={2.25} />
          </button>
        </div>
        <p className="mt-0.5 text-[12px] text-brand-fog">{period.rangeLabel}</p>
      </div>

      {/* Axis + amendments */}
      <div className="relative mx-2 pt-5">
        {pastAmendmentsLabel && (
          <button
            type="button"
            onClick={() => handlePeriodChange(periodIndex - 1)}
            disabled={periodIndex <= 1}
            className={cn(
              'mb-2 block text-left text-[12px] font-medium text-brand-navy',
              periodIndex <= 1
                ? 'cursor-default'
                : 'cursor-pointer hover:text-blue-700'
            )}
          >
            {pastAmendmentsLabel}
          </button>
        )}

        {/* Month ticks hang below the axis; circles sit on the line */}
        <div className="relative h-5">
          <div className="absolute inset-x-0 top-0 h-px bg-neutral-300" />
          {months.map((month, index) => (
            <div
              key={`${month.label}-${index}`}
              className="absolute top-0 w-px bg-neutral-300"
              style={{ left: `${month.startPercent}%`, height: 8 }}
            />
          ))}

          {/* Today marker */}
          {todayPercent != null && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2"
              style={{ left: `${todayPercent}%` }}
            >
              <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-blue-700">
                Today
              </span>
              <div className="h-5 w-0.5 bg-blue-600" />
            </div>
          )}

          {period.amendments.map((marker) => {
            const left = toAxisPercent(
              dateToTimelinePercent(marker.date, period.startDate, period.endDate)
            )
            const isSelected = selectedId === marker.id

            return (
              <button
                key={marker.id}
                type="button"
                onClick={() => handleSelect(marker)}
                aria-pressed={isSelected}
                aria-label={`${marker.version}: ${marker.title}, ${marker.detail}, ${marker.dateLabel}`}
                className="group/marker absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ left: `${left}%` }}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-500 text-[9px] font-bold shadow-sm transition-colors',
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 text-blue-700',
                    'group-hover/marker:bg-blue-500 group-hover/marker:text-white'
                  )}
                >
                  {marker.version}
                </span>
                {/* Amendment details — visible on hover */}
                <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden -translate-x-1/2 flex-col items-center group-hover/marker:flex">
                  <span className="mb-2 h-5 w-px border-l border-dashed border-blue-300" />
                  <span className="whitespace-nowrap text-[12px] font-medium text-brand-navy">
                    {marker.title}
                  </span>
                  <span className="whitespace-nowrap text-[12px] text-brand-navy">
                    {marker.detail}
                  </span>
                  <span className="mt-0.5 whitespace-nowrap text-[11px] text-brand-fog">
                    {marker.dateLabel}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Month labels — under each month-start tick */}
        <div className="relative mt-1.5 h-4">
          {months.map((month, index) => (
            <span
              key={`label-${month.label}-${index}`}
              className={cn(
                'absolute whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.04em] text-brand-fog',
                index === 0 ? 'translate-x-0' : '-translate-x-1/2'
              )}
              style={{ left: `${month.startPercent}%` }}
            >
              {month.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SalesOrderHeaderTimeline
