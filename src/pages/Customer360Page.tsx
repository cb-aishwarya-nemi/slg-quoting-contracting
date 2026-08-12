import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, Maximize2, Focus } from 'lucide-react'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase, usePageUseCase } from '@/context/UseCaseContext'
import { useNotifications } from '@/context/NotificationContext'
import { useFileDrop } from '@/context/FileDropContext'
import { contractProcessing, sectionSources, type Comment, type LabelValue } from '@/data/contractProcessingMock'
import { salesOrders, getSalesOrderById } from '@/data/salesOrderMock'
import {
  SalesOrderDetails,
  BillingScheduleDetails,
  UsageDetails,
} from '@/components/features/sales-order'
import {
  ASK_CHAT_RAIL_WIDTH,
  SalesOrderAskChatPanel,
  getAskSuggestions,
  type AskChatTurn,
} from '@/components/features/sales-order/SalesOrderAskChatPanel'
import {
  GradientSparkle,
  SectionHeader,
  ContractSummaryHeadline,
  LabelValueList,
  ProductsPricingTable,
  AllocationTable,
  InvoicePreview,
  PaymentSchedule,
  InPageNav,
  SectionCommentStack,
  SectionSourceThumbnails,
  SourcePreviewDrawer,
  getExtractionAttentionStatus,
  applyFieldValue,
  type NavSection,
} from '@/components/features/contract-processing'
import { FieldEditHistoryProvider, formatFieldEditCommentBody, EnsurePanelsOnViewEdits, type FieldEditEvent } from '@/context/FieldEditHistoryContext'
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
  { id: 'schedule', label: 'Schedule' },
  { id: 'usage', label: 'Entitlements/Usage' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'collections', label: 'Collections' },
  { id: 'revrec', label: 'Revrec' },
]

const BASE_NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'ai' },
  { id: 'account', label: 'Account', status: 'attention' },
  { id: 'addresses', label: 'Addresses', status: 'ready' },
  { id: 'terms', label: 'Terms and billing', status: 'ready' },
  { id: 'products', label: 'Products and pricing', status: 'attention' },
  { id: 'allocation', label: 'Allocation', status: 'neutral' },
  { id: 'schedule', label: 'Billing schedule', status: 'neutral' },
  { id: 'invoice', label: 'Invoice preview', status: 'neutral' },
]

const CONTENT_COL_WIDTH = 680
const WIDE_CONTENT_WIDTH = 780
const COMMENTS_COL_WIDTH = 250
const LEFT_NAV_WIDTH = 48
const EXPANDED_MAX_WIDTH = 1000
const ACTIVE_TASK_ID = 100
/** Stable section layout — recreating this in render remounts children and wipes local state. */
function ContractSectionRow({
  sectionId,
  sectionLabel,
  children,
  isPanelsExpanded,
  comments,
  onAddNote,
  onDelete,
  onResolve,
}: {
  sectionId: string
  sectionLabel: string
  children: React.ReactNode
  isPanelsExpanded: boolean
  comments: Array<Comment & { status?: CommentStatus }>
  onAddNote: (text: string, status: ContractStatus) => void
  onDelete: (commentId: string) => void
  onResolve: (commentId: string) => void
}) {
  return (
    <div className="flex items-start gap-8">
      <div className="min-w-0 flex-1">{children}</div>
      {isPanelsExpanded && (
        <div className="shrink-0" style={{ width: COMMENTS_COL_WIDTH }}>
          <SectionCommentStack
            sectionId={sectionId}
            comments={comments}
            linkedSection={sectionLabel}
            onAddNote={onAddNote}
            onDelete={onDelete}
            onResolve={onResolve}
          />
        </div>
      )}
    </div>
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
  const { view, goToCustomers, goToSalesOrders } = useNavigation()
  const { setActivePage } = useUseCase()
  usePageUseCase('sales-order-details')
  const { addNotification } = useNotifications()
  const { workbenchItems } = useFileDrop()
  const data = contractProcessing
  const [activeTab, setActiveTab] = useState('tasks')
  const [usageFocusFeatureId, setUsageFocusFeatureId] = useState<string | null>(null)
  const [activeSalesOrderId, setActiveSalesOrderId] = useState<string>(salesOrders[0].id)
  const [askChatOpen, setAskChatOpen] = useState(false)
  const [askChatTurns, setAskChatTurns] = useState<AskChatTurn[]>([])
  const [activeSection, setActiveSection] = useState('summary')
  const [preview, setPreview] = useState<{ sectionId: string; index: number } | null>(null)
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true)
  const [accountItems, setAccountItems] = useState<LabelValue[]>(() =>
    data.account.map((item) => ({ ...item }))
  )
  const [customerName, setCustomerName] = useState(data.customerName)

  useEffect(() => {
    setAccountItems(data.account.map((item) => ({ ...item })))
  }, [data.account])

  useEffect(() => {
    setAskChatOpen(false)
    setAskChatTurns([])
  }, [activeSalesOrderId, activeTab])

  const appendAskTurn = useCallback((prompt: string) => {
    setAskChatTurns((prev) => [
      ...prev,
      { id: `turn-${Date.now()}-${prev.length}`, prompt },
    ])
  }, [])

  const openAskChat = useCallback(
    (prompt: string) => {
      appendAskTurn(prompt)
      setAskChatOpen(true)
    },
    [appendAskTurn],
  )

  const closeAskChat = useCallback(() => {
    setAskChatOpen(false)
  }, [])

  const activeSalesOrder = useMemo(
    () => getSalesOrderById(activeSalesOrderId),
    [activeSalesOrderId],
  )

  const accountAttention = useMemo(
    () => getExtractionAttentionStatus(accountItems),
    [accountItems]
  )

  const handleAccountItemChange = useCallback((label: string, newValue: string) => {
    setAccountItems((prev) => applyFieldValue(prev, label, newValue))
    if (label === 'Account') setCustomerName(newValue)
  }, [])
  const cameFromSalesOrders =
    view.name === 'customer360' && view.returnTo === 'salesOrders'
  const handleBack = cameFromSalesOrders ? goToSalesOrders : goToCustomers
  const backLabel = cameFromSalesOrders ? 'Back to sales orders' : 'Back to customers'

  const navSections = useMemo<NavSection[]>(
    () =>
      BASE_NAV_SECTIONS.map((section) =>
        section.id === 'account'
          ? { ...section, status: accountAttention.status }
          : section
      ),
    [accountAttention.status]
  )

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
    setActivePage(activeTab === 'sales-order' ? 'sales-order-details' : 'customer360')
  }, [setActivePage, activeTab])

  useEffect(() => {
    if (view.name !== 'customer360') return
    if (view.tab) setActiveTab(view.tab)
    if (view.salesOrderId) setActiveSalesOrderId(view.salesOrderId)
  }, [view])

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
    (sectionId: string, sectionLabel: string, text: string, _status: ContractStatus) => {
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
    },
    []
  )

  const handleFieldEditComment = useCallback((event: FieldEditEvent) => {
    const newComment: Comment & { status: CommentStatus } = {
      id: `c-${Date.now()}`,
      author: 'John Doe',
      initials: 'JD',
      timestamp: 'Just now',
      body: formatFieldEditCommentBody(event),
      status: 'open',
      linkedSection: event.sectionLabel,
      linkedSectionId: event.sectionId,
      fieldEdit: {
        fieldLabel: event.fieldLabel,
        previousValue: event.previousValue,
        newValue: event.newValue,
      },
    }
    setLocalComments((prev) => [newComment, ...prev])
  }, [])

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
      let current = navSections[0].id
      for (const section of navSections) {
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
  }, [activeTab, navSections])

  // Switcher: recent ingestion tasks to jump between
  const taskSwitcherItems: SwitcherItem[] = useMemo(
    () =>
      workbenchItems
        .filter((item) => item.taskType.includes('Ingestion') && item.tcv)
        .map((item) => ({
          id: String(item.id),
          label: `TCV ${item.tcv}`,
          taskType: item.taskName ? `${item.taskName}: ${item.taskType}` : item.taskType,
          status: item.status,
          customer: item.customer,
        })),
    [workbenchItems]
  )

  const activeTask = useMemo(
    () => workbenchItems.find((item) => item.id === ACTIVE_TASK_ID),
    [workbenchItems]
  )

  const taskTitle =
    activeTask?.taskName && activeTask?.taskType
      ? `${activeTask.taskName}: ${activeTask.taskType}`
      : 'New deal: Contract Ingestion'

  const taskId = activeTask?.taskId ?? 'TSK-2026-0153'

  return (
    <div className="flex h-full overflow-hidden">
      {/* Ask Apex — full-height left column */}
      <aside
        className="relative shrink-0 overflow-hidden bg-transparent transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: askChatOpen && activeTab === 'sales-order' ? ASK_CHAT_RAIL_WIDTH : 0,
        }}
        aria-hidden={!(askChatOpen && activeTab === 'sales-order')}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex h-full flex-col transition-opacity duration-300',
            askChatOpen && activeTab === 'sales-order' ? 'opacity-100 delay-150' : 'opacity-0',
          )}
          style={{ width: ASK_CHAT_RAIL_WIDTH }}
        >
          {askChatTurns.length > 0 && (
            <SalesOrderAskChatPanel
              turns={askChatTurns}
              customerName={activeSalesOrder.customerName}
              suggestions={getAskSuggestions()}
              onAsk={appendAskTurn}
              onClose={closeAskChat}
            />
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Primary nav */}
      <div className="relative h-[60px] shrink-0">
        <div className="absolute left-6 bottom-1 flex flex-col justify-end">
          <button
            type="button"
            onClick={handleBack}
            className="mb-0 flex cursor-pointer items-center gap-0.5 text-brand-fog transition-colors hover:text-brand-navy"
          >
            <ChevronLeft size={12} />
            <span className="text-[10px] font-medium uppercase tracking-[0]">
              {backLabel}
            </span>
          </button>
          <div className="flex items-center gap-3">
            <h1
              className="font-heading text-[16px] font-semibold ai-gradient-text"
              style={{ letterSpacing: '-0.5px' }}
            >
              {customerName}
            </h1>
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
        <FieldEditHistoryProvider onFieldEdit={handleFieldEditComment}>
        <EnsurePanelsOnViewEdits onNeedPanels={() => setIsPanelsExpanded(true)} />
        <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
          {/* Secondary nav */}
          <div className="flex shrink-0 items-center py-3">
            <div className="flex shrink-0 items-center gap-2">
              <SecondaryNavSwitcher
                items={taskSwitcherItems}
                activeId="100"
                onSelect={() => {}}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold tracking-[-0.25px] text-brand-navy">
                  {taskTitle}
                </span>
                <span className="text-[11px] text-brand-fog">{taskId}</span>
              </div>
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

            <div className="flex-1" />

            <div className="flex items-center gap-3">
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
                  sections={navSections}
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
                  <ContractSummaryHeadline
                    contractValue={data.summary.contractValue}
                    termMonths={data.summary.termMonths}
                    effectiveDate={data.summary.effectiveDate}
                    customerName={data.customerName}
                    lineItemsSummary={data.summary.lineItemsSummary}
                  />
                  {data.sourceDocuments.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                      <span className="text-brand-fog">Source Docs:</span>
                      {data.sourceDocuments.map((doc, index) => (
                        <span key={doc.id} className="inline-flex items-center gap-2">
                          {index > 0 && (
                            <span className="h-3 w-px shrink-0 bg-neutral-300" aria-hidden />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              window.open(
                                `/pdf-viewer.html?doc=${encodeURIComponent(doc.name)}`,
                                `pdf-${doc.id}`,
                                'popup,width=680,height=800'
                              )
                            }}
                            className="cursor-pointer text-blue-700 hover:underline"
                          >
                            {doc.name}
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {/* Account */}
                <section ref={setSectionRef('account')} className="group/section">
                  <SectionSourceThumbnails
                    sources={sectionSources.account}
                    onOpen={(i) => setPreview({ sectionId: 'account', index: i })}
                  />
                  <ContractSectionRow
                    sectionId="account"
                    sectionLabel="Account"
                    isPanelsExpanded={isPanelsExpanded}
                    comments={commentsBySection['account'] ?? []}
                    onAddNote={(text, status) => handleAddComment('account', 'Account', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <SectionHeader
                      title="Account"
                      status={accountAttention.status}
                      statusLabel={accountAttention.statusLabel}
                      isFlashing={false}
                      commentCount={commentCountsBySection['account']}
                    />
                    <div className="mt-4">
                      <LabelValueList
                        items={accountItems}
                        sectionId="account"
                        sectionLabel="Account"
                        showAddField
                        controlled
                        onItemChange={handleAccountItemChange}
                      />
                    </div>
                  </ContractSectionRow>
                </section>

                {/* Addresses */}
                <section ref={setSectionRef('addresses')} className="group/section">
                  <SectionSourceThumbnails
                    sources={sectionSources.addresses}
                    onOpen={(i) => setPreview({ sectionId: 'addresses', index: i })}
                  />
                  <ContractSectionRow
                    sectionId="addresses"
                    sectionLabel="Addresses"
                    isPanelsExpanded={isPanelsExpanded}
                    comments={commentsBySection['addresses'] ?? []}
                    onAddNote={(text, status) => handleAddComment('addresses', 'Addresses', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <SectionHeader
                      title="Addresses"
                      status="ready"
                      statusLabel="Ready"
                      isFlashing={false}
                      commentCount={commentCountsBySection['addresses']}
                    />
                    <div className="mt-4">
                      <LabelValueList
                        items={data.addresses}
                        sectionId="addresses"
                        sectionLabel="Addresses"
                      />
                    </div>
                  </ContractSectionRow>
                </section>

                {/* Terms and billing */}
                <section ref={setSectionRef('terms')} className="group/section">
                  <SectionSourceThumbnails
                    sources={sectionSources.terms}
                    onOpen={(i) => setPreview({ sectionId: 'terms', index: i })}
                  />
                  <ContractSectionRow
                    sectionId="terms"
                    sectionLabel="Terms and billing"
                    isPanelsExpanded={isPanelsExpanded}
                    comments={commentsBySection['terms'] ?? []}
                    onAddNote={(text, status) => handleAddComment('terms', 'Terms and billing', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <SectionHeader
                      title="Terms and billing"
                      status="ready"
                      statusLabel="Ready"
                      isFlashing={false}
                      commentCount={commentCountsBySection['terms']}
                    />
                    <div className="mt-4">
                      <LabelValueList
                        items={data.termsAndBilling}
                        sectionId="terms"
                        sectionLabel="Terms and billing"
                      />
                    </div>
                  </ContractSectionRow>
                </section>

                {/* Products and pricing */}
                <section ref={setSectionRef('products')} className="group/section">
                  <SectionSourceThumbnails
                    sources={sectionSources.products}
                    onOpen={(i) => setPreview({ sectionId: 'products', index: i })}
                  />
                  <ContractSectionRow
                    sectionId="products"
                    sectionLabel="Products and pricing"
                    isPanelsExpanded={isPanelsExpanded}
                    comments={commentsBySection['products'] ?? []}
                    onAddNote={(text, status) => handleAddComment('products', 'Products and pricing', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <SectionHeader
                      title="Products and pricing"
                      status="ai-created"
                      statusLabel="Created 2 items"
                      isFlashing={false}
                      commentCount={commentCountsBySection['products']}
                    />
                    <div className="mt-6">
                      <ProductsPricingTable items={data.products} periods={data.rampPeriods} />
                    </div>
                  </ContractSectionRow>
                </section>

                {/* Allocation */}
                <section ref={setSectionRef('allocation')} className="group/section">
                  <ContractSectionRow
                    sectionId="allocation"
                    sectionLabel="Allocation"
                    isPanelsExpanded={isPanelsExpanded}
                    comments={commentsBySection['allocation'] ?? []}
                    onAddNote={(text, status) => handleAddComment('allocation', 'Allocation', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <SectionHeader
                      title="Allocation"
                      isFlashing={false}
                      commentCount={commentCountsBySection['allocation']}
                    />
                    <div className="mt-6">
                      <AllocationTable items={data.allocations} />
                    </div>
                  </ContractSectionRow>
                </section>

                {/* Billing schedule */}
                <section ref={setSectionRef('schedule')} className="group/section">
                  <ContractSectionRow
                    sectionId="schedule"
                    sectionLabel="Billing schedule"
                    isPanelsExpanded={isPanelsExpanded}
                    comments={commentsBySection['schedule'] ?? []}
                    onAddNote={(text, status) => handleAddComment('schedule', 'Billing schedule', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <SectionHeader
                      title="Billing schedule"
                      hideLine
                      showRefreshIcon
                      isFlashing={false}
                      commentCount={commentCountsBySection['schedule']}
                    />
                    <div className="mt-6" style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                      <PaymentSchedule tcv={data.summary.contractValue} />
                    </div>
                  </ContractSectionRow>
                </section>

                {/* Invoice preview */}
                <section ref={setSectionRef('invoice')} className="group/section">
                  <ContractSectionRow
                    sectionId="invoice"
                    sectionLabel="Invoice preview"
                    isPanelsExpanded={isPanelsExpanded}
                    comments={commentsBySection['invoice'] ?? []}
                    onAddNote={(text, status) => handleAddComment('invoice', 'Invoice preview', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <div style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                      <InvoicePreview isFlashing={false} />
                    </div>
                  </ContractSectionRow>
                </section>
              </div>
            </div>
          </div>
        </div>
        </FieldEditHistoryProvider>
      )}

      {/* Sales Order tab */}
      {activeTab === 'sales-order' && (
        <SalesOrderDetails
          order={activeSalesOrder}
          orders={salesOrders}
          activeOrderId={activeSalesOrderId}
          onSelectOrder={setActiveSalesOrderId}
          externalChat
          chatOpen={askChatOpen}
          chatTurns={askChatTurns}
          onOpenChat={openAskChat}
          onAppendChat={appendAskTurn}
          onCloseChat={closeAskChat}
          onViewEntitlements={() => {
            setUsageFocusFeatureId(null)
            setActiveTab('usage')
          }}
        />
      )}

      {/* Billing schedule tab */}
      {activeTab === 'schedule' && (
        <BillingScheduleDetails
          order={activeSalesOrder}
          onViewUsageDetails={(featureId) => {
            setUsageFocusFeatureId(featureId ?? null)
            setActiveTab('usage')
          }}
        />
      )}

      {/* Usage tab */}
      {activeTab === 'usage' && (
        <UsageDetails
          order={activeSalesOrder}
          initialFeatureId={usageFocusFeatureId}
        />
      )}

      {/* Other tabs — simple placeholders */}
      {activeTab !== 'tasks' &&
        activeTab !== 'sales-order' &&
        activeTab !== 'schedule' &&
        activeTab !== 'usage' && (
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
    </div>
  )
}

export default Customer360Page
