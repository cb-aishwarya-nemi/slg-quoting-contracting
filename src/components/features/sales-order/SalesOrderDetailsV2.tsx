import { useEffect, useState } from 'react'
import { ArrowRight, Download, FilePenLine, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from '@/components/features/contract-processing'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { SalesOrderFeatureUsageSection } from './SalesOrderFeatureUsage'
import { SalesOrderCollapsedSections } from './SalesOrderCollapsedSections'
import { SalesOrderHeaderTimeline } from './SalesOrderHeaderTimeline'
import { type SalesOrder } from '@/data/salesOrderMock'
import {
  getSalesOrderPaymentSummary,
  SALES_ORDER_STATUS_STYLES,
  salesOrdersListData,
  type InvoiceTimingTone,
  type SalesOrderListItem,
} from '@/data/salesOrdersListMock'
import type { SalesOrderScenario } from './SalesOrderDetails'

interface SalesOrderDetailsV2Props {
  order: SalesOrder
  orders: SalesOrder[]
  activeOrderId: string
  onSelectOrder: (id: string) => void
  /** `non-ubb` hides usage meters; `all-good` keeps the healthy UBB chart summary. */
  scenario?: Exclude<SalesOrderScenario, 'ubb-chart-1' | 'ubb-chart-2'>
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

function formatOrdinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

function getContractTermProgress(order: SalesOrder): string | undefined {
  const start = new Date(order.startDate)
  if (isNaN(start.getTime())) return undefined

  const termMatch = order.contractTerm.match(/(\d+)\s*months?/i)
  const termMonths = termMatch ? Number(termMatch[1]) : null

  const now = new Date()
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())

  if (monthsElapsed < 0) return undefined

  let nth = monthsElapsed + 1
  if (termMonths != null) nth = Math.min(nth, termMonths)

  return `in ${formatOrdinal(nth)} month`
}

function getRenewalRelativeMonths(renewalDate: string): string | undefined {
  const parsed = new Date(renewalDate)
  if (isNaN(parsed.getTime())) return undefined

  const now = new Date()
  const months =
    (parsed.getFullYear() - now.getFullYear()) * 12 + (parsed.getMonth() - now.getMonth())

  if (months === 0) return 'this month'
  if (months === 1) return 'in 1 month'
  if (months > 1) return `in ${months} months`
  if (months === -1) return '1 month ago'
  return `${Math.abs(months)} months ago`
}

function getNextBillingLine(order: SalesOrder): { date: string; relative?: string } {
  const next = order.upcomingBillingSchedule.find(
    (line) => line.status === 'Pending' || line.status === 'Upcoming'
  )
  if (!next) return { date: '—' }

  const parsed = new Date(next.billDate)
  if (isNaN(parsed.getTime())) return { date: next.billDate }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  )

  let relative: string
  if (diffDays === 0) relative = 'today'
  else if (diffDays === 1) relative = 'in 1 day'
  else if (diffDays > 1) relative = `in ${diffDays} days`
  else if (diffDays === -1) relative = '1 day ago'
  else relative = `${Math.abs(diffDays)} days ago`

  return { date: next.billDate, relative }
}

function OrderMetricsRow({ order }: { order: SalesOrder }) {
  const nextBilling = getNextBillingLine(order)
  const metrics: Array<{ label: string; value: string; suffix?: string }> = [
    { label: 'TCV', value: order.totalContractValue },
    {
      label: 'Contract term',
      value: order.contractTerm,
      suffix: getContractTermProgress(order),
    },
    {
      label: 'Renewal',
      value: formatRenewalDisplay(order),
      suffix: getRenewalRelativeMonths(order.renewalDate),
    },
    { label: 'Accrued', value: order.accruedValue },
    {
      label: 'Next billing',
      value: nextBilling.date,
      suffix: nextBilling.relative,
    },
  ]

  return (
    <div className="flex">
      {metrics.map((metric, idx) => (
        <div key={metric.label} className="flex min-w-0 flex-1 items-start">
          <div className="min-w-0 flex-1 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-brand-fog">
              {metric.label}
            </p>
            <div className="mt-1">
              <p className="whitespace-nowrap text-[15px] font-semibold text-brand-navy">
                {metric.value}
              </p>
              {metric.suffix && (
                <p className="mt-0.5 whitespace-nowrap text-[12px] font-normal text-brand-fog">
                  {metric.suffix}
                </p>
              )}
            </div>
          </div>
          {idx < metrics.length - 1 && (
            <div className="mx-3 h-12 w-px shrink-0 self-center bg-neutral-200" />
          )}
        </div>
      ))}
    </div>
  )
}

const INVOICE_TIMING_STYLES: Record<InvoiceTimingTone, string> = {
  positive: 'text-green-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  muted: 'text-brand-fog',
}

const ATTENTION_INVOICE_ROW =
  'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] items-center gap-x-6 border-b border-neutral-200 py-2.5'

const ATTENTION_ACTION_CLASS =
  'shrink-0 cursor-pointer rounded-md border border-brand-navy bg-white px-2.5 py-1 text-[12px] font-medium text-brand-navy transition-colors hover:bg-neutral-50'

function PaymentDetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-neutral-200 py-2.5">
      <span className="w-[104px] shrink-0 text-[11px] uppercase tracking-[-0.25px] text-brand-fog">
        {label}
      </span>
      <p className="min-w-0 flex-1 whitespace-nowrap text-[13px] text-brand-navy">
        <span className="font-medium">{value}</span>
        {sub && (
          <>
            <span className="px-1.5 text-brand-mist">·</span>
            <span className="font-normal text-brand-fog">{sub}</span>
          </>
        )}
      </p>
    </div>
  )
}

function SubSectionHeader({ title }: { title: string }) {
  return (
    <div className="group/subhead mb-3 flex items-center gap-3">
      <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
        {title}
      </p>
      <button
        type="button"
        className={cn(
          'ml-auto inline-flex shrink-0 cursor-pointer items-center gap-0.5 text-[11px] font-medium text-blue-700 transition-opacity hover:underline',
          'opacity-0 pointer-events-none group-hover/subhead:pointer-events-auto group-hover/subhead:opacity-100',
          'group-hover/column:pointer-events-auto group-hover/column:opacity-100'
        )}
      >
        View all
        <ArrowRight size={12} strokeWidth={2.25} />
      </button>
    </div>
  )
}

function OverdueAttentionItem({ order }: { order: SalesOrder }) {
  const listItem = resolveListItem(order)
  const summary = getSalesOrderPaymentSummary(order.id, listItem)
  if (summary.overdueDays <= 0) return null

  const overdueLabel =
    summary.overdueDays === 1 ? '1 day' : `${summary.overdueDays} days`

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
          1 item needs attention
        </span>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h2 className="max-w-[720px] shrink-0 font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.5px] text-brand-navy">
            Last invoice overdue by{' '}
            <span className="font-semibold text-red-700">{overdueLabel}</span>
            {' — '}
            <span className="font-semibold">{summary.overdueAmount}</span>
          </h2>
          <div className="h-px min-w-6 flex-1 bg-brand-navy" />
          <button type="button" className={ATTENTION_ACTION_CLASS}>
            View reminders sent
          </button>
        </div>
        <p className="mt-3 max-w-[720px] text-[13px] leading-[1.6] text-brand-navy">
          Pioneer Systems typically pays within Net 30 — median clearance is 3 days after invoice is posted.
          Four of the last five invoices were on time; the open balance is the first overdue
          invoice in 14 months —{' '}
          <span className="mx-0.5 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] font-medium text-brand-navy align-baseline">
            Sharath
          </span>{' '}
          is on top of this, and 4 reminders have already been sent.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-20">
        <div className="group/column min-w-0">
          <SubSectionHeader title="Past 5 invoices" />
          <div>
            {summary.recentInvoices.map((row) => (
              <div key={row.invoiceId} className={ATTENTION_INVOICE_ROW}>
                <a className="min-w-0 cursor-pointer truncate text-[13px] font-medium text-blue-700 hover:underline">
                  {row.invoiceId}
                </a>
                <span
                  className={cn(
                    'text-left text-[12px] font-medium',
                    INVOICE_TIMING_STYLES[row.timingTone]
                  )}
                >
                  {row.timingLabel}
                </span>
                <span className="text-right text-[13px] font-semibold tabular-nums text-brand-navy whitespace-nowrap">
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="group/column min-w-0">
          <SubSectionHeader title="Payment details" />
          <div>
            <PaymentDetailRow
              label="Card on file"
              value={summary.cardOnFile}
              sub={summary.cardOnFileSub}
            />
            <PaymentDetailRow
              label="Last payment"
              value={summary.lastPayment}
              sub={summary.lastPaymentSub}
            />
            <PaymentDetailRow
              label="Next billing"
              value={summary.nextBilling}
              sub={summary.nextBillingSub}
            />
            <PaymentDetailRow
              label="Payment terms"
              value={summary.paymentTerms}
              sub={summary.paymentTermsSub}
            />
            <PaymentDetailRow
              label="Billing contact"
              value={summary.billingContact}
              sub={summary.billingContactSub}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function AiSummaryNote({
  order,
  scenario,
}: {
  order: SalesOrder
  scenario: Exclude<SalesOrderScenario, 'ubb-chart-1' | 'ubb-chart-2'>
}) {
  if (scenario === 'non-ubb') {
    return (
      <section>
        <OrderMetricsRow order={order} />
        <div className="mt-8">
          <OverdueAttentionItem order={order} />
        </div>
      </section>
    )
  }

  return (
    <section>
      <OrderMetricsRow order={order} />
      <div className="mt-8 mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold uppercase tracking-[-0.25px] ai-gradient-text">
          Note
        </span>
      </div>
      <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
        {order.headline}
      </h2>
      <p className="mt-3 max-w-[720px] text-[13px] leading-[1.6] text-brand-navy">{order.aiSummary}</p>
    </section>
  )
}

export function SalesOrderDetailsV2({
  order,
  orders,
  activeOrderId,
  onSelectOrder,
  scenario = 'all-good',
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
          <AiSummaryNote order={order} scenario={scenario} />

          {scenario === 'all-good' && (
            <>
              <SalesOrderHeaderTimeline orderId={order.id} />
              <SalesOrderFeatureUsageSection orderId={order.id} hideUsageLimits />
            </>
          )}

          <SalesOrderCollapsedSections order={order} />

          <div aria-hidden="true" style={{ height: 120 }} />
        </div>
      </div>
    </div>
  )
}

export default SalesOrderDetailsV2
