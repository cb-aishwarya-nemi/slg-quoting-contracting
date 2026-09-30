import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { Archive, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleCheck, Grip, Maximize2, Plus } from 'lucide-react'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase } from '@/context/UseCaseContext'
import { useNotifications } from '@/context/NotificationContext'
import { useFileDrop } from '@/context/FileDropContext'
import { contractProcessing, sectionSources, type Comment, type LabelValue } from '@/data/contractProcessingMock'
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
  PdfThumbnail,
  SourcePreviewDrawer,
  applyFieldValue,
  type NavSection,
  type ProductsPricingVariant,
} from '@/components/features/contract-processing'
import { FieldEditHistoryProvider, formatFieldEditCommentBody, EnsurePanelsOnViewEdits, type FieldEditEvent } from '@/context/FieldEditHistoryContext'
import {
  applyAccountPickerV2Seed,
  getAccountPickerV2Scenario,
  getAccountPickerV2Seed,
  isAccountPickerV2Variant,
} from '@/components/features/contract-processing/AccountCustomerPickerV2'
import { DEFAULT_ACCOUNT_NAME } from '@/components/features/contract-processing/AccountCustomerPicker'
import { cn } from '@/lib/utils'
import { SubscriptionRecord } from '@/components/features/sales-order/SubscriptionRecord'
import { CustomerScenarioName } from '@/components/features/contract-processing/CustomerScenarioName'

export interface SectionOffset {
  top: number
  height: number
}

type CommentStatus = 'open' | 'resolved'
type ContractStatus = 'Blocked' | 'In progress'

const C360_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'New deal: Ingestion' },
  { id: 'threads', label: 'Threads' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'sales-order', label: 'Subscription' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'collections', label: 'Collections' },
  { id: 'revrec', label: 'Revrec' },
]

/** Existing customers in the scenario use cases don't all carry the same surfaces. */
const EXISTING_CUSTOMER_TAB_IDS: Record<string, string[]> = {
  'Pioneer Systems': C360_TABS.map((tab) => tab.id),
  'Pioneer systems': ['overview', 'tasks', 'threads', 'quotes', 'sales-order', 'invoices', 'collections'],
  'Pioneer System': ['overview', 'tasks', 'threads', 'quotes', 'sales-order', 'invoices'],
  'Pioneers Systems': ['overview', 'tasks', 'threads', 'quotes', 'sales-order', 'invoices', 'revrec'],
  'Pinoeer Systems': ['overview', 'tasks', 'invoices'],
  'Atlas BioSystems': ['overview', 'tasks', 'quotes', 'sales-order', 'invoices', 'collections'],
  'Cascade Networks': ['overview', 'tasks', 'threads', 'quotes', 'sales-order', 'invoices', 'revrec'],
  'Horizon Analytics': ['overview', 'tasks', 'threads', 'sales-order', 'invoices', 'collections'],
}

const BASE_NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'New deal summary', status: 'ai' },
  { id: 'account', label: 'Account', status: 'ready' },
  { id: 'addresses', label: 'Billing and Shipping addresses', status: 'ready' },
  { id: 'terms', label: 'Terms and billing', status: 'ready' },
  { id: 'products', label: 'Products and pricing', status: 'attention' },
  { id: 'allocation', label: 'Entitlements', status: 'neutral' },
  { id: 'schedule', label: 'Billing schedule', status: 'neutral' },
  { id: 'invoice', label: 'Invoice preview', status: 'neutral' },
]

const CONTENT_COL_WIDTH = 680
const WIDE_CONTENT_WIDTH = 780
const COMMENTS_COL_WIDTH = 250
const COMMENTS_COL_GAP = 32
const LEFT_NAV_WIDTH = 48
const ACTIVE_TASK_ID = 100

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
  showAddNote,
  onShowAddNoteChange,
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
  showAddNote?: boolean
  onShowAddNoteChange?: (show: boolean) => void
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
            showAddNote={showAddNote}
            onShowAddNoteChange={onShowAddNoteChange}
          />
        ) : null}
      </div>
    </div>
  )
}

function withoutInfoNotices(items: LabelValue[]): LabelValue[] {
  return items.map((item) =>
    item.notice?.tone === 'info' ? { ...item, notice: undefined } : item
  )
}

const TASK_STATUSES = ['Open', 'Ready for review', 'Blocked', 'Resolved'] as const
type TaskStatus = (typeof TASK_STATUSES)[number]

const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  Open: 'bg-green-50 text-green-700',
  'Ready for review': 'bg-neutral-100 text-brand-navy',
  Blocked: 'bg-red-50 text-red-700',
  Resolved: 'bg-blue-50 text-blue-700',
}

function TaskStatusPill({
  status,
  onChange,
}: {
  status: TaskStatus
  onChange: (status: TaskStatus) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'flex h-6 cursor-pointer items-center gap-1 px-2 text-[13px] font-medium leading-none transition-opacity hover:opacity-80',
          TASK_STATUS_STYLES[status]
        )}
      >
        {status}
        <ChevronDown size={14} strokeWidth={2} />
      </button>
      <AnchoredMenu
        isOpen={isOpen}
        anchorRef={triggerRef}
        onClose={() => setIsOpen(false)}
        align="end"
        offset={6}
        className="w-[180px] overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
      >
        {TASK_STATUSES.map((option) => (
          <button
            key={option}
            type="button"
            role="menuitemradio"
            aria-checked={option === status}
            onClick={() => {
              onChange(option)
              setIsOpen(false)
            }}
            className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
          >
            <span className={cn('px-2 py-0.5 font-medium', TASK_STATUS_STYLES[option])}>{option}</span>
            {option === status ? <Check size={14} className="text-brand-navy" /> : null}
          </button>
        ))}
      </AnchoredMenu>
    </>
  )
}

const RESCHEDULE_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

function formatRescheduleDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function RescheduleCalendar({
  onSelect,
  onBack,
  label = 'Reschedule task',
}: {
  onSelect: (date: string) => void
  onBack?: () => void
  label?: string
}) {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()
  const cells: Array<Date | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)
    ),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = viewMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div role="dialog" aria-label={label}>
      {onBack ? (
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-brand-navy transition-colors hover:bg-neutral-100"
            aria-label="Back to task actions"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] font-medium text-brand-navy">Reschedule</span>
        </div>
      ) : null}
      <div className="mb-3 flex items-center justify-between gap-1">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() =>
              setViewMonth(new Date(viewMonth.getFullYear() - 1, viewMonth.getMonth(), 1))
            }
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
            aria-label="Previous year"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() =>
              setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
            }
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        <span className="text-[13px] font-semibold tracking-[-0.25px] text-brand-navy">
          {monthLabel}
        </span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() =>
              setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
            }
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() =>
              setViewMonth(new Date(viewMonth.getFullYear() + 1, viewMonth.getMonth(), 1))
            }
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"
            aria-label="Next year"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {RESCHEDULE_WEEKDAYS.map((day) => (
          <div
            key={day}
            className="flex h-7 items-center justify-center text-[10px] font-medium uppercase tracking-[-0.25px] text-brand-fog"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="h-8" />
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          const isToday = key === todayKey
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(formatRescheduleDate(date))}
              className={cn(
                'flex h-8 w-full cursor-pointer items-center justify-center rounded-md text-[12px] transition-colors',
                isToday
                  ? 'font-semibold text-blue-700 hover:bg-blue-50'
                  : 'text-brand-navy hover:bg-neutral-100'
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SetupDueDate({
  dueDate,
  onChange,
}: {
  dueDate: string | null
  onChange: (date: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={dueDate ? `Due on ${dueDate}` : 'Setup due date'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex h-6 cursor-pointer items-center gap-1.5 px-2 font-['Inter'] text-[13px] font-medium leading-none text-[#1b38de] transition-colors hover:bg-[#f2f6ff]",
          isOpen && 'bg-[#f2f6ff]'
        )}
      >
        <Calendar size={14} strokeWidth={2} />
        {dueDate ? `Due on ${dueDate}` : 'Setup due date'}
      </button>
      <AnchoredMenu
        isOpen={isOpen}
        anchorRef={triggerRef}
        onClose={() => setIsOpen(false)}
        offset={6}
        className="w-[280px] overflow-hidden rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
      >
        <RescheduleCalendar
          label="Setup due date"
          onSelect={(date) => {
            onChange(date)
            setIsOpen(false)
          }}
        />
      </AnchoredMenu>
    </>
  )
}

function TaskActionsMenu({
  onResolve,
  onArchive,
  onReschedule,
}: {
  onResolve: () => void
  onArchive: () => void
  onReschedule: (date: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [pickingDate, setPickingDate] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeMenu = () => {
    setIsOpen(false)
    setPickingDate(false)
  }
  const runAction = (action: () => void) => {
    action()
    closeMenu()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Task actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((open) => !open)
          setPickingDate(false)
        }}
        className={cn(
          'flex h-6 w-6 cursor-pointer items-center justify-center text-brand-navy transition-colors hover:bg-neutral-100',
          isOpen && 'bg-neutral-100'
        )}
      >
        <Grip size={16} strokeWidth={2} />
      </button>
      <AnchoredMenu
        isOpen={isOpen}
        anchorRef={triggerRef}
        onClose={closeMenu}
        align="end"
        offset={6}
        className={cn(
          'overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg',
          pickingDate ? 'w-[280px] p-3' : 'w-[180px] py-1'
        )}
      >
        {pickingDate ? (
          <RescheduleCalendar
            onBack={() => setPickingDate(false)}
            onSelect={(date) => runAction(() => onReschedule(date))}
          />
        ) : (
          <>
            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(onResolve)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
            >
              <CircleCheck size={14} strokeWidth={2} />
              Mark as resolved
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => setPickingDate(true)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
            >
              <Calendar size={14} strokeWidth={2} />
              Reschedule
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(onArchive)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
            >
              <Archive size={14} strokeWidth={2} />
              Archive
            </button>
          </>
        )}
      </AnchoredMenu>
    </>
  )
}

function CreateSalesOrderButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[30px] cursor-pointer items-center gap-2 rounded-none bg-[#1b38de] px-3 font-['Inter'] text-[13px] font-medium text-white transition-colors hover:bg-[#162ec0]"
    >
      <Plus size={16} strokeWidth={2.5} />
      Create subscription
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
  const { view, goToCustomers, goToSalesOrders, goToWorkbench } = useNavigation()
  const { activePage, activeVariant, setActivePage, setVariant, getPage } = useUseCase()
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
      | 'customer-scenarios'
      | 'no-customer-data'
      | undefined
  const isAccountPickerV2 = isAccountPickerV2Variant(activeCustomer360Variant)
  const accountPickerV2Scenario = getAccountPickerV2Scenario(activeCustomer360Variant)
  // Account V2 starts from the Item pinned page baseline; only its picker differs.
  const productsPricingVariant: ProductsPricingVariant | undefined =
    isAccountPickerV2 ? 'item-pinned' : activeCustomer360Variant
  const isItemPinnedVariant = productsPricingVariant === 'item-pinned'
  const [isProductsLifted, setIsProductsLifted] = useState(false)
  const { addNotification } = useNotifications()
  const { workbenchItems, updateItemStatus } = useFileDrop()
  const data = contractProcessing
  const openingSeed = accountPickerV2Scenario
    ? getAccountPickerV2Seed(accountPickerV2Scenario)
    : null
  const [activeTab, setActiveTab] = useState('tasks')
  const [activeSection, setActiveSection] = useState('summary')
  const [preview, setPreview] = useState<{ sectionId: string; index: number } | null>(null)
  /** One panel for the whole page — any section's bubble toggles all of it. */
  const [areCommentsVisible, setAreCommentsVisible] = useState(false)
  const [accountItems, setAccountItems] = useState<LabelValue[]>(() => {
    const base = data.account.map((item) => ({ ...item }))
    return openingSeed ? applyAccountPickerV2Seed(base, openingSeed) : base
  })
  const [customerName, setCustomerName] = useState(
    () => openingSeed?.accountName ?? data.customerName
  )

  const [createdAccountCustomer, setCreatedAccountCustomer] = useState<string | null>(
    () => openingSeed?.createdCustomerName ?? null
  )
  const [customerTitleConfirmed, setCustomerTitleConfirmed] = useState(
    () => openingSeed?.customerTitleConfirmed ?? false
  )
  const [invoiceLevelDiscount, setInvoiceLevelDiscount] = useState<{
    value: string
    unit: '%' | 'USD'
  } | null>(null)

  const summarySources = useMemo(
    () =>
      data.sourceDocuments.map((doc) => ({
        id: doc.id,
        docName: doc.name,
        pageLabel: 'Page 1',
        highlightId: '',
        caption: doc.name,
      })),
    [data.sourceDocuments]
  )

  useEffect(() => {
    const base = data.account.map((item) => ({ ...item }))
    if (!accountPickerV2Scenario) {
      setAccountItems(base)
      setCreatedAccountCustomer(null)
      setCustomerName(data.customerName)
      setCustomerTitleConfirmed(false)
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

  const handleDeleteAccountCustomer = useCallback(() => {
    setCreatedAccountCustomer(null)
    setCustomerName(data.customerName)
    setCustomerTitleConfirmed(false)
    setAccountItems((prev) => applyFieldValue(prev, 'Account', DEFAULT_ACCOUNT_NAME))
  }, [data.customerName])
  const cameFromSalesOrders =
    view.name === 'customer360' && view.returnTo === 'salesOrders'
  const isScenarioVariant =
    activeCustomer360Variant === 'customer-scenarios' ||
    activeCustomer360Variant === 'no-customer-data'
  const handleBack = cameFromSalesOrders
    ? goToSalesOrders
    : isScenarioVariant
      ? goToWorkbench
      : goToCustomers
  const backLabel = cameFromSalesOrders
    ? 'Back to sales orders'
    : isScenarioVariant
      ? 'Back to workbench'
      : 'Back to customers'

  const navSections = BASE_NAV_SECTIONS

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

  const [addNoteSectionId, setAddNoteSectionId] = useState<string | null>(null)
  const handleSectionCommentIcon = useCallback(
    (sectionId: string) => {
      // Composer already up for this section — collapse the notes column, same
      // as sections that only toggle.
      if (areCommentsVisible && addNoteSectionId === sectionId) {
        setAddNoteSectionId(null)
        setAreCommentsVisible(false)
        return
      }
      const hasNotes = (commentsBySection[sectionId] ?? []).length > 0
      if (!hasNotes) {
        setAddNoteSectionId(sectionId)
        setAreCommentsVisible(true)
        return
      }
      setAddNoteSectionId(null)
      setAreCommentsVisible((visible) => !visible)
    },
    [addNoteSectionId, areCommentsVisible, commentsBySection]
  )
  const setSectionAddNote = (sectionId: string) => (show: boolean) => {
    setAddNoteSectionId((prev) => (show ? sectionId : prev === sectionId ? null : prev))
  }
  const arePageCommentsVisible = isItemPinnedVariant ? areCommentsVisible : true

  useEffect(() => {
    setActivePage('customer360')
  }, [setActivePage])

  // Workbench rows open Customer scenarios, except the unidentified-customer row.
  // Other entry points keep Multiple matches. Switching use cases afterwards stays put.
  useEffect(() => {
    if (view.name !== 'customer360') return
    if (view.returnTo) {
      setVariant('account-picker-v2')
      return
    }
    setVariant(view.entryVariant ?? 'customer-scenarios')
  }, [setVariant, view])

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
      title: 'Subscription created',
      message: `A subscription has been created for ${data.customerName} from the processed contract.`,
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
  const taskStatus: TaskStatus = (TASK_STATUSES as readonly string[]).includes(activeTask?.status ?? '')
    ? (activeTask?.status as TaskStatus)
    : 'Open'
  const openedTaskRef = useRef(false)

  const taskTitle =
    activeTask?.taskName && activeTask?.taskType
      ? `${activeTask.taskName}: ${activeTask.taskType}`
      : 'New deal: Contract Ingestion'
  const [dueDate, setDueDate] = useState<string | null>(null)

  const isNoCustomerData = activeCustomer360Variant === 'no-customer-data'
  const isCustomerScenarios =
    activeCustomer360Variant === 'customer-scenarios' || isNoCustomerData

  // Opening the task is itself the review, so Ready for review becomes Open
  // before the first paint.
  useLayoutEffect(() => {
    if (!isCustomerScenarios || openedTaskRef.current) return
    openedTaskRef.current = true
    if (activeTask?.status === 'Ready for review') {
      updateItemStatus(ACTIVE_TASK_ID, 'Open')
    }
  }, [isCustomerScenarios, activeTask?.status, updateItemStatus])
  const shownAccountItems = useMemo(
    () => (isCustomerScenarios ? withoutInfoNotices(accountItems) : accountItems),
    [isCustomerScenarios, accountItems]
  )
  const shownTermsAndBilling = useMemo(
    () => (isCustomerScenarios ? withoutInfoNotices(data.termsAndBilling) : data.termsAndBilling),
    [isCustomerScenarios, data.termsAndBilling]
  )
  const isNewCustomer = !!createdAccountCustomer && createdAccountCustomer === customerName
  const hasExistingCustomer = isCustomerScenarios && !!customerName && !isNewCustomer
  const scenarioTabIds = hasExistingCustomer
    ? EXISTING_CUSTOMER_TAB_IDS[customerName] ?? C360_TABS.map((tab) => tab.id)
    : ['tasks']
  const visibleTabs = (
    isCustomerScenarios ? C360_TABS.filter((tab) => scenarioTabIds.includes(tab.id)) : C360_TABS
  ).map((tab) =>
    isCustomerScenarios && tab.id === 'tasks'
      ? { ...tab, label: 'Tasks', tone: 'yellow' as const }
      : tab
  )

  const scenarioTabKey = scenarioTabIds.join('|')

  useEffect(() => {
    if (isCustomerScenarios && !scenarioTabKey.split('|').includes(activeTab)) {
      setActiveTab('tasks')
    }
  }, [isCustomerScenarios, activeTab, scenarioTabKey])

  // Customer scenarios span the full header-line width (left-6 / right-4) instead of the centered content column.
  const secondaryNav = (
    <div
      data-c360-secondary-nav
      className={cn(
        'flex shrink-0 items-center border-b border-[#cbcbd2]',
        isCustomerScenarios ? 'ml-6 mr-4 px-5 py-2' : 'pb-2 pt-3'
      )}
    >
      <div className="flex items-center gap-2">
        <SecondaryNavSwitcher
          items={taskSwitcherItems}
          activeId="100"
          onSelect={() => {}}
          triggerLabel="New deal: ingestion (TCV $492,000)"
        />
        <SetupDueDate
          dueDate={dueDate}
          onChange={(date) => {
            setDueDate(date)
            addNotification({
              title: 'Due date set',
              message: `${taskTitle} for ${customerName || 'this customer'} is due ${date}.`,
            })
          }}
        />
      </div>

      <div className="flex-1" />

      {isCustomerScenarios ? (
        <div className="flex items-center gap-2">
          <TaskStatusPill
            status={taskStatus}
            onChange={(status) => updateItemStatus(ACTIVE_TASK_ID, status)}
          />
          <TaskActionsMenu
            onResolve={() => {
              updateItemStatus(ACTIVE_TASK_ID, 'Resolved')
              addNotification({
                title: 'Task resolved',
                message: `${taskTitle} for ${customerName || 'this customer'} is marked as resolved.`,
              })
            }}
            onReschedule={(date) => {
              setDueDate(date)
              addNotification({
                title: 'Task rescheduled',
                message: `${taskTitle} for ${customerName || 'this customer'} is rescheduled to ${date}.`,
              })
            }}
            onArchive={() => {
              addNotification({
                title: 'Task archived',
                message: `${taskTitle} for ${customerName || 'this customer'} has been archived.`,
              })
              goToWorkbench()
            }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <CreateSalesOrderButton onClick={handleCreateSalesOrder} />
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      {/* Primary nav */}
      <div className={cn('relative shrink-0', isCustomerScenarios ? 'h-[88px]' : 'h-[60px]')}>
        <div
          className={cn(
            'absolute left-6 flex flex-col justify-end',
            isCustomerScenarios ? 'top-2' : 'bottom-1'
          )}
        >
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
            {isCustomerScenarios ? (
              <CustomerScenarioName
                name={customerName}
                size="header"
                showBestMatch={!customerTitleConfirmed}
                isNewCustomer={!!createdAccountCustomer && createdAccountCustomer === customerName}
                showNewCustomerNote
                options={
                  accountItems.find((item) => item.label === 'Account')?.options ?? []
                }
                onSelect={(name) => handleAccountItemChange('Account', name)}
                onCreate={(createdName) => handleCreateAccountCustomer(createdName)}
              />
            ) : (
              <h1
                className={cn(
                  'font-heading text-[16px] font-semibold',
                  customerTitleConfirmed ? 'text-brand-navy' : 'ai-gradient-text'
                )}
                style={{ letterSpacing: '-0.5px' }}
              >
                {customerName}
              </h1>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <TrapezoidalTabs
            tabs={visibleTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            compact
            animatePresence={isCustomerScenarios}
            instantKey={activeCustomer360Variant}
          />
        </div>

        <div className="absolute bottom-0 left-6 right-4 h-px bg-brand-navy" />
      </div>

      {/* Tasks tab — contract processing body */}
      {activeTab === 'tasks' && (
        <FieldEditHistoryProvider onFieldEdit={handleFieldEditComment}>
        <EnsurePanelsOnViewEdits onNeedPanels={() => setAreCommentsVisible(true)} />
        {isCustomerScenarios && secondaryNav}
        <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
          {!isCustomerScenarios && secondaryNav}

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
                  style={{ maxWidth: CONTENT_COL_WIDTH }}
                >
                  <div className="mb-3 flex items-center gap-1.5">
                    <GradientSparkle size={16} />
                    <span className="text-[13px] font-semibold uppercase tracking-[-0.25px] ai-gradient-text">
                      2-year new deal, $492K TCV
                    </span>
                  </div>
                  <ContractSummaryHeadline
                    contractValue={data.summary.contractValue}
                    termMonths={data.summary.termMonths}
                    effectiveDate={data.summary.effectiveDate}
                    customerName={isNoCustomerData ? customerName : data.customerName}
                    lineItemsSummary={data.summary.lineItemsSummary}
                  />
                  <div className="mt-4 flex flex-wrap items-start gap-4">
                    {summarySources.map((source, index) => (
                      <div key={source.id} className="flex w-[72px] flex-col gap-1.5">
                        <PdfThumbnail
                          docName={source.docName}
                          highlightId={source.highlightId}
                          onClick={() => setPreview({ sectionId: 'summary', index })}
                        />
                        <span className="truncate text-[12px] leading-[1.35] text-brand-fog" title={source.docName}>
                          {source.docName}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Account */}
                <section ref={setSectionRef('account')} className="group/section">
                  <ContractSectionRow
                    sectionId="account"
                    sectionLabel="Account"
                    areCommentsVisible={arePageCommentsVisible}
                    comments={commentsBySection['account'] ?? []}
                    onAddNote={(text, status) => handleAddComment('account', 'Account', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                    showAddNote={addNoteSectionId === 'account'}
                    onShowAddNoteChange={setSectionAddNote('account')}
                  >
                    <SectionHeader
                      title="Account"
                      helper={
                        createdAccountCustomer ? 'New customer will be created' : undefined
                      }
                      isFlashing={false}
                      commentCount={commentCountsBySection['account']}
                      commentsVisible={arePageCommentsVisible}
                      onToggleComments={
                        isItemPinnedVariant ? () => handleSectionCommentIcon('account') : undefined
                      }
                    />
                    <div className="mt-4">
                      <LabelValueList
                        items={shownAccountItems}
                        sectionId="account"
                        sectionLabel="Account"
                        showAddField
                        controlled
                        onItemChange={handleAccountItemChange}
                        onCreateAsNewCustomer={handleCreateAccountCustomer}
                        onDeleteCreatedCustomer={handleDeleteAccountCustomer}
                        createdCustomerName={createdAccountCustomer}
                        accountPickerVariant={isAccountPickerV2 ? 'v2' : 'current'}
                        hideAttentionFlags
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
                  <ContractSectionRow
                    sectionId="addresses"
                    sectionLabel="Addresses"
                    areCommentsVisible={arePageCommentsVisible}
                    comments={commentsBySection['addresses'] ?? []}
                    onAddNote={(text, status) => handleAddComment('addresses', 'Addresses', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                    showAddNote={addNoteSectionId === 'addresses'}
                    onShowAddNoteChange={setSectionAddNote('addresses')}
                  >
                    <SectionHeader
                      title="Billing and Shipping addresses"
                      status="ready"
                      statusLabel="Ready"
                      isFlashing={false}
                      commentCount={commentCountsBySection['addresses']}
                      commentsVisible={arePageCommentsVisible}
                      onToggleComments={
                        isItemPinnedVariant ? () => handleSectionCommentIcon('addresses') : undefined
                      }
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
                  <ContractSectionRow
                    sectionId="terms"
                    sectionLabel="Terms and billing"
                    areCommentsVisible={arePageCommentsVisible}
                    comments={commentsBySection['terms'] ?? []}
                    onAddNote={(text, status) => handleAddComment('terms', 'Terms and billing', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                    showAddNote={addNoteSectionId === 'terms'}
                    onShowAddNoteChange={setSectionAddNote('terms')}
                  >
                    <SectionHeader
                      title="Terms and billing"
                      status="ready"
                      statusLabel="Ready"
                      isFlashing={false}
                      commentCount={commentCountsBySection['terms']}
                      commentsVisible={arePageCommentsVisible}
                      onToggleComments={
                        isItemPinnedVariant ? () => handleSectionCommentIcon('terms') : undefined
                      }
                    />
                    <div className="mt-4">
                      <LabelValueList
                        items={shownTermsAndBilling}
                        excelComments={
                          isCustomerScenarios
                            ? {
                                'Auto-renewal':
                                  data.termsAndBilling.find((term) => term.label === 'Auto-renewal')
                                    ?.notice?.message ?? '',
                              }
                            : undefined
                        }
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
                    onAddNote={(text, status) => handleAddComment('products', 'Products and pricing', text, status)}
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                    showAddNote={addNoteSectionId === 'products'}
                    onShowAddNoteChange={setSectionAddNote('products')}
                  >
                    <ProductsPricingTable
                      key="products-pricing-discount-period-v2"
                      items={data.products}
                      periods={data.rampPeriods}
                      contractEndDate={
                        data.termsAndBilling.find((term) => term.label === 'End date')?.value
                      }
                      billingFrequency={
                        data.termsAndBilling.find(
                          (term) => term.label === 'Billing frequency'
                        )?.value
                      }
                      variant={productsPricingVariant}
                      excelComments={isCustomerScenarios}
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
                          <SectionHeader
                            title="Products and pricing"
                            isFlashing={false}
                            commentCount={
                              isProductsLifted
                                ? undefined
                                : commentCountsBySection['products']
                            }
                            commentsVisible={arePageCommentsVisible}
                            onToggleComments={
                              isItemPinnedVariant
                                ? () => handleSectionCommentIcon('products')
                                : undefined
                            }
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

                {/* Entitlements */}
                <section ref={setSectionRef('allocation')} className="group/section">
                  <ContractSectionRow
                    sectionId="allocation"
                    sectionLabel="Entitlements"
                    areCommentsVisible={arePageCommentsVisible}
                    comments={commentsBySection['allocation'] ?? []}
                    onAddNote={(text, status) =>
                      handleAddComment('allocation', 'Entitlements', text, status)
                    }
                    onDelete={handleDeleteComment}
                    onResolve={handleResolveComment}
                    showAddNote={addNoteSectionId === 'allocation'}
                    onShowAddNoteChange={setSectionAddNote('allocation')}
                  >
                    <SectionHeader
                      title="Entitlements"
                      isFlashing={false}
                      commentCount={commentCountsBySection['allocation']}
                      commentsVisible={arePageCommentsVisible}
                      onToggleComments={
                        isItemPinnedVariant
                          ? () => handleSectionCommentIcon('allocation')
                          : undefined
                      }
                    />
                    <div className="mt-6">
                      <AllocationTable items={data.allocations} periods={data.rampPeriods} />
                    </div>
                  </ContractSectionRow>
                </section>

                {/* Billing schedule — notes are omitted only in Item pinned. */}
                <section ref={setSectionRef('schedule')} className="group/section">
                  {isItemPinnedVariant ? (
                    <>
                      <SectionHeader
                        title="Billing schedule"
                        hideLine
                        showRefreshIcon
                        isFlashing={false}
                      />
                      <div className="mt-6" style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                        <PaymentSchedule tcv={data.summary.contractValue} />
                      </div>
                    </>
                  ) : (
                    <ContractSectionRow
                      sectionId="schedule"
                      sectionLabel="Billing schedule"
                      areCommentsVisible
                      comments={commentsBySection['schedule'] ?? []}
                      onAddNote={(text, status) =>
                        handleAddComment('schedule', 'Billing schedule', text, status)
                      }
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
                  )}
                </section>

                {/* Invoice preview — notes are omitted only in Item pinned. */}
                <section ref={setSectionRef('invoice')} className="group/section">
                  {isItemPinnedVariant ? (
                    <div style={{ maxWidth: WIDE_CONTENT_WIDTH }}>
                      <InvoicePreview
                        isFlashing={false}
                        invoiceLevelDiscount={invoiceLevelDiscount}
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
                          invoiceLevelDiscount={invoiceLevelDiscount}
                        />
                      </div>
                    </ContractSectionRow>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
        </FieldEditHistoryProvider>
      )}

      {activeTab === 'sales-order' && <SubscriptionRecord />}

      {activeTab !== 'tasks' && activeTab !== 'sales-order' && (
        <TabPlaceholder label={C360_TABS.find((t) => t.id === activeTab)?.label ?? 'Content'} />
      )}

      <SourcePreviewDrawer
        open={!!preview}
        sources={
          preview
            ? preview.sectionId === 'summary'
              ? summarySources
              : sectionSources[preview.sectionId]
            : []
        }
        activeIndex={preview?.index ?? 0}
        onIndexChange={(index) => setPreview((prev) => (prev ? { ...prev, index } : null))}
        onClose={() => setPreview(null)}
      />
    </div>
  )
}

export default Customer360Page
