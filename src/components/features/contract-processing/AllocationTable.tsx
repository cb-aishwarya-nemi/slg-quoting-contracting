import { ChevronDown, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type AllocationGroup } from '@/data/contractProcessingMock'

const FEATURE_W = 200
const FREQUENCY_W = 110
const ROLLOVER_W = 130
const EXPIRY_W = 150
const UNITS_W = 100

const COLS = `${FEATURE_W}px minmax(0, 1fr) ${UNITS_W}px ${FREQUENCY_W}px ${ROLLOVER_W}px ${EXPIRY_W}px`

function Separator() {
  return <div className="mx-3 h-5 w-px shrink-0 bg-neutral-200" />
}

function MiniDropdown({
  label,
  disabled,
}: {
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex w-full min-w-0 items-center justify-between gap-1 rounded px-1 py-1 text-[14px] transition-colors',
        disabled
          ? 'cursor-default text-brand-mist'
          : 'cursor-pointer text-brand-navy hover:bg-neutral-100'
      )}
    >
      <span className="truncate">{label}</span>
      {!disabled && <ChevronDown size={14} className="shrink-0 text-brand-mist" />}
    </button>
  )
}

interface AllocationTableProps {
  items: AllocationGroup[]
}

export function AllocationTable({ items }: AllocationTableProps) {
  return (
    <div className="w-full">
      {/* Column headers */}
      <div
        className="grid items-center border-b border-neutral-200 px-4 pb-2"
        style={{ gridTemplateColumns: COLS }}
      >
        <div className="pr-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Entitlement/Credit
        </div>
        <div className="pl-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Item
        </div>
        <div className="flex items-center justify-end text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          <span className="mx-3 w-px shrink-0" aria-hidden />
          <span className="flex-1">Units</span>
        </div>
        <div className="flex items-center text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          <span className="mx-3 w-px shrink-0" aria-hidden />
          Frequency
        </div>
        <div className="flex items-center text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          <span className="mx-3 w-px shrink-0" aria-hidden />
          Rollover
        </div>
        <div className="flex items-center text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          <span className="mx-3 w-px shrink-0" aria-hidden />
          Expiry
        </div>
      </div>

      {items.map((group) => {
        const isUsage = group.kind === 'usage'
        const sourceCount = Math.max(group.sources.length, 1)

        return (
          <div
            key={group.id}
            className="border-b border-neutral-200"
          >
            <div
              className="grid items-stretch px-4"
              style={{ gridTemplateColumns: COLS }}
            >
              {/* Feature — vertically centered across item rows */}
              <div
                className="flex items-center gap-1.5 self-stretch pr-3"
                style={{ gridRow: `1 / span ${sourceCount}` }}
              >
                <span className="text-[14px] font-medium text-brand-navy">
                  {group.feature}
                </span>
                {isUsage && (
                  <Gauge
                    size={13}
                    strokeWidth={2}
                    className="shrink-0 text-brand-fog"
                    aria-label="Metered feature"
                  />
                )}
              </div>

              {group.sources.map((source, index) => {
                const rollover = isUsage ? (source.rollover ?? '–') : '–'
                const expiry = isUsage ? (source.expiry ?? '–') : '–'
                // Skip partial rule on the last item — the group’s full-width border is enough.
                const showItemRule = index < group.sources.length - 1

                return (
                  <div key={source.id} className="contents">
                    <div
                      className={cn(
                        'flex min-w-0 items-center py-1.5 pl-3',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-[14px] text-brand-navy">
                        {source.name}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center justify-end py-1.5 text-[14px] tabular-nums text-brand-navy',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      <span className="flex-1 text-right">{source.units}</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center py-1.5',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      <MiniDropdown label={source.frequency} />
                    </div>
                    <div
                      className={cn(
                        'flex items-center py-1.5',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      {isUsage ? (
                        <MiniDropdown label={rollover} />
                      ) : (
                        <MiniDropdown label="–" disabled />
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex items-center py-1.5',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      {isUsage ? (
                        <MiniDropdown label={expiry} />
                      ) : (
                        <MiniDropdown label="–" disabled />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
