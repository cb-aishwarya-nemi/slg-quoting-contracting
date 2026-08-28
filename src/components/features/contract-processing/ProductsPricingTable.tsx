import { useState, useRef, useEffect, useLayoutEffect, useCallback, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
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

function isProductFieldEdited(
  editHistory: ReturnType<typeof useOptionalFieldEditHistory>,
  itemId: string,
  field: string
) {
  return !!editHistory?.isFieldEdited(PRODUCTS_SECTION_ID, productFieldLabel(itemId, field))
}

/** Cell shell — vertical padding lives here unless the cell is edited. */
const CELL_BOX = 'relative flex min-h-0 items-center self-stretch'
const CELL_PAD_Y = 'py-1.5'
/** Half of the separator track on each side of the 1px rule (`mx-3` ≡ 12px). */
const SEPARATOR_GUTTER_PX = 12
/** A separator's gutters plus its 1px rule. */
const SEPARATOR_W = SEPARATOR_GUTTER_PX * 2 + 1

/**
 * Row rules live on the row box itself so sticky opaque cells can't paint over
 * them. The row must be content-wide (the expanded scroller's inner track is
 * `w-max`) — a viewport-wide row leaves Total/menu outside the stroke.
 */
const ROW_STROKE = 'border-b border-neutral-100'
const HEADER_STROKE = 'border-b border-neutral-200'

/** Cell chrome. Edited cells drop py so amber is flush to the row stroke. */
function cellChrome(isEdited?: boolean, ...extra: Array<string | false | null | undefined>) {
  return cn(CELL_BOX, isEdited ? 'py-0' : CELL_PAD_Y, ...extra)
}

/**
 * Inline/edit cells keep the parent row `border-b`; only the vertical pad
 * collapses when amber is showing so the fill meets the stroke.
 */
function cellBoxPad(isEdited?: boolean, ...extra: Array<string | false | null | undefined>) {
  return cn(CELL_BOX, isEdited ? 'py-0' : CELL_PAD_Y, ...extra)
}

/** Inner content pad — restores the py that edited cells removed from the shell. */
function cellInner(isEdited?: boolean, ...extra: Array<string | false | null | undefined>) {
  return cn('relative z-[1]', isEdited && CELL_PAD_Y, ...extra)
}

/**
 * Amber fill clipped to the cell box. Gutter bridges to the column rule are
 * painted by `Separator` (`fillStart` / `fillEnd`) so nothing overflows the
 * horizontal scroller and nothing gets clipped.
 */
function EditedCellFill() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 bg-amber-50"
    />
  )
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
  /** Paint the left gutter amber when the preceding cell is edited. */
  fillStart,
  /** Paint the right gutter amber when the following cell is edited. */
  fillEnd,
}: {
  isRowHovered?: boolean
  isRowActive?: boolean
  alignTop?: boolean
  /** Keeps the column gap but drops the rule — the lifted table runs without them. */
  hideLine?: boolean
  fillStart?: boolean
  fillEnd?: boolean
}) {
  const lineColor = hideLine
    ? 'bg-transparent'
    : (isRowActive || isRowHovered) ? 'bg-white/20' : 'bg-neutral-200'

  return (
    <div
      className={cn(
        'flex shrink-0 self-stretch',
        alignTop && 'mt-1 h-4 self-start'
      )}
      style={{ width: SEPARATOR_W }}
    >
      <div
        className={cn('self-stretch', fillStart && !isRowHovered && !isRowActive && 'bg-amber-50')}
        style={{ width: SEPARATOR_GUTTER_PX }}
      />
      <div className={cn('w-px shrink-0 self-stretch transition-colors', lineColor)} />
      <div
        className={cn('self-stretch', fillEnd && !isRowHovered && !isRowActive && 'bg-amber-50')}
        style={{ width: SEPARATOR_GUTTER_PX }}
      />
    </div>
  )
}

function GhostSeparator() {
  return <div className="shrink-0" style={{ width: SEPARATOR_W }} />
}

function MiniDropdown({
  label,
  width,
  isRowHovered,
  isRowActive,
  alignTop,
  asField,
  className,
}: {
  label: string
  width?: number
  isRowHovered?: boolean
  isRowActive?: boolean
  alignTop?: boolean
  /** Wear the page's grey edit pill instead of reading as plain row text. */
  asField?: boolean
  className?: string
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
            : 'text-brand-navy hover:bg-neutral-100',
        className
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

function QtyAmendmentDisplay({
  previousQuantity,
  isRowHovered,
  children,
}: {
  previousQuantity: string
  isRowHovered?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center justify-end gap-1">
      <span
        className={cn(
          'shrink-0 text-[14px]',
          isRowHovered ? 'text-white/50' : 'text-neutral-400'
        )}
      >
        {previousQuantity}
      </span>
      <span
        className={cn(
          'shrink-0 text-[12px]',
          isRowHovered ? 'text-white/50' : 'text-neutral-400'
        )}
      >
        →
      </span>
      <div className="min-w-0 shrink-0">{children}</div>
    </div>
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
  placeholder,
  className,
}: {
  label: string
  width?: number
  options: string[]
  onSelect: (value: string) => void
  disabled?: boolean
  ariaLabel?: string
  limitedPeriodOption?: string
  /** Shown in mist when `label` is empty (e.g. overall discount period). */
  placeholder?: string
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isPlaceholder = !label && !!placeholder
  const displayLabel = label || placeholder || ''

  return (
    <div
      className={cn('relative', width != null ? 'shrink-0' : 'min-w-0 w-full', className)}
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
            : 'cursor-pointer hover:bg-neutral-100',
          isPlaceholder ? 'text-brand-mist' : 'text-brand-navy'
        )}
      >
        <span className="truncate">{displayLabel}</span>
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
  /** Item pinned — selected catalog row uses a blue fill instead of grey. */
  highlightSelected?: boolean
}

function LineItemPopover({
  isOpen,
  onClose,
  onSelect,
  anchorRef,
  currentName,
  highlightSelected,
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
          filteredItems.map((item) => {
            const isSelected = item.name === currentName
            const useBlueSelected = isSelected && highlightSelected
            return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item)
              }}
              className={cn(
                'group/opt flex w-full cursor-pointer flex-col gap-0.5 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0',
                useBlueSelected
                  ? 'bg-blue-50'
                  : isSelected
                    ? 'bg-neutral-100 hover:bg-brand-navy'
                    : 'hover:bg-brand-navy'
              )}
            >
              <span
                className={cn(
                  'text-[14px]',
                  useBlueSelected
                    ? 'font-semibold text-blue-700'
                    : 'font-medium text-brand-navy group-hover/opt:text-white'
                )}
              >
                {item.name}
              </span>
              <span
                className={cn(
                  'text-[12px]',
                  useBlueSelected
                    ? 'text-blue-700/70'
                    : 'text-brand-fog group-hover/opt:text-white/70'
                )}
              >
                {item.family} · {item.unitPrice}/unit · {item.billingPeriod}
              </span>
            </button>
            )
          })
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

/**
 * Filling in Limited Period (e.g. "5 months") is normal configuration, not a
 * field edit — skip amber / edit history for those values.
 */
function shouldRecordDiscountPeriodEdit(next: string) {
  return parseLimitedPeriod(next) == null
}

function amendmentChangeRank(item: ProductLineItem): number {
  if (item.isOverallDiscount) return 99
  switch (item.amendmentChange) {
    case 'added':
      return 0
    case 'quantity-increased':
      return 1
    case 'removed':
      return 2
    default:
      return 3
  }
}

function sortAmendmentItems(items: ProductLineItem[]): ProductLineItem[] {
  return [...items].sort((a, b) => amendmentChangeRank(a) - amendmentChangeRank(b))
}

/** Closed-cell label — bare "Limited Period" reads as the default duration. */
function discountPeriodLabel(value?: string) {
  if (!value || value === 'None') return value ?? 'None'
  if (value === LIMITED_PERIOD_OPTION || /^limited\s*period$/i.test(value.trim())) {
    return '5 months'
  }
  return value
}

/** Resolve legacy "Limited Period" placeholders into a concrete duration. */
function resolveLineItemDiscountPeriod(item: ProductLineItem): ProductLineItem {
  const raw = item.discountPeriod
  if (raw == null) return item
  const resolved = discountPeriodLabel(raw)
  return resolved === raw ? item : { ...item, discountPeriod: resolved }
}

function resolveProductsData(
  items: ProductLineItem[],
  periods: RampPeriod[] | undefined
): { items: ProductLineItem[]; periods: RampPeriod[] | undefined } {
  return {
    items: items.map(resolveLineItemDiscountPeriod),
    periods: periods?.map((period) => ({
      ...period,
      items: period.items.map(resolveLineItemDiscountPeriod),
    })),
  }
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

function parseMoney(value: string): number {
  const amount = parseFloat(value.replace(/[^\d.]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

/** Sum of line-item total prices for a period footer. */
function sumLineItemTotals(items: ProductLineItem[]): string {
  const total = items.reduce((sum, item) => {
    if (item.isOverallDiscount) return sum
    return sum + parseMoney(item.totalPrice)
  }, 0)
  return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function periodNetAmount(items: ProductLineItem[]): number {
  return items.reduce((sum, item) => {
    if (item.isOverallDiscount) return sum
    return sum + parseMoney(item.totalPrice)
  }, 0)
}

/** Dollar value of an overall discount against the period net total. */
function overallDiscountDollars(item: ProductLineItem, items: ProductLineItem[]): number | null {
  const raw = parseFloat(item.discount ?? '')
  if (!Number.isFinite(raw) || raw <= 0) return null
  if (item.discountUnit === 'USD') return raw
  return periodNetAmount(items) * (raw / 100)
}

/** e.g. `($ 100.00)` — accounting-style negative. */
function formatNegativeCurrency(amount: number): string {
  const formatted = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  return `(${formatted.replace('$', '$ ')})`
}

function createOverallDiscountItem(periodId: string): ProductLineItem {
  return {
    id: `overall-discount-${periodId}`,
    name: 'Invoice level discount',
    status: 'ready',
    billingPeriod: '',
    quantity: '',
    unitPrice: '',
    discount: '0',
    discountUnit: '%',
    discountPeriod: '',
    totalPrice: '',
    isOverallDiscount: true,
  }
}

/** Keep the overall-discount row last when inserting product lines. */
function insertBeforeOverallDiscount(
  items: ProductLineItem[],
  newItem: ProductLineItem
): ProductLineItem[] {
  const overallIdx = items.findIndex((item) => item.isOverallDiscount)
  if (overallIdx < 0) return [...items, newItem]
  return [...items.slice(0, overallIdx), newItem, ...items.slice(overallIdx)]
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
  /** Right-align amounts (unit / total). */
  align?: 'left' | 'right'
  className?: string
  /** Soften the resting label (e.g. row is navy-filled). */
  muted?: boolean
  /** Marks the resting value with a dashed underline that reveals the working. */
  proration?: ProductLineItem['proration']
}

/**
 * Click-to-edit currency cell — same interaction as Account Contact name / Phone:
 * blue resting label → grey pill input on click → commit on blur / Enter.
 */
function PriceField({
  value,
  ariaLabel,
  onCommit,
  align = 'right',
  className,
  muted,
  proration,
}: PriceFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const commit = () => {
    const next = formatCurrency(draft)
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
        value={draft}
        inputMode="decimal"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit()
          }
          if (e.key === 'Escape') {
            e.stopPropagation()
            cancel()
          }
        }}
        className={cn(
          ACTIVE_FIELD_STYLE,
          align === 'right' && 'text-right',
          className
        )}
      />
    )
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation()
        setDraft(value)
        setIsEditing(true)
      }}
      className={cn(
        'w-full cursor-pointer truncate text-[14px] font-medium transition-colors',
        align === 'right' && 'text-right',
        muted
          ? 'text-white'
          : value
            ? 'text-brand-navy'
            : 'text-brand-mist',
        className
      )}
    >
      {proration ? (
        <ProratedTotal proration={proration} isRowFilled={muted} />
      ) : (
        value || '–'
      )}
    </button>
  )
}

interface DiscountFieldProps {
  value: string
  unit: DiscountUnit
  onChange: (next: { value: string; unit: DiscountUnit }) => void
  className?: string
  muted?: boolean
  /**
   * Always show the grey pill + amount + unit control (overall discount empty state).
   * Starts focused so the cell matches the active edit chrome on insert.
   */
  forceField?: boolean
}

/**
 * Click-to-edit discount — resting label matches Account fields; the grey pill
 * carries the amount input plus the % / USD switch.
 */
function DiscountField({
  value,
  unit,
  onChange,
  className,
  muted,
  forceField,
}: DiscountFieldProps) {
  const [isEditing, setIsEditing] = useState(!!forceField)
  const [draft, setDraft] = useState(value || (forceField ? '0' : value))
  const [isUnitOpen, setIsUnitOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const unitTriggerRef = useRef<HTMLButtonElement>(null)
  const display = formatDiscount(value, unit)
  const hasValue = parseFloat(value || '') > 0
  const showField = forceField || isEditing
  const draftIsEmpty = !(parseFloat(draft || '') > 0)

  useEffect(() => {
    setDraft(value || (forceField ? '0' : value))
  }, [value, forceField])

  useEffect(() => {
    if (showField) inputRef.current?.focus()
  }, [showField])

  const commit = (nextValue = draft, nextUnit = unit) => {
    setIsEditing(false)
    setIsUnitOpen(false)
    const normalized = nextValue === '' ? (forceField ? '0' : nextValue) : nextValue
    setDraft(normalized)
    if (normalized !== value || nextUnit !== unit) {
      onChange({ value: normalized, unit: nextUnit })
    }
  }

  const cancel = () => {
    setDraft(value || (forceField ? '0' : value))
    setIsEditing(false)
    setIsUnitOpen(false)
  }

  if (showField) {
    return (
      <div className={cn('min-w-0 w-full', className)} onClick={(e) => e.stopPropagation()}>
        <div
          className={cn(
            ACTIVE_FIELD_STYLE,
            'flex items-center gap-1 transition-colors focus-within:bg-neutral-200'
          )}
        >
          <input
            ref={inputRef}
            value={draft}
            inputMode="decimal"
            placeholder="0"
            aria-label="Discount"
            onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ''))}
            onBlur={() => {
              // Don't commit while the unit menu is open — selecting a unit
              // blurs the input first and would close edit prematurely.
              if (!isUnitOpen) commit()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                e.stopPropagation()
                cancel()
              }
            }}
            className={cn(
              'w-full min-w-0 bg-transparent text-right text-[14px] font-medium outline-none placeholder:text-brand-mist',
              draftIsEmpty ? 'text-brand-mist' : 'text-brand-navy'
            )}
          />
          <div className="relative shrink-0">
            <button
              ref={unitTriggerRef}
              type="button"
              aria-label="Discount unit"
              onMouseDown={(e) => {
                // Keep the amount input focused so blur doesn't commit mid-toggle.
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={() => setIsUnitOpen((open) => !open)}
              className="flex cursor-pointer items-center gap-0.5 rounded px-1 text-[12px] font-medium text-brand-fog transition-colors hover:bg-neutral-300/60 hover:text-brand-navy"
            >
              {unit}
              <ChevronDown size={12} className="text-brand-mist" />
            </button>
            <MiniDropdownPopover
              isOpen={isUnitOpen}
              onClose={() => setIsUnitOpen(false)}
              onSelect={(next) => {
                setIsUnitOpen(false)
                commit(draft, next as DiscountUnit)
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

  return (
    <button
      type="button"
      aria-label="Discount"
      onClick={(e) => {
        e.stopPropagation()
        setDraft(value)
        setIsEditing(true)
      }}
      className={cn(
        'w-full cursor-pointer truncate text-right text-[14px] font-medium transition-colors',
        muted
          ? 'text-white'
          : hasValue
            ? 'text-brand-navy'
            : 'text-brand-mist',
        className
      )}
    >
      {display}
    </button>
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
  placeholder?: string
  className?: string
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
  placeholder,
  className,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isPlaceholder = !value && !!placeholder
  const displayValue = value || placeholder || ''

  return (
    <div className={cn('min-w-0 pl-3', className)} onClick={(e) => e.stopPropagation()}>
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
              ? 'flex w-full items-center justify-between gap-1 rounded px-1 py-1 text-[14px] font-medium'
              : ACTIVE_FIELD_STYLE,
            !plain && 'flex items-center justify-between gap-1',
            isPlaceholder ? 'text-brand-mist' : 'text-brand-navy',
            disabled
              ? 'cursor-not-allowed opacity-50'
              : plain
                ? 'cursor-pointer hover:bg-neutral-100'
                : 'cursor-pointer hover:bg-neutral-200',
            isOpen && (plain ? 'bg-neutral-100' : 'bg-neutral-200')
          )}
        >
          <span className="truncate">{displayValue}</span>
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
  amendmentChange?: ProductLineItem['amendmentChange']
  onSelect: (item: CatalogLineItem) => void
  onOpenChange?: (isOpen: boolean) => void
  isRowHovered?: boolean
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
  className?: string
  /** Item pinned — selected catalog row uses a blue fill instead of grey. */
  highlightSelected?: boolean
}

function ItemNameButton({
  name,
  isAttention,
  amendmentChange,
  onSelect,
  onOpenChange,
  isRowHovered,
  openRequestId,
  asField,
  hangIcon = true,
  className,
  highlightSelected,
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
    <div className={cn('group/item relative flex min-w-0 flex-1 items-center gap-1.5', className)}>
      {/* Edit-state: hang the attention icon in the left gutter outside the column. */}
      {isAttention && hangIcon && (
        <div className="relative -ml-6 mr-2 shrink-0">
          <PackagePlus size={16} className="shrink-0 ai-gradient-text" />
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => handleOpenChange(!isOpen)}
        className={cn(
          'flex min-w-0 cursor-pointer items-center gap-1.5 text-left text-[14px] font-medium transition-colors',
          asField
            ? cn(
                ACTIVE_FIELD_STYLE,
                'justify-between hover:bg-neutral-200',
                isOpen && 'bg-neutral-200'
              )
            : hangIcon
              ? (isOpen || isRowHovered)
                ? 'text-white'
                : (isAttention ? 'ai-gradient-text' : 'text-brand-navy')
              : (isAttention ? 'ai-gradient-text' : 'text-brand-navy')
        )}
      >
        {/* On the pill the gradient has to sit on the text alone — as a button
            class its background would paint over the pill fill. */}
        <span
          className={cn(
            'truncate',
            asField && isAttention && 'ai-gradient-text',
            amendmentChange === 'removed' && 'text-neutral-400 line-through'
          )}
        >
          {name}
        </span>
        <ChevronDown size={14} className={cn(
          "shrink-0 transition-colors",
          hangIcon && !asField && (isOpen || isRowHovered) ? "text-white/70" : "text-brand-mist"
        )} />
      </button>
      {amendmentChange === 'added' && (
        <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
          Added
        </span>
      )}
      {amendmentChange === 'removed' && (
        <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
          Removed
        </span>
      )}
      {amendmentChange === 'quantity-increased' && (
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          Modified
        </span>
      )}
      {/* Expanded sticky cell: sit the attention icon at the trailing edge. */}
      {isAttention && !hangIcon && (
        <div className="relative ml-auto shrink-0 pr-2">
          <PackagePlus size={16} className="shrink-0 ai-gradient-text" />
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
        highlightSelected={highlightSelected}
      />
    </div>
  )
}

/** Total for a line whose first charge is prorated — the working opens on hover. */
function ProratedTotal({
  proration,
  isRowFilled,
}: {
  proration: NonNullable<ProductLineItem['proration']>
  isRowFilled?: boolean
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null)

  return (
    <>
      {/* The first invoice is what gets billed, so the column carries that amount. */}
      <span
        tabIndex={0}
        onMouseEnter={(e) => setAnchor(e.currentTarget.getBoundingClientRect())}
        onMouseLeave={() => setAnchor(null)}
        onFocus={(e) => setAnchor(e.currentTarget.getBoundingClientRect())}
        onBlur={() => setAnchor(null)}
        className={cn(
          'cursor-help border-b border-dashed pb-px outline-none',
          isRowFilled ? 'border-white/60' : 'border-brand-mist'
        )}
      >
        {proration.proratedAmount}
      </span>
      {anchor &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] -translate-x-full"
            style={{ left: anchor.right, top: anchor.bottom + 8 }}
          >
            <div className="w-[340px] rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-left font-normal shadow-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
                First invoice is prorated
              </p>
              <div className="mt-2 flex items-baseline justify-between gap-4 text-[12px] text-brand-navy">
                <span>Price for {proration.fullMonths} months</span>
                <span className="shrink-0 tabular-nums">{proration.fullPrice}</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-4 text-[12px] text-brand-navy">
                <span>
                  Price for {proration.proratedMonths}{' '}
                  {proration.proratedMonths === 1 ? 'month' : 'months'} ({proration.proratedRange})
                </span>
                <span className="shrink-0 tabular-nums">{proration.proratedAmount}</span>
              </div>
              <p className="mt-0.5 text-right text-[11px] text-brand-fog">{proration.formula}</p>
              <p className="mt-2 border-t border-neutral-200 pt-2 text-[12px] text-brand-navy">
                From next billing cycle ({proration.nextCycleRange}), the price will be{' '}
                {proration.nextCyclePrice}.
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

const BASE_COLUMN_WIDTHS = {
  PERIOD_W: 96,
  QTY_W: 96,
  /** Fits `$2,568.00` beside a ramp badge (`↑ 7%`) without truncating the price. */
  UNIT_W: 152,
  /** Edit-mode-only column between unit price and total — fits the amount + unit control. */
  DISCOUNT_W: 78,
  /** Edit-mode-only column for how long the discount runs. */
  DISCOUNT_PERIOD_W: 116,
  TOTAL_W: 124,
  /** Inline layout only — leaves room for the discount tag beside the amount. */
  TOTAL_INLINE_W: 172,
  EXPANDED_ITEM_W: 340,
} as const
const MENU_W = 48
const ITEM_PINNED_COLUMN_WIDTHS = {
  PERIOD_W: 108,
  QTY_W: 108,
  UNIT_W: 170,
  DISCOUNT_W: 90,
  DISCOUNT_PERIOD_W: 132,
  TOTAL_W: 136,
  TOTAL_INLINE_W: 184,
  EXPANDED_ITEM_W: 360,
} as const
/** Expanded sticky Total + ellipsis group pinned to the right. */
const EXPANDED_PINNED_RIGHT_W = BASE_COLUMN_WIDTHS.TOTAL_W + MENU_W
/** The `pl-1 pr-2` every row carries. */
const ROW_PAD_X = 12
/** The `pl-1` half of it — the sticky Item cell's resting offset. */
const ROW_PAD_LEFT = 4
/**
 * Divider on the sticky first column of expanded body rows. The scroller flags
 * its track while the pin shadow is up, and the stroke fades out so the two
 * cues never stack on the same edge.
 */
const EXPANDED_BODY_ROW_STROKE =
  'border-r border-neutral-200 [[data-pin-cue]_&]:border-r-transparent'
/** Expanded-state only — fixed width of the sticky first (Item / period) column.
 *  Sized to fit "Period N 📅 Jul 17, 2026 to Jun 17, 2028" without spilling
 *  into Frequency; item names truncate inside the same track. */
/** Inline `position: sticky` wins over cellChrome's `relative`. */
function pinLeftStyle(width: number): CSSProperties {
  return { width, left: 0, position: 'sticky' }
}
function pinRightStyle(width: number, right: number): CSSProperties {
  return { width, right, position: 'sticky' }
}

/**
 * Expanded-state horizontal scroller. Always owns overflow-x so `sticky left`
 * on the Item column can pin; an inner track sizes to the columns.
 */
function ExpandedScrollContainer({
  children,
  footer,
  pauseShadow,
  fullWidth,
  pinRight,
  leadingGutter,
  itemColumnWidth = BASE_COLUMN_WIDTHS.EXPANDED_ITEM_W,
  pinnedRightWidth = EXPANDED_PINNED_RIGHT_W,
}: {
  children: ReactNode
  /** Item pinned only — own scroller, scroll-synced, so pin cues stay on the table. */
  footer?: ReactNode
  /** Suppress the pin cue mid-transition (edit mode collapsing). */
  pauseShadow?: boolean
  /** Stretch the inner track to the container (full-page expand). */
  fullWidth?: boolean
  /** Show the right pin cue for Total + menu (Window table only). */
  pinRight?: boolean
  /** Variant-specific sticky Item track width. */
  itemColumnWidth?: number
  /** Variant-specific sticky Total + menu width. */
  pinnedRightWidth?: number
  /**
   * Sits in the 24px gutter left of the table, level with the header row.
   * overflow-x would clip it inside the scroller, so it lives out here.
   */
  leadingGutter?: ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const footerScrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  /** Rows start at `pl-1`, so at rest the Item cell sits 4px in; it slides to 0 once pinned. */
  const [pin, setPin] = useState({ hasOverflow: false, offset: ROW_PAD_LEFT })
  /** Centre of the header row's first cell — the gutter icon lines up with it. */
  const [gutterCenter, setGutterCenter] = useState<number | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const sync = () =>
      setPin({
        hasOverflow: el.scrollWidth - el.clientWidth > 1,
        offset: Math.max(0, ROW_PAD_LEFT - el.scrollLeft),
      })
    const onTableScroll = () => {
      sync()
      const footerEl = footerScrollRef.current
      if (footerEl && footerEl.scrollLeft !== el.scrollLeft) {
        footerEl.scrollLeft = el.scrollLeft
      }
    }
    sync()
    el.addEventListener('scroll', onTableScroll, { passive: true })
    window.addEventListener('resize', sync)
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', onTableScroll)
      window.removeEventListener('resize', sync)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const footerEl = footerScrollRef.current
    const tableEl = scrollRef.current
    if (!footerEl || !tableEl) return
    const onFooterScroll = () => {
      if (tableEl.scrollLeft !== footerEl.scrollLeft) {
        tableEl.scrollLeft = footerEl.scrollLeft
      }
    }
    footerEl.addEventListener('scroll', onFooterScroll, { passive: true })
    return () => footerEl.removeEventListener('scroll', onFooterScroll)
  }, [footer])

  useEffect(() => {
    const track = trackRef.current
    if (!leadingGutter || !track) return
    const measure = () => {
      // The header row bottom-pads away from its content, so centring on the
      // row itself would sit low; measure the cell that holds the period label.
      const headerRow = track.firstElementChild as HTMLElement | null
      const target = (headerRow?.firstElementChild as HTMLElement | null) ?? headerRow
      if (!target) return
      const trackTop = track.getBoundingClientRect().top
      const rect = target.getBoundingClientRect()
      if (rect.height === 0) return
      setGutterCenter(rect.top - trackTop + rect.height / 2)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [leadingGutter])

  const showPinCue = pin.hasOverflow && !pauseShadow && !fullWidth
  const trackClass = fullWidth ? 'w-full min-w-full' : 'w-max min-w-full'

  return (
    <div className={cn(fullWidth && 'w-full')}>
      <div className="relative">
        {leadingGutter ? (
          <div
            className="absolute -left-5 z-30"
            style={
              gutterCenter === null
                ? { top: 0 }
                : { top: gutterCenter, transform: 'translateY(-50%)' }
            }
          >
            {leadingGutter}
          </div>
        ) : null}
        <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden">
          <div ref={trackRef} className={trackClass} data-pin-cue={showPinCue || undefined}>
            {children}
          </div>
        </div>
        {/*
         * Pin cues sit outside overflow-x so they stay on the sticky edges
         * while columns scroll underneath. They only cover the table, not the footer.
         */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 z-50 w-3 transition-opacity duration-150',
            showPinCue ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            left: itemColumnWidth + pin.offset,
            backgroundImage:
              'linear-gradient(to right, rgba(28,27,46,0.07), rgba(28,27,46,0.02) 45%, rgba(28,27,46,0))',
          }}
        />
        {pinRight ? (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-y-0 z-50 w-3 transition-opacity duration-150',
              showPinCue ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              right: pinnedRightWidth,
              backgroundImage:
                'linear-gradient(to left, rgba(28,27,46,0.07), rgba(28,27,46,0.02) 45%, rgba(28,27,46,0))',
            }}
          />
        ) : null}
      </div>
      {footer ? (
        <div
          ref={footerScrollRef}
          className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className={trackClass}>{footer}</div>
        </div>
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
 * Expanded-state full-page view — morph the fixed shell from the in-page table
 * bounds to the viewport. Opacity-only felt like a snap because the table left
 * the flow at 0 opacity and only then faded in at full size.
 */
const FULLPAGE_EXPAND_MS = 420
const FULLPAGE_EXPAND_TRANSITION = `${FULLPAGE_EXPAND_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
const FULLPAGE_COLLAPSE_MS = 340
const FULLPAGE_COLLAPSE_TRANSITION = `${FULLPAGE_COLLAPSE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
const FULLPAGE_COLLAPSE_SETTLE_MS = FULLPAGE_COLLAPSE_MS + 40
const FULLPAGE_PAD_TOP = 32
const FULLPAGE_PAD_X = 48
const FULLPAGE_PAD_BOTTOM = 64
/** Left padding on the full-page morph shell at origin (hang icons use -ml-6 into page gutter). */
const FULLPAGE_ORIGIN_GUTTER = 0

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
function AddLineItemButton({
  onSelect,
  inline,
}: {
  onSelect: (item: CatalogLineItem) => void
  /** Sit beside a period total instead of spanning a full row. */
  inline?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className={cn('relative', inline && 'shrink-0')}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex cursor-pointer items-center gap-2 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50',
          inline
            ? 'rounded-lg py-1.5 pl-1 pr-2'
            : 'w-full border-b border-neutral-100 py-2 pl-1 pr-2'
        )}
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

/** Matches the Effective date / End date fields, e.g. "May 1, 2026". */
function formatPeriodDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
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

/** In-app calendar + typed date, hugging the value instead of a fixed field width. */
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
  const [draft, setDraft] = useState(value)
  const [pickerOpen, setPickerOpen] = useState(defaultOpen)
  const selected = parsePeriodDate(draft) ?? parsePeriodDate(value) ?? new Date()
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  )
  const rootRef = useRef<HTMLSpanElement>(null)
  const anchorRef = useRef<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const setEditing = useCallback(
    (next: boolean) => {
      setOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange]
  )

  useEffect(() => {
    if (!open) setDraft(value)
  }, [value, open])

  useLayoutEffect(() => {
    if (!open) {
      setPickerOpen(false)
      return
    }
    setDraft(value)
    const parsed = parsePeriodDate(value)
    if (parsed) setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
    setPickerOpen(true)
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, value])

  const commitDraft = useCallback(
    (raw: string) => {
      const parsed = parsePeriodDate(raw.trim())
      const next = parsed ? formatPeriodDate(parsed) : raw.trim() || value
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
      setEditing(false)
    },
    [commitDraft, draft, setEditing, value]
  )

  useEffect(() => {
    if (!open) return
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
  }, [close, open])

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
      isOpen={open && pickerOpen}
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
                  const next = formatPeriodDate(date)
                  setDraft(next)
                  onChange(next)
                  setPickerOpen(false)
                  setEditing(false)
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
    <span ref={rootRef} className="relative inline-flex min-w-0 items-center">
      {/* Both states share one box — same padding, gap and text metrics — so
          switching to edit doesn't nudge the row. */}
      <span
        ref={anchorRef}
        role={open ? undefined : 'button'}
        tabIndex={open ? undefined : 0}
        aria-label={open ? undefined : `Edit date ${value}`}
        aria-expanded={open ? undefined : false}
        aria-haspopup={open ? undefined : 'dialog'}
        onClick={(e) => {
          e.stopPropagation()
          if (!open) setEditing(true)
        }}
        onKeyDown={(e) => {
          if (open) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setEditing(true)
          }
        }}
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 px-1.5 py-0.5 text-[12px] font-normal leading-4 transition-colors',
          open
            ? 'rounded bg-neutral-200 text-brand-navy'
            : 'cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100'
        )}
      >
        {open ? (
          <button
            type="button"
            aria-label="Open calendar"
            aria-expanded={pickerOpen}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPickerOpen((next) => !next)}
            className="flex h-4 w-3.5 shrink-0 cursor-pointer items-center justify-center text-brand-mist transition-colors hover:text-brand-navy"
          >
            <Calendar size={14} />
          </button>
        ) : (
          <span className="flex h-4 w-3.5 shrink-0 items-center justify-center">
            <Calendar size={14} className="text-blue-700" />
          </span>
        )}
        {/* Hidden twin sets the width; the input floats over it so its
            intrinsic size never widens the pill. */}
        <span className="relative block min-w-0">
          <span
            className={cn('block whitespace-pre leading-4', open && 'invisible')}
            aria-hidden={open}
          >
            {(open ? draft : value) || ' '}
          </span>
          {open && (
            <input
              ref={inputRef}
              type="text"
              size={1}
              value={draft}
              aria-label={`Edit date ${value}`}
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
              className="absolute inset-0 w-full min-w-0 bg-transparent text-[12px] font-normal leading-4 text-brand-navy outline-none"
            />
          )}
        </span>
      </span>
      {calendar}
    </span>
  )
}

/** Period identity: label + separate from / to date pills. */
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
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
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
        <span className="shrink-0 text-[12px] text-brand-fog">to</span>
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

function PeriodOptionsMenu({
  onDelete,
  onAddOverallDiscount,
}: {
  onDelete: () => void
  onAddOverallDiscount?: () => void
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
        className="min-w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
      >
        <div role="menu">
          {onAddOverallDiscount ? (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onAddOverallDiscount()
              }}
              className="flex w-full cursor-pointer px-3 py-2 text-left text-[13px] font-medium text-brand-navy transition-colors hover:bg-neutral-50"
            >
              Add invoice level discount
            </button>
          ) : null}
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
    <span className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-green-700">
      <Icon size={12} strokeWidth={2} className="shrink-0 text-green-700" />
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
          <span className="text-[11px] font-medium text-white">
            {discountPeriodLabel(discountPeriod ?? 'None')}
          </span>
        </span>
      </span>
    </span>
  )
}

/** Use case switcher variants for this section — see UseCaseContext's `customer360` entry. */
export type ProductsPricingVariant = 'edit-state' | 'expanded-state' | 'item-pinned'

/** Put on the Expand control so the table can measure origin before chrome unmounts. */
export const PRODUCTS_PRICING_EXPAND_ATTR = 'data-products-pricing-expand'

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
   * Window table / Item pinned: Discount columns + sticky Item (and Total+menu
   * only for Window table). Discount tag: inline lift-to-edit.
   */
  variant?: ProductsPricingVariant
  /** Controlled expand — Expand/Shrink (window/item-pinned) or lift (discount tag). */
  lifted?: boolean
  onLiftedChange?: (lifted: boolean) => void
  /** First-period invoice-level discount so Invoice preview can tally totals. */
  onInvoiceLevelDiscountChange?: (discount: { value: string; unit: DiscountUnit } | null) => void
}

export function ProductsPricingTable({
  items: initialItems,
  periods: initialPeriods,
  header,
  fullPageTitle,
  variant = 'edit-state',
  lifted,
  onLiftedChange,
  onInvoiceLevelDiscountChange,
}: ProductsPricingTableProps) {
  const isExpandedVariant = variant === 'expanded-state' || variant === 'item-pinned'
  const isItemPinnedVariant = variant === 'item-pinned'
  const {
    PERIOD_W,
    QTY_W,
    UNIT_W,
    DISCOUNT_W,
    DISCOUNT_PERIOD_W,
    TOTAL_W,
    TOTAL_INLINE_W,
    EXPANDED_ITEM_W,
  } = isItemPinnedVariant ? ITEM_PINNED_COLUMN_WIDTHS : BASE_COLUMN_WIDTHS
  const EXPANDED_SCROLL_MIDDLE_W =
    PERIOD_W + QTY_W + UNIT_W + DISCOUNT_W + DISCOUNT_PERIOD_W + SEPARATOR_W * 5
  /** Window table pins Total + ellipsis and shows the right pin cue. */
  const pinRightColumns = variant === 'expanded-state'
  /** Window table and Item pinned both pin the ellipsis; Item pinned has no right cue. */
  const pinMenuColumn = isExpandedVariant
  const editHistory = useOptionalFieldEditHistory()
  const resolvedInitial = resolveProductsData(initialItems, initialPeriods)
  const [items, setItems] = useState(resolvedInitial.items)
  const [periods, setPeriods] = useState(resolvedInitial.periods)

  // Always re-resolve when props change — Fast Refresh can keep a stale snapshot
  // where discountPeriod is still the legacy "Limited Period" placeholder.
  useEffect(() => {
    const next = resolveProductsData(initialItems, initialPeriods)
    setItems(next.items)
    setPeriods(next.periods)
  }, [initialItems, initialPeriods])

  useEffect(() => {
    if (!onInvoiceLevelDiscountChange) return
    const source = periods?.[0]?.items ?? items
    const row = source.find((item) => item.isOverallDiscount)
    const raw = parseFloat(row?.discount ?? '')
    if (!row || !Number.isFinite(raw) || raw <= 0) {
      onInvoiceLevelDiscountChange(null)
      return
    }
    onInvoiceLevelDiscountChange({
      value: row.discount ?? '0',
      unit: row.discountUnit ?? '%',
    })
  }, [items, periods, onInvoiceLevelDiscountChange])
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
  /** Origin captured on Expand pointerdown — before the header chrome unmounts. */
  const pendingExpandOriginRef = useRef<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
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
    const pending = pendingExpandOriginRef.current
    pendingExpandOriginRef.current = null
    if (pending) {
      setEditLayout(pending)
      editBaseWidthRef.current = pending.width - (isExpandedVariant ? FULLPAGE_ORIGIN_GUTTER : 0)
    } else if (el) {
      const rect = el.getBoundingClientRect()
      const gutter = isExpandedVariant ? FULLPAGE_ORIGIN_GUTTER : 0
      setEditLayout({
        top: rect.top,
        left: rect.left - gutter,
        width: rect.width + gutter,
        height: rect.height,
      })
      editBaseWidthRef.current = rect.width
    }
    // Edit-state lift needs page bounds for the blur/card animation.
    if (!isExpandedVariant) {
      setEditBounds(measureExpandBounds())
    }
    setEditExpanded(false)
    setEditAnimReady(false)
    setIsCollapsing(false)
    isCollapsingRef.current = false
    setIsEditMode(true)
    onLiftedChange?.(true)
  }, [isEditMode, isExpandedVariant, onLiftedChange])

  // Capture origin on Expand pointerdown — runs before the click setState
  // removes thumbnails / the button and shrinks the measured box.
  useEffect(() => {
    if (!isExpandedVariant) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.closest(`[${PRODUCTS_PRICING_EXPAND_ATTR}]`)) return
      const el = tableRootRef.current
      if (!el || isEditMode) return
      const rect = el.getBoundingClientRect()
      const gutter = FULLPAGE_ORIGIN_GUTTER
      pendingExpandOriginRef.current = {
        top: rect.top,
        left: rect.left - gutter,
        width: rect.width + gutter,
        height: rect.height,
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [isExpandedVariant, isEditMode])

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
  useLayoutEffect(() => {
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
  // Paint one frame at the origin bounds with transitions off, then enable
  // transitions and flip to the expanded target — otherwise the browser skips
  // straight to the end and the morph reads as a snap.
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
          p.id === periodId
            ? { ...p, items: insertBeforeOverallDiscount(p.items, newLineItem) }
            : p
        )
      )
    } else {
      setItems((prev) => [...prev, newLineItem])
    }
  }

  const handleAddOverallDiscount = (periodId: string) => {
    setPeriods((prev) =>
      prev?.map((p) => {
        if (p.id !== periodId) return p
        if (p.items.some((item) => item.isOverallDiscount)) return p
        return { ...p, items: [...p.items, createOverallDiscountItem(periodId)] }
      })
    )
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
        alignItems: 'stretch' as const,
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
          'pr-[22px] text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Qty
      </div>
      <GhostSeparator />
      <div
        style={isEditMode ? undefined : { width: UNIT_W }}
        className={cn(
          'pl-3 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
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
          'pr-[22px] text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isEditMode && 'shrink-0'
        )}
      >
        Qty
      </div>
      <GhostSeparator />
      <div
        style={isEditMode ? undefined : { width: UNIT_W }}
        className={cn(
          'pl-3 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
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
        <PeriodOptionsMenu
          onDelete={onDelete}
          onAddOverallDiscount={
            period.items.some((item) => item.isOverallDiscount)
              ? undefined
              : () => handleAddOverallDiscount(period.id)
          }
        />
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
        // Tracks: item | rule | frequency | rule | qty | rule | unit | rule |
        // discount | rule | discount period | rule | total | menu
        gridTemplateColumns: [
          `minmax(0, ${EXPANDED_ITEM_W}fr)`,
          `${SEPARATOR_W}px`,
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
        alignItems: 'stretch' as const,
        width: '100%',
        minWidth: 0,
      }
      : undefined

  const renderPeriodFooter = (
    period: RampPeriod,
    onAddLineItem: (item: CatalogLineItem) => void
  ) => {
    const amount = sumLineItemTotals(period.items)
    const label = 'Net total'

    // Item pinned: sit in the scroll track so the amount lines up under Total price.
    if (isExpandedVariant && !pinRightColumns) {
      if (isFullPageExpanded) {
        return (
          <div
            className="items-center border-t border-neutral-200 py-2 pl-1 pr-2"
            style={expandedFullPageGridStyle}
          >
            <div className="min-w-0">
              <AddLineItemButton inline onSelect={onAddLineItem} />
            </div>
            {/* Tracks 2–10: rules + Frequency…Discount */}
            <div aria-hidden />
            <div aria-hidden />
            <div aria-hidden />
            <div aria-hidden />
            <div aria-hidden />
            <div aria-hidden />
            <div aria-hidden />
            <div aria-hidden />
            <div aria-hidden />
            {/* Track 11: Discount period — label sits just left of Total */}
            <div className="flex min-w-0 items-center justify-end">
              <span className="shrink-0 text-[13px] font-semibold text-brand-navy">{label}</span>
            </div>
            <div aria-hidden />
            <div className="text-right text-[14px] font-semibold tabular-nums text-brand-navy">
              {amount}
            </div>
            <div aria-hidden />
          </div>
        )
      }

      return (
        <div className="flex items-center border-t border-neutral-200 py-2 pl-1 pr-2">
          <div
            style={pinLeftStyle(EXPANDED_ITEM_W)}
          className="z-30 shrink-0 bg-white"
          >
            <AddLineItemButton inline onSelect={onAddLineItem} />
          </div>
          <div
            className="flex shrink-0 items-center justify-end gap-3"
            style={{ width: EXPANDED_SCROLL_MIDDLE_W }}
          >
            <span className="shrink-0 text-[13px] font-semibold text-brand-navy">{label}</span>
          </div>
          <div
            style={{ width: TOTAL_W }}
            className="shrink-0 text-right text-[14px] font-semibold tabular-nums text-brand-navy"
          >
            {amount}
          </div>
          <div
            style={pinRightStyle(MENU_W, 0)}
            className="z-20 shrink-0 bg-white"
            aria-hidden
          />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between gap-4 border-t border-neutral-200 py-2 pl-1">
        <AddLineItemButton inline onSelect={onAddLineItem} />
        <div className="flex shrink-0 items-center gap-3">
          <span className="shrink-0 text-[13px] font-semibold text-brand-navy">{label}</span>
          <span
            style={{ width: isExpandedVariant ? TOTAL_W : TOTAL_INLINE_W }}
            className="shrink-0 text-right text-[14px] font-semibold tabular-nums text-brand-navy"
          >
            {amount}
          </span>
          {/* Matches sticky Total (`right: MENU_W`) + menu (`right: 0`) — no row `pr-2`. */}
          <span style={{ width: MENU_W }} className="shrink-0" aria-hidden />
        </div>
      </div>
    )
  }

  const renderExpandedTableHeader = () => (
    <div
      className={cn(
        'relative items-center bg-white pb-2 pl-1 pr-2',
        HEADER_STROKE,
        !isFullPageExpanded && 'flex'
      )}
      style={expandedFullPageGridStyle}
    >
      <div
        style={isFullPageExpanded ? undefined : pinLeftStyle(EXPANDED_ITEM_W)}
        className={cn(
          'z-30 bg-white text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0',
          isFullPageExpanded && 'min-w-0'
        )}
      >
        <span className="block truncate">Item</span>
      </div>
      {isFullPageExpanded ? <GhostSeparator /> : null}
      <div
        style={isFullPageExpanded ? undefined : { width: PERIOD_W }}
        className={cn(
          'text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'pl-3 shrink-0'
        )}
      >
        Frequency
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: QTY_W }}
        className={cn(
          'pr-[22px] text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Qty
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: UNIT_W }}
        className={cn(
          'pl-3 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
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
        style={
          isFullPageExpanded
            ? undefined
            : pinRightColumns
              ? pinRightStyle(TOTAL_W, MENU_W)
              : { width: TOTAL_W }
        }
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0',
          !isFullPageExpanded && pinRightColumns && 'z-20 bg-white'
        )}
      >
        Total price
      </div>
      <div
        style={
          isFullPageExpanded
            ? undefined
            : pinMenuColumn
              ? pinRightStyle(MENU_W, 0)
              : { width: MENU_W }
        }
        className={cn(
          'bg-white',
          !isFullPageExpanded && 'shrink-0',
          pinMenuColumn && !isFullPageExpanded && 'z-20'
        )}
      />
    </div>
  )

  // Expanded-state ramp period header — mirrors renderExpandedTableHeader but
  // swaps the "Item" label for the period identity, same as the edit-grid version.
  // The collapse chevron is rendered by ExpandedScrollContainer's gutter, not here.
  const renderExpandedPeriodTableHeader = (
    period: RampPeriod,
    _onToggle: () => void,
    onDelete: () => void
  ) => (
    <div
      className={cn(
        'relative items-center bg-white pb-2 pl-1 pr-2',
        HEADER_STROKE,
        !isFullPageExpanded && 'flex'
      )}
      style={expandedFullPageGridStyle}
    >
      <div
        style={isFullPageExpanded ? undefined : pinLeftStyle(EXPANDED_ITEM_W)}
        className={cn(
          'z-30 flex min-w-0 items-center bg-white',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          <PeriodIdentity
            period={period}
            onChangeDates={(dates) => updatePeriodDates(period.id, dates)}
            autoOpenStartDate={openStartDatePeriodId === period.id}
            onStartDatePickerClose={() => {
              if (openStartDatePeriodId === period.id) setOpenStartDatePeriodId(null)
            }}
          />
        </div>
      </div>
      {isFullPageExpanded ? <GhostSeparator /> : null}
      <div
        style={isFullPageExpanded ? undefined : { width: PERIOD_W }}
        className={cn(
          'text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'pl-3 shrink-0'
        )}
      >
        Frequency
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: QTY_W }}
        className={cn(
          'pr-[22px] text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0'
        )}
      >
        Qty
      </div>
      <GhostSeparator />
      <div
        style={isFullPageExpanded ? undefined : { width: UNIT_W }}
        className={cn(
          'pl-3 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
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
        style={
          isFullPageExpanded
            ? undefined
            : pinRightColumns
              ? pinRightStyle(TOTAL_W, MENU_W)
              : { width: TOTAL_W }
        }
        className={cn(
          'text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy',
          !isFullPageExpanded && 'shrink-0',
          !isFullPageExpanded && pinRightColumns && 'z-20 bg-white'
        )}
      >
        Total price
      </div>
      <div
        style={
          isFullPageExpanded
            ? undefined
            : pinMenuColumn
              ? pinRightStyle(MENU_W, 0)
              : { width: MENU_W }
        }
        className={cn(
          'flex items-center justify-end bg-white',
          !isFullPageExpanded && 'shrink-0',
          pinMenuColumn && !isFullPageExpanded && 'z-20'
        )}
      >
        <PeriodOptionsMenu
          onDelete={onDelete}
          onAddOverallDiscount={
            period.items.some((item) => item.isOverallDiscount)
              ? undefined
              : () => handleAddOverallDiscount(period.id)
          }
        />
      </div>
    </div>
  )

  // Expanded-state row — Discount / Discount period are always visible as
  // plain columns. Item is pinned left; Total price + ellipsis are pinned right.
  // Cells open their own menus in place — no lifted edit surface.
  const renderExpandedOverallDiscountRow = (
    item: ProductLineItem,
    updateItems: (updater: (prev: ProductLineItem[]) => ProductLineItem[]) => void,
    periodItems: ProductLineItem[]
  ) => {
    const hasDiscountValue = parseFloat(item.discount ?? '') > 0
    const discountDollars = overallDiscountDollars(item, periodItems)
    const discountTotalLabel =
      discountDollars != null ? formatNegativeCurrency(discountDollars) : ''

    return (
      <div
        key={item.id}
        className={cn(
          'group relative items-stretch bg-white pl-1 pr-2',
          ROW_STROKE,
          !isFullPageExpanded && 'flex'
        )}
        style={expandedFullPageGridStyle}
      >
        <div
          style={isFullPageExpanded ? undefined : pinLeftStyle(EXPANDED_ITEM_W)}
          className={cellChrome(
            false,
            'z-30 min-w-0 bg-white',
            !isFullPageExpanded && 'shrink-0',
            isItemPinnedVariant && EXPANDED_BODY_ROW_STROKE
          )}
        >
          <div className={cellInner(false, 'min-w-0')}>
            <span className="truncate text-[14px] font-medium text-brand-navy">{item.name}</span>
          </div>
        </div>
        {isFullPageExpanded ? <GhostSeparator /> : null}
        <div
          className={cellChrome(false, 'min-w-0', !isFullPageExpanded && 'pl-3 shrink-0')}
          style={isFullPageExpanded ? undefined : { width: PERIOD_W }}
          aria-hidden
        />
        <GhostSeparator />
        <div
          className={cellChrome(false, !isFullPageExpanded && 'shrink-0')}
          style={isFullPageExpanded ? undefined : { width: QTY_W }}
          aria-hidden
        />
        <GhostSeparator />
        <div
          className={cellChrome(false, 'min-w-0 justify-end pl-3', !isFullPageExpanded && 'shrink-0')}
          style={isFullPageExpanded ? undefined : { width: UNIT_W }}
          aria-hidden
        />
        <GhostSeparator />
        <div
          style={isFullPageExpanded ? undefined : { width: DISCOUNT_W }}
          className={cellChrome(false, 'min-w-0 justify-end', !isFullPageExpanded && 'shrink-0')}
        >
          <div className={cellInner(false, 'min-w-0 w-full')}>
            <DiscountField
              forceField={!hasDiscountValue}
              value={item.discount ?? '0'}
              unit={item.discountUnit ?? '%'}
              onChange={({ value, unit }) => {
                updateItems((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, discount: value, discountUnit: unit } : i
                  )
                )
              }}
            />
          </div>
        </div>
        <Separator />
        <div
          style={isFullPageExpanded ? undefined : { width: DISCOUNT_PERIOD_W }}
          className={cellChrome(false, 'min-w-0', !isFullPageExpanded && 'shrink-0')}
        >
          <div className={cellInner(false, 'min-w-0 w-full')}>
            <InteractiveMiniDropdown
              label={
                item.discountPeriod
                  ? discountPeriodLabel(item.discountPeriod)
                  : ''
              }
              placeholder="Select"
              options={DISCOUNT_PERIODS.filter((period) => period !== 'None')}
              ariaLabel="Invoice level discount period"
              limitedPeriodOption={LIMITED_PERIOD_OPTION}
              onSelect={(next) => {
                updateItems((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, discountPeriod: next as DiscountPeriod } : i
                  )
                )
              }}
            />
          </div>
        </div>
        <Separator />
        <div
          style={
            isFullPageExpanded
              ? undefined
              : pinRightColumns
                ? pinRightStyle(TOTAL_W, MENU_W)
                : { width: TOTAL_W }
          }
          className={cellChrome(
            false,
            'min-w-0 justify-end bg-white',
            !isFullPageExpanded && 'shrink-0',
            !isFullPageExpanded && pinRightColumns && 'z-20'
          )}
        >
          {discountTotalLabel ? (
            <span className="w-full text-right text-[14px] font-medium tabular-nums text-brand-navy">
              {discountTotalLabel}
            </span>
          ) : null}
        </div>
        <div
          style={
            isFullPageExpanded
              ? undefined
              : pinMenuColumn
                ? pinRightStyle(MENU_W, 0)
                : { width: MENU_W }
          }
          className={cellChrome(
            false,
            'justify-end bg-white',
            !isFullPageExpanded && 'shrink-0',
            pinMenuColumn && !isFullPageExpanded && 'z-20'
          )}
        >
          <LineItemOptionsMenu
            itemName={item.name}
            onDelete={() => {
              updateItems((prev) => prev.filter((i) => i.id !== item.id))
            }}
          />
        </div>
      </div>
    )
  }

  const renderExpandedLineItem = (
    item: ProductLineItem,
    updateItems: (updater: (prev: ProductLineItem[]) => ProductLineItem[]) => void,
    periodItems: ProductLineItem[]
  ) => {
    if (item.isOverallDiscount) {
      return renderExpandedOverallDiscountRow(item, updateItems, periodItems)
    }

    const isAttention = item.status === 'attention'
    const hasDiscount = parseFloat(item.discount ?? '') > 0
    const isItemEdited = isProductFieldEdited(editHistory, item.id, 'Item')
    const isFrequencyEdited = isProductFieldEdited(editHistory, item.id, 'Frequency')
    const isQtyEdited = isProductFieldEdited(editHistory, item.id, 'Qty')
    const isUnitPriceEdited = isProductFieldEdited(editHistory, item.id, 'Unit price')
    const isDiscountEdited = isProductFieldEdited(editHistory, item.id, 'Discount')
    const isDiscountPeriodEdited = isProductFieldEdited(editHistory, item.id, 'Discount period')
    const isTotalEdited = isProductFieldEdited(editHistory, item.id, 'Total price')
    const quantityOptions = QUANTITY_OPTIONS.includes(item.quantity)
      ? QUANTITY_OPTIONS
      : [item.quantity, ...QUANTITY_OPTIONS]

    return (
      <div
        key={item.id}
        className={cn(
          'group row-hover-trail relative items-stretch bg-white pl-1 pr-2',
          ROW_STROKE,
          !isFullPageExpanded && 'flex',
          item.amendmentChange === 'unchanged' && 'opacity-55',
          // Cell values render inside buttons, so strike those rather than the row
          // itself — that keeps the line off the "Removed" tag and the row icons.
          item.amendmentChange === 'removed' && 'opacity-60 [&_button]:line-through',
          // Lift the whole row while the item picker is open so the absolute
          // popover isn't painted under later sticky cells / row content.
          activeRowId === item.id && 'z-40'
        )}
        style={expandedFullPageGridStyle}
      >
        {/* Item — pinned to the left of the scrollable group */}
        <div
          style={isFullPageExpanded ? undefined : pinLeftStyle(EXPANDED_ITEM_W)}
          className={cellChrome(
            isItemEdited,
            'min-w-0',
            !isFullPageExpanded && 'shrink-0',
            activeRowId === item.id ? 'z-40' : 'z-30',
            isItemEdited ? 'bg-amber-50' : 'bg-white',
            isItemPinnedVariant && EXPANDED_BODY_ROW_STROKE
          )}
        >
          {isItemEdited ? <EditedCellFill /> : null}
          <div className={cellInner(isItemEdited, 'min-w-0 flex-1')}>
            <ItemNameButton
              name={item.name}
              isAttention={isAttention}
              amendmentChange={item.amendmentChange}
              hangIcon={false}
              highlightSelected={variant === 'item-pinned'}
              openRequestId={lineItemEditRequest[item.id]}
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
        </div>
        {isFullPageExpanded ? (
          <Separator fillStart={isItemEdited} fillEnd={isFrequencyEdited} />
        ) : null}

        <div
          className={cellChrome(
            isFrequencyEdited,
            'min-w-0',
            !isFullPageExpanded && 'pl-3 shrink-0'
          )}
          style={isFullPageExpanded ? undefined : { width: PERIOD_W }}
        >
          {isFrequencyEdited ? <EditedCellFill /> : null}
          <div className={cellInner(isFrequencyEdited, 'min-w-0 w-full')}>
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
        </div>
        <Separator fillStart={isFrequencyEdited} fillEnd={isQtyEdited} />
        <div
          className={cellChrome(isQtyEdited, !isFullPageExpanded && 'shrink-0')}
          style={isFullPageExpanded ? undefined : { width: QTY_W }}
        >
          {isQtyEdited ? <EditedCellFill /> : null}
          <div className={cellInner(isQtyEdited, 'flex min-w-0 w-full justify-end')}>
            {item.amendmentChange === 'quantity-increased' && item.previousQuantity ? (
              <QtyAmendmentDisplay previousQuantity={item.previousQuantity}>
                <InteractiveMiniDropdown
                  label={item.quantity}
                  className="w-auto"
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
              </QtyAmendmentDisplay>
            ) : (
            <InteractiveMiniDropdown
              label={item.quantity}
              className="w-auto"
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
            )}
          </div>
        </div>
        <Separator fillStart={isQtyEdited} fillEnd={isUnitPriceEdited} />

        <div
          style={isFullPageExpanded ? undefined : { width: UNIT_W }}
          className={cellChrome(
            isUnitPriceEdited,
            'min-w-0 justify-end pl-3',
            !isFullPageExpanded && 'shrink-0'
          )}
        >
          {isUnitPriceEdited ? <EditedCellFill /> : null}
          <div className={cellInner(isUnitPriceEdited, 'flex w-full items-center justify-end gap-2')}>
            {item.rampPriceChange && (
              <RampPriceChangeBadge change={item.rampPriceChange} />
            )}
            <PriceField
              value={item.unitPrice}
              ariaLabel={`Unit price for ${item.name}`}
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
          </div>
        </div>

        <Separator fillStart={isUnitPriceEdited} fillEnd={isDiscountEdited} />
        <div
          style={isFullPageExpanded ? undefined : { width: DISCOUNT_W }}
          className={cellChrome(
            isDiscountEdited,
            'min-w-0 justify-end',
            !isFullPageExpanded && 'shrink-0'
          )}
        >
          {isDiscountEdited ? <EditedCellFill /> : null}
          <div className={cellInner(isDiscountEdited, 'min-w-0 w-full')}>
            <DiscountField
              value={item.discount ?? ''}
              unit={item.discountUnit ?? '%'}
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
          </div>
        </div>
        <Separator fillStart={isDiscountEdited} fillEnd={isDiscountPeriodEdited} />
        <div
          style={isFullPageExpanded ? undefined : { width: DISCOUNT_PERIOD_W }}
          className={cellChrome(
            isDiscountPeriodEdited,
            'min-w-0',
            !isFullPageExpanded && 'shrink-0'
          )}
        >
          {isDiscountPeriodEdited ? <EditedCellFill /> : null}
          <div className={cellInner(isDiscountPeriodEdited, 'min-w-0 w-full')}>
            <InteractiveMiniDropdown
              label={
                hasDiscount ? discountPeriodLabel(item.discountPeriod ?? 'None') : '–'
              }
              options={DISCOUNT_PERIODS.filter((period) => period !== 'None')}
              ariaLabel={`Discount period for ${item.name}`}
              disabled={!hasDiscount}
              limitedPeriodOption={LIMITED_PERIOD_OPTION}
              onSelect={(next) => {
                if (shouldRecordDiscountPeriodEdit(next)) {
                  recordProductEdit(
                    editHistory,
                    item.id,
                    'Discount period',
                    item.discountPeriod ?? 'None',
                    next
                  )
                }
                updateItems((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, discountPeriod: next as DiscountPeriod } : i
                  )
                )
              }}
            />
          </div>
        </div>

        <Separator fillStart={isDiscountPeriodEdited} fillEnd={isTotalEdited} />
        <div
          style={
            isFullPageExpanded
              ? undefined
              : pinRightColumns
                ? pinRightStyle(TOTAL_W, MENU_W)
                : { width: TOTAL_W }
          }
          className={cellChrome(
            isTotalEdited,
            'min-w-0 justify-end',
            !isFullPageExpanded && 'shrink-0',
            !isFullPageExpanded && pinRightColumns && 'z-20',
            isTotalEdited ? 'bg-amber-50' : 'bg-white'
          )}
        >
          {isTotalEdited ? <EditedCellFill /> : null}
          <div className={cellInner(isTotalEdited, 'min-w-0 w-full')}>
            <PriceField
              value={item.totalPrice}
              ariaLabel={`Total price for ${item.name}`}
              proration={item.proration}
              onCommit={(nextTotal) => {
                recordProductEdit(editHistory, item.id, 'Total price', item.totalPrice, nextTotal)
                updateItems((prev) =>
                  prev.map((i) => (i.id === item.id ? { ...i, totalPrice: nextTotal } : i))
                )
              }}
            />
          </div>
        </div>

        {/* Ellipsis menu — pinned on the right (Window table + Item pinned) */}
        <div
          style={
          isFullPageExpanded
            ? undefined
            : pinMenuColumn
              ? pinRightStyle(MENU_W, 0)
              : { width: MENU_W }
        }
          className={cellChrome(
            false,
            'justify-end bg-white',
            !isFullPageExpanded && 'shrink-0',
            pinMenuColumn && !isFullPageExpanded && 'z-20'
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
    if (item.isOverallDiscount) {
      const hasDiscountValue = parseFloat(item.discount ?? '') > 0

      return (
        <div
          key={item.id}
          className={cn(
            'items-stretch border-b border-neutral-100 pl-1 pr-2',
            !isEditMode && 'flex'
          )}
          style={editRowGridStyle}
          onClick={() => {
            if (!isEditMode) enterEditMode()
          }}
        >
          <div className={cellBoxPad(false, 'min-w-0 flex-1')}>
            <div className={cellInner(false, 'min-w-0')}>
              <span className="truncate text-[14px] font-medium text-brand-navy">{item.name}</span>
            </div>
          </div>
          <div
            className={cellBoxPad(false, 'pl-3', !isEditMode && 'shrink-0')}
            style={isEditMode ? undefined : { width: PERIOD_W }}
            aria-hidden
          />
          <GhostSeparator />
          <div
            className={cellBoxPad(false, !isEditMode && 'shrink-0')}
            style={isEditMode ? undefined : { width: QTY_W }}
            aria-hidden
          />
          <GhostSeparator />
          <div
            className={cellBoxPad(false, 'pl-3', !isEditMode && 'shrink-0')}
            style={isEditMode ? undefined : { width: UNIT_W }}
            aria-hidden
          />
          {isEditMode ? (
            <>
              <div className={cellBoxPad(false, 'min-w-0 justify-end')}>
                <div className={cellInner(false, 'min-w-0 w-full')}>
                  <DiscountField
                    forceField={!hasDiscountValue}
                    value={item.discount ?? '0'}
                    unit={item.discountUnit ?? '%'}
                    onChange={({ value, unit }) => {
                      updateItems((prev) =>
                        prev.map((i) =>
                          i.id === item.id ? { ...i, discount: value, discountUnit: unit } : i
                        )
                      )
                    }}
                  />
                </div>
              </div>
              <div className={cellBoxPad(false, 'min-w-0')}>
                <div className={cellInner(false, 'min-w-0 w-full')}>
                  <SelectField
                    value={
                      item.discountPeriod
                        ? discountPeriodLabel(item.discountPeriod)
                        : ''
                    }
                    placeholder="Select"
                    options={DISCOUNT_PERIODS.filter((period) => period !== 'None')}
                    ariaLabel="Invoice level discount period"
                    plain={!showFieldPills}
                    limitedPeriodOption={LIMITED_PERIOD_OPTION}
                    onChange={(next) => {
                      updateItems((prev) =>
                        prev.map((i) =>
                          i.id === item.id
                            ? { ...i, discountPeriod: next as DiscountPeriod }
                            : i
                        )
                      )
                    }}
                  />
                </div>
              </div>
            </>
          ) : null}
          <GhostSeparator />
          <div
            style={isEditMode ? undefined : { width: TOTAL_INLINE_W }}
            className={cellBoxPad(false, !isEditMode && 'shrink-0')}
            aria-hidden
          />
          <div
            style={isEditMode ? undefined : { width: MENU_W }}
            className={cellBoxPad(false, 'justify-end', !isEditMode && 'shrink-0')}
          >
            <LineItemOptionsMenu
              itemName={item.name}
              onDelete={() => {
                updateItems((prev) => prev.filter((i) => i.id !== item.id))
              }}
            />
          </div>
        </div>
      )
    }

    const isAttention = item.status === 'attention'
    const isActive = activeRowId === item.id
    const isHovered = hoveredRowId === item.id
    // The lifted table already marks every cell as editable, so the navy row fill
    // would only add noise — it stays behind for the inline table.
    const isRowFilled = !isEditMode && (isActive || isHovered)
    const hasDiscount = parseFloat(item.discount ?? '') > 0
    const isItemEdited = isProductFieldEdited(editHistory, item.id, 'Item')
    const isFrequencyEdited = isProductFieldEdited(editHistory, item.id, 'Frequency')
    const isQtyEdited = isProductFieldEdited(editHistory, item.id, 'Qty')
    const isUnitPriceEdited = isProductFieldEdited(editHistory, item.id, 'Unit price')
    const isDiscountEdited = isProductFieldEdited(editHistory, item.id, 'Discount')
    const isDiscountPeriodEdited = isProductFieldEdited(editHistory, item.id, 'Discount period')
    const isTotalEdited = isProductFieldEdited(editHistory, item.id, 'Total price')
    
    return (
      <div
        key={item.id}
        onMouseEnter={() => setHoveredRowId(item.id)}
        onMouseLeave={() => setHoveredRowId(null)}
        onClick={() => enterEditMode()}
        className={cn(
          'group row-hover-trail items-stretch border-b pl-1 pr-2 transition-colors',
          !isEditMode && 'flex',
          item.amendmentChange === 'unchanged' && !isRowFilled && 'opacity-55',
          // Cell values render inside buttons, so strike those rather than the row
          // itself — that keeps the line off the "Removed" tag and the row icons.
          item.amendmentChange === 'removed' && '[&_button]:line-through',
          item.amendmentChange === 'removed' && !isRowFilled && 'opacity-60',
          isEditMode
            ? cn(
                showFieldPills && 'rounded-lg',
                'border-neutral-100'
              )
            : isActive
              ? 'bg-brand-navy border-brand-navy cursor-pointer'
              : 'border-neutral-100 cursor-pointer hover:bg-brand-navy hover:border-brand-navy'
        )}
        style={editRowGridStyle}
      >
        {/* Item */}
        <div className={cellBoxPad(!isRowFilled && isItemEdited, 'min-w-0 flex-1')}>
          {!isRowFilled && isItemEdited ? <EditedCellFill /> : null}
          <div className={cellInner(!isRowFilled && isItemEdited, 'min-w-0 flex-1')}>
            <ItemNameButton
              name={item.name}
              isAttention={isAttention}
              amendmentChange={item.amendmentChange}
              isRowHovered={isRowFilled && !isActive}
              openRequestId={lineItemEditRequest[item.id]}
              asField={showFieldPills}
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
          </div>
        </div>

        <div
          className={cellBoxPad(
            !isRowFilled && isFrequencyEdited,
            'pl-3',
            !isEditMode && 'shrink-0'
          )}
          style={isEditMode ? undefined : { width: PERIOD_W }}
        >
          {!isRowFilled && isFrequencyEdited ? <EditedCellFill /> : null}
          <div className={cellInner(!isRowFilled && isFrequencyEdited, 'min-w-0 w-full')}>
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
        </div>
        <Separator
          isRowHovered={isRowFilled}
          isRowActive={isRowFilled}
          hideLine={showFieldPills}
          fillStart={!isRowFilled && isFrequencyEdited}
          fillEnd={!isRowFilled && isQtyEdited}
        />
        <div
          className={cellBoxPad(!isRowFilled && isQtyEdited, !isEditMode && 'shrink-0')}
          style={isEditMode ? undefined : { width: QTY_W }}
        >
          {!isRowFilled && isQtyEdited ? <EditedCellFill /> : null}
          <div className={cellInner(!isRowFilled && isQtyEdited, 'flex min-w-0 w-full justify-end')}>
            {item.amendmentChange === 'quantity-increased' && item.previousQuantity ? (
              <QtyAmendmentDisplay
                previousQuantity={item.previousQuantity}
                isRowHovered={isRowFilled}
              >
                {isExpandedVariant && isEditMode ? (
                  <InteractiveMiniDropdown
                    label={item.quantity}
                    className="w-auto"
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
                    className="w-auto"
                    isRowHovered={isRowFilled}
                    isRowActive={isRowFilled}
                    asField={showFieldPills}
                  />
                )}
              </QtyAmendmentDisplay>
            ) : isExpandedVariant && isEditMode ? (
              <InteractiveMiniDropdown
                label={item.quantity}
                className="w-auto"
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
                className="w-auto"
                isRowHovered={isRowFilled}
                isRowActive={isRowFilled}
                asField={showFieldPills}
              />
            )}
          </div>
        </div>
        <Separator
          isRowHovered={isRowFilled}
          isRowActive={isRowFilled}
          hideLine={showFieldPills}
          fillStart={!isRowFilled && isQtyEdited}
          fillEnd={!isRowFilled && isUnitPriceEdited}
        />

        <div
          style={isEditMode ? undefined : { width: UNIT_W }}
          className={cellBoxPad(
            !isRowFilled && isUnitPriceEdited,
            'justify-end pl-3',
            !isEditMode && 'shrink-0'
          )}
        >
          {!isRowFilled && isUnitPriceEdited ? <EditedCellFill /> : null}
          <div
            className={cellInner(
              !isRowFilled && isUnitPriceEdited,
              'flex w-full items-center justify-end gap-2'
            )}
          >
            {item.rampPriceChange && !isRowFilled && (
              <RampPriceChangeBadge change={item.rampPriceChange} />
            )}
            {isEditMode ? (
              <PriceField
                value={item.unitPrice}
                ariaLabel={`Unit price for ${item.name}`}
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
          <div className={cellBoxPad(isDiscountEdited, 'min-w-0')}>
            {isDiscountEdited ? <EditedCellFill /> : null}
            <div className={cellInner(isDiscountEdited, 'min-w-0 w-full')}>
              <DiscountField
                value={item.discount ?? ''}
                unit={item.discountUnit ?? '%'}
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
            </div>
          </div>
        ) : null}
        {isEditMode ? (
          <div className={cellBoxPad(isDiscountPeriodEdited, 'min-w-0')}>
            {isDiscountPeriodEdited ? <EditedCellFill /> : null}
            <div className={cellInner(isDiscountPeriodEdited, 'min-w-0 w-full')}>
              <SelectField
                value={
                  hasDiscount
                    ? discountPeriodLabel(item.discountPeriod ?? 'None')
                    : '–'
                }
                options={DISCOUNT_PERIODS.filter((period) => period !== 'None')}
                ariaLabel={`Discount period for ${item.name}`}
                disabled={!hasDiscount}
                plain={!showFieldPills}
                limitedPeriodOption={LIMITED_PERIOD_OPTION}
                onChange={(next) => {
                  if (shouldRecordDiscountPeriodEdit(next)) {
                    recordProductEdit(
                      editHistory,
                      item.id,
                      'Discount period',
                      item.discountPeriod ?? 'None',
                      next
                    )
                  }
                  updateItems((prev) =>
                    prev.map((i) =>
                      i.id === item.id ? { ...i, discountPeriod: next as DiscountPeriod } : i
                    )
                  )
                }}
              />
            </div>
          </div>
        ) : null}
        <Separator
          isRowHovered={isRowFilled}
          isRowActive={isRowFilled}
          hideLine={showFieldPills}
          fillStart={!isRowFilled && (isEditMode ? isDiscountPeriodEdited : isUnitPriceEdited)}
          fillEnd={!isRowFilled && isTotalEdited}
        />
        <div
          style={isEditMode ? undefined : { width: TOTAL_INLINE_W }}
          className={cellBoxPad(
            !isRowFilled && isTotalEdited,
            'justify-end text-right text-[14px] font-medium transition-colors',
            !isEditMode && 'shrink-0 gap-1.5',
            isRowFilled ? 'text-white' : 'text-brand-navy'
          )}
        >
          {!isRowFilled && isTotalEdited ? <EditedCellFill /> : null}
          <div
            className={cellInner(
              !isRowFilled && isTotalEdited,
              'flex min-w-0 w-full items-center justify-end gap-1.5'
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
            {isEditMode ? (
              <PriceField
                value={item.totalPrice}
                ariaLabel={`Total price for ${item.name}`}
                proration={item.proration}
                onCommit={(nextTotal) => {
                  recordProductEdit(editHistory, item.id, 'Total price', item.totalPrice, nextTotal)
                  updateItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, totalPrice: nextTotal } : i))
                  )
                }}
              />
            ) : item.proration ? (
              <ProratedTotal proration={item.proration} isRowFilled={isRowFilled} />
            ) : (
              item.totalPrice
            )}
          </div>
        </div>

        <div
          className={cellBoxPad(false, 'justify-end gap-0.5', !isEditMode && 'shrink-0')}
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

    // Expanded-state full page — morph the shell from the in-page origin rect
    // to the viewport so the table never disappears and pops back in.
    if (isExpandedVariant) {
      const isFull = isOverlayOpen && editExpanded
      const timing = isCollapsing ? FULLPAGE_COLLAPSE_TRANSITION : FULLPAGE_EXPAND_TRANSITION
      const viewportW = typeof window !== 'undefined' ? window.innerWidth : 0
      const viewportH = typeof window !== 'undefined' ? window.innerHeight : 0
      const shellTransition = editAnimReady
        ? [
            `top ${timing}`,
            `left ${timing}`,
            `width ${timing}`,
            `height ${timing}`,
            `padding ${timing}`,
          ].join(', ')
        : 'none'

      return (
        <div className="overflow-visible">
          {isOverlayOpen ? (
            <div
              ref={tableSpacerRef}
              style={{ height: editLayout.height }}
              aria-hidden
            />
          ) : null}
          {/* Page veil — softens the page behind the growing panel. */}
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
                    'fixed z-[60] flex flex-col',
                    isFull ? 'overflow-y-auto' : 'overflow-hidden'
                  )
                : 'relative z-0 w-full'
            )}
            style={
              isOverlayOpen
                ? {
                    top: isFull ? 0 : editLayout.top,
                    left: isFull ? 0 : editLayout.left,
                    width: isFull ? viewportW : editLayout.width,
                    height: isFull ? viewportH : editLayout.height,
                    padding: isFull
                      ? `${FULLPAGE_PAD_TOP}px ${FULLPAGE_PAD_X}px ${FULLPAGE_PAD_BOTTOM}px`
                      : `0px 0px 0px ${FULLPAGE_ORIGIN_GUTTER}px`,
                    transition: shellTransition,
                    willChange: 'top, left, width, height, padding',
                    pointerEvents: isCollapsing ? 'none' : undefined,
                  }
                : undefined
            }
          >
            {isOverlayOpen ? (
              <div
                className="flex shrink-0 items-start justify-between gap-4 overflow-hidden"
                style={{
                  minHeight: isFull ? 32 : 0,
                  marginBottom: isFull && fullPageTitle ? 24 : 0,
                  opacity: isFull ? 1 : 0,
                  transition: editAnimReady
                    ? `opacity ${timing}, min-height ${timing}, margin-bottom ${timing}`
                    : 'none',
                }}
              >
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
            {header ? <div className="mb-6">{header}</div> : null}
            <div className={cn(isOverlayOpen && 'min-w-0 flex-1')}>{content}</div>
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
      <div className="overflow-visible">
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
          {header ? <div className="mb-6">{header}</div> : null}
          {content}
        </div>
      </div>
    )
  }

  const handleAddPeriod = () => {
    const lastPeriod = periods?.[periods.length - 1]
    let startDate = 'Jul 17, 2028'
    let endDate = 'Jul 17, 2029'
    if (lastPeriod) {
      const lastEnd = new Date(lastPeriod.endDate)
      if (!isNaN(lastEnd.getTime())) {
        const start = new Date(lastEnd)
        start.setDate(start.getDate() + 1)
        const end = new Date(start)
        end.setFullYear(end.getFullYear() + 1)
        end.setDate(end.getDate() - 1)
        startDate = formatPeriodDate(start)
        endDate = formatPeriodDate(end)
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
                  pinRight={pinRightColumns}
                  itemColumnWidth={EXPANDED_ITEM_W}
                  pinnedRightWidth={TOTAL_W + MENU_W}
                  leadingGutter={
                    <PeriodChevron
                      isExpanded
                      onToggle={() => togglePeriod(period.id)}
                      hangIcon={false}
                    />
                  }
                  footer={
                    !pinRightColumns
                      ? renderPeriodFooter(period, (catalogItem) =>
                          handleAddCatalogItem(catalogItem, period.id)
                        )
                      : undefined
                  }
                >
                  {renderExpandedPeriodTableHeader(
                    period,
                    () => togglePeriod(period.id),
                    () => handleDeletePeriod(period, periodIndexInList)
                  )}
                  {sortAmendmentItems(period.items).map((item) =>
                    renderExpandedLineItem(item, updatePeriodItems, period.items)
                  )}
                </ExpandedScrollContainer>
              ) : (
                <>
                  {renderPeriodTableHeader(
                    period,
                    () => togglePeriod(period.id),
                    () => handleDeletePeriod(period, periodIndexInList)
                  )}
                  {sortAmendmentItems(period.items).map((item) => renderLineItem(item, updatePeriodItems))}
                </>
              )}

              {pinRightColumns || !isExpandedVariant
                ? renderPeriodFooter(period, (catalogItem) =>
                    handleAddCatalogItem(catalogItem, period.id)
                  )
                : null}
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
          pinRight={pinRightColumns}
          itemColumnWidth={EXPANDED_ITEM_W}
          pinnedRightWidth={TOTAL_W + MENU_W}
        >
          {renderExpandedTableHeader()}
          {sortAmendmentItems(items).map((item) => renderExpandedLineItem(item, setItems, items))}
        </ExpandedScrollContainer>
      ) : (
        <>
          {renderTableHeader()}
          {sortAmendmentItems(items).map((item) => renderLineItem(item, setItems))}
        </>
      )}

      <AddLineItemButton onSelect={(catalogItem) => handleAddCatalogItem(catalogItem)} />
    </>
  )
}

export default ProductsPricingTable
