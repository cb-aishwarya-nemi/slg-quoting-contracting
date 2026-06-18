import { CircleCheck, PackagePlus, MessageCircleMore } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  status?: 'ready' | 'attention' | 'ai-created'
  statusLabel?: string
  /** plays the gradient sweep + icon settle when a linked comment targets this section */
  isFlashing?: boolean
  /** minimal mode: hides the horizontal line and comment button */
  minimal?: boolean
  /** hide only the horizontal line (keep the comment button) */
  hideLine?: boolean
}

/**
 * Section title + status pill, a horizontal rule filling the remaining width,
 * and an "add comment" affordance at the far end.
 */
export function SectionHeader({ title, status, statusLabel, isFlashing, minimal = false, hideLine = false }: SectionHeaderProps) {
  return (
    <div className="relative flex items-center gap-3">
      {/* Gradient flash overlay — self-clipping + pointer-events-none, so it
          never shifts layout. Keyed so it re-triggers on every link click. */}
      {isFlashing && (
        <span className="title-sweep-overlay" aria-hidden="true">
          <span className="title-sweep-band" />
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          {title}
        </span>

        {status === 'ready' && <CircleCheck size={14} className="text-green-600" />}
        {status === 'ai-created' && <PackagePlus size={14} className="ai-gradient-text" />}

        {statusLabel && (
          <span
            className={cn(
              'text-[12px] font-medium',
              status === 'ai-created' ? 'ai-gradient-text' : 'text-green-600'
            )}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {!minimal && (
        <>
          {/* Spacer to push button to the right - shows line or invisible */}
          <div className={cn('flex-1', !hideLine && 'h-px bg-brand-navy')} />

          <button
            type="button"
            title="Add note"
            className={cn(
              'flex shrink-0 items-center gap-1.5 overflow-hidden rounded px-1.5 py-1 text-blue-700 transition-all hover:bg-blue-50',
              isFlashing && 'icon-settle'
            )}
          >
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[12px] font-medium opacity-0 transition-all duration-200 group-hover/section:max-w-[56px] group-hover/section:opacity-100">
              Add note
            </span>
            <MessageCircleMore size={15} />
          </button>
        </>
      )}
    </div>
  )
}

export default SectionHeader
