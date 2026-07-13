import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOptionalFieldEditHistory } from '@/context/FieldEditHistoryContext'

function formatDownstreamUpdatedAt(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSec < 1) return 'Updated just now'
  if (diffSec < 60) return `Updated ${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `Updated ${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Updated ${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `Updated ${diffDay}d ago`
}

interface DownstreamRefreshIndicatorProps {
  label: string
}

export function DownstreamRefreshIndicator({ label }: DownstreamRefreshIndicatorProps) {
  const editHistory = useOptionalFieldEditHistory()
  const isAnimating = editHistory?.isDownstreamRefreshing ?? false
  const updatedAt = editHistory?.downstreamUpdatedAt ?? null
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!updatedAt || isAnimating) return
    const id = setInterval(() => setTick((tick) => tick + 1), 1000)
    return () => clearInterval(id)
  }, [updatedAt, isAnimating])

  const updatedLabel =
    updatedAt && !isAnimating ? formatDownstreamUpdatedAt(updatedAt) : null

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => editHistory?.refreshDownstream()}
        className="flex cursor-pointer items-center justify-center text-brand-mist transition-colors hover:text-brand-fog"
        aria-label={`Refresh ${label}`}
      >
        <RefreshCw
          size={14}
          strokeWidth={2}
          className={cn(isAnimating && 'animate-spin')}
        />
      </button>
      {updatedLabel && (
        <span className="text-[11px] font-medium text-brand-mist">{updatedLabel}</span>
      )}
    </span>
  )
}

export default DownstreamRefreshIndicator
