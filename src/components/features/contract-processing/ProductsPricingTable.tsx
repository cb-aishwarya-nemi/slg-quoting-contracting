import { useState, useRef, useEffect, useCallback } from 'react'
import { PackagePlus, ChevronDown, ChevronUp, MoreVertical, CirclePlus, Search, X, Circle, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { cn, withRelativeAnnotation } from '@/lib/utils'
import { type ProductLineItem, type RampPeriod, lineItemCatalog, type CatalogLineItem } from '@/data/contractProcessingMock'

function Separator({ isRowHovered, isRowActive }: { isRowHovered?: boolean; isRowActive?: boolean }) {
  return <div className={cn(
    "mx-3 h-5 w-px shrink-0 transition-colors",
    (isRowActive || isRowHovered) ? "bg-white/20" : "bg-neutral-200"
  )} />
}

function GhostSeparator() {
  return <div className="mx-3 h-5 w-px shrink-0" />
}

function MiniDropdown({ label, width, isRowHovered, isRowActive }: { label: string; width: number; isRowHovered?: boolean; isRowActive?: boolean }) {
  return (
    <button
      type="button"
      style={{ width }}
      className={cn(
        "flex shrink-0 items-center justify-between gap-1 rounded px-1 py-1 text-[14px] transition-colors",
        (isRowActive || isRowHovered)
          ? "text-white hover:bg-white/10"
          : "text-brand-navy hover:bg-neutral-100"
      )}
    >
      <span>{label}</span>
      <ChevronDown size={14} className={cn(
        "transition-colors",
        (isRowActive || isRowHovered) ? "text-white/70" : "text-brand-mist"
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

    const handleClickOutside = (e: MouseEvent) => {
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

    const handleClickOutside = (e: MouseEvent) => {
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
  isRowHovered?: boolean
}

function ItemNameButton({ name, isAttention, onSelect, onOpenChange, isRowHovered }: ItemNameButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  return (
    <div className="relative flex min-w-0 flex-1 items-center group/item">
      {/* Icon with negative margin — sits outside the table column for alignment */}
      {isAttention && (
        <div className="relative -ml-6 mr-2 shrink-0">
          <PackagePlus size={16} className="shrink-0 ai-gradient-text" />
          {!isOpen && !isRowHovered && (
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
          (isOpen || isRowHovered)
            ? 'text-white'
            : (isAttention ? 'ai-gradient-text' : 'text-brand-navy')
        )}
      >
        <span className="truncate">{name}</span>
        <ChevronDown size={14} className={cn(
          "shrink-0 transition-colors",
          (isOpen || isRowHovered) ? "text-white/70" : "text-brand-mist"
        )} />
      </button>
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

type NewRowStep = 'item' | 'frequency' | 'quantity' | 'done'

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
  const [step, setStep] = useState<NewRowStep>('item')
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
        <Circle size={16} className="-ml-6 mr-2 shrink-0 text-brand-mist" />
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
          onClose={onCancel}
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
          onClose={() => setStep('item')}
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

/** Period identity: label + date range (with relative annotation on the start). */
function PeriodIdentity({ period }: { period: RampPeriod }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[13px] font-semibold text-brand-navy">{period.label}</span>
      <span className="text-[13px] text-brand-fog">·</span>
      <div className="flex items-center gap-1.5 text-[12px] text-brand-fog">
        <Calendar size={14} className="shrink-0 text-brand-mist" />
        <span className="whitespace-nowrap">{withRelativeAnnotation(period.startDate)}</span>
        <span>to</span>
        <span className="whitespace-nowrap">{period.endDate}</span>
      </div>
    </div>
  )
}

/** Collapsed period row — clicking anywhere expands. */
function PeriodHeader({ period, isExpanded, onToggle }: PeriodHeaderProps) {
  return (
    <div
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center py-3 pl-1 pr-2 transition-colors hover:bg-neutral-50"
    >
      <PeriodChevron isExpanded={isExpanded} onToggle={onToggle} />
      <PeriodIdentity period={period} />
    </div>
  )
}

function RampPriceChangeBadge({ change }: { change: number }) {
  const isIncrease = change >= 0
  const Icon = isIncrease ? TrendingUp : TrendingDown

  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-green-700 whitespace-nowrap">
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
  const [items, setItems] = useState(initialItems)
  const [periods, setPeriods] = useState(initialPeriods)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(() => {
    if (initialPeriods) {
      return new Set(initialPeriods.map(p => p.id))
    }
    return new Set()
  })
  const [addingToPeriodId, setAddingToPeriodId] = useState<string | null>(null)

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
  const renderPeriodTableHeader = (period: RampPeriod, onToggle: () => void) => (
    <div className="flex items-center border-b border-neutral-200 pb-2 pl-1 pr-2">
      <div className="flex min-w-0 flex-1 items-center">
        <PeriodChevron isExpanded onToggle={onToggle} />
        <PeriodIdentity period={period} />
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
      <div style={{ width: MENU_W }} className="shrink-0" />
    </div>
  )

  const renderLineItem = (item: ProductLineItem, updateItems: (updater: (prev: ProductLineItem[]) => ProductLineItem[]) => void) => {
    const isAttention = item.status === 'attention'
    const isActive = activeRowId === item.id
    const isHovered = hoveredRowId === item.id
    
    return (
      <div
        key={item.id}
        onMouseEnter={() => setHoveredRowId(item.id)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          "group row-hover-trail flex items-center border-b py-1.5 pl-1 pr-2",
          isActive 
            ? "bg-brand-navy border-brand-navy cursor-pointer"
            : "border-neutral-100 cursor-pointer hover:bg-brand-navy hover:border-brand-navy"
        )}
      >
        {/* Item */}
        <ItemNameButton
          name={item.name}
          isAttention={isAttention}
          isRowHovered={isHovered && !isActive}
          onOpenChange={(isOpen) => setActiveRowId(isOpen ? item.id : null)}
          onSelect={(catalogItem) => {
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

        <Separator isRowHovered={isHovered} isRowActive={isActive} />
        <MiniDropdown label={item.billingPeriod} width={PERIOD_W} isRowHovered={isHovered} isRowActive={isActive} />
        <Separator isRowHovered={isHovered} isRowActive={isActive} />
        <MiniDropdown label={item.quantity} width={QTY_W} isRowHovered={isHovered} isRowActive={isActive} />
        <Separator isRowHovered={isHovered} isRowActive={isActive} />

        <div style={{ width: UNIT_W }} className={cn(
          "shrink-0 text-right text-[14px] font-medium transition-colors",
          (isActive || isHovered) ? "text-white" : "text-brand-navy"
        )}>
          {item.unitPrice}
        </div>
        <div style={{ width: TOTAL_W }} className={cn(
          "shrink-0 text-right text-[14px] font-medium transition-colors",
          (isActive || isHovered) ? "text-white" : "text-brand-navy"
        )}>
          {item.totalPrice}
        </div>

        <div style={{ width: MENU_W }} className="relative flex shrink-0 justify-end">
          <button
            type="button"
            className={cn(
              "flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors",
              (isActive || isHovered)
                ? "text-white/70 hover:bg-white/10"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-brand-navy"
            )}
          >
            <MoreVertical size={15} />
          </button>
          {item.rampPriceChange && !isActive && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
              <RampPriceChangeBadge change={item.rampPriceChange} />
            </div>
          )}
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

  // Render with periods (ramp view)
  if (periods && periods.length > 0) {
    return (
      <div className="pl-6">
        {periods.map((period, idx) => {
          const isExpanded = expandedPeriods.has(period.id)
          const isAddingToThisPeriod = addingToPeriodId === period.id
          const isLast = idx === periods.length - 1
          // 24px between expanded tables, 16px between collapsed rows
          const marginBottom = isLast ? 0 : isExpanded ? 24 : 16

          if (!isExpanded) {
            return (
              <div key={period.id} style={{ marginBottom }}>
                <PeriodHeader
                  period={period}
                  isExpanded={false}
                  onToggle={() => togglePeriod(period.id)}
                />
              </div>
            )
          }

          return (
            <div key={period.id} style={{ marginBottom }}>
              {renderPeriodTableHeader(period, () => togglePeriod(period.id))}

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
