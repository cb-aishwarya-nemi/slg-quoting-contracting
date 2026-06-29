import { useState, useEffect, useRef } from 'react'
import { FilePlus2, List, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFileDrop } from '@/context/FileDropContext'
import cbLogo from '@/assets/cb-logo-squircle.svg'

interface ContractItem {
  id: number
  customer: string
  subject: string
  isActive?: boolean
}

interface ContractListCardProps {
  contracts: ContractItem[]
  onSelect: (contract: ContractItem) => void
  onClose: () => void
}

function ContractListCard({ contracts, onSelect, onClose }: ContractListCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    
    // Close on Escape
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])
  
  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute left-full top-0 ml-2 w-[320px] rounded-xl',
        'bg-theme-surface border border-theme-border',
        'shadow-[0_4px_16px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)]',
        'animate-in slide-in-from-left-2 duration-150'
      )}
    >
      {/* Header */}
      <div className="border-b border-theme-border px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-secondary">
          Contracts
        </span>
        <span className="ml-2 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-theme-primary">
          {contracts.length}
        </span>
      </div>
      
      {/* Contract List */}
      <div className="max-h-[400px] overflow-y-auto p-2">
        <div className="space-y-0.5">
          {contracts.map((contract) => (
            <button
              key={contract.id}
              type="button"
              onClick={() => onSelect(contract)}
              className={cn(
                'flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                contract.isActive
                  ? 'bg-orange-50'
                  : 'hover:bg-theme-hover'
              )}
            >
              <span
                className={cn(
                  'text-[13px] font-medium',
                  contract.isActive ? 'text-orange-700' : 'text-theme-primary'
                )}
              >
                {contract.customer}
              </span>
              <span className="line-clamp-2 text-[12px] leading-tight text-theme-secondary">
                {contract.subject}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface MinimalLeftNavProps {
  activeContractId?: number | null
  onNewContract: () => void
  onSelectContract: (contractId: number) => void
}

export function MinimalLeftNav({ 
  activeContractId, 
  onNewContract, 
  onSelectContract 
}: MinimalLeftNavProps) {
  const [isContractListOpen, setIsContractListOpen] = useState(false)
  const { workbenchItems } = useFileDrop()
  
  // Filter workbench items to get only contracts (items with contractId)
  const contracts: ContractItem[] = workbenchItems
    .filter(item => item.contractId)
    .map(item => ({
      id: item.id,
      customer: item.customer,
      subject: item.subject,
      isActive: item.id === activeContractId,
    }))
  
  const hasContracts = contracts.length > 0
  const isNewContractActive = !activeContractId
  const isContractListActive = !!activeContractId && hasContracts
  
  const handleContractListClick = () => {
    setIsContractListOpen(!isContractListOpen)
  }
  
  return (
    <nav
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen w-12 flex-col',
        'bg-theme-surface border-r border-theme-border'
      )}
    >
      {/* Logo + Site Switcher */}
      <div className="flex h-10 shrink-0 items-center justify-center px-1.5">
        <img src={cbLogo} alt="Chargebee" className="h-7 w-7 shrink-0 object-contain" />
      </div>
      
      {/* Divider */}
      <div className="mx-2 h-px bg-theme-border" />
      
      {/* Navigation Icons */}
      <div className="flex flex-col items-center gap-1 px-1.5 py-2">
        {/* New Contract */}
        <button
          type="button"
          onClick={onNewContract}
          className={cn(
            'group relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
            isNewContractActive
              ? 'bg-orange-100 text-orange-600'
              : 'text-theme-primary hover:bg-theme-hover'
          )}
          title="New Contract"
        >
          <FilePlus2 size={18} />
          {/* Tooltip */}
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-brand-navy px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            New Contract
          </span>
        </button>
        
        {/* Contract List - show if there are any contracts */}
        {hasContracts && (
          <div className="relative">
            <button
              type="button"
              onClick={handleContractListClick}
              className={cn(
                'group relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                isContractListActive
                  ? 'bg-orange-100 text-orange-600'
                  : isContractListOpen
                    ? 'bg-theme-hover text-theme-primary'
                    : 'text-theme-primary hover:bg-theme-hover'
              )}
              title="Contracts"
            >
              <List size={18} />
              {/* Badge showing count */}
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-navy text-[9px] font-semibold text-white">
                {contracts.length}
              </span>
            </button>
            
            {/* Click-toggle Card */}
            {isContractListOpen && (
              <ContractListCard
                contracts={contracts}
                onSelect={(contract) => {
                  onSelectContract(contract.id)
                  setIsContractListOpen(false)
                }}
                onClose={() => setIsContractListOpen(false)}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Site Switcher at bottom */}
      <div className="flex flex-col items-center gap-1 px-1.5 py-2">
        <button
          type="button"
          className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-theme-secondary transition-colors hover:bg-theme-hover hover:text-theme-primary"
          title="Switch site"
        >
          <ChevronsUpDown size={16} />
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-brand-navy px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            Switch site
          </span>
        </button>
      </div>
    </nav>
  )
}
