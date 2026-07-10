import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import {
  Maximize2,
  Focus,
  MoreHorizontal,
  FilePenLine,
  Download,
  MessageCircleMore,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  InPageNav,
  SectionHeader,
  CommentsPanel,
  GradientSparkle,
  type NavSection,
} from '@/components/features/contract-processing'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { STATUS_STYLES, type InvoiceStatus } from '@/data/invoiceListMock'
import {
  type SalesOrder,
  type ActivityItem,
  type UsageSummaryFeature,
  type UsageSummaryCycle,
  getUsageSummaryCycles,
} from '@/data/salesOrderMock'
import {
  getSalesOrderPaymentSummary,
  getUsageAttentionSignal,
  salesOrdersListData,
  type SalesOrderListItem,
  type InvoiceTimingTone,
  type UsageTermRow,
} from '@/data/salesOrdersListMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'

const NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'ai' },
  { id: 'entitlements', label: 'Usage summary', status: 'neutral' },
  { id: 'products', label: 'Products and pricing', status: 'neutral' },
  { id: 'invoices', label: 'Past invoices', status: 'neutral' },
  { id: 'schedule', label: 'Upcoming billing schedule', status: 'neutral' },
  { id: 'comments', label: 'Comments', status: 'neutral' },
  { id: 'activity', label: 'Activity', status: 'neutral' },
]

const LEFT_NAV_WIDTH = 48
// Shift the in-page nav rail so it aligns with the SO id label (past the switcher
// chevron ≈ 20px button + 8px gap), not the switcher icon.
const NAV_ALIGN_OFFSET = 24
const CONTENT_MAX_WIDTH = 1040
const SECTION_DATA_CONTAINER = 'overflow-hidden rounded-lg border border-neutral-200'

const SCHEDULE_STATUS_STYLES: Record<BillingStatus, { bg: string; text: string }> = {
  Paid: { bg: 'bg-green-50', text: 'text-green-700' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  Upcoming: { bg: 'bg-neutral-100', text: 'text-brand-fog' },
}

type BillingStatus = 'Paid' | 'Pending' | 'Upcoming'

interface SalesOrderDetailsProps {
  order: SalesOrder
  orders: SalesOrder[]
  activeOrderId: string
  onSelectOrder: (id: string) => void
}

const INVOICE_TIMING_STYLES: Record<InvoiceTimingTone, string> = {
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

const ATTENTION_INVOICE_ROW =
  'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] items-center gap-x-6 border-b border-neutral-200 py-2.5'

const USAGE_PATTERN_ROW =
  'flex items-center gap-4 border-b border-neutral-200 py-2.5'

const USAGE_INCLUDED_STYLES: Record<'default' | 'warning' | 'danger', string> = {
  default: 'text-brand-navy',
  warning: 'text-amber-700',
  danger: 'text-red-700',
}

function UsageAmountDisplay({
  included,
  onDemand,
  includedTone = 'default',
}: {
  included: string
  onDemand: string
  includedTone?: 'default' | 'warning' | 'danger'
}) {
  const onDemandValue = onDemand.replace(/,/g, '')
  const hasOnDemand = onDemandValue !== '' && Number(onDemandValue) !== 0

  return (
    <p className="min-w-0 whitespace-nowrap text-left text-[13px] tabular-nums text-brand-navy">
      <span className={cn('font-semibold', USAGE_INCLUDED_STYLES[includedTone])}>{included}</span>
      {hasOnDemand && (
        <>
          <span className="px-1.5 text-brand-mist">·</span>
          <span className="font-medium">{onDemand}</span>
          <span className="font-normal text-brand-fog"> on-demand</span>
        </>
      )}
    </p>
  )
}

function PaymentDetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={cn('flex items-center gap-4 border-b border-neutral-200 py-2.5')}>
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

const ATTENTION_ACTION_CLASS =
  'shrink-0 cursor-pointer rounded-md border border-brand-navy bg-white px-2.5 py-1 text-[12px] font-medium text-brand-navy transition-colors hover:bg-neutral-50'

function AttentionItem({
  headline,
  summary,
  actionLabel,
  showAction = true,
}: {
  headline: ReactNode
  summary: string
  actionLabel: string
  showAction?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="max-w-[720px] shrink-0 font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.5px] text-brand-navy">
          {headline}
        </h2>
        <div className="h-px min-w-6 flex-1 bg-brand-navy" />
        {showAction && (
          <button type="button" className={ATTENTION_ACTION_CLASS}>
            {actionLabel}
          </button>
        )}
      </div>
      <p className="mt-3 max-w-[720px] text-[13px] leading-[1.6] text-brand-navy">{summary}</p>
    </div>
  )
}

function UsagePatternTable({ terms }: { terms: UsageTermRow[] }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-20">
      <div className="min-w-0">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
          Usage pattern
        </p>
        <div>
          {terms.map((row) => (
            <div key={row.billingTerm} className={USAGE_PATTERN_ROW}>
              <span className="w-[88px] shrink-0 text-[13px] font-medium text-brand-navy">
                {row.billingTerm}
              </span>
              <UsageAmountDisplay
                included={row.included}
                onDemand={row.onDemand}
                includedTone={row.includedTone}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UsageSummaryTable({ features }: { features: UsageSummaryFeature[] }) {
  const rowGridClass = 'grid grid-cols-[minmax(200px,320px)_1fr] items-center gap-x-16'

  return (
    <div className={SECTION_DATA_CONTAINER}>
      <div className={cn(rowGridClass, 'border-b border-neutral-200 bg-neutral-50/50 px-4 py-2.5')}>
        <span className="text-left text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
          Feature
        </span>
        <span className="text-left text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
          Usage
        </span>
      </div>
      {features.map((row, idx) => (
        <div
          key={row.feature}
          className={cn(
            rowGridClass,
            'group relative cursor-pointer border-b border-neutral-200 px-4 py-2.5 pr-10 transition-colors hover:bg-neutral-50',
            idx === features.length - 1 && 'border-b-0'
          )}
        >
          <span className="min-w-0 text-left text-[13px] font-medium text-brand-navy">{row.feature}</span>
          <div className="min-w-0 justify-self-start text-left">
            <UsageAmountDisplay
              included={row.included}
              onDemand={row.onDemand}
              includedTone={row.includedTone}
            />
          </div>
          <ArrowRight
            size={14}
            strokeWidth={2}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-fog opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
      ))}
    </div>
  )
}

function UsageCycleDropdown({
  cycles,
  selectedId,
  onSelect,
}: {
  cycles: UsageSummaryCycle[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const selectedCycle = cycles.find((cycle) => cycle.id === selectedId) ?? cycles[0]

  return (
    <div ref={dropdownRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium leading-none text-brand-navy transition-colors hover:text-blue-700"
      >
        <span>{selectedCycle?.label ?? 'Current cycle'}</span>
        <ChevronDown
          size={12}
          className={cn('text-brand-fog transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[148px] overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {cycles.map((cycle) => (
            <button
              key={cycle.id}
              type="button"
              onClick={() => {
                onSelect(cycle.id)
                setIsOpen(false)
              }}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-[13px] transition-colors hover:bg-neutral-50',
                cycle.id === selectedId
                  ? 'font-medium text-brand-navy'
                  : 'font-normal text-brand-navy'
              )}
            >
              <span>{cycle.label}</span>
              {cycle.isCurrent && (
                <span className="text-[11px] font-medium text-brand-fog">Current</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function UsageSummarySection({ order }: { order: SalesOrder }) {
  const cycles = useMemo(() => getUsageSummaryCycles(order), [order])
  const defaultCycleId = cycles.find((cycle) => cycle.isCurrent)?.id ?? cycles[0]?.id ?? ''
  const [selectedCycleId, setSelectedCycleId] = useState(defaultCycleId)

  useEffect(() => {
    setSelectedCycleId(cycles.find((cycle) => cycle.isCurrent)?.id ?? cycles[0]?.id ?? '')
  }, [order.id, cycles])

  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? cycles[0]

  return (
    <div style={{ maxWidth: CONTENT_MAX_WIDTH }}>
      <div className="flex items-center gap-6">
        <span className="text-[12px] font-semibold uppercase leading-none tracking-[-0.25px] text-brand-navy">
          Usage summary
        </span>
        <UsageCycleDropdown
          cycles={cycles}
          selectedId={selectedCycleId}
          onSelect={setSelectedCycleId}
        />
      </div>
      <div className="mt-4">
        {selectedCycle && <UsageSummaryTable features={selectedCycle.features} />}
      </div>
    </div>
  )
}

/** Payment attention block for the V1 Summary section. */
function PaymentAttentionSummary({ order }: { order: SalesOrder }) {
  const listItem = resolveListItem(order)
  const summary = getSalesOrderPaymentSummary(order.id, listItem)
  const usageSignal = getUsageAttentionSignal(order.id)
  const overdueLabel =
    summary.overdueDays === 1 ? '1 day' : `${summary.overdueDays} days`

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
          2 items need attention
        </span>
      </div>

      <AttentionItem
        headline={
          <>
            Last invoice overdue by{' '}
            <span className="font-semibold text-red-700">{overdueLabel}</span>
            {' — '}
            <span className="font-semibold">{summary.overdueAmount}</span>
          </>
        }
        summary={summary.patternSummary}
        actionLabel="Send payment reminder"
        showAction={summary.overdueDays > 0}
      />

      <div className="mt-8 grid grid-cols-2 gap-20">
        <div className="min-w-0">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
            Past 5 invoices
          </p>
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

        <div className="min-w-0">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
            Payment details
          </p>
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

      {usageSignal && (
        <div className="mt-14">
          <AttentionItem
            headline={
              <>
                Image creation at <span className="font-semibold">91%</span> of monthly cap with{' '}
                <span className="font-semibold">9 days</span> left in the cycle
              </>
            }
            summary={usageSignal.summary}
            actionLabel={usageSignal.ctaLabel}
          />
          <UsagePatternTable terms={usageSignal.usagePattern} />
        </div>
      )}
    </div>
  )
}

/** Activity timeline reusing the PaymentSchedule dot + vertical-connector look. */
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

export function SalesOrderDetailsV1({
  order,
  orders,
  activeOrderId,
  onSelectOrder,
}: SalesOrderDetailsProps) {
  const [activeSection, setActiveSection] = useState('summary')
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showCommentAddNote, setShowCommentAddNote] = useState(false)

  const centerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollTargetRef = useRef<string | null>(null)

  // Reset active section + scroll when the order changes
  useEffect(() => {
    setActiveSection('summary')
    if (centerRef.current) centerRef.current.scrollTo({ top: 0 })
  }, [order])

  const setSectionRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      sectionRefs.current[id] = el
    },
    []
  )

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id]
    const container = centerRef.current
    if (el && container) {
      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop
      scrollTargetRef.current = id
      container.scrollTo({ top: Math.max(top - 12, 0), behavior: 'smooth' })
    }
  }, [])

  // Scroll spy — runs during smooth programmatic scroll so the nav indicator animates fluidly
  useEffect(() => {
    const container = centerRef.current
    if (!container) return

    const updateActiveSection = () => {
      const containerTop = container.getBoundingClientRect().top
      let current = NAV_SECTIONS[0].id
      for (const section of NAV_SECTIONS) {
        const el = sectionRefs.current[section.id]
        if (!el) continue
        if (el.getBoundingClientRect().top - containerTop <= 48) {
          current = section.id
        }
      }
      setActiveSection(current)
    }

    const handleScrollEnd = () => {
      if (scrollTargetRef.current) {
        setActiveSection(scrollTargetRef.current)
        scrollTargetRef.current = null
      } else {
        updateActiveSection()
      }
    }

    container.addEventListener('scroll', updateActiveSection)
    container.addEventListener('scrollend', handleScrollEnd)
    return () => {
      container.removeEventListener('scroll', updateActiveSection)
      container.removeEventListener('scrollend', handleScrollEnd)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setShowMoreMenu(false)
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreMenu])

  // Rich list-row items — mirrors the Contract Processing task switcher popover
  const switcherItems: SwitcherItem[] = orders.map((o) => ({
    id: o.id,
    label: o.totalContractValue,
    taskType: o.soId,
    status: o.dealTag,
    customer: o.customerName,
  }))

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
      {/* Secondary nav */}
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
              <button
                type="button"
                onClick={() => setIsPanelsExpanded((prev) => !prev)}
                className={cn(
                  'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-neutral-100',
                  isPanelsExpanded ? 'text-brand-navy' : 'text-blue-700'
                )}
                title={isPanelsExpanded ? 'Focus mode (hide panels)' : 'Restore panels'}
              >
                {isPanelsExpanded ? <Maximize2 size={16} /> : <Focus size={16} />}
              </button>
            </div>
            <div className="mt-0.5 text-[12px] tracking-[-0.25px] text-brand-fog">
              Created {order.createdOn} · {order.rampDetails} · Starts {order.startDate}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Subtle, lightweight CTAs — max two inline + a More menu */}
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

      {/* Body: absolute left nav + centered content column (mirrors Contract Processing) */}
      <div className="relative min-h-0 flex-1">
        <aside
          className="absolute top-0 bottom-0 z-10 overflow-visible pt-4 transition-all duration-300 ease-out"
          style={{ left: NAV_ALIGN_OFFSET, width: isPanelsExpanded ? LEFT_NAV_WIDTH : 0 }}
        >
          <div
            className={cn(
              'transition-opacity duration-200',
              isPanelsExpanded ? 'opacity-100 delay-100' : 'opacity-0'
            )}
            style={{ width: LEFT_NAV_WIDTH }}
          >
            <InPageNav
              sections={NAV_SECTIONS}
              sourceDocuments={[]}
              activeId={activeSection}
              onNavigate={scrollToSection}
            />
          </div>
        </aside>

        <div
          ref={centerRef}
          className="h-full overflow-y-auto pb-20 pt-12"
          style={{ marginLeft: isPanelsExpanded ? LEFT_NAV_WIDTH + NAV_ALIGN_OFFSET : 0 }}
        >
          <div className="mx-auto space-y-14" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
            {/* Summary */}
            <section ref={setSectionRef('summary')} className="group/section">
              <div style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <PaymentAttentionSummary order={order} />
              </div>
            </section>

            {/* Usage summary */}
            <section ref={setSectionRef('entitlements')} className="group/section">
              <UsageSummarySection order={order} />
            </section>

            {/* Products and pricing — ramp view mirroring Contract Processing */}
            <section ref={setSectionRef('products')} className="group/section">
              <SectionHeader title="Products and pricing" hideLine />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <ReadOnlyProductsList items={order.products} periods={order.productPeriods} />
              </div>
            </section>

            {/* Past invoices */}
            <section ref={setSectionRef('invoices')} className="group/section">
              <SectionHeader title="Past invoices" hideLine />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
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
              </div>
            </section>

            {/* Upcoming billing schedule */}
            <section ref={setSectionRef('schedule')} className="group/section">
              <SectionHeader title="Upcoming billing schedule" hideLine />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <div className={SECTION_DATA_CONTAINER}>
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
                          <span className="flex-1 text-[13px] text-brand-fog">
                            {line.installment}
                          </span>
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
              </div>
            </section>

            {/* Comments — Add note lives in the section title area */}
            <section ref={setSectionRef('comments')} className="group/section">
              <SectionHeader
                title="Comments"
                hideLine
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
              />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
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
              </div>
            </section>

            {/* Activity — timeline of key events (most recent first) */}
            <section ref={setSectionRef('activity')} className="group/section">
              <SectionHeader title="Activity" hideLine />
              <div className="mt-4" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
                <ActivityTimeline items={order.activity} />
              </div>
            </section>

            {/* Bottom breathing room */}
            <div aria-hidden="true" style={{ height: 260 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesOrderDetailsV1
