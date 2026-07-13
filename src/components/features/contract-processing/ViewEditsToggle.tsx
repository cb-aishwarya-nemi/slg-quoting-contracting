import { cn } from '@/lib/utils'
import { useFieldEditHistory } from '@/context/FieldEditHistoryContext'

export function ViewEditsToggle() {
  const { viewEdits, toggleViewEdits, editCount } = useFieldEditHistory()
  const isDisabled = editCount === 0

  return (
    <button
      type="button"
      onClick={toggleViewEdits}
      disabled={isDisabled}
      aria-pressed={viewEdits}
      aria-disabled={isDisabled}
      className={cn(
        'flex items-center gap-2 transition-opacity',
        isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-80'
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors',
          viewEdits && !isDisabled ? 'bg-blue-700' : 'bg-neutral-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform',
            viewEdits && !isDisabled ? 'translate-x-3.5' : 'translate-x-0.5'
          )}
        />
      </span>
      <span className="text-[13px] font-medium text-brand-navy">
        View edits
        {editCount > 0 && (
          <span className="tabular-nums text-brand-fog"> ({editCount})</span>
        )}
      </span>
    </button>
  )
}

export default ViewEditsToggle
