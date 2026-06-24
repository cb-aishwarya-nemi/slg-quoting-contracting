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

export function InPageNav({ sections, sourceDocuments, activeId, onNavigate }: InPageNavProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <nav className="flex flex-col -ml-2.5">
      <ul className="flex flex-col gap-0.5">
        {sections.map((section) => {
          const isActive = section.id === activeId
          const isHovered = hoveredId === section.id
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
                  'flex items-center gap-1.5 text-left transition-all duration-200 ease-out',
                  isActive
                    ? 'bg-white dark:bg-brand-navy rounded-full px-2.5 py-0.5'
                    : 'rounded-full px-2.5 py-0.5'
                )}
              >
                <span
                  className={cn(
                    'text-[13px] tracking-[-0.25px] transition-all duration-200',
                    isActive
                      ? 'font-bold text-brand-navy dark:text-white'
                      : isHovered
                        ? 'font-medium text-brand-navy ml-1.5'
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
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0"
                  >
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ff3300" />
                        <stop offset="100%" stopColor="#6d28d9" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
                      stroke={isActive ? '#1c1b2e' : useGradient ? `url(#${gradientId})` : '#1c1b2e'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 22v-7"
                      stroke={isActive ? '#1c1b2e' : useGradient ? `url(#${gradientId})` : '#1c1b2e'}
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

      <div className="my-7 ml-2.5 h-[2px] w-4 bg-brand-navy" />
      <ul className="ml-2.5 flex flex-col gap-3">
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
              className="group flex items-center gap-2 text-[13px] text-blue-700 hover:underline w-full text-left"
            >
              <span className="truncate">{doc.name}</span>
              <ArrowUpRight size={15} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default InPageNav
