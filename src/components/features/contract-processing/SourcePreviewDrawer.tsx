import { useEffect, useCallback } from 'react'
import { X, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type SectionSource } from '@/data/contractProcessingMock'
import { PdfThumbnail } from './PdfThumbnail'

interface SourcePreviewDrawerProps {
  open: boolean
  sources: SectionSource[]
  activeIndex: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function SourcePreviewDrawer({
  open,
  sources,
  activeIndex,
  onIndexChange,
  onClose,
}: SourcePreviewDrawerProps) {
  const activeSource = sources[activeIndex]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        onIndexChange(activeIndex - 1)
      } else if (e.key === 'ArrowRight' && activeIndex < sources.length - 1) {
        onIndexChange(activeIndex + 1)
      }
    },
    [open, activeIndex, sources.length, onIndexChange, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open || !activeSource) return null

  const openSourceDocument = () => {
    window.open(
      `/pdf-viewer.html?doc=${encodeURIComponent(activeSource.docName)}`,
      `pdf-${activeSource.id}`,
      'popup,width=680,height=800'
    )
  }

  const iframeSrc = `/pdf-viewer.html?doc=${encodeURIComponent(activeSource.docName)}&highlight=${encodeURIComponent(activeSource.highlightId)}`

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-[560px] flex-col bg-white shadow-xl',
          'animate-in slide-in-from-right duration-200'
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
              title="Close"
            >
              <X size={18} />
            </button>
            <div>
              <div className="text-[13px] font-semibold text-brand-navy">
                {activeSource.caption}
              </div>
              <div className="text-[12px] text-brand-fog">
                {activeSource.docName} · {activeSource.pageLabel}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openSourceDocument}
            className="flex items-center gap-1.5 text-[13px] text-blue-700 transition-colors hover:underline"
          >
            <span>Open source document</span>
            <ArrowUpRight size={14} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden bg-neutral-100 p-4">
          <iframe
            key={activeSource.id}
            src={iframeSrc}
            title="PDF page preview"
            className="h-full w-full rounded-lg border border-neutral-200 bg-white"
          />
        </div>

        {sources.length > 1 && (
          <footer className="flex shrink-0 items-center justify-between border-t border-neutral-200 px-5 py-3">
            <button
              type="button"
              onClick={() => onIndexChange(activeIndex - 1)}
              disabled={activeIndex === 0}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                activeIndex === 0
                  ? 'cursor-not-allowed text-neutral-300'
                  : 'text-brand-fog hover:bg-neutral-100 hover:text-brand-navy'
              )}
              title="Previous"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              {sources.map((source, index) => (
                <PdfThumbnail
                  key={source.id}
                  docName={source.docName}
                  highlightId={source.highlightId}
                  isActive={index === activeIndex}
                  onClick={() => onIndexChange(index)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => onIndexChange(activeIndex + 1)}
              disabled={activeIndex === sources.length - 1}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                activeIndex === sources.length - 1
                  ? 'cursor-not-allowed text-neutral-300'
                  : 'text-brand-fog hover:bg-neutral-100 hover:text-brand-navy'
              )}
              title="Next"
            >
              <ChevronRight size={18} />
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}

export default SourcePreviewDrawer
