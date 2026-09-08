import { cn } from '@/lib/utils'
import { type LinkedRecord } from '@/data/salesOrderMock'

function LinkedRecordRow({
  label,
  value,
  moreCount,
  isLast = false,
}: {
  label: string
  value: string
  moreCount?: number
  isLast?: boolean
}) {
  const isEmpty = value === '—' || value === ''
  return (
    <div
      className={cn(
        'flex items-center py-2.5 pl-1 pr-2',
        !isLast && 'border-b border-neutral-100'
      )}
    >
      <span className="w-[148px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        {label}
      </span>
      {isEmpty ? (
        <span className="text-[14px] text-brand-fog">—</span>
      ) : (
        <span className="min-w-0">
          <a className="cursor-pointer text-[14px] font-medium text-blue-700 hover:underline">
            {value}
          </a>
          {moreCount != null && moreCount > 0 && (
            <span className="cursor-pointer text-[14px] font-medium text-blue-700 hover:underline">
              {' '}
              +{moreCount} more
            </span>
          )}
        </span>
      )}
    </div>
  )
}

export function LinkedRecordsSection({ records }: { records: LinkedRecord[] }) {
  return (
    <section className="group/section">
      <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
        Linked records
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-20">
        <div className="min-w-0 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="px-3 py-1">
            {records.map((row, idx) => (
              <LinkedRecordRow
                key={row.label}
                label={row.label}
                value={row.value}
                moreCount={row.moreCount}
                isLast={idx === records.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
