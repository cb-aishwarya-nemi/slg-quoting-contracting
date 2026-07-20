import { useEffect, useMemo, useState } from 'react'
import { X, Sparkles, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { SectionHeader, LabelValueList } from '@/components/features/contract-processing'
import {
  closestMatchCustomers,
  allCustomers,
  createCustomerDefaults,
  type CustomerMatch,
  type CreateCustomerDefaults,
} from '@/data/customerLinkMock'

type Mode = 'link' | 'create'

const TABS: TabItem[] = [
  { id: 'link', label: 'Choose a customer' },
  { id: 'create', label: 'Create new customer' },
]

interface CustomerMatchDrawerProps {
  open: boolean
  /** Currently selected customer name */
  value: string
  onSelect: (customerName: string) => void
  onCreateNew?: () => void
  onClose: () => void
  /** @deprecated Options list is replaced by the customer match table */
  options?: string[]
}

export function CustomerMatchDrawer({
  open,
  value,
  onSelect,
  onClose,
}: CustomerMatchDrawerProps) {
  const [mode, setMode] = useState<Mode>('link')
  const [showAllCustomers, setShowAllCustomers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<CreateCustomerDefaults>(createCustomerDefaults)
  const [pendingName, setPendingName] = useState(value)

  useEffect(() => {
    if (!open) {
      setMode('link')
      setShowAllCustomers(false)
      setSearchQuery('')
      setFormData(createCustomerDefaults)
      return
    }
    setPendingName(value)
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose, value])

  const customers = useMemo(() => {
    const source = showAllCustomers ? allCustomers : closestMatchCustomers
    const q = searchQuery.trim().toLowerCase()
    if (!q) return source
    return source.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.primaryContact.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    )
  }, [showAllCustomers, searchQuery])

  const selectedCustomer = useMemo(
    () =>
      [...closestMatchCustomers, ...allCustomers].find((c) => c.name === pendingName) ??
      null,
    [pendingName]
  )

  const canSave =
    mode === 'create' || (mode === 'link' && !!pendingName)

  const handleSelect = (customer: CustomerMatch) => {
    setPendingName(customer.name)
  }

  const handleSave = () => {
    if (mode === 'link' && pendingName) {
      onSelect(pendingName)
    }
    onClose()
  }

  const updateField = <K extends keyof CreateCustomerDefaults>(
    key: K,
    value: CreateCustomerDefaults[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const updateBillingAddress = <K extends keyof CreateCustomerDefaults['billingAddress']>(
    key: K,
    value: CreateCustomerDefaults['billingAddress'][K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: { ...prev.billingAddress, [key]: value },
    }))
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl bg-white shadow-xl',
          'animate-in fade-in duration-200'
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 px-6 py-4">
          <div>
            <h2
              key="drawer-match-title"
              className="text-gradient-shine font-heading text-[24px] font-semibold"
              style={{ letterSpacing: '-0.5px' }}
            >
              {`${closestMatchCustomers.length} close matches found`}
            </h2>
            <p className="text-[12px] text-brand-navy">
              Proceed by choosing a customer from the list.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={cn(
                'flex cursor-pointer items-center rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors',
                canSave
                  ? 'border-brand-navy bg-white text-brand-navy hover:bg-neutral-50'
                  : 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400'
              )}
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Tabs — same as customer link modal */}
        <div className="shrink-0 bg-white px-6 pt-2">
          <div className="relative flex items-end justify-center">
            <TrapezoidalTabs
              tabs={TABS}
              activeTab={mode}
              onTabChange={(tabId) => setMode(tabId as Mode)}
              compact
            />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-brand-navy" />
          </div>
        </div>

        <div
          className={cn(
            'relative min-h-0 flex-1 overflow-y-auto px-6 py-4',
            mode === 'link' && showAllCustomers && 'pb-16'
          )}
        >
          {mode === 'link' ? (
            <>
              <div className="mb-4 flex w-full max-w-md items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
                <Search size={14} className="shrink-0 text-brand-fog" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, domain, or ID"
                  className="w-full bg-transparent text-[13px] text-brand-navy outline-none placeholder:text-brand-fog"
                />
              </div>

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
                    {customers.map((customer) => {
                      const isClosestMatch = customer.matchLabel === 'Closest match'
                      const isPerfectMatch = customer.matchLabel === 'Perfect match'
                      const isSelected =
                        selectedCustomer?.id === customer.id || customer.name === pendingName

                      return (
                        <tr
                          key={customer.id}
                          onClick={() => handleSelect(customer)}
                          className={cn(
                            'group relative cursor-pointer border-b border-neutral-100 transition-colors last:border-b-0',
                            isSelected
                              ? 'bg-brand-navy'
                              : isPerfectMatch
                                ? 'bg-green-50/30 hover:bg-brand-navy'
                                : isClosestMatch
                                  ? 'bg-violet-50/30 hover:bg-brand-navy'
                                  : 'hover:bg-brand-navy'
                          )}
                        >
                          <td className="relative z-10 py-1.5 pl-3">
                            <input
                              type="radio"
                              name="customer-match-drawer-select"
                              checked={isSelected}
                              onChange={() => handleSelect(customer)}
                              className={cn(
                                'h-4 w-4 appearance-none rounded-full border focus:outline-none focus:ring-2',
                                isSelected
                                  ? 'border-white bg-brand-navy checked:border-[5px] checked:border-white focus:ring-white/30'
                                  : 'border-neutral-300 bg-white checked:border-[5px] checked:border-brand-navy focus:ring-neutral-200 group-hover:border-white group-hover:bg-brand-navy group-hover:checked:border-[5px] group-hover:checked:border-white'
                              )}
                            />
                          </td>
                          <td className="relative z-10 py-1.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                                  isSelected ? 'bg-white/20' : 'bg-neutral-100 group-hover:bg-white/20'
                                )}
                              >
                                <span
                                  className={cn(
                                    'text-[10px] font-medium',
                                    isSelected
                                      ? 'text-white'
                                      : 'text-brand-navy group-hover:text-white'
                                  )}
                                >
                                  {customer.initials}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    'whitespace-nowrap text-[14px] font-medium',
                                    isSelected
                                      ? 'text-white'
                                      : 'text-brand-navy group-hover:text-white'
                                  )}
                                >
                                  {customer.name}
                                </span>
                                {customer.matchLabel && (
                                  <span title={customer.matchLabel}>
                                    <Sparkles
                                      size={14}
                                      className={cn(
                                        'shrink-0',
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
                          <td
                            className={cn(
                              'relative z-10 whitespace-nowrap py-1.5 pr-4 text-[14px]',
                              isSelected
                                ? 'text-white'
                                : 'text-brand-navy group-hover:text-white'
                            )}
                          >
                            {customer.activeSubscriptions}
                          </td>
                          <td
                            className={cn(
                              'relative z-10 whitespace-nowrap py-1.5 pr-4 text-[14px]',
                              isSelected
                                ? 'text-white'
                                : 'text-brand-navy group-hover:text-white'
                            )}
                          >
                            {customer.primaryContact}
                          </td>
                          <td
                            className={cn(
                              'relative z-10 whitespace-nowrap py-1.5 pr-4 text-[13px]',
                              isSelected
                                ? 'text-white/70'
                                : 'text-brand-fog group-hover:text-white/70'
                            )}
                          >
                            {customer.email}
                          </td>
                          <td
                            className={cn(
                              'relative z-10 whitespace-nowrap py-1.5 pr-3 text-right text-[13px]',
                              isSelected
                                ? 'text-white/70'
                                : 'text-brand-fog group-hover:text-white/70'
                            )}
                          >
                            {customer.createdAt}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {!showAllCustomers && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllCustomers(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:text-blue-800"
                  >
                    View all customers
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mx-auto max-w-[680px] space-y-12 pb-6">
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
                        Company: 'company',
                        Phone: 'phone',
                      }
                      const field = fieldMap[label]
                      if (field) updateField(field, newValue)
                    }}
                  />
                </div>
              </section>

              <section>
                <SectionHeader title="Essentials" status="ready" minimal />
                <div className="mt-4">
                  <LabelValueList
                    items={[
                      {
                        label: 'Language',
                        value: formData.language,
                        options: ['English', 'Spanish', 'French', 'German'],
                      },
                      {
                        label: 'Preferred currency',
                        value: formData.currency,
                        options: [
                          'USD — US Dollar',
                          'EUR — Euro',
                          'GBP — British Pound',
                          'INR — Indian Rupee',
                        ],
                      },
                      {
                        label: 'Auto-collection',
                        value: formData.autoCollection === 'on' ? 'ON' : 'OFF',
                        options: ['ON', 'OFF'],
                      },
                      {
                        label: 'Payment terms',
                        value: formData.paymentTerms,
                        options: [
                          'Net 30 (Site Default)',
                          'Net 15',
                          'Net 45',
                          'Net 60',
                          'Due on receipt',
                        ],
                      },
                    ]}
                    onItemChange={(label, newValue) => {
                      if (label === 'Language') updateField('language', newValue)
                      else if (label === 'Preferred currency') updateField('currency', newValue)
                      else if (label === 'Auto-collection')
                        updateField('autoCollection', newValue === 'ON' ? 'on' : 'off')
                      else if (label === 'Payment terms') updateField('paymentTerms', newValue)
                    }}
                  />
                </div>
              </section>

              <section>
                <SectionHeader title="Billing address" status="ready" minimal />
                <div className="mt-4">
                  <LabelValueList
                    items={[
                      {
                        label: 'Country',
                        value: formData.billingAddress.country,
                        options: [
                          'United States',
                          'Canada',
                          'United Kingdom',
                          'Germany',
                          'India',
                        ],
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
                      const fieldMap: Record<
                        string,
                        keyof CreateCustomerDefaults['billingAddress']
                      > = {
                        Country: 'country',
                        'First name': 'firstName',
                        'Last name': 'lastName',
                        'Email ID': 'email',
                        Company: 'company',
                        Phone: 'phone',
                        'Address line 1': 'addressLine1',
                        'Address line 2': 'addressLine2',
                        City: 'city',
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

        {mode === 'link' && showAllCustomers && (
          <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-10 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllCustomers(false)}
              className="pointer-events-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-blue-700 shadow-lg transition-colors hover:bg-neutral-50 hover:text-blue-800"
            >
              Show matches only
              <ChevronUp size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default CustomerMatchDrawer
