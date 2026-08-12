import { useState, useRef, useEffect, useCallback, type MouseEvent } from 'react'
import { PackagePlus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreVertical, CirclePlus, Search, X, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { cn, formatRelativeToNow, withRelativeAnnotation } from '@/lib/utils'
import { type ProductLineItem, type RampPeriod, lineItemCatalog, type CatalogLineItem } from '@/data/contractProcessingMock'
import {
  useOptionalFieldEditHistory,
} from '@/context/FieldEditHistoryContext'

const PRODUCTS_SECTION_ID = 'products'
const PRODUCTS_SECTION_LABEL = 'Products and pricing'

function productFieldLabel(itemId: string, field: string) {
  return `${itemId} · ${field}`
}

function recordProductEdit(
  editHistory: ReturnType<typeof useOptionalFieldEditHistory>,
  itemId: string,
  field: string,
  previousValue: string,
  newValue: string
) {
  if (!editHistory || previousValue === newValue) return

  editHistory.recordEdit(
    PRODUCTS_SECTION_ID,
    { sectionLabel: PRODUCTS_SECTION_LABEL, fieldLabel: productFieldLabel(itemId, field) },
    previousValue,
    newValue
  )
}

function Separator({
  isRowActive,
  alignTop,
}: {
  isRowActive?: boolean
  alignTop?: boolean
}) {
  return <div className={cn(
    "mx-3 w-px shrink-0 transition-colors",
    alignTop ? "mt-1 h-4 self-start" : "h-5",
    isRowActive ? "bg-white/20" : "bg-neutral-200"
  )} />
}

function GhostSeparator() {
  return <div className="mx-3 h-5 w-px shrink-0" />
}

function MiniDropdown({
  label,
  width,
  isRowActive,
  alignTop,
}: {
  label: string
  width: number
  isRowActive?: boolean
  alignTop?: boolean
}) {
  return (
    <button
      type="button"
      style={{ width }}
      className={cn(
        "flex shrink-0 items-center justify-between gap-1 rounded px-1 py-1 text-[14px] transition-colors",
        alignTop && "self-start",
        isRowActive
          ? "text-white hover:bg-white/10"
          : "text-brand-navy hover:bg-neutral-100"
      )}
    >
      <span>{label}</span>
      <ChevronDown size={14} className={cn(
        "transition-colors",
        isRowActive ? "text-white/70" : "text-brand-mist"
      )} />
    </button>
  )
}

const BILLING_PERIODS = ['Monthly', 'Quarterly', 'Yearly', 'One-time']

interface LineItemPopoverProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: CatalogLineItem) => void
  anchorRef: React.RefObject<HTMLButtonElement | HTMLDivElement | null>
  currentName: string
}

function LineItemPopover({ isOpen, onClose, onSelect, anchorRef, currentName }: LineItemPopoverProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [position, setPosition] = useState<{ top?: string; bottom?: string }>({ top: '100%' })

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Recalculate position on open and on window events
  useEffect(() => {
    if (!isOpen || !popoverRef.current || !anchorRef.current) return

    // Use a timeout to ensure DOM has rendered
    const timer = setTimeout(() => {
      const anchorRect = anchorRef.current!.getBoundingClientRect()
      
      // Default: below
      const DEFAULT_POSITION = { top: '100%', bottom: 'auto' }
      
      // Calculate space
      const spaceBelow = window.innerHeight - anchorRect.bottom
      const spaceAbove = anchorRect.top
      
      // If not enough space below (< 300px for typical popover + margin)
      // AND there's enough space above, position above
      if (spaceBelow < 320 && spaceAbove > 320) {
        setPosition({ bottom: '100%', top: 'auto' })
      } else {
        setPosition(DEFAULT_POSITION)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [isOpen, anchorRef])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, anchorRef])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredItems = lineItemCatalog.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.family.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-[400px] rounded-lg border border-neutral-200 bg-white shadow-lg"
      style={{
        left: '0',
        marginTop: typeof position.top !== 'undefined' && position.top === '100%' ? '4px' : '0',
        marginBottom: typeof position.bottom !== 'undefined' && position.bottom === '100%' ? '4px' : '0',
        top: position.top as any,
        bottom: position.bottom as any,
      }}
    >
      {/* Search bar */}
      <div className="border-b border-neutral-200 p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-mist" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search line items..."
            className="w-full rounded-lg bg-neutral-100 py-2 pl-9 pr-8 text-[13px] text-brand-navy outline-none placeholder:text-brand-mist focus:bg-neutral-50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-brand-mist hover:bg-neutral-200 hover:text-brand-navy"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-h-[280px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-4 text-center text-[13px] text-brand-fog">
            No items found
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item)
              }}
              className={cn(
                'group/opt flex w-full cursor-pointer flex-col gap-0.5 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0',
                item.name === currentName ? 'bg-neutral-100' : 'hover:bg-brand-navy'
              )}
            >
              <span className="text-[14px] font-medium text-brand-navy group-hover/opt:text-white">
                {item.name}
              </span>
              <span className="text-[12px] text-brand-fog group-hover/opt:text-white/70">
                {item.family} · {item.unitPrice}/unit
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

interface MiniDropdownPopoverProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (value: string) => void
  options: string[]
  currentValue: string
}

function MiniDropdownPopover({ isOpen, onClose, onSelect, options, currentValue }: MiniDropdownPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top?: string; bottom?: string }>({ top: '100%' })

  useEffect(() => {
    if (!isOpen || !popoverRef.current) return

    const timer = setTimeout(() => {
      const spaceBelow = window.innerHeight - popoverRef.current!.getBoundingClientRect().top
      
      if (spaceBelow < 200) {
        setPosition({ bottom: '100%', top: 'auto' })
      } else {
        setPosition({ top: '100%', bottom: 'auto' })
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 z-50 min-w-[120px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
      style={{
        top: position.top as any,
        bottom: position.bottom as any,
        marginTop: position.top === '100%' ? '4px' : '0',
        marginBottom: position.bottom === '100%' ? '4px' : '0',
      }}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={cn(
                    'w-full cursor-pointer px-3 py-1.5 text-left text-[14px] transition-colors',
                    option === currentValue
                      ? 'bg-neutral-100 font-medium text-brand-navy'
                      : 'text-brand-navy hover:bg-brand-navy hover:text-white'
                  )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

interface ItemNameButtonProps {
  name: string
  isAttention: boolean
  onSelect: (item: CatalogLineItem) => void
  onOpenChange?: (isOpen: boolean) => void
  isRowActive?: boolean
  isEdited?: boolean
  isViewEditsFocused?: boolean
  onViewEdits?: () => void
}

function ItemNameButton({
  name,
  isAttention,
  onSelect,
  onOpenChange,
  isRowActive,
  isEdited,
  isViewEditsFocused,
  onViewEdits,
}: ItemNameButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  return (
    <div className="relative flex min-w-0 flex-1 items-center gap-1.5 group/item">
      {/* Icon with negative margin — sits outside the table column for alignment */}
      {isAttention && (
        <div className="relative -ml-6 mr-2 shrink-0">
          <PackagePlus size={16} className="shrink-0 ai-gradient-text" />
          {!isOpen && (
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/item:opacity-100 ai-gradient">
              Created this item based on your contract
            </span>
          )}
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => handleOpenChange(!isOpen)}
        className={cn(
          'flex min-w-0 cursor-pointer items-center gap-1.5 text-left text-[14px] font-medium transition-colors',
          isOpen
            ? 'text-white'
            : (isAttention ? 'ai-gradient-text' : 'text-brand-navy')
        )}
      >
        <span className="truncate">{name}</span>
        <ChevronDown size={14} className={cn(
          "shrink-0 transition-colors",
          isOpen ? "text-white/70" : "text-brand-mist"
        )} />
      </button>
      {isEdited && !isOpen && !isRowActive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onViewEdits?.()
          }}
          className={cn(
            'inline-flex shrink-0 cursor-pointer items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-[-0.01em] transition-colors',
            isViewEditsFocused
              ? 'bg-amber-100/70 text-amber-800/80'
              : 'bg-amber-50 text-amber-700/70'
          )}
        >
          Edited
        </button>
      )}
      <LineItemPopover
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        onSelect={(item) => {
          onSelect(item)
          handleOpenChange(false)
        }}
        anchorRef={buttonRef}
        currentName={name}
      />
    </div>
  )
}

const PERIOD_W = 96
const QTY_W = 60
const UNIT_W = 110
const TOTAL_W = 124
const MENU_W = 28

type NewRowStep = 'idle' | 'item' | 'frequency' | 'quantity' | 'done'

interface NewLineItemRowProps {
  onComplete: (item: {
    name: string
    unitPrice: string
    billingPeriod: string
    quantity: string
  }) => void
  onCancel: () => void
}

function NewLineItemRow({ onComplete, onCancel }: NewLineItemRowProps) {
  const [step, setStep] = useState<NewRowStep>('idle')
  const [selectedItem, setSelectedItem] = useState<CatalogLineItem | null>(null)
  const [billingPeriod, setBillingPeriod] = useState('')
  const [quantity, setQuantity] = useState('')
  
  const itemAnchorRef = useRef<HTMLDivElement>(null)
  const frequencyAnchorRef = useRef<HTMLDivElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)

  const handleItemSelect = useCallback((item: CatalogLineItem) => {
    setSelectedItem(item)
    setStep('frequency')
  }, [])

  const handleFrequencySelect = useCallback((value: string) => {
    setBillingPeriod(value)
    setStep('quantity')
  }, [])

  useEffect(() => {
    if (step === 'quantity' && quantityInputRef.current) {
      quantityInputRef.current.focus()
    }
  }, [step])

  const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quantity && selectedItem) {
      onComplete({
        name: selectedItem.name,
        unitPrice: selectedItem.unitPrice,
        billingPeriod,
        quantity,
      })
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleQuantityBlur = () => {
    if (quantity && selectedItem) {
      onComplete({
        name: selectedItem.name,
        unitPrice: selectedItem.unitPrice,
        billingPeriod,
        quantity,
      })
    }
  }

  const calculateTotal = () => {
    if (!selectedItem || !quantity) return '$0.00'
    const unitPrice = parseFloat(selectedItem.unitPrice.replace(/[$,]/g, ''))
    const qty = parseInt(quantity, 10) || 0
    return (unitPrice * qty).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  return (
    <div className="flex items-center border-b border-neutral-100 bg-blue-50/50 py-1.5 pr-2">
      {/* Item */}
      <div ref={itemAnchorRef} className="relative flex min-w-0 flex-1 items-center">
        <button
          type="button"
          onClick={() => setStep('item')}
          className={cn(
            'flex min-w-0 cursor-pointer items-center gap-1.5 text-left text-[14px] transition-colors',
            selectedItem ? 'text-brand-navy' : 'text-brand-mist'
          )}
        >
          <span className="truncate font-medium">
            {selectedItem?.name || 'Select item...'}
          </span>
          <ChevronDown size={14} className="shrink-0 text-brand-mist" />
        </button>
        <LineItemPopover
          isOpen={step === 'item'}
          onClose={() => setStep('idle')}
          onSelect={handleItemSelect}
          anchorRef={itemAnchorRef}
          currentName={selectedItem?.name || ''}
        />
      </div>

      <Separator />

      {/* Frequency */}
      <div ref={frequencyAnchorRef} className="relative shrink-0" style={{ width: PERIOD_W }}>
        <button
          type="button"
          onClick={() => selectedItem && setStep('frequency')}
          className={cn(
            'flex w-full items-center justify-between gap-1 rounded px-1 py-1 text-[14px] transition-colors',
            billingPeriod ? 'text-brand-navy hover:bg-neutral-100' : 'text-brand-mist',
            !selectedItem && 'cursor-not-allowed opacity-50'
          )}
          disabled={!selectedItem}
        >
          <span>{billingPeriod || 'Frequency'}</span>
          <ChevronDown size={14} className="text-brand-mist" />
        </button>
        <MiniDropdownPopover
          isOpen={step === 'frequency'}
          onClose={() => setStep('idle')}
          onSelect={handleFrequencySelect}
          options={BILLING_PERIODS}
          currentValue={billingPeriod}
        />
      </div>

      <Separator />

      {/* Quantity */}
      <div className="shrink-0" style={{ width: QTY_W }}>
        {step === 'quantity' ? (
          <input
            ref={quantityInputRef}
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleQuantityKeyDown}
            onBlur={handleQuantityBlur}
            placeholder="Qty"
            className="w-full rounded bg-neutral-100 px-2 py-1 text-center text-[14px] text-brand-navy outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => billingPeriod && setStep('quantity')}
            className={cn(
              'flex w-full items-center justify-between gap-1 rounded px-1 py-1 text-[14px] transition-colors',
              quantity ? 'text-brand-navy hover:bg-neutral-100' : 'text-brand-mist',
              !billingPeriod && 'cursor-not-allowed opacity-50'
            )}
            disabled={!billingPeriod}
          >
            <span>{quantity || 'Qty'}</span>
            <ChevronDown size={14} className="text-brand-mist" />
          </button>
        )}
      </div>

      <Separator />

      <div style={{ width: UNIT_W }} className="shrink-0 text-right text-[14px] font-medium text-brand-mist">
        {selectedItem?.unitPrice || '—'}
      </div>
      <div style={{ width: TOTAL_W }} className="shrink-0 text-right text-[14px] font-medium text-brand-mist">
        {selectedItem && quantity ? calculateTotal() : '—'}
      </div>

      <div style={{ width: MENU_W }} className="flex shrink-0 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-brand-navy"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

interface PeriodHeaderProps {
  period: RampPeriod
  isExpanded: boolean
  onToggle: () => void
}

/** Blue collapse chevron that hangs to the left of the period label. */
function PeriodChevron({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className="-ml-6 mr-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-blue-700 transition-colors hover:bg-blue-50"
      title={isExpanded ? 'Collapse period' : 'Expand period'}
    >
      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  )
}

function parsePeriodDate(dateStr: string): Date | null {
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function formatPeriodDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Sort chronologically by start (then end) and relabel Period 1…N. */
function renumberPeriodsByDate(periods: RampPeriod[]): RampPeriod[] {
  return sortPeriodsByDate(periods).map((period, index) => ({
    ...period,
    label: `Period ${index + 1}`,
  }))
}

function sortPeriodsByDate(periods: RampPeriod[]): RampPeriod[] {
  return [...periods].sort((a, b) => {
    const aStart = parsePeriodDate(a.startDate)?.getTime() ?? Number.POSITIVE_INFINITY
    const bStart = parsePeriodDate(b.startDate)?.getTime() ?? Number.POSITIVE_INFINITY
    if (aStart !== bStart) return aStart - bStart
    const aEnd = parsePeriodDate(a.endDate)?.getTime() ?? Number.POSITIVE_INFINITY
    const bEnd = parsePeriodDate(b.endDate)?.getTime() ?? Number.POSITIVE_INFINITY
    return aEnd - bEnd
  })
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

/** In-app calendar popover aligned with Apex dropdown styling. */
function PeriodDateEdit({
  value,
  showRelative = false,
  onChange,
}: {
  value: string
  showRelative?: boolean
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = parsePeriodDate(value) ?? new Date()
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  )
  const rootRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const parsed = parsePeriodDate(value)
    if (parsed) setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

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

  const relativeLabel = (() => {
    if (!showRelative) return null
    const parsed = new Date(value)
    if (isNaN(parsed.getTime())) return null
    return formatRelativeToNow(parsed)
  })()

  return (
    <span ref={rootRef} className="relative inline-flex items-center gap-1">
      <button
        type="button"
        onClick={(e: MouseEvent) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className={cn(
          'cursor-text whitespace-nowrap rounded px-0.5 text-[12px] text-blue-700 transition-colors hover:bg-neutral-100',
          open && 'bg-neutral-100'
        )}
        aria-label={`Edit date ${value}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {value}
      </button>
      {relativeLabel ? (
        <span className="whitespace-nowrap text-[12px] text-brand-fog">
          ({relativeLabel})
        </span>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-label="Choose date"
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full z-40 mt-1.5 w-[280px] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between gap-1">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear() - 1, viewMonth.getMonth(), 1)
                  )
                }
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
                aria-label="Previous year"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
                  )
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
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                  )
                }
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear() + 1, viewMonth.getMonth(), 1)
                  )
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
              if (!date) {
                return <div key={`empty-${idx}`} className="h-8" />
              }
              const key = toDateKey(date)
              const isSelected = key === selectedKey
              const isToday = key === todayKey
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange(formatPeriodDate(date))
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
      ) : null}
    </span>
  )
}

/** Period identity: label + editable date range. */
function PeriodIdentity({
  period,
  onChangeDates,
}: {
  period: RampPeriod
  onChangeDates?: (dates: { startDate: string; endDate: string }) => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[13px] font-semibold text-brand-navy">{period.label}</span>
      <span className="text-[13px] text-brand-fog">·</span>
      <div className="flex items-center gap-1.5 text-[12px] text-brand-fog">
        <Calendar size={14} className="shrink-0 text-brand-mist" />
        <PeriodDateEdit
          value={period.startDate}
          showRelative
          onChange={(startDate) =>
            onChangeDates?.({ startDate, endDate: period.endDate })
          }
        />
        <span>to</span>
        <PeriodDateEdit
          value={period.endDate}
          onChange={(endDate) =>
            onChangeDates?.({ startDate: period.startDate, endDate })
          }
        />
      </div>
    </div>
  )
}

/** Collapsed period row — clicking anywhere expands. */
function PeriodHeader({
  period,
  isExpanded,
  onToggle,
  onChangeDates,
}: PeriodHeaderProps & {
  onChangeDates?: (dates: { startDate: string; endDate: string }) => void
}) {
  return (
    <div
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center py-3 pl-1 pr-2 transition-colors hover:bg-neutral-50"
    >
      <PeriodChevron isExpanded={isExpanded} onToggle={onToggle} />
      <PeriodIdentity period={period} onChangeDates={onChangeDates} />
    </div>
  )
}

function PeriodOptionsMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex w-full justify-end">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-navy"
        aria-label="Period options"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical size={15} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[160px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onDelete()
            }}
            className="flex w-full cursor-pointer px-3 py-2 text-left text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Delete period
          </button>
        </div>
      ) : null}
    </div>
  )
}

function periodDateRangeLabel(period: RampPeriod): string {
  return `${withRelativeAnnotation(period.startDate)} to ${period.endDate}`
}

/** Gmail-style undo strip shown in place of a just-deleted period. */
function PeriodDeletedUndoBanner({
  period,
  onUndo,
}: {
  period: RampPeriod
  onUndo: () => void
}) {
  return (
    <div
      className="border-b border-neutral-100 pb-2 pl-1 pr-2"
      role="status"
    >
      <div className="-ml-6 flex items-center justify-between gap-4 py-2">
        <p className="min-w-0 text-[13px] leading-[1.4] text-brand-navy">
          <span className="font-semibold">{period.label}</span>
          <span className="text-brand-fog">
            {' '}
            · {periodDateRangeLabel(period)}
          </span>
          <span> deleted</span>
        </p>
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 cursor-pointer text-[13px] font-semibold text-blue-700 transition-colors hover:text-blue-800"
        >
          Undo
        </button>
      </div>
    </div>
  )
}

function RampPriceChangeBadge({ change }: { change: number }) {
  const isIncrease = change >= 0
  const Icon = isIncrease ? TrendingUp : TrendingDown

  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-green-700">
      <Icon size={12} strokeWidth={2} className="shrink-0 text-green-700" />
      {Math.abs(change)}%
    </span>
  )
}

interface ProductsPricingTableProps {
  items: ProductLineItem[]
  periods?: RampPeriod[]
}

export function ProductsPricingTable({ items: initialItems, periods: initialPeriods }: ProductsPricingTableProps) {
  const editHistory = useOptionalFieldEditHistory()
  const [items, setItems] = useState(initialItems)
  const [periods, setPeriods] = useState(initialPeriods)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(() => {
    if (initialPeriods) {
      return new Set(initialPeriods.map(p => p.id))
    }
    return new Set()
  })
  const [addingToPeriodId, setAddingToPeriodId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    period: RampPeriod
    index: number
  } | null>(null)
  const pendingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current)
    }
  }, [])

  const clearPendingDeleteBanner = useCallback(() => {
    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current)
      pendingDeleteTimerRef.current = null
    }
    setPendingDelete(null)
  }, [])

  const handleDeletePeriod = useCallback(
    (period: RampPeriod, index: number) => {
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current)
        pendingDeleteTimerRef.current = null
      }

      const remaining = (periods ?? []).filter((p) => p.id !== period.id)
      const promoted = sortPeriodsByDate(remaining)[0]

      setPeriods(() => renumberPeriodsByDate(remaining))
      setExpandedPeriods((prev) => {
        const next = new Set(prev)
        next.delete(period.id)
        return next
      })
      if (addingToPeriodId === period.id) setAddingToPeriodId(null)

      setPendingDelete({ period, index })
      pendingDeleteTimerRef.current = setTimeout(() => {
        setPendingDelete(null)
        pendingDeleteTimerRef.current = null
      }, 8000)

      const dateRange = `${period.startDate} to ${period.endDate}`
      const deleteValue = promoted
        ? `Deleted|${promoted.label} (${promoted.startDate} to ${promoted.endDate}) is now Period 1`
        : 'Deleted'
      recordProductEdit(
        editHistory,
        period.id,
        period.label,
        dateRange,
        deleteValue
      )
    },
    [addingToPeriodId, editHistory, periods]
  )

  const handleUndoDeletePeriod = useCallback(() => {
    if (!pendingDelete) return
    const { period } = pendingDelete
    clearPendingDeleteBanner()
    setPeriods((prev) => renumberPeriodsByDate([...(prev ?? []), period]))
    setExpandedPeriods((prev) => {
      const next = new Set(prev)
      next.add(period.id)
      return next
    })
  }, [pendingDelete, clearPendingDeleteBanner])

  const togglePeriod = (periodId: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev)
      if (next.has(periodId)) {
        next.delete(periodId)
      } else {
        next.add(periodId)
      }
      return next
    })
  }

  const handleAddComplete = (newItem: {
    name: string
    unitPrice: string
    billingPeriod: string
    quantity: string
  }, periodId?: string) => {
    const unitPrice = parseFloat(newItem.unitPrice.replace(/[$,]/g, ''))
    const qty = parseInt(newItem.quantity, 10) || 0
    const totalPrice = (unitPrice * qty).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

    const newLineItem: ProductLineItem = {
      id: `li-new-${Date.now()}`,
      name: newItem.name,
      status: 'ready',
      billingPeriod: newItem.billingPeriod,
      quantity: newItem.quantity.padStart(2, '0'),
      unitPrice: newItem.unitPrice,
      totalPrice,
    }

    recordProductEdit(editHistory, newLineItem.id, 'Item', '', newItem.name)

    if (periodId && periods) {
      setPeriods(prev => prev?.map(p => 
        p.id === periodId 
          ? { ...p, items: [...p.items, newLineItem] }
          : p
      ))
      setAddingToPeriodId(null)
    } else {
      setItems((prev) => [...prev, newLineItem])
      setIsAddingNew(false)
    }
  }

  const updatePeriodDates = (
    periodId: string,
    dates: { startDate: string; endDate: string }
  ) => {
    const period = periods?.find((p) => p.id === periodId)
    if (!period) return
    if (period.startDate === dates.startDate && period.endDate === dates.endDate) return

    if (period.startDate !== dates.startDate) {
      recordProductEdit(
        editHistory,
        periodId,
        `${period.label} Start date`,
        period.startDate,
        dates.startDate
      )
    }
    if (period.endDate !== dates.endDate) {
      recordProductEdit(
        editHistory,
        periodId,
        `${period.label} End date`,
        period.endDate,
        dates.endDate
      )
    }

    const previousById = new Map((periods ?? []).map((p) => [p.id, p]))
    const nextPeriods = renumberPeriodsByDate(
      (periods ?? []).map((p) => (p.id === periodId ? { ...p, ...dates } : p))
    )
    const renumberNotes = nextPeriods
      .filter((p) => {
        const previous = previousById.get(p.id)
        return previous != null && previous.label !== p.label
      })
      .map((p) => {
        const previous = previousById.get(p.id)!
        return `${previous.label} (${p.startDate} to ${p.endDate}) is now ${p.label}`
      })

    setPeriods(nextPeriods)

    if (renumberNotes.length > 0) {
      recordProductEdit(
        editHistory,
        'periods',
        'Period order',
        '',
        `Renumbered|${renumberNotes.join('. ')}`
      )
    }
  }

  const renderTableHeader = () => (
    <div className="flex items-center border-b border-neutral-200 pb-2 pl-1 pr-2">
      <div className="flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Item
      </div>
      <GhostSeparator />
      <div style={{ width: PERIOD_W }} className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Frequency
      </div>
      <GhostSeparator />
      <div style={{ width: QTY_W }} className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Qty
      </div>
      <GhostSeparator />
      <div
        style={{ width: UNIT_W }}
        className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy"
      >
        Unit price
      </div>
      <div
        style={{ width: TOTAL_W }}
        className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy"
      >
        Total price
      </div>
      <div style={{ width: MENU_W }} className="shrink-0" />
    </div>
  )

  // Expanded ramp period header — merges the period identity into the table
  // header row (the period label replaces the "Item" column label).
  const renderPeriodTableHeader = (
    period: RampPeriod,
    onToggle: () => void,
    onDelete: () => void
  ) => (
    <div className="flex items-center border-b border-neutral-200 pb-2 pl-1 pr-2">
      <div className="flex min-w-0 flex-1 items-center">
        <PeriodChevron isExpanded onToggle={onToggle} />
        <PeriodIdentity
          period={period}
          onChangeDates={(dates) => updatePeriodDates(period.id, dates)}
        />
      </div>
      <GhostSeparator />
      <div style={{ width: PERIOD_W }} className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Frequency
      </div>
      <GhostSeparator />
      <div style={{ width: QTY_W }} className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Qty
      </div>
      <GhostSeparator />
      <div style={{ width: UNIT_W }} className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Unit price
      </div>
      <div style={{ width: TOTAL_W }} className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        Total price
      </div>
      <div className="flex shrink-0 items-center justify-end" style={{ width: MENU_W }}>
        <PeriodOptionsMenu onDelete={onDelete} />
      </div>
    </div>
  )

  const renderLineItem = (item: ProductLineItem, updateItems: (updater: (prev: ProductLineItem[]) => ProductLineItem[]) => void) => {
    const isAttention = item.status === 'attention'
    const isActive = activeRowId === item.id
    const isEdited =
      !!editHistory?.isFieldEdited(PRODUCTS_SECTION_ID, productFieldLabel(item.id, 'Item')) ||
      !!editHistory?.isFieldEdited(PRODUCTS_SECTION_ID, productFieldLabel(item.id, 'Unit price'))
    
    return (
      <div
        key={item.id}
        className={cn(
          "group flex items-center border-b py-1.5 pl-1 pr-2 transition-colors",
          isActive 
            ? "bg-brand-navy border-brand-navy cursor-pointer"
            : cn(
                "border-neutral-100 cursor-pointer",
                isEdited && "bg-amber-50"
              )
        )}
      >
        {/* Item */}
        <ItemNameButton
          name={item.name}
          isAttention={isAttention}
          isRowActive={isActive}
          isEdited={isEdited}
          isViewEditsFocused={
            editHistory?.viewEditsFocus?.sectionId === PRODUCTS_SECTION_ID &&
            editHistory?.viewEditsFocus?.fieldLabel === item.id
          }
          onViewEdits={() => {
            editHistory?.focusViewEdits({
              sectionId: PRODUCTS_SECTION_ID,
              fieldLabel: item.id,
              itemPrefix: true,
            })
          }}
          onOpenChange={(isOpen) => setActiveRowId(isOpen ? item.id : null)}
          onSelect={(catalogItem) => {
            recordProductEdit(editHistory, item.id, 'Item', item.name, catalogItem.name)
            recordProductEdit(
              editHistory,
              item.id,
              'Unit price',
              item.unitPrice,
              catalogItem.unitPrice
            )
            updateItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? { ...i, name: catalogItem.name, unitPrice: catalogItem.unitPrice, status: 'ready' }
                  : i
              )
            )
            setActiveRowId(null)
          }}
        />

        <Separator isRowActive={isActive} />
        <MiniDropdown label={item.billingPeriod} width={PERIOD_W} isRowActive={isActive} />
        <Separator isRowActive={isActive} />
        <MiniDropdown label={item.quantity} width={QTY_W} isRowActive={isActive} />
        <Separator isRowActive={isActive} />

        <div
          style={{ width: UNIT_W }}
          className="flex shrink-0 flex-col items-end gap-0.5 pl-3"
        >
          <div className="flex items-center justify-end gap-2">
            {item.rampPriceChange && !isActive && (
              <RampPriceChangeBadge change={item.rampPriceChange} />
            )}
            <span
              className={cn(
                'text-right text-[14px] font-medium transition-colors',
                isActive ? 'text-white' : 'text-brand-navy'
              )}
            >
              {item.unitPrice}
            </span>
          </div>
        </div>
        <div style={{ width: TOTAL_W }} className={cn(
          "shrink-0 text-right text-[14px] font-medium transition-colors",
          isActive ? "text-white" : "text-brand-navy"
        )}>
          {item.totalPrice}
        </div>

        <div
          className="flex shrink-0 items-center justify-end gap-1.5"
          style={{ width: MENU_W }}
        >
          <button
            type="button"
            className={cn(
              "flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors",
              isActive
                ? "text-white/70 hover:bg-white/10"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-brand-navy"
            )}
          >
            <MoreVertical size={15} />
          </button>
        </div>
      </div>
    )
  }

  const renderAddLineItemButton = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2 border-b border-neutral-100 py-2 pl-1 pr-2 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
    >
      <CirclePlus size={16} className="text-blue-700" />
      Add line item
    </button>
  )

  const handleAddPeriod = () => {
    const lastPeriod = periods?.[periods.length - 1]
    let startDate = '17 Jul 2028'
    let endDate = '17 Jul 2029'
    if (lastPeriod) {
      const lastEnd = new Date(lastPeriod.endDate)
      if (!isNaN(lastEnd.getTime())) {
        const start = new Date(lastEnd)
        start.setDate(start.getDate() + 1)
        const end = new Date(start)
        end.setFullYear(end.getFullYear() + 1)
        end.setDate(end.getDate() - 1)
        const fmt = (d: Date) =>
          d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        startDate = fmt(start)
        endDate = fmt(end)
      }
    }
    const newPeriod: RampPeriod = {
      id: `period-new-${Date.now()}`,
      label: `Period ${(periods?.length ?? 0) + 1}`,
      startDate,
      endDate,
      items: [],
    }

    const previousById = new Map((periods ?? []).map((p) => [p.id, p]))
    const nextPeriods = renumberPeriodsByDate([...(periods ?? []), newPeriod])
    const added = nextPeriods.find((p) => p.id === newPeriod.id) ?? newPeriod
    const renumberNotes = nextPeriods
      .filter((p) => {
        const previous = previousById.get(p.id)
        return previous != null && previous.label !== p.label
      })
      .map((p) => {
        const previous = previousById.get(p.id)!
        return `${previous.label} (${previous.startDate} to ${previous.endDate}) is now ${p.label}`
      })

    setPeriods(nextPeriods)
    setExpandedPeriods((prev) => {
      const next = new Set(prev)
      next.add(newPeriod.id)
      return next
    })
    setAddingToPeriodId(newPeriod.id)

    const dateRange = `${added.startDate} to ${added.endDate}`
    const addValue =
      renumberNotes.length > 0 ? `Added|${renumberNotes.join('. ')}` : 'Added'
    recordProductEdit(editHistory, added.id, added.label, dateRange, addValue)
  }

  // Render with periods (ramp view)
  if (periods && (periods.length > 0 || pendingDelete)) {
    const slotCount = periods.length + (pendingDelete ? 1 : 0)
    let periodCursor = 0

    return (
      <div className="pl-6">
        {Array.from({ length: slotCount }, (_, slotIndex) => {
          if (pendingDelete && slotIndex === pendingDelete.index) {
            return (
              <div key={`deleted-${pendingDelete.period.id}`} style={{ marginBottom: 16 }}>
                <PeriodDeletedUndoBanner
                  period={pendingDelete.period}
                  onUndo={handleUndoDeletePeriod}
                />
              </div>
            )
          }

          const period = periods[periodCursor++]
          if (!period) return null

          const isExpanded = expandedPeriods.has(period.id)
          const isAddingToThisPeriod = addingToPeriodId === period.id
          const isLast = slotIndex === slotCount - 1
          const marginBottom = isLast ? 8 : isExpanded ? 24 : 16

          if (!isExpanded) {
            return (
              <div key={period.id} style={{ marginBottom }}>
                <PeriodHeader
                  period={period}
                  isExpanded={false}
                  onToggle={() => togglePeriod(period.id)}
                  onChangeDates={(dates) => updatePeriodDates(period.id, dates)}
                />
              </div>
            )
          }

          const periodIndexInList = periods.findIndex((p) => p.id === period.id)

          return (
            <div key={period.id} style={{ marginBottom }}>
              {renderPeriodTableHeader(
                period,
                () => togglePeriod(period.id),
                () => handleDeletePeriod(period, periodIndexInList)
              )}

              {period.items.map((item) =>
                renderLineItem(item, (updater) => {
                  setPeriods(prev => prev?.map(p =>
                    p.id === period.id
                      ? { ...p, items: updater(p.items) }
                      : p
                  ))
                })
              )}

              {isAddingToThisPeriod ? (
                <NewLineItemRow
                  onComplete={(newItem) => handleAddComplete(newItem, period.id)}
                  onCancel={() => setAddingToPeriodId(null)}
                />
              ) : (
                renderAddLineItemButton(() => setAddingToPeriodId(period.id))
              )}
            </div>
          )
        })}

        <div className="pl-1 pr-2">
          <button
            type="button"
            onClick={handleAddPeriod}
            className="-ml-6 flex w-[calc(100%+1.5rem)] cursor-pointer items-center gap-1 py-2 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <CirclePlus size={16} className="text-blue-700" />
            </span>
            Add period
          </button>
        </div>
      </div>
    )
  }

  // Default single-table view (backward compatible)
  return (
    <div className="pl-6">
      {renderTableHeader()}

      {/* Rows */}
      {items.map((item) => renderLineItem(item, setItems))}

      {/* New line item row */}
      {isAddingNew && (
        <NewLineItemRow
          onComplete={(newItem) => handleAddComplete(newItem)}
          onCancel={() => setIsAddingNew(false)}
        />
      )}

      {/* Add line item button */}
      {!isAddingNew && renderAddLineItemButton(() => setIsAddingNew(true))}
    </div>
  )
}

export default ProductsPricingTable
