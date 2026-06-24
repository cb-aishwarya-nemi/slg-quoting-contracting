import { useRef, useEffect, useState } from 'react'
import { Upload, Loader2, Sparkles } from 'lucide-react'
import { useFileDrop } from '../../context/FileDropContext'
import { cn } from '../../lib/utils'

export function FileDropOverlay() {
  const { isDragging, setIsDragging, addProcessingFile, processingFiles } = useFileDrop()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasEverDragged, setHasEverDragged] = useState(false)

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
      files.forEach((file) => addProcessingFile(file))
    }
  }

  const handlePillClick = () => {
    if (!isProcessing && !isDragging) {
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
            !isProcessing && !isDragging && 'cursor-pointer',
          )}
          onClick={handlePillClick}
        >
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
              'relative flex items-center whitespace-nowrap transition-all duration-300',
              isDragging ? 'opacity-0 py-2 px-4' : 'opacity-100 py-2 px-4',
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
