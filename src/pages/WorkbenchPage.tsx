import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, ArrowRight, MoreVertical, ChevronRight } from "lucide-react";
import { TrapezoidalTabs, type TabItem } from "@/components/ui/TrapezoidalTabs";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useFileDrop, type WorkbenchItem } from "@/context/FileDropContext";
import { useUseCase } from "@/context/UseCaseContext";
import { CustomerLinkModal } from "@/components/features/customer-link";

const WORKBENCH_TABS: TabItem[] = [
  { id: "your-tasks", label: "My tasks" },
  { id: "queue", label: "Contract Queue" },
  { id: "approvals", label: "Approvals" },
];

// Task type styles - grey for all
const TASK_TYPE_STYLE = { text: "text-brand-navy" };

// Severity styles
const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  Critical: { bg: "bg-red-50", text: "text-red-600" },
  High: { bg: "bg-amber-50", text: "text-amber-600" },
  Medium: { bg: "bg-yellow-50", text: "text-yellow-600" },
  Low: { bg: "bg-green-50", text: "text-green-600" },
};

export function WorkbenchPage() {
  const [activeTab, setActiveTab] = useState("your-tasks");
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [linkTask, setLinkTask] = useState<WorkbenchItem | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const { workbenchItems, clearItemNewFlag, shouldOpenModal, setShouldOpenModal } = useFileDrop();
  const { setActivePage } = useUseCase();

  // Register this page with use case context
  useEffect(() => {
    setActivePage("workbench");
  }, [setActivePage]);

  // Auto-open modal for new item when flag is set
  useEffect(() => {
    if (shouldOpenModal) {
      const pioneerTask = workbenchItems.find(item => item.id === 100);
      if (pioneerTask) {
        setLinkTask(pioneerTask);
        setShouldOpenModal(false);
      }
    }
  }, [shouldOpenModal, workbenchItems, setShouldOpenModal]);

  // Auto-open modal when URL param is set (for use case switcher)
  useEffect(() => {
    const checkUrlParam = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openModal') === 'customer-link') {
        console.log('Opening modal from URL param...');
        console.log('Workbench items:', workbenchItems.length);
        const pioneerTask = workbenchItems.find(item => item.id === 100);
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
  }, [workbenchItems]);

  // Dynamic stats based on workbench items
  const criticalCount = workbenchItems.filter(t => t.severity === "Critical").length;
  const STATS = [
    { value: "$1.0M", label: "TCV pending action" },
    { value: String(workbenchItems.length), label: "In contract queue" },
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
              My tasks
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-brand-fog">
                {workbenchItems.length} tasks
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
            <span className="font-medium">Severity</span>
            <svg className="h-3 w-3 text-brand-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Horizontal line - aligned with title on left, avatar on right */}
        <div className="absolute bottom-0 left-6 right-4 h-[1px] bg-brand-navy" />
      </div>

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
                    <th className="py-2 pl-4 pr-8 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 180, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Task Type
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 100, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Severity
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 240, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Customer
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Subject
                    </th>
                    <th className="py-2 pr-4 text-right text-[11px] font-medium uppercase tracking-normal text-brand-navy bg-white relative z-20" style={{ width: 120, boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }}>
                      Created on
                    </th>
                    <th className="py-2 w-10 pr-4 bg-white relative z-20" style={{ boxShadow: 'inset 0 -1px 0 #1c1b2e', backgroundColor: '#ffffff' }} />
                  </tr>
                </thead>

                  {/* Table Body */}
                  <tbody>
                    {workbenchItems.map((task) => {
                      const severityStyle = SEVERITY_STYLES[task.severity] || {
                        bg: "bg-neutral-50",
                        text: "text-brand-navy",
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
                          <td className="py-1.5 pl-4 pr-8 relative">
                            {/* Sweep animation overlay for new items */}
                            {isNew && (
                              <span className="row-sweep-overlay-table" aria-hidden="true">
                                <span className="row-sweep-band" />
                              </span>
                            )}
                            <div className="flex items-center gap-2 relative z-10">
                              {isNew && (
                                <Sparkles size={14} className="text-violet-500 animate-pulse group-hover:text-white/70" />
                              )}
                              <span
                                className={cn(
                                  "text-[11px] font-medium uppercase tracking-normal whitespace-nowrap",
                                  TASK_TYPE_STYLE.text,
                                  "group-hover:text-white",
                                )}
                              >
                                {task.taskType}
                              </span>
                            </div>
                          </td>
                          <td className="py-1.5 pr-4 relative z-10">
                            <span
                              className={cn(
                                "text-[13px] font-medium whitespace-nowrap",
                                severityStyle.text,
                                "group-hover:!text-white/80",
                              )}
                            >
                              {task.severity}
                            </span>
                          </td>
                          <td className="py-1.5 pr-4 text-[13px] font-medium text-brand-navy whitespace-nowrap group-hover:text-white relative z-10">
                            {task.customer}
                          </td>
                          <td className="py-1.5 pr-4 text-[13px] text-brand-navy group-hover:text-white relative z-10">
                            <div className="flex items-center gap-2">
                              {task.subject}
                              {isNew && (
                                <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 group-hover:bg-white/20 group-hover:text-white">
                                  NEW
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-1.5 pr-4 text-right text-[13px] text-brand-fog whitespace-nowrap group-hover:text-white/60 relative z-10">
                            {formatRelativeDate(task.createdAt)}
                          </td>
                          <td className="py-1.5 pl-2 pr-4 relative z-10">
                            <button
                              type="button"
                              className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-brand-navy group-hover:text-white/70 group-hover:hover:bg-white/10 group-hover:hover:text-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={14} className="group-hover:hidden" />
                              <ArrowRight size={14} strokeWidth={2} className="hidden group-hover:block text-white" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
              </table>
            </div>
          )}

          {activeTab === "queue" && (
            <div className="py-8">
              <p className="text-brand-fog">
                Items in your queue will appear here.
              </p>
            </div>
          )}

          {activeTab === "approvals" && (
            <div className="py-8">
              <p className="text-brand-fog">
                Pending approvals will appear here.
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
