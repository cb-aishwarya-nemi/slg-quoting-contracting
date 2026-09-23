import { useRef, useState, type ReactNode } from 'react'
import { ChevronDown, FilePenLine, MessageCircleMore, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommentsPanel, GradientSparkle, SectionHeader } from '@/components/features/contract-processing'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { SecondaryNavSwitcher, type SwitcherItem } from '@/components/ui/SecondaryNavSwitcher'
import {
  pioneerOverdueBillingSchedule,
  pioneerSalesOrder,
  salesOrders,
  type ActivityItem,
  type SalesOrderRampPeriod,
} from '@/data/salesOrderMock'
import { SalesOrderHeaderTimeline } from './SalesOrderHeaderTimeline'
import { BillingScheduleTimeline } from './BillingScheduleTimeline'
import { UpcomingRampsSection } from './UpcomingRampsSection'

const RAMP_PERIODS: SalesOrderRampPeriod[] = [
  ...(pioneerSalesOrder.productPeriods ?? []),
  {
    id: 'so-period-3',
    label: 'Period 3',
    startDate: '1 May 2028',
    endDate: '30 Apr 2029',
    items: [
      { id: 'so-p3-1', name: 'Apex platform - growth services', frequency: 'Yearly', quantity: '75', unitPrice: '$2,748.00', totalPrice: '$206,100.00', rampPriceChange: 7, unitPriceDiff: '+$180.00' },
      { id: 'so-p3-2', name: 'Premium support SLA', frequency: 'Yearly', quantity: '01', unitPrice: '$13,739.00', totalPrice: '$13,739.00' },
      { id: 'so-p3-3', name: 'Sandbox environments', frequency: 'Yearly', quantity: '04', unitPrice: '$1,717.00', totalPrice: '$6,868.00', quantityChange: 1 },
    ],
  },
]

const ACTIVITY: ActivityItem[] = pioneerSalesOrder.activity.map((item) =>
  item.label === 'Sales order created' ? { ...item, label: 'Subscription created' } : item
)

function Metric({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="min-w-0 flex-1 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-brand-fog">{label}</p>
      <div className="mt-1 text-[15px] font-semibold text-brand-navy">{value}</div>
      {sub && <p className="mt-0.5 text-[12px] text-brand-fog">{sub}</p>}
    </div>
  )
}

function MetricRow({ children }: { children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children]
  return (
    <div className="flex">
      {items.map((child, idx) => (
        <div key={idx} className="flex flex-1 items-start">
          {child}
          {idx < items.length - 1 && <div className="mx-4 h-12 w-px self-center bg-neutral-200" />}
        </div>
      ))}
    </div>
  )
}

function FieldRow({
  label,
  children,
  labelClassName = 'text-brand-fog',
  valueClassName = 'text-blue-700',
  dense = false,
}: {
  label: string
  children: ReactNode
  labelClassName?: string
  valueClassName?: string
  dense?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-6 border-b border-neutral-200', dense ? 'py-1.5' : 'py-2.5')}>
      <span
        className={cn(
          'w-[148px] shrink-0 text-[11px] font-medium uppercase tracking-wider',
          labelClassName
        )}
      >
        {label}
      </span>
      <div className={cn('min-w-0 flex-1 text-[14px] font-medium', valueClassName)}>{children}</div>
    </div>
  )
}

const ITEM_GRID = 'grid grid-cols-[minmax(0,1.6fr)_120px_110px_120px_140px] items-center'
const ITEM_ROW = 'grid grid-cols-[minmax(0,1.6fr)_120px_110px_120px_140px] border-b border-neutral-200'
const ITEM_SEP = 'flex items-center self-stretch border-l border-neutral-200 pl-3'

function SubscriptionItemsTable() {
  return (
    <div>
      <div className="border-t border-brand-navy">
        <div
          className={cn(
            ITEM_GRID,
            'border-b border-neutral-200 py-2 text-[11px] font-medium uppercase tracking-wider text-brand-navy'
          )}
        >
          <span>Items</span>
          <span>Frequency</span>
          <span>Quantity</span>
          <span className="pr-3 text-right">Unit price</span>
          <span className="text-right">Total price</span>
        </div>

        <div className={ITEM_ROW}>
          <span className="flex min-w-0 items-center gap-2 py-2.5 pr-4">
            <span className="truncate text-[14px] font-medium text-blue-700">
              Wi-fi Authentication EUR Monthly
            </span>
            <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-brand-fog">
              Price override
            </span>
          </span>
          <span className={cn(ITEM_SEP, 'text-[14px] font-medium text-brand-navy')}>Monthly</span>
          <span className={cn(ITEM_SEP, 'text-[14px] text-brand-navy')}>32</span>
          <span className={cn(ITEM_SEP, 'justify-end pr-3 text-[14px] text-brand-navy')}>7,26 €</span>
          <span className={ITEM_SEP} />
        </div>

        <div className={ITEM_ROW}>
          <span className="flex items-center py-2.5 text-[14px] text-brand-navy">
            <span className="font-semibold uppercase tracking-[-0.25px]">Coupons:</span> 20% off applied
          </span>
          <span className={ITEM_SEP} />
          <span className={ITEM_SEP} />
          <span className={cn(ITEM_SEP, 'justify-end pr-3 text-[14px] text-brand-navy')}>7,48 €</span>
          <span className={cn(ITEM_SEP, 'justify-end text-[14px] font-medium text-brand-navy')}>239,36 €</span>
        </div>

        <div className={ITEM_ROW}>
          <span className="flex items-center py-2.5 text-[14px] text-brand-navy">
            <span className="font-semibold uppercase tracking-[-0.25px]">Addon:</span>{' '}
            <span className="font-medium text-blue-700">access_points_2 EUR Monthly</span>
          </span>
          <span className={cn(ITEM_SEP, 'text-[14px] font-medium text-brand-navy')}>Monthly</span>
          <span className={cn(ITEM_SEP, 'text-[14px] text-brand-navy')}>1</span>
          <span className={cn(ITEM_SEP, 'justify-end pr-3 text-[14px] text-brand-navy')}>6,05 €</span>
          <span className={cn(ITEM_SEP, 'justify-end text-[14px] font-medium text-brand-navy')}>6,05 €</span>
        </div>
      </div>
      <p className="mt-3 text-right text-[12px] text-brand-fog">Amount does not include discounts</p>
    </div>
  )
}

function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <div key={item.id} className="relative flex items-start">
            <div className="relative z-10 flex w-5 shrink-0 justify-center pt-[6px]">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-navy/40" />
            </div>
            {!isLast && (
              <div
                className="pointer-events-none absolute left-[9px] top-[12px] w-px bg-brand-navy/15"
                style={{ bottom: -6 }}
              />
            )}
            <div className="ml-3 flex-1 pb-4">
              <p className="text-[12px] text-brand-fog">{item.date}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[14px] font-medium text-brand-navy">{item.label}</span>
                {item.refId && (
                  <a className="cursor-pointer text-[13px] text-blue-700 hover:underline">
                    {item.refId}
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CollapsibleSection({
  title,
  commentCount,
  trailing,
  children,
}: {
  title: string
  commentCount?: number
  trailing?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-3 text-left"
        aria-expanded={open}
      >
        <span className="shrink-0 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
          {title}
        </span>
        <div className="flex-1" />
        {open && trailing && (
          <div
            className="shrink-0"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {trailing}
          </div>
        )}
        {commentCount !== undefined && commentCount > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-brand-navy px-2 py-0.5 text-[11px] font-medium text-brand-navy">
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </span>
        )}
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-brand-fog transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  )
}

export function SubscriptionRecord() {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const [showCommentAddNote, setShowCommentAddNote] = useState(false)
  const [activeOrderId, setActiveOrderId] = useState(pioneerSalesOrder.id)

  const switcherItems: SwitcherItem[] = salesOrders.slice(0, 2).map((o, index) => ({
    id: o.id,
    label: o.totalContractValue,
    taskType: index === 0 ? 'Sub-123J347809KUQO' : 'Sub-456K891234MNOP',
    status: 'Active',
    customer: o.customerName,
  }))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center px-12 py-3">
        <div className="flex items-center gap-2">
          <SecondaryNavSwitcher
            items={switcherItems}
            activeId={activeOrderId}
            onSelect={setActiveOrderId}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold tracking-[-0.25px] text-brand-navy">
                Sub-123J347809KUQO
              </span>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[-0.25px] text-green-700">
                Active
              </span>
            </div>
            <p className="mt-0.5 text-[12px] tracking-[-0.25px] text-brand-fog">
              {pioneerSalesOrder.customerName} · {pioneerSalesOrder.totalContractValue} · Created{' '}
              {pioneerSalesOrder.createdOn}
            </p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <FilePenLine size={15} />
            Edit subscription
          </button>
          <div className="relative">
            <button
              ref={moreButtonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMoreMenu((prev) => !prev)
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
            >
              <MoreHorizontal size={15} />
              More
            </button>
            <AnchoredMenu
              isOpen={showMoreMenu}
              onClose={() => setShowMoreMenu(false)}
              anchorRef={moreButtonRef}
              align="end"
              className="min-w-[180px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
              >
                Download
              </button>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-[13px] text-brand-navy hover:bg-neutral-50"
              >
                Cancel subscription
              </button>
            </AnchoredMenu>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-12 pb-20 pt-6">
        <div className="mx-auto max-w-[1040px] space-y-12">
          <section>
            <div className="mb-3 flex items-center gap-1.5">
              <GradientSparkle size={16} />
              <span className="text-[13px] font-semibold uppercase tracking-[-0.25px] ai-gradient-text">
                Summary
              </span>
            </div>
            <h2 className="max-w-[760px] font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
              Pioneer Systems is 11 months into a 36-month, $492,000.00 contract covering 5 line
              items — Growth services (50 seats), Onboarding &amp; Training, and more.
            </h2>
            <div className="mt-6">
              <MetricRow>
                <Metric label="TCV" value="$492,000.00" />
                <Metric label="ARR" value="$164,000.00" />
                <Metric label="Accrued" value="$21,000.00" />
                <Metric label="Next billing" value="Aug 17, 2026" sub="in 30 days" />
              </MetricRow>
              <MetricRow>
                <Metric
                  label="Contract term"
                  value="May 1, 2026 – Apr 30, 2029"
                  sub="36 months · 3 years remaining"
                />
                <Metric label="Renewal" value="Manual · Jul 2029" />
                <Metric
                  label="Signed contract"
                  value={
                    <span className="text-[15px] font-semibold text-blue-700">MSA_2016_PS_001.pdf</span>
                  }
                />
                <Metric label="Amendments" value="None" />
              </MetricRow>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader title="Contract lifecycle" hideLine />
            <SalesOrderHeaderTimeline
              orderId={pioneerSalesOrder.id}
              variant="minimal"
              showHeading={false}
            />
          </section>

          <section className="w-1/2">
            <FieldRow dense label="Status" labelClassName="text-brand-navy" valueClassName="font-semibold uppercase text-green-700">
              Active
            </FieldRow>
            <FieldRow dense label="Channel" labelClassName="text-brand-navy" valueClassName="uppercase text-brand-navy">
              Web
            </FieldRow>
            <FieldRow dense label="Product family" labelClassName="text-brand-navy" valueClassName="text-blue-700">
              Eleven-software
            </FieldRow>
            <FieldRow dense label="Subscription ID" labelClassName="text-brand-navy" valueClassName="text-brand-navy">
              Azq5tIVJfzvJw50
            </FieldRow>
            <FieldRow dense label="Currency" labelClassName="text-brand-navy" valueClassName="uppercase text-brand-navy">
              EUR
            </FieldRow>
            <FieldRow dense label="Frequency" labelClassName="text-brand-navy" valueClassName="text-brand-navy">
              Billed Monthly
            </FieldRow>
            <FieldRow dense label="Coupons" labelClassName="text-brand-navy" valueClassName="text-blue-700">
              20% Off (Forever)
            </FieldRow>
          </section>

          <section>
            <SubscriptionItemsTable />
          </section>

          <section>
            <div className="border-t border-brand-navy">
              <div className="flex items-center border-b border-neutral-200 py-2.5">
                <span className="w-[180px] shrink-0 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
                  Entitlements
                </span>
                <button
                  type="button"
                  className="w-[180px] shrink-0 cursor-pointer text-left text-[14px] font-medium text-blue-700 hover:underline"
                >
                  Add
                </button>
                <span className="ml-auto text-right text-[13px] text-brand-fog">
                  Get started by creating your first feature.
                </span>
              </div>
            </div>
          </section>

          <section>
            <UpcomingRampsSection items={pioneerSalesOrder.products} periods={RAMP_PERIODS} />
          </section>

          <section>
            <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
              Billing schedule
            </h2>
            <div className="mt-4 max-w-[780px]">
              <BillingScheduleTimeline
                items={pioneerOverdueBillingSchedule}
                tcv={pioneerSalesOrder.totalContractValue}
              />
            </div>
          </section>

          <section className="w-3/4">
            <FieldRow dense label="Invoices" labelClassName="text-brand-navy" valueClassName="text-brand-navy">
              <span className="flex w-full items-center gap-x-2.5 whitespace-nowrap">
                <span className="font-semibold">196,29 € EUR</span>
                <button type="button" className="cursor-pointer text-blue-700 hover:underline">
                  #4789
                </button>
                <span className="font-semibold uppercase text-green-700">Paid</span>
                <span>15-July-2026</span>
                <button type="button" className="ml-auto cursor-pointer text-blue-700 hover:underline">
                  +35 past invoices
                </button>
              </span>
            </FieldRow>
            <FieldRow dense label="Transactions" labelClassName="text-brand-navy" valueClassName="text-brand-navy">
              <span className="flex w-full items-center gap-x-2.5 whitespace-nowrap">
                <span className="font-semibold uppercase text-green-700">Success</span>
                <span>VISA (**** **** **** 1111)</span>
                <span className="inline-flex h-3.5 items-center bg-blue-100 px-1 text-[8px] font-bold italic text-blue-700">
                  VISA
                </span>
                <span>15-July-2026</span>
                <button type="button" className="ml-auto cursor-pointer text-blue-700 hover:underline">
                  +35 more
                </button>
              </span>
            </FieldRow>
            <FieldRow dense label="Events" labelClassName="text-brand-navy" valueClassName="text-brand-navy">
              <span className="flex w-full items-center gap-x-2.5 whitespace-nowrap">
                <span className="font-semibold">Not Configured</span>
                <span>Subscription renewal reminder</span>
                <span>15-July-2026</span>
                <button type="button" className="ml-auto cursor-pointer text-blue-700 hover:underline">
                  +35 more
                </button>
              </span>
            </FieldRow>
            <FieldRow dense label="Quotes" labelClassName="text-brand-navy" valueClassName="text-blue-700">
              <button type="button" className="cursor-pointer hover:underline">
                Add
              </button>
            </FieldRow>
            <FieldRow dense label="Credit notes" labelClassName="text-brand-navy" valueClassName="text-brand-navy">
              -
            </FieldRow>
          </section>

          <section>
            <CollapsibleSection
              title="Comments"
              commentCount={pioneerSalesOrder.comments.length}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowCommentAddNote((prev) => !prev)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors',
                    showCommentAddNote
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-blue-700 hover:bg-blue-50'
                  )}
                >
                  <MessageCircleMore size={14} />
                  Add note
                </button>
              }
            >
              <CommentsPanel
                comments={pioneerSalesOrder.comments}
                hideHeader
                dense
                showAddNote={showCommentAddNote}
                onShowAddNoteChange={setShowCommentAddNote}
              />
            </CollapsibleSection>
          </section>

          <section>
            <CollapsibleSection title="Activity">
              <ActivityTimeline items={ACTIVITY} />
            </CollapsibleSection>
          </section>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionRecord
