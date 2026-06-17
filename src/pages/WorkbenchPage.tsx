import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, MoreVertical } from "lucide-react";
import { TrapezoidalTabs, type TabItem } from "@/components/ui/TrapezoidalTabs";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useFileDrop, type WorkbenchItem } from "@/context/FileDropContext";
import { useUseCase } from "@/context/UseCaseContext";
import { CustomerLinkModal } from "@/components/features/customer-link";

const WORKBENCH_TABS: TabItem[] = [
  { id: "your-tasks", label: "Your tasks" },
  { id: "queue", label: "Queue" },
  { id: "approvals", label: "Approvals" },
];

// Task type styles - grey for all
const TASK_TYPE_STYLE = { bg: "bg-neutral-100", text: "text-brand-navy", border: "border-neutral-200" };

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
  const { workbenchItems, hasNewItem, clearNewItemFlag } = useFileDrop();
  const { setActivePage } = useUseCase();

  // Register this page with use case context
  useEffect(() => {
    setActivePage("workbench");
  }, [setActivePage]);

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
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  // Clear new item flag after animation
  useEffect(() => {
    if (hasNewItem) {
      const timer = setTimeout(() => {
        clearNewItemFlag();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasNewItem, clearNewItemFlag]);

  return (
    <div className="flex h-full flex-col">
      {/* Header Section - Title and Tabs in one row */}
      <div className="relative h-[48px] shrink-0">
        {/* Title and task counts on the left - absolutely positioned */}
        <div className="absolute left-6 bottom-1 flex items-center gap-3">
          <h1
            className="font-heading text-[20px] font-semibold text-brand-navy"
            style={{ letterSpacing: "-0.5px" }}
          >
            Workbench
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
                              <div className="flex items-start pb-12">
                {STATS.map((stat, index) => (
                  <div key={index} className="flex flex-1 items-start">
                    <div className="flex-1">
                      <div
                        className="font-heading text-[36px] font-bold leading-tight text-brand-navy"
                        style={{ letterSpacing: "-1px" }}
                      >
                        {stat.value}
                      </div>
                      <div className="mt-1 text-[13px] text-brand-fog">
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
                  className={cn(
                    "sticky -top-4 z-10 bg-white transition-all duration-200",
                    isHeaderSticky
                      ? "shadow-[0_1px_0_0_#e5e5e5,0_4px_6px_-1px_rgba(0,0,0,0.08)]"
                      : "shadow-[0_-1px_0_0_#e5e5e5,0_1px_0_0_#e5e5e5]"
                  )}
                >
                  <tr>
                    <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 180 }}>
                      Task Type
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 180 }}>
                      Customer
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 100 }}>
                      Severity
                    </th>
                    <th className="py-2 pr-4 text-left text-[11px] font-normal uppercase tracking-wider text-brand-navy">
                      Subject
                    </th>
                    <th className="py-2 pr-4 text-right text-[11px] font-normal uppercase tracking-wider text-brand-navy" style={{ width: 120 }}>
                      Created on
                    </th>
                    <th className="py-2 w-10" />
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
                            if (task.id === 100) {
                              setLinkTask(task);
                            }
                          }}
                          className={cn(
                            "border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-all duration-500",
                            isNew && "animate-highlight-row bg-violet-50/50"
                          )}
                        >
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              {isNew && (
                                <Sparkles size={14} className="text-violet-500 animate-pulse" />
                              )}
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-medium whitespace-nowrap",
                                  TASK_TYPE_STYLE.bg,
                                  TASK_TYPE_STYLE.text,
                                  TASK_TYPE_STYLE.border
                                )}
                              >
                                {task.taskType}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-[14px] font-medium text-brand-navy whitespace-nowrap">
                            {task.customer}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap",
                                severityStyle.bg,
                                severityStyle.text
                              )}
                            >
                              {task.severity}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-[14px] text-brand-navy">
                            <div className="flex items-center gap-2">
                              {task.subject}
                              {isNew && (
                                <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                                  NEW
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-right text-[13px] text-brand-fog whitespace-nowrap">
                            {formatRelativeDate(task.createdAt)}
                          </td>
                          <td className="py-2.5 pl-2">
                            <button
                              type="button"
                              className="flex h-5 w-5 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-navy"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={14} />
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
          onClose={() => setLinkTask(null)}
        />
      )}
    </div>
  );
}

export default WorkbenchPage;
