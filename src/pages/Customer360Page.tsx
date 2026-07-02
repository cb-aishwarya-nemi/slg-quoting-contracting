import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ArrowDown, MoveDiagonal2 } from 'lucide-react'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase } from '@/context/UseCaseContext'
import { useNotifications } from '@/context/NotificationContext'
import { useFileDrop } from '@/context/FileDropContext'
import { contractProcessing, sectionSources, type Comment } from '@/data/contractProcessingMock'
import { salesOrders, getSalesOrderById } from '@/data/salesOrderMock'
import { SalesOrderDetails } from '@/components/features/sales-order'
import {
  GradientSparkle,
  SectionHeader,
  LabelValueList,
  ProductsPricingTable,
  InvoicePreview,
  PaymentSchedule,
  InPageNav,
  SectionCommentStack,
  SectionSourceThumbnails,
  SourcePreviewDrawer,
  type NavSection,
} from '@/components/features/contract-processing'
import { cn } from '@/lib/utils'

export interface SectionOffset {
  top: number
  height: number
}

type CommentStatus = 'open' | 'resolved'
type ContractStatus = 'Blocked' | 'In progress'

const C360_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'threads', label: 'Threads' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'sales-order', label: 'Sales Order' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'collections', label: 'Collections' },
  { id: 'revrec', label: 'Revrec' },
]

const NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'ai' },
  { id: 'account', label: 'Account', status: 'ready' },
  { id: 'addresses', label: 'Addresses', status: 'ready' },
  { id: 'terms', label: 'Terms and billing', status: 'ready' },
  { id: 'products', label: 'Products and pricing', status: 'attention' },
  { id: 'schedule', label: 'Billing schedule', status: 'neutral' },
  { id: 'invoice', label: 'Invoice preview', status: 'neutral' },
]

const CONTENT_COL_WIDTH = 680
const WIDE_CONTENT_WIDTH = 780
const COMMENTS_COL_WIDTH = 250
const LEFT_NAV_WIDTH = 48
const EXPANDED_MAX_WIDTH = 1000

const TASK_ID = 'TSK-2026-0153'

function StatusUnit({ status }: { status: string }) {
  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-navy bg-white px-3 py-2 transition-colors hover:bg-neutral-50"
    >
      <span className="text-[13px] text-brand-navy">Status:</span>
      <span className="text-[13px] font-bold text-blue-700">{status}</span>
      <ArrowDown size={15} className="text-blue-700" />
    </button>
  )
}

function CreateSalesOrderButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-orange-600"
    >
      Create Sales Order
    </button>
  )
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[1560px] flex-1 items-center justify-center px-12">
      <p className="text-[14px] text-brand-fog">{label} will appear here.</p>
    </div>
  )
}

export function Customer360Page() {
  const { goToCustomers } = useNavigation()
  const { setActivePage } = useUseCase()
  const { addNotification } = useNotifications()
  const { workbenchItems } = useFileDrop()
  const data = contractProcessing
  const [activeTab, setActiveTab] = useState('tasks')
  const [activeSection, setActiveSection] = useState('summary')
  const [preview, setPreview] = useState<{ sectionId: string; index: number } | null>(null)
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState(0)
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true)
  const [contractStatus, setContractStatus] = useState<string>('In progress')
  const [activeSalesOrderId, setActiveSalesOrderId] = useState<string>(salesOrders[0].id)

  // Comment state lifted to page so all stacks share the same source of truth
  const [localComments, setLocalComments] = useState<Array<Comment & { status?: CommentStatus }>>(
    () => data.comments.map((c) => ({ ...c, status: 'open' as CommentStatus }))
  )

  const centerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollTargetRef = useRef<string | null>(null)

  // Group comments by section (newest first within each group)
  const commentsBySection = useMemo(() => {
    const grouped: Record<string, Array<Comment & { status?: CommentStatus }>> = {}
    for (const comment of localComments) {
      if (comment.linkedSectionId) {
        if (!grouped[comment.linkedSectionId]) grouped[comment.linkedSectionId] = []
        grouped[comment.linkedSectionId].push(comment)
      }
    }
    for (const sectionId of Object.keys(grouped)) {
      grouped[sectionId].sort((a, b) => {
        if (a.id.startsWith('c-') && b.id.startsWith('c-')) {
          const aNum = parseInt(a.id.slice(2))
          const bNum = parseInt(b.id.slice(2))
          if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum
        }
        return 0
      })
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

  useEffect(() => {
    setActivePage('customer360')
  }, [setActivePage])

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

  const handleNavigate = scrollToSection

  const handleCreateSalesOrder = useCallback(() => {
    setActiveSalesOrderId(salesOrders[0].id)
    setActiveTab('sales-order')
    addNotification({
      title: 'Sales order created',
      message: `A sales order has been created for ${data.customerName} from the processed contract.`,
      persistent: true,
    })
  }, [addNotification, data.customerName])

  // Comment CRUD – shared across all section stacks
  const handleAddComment = useCallback(
    (sectionId: string, sectionLabel: string, text: string, status: ContractStatus) => {
      const newComment: Comment & { status: CommentStatus } = {
        id: `c-${Date.now()}`,
        author: 'Adrian Brody',
        initials: 'AB',
        timestamp: 'Just now',
        body: text,
        status: 'open',
        linkedSection: sectionLabel,
        linkedSectionId: sectionId,
      }
      setLocalComments((prev) => [newComment, ...prev])
      setContractStatus(status)
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
  }, [activeTab])

  // Switcher: recent ingestion tasks to jump between
  const taskSwitcherItems: SwitcherItem[] = useMemo(
    () =>
      workbenchItems
        .filter((item) => item.taskType.includes('Ingestion') && item.taskId)
        .map((item) => ({
          id: String(item.id),
          label: item.taskId as string,
          sublabel: item.customer,
        })),
    [workbenchItems]
  )

  // Helper: section row layout (content col + optional comments col)
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
        {/* Content expands to fill available space when panels expanded */}
        <div className="min-w-0 flex-1">{children}</div>
        {isPanelsExpanded && (
          <div className="shrink-0" style={{ width: COMMENTS_COL_WIDTH }}>
            <SectionCommentStack
              sectionId={sectionId}
              comments={commentsBySection[sectionId] ?? []}
              linkedSection={sectionLabel}
              onAddNote={(text, status) => handleAddComment(sectionId, sectionLabel, text, status)}
              onDelete={handleDeleteComment}
              onResolve={handleResolveComment}
            />
          </div>
        )}
      </div>
    ),
    [
      isPanelsExpanded,
      commentsBySection,
      handleAddComment,
      handleDeleteComment,
      handleResolveComment,
    ]
  )

  return (
    <div className="flex h-full flex-col">
      {/* Primary nav */}
      <div className="relative h-[60px] shrink-0">
        <div className="absolute left-6 bottom-1 flex flex-col justify-end">
          <button
            type="button"
            onClick={goToCustomers}
            className="mb-0 flex cursor-pointer items-center gap-0.5 text-brand-fog transition-colors hover:text-brand-navy"
          >
            <ChevronLeft size={12} />
            <span className="text-[10px] font-medium uppercase tracking-[0]">
              Back to customers
            </span>
          </button>
          <div className="flex items-center gap-3">
            <h1
              className="font-heading text-[16px] font-semibold text-brand-navy"
              style={{ letterSpacing: '-0.5px' }}
            >
              {data.customerName}
            </h1>
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-green-700">
              {data.dealTag}
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <TrapezoidalTabs
            tabs={C360_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            compact
          />
        </div>

        <div className="absolute bottom-0 left-6 right-4 h-px bg-brand-navy" />
      </div>

      {/* Tasks tab — contract processing body */}
      {activeTab === 'tasks' && (
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
                  {TASK_ID}
                </span>
                <SecondaryNavSwitcher
                  items={taskSwitcherItems}
                  activeId="100"
                  onSelect={() => {}}
                />
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <StatusUnit status={contractStatus} />
              <CreateSalesOrderButton onClick={handleCreateSalesOrder} />
            </div>
          </div>

          {/* Body: left nav + merged content+comments column */}
          <div className="flex min-h-0 flex-1" style={{ paddingLeft: 40 }}>
            {/* Grid 1 — in-page nav */}
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
                  sourceDocuments={data.sourceDocuments}
                  activeId={activeSection}
                  onNavigate={handleNavigate}
                />
              </div>
            </aside>

            {/* Grid 2+3 merged — content + inline comment stacks, both scroll together */}
            <div
              ref={centerRef}
              className={cn(
                'min-w-0 flex-1 overflow-y-auto pb-20 pt-12',
                isPanelsExpanded ? 'pl-16 pr-4' : 'px-16'
              )}
            >
              <div
                className="space-y-16"
                style={
                  !isPanelsExpanded ? { maxWidth: EXPANDED_MAX_WIDTH, margin: '0 auto' } : undefined
                }
              >
                {/* Summary — AI header + headline, no comments column */}
                <section
                  ref={setSectionRef('summary')}
                  className="group/section"
                  style={{ maxWidth: CONTENT_COL_WIDTH }}
                >
                  <div className="mb-3 flex items-center gap-1.5">
                    <GradientSparkle size={16} />
                    <span className="text-[13px] font-semibold uppercase tracking-[-0.25px] ai-gradient-text">
                      Summary
                    </span>
                  </div>
                  <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.5px] text-brand-navy">
                    <span className="font-bold">Contract Value: {data.summary.contractValue}</span>
                    {data.summary.headline}
                  </h2>
                  <p className="mt-3 text-[13px] text-brand-navy">
                    Effective: {data.summary.effectiveDate}
                  </p>
                </section>

                {/* Account */}
                <section ref={setSectionRef('account')} className="group/section">
                  <SectionSourceThumbnails
                    sources={sectionSources.account}
                    onOpen={(i) => setPreview({ sectionId: 'account', index: i })}
                  />
                  <SectionRow sectionId="account" sectionLabel="Account">
                    <SectionHeader
                      title="Account"
                      status="ready"
                      statusLabel="Ready"
                      isFlashing={false}
                      commentCount={commentCountsBySection['account']}
                    />
                    <div className="mt-4">
                      <LabelValueList items={data.account} showAddField />
                    </div>
                  </SectionRow>
                </section>

                {/* Addresses */}
                <section ref={setSectionRef('addresses')} className="group/section">
                  <SectionSourceThumbnails
                    sources={sectionSources.addresses}
                    onOpen={(i) => setPreview({ sectionId: 'addresses', index: i })}
                  />
                  <SectionRow sectionId="addresses" sectionLabel="Addresses">
                    <SectionHeader
                      title="Addresses"
                      status="ready"
                      statusLabel="Ready"
                      isFlashing={false}
                      commentCount={commentCountsBySection['addresses']}
                    />
                    <div className="mt-4">
                      <LabelValueList items={data.addresses} />
                    </div>
                  </SectionRow>
                </section>

                {/* Terms and billing */}
                <section ref={setSectionRef('terms')} className="group/section">
                  <SectionSourceThumbnails
                    sources={sectionSources.terms}
                    onOpen={(i) => setPreview({ sectionId: 'terms', index: i })}
                  />
                  <SectionRow sectionId="terms" sectionLabel="Terms and billing">
                    <SectionHeader
                      title="Terms and billing"
                      status="ready"
                      statusLabel="Ready"
                      isFlashing={false}
                      commentCount={commentCountsBySection['terms']}
                    />
                    <div className="mt-4">
                      <LabelValueList items={data.termsAndBilling} />
                    </div>
                  </SectionRow>
                </section>

                {/* Products and pricing */}
                <section ref={setSectionRef('products')} className="group/section">
                  <SectionSourceThumbnails
                    sources={sectionSources.products}
                    onOpen={(i) => setPreview({ sectionId: 'products', index: i })}
                  />
                  <SectionRow sectionId="products" sectionLabel="Products and pricing">
                    <SectionHeader
                      title="Products and pricing"
                      status="ai-created"
                      statusLabel="Created 2 items"
                      isFlashing={false}
                      commentCount={commentCountsBySection['products']}
                    />
                    <div className="mt-4">
                      <ProductsPricingTable items={data.products} periods={data.rampPeriods} />
                    </div>
                  </SectionRow>
                </section>

                {/* Billing schedule */}
                <section ref={setSectionRef('schedule')} className="group/section">
                  <SectionRow sectionId="schedule" sectionLabel="Billing schedule">
                    <SectionHeader
                      title="Billing schedule"
                      hideLine
                      isFlashing={false}
                      commentCount={commentCountsBySection['schedule']}
                    />
                    <div className="mt-6" style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                      <PaymentSchedule
                        onPreviewClick={(invoiceIndex) => {
                          setActiveInvoiceIndex(invoiceIndex)
                          scrollToSection('invoice')
                        }}
                        tcv={data.summary.contractValue}
                      />
                    </div>
                  </SectionRow>
                </section>

                {/* Invoice preview */}
                <section ref={setSectionRef('invoice')} className="group/section">
                  <SectionRow sectionId="invoice" sectionLabel="Invoice preview">
                    <div style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                      <InvoicePreview
                        activeIndex={activeInvoiceIndex}
                        totalInvoices={4}
                        onIndexChange={setActiveInvoiceIndex}
                        isFlashing={false}
                      />
                    </div>
                  </SectionRow>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Order tab — in-frame read-only details */}
      {activeTab === 'sales-order' && (
        <SalesOrderDetails
          order={getSalesOrderById(activeSalesOrderId)}
          orders={salesOrders}
          activeOrderId={activeSalesOrderId}
          onSelectOrder={setActiveSalesOrderId}
        />
      )}

      {/* Other tabs — simple placeholders */}
      {activeTab !== 'tasks' && activeTab !== 'sales-order' && (
        <TabPlaceholder label={C360_TABS.find((t) => t.id === activeTab)?.label ?? 'Content'} />
      )}

      <SourcePreviewDrawer
        open={!!preview}
        sources={preview ? sectionSources[preview.sectionId] : []}
        activeIndex={preview?.index ?? 0}
        onIndexChange={(index) => setPreview((prev) => (prev ? { ...prev, index } : null))}
        onClose={() => setPreview(null)}
      />
    </div>
  )
}

export default Customer360Page
