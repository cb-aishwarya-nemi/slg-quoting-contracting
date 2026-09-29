import { useRef, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'
import { dateToTimelinePercent } from '@/data/salesOrderTimelineMock'

const TERM_START = '2026-05-01'
const TERM_END = '2029-04-30'
/** Contract value on the start date, before any amendment or ramp. */
const STARTING_TCV = 492_000
/** Prototype "today" — everything before it reads as consumed. */
const TODAY = '2027-08-01'

type LifecycleKind = 'amend' | 'ramp'

interface LifecycleEvent {
  id: string
  kind: LifecycleKind
  date: string
  /** Rounded figure shown on the axis. */
  amount: string
  /** Unrounded contract-value change, in USD. */
  exactAmount: number
  summary: string
}

const EVENTS: LifecycleEvent[] = [
  {
    id: 'amend-1',
    kind: 'amend',
    date: '2026-11-01',
    amount: '+35k USD',
    exactAmount: 34850,
    summary: 'Added 15 Growth seats for the rest of Year 1',
  },
  {
    id: 'amend-2',
    kind: 'amend',
    date: '2027-02-01',
    amount: '−35k USD',
    exactAmount: -35012,
    summary: 'Removed the 15 Growth seats added in November',
  },
  {
    id: 'ramp-1',
    kind: 'ramp',
    date: '2027-05-01',
    amount: '+110k USD',
    exactAmount: 110400,
    summary: 'Year 2 ramp — Growth seats 50 to 75, with a 7% price increase',
  },
  {
    id: 'amend-3',
    kind: 'amend',
    date: '2027-11-01',
    amount: '−35k USD',
    exactAmount: -34960,
    summary: 'Reduced Growth seats by 15 for the rest of Year 2',
  },
  {
    id: 'ramp-2',
    kind: 'ramp',
    date: '2028-05-01',
    amount: '+110k USD',
    exactAmount: 109875,
    summary: 'Year 3 ramp — platform price up 7%, plus one sandbox',
  },
]

const KIND_STYLES: Record<LifecycleKind, { label: string; title: string; tone: string }> = {
  amend: { label: 'Amend', title: 'Amendment', tone: 'text-[#d97706]' },
  ramp: { label: 'Ramp', title: 'Ramp', tone: 'text-[#418442]' },
}

const ICON_FILL = 'transition-[fill] duration-150 group-hover/event:fill-current'

/** Marker padding plus the flagpole inside the 20px icon. The line meets the poles and stops there. */
const LINE_START = 8 + (5 / 24) * 20
const LINE_END = 8 + 20 - (5 / 24) * 20

const LABEL = 'text-[11px] font-medium uppercase leading-4 tracking-[-0.25px]'
const SUB = 'text-[11px] font-medium leading-4'

function percentOf(date: string) {
  return dateToTimelinePercent(date, TERM_START, TERM_END)
}

function FlagPennant({ className }: { className?: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinejoin="miter"
      strokeLinecap="square"
      className={className}
      aria-hidden
    >
      <path d="M5 22V3" />
      <path d="M5 3l15 6.5L5 16" className={ICON_FILL} />
    </svg>
  )
}

function RampArrow() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="4 4 12.9 12.9"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.95}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6.9 13.98 15.66 5.22M8.2 5.22h7.46v7.46" />
      <path
        d="M4.75 16.13 6.9 13.98"
        className="stroke-transparent transition-[stroke] duration-150 group-hover/event:stroke-current"
      />
      <path
        d="M16.3129 5.22043V13.7037C16.313 13.8329 16.2747 13.9591 16.203 14.0665C16.1313 14.1739 16.0294 14.2577 15.9101 14.3071C15.7908 14.3565 15.6595 14.3694 15.5328 14.3442C15.4062 14.319 15.2899 14.2568 15.1986 14.1654L6.71532 5.68212C6.62396 5.59085 6.56173 5.47453 6.5365 5.34788C6.51128 5.22123 6.52421 5.08994 6.57364 4.97064C6.62307 4.85133 6.70679 4.74938 6.8142 4.67768C6.92161 4.60599 7.04787 4.56777 7.17701 4.56787H15.6603C15.8334 4.56787 15.9993 4.63662 16.1217 4.759C16.2441 4.88138 16.3129 5.04736 16.3129 5.22043Z"
        className="stroke-transparent transition-[fill,stroke] duration-150 group-hover/event:fill-current group-hover/event:stroke-current"
      />
    </svg>
  )
}

/** Lucide pen-tool, mirrored on the horizontal axis so the nib points up. */
function AmendPen() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <g transform="translate(0 24) scale(1 -1)">
        <path
          d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"
          className={ICON_FILL}
        />
        <path
          d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"
          className="transition-[fill] duration-150 group-hover/event:fill-white"
        />
        <path
          d="m2.3 2.3 7.286 7.286"
          className="transition-[stroke] duration-150 group-hover/event:stroke-white"
        />
        <circle
          cx="11"
          cy="11"
          r="2"
          className="transition-[fill,stroke] duration-150 group-hover/event:fill-current group-hover/event:stroke-white"
        />
      </g>
    </svg>
  )
}

function formatEdgeDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  return `${month}'${String(date.getFullYear()).slice(-2)}`
}

function formatFullDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function monthsSinceStart(iso: string) {
  const start = new Date(`${TERM_START}T00:00:00`)
  const date = new Date(`${iso}T00:00:00`)
  return (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth())
}

/** Solid line is time already consumed. Events on the dashed line are still ahead. */
function timingLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  const today = new Date(`${TODAY}T00:00:00`)
  if (date <= today) {
    const months = monthsSinceStart(iso)
    return `${months} ${months === 1 ? 'month' : 'months'} since contract start`
  }
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000)
  if (days < 31) return `in ${days} ${days === 1 ? 'day' : 'days'}`
  const months = Math.round(days / 30.44)
  return `in ${months} ${months === 1 ? 'month' : 'months'}`
}

function monthsAgoLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  const today = new Date(`${TODAY}T00:00:00`)
  const months =
    (today.getFullYear() - date.getFullYear()) * 12 + (today.getMonth() - date.getMonth())
  return `${months} ${months === 1 ? 'month' : 'months'} ago`
}

function formatExactAmount(value: number) {
  const formatted = Math.abs(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  return `${value < 0 ? '-' : '+'}${formatted}`
}

function formatTcv(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/** Contract value after each event, starting from the value on the start date. */
const TCV_AFTER_EVENT = EVENTS.reduce<Record<string, number>>((totals, event) => {
  const previous = Object.values(totals).at(-1) ?? STARTING_TCV
  totals[event.id] = previous + event.exactAmount
  return totals
}, {})

const TOOLTIP =
  'pointer-events-none absolute top-full z-30 mt-1 hidden w-[280px] flex-col rounded-lg border border-neutral-200 bg-white text-left shadow-[0_8px_24px_rgba(28,27,46,0.12)] group-hover/event:flex'

function EdgeMarker({
  align,
  date,
  summary,
  timing,
}: {
  align: 'start' | 'end'
  date: string
  summary: string
  timing: string
}) {
  const label = align === 'start' ? 'Start' : 'End'
  return (
    <div
      data-timeline-marker
      className={cn(
        'group/event absolute -top-1 cursor-pointer text-brand-navy hover:z-30',
        align === 'start' ? 'left-0' : 'right-0',
      )}
    >
      <div
        data-dock-content
        className={cn(
          'flex transform-gpu flex-col rounded-lg px-2 py-1 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          align === 'start' ? 'origin-bottom-left items-start' : 'origin-bottom-right items-end',
        )}
        style={{ transform: 'scale(var(--dock-scale, 1))' }}
      >
        <span className={LABEL}>{label}</span>
        <span
          className={cn(
            'relative mt-0.5 flex h-5 items-center bg-white',
            align === 'start' ? 'pr-1.5' : 'pl-1.5',
          )}
        >
          <FlagPennant />
        </span>
        <span className={cn(SUB, 'mt-0.5 font-semibold')}>{formatEdgeDate(date)}</span>
      </div>
      <span role="tooltip" className={cn(TOOLTIP, align === 'start' ? 'left-0' : 'right-0')}>
        <span className="border-b border-neutral-100 px-3 py-2">
          <span className={LABEL}>{align === 'start' ? 'Contract start' : 'Contract end'}</span>
        </span>
        <span className="px-3 py-2.5 text-[12px] leading-[1.45] text-brand-navy">{summary}</span>
        <span className="flex items-center justify-between gap-3 border-t border-neutral-100 px-3 py-2">
          <span className="shrink-0 text-[12px] font-semibold text-brand-navy">{formatFullDate(date)}</span>
          <span className="text-right text-[11px] text-brand-fog">{timing}</span>
        </span>
      </span>
    </div>
  )
}

/**
 * Contract lifecycle axis: start and end flags, amendments and ramps on the
 * line. Time already consumed is a solid line; the rest of the term is dashed.
 */
export function ContractLifecycleTimeline() {
  const todayPercent = Math.min(100, Math.max(0, percentOf(TODAY)))
  const timelineRef = useRef<HTMLDivElement>(null)

  const resetDock = () => {
    timelineRef.current?.querySelectorAll<HTMLElement>('[data-dock-content]').forEach((item) => {
      item.style.removeProperty('--dock-scale')
    })
  }

  const magnifyDock = (event: MouseEvent<HTMLDivElement>) => {
    timelineRef.current?.querySelectorAll<HTMLElement>('[data-timeline-marker]').forEach((marker) => {
      const content = marker.querySelector<HTMLElement>('[data-dock-content]')
      if (!content) return

      const rect = marker.getBoundingClientRect()
      const distance = Math.abs(event.clientX - (rect.left + rect.width / 2))
      const proximity = Math.max(0, 1 - distance / 180)
      const scale = 1 + 0.18 * proximity * proximity
      content.style.setProperty('--dock-scale', scale.toFixed(3))
    })
  }

  return (
    <div
      ref={timelineRef}
      className="relative z-20 h-[64px] w-full"
      onMouseMove={magnifyDock}
      onMouseLeave={resetDock}
    >
      {/* Axis runs through the centre of the 20px icon row, below the 16px label and 2px gap. */}
      <div className="absolute inset-x-0 top-[28px] h-px">
        <div
          className="absolute top-0 h-px bg-neutral-900"
          style={{ left: LINE_START, width: `max(0px, calc(${todayPercent}% - ${LINE_START}px))` }}
        />
        <div
          className="absolute top-0 border-t border-dashed border-neutral-900"
          style={{ left: `max(${todayPercent}%, ${LINE_START}px)`, right: LINE_END }}
        />
      </div>

      <EdgeMarker
        align="start"
        date={TERM_START}
        summary="Pioneer Systems begins a 36-month, $492,000.00 contract."
        timing={monthsAgoLabel(TERM_START)}
      />

      {EVENTS.map((event, index) => {
        const { label, title, tone } = KIND_STYLES[event.kind]
        const ordinal = EVENTS.slice(0, index + 1).filter((e) => e.kind === event.kind).length
        return (
          <div
            key={event.id}
            data-timeline-marker
            className={cn(
              'group/event absolute -top-1 -translate-x-1/2 cursor-pointer hover:z-30',
              tone,
            )}
            style={{ left: `${percentOf(event.date)}%` }}
          >
            <div
              data-dock-content
              className="flex origin-bottom transform-gpu flex-col items-center px-2 py-1 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: 'scale(var(--dock-scale, 1))' }}
            >
              <span className={LABEL}>{label}</span>
              <span className="relative mt-0.5 flex h-5 items-center bg-white px-1.5">
                {event.kind === 'amend' ? <AmendPen /> : <RampArrow />}
              </span>
              <span className={cn(SUB, 'mt-0.5 whitespace-nowrap')}>{event.amount}</span>
            </div>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 hidden w-[280px] -translate-x-1/2 flex-col rounded-lg border border-neutral-200 bg-white text-left shadow-[0_8px_24px_rgba(28,27,46,0.12)] group-hover/event:flex"
            >
                <span className="flex items-center justify-between gap-3 border-b border-neutral-100 px-3 py-2">
                  <span className={cn(LABEL, tone)}>
                    {title} {ordinal}
                  </span>
                  <span className={cn('text-[12px] font-semibold', tone)}>
                    {formatExactAmount(event.exactAmount)}
                  </span>
                </span>
                <span className="px-3 py-2.5 text-[12px] leading-[1.45] text-brand-navy">
                  {event.summary}, making the TCV {formatTcv(TCV_AFTER_EVENT[event.id])}.
                </span>
                <span className="flex items-center justify-between gap-3 border-t border-neutral-100 px-3 py-2">
                  <span className="shrink-0 text-[12px] font-semibold text-brand-navy">
                    {formatFullDate(event.date)}
                  </span>
                  <span className="text-right text-[11px] text-brand-fog">
                    {timingLabel(event.date)}
                  </span>
                </span>
              </span>
          </div>
        )
      })}

      <EdgeMarker
        align="end"
        date={TERM_END}
        summary="Contract term ends. Renewal is manual."
        timing={timingLabel(TERM_END)}
      />
    </div>
  )
}

export default ContractLifecycleTimeline
