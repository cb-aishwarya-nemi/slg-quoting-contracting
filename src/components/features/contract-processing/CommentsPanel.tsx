import { useState, useRef, useEffect, useMemo } from 'react'
import { MessageCircleMore, CornerDownLeft, ChevronRight, ArrowRight, MoreHorizontal, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Comment } from '@/data/contractProcessingMock'
import { type SectionOffset } from '@/pages/Customer360Page'
import {
  useOptionalFieldEditHistory,
  commentMatchesViewEditsFocus,
} from '@/context/FieldEditHistoryContext'

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

function FieldEditCommentBody({
  fieldEdit,
  bodyClassName,
}: {
  fieldEdit: NonNullable<Comment['fieldEdit']>
  bodyClassName: string
}) {
  const sep = ' · '
  const sepIdx = fieldEdit.fieldLabel.lastIndexOf(sep)
  const fieldLabel =
    sepIdx >= 0 ? fieldEdit.fieldLabel.slice(sepIdx + sep.length) : fieldEdit.fieldLabel
  const hasPrevious =
    fieldEdit.previousValue.trim().length > 0 &&
    fieldEdit.previousValue.trim() !== '—' &&
    fieldEdit.previousValue.trim() !== '-'

  if (hasPrevious) {
    return (
      <p className={cn('leading-[1.5] text-brand-navy', bodyClassName)}>
        Updated {fieldLabel} from "{fieldEdit.previousValue}" to "{fieldEdit.newValue}"
      </p>
    )
  }

  return (
    <p className={cn('leading-[1.5] text-brand-navy', bodyClassName)}>
      Set {fieldLabel} to "{fieldEdit.newValue}"
    </p>
  )
}

function AddNoteTextarea({
  onSubmit,
  onCancel,
  linkedSection,
  onStatusChange,
  compact = false,
}: {
  onSubmit: (text: string, status: ContractStatus) => void
  onCancel: () => void
  linkedSection?: string
  onStatusChange?: (status: ContractStatus) => void
  compact?: boolean
}) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<ContractStatus>('In progress')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const defaultHeight = compact ? 100 : 220

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = `${defaultHeight}px`
    const scrollHeight = textarea.scrollHeight
    if (scrollHeight > defaultHeight) {
      textarea.style.height = Math.min(scrollHeight, 400) + 'px'
    }
  }, [value, defaultHeight])

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
    <div className="mt-0">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note… Use @ to mention"
          className="w-full resize-none rounded-lg border border-neutral-200 pl-3 pr-4 py-2 pb-7 text-[12px] text-brand-navy placeholder:text-brand-fog focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
          style={{ height: `${defaultHeight}px`, maxHeight: '400px', overflowY: 'auto' }}
        />
        {linkedSection && (
          <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-1.5">
            <CornerDownLeft size={11} className="text-brand-mist" />
            <span className="text-[10px] font-medium text-brand-fog">{linkedSection}</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-blue-500 transition-colors hover:text-blue-700"
          >
            {status}
            <ChevronDown size={12} />
          </button>
          {showStatusDropdown && (
            <div className="absolute bottom-full left-0 mb-1 w-[140px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg z-20">
              <button
                type="button"
                onClick={() => handleStatusSelect('In progress')}
                className={cn(
                  'flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-neutral-50',
                  status === 'In progress' ? 'font-semibold text-brand-navy' : 'text-brand-navy'
                )}
              >
                In progress
              </button>
              <button
                type="button"
                onClick={() => handleStatusSelect('Blocked')}
                className={cn(
                  'flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-neutral-50',
                  status === 'Blocked' ? 'font-semibold text-brand-navy' : 'text-brand-navy'
                )}
              >
                Blocked
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-brand-navy text-white transition-colors hover:bg-brand-soft disabled:opacity-40 disabled:cursor-not-allowed"
          title="Post comment"
        >
          <ArrowRight size={14} />
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
        className="flex w-full cursor-pointer items-center justify-center px-3 py-2 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Delete
      </button>
      <div className="mx-2 h-px bg-neutral-200" />
      <button
        type="button"
        onClick={onCancel}
        className="flex w-full cursor-pointer items-center justify-center px-3 py-2 text-[12px] font-medium text-brand-navy transition-colors hover:bg-neutral-50"
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
            className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-[12px] text-brand-navy transition-colors hover:bg-neutral-50"
          >
            Resolve
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-[12px] text-brand-navy transition-colors hover:bg-neutral-50"
          >
            Edit
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-[12px] text-red-600 transition-colors hover:bg-red-50"
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
  dense = false,
  isEntering = false,
  isFocusedEdit = false,
  isDimmed = false,
}: {
  comment: Comment & { status?: CommentStatus }
  isActive: boolean
  onJump?: (sectionId: string) => void
  onDelete?: (commentId: string) => void
  onResolve?: (commentId: string) => void
  commentStatus?: CommentStatus
  /** slightly larger body text (+1px) for full-width comment lists */
  dense?: boolean
  /** play entrance animation for newly added comments */
  isEntering?: boolean
  /** Soft focus ring when this comment matches View edits */
  isFocusedEdit?: boolean
  /** Soften non-matching comments while viewing edits */
  isDimmed?: boolean
}) {
  const bodyTextClass = dense ? 'text-[13px]' : 'text-[12px]'
  const isLinked = !!comment.linkedSectionId || !!comment.linkedSection
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
      onMouseEnter={undefined}
      onMouseLeave={undefined}
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
        'group relative rounded-lg px-2 py-2 transition-[background-color,opacity] duration-300 ease-out',
        isLinked && !isResolved && 'cursor-pointer hover:bg-neutral-50',
        isResolved && 'cursor-pointer opacity-60',
        isEntering && 'animate-comment-appear',
        isFocusedEdit && 'bg-amber-50 ring-1 ring-amber-200/80',
        isDimmed && 'opacity-35'
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

      {showMoreMenu && (
        <CommentMoreMenu
          onResolve={handleResolve}
          onEdit={() => setShowMoreMenu(false)}
          onDelete={() => {
            setShowMoreMenu(false)
            setShowDeleteConfirm(true)
          }}
          isResolved={isResolved}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmationPopover
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Body */}
      {isResolved && !isExpanded ? (
        <p
          className={cn('leading-[1.5] text-brand-navy line-through', bodyTextClass)}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {comment.body}
        </p>
      ) : comment.fieldEdit ? (
        <FieldEditCommentBody
          fieldEdit={comment.fieldEdit}
          bodyClassName={bodyTextClass}
        />
      ) : (
        <p className={cn('leading-[1.5] text-brand-navy', bodyTextClass)}>
          {bodyParts.map((part, idx) =>
            part.type === 'mention' ? (
              <span key={idx} className="font-medium text-blue-700">
                {part.content}
              </span>
            ) : (
              <span key={idx}>{part.content}</span>
            )
          )}
        </p>
      )}

      {/* Footer row: Name · time · line · ellipses */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className={cn(
            'shrink-0 text-[11px] font-bold',
            comment.isAI ? 'ai-gradient-text uppercase tracking-[0.02em]' : 'text-brand-navy'
          )}
        >
          {comment.isAI ? 'Apex AI' : comment.author}
        </span>
        <span className="shrink-0 text-[10px] text-brand-fog">
          {comment.timestamp}
        </span>
        <div className="h-px flex-1 bg-neutral-200" />
        {!comment.isAI && (onDelete || onResolve) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowMoreMenu(!showMoreMenu)
            }}
            className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-brand-fog opacity-0 transition-opacity hover:bg-neutral-100 hover:text-brand-navy group-hover:opacity-100"
            title="More options"
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── SectionCommentStack ──────────────────────────────────────────────────────
// Inline (relative-positioned) comment stack rendered next to each section.
// No pixel math – it scrolls naturally with the content column.

export interface SectionCommentStackProps {
  sectionId: string
  comments: Array<Comment & { status?: CommentStatus }>
  /** Human-readable section label for the note textarea hint */
  linkedSection?: string
  onAddNote: (text: string, status: ContractStatus) => void
  onDelete: (id: string) => void
  onResolve: (id: string) => void
}

export function SectionCommentStack({
  sectionId,
  comments,
  linkedSection,
  onAddNote,
  onDelete,
  onResolve,
}: SectionCommentStackProps) {
  const editHistory = useOptionalFieldEditHistory()
  const viewEditsFocus = editHistory?.viewEditsFocus ?? null
  const isViewingEdits = viewEditsFocus?.sectionId === sectionId

  const [isExpanded, setIsExpanded] = useState(false)
  const [isStackHovered, setIsStackHovered] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [enteringIds, setEnteringIds] = useState<Set<string>>(() => new Set())
  const stackRef = useRef<HTMLDivElement>(null)
  const knownIdsRef = useRef<Set<string> | null>(null)

  // Seed known IDs on first render so initial comments don't animate in
  if (knownIdsRef.current === null) {
    knownIdsRef.current = new Set(comments.map((c) => c.id))
  }

  const orderedComments = useMemo(() => {
    if (!isViewingEdits || !viewEditsFocus) return comments
    const matching: typeof comments = []
    const rest: typeof comments = []
    for (const comment of comments) {
      if (commentMatchesViewEditsFocus(comment, viewEditsFocus)) matching.push(comment)
      else rest.push(comment)
    }
    return [...matching, ...rest]
  }, [comments, isViewingEdits, viewEditsFocus])

  // Expand + focus when "View edits" is clicked for this section
  useEffect(() => {
    if (!isViewingEdits) return
    setIsExpanded(true)
    setShowAddNote(false)
    stackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [isViewingEdits, viewEditsFocus?.fieldLabel])

  // Collapse on outside click
  useEffect(() => {
    if (!isExpanded && !showAddNote && !isViewingEdits) return
    const handleClickOutside = (e: MouseEvent) => {
      if (stackRef.current && !stackRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
        setShowAddNote(false)
        setIsStackHovered(false)
        if (isViewingEdits) editHistory?.clearViewEditsFocus()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded, showAddNote, isViewingEdits, editHistory])

  // Animate newly added comments; collapse stack so the new top comment is visible
  useEffect(() => {
    const known = knownIdsRef.current!
    const currentIds = comments.map((c) => c.id)
    const newIds = currentIds.filter((id) => !known.has(id))
    if (newIds.length === 0) return

    // Bulk replace (e.g. switching contracts) — reseed without animating
    if (newIds.length > 1) {
      for (const id of newIds) known.add(id)
      return
    }

    for (const id of newIds) known.add(id)
    if (!isViewingEdits) setIsExpanded(false)
    setEnteringIds((prev) => {
      const next = new Set(prev)
      for (const id of newIds) next.add(id)
      return next
    })

    const timer = setTimeout(() => {
      setEnteringIds((prev) => {
        const next = new Set(prev)
        for (const id of newIds) next.delete(id)
        return next
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [comments, isViewingEdits])

  const commentCount = orderedComments.length
  const topComment = orderedComments[0]
  const hasStack = commentCount > 1
  const matchingCount = isViewingEdits
    ? orderedComments.filter((c) => commentMatchesViewEditsFocus(c, viewEditsFocus)).length
    : 0

  const renderCommentCard = (comment: Comment & { status?: CommentStatus }) => {
    const isMatch = commentMatchesViewEditsFocus(comment, viewEditsFocus)
    return (
      <CommentCard
        key={comment.id}
        comment={comment}
        commentStatus={comment.status}
        isActive={false}
        onDelete={onDelete}
        onResolve={onResolve}
        isEntering={enteringIds.has(comment.id)}
        isFocusedEdit={isViewingEdits && isMatch}
        isDimmed={isViewingEdits && !isMatch}
      />
    )
  }

  return (
    <div ref={stackRef} className="pt-0.5">
      {isViewingEdits && (
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-amber-800">
            {matchingCount > 0
              ? `${matchingCount} edit${matchingCount === 1 ? '' : 's'}`
              : 'No edit notes'}
          </span>
          <button
            type="button"
            onClick={() => editHistory?.clearViewEditsFocus()}
            className="cursor-pointer text-[11px] font-medium text-brand-fog transition-colors hover:text-brand-navy"
          >
            Done
          </button>
        </div>
      )}

      {/* Add note CTA – always visible at top */}
      <button
        type="button"
        onClick={() => setShowAddNote(!showAddNote)}
        className={cn(
          'mb-2 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium transition-colors',
          showAddNote
            ? 'bg-blue-50 text-blue-700'
            : 'text-blue-700 hover:bg-blue-50'
        )}
      >
        <MessageCircleMore size={14} />
        Add note
      </button>

      {/* Add note textarea – pushes content down when open */}
      {showAddNote && (
        <div className="mb-3 animate-comment-appear">
          <AddNoteTextarea
            onSubmit={(text, status) => {
              onAddNote(text, status)
              setShowAddNote(false)
            }}
            onCancel={() => setShowAddNote(false)}
            linkedSection={linkedSection}
            compact
          />
        </div>
      )}

      {/* Comment stack */}
      {commentCount > 0 && (
        <>
          {isExpanded || isViewingEdits ? (
            // Expanded: all comments with internal scroll capped at ~320px
            <div className="relative">
              <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1">
                {orderedComments.map((comment) => renderCommentCard(comment))}
              </div>
              {/* Fade at bottom */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
            </div>
          ) : (
            // Collapsed: top comment + 3 peek lines for stack depth cue
            <div
              role={hasStack ? 'button' : undefined}
              tabIndex={hasStack ? 0 : undefined}
              onClick={() => {
                if (hasStack) {
                  setIsExpanded(true)
                  setIsStackHovered(false)
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && hasStack) {
                  e.preventDefault()
                  setIsExpanded(true)
                  setIsStackHovered(false)
                }
              }}
              onMouseEnter={() => setIsStackHovered(true)}
              onMouseLeave={() => setIsStackHovered(false)}
              className={cn('relative', hasStack && 'cursor-pointer')}
            >
              {topComment && renderCommentCard(topComment)}

              {/* Stack indicator: label always visible, lines cascade on hover */}
              {hasStack && (
                <div className="mt-1.5 flex flex-col items-center gap-1">
                  {/* Label - always visible in blue */}
                  <div className="text-[11px] font-medium text-blue-700">
                    +{commentCount - 1} {commentCount - 1 === 1 ? 'comment' : 'comments'}
                  </div>
                  {/* Lines - cascade in on hover */}
                  <div
                    className={cn(
                      'h-px w-[35%] rounded-full bg-blue-500 transition-all duration-150 ease-out',
                      isStackHovered
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 -translate-y-1'
                    )}
                  />
                  <div
                    className={cn(
                      'h-px w-[20%] rounded-full bg-blue-500 transition-all duration-150 ease-out delay-[50ms]',
                      isStackHovered
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 -translate-y-1'
                    )}
                  />
                  <div
                    className={cn(
                      'h-px w-[8%] rounded-full bg-blue-500 transition-all duration-150 ease-out delay-100',
                      isStackHovered
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 -translate-y-1'
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── CommentsPanel ────────────────────────────────────────────────────────────
// Legacy full-panel component (kept for backward compatibility).
// New code should use SectionCommentStack directly next to each section.

interface CommentsPanelProps {
  comments: Comment[]
  activeSectionId?: string
  onCommentJump?: (sectionId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  linkedSection?: string
  linkedSectionId?: string
  onStatusChange?: (status: ContractStatus) => void
  showAddNote?: boolean
  onShowAddNoteChange?: (show: boolean) => void
  onClearLinkedSection?: () => void
  /** suppress the built-in "Add note" + collapse header row */
  hideHeader?: boolean
  /** tighter comment stack with +1px body text */
  dense?: boolean
  /** @deprecated No longer needed — comments are rendered inline */
  sectionOffsets?: Record<string, SectionOffset>
  /** @deprecated No longer needed — comments are rendered inline */
  centerScrollTop?: number
}

export function CommentsPanel({
  comments,
  activeSectionId,
  onCommentJump,
  isCollapsed = false,
  onToggleCollapse,
  linkedSection,
  linkedSectionId,
  onStatusChange,
  showAddNote: externalShowAddNote,
  onShowAddNoteChange,
  onClearLinkedSection,
  hideHeader = false,
  dense = false,
}: CommentsPanelProps) {
  const [internalShowAddNote, setInternalShowAddNote] = useState(false)
  const [localComments, setLocalComments] = useState<Array<Comment & { status?: CommentStatus }>>(
    () => comments.map((c) => ({ ...c, status: 'open' as CommentStatus }))
  )

  const showAddNote = externalShowAddNote !== undefined ? externalShowAddNote : internalShowAddNote
  const setShowAddNote = (show: boolean) => {
    if (onShowAddNoteChange) onShowAddNoteChange(show)
    else setInternalShowAddNote(show)
  }

  useEffect(() => {
    setLocalComments(comments.map((c) => ({ ...c, status: 'open' as CommentStatus })))
  }, [comments])

  const commentsBySection = useMemo(() => {
    const grouped: Record<string, Array<Comment & { status?: CommentStatus }>> = {}
    const unlinked: Array<Comment & { status?: CommentStatus }> = []
    for (const comment of localComments) {
      if (comment.linkedSectionId) {
        if (!grouped[comment.linkedSectionId]) grouped[comment.linkedSectionId] = []
        grouped[comment.linkedSectionId].push(comment)
      } else {
        unlinked.push(comment)
      }
    }
    return { grouped, unlinked }
  }, [localComments])

  const handleAddNote = (text: string, status: ContractStatus) => {
    const newComment: Comment & { status: CommentStatus } = {
      id: `c-${Date.now()}`,
      author: 'Adrian Brody',
      initials: 'AB',
      timestamp: 'Just now',
      body: text,
      status: 'open',
      ...(linkedSection && { linkedSection }),
      ...(linkedSectionId && { linkedSectionId }),
    }
    setLocalComments([newComment, ...localComments])
    setShowAddNote(false)
    if (onStatusChange) onStatusChange(status)
    if (onClearLinkedSection) onClearLinkedSection()
  }

  const handleDeleteComment = (commentId: string) => {
    setLocalComments(localComments.filter((c) => c.id !== commentId))
  }

  const handleResolveComment = (commentId: string) => {
    setLocalComments(
      localComments.map((c) =>
        c.id === commentId
          ? { ...c, status: c.status === 'resolved' ? 'open' : ('resolved' as CommentStatus) }
          : c
      )
    )
  }

  if (isCollapsed) {
    return (
      <div className="flex justify-center pt-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
          title="Expand comments"
        >
          <MessageCircleMore size={20} />
          <span className="absolute right-1 top-1 flex h-3 w-3 items-center justify-center">
            <span className="absolute h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={cn(!hideHeader && 'pl-2')}>
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAddNote(!showAddNote)}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-[13px] font-medium transition-colors',
              showAddNote ? 'bg-blue-50 text-blue-700' : 'text-blue-700 hover:bg-blue-50'
            )}
          >
            <MessageCircleMore size={16} />
            Add note
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-brand-navy transition-colors hover:bg-neutral-100"
            title="Collapse comments"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showAddNote && (
        <div className={cn(hideHeader ? 'mb-4' : 'mt-3')}>
          <AddNoteTextarea
            onSubmit={handleAddNote}
            onCancel={() => {
              setShowAddNote(false)
              if (onClearLinkedSection) onClearLinkedSection()
            }}
            linkedSection={linkedSection}
            onStatusChange={onStatusChange}
          />
        </div>
      )}

      <div className={cn('flex flex-col', hideHeader ? 'mt-0' : 'mt-5', dense ? 'gap-3' : 'gap-5')}>
        {localComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            commentStatus={comment.status}
            isActive={!!comment.linkedSectionId && comment.linkedSectionId === activeSectionId}
            onJump={onCommentJump}
            onDelete={handleDeleteComment}
            onResolve={handleResolveComment}
            dense={dense}
          />
        ))}
        {commentsBySection.unlinked.length > 0 && commentsBySection.unlinked.length !== localComments.length && (
          <div className="mt-4 border-t border-neutral-200 pt-4">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
              General notes
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentsPanel
