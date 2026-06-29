import { useState, useRef, useEffect, useCallback } from 'react'
import { X, FileText, MoreHorizontal, MessageCircleMore, ArrowLeft } from 'lucide-react'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { CommentsPanel } from '@/components/features/contract-processing/CommentsPanel'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase } from '@/context/UseCaseContext'
import { invoiceData } from '@/data/invoiceMock'
import { cn } from '@/lib/utils'

const INVOICE_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'threads', label: 'Threads' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'collections', label: 'Collections' },
  { id: 'revrec', label: 'Revrec' },
]

interface NavSection {
  id: string
  label: string
}

const NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'details', label: 'Details' },
  { id: 'line-items', label: 'Line Items' },
  { id: 'activity', label: 'Activity' },
]

function InPageNav({
  sections,
  activeId,
  onNavigate,
}: {
  sections: NavSection[]
  activeId: string
  onNavigate: (id: string) => void
}) {
  return (
    <nav className="flex flex-col">
      <ul className="flex flex-col gap-0.5">
        {sections.map((section) => {
          const isActive = section.id === activeId
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onNavigate(section.id)}
                className={cn(
                  '-ml-2 flex cursor-pointer items-center rounded-md px-2 py-1 text-left text-[13px] tracking-[-0.25px] transition-colors',
                  isActive
                    ? 'bg-neutral-100 font-semibold text-brand-navy'
                    : 'font-normal text-brand-fog hover:bg-neutral-50 hover:text-brand-navy'
                )}
              >
                {section.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function MetricsRow({ metrics }: { metrics: typeof invoiceData.topMetrics }) {
  return (
    <div className="flex">
      {metrics.map((metric, idx) => (
        <div key={idx} className="flex flex-1 items-start">
          <div className="flex-1 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-brand-fog">
              {metric.label}
            </div>
            <div className="mt-1">
              {metric.variant === 'status' ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[13px] font-semibold text-amber-700">
                  {metric.value}
                </span>
              ) : (
                <span className="text-[15px] font-semibold text-brand-navy">{metric.value}</span>
              )}
            </div>
          </div>
          {idx < metrics.length - 1 && (
            <div className="mx-4 h-12 w-px self-center bg-neutral-200" />
          )}
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
        {title}
      </span>
      <div className="h-px flex-1 bg-brand-navy" />
      <button
        type="button"
        title="Add comment"
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-blue-700 transition-colors hover:bg-blue-50"
      >
        <MessageCircleMore size={15} />
      </button>
    </div>
  )
}

export function InvoiceDetailsPage() {
  const { goToWorkbench, goToAllInvoices } = useNavigation()
  const { setActivePage } = useUseCase()
  const data = invoiceData
  const [activeTab, setActiveTab] = useState('invoices')
  const [activeSection, setActiveSection] = useState('summary')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false)

  const centerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  
  // Register this page with use case context
  useEffect(() => {
    setActivePage('invoice-details')
  }, [setActivePage])

  const setSectionRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      sectionRefs.current[id] = el
    },
    []
  )

  const handleNavigate = useCallback((id: string) => {
    const el = sectionRefs.current[id]
    const container = centerRef.current
    if (el && container) {
      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop
      container.scrollTo({ top: Math.max(top - 12, 0), behavior: 'smooth' })
    }
    setActiveSection(id)
  }, [])

  useEffect(() => {
    const container = centerRef.current
    if (!container) return

    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top
      let current = NAV_SECTIONS[0].id
      for (const section of NAV_SECTIONS) {
        const el = sectionRefs.current[section.id]
        if (!el) continue
        if (el.getBoundingClientRect().top - containerTop <= 48) {
          current = section.id
        }
      }
      setActiveSection(current)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setShowMoreMenu(false)
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreMenu])

  return (
    <div className="flex h-full flex-col">
      {/* Primary nav — back, customer name + tabs centered */}
      <div className="relative h-[48px] shrink-0">
        {/* Left section — back button, customer name */}
        <div className="absolute bottom-0 left-6 flex items-center gap-3 pb-[7px]">
          <button
            type="button"
            onClick={goToWorkbench}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100"
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

        {/* Center section — tabs centered on the full width */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <TrapezoidalTabs
            tabs={INVOICE_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            compact
          />
        </div>
        <div className="absolute bottom-0 left-6 right-4 h-px bg-brand-navy" />
      </div>

      {/* Secondary nav + 3-grid body */}
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col px-8">
        {/* Secondary nav */}
        <div className="flex shrink-0 items-center py-3">
          <div className="flex shrink-0 items-center" style={{ width: 40 }}>
            <button
              type="button"
              onClick={() => goToAllInvoices('pioneer-systems')}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="shrink-0">
            <div className="text-[13px] font-bold uppercase tracking-[-0.25px] text-brand-navy">
              {data.invoiceId}
            </div>
            <div className="mt-0.5 text-[12px] tracking-[-0.25px] text-brand-fog">
              {data.invoiceValue}
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-orange-600"
            >
              <FileText size={16} />
              Preview Invoice
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMoreMenu(!showMoreMenu)
                }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 text-brand-navy transition-colors hover:bg-neutral-50"
              >
                <MoreHorizontal size={18} />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
                  >
                    Issue credit note
                  </button>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
                  >
                    Regenerate invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3-grid body */}
        <div className="flex min-h-0 flex-1" style={{ paddingLeft: 40 }}>
          {/* Grid 1 — in-page nav */}
          <aside className="shrink-0 pt-4" style={{ width: 180 }}>
            <InPageNav
              sections={NAV_SECTIONS}
              activeId={activeSection}
              onNavigate={handleNavigate}
            />
          </aside>

          {/* Grid 2 — content */}
          <div ref={centerRef} className="min-w-0 flex-1 overflow-y-auto pb-20 pt-12">
            <div className="mx-auto max-w-[800px] space-y-10">
              {/* Summary - Metric cards with vertical separators */}
              <section ref={setSectionRef('summary')} className="mx-auto max-w-[680px]">
                <MetricsRow metrics={data.topMetrics} />
                <div className="mt-2">
                  <MetricsRow metrics={data.bottomMetrics} />
                </div>
              </section>

              {/* Invoice Details */}
              <section ref={setSectionRef('details')} className="mx-auto max-w-[680px]">
                <SectionHeader title="Invoice Details" />
                <div className="mt-4">
                  {data.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="flex items-center border-b border-neutral-200"
                      style={{ height: 36 }}
                    >
                      <span className="w-[210px] shrink-0 text-[12px] uppercase tracking-[-0.25px] text-brand-navy">
                        {detail.label}
                      </span>
                      <span
                        className={cn(
                          'text-[14px] font-medium',
                          detail.variant === 'warning'
                            ? 'text-amber-600'
                            : 'text-brand-navy'
                        )}
                      >
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Line Items - matching ProductsPricingTable pattern */}
              <section ref={setSectionRef('line-items')}>
                <div className="mx-auto max-w-[680px]">
                  <SectionHeader title="Invoice Composition / Line Items" />
                </div>
                <div className="mt-4">
                  {/* Header */}
                  <div className="flex items-center border-b border-neutral-200 pb-2">
                    <div className="flex-1 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
                      Item
                    </div>
                    <div className="mx-3 h-5 w-px shrink-0" />
                    <div className="w-[96px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy" />
                    <div className="mx-3 h-5 w-px shrink-0" />
                    <div className="w-[60px] shrink-0 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy" />
                    <div className="mx-3 h-5 w-px shrink-0" />
                    <div className="w-[110px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
                      Unit price
                    </div>
                    <div className="w-[124px] shrink-0 text-right text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
                      Total price
                    </div>
                  </div>

                  {/* Rows */}
                  {data.lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center border-b border-neutral-100 py-1.5"
                    >
                      <div className="flex-1 text-[14px] font-medium text-brand-navy">
                        {item.name}
                      </div>
                      <div className="mx-3 h-5 w-px shrink-0 bg-neutral-200" />
                      <div className="w-[96px] shrink-0 text-[14px] text-brand-navy">
                        {item.frequency}
                      </div>
                      <div className="mx-3 h-5 w-px shrink-0 bg-neutral-200" />
                      <div className="w-[60px] shrink-0 text-[14px] text-brand-navy">
                        {item.quantity}
                      </div>
                      <div className="mx-3 h-5 w-px shrink-0 bg-neutral-200" />
                      <div className="w-[110px] shrink-0 text-right text-[14px] font-medium text-brand-navy">
                        {item.unitPrice}
                      </div>
                      <div className="w-[124px] shrink-0 text-right text-[14px] font-medium text-brand-navy">
                        {item.totalPrice}
                      </div>
                    </div>
                  ))}

                  {/* Total Row */}
                  <div className="flex items-center border-t border-neutral-200 py-3">
                    <div className="flex-1 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
                      Total
                    </div>
                    <div className="mx-3 h-5 w-px shrink-0" />
                    <div className="w-[96px] shrink-0" />
                    <div className="mx-3 h-5 w-px shrink-0" />
                    <div className="w-[60px] shrink-0" />
                    <div className="mx-3 h-5 w-px shrink-0" />
                    <div className="w-[110px] shrink-0" />
                    <div className="w-[124px] shrink-0 text-right text-[16px] font-bold text-brand-navy">
                      {data.lineItemsTotal}
                    </div>
                  </div>
                </div>

                {/* Billing Basis & Traceability */}
                <div className="mx-auto mt-6 max-w-[680px]">
                  <SectionHeader title="Billing Basis & Traceability" />
                  <div className="mt-4">
                    {data.billingBasis.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center border-b border-neutral-200"
                        style={{ height: 36 }}
                      >
                        <span className="w-[210px] shrink-0 text-[12px] uppercase tracking-[-0.25px] text-brand-navy">
                          {item.label}
                        </span>
                        <span className="text-[14px] font-medium text-brand-navy">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Activity */}
              <section ref={setSectionRef('activity')} className="mx-auto max-w-[680px]">
                <SectionHeader title="Recent Activity" />
                <div className="mt-4 space-y-3">
                  {data.activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-fog" />
                      <div>
                        <div className="text-[13px] font-medium text-brand-navy">
                          {item.action}
                        </div>
                        <div className="mt-0.5 text-[12px] text-brand-fog">
                          {item.actor} · {item.timestamp}
                        </div>
                        {item.detail && (
                          <div className="mt-0.5 text-[12px] text-brand-fog">
                            {item.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Grid 3 — comments */}
          <aside 
            className="shrink-0 overflow-y-auto pb-20 pt-12 transition-all duration-300 ease-out" 
            style={{ width: isCommentsCollapsed ? 48 : 250 }}
          >
            <CommentsPanel 
              comments={data.comments} 
              isCollapsed={isCommentsCollapsed}
              onToggleCollapse={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetailsPage
