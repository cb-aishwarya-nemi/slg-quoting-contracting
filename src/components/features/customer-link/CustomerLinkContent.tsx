import { useState } from 'react'
import { Search, Sparkles, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { customerMatches, allCustomers, type CustomerMatch } from '@/data/customerLinkMock'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import {
  InlineEditField,
  InlineEditSelect,
  InlineEditCheckbox,
  InlineEditRadioGroup,
} from '@/components/ui/InlineEditField'
import { createCustomerDefaults, type CreateCustomerDefaults } from '@/data/customerLinkMock'

const TABS: TabItem[] = [
  { id: 'link', label: 'Link to existing' },
  { id: 'create', label: 'Create New' },
]

type Mode = 'link' | 'create'

interface CustomerLinkContentProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
  selectedCustomerId: string | null
  onSelectCustomer: (customer: CustomerMatch) => void
}

export function CustomerLinkContent({
  mode,
  onModeChange,
  selectedCustomerId,
  onSelectCustomer,
}: CustomerLinkContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllCustomers, setShowAllCustomers] = useState(false)
  const [formData, setFormData] = useState<CreateCustomerDefaults>(createCustomerDefaults)

  const displayedCustomers = showAllCustomers ? allCustomers : customerMatches
  
  const filteredCustomers = displayedCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.primaryContact.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTabChange = (tabId: string) => {
    onModeChange(tabId as Mode)
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
      {/* Header: Title + Tabs with horizontal line */}
      <div className="shrink-0 mb-4">
        <div className="relative flex items-end justify-between">
          <div className="flex items-center gap-3 pb-3">
            <h3 className="text-[15px] font-semibold text-brand-navy">
              {mode === 'link' ? 'Choose a customer' : 'Create New Customer'}
            </h3>
            {mode === 'link' && (
              <span className="text-[13px] font-medium ai-gradient-text">
                {customerMatches.length} matches
              </span>
            )}
          </div>
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

      {/* Content Area - Scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {mode === 'link' ? (
          <div className="flex flex-col">
            {/* Search Bar - Always visible */}
            <div className="mb-3 flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, domain, or ID"
                  className="w-full cursor-pointer rounded-lg bg-white py-2 pl-9 pr-3 text-[13px] text-brand-navy outline-none transition-colors placeholder:text-brand-navy hover:bg-neutral-100 focus:bg-white"
                />
              </div>
              <span className="text-[13px] text-brand-fog">
                {filteredCustomers.length} customers
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-white">
                  <tr className="border-t border-b border-neutral-200">
                    <th className="w-10 py-2 pl-3" />
                    <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy">
                      Customer
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy">
                      Status
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
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => onSelectCustomer(customer)}
                      className={cn(
                        'cursor-pointer border-b border-neutral-100 transition-colors last:border-b-0',
                        selectedCustomerId === customer.id
                          ? 'bg-neutral-100'
                          : 'hover:bg-neutral-50'
                      )}
                    >
                      <td className="py-1.5 pl-3">
                        <input
                          type="radio"
                          name="customer-select"
                          checked={selectedCustomerId === customer.id}
                          onChange={() => onSelectCustomer(customer)}
                          className="h-4 w-4 appearance-none rounded-full border border-neutral-300 bg-white checked:border-brand-navy checked:border-[5px] focus:outline-none focus:ring-2 focus:ring-neutral-200"
                        />
                      </td>
                      <td className="py-1.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                            <span className="text-[10px] font-medium text-brand-navy">
                              {customer.initials}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="whitespace-nowrap text-[14px] font-medium text-brand-navy">
                              {customer.name}
                            </span>
                            {customer.matchLabel && (
                              <span
                                title={customer.matchLabel}
                                className={cn(
                                  'inline-flex h-5 w-5 items-center justify-center rounded-full cursor-help',
                                  customer.matchLabel === 'Closest match'
                                    ? 'ai-gradient'
                                    : 'bg-violet-100'
                                )}
                              >
                                <Sparkles
                                  size={10}
                                  className={customer.matchLabel === 'Closest match' ? 'text-white' : 'text-violet-700'}
                                />
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium',
                            customer.status === 'Active'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-neutral-100 text-brand-fog'
                          )}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="py-1.5 pr-4 whitespace-nowrap text-[14px] text-brand-navy">
                        {customer.primaryContact}
                      </td>
                      <td className="py-1.5 pr-4 whitespace-nowrap text-[13px] text-brand-fog">
                        {customer.email}
                      </td>
                      <td className="py-1.5 pr-3 text-right whitespace-nowrap text-[13px] text-brand-fog">
                        {customer.createdAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* View all button */}
            <div className="mt-4 flex justify-center">
              {!showAllCustomers && (
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
                  Show matches only
                  <ChevronUp size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Create New Customer Form */
          <div className="mx-auto max-w-[520px] space-y-6">
            {/* Customer Info */}
            <section className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="mb-4 text-[15px] font-semibold text-brand-navy">Customer info</h3>
              <div className="space-y-4">
                <InlineEditField
                  label="Customer ID"
                  value={formData.customerId}
                  onChange={(v) => updateField('customerId', v)}
                  placeholder="Auto-generated if left blank"
                  helperText="ID used to uniquely identify the customer."
                />
                <InlineEditField
                  label="Email ID"
                  value={formData.emailId}
                  onChange={(v) => updateField('emailId', v)}
                  required
                  type="email"
                />
                <InlineEditField
                  label="First name"
                  value={formData.firstName}
                  onChange={(v) => updateField('firstName', v)}
                />
                <InlineEditField
                  label="Last name"
                  value={formData.lastName}
                  onChange={(v) => updateField('lastName', v)}
                />
                <InlineEditField
                  label="Company"
                  value={formData.company}
                  onChange={(v) => updateField('company', v)}
                  required
                />
                <InlineEditField
                  label="Phone"
                  value={formData.phone}
                  onChange={(v) => updateField('phone', v)}
                  type="tel"
                />
              </div>
            </section>

            {/* Additional Contacts */}
            <section className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="mb-4 text-[15px] font-semibold text-brand-navy">Additional contacts</h3>
              <div className="rounded-lg border-2 border-dashed border-neutral-200 p-4">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-medium text-brand-navy transition-colors hover:bg-neutral-50"
                >
                  <Plus size={14} />
                  Add new contact
                </button>
                <p className="mt-2 text-[12px] text-brand-fog">
                  Add team members whom you'd like to send invoice, payment, and other product-related emails.
                </p>
              </div>
            </section>

            {/* Essentials */}
            <section className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="mb-4 text-[15px] font-semibold text-brand-navy">Essentials</h3>
              <div className="space-y-4">
                <InlineEditSelect
                  label="Language"
                  value={formData.language}
                  onChange={(v) => updateField('language', v)}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'Spanish', label: 'Spanish' },
                    { value: 'French', label: 'French' },
                    { value: 'German', label: 'German' },
                  ]}
                  helperText="Used for the language of your checkout, Self-Serve Portal, invoices and emails."
                />
                <InlineEditSelect
                  label="Preferred currency"
                  value={formData.currency}
                  onChange={(v) => updateField('currency', v)}
                  options={[
                    { value: 'USD — US Dollar', label: 'USD — US Dollar' },
                    { value: 'EUR — Euro', label: 'EUR — Euro' },
                    { value: 'GBP — British Pound', label: 'GBP — British Pound' },
                    { value: 'INR — Indian Rupee', label: 'INR — Indian Rupee' },
                  ]}
                />
                <InlineEditCheckbox
                  label="Do not sync these invoices"
                  checked={formData.doNotSyncInvoices}
                  onChange={(v) => updateField('doNotSyncInvoices', v)}
                />
                <InlineEditRadioGroup
                  label="Auto-collection"
                  value={formData.autoCollection}
                  onChange={(v) => updateField('autoCollection', v as 'on' | 'off')}
                  options={[
                    { value: 'on', label: 'ON' },
                    { value: 'off', label: 'OFF' },
                  ]}
                />
                <InlineEditSelect
                  label="Payment terms"
                  value={formData.paymentTerms}
                  onChange={(v) => updateField('paymentTerms', v)}
                  options={[
                    { value: 'Net 30 (Site Default)', label: 'Net 30 (Site Default)' },
                    { value: 'Net 15', label: 'Net 15' },
                    { value: 'Net 45', label: 'Net 45' },
                    { value: 'Net 60', label: 'Net 60' },
                    { value: 'Due on receipt', label: 'Due on receipt' },
                  ]}
                />
              </div>
            </section>

            {/* Billing Address */}
            <section className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="mb-4 text-[15px] font-semibold text-brand-navy">Billing address</h3>
              <div className="space-y-4">
                <InlineEditSelect
                  label="Country"
                  value={formData.billingAddress.country}
                  onChange={(v) => updateBillingAddress('country', v)}
                  options={[
                    { value: 'United States', label: 'United States' },
                    { value: 'Canada', label: 'Canada' },
                    { value: 'United Kingdom', label: 'United Kingdom' },
                    { value: 'Germany', label: 'Germany' },
                    { value: 'India', label: 'India' },
                  ]}
                />
                <InlineEditField
                  label="First name"
                  value={formData.billingAddress.firstName}
                  onChange={(v) => updateBillingAddress('firstName', v)}
                />
                <InlineEditField
                  label="Last name"
                  value={formData.billingAddress.lastName}
                  onChange={(v) => updateBillingAddress('lastName', v)}
                />
                <InlineEditField
                  label="Email ID"
                  value={formData.billingAddress.email}
                  onChange={(v) => updateBillingAddress('email', v)}
                  type="email"
                />
                <InlineEditField
                  label="Company"
                  value={formData.billingAddress.company}
                  onChange={(v) => updateBillingAddress('company', v)}
                />
                <InlineEditField
                  label="Phone"
                  value={formData.billingAddress.phone}
                  onChange={(v) => updateBillingAddress('phone', v)}
                  type="tel"
                />
                <InlineEditField
                  label="Address line 1"
                  value={formData.billingAddress.addressLine1}
                  onChange={(v) => updateBillingAddress('addressLine1', v)}
                />
                <InlineEditField
                  label="Address line 2"
                  value={formData.billingAddress.addressLine2}
                  onChange={(v) => updateBillingAddress('addressLine2', v)}
                  placeholder="(optional)"
                />
                <InlineEditField
                  label="Address line 3"
                  value={formData.billingAddress.addressLine3}
                  onChange={(v) => updateBillingAddress('addressLine3', v)}
                  placeholder="(optional)"
                />
                <InlineEditField
                  label="City"
                  value={formData.billingAddress.city}
                  onChange={(v) => updateBillingAddress('city', v)}
                />
                <InlineEditField
                  label="Postal / Zip code"
                  value={formData.billingAddress.postalCode}
                  onChange={(v) => updateBillingAddress('postalCode', v)}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
