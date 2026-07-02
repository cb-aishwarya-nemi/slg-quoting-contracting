import { type SalesOrderProduct } from '@/data/salesOrderMock'

interface ReadOnlyProductsListProps {
  items: SalesOrderProduct[]
}

const PERIOD_W = 96
const QTY_W = 60
const UNIT_W = 110
const TOTAL_W = 124

/**
 * Compact, read-only list view of order line items. Mirrors ProductsPricingTable
 * columns but with horizontal separators only (no vertical separators) and no
 * editing affordances.
 */
export function ReadOnlyProductsList({ items }: ReadOnlyProductsListProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center border-b border-neutral-200 pb-2">
        <div className="flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Item
        </div>
        <div style={{ width: PERIOD_W }} className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Frequency
        </div>
        <div style={{ width: QTY_W }} className="shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Qty
        </div>
        <div style={{ width: UNIT_W }} className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Unit price
        </div>
        <div style={{ width: TOTAL_W }} className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Total price
        </div>
      </div>

      {/* Rows — horizontal separators only */}
      {items.map((item) => (
        <div key={item.id} className="flex items-center border-b border-neutral-100 py-2">
          <div className="flex-1 truncate pr-4 text-[14px] font-medium text-brand-navy">
            {item.name}
          </div>
          <div style={{ width: PERIOD_W }} className="shrink-0 text-[14px] text-brand-navy">
            {item.frequency}
          </div>
          <div style={{ width: QTY_W }} className="shrink-0 text-[14px] text-brand-navy">
            {item.quantity}
          </div>
          <div style={{ width: UNIT_W }} className="shrink-0 text-right text-[14px] font-medium text-brand-navy">
            {item.unitPrice}
          </div>
          <div style={{ width: TOTAL_W }} className="shrink-0 text-right text-[14px] font-medium text-brand-navy">
            {item.totalPrice}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ReadOnlyProductsList
