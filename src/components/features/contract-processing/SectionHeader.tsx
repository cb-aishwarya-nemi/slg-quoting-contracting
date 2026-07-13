import type { ReactNode } from 'react'
import { CircleCheck, PackagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DownstreamRefreshIndicator } from './DownstreamRefreshIndicator'
import { AttentionFlagIcon } from './AttentionFlagIcon'

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
  /** optional action rendered at the far end, before the comment count */
  trailing?: ReactNode
  /** show a grey refresh icon beside the title */
  showRefreshIcon?: boolean
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
  trailing,
  showRefreshIcon = false,
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

        {showRefreshIcon && <DownstreamRefreshIndicator label={title} />}

        {status === 'ready' && <CircleCheck size={14} className="text-green-600" />}
        {status === 'ai-created' && <PackagePlus size={14} className="ai-gradient-text" />}

        {statusLabel && status === 'attention' ? (
          <span className="inline-flex items-center gap-1">
            <AttentionFlagIcon id={title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()} />
            <span className="text-[12px] font-medium ai-gradient-text">{statusLabel}</span>
          </span>
        ) : statusLabel ? (
          <span
            className={cn(
              'text-[12px] font-medium',
              status === 'ai-created' ? 'ai-gradient-text' : 'text-green-600'
            )}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>

      {!minimal && (
        <>
          {/* Spacer / line */}
          <div className={cn('flex-1', !hideLine && 'h-px bg-brand-navy')} />

          {/* Optional trailing action */}
          {trailing && <div className="shrink-0">{trailing}</div>}

          {/* Comment count pill */}
          {hasComments && (
            <span className="flex items-center gap-1 rounded-full border border-brand-navy px-2 py-0.5 text-[11px] font-medium text-brand-navy">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </>
      )}
    </div>
  )
}

export default SectionHeader
