import { useState, useEffect, useMemo } from 'react'
import { Search, Sparkles, ChevronDown, ChevronUp, Plus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  allCustomers, 
  type CustomerMatch,
  type CustomerLinkVariant,
  getCustomerMatchesByVariant,
} from '@/data/customerLinkMock'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { SectionHeader, LabelValueList } from '@/components/features/contract-processing'
import { createCustomerDefaults, type CreateCustomerDefaults } from '@/data/customerLinkMock'
import { useUseCase } from '@/context/UseCaseContext'

type Mode = 'link' | 'create'

interface CustomerLinkContentProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
  selectedCustomerId: string | null
  onSelectCustomer: (customer: CustomerMatch) => void
  variant?: CustomerLinkVariant
  extractedMappedRow?: React.ReactNode
}

export function CustomerLinkContent({
  mode,
  onModeChange,
  selectedCustomerId,
  onSelectCustomer,
  variant: variantProp,
  extractedMappedRow,
}: CustomerLinkContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllCustomers, setShowAllCustomers] = useState(false)
  const [formData, setFormData] = useState<CreateCustomerDefaults>(createCustomerDefaults)
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false)
  
  // Get current use case variant from context
  const { activeVariant, activePage, getPage } = useUseCase()
  const page = getPage('customer-link-modal')
  const variantFromContext: CustomerLinkVariant = 
    activePage === 'customer-link-modal' && activeVariant 
      ? (activeVariant as CustomerLinkVariant) 
      : (page?.defaultVariant as CustomerLinkVariant) || 'closest-matches'
  
  // Use prop variant if provided, otherwise use context variant
  const variant = variantProp ?? variantFromContext
  
  // Dynamic tabs - swap order for no-match variant
  const TABS: TabItem[] = variant === 'no-match'
    ? [
        { id: 'create', label: 'Create new customer' },
        { id: 'link', label: 'Choose a customer' },
      ]
    : [
        { id: 'link', label: 'Choose a customer' },
        { id: 'create', label: 'Create new customer' },
      ]
  
  // Get customer matches based on current variant
  const customerMatches = useMemo(() => {
    return getCustomerMatchesByVariant(variant)
  }, [variant])
  
  // Determine if we should show "no matches" state
  const hasNoMatches = customerMatches.length === 0
  const hasPerfectMatch = variant === 'perfect-match' && customerMatches.length === 1
  
  // Reset mode and auto-switch flag when variant changes
  useEffect(() => {
    setHasAutoSwitched(false)
    // Reset to "link" mode when variant changes to one with matches
    if (!hasNoMatches) {
      onModeChange('link')
    }
  }, [variant, hasNoMatches, onModeChange])

  // Auto-switch to "Create New" tab when no matches found (only once per variant change)
  useEffect(() => {
    if (hasNoMatches && mode === 'link' && !hasAutoSwitched) {
      onModeChange('create')
      setHasAutoSwitched(true)
    }
  }, [hasNoMatches, mode, onModeChange, hasAutoSwitched])

  const displayedCustomers = showAllCustomers ? allCustomers : customerMatches
  
  const filteredCustomers = displayedCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.primaryContact.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTabChange = (tabId: string) => {
    onModeChange(tabId as Mode)
    // Mark as manually switched to prevent auto-switch back
    setHasAutoSwitched(true)
  }

  const updateField = <K extends keyof CreateCustomerDefaults>(
    key: K,
    value: CreateCustomerDefaults[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const updateBillingAddress = <K extends keyof CreateCustomerDefaults['billingAddress']>(
    key: K,
    value: CreateCustomerDefaults['billingAddress'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      billingAddress: { ...prev.billingAddress, [key]: value },
    }))
  }

  return (
    <div className="flex h-full flex-col">
      {/* Content Area - Scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Extracted/Mapped Row - for no-match variant only, scrolls with content */}
        {extractedMappedRow && (
          <div className="bg-white pb-4">
            {extractedMappedRow}
          </div>
        )}

        {/* Tabs with horizontal line - sticky when scrolling (for no-match), regular otherwise */}
        <div className={cn(
          "shrink-0 mb-3 bg-white pt-[2px]",
          extractedMappedRow && "sticky top-0 z-10"
        )}>
          <div className="relative flex items-end justify-center">
            <TrapezoidalTabs
              tabs={TABS}
              activeTab={mode}
              onTabChange={handleTabChange}
              compact
            />
            {/* Horizontal line that tabs sit on */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-brand-navy" />
          </div>
        </div>
        {/* Main content */}
        {mode === 'link' ? (
          <div className="flex flex-col">
            {/* No Matches Empty State */}
            {hasNoMatches && !showAllCustomers ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                  <AlertCircle size={28} className="text-amber-500" />
                </div>
                <h4 className="mt-4 text-[15px] font-semibold text-brand-navy">
                  No matching customers found
                </h4>
                <p className="mt-2 max-w-xs text-center text-[13px] text-brand-fog">
                  We couldn't find any existing customers that match "Pioneer Systems" in your records.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAllCustomers(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-brand-navy transition-colors hover:bg-neutral-50"
                  >
                    <Search size={14} />
                    Search all customers
                  </button>
                  <button
                    type="button"
                    onClick={() => onModeChange('create')}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-orange-600"
                  >
                    <Plus size={14} />
                    Create new customer
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Search Bar - Center aligned */}
                <div className="mb-2 flex items-center justify-center">
                  <div className="flex w-full max-w-md items-center justify-center gap-2 rounded-lg bg-white py-2 px-3 transition-colors hover:bg-neutral-100">
                    <Search size={14} className="shrink-0 text-brand-navy" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, domain, or ID"
                      className="cursor-pointer bg-transparent text-[13px] text-brand-navy outline-none placeholder:text-brand-navy"
                      style={{ width: '200px' }}
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-white">
                      <tr className="border-t border-b border-brand-navy">
                        <th className="w-10 py-2 pl-3" />
                        <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy">
                          Customer
                        </th>
                        <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy">
                          Active Subscriptions
                        </th>
                        <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy">
                          Name
                        </th>
                        <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy">
                          Email
                        </th>
                        <th className="py-2 pr-3 text-right text-[11px] font-normal uppercase tracking-wider text-brand-navy">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => {
                        const isClosestMatch = customer.matchLabel === 'Closest match'
                        const isPerfectMatch = hasPerfectMatch && customer.matchLabel === 'Perfect match'
                        const isSelected = selectedCustomerId === customer.id
                        
                        return (
                          <tr
                            key={customer.id}
                            onClick={() => onSelectCustomer(customer)}
                            className={cn(
                              'group cursor-pointer border-b border-neutral-100 transition-colors last:border-b-0 relative',
                              isSelected
                                ? 'bg-brand-navy'
                                : isPerfectMatch
                                  ? 'bg-green-50/30 hover:bg-brand-navy animate-highlight-row'
                                  : isClosestMatch
                                    ? 'bg-violet-50/30 hover:bg-brand-navy'
                                    : 'hover:bg-brand-navy'
                            )}
                          >
                            <td className="py-1.5 pl-3 relative z-10">
                              {/* Sweep animation for perfect match */}
                              {isPerfectMatch && (
                                <span className="row-sweep-overlay-table" aria-hidden="true">
                                  <span className="row-sweep-band" />
                                </span>
                              )}
                              {/* Sweep animation for closest match */}
                              {isClosestMatch && (
                                <span className="row-sweep-overlay-table" aria-hidden="true">
                                  <span className="row-sweep-band" />
                                </span>
                              )}
                              <input
                                type="radio"
                                name="customer-select"
                                checked={isSelected || isPerfectMatch}
                                onChange={() => onSelectCustomer(customer)}
                                className={cn(
                                  "h-4 w-4 appearance-none rounded-full border focus:outline-none focus:ring-2",
                                  isSelected
                                    ? "border-white bg-brand-navy checked:border-white checked:border-[5px] focus:ring-white/30"
                                    : "border-neutral-300 bg-white checked:border-brand-navy checked:border-[5px] focus:ring-neutral-200 group-hover:border-white group-hover:bg-brand-navy group-hover:checked:border-white group-hover:checked:border-[5px]"
                                )}
                              />
                            </td>
                            <td className="py-1.5 pr-4 relative z-10">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                                  isSelected ? "bg-white/20" : "bg-neutral-100 group-hover:bg-white/20"
                                )}>
                                  <span className={cn(
                                    "text-[10px] font-medium",
                                    isSelected ? "text-white" : "text-brand-navy group-hover:text-white"
                                  )}>
                                    {customer.initials}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "whitespace-nowrap text-[14px] font-medium",
                                    isSelected ? "text-white" : "text-brand-navy group-hover:text-white"
                                  )}>
                                    {customer.name}
                                  </span>
                                  {customer.matchLabel && (
                                    <span title={customer.matchLabel}>
                                      <Sparkles
                                        size={14}
                                        className={cn(
                                          'cursor-help shrink-0',
                                          isSelected
                                            ? 'text-white/70'
                                            : customer.matchLabel === 'Perfect match'
                                              ? 'text-green-600 group-hover:text-white/70'
                                              : customer.matchLabel === 'Closest match'
                                                ? 'text-violet-600 group-hover:text-white/70'
                                                : 'text-violet-500 group-hover:text-white/70'
                                        )}
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className={cn(
                              "py-1.5 pr-4 whitespace-nowrap text-[14px] relative z-10",
                              isSelected ? "text-white" : "text-brand-navy group-hover:text-white"
                            )}>
                              {customer.activeSubscriptions}
                            </td>
                            <td className={cn(
                              "py-1.5 pr-4 whitespace-nowrap text-[14px] relative z-10",
                              isSelected ? "text-white" : "text-brand-navy group-hover:text-white"
                            )}>
                              {customer.primaryContact}
                            </td>
                            <td className={cn(
                              "py-1.5 pr-4 whitespace-nowrap text-[13px] relative z-10",
                              isSelected ? "text-white/70" : "text-brand-fog group-hover:text-white/70"
                            )}>
                              {customer.email}
                            </td>
                            <td className={cn(
                              "py-1.5 pr-3 text-right whitespace-nowrap text-[13px] relative z-10",
                              isSelected ? "text-white/70" : "text-brand-fog group-hover:text-white/70"
                            )}>
                              {customer.createdAt}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* View all button */}
                <div className="mt-4 flex justify-center">
                  {!showAllCustomers && !hasNoMatches && (
                    <button
                      type="button"
                      onClick={() => setShowAllCustomers(true)}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:text-blue-800"
                    >
                      View all customers
                      <ChevronDown size={14} />
                    </button>
                  )}
                  {showAllCustomers && (
                    <button
                      type="button"
                      onClick={() => setShowAllCustomers(false)}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:text-blue-800"
                    >
                      {hasNoMatches ? 'Back to empty state' : 'Show matches only'}
                      <ChevronUp size={14} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Create New Customer Form - matching contract processing page style */
          <div className="mx-auto max-w-[680px] space-y-12 pt-6">
            {/* Customer Info */}
            <section>
              <SectionHeader title="Customer info" status="ready" minimal />
              <div className="mt-4">
                <LabelValueList 
                  items={[
                    { label: 'Customer ID', value: formData.customerId || 'Auto-generated' },
                    { label: 'Email ID', value: formData.emailId },
                    { label: 'First name', value: formData.firstName },
                    { label: 'Last name', value: formData.lastName },
                    { label: 'Company', value: formData.company },
                    { label: 'Phone', value: formData.phone },
                  ]}
                  onItemChange={(label, newValue) => {
                    const fieldMap: Record<string, keyof CreateCustomerDefaults> = {
                      'Customer ID': 'customerId',
                      'Email ID': 'emailId',
                      'First name': 'firstName',
                      'Last name': 'lastName',
                      'Company': 'company',
                      'Phone': 'phone',
                    }
                    const field = fieldMap[label]
                    if (field) updateField(field, newValue)
                  }}
                />
              </div>
            </section>

            {/* Essentials */}
            <section>
              <SectionHeader title="Essentials" status="ready" minimal />
              <div className="mt-4">
                <LabelValueList
                  items={[
                    { 
                      label: 'Language', 
                      value: formData.language,
                      options: ['English', 'Spanish', 'French', 'German']
                    },
                    { 
                      label: 'Preferred currency', 
                      value: formData.currency,
                      options: ['USD — US Dollar', 'EUR — Euro', 'GBP — British Pound', 'INR — Indian Rupee']
                    },
                    { 
                      label: 'Auto-collection', 
                      value: formData.autoCollection === 'on' ? 'ON' : 'OFF',
                      options: ['ON', 'OFF']
                    },
                    { 
                      label: 'Payment terms', 
                      value: formData.paymentTerms,
                      options: ['Net 30 (Site Default)', 'Net 15', 'Net 45', 'Net 60', 'Due on receipt']
                    },
                  ]}
                  onItemChange={(label, newValue) => {
                    if (label === 'Language') updateField('language', newValue)
                    else if (label === 'Preferred currency') updateField('currency', newValue)
                    else if (label === 'Auto-collection') updateField('autoCollection', newValue === 'ON' ? 'on' : 'off')
                    else if (label === 'Payment terms') updateField('paymentTerms', newValue)
                  }}
                />
              </div>
            </section>

            {/* Billing Address */}
            <section>
              <SectionHeader title="Billing address" status="ready" minimal />
              <div className="mt-4">
                <LabelValueList
                  items={[
                    { 
                      label: 'Country', 
                      value: formData.billingAddress.country,
                      options: ['United States', 'Canada', 'United Kingdom', 'Germany', 'India']
                    },
                    { label: 'First name', value: formData.billingAddress.firstName },
                    { label: 'Last name', value: formData.billingAddress.lastName },
                    { label: 'Email ID', value: formData.billingAddress.email },
                    { label: 'Company', value: formData.billingAddress.company },
                    { label: 'Phone', value: formData.billingAddress.phone },
                    { label: 'Address line 1', value: formData.billingAddress.addressLine1 },
                    { label: 'Address line 2', value: formData.billingAddress.addressLine2 },
                    { label: 'City', value: formData.billingAddress.city },
                    { label: 'Postal / Zip code', value: formData.billingAddress.postalCode },
                  ]}
                  onItemChange={(label, newValue) => {
                    const fieldMap: Record<string, keyof CreateCustomerDefaults['billingAddress']> = {
                      'Country': 'country',
                      'First name': 'firstName',
                      'Last name': 'lastName',
                      'Email ID': 'email',
                      'Company': 'company',
                      'Phone': 'phone',
                      'Address line 1': 'addressLine1',
                      'Address line 2': 'addressLine2',
                      'City': 'city',
                      'Postal / Zip code': 'postalCode',
                    }
                    const field = fieldMap[label]
                    if (field) updateBillingAddress(field, newValue)
                  }}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
