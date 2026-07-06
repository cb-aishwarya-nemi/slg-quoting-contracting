import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)

  // More than 2 weeks - show actual date
  if (diffWeeks > 2) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  // Less than a minute
  if (diffSeconds < 60) {
    return 'Just now'
  }

  // Less than an hour
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`
  }

  // Less than a day
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  }

  // Less than 2 weeks
  if (diffDays === 1) {
    return 'Yesterday'
  }
  
  if (diffDays < 7) {
    return `${diffDays} days ago`
  }

  return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`
}

/**
 * Future/past-aware relative text based on whole-day difference from now.
 * e.g. "today", "in 5 days", "3 days ago", "in 2 months", "1 year ago".
 */
export function formatRelativeToNow(date: Date): string {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'

  const abs = Math.abs(diffDays)
  const future = diffDays > 0

  const unit = (value: number, singular: string) => {
    const label = value === 1 ? singular : `${singular}s`
    return future ? `in ${value} ${label}` : `${value} ${label} ago`
  }

  if (abs < 7) return unit(abs, 'day')
  if (abs < 30) return unit(Math.round(abs / 7), 'week')
  if (abs < 365) return unit(Math.round(abs / 30), 'month')
  return unit(Math.round(abs / 365), 'year')
}

/**
 * Urgency label for a task/contract start date, e.g. "Starts today",
 * "Starts in 5 days", "Started 3 days ago".
 */
export function formatStartUrgency(date: Date): string {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Starts today'
  if (diffDays > 0) {
    const rel = formatRelativeToNow(date)
    return `Starts ${rel}`
  }
  const rel = formatRelativeToNow(date)
  return `Started ${rel}`
}

/**
 * Parse a human-readable date string (e.g. "May 1, 2026") and append a
 * relative annotation in brackets, e.g. "May 1, 2026 (in 5 days)".
 * Returns the original string if it cannot be parsed.
 */
export function withRelativeAnnotation(dateStr: string): string {
  if (!dateStr) return dateStr
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return dateStr
  return `${dateStr} (${formatRelativeToNow(parsed)})`
}
