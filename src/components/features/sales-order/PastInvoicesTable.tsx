import { ArrowRight } from 'lucide-react'
import { SectionRuleTitle } from './SectionRuleTitle'
import { cn } from '@/lib/utils'
import { STATUS_STYLES } from '@/data/invoiceListMock'
import { type PastInvoiceLine } from '@/data/salesOrderMock'

function openInvoiceViewer(invoiceId: string) {
  window.open(
    `/invoice-viewer.html?invoice=${encodeURIComponent(invoiceId)}`,
    `invoice-${invoiceId}`,
    'popup,width=720,height=860'
  )
}

function PastInvoiceRow({
  invoice,
  isLast,
}: {
  invoice: PastInvoiceLine
  isLast: boolean
}) {
  const statusStyle = STATUS_STYLES[invoice.status]
  const statusLabel = invoice.statusDetail ?? invoice.status

  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto_auto] items-center gap-4 py-3',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <button
        type="button"
        onClick={() => openInvoiceViewer(invoice.invoiceId)}
        className="cursor-pointer text-left text-[14px] font-medium text-blue-700 transition-colors hover:text-blue-800 hover:underline"
      >
        {invoice.invoiceId}
      </button>
      <span className="text-[14px] text-brand-fog">{invoice.date}</span>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap',
          statusStyle.bg,
          statusStyle.text
        )}
      >
        {statusLabel}
      </span>
      <span className="min-w-[96px] text-right text-[14px] font-semibold text-brand-navy">
        {invoice.amount}
      </span>
    </div>
  )
}

export function PastInvoicesTable({
  invoices,
  onViewAll,
}: {
  invoices: PastInvoiceLine[]
  onViewAll?: () => void
}) {
  return (
    <div className="w-full max-w-[780px]">
      <SectionRuleTitle
        trailing={
          onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-blue-700 transition-colors hover:text-blue-800"
            >
              View all
              <ArrowRight size={14} />
            </button>
          ) : null
        }
      >
        Past invoices
      </SectionRuleTitle>
      <div className="mt-4">
        {invoices.map((invoice, idx) => (
          <PastInvoiceRow
            key={invoice.id}
            invoice={invoice}
            isLast={idx === invoices.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
