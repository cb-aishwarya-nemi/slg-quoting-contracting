import { type SectionSource } from '@/data/contractProcessingMock'
import { PdfThumbnail } from './PdfThumbnail'

interface SectionSourceThumbnailsProps {
  sources: SectionSource[]
  onOpen: (index: number) => void
}

export function SectionSourceThumbnails({ sources, onOpen }: SectionSourceThumbnailsProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="mb-4 flex gap-2">
      {sources.map((source, index) => (
        <PdfThumbnail
          key={source.id}
          docName={source.docName}
          highlightId={source.highlightId}
          onClick={() => onOpen(index)}
        />
      ))}
    </div>
  )
}

export default SectionSourceThumbnails
