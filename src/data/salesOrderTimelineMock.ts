export type EntitlementTone = 'positive' | 'warning' | 'neutral'
export type BillingMilestoneStatus = 'paid' | 'pending' | 'upcoming'

export interface TimelineEntitlement {
  id: string
  label: string
  barLabel: string
  usagePct?: number
  tone: EntitlementTone
  statusLabel: string
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
    products: [
      {
        id: 'apex-growth',
        name: 'Apex platform',
        subtitle: 'growth services',
        barLabel: '50 seats · $2,400/seat',
        entitlementCount: 4,
        defaultExpanded: true,
        entitlements: [
          {
            id: 'seats',
            label: 'Seats',
            barLabel: '50 max',
            usagePct: 78,
            tone: 'warning',
            statusLabel: '39/50 · 78%',
          },
          {
            id: 'api-calls',
            label: 'API calls / month',
            barLabel: '5M calls',
            usagePct: 46,
            tone: 'positive',
            statusLabel: '2.3M · 46%',
          },
          {
            id: 'sandboxes',
            label: 'Sandbox environments',
            barLabel: '3 sandboxes',
            usagePct: 100,
            tone: 'positive',
            statusLabel: '3/3 · 100%',
          },
          {
            id: 'feature-tier',
            label: 'Feature tier',
            barLabel: 'Growth · all features',
            tone: 'positive',
            statusLabel: 'Active',
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
    products: [
      {
        id: 'apex-growth-y2',
        name: 'Apex platform',
        subtitle: 'growth services · +7% ramp',
        barLabel: '75 seats · $2,568/seat',
        entitlementCount: 3,
        defaultExpanded: false,
        entitlements: [
          {
            id: 'seats-y2',
            label: 'Seats',
            barLabel: '75 max',
            usagePct: 0,
            tone: 'neutral',
            statusLabel: 'Not started',
          },
          {
            id: 'api-calls-y2',
            label: 'API calls / month',
            barLabel: '5M calls',
            tone: 'neutral',
            statusLabel: 'Not started',
          },
          {
            id: 'feature-tier-y2',
            label: 'Feature tier',
            barLabel: 'Growth · all features',
            tone: 'neutral',
            statusLabel: 'Scheduled',
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
