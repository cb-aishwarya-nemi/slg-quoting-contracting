import { useState, useRef, useEffect } from 'react'
import { Building2, ArrowRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { extractedCustomer, type CustomerMatch } from '@/data/customerLinkMock'

type Mode = 'link' | 'create'

interface ExtractedMappedRowProps {
  mappedCustomer: CustomerMatch | null
  mode: Mode
  onModeChange: (mode: Mode) => void
  onClearSelection: () => void
}

export function ExtractedMappedRow({ mappedCustomer, mode, onModeChange, onClearSelection }: ExtractedMappedRowProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionSelect = (selectedMode: Mode) => {
    onModeChange(selectedMode)
    setShowDropdown(false)
  }

  return (
    <div className="mb-4">
      <div className="flex items-stretch gap-3">
        {/* Extracted Card */}
        <div className="flex flex-1 flex-col">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
            Extracted Customer
          </p>
          <div className="flex-1 rounded-lg border border-brand-navy bg-white px-4 py-3">
            {/* Header with icon and name */}
            <div className="flex items-center gap-2 pb-3 border-b border-brand-navy">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                <Building2 size={14} className="text-brand-navy" />
              </div>
              <span className="text-[13px] font-semibold text-brand-navy">
                {extractedCustomer.companyName}
              </span>
            </div>
            
            {/* Information list */}
            <div className="pt-3 space-y-2">
              <div className="flex items-start gap-2 text-[12px] text-brand-navy">
                <span className="shrink-0">•</span>
                <span>{extractedCustomer.contactName}</span>
              </div>
              <div className="flex items-start gap-2 text-[12px] text-brand-navy">
                <span className="shrink-0">•</span>
                <span className="break-all">{extractedCustomer.email}</span>
              </div>
              <div className="flex items-start gap-2 text-[12px] text-brand-navy">
                <span className="shrink-0">•</span>
                <span>{extractedCustomer.phone || '+1 (555) 123-4567'}</span>
              </div>
              <div className="flex items-start gap-2 text-[12px] text-brand-navy">
                <span className="shrink-0">•</span>
                <span>{extractedCustomer.address || '123 Business Ave, San Francisco, CA 94102'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Arrow */}
        <div className="flex shrink-0 items-center pt-7">
          <ArrowRight size={16} className="text-brand-mist" />
        </div>
        
        {/* Mapped To Box */}
        <div className="flex flex-1 flex-col relative">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
            Mapped To
          </p>
          
          <div className="relative flex-1" ref={dropdownRef}>
            {/* When a customer is selected */}
            {mappedCustomer && mode === 'link' ? (
              <div className="h-full rounded-lg border border-brand-navy px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.08) 100%)' }}>
                {/* Header with initials and name */}
                <div className="flex items-center gap-2 pb-3 border-b border-brand-navy">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-navy">
                    <span className="text-[10px] font-semibold text-white">
                      {mappedCustomer.initials}
                    </span>
                  </div>
                  <span className="text-[13px] font-semibold text-brand-navy">
                    {mappedCustomer.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearSelection()
                    }}
                    className="ml-auto shrink-0 rounded px-2 py-0.5 text-[12px] font-medium text-blue-700 transition-colors hover:text-blue-800"
                    title="Clear selection"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDropdown(!showDropdown)
                    }}
                    className="shrink-0 text-brand-navy hover:text-brand-fog"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                
                {/* Information list */}
                <div className="pt-3 space-y-2">
                  <div className="flex items-start gap-2 text-[12px] text-brand-navy">
                    <span className="shrink-0">•</span>
                    <span>{mappedCustomer.primaryContact}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[12px] text-brand-navy">
                    <span className="shrink-0">•</span>
                    <span className="break-all">{mappedCustomer.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[12px] text-brand-navy">
                    <span className="shrink-0">•</span>
                    <span>{mappedCustomer.activeSubscriptions} active subscription{mappedCustomer.activeSubscriptions !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[12px] text-brand-navy">
                    <span className="shrink-0">•</span>
                    <span>Created {mappedCustomer.createdAt}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state - dropdown selector */
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-white px-4 py-3 transition-colors hover:border-blue-300"
              >
                <span className="text-[13px] font-medium text-blue-700">
                  {mode === 'link' ? 'Choose a customer' : 'Create new customer'}
                </span>
              </button>
            )}
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute left-0 right-0 top-full z-[150] mt-1 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => handleOptionSelect('link')}
                  className={cn(
                    'flex w-full items-center px-3 py-2 text-left text-[13px] transition-colors hover:bg-neutral-50',
                    mode === 'link' ? 'font-medium text-blue-700' : 'text-brand-navy'
                  )}
                >
                  Choose a customer
                </button>
                <button
                  type="button"
                  onClick={() => handleOptionSelect('create')}
                  className={cn(
                    'flex w-full items-center px-3 py-2 text-left text-[13px] transition-colors hover:bg-neutral-50',
                    mode === 'create' ? 'font-medium text-blue-700' : 'text-brand-navy'
                  )}
                >
                  Create new customer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
