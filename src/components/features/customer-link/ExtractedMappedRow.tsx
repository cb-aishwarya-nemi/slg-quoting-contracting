import { useState, useRef, useEffect } from 'react'
import { Building2, User, Mail, Phone, ArrowRight, MapPin, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { extractedCustomer, type CustomerMatch } from '@/data/customerLinkMock'

type Mode = 'link' | 'create'

interface ExtractedMappedRowProps {
  mappedCustomer: CustomerMatch | null
  mode: Mode
  onModeChange: (mode: Mode) => void
  onClearSelection: () => void
}

function ExtractedPopover() {
  return (
    <div className="absolute left-0 top-full z-[150] mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-[13px] font-semibold text-brand-navy">{extractedCustomer.companyName}</p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center gap-2 text-[12px] text-brand-fog">
          <User size={11} className="shrink-0" />
          <span>{extractedCustomer.contactName}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-brand-fog">
          <Mail size={11} className="shrink-0" />
          <span>{extractedCustomer.email}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-brand-fog">
          <Phone size={11} className="shrink-0" />
          <span>{extractedCustomer.phone || '+1 (555) 123-4567'}</span>
        </div>
        <div className="flex items-start gap-2 text-[12px] text-brand-fog">
          <MapPin size={11} className="mt-0.5 shrink-0" />
          <span>{extractedCustomer.address || '123 Business Ave, San Francisco, CA 94102'}</span>
        </div>
      </div>
    </div>
  )
}

function MappedPopover({ customer }: { customer: CustomerMatch }) {
  return (
    <div className="absolute right-0 top-full z-[150] mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-[13px] font-semibold text-brand-navy">{customer.name}</p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center gap-2 text-[12px] text-brand-fog">
          <User size={11} className="shrink-0" />
          <span>{customer.primaryContact}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-brand-fog">
          <Mail size={11} className="shrink-0" />
          <span>{customer.email}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-brand-fog">
          <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
            {customer.status}
          </span>
          <span className="text-brand-mist">•</span>
          <span>Created {customer.createdAt}</span>
        </div>
      </div>
    </div>
  )
}

export function ExtractedMappedRow({ mappedCustomer, mode, onModeChange, onClearSelection }: ExtractedMappedRowProps) {
  const [showExtractedPopover, setShowExtractedPopover] = useState(false)
  const [showMappedPopover, setShowMappedPopover] = useState(false)
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
      <div className="flex items-center gap-3">
        {/* Extracted Card */}
        <div className="flex-1">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
            Extracted Customer
          </p>
          <div
            className="relative"
            onMouseEnter={() => setShowExtractedPopover(true)}
            onMouseLeave={() => setShowExtractedPopover(false)}
          >
            <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 transition-colors hover:bg-neutral-50">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                <Building2 size={14} className="text-brand-navy" />
              </div>
              <span className="truncate text-[13px] font-medium text-brand-navy">
                {extractedCustomer.companyName}
              </span>
            </div>
            {showExtractedPopover && <ExtractedPopover />}
          </div>
        </div>
        
        {/* Arrow */}
        <div className="flex shrink-0 pt-5">
          <ArrowRight size={16} className="text-brand-mist" />
        </div>
        
        {/* Mapped To Dropdown */}
        <div className="flex-1">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-brand-fog">
            Mapped To
          </p>
          <div className="relative" ref={dropdownRef}>
            {/* When a customer is selected - show the customer with popover */}
            {mappedCustomer && mode === 'link' ? (
              <div
                onMouseEnter={() => setShowMappedPopover(true)}
                onMouseLeave={() => setShowMappedPopover(false)}
              >
                <div className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2 transition-colors hover:bg-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <span className="text-[10px] font-semibold text-blue-700">
                        {mappedCustomer.initials}
                      </span>
                    </div>
                    <span className="truncate text-[13px] font-medium text-brand-navy">
                      {mappedCustomer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClearSelection()
                      }}
                      className="shrink-0 rounded p-0.5 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-800"
                      title="Clear selection"
                    >
                      <X size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDropdown(!showDropdown)
                      }}
                      className="shrink-0 text-blue-700 hover:text-blue-800"
                    >
                      <ChevronsUpDown size={16} />
                    </button>
                  </div>
                </div>
                {showMappedPopover && <MappedPopover customer={mappedCustomer} />}
              </div>
            ) : (
              /* Dropdown selector */
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex w-full items-center justify-between rounded-lg border-2 border-dashed border-neutral-300 bg-white px-3 py-2 transition-colors hover:border-blue-300"
              >
                <span className="text-[13px] font-medium text-blue-700">
                  {mode === 'link' ? 'Choose a customer' : 'Create new customer'}
                </span>
                <ChevronsUpDown size={16} className="shrink-0 text-blue-700" />
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
