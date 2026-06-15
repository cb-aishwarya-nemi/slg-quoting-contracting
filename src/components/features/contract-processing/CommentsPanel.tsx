import { MessageCircleMore, CornerDownLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from './GradientSparkle'
import { type Comment } from '@/data/contractProcessingMock'

function CommentCard({ comment }: { comment: Comment }) {
  return (
    <div>
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
}

export function CommentsPanel({ comments }: CommentsPanelProps) {
  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-2 text-[13px] font-medium text-blue-700 transition-colors hover:text-blue-800"
      >
        <MessageCircleMore size={16} />
        Add note
      </button>

      <div className="mt-6 flex flex-col gap-7">
        {comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  )
}

export default CommentsPanel
