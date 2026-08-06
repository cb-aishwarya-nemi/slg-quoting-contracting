import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { TrapezoidalTabs, type TabItem } from '@/components/ui/TrapezoidalTabs'
import { useNavigation } from '@/context/NavigationContext'
import { useUseCase, usePageUseCase } from '@/context/UseCaseContext'
import { salesOrders, getSalesOrderById } from '@/data/salesOrderMock'
import {
  SalesOrderDetails,
  BillingScheduleDetails,
  UsageDetails,
} from '@/components/features/sales-order'
import {
  ASK_CHAT_RAIL_WIDTH,
  SalesOrderAskChatPanel,
  getAskSuggestions,
  type AskChatTurn,
} from '@/components/features/sales-order/SalesOrderAskChatPanel'
import { cn } from '@/lib/utils'

export interface SectionOffset {
  top: number
  height: number
}

const C360_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'threads', label: 'Threads' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'sales-order', label: 'Sales Order' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'usage', label: 'Entitlements/Usage' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'collections', label: 'Collections' },
  { id: 'revrec', label: 'Revrec' },
]

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[1560px] flex-1 items-center justify-center px-12">
      <p className="text-[14px] text-brand-fog">{label} will appear here.</p>
    </div>
  )
}

export function Customer360Page() {
  const { view, goToCustomers, goToSalesOrders } = useNavigation()
  const { setActivePage } = useUseCase()
  usePageUseCase('sales-order-details')
  const [activeTab, setActiveTab] = useState('sales-order')
  const [usageFocusFeatureId, setUsageFocusFeatureId] = useState<string | null>(null)
  const [activeSalesOrderId, setActiveSalesOrderId] = useState<string>(salesOrders[0].id)
  const [askChatOpen, setAskChatOpen] = useState(false)
  const [askChatTurns, setAskChatTurns] = useState<AskChatTurn[]>([])

  useEffect(() => {
    setAskChatOpen(false)
    setAskChatTurns([])
  }, [activeSalesOrderId, activeTab])

  const appendAskTurn = useCallback((prompt: string) => {
    setAskChatTurns((prev) => [
      ...prev,
      { id: `turn-${Date.now()}-${prev.length}`, prompt },
    ])
  }, [])

  const openAskChat = useCallback(
    (prompt: string) => {
      appendAskTurn(prompt)
      setAskChatOpen(true)
    },
    [appendAskTurn],
  )

  const closeAskChat = useCallback(() => {
    setAskChatOpen(false)
  }, [])

  const activeSalesOrder = useMemo(
    () => getSalesOrderById(activeSalesOrderId),
    [activeSalesOrderId],
  )

  const cameFromSalesOrders =
    view.name === 'customer360' && view.returnTo === 'salesOrders'
  const handleBack = cameFromSalesOrders ? goToSalesOrders : goToCustomers
  const backLabel = cameFromSalesOrders ? 'Back to sales orders' : 'Back to customers'

  useEffect(() => {
    setActivePage(activeTab === 'sales-order' ? 'sales-order-details' : 'customer360')
  }, [setActivePage, activeTab])

  useEffect(() => {
    if (view.name !== 'customer360') return
    if (view.tab) setActiveTab(view.tab)
    if (view.salesOrderId) setActiveSalesOrderId(view.salesOrderId)
  }, [view])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Ask Apex — full-height left column, sibling to customer chrome (not under it) */}
      <aside
        className="relative shrink-0 overflow-hidden bg-transparent transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: askChatOpen && activeTab === 'sales-order' ? ASK_CHAT_RAIL_WIDTH : 0,
        }}
        aria-hidden={!(askChatOpen && activeTab === 'sales-order')}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex h-full flex-col transition-opacity duration-300',
            askChatOpen && activeTab === 'sales-order' ? 'opacity-100 delay-150' : 'opacity-0',
          )}
          style={{ width: ASK_CHAT_RAIL_WIDTH }}
        >
          {askChatTurns.length > 0 && (
            <SalesOrderAskChatPanel
              turns={askChatTurns}
              customerName={activeSalesOrder.customerName}
              suggestions={getAskSuggestions()}
              onAsk={appendAskTurn}
              onClose={closeAskChat}
            />
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Primary nav */}
        <div className="relative h-[60px] shrink-0">
          <div className="absolute left-6 bottom-1 flex flex-col justify-end">
            <button
              type="button"
              onClick={handleBack}
              className="mb-0 flex cursor-pointer items-center gap-0.5 text-brand-fog transition-colors hover:text-brand-navy"
            >
              <ChevronLeft size={12} />
              <span className="text-[10px] font-medium uppercase tracking-[0]">
                {backLabel}
              </span>
            </button>
            <div className="flex items-center gap-3">
              <h1
                className="font-heading text-[16px] font-semibold text-brand-navy"
                style={{ letterSpacing: '-0.5px' }}
              >
                {activeSalesOrder.customerName}
              </h1>
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <TrapezoidalTabs
              tabs={C360_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              compact
            />
          </div>

          <div className="absolute bottom-0 left-6 right-4 h-px bg-brand-navy" />
        </div>

        {/* Sales Order tab — in-frame read-only details */}
        {activeTab === 'sales-order' && (
          <SalesOrderDetails
            order={activeSalesOrder}
            orders={salesOrders}
            activeOrderId={activeSalesOrderId}
            onSelectOrder={setActiveSalesOrderId}
            externalChat
            chatOpen={askChatOpen}
            chatTurns={askChatTurns}
            onOpenChat={openAskChat}
            onAppendChat={appendAskTurn}
            onCloseChat={closeAskChat}
            onViewEntitlements={() => {
              setUsageFocusFeatureId(null)
              setActiveTab('usage')
            }}
          />
        )}

        {/* Billing schedule tab — Year 1 summary */}
        {activeTab === 'schedule' && (
          <BillingScheduleDetails
            order={activeSalesOrder}
            onViewUsageDetails={(featureId) => {
              setUsageFocusFeatureId(featureId ?? null)
              setActiveTab('usage')
            }}
          />
        )}

        {/* Usage tab — feature usage details */}
        {activeTab === 'usage' && (
          <UsageDetails
            order={activeSalesOrder}
            initialFeatureId={usageFocusFeatureId}
          />
        )}

        {/* Other tabs (including Tasks) — simple placeholders */}
        {activeTab !== 'sales-order' &&
          activeTab !== 'schedule' &&
          activeTab !== 'usage' && (
            <TabPlaceholder
              label={C360_TABS.find((t) => t.id === activeTab)?.label ?? 'Content'}
            />
          )}
      </div>
    </div>
  )
}

export default Customer360Page
