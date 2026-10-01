import { useState, useEffect, useRef } from "react";
import { ListFilter, Pencil, Search, Sparkles, ArrowRight, Check, User } from "lucide-react";
import { TrapezoidalTabs, type TabItem } from "@/components/ui/TrapezoidalTabs";
import { FilterUnit, type Filter } from "@/components/ui/FilterUnit";
import { cn, formatStartUrgency } from "@/lib/utils";
import { useFileDrop, type ProcessingFile, type WorkbenchItem } from "@/context/FileDropContext";
import { useUseCase } from "@/context/UseCaseContext";
import { useNavigation } from "@/context/NavigationContext";
import { CustomerLinkModal } from "@/components/features/customer-link/CustomerLinkModal";

const PIONEER_CUSTOMER_ID = "pioneer-systems";
const WORKBENCH_TABS: TabItem[] = [
  { id: "your-tasks", label: "All Tasks" },
  { id: "approvals", label: "Approvals" },
  { id: "edit", label: "", tone: "blue", icon: <Pencil size={15} strokeWidth={2} /> },
];

const TAB_TITLES: Record<string, string> = {
  "your-tasks": "All Tasks",
  approvals: "Approvals",
  edit: "Edit",
};

type QuickFilterId = "owner-you" | "waiting-on-me" | "high-priority" | "pending-approval";

const QUICK_FILTERS: Array<{ id: QuickFilterId; label: string }> = [
  { id: "owner-you", label: "Owned by you" },
  { id: "waiting-on-me", label: "Waiting on You" },
  { id: "high-priority", label: "High priority" },
  { id: "pending-approval", label: "Pending approval" },
];

// Status styles for contract ingestion
const STATUS_STYLES: Record<string, { text: string; bg: string }> = {
  "Ready for review": { text: "text-brand-navy", bg: "bg-neutral-100" },
  Open: { text: "text-blue-700", bg: "bg-blue-50" },
  Resolved: { text: "text-green-700", bg: "bg-green-50" },
  "Pending approval": { text: "text-violet-700", bg: "bg-violet-50" },
  Blocked: { text: "text-red-700", bg: "bg-red-50" },
};

// Strip the leading "Filename.ext — " prefix from a subject string.
const stripFilename = (subject: string): string => {
  const dashIndex = subject.indexOf(" — ");
  return dashIndex !== -1 ? subject.slice(dashIndex + 3) : subject;
};

function SkeletonBar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 animate-pulse rounded bg-neutral-200",
        className
      )}
      aria-hidden
    />
  )
}

function ProcessingTaskRow({ file }: { file: ProcessingFile }) {
  return (
    <tr className="border-b border-neutral-100">
      {/* Subject — PDF name */}
      <td className="py-2.5 pl-4 pr-4">
        <span className="block truncate text-[13px] font-medium text-brand-navy">
          {file.name}
        </span>
      </td>

      {/* For — skeleton */}
      <td className="py-2.5 pr-4">
        <SkeletonBar className="ml-[22px] w-[96px]" />
      </td>

      {/* Task type — skeleton */}
      <td className="py-2.5 pr-4">
        <SkeletonBar className="w-[140px]" />
      </td>

      {/* Status — Extracting data (shown only after upload completes) */}
      <td className="py-2 pl-1 pr-4">
        <div className="flex w-fit items-center gap-1.5">
          <Sparkles size={12} className="shrink-0 animate-pulse text-violet-500" />
          <span className="text-gradient-shine text-[13px] font-medium whitespace-nowrap">
            Extracting data
          </span>
        </div>
      </td>

      {/* Tags — skeleton */}
      <td className="py-2.5 pr-4">
        <SkeletonBar className="w-[96px]" />
      </td>

      {/* Owner — skeleton */}
      <td className="py-2.5 pr-4">
        <SkeletonBar className="w-[80px]" />
      </td>

      {/* Created on — skeleton */}
      <td className="py-2.5 pr-4">
        <SkeletonBar className="w-[88px]" />
      </td>

      <td className="py-2.5 pl-2 pr-4" />
    </tr>
  )
}

export function WorkbenchPage() {
  const [activeTab, setActiveTab] = useState("your-tasks");
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [quickFilters, setQuickFilters] = useState<QuickFilterId[]>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [customerLinkTask, setCustomerLinkTask] = useState<WorkbenchItem | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const { workbenchItems, clearItemNewFlag, shouldOpenModal, setShouldOpenModal, processingFiles } = useFileDrop();
  const { setActivePage, setVariant } = useUseCase();
  const { goToCustomer360 } = useNavigation();

  const openCustomerTasks = (entryVariant: "customer-scenarios" | "no-customer-data" = "customer-scenarios") => {
    setActivePage("customer360");
    setVariant(entryVariant);
    goToCustomer360(PIONEER_CUSTOMER_ID, { tab: "tasks", entryVariant });
  };

  // Multi-file rows appear only after upload finishes — never while Uploading
  const inFlightFiles = processingFiles.filter(
    (file) =>
      file.showInTaskTable &&
      (file.status === "uploaded" || file.status === "processing")
  );

  // Register this page with use case context
  useEffect(() => {
    setActivePage("workbench");
  }, [setActivePage]);

  // Filter to show only contract ingestion tasks
  const ingestionTasks = workbenchItems.filter(item => item.taskType.includes("Ingestion"));

  // Apply filters
  const applyFilters = (tasks: WorkbenchItem[]) => {
    if (filters.length === 0) return tasks;

    return tasks.filter(task => {
      return filters.every(filter => {
        const taskValue = getTaskValue(task, filter.attribute);
        const filterValue = filter.value.toLowerCase();
        
        switch (filter.condition) {
          case 'is':
          case 'equals':
            return taskValue.toLowerCase() === filterValue;
          case 'is_not':
          case 'not_equals':
            return taskValue.toLowerCase() !== filterValue;
          case 'contains':
            return taskValue.toLowerCase().includes(filterValue);
          case 'does_not_contain':
            return !taskValue.toLowerCase().includes(filterValue);
          case 'greater_than':
            return parseFloat(taskValue.replace(/[$,]/g, '')) > parseFloat(filter.value.replace(/[$,]/g, ''));
          case 'less_than':
            return parseFloat(taskValue.replace(/[$,]/g, '')) < parseFloat(filter.value.replace(/[$,]/g, ''));
          case 'is_before':
            return new Date(taskValue) < new Date(filter.value);
          case 'is_after':
            return new Date(taskValue) > new Date(filter.value);
          default:
            return true;
        }
      });
    });
  };

  const getTaskValue = (task: WorkbenchItem, attribute: string): string => {
    switch (attribute) {
      case 'taskId':
        return task.taskId || '';
      case 'taskType':
        return task.taskType;
      case 'taskName':
        return task.taskName || '';
      case 'customer':
        return task.customer;
      case 'subject':
        return task.subject;
      case 'status':
        return task.status || '';
      case 'severity':
        return task.severity || '';
      case 'owner':
        return task.owner || '';
      case 'tcv':
        return task.tcv || '';
      case 'startDate':
        return task.startDate ? task.startDate.toISOString() : '';
      case 'contractId':
        return task.contractId || '';
      default:
        return '';
    }
  };

  // Filter tasks based on search query and filters
  const filteredTasks = applyFilters(ingestionTasks)
    .filter((task) =>
      quickFilters.every((filter) => {
        if (filter === "owner-you") return task.owner === "You";
        if (filter === "waiting-on-me") {
          return task.waitingOn === "You" || task.status === "Ready for review";
        }
        if (filter === "high-priority") {
          return task.severity === "High" || task.severity === "Critical";
        }
        return task.status === "Pending approval";
      })
    )
    .filter(task => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        task.customer.toLowerCase().includes(query) ||
        task.taskType.toLowerCase().includes(query) ||
        task.taskId?.toLowerCase().includes(query) ||
        task.taskName?.toLowerCase().includes(query) ||
        task.subject.toLowerCase().includes(query) ||
        task.status?.toLowerCase().includes(query) ||
        task.owner?.toLowerCase().includes(query)
      );
    });

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

  // Open the customer-linking flow after single-file processing or via the use-case toggle.
  useEffect(() => {
    if (shouldOpenModal) {
      const task =
        workbenchItems.find((item) => item.customer === 'Pioneer Systems') ??
        workbenchItems[0];
      setCustomerLinkTask(task ?? null);
    } else {
      setCustomerLinkTask(null);
    }
  }, [shouldOpenModal, workbenchItems]);

  // Deep-link from the use case switcher — show the customer-linking flow.
  useEffect(() => {
    const checkUrlParam = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openModal') === 'customer-link') {
        params.delete('openModal');
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
        setShouldOpenModal(true);
      }
    };
    
    checkUrlParam();
    
    window.addEventListener('openModalParam', checkUrlParam);
    return () => window.removeEventListener('openModalParam', checkUrlParam);
  }, [setShouldOpenModal]);

  // Dynamic stats based on ingestion tasks only
  const totalTCV = ingestionTasks.reduce((sum, task) => {
    if (task.tcv) {
      const value = parseFloat(task.tcv.replace(/[$,]/g, ''));
      return sum + value;
    }
    return sum;
  }, 0);
  const formattedTCV = `$${(totalTCV / 1000).toFixed(1)}K`;
  
  const STATS = [
    { value: formattedTCV, label: "TCV pending action" },
    { value: String(ingestionTasks.length), label: "In contract queue" },
    { value: "0", label: "Pending approvals" },
    { value: "0", label: "Contracts about to expire" },
    { value: "0", label: "In grace period post expiry" },
  ];

  // Detect when table header becomes sticky
  useEffect(() => {
    const scrollContainer = contentRef.current;
    const table = tableRef.current;
    if (!scrollContainer || !table) return;

    const handleScroll = () => {
      const tableTop = table.getBoundingClientRect().top;
      const containerTop = scrollContainer.getBoundingClientRect().top;
      // Header is sticky when table top is at or above the container top
      setIsHeaderSticky(tableTop <= containerTop);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [activeTab]);

  return (
    <div className="flex h-full flex-col">
      {/* Header Section - Title and Tabs in one row */}
      <div className="relative h-[60px] shrink-0">
        {/* Breadcrumb + Title and task counts on the left - absolutely positioned */}
        <div className="absolute left-6 bottom-1 flex flex-col justify-end">
          <h1
            className="font-heading text-[24px] font-semibold text-brand-navy"
            style={{ letterSpacing: "-0.5px" }}
          >
            {TAB_TITLES[activeTab] ?? "All Tasks"}
          </h1>
        </div>

        {/* Tabs absolutely centered on screen */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <TrapezoidalTabs
            tabs={WORKBENCH_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            compact
          />
        </div>

        {/* Horizontal line - aligned with title on left, avatar on right */}
        <div className="absolute bottom-0 left-6 right-4 h-[1px] bg-brand-navy" />
      </div>

      {activeTab === "your-tasks" && (
        <div className="flex items-center py-2 pl-6 pr-4">
          <button
            type="button"
            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-[14px] font-medium text-[#2a3cac] hover:bg-[#f2f6ff]"
          >
            <ListFilter size={16} strokeWidth={2} />
            Add filter
          </button>
          <div className="ml-2 flex items-center gap-1.5">
            {QUICK_FILTERS.map((filter) => {
              const isActive = quickFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    setQuickFilters((current) =>
                      current.includes(filter.id)
                        ? current.filter((id) => id !== filter.id)
                        : [...current, filter.id]
                    )
                  }
                  className={cn(
                    "inline-flex h-7 cursor-pointer items-center rounded-none border px-2.5 text-[12px] font-medium transition-colors",
                    isActive
                      ? "border-solid border-[#2a3cac] bg-[#2a3cac] text-white"
                      : "border-dashed border-current bg-[#f2f6ff] text-[#2a3cac] hover:bg-[#e7eeff]"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-[14px] font-medium text-[#2a3cac] hover:bg-[#f2f6ff]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M1.25 3.75h6.5M1.25 7.75h4.25M1.25 11.75h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="11" cy="9.25" r="2.35" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12.7 11.05 14.35 12.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Search
            </button>
          </div>
        </div>
      )}

      {/* Filter Unit */}
      <FilterUnit 
        filters={filters} 
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          // If all filters are removed, collapse the unit
          if (newFilters.length === 0) {
            setIsFilterExpanded(false);
          }
        }} 
        isExpanded={isFilterExpanded} 
      />

      {/* Content Area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto bg-white pl-6 pr-4 pt-4 pb-8"
      >
        {/* Tab Content - max width 1560px centered */}
        <div className="mx-auto max-w-[1560px]">
          {activeTab === "your-tasks" && (
            <div>
              {/* Stats Section - spread across width with vertical separators */}
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

              {/* Tasks Table */}
              <table ref={tableRef} className="w-full table-fixed">
                {/* Table Header - Sticky with shadow on scroll */}
                <thead
                  className="sticky -top-4 z-20 bg-white"
                  style={!isHeaderSticky ? { boxShadow: '0 -1px 0 0 #1c1b2e', backgroundColor: '#ffffff' } : { backgroundColor: '#ffffff' }}
                >
                  <tr className="bg-white">
                    <th className="py-2 pl-4 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white whitespace-nowrap relative z-20" style={{ width: 400, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Title
                    </th>
                    <th className="py-2 pl-[22px] pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      For
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Task type
                    </th>
                    <th className="py-2 pl-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 132, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Status
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Tags
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 132, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Owner
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 112, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Created on
                    </th>
                    <th className="py-2 pr-4 bg-white relative z-20" style={{ width: 40, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }} />
                  </tr>
                </thead>

                  {/* Table Body */}
                  <tbody>
                    {inFlightFiles.map((file) => (
                      <ProcessingTaskRow key={file.id} file={file} />
                    ))}
                    {filteredTasks.length === 0 && inFlightFiles.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Search size={24} className="text-brand-mist" />
                            <p className="text-[14px] text-brand-fog">
                              No tasks found matching "{searchQuery}"
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
                      filteredTasks.map((task) => {
                      const statusStyle = STATUS_STYLES[task.status || ""] || {
                        text: "text-brand-navy",
                        bg: "bg-neutral-50",
                      };
                      const isNew = task.isNew;

                      return (
                        <tr
                          key={task.id}
                          onClick={() => {
                            if (task.isNew) {
                              clearItemNewFlag(task.id);
                            }
                            openCustomerTasks(task.unidentifiedCustomer ? "no-customer-data" : "customer-scenarios");
                          }}
                          className={cn(
                            "group row-hover-trail border-b border-neutral-100 hover:bg-brand-navy cursor-pointer",
                            isNew && "animate-highlight-row"
                          )}
                        >
                          {/* Subject */}
                          <td className="py-1.5 pl-4 pr-4 text-[13px] text-brand-fog group-hover:text-white/70 relative z-10">
                            {isNew && (
                              <span className="row-sweep-overlay-table" aria-hidden="true">
                                <span className="row-sweep-band" />
                              </span>
                            )}
                            <span className="relative z-10 block truncate">
                              {task.startDate && (
                                <span className="font-medium text-brand-navy group-hover:text-white">
                                  {formatStartUrgency(task.startDate)}
                                </span>
                              )}
                              {task.startDate && " · "}
                              {stripFilename(task.subject)}
                            </span>
                          </td>

                          {/* For */}
                          <td className="py-1.5 pr-4 relative z-10">
                            <div className="flex items-center gap-2">
                              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden="true">
                                {isNew ? (
                                  <Sparkles size={14} className="text-violet-500 animate-pulse group-hover:text-white/70" />
                                ) : null}
                              </span>
                              <span className="min-w-0 truncate text-[13px] font-medium text-brand-navy group-hover:text-white" title={task.customer}>
                                {task.customer}
                              </span>
                            </div>
                          </td>

                          {/* Task type */}
                          <td className="py-1.5 pr-4 relative z-10">
                            <div
                              className="relative z-10 inline-block max-w-full truncate px-2 py-1 align-middle text-[13px] font-medium bg-neutral-100 text-brand-navy group-hover:bg-white/20 group-hover:text-white"
                              title={task.taskName ? `${task.taskName}: ${task.taskType}` : task.taskType}
                            >
                              {task.taskName ? `${task.taskName}: ${task.taskType}` : task.taskType}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-1.5 pl-1 pr-4 relative z-10">
                            {task.status ? (
                              <span
                                className={cn(
                                  "inline-flex w-fit px-2 py-1 text-[13px] font-medium whitespace-nowrap",
                                  statusStyle.text,
                                  statusStyle.bg,
                                  "group-hover:text-white group-hover:bg-white/20"
                                )}
                              >
                                {task.status}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* Tags */}
                          <td className="py-1.5 pr-4 relative z-10">
                            {task.status === "Blocked" && task.waitingOn ? (
                              <span
                                className="inline-block max-w-full truncate bg-neutral-100 px-2 py-1 align-middle text-[13px] font-medium text-brand-navy group-hover:bg-white/20 group-hover:text-white"
                                title={`Waiting on ${task.waitingOn}`}
                              >
                                Waiting on {task.waitingOn}
                              </span>
                            ) : null}
                          </td>

                          {/* Owner */}
                          <td className="py-1.5 pr-4 text-[13px] text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                            <span className="flex items-center gap-1.5">
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                {task.owner === "You" && (
                                  <User size={14} strokeWidth={2} className="text-brand-navy group-hover:text-white" />
                                )}
                              </span>
                              <span className={cn("min-w-0 truncate", task.owner === "You" && "font-medium")}>
                                {task.owner || "—"}
                              </span>
                            </span>
                          </td>

                          {/* Created on */}
                          <td className="py-1.5 pr-4 text-[13px] text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                            {task.createdAt
                              ? new Date(task.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                              : "—"}
                          </td>

                          {/* Actions */}
                          <td className="py-1.5 pl-2 pr-4 relative z-10">
                            <button
                              type="button"
                              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-white/70 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ArrowRight size={14} strokeWidth={2} className="text-white" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                    )}
                  </tbody>
              </table>
            </div>
          )}

          {activeTab === "approvals" && (
            <div className="flex flex-col items-center justify-center gap-2 py-24">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <Check size={22} className="text-brand-fog" />
              </div>
              <p className="mt-2 text-[15px] font-semibold text-brand-navy">
                No pending approvals
              </p>
              <p className="max-w-sm text-center text-[13px] text-brand-fog">
                Contracts sent for approval and items awaiting your sign-off will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
      {customerLinkTask && (
        <CustomerLinkModal
          task={customerLinkTask}
          onClose={() => {
            setCustomerLinkTask(null);
            setShouldOpenModal(false);
          }}
        />
      )}
    </div>
  );
}

export default WorkbenchPage;
