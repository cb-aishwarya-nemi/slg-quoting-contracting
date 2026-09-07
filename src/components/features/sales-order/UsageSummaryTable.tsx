import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const YEAR_1_USAGE_ROWS = [
  {
    feature: 'API calls',
    committedUsage: '1.2M/5M',
    commitUnit: 'API calls',
    usedRatio: 1.2 / 5,
    onDemandUsage: null,
    onDemandUnit: null,
    onDemandAmount: null,
  },
  {
    feature: 'Image processing',
    committedUsage: '1,980/2,400',
    commitUnit: 'images',
    usedRatio: 1980 / 2400,
    onDemandUsage: null,
    onDemandUnit: null,
    onDemandAmount: null,
  },
  {
    feature: 'Storage',
    committedUsage: '500/500',
    commitUnit: 'GB',
    usedRatio: 1,
    onDemandUsage: '24',
    onDemandUnit: 'GB',
    onDemandAmount: '$48.00',
  },
] as const

/** Green under 80%, amber at or above 80%, red when the commit is fully used. */
function usageRingColor(ratio: number) {
  if (ratio >= 1) return '#dc2626'
  if (ratio >= 0.8) return '#d97706'
  return '#16a34a'
}

function UsageDonut({ ratio }: { ratio: number }) {
  const size = 13
  const stroke = 2
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, ratio))

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-neutral-200 transition-colors group-hover:stroke-white/25"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={usageRingColor(clamped)}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${clamped * c} ${c}`}
      />
    </svg>
  )
}

export function UsageSummaryTable({
  onSelectFeature,
}: {
  onSelectFeature?: (featureLabel: string) => void
}) {
  return (
    <div className="w-full max-w-[780px]">
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center border-b border-neutral-200 px-3 pb-2 pt-3">
        <div className="text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Feature
        </div>
        <div className="text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Committed usage
        </div>
        <div className="text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          On-demand usage
        </div>
        <div className="w-5" aria-hidden />
      </div>
      <div>
        {YEAR_1_USAGE_ROWS.map((row, idx) => (
          <div
            key={row.feature}
            role={onSelectFeature ? 'button' : undefined}
            tabIndex={onSelectFeature ? 0 : undefined}
            onClick={() => onSelectFeature?.(row.feature)}
            onKeyDown={
              onSelectFeature
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectFeature(row.feature)
                    }
                  }
                : undefined
            }
            className={cn(
              'group row-hover-trail grid cursor-pointer grid-cols-[1fr_1fr_1fr_auto] items-center px-3 py-2.5 transition-colors hover:bg-brand-navy',
              idx < YEAR_1_USAGE_ROWS.length - 1 && 'border-b border-neutral-100 hover:border-brand-navy'
            )}
          >
            <div className="flex min-w-0 items-center gap-2 pr-4">
              <span className="truncate text-[14px] font-medium text-brand-navy transition-colors group-hover:text-white">
                {row.feature}
              </span>
            </div>
            <div className="flex items-center gap-1.5 pr-4 text-[14px]">
              <UsageDonut ratio={row.usedRatio} />
              <span>
                <span className="font-medium text-brand-navy transition-colors group-hover:text-white">
                  {row.committedUsage}
                </span>
                <span className="text-[12px] text-brand-fog transition-colors group-hover:text-white/70">
                  {' '}
                  {row.commitUnit}
                </span>
              </span>
            </div>
            <div className="pr-4 text-[14px]">
              {row.onDemandUsage ? (
                <>
                  <span className="font-medium text-brand-navy transition-colors group-hover:text-white">
                    {row.onDemandUsage}
                  </span>
                  {row.onDemandUnit ? (
                    <span className="text-[12px] text-brand-fog transition-colors group-hover:text-white/70">
                      {' '}
                      {row.onDemandUnit}
                    </span>
                  ) : null}
                  {row.onDemandAmount ? (
                    <span className="text-[12px] text-brand-fog transition-colors group-hover:text-white/70">
                      {' '}
                      ({row.onDemandAmount})
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-[10px] text-brand-mist transition-colors group-hover:text-white/50">
                  —
                </span>
              )}
            </div>
            <ArrowRight
              size={14}
              className="shrink-0 text-white opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
