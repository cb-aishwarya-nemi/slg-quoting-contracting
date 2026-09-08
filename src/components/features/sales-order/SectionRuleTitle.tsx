import type { ElementType, ReactNode } from 'react'

export function SectionRuleTitle({
  children,
  as: Tag = 'h2',
  afterTitle,
  trailing,
}: {
  children: ReactNode
  as?: ElementType
  /** Sits immediately after the label, before the rule. */
  afterTitle?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <Tag className="shrink-0 text-[12px] font-semibold uppercase tracking-[-0.25px] text-brand-navy">
        {children}
      </Tag>
      {afterTitle}
      <div className="h-px flex-1 bg-brand-navy" aria-hidden />
      {trailing}
    </div>
  )
}
