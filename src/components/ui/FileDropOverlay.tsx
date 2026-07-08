import { useRef, useEffect, useState } from 'react'
import { Upload, Loader2, Sparkles, Send } from 'lucide-react'
import { useFileDrop } from '../../context/FileDropContext'
import { useNavigation } from '../../context/NavigationContext'
import { useUseCase } from '../../context/UseCaseContext'
import { GradientSparkle } from '../features/contract-processing/GradientSparkle'
import { cn } from '../../lib/utils'

function SalesOrderAskBar() {
  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleExpand = () => {
    setIsExpanded(true)
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    if (!query.trim()) {
      setIsExpanded(false)
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-auto rounded-full p-[1.5px] ai-gradient transition-all duration-300 ease-out',
        isExpanded ? 'w-[560px]' : 'w-[320px]'
      )}
    >
      <div
        className="flex cursor-text items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm"
        onClick={handleExpand}
      >
        <GradientSparkle size={12} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onBlur={handleBlur}
          placeholder="Ask about this sales order"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-brand-navy outline-none placeholder:text-brand-fog"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            'flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors',
            query.trim()
              ? 'bg-brand-navy text-white hover:bg-brand-soft'
              : 'text-brand-fog hover:bg-neutral-100 hover:text-brand-navy'
          )}
          aria-label="Send"
        >
          <Send size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export function FileDropOverlay() {
  const { isDragging, setIsDragging, addProcessingFile, processingFiles } = useFileDrop()
  const { goToWorkbench } = useNavigation()
  const { activePage } = useUseCase()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasEverDragged, setHasEverDragged] = useState(false)
  const isSalesOrderAskMode = activePage === 'sales-order-details'

  useEffect(() => {
    if (isDragging && !hasEverDragged) {
      setHasEverDragged(true)
    }
  }, [isDragging, hasEverDragged])

  const animationClass = !hasEverDragged
    ? ''
    : isDragging
      ? 'animate-pill-expand'
      : 'animate-pill-collapse'

  const activeFile = processingFiles.find(
    (f) => f.status === 'uploading' || f.status === 'processing',
  )
  const isUploading = activeFile?.status === 'uploading'
  const isAIProcessing = activeFile?.status === 'processing'
  const isProcessing = isUploading || isAIProcessing

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      goToWorkbench()
      files.forEach((file) => addProcessingFile(file))
    }
  }

  const handlePillClick = () => {
    if (isProcessing || isDragging) return
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      goToWorkbench()
      Array.from(files).forEach((file) => addProcessingFile(file))
      e.target.value = ''
    }
  }

  if (isSalesOrderAskMode) {
    return (
      <div className="fixed z-50 flex justify-center pointer-events-none inset-x-0 bottom-0 pb-6 pl-12">
        <SalesOrderAskBar />
      </div>
    )
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt"
        multiple
      />

      {/* Backdrop overlay — only when dragging */}
      <div
        className={cn(
          'fixed inset-0 z-40 transition-opacity duration-300',
          isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
      />

      {/* Unified pill/drop-zone container */}
      <div
        className={cn(
          'fixed z-50 flex justify-center pointer-events-none',
          'transition-all duration-300 ease-out',
          isDragging
            ? 'inset-x-0 bottom-0 pb-16 pl-12'
            : 'inset-x-0 bottom-0 pb-6 pl-12',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* The morphing element */}
        <div
          className={cn(
            'group relative overflow-hidden pointer-events-auto',
            animationClass,
            isDragging && 'border-4 border-brand-navy backdrop-blur-xl',
            !hasEverDragged && 'dynamic-pill',
            !isProcessing && !isDragging && 'cursor-pointer ink-drop-button',
          )}
          onClick={handlePillClick}
        >
          {/* Ink animation layers - only visible in pill state, not when expanded */}
          {!isDragging && (
            <>
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
            </>
          )}

          {/* Background layer */}
          <div
            className={cn(
              'absolute inset-0 transition-all duration-300 rounded-[inherit]',
              isDragging ? 'bg-white/70' : 'bg-[#1c1b2e]',
            )}
          />

          {/* AI gradient glow — only visible in pill state */}
          <div
            className={cn(
              'absolute bottom-0 right-0 h-[140%] w-24 transition-all duration-500 ease-out',
              isDragging
                ? 'opacity-0'
                : 'opacity-70 group-hover:-translate-x-2 group-hover:-translate-y-1',
            )}
            style={{
              background:
                'radial-gradient(ellipse at bottom right, rgba(109, 40, 217, 0.5) 0%, rgba(255, 51, 0, 0.22) 48%, transparent 72%)',
            }}
          />
          <div
            className={cn(
              'absolute bottom-0 right-4 h-full w-12 transition-all duration-700 ease-out',
              isDragging ? 'opacity-0' : 'opacity-50 group-hover:-translate-x-3',
            )}
            style={{
              background:
                'radial-gradient(ellipse at bottom center, rgba(255, 51, 0, 0.35) 0%, transparent 68%)',
            }}
          />

          {/* PILL CONTENT — visible when NOT dragging */}
          <div
            className={cn(
              'relative z-10 flex items-center whitespace-nowrap transition-all duration-300',
              isDragging ? 'opacity-0 py-1.5 px-4' : 'opacity-100 py-1.5 px-4',
            )}
          >
            {!isProcessing && (
              <>
                <Upload className="h-3.5 w-3.5 shrink-0 text-white transition-transform duration-200 group-hover:-translate-y-0.5" />
                <span className="ml-2 text-[13px] font-medium text-white">Drop a contract</span>
              </>
            )}

            {isUploading && activeFile && (
              <>
                <Loader2 className="h-3.5 w-3.5 shrink-0 text-white animate-spin" />
                <div className="ml-2.5 flex flex-col gap-1" style={{ width: '130px' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium leading-none text-white">Uploading</span>
                    <span className="text-[11px] leading-none text-white/60">
                      {Math.round(activeFile.progress)}%
                    </span>
                  </div>
                  <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-300"
                      style={{ width: `${activeFile.progress}%` }}
                    />
                  </div>
                </div>
              </>
            )}

            {isAIProcessing && (
              <>
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-white animate-pulse" />
                <div className="ml-2.5 flex flex-col gap-1" style={{ width: '130px' }}>
                  <span className="text-[11px] font-medium leading-none text-white">
                    Processing contract...
                  </span>
                  <div className="h-[2px] w-full overflow-hidden rounded-full ai-gradient animate-pulse" />
                </div>
              </>
            )}
          </div>

          {/* DROP ZONE CONTENT — visible when dragging */}
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center p-12 transition-opacity duration-200',
              isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-navy/10">
              <Upload className="h-8 w-8 text-brand-navy animate-bounce" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-brand-navy">
              Drop contracts to process
            </h3>
            <p className="text-center text-sm text-brand-fog max-w-md">
              Upload multiple files simultaneously. Apex AI will process them as a single contract
              package.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-full border border-brand-navy bg-white px-4 py-2 text-sm text-brand-navy">
              <span className="text-brand-fog">Upload to</span>
              <span className="font-medium">Contract Queue</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
