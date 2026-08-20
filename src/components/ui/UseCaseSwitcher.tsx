import { useState, useRef, useEffect, Fragment } from 'react'
import { GitBranch, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUseCase, type UseCaseVariant } from '@/context/UseCaseContext'

const PRODUCTS_PRICING_PAGE_ID = 'customer360'

export function UseCaseSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { activeVariant, getPage, setActivePage, setVariant } = useUseCase()

  const page = getPage(PRODUCTS_PRICING_PAGE_ID)
  const variants = page?.variants ?? []
  const currentVariant = activeVariant ?? page?.defaultVariant ?? null

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Handle variant selection
  const handleSelectVariant = (variant: UseCaseVariant) => {
    setActivePage(PRODUCTS_PRICING_PAGE_ID)
    setVariant(variant.id)
    setIsOpen(false)
  }

  return (
    <>
      {/* Main Switcher Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 left-4 z-[9999] flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
          'bg-white border border-neutral-200',
          'shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]',
          'hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]',
          isOpen
            ? 'text-brand-navy border-neutral-300'
            : 'text-neutral-500 hover:text-brand-navy hover:border-neutral-300'
        )}
        title="Switch use case variant"
      >
        <GitBranch size={18} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'fixed bottom-16 left-4 z-[9999] w-72 rounded-xl',
            'bg-white border border-neutral-200',
            'shadow-[0_4px_16px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]',
            'animate-in slide-in-from-bottom-2 duration-200'
          )}
        >
          {/* Header */}
          <div className="border-b border-neutral-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-fog">
                Use Case Switcher
              </span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                Prototype
              </span>
            </div>
          </div>

          {/* Variants List */}
          <div className="p-2">
            <div className="space-y-1">
              {variants.map((variant, index) => {
                const isActive = currentVariant === variant.id
                const showGroupHeader =
                  !!variant.group && variant.group !== variants[index - 1]?.group
                return (
                  <Fragment key={variant.id}>
                    {showGroupHeader ? (
                      <div
                        className={cn(
                          'px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-brand-fog',
                          index > 0 && 'mt-1 border-t border-neutral-100'
                        )}
                      >
                        {variant.group}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleSelectVariant(variant)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                          isActive
                            ? 'border-brand-navy bg-brand-navy'
                            : 'border-neutral-300 bg-white'
                        )}
                      >
                        {isActive && <Check size={10} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium text-brand-navy">
                          {variant.label}
                        </span>
                      </div>
                    </button>
                  </Fragment>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
