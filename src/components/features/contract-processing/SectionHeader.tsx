import { CircleCheck, PackagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  status?: 'ready' | 'attention' | 'ai-created'
  statusLabel?: string
  /** plays the gradient sweep + icon settle when a linked comment targets this section */
  isFlashing?: boolean
  /** minimal mode: hides the horizontal line and comment count */
  minimal?: boolean
  /** hide only the horizontal line (keep the comment count) */
  hideLine?: boolean
  /** number of comments linked to this section */
  commentCount?: number
}

/**
 * Section title + status pill, a horizontal rule filling the remaining width,
 * and a comment count pill at the far end.
 */
export function SectionHeader({ 
  title, 
  status, 
  statusLabel, 
  isFlashing, 
  minimal = false, 
  hideLine = false,
  commentCount,
}: SectionHeaderProps) {
  const hasComments = commentCount !== undefined && commentCount > 0

  return (
    <div className="relative flex items-center gap-3">
      {/* Gradient flash overlay */}
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
          {/* Spacer / line */}
          <div className={cn('flex-1', !hideLine && 'h-px bg-brand-navy')} />

          {/* Comment count pill */}
          {hasComments && (
            <span className="flex items-center gap-1 rounded-full bg-brand-navy px-2 py-0.5 text-[11px] font-medium text-white">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </>
      )}
    </div>
  )
}

export default SectionHeader
