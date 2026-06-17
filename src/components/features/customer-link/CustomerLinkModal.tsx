import { useState, useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type WorkbenchItem } from '@/context/FileDropContext'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase } from '@/context/UseCaseContext'
import { type CustomerMatch } from '@/data/customerLinkMock'
import { ContractPreview } from './ContractPreview'
import { ExtractedMappedRow } from './ExtractedMappedRow'
import { CustomerLinkContent } from './CustomerLinkContent'

type Mode = 'link' | 'create'

interface CustomerLinkModalProps {
  task: WorkbenchItem
  onClose: () => void
}

export function CustomerLinkModal({ task: _task, onClose }: CustomerLinkModalProps) {
  const { goToCustomer360 } = useNavigation()
  const { setActivePage } = useUseCase()
  const [mode, setMode] = useState<Mode>('link')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMatch | null>(null)

  // Register modal as active page for use case switching
  useEffect(() => {
    setActivePage('customer-link-modal')
    return () => {
      // Clear to underlying page (workbench) when modal closes
      setActivePage('workbench')
    }
  }, [setActivePage])

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

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Modal Panel */}
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white">
        {/* Top Bar */}
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
            >
              <X size={18} />
            </button>
            <h1 className="font-heading text-[16px] font-semibold text-brand-navy" style={{ letterSpacing: '-0.5px' }}>
              Choose a customer or create new to process the contract
            </h1>
          </div>
          
          <button
            type="button"
            onClick={handleProcessContract}
            disabled={!canProcess}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 font-heading text-[14px] font-semibold transition-colors',
              canProcess
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'cursor-not-allowed bg-neutral-200 text-neutral-400'
            )}
          >
            Process Contract
            <ArrowRight size={16} />
          </button>
        </div>
        
        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-[35%_65%] gap-4 px-4 pb-4">
          {/* Left Column - Contract Preview */}
          <div className="min-h-0 overflow-hidden">
            <ContractPreview />
          </div>
          
          {/* Right Column - Interaction Area */}
          <div className="flex min-h-0 flex-col px-4">
            {/* Extracted/Mapped Row */}
            <div className="shrink-0 bg-white pb-6">
              <ExtractedMappedRow 
                mappedCustomer={selectedCustomer}
                mode={mode}
                onModeChange={handleModeChange}
                onClearSelection={() => setSelectedCustomer(null)}
              />
            </div>
            
            {/* Content Area */}
            <div className="min-h-0 flex-1">
              <CustomerLinkContent
                mode={mode}
                onModeChange={handleModeChange}
                selectedCustomerId={selectedCustomer?.id ?? null}
                onSelectCustomer={handleSelectCustomer}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
