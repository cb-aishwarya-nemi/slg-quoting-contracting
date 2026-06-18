import { useState, useRef, useEffect } from 'react'
import { GitBranch, Check, Copy, ExternalLink, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUseCase, type UseCaseVariant, type UseCasePage } from '@/context/UseCaseContext'
import { useNavigation } from '@/context/NavigationContext'

export function UseCaseSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const {
    activePage,
    activeVariant,
    registry,
    getPage,
    setVariant,
    setActivePage,
    getShareableUrl,
  } = useUseCase()
  
  const { goToWorkbench, goToCustomer360, goToInvoiceDetails, goToAllInvoices } = useNavigation()
  
  // Get current page info
  const currentPage = activePage ? getPage(activePage) : null
  const variants = currentPage?.variants ?? []
  
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
  
  // Copy shareable URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getShareableUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }
  
  // Handle variant selection
  const handleSelectVariant = (variant: UseCaseVariant) => {
    setVariant(variant.id)
    setIsOpen(false)
  }
  
  // Handle page navigation
  const handleNavigateToPage = (page: UseCasePage) => {
    // Set the page and its default variant
    setActivePage(page.id)
    setVariant(page.defaultVariant)
    
    // Navigate based on page type
    switch (page.id) {
      case 'workbench':
        goToWorkbench()
        break
      case 'customer360':
        goToCustomer360('pioneer-systems')
        break
      case 'invoice-details':
        goToInvoiceDetails('INV-2026-0542')
        break
      case 'all-invoices':
        goToAllInvoices('pioneer-systems')
        break
      case 'customer-link-modal':
        // Modal - navigate to workbench and trigger modal opening
        goToWorkbench()
        // Add URL parameter to trigger modal opening, then dispatch custom event
        setTimeout(() => {
          const url = new URL(window.location.href)
          url.searchParams.set('openModal', 'customer-link')
          window.history.pushState({}, '', url.toString())
          // Dispatch custom event to trigger the check
          window.dispatchEvent(new CustomEvent('openModalParam'))
        }, 100)
        break
    }
    
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
            {currentPage && (
              <p className="mt-1 text-[13px] font-medium text-brand-navy">
                {currentPage.label}
              </p>
            )}
          </div>
          
          {/* Variants List */}
          <div className="max-h-[320px] overflow-y-auto p-2">
            {currentPage ? (
              <div className="space-y-1">
                {variants.map((variant) => {
                  const isActive = activeVariant === variant.id
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleSelectVariant(variant)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        isActive
                          ? 'bg-neutral-100'
                          : 'hover:bg-neutral-50'
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
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            'block text-[13px] font-medium',
                            isActive ? 'text-brand-navy' : 'text-brand-navy'
                          )}
                        >
                          {variant.label}
                        </span>
                        {variant.description && (
                          <span className="block mt-0.5 text-[12px] text-brand-fog leading-snug">
                            {variant.description}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="px-3 py-8 text-center">
                <p className="text-[13px] text-brand-fog">
                  No page selected
                </p>
                <p className="mt-1 text-[12px] text-brand-mist">
                  Navigate to a page to see available variants
                </p>
              </div>
            )}
          </div>
          
          {/* All Pages (collapsed section) */}
          <div className="border-t border-neutral-100">
            <details className="group" open={!currentPage}>
              <summary className="flex cursor-pointer items-center justify-between px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-brand-fog hover:text-brand-navy transition-colors">
                All pages
                <svg
                  className="h-3 w-3 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="border-t border-neutral-50 p-2 pt-1">
                {registry.map((page) => {
                  const isCurrent = page.id === activePage
                  const isModal = page.id === 'customer-link-modal'
                  
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => handleNavigateToPage(page)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[12px] text-left transition-colors',
                        isCurrent
                          ? 'bg-neutral-100 font-medium text-brand-navy'
                          : 'text-brand-fog hover:bg-neutral-50 hover:text-brand-navy'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {page.label}
                        {isCurrent && (
                          <span className="text-brand-mist">(current)</span>
                        )}
                        {isModal && !isCurrent && (
                          <span className="text-[10px] text-brand-mist">(modal)</span>
                        )}
                      </span>
                      {!isCurrent && (
                        <ChevronRight size={12} className="text-brand-mist" />
                      )}
                    </button>
                  )
                })}
              </div>
            </details>
          </div>
          
          {/* Footer - Share URL */}
          <div className="border-t border-neutral-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors',
                  copied
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-neutral-200 bg-white text-brand-navy hover:bg-neutral-50'
                )}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy shareable URL
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.open(getShareableUrl(), '_blank')}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-neutral-200 text-brand-fog transition-colors hover:bg-neutral-50 hover:text-brand-navy"
                title="Open in new tab"
              >
                <ExternalLink size={14} />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-brand-mist text-center">
              Share this URL with stakeholders to view this exact state
            </p>
          </div>
        </div>
      )}
    </>
  )
}
