import { useState, type ReactNode } from 'react'
import { CalendarClock, Check, ChevronDown, Clock, ExternalLink, MessageCircleMore } from 'lucide-react'
import { cn, withRelativeAnnotation } from '@/lib/utils'
import { CommentsPanel } from '@/components/features/contract-processing'
import { STATUS_STYLES, type InvoiceStatus } from '@/data/invoiceListMock'
import { type ActivityItem, type BillingScheduleLine, type SalesOrder } from '@/data/salesOrderMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'

const SECTION_DATA_CONTAINER = 'overflow-hidden rounded-lg border border-neutral-200'

/** Prototype “today” — keeps overdue copy stable (matches contract billing schedule). */
const SCHEDULE_TODAY = new Date('2026-06-22')

const STATUS_CONFIG = {
  Paid: {
    icon: Check,
    badge: 'bg-green-50 text-green-700',
  },
  Pending: {
    icon: Clock,
    badge: 'bg-amber-50 text-amber-700',
  },
  Upcoming: {
    icon: CalendarClock,
    badge: 'bg-violet-50 text-violet-700',
  },
} as const

interface BillingYearGroup {
  year: string
  items: BillingScheduleLine[]
  totalAmount: number
}

function parseAmount(amount: string): number {
  return parseFloat(amount.replace(/[$,]/g, ''))
}

function formatAmount(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function groupBillingByYear(items: BillingScheduleLine[]): BillingYearGroup[] {
  const groups: Record<string, BillingScheduleLine[]> = {}
  items.forEach((item) => {
    const yearMatch = item.installment.match(/Year (\d+)/)
    const year = yearMatch ? `Year ${yearMatch[1]}` : 'Year 1'
    if (!groups[year]) groups[year] = []
    groups[year].push(item)
  })
  return Object.entries(groups).map(([year, yearItems]) => ({
    year,
    items: yearItems,
    totalAmount: yearItems.reduce((sum, item) => sum + parseAmount(item.amount), 0),
  }))
}

function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate)
  const diffTime = due.getTime() - SCHEDULE_TODAY.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getStatusLabel(status: BillingScheduleLine['status'], dueDate: string): string {
  if (status === 'Paid') return 'Paid'
  if (status === 'Pending') {
    const daysUntil = getDaysUntilDue(dueDate)
    if (daysUntil === 0) return 'Due today'
    if (daysUntil === 1) return 'Due in 1 day'
    if (daysUntil > 1) return `Due in ${daysUntil} days`
    const overdue = Math.abs(daysUntil)
    return `Overdue by ${overdue} ${overdue === 1 ? 'day' : 'days'}`
  }
  return 'Upcoming'
}

function openInvoiceViewer(invoiceId: string) {
  window.open(
    `/invoice-viewer.html?invoice=${encodeURIComponent(invoiceId)}`,
    `invoice-${invoiceId}`,
    'popup,width=720,height=860'
  )
}

function BillingQuarterRow({
  item,
  isLast,
}: {
  item: BillingScheduleLine
  isLast: boolean
}) {
  const config = STATUS_CONFIG[item.status]
  const StatusIcon = config.icon
  const quarterMatch = item.installment.match(/Q(\d+)/)
  const quarter = quarterMatch ? `Q${quarterMatch[1]}` : item.installment
  const statusDate = item.dueDate ?? item.billDate
  const statusLabel = getStatusLabel(item.status, statusDate)
  const invoiceId = item.invoiceId
  const dateLabel = item.dateAnnotation
    ? `${item.billDate} (${item.dateAnnotation})`
    : withRelativeAnnotation(item.billDate)

  return (
    <div className="relative flex items-start">
      <div className="pointer-events-none relative z-10 flex w-5 shrink-0 justify-center pt-[7px]">
        <div className="h-1.5 w-1.5 rounded-full bg-brand-navy/40" />
      </div>

      {!isLast && (
        <div
          className="pointer-events-none absolute left-[9px] top-[13px] w-px bg-brand-navy/15"
          style={{ bottom: -6 }}
        />
      )}

      <button
        type="button"
        onClick={() => invoiceId && openInvoiceViewer(invoiceId)}
        className={cn(
          'ml-3 flex flex-1 items-start justify-between gap-4 border-b border-transparent pt-0.5 pb-1.5 text-left transition-colors',
          invoiceId && 'group cursor-pointer hover:border-neutral-200'
        )}
      >
        <div>
          <p className="text-[12px] text-brand-fog">{dateLabel}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[14px] font-medium text-brand-navy">{quarter}</span>
            {invoiceId && (
              <span className="flex items-center gap-1 text-[12px] font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                Preview invoice
                <ExternalLink size={12} />
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 pt-[2px]">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              config.badge
            )}
          >
            <StatusIcon size={10} />
            {statusLabel}
          </span>
          <span className="text-[14px] font-semibold text-brand-navy">{item.amount}</span>
        </div>
      </button>
    </div>
  )
}

function BillingYearAccordion({
  group,
  isExpanded,
  onToggle,
}: {
  group: BillingYearGroup
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 bg-white px-4 py-3 text-left transition-colors hover:bg-neutral-50"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            size={18}
            className={cn(
              'shrink-0 text-blue-700 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
          <div>
            <span className="text-[15px] font-semibold text-brand-navy">{group.year}</span>
            <span className="ml-2 text-[12px] text-brand-fog">
              {group.items.length} {group.items.length === 1 ? 'payment' : 'payments'}
            </span>
          </div>
        </div>
        <span className="text-[16px] font-bold text-brand-navy">
          {formatAmount(group.totalAmount)}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-neutral-200 bg-white px-4 py-2">
          <div className="space-y-2">
            {group.items.map((item, idx) => (
              <BillingQuarterRow
                key={item.id}
                item={item}
                isLast={idx === group.items.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BillingScheduleTimeline({ items }: { items: BillingScheduleLine[] }) {
  const yearGroups = groupBillingByYear(items)
  const [showAdditionalYears, setShowAdditionalYears] = useState(false)
  const [expandedYears, setExpandedYears] = useState<Set<string>>(
    () => new Set(yearGroups[0] ? [yearGroups[0].year] : [])
  )

  if (yearGroups.length === 0) {
    return <p className="py-4 text-[13px] text-brand-fog">No upcoming installments.</p>
  }

  const additionalYearCount = yearGroups.length - 1
  const visibleGroups = showAdditionalYears ? yearGroups : yearGroups.slice(0, 1)

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  const revealAdditionalYears = () => {
    setShowAdditionalYears(true)
  }

  return (
    <div className="space-y-3">
      {visibleGroups.map((group) => (
        <BillingYearAccordion
          key={group.year}
          group={group}
          isExpanded={expandedYears.has(group.year)}
          onToggle={() => toggleYear(group.year)}
        />
      ))}
      {!showAdditionalYears && additionalYearCount > 0 && (
        <button
          type="button"
          onClick={revealAdditionalYears}
          className="cursor-pointer text-[13px] text-brand-navy underline decoration-brand-mist decoration-1 underline-offset-[3px] transition-colors hover:text-blue-700 hover:decoration-blue-700"
        >
          {additionalYearCount === 1
            ? '1 more year'
            : `${additionalYearCount} more years`}
        </button>
      )}
    </div>
  )
}

const ORDER_ENTITLEMENTS = [
  { label: 'Seats', value: '50 seats' },
  { label: 'Environments', value: '5 sandboxes' },
]

const ORDER_CONFIGURATIONS = [
  { label: 'Auto collection', value: 'On' },
  { label: 'Invoice closure', value: 'Manual' },
  { label: 'Tax exemption', value: 'Exempted' },
  { label: 'Payment method', value: 'Card details' },
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

function LinkedRecordRow({
  label,
  value,
  isLast = false,
}: {
  label: string
  value: string
  isLast?: boolean
}) {
  const isEmpty = value === '—' || value === ''
  return (
    <div
      className={cn(
        'flex items-center py-2.5 pl-1 pr-2',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <span className="w-[148px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        {label}
      </span>
      {isEmpty ? (
        <span className="text-[14px] text-brand-fog">—</span>
      ) : (
        <a className="cursor-pointer text-[14px] font-medium text-blue-700 hover:underline">
          {value}
        </a>
      )}
    </div>
  )
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
  defaultOpen = false,
  children,
}: {
  title: string
  commentCount?: number
  trailing?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

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

export function SalesOrderCollapsedSections({
  order,
  setSectionRef,
}: {
  order: SalesOrder
  setSectionRef?: (id: string) => (el: HTMLElement | null) => void
}) {
  const [showCommentAddNote, setShowCommentAddNote] = useState(false)

  return (
    <div className="space-y-10">
      <section ref={setSectionRef?.('products')} className="group/section">
        <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Products and pricing
        </h2>
        <div className="mt-4">
          <ReadOnlyProductsList items={order.products} periods={order.productPeriods} />
        </div>
      </section>

      <section ref={setSectionRef?.('entitlements')} className="group/section">
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

      <section ref={setSectionRef?.('schedule')} className="group/section">
        <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Billing schedule
        </h2>
        <div className="mt-4">
          <BillingScheduleTimeline items={order.upcomingBillingSchedule} />
        </div>
      </section>

      <section ref={setSectionRef?.('invoices')} className="group/section">
        <CollapsibleSection title="Past invoices" defaultOpen>
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
      </section>

      <section ref={setSectionRef?.('configurations')} className="group/section">
        <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Configurations
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-20">
          <div className="min-w-0 overflow-hidden rounded-lg border border-neutral-200">
            <div className="px-3 py-1">
              {ORDER_CONFIGURATIONS.map((row, idx) => (
                <EntitlementRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  isLast={idx === ORDER_CONFIGURATIONS.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={setSectionRef?.('linked')} className="group/section">
        <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Linked records
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-20">
          <div className="min-w-0 overflow-hidden rounded-lg border border-neutral-200">
            <div className="px-3 py-1">
              {order.linkedRecords.map((row, idx) => (
                <LinkedRecordRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  isLast={idx === order.linkedRecords.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={setSectionRef?.('comments')} className="group/section">
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
      </section>

      <section ref={setSectionRef?.('activity')} className="group/section">
        <CollapsibleSection title="Activity">
          <ActivityTimeline items={order.activity} />
        </CollapsibleSection>
      </section>
    </div>
  )
}

export default SalesOrderCollapsedSections
