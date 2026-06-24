import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, Sparkles, Loader2, PanelLeftClose, PanelLeft, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFileDrop } from '@/context/FileDropContext'
import { contractProcessing, sectionSources } from '@/data/contractProcessingMock'
import {
  SectionHeader,
  LabelValueList,
  ProductsPricingTable,
  InvoicePreview,
  PaymentSchedule,
  InPageNav,
  CommentsPanel,
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
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { addProcessingFile, processingFiles, workbenchItems } = useFileDrop()
  
  const [isDragOver, setIsDragOver] = useState(false)
  
  const activeFile = processingFiles.find(
    (f) => f.status === 'uploading' || f.status === 'processing',
  )
  const isUploading = activeFile?.status === 'uploading'
  const isAIProcessing = activeFile?.status === 'processing'
  const isProcessing = isUploading || isAIProcessing
  
  // Watch for completed processing to navigate to contract
  useEffect(() => {
    const completedFile = processingFiles.find(f => f.status === 'complete')
    if (completedFile && onFileProcessed) {
      // Find the newly created contract (Pioneer Systems in mock data)
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
    // Only set to false if leaving the actual drop zone
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      files.forEach((file) => addProcessingFile(file))
    }
  }, [addProcessingFile])
  
  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click()
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => addProcessingFile(file))
      e.target.value = ''
    }
  }
  
  return (
    <div 
      className="flex h-full w-full items-center justify-center"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt"
        multiple
      />
      
      {/* Drop zone pill */}
      <div
        ref={dropZoneRef}
        onClick={handleClick}
        className={cn(
          'group relative overflow-hidden rounded-full transition-all duration-300',
          !isProcessing && 'cursor-pointer',
          isDragOver 
            ? 'scale-110 shadow-2xl' 
            : 'hover:scale-105 hover:shadow-lg'
        )}
      >
        {/* Background */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-300',
            isDragOver
              ? 'ai-gradient animate-pulse'
              : 'bg-brand-navy dark:bg-white'
          )}
        />
        
        {/* AI gradient glow effect */}
        {!isDragOver && !isProcessing && (
          <>
            <div
              className="absolute bottom-0 right-0 h-[140%] w-24 opacity-70 transition-all duration-500 ease-out group-hover:-translate-x-2 group-hover:-translate-y-1"
              style={{
                background:
                  'radial-gradient(ellipse at bottom right, rgba(109, 40, 217, 0.5) 0%, rgba(255, 51, 0, 0.22) 48%, transparent 72%)',
              }}
            />
            <div
              className="absolute bottom-0 right-4 h-full w-12 opacity-50 transition-all duration-700 ease-out group-hover:-translate-x-3"
              style={{
                background:
                  'radial-gradient(ellipse at bottom center, rgba(255, 51, 0, 0.35) 0%, transparent 68%)',
              }}
            />
          </>
        )}
        
        {/* Content */}
        <div className="relative flex items-center gap-2 px-5 py-3">
          {/* Default state */}
          {!isProcessing && !isDragOver && (
            <>
              <Upload 
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5",
                  "text-white dark:text-brand-navy"
                )} 
              />
              <span className="text-[14px] font-medium text-white dark:text-brand-navy">
                Drop a contract
              </span>
            </>
          )}
          
          {/* Drag over state */}
          {isDragOver && !isProcessing && (
            <>
              <Upload className="h-4 w-4 shrink-0 animate-bounce text-white" />
              <span className="text-[14px] font-medium text-white">
                Release to upload
              </span>
            </>
          )}
          
          {/* Uploading state */}
          {isUploading && activeFile && (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white dark:text-brand-navy" />
              <div className="flex flex-col gap-1" style={{ width: '140px' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium leading-none text-white dark:text-brand-navy">
                    Uploading
                  </span>
                  <span className="text-[12px] leading-none text-white/60 dark:text-brand-navy/60">
                    {Math.round(activeFile.progress)}%
                  </span>
                </div>
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/20 dark:bg-brand-navy/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-300 dark:bg-brand-navy"
                    style={{ width: `${activeFile.progress}%` }}
                  />
                </div>
              </div>
            </>
          )}
          
          {/* AI Processing state */}
          {isAIProcessing && (
            <>
              <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-white dark:text-brand-navy" />
              <div className="flex flex-col gap-1" style={{ width: '160px' }}>
                <span className="text-[12px] font-medium leading-none text-white dark:text-brand-navy">
                  Processing contract...
                </span>
                <div className="h-[3px] w-full overflow-hidden rounded-full ai-gradient animate-pulse" />
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Hint text below */}
      {!isProcessing && (
        <p className="absolute bottom-8 text-[12px] text-theme-secondary">
          or click to browse files
        </p>
      )}
    </div>
  )
}

function ContractProcessingView({ contractId }: { contractId: number }) {
  const { workbenchItems } = useFileDrop()
  const data = contractProcessing
  
  const [activeSection, setActiveSection] = useState('summary')
  const [flashingSection, setFlashingSection] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ sectionId: string; index: number } | null>(null)
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState(0)
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true)
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false)
  const [linkedSection, setLinkedSection] = useState<string | undefined>(undefined)
  const [showAddNote, setShowAddNote] = useState(false)
  const [contractStatus, setContractStatus] = useState<string>('In progress')

  const centerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const programmaticScroll = useRef(false)
  const spyResumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Get contract details from workbenchItems
  const contract = workbenchItems.find(item => item.id === contractId)
  const customerName = contract?.customer || data.customerName

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

  const handleCommentJump = useCallback(
    (sectionId: string) => {
      scrollToSection(sectionId)
      if (flashTimeout.current) clearTimeout(flashTimeout.current)
      setFlashingSection(null)
      requestAnimationFrame(() => setFlashingSection(sectionId))
      flashTimeout.current = setTimeout(() => setFlashingSection(null), 2300)
    },
    [scrollToSection]
  )

  const handleAddNoteForSection = useCallback((sectionLabel: string) => {
    setLinkedSection(sectionLabel)
    setShowAddNote(true)
  }, [])

  const handleClearLinkedSection = useCallback(() => {
    setLinkedSection(undefined)
  }, [])

  useEffect(() => () => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current)
    if (spyResumeTimeout.current) clearTimeout(spyResumeTimeout.current)
  }, [])

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

  // Layout constants
  const CONTENT_WIDTH = 800
  const LEFT_NAV_WIDTH = 180
  const COMMENTS_WIDTH = 250
  const COMMENTS_COLLAPSED_WIDTH = 48

  return (
    <div className="flex h-full flex-col">
      {/* Header - Customer name + expand toggle + CTA */}
      <div className="shrink-0 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-[18px] font-semibold text-theme-primary">
              {customerName}
            </h1>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {data.dealTag}
            </span>
            
            {/* Expand/Collapse toggle */}
            <button
              type="button"
              onClick={() => setIsPanelsExpanded(!isPanelsExpanded)}
              className={cn(
                'ml-4 flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                'text-theme-secondary hover:bg-theme-hover hover:text-theme-primary'
              )}
              title={isPanelsExpanded ? 'Collapse panels' : 'Expand panels'}
            >
              {isPanelsExpanded ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
          </div>
          
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <Send size={16} />
            Send for approval
          </button>
        </div>
        {/* Divider line - aligned with content */}
        <div className="mt-3 h-px bg-theme-border" />
      </div>

      {/* Body - constrained to header width (px-6 = 24px each side) */}
      <div className="relative min-h-0 flex-1 px-6">
        {/* Left nav - aligned to left edge (customer name) */}
        <aside 
          className={cn(
            "absolute left-6 top-0 bottom-0 pt-4 overflow-hidden transition-all duration-300 ease-out z-10"
          )}
          style={{ width: isPanelsExpanded ? LEFT_NAV_WIDTH : 0 }}
        >
          <div 
            className={cn(
              "transition-opacity duration-200",
              isPanelsExpanded ? "opacity-100 delay-100" : "opacity-0"
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

        {/* Center content - fixed 800px width, centered */}
        <div 
          ref={centerRef} 
          className="mx-auto h-full overflow-y-auto pb-20 pt-8"
          style={{ width: CONTENT_WIDTH }}
        >
          <div className="space-y-16">
            {/* Summary */}
            <section ref={setSectionRef('summary')} className="group/section" style={{ maxWidth: 720 }}>
              <div className="relative">
                {flashingSection === 'summary' && (
                  <span className="title-sweep-overlay" aria-hidden="true">
                    <span className="title-sweep-band" />
                  </span>
                )}
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
              <SectionHeader
                title="Account"
                status="ready"
                statusLabel="Ready"
                isFlashing={flashingSection === 'account'}
                onAddNote={() => handleAddNoteForSection('Account')}
              />
              <div className="mt-4">
                <LabelValueList items={data.account} />
              </div>
            </section>

            {/* Addresses */}
            <section ref={setSectionRef('addresses')} className="group/section">
              <SectionSourceThumbnails
                sources={sectionSources.addresses}
                onOpen={(i) => setPreview({ sectionId: 'addresses', index: i })}
              />
              <SectionHeader
                title="Addresses"
                status="ready"
                statusLabel="Ready"
                isFlashing={flashingSection === 'addresses'}
                onAddNote={() => handleAddNoteForSection('Addresses')}
              />
              <div className="mt-4">
                <LabelValueList items={data.addresses} />
              </div>
            </section>

            {/* Terms and billing */}
            <section ref={setSectionRef('terms')} className="group/section">
              <SectionSourceThumbnails
                sources={sectionSources.terms}
                onOpen={(i) => setPreview({ sectionId: 'terms', index: i })}
              />
              <SectionHeader
                title="Terms and billing"
                status="ready"
                statusLabel="Ready"
                isFlashing={flashingSection === 'terms'}
                onAddNote={() => handleAddNoteForSection('Terms and billing')}
              />
              <div className="mt-4">
                <LabelValueList items={data.termsAndBilling} />
              </div>
            </section>

            {/* Products and pricing */}
            <section ref={setSectionRef('products')} className="group/section">
              <SectionSourceThumbnails
                sources={sectionSources.products}
                onOpen={(i) => setPreview({ sectionId: 'products', index: i })}
              />
              <SectionHeader
                title="Products and pricing"
                status="ai-created"
                statusLabel="Created 2 items"
                isFlashing={flashingSection === 'products'}
                onAddNote={() => handleAddNoteForSection('Products and pricing')}
              />
              <div className="mt-4">
                <ProductsPricingTable items={data.products} />
              </div>
            </section>

            {/* Billing schedule */}
            <section ref={setSectionRef('schedule')} className="group/section">
              <SectionHeader 
                title="Billing schedule" 
                isFlashing={flashingSection === 'schedule'}
                onAddNote={() => handleAddNoteForSection('Billing schedule')}
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
            </section>

            {/* Invoice preview */}
            <section ref={setSectionRef('invoice')} className="group/section">
              <InvoicePreview 
                activeIndex={activeInvoiceIndex}
                totalInvoices={4}
                onIndexChange={setActiveInvoiceIndex}
                isFlashing={flashingSection === 'invoice'}
              />
            </section>
          </div>
        </div>

        {/* Comments panel - aligned to right edge (CTA button) */}
        <aside 
          className="absolute right-6 top-0 bottom-0 overflow-hidden pb-20 pt-8 transition-all duration-300 ease-out z-10"
          style={{ 
            width: isPanelsExpanded 
              ? (isCommentsCollapsed ? COMMENTS_COLLAPSED_WIDTH : COMMENTS_WIDTH) 
              : 0
          }}
        >
          <div 
            className={cn(
              "h-full overflow-y-auto pr-3 transition-opacity duration-200",
              isPanelsExpanded ? "opacity-100 delay-100" : "opacity-0"
            )}
            style={{ width: isCommentsCollapsed ? COMMENTS_COLLAPSED_WIDTH : COMMENTS_WIDTH }}
          >
            <CommentsPanel
              comments={data.comments}
              activeSectionId={activeSection}
              onCommentJump={handleCommentJump}
              isCollapsed={isCommentsCollapsed}
              onToggleCollapse={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
              linkedSection={linkedSection}
              onStatusChange={(status) => setContractStatus(status)}
              showAddNote={showAddNote}
              onShowAddNoteChange={setShowAddNote}
              onClearLinkedSection={handleClearLinkedSection}
            />
          </div>
        </aside>
      </div>

      <SourcePreviewDrawer
        open={!!preview}
        sources={preview ? sectionSources[preview.sectionId] : []}
        activeIndex={preview?.index ?? 0}
        onIndexChange={(index) =>
          setPreview((prev) => (prev ? { ...prev, index } : null))
        }
        onClose={() => setPreview(null)}
      />
    </div>
  )
}

export function ContractIngestionPage({ activeContractId, onContractProcessed }: ContractIngestionPageProps) {
  // If no active contract, show empty drop zone
  if (!activeContractId) {
    return <EmptyDropZone onFileProcessed={onContractProcessed} />
  }
  
  // Otherwise show contract processing view
  return <ContractProcessingView contractId={activeContractId} />
}

export default ContractIngestionPage
