import { useState, type ReactNode } from 'react'
import { ChevronDown, MessageCircleMore } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommentsPanel } from '@/components/features/contract-processing'
import { STATUS_STYLES, type InvoiceStatus } from '@/data/invoiceListMock'
import { type ActivityItem, type SalesOrder } from '@/data/salesOrderMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'

const SECTION_DATA_CONTAINER = 'overflow-hidden rounded-lg border border-neutral-200'

const SCHEDULE_STATUS_STYLES: Record<'Paid' | 'Pending' | 'Upcoming', { bg: string; text: string }> = {
  Paid: { bg: 'bg-green-50', text: 'text-green-700' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  Upcoming: { bg: 'bg-neutral-100', text: 'text-brand-fog' },
}

function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <div key={item.id} className="relative flex items-start">
            <div className="relative z-10 flex w-5 shrink-0 justify-center pt-[6px]">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-navy/40" />
            </div>
            {!isLast && (
              <div
                className="pointer-events-none absolute left-[9px] top-[12px] w-px bg-brand-navy/15"
                style={{ bottom: -6 }}
              />
            )}
            <div className="ml-3 flex-1 pb-4">
              <p className="text-[12px] text-brand-fog">{item.date}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[14px] font-medium text-brand-navy">{item.label}</span>
                {item.refId && (
                  <a className="cursor-pointer text-[13px] text-blue-700 hover:underline">
                    {item.refId}
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CollapsibleSection({
  title,
  commentCount,
  trailing,
  children,
}: {
  title: string
  commentCount?: number
  trailing?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-3 text-left"
        aria-expanded={open}
      >
        <span className="shrink-0 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          {title}
        </span>
        <div className="flex-1" />
        {open && trailing && (
          <div
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {trailing}
          </div>
        )}
        {commentCount !== undefined && commentCount > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-brand-navy px-2 py-0.5 text-[11px] font-medium text-brand-navy">
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </span>
        )}
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-brand-fog transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  )
}

const ORDER_ENTITLEMENTS = [
  { label: 'Seats', value: '50 seats' },
  { label: 'Environments', value: '3 sandboxes' },
  { label: 'Support tier', value: 'Premium SLA' },
]

function EntitlementRow({
  label,
  value,
  isLast = false,
}: {
  label: string
  value: string
  isLast?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center py-2.5 pl-1 pr-2',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <span className="w-[128px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        {label}
      </span>
      <span className="text-[14px] font-medium text-brand-navy">{value}</span>
    </div>
  )
}

export function SalesOrderCollapsedSections({ order }: { order: SalesOrder }) {
  const [showCommentAddNote, setShowCommentAddNote] = useState(false)

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Products and pricing
        </h2>
        <div className="mt-4">
          <ReadOnlyProductsList items={order.products} periods={order.productPeriods} />
        </div>
      </section>

      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Entitlements
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-20">
          <div className="min-w-0 overflow-hidden rounded-lg border border-neutral-200">
            <div className="px-3 py-1">
              {ORDER_ENTITLEMENTS.map((row, idx) => (
                <EntitlementRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  isLast={idx === ORDER_ENTITLEMENTS.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Upcoming billing schedule
        </h2>
        <div className={cn('mt-4', SECTION_DATA_CONTAINER)}>
          {order.upcomingBillingSchedule.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-brand-fog">No upcoming installments.</p>
          ) : (
            order.upcomingBillingSchedule.map((line, idx) => {
              const style = SCHEDULE_STATUS_STYLES[line.status]
              return (
                <div
                  key={line.id}
                  className={cn(
                    'flex items-center border-b border-neutral-200 px-4 py-2.5',
                    idx === order.upcomingBillingSchedule.length - 1 && 'border-b-0'
                  )}
                >
                  <span className="w-[130px] shrink-0 text-[13px] text-brand-navy">
                    {line.billDate}
                  </span>
                  <span className="flex-1 text-[13px] text-brand-fog">{line.installment}</span>
                  <span
                    className={cn(
                      'mr-4 inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium',
                      style.bg,
                      style.text
                    )}
                  >
                    {line.status}
                  </span>
                  <span className="w-[110px] shrink-0 text-right text-[14px] font-semibold text-brand-navy">
                    {line.amount}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>

      <CollapsibleSection title="Past invoices">
        <div className={SECTION_DATA_CONTAINER}>
          {order.pastInvoices.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-brand-fog">No invoices yet.</p>
          ) : (
            order.pastInvoices.map((inv, idx) => {
              const style = STATUS_STYLES[inv.status as InvoiceStatus]
              return (
                <div
                  key={inv.id}
                  className={cn(
                    'flex items-center border-b border-neutral-200 px-4 py-2.5',
                    idx === order.pastInvoices.length - 1 && 'border-b-0'
                  )}
                >
                  <a className="w-[160px] shrink-0 cursor-pointer text-[14px] font-medium text-blue-700 hover:underline">
                    {inv.invoiceId}
                  </a>
                  <span className="flex-1 text-[13px] text-brand-fog">{inv.date}</span>
                  <span
                    className={cn(
                      'mr-4 inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium',
                      style.bg,
                      style.text
                    )}
                  >
                    {inv.status}
                  </span>
                  <span className="w-[110px] shrink-0 text-right text-[14px] font-semibold text-brand-navy">
                    {inv.amount}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Comments"
        commentCount={order.comments.length}
        trailing={
          <button
            type="button"
            onClick={() => setShowCommentAddNote((prev) => !prev)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors',
              showCommentAddNote ? 'bg-blue-50 text-blue-700' : 'text-blue-700 hover:bg-blue-50'
            )}
          >
            <MessageCircleMore size={14} />
            Add note
          </button>
        }
      >
        {order.comments.length === 0 && !showCommentAddNote ? (
          <p className="py-4 text-[13px] text-brand-fog">No comments yet.</p>
        ) : (
          <CommentsPanel
            comments={order.comments}
            hideHeader
            dense
            showAddNote={showCommentAddNote}
            onShowAddNoteChange={setShowCommentAddNote}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Activity">
        <ActivityTimeline items={order.activity} />
      </CollapsibleSection>
    </div>
  )
}

export default SalesOrderCollapsedSections
