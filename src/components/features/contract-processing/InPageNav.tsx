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

function NavIcon({ status }: { status: NavSection['status'] }) {
  switch (status) {
    case 'ai':
      return <GradientSparkle size={18} />
    case 'attention':
      return <OctagonAlert size={18} className="text-red-500" />
    case 'neutral':
      return <ReceiptText size={17} className="text-brand-mist" />
    default:
      return <CircleCheck size={18} className="text-brand-mist" />
  }
}

export function InPageNav({ sections, sourceDocuments, activeId, onNavigate }: InPageNavProps) {
  return (
    <nav className="flex flex-col">
      <ul className="flex flex-col gap-0.5">
        {sections.map((section) => {
          const isActive = section.id === activeId
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onNavigate(section.id)}
                className={cn(
                  '-ml-2 flex items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors',
                  isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                )}
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  <NavIcon status={section.status} />
                </span>
                <span
                  className={cn(
                    'text-[13px] tracking-[-0.25px]',
                    section.status === 'attention' ? 'text-red-600' : 'text-brand-navy',
                    isActive ? 'font-semibold' : 'font-normal'
                  )}
                >
                  {section.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mb-3 mt-7 text-[12px] font-bold uppercase tracking-[-0.25px] text-brand-navy">
        Source documents:
      </p>
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
