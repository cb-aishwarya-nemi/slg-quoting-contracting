export type EntitlementTone = 'positive' | 'warning' | 'neutral'
export type BillingMilestoneStatus = 'paid' | 'pending' | 'upcoming'

export interface TimelineConsumptionCard {
  id: string
  label: string
  used: number
  allocated: number
  unit?: string
  tone: EntitlementTone
}

export interface TimelineRunRatePoint {
  date: string
  cumulativePct: number
}

export interface TimelineEntitlement {
  id: string
  label: string
  barLabel: string
  usagePct?: number
  /** Display label for consumed amount, e.g. "2.3M". */
  usedLabel?: string
  /** Display label for cap, e.g. "5M". */
  allocatedLabel?: string
  tone: EntitlementTone
  statusLabel: string
  /** Cumulative usage points for the run-rate chart above the timeline. */
  runRatePoints?: TimelineRunRatePoint[]
}

export interface TimelineProductRow {
  id: string
  name: string
  subtitle?: string
  barLabel: string
  entitlementCount: number
  entitlements: TimelineEntitlement[]
  defaultExpanded?: boolean
}

export interface TimelineBillingMilestone {
  id: string
  date: string
  amountLabel: string
  status: BillingMilestoneStatus
}

export interface SalesOrderTimelinePeriod {
  id: string
  yearLabel: string
  periodLabel: string
  startDate: string
  endDate: string
  todayDate: string
  consumptionCards: TimelineConsumptionCard[]
  products: TimelineProductRow[]
  billingMilestones: TimelineBillingMilestone[]
}

export interface TimelineAxisMonth {
  label: string
  startPercent: number
}

export interface TimelineAxisDate {
  day: number
  percent: number
}

export interface TimelineAxisData {
  months: TimelineAxisMonth[]
  dates: TimelineAxisDate[]
}

const PIONEER_TIMELINE_PERIODS: SalesOrderTimelinePeriod[] = [
  {
    id: 'so-period-1',
    yearLabel: 'Year 1 · May 2026 → Apr 2027',
    periodLabel: 'Period 1 · current year',
    startDate: '2026-05-01',
    endDate: '2027-04-30',
    todayDate: '2026-07-09',
    consumptionCards: [
      { id: 'seats', label: 'Seats', used: 39, allocated: 50, tone: 'warning' },
      { id: 'sandboxes', label: 'Sandbox environments', used: 3, allocated: 3, tone: 'positive' },
    ],
    products: [
      {
        id: 'apex-growth',
        name: 'Apex platform',
        subtitle: 'growth services',
        barLabel: '50 seats · $2,400/seat',
        entitlementCount: 2,
        defaultExpanded: true,
        entitlements: [
          {
            id: 'api-calls',
            label: 'API calls / month',
            barLabel: '5M calls',
            usagePct: 46,
            usedLabel: '2.3M',
            allocatedLabel: '5M',
            tone: 'warning',
            statusLabel: '2.3M · 46%',
            runRatePoints: [
              { date: '2026-05-01', cumulativePct: 0 },
              { date: '2026-05-31', cumulativePct: 10 },
              { date: '2026-06-30', cumulativePct: 32 },
              { date: '2026-07-09', cumulativePct: 46 },
            ],
          },
          {
            id: 'image-creation',
            label: 'Image creation',
            barLabel: '2,500 / month',
            usagePct: 91,
            usedLabel: '2,273',
            allocatedLabel: '2,500',
            tone: 'warning',
            statusLabel: '2,273 / 2,500',
            runRatePoints: [
              { date: '2026-05-01', cumulativePct: 0 },
              { date: '2026-05-31', cumulativePct: 28 },
              { date: '2026-06-30', cumulativePct: 62 },
              { date: '2026-07-09', cumulativePct: 91 },
            ],
          },
        ],
      },
      {
        id: 'premium-sla',
        name: 'Premium support SLA',
        subtitle: '4-hr response · 24/7',
        barLabel: '$12,000/yr',
        entitlementCount: 2,
        defaultExpanded: false,
        entitlements: [
          {
            id: 'response-sla',
            label: 'Response SLA',
            barLabel: '4 hours',
            tone: 'positive',
            statusLabel: 'Met · 100%',
          },
          {
            id: 'coverage',
            label: 'Coverage',
            barLabel: '24/7',
            tone: 'positive',
            statusLabel: 'Active',
          },
        ],
      },
    ],
    billingMilestones: [
      { id: 'bill-1', date: '2026-05-01', amountLabel: '$41K', status: 'paid' },
      { id: 'bill-3', date: '2026-07-09', amountLabel: '$126K', status: 'pending' },
      { id: 'bill-4', date: '2026-09-01', amountLabel: '$41K', status: 'upcoming' },
      { id: 'bill-5', date: '2026-11-01', amountLabel: '$41K', status: 'upcoming' },
      { id: 'bill-6', date: '2027-01-01', amountLabel: '$41K', status: 'upcoming' },
    ],
  },
  {
    id: 'so-period-2',
    yearLabel: 'Year 2 · May 2027 → Apr 2028',
    periodLabel: 'Period 2',
    startDate: '2027-05-01',
    endDate: '2028-04-30',
    todayDate: '2026-07-09',
    consumptionCards: [
      { id: 'seats-y2', label: 'Seats', used: 0, allocated: 75, tone: 'neutral' },
      { id: 'sandboxes-y2', label: 'Sandbox environments', used: 0, allocated: 3, tone: 'neutral' },
    ],
    products: [
      {
        id: 'apex-growth-y2',
        name: 'Apex platform',
        subtitle: 'growth services · +7% ramp',
        barLabel: '75 seats · $2,568/seat',
        entitlementCount: 2,
        defaultExpanded: false,
        entitlements: [
          {
            id: 'api-calls-y2',
            label: 'API calls / month',
            barLabel: '5M calls',
            tone: 'neutral',
            statusLabel: 'Not started',
          },
          {
            id: 'image-creation-y2',
            label: 'Image creation',
            barLabel: '2,500 / month',
            tone: 'neutral',
            statusLabel: 'Not started',
          },
        ],
      },
      {
        id: 'premium-sla-y2',
        name: 'Premium support SLA',
        subtitle: '4-hr response · 24/7',
        barLabel: '$12,840/yr',
        entitlementCount: 2,
        defaultExpanded: false,
        entitlements: [
          {
            id: 'response-sla-y2',
            label: 'Response SLA',
            barLabel: '4 hours',
            tone: 'neutral',
            statusLabel: 'Scheduled',
          },
          {
            id: 'coverage-y2',
            label: 'Coverage',
            barLabel: '24/7',
            tone: 'neutral',
            statusLabel: 'Scheduled',
          },
        ],
      },
    ],
    billingMilestones: [
      { id: 'bill-y2-1', date: '2027-05-31', amountLabel: '$43K', status: 'upcoming' },
      { id: 'bill-y2-2', date: '2027-08-31', amountLabel: '$43K', status: 'upcoming' },
    ],
  },
]

export function getSalesOrderTimelinePeriods(orderId: string): SalesOrderTimelinePeriod[] | null {
  if (orderId === 'so-pioneer-0153') return PIONEER_TIMELINE_PERIODS
  return null
}

export function parseTimelineDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}

export function dateToTimelinePercent(dateStr: string, startDate: string, endDate: string): number {
  const start = parseTimelineDate(startDate).getTime()
  const end = parseTimelineDate(endDate).getTime()
  const value = parseTimelineDate(dateStr).getTime()
  if (end <= start) return 0
  return Math.max(0, Math.min(100, ((value - start) / (end - start)) * 100))
}

/** Timeline track ends at today when the period is in progress. */
export function getTimelineViewEnd(startDate: string, endDate: string, todayDate: string): string {
  const start = parseTimelineDate(startDate)
  const end = parseTimelineDate(endDate)
  const today = parseTimelineDate(todayDate)
  if (today < start) return startDate
  if (today > end) return endDate
  return todayDate
}

export function isTimelinePeriodStarted(startDate: string, todayDate: string): boolean {
  return parseTimelineDate(todayDate) >= parseTimelineDate(startDate)
}

export function isTimelinePeriodEnded(endDate: string, todayDate: string): boolean {
  return parseTimelineDate(todayDate) > parseTimelineDate(endDate)
}

export function buildTimelineAxis(startDate: string, endDate: string): TimelineAxisData {
  const start = parseTimelineDate(startDate)
  const end = parseTimelineDate(endDate)
  const rangeMs = end.getTime() - start.getTime()
  const toPercent = (date: Date) =>
    Math.max(0, Math.min(100, ((date.getTime() - start.getTime()) / rangeMs) * 100))

  const months: TimelineAxisMonth[] = []
  let monthCursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (monthCursor <= end) {
    const segmentStart = new Date(Math.max(monthCursor.getTime(), start.getTime()))
    const monthName = monthCursor.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    const label =
      months.length === 0 ? `${monthName} ${monthCursor.getFullYear()}` : monthName
    months.push({ label, startPercent: toPercent(segmentStart) })
    monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
  }

  const dates: TimelineAxisDate[] = []
  const dateCursor = new Date(start)
  while (dateCursor <= end) {
    dates.push({ day: dateCursor.getDate(), percent: toPercent(dateCursor) })
    dateCursor.setDate(dateCursor.getDate() + 14)
  }

  return { months, dates }
}

export function getUsageEndPercent(
  startDate: string,
  endDate: string,
  todayDate: string
): number {
  const today = parseTimelineDate(todayDate)
  const start = parseTimelineDate(startDate)
  const end = parseTimelineDate(endDate)
  if (today < start) return 0
  if (today > end) return 100
  return dateToTimelinePercent(todayDate, startDate, endDate)
}

/** Human-readable period progress, e.g. "Month 3 of 12". */
export function formatPeriodProgressLabel(
  startDate: string,
  endDate: string,
  todayDate: string
): string {
  const start = parseTimelineDate(startDate)
  const end = parseTimelineDate(endDate)
  const today = parseTimelineDate(todayDate)

  const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth()
  const totalMonths = monthIndex(end) - monthIndex(start) + 1
  const elapsedMonths = Math.min(
    totalMonths,
    Math.max(1, monthIndex(today) - monthIndex(start) + 1)
  )

  return `Month ${elapsedMonths} of ${totalMonths}`
}

export function getUsageBasedEntitlements(period: SalesOrderTimelinePeriod): TimelineEntitlement[] {
  return period.products.flatMap((product) =>
    product.entitlements.filter(
      (e) =>
        e.runRatePoints &&
        e.runRatePoints.length > 0 &&
        e.usedLabel &&
        e.allocatedLabel &&
        e.usagePct !== undefined
    )
  )
}
