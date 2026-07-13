import { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronRight, MoreVertical, ArrowRight } from "lucide-react";
import { FilterUnit, type Filter } from "@/components/ui/FilterUnit";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/context/NavigationContext";
import { customersListData, STATUS_STYLES, type CustomerListItem } from "@/data/customersListMock";

const PIONEER_CUSTOMER_ID = 'pioneer-systems';

export function CustomersPage() {
  const { goToCustomer360 } = useNavigation();
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const customers = customersListData;

  // Apply filters
  const applyFilters = (customersList: CustomerListItem[]) => {
    if (filters.length === 0) return customersList;

    return customersList.filter(customer => {
      return filters.every(filter => {
        const customerValue = getCustomerValue(customer, filter.attribute);
        const filterValue = filter.value.toLowerCase();
        
        switch (filter.condition) {
          case 'is':
          case 'equals':
            return customerValue.toLowerCase() === filterValue;
          case 'is_not':
          case 'not_equals':
            return customerValue.toLowerCase() !== filterValue;
          case 'contains':
            return customerValue.toLowerCase().includes(filterValue);
          case 'does_not_contain':
            return !customerValue.toLowerCase().includes(filterValue);
          case 'greater_than':
            return parseFloat(customerValue.replace(/[$,]/g, '')) > parseFloat(filter.value.replace(/[$,]/g, ''));
          case 'less_than':
            return parseFloat(customerValue.replace(/[$,]/g, '')) < parseFloat(filter.value.replace(/[$,]/g, ''));
          default:
            return true;
        }
      });
    });
  };

  const getCustomerValue = (customer: CustomerListItem, attribute: string): string => {
    switch (attribute) {
      case 'customer':
        return customer.customer;
      case 'arr':
        return customer.arr;
      case 'openAr':
        return customer.openAr;
      case 'contracts':
        return String(customer.contracts);
      case 'subscriptions':
        return String(customer.subscriptions);
      case 'quotes':
        return String(customer.quotes);
      case 'owner':
        return customer.owner;
      case 'risk':
        return String(customer.risk);
      default:
        return '';
    }
  };

  // Filter customers based on search query and filters
  const filteredCustomers = useMemo(() => {
    const filtered = applyFilters(customers).filter(customer => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        customer.customer.toLowerCase().includes(query) ||
        customer.owner.toLowerCase().includes(query) ||
        customer.arr.toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      if (a.customerId === PIONEER_CUSTOMER_ID) return -1;
      if (b.customerId === PIONEER_CUSTOMER_ID) return 1;
      return 0;
    });
  }, [customers, filters, searchQuery]);

  const handleCustomerClick = (customer: CustomerListItem) => {
    if (customer.customerId === PIONEER_CUSTOMER_ID) {
      goToCustomer360(PIONEER_CUSTOMER_ID, { tab: 'tasks', returnTo: 'customers' });
    }
  };

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Click-outside handler to close search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    }

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isSearchOpen]);

  // Dynamic stats
  const totalArr = customers.reduce((sum, c) => {
    const value = parseFloat(c.arr.replace(/[$,]/g, ''));
    return sum + value;
  }, 0);
  const formattedArr = `$${(totalArr / 1000000).toFixed(1)}M`;
  
  const totalOpenAr = customers.reduce((sum, c) => {
    const value = parseFloat(c.openAr.replace(/[$,]/g, ''));
    return sum + value;
  }, 0);
  const formattedOpenAr = `$${(totalOpenAr / 1000).toFixed(0)}K`;

  const totalContracts = customers.reduce((sum, c) => sum + c.contracts, 0);
  const totalSubscriptions = customers.reduce((sum, c) => sum + c.subscriptions, 0);
  const highRiskCount = customers.filter(c => c.risk >= 3).length;

  const STATS = [
    { value: String(customers.length), label: "Total customers" },
    { value: formattedArr, label: "Total ARR" },
    { value: formattedOpenAr, label: "Total open AR" },
    { value: String(totalContracts), label: "Active contracts" },
    { value: String(totalSubscriptions), label: "Active subscriptions" },
  ];

  // Detect when table header becomes sticky
  useEffect(() => {
    const scrollContainer = contentRef.current;
    const table = tableRef.current;
    if (!scrollContainer || !table) return;

    const handleScroll = () => {
      const tableTop = table.getBoundingClientRect().top;
      const containerTop = scrollContainer.getBoundingClientRect().top;
      setIsHeaderSticky(tableTop <= containerTop);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header Section */}
      <div className="relative h-[60px] shrink-0">
        <div className="absolute left-6 bottom-1 flex flex-col justify-end">
          <div className="flex items-center gap-0.5 mb-0">
            <span className="text-[10px] font-medium uppercase tracking-[0] text-brand-fog">Customers</span>
            <ChevronRight size={10} className="text-brand-fog" />
          </div>
          <div className="flex items-center gap-3">
            <h1
              className="font-heading text-[24px] font-semibold text-brand-navy"
              style={{ letterSpacing: "-0.5px" }}
            >
              All customers
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-brand-fog">
                {filteredCustomers.length} customers
              </span>
              {highRiskCount > 0 && (
                <>
                  <div className="h-3 w-px bg-neutral-300" />
                  <span className="text-[12px] font-medium text-red-500">
                    {highRiskCount} high risk
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search/Filter/Sort on the right */}
        <div className="absolute right-4 bottom-1.5 flex items-center gap-2.5">
          <div 
            ref={searchContainerRef}
            className="relative flex items-center gap-1.5 bg-white transition-all duration-300 ease-in-out overflow-hidden"
            style={{ 
              width: isSearchOpen ? '240px' : '14px',
              paddingLeft: isSearchOpen ? '8px' : '0px',
              paddingRight: isSearchOpen ? '8px' : '0px',
            }}
          >
            <button
              onClick={() => !isSearchOpen && setIsSearchOpen(true)}
              className={cn(
                "shrink-0 transition-colors",
                isSearchOpen ? "text-brand-navy cursor-default" : "text-brand-navy hover:text-brand-fog cursor-pointer"
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
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }
              }}
              placeholder="Search customers..."
              className={cn(
                "bg-transparent py-1.5 text-[13px] text-brand-navy placeholder:text-brand-navy outline-none transition-all duration-300 ease-in-out",
                isSearchOpen ? "opacity-100" : "opacity-0"
              )}
              style={{ 
                fontSize: '12px',
                width: isSearchOpen ? 'calc(100% - 30px)' : '0px',
              }}
            />
          </div>
          <button 
            onClick={() => {
              const willExpand = !isFilterExpanded;
              setIsFilterExpanded(willExpand);
            }}
            className={cn(
              "relative inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[13px] transition-colors",
              filters.length > 0 && isFilterExpanded
                ? "bg-brand-navy text-white hover:bg-brand-soft" 
                : "text-brand-navy hover:bg-neutral-100"
            )}
          >
            <svg className={cn("h-3 w-3", filters.length > 0 && isFilterExpanded ? "text-white" : "text-brand-mist")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-medium">Filter</span>
            {filters.length > 0 && !isFilterExpanded && (
              <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>
          <button className="inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] text-brand-navy transition-colors hover:bg-neutral-100">
            <span className="text-brand-fog">Sort:</span>
            <span className="font-medium">ARR</span>
            <svg className="h-3 w-3 text-brand-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-0 left-6 right-4 h-[1px] bg-brand-navy" />
      </div>

      {/* Filter Unit */}
      <FilterUnit 
        filters={filters} 
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          if (newFilters.length === 0) {
            setIsFilterExpanded(false);
          }
        }} 
        isExpanded={isFilterExpanded} 
      />

      {/* Content Area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto bg-white px-6 pt-4 pb-8"
      >
        <div className="mx-auto max-w-[1560px] px-8">
          {/* Stats Section */}
          <div className="flex items-start pb-12 pl-4 pt-6">
            {STATS.map((stat, index) => (
              <div key={index} className="flex flex-1 items-start">
                <div className="flex-1">
                  <div
                    className="font-heading text-[36px] font-bold leading-tight text-brand-navy"
                    style={{ letterSpacing: "-1px" }}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[13px] text-brand-navy">
                    {stat.label}
                  </div>
                </div>
                {index < STATS.length - 1 && (
                  <div className="mx-8 h-12 w-px bg-neutral-200" />
                )}
              </div>
            ))}
          </div>

          {/* Customers Table */}
          <table ref={tableRef} className="w-full">
            <thead
              className="sticky -top-4 z-20 bg-white"
              style={!isHeaderSticky ? { boxShadow: '0 -1px 0 0 #1c1b2e', backgroundColor: '#ffffff' } : { backgroundColor: '#ffffff' }}
            >
              <tr className="bg-white">
                <th className="py-2 pl-4 pr-8 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 200, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  Customer
                </th>
                <th className="py-2 pr-4 text-right text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 110, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  ARR
                </th>
                <th className="py-2 pr-4 text-right text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 110, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  Open AR
                </th>
                <th className="py-2 pr-4 text-center text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 100, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  Contracts
                </th>
                <th className="py-2 pr-4 text-center text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 120, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  Subscriptions
                </th>
                <th className="py-2 pr-4 text-center text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 100, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  Quotes
                </th>
                <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 120, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  Renewal
                </th>
                <th className="py-2 pr-4 text-center text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 100, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  Risk
                </th>
                <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 140, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  Owner
                </th>
                <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 140, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                  Next invoice in
                </th>
                <th className="py-2 w-10 pr-4 bg-white relative z-20" style={{ boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }} />
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={24} className="text-brand-mist" />
                      <p className="text-[14px] text-brand-fog">
                        No customers found matching "{searchQuery}"
                      </p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-2 cursor-pointer text-[13px] text-blue-700 hover:underline"
                      >
                        Clear search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const riskStyle = STATUS_STYLES[customer.risk] || { bg: 'bg-neutral-100', text: 'text-brand-navy' };
                  const riskLabel = customer.risk === 0 ? 'Low' : customer.risk === 1 ? 'Medium' : customer.risk === 2 ? 'High' : 'Critical';

                  return (
                    <tr
                      key={customer.id}
                      className="group row-hover-trail border-b border-neutral-100 hover:bg-brand-navy cursor-pointer"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      {/* Customer */}
                      <td className="py-1.5 pl-4 pr-8 relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-brand-navy group-hover:bg-white/20 group-hover:text-white">
                            {customer.initials}
                          </div>
                          <span className="text-[13px] font-medium text-brand-navy group-hover:text-white whitespace-nowrap">
                            {customer.customer}
                          </span>
                        </div>
                      </td>

                      {/* ARR */}
                      <td className="py-1.5 pr-4 text-right text-[13px] font-medium text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                        {customer.arr}
                      </td>

                      {/* Open AR */}
                      <td className="py-1.5 pr-4 text-right text-[13px] text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                        {customer.openAr}
                      </td>

                      {/* Contracts */}
                      <td className="py-1.5 pr-4 text-center text-[13px] text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                        {customer.contracts}
                      </td>

                      {/* Subscriptions */}
                      <td className="py-1.5 pr-4 text-center text-[13px] text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                        {customer.subscriptions}
                      </td>

                      {/* Quotes */}
                      <td className="py-1.5 pr-4 text-center text-[13px] text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                        {customer.quotes}
                      </td>

                      {/* Renewal */}
                      <td className="py-1.5 pr-4 text-[13px] text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                        {customer.renewal}
                      </td>

                      {/* Risk */}
                      <td className="py-1.5 pr-4 relative z-10">
                        <div className="flex justify-center">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap",
                              riskStyle.bg,
                              riskStyle.text,
                              "group-hover:bg-white/20 group-hover:text-white"
                            )}
                          >
                            {customer.risk} {riskLabel}
                          </span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-1.5 pr-4 text-[13px] text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                        {customer.owner}
                      </td>

                      {/* Next Invoice In */}
                      <td className="py-1.5 pr-4 text-[13px] text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                        {typeof customer.nextInvoiceIn === 'number' ? (
                          <>
                            <span className="font-medium">{customer.nextInvoiceIn}</span>
                            <span className="ml-1 text-brand-fog group-hover:text-white/70">days</span>
                          </>
                        ) : (
                          customer.nextInvoiceIn
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-1.5 pl-2 pr-4 relative z-10">
                        <button
                          type="button"
                          className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-brand-navy group-hover:text-white/70 group-hover:hover:bg-white/10 group-hover:hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={14} className="group-hover:hidden" />
                          <ArrowRight size={14} strokeWidth={2} className="hidden group-hover:block text-white" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;
