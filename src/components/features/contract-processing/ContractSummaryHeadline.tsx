import { cn, formatRelativeToNow } from '@/lib/utils'

interface ContractSummaryHeadlineProps {
  contractValue: string
  termMonths: number
  effectiveDate: string
  customerName: string
  className?: string
}

export function ContractSummaryHeadline({
  contractValue,
  termMonths,
  effectiveDate,
  customerName,
  className,
}: ContractSummaryHeadlineProps) {
  const parsed = new Date(effectiveDate)
  const startingPhrase = isNaN(parsed.getTime()) ? null : formatRelativeToNow(parsed)

  return (
    <h2
      className={cn(
        'font-heading text-[21px] font-normal leading-[1.45] tracking-[-0.5px] text-brand-navy',
        className
      )}
    >
      A <span className="font-bold">{contractValue}</span>, {termMonths} month contract with{' '}
      <span className="whitespace-nowrap">{customerName}</span>
      {startingPhrase ? ` starting ${startingPhrase}` : ''}.
    </h2>
  )
}
