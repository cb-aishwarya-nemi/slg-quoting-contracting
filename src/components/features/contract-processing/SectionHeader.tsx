import { CircleCheck, OctagonAlert, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  status?: 'ready' | 'attention'
  statusLabel?: string
}

/**
 * Section title + status pill, a horizontal rule filling the remaining width,
 * and an "add comment" affordance at the far end.
 */
export function SectionHeader({ title, status, statusLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          {title}
        </span>

        {status === 'ready' && <CircleCheck size={14} className="text-green-600" />}
        {status === 'attention' && <OctagonAlert size={14} className="text-red-600" />}

        {statusLabel && (
          <span
            className={cn(
              'text-[12px] font-medium',
              status === 'attention' ? 'text-red-600' : 'text-green-600'
            )}
          >
            {statusLabel}
          </span>
        )}
      </div>

      <div className="h-px flex-1 bg-brand-navy" />

      <button
        type="button"
        title="Add comment"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-blue-700 transition-colors hover:bg-blue-50"
      >
        <MessageSquare size={15} />
      </button>
    </div>
  )
}

export default SectionHeader
