import {
  ChevronsUpDown,
  Search,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useFileDrop, type ProcessingFile } from '../../context/FileDropContext'
import { useNavigation } from '../../context/NavigationContext'
import { useTheme } from '../../context/ThemeContext'
import { NotificationPanel } from './NotificationPanel'

interface TopNavProps {
  environmentName?: string
  isLive?: boolean
}

function ProcessingBar({ files }: { files: ProcessingFile[] }) {
  const file = files[0]
  const { removeProcessingFile } = useFileDrop()

  if (!file) return null

  const isMulti = files.length > 1 || file.showInTaskTable
  const count = files.length
  const isComplete = file.status === 'complete'
  const isUploaded = file.status === 'uploaded'
  const isProcessing = file.status === 'processing'

  const handleDismiss = () => {
    files.forEach((f) => removeProcessingFile(f.id))
  }

  const successTitle = isMulti
    ? `${count} contracts processed successfully`
    : 'Contract processed successfully'

  return (
    <div
      className={cn(
        "fixed right-4 top-11 z-30 min-w-[420px] rounded-lg border-2 bg-white p-4",
        "animate-in slide-in-from-top-2 duration-300",
        "border-brand-navy"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-brand-navy">
                {isComplete
                  ? successTitle
                  : isProcessing
                  ? 'Processing contract...'
                  : isUploaded
                  ? 'Upload complete'
                  : 'Uploading contract...'}
              </h4>
              {!isMulti && (
                <p className="mt-0.5 max-w-[280px] truncate text-sm text-brand-fog">
                  {file.name}
                </p>
              )}
              {isComplete && !isMulti && (
                <p className="mt-1 text-[13px] text-brand-fog">
                  Opening customer linking…
                </p>
              )}
            </div>
            {isComplete && (
              <button
                type="button"
                onClick={handleDismiss}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-brand-fog hover:bg-neutral-100 hover:text-brand-navy"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {!isComplete && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-brand-navy">
                  {isProcessing
                    ? 'Extracting contract details'
                    : isUploaded
                    ? 'Queued for extraction'
                    : 'Uploading'}
                </span>
                <span className="text-brand-fog">
                  {isProcessing
                    ? 'AI processing'
                    : isUploaded
                    ? 'Waiting'
                    : `${Math.round(file.progress)}%`}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isProcessing ? "ai-gradient animate-pulse" : "bg-blue-700"
                  )}
                  style={{ width: isProcessing ? '100%' : `${file.progress}%` }}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export function TopNav({ environmentName = 'Echocorp.test.chargebee.com', isLive = true }: TopNavProps) {
  const { processingFiles } = useFileDrop()
  const { view } = useNavigation()
  const { isDark, toggleTheme } = useTheme()

  const multiBatch = processingFiles.filter((f) => f.showInTaskTable)
  const multiAllDone =
    multiBatch.length > 0 &&
    multiBatch.every((f) => f.status === 'complete')
  const multiCompleted = multiBatch.filter((f) => f.status === 'complete')

  const singleCompleted = processingFiles.filter(
    (f) => !f.showInTaskTable && f.status === 'complete'
  )

  const toastFiles = multiAllDone
    ? multiCompleted
    : singleCompleted.length > 0
      ? [singleCompleted[singleCompleted.length - 1]]
      : []

  const shouldShowProcessingBar =
    toastFiles.length > 0 &&
    (view.name === 'workbench' || view.name === 'allContracts')

  return (
    <>
      <header className="fixed left-12 right-0 top-0 z-30 flex h-10 items-center justify-between bg-white px-4">
        {/* Left section - Site selector */}
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              LIVE
            </span>
          )}
          <span className="max-w-[180px] truncate text-xs font-medium text-brand-navy">
            {environmentName}
          </span>
          <button
            type="button"
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-brand-navy transition-colors hover:bg-neutral-100"
            title="Switch site"
          >
            <ChevronsUpDown size={14} />
          </button>
        </div>

        {/* Center section - Search */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1 text-xs text-brand-navy transition-colors hover:bg-neutral-100">
            <Search size={14} />
            <span>Search for quotes, customers or invoices...</span>
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-0.5">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {/* User Avatar */}
          <button
            type="button"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-orange-100 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200"
            title="Account"
          >
            A
          </button>
        </div>
      </header>

      {shouldShowProcessingBar && <ProcessingBar files={toastFiles} />}
      
      <NotificationPanel />
    </>
  )
}
