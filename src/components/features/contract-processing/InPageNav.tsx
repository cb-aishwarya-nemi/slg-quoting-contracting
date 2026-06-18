import { useState } from 'react'
import { CircleCheck, OctagonAlert, ReceiptText, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from './GradientSparkle'
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

function NavIcon({ status, isActive }: { status: NavSection['status']; isActive: boolean }) {
  switch (status) {
    case 'ai':
      return <GradientSparkle size={18} white={false} />
    case 'attention':
      return <OctagonAlert size={18} className={cn('text-red-500', isActive && 'text-red-500')} />
    case 'neutral':
      return <ReceiptText size={17} className={cn('text-brand-mist', isActive && 'text-brand-navy')} />
    default:
      return <CircleCheck size={18} className={cn('text-brand-mist', isActive && 'text-brand-navy')} />
  }
}

export function InPageNav({ sections, sourceDocuments, activeId, onNavigate }: InPageNavProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <nav className="flex flex-col">
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
                  'flex items-center gap-2 -ml-2 px-2 py-1 text-left transition-all duration-200 ease-out',
                  isActive
                    ? 'border-l-[3px] border-brand-navy pl-[6px] rounded-r-md'
                    : 'border-l-2 border-transparent rounded-md'
                )}
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center transition-colors duration-200">
                  <NavIcon status={section.status} isActive={isActive} />
                </span>
                <span
                  className={cn(
                    'text-[13px] tracking-[-0.25px] transition-all duration-200',
                    isActive
                      ? 'font-bold text-brand-navy'
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

      <div className="my-7 h-px bg-brand-navy" />
      <ul className="flex flex-col gap-3">
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
              className="group flex items-center gap-2 text-[13px] text-blue-700 hover:underline"
            >
              <ArrowUpRight size={15} className="shrink-0" />
              <span className="truncate">{doc.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default InPageNav
