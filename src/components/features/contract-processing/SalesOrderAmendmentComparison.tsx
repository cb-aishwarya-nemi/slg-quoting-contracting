import { useEffect, useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, CircleMinus, CirclePlus, Minus, TrendingUp, X } from 'lucide-react'
import type { ProductLineItem } from '@/data/contractProcessingMock'
import { cn } from '@/lib/utils'

interface SalesOrderAmendmentComparisonProps {
  isOpen: boolean
  onClose: () => void
  customerName: string
  items: ProductLineItem[]
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

const CREDIT_NOTE_TOTAL = '$37,500.00'

function numericQuantity(quantity: string): number {
  const value = Number(quantity)
  return Number.isFinite(value) ? value : 0
}

function money(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function beforeProduct(item: ProductLineItem): ComparisonProduct | null {
  if (item.amendmentChange === 'added') return null

  const quantity =
    item.amendmentChange === 'quantity-increased' && item.previousQuantity
      ? item.previousQuantity
      : item.quantity
  const unitPrice = Number(item.unitPrice.replace(/[$,]/g, ''))
  const totalPrice =
    item.amendmentChange === 'quantity-increased' && Number.isFinite(unitPrice)
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

function ProductCard({
  product,
  tone,
  isMuted,
}: {
  product: ComparisonProduct
  tone: 'before' | 'after'
  isMuted: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-3.5',
        tone === 'after' && !isMuted ? 'border-emerald-200' : 'border-neutral-200',
        isMuted && 'opacity-60'
      )}
    >
      <p className="truncate text-[13px] font-medium text-brand-navy">{product.name}</p>
      <p className="mt-0.5 text-[11px] text-brand-fog">
        {product.unitPrice} · {product.billingPeriod}
      </p>
      <div className="mt-2.5 flex items-baseline justify-between border-t border-neutral-100 pt-2.5">
        <span className="text-[11px] text-brand-fog">
          Qty {numericQuantity(product.quantity)}
        </span>
        <span className="text-[13px] font-medium text-brand-navy">{product.totalPrice}</span>
      </div>
    </div>
  )
}

function EmptyCard({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[92px] items-center justify-center rounded-lg border border-dashed border-neutral-200 px-3.5 py-3.5">
      <span className="text-[11px] text-brand-mist">{label}</span>
    </div>
  )
}

function ChangeCard({ item }: { item: ProductLineItem }) {
  if (item.amendmentChange === 'quantity-increased') {
    const previous = numericQuantity(item.previousQuantity ?? '0')
    const next = numericQuantity(item.quantity)
    const unitPrice = Number(item.unitPrice.replace(/[$,]/g, ''))
    const delta = Number.isFinite(unitPrice) ? money(unitPrice * (next - previous)) : ''

    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-blue-700">
          <TrendingUp size={13} />
          Quantity increased
        </div>
        <div className="mt-2 flex items-center gap-2 text-[16px] font-semibold text-brand-navy">
          <span className="text-brand-mist">{previous}</span>
          <ArrowRight size={14} className="text-brand-fog" />
          <span>{next}</span>
        </div>
        <p className="mt-1 text-[11px] text-blue-800">
          +{next - previous} seats · +{delta} ARR
        </p>
      </div>
    )
  }

  if (item.amendmentChange === 'added') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700">
          <CirclePlus size={13} />
          Added
        </div>
        <p className="mt-2 text-[13px] font-medium text-brand-navy">
          {numericQuantity(item.quantity)} × {item.unitPrice}
        </p>
        <p className="mt-1 text-[11px] text-emerald-800">
          {item.proration
            ? `First charge prorated to ${item.proration.amount}`
            : `${item.totalPrice} per ${item.billingPeriod.toLowerCase()}`}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50/70 p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-red-700">
        <CircleMinus size={13} />
        Removed
      </div>
      <p className="mt-2 text-[13px] font-medium text-brand-navy">{item.totalPrice} dropped</p>
      <p className="mt-1 text-[11px] text-red-700">Credit note {CREDIT_NOTE_TOTAL}</p>
    </div>
  )
}

function NoChangeCell() {
  return (
    <div className="flex h-full items-center justify-center">
      <Minus size={14} className="text-neutral-300" />
    </div>
  )
}

/** Ticked spine between columns — the time axis from the reference layout. */
function Rail({ isFirst, isLast }: { isFirst?: boolean; isLast?: boolean }) {
  return (
    <div className="relative flex justify-center">
      <div
        className={cn(
          'absolute w-px bg-neutral-200',
          isFirst ? 'top-6' : 'top-0',
          isLast ? 'bottom-6' : 'bottom-0'
        )}
      />
      <div className="absolute top-1/2 h-px w-2 -translate-y-1/2 bg-neutral-300" />
    </div>
  )
}

function ComparisonGridRow({
  before,
  change,
  after,
  isFirst,
  isLast,
}: {
  before: ReactNode
  change: ReactNode
  after: ReactNode
  isFirst?: boolean
  isLast?: boolean
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] items-stretch">
      <div className="py-2.5">{before}</div>
      <Rail isFirst={isFirst} isLast={isLast} />
      <div className="py-2.5">{change}</div>
      <Rail isFirst={isFirst} isLast={isLast} />
      <div className="py-2.5">{after}</div>
    </div>
  )
}

function ColumnHeading({
  eyebrow,
  title,
  meta,
  tone,
}: {
  eyebrow: string
  title: string
  meta: string
  tone: 'before' | 'change' | 'after'
}) {
  return (
    <div>
      <span
        className={cn(
          'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]',
          tone === 'before' && 'bg-neutral-100 text-brand-fog',
          tone === 'change' && 'bg-orange-50 text-orange-700',
          tone === 'after' && 'bg-emerald-50 text-emerald-700'
        )}
      >
        {eyebrow}
      </span>
      <h2 className="mt-1.5 font-heading text-[15px] font-semibold tracking-[-0.3px] text-brand-navy">
        {title}
      </h2>
      <p className="mt-0.5 text-[11px] text-brand-fog">{meta}</p>
    </div>
  )
}

export function SalesOrderAmendmentComparison({
  isOpen,
  onClose,
  customerName,
  items,
}: SalesOrderAmendmentComparisonProps) {
  const rows = useMemo<ComparisonRow[]>(
    () =>
      [...items]
        .sort((a, b) => changeRank(a) - changeRank(b))
        .map((item) => ({
          id: item.id,
          before: beforeProduct(item),
          after: afterProduct(item),
          item,
        })),
    [items]
  )

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

  const beforeCount = rows.filter((row) => row.before).length
  const afterCount = rows.filter((row) => row.after).length

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-white">
      <header className="flex h-16 shrink-0 items-center border-b border-neutral-200 px-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-[18px] font-semibold tracking-[-0.4px] text-brand-navy">
              Sales order amendment comparison
            </h1>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              AMENDMENT
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-brand-fog">{customerName} · SO-2026-0153</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comparison"
          className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
        >
          <X size={19} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-50">
        <div className="mx-auto max-w-[1320px] px-8 pb-16">
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] bg-neutral-50 pb-3 pt-6">
            <ColumnHeading
              eyebrow="Before"
              title="Existing sales order"
              meta={`v1 · live today · ${beforeCount} items`}
              tone="before"
            />
            <div />
            <ColumnHeading
              eyebrow="What's changing"
              title="This amendment"
              meta="Effective Apr 1, 2027"
              tone="change"
            />
            <div />
            <ColumnHeading
              eyebrow="After"
              title="Resulting sales order"
              meta={`v2 · draft · ${afterCount} items`}
              tone="after"
            />
          </div>

          <ComparisonGridRow
            isFirst
            before={
              <div className="rounded-lg border border-neutral-200 bg-white p-3.5">
                <p className="text-[11px] uppercase tracking-[-0.2px] text-brand-fog">Total ARR</p>
                <p className="mt-1 text-[18px] font-semibold text-brand-navy">$193,500.00</p>
                <p className="mt-1 text-[11px] text-brand-fog">May 1, 2026 – Apr 30, 2029</p>
              </div>
            }
            change={
              <div className="rounded-lg border border-orange-200 bg-orange-50/70 p-3.5">
                <p className="text-[11px] uppercase tracking-[-0.2px] text-orange-700">ARR impact</p>
                <p className="mt-1 text-[18px] font-semibold text-brand-navy">+$32,000.00</p>
                <p className="mt-1 text-[11px] text-orange-800">Term unchanged</p>
              </div>
            }
            after={
              <div className="rounded-lg border border-emerald-200 bg-white p-3.5">
                <p className="text-[11px] uppercase tracking-[-0.2px] text-brand-fog">Total ARR</p>
                <p className="mt-1 text-[18px] font-semibold text-brand-navy">$225,500.00</p>
                <p className="mt-1 text-[11px] text-brand-fog">Apr 1, 2027 – Apr 30, 2029</p>
              </div>
            }
          />

          {rows.map((row, index) => {
            const isUnchanged =
              !row.item.amendmentChange || row.item.amendmentChange === 'unchanged'

            return (
              <ComparisonGridRow
                key={row.id}
                isLast={index === rows.length - 1}
                before={
                  row.before ? (
                    <ProductCard product={row.before} tone="before" isMuted={isUnchanged} />
                  ) : (
                    <EmptyCard label="Not on this order" />
                  )
                }
                change={isUnchanged ? <NoChangeCell /> : <ChangeCard item={row.item} />}
                after={
                  row.after ? (
                    <ProductCard product={row.after} tone="after" isMuted={isUnchanged} />
                  ) : (
                    <EmptyCard label="Removed" />
                  )
                }
              />
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
