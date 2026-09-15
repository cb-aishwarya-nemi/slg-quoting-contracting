import { cn } from '@/lib/utils'

const TONE_STYLES = {
  default: { solid: 'bg-blue-500 ring-blue-500', outline: 'border-blue-500 text-blue-600' },
  positive: { solid: 'bg-green-600 ring-green-600', outline: 'border-green-600 text-green-700' },
  critical: { solid: 'bg-red-600 ring-red-600', outline: 'border-red-500 text-red-600' },
} as const

/**
 * Contract-version disc — v1 the original, v2+ amendments.
 * `solid` reads as signed, `outline` as scheduled but not yet in effect.
 */
export function VersionMark({
  version,
  tone = 'default',
  variant = 'solid',
  className,
}: {
  version: string
  tone?: keyof typeof TONE_STYLES
  variant?: 'solid' | 'outline'
  className?: string
}) {
  const isSolid = variant === 'solid'
  return (
    <span
      className={cn(
        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold leading-none tracking-[-0.3px]',
        isSolid ? 'text-white ring-1' : 'border bg-white',
        TONE_STYLES[tone][isSolid ? 'solid' : 'outline'],
        className
      )}
    >
      {version}
    </span>
  )
}

export default VersionMark
