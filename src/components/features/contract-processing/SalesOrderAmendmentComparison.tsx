import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Columns3,
  GitCommitVertical,
  Milestone,
  X,
} from 'lucide-react'
import type {
  AllocationGroup,
  LabelValue,
  ProductLineItem,
  RampPeriod,
} from '@/data/contractProcessingMock'
import { cn } from '@/lib/utils'

interface SalesOrderAmendmentComparisonProps {
  isOpen: boolean
  onClose: () => void
  customerName: string
  items: ProductLineItem[]
  periods?: RampPeriod[]
  allocations: AllocationGroup[]
  beforeAllocations: AllocationGroup[]
  account: LabelValue[]
  terms: LabelValue[]
}

interface ComparisonProduct {
  name: string
  quantity: string
  billingPeriod: string
  unitPrice: string
  totalPrice: string
}

interface ComparisonRow {
  id: string
  before: ComparisonProduct | null
  after: ComparisonProduct | null
  item: ProductLineItem
}

/** One line of a section card — both sides are rendered from the same row so they stay aligned. */
interface CompareCell {
  qty?: string
  unitPrice?: string
  amount: string
}

interface CompareRow {
  id: string
  name: string
  before: CompareCell | null
  after: CompareCell | null
  changed: boolean
  change?: 'added' | 'removed' | 'quantity-increased'
}

interface CompareGroup {
  id: string
  label?: string
  /** Date range on each side — null when the period only exists on the other side. */
  beforeRange: string | null
  afterRange: string | null
  rangeChanged: boolean
  periodChange?: 'added' | 'removed' | 'dates-changed'
  rows: CompareRow[]
}

interface CompareSection {
  id: string
  title: string
  groups: CompareGroup[]
  totalLabel?: string
  hasAmounts: boolean
}

const CREDIT_NOTE_TOTAL = '$37,500.00'
const ORIGINAL_ARR = '$193,500.00'
const AMENDED_ARR = '$225,500.00'

function numericQuantity(quantity: string): number {
  const value = Number(quantity.replace(/,/g, ''))
  return Number.isFinite(value) ? value : 0
}

function parseMoney(value: string): number {
  const amount = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

function money(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function signedMoney(amount: number): string {
  return `${amount >= 0 ? '+' : '−'}${money(Math.abs(amount))}`
}

function beforeProduct(item: ProductLineItem): ComparisonProduct | null {
  if (item.amendmentChange === 'added') return null

  const quantity =
    item.amendmentChange === 'quantity-increased' && item.previousQuantity
      ? item.previousQuantity
      : item.quantity
  const unitPrice = parseMoney(item.unitPrice)
  const totalPrice =
    item.amendmentChange === 'quantity-increased'
      ? money(unitPrice * numericQuantity(quantity))
      : item.totalPrice

  return {
    name: item.name,
    quantity,
    billingPeriod: item.billingPeriod,
    unitPrice: item.unitPrice,
    totalPrice,
  }
}

function afterProduct(item: ProductLineItem): ComparisonProduct | null {
  if (item.amendmentChange === 'removed') return null
  return {
    name: item.name,
    quantity: item.quantity,
    billingPeriod: item.billingPeriod,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  }
}

/** Changed lines lead, so the eye lands on the delta before the untouched rows. */
function changeRank(item: ProductLineItem): number {
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

function productBadge(item: ProductLineItem): 'plan' | 'charge' | 'add-on' {
  if (/apex platform/i.test(item.name)) return 'plan'
  if (item.billingPeriod.toLowerCase() === 'one-time' || /implementation|onboarding/i.test(item.name)) {
    return 'charge'
  }
  return 'add-on'
}

/** Plans lead each card; charges and add-ons follow, so rows read in a familiar order. */
function badgeRank(item: ProductLineItem): number {
  switch (productBadge(item)) {
    case 'plan':
      return 0
    case 'charge':
      return 1
    default:
      return 2
  }
}

function Highlight({
  children,
  side,
  isActive,
  strong,
  variant = 'pill',
  onDark,
}: {
  children: ReactNode
  side: 'before' | 'after'
  isActive: boolean
  strong?: boolean
  /** Inline values use plain colour; only totals carry a filled pill. */
  variant?: 'pill' | 'text'
  /** Sitting on a hovered row, where the navy fill needs lighter ink. */
  onDark?: boolean
}) {
  if (!isActive) {
    return (
      <span className={cn(onDark ? 'text-white' : 'text-brand-navy', strong && 'font-semibold')}>
        {children}
      </span>
    )
  }

  const colour =
    side === 'before'
      ? onDark
        ? 'text-red-300'
        : 'text-red-700'
      : onDark
        ? 'text-green-300'
        : 'text-green-700'

  if (variant === 'text') {
    return <span className={cn(strong ? 'font-semibold' : 'font-medium', colour)}>{children}</span>
  }

  return (
    <span
      className={cn(
        'rounded-lg px-1.5 py-0.5 font-semibold',
        side === 'before' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
      )}
    >
      {children}
    </span>
  )
}

interface AxisSpan {
  start: number
  end: number
}

interface HoveredRow {
  id: string
  name: string
  side: 'before' | 'after'
  /** Where the row's period sits on the axis, so pairing can follow the dates. */
  span: AxisSpan | null
}

function rangeSpan(range: string | null | undefined): AxisSpan | null {
  if (!range) return null
  const parts = splitRange(range)
  if (!parts) return null
  return { start: axisOffset(parts.from), end: axisOffset(parts.to) }
}

function spansOverlap(a: AxisSpan | null, b: AxisSpan | null): boolean {
  if (!a || !b) return false
  return a.start < b.end && b.start < a.end
}

/** Row under the pointer, shared so Before and After highlight in step. */
const HoveredRowContext = createContext<{
  hoveredRow: HoveredRow | null
  setHoveredRow: (row: HoveredRow | null) => void
  /** Only Milestones pairs its rows this way; Rows and Timeline stay static. */
  isEnabled: boolean
}>({ hoveredRow: null, setHoveredRow: () => {}, isEnabled: false })

function useHoveredRow() {
  return useContext(HoveredRowContext)
}

function HoveredRowProvider({
  isEnabled,
  children,
}: {
  isEnabled: boolean
  children: ReactNode
}) {
  const [hoveredRow, setHoveredRow] = useState<HoveredRow | null>(null)
  const value = useMemo(
    () => ({ hoveredRow: isEnabled ? hoveredRow : null, setHoveredRow, isEnabled }),
    [hoveredRow, isEnabled]
  )
  return <HoveredRowContext.Provider value={value}>{children}</HoveredRowContext.Provider>
}

/** What the amendment did to this row — no fields already on the table. */
function rowChangeSummary(row: CompareRow): { title: string; detail?: string; from?: string; to?: string } | null {
  if (!row.after) return { title: `${row.name} removed` }
  if (!row.before) return { title: `${row.name} added` }

  const beforeQty = row.before.qty ? numericQuantity(row.before.qty) : null
  const afterQty = row.after.qty ? numericQuantity(row.after.qty) : null
  const qtyNoun = /apex platform|growth services|enterprise services/i.test(row.name)
    ? 'Seats'
    : 'Quantity'

  if (beforeQty !== null && afterQty !== null && beforeQty !== afterQty) {
    const verb = afterQty > beforeQty ? 'increased' : 'decreased'
    return {
      title: row.name,
      detail: `${qtyNoun} ${verb} from`,
      from: String(beforeQty),
      to: String(afterQty),
    }
  }

  if (row.before.unitPrice && row.after.unitPrice && row.before.unitPrice !== row.after.unitPrice) {
    const verb =
      parseMoney(row.after.unitPrice) > parseMoney(row.before.unitPrice) ? 'increased' : 'decreased'
    return {
      title: row.name,
      detail: `Unit price ${verb} from`,
      from: row.before.unitPrice,
      to: row.after.unitPrice,
    }
  }

  if (row.before.amount !== row.after.amount) {
    const verb =
      parseMoney(row.after.amount) > parseMoney(row.before.amount) ? 'increased' : 'decreased'
    return {
      title: row.name,
      detail: `Amount ${verb} from`,
      from: row.before.amount,
      to: row.after.amount,
    }
  }

  return null
}

/** Bubble spelling out what the amendment did to a row, anchored beside it. */
function RowChangeTooltip({ row, anchor }: { row: CompareRow; anchor: DOMRect }) {
  const summary = rowChangeSummary(row)
  if (!summary) return null
  // Flip to the left when the row sits too close to the window edge.
  const toLeft = anchor.right + 280 > window.innerWidth

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed z-[90] flex -translate-y-1/2 items-center',
        toLeft && '-translate-x-full flex-row-reverse'
      )}
      style={{
        left: toLeft ? anchor.left - 12 : anchor.right + 12,
        top: anchor.top + anchor.height / 2,
      }}
    >
      <span
        className={cn(
          'h-px w-3 border-t border-dashed border-neutral-300',
          toLeft ? 'ml-1.5' : 'mr-1.5'
        )}
      />
      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
        <p className="whitespace-nowrap text-[12px] font-medium text-brand-navy">{summary.title}</p>
        {summary.detail && (
          <p className="mt-0.5 whitespace-nowrap text-[12px] text-brand-navy">
            {summary.detail}
            {summary.from && summary.to && (
              <>
                {' '}
                <span className="font-medium text-red-700">{summary.from}</span>
                {' → '}
                <span className="font-medium text-green-700">{summary.to}</span>
              </>
            )}
          </p>
        )}
      </div>
    </div>,
    document.body
  )
}

function SectionCardRow({
  row,
  side,
  hasAmounts,
  periodRange,
  pairAcrossPeriods,
}: {
  row: CompareRow
  side: 'before' | 'after'
  hasAmounts: boolean
  /** This side's dates for the period the row sits in. */
  periodRange?: string | null
  /** A period on one side can span several on the other, so pair by product too. */
  pairAcrossPeriods?: boolean
}) {
  const cell = side === 'before' ? row.before : row.after
  const counterpart = side === 'before' ? row.after : row.before
  const { hoveredRow, setHoveredRow, isEnabled } = useHoveredRow()
  const span = useMemo(() => rangeSpan(periodRange), [periodRange])
  // Both sides render the same row id, so pointing at one lights up its twin.
  // Across periods the same line can appear several times, so it only pairs
  // where the two periods share time on the axis.
  const isHovered = Boolean(
    hoveredRow &&
      (hoveredRow.id === row.id ||
        (pairAcrossPeriods &&
          hoveredRow.side !== side &&
          hoveredRow.name === row.name &&
          spansOverlap(hoveredRow.span, span)))
  )

  // Only After explains the amendment; Before is the state being compared against.
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const explainsChange =
    isEnabled && side === 'after' && row.changed && Boolean(rowChangeSummary(row))

  const hoverProps = isEnabled
    ? {
        onMouseEnter: (event: React.MouseEvent<HTMLDivElement>) => {
          setHoveredRow({ id: row.id, name: row.name, side, span })
          if (explainsChange) setAnchor(event.currentTarget.getBoundingClientRect())
        },
        onMouseLeave: () => {
          setHoveredRow(null)
          setAnchor(null)
        },
      }
    : {}
  const tooltip = anchor && explainsChange ? <RowChangeTooltip row={row} anchor={anchor} /> : null
  // Matches the Tasks table: navy fill, white ink, pointer cursor.
  const rowClass = cn(
    'flex items-center gap-2 px-4 py-2 transition-colors',
    isEnabled && 'cursor-pointer',
    isHovered && 'bg-brand-navy'
  )

  if (!cell) {
    return (
      <div className={rowClass} {...hoverProps}>
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-[13px]',
            isHovered ? 'text-white/70' : 'text-brand-mist'
          )}
        >
          {row.name}
        </span>
        <span
          className={cn('shrink-0 text-[12px]', isHovered ? 'text-white/70' : 'text-brand-mist')}
        >
          {side === 'before' ? 'Not on this order' : 'Removed'}
        </span>
        {tooltip}
      </div>
    )
  }

  const qtyChanged = Boolean(
    row.changed && counterpart && cell.qty && counterpart.qty && cell.qty !== counterpart.qty
  )
  const amountChanged = Boolean(
    row.changed && (!counterpart || cell.amount !== counterpart.amount)
  )

  return (
    <div className={rowClass} {...hoverProps}>
      <span
        className={cn(
          'min-w-0 truncate text-[13px]',
          isHovered ? 'text-white' : 'text-brand-navy'
        )}
      >
        {row.name}
      </span>
      {cell.qty && (
        <span
          className={cn(
            'flex shrink-0 items-center gap-1 text-[12px]',
            isHovered ? 'text-white/70' : 'text-brand-fog'
          )}
        >
          <Highlight side={side} isActive={qtyChanged} variant="text" onDark={isHovered}>
            {cell.qty}
          </Highlight>
          <span>× {cell.unitPrice}</span>
        </span>
      )}
      <span
        className={cn(
          'ml-auto shrink-0 text-right text-[13px]',
          hasAmounts ? 'w-[104px]' : 'max-w-[52%] truncate'
        )}
      >
        <Highlight side={side} isActive={amountChanged} variant="text" onDark={isHovered}>
          {cell.amount}
        </Highlight>
      </span>
      {tooltip}
    </div>
  )
}

function splitRange(range: string): { from: string; to: string } | null {
  const [from, to] = range.split(' – ')
  if (!from || !to) return null
  return { from, to }
}

function DatePills({
  range,
  side,
  rangeChanged,
}: {
  range: string
  side: 'before' | 'after'
  rangeChanged?: boolean
}) {
  const parts = splitRange(range)
  if (!parts) {
    return <span className="text-[11px] text-brand-fog">{range}</span>
  }

  if (!rangeChanged) {
    return (
      <span className="text-[11px] text-brand-fog">
        {parts.from} – {parts.to}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <Highlight side={side} isActive variant="pill">
        {parts.from}
      </Highlight>
      <span className="text-brand-mist">–</span>
      <Highlight side={side} isActive variant="pill">
        {parts.to}
      </Highlight>
    </div>
  )
}

function SectionCard({
  rows,
  hasAmounts,
  totalLabel,
  side,
  showUnchanged,
  onToggleUnchanged,
  title,
  range,
  rangeChanged,
  nested,
  periodRange,
  pairAcrossPeriods,
}: {
  rows: CompareRow[]
  hasAmounts: boolean
  totalLabel?: string
  side: 'before' | 'after'
  showUnchanged: boolean
  onToggleUnchanged: () => void
  title?: string
  range?: string | null
  rangeChanged?: boolean
  /** Drops the card chrome so the rows can act as the body of an outer table. */
  nested?: boolean
  /** Kept apart from `range`, which only shows when the card has a header. */
  periodRange?: string | null
  pairAcrossPeriods?: boolean
}) {
  const changedRows = rows.filter((row) => row.changed)
  const unchangedRows = rows.filter((row) => !row.changed)

  const cellFor = (row: CompareRow) => (side === 'before' ? row.before : row.after)
  const sumOf = (list: CompareRow[]) =>
    list.reduce((sum, row) => {
      const cell = cellFor(row)
      return cell ? sum + parseMoney(cell.amount) : sum
    }, 0)

  const total = sumOf(rows)
  const counterTotal = rows.reduce((sum, row) => {
    const cell = side === 'before' ? row.after : row.before
    return cell ? sum + parseMoney(cell.amount) : sum
  }, 0)

  return (
    <div
      className={cn(
        'overflow-hidden',
        !nested &&
          (side === 'before'
            ? 'rounded-xl border border-neutral-200 bg-neutral-50'
            : 'rounded-xl border border-brand-navy bg-white')
      )}
    >
      {(title || range) && (
        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2">
          {title && (
            <span className="text-[13px] font-medium text-brand-navy">{title}</span>
          )}
          {range && <DatePills range={range} side={side} rangeChanged={rangeChanged} />}
        </div>
      )}
      <div className="divide-y divide-neutral-100">
        {changedRows.map((row) => (
          <SectionCardRow
            key={row.id}
            row={row}
            side={side}
            hasAmounts={hasAmounts}
            periodRange={periodRange}
            pairAcrossPeriods={pairAcrossPeriods}
          />
        ))}

        {unchangedRows.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-[12px] text-brand-fog">
              {unchangedRows.length} unchanged {unchangedRows.length === 1 ? 'item' : 'items'}
            </span>
            <button
              type="button"
              onClick={onToggleUnchanged}
              className="cursor-pointer text-[12px] font-medium text-blue-700 transition-colors hover:underline"
            >
              {showUnchanged ? 'Hide' : 'Show'}
            </button>
            {hasAmounts && (
              <span className="ml-auto w-[104px] shrink-0 text-right text-[12px] text-brand-fog">
                {money(sumOf(unchangedRows))}
              </span>
            )}
          </div>
        )}

        {showUnchanged &&
          unchangedRows.map((row) => (
            <SectionCardRow
              key={row.id}
              row={row}
              side={side}
              hasAmounts={hasAmounts}
              periodRange={periodRange}
              pairAcrossPeriods={pairAcrossPeriods}
            />
          ))}
      </div>

      {totalLabel && (
        <div
          className={cn(
            'flex items-center gap-2 border-t px-4 py-3',
            side === 'before' ? 'border-neutral-200' : 'border-brand-navy'
          )}
        >
          <span
            className={cn(
              'text-[11px] font-semibold uppercase tracking-[-0.25px]',
              side === 'before' ? 'text-brand-fog' : 'text-brand-navy'
            )}
          >
            {totalLabel}
          </span>
          <span
            className={cn(
              'ml-auto w-[104px] shrink-0 text-right',
              side === 'before' ? 'text-[14px]' : 'text-[16px] font-bold'
            )}
          >
            <Highlight side={side} isActive={total !== counterTotal} strong variant="text">
              {money(total)}
            </Highlight>
          </span>
        </div>
      )}
    </div>
  )
}

function DeltaColumn({
  label,
  detail,
  tone,
}: {
  label: string
  detail?: string
  tone?: 'positive'
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-brand-fog">
        <ArrowRight size={14} />
      </div>
      <span
        className={cn(
          'text-center text-[12px] font-medium',
          tone === 'positive' ? 'text-green-700' : 'text-brand-navy'
        )}
      >
        {label}
      </span>
      {detail && (
        <span className="text-center text-[11px] leading-snug text-brand-fog">{detail}</span>
      )}
    </div>
  )
}

function SectionCompare({ section }: { section: CompareSection }) {
  const allRows = section.groups.flatMap((group) => group.rows)
  const periodChanges = section.groups.filter((group) => group.periodChange).length
  const changedCount = allRows.filter((row) => row.changed).length + periodChanges
  const [isOpen, setIsOpen] = useState(changedCount > 0)
  const Chevron = isOpen ? ChevronDown : ChevronRight

  return (
    <section>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex cursor-pointer items-center gap-1.5 text-left"
      >
        <Chevron size={14} className="shrink-0 text-brand-mist" />
        <span className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          {section.title}
        </span>
        <span className="text-[12px] text-brand-fog">
          {changedCount > 0
            ? `${changedCount} ${changedCount === 1 ? 'change' : 'changes'}`
            : `${allRows.length} ${allRows.length === 1 ? 'field' : 'fields'} · No changes`}
        </span>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-6">
          {section.groups.map((group) => (
            <PeriodCompare
              key={group.id}
              group={group}
              hasAmounts={section.hasAmounts}
              totalLabel={section.totalLabel}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function AbsentPeriodCard({ side }: { side: 'before' | 'after' }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl border border-dashed border-neutral-200 px-4 py-10',
        side === 'before' && 'bg-neutral-50'
      )}
    >
      <span className="text-[12px] text-brand-mist">
        {side === 'before' ? 'Period did not exist' : 'Period no longer applies'}
      </span>
    </div>
  )
}

function PeriodCompare({
  group,
  hasAmounts,
  totalLabel,
}: {
  group: CompareGroup
  hasAmounts: boolean
  totalLabel?: string
}) {
  const changedCount =
    group.rows.filter((row) => row.changed).length + (group.periodChange ? 1 : 0)
  const [showUnchanged, setShowUnchanged] = useState(changedCount === 0)
  const beforeTotal = group.rows.reduce(
    (sum, row) => (row.before ? sum + parseMoney(row.before.amount) : sum),
    0
  )
  const afterTotal = group.rows.reduce(
    (sum, row) => (row.after ? sum + parseMoney(row.after.amount) : sum),
    0
  )

  const deltaLabel = (() => {
    if (group.periodChange === 'added') return 'New period'
    if (group.periodChange === 'removed') return 'Dropped'
    if (hasAmounts) return signedMoney(afterTotal - beforeTotal)
    return changedCount > 0 ? `${changedCount} changed` : 'No change'
  })()

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_148px_minmax(0,1fr)] items-stretch">
        {group.beforeRange === null && group.label ? (
          <AbsentPeriodCard side="before" />
        ) : (
          <SectionCard
            rows={group.rows}
            hasAmounts={hasAmounts}
            totalLabel={totalLabel}
            side="before"
            showUnchanged={showUnchanged}
            onToggleUnchanged={() => setShowUnchanged((open) => !open)}
            title={group.label}
            range={group.beforeRange}
            rangeChanged={group.rangeChanged}
          />
        )}
        <DeltaColumn
          label={deltaLabel}
          detail={
            changedCount > 0
              ? `${changedCount} ${changedCount === 1 ? 'change' : 'changes'}`
              : undefined
          }
        />
        {group.afterRange === null && group.label ? (
          <AbsentPeriodCard side="after" />
        ) : (
          <SectionCard
            rows={group.rows}
            hasAmounts={hasAmounts}
            totalLabel={totalLabel}
            side="after"
            showUnchanged={showUnchanged}
            onToggleUnchanged={() => setShowUnchanged((open) => !open)}
            title={group.label}
            range={group.afterRange}
            rangeChanged={group.rangeChanged}
          />
        )}
      </div>
    </div>
  )
}

function comparisonRowsFromItems(items: ProductLineItem[]): ComparisonRow[] {
  return [...items]
    .sort((a, b) => changeRank(a) - changeRank(b) || badgeRank(a) - badgeRank(b))
    .map((item) => ({
      id: item.id,
      before: beforeProduct(item),
      after: afterProduct(item),
      item,
    }))
}

function toCompareRows(rows: ComparisonRow[]): CompareRow[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.item.name,
    changed: Boolean(row.item.amendmentChange && row.item.amendmentChange !== 'unchanged'),
    change:
      row.item.amendmentChange && row.item.amendmentChange !== 'unchanged'
        ? row.item.amendmentChange
        : undefined,
    before: row.before
      ? {
          qty: row.before.quantity,
          unitPrice: row.before.unitPrice,
          amount: row.before.totalPrice,
        }
      : null,
    after: row.after
      ? {
          qty: row.after.quantity,
          unitPrice: row.after.unitPrice,
          amount: row.after.totalPrice,
        }
      : null,
  }))
}

function labelValueSection(
  id: string,
  title: string,
  values: LabelValue[]
): CompareSection {
  return {
    id,
    title,
    hasAmounts: false,
    groups: [
      {
        id: `${id}-fields`,
        beforeRange: null,
        afterRange: null,
        rangeChanged: false,
        rows: values.map((value) => ({
          id: `${id}-${value.label}`,
          name: value.label,
          before: { amount: value.value },
          after: { amount: value.value },
          changed: false,
        })),
      },
    ],
  }
}

/** ARR reads as a KPI on each side of the same grid the section cards use. */
function ArrKpiCompare({
  middleWidth = 148,
  columnGap = 0,
}: {
  middleWidth?: number
  columnGap?: number
}) {
  const delta = parseMoney(AMENDED_ARR) - parseMoney(ORIGINAL_ARR)

  const kpi = (value: string) => (
    <div className="text-center">
      <div
        className="font-heading text-[36px] font-bold leading-tight text-brand-navy"
        style={{ letterSpacing: '-1px' }}
      >
        {value}
      </div>
      <div className="mt-1 text-[13px] text-brand-navy">ARR</div>
    </div>
  )

  return (
    <div
      className="grid items-center pb-10"
      style={{
        gridTemplateColumns: `minmax(0,1fr) ${middleWidth}px minmax(0,1fr)`,
        columnGap,
      }}
    >
      {kpi(ORIGINAL_ARR)}
      <DeltaColumn label={signedMoney(delta)} tone={delta > 0 ? 'positive' : undefined} />
      {kpi(AMENDED_ARR)}
    </div>
  )
}

function periodRange(start: string, end: string): string {
  return `${start} – ${end}`
}

function periodGroup(period: RampPeriod): CompareGroup {
  const change = period.periodChange
  const afterRange = periodRange(period.startDate, period.endDate)
  const beforeRange = periodRange(
    period.previousStartDate ?? period.startDate,
    period.previousEndDate ?? period.endDate
  )

  if (change === 'added') {
    // A period the amendment introduces has no "before" side, so every line reads as new.
    const rows = toCompareRows(
      comparisonRowsFromItems(period.items.filter((item) => item.amendmentChange !== 'removed'))
    )
    return {
      id: period.id,
      label: period.label,
      beforeRange: null,
      afterRange,
      rangeChanged: false,
      periodChange: change,
      rows: rows.map((row) => ({ ...row, before: null, changed: true, change: 'added' as const })),
    }
  }

  if (change === 'removed') {
    const rows = toCompareRows(comparisonRowsFromItems(period.items))
    return {
      id: period.id,
      label: period.label,
      beforeRange,
      afterRange: null,
      rangeChanged: false,
      periodChange: change,
      rows: rows.map((row) => ({ ...row, after: null, changed: true, change: 'removed' as const })),
    }
  }

  return {
    id: period.id,
    label: period.label,
    beforeRange,
    afterRange,
    rangeChanged: beforeRange !== afterRange,
    periodChange: change,
    rows: toCompareRows(comparisonRowsFromItems(period.items)),
  }
}

function productsSection(
  items: ProductLineItem[],
  periods: RampPeriod[] | undefined
): CompareSection {
  return {
    id: 'products',
    title: 'Products and pricing',
    hasAmounts: true,
    totalLabel: 'Total',
    groups:
      periods && periods.length > 0
        ? periods.map(periodGroup)
        : [
            {
              id: 'products-all',
              beforeRange: null,
              afterRange: null,
              rangeChanged: false,
              rows: toCompareRows(comparisonRowsFromItems(items)),
            },
          ],
  }
}

function allocationRows(
  beforeAllocations: AllocationGroup[],
  afterAllocations: AllocationGroup[]
): CompareRow[] {
  const beforeById = new Map(beforeAllocations.map((allocation) => [allocation.id, allocation]))
  const afterById = new Map(afterAllocations.map((allocation) => [allocation.id, allocation]))
  const orderedIds = [
    ...afterAllocations.map((allocation) => allocation.id),
    ...beforeAllocations
      .filter((allocation) => !afterById.has(allocation.id))
      .map((allocation) => allocation.id),
  ]

  const toCell = (allocation: AllocationGroup): CompareCell => ({
    qty: allocation.units,
    unitPrice: allocation.kind === 'usage' ? 'credit' : 'entitlement',
    amount: `${allocation.sources.length} ${allocation.sources.length === 1 ? 'item' : 'items'}`,
  })

  return orderedIds.map((id) => {
    const before = beforeById.get(id)
    const after = afterById.get(id)
    const changed =
      !before ||
      !after ||
      before.units !== after.units ||
      before.kind !== after.kind ||
      JSON.stringify(before.sources) !== JSON.stringify(after.sources)

    return {
      id: `allocation-${id}`,
      name: after?.feature ?? before?.feature ?? id,
      before: before ? toCell(before) : null,
      after: after ? toCell(after) : null,
      changed,
      change: !before ? 'added' : !after ? 'removed' : undefined,
    }
  })
}

const TIMELINE_MONTHS = 36
const MONTH_HEIGHT = 34
const AMENDMENT_DATE = '2027-04-01'
const TODAY_DATE = '2027-02-15'
/** Where v1 was signed — the top of the axis, phrased like the period dates. */
const CONTRACT_START = 'May 1, 2026'

/** Months elapsed since the contract start (May 1, 2026), fractional within a month. */
function parseAxisDate(date: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(date)
}

function monthsFromStart(date: string): number {
  const value = parseAxisDate(date)
  return (value.getFullYear() - 2026) * 12 + (value.getMonth() - 4) + (value.getDate() - 1) / 30
}

function axisOffset(date: string): number {
  return monthsFromStart(date) * MONTH_HEIGHT
}

function tickLabel(monthIndex: number, short = false): string {
  const date = new Date(2026, 4 + monthIndex, 1)
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  if (monthIndex % 12 === 0 && !short) {
    return `${month} '${String(date.getFullYear()).slice(2)}`
  }
  return month
}

const AXIS_TERM_END = '2029-04-30'

/** The axis is a band: a left rail for Before dates, a right rail for After. */
const AXIS_COLUMN_WIDTH = 220
const AXIS_GUTTER = 24
const AXIS_BAND_HALF = 20
const RAIL_LEFT = `calc(50% - ${AXIS_BAND_HALF}px)`
const RAIL_RIGHT = `calc(50% + ${AXIS_BAND_HALF}px)`
const AMENDMENT_MARK_GRADIENT = 'amendment-mark-gradient'

interface AxisMark {
  id: string
  top: number
  title: string
  dateLabel: string
  detail?: string
  /** Opening boundary of a period — the dot a ramp gets folded into. */
  isPeriodStart?: boolean
}

/** Collapses marks that land within a few pixels, keeping the opening event. */
function mergeMarks(marks: AxisMark[]): AxisMark[] {
  return [...marks]
    .sort((a, b) => a.top - b.top)
    .reduce<AxisMark[]>((kept, mark) => {
      const previous = kept[kept.length - 1]
      if (!previous || mark.top - previous.top > 3) {
        kept.push(mark)
      } else if (mark.title.includes('begins')) {
        kept[kept.length - 1] = mark
      }
      return kept
    }, [])
}

/** Year bands, ramps and versions mirrored from the Tasks-page axis. */
const AXIS_YEARS = [
  { index: 1, date: '2026-05-01' },
  { index: 2, date: '2027-05-01' },
  { index: 3, date: '2028-05-01' },
] as const

const AXIS_RAMP_MARKERS = [
  {
    id: 'ramp-y2',
    date: '2027-05-01',
    title: 'Ramp · Year 2',
    detail: '+25 seats · +7% platform price',
    dateLabel: "May 1 '27",
  },
  {
    id: 'ramp-y3',
    date: '2028-05-01',
    title: 'Ramp · Year 3',
    detail: '+1 sandbox · +7% platform price',
    dateLabel: "May 1 '28",
  },
] as const

const AXIS_VERSION_MARKERS = [
  {
    id: 'v1',
    version: 'v1',
    title: 'Original contract',
    detail: 'SO-2026-0153 · 50 seats',
    date: '2026-05-01',
    dateLabel: "May 1 '26",
    tone: 'default',
  },
  {
    id: 'v2',
    version: 'v2',
    title: 'Contract expansion',
    detail: '+25 seats · +$32,000 ARR',
    date: AMENDMENT_DATE,
    dateLabel: "Apr 1 '27",
    tone: 'positive',
  },
] as const

interface AxisTooltip {
  key: string
  title: string
  detail?: string
  dateLabel: string
  tone?: 'default' | 'positive'
  /** Set when a rail mark is paired with its counterpart on the other rail. */
  sideLabel?: string
  placement: 'left' | 'right'
  rect: DOMRect
}

/** Lucide `flag` glyph used for the year milestones on the axis. */
function YearFlag({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path
        d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"
        fill="currentColor"
        fillOpacity={0.35}
      />
    </svg>
  )
}

/** The Tasks-page contract axis, rotated so time runs top to bottom. */
function VerticalContractAxis({
  height,
  banded = false,
  beforeMarks = [],
  afterMarks = [],
  trackHeight: trackHeightProp,
}: {
  height: number
  /** Milestones widens the axis into a band with a rail per side. */
  banded?: boolean
  beforeMarks?: AxisMark[]
  afterMarks?: AxisMark[]
  /** Cuts the axis short — Milestones ends it at the last period rather than the term. */
  trackHeight?: number
}) {
  const [tooltips, setTooltips] = useState<AxisTooltip[]>([])
  const [hoveredMark, setHoveredMark] = useState<string | null>(null)
  const markRefs = useRef<Map<string, HTMLElement>>(new Map())
  const todayTop = axisOffset(TODAY_DATE)
  const trackHeight = trackHeightProp ?? TIMELINE_MONTHS * MONTH_HEIGHT
  const ticks = Array.from({ length: TIMELINE_MONTHS / 3 + 1 }, (_, index) => index * 3).filter(
    (monthIndex) => monthIndex * MONTH_HEIGHT <= trackHeight
  )
  const inset = banded ? AXIS_BAND_HALF : 0

  const show = (
    event: React.MouseEvent<HTMLElement>,
    data: Omit<AxisTooltip, 'rect' | 'placement' | 'key'>
  ) => {
    setTooltips([
      {
        ...data,
        key: data.title,
        placement: 'right',
        rect: event.currentTarget.getBoundingClientRect(),
      },
    ])
  }

  const clear = () => {
    setTooltips([])
    setHoveredMark(null)
  }

  const centreGlyphs = [todayTop, ...AXIS_VERSION_MARKERS.map((marker) => axisOffset(marker.date))]

  // Contract-wide milestones ride both rails rather than the middle of the band.
  const rampMarks: AxisMark[] = AXIS_RAMP_MARKERS.map((ramp) => ({
    id: ramp.id,
    top: axisOffset(ramp.date),
    title: ramp.title,
    detail: ramp.detail,
    dateLabel: `${ramp.dateLabel} · upcoming`,
  }))

  const renewalMark: AxisMark = {
    id: 'renewal',
    top: axisOffset(AXIS_TERM_END) + MONTH_HEIGHT * 0.6,
    title: 'Renewal',
    dateLabel: "May 1 '29 · upcoming",
  }

  /**
   * A ramp is the step-up a period opens with, so it belongs on that period's
   * dot rather than a second one a few weeks away. Each ramp claims the closest
   * period start still unspoken for; leftovers (a rail with no periods) keep a
   * dot of their own at their own date.
   */
  const withRampsOnPeriodStarts = (marks: AxisMark[]): AxisMark[] => {
    const unclaimed = marks.filter((mark) => mark.isPeriodStart)
    const rampByStartId = new Map<string, AxisMark>()
    const strays: AxisMark[] = []

    rampMarks.forEach((ramp) => {
      const host = unclaimed.reduce<AxisMark | undefined>(
        (closest, start) =>
          !closest || Math.abs(start.top - ramp.top) < Math.abs(closest.top - ramp.top)
            ? start
            : closest,
        undefined
      )
      if (!host) {
        strays.push(ramp)
        return
      }
      unclaimed.splice(unclaimed.indexOf(host), 1)
      rampByStartId.set(host.id, ramp)
    })

    return [
      ...marks.map((mark) => {
        const ramp = rampByStartId.get(mark.id)
        return ramp ? { ...mark, detail: ramp.detail ?? ramp.title } : mark
      }),
      ...strays,
      renewalMark,
    ]
  }

  // A trimmed axis has no room for milestones past its end, such as renewal.
  const onTrack = (marks: AxisMark[]) => marks.filter((mark) => mark.top <= trackHeight)

  const rails = {
    before: onTrack(mergeMarks(withRampsOnPeriodStarts(beforeMarks))),
    after: onTrack(mergeMarks(withRampsOnPeriodStarts(afterMarks))),
  }

  /** A dot's footprint on the rail, so tick stubs can keep clear of it. */
  const railHasMarkAt = (side: 'before' | 'after', top: number) =>
    rails[side].some((mark) => Math.abs(mark.top - top) < 10)

  /** Hovering either rail reveals the same boundary on both sides. */
  const showPair = (id: string) => {
    setHoveredMark(id)
    setTooltips(
      (['before', 'after'] as const).flatMap<AxisTooltip>((side) => {
        const mark = rails[side].find((candidate) => candidate.id === id)
        const element = markRefs.current.get(`${side}-${id}`)
        if (!mark || !element) return []
        return [
          {
            key: `${side}-${id}`,
            title: mark.title,
            detail: mark.detail,
            dateLabel: mark.dateLabel,
            sideLabel: side === 'before' ? 'Before' : 'After',
            placement: side === 'before' ? 'left' : 'right',
            rect: element.getBoundingClientRect(),
          },
        ]
      })
    )
  }

  const renderRail = (side: 'before' | 'after') =>
    rails[side].map((mark) => {
      const isPast = mark.top < todayTop
      return (
      <button
        key={`${side}-${mark.id}`}
        ref={(node) => {
          const key = `${side}-${mark.id}`
          if (node) markRefs.current.set(key, node)
          else markRefs.current.delete(key)
        }}
        type="button"
        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-default"
        style={{ left: side === 'before' ? RAIL_LEFT : RAIL_RIGHT, top: mark.top }}
        onMouseEnter={() => showPair(mark.id)}
        onMouseLeave={clear}
        aria-label={`${mark.title}, ${mark.dateLabel}`}
      >
        <span
          className={cn(
            'block h-3.5 w-3.5 rounded-full bg-white transition-all duration-200',
            hoveredMark === mark.id && 'scale-110 shadow-[0_0_0_3px_rgba(163,163,163,0.18)]'
          )}
        >
          {side === 'before' ? (
            <span
              className={cn(
                'block h-3.5 w-3.5 rounded-full border border-neutral-400 bg-white',
                !isPast && 'border-dashed'
              )}
            />
          ) : (
            <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden className="block">
              {/* Opaque disc under the ring, so nothing shows through the dashes. */}
              <circle cx="7" cy="7" r="6.9" fill="#ffffff" />
              <circle
                cx="7"
                cy="7"
                r="6.3"
                fill="none"
                stroke={`url(#${AMENDMENT_MARK_GRADIENT})`}
                strokeWidth="1.25"
                strokeDasharray={isPast ? undefined : '3 3'}
              />
            </svg>
          )}
        </span>
      </button>
      )
    })

  return (
    // Raised so the scale stays legible over the period ribbons either side.
    <div className="relative z-10" style={{ height }}>
      {banded ? (
        <>
          <svg width={0} height={0} aria-hidden className="absolute">
            <defs>
              <linearGradient id={AMENDMENT_MARK_GRADIENT} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff3300" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          {/* One box carries the fill and both rails, capped at either end. */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 -translate-x-1/2 overflow-hidden rounded-lg border border-neutral-300 bg-neutral-50"
            style={{ width: AXIS_BAND_HALF * 2, height: trackHeight }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{
                height: todayTop,
                background:
                  'linear-gradient(180deg, rgba(255,51,0,0.12) 0%, rgba(139,92,246,0.16) 100%)',
              }}
            />
          </div>

          {/* Period boundaries and milestones: Before on the left rail, After on the right. */}
          {renderRail('before')}
          {renderRail('after')}
        </>
      ) : (
        <>
          {/* A single grey line with the elapsed span drawn over it. */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 w-0.5 -translate-x-1/2 rounded-full bg-neutral-200"
            style={{ height: trackHeight }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 w-0.5 -translate-x-1/2 rounded-full"
            style={{
              height: todayTop,
              background: 'linear-gradient(180deg, #ff3300 0%, #8b5cf6 100%)',
            }}
          />
        </>
      )}

      {/* Date scale — inside the band when it has width, otherwise beside the line. */}
      {ticks.map((monthIndex) => {
        const top = monthIndex * MONTH_HEIGHT
        // Inside the band the glyphs share the same lane, so yield to them.
        if (banded && centreGlyphs.some((glyph) => Math.abs(glyph - top) < 12)) return null

        return (
          <div key={`tick-${monthIndex}`}>
            {banded ? (
              // Stubs off each rail, so the month reads as marked on the band.
              // A stub yields to a boundary dot rather than striking through it.
              <>
                {!railHasMarkAt('before', top) && (
                  <span
                    aria-hidden
                    className="absolute h-px w-[5px] -translate-y-1/2 bg-neutral-300"
                    style={{ left: RAIL_LEFT, top }}
                  />
                )}
                {!railHasMarkAt('after', top) && (
                  <span
                    aria-hidden
                    className="absolute h-px w-[5px] -translate-y-1/2 bg-neutral-300"
                    style={{ left: `calc(50% + ${AXIS_BAND_HALF - 5}px)`, top }}
                  />
                )}
              </>
            ) : (
              <span
                aria-hidden
                className="absolute h-px w-1 -translate-y-1/2 bg-neutral-300"
                style={{ right: 'calc(50% + 1px)', top }}
              />
            )}
            <span
              className={cn(
                'absolute -translate-y-1/2 text-[10px] font-medium tracking-[0.02em]',
                banded ? 'left-1/2 w-8 -translate-x-1/2 text-center' : 'w-11 text-right',
                monthIndex % 12 === 0 ? 'font-semibold text-brand-navy' : 'text-brand-fog'
              )}
              style={banded ? { top } : { right: 'calc(50% + 9px)', top }}
            >
              {tickLabel(monthIndex, banded)}
            </span>
          </div>
        )
      })}

      {/* Year flags sit off the timeline axis; Milestones omits them. */}
      {!banded &&
        AXIS_YEARS.map((year) => (
          <div
            key={`year-${year.index}`}
            className="absolute flex -translate-y-1/2 items-center gap-1 whitespace-nowrap"
            style={{ right: `calc(50% + ${inset + 59}px)`, top: axisOffset(year.date) }}
          >
            <span className="text-[11px] font-medium leading-none text-brand-navy">
              Year {year.index}
            </span>
            <YearFlag className={year.index === 1 ? 'text-green-600' : 'text-neutral-400'} />
          </div>
        ))}

      {/* Markers sit on the line, labelled to its right. */}
      <div
        className="absolute left-1/2 top-0"
        style={{ height: TIMELINE_MONTHS * MONTH_HEIGHT }}
      >
        {/* Today */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: todayTop }}
          aria-label="Today"
        >
          <span className="block h-1.5 w-1.5 rotate-45 bg-blue-600" aria-hidden />
          <span
            className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold tracking-[-0.01em] text-blue-700"
            style={{ left: inset + 8 }}
          >
            Today
          </span>
        </div>

        {/* Ramps and renewal sit on the line itself when there are no rails. */}
        {!banded &&
          [...rampMarks, renewalMark].map((mark) => (
            <button
              key={mark.id}
              type="button"
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-default"
              style={{ top: mark.top }}
              onMouseEnter={(event) =>
                show(event, { title: mark.title, detail: mark.detail, dateLabel: mark.dateLabel })
              }
              onMouseLeave={clear}
              aria-label={mark.title}
            >
              <span
                className={cn(
                  'block h-3 w-3 rounded-full border border-dashed border-neutral-400 bg-white transition-all duration-200',
                  tooltips.some((entry) => entry.title === mark.title) &&
                    'scale-110 shadow-[0_0_0_3px_rgba(163,163,163,0.2)]'
                )}
              />
            </button>
          ))}

        {/* Signed versions */}
        {AXIS_VERSION_MARKERS.map((marker) => {
          const isPositive = marker.tone === 'positive'
          return (
            <div
              key={marker.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: axisOffset(marker.date) }}
            >
              <button
                type="button"
                className="cursor-default"
                onMouseEnter={(event) =>
                  show(event, {
                    title: marker.title,
                    detail: marker.detail,
                    dateLabel: marker.dateLabel,
                    tone: marker.tone,
                  })
                }
                onMouseLeave={clear}
                aria-label={`${marker.version}: ${marker.title}`}
              >
                <span
                  className={cn(
                    'flex h-3 w-3 items-center justify-center rounded-full text-[7px] font-bold leading-none ring-1',
                    isPositive
                      ? 'bg-green-600 text-white ring-green-600 shadow-[0_0_0_3px_rgba(22,163,74,0.14)]'
                      : 'bg-blue-50 text-blue-700 ring-blue-200'
                  )}
                >
                  {marker.version}
                </span>
              </button>
            </div>
          )
        })}

      </div>

      {tooltips.length > 0 &&
        createPortal(
          <>
            {tooltips.map((tooltip) => {
              const toLeft = tooltip.placement === 'left'
              return (
                <div
                  key={tooltip.key}
                  className={cn(
                    'pointer-events-none fixed z-[9999] flex -translate-y-1/2 items-center',
                    toLeft && '-translate-x-full flex-row-reverse'
                  )}
                  style={{
                    left: toLeft ? tooltip.rect.left - 10 : tooltip.rect.right + 10,
                    top: tooltip.rect.top + tooltip.rect.height / 2,
                  }}
                >
                  <span
                    className={cn(
                      'h-px w-3 border-t border-dashed border-neutral-300',
                      toLeft ? 'ml-1.5' : 'mr-1.5'
                    )}
                  />
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
                    {tooltip.sideLabel && (
                      <p className="text-[10px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
                        {tooltip.sideLabel}
                      </p>
                    )}
                    <p
                      className={cn(
                        'whitespace-nowrap text-[12px]',
                        tooltip.tone === 'positive'
                          ? 'font-semibold text-green-700'
                          : 'font-medium text-brand-navy'
                      )}
                    >
                      {tooltip.title}
                    </p>
                    {tooltip.detail && (
                      <p className="whitespace-nowrap text-[12px] text-brand-navy">
                        {tooltip.detail}
                      </p>
                    )}
                    <p className="mt-0.5 whitespace-nowrap text-[11px] text-brand-fog">
                      {tooltip.dateLabel}
                    </p>
                  </div>
                </div>
              )
            })}
          </>,
          document.body
        )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[-0.5px] text-brand-fog">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium text-brand-navy">{value}</p>
    </div>
  )
}

function sideTotal(group: CompareGroup, side: 'before' | 'after'): number {
  return group.rows.reduce((sum, row) => {
    const cell = side === 'before' ? row.before : row.after
    return cell ? sum + parseMoney(cell.amount) : sum
  }, 0)
}

/**
 * Resting state of a period on the axis: small enough to sit at its true date
 * without colliding with neighbouring periods.
 */
function TimelinePeriodChip({
  group,
  side,
  isOpen,
  onToggle,
}: {
  group: CompareGroup
  side: 'before' | 'after'
  isOpen: boolean
  onToggle: () => void
}) {
  const total = sideTotal(group, side)
  const counterTotal = sideTotal(group, side === 'before' ? 'after' : 'before')
  const range = side === 'before' ? group.beforeRange : group.afterRange
  const Chevron = isOpen ? ChevronDown : ChevronRight

  const note = (() => {
    if (side === 'before') return undefined
    if (group.periodChange === 'added') return 'New period'
    return total !== counterTotal ? signedMoney(total - counterTotal) : undefined
  })()

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left transition-colors',
        side === 'before' ? 'hover:bg-neutral-100' : 'hover:bg-neutral-50',
        isOpen && (side === 'before' ? 'bg-neutral-100/70' : 'bg-neutral-50')
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-brand-navy">{group.label}</span>
          {note && <span className="text-[11px] font-medium text-green-700">{note}</span>}
        </div>
        {/* Expanded, the range moves right to sit like a table header. */}
        {range && !isOpen && <p className="mt-0.5 text-[11px] text-brand-fog">{range}</p>}
      </div>
      {range && isOpen && (
        <span className="mr-1 shrink-0">
          <DatePills range={range} side={side} rangeChanged={group.rangeChanged} />
        </span>
      )}
      {!isOpen && (
        <span
          className={cn(
            'shrink-0 text-[13px] text-brand-navy',
            side === 'after' ? 'font-bold' : 'font-medium'
          )}
        >
          {money(total)}
        </span>
      )}
      <Chevron size={14} className="shrink-0 text-brand-fog" />
    </button>
  )
}

function TimelinePeriodCard({
  group,
  side,
  showHeader = true,
  nested,
}: {
  group: CompareGroup
  side: 'before' | 'after'
  showHeader?: boolean
  nested?: boolean
}) {
  const changedCount = group.rows.filter((row) => row.changed).length
  const [showUnchanged, setShowUnchanged] = useState(changedCount === 0)

  return (
    <SectionCard
      rows={group.rows}
      hasAmounts
      totalLabel="Total"
      side={side}
      showUnchanged={showUnchanged}
      onToggleUnchanged={() => setShowUnchanged((open) => !open)}
      title={showHeader ? group.label : undefined}
      range={showHeader ? (side === 'before' ? group.beforeRange : group.afterRange) : undefined}
      rangeChanged={group.rangeChanged}
      nested={nested}
      periodRange={side === 'before' ? group.beforeRange : group.afterRange}
      pairAcrossPeriods
    />
  )
}

/** Gutter plus half the axis column, stopping at the band's rail. */
const CONNECTOR_WIDTH = AXIS_GUTTER + AXIS_COLUMN_WIDTH / 2 - AXIS_BAND_HALF
/** Run the ribbon past the card edge so its rounded corner leaves no white wedge. */
const CONNECTOR_OVERLAP = 16
const CHIP_HEIGHT = 57

/**
 * Ribbon tying the period's stretch of the axis to its card: the period's span
 * at the line, the card's full height where it lands.
 */
function ChipConnector({
  side,
  span,
  landing,
  offset,
}: {
  side: 'before' | 'after'
  span: number
  /** Height of the whole card — header and table — the ribbon has to meet flush. */
  landing: number
  /** How far the card is pushed down to sit centred on the period. */
  offset: number
}) {
  const isBefore = side === 'before'
  const taper = CONNECTOR_WIDTH
  const w = taper + CONNECTOR_OVERLAP
  const axisX = isBefore ? w : 0
  // Where the card starts, and how far past it the ribbon runs.
  const edgeX = isBefore ? CONNECTOR_OVERLAP : taper
  const tuckX = isBefore ? 0 : w
  const c1 = isBefore ? edgeX + taper * 0.55 : taper * 0.45
  const c2 = isBefore ? edgeX + taper * 0.45 : taper * 0.55
  const cardTop = offset
  const cardBottom = offset + landing
  const height = Math.max(span, cardBottom)

  // Both edges sweep from the period's stretch of the axis onto the card, so the
  // ribbon funnels whichever way the card's height compares to its span.
  const ribbon = [
    `M ${axisX} 0`,
    `C ${c1} 0, ${c2} ${cardTop}, ${edgeX} ${cardTop}`,
    `L ${tuckX} ${cardTop}`,
    `L ${tuckX} ${cardBottom}`,
    `L ${edgeX} ${cardBottom}`,
    `C ${c2} ${cardBottom}, ${c1} ${span}, ${axisX} ${span}`,
    'Z',
  ].join(' ')

  return (
    <svg
      aria-hidden
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={cn(
        'pointer-events-none absolute top-0',
        isBefore ? 'text-neutral-200' : 'text-green-200'
      )}
      style={{ [isBefore ? 'right' : 'left']: -taper }}
    >
      <path d={ribbon} fill="currentColor" fillOpacity={0.22} />
    </svg>
  )
}

/** Chip pinned to the period start, with the full table revealed on demand. */
function TimelinePeriodSlot({
  group,
  side,
  top,
  span,
  isOpen,
  isTopMost,
  onToggle,
  onRaise,
}: {
  group: CompareGroup
  side: 'before' | 'after'
  top: number
  span: number
  isOpen: boolean
  isTopMost: boolean
  onToggle: () => void
  onRaise: () => void
}) {
  // The card grows and shrinks as its table opens, and the ribbon has to meet
  // the whole of it, so measure rather than assume.
  const cardRef = useRef<HTMLDivElement>(null)
  const [landing, setLanding] = useState(CHIP_HEIGHT)

  useEffect(() => {
    const node = cardRef.current
    if (!node) return
    const measure = () => setLanding(node.getBoundingClientRect().height)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // A card shorter than its period rides the middle of it, so the ribbon tapers
  // evenly from both ends rather than hanging off the period's start.
  const offset = Math.max(0, (span - landing) / 2)

  return (
    <div className="absolute inset-x-0" style={{ top }} onMouseDown={onRaise}>
      {/* Left unstacked so the ribbon stays beneath the axis and its markers. */}
      <ChipConnector side={side} span={span} landing={landing} offset={offset} />
      {/* Above the ribbon, so its tucked-in edge hides behind the card. */}
      <div
        ref={cardRef}
        className={cn(
          'relative overflow-hidden rounded-xl border',
          side === 'before'
            ? 'border-neutral-200 bg-neutral-50'
            : 'border-brand-navy bg-white',
          isOpen && 'shadow-xl'
        )}
        // Whichever period you touch last stacks above the ones below it, so a
        // table that grows past its span stays readable.
        style={{ marginTop: offset, zIndex: isOpen ? (isTopMost ? 30 : 20) : 1 }}
      >
        <TimelinePeriodChip group={group} side={side} isOpen={isOpen} onToggle={onToggle} />
        {isOpen && (
          <div
            className={cn(
              'border-t',
              side === 'before' ? 'border-neutral-200' : 'border-brand-navy'
            )}
          >
            <TimelinePeriodCard group={group} side={side} showHeader={false} nested />
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineProductList({
  products,
  tone,
}: {
  products: ComparisonProduct[]
  tone: 'before' | 'after'
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200">
      {products.map((product) => (
        <div
          key={product.name}
          className="flex items-center gap-3 border-b border-neutral-100 px-3 py-2 last:border-b-0"
        >
          <span className="min-w-0 flex-1 truncate text-[12px] text-brand-navy">
            {product.name}
          </span>
          <span className="shrink-0 text-[11px] text-brand-fog">
            ×{numericQuantity(product.quantity)}
          </span>
          <span
            className={cn(
              'w-[84px] shrink-0 text-right text-[12px] font-medium',
              tone === 'after' ? 'text-green-700' : 'text-brand-navy'
            )}
          >
            {product.totalPrice}
          </span>
        </div>
      ))}
    </div>
  )
}

function CompareSidePill({ side }: { side: 'before' | 'after' }) {
  const isBefore = side === 'before'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[-0.5px]',
        isBefore ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
      )}
    >
      {isBefore ? 'Before' : 'After'}
    </span>
  )
}

/** Before and After columns flanking a shared vertical time axis. */
function TimeAxisView({
  rows,
  periods,
  variant,
}: {
  rows: ComparisonRow[]
  periods?: RampPeriod[]
  /** `cards` drops the full table on the axis, `chips` reveals it on demand. */
  variant: 'cards' | 'chips'
}) {
  const beforeProducts = rows
    .map((row) => row.before)
    .filter((product): product is ComparisonProduct => product !== null)
  const afterProducts = rows
    .map((row) => row.after)
    .filter((product): product is ComparisonProduct => product !== null)

  // Milestones charts Before from the signed contract: Period 1 ran from v1,
  // and the amendment is what moved its boundaries.
  const chartPeriods = (periods ?? []).map((period, index) =>
    variant === 'chips' && index === 0
      ? { ...period, previousStartDate: period.previousStartDate ?? CONTRACT_START }
      : period
  )

  const beforePeriodCards = chartPeriods
    .filter((period) => period.periodChange !== 'added')
    .map((period) => {
      const top = axisOffset(period.previousStartDate ?? period.startDate)
      return {
        id: period.id,
        group: periodGroup(period),
        top,
        span: axisOffset(period.previousEndDate ?? period.endDate) - top,
      }
    })
  const afterPeriodCards = chartPeriods
    .filter((period) => period.periodChange !== 'removed')
    .map((period) => {
      const top = axisOffset(period.startDate)
      return {
        id: period.id,
        group: periodGroup(period),
        top,
        span: axisOffset(period.endDate) - top,
      }
    })
  const periodMarks = (side: 'before' | 'after'): AxisMark[] =>
    chartPeriods
      .filter((period) => period.periodChange !== (side === 'before' ? 'added' : 'removed'))
      .flatMap((period) => {
        const start =
          side === 'before' ? period.previousStartDate ?? period.startDate : period.startDate
        const end = side === 'before' ? period.previousEndDate ?? period.endDate : period.endDate
        return [
          {
            id: `${period.id}-start`,
            top: axisOffset(start),
            title: `${period.label} begins`,
            dateLabel: start,
            isPeriodStart: true,
          },
          {
            id: `${period.id}-end`,
            top: axisOffset(end),
            title: `${period.label} ends`,
            dateLabel: end,
          },
        ]
      })

  const periodKey = (side: 'before' | 'after', id: string) => `${side}:${id}`
  const [openPeriods, setOpenPeriods] = useState<Set<string>>(() => {
    const keys = new Set<string>()
    beforePeriodCards.forEach((period) => keys.add(periodKey('before', period.id)))
    afterPeriodCards.forEach((period) => keys.add(periodKey('after', period.id)))
    return keys
  })
  const isOpen = (side: 'before' | 'after', id: string) => openPeriods.has(periodKey(side, id))
  const [topMostPeriod, setTopMostPeriod] = useState<string | null>(null)
  const raisePeriod = (side: 'before' | 'after', id: string) =>
    setTopMostPeriod(periodKey(side, id))
  const togglePeriod = (side: 'before' | 'after', id: string) => {
    const key = periodKey(side, id)
    setTopMostPeriod(key)
    setOpenPeriods((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Milestones only charts the ramp periods, so the axis ends with the last one
  // instead of running on to the term end.
  const lastPeriodEnd = [...beforePeriodCards, ...afterPeriodCards].reduce(
    (furthest, period) => Math.max(furthest, period.top + period.span),
    0
  )
  const fullTrack = TIMELINE_MONTHS * MONTH_HEIGHT
  const trackHeight =
    variant === 'chips' && lastPeriodEnd > 0
      ? Math.min(fullTrack, lastPeriodEnd + MONTH_HEIGHT / 2)
      : fullTrack
  const axisHeight = trackHeight + 80

  const renderPeriod = (
    side: 'before' | 'after',
    period: { id: string; group: CompareGroup; top: number; span: number }
  ) =>
    variant === 'chips' ? (
      <TimelinePeriodSlot
        key={period.id}
        group={period.group}
        side={side}
        top={period.top}
        span={period.span}
        isOpen={isOpen(side, period.id)}
        isTopMost={topMostPeriod === periodKey(side, period.id)}
        onToggle={() => togglePeriod(side, period.id)}
        onRaise={() => raisePeriod(side, period.id)}
      />
    ) : (
      <div key={period.id} className="absolute inset-x-0" style={{ top: period.top }}>
        <TimelinePeriodCard group={period.group} side={side} />
      </div>
    )

  return (
    <div className="mx-auto max-w-[1240px] px-8 pb-20">
      <div
        className={cn(
          'z-40 grid grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] gap-6 bg-white pt-6',
          // Milestones scrolls the header away; Timeline keeps it in view.
          variant === 'chips' ? 'pb-4' : 'sticky top-0'
        )}
      >
        <div className="text-center">
          <CompareSidePill side="before" />
          {variant === 'chips' && <p className="mt-0.5 text-[12px] text-brand-fog">v1 · live today</p>}
        </div>
        <div />
        <div className="text-center">
          <CompareSidePill side="after" />
          {variant === 'chips' && (
            <p className="mt-0.5 text-[12px] text-brand-fog">v2 · effective Apr 1, 2027</p>
          )}
        </div>
      </div>

      {variant === 'chips' && <ArrKpiCompare middleWidth={220} columnGap={24} />}

      <div
        className="relative mt-4 grid grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] gap-6"
        style={{ minHeight: axisHeight }}
      >
        <div className="relative">
          {beforePeriodCards.length > 0 ? (
            beforePeriodCards.map((period) => renderPeriod('before', period))
          ) : (
            <div className="absolute inset-x-0 top-0">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[-0.5px] text-brand-fog">
                    v1 · Active
                  </span>
                  <span className="text-[12px] text-brand-fog">SO-2026-0153</span>
                </div>
                <h3 className="mt-2 font-heading text-[15px] font-semibold tracking-[-0.5px] text-brand-navy">
                  Existing sales order
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="Total ARR" value="$193,500.00" />
                  <Metric label="Term" value="May 2026 – Apr 2029" />
                </div>
                <TimelineProductList products={beforeProducts} tone="before" />
              </div>
            </div>
          )}
        </div>

        <VerticalContractAxis
          height={axisHeight}
          banded={variant === 'chips'}
          beforeMarks={periodMarks('before')}
          afterMarks={periodMarks('after')}
          trackHeight={trackHeight}
        />

        <div className="relative">
          {afterPeriodCards.length > 0 ? (
            afterPeriodCards.map((period) => renderPeriod('after', period))
          ) : (
            <div className="absolute inset-x-0" style={{ top: axisOffset(AMENDMENT_DATE) }}>
              <div className="rounded-xl border border-brand-navy bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[-0.5px] text-green-700">
                    v2 · Draft
                  </span>
                  <span className="text-[12px] text-brand-fog">Effective Apr 1, 2027</span>
                </div>
                <h3 className="mt-2 font-heading text-[15px] font-semibold tracking-[-0.5px] text-brand-navy">
                  Resulting sales order
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="Total ARR" value={AMENDED_ARR} />
                  <Metric label="Credit note" value={CREDIT_NOTE_TOTAL} />
                </div>
                <TimelineProductList products={afterProducts} tone="after" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EntitlementsMilestoneView({
  beforeAllocations,
  afterAllocations,
}: {
  beforeAllocations: AllocationGroup[]
  afterAllocations: AllocationGroup[]
}) {
  const rows = useMemo(
    () => allocationRows(beforeAllocations, afterAllocations),
    [beforeAllocations, afterAllocations]
  )
  const [showUnchanged, setShowUnchanged] = useState(false)
  const amendmentTop = axisOffset(AMENDMENT_DATE)
  const trackHeight = amendmentTop + MONTH_HEIGHT * 2
  const axisHeight = trackHeight + 80
  const amendmentMark: AxisMark = {
    id: 'entitlements-amendment',
    top: amendmentTop,
    title: 'Entitlements updated',
    detail: 'Changes become active',
    dateLabel: 'Apr 1, 2027',
  }
  const countKpi = (count: number) => (
    <div className="text-center">
      <div
        className="font-heading text-[36px] font-bold leading-tight text-brand-navy"
        style={{ letterSpacing: '-1px' }}
      >
        {count}
      </div>
      <div className="mt-1 text-[13px] text-brand-navy">Entitlements</div>
    </div>
  )

  return (
    <div className="mx-auto max-w-[1240px] px-8 pb-20">
      <div className="sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] gap-6 bg-white pb-4 pt-6">
        <div className="text-center">
          <CompareSidePill side="before" />
          <p className="mt-0.5 text-[12px] text-brand-fog">v1 · live today</p>
        </div>
        <div />
        <div className="text-center">
          <CompareSidePill side="after" />
          <p className="mt-0.5 text-[12px] text-brand-fog">v2 · effective Apr 1, 2027</p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] items-center gap-6 pb-10">
        {countKpi(beforeAllocations.length)}
        <DeltaColumn
          label={`${afterAllocations.length - beforeAllocations.length >= 0 ? '+' : ''}${afterAllocations.length - beforeAllocations.length}`}
          tone={afterAllocations.length > beforeAllocations.length ? 'positive' : undefined}
        />
        {countKpi(afterAllocations.length)}
      </div>

      <div
        className="relative mt-4 grid grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] gap-6"
        style={{ minHeight: axisHeight }}
      >
        <div className="relative">
          <div className="absolute inset-x-0" style={{ top: amendmentTop }}>
            <SectionCard
              rows={rows}
              hasAmounts={false}
              side="before"
              showUnchanged={showUnchanged}
              onToggleUnchanged={() => setShowUnchanged((open) => !open)}
              title="Entitlements and credits"
            />
          </div>
        </div>

        <VerticalContractAxis
          height={axisHeight}
          banded
          beforeMarks={[amendmentMark]}
          afterMarks={[amendmentMark]}
          trackHeight={trackHeight}
        />

        <div className="relative">
          <div className="absolute inset-x-0" style={{ top: amendmentTop }}>
            <SectionCard
              rows={rows}
              hasAmounts={false}
              side="after"
              showUnchanged={showUnchanged}
              onToggleUnchanged={() => setShowUnchanged((open) => !open)}
              title="Entitlements and credits"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

type ComparisonView = 'rows' | 'timeline' | 'milestones'
type MilestoneContent = 'products' | 'entitlements'

function MilestoneContentToggle({
  value,
  onChange,
}: {
  value: MilestoneContent
  onChange: (next: MilestoneContent) => void
}) {
  const options = [
    { id: 'products' as const, label: 'Products and pricing' },
    { id: 'entitlements' as const, label: 'Entitlements' },
  ]

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-neutral-100 p-0.5"
      aria-label="Milestone comparison content"
    >
      {options.map((option) => {
        const isActive = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              'cursor-pointer rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors',
              isActive
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-brand-fog hover:text-brand-navy'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ComparisonView
  onChange: (next: ComparisonView) => void
}) {
  const options = [
    { id: 'rows' as const, label: 'Rows', icon: Columns3 },
    { id: 'timeline' as const, label: 'Timeline', icon: GitCommitVertical },
    { id: 'milestones' as const, label: 'Milestones', icon: Milestone },
  ]

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 p-0.5">
      {options.map((option) => {
        const Icon = option.icon
        const isActive = view === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors',
              isActive
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-brand-fog hover:text-brand-navy'
            )}
          >
            <Icon size={14} />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function SalesOrderAmendmentComparison({
  isOpen,
  onClose,
  customerName,
  items,
  periods,
  allocations,
  beforeAllocations,
  account,
  terms,
}: SalesOrderAmendmentComparisonProps) {
  const rows = useMemo<ComparisonRow[]>(
    () =>
      periods && periods.length > 0
        ? comparisonRowsFromItems(periods[0].items)
        : comparisonRowsFromItems(items),
    [items, periods]
  )
  const sections = useMemo<CompareSection[]>(
    () => [
      labelValueSection('customer', 'Customer info', account),
      labelValueSection('terms', 'Terms and billing', terms),
      productsSection(items, periods),
    ],
    [account, terms, items, periods]
  )
  const [view, setView] = useState<ComparisonView>('rows')
  const [milestoneContent, setMilestoneContent] = useState<MilestoneContent>('products')

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-white">
      <header className="flex h-[60px] shrink-0 items-center border-b border-neutral-200 px-12">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="font-heading text-[16px] font-semibold text-brand-navy"
              style={{ letterSpacing: '-0.5px' }}
            >
              Sales order amendment comparison
            </h1>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[-0.5px] text-amber-700">
              Amendment
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-brand-fog">{customerName} · SO-2026-0153</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {view === 'milestones' && (
            <MilestoneContentToggle value={milestoneContent} onChange={setMilestoneContent} />
          )}
          <ViewToggle view={view} onChange={setView} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            title="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      <HoveredRowProvider isEnabled={view === 'milestones'}>
        <div className="min-h-0 flex-1 overflow-y-auto bg-white">
          {view === 'milestones' && milestoneContent === 'entitlements' ? (
            <EntitlementsMilestoneView
              beforeAllocations={beforeAllocations}
              afterAllocations={allocations}
            />
          ) : view === 'timeline' || view === 'milestones' ? (
            <TimeAxisView
              rows={rows}
              periods={periods}
              variant={view === 'timeline' ? 'cards' : 'chips'}
            />
          ) : (
            <div className="mx-auto max-w-[1320px] px-12 pb-20">
              <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_148px_minmax(0,1fr)] bg-white pb-4 pt-8">
                <div className="text-center">
                  <CompareSidePill side="before" />
                  <p className="mt-0.5 text-[12px] text-brand-fog">v1 · live today</p>
                </div>
                <div />
                <div className="text-center">
                  <CompareSidePill side="after" />
                  <p className="mt-0.5 text-[12px] text-brand-fog">v2 · effective Apr 1, 2027</p>
                </div>
              </div>

              <ArrKpiCompare />

              <div className="space-y-10">
                {sections.map((section) => (
                  <SectionCompare key={section.id} section={section} />
                ))}
              </div>
            </div>
          )}
        </div>
      </HoveredRowProvider>
    </div>,
    document.body
  )
}
