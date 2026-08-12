import { useState, useRef, useEffect, useLayoutEffect, useCallback, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { PackagePlus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreVertical, CirclePlus, Search, X, Calendar, TrendingUp, TrendingDown, Pencil, Trash, Tag, Minimize2 } from 'lucide-react'
import { cn, withRelativeAnnotation } from '@/lib/utils'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import {
  type ProductLineItem,
  type RampPeriod,
  type DiscountUnit,
  type DiscountPeriod,
  DISCOUNT_UNITS,
  DISCOUNT_PERIODS,
  lineItemCatalog,
  type CatalogLineItem,
} from '@/data/contractProcessingMock'
import {
  useOptionalFieldEditHistory,
} from '@/context/FieldEditHistoryContext'
import { ACTIVE_FIELD_STYLE } from './fieldStyles'

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
  isRowHovered,
  isRowActive,
  alignTop,
  hideLine,
}: {
  isRowHovered?: boolean
  isRowActive?: boolean
  alignTop?: boolean
  /** Keeps the column gap but drops the rule — the lifted table runs without them. */
  hideLine?: boolean
}) {
  return <div className={cn(
    "mx-3 w-px shrink-0 transition-colors",
    alignTop ? "mt-1 h-4 self-start" : "h-5",
    hideLine
      ? "bg-transparent"
      : (isRowActive || isRowHovered) ? "bg-white/20" : "bg-neutral-200"
  )} />
}

function GhostSeparator() {
  return <div className="mx-3 h-5 w-px shrink-0" />
}

function MiniDropdown({
  label,
  width,
  isRowHovered,
  isRowActive,
  alignTop,
  asField,
}: {
  label: string
  width?: number
  isRowHovered?: boolean
  isRowActive?: boolean
  alignTop?: boolean
  /** Wear the page's grey edit pill instead of reading as plain row text. */
  asField?: boolean
}) {
  return (
    <button
      type="button"
      style={width != null ? { width } : undefined}
      className={cn(
        'flex items-center justify-between gap-1 rounded px-1 py-1 text-[14px] transition-colors',
        width != null ? 'shrink-0' : 'w-full min-w-0',
        alignTop && 'self-start',
        asField
          ? cn(ACTIVE_FIELD_STYLE, 'cursor-pointer hover:bg-neutral-200')
          : isRowActive || isRowHovered
            ? 'text-white hover:bg-white/10'
            : 'text-brand-navy hover:bg-neutral-100'
      )}
    >
      <span className="truncate">{label}</span>
      <ChevronDown
        size={14}
        className={cn(
          'shrink-0 transition-colors',
          !asField && (isRowActive || isRowHovered) ? 'text-white/70' : 'text-brand-mist'
        )}
      />
    </button>
  )
}

/** Expanded-state only — in-place choice menu (Edit state uses the non-interactive MiniDropdown). */
function InteractiveMiniDropdown({
  label,
  width,
  options,
  onSelect,
  disabled,
  ariaLabel,
  limitedPeriodOption,
}: {
  label: string
  width?: number
  options: string[]
  onSelect: (value: string) => void
  disabled?: boolean
  ariaLabel?: string
  limitedPeriodOption?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div
      className={cn('relative', width != null ? 'shrink-0' : 'min-w-0 w-full')}
      style={width != null ? { width } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'flex w-full items-center justify-between gap-1 rounded px-1 py-1 text-[14px] transition-colors',
          disabled
            ? 'cursor-not-allowed opacity-50 text-brand-mist'
            : 'cursor-pointer text-brand-navy hover:bg-neutral-100'
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={14} className="shrink-0 text-brand-mist" />
      </button>
      {!disabled ? (
        <MiniDropdownPopover
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSelect={(value) => {
            setIsOpen(false)
            onSelect(value)
          }}
          options={options}
          currentValue={label}
          anchorRef={triggerRef}
          limitedPeriodOption={limitedPeriodOption}
        />
      ) : null}
    </div>
  )
}

const BILLING_PERIODS = ['Monthly', 'Quarterly', 'Yearly', 'One-time']
/** Common quantities for the expanded-state qty menu. */
const QUANTITY_OPTIONS = ['01', '02', '03', '05', '10', '25', '50', '75', '100', '200']

interface LineItemPopoverProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: CatalogLineItem) => void
  anchorRef: RefObject<HTMLElement | null>
  currentName: string
}

function LineItemPopover({
  isOpen,
  onClose,
  onSelect,
  anchorRef,
  currentName,
}: LineItemPopoverProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  const filteredItems = lineItemCatalog.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.family.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AnchoredMenu
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      className="w-[400px] rounded-lg border border-neutral-200 bg-white shadow-lg"
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
          <div className="p-4 text-center text-[13px] text-brand-fog">No items found</div>
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
                {item.family} · {item.unitPrice}/unit · {item.billingPeriod}
              </span>
            </button>
          ))
        )}
      </div>
    </AnchoredMenu>
  )
}

const LIMITED_PERIOD_OPTION = 'Limited Period'
const LIMITED_PERIOD_UNITS = ['Week', 'Month', 'Year']

/** `"6 weeks"` → `{ count: '6', unit: 'Week' }`. Returns null for the preset choices. */
function parseLimitedPeriod(value: string) {
  const match = /^(\d+)\s*(week|month|year)s?$/i.exec(value.trim())
  if (!match) return null
  const unit = match[2].toLowerCase()
  return { count: match[1], unit: unit.charAt(0).toUpperCase() + unit.slice(1) }
}

function formatLimitedPeriod(count: string, unit: string) {
  const amount = Number.parseInt(count, 10)
  return `${amount} ${unit.toLowerCase()}${amount === 1 ? '' : 's'}`
}

/** Unit picker inside the limited-period step — kept inline so it can't close the parent menu. */
function LimitedPeriodUnitSelect({
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
        aria-label="Period unit"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[14px] font-medium text-brand-navy transition-colors hover:bg-neutral-100"
      >
        {value}
        <ChevronDown size={14} className="shrink-0 text-brand-mist" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[104px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {LIMITED_PERIOD_UNITS.map((unit) => (
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

/** Second step of the discount-period menu — captures a custom duration like `6 weeks`. */
function LimitedPeriodPanel({
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
    onApply(formatLimitedPeriod(count, unit))
  }

  return (
    <div className="w-[280px] p-3">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to discount period options"
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-brand-mist transition-colors hover:bg-neutral-100 hover:text-brand-navy"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Applicable discount period
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
        <LimitedPeriodUnitSelect value={unit} onChange={setUnit} />
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
            canApply ? 'cursor-pointer bg-brand-navy hover:bg-brand-soft' : 'cursor-not-allowed bg-neutral-300'
          )}
        >
          Apply
        </button>
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
  anchorRef: RefObject<HTMLElement | null>
  /** Option that opens the duration step instead of committing straight away. */
  limitedPeriodOption?: string
}

function MiniDropdownPopover({
  isOpen,
  onClose,
  onSelect,
  options,
  currentValue,
  anchorRef,
  limitedPeriodOption,
}: MiniDropdownPopoverProps) {
  const [showLimitedPanel, setShowLimitedPanel] = useState(false)
  const currentLimited = limitedPeriodOption ? parseLimitedPeriod(currentValue) : null

  useEffect(() => {
    if (!isOpen) setShowLimitedPanel(false)
  }, [isOpen])

  return (
    <AnchoredMenu
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      className={cn(
        'rounded-lg border border-neutral-200 bg-white shadow-lg',
        showLimitedPanel ? '' : 'min-w-[120px] py-1'
      )}
    >
      {showLimitedPanel ? (
        <LimitedPeriodPanel
          initialCount={currentLimited?.count}
          initialUnit={currentLimited?.unit}
          onBack={() => setShowLimitedPanel(false)}
          onCancel={onClose}
          onApply={(value) => onSelect(value)}
        />
      ) : (
        options.map((option) => {
          const isSelected =
            option === currentValue ||
            (option === limitedPeriodOption && currentLimited !== null)

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                if (option === limitedPeriodOption) {
                  setShowLimitedPanel(true)
                  return
                }
                onSelect(option)
              }}
              className={cn(
                'group/period flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-[14px] transition-colors',
                isSelected
                  ? 'bg-neutral-100 font-medium text-brand-navy'
                  : 'text-brand-navy hover:bg-brand-navy hover:text-white'
              )}
            >
              <span className="truncate">{option}</span>
              {option === limitedPeriodOption && currentLimited && (
                <span className="shrink-0 text-[12px] text-brand-mist group-hover/period:text-white/70">
                  {formatLimitedPeriod(currentLimited.count, currentLimited.unit)}
                </span>
              )}
            </button>
          )
        })
      )}
    </AnchoredMenu>
  )
}

/** Renders the stored amount + unit as a single label, e.g. `10%` or `$500`. */
function formatDiscount(value?: string, unit?: DiscountUnit) {
  if (!value || !(parseFloat(value) > 0)) return '–'
  return unit === 'USD' ? `$${value}` : `${value}%`
}

/** Rounds a typed amount back into the table's currency format. */
function formatCurrency(input: string): string {
  const amount = parseFloat(input.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(amount)) return input
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function computeTotalPrice(unitPrice: string, quantity: string): string | null {
  const price = parseFloat(unitPrice.replace(/[^\d.]/g, ''))
  const qty = parseInt(quantity, 10)
  if (!Number.isFinite(price) || !Number.isFinite(qty)) return null
  return (price * qty).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

interface PriceFieldProps {
  value: string
  ariaLabel: string
  onCommit: (value: string) => void
  /** Skip the grey edit pill — Expanded state keeps default table chrome. */
  plain?: boolean
}

/** Currency cell that edits in place, wearing the same pill as every other field. */
function PriceField({ value, ariaLabel, onCommit, plain }: PriceFieldProps) {
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = () => {
    const next = formatCurrency(draft)
    setDraft(next)
    if (next !== value) onCommit(next)
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      inputMode="decimal"
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit()
          inputRef.current?.blur()
        }
        if (e.key === 'Escape') {
          // Otherwise the table's Escape handler collapses the whole edit surface.
          e.stopPropagation()
          setDraft(value)
          inputRef.current?.blur()
        }
      }}
      className={cn(
        plain
          ? 'w-full bg-transparent px-1 py-1 text-right text-[14px] font-medium text-brand-navy outline-none'
          : cn(ACTIVE_FIELD_STYLE, 'text-right')
      )}
    />
  )
}

interface DiscountFieldProps {
  value: string
  unit: DiscountUnit
  onChange: (next: { value: string; unit: DiscountUnit }) => void
  plain?: boolean
}

/** Amount input with the % / USD switch built into the same pill. */
function DiscountField({ value, unit, onChange, plain }: DiscountFieldProps) {
  const [draft, setDraft] = useState(value)
  const [isUnitOpen, setIsUnitOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const unitTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = () => {
    if (draft !== value) onChange({ value: draft, unit })
  }

  return (
    // The wrapper's padding keeps the pill off its neighbour without pushing it
    // past the end of its grid track, which a margin on a full-width pill would.
    <div className="min-w-0 pl-3" onClick={(e) => e.stopPropagation()}>
      <div
        className={cn(
          plain
            ? 'flex w-full items-center gap-1 rounded px-1 py-1 transition-colors hover:bg-neutral-100 focus-within:bg-neutral-100'
            : cn(
                ACTIVE_FIELD_STYLE,
                'flex items-center gap-1 transition-colors focus-within:bg-neutral-200'
              )
        )}
      >
        <input
          ref={inputRef}
          value={draft}
          inputMode="decimal"
          placeholder="0"
          aria-label="Discount"
          onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit()
              inputRef.current?.blur()
            }
            if (e.key === 'Escape') {
              e.stopPropagation()
              setDraft(value)
              inputRef.current?.blur()
            }
          }}
          className="w-full min-w-0 bg-transparent text-right text-[14px] font-medium text-brand-navy outline-none placeholder:text-brand-mist"
        />
        <div className="relative shrink-0">
          <button
            ref={unitTriggerRef}
            type="button"
            aria-label="Discount unit"
            // Keeps the popover's outside-click listener from firing on the toggle itself.
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setIsUnitOpen((open) => !open)}
            className={cn(
              'flex cursor-pointer items-center gap-0.5 rounded px-1 text-[12px] font-medium text-brand-fog transition-colors',
              plain ? 'hover:text-brand-navy' : 'hover:bg-neutral-300/60 hover:text-brand-navy'
            )}
          >
            {unit}
            <ChevronDown size={12} className="text-brand-mist" />
          </button>
          <MiniDropdownPopover
            isOpen={isUnitOpen}
            onClose={() => setIsUnitOpen(false)}
            onSelect={(next) => {
              setIsUnitOpen(false)
              onChange({ value: draft, unit: next as DiscountUnit })
            }}
            options={[...DISCOUNT_UNITS]}
            currentValue={unit}
            anchorRef={unitTriggerRef}
          />
        </div>
      </div>
    </div>
  )
}

interface SelectFieldProps {
  value: string
  options: string[]
  ariaLabel: string
  onChange: (value: string) => void
  disabled?: boolean
  plain?: boolean
  /** Option that opens the duration step instead of committing straight away. */
  limitedPeriodOption?: string
}

/** Pill-styled dropdown for the edit surface's plain choice columns. */
function SelectField({
  value,
  options,
  ariaLabel,
  onChange,
  disabled,
  plain,
  limitedPeriodOption,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="min-w-0 pl-3" onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          disabled={disabled}
          // Keeps the popover's outside-click listener from firing on the toggle itself.
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            plain
              ? 'flex w-full items-center justify-between gap-1 rounded px-1 py-1 text-[14px] font-medium text-brand-navy'
              : ACTIVE_FIELD_STYLE,
            !plain && 'flex items-center justify-between gap-1',
            disabled
              ? 'cursor-not-allowed opacity-50'
              : plain
                ? 'cursor-pointer hover:bg-neutral-100'
                : 'cursor-pointer hover:bg-neutral-200',
            isOpen && (plain ? 'bg-neutral-100' : 'bg-neutral-200')
          )}
        >
          <span className="truncate">{value}</span>
          <ChevronDown size={14} className="shrink-0 text-brand-mist" />
        </button>
        {!disabled && (
          <MiniDropdownPopover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onSelect={(next) => {
              setIsOpen(false)
              onChange(next)
            }}
            options={options}
            currentValue={value}
            anchorRef={triggerRef}
            limitedPeriodOption={limitedPeriodOption}
          />
        )}
      </div>
    </div>
  )
}

interface ItemNameButtonProps {
  name: string
  isAttention: boolean
  onSelect: (item: CatalogLineItem) => void
  onOpenChange?: (isOpen: boolean) => void
  isRowHovered?: boolean
  isRowActive?: boolean
  isEdited?: boolean
  isViewEditsFocused?: boolean
  onViewEdits?: () => void
  /** Increment to programmatically open the item picker (e.g. from row Edit). */
  openRequestId?: number
  /** Wear the page's grey edit pill instead of reading as plain row text. */
  asField?: boolean
  /**
   * The attention icon normally hangs in the gutter to the left of the column
   * via a negative margin. A sticky first column has no such gutter to hang
   * into (it would be clipped by the scroll container), so this keeps it inline.
   */
  hangIcon?: boolean
}

function ItemNameButton({
  name,
  isAttention,
  onSelect,
  onOpenChange,
  isRowHovered,
  isRowActive,
  isEdited,
  isViewEditsFocused,
  onViewEdits,
  openRequestId,
  asField,
  hangIcon = true,
}: ItemNameButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  useEffect(() => {
    if (openRequestId && openRequestId > 0) {
      handleOpenChange(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open only when request id bumps
  }, [openRequestId])

  return (
    <div className="group/item relative flex min-w-0 flex-1 items-center gap-1.5">
      {/* Edit-state: hang the attention icon in the left gutter outside the column. */}
      {isAttention && hangIcon && (
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
          asField
            ? cn(ACTIVE_FIELD_STYLE, 'justify-between hover:bg-neutral-200', isOpen && 'bg-neutral-200')
            : hangIcon
              ? (isOpen || isRowHovered)
                ? 'text-white'
                : (isAttention ? 'ai-gradient-text' : 'text-brand-navy')
              : (isAttention ? 'ai-gradient-text' : 'text-brand-navy')
        )}
      >
        {/* On the pill the gradient has to sit on the text alone — as a button
            class its background would paint over the pill fill. */}
        <span className={cn('truncate', asField && isAttention && 'ai-gradient-text')}>{name}</span>
        <ChevronDown size={14} className={cn(
          "shrink-0 transition-colors",
          hangIcon && !asField && (isOpen || isRowHovered) ? "text-white/70" : "text-brand-mist"
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
            isRowHovered
              ? 'bg-white/15 text-white/80'
              : isViewEditsFocused
                ? 'bg-amber-100/70 text-amber-800/80'
                : 'bg-amber-50 text-amber-700/70'
          )}
        >
          <span className={isRowHovered ? 'hidden' : 'inline'}>Edited</span>
          <span className={isRowHovered ? 'inline' : 'hidden'}>View edits</span>
        </button>
      )}
      {/* Expanded sticky cell: sit the attention icon at the trailing edge. */}
      {isAttention && !hangIcon && (
        <div className="relative ml-auto shrink-0 pr-2">
          <PackagePlus size={16} className="shrink-0 ai-gradient-text" />
          {!isOpen && !isRowHovered && (
            <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/item:opacity-100 ai-gradient">
              Created this item based on your contract
            </span>
          )}
        </div>
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
/** Edit-mode-only column between unit price and total — fits the amount + unit control. */
const DISCOUNT_W = 78
/** Edit-mode-only column for how long the discount runs. */
const DISCOUNT_PERIOD_W = 116
const TOTAL_W = 124
/** Inline layout only — leaves room for the discount tag beside the amount. */
const TOTAL_INLINE_W = 172
const MENU_W = 48
/** A separator's `mx-3` margins plus its 1px rule. */
const SEPARATOR_W = 25
/** The `pl-1 pr-2` every row carries. */
const ROW_PAD_X = 12
/** Expanded-state only — fixed width of the sticky first (Item / period) column.
 *  Sized to fit "Period N · 📅 17 Jul 2026 to 17 Jun 2028" without spilling
 *  into Frequency; item names truncate inside the same track. */
const EXPANDED_ITEM_W = 340
/** `pl-1` on expanded rows — sticky Item starts after this inset. */
const EXPANDED_ROW_PAD_L = 4

/** How far the sticky-column shadow reaches into the scrolling columns. */
const STICKY_SHADOW_W = 48
/** Scroll distance over which the shadow deepens from resting to full strength. */
const STICKY_SHADOW_RAMP = 48
/** Resting strength while the columns sit at scroll origin. */
const STICKY_SHADOW_REST = 0.42
/** Vertical falloff so the shadow dissolves instead of ending on a hard line. */
const STICKY_SHADOW_FADE_Y = 28

/**
 * Expanded-state horizontal scroller. Renders one continuous soft shadow at the
 * sticky Item column’s right edge so the pin + scrollable remainder read clearly.
 * The overlay lives outside the scroll box — inside it, an absolute element would
 * scroll away with the columns — and it deepens as content slides underneath.
 */
function ExpandedScrollContainer({
  children,
  pauseShadow,
  fullWidth,
}: {
  children: ReactNode
  /** Freeze shadow updates while a full-page morph is in flight. */
  pauseShadow?: boolean
  /** Stretch rows to the container — used in the full-page expand view. */
  fullWidth?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const sync = () => {
      if (pauseShadow || fullWidth) {
        setStrength(0)
        return
      }
      if (el.scrollWidth - el.clientWidth <= 1) {
        setStrength(0)
        return
      }
      const progress = Math.min(1, el.scrollLeft / STICKY_SHADOW_RAMP)
      setStrength(STICKY_SHADOW_REST + (1 - STICKY_SHADOW_REST) * progress)
    }

    sync()
    el.addEventListener('scroll', sync, { passive: true })
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', sync)
      ro.disconnect()
    }
  }, [pauseShadow, fullWidth])

  const verticalFade = `linear-gradient(to bottom, transparent 0, #000 ${STICKY_SHADOW_FADE_Y}px, #000 calc(100% - ${STICKY_SHADOW_FADE_Y}px), transparent 100%)`

  return (
    <div className={cn('relative', fullWidth && 'w-full')}>
      <div ref={ref} className={cn(fullWidth ? 'w-full' : 'overflow-x-auto')}>
        {children}
      </div>
      {!fullWidth ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-20 transition-opacity duration-300 ease-out"
          style={{
            left: EXPANDED_ROW_PAD_L + EXPANDED_ITEM_W,
            width: STICKY_SHADOW_W,
            opacity: strength,
            // Long, low-alpha ramp so the edge feathers rather than casting a hard band.
            background:
              'linear-gradient(to right, rgba(28, 27, 46, 0.055) 0%, rgba(28, 27, 46, 0.038) 12%, rgba(28, 27, 46, 0.024) 28%, rgba(28, 27, 46, 0.012) 48%, rgba(28, 27, 46, 0.005) 70%, rgba(28, 27, 46, 0.001) 88%, rgba(28, 27, 46, 0) 100%)',
            maskImage: verticalFade,
            WebkitMaskImage: verticalFade,
          }}
        />
      ) : null}
    </div>
  )
}

const EXPAND_RATIO = 1.3
/** Row chevrons and AI icons hang 24px left of the table box; keep that inside the bounds. */
const EXPAND_EDGE_GUTTER = 24
/** Breathing room between the expanded table and the page edges. */
const PAGE_EDGE_MARGIN = 24
/** How far the elliptical blur halo reaches past the expanded table. */
const HALO_SPREAD_X = 220
const HALO_SPREAD_Y = 150
/** Inset that keeps rows clear of the lifted surface's rounded corners. */
const SHELL_PAD_X = 14
const SHELL_PAD_Y = 10

const EXPAND_TRANSITION = '500ms ease-out'
/** Settling back is quicker than opening, and eases at both ends so it lands softly. */
const COLLAPSE_MS = 420
const COLLAPSE_TRANSITION = `${COLLAPSE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
/** Small cushion so the last pixel of the tween lands before the layout swaps back. */
const COLLAPSE_SETTLE_MS = COLLAPSE_MS + 40

/**
 * Expanded-state full-page view — opacity + a hair of scale on a layer whose
 * layout never changes mid-flight. Geometric morphs read as janky here because
 * the panel's aspect ratio and column tracks would have to retarget every frame.
 */
const FULLPAGE_EXPAND_MS = 320
const FULLPAGE_EXPAND_TRANSITION = `${FULLPAGE_EXPAND_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
const FULLPAGE_COLLAPSE_MS = 260
const FULLPAGE_COLLAPSE_TRANSITION = `${FULLPAGE_COLLAPSE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
const FULLPAGE_COLLAPSE_SETTLE_MS = FULLPAGE_COLLAPSE_MS + 30
/** Resting scale before open / after close — enough to feel like depth, not a zoom. */
const FULLPAGE_REST_SCALE = 0.985
const FULLPAGE_PAD_TOP = 32
const FULLPAGE_PAD_X = 48
const FULLPAGE_PAD_BOTTOM = 64

interface ExpandBounds {
  centerX: number
  maxWidth: number
}

/**
 * Edit-state only: the table is lifted into a fixed layer and no longer inherits
 * its column's width. It centers on the page rather than on its own column. When
 * the secondary nav row is on screen, its bounds are used directly; otherwise this
 * falls back to `main` with margins that keep both edges inside it.
 */
function measureExpandBounds(): ExpandBounds {
  const secondaryNav = document.querySelector('[data-c360-secondary-nav]')
  if (secondaryNav) {
    const rect = secondaryNav.getBoundingClientRect()
    return {
      centerX: (rect.left + rect.right) / 2,
      maxWidth: Math.max(0, rect.width),
    }
  }

  const page = document.querySelector('main')
  let left = 0
  let right = window.innerWidth

  if (page) {
    const style = window.getComputedStyle(page)
    const paddingLeft = parseFloat(style.paddingLeft) || 0
    const paddingRight = parseFloat(style.paddingRight) || 0
    left = page.getBoundingClientRect().left + page.clientLeft + paddingLeft
    right = left + Math.max(0, page.clientWidth - paddingLeft - paddingRight)
  }

  left += PAGE_EDGE_MARGIN
  right -= PAGE_EDGE_MARGIN
  const centerX = (left + right) / 2

  return {
    centerX,
    maxWidth: Math.max(
      0,
      2 * Math.min(centerX - left - EXPAND_EDGE_GUTTER, right - centerX)
    ),
  }
}

/**
 * Add line item — mirrors the Account section's "Add field": the button itself
 * opens the catalog picker, and choosing an entry drops a populated row in.
 */
function AddLineItemButton({ onSelect }: { onSelect: (item: CatalogLineItem) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-2 border-b border-neutral-100 py-2 pl-1 pr-2 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <CirclePlus size={16} className="text-blue-700" />
        Add line item
      </button>
      <LineItemPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(item) => {
          onSelect(item)
          setIsOpen(false)
        }}
        anchorRef={buttonRef}
        currentName=""
      />
    </div>
  )
}

interface PeriodHeaderProps {
  period: RampPeriod
  isExpanded: boolean
  onToggle: () => void
}

/** Blue collapse chevron that hangs to the left of the period label. */
function PeriodChevron({
  isExpanded,
  onToggle,
  hangIcon = true,
}: {
  isExpanded: boolean
  onToggle: () => void
  /** See `ItemNameButton`'s `hangIcon` — a sticky column has no gutter to hang into. */
  hangIcon?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={cn(
        'mr-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-blue-700 transition-colors hover:bg-blue-50',
        hangIcon && '-ml-6'
      )}
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
  onChange,
  defaultOpen = false,
  onOpenChange,
}: {
  value: string
  onChange: (value: string) => void
  /** Open the calendar on mount — used after "Add period" to prompt for the from date. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const selected = parsePeriodDate(value) ?? new Date()
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  )
  const buttonRef = useRef<HTMLButtonElement>(null)

  const setPickerOpen = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    if (!open) return
    const parsed = parsePeriodDate(value)
    if (parsed) setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
  }, [open, value])

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
      isOpen={open}
      onClose={() => setPickerOpen(false)}
      anchorRef={buttonRef}
      offset={6}
      className="w-[280px] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
    >
      <div role="dialog" aria-label="Choose date" onClick={(e) => e.stopPropagation()}>
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
                      setPickerOpen(false)
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

  return (
    <span className="relative inline-flex items-center gap-1">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e: MouseEvent) => {
          e.stopPropagation()
          setPickerOpen(!open)
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
      {calendar}
    </span>
  )
}

/** Period identity: label + editable date range. */
function PeriodIdentity({
  period,
  onChangeDates,
  autoOpenStartDate = false,
  onStartDatePickerClose,
}: {
  period: RampPeriod
  onChangeDates?: (dates: { startDate: string; endDate: string }) => void
  /** Opens the from-date picker once — used right after "Add period". */
  autoOpenStartDate?: boolean
  onStartDatePickerClose?: () => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-hidden pr-2">
      <span className="shrink-0 text-[13px] font-semibold text-brand-navy">{period.label}</span>
      <span className="shrink-0 text-[13px] text-brand-fog">·</span>
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[12px] text-brand-fog">
        <Calendar size={14} className="shrink-0 text-brand-mist" />
        <PeriodDateEdit
          value={period.startDate}
          defaultOpen={autoOpenStartDate}
          onOpenChange={(next) => {
            if (!next) onStartDatePickerClose?.()
          }}
          onChange={(startDate) =>
            onChangeDates?.({ startDate, endDate: period.endDate })
          }
        />
        <span className="shrink-0">to</span>
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
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative flex w-full justify-end">
      <button
        ref={triggerRef}
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
      <AnchoredMenu
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        align="end"
        className="min-w-[160px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
      >
        <div role="menu">
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
      </AnchoredMenu>
    </div>
  )
}

/** Ellipsis menu for a line item — mirrors PeriodOptionsMenu, with a Delete item action. */
function LineItemOptionsMenu({
  itemName,
  onDelete,
}: {
  itemName: string
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative flex w-full justify-end">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-navy"
        aria-label={`Options for ${itemName}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical size={15} />
      </button>
      <AnchoredMenu
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        align="end"
        className="min-w-[160px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
      >
        <div role="menu">
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
            Delete item
          </button>
        </div>
      </AnchoredMenu>
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
    <span className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-green-700 group-hover:text-green-400">
      <Icon size={12} strokeWidth={2} className="shrink-0 text-green-700 group-hover:text-green-400" />
      {Math.abs(change)}%
    </span>
  )
}

/** Converts a percentage discount into its dollar value off the pre-discount total. */
function computeDiscountDollarValue(
  discount?: string,
  discountUnit?: DiscountUnit,
  baseAmount?: string
): number | null {
  if (discountUnit !== '%') return null
  const pct = parseFloat(discount ?? '')
  const base = parseFloat((baseAmount ?? '').replace(/[^\d.]/g, ''))
  if (!Number.isFinite(pct) || !Number.isFinite(base)) return null
  return (base * pct) / 100
}

/**
 * Inline-table tag flagging a discount on the row, with the amount shown right
 * on the pill. A hover layer adds the dollar equivalent and period, since those
 * don't fit inline — the expanded table's Discount column remains the source of
 * truth for editing.
 */
function DiscountBadge({
  isRowFilled,
  discount,
  discountUnit,
  discountPeriod,
  baseAmount,
}: {
  isRowFilled?: boolean
  discount?: string
  discountUnit?: DiscountUnit
  discountPeriod?: DiscountPeriod
  /** Pre-discount total, used to convert a percentage discount into a dollar value. */
  baseAmount?: string
}) {
  const dollarValue = computeDiscountDollarValue(discount, discountUnit, baseAmount)

  return (
    <span
      className={cn(
        'group/discount relative inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-none px-1.5 py-0.5 text-[10px] font-medium tracking-[-0.01em] transition-colors',
        isRowFilled ? 'bg-transparent text-fuchsia-400' : 'bg-violet-50 text-violet-700'
      )}
    >
      <Tag size={10} strokeWidth={2} />
      {formatDiscount(discount, discountUnit)}
      <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-max min-w-[132px] rounded-lg bg-brand-navy px-3 py-2 text-left opacity-0 shadow-lg transition-opacity group-hover/discount:opacity-100">
        <span className="block text-[11px] font-semibold text-white">Discount applied</span>
        <span className="mt-1.5 flex items-center justify-between gap-4">
          <span className="shrink-0 text-[11px] text-white/60">Amount</span>
          <span className="whitespace-nowrap text-[11px] font-medium text-white">
            {formatDiscount(discount, discountUnit)}
            {dollarValue !== null && (
              <span className="text-white/60"> ({formatCurrency(String(dollarValue))})</span>
            )}
          </span>
        </span>
        <span className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-white/60">Period</span>
          <span className="text-[11px] font-medium text-white">{discountPeriod ?? 'None'}</span>
        </span>
      </span>
    </span>
  )
}

/** Use case switcher variants for this section — see UseCaseContext's `customer360` entry. */
export type ProductsPricingVariant = 'edit-state' | 'expanded-state'

interface ProductsPricingTableProps {
  items: ProductLineItem[]
  periods?: RampPeriod[]
  /**
   * Section title and source thumbnails. They live inside the table so they
   * travel with it into edit lift / full-page expand.
   */
  header?: ReactNode
  /**
   * Expanded-state full-page title (e.g. "Pioneer Systems – New deal: …").
   * Fades in with the morph so the table chrome stays continuous.
   */
  fullPageTitle?: string
  /**
   * 'expanded-state' default table shows Discount + Discount period columns,
   * with Item sticky and the rest horizontally scrollable. Expand opens a
   * clear full-page view (Edit state keeps the lifted blur surface).
   */
  variant?: ProductsPricingVariant
  /** Controlled expand — Expand/Shrink (expanded-state) or lift (edit-state). */
  lifted?: boolean
  onLiftedChange?: (lifted: boolean) => void
}

export function ProductsPricingTable({
  items: initialItems,
  periods: initialPeriods,
  header,
  fullPageTitle,
  variant = 'edit-state',
  lifted,
  onLiftedChange,
}: ProductsPricingTableProps) {
  const isExpandedVariant = variant === 'expanded-state'
  const editHistory = useOptionalFieldEditHistory()
  const [items, setItems] = useState(initialItems)
  const [periods, setPeriods] = useState(initialPeriods)
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [lineItemEditRequest, setLineItemEditRequest] = useState<Record<string, number>>({})
  const [isEditMode, setIsEditMode] = useState(false)
  // Expanded full-page view uses the same editable surface as Edit — without grey pills.
  const showFieldPills = isEditMode && !isExpandedVariant
  const [editExpanded, setEditExpanded] = useState(false)
  const [editLayout, setEditLayout] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const [editBounds, setEditBounds] = useState<ExpandBounds | null>(null)
  const [editAnimReady, setEditAnimReady] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isCollapsingRef = useRef(false)
  const tableRootRef = useRef<HTMLDivElement>(null)
  const tableSpacerRef = useRef<HTMLDivElement>(null)
  const editBaseWidthRef = useRef<number | null>(null)
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(() => {
    if (initialPeriods) {
      return new Set(initialPeriods.map(p => p.id))
    }
    return new Set()
  })
  /** After "Add period", open this period's from-date picker once. */
  const [openStartDatePeriodId, setOpenStartDatePeriodId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    period: RampPeriod
    index: number
  } | null>(null)
  const pendingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enterEditMode = useCallback(() => {
    if (isEditMode) return
    const el = tableRootRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      const origin = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }
      setEditLayout(origin)
      editBaseWidthRef.current = rect.width
      // Edit-state lift needs page bounds for the blur/card animation.
      if (!isExpandedVariant) {
        setEditBounds(measureExpandBounds())
      }
    }
    setEditExpanded(false)
    setEditAnimReady(false)
    setIsCollapsing(false)
    isCollapsingRef.current = false
    setIsEditMode(true)
    onLiftedChange?.(true)
  }, [isEditMode, isExpandedVariant, onLiftedChange])

  /** Drops the table out of the fixed layer and back into the page flow. */
  const finishExitEditMode = useCallback(() => {
    collapseTimerRef.current = null
    isCollapsingRef.current = false
    setIsCollapsing(false)
    setIsEditMode(false)
    setEditExpanded(false)
    setEditAnimReady(false)
    setEditLayout(null)
    setEditBounds(null)
    editBaseWidthRef.current = null
    setActiveRowId(null)
    setHoveredRowId(null)
    onLiftedChange?.(false)
  }, [onLiftedChange])

  const exitEditMode = useCallback(() => {
    if (collapseTimerRef.current || isCollapsingRef.current) return
    if (!isEditMode || editBaseWidthRef.current == null) {
      finishExitEditMode()
      return
    }

    // Expanded-state: fade the full-page layer back out. Nothing inside it is
    // re-laid out, so the close plays as one continuous motion.
    if (isExpandedVariant) {
      setActiveRowId(null)
      setHoveredRowId(null)
      isCollapsingRef.current = true
      setIsCollapsing(true)
      setEditExpanded(false)
      collapseTimerRef.current = setTimeout(
        finishExitEditMode,
        FULLPAGE_COLLAPSE_SETTLE_MS
      )
      return
    }

    // Play the expansion in reverse first. Tearing down straight away would swap
    // the grid rows back to flex and the fixed shell back into the flow on the
    // same frame, which reads as a snap however smooth the opening was.
    setActiveRowId(null)
    setHoveredRowId(null)
    setIsCollapsing(true)
    setEditExpanded(false)
    collapseTimerRef.current = setTimeout(finishExitEditMode, COLLAPSE_SETTLE_MS)
  }, [isEditMode, isExpandedVariant, finishExitEditMode])

  // Expand / Shrink on the section header controls lift / full-page — never
  // auto-open on Expanded use case mount (default there is the sticky discount table).
  useEffect(() => {
    if (lifted === undefined) return
    if (lifted && !isEditMode) enterEditMode()
    if (!lifted && isEditMode) exitEditMode()
  }, [lifted, isEditMode, enterEditMode, exitEditMode])

  // Leaving the Expanded use case while open — drop the overlay.
  const wasExpandedVariantRef = useRef(isExpandedVariant)
  useEffect(() => {
    if (wasExpandedVariantRef.current && !isExpandedVariant && isEditMode) {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current)
        collapseTimerRef.current = null
      }
      finishExitEditMode()
    }
    wasExpandedVariantRef.current = isExpandedVariant
  }, [isExpandedVariant, isEditMode, finishExitEditMode])

  useEffect(() => {
    return () => {
      if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current)
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    }
  }, [])

  // Resolve layout before enabling the open tween (edit lift + full-page morph).
  // Expanded-state needs a painted origin frame first — otherwise the browser
  // skips straight to the end and the morph reads as a snap.
  useLayoutEffect(() => {
    if (!isEditMode || editBaseWidthRef.current == null) return
    void tableRootRef.current?.offsetWidth

    if (!isExpandedVariant) {
      setEditAnimReady(true)
      const frame = requestAnimationFrame(() => setEditExpanded(true))
      return () => cancelAnimationFrame(frame)
    }

    let frame2 = 0
    const frame1 = requestAnimationFrame(() => {
      setEditAnimReady(true)
      frame2 = requestAnimationFrame(() => setEditExpanded(true))
    })
    return () => {
      cancelAnimationFrame(frame1)
      cancelAnimationFrame(frame2)
    }
  }, [isEditMode, isExpandedVariant])

  // Edit-state only: keep the lifted card pinned as the page scrolls / resizes.
  useEffect(() => {
    if (isExpandedVariant || !isEditMode) return
    const syncPosition = () => {
      const spacer = tableSpacerRef.current
      if (!spacer) return
      setEditLayout((prev) =>
        prev ? { ...prev, top: spacer.getBoundingClientRect().top } : prev
      )
    }
    const syncBounds = () => {
      syncPosition()
      setEditBounds(measureExpandBounds())
    }
    syncPosition()
    window.addEventListener('resize', syncBounds)
    document.addEventListener('scroll', syncPosition, true)
    return () => {
      window.removeEventListener('resize', syncBounds)
      document.removeEventListener('scroll', syncPosition, true)
    }
  }, [isEditMode, isExpandedVariant])

  useEffect(() => {
    if (!isEditMode) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exitEditMode()
    }
    // Outside-click dismiss is Edit-state only — full page covers the viewport.
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (isExpandedVariant) return
      if (!tableRootRef.current?.contains(event.target as Node)) {
        exitEditMode()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isEditMode, isExpandedVariant, exitEditMode])

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
    [editHistory, periods]
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

  /** Catalog pick from "Add line item" — lands as a ready row on sensible defaults. */
  const handleAddCatalogItem = (catalogItem: CatalogLineItem, periodId?: string) => {
    const quantity = '01'
    const newLineItem: ProductLineItem = {
      id: `li-new-${Date.now()}`,
      name: catalogItem.name,
      status: 'ready',
      billingPeriod: catalogItem.billingPeriod,
      quantity,
      unitPrice: catalogItem.unitPrice,
      discount: '',
      discountUnit: '%',
      discountPeriod: 'None',
      totalPrice: computeTotalPrice(catalogItem.unitPrice, quantity) ?? catalogItem.unitPrice,
    }

    recordProductEdit(editHistory, newLineItem.id, 'Item', '', catalogItem.name)

    if (periodId && periods) {
      setPeriods((prev) =>
        prev?.map((p) =>
          p.id === periodId ? { ...p, items: [...p.items, newLineItem] } : p
        )
      )
    } else {
      setItems((prev) => [...prev, newLineItem])
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

  // Proportional weights so every column grows with the container (no separate width tween).
  // minmax(0, Nfr) is required — plain Nfr uses min-width:auto and overflows mid-animation.
  const baseWidth = editBaseWidthRef.current ?? editLayout?.width ?? 720
  const expandMaxWidth = editBounds?.maxWidth ?? baseWidth * EXPAND_RATIO
  // The item column takes whatever the inline flex row leaves it, so at base width
  // the fr tracks resolve to exactly the flex widths. Without that the columns jump
  // sideways the moment the row swaps between the two layouts.
  const itemColWeight = Math.max(
    160,
    Math.round(
      baseWidth -
        ROW_PAD_X -
        SEPARATOR_W * 3 -
        (PERIOD_W + QTY_W + UNIT_W + DISCOUNT_W + DISCOUNT_PERIOD_W + TOTAL_W + MENU_W)
    )
  )
  const editRowGridStyle = isEditMode
    ? {
        display: 'grid' as const,
        // Mirrors the flex row track for track, then adds Discount and its period
        // between unit and total — edit-only, so the expanded width absorbs them.
        // Tracks: item | frequency | rule | qty | rule | unit | discount |
        // discount period | rule | total | menu. Rules stay fixed; value columns
        // share the extra space. No rule before Frequency.
        gridTemplateColumns: [
          `minmax(0, ${itemColWeight}fr)`,
          `minmax(0, ${PERIOD_W}fr)`,
          `${SEPARATOR_W}px`,
          `minmax(0, ${QTY_W}fr)`,
          `${SEPARATOR_W}px`,
          `minmax(0, ${UNIT_W}fr)`,
          `minmax(0, ${DISCOUNT_W}fr)`,
          `minmax(0, ${DISCOUNT_PERIOD_W}fr)`,
          `${SEPARATOR_W}px`,
          `minmax(0, ${TOTAL_W}fr)`,
          `minmax(0, ${MENU_W}fr)`,
        ].join(' '),
        columnGap: 0,
        alignItems: 'center' as const,
        width: '100%',
        minWidth: 0,
      }
    : undefined

  const renderTableHeader = () => (
    <div
      className={cn(
        'items-center border-b border-neutral-200 pb-2 pl-1 pr-2',
        !isEditMode && 'flex'
      )}
      style={editRowGridStyle}
    >
      <div
        className={cn(
          'min-w-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          // Matches the row's item cell, which grows — without it every label
          // downstream sits left of the column it names.
          !isEditMode && 'flex-1'
        )}
      >
        Item
      </div>
      <div
        style={isEditMode ? undefined : { width: PERIOD_W }}
        className={cn(
          'pl-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Frequency
      </div>
      <GhostSeparator />
      <div
        style={isEditMode ? undefined : { width: QTY_W }}
        className={cn(
          'text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Qty
      </div>
      <GhostSeparator />
      <div
        style={isEditMode ? undefined : { width: UNIT_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Unit price
      </div>
      {isEditMode ? (
        <>
          <div className="pl-3 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Discount
          </div>
          <div className="pl-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Discount period
          </div>
        </>
      ) : null}
      <GhostSeparator />
      <div
        style={isEditMode ? undefined : { width: TOTAL_INLINE_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Total price
      </div>
      <div
        style={isEditMode ? undefined : { width: MENU_W }}
        className={cn(!isEditMode && 'shrink-0')}
      />
    </div>
  )

  // Expanded ramp period header — merges the period identity into the table
  // header row (the period label replaces the "Item" column label).
  const renderPeriodTableHeader = (
    period: RampPeriod,
    onToggle: () => void,
    onDelete: () => void
  ) => (
    <div
      className={cn(
        'items-center border-b border-neutral-200 pb-2 pl-1 pr-2',
        !isEditMode && 'flex'
      )}
      style={editRowGridStyle}
    >
      <div className={cn('flex min-w-0 items-center', !isEditMode && 'flex-1')}>
        <PeriodChevron isExpanded onToggle={onToggle} />
        <PeriodIdentity
          period={period}
          onChangeDates={(dates) => updatePeriodDates(period.id, dates)}
          autoOpenStartDate={openStartDatePeriodId === period.id}
          onStartDatePickerClose={() => {
            if (openStartDatePeriodId === period.id) setOpenStartDatePeriodId(null)
          }}
        />
      </div>
      <div
        style={isEditMode ? undefined : { width: PERIOD_W }}
        className={cn(
          'pl-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Frequency
      </div>
      <GhostSeparator />
      <div
        style={isEditMode ? undefined : { width: QTY_W }}
        className={cn(
          'text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Qty
      </div>
      <GhostSeparator />
      <div
        style={isEditMode ? undefined : { width: UNIT_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Unit price
      </div>
      {isEditMode ? (
        <>
          <div className="pl-3 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Discount
          </div>
          <div className="pl-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Discount period
          </div>
        </>
      ) : null}
      <GhostSeparator />
      <div
        style={isEditMode ? undefined : { width: TOTAL_INLINE_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Total price
      </div>
      <div
        className={cn('flex items-center justify-end', !isEditMode && 'shrink-0')}
        style={isEditMode ? undefined : { width: MENU_W }}
      >
        <PeriodOptionsMenu onDelete={onDelete} />
      </div>
    </div>
  )

  // Expanded-state header — Item is pinned (sticky) and Discount / Discount
  // period sit inline as their own columns alongside the rest, which scroll
  // together as one group when they don't fit. Full-page uses a proportional
  // grid so every column grows with the viewport.
  const isFullPageExpanded = isExpandedVariant && isEditMode
  const expandedFullPageGridStyle = isFullPageExpanded
    ? {
        display: 'grid' as const,
        // Tracks: item | frequency | rule | qty | rule | unit | rule |
        // discount | rule | discount period | rule | total | menu
        gridTemplateColumns: [
          `minmax(0, ${EXPANDED_ITEM_W}fr)`,
          `minmax(0, ${PERIOD_W}fr)`,
          `${SEPARATOR_W}px`,
          `minmax(0, ${QTY_W}fr)`,
          `${SEPARATOR_W}px`,
          `minmax(0, ${UNIT_W}fr)`,
          `${SEPARATOR_W}px`,
          `minmax(0, ${DISCOUNT_W}fr)`,
          `${SEPARATOR_W}px`,
          `minmax(0, ${DISCOUNT_PERIOD_W}fr)`,
          `${SEPARATOR_W}px`,
          `minmax(0, ${TOTAL_W}fr)`,
          `minmax(0, ${MENU_W}fr)`,
        ].join(' '),
        columnGap: 0,
        alignItems: 'center' as const,
        width: '100%',
        minWidth: 0,
      }
    : undefined

  const renderExpandedTableHeader = () => (
    <div
      className={cn(
        'items-center border-b border-neutral-200 pb-2 pl-1 pr-2',
        !isFullPageExpanded && 'flex'
      )}
      style={expandedFullPageGridStyle}
    >
      <div
        style={isFullPageExpanded ? undefined : { width: EXPANDED_ITEM_W }}
        className={cn(
          'sticky left-0 z-10 truncate bg-white text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0',
          isFullPageExpanded && 'min-w-0'
        )}
      >
        Item
      </div>
      <div
        style={isFullPageExpanded ? undefined : { width: PERIOD_W }}
        className={cn(
          'pl-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Frequency
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: QTY_W }}
        className={cn(
          'text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Qty
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: UNIT_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Unit price
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: DISCOUNT_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Discount
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: DISCOUNT_PERIOD_W }}
        className={cn(
          'text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Discount period
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: TOTAL_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Total price
      </div>
      <div
        style={isFullPageExpanded ? undefined : { width: MENU_W }}
        className={cn(
          'sticky right-0 z-10 bg-white',
          !isFullPageExpanded && 'shrink-0'
        )}
      />
    </div>
  )

  // Expanded-state ramp period header — mirrors renderExpandedTableHeader but
  // swaps the "Item" label for the period identity, same as the edit-grid version.
  const renderExpandedPeriodTableHeader = (
    period: RampPeriod,
    onToggle: () => void,
    onDelete: () => void
  ) => (
    <div
      className={cn(
        'items-center border-b border-neutral-200 pb-2 pl-1 pr-2',
        !isFullPageExpanded && 'flex'
      )}
      style={expandedFullPageGridStyle}
    >
      <div
        style={isFullPageExpanded ? undefined : { width: EXPANDED_ITEM_W }}
        className={cn(
          'sticky left-0 z-10 flex min-w-0 items-center overflow-hidden bg-white',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        <PeriodChevron isExpanded onToggle={onToggle} hangIcon={false} />
        <PeriodIdentity
          period={period}
          onChangeDates={(dates) => updatePeriodDates(period.id, dates)}
          autoOpenStartDate={openStartDatePeriodId === period.id}
          onStartDatePickerClose={() => {
            if (openStartDatePeriodId === period.id) setOpenStartDatePeriodId(null)
          }}
        />
      </div>
      <div
        style={isFullPageExpanded ? undefined : { width: PERIOD_W }}
        className={cn(
          'pl-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Frequency
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: QTY_W }}
        className={cn(
          'text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Qty
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: UNIT_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Unit price
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: DISCOUNT_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Discount
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: DISCOUNT_PERIOD_W }}
        className={cn(
          'text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Discount period
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: TOTAL_W }}
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Total price
      </div>
      <div
        style={isFullPageExpanded ? undefined : { width: MENU_W }}
        className={cn(
          'sticky right-0 z-10 flex items-center justify-end bg-white',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        <PeriodOptionsMenu onDelete={onDelete} />
      </div>
    </div>
  )

  // Expanded-state row — Discount / Discount period are always visible as
  // plain columns. Item is pinned left and the ellipsis menu is pinned right.
  // Cells open their own menus in place — no lifted edit surface.
  const renderExpandedLineItem = (
    item: ProductLineItem,
    updateItems: (updater: (prev: ProductLineItem[]) => ProductLineItem[]) => void
  ) => {
    const isAttention = item.status === 'attention'
    const hasDiscount = parseFloat(item.discount ?? '') > 0
    const isEdited =
      !!editHistory?.isFieldEdited(PRODUCTS_SECTION_ID, productFieldLabel(item.id, 'Item')) ||
      !!editHistory?.isFieldEdited(PRODUCTS_SECTION_ID, productFieldLabel(item.id, 'Unit price'))
    const quantityOptions = QUANTITY_OPTIONS.includes(item.quantity)
      ? QUANTITY_OPTIONS
      : [item.quantity, ...QUANTITY_OPTIONS]

    return (
      <div
        key={item.id}
        className={cn(
          'group row-hover-trail items-center border-b border-neutral-100 py-1.5 pl-1 pr-2',
          !isFullPageExpanded && 'flex',
          isEdited && 'bg-amber-50',
          // Lift the whole row while the item picker is open so the absolute
          // popover isn't painted under later sticky cells / row content.
          activeRowId === item.id && 'relative z-40'
        )}
        style={expandedFullPageGridStyle}
      >
        {/* Item — pinned to the left of the scrollable group */}
        <div
          style={isFullPageExpanded ? undefined : { width: EXPANDED_ITEM_W }}
          className={cn(
            'sticky left-0 min-w-0',
            !isFullPageExpanded && 'shrink-0',
            activeRowId === item.id ? 'z-40' : 'z-10',
            isEdited ? 'bg-amber-50' : 'bg-white'
          )}
        >
          <ItemNameButton
            name={item.name}
            isAttention={isAttention}
            isEdited={isEdited}
            hangIcon={false}
            openRequestId={lineItemEditRequest[item.id]}
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
            onOpenChange={(isOpen) => {
              setActiveRowId(isOpen ? item.id : null)
            }}
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
                    ? {
                        ...i,
                        name: catalogItem.name,
                        unitPrice: catalogItem.unitPrice,
                        totalPrice:
                          computeTotalPrice(catalogItem.unitPrice, i.quantity) ?? i.totalPrice,
                        status: 'ready',
                      }
                    : i
                )
              )
              setActiveRowId(null)
            }}
          />
        </div>

        <div
          className={cn('min-w-0 pl-3', !isFullPageExpanded && 'shrink-0')}
          style={isFullPageExpanded ? undefined : { width: PERIOD_W }}
        >
          <InteractiveMiniDropdown
            label={item.billingPeriod}
            options={BILLING_PERIODS}
            ariaLabel={`Frequency for ${item.name}`}
            onSelect={(next) => {
              recordProductEdit(editHistory, item.id, 'Frequency', item.billingPeriod, next)
              updateItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, billingPeriod: next } : i))
              )
            }}
          />
        </div>
        <Separator />
        <InteractiveMiniDropdown
          label={item.quantity}
          width={isFullPageExpanded ? undefined : QTY_W}
          options={quantityOptions}
          ariaLabel={`Quantity for ${item.name}`}
          onSelect={(next) => {
            recordProductEdit(editHistory, item.id, 'Qty', item.quantity, next)
            updateItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      quantity: next,
                      totalPrice: computeTotalPrice(i.unitPrice, next) ?? i.totalPrice,
                    }
                  : i
              )
            )
          }}
        />
        <Separator />

        <div
          style={isFullPageExpanded ? undefined : { width: UNIT_W }}
          className={cn(
            'flex min-w-0 flex-col items-end gap-0.5 pl-3',
            !isFullPageExpanded && 'shrink-0'
          )}
        >
          <div className="flex w-full items-center justify-end gap-2">
            {item.rampPriceChange && (
              <RampPriceChangeBadge change={item.rampPriceChange} />
            )}
            <span className="text-right text-[14px] font-medium text-brand-navy">
              {item.unitPrice}
            </span>
          </div>
        </div>

        <Separator />
        <div
          style={isFullPageExpanded ? undefined : { width: DISCOUNT_W }}
          className={cn(
            'min-w-0 text-right text-[14px] font-medium',
            !isFullPageExpanded && 'shrink-0',
            hasDiscount ? 'text-brand-navy' : 'text-brand-mist'
          )}
        >
          {formatDiscount(item.discount, item.discountUnit)}
        </div>
        <Separator />
        <div
          style={isFullPageExpanded ? undefined : { width: DISCOUNT_PERIOD_W }}
          className={cn('min-w-0', !isFullPageExpanded && 'shrink-0')}
        >
          <InteractiveMiniDropdown
            label={hasDiscount ? (item.discountPeriod ?? 'None') : '–'}
            options={DISCOUNT_PERIODS.filter((period) => period !== 'None')}
            ariaLabel={`Discount period for ${item.name}`}
            disabled={!hasDiscount}
            limitedPeriodOption={LIMITED_PERIOD_OPTION}
            onSelect={(next) => {
              recordProductEdit(
                editHistory,
                item.id,
                'Discount period',
                item.discountPeriod ?? 'None',
                next
              )
              updateItems((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, discountPeriod: next as DiscountPeriod } : i
                )
              )
            }}
          />
        </div>

        <Separator />
        <div
          style={isFullPageExpanded ? undefined : { width: TOTAL_W }}
          className={cn(
            'min-w-0 text-right text-[14px] font-medium text-brand-navy',
            !isFullPageExpanded && 'shrink-0'
          )}
        >
          {item.totalPrice}
        </div>

        {/* Ellipsis menu — pinned to the right of the scrollable group */}
        <div
          style={isFullPageExpanded ? undefined : { width: MENU_W }}
          className={cn(
            'sticky right-0 z-10 flex items-center justify-end',
            !isFullPageExpanded && 'shrink-0',
            isEdited ? 'bg-amber-50' : 'bg-white'
          )}
        >
          <LineItemOptionsMenu
            itemName={item.name}
            onDelete={() => {
              recordProductEdit(editHistory, item.id, 'Item', item.name, 'Deleted')
              updateItems((prev) => prev.filter((i) => i.id !== item.id))
              if (activeRowId === item.id) setActiveRowId(null)
            }}
          />
        </div>
      </div>
    )
  }

  const renderLineItem = (item: ProductLineItem, updateItems: (updater: (prev: ProductLineItem[]) => ProductLineItem[]) => void) => {
    const isAttention = item.status === 'attention'
    const isActive = activeRowId === item.id
    const isHovered = hoveredRowId === item.id
    // The lifted table already marks every cell as editable, so the navy row fill
    // would only add noise — it stays behind for the inline table.
    const isRowFilled = !isEditMode && (isActive || isHovered)
    const hasDiscount = parseFloat(item.discount ?? '') > 0
    const isEdited =
      !!editHistory?.isFieldEdited(PRODUCTS_SECTION_ID, productFieldLabel(item.id, 'Item')) ||
      !!editHistory?.isFieldEdited(PRODUCTS_SECTION_ID, productFieldLabel(item.id, 'Unit price'))
    
    return (
      <div
        key={item.id}
        onMouseEnter={() => setHoveredRowId(item.id)}
        onMouseLeave={() => setHoveredRowId(null)}
        onClick={() => enterEditMode()}
        className={cn(
          'group row-hover-trail items-center border-b py-1.5 pl-1 pr-2 transition-colors',
          !isEditMode && 'flex',
          isEditMode
            ? cn(
                showFieldPills && 'rounded-lg',
                'border-neutral-100',
                isEdited && 'bg-amber-50'
              )
            : isActive
              ? 'bg-brand-navy border-brand-navy cursor-pointer'
              : cn(
                  'border-neutral-100 cursor-pointer hover:bg-brand-navy hover:border-brand-navy',
                  isEdited && 'bg-amber-50'
                )
        )}
        style={editRowGridStyle}
      >
        {/* Item */}
        <ItemNameButton
          name={item.name}
          isAttention={isAttention}
          isRowHovered={isRowFilled && !isActive}
          isRowActive={isRowFilled && isActive}
          isEdited={isEdited}
          openRequestId={lineItemEditRequest[item.id]}
          asField={showFieldPills}
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
          onOpenChange={(isOpen) => {
            setActiveRowId(isOpen ? item.id : null)
            if (isOpen) enterEditMode()
          }}
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

        <div
          className={cn('pl-3', !isEditMode && 'shrink-0')}
          style={isEditMode ? undefined : { width: PERIOD_W }}
        >
          {isExpandedVariant && isEditMode ? (
            <InteractiveMiniDropdown
              label={item.billingPeriod}
              options={BILLING_PERIODS}
              ariaLabel={`Frequency for ${item.name}`}
              onSelect={(next) => {
                recordProductEdit(editHistory, item.id, 'Frequency', item.billingPeriod, next)
                updateItems((prev) =>
                  prev.map((i) => (i.id === item.id ? { ...i, billingPeriod: next } : i))
                )
              }}
            />
          ) : (
            <MiniDropdown
              label={item.billingPeriod}
              isRowHovered={isRowFilled}
              isRowActive={isRowFilled}
              asField={showFieldPills}
            />
          )}
        </div>
        <Separator isRowHovered={isRowFilled} isRowActive={isRowFilled} hideLine={showFieldPills} />
        {isExpandedVariant && isEditMode ? (
          <InteractiveMiniDropdown
            label={item.quantity}
            options={
              QUANTITY_OPTIONS.includes(item.quantity)
                ? QUANTITY_OPTIONS
                : [item.quantity, ...QUANTITY_OPTIONS]
            }
            ariaLabel={`Quantity for ${item.name}`}
            onSelect={(next) => {
              recordProductEdit(editHistory, item.id, 'Qty', item.quantity, next)
              updateItems((prev) =>
                prev.map((i) =>
                  i.id === item.id
                    ? {
                        ...i,
                        quantity: next,
                        totalPrice: computeTotalPrice(i.unitPrice, next) ?? i.totalPrice,
                      }
                    : i
                )
              )
            }}
          />
        ) : (
          <MiniDropdown
            label={item.quantity}
            width={isEditMode ? undefined : QTY_W}
            isRowHovered={isRowFilled}
            isRowActive={isRowFilled}
            asField={showFieldPills}
          />
        )}
        <Separator isRowHovered={isRowFilled} isRowActive={isRowFilled} hideLine={showFieldPills} />

        <div
          style={isEditMode ? undefined : { width: UNIT_W }}
          className={cn(
            'flex flex-col items-end gap-0.5 pl-3',
            !isEditMode && 'shrink-0'
          )}
        >
          <div className="flex w-full items-center justify-end gap-2">
            {item.rampPriceChange && !(isRowFilled && isActive) && (
              <RampPriceChangeBadge change={item.rampPriceChange} />
            )}
            {isEditMode ? (
              <PriceField
                value={item.unitPrice}
                ariaLabel={`Unit price for ${item.name}`}
                plain={!showFieldPills}
                onCommit={(nextPrice) => {
                  recordProductEdit(editHistory, item.id, 'Unit price', item.unitPrice, nextPrice)
                  updateItems((prev) =>
                    prev.map((i) =>
                      i.id === item.id
                        ? {
                            ...i,
                            unitPrice: nextPrice,
                            totalPrice: computeTotalPrice(nextPrice, i.quantity) ?? i.totalPrice,
                          }
                        : i
                    )
                  )
                }}
              />
            ) : (
              <span
                className={cn(
                  'text-right text-[14px] font-medium transition-colors',
                  isRowFilled ? 'text-white' : 'text-brand-navy'
                )}
              >
                {item.unitPrice}
              </span>
            )}
          </div>
        </div>
        {isEditMode ? (
          <DiscountField
            value={item.discount ?? ''}
            unit={item.discountUnit ?? '%'}
            plain={!showFieldPills}
            onChange={({ value, unit }) => {
              recordProductEdit(
                editHistory,
                item.id,
                'Discount',
                formatDiscount(item.discount, item.discountUnit),
                formatDiscount(value, unit)
              )
              updateItems((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, discount: value, discountUnit: unit } : i
                )
              )
            }}
          />
        ) : null}
        {isEditMode ? (
          <SelectField
            value={hasDiscount ? (item.discountPeriod ?? 'None') : 'None'}
            options={DISCOUNT_PERIODS.filter((period) => period !== 'None')}
            ariaLabel={`Discount period for ${item.name}`}
            disabled={!hasDiscount}
            plain={!showFieldPills}
            limitedPeriodOption={LIMITED_PERIOD_OPTION}
            onChange={(next) => {
              recordProductEdit(
                editHistory,
                item.id,
                'Discount period',
                item.discountPeriod ?? 'None',
                next
              )
              updateItems((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, discountPeriod: next as DiscountPeriod } : i
                )
              )
            }}
          />
        ) : null}
        <Separator isRowHovered={isRowFilled} isRowActive={isRowFilled} hideLine={showFieldPills} />
        <div
          style={isEditMode ? undefined : { width: TOTAL_INLINE_W }}
          className={cn(
            'text-right text-[14px] font-medium transition-colors',
            !isEditMode && 'flex shrink-0 items-center justify-end gap-1.5',
            isRowFilled ? 'text-white' : 'text-brand-navy'
          )}
        >
          {!isEditMode && hasDiscount && (
            <DiscountBadge
              isRowFilled={isRowFilled}
              discount={item.discount}
              discountUnit={item.discountUnit}
              discountPeriod={item.discountPeriod}
              baseAmount={item.totalPrice}
            />
          )}
          {item.totalPrice}
        </div>

        <div
          className={cn('flex items-center justify-end gap-0.5', !isEditMode && 'shrink-0')}
          style={isEditMode ? undefined : { width: MENU_W }}
        >
          {isExpandedVariant ? (
            <LineItemOptionsMenu
              itemName={item.name}
              onDelete={() => {
                recordProductEdit(editHistory, item.id, 'Item', item.name, 'Deleted')
                updateItems((prev) => prev.filter((i) => i.id !== item.id))
                if (activeRowId === item.id) setActiveRowId(null)
                if (hoveredRowId === item.id) setHoveredRowId(null)
              }}
            />
          ) : (
            <>
              {/* Redundant once the row is lifted — every cell is already an input. */}
              {!isEditMode && (
                <button
                  type="button"
                  aria-label={`Edit ${item.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    enterEditMode()
                    setLineItemEditRequest((prev) => ({
                      ...prev,
                      [item.id]: (prev[item.id] ?? 0) + 1,
                    }))
                  }}
                  className={cn(
                    'flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-all',
                    isRowFilled
                      ? 'opacity-100 text-white/80 hover:bg-white/15 hover:text-white'
                      : 'opacity-0 pointer-events-none'
                  )}
                >
                  <Pencil size={14} strokeWidth={1.75} />
                </button>
              )}
              <button
                type="button"
                aria-label={`Delete ${item.name}`}
                onClick={(e) => {
                  e.stopPropagation()
                  recordProductEdit(editHistory, item.id, 'Item', item.name, 'Deleted')
                  updateItems((prev) => prev.filter((i) => i.id !== item.id))
                  if (activeRowId === item.id) setActiveRowId(null)
                  if (hoveredRowId === item.id) setHoveredRowId(null)
                }}
                className={cn(
                  'flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-all',
                  isEditMode
                    ? 'text-brand-mist hover:bg-neutral-100 hover:text-brand-navy'
                    : isRowFilled
                      ? 'opacity-100 text-white/80 hover:bg-white/15 hover:text-white'
                      : 'opacity-0 pointer-events-none'
                )}
              >
                <Trash size={14} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  const wrapTableShell = (content: ReactNode) => {
    const isOverlayOpen = isEditMode && editLayout != null

    // Expanded-state full page. The layer is laid out at its final size from the
    // first frame and only opacity/scale animate, so open and close are one
    // uninterrupted motion in both directions.
    if (isExpandedVariant) {
      const isFull = isOverlayOpen && editExpanded
      const timing = isCollapsing ? FULLPAGE_COLLAPSE_TRANSITION : FULLPAGE_EXPAND_TRANSITION

      return (
        <div className="overflow-visible pl-6">
          {isOverlayOpen ? (
            <div
              ref={tableSpacerRef}
              style={{ height: editLayout.height }}
              aria-hidden
            />
          ) : null}
          {/* Page veil — hides the page behind the panel as it resolves. */}
          {isOverlayOpen ? (
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 z-[55] bg-white"
              style={{
                opacity: isFull ? 1 : 0,
                transition: editAnimReady ? `opacity ${timing}` : 'none',
              }}
            />
          ) : null}
          <div
            ref={tableRootRef}
            className={cn(
              'bg-white',
              isOverlayOpen
                ? cn(
                    'fixed inset-0 z-[60] flex flex-col',
                    isFull ? 'overflow-y-auto' : 'overflow-hidden'
                  )
                : 'relative z-0 w-full'
            )}
            style={
              isOverlayOpen
                ? {
                    padding: `${FULLPAGE_PAD_TOP}px ${FULLPAGE_PAD_X}px ${FULLPAGE_PAD_BOTTOM}px`,
                    transformOrigin: 'center top',
                    opacity: isFull ? 1 : 0,
                    transform: isFull ? 'scale(1)' : `scale(${FULLPAGE_REST_SCALE})`,
                    transition: editAnimReady
                      ? `opacity ${timing}, transform ${timing}`
                      : 'none',
                    willChange: 'opacity, transform',
                    pointerEvents: isCollapsing ? 'none' : undefined,
                  }
                : undefined
            }
          >
            {isOverlayOpen ? (
              <div className="flex shrink-0 items-start justify-between gap-4" style={{ marginBottom: fullPageTitle ? 24 : 0 }}>
                {fullPageTitle ? (
                  <h1
                    className="font-heading min-w-0 text-[18px] font-semibold text-brand-navy"
                    style={{ letterSpacing: '-0.5px' }}
                  >
                    {fullPageTitle}
                  </h1>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={exitEditMode}
                  aria-label="Collapse full page view"
                  title="Collapse"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
                >
                  <Minimize2 size={18} strokeWidth={2} />
                </button>
              </div>
            ) : null}
            {header ? (
              <div className={cn('mb-6', !isOverlayOpen && '-ml-6')}>{header}</div>
            ) : null}
            <div className={cn(isOverlayOpen && 'min-w-0')}>{content}</div>
          </div>
        </div>
      )
    }

    // Edit-state: original lifted blur card.
    const isFixedEditing = isOverlayOpen
    const baseW = editBaseWidthRef.current ?? editLayout?.width ?? 0
    const contentWidth = isFixedEditing
      ? editExpanded
        ? Math.max(baseW, expandMaxWidth - SHELL_PAD_X * 2)
        : baseW
      : 0
    const displayWidth = isFixedEditing ? contentWidth + SHELL_PAD_X * 2 : undefined
    const displayCenterX = isFixedEditing
      ? editExpanded
        ? editBounds?.centerX ?? editLayout.left + baseW / 2
        : editLayout.left + baseW / 2
      : undefined
    const timing = isCollapsing ? COLLAPSE_TRANSITION : EXPAND_TRANSITION

    return (
      <div className="overflow-visible pl-6">
        {isFixedEditing ? (
          <div
            ref={tableSpacerRef}
            style={{ height: editLayout.height }}
            aria-hidden
          />
        ) : null}
        {isFixedEditing ? (
          <div
            aria-hidden
            className="pointer-events-none fixed z-[45]"
            style={{
              top: editLayout.top - HALO_SPREAD_Y,
              left: displayCenterX,
              width: (displayWidth ?? 0) + HALO_SPREAD_X * 2,
              height: editLayout.height + HALO_SPREAD_Y * 2,
              transform: 'translateX(-50%)',
              opacity: editExpanded ? 1 : 0,
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              background:
                'radial-gradient(ellipse at center, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 100%)',
              maskImage:
                'radial-gradient(ellipse at center, #000 0%, #000 48%, rgba(0,0,0,0.55) 70%, transparent 100%)',
              WebkitMaskImage:
                'radial-gradient(ellipse at center, #000 0%, #000 48%, rgba(0,0,0,0.55) 70%, transparent 100%)',
              transition: editAnimReady
                ? `width ${timing}, left ${timing}, opacity ${timing}`
                : 'none',
            }}
          />
        ) : null}
        <div
          ref={tableRootRef}
          className={cn(
            'bg-white',
            isFixedEditing ? 'fixed z-[60]' : 'relative z-0 w-full'
          )}
          style={
            isFixedEditing
              ? {
                  top: editLayout.top - SHELL_PAD_Y,
                  left: displayCenterX,
                  width: displayWidth,
                  transform: 'translateX(-50%)',
                  borderRadius: 20,
                  padding: `${SHELL_PAD_Y}px ${SHELL_PAD_X}px`,
                  boxShadow: editExpanded
                    ? '0 0 48px 24px rgba(255,255,255,0.9), 0 28px 68px -36px rgba(28,27,46,0.26)'
                    : '0 0 0 0 rgba(255,255,255,0)',
                  transition: editAnimReady
                    ? `width ${timing}, left ${timing}, box-shadow ${timing}`
                    : 'none',
                  willChange: 'width, left',
                  pointerEvents: isCollapsing ? 'none' : undefined,
                }
              : undefined
          }
        >
          {header ? <div className="-ml-6 mb-6">{header}</div> : null}
          {content}
        </div>
      </div>
    )
  }

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
    setOpenStartDatePeriodId(newPeriod.id)

    const dateRange = `${added.startDate} to ${added.endDate}`
    const addValue =
      renumberNotes.length > 0 ? `Added|${renumberNotes.join('. ')}` : 'Added'
    recordProductEdit(editHistory, added.id, added.label, dateRange, addValue)
  }

  // Render with periods (ramp view)
  if (periods && (periods.length > 0 || pendingDelete)) {
    const slotCount = periods.length + (pendingDelete ? 1 : 0)
    let periodCursor = 0

    return wrapTableShell(
      <>
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
          const updatePeriodItems = (updater: (prev: ProductLineItem[]) => ProductLineItem[]) => {
            setPeriods(prev => prev?.map(p =>
              p.id === period.id
                ? { ...p, items: updater(p.items) }
                : p
            ))
          }

          return (
            <div key={period.id} style={{ marginBottom }}>
              {isExpandedVariant ? (
                <ExpandedScrollContainer
                  pauseShadow={isEditMode && (!editExpanded || isCollapsing)}
                  fullWidth={isEditMode}
                >
                  {renderExpandedPeriodTableHeader(
                    period,
                    () => togglePeriod(period.id),
                    () => handleDeletePeriod(period, periodIndexInList)
                  )}
                  {period.items.map((item) => renderExpandedLineItem(item, updatePeriodItems))}
                </ExpandedScrollContainer>
              ) : (
                <>
                  {renderPeriodTableHeader(
                    period,
                    () => togglePeriod(period.id),
                    () => handleDeletePeriod(period, periodIndexInList)
                  )}
                  {period.items.map((item) => renderLineItem(item, updatePeriodItems))}
                </>
              )}

              <AddLineItemButton
                onSelect={(catalogItem) => handleAddCatalogItem(catalogItem, period.id)}
              />
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
      </>
    )
  }

  // Default single-table view (backward compatible)
  return wrapTableShell(
    <>
      {isExpandedVariant ? (
        <ExpandedScrollContainer
          pauseShadow={isEditMode && (!editExpanded || isCollapsing)}
          fullWidth={isEditMode}
        >
          {renderExpandedTableHeader()}
          {items.map((item) => renderExpandedLineItem(item, setItems))}
        </ExpandedScrollContainer>
      ) : (
        <>
          {renderTableHeader()}
          {items.map((item) => renderLineItem(item, setItems))}
        </>
      )}

      <AddLineItemButton onSelect={(catalogItem) => handleAddCatalogItem(catalogItem)} />
    </>
  )
}

export default ProductsPricingTable
