import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, X, ArrowDown, Send } from 'lucide-react'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase } from '@/context/UseCaseContext'
import { contractProcessing, sectionSources } from '@/data/contractProcessingMock'
import {
  SectionHeader,
  LabelValueList,
  ProductsPricingTable,
  InvoicePreview,
  InPageNav,
  CommentsPanel,
  SectionSourceThumbnails,
  SourcePreviewDrawer,
  type NavSection,
} from '@/components/features/contract-processing'

const C360_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'threads', label: 'Threads' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'collections', label: 'Collections' },
  { id: 'revrec', label: 'Revrec' },
]

const NAV_SECTIONS: NavSection[] = [
  { id: 'summary', label: 'Summary', status: 'ai' },
  { id: 'account', label: 'Account', status: 'ready' },
  { id: 'addresses', label: 'Addresses', status: 'ready' },
  { id: 'terms', label: 'Terms and billing', status: 'ready' },
  { id: 'products', label: 'Products and pricing', status: 'attention' },
  { id: 'invoice', label: 'Invoice preview', status: 'neutral' },
]

function StatusUnit({ status }: { status: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 transition-colors hover:bg-blue-100"
    >
      <span className="text-[13px] text-brand-navy">Status:</span>
      <span className="text-[13px] font-bold text-blue-700">{status}</span>
      <ArrowDown size={15} className="text-blue-700" />
    </button>
  )
}

function SendForApprovalButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-orange-600"
    >
      <Send size={16} />
      Send for approval
    </button>
  )
}

export function Customer360Page() {
  const { goToWorkbench, goToInvoiceDetails } = useNavigation()
  const { setActivePage } = useUseCase()
  const data = contractProcessing
  const [activeTab, setActiveTab] = useState('contracts')
  const [activeSection, setActiveSection] = useState('summary')
  const [flashingSection, setFlashingSection] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ sectionId: string; index: number } | null>(null)

  const centerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  // While a programmatic (click-driven) scroll is in flight, ignore the scroll
  // spy so intermediate sections don't flip the active comment back and forth
  // (which makes the comments rail shake).
  const programmaticScroll = useRef(false)
  const spyResumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Register this page with use case context
  useEffect(() => {
    setActivePage('customer360')
  }, [setActivePage])

  const setSectionRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      sectionRefs.current[id] = el
    },
    []
  )

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id]
    const container = centerRef.current
    if (el && container) {
      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop
      // Lock the active section to the target and ignore the spy until the
      // smooth scroll settles, so the comments rail doesn't jitter en route.
      programmaticScroll.current = true
      if (spyResumeTimeout.current) clearTimeout(spyResumeTimeout.current)
      spyResumeTimeout.current = setTimeout(() => {
        programmaticScroll.current = false
      }, 700)
      container.scrollTo({ top: Math.max(top - 12, 0), behavior: 'smooth' })
    }
    setActiveSection(id)
  }, [])

  const handleNavigate = scrollToSection

  // Clicking a comment scrolls its linked section into view and plays the
  // gradient-sweep + icon-settle attention sequence on that section's header.
  const handleCommentJump = useCallback(
    (sectionId: string) => {
      scrollToSection(sectionId)
      if (flashTimeout.current) clearTimeout(flashTimeout.current)
      // Reset first so re-clicking the same comment restarts the animation.
      setFlashingSection(null)
      requestAnimationFrame(() => setFlashingSection(sectionId))
      flashTimeout.current = setTimeout(() => setFlashingSection(null), 2300)
    },
    [scrollToSection]
  )

  useEffect(() => () => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current)
    if (spyResumeTimeout.current) clearTimeout(spyResumeTimeout.current)
  }, [])

  // Scroll spy — highlight the in-page nav item nearest the top of the scroll area
  useEffect(() => {
    const container = centerRef.current
    if (!container) return

    const handleScroll = () => {
      if (programmaticScroll.current) return
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

    const handleScrollEnd = () => {
      if (spyResumeTimeout.current) clearTimeout(spyResumeTimeout.current)
      programmaticScroll.current = false
    }

    container.addEventListener('scroll', handleScroll)
    container.addEventListener('scrollend', handleScrollEnd)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('scrollend', handleScrollEnd)
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Primary nav — back, customer name, deal tag + Customer 360 tabs */}
      <div className="relative h-[48px] shrink-0">
        {/* Left section — back button, customer name, deal tag */}
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
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-green-700">
            {data.dealTag}
          </span>
        </div>

        {/* Center section — tabs centered on the full width */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <TrapezoidalTabs
            tabs={C360_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            compact
          />
        </div>

        <div className="absolute bottom-0 left-6 right-4 h-px bg-brand-navy" />
      </div>

      {/* Secondary nav + 3-grid body, centered within 1440 */}
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col px-8">
        {/* Secondary nav */}
        <div className="flex shrink-0 items-center py-3">
          <div className="flex shrink-0 items-center" style={{ width: 40 }}>
            <button
              type="button"
              onClick={goToWorkbench}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="shrink-0">
            <div className="text-[13px] font-bold uppercase tracking-[-0.25px] text-brand-navy">
              {data.processing.title}
            </div>
            <div className="mt-0.5 text-[12px] tracking-[-0.25px] text-brand-navy">
              {data.processing.sectionsReady} of {data.processing.sectionsTotal} sections ready
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <StatusUnit status={data.processing.status} />
            <SendForApprovalButton onClick={() => goToInvoiceDetails('INV-2026-9584')} />
          </div>
        </div>

        {/* 3-grid body */}
        <div className="flex min-h-0 flex-1" style={{ paddingLeft: 40 }}>
          {/* Grid 1 — in-page nav (aligned to the title, 20px below the secondary nav) */}
          <aside className="shrink-0 pt-4" style={{ width: 180 }}>
            <InPageNav
              sections={NAV_SECTIONS}
              sourceDocuments={data.sourceDocuments}
              activeId={activeSection}
              onNavigate={handleNavigate}
            />
          </aside>

          {/* Grid 2 — content (scrolls independently, 48px below the secondary nav).
              Wrapper is 800px wide; the table spans the full width while every other
              unit is capped at 680px and centred within it. */}
          <div ref={centerRef} className="min-w-0 flex-1 overflow-y-auto pb-20 pt-12">
            <div className="mx-auto max-w-[800px] space-y-10">
              {/* Summary */}
              <section ref={setSectionRef('summary')} className="mx-auto max-w-[680px]">
                <div className="relative">
                  {flashingSection === 'summary' && (
                    <span className="title-sweep-overlay" aria-hidden="true">
                      <span className="title-sweep-band" />
                    </span>
                  )}
                  <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.5px] text-brand-navy">
                    <span className="font-bold">Contract Value: {data.summary.contractValue}</span>
                    {data.summary.headline}
                  </h2>
                </div>
                <p className="mt-3 text-[12px] text-brand-fog">
                  Effective: {data.summary.effectiveDate}
                </p>
              </section>

              {/* Account */}
              <section ref={setSectionRef('account')} className="mx-auto max-w-[680px]">
                <SectionSourceThumbnails
                  sources={sectionSources.account}
                  onOpen={(i) => setPreview({ sectionId: 'account', index: i })}
                />
                <SectionHeader
                  title="Account"
                  status="ready"
                  statusLabel="Ready"
                  isFlashing={flashingSection === 'account'}
                />
                <div className="mt-4">
                  <LabelValueList items={data.account} />
                </div>
              </section>

              {/* Addresses */}
              <section ref={setSectionRef('addresses')} className="mx-auto max-w-[680px]">
                <SectionSourceThumbnails
                  sources={sectionSources.addresses}
                  onOpen={(i) => setPreview({ sectionId: 'addresses', index: i })}
                />
                <SectionHeader
                  title="Addresses"
                  status="ready"
                  statusLabel="Ready"
                  isFlashing={flashingSection === 'addresses'}
                />
                <div className="mt-4">
                  <LabelValueList items={data.addresses} />
                </div>
              </section>

              {/* Terms and billing */}
              <section ref={setSectionRef('terms')} className="mx-auto max-w-[680px]">
                <SectionSourceThumbnails
                  sources={sectionSources.terms}
                  onOpen={(i) => setPreview({ sectionId: 'terms', index: i })}
                />
                <SectionHeader
                  title="Terms and billing"
                  status="ready"
                  statusLabel="Ready"
                  isFlashing={flashingSection === 'terms'}
                />
                <div className="mt-4">
                  <LabelValueList items={data.termsAndBilling} />
                </div>
              </section>

              {/* Products and pricing — header capped at 680px (centred), table full 800px */}
              <section ref={setSectionRef('products')}>
                <div className="mx-auto max-w-[680px]">
                  <SectionSourceThumbnails
                    sources={sectionSources.products}
                    onOpen={(i) => setPreview({ sectionId: 'products', index: i })}
                  />
                  <SectionHeader
                    title="Products and pricing"
                    status="attention"
                    statusLabel="Resolve 2 items"
                    isFlashing={flashingSection === 'products'}
                  />
                </div>
                <div className="mt-4">
                  <ProductsPricingTable items={data.products} />
                </div>
              </section>

              {/* Invoice preview — title + unit capped at 680px, centred */}
              <section ref={setSectionRef('invoice')} className="mx-auto max-w-[680px]">
                <SectionHeader title="Invoice preview" isFlashing={flashingSection === 'invoice'} />
                <div className="mt-4">
                  <InvoicePreview />
                </div>
              </section>
            </div>
          </div>

          {/* Grid 3 — comments (scrolls independently, aligned to the primary CTA) */}
          <aside className="shrink-0 overflow-y-auto pb-20 pt-12" style={{ width: 250 }}>
            <CommentsPanel
              comments={data.comments}
              activeSectionId={activeSection}
              onCommentJump={handleCommentJump}
            />
          </aside>
        </div>
      </div>

      <SourcePreviewDrawer
        open={!!preview}
        sources={preview ? sectionSources[preview.sectionId] : []}
        activeIndex={preview?.index ?? 0}
        onIndexChange={(index) =>
          setPreview((prev) => (prev ? { ...prev, index } : null))
        }
        onClose={() => setPreview(null)}
      />
    </div>
  )
}

export default Customer360Page
