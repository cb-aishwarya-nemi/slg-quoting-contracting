import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type SourceDocument } from '@/data/contractProcessingMock'

export interface NavSection {
  id: string
  label: string
  status: 'ai' | 'ready' | 'attention' | 'neutral'
}

interface InPageNavProps {
  sections: NavSection[]
  sourceDocuments: SourceDocument[]
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
 * scroll. Hovering the rail reveals a popover with full labels and PDF links.
 */
export function InPageNav({ sections, sourceDocuments, activeId, onNavigate }: InPageNavProps) {
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
            const showFlag = section.id.toLowerCase().includes('product')
            const useGradient = section.status === 'attention'
            const gradientId = `flag-gradient-${section.id}`

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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1="0"
                          y1="0"
                          x2="24"
                          y2="24"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop offset="0%" stopColor="#ff3300" />
                          <stop offset="100%" stopColor="#6d28d9" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
                        stroke={isActive ? '#ffffff' : useGradient ? `url(#${gradientId})` : '#1c1b2e'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 22v-7"
                        stroke={isActive ? '#ffffff' : useGradient ? `url(#${gradientId})` : '#1c1b2e'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {sourceDocuments.length > 0 && (
          <>
            <div className="my-3 ml-2.5 h-px w-4 bg-brand-navy" />
            <ul className="flex flex-col gap-2.5 pl-2.5">
              {sourceDocuments.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => {
                      window.open(
                        `/pdf-viewer.html?doc=${encodeURIComponent(doc.name)}`,
                        `pdf-${doc.id}`,
                        'popup,width=680,height=800'
                      )
                    }}
                    className="group flex w-full cursor-pointer items-center gap-2 text-left text-[13px] text-blue-700 hover:underline"
                  >
                    <span className="truncate">{doc.name}</span>
                    <ArrowUpRight
                      size={15}
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default InPageNav
