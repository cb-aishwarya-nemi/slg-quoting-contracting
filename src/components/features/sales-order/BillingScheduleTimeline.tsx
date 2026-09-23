import { useState } from 'react'
import { CalendarClock, Check, ChevronDown, Clock, ExternalLink } from 'lucide-react'
import { cn, withRelativeAnnotation } from '@/lib/utils'
import { type BillingScheduleLine } from '@/data/salesOrderMock'

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
    badge: 'bg-neutral-100 text-brand-fog',
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
  const isOverdue = item.status === 'Pending' && getDaysUntilDue(statusDate) < 0
  const invoiceId = item.invoiceId
  const dateLabel = item.dateAnnotation
    ? `${item.billDate} (${item.dateAnnotation})`
    : withRelativeAnnotation(item.billDate)

  return (
    <div className={cn('relative flex items-start rounded-md', isOverdue && '-mx-2 bg-red-50/70 px-2')}>
      <div className="pointer-events-none relative z-10 flex w-5 shrink-0 justify-center pt-[7px]">
        <div className={cn('h-1.5 w-1.5 rounded-full', isOverdue ? 'bg-red-600' : 'bg-brand-navy/40')} />
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
                {item.status === 'Paid' ? 'View invoice' : 'Preview invoice'}
                <ExternalLink size={12} />
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 pt-[2px]">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              isOverdue ? 'bg-red-50 text-red-700' : config.badge
            )}
          >
            {item.status !== 'Paid' && <StatusIcon size={10} />}
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
  isLast,
}: {
  group: BillingYearGroup
  isExpanded: boolean
  onToggle: () => void
  isLast: boolean
}) {
  return (
    <div className="relative">
      {!isLast && (
        <div
          className="pointer-events-none absolute left-[25px] top-[18px] z-0 w-px bg-neutral-300"
          style={{ height: 'calc(100% + 12px)' }}
        />
      )}
      <div className="relative z-10 overflow-hidden rounded-lg border border-brand-navy/40 transition-all">
        <button
          type="button"
          onClick={onToggle}
          className="relative z-10 flex w-full cursor-pointer items-center justify-between gap-4 bg-white px-4 py-3 text-left transition-colors hover:bg-neutral-50"
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
          <span className="text-[16px] font-bold text-brand-navy">{formatAmount(group.totalAmount)}</span>
        </button>

        {isExpanded && (
          <div className="relative z-10 border-t border-brand-navy/40 bg-white px-4 py-2">
            <div className="space-y-2">
              {group.items.map((item, idx) => (
                <BillingQuarterRow key={item.id} item={item} isLast={idx === group.items.length - 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function BillingScheduleTimeline({
  items,
  tcv,
}: {
  items: BillingScheduleLine[]
  tcv?: string
}) {
  const yearGroups = groupBillingByYear(items)
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set(['Year 1']))

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  if (items.length === 0) {
    return <p className="py-4 text-[13px] text-brand-fog">No upcoming installments.</p>
  }

  return (
    <div>
      <div className="space-y-3">
        {yearGroups.map((group, idx) => (
          <BillingYearAccordion
            key={group.year}
            group={group}
            isExpanded={expandedYears.has(group.year)}
            onToggle={() => toggleYear(group.year)}
            isLast={idx === yearGroups.length - 1}
          />
        ))}
      </div>

      {tcv && (
        <div className="mt-6 flex items-center justify-end gap-3 pr-4">
          <span className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
            Total Contract Value (TCV)
          </span>
          <span className="text-[16px] font-bold text-brand-navy">{tcv}</span>
        </div>
      )}
    </div>
  )
}

export default BillingScheduleTimeline
