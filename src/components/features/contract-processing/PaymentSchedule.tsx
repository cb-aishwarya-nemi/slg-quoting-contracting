import { ExternalLink, Check, Clock, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  paymentSchedule,
  type PaymentScheduleItem,
} from '@/data/contractProcessingMock'

const STATUS_CONFIG = {
  paid: {
    icon: Check,
    badge: 'bg-green-50 text-green-700',
    label: 'Paid',
  },
  pending: {
    icon: Clock,
    badge: 'bg-amber-50 text-amber-700',
    label: 'Due soon',
  },
  upcoming: {
    icon: CalendarClock,
    badge: 'bg-neutral-100 text-brand-fog',
    label: 'Upcoming',
  },
} as const

interface PaymentScheduleProps {
  onPreviewClick: (invoiceIndex: number) => void
}

function TimelineNode({
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

  return (
    <div className="relative flex items-start">
      {/* Dot — sits above the button layer */}
      <div className="relative z-10 flex w-5 shrink-0 justify-center pt-[7px] pointer-events-none">
        <div className="h-1.5 w-1.5 rounded-full bg-brand-navy" />
      </div>

      {/* Connector line — absolutely bridging the gap to the next node */}
      {!isLast && (
        <div
          className="pointer-events-none absolute left-[9px] top-[13px] w-px bg-brand-navy/25"
          style={{ bottom: -6 }}
        />
      )}

      {/* Button */}
      <button
        type="button"
        onClick={() => onPreviewClick(invoiceIndex)}
        className="group ml-3 flex flex-1 cursor-pointer items-start justify-between gap-4 border-b border-transparent pt-0.5 pb-1.5 text-left transition-colors hover:border-neutral-200"
      >
        {/* Left: date, then title + hover preview label */}
        <div>
          <p className="text-[12px] text-brand-fog">{item.dueDate}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[14px] font-medium text-brand-navy">{item.period}</span>
            <span className="flex items-center gap-1 text-[12px] font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
              Preview invoice
              <ExternalLink size={12} />
            </span>
          </div>
        </div>

        {/* Right: badge + amount */}
        <div className="flex shrink-0 items-center gap-3 pt-[2px]">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', config.badge)}>
            <StatusIcon size={10} />
            {config.label}
          </span>
          <span className="text-[14px] font-semibold text-brand-navy">{item.amount}</span>
        </div>
      </button>
    </div>
  )
}

export function PaymentSchedule({ onPreviewClick }: PaymentScheduleProps) {
  return (
    <div className="space-y-3">
      {paymentSchedule.map((item, idx) => (
        <TimelineNode
          key={item.id}
          item={item}
          isLast={idx === paymentSchedule.length - 1}
          onPreviewClick={onPreviewClick}
          invoiceIndex={idx}
        />
      ))}
    </div>
  )
}

export default PaymentSchedule
