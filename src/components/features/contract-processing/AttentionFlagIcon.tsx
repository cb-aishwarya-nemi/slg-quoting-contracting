import { cn } from '@/lib/utils'

interface AttentionFlagIconProps {
  id: string
  variant?: 'gradient' | 'white' | 'navy'
  className?: string
}

const FLAG_BANNER_PATH =
  'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z'

export function AttentionFlagIcon({
  id,
  variant = 'gradient',
  className,
}: AttentionFlagIconProps) {
  const gradientId = `attention-flag-${id}`
  const paint =
    variant === 'gradient'
      ? `url(#${gradientId})`
      : variant === 'white'
        ? '#ffffff'
        : '#1c1b2e'

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff3300" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      )}
      {/* Filled banner only */}
      <path d={FLAG_BANNER_PATH} fill={paint} stroke="none" />
      {/* Banner + pole outlines */}
      <path
        d={FLAG_BANNER_PATH}
        fill="none"
        stroke={paint}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 22v-7"
        fill="none"
        stroke={paint}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
