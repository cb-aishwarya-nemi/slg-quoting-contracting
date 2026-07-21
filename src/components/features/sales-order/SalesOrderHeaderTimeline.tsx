import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  dateToTimelinePercent,
  parseTimelineDate,
} from '@/data/salesOrderTimelineMock'

interface SalesOrderHeaderTimelineProps {
  orderId: string
  onVersionSelect?: (versionId: string) => void
}

type VersionStatus = 'complete' | 'current' | 'upcoming'

interface VersionMarker {
  id: string
  version: string
  title: string
  subtitle: string
  date: string
  status: VersionStatus
}

interface AxisMonth {
  label: string
  startPercent: number
}

/** Pioneer 36-month contract: May 2026 → Apr 2029. */
const HEADER_TIMELINE = {
  startDate: '2026-05-01',
  endDate: '2029-04-30',
  /** Between v4 (Feb 2027) and v5 (pending). */
  todayDate: '2027-02-10',
} as const

/**
 * Contract versions — labels from product reference; placed on the 3-year axis.
 */
const VERSION_MARKERS: VersionMarker[] = [
  {
    id: 'v1',
    version: 'v1',
    title: 'Original',
    subtitle: 'May 2026',
    date: '2026-05-01',
    status: 'complete',
  },
  {
    id: 'v2',
    version: 'v2',
    title: '+25 seats',
    subtitle: 'Aug 2026',
    date: '2026-08-01',
    status: 'complete',
  },
  {
    id: 'v3',
    version: 'v3',
    title: 'Extended',
    subtitle: 'Nov 2026',
    date: '2026-11-01',
    status: 'complete',
  },
  {
    id: 'v4',
    version: 'v4',
    title: 'Price freeze',
    subtitle: 'Feb 2027',
    date: '2027-02-01',
    status: 'current',
  },
  {
    id: 'v5',
    version: 'v5',
    title: 'In progress',
    subtitle: 'Pending sig.',
    date: '2027-02-22',
    status: 'upcoming',
  },
]

/** Quarterly month ticks across a multi-year contract (keeps the strip readable). */
function buildContractAxis(startDate: string, endDate: string): AxisMonth[] {
  const start = parseTimelineDate(startDate)
  const end = parseTimelineDate(endDate)
  const rangeMs = end.getTime() - start.getTime()
  const toPercent = (date: Date) =>
    Math.max(0, Math.min(100, ((date.getTime() - start.getTime()) / rangeMs) * 100))

  const months: AxisMonth[] = []
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end) {
    const month = cursor.getMonth()
    const isYearStart = month === 0
    const isQuarter = month % 3 === 0
    const isFirst = months.length === 0

    if (isFirst || isYearStart || isQuarter) {
      const monthName = cursor.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
      const label =
        isFirst || isYearStart ? `${monthName} ${cursor.getFullYear()}` : monthName
      const segmentStart = new Date(Math.max(cursor.getTime(), start.getTime()))
      months.push({ label, startPercent: toPercent(segmentStart) })
    }

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }

  return months
}

export function SalesOrderHeaderTimeline({
  orderId: _orderId,
  onVersionSelect,
}: SalesOrderHeaderTimelineProps) {
  const { startDate, endDate, todayDate } = HEADER_TIMELINE

  const months = useMemo(() => buildContractAxis(startDate, endDate), [startDate, endDate])
  const todayPercent = dateToTimelinePercent(todayDate, startDate, endDate)
  const showToday =
    parseTimelineDate(todayDate) >= parseTimelineDate(startDate) &&
    parseTimelineDate(todayDate) <= parseTimelineDate(endDate)

  const defaultId =
    VERSION_MARKERS.find((m) => m.status === 'current')?.id ?? VERSION_MARKERS[0].id
  const [selectedId, setSelectedId] = useState(defaultId)

  const current = VERSION_MARKERS.find((m) => m.status === 'current')
  const progressEnd = current
    ? dateToTimelinePercent(current.date, startDate, endDate)
    : todayPercent

  const handleSelect = (marker: VersionMarker) => {
    setSelectedId(marker.id)
    onVersionSelect?.(marker.id)
  }

  return (
    <div className="relative w-full border-y border-neutral-200 px-1 pb-2 pt-8">
      <div className="relative w-full">
        {/* Version chips on the axis */}
        {VERSION_MARKERS.map((marker) => {
          const left = dateToTimelinePercent(marker.date, startDate, endDate)
          const isUpcoming = marker.status === 'upcoming'
          const isCurrent = marker.status === 'current'
          const isComplete = marker.status === 'complete'
          const isSelected = selectedId === marker.id

          return (
            <button
              key={marker.id}
              type="button"
              onClick={() => handleSelect(marker)}
              aria-pressed={isSelected}
              aria-label={`${marker.version}: ${marker.title}, ${marker.subtitle}`}
              className={cn(
                'absolute top-[-22px] z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center',
                isSelected && 'z-30'
              )}
              style={{ left: `${left}%` }}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-shadow',
                  isUpcoming &&
                    'border border-dashed border-amber-500 bg-white text-amber-600',
                  isCurrent && 'bg-blue-600 text-white',
                  isComplete && 'bg-neutral-300 text-brand-fog',
                  isSelected && !isUpcoming && 'ring-2 ring-blue-200',
                  isSelected && isUpcoming && 'ring-2 ring-amber-200'
                )}
              >
                {marker.version}
              </span>
            </button>
          )
        })}

        {/* Progress through current version */}
        <div
          className="pointer-events-none absolute left-0 top-[11px] z-[1] h-px bg-neutral-300"
          style={{ width: `${progressEnd}%` }}
        />

        {/* Today */}
        {showToday && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 -translate-x-1/2 bg-blue-600"
            style={{ left: `${todayPercent}%` }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-blue-700">
              Today
            </span>
          </div>
        )}

        {/* Quarterly month labels across the 3-year term */}
        <div className="relative h-[22px] border-b border-neutral-200/80">
          {months.map((month, index) => (
            <div key={`${month.label}-${index}`}>
              <div
                className="absolute top-0 h-full w-px bg-neutral-200/80"
                style={{ left: `${month.startPercent}%` }}
              />
              <span
                className="absolute top-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.04em] text-brand-fog"
                style={{
                  left: `${month.startPercent}%`,
                  paddingLeft: index === 0 ? 8 : 6,
                }}
              >
                {month.label}
              </span>
            </div>
          ))}
        </div>

        {/* Version captions under the axis */}
        <div className="relative mt-3 h-11">
          {VERSION_MARKERS.map((marker) => {
            const left = dateToTimelinePercent(marker.date, startDate, endDate)
            const isUpcoming = marker.status === 'upcoming'
            const isCurrent = marker.status === 'current'
            const isSelected = selectedId === marker.id

            return (
              <button
                key={`caption-${marker.id}`}
                type="button"
                onClick={() => handleSelect(marker)}
                className={cn(
                  'absolute flex -translate-x-1/2 cursor-pointer flex-col items-center rounded-md px-1 transition-opacity',
                  !isSelected && 'opacity-70 hover:opacity-100'
                )}
                style={{ left: `${left}%` }}
              >
                <p
                  className={cn(
                    'whitespace-nowrap text-[11px] font-semibold',
                    isUpcoming ? 'text-amber-600' : 'text-brand-navy'
                  )}
                >
                  {marker.title}
                </p>
                <p className="whitespace-nowrap text-[10px] text-brand-fog">{marker.subtitle}</p>
                {isCurrent && (
                  <span className="mt-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-blue-700">
                    Current
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SalesOrderHeaderTimeline
