import { Upload } from 'lucide-react'
import { useFileDrop } from '../../context/FileDropContext'
import { cn } from '../../lib/utils'

export function FileDropOverlay() {
  const { isDragging, setIsDragging, addProcessingFile } = useFileDrop()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only trigger if leaving the overlay itself
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
      files.forEach(file => {
        addProcessingFile(file)
      })
    }
  }

  if (!isDragging) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      
      {/* Drop zone */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center justify-center",
          "w-[480px] rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/80 p-12",
          "transition-all duration-200"
        )}
      >
        {/* Upload icon with animation */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Upload className="h-8 w-8 text-blue-700 animate-bounce" />
        </div>
        
        {/* Text */}
        <h3 className="mb-2 text-lg font-semibold text-brand-navy">
          Drop files to upload
        </h3>
        <p className="text-center text-sm text-brand-fog">
          Drop contracts, quotes, or documents here to process them
        </p>
        
        {/* Target indicator */}
        <div className="mt-6 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-brand-navy shadow-sm">
          <span className="text-brand-fog">Upload to</span>
          <span className="font-medium">Contract Ingestion</span>
        </div>
      </div>
    </div>
  )
}
