import { cn } from '@/lib/utils'

interface PdfThumbnailProps {
  docName: string
  highlightId: string
  isActive?: boolean
  onClick?: () => void
}

const THUMB_WIDTH = 48
const THUMB_HEIGHT = 68
const IFRAME_WIDTH = 816
const SCALE = THUMB_WIDTH / IFRAME_WIDTH

export function PdfThumbnail({ docName, highlightId, isActive, onClick }: PdfThumbnailProps) {
  const src = `/pdf-viewer.html?doc=${encodeURIComponent(docName)}&highlight=${encodeURIComponent(highlightId)}&thumb=1`

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-md border transition-colors',
        isActive
          ? 'border-brand-navy'
          : 'border-neutral-200 hover:border-brand-navy'
      )}
      style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
    >
      <iframe
        src={src}
        title="PDF page preview"
        className="pointer-events-none"
        style={{
          width: IFRAME_WIDTH,
          height: IFRAME_WIDTH * (THUMB_HEIGHT / THUMB_WIDTH),
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          border: 'none',
        }}
      />
    </button>
  )
}

export default PdfThumbnail
