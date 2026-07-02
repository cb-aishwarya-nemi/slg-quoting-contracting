import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { MoveDiagonal2, MoreHorizontal, FilePenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  InPageNav,
  SectionHeader,
  SectionCommentStack,
  type NavSection,
} from '@/components/features/contract-processing'
import { type Comment } from '@/data/contractProcessingMock'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { STATUS_STYLES, type InvoiceStatus } from '@/data/invoiceListMock'
import { type SalesOrder } from '@/data/salesOrderMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'

type CommentStatus = 'open' | 'resolved'

const NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'neutral' },
  { id: 'entitlements', label: 'Committed entitlements', status: 'neutral' },
  { id: 'products', label: 'Products and pricing', status: 'neutral' },
  { id: 'schedule', label: 'Upcoming billing schedule', status: 'neutral' },
  { id: 'invoices', label: 'Past invoices', status: 'neutral' },
]

const CONTENT_COL_WIDTH = 780
const BODY_COL_WIDTH = 620
const COMMENTS_COL_WIDTH = 250
const LEFT_NAV_WIDTH = 48
const EXPANDED_MAX_WIDTH = 1000

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

export function SalesOrderDetails({
  order,
  orders,
  activeOrderId,
  onSelectOrder,
}: SalesOrderDetailsProps) {
  const [activeSection, setActiveSection] = useState('summary')
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [localComments, setLocalComments] = useState<Array<Comment & { status?: CommentStatus }>>(
    () => order.comments.map((c) => ({ ...c, status: 'open' as CommentStatus }))
  )

  const centerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollTargetRef = useRef<string | null>(null)

  // Reset comments + active section when the order changes
  useEffect(() => {
    setLocalComments(order.comments.map((c) => ({ ...c, status: 'open' as CommentStatus })))
    setActiveSection('summary')
    if (centerRef.current) centerRef.current.scrollTo({ top: 0 })
  }, [order])

  const commentsBySection = useMemo(() => {
    const grouped: Record<string, Array<Comment & { status?: CommentStatus }>> = {}
    for (const comment of localComments) {
      if (comment.linkedSectionId) {
        if (!grouped[comment.linkedSectionId]) grouped[comment.linkedSectionId] = []
        grouped[comment.linkedSectionId].push(comment)
      }
    }
    return grouped
  }, [localComments])

  const commentCountsBySection = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const [sectionId, comments] of Object.entries(commentsBySection)) {
      counts[sectionId] = comments.length
    }
    return counts
  }, [commentsBySection])

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

  const handleAddComment = useCallback(
    (sectionId: string, sectionLabel: string, text: string) => {
      const newComment: Comment & { status: CommentStatus } = {
        id: `so-c-${Date.now()}`,
        author: 'Adrian Brody',
        initials: 'AB',
        timestamp: 'Just now',
        body: text,
        status: 'open',
        linkedSection: sectionLabel,
        linkedSectionId: sectionId,
      }
      setLocalComments((prev) => [newComment, ...prev])
    },
    []
  )

  const handleDeleteComment = useCallback((commentId: string) => {
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId))
  }, [])

  const handleResolveComment = useCallback((commentId: string) => {
    setLocalComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, status: c.status === 'resolved' ? 'open' : ('resolved' as CommentStatus) }
          : c
      )
    )
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

  const switcherItems: SwitcherItem[] = orders.map((o) => ({
    id: o.id,
    label: o.soId,
    sublabel: `${o.totalContractValue} · ${o.contractTerm}`,
  }))

  const bodyWidth = isPanelsExpanded ? BODY_COL_WIDTH : EXPANDED_MAX_WIDTH
  const productsWidth = isPanelsExpanded ? CONTENT_COL_WIDTH : EXPANDED_MAX_WIDTH

  const SectionRow = useCallback(
    ({
      sectionId,
      sectionLabel,
      children,
    }: {
      sectionId: string
      sectionLabel: string
      children: React.ReactNode
    }) => (
      <div className="flex items-start gap-8">
        <div className="min-w-0 flex-1">{children}</div>
        {isPanelsExpanded && (
          <div style={{ width: COMMENTS_COL_WIDTH, flexShrink: 0 }}>
            <SectionCommentStack
              sectionId={sectionId}
              comments={commentsBySection[sectionId] ?? []}
              linkedSection={sectionLabel}
              onAddNote={(text) => handleAddComment(sectionId, sectionLabel, text)}
              onDelete={handleDeleteComment}
              onResolve={handleResolveComment}
            />
          </div>
        )}
      </div>
    ),
    [isPanelsExpanded, commentsBySection, handleAddComment, handleDeleteComment, handleResolveComment]
  )

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
      {/* Secondary nav */}
      <div className="flex shrink-0 items-center py-3">
        <div className="flex shrink-0 items-center" style={{ width: 40 }}>
          <button
            type="button"
            onClick={() => setIsPanelsExpanded((prev) => !prev)}
            className={cn(
              'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-neutral-100',
              isPanelsExpanded ? 'text-brand-navy' : 'text-blue-700'
            )}
            title={isPanelsExpanded ? 'Hide panels' : 'Show panels'}
          >
            <MoveDiagonal2 size={18} />
          </button>
        </div>

        <div className="shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold uppercase tracking-[-0.25px] text-brand-navy">
              {order.soId}
            </span>
            <SecondaryNavSwitcher
              items={switcherItems}
              activeId={activeOrderId}
              onSelect={onSelectOrder}
            />
          </div>
          <div className="mt-0.5 text-[12px] tracking-[-0.25px] text-brand-fog">
            Created {order.createdOn} · {order.rampDetails} · Starts {order.startDate}
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <FilePenLine size={16} />
            Amend Order
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMoreMenu((prev) => !prev)
              }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 text-brand-navy transition-colors hover:bg-neutral-50"
            >
              <MoreHorizontal size={18} />
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

      {/* Body: left lines nav + merged content+comments column */}
      <div className="flex min-h-0 flex-1" style={{ paddingLeft: 40 }}>
        <aside
          className="shrink-0 overflow-visible pt-4 transition-all duration-300 ease-out"
          style={{ width: isPanelsExpanded ? LEFT_NAV_WIDTH : 0 }}
        >
          <div
            className={cn(
              'transition-opacity duration-200',
              isPanelsExpanded ? 'opacity-100 delay-100' : 'opacity-0'
            )}
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
          className="min-w-0 flex-1 overflow-y-auto pb-20 pl-16 pr-4 pt-12"
        >
          <div
            className={cn('space-y-14', !isPanelsExpanded && 'mx-auto')}
            style={!isPanelsExpanded ? { maxWidth: EXPANDED_MAX_WIDTH } : undefined}
          >
            {/* Summary */}
            <section ref={setSectionRef('summary')} className="group/section">
              <SectionRow sectionId="summary" sectionLabel="Summary">
                <SectionHeader title="Summary" commentCount={commentCountsBySection['summary']} />
                <div className="mt-4">
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
              </SectionRow>
            </section>

            {/* Committed entitlements */}
            <section ref={setSectionRef('entitlements')} className="group/section">
              <SectionRow sectionId="entitlements" sectionLabel="Committed entitlements">
                <SectionHeader
                  title="Committed entitlements"
                  commentCount={commentCountsBySection['entitlements']}
                />
                <div className="mt-4" style={{ maxWidth: bodyWidth }}>
                  <ReadOnlyLabelValueList items={order.committedEntitlements} />
                </div>
              </SectionRow>
            </section>

            {/* Products and pricing */}
            <section ref={setSectionRef('products')} className="group/section">
              <SectionRow sectionId="products" sectionLabel="Products and pricing">
                <SectionHeader
                  title="Products and pricing"
                  commentCount={commentCountsBySection['products']}
                />
                <div className="mt-4" style={{ width: productsWidth }}>
                  <ReadOnlyProductsList items={order.products} />
                </div>
              </SectionRow>
            </section>

            {/* Upcoming billing schedule */}
            <section ref={setSectionRef('schedule')} className="group/section">
              <SectionRow sectionId="schedule" sectionLabel="Upcoming billing schedule">
                <SectionHeader
                  title="Upcoming billing schedule"
                  commentCount={commentCountsBySection['schedule']}
                />
                <div className="mt-4" style={{ maxWidth: bodyWidth }}>
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
              </SectionRow>
            </section>

            {/* Past invoices */}
            <section ref={setSectionRef('invoices')} className="group/section">
              <SectionRow sectionId="invoices" sectionLabel="Past invoices">
                <SectionHeader
                  title="Past invoices"
                  commentCount={commentCountsBySection['invoices']}
                />
                <div className="mt-4" style={{ maxWidth: bodyWidth }}>
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
                          <span className="w-[160px] shrink-0 text-[14px] font-medium text-brand-navy">
                            {inv.invoiceId}
                          </span>
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
              </SectionRow>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesOrderDetails
