import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, Flag, X } from 'lucide-react'
import { scheduledInvoices, creditNotePreview } from '@/data/contractProcessingMock'
import { cn } from '@/lib/utils'
import { DownstreamRefreshIndicator } from './DownstreamRefreshIndicator'
import { GradientSparkle } from './GradientSparkle'

const FIRST_INVOICE_ID = 'INV-2026-0042'

export interface InvoiceLevelDiscount {
  value: string
  unit: '%' | 'USD'
}

interface InvoicePreviewProps {
  isFlashing?: boolean
  invoiceLevelDiscount?: InvoiceLevelDiscount | null
  contractVersion?: 'original' | 'amendment'
  onViewBreakdown?: () => void
  hideSectionHeader?: boolean
}

function parseMoney(value: string): number {
  const amount = parseFloat(value.replace(/[^\d.]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function invoiceDiscountLabel(discount: InvoiceLevelDiscount): string {
  const raw = parseFloat(discount.value)
  if (!Number.isFinite(raw) || raw <= 0) return ''
  if (discount.unit === 'USD') return `${formatMoney(raw)} off`
  return `${raw}% off`
}

function invoiceDiscountDollars(
  discount: InvoiceLevelDiscount | null | undefined,
  subtotal: number
): number {
  if (!discount) return 0
  const raw = parseFloat(discount.value)
  if (!Number.isFinite(raw) || raw <= 0) return 0
  if (discount.unit === 'USD') return Math.min(raw, subtotal)
  return subtotal * (raw / 100)
}

export function InvoicePreview({
  isFlashing,
  invoiceLevelDiscount,
  contractVersion = 'amendment',
  onViewBreakdown,
  hideSectionHeader = false,
}: InvoicePreviewProps) {
  const originalInvoice = scheduledInvoices[FIRST_INVOICE_ID]
  const amendmentBase = scheduledInvoices['INV-2027-0046']
  const invoice =
    contractVersion === 'original'
      ? originalInvoice
      : {
          ...amendmentBase,
          lineItems: amendmentBase.lineItems
            .filter((line) => !line.name.startsWith('Implementation services'))
            .map((line) => {
              if (line.name.startsWith('Apex platform - growth services')) {
                return {
                  ...line,
                  qty: '75',
                  unitPrice: '$600.00',
                  amount: '$45,000.00',
                }
              }
              if (line.name.startsWith('Sandbox environments')) {
                return {
                  ...line,
                  unitPrice: '$125.00',
                  amount: '$375.00',
                  prorated: true,
                  proratedLabel: 'Apr 1 – Apr 30, 2027 · 1 of 12 months',
                  proration: {
                    period: 'Apr 1 – Apr 30, 2027',
                    fullPeriod: '$4,500.00 per year (3 sandboxes)',
                    portion: '1 of 12 months',
                    rate: '$125.00 per sandbox per month',
                    formula: '$4,500.00 × 1/12 = $375.00',
                  },
                }
              }
              return line
            }),
          subtotal: '$50,750.00',
          total: '$50,750.00',
          notes:
            'Upcoming invoice reflecting this amendment. Sandbox environments is new and billed prorated for Apr 2027; from May 1, 2027 it bills $1,125.00 per quarter.',
        }
  const subtotal = parseMoney(invoice.subtotal)
  const tax = parseMoney(invoice.tax)
  const discount = invoiceDiscountDollars(invoiceLevelDiscount, subtotal)
  const total = subtotal - discount + tax

  return (
    <div className="group/section">
      {!hideSectionHeader && (
        <div className="relative mb-4 flex items-center gap-3">
          {isFlashing && (
            <span className="title-sweep-overlay" aria-hidden="true">
              <span className="title-sweep-band" />
            </span>
          )}

          <span className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
            {contractVersion === 'original'
              ? 'Original invoice preview'
              : 'Upcoming invoice preview'}
          </span>
          <DownstreamRefreshIndicator
            label={
              contractVersion === 'original'
                ? 'Original invoice preview'
                : 'Upcoming invoice preview'
            }
          />
          {contractVersion !== 'original' && onViewBreakdown && (
            <button
              type="button"
              onClick={onViewBreakdown}
              className="ml-auto shrink-0 cursor-pointer text-[12px] font-medium text-blue-700 hover:underline"
            >
              View breakdown
            </button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-navy bg-white">
        {/* Invoice header */}
        <div className="flex items-start justify-between px-7 pb-5 pt-6">
          <div>
            <h3 className="font-heading text-[18px] font-semibold tracking-[-0.5px] text-brand-navy">
              Invoice
            </h3>
            <p className="mt-1 text-[12px] text-brand-fog">{invoice.number}</p>
            <span className="mt-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[-0.5px] text-brand-fog">
              Draft preview
            </span>
          </div>

          <div className="text-right">
            <div className="flex items-baseline justify-end gap-3">
              <span className="text-[11px] uppercase tracking-[-0.5px] text-brand-fog">Issue date</span>
              <span className="text-[13px] text-brand-navy">{invoice.issueDate}</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-end gap-3">
              <span className="text-[11px] uppercase tracking-[-0.5px] text-brand-fog">Due date</span>
              <span className="text-[13px] text-brand-navy">{invoice.dueDate}</span>
            </div>
          </div>
        </div>

      {/* Bill to */}
      <div className="border-b border-neutral-100 px-7 py-5">
        <p className="mb-2 text-[11px] uppercase tracking-[-0.5px] text-brand-fog">Bill to</p>
        <p className="text-[14px] font-medium text-brand-navy">{invoice.billTo.company}</p>
        <p className="text-[13px] text-brand-fog">{invoice.billTo.contact}</p>
        <p className="text-[13px] text-brand-fog">{invoice.billTo.line1}</p>
        <p className="text-[13px] text-brand-fog">{invoice.billTo.cityLine}</p>
        <p className="text-[13px] text-brand-fog">{invoice.billTo.country}</p>
      </div>

      {/* Line items */}
      <div className="px-7 py-5">
        <div className="flex items-center border-b border-neutral-200 pb-2">
          <div className="flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Description
          </div>
          <div className="w-[56px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Qty
          </div>
          <div className="w-[110px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Unit price
          </div>
          <div className="w-[110px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Discount
          </div>
          <div className="w-[124px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Amount
          </div>
        </div>

        {invoice.lineItems.map((line) => (
          <div key={line.name} className="flex items-start border-b border-neutral-100 py-2.5">
            <div className="min-w-0 flex-1">
              <span className="text-[14px] text-brand-navy">{line.name}</span>
              {(line.prorated || line.proratedLabel) && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  {line.proratedLabel && (
                    <p className="text-[12px] text-brand-fog">{line.proratedLabel}</p>
                  )}
                  {line.prorated && (
                    <span className="shrink-0 text-[12px] text-brand-fog">Prorated</span>
                  )}
                </div>
              )}
            </div>
            <div className="w-[56px] shrink-0 pt-0.5 text-right text-[14px] text-brand-navy">{line.qty}</div>
            <div className="w-[110px] shrink-0 pt-0.5 text-right text-[14px] text-brand-navy">{line.unitPrice}</div>
            <div className="w-[110px] shrink-0 pt-0.5 text-right text-[14px] text-brand-navy">
              {line.discount ? `(${line.discount})` : '–'}
            </div>
            <div className="w-[124px] shrink-0 pt-0.5 text-right text-[14px] text-brand-navy">{line.amount}</div>
          </div>
        ))}

        {/* Totals */}
        <div className="mt-4 flex flex-col items-end gap-2">
          <div className="flex w-[280px] items-center justify-between">
            <span className="text-[13px] text-brand-fog">Subtotal</span>
            <span className="text-[14px] text-brand-navy">{formatMoney(subtotal)}</span>
          </div>
          {discount > 0 && invoiceLevelDiscount ? (
            <div className="flex w-[280px] items-center justify-between">
              <span className="text-[13px] text-brand-fog">
                {invoiceDiscountLabel(invoiceLevelDiscount)}
              </span>
              <span className="text-[14px] text-brand-navy">
                {`(${formatMoney(discount).replace('$', '$ ')})`}
              </span>
            </div>
          ) : null}
          <div className="flex w-[280px] items-center justify-between">
            <span className="text-[13px] text-brand-fog">Tax</span>
            <span className="text-[14px] text-brand-navy">{formatMoney(tax)}</span>
          </div>
          <div className="flex w-[280px] items-center justify-between border-t border-neutral-200 pt-2">
            <span className="text-[13px] font-semibold text-brand-navy">Total due</span>
            <span className="font-heading text-[16px] font-bold text-brand-navy">
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>

        {/* Notes */}
        <div className="border-t border-neutral-100 bg-neutral-50 px-7 py-4">
          <p className="text-[12px] text-brand-fog">{invoice.notes}</p>
        </div>
      </div>
    </div>
  )
}

export function CreditNotePreview({
  isFlashing,
  onViewBreakdown,
  hideSectionHeader = false,
}: {
  isFlashing?: boolean
  onViewBreakdown?: () => void
  hideSectionHeader?: boolean
}) {
  const creditNote = creditNotePreview
  const subtotal = parseMoney(creditNote.subtotal)
  const tax = parseMoney(creditNote.tax)
  const total = subtotal + tax

  return (
    <div className="group/section">
      {!hideSectionHeader && (
        <div className="relative mb-4 flex items-center gap-3">
          {isFlashing && (
            <span className="title-sweep-overlay" aria-hidden="true">
              <span className="title-sweep-band" />
            </span>
          )}

          <span className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
            Credit note preview
          </span>
          <DownstreamRefreshIndicator label="Credit note preview" />
          {onViewBreakdown && (
            <button
              type="button"
              onClick={onViewBreakdown}
              className="ml-auto shrink-0 cursor-pointer text-[12px] font-medium text-blue-700 hover:underline"
            >
              View breakdown
            </button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-navy bg-white">
        <div className="flex items-start justify-between px-7 pb-5 pt-6">
          <div>
            <h3 className="font-heading text-[18px] font-semibold tracking-[-0.5px] text-brand-navy">
              Credit note
            </h3>
            <p className="mt-1 text-[12px] text-brand-fog">{creditNote.number}</p>
            <span className="mt-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[-0.5px] text-brand-fog">
              Draft preview
            </span>
          </div>

          <div className="text-right">
            <div className="flex items-baseline justify-end gap-3">
              <span className="text-[11px] uppercase tracking-[-0.5px] text-brand-fog">Issue date</span>
              <span className="text-[13px] text-brand-navy">{creditNote.issueDate}</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-end gap-3">
              <span className="text-[11px] uppercase tracking-[-0.5px] text-brand-fog">Effective date</span>
              <span className="text-[13px] text-brand-navy">{creditNote.dueDate}</span>
            </div>
          </div>
        </div>

        <div className="border-b border-neutral-100 px-7 py-5">
          <p className="mb-2 text-[11px] uppercase tracking-[-0.5px] text-brand-fog">Credit to</p>
          <p className="text-[14px] font-medium text-brand-navy">{creditNote.billTo.company}</p>
          <p className="text-[13px] text-brand-fog">{creditNote.billTo.contact}</p>
          <p className="text-[13px] text-brand-fog">{creditNote.billTo.line1}</p>
          <p className="text-[13px] text-brand-fog">{creditNote.billTo.cityLine}</p>
          <p className="text-[13px] text-brand-fog">{creditNote.billTo.country}</p>
        </div>

        <div className="px-7 py-5">
          <div className="flex items-center border-b border-neutral-200 pb-2">
            <div className="flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
              Description
            </div>
            <div className="w-[56px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
              Qty
            </div>
            <div className="w-[110px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
              Unit price
            </div>
            <div className="w-[110px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
              Discount
            </div>
            <div className="w-[124px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
              Amount
            </div>
          </div>

          {creditNote.lineItems.map((line) => (
            <div key={line.name} className="flex items-start border-b border-neutral-100 py-2.5">
              <div className="min-w-0 flex-1">
                <span className="text-[14px] text-brand-navy">{line.name}</span>
                {(line.prorated || line.proratedLabel) && (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {line.proratedLabel && (
                      <p className="text-[12px] text-brand-fog">{line.proratedLabel}</p>
                    )}
                    {line.prorated && (
                      <span className="shrink-0 text-[12px] text-brand-fog">Prorated</span>
                    )}
                  </div>
                )}
              </div>
              <div className="w-[56px] shrink-0 pt-0.5 text-right text-[14px] text-brand-navy">{line.qty}</div>
              <div className="w-[110px] shrink-0 pt-0.5 text-right text-[14px] text-brand-navy">{line.unitPrice}</div>
              <div className="w-[110px] shrink-0 pt-0.5 text-right text-[14px] text-brand-navy">
                {line.discount ? `(${line.discount})` : '–'}
              </div>
              <div className="w-[124px] shrink-0 pt-0.5 text-right text-[14px] text-brand-navy">{line.amount}</div>
            </div>
          ))}

          <div className="mt-4 flex flex-col items-end gap-2">
            <div className="flex w-[280px] items-center justify-between">
              <span className="text-[13px] text-brand-fog">Subtotal</span>
              <span className="text-[14px] text-brand-navy">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex w-[280px] items-center justify-between">
              <span className="text-[13px] text-brand-fog">Tax</span>
              <span className="text-[14px] text-brand-navy">{formatMoney(tax)}</span>
            </div>
            <div className="flex w-[280px] items-center justify-between border-t border-neutral-200 pt-2">
              <span className="text-[13px] font-semibold text-brand-navy">Total credit</span>
              <span className="font-heading text-[16px] font-bold text-brand-navy">
                {formatMoney(total)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-100 bg-neutral-50 px-7 py-4">
          <p className="text-[12px] text-brand-fog">{creditNote.notes}</p>
        </div>
      </div>
    </div>
  )
}

export type BreakdownView = 'invoice' | 'credit-note'

/** Apr 1 sits 59 days into the 89-day Feb 1 – Apr 30 cycle. */
const CHANGE_PERCENT = 66.3

/** Interior dates only — the anchors carry the cycle's own start and end. */
const CYCLE_TICKS = [
  { label: 'Feb 15', percent: 15.7 },
  { label: 'Mar 1', percent: 31.5 },
  { label: 'Mar 15', percent: 47.2 },
  { label: 'Apr 15', percent: 82.0 },
]

const REMAINING_FILL =
  'linear-gradient(90deg, rgba(255,51,0,0.06) 0%, rgba(139,92,246,0.14) 100%)'

function BillingCycleTimeline() {
  return (
    <section className="px-2">
      <div className="relative">
        {/* Anchors: cycle start, the change, and the next bill. */}
        <div className="relative h-[52px]">
          <div className="absolute left-0 top-0">
            <Flag size={12} className="text-brand-mist" />
            <p className="mt-1.5 text-[12px] font-medium text-brand-navy">Cycle Start</p>
            <p className="mt-0.5 text-[11px] text-brand-fog">Feb 1</p>
          </div>

          <div
            className="absolute top-0 -translate-x-1/2 text-center"
            style={{ left: `${CHANGE_PERCENT}%` }}
          >
            <span className="flex justify-center">
              <GradientSparkle size={12} strokeWidth={2.5} />
            </span>
            <p className="mt-1.5 whitespace-nowrap text-[12px] font-semibold text-violet-700">
              Change Date
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] text-violet-600">Apr 1, 2027</p>
          </div>

          <div className="absolute right-0 top-0 text-right">
            <Calendar size={12} className="ml-auto text-brand-mist" />
            <p className="mt-1.5 whitespace-nowrap text-[12px] font-medium text-brand-navy">
              Next Billing
            </p>
            <p className="mt-0.5 text-[11px] text-brand-fog">May 1</p>
          </div>
        </div>

        {/* Interior date scale, each label stubbed down onto the bar. */}
        <div className="relative h-[18px]">
          {CYCLE_TICKS.map((tick) => (
            <div
              key={tick.label}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${tick.percent}%` }}
            >
              <span className="text-[11px] text-brand-fog">{tick.label}</span>
              <span className="mt-0.5 h-1.5 w-px bg-neutral-300" aria-hidden />
            </div>
          ))}
          {/* The change date drops its own line onto the split. */}
          <span
            aria-hidden
            className="absolute bottom-0 top-0 w-px -translate-x-1/2 bg-violet-300"
            style={{ left: `${CHANGE_PERCENT}%` }}
          />
        </div>

        {/* Elapsed vs remaining, split at the change date. */}
        <div className="relative flex h-[26px] overflow-hidden rounded border border-neutral-200">
          <div
            className="flex items-center justify-center border-r border-violet-300 bg-neutral-100"
            style={{ width: `${CHANGE_PERCENT}%` }}
          >
            <span className="text-[11px] text-brand-fog">Used · 59d (66%)</span>
          </div>
          <div
            className="flex flex-1 items-center justify-center"
            style={{ background: REMAINING_FILL }}
          >
            <span className="text-[11px] font-medium text-violet-700">
              Remaining · 30d (34%)
            </span>
          </div>
        </div>

        {/* Ribbon carrying the remaining span down into the prorated cards. */}
        <div className="relative h-16">
          <span
            aria-hidden
            className="absolute -top-1 z-10 h-2 w-2 -translate-x-1/2 rounded-full border border-violet-500 bg-white"
            style={{ left: `${CHANGE_PERCENT}%` }}
          />
          <svg
            className="h-16 w-full"
            viewBox="0 0 1000 64"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="breakdown-ribbon" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff3300" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.13} />
              </linearGradient>
            </defs>
            <path
              d={`M ${CHANGE_PERCENT * 10} 0 C ${CHANGE_PERCENT * 10} 40, 70 20, 40 64 L 960 64 C 962 26, 1000 30, 1000 0 Z`}
              fill="url(#breakdown-ribbon)"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

interface BreakdownRow {
  item: string
  qty: string
  unitPrice: string
  period: string
  periodNote?: string
  amount: string
  formula: string
}

/**
 * Amount table shared by the invoice and credit note cards, styled like the
 * comparison section cards: full-bleed rules, snug rows, heavy total rule.
 */
function BreakdownTable({
  tone,
  periodHeading,
  rows,
  netTotal,
  dateLabel,
  dateValue,
}: {
  tone: 'invoice' | 'credit'
  periodHeading: string
  rows: BreakdownRow[]
  netTotal: string
  dateLabel: string
  dateValue: string
}) {
  const isInvoice = tone === 'invoice'
  const amountTone = isInvoice ? 'text-green-700' : 'text-brand-navy'
  const totalRule = isInvoice ? 'border-brand-navy' : 'border-neutral-300'

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-neutral-200 text-[10px] uppercase tracking-[-0.25px] text-brand-fog">
          <th className="py-2 pl-4 pr-3 text-left font-normal">Item</th>
          <th className="w-px whitespace-nowrap px-3 py-2 text-right font-normal">Qty</th>
          <th className="w-px whitespace-nowrap px-3 py-2 text-right font-normal">Unit price</th>
          <th className="w-px whitespace-nowrap px-3 py-2 text-left font-normal">
            {periodHeading}
          </th>
          <th className="w-px whitespace-nowrap py-2 pl-3 pr-4 text-right font-normal">
            Net amount
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {rows.map((row) => (
          <tr key={row.item}>
            <td className="py-2.5 pl-4 pr-3 align-top text-brand-navy">{row.item}</td>
            <td className="whitespace-nowrap px-3 py-2.5 text-right align-top tabular-nums text-brand-fog">
              {row.qty}
            </td>
            <td className="whitespace-nowrap px-3 py-2.5 text-right align-top text-brand-fog">
              {row.unitPrice}
              <span>/mo</span>
            </td>
            <td className="whitespace-nowrap px-3 py-2.5 align-top text-brand-navy">
              <span className="block">{row.period}</span>
              {row.periodNote && (
                <span className="mt-0.5 block text-[11px] text-brand-fog">{row.periodNote}</span>
              )}
            </td>
            <td
              className={cn(
                'whitespace-nowrap py-2.5 pl-3 pr-4 text-right align-top tabular-nums',
                amountTone
              )}
            >
              <span className="block font-medium">{row.amount}</span>
              <span className="mt-0.5 block text-[11px] font-normal text-brand-fog">
                {row.formula}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className={cn('border-t', totalRule)}>
          <td
            colSpan={4}
            className="py-3 pl-4 pr-3 text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-navy"
          >
            Net total
          </td>
          <td
            className={cn(
              'whitespace-nowrap py-3 pl-3 pr-4 text-right align-top font-heading text-[16px] font-bold tabular-nums',
              amountTone
            )}
          >
            <span className="block">{netTotal}</span>
            <span className="mt-1 block text-[11px] font-normal text-brand-fog">
              {dateLabel} · {dateValue}
            </span>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

function InvoiceAmountBreakdown() {
  const rows: BreakdownRow[] = [
    {
      item: 'Sandbox environments',
      qty: '3',
      unitPrice: '$125.00',
      period: 'Apr 1 – Apr 30, 2027',
      periodNote: 'months',
      amount: '$375.00',
      formula: '3 × $125.00 × 1 month',
    },
  ]

  return (
    <section className="overflow-hidden rounded-xl border border-green-200 bg-green-50/40">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2">
        <span className="text-[13px] font-medium text-brand-navy">Invoice amount breakdown</span>
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
          INV-2027-0046
        </span>
      </div>
      <BreakdownTable
        tone="invoice"
        periodHeading="Active period"
        rows={rows}
        netTotal="$375.00"
        dateLabel="Invoice date"
        dateValue="May 1, 2027"
      />
    </section>
  )
}

function CreditNoteAmountBreakdown() {
  const removedItem = creditNotePreview.lineItems[0]
  const rows: BreakdownRow[] = [
    {
      item: removedItem.name,
      qty: '1',
      unitPrice: removedItem.unitPrice,
      period: 'Apr 1, 2027 – Apr 30, 2029',
      periodNote: '25 of 36 months',
      amount: `−${removedItem.amount}`,
      formula: '$1,500.00 × 25 months',
    },
  ]

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-300 bg-neutral-50/70">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2">
        <span className="text-[13px] font-medium text-brand-navy">
          Credit note amount breakdown
        </span>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-brand-navy">
          {creditNotePreview.number}
        </span>
      </div>
      <BreakdownTable
        tone="credit"
        periodHeading="Unused period"
        rows={rows}
        netTotal={`−${creditNotePreview.total}`}
        dateLabel="Credit note date"
        dateValue={creditNotePreview.issueDate}
      />
    </section>
  )
}

export function BillingBreakdownView({
  view,
  customerName,
  onClose,
}: {
  view: BreakdownView | null
  customerName: string
  onClose: () => void
}) {
  useEffect(() => {
    if (!view) return
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
  }, [view, onClose])

  if (!view) return null

  const title = 'Billing change breakdown'

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-white">
      <header className="flex h-[60px] shrink-0 items-center border-b border-neutral-200 px-12">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="font-heading text-[16px] font-semibold text-brand-navy"
              style={{ letterSpacing: '-0.5px' }}
            >
              {title}
            </h1>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[-0.5px] text-amber-700">
              Amendment
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-brand-fog">
            {customerName} · SO-2026-0153
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title.toLowerCase()}`}
          title="Close"
          className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto bg-neutral-50/60">
        <div className="mx-auto max-w-[1040px] px-12 pb-20 pt-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
              What&apos;s changing
            </span>
            <p className="text-[13px] text-brand-navy">
              Amendment effective Apr 1, 2027 — charges and credits are prorated within the
              current billing cycle.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white px-8 pb-8 pt-7">
            <BillingCycleTimeline />

            <div className="mx-[4%] space-y-4">
              <InvoiceAmountBreakdown />
              <CreditNoteAmountBreakdown />

              <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50/60 px-5 py-3.5">
                <div>
                  <p className="text-[11px] uppercase tracking-[-0.25px] text-brand-fog">
                    Net billing adjustment
                  </p>
                  <p className="mt-0.5 text-[12px] text-brand-fog">
                    $375.00 invoiced less $37,500.00 credited
                  </p>
                </div>
                <p className="font-heading text-[18px] font-semibold text-violet-700">
                  −$37,125.00
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>,
    document.body
  )
}

export default InvoicePreview
