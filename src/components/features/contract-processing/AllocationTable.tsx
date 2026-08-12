import { ChevronDown, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type AllocationGroup } from '@/data/contractProcessingMock'

const FREQUENCY_W = 96
const ROLLOVER_W = 130
const EXPIRY_W = 150
const UNITS_W = 88

function Separator() {
  return <div className="mx-3 h-5 w-px shrink-0 bg-neutral-200" />
}

function GhostSeparator() {
  return <div className="mx-3 h-5 w-px shrink-0" />
}

function MiniDropdown({
  label,
  width,
  disabled,
}: {
  label: string
  width: number
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      style={{ width }}
      disabled={disabled}
      className={cn(
        'flex shrink-0 items-center justify-between gap-1 rounded px-1 py-1 text-[14px] transition-colors',
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
    <div className="flex w-full flex-col gap-10">
      {items.map((group, groupIndex) => {
        const isUsage = group.kind === 'usage'
        const showColumnHeaders = groupIndex === 0

        return (
          <div key={group.id}>
            {/* Feature header — name + total aligned to units column */}
            <div className="flex items-center border-b border-neutral-200 pb-2 pl-1 pr-2">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="truncate text-[14px] font-semibold text-brand-navy">
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
              <GhostSeparator />
              <div style={{ width: FREQUENCY_W }} className="shrink-0" />
              <GhostSeparator />
              <div style={{ width: ROLLOVER_W }} className="shrink-0" />
              <GhostSeparator />
              <div style={{ width: EXPIRY_W }} className="shrink-0" />
              <GhostSeparator />
              <div
                style={{ width: UNITS_W }}
                className="shrink-0 text-right text-[14px] font-semibold tabular-nums text-brand-navy"
              >
                {group.units}
              </div>
            </div>

            {/* Column labels — only under the first feature header */}
            {showColumnHeaders && (
              <div className="flex items-center pt-2 pb-1 pl-1 pr-2">
                <div className="min-w-0 flex-1 pl-4 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-fog">
                  Item
                </div>
                <GhostSeparator />
                <div
                  style={{ width: FREQUENCY_W }}
                  className="shrink-0 px-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-fog"
                >
                  Frequency
                </div>
                <GhostSeparator />
                <div
                  style={{ width: ROLLOVER_W }}
                  className="shrink-0 px-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-fog"
                >
                  Rollover
                </div>
                <GhostSeparator />
                <div
                  style={{ width: EXPIRY_W }}
                  className="shrink-0 px-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-fog"
                >
                  Expiry
                </div>
                <GhostSeparator />
                <div
                  style={{ width: UNITS_W }}
                  className="shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-fog"
                >
                  Units
                </div>
              </div>
            )}

            {/* Source item rows */}
            {group.sources.map((source) => {
              const rollover = isUsage ? (source.rollover ?? '–') : '–'
              const expiry = isUsage ? (source.expiry ?? '–') : '–'

              return (
                <div
                  key={source.id}
                  className="flex items-center border-b border-neutral-100 py-1.5 pl-1 pr-2"
                >
                  <div className="min-w-0 flex-1 truncate pl-4 text-[14px] text-brand-navy">
                    {source.name}
                  </div>

                  <Separator />
                  <MiniDropdown label={source.frequency} width={FREQUENCY_W} />

                  <Separator />
                  {isUsage ? (
                    <MiniDropdown label={rollover} width={ROLLOVER_W} />
                  ) : (
                    <MiniDropdown label="–" width={ROLLOVER_W} disabled />
                  )}

                  <Separator />
                  {isUsage ? (
                    <MiniDropdown label={expiry} width={EXPIRY_W} />
                  ) : (
                    <MiniDropdown label="–" width={EXPIRY_W} disabled />
                  )}

                  <Separator />
                  <div
                    style={{ width: UNITS_W }}
                    className="shrink-0 text-right text-[14px] font-medium tabular-nums text-brand-navy"
                  >
                    {source.units}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
