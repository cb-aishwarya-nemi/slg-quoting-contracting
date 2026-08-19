import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { ACTIVE_FIELD_STYLE } from './fieldStyles'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

/** Parses terms-style dates like "May 1, 2026". */
export function parseDisplayDate(value: string): Date | null {
  const parsed = new Date(value)
  if (isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface DatePickerFieldProps {
  value: string
  onChange: (value: string) => void
  /** When true, open the field (e.g. from a parent row click). */
  active?: boolean
  onActiveChange?: (active: boolean) => void
  ariaLabel?: string
  className?: string
}

/**
 * Terms date control — calendar icon at rest, and on focus: type freely while
 * a month grid is available to pick a day.
 */
export function DatePickerField({
  value,
  onChange,
  active,
  onActiveChange,
  ariaLabel,
  className,
}: DatePickerFieldProps) {
  const isControlled = active !== undefined
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isOpen = isControlled ? !!active : uncontrolledOpen

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onActiveChange?.(next)
    },
    [isControlled, onActiveChange]
  )

  const [draft, setDraft] = useState(value)
  const selected = parseDisplayDate(draft) ?? parseDisplayDate(value) ?? new Date()
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  )
  const [pickerOpen, setPickerOpen] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) setDraft(value)
  }, [value, isOpen])

  useLayoutEffect(() => {
    if (!isOpen) {
      setPickerOpen(false)
      return
    }
    setDraft(value)
    const parsed = parseDisplayDate(value)
    if (parsed) setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
    setPickerOpen(true)
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpen, value])

  const commitDraft = useCallback(
    (raw: string) => {
      const parsed = parseDisplayDate(raw.trim())
      const next = parsed ? formatDisplayDate(parsed) : raw.trim() || value
      setDraft(next)
      if (next !== value) onChange(next)
      return next
    },
    [onChange, value]
  )

  const close = useCallback(
    (commit: boolean) => {
      if (commit) commitDraft(draft)
      else setDraft(value)
      setPickerOpen(false)
      setOpen(false)
    },
    [commitDraft, draft, setOpen, value]
  )

  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      if (
        target instanceof Element &&
        target.closest('[data-date-picker-menu="true"], [data-anchored-menu]')
      ) {
        return
      }
      close(true)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [close, isOpen])

  const todayKey = toDateKey(new Date())
  const selectedKey = toDateKey(selected)

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()
  const cells: Array<Date | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)
    ),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = viewMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const calendar = (
    <AnchoredMenu
      isOpen={isOpen && pickerOpen}
      onClose={() => setPickerOpen(false)}
      anchorRef={anchorRef}
      offset={6}
      className="w-[280px] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
    >
      <div
        role="dialog"
        aria-label="Choose date"
        data-date-picker-menu="true"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-1">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear() - 1, viewMonth.getMonth(), 1))
              }
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
              aria-label="Previous year"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
              }
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
          <span className="text-[13px] font-semibold tracking-[-0.25px] text-brand-navy">
            {monthLabel}
          </span>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
              }
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear() + 1, viewMonth.getMonth(), 1))
              }
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
              aria-label="Next year"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="flex h-7 items-center justify-center text-[10px] font-medium uppercase tracking-[-0.25px] text-brand-fog"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-8" />
            const key = toDateKey(date)
            const isSelected = key === selectedKey
            const isToday = key === todayKey
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const next = formatDisplayDate(date)
                  setDraft(next)
                  onChange(next)
                  setPickerOpen(false)
                  setOpen(false)
                }}
                className={cn(
                  'flex h-8 w-full cursor-pointer items-center justify-center rounded-md text-[12px] transition-colors',
                  isSelected
                    ? 'bg-brand-navy font-semibold text-white'
                    : isToday
                      ? 'font-semibold text-blue-700 hover:bg-blue-50'
                      : 'text-brand-navy hover:bg-neutral-100'
                )}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </AnchoredMenu>
  )

  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label={ariaLabel ?? `Edit date ${value}`}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className={cn(
          'inline-flex max-w-full cursor-pointer items-center gap-1.5 text-[14px] font-medium text-blue-700 transition-colors group-hover:text-white',
          className
        )}
      >
        <Calendar
          size={14}
          className="shrink-0 text-blue-700 transition-colors group-hover:text-white"
        />
        <span className="truncate">{value || 'Select date'}</span>
      </button>
    )
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative inline-flex min-w-0 max-w-full', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={anchorRef}
        className={cn(ACTIVE_FIELD_STYLE, 'flex w-auto max-w-full items-center gap-1.5 bg-neutral-200')}
      >
        <button
          type="button"
          aria-label="Open calendar"
          aria-expanded={pickerOpen}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setPickerOpen((open) => !open)}
          className="flex shrink-0 cursor-pointer items-center justify-center text-brand-mist transition-colors hover:text-brand-navy"
        >
          <Calendar size={14} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          aria-label={ariaLabel ?? 'Date'}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setPickerOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              close(true)
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              close(false)
            }
          }}
          className="min-w-[9rem] flex-1 bg-transparent text-[14px] font-medium text-brand-navy outline-none"
        />
      </div>
      {calendar}
    </div>
  )
}
