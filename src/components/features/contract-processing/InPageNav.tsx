import { useState } from 'react'
import { MessageCircleQuestionMark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageCircleInfoIcon } from './MessageCircleInfoIcon'

export interface NavSection {
  id: string
  label: string
  status: 'ai' | 'ready' | 'attention' | 'neutral'
  /** Open AI questions in this section — surfaced as an amber marker. */
  questionCount?: number
  /** Open AI notes in this section — surfaced as a grey marker. */
  infoCount?: number
}

interface InPageNavProps {
  sections: NavSection[]
  activeId: string
  onNavigate: (id: string) => void
}

const LINE_GAP = 8
const INACTIVE_WIDTH = 24
const ACTIVE_WIDTH = 32
const INACTIVE_HEIGHT = 1
const ACTIVE_HEIGHT = 2
const ROW_STRIDE = INACTIVE_HEIGHT + LINE_GAP

/**
 * Compact "lines" in-page nav. Renders one horizontal line per section
 * (24px → 32px on active/scroll-spy, 1px → 2px). Neutral lines go blue-700
 * when focused; question lines stay amber. Hovering the rail reveals a
 * popover with full section labels.
 */
export function InPageNav({ sections, activeId, onNavigate }: InPageNavProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const activeIndex = Math.max(
    0,
    sections.findIndex((s) => s.id === activeId)
  )
  const activeHasQuestions = (sections[activeIndex]?.questionCount ?? 0) > 0

  return (
    <div
      className="relative w-fit"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setHoveredId(null)
      }}
    >
      {/* Compact lines rail */}
      <nav
        className="relative flex flex-col pl-1 pt-1"
        style={{ gap: LINE_GAP }}
        aria-label="Section navigation"
      >
        {/* Sliding active indicator — animates vertically as scroll-spy updates */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-1 rounded-full',
            activeHasQuestions ? 'bg-amber-600' : 'bg-blue-700'
          )}
          style={{
            top: 4 + activeIndex * ROW_STRIDE - (ACTIVE_HEIGHT - INACTIVE_HEIGHT) / 2,
            width: ACTIVE_WIDTH,
            height: ACTIVE_HEIGHT,
            transition:
              'top 520ms cubic-bezier(0.4, 0, 0.2, 1), width 320ms cubic-bezier(0.4, 0, 0.2, 1), background-color 320ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {sections.map((section) => {
          const isActive = section.id === activeId
          const questionCount = section.questionCount ?? 0
          const infoCount = section.infoCount ?? 0
          const needsAttention = questionCount > 0 || infoCount > 0
          const attentionLabel = [
            questionCount > 0 && `${questionCount} question${questionCount === 1 ? '' : 's'}`,
            infoCount > 0 && `${infoCount} note${infoCount === 1 ? '' : 's'}`,
          ]
            .filter(Boolean)
            .join(', ')
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onNavigate(section.id)}
              className="group relative flex items-center"
              style={{ height: INACTIVE_HEIGHT }}
              title={needsAttention ? `${section.label} — ${attentionLabel}` : section.label}
              aria-label={
                needsAttention ? `${section.label}, ${attentionLabel}` : section.label
              }
              aria-current={isActive ? 'true' : undefined}
            >
              {/* The line itself carries the signal — amber asks for a decision,
                  a full-strength navy line is a note. Neutral sections stay faint. */}
              <span
                className={cn(
                  'rounded-full transition-opacity duration-200',
                  questionCount > 0 ? 'bg-amber-600' : 'bg-brand-navy',
                  isActive
                    ? 'opacity-0'
                    : needsAttention
                      ? 'opacity-100'
                      : 'opacity-60 group-hover:opacity-100'
                )}
                style={{ width: INACTIVE_WIDTH, height: INACTIVE_HEIGHT }}
              />
            </button>
          )
        })}
      </nav>

      {/* Hover popover — full nav */}
      <div
        className={cn(
          'absolute left-0 top-0 z-40 w-max min-w-[240px] rounded-xl border border-neutral-200 bg-white p-3 shadow-lg transition-all duration-150 ease-out',
          isHovered
            ? 'pointer-events-auto translate-x-0 opacity-100'
            : 'pointer-events-none -translate-x-1 opacity-0'
        )}
      >
        <ul className="flex flex-col gap-0.5">
          {sections.map((section) => {
            const isActive = section.id === activeId
            const isItemHovered = hoveredId === section.id
            const useGradient =
              section.status === 'attention' &&
              (section.id === 'account' || section.id.toLowerCase().includes('product'))
            const flyoutQuestionCount = section.questionCount ?? 0
            const flyoutInfoCount = section.infoCount ?? 0

            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(section.id)}
                  onMouseEnter={() => setHoveredId(section.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    'flex w-fit cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-left transition-all duration-200 ease-out',
                    isActive ? 'bg-brand-navy' : 'hover:bg-neutral-100'
                  )}
                >
                  <span
                    className={cn(
                      'whitespace-nowrap text-[13px] tracking-[-0.25px] transition-all duration-200',
                      isActive
                        ? 'font-bold text-white'
                        : isItemHovered
                          ? 'font-medium text-brand-navy'
                          : useGradient
                            ? 'font-normal ai-gradient-text'
                            : section.status === 'attention'
                              ? 'font-normal text-red-600'
                              : 'font-normal text-brand-navy'
                    )}
                  >
                    {section.label}
                  </span>
                  {/* Counts mirror the section-header pills: amber asks, grey notes. */}
                  {flyoutQuestionCount > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-amber-700/35 bg-amber-50 px-1.5 py-px text-[10px] font-semibold text-amber-800">
                      <MessageCircleQuestionMark size={9} strokeWidth={2.75} aria-hidden />
                      {flyoutQuestionCount}
                    </span>
                  )}
                  {flyoutInfoCount > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-neutral-200 px-1.5 py-px text-[10px] font-semibold text-brand-navy">
                      <MessageCircleInfoIcon size={9} strokeWidth={2.75} />
                      {flyoutInfoCount}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default InPageNav
