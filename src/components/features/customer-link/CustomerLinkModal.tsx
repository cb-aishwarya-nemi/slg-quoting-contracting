import { useState, useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type WorkbenchItem } from '@/context/FileDropContext'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase } from '@/context/UseCaseContext'
import {
  type CustomerMatch,
  type CustomerLinkVariant,
  getCustomerMatchesByVariant,
} from '@/data/customerLinkMock'
import { ContractPreview } from './ContractPreview'
import { CustomerLinkContent } from './CustomerLinkContent'

type Mode = 'link' | 'create'

interface CustomerLinkModalProps {
  task: WorkbenchItem
  onClose: () => void
}

export function CustomerLinkModal({ task: _task, onClose }: CustomerLinkModalProps) {
  const { goToCustomer360 } = useNavigation()
  const { setActivePage, activeVariant, activePage, getPage } = useUseCase()
  const [mode, setMode] = useState<Mode>('link')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMatch | null>(null)

  // Get current variant for title generation
  const page = getPage('customer-link-modal')
  const variant: CustomerLinkVariant =
  activePage === 'customer-link-modal' && activeVariant
    ? (activeVariant as CustomerLinkVariant)
    : ((page?.defaultVariant as CustomerLinkVariant) ?? 'closest-matches')
  
  // Get matches for the current variant
  const matches = getCustomerMatchesByVariant(variant)

  // Register modal as active page for use case switching
  useEffect(() => {
    setActivePage('customer-link-modal')
    return () => {
      // Clear to underlying page (workbench) when modal closes
      setActivePage('workbench')
    }
  }, [setActivePage])

  // Auto-select customer for perfect match scenario
  useEffect(() => {
    if (variant === 'perfect-match') {
      if (matches.length === 1 && !selectedCustomer) {
        setSelectedCustomer(matches[0])
      }
    }
  }, [variant, matches, selectedCustomer])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSelectCustomer = (customer: CustomerMatch) => {
    setSelectedCustomer(customer)
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    if (newMode === 'create') {
      setSelectedCustomer(null)
    }
  }

  const canProcess = selectedCustomer !== null || mode === 'create'

  const handleProcessContract = () => {
    if (!canProcess) return
    onClose()
    goToCustomer360(selectedCustomer?.id ?? 'pioneer-systems')
  }

  // Generate title based on variant
  const getModalTitle = () => {
    if (variant === 'perfect-match') {
      return 'Perfect match found'
    } else if (variant === 'no-match') {
      return 'No match found'
    } else {
      // closest-matches
      const count = matches.length
      return `${count} close ${count === 1 ? 'match' : 'matches'} found`
    }
  }

  // Generate subtext based on variant
  const getModalSubtext = () => {
    if (variant === 'perfect-match') {
      return "Let's proceed to process the contract."
    } else if (variant === 'no-match') {
      return 'Create a new customer with the extracted details from the contract.'
    } else {
      // closest-matches
      return 'Proceed by choosing a customer from the list.'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Modal Panel */}
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white">
        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-[40%_60%] gap-4 py-4 pr-12">
          {/* Left Column - X button and Contract Preview */}
          <div className="flex min-h-0 flex-col pl-4">
            <div className="shrink-0 pb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
                >
                  <X size={18} />
                </button>
                <div className="flex flex-col">
                  <h1 className="font-heading text-[16px] font-semibold text-brand-navy" style={{ letterSpacing: '-0.5px' }}>
                    Contract processing…
                  </h1>
                  <p className="text-[12px] text-brand-fog">
                    Link customer to this contract and get started
                  </p>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden pl-8 pr-6">
              <ContractPreview />
            </div>
          </div>
          
          {/* Right Column - Interaction Area */}
          <div className="flex min-h-0 flex-col pl-6" style={{ paddingTop: 'calc(28px + 24px)' }}>
            {/* Title Section with CTA */}
            <div className="shrink-0 bg-white pb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-gradient-shine font-heading text-[24px] font-semibold" style={{ letterSpacing: '-0.5px' }}>
                    {getModalTitle()}
                  </h1>
                  <p className="text-[12px] text-brand-navy">
                    {getModalSubtext()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleProcessContract}
                  disabled={!canProcess}
                  className={cn(
                    'flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-4 py-2 font-heading text-[14px] font-semibold transition-colors',
                    canProcess
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'cursor-not-allowed bg-neutral-200 text-neutral-400'
                  )}
                >
                  Process Contract
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="min-h-0 flex-1">
              <CustomerLinkContent
                mode={mode}
                onModeChange={handleModeChange}
                selectedCustomerId={selectedCustomer?.id ?? null}
                onSelectCustomer={handleSelectCustomer}
                variant={variant}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
