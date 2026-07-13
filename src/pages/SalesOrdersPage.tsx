import { useState, useEffect, useRef } from 'react'
import { Search, ChevronRight, MoreVertical, ArrowRight } from 'lucide-react'
import { FilterUnit, type Filter } from '@/components/ui/FilterUnit'
import { cn, formatRelativeToNow } from '@/lib/utils'
import { useNavigation } from '@/context/NavigationContext'
import { SalesOrderPreview } from '@/components/features/sales-order'
import {
  salesOrdersListData,
  SALES_ORDER_STATUS_STYLES,
  isOrderExpired,
  isOrderNearingExpiry,
  type SalesOrderListItem,
} from '@/data/salesOrdersListMock'

function RelativeDate({ date }: { date: string }) {
  if (!date || date === '—') return <>{date}</>

  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return <>{date}</>

  return <>{formatRelativeToNow(parsed)}</>
}

export function SalesOrdersPage() {
  const { goToCustomer360 } = useNavigation()
  const [isHeaderSticky, setIsHeaderSticky] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [filters, setFilters] = useState<Filter[]>([])
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  const salesOrders = salesOrdersListData

  const getSalesOrderValue = (order: SalesOrderListItem, attribute: string): string => {
    switch (attribute) {
      case 'customer':
        return order.customer
      case 'soId':
        return order.soId
      case 'dealTag':
        return order.dealTag
      case 'status':
        return order.status
      default:
        return ''
    }
  }

  const applyFilters = (orders: SalesOrderListItem[]) => {
    if (filters.length === 0) return orders

    return orders.filter((order) =>
      filters.every((filter) => {
        const orderValue = getSalesOrderValue(order, filter.attribute)
        const filterValue = filter.value.toLowerCase()

        switch (filter.condition) {
          case 'is':
          case 'equals':
            return orderValue.toLowerCase() === filterValue
          case 'is_not':
          case 'not_equals':
            return orderValue.toLowerCase() !== filterValue
          case 'contains':
            return orderValue.toLowerCase().includes(filterValue)
          case 'does_not_contain':
            return !orderValue.toLowerCase().includes(filterValue)
          default:
            return true
        }
      })
    )
  }

  const filteredSalesOrders = applyFilters(salesOrders).filter((order) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      order.soId.toLowerCase().includes(query) ||
      order.customer.toLowerCase().includes(query) ||
      order.tcv.toLowerCase().includes(query) ||
      order.nextInvoice.toLowerCase().includes(query)
    )
  })

  const selectedOrder =
    selectedOrderId != null
      ? filteredSalesOrders.find((order) => order.id === selectedOrderId) ?? null
      : null

  useEffect(() => {
    if (selectedOrderId == null) return
    const stillVisible = filteredSalesOrders.some((order) => order.id === selectedOrderId)
    if (!stillVisible) {
      setSelectedOrderId(null)
    }
  }, [filteredSalesOrders, selectedOrderId])

  const openOrderDetails = (order: SalesOrderListItem) => {
    goToCustomer360(order.customerId, {
      tab: 'sales-order',
      salesOrderId: order.id,
      returnTo: 'salesOrders',
    })
  }

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
        setSearchQuery('')
      }
    }

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchOpen])

  const totalTcv = salesOrders.reduce((sum, order) => {
    return sum + parseFloat(order.tcv.replace(/[$,]/g, ''))
  }, 0)
  const formattedTcv =
    totalTcv >= 1_000_000
      ? `$${(totalTcv / 1_000_000).toFixed(1)}M`
      : `$${(totalTcv / 1_000).toFixed(0)}K`

  const expiredCount = salesOrders.filter((order) => isOrderExpired(order.expires)).length
  const nearingExpiryCount = salesOrders.filter(
    (order) => !isOrderExpired(order.expires) && isOrderNearingExpiry(order.expires)
  ).length

  const STATS = [
    { value: String(salesOrders.length), label: 'Total sales orders' },
    { value: formattedTcv, label: 'Total TCV' },
    { value: String(expiredCount), label: 'Expired' },
    { value: String(nearingExpiryCount), label: 'Nearing expiry' },
  ]

  useEffect(() => {
    const scrollContainer = contentRef.current
    const table = tableRef.current
    if (!scrollContainer || !table) return

    const handleScroll = () => {
      const tableTop = table.getBoundingClientRect().top
      const containerTop = scrollContainer.getBoundingClientRect().top
      setIsHeaderSticky(tableTop <= containerTop)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Header Section */}
      <div className="relative h-[60px] shrink-0">
        <div className="absolute left-6 bottom-1 flex flex-col justify-end">
          <div className="mb-0 flex items-center gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-[0] text-brand-fog">
              Sales orders
            </span>
            <ChevronRight size={10} className="text-brand-fog" />
          </div>
          <div className="flex items-center gap-3">
            <h1
              className="font-heading text-[24px] font-semibold text-brand-navy"
              style={{ letterSpacing: '-0.5px' }}
            >
              All sales orders
            </h1>
            <span className="text-[12px] font-medium text-brand-fog">
              {filteredSalesOrders.length} sales orders
            </span>
          </div>
        </div>

        <div className="absolute right-4 bottom-1.5 flex items-center gap-2.5">
          <div
            ref={searchContainerRef}
            className="relative flex items-center gap-1.5 overflow-hidden bg-white transition-all duration-300 ease-in-out"
            style={{
              width: isSearchOpen ? '240px' : '14px',
              paddingLeft: isSearchOpen ? '8px' : '0px',
              paddingRight: isSearchOpen ? '8px' : '0px',
            }}
          >
            <button
              onClick={() => !isSearchOpen && setIsSearchOpen(true)}
              className={cn(
                'shrink-0 transition-colors',
                isSearchOpen
                  ? 'cursor-default text-brand-navy'
                  : 'cursor-pointer text-brand-navy hover:text-brand-fog'
              )}
            >
              <Search size={14} />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('')
                  setIsSearchOpen(false)
                }
              }}
              placeholder="Search sales orders..."
              className={cn(
                'bg-transparent py-1.5 text-[13px] text-brand-navy placeholder:text-brand-navy outline-none transition-all duration-300 ease-in-out',
                isSearchOpen ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                fontSize: '12px',
                width: isSearchOpen ? 'calc(100% - 30px)' : '0px',
              }}
            />
          </div>
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={cn(
              'relative inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[13px] transition-colors',
              filters.length > 0 && isFilterExpanded
                ? 'bg-brand-navy text-white hover:bg-brand-soft'
                : 'text-brand-navy hover:bg-neutral-100'
            )}
          >
            <svg
              className={cn(
                'h-3 w-3',
                filters.length > 0 && isFilterExpanded ? 'text-white' : 'text-brand-mist'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="font-medium">Filter</span>
            {filters.length > 0 && !isFilterExpanded && (
              <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>
          <button className="inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] text-brand-navy transition-colors hover:bg-neutral-100">
            <span className="text-brand-fog">Sort:</span>
            <span className="font-medium">Created on</span>
            <svg className="h-3 w-3 text-brand-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-0 left-6 right-4 h-[1px] bg-brand-navy" />
      </div>

      <FilterUnit
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters)
          if (newFilters.length === 0) {
            setIsFilterExpanded(false)
          }
        }}
        isExpanded={isFilterExpanded}
      />

      <div ref={contentRef} className="flex-1 overflow-y-auto bg-white px-6 pt-4 pb-8">
        <div className="mx-auto max-w-[1560px] px-8">
          <div className="flex items-start pb-12 pl-4 pt-6">
            {STATS.map((stat, index) => (
              <div key={stat.label} className="flex flex-1 items-start">
                <div className="flex-1">
                  <div
                    className="font-heading text-[36px] font-bold leading-tight text-brand-navy"
                    style={{ letterSpacing: '-1px' }}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[13px] text-brand-navy">{stat.label}</div>
                </div>
                {index < STATS.length - 1 && <div className="mx-8 h-12 w-px bg-neutral-200" />}
              </div>
            ))}
          </div>

          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
          <table ref={tableRef} className="w-full table-fixed">
            <thead
              className="sticky -top-4 z-20 bg-white"
              style={
                !isHeaderSticky
                  ? { boxShadow: '0 -1px 0 0 #1c1b2e', backgroundColor: '#ffffff' }
                  : { backgroundColor: '#ffffff' }
              }
            >
              <tr className="bg-white">
                <th
                  className="relative z-20 bg-white py-1.5 pl-3 pr-2 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy"
                  style={{ width: 160, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}
                >
                  Customer
                </th>
                <th
                  className="relative z-20 bg-white py-1.5 pl-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy"
                  style={{ width: 110, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}
                >
                  Status
                </th>
                <th
                  className="relative z-20 bg-white py-1.5 pr-2 text-right text-[11px] font-medium uppercase tracking-normal text-brand-navy"
                  style={{ width: 88, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}
                >
                  TCV
                </th>
                <th
                  className="relative z-20 bg-white py-1.5 pl-2 pr-0 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy"
                  style={{ width: 108, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}
                >
                  Next invoice
                </th>
                <th
                  className="relative z-20 bg-white py-1.5 pl-1 pr-2 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy"
                  style={{ width: 84, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}
                >
                  Starts
                </th>
                <th
                  className="relative z-20 bg-white py-1.5 px-2 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy"
                  style={{ width: 88, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}
                >
                  Expires
                </th>
                <th
                  className="relative z-20 w-8 bg-white py-1.5 pr-2"
                  style={{ boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}
                />
              </tr>
            </thead>

            <tbody>
              {filteredSalesOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={24} className="text-brand-mist" />
                      <p className="text-[14px] text-brand-fog">
                        No sales orders found matching &quot;{searchQuery}&quot;
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 cursor-pointer text-[13px] text-blue-700 hover:underline"
                      >
                        Clear search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalesOrders.map((order) => {
                  const statusStyle = SALES_ORDER_STATUS_STYLES[order.status]
                  const isSelected = selectedOrder?.id === order.id

                  return (
                    <tr
                      key={order.id}
                      onClick={() =>
                        setSelectedOrderId((prev) => (prev === order.id ? null : order.id))
                      }
                      className={cn(
                        'group row-hover-trail cursor-pointer border-b border-neutral-100',
                        isSelected ? 'bg-brand-navy' : 'hover:bg-brand-navy'
                      )}
                    >
                      <td
                        className={cn(
                          'relative z-10 py-1 pl-3 pr-2 whitespace-nowrap text-[13px] font-medium',
                          isSelected ? 'text-white' : 'text-brand-navy group-hover:text-white'
                        )}
                      >
                        {order.customer}
                      </td>

                      <td className="relative z-10 py-0 pl-1 pr-4">
                        <div
                          className={cn(
                            'px-2 py-1 text-[13px] font-medium whitespace-nowrap',
                            isSelected
                              ? 'bg-white/20 text-white'
                              : cn(statusStyle.text, statusStyle.bg, 'group-hover:bg-white/20 group-hover:text-white')
                          )}
                        >
                          {order.status}
                        </div>
                      </td>

                      <td
                        className={cn(
                          'relative z-10 py-1 pr-2 text-right whitespace-nowrap text-[13px] font-medium',
                          isSelected ? 'text-white' : 'text-brand-navy group-hover:text-white'
                        )}
                      >
                        {order.tcv}
                      </td>

                      <td
                        className={cn(
                          'relative z-10 py-1 pl-2 pr-0 whitespace-nowrap text-[13px]',
                          isSelected ? 'text-white' : 'text-brand-navy group-hover:text-white'
                        )}
                      >
                        <span className="font-medium">{order.nextInvoice}</span>
                      </td>

                      <td
                        className={cn(
                          'relative z-10 py-1 pl-1 pr-2 whitespace-nowrap text-[13px]',
                          isSelected ? 'text-white' : 'text-brand-navy group-hover:text-white'
                        )}
                      >
                        <RelativeDate date={order.starts} />
                      </td>

                      <td
                        className={cn(
                          'relative z-10 px-2 py-1 whitespace-nowrap text-[13px]',
                          isSelected ? 'text-white' : 'text-brand-navy group-hover:text-white'
                        )}
                      >
                        <RelativeDate date={order.expires} />
                      </td>

                      <td className="relative z-10 py-1 pr-2 pl-1">
                        <button
                          type="button"
                          className={cn(
                            'flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-colors',
                            isSelected
                              ? 'text-white/70 hover:bg-white/10 hover:text-white'
                              : 'text-neutral-400 hover:bg-neutral-100 hover:text-brand-navy group-hover:text-white/70 group-hover:hover:bg-white/10 group-hover:hover:text-white'
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            openOrderDetails(order)
                          }}
                        >
                          <MoreVertical size={14} className={isSelected ? undefined : 'group-hover:hidden'} />
                          {!isSelected && (
                            <ArrowRight
                              size={14}
                              strokeWidth={2}
                              className="hidden text-white group-hover:block"
                            />
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
            </div>

            {selectedOrder && (
              <div className="sticky top-0 w-[480px] shrink-0 self-start">
                <SalesOrderPreview
                  listItem={selectedOrder}
                  onOpenDetails={() => openOrderDetails(selectedOrder)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesOrdersPage
