import { useState } from 'react'
import { ExternalLink, Check, Clock, CalendarClock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  paymentSchedule,
  type PaymentScheduleItem,
} from '@/data/contractProcessingMock'

const STATUS_CONFIG = {
  paid: {
    icon: Check,
    badge: 'bg-green-50 text-green-700',
  },
  pending: {
    icon: Clock,
    badge: 'bg-amber-50 text-amber-700',
  },
  upcoming: {
    icon: CalendarClock,
    badge: 'bg-neutral-100 text-brand-fog',
    label: 'Upcoming',
  },
} as const

function parseDueDate(dateString: string): Date {
  return new Date(dateString)
}

function getDaysUntilDue(dueDate: string): number {
  const due = parseDueDate(dueDate)
  const today = new Date('2026-06-22')
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function getStatusLabel(status: PaymentScheduleItem['status'], dueDate: string): string {
  if (status === 'paid') {
    return 'Paid'
  }
  
  if (status === 'pending') {
    const daysUntil = getDaysUntilDue(dueDate)
    if (daysUntil === 0) {
      return 'Due today'
    } else if (daysUntil === 1) {
      return 'Due in 1 day'
    } else if (daysUntil > 1) {
      return `Due in ${daysUntil} days`
    } else {
      return `Overdue by ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'day' : 'days'}`
    }
  }
  
  return 'Upcoming'
}

interface PaymentScheduleProps {
  onPreviewClick: (invoiceIndex: number) => void
  tcv?: string
}

interface YearGroup {
  year: string
  items: PaymentScheduleItem[]
  totalAmount: number
  startIndex: number
}

function parseAmount(amount: string): number {
  return parseFloat(amount.replace(/[$,]/g, ''))
}

function formatAmount(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function groupByYear(items: PaymentScheduleItem[]): YearGroup[] {
  const groups: Record<string, { items: PaymentScheduleItem[]; startIndex: number }> = {}
  
  items.forEach((item, index) => {
    const yearMatch = item.period.match(/Year (\d+)/)
    const year = yearMatch ? `Year ${yearMatch[1]}` : 'Year 1'
    
    if (!groups[year]) {
      groups[year] = { items: [], startIndex: index }
    }
    groups[year].items.push(item)
  })
  
  return Object.entries(groups).map(([year, data]) => ({
    year,
    items: data.items,
    totalAmount: data.items.reduce((sum, item) => sum + parseAmount(item.amount), 0),
    startIndex: data.startIndex,
  }))
}

function QuarterlyItem({
  item,
  isLast,
  onPreviewClick,
  invoiceIndex,
}: {
  item: PaymentScheduleItem
  isLast: boolean
  onPreviewClick: (invoiceIndex: number) => void
  invoiceIndex: number
}) {
  const config = STATUS_CONFIG[item.status]
  const StatusIcon = config.icon
  const quarterMatch = item.period.match(/Q(\d+)/)
  const quarter = quarterMatch ? `Q${quarterMatch[1]}` : item.period
  const statusLabel = getStatusLabel(item.status, item.dueDate)

  return (
    <div className="relative flex items-start">
      <div className="relative z-10 flex w-5 shrink-0 justify-center pt-[7px] pointer-events-none">
        <div className="h-1.5 w-1.5 rounded-full bg-brand-navy/40" />
      </div>

      {!isLast && (
        <div
          className="pointer-events-none absolute left-[9px] top-[13px] w-px bg-brand-navy/15"
          style={{ bottom: -6 }}
        />
      )}

      <button
        type="button"
        onClick={() => onPreviewClick(invoiceIndex)}
        className="group ml-3 flex flex-1 cursor-pointer items-start justify-between gap-4 border-b border-transparent pt-0.5 pb-1.5 text-left transition-colors hover:border-neutral-200"
      >
        <div>
          <p className="text-[12px] text-brand-fog">{item.dueDate}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[14px] font-medium text-brand-navy">{quarter}</span>
            <span className="flex items-center gap-1 text-[12px] font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
              Preview invoice
              <ExternalLink size={12} />
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 pt-[2px]">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', config.badge)}>
            <StatusIcon size={10} />
            {statusLabel}
          </span>
          <span className="text-[14px] font-semibold text-brand-navy">{item.amount}</span>
        </div>
      </button>
    </div>
  )
}

function YearAccordion({
  group,
  isExpanded,
  onToggle,
  onPreviewClick,
  isLast,
}: {
  group: YearGroup
  isExpanded: boolean
  onToggle: () => void
  onPreviewClick: (invoiceIndex: number) => void
  isLast: boolean
}) {
  return (
    <div className="relative">
      {/* Vertical connector line extending to next year */}
      {!isLast && (
        <div
          className="pointer-events-none absolute left-[25px] top-[18px] w-px bg-neutral-300 z-0"
          style={{ height: 'calc(100% + 12px)' }}
        />
      )}
      
      <div className="relative rounded-lg border border-brand-navy overflow-hidden transition-all">
        <button
          type="button"
          onClick={onToggle}
          className="relative z-10 w-full flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-neutral-50 bg-white"
        >
          <div className="flex items-center gap-3">
            <ChevronDown
              size={18}
              className={cn(
                'text-blue-700 transition-transform duration-200 shrink-0',
                isExpanded && 'rotate-180'
              )}
            />
            <div>
              <span className="text-[15px] font-semibold text-brand-navy">{group.year}</span>
              <span className="ml-2 text-[12px] text-brand-fog">
                {group.items.length} {group.items.length === 1 ? 'payment' : 'payments'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[16px] font-bold text-brand-navy">{formatAmount(group.totalAmount)}</span>
          </div>
        </button>

        {isExpanded && (
          <div className="relative z-10 border-t border-brand-navy bg-white px-4 py-2">
            <div className="space-y-2">
              {group.items.map((item, idx) => (
                <QuarterlyItem
                  key={item.id}
                  item={item}
                  isLast={idx === group.items.length - 1}
                  onPreviewClick={onPreviewClick}
                  invoiceIndex={group.startIndex + idx}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function PaymentSchedule({ onPreviewClick, tcv }: PaymentScheduleProps) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set(['Year 1']))
  const yearGroups = groupByYear(paymentSchedule)

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) {
        next.delete(year)
      } else {
        next.add(year)
      }
      return next
    })
  }

  return (
    <div>
      <div className="space-y-3">
        {yearGroups.map((group, idx) => (
          <YearAccordion
            key={group.year}
            group={group}
            isExpanded={expandedYears.has(group.year)}
            onToggle={() => toggleYear(group.year)}
            onPreviewClick={onPreviewClick}
            isLast={idx === yearGroups.length - 1}
          />
        ))}
      </div>

      {/* TCV Row */}
      {tcv && (
        <div className="mt-6 flex items-center justify-end gap-3 pr-4">
          <span className="text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
            Total Contract Value (TCV)
          </span>
          <span className="text-[16px] font-bold text-brand-navy">
            {tcv}
          </span>
        </div>
      )}
    </div>
  )
}

export default PaymentSchedule
