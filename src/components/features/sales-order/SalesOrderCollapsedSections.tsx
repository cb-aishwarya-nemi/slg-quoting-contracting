import { useState, type ReactNode } from 'react'
import { CalendarClock, Check, ChevronDown, Clock, ExternalLink, MessageCircleMore, TrendingDown, TrendingUp } from 'lucide-react'
import { cn, withRelativeAnnotation } from '@/lib/utils'
import { CommentsPanel } from '@/components/features/contract-processing'
import {
  type ActivityItem,
  type BillingScheduleLine,
  type SalesOrder,
  type SalesOrderRampPeriod,
  pioneerOverdueBillingSchedule,
} from '@/data/salesOrderMock'
import {
  AMENDMENT_HISTORY_VERSIONS,
  type AmendmentVersionSnapshot,
} from '@/data/salesOrderAmendmentHistoryMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'
import { SalesOrderHeaderTimeline } from './SalesOrderHeaderTimeline'

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
  const isOverdue =
    item.status === 'Pending' && getDaysUntilDue(statusDate) < 0
  const invoiceId = item.invoiceId
  const dateLabel = item.dateAnnotation
    ? `${item.billDate} (${item.dateAnnotation})`
    : withRelativeAnnotation(item.billDate)

  return (
    <div
      className={cn(
        'relative flex items-start rounded-md',
        isOverdue && '-mx-2 bg-red-50/70 px-2'
      )}
    >
      <div className="pointer-events-none relative z-10 flex w-5 shrink-0 justify-center pt-[7px]">
        <div
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            isOverdue ? 'bg-red-600' : 'bg-brand-navy/40'
          )}
        />
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
  hideChevron = false,
}: {
  group: BillingYearGroup
  isExpanded: boolean
  onToggle: () => void
  hideChevron?: boolean
}) {
  const showExpanded = hideChevron || isExpanded

  const headerContent = (
    <>
      <div className="flex items-center gap-3">
        {!hideChevron && (
          <ChevronDown
            size={18}
            className={cn(
              'shrink-0 text-blue-700 transition-transform duration-200',
              showExpanded && 'rotate-180'
            )}
          />
        )}
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
    </>
  )

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {hideChevron ? (
        <div className="flex w-full items-center justify-between gap-4 bg-white px-4 py-3 text-left">
          {headerContent}
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center justify-between gap-4 bg-white px-4 py-3 text-left transition-colors hover:bg-neutral-50"
        >
          {headerContent}
        </button>
      )}

      {showExpanded && (
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
          hideChevron={group.year === 'Year 1'}
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

type PeriodEntitlement = {
  label: string
  value: string
  /** Human-readable delta vs previous period, e.g. "+25 seats" */
  change?: string
}

const ORDER_ENTITLEMENTS: PeriodEntitlement[] = [
  { label: 'Seats', value: '50 seats' },
  { label: 'Environments', value: '5 sandboxes' },
]

const PERIOD_ENTITLEMENTS: Record<number, PeriodEntitlement[]> = {
  1: [
    { label: 'Seats', value: '50 seats' },
    { label: 'Environments', value: '5 sandboxes' },
    { label: 'API calls', value: '5M / year' },
  ],
  2: [
    { label: 'Seats', value: '75 seats', change: '+25 seats' },
    { label: 'Environments', value: '5 sandboxes' },
    { label: 'API calls', value: '5M / year' },
  ],
  3: [
    { label: 'Seats', value: '75 seats' },
    { label: 'Environments', value: '6 sandboxes', change: '+1 sandbox' },
    { label: 'API calls', value: '7.5M / year', change: '+2.5M' },
  ],
}

/** Entitlements as of a selected contract version (vs prior). */
const VERSION_ENTITLEMENTS: Record<string, PeriodEntitlement[]> = {
  v2: [
    { label: 'Seats', value: '75 seats', change: '+25 seats' },
    { label: 'Environments', value: '5 sandboxes' },
    { label: 'API calls', value: '5M / year' },
  ],
  v3: [
    { label: 'Seats', value: '75 seats', change: '+25 seats' },
    { label: 'Environments', value: '5 sandboxes' },
    { label: 'API calls', value: '5M / year' },
  ],
  v4: [
    { label: 'Seats', value: '75 seats' },
    { label: 'Environments', value: '6 sandboxes', change: '+1 sandbox' },
    { label: 'API calls', value: '7.5M / year', change: '+2.5M' },
  ],
}

function getProductsForTimelinePeriod(
  order: SalesOrder,
  periodIndex: number
): SalesOrderRampPeriod | undefined {
  const periods = order.productPeriods ?? []
  return periods[periodIndex - 1]
}

function VersionChangeSummary({ version }: { version: AmendmentVersionSnapshot }) {
  const kind = version.changeKind ?? 'expansion'
  const isExpansion = kind === 'expansion'
  const Icon = isExpansion ? TrendingUp : TrendingDown

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            isExpansion ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'
          )}
        >
          <Icon size={12} strokeWidth={2.25} className="shrink-0" />
          {isExpansion ? 'Expansion' : 'Contraction'}
        </span>
        <span className="text-[12px] font-semibold text-brand-navy">{version.version}</span>
        <span className="text-[12px] text-brand-fog">· {version.date}</span>
      </div>
      <p
        className={cn(
          'mt-1.5 text-[13px] leading-[1.55]',
          isExpansion ? 'text-green-950/80' : 'text-amber-950/80'
        )}
      >
        {version.changeSummary}
      </p>
    </div>
  )
}

function EntitlementChangeBadge({ change }: { change: string }) {
  const isIncrease = !change.trim().startsWith('-')
  const Icon = isIncrease ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-green-700">
      <Icon size={12} strokeWidth={2} className="shrink-0 text-green-700" />
      {change}
    </span>
  )
}

function EntitlementRow({
  label,
  value,
  change,
  isLast = false,
}: {
  label: string
  value: ReactNode
  change?: string
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
      <span className="flex min-w-0 items-center gap-2 text-[14px] font-medium text-brand-navy">
        <span>{value}</span>
        {change ? <EntitlementChangeBadge change={change} /> : null}
      </span>
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
      {open && (
        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-3">
          {children}
        </div>
      )}
    </section>
  )
}

export function SalesOrderCollapsedSections({
  order,
  variant,
  setSectionRef,
}: {
  order: SalesOrder
  variant?: string | null
  setSectionRef?: (id: string) => (el: HTMLElement | null) => void
}) {
  const [showCommentAddNote, setShowCommentAddNote] = useState(false)
  const billingSchedule =
    variant === 'invoice-overdue' ? pioneerOverdueBillingSchedule : order.upcomingBillingSchedule
  const showTimeline = variant == null || variant === 'just-created'

  const renderSections = (periodIndex = 1, selectedVersionId?: string) => {
    const selectedVersion = selectedVersionId
      ? AMENDMENT_HISTORY_VERSIONS.find((v) => v.id === selectedVersionId)
      : undefined
    const timelinePeriod = showTimeline
      ? getProductsForTimelinePeriod(order, periodIndex)
      : undefined
    // Keep period identity (name + dates); only swap line items for the selected version
    const productsPeriod: SalesOrderRampPeriod | undefined =
      selectedVersion && timelinePeriod
        ? { ...timelinePeriod, items: selectedVersion.products }
        : timelinePeriod
    const entitlements =
      (selectedVersion && VERSION_ENTITLEMENTS[selectedVersion.id]) ||
      (showTimeline
        ? PERIOD_ENTITLEMENTS[periodIndex] ?? PERIOD_ENTITLEMENTS[1]
        : ORDER_ENTITLEMENTS)

    return (
      <>
        {selectedVersion?.changeKind ? (
          <VersionChangeSummary version={selectedVersion} />
        ) : null}

        <section ref={setSectionRef?.('products')} className="group/section">
          <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
            Products and pricing
          </h2>
          <div className="mt-4">
            {productsPeriod ? (
              <ReadOnlyProductsList
                key={
                  selectedVersion
                    ? `${productsPeriod.id}-${selectedVersion.id}`
                    : productsPeriod.id
                }
                items={productsPeriod.items}
                periods={[productsPeriod]}
              />
            ) : (
              <ReadOnlyProductsList items={order.products} periods={order.productPeriods} />
            )}
          </div>
        </section>

        <section ref={setSectionRef?.('entitlements')} className="group/section">
          <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
            Entitlements
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-20">
            <div className="min-w-0 overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <div className="px-3 py-1">
                {entitlements.map((row, idx) => (
                  <EntitlementRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    change={row.change}
                    isLast={idx === entitlements.length - 1}
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
            <BillingScheduleTimeline items={billingSchedule} />
          </div>
        </section>

        <section ref={setSectionRef?.('linked')} className="group/section">
          <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
            Linked records
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-20">
            <div className="min-w-0 overflow-hidden rounded-lg border border-neutral-200 bg-white">
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
      </>
    )
  }

  if (showTimeline) {
    return (
      <SalesOrderHeaderTimeline orderId={order.id} variant={variant}>
        {({ periodIndex, selectedVersionId }) =>
          renderSections(periodIndex, selectedVersionId)
        }
      </SalesOrderHeaderTimeline>
    )
  }

  return <div className="space-y-10">{renderSections()}</div>
}

export default SalesOrderCollapsedSections
