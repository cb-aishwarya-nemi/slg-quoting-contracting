import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, ChevronRight, X, ArrowDown, Send, MessageCircleMore } from 'lucide-react'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase } from '@/context/UseCaseContext'
import { useNotifications } from '@/context/NotificationContext'
import { contractProcessing, sectionSources, type Comment } from '@/data/contractProcessingMock'
import {
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
  { id: 'contracts', label: 'Contracts' },
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
const COMMENTS_COL_WIDTH = 250
const LEFT_NAV_WIDTH = 180

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

function SendForApprovalButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-orange-600"
    >
      <Send size={16} />
      Send for approval
    </button>
  )
}

export function Customer360Page() {
  const { goToWorkbench, goToAllContracts } = useNavigation()
  const { setActivePage } = useUseCase()
  const { addNotification } = useNotifications()
  const data = contractProcessing
  const [activeTab, setActiveTab] = useState('contracts')
  const [activeSection, setActiveSection] = useState('summary')
  const [preview, setPreview] = useState<{ sectionId: string; index: number } | null>(null)
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState(0)
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false)
  const [contractStatus, setContractStatus] = useState<string>('In progress')

  // Comment state lifted to page so all stacks share the same source of truth
  const [localComments, setLocalComments] = useState<Array<Comment & { status?: CommentStatus }>>(
    () => data.comments.map((c) => ({ ...c, status: 'open' as CommentStatus }))
  )

  const centerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const programmaticScroll = useRef(false)
  const spyResumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      programmaticScroll.current = true
      if (spyResumeTimeout.current) clearTimeout(spyResumeTimeout.current)
      spyResumeTimeout.current = setTimeout(() => {
        programmaticScroll.current = false
      }, 700)
      container.scrollTo({ top: Math.max(top - 12, 0), behavior: 'smooth' })
    }
    setActiveSection(id)
  }, [])

  const handleNavigate = scrollToSection

  const handleSendForApproval = useCallback(() => {
    addNotification({
      title: 'Contract sent for approval',
      message: `${data.customerName} contract has been sent to Adrian Brody (Manager) for approval. Average approval time is 12 hours.`,
      persistent: true,
    })
    goToAllContracts('pioneer-systems')
  }, [addNotification, data.customerName, goToAllContracts])

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

  useEffect(
    () => () => {
      if (spyResumeTimeout.current) clearTimeout(spyResumeTimeout.current)
    },
    []
  )

  // Scroll spy
  useEffect(() => {
    const container = centerRef.current
    if (!container) return

    const handleScroll = () => {
      if (programmaticScroll.current) return
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
      if (spyResumeTimeout.current) clearTimeout(spyResumeTimeout.current)
      programmaticScroll.current = false
    }

    container.addEventListener('scroll', handleScroll)
    container.addEventListener('scrollend', handleScrollEnd)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('scrollend', handleScrollEnd)
    }
  }, [])

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
        <div style={{ width: CONTENT_COL_WIDTH, flexShrink: 0 }}>{children}</div>
        {!isCommentsCollapsed && (
          <div style={{ width: COMMENTS_COL_WIDTH, flexShrink: 0 }}>
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
      isCommentsCollapsed,
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
        <div className="absolute left-6 bottom-1 flex items-end gap-2">
          <button
            type="button"
            onClick={goToWorkbench}
            className="mb-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
            title="Close"
          >
            <X size={18} />
          </button>
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-[0] text-brand-fog">
                Customers
              </span>
              <ChevronRight size={10} className="text-brand-fog" />
            </div>
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

      {/* Secondary nav + body */}
      <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
        {/* Secondary nav */}
        <div className="flex shrink-0 items-center py-3">
          <div className="flex shrink-0 items-center" style={{ width: 40 }}>
            <button
              type="button"
              onClick={goToWorkbench}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
              title="Back to Workbench"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="shrink-0">
            <div className="text-[13px] font-bold uppercase tracking-[-0.25px] text-brand-navy">
              {data.processing.title}
            </div>
            <div className="mt-0.5 text-[12px] tracking-[-0.25px] text-brand-navy">
              {data.processing.sectionsReady} of {data.processing.sectionsTotal} sections ready
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Comments toggle */}
            <button
              type="button"
              onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
              className={cn(
                'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors',
                isCommentsCollapsed
                  ? 'text-brand-fog hover:bg-neutral-100'
                  : 'text-blue-700 hover:bg-blue-50'
              )}
              title={isCommentsCollapsed ? 'Show comments' : 'Hide comments'}
            >
              <MessageCircleMore size={16} />
            </button>
            <StatusUnit status={contractStatus} />
            <SendForApprovalButton onClick={handleSendForApproval} />
          </div>
        </div>

        {/* Body: left nav + merged content+comments column */}
        <div className="flex min-h-0 flex-1" style={{ paddingLeft: 40 }}>
          {/* Grid 1 — in-page nav */}
          <aside className="shrink-0 pt-4" style={{ width: LEFT_NAV_WIDTH }}>
            <InPageNav
              sections={NAV_SECTIONS}
              sourceDocuments={data.sourceDocuments}
              activeId={activeSection}
              onNavigate={handleNavigate}
            />
          </aside>

          {/* Grid 2+3 merged — content + inline comment stacks, both scroll together */}
          <div ref={centerRef} className="min-w-0 flex-1 overflow-y-auto pb-20 pt-12">
            <div
              className="mx-auto space-y-16"
              style={{ maxWidth: CONTENT_COL_WIDTH + 32 + COMMENTS_COL_WIDTH }}
            >

              {/* Summary — no comments column (no SectionHeader) */}
              <section
                ref={setSectionRef('summary')}
                className="group/section"
                style={{ maxWidth: CONTENT_COL_WIDTH }}
              >
                <div className="relative">
                  {false && (
                    <span className="title-sweep-overlay" aria-hidden="true">
                      <span className="title-sweep-band" />
                    </span>
                  )}
                  <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.5px] text-brand-navy">
                    <span className="font-bold">
                      Contract Value: {data.summary.contractValue}
                    </span>
                    {data.summary.headline}
                  </h2>
                </div>
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
                    <LabelValueList items={data.account} />
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
                    <ProductsPricingTable items={data.products} />
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
                  <div className="mt-6">
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
                  <InvoicePreview
                    activeIndex={activeInvoiceIndex}
                    totalInvoices={4}
                    onIndexChange={setActiveInvoiceIndex}
                    isFlashing={false}
                  />
                </SectionRow>
              </section>
            </div>
          </div>
        </div>
      </div>

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
