import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronLeft, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type AllocationGroup } from '@/data/contractProcessingMock'

const FEATURE_W = 200
const FREQUENCY_W = 110
const ROLLOVER_W = 150
const EXPIRY_W = 150
const UNITS_W = 100
/** Item has no natural width of its own — this weight keeps it the widest track. */
const ITEM_W = 280

/**
 * Every track carries its resting width as both a floor and an `fr` weight, so
 * the extra room the section gains when notes collapse is shared across all
 * columns instead of landing entirely on Item.
 */
const COLS = [
  `minmax(${FEATURE_W}px, ${FEATURE_W}fr)`,
  `minmax(0, ${ITEM_W}fr)`,
  `minmax(${UNITS_W}px, ${UNITS_W}fr)`,
  `minmax(${FREQUENCY_W}px, ${FREQUENCY_W}fr)`,
  `minmax(${ROLLOVER_W}px, ${ROLLOVER_W}fr)`,
  `minmax(${EXPIRY_W}px, ${EXPIRY_W}fr)`,
].join(' ')

const TIME_LIMITED_ROLLOVER = 'Time-limited Rollover'
const EXPIRY_DURATION_UNITS = ['Day', 'Month', 'Year'] as const

const ROLLOVER_OPTIONS = [
  {
    label: 'No Rollover',
    description: 'Unused credits expire at the end of the grant period',
  },
  {
    label: 'Unlimited Rollover',
    description: 'Unused credits carry forward indefinitely',
  },
  {
    label: TIME_LIMITED_ROLLOVER,
    description: 'Unused credits carry forward but expire after a defined duration',
  },
  {
    label: 'Capped Rollover',
    description: 'Specific percentage of unused credits carry forward up to a specified limit',
  },
] as const

/** `"6 months"` → `{ count: '6', unit: 'Month' }`. Returns null for preset rollover choices. */
function parseExpiryDuration(value: string) {
  const match = /^(\d+)\s*(day|month|year)s?$/i.exec(value.trim())
  if (!match) return null
  const unit = match[2].toLowerCase()
  return { count: match[1], unit: unit.charAt(0).toUpperCase() + unit.slice(1) }
}

function formatExpiryDuration(count: string, unit: string) {
  const amount = Number.parseInt(count, 10)
  return `${amount} ${unit.toLowerCase()}${amount === 1 ? '' : 's'}`
}

function Separator() {
  return <div className="mx-3 h-5 w-px shrink-0 bg-neutral-200" />
}

function MiniDropdown({
  label,
  disabled,
}: {
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex w-full min-w-0 items-center justify-between gap-1 rounded px-1 py-1 text-[14px] transition-colors',
        disabled
          ? 'cursor-default text-brand-mist'
          : 'cursor-pointer text-brand-navy hover:bg-neutral-100'
      )}
    >
      <span className="truncate">{label}</span>
      {!disabled && <ChevronDown size={14} className="shrink-0 text-brand-mist" />}
    </button>
  )
}

const UNITS_FIELD_STYLE =
  'w-full rounded bg-neutral-100 px-2 py-1 text-right text-[14px] tabular-nums text-brand-navy outline-none focus:bg-neutral-200'

function formatUnits(input: string): string {
  const digits = input.replace(/[^\d]/g, '')
  if (!digits) return input.trim() || '0'
  return Number.parseInt(digits, 10).toLocaleString('en-US')
}

function UnitsField({
  value,
  onCommit,
}: {
  value: string
  onCommit: (value: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) setDraft(value)
  }, [value, isEditing])

  useEffect(() => {
    if (!isEditing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isEditing])

  const commit = () => {
    const next = formatUnits(draft)
    setDraft(next)
    setIsEditing(false)
    if (next !== value) onCommit(next)
  }

  const cancel = () => {
    setDraft(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        aria-label="Units"
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d,]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            cancel()
          }
        }}
        className={UNITS_FIELD_STYLE}
      />
    )
  }

  return (
    <button
      type="button"
      aria-label={`Edit units ${value}`}
      onClick={(e) => {
        e.stopPropagation()
        setDraft(value)
        setIsEditing(true)
      }}
      className="w-full cursor-pointer truncate text-right text-[14px] tabular-nums text-brand-navy transition-colors hover:bg-neutral-100 rounded px-1 py-1"
    >
      {value}
    </button>
  )
}

/** Unit picker inside the expiry-duration step — kept inline so it can't close the parent menu. */
function ExpiryDurationUnitSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (unit: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Duration unit"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[14px] font-medium text-brand-navy transition-colors hover:bg-neutral-100"
      >
        {value}
        <ChevronDown size={14} className="shrink-0 text-brand-mist" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[104px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {EXPIRY_DURATION_UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => {
                onChange(unit)
                setIsOpen(false)
              }}
              className={cn(
                'w-full cursor-pointer px-3 py-1.5 text-left text-[14px] transition-colors',
                unit === value
                  ? 'bg-neutral-100 font-medium text-brand-navy'
                  : 'text-brand-navy hover:bg-brand-navy hover:text-white'
              )}
            >
              {unit}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Second step after Time-limited Rollover — captures a duration like `6 months`. */
function ExpiryDurationPanel({
  initialCount,
  initialUnit,
  onBack,
  onCancel,
  onApply,
}: {
  initialCount?: string
  initialUnit?: string
  onBack: () => void
  onCancel: () => void
  onApply: (value: string) => void
}) {
  const [count, setCount] = useState(initialCount ?? '')
  const [unit, setUnit] = useState(initialUnit ?? 'Month')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const canApply = Number.parseInt(count, 10) > 0
  const apply = () => {
    if (!canApply) return
    onApply(formatExpiryDuration(count, unit))
  }

  return (
    <div className="w-[280px] p-3">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to rollover options"
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-brand-mist transition-colors hover:bg-neutral-100 hover:text-brand-navy"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Set expiry duration
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-neutral-200 py-1 pl-2.5 pr-1 transition-colors focus-within:border-brand-navy">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={count}
          placeholder="0"
          onChange={(e) => setCount(e.target.value.replace(/[^\d]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply()
          }}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-brand-navy outline-none placeholder:text-brand-mist"
        />
        <ExpiryDurationUnitSelect value={unit} onChange={setUnit} />
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-md border border-neutral-200 px-3 py-1.5 text-[13px] font-medium text-brand-navy transition-colors hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={!canApply}
          className={cn(
            'rounded-md px-3 py-1.5 text-[13px] font-semibold text-white transition-colors',
            canApply
              ? 'cursor-pointer bg-brand-navy hover:bg-brand-soft'
              : 'cursor-not-allowed bg-neutral-300'
          )}
        >
          Apply
        </button>
      </div>
    </div>
  )
}

function RolloverDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDurationPanel, setShowDurationPanel] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top?: string; bottom?: string }>({ top: '100%' })
  const currentDuration = parseExpiryDuration(value)

  useEffect(() => {
    if (!isOpen) setShowDurationPanel(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !rootRef.current) return
    const timer = setTimeout(() => {
      const rect = rootRef.current!.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 280) {
        setPosition({ bottom: '100%', top: 'auto' })
      } else {
        setPosition({ top: '100%', bottom: 'auto' })
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [isOpen, showDurationPanel])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div
      ref={rootRef}
      className="relative min-w-0 w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Rollover"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'flex w-full min-w-0 cursor-pointer items-center justify-between gap-1 rounded px-1 py-1 text-[14px] text-brand-navy transition-colors hover:bg-neutral-100',
          isOpen && 'bg-neutral-100'
        )}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={14} className="shrink-0 text-brand-mist" />
      </button>
      {isOpen ? (
        <div
          className={cn(
            'absolute left-0 z-50 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg',
            showDurationPanel ? '' : 'w-[320px] py-1'
          )}
          style={{
            top: position.top,
            bottom: position.bottom,
            marginTop: position.top === '100%' ? 4 : 0,
            marginBottom: position.bottom === '100%' ? 4 : 0,
          }}
        >
          {showDurationPanel ? (
            <ExpiryDurationPanel
              initialCount={currentDuration?.count}
              initialUnit={currentDuration?.unit}
              onBack={() => setShowDurationPanel(false)}
              onCancel={() => setIsOpen(false)}
              onApply={(duration) => {
                onChange(duration)
                setIsOpen(false)
              }}
            />
          ) : (
            ROLLOVER_OPTIONS.map((option) => {
              const isSelected =
                option.label === value ||
                (option.label === TIME_LIMITED_ROLLOVER && currentDuration !== null)

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    if (option.label === TIME_LIMITED_ROLLOVER) {
                      setShowDurationPanel(true)
                      return
                    }
                    onChange(option.label)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2.5 text-left transition-colors',
                    isSelected ? 'bg-blue-50' : 'hover:bg-blue-50'
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-[14px] font-medium text-brand-navy">{option.label}</span>
                    {option.label === TIME_LIMITED_ROLLOVER && currentDuration && (
                      <span className="shrink-0 text-[12px] text-brand-mist">
                        {formatExpiryDuration(currentDuration.count, currentDuration.unit)}
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] leading-snug text-brand-fog">{option.description}</span>
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}

interface AllocationTableProps {
  items: AllocationGroup[]
}

export function AllocationTable({ items: initialItems }: AllocationTableProps) {
  const [items, setItems] = useState(initialItems)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const updateRollover = (groupId: string, sourceId: string, next: string) => {
    setItems((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              sources: group.sources.map((source) =>
                source.id === sourceId ? { ...source, rollover: next } : source
              ),
            }
      )
    )
  }

  const updateUnits = (groupId: string, sourceId: string, next: string) => {
    setItems((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              sources: group.sources.map((source) =>
                source.id === sourceId ? { ...source, units: next } : source
              ),
            }
      )
    )
  }

  return (
    <div className="w-full">
      {/* Column headers */}
      <div
        className="grid items-center border-b border-neutral-200 px-4 pb-2"
        style={{ gridTemplateColumns: COLS }}
      >
        <div className="pr-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Entitlement/Credit
        </div>
        <div className="pl-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Item
        </div>
        <div className="flex items-center justify-end text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          <span className="mx-3 w-px shrink-0" aria-hidden />
          <span className="flex-1">Units</span>
        </div>
        <div className="flex items-center text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          <span className="mx-3 w-px shrink-0" aria-hidden />
          Frequency
        </div>
        <div className="flex items-center text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          <span className="mx-3 w-px shrink-0" aria-hidden />
          Rollover
        </div>
        <div className="flex items-center text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          <span className="mx-3 w-px shrink-0" aria-hidden />
          Expiry
        </div>
      </div>

      {items.map((group) => {
        const isUsage = group.kind === 'usage'
        const sourceCount = Math.max(group.sources.length, 1)

        return (
          <div
            key={group.id}
            className="border-b border-neutral-200"
          >
            <div
              className="grid items-stretch px-4"
              style={{ gridTemplateColumns: COLS }}
            >
              {/* Feature — vertically centered across item rows */}
              <div
                className="flex items-center gap-1.5 self-stretch pr-3"
                style={{ gridRow: `1 / span ${sourceCount}` }}
              >
                <span className="text-[14px] font-medium text-brand-navy">
                  {group.feature}
                </span>
                {isUsage && (
                  <Gauge
                    size={13}
                    strokeWidth={2}
                    className="shrink-0 text-brand-fog"
                    aria-label="Metered feature"
                  />
                )}
              </div>

              {group.sources.map((source, index) => {
                const rollover = isUsage ? (source.rollover ?? 'No Rollover') : '–'
                const expiry = isUsage ? (source.expiry ?? '–') : '–'
                // Skip partial rule on the last item — the group’s full-width border is enough.
                const showItemRule = index < group.sources.length - 1

                return (
                  <div key={source.id} className="contents">
                    <div
                      className={cn(
                        'flex min-w-0 items-center py-1.5 pl-3',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-[14px] text-brand-navy">
                        {source.name}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center justify-end py-1.5 text-[14px] tabular-nums text-brand-navy',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      <div className="min-w-0 flex-1">
                        <UnitsField
                          value={source.units}
                          onCommit={(next) => updateUnits(group.id, source.id, next)}
                        />
                      </div>
                    </div>
                    <div
                      className={cn(
                        'flex items-center py-1.5',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      <MiniDropdown label={source.frequency} />
                    </div>
                    <div
                      className={cn(
                        'flex items-center py-1.5',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      {isUsage ? (
                        <RolloverDropdown
                          value={rollover}
                          onChange={(next) => updateRollover(group.id, source.id, next)}
                        />
                      ) : (
                        <MiniDropdown label="–" disabled />
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex items-center py-1.5',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      {isUsage ? (
                        <MiniDropdown label={expiry} />
                      ) : (
                        <MiniDropdown label="–" disabled />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
