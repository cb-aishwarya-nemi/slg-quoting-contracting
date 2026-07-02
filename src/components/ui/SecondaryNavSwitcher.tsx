import { useState, useRef, useEffect } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SwitcherItem {
  id: string
  label: string
  sublabel?: string
}

interface SecondaryNavSwitcherProps {
  items: SwitcherItem[]
  activeId?: string
  onSelect: (id: string) => void
  onViewMore?: () => void
  /** how many items to show before the "View More" link (default 8) */
  maxVisible?: number
}

/**
 * A compact chevron-up-down popover that lists recent line-items (sales orders,
 * tasks, invoices) to jump between within the Customer 360 frame — replacing a
 * dedicated index page. Shows the last N items with a text-only "View More".
 */
export function SecondaryNavSwitcher({
  items,
  activeId,
  onSelect,
  onViewMore,
  maxVisible = 8,
}: SecondaryNavSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const visibleItems = items.slice(0, maxVisible)
  const hasMore = items.length > maxVisible

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-blue-700 transition-colors hover:bg-blue-50"
        title="Switch"
      >
        <ChevronsUpDown size={15} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-40 mt-1.5 min-w-[280px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
          <div className="max-h-[320px] overflow-y-auto">
            {visibleItems.map((item) => {
              const isActive = item.id === activeId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left transition-colors',
                    isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                  )}
                >
                  <span
                    className={cn(
                      'text-[13px] font-semibold uppercase tracking-[-0.25px]',
                      isActive ? 'text-brand-navy' : 'text-brand-navy'
                    )}
                  >
                    {item.label}
                  </span>
                  {item.sublabel && (
                    <span className="truncate text-[12px] text-brand-fog">{item.sublabel}</span>
                  )}
                </button>
              )
            })}
          </div>

          {hasMore && onViewMore && (
            <div className="border-t border-neutral-100 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  onViewMore()
                  setIsOpen(false)
                }}
                className="cursor-pointer text-[12px] font-medium text-blue-700 hover:underline"
              >
                View More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SecondaryNavSwitcher
