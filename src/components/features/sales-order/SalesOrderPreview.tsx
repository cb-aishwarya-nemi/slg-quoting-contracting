import type { ReactNode } from 'react'
import { Link2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from '@/components/features/contract-processing'
import { getSalesOrderById } from '@/data/salesOrderMock'
import {
  SALES_ORDER_STATUS_STYLES,
  PAYMENT_BEHAVIOUR_STYLES,
  getSalesOrderPaymentSummary,
  getSalesOrderPreviewContext,
  getUsageAttentionSignal,
  type SalesOrderListItem,
} from '@/data/salesOrdersListMock'

interface SalesOrderPreviewProps {
  listItem: SalesOrderListItem
  onOpenDetails?: () => void
}

function PreviewSection({ children }: { children: ReactNode }) {
  return <div className="border-t border-neutral-100 px-6 py-4">{children}</div>
}

function AttentionHeadline({ children }: { children: ReactNode }) {
  return (
    <p className="font-heading text-[14px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
      {children}
    </p>
  )
}

function renderUsageHeadline(headline: string) {
  return headline.split(/(\d+%|\d+ days)/g).map((part, index) =>
    /^\d+%$|^\d+ days$/.test(part) ? (
      <span key={index} className="font-semibold">
        {part}
      </span>
    ) : (
      part
    )
  )
}

export function SalesOrderPreview({ listItem, onOpenDetails }: SalesOrderPreviewProps) {
  const order = getSalesOrderById(listItem.id)
  const context = getSalesOrderPreviewContext(listItem.id, listItem)
  const summary = getSalesOrderPaymentSummary(listItem.id, listItem)
  const usageSignal = getUsageAttentionSignal(listItem.id)
  const statusStyle = SALES_ORDER_STATUS_STYLES[listItem.status]
  const paymentStyle = PAYMENT_BEHAVIOUR_STYLES[context.paymentBehaviourTone]
  const hasOverdue = summary.overdueDays > 0
  const overdueLabel = summary.overdueDays === 1 ? '1 day' : `${summary.overdueDays} days`
  const attentionCount = (hasOverdue ? 1 : 0) + (usageSignal ? 1 : 0)

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="relative px-6 pb-5 pt-6">
        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
            title="Open sales order details"
          >
            <Maximize2 size={16} />
          </button>
        )}

        <h2 className="pr-10 font-heading text-[22px] font-semibold tracking-[-0.5px] text-brand-navy">
          Sales order for {listItem.tcv}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenDetails}
            className="flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-blue-700 hover:underline"
          >
            <Link2 size={14} />
            {listItem.soId}
          </button>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[-0.25px]',
              statusStyle.bg,
              statusStyle.text
            )}
          >
            {listItem.status}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[-0.25px]',
              paymentStyle.bg,
              paymentStyle.text
            )}
          >
            {context.paymentBehaviour}
          </span>
        </div>
      </div>

      <PreviewSection>
        {attentionCount > 0 ? (
          <>
            <div className="mb-3 flex items-center gap-1.5">
              <GradientSparkle size={14} />
              <span className="text-[12px] font-semibold tracking-[-0.25px] ai-gradient-text">
                {attentionCount} {attentionCount === 1 ? 'item needs' : 'items need'} attention
              </span>
            </div>

            {hasOverdue && (
              <div>
                <AttentionHeadline>
                  Last invoice overdue by{' '}
                  <span className="font-semibold text-red-700">{overdueLabel}</span>
                  {' — '}
                  <span className="font-semibold">{summary.overdueAmount}</span>
                </AttentionHeadline>
                <p className="mt-2 text-[12px] leading-[1.5] text-brand-fog">
                  {summary.patternSummaryShort ?? summary.patternSummary}
                </p>
              </div>
            )}

            {usageSignal && (
              <div className={hasOverdue ? 'mt-4' : undefined}>
                <AttentionHeadline>{renderUsageHeadline(usageSignal.headline)}</AttentionHeadline>
                <p className="mt-2 text-[12px] leading-[1.5] text-brand-fog">
                  {usageSignal.summaryShort ?? usageSignal.summary}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <AttentionHeadline>{order.headline}</AttentionHeadline>
            <p className="mt-2 text-[12px] leading-[1.5] text-brand-fog">{order.aiSummary}</p>
          </>
        )}
      </PreviewSection>
    </div>
  )
}

export default SalesOrderPreview
