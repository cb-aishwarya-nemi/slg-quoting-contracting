import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Upload, Sparkles, Loader2, PanelLeftClose, PanelLeft, Send, X, FileText, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFileDrop } from '@/context/FileDropContext'
import { sectionSources, type Comment, getContractById } from '@/data/contractProcessingMock'
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

const NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'ai' },
  { id: 'account', label: 'Account', status: 'ready' },
  { id: 'addresses', label: 'Addresses', status: 'ready' },
  { id: 'terms', label: 'Terms and billing', status: 'ready' },
  { id: 'products', label: 'Products and pricing', status: 'attention' },
  { id: 'schedule', label: 'Billing schedule', status: 'neutral' },
  { id: 'invoice', label: 'Invoice preview', status: 'neutral' },
]

interface ContractIngestionPageProps {
  activeContractId: number | null
  onContractProcessed?: (contractId: number) => void
}

function EmptyDropZone({ onFileProcessed }: { onFileProcessed?: (contractId: number) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const { addProcessingFile, processingFiles, workbenchItems } = useFileDrop()
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  
  const activeFile = processingFiles.find(
    (f) => f.status === 'uploading' || f.status === 'processing',
  )
  const isUploading = activeFile?.status === 'uploading'
  const isAIProcessing = activeFile?.status === 'processing'
  const isProcessing = isUploading || isAIProcessing || isSubmitting
  
  useEffect(() => {
    const completedFile = processingFiles.find(f => f.status === 'complete')
    if (completedFile && onFileProcessed) {
      const newContract = workbenchItems.find(item => item.isNew && item.contractId)
      if (newContract) {
        onFileProcessed(newContract.id)
      }
    }
  }, [processingFiles, workbenchItems, onFileProcessed])
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragOver(true)
    }
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!chatAreaRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files])
    }
  }, [])
  
  const handleAttachClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setPendingFiles(prev => [...prev, ...Array.from(files)])
      e.target.value = ''
    }
  }
  
  const handleRemoveFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleProcess = () => {
    if (pendingFiles.length === 0 || isProcessing) return
    setIsSubmitting(true)
    pendingFiles.forEach(file => addProcessingFile(file))
  }
  
  const truncateFileName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) return name
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
    const baseName = name.slice(0, name.lastIndexOf('.') || name.length)
    const truncatedBase = baseName.slice(0, maxLength - ext.length - 3)
    return `${truncatedBase}...${ext}`
  }
  
  return (
    <div 
      className="flex h-full w-full flex-col items-center justify-center gap-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xls,.xlsx,.csv"
        multiple
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="font-heading text-[24px] font-normal text-brand-navy dark:text-white tracking-[-0.5px]">
          Start by dropping your latest contract
        </h2>
      </div>
      
      <div
        ref={chatAreaRef}
        className={cn(
          'group/chatbox relative flex flex-col overflow-hidden rounded-xl transition-all duration-300',
          'hover:scale-[1.015]',
          isDragOver ? 'scale-[1.02] shadow-lg' : '',
          isProcessing && 'pointer-events-none opacity-70'
        )}
        style={{ 
          width: 520, 
          height: 260,
          border: isDragOver ? '1.5px solid transparent' : '1.5px solid #1c1b2e',
        }}
      >
        {isDragOver && (
          <div 
            className="absolute inset-0 -z-10 animate-pulse rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #ff3300, #8b5cf6, #ff3300)',
              backgroundSize: '200% 200%',
              animation: 'gradient-flow 2s ease infinite',
              padding: 2,
            }}
          />
        )}
        
        <div className={cn(
          'flex flex-1 flex-col rounded-[10px] bg-white dark:bg-brand-deep',
          isDragOver && 'm-[2px]'
        )}>
          <div 
            className="shrink-0 cursor-pointer overflow-x-auto rounded-t-[10px] bg-brand-navy px-3 py-2" 
            style={{ borderBottom: '1.5px solid #1c1b2e' }}
            onClick={(e) => {
              if (!isProcessing && pendingFiles.length === 0 && fileInputRef.current) {
                e.stopPropagation()
                fileInputRef.current.click()
              }
            }}
          >
            {pendingFiles.length === 0 && !isProcessing ? (
              <p className="text-[13px] text-white/60">
                {isDragOver ? 'Release to attach contracts' : 'Drag and drop contracts here'}
              </p>
            ) : isProcessing ? (
              <div className="flex items-center gap-3">
                {isUploading && activeFile && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-white">Uploading</span>
                      <div className="h-1 w-24 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white transition-all duration-300"
                          style={{ width: `${activeFile.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-white/50">
                        {Math.round(activeFile.progress)}%
                      </span>
                    </div>
                  </>
                )}
                {isAIProcessing && (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse text-orange-400" />
                    <span className="text-[12px] font-medium text-white">
                      Processing contracts...
                    </span>
                    <div className="h-1 w-24 overflow-hidden rounded-full ai-gradient animate-pulse" />
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors"
                    style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}
                  >
                    <FileText size={12} className="shrink-0 text-white/60" />
                    <span className="text-[12px] font-medium text-white">
                      {truncateFileName(file.name)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(index)
                      }}
                      className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white hover:text-brand-navy"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex-1 p-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add some notes..."
              disabled={isProcessing}
              className={cn(
                'h-full w-full resize-none bg-transparent text-[13px] text-brand-navy outline-none placeholder:text-brand-mist dark:text-white dark:placeholder:text-brand-fog',
                isProcessing && 'cursor-not-allowed opacity-50'
              )}
            />
          </div>
          
          <div className="flex shrink-0 items-center justify-between rounded-b-[10px] bg-brand-navy px-4 py-3">
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={isProcessing}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors',
                'text-white/60 hover:bg-white hover:text-brand-navy',
                isProcessing && 'cursor-not-allowed opacity-50'
              )}
            >
              <Upload size={14} />
              <span>Drop a contract</span>
            </button>
            
            <button
              type="button"
              onClick={handleProcess}
              disabled={pendingFiles.length === 0 || isProcessing}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors',
                pendingFiles.length > 0 && !isProcessing
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'cursor-not-allowed bg-white/10 text-white/30'
              )}
            >
              <span>Process</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ContractProcessingViewProps {
  contractId: number
  currentIndex: number
  totalContracts: number
  onNavigatePrev: () => void
  onNavigateNext: () => void
}

function ContractProcessingView({ 
  contractId, 
  currentIndex, 
  totalContracts, 
  onNavigatePrev, 
  onNavigateNext 
}: ContractProcessingViewProps) {
  // Get contract data dynamically based on contractId
  const data = useMemo(() => getContractById(contractId), [contractId])

  const [activeSection, setActiveSection] = useState('summary')
  const [preview, setPreview] = useState<{ sectionId: string; index: number } | null>(null)
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState(0)
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true)

  // Comment state lifted to view so all section stacks share one source of truth
  const [localComments, setLocalComments] = useState<Array<Comment & { status?: 'open' | 'resolved' }>>(
    () => data.comments.map((c) => ({ ...c, status: 'open' as const }))
  )
  
  // Reset comments when contract changes
  useEffect(() => {
    setLocalComments(data.comments.map((c) => ({ ...c, status: 'open' as const })))
  }, [data.comments])

  const centerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const programmaticScroll = useRef(false)
  const spyResumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Use customer name from the dynamic contract data
  const customerName = data.customerName

  // Group comments by section, newest first within each group
  const commentsBySection = useMemo(() => {
    const grouped: Record<string, Array<Comment & { status?: 'open' | 'resolved' }>> = {}
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

  // Comment CRUD – shared across all section stacks
  const handleAddComment = useCallback(
    (sectionId: string, sectionLabel: string, text: string) => {
      const newComment: Comment & { status: 'open' } = {
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

  const handleDeleteComment = useCallback((commentId: string) => {
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId))
  }, [])

  const handleResolveComment = useCallback((commentId: string) => {
    setLocalComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, status: c.status === 'resolved' ? 'open' : ('resolved' as const) }
          : c
      )
    )
  }, [])

  useEffect(
    () => () => {
      if (flashTimeout.current) clearTimeout(flashTimeout.current)
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

  const LEFT_NAV_WIDTH = 180
  const CONTENT_COL_WIDTH = 680
  const COMMENTS_COL_WIDTH = 250

  // 2-col section row: content on the left, inline comment stack on the right
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
      {/* Header */}
      <div className="shrink-0 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-[18px] font-semibold text-theme-primary">
              {customerName}
            </h1>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {data.dealTag}
            </span>

            <button
              type="button"
              onClick={() => setIsPanelsExpanded(!isPanelsExpanded)}
              className={cn(
                'ml-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors',
                'text-theme-secondary hover:bg-theme-hover hover:text-theme-primary'
              )}
              title={isPanelsExpanded ? 'Collapse panels' : 'Expand panels'}
            >
              {isPanelsExpanded ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {totalContracts > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onNavigatePrev}
                  disabled={currentIndex === 0}
                  className={cn(
                    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors',
                    currentIndex === 0
                      ? 'cursor-not-allowed text-brand-mist'
                      : 'text-brand-navy hover:bg-neutral-100 dark:text-white dark:hover:bg-brand-soft'
                  )}
                  title="Previous contract"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="min-w-[90px] text-center text-[13px] text-brand-navy dark:text-white">
                  {currentIndex + 1}/{totalContracts} contracts
                </span>
                <button
                  type="button"
                  onClick={onNavigateNext}
                  disabled={currentIndex === totalContracts - 1}
                  className={cn(
                    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors',
                    currentIndex === totalContracts - 1
                      ? 'cursor-not-allowed text-brand-mist'
                      : 'text-brand-navy hover:bg-neutral-100 dark:text-white dark:hover:bg-brand-soft'
                  )}
                  title="Next contract"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-orange-600"
            >
              <Send size={16} />
              Send for approval
            </button>
          </div>
        </div>
        <div className="mt-3 h-px bg-theme-border" />
      </div>

      {/* Body */}
      <div className="relative min-h-0 flex-1 px-6">
        {/* Left nav */}
        <aside
          className="absolute left-6 top-0 bottom-0 z-10 overflow-hidden pt-4 transition-all duration-300 ease-out"
          style={{ width: isPanelsExpanded ? LEFT_NAV_WIDTH : 0 }}
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
              sourceDocuments={data.sourceDocuments}
              activeId={activeSection}
              onNavigate={handleNavigate}
            />
          </div>
        </aside>

        {/* Scrollable content + inline comment stacks */}
        <div
          ref={centerRef}
          className="h-full overflow-y-auto pb-20 pt-8"
          style={{ marginLeft: isPanelsExpanded ? LEFT_NAV_WIDTH : 0 }}
        >
          <div
            className="mx-auto space-y-16"
            style={{ maxWidth: CONTENT_COL_WIDTH + (isPanelsExpanded ? 32 + COMMENTS_COL_WIDTH : 0) }}
          >
            {/* Summary — no comments column */}
            <section
              ref={setSectionRef('summary')}
              className="group/section"
              style={{ maxWidth: CONTENT_COL_WIDTH }}
            >
              <div className="relative">
                <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.5px] text-theme-primary">
                  <span className="font-bold">Contract Value: {data.summary.contractValue}</span>
                  {data.summary.headline}
                </h2>
              </div>
              <p className="mt-3 text-[13px] text-theme-primary">
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

export function ContractIngestionPage({ activeContractId, onContractProcessed }: ContractIngestionPageProps) {
  const { workbenchItems } = useFileDrop()
  
  const contractsReadyForReview = useMemo(() => {
    return workbenchItems.filter(
      (item) => item.contractId && (item.status === 'Ready for review' || item.status === 'In review' || item.status === 'Pending approval')
    )
  }, [workbenchItems])
  
  const [currentContractIndex, setCurrentContractIndex] = useState(() => {
    if (!activeContractId) return 0
    const index = contractsReadyForReview.findIndex((c) => c.id === activeContractId)
    return index >= 0 ? index : 0
  })
  
  useEffect(() => {
    if (activeContractId) {
      const index = contractsReadyForReview.findIndex((c) => c.id === activeContractId)
      if (index >= 0) {
        setCurrentContractIndex(index)
      }
    }
  }, [activeContractId, contractsReadyForReview])
  
  const currentContract = contractsReadyForReview[currentContractIndex]
  
  const handleNavigatePrev = useCallback(() => {
    setCurrentContractIndex((prev) => Math.max(0, prev - 1))
  }, [])
  
  const handleNavigateNext = useCallback(() => {
    setCurrentContractIndex((prev) => Math.min(contractsReadyForReview.length - 1, prev + 1))
  }, [contractsReadyForReview.length])

  if (!activeContractId) {
    return <EmptyDropZone onFileProcessed={onContractProcessed} />
  }
  
  return (
    <ContractProcessingView 
      contractId={currentContract?.id ?? activeContractId}
      currentIndex={currentContractIndex}
      totalContracts={contractsReadyForReview.length}
      onNavigatePrev={handleNavigatePrev}
      onNavigateNext={handleNavigateNext}
    />
  )
}

export default ContractIngestionPage
