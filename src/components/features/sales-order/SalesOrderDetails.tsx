import { useEffect, useState } from 'react'
import { Share2, FilePenLine, MoreHorizontal } from 'lucide-react'
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
  salesOrdersListData,
  type SalesOrderListItem,
} from '@/data/salesOrdersListMock'

export interface SalesOrderDetailsProps {
  order: SalesOrder
  orders: SalesOrder[]
  activeOrderId: string
  onSelectOrder: (id: string) => void
  /** When true, chat rail is rendered by the parent (full-height left of customer chrome). */
  externalChat?: boolean
  chatOpen?: boolean
  chatTurns?: AskChatTurn[]
  onOpenChat?: (prompt: string) => void
  onAppendChat?: (prompt: string) => void
  onCloseChat?: () => void
}

const CONTENT_MAX_WIDTH = 1040

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
      label: 'Renewal',
      value: `${renewalType} · ${order.renewalDate}`,
      sub: 'in 33 months',
    },
    {
      label: 'Source contract',
      value: order.sourceContract,
      href: `/pdf-viewer.html?doc=${encodeURIComponent(order.sourceContract)}`,
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
    <section>
      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
          Summary
        </span>
      </div>
      <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
        {order.totalContractValue} locked in across {formatContractTermRange(order)}
      </h2>
      <p className="mt-3 max-w-[720px] text-[13px] leading-[1.65] text-brand-navy">
        Year 1 is underway — {order.accruedValue} accrued so far, next invoice on Aug 31, and{' '}
        {order.renewalAction.toLowerCase()} on {order.renewalDate}.
      </p>
      <div className="mt-8 space-y-6">
        <SummaryMetricsRow metrics={topRow} />
        <SummaryMetricsRow metrics={bottomRow} />
      </div>
    </section>
  )
}

function AiSummaryNote({ order }: { order: SalesOrder }) {
  return <MetricsSummaryCard order={order} />
}

export function SalesOrderDetails({
  order,
  orders,
  activeOrderId,
  onSelectOrder,
  externalChat = false,
  chatOpen: chatOpenProp,
  chatTurns: chatTurnsProp,
  onOpenChat,
  onAppendChat,
  onCloseChat,
}: SalesOrderDetailsProps) {
  usePageUseCase('sales-order-details')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [internalChatOpen, setInternalChatOpen] = useState(false)
  const [internalChatTurns, setInternalChatTurns] = useState<AskChatTurn[]>([])
  const [askLeaving, setAskLeaving] = useState(false)

  const chatOpen = externalChat ? Boolean(chatOpenProp) : internalChatOpen
  const chatTurns = externalChat ? (chatTurnsProp ?? []) : internalChatTurns

  const listItem = resolveListItem(order)
  const statusStyle = SALES_ORDER_STATUS_STYLES[listItem.status]
  const askSuggestions = getAskSuggestions()

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

  // Fresh thread when switching sales orders (internal mode only)
  useEffect(() => {
    if (externalChat) return
    setInternalChatOpen(false)
    setInternalChatTurns([])
    setAskLeaving(false)
  }, [activeOrderId, externalChat])

  const appendTurn = (prompt: string) => {
    if (externalChat) {
      onAppendChat?.(prompt)
      return
    }
    setInternalChatTurns((prev) => [
      ...prev,
      { id: `turn-${Date.now()}-${prev.length}`, prompt },
    ])
  }

  const openChat = (prompt: string) => {
    if (externalChat) {
      setAskLeaving(true)
      window.setTimeout(() => {
        onOpenChat?.(prompt)
        setAskLeaving(false)
      }, 180)
      return
    }
    appendTurn(prompt)
    if (internalChatOpen) return
    setAskLeaving(true)
    window.setTimeout(() => {
      setInternalChatOpen(true)
      setAskLeaving(false)
    }, 180)
  }

  const closeChat = () => {
    if (externalChat) {
      onCloseChat?.()
      return
    }
    setInternalChatOpen(false)
  }

  const content = (
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
                  statusStyle.text,
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
            <Share2 size={15} />
            Share
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

      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        <div
          className="mx-auto pt-12 transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ maxWidth: chatOpen ? 880 : CONTENT_MAX_WIDTH }}
        >
          <section className="group/section mb-10">
            <AiSummaryNote order={order} />
          </section>

          <SalesOrderCollapsedSections order={order} />

          <div aria-hidden="true" style={{ height: 120 }} />
        </div>
      </div>

      {!chatOpen && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-6 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            askLeaving
              ? '-translate-x-[40%] translate-y-1 scale-[0.98] opacity-0'
              : 'translate-x-0 translate-y-0 scale-100 opacity-100',
          )}
        >
          <SalesOrderAskBar onAsk={openChat} suggestions={askSuggestions} />
        </div>
      )}
    </div>
  )

  if (externalChat) {
    return <div className="flex min-h-0 w-full flex-1 overflow-hidden">{content}</div>
  }

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden">
      <aside
        className="relative shrink-0 overflow-hidden bg-transparent transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: chatOpen ? ASK_CHAT_RAIL_WIDTH : 0 }}
        aria-hidden={!chatOpen}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex h-full flex-col bg-transparent transition-opacity duration-300',
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
      {content}
    </div>
  )
}

export default SalesOrderDetails
