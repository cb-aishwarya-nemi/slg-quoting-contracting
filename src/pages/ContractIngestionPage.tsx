import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Upload, Sparkles, PanelLeftClose, PanelLeft, Send, X, FileText, ArrowRight, ArrowLeft } from 'lucide-react'
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
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const notesInputRef = useRef<HTMLTextAreaElement>(null)
  const { addProcessingFile, processingFiles, workbenchItems } = useFileDrop()
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map())
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [isNotesEditing, setIsNotesEditing] = useState(false)
  
  const activeFile = processingFiles.find(
    (f) => f.status === 'uploading' || f.status === 'processing',
  )
  const isAIProcessing = activeFile?.status === 'processing'
  const isProcessing = isAIProcessing || isSubmitting
  
  const hasFiles = pendingFiles.length > 0
  const isUploading = uploadingFiles.size > 0
  
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
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])
  
  const simulateUpload = useCallback((_file: File, fileId: string) => {
    setUploadingFiles(prev => new Map(prev).set(fileId, 0))
    
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploadingFiles(prev => {
          const next = new Map(prev)
          next.delete(fileId)
          return next
        })
      } else {
        setUploadingFiles(prev => new Map(prev).set(fileId, Math.min(progress, 99)))
      }
    }, 150)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      files.forEach(file => {
        const fileId = `${file.name}-${Date.now()}-${Math.random()}`
        setPendingFiles(prev => [...prev, file])
        simulateUpload(file, fileId)
      })
    }
  }, [simulateUpload])
  
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
      Array.from(files).forEach(file => {
        const fileId = `${file.name}-${Date.now()}-${Math.random()}`
        setPendingFiles(prev => [...prev, file])
        simulateUpload(file, fileId)
      })
      e.target.value = ''
    }
  }
  
  const handleRemoveFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleProcess = () => {
    if (pendingFiles.length === 0 || isProcessing || isUploading) return
    setIsSubmitting(true)
    pendingFiles.forEach(file => addProcessingFile(file))
  }
  
  const truncateFileName = (name: string, maxLength = 24) => {
    if (name.length <= maxLength) return name
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
    const baseName = name.slice(0, name.lastIndexOf('.') || name.length)
    const truncatedBase = baseName.slice(0, maxLength - ext.length - 3)
    return `${truncatedBase}...${ext}`
  }
  
  const getCountWord = (count: number): string => {
    const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
    return count <= 10 ? words[count] : String(count)
  }
  
  const getHeadline = (): string => {
    if (!hasFiles) return 'Drop one or more contracts to begin'
    if (isAIProcessing) return `Processing ${getCountWord(pendingFiles.length).toLowerCase()} contract${pendingFiles.length > 1 ? 's' : ''}...`
    if (isUploading) return `${getCountWord(pendingFiles.length)} contract${pendingFiles.length > 1 ? 's' : ''} uploading...`
    return `${getCountWord(pendingFiles.length)} contract${pendingFiles.length > 1 ? 's' : ''} ready to process`
  }
  
  return (
    <div 
      ref={dropZoneRef}
      className="flex h-full w-full flex-col items-center justify-start pt-[20vh] transition-all duration-300"
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
        className="sr-only"
      />

      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-heading text-[28px] font-normal tracking-[-1px] text-brand-navy transition-all duration-300">
            {getHeadline()}
          </h1>
          <p className="text-[13px] text-brand-fog">
            You can choose multiple files while uploading
          </p>
        </div>
        
        {hasFiles && (
          <div className={cn(
            "flex flex-wrap justify-center gap-3 max-w-[600px] transition-all duration-300",
            isDragOver && "blur-sm opacity-60"
          )}>
            {pendingFiles.map((file, index) => {
              const fileKey = `${file.name}-${index}`
              const uploadProgress = uploadingFiles.get(fileKey)
              const isFileUploading = uploadProgress !== undefined
              
              return (
                <div
                  key={fileKey}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 transition-all duration-200',
                    isFileUploading 
                      ? 'border-brand-mist' 
                      : 'border-neutral-200 hover:border-brand-navy hover:shadow-sm'
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50">
                    <FileText size={16} className="text-red-500" />
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-medium text-brand-navy truncate max-w-[160px]">
                      {truncateFileName(file.name)}
                    </span>
                    {isFileUploading ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1 w-20 overflow-hidden rounded-full bg-neutral-200">
                          <div
                            className="h-full rounded-full ai-gradient transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-brand-mist">
                          {Math.round(uploadProgress)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-brand-fog">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>
                  
                  {!isFileUploading && !isProcessing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-mist opacity-0 transition-all hover:bg-neutral-100 hover:text-brand-navy group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {isAIProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center gap-3 overflow-hidden rounded-full bg-brand-navy px-6 py-3">
              {/* AI gradient progress bar */}
              <div className="absolute inset-0 ai-gradient animate-ai-progress" />
              <Sparkles className="relative z-10 h-5 w-5 animate-pulse text-white" />
              <span className="relative z-10 text-[14px] font-medium text-white">
                AI is analyzing your contracts...
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {hasFiles ? (
              <>
                <button
                  type="button"
                  onClick={isDragOver ? undefined : handleProcess}
                  disabled={isUploading || isProcessing}
                  className={cn(
                    'relative flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 font-heading text-[15px] font-semibold text-white transition-all duration-200',
                    isUploading || isProcessing
                      ? 'cursor-not-allowed bg-neutral-300'
                      : isDragOver
                      ? 'scale-[1.03] bg-brand-navy'
                      : 'bg-orange-500 hover:scale-[1.02] hover:bg-orange-600 hover:shadow-lg'
                  )}
                >
                  {isDragOver ? (
                    <>
                      <div className="absolute inset-0 ai-gradient" />
                      <Upload size={18} className="relative z-10" />
                      <span className="relative z-10">Upload contract</span>
                    </>
                  ) : (
                    <>
                      <span>Process Contract{pendingFiles.length > 1 ? 's' : ''}</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                
                {!isDragOver && (
                  <button
                    type="button"
                    onClick={handleAttachClick}
                    disabled={isProcessing}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-brand-navy transition-all duration-200',
                      'hover:bg-neutral-100',
                      isProcessing && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Upload size={14} />
                    <span>Upload more</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleAttachClick}
                className={cn(
                  'group/btn ink-drop-button flex items-center gap-2.5 rounded-full px-6 py-3.5 font-heading text-[15px] font-semibold text-white transition-all duration-300',
                  'bg-brand-navy hover:scale-[1.03]',
                  isDragOver && 'scale-[1.03] ink-drag-active'
                )}
              >
                {/* Ink animation layers */}
                <div className="ink-liquid-fill" />
                <div className="ink-liquid-hover" />
                <div className="ink-drop ink-drop-1" />
                <div className="ink-drop ink-drop-2" />
                <div className="ink-drop ink-drop-3" />
                <div className="ink-drop ink-drop-4" />
                <div className="ink-drop ink-drop-5" />
                <div className="ink-splash ink-splash-1" />
                <div className="ink-splash ink-splash-2" />
                <div className="ink-splash ink-splash-3" />
                <div className="ink-splash ink-splash-4" />
                <div className="ink-splash ink-splash-5" />
                
                <Upload size={18} className="relative z-10" />
                <span className="relative z-10">Upload contract</span>
              </button>
            )}
          </div>
        )}
        
        {hasFiles && !isProcessing && (
          <div className="flex w-full max-w-[480px] flex-col items-center gap-4 pt-2">
            <div className="h-px w-full bg-neutral-200" />
            
            {isNotesEditing ? (
              <textarea
                ref={notesInputRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => setIsNotesEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    setIsNotesEditing(false)
                  }
                }}
                placeholder="+ Add instructions for the AI about this contract"
                className="w-full resize-none bg-transparent text-center text-[14px] leading-[1.5] text-brand-navy outline-none placeholder:text-brand-mist"
                style={{ minHeight: '63px', maxHeight: '63px', overflowY: 'auto' }}
                rows={3}
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsNotesEditing(true)
                  setTimeout(() => notesInputRef.current?.focus(), 0)
                }}
                className="flex w-full flex-col items-center gap-1 text-[14px] transition-colors"
              >
                {notes ? (
                  <>
                    <span className="font-sans text-[11px] font-medium uppercase tracking-[0.04em] text-brand-fog">
                      Note:
                    </span>
                    <span className="text-brand-navy">{notes}</span>
                  </>
                ) : (
                  <span className="text-blue-700 hover:text-blue-500">
                    + Add instructions for the AI about this contract
                  </span>
                )}
              </button>
            )}
          </div>
        )}
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
