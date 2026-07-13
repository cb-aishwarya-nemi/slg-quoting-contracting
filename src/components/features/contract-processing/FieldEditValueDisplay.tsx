import { useState } from 'react'
import { ChevronUp, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type FieldEditRecord } from '@/context/FieldEditHistoryContext'

interface FieldEditValueDisplayProps {
  currentValue: string
  edits: FieldEditRecord[]
  variant?: 'inline' | 'stacked'
  showCurrentValue?: boolean
  align?: 'left' | 'right'
}

export function FieldEditValueDisplay({
  currentValue,
  edits,
  variant = 'inline',
  showCurrentValue = true,
  align = 'left',
}: FieldEditValueDisplayProps) {
  const [showOlder, setShowOlder] = useState(false)

  if (edits.length === 0) return null

  const latest = edits[0]
  const olderEdits = edits.slice(1)
  const hasOlderEdits = olderEdits.length > 0

  const previousValueLine = (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5',
        align === 'right' && 'justify-end'
      )}
    >
      <button
        type="button"
        onClick={() => hasOlderEdits && setShowOlder((prev) => !prev)}
        className={cn(
          'inline-flex shrink-0 items-center justify-center',
          hasOlderEdits ? 'cursor-pointer' : 'cursor-default'
        )}
        aria-label={hasOlderEdits ? 'Show earlier edits' : 'Previous value'}
        disabled={!hasOlderEdits}
      >
        <History
          size={variant === 'stacked' ? 12 : 14}
          className={cn(
            'text-brand-mist group-hover:text-white/60',
            hasOlderEdits && 'group-hover:hover:text-white'
          )}
        />
      </button>
      <span
        className={cn(
          'truncate font-medium text-brand-fog group-hover:text-white/60',
          variant === 'stacked' ? 'text-[12px]' : 'text-[14px]'
        )}
      >
        {latest.previousValue || '—'}
      </span>
    </span>
  )

  if (variant === 'stacked') {
    return (
      <div
        className={cn('min-w-0', align === 'right' && 'text-right')}
        onClick={(e) => e.stopPropagation()}
      >
        {showCurrentValue && (
          <span className="text-[14px] font-medium text-blue-700 group-hover:text-white">
            {currentValue}
          </span>
        )}
        <div className={cn(showCurrentValue && 'mt-0.5')}>{previousValueLine}</div>

        {hasOlderEdits && showOlder && (
          <div className="mt-2 space-y-1.5 border-t border-neutral-200/80 pt-2 text-left group-hover:border-white/20">
            {olderEdits.map((edit) => (
              <div key={edit.id} className="flex items-start gap-2 pl-0.5">
                <History size={12} className="mt-0.5 shrink-0 text-brand-mist group-hover:text-white/40" />
                <div className="min-w-0">
                  <p className="text-[12px] text-brand-navy group-hover:text-white/80">
                    <span className="font-medium">{edit.newValue}</span>
                    <span className="text-brand-fog group-hover:text-white/50">
                      {' '}
                      · was {edit.previousValue || '—'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setShowOlder(false)}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-brand-fog hover:text-brand-navy group-hover:text-white/70 group-hover:hover:text-white"
            >
              <ChevronUp size={12} />
              Hide earlier edits
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-1">
        <span className="text-[14px] font-medium text-blue-700 group-hover:text-white">
          {currentValue}
        </span>

        <span className="inline-flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => hasOlderEdits && setShowOlder((prev) => !prev)}
            className={cn(
              'inline-flex shrink-0 items-center justify-center',
              hasOlderEdits ? 'cursor-pointer' : 'cursor-default'
            )}
            aria-label={hasOlderEdits ? 'Show earlier edits' : 'Previous value'}
            disabled={!hasOlderEdits}
          >
            <History
              size={14}
              className={cn(
                'text-brand-mist group-hover:text-white/60',
                hasOlderEdits && 'group-hover:hover:text-white'
              )}
            />
          </button>
          <span className="truncate text-[14px] font-medium text-brand-fog group-hover:text-white/60">
            {latest.previousValue || '—'}
          </span>
        </span>
      </div>

      {hasOlderEdits && showOlder && (
        <div className="mt-2 space-y-1.5 border-t border-neutral-200/80 pt-2 group-hover:border-white/20">
          {olderEdits.map((edit) => (
            <div key={edit.id} className="flex items-start gap-2 pl-0.5">
              <History size={12} className="mt-0.5 shrink-0 text-brand-mist group-hover:text-white/40" />
              <div className="min-w-0">
                <p className="text-[12px] text-brand-navy group-hover:text-white/80">
                  <span className="font-medium">{edit.newValue}</span>
                  <span className="text-brand-fog group-hover:text-white/50">
                    {' '}
                    · was {edit.previousValue || '—'}
                  </span>
                </p>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setShowOlder(false)}
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-brand-fog hover:text-brand-navy group-hover:text-white/70 group-hover:hover:text-white"
          >
            <ChevronUp size={12} />
            Hide earlier edits
          </button>
        </div>
      )}
    </div>
  )
}

export default FieldEditValueDisplay
