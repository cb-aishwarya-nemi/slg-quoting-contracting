import { useState, useRef, useEffect, useCallback } from 'react'
import { Maximize2, Focus, MoreHorizontal, FilePenLine, Download, MessageCircleMore } from 'lucide-react'
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
import { type SalesOrder, type ActivityItem } from '@/data/salesOrderMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'

const NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'ai' },
  { id: 'products', label: 'Products and pricing', status: 'neutral' },
  { id: 'entitlements', label: 'Committed entitlements', status: 'neutral' },
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
const AI_NOTE_WIDTH = 720
// Body content under the title for sections other than the note + products/pricing
const SECTION_CONTENT_WIDTH = 720

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

function MetricsRow({ metrics }: { metrics: { label: string; value: string; link?: boolean }[] }) {
  return (
    <div className="flex flex-wrap">
      {metrics.map((metric, idx) => (
        <div key={idx} className="flex flex-1 items-start">
          <div className="flex-1 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-brand-navy">
              {metric.label}
            </div>
            <div className="mt-1">
              <span
                className={cn(
                  'text-[15px] font-semibold',
                  metric.link ? 'cursor-pointer text-blue-700 hover:underline' : 'text-brand-navy'
                )}
              >
                {metric.value}
              </span>
            </div>
          </div>
          {idx < metrics.length - 1 && (
            <div className="mx-4 h-12 w-px self-center bg-neutral-200" />
          )}
        </div>
      ))}
    </div>
  )
}

function ReadOnlyLabelValueList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center border-b border-neutral-200"
          style={{ height: 40 }}
        >
          <span className="w-[160px] shrink-0 text-[12px] uppercase tracking-[-0.25px] text-brand-navy">
            {item.label}
          </span>
          <span className="text-[14px] font-medium text-brand-navy">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

/** AI note for the Summary section — mirrors the Contract Processing summary. */
function AiSummaryNote({ headline, body }: { headline: string; body: string }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold uppercase tracking-[-0.25px] ai-gradient-text">
          Note
        </span>
      </div>
      <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.5px] text-brand-navy">
        {headline}
      </h2>
      <p className="mt-3 text-[13px] leading-[1.6] text-brand-navy">{body}</p>
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

export function SalesOrderDetails({
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
            {/* Summary — AI note first, then key metrics */}
            <section ref={setSectionRef('summary')} className="group/section">
              <div style={{ maxWidth: AI_NOTE_WIDTH }}>
                <AiSummaryNote headline={order.headline} body={order.aiSummary} />
              </div>
              <div className="mt-6">
                <MetricsRow
                  metrics={[
                    { label: 'Source quote', value: order.sourceQuote, link: true },
                    { label: 'TCV', value: order.totalContractValue },
                    { label: 'Avg annual value', value: order.avgAnnualValue },
                    { label: 'Contract term', value: order.contractTerm },
                    { label: 'Renewal action', value: order.renewalAction },
                  ]}
                />
              </div>
            </section>

            {/* Products and pricing — ramp view mirroring Contract Processing */}
            <section ref={setSectionRef('products')} className="group/section">
              <SectionHeader title="Products and pricing" />
              <div className="mt-6">
                <ReadOnlyProductsList items={order.products} periods={order.productPeriods} />
              </div>
            </section>

            {/* Committed entitlements */}
            <section ref={setSectionRef('entitlements')} className="group/section">
              <SectionHeader title="Committed entitlements" />
              <div className="mt-4" style={{ maxWidth: SECTION_CONTENT_WIDTH }}>
                <ReadOnlyLabelValueList items={order.committedEntitlements} />
              </div>
            </section>

            {/* Past invoices */}
            <section ref={setSectionRef('invoices')} className="group/section">
              <SectionHeader title="Past invoices" />
              <div className="mt-4" style={{ maxWidth: SECTION_CONTENT_WIDTH }}>
                {order.pastInvoices.length === 0 ? (
                  <p className="py-4 text-[13px] text-brand-fog">No invoices yet.</p>
                ) : (
                  order.pastInvoices.map((inv) => {
                    const style = STATUS_STYLES[inv.status as InvoiceStatus]
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center border-b border-neutral-100 py-2.5"
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
            </section>

            {/* Upcoming billing schedule */}
            <section ref={setSectionRef('schedule')} className="group/section">
              <SectionHeader title="Upcoming billing schedule" />
              <div className="mt-4" style={{ maxWidth: SECTION_CONTENT_WIDTH }}>
                {order.upcomingBillingSchedule.length === 0 ? (
                  <p className="py-4 text-[13px] text-brand-fog">No upcoming installments.</p>
                ) : (
                  order.upcomingBillingSchedule.map((line) => {
                    const style = SCHEDULE_STATUS_STYLES[line.status]
                    return (
                      <div
                        key={line.id}
                        className="flex items-center border-b border-neutral-100 py-2.5"
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
            </section>

            {/* Comments — Add note lives in the section title area */}
            <section ref={setSectionRef('comments')} className="group/section">
              <SectionHeader
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
              />
              <div className="mt-4" style={{ maxWidth: SECTION_CONTENT_WIDTH }}>
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
              <SectionHeader title="Activity" />
              <div className="mt-4" style={{ maxWidth: SECTION_CONTENT_WIDTH }}>
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

export default SalesOrderDetails
