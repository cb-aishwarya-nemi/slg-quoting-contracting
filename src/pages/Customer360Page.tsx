import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, CirclePlus, Columns3, Maximize2, TrendingUp, UserPlus } from 'lucide-react'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase } from '@/context/UseCaseContext'
import { useNotifications } from '@/context/NotificationContext'
import { useFileDrop } from '@/context/FileDropContext'
import {
  contractProcessing,
  paymentSchedule,
  sectionSources,
  type AllocationGroup,
  type Comment,
  type LabelValue,
  type ProductLineItem,
  type RampPeriod,
  type SourceDocument,
} from '@/data/contractProcessingMock'
import {
  GradientSparkle,
  SectionHeader,
  ContractSummaryHeadline,
  LabelValueList,
  ProductsPricingTable,
  AllocationTable,
  InvoicePreview,
  CreditNotePreview,
  BillingBreakdownView,
  PaymentSchedule,
  InPageNav,
  SectionCommentStack,
  SectionSourceThumbnails,
  SECTION_SOURCE_THUMBNAILS_HEIGHT,
  SourcePreviewDrawer,
  SalesOrderAmendmentComparison,
  getExtractionAttentionStatus,
  applyFieldValue,
  type NavSection,
  type BreakdownView,
  type ProductsPricingVariant,
} from '@/components/features/contract-processing'
import { FieldEditHistoryProvider, formatFieldEditCommentBody, EnsurePanelsOnViewEdits, type FieldEditEvent } from '@/context/FieldEditHistoryContext'
import {
  applyAccountPickerV2Seed,
  getAccountPickerV2Scenario,
  getAccountPickerV2Seed,
  isAccountPickerV2Variant,
} from '@/components/features/contract-processing/AccountCustomerPickerV2'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { SalesOrderHeaderTimeline } from '@/components/features/sales-order'
import { cn } from '@/lib/utils'

export interface SectionOffset {
  top: number
  height: number
}

type CommentStatus = 'open' | 'resolved'
type ContractStatus = 'Blocked' | 'In progress'

const C360_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Amendment: Ingestion' },
  { id: 'threads', label: 'Threads' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'sales-order', label: 'Sales Order' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'collections', label: 'Collections' },
  { id: 'revrec', label: 'Revrec' },
]

const BASE_NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Amendment summary', status: 'ai' },
  { id: 'account', label: 'Account', status: 'ready' },
  { id: 'addresses', label: 'Billing and Shipping addresses', status: 'ready' },
  { id: 'terms', label: 'Terms and billing', status: 'ready' },
  { id: 'products', label: 'Products and pricing', status: 'attention' },
  { id: 'allocation', label: 'Entitlements and credits', status: 'neutral' },
  { id: 'schedule', label: 'Upcoming billing schedule', status: 'neutral' },
  { id: 'invoice', label: 'Invoice preview', status: 'neutral' },
  { id: 'credit-note', label: 'Credit note preview', status: 'neutral' },
]

const WIDE_CONTENT_WIDTH = 780
const COMMENTS_COL_WIDTH = 250
const COMMENTS_COL_GAP = 32
const LEFT_NAV_WIDTH = 48
const ACTIVE_TASK_ID = 100
const PIONEER_SALES_ORDER_ID = 'so-pioneer-0153'

function originalLineItem(item: ProductLineItem): ProductLineItem | null {
  if (item.amendmentChange === 'added') return null

  const quantity =
    item.amendmentChange === 'quantity-increased' && item.previousQuantity
      ? item.previousQuantity
      : item.quantity
  const unitPrice = Number(item.unitPrice.replace(/[$,]/g, ''))
  const numericQuantity = Number(quantity)
  const totalPrice =
    item.amendmentChange === 'quantity-increased' &&
    Number.isFinite(unitPrice) &&
    Number.isFinite(numericQuantity)
      ? `$${(unitPrice * numericQuantity).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : item.totalPrice

  const { amendmentChange: _change, previousQuantity: _previous, ...original } = item
  return { ...original, quantity, totalPrice }
}

function originalLineItems(items: ProductLineItem[]): ProductLineItem[] {
  return items
    .map(originalLineItem)
    .filter((item): item is ProductLineItem => item !== null)
}

function originalRampPeriods(periods: RampPeriod[]): RampPeriod[] {
  return periods
    .filter((period) => period.periodChange !== 'added')
    .map((period) => {
      const {
        periodChange: _change,
        previousStartDate,
        previousEndDate,
        ...original
      } = period
      return {
        ...original,
        startDate: previousStartDate ?? period.startDate,
        endDate: previousEndDate ?? period.endDate,
        items: originalLineItems(period.items),
      }
    })
}

function originalAllocations(allocations: AllocationGroup[]): AllocationGroup[] {
  return allocations
    .filter((allocation) => allocation.feature !== 'Sandbox environments')
    .map((allocation) =>
      allocation.id === 'alloc-1'
        ? {
            ...allocation,
            units: '25,000',
            sources: allocation.sources.filter(
              (source) => source.name !== 'Implementation services'
            ),
          }
        : allocation
    )
}

function formatScheduleMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const AMENDMENT_QUARTERLY_AMOUNT = 51500

/** Stable section layout — recreating this in render remounts children and wipes local state. */
function ContractSectionRow({
  sectionId,
  sectionLabel,
  children,
  areCommentsVisible,
  expandIntoCommentsWhenHidden = false,
  expandedPaddingRight = 0,
  comments,
  commentsOffsetTop,
  onAddNote,
  onDelete,
  onResolve,
}: {
  sectionId: string
  sectionLabel: string
  children: React.ReactNode
  areCommentsVisible: boolean
  expandIntoCommentsWhenHidden?: boolean
  expandedPaddingRight?: number
  comments: Array<Comment & { status?: CommentStatus }>
  /** Pushes the notes down to the section title when the content column starts above it. */
  commentsOffsetTop?: number
  onAddNote: (text: string, status: ContractStatus) => void
  onDelete: (commentId: string) => void
  onResolve: (commentId: string) => void
}) {
  const expansionWidth = COMMENTS_COL_WIDTH + COMMENTS_COL_GAP

  return (
    <div className="flex items-start gap-8">
      <div
        className="min-w-0 flex-1 transition-[margin-right,width] duration-300 ease-out"
        style={
          expandIntoCommentsWhenHidden && !areCommentsVisible
            ? {
                width: `calc(100% + ${expansionWidth}px)`,
                marginRight: -expansionWidth,
                paddingRight: expandedPaddingRight,
              }
            : undefined
        }
      >
        {children}
      </div>
      <div
        className={cn(
          'shrink-0 transition-opacity duration-200',
          areCommentsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        style={{ width: COMMENTS_COL_WIDTH, marginTop: commentsOffsetTop }}
      >
        {areCommentsVisible ? (
          <SectionCommentStack
            sectionId={sectionId}
            comments={comments}
            linkedSection={sectionLabel}
            onAddNote={onAddNote}
            onDelete={onDelete}
            onResolve={onResolve}
          />
        ) : null}
      </div>
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
      Update Sales Order
    </button>
  )
}

function CompareSalesOrderButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 font-heading text-[14px] font-semibold text-brand-navy transition-colors hover:border-brand-mist hover:bg-neutral-50"
    >
      <Columns3 size={16} />
      Compare changes
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
  const { activePage, activeVariant, setActivePage, getPage } = useUseCase()
  const productsPricingPage = getPage('customer360')
  const activeCustomer360Variant =
    (activePage === 'customer360' &&
      activeVariant &&
      productsPricingPage?.variants.some((v) => v.id === activeVariant)
      ? activeVariant
      : productsPricingPage?.defaultVariant) as
      | ProductsPricingVariant
      | 'account-picker-v2'
      | 'account-picker-v2-single'
      | 'account-picker-v2-no-match'
      | undefined
  const isAccountPickerV2 = isAccountPickerV2Variant(activeCustomer360Variant)
  const accountPickerV2Scenario = getAccountPickerV2Scenario(activeCustomer360Variant)
  // Account V2 starts from the Item pinned page baseline; only its picker differs.
  const productsPricingVariant: ProductsPricingVariant | undefined =
    isAccountPickerV2 ? 'item-pinned' : activeCustomer360Variant
  const isItemPinnedVariant = productsPricingVariant === 'item-pinned'
  const [isProductsLifted, setIsProductsLifted] = useState(false)
  const { addNotification } = useNotifications()
  const { workbenchItems } = useFileDrop()
  const data = contractProcessing
  const [activeTab, setActiveTab] = useState('tasks')
  const [activeSection, setActiveSection] = useState('summary')
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  const [breakdownView, setBreakdownView] = useState<BreakdownView | null>(null)
  const [selectedContractVersion, setSelectedContractVersion] = useState<
    { id: 'v1' | 'v2'; trackPercent: number } | undefined
  >()
  const isOriginalContract = selectedContractVersion?.id === 'v1'
  const originalProducts = useMemo(() => originalLineItems(data.products), [data.products])
  const originalPeriods = useMemo(
    () => originalRampPeriods(data.rampPeriods),
    [data.rampPeriods]
  )
  const originalAllocationItems = useMemo(
    () => originalAllocations(data.allocations),
    [data.allocations]
  )
  const upcomingScheduleItems = useMemo(() => {
    const changeDate = new Date(data.summary.effectiveDate)
    return paymentSchedule
      .filter((item) => new Date(item.dueDate) >= changeDate)
      .map((item) => ({
        ...item,
        amount: formatScheduleMoney(AMENDMENT_QUARTERLY_AMOUNT),
      }))
  }, [data.summary.effectiveDate])
  const upcomingScheduleTcv = useMemo(
    () => formatScheduleMoney(upcomingScheduleItems.length * AMENDMENT_QUARTERLY_AMOUNT),
    [upcomingScheduleItems.length]
  )
  const [preview, setPreview] = useState<{ sectionId: string; index: number } | null>(null)
  /** One panel for the whole page — any section's bubble toggles all of it. */
  const [areCommentsVisible, setAreCommentsVisible] = useState(true)
  const [accountItems, setAccountItems] = useState<LabelValue[]>(() =>
    data.account.map((item) => ({ ...item }))
  )
  const [customerName, setCustomerName] = useState(data.customerName)

  const [createdAccountCustomer, setCreatedAccountCustomer] = useState<string | null>(null)
  const [customerTitleConfirmed, setCustomerTitleConfirmed] = useState(true)
  const [invoiceLevelDiscount, setInvoiceLevelDiscount] = useState<{
    value: string
    unit: '%' | 'USD'
  } | null>(null)
  const [sourceDocuments, setSourceDocuments] = useState<SourceDocument[]>(
    () => data.sourceDocuments
  )
  const sourceDocsInputRef = useRef<HTMLInputElement>(null)
  const olderDocsTriggerRef = useRef<HTMLButtonElement>(null)
  const [areOlderDocsOpen, setAreOlderDocsOpen] = useState(false)
  const amendmentSourceDocs = sourceDocuments.filter((doc) => doc.origin !== 'original')
  const originalSourceDocs = sourceDocuments.filter((doc) => doc.origin === 'original')

  const openSourceDocument = useCallback((doc: SourceDocument) => {
    window.open(
      `/pdf-viewer.html?doc=${encodeURIComponent(doc.name)}`,
      `pdf-${doc.id}`,
      'popup,width=680,height=800'
    )
  }, [])

  const handleAddSourceDocuments = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files.length === 0) return
      setSourceDocuments((prev) => {
        const originals = prev.filter((doc) => doc.origin === 'original')
        const current = prev.filter((doc) => doc.origin !== 'original')
        return [
          ...current,
          ...files.map((file) => ({
            id: `doc-${file.name}-${file.lastModified}-${file.size}`,
            name: file.name,
            origin: 'amendment' as const,
          })),
          ...originals,
        ]
      })
      event.target.value = ''
    },
    []
  )

  useEffect(() => {
    const base = data.account.map((item) => ({ ...item }))
    if (!accountPickerV2Scenario) {
      setAccountItems(base)
      setCreatedAccountCustomer(null)
      setCustomerName(data.customerName)
      setCustomerTitleConfirmed(true)
      return
    }
    const seed = getAccountPickerV2Seed(accountPickerV2Scenario)
    setAccountItems(applyAccountPickerV2Seed(base, seed))
    setCreatedAccountCustomer(seed.createdCustomerName)
    setCustomerName(seed.accountName)
    setCustomerTitleConfirmed(seed.customerTitleConfirmed)
  }, [accountPickerV2Scenario, data.account, data.customerName])

  // Drop lift when switching Edit ↔ Expanded use case.
  useEffect(() => {
    setIsProductsLifted(false)
  }, [productsPricingVariant])

  const accountAttention = useMemo(
    () => getExtractionAttentionStatus(accountItems),
    [accountItems]
  )

  const handleAccountItemChange = useCallback((label: string, newValue: string) => {
    setAccountItems((prev) => applyFieldValue(prev, label, newValue))
    if (label === 'Account') {
      setCustomerName(newValue)
      setCreatedAccountCustomer(null)
      setCustomerTitleConfirmed(true)
    }
  }, [])

  const handleCreateAccountCustomer = useCallback((name?: string) => {
    const createdName = name?.trim()
    if (!createdName) return
    setCreatedAccountCustomer(createdName)
    setCustomerName(createdName)
    setCustomerTitleConfirmed(true)
    setAccountItems((prev) => applyFieldValue(prev, 'Account', createdName))
  }, [])
  const cameFromSalesOrders =
    view.name === 'customer360' && view.returnTo === 'salesOrders'
  const handleBack = cameFromSalesOrders ? goToSalesOrders : goToCustomers
  const backLabel = cameFromSalesOrders ? 'Back to sales orders' : 'Back to customers'

  const navSections = useMemo<NavSection[]>(
    () =>
      BASE_NAV_SECTIONS.filter(
        (section) => !isOriginalContract || section.id !== 'credit-note'
      ).map((section) => {
        if (section.id === 'account') {
          return { ...section, status: accountAttention.status }
        }
        if (section.id === 'schedule' && isOriginalContract) {
          return { ...section, label: 'Billing schedule' }
        }
        return section
      }),
    [accountAttention.status, isOriginalContract]
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

  const toggleComments = useCallback(() => {
    setAreCommentsVisible((prev) => !prev)
  }, [])
  const arePageCommentsVisible = isItemPinnedVariant ? areCommentsVisible : true

  useEffect(() => {
    setActivePage('customer360')
  }, [setActivePage])

  useEffect(() => {
    if (view.name !== 'customer360') return
    if (view.tab) setActiveTab(view.tab)
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
    setActiveTab('sales-order')
    addNotification({
      title: 'Sales order updated',
      message: `The sales order for ${data.customerName} has been updated from this amendment.`,
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
      : 'Amendment: Contract Ingestion'

  const taskId = activeTask?.taskId ?? 'TSK-2026-0153'

  return (
    <div className="flex h-full flex-col">
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
              className={cn(
                'font-heading text-[16px] font-semibold',
                customerTitleConfirmed ? 'text-brand-navy' : 'ai-gradient-text'
              )}
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
        <EnsurePanelsOnViewEdits onNeedPanels={() => setAreCommentsVisible(true)} />
        <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
          {/* Secondary nav */}
          <div data-c360-secondary-nav className="flex shrink-0 items-center py-3">
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
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <CompareSalesOrderButton onClick={() => setIsComparisonOpen(true)} />
              <CreateSalesOrderButton onClick={handleCreateSalesOrder} />
            </div>
          </div>

          {/* Body: left nav + merged content+comments column */}
          {/* No left indent — the nav rail lines up with the switcher icon above it. */}
          <div className="flex min-h-0 flex-1">
            {/* Grid 1 — in-page nav */}
            <aside className="shrink-0 overflow-visible pt-4 transition-all duration-300 ease-out" style={{ width: LEFT_NAV_WIDTH }}>
              <div className="transition-opacity duration-200 opacity-100">
                <InPageNav
                  sections={navSections}
                  activeId={activeSection}
                  onNavigate={handleNavigate}
                />
              </div>
            </aside>

            {/* Grid 2+3 merged — content + inline comment stacks, both scroll together */}
            <div
              ref={centerRef}
              className={cn(
                'min-w-0 flex-1 overflow-y-auto pb-20 pt-12 pr-4',
                isItemPinnedVariant ? 'pl-6' : 'pl-16'
              )}
            >
              <div className="space-y-16">
                {/* Summary — AI header + headline, no comments column */}
                <section
                  ref={setSectionRef('summary')}
                  className="group/section"
                  style={{ maxWidth: WIDE_CONTENT_WIDTH }}
                >
                  <div className="mb-3 flex items-center gap-1.5">
                    <GradientSparkle size={16} />
                    <span className="text-[13px] font-semibold uppercase tracking-[-0.25px] ai-gradient-text">
                      Amendment summary
                    </span>
                  </div>
                  <ContractSummaryHeadline
                    variant="amendment"
                    contractValue={data.summary.contractValue}
                    termMonths={data.summary.termMonths}
                    effectiveDate={data.summary.effectiveDate}
                    customerName={data.customerName}
                    lineItemsSummary={data.summary.lineItemsSummary}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                    <span className="text-brand-fog">Source Docs:</span>
                    {amendmentSourceDocs.map((doc, index) => (
                      <span key={doc.id} className="inline-flex items-center gap-2">
                        {index > 0 && (
                          <span className="h-3 w-px shrink-0 bg-neutral-300" aria-hidden />
                        )}
                        <button
                          type="button"
                          onClick={() => openSourceDocument(doc)}
                          title={doc.name}
                          className="max-w-[200px] cursor-pointer truncate text-left text-blue-700 hover:underline"
                        >
                          {doc.name}
                        </button>
                      </span>
                    ))}
                    {originalSourceDocs.length > 0 && (
                      <span className="inline-flex items-center gap-2">
                        {amendmentSourceDocs.length > 0 && (
                          <span className="h-3 w-px shrink-0 bg-neutral-300" aria-hidden />
                        )}
                        <button
                          ref={olderDocsTriggerRef}
                          type="button"
                          onClick={() => setAreOlderDocsOpen((prev) => !prev)}
                          className="cursor-pointer text-blue-700 hover:underline"
                        >
                          +{originalSourceDocs.length} docs
                        </button>
                        <AnchoredMenu
                          isOpen={areOlderDocsOpen}
                          onClose={() => setAreOlderDocsOpen(false)}
                          anchorRef={olderDocsTriggerRef}
                          offset={6}
                          className="w-[280px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
                        >
                          <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
                            Original contract
                          </div>
                          {originalSourceDocs.map((doc) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => {
                                openSourceDocument(doc)
                                setAreOlderDocsOpen(false)
                              }}
                              title={doc.name}
                              className="block w-full cursor-pointer truncate px-3 py-1.5 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
                            >
                              {doc.name}
                            </button>
                          ))}
                        </AnchoredMenu>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      {(amendmentSourceDocs.length > 0 || originalSourceDocs.length > 0) && (
                        <span className="h-3 w-px shrink-0 bg-neutral-300" aria-hidden />
                      )}
                      <input
                        ref={sourceDocsInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        multiple
                        className="sr-only"
                        onChange={handleAddSourceDocuments}
                      />
                      <button
                        type="button"
                        onClick={() => sourceDocsInputRef.current?.click()}
                        className="inline-flex cursor-pointer items-center gap-1 text-blue-700 hover:underline"
                      >
                        <CirclePlus size={14} className="text-blue-700" />
                        Add
                      </button>
                    </span>
                  </div>
                </section>

                {/* Contract lifecycle — the axis stays pinned while the sections below scroll */}
                <SalesOrderHeaderTimeline
                  orderId={PIONEER_SALES_ORDER_ID}
                  onVersionChange={setSelectedContractVersion}
                >
                  <div className="space-y-16">
                {selectedContractVersion && (
                  <div className="relative -mt-6 flex">
                    <div
                      className={cn(
                        'inline-flex items-center gap-2.5 rounded-lg border px-3 py-2',
                        isOriginalContract
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-green-200 bg-green-50'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold leading-none text-white ring-1',
                          isOriginalContract
                            ? 'bg-blue-500 ring-blue-500'
                            : 'bg-green-600 ring-green-600'
                        )}
                      >
                        {selectedContractVersion.id}
                      </span>
                      <span className="text-[13px] font-semibold text-brand-navy">
                        {isOriginalContract ? 'Original contract' : 'Current amendment'}
                      </span>
                      {!isOriginalContract && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                          <TrendingUp size={11} />
                          Expansion
                        </span>
                      )}
                      <span
                        className={cn(
                          'h-3 w-px',
                          isOriginalContract ? 'bg-blue-200' : 'bg-green-200'
                        )}
                        aria-hidden
                      />
                      <span className="text-[13px] text-brand-fog">
                        {isOriginalContract
                          ? 'Started May 1, 2026 · 50 Growth seats · $193,500 ARR'
                          : `Effective ${data.summary.effectiveDate} · Growth seats 50 → 75 · +$32,000 ARR`}
                      </span>
                    </div>
                    {/* Bubble stays put; only the tail slides to the marker it belongs to. */}
                    <span
                      aria-hidden
                      className={cn(
                        'absolute -top-[5px] h-[9px] w-[9px] rotate-45 rounded-[2px] border-l border-t transition-[left] duration-300',
                        isOriginalContract
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-green-200 bg-green-50'
                      )}
                      style={{
                        left: `calc(${selectedContractVersion.trackPercent}% - 4.5px)`,
                      }}
                    />
                  </div>
                )}
                {/* Account */}
                <section ref={setSectionRef('account')} className="group/section">
                  <SectionSourceThumbnails
                    sources={sectionSources.account}
                    onOpen={(i) => setPreview({ sectionId: 'account', index: i })}
                  />
                  <ContractSectionRow
                    sectionId="account"
                    sectionLabel="Account"
                    areCommentsVisible={arePageCommentsVisible}
                    comments={commentsBySection['account'] ?? []}
                    onAddNote={(text, status) => handleAddComment('account', 'Account', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <SectionHeader
                      title="Account"
                      status={accountAttention.status}
                      statusLabel={accountAttention.statusLabel}
                      extraStatus={
                        !isOriginalContract && createdAccountCustomer
                          ? {
                              icon: <UserPlus size={14} />,
                              label: 'Created customer',
                            }
                          : undefined
                      }
                      isFlashing={false}
                      commentCount={commentCountsBySection['account']}
                      commentsVisible={arePageCommentsVisible}
                      onToggleComments={isItemPinnedVariant ? toggleComments : undefined}
                    />
                    <div className="mt-4">
                      <LabelValueList
                        key={isOriginalContract ? 'account-v1' : 'account-v2'}
                        items={isOriginalContract ? data.account : accountItems}
                        sectionId="account"
                        sectionLabel="Account"
                        showAddField={!isOriginalContract}
                        controlled={!isOriginalContract}
                        onItemChange={
                          isOriginalContract ? undefined : handleAccountItemChange
                        }
                        onCreateAsNewCustomer={
                          isOriginalContract ? undefined : handleCreateAccountCustomer
                        }
                        createdCustomerName={
                          isOriginalContract ? undefined : createdAccountCustomer
                        }
                        accountPickerVariant={isAccountPickerV2 ? 'v2' : 'current'}
                        onOpenSource={
                          sectionSources.account?.length
                            ? () => setPreview({ sectionId: 'account', index: 0 })
                            : undefined
                        }
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
                    areCommentsVisible={arePageCommentsVisible}
                    comments={commentsBySection['addresses'] ?? []}
                    onAddNote={(text, status) => handleAddComment('addresses', 'Addresses', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <SectionHeader
                      title="Billing and Shipping addresses"
                      status="ready"
                      statusLabel="Ready"
                      isFlashing={false}
                      commentCount={commentCountsBySection['addresses']}
                      commentsVisible={arePageCommentsVisible}
                      onToggleComments={isItemPinnedVariant ? toggleComments : undefined}
                    />
                    <div className="mt-4">
                      <LabelValueList
                        items={data.addresses}
                        sectionId="addresses"
                        sectionLabel="Addresses"
                        onOpenSource={
                          sectionSources.addresses?.length
                            ? () => setPreview({ sectionId: 'addresses', index: 0 })
                            : undefined
                        }
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
                    areCommentsVisible={arePageCommentsVisible}
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
                      commentsVisible={arePageCommentsVisible}
                      onToggleComments={isItemPinnedVariant ? toggleComments : undefined}
                    />
                    <div className="mt-4">
                      <LabelValueList
                        items={data.termsAndBilling}
                        sectionId="terms"
                        sectionLabel="Terms and billing"
                        onOpenSource={
                          sectionSources.terms?.length
                            ? () => setPreview({ sectionId: 'terms', index: 0 })
                            : undefined
                        }
                      />
                    </div>
                  </ContractSectionRow>
                </section>

                {/* Products and pricing */}
                <section ref={setSectionRef('products')} className="group/section">
                  <ContractSectionRow
                    sectionId="products"
                    sectionLabel="Products and pricing"
                    areCommentsVisible={arePageCommentsVisible}
                    expandIntoCommentsWhenHidden={isItemPinnedVariant}
                    expandedPaddingRight={24}
                    comments={commentsBySection['products'] ?? []}
                    commentsOffsetTop={
                      sectionSources.products?.length ? SECTION_SOURCE_THUMBNAILS_HEIGHT : 0
                    }
                    onAddNote={(text, status) => handleAddComment('products', 'Products and pricing', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <ProductsPricingTable
                      key={`products-pricing-${isOriginalContract ? 'v1' : 'v2'}`}
                      items={isOriginalContract ? originalProducts : data.products}
                      periods={isOriginalContract ? originalPeriods : data.rampPeriods}
                      variant={productsPricingVariant}
                      lifted={isProductsLifted}
                      onLiftedChange={setIsProductsLifted}
                      onInvoiceLevelDiscountChange={setInvoiceLevelDiscount}
                      fullPageTitle={
                        productsPricingVariant === 'expanded-state' ||
                        productsPricingVariant === 'item-pinned'
                          ? `${customerName} – ${taskTitle}`
                          : undefined
                      }
                      header={
                        <>
                          {!isProductsLifted && (
                            <SectionSourceThumbnails
                              sources={sectionSources.products}
                              onOpen={(i) => setPreview({ sectionId: 'products', index: i })}
                            />
                          )}
                          <SectionHeader
                            title="Products and pricing"
                            isFlashing={false}
                            commentCount={
                              isProductsLifted
                                ? undefined
                                : commentCountsBySection['products']
                            }
                            commentsVisible={arePageCommentsVisible}
                            onToggleComments={isItemPinnedVariant ? toggleComments : undefined}
                            trailing={
                              !isItemPinnedVariant && !isProductsLifted ? (
                                <button
                                  type="button"
                                  data-products-pricing-expand=""
                                  onClick={() => setIsProductsLifted(true)}
                                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-brand-navy transition-colors hover:bg-neutral-100"
                                  aria-label="Expand products and pricing"
                                  title="Expand"
                                >
                                  <Maximize2 size={14} strokeWidth={2} />
                                </button>
                              ) : undefined
                            }
                          />
                        </>
                      }
                    />
                  </ContractSectionRow>
                </section>

                {/* Entitlements and credits */}
                <section ref={setSectionRef('allocation')} className="group/section">
                  <ContractSectionRow
                    sectionId="allocation"
                    sectionLabel="Entitlements and credits"
                    areCommentsVisible={arePageCommentsVisible}
                    expandIntoCommentsWhenHidden={isItemPinnedVariant}
                    expandedPaddingRight={24}
                    comments={commentsBySection['allocation'] ?? []}
                    onAddNote={(text, status) =>
                      handleAddComment('allocation', 'Entitlements and credits', text, status)
                    }
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                  >
                    <SectionHeader
                      title="Entitlements and credits"
                      isFlashing={false}
                      commentCount={commentCountsBySection['allocation']}
                      commentsVisible={arePageCommentsVisible}
                      onToggleComments={isItemPinnedVariant ? toggleComments : undefined}
                    />
                    <div className="mt-6">
                      <AllocationTable
                        key={isOriginalContract ? 'allocations-v1' : 'allocations-v2'}
                        items={
                          isOriginalContract ? originalAllocationItems : data.allocations
                        }
                      />
                    </div>
                  </ContractSectionRow>
                </section>

                {/* Upcoming billing schedule — from the amendment effective date onward. */}
                <section ref={setSectionRef('schedule')} className="group/section">
                  {isItemPinnedVariant ? (
                    <>
                      <SectionHeader
                        title={
                          isOriginalContract
                            ? 'Billing schedule'
                            : 'Upcoming billing schedule'
                        }
                        hideLine
                        showRefreshIcon
                        isFlashing={false}
                      />
                      <div className="mt-6" style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                        <PaymentSchedule
                          key={isOriginalContract ? 'schedule-v1' : 'schedule-v2'}
                          items={
                            isOriginalContract ? paymentSchedule : upcomingScheduleItems
                          }
                          tcv={
                            isOriginalContract ? '$492,000.00' : upcomingScheduleTcv
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <ContractSectionRow
                      sectionId="schedule"
                      sectionLabel={
                        isOriginalContract
                          ? 'Billing schedule'
                          : 'Upcoming billing schedule'
                      }
                      areCommentsVisible
                      comments={commentsBySection['schedule'] ?? []}
                      onAddNote={(text, status) =>
                        handleAddComment(
                          'schedule',
                          isOriginalContract
                            ? 'Billing schedule'
                            : 'Upcoming billing schedule',
                          text,
                          status
                        )
                      }
                      onDelete={handleDeleteComment}
                      onResolve={handleResolveComment}
                    >
                      <SectionHeader
                        title={
                          isOriginalContract
                            ? 'Billing schedule'
                            : 'Upcoming billing schedule'
                        }
                        hideLine
                        showRefreshIcon
                        isFlashing={false}
                        commentCount={commentCountsBySection['schedule']}
                      />
                      <div className="mt-6" style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                        <PaymentSchedule
                          key={isOriginalContract ? 'schedule-v1' : 'schedule-v2'}
                          items={
                            isOriginalContract ? paymentSchedule : upcomingScheduleItems
                          }
                          tcv={
                            isOriginalContract ? '$492,000.00' : upcomingScheduleTcv
                          }
                        />
                      </div>
                    </ContractSectionRow>
                  )}
                </section>

                {/* Invoice preview — notes are omitted only in Item pinned. */}
                <section ref={setSectionRef('invoice')} className="group/section">
                  {isItemPinnedVariant ? (
                    <div style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                      <InvoicePreview
                        isFlashing={false}
                        contractVersion={
                          isOriginalContract ? 'original' : 'amendment'
                        }
                        invoiceLevelDiscount={invoiceLevelDiscount}
                        onViewBreakdown={() => setBreakdownView('invoice')}
                      />
                    </div>
                  ) : (
                    <ContractSectionRow
                      sectionId="invoice"
                      sectionLabel="Invoice preview"
                      areCommentsVisible
                      comments={commentsBySection['invoice'] ?? []}
                      onAddNote={(text, status) =>
                        handleAddComment('invoice', 'Invoice preview', text, status)
                      }
                      onDelete={handleDeleteComment}
                      onResolve={handleResolveComment}
                    >
                      <div style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                        <InvoicePreview
                          isFlashing={false}
                          contractVersion={
                            isOriginalContract ? 'original' : 'amendment'
                          }
                          invoiceLevelDiscount={invoiceLevelDiscount}
                          onViewBreakdown={() => setBreakdownView('invoice')}
                        />
                      </div>
                    </ContractSectionRow>
                  )}
                </section>

                {/* Credit notes exist only after the amendment. */}
                {!isOriginalContract && (
                <section ref={setSectionRef('credit-note')} className="group/section">
                  {isItemPinnedVariant ? (
                    <div style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                      <CreditNotePreview
                        isFlashing={false}
                        onViewBreakdown={() => setBreakdownView('credit-note')}
                      />
                    </div>
                  ) : (
                    <ContractSectionRow
                      sectionId="credit-note"
                      sectionLabel="Credit note preview"
                      areCommentsVisible
                      comments={commentsBySection['credit-note'] ?? []}
                      onAddNote={(text, status) =>
                        handleAddComment('credit-note', 'Credit note preview', text, status)
                      }
                      onDelete={handleDeleteComment}
                      onResolve={handleResolveComment}
                    >
                      <div style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                        <CreditNotePreview
                          isFlashing={false}
                          onViewBreakdown={() => setBreakdownView('credit-note')}
                        />
                      </div>
                    </ContractSectionRow>
                  )}
                </section>
                )}
                  </div>
                </SalesOrderHeaderTimeline>
              </div>
            </div>
          </div>
        </div>
        </FieldEditHistoryProvider>
      )}

      {/* Other tabs (including Sales Order) — simple placeholders */}
      {activeTab !== 'tasks' && (
        <TabPlaceholder label={C360_TABS.find((t) => t.id === activeTab)?.label ?? 'Content'} />
      )}

      <SourcePreviewDrawer
        open={!!preview}
        sources={preview ? sectionSources[preview.sectionId] : []}
        activeIndex={preview?.index ?? 0}
        onIndexChange={(index) => setPreview((prev) => (prev ? { ...prev, index } : null))}
        onClose={() => setPreview(null)}
      />
      <BillingBreakdownView
        view={breakdownView}
        customerName={customerName}
        onClose={() => setBreakdownView(null)}
      />
      <SalesOrderAmendmentComparison
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        customerName={customerName}
        items={data.products}
        periods={data.rampPeriods}
        account={accountItems}
        terms={data.termsAndBilling}
      />
    </div>
  )
}

export default Customer360Page
