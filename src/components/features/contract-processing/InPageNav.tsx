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
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onNavigate(section.id)}
                onMouseEnter={() => setHoveredId(section.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'flex items-center text-left transition-all duration-200 ease-out',
                  isActive
                    ? 'bg-brand-navy rounded-full px-2.5 py-0.5'
                    : 'rounded-full px-2.5 py-0.5'
                )}
              >
                <span
                  className={cn(
                    'text-[13px] tracking-[-0.25px] transition-all duration-200',
                    isActive
                      ? 'font-bold text-white'
                      : isHovered
                        ? 'font-medium text-brand-navy ml-1.5'
                        : section.status === 'attention'
                          ? 'font-normal text-red-600'
                          : 'font-normal text-brand-navy'
                  )}
                >
                  {section.label}
                </span>
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
