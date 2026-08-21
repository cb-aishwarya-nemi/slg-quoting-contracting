import type { ReactNode } from 'react'
import { MessageCircleMore, PackagePlus, Plus } from 'lucide-react'
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
  /** extra status after the main label, e.g. Created customer */
  extraStatus?: { icon: ReactNode; label: string }
  /** whether this section's comment stack is on screen — drives the bubble's filled state */
  commentsVisible?: boolean
  /** makes the bubble a toggle for this section's comment stack */
  onToggleComments?: () => void
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
  extraStatus,
  commentsVisible = true,
  onToggleComments,
}: SectionHeaderProps) {
  const hasComments = commentCount !== undefined && commentCount > 0
  const commentLabel = hasComments
    ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`
    : 'Add a comment'

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

        {status === 'ai-created' && <PackagePlus size={14} className="ai-gradient-text" />}

        {statusLabel && status === 'attention' ? (
          <span className="inline-flex items-center gap-1">
            <AttentionFlagIcon id={title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()} />
            <span className="text-[12px] font-medium ai-gradient-text">{statusLabel}</span>
          </span>
        ) : statusLabel && status !== 'ready' ? (
          <span
            className={cn(
              'text-[12px] font-medium',
              status === 'ai-created' ? 'ai-gradient-text' : 'text-green-600'
            )}
          >
            {statusLabel}
          </span>
        ) : null}

        {extraStatus ? (
          <>
            <span className="h-3 w-px shrink-0 bg-brand-mist" aria-hidden />
            <span className="inline-flex items-center gap-1">
              <span className="text-brand-navy">{extraStatus.icon}</span>
              <span className="text-[12px] font-medium ai-gradient-text">{extraStatus.label}</span>
            </span>
          </>
        ) : null}
      </div>

      {!minimal && (
        <>
          {/* Spacer / line */}
          <div className={cn('flex-1', !hideLine && 'h-px bg-brand-navy')} />

          {/* Optional trailing action */}
          {trailing && <div className="shrink-0">{trailing}</div>}

          {/* Item-pinned mode wires a toggle and gets the interactive bubble. */}
          {onToggleComments ? (
            <button
              type="button"
              onClick={onToggleComments}
              className="relative inline-flex shrink-0 cursor-pointer rounded-lg p-1 text-blue-700 outline-none ring-0 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:outline-none"
              aria-label={commentLabel}
              aria-pressed={commentsVisible}
              title={
                hasComments
                  ? commentsVisible
                    ? 'Hide comments'
                    : 'Show comments'
                  : 'Add a comment'
              }
            >
              {/* On = solid bubble with knocked-out dots; off = plain outline. */}
              <MessageCircleMore
                size={18}
                strokeWidth={2}
                aria-hidden
                className={cn(
                  'text-current',
                  commentsVisible &&
                    '[&>path:first-child]:fill-current [&>path:not(:first-child)]:stroke-white'
                )}
              />
              <span
                aria-hidden
                className={cn(
                  'absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none',
                  commentsVisible
                    ? 'border border-blue-700 bg-white text-blue-700'
                    : 'bg-blue-700 text-white'
                )}
              >
                {hasComments ? commentCount : <Plus size={8} strokeWidth={3} />}
              </span>
            </button>
          ) : hasComments ? (
            /* Other use cases keep the original comment-count pill. */
            <span className="flex items-center gap-1 rounded-full border border-brand-navy px-2 py-0.5 text-[11px] font-medium text-brand-navy">
              {commentLabel}
            </span>
          ) : null}
        </>
      )}
    </div>
  )
}

export default SectionHeader
