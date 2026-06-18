import { useState, useEffect } from 'react'
import { X, Search, ArrowLeft } from 'lucide-react'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase } from '@/context/UseCaseContext'
import { contractListData, CONTRACT_STATUS_STYLES } from '@/data/contractListMock'
import { cn } from '@/lib/utils'

const CONTRACT_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'threads', label: 'Threads' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'collections', label: 'Collections' },
  { id: 'revrec', label: 'Revrec' },
]

export function AllContractsPage() {
  const { goToWorkbench } = useNavigation()
  const { setActivePage } = useUseCase()
  const data = contractListData
  const [activeTab, setActiveTab] = useState('contracts')
  
  // Register this page with use case context
  useEffect(() => {
    setActivePage('all-contracts')
  }, [setActivePage])

  return (
    <div className="flex h-full flex-col">
      {/* Primary nav — back, customer name + tabs centered */}
      <div className="relative h-[48px] shrink-0">
        {/* Left section — back button, customer name */}
        <div className="absolute bottom-0 left-6 flex items-center gap-3 pb-[7px]">
          <button
            type="button"
            onClick={goToWorkbench}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
            title="Back to Workbench"
          >
            <ArrowLeft size={18} />
          </button>
          <h1
            className="font-heading text-[16px] font-semibold text-brand-navy"
            style={{ letterSpacing: '-0.5px' }}
          >
            {data.customerName}
          </h1>
        </div>

        {/* Center section — tabs centered */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <TrapezoidalTabs
            tabs={CONTRACT_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            compact
          />
        </div>
        <div className="absolute bottom-0 left-6 right-4 h-px bg-brand-navy" />
      </div>

      {/* Secondary nav */}
      <div className="mx-auto w-full max-w-[1560px] px-14">
        <div className="flex items-center py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToWorkbench}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
              title="Close"
            >
              <X size={18} />
            </button>
            <div className="text-[13px] font-bold uppercase tracking-[-0.25px] text-brand-navy">
              All contracts
            </div>
          </div>

          <div className="flex-1" />

          {/* Filter/Sort controls */}
          <div className="flex items-center gap-2.5">
            <button className="text-brand-navy hover:text-brand-fog transition-colors">
              <Search size={14} />
            </button>
            <button className="inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] text-brand-navy transition-colors hover:bg-neutral-100">
              <svg className="h-3 w-3 text-brand-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium">Filter</span>
            </button>
            <button className="inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] text-brand-navy transition-colors hover:bg-neutral-100">
              <span className="text-brand-fog">Sort:</span>
              <span className="font-medium">Date</span>
              <svg className="h-3 w-3 text-brand-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Light grey line */}
        <div className="h-px bg-neutral-200" />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white px-14 pt-4 pb-8">
        <div className="mx-auto max-w-[1560px] px-8">
          {/* Stats Section - spread across width with vertical separators */}
          <div className="flex items-start pb-10">
            {data.stats.map((stat, index) => (
              <div key={index} className="flex flex-1 items-start">
                <div className="flex-1">
                  <div
                    className="font-heading text-[36px] font-bold leading-tight text-brand-navy"
                    style={{ letterSpacing: '-1px' }}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[13px] text-brand-fog">
                    {stat.label}
                  </div>
                </div>
                {index < data.stats.length - 1 && (
                  <div className="mx-8 h-12 w-px bg-neutral-200" />
                )}
              </div>
            ))}
          </div>

          {/* Contracts Table - with horizontal scroll if needed */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-y border-neutral-200">
                <tr>
                  <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 150 }}>
                    Contract ID
                  </th>
                  <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 140 }}>
                    Status
                  </th>
                  <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 120 }}>
                    Type
                  </th>
                  <th className="py-2 pr-4 text-right text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 140 }}>
                    Value
                  </th>
                  <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 130 }}>
                    Effective date
                  </th>
                  <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 130 }}>
                    End date
                  </th>
                  <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 100 }}>
                    Term
                  </th>
                  <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 100 }}>
                    Auto-renew
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.contracts.map((contract) => {
                  const statusStyle = CONTRACT_STATUS_STYLES[contract.status]
                  return (
                    <tr
                      key={contract.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <td className="py-2 pr-4 text-[14px] font-medium text-brand-navy">
                        {contract.contractId}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap',
                            statusStyle.bg,
                            statusStyle.text
                          )}
                        >
                          {contract.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[12px] font-medium text-brand-navy whitespace-nowrap">
                          {contract.type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right text-[14px] text-brand-navy">
                        {contract.value}
                      </td>
                      <td className="py-2 pr-4 text-[13px] text-brand-fog">
                        {contract.effectiveDate}
                      </td>
                      <td className="py-2 pr-4 text-[13px] text-brand-fog">
                        {contract.endDate}
                      </td>
                      <td className="py-2 pr-4 text-[13px] text-brand-fog">
                        {contract.term}
                      </td>
                      <td className="py-2 pr-4 text-[13px] text-brand-fog">
                        {contract.autoRenew}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AllContractsPage
