import { cn, formatRelativeToNow } from '@/lib/utils'

interface ContractSummaryHeadlineProps {
  contractValue: string
  termMonths: number
  effectiveDate: string
  customerName: string
  lineItemsSummary?: string
  /** Defaults to new-deal phrasing; use amendment for mid-cycle changes */
  variant?: 'new-deal' | 'amendment'
  className?: string
}

export function ContractSummaryHeadline({
  contractValue,
  termMonths,
  effectiveDate,
  customerName,
  lineItemsSummary,
  variant = 'new-deal',
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
      {variant === 'amendment' ? (
        <>
          Pioneer Systems&apos; contract is expanding in 2 months — Growth seats increase from{' '}
          <span className="font-bold">50 → 75</span>, adding{' '}
          <span className="font-bold">$32,000 ARR</span> (Total ARR: $193,500 → $225,500).
          Contract term is unchanged, still ending Apr 30, 2029.
        </>
      ) : (
        <>
          A <span className="font-bold">{contractValue}</span>, {termMonths} month contract with{' '}
          <span className="whitespace-nowrap">{customerName}</span>
          {startingPhrase ? ` starting ${startingPhrase}` : ''}
          {lineItemsSummary ? ` ${lineItemsSummary}` : ''}.
        </>
      )}
    </h2>
  )
}
