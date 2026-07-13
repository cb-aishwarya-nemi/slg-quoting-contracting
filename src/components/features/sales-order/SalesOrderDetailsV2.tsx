import { useEffect, useState } from 'react'
import { Download, FilePenLine, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from '@/components/features/contract-processing'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { SalesOrderFeatureUsageSection } from './SalesOrderFeatureUsage'
import { SalesOrderCollapsedSections } from './SalesOrderCollapsedSections'
import { type SalesOrder } from '@/data/salesOrderMock'
import {
  SALES_ORDER_STATUS_STYLES,
  salesOrdersListData,
  type SalesOrderListItem,
} from '@/data/salesOrdersListMock'

interface SalesOrderDetailsV2Props {
  order: SalesOrder
  orders: SalesOrder[]
  activeOrderId: string
  onSelectOrder: (id: string) => void
}

function resolveListItem(order: SalesOrder): SalesOrderListItem {
  return (
    salesOrdersListData.find((item) => item.id === order.id) ?? {
      id: order.id,
      soId: order.soId,
      customer: order.customerName,
      customerId: 'pioneer-systems',
      tcv: order.totalContractValue,
      dealTag: order.dealTag,
      createdOn: order.createdOn,
      nextInvoice: '—',
      starts: order.startDate,
      expires: '—',
      status: 'Active',
    }
  )
}

function formatRenewalDisplay(order: SalesOrder): string {
  const type =
    order.renewalAction === 'Auto-renew'
      ? 'Auto-renew'
      : order.renewalAction.replace(/\s+renewal$/i, '')
  return `${type} · ${order.renewalDate}`
}

function OrderMetricsRow({ order }: { order: SalesOrder }) {
  const metrics = [
    { label: 'TCV', value: order.totalContractValue },
    { label: 'Accrued', value: order.accruedValue },
    { label: 'Contract term', value: order.contractTerm },
    { label: 'Renewal', value: formatRenewalDisplay(order) },
  ]

  return (
    <div className="flex">
      {metrics.map((metric, idx) => (
        <div key={metric.label} className="flex flex-1 items-start">
          <div className="flex-1 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-brand-fog">
              {metric.label}
            </p>
            <p className="mt-1 text-[15px] font-semibold text-brand-navy">{metric.value}</p>
          </div>
          {idx < metrics.length - 1 && (
            <div className="mx-4 h-12 w-px self-center bg-neutral-200" />
          )}
        </div>
      ))}
    </div>
  )
}

function AiSummaryNote({ order }: { order: SalesOrder }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold uppercase tracking-[-0.25px] ai-gradient-text">
          Note
        </span>
      </div>
      <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
        {order.headline}
      </h2>
      <p className="mt-3 max-w-[720px] text-[13px] leading-[1.6] text-brand-navy">{order.aiSummary}</p>
      <div className="mt-8">
        <OrderMetricsRow order={order} />
      </div>
    </section>
  )
}

export function SalesOrderDetailsV2({
  order,
  orders,
  activeOrderId,
  onSelectOrder,
}: SalesOrderDetailsV2Props) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const listItem = resolveListItem(order)
  const statusStyle = SALES_ORDER_STATUS_STYLES[listItem.status]

  const switcherItems: SwitcherItem[] = orders.map((o) => ({
    id: o.id,
    label: o.totalContractValue,
    taskType: o.soId,
    status: o.dealTag,
    customer: o.customerName,
  }))

  useEffect(() => {
    const handleClickOutside = () => setShowMoreMenu(false)
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreMenu])

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
      <div className="flex shrink-0 items-center py-3">
        <div className="flex items-center gap-2">
          <SecondaryNavSwitcher
            items={switcherItems}
            activeId={activeOrderId}
            onSelect={onSelectOrder}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold uppercase tracking-[-0.25px] text-brand-navy">
                {order.soId}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[-0.25px]',
                  statusStyle.bg,
                  statusStyle.text
                )}
              >
                {listItem.status}
              </span>
            </div>
            <div className="mt-0.5 text-[12px] tracking-[-0.25px] text-brand-fog">
              {order.customerName} · {order.totalContractValue} · Created {order.createdOn}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <FilePenLine size={15} />
            Amend order
          </button>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <Download size={15} />
            Download
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMoreMenu((prev) => !prev)
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
            >
              <MoreHorizontal size={15} />
              More
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
                >
                  Download order form
                </button>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
                >
                  Cancel order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-20 pt-8">
        <div className="mx-auto max-w-[1040px] space-y-10">
          <AiSummaryNote order={order} />

          <SalesOrderFeatureUsageSection orderId={order.id} />

          <SalesOrderCollapsedSections order={order} />

          <div aria-hidden="true" style={{ height: 120 }} />
        </div>
      </div>
    </div>
  )
}

export default SalesOrderDetailsV2
