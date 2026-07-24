import { useEffect, useState, type ReactNode } from 'react'
import { Download, FilePenLine, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from '@/components/features/contract-processing'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { usePageUseCase } from '@/context/UseCaseContext'
import { SalesOrderCollapsedSections } from './SalesOrderCollapsedSections'
import {
  ASK_CHAT_RAIL_WIDTH,
  SalesOrderAskBar,
  SalesOrderAskChatPanel,
  getAskSuggestions,
  type AskChatTurn,
} from './SalesOrderAskChatPanel'
import { type SalesOrder } from '@/data/salesOrderMock'
import {
  SALES_ORDER_STATUS_STYLES,
  getSalesOrderPaymentSummary,
  salesOrdersListData,
  type InvoiceTimingTone,
  type SalesOrderListItem,
  type SalesOrderPaymentSummary,
} from '@/data/salesOrdersListMock'

export interface SalesOrderDetailsProps {
  order: SalesOrder
  orders: SalesOrder[]
  activeOrderId: string
  onSelectOrder: (id: string) => void
}

const CONTENT_MAX_WIDTH = 1040

const TIMING_TONE_STYLES: Record<InvoiceTimingTone, string> = {
  positive: 'text-green-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  muted: 'text-brand-fog',
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
  const metrics: {
    label: string
    value: string
    href?: string
  }[] = [
    {
      label: 'Source contract',
      value: order.sourceContract,
      href: `/pdf-viewer.html?doc=${encodeURIComponent(order.sourceContract)}`,
    },
    { label: 'TCV', value: order.totalContractValue },
    { label: 'Contract term', value: formatContractTermRange(order) },
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
            {metric.href ? (
              <button
                type="button"
                onClick={() => {
                  window.open(metric.href, `pdf-${metric.value}`, 'popup,width=680,height=800')
                }}
                className="mt-1 cursor-pointer text-left text-[15px] font-semibold text-blue-700 hover:underline"
              >
                {metric.value}
              </button>
            ) : (
              <p className="mt-1 text-[15px] font-semibold text-brand-navy">{metric.value}</p>
            )}
          </div>
          {idx < metrics.length - 1 && (
            <div className="mx-4 h-12 w-px self-center bg-neutral-200" />
          )}
        </div>
      ))}
    </div>
  )
}

function PersonPill({ name }: { name: string }) {
  return (
    <span className="mx-0.5 inline-flex translate-y-px items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] font-medium text-brand-navy">
      {name}
    </span>
  )
}

function renderPatternSummary(summary: string): ReactNode[] {
  const parts = summary.split(/(Sharath)/g)
  return parts.map((part, index) =>
    part === 'Sharath' ? <PersonPill key={index} name={part} /> : <span key={index}>{part}</span>
  )
}

function DetailLine({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string
  value: string
  sub?: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
        {label}
      </span>
      <p className={cn('text-right text-[13px] text-brand-navy', valueClassName)}>
        <span className="font-medium">{value}</span>
        {sub ? <span className="text-brand-fog"> · {sub}</span> : null}
      </p>
    </div>
  )
}

function formatContractTermRange(order: SalesOrder): string {
  const monthsMatch = order.contractTerm.match(/(\d+)\s*months?/i)
  if (!monthsMatch) return order.contractTerm

  const months = parseInt(monthsMatch[1], 10)
  const start = new Date(order.startDate)
  if (isNaN(start.getTime())) return order.contractTerm

  const end = new Date(start)
  end.setMonth(end.getMonth() + months)
  end.setDate(end.getDate() - 1)
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return `${order.startDate} – ${endLabel}`
}

type SummaryMetric = {
  label: string
  value: string
  sub?: string
  href?: string
}

function getAttentionSummaryMetrics(order: SalesOrder): SummaryMetric[] {
  const renewalType =
    order.renewalAction === 'Auto-renew'
      ? 'Auto'
      : order.renewalAction.replace(/\s+renewal$/i, '')

  return [
    { label: 'TCV', value: order.totalContractValue },
    { label: 'Avg. annual value', value: order.avgAnnualValue },
    { label: 'Accrued', value: order.accruedValue },
    { label: 'Next billing', value: 'Aug 31, 2026', sub: 'in 38 days' },
    {
      label: 'Contract term',
      value: formatContractTermRange(order),
      sub: '36 months · 3rd month running',
    },
    {
      label: 'Source contract',
      value: order.sourceContract,
      href: `/pdf-viewer.html?doc=${encodeURIComponent(order.sourceContract)}`,
    },
    {
      label: 'Renewal',
      value: `${renewalType} · ${order.renewalDate}`,
      sub: 'in 33 months',
    },
    { label: 'Amendments', value: 'None' },
  ]
}

function SummaryMetricsRow({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <div className="flex">
      {metrics.map((metric, idx) => (
        <div key={metric.label} className="flex min-w-0 flex-1 items-start">
          <div className="min-w-0 flex-1 py-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-brand-fog">
              {metric.label}
            </p>
            {metric.href ? (
              <button
                type="button"
                onClick={() => {
                  window.open(metric.href, `pdf-${metric.value}`, 'popup,width=680,height=800')
                }}
                className="mt-1 cursor-pointer truncate text-left text-[15px] font-semibold text-blue-700 hover:underline"
              >
                {metric.value}
              </button>
            ) : (
              <p className="mt-1 truncate text-[15px] font-semibold text-brand-navy">{metric.value}</p>
            )}
            {metric.sub ? (
              <p className="mt-0.5 truncate text-[12px] text-brand-fog">{metric.sub}</p>
            ) : null}
          </div>
          {idx < metrics.length - 1 && (
            <div className="mx-4 h-12 w-px shrink-0 self-center bg-neutral-200" />
          )}
        </div>
      ))}
    </div>
  )
}

function MetricsSummaryCard({ order }: { order: SalesOrder }) {
  const metrics = getAttentionSummaryMetrics(order)
  const topRow = metrics.slice(0, 4)
  const bottomRow = metrics.slice(4, 8)

  return (
    <div className="mb-10">
      <div className="space-y-6">
        <SummaryMetricsRow metrics={topRow} />
        <SummaryMetricsRow metrics={bottomRow} />
      </div>
    </div>
  )
}

function InvoiceOverdueAiSummary({
  order,
  listItem,
}: {
  order: SalesOrder
  listItem: SalesOrderListItem
}) {
  const summary: SalesOrderPaymentSummary = getSalesOrderPaymentSummary(order.id, listItem)
  const overdueLabel =
    summary.overdueDays === 1 ? '1 day' : `${summary.overdueDays} days`

  return (
    <section>
      <MetricsSummaryCard order={order} />

      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
          1 item needs attention
        </span>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="shrink-0 font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
          Last invoice overdue by <span className="font-semibold text-red-700">{overdueLabel}</span>
          {' — '}
          <span className="font-semibold">{summary.overdueAmount}</span>
        </h2>
        <div className="h-px min-w-3 flex-1 bg-brand-navy" />
        <button
          type="button"
          className="shrink-0 cursor-pointer rounded-md border border-brand-navy bg-white px-3 py-1.5 text-[13px] font-medium text-brand-navy transition-colors hover:bg-neutral-50"
        >
          View reminders sent
        </button>
      </div>

      <p className="mt-3 max-w-[820px] text-[13px] leading-[1.65] text-brand-navy">
        {renderPatternSummary(summary.patternSummary)}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
            Past 5 invoices
          </p>
          <ul>
            {summary.recentInvoices.map((invoice) => (
              <li
                key={invoice.invoiceId}
                className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-neutral-100 py-2.5 last:border-b-0"
              >
                <p className="truncate text-[13px] font-medium text-brand-navy">
                  {invoice.invoiceId}
                </p>
                <p className={cn('text-[12px]', TIMING_TONE_STYLES[invoice.timingTone])}>
                  {invoice.timingLabel}
                </p>
                <p className="text-right text-[13px] font-semibold tabular-nums text-brand-navy">
                  {invoice.amount}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
            Payment details
          </p>
          <div className="divide-y divide-neutral-100">
            <DetailLine
              label="Card on file"
              value={summary.cardOnFile}
              sub={summary.cardOnFileSub}
            />
            <DetailLine
              label="Last payment"
              value={summary.lastPayment}
              sub={summary.lastPaymentSub}
            />
            <DetailLine
              label="Next billing"
              value={summary.nextBilling}
              sub={summary.nextBillingSub}
            />
            <DetailLine
              label="Payment terms"
              value={summary.paymentTerms}
              sub={summary.paymentTermsSub}
            />
            <DetailLine
              label="Billing contact"
              value={summary.billingContact}
              sub={summary.billingContactSub}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function JustCreatedAiSummary({ order }: { order: SalesOrder }) {
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

type AccountSignalTone = 'warning' | 'positive'

const ACCOUNT_SIGNAL_TONES: Record<AccountSignalTone, string> = {
  warning: 'text-amber-700',
  positive: 'text-green-700',
}

const RENEWAL_ACCOUNT_SIGNALS: {
  label: string
  value: string
  sub?: string
  tone: AccountSignalTone
}[] = [
  { label: 'Seat utilisation', value: '45 / 50', sub: '90% · ↑ growing', tone: 'warning' },
  { label: 'Payment history', value: '4 of 5 invoices on time', tone: 'positive' },
  { label: 'Dunning events', value: '0 in last 14 months', tone: 'positive' },
  { label: 'Renewal type', value: 'Manual', sub: 'no new order yet', tone: 'warning' },
]

function RenewalApproachingAiSummary({ order }: { order: SalesOrder }) {
  return (
    <section>
      <MetricsSummaryCard order={order} />

      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
          1 item needs attention
        </span>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="shrink-0 font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
          Pioneer&apos;s contract expires in{' '}
          <span className="font-semibold text-green-700">91 days</span>
        </h2>
        <div className="h-px min-w-3 flex-1 bg-brand-navy" />
        <button
          type="button"
          className="shrink-0 cursor-pointer rounded-md border border-brand-navy bg-white px-3 py-1.5 text-[13px] font-medium text-brand-navy transition-colors hover:bg-neutral-50"
        >
          Start renewal
        </button>
      </div>

      <p className="mt-3 max-w-[820px] text-[13px] leading-[1.65] text-brand-navy">
        Pioneer&apos;s billing and usage are healthy going into renewal — 90% seat utilisation,
        clean payment history, no credit notes. The contract ends Apr 30 on a manual renewal and
        no new order has been created yet. <PersonPill name="Priya" /> owns this account — at 91
        days out, initiation should already be underway.
      </p>

      <div className="mt-8 max-w-[560px]">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
          Account signals
        </p>
        <div className="divide-y divide-neutral-100">
          {RENEWAL_ACCOUNT_SIGNALS.map((signal) => (
            <DetailLine
              key={signal.label}
              label={signal.label}
              value={signal.value}
              sub={signal.sub}
              valueClassName={ACCOUNT_SIGNAL_TONES[signal.tone]}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function AiSummaryNote({
  order,
  listItem,
  variant,
}: {
  order: SalesOrder
  listItem: SalesOrderListItem
  variant: string | null
}) {
  if (variant === 'invoice-overdue') {
    return <InvoiceOverdueAiSummary order={order} listItem={listItem} />
  }
  if (variant === 'renewal-approaching') {
    return <RenewalApproachingAiSummary order={order} />
  }
  return <JustCreatedAiSummary order={order} />
}

export function SalesOrderDetails({
  order,
  orders,
  activeOrderId,
  onSelectOrder,
}: SalesOrderDetailsProps) {
  const { currentVariant } = usePageUseCase('sales-order-details')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatTurns, setChatTurns] = useState<AskChatTurn[]>([])
  const [askLeaving, setAskLeaving] = useState(false)

  const listItem = resolveListItem(order)
  const statusStyle = SALES_ORDER_STATUS_STYLES[listItem.status]
  const askSuggestions = getAskSuggestions(currentVariant)

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

  // Fresh thread when switching sales orders
  useEffect(() => {
    setChatOpen(false)
    setChatTurns([])
    setAskLeaving(false)
  }, [activeOrderId])

  const appendTurn = (prompt: string) => {
    setChatTurns((prev) => [
      ...prev,
      { id: `turn-${Date.now()}-${prev.length}`, prompt },
    ])
  }

  const openChat = (prompt: string) => {
    appendTurn(prompt)
    if (chatOpen) return
    setAskLeaving(true)
    window.setTimeout(() => {
      setChatOpen(true)
      setAskLeaving(false)
    }, 180)
  }

  const closeChat = () => {
    setChatOpen(false)
  }

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden">
      <div
        className={cn(
          'relative mx-auto flex min-h-0 min-w-0 flex-1 flex-col transition-[padding,max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          chatOpen ? 'max-w-none px-8' : 'max-w-[1560px] px-12',
        )}
      >
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
                {order.customerName} · {order.totalContractValue} · {order.startDate} -{' '}
                {listItem.expires}
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

        <div className="min-h-0 flex-1 overflow-y-auto pb-24 pt-12">
          <div
            className="mx-auto space-y-10 transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ maxWidth: chatOpen ? 880 : CONTENT_MAX_WIDTH }}
          >
            <section className="group/section">
              <AiSummaryNote order={order} listItem={listItem} variant={currentVariant} />
            </section>

            <SalesOrderCollapsedSections order={order} variant={currentVariant} />

            <div aria-hidden="true" style={{ height: 120 }} />
          </div>
        </div>

        {!chatOpen && (
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-6 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              askLeaving
                ? 'translate-x-[28%] translate-y-2 scale-[1.04] opacity-0'
                : 'translate-x-0 translate-y-0 scale-100 opacity-100',
            )}
          >
            <SalesOrderAskBar onAsk={openChat} suggestions={askSuggestions} />
          </div>
        )}
      </div>

      <aside
        className={cn(
          'relative shrink-0 overflow-hidden border-neutral-200 bg-white transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          chatOpen ? 'border-l' : 'border-l-0',
        )}
        style={{ width: chatOpen ? ASK_CHAT_RAIL_WIDTH : 0 }}
        aria-hidden={!chatOpen}
      >
        <div
          className={cn(
            'absolute inset-y-0 right-0 flex h-full flex-col transition-opacity duration-300',
            chatOpen ? 'opacity-100 delay-150' : 'opacity-0',
          )}
          style={{ width: ASK_CHAT_RAIL_WIDTH }}
        >
          {chatTurns.length > 0 && (
            <SalesOrderAskChatPanel
              turns={chatTurns}
              customerName={order.customerName}
              suggestions={askSuggestions}
              onAsk={appendTurn}
              onClose={closeChat}
            />
          )}
        </div>
      </aside>
    </div>
  )
}

export default SalesOrderDetails
