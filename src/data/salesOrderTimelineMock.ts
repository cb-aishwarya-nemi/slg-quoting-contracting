/** Shared date helpers for sales-order contract timelines. */

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
