import { useState, useRef, useEffect } from 'react'
import { GitBranch, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUseCase, type UseCaseVariant } from '@/context/UseCaseContext'
import { useNavigation } from '@/context/NavigationContext'
import { useFileDrop } from '@/context/FileDropContext'

const PRODUCTS_PRICING_PAGE_ID = 'customer360'
const FOCUSED_VARIANT_IDS = ['customer-scenarios', 'no-customer-data']
const DEPRIORITIZED_GROUPS = ['Products and pricing', 'Account picker']

export function UseCaseSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { activeVariant, getPage, setActivePage, setVariant } = useUseCase()
  const { goToWorkbench } = useNavigation()
  const { shouldOpenModal, setShouldOpenModal } = useFileDrop()

  const page = getPage(PRODUCTS_PRICING_PAGE_ID)
  const variants = page?.variants ?? []
  const currentVariant = activeVariant ?? page?.defaultVariant ?? null
  const focusedVariants = variants.filter((variant) => FOCUSED_VARIANT_IDS.includes(variant.id))
  const groupedVariants = DEPRIORITIZED_GROUPS.map((group) => ({
    group,
    variants: variants.filter(
      (variant) => variant.group === group && !FOCUSED_VARIANT_IDS.includes(variant.id)
    ),
  }))

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

  const handleCustomerLinkToggle = () => {
    const nextValue = !shouldOpenModal
    setShouldOpenModal(nextValue)

    if (nextValue) {
      setActivePage('workbench')
      setVariant('unidentified')
      goToWorkbench()
    }
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
              <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-brand-mist">
                Focus
              </div>
              {focusedVariants.map((variant) => {
                const isActive = currentVariant === variant.id
                return (
                  <button
                    key={variant.id}
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
                    <span className="block min-w-0 flex-1 text-[13px] font-medium text-brand-navy">
                      {variant.label}
                    </span>
                  </button>
                )
              })}

              <button
                type="button"
                role="switch"
                aria-checked={shouldOpenModal}
                onClick={handleCustomerLinkToggle}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
              >
                <span className="text-[13px] font-medium text-brand-navy">
                  Customer linking modal
                </span>
                <span
                  className={cn(
                    'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                    shouldOpenModal ? 'bg-brand-navy' : 'bg-neutral-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                      shouldOpenModal ? 'translate-x-[18px]' : 'translate-x-0.5'
                    )}
                  />
                </span>
              </button>

              <div className="mx-3 my-2 border-t border-neutral-100" aria-hidden="true" />

              {groupedVariants.map(({ group, variants: groupVariants }) => {
                const isExpanded = expandedGroup === group
                const hasActiveVariant = groupVariants.some(
                  (variant) => variant.id === currentVariant
                )

                return (
                  <div key={group}>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedGroup(isExpanded ? null : group)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-brand-fog transition-colors hover:bg-neutral-50 hover:text-brand-navy"
                    >
                      <ChevronRight
                        size={14}
                        className={cn(
                          'shrink-0 transition-transform duration-200',
                          isExpanded && 'rotate-90'
                        )}
                      />
                      <span className="flex-1 text-[12px] font-semibold">{group}</span>
                      {hasActiveVariant ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-navy" />
                      ) : null}
                    </button>

                    <div
                      className={cn(
                        'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
                        isExpanded
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-3 border-l border-neutral-200 pl-2 pt-1">
                          {groupVariants.map((variant) => {
                            const isActive = currentVariant === variant.id
                            return (
                              <button
                                key={variant.id}
                                type="button"
                                onClick={() => handleSelectVariant(variant)}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                                  isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                                )}
                              >
                                <span
                                  className={cn(
                                    'h-1.5 w-1.5 shrink-0 rounded-full',
                                    isActive ? 'bg-brand-navy' : 'bg-neutral-300'
                                  )}
                                />
                                <span className="text-[12px] font-medium text-brand-navy">
                                  {variant.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
