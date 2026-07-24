import { useState, useRef, useEffect } from 'react'
import { GitBranch, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUseCase, type UseCaseVariant } from '@/context/UseCaseContext'
import { useNavigation } from '@/context/NavigationContext'

const SALES_ORDER_PAGE_ID = 'sales-order-details'

export function UseCaseSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const {
    activePage,
    activeVariant,
    getPage,
    setVariant,
    setActivePage,
  } = useUseCase()

  const { goToCustomer360 } = useNavigation()

  const salesOrderPage = getPage(SALES_ORDER_PAGE_ID)
  const variants = salesOrderPage?.variants ?? []
  const isOnSalesOrder = activePage === SALES_ORDER_PAGE_ID

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

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSelectVariant = (variant: UseCaseVariant) => {
    setActivePage(SALES_ORDER_PAGE_ID)
    setVariant(variant.id)
    goToCustomer360('pioneer-systems', {
      tab: 'sales-order',
      salesOrderId: 'so-pioneer-0153',
      returnTo: 'salesOrders',
    })
    setIsOpen(false)
  }

  return (
    <>
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
        title="Switch sales order stage"
      >
        <GitBranch size={18} />
      </button>

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
          <div className="border-b border-neutral-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-fog">
                Sales order stages
              </span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                Prototype
              </span>
            </div>
            <p className="mt-1 text-[13px] font-medium text-brand-navy">
              {salesOrderPage?.label ?? 'Sales Order Details'}
            </p>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            <div className="space-y-1">
              {variants.map((variant) => {
                const isActive = isOnSalesOrder && activeVariant === variant.id
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => handleSelectVariant(variant)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                        isActive
                          ? 'border-brand-navy bg-brand-navy'
                          : 'border-neutral-300 bg-white'
                      )}
                    >
                      {isActive && <Check size={10} className="text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-brand-navy">
                        {variant.label}
                      </span>
                      {variant.description && (
                        <span className="mt-0.5 block text-[12px] leading-snug text-brand-fog">
                          {variant.description}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
