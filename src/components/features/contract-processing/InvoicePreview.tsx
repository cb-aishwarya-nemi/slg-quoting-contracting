import { contractProcessing } from '@/data/contractProcessingMock'

const { invoice } = contractProcessing

export function InvoicePreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Invoice header */}
      <div className="flex items-start justify-between border-b border-neutral-100 px-7 pb-5 pt-6">
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
          <div className="w-[124px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
            Amount
          </div>
        </div>

        {invoice.lineItems.map((line) => (
          <div key={line.name} className="flex items-center border-b border-neutral-100 py-2.5">
            <div className="flex-1 text-[14px] text-brand-navy">{line.name}</div>
            <div className="w-[56px] shrink-0 text-right text-[14px] text-brand-navy">{line.qty}</div>
            <div className="w-[110px] shrink-0 text-right text-[14px] text-brand-navy">{line.unitPrice}</div>
            <div className="w-[124px] shrink-0 text-right text-[14px] text-brand-navy">{line.amount}</div>
          </div>
        ))}

        {/* Totals */}
        <div className="mt-4 flex flex-col items-end gap-2">
          <div className="flex w-[280px] items-center justify-between">
            <span className="text-[13px] text-brand-fog">Subtotal</span>
            <span className="text-[14px] text-brand-navy">{invoice.subtotal}</span>
          </div>
          <div className="flex w-[280px] items-center justify-between">
            <span className="text-[13px] text-brand-fog">Tax</span>
            <span className="text-[14px] text-brand-navy">{invoice.tax}</span>
          </div>
          <div className="flex w-[280px] items-center justify-between border-t border-neutral-200 pt-2">
            <span className="text-[13px] font-semibold text-brand-navy">Total due</span>
            <span className="font-heading text-[16px] font-semibold text-brand-navy">{invoice.total}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-neutral-100 bg-neutral-50 px-7 py-4">
        <p className="text-[12px] text-brand-fog">{invoice.notes}</p>
      </div>
    </div>
  )
}

export default InvoicePreview
