import { useState, type ReactNode } from 'react'
import { ArrowRight, Gauge, MessageCircleMore } from 'lucide-react'
import { CommentsPanel, GradientSparkle } from '@/components/features/contract-processing'
import { cn } from '@/lib/utils'
import { type BillingScheduleLine, type SalesOrder } from '@/data/salesOrderMock'
import { ReadOnlyProductsList } from './ReadOnlyProductsList'
import { featureIdFromLabel } from './UsageDetails'
import {
  ActivityTimeline,
  BillingScheduleTimeline,
  CollapsibleSection,
} from './SalesOrderCollapsedSections'

const CONTENT_MAX_WIDTH = 1040

const YEAR_1_PERIOD = {
  label: 'May 1, 2026 – Apr 30, 2027',
  sub: '12 months · 11th month running',
  nextBilling: 'Mar 31, 2027',
  nextBillingSub: 'in 2 weeks',
  yearlyValue: '$164,000.00',
  quarterlyAmount: '$41,000.00',
  installments: 4,
  monthsRemaining: 1,
}

const YEAR_1_USAGE_ROWS = [
  {
    feature: 'API calls',
    commitBalance: '3.8M',
    commitUnit: 'API calls',
    onDemandUsage: null,
    onDemandUnit: null,
    onDemandAmount: null,
    commitExceeded: false,
  },
  {
    feature: 'Image processing',
    commitBalance: '510',
    commitUnit: 'images',
    onDemandUsage: null,
    onDemandUnit: null,
    onDemandAmount: null,
    commitExceeded: false,
  },
  {
    feature: 'Storage',
    commitBalance: '0',
    commitUnit: 'GB',
    onDemandUsage: '24',
    onDemandUnit: 'GB',
    onDemandAmount: '$48.00',
    commitExceeded: true,
  },
] as const

const YEAR_1_ENTITLEMENTS = [
  { label: 'Seats', value: '50 seats', usageBased: false },
  { label: 'Environments', value: '5 sandboxes', usageBased: false },
  { label: 'API calls', value: '5M / year', usageBased: true },
  { label: 'Image processing', value: '2,400 images / year', usageBased: true },
  { label: 'Storage', value: '500 GB', usageBased: true },
] as const

/** Year 1 schedule as of the 11th month (Mar 15, 2027) — Q1–Q4 already billed. */
const YEAR_1_BILLING_SCHEDULE: BillingScheduleLine[] = [
  {
    id: 'y1-bs-q1',
    billDate: 'May 31, 2026',
    installment: 'Year 1 · Q1',
    amount: '$41,000.00',
    status: 'Paid',
    invoiceId: 'INV-2026-0042',
    dateAnnotation: '9 months ago',
  },
  {
    id: 'y1-bs-q2',
    billDate: 'Aug 31, 2026',
    installment: 'Year 1 · Q2',
    amount: '$41,000.00',
    status: 'Paid',
    invoiceId: 'INV-2026-0043',
    dateAnnotation: '6 months ago',
  },
  {
    id: 'y1-bs-q3',
    billDate: 'Nov 30, 2026',
    installment: 'Year 1 · Q3',
    amount: '$41,000.00',
    status: 'Paid',
    invoiceId: 'INV-2026-0044',
    dateAnnotation: '3 months ago',
  },
  {
    id: 'y1-bs-q4',
    billDate: 'Feb 28, 2027',
    installment: 'Year 1 · Q4',
    amount: '$41,000.00',
    status: 'Paid',
    invoiceId: 'INV-2026-0045',
    dateAnnotation: '2 weeks ago',
  },
]

type SummaryMetric = {
  label: string
  value: string
  sub?: string
}

function SummaryMetricsRow({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <div className="flex">
      {metrics.map((metric, idx) => (
        <div key={metric.label} className="flex min-w-0 flex-1 items-start">
          <div className="min-w-0 flex-1 py-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-brand-fog">
              {metric.label}
            </p>
            <p className="mt-1 truncate text-[15px] font-semibold text-brand-navy">{metric.value}</p>
            {metric.sub ? (
              <p className="mt-0.5 truncate text-[12px] text-brand-fog">{metric.sub}</p>
            ) : null}
          </div>
          {idx < metrics.length - 1 && (
            <div className="mx-4 h-12 w-px shrink-0 self-center bg-neutral-200" />
          )}
        </div>
      ))}
    </div>
  )
}

function Year1Summary() {
  const metrics: SummaryMetric[] = [
    {
      label: 'Schedule period',
      value: YEAR_1_PERIOD.label,
      sub: YEAR_1_PERIOD.sub,
    },
    {
      label: 'Accrued',
      value: '$1,240.00',
      sub: 'Unbilled on-demand usage',
    },
    {
      label: 'Next billing',
      value: YEAR_1_PERIOD.nextBilling,
      sub: YEAR_1_PERIOD.nextBillingSub,
    },
  ]

  return (
    <section>
      <div className="mb-3 flex items-center gap-1.5">
        <GradientSparkle size={16} />
        <span className="text-[13px] font-semibold tracking-[-0.25px] ai-gradient-text">
          Summary
        </span>
      </div>
      <h2 className="font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.25px] text-brand-navy">
        Year 1 is in its 11th month — {YEAR_1_PERIOD.yearlyValue} billed quarterly at{' '}
        {YEAR_1_PERIOD.quarterlyAmount}
      </h2>
      <p className="mt-3 max-w-[820px] text-[13px] leading-[1.65] text-brand-navy">
        This schedule period runs {YEAR_1_PERIOD.label} with {YEAR_1_PERIOD.installments}{' '}
        quarterly installments. You&apos;re in the 11th month of 12, with{' '}
        {YEAR_1_PERIOD.monthsRemaining} month remaining before Year 2 ramps. All four Year 1
        fixed invoices are paid. $1,240.00 in on-demand usage has accrued and will bill on{' '}
        {YEAR_1_PERIOD.nextBilling} ({YEAR_1_PERIOD.nextBillingSub}). After this period closes,
        seats and platform pricing step up in the Year 2 ramp.
      </p>
      <div className="mt-8">
        <SummaryMetricsRow metrics={metrics} />
      </div>
    </section>
  )
}

function UsageSummaryTable({
  onSelectFeature,
}: {
  onSelectFeature?: (featureLabel: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center border-b border-neutral-200 px-3 pb-2 pt-3">
        <div className="text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Feature
        </div>
        <div className="text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Commit balance
        </div>
        <div className="text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          On-demand usage
        </div>
        <div className="w-5" aria-hidden />
      </div>
      <div>
        {YEAR_1_USAGE_ROWS.map((row, idx) => (
          <div
            key={row.feature}
            role={onSelectFeature ? 'button' : undefined}
            tabIndex={onSelectFeature ? 0 : undefined}
            onClick={() => onSelectFeature?.(row.feature)}
            onKeyDown={
              onSelectFeature
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectFeature(row.feature)
                    }
                  }
                : undefined
            }
            className={cn(
              'group row-hover-trail grid cursor-pointer grid-cols-[1fr_1fr_1fr_auto] items-center px-3 py-2.5 transition-colors hover:bg-brand-navy',
              idx < YEAR_1_USAGE_ROWS.length - 1 && 'border-b border-neutral-100 hover:border-brand-navy'
            )}
          >
            <div className="flex min-w-0 items-center gap-2 pr-4">
              <span className="truncate text-[14px] font-medium text-brand-navy transition-colors group-hover:text-white">
                {row.feature}
              </span>
              {row.commitExceeded ? (
                <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 transition-colors group-hover:bg-white/15 group-hover:text-white">
                  Commit exceeded
                </span>
              ) : null}
            </div>
            <div className="pr-4 text-[14px]">
              <span className="font-medium text-brand-navy transition-colors group-hover:text-white">
                {row.commitBalance}
              </span>
              <span className="text-[12px] text-brand-fog transition-colors group-hover:text-white/70">
                {' '}
                {row.commitUnit} available
              </span>
            </div>
            <div className="pr-4 text-[14px]">
              {row.onDemandUsage ? (
                <>
                  <span className="font-medium text-brand-navy transition-colors group-hover:text-white">
                    {row.onDemandUsage}
                  </span>
                  {row.onDemandUnit ? (
                    <span className="text-[12px] text-brand-fog transition-colors group-hover:text-white/70">
                      {' '}
                      {row.onDemandUnit}
                    </span>
                  ) : null}
                  {row.onDemandAmount ? (
                    <span className="text-[12px] text-brand-fog transition-colors group-hover:text-white/70">
                      {' '}
                      ({row.onDemandAmount})
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-[12px] text-brand-mist transition-colors group-hover:text-white/50">
                  —
                </span>
              )}
            </div>
            <ArrowRight
              size={14}
              className="shrink-0 text-white opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function EntitlementRow({
  label,
  value,
  usageBased = false,
  isLast = false,
  onClick,
}: {
  label: string
  value: ReactNode
  usageBased?: boolean
  isLast?: boolean
  onClick?: () => void
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        'group row-hover-trail relative flex cursor-pointer items-center px-3 py-2.5 transition-colors hover:bg-brand-navy',
        !isLast && 'border-b border-neutral-100 hover:border-brand-navy'
      )}
    >
      <span className="flex w-[200px] shrink-0 items-center gap-1.5 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy transition-colors group-hover:text-white">
        {label}
        {usageBased && (
          <Gauge
            size={13}
            strokeWidth={2}
            className="shrink-0 text-brand-fog transition-colors group-hover:text-white/70"
            aria-hidden
          />
        )}
      </span>
      <span className="min-w-0 flex-1 text-[14px] font-medium text-brand-navy transition-colors group-hover:text-white">
        {value}
      </span>
      <ArrowRight
        size={14}
        className="shrink-0 text-white opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  )
}

export function BillingScheduleDetails({
  order,
  onViewUsageDetails,
}: {
  order: SalesOrder
  onViewUsageDetails?: (featureId?: string) => void
}) {
  const year1Period = order.productPeriods?.[0]
  const [showCommentAddNote, setShowCommentAddNote] = useState(false)

  const openUsageFeature = (label: string) => {
    onViewUsageDetails?.(featureIdFromLabel(label))
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1560px] flex-1 flex-col px-12">
      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        <div className="mx-auto space-y-10 pt-12" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
          <section className="group/section">
            <Year1Summary />
          </section>

          <section className="group/section">
            <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
              Products and pricing
            </h2>
            <div className="mt-4">
              {year1Period ? (
                <ReadOnlyProductsList
                  items={year1Period.items}
                  periods={[year1Period]}
                />
              ) : (
                <ReadOnlyProductsList items={order.products} />
              )}
            </div>
          </section>

          <section className="group/section">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
                Usage summary
              </h2>
              <button
                type="button"
                onClick={() => onViewUsageDetails?.()}
                className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-blue-700 transition-colors hover:text-blue-800"
              >
                View details
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="mt-4">
              <UsageSummaryTable onSelectFeature={openUsageFeature} />
            </div>
          </section>

          <section className="group/section">
            <div className="grid grid-cols-2 gap-20">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
                      Entitlements
                    </h2>
                    <span className="text-[12px] text-brand-fog">5/12</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewUsageDetails?.()}
                    className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-blue-700 transition-colors hover:text-blue-800"
                  >
                    View all
                    <ArrowRight size={14} />
                  </button>
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  {YEAR_1_ENTITLEMENTS.map((row, idx) => (
                    <EntitlementRow
                      key={row.label}
                      label={row.label}
                      value={row.value}
                      usageBased={row.usageBased}
                      isLast={idx === YEAR_1_ENTITLEMENTS.length - 1}
                      onClick={() => openUsageFeature(row.label)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="group/section">
            <h2 className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
              Billing schedule
            </h2>
            <div className="mt-4">
              <BillingScheduleTimeline items={YEAR_1_BILLING_SCHEDULE} />
            </div>
          </section>

          <section className="group/section">
            <CollapsibleSection
              title="Comments"
              outlined={false}
              commentCount={order.comments.length}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowCommentAddNote((prev) => !prev)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors',
                    showCommentAddNote ? 'bg-blue-50 text-blue-700' : 'text-blue-700 hover:bg-blue-50'
                  )}
                >
                  <MessageCircleMore size={14} />
                  Add note
                </button>
              }
            >
              {order.comments.length === 0 && !showCommentAddNote ? (
                <p className="py-4 text-[13px] text-brand-fog">No comments yet.</p>
              ) : (
                <CommentsPanel
                  comments={order.comments}
                  hideHeader
                  dense
                  showAddNote={showCommentAddNote}
                  onShowAddNoteChange={setShowCommentAddNote}
                />
              )}
            </CollapsibleSection>
          </section>

          <section className="group/section">
            <CollapsibleSection title="Activity" outlined={false}>
              <ActivityTimeline items={order.activity} />
            </CollapsibleSection>
          </section>
        </div>
      </div>
    </div>
  )
}

export default BillingScheduleDetails
