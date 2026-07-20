import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, ArrowRight, Check, ChevronRight } from "lucide-react";
import { TrapezoidalTabs, type TabItem } from "@/components/ui/TrapezoidalTabs";
import { FilterUnit, type Filter } from "@/components/ui/FilterUnit";
import { cn, formatStartUrgency } from "@/lib/utils";
import { useFileDrop, type ProcessingFile, type WorkbenchItem } from "@/context/FileDropContext";
import { useUseCase } from "@/context/UseCaseContext";
import { CustomerLinkModal } from "@/components/features/customer-link";

const WORKBENCH_TABS: TabItem[] = [
  { id: "your-tasks", label: "My tasks" },
  { id: "approvals", label: "Approvals" },
];

const TAB_TITLES: Record<string, string> = {
  "your-tasks": "My tasks",
  approvals: "Approvals",
};

// Status styles for contract ingestion
const STATUS_STYLES: Record<string, { text: string; bg: string }> = {
  "Ready for review": { text: "text-brand-navy", bg: "bg-neutral-100" },
  "In review": { text: "text-green-700", bg: "bg-green-50" },
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
      {/* Task Type — skeleton */}
      <td className="py-2.5 pl-4 pr-4">
        <SkeletonBar className="w-[140px]" />
      </td>

      {/* Customer — skeleton */}
      <td className="py-2.5 pr-4">
        <SkeletonBar className="w-[96px]" />
      </td>

      {/* Subject — PDF name */}
      <td className="py-2.5 pr-4 max-w-0">
        <span className="block truncate text-[13px] font-medium text-brand-navy">
          {file.name}
        </span>
      </td>

      {/* Status — Extracting data (shown only after upload completes) */}
      <td className="py-2 pl-1 pr-4">
        <div className="flex min-w-[132px] flex-col gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles size={12} className="shrink-0 animate-pulse text-violet-500" />
            <span className="text-[13px] font-medium whitespace-nowrap ai-gradient-text">
              Extracting data
            </span>
          </div>
          <div className="h-[2px] w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full w-full rounded-full ai-gradient animate-pulse" />
          </div>
        </div>
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
  const [linkTask, setLinkTask] = useState<WorkbenchItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const { workbenchItems, clearItemNewFlag, shouldOpenModal, setShouldOpenModal, processingFiles } = useFileDrop();
  const { setActivePage } = useUseCase();

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
  const filteredTasks = applyFilters(ingestionTasks).filter(task => {
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

  // Auto-open modal for new item when flag is set
  useEffect(() => {
    if (shouldOpenModal) {
      const pioneerTask = ingestionTasks.find(item => item.id === 100);
      if (pioneerTask) {
        setLinkTask(pioneerTask);
        setShouldOpenModal(false);
      }
    }
  }, [shouldOpenModal, ingestionTasks, setShouldOpenModal]);

  // Auto-open modal when URL param is set (for use case switcher)
  useEffect(() => {
    const checkUrlParam = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openModal') === 'customer-link') {
        console.log('Opening modal from URL param...');
        console.log('Workbench items:', ingestionTasks.length);
        const pioneerTask = ingestionTasks.find(item => item.id === 100);
        console.log('Found Pioneer task:', pioneerTask);
        
        if (pioneerTask) {
          console.log('Setting linkTask to open modal');
          setLinkTask(pioneerTask);
        }
        
        // Clean up URL param
        params.delete('openModal');
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      }
    };
    
    // Check on mount and when workbench items change
    checkUrlParam();
    
    // Listen for custom event from use case switcher
    window.addEventListener('openModalParam', checkUrlParam);
    return () => window.removeEventListener('openModalParam', checkUrlParam);
  }, [ingestionTasks]);

  // Dynamic stats based on ingestion tasks only
  const totalTCV = ingestionTasks.reduce((sum, task) => {
    if (task.tcv) {
      const value = parseFloat(task.tcv.replace(/[$,]/g, ''));
      return sum + value;
    }
    return sum;
  }, 0);
  const formattedTCV = `$${(totalTCV / 1000).toFixed(1)}K`;
  
  const criticalCount = ingestionTasks.filter(t => t.severity === "Critical").length;
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
          <div className="flex items-center gap-0.5 mb-0">
            <span className="text-[10px] font-medium uppercase tracking-[0] text-brand-fog">Workbench</span>
            <ChevronRight size={10} className="text-brand-fog" />
          </div>
          <div className="flex items-center gap-3">
            <h1
              className="font-heading text-[24px] font-semibold text-brand-navy"
              style={{ letterSpacing: "-0.5px" }}
            >
              {TAB_TITLES[activeTab] ?? "My tasks"}
            </h1>
            {activeTab === "your-tasks" && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-brand-fog">
                  {filteredTasks.length} tasks
                </span>
                {criticalCount > 0 && (
                  <>
                    <div className="h-3 w-px bg-neutral-300" />
                    <span className="text-[12px] font-medium text-red-500">
                      {criticalCount} critical
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
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

        {/* Search/Filter/Sort on the right */}
        <div className="absolute right-4 bottom-1.5 flex items-center gap-2.5">
          {/* Inline search box - fixed width container to prevent jumping */}
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
              placeholder="Search tasks..."
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
            {/* Red dot indicator when collapsed with filters */}
            {filters.length > 0 && !isFilterExpanded && (
              <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>
          <button className="inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] text-brand-navy transition-colors hover:bg-neutral-100">
            <span className="text-brand-fog">Sort:</span>
            <span className="font-medium">Severity</span>
            <svg className="h-3 w-3 text-brand-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Horizontal line - aligned with title on left, avatar on right */}
        <div className="absolute bottom-0 left-6 right-4 h-[1px] bg-brand-navy" />
      </div>

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
        className="flex-1 overflow-y-auto bg-white px-6 pt-4 pb-8"
      >
        {/* Tab Content - max width 1560px centered */}
        <div className="mx-auto max-w-[1560px] px-8">
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
              <table ref={tableRef} className="w-full">
                {/* Table Header - Sticky with shadow on scroll */}
                <thead
                  className="sticky -top-4 z-20 bg-white"
                  style={!isHeaderSticky ? { boxShadow: '0 -1px 0 0 #1c1b2e', backgroundColor: '#ffffff' } : { backgroundColor: '#ffffff' }}
                >
                  <tr className="bg-white">
                    <th className="py-2 pl-4 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 220, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Task Type
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 170, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Customer
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Subject
                    </th>
                    <th className="py-2 pl-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 150, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Status
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 130, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Created on
                    </th>
                    <th className="py-2 w-10 pr-4 bg-white relative z-20" style={{ boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }} />
                  </tr>
                </thead>

                  {/* Table Body */}
                  <tbody>
                    {inFlightFiles.map((file) => (
                      <ProcessingTaskRow key={file.id} file={file} />
                    ))}
                    {filteredTasks.length === 0 && inFlightFiles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
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
                            if (task.id === 100) {
                              setLinkTask(task);
                            }
                          }}
                          className={cn(
                            "group row-hover-trail border-b border-neutral-100 hover:bg-brand-navy cursor-pointer",
                            isNew && "animate-highlight-row"
                          )}
                        >
                          {/* Task Type (merged with Task Name) */}
                          <td className="py-1.5 pl-4 pr-4 relative">
                            {/* Sweep animation overlay for new items */}
                            {isNew && (
                              <span className="row-sweep-overlay-table" aria-hidden="true">
                                <span className="row-sweep-band" />
                              </span>
                            )}
                            <div className="flex items-center gap-2 relative z-10">
                              {isNew && (
                                <Sparkles size={14} className="shrink-0 text-violet-500 animate-pulse group-hover:text-white/70" />
                              )}
                              <div className="inline-block px-2 py-1 text-[13px] font-medium whitespace-nowrap bg-neutral-100 text-brand-navy group-hover:bg-white/20 group-hover:text-white">
                                {task.taskName ? `${task.taskName}: ${task.taskType}` : task.taskType}
                              </div>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-1.5 pr-4 text-[13px] font-medium text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                            {task.customer}
                          </td>

                          {/* Subject */}
                          <td className="py-1.5 pr-4 text-[13px] text-brand-fog group-hover:text-white/70 relative z-10 max-w-0">
                            <span className="block truncate">
                              {task.startDate && (
                                <span className="font-medium text-brand-navy group-hover:text-white">
                                  {formatStartUrgency(task.startDate)}
                                </span>
                              )}
                              {task.startDate && " · "}
                              {stripFilename(task.subject)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-0 pl-1 pr-4 relative z-10">
                            {task.status && (
                              <div
                                className={cn(
                                  "px-2 py-1 text-[13px] font-medium whitespace-nowrap",
                                  statusStyle.text,
                                  statusStyle.bg,
                                  "group-hover:text-white group-hover:bg-white/20"
                                )}
                              >
                                {task.status}
                              </div>
                            )}
                            {!task.status && "—"}
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

      {/* Customer Link Modal */}
      {linkTask && (
        <CustomerLinkModal
          task={linkTask}
          onClose={() => {
            console.log('Closing modal');
            setLinkTask(null);
          }}
        />
      )}
    </div>
  );
}

export default WorkbenchPage;
