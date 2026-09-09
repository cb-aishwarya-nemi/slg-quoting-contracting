import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { CirclePlus, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { contractProcessing, type SourceDocument } from '@/data/contractProcessingMock'

interface SalesOrderHeaderTimelineProps {
  orderId: string
  variant?: string | null
  /** Contract documents grouped onto versions by their `origin`. */
  documents?: SourceDocument[]
  /** Uploads land on the latest version, alongside its existing docs. */
  onAddDocuments?: (event: ChangeEvent<HTMLInputElement>) => void
  children?: ReactNode
}

/** Signed contract versions — v1 the original order, v2 the current amendment. */
const VERSION_MARKERS = [
  {
    id: 'v1',
    version: 'v1',
    title: 'Original contract',
    detail: '$492,000 TCV',
    dateLabel: "May 1 '26",
    tone: 'default',
    docOrigin: 'original',
  },
  {
    id: 'v2',
    version: 'v2',
    title: 'Expansion',
    detail: '+$32,000 TCV',
    dateLabel: "Apr 1 '27",
    tone: 'positive',
    docOrigin: 'amendment',
  },
] as const

function documentsForVersion(docs: SourceDocument[], origin: 'original' | 'amendment') {
  return docs.filter((doc) =>
    origin === 'original' ? doc.origin === 'original' : doc.origin !== 'original'
  )
}

function openDocument(name: string, id: string) {
  window.open(
    `/pdf-viewer.html?doc=${encodeURIComponent(name)}`,
    `pdf-${id}`,
    'popup,width=680,height=800'
  )
}

function VersionDocs({
  docs,
  onAddDocuments,
}: {
  docs: SourceDocument[]
  onAddDocuments?: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const [isMoreOpen, setAreMoreOpen] = useState(false)
  const moreTriggerRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const primary = docs[0]
  const extra = docs.slice(1)

  if (!primary && !onAddDocuments) return null

  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      {primary ? (
        <button
          type="button"
          onClick={() => openDocument(primary.name, primary.id)}
          title={primary.name}
          className="inline-flex max-w-[240px] cursor-pointer items-center gap-1 text-[11px] text-blue-700 hover:underline"
        >
          <FileText size={11} className="shrink-0" />
          <span className="truncate">{primary.name}</span>
        </button>
      ) : null}
      {extra.length > 0 ? (
        <>
          <button
            ref={moreTriggerRef}
            type="button"
            onClick={() => setAreMoreOpen((prev) => !prev)}
            className="cursor-pointer text-[11px] font-medium text-blue-700 hover:underline"
          >
            +{extra.length} more
          </button>
          <AnchoredMenu
            isOpen={isMoreOpen}
            onClose={() => setAreMoreOpen(false)}
            anchorRef={moreTriggerRef}
            offset={6}
            className="w-[280px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
          >
            {extra.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  openDocument(doc.name, doc.id)
                  setAreMoreOpen(false)
                }}
                title={doc.name}
                className="block w-full cursor-pointer truncate px-3 py-1.5 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
              >
                {doc.name}
              </button>
            ))}
          </AnchoredMenu>
        </>
      ) : null}
      {onAddDocuments ? (
        <>
          {(primary || extra.length > 0) ? (
            <span className="h-3 w-px shrink-0 bg-neutral-300" aria-hidden />
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            multiple
            className="sr-only"
            onChange={onAddDocuments}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-blue-700 hover:underline"
          >
            <CirclePlus size={12} className="shrink-0" />
            Add
          </button>
        </>
      ) : null}
    </span>
  )
}

export function SalesOrderHeaderTimeline({
  orderId: _orderId,
  variant: _variant,
  documents = contractProcessing.sourceDocuments,
  onAddDocuments,
  children,
}: SalesOrderHeaderTimelineProps) {
  return (
    <div className="w-full">
      <div className="pb-2">
        {VERSION_MARKERS.map((marker, index) => {
          const isLast = index === VERSION_MARKERS.length - 1
          const isPositive = marker.tone === 'positive'

          return (
            <div key={marker.id} className="relative flex items-start">
              {!isLast && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-[8.5px] top-[14px] w-px bg-brand-navy/15"
                  style={{ bottom: 0 }}
                />
              )}

              <div className="flex flex-1 items-start gap-3 pb-6">
                <span
                  className={cn(
                    'relative z-10 -mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold leading-none tracking-[-0.2px] ring-1',
                    isPositive
                      ? 'bg-green-50 text-green-700 ring-green-300'
                      : 'bg-blue-50 text-blue-700 ring-blue-300'
                  )}
                >
                  {marker.version}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] leading-none text-brand-fog">
                    {marker.dateLabel}
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-normal">
                    <span
                      className={cn(
                        'font-medium',
                        isPositive ? 'text-green-700' : 'text-brand-navy'
                      )}
                    >
                      {marker.title}
                    </span>
                    <span className="text-brand-fog"> · {marker.detail}</span>
                  </span>

                  <VersionDocs
                    docs={documentsForVersion(documents, marker.docOrigin)}
                    onAddDocuments={isLast ? onAddDocuments : undefined}
                  />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {children ? <div className="relative z-10 space-y-10 pt-6">{children}</div> : null}
    </div>
  )
}

export default SalesOrderHeaderTimeline
