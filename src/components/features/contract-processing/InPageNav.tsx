import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AttentionFlagIcon } from './AttentionFlagIcon'

export interface NavSection {
  id: string
  label: string
  status: 'ai' | 'ready' | 'attention' | 'neutral'
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
 * (24px → 32px on active/scroll-spy, 1px → 2px, brand-navy → blue-700).
 * A sliding indicator animates fluidly as the active section changes during
 * scroll. Hovering the rail reveals a popover with full section labels.
 */
export function InPageNav({ sections, activeId, onNavigate }: InPageNavProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const activeIndex = Math.max(
    0,
    sections.findIndex((s) => s.id === activeId)
  )

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
          className="pointer-events-none absolute left-1 rounded-full bg-blue-700"
          style={{
            top: 4 + activeIndex * ROW_STRIDE - (ACTIVE_HEIGHT - INACTIVE_HEIGHT) / 2,
            width: ACTIVE_WIDTH,
            height: ACTIVE_HEIGHT,
            transition:
              'top 520ms cubic-bezier(0.4, 0, 0.2, 1), width 320ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {sections.map((section) => {
          const isActive = section.id === activeId
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onNavigate(section.id)}
              className="group relative flex items-center"
              style={{ height: INACTIVE_HEIGHT }}
              title={section.label}
              aria-label={section.label}
              aria-current={isActive ? 'true' : undefined}
            >
              <span
                className={cn(
                  'rounded-full bg-brand-navy transition-opacity duration-200',
                  isActive ? 'opacity-0' : 'opacity-60 group-hover:opacity-100'
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
          'absolute left-0 top-0 z-40 min-w-[240px] rounded-xl border border-neutral-200 bg-white p-3 shadow-lg transition-all duration-150 ease-out',
          isHovered
            ? 'pointer-events-auto translate-x-0 opacity-100'
            : 'pointer-events-none -translate-x-1 opacity-0'
        )}
      >
        <ul className="flex flex-col gap-0.5">
          {sections.map((section) => {
            const isActive = section.id === activeId
            const isItemHovered = hoveredId === section.id
            const showFlag =
              section.id === 'account' || section.id.toLowerCase().includes('product')
            const useGradient = section.status === 'attention'

            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(section.id)}
                  onMouseEnter={() => setHoveredId(section.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    'flex w-fit cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-left transition-all duration-200 ease-out',
                    isActive ? 'bg-brand-navy' : 'hover:bg-neutral-100'
                  )}
                >
                  <span
                    className={cn(
                      'text-[13px] tracking-[-0.25px] transition-all duration-200',
                      isActive
                        ? 'font-bold text-white'
                        : isItemHovered
                          ? 'font-medium text-brand-navy'
                          : section.status === 'attention' && showFlag
                            ? 'font-normal ai-gradient-text'
                            : section.status === 'attention'
                              ? 'font-normal text-red-600'
                              : 'font-normal text-brand-navy'
                    )}
                  >
                    {section.label}
                  </span>
                  {showFlag && (
                    <AttentionFlagIcon
                      id={section.id}
                      variant={isActive ? 'white' : useGradient ? 'gradient' : 'navy'}
                    />
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
