import { ExternalLink, Check, Clock, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  paymentSchedule,
  scheduledInvoices,
  type PaymentScheduleItem,
  type ScheduledInvoice,
} from '@/data/contractProcessingMock'

const STATUS_CONFIG = {
  paid: {
    icon: Check,
    badge: 'bg-green-50 text-green-700',
    label: 'Paid',
  },
  pending: {
    icon: Clock,
    badge: 'bg-amber-50 text-amber-700',
    label: 'Due soon',
  },
  upcoming: {
    icon: CalendarClock,
    badge: 'bg-neutral-100 text-brand-fog',
    label: 'Upcoming',
  },
} as const

function generateInvoiceHtml(invoice: ScheduledInvoice): string {
  const lineItemsHtml = invoice.lineItems
    .map(
      (line) => `
      <tr style="border-bottom: 1px solid #f5f5f5;">
        <td style="padding: 10px 0; font-size: 14px; color: #1c1b2e;">${line.name}</td>
        <td style="padding: 10px 0; font-size: 14px; color: #1c1b2e; text-align: right; width: 60px;">${line.qty}</td>
        <td style="padding: 10px 0; font-size: 14px; color: #1c1b2e; text-align: right; width: 110px;">${line.unitPrice}</td>
        <td style="padding: 10px 0; font-size: 14px; color: #1c1b2e; text-align: right; width: 124px;">${line.amount}</td>
      </tr>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.number}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f5f5f5; padding: 40px; }
        .invoice { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { padding: 24px 28px 20px; border-bottom: 1px solid #f5f5f5; display: flex; justify-content: space-between; }
        .header h1 { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 600; color: #1c1b2e; letter-spacing: -0.5px; }
        .header .number { font-size: 12px; color: #6b6885; margin-top: 4px; }
        .header .dates { text-align: right; }
        .header .date-row { display: flex; justify-content: flex-end; gap: 12px; align-items: baseline; margin-bottom: 6px; }
        .header .date-label { font-size: 11px; text-transform: uppercase; letter-spacing: -0.5px; color: #6b6885; }
        .header .date-value { font-size: 13px; color: #1c1b2e; }
        .bill-to { padding: 20px 28px; border-bottom: 1px solid #f5f5f5; }
        .bill-to-label { font-size: 11px; text-transform: uppercase; letter-spacing: -0.5px; color: #6b6885; margin-bottom: 8px; }
        .bill-to-company { font-size: 14px; font-weight: 500; color: #1c1b2e; }
        .bill-to-line { font-size: 13px; color: #6b6885; }
        .line-items { padding: 20px 28px; }
        .line-items table { width: 100%; border-collapse: collapse; }
        .line-items th { font-size: 11px; font-weight: 400; text-transform: uppercase; letter-spacing: -0.5px; color: #1c1b2e; padding-bottom: 8px; border-bottom: 1px solid #e5e5e5; text-align: left; }
        .line-items th:nth-child(2), .line-items th:nth-child(3), .line-items th:nth-child(4) { text-align: right; }
        .totals { margin-top: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .totals .row { display: flex; width: 280px; justify-content: space-between; }
        .totals .row-label { font-size: 13px; color: #6b6885; }
        .totals .row-value { font-size: 14px; color: #1c1b2e; }
        .totals .total-row { border-top: 1px solid #e5e5e5; padding-top: 8px; }
        .totals .total-label { font-size: 13px; font-weight: 600; color: #1c1b2e; }
        .totals .total-value { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 600; color: #1c1b2e; }
        .notes { padding: 16px 28px; background: #fafafa; border-top: 1px solid #f5f5f5; }
        .notes p { font-size: 12px; color: #6b6885; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div>
            <h1>Invoice</h1>
            <p class="number">${invoice.number}</p>
          </div>
          <div class="dates">
            <div class="date-row">
              <span class="date-label">Issue date</span>
              <span class="date-value">${invoice.issueDate}</span>
            </div>
            <div class="date-row">
              <span class="date-label">Due date</span>
              <span class="date-value">${invoice.dueDate}</span>
            </div>
          </div>
        </div>
        <div class="bill-to">
          <p class="bill-to-label">Bill to</p>
          <p class="bill-to-company">${invoice.billTo.company}</p>
          <p class="bill-to-line">${invoice.billTo.contact}</p>
          <p class="bill-to-line">${invoice.billTo.line1}</p>
          <p class="bill-to-line">${invoice.billTo.cityLine}</p>
          <p class="bill-to-line">${invoice.billTo.country}</p>
        </div>
        <div class="line-items">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="width: 60px;">Qty</th>
                <th style="width: 110px;">Unit price</th>
                <th style="width: 124px;">Amount</th>
              </tr>
            </thead>
            <tbody>${lineItemsHtml}</tbody>
          </table>
          <div class="totals">
            <div class="row">
              <span class="row-label">Subtotal</span>
              <span class="row-value">${invoice.subtotal}</span>
            </div>
            <div class="row">
              <span class="row-label">Tax</span>
              <span class="row-value">${invoice.tax}</span>
            </div>
            <div class="row total-row">
              <span class="total-label">Total due</span>
              <span class="total-value">${invoice.total}</span>
            </div>
          </div>
        </div>
        <div class="notes">
          <p>${invoice.notes}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function openInvoicePreview(invoiceId: string) {
  const invoice = scheduledInvoices[invoiceId]
  if (!invoice) return
  const html = generateInvoiceHtml(invoice)
  const newWindow = window.open('', '_blank', 'width=900,height=700')
  if (newWindow) {
    newWindow.document.write(html)
    newWindow.document.close()
  }
}

function TimelineNode({
  item,
  isLast,
}: {
  item: PaymentScheduleItem
  isLast: boolean
}) {
  const config = STATUS_CONFIG[item.status]
  const StatusIcon = config.icon

  return (
    <div className="relative flex items-start">
      {/* Dot — sits above the button layer */}
      <div className="relative z-10 flex w-5 shrink-0 justify-center pt-[7px] pointer-events-none">
        <div className="h-1.5 w-1.5 rounded-full bg-brand-navy" />
      </div>

      {/* Connector line — absolutely bridging the gap to the next node */}
      {!isLast && (
        <div
          className="pointer-events-none absolute left-[9px] top-[13px] w-px bg-brand-navy/25"
          style={{ bottom: -6 }}
        />
      )}

      {/* Button */}
      <button
        type="button"
        onClick={() => openInvoicePreview(item.invoiceId)}
        className="group ml-3 flex flex-1 cursor-pointer items-start justify-between gap-4 border-b border-transparent pt-0.5 pb-1.5 text-left transition-colors hover:border-neutral-200"
      >
        {/* Left: date, then title + hover preview label */}
        <div>
          <p className="text-[12px] text-brand-fog">{item.dueDate}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[14px] font-medium text-brand-navy">{item.period}</span>
            <span className="flex items-center gap-1 text-[12px] font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
              Preview invoice
              <ExternalLink size={12} />
            </span>
          </div>
        </div>

        {/* Right: badge + amount */}
        <div className="flex shrink-0 items-center gap-3 pt-[2px]">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', config.badge)}>
            <StatusIcon size={10} />
            {config.label}
          </span>
          <span className="text-[14px] font-semibold text-brand-navy">{item.amount}</span>
        </div>
      </button>
    </div>
  )
}

export function PaymentSchedule() {
  return (
    <div className="space-y-3">
      {paymentSchedule.map((item, idx) => (
        <TimelineNode
          key={item.id}
          item={item}
          isLast={idx === paymentSchedule.length - 1}
        />
      ))}
    </div>
  )
}

export default PaymentSchedule
