import { MessageCircleMore, CornerDownLeft, ArrowRight, ArrowUpLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from './GradientSparkle'
import { type Comment } from '@/data/contractProcessingMock'

function CommentCard({
  comment,
  isActive,
  onJump,
}: {
  comment: Comment
  isActive: boolean
  onJump?: (sectionId: string) => void
}) {
  const isLinked = !!comment.linkedSectionId

  const handleClick = () => {
    if (isLinked && comment.linkedSectionId) onJump?.(comment.linkedSectionId)
  }

  return (
    <div
      role={isLinked ? 'button' : undefined}
      tabIndex={isLinked ? 0 : undefined}
      onClick={isLinked ? handleClick : undefined}
      onKeyDown={
        isLinked
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick()
              }
            }
          : undefined
      }
      className={cn(
        // px-2 + the panel's pl-2 gutter give the peek room to move left without
        // ever leaving the panel box — keeps grid width perfectly stable.
        'group relative rounded-lg px-2 py-2 transition-[transform,background-color] duration-300 ease-out',
        isLinked && 'cursor-pointer hover:bg-neutral-50',
        isActive && '-translate-x-2 bg-blue-50/60'
      )}
    >
      {/* Active-section accent — absolutely positioned so it never shifts layout */}
      {isLinked && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blue-400 transition-opacity duration-300',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* Hover affordance — signals the whole card jumps to its section */}
      {isLinked && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-white text-blue-600 opacity-0 shadow-sm ring-1 ring-blue-100 transition-opacity duration-200 group-hover:opacity-100"
          title="Go to section"
        >
          <ArrowUpLeft size={13} />
        </span>
      )}

      {/* Author row */}
      <div className="flex items-center gap-2">
        {comment.isAI ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200">
            <GradientSparkle size={14} />
          </span>
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[11px] font-semibold text-white">
            {comment.initials}
          </span>
        )}

        <span
          className={cn(
            'text-[13px] font-semibold',
            comment.isAI ? 'ai-gradient-text uppercase tracking-[0.02em]' : 'text-brand-navy'
          )}
        >
          {comment.isAI ? 'Apex AI' : comment.author}
        </span>
        <span className="text-[11px] text-brand-fog">{comment.timestamp}</span>
      </div>

      {/* Body */}
      <p className="mt-2 text-[12px] leading-[1.5] text-brand-navy">{comment.body}</p>

      {/* Linked section tag */}
      {comment.linkedSection && (
        <div className="mt-2.5 flex items-center gap-2">
          <CornerDownLeft size={14} className="text-brand-mist" />
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-brand-fog">
            {comment.linkedSection}
          </span>
        </div>
      )}

      {/* Actions */}
      {comment.actions && (
        <div className="mt-2.5 flex items-center gap-4">
          {comment.actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'inline-flex items-center gap-1 text-[12px] font-medium transition-colors',
                action.primary ? 'text-blue-700 hover:text-blue-800' : 'text-brand-navy hover:text-brand-fog'
              )}
            >
              {action.label}
              <ArrowRight size={13} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentsPanelProps {
  comments: Comment[]
  /** in-page section currently nearest the top of the scroll area */
  activeSectionId?: string
  /** scroll the doc to a comment's linked section */
  onCommentJump?: (sectionId: string) => void
}

export function CommentsPanel({ comments, activeSectionId, onCommentJump }: CommentsPanelProps) {
  return (
    <div className="pl-2">
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
      >
        <MessageCircleMore size={16} />
        Add note
      </button>

      <div className="mt-5 flex flex-col gap-5">
        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            isActive={!!comment.linkedSectionId && comment.linkedSectionId === activeSectionId}
            onJump={onCommentJump}
          />
        ))}
      </div>
    </div>
  )
}

export default CommentsPanel
