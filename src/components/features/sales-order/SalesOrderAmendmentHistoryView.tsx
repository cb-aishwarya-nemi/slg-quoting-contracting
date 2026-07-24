import { useState } from 'react'
import { ArrowRight, FileText, Minus, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AMENDMENT_HISTORY_VERSIONS,
  type AmendmentVersionSnapshot,
} from '@/data/salesOrderAmendmentHistoryMock'
import { type SalesOrderProduct } from '@/data/salesOrderMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'

interface SalesOrderAmendmentHistoryViewProps {
  onClose: () => void
  initialVersionId?: string
}

const EVOLUTION_SUMMARY = {
  body: 'Seats expanded from 50 to 75, term was extended by a year, and ramp pricing was adjusted once. Each change is reflected in products, period, and the signed source docs below — select a version to see what shifted from the one before it.',
}

type ProductDiffKind = 'added' | 'removed' | 'changed' | 'unchanged'

interface ProductDiffRow {
  name: string
  kind: ProductDiffKind
  before?: SalesOrderProduct
  after?: SalesOrderProduct
  summary: string
}

function findPreviousVersion(
  versionId: string
): AmendmentVersionSnapshot | undefined {
  const idx = AMENDMENT_HISTORY_VERSIONS.findIndex((v) => v.id === versionId)
  if (idx < 0 || idx >= AMENDMENT_HISTORY_VERSIONS.length - 1) return undefined
  // Array is newest-first; previous chronologically is the next index
  return AMENDMENT_HISTORY_VERSIONS[idx + 1]
}

function buildProductDiffs(
  current: AmendmentVersionSnapshot,
  previous: AmendmentVersionSnapshot | undefined
): ProductDiffRow[] {
  if (!previous) {
    return current.products.map((p) => ({
      name: p.name,
      kind: 'added' as const,
      after: p,
      summary: 'Introduced in original order',
    }))
  }

  const prevByName = new Map(previous.products.map((p) => [p.name, p]))
  const currByName = new Map(current.products.map((p) => [p.name, p]))
  const names = new Set([...prevByName.keys(), ...currByName.keys()])
  const rows: ProductDiffRow[] = []

  for (const name of names) {
    const before = prevByName.get(name)
    const after = currByName.get(name)
    if (!before && after) {
      rows.push({ name, kind: 'added', after, summary: `Added · ${after.quantity} × ${after.unitPrice}` })
    } else if (before && !after) {
      rows.push({ name, kind: 'removed', before, summary: `Removed · was ${before.quantity} × ${before.unitPrice}` })
    } else if (before && after) {
      const changes: string[] = []
      if (before.quantity !== after.quantity) {
        changes.push(`Qty ${before.quantity} → ${after.quantity}`)
      }
      if (before.unitPrice !== after.unitPrice) {
        changes.push(`Unit ${before.unitPrice} → ${after.unitPrice}`)
      }
      if (before.totalPrice !== after.totalPrice) {
        changes.push(`Total ${before.totalPrice} → ${after.totalPrice}`)
      }
      if (before.frequency !== after.frequency) {
        changes.push(`Freq ${before.frequency} → ${after.frequency}`)
      }
      rows.push({
        name,
        kind: changes.length ? 'changed' : 'unchanged',
        before,
        after,
        summary: changes.length ? changes.join(' · ') : 'No change',
      })
    }
  }

  const order: Record<ProductDiffKind, number> = {
    added: 0,
    changed: 1,
    removed: 2,
    unchanged: 3,
  }
  return rows.sort((a, b) => order[a.kind] - order[b.kind] || a.name.localeCompare(b.name))
}

function DiffBadge({ kind }: { kind: ProductDiffKind }) {
  if (kind === 'unchanged') return null
  const styles: Record<Exclude<ProductDiffKind, 'unchanged'>, string> = {
    added: 'bg-green-50 text-green-700',
    removed: 'bg-red-50 text-red-700',
    changed: 'bg-amber-50 text-amber-800',
  }
  const labels = { added: 'Added', removed: 'Removed', changed: 'Changed' }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]',
        styles[kind]
      )}
    >
      {labels[kind]}
    </span>
  )
}

function VersionDetail({
  version,
  previous,
}: {
  version: AmendmentVersionSnapshot
  previous?: AmendmentVersionSnapshot
}) {
  const productDiffs = buildProductDiffs(version, previous)
  const meaningfulDiffs = productDiffs.filter((d) => d.kind !== 'unchanged')

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-[21px] font-normal tracking-[-0.5px] text-brand-navy">
            {version.title}
          </h2>
          <span className="text-[13px] font-semibold text-blue-700">{version.version}</span>
          {version.current && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-blue-700">
              Current
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-brand-fog">
          Effective {version.date}
          {previous ? ` · compared to ${previous.version}` : ' · original contract'}
        </p>
      </div>

      {/* Period + TCV — same treatment on every version */}
      <section>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-brand-navy">
          <span className="font-medium">{version.timePeriod.startDate}</span>
          <ArrowRight size={14} className="shrink-0 text-brand-mist" />
          <span className="font-medium">{version.timePeriod.endDate}</span>
          <span className="text-brand-mist">·</span>
          <span className="font-medium">{version.timePeriod.term}</span>
          <span className="text-brand-mist">·</span>
          <span className="font-semibold tabular-nums">{version.tcv} TCV</span>
        </div>
      </section>

      {/* Diff vs previous version — skip for original (v1) */}
      {previous && (
        <section>
          <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
            {previous.version === 'v1'
              ? 'Changes from the original contract'
              : `Changes from ${previous.version}`}
          </h3>
          <p className="mt-2 max-w-[640px] text-[13px] leading-[1.6] text-brand-navy">
            {version.changeSummary}
          </p>
          {meaningfulDiffs.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
              {meaningfulDiffs.map((row, idx) => (
                <div
                  key={row.name}
                  className={cn(
                    'flex items-start gap-3 px-4 py-2.5',
                    idx < meaningfulDiffs.length - 1 && 'border-b border-neutral-200',
                    row.kind === 'added' && 'bg-green-50/40',
                    row.kind === 'removed' && 'bg-red-50/40',
                    row.kind === 'changed' && 'bg-amber-50/40'
                  )}
                >
                  <span className="mt-0.5 shrink-0 text-brand-fog">
                    {row.kind === 'added' && <Plus size={14} className="text-green-700" />}
                    {row.kind === 'removed' && <Minus size={14} className="text-red-700" />}
                    {row.kind === 'changed' && (
                      <ArrowRight size={14} className="text-amber-700" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-brand-navy">{row.name}</span>
                      <DiffBadge kind={row.kind} />
                    </div>
                    <p className="mt-0.5 text-[12px] text-brand-fog">{row.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-brand-fog">
              No product-line changes vs the prior version.
            </p>
          )}
        </section>
      )}

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Products and pricing
        </h3>
        <div className="mt-3">
          <ReadOnlyProductsList items={version.products} />
        </div>
      </section>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          Source docs
        </h3>
        <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200">
          {version.sourceDocs.map((doc, idx) => (
            <div
              key={doc.id}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                idx < version.sourceDocs.length - 1 && 'border-b border-neutral-200'
              )}
            >
              <FileText size={16} className="shrink-0 text-brand-fog" />
              <a className="min-w-0 flex-1 cursor-pointer truncate text-[14px] font-medium text-blue-700 hover:underline">
                {doc.name}
              </a>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-brand-fog">
                {doc.type}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function SalesOrderAmendmentHistoryView({
  onClose,
  initialVersionId,
}: SalesOrderAmendmentHistoryViewProps) {
  const defaultId =
    initialVersionId && AMENDMENT_HISTORY_VERSIONS.some((v) => v.id === initialVersionId)
      ? initialVersionId
      : AMENDMENT_HISTORY_VERSIONS.find((v) => v.current)?.id ?? AMENDMENT_HISTORY_VERSIONS[0].id
  const [selectedId, setSelectedId] = useState(defaultId)
  const selected =
    AMENDMENT_HISTORY_VERSIONS.find((v) => v.id === selectedId) ?? AMENDMENT_HISTORY_VERSIONS[0]
  const previous = findPreviousVersion(selected.id)
  // Chronological left → right for the horizontal timeline
  const timelineVersions = [...AMENDMENT_HISTORY_VERSIONS].reverse()

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
      <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close contract expansion history"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
        >
          <X size={18} strokeWidth={2} />
        </button>
        <h1 className="font-heading text-[16px] font-semibold tracking-[-0.5px] text-brand-navy">
          Contract expansion history
        </h1>
        <span className="text-[12px] text-brand-fog">
          {AMENDMENT_HISTORY_VERSIONS.length} versions
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-20 pt-8">
        {/* Evolution summary */}
        <section className="mb-10 max-w-[820px]">
          <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
            Pioneer grew from a 24-month $230K start to a 36-month $492K contract across three{' '}
            <span className="font-semibold text-green-700">contract expansions</span>.
          </h2>
          <p className="mt-3 text-[13px] leading-[1.6] text-brand-fog">{EVOLUTION_SUMMARY.body}</p>
        </section>

        {/* Horizontal version timeline */}
        <section className="mb-12">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[-0.25px] text-brand-fog">
            Versions
          </p>
          <div className="relative pt-2">
            <div className="absolute left-0 right-0 top-[22px] h-px bg-neutral-300" />
            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${timelineVersions.length}, minmax(0, 1fr))` }}>
              {timelineVersions.map((version) => {
                const isSelected = selectedId === version.id
                const isExpansion = version.id !== 'v1'
                return (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => setSelectedId(version.id)}
                    className="group relative flex cursor-pointer flex-col items-center px-2 text-center"
                  >
                    <span
                      className={cn(
                        'relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-colors',
                        isSelected
                          ? isExpansion
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white'
                          : isExpansion
                            ? 'bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white'
                            : 'bg-neutral-200 text-brand-navy group-hover:bg-blue-600 group-hover:text-white'
                      )}
                    >
                      {version.version}
                    </span>
                    <span className="mt-3 text-[11px] text-brand-fog">{version.date}</span>
                    <span
                      className={cn(
                        'mt-0.5 text-[13px] font-medium',
                        isSelected && isExpansion
                          ? 'text-green-700'
                          : isSelected
                            ? 'text-brand-navy'
                            : 'text-brand-navy'
                      )}
                    >
                      {version.title}
                    </span>
                    <span className="text-[12px] text-brand-fog">
                      {version.detail}
                      {version.current ? ' · Current' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* What changed vs prior / original */}
        <VersionDetail version={selected} previous={previous} />
      </div>
    </div>
  )
}

export default SalesOrderAmendmentHistoryView
