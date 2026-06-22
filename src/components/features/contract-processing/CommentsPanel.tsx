import { useState, useRef, useEffect } from 'react'
import { MessageCircleMore, CornerDownLeft, ChevronRight, ArrowUpLeft, ArrowRight, MoreHorizontal, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from './GradientSparkle'
import { type Comment } from '@/data/contractProcessingMock'

type CommentStatus = 'open' | 'resolved'
type ContractStatus = 'Blocked' | 'In progress'

// Parse comment body to highlight mentions
function parseCommentBody(text: string) {
  const parts: Array<{ type: 'text' | 'mention'; content: string }> = []
  const mentionRegex = /@(\w+(?:\s+\w+)?)/g
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'mention', content: match[0] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

function AddNoteTextarea({
  onSubmit,
  onCancel,
  linkedSection,
  onStatusChange,
}: {
  onSubmit: (text: string, status: ContractStatus) => void
  onCancel: () => void
  linkedSection?: string
  onStatusChange?: (status: ContractStatus) => void
}) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<ContractStatus>('In progress')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Auto-resize logic
    textarea.style.height = '220px' // Reset to initial
    const scrollHeight = textarea.scrollHeight
    if (scrollHeight > 220) {
      textarea.style.height = Math.min(scrollHeight, 400) + 'px'
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (value.trim()) {
        onSubmit(value, status)
      }
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value, status)
    }
  }

  const handleStatusSelect = (newStatus: ContractStatus) => {
    setStatus(newStatus)
    onStatusChange?.(newStatus)
    setShowStatusDropdown(false)
  }

  return (
    <div className="mt-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note... Use @ to mention users or Apex AI"
          className="w-full resize-none rounded-lg border border-neutral-200 pl-3 pr-4 py-2 pb-8 text-[13px] text-brand-navy placeholder:text-brand-fog focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
          style={{ height: '220px', maxHeight: '400px', overflowY: 'auto' }}
        />
        {/* Linked section tag inside textarea at bottom */}
        {linkedSection && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5">
            <CornerDownLeft size={12} className="text-brand-mist" />
            <span className="text-[11px] font-medium text-brand-fog">{linkedSection}</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        {/* Status dropdown on the left */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="flex items-center gap-1 text-[12px] font-medium text-blue-500 transition-colors hover:text-blue-700"
          >
            {status}
            <ChevronDown size={14} />
          </button>
          {showStatusDropdown && (
            <div className="absolute bottom-full left-0 mb-1 w-[140px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => handleStatusSelect('In progress')}
                className={cn(
                  'flex w-full items-center px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-neutral-50',
                  status === 'In progress' ? 'font-semibold text-brand-navy' : 'text-brand-navy'
                )}
              >
                In progress
              </button>
              <button
                type="button"
                onClick={() => handleStatusSelect('Blocked')}
                className={cn(
                  'flex w-full items-center px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-neutral-50',
                  status === 'Blocked' ? 'font-semibold text-brand-navy' : 'text-brand-navy'
                )}
              >
                Blocked
              </button>
            </div>
          )}
        </div>
        
        {/* Submit button on the right */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy text-white transition-colors hover:bg-brand-soft disabled:opacity-40 disabled:cursor-not-allowed"
          title="Post comment"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

function DeleteConfirmationPopover({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="absolute right-2 top-8 z-10 w-[120px] rounded-lg border border-neutral-200 bg-white py-1.5 shadow-lg">
      <button
        type="button"
        onClick={onConfirm}
        className="flex w-full items-center justify-center px-3 py-2 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Delete
      </button>
      <div className="mx-2 h-px bg-neutral-200" />
      <button
        type="button"
        onClick={onCancel}
        className="flex w-full items-center justify-center px-3 py-2 text-[12px] font-medium text-brand-navy transition-colors hover:bg-neutral-50"
      >
        Cancel
      </button>
    </div>
  )
}

function CommentMoreMenu({
  onResolve,
  onEdit,
  onDelete,
  isResolved,
}: {
  onResolve: () => void
  onEdit: () => void
  onDelete: () => void
  isResolved: boolean
}) {
  return (
    <div className="absolute right-2 top-8 z-10 w-[120px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
      {!isResolved && (
        <>
          <button
            type="button"
            onClick={onResolve}
            className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-brand-navy transition-colors hover:bg-neutral-50"
          >
            Resolve
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-brand-navy transition-colors hover:bg-neutral-50"
          >
            Edit
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-red-600 transition-colors hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  )
}

function CommentCard({
  comment,
  isActive,
  onJump,
  onDelete,
  onResolve,
  commentStatus = 'open',
}: {
  comment: Comment & { status?: CommentStatus }
  isActive: boolean
  onJump?: (sectionId: string) => void
  onDelete?: (commentId: string) => void
  onResolve?: (commentId: string) => void
  commentStatus?: CommentStatus
}) {
  const isLinked = !!comment.linkedSectionId || !!comment.linkedSection
  const [isHovered, setIsHovered] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const isResolved = commentStatus === 'resolved'
  const commentRef = useRef<HTMLDivElement>(null)

  const handleClick = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (isResolved) {
      e?.stopPropagation()
      setIsExpanded(!isExpanded)
      return
    }
    if (isLinked && comment.linkedSectionId) {
      onJump?.(comment.linkedSectionId)
    }
  }

  const handleDelete = () => {
    onDelete?.(comment.id)
    setShowDeleteConfirm(false)
    setShowMoreMenu(false)
  }

  const handleResolve = () => {
    onResolve?.(comment.id)
    setShowMoreMenu(false)
  }

  const bodyParts = parseCommentBody(comment.body)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commentRef.current && !commentRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
        setShowDeleteConfirm(false)
        if (isResolved && isExpanded) {
          setIsExpanded(false)
        }
      }
    }
    if (showMoreMenu || showDeleteConfirm || (isResolved && isExpanded)) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreMenu, showDeleteConfirm, isResolved, isExpanded])

  return (
    <div
      ref={commentRef}
      role={isLinked || isResolved ? 'button' : undefined}
      tabIndex={isLinked || isResolved ? 0 : undefined}
      onClick={handleClick}
      onMouseEnter={isLinked && !isActive && !isResolved ? () => setIsHovered(true) : undefined}
      onMouseLeave={isLinked && !isActive && !isResolved ? () => setIsHovered(false) : undefined}
      onKeyDown={
        isLinked || isResolved
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick(e)
              }
            }
          : undefined
      }
      className={cn(
        'group relative rounded-lg px-2 py-2 transition-[background-color] duration-300 ease-out',
        isLinked && !isResolved && 'cursor-pointer hover:bg-neutral-50',
        isResolved && 'cursor-pointer opacity-60'
      )}
    >
      {/* Active-section accent */}
      {isLinked && !isResolved && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-brand-navy transition-opacity duration-300',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* More menu popover */}
      {showMoreMenu && (
        <CommentMoreMenu
          onResolve={handleResolve}
          onEdit={() => {
            setShowMoreMenu(false)
            // Edit functionality placeholder
          }}
          onDelete={() => {
            setShowMoreMenu(false)
            setShowDeleteConfirm(true)
          }}
          isResolved={isResolved}
        />
      )}

      {/* Delete confirmation popover */}
      {showDeleteConfirm && (
        <DeleteConfirmationPopover
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Author row */}
      <div className="flex items-center gap-2">
        {comment.isAI ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200">
            <GradientSparkle size={14} />
          </span>
        ) : (
          <span
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-200',
              isLinked && isHovered && !isActive && !isResolved
                ? 'bg-blue-100 text-blue-700'
                : 'bg-neutral-200 text-neutral-700'
            )}
          >
            {isLinked && isHovered && !isActive && !isResolved ? (
              <ArrowUpLeft size={14} />
            ) : (
              comment.initials
            )}
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
        <span className="text-[11px] text-brand-fog opacity-0 transition-opacity group-hover:opacity-100">
          {comment.timestamp}
        </span>
        
        {/* More menu button */}
        {!comment.isAI && (onDelete || onResolve) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowMoreMenu(!showMoreMenu)
            }}
            className="ml-auto flex h-5 w-5 items-center justify-center rounded text-brand-fog opacity-0 transition-opacity hover:bg-neutral-100 hover:text-brand-navy group-hover:opacity-100"
            title="More options"
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>

      {/* Body with mention highlighting and resolved state */}
      {isResolved && !isExpanded ? (
        <p 
          className="mt-2 text-[12px] leading-[1.5] text-brand-navy line-through"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {comment.body}
        </p>
      ) : (
        <p className="mt-2 text-[12px] leading-[1.5] text-brand-navy">
          {bodyParts.map((part, idx) => (
            part.type === 'mention' ? (
              <span key={idx} className="font-medium text-blue-700">{part.content}</span>
            ) : (
              <span key={idx}>{part.content}</span>
            )
          ))}
        </p>
      )}

      {/* Linked section tag - only visible when active */}
      {comment.linkedSection && !isResolved && (
        <div
          className={cn(
            "flex items-center gap-2 overflow-hidden transition-all duration-300 ease-out",
            isActive ? "mt-2.5 max-h-10 opacity-100" : "mt-0 max-h-0 opacity-0"
          )}
        >
          <CornerDownLeft size={14} className="text-brand-mist" />
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-brand-fog">
            {comment.linkedSection}
          </span>
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
  /** collapsed state */
  isCollapsed?: boolean
  /** toggle collapse */
  onToggleCollapse?: () => void
  /** linked section for new comment */
  linkedSection?: string
  /** callback when status changes */
  onStatusChange?: (status: ContractStatus) => void
  /** controlled show add note state */
  showAddNote?: boolean
  /** callback to change show add note state */
  onShowAddNoteChange?: (show: boolean) => void
  /** callback to clear linked section */
  onClearLinkedSection?: () => void
}

export function CommentsPanel({ 
  comments, 
  activeSectionId, 
  onCommentJump,
  isCollapsed = false,
  onToggleCollapse,
  linkedSection,
  onStatusChange,
  showAddNote: externalShowAddNote,
  onShowAddNoteChange,
  onClearLinkedSection,
}: CommentsPanelProps) {
  const [internalShowAddNote, setInternalShowAddNote] = useState(false)
  const [localComments, setLocalComments] = useState<Array<Comment & { status?: CommentStatus }>>(comments)

  // Use external control if provided, otherwise internal state
  const showAddNote = externalShowAddNote !== undefined ? externalShowAddNote : internalShowAddNote
  const setShowAddNote = (show: boolean) => {
    if (onShowAddNoteChange) {
      onShowAddNoteChange(show)
    } else {
      setInternalShowAddNote(show)
    }
  }

  // Update local comments when prop changes
  useEffect(() => {
    setLocalComments(comments.map(c => ({ ...c, status: 'open' as CommentStatus })))
  }, [comments])

  const handleAddNote = (text: string, status: ContractStatus) => {
    const newComment: Comment & { status: CommentStatus } = {
      id: `c-${Date.now()}`,
      author: 'Adrian Brody',
      initials: 'AB',
      timestamp: 'Just now',
      body: text,
      status: 'open',
      ...(linkedSection && { linkedSection }),
    }
    setLocalComments([newComment, ...localComments])
    setShowAddNote(false)
    
    // Notify parent of status change
    if (onStatusChange) {
      onStatusChange(status)
    }
    
    // Clear linked section after posting
    if (onClearLinkedSection) {
      onClearLinkedSection()
    }
  }

  const handleDeleteComment = (commentId: string) => {
    setLocalComments(localComments.filter(c => c.id !== commentId))
  }

  const handleResolveComment = (commentId: string) => {
    setLocalComments(localComments.map(c => 
      c.id === commentId 
        ? { ...c, status: c.status === 'resolved' ? 'open' : 'resolved' as CommentStatus }
        : c
    ))
  }

  const handleCancelAddNote = () => {
    setShowAddNote(false)
    if (onClearLinkedSection) {
      onClearLinkedSection()
    }
  }

  // Collapsed state - just show icon with notification dot
  if (isCollapsed) {
    return (
      <div className="flex justify-center pt-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
          title="Expand comments"
        >
          <MessageCircleMore size={20} />
          {/* Notification dot */}
          <span className="absolute right-1 top-1 flex h-3 w-3 items-center justify-center">
            <span className="absolute h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </span>
        </button>
      </div>
    )
  }

  // Expanded state - normal comments panel
  return (
    <div className="pl-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowAddNote(!showAddNote)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] font-medium transition-colors",
            showAddNote
              ? "bg-blue-50 text-blue-700"
              : "text-blue-700 hover:bg-blue-50"
          )}
        >
          <MessageCircleMore size={16} />
          Add note
        </button>
        
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-6 w-6 items-center justify-center rounded text-brand-navy transition-colors hover:bg-neutral-100"
          title="Collapse comments"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Add note textarea */}
      {showAddNote && (
        <AddNoteTextarea
          onSubmit={handleAddNote}
          onCancel={handleCancelAddNote}
          linkedSection={linkedSection}
          onStatusChange={onStatusChange}
        />
      )}

      <div className="mt-5 flex flex-col gap-5">
        {localComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            commentStatus={comment.status}
            isActive={!!comment.linkedSectionId && comment.linkedSectionId === activeSectionId}
            onJump={onCommentJump}
            onDelete={handleDeleteComment}
            onResolve={handleResolveComment}
          />
        ))}
      </div>
    </div>
  )
}

export default CommentsPanel
