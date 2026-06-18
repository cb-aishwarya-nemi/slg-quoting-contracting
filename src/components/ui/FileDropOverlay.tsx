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
      className="fixed inset-0 z-50 flex items-end justify-center"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Backdrop without blur - just overlay */}
      <div className="absolute inset-0 bg-white/40" />
      
      {/* Drop zone - positioned 64px from bottom, wider and taller */}
      <div
        className={cn(
          "relative z-10 mb-16 flex flex-col items-center justify-center",
          "w-3/5 h-[512px] rounded-2xl border-4 border-solid border-blue-600 bg-blue-50 p-12",
          "transition-all duration-200"
        )}
      >
        {/* Upload icon with animation */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Upload className="h-8 w-8 text-blue-700 animate-bounce" />
        </div>
        
        {/* Text - title now in blue */}
        <h3 className="mb-2 text-lg font-semibold text-blue-600">
          Drop contracts to process
        </h3>
        <p className="text-center text-sm text-brand-fog max-w-md">
          Upload multiple files simultaneously. Apex AI will process them as a single contract package.
        </p>
        
        {/* Target indicator - new styling with brand-navy border, no shadow */}
        <div className="mt-6 flex items-center gap-2 rounded-full border border-brand-navy bg-white px-4 py-2 text-sm text-brand-navy">
          <span className="text-brand-fog">Upload to</span>
          <span className="font-medium">Contract Queue</span>
        </div>
      </div>
    </div>
  )
}
